import { getDatabase } from '../database/init.js'
import { calculateSLAStatus, calculateDeadlineStatus, SLA_STATUS } from './slaService.js'
import { 
  isMLModelAvailable, 
  predictPriority as mlPredictPriority 
} from './mlPriorityService.js'

/**
 * Priority Service
 * Calculates priority scores for COI requests using configurable factors
 * Supports both rule-based and ML-based priority calculation
 */

// Priority Level Constants
export const PRIORITY_LEVEL = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
}

/**
 * Get all active priority factors with weights
 */
export function getActiveConfig() {
  const db = getDatabase()
  
  const factors = db.prepare(`
    SELECT * FROM priority_config 
    WHERE is_active = 1
    ORDER BY weight DESC
  `).all()
  
  // Parse value_mappings JSON
  return factors.map(factor => ({
    ...factor,
    value_mappings: JSON.parse(factor.value_mappings || '{}')
  }))
}

/**
 * Get single factor configuration
 */
export function getFactorConfig(factorId) {
  const db = getDatabase()
  
  const factor = db.prepare(`
    SELECT * FROM priority_config 
    WHERE factor_id = ?
  `).get(factorId)
  
  if (!factor) return null
  
  return {
    ...factor,
    value_mappings: JSON.parse(factor.value_mappings || '{}')
  }
}

/**
 * Calculate priority score for a single request
 * Uses ML model if available, otherwise falls back to rule-based calculation
 */
export async function calculatePriority(request) {
  // Try ML prediction first if available
  if (isMLModelAvailable()) {
    try {
      const mlResult = await mlPredictPriority(request)
      
      // Sanity check - ML should produce reasonable scores
      if (mlResult.score >= 0 && mlResult.score <= 100) {
        // Calculate SLA status for compatibility
        const slaStatus = calculateSLAStatus(request)
        
        return {
          score: mlResult.score,
          level: mlResult.level,
          method: 'ML',
          breakdown: mlResult.breakdown || [],
          slaStatus,
          topFactors: mlResult.breakdown?.slice(0, 2).map(b => `${b.feature}: ${b.value}`) || [],
          probability: mlResult.probability,
          modelId: mlResult.modelId
        }
      } else {
        console.warn('ML produced invalid score, falling back to rules')
      }
    } catch (error) {
      console.error('ML prediction failed, falling back to rules:', error)
      // Fall through to rule-based calculation
    }
  }
  
  // Fallback to rule-based calculation
  return calculatePriorityWithRules(request)
}

/**
 * Calculate priority score using rule-based approach
 */
export function calculatePriorityWithRules(request) {
  const config = getActiveConfig()
  
  let totalWeightedScore = 0
  let totalWeight = 0
  const breakdown = []
  
  // Calculate SLA status once (used by sla_status factor)
  const slaStatus = calculateSLAStatus(request)
  
  for (const factor of config) {
    const rawValue = extractValue(request, factor.factor_id, slaStatus)
    const score = factor.value_mappings[rawValue] || 0
    const weighted = score * factor.weight
    
    totalWeightedScore += weighted
    totalWeight += factor.weight
    
    breakdown.push({
      factor: factor.factor_name,
      factorId: factor.factor_id,
      value: rawValue,
      score: score,
      weight: factor.weight,
      contribution: weighted
    })
  }
  
  // Calculate final score (0-100)
  const finalScore = totalWeight > 0 
    ? Math.round(totalWeightedScore / totalWeight) 
    : 0
  
  // Sort breakdown by contribution (highest first)
  breakdown.sort((a, b) => b.contribution - a.contribution)
  
  return {
    score: finalScore,
    level: getLevel(finalScore),
    method: 'RULES',
    breakdown,
    slaStatus,
    topFactors: breakdown.slice(0, 2).map(b => `${b.factor}: ${b.value}`)
  }
}

/**
 * Extract factor value from request
 */
function extractValue(request, factorId, slaStatus = null) {
  switch (factorId) {
    case 'sla_status':
      // Use pre-calculated SLA status or calculate now
      const status = slaStatus?.status || calculateSLAStatus(request).status
      return status
    
    case 'external_deadline':
      return calculateDeadlineStatus(request.external_deadline)
    
    case 'pie_status':
      // Check pie_status field
      const isPie = request.pie_status === 'Yes' || request.pie_status === true || request.pie_status === 1
      return isPie ? 'Yes' : 'No'
    
    case 'international_operations':
      // Check international_operations field
      const isInternational = request.international_operations === true || 
                              request.international_operations === 1 ||
                              request.international_operations === 'true'
      return isInternational ? '1' : '0'
    
    case 'service_type':
      // Map service type to configured values
      const serviceType = request.service_type || 'Other'
      // Return exact match or closest match
      return serviceType
    
    case 'escalation_count':
      const count = request.escalation_count || 0
      if (count >= 3) return '3+'
      return count.toString()
    
    default:
      // Try to get value directly from request
      return request[factorId]?.toString() || '0'
  }
}

/**
 * Map score to urgency level
 */
export function getLevel(score) {
  if (score >= 80) return PRIORITY_LEVEL.CRITICAL
  if (score >= 60) return PRIORITY_LEVEL.HIGH
  if (score >= 40) return PRIORITY_LEVEL.MEDIUM
  return PRIORITY_LEVEL.LOW
}

/**
 * Get level thresholds
 */
