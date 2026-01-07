import { getDatabase } from '../database/init.js'

const db = getDatabase()

// Circuit breaker state
let failureCount = 0
let circuitOpen = false
const CIRCUIT_BREAKER_THRESHOLD = 3

export function analyzeFieldChange(fieldId, changeType) {
  try {
    // Check circuit breaker
    if (circuitOpen) {
      return {
        allowed: false,
        requiresManualApproval: true,
        reason: 'Rules engine unavailable - manual approval required',
        circuitBreakerOpen: true
      }
    }

    const impact = {
      fieldId,
      changeType,
      affectedRequests: [],
      affectedTemplates: [],
      affectedWorkflows: [],
      affectedRules: [],
      dependencies: [],
      riskLevel: 'low', // 'low', 'medium', 'high', 'critical'
      warnings: [],
      errors: []
    }

    // 1. Count requests using this field
    const requests = getAffectedRequests(fieldId)
    impact.affectedRequests = requests
    if (requests.length > 0) {
      impact.riskLevel = requests.length > 50 ? 'high' : 'medium'
      impact.warnings.push(`${requests.length} active requests use this field`)
    }

    // 2. Check if field is referenced in workflows
    const workflows = getWorkflowDependencies(fieldId)
    impact.affectedWorkflows = workflows
    if (workflows.length > 0) {
      impact.riskLevel = impact.riskLevel === 'high' ? 'critical' : 'high'
      impact.warnings.push(`Field is used in ${workflows.length} workflow step(s)`)
    }

    // 3. Check if field is used in business rules
    const rules = getBusinessRuleDependencies(fieldId)
    impact.affectedRules = rules
    if (rules.length > 0) {
      impact.riskLevel = impact.riskLevel === 'high' ? 'critical' : 'high'
      impact.warnings.push(`Field is referenced in ${rules.length} business rule(s)`)
    }

    // 4. Check conditional field dependencies
    const fieldDeps = getFieldDependencies(fieldId)
    impact.dependencies = fieldDeps
    if (fieldDeps.length > 0) {
      impact.warnings.push(`${fieldDeps.length} field(s) depend on this field`)
    }

    // 5. Check if field is in active templates
    const templates = getTemplateDependencies(fieldId)
    impact.affectedTemplates = templates
    if (templates.length > 0) {
      impact.warnings.push(`Field is used in ${templates.length} template(s)`)
    }

    // Reset failure count on success
    failureCount = 0
    if (circuitOpen) {
      circuitOpen = false
      updateRulesEngineHealth('healthy', null)
    }

    return {
      allowed: true,
      impact,
      requiresApproval: impact.riskLevel === 'high' || impact.riskLevel === 'critical'
    }
  } catch (error) {
    failureCount++
    if (failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
      circuitOpen = true
      updateRulesEngineHealth('failed', error.message)
      // Alert admins (in production, send notification)
      console.error('Rules engine failed - circuit breaker opened', error)
    }

    return {
      allowed: false,
      requiresManualApproval: true,
      reason: `Rules engine error: ${error.message}`,
      error: error.message
    }
  }
}

export function getAffectedRequests(fieldId) {
  try {
    // Check if field is in custom_fields JSON or in standard columns
    // For now, check custom_fields JSON
    const requests = db.prepare(`
      SELECT id, request_id, status, created_at
      FROM coi_requests
      WHERE custom_fields IS NOT NULL
      AND custom_fields != ''
      AND json_extract(custom_fields, '$.' || ?) IS NOT NULL
    `).all(fieldId)

    // Also check form version to see if field was in that version
    const fieldMapping = db.prepare('SELECT * FROM form_field_mappings WHERE field_id = ?').get(fieldId)
    if (fieldMapping && !fieldMapping.is_custom) {
      // Standard field - check all requests (they all have it)
      const allRequests = db.prepare(`
        SELECT id, request_id, status, created_at
        FROM coi_requests
        WHERE status != 'Draft'
        ORDER BY created_at DESC
        LIMIT 100
      `).all()
      return allRequests
    }

    return requests || []
  } catch (error) {
    // If JSON extraction fails, return empty array
    return []
  }
}

