import { getDatabase } from '../database/init.js'
import { queueNotification, flushNotificationBatch, getNoiseReductionStats } from '../services/notificationService.js'
import { eventBus, EVENT_TYPES } from '../services/eventBus.js'
import { isLoadTestingAllowed, getEnvironment, getEnvironmentConfig } from '../config/environment.js'

const db = getDatabase()

/**
 * Load Test Controller
 * Demonstrates system capacity to handle volume and noise reduction
 * 
 * Design: API-only, no frontend UI (Dieter Rams - minimal)
 * 
 * Safety: Load testing is only allowed in staging, development, and test environments
 * Production load testing is disabled to prevent data pollution
 */

/**
 * Run load simulation
 * POST /api/admin/load-test
 * 
 * Input: { requestCount: 1000, userCount: 50 }
 * Output: { requestsCreated, timeElapsed, noiseReduction, ... }
 * 
 * Environment: Only allowed in staging, development, or test
 */
export async function runLoadTest(req, res) {
  try {
    // Environment check: Disable load testing in production
    if (!isLoadTestingAllowed()) {
      const env = getEnvironment()
      return res.status(403).json({
        error: 'Load testing is not allowed in production environment',
        message: `Current environment: ${env}. Load testing is only available in staging, development, or test environments.`,
        environment: env
      })
    }
    
    const { requestCount = 100, userCount = 10 } = req.body
    
    // Validate input
    if (requestCount > 5000) {
      return res.status(400).json({ error: 'Maximum 5000 requests for load test' })
    }
    if (userCount > 100) {
      return res.status(400).json({ error: 'Maximum 100 users for load test' })
    }
    
    const startTime = Date.now()
    
    // Get existing users or create test users
    const users = getOrCreateTestUsers(userCount)
    const clients = getOrCreateTestClients(Math.ceil(requestCount / 5))
    
    // Track metrics
    let requestsCreated = 0
    let notificationsGenerated = 0
    let errors = []
    
    // Create synthetic requests
    for (let i = 0; i < requestCount; i++) {
      try {
        const user = users[i % users.length]
        const client = clients[i % clients.length]
        
        // Create request
        const requestId = createSyntheticRequest(user, client, i)
        requestsCreated++
        
        // Generate notifications (simulating workflow)
        const notifCount = generateSyntheticNotifications(requestId, user, users)
        notificationsGenerated += notifCount
        
        // Emit event
        eventBus.emitEvent(EVENT_TYPES.REQUEST_SUBMITTED, {
          requestId,
          userId: user.id,
          data: { synthetic: true, index: i }
        })
      } catch (error) {
        errors.push({ index: i, error: error.message })
      }
    }
    
    // Flush notification batch to calculate noise reduction
    const batchResult = flushNotificationBatch()
    
    const endTime = Date.now()
    const timeElapsed = ((endTime - startTime) / 1000).toFixed(2) + 's'
    const avgResponseTime = requestsCreated > 0 
      ? ((endTime - startTime) / requestsCreated).toFixed(1) + 'ms'
      : '0ms'
    
    // Calculate noise reduction
    const digestsSent = batchResult.digestsSent || 0
    const noiseReduction = notificationsGenerated > 0 && digestsSent > 0
      ? Math.round((1 - digestsSent / notificationsGenerated) * 100) + '%'
      : '0%'
    
    res.json({
      success: true,
      summary: {
        requestsCreated,
        timeElapsed,
        avgResponseTime,
        throughput: requestsCreated > 0 
          ? Math.round(requestsCreated / ((endTime - startTime) / 1000)) + ' req/s'
          : '0 req/s',
        notificationsGenerated,
        notificationsAfterBatching: digestsSent,
        noiseReduction,
        errors: errors.length
      },
      details: {
        usersSimulated: users.length,
        clientsSimulated: clients.length,
        batchResult
      }
    })
  } catch (error) {
    console.error('Load test error:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Get noise reduction statistics
 * GET /api/admin/noise-stats
 */
export async function getNoiseStats(req, res) {
  try {
    const days = parseInt(req.query.days) || 7
    const stats = getNoiseReductionStats(days)
    res.json(stats)
  } catch (error) {
    console.error('Error getting noise stats:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Clean up synthetic test data
 * DELETE /api/admin/load-test/cleanup
 * 
 * Environment: Only allowed in staging, development, or test
 */
export async function cleanupLoadTest(req, res) {
  try {
    // Environment check: Disable cleanup in production
    if (!isLoadTestingAllowed()) {
      const env = getEnvironment()
      return res.status(403).json({
        error: 'Load test cleanup is not allowed in production environment',
        message: `Current environment: ${env}. Cleanup is only available in staging, development, or test environments.`,
        environment: env
      })
    }
    
    const envConfig = getEnvironmentConfig()
    
    // Delete synthetic requests
    const deleteRequests = db.prepare(`
      DELETE FROM coi_requests WHERE request_id LIKE 'LOAD-TEST-%'
    `).run()
    
    // Delete synthetic clients
    const deleteClients = db.prepare(`
      DELETE FROM clients WHERE client_code LIKE 'LOAD-TEST-%'
    `).run()
    
    // Clear notification queue
    const deleteNotifications = db.prepare(`
      DELETE FROM notification_queue
    `).run()
    
    res.json({
      success: true,
      environment: envConfig.environment,
      database: envConfig.databaseName,
      deleted: {
        requests: deleteRequests.changes,
        clients: deleteClients.changes,
        notifications: deleteNotifications.changes
      }
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    res.status(500).json({ error: error.message })
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get existing users or create test users
 */
function getOrCreateTestUsers(count) {
  // Get existing active users
  const existingUsers = db.prepare(`
    SELECT * FROM users WHERE active = 1 LIMIT ?
  `).all(count)
  
  if (existingUsers.length >= count) {
    return existingUsers.slice(0, count)
  }
  
  // Return what we have
  return existingUsers.length > 0 ? existingUsers : [{ id: 1, name: 'Test User', email: 'test@example.com', role: 'Requester', department: 'Audit' }]
}

/**
 * Get existing clients or create test clients
 */
function getOrCreateTestClients(count) {
  // Get existing clients
  const existingClients = db.prepare(`
    SELECT * FROM clients LIMIT ?
  `).all(count)
  
  if (existingClients.length >= count) {
    return existingClients.slice(0, count)
  }
  
  // Create synthetic clients if needed
  const clients = [...existingClients]
  const needed = count - existingClients.length
  
  for (let i = 0; i < needed; i++) {
    try {
      const clientCode = `LOAD-TEST-${Date.now()}-${i}`
      const result = db.prepare(`
        INSERT INTO clients (client_name, client_code, industry, status)
        VALUES (?, ?, ?, 'Active')
      `).run(`Load Test Client ${i + 1}`, clientCode, 'Technology')
      
      clients.push({
        id: result.lastInsertRowid,
        client_name: `Load Test Client ${i + 1}`,
        client_code: clientCode
      })
    } catch (error) {
      // Ignore errors, use existing clients
    }
  }
  
  return clients.length > 0 ? clients : [{ id: 1, client_name: 'Test Client', client_code: 'TEST-001' }]
}

/**
 * Create a synthetic COI request
 */
function createSyntheticRequest(user, client, index) {
  const requestId = `LOAD-TEST-${Date.now()}-${index}`
  const serviceTypes = ['Audit', 'Tax Advisory', 'Consulting', 'Valuation', 'Due Diligence']
  const statuses = ['Pending Director Approval', 'Pending Compliance', 'Pending Partner', 'Approved']
  
  const result = db.prepare(`
    INSERT INTO coi_requests (
      request_id, requester_id, client_id, department, service_type, status,
      requested_document, service_description, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    requestId,
    user.id,
    client.id,
    user.department || 'Audit',
    serviceTypes[index % serviceTypes.length],
    statuses[index % statuses.length],
    'Engagement',
    `Load test request ${index + 1}`,
  )
  
  return result.lastInsertRowid
}

/**
 * Generate synthetic notifications for a request
 */
function generateSyntheticNotifications(requestId, requester, allUsers) {
  let count = 0
  
  // Get request details
  const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(requestId)
  if (!request) return 0
  
  // Simulate notifications based on status
  const notificationTypes = [
    'DIRECTOR_APPROVAL_REQUIRED',
    'COMPLIANCE_REVIEW_REQUIRED',
    'STATUS_UPDATE',
    'REMINDER'
  ]
  
  // Generate 3-5 notifications per request (simulating workflow)
  const notifCount = 3 + Math.floor(Math.random() * 3)
  
  for (let i = 0; i < notifCount; i++) {
    const targetUser = allUsers[Math.floor(Math.random() * allUsers.length)]
    const notifType = notificationTypes[i % notificationTypes.length]
    
    queueNotification(
      targetUser.id,
      notifType,
      {
        subject: `${notifType.replace(/_/g, ' ')} - ${request.request_id}`,
        requestId: request.request_id,
        clientName: request.client_name || 'Test Client',
        body: `This is a synthetic notification for load testing.`
      },
      false // Not urgent - will be batched
    )
    count++
  }
  
  return count
}

export default {
  runLoadTest,
  getNoiseStats,
  cleanupLoadTest
}
