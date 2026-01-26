import { getDatabase } from '../database/init.js'

/**
 * SLA Service
 * Handles SLA calculation, business hours logic, and configuration management
 */

// SLA Status Constants
export const SLA_STATUS = {
  ON_TRACK: 'ON_TRACK',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  BREACHED: 'BREACHED'
}

/**
 * Get SLA configuration for a specific workflow stage
 * Considers service type and PIE status for specialized SLAs
 */
export function getSLAConfig(workflowStage, serviceType = null, isPIE = null) {
  const db = getDatabase()
  
  // Try to find specific SLA for PIE first
  if (isPIE === true || isPIE === 'Yes') {
    const pieConfig = db.prepare(`
      SELECT * FROM sla_config 
      WHERE workflow_stage = ? 
      AND applies_to_pie = 1 
      AND is_active = 1
      LIMIT 1
    `).get(workflowStage)
    
    if (pieConfig) {
      return {
        targetHours: pieConfig.target_hours,
        warningPercent: pieConfig.warning_threshold_percent,
        criticalPercent: pieConfig.critical_threshold_percent,
        source: 'pie_override'
      }
    }
  }
  
  // Try to find specific SLA for service type
  if (serviceType) {
    const serviceConfig = db.prepare(`
      SELECT * FROM sla_config 
      WHERE workflow_stage = ? 
      AND applies_to_service_type = ? 
      AND is_active = 1
      LIMIT 1
    `).get(workflowStage, serviceType)
    
    if (serviceConfig) {
      return {
        targetHours: serviceConfig.target_hours,
        warningPercent: serviceConfig.warning_threshold_percent,
        criticalPercent: serviceConfig.critical_threshold_percent,
        source: 'service_type_override'
      }
    }
  }
  
  // Fall back to default SLA for this stage
  const defaultConfig = db.prepare(`
    SELECT * FROM sla_config 
    WHERE workflow_stage = ? 
    AND applies_to_service_type IS NULL 
    AND applies_to_pie IS NULL 
    AND is_active = 1
    LIMIT 1
  `).get(workflowStage)
  
  if (defaultConfig) {
    return {
      targetHours: defaultConfig.target_hours,
      warningPercent: defaultConfig.warning_threshold_percent,
      criticalPercent: defaultConfig.critical_threshold_percent,
      source: 'default'
    }
  }
  
  // Ultimate fallback if no config found
  return {
    targetHours: 48,
    warningPercent: 75,
    criticalPercent: 90,
    source: 'fallback'
  }
}

/**
 * Calculate business hours between two dates using business_calendar
 */
export function calculateBusinessHours(startDate, endDate = new Date()) {
  const db = getDatabase()
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (start >= end) {
    return 0
  }
  
  const startStr = start.toISOString().split('T')[0]
  const endStr = end.toISOString().split('T')[0]
  
  // Get working days between dates from business_calendar
  const result = db.prepare(`
    SELECT COUNT(*) as working_days 
    FROM business_calendar 
    WHERE date >= ? AND date <= ? 
    AND is_working_day = 1
  `).get(startStr, endStr)
  
  const workingDays = result?.working_days || 0
  
  // Simple calculation: 9 working hours per day
  // For more accuracy, we could calculate partial days based on start/end times
  const WORKING_HOURS_PER_DAY = 9
  
  // Calculate full days
  let totalHours = workingDays * WORKING_HOURS_PER_DAY
  
  // Adjust for partial first and last day if same working day
  if (workingDays > 0) {
    const startHour = start.getHours()
    const endHour = end.getHours()
    
    // If start and end are on the same day
    if (startStr === endStr) {
      totalHours = Math.max(0, endHour - startHour)
    }
  }
  
  return Math.max(0, totalHours)
}

/**
 * Calculate simple elapsed hours (calendar hours, not business hours)
 * Used as fallback when business calendar is incomplete
 */
