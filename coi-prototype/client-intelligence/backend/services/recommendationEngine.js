/**
 * Recommendation Engine
 * Rule-based next best action recommendations
 * Uses simple rule-based scoring (priority, timing, compliance status)
 * 
 * INVERSE COMPLIANCE: Uses compliance rules to identify SAFE opportunities
 */

import { getDatabase } from '../../../backend/src/database/init.js'
import { isClientIntelligenceEnabled } from '../../../backend/src/services/configService.js'
import { generateTriggerSignals, getClientTriggerSignals } from './triggerSignalService.js'

const db = getDatabase()

/**
 * Check if a service is allowed with client's existing services (INVERSE COMPLIANCE)
 * Uses IESBA conflict matrix to determine if service can be recommended
 * This is the "inverse" - using compliance rules to say "YES" instead of "NO"
 * 
 * INVERSE LOGIC:
 * - Traditional COI: "NO, you can't do this" (blocks)
 * - Inverse COI: "YES, you CAN do this" (enables safe opportunities)
 */
function isServiceComplianceSafe(clientId, recommendedService) {
  try {
    // Get client's existing active services
    const existingServices = db.prepare(`
      SELECT DISTINCT service_type, pie_status
      FROM coi_requests
      WHERE client_id = ? AND status IN ('Active', 'Approved')
    `).all(clientId)

    if (existingServices.length === 0) {
      // No existing services - all services are safe
      return { safe: true, status: 'compliance_safe', reason: 'No existing services - all services available' }
    }

    // Check each existing service against recommended service
    // This is the "inverse" logic - checking what IS allowed
    let hasBlockedConflict = false
    let hasFlaggedConflict = false
    let conflictReason = null
    let conflictRegulation = null

    for (const existing of existingServices) {
      const conflict = checkServiceTypeConflictForRecommendation(
        existing.service_type,
        recommendedService,
        existing.pie_status === 'Yes'
      )
      
      if (conflict) {
        if (conflict.severity === 'CRITICAL') {
          // Blocked - don't recommend
          hasBlockedConflict = true
          conflictReason = conflict.reason
          conflictRegulation = conflict.regulation
          break // Stop checking - definitely blocked
        } else if (conflict.severity === 'HIGH') {
          // Flagged - can recommend but with safeguards note
          hasFlaggedConflict = true
          conflictReason = conflict.reason
          conflictRegulation = conflict.regulation
          // Continue checking - might find a critical conflict
        }
      }
    }

    if (hasBlockedConflict) {
      // INVERSE: This service is NOT allowed - filter it out
      return {
        safe: false,
        status: 'blocked',
        reason: conflictReason,
        regulation: conflictRegulation
      }
    }

    if (hasFlaggedConflict) {
      // INVERSE: This service IS allowed but requires safeguards
      return {
        safe: true,
        status: 'requires_safeguards',
        reason: conflictReason,
        regulation: conflictRegulation,
        note: 'Requires compliance review and safeguards per IESBA'
      }
    }

    // No conflicts found - safe to recommend
    // INVERSE: This service IS allowed without restrictions
    return { 
      safe: true, 
      status: 'compliance_safe', 
      reason: 'No compliance conflicts - service is allowed',
      regulation: 'IESBA Code Section 290'
    }
  } catch (error) {
    console.error('Error checking compliance safety:', error)
    // Fail-safe: allow recommendation but flag for manual review
    return {
      safe: true,
      status: 'review_required',
      reason: 'Compliance check unavailable - manual review recommended'
    }
  }
}

/**
 * Simplified conflict check for recommendations (INVERSE COMPLIANCE LOGIC)
 * Uses same conflict matrix as COI system to determine what IS allowed
 */