export function getDependencies(fieldId) {
  const dependencies = {
    fields: getFieldDependencies(fieldId),
    workflows: getWorkflowDependencies(fieldId),
    rules: getBusinessRuleDependencies(fieldId),
    templates: getTemplateDependencies(fieldId)
  }
  return dependencies
}

function getFieldDependencies(fieldId) {
  // Fields that have conditional display based on this field
  const fields = db.prepare(`
    SELECT field_id, section_id, field_label, dependency_type
    FROM field_dependencies
    WHERE depends_on_field_id = ?
  `).all(fieldId)

  // Also check form_fields_config for conditions
  const conditionalFields = db.prepare(`
    SELECT field_id, section_id, field_label, conditions
    FROM form_fields_config
    WHERE conditions IS NOT NULL
    AND conditions != ''
  `).all()

  const dependentFields = []
  for (const field of conditionalFields) {
    try {
      const conditions = typeof field.conditions === 'string' 
        ? JSON.parse(field.conditions) 
        : field.conditions
      if (conditions && conditions.field === fieldId) {
        dependentFields.push({
          field_id: field.field_id,
          section_id: field.section_id,
          field_label: field.field_label,
          dependency_type: 'conditional_display'
        })
      }
    } catch {
      // Invalid JSON, skip
    }
  }

  return [...fields, ...dependentFields]
}

function getWorkflowDependencies(fieldId) {
  // Check if field is referenced in workflow conditions
  const workflows = db.prepare(`
    SELECT workflow_name, step_name, step_status, conditions
    FROM workflow_config
    WHERE conditions IS NOT NULL
    AND conditions != ''
  `).all()

  const dependentWorkflows = []
  for (const workflow of workflows) {
    try {
      const conditions = typeof workflow.conditions === 'string'
        ? JSON.parse(workflow.conditions)
        : workflow.conditions
      if (conditions && JSON.stringify(conditions).includes(fieldId)) {
        dependentWorkflows.push({
          workflow_name: workflow.workflow_name,
          step_name: workflow.step_name,
          step_status: workflow.step_status
        })
      }
    } catch {
      // Invalid JSON, skip
    }
  }

  return dependentWorkflows
}

function getBusinessRuleDependencies(fieldId) {
  const rules = db.prepare(`
    SELECT id, rule_name, rule_type, condition_field
    FROM business_rules_config
    WHERE condition_field = ?
    AND is_active = 1
  `).all(fieldId)

  return rules
}

function getTemplateDependencies(fieldId) {
  const templates = db.prepare(`
    SELECT DISTINCT t.id, t.template_name
    FROM form_templates t
    INNER JOIN form_template_fields tf ON t.id = tf.template_id
    WHERE tf.field_id = ?
  `).all(fieldId)

  return templates
}

export function validateChange(fieldId, newConfig) {
  const validation = {
    valid: true,
    errors: [],
    warnings: []
  }

  // Check if field exists
  const existingField = db.prepare('SELECT * FROM form_fields_config WHERE field_id = ?').get(fieldId)
  
  if (newConfig.changeType === 'field_removed' || newConfig.changeType === 'field_renamed') {
    if (!existingField) {
      validation.errors.push('Field does not exist')
      validation.valid = false
      return validation
    }

    // Check if any requests have data in this field
    const requests = getAffectedRequests(fieldId)
    if (requests.length > 0) {
      validation.warnings.push(`${requests.length} requests have data in this field`)
      if (newConfig.changeType === 'field_removed') {
        validation.errors.push('Cannot remove field with existing data. Consider marking as inactive instead.')
        validation.valid = false
      }
    }
  }

  if (newConfig.changeType === 'field_modified') {
    if (!existingField) {
      validation.errors.push('Field does not exist')
      validation.valid = false
      return validation
    }

    // Check data type compatibility
    if (newConfig.field_type && existingField.field_type !== newConfig.field_type) {
      const compatible = checkDataTypeCompatibility(existingField.field_type, newConfig.field_type)
      if (!compatible) {
        validation.errors.push(`Cannot change field type from ${existingField.field_type} to ${newConfig.field_type} - data incompatibility`)
        validation.valid = false
      } else {
        validation.warnings.push(`Changing field type from ${existingField.field_type} to ${newConfig.field_type} may affect existing data`)
      }
    }

    // Check if making field required when it wasn't before
    if (newConfig.is_required && !existingField.is_required) {
      const requests = getAffectedRequests(fieldId)
      validation.warnings.push(`Making field required may invalidate ${requests.length} existing draft requests`)
    }
  }

  return validation
}

