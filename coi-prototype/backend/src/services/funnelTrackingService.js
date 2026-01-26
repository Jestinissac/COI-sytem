/**
 * Funnel Tracking Service
 * 
 * Tracks prospect journey through the conversion funnel.
 * Logs events at each stage transition for attribution analytics.
 * 
 * Funnel Stages:
 * - lead_created        : Prospect record created
 * - proposal_submitted  : COI request submitted with is_prospect=1
 * - pending_director    : Awaiting director approval
 * - pending_compliance  : Awaiting compliance review
 * - pending_partner     : Awaiting partner approval
 * - approved            : Proposal approved
 * - engagement_started  : Converted to engagement
 * - client_created      : PRMS client created
 * - lost                : Rejected or abandoned
 */

import { getDatabase } from '../database/init.js'

const db = getDatabase()

/**
 * Valid funnel stages
 */
export const FUNNEL_STAGES = {
  LEAD_CREATED: 'lead_created',
  PROPOSAL_SUBMITTED: 'proposal_submitted',
  PENDING_DIRECTOR: 'pending_director',
  PENDING_COMPLIANCE: 'pending_compliance',
  PENDING_PARTNER: 'pending_partner',
  PENDING_FINANCE: 'pending_finance',
  APPROVED: 'approved',
  ENGAGEMENT_STARTED: 'engagement_started',
  CLIENT_CREATED: 'client_created',
  LOST: 'lost',
  REJECTED: 'rejected'
}

/**
 * Map COI request status to funnel stage
 */
export function mapStatusToStage(status) {
  const statusMap = {
    'Draft': null, // Draft doesn't count as a stage
    'Pending Director': FUNNEL_STAGES.PENDING_DIRECTOR,
    'Pending Compliance': FUNNEL_STAGES.PENDING_COMPLIANCE,
    'Pending Partner': FUNNEL_STAGES.PENDING_PARTNER,
    'Pending Finance': FUNNEL_STAGES.PENDING_FINANCE,
    'Approved': FUNNEL_STAGES.APPROVED,
    'Rejected': FUNNEL_STAGES.REJECTED,
    'Active': FUNNEL_STAGES.ENGAGEMENT_STARTED,
    'Client Accepted': FUNNEL_STAGES.ENGAGEMENT_STARTED
  }
  return statusMap[status] || null
}

/**
 * Get the last funnel event timestamp for a prospect/COI request
 * Used to calculate days_in_previous_stage
 */
export function getLastEventTimestamp(prospectId, coiRequestId) {
  try {
    let query = 'SELECT event_timestamp FROM prospect_funnel_events WHERE 1=1'
    const params = []
    
    if (prospectId) {
      query += ' AND prospect_id = ?'
      params.push(prospectId)
    }
    
    if (coiRequestId) {
      query += ' AND coi_request_id = ?'
      params.push(coiRequestId)
    }
    
    query += ' ORDER BY event_timestamp DESC LIMIT 1'
    
    const result = db.prepare(query).get(...params)
    return result?.event_timestamp || null
  } catch (error) {
    console.error('Error getting last event timestamp:', error.message)
    return null
  }
}

/**
 * Calculate days between two timestamps
 */
export function calculateDaysInStage(fromTimestamp, toTimestamp = new Date().toISOString()) {
  if (!fromTimestamp) return null
  
  try {
    const from = new Date(fromTimestamp)
    const to = new Date(toTimestamp)
    const diffTime = Math.abs(to - from)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  } catch (error) {
    return null
  }
}

/**
 * Log a funnel event
 * 
 * @param {Object} params
 * @param {number} params.prospectId - Prospect ID (optional if coiRequestId provided)
 * @param {number} params.coiRequestId - COI Request ID (optional if prospectId provided)
 * @param {string} params.fromStage - Previous stage (null for first event)
 * @param {string} params.toStage - New stage (required)
 * @param {number} params.userId - User who performed the action
 * @param {string} params.userRole - Role of the user
 * @param {string} params.notes - Optional notes
 * @param {Object} params.metadata - Optional additional context as JSON
 */