function checkServiceTypeConflictForRecommendation(existingServiceType, newServiceType, isPIE) {
  // Service category mapping (matches duplicationCheckService logic)
  const getCategory = (serviceType) => {
    if (!serviceType) return null
    const service = (serviceType || '').toLowerCase()
    
    // Tax sub-types (more specific)
    if (service.includes('tax planning') || service.includes('tax advisory') || service.includes('tax strategy')) {
      return 'TAX_PLANNING'
    }
    if (service.includes('tax compliance') || service.includes('tax return') || service.includes('tax filing')) {
      return 'TAX_COMPLIANCE'
    }
    if (service.includes('tax calculation') || service.includes('transfer pricing')) {
      return 'TAX_CALCULATIONS'
    }
    
    // Main categories
    if (service.includes('audit') && !service.includes('internal')) return 'AUDIT'
    if (service.includes('advisory') || service.includes('consulting') || service.includes('management consulting')) return 'ADVISORY'
    if (service.includes('accounting') || service.includes('bookkeeping')) return 'ACCOUNTING'
    if (service.includes('valuation')) return 'VALUATION'
    if (service.includes('internal audit')) return 'INTERNAL_AUDIT'
    if (service.includes('due diligence')) return 'DUE_DILIGENCE'
    if (service.includes('it advisory') || service.includes('cybersecurity')) return 'IT_ADVISORY'
    if (service.includes('tax')) return 'TAX' // Generic tax
    
    return null
  }

  const existingCategory = getCategory(existingServiceType)
  const newCategory = getCategory(newServiceType)

  if (!existingCategory || !newCategory) {
    // Can't determine category - assume safe (manual review)
    return null
  }

  // Conflict matrix (matches duplicationCheckService.js)
  const CONFLICT_MATRIX = {
    AUDIT: {
      blocked: ['ADVISORY', 'ACCOUNTING', 'VALUATION', 'INTERNAL_AUDIT', 'TAX_PLANNING'],
      flagged: ['TAX', 'TAX_COMPLIANCE', 'TAX_CALCULATIONS', 'DUE_DILIGENCE', 'IT_ADVISORY'],
      reason: {
        ADVISORY: 'Management consulting threatens auditor independence',
        ACCOUNTING: 'Cannot audit own bookkeeping work (self-review threat)',
        VALUATION: 'Cannot audit valuations we performed (self-review threat)',
        INTERNAL_AUDIT: 'Cannot outsource internal audit function for audit client',
        TAX_PLANNING: 'Tax planning for audit client creates self-review threat - PROHIBITED',
        TAX: 'Tax services for audit client require fee cap review',
        TAX_COMPLIANCE: 'Tax compliance services require safeguards and fee cap review',
        TAX_CALCULATIONS: 'Tax calculations require safeguards and fee cap review',
        DUE_DILIGENCE: 'Due diligence may create self-review threat',
        IT_ADVISORY: 'IT systems advice may affect audit scope'
      }
    },
    ADVISORY: { 
      blocked: ['AUDIT'], 
      flagged: [],
      reason: {
        AUDIT: 'Cooling-off period required after management consulting (typically 2 years)'
      }
    },
    ACCOUNTING: { 
      blocked: ['AUDIT'], 
      flagged: [],
      reason: {
        AUDIT: 'Cannot audit financial statements we prepared (self-review threat)'
      }
    },
    VALUATION: { 
      blocked: ['AUDIT'], 
      flagged: [],
      reason: {
        AUDIT: 'Cannot audit valuations we performed (self-review threat)'
      }
    },
    INTERNAL_AUDIT: { 
      blocked: ['AUDIT'], 
      flagged: [],
      reason: {
        AUDIT: 'Cannot provide external audit where internal audit was outsourced to us'
      }
    }
  }

  const PIE_RESTRICTIONS = {
    blocked: ['ADVISORY', 'ACCOUNTING', 'VALUATION', 'INTERNAL_AUDIT', 'IT_ADVISORY', 'TAX_PLANNING'],
    flagged: ['TAX', 'TAX_COMPLIANCE', 'TAX_CALCULATIONS', 'DUE_DILIGENCE']
  }

  // Check PIE restrictions first (stricter)
  if (isPIE && existingCategory === 'AUDIT') {
    if (PIE_RESTRICTIONS.blocked.includes(newCategory)) {
      return {
        severity: 'CRITICAL',
        reason: `PIE Audit Client: ${newServiceType} is PROHIBITED per IESBA Code Section 290.212`,
        regulation: 'EU Audit Regulation / IESBA Code Section 290.212'
      }
    }
    if (PIE_RESTRICTIONS.flagged.includes(newCategory)) {
      return {
        severity: 'HIGH',
        reason: `PIE Audit Client: ${newServiceType} requires safeguards and fee cap review (70% rule)`,
        regulation: 'EU Audit Regulation Article 4(2) / IESBA Code Section 290.212'
      }
    }
  }

  // Check general conflict matrix
  const conflictConfig = CONFLICT_MATRIX[existingCategory]
  if (!conflictConfig) {
    // No conflict rules for this category - assume safe
    return null
  }

  if (conflictConfig.blocked && conflictConfig.blocked.includes(newCategory)) {
    return {
      severity: 'CRITICAL',
      reason: conflictConfig.reason[newCategory] || `Independence conflict: ${existingServiceType} + ${newServiceType} is prohibited`,
      regulation: 'IESBA Code of Ethics / Local Independence Rules'
    }
  }

  if (conflictConfig.flagged && conflictConfig.flagged.includes(newCategory)) {
    return {
      severity: 'HIGH',
      reason: conflictConfig.reason[newCategory] || `Review required: ${existingServiceType} + ${newServiceType} may require safeguards`,
      regulation: 'IESBA Code of Ethics'
    }
  }

  // No conflict - service is allowed
  return null
}

