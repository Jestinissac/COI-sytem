import { getDatabase } from '../database/init.js'
import { calculateSLAStatus, SLA_STATUS } from './slaService.js'
import { emitEvent, SLA_EVENTS } from './eventBus.js'

/**
 * SLA Monitor Service
 * Scheduled service that checks for SLA breaches and emits events
 */

// Track last known SLA status to detect changes
const lastKnownStatus = new Map()

/**
 * Check all pending requests for SLA status changes
 * Called by scheduler every 15 minutes (production) or on-demand (prototype)
 */
export async function checkAllPendingRequests() {
  const db = getDatabase()
  
  // Get all pending requests that need SLA monitoring
  const pendingStatuses = [
    'Pending Director Approval',
    'Pending Compliance',
    'Pending Partner',
    'Pending Finance',
    'Draft',
    'More Info Requested'
  ]
  
  const requests = db.prepare(`
    SELECT 
      r.*,
      c.client_name,
      u.name as requester_name,
      u.email as requester_email
    FROM coi_requests r
    LEFT JOIN clients c ON r.client_id = c.id
    LEFT JOIN users u ON r.requester_id = u.id
    WHERE r.status IN (${pendingStatuses.map(() => '?').join(',')})
  `).all(...pendingStatuses)
  
  const results = {
    checked: requests.length,
    warnings: [],
    critical: [],
    breached: [],
    resolved: []
  }
  
  for (const request of requests) {
    const checkResult = await checkRequest(request)
    
    if (checkResult.eventEmitted) {
      if (checkResult.currentStatus === SLA_STATUS.WARNING) {
        results.warnings.push(request.request_id)
      } else if (checkResult.currentStatus === SLA_STATUS.CRITICAL) {
        results.critical.push(request.request_id)
      } else if (checkResult.currentStatus === SLA_STATUS.BREACHED) {
        results.breached.push(request.request_id)
      }
    }
  }
  
  console.log(`[SLA Monitor] Checked ${results.checked} requests:`, {
    warnings: results.warnings.length,
    critical: results.critical.length,
    breached: results.breached.length
  })
  
  return results
}

/**
 * Check single request and emit event if status changed
 */
export async function checkRequest(request) {
  const requestId = request.id || request.request_id
  const previousStatus = lastKnownStatus.get(requestId)
  
  // Calculate current SLA status
  const slaStatus = calculateSLAStatus(request)
  const currentStatus = slaStatus.status
  
  // Update last known status
  lastKnownStatus.set(requestId, currentStatus)
  
  // Check if status changed to a worse state
  const statusHierarchy = {
    [SLA_STATUS.ON_TRACK]: 0,
    [SLA_STATUS.WARNING]: 1,
    [SLA_STATUS.CRITICAL]: 2,
    [SLA_STATUS.BREACHED]: 3
  }
  
  const previousLevel = statusHierarchy[previousStatus] || 0
  const currentLevel = statusHierarchy[currentStatus]
  
  let eventEmitted = false
  
  // Only emit events when status degrades (gets worse)
  if (currentLevel > previousLevel) {
    const eventPayload = {
      requestId: request.id, // Database ID for notifications
      requestNumber: request.request_id, // Display ID
      clientName: request.client_name,
      workflowStage: request.status,
      targetHours: slaStatus.targetHours,
      actualHours: slaStatus.hoursElapsed,
      hoursRemaining: slaStatus.hoursRemaining,
      percentUsed: slaStatus.percentUsed,
      breachTime: slaStatus.breachTime,
      requesterId: request.requester_id,
      requesterEmail: request.requester_email,
      timestamp: new Date().toISOString()
    }
    
    // Emit appropriate event
    if (currentStatus === SLA_STATUS.WARNING && previousLevel < 1) {
      emitEvent(SLA_EVENTS.WARNING, eventPayload)
      eventEmitted = true
      console.log(`[SLA Monitor] WARNING: Request ${request.request_id} at ${slaStatus.percentUsed}% of SLA`)
    } else if (currentStatus === SLA_STATUS.CRITICAL && previousLevel < 2) {
      emitEvent(SLA_EVENTS.CRITICAL, eventPayload)
      eventEmitted = true
      console.log(`[SLA Monitor] CRITICAL: Request ${request.request_id} at ${slaStatus.percentUsed}% of SLA`)
    } else if (currentStatus === SLA_STATUS.BREACHED && previousLevel < 3) {
      emitEvent(SLA_EVENTS.BREACH, eventPayload)
      eventEmitted = true
      logBreach(request, slaStatus)
      console.log(`[SLA Monitor] BREACHED: Request ${request.request_id} exceeded SLA by ${Math.abs(slaStatus.hoursRemaining)}h`)
    }
  }
  
  return {
    previousStatus,
    currentStatus,
    slaStatus,
    eventEmitted
  }
}

