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

export function updateRulesEngineHealth(status, error) {
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

/**
 * Analyze impact of changing a business rule
 * Returns detailed impact analysis before rule is updated
 */
export function analyzeRuleChange(ruleId, proposedChanges) {
  try {
    const currentRule = db.prepare('SELECT * FROM business_rules_config WHERE id = ?').get(ruleId)
    
    if (!currentRule) {
      return {
        error: 'Rule not found',
        allowed: false
      }
    }

    const changeType = determineChangeType(currentRule, proposedChanges)
    const impact = {
      ruleId,
      ruleName: currentRule.rule_name,
      ruleType: currentRule.rule_type,
      changeType,
      affectedRequests: {
        currentlyMatching: 0,
        wouldMatch: 0,
        wouldStopMatching: 0,
        wouldStartMatching: 0,
        requestIds: []
      },
      historicalExecutions: {
        totalExecutions: 0,
        uniqueRequests: 0
      },
      pendingReviewsAffected: 0,
      riskLevel: 'low',
      warnings: [],
      errors: [],
      requiresApproval: false,
      actionTypeChange: proposedChanges.action_type !== undefined && proposedChanges.action_type !== currentRule.action_type
        ? { from: currentRule.action_type, to: proposedChanges.action_type }
        : null
    }

    // 1. Get historical rule executions
    try {
      const executions = db.prepare(`
        SELECT 
          COUNT(*) as total_executions,
          COUNT(DISTINCT coi_request_id) as unique_requests
        FROM rule_execution_log 
        WHERE rule_id = ?
      `).get(ruleId)
      
      impact.historicalExecutions = {
        totalExecutions: executions?.total_executions || 0,
        uniqueRequests: executions?.unique_requests || 0
      }
      
      if (impact.historicalExecutions.totalExecutions > 0) {
        impact.warnings.push(`Rule has been executed ${impact.historicalExecutions.totalExecutions} times historically`)
      }
    } catch (error) {
      // Table might not exist yet, continue
      console.log('Rule execution log table not available:', error.message)
    }

    // 2. Find requests that currently match this rule
    const currentlyMatching = findMatchingRequests(currentRule)
    impact.affectedRequests.currentlyMatching = currentlyMatching.length
    impact.affectedRequests.requestIds = currentlyMatching.map(r => r.id)

    // 3. If rule is being changed, simulate new rule and find differences
    if (Object.keys(proposedChanges).length > 0) {
      const proposedRule = {
        ...currentRule,
        ...proposedChanges
      }
      
      const wouldMatch = findMatchingRequests(proposedRule)
      impact.affectedRequests.wouldMatch = wouldMatch.length
      
      const wouldMatchIds = new Set(wouldMatch.map(r => r.id))
      const currentlyMatchIds = new Set(currentlyMatching.map(r => r.id))
      
      // Requests that would stop matching
      const wouldStopMatching = currentlyMatching.filter(r => !wouldMatchIds.has(r.id))
      impact.affectedRequests.wouldStopMatching = wouldStopMatching.length
      
      // Requests that would start matching
      const wouldStartMatching = wouldMatch.filter(r => !currentlyMatchIds.has(r.id))
      impact.affectedRequests.wouldStartMatching = wouldStartMatching.length
      
      if (wouldStopMatching.length > 0) {
        impact.warnings.push(`${wouldStopMatching.length} request(s) would no longer match this rule`)
      }
      
      if (wouldStartMatching.length > 0) {
        impact.warnings.push(`${wouldStartMatching.length} request(s) would newly match this rule`)
      }
    }

    // 4. Check pending compliance reviews that reference this rule
    try {
      const pendingWithRule = db.prepare(`
        SELECT id, request_id, status, duplication_matches
        FROM coi_requests
        WHERE status IN ('Pending Compliance', 'Pending Partner', 'Pending Director Approval')
        AND duplication_matches IS NOT NULL
        AND duplication_matches != ''
      `).all()
      
      let pendingCount = 0
      for (const request of pendingWithRule) {
        try {
          const matches = typeof request.duplication_matches === 'string'
            ? JSON.parse(request.duplication_matches)
            : request.duplication_matches
          
          const recommendations = matches?.ruleRecommendations || []
          const hasThisRule = recommendations.some(rec => rec.ruleId === ruleId)
          
          if (hasThisRule) {
            pendingCount++
          }
        } catch {
          // Invalid JSON, skip
        }
      }
      
      impact.pendingReviewsAffected = pendingCount
      
      if (pendingCount > 0) {
        impact.warnings.push(`${pendingCount} pending compliance review(s) reference this rule`)
      }
    } catch (error) {
      console.log('Error checking pending reviews:', error.message)
    }

    // 5. Check if current rule configuration is problematic (even without changes)
    if (currentRule.rule_type === 'conflict' && 
        (currentRule.action_type === 'recommend_approve' || currentRule.action_type === 'set_status')) {
      impact.warnings.push('WARNING: Conflict rule is configured with a non-blocking action - this may allow prohibited conflicts')
      // Add risk for misconfigured conflict rules
      if (!impact.actionTypeChange || impact.actionTypeChange.to === 'recommend_approve') {
        impact.warnings.push('CRITICAL: Conflict rules should block or recommend rejection, not approval')
      }
    }
    
    // 6. Calculate risk level (pass currentRule and proposedChanges for action type analysis)
    impact.riskLevel = calculateRuleChangeRisk(impact, currentRule, proposedChanges)
    
    // 7. Determine if approval is required
    impact.requiresApproval = impact.riskLevel === 'high' || impact.riskLevel === 'critical'
    
    if (impact.requiresApproval) {
      impact.warnings.push('This rule change requires approval due to high impact')
    }

    return {
      allowed: true,
      impact,
      requiresApproval: impact.requiresApproval
    }
  } catch (error) {
    console.error('Error analyzing rule change impact:', error)
    return {
      allowed: false,
      error: error.message,
      requiresManualApproval: true
    }
  }
}

/**
 * Find all requests that match a given rule
 */
function findMatchingRequests(rule) {
  try {
    // Get all active/pending requests
    const requests = db.prepare(`
      SELECT id, request_id, status, service_type, client_id, pie_status,
             client_name, client_type, custom_fields
      FROM coi_requests
      WHERE status NOT IN ('Draft', 'Rejected', 'Cancelled')
      ORDER BY created_at DESC
      LIMIT 500
    `).all()
    
    const matchingRequests = []
    
    for (const request of requests) {
      // Get client info if needed
      let client = null
      if (request.client_id) {
        client = db.prepare('SELECT * FROM clients WHERE id = ?').get(request.client_id)
      }
      
      // Build request data object for rule evaluation
      const requestData = {
        id: request.id,
        request_id: request.request_id,
        service_type: request.service_type,
        pie_status: request.pie_status,
        client_name: request.client_name || client?.client_name,
        client_type: request.client_type || client?.client_type,
        ...(request.custom_fields ? JSON.parse(request.custom_fields) : {})
      }
      
      // Evaluate if rule matches
      if (evaluateRuleMatch(rule, requestData)) {
        matchingRequests.push({
          id: request.id,
          request_id: request.request_id,
          status: request.status
        })
      }
    }
    
    return matchingRequests
  } catch (error) {
    console.error('Error finding matching requests:', error)
    return []
  }
}

/**
 * Evaluate if a rule matches request data
 * Simplified version of evaluateRule from businessRulesEngine
 */
function evaluateRuleMatch(rule, requestData) {
  // If no condition field, rule always matches (catch-all rule)
  if (!rule.condition_field) {
    return true
  }

  const fieldValue = getFieldValueForRule(requestData, rule.condition_field)
  
  if (fieldValue === undefined || fieldValue === null) {
    return false
  }

  const conditionValue = rule.condition_value
  const operator = rule.condition_operator || 'equals'

  return evaluateConditionForRule(fieldValue, operator, conditionValue)
}

/**
 * Get field value from request data for rule evaluation
 */
function getFieldValueForRule(requestData, fieldId) {
  // Direct property access
  if (requestData[fieldId] !== undefined) {
    return requestData[fieldId]
  }
  
  // Check nested properties (e.g., client.name)
  const parts = fieldId.split('.')
  let value = requestData
  for (const part of parts) {
    if (value && typeof value === 'object') {
      value = value[part]
    } else {
      return undefined
    }
  }
  
  return value
}

/**
 * Evaluate condition for rule matching
 */
function evaluateConditionForRule(fieldValue, operator, conditionValue) {
  const fieldStr = String(fieldValue).toLowerCase()
  const conditionStr = String(conditionValue).toLowerCase()

  switch (operator) {
    case 'equals':
    case '=':
      return fieldStr === conditionStr
    
    case 'not_equals':
    case '!=':
      return fieldStr !== conditionStr
    
    case 'contains':
      return fieldStr.includes(conditionStr)
    
    case 'not_contains':
      return !fieldStr.includes(conditionStr)
    
    case 'in':
      const values = conditionValue.split(',').map(v => v.trim().toLowerCase())
      return values.some(v => fieldStr.includes(v))
    
    case 'not_in':
      const notValues = conditionValue.split(',').map(v => v.trim().toLowerCase())
      return !notValues.some(v => fieldStr.includes(v))
    
    default:
      return fieldStr === conditionStr
  }
}

/**
 * Determine what type of change is being made
 */
function determineChangeType(currentRule, proposedChanges) {
  const changes = []
  
  if (proposedChanges.condition_field !== undefined && proposedChanges.condition_field !== currentRule.condition_field) {
    changes.push('condition_field')
  }
  if (proposedChanges.condition_operator !== undefined && proposedChanges.condition_operator !== currentRule.condition_operator) {
    changes.push('condition_operator')
  }
  if (proposedChanges.condition_value !== undefined && proposedChanges.condition_value !== currentRule.condition_value) {
    changes.push('condition_value')
  }
  if (proposedChanges.action_type !== undefined && proposedChanges.action_type !== currentRule.action_type) {
    changes.push('action_type')
  }
  if (proposedChanges.action_value !== undefined && proposedChanges.action_value !== currentRule.action_value) {
    changes.push('action_value')
  }
  if (proposedChanges.is_active !== undefined && proposedChanges.is_active !== currentRule.is_active) {
    changes.push('is_active')
  }
  
  if (changes.includes('condition_field') || changes.includes('condition_operator') || changes.includes('condition_value')) {
    return 'condition_changed'
  }
  if (changes.includes('action_type') || changes.includes('action_value')) {
    return 'action_changed'
  }
  if (changes.includes('is_active')) {
    return 'activation_changed'
  }
  
  return changes.length > 0 ? 'other' : 'no_change'
}

/**
 * Calculate risk level for rule change
 */
function calculateRuleChangeRisk(impact, currentRule, proposedChanges) {
  let riskScore = 0
  
  // CRITICAL: Check if conflict rule has inappropriate action type (even without changes)
  const finalActionType = proposedChanges?.action_type !== undefined 
    ? proposedChanges.action_type 
    : currentRule.action_type
  
  if (impact.ruleType === 'conflict') {
    if (finalActionType === 'recommend_approve' || finalActionType === 'set_status') {
      riskScore += 6  // Critical - conflict rules should never approve
      impact.warnings.push('CRITICAL: Conflict rules must block or recommend rejection, not approval')
    } else if (finalActionType === 'recommend_review' || finalActionType === 'require_approval') {
      riskScore += 3  // High - conflict rules should be more strict
      impact.warnings.push('WARNING: Conflict rules should recommend rejection, not just review')
    } else if (finalActionType === 'block' || finalActionType === 'recommend_reject') {
      // This is correct for conflict rules - no penalty
    }
  }
  
  // CRITICAL: Action type changes - especially for conflict rules
  if (impact.actionTypeChange) {
    const { from, to } = impact.actionTypeChange
    
    // Define action severity levels
    const actionSeverity = {
      'block': 5,                    // Highest severity - blocks requests
      'recommend_reject': 4,        // High severity - recommends rejection
      'flag': 3,                     // Medium-high - flags for review
      'recommend_flag': 3,           // Medium-high - recommends flagging
      'require_approval': 2,         // Medium - requires approval
      'recommend_review': 2,         // Medium - recommends review
      'set_status': 1,               // Low - status change
      'send_notification': 1,        // Low - notification only
      'recommend_approve': 0         // Lowest - recommends approval
    }
    
    const fromSeverity = actionSeverity[from] || 2
    const toSeverity = actionSeverity[to] || 2
    const severityChange = fromSeverity - toSeverity
    
    // If changing from a blocking/rejecting action to a less severe action (especially approve)
    if (severityChange > 0) {
      // Conflict rules changing to less severe actions are CRITICAL
      if (impact.ruleType === 'conflict' && toSeverity <= 1) {
        riskScore += 5  // Critical risk for conflict rules being weakened
        impact.warnings.push(`CRITICAL: Conflict rule is being changed from "${from}" to "${to}" - this may allow prohibited conflicts`)
      } else if (impact.ruleType === 'conflict') {
        riskScore += 3  // High risk for any conflict rule action change
      } else if (severityChange >= 3) {
        riskScore += 4  // High risk for major severity reduction
      } else if (severityChange >= 2) {
        riskScore += 3  // Medium-high risk
      } else {
        riskScore += 2  // Medium risk
      }
    } else if (severityChange < 0) {
      // Changing to more severe action (less risky but still needs review)
      riskScore += 1
    }
  }
  
  // Rule type weight - conflict rules are more critical
  if (impact.ruleType === 'conflict') {
    riskScore += 1
  } else if (impact.ruleType === 'validation') {
    riskScore += 0.5
  }
  
  // Historical executions
  if (impact.historicalExecutions.totalExecutions > 50) {
    riskScore += 3
  } else if (impact.historicalExecutions.totalExecutions > 10) {
    riskScore += 2
  } else if (impact.historicalExecutions.totalExecutions > 0) {
    riskScore += 1
  }
  
  // Currently matching requests
  if (impact.affectedRequests.currentlyMatching > 20) {
    riskScore += 3
  } else if (impact.affectedRequests.currentlyMatching > 5) {
    riskScore += 2
  } else if (impact.affectedRequests.currentlyMatching > 0) {
    riskScore += 1
  }
  
  // Pending reviews affected
  if (impact.pendingReviewsAffected > 5) {
    riskScore += 3
  } else if (impact.pendingReviewsAffected > 0) {
    riskScore += 2
  }
  
  // Requests that would stop matching
  if (impact.affectedRequests.wouldStopMatching > 10) {
    riskScore += 2
  } else if (impact.affectedRequests.wouldStopMatching > 0) {
    riskScore += 1
  }
  
  // Determine risk level
  if (riskScore >= 7) {
    return 'critical'
  } else if (riskScore >= 4) {
    return 'high'
  } else if (riskScore >= 2) {
    return 'medium'
  } else {
    return 'low'
  }
}