/**
 * Get next best action recommendations for a user
 */
export function getNextBestActions(userId, options = {}) {
  if (!isClientIntelligenceEnabled()) {
    return { recommendations: [], message: 'Feature disabled' }
  }

  const limit = options.limit || 10
  const recommendations = []

  // Get all active clients (or user's clients if role-based filtering needed)
  const clients = db.prepare(`
    SELECT DISTINCT c.id, c.client_name, c.client_code
    FROM clients c
    INNER JOIN coi_requests r ON c.id = r.client_id
    WHERE c.status = 'Active'
    ORDER BY c.client_name
    LIMIT 100
  `).all()

  for (const client of clients) {
    // Generate/refresh trigger signals for this client
    generateTriggerSignals(client.id)
    
    // Get active triggers
    const triggers = getClientTriggerSignals(client.id, {
      priority: 'high',
      limit: 5
    })

    // Convert triggers to recommendations with compliance filtering
    triggers.forEach(trigger => {
      const recommendation = buildRecommendationFromTrigger(client, trigger, userId)
      if (recommendation) {
        // INVERSE COMPLIANCE: Check if service is allowed before recommending
        const complianceCheck = isServiceComplianceSafe(client.id, recommendation.serviceName)
        
        // Only add if safe or requires safeguards (filter out blocked)
        if (complianceCheck.safe) {
          // Add compliance status to recommendation
          recommendation.complianceStatus = complianceCheck.status
          recommendation.complianceNote = complianceCheck.note || null
          recommendation.complianceReason = complianceCheck.reason
          recommendation.regulation = complianceCheck.regulation || null
          
          recommendations.push(recommendation)
        }
        // If blocked, don't add to recommendations (filtered out)
      }
    })
  }

  // Score and rank recommendations
  const scoredRecommendations = scoreRecommendations(recommendations)
  
  // Sort by score (highest first)
  scoredRecommendations.sort((a, b) => b.score - a.score)

  // Return top N
  return {
    recommendations: scoredRecommendations.slice(0, limit),
    total: scoredRecommendations.length
  }
}

/**
 * Build recommendation from trigger signal
 */
function buildRecommendationFromTrigger(client, trigger, userId) {
  let serviceName = 'General Services'
  let serviceId = null
  let suggestedDate = new Date()
  let reasoning = []

  // Extract service information
  if (trigger.service_id) {
    const service = db.prepare('SELECT * FROM service_catalog_global WHERE id = ?').get(trigger.service_id)
    if (service) {
      serviceName = service.service_name
      serviceId = service.id
    }
  }

  // Extract metadata
  let metadata = {}
  try {
    metadata = JSON.parse(trigger.metadata || '{}')
  } catch (e) {
    // Ignore parse errors
  }

  // Determine suggested date based on trigger type
  if (trigger.trigger_type === 'engagement_lifecycle' && metadata.days_until_end) {
    // Suggest contact 30 days before renewal
    suggestedDate = new Date()
    suggestedDate.setDate(suggestedDate.getDate() + Math.max(7, metadata.days_until_end - 30))
    reasoning.push(`Engagement ending in ${metadata.days_until_end} days`)
  } else if (trigger.trigger_type === 'business_cycle') {
    if (metadata.days_until) {
      suggestedDate = new Date()
      suggestedDate.setDate(suggestedDate.getDate() + Math.max(7, metadata.days_until - 14))
      reasoning.push(`${trigger.trigger_subtype} approaching in ${metadata.days_until} days`)
    }
  } else if (trigger.trigger_type === 'service_gap') {
    suggestedDate = new Date()
    suggestedDate.setDate(suggestedDate.getDate() + 7) // Suggest within a week
    reasoning.push('Service gap identified')
  } else if (trigger.trigger_type === 'client_milestone') {
    if (metadata.milestone_date) {
      suggestedDate = new Date(metadata.milestone_date)
      suggestedDate.setDate(suggestedDate.getDate() - 7) // 7 days before milestone
      reasoning.push(`Client milestone: ${metadata.description || trigger.trigger_subtype}`)
    }
  }

  // Build reasoning
  if (trigger.priority === 'high') {
    reasoning.push('High priority trigger')
  }

  // Check for relationship opportunities
  const clientInfo = db.prepare('SELECT parent_company_id FROM clients WHERE id = ?').get(client.id)
  if (clientInfo?.parent_company_id) {
    const parentServices = db.prepare(`
      SELECT DISTINCT service_type
      FROM coi_requests
      WHERE client_id = ? AND status IN ('Active', 'Approved')
    `).all(clientInfo.parent_company_id).map(r => r.service_type)
    
    if (parentServices.length > 0) {
      reasoning.push(`Parent company uses ${parentServices.length} services`)
    }
  }

  return {
    clientId: client.id,
    clientName: client.client_name,
    clientCode: client.client_code,
    serviceId,
    serviceName,
    suggestedDate: suggestedDate.toISOString().split('T')[0],
    priority: trigger.priority,
    triggerType: trigger.trigger_type,
    triggerSubtype: trigger.trigger_subtype,
    reasoning: reasoning.join(' + '),
    triggerId: trigger.id,
    metadata
  }
}

