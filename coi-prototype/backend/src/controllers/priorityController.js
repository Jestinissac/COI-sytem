import { getDatabase } from '../database/init.js'
import { getFilteredRequests } from '../middleware/dataSegregation.js'
import {
  getActiveConfig,
  getFactorConfig,
  calculatePriority,
  getLevel,
  getLevelThresholds,
  updateWeight,
  updateValueMappings,
  toggleFactorActive,
  getFactorAuditHistory,
  getAllAuditHistory,
  sortByPriority,
  groupByPriorityLevel,
  PRIORITY_LEVEL
} from '../services/priorityService.js'

/**
 * Priority Controller
 * Handles priority scoring API endpoints
 */

/**
 * GET /api/priority/queue
 * Get prioritized queue of pending requests for current user
 */
export async function getQueue(req, res) {
  try {
    const user = req.user
    
    // Get requests filtered by user's role (respects data segregation)
    const requests = getFilteredRequests(user)
    
    // Filter to only pending requests (action required)
    const pendingStatuses = [
      'Pending Director Approval',
      'Pending Compliance',
      'Pending Partner',
      'Pending Finance',
      'Draft',
      'More Info Requested'
    ]
    
    const pendingRequests = requests.filter(r => pendingStatuses.includes(r.status))
    
    // Sort by priority
    const sortedRequests = await sortByPriority(pendingRequests)
    
    // Build response with summary
    const summary = {
      [PRIORITY_LEVEL.CRITICAL]: sortedRequests.filter(r => r.priority.level === PRIORITY_LEVEL.CRITICAL).length,
      [PRIORITY_LEVEL.HIGH]: sortedRequests.filter(r => r.priority.level === PRIORITY_LEVEL.HIGH).length,
      [PRIORITY_LEVEL.MEDIUM]: sortedRequests.filter(r => r.priority.level === PRIORITY_LEVEL.MEDIUM).length,
      [PRIORITY_LEVEL.LOW]: sortedRequests.filter(r => r.priority.level === PRIORITY_LEVEL.LOW).length,
      total: sortedRequests.length
    }
    
    // Return simplified items for queue view
    const items = sortedRequests.map(r => ({
      requestId: r.request_id || r.id,
      id: r.id,
      clientName: r.client_name,
      serviceType: r.service_type,
      status: r.status,
      score: r.priority.score,
      level: r.priority.level,
      topFactors: r.priority.topFactors,
      slaStatus: r.priority.slaStatus?.status,
      hoursRemaining: r.priority.slaStatus?.hoursRemaining,
      createdAt: r.created_at
    }))
    
    res.json({
      success: true,
      items,
      summary
    })
  } catch (error) {
    console.error('Error getting priority queue:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get priority queue',
      message: error.message
    })
  }
}

/**
 * GET /api/priority/breakdown/:requestId
 * Get detailed priority breakdown for a specific request
 */
export async function getBreakdown(req, res) {
  try {
    const { requestId } = req.params
    const db = getDatabase()
    
    // Get request
    const request = db.prepare(`
      SELECT 
        r.*,
        c.client_name,
        c.client_type,
        u.name as requester_name
      FROM coi_requests r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN users u ON r.requester_id = u.id
      WHERE r.id = ? OR r.request_id = ?
    `).get(requestId, requestId)
    
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      })
    }
    
    // Calculate priority with full breakdown
    const priority = await calculatePriority(request)
    
    res.json({
      success: true,
      requestId: request.request_id,
      clientName: request.client_name,
      status: request.status,
      priority: {
        score: priority.score,
        level: priority.level,
        breakdown: priority.breakdown,
        slaStatus: priority.slaStatus,
        levelThresholds: getLevelThresholds()
      }
    })
  } catch (error) {
    console.error('Error getting priority breakdown:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get priority breakdown',
      message: error.message
    })
  }
}

/**
 * GET /api/priority/config
 * Get all priority configuration (admin only)
 */
export async function getConfig(req, res) {
  try {
    const config = getActiveConfig()
    const thresholds = getLevelThresholds()
    
    res.json({
      success: true,
      factors: config,
      levelThresholds: thresholds
    })
  } catch (error) {
    console.error('Error getting priority config:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get priority configuration',
      message: error.message
    })
  }
}

