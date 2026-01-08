import { getDatabase } from '../database/init.js'
import { analyzeFieldChange, updateImpactCache, analyzeRuleChange } from '../services/impactAnalysisService.js'
import { validateWithFallback } from '../services/rulesEngineService.js'
import { 
  getSystemEdition, 
  setSystemEdition, 
  getEditionFeatures, 
  getAllFeatures,
  isFeatureEnabled 
} from '../services/configService.js'

const db = getDatabase()

/**
 * Flag affected pending requests as stale when a rule is modified
 * @param {number} ruleId - The ID of the modified rule
 * @param {string} ruleName - The name of the modified rule
 * @returns {number} - Count of requests flagged
 */
function flagAffectedRequests(ruleId, ruleName) {
  try {
    // Find all pending requests that might be affected by this rule change
    // Check rule_execution_log if it exists, otherwise flag all pending requests
    let affectedRequestIds = []
    
    try {
      // Check if rule_execution_log table exists and has entries for this rule
      const executionLogs = db.prepare(`
        SELECT DISTINCT request_id FROM rule_execution_log 
        WHERE rule_id = ?
      `).all(ruleId)
      
      if (executionLogs.length > 0) {
        affectedRequestIds = executionLogs.map(log => log.request_id)
      }
    } catch (e) {
      // rule_execution_log might not exist, continue
    }
    
    // Build the update query
    const staleReason = `Rule #${ruleId} (${ruleName}) modified on ${new Date().toISOString().split('T')[0]}`
    
    let updateCount = 0
    
    if (affectedRequestIds.length > 0) {
      // Flag only requests that were evaluated by this rule
      const placeholders = affectedRequestIds.map(() => '?').join(',')
      const result = db.prepare(`
        UPDATE coi_requests 
        SET requires_re_evaluation = 1, 
            stale_reason = ?
        WHERE id IN (${placeholders})
        AND status IN ('Pending Compliance', 'Pending Director Approval', 'Pending Partner')
      `).run(staleReason, ...affectedRequestIds)
      updateCount = result.changes
    } else {
      // No execution log, flag all pending requests as a safety measure
      const result = db.prepare(`
        UPDATE coi_requests 
        SET requires_re_evaluation = 1, 
            stale_reason = ?
        WHERE status IN ('Pending Compliance', 'Pending Director Approval', 'Pending Partner')
        AND requires_re_evaluation = 0
      `).run(staleReason)
      updateCount = result.changes
    }
    
    if (updateCount > 0) {
      console.log(`Flagged ${updateCount} pending request(s) as stale due to rule change`)
    }
    
    return updateCount
  } catch (error) {
    console.error('Error flagging affected requests:', error)
    return 0
  }
}

