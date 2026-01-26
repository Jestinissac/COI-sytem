/**
 * Stale Prospect Detection Service
 * 
 * PHASE 3: Detects and flags stale prospects for follow-up.
 * 
 * Stale Thresholds:
 * - Prospects with no activity for 14+ days: Flag as "needs_followup"
 * - Prospects with no activity for 30+ days: Flag as "stale"
 * - Proposals pending > 30 days without status change: Flag as "stale_proposal"
 * 
 * This service is designed to be run as a scheduled job (cron).
 */

import { getDatabase } from '../database/init.js'
import { logFunnelEvent, FUNNEL_STAGES } from './funnelTrackingService.js'

const db = getDatabase()

// Configuration thresholds (in days)
const THRESHOLDS = {
  NEEDS_FOLLOWUP: 14,  // Days without activity before flagging for follow-up
  STALE: 30,           // Days without activity before marking as stale
  STALE_PROPOSAL: 30   // Days a proposal can sit without status change
}

/**
 * Lost reasons for tracking
 */
export const LOST_REASONS = {
  STALE: 'stale_no_activity',
  REJECTED: 'rejected_by_compliance',
  REJECTED_DIRECTOR: 'rejected_by_director',
  REJECTED_PARTNER: 'rejected_by_partner',
  CLIENT_DECLINED: 'client_declined',
  COMPETITOR_WON: 'competitor_won',
  BUDGET_CONSTRAINTS: 'budget_constraints',
  TIMING_NOT_RIGHT: 'timing_not_right',
  NO_RESPONSE: 'no_response',
  OTHER: 'other'
}

/**
 * Detect stale prospects - prospects with no activity for threshold days
 * @returns {Array} List of stale prospects
 */
export function detectStaleProspects() {
  try {
    const staleProspects = db.prepare(`
      SELECT 
        p.*,
        ls.source_name as lead_source_name,
        CAST(julianday('now') - julianday(COALESCE(p.last_activity_at, p.updated_at, p.created_at)) AS INTEGER) as days_inactive
      FROM prospects p
      LEFT JOIN lead_sources ls ON p.lead_source_id = ls.id
      WHERE p.status = 'Active'
        AND p.stale_detected_at IS NULL
        AND julianday('now') - julianday(COALESCE(p.last_activity_at, p.updated_at, p.created_at)) >= ?
      ORDER BY days_inactive DESC
    `).all(THRESHOLDS.STALE)
    
    return staleProspects
  } catch (error) {
    console.error('Error detecting stale prospects:', error.message)
    return []
  }
}

/**
 * Detect prospects needing follow-up (approaching stale threshold)
 * @returns {Array} List of prospects needing follow-up
 */
export function detectProspectsNeedingFollowup() {
  try {
    const needsFollowup = db.prepare(`
      SELECT 
        p.*,
        ls.source_name as lead_source_name,
        CAST(julianday('now') - julianday(COALESCE(p.last_activity_at, p.updated_at, p.created_at)) AS INTEGER) as days_inactive
      FROM prospects p
      LEFT JOIN lead_sources ls ON p.lead_source_id = ls.id
      WHERE p.status = 'Active'
        AND p.stale_detected_at IS NULL
        AND julianday('now') - julianday(COALESCE(p.last_activity_at, p.updated_at, p.created_at)) >= ?
        AND julianday('now') - julianday(COALESCE(p.last_activity_at, p.updated_at, p.created_at)) < ?
      ORDER BY days_inactive DESC
    `).all(THRESHOLDS.NEEDS_FOLLOWUP, THRESHOLDS.STALE)
    
    return needsFollowup
  } catch (error) {
    console.error('Error detecting prospects needing followup:', error.message)
    return []
  }
}

/**
 * Detect stale proposals (COI requests that are is_prospect=1 and haven't changed status)
 * @returns {Array} List of stale proposals
 */
export function detectStaleProposals() {
  try {
    const staleProposals = db.prepare(`
      SELECT 
        r.*,
        c.client_name,
        ls.source_name as lead_source_name,
        p.prospect_name,
        CAST(julianday('now') - julianday(COALESCE(r.last_activity_at, r.updated_at, r.created_at)) AS INTEGER) as days_inactive
      FROM coi_requests r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN lead_sources ls ON r.lead_source_id = ls.id
      LEFT JOIN prospects p ON r.prospect_id = p.id
      WHERE r.is_prospect = 1
        AND r.status NOT IN ('Approved', 'Rejected', 'Active', 'Client Accepted', 'Cancelled')
        AND r.stale_detected_at IS NULL
        AND julianday('now') - julianday(COALESCE(r.last_activity_at, r.updated_at, r.created_at)) >= ?
      ORDER BY days_inactive DESC
    `).all(THRESHOLDS.STALE_PROPOSAL)
    
    return staleProposals
  } catch (error) {
    console.error('Error detecting stale proposals:', error.message)
    return []
  }
}

/**
 * Mark prospect as stale
 * @param {number} prospectId - Prospect ID
 * @param {string} reason - Optional reason
 */