/**
 * Score recommendations (rule-based scoring for prototype)
 */
function scoreRecommendations(recommendations) {
  return recommendations.map(rec => {
    let score = 50 // Base score

    // Priority boost
    if (rec.priority === 'critical') score += 30
    else if (rec.priority === 'high') score += 20
    else if (rec.priority === 'medium') score += 10

    // Trigger type boost
    if (rec.triggerType === 'engagement_lifecycle') score += 15
    else if (rec.triggerType === 'business_cycle') score += 10
    else if (rec.triggerType === 'service_gap') score += 5

    // Timing boost (closer dates get higher score)
    const daysUntil = Math.ceil((new Date(rec.suggestedDate) - new Date()) / (1000 * 60 * 60 * 24))
    if (daysUntil <= 7) score += 15
    else if (daysUntil <= 14) score += 10
    else if (daysUntil <= 30) score += 5

    // Relationship boost
    if (rec.reasoning.includes('Parent company')) score += 10

    // Cap at 100
    score = Math.min(100, score)

    return {
      ...rec,
      score,
      conversionProbability: score // Use score as conversion probability for prototype
    }
  })
}

/**
 * Get recommendations for a specific client
 */
export function getClientRecommendations(clientId, userId) {
  if (!isClientIntelligenceEnabled()) {
    return { recommendations: [], message: 'Feature disabled' }
  }

  // Generate fresh triggers
  generateTriggerSignals(clientId)
  
  const triggers = getClientTriggerSignals(clientId, { limit: 10 })
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId)
  
  if (!client) {
    return { recommendations: [], message: 'Client not found' }
  }

  const recommendations = triggers
    .map(trigger => buildRecommendationFromTrigger(client, trigger, userId))
    .filter(r => r !== null)
    .map(rec => {
      // INVERSE COMPLIANCE: Check compliance safety
      const complianceCheck = isServiceComplianceSafe(clientId, rec.serviceName)
      if (complianceCheck.safe) {
        rec.complianceStatus = complianceCheck.status
        rec.complianceNote = complianceCheck.note || null
        rec.complianceReason = complianceCheck.reason
        rec.regulation = complianceCheck.regulation || null
        return rec
      }
      return null // Filter out blocked services
    })
    .filter(r => r !== null)

  const scored = scoreRecommendations(recommendations)
  scored.sort((a, b) => b.score - a.score)

  return {
    recommendations: scored,
    clientId: client.id,
    clientName: client.client_name
  }
}

/**
 * Record feedback on recommendation (for learning)
 */
export function recordRecommendationFeedback(recommendationId, userId, action, outcome) {
  if (!isClientIntelligenceEnabled()) {
    return { success: false, message: 'Feature disabled' }
  }

  try {
    db.prepare(`
      INSERT INTO learning_feedback (
        recommendation_id, created_by, user_action, actual_outcome, created_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(recommendationId, userId, action, outcome)

    return { success: true }
  } catch (error) {
    console.error('Error recording feedback:', error)
    return { success: false, error: error.message }
  }
}