export function getLevelThresholds() {
  return {
    [PRIORITY_LEVEL.CRITICAL]: { min: 80, max: 100 },
    [PRIORITY_LEVEL.HIGH]: { min: 60, max: 79 },
    [PRIORITY_LEVEL.MEDIUM]: { min: 40, max: 59 },
    [PRIORITY_LEVEL.LOW]: { min: 0, max: 39 }
  }
}

/**
 * Update factor weight (admin only)
 */
export function updateWeight(factorId, newWeight, userId, reason = '') {
  const db = getDatabase()
  
  // Get current factor
  const current = db.prepare('SELECT * FROM priority_config WHERE factor_id = ?').get(factorId)
  
  if (!current) {
    throw new Error('Factor not found')
  }
  
  const oldWeight = current.weight
  
  // Update weight
  db.prepare(`
    UPDATE priority_config 
    SET weight = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE factor_id = ?
  `).run(newWeight, userId, factorId)
  
  // Log to audit
  db.prepare(`
    INSERT INTO priority_audit (factor_id, field_changed, old_value, new_value, changed_by, reason)
    VALUES (?, 'weight', ?, ?, ?, ?)
  `).run(factorId, oldWeight.toString(), newWeight.toString(), userId, reason)
  
  return getFactorConfig(factorId)
}

/**
 * Update value mappings (admin only)
 */
export function updateValueMappings(factorId, newMappings, userId, reason = '') {
  const db = getDatabase()
  
  // Get current factor
  const current = db.prepare('SELECT * FROM priority_config WHERE factor_id = ?').get(factorId)
  
  if (!current) {
    throw new Error('Factor not found')
  }
  
  const oldMappings = current.value_mappings
  const newMappingsJson = JSON.stringify(newMappings)
  
  // Update mappings
  db.prepare(`
    UPDATE priority_config 
    SET value_mappings = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE factor_id = ?
  `).run(newMappingsJson, userId, factorId)
  
  // Log to audit
  db.prepare(`
    INSERT INTO priority_audit (factor_id, field_changed, old_value, new_value, changed_by, reason)
    VALUES (?, 'value_mappings', ?, ?, ?, ?)
  `).run(factorId, oldMappings, newMappingsJson, userId, reason)
  
  return getFactorConfig(factorId)
}

/**
 * Toggle factor active status
 */
export function toggleFactorActive(factorId, isActive, userId, reason = '') {
  const db = getDatabase()
  
  const current = db.prepare('SELECT * FROM priority_config WHERE factor_id = ?').get(factorId)
  
  if (!current) {
    throw new Error('Factor not found')
  }
  
  db.prepare(`
    UPDATE priority_config 
    SET is_active = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE factor_id = ?
  `).run(isActive ? 1 : 0, userId, factorId)
  
  // Log to audit
  db.prepare(`
    INSERT INTO priority_audit (factor_id, field_changed, old_value, new_value, changed_by, reason)
    VALUES (?, 'is_active', ?, ?, ?, ?)
  `).run(factorId, current.is_active.toString(), isActive ? '1' : '0', userId, reason)
  
  return getFactorConfig(factorId)
}

/**
 * Get audit history for a factor
 */
export function getFactorAuditHistory(factorId, limit = 50) {
  const db = getDatabase()
  
  return db.prepare(`
    SELECT 
      a.*,
      u.name as changed_by_name
    FROM priority_audit a
    LEFT JOIN users u ON a.changed_by = u.id
    WHERE a.factor_id = ?
    ORDER BY a.changed_at DESC
    LIMIT ?
  `).all(factorId, limit)
}

/**
 * Get all audit history
 */
export function getAllAuditHistory(limit = 100) {
  const db = getDatabase()
  
  return db.prepare(`
    SELECT 
      a.*,
      u.name as changed_by_name
    FROM priority_audit a
    LEFT JOIN users u ON a.changed_by = u.id
    ORDER BY a.changed_at DESC
    LIMIT ?
  `).all(limit)
}

/**
 * Calculate priorities for multiple requests (batch)
 */
export function calculatePrioritiesBatch(requests) {
  return requests.map(request => ({
    ...request,
    priority: calculatePriority(request)
  }))
}

/**
 * Sort requests by priority score (highest first)
 */
export async function sortByPriority(requests) {
  const withPriority = await calculatePrioritiesBatch(requests)
  return withPriority.sort((a, b) => b.priority.score - a.priority.score)
}

/**
 * Group requests by priority level
 */
export async function groupByPriorityLevel(requests) {
  const withPriority = await calculatePrioritiesBatch(requests)
  
  const groups = {
    [PRIORITY_LEVEL.CRITICAL]: [],
    [PRIORITY_LEVEL.HIGH]: [],
    [PRIORITY_LEVEL.MEDIUM]: [],
    [PRIORITY_LEVEL.LOW]: []
  }
  
  for (const request of withPriority) {
    const level = request.priority.level
    groups[level].push(request)
  }
  
  // Sort each group by score (highest first)
  for (const level of Object.keys(groups)) {
    groups[level].sort((a, b) => b.priority.score - a.priority.score)
  }
  
  return groups
}

export default {
  PRIORITY_LEVEL,
  getActiveConfig,
  getFactorConfig,
  calculatePriority,
  calculatePriorityWithRules,
  getLevel,
  getLevelThresholds,
  updateWeight,
  updateValueMappings,
  toggleFactorActive,
  getFactorAuditHistory,
  getAllAuditHistory,
  calculatePrioritiesBatch,
  sortByPriority,
  groupByPriorityLevel
}