export function markProspectAsStale(prospectId, reason = LOST_REASONS.STALE) {
  try {
    const prospect = db.prepare('SELECT * FROM prospects WHERE id = ?').get(prospectId)
    if (!prospect) return null
    
    db.prepare(`
      UPDATE prospects 
      SET stale_detected_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(prospectId)
    
    // Log funnel event
    logFunnelEvent({
      prospectId,
      coiRequestId: null,
      fromStage: null,
      toStage: 'stale_detected',
      userId: null,
      userRole: 'system',
      notes: `Prospect marked as stale: ${reason}`,
      metadata: { reason, auto_detected: true }
    })
    
    console.log(`✅ Marked prospect ${prospectId} as stale`)
    return { prospectId, status: 'stale' }
  } catch (error) {
    console.error('Error marking prospect as stale:', error.message)
    return null
  }
}

/**
 * Mark proposal as stale
 * @param {number} coiRequestId - COI request ID
 */
export function markProposalAsStale(coiRequestId) {
  try {
    const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(coiRequestId)
    if (!request) return null
    
    db.prepare(`
      UPDATE coi_requests 
      SET stale_detected_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(coiRequestId)
    
    // Log funnel event
    logFunnelEvent({
      prospectId: request.prospect_id,
      coiRequestId,
      fromStage: request.status?.toLowerCase().replace(/ /g, '_'),
      toStage: 'stale_detected',
      userId: null,
      userRole: 'system',
      notes: `Proposal marked as stale after ${THRESHOLDS.STALE_PROPOSAL} days without activity`,
      metadata: { auto_detected: true, previous_status: request.status }
    })
    
    console.log(`✅ Marked proposal ${coiRequestId} as stale`)
    return { coiRequestId, status: 'stale' }
  } catch (error) {
    console.error('Error marking proposal as stale:', error.message)
    return null
  }
}

/**
 * Mark prospect as lost (manual or rejection-based)
 * @param {number} prospectId - Prospect ID
 * @param {string} reason - Lost reason (from LOST_REASONS)
 * @param {string} stage - Stage at which lost
 * @param {number} userId - User making the change
 */
export function markProspectAsLost(prospectId, reason, stage = null, userId = null) {
  try {
    const prospect = db.prepare('SELECT * FROM prospects WHERE id = ?').get(prospectId)
    if (!prospect) return null
    
    db.prepare(`
      UPDATE prospects 
      SET status = 'Inactive',
          lost_reason = ?,
          lost_at_stage = ?,
          lost_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reason, stage, prospectId)
    
    // Log funnel event
    logFunnelEvent({
      prospectId,
      coiRequestId: null,
      fromStage: stage,
      toStage: FUNNEL_STAGES.LOST,
      userId,
      userRole: null,
      notes: `Prospect marked as lost: ${reason}`,
      metadata: { lost_reason: reason, lost_at_stage: stage }
    })
    
    console.log(`✅ Marked prospect ${prospectId} as lost: ${reason}`)
    return { prospectId, status: 'lost', reason }
  } catch (error) {
    console.error('Error marking prospect as lost:', error.message)
    return null
  }
}

/**
 * Update last activity timestamp for a prospect
 * @param {number} prospectId - Prospect ID
 */
export function updateProspectActivity(prospectId) {
  try {
    db.prepare(`
      UPDATE prospects 
      SET last_activity_at = CURRENT_TIMESTAMP,
          stale_detected_at = NULL,
          stale_notification_sent_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(prospectId)
    return true
  } catch (error) {
    console.error('Error updating prospect activity:', error.message)
    return false
  }
}

/**
 * Update last activity timestamp for a COI request
 * @param {number} coiRequestId - COI request ID
 */
export function updateCoiRequestActivity(coiRequestId) {
  try {
    db.prepare(`
      UPDATE coi_requests 
      SET last_activity_at = CURRENT_TIMESTAMP,
          stale_detected_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(coiRequestId)
    return true
  } catch (error) {
    console.error('Error updating COI request activity:', error.message)
    return false
  }
}

/**
 * Run the stale detection job
 * This is designed to be called by a scheduler (cron job)
 * @returns {Object} Summary of detected stale items
 */
export function runStaleDetectionJob() {
  console.log('🔍 Running stale prospect detection job...')
  
  const results = {
    staleProspects: [],
    needsFollowup: [],
    staleProposals: [],
    timestamp: new Date().toISOString()
  }
  
  try {
    // 1. Detect and mark stale prospects
    const staleProspects = detectStaleProspects()
    for (const prospect of staleProspects) {
      const result = markProspectAsStale(prospect.id)
      if (result) {
        results.staleProspects.push({
          id: prospect.id,
          name: prospect.prospect_name,
          days_inactive: prospect.days_inactive
        })
      }
    }
    
    // 2. Detect prospects needing follow-up (just flag, don't mark stale)
    const needsFollowup = detectProspectsNeedingFollowup()
    results.needsFollowup = needsFollowup.map(p => ({
      id: p.id,
      name: p.prospect_name,
      days_inactive: p.days_inactive
    }))
    
    // 3. Detect and mark stale proposals
    const staleProposals = detectStaleProposals()
    for (const proposal of staleProposals) {
      const result = markProposalAsStale(proposal.id)
      if (result) {
        results.staleProposals.push({
          id: proposal.id,
          request_id: proposal.request_id,
          client_name: proposal.client_name,
          days_inactive: proposal.days_inactive
        })
      }
    }
    
    console.log(`✅ Stale detection complete:`)
    console.log(`   - ${results.staleProspects.length} prospects marked stale`)
    console.log(`   - ${results.needsFollowup.length} prospects need follow-up`)
    console.log(`   - ${results.staleProposals.length} proposals marked stale`)
    
    return results
  } catch (error) {
    console.error('Error in stale detection job:', error.message)
    results.error = error.message
    return results
  }
}

/**
 * Get stale detection summary for dashboard
 * @returns {Object} Summary statistics
 */
export function getStaleDetectionSummary() {
  try {
    const summary = {
      stale_prospects: db.prepare(`
        SELECT COUNT(*) as count FROM prospects 
        WHERE stale_detected_at IS NOT NULL AND status = 'Active'
      `).get()?.count || 0,
      
      needs_followup: db.prepare(`
        SELECT COUNT(*) as count FROM prospects 
        WHERE status = 'Active'
          AND stale_detected_at IS NULL
          AND julianday('now') - julianday(COALESCE(last_activity_at, updated_at, created_at)) >= ?
          AND julianday('now') - julianday(COALESCE(last_activity_at, updated_at, created_at)) < ?
      `).get(THRESHOLDS.NEEDS_FOLLOWUP, THRESHOLDS.STALE)?.count || 0,
      
      stale_proposals: db.prepare(`
        SELECT COUNT(*) as count FROM coi_requests 
        WHERE is_prospect = 1 
          AND stale_detected_at IS NOT NULL
          AND status NOT IN ('Approved', 'Rejected', 'Active', 'Cancelled')
      `).get()?.count || 0,
      
      lost_prospects_this_month: db.prepare(`
        SELECT COUNT(*) as count FROM prospects 
        WHERE status = 'Inactive'
          AND lost_date >= date('now', 'start of month')
      `).get()?.count || 0,
      
      thresholds: THRESHOLDS
    }
    
    return summary
  } catch (error) {
    console.error('Error getting stale detection summary:', error.message)
    return { error: error.message }
  }
}

/**
 * Get lost prospects analysis for reporting
 * @param {string} dateFrom - Start date
 * @param {string} dateTo - End date
 * @returns {Object} Lost prospects analysis
 */
export function getLostProspectsAnalysis(dateFrom = null, dateTo = null) {
  try {
    let dateFilter = ''
    const params = []
    
    if (dateFrom) {
      dateFilter += ' AND p.lost_date >= ?'
      params.push(dateFrom)
    }
    if (dateTo) {
      dateFilter += ' AND p.lost_date <= ?'
      params.push(dateTo + ' 23:59:59')
    }
    
    // By reason
    const byReason = db.prepare(`
      SELECT 
        COALESCE(lost_reason, 'unknown') as reason,
        COUNT(*) as count
      FROM prospects p
      WHERE status = 'Inactive' AND lost_date IS NOT NULL
      ${dateFilter}
      GROUP BY lost_reason
      ORDER BY count DESC
    `).all(...params)
    
    // By stage
    const byStage = db.prepare(`
      SELECT 
        COALESCE(lost_at_stage, 'unknown') as stage,
        COUNT(*) as count
      FROM prospects p
      WHERE status = 'Inactive' AND lost_date IS NOT NULL
      ${dateFilter}
      GROUP BY lost_at_stage
      ORDER BY count DESC
    `).all(...params)
    
    // By lead source
    const byLeadSource = db.prepare(`
      SELECT 
        COALESCE(ls.source_name, 'Unknown') as lead_source,
        COUNT(*) as count
      FROM prospects p
      LEFT JOIN lead_sources ls ON p.lead_source_id = ls.id
      WHERE p.status = 'Inactive' AND p.lost_date IS NOT NULL
      ${dateFilter}
      GROUP BY ls.source_name
      ORDER BY count DESC
    `).all(...params)
    
    // Total lost
    const total = db.prepare(`
      SELECT COUNT(*) as count FROM prospects p
      WHERE status = 'Inactive' AND lost_date IS NOT NULL
      ${dateFilter}
    `).get(...params)?.count || 0
    
    return {
      total_lost: total,
      by_reason: byReason,
      by_stage: byStage,
      by_lead_source: byLeadSource
    }
  } catch (error) {
    console.error('Error getting lost prospects analysis:', error.message)
    return { error: error.message }
  }
}

export default {
  LOST_REASONS,
  THRESHOLDS,
  detectStaleProspects,
  detectProspectsNeedingFollowup,
  detectStaleProposals,
  markProspectAsStale,
  markProposalAsStale,
  markProspectAsLost,
  updateProspectActivity,
  updateCoiRequestActivity,
  runStaleDetectionJob,
  getStaleDetectionSummary,
  getLostProspectsAnalysis
}
