import { getDatabase } from '../database/init.js'
import { sendEmail } from './notificationService.js'

const db = getDatabase()

/**
 * Update days_in_monitoring for all Active requests
 * Should be called daily (via cron job or scheduled task)
 */
export function updateMonitoringDays() {
  try {
    // Get all Active requests
    const activeRequests = db.prepare(`
      SELECT id, execution_date, days_in_monitoring
      FROM coi_requests
      WHERE status = 'Active' AND execution_date IS NOT NULL
    `).all()
    
    const today = new Date()
    let updated = 0
    
    activeRequests.forEach(request => {
      const executionDate = new Date(request.execution_date)
      const daysDiff = Math.floor((today - executionDate) / (1000 * 60 * 60 * 24))
      
      if (daysDiff !== request.days_in_monitoring) {
        db.prepare('UPDATE coi_requests SET days_in_monitoring = ? WHERE id = ?').run(daysDiff, request.id)
        updated++
      }
    })
    
    return { updated, total: activeRequests.length }
  } catch (error) {
    console.error('Monitoring update error:', error)
    throw error
  }
}

/**
 * Send alerts at 10-day intervals (10, 20, 30 days)
 */
export function sendIntervalAlerts() {
  try {
    const alerts = []
    
    // 10-day alerts
    const tenDayRequests = db.prepare(`
      SELECT r.id, r.request_id, r.requester_id, r.days_in_monitoring, c.client_name, u.email as requester_email
      FROM coi_requests r
      JOIN clients c ON r.client_id = c.id
      JOIN users u ON r.requester_id = u.id
      WHERE r.status = 'Active' 
      AND r.days_in_monitoring = 10
    `).all()
    
    tenDayRequests.forEach(req => {
      const existingAlert = db.prepare(`
        SELECT id FROM monitoring_alerts 
        WHERE coi_request_id = ? AND alert_type = '10_day'
      `).get(req.id)
      
      if (!existingAlert) {
        sendEmail(
          [req.requester_email],
          `COI Alert: 10 Days - ${req.request_id}`,
          `Request ${req.request_id} for ${req.client_name} has been active for 10 days. Please follow up with the client.`
        )
        
        db.prepare(`
          INSERT INTO monitoring_alerts (coi_request_id, alert_type, sent_to, sent_status)
          VALUES (?, '10_day', ?, 'Sent')
        `).run(req.id, JSON.stringify([req.requester_email]))
        
        alerts.push({ request_id: req.request_id, type: '10_day' })
      }
    })
    
    // 20-day alerts
    const twentyDayRequests = db.prepare(`
      SELECT r.id, r.request_id, r.requester_id, r.days_in_monitoring, c.client_name, u.email as requester_email
      FROM coi_requests r
      JOIN clients c ON r.client_id = c.id
      JOIN users u ON r.requester_id = u.id
      WHERE r.status = 'Active' 
      AND r.days_in_monitoring = 20
    `).all()
    
    twentyDayRequests.forEach(req => {
      const existingAlert = db.prepare(`
        SELECT id FROM monitoring_alerts 
        WHERE coi_request_id = ? AND alert_type = '20_day'
      `).get(req.id)
      
      if (!existingAlert) {
        // Get admin emails
        const admins = db.prepare(`SELECT email FROM users WHERE role = 'Admin'`).all()
        const adminEmails = admins.map(a => a.email)
        
        sendEmail(
          [req.requester_email, ...adminEmails],
          `COI URGENT: 20 Days - ${req.request_id}`,
          `Request ${req.request_id} for ${req.client_name} has been active for 20 days. Only 10 days remaining before lapse.`
        )
        
        db.prepare(`
          INSERT INTO monitoring_alerts (coi_request_id, alert_type, sent_to, sent_status)
          VALUES (?, '20_day', ?, 'Sent')
        `).run(req.id, JSON.stringify([req.requester_email, ...adminEmails]))
        
        alerts.push({ request_id: req.request_id, type: '20_day' })
      }
    })
    
    // 30-day alerts (and auto-lapse)
    const thirtyDayRequests = db.prepare(`
      SELECT r.id, r.request_id, r.requester_id, r.days_in_monitoring, c.client_name, u.email as requester_email
      FROM coi_requests r
      JOIN clients c ON r.client_id = c.id
      JOIN users u ON r.requester_id = u.id
      WHERE r.status = 'Active' 
      AND r.days_in_monitoring >= 30
    `).all()
    
    thirtyDayRequests.forEach(req => {
      const existingAlert = db.prepare(`
        SELECT id FROM monitoring_alerts 
        WHERE coi_request_id = ? AND alert_type = '30_day'
      `).get(req.id)
      
      if (!existingAlert) {
        // Get compliance, admin, and partner emails
        const stakeholders = db.prepare(`
          SELECT email FROM users WHERE role IN ('Admin', 'Compliance', 'Partner')
        `).all()
        const stakeholderEmails = stakeholders.map(s => s.email)
        
        sendEmail(
          [req.requester_email, ...stakeholderEmails],
          `COI EXPIRED: 30 Days - ${req.request_id}`,
          `Request ${req.request_id} for ${req.client_name} has exceeded 30 days and will be marked as Lapsed.`
        )
        
        // Auto-lapse the request
        db.prepare(`
          UPDATE coi_requests SET status = 'Lapsed', updated_at = datetime('now')
          WHERE id = ?
        `).run(req.id)
        
        db.prepare(`
          INSERT INTO monitoring_alerts (coi_request_id, alert_type, sent_to, sent_status)
          VALUES (?, '30_day', ?, 'Sent')
        `).run(req.id, JSON.stringify([req.requester_email, ...stakeholderEmails]))
        
        alerts.push({ request_id: req.request_id, type: '30_day', action: 'lapsed' })
      }
    })
    
    return { alerts_sent: alerts.length, alerts }
  } catch (error) {
    console.error('Send interval alerts error:', error)
    throw error
  }
}

