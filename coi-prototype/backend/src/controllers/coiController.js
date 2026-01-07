import { getDatabase } from '../database/init.js'
import { getFilteredRequests } from '../middleware/dataSegregation.js'
import { checkDuplication } from '../services/duplicationCheckService.js'
import { sendApprovalNotification, sendRejectionNotification, sendEngagementCodeNotification, sendProposalExecutedNotification } from '../services/notificationService.js'
import { generateEngagementCode as generateCode } from '../services/engagementCodeService.js'
import { updateMonitoringDays, getApproachingLimitRequests, getExceededLimitRequests } from '../services/monitoringService.js'
import { evaluateRules } from '../services/businessRulesEngine.js'

const db = getDatabase()

// Standard field mappings (field_id -> db_column)
const STANDARD_FIELD_MAPPINGS = {
  'requestor_name': 'requestor_name',
  'designation': 'designation',
  'entity': 'entity',
  'line_of_service': 'line_of_service',
  'requested_document': 'requested_document',
  'language': 'language',
  'client_id': 'client_id',
  'client_type': 'client_type',
  'client_location': 'client_location',
  'relationship_with_client': 'relationship_with_client',
  'regulated_body': 'regulated_body',
  'pie_status': 'pie_status',
  'parent_company': 'parent_company',
  'service_type': 'service_type',
  'service_category': 'service_category',
  'service_description': 'service_description',
  'requested_service_period_start': 'requested_service_period_start',
  'requested_service_period_end': 'requested_service_period_end',
  'full_ownership_structure': 'full_ownership_structure',
  'related_affiliated_entities': 'related_affiliated_entities',
  'international_operations': 'international_operations',
  'foreign_subsidiaries': 'foreign_subsidiaries',
  'global_clearance_status': 'global_clearance_status'
}

function getCurrentFormVersion() {
  const version = db.prepare('SELECT MAX(version_number) as max_version FROM form_versions').get()
  return version?.max_version || 1
}

function getFieldMappings() {
  const mappings = db.prepare('SELECT * FROM form_field_mappings').all()
  const mappingMap = new Map()
  
  for (const mapping of mappings) {
    mappingMap.set(mapping.field_id, mapping)
  }
  
  // Add standard mappings if not in DB
  for (const [fieldId, dbColumn] of Object.entries(STANDARD_FIELD_MAPPINGS)) {
    if (!mappingMap.has(fieldId)) {
      mappingMap.set(fieldId, {
        field_id: fieldId,
        db_column: dbColumn,
        is_custom: false,
        data_type: 'text'
      })
    }
  }
  
  return mappingMap
}

