import { getDatabase } from '../database/init.js'
import { isProduction, getEnvironment } from '../config/environment.js'
import { getUserById } from '../utils/userUtils.js'

const db = getDatabase()

/**
 * Analytics Controller
 * Provides clean business intelligence metrics separate from load testing data
 * 
 * Design: Separate endpoints for business metrics (excludes test data)
 */

/**
 * Get business analytics (production data only, excludes test data)
 * GET /api/admin/analytics/business
 * 
 * Returns business metrics excluding all LOAD-TEST-* entries
 */
export async function getBusinessAnalytics(req, res) {
  try {
    const userId = req.userId
    const user = getUserById(userId)
    
    if (!user || (user.role !== 'Admin' && user.role !== 'Super Admin')) {
      return res.status(403).json({ error: 'Access denied. Admin or Super Admin required.' })
    }
    
    // Get total requests (excluding test data)
    const totalRequests = db.prepare(`
      SELECT COUNT(*) as count 
      FROM coi_requests 
      WHERE request_id NOT LIKE 'LOAD-TEST-%'
    `).get()
    
    // Get requests by status (excluding test data)
    const byStatus = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM coi_requests 
      WHERE request_id NOT LIKE 'LOAD-TEST-%'
      GROUP BY status
    `).all()
    
    // Get requests by service type (excluding test data)
    const byServiceType = db.prepare(`
      SELECT service_type, COUNT(*) as count 
      FROM coi_requests 
      WHERE request_id NOT LIKE 'LOAD-TEST-%'
      GROUP BY service_type
    `).all()
    
    // Get active clients (excluding test data)
    const activeClients = db.prepare(`
      SELECT COUNT(DISTINCT client_id) as count 
      FROM coi_requests 
      WHERE request_id NOT LIKE 'LOAD-TEST-%'
        AND status IN ('Active', 'Approved')
    `).get()
    
    // Get recent activity (last 30 days, excluding test data)
    const recentActivity = db.prepare(`
      SELECT COUNT(*) as count 
      FROM coi_requests 
      WHERE request_id NOT LIKE 'LOAD-TEST-%'
        AND created_at >= datetime('now', '-30 days')
    `).get()
    
    // Convert to object format for easier consumption
    const statusBreakdown = {}
    byStatus.forEach(row => {
      statusBreakdown[row.status] = row.count
    })
    
    const serviceTypeBreakdown = {}
    byServiceType.forEach(row => {
      serviceTypeBreakdown[row.service_type || 'Unknown'] = row.count
    })
    
    res.json({
      success: true,
      environment: getEnvironment(),
      dataSource: 'production',
      metrics: {
        totalRequests: totalRequests.count,
        activeClients: activeClients.count,
        recentActivity: recentActivity.count,
        byStatus: statusBreakdown,
        byServiceType: serviceTypeBreakdown
      },
      metadata: {
        excludesTestData: true,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error getting business analytics:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Get system performance analytics (includes load test metrics from staging)
 * GET /api/admin/analytics/performance
 * 
 * Returns system performance metrics (can include test data for capacity planning)
 */
export async function getPerformanceAnalytics(req, res) {
  try {
    const userId = req.userId
    const user = getUserById(userId)
    
    if (!user || (user.role !== 'Admin' && user.role !== 'Super Admin')) {
      return res.status(403).json({ error: 'Access denied. Admin or Super Admin required.' })
    }
    
    // Get all requests (including test data for performance analysis)
    const totalRequests = db.prepare(`
      SELECT COUNT(*) as count FROM coi_requests
    `).get()
    
    // Get test data count
    const testRequests = db.prepare(`
      SELECT COUNT(*) as count 
      FROM coi_requests 
      WHERE request_id LIKE 'LOAD-TEST-%'
    `).get()
    
    // Get production data count
    const productionRequests = db.prepare(`
      SELECT COUNT(*) as count 
      FROM coi_requests 
      WHERE request_id NOT LIKE 'LOAD-TEST-%'
    `).get()
    
    // Get database size info
    const dbStats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM coi_requests) as total_requests,
        (SELECT COUNT(*) FROM clients) as total_clients,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM coi_requests WHERE request_id LIKE 'LOAD-TEST-%') as test_requests
    `).get()
    
    res.json({
      success: true,
      environment: getEnvironment(),
      dataSource: 'all',
      metrics: {
        totalRequests: totalRequests.count,
        productionRequests: productionRequests.count,
        testRequests: testRequests.count,
        databaseStats: {
          totalRequests: dbStats.total_requests,
          totalClients: dbStats.total_clients,
          totalUsers: dbStats.total_users,
          testRequests: dbStats.test_requests
        }
      },
      metadata: {
        includesTestData: true,
        generatedAt: new Date().toISOString(),
        note: 'Performance analytics include test data for capacity planning'
      }
    })
  } catch (error) {
    console.error('Error getting performance analytics:', error)
    res.status(500).json({ error: error.message })
  }
}

export default {
  getBusinessAnalytics,
  getPerformanceAnalytics
}