/**
 * PUT /api/priority/config/:factorId
 * Update priority factor configuration (admin only)
 */
export async function updateConfig(req, res) {
  try {
    const { factorId } = req.params
    const { weight, value_mappings, is_active, reason } = req.body
    const userId = req.user.id
    
    // Validate factor exists
    const current = getFactorConfig(factorId)
    if (!current) {
      return res.status(404).json({
        success: false,
        error: 'Factor not found'
      })
    }
    
    let updated = current
    
    // Update weight if provided
    if (weight !== undefined) {
      if (weight < 0 || weight > 10) {
        return res.status(400).json({
          success: false,
          error: 'Weight must be between 0 and 10'
        })
      }
      updated = updateWeight(factorId, weight, userId, reason || 'Weight updated via API')
    }
    
    // Update value mappings if provided
    if (value_mappings !== undefined) {
      // Validate mappings format
      if (typeof value_mappings !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'value_mappings must be an object'
        })
      }
      
      // Validate all values are 0-100
      for (const [key, value] of Object.entries(value_mappings)) {
        if (typeof value !== 'number' || value < 0 || value > 100) {
          return res.status(400).json({
            success: false,
            error: `Invalid score for "${key}": must be a number between 0 and 100`
          })
        }
      }
      
      updated = updateValueMappings(factorId, value_mappings, userId, reason || 'Value mappings updated via API')
    }
    
    // Toggle active status if provided
    if (is_active !== undefined) {
      updated = toggleFactorActive(factorId, is_active, userId, reason || 'Active status updated via API')
    }
    
    res.json({
      success: true,
      factor: updated,
      message: 'Priority factor updated successfully'
    })
  } catch (error) {
    console.error('Error updating priority config:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update priority configuration',
      message: error.message
    })
  }
}

/**
 * GET /api/priority/audit
 * Get audit history for priority configuration changes
 */
export async function getAuditHistory(req, res) {
  try {
    const { factorId, limit = 100 } = req.query
    
    let history
    if (factorId) {
      history = getFactorAuditHistory(factorId, parseInt(limit))
    } else {
      history = getAllAuditHistory(parseInt(limit))
    }
    
    res.json({
      success: true,
      audit: history
    })
  } catch (error) {
    console.error('Error getting audit history:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get audit history',
      message: error.message
    })
  }
}

/**
 * GET /api/priority/grouped
 * Get requests grouped by priority level
 */
export async function getGrouped(req, res) {
  try {
    const user = req.user
    
    // Get requests filtered by user's role
    const requests = getFilteredRequests(user)
    
    // Filter to only pending requests
    const pendingStatuses = [
      'Pending Director Approval',
      'Pending Compliance',
      'Pending Partner',
      'Pending Finance',
      'Draft',
      'More Info Requested'
    ]
    
    const pendingRequests = requests.filter(r => pendingStatuses.includes(r.status))
    
    // Group by priority level
    const grouped = await groupByPriorityLevel(pendingRequests)
    
    // Simplify items for response
    const result = {}
    for (const [level, items] of Object.entries(grouped)) {
      result[level] = items.map(r => ({
        requestId: r.request_id || r.id,
        id: r.id,
        clientName: r.client_name,
        serviceType: r.service_type,
        status: r.status,
        score: r.priority.score,
        topFactors: r.priority.topFactors
      }))
    }
    
    res.json({
      success: true,
      grouped: result,
      counts: {
        [PRIORITY_LEVEL.CRITICAL]: grouped[PRIORITY_LEVEL.CRITICAL].length,
        [PRIORITY_LEVEL.HIGH]: grouped[PRIORITY_LEVEL.HIGH].length,
        [PRIORITY_LEVEL.MEDIUM]: grouped[PRIORITY_LEVEL.MEDIUM].length,
        [PRIORITY_LEVEL.LOW]: grouped[PRIORITY_LEVEL.LOW].length
      }
    })
  } catch (error) {
    console.error('Error getting grouped priorities:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get grouped priorities',
      message: error.message
    })
  }
}

export default {
  getQueue,
  getBreakdown,
  getConfig,
  updateConfig,
  getAuditHistory,
  getGrouped
}