function checkDataTypeCompatibility(oldType, newType) {
  // Compatible type changes
  const compatibleChanges = {
    'text': ['textarea'], // text -> textarea is safe
    'number': ['text'], // number -> text is safe (loss of validation)
    'date': ['text'] // date -> text is safe (loss of validation)
  }

  return compatibleChanges[oldType]?.includes(newType) || oldType === newType
}

export function generateImpactReport(fieldId, changeType) {
  const impact = analyzeFieldChange(fieldId, changeType)
  const validation = validateChange(fieldId, { changeType, ...impact })

  return {
    fieldId,
    changeType,
    impact,
    validation,
    summary: {
      totalAffected: impact.affectedRequests.length + impact.affectedTemplates.length + impact.affectedWorkflows.length + impact.affectedRules.length,
      riskLevel: impact.riskLevel,
      requiresApproval: impact.requiresApproval || impact.riskLevel === 'high' || impact.riskLevel === 'critical',
      canProceed: validation.valid && !impact.requiresManualApproval
    }
  }
}

export function updateImpactCache(fieldId) {
  const impact = analyzeFieldChange(fieldId, 'analysis')
  const analysis = {
    affected_requests_count: impact.impact?.affectedRequests?.length || 0,
    affected_templates_count: impact.impact?.affectedTemplates?.length || 0,
    affected_workflows_count: impact.impact?.affectedWorkflows?.length || 0,
    affected_rules_count: impact.impact?.affectedRules?.length || 0,
    risk_level: impact.impact?.riskLevel || 'low',
    warnings: impact.impact?.warnings || []
  }

  const existing = db.prepare('SELECT * FROM field_impact_analysis WHERE field_id = ?').get(fieldId)
  
  if (existing) {
    db.prepare(`
      UPDATE field_impact_analysis SET
        affected_requests_count = ?,
        affected_templates_count = ?,
        affected_workflows_count = ?,
        affected_rules_count = ?,
        analysis_snapshot = ?,
        last_analyzed_at = CURRENT_TIMESTAMP
      WHERE field_id = ?
    `).run(
      analysis.affected_requests_count,
      analysis.affected_templates_count,
      analysis.affected_workflows_count,
      analysis.affected_rules_count,
      JSON.stringify(analysis),
      fieldId
    )
  } else {
    db.prepare(`
      INSERT INTO field_impact_analysis (
        field_id, affected_requests_count, affected_templates_count,
        affected_workflows_count, affected_rules_count, analysis_snapshot
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      fieldId,
      analysis.affected_requests_count,
      analysis.affected_templates_count,
      analysis.affected_workflows_count,
      analysis.affected_rules_count,
      JSON.stringify(analysis)
    )
  }
}

function updateRulesEngineHealth(status, error) {
  const existing = db.prepare('SELECT * FROM rules_engine_health ORDER BY id DESC LIMIT 1').get()
  
  if (existing) {
    db.prepare(`
      UPDATE rules_engine_health SET
        status = ?,
        error_count = ?,
        last_error = ?,
        last_check_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      status,
      status === 'failed' ? existing.error_count + 1 : 0,
      error || null,
      existing.id
    )
  } else {
    db.prepare(`
      INSERT INTO rules_engine_health (status, error_count, last_error)
      VALUES (?, ?, ?)
    `).run(status, error ? 1 : 0, error || null)
  }
}

export function getRulesEngineStatus() {
  const health = db.prepare('SELECT * FROM rules_engine_health ORDER BY id DESC LIMIT 1').get()
  return {
    status: health?.status || 'healthy',
    circuitBreakerOpen: circuitOpen,
    failureCount,
    lastCheck: health?.last_check_at,
    lastError: health?.last_error
  }
}

export function resetRulesEngine() {
  failureCount = 0
  circuitOpen = false
  updateRulesEngineHealth('healthy', null)
  return { success: true, message: 'Rules engine reset' }
}