export async function getMyRequests(req, res) {
  try {
    const user = getUserById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    const requests = getFilteredRequests(user, req.query)
    res.json(requests)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function getRequestById(req, res) {
  try {
    const user = getUserById(req.userId)
    
    console.log('[NEW CODE v2] Request ID:', req.params.id)
    
    // Fetch request data
    const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(req.params.id)
    
    console.log('[NEW CODE v2] Request found:', !!request)
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    // Check access based on role
    if (user.role === 'Requester' && request.requester_id !== user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (user.role === 'Director' && request.department !== user.department) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Fetch related data separately (SQLite JOIN issue workaround)
    const client = request.client_id ? 
      db.prepare('SELECT client_name, client_code FROM clients WHERE id = ?').get(request.client_id) : 
      null
    
    const requester = request.requester_id ? 
      db.prepare('SELECT name as requester_name FROM users WHERE id = ?').get(request.requester_id) : 
      null
    
    const signatories = db.prepare('SELECT * FROM coi_signatories WHERE coi_request_id = ?').all(request.id)
    
    // Merge data
    const response = {
      ...request,
      client_name: client?.client_name || null,
      client_code: client?.client_code || null,
      requester_name: requester?.requester_name || request.requestor_name || null,
      signatories
    }
    
    res.json(response)
  } catch (error) {
    console.error('ERROR in getRequestById:', error)
    res.status(500).json({ error: error.message })
  }
}

export async function createRequest(req, res) {
  try {
    const user = getUserById(req.userId)
    const data = req.body

    // Generate request ID
    const year = new Date().getFullYear()
    const countResult = db.prepare('SELECT COUNT(*) as count FROM coi_requests WHERE request_id LIKE ?').get(`COI-${year}-%`)
    const count = countResult ? countResult.count : 0
    const requestId = `COI-${year}-${String(count + 1).padStart(3, '0')}`

    // Get field mappings
    const fieldMappings = getFieldMappings()
    
    // Separate standard and custom fields
    const standardData = {}
    const customFields = {}
    
    Object.keys(data).forEach(key => {
      const mapping = fieldMappings.get(key)
      if (mapping && !mapping.is_custom && mapping.db_column) {
        // Standard field - map to database column
        standardData[mapping.db_column] = data[key]
      } else if (STANDARD_FIELD_MAPPINGS[key]) {
        // Direct standard field mapping
        standardData[STANDARD_FIELD_MAPPINGS[key]] = data[key]
      } else {
        // Custom field - store in JSON
        if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          customFields[key] = data[key]
        }
      }
    })

    // Validate required standard fields exist
    if (!standardData.service_description) {
      return res.status(400).json({ error: 'Service description is required' })
    }

    // Get current form version
    const formVersion = getCurrentFormVersion()

    const result = db.prepare(`
      INSERT INTO coi_requests (
        request_id, client_id, requester_id, department,
        requestor_name, designation, entity, line_of_service,
        requested_document, language,
        parent_company, client_location, relationship_with_client, client_type,
        service_type, service_description, requested_service_period_start, requested_service_period_end,
        full_ownership_structure, pie_status, related_affiliated_entities,
        international_operations, foreign_subsidiaries, global_clearance_status,
        custom_fields, form_version,
        status, stage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      requestId, 
      standardData.client_id || data.client_id, 
      user.id, 
      user.department,
      standardData.requestor_name || user.name, 
      standardData.designation || data.designation || '', 
      standardData.entity || data.entity || '', 
      standardData.line_of_service || data.line_of_service || '',
      standardData.requested_document || data.requested_document || '', 
      standardData.language || data.language || '',
      standardData.parent_company || data.parent_company || '', 
      standardData.client_location || data.client_location || '', 
      standardData.relationship_with_client || data.relationship_with_client || '', 
      standardData.client_type || data.client_type || '',
      standardData.service_type || data.service_type || '', 
      standardData.service_description || data.service_description || '', 
      standardData.requested_service_period_start || data.requested_service_period_start || null, 
      standardData.requested_service_period_end || data.requested_service_period_end || null,
      standardData.full_ownership_structure || data.full_ownership_structure || '', 
      standardData.pie_status || data.pie_status || 'No', 
      standardData.related_affiliated_entities || data.related_affiliated_entities || '',
      (standardData.international_operations !== undefined ? standardData.international_operations : (data.international_operations ? 1 : 0)), 
      standardData.foreign_subsidiaries || data.foreign_subsidiaries || '', 
      standardData.global_clearance_status || data.global_clearance_status || 'Not Required',
      Object.keys(customFields).length > 0 ? JSON.stringify(customFields) : null,
      formVersion,
      'Draft', 
      'Proposal'
    )

    // Add signatories
    if (data.signatories && Array.isArray(data.signatories)) {
      const insertSignatory = db.prepare('INSERT INTO coi_signatories (coi_request_id, signatory_id, position) VALUES (?, ?, ?)')
      data.signatories.forEach(sig => {
        if (sig.signatory_id) {
          insertSignatory.run(result.lastInsertRowid, sig.signatory_id, sig.position || '')
        }
      })
    }

    res.status(201).json({ id: result.lastInsertRowid, request_id: requestId })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function updateRequest(req, res) {
  try {
    const user = getUserById(req.userId)
    const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(req.params.id)
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    if (request.requester_id !== user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (request.status !== 'Draft') {
      return res.status(400).json({ error: 'Can only edit draft requests' })
    }

    const data = req.body
    // Update logic here (simplified)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function submitRequest(req, res) {
  try {
    const user = getUserById(req.userId)
    const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(req.params.id)
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    if (request.requester_id !== user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Check duplication with service type conflict detection
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(request.client_id)
    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }
    const duplicates = await checkDuplication(
      client.client_name, 
      request.id,
      request.service_type,  // Pass service type for conflict checking
      request.pie_status === 'Yes'  // Pass PIE status for stricter rules
    )
    
    // Evaluate business rules
    const ruleEvaluation = evaluateRules({
      ...request,
      client_name: client.client_name,
      client_type: client.client_type,
      pie_status: request.pie_status
    })

    // Combine duplicates and rule recommendations
    const allRecommendations = {
      duplicates: duplicates || [],
      ruleRecommendations: ruleEvaluation.recommendations || [],
      totalRulesEvaluated: ruleEvaluation.totalRulesEvaluated || 0,
      matchedRules: ruleEvaluation.matchedRules || 0
    }

    // Determine status based on recommendations
    // If rule recommends "block", route to Compliance (not auto-reject)
    // If rule recommends "flag", add to conflicts
    // If rule recommends "require_approval", ensure Compliance review
    let newStatus = 'Pending Compliance'
    const hasBlockRecommendation = ruleEvaluation.recommendations?.some(r => r.recommendedAction === 'block')
    const hasRequireApproval = ruleEvaluation.recommendations?.some(r => r.recommendedAction === 'require_approval')
    
    if (hasBlockRecommendation || hasRequireApproval) {
      newStatus = 'Pending Compliance'
    }
    
    // If team member, require director approval first (unless blocked by rules)
    if (user.role === 'Requester' && user.director_id && !hasBlockRecommendation) {
      newStatus = 'Pending Director Approval'
    }

    // Update status with all recommendations
    db.prepare('UPDATE coi_requests SET status = ?, duplication_matches = ? WHERE id = ?').run(
      newStatus,
      JSON.stringify(allRecommendations),
      req.params.id
    )

    res.json({ 
      success: true, 
      duplicates: duplicates || [],
      ruleRecommendations: ruleEvaluation.recommendations || [],
      requiresComplianceReview: hasBlockRecommendation || hasRequireApproval || duplicates?.some(d => d.action === 'block')
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function approveRequest(req, res) {
  try {
    const user = getUserById(req.userId)
    const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(req.params.id)
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    // Get approval type and restrictions from request body
    const { approval_type, restrictions, comments } = req.body
    const approvalStatus = approval_type || 'Approved' // 'Approved', 'Approved with Restrictions'

    let updateField = ''
    let nextStatus = ''
    let dateField, byField, notesField, restrictionsField

    if (user.role === 'Director' && request.status === 'Pending Director Approval') {
      updateField = 'director_approval_status'
      dateField = 'director_approval_date'
      byField = 'director_approval_by'
      notesField = 'director_approval_notes'
      restrictionsField = 'director_restrictions'
      nextStatus = 'Pending Compliance'
    } else if (user.role === 'Compliance' && request.status === 'Pending Compliance') {
      updateField = 'compliance_review_status'
      dateField = 'compliance_review_date'
      byField = 'compliance_reviewed_by'
      notesField = 'compliance_review_notes'
      restrictionsField = 'compliance_restrictions'
      nextStatus = 'Pending Partner'
    } else if (user.role === 'Partner' && request.status === 'Pending Partner') {
      updateField = 'partner_approval_status'
      dateField = 'partner_approval_date'
      byField = 'partner_approved_by'
      notesField = 'partner_approval_notes'
      restrictionsField = 'partner_restrictions'
      nextStatus = 'Pending Finance'
    } else {
      return res.status(400).json({ error: 'Invalid approval action' })
    }

    db.prepare(`
      UPDATE coi_requests 
      SET ${updateField} = ?, 
          ${dateField} = CURRENT_TIMESTAMP,
          ${byField} = ?,
          ${notesField} = ?,
          ${restrictionsField} = ?,
          status = ?
      WHERE id = ?
    `).run(approvalStatus, user.id, comments || null, restrictions || null, nextStatus, req.params.id)

    // Send notification to next approver
    const roleMapping = {
      'Pending Compliance': 'Compliance',
      'Pending Partner': 'Partner',
      'Pending Finance': 'Finance'
    }
    const nextRole = roleMapping[nextStatus]
    if (nextRole) {
      sendApprovalNotification(req.params.id, user.name, nextRole, approvalStatus === 'Approved with Restrictions' ? restrictions : null)
    }

    res.json({ success: true, approval_status: approvalStatus })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Request more information (enhanced version)
export async function requestMoreInfo(req, res) {
  try {
    const user = getUserById(req.userId)
    const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(req.params.id)
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    const { info_required, comments } = req.body
    
    let updateField, notesField
    
    if (user.role === 'Director' && request.status === 'Pending Director Approval') {
      updateField = 'director_approval_status'
      notesField = 'director_approval_notes'
    } else if (user.role === 'Compliance' && request.status === 'Pending Compliance') {
      updateField = 'compliance_review_status'
      notesField = 'compliance_review_notes'
    } else if (user.role === 'Partner' && request.status === 'Pending Partner') {
      updateField = 'partner_approval_status'
      notesField = 'partner_approval_notes'
    } else {
      return res.status(400).json({ error: 'Invalid action for current status' })
    }

    // Set status back to allow requester to update
    db.prepare(`
      UPDATE coi_requests 
      SET ${updateField} = 'Need More Info',
          ${notesField} = ?,
          status = 'Draft',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(`${comments || ''}\n\nInfo Required: ${info_required || 'Please provide more details.'}`, req.params.id)

    // TODO: Send notification to requester asking for more info

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function rejectRequest(req, res) {
  try {
    const user = getUserById(req.userId)
    const { reason } = req.body

    db.prepare(`
      UPDATE coi_requests 
      SET status = 'Rejected',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id)
    
    // Send rejection notification
    sendRejectionNotification(req.params.id, user.name, reason || 'No reason provided')
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function requestInfo(req, res) {
  try {
    const user = getUserById(req.userId)
    const { info_request } = req.body

    db.prepare(`
      UPDATE coi_requests 
      SET compliance_review_status = 'Request Info',
          compliance_review_notes = ?,
          status = 'Draft'
      WHERE id = ?
    `).run(info_request, req.params.id)

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function generateEngagementCode(req, res) {
  try {
    const user = getUserById(req.userId)
    const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(req.params.id)
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    const { financial_parameters } = req.body
    const code = await generateCode(request.service_type, request.id, user.id, financial_parameters)

    db.prepare(`
      UPDATE coi_requests 
      SET engagement_code = ?,
          finance_code_status = 'Generated',
          financial_parameters = ?,
          status = 'Approved'
      WHERE id = ?
    `).run(code, JSON.stringify(financial_parameters), req.params.id)

    // Send notification about engagement code
    sendEngagementCodeNotification(req.params.id, code)

    res.json({ engagement_code: code })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function executeProposal(req, res) {
  try {
    const { execution_date } = req.body
    const executionDate = execution_date || new Date().toISOString()
    
    const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(req.params.id)
    const projectId = `PROJ-${new Date().getFullYear()}-${String(request.id).padStart(4, '0')}`
    
    db.prepare(`
      UPDATE coi_requests 
      SET execution_date = ?,
          proposal_sent_date = ?,
          status = 'Active',
          stage = 'Engagement',
          days_in_monitoring = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(executionDate, executionDate, req.params.id)
    
    // Update monitoring days after execution
    updateMonitoringDays()
    
    // Send notification about proposal execution
    sendProposalExecutedNotification(req.params.id, projectId)

    res.json({ success: true, projectId })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function getDashboardData(req, res) {
  try {
    const user = getUserById(req.userId)
    const { role } = req.params

    const requests = getFilteredRequests(user, req.query)
    
    // Calculate stats based on role
    const stats = {
      total: requests.length,
      byStatus: {},
      byDepartment: {}
    }

    requests.forEach(req => {
      stats.byStatus[req.status] = (stats.byStatus[req.status] || 0) + 1
      stats.byDepartment[req.department] = (stats.byDepartment[req.department] || 0) + 1
    })

    res.json({ requests, stats })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function updateMonitoring(req, res) {
  try {
    const result = updateMonitoringDays()
    res.json({ success: true, ...result })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function getMonitoringAlerts(req, res) {
  try {
    const approaching = getApproachingLimitRequests(25)
    const exceeded = getExceededLimitRequests()
    res.json({ approaching, exceeded })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

function getUserById(userId) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
}

