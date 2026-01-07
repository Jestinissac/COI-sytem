import { getDatabase } from '../database/init.js'

const db = getDatabase()

/**
 * Business Rules Engine
 * Evaluates rules from business_rules_config table against request data
 * Returns recommendations (not enforced actions) - Compliance makes final decisions
 */
export function evaluateRules(requestData) {
  try {
    // Load all active approved rules
    const rules = db.prepare(`
      SELECT * FROM business_rules_config
      WHERE is_active = 1
      AND approval_status = 'Approved'
      ORDER BY created_at DESC
    `).all()

    const recommendations = []
    const executionLogs = []

    for (const rule of rules) {
      const evaluation = evaluateRule(rule, requestData)
      
      if (evaluation.matched) {
        recommendations.push({
          ruleId: rule.id,
          ruleName: rule.rule_name,
          ruleType: rule.rule_type,
          recommendedAction: rule.action_type,
          reason: getReason(rule, requestData),
          confidence: 'MEDIUM', // Standard version - can be enhanced in Pro
          canOverride: true, // Standard version - all can be overridden
          guidance: `Rule: ${rule.rule_name}`
        })

        // Log execution
        executionLogs.push({
          rule_id: rule.id,
          condition_matched: true,
          action_taken: rule.action_type,
          execution_result: JSON.stringify(evaluation)
        })
      } else {
        // Log non-match for audit
        executionLogs.push({
          rule_id: rule.id,
          condition_matched: false,
          action_taken: null,
          execution_result: JSON.stringify(evaluation)
        })
      }
    }

    // Log all executions
    if (executionLogs.length > 0 && requestData.id) {
      logRuleExecutions(executionLogs, requestData.id)
    }

    return {
      recommendations,
      totalRulesEvaluated: rules.length,
      matchedRules: recommendations.length
    }
  } catch (error) {
    console.error('Error evaluating rules:', error)
    return {
      recommendations: [],
      totalRulesEvaluated: 0,
      matchedRules: 0,
      error: error.message
    }
  }
}

function evaluateRule(rule, requestData) {
  // If no condition field, rule always matches (catch-all rule)
  if (!rule.condition_field) {
    return { matched: true, reason: 'No condition specified' }
  }

  const fieldValue = getFieldValue(requestData, rule.condition_field)
  
  if (fieldValue === undefined || fieldValue === null) {
    return { matched: false, reason: 'Field not found in request data' }
  }

  const conditionValue = rule.condition_value
  const operator = rule.condition_operator || 'equals'

  const matched = evaluateCondition(fieldValue, operator, conditionValue)

  return {
    matched,
    reason: matched 
      ? `Condition matched: ${rule.condition_field} ${operator} ${conditionValue}`
      : `Condition not matched: ${rule.condition_field} ${operator} ${conditionValue}`
  }
}

function evaluateCondition(fieldValue, operator, conditionValue) {
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
    
    case 'greater_than':
    case '>':
      return parseFloat(fieldValue) > parseFloat(conditionValue)
    
    case 'less_than':
    case '<':
      return parseFloat(fieldValue) < parseFloat(conditionValue)
    
    case 'greater_than_or_equal':
    case '>=':
      return parseFloat(fieldValue) >= parseFloat(conditionValue)
    
    case 'less_than_or_equal':
    case '<=':
      return parseFloat(fieldValue) <= parseFloat(conditionValue)
    
    case 'in':
      // Comma-separated values
      const values = conditionValue.split(',').map(v => v.trim().toLowerCase())
      return values.includes(fieldStr)
    
    case 'not_in':
      const notValues = conditionValue.split(',').map(v => v.trim().toLowerCase())
      return !notValues.includes(fieldStr)
    
    case 'starts_with':
      return fieldStr.startsWith(conditionStr)
    
    case 'ends_with':
      return fieldStr.endsWith(conditionStr)
    
    default:
      // Default to equals
      return fieldStr === conditionStr
  }
}

function getFieldValue(requestData, fieldPath) {
  // Handle nested paths like "client.client_name"
  const parts = fieldPath.split('.')
  let value = requestData

  for (const part of parts) {
    if (value && typeof value === 'object') {
      value = value[part]
    } else {
      return undefined
    }
  }

  // Also check custom_fields JSON
  if (value === undefined && requestData.custom_fields) {
    try {
      const customFields = typeof requestData.custom_fields === 'string'
        ? JSON.parse(requestData.custom_fields)
        : requestData.custom_fields
      value = customFields[fieldPath]
    } catch {
      // Invalid JSON, ignore
    }
  }

  return value
}

function getReason(rule, requestData) {
  if (rule.action_value) {
    return rule.action_value
  }

  // Generate default reason
  const fieldValue = getFieldValue(requestData, rule.condition_field)
  return `Rule "${rule.rule_name}": ${rule.condition_field} ${rule.condition_operator} ${rule.condition_value} (actual: ${fieldValue})`
}

function logRuleExecutions(executionLogs, requestId) {
  try {
    const stmt = db.prepare(`
      INSERT INTO rule_execution_log (
        rule_id, coi_request_id, condition_matched, action_taken, execution_result
      ) VALUES (?, ?, ?, ?, ?)
    `)

    const transaction = db.transaction((logs) => {
      for (const log of logs) {
        stmt.run(
          log.rule_id,
          requestId,
          log.condition_matched ? 1 : 0,
          log.action_taken,
          log.execution_result
        )
      }
    })

    transaction(executionLogs)
  } catch (error) {
    // Log table might not exist yet, that's okay
    if (!error.message.includes('no such table')) {
      console.error('Error logging rule executions:', error)
    }
  }
}

export function getRuleExecutionHistory(requestId) {
  try {
    const logs = db.prepare(`
      SELECT 
        l.*,
        r.rule_name,
        r.rule_type
      FROM rule_execution_log l
      INNER JOIN business_rules_config r ON l.rule_id = r.id
      WHERE l.coi_request_id = ?
      ORDER BY l.executed_at DESC
    `).all(requestId)

    return logs
  } catch (error) {
    if (error.message.includes('no such table')) {
      return []
    }
    throw error
  }
}

