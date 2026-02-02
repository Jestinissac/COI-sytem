import { getDatabase } from '../database/init.js'
import {
  getAllSLAConfigs,
  getSLAConfig,
  updateSLAConfig,
  calculateSLAStatus,
  getEffectiveDeadline,
  getBusinessCalendar,
  syncCalendarFromHRMS,
  generatePrototypeCalendar,
  SLA_STATUS
} from '../services/slaService.js'
import {
  checkAllPendingRequests,
  checkRequest,
  getUnresolvedBreaches,
  getBreachStats
} from '../services/slaMonitorService.js'

/**
 * SLA Controller
 * Handles SLA configuration and monitoring API endpoints
 */

/**
 * GET /api/sla/config
 * Get all SLA configurations
 */
export async function getAllConfigs(req, res) {
  try {
    const configs = getAllSLAConfigs()
    
    // Group by workflow stage for easier display
    const grouped = {}
    for (const config of configs) {
      const stage = config.workflow_stage
      if (!grouped[stage]) {
        grouped[stage] = {
          stage,
          default: null,
          pie_override: null,
          service_overrides: []
        }
      }
      
      // Handle PIE override (applies_to_pie === 1 or true)
      if (config.applies_to_pie === 1 || config.applies_to_pie === true) {
        grouped[stage].pie_override = config
      } 
      // Handle service type override (has service type but not PIE)
      else if (config.applies_to_service_type && config.applies_to_service_type !== null) {
        grouped[stage].service_overrides.push(config)
      } 
      // Default config (no PIE, no service type)
      else {
        grouped[stage].default = config
      }
    }
    
    res.json({
      success: true,
      configs,
      grouped: Object.values(grouped),
      slaStatuses: SLA_STATUS
    })
  } catch (error) {
    console.error('Error getting SLA configs:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get SLA configurations',
      message: error.message
    })
  }
}

/**
 * GET /api/sla/config/:stageId
 * Get SLA configuration for a specific stage
 */
export async function getConfigForStage(req, res) {
  try {
    const { stageId } = req.params
    const { serviceType, isPie } = req.query
    
    const config = getSLAConfig(
      stageId.replace(/_/g, ' '), // Convert URL-friendly to actual stage name
      serviceType || null,
      isPie === 'true' ? true : isPie === 'false' ? false : null
    )
    
    res.json({
      success: true,
      config
    })
  } catch (error) {
    console.error('Error getting SLA config for stage:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get SLA configuration',
      message: error.message
    })
  }
}

/**
 * PUT /api/sla/config/:configId
 * Update SLA configuration (admin only)
 */
export async function updateConfig(req, res) {
  try {
    const { configId } = req.params
    const { target_hours, warning_threshold_percent, critical_threshold_percent, is_active, reason } = req.body
    const userId = req.userId
    
    // Validate inputs
    const updates = {}
    
    if (target_hours !== undefined) {
      if (target_hours < 1 || target_hours > 720) { // Max 30 days
        return res.status(400).json({
          success: false,
          error: 'Target hours must be between 1 and 720'
        })
      }
      updates.target_hours = target_hours
    }
    
    if (warning_threshold_percent !== undefined) {
      if (warning_threshold_percent < 1 || warning_threshold_percent > 99) {
        return res.status(400).json({
          success: false,
          error: 'Warning threshold must be between 1 and 99'
        })
      }
      updates.warning_threshold_percent = warning_threshold_percent
    }
    
    if (critical_threshold_percent !== undefined) {
      if (critical_threshold_percent < 1 || critical_threshold_percent > 99) {
        return res.status(400).json({
          success: false,
          error: 'Critical threshold must be between 1 and 99'
        })
      }
      updates.critical_threshold_percent = critical_threshold_percent
    }
    
    // Validate warning < critical
    const warn = updates.warning_threshold_percent || 75
    const crit = updates.critical_threshold_percent || 90
    if (warn >= crit) {
      return res.status(400).json({
        success: false,
        error: 'Warning threshold must be less than critical threshold'
      })
    }
    
    if (is_active !== undefined) {
      updates.is_active = is_active
    }
    
    const updated = updateSLAConfig(parseInt(configId), updates, userId, reason || 'Updated via API')
    
    res.json({
      success: true,
      config: updated,
      message: 'SLA configuration updated successfully'
    })
  } catch (error) {
    console.error('Error updating SLA config:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update SLA configuration',
      message: error.message
    })
  }
}

