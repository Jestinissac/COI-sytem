import { getDatabase } from '../database/init.js'
import { analyzeFieldChange, generateImpactReport, updateImpactCache, getRulesEngineStatus as getImpactStatus } from '../services/impactAnalysisService.js'
import { validateFieldRemoval, validateFieldTypeChange, validateFieldRename, checkDataIntegrity } from '../services/dataConsistencyService.js'
import { validateWithFallback, emergencyBypass, getRulesEngineStatus, resetRulesEngine, performHealthCheck } from '../services/rulesEngineService.js'

const db = getDatabase()

export async function validateFieldChange(req, res) {
  try {
    const { id: fieldId } = req.params
    const { changeType, newConfig } = req.body

    const validation = await validateWithFallback(fieldId, { changeType, ...newConfig })

    res.json(validation)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function getFieldImpact(req, res) {
  try {
    const { id: fieldId } = req.params
    const { changeType } = req.query

    const impact = analyzeFieldChange(fieldId, changeType || 'analysis')

    res.json({ impact })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function getFieldDependencies(req, res) {
  try {
    const { id: fieldId } = req.params
    const { getDependencies } = await import('../services/impactAnalysisService.js')
    const dependencies = getDependencies(fieldId)

    res.json({ dependencies })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function recordChange(req, res) {
  try {
    const userId = req.userId
    const { changeType, fieldId, oldConfig, newConfig, changeReason } = req.body

    // Analyze impact before recording
    const impact = analyzeFieldChange(fieldId, changeType)
    const requiresApproval = impact.requiresApproval || impact.riskLevel === 'high' || impact.riskLevel === 'critical'

    // Record change
    const result = db.prepare(`
      INSERT INTO form_config_changes (
        change_type, field_id, old_config, new_config,
        changed_by, change_reason, requires_approval, approval_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      changeType,
      fieldId,
      oldConfig ? JSON.stringify(oldConfig) : null,
      newConfig ? JSON.stringify(newConfig) : null,
      userId,
      changeReason || null,
      requiresApproval ? 1 : 0,
      requiresApproval ? 'Pending' : 'Approved'
    )

    const changeId = result.lastInsertRowid

    // If low impact, auto-approve and apply
    if (!requiresApproval) {
      // Apply change immediately (this would be handled by configController)
      res.json({
        success: true,
        changeId,
        message: 'Change recorded and applied',
        requiresApproval: false
      })
    } else {
      res.json({
        success: true,
        changeId,
        message: 'Change recorded - approval required',
        requiresApproval: true,
        impact
      })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function approveChange(req, res) {
  try {
    const { id: changeId } = req.params
    const userId = req.userId
    const { comments } = req.body

    const change = db.prepare('SELECT * FROM form_config_changes WHERE id = ?').get(changeId)
    if (!change) {
      return res.status(404).json({ error: 'Change not found' })
    }

    if (change.approval_status !== 'Pending') {
      return res.status(400).json({ error: 'Change is not pending approval' })
    }

    // Update approval status
    db.prepare(`
      UPDATE form_config_changes SET
        approval_status = 'Approved',
        approved_by = ?,
        approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(userId, changeId)

    // Apply change (would trigger actual form config update)
    res.json({
      success: true,
      message: 'Change approved',
      changeId
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function rejectChange(req, res) {
  try {
    const { id: changeId } = req.params
    const userId = req.userId
    const { reason } = req.body

    const change = db.prepare('SELECT * FROM form_config_changes WHERE id = ?').get(changeId)
    if (!change) {
      return res.status(404).json({ error: 'Change not found' })
    }

    db.prepare(`
      UPDATE form_config_changes SET
        approval_status = 'Rejected',
        approved_by = ?,
        approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(userId, changeId)

    res.json({
      success: true,
      message: 'Change rejected',
      changeId
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function rollbackChange(req, res) {
  try {
    const { id: changeId } = req.params
    const userId = req.userId

    const change = db.prepare('SELECT * FROM form_config_changes WHERE id = ?').get(changeId)
    if (!change) {
      return res.status(404).json({ error: 'Change not found' })
    }

    if (!change.old_config) {
      return res.status(400).json({ error: 'No previous configuration to rollback to' })
    }

    // Restore old configuration
    const oldConfig = typeof change.old_config === 'string' 
      ? JSON.parse(change.old_config) 
      : change.old_config

    // Update form_fields_config with old config
    if (change.field_id) {
      const field = db.prepare('SELECT * FROM form_fields_config WHERE field_id = ?').get(change.field_id)
      if (field) {
        db.prepare(`
          UPDATE form_fields_config SET
            section_id = COALESCE(?, section_id),
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
          WHERE field_id = ?
        `).run(
          oldConfig.section_id,
          oldConfig.field_type,
          oldConfig.field_label,
          oldConfig.field_placeholder,
          oldConfig.is_required ? 1 : 0,
          oldConfig.is_readonly ? 1 : 0,
          oldConfig.default_value,
          oldConfig.options,
          oldConfig.validation_rules,
          oldConfig.conditions,
          oldConfig.display_order,
          oldConfig.source_system,
          oldConfig.source_field,
          change.field_id
        )
      }
    }

    // Record rollback as new change
    db.prepare(`
      INSERT INTO form_config_changes (
        change_type, field_id, old_config, new_config,
        changed_by, change_reason, approval_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'rollback',
      change.field_id,
      change.new_config,
      change.old_config,
      userId,
      `Rollback of change ${changeId}`,
      'Approved'
    )

    res.json({
      success: true,
      message: 'Change rolled back successfully'
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function getChanges(req, res) {
  try {
    const { fieldId, status, limit = 50 } = req.query

    let query = `
      SELECT 
        c.*,
        u1.name as changed_by_name,
        u2.name as approved_by_name
      FROM form_config_changes c
      LEFT JOIN users u1 ON c.changed_by = u1.id
      LEFT JOIN users u2 ON c.approved_by = u2.id
      WHERE 1=1
    `
    const params = []

    if (fieldId) {
      query += ' AND c.field_id = ?'
      params.push(fieldId)
    }

    if (status) {
      query += ' AND c.approval_status = ?'
      params.push(status)
    }

    query += ' ORDER BY c.created_at DESC LIMIT ?'
    params.push(parseInt(limit))

    const changes = db.prepare(query).all(...params)

    res.json({ changes })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function getChangeDetails(req, res) {
  try {
    const { id } = req.params

    const change = db.prepare(`
      SELECT 
        c.*,
        u1.name as changed_by_name,
        u2.name as approved_by_name
      FROM form_config_changes c
      LEFT JOIN users u1 ON c.changed_by = u1.id
      LEFT JOIN users u2 ON c.approved_by = u2.id
      WHERE c.id = ?
    `).get(id)

    if (!change) {
      return res.status(404).json({ error: 'Change not found' })
    }

    // Get impact analysis if available
    let impact = null
    if (change.field_id) {
      try {
        impact = generateImpactReport(change.field_id, change.change_type)
      } catch {
        // Impact analysis failed, continue without it
      }
    }

    res.json({
      change,
      impact
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function emergencyBypassChange(req, res) {
  try {
    const { id: changeId } = req.params
    const userId = req.userId
    const { reason } = req.body

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Bypass reason is required' })
    }

    const result = emergencyBypass(changeId, userId, reason)

    if (result.success) {
      res.json(result)
    } else {
      res.status(400).json(result)
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function getRulesEngineHealth(req, res) {
  try {
    const status = getRulesEngineStatus()
    res.json({ status })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function resetRulesEngineHealth(req, res) {
  try {
    const result = resetRulesEngine()
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function performHealthCheckEndpoint(req, res) {
  try {
    const health = performHealthCheck()
    res.json({ health })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

