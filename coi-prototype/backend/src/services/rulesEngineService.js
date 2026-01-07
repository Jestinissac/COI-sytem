import { getDatabase } from '../database/init.js'
import { updateRulesEngineHealth, resetRulesEngine as resetImpactEngine } from './impactAnalysisService.js'

const db = getDatabase()

// Circuit breaker state
let failureCount = 0
let circuitOpen = false
const CIRCUIT_BREAKER_THRESHOLD = 3

export function checkRulesEngineHealth() {
  try {
    const health = db.prepare('SELECT * FROM rules_engine_health ORDER BY id DESC LIMIT 1').get()
    
    if (!health) {
      // Initialize health record
      db.prepare(`
        INSERT INTO rules_engine_health (engine_version, status, last_check_at)
        VALUES ('1.0', 'healthy', CURRENT_TIMESTAMP)
      `).run()
      return { status: 'healthy', circuitBreakerOpen: false }
    }

    // Check if circuit breaker should be open
    if (health.status === 'failed' && health.error_count >= CIRCUIT_BREAKER_THRESHOLD) {
      circuitOpen = true
      return { status: 'failed', circuitBreakerOpen: true, errorCount: health.error_count }
    }

    // Check last check time (if > 10 minutes ago, mark as degraded)
    const lastCheck = new Date(health.last_check_at)
    const now = new Date()
    const minutesSinceCheck = (now - lastCheck) / (1000 * 60)

    if (minutesSinceCheck > 10) {
      updateRulesEngineHealth('degraded', 'Health check timeout')
      return { status: 'degraded', circuitBreakerOpen: false }
    }

    circuitOpen = false
    return { status: health.status, circuitBreakerOpen: false, errorCount: health.error_count }
  } catch (error) {
    circuitOpen = true
    updateRulesEngineHealth('failed', error.message)
    return { status: 'failed', circuitBreakerOpen: true, error: error.message }
  }
}

export async function validateWithFallback(fieldId, change) {
  // Check circuit breaker first
  const health = checkRulesEngineHealth()
  
  if (health.circuitBreakerOpen) {
    return {
      allowed: false,
      requiresManualApproval: true,
      reason: 'Rules engine unavailable - circuit breaker open',
      fallback: 'manual_approval',
      circuitBreakerOpen: true
    }
  }

  try {
    // Primary: Full validation using impact analysis
    const { analyzeFieldChange, validateChange } = await import('./impactAnalysisService.js')
    const dataConsistencyService = await import('./dataConsistencyService.js')
    const { validateFieldRemoval, validateFieldTypeChange, validateFieldRename } = dataConsistencyService
    
    let validationResult

    switch (change.changeType) {
      case 'field_removed':
        validationResult = validateFieldRemoval(fieldId)
        break
      case 'field_type_changed':
        validationResult = validateFieldTypeChange(fieldId, change.newType)
        break
      case 'field_renamed':
        validationResult = validateFieldRename(fieldId, change.newFieldId)
        break
      default:
        validationResult = validateChange(fieldId, change)
    }

    const impact = analyzeFieldChange(fieldId, change.changeType)

    // Reset failure count on success
    failureCount = 0
    if (circuitOpen) {
      circuitOpen = false
      updateRulesEngineHealth('healthy', null)
    }

    return {
      allowed: validationResult.valid !== false && validationResult.safe !== false && !impact.requiresManualApproval,
      requiresManualApproval: impact.requiresApproval || impact.riskLevel === 'high' || impact.riskLevel === 'critical',
      impact,
      validation: validationResult,
      fallback: 'none'
    }
  } catch (error) {
    failureCount++
    
    // Fallback 1: Basic validation
    try {
      const basicValidation = basicFieldValidation(fieldId, change)
      if (basicValidation.valid) {
        return {
          allowed: false,
          requiresManualApproval: true,
          reason: `Rules engine error, but basic validation passed: ${error.message}`,
          fallback: 'basic_validation',
          basicValidation
        }
      }
    } catch (basicError) {
      // Basic validation also failed
    }

    // Fallback 2: Require manual approval
    if (failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
      circuitOpen = true
      updateRulesEngineHealth('failed', error.message)
      console.error('Rules engine failed - circuit breaker opened', error)
    }

    return {
      allowed: false,
      requiresManualApproval: true,
      reason: `Rules engine error: ${error.message}`,
      fallback: 'manual_approval',
      error: error.message
    }
  }
}

function basicFieldValidation(fieldId, change) {
  const validation = {
    valid: true,
    errors: []
  }

  // Basic checks that don't require complex logic
  if (change.changeType === 'field_removed' || change.changeType === 'field_renamed') {
    const field = db.prepare('SELECT * FROM form_fields_config WHERE field_id = ?').get(fieldId)
    if (!field) {
      validation.errors.push('Field does not exist')
      validation.valid = false
    }
  }

  if (change.changeType === 'field_renamed') {
    const existing = db.prepare('SELECT * FROM form_fields_config WHERE field_id = ?').get(change.newFieldId)
    if (existing) {
      validation.errors.push('New field ID already exists')
      validation.valid = false
    }
  }

  return validation
}

export function emergencyBypass(changeId, userId, reason) {
  try {
    const change = db.prepare('SELECT * FROM form_config_changes WHERE id = ?').get(changeId)
    if (!change) {
      throw new Error('Change record not found')
    }

    const health = getRulesEngineStatus()

    // Log emergency bypass
    db.prepare(`
      INSERT INTO emergency_bypass_log (change_id, bypassed_by, bypass_reason, rules_engine_status)
      VALUES (?, ?, ?, ?)
    `).run(
      changeId,
      userId,
      reason,
      JSON.stringify(health)
    )

    // Update change status to approved (bypassed)
    db.prepare(`
      UPDATE form_config_changes SET
        approval_status = 'Approved',
        approved_by = ?,
        approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(userId, changeId)

    return {
      success: true,
      message: 'Emergency bypass logged and change approved',
      changeId
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

export function getRulesEngineStatus() {
  const health = checkRulesEngineHealth()
  const dbHealth = db.prepare('SELECT * FROM rules_engine_health ORDER BY id DESC LIMIT 1').get()
  
  return {
    status: health.status,
    circuitBreakerOpen: health.circuitBreakerOpen || circuitOpen,
    failureCount,
    lastCheck: dbHealth?.last_check_at,
    lastError: dbHealth?.last_error,
    errorCount: dbHealth?.error_count || 0,
    engineVersion: dbHealth?.engine_version || '1.0'
  }
}

export function resetRulesEngine() {
  failureCount = 0
  circuitOpen = false
  updateRulesEngineHealth('healthy', null)
  resetImpactEngine()
  
  return {
    success: true,
    message: 'Rules engine reset successfully',
    status: 'healthy',
    circuitBreakerOpen: false
  }
}

// Periodic health check (call this from a cron job or scheduled task)
export function performHealthCheck() {
  try {
    const health = checkRulesEngineHealth()
    updateRulesEngineHealth(health.status, null)
    return health
  } catch (error) {
    updateRulesEngineHealth('failed', error.message)
    return { status: 'failed', error: error.message }
  }
}