/**
 * Create 3-year renewal tracking entry
 */
export function createRenewalTracking(coiRequestId, engagementCode, startDate) {
  try {
    const start = new Date(startDate)
    const renewalDue = new Date(start)
    renewalDue.setFullYear(renewalDue.getFullYear() + 3)
    
    db.prepare(`
      INSERT INTO engagement_renewals (
        coi_request_id, engagement_code, original_start_date, renewal_due_date, renewal_status
      ) VALUES (?, ?, ?, ?, 'Active')
    `).run(coiRequestId, engagementCode, start.toISOString(), renewalDue.toISOString())
    
    return { success: true, renewal_due_date: renewalDue.toISOString() }
  } catch (error) {
    console.error('Create renewal tracking error:', error)
    throw error
  }
}

/**
 * Check and send 3-year renewal alerts (90, 60, 30 days before)
 */
export function checkRenewalAlerts() {
  try {
    const alerts = []
    const today = new Date()
    
    // Get all active renewals
    const renewals = db.prepare(`
      SELECT er.*, r.request_id, c.client_name, u.email as requester_email
      FROM engagement_renewals er
      JOIN coi_requests r ON er.coi_request_id = r.id
      JOIN clients c ON r.client_id = c.id
      JOIN users u ON r.requester_id = u.id
      WHERE er.renewal_status = 'Active'
    `).all()
    
    renewals.forEach(renewal => {
      const dueDate = new Date(renewal.renewal_due_date)
      const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24))
      
      // 90-day alert
      if (daysUntilDue <= 90 && daysUntilDue > 60 && !renewal.alert_90_days_sent) {
        sendEmail(
          [renewal.requester_email],
          `Engagement Renewal: 90 Days Notice - ${renewal.request_id}`,
          `Engagement ${renewal.engagement_code} for ${renewal.client_name} is due for renewal in 90 days (${renewal.renewal_due_date}).`
        )
        db.prepare(`UPDATE engagement_renewals SET alert_90_days_sent = 1 WHERE id = ?`).run(renewal.id)
        alerts.push({ engagement_code: renewal.engagement_code, type: '90_day' })
      }
      
      // 60-day alert
      if (daysUntilDue <= 60 && daysUntilDue > 30 && !renewal.alert_60_days_sent) {
        const admins = db.prepare(`SELECT email FROM users WHERE role = 'Admin'`).all()
        sendEmail(
          [renewal.requester_email, ...admins.map(a => a.email)],
          `Engagement Renewal: 60 Days Notice - ${renewal.request_id}`,
          `Engagement ${renewal.engagement_code} for ${renewal.client_name} is due for renewal in 60 days (${renewal.renewal_due_date}).`
        )
        db.prepare(`UPDATE engagement_renewals SET alert_60_days_sent = 1 WHERE id = ?`).run(renewal.id)
        alerts.push({ engagement_code: renewal.engagement_code, type: '60_day' })
      }
      
      // 30-day alert
      if (daysUntilDue <= 30 && daysUntilDue > 0 && !renewal.alert_30_days_sent) {
        const partners = db.prepare(`SELECT email FROM users WHERE role = 'Partner'`).all()
        sendEmail(
          [renewal.requester_email, ...partners.map(p => p.email)],
          `URGENT: Engagement Renewal Due - ${renewal.request_id}`,
          `Engagement ${renewal.engagement_code} for ${renewal.client_name} is due for renewal in ${daysUntilDue} days (${renewal.renewal_due_date}).`
        )
        db.prepare(`UPDATE engagement_renewals SET alert_30_days_sent = 1, renewal_status = 'Renewal Due' WHERE id = ?`).run(renewal.id)
        alerts.push({ engagement_code: renewal.engagement_code, type: '30_day' })
      }
      
      // Expired
      if (daysUntilDue <= 0 && !renewal.alert_expired_sent) {
        const allStakeholders = db.prepare(`SELECT email FROM users WHERE role IN ('Partner', 'Compliance', 'Admin')`).all()
        sendEmail(
          [renewal.requester_email, ...allStakeholders.map(s => s.email)],
          `EXPIRED: Engagement Renewal - ${renewal.request_id}`,
          `Engagement ${renewal.engagement_code} for ${renewal.client_name} has expired and requires immediate renewal.`
        )
        db.prepare(`UPDATE engagement_renewals SET alert_expired_sent = 1, renewal_status = 'Expired' WHERE id = ?`).run(renewal.id)
        alerts.push({ engagement_code: renewal.engagement_code, type: 'expired' })
      }
    })
    
    return { alerts_sent: alerts.length, alerts }
  } catch (error) {
    console.error('Check renewal alerts error:', error)
    throw error
  }
}