/**
 * GET /api/sla/calendar
 * Get business calendar
 */
export async function getCalendar(req, res) {
  try {
    const { startDate, endDate } = req.query
    
    // Default to current month if not specified
    const today = new Date()
    const start = startDate || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    const end = endDate || new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
    
    const calendar = getBusinessCalendar(start, end)
    
    // Calculate stats
    const workingDays = calendar.filter(d => d.is_working_day).length
    const holidays = calendar.filter(d => d.holiday_name).length
    const syncedDays = calendar.filter(d => d.synced_from_hrms).length
    
    res.json({
      success: true,
      calendar,
      stats: {
        totalDays: calendar.length,
        workingDays,
        holidays,
        syncedFromHrms: syncedDays
      },
      range: { start, end }
    })
  } catch (error) {
    console.error('Error getting business calendar:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get business calendar',
      message: error.message
    })
  }
}

/**
 * POST /api/sla/calendar/sync
 * Sync business calendar from HRMS (production) or generate prototype calendar
 */
export async function syncCalendar(req, res) {
  try {
    const { holidays, generatePrototype, days } = req.body
    
    if (generatePrototype) {
      // Generate prototype calendar (weekdays only)
      const result = generatePrototypeCalendar(days || 90)
      
      return res.json({
        success: true,
        message: `Generated ${result.generated} calendar days (prototype mode)`,
        result
      })
    }
    
    if (holidays && Array.isArray(holidays)) {
      // Sync provided holidays
      const result = syncCalendarFromHRMS(holidays)
      
      return res.json({
        success: true,
        message: `Synced ${result.added} new holidays, updated ${result.updated} existing`,
        result
      })
    }
    
    // In production, this would call the HRMS API
    res.json({
      success: true,
      message: 'Calendar sync endpoint ready. Provide holidays array or set generatePrototype=true',
      example: {
        holidays: [
          { date: '2026-01-01', name: 'New Year' },
          { date: '2026-12-25', name: 'Christmas' }
        ]
      }
    })
  } catch (error) {
    console.error('Error syncing calendar:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to sync business calendar',
      message: error.message
    })
  }
}

/**
 * POST /api/sla/check
 * Trigger SLA check for all pending requests (prototype/testing)
 */
export async function triggerCheck(req, res) {
  try {
    const results = await checkAllPendingRequests()
    
    res.json({
      success: true,
      message: 'SLA check completed',
      results
    })
  } catch (error) {
    console.error('Error triggering SLA check:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to trigger SLA check',
      message: error.message
    })
  }
}

/**
 * GET /api/sla/status/:requestId
 * Get SLA status for a specific request
 */
export async function getRequestSLAStatus(req, res) {
  try {
    const { requestId } = req.params
    const db = getDatabase()
    
    const request = db.prepare(`
      SELECT * FROM coi_requests 
      WHERE id = ? OR request_id = ?
    `).get(requestId, requestId)
    
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      })
    }
    
    const slaStatus = calculateSLAStatus(request)
    const effectiveDeadline = getEffectiveDeadline(request)
    
    res.json({
      success: true,
      requestId: request.request_id,
      status: request.status,
      sla: slaStatus,
      effectiveDeadline
    })
  } catch (error) {
    console.error('Error getting SLA status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get SLA status',
      message: error.message
    })
  }
}

/**
 * GET /api/sla/breaches
 * Get breach history with filters
 */
export async function getBreaches(req, res) {
  try {
    const { resolved, startDate, endDate } = req.query
    
    if (resolved === 'false') {
      // Get only unresolved breaches
      const breaches = getUnresolvedBreaches()
      
      return res.json({
        success: true,
        breaches,
        count: breaches.length
      })
    }
    
    // Get breach statistics if date range provided
    if (startDate && endDate) {
      const stats = getBreachStats(startDate, endDate)
      
      return res.json({
        success: true,
        stats,
        range: { startDate, endDate }
      })
    }
    
    // Default: get unresolved breaches
    const breaches = getUnresolvedBreaches()
    
    res.json({
      success: true,
      breaches,
      count: breaches.length
    })
  } catch (error) {
    console.error('Error getting breaches:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get breach data',
      message: error.message
    })
  }
}

export default {
  getAllConfigs,
  getConfigForStage,
  updateConfig,
  getCalendar,
  syncCalendar,
  triggerCheck,
  getRequestSLAStatus,
  getBreaches
}