export function logFunnelEvent({
  prospectId = null,
  coiRequestId = null,
  fromStage = null,
  toStage,
  userId = null,
  userRole = null,
  notes = null,
  metadata = null
}) {
  try {
    // Validate required fields
    if (!toStage) {
      console.warn('logFunnelEvent: toStage is required')
      return null
    }
    
    if (!prospectId && !coiRequestId) {
      console.warn('logFunnelEvent: Either prospectId or coiRequestId is required')
      return null
    }
    
    // Get last event timestamp to calculate days in previous stage
    const lastTimestamp = getLastEventTimestamp(prospectId, coiRequestId)
    const daysInPreviousStage = calculateDaysInStage(lastTimestamp)
    
    // Prepare metadata as JSON string
    const metadataJson = metadata ? JSON.stringify(metadata) : null
    
    // Insert funnel event
    const result = db.prepare(`
      INSERT INTO prospect_funnel_events (
        prospect_id,
        coi_request_id,
        from_stage,
        to_stage,
        performed_by_user_id,
        performed_by_role,
        days_in_previous_stage,
        notes,
        metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      prospectId,
      coiRequestId,
      fromStage,
      toStage,
      userId,
      userRole,
      daysInPreviousStage,
      notes,
      metadataJson
    )
    
    console.log(`✅ Funnel event logged: ${fromStage || 'start'} → ${toStage}`)
    return result.lastInsertRowid
  } catch (error) {
    // Non-blocking - funnel logging should not break main flow
    console.error('Failed to log funnel event:', error.message)
    return null
  }
}

/**
 * Log funnel event for a COI request status change
 * Convenience method that handles stage mapping and lookup
 */
export function logStatusChange({
  coiRequestId,
  oldStatus,
  newStatus,
  userId,
  userRole,
  notes = null
}) {
  try {
    // Map statuses to stages
    const fromStage = mapStatusToStage(oldStatus)
    const toStage = mapStatusToStage(newStatus)
    
    // Only log if there's an actual stage change
    if (!toStage || fromStage === toStage) {
      return null
    }
    
    // Get prospect_id from COI request if it's a prospect
    const coiRequest = db.prepare(`
      SELECT id, prospect_id, is_prospect 
      FROM coi_requests 
      WHERE id = ?
    `).get(coiRequestId)
    
    if (!coiRequest) {
      console.warn(`logStatusChange: COI request ${coiRequestId} not found`)
      return null
    }
    
    // Only log for prospect requests
    if (!coiRequest.is_prospect) {
      return null
    }
    
    return logFunnelEvent({
      prospectId: coiRequest.prospect_id,
      coiRequestId,
      fromStage,
      toStage,
      userId,
      userRole,
      notes,
      metadata: { oldStatus, newStatus }
    })
  } catch (error) {
    console.error('Failed to log status change:', error.message)
    return null
  }
}

/**
 * Get funnel events for a prospect
 */
export function getFunnelEvents(prospectId, coiRequestId = null) {
  try {
    let query = `
      SELECT 
        pfe.*,
        u.name as performed_by_name
      FROM prospect_funnel_events pfe
      LEFT JOIN users u ON pfe.performed_by_user_id = u.id
      WHERE 1=1
    `
    const params = []
    
    if (prospectId) {
      query += ' AND pfe.prospect_id = ?'
      params.push(prospectId)
    }
    
    if (coiRequestId) {
      query += ' AND pfe.coi_request_id = ?'
      params.push(coiRequestId)
    }
    
    query += ' ORDER BY pfe.event_timestamp ASC'
    
    return db.prepare(query).all(...params)
  } catch (error) {
    console.error('Error getting funnel events:', error.message)
    return []
  }
}

/**
 * Get funnel stage counts for reporting
 */
export function getFunnelStageCounts(dateFrom = null, dateTo = null) {
  try {
    let query = `
      SELECT 
        to_stage as stage,
        COUNT(*) as count,
        AVG(days_in_previous_stage) as avg_days_in_stage
      FROM prospect_funnel_events
      WHERE 1=1
    `
    const params = []
    
    if (dateFrom) {
      query += ' AND event_timestamp >= ?'
      params.push(dateFrom)
    }
    
    if (dateTo) {
      query += ' AND event_timestamp <= ?'
      params.push(dateTo)
    }
    
    query += ' GROUP BY to_stage ORDER BY count DESC'
    
    return db.prepare(query).all(...params)
  } catch (error) {
    console.error('Error getting funnel stage counts:', error.message)
    return []
  }
}

/**
 * Get conversion funnel metrics
 */
export function getConversionFunnelMetrics(dateFrom = null, dateTo = null) {
  try {
    const stages = [
      FUNNEL_STAGES.LEAD_CREATED,
      FUNNEL_STAGES.PROPOSAL_SUBMITTED,
      FUNNEL_STAGES.PENDING_DIRECTOR,
      FUNNEL_STAGES.PENDING_COMPLIANCE,
      FUNNEL_STAGES.PENDING_PARTNER,
      FUNNEL_STAGES.APPROVED,
      FUNNEL_STAGES.ENGAGEMENT_STARTED,
      FUNNEL_STAGES.CLIENT_CREATED
    ]
    
    let dateFilter = ''
    const params = []
    
    if (dateFrom) {
      dateFilter += ' AND event_timestamp >= ?'
      params.push(dateFrom)
    }
    
    if (dateTo) {
      dateFilter += ' AND event_timestamp <= ?'
      params.push(dateTo)
    }
    
    const metrics = stages.map((stage, index) => {
      const count = db.prepare(`
        SELECT COUNT(DISTINCT COALESCE(prospect_id, coi_request_id)) as count
        FROM prospect_funnel_events
        WHERE to_stage = ? ${dateFilter}
      `).get(stage, ...params)
      
      return {
        stage,
        count: count?.count || 0,
        order: index
      }
    })
    
    // Calculate conversion rates between stages
    for (let i = 1; i < metrics.length; i++) {
      const prevCount = metrics[i - 1].count
      const currCount = metrics[i].count
      metrics[i].conversionRate = prevCount > 0 
        ? Math.round((currCount / prevCount) * 100) 
        : 0
      metrics[i].dropOff = prevCount - currCount
    }
    
    return metrics
  } catch (error) {
    console.error('Error getting conversion funnel metrics:', error.message)
    return []
  }
}

/**
 * Get lead source for a prospect or COI request
 */
export function getLeadSourceIdOrDefault(sourceCode) {
  try {
    const source = db.prepare('SELECT id FROM lead_sources WHERE source_code = ?').get(sourceCode)
    if (source) {
      return source.id
    }
    
    // Fallback to 'unknown'
    console.warn(`Lead source '${sourceCode}' not found, using 'unknown'`)
    const unknown = db.prepare('SELECT id FROM lead_sources WHERE source_code = ?').get('unknown')
    return unknown?.id || null
  } catch (error) {
    console.error('Error getting lead source:', error.message)
    return null
  }
}

/**
 * Get all active lead sources for dropdowns
 */
export function getLeadSources() {
  try {
    return db.prepare(`
      SELECT id, source_code, source_name, source_category
      FROM lead_sources
      WHERE is_active = 1
      ORDER BY source_category, source_name
    `).all()
  } catch (error) {
    console.error('Error getting lead sources:', error.message)
    return []
  }
}

export default {
  FUNNEL_STAGES,
  mapStatusToStage,
  logFunnelEvent,
  logStatusChange,
  getFunnelEvents,
  getFunnelStageCounts,
  getConversionFunnelMetrics,
  getLeadSourceIdOrDefault,
  getLeadSources,
  getLastEventTimestamp,
  calculateDaysInStage
}