const db = getDatabase()

// Circuit breaker state
let failureCount = 0
let circuitOpen = false
const CIRCUIT_BREAKER_THRESHOLD = 3

export function analyzeFieldChange(fieldId, changeType) {
  try {
    // Check circuit breaker
    if (circuitOpen) {
      return {
        allowed: false,
        requiresManualApproval: true,
        reason: 'Rules engine unavailable - manual approval required',
        circuitBreakerOpen: true
      }
    }

    const impact = {
      fieldId,
      changeType,
      affectedRequests: [],
      affectedTemplates: [],
      affectedWorkflows: [],
      affectedRules: [],
      dependencies: [],
      riskLevel: 'low', // 'low', 'medium', 'high', 'critical'
      warnings: [],
      errors: []
    }

    // 1. Count requests using this field
    const requests = getAffectedRequests(fieldId)
    impact.affectedRequests = requests
    if (requests.length > 0) {
      impact.riskLevel = requests.length > 50 ? 'high' : 'medium'
      impact.warnings.push(`${requests.length} active requests use this field`)
    }

    // 2. Check if field is referenced in workflows
    const workflows = getWorkflowDependencies(fieldId)
    impact.affectedWorkflows = workflows
    if (workflows.length > 0) {
      impact.riskLevel = impact.riskLevel === 'high' ? 'critical' : 'high'
      impact.warnings.push(`Field is used in ${workflows.length} workflow step(s)`)
    }

    // 3. Check if field is used in business rules
    const rules = getBusinessRuleDependencies(fieldId)
    impact.affectedRules = rules
    if (rules.length > 0) {
      impact.riskLevel = impact.riskLevel === 'high' ? 'critical' : 'high'
      impact.warnings.push(`Field is referenced in ${rules.length} business rule(s)`)
    }

    // 4. Check conditional field dependencies
    const fieldDeps = getFieldDependencies(fieldId)
    impact.dependencies = fieldDeps
    if (fieldDeps.length > 0) {
      impact.warnings.push(`${fieldDeps.length} field(s) depend on this field`)
    }

    // 5. Check if field is in active templates
    const templates = getTemplateDependencies(fieldId)
    impact.affectedTemplates = templates
    if (templates.length > 0) {
      impact.warnings.push(`Field is used in ${templates.length} template(s)`)
    }

    // Reset failure count on success
    failureCount = 0
    if (circuitOpen) {
      circuitOpen = false
      updateRulesEngineHealth('healthy', null)
    }

    return {
      allowed: true,
      impact,
      requiresApproval: impact.riskLevel === 'high' || impact.riskLevel === 'critical'
    }
  } catch (error) {
    failureCount++
    if (failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
      circuitOpen = true
      updateRulesEngineHealth('failed', error.message)
      // Alert admins (in production, send notification)
      console.error('Rules engine failed - circuit breaker opened', error)
    }

    return {
      allowed: false,
      requiresManualApproval: true,
      reason: `Rules engine error: ${error.message}`,
      error: error.message
    }
  }
}

export function getAffectedRequests(fieldId) {
  try {
    // Check if field is in custom_fields JSON or in standard columns
    // For now, check custom_fields JSON
    const requests = db.prepare(`
      SELECT id, request_id, status, created_at
      FROM coi_requests
      WHERE custom_fields IS NOT NULL
      AND custom_fields != ''
      AND json_extract(custom_fields, '$.' || ?) IS NOT NULL
    `).all(fieldId)

    // Also check form version to see if field was in that version
    const fieldMapping = db.prepare('SELECT * FROM form_field_mappings WHERE field_id = ?').get(fieldId)
    if (fieldMapping && !fieldMapping.is_custom) {
      // Standard field - check all requests (they all have it)
      const allRequests = db.prepare(`
        SELECT id, request_id, status, created_at
        FROM coi_requests
        WHERE status != 'Draft'
        ORDER BY created_at DESC
        LIMIT 100
      `).all()
      return allRequests
    }

    return requests || []
  } catch (error) {
    // If JSON extraction fails, return empty array
    return []
  }
}

