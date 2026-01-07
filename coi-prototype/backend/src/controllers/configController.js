import { getDatabase } from '../database/init.js'
import { analyzeFieldChange, updateImpactCache } from '../services/impactAnalysisService.js'
import { validateWithFallback } from '../services/rulesEngineService.js'
import { 
  getSystemEdition, 
  setSystemEdition, 
  getEditionFeatures, 
  getAllFeatures,
  isFeatureEnabled 
} from '../services/configService.js'

const db = getDatabase()

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

export async function saveBusinessRule(req, res) {
  try {
    const userId = req.userId
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId)
    const userRole = user?.role || ''
    
    const rule = req.body
    
    // Super Admin can create approved rules directly
    // Compliance/Admin rules require approval
    const requiresApproval = userRole !== 'Super Admin'
    const approvalStatus = requiresApproval ? 'Pending' : 'Approved'
    
    const result = db.prepare(`
      INSERT INTO business_rules_config (
        rule_name, rule_type, condition_field, condition_operator,
        condition_value, action_type, action_value, is_active,
        approval_status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      rule.rule_name,
      rule.rule_type,
      rule.condition_field || null,
      rule.condition_operator || null,
      rule.condition_value || null,
      rule.action_type,
      rule.action_value || null,
      requiresApproval ? 0 : (rule.is_active !== undefined ? (rule.is_active ? 1 : 0) : 1), // Only active if approved
      approvalStatus,
      userId
    )
    
    const message = requiresApproval 
      ? 'Rule created and pending Super Admin approval' 
      : 'Rule created and approved'
    
    res.json({ 
      success: true, 
      message,
      ruleId: result.lastInsertRowid,
      requiresApproval,
      approvalStatus
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
    
    // If Super Admin is updating, can update directly
    // If Compliance/Admin is updating an approved rule, it needs re-approval
    const isSuperAdmin = userRole === 'Super Admin'
    const wasApproved = rule.approval_status === 'Approved'
    const needsReapproval = !isSuperAdmin && wasApproved && (
      updates.rule_name || updates.rule_type || updates.condition_field || 
      updates.condition_operator || updates.condition_value || 
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
        action_type = COALESCE(?, action_type),
        action_value = COALESCE(?, action_value),
        is_active = ?,
        approval_status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      updates.rule_name,
      updates.rule_type,
      updates.condition_field !== undefined ? (updates.condition_field || null) : undefined,
      updates.condition_operator !== undefined ? (updates.condition_operator || null) : undefined,
      updates.condition_value !== undefined ? (updates.condition_value || null) : undefined,
      updates.action_type,
      updates.action_value !== undefined ? (updates.action_value || null) : undefined,
      isActive,
      approvalStatus,
      id
    )
    
    const message = needsReapproval 
      ? 'Rule updated and requires re-approval' 
      : 'Rule updated'
    
    res.json({ success: true, message, requiresApproval: needsReapproval })
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
    
    const template = db.prepare('SELECT * FROM form_templates WHERE id = ?').get(id)
    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }
    
    const fields = db.prepare(`
      SELECT * FROM form_template_fields 
      WHERE template_id = ?
      ORDER BY section_id, display_order
    `).all(id)
    
    // Copy template fields to active form configuration
    db.prepare('DELETE FROM form_fields_config').run()
    
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
    
    res.json({ 
      success: true, 
      message: 'Template loaded',
      template,
      fields 
    })
  } catch (error) {
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

