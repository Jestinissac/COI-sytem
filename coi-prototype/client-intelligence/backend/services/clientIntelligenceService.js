/**
 * Client Intelligence Service
 * Main service for client intelligence operations
 */

import { getDatabase } from '../../../backend/src/database/init.js'
import { isClientIntelligenceEnabled } from '../../../backend/src/services/configService.js'
import { generateTriggerSignals } from './triggerSignalService.js'
import { getNextBestActions, getClientRecommendations } from './recommendationEngine.js'

const db = getDatabase()

/**
 * Check if a table exists in the database
 */
function tableExists(tableName) {
  try {
    const result = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `).get(tableName)
    return !!result
  } catch (error) {
    return false
  }
}

/**
 * Get comprehensive client intelligence profile
 */
export function getClientIntelligenceProfile(clientId) {
  if (!isClientIntelligenceEnabled()) {
    return { error: 'Feature disabled' }
  }

  // Check if required tables exist
  if (!tableExists('clients')) {
    return { error: 'Database tables not initialized. Please run database migration.' }
  }

  let client
  try {
    client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId)
  } catch (error) {
    console.error('Error fetching client:', error)
    return { error: 'Error fetching client information' }
  }
  
  if (!client) {
    return { error: 'Client not found' }
  }

  // Get service history
  const serviceHistory = getClientServiceHistory(clientId)

  // Get service gaps
  const serviceGaps = getServiceGaps(clientId)

  // Get relationship intelligence
  const relationshipIntel = getRelationshipIntelligence(clientId)

  // Get engagement lifecycle info
  const lifecycleInfo = getEngagementLifecycleInfo(clientId)

  // Get opportunities
  const opportunities = getClientOpportunities(clientId)

  // Get recent interactions
  const interactions = getClientInteractions(clientId, { limit: 10 })

  return {
    client: {
      id: client.id,
      name: client.client_name,
      code: client.client_code,
      industry: client.industry,
      status: client.status,
      parentCompanyId: client.parent_company_id
    },
    serviceHistory,
    serviceGaps,
    relationshipIntel,
    lifecycleInfo,
    opportunities: opportunities.slice(0, 5),
    recentInteractions: interactions
  }
}

/**
 * Get client service history
 */
function getClientServiceHistory(clientId) {
  if (!tableExists('coi_requests')) {
    return []
  }

  try {
    const services = db.prepare(`
      SELECT 
        service_type,
        COUNT(*) as count,
        MAX(requested_service_period_end) as latest_end_date,
        MAX(created_at) as latest_request_date
      FROM coi_requests
      WHERE client_id = ? AND status IN ('Active', 'Approved')
      GROUP BY service_type
      ORDER BY latest_request_date DESC
    `).all(clientId)

    return services
  } catch (error) {
    console.error('Error getting client service history:', error)
    return []
  }
}

/**
 * Get service gaps (white-space analysis)
 */
function getServiceGaps(clientId) {
  if (!tableExists('coi_requests') || !tableExists('service_catalog_global')) {
    return {
      total: 0,
      byCategory: {},
      topGaps: []
    }
  }

  try {
    // Get services used by client
    const clientServices = db.prepare(`
      SELECT DISTINCT service_type
      FROM coi_requests
      WHERE client_id = ? AND status IN ('Active', 'Approved')
    `).all(clientId).map(r => r.service_type)

    // Get all available services
    const allServices = db.prepare(`
      SELECT id, service_code, service_name, category, sub_category
      FROM service_catalog_global
      WHERE is_active = 1
      ORDER BY category, service_name
    `).all()

  // Find gaps
  const gaps = allServices.filter(service => {
    return !clientServices.some(clientService => 
      clientService && service.service_name.toLowerCase().includes(clientService.toLowerCase())
    )
  })

    // Group by category
    const gapsByCategory = {}
    gaps.forEach(service => {
      const category = service.category || 'Other'
      if (!gapsByCategory[category]) {
        gapsByCategory[category] = []
      }
      gapsByCategory[category].push(service)
    })

    return {
      total: gaps.length,
      byCategory: gapsByCategory,
      topGaps: gaps.slice(0, 10)
    }
  } catch (error) {
    console.error('Error getting service gaps:', error)
    return {
      total: 0,
      byCategory: {},
      topGaps: []
    }
  }
}

/**
 * Get relationship intelligence
 */
function getRelationshipIntelligence(clientId) {
  const client = db.prepare('SELECT parent_company_id FROM clients WHERE id = ?').get(clientId)
  
  if (!client?.parent_company_id) {
    return {
      hasParent: false,
      parentServices: [],
      subsidiaries: [],
      sisterCompanies: []
    }
  }

  // Get parent company services
  const parentServices = db.prepare(`
    SELECT DISTINCT service_type
    FROM coi_requests
    WHERE client_id = ? AND status IN ('Active', 'Approved')
  `).all(client.parent_company_id).map(r => r.service_type)

  // Get subsidiaries
  const subsidiaries = db.prepare(`
    SELECT id, client_name, client_code
    FROM clients
    WHERE parent_company_id = ?
  `).all(clientId)

  // Get sister companies (same parent)
  const sisterCompanies = db.prepare(`
    SELECT id, client_name, client_code
    FROM clients
    WHERE parent_company_id = ? AND id != ?
  `).all(client.parent_company_id, clientId)

  return {
    hasParent: true,
    parentCompanyId: client.parent_company_id,
    parentServices,
    subsidiaries: subsidiaries.map(s => ({
      id: s.id,
      name: s.client_name,
      code: s.client_code
    })),
    sisterCompanies: sisterCompanies.map(s => ({
      id: s.id,
      name: s.client_name,
      code: s.client_code
    }))
  }
}

/**
 * Get engagement lifecycle information
 */
function getEngagementLifecycleInfo(clientId) {
  const today = new Date()
  const ninetyDaysFromNow = new Date(today)
  ninetyDaysFromNow.setDate(today.getDate() + 90)

  // Active engagements
  const active = db.prepare(`
    SELECT id, request_id, service_type, requested_service_period_end, status
    FROM coi_requests
    WHERE client_id = ? AND status = 'Active'
    ORDER BY requested_service_period_end ASC
  `).all(clientId)

  // Ending soon (within 90 days)
  const endingSoon = db.prepare(`
    SELECT id, request_id, service_type, requested_service_period_end, status
    FROM coi_requests
    WHERE client_id = ?
      AND status IN ('Active', 'Approved')
      AND requested_service_period_end IS NOT NULL
      AND requested_service_period_end BETWEEN date('now') AND date('now', '+90 days')
    ORDER BY requested_service_period_end ASC
  `).all(clientId)

  // Recent proposals
  const recentProposals = db.prepare(`
    SELECT id, request_id, service_type, status, created_at
    FROM coi_requests
    WHERE client_id = ? AND stage = 'Proposal'
    ORDER BY created_at DESC
    LIMIT 5
  `).all(clientId)

  return {
    activeCount: active.length,
    endingSoonCount: endingSoon.length,
    endingSoon: endingSoon.map(e => ({
      id: e.id,
      requestId: e.request_id,
      serviceType: e.service_type,
      endDate: e.requested_service_period_end,
      daysUntil: Math.ceil((new Date(e.requested_service_period_end) - today) / (1000 * 60 * 60 * 24))
    })),
    recentProposals: recentProposals.length
  }
}

/**
 * Get client opportunities
 */
export function getClientOpportunities(clientId, options = {}) {
  if (!isClientIntelligenceEnabled()) {
    return []
  }

  let query = `
    SELECT 
      o.*,
      c.client_name,
      s.service_name,
      s.service_code
    FROM client_opportunities o
    LEFT JOIN clients c ON o.client_id = c.id
    LEFT JOIN service_catalog_global s ON o.service_id = s.id
    WHERE o.client_id = ?
  `
  const params = [clientId]

  if (options.status) {
    query += ' AND o.status = ?'
    params.push(options.status)
  }

  query += ' ORDER BY o.priority DESC, o.created_at DESC LIMIT ?'
  params.push(options.limit || 50)

  return db.prepare(query).all(...params)
}

/**
 * Create opportunity from trigger signal
 */
export function createOpportunityFromTrigger(triggerId, userId) {
  if (!isClientIntelligenceEnabled()) {
    return { success: false, message: 'Feature disabled' }
  }

  const trigger = db.prepare('SELECT * FROM trigger_signals WHERE id = ?').get(triggerId)
  if (!trigger) {
    return { success: false, message: 'Trigger not found' }
  }

  // Check if opportunity already exists
  const existing = db.prepare(`
    SELECT id FROM client_opportunities
    WHERE source_trigger_id = ? AND status != 'dismissed'
  `).get(triggerId)

  if (existing) {
    return { success: false, message: 'Opportunity already exists', opportunityId: existing.id }
  }

  // Build opportunity from trigger
  let metadata = {}
  try {
    metadata = JSON.parse(trigger.metadata || '{}')
  } catch (e) {}

  const title = buildOpportunityTitle(trigger, metadata)
  const description = buildOpportunityDescription(trigger, metadata)

  // Calculate conversion probability (rule-based for prototype)
  const conversionProbability = calculateConversionProbability(trigger)

  // Determine suggested contact date
  const suggestedDate = calculateSuggestedDate(trigger, metadata)

  try {
    const result = db.prepare(`
      INSERT INTO client_opportunities (
        client_id, opportunity_type, service_id, related_engagement_id,
        title, description, priority, conversion_probability,
        suggested_contact_date, status, source_trigger_id, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'identified', ?, ?)
    `).run(
      trigger.client_id,
      trigger.trigger_type,
      trigger.service_id,
      trigger.engagement_id,
      title,
      description,
      trigger.priority,
      conversionProbability,
      suggestedDate,
      triggerId,
      userId
    )

    // Mark trigger as converted
    db.prepare('UPDATE trigger_signals SET status = ? WHERE id = ?').run('converted', triggerId)

    return { success: true, opportunityId: result.lastInsertRowid }
  } catch (error) {
    console.error('Error creating opportunity:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Build opportunity title from trigger
 */
function buildOpportunityTitle(trigger, metadata) {
  const client = db.prepare('SELECT client_name FROM clients WHERE id = ?').get(trigger.client_id)
  const clientName = client?.client_name || 'Client'

  if (trigger.trigger_type === 'engagement_lifecycle') {
    return `${clientName} - Renewal Opportunity`
  } else if (trigger.trigger_type === 'service_gap') {
    const service = trigger.service_id 
      ? db.prepare('SELECT service_name FROM service_catalog_global WHERE id = ?').get(trigger.service_id)
      : null
    return `${clientName} - ${service?.service_name || 'New Service'} Opportunity`
  } else if (trigger.trigger_type === 'business_cycle') {
    return `${clientName} - ${trigger.trigger_subtype} Opportunity`
  } else {
    return `${clientName} - Business Development Opportunity`
  }
}

/**
 * Build opportunity description
 */
function buildOpportunityDescription(trigger, metadata) {
  if (trigger.trigger_type === 'engagement_lifecycle' && metadata.days_until_end) {
    return `Engagement ending in ${metadata.days_until_end} days. Opportunity to discuss renewal and potential expansion.`
  } else if (trigger.trigger_type === 'service_gap') {
    return 'Service gap identified. Client may benefit from this additional service based on industry and relationship analysis.'
  } else if (trigger.trigger_type === 'business_cycle') {
    return `${trigger.trigger_subtype} approaching. Optimal time to discuss related services.`
  } else {
    return 'Business development opportunity identified through intelligence analysis.'
  }
}

/**
 * Calculate conversion probability (rule-based)
 */
function calculateConversionProbability(trigger) {
  let probability = 50 // Base

  if (trigger.priority === 'critical') probability += 20
  else if (trigger.priority === 'high') probability += 15
  else if (trigger.priority === 'medium') probability += 5

  if (trigger.trigger_type === 'engagement_lifecycle') probability += 15
  else if (trigger.trigger_type === 'business_cycle') probability += 10

  return Math.min(100, probability)
}

/**
 * Calculate suggested contact date
 */
function calculateSuggestedDate(trigger, metadata) {
  const today = new Date()
  
  if (metadata.days_until) {
    const suggested = new Date(today)
    suggested.setDate(suggested.getDate() + Math.max(7, metadata.days_until - 14))
    return suggested.toISOString().split('T')[0]
  }

  // Default: 7 days from now
  today.setDate(today.getDate() + 7)
  return today.toISOString().split('T')[0]
}

/**
 * Get client interactions
 */
export function getClientInteractions(clientId, options = {}) {
  if (!isClientIntelligenceEnabled()) {
    return []
  }

  let query = `
    SELECT 
      i.*,
      u.name as created_by_name,
      o.title as opportunity_title
    FROM client_interactions i
    LEFT JOIN users u ON i.created_by = u.id
    LEFT JOIN client_opportunities o ON i.opportunity_id = o.id
    WHERE i.client_id = ?
  `
  const params = [clientId]

  if (options.opportunityId) {
    query += ' AND i.opportunity_id = ?'
    params.push(options.opportunityId)
  }

  query += ' ORDER BY i.interaction_date DESC LIMIT ?'
  params.push(options.limit || 50)

  return db.prepare(query).all(...params)
}

/**
 * Create client interaction
 */
export function createClientInteraction(data, userId) {
  if (!isClientIntelligenceEnabled()) {
    return { success: false, message: 'Feature disabled' }
  }

  try {
    const result = db.prepare(`
      INSERT INTO client_interactions (
        client_id, opportunity_id, interaction_type, interaction_date,
        subject, notes, outcome, next_action, next_action_date, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.clientId,
      data.opportunityId || null,
      data.interactionType,
      data.interactionDate || new Date().toISOString(),
      data.subject || null,
      data.notes || null,
      data.outcome || null,
      data.nextAction || null,
      data.nextActionDate || null,
      userId
    )

    // Update opportunity status if linked
    if (data.opportunityId) {
      db.prepare(`
        UPDATE client_opportunities
        SET status = 'contacted', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(data.opportunityId)
    }

    return { success: true, interactionId: result.lastInsertRowid }
  } catch (error) {
    console.error('Error creating interaction:', error)
    return { success: false, error: error.message }
  }
}
