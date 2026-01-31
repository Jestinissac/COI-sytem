import { appendFileSync } from 'fs'
import { getDatabase } from '../database/init.js'
import { calculatePriority, PRIORITY_LEVEL } from './priorityService.js'
import { getApproversFromAD } from './adIntegrationService.js'

const db = getDatabase()
const USE_AD_APPROVERS = process.env.USE_AD_APPROVERS === 'true' || process.env.USE_AD_APPROVERS === '1'

// ============================================================================
// NOTIFICATION BATCHING CONFIGURATION
// ============================================================================
const BATCH_CONFIG = {
  windowMinutes: 5,           // Batch window in minutes
  urgentTypes: [              // These bypass batching
    'REJECTION',
    'EXPIRING_TODAY',
    'MORE_INFO_REQUESTED'
  ]
}

// ============================================================================
// NOTIFICATION FILTER CONFIGURATION
// ============================================================================
const NOTIFICATION_FILTER_CONFIG = {
  // Layer 1: SLA filtering
  slaImmediateThresholds: ['BREACH', 'CRITICAL'],
  slaBatchThresholds: ['WARNING'],
  
  // Layer 2: Priority filtering
  enablePriorityFiltering: true,
  maxDigestItems: 10,  // If batch > 10, filter LOW priority
  minPriorityToInclude: 'MEDIUM',  // Don't include LOW if batch is large
  
  // ML integration
  useMLPriority: false,  // Set to true when ML model is active
  mlMinAccuracy: 0.7  // Minimum accuracy to use ML model
}

// ============================================================================
// NOTIFICATION BATCHING FUNCTIONS
// ============================================================================

/**
 * Queue a notification for batching
 * Urgent notifications are sent immediately, others are batched
 */
