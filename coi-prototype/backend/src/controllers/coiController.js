import { getDatabase } from '../database/init.js'
import { getFilteredRequests } from '../middleware/dataSegregation.js'
import { checkDuplication } from '../services/duplicationCheckService.js'
import { sendApprovalNotification, sendRejectionNotification, sendEngagementCodeNotification, sendProposalExecutedNotification } from '../services/notificationService.js'
import { notifyRequestSubmitted, notifyDirectorApprovalRequired, notifyComplianceReviewRequired } from '../services/emailService.js'
import { generateEngagementCode as generateCode } from '../services/engagementCodeService.js'
import { updateMonitoringDays, getApproachingLimitRequests, getExceededLimitRequests } from '../services/monitoringService.js'
import { evaluateRules } from '../services/businessRulesEngine.js'
import FieldMappingService from '../services/fieldMappingService.js'
import { parseRecommendations, logComplianceDecision } from '../services/auditTrailService.js'
import { getUserById } from '../utils/userUtils.js'

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
  try {
    const version = db.prepare('SELECT MAX(version_number) as max_version FROM form_versions').get()
    return version?.max_version || 1
  } catch (error) {
    // Table doesn't exist, return default version
    console.log('form_versions table not found, using default version 1')
    return 1
  }
}

function getFieldMappings() {
  const mappingMap = new Map()
  
  // Try to get mappings from form_field_mappings table, but handle if it doesn't exist
  try {
    const mappings = db.prepare('SELECT * FROM form_field_mappings').all()
    for (const mapping of mappings) {
      mappingMap.set(mapping.field_id, mapping)
    }
  } catch (error) {
    // Table doesn't exist, use standard mappings only
    console.log('form_field_mappings table not found, using standard mappings only')
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
    
    const directorApprovalBy = request.director_approval_by ? 
      db.prepare('SELECT name as director_approval_by_name FROM users WHERE id = ?').get(request.director_approval_by) : 
      null
    
    const partnerApprovalBy = request.partner_approved_by ? 
      db.prepare('SELECT name as partner_approved_by_name FROM users WHERE id = ?').get(request.partner_approved_by) : 
      null
    
    const signatories = db.prepare('SELECT * FROM coi_signatories WHERE coi_request_id = ?').all(request.id)
    
    // Merge data
    const response = {
      ...request,
      client_name: client?.client_name || null,
      client_code: client?.client_code || null,
      requester_name: requester?.requester_name || request.requestor_name || null,
      director_approval_by_name: directorApprovalBy?.director_approval_by_name || null,
      partner_approved_by_name: partnerApprovalBy?.partner_approved_by_name || null,
      signatories
    }
    
    // Exclude commercial data for Compliance role
    if (user.role === 'Compliance') {
      delete response.financial_parameters
      delete response.engagement_code
      // Note: total_fees may not be in request object, but if it exists, exclude it
      if (response.total_fees !== undefined) {
        delete response.total_fees
      }
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
    const count = (countResult && countResult.count !== undefined) ? countResult.count : 0
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
      standardData.client_id || data.client_id || null, 
      user.id, 
      user.department || null,
      standardData.requestor_name || user.name || '', 
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
      // Convert boolean to integer for SQLite
      (standardData.international_operations !== undefined 
        ? (standardData.international_operations === true || standardData.international_operations === 1 ? 1 : 0)
        : (data.international_operations === true || data.international_operations === 1 ? 1 : 0)), 
      standardData.foreign_subsidiaries || data.foreign_subsidiaries || '', 
      standardData.global_clearance_status || data.global_clearance_status || 'Not Required',
      Object.keys(customFields).length > 0 ? JSON.stringify(customFields) : null,
      formVersion || 1,
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
      request.pie_status === 'Yes',  // Pass PIE status for stricter rules
      request  // Pro: Pass full request data for Red Lines and IESBA Matrix
    )
    
    // Evaluate business rules
    // Use FieldMappingService to prepare request data with all computed fields
    const requestDataForRules = {
      ...request,
      client: client, // Include client object for field mapping
      client_name: client.client_name,
      client_type: client.client_type,
      client_country: client.country || null,
      client_industry: client.industry || null
    }
    const ruleEvaluation = evaluateRules(FieldMappingService.prepareForRuleEvaluation(requestDataForRules))

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
    
    // Directors skip their own approval, go directly to Compliance
    if (user.role === 'Director') {
      newStatus = 'Pending Compliance'
    } else if (user.role === 'Requester' && user.director_id && !hasBlockRecommendation) {
      // Team members require director approval first (unless blocked by rules)
      newStatus = 'Pending Director Approval'
    }
    // If hasBlockRecommendation or hasRequireApproval, status is already 'Pending Compliance' (set above)

    // Update status with all recommendations
    db.prepare('UPDATE coi_requests SET status = ?, duplication_matches = ? WHERE id = ?').run(
      newStatus,
      JSON.stringify(allRecommendations),
      req.params.id
    )

    // Send notifications based on next status
    try {
      const requestWithClient = {
        ...request,
        client_name: client.client_name
      }
      
      // Determine next approver for requester confirmation
      let nextApprover = null
      if (newStatus === 'Pending Director Approval' && user.director_id) {
        nextApprover = db.prepare('SELECT * FROM users WHERE id = ?').get(user.director_id)
      } else if (newStatus === 'Pending Compliance') {
        const complianceOfficers = db.prepare(`
          SELECT id, name, email FROM users 
          WHERE role = 'Compliance' AND is_active = 1
          ${request.department ? 'AND department = ?' : ''}
          LIMIT 1
        `).get(request.department || [])
        nextApprover = complianceOfficers
      }
      
      // Always send confirmation to requester
      const requester = getUserById(request.requester_id)
      if (requester && requester.email && nextApprover) {
        await notifyRequestSubmitted(requestWithClient, requester, nextApprover)
      }
      
      // Notify Director if status is 'Pending Director Approval'
      if (newStatus === 'Pending Director Approval' && user.director_id) {
        const director = db.prepare('SELECT * FROM users WHERE id = ?').get(user.director_id)
        if (director && director.email) {
          await notifyDirectorApprovalRequired(requestWithClient, director)
        }
      }
      
      // Notify Compliance if status is 'Pending Compliance'
      if (newStatus === 'Pending Compliance') {
        const complianceOfficers = db.prepare(`
          SELECT id, name, email FROM users 
          WHERE role = 'Compliance' AND is_active = 1
          ${request.department ? 'AND department = ?' : ''}
        `).all(request.department || [])
        
        if (complianceOfficers.length > 0) {
          const conflicts = ruleEvaluation.recommendations?.filter(r => 
            r.recommendedAction === 'block' || r.recommendedAction === 'require_approval'
          ) || []
          
          await notifyComplianceReviewRequired(
            requestWithClient,
            complianceOfficers,
            conflicts,
            duplicates || []
          )
        }
      }
    } catch (notificationError) {
      // Log but don't fail the request submission
      console.error('Error sending submission notifications:', notificationError)
    }

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
      
      // Enhanced audit trail for Compliance decisions
      const recommendations = parseRecommendations(request)
      const { acceptedRecommendations = [], rejectedRecommendations = [], overriddenRecommendations = [] } = req.body
      
      logComplianceDecision({
        requestId: req.params.id,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        decision: approvalStatus,
        recommendations: recommendations,
        acceptedRecommendations: acceptedRecommendations,
        rejectedRecommendations: rejectedRecommendations,
        overriddenRecommendations: overriddenRecommendations,
        justification: comments,
        approvalLevel: approvalStatus === 'Approved with Restrictions' ? 'Compliance' : 'Compliance',
        restrictions: restrictions,
        notes: comments
      })
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

    // Build UPDATE statement conditionally based on whether restrictions column exists
    // Check if restrictions column exists for this role
    let updateQuery
    let updateParams
    
    try {
      // Try to check if restrictions column exists by querying table info
      const tableInfo = db.prepare(`PRAGMA table_info(coi_requests)`).all()
      const hasRestrictionsColumn = tableInfo.some(col => col.name === restrictionsField)
      
      if (hasRestrictionsColumn && restrictionsField) {
        updateQuery = `
          UPDATE coi_requests 
          SET ${updateField} = ?, 
              ${dateField} = CURRENT_TIMESTAMP,
              ${byField} = ?,
              ${notesField} = ?,
              ${restrictionsField} = ?,
              status = ?
          WHERE id = ?
        `
        updateParams = [approvalStatus, user.id, comments || null, restrictions || null, nextStatus, req.params.id]
      } else {
        // Restrictions column doesn't exist, update without it
        updateQuery = `
          UPDATE coi_requests 
          SET ${updateField} = ?, 
              ${dateField} = CURRENT_TIMESTAMP,
              ${byField} = ?,
              ${notesField} = ?,
              status = ?
          WHERE id = ?
        `
        updateParams = [approvalStatus, user.id, comments || null, nextStatus, req.params.id]
        // Store restrictions in notes if restrictions column doesn't exist
        if (restrictions) {
          const existingNotes = db.prepare(`SELECT ${notesField} FROM coi_requests WHERE id = ?`).get(req.params.id)
          const combinedNotes = existingNotes?.[notesField] 
            ? `${existingNotes[notesField]}\n\nRestrictions: ${restrictions}`
            : `Restrictions: ${restrictions}`
          updateParams[2] = combinedNotes
        }
      }
      
      db.prepare(updateQuery).run(...updateParams)
    } catch (error) {
      // Fallback: try without restrictions column
      console.log(`Column ${restrictionsField} not found, updating without restrictions`)
      updateQuery = `
        UPDATE coi_requests 
        SET ${updateField} = ?, 
            ${dateField} = CURRENT_TIMESTAMP,
            ${byField} = ?,
            ${notesField} = ?,
            status = ?
        WHERE id = ?
      `
      updateParams = [approvalStatus, user.id, comments || null, nextStatus, req.params.id]
      if (restrictions) {
        const existingNotes = db.prepare(`SELECT ${notesField} FROM coi_requests WHERE id = ?`).get(req.params.id)
        const combinedNotes = existingNotes?.[notesField] 
          ? `${existingNotes[notesField]}\n\nRestrictions: ${restrictions}`
          : `Restrictions: ${restrictions}`
        updateParams[2] = combinedNotes
      }
      db.prepare(updateQuery).run(...updateParams)
    }

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
    const { reason, recommendations = [], rejection_type = 'fixable' } = req.body
    const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(req.params.id)

    // Validate rejection_type
    const validRejectionTypes = ['fixable', 'permanent']
    const finalRejectionType = validRejectionTypes.includes(rejection_type) ? rejection_type : 'fixable'

    db.prepare(`
      UPDATE coi_requests 
      SET status = 'Rejected',
          rejection_reason = ?,
          rejection_type = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reason || 'No reason provided', finalRejectionType, req.params.id)
    
    // Enhanced audit trail for Compliance rejections
    if (user.role === 'Compliance') {
      const allRecommendations = parseRecommendations(request)
      const { rejectedRecommendations = [] } = req.body
      
      logComplianceDecision({
        requestId: req.params.id,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        decision: 'Rejected',
        recommendations: allRecommendations,
        rejectedRecommendations: rejectedRecommendations.length > 0 ? rejectedRecommendations : allRecommendations,
        justification: reason,
        approvalLevel: 'Compliance',
        notes: reason
      })
    }
    
    // Send rejection notification with rejection type
    sendRejectionNotification(req.params.id, user.name, reason || 'No reason provided', finalRejectionType)
    
    res.json({ success: true, rejection_type: finalRejectionType })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Resubmit a rejected request (fixable rejections only)
export async function resubmitRejectedRequest(req, res) {
  try {
    const user = getUserById(req.userId)
    const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(req.params.id)
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }
    
    // Check if request is in Rejected status
    if (request.status !== 'Rejected') {
      return res.status(400).json({ error: 'Only rejected requests can be resubmitted.' })
    }
    
    // Check if user is the requester (use String() to handle type mismatches)
    if (String(request.requester_id) !== String(user.id)) {
      return res.status(403).json({ error: 'Only the requester can resubmit this request.' })
    }
    
    // Check rejection type - allow resubmission only for fixable rejections (or null/undefined for backward compatibility)
    if (request.rejection_type === 'permanent') {
      return res.status(400).json({ 
        error: 'This request was permanently rejected and cannot be resubmitted. Please create a new request if circumstances have changed.' 
      })
    }
    
    // Convert to Draft and reset approval statuses
    db.prepare(`
      UPDATE coi_requests 
      SET status = 'Draft',
          director_approval_status = NULL,
          director_approval_by = NULL,
          director_approval_date = NULL,
          director_approval_notes = NULL,
          compliance_review_status = NULL,
          compliance_reviewed_by = NULL,
          compliance_review_date = NULL,
          compliance_review_notes = NULL,
          partner_approval_status = NULL,
          partner_approved_by = NULL,
          partner_approval_date = NULL,
          partner_approval_notes = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id)
    
    res.json({ 
      success: true, 
      message: 'Request converted to draft. You can now edit and resubmit.',
      new_status: 'Draft'
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Delete a draft request (only drafts can be deleted)
export async function deleteRequest(req, res) {
  try {
    const user = getUserById(req.userId)
    const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(req.params.id)
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }
    
    // Only allow deletion of Draft requests
    if (request.status !== 'Draft') {
      return res.status(400).json({ 
        error: 'Only draft requests can be deleted. Submitted requests cannot be deleted.' 
      })
    }
    
    // Check if user is the requester or an admin
    const isRequester = String(request.requester_id) === String(user.id)
    const isAdmin = ['Admin', 'Super Admin'].includes(user.role)
    
    if (!isRequester && !isAdmin) {
      return res.status(403).json({ error: 'Access denied. Only the requester or an admin can delete this request.' })
    }
    
    // Delete related data first (cascade delete) - must delete in order to satisfy foreign key constraints
    const fs = await import('fs')
    
    // 1. Delete attachments and their files
    const attachments = db.prepare('SELECT * FROM coi_attachments WHERE coi_request_id = ?').all(req.params.id)
    attachments.forEach(attachment => {
      if (attachment.file_path && fs.default.existsSync(attachment.file_path)) {
        try {
          fs.default.unlinkSync(attachment.file_path)
        } catch (err) {
          console.error(`Error deleting attachment file: ${err.message}`)
        }
      }
    })
    db.prepare('DELETE FROM coi_attachments WHERE coi_request_id = ?').run(req.params.id)
    
    // 2. Delete uploaded files (ISQM forms, etc.) and their files
    const uploadedFiles = db.prepare('SELECT * FROM uploaded_files WHERE request_id = ?').all(req.params.id)
    uploadedFiles.forEach(file => {
      if (file.file_path && fs.default.existsSync(file.file_path)) {
        try {
          fs.default.unlinkSync(file.file_path)
        } catch (err) {
          console.error(`Error deleting uploaded file: ${err.message}`)
        }
      }
    })
    db.prepare('DELETE FROM uploaded_files WHERE request_id = ?').run(req.params.id)
    
    // 3. Delete signatories
    db.prepare('DELETE FROM coi_signatories WHERE coi_request_id = ?').run(req.params.id)
    
    // 4. Delete ISQM forms
    db.prepare('DELETE FROM isqm_forms WHERE coi_request_id = ?').run(req.params.id)
    
    // 5. Delete global COI submissions
    db.prepare('DELETE FROM global_coi_submissions WHERE coi_request_id = ?').run(req.params.id)
    
    // 6. Delete engagement renewals (if any exist for this draft)
    db.prepare('DELETE FROM engagement_renewals WHERE coi_request_id = ?').run(req.params.id)
    
    // 7. Delete monitoring alerts
    db.prepare('DELETE FROM monitoring_alerts WHERE coi_request_id = ?').run(req.params.id)
    
    // 8. Delete execution tracking (if any)
    try {
      db.prepare('DELETE FROM execution_tracking WHERE coi_request_id = ?').run(req.params.id)
    } catch (err) {
      // Table might not exist, ignore
    }
    
    // 9. Finally, delete the request itself
    const result = db.prepare('DELETE FROM coi_requests WHERE id = ?').run(req.params.id)
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Request not found' })
    }
    
    res.json({ 
      success: true, 
      message: 'Draft request deleted successfully',
      request_id: request.request_id
    })
  } catch (error) {
    console.error('Error deleting request:', error)
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

    // Validation: Check if engagement code already exists
    if (request.engagement_code) {
      return res.status(400).json({ 
        error: 'Engagement code already generated for this request',
        existing_code: request.engagement_code
      })
    }

    // Validation: Check request status is valid for code generation
    // Finance can generate code when request is in "Pending Finance" status
    const validStatuses = ['Pending Finance', 'Approved']
    if (!validStatuses.includes(request.status)) {
      // If not in valid status, require explicit partner approval
      if (!request.partner_approved_by || request.partner_approval_status !== 'Approved') {
        return res.status(400).json({ 
          error: 'Partner approval is required before generating engagement code. Request must be approved by Partner first.'
        })
      }
      return res.status(400).json({ 
        error: `Cannot generate code for request with status: ${request.status}. Request must be in "Pending Finance" or "Approved" status.`
      })
    }

    // Validation: Check service type exists
    if (!request.service_type) {
      return res.status(400).json({ 
        error: 'Service type is required to generate engagement code'
      })
    }

    // Validation: Check financial parameters are provided
    const { financial_parameters } = req.body
    if (!financial_parameters) {
      return res.status(400).json({ 
        error: 'Financial parameters are required'
      })
    }

    // Validate required financial parameters
    if (!financial_parameters.credit_terms || !financial_parameters.currency || !financial_parameters.risk_assessment) {
      return res.status(400).json({ 
        error: 'Missing required financial parameters: credit_terms, currency, and risk_assessment are required'
      })
    }

    // Generate engagement code
    const code = await generateCode(request.service_type, request.id, user.id, financial_parameters)

    // Update request with engagement code and financial parameters
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

    res.json({ 
      success: true,
      engagement_code: code,
      message: 'Engagement code generated successfully'
    })
  } catch (error) {
    console.error('[generateEngagementCode] Error:', error)
    
    // Provide more specific error messages
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ 
        error: 'Engagement code already exists. Please try again or contact support.'
      })
    }
    
    if (error.message.includes('no such table')) {
      return res.status(500).json({ 
        error: 'Database error: Engagement codes table not found. Please contact support.'
      })
    }

    res.status(500).json({ 
      error: error.message || 'Failed to generate engagement code. Please try again or contact support.'
    })
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
          status = 'Approved',
          stage = 'Proposal',
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

/**
 * Re-evaluate a stale request against current rules
 * Clears the stale flag and updates compliance checks
 */
export async function reEvaluateRequest(req, res) {
  try {
    const { id } = req.params
    const userId = req.userId
    
    // Get the request
    const request = db.prepare(`
      SELECT r.*, c.client_name, c.client_code
      FROM coi_requests r
      LEFT JOIN clients c ON r.client_id = c.id
      WHERE r.id = ?
    `).get(id)
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }
    
    if (!request.requires_re_evaluation) {
      return res.status(400).json({ 
        error: 'Request does not require re-evaluation',
        message: 'This request is already up to date with current rules'
      })
    }
    
    // Run the rules engine
    const requestData = {
      id: request.id,
      client_id: request.client_id,
      client_name: request.client_name,
      service_type: request.service_type,
      service_description: request.service_description,
      department: request.department,
      pie_status: request.pie_status,
      international_operations: request.international_operations
    }
    
    const ruleResults = evaluateRules(requestData)
    
    // Format compliance checks
    const complianceChecks = []
    const recommendations = ruleResults.recommendations || ruleResults.actions || []
    
    for (const result of recommendations) {
      complianceChecks.push({
        rule: result.ruleName || result.rule_name || 'Unknown Rule',
        rule_id: result.ruleId || result.rule_id,
        status: result.action === 'block' || result.recommendedAction === 'REJECT' ? 'failed' : 
                result.action === 'flag' || result.recommendedAction === 'FLAG' ? 'warning' : 'passed',
        is_outdated: false,
        checked_at: new Date().toISOString()
      })
    }
    
    // Add a general check result if no specific rules matched
    if (complianceChecks.length === 0) {
      complianceChecks.push({
        rule: 'General Compliance Check',
        status: 'passed',
        is_outdated: false,
        checked_at: new Date().toISOString()
      })
    }
    
    // Update the request
    db.prepare(`
      UPDATE coi_requests 
      SET requires_re_evaluation = 0, 
          stale_reason = NULL,
          compliance_checks = ?,
          last_rule_check_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(complianceChecks), id)
    
    // Log the re-evaluation
    console.log(`Request ${id} re-evaluated by user ${userId}. ${complianceChecks.length} checks performed.`)
    
    res.json({ 
      success: true, 
      message: 'Request re-evaluated successfully',
      complianceChecks,
      ruleResults: {
        totalRulesEvaluated: ruleResults.totalRulesEvaluated || 0,
        matchedRules: ruleResults.matchedRules || 0
      }
    })
  } catch (error) {
    console.error('Error re-evaluating request:', error)
    res.status(500).json({ error: error.message })
  }
}

// getUserById now imported from utils/userUtils.js

