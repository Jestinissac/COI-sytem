import { getDatabase } from '../database/init.js'
import { getAffectedRequests } from './impactAnalysisService.js'

const db = getDatabase()

export function validateFieldRemoval(fieldId) {
  const validation = {
    safe: true,
    errors: [],
    warnings: [],
    affectedRequests: []
  }

  // Check if field exists
  const field = db.prepare('SELECT * FROM form_fields_config WHERE field_id = ?').get(fieldId)
  if (!field) {
    validation.errors.push('Field does not exist')
    validation.safe = false
    return validation
  }

  // Check if any requests have data in this field
  const requests = getAffectedRequests(fieldId)
  validation.affectedRequests = requests

  if (requests.length > 0) {
    validation.warnings.push(`${requests.length} request(s) contain data in this field`)
    
    // Check if any are active/approved
    const activeRequests = requests.filter(r => ['Approved', 'Active'].includes(r.status))
    if (activeRequests.length > 0) {
      validation.errors.push(`Cannot remove field: ${activeRequests.length} active request(s) use this field`)
      validation.safe = false
    } else {
      validation.warnings.push('Field can be removed but data will be lost for draft requests')
    }
  }

  // Check dependencies
  const dependencies = db.prepare(`
    SELECT * FROM field_dependencies
    WHERE depends_on_field_id = ?
  `).all(fieldId)

  if (dependencies.length > 0) {
    validation.errors.push(`Cannot remove field: ${dependencies.length} field(s) depend on it`)
    validation.safe = false
  }

  // Check business rules
  const rules = db.prepare(`
    SELECT * FROM business_rules_config
    WHERE condition_field = ?
    AND is_active = 1
  `).all(fieldId)

  if (rules.length > 0) {
    validation.errors.push(`Cannot remove field: ${rules.length} active business rule(s) reference it`)
    validation.safe = false
  }

  return validation
}

export function validateFieldTypeChange(fieldId, newType) {
  const validation = {
    compatible: true,
    errors: [],
    warnings: [],
    dataLossRisk: false
  }

  const field = db.prepare('SELECT * FROM form_fields_config WHERE field_id = ?').get(fieldId)
  if (!field) {
    validation.errors.push('Field does not exist')
    validation.compatible = false
    return validation
  }

  const oldType = field.field_type

  if (oldType === newType) {
    return validation // No change
  }

  // Check compatibility matrix
  const compatibleChanges = {
    'text': ['textarea'], // Safe: text -> textarea
    'textarea': ['text'], // Safe: textarea -> text (may truncate)
    'number': ['text'], // Safe: number -> text (loses validation)
    'date': ['text'], // Safe: date -> text (loses validation)
    'select': ['text'] // Safe: select -> text (loses options)
  }

  const incompatibleChanges = {
    'text': ['number', 'date'], // text -> number/date may fail parsing
    'textarea': ['number', 'date'], // textarea -> number/date may fail
    'number': ['date'], // number -> date incompatible
    'date': ['number'], // date -> number incompatible
    'select': ['number', 'date'] // select -> number/date incompatible
  }

  // Check if change is compatible
  if (compatibleChanges[oldType]?.includes(newType)) {
    validation.warnings.push(`Changing from ${oldType} to ${newType} is safe but may lose validation`)
  } else if (incompatibleChanges[oldType]?.includes(newType)) {
    validation.errors.push(`Cannot change field type from ${oldType} to ${newType} - data incompatibility`)
    validation.compatible = false
    validation.dataLossRisk = true
  } else {
    // Unknown combination - warn
    validation.warnings.push(`Type change from ${oldType} to ${newType} may cause data issues`)
  }

  // Check if existing data is compatible
  if (validation.compatible) {
    const requests = getAffectedRequests(fieldId)
    if (requests.length > 0) {
      validation.warnings.push(`${requests.length} request(s) have data that may need validation after type change`)
    }
  }

  return validation
}

export function validateFieldRename(oldFieldId, newFieldId) {
  const validation = {
    safe: true,
    errors: [],
    warnings: []
  }

  // Check if old field exists
  const oldField = db.prepare('SELECT * FROM form_fields_config WHERE field_id = ?').get(oldFieldId)
  if (!oldField) {
    validation.errors.push('Source field does not exist')
    validation.safe = false
    return validation
  }

  // Check if new field ID already exists
  const newField = db.prepare('SELECT * FROM form_fields_config WHERE field_id = ?').get(newFieldId)
  if (newField) {
    validation.errors.push(`Field ID "${newFieldId}" already exists`)
    validation.safe = false
    return validation
  }

  // Check if new field ID conflicts with database column names
  const reservedColumns = [
    'id', 'request_id', 'client_id', 'requester_id', 'department',
    'status', 'stage', 'created_at', 'updated_at'
  ]
  if (reservedColumns.includes(newFieldId.toLowerCase())) {
    validation.errors.push(`Field ID "${newFieldId}" conflicts with reserved database column`)
    validation.safe = false
    return validation
  }

  // Check if any requests have data in old field
  const requests = getAffectedRequests(oldFieldId)
  if (requests.length > 0) {
    validation.warnings.push(`${requests.length} request(s) have data in old field ID - migration needed`)
  }

  return validation
}

export function checkDataIntegrity(fieldId) {
  const integrity = {
    valid: true,
    issues: [],
    warnings: []
  }

  const field = db.prepare('SELECT * FROM form_fields_config WHERE field_id = ?').get(fieldId)
  if (!field) {
    integrity.issues.push('Field does not exist')
    integrity.valid = false
    return integrity
  }

  // Check if field mapping exists
  const mapping = db.prepare('SELECT * FROM form_field_mappings WHERE field_id = ?').get(fieldId)
  if (!mapping) {
    integrity.warnings.push('Field mapping not found - field may not save correctly')
  }

  // Check if field is in any active templates
  const templates = db.prepare(`
    SELECT COUNT(*) as count
    FROM form_template_fields
    WHERE field_id = ?
  `).get(fieldId)
  
  if (templates.count === 0) {
    integrity.warnings.push('Field is not used in any templates')
  }

  // Check for orphaned dependencies
  const dependencies = db.prepare(`
    SELECT * FROM field_dependencies
    WHERE depends_on_field_id = ?
  `).all(fieldId)

  for (const dep of dependencies) {
    const dependentField = db.prepare('SELECT * FROM form_fields_config WHERE field_id = ?').get(dep.field_id)
    if (!dependentField) {
      integrity.issues.push(`Orphaned dependency: field "${dep.field_id}" depends on this field but does not exist`)
      integrity.valid = false
    }
  }

  return integrity
}

export function validateRequiredStatusChange(fieldId, newRequiredStatus) {
  const validation = {
    safe: true,
    errors: [],
    warnings: []
  }

  const field = db.prepare('SELECT * FROM form_fields_config WHERE field_id = ?').get(fieldId)
  if (!field) {
    validation.errors.push('Field does not exist')
    validation.safe = false
    return validation
  }

  const wasRequired = field.is_required
  const willBeRequired = newRequiredStatus

  // If making field required when it wasn't before
  if (!wasRequired && willBeRequired) {
    // Check draft requests that don't have this field filled
    const requests = getAffectedRequests(fieldId)
    const draftRequests = requests.filter(r => r.status === 'Draft')
    
    if (draftRequests.length > 0) {
      validation.warnings.push(`Making field required will invalidate ${draftRequests.length} draft request(s)`)
    }
  }

  // If making field optional when it was required
  if (wasRequired && !willBeRequired) {
    validation.warnings.push('Making field optional may affect validation rules')
  }

  return validation
}