export function getDependencies(fieldId) {
  const dependencies = {
    fields: getFieldDependencies(fieldId),
    workflows: getWorkflowDependencies(fieldId),
    rules: getBusinessRuleDependencies(fieldId),
    templates: getTemplateDependencies(fieldId)
  }
  return dependencies
}

function getFieldDependencies(fieldId) {
  // Fields that have conditional display based on this field
  const fields = db.prepare(`
    SELECT field_id, section_id, field_label, dependency_type
    FROM field_dependencies
    WHERE depends_on_field_id = ?
  `).all(fieldId)

  // Also check form_fields_config for conditions
  const conditionalFields = db.prepare(`
    SELECT field_id, section_id, field_label, conditions
    FROM form_fields_config
    WHERE conditions IS NOT NULL
    AND conditions != ''
  `).all()

  const dependentFields = []
  for (const field of conditionalFields) {
    try {
      const conditions = typeof field.conditions === 'string' 
        ? JSON.parse(field.conditions) 
        : field.conditions
      if (conditions && conditions.field === fieldId) {
        dependentFields.push({
          field_id: field.field_id,
          section_id: field.section_id,
          field_label: field.field_label,
          dependency_type: 'conditional_display'
        })
      }
    } catch {
      // Invalid JSON, skip
    }
  }

  return [...fields, ...dependentFields]
}

function getWorkflowDependencies(fieldId) {
  // Check if field is referenced in workflow conditions
  const workflows = db.prepare(`
    SELECT workflow_name, step_name, step_status, conditions
    FROM workflow_config
    WHERE conditions IS NOT NULL
    AND conditions != ''
  `).all()

  const dependentWorkflows = []
  for (const workflow of workflows) {
    try {
      const conditions = typeof workflow.conditions === 'string'
        ? JSON.parse(workflow.conditions)
        : workflow.conditions
      if (conditions && JSON.stringify(conditions).includes(fieldId)) {
        dependentWorkflows.push({
          workflow_name: workflow.workflow_name,
          step_name: workflow.step_name,
          step_status: workflow.step_status
        })
      }
    } catch {
      // Invalid JSON, skip
    }
  }

  return dependentWorkflows
}

function getBusinessRuleDependencies(fieldId) {
  const rules = db.prepare(`
    SELECT id, rule_name, rule_type, condition_field
    FROM business_rules_config
    WHERE condition_field = ?
    AND is_active = 1
  `).all(fieldId)

  return rules
}

function getTemplateDependencies(fieldId) {
  const templates = db.prepare(`
    SELECT DISTINCT t.id, t.template_name
    FROM form_templates t
    INNER JOIN form_template_fields tf ON t.id = tf.template_id
    WHERE tf.field_id = ?
  `).all(fieldId)

  return templates
}

export function validateChange(fieldId, newConfig) {
  const validation = {
    valid: true,
    errors: [],
    warnings: []
  }

  // Check if field exists
  const existingField = db.prepare('SELECT * FROM form_fields_config WHERE field_id = ?').get(fieldId)
  
  if (newConfig.changeType === 'field_removed' || newConfig.changeType === 'field_renamed') {
    if (!existingField) {
      validation.errors.push('Field does not exist')
      validation.valid = false
      return validation
    }

    // Check if any requests have data in this field
    const requests = getAffectedRequests(fieldId)
    if (requests.length > 0) {
      validation.warnings.push(`${requests.length} requests have data in this field`)
      if (newConfig.changeType === 'field_removed') {
        validation.errors.push('Cannot remove field with existing data. Consider marking as inactive instead.')
        validation.valid = false
      }
    }
  }

  if (newConfig.changeType === 'field_modified') {
    if (!existingField) {
      validation.errors.push('Field does not exist')
      validation.valid = false
      return validation
    }

    // Check data type compatibility
    if (newConfig.field_type && existingField.field_type !== newConfig.field_type) {
      const compatible = checkDataTypeCompatibility(existingField.field_type, newConfig.field_type)
      if (!compatible) {
        validation.errors.push(`Cannot change field type from ${existingField.field_type} to ${newConfig.field_type} - data incompatibility`)
        validation.valid = false
      } else {
        validation.warnings.push(`Changing field type from ${existingField.field_type} to ${newConfig.field_type} may affect existing data`)
      }
    }

    // Check if making field required when it wasn't before
    if (newConfig.is_required && !existingField.is_required) {
      const requests = getAffectedRequests(fieldId)
      validation.warnings.push(`Making field required may invalidate ${requests.length} existing draft requests`)
    }
  }

  return validation
}

