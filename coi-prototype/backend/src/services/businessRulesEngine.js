import { getDatabase } from '../database/init.js'
import { getSystemEdition, isProEdition } from './configService.js'
import { checkRedLines } from './redLinesService.js'
import { evaluateIESBADecisionMatrix } from './iesbaDecisionMatrix.js'
import FieldMappingService from './fieldMappingService.js'

const db = getDatabase()

/**
 * Business Rules Engine
 * Evaluates rules from business_rules_config table against request data
 * Standard: Returns actions (block/flag) - enforced
 * Pro: Returns recommendations - Compliance makes final decisions
 */
export function evaluateRules(requestData) {
  try {
    const isPro = isProEdition()
    
    // Prepare request data with computed fields
    const enhancedRequestData = FieldMappingService.prepareForRuleEvaluation(requestData)
    
    // Load all active approved rules
    const rules = db.prepare(`
      SELECT * FROM business_rules_config
      WHERE is_active = 1
      AND approval_status = 'Approved'
      ORDER BY created_at DESC
    `).all()

    const results = []
    const executionLogs = []

    for (const rule of rules) {
      const evaluation = evaluateRule(rule, enhancedRequestData)
      
      if (evaluation.matched) {
        if (isPro) {
          // Pro edition: Return recommendations
          results.push({
            ruleId: rule.id,
            ruleName: rule.rule_name,
            ruleType: rule.rule_type,
            recommendedAction: mapActionToRecommendation(rule.action_type),
            reason: getReason(rule, requestData),
            confidence: getConfidenceLevel(rule),
            canOverride: canOverrideAction(rule),
            overrideGuidance: getOverrideGuidance(rule),
            requiresComplianceReview: true,
            guidance: `Rule: ${rule.rule_name}`,
            regulation: getRegulationReference(rule)
          })
        } else {
          // Standard edition: Return actions
          results.push({
            ruleId: rule.id,
            ruleName: rule.rule_name,
            ruleType: rule.rule_type,
            action: rule.action_type,
            reason: getReason(rule, requestData)
          })
        }

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
    if (executionLogs.length > 0 && enhancedRequestData.id) {
      logRuleExecutions(executionLogs, enhancedRequestData.id)
    }

    if (isPro) {
      // Pro edition: Combine business rules with red lines and IESBA matrix
      const redLineRecommendations = checkRedLines(enhancedRequestData)
      const iesbaRecommendations = evaluateIESBADecisionMatrix(enhancedRequestData)
      
      // Combine all recommendations
      const allRecommendations = [
        ...redLineRecommendations,
        ...iesbaRecommendations,
        ...results
      ]
      
      // De-duplicate recommendations by rule name/type to prevent spam
      // Keep the first occurrence of each unique rule (highest priority sources first: redLines > IESBA > business rules)
      const uniqueRecommendations = []
      const seenRuleKeys = new Set()
      
      for (const rec of allRecommendations) {
        // Create unique key from rule name or type
        const key = rec.ruleName || rec.type || `${rec.ruleType}-${rec.reason}`
        
        if (!seenRuleKeys.has(key)) {
          seenRuleKeys.add(key)
          uniqueRecommendations.push(rec)
        }
      }
      
      return {
        recommendations: uniqueRecommendations,
        totalRulesEvaluated: rules.length,
        matchedRules: results.length,
        uniqueRecommendations: uniqueRecommendations.length,
        duplicatesRemoved: allRecommendations.length - uniqueRecommendations.length,
        redLinesDetected: redLineRecommendations.length,
        iesbaRecommendations: iesbaRecommendations.length,
        businessRuleRecommendations: results.length
      }
    } else {
      // Standard edition: Also de-duplicate actions
      const uniqueActions = []
      const seenActionKeys = new Set()
      
      for (const action of results) {
        const key = action.ruleName || `${action.ruleType}-${action.reason}`
        if (!seenActionKeys.has(key)) {
          seenActionKeys.add(key)
          uniqueActions.push(action)
        }
      }
      
      return {
        actions: uniqueActions,
        totalRulesEvaluated: rules.length,
        matchedRules: results.length,
        duplicatesRemoved: results.length - uniqueActions.length
      }
    }
  } catch (error) {
    console.error('Error evaluating rules:', error)
    const isPro = isProEdition()
    return {
      [isPro ? 'recommendations' : 'actions']: [],
      totalRulesEvaluated: 0,
      matchedRules: 0,
      error: error.message
    }
  }
}

function mapActionToRecommendation(actionType) {
  const mapping = {
    'block': 'REJECT',
    'flag': 'FLAG',
    'require_approval': 'REVIEW',
    'recommend_reject': 'REJECT',
    'recommend_flag': 'FLAG',
    'recommend_review': 'REVIEW',
    'recommend_approve': 'APPROVE',
    'set_status': 'REVIEW',
    'send_notification': 'REVIEW'
  }
  return mapping[actionType] || 'REVIEW'
}

function getConfidenceLevel(rule) {
  // Use stored confidence_level from database if available
  if (rule.confidence_level) {
    return rule.confidence_level
  }
  
  // Fallback: calculate from rule type if not set
  if (rule.rule_type === 'conflict') {
    return 'HIGH'
  } else if (rule.rule_type === 'validation') {
    return 'MEDIUM'
  }
  return 'MEDIUM'
}

function canOverrideAction(rule) {
  // Use stored can_override from database if available
  if (rule.can_override !== undefined && rule.can_override !== null) {
    return rule.can_override === 1 || rule.can_override === true
  }
  
  // Fallback: calculate from action type if not set
  const actionType = rule.action_type || rule
  if (actionType === 'block') {
    return false
  }
  return true
}

function getOverrideGuidance(rule) {
  // Use stored override_guidance from database if available
  if (rule.override_guidance) {
    return rule.override_guidance
  }
  
  // Fallback: generate from action type if not set
  if (rule.action_type === 'block') {
    return 'Override requires Partner approval and documented justification'
  }
  return 'Override requires Compliance review and justification'
}

function getRegulationReference(rule) {
  // Use stored regulation_reference from database if available
  if (rule.regulation_reference) {
    return rule.regulation_reference
  }
  
  // Fallback: pattern matching from rule name
  const ruleNameLower = (rule.rule_name || '').toLowerCase()
  if (ruleNameLower.includes('management responsibility') || ruleNameLower.includes('management')) {
    return 'IESBA Code Section 290.104'
  }
  if (ruleNameLower.includes('advocacy')) {
    return 'IESBA Code Section 290.105'
  }
  if (ruleNameLower.includes('contingent fee') || ruleNameLower.includes('contingent')) {
    return 'IESBA Code Section 290.106'
  }
  if (ruleNameLower.includes('pie') && ruleNameLower.includes('tax')) {
    return 'IESBA Code Section 290.212'
  }
  
  // Default based on rule type
  const regulationMap = {
    'red_line': 'IESBA Code Section 290',
    'conflict': 'IESBA Code Section 290',
    'pie_tax': 'IESBA Code Section 290.212',
    'pie_planning': 'IESBA Code Section 290.212',
    'validation': 'IESBA Code Section 290',
    'management_responsibility': 'IESBA Code Section 290.104',
    'advocacy': 'IESBA Code Section 290.105',
    'contingent_fees': 'IESBA Code Section 290.106'
  }
  return regulationMap[rule.rule_type] || 'IESBA Code Section 290'
}

function evaluateRule(rule, requestData) {
  // Check if rule has advanced condition groups
  if (rule.condition_groups) {
    return evaluateConditionGroups(rule, requestData)
  }
  
  // If no condition field and no condition groups, rule always matches (catch-all rule)
  if (!rule.condition_field) {
    return { matched: true, reason: 'No condition specified' }
  }

  const fieldValue = FieldMappingService.getValue(requestData, rule.condition_field)
  
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

/**
 * Evaluate condition groups with AND/OR logic
 */
function evaluateConditionGroups(rule, requestData) {
  let groups
  try {
    groups = typeof rule.condition_groups === 'string' 
      ? JSON.parse(rule.condition_groups) 
      : rule.condition_groups
  } catch (e) {
    return { matched: false, reason: 'Invalid condition_groups format' }
  }
  
  if (!groups || groups.length === 0) {
    return { matched: true, reason: 'No condition groups specified' }
  }
  
  const matchedConditions = []
  const unmatchedConditions = []
  let overallResult = false
  
  for (let gIdx = 0; gIdx < groups.length; gIdx++) {
    const group = groups[gIdx]
    let groupResult = null
    const groupConditions = []
    
    for (let cIdx = 0; cIdx < (group.conditions || []).length; cIdx++) {
      const cond = group.conditions[cIdx]
      
      // Skip empty conditions
      if (!cond.field || !cond.conditionOperator) {
        continue
      }
      
      const fieldValue = FieldMappingService.getValue(requestData, cond.field)
      const condResult = evaluateCondition(fieldValue, cond.conditionOperator, cond.value)
      
      const conditionDesc = `${cond.field} ${cond.conditionOperator} "${cond.value}"`
      
      if (condResult) {
        groupConditions.push({ condition: conditionDesc, matched: true })
      } else {
        groupConditions.push({ condition: conditionDesc, matched: false })
      }
      
      // Apply condition operator (AND/OR within group)
      if (groupResult === null) {
        groupResult = condResult
      } else {
        const condOp = cond.operator || 'AND'
        groupResult = condOp === 'AND' ? (groupResult && condResult) : (groupResult || condResult)
      }
    }
    
    // If group has no valid conditions, skip it
    if (groupResult === null) {
      continue
    }
    
    // Record group result
    if (groupResult) {
      matchedConditions.push(...groupConditions.filter(c => c.matched))
    } else {
      unmatchedConditions.push(...groupConditions.filter(c => !c.matched))
    }
    
    // Apply group operator (AND/OR between groups)
    if (gIdx === 0) {
      overallResult = groupResult
    } else {
      const groupOp = group.operator || 'OR'
      overallResult = groupOp === 'AND' ? (overallResult && groupResult) : (overallResult || groupResult)
    }
  }
  
  return {
    matched: overallResult,
    reason: overallResult 
      ? `Matched conditions: ${matchedConditions.map(c => c.condition).join(', ')}`
      : `Unmatched conditions: ${unmatchedConditions.map(c => c.condition).join(', ')}`,
    details: {
      matchedConditions,
      unmatchedConditions
    }
  }
}

function evaluateCondition(fieldValue, operator, conditionValue) {
  // Handle null/undefined values
  if (fieldValue === undefined || fieldValue === null) {
    fieldValue = ''
  }
  
  const fieldStr = String(fieldValue).toLowerCase()
  const conditionStr = String(conditionValue || '').toLowerCase()

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
      const values = conditionStr.split(',').map(v => v.trim().toLowerCase())
      return values.includes(fieldStr)
    
    case 'not_in':
      const notValues = conditionStr.split(',').map(v => v.trim().toLowerCase())
      return !notValues.includes(fieldStr)
    
    case 'starts_with':
      return fieldStr.startsWith(conditionStr)
    
    case 'ends_with':
      return fieldStr.endsWith(conditionStr)
    
    case 'is_empty':
      return !fieldValue || fieldValue === ''
    
    case 'is_not_empty':
      return fieldValue && fieldValue !== ''
    
    case 'is_true':
      return fieldValue === true || fieldValue === 1 || fieldStr === 'true' || fieldStr === 'yes'
    
    case 'is_false':
      return fieldValue === false || fieldValue === 0 || fieldStr === 'false' || fieldStr === 'no'
    
    default:
      // Default to equals
      return fieldStr === conditionStr
  }
}

function getReason(rule, requestData) {
  if (rule.action_value) {
    return rule.action_value
  }

  // Generate default reason
  const fieldValue = FieldMappingService.getValue(requestData, rule.condition_field)
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