// Form Fields Configuration
export async function getFormFields(req, res) {
  try {
    const fields = db.prepare(`
      SELECT * FROM form_fields_config 
      ORDER BY section_id, display_order
    `).all()
    
    res.json({ fields })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function saveFormFields(req, res) {
  try {
    const { fields } = req.body
    const userId = req.userId
    
    if (!Array.isArray(fields)) {
      return res.status(400).json({ error: 'Fields must be an array' })
    }
    
    // Get existing fields for change tracking
    const existingFields = db.prepare('SELECT * FROM form_fields_config').all()
    const existingFieldMap = new Map(existingFields.map(f => [f.field_id, f]))
    
    // Analyze changes before applying
    const changes = []
    for (const newField of fields) {
      const existing = existingFieldMap.get(newField.field_id)
      if (existing) {
        // Field modified
        const changeType = JSON.stringify(existing) !== JSON.stringify(newField) ? 'field_modified' : null
        if (changeType) {
          const impact = analyzeFieldChange(newField.field_id, 'field_modified')
          changes.push({
            changeType,
            fieldId: newField.field_id,
            oldConfig: existing,
            newConfig: newField,
            impact
          })
        }
      } else {
        // Field added
        const impact = analyzeFieldChange(newField.field_id, 'field_added')
        changes.push({
          changeType: 'field_added',
          fieldId: newField.field_id,
          oldConfig: null,
          newConfig: newField,
          impact
        })
      }
    }
    
    // Check for removed fields
    const newFieldIds = new Set(fields.map(f => f.field_id))
    for (const existing of existingFields) {
      if (!newFieldIds.has(existing.field_id)) {
        const impact = analyzeFieldChange(existing.field_id, 'field_removed')
        changes.push({
          changeType: 'field_removed',
          fieldId: existing.field_id,
          oldConfig: existing,
          newConfig: null,
          impact
        })
      }
    }
    
    // Record changes (if any significant changes)
    for (const change of changes) {
      if (change.impact && (change.impact.requiresApproval || change.impact.riskLevel === 'high' || change.impact.riskLevel === 'critical')) {
        db.prepare(`
          INSERT INTO form_config_changes (
            change_type, field_id, old_config, new_config,
            changed_by, requires_approval, approval_status
          ) VALUES (?, ?, ?, ?, ?, 1, 'Pending')
        `).run(
          change.changeType,
          change.fieldId,
          change.oldConfig ? JSON.stringify(change.oldConfig) : null,
          change.newConfig ? JSON.stringify(change.newConfig) : null,
          userId
        )
      }
    }
    
    // Clear existing fields
    db.prepare('DELETE FROM form_fields_config').run()
    
    // Insert new fields
    const stmt = db.prepare(`
      INSERT INTO form_fields_config (
        section_id, field_id, field_type, field_label, field_placeholder,
        is_required, is_readonly, default_value, options, validation_rules,
        conditions, display_order, source_system, source_field
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const transaction = db.transaction((fields) => {
      for (const field of fields) {
        stmt.run(
          field.section_id,
          field.field_id,
          field.field_type,
          field.field_label,
          field.field_placeholder || null,
          field.is_required ? 1 : 0,
          field.is_readonly ? 1 : 0,
          field.default_value || null,
          field.options || null,
          field.validation_rules || null,
          field.conditions || null,
          field.display_order || 0,
          field.source_system || 'manual',
          field.source_field || null
        )
        
        // Update impact cache
        updateImpactCache(field.field_id)
      }
    })
    
    transaction(fields)
    
    res.json({ 
      success: true, 
      message: 'Form fields saved', 
      count: fields.length,
      changesRecorded: changes.length,
      requiresApproval: changes.some(c => c.impact?.requiresApproval)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function getFormField(req, res) {
  try {
    const { id } = req.params
    const field = db.prepare('SELECT * FROM form_fields_config WHERE id = ?').get(id)
    
    if (!field) {
      return res.status(404).json({ error: 'Field not found' })
    }
    
    res.json({ field })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function updateFormField(req, res) {
  try {
    const { id } = req.params
    const updates = req.body
    
    const field = db.prepare('SELECT * FROM form_fields_config WHERE id = ?').get(id)
    if (!field) {
      return res.status(404).json({ error: 'Field not found' })
    }
    
    db.prepare(`
      UPDATE form_fields_config SET
        section_id = COALESCE(?, section_id),
        field_id = COALESCE(?, field_id),
        field_type = COALESCE(?, field_type),
        field_label = COALESCE(?, field_label),
        field_placeholder = COALESCE(?, field_placeholder),
        is_required = COALESCE(?, is_required),
        is_readonly = COALESCE(?, is_readonly),
        default_value = COALESCE(?, default_value),
        options = COALESCE(?, options),
        validation_rules = COALESCE(?, validation_rules),
        conditions = COALESCE(?, conditions),
        display_order = COALESCE(?, display_order),
        source_system = COALESCE(?, source_system),
        source_field = COALESCE(?, source_field),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      updates.section_id,
      updates.field_id,
      updates.field_type,
      updates.field_label,
      updates.field_placeholder,
      updates.is_required !== undefined ? (updates.is_required ? 1 : 0) : null,
      updates.is_readonly !== undefined ? (updates.is_readonly ? 1 : 0) : null,
      updates.default_value,
      updates.options,
      updates.validation_rules,
      updates.conditions,
      updates.display_order,
      updates.source_system,
      updates.source_field,
      id
    )
    
    res.json({ success: true, message: 'Field updated' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function deleteFormField(req, res) {
  try {
    const { id } = req.params
    const userId = req.userId
    
    const field = db.prepare('SELECT * FROM form_fields_config WHERE id = ?').get(id)
    if (!field) {
      return res.status(404).json({ error: 'Field not found' })
    }
    
    // Analyze impact before deletion
    const impact = analyzeFieldChange(field.field_id, 'field_removed')
    const { validateFieldRemoval } = await import('../services/dataConsistencyService.js')
    const validation = validateFieldRemoval(field.field_id)
    
    if (!validation.safe) {
      return res.status(400).json({
        error: 'Cannot delete field',
        validation,
        impact
      })
    }
    
    // Record change
    db.prepare(`
      INSERT INTO form_config_changes (
        change_type, field_id, old_config, new_config,
        changed_by, requires_approval, approval_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'field_removed',
      field.field_id,
      JSON.stringify(field),
      null,
      userId,
      impact.requiresApproval ? 1 : 0,
      impact.requiresApproval ? 'Pending' : 'Approved'
    )
    
    // If requires approval, don't delete yet
    if (impact.requiresApproval) {
      return res.json({
        success: true,
        message: 'Deletion recorded - approval required',
        requiresApproval: true,
        impact,
        validation
      })
    }
    
    // Delete field
    const result = db.prepare('DELETE FROM form_fields_config WHERE id = ?').run(id)
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Field not found' })
    }
    
    res.json({ success: true, message: 'Field deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Workflow Configuration
export async function getWorkflowConfig(req, res) {
  try {
    const { workflowName = 'default' } = req.query
    const steps = db.prepare(`
      SELECT * FROM workflow_config 
      WHERE workflow_name = ?
      ORDER BY step_order
    `).all(workflowName)
    
    res.json({ workflow: steps })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function saveWorkflowConfig(req, res) {
  try {
    const { workflowName = 'default', steps } = req.body
    
    if (!Array.isArray(steps)) {
      return res.status(400).json({ error: 'Steps must be an array' })
    }
    
    // Clear existing workflow
    db.prepare('DELETE FROM workflow_config WHERE workflow_name = ?').run(workflowName)
    
    // Insert new steps
    const stmt = db.prepare(`
      INSERT INTO workflow_config (
        workflow_name, step_order, step_name, step_status, 
        required_role, is_required, conditions
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    const transaction = db.transaction((steps) => {
      for (const step of steps) {
        stmt.run(
          workflowName,
          step.step_order,
          step.step_name,
          step.step_status,
          step.required_role || null,
          step.is_required !== undefined ? (step.is_required ? 1 : 0) : 1,
          step.conditions ? JSON.stringify(step.conditions) : null
        )
      }
    })
    
    transaction(steps)
    
    res.json({ success: true, message: 'Workflow saved', count: steps.length })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Business Rules Configuration
export async function getBusinessRules(req, res) {
  try {
    const { ruleType, includePending } = req.query
    const userId = req.userId
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId)
    const userRole = user?.role || ''
    const isSuperAdmin = userRole === 'Super Admin'
    
    console.log('[getBusinessRules] User ID:', userId, 'Role:', userRole, 'Is Super Admin:', isSuperAdmin)
    console.log('[getBusinessRules] Query params:', { ruleType, includePending })
    
    // Check if table exists, if not return empty array
    try {
      db.prepare('SELECT 1 FROM business_rules_config LIMIT 1').get()
    } catch (tableError) {
      if (tableError.message.includes('no such table')) {
        console.warn('[getBusinessRules] business_rules_config table does not exist')
        return res.json({ rules: [] })
      }
      throw tableError
    }
    
    let rules
    let query = `
      SELECT 
        r.*,
        u1.name as created_by_name,
        u2.name as approved_by_name
      FROM business_rules_config r
      LEFT JOIN users u1 ON r.created_by = u1.id
      LEFT JOIN users u2 ON r.approved_by = u2.id
      WHERE 1=1
    `
    const params = []
    
    // Only show active rules unless Super Admin or includePending=true
    if (!isSuperAdmin && includePending !== 'true') {
      query += ' AND r.approval_status = ? AND r.is_active = 1'
      params.push('Approved')
    }
    
    if (ruleType) {
      query += ' AND r.rule_type = ?'
      params.push(ruleType)
    }
    
    query += ' ORDER BY r.created_at DESC'
    
    console.log('[getBusinessRules] Executing query:', query)
    console.log('[getBusinessRules] With params:', params)
    
    rules = db.prepare(query).all(...params)
    
    console.log('[getBusinessRules] Found', rules.length, 'rules')
    
    res.json({ rules })
  } catch (error) {
    console.error('[getBusinessRules] Error:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Validate a rule for logical errors and best practices
 * Returns validation errors and warnings
 */
export function validateRule(rule) {
  const errors = []
  const warnings = []
  
  // Required fields check
  if (!rule.rule_name || !rule.rule_name.trim()) {
    errors.push({ field: 'rule_name', message: 'Rule name is required' })
  }
  
  if (!rule.rule_type) {
    errors.push({ field: 'rule_type', message: 'Rule type is required' })
  }
  
  if (!rule.action_type) {
    errors.push({ field: 'action_type', message: 'Action type is required' })
  }
  
  // Conflict rule validation
  if (rule.rule_type === 'conflict') {
    // Conflict rules should not have approve actions
    if (['approve', 'recommend_approve', 'set_status'].includes(rule.action_type)) {
      errors.push({
        field: 'action_type',
        message: `Conflict rules should not use "${rule.action_type}" action. Use block, flag, or reject instead.`,
        severity: 'critical'
      })
    }
    
    // Conflict rules should have conditions
    if (!rule.condition_field && !rule.condition_groups) {
      warnings.push({
        field: 'condition',
        message: 'Conflict rules typically require conditions to define what constitutes a conflict.'
      })
    }
  }
  
  // Red line rule validation
  if (rule.rule_type === 'red_line' || (rule.rule_name && rule.rule_name.toLowerCase().includes('red line'))) {
    // Red line rules MUST block
    if (rule.action_type !== 'block' && !['recommend_reject', 'reject'].includes(rule.action_type)) {
      errors.push({
        field: 'action_type',
        message: 'Red line rules must use "block" or "reject" action. These are non-negotiable compliance requirements.',
        severity: 'critical'
      })
    }
  }
  
  // Validation rule checks
  if (rule.rule_type === 'validation') {
    if (!rule.condition_field && !rule.condition_groups) {
      warnings.push({
        field: 'condition',
        message: 'Validation rules should have conditions to specify what to validate.'
      })
    }
  }
  
  // Check for condition group validity
  if (rule.condition_groups) {
    let conditionGroups
    try {
      conditionGroups = typeof rule.condition_groups === 'string' 
        ? JSON.parse(rule.condition_groups) 
        : rule.condition_groups
      
      // Check each group
      let hasValidCondition = false
      for (const group of conditionGroups) {
        for (const cond of group.conditions || []) {
          if (cond.field && cond.conditionOperator && cond.value) {
            hasValidCondition = true
          } else if (cond.field || cond.conditionOperator || cond.value) {
            warnings.push({
              field: 'condition_groups',
              message: 'Some conditions are incomplete. Ensure all conditions have field, operator, and value.'
            })
          }
        }
      }
      
      if (!hasValidCondition && conditionGroups.length > 0) {
        warnings.push({
          field: 'condition_groups',
          message: 'No valid conditions defined. Rule will apply to all requests.'
        })
      }
    } catch (e) {
      errors.push({
        field: 'condition_groups',
        message: 'Invalid condition groups format'
      })
    }
  }
  
  // Check for duplicate rules
  try {
    const existingRule = db.prepare(`
      SELECT id, rule_name FROM business_rules_config 
      WHERE rule_name = ? AND (? IS NULL OR id != ?)
    `).get(rule.rule_name, rule.id || null, rule.id || null)
    
    if (existingRule) {
      warnings.push({
        field: 'rule_name',
        message: `A rule with the name "${rule.rule_name}" already exists.`
      })
    }
  } catch (e) {
    // Ignore duplicate check errors
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasCriticalErrors: errors.some(e => e.severity === 'critical')
  }
}

/**
 * API endpoint to validate a rule
 */
export async function validateRuleEndpoint(req, res) {
  try {
    const rule = req.body
    const validation = validateRule(rule)
    res.json(validation)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function saveBusinessRule(req, res) {
  try {
    const userId = req.userId
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId)
    const userRole = user?.role || ''
    
    const rule = req.body
    
    // Validate rule first
    const validation = validateRule(rule)
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Rule validation failed',
        validation
      })
    }
    
    // Warn about critical issues but allow if user confirms
    if (validation.hasCriticalErrors && !rule.forceCreate) {
      return res.status(400).json({
        error: 'Rule has critical validation errors',
        validation,
        requiresConfirmation: true
      })
    }
    
    // Super Admin can create approved rules directly
    // Compliance/Admin rules require approval
    const requiresApproval = userRole !== 'Super Admin'
    const approvalStatus = requiresApproval ? 'Pending' : 'Approved'
    
    const result = db.prepare(`
      INSERT INTO business_rules_config (
        rule_name, rule_type, condition_field, condition_operator,
        condition_value, condition_groups, action_type, action_value, is_active,
        approval_status, created_by, rule_category, regulation_reference, applies_to_pie, tax_sub_type, complex_conditions,
        confidence_level, can_override, override_guidance, guidance_text, required_override_role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      rule.rule_name,
      rule.rule_type,
      rule.condition_field || null,
      rule.condition_operator || null,
      rule.condition_value || null,
      rule.condition_groups || null,
      rule.action_type,
      rule.action_value || null,
      requiresApproval ? 0 : (rule.is_active !== undefined ? (rule.is_active ? 1 : 0) : 1), // Only active if approved
      approvalStatus,
      userId,
      rule.rule_category || 'Custom',
      rule.regulation_reference || null,
      rule.applies_to_pie ? 1 : 0,
      rule.tax_sub_type || null,
      rule.complex_conditions || null,
      rule.confidence_level || 'MEDIUM',
      rule.can_override !== undefined ? (rule.can_override ? 1 : 0) : 1,
      rule.override_guidance || null,
      rule.guidance_text || null,
      rule.required_override_role || null
    )
    
    const message = requiresApproval 
      ? 'Rule created and pending Super Admin approval' 
      : 'Rule created and approved'
    
    res.json({ 
      success: true, 
      message,
      ruleId: result.lastInsertRowid,
      requiresApproval,
      approvalStatus,
      validation // Include any warnings
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function updateBusinessRule(req, res) {
  try {
    const { id } = req.params
    const userId = req.userId
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId)
    const userRole = user?.role || ''
    
    const updates = req.body
    const rule = db.prepare('SELECT * FROM business_rules_config WHERE id = ?').get(id)
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' })
    }
    
    // Validate rule updates
    const mergedRule = { ...rule, ...updates, id }
    const validation = validateRule(mergedRule)
    
    // Block if critical validation errors and not forced
    if (validation.hasCriticalErrors && !updates.forceUpdate) {
      return res.status(400).json({
        error: 'Rule has critical validation errors',
        validation,
        requiresConfirmation: true
      })
    }
    
    // Perform impact analysis before updating
    const impactAnalysis = analyzeRuleChange(id, updates)
    
    // If impact analysis requires approval and user hasn't explicitly confirmed, return impact
    if (impactAnalysis.requiresApproval && !req.body.forceUpdate && !req.body.acknowledgeImpact) {
      return res.status(200).json({
        requiresApproval: true,
        impactAnalysis: impactAnalysis.impact,
        validation,
        message: 'Rule change requires approval due to high impact. Review the impact analysis and confirm with forceUpdate: true',
        warnings: impactAnalysis.impact?.warnings || []
      })
    }
    
    // If Super Admin is updating, can update directly
    // If Compliance/Admin is updating an approved rule, it needs re-approval
    const isSuperAdmin = userRole === 'Super Admin'
    const wasApproved = rule.approval_status === 'Approved'
    const needsReapproval = !isSuperAdmin && wasApproved && (
      updates.rule_name || updates.rule_type || updates.condition_field || 
      updates.condition_operator || updates.condition_value || updates.condition_groups ||
      updates.action_type || updates.action_value
    )
    
    const approvalStatus = needsReapproval ? 'Pending' : (updates.approval_status || rule.approval_status)
    const isActive = isSuperAdmin 
      ? (updates.is_active !== undefined ? (updates.is_active ? 1 : 0) : rule.is_active)
      : (approvalStatus === 'Approved' ? (updates.is_active !== undefined ? (updates.is_active ? 1 : 0) : rule.is_active) : 0)
    
    db.prepare(`
      UPDATE business_rules_config SET
        rule_name = COALESCE(?, rule_name),
        rule_type = COALESCE(?, rule_type),
        condition_field = COALESCE(?, condition_field),
        condition_operator = COALESCE(?, condition_operator),
        condition_value = COALESCE(?, condition_value),
        condition_groups = COALESCE(?, condition_groups),
        action_type = COALESCE(?, action_type),
        action_value = COALESCE(?, action_value),
        is_active = ?,
        approval_status = ?,
        rule_category = COALESCE(?, rule_category),
        regulation_reference = COALESCE(?, regulation_reference),
        applies_to_pie = COALESCE(?, applies_to_pie),
        tax_sub_type = COALESCE(?, tax_sub_type),
        complex_conditions = COALESCE(?, complex_conditions),
        confidence_level = COALESCE(?, confidence_level),
        can_override = COALESCE(?, can_override),
        override_guidance = COALESCE(?, override_guidance),
        guidance_text = COALESCE(?, guidance_text),
        required_override_role = COALESCE(?, required_override_role),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      updates.rule_name,
      updates.rule_type,
      updates.condition_field !== undefined ? (updates.condition_field || null) : undefined,
      updates.condition_operator !== undefined ? (updates.condition_operator || null) : undefined,
      updates.condition_value !== undefined ? (updates.condition_value || null) : undefined,
      updates.condition_groups !== undefined ? updates.condition_groups : undefined,
      updates.action_type,
      updates.action_value !== undefined ? (updates.action_value || null) : undefined,
      isActive,
      approvalStatus,
      updates.rule_category !== undefined ? (updates.rule_category || 'Custom') : undefined,
      updates.regulation_reference !== undefined ? (updates.regulation_reference || null) : undefined,
      updates.applies_to_pie !== undefined ? (updates.applies_to_pie ? 1 : 0) : undefined,
      updates.tax_sub_type !== undefined ? (updates.tax_sub_type || null) : undefined,
      updates.complex_conditions !== undefined ? updates.complex_conditions : undefined,
      updates.confidence_level !== undefined ? (updates.confidence_level || 'MEDIUM') : undefined,
      updates.can_override !== undefined ? (updates.can_override ? 1 : 0) : undefined,
      updates.override_guidance !== undefined ? (updates.override_guidance || null) : undefined,
      updates.guidance_text !== undefined ? (updates.guidance_text || null) : undefined,
      updates.required_override_role !== undefined ? (updates.required_override_role || null) : undefined,
      id
    )
    
    // Flag affected pending requests as stale
    const affectedRequestsCount = flagAffectedRequests(id, rule.rule_name)
    
    const message = needsReapproval 
      ? 'Rule updated and requires re-approval' 
      : 'Rule updated'
    
    res.json({ 
      success: true, 
      message, 
      requiresApproval: needsReapproval,
      impactAnalysis: impactAnalysis.impact,
      validation,
      affectedRequestsFlagged: affectedRequestsCount
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function getRuleChangeImpact(req, res) {
  try {
    const { id } = req.params
    const proposedChanges = req.body
    
    // Convert id to number
    const ruleId = parseInt(id, 10)
    if (isNaN(ruleId)) {
      return res.status(400).json({ error: 'Invalid rule ID' })
    }
    
    const impactAnalysis = analyzeRuleChange(ruleId, proposedChanges)
    
    if (!impactAnalysis.allowed) {
      return res.status(400).json({
        error: impactAnalysis.error || 'Impact analysis failed',
        requiresManualApproval: impactAnalysis.requiresManualApproval
      })
    }
    
    res.json({
      success: true,
      impactAnalysis: impactAnalysis.impact,
      requiresApproval: impactAnalysis.requiresApproval
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function approveBusinessRule(req, res) {
  try {
    const { id } = req.params
    const userId = req.userId
    const { comments } = req.body
    
    const rule = db.prepare('SELECT * FROM business_rules_config WHERE id = ?').get(id)
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' })
    }
    
    if (rule.approval_status === 'Approved') {
      return res.status(400).json({ error: 'Rule is already approved' })
    }
    
    db.prepare(`
      UPDATE business_rules_config SET
        approval_status = 'Approved',
        approved_by = ?,
        approved_at = CURRENT_TIMESTAMP,
        is_active = 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(userId, id)
    
    res.json({ success: true, message: 'Rule approved and activated' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function rejectBusinessRule(req, res) {
  try {
    const { id } = req.params
    const userId = req.userId
    const { reason } = req.body
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Rejection reason is required' })
    }
    
    const rule = db.prepare('SELECT * FROM business_rules_config WHERE id = ?').get(id)
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' })
    }
    
    db.prepare(`
      UPDATE business_rules_config SET
        approval_status = 'Rejected',
        approved_by = ?,
        approved_at = CURRENT_TIMESTAMP,
        rejection_reason = ?,
        is_active = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(userId, reason, id)
    
    res.json({ success: true, message: 'Rule rejected' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function deleteBusinessRule(req, res) {
  try {
    const { id } = req.params
    
    const result = db.prepare('DELETE FROM business_rules_config WHERE id = ?').run(id)
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Rule not found' })
    }
    
    res.json({ success: true, message: 'Rule deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Form Templates
export async function getFormTemplates(req, res) {
  try {
    const templates = db.prepare(`
      SELECT 
        t.*,
        u.name as created_by_name,
        COUNT(tf.id) as field_count
      FROM form_templates t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN form_template_fields tf ON t.id = tf.template_id
      GROUP BY t.id
      ORDER BY t.is_default DESC, t.created_at DESC
    `).all()
    
    res.json({ templates })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function getFormTemplate(req, res) {
  try {
    const { id } = req.params
    
    const template = db.prepare('SELECT * FROM form_templates WHERE id = ?').get(id)
    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }
    
    const fields = db.prepare(`
      SELECT * FROM form_template_fields 
      WHERE template_id = ?
      ORDER BY section_id, display_order
    `).all(id)
    
    res.json({ template, fields })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function saveFormTemplate(req, res) {
  try {
    const { template_name, template_description, is_default, fields } = req.body
    const userId = req.userId
    
    if (!template_name || !Array.isArray(fields)) {
      return res.status(400).json({ error: 'Template name and fields are required' })
    }
    
    // If setting as default, unset other defaults
    if (is_default) {
      db.prepare('UPDATE form_templates SET is_default = 0').run()
    }
    
    // Create or update template
    const existing = db.prepare('SELECT * FROM form_templates WHERE template_name = ?').get(template_name)
    
    let templateId
    if (existing) {
      // Update existing template
      db.prepare(`
        UPDATE form_templates SET
          template_description = ?,
          is_default = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(template_description || null, is_default ? 1 : 0, existing.id)
      templateId = existing.id
      
      // Delete existing fields
      db.prepare('DELETE FROM form_template_fields WHERE template_id = ?').run(templateId)
    } else {
      // Create new template
      const result = db.prepare(`
        INSERT INTO form_templates (template_name, template_description, is_default, created_by)
        VALUES (?, ?, ?, ?)
      `).run(template_name, template_description || null, is_default ? 1 : 0, userId)
      templateId = result.lastInsertRowid
    }
    
    // Insert fields
    const stmt = db.prepare(`
      INSERT INTO form_template_fields (
        template_id, section_id, field_id, field_type, field_label, field_placeholder,
        is_required, is_readonly, default_value, options, validation_rules,
        conditions, display_order, source_system, source_field
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const transaction = db.transaction((fields) => {
      for (const field of fields) {
        stmt.run(
          templateId,
          field.section_id,
          field.field_id,
          field.field_type,
          field.field_label,
          field.field_placeholder || null,
          field.is_required ? 1 : 0,
          field.is_readonly ? 1 : 0,
          field.default_value || null,
          field.options || null,
          field.validation_rules || null,
          field.conditions || null,
          field.display_order || 0,
          field.source_system || 'manual',
          field.source_field || null
        )
      }
    })
    
    transaction(fields)
    
    res.json({ 
      success: true, 
      message: existing ? 'Template updated' : 'Template saved',
      templateId 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function deleteFormTemplate(req, res) {
  try {
    const { id } = req.params
    
    const result = db.prepare('DELETE FROM form_templates WHERE id = ?').run(id)
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Template not found' })
    }
    
    res.json({ success: true, message: 'Template deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function loadFormTemplate(req, res) {
  try {
    const { id } = req.params
    console.log('Loading template with ID:', id)
    
    const template = db.prepare('SELECT * FROM form_templates WHERE id = ?').get(id)
    if (!template) {
      console.log('Template not found for ID:', id)
      return res.status(404).json({ error: 'Template not found' })
    }
    
    console.log('Found template:', template.template_name)
    
    const fields = db.prepare(`
      SELECT * FROM form_template_fields 
      WHERE template_id = ?
      ORDER BY section_id, display_order
    `).all(id)
    
    console.log('Template has', fields.length, 'fields')
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'Template has no fields' })
    }
    
    // Copy template fields to active form configuration
    db.prepare('DELETE FROM form_fields_config').run()
    console.log('Cleared existing form_fields_config')
    
    const stmt = db.prepare(`
      INSERT INTO form_fields_config (
        section_id, field_id, field_type, field_label, field_placeholder,
        is_required, is_readonly, default_value, options, validation_rules,
        conditions, display_order, source_system, source_field
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const transaction = db.transaction((fields) => {
      for (const field of fields) {
        stmt.run(
          field.section_id,
          field.field_id,
          field.field_type,
          field.field_label,
          field.field_placeholder || null,
          field.is_required ? 1 : 0,
          field.is_readonly ? 1 : 0,
          field.default_value || null,
          field.options || null,
          field.validation_rules || null,
          field.conditions || null,
          field.display_order || 0,
          field.source_system || 'manual',
          field.source_field || null
        )
      }
    })
    
    transaction(fields)
    console.log('Copied', fields.length, 'fields to form_fields_config')
    
    // Fetch the loaded fields with IDs from form_fields_config
    const loadedFields = db.prepare(`
      SELECT * FROM form_fields_config 
      ORDER BY section_id, display_order
    `).all()
    
    // Ensure each field has required properties with proper formatting
    const formattedFields = loadedFields.map(field => ({
      id: field.id,
      field_id: field.field_id,
      section_id: field.section_id,
      field_type: field.field_type,
      field_label: field.field_label,
      field_placeholder: field.field_placeholder || null,
      is_required: Boolean(field.is_required),
      is_readonly: Boolean(field.is_readonly),
      default_value: field.default_value || null,
      options: field.options || null,
      validation_rules: field.validation_rules || null,
      conditions: field.conditions || null,
      display_order: field.display_order || 0,
      source_system: field.source_system || 'manual',
      source_field: field.source_field || null
    }))
    
    console.log('Formatted', formattedFields.length, 'fields for response')
    
    res.json({ 
      success: true, 
      message: 'Template loaded',
      template,
      fields: formattedFields,
      fieldCount: formattedFields.length
    })
  } catch (error) {
    console.error('Error loading template:', error)
    res.status(500).json({ error: error.message })
  }
}

export async function getSystemEditionConfig(req, res) {
  try {
    const edition = getSystemEdition()
    const features = getEditionFeatures()
    const allFeatures = getAllFeatures()
    
    res.json({
      edition,
      features,
      availableEditions: ['standard', 'pro'],
      featureComparison: allFeatures
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function updateSystemEdition(req, res) {
  try {
    const { edition } = req.body
    const userId = req.userId
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId)
    if (!user || user.role !== 'Super Admin') {
      return res.status(403).json({ error: 'Only Super Admin can change system edition' })
    }
    
    if (edition !== 'standard' && edition !== 'pro') {
      return res.status(400).json({ error: 'Invalid edition. Must be "standard" or "pro"' })
    }
    
    const result = setSystemEdition(edition, userId)
    
    res.json({
      success: true,
      message: `System edition updated to ${edition}`,
      edition: result.edition
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function getEnabledFeatures(req, res) {
  try {
    const features = getEditionFeatures()
    const edition = getSystemEdition()
    
    res.json({
      edition,
      features,
      isPro: edition === 'pro',
      isStandard: edition === 'standard'
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * Get all available fields for rule building
 * Combines form_fields_config, coi_requests schema, and related tables
 */
export async function getRuleFields(req, res) {
  try {
    // Define all available fields organized by category
    const ruleFields = {
      // Request Information Fields
      requestInfo: {
        label: 'Request Information',
        fields: [
          { id: 'department', label: 'Department', type: 'select', options: ['Audit', 'Tax', 'Advisory', 'Accounting', 'Other'] },
          { id: 'designation', label: 'Designation', type: 'select', options: ['Director', 'Partner', 'Manager', 'Senior Manager'] },
          { id: 'entity', label: 'Entity', type: 'text' },
          { id: 'line_of_service', label: 'Line of Service', type: 'text' },
          { id: 'requested_document', label: 'Requested Document', type: 'select', options: ['Proposal', 'Engagement Letter'] },
          { id: 'language', label: 'Language', type: 'select', options: ['English', 'Arabic'] },
          { id: 'stage', label: 'Stage', type: 'select', options: ['Proposal', 'Engagement'] }
        ]
      },
      
      // Client Information Fields
      clientInfo: {
        label: 'Client Information',
        fields: [
          { id: 'client_name', label: 'Client Name', type: 'text', source: 'clients.client_name' },
          { id: 'client_type', label: 'Client Type', type: 'select', options: ['Existing', 'New', 'Potential'] },
          { id: 'client_status', label: 'Client Status', type: 'select', options: ['Active', 'Inactive', 'Potential'] },
          { id: 'client_location', label: 'Client Location', type: 'select', options: ['State of Kuwait', 'GCC', 'International'] },
          { id: 'client_country', label: 'Client Country', type: 'text', source: 'clients.country' },
          { id: 'relationship_with_client', label: 'Relationship with Client', type: 'select', options: ['Direct', 'Referral', 'Group Company'] },
          { id: 'regulated_body', label: 'Regulated Body', type: 'select', options: ['CMA', 'CBK', 'Ministry of Commerce', 'None'] },
          { id: 'parent_company', label: 'Parent Company', type: 'text' },
          { id: 'client_industry', label: 'Client Industry', type: 'select', options: ['Financial Services', 'Banking', 'Insurance', 'Manufacturing', 'Retail', 'Oil & Gas', 'Real Estate', 'Healthcare', 'Technology', 'Other'], source: 'clients.industry' },
          { id: 'client_relationship_duration', label: 'Client Relationship Duration', type: 'select', options: ['New', 'Less than 1 year', '1-3 years', '3-5 years', '5+ years'], valueType: 'text' }
        ]
      },
      
      // Service Information Fields
      serviceInfo: {
        label: 'Service Information',
        fields: [
          { id: 'service_type', label: 'Service Type', type: 'select', options: ['Statutory Audit', 'External Audit', 'Tax Compliance', 'Tax Advisory', 'Tax Planning', 'Tax Strategy', 'Tax Return', 'Management Consulting', 'Business Advisory', 'Internal Audit', 'Due Diligence', 'Valuation', 'IT Advisory', 'Litigation Support', 'Dispute Resolution', 'Legal Representation', 'Consulting'] },
          { id: 'service_category', label: 'Service Category', type: 'select', options: ['Assurance', 'Non-Assurance', 'Tax', 'Advisory'] },
          { id: 'service_description', label: 'Service Description', type: 'text' },
          { id: 'engagement_start_date', label: 'Engagement Start Date', type: 'date', source: 'coi_requests.requested_service_period_start' },
          { id: 'engagement_end_date', label: 'Engagement End Date', type: 'date', source: 'coi_requests.requested_service_period_end' },
          { id: 'service_turnaround_days', label: 'Service Turnaround Days', type: 'number', valueType: 'number', description: 'Number of days for service completion' }
        ]
      },
      
      // Compliance Fields
      complianceFields: {
        label: 'Compliance & Ownership',
        fields: [
          { id: 'pie_status', label: 'PIE Status', type: 'select', options: ['Yes', 'No'] },
          { id: 'international_operations', label: 'International Operations', type: 'select', options: ['Yes', 'No'] },
          { id: 'global_clearance_status', label: 'Global Clearance Status', type: 'select', options: ['Not Required', 'Pending', 'Approved', 'Rejected'] }
        ]
      },
      
      // Workflow Status Fields (for advanced rules)
      workflowStatus: {
        label: 'Workflow Status',
        fields: [
          { id: 'status', label: 'Request Status', type: 'select', options: ['Draft', 'Pending Director Approval', 'Pending Compliance', 'Pending Partner', 'Pending Finance', 'Approved', 'Rejected', 'Lapsed', 'Active'] },
          { id: 'director_approval_status', label: 'Director Approval', type: 'select', options: ['Pending', 'Approved', 'Approved with Restrictions', 'Need More Info', 'Rejected'] },
          { id: 'compliance_review_status', label: 'Compliance Review', type: 'select', options: ['Pending', 'Approved', 'Approved with Restrictions', 'Need More Info', 'Rejected'] },
          { id: 'partner_approval_status', label: 'Partner Approval', type: 'select', options: ['Pending', 'Approved', 'Approved with Restrictions', 'Need More Info', 'Rejected'] }
        ]
      },
      
      // Financial & Relationship Fields
      financialFields: {
        label: 'Financial & Relationship',
        fields: [
          { id: 'total_fees', label: 'Total Fees', type: 'number', valueType: 'number', source: 'coi_requests.total_fees', description: 'Total engagement fees' },
          { id: 'financial_interest', label: 'Financial Interest in Client', type: 'select', options: ['Yes', 'No'], valueType: 'text' },
          { id: 'family_relationship', label: 'Family Relationship with Client Management', type: 'text', description: 'Family relationship details (e.g., CEO, CFO, Director, Partner)' }
        ]
      },
      
      // Computed/Derived Fields (for advanced logic)
      computedFields: {
        label: 'Computed Fields',
        fields: [
          { id: 'has_active_audit', label: 'Has Active Audit Engagement', type: 'computed', valueType: 'boolean', description: 'True if client has any active statutory/external audit' },
          { id: 'days_since_submission', label: 'Days Since Submission', type: 'computed', valueType: 'number', description: 'Number of days since request was submitted' },
          { id: 'is_group_company', label: 'Is Group Company', type: 'computed', valueType: 'boolean', description: 'True if client has a parent company' },
          { id: 'engagement_duration', label: 'Engagement Duration (Years)', type: 'computed', valueType: 'number', description: 'Calculated duration of engagement in years' }
        ]
      }
    }
    
    // Also fetch any custom fields from form_fields_config that aren't in the standard list
    try {
      const customFields = db.prepare(`
        SELECT field_id, field_label, field_type, options
        FROM form_fields_config
        WHERE field_id NOT IN (
          'requestor_name', 'designation', 'entity', 'line_of_service',
          'requested_document', 'language', 'client_id', 'client_type',
          'parent_company', 'service_type', 'service_description',
          'pie_status', 'international_operations'
        )
      `).all()
      
      if (customFields.length > 0) {
        ruleFields.customFields = {
          label: 'Custom Form Fields',
          fields: customFields.map(f => ({
            id: f.field_id,
            label: f.field_label,
            type: f.field_type,
            options: f.options ? JSON.parse(f.options) : null
          }))
        }
      }
    } catch (e) {
      // form_fields_config table might not exist
    }
    
    // Define available operators for each field type
    const operators = {
      select: [
        { id: 'equals', label: 'Equals' },
        { id: 'not_equals', label: 'Not Equals' },
        { id: 'in', label: 'Is One Of' },
        { id: 'not_in', label: 'Is Not One Of' }
      ],
      text: [
        { id: 'equals', label: 'Equals' },
        { id: 'not_equals', label: 'Not Equals' },
        { id: 'contains', label: 'Contains' },
        { id: 'not_contains', label: 'Does Not Contain' },
        { id: 'starts_with', label: 'Starts With' },
        { id: 'ends_with', label: 'Ends With' },
        { id: 'is_empty', label: 'Is Empty' },
        { id: 'is_not_empty', label: 'Is Not Empty' }
      ],
      computed: [
        { id: 'equals', label: 'Equals' },
        { id: 'not_equals', label: 'Not Equals' },
        { id: 'greater_than', label: 'Greater Than' },
        { id: 'less_than', label: 'Less Than' },
        { id: 'is_true', label: 'Is True' },
        { id: 'is_false', label: 'Is False' }
      ]
    }
    
    res.json({
      categories: ruleFields,
      operators,
      // Flat list of all fields for easy lookup
      allFields: Object.values(ruleFields).flatMap(cat => cat.fields)
    })
  } catch (error) {
    console.error('Error getting rule fields:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Test a rule against real requests in the database
 * Returns which requests would match/not match
 */
export async function testRule(req, res) {
  try {
    const rule = req.body
    const limit = parseInt(req.query.limit) || 10
    
    // Get recent requests to test against
    const recentRequests = db.prepare(`
      SELECT id, request_id, client_id, service_type, client_type, pie_status,
             client_location, relationship_with_client, international_operations,
             department, status
      FROM coi_requests 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(limit)
    
    const results = {
      testedAgainst: recentRequests.length,
      matches: [],
      nonMatches: [],
      summary: {
        wouldMatch: 0,
        wouldNotMatch: 0
      }
    }
    
    for (const request of recentRequests) {
      const matches = evaluateSingleCondition(rule, request)
      
      if (matches) {
        results.matches.push({
          requestId: request.request_id,
          id: request.id,
          client: request.client_id,
          service: request.service_type,
          status: request.status
        })
        results.summary.wouldMatch++
      } else {
        results.nonMatches.push({
          requestId: request.request_id,
          id: request.id,
          client: request.client_id,
          service: request.service_type,
          status: request.status
        })
        results.summary.wouldNotMatch++
      }
    }
    
    res.json({
      success: true,
      rule: {
        name: rule.rule_name,
        type: rule.rule_type,
        condition: rule.condition_groups 
          ? 'Advanced (multiple conditions)' 
          : `${rule.condition_field} ${rule.condition_operator} "${rule.condition_value}"`
      },
      results
    })
  } catch (error) {
    console.error('Error testing rule:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Evaluate a single condition against a request
 */
function evaluateSingleCondition(rule, request) {
  // If no condition, matches everything
  if (!rule.condition_field && !rule.condition_groups) {
    return true
  }
  
  // Handle condition groups (AND/OR logic)
  if (rule.condition_groups) {
    let groups
    try {
      groups = typeof rule.condition_groups === 'string' 
        ? JSON.parse(rule.condition_groups) 
        : rule.condition_groups
    } catch (e) {
      return false
    }
    
    // Evaluate each group
    let result = false
    for (let gIdx = 0; gIdx < groups.length; gIdx++) {
      const group = groups[gIdx]
      let groupResult = null
      
      for (let cIdx = 0; cIdx < group.conditions.length; cIdx++) {
        const cond = group.conditions[cIdx]
        const condResult = evaluateCondition(
          request[cond.field],
          cond.conditionOperator,
          cond.value
        )
        
        if (groupResult === null) {
          groupResult = condResult
        } else {
          const op = cond.operator || 'AND'
          groupResult = op === 'AND' ? (groupResult && condResult) : (groupResult || condResult)
        }
      }
      
      if (gIdx === 0) {
        result = groupResult || false
      } else {
        const groupOp = group.operator || 'OR'
        result = groupOp === 'AND' ? (result && groupResult) : (result || groupResult)
      }
    }
    
    return result
  }
  
  // Simple single condition
  const fieldValue = request[rule.condition_field]
  return evaluateCondition(fieldValue, rule.condition_operator, rule.condition_value)
}

/**
 * Evaluate a condition
 */
function evaluateCondition(fieldValue, operator, conditionValue) {
  if (fieldValue === undefined || fieldValue === null) {
    fieldValue = ''
  }
  
  const strFieldValue = String(fieldValue).toLowerCase()
  const strCondValue = String(conditionValue).toLowerCase()
  
  switch (operator) {
    case 'equals':
      return strFieldValue === strCondValue
    case 'not_equals':
      return strFieldValue !== strCondValue
    case 'contains':
      return strFieldValue.includes(strCondValue)
    case 'not_contains':
      return !strFieldValue.includes(strCondValue)
    case 'starts_with':
      return strFieldValue.startsWith(strCondValue)
    case 'ends_with':
      return strFieldValue.endsWith(strCondValue)
    case 'in':
      const inValues = strCondValue.split(',').map(v => v.trim().toLowerCase())
      return inValues.includes(strFieldValue)
    case 'not_in':
      const notInValues = strCondValue.split(',').map(v => v.trim().toLowerCase())
      return !notInValues.includes(strFieldValue)
    case 'is_empty':
      return !fieldValue || fieldValue === ''
    case 'is_not_empty':
      return fieldValue && fieldValue !== ''
    case 'is_true':
      return fieldValue === true || fieldValue === 1 || strFieldValue === 'true' || strFieldValue === 'yes'
    case 'is_false':
      return fieldValue === false || fieldValue === 0 || strFieldValue === 'false' || strFieldValue === 'no'
    case 'greater_than':
      return parseFloat(fieldValue) > parseFloat(conditionValue)
    case 'less_than':
      return parseFloat(fieldValue) < parseFloat(conditionValue)
    default:
      return false
  }
}