function checkDataTypeCompatibility(oldType, newType) {
  // Compatible type changes
  const compatibleChanges = {
    'text': ['textarea'], // text -> textarea is safe
    'number': ['text'], // number -> text is safe (loss of validation)
    'date': ['text'] // date -> text is safe (loss of validation)
  }

  return compatibleChanges[oldType]?.includes(newType) || oldType === newType
}

export function generateImpactReport(fieldId, changeType) {
  const impact = analyzeFieldChange(fieldId, changeType)
  const validation = validateChange(fieldId, { changeType, ...impact })

  return {
    fieldId,
    changeType,
    impact,
    validation,
    summary: {
      totalAffected: impact.affectedRequests.length + impact.affectedTemplates.length + impact.affectedWorkflows.length + impact.affectedRules.length,
      riskLevel: impact.riskLevel,
      requiresApproval: impact.requiresApproval || impact.riskLevel === 'high' || impact.riskLevel === 'critical',
      canProceed: validation.valid && !impact.requiresManualApproval
    }
  }
}

export function updateImpactCache(fieldId) {
  const impact = analyzeFieldChange(fieldId, 'analysis')
  const analysis = {
    affected_requests_count: impact.impact?.affectedRequests?.length || 0,
    affected_templates_count: impact.impact?.affectedTemplates?.length || 0,
    affected_workflows_count: impact.impact?.affectedWorkflows?.length || 0,
    affected_rules_count: impact.impact?.affectedRules?.length || 0,
    risk_level: impact.impact?.riskLevel || 'low',
    warnings: impact.impact?.warnings || []
  }

  const existing = db.prepare('SELECT * FROM field_impact_analysis WHERE field_id = ?').get(fieldId)
  
  if (existing) {
    db.prepare(`
      UPDATE field_impact_analysis SET
        affected_requests_count = ?,
        affected_templates_count = ?,
        affected_workflows_count = ?,
        affected_rules_count = ?,
        analysis_snapshot = ?,
        last_analyzed_at = CURRENT_TIMESTAMP
      WHERE field_id = ?
    `).run(
      analysis.affected_requests_count,
      analysis.affected_templates_count,
      analysis.affected_workflows_count,
      analysis.affected_rules_count,
      JSON.stringify(analysis),
      fieldId
    )
  } else {
    db.prepare(`
      INSERT INTO field_impact_analysis (
        field_id, affected_requests_count, affected_templates_count,
        affected_workflows_count, affected_rules_count, analysis_snapshot
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      fieldId,
      analysis.affected_requests_count,
      analysis.affected_templates_count,
      analysis.affected_workflows_count,
      analysis.affected_rules_count,
      JSON.stringify(analysis)
    )
  }
}

function updateRulesEngineHealth(status, error) {
  const existing = db.prepare('SELECT * FROM rules_engine_health ORDER BY id DESC LIMIT 1').get()
  
  if (existing) {
    db.prepare(`
      UPDATE rules_engine_health SET
        status = ?,
        error_count = ?,
        last_error = ?,
        last_check_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      status,
      status === 'failed' ? existing.error_count + 1 : 0,
      error || null,
      existing.id
    )
  } else {
    db.prepare(`
      INSERT INTO rules_engine_health (status, error_count, last_error)
      VALUES (?, ?, ?)
    `).run(status, error ? 1 : 0, error || null)
  }
}

export function getRulesEngineStatus() {
  const health = db.prepare('SELECT * FROM rules_engine_health ORDER BY id DESC LIMIT 1').get()
  return {
    status: health?.status || 'healthy',
    circuitBreakerOpen: circuitOpen,
    failureCount,
    lastCheck: health?.last_check_at,
    lastError: health?.last_error
  }
}

export function resetRulesEngine() {
  failureCount = 0
  circuitOpen = false
  updateRulesEngineHealth('healthy', null)
  return { success: true, message: 'Rules engine reset' }
}

