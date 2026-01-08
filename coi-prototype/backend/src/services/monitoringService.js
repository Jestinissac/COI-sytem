import { getDatabase } from '../database/init.js'
import { notifyEngagementExpiring } from './emailService.js'
import { logAuditTrail } from './auditTrailService.js'

/**
 * Monitoring Service
 * Handles scheduled monitoring tasks for engagements, compliance, and alerts
 */

// Legacy exports for backward compatibility with existing controllers
export function updateMonitoringDays() {
  const db = getDatabase()
  try {
    // Update days elapsed for active engagements
    db.prepare(`
      UPDATE coi_requests 
      SET monitoring_days_elapsed = CAST((julianday('now') - julianday(execution_date)) AS INTEGER)
      WHERE status = 'Active' AND execution_date IS NOT NULL
    `).run()
    return { success: true, message: 'Monitoring days updated' }
  } catch (error) {
    console.error('Error updating monitoring days:', error)
    return { success: false, error: error.message }
  }
}

export function getApproachingLimitRequests(daysRemaining = 25) {
  const db = getDatabase()
  try {
    const requests = db.prepare(`
      SELECT r.*, c.client_name
      FROM coi_requests r
      LEFT JOIN clients c ON r.client_id = c.id
      WHERE r.status = 'Active'
        AND r.monitoring_days_elapsed IS NOT NULL
        AND (30 - r.monitoring_days_elapsed) <= ?
        AND (30 - r.monitoring_days_elapsed) > 0
      ORDER BY r.monitoring_days_elapsed DESC
    `).all(daysRemaining)
    return requests
  } catch (error) {
    console.error('Error getting approaching limit requests:', error)
    return []
  }
}

export function getExceededLimitRequests() {
  const db = getDatabase()
  try {
    const requests = db.prepare(`
      SELECT r.*, c.client_name
      FROM coi_requests r
      LEFT JOIN clients c ON r.client_id = c.id
      WHERE r.status = 'Active'
        AND r.monitoring_days_elapsed IS NOT NULL
        AND r.monitoring_days_elapsed >= 30
      ORDER BY r.monitoring_days_elapsed DESC
    `).all()
    return requests
  } catch (error) {
    console.error('Error getting exceeded limit requests:', error)
    return []
  }
}

export function createRenewalTracking(requestId, renewalData) {
  const db = getDatabase()
  try {
    db.prepare(`
      UPDATE coi_requests 
      SET renewal_tracking = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(renewalData), requestId)
    return { success: true }
  } catch (error) {
    console.error('Error creating renewal tracking:', error)
    return { success: false, error: error.message }
  }
}

// Interval alerts for coi.routes.js
export function sendIntervalAlerts() {
  return checkExpiringEngagements()
}

export function checkRenewalAlerts() {
  return checkPendingComplianceReviews()
}

export function getMonitoringAlertsSummary() {
  return getMonitoringDashboard()
}

// Monitoring configuration
const MONITORING_CONFIG = {
  engagementExpiryWarningDays: [30, 14, 7, 1],
  staleRequestCheckIntervalHours: 4,
  complianceReviewReminderDays: 3,
  reportGenerationDayOfMonth: 1
}

/**
 * Check for expiring engagements and send alerts
 */
export async function checkExpiringEngagements() {
  const db = getDatabase()
  const results = {
    checked: 0,
    alertsSent: 0,
    errors: []
  }
  
  for (const days of MONITORING_CONFIG.engagementExpiryWarningDays) {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + days)
    const dateStr = targetDate.toISOString().split('T')[0]
    
    // Find engagements expiring on this date
    const expiringEngagements = db.prepare(`
      SELECT 
        r.*,
        c.client_name,
        u.name as requestor_name,
        u.email as requestor_email,
        u2.name as partner_name,
        u2.email as partner_email
      FROM coi_requests r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN users u ON r.created_by = u.id
      LEFT JOIN users u2 ON r.partner_id = u2.id
      WHERE r.status = 'Approved'
        AND DATE(r.engagement_end_date) = ?
        AND (r.expiry_notification_sent IS NULL OR r.expiry_notification_sent NOT LIKE ?)
    `).all(dateStr, `%${days}d%`)
    
    results.checked += expiringEngagements.length
    
    for (const engagement of expiringEngagements) {
      try {
        // Notify requestor
        if (engagement.requestor_email) {
          await notifyEngagementExpiring(
            {
              engagement_code: engagement.engagement_code,
              client_name: engagement.client_name,
              service_type: engagement.service_type,
              expiry_date: engagement.engagement_end_date
            },
            { name: engagement.requestor_name, email: engagement.requestor_email },
            days
          )
        }
        
        // Notify partner
        if (engagement.partner_email) {
          await notifyEngagementExpiring(
            {
              engagement_code: engagement.engagement_code,
              client_name: engagement.client_name,
              service_type: engagement.service_type,
              expiry_date: engagement.engagement_end_date
            },
            { name: engagement.partner_name, email: engagement.partner_email },
            days
          )
        }
        
        // Mark notification as sent
        const currentNotifications = engagement.expiry_notification_sent || ''
        db.prepare(`
          UPDATE coi_requests 
          SET expiry_notification_sent = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(`${currentNotifications}${days}d,`, engagement.id)
        
        results.alertsSent++
        
        logAuditTrail(
          null,
          'COI Request',
          engagement.id,
          'Expiry Alert Sent',
          `Engagement ${engagement.engagement_code} expiring in ${days} days. Alert sent to ${engagement.requestor_name}.`,
          { days_remaining: days }
        )
      } catch (error) {
        results.errors.push({ engagement: engagement.engagement_code, error: error.message })
      }
    }
  }
  
  console.log(`📅 Expiring engagement check: ${results.checked} checked, ${results.alertsSent} alerts sent`)
  return results
}