/**
 * Log breach to sla_breach_log table
 */
export function logBreach(request, slaStatus) {
  const db = getDatabase()
  
  try {
    // Check if breach already logged for this request/stage
    const existing = db.prepare(`
      SELECT id FROM sla_breach_log 
      WHERE coi_request_id = ? 
      AND workflow_stage = ? 
      AND resolved_at IS NULL
    `).get(request.id, request.status)
    
    if (existing) {
      // Already logged
      return existing.id
    }
    
    const result = db.prepare(`
      INSERT INTO sla_breach_log (
        coi_request_id, 
        workflow_stage, 
        breach_type, 
        target_hours, 
        actual_hours,
        notified_users
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      request.id,
      request.status,
      'BREACHED',
      slaStatus.targetHours,
      slaStatus.hoursElapsed,
      JSON.stringify([request.requester_id])
    )
    
    return result.lastInsertRowid
  } catch (error) {
    console.error('[SLA Monitor] Error logging breach:', error.message)
    return null
  }
}

/**
 * Mark breach as resolved when request moves to next stage
 */
export function resolveBreach(requestId, workflowStage = null) {
  const db = getDatabase()
  
  try {
    let query = `
      UPDATE sla_breach_log 
      SET resolved_at = CURRENT_TIMESTAMP 
      WHERE coi_request_id = ? AND resolved_at IS NULL
    `
    const params = [requestId]
    
    if (workflowStage) {
      query += ' AND workflow_stage = ?'
      params.push(workflowStage)
    }
    
    const result = db.prepare(query).run(...params)
    
    if (result.changes > 0) {
      // Emit resolved event
      emitEvent(SLA_EVENTS.RESOLVED, {
        requestId,
        workflowStage,
        resolvedAt: new Date().toISOString()
      })
      
      console.log(`[SLA Monitor] Resolved ${result.changes} breach(es) for request ${requestId}`)
    }
    
    return result.changes
  } catch (error) {
    console.error('[SLA Monitor] Error resolving breach:', error.message)
    return 0
  }
}

/**
 * Get breach history for a request
 */
export function getBreachHistory(requestId) {
  const db = getDatabase()
  
  return db.prepare(`
    SELECT * FROM sla_breach_log 
    WHERE coi_request_id = ?
    ORDER BY detected_at DESC
  `).all(requestId)
}

/**
 * Get all unresolved breaches
 */
export function getUnresolvedBreaches() {
  const db = getDatabase()
  
  return db.prepare(`
    SELECT 
      b.*,
      r.request_id,
      r.status,
      c.client_name,
      u.name as requester_name
    FROM sla_breach_log b
    JOIN coi_requests r ON b.coi_request_id = r.id
    LEFT JOIN clients c ON r.client_id = c.id
    LEFT JOIN users u ON r.requester_id = u.id
    WHERE b.resolved_at IS NULL
    ORDER BY b.detected_at ASC
  `).all()
}

/**
 * Get breach statistics
 */
export function getBreachStats(startDate, endDate) {
  const db = getDatabase()
  
  return db.prepare(`
    SELECT 
      workflow_stage,
      COUNT(*) as total_breaches,
      SUM(CASE WHEN resolved_at IS NOT NULL THEN 1 ELSE 0 END) as resolved_breaches,
      AVG(actual_hours - target_hours) as avg_hours_overdue,
      AVG(CASE 
        WHEN resolved_at IS NOT NULL 
        THEN (julianday(resolved_at) - julianday(detected_at)) * 24 
        ELSE NULL 
      END) as avg_resolution_hours
    FROM sla_breach_log
    WHERE detected_at >= ? AND detected_at <= ?
    GROUP BY workflow_stage
  `).all(startDate, endDate)
}

/**
 * Clear cached status (for testing or reset)
 */
export function clearCache() {
  lastKnownStatus.clear()
}

export default {
  checkAllPendingRequests,
  checkRequest,
  logBreach,
  resolveBreach,
  getBreachHistory,
  getUnresolvedBreaches,
  getBreachStats,
  clearCache
}