/**
 * Get requests approaching 30-day limit
 */
export function getApproachingLimitRequests(thresholdDays = 25) {
  try {
    return db.prepare(`
      SELECT r.id, r.request_id, c.client_name, r.days_in_monitoring, r.execution_date
      FROM coi_requests r
      JOIN clients c ON r.client_id = c.id
      WHERE r.status = 'Active' 
      AND r.days_in_monitoring >= ?
      AND r.days_in_monitoring < 30
      ORDER BY r.days_in_monitoring DESC
    `).all(thresholdDays)
  } catch (error) {
    console.error('Get approaching limit error:', error)
    throw error
  }
}

/**
 * Get requests that have exceeded 30-day limit
 */
export function getExceededLimitRequests() {
  try {
    return db.prepare(`
      SELECT r.id, r.request_id, c.client_name, r.days_in_monitoring, r.execution_date
      FROM coi_requests r
      JOIN clients c ON r.client_id = c.id
      WHERE r.status = 'Active' 
      AND r.days_in_monitoring >= 30
      ORDER BY r.days_in_monitoring DESC
    `).all()
  } catch (error) {
    console.error('Get exceeded limit error:', error)
    throw error
  }
}

/**
 * Get all monitoring alerts summary
 */
export function getMonitoringAlertsSummary() {
  try {
    const tenDay = getRequestsAtDays(10, 19)
    const twentyDay = getRequestsAtDays(20, 29)
    const thirtyDay = getExceededLimitRequests()
    const renewals = db.prepare(`
      SELECT er.*, r.request_id, c.client_name
      FROM engagement_renewals er
      JOIN coi_requests r ON er.coi_request_id = r.id
      JOIN clients c ON r.client_id = c.id
      WHERE er.renewal_status IN ('Renewal Due', 'Expired')
    `).all()
    
    return {
      ten_day_alerts: tenDay,
      twenty_day_alerts: twentyDay,
      thirty_day_exceeded: thirtyDay,
      renewal_alerts: renewals
    }
  } catch (error) {
    console.error('Get monitoring alerts summary error:', error)
    throw error
  }
}

function getRequestsAtDays(minDays, maxDays) {
  return db.prepare(`
    SELECT r.id, r.request_id, c.client_name, r.days_in_monitoring, r.execution_date
    FROM coi_requests r
    JOIN clients c ON r.client_id = c.id
    WHERE r.status = 'Active' 
    AND r.days_in_monitoring >= ?
    AND r.days_in_monitoring <= ?
    ORDER BY r.days_in_monitoring DESC
  `).all(minDays, maxDays)
}