/**
 * Check for pending requests that need compliance review reminders
 */
export async function checkPendingComplianceReviews() {
  const db = getDatabase()
  
  const reminderDate = new Date()
  reminderDate.setDate(reminderDate.getDate() - MONITORING_CONFIG.complianceReviewReminderDays)
  
  const pendingRequests = db.prepare(`
    SELECT 
      r.*,
      c.client_name,
      u.name as requestor_name
    FROM coi_requests r
    LEFT JOIN clients c ON r.client_id = c.id
    LEFT JOIN users u ON r.created_by = u.id
    WHERE r.status = 'Pending Compliance'
      AND r.updated_at < ?
      AND (r.compliance_reminder_sent IS NULL OR r.compliance_reminder_sent < DATE('now', '-3 days'))
  `).all(reminderDate.toISOString())
  
  const results = {
    pending: pendingRequests.length,
    remindersSent: 0
  }
  
  // Get compliance officers
  const complianceOfficers = db.prepare(`
    SELECT id, name, email FROM users WHERE role = 'Compliance' AND is_active = 1
  `).all()
  
  if (pendingRequests.length > 0 && complianceOfficers.length > 0) {
    // Log reminder (email would go here)
    console.log(`📋 ${pendingRequests.length} pending compliance reviews need attention`)
    
    for (const request of pendingRequests) {
      db.prepare(`
        UPDATE coi_requests 
        SET compliance_reminder_sent = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(request.id)
      results.remindersSent++
    }
  }
  
  return results
}

/**
 * Check for stale requests (rules changed while pending)
 */
export async function checkStaleRequests() {
  const db = getDatabase()
  
  // Get requests that have requires_re_evaluation = 1 but haven't been notified
  const staleRequests = db.prepare(`
    SELECT 
      r.*,
      c.client_name,
      u.name as compliance_reviewer_name,
      u.email as compliance_reviewer_email
    FROM coi_requests r
    LEFT JOIN clients c ON r.client_id = c.id
    LEFT JOIN users u ON r.compliance_reviewer_id = u.id
    WHERE r.requires_re_evaluation = 1
      AND r.status = 'Pending Compliance'
      AND (r.stale_notification_sent IS NULL OR r.stale_notification_sent < r.updated_at)
  `).all()
  
  const results = {
    stale: staleRequests.length,
    notificationsSent: 0
  }
  
  for (const request of staleRequests) {
    // Mark as notified
    db.prepare(`
      UPDATE coi_requests 
      SET stale_notification_sent = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(request.id)
    
    results.notificationsSent++
    console.log(`⚠️ Stale request ${request.request_id}: ${request.stale_reason}`)
  }
  
  return results
}

/**
 * Generate monthly compliance report
 */
export async function generateMonthlyReport(month, year) {
  const db = getDatabase()
  
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)
  
  // Get all requests in the month
  const requests = db.prepare(`
    SELECT 
      r.*,
      c.client_name
    FROM coi_requests r
    LEFT JOIN clients c ON r.client_id = c.id
    WHERE DATE(r.created_at) BETWEEN ? AND ?
  `).all(startDate.toISOString(), endDate.toISOString())
  
  // Calculate statistics
  const stats = {
    period: `${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
    total: requests.length,
    byStatus: {},
    byServiceType: {},
    byPIEStatus: { Yes: 0, No: 0 },
    averageProcessingTime: 0,
    conflictsDetected: 0,
    duplicatesFound: 0
  }
  
  let totalProcessingDays = 0
  let processedCount = 0
  
  for (const request of requests) {
    // By status
    stats.byStatus[request.status] = (stats.byStatus[request.status] || 0) + 1
    
    // By service type
    const serviceType = request.service_type || 'Unknown'
    stats.byServiceType[serviceType] = (stats.byServiceType[serviceType] || 0) + 1
    
    // By PIE status
    if (request.pie_status === 'Yes') stats.byPIEStatus.Yes++
    else stats.byPIEStatus.No++
    
    // Calculate processing time for completed requests
    if (request.status === 'Approved' || request.status === 'Rejected') {
      const created = new Date(request.created_at)
      const updated = new Date(request.updated_at)
      const days = Math.ceil((updated - created) / (1000 * 60 * 60 * 24))
      totalProcessingDays += days
      processedCount++
    }
    
    // Count conflicts and duplicates
    if (request.duplicates) {
      try {
        const dups = JSON.parse(request.duplicates)
        if (dups.length > 0) stats.duplicatesFound++
      } catch (e) {}
    }
    
    if (request.conflicts) {
      try {
        const conflicts = JSON.parse(request.conflicts)
        if (conflicts.length > 0) stats.conflictsDetected++
      } catch (e) {}
    }
  }
  
  if (processedCount > 0) {
    stats.averageProcessingTime = Math.round(totalProcessingDays / processedCount)
  }
  
  // Save report to database
  try {
    db.prepare(`
      INSERT INTO compliance_reports (month, year, report_data, generated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(month, year, JSON.stringify(stats))
  } catch (e) {
    // Table might not exist, that's ok
  }
  
  return stats
}

/**
 * Get monitoring dashboard data
 */
export function getMonitoringDashboard() {
  const db = getDatabase()
  
  // Expiring soon (next 30 days)
  const expiringSoon = db.prepare(`
    SELECT COUNT(*) as count FROM coi_requests 
    WHERE status = 'Approved' 
    AND engagement_end_date IS NOT NULL
    AND DATE(engagement_end_date) BETWEEN DATE('now') AND DATE('now', '+30 days')
  `).get()
  
  // Stale requests
  const staleRequests = db.prepare(`
    SELECT COUNT(*) as count FROM coi_requests 
    WHERE requires_re_evaluation = 1 AND status = 'Pending Compliance'
  `).get()
  
  // Pending compliance review
  const pendingCompliance = db.prepare(`
    SELECT COUNT(*) as count FROM coi_requests 
    WHERE status = 'Pending Compliance'
  `).get()
  
  // Pending director approval
  const pendingDirector = db.prepare(`
    SELECT COUNT(*) as count FROM coi_requests 
    WHERE status = 'Pending Director'
  `).get()
  
  // Last 7 days activity
  const weeklyActivity = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as submitted
    FROM coi_requests 
    WHERE DATE(created_at) >= DATE('now', '-7 days')
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all()
  
  // Approval rate this month
  const monthlyStats = db.prepare(`
    SELECT 
      COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved,
      COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected,
      COUNT(*) as total
    FROM coi_requests 
    WHERE DATE(created_at) >= DATE('now', 'start of month')
  `).get()
  
  return {
    alerts: {
      expiringSoon: expiringSoon.count,
      staleRequests: staleRequests.count,
      pendingCompliance: pendingCompliance.count,
      pendingDirector: pendingDirector.count
    },
    weeklyActivity,
    monthlyStats: {
      ...monthlyStats,
      approvalRate: monthlyStats.total > 0 
        ? Math.round((monthlyStats.approved / monthlyStats.total) * 100) 
        : 0
    },
    lastUpdated: new Date().toISOString()
  }
}

/**
 * Run all scheduled monitoring tasks
 */
export async function runScheduledTasks() {
  console.log('🔄 Running scheduled monitoring tasks...')
  
  const results = {
    timestamp: new Date().toISOString(),
    tasks: {}
  }
  
  try {
    results.tasks.expiringEngagements = await checkExpiringEngagements()
  } catch (error) {
    results.tasks.expiringEngagements = { error: error.message }
  }
  
  try {
    results.tasks.pendingCompliance = await checkPendingComplianceReviews()
  } catch (error) {
    results.tasks.pendingCompliance = { error: error.message }
  }
  
  try {
    results.tasks.staleRequests = await checkStaleRequests()
  } catch (error) {
    results.tasks.staleRequests = { error: error.message }
  }
  
  console.log('✅ Scheduled tasks completed:', JSON.stringify(results.tasks))
  return results
}

// Simple interval-based scheduler (in production, use node-cron or similar)
let monitoringInterval = null

export function startMonitoringScheduler() {
  if (monitoringInterval) {
    console.log('⚠️ Monitoring scheduler already running')
    return
  }
  
  // Run every 4 hours
  const intervalMs = MONITORING_CONFIG.staleRequestCheckIntervalHours * 60 * 60 * 1000
  
  monitoringInterval = setInterval(async () => {
    await runScheduledTasks()
  }, intervalMs)
  
  console.log(`📅 Monitoring scheduler started (every ${MONITORING_CONFIG.staleRequestCheckIntervalHours} hours)`)
  
  // Run immediately on start
  runScheduledTasks()
}

export function stopMonitoringScheduler() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
    monitoringInterval = null
    console.log('⏹️ Monitoring scheduler stopped')
  }
}

export default {
  checkExpiringEngagements,
  checkPendingComplianceReviews,
  checkStaleRequests,
  generateMonthlyReport,
  getMonitoringDashboard,
  runScheduledTasks,
  startMonitoringScheduler,
  stopMonitoringScheduler
}