export function queueNotification(recipientId, notificationType, payload, isUrgent = false) {
  try {
    // Ensure table exists
    ensureNotificationQueueTable()
    
    // Check if this is an urgent type
    const shouldBypass = isUrgent || BATCH_CONFIG.urgentTypes.includes(notificationType)
    
    if (shouldBypass) {
      // Send immediately
      const recipient = db.prepare('SELECT * FROM users WHERE id = ?').get(recipientId)
      if (recipient && recipient.email) {
        sendEmail(recipient.email, payload.subject, payload.body, payload.metadata || {})
        
        // Track stats
        updateNotificationStats({ urgent: 1, sent: 1, generated: 1 })
      }
      return { queued: false, sentImmediately: true }
    }
    
    // Queue for batching
    const batchId = getBatchId()
    db.prepare(`
      INSERT INTO notification_queue (recipient_id, notification_type, is_urgent, payload, batch_id, sent)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(
      recipientId,
      notificationType,
      isUrgent ? 1 : 0,
      JSON.stringify(payload),
      batchId
    )
    
    // Track stats
    updateNotificationStats({ generated: 1 })
    
    return { queued: true, batchId }
  } catch (error) {
    console.error('Error queuing notification:', error)
    return { queued: false, error: error.message }
  }
}

/**
 * Sort notifications by priority score
 * Batch fetches request data for performance optimization
 */
async function sortNotificationsByPriority(notifications) {
  if (!NOTIFICATION_FILTER_CONFIG.enablePriorityFiltering) {
    // If priority filtering is disabled, sort by created_at only
    return notifications.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }
  
  try {
    // Extract requestIds from all notifications
    const requestIds = notifications
      .map(n => {
        try {
          const payload = JSON.parse(n.payload)
          return payload.metadata?.requestId
        } catch (e) {
          return null
        }
      })
      .filter(Boolean)
    
    // Batch fetch all requests in one query (performance optimization)
    let requests = []
    if (requestIds.length > 0) {
      const placeholders = requestIds.map(() => '?').join(',')
      requests = db.prepare(`
        SELECT * FROM coi_requests 
        WHERE id IN (${placeholders})
      `).all(...requestIds)
    }
    
    // Create map for O(1) lookup
    const requestMap = new Map(requests.map(r => [r.id, r]))
    
    // Calculate priority for each notification
    const notificationsWithPriority = await Promise.all(notifications.map(async n => {
      try {
        const payload = JSON.parse(n.payload)
        const requestId = payload.metadata?.requestId
        const slaStatus = payload.metadata?.slaStatus || null
        
        if (requestId && requestMap.has(requestId)) {
          const request = requestMap.get(requestId)
          const priority = await calculatePriority(request)
          return {
            notification: n,
            priority: priority.score,
            priorityLevel: priority.level,
            slaStatus: slaStatus,
            requestId: requestId
          }
        }
        
        // No requestId or request not found - sort by created_at
        return {
          notification: n,
          priority: 0,
          priorityLevel: PRIORITY_LEVEL.LOW,
          slaStatus: slaStatus,
          requestId: null
        }
      } catch (e) {
        // Invalid payload - sort by created_at
        return {
          notification: n,
          priority: 0,
          priorityLevel: PRIORITY_LEVEL.LOW,
          slaStatus: null,
          requestId: null
        }
      }
    }))
    
    // Sort by: priority score (desc), SLA status severity (BREACH > CRITICAL > WARNING), created_at (asc)
    const slaSeverity = { 'BREACH': 3, 'CRITICAL': 2, 'WARNING': 1, null: 0 }
    
    notificationsWithPriority.sort((a, b) => {
      // First by priority score (highest first)
      if (b.priority !== a.priority) {
        return b.priority - a.priority
      }
      
      // Then by SLA status severity (BREACH > CRITICAL > WARNING)
      const aSeverity = slaSeverity[a.slaStatus] || 0
      const bSeverity = slaSeverity[b.slaStatus] || 0
      if (bSeverity !== aSeverity) {
        return bSeverity - aSeverity
      }
      
      // Finally by created_at (oldest first)
      return new Date(a.notification.created_at) - new Date(b.notification.created_at)
    })
    
    // Return sorted notifications
    return notificationsWithPriority.map(item => item.notification)
  } catch (error) {
    console.error('Error sorting notifications by priority:', error)
    // Fallback to created_at sorting
    return notifications.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }
}

/**
 * Filter notifications by priority if batch is large
 * Assumes notifications are already sorted by priority
 */
async function filterNotificationsByPriority(notifications, maxItems = null) {
  if (!NOTIFICATION_FILTER_CONFIG.enablePriorityFiltering) {
    return notifications
  }
  
  const maxDigestItems = maxItems || NOTIFICATION_FILTER_CONFIG.maxDigestItems
  
  // If batch is small, include all
  if (notifications.length <= maxDigestItems) {
    return notifications
  }
  
  // For large batches, filter out LOW priority
  const minPriority = NOTIFICATION_FILTER_CONFIG.minPriorityToInclude
  
  // Priority order for comparison
  const priorityOrder = {
    [PRIORITY_LEVEL.CRITICAL]: 4,
    [PRIORITY_LEVEL.HIGH]: 3,
    [PRIORITY_LEVEL.MEDIUM]: 2,
    [PRIORITY_LEVEL.LOW]: 1
  }
  
  const minPriorityOrder = priorityOrder[minPriority] || 2
  
  // Extract requestIds for batch fetch
  const requestIds = notifications
    .map(n => {
      try {
        const payload = JSON.parse(n.payload)
        return payload.metadata?.requestId
      } catch (e) {
        return null
      }
    })
    .filter(Boolean)
  
  // Batch fetch all requests
  let requestMap = new Map()
  if (requestIds.length > 0) {
    const placeholders = requestIds.map(() => '?').join(',')
    const requests = db.prepare(`
      SELECT * FROM coi_requests 
      WHERE id IN (${placeholders})
    `).all(...requestIds)
    requestMap = new Map(requests.map(r => [r.id, r]))
  }
  
  // Filter: keep all above min priority, plus top maxDigestItems from min priority and below
  const filtered = []
  let keptCount = 0
  
  for (const n of notifications) {
    try {
      const payload = JSON.parse(n.payload)
      const requestId = payload.metadata?.requestId
      
      if (!requestId || !requestMap.has(requestId)) {
        // No requestId or request not found - keep if within top maxDigestItems
        if (keptCount < maxDigestItems) {
          filtered.push(n)
          keptCount++
        }
        continue
      }
      
      // Calculate priority
      const request = requestMap.get(requestId)
      const priority = await calculatePriority(request)
      const priorityOrderValue = priorityOrder[priority.level] || 1
      
      // Keep if above min priority
      if (priorityOrderValue >= minPriorityOrder) {
        filtered.push(n)
        keptCount++
      } else if (keptCount < maxDigestItems) {
        // For LOW priority, only keep if within top maxDigestItems
        filtered.push(n)
        keptCount++
      }
    } catch (e) {
      // Error parsing - keep if within top maxDigestItems
      if (keptCount < maxDigestItems) {
        filtered.push(n)
        keptCount++
      }
    }
  }
  
  return filtered
}

/**
 * Flush notification batch - send aggregated emails
 * Called by scheduler or manually
 */
export async function flushNotificationBatch() {
  try {
    ensureNotificationQueueTable()
    
    // Get all unsent notifications grouped by recipient
    const pendingByRecipient = db.prepare(`
      SELECT 
        recipient_id,
        GROUP_CONCAT(id) as notification_ids,
        COUNT(*) as count
      FROM notification_queue
      WHERE sent = 0
      GROUP BY recipient_id
    `).all()
    
    let digestsSent = 0
    let notificationsSent = 0
    
    for (const group of pendingByRecipient) {
      const recipient = db.prepare('SELECT * FROM users WHERE id = ?').get(group.recipient_id)
      if (!recipient || !recipient.email) continue
      
      // Get all notifications for this recipient
      let notifications = db.prepare(`
        SELECT * FROM notification_queue
        WHERE recipient_id = ? AND sent = 0
      `).all(group.recipient_id)
      
      if (notifications.length === 0) continue
      
      // Sort by priority (Layer 2: ML Priority Filtering)
      notifications = await sortNotificationsByPriority(notifications)
      
      // Filter by priority if batch is large (optional)
      notifications = await filterNotificationsByPriority(notifications)
      
      // Build digest email
      const digestSubject = `COI System Digest - ${notifications.length} notification${notifications.length > 1 ? 's' : ''}`
      const digestBody = await buildDigestBody(recipient.name, notifications)
      
      // Send digest
      sendEmail(recipient.email, digestSubject, digestBody, { isDigest: true, count: notifications.length })
      
      // Mark as sent
      const ids = notifications.map(n => n.id)
      const placeholders = ids.map(() => '?').join(',')
      db.prepare(`
        UPDATE notification_queue 
        SET sent = 1, sent_at = CURRENT_TIMESTAMP 
        WHERE id IN (${placeholders})
      `).run(...ids)
      
      digestsSent++
      notificationsSent += notifications.length
    }
    
    // Update stats
    if (digestsSent > 0) {
      updateNotificationStats({ sent: notificationsSent, digests: digestsSent, batched: notificationsSent })
    }
    
    return {
      success: true,
      digestsSent,
      notificationsSent,
      noiseReduction: notificationsSent > 0 
        ? Math.round((1 - digestsSent / notificationsSent) * 100) + '%'
        : '0%'
    }
  } catch (error) {
    console.error('Error flushing notification batch:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get noise reduction statistics
 */
export function getNoiseReductionStats(days = 7) {
  try {
    ensureNotificationQueueTable()
    
    // Get stats from notification_stats table
    const stats = db.prepare(`
      SELECT 
        SUM(total_generated) as total_generated,
        SUM(total_sent) as total_sent,
        SUM(urgent_sent) as urgent_sent,
        SUM(batched_count) as batched_count,
        SUM(digest_count) as digest_count
      FROM notification_stats
      WHERE stat_date >= DATE('now', '-' || ? || ' days')
    `).get(days)
    
    // Get pending count
    const pending = db.prepare(`
      SELECT COUNT(*) as count FROM notification_queue WHERE sent = 0
    `).get()
    
    const totalGenerated = stats?.total_generated || 0
    const totalSent = stats?.total_sent || 0
    const digestCount = stats?.digest_count || 0
    
    // Calculate noise reduction
    let noiseReduction = '0%'
    if (totalGenerated > 0 && digestCount > 0) {
      const reduction = Math.round((1 - digestCount / totalGenerated) * 100)
      noiseReduction = reduction + '%'
    }
    
    return {
      period: `Last ${days} days`,
      totalGenerated,
      totalSent,
      urgentSent: stats?.urgent_sent || 0,
      batchedCount: stats?.batched_count || 0,
      digestCount,
      pendingInQueue: pending?.count || 0,
      noiseReduction,
      efficiency: totalGenerated > 0 
        ? `${totalGenerated} notifications → ${digestCount} digests`
        : 'No data'
    }
  } catch (error) {
    console.error('Error getting noise reduction stats:', error)
    return {
      period: `Last ${days} days`,
      totalGenerated: 0,
      totalSent: 0,
      noiseReduction: '0%',
      error: error.message
    }
  }
}

/**
 * Build digest email body from multiple notifications
 * Groups by priority level and shows priority scores
 */
async function buildDigestBody(recipientName, notifications) {
  // Group notifications by priority level
  const priorityGroups = {
    [PRIORITY_LEVEL.CRITICAL]: [],
    [PRIORITY_LEVEL.HIGH]: [],
    [PRIORITY_LEVEL.MEDIUM]: [],
    [PRIORITY_LEVEL.LOW]: []
  }
  
  // Process each notification and calculate priority
  for (const n of notifications) {
    try {
      const payload = JSON.parse(n.payload)
      const requestId = payload.metadata?.requestId
      const slaStatus = payload.metadata?.slaStatus || null
      
      let priorityLevel = PRIORITY_LEVEL.LOW
      let priorityScore = 0
      let topFactors = []
      
      // Calculate priority if requestId exists
      if (requestId) {
        const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(requestId)
        if (request) {
          const priority = await calculatePriority(request)
          priorityLevel = priority.level
          priorityScore = priority.score
          topFactors = priority.topFactors || []
        }
      }
      
      priorityGroups[priorityLevel].push({
        notification: n,
        payload: payload,
        priorityScore: priorityScore,
        topFactors: topFactors,
        slaStatus: slaStatus
      })
    } catch (e) {
      // Error parsing - add to LOW priority
      try {
        const payload = JSON.parse(n.payload)
        priorityGroups[PRIORITY_LEVEL.LOW].push({
          notification: n,
          payload: payload,
          priorityScore: 0,
          topFactors: [],
          slaStatus: null
        })
      } catch (e2) {
        // Skip invalid notifications
        console.error('Error processing notification for digest:', e2)
      }
    }
  }
  
  let body = `Dear ${recipientName},\n\n`
  body += `Here is your COI System digest with ${notifications.length} notification${notifications.length > 1 ? 's' : ''}:\n\n`
  
  // Priority level labels
  const priorityLabels = {
    [PRIORITY_LEVEL.CRITICAL]: '🔴 CRITICAL PRIORITY',
    [PRIORITY_LEVEL.HIGH]: '🟠 HIGH PRIORITY',
    [PRIORITY_LEVEL.MEDIUM]: '🟡 MEDIUM PRIORITY',
    [PRIORITY_LEVEL.LOW]: '⚪ LOW PRIORITY'
  }
  
  // Build sections by priority level (highest first)
  const priorityOrder = [
    PRIORITY_LEVEL.CRITICAL,
    PRIORITY_LEVEL.HIGH,
    PRIORITY_LEVEL.MEDIUM,
    PRIORITY_LEVEL.LOW
  ]
  
  for (const level of priorityOrder) {
    const items = priorityGroups[level]
    if (items.length === 0) continue
    
    body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    body += `${priorityLabels[level]} (${items.length})\n`
    body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
    
    // Sort items within group by priority score (highest first), then by SLA status
    const slaSeverity = { 'BREACH': 3, 'CRITICAL': 2, 'WARNING': 1, null: 0 }
    items.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore
      }
      const aSeverity = slaSeverity[a.slaStatus] || 0
      const bSeverity = slaSeverity[b.slaStatus] || 0
      return bSeverity - aSeverity
    })
    
    items.forEach((item, index) => {
      const payload = item.payload
      body += `${index + 1}. ${payload.subject || 'Notification'}\n`
      
      // Show priority score if available
      if (item.priorityScore > 0) {
        body += `   Priority Score: ${item.priorityScore}/100 (${level})\n`
      }
      
      // Show SLA status if available
      if (item.slaStatus) {
        const slaEmoji = item.slaStatus === 'BREACH' ? '🚨' : item.slaStatus === 'CRITICAL' ? '⚠️' : '⚡'
        body += `   SLA Status: ${slaEmoji} ${item.slaStatus}\n`
      }
      
      // Show top factors if available
      if (item.topFactors && item.topFactors.length > 0) {
        body += `   Top Factors: ${item.topFactors.join(', ')}\n`
      }
      
      if (payload.metadata?.requestId) {
        body += `   Request: ${payload.metadata.requestId}\n`
      }
      if (payload.metadata?.clientName || payload.clientName) {
        body += `   Client: ${payload.metadata?.clientName || payload.clientName}\n`
      }
      body += '\n'
    })
  }
  
  body += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  body += `Log in to the COI system to take action:\n`
  body += `http://localhost:5173/coi\n\n`
  body += `Best regards,\nCOI System`
  
  return body
}

/**
 * Get batch ID for current time window
 */
function getBatchId() {
  const now = new Date()
  const windowStart = new Date(now)
  windowStart.setMinutes(Math.floor(now.getMinutes() / BATCH_CONFIG.windowMinutes) * BATCH_CONFIG.windowMinutes)
  windowStart.setSeconds(0)
  windowStart.setMilliseconds(0)
  return `batch-${windowStart.toISOString().replace(/[:.]/g, '-')}`
}

/**
 * Update notification statistics
 */
function updateNotificationStats(updates) {
  try {
    ensureNotificationStatsTable()
    
    const today = new Date().toISOString().split('T')[0]
    
    // Upsert stats for today
    const existing = db.prepare('SELECT * FROM notification_stats WHERE stat_date = ?').get(today)
    
    if (existing) {
      db.prepare(`
        UPDATE notification_stats SET
          total_generated = total_generated + ?,
          total_sent = total_sent + ?,
          urgent_sent = urgent_sent + ?,
          batched_count = batched_count + ?,
          digest_count = digest_count + ?
        WHERE stat_date = ?
      `).run(
        updates.generated || 0,
        updates.sent || 0,
        updates.urgent || 0,
        updates.batched || 0,
        updates.digests || 0,
        today
      )
    } else {
      db.prepare(`
        INSERT INTO notification_stats (stat_date, total_generated, total_sent, urgent_sent, batched_count, digest_count)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        today,
        updates.generated || 0,
        updates.sent || 0,
        updates.urgent || 0,
        updates.batched || 0,
        updates.digests || 0
      )
    }
  } catch (error) {
    // Silently fail - stats are not critical
    console.error('Error updating notification stats:', error.message)
  }
}

/**
 * Ensure notification_queue table exists
 */
function ensureNotificationQueueTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_id INTEGER NOT NULL,
      notification_type VARCHAR(100) NOT NULL,
      is_urgent BOOLEAN DEFAULT 0,
      payload TEXT NOT NULL,
      batch_id VARCHAR(50),
      sent BOOLEAN DEFAULT 0,
      sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

/**
 * Ensure notification_stats table exists
 */
function ensureNotificationStatsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stat_date DATE NOT NULL,
      total_generated INTEGER DEFAULT 0,
      total_sent INTEGER DEFAULT 0,
      urgent_sent INTEGER DEFAULT 0,
      batched_count INTEGER DEFAULT 0,
      digest_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(stat_date)
    )
  `)
}

// ============================================================================
// ORIGINAL NOTIFICATION FUNCTIONS (unchanged)
// ============================================================================

export function sendEmail(to, subject, body, metadata = {}) {
  const timestamp = new Date().toISOString()
  
  // Log to console
  console.log('╔════════════════════════════════════════════════════════════════')
  console.log('║ 📧 MOCK EMAIL SENT')
  console.log('╠════════════════════════════════════════════════════════════════')
  console.log(`║ To: ${to}`)
  console.log(`║ Subject: ${subject}`)
  console.log(`║ Time: ${timestamp}`)
  console.log('╠════════════════════════════════════════════════════════════════')
  console.log(`║ Body:`)
  console.log(`║ ${body.replace(/\n/g, '\n║ ')}`)
  console.log('╚════════════════════════════════════════════════════════════════')
  
  // Log to file
  try {
    const logEntry = `[${timestamp}] TO: ${to} | SUBJECT: ${subject}\n`
    appendFileSync('/tmp/coi-emails.log', logEntry)
  } catch (error) {
    console.error('Failed to write email log:', error.message)
  }
  
  return { success: true, message: 'Email sent (mock)' }
}

export function sendApprovalNotification(requestId, approverName, nextRole, restrictions = null) {
  const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(requestId)
  if (!request) return
  
  // Get all approvers for the next role (not just one)
  let query = 'SELECT * FROM users WHERE role = ? AND is_active = 1'
  const params = [nextRole]
  
  // For Director and Compliance, filter by department
  if (nextRole === 'Director' || nextRole === 'Compliance') {
    if (request.department) {
      query += ' AND department = ?'
      params.push(request.department)
    }
  }
  
  const approvers = db.prepare(query).all(...params)
  
  // If no approvers found, escalate to Admin (using existing logic)
  if (approvers.length === 0) {
    console.log(`[Escalation] No active ${nextRole} approvers available${request.department ? ` for department ${request.department}` : ''}. Escalating to Admin.`)
    
    // Notify requester when no approvers are available
    if (requestId) {
      let unavailableQuery = 'SELECT name, unavailable_reason, unavailable_until FROM users WHERE role = ? AND is_active = 0'
      const unavailableParams = [nextRole]
      
      if (request.department && (nextRole === 'Director' || nextRole === 'Compliance')) {
        unavailableQuery += ' AND department = ?'
        unavailableParams.push(request.department)
      }
      
      const unavailableApprovers = db.prepare(unavailableQuery).all(...unavailableParams)
      
      if (unavailableApprovers.length > 0) {
        const firstUnavailable = unavailableApprovers[0]
        sendApproverUnavailableNotification(
          requestId,
          `${unavailableApprovers.length} ${nextRole}(s)`,
          nextRole,
          firstUnavailable.unavailable_reason || 'on leave',
          firstUnavailable.unavailable_until
        )
      }
    }
    
    // Escalate to Admin
    const adminUsers = db.prepare('SELECT * FROM users WHERE role = ? AND is_active = 1').all('Admin')
    if (adminUsers.length > 0) {
      approvers.push(...adminUsers)
    } else {
      return // No admins available either
    }
  }
  
  const restrictionsText = restrictions ? `

⚠️ APPROVED WITH RESTRICTIONS:
${restrictions}

Please ensure these restrictions are noted and followed.` : ''
  
  const subject = `COI Request ${request.request_id} - Pending Your Approval${restrictions ? ' (With Restrictions)' : ''}`
  
  // Notify all approvers
  const results = []
  for (const approver of approvers) {
    const body = `Dear ${approver.name},

A Conflict of Interest request has been approved by ${approverName} and is now pending your review.

Request ID: ${request.request_id}
Department: ${request.department}
Service Type: ${request.service_type}
Current Status: Pending ${nextRole} Approval${restrictionsText}

Please log in to the COI system to review and approve this request:
http://localhost:5173/coi

Best regards,
COI System`

    const result = sendEmail(approver.email, subject, body, { requestId, role: nextRole, restrictions })
    results.push(result)
  }
  
  return { success: true, notified: approvers.length, results }
}

export function sendNeedMoreInfoNotification(requestId, approverName, infoRequired) {
  const request = db.prepare(`
    SELECT r.*, u.name as requester_name, u.email as requester_email
    FROM coi_requests r
    INNER JOIN users u ON r.requester_id = u.id
    WHERE r.id = ?
  `).get(requestId)
  
  if (!request) return
  
  const subject = `COI Request ${request.request_id} - Additional Information Required`
  const body = `Dear ${request.requester_name},

Your Conflict of Interest request requires additional information before it can be processed further.

Request ID: ${request.request_id}
Requested By: ${approverName}

📋 INFORMATION REQUIRED:
${infoRequired}

Please log in to the COI system, update your request with the requested information, and re-submit:
http://localhost:5173/coi

Best regards,
COI System`

  return sendEmail(request.requester_email, subject, body, { requestId, infoRequired })
}

export function sendRejectionNotification(requestId, rejectorName, reason, rejectionType = 'fixable', rejectionCategory = null) {
  const request = db.prepare(`
    SELECT r.*, u.name as requester_name, u.email as requester_email
    FROM coi_requests r
    INNER JOIN users u ON r.requester_id = u.id
    WHERE r.id = ?
  `).get(requestId)
  
  if (!request) return
  
  const isPermanent = rejectionType === 'permanent'
  const subject = `COI Request ${request.request_id} - Rejected${isPermanent ? ' (Final)' : ''}`
  
  // Differentiate message based on rejection type
  const resubmissionGuidance = isPermanent
    ? `This rejection is final and cannot be resubmitted. If circumstances have changed significantly, please create a new COI request.`
    : `You can modify and resubmit this request after addressing the feedback. Log in to the COI system and click "Modify and Resubmit" to update your request.`
  
  // Add rejection category if provided (for Compliance and above)
  const categoryInfo = rejectionCategory ? `\nRejection Category: ${rejectionCategory}` : ''
  
  const body = `Dear ${request.requester_name},

Your Conflict of Interest request has been rejected by ${rejectorName}.

Request ID: ${request.request_id}
Department: ${request.department}
Service Type: ${request.service_type}
Rejection Type: ${isPermanent ? 'Permanent (Final)' : 'Fixable (Can Resubmit)'}${categoryInfo}
Rejection Reason: ${reason}

${resubmissionGuidance}

Please log in to the COI system to review the details:
http://localhost:5173/coi/request/${requestId}

Best regards,
COI System`

  return sendEmail(request.requester_email, subject, body, { requestId, reason, rejectionType, rejectionCategory })
}

export function sendEngagementCodeNotification(requestId, engagementCode) {
  const request = db.prepare(`
    SELECT r.*, u.name as requester_name, u.email as requester_email
    FROM coi_requests r
    INNER JOIN users u ON r.requester_id = u.id
    WHERE r.id = ?
  `).get(requestId)
  
  if (!request) return
  
  // Notify requester
  const requesterSubject = `COI Request ${request.request_id} - Engagement Code Generated`
  const requesterBody = `Dear ${request.requester_name},

Your Conflict of Interest request has been approved and an engagement code has been generated.

Request ID: ${request.request_id}
Engagement Code: ${engagementCode}
Department: ${request.department}
Service Type: ${request.service_type}

You can now proceed with client engagement activities. Please log in to the COI system for full details:
http://localhost:5173/coi

Best regards,
COI System`

  sendEmail(request.requester_email, requesterSubject, requesterBody, { requestId, engagementCode })
  
  // Notify Admin team
  const adminUsers = db.prepare('SELECT * FROM users WHERE role = ?').all('Admin')
  adminUsers.forEach(admin => {
    const adminSubject = `Action Required: Execute Proposal for ${request.request_id}`
    const adminBody = `Dear ${admin.name},

A new engagement code has been generated and requires proposal execution.

Request ID: ${request.request_id}
Engagement Code: ${engagementCode}
Department: ${request.department}
Service Type: ${request.service_type}

Please execute the proposal and update PRMS:
http://localhost:5173/coi/admin

Best regards,
COI System`

    sendEmail(admin.email, adminSubject, adminBody, { requestId, engagementCode })
  })
  
  // Notify Partner (if assigned)
  if (request.partner_approved_by) {
    const partner = db.prepare('SELECT * FROM users WHERE id = ?').get(request.partner_approved_by)
    if (partner && partner.email) {
      const partnerSubject = `Engagement Code Generated - ${request.request_id}`
      const partnerBody = `Dear ${partner.name},

An engagement code has been generated for a COI request that you approved.

Request ID: ${request.request_id}
Engagement Code: ${engagementCode}
Department: ${request.department}
Service Type: ${request.service_type}
Client: ${request.client_name || 'Not specified'}

The engagement code is now available for tracking and monitoring purposes.

Please log in to the COI system for full details:
http://localhost:5173/coi

Best regards,
COI System`

      sendEmail(partner.email, partnerSubject, partnerBody, { requestId, engagementCode })
    }
  }
  
  return { success: true }
}

export function sendProposalExecutedNotification(requestId, projectId) {
  const request = db.prepare(`
    SELECT r.*, u.name as requester_name, u.email as requester_email
    FROM coi_requests r
    INNER JOIN users u ON r.requester_id = u.id
    WHERE r.id = ?
  `).get(requestId)
  
  if (!request) return
  
  const subject = `COI Request ${request.request_id} - Proposal Executed`
  const body = `Dear ${request.requester_name},

The proposal for your Conflict of Interest request has been executed in PRMS.

Request ID: ${request.request_id}
Project ID: ${projectId}
Status: Active Engagement

Your engagement is now active. Please proceed with service delivery according to the approved scope.

Log in to view full details:
http://localhost:5173/coi

Best regards,
COI System`

  return sendEmail(request.requester_email, subject, body, { requestId, projectId })
}

function getNextApprover(department, role, requestId = null) {
  // requestId is optional - only used for sending unavailable notifications
  // First level: AD (when enabled) or local DB; then filter by HRMS status (is_active); second level: backup then escalate
  let candidates = []

  if (USE_AD_APPROVERS) {
    candidates = getApproversFromAD({ department, role })
    // Filter by employee status (active only) — HRMS sync keeps is_active/active up to date
    candidates = candidates.filter(u => (u.is_active === 1 || u.active === 1))
  } else {
    let query = 'SELECT * FROM users WHERE role = ? AND (is_active = 1 OR active = 1)'
    const params = [role]
    if (role === 'Director' || role === 'Compliance') {
      if (department) {
        query += ' AND department = ?'
        params.push(department)
      }
    }
    candidates = db.prepare(query).all(...params)
  }

  if (candidates.length > 0) {
    // Use configurable hierarchy (approval_order): lower number = first in chain; nulls last (Goal 3)
    candidates.sort((a, b) => {
      const ao = a.approval_order != null ? a.approval_order : 999999
      const bo = b.approval_order != null ? b.approval_order : 999999
      return ao - bo
    })
    return candidates[0]
  }

  // No active primary approver - try backup_approver_id from request (second level: local COI config)
  if (requestId) {
    const request = db.prepare('SELECT backup_approver_id FROM coi_requests WHERE id = ?').get(requestId)
    if (request && request.backup_approver_id) {
      const backup = db.prepare('SELECT * FROM users WHERE id = ? AND (active = 1 OR is_active = 1)').get(request.backup_approver_id)
      if (backup) {
        console.log(`[Backup] Using backup approver ${backup.name} (${backup.role}) for request ${requestId}`)
        return backup
      }
    }
  }

  // No active approver found - escalate to Admin
  console.log(`[Escalation] No active ${role} approvers available${department ? ` for department ${department}` : ''}. Escalating to Admin.`)

  if (requestId) {
    let unavailableQuery = 'SELECT name, unavailable_reason, unavailable_until FROM users WHERE role = ? AND (COALESCE(is_active, active, 1) = 0)'
    const unavailableParams = [role]
    if (role === 'Director' || role === 'Compliance') {
      if (department) {
        unavailableQuery += ' AND department = ?'
        unavailableParams.push(department)
      }
    }
    const unavailableApprovers = db.prepare(unavailableQuery).all(...unavailableParams)
    if (unavailableApprovers.length > 0) {
      const firstUnavailable = unavailableApprovers[0]
      sendApproverUnavailableNotification(
        requestId,
        `${unavailableApprovers.length} ${role}(s)`,
        role,
        firstUnavailable.unavailable_reason || 'on leave',
        firstUnavailable.unavailable_until
      )
    }
  }

  const admins = db.prepare(`
    SELECT * FROM users WHERE role IN ('Admin', 'Super Admin') AND (is_active = 1 OR active = 1)
  `).all()
  if (admins.length > 0) {
    sendEscalationNotification(role, department, admins)
    return admins[0]
  }

  const anyAdmin = db.prepare(`SELECT * FROM users WHERE role IN ('Admin', 'Super Admin') LIMIT 1`).get()
  if (anyAdmin) {
    console.warn(`[Critical] No active admins available. Using ${anyAdmin.name} as fallback.`)
    return anyAdmin
  }
  return null
}

// Send escalation notification to admins when approvers are unavailable
function sendEscalationNotification(role, department, admins) {
  const message = `No active ${role} approvers available${department ? ` for department ${department}` : ''}. Manual reassignment may be required.`
  
  console.log(`[Escalation Notification] ${message}`)
  
  for (const admin of admins) {
    // Log for now - actual email would be sent here
    console.log(`[Email] Sending escalation notification to ${admin.email}: ${message}`)
  }
}

// Requirement 5: Notify requester when approver is unavailable
export function sendApproverUnavailableNotification(requestId, approverName, approverRole, unavailableReason, unavailableUntil) {
  const request = db.prepare(`
    SELECT r.*, u.name as requester_name, u.email as requester_email
    FROM coi_requests r
    INNER JOIN users u ON r.requester_id = u.id
    WHERE r.id = ?
  `).get(requestId)
  
  if (!request) return
  
  const untilDate = unavailableUntil ? new Date(unavailableUntil).toLocaleDateString() : 'an unknown date'
  const reasonText = unavailableReason || 'on leave'
  
  const subject = `COI Request ${request.request_id} - Approval Delayed (Approver Unavailable)`
  const body = `Dear ${request.requester_name},

Your Conflict of Interest request is pending approval, but the assigned approver is currently unavailable.

Request ID: ${request.request_id}
Assigned Approver: ${approverName} (${approverRole})
Status: ${reasonText}
Expected Return: ${untilDate}

Your request will be reviewed upon the approver's return. If this is urgent, please contact your department administrator.

Request Details:
- Client: ${request.client_name || 'N/A'}
- Service Type: ${request.service_type || 'N/A'}
- Current Status: ${request.status}

You can view your request at:
http://localhost:5173/coi/request/${request.id}

Best regards,
COI System`

  return sendEmail(request.requester_email, subject, body, { 
    requestId, 
    approverName, 
    approverRole, 
    unavailableReason, 
    unavailableUntil 
  })
}

// ============================================================================
// SLA NOTIFICATION HANDLERS
// ============================================================================

/**
 * Handle SLA warning notification
 * Queued for daily digest (not urgent)
 */
export function handleSLAWarning(payload) {
  const { requestNumber, clientName, workflowStage, percentUsed, hoursRemaining, requesterId, requestId } = payload
  
  // Queue for digest
  queueNotification(requesterId, 'SLA_WARNING', {
    subject: `SLA Warning: Request ${requestNumber}`,
    body: `Request ${requestNumber} for ${clientName} is at ${percentUsed}% of its SLA.
    
Stage: ${workflowStage}
Time Remaining: ${Math.round(hoursRemaining)} hours

Please take action to avoid SLA breach.`,
    metadata: { ...payload, slaStatus: 'WARNING', requestId }
  }, false)
  
  // Also notify the responsible approver based on stage
  const approverRole = getApproverRoleForStage(workflowStage)
  if (approverRole) {
    const approver = getNextApprover(null, approverRole, requestId || null)
    if (approver) {
      queueNotification(approver.id, 'SLA_WARNING', {
        subject: `SLA Warning: Request ${requestNumber} needs your attention`,
        body: `Request ${requestNumber} for ${clientName} is approaching SLA breach.
        
Stage: ${workflowStage}
Time Remaining: ${Math.round(hoursRemaining)} hours
Progress: ${percentUsed}% of SLA used

Please review and take action.`,
        metadata: { ...payload, slaStatus: 'WARNING', requestId }
      }, false)
    }
  }
  
  console.log(`[SLA Notification] Warning queued for request ${requestNumber}`)
}

/**
 * Handle SLA critical notification
 * Queued as urgent - sent immediately
 */
export function handleSLACritical(payload) {
  const { requestNumber, clientName, workflowStage, percentUsed, hoursRemaining, requesterId, requestId } = payload
  
  // Send immediately to requester
  queueNotification(requesterId, 'SLA_CRITICAL', {
    subject: `⚠️ URGENT: Request ${requestNumber} - SLA Critical`,
    body: `Request ${requestNumber} for ${clientName} is critically close to SLA breach.
    
Stage: ${workflowStage}
Time Remaining: ${Math.round(hoursRemaining)} hours
Progress: ${percentUsed}% of SLA used

IMMEDIATE ACTION REQUIRED to prevent SLA breach.`,
    metadata: { ...payload, slaStatus: 'CRITICAL', requestId }
  }, true) // Urgent = immediate send
  
  // Also notify the responsible approver
  const approverRole = getApproverRoleForStage(workflowStage)
  if (approverRole) {
    const approver = getNextApprover(null, approverRole, requestId || null)
    if (approver) {
      queueNotification(approver.id, 'SLA_CRITICAL', {
        subject: `⚠️ URGENT: Request ${requestNumber} - SLA Critical`,
        body: `Request ${requestNumber} for ${clientName} requires immediate action.
        
Stage: ${workflowStage}
Time Remaining: ${Math.round(hoursRemaining)} hours

This request is at ${percentUsed}% of its SLA and will breach shortly.`,
        metadata: { ...payload, slaStatus: 'CRITICAL', requestId }
      }, true)
    }
  }
  
  console.log(`[SLA Notification] Critical alert sent for request ${requestNumber}`)
}

/**
 * Handle SLA breach notification
 * Always sent immediately + escalated to management
 */
export function handleSLABreach(payload) {
  const { requestNumber, clientName, workflowStage, actualHours, targetHours, requesterId, requestId } = payload
  
  const hoursOverdue = Math.round(actualHours - targetHours)
  
  // Notify requester immediately
  queueNotification(requesterId, 'SLA_BREACH', {
    subject: `🚨 SLA BREACHED: Request ${requestNumber}`,
    body: `Request ${requestNumber} for ${clientName} has exceeded its SLA.
    
Stage: ${workflowStage}
Target: ${targetHours} hours
Actual: ${Math.round(actualHours)} hours
Overdue: ${hoursOverdue} hours

This breach has been logged and escalated to management.`,
    metadata: { ...payload, slaStatus: 'BREACH', requestId }
  }, true)
  
  // Notify responsible approver
  const approverRole = getApproverRoleForStage(workflowStage)
  if (approverRole) {
    const approver = getNextApprover(null, approverRole, requestId || null)
    if (approver) {
      queueNotification(approver.id, 'SLA_BREACH', {
        subject: `🚨 SLA BREACHED: Request ${requestNumber}`,
        body: `Request ${requestNumber} for ${clientName} has breached its SLA.
        
Stage: ${workflowStage}
Overdue: ${hoursOverdue} hours

Please resolve immediately. This breach has been logged.`,
        metadata: { ...payload, slaStatus: 'BREACH', requestId }
      }, true)
    }
  }
  
  // Escalate to management (Admins/Super Admins)
  const admins = db.prepare(`
    SELECT * FROM users WHERE role IN ('Admin', 'Super Admin') AND is_active = 1
  `).all()
  
  for (const admin of admins) {
    queueNotification(admin.id, 'SLA_BREACH_ESCALATION', {
      subject: `🚨 SLA Breach Escalation: Request ${requestNumber}`,
      body: `An SLA breach has occurred and requires management attention.
      
Request: ${requestNumber}
Client: ${clientName}
Stage: ${workflowStage}
Overdue: ${hoursOverdue} hours

Please review and take appropriate action.`,
      metadata: { ...payload, slaStatus: 'BREACH', requestId }
    }, true)
  }
  
  console.log(`[SLA Notification] Breach alert sent and escalated for request ${requestNumber}`)
}

/**
 * Get approver role for workflow stage
 */
function getApproverRoleForStage(stage) {
  const stageRoleMap = {
    'Pending Director Approval': 'Director',
    'Pending Compliance': 'Compliance',
    'Pending Partner': 'Partner',
    'Pending Finance': 'Finance',
    'Draft': null, // Requester's responsibility
    'More Info Requested': null // Requester's responsibility
  }
  return stageRoleMap[stage] || null
}

/**
 * Initialize SLA event listeners
 * Call this on application startup
 */
export function initSLANotificationHandlers() {
  try {
    // Dynamic import to avoid circular dependency
    import('./eventBus.js').then(({ eventBus, SLA_EVENTS }) => {
      if (SLA_EVENTS) {
        eventBus.on(SLA_EVENTS.WARNING, handleSLAWarning)
        eventBus.on(SLA_EVENTS.CRITICAL, handleSLACritical)
        eventBus.on(SLA_EVENTS.BREACH, handleSLABreach)
        console.log('✅ SLA notification handlers initialized')
      }
    }).catch(err => {
      console.log('Note: SLA events not available yet')
    })
  } catch (error) {
    console.log('Note: SLA notification handlers not initialized (events may not be defined yet)')
  }
}