export function calculateElapsedHours(startDate, endDate = new Date()) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  const diffMs = end - start
  const diffHours = diffMs / (1000 * 60 * 60)
  
  return Math.max(0, diffHours)
}

/**
 * Calculate SLA status for a request
 */
export function calculateSLAStatus(request) {
  // Determine when this stage started
  const stageStartTime = request.stage_entered_at || request.updated_at || request.created_at
  
  if (!stageStartTime) {
    return {
      status: SLA_STATUS.ON_TRACK,
      targetHours: 48,
      hoursElapsed: 0,
      hoursRemaining: 48,
      percentUsed: 0,
      breachTime: null,
      message: 'No stage start time available'
    }
  }
  
  // Get SLA config for this request
  const slaConfig = getSLAConfig(
    request.status,
    request.service_type,
    request.pie_status
  )
  
  // Calculate elapsed hours
  const hoursElapsed = calculateBusinessHours(stageStartTime)
  const percentUsed = (hoursElapsed / slaConfig.targetHours) * 100
  const hoursRemaining = Math.max(0, slaConfig.targetHours - hoursElapsed)
  
  // Calculate breach time
  const stageStart = new Date(stageStartTime)
  const breachTime = new Date(stageStart.getTime() + (slaConfig.targetHours * 60 * 60 * 1000))
  
  // Determine status
  let status
  if (percentUsed >= 100) {
    status = SLA_STATUS.BREACHED
  } else if (percentUsed >= slaConfig.criticalPercent) {
    status = SLA_STATUS.CRITICAL
  } else if (percentUsed >= slaConfig.warningPercent) {
    status = SLA_STATUS.WARNING
  } else {
    status = SLA_STATUS.ON_TRACK
  }
  
  return {
    status,
    targetHours: slaConfig.targetHours,
    hoursElapsed: Math.round(hoursElapsed * 10) / 10,
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    percentUsed: Math.round(percentUsed),
    breachTime: breachTime.toISOString(),
    warningThreshold: slaConfig.warningPercent,
    criticalThreshold: slaConfig.criticalPercent,
    configSource: slaConfig.source
  }
}

/**
 * Get effective deadline for a request
 * External deadline takes precedence over SLA-calculated deadline
 */
export function getEffectiveDeadline(request) {
  // Check for external deadline first
  if (request.external_deadline) {
    const externalDeadline = new Date(request.external_deadline)
    const now = new Date()
    
    return {
      deadline: externalDeadline.toISOString(),
      source: request.deadline_source || 'external',
      reason: request.deadline_reason,
      isOverdue: now > externalDeadline,
      hoursRemaining: Math.max(0, (externalDeadline - now) / (1000 * 60 * 60))
    }
  }
  
  // Fall back to SLA-calculated deadline
  const slaStatus = calculateSLAStatus(request)
  
  return {
    deadline: slaStatus.breachTime,
    source: 'sla',
    reason: `SLA: ${slaStatus.targetHours}h for ${request.status}`,
    isOverdue: slaStatus.status === SLA_STATUS.BREACHED,
    hoursRemaining: slaStatus.hoursRemaining
  }
}

/**
 * Calculate deadline status for external deadline
 */
export function calculateDeadlineStatus(externalDeadline) {
  if (!externalDeadline) {
    return 'NONE'
  }
  
  const deadline = new Date(externalDeadline)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)
  const twoWeeks = new Date(today)
  twoWeeks.setDate(twoWeeks.getDate() + 14)
  
  if (deadline < now) {
    return 'OVERDUE'
  } else if (deadline < tomorrow) {
    return 'TODAY'
  } else if (deadline < nextWeek) {
    return 'THIS_WEEK'
  } else if (deadline < twoWeeks) {
    return 'NEXT_WEEK'
  } else {
    return 'NONE'  // Far in the future, not urgent
  }
}

/**
 * Get all SLA configurations
 */
export function getAllSLAConfigs() {
  const db = getDatabase()
  
  return db.prepare(`
    SELECT * FROM sla_config 
    WHERE is_active = 1 
    ORDER BY workflow_stage, applies_to_pie DESC, applies_to_service_type
  `).all()
}

/**
 * Update SLA configuration
 */
export function updateSLAConfig(configId, updates, userId, reason = '') {
  const db = getDatabase()
  
  // Get current config for audit
  const current = db.prepare('SELECT * FROM sla_config WHERE id = ?').get(configId)
  
  if (!current) {
    throw new Error('SLA configuration not found')
  }
  
  // Build update query
  const allowedFields = ['target_hours', 'warning_threshold_percent', 'critical_threshold_percent', 'is_active']
  const updateParts = []
  const values = []
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateParts.push(`${field} = ?`)
      values.push(updates[field])
    }
  }
  
  if (updateParts.length === 0) {
    throw new Error('No valid fields to update')
  }
  
  updateParts.push('updated_by = ?', 'updated_at = CURRENT_TIMESTAMP')
  values.push(userId)
  values.push(configId)
  
  db.prepare(`
    UPDATE sla_config 
    SET ${updateParts.join(', ')} 
    WHERE id = ?
  `).run(...values)
  
  // Log to audit (using priority_audit for now, could create sla_audit table)
  db.prepare(`
    INSERT INTO priority_audit (factor_id, field_changed, old_value, new_value, changed_by, reason)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    `sla_${current.workflow_stage}`,
    JSON.stringify(Object.keys(updates)),
    JSON.stringify(current),
    JSON.stringify(updates),
    userId,
    reason
  )
  
  return db.prepare('SELECT * FROM sla_config WHERE id = ?').get(configId)
}

/**
 * Sync business calendar from HRMS
 * In production, this would call the HRMS API
 */
export function syncCalendarFromHRMS(holidays) {
  const db = getDatabase()
  
  let added = 0
  let updated = 0
  
  const upsert = db.prepare(`
    INSERT INTO business_calendar (date, is_working_day, holiday_name, synced_from_hrms, synced_at)
    VALUES (?, 0, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(date) DO UPDATE SET
      is_working_day = 0,
      holiday_name = excluded.holiday_name,
      synced_from_hrms = 1,
      synced_at = CURRENT_TIMESTAMP
  `)
  
  for (const holiday of holidays) {
    const result = upsert.run(holiday.date, holiday.name)
    if (result.changes > 0) {
      if (result.lastInsertRowid) {
        added++
      } else {
        updated++
      }
    }
  }
  
  return { added, updated }
}

/**
 * Generate business calendar for prototype (weekdays only)
 */
export function generatePrototypeCalendar(days = 90) {
  const db = getDatabase()
  
  const today = new Date()
  let generated = 0
  
  const insert = db.prepare(`
    INSERT OR IGNORE INTO business_calendar (date, is_working_day, holiday_name)
    VALUES (?, ?, ?)
  `)
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    const dayOfWeek = date.getDay()
    const isWorkingDay = dayOfWeek !== 0 && dayOfWeek !== 6
    
    const result = insert.run(dateStr, isWorkingDay ? 1 : 0, null)
    if (result.changes > 0) generated++
  }
  
  return { generated }
}

/**
 * Get business calendar
 */
export function getBusinessCalendar(startDate, endDate) {
  const db = getDatabase()
  
  return db.prepare(`
    SELECT * FROM business_calendar
    WHERE date >= ? AND date <= ?
    ORDER BY date
  `).all(startDate, endDate)
}

export default {
  SLA_STATUS,
  getSLAConfig,
  calculateBusinessHours,
  calculateElapsedHours,
  calculateSLAStatus,
  getEffectiveDeadline,
  calculateDeadlineStatus,
  getAllSLAConfigs,
  updateSLAConfig,
  syncCalendarFromHRMS,
  generatePrototypeCalendar,
  getBusinessCalendar
}
