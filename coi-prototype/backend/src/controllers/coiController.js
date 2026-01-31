import { getDatabase } from '../database/init.js'
import { getFilteredRequests } from '../middleware/dataSegregation.js'
import { checkDuplication, checkGroupConflicts, checkInternationalOperationsConflicts } from '../services/duplicationCheckService.js'
import { sendApprovalNotification, sendRejectionNotification, sendEngagementCodeNotification, sendProposalExecutedNotification, sendNeedMoreInfoNotification, sendEmail } from '../services/notificationService.js'
import { notifyRequestSubmitted, notifyDirectorApprovalRequired, notifyComplianceReviewRequired, notifyGroupConflictFlagged } from '../services/emailService.js'
import { generateEngagementCode as generateCode } from '../services/engagementCodeService.js'
import { updateMonitoringDays, getApproachingLimitRequests, getExceededLimitRequests } from '../services/monitoringService.js'
import { evaluateRules } from '../services/businessRulesEngine.js'
import FieldMappingService from '../services/fieldMappingService.js'
import { parseRecommendations, logComplianceDecision } from '../services/auditTrailService.js'
import { getUserById } from '../utils/userUtils.js'
import { validateGroupStructure, GroupStructureValidationError } from '../validators/groupStructureValidator.js'
import { validateCompanyRelationship, CompanyRelationshipValidationError } from '../validators/companyRelationshipValidator.js'
import { isClientParentTBDOrEmpty } from './parentCompanyUpdateController.js'
import { eventBus, EVENT_TYPES } from '../services/eventBus.js'
import { logFunnelEvent, logStatusChange, FUNNEL_STAGES } from '../services/funnelTrackingService.js'

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
  'company_type': 'company_type',
  'parent_company_id': 'parent_company_id',
  'ownership_percentage': 'ownership_percentage',
  'control_type': 'control_type',
  'service_type': 'service_type',
  'service_category': 'service_category',
  'global_service_category': 'global_service_category',
  'global_service_type': 'global_service_type',
  'service_description': 'service_description',
  'requested_service_period_start': 'requested_service_period_start',
  'requested_service_period_end': 'requested_service_period_end',
  'full_ownership_structure': 'full_ownership_structure',
  'related_affiliated_entities': 'related_affiliated_entities',
  'international_operations': 'international_operations',
  'foreign_subsidiaries': 'foreign_subsidiaries',
  'global_clearance_status': 'global_clearance_status',
  'backup_approver_id': 'backup_approver_id'
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
    
    // Data segregation: Remove commercial data (costs/fees) for Compliance role
    // Meeting Requirement 2026-01-12: All services (excluding costs/fees) should be visible to Compliance team
    if (user.role === 'Compliance') {
      // Remove financial parameters (costs/fees) but keep all service information
      delete response.financial_parameters
      // Note: All service information (service_type, service_description, service_category, etc.) remains visible
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

    // Generate request ID - use MAX to avoid duplicates
    const year = new Date().getFullYear()
    const maxResult = db.prepare(`
      SELECT MAX(CAST(SUBSTR(request_id, 10) AS INTEGER)) as max_num 
      FROM coi_requests 
      WHERE request_id LIKE ?
    `).get(`COI-${year}-%`)
    const maxNum = maxResult?.max_num || 0
    const requestId = `COI-${year}-${String(maxNum + 1).padStart(3, '0')}`

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

    // Validate company relationship if company type is provided
    if (standardData.company_type || data.company_type) {
      try {
        validateCompanyRelationship({
          company_type: standardData.company_type || data.company_type || null,
          parent_company_id: standardData.parent_company_id || data.parent_company_id || null,
          parent_company: standardData.parent_company || data.parent_company || null,
          ownership_percentage: standardData.ownership_percentage !== undefined ? standardData.ownership_percentage : (data.ownership_percentage !== undefined ? data.ownership_percentage : null),
          control_type: standardData.control_type || data.control_type || null,
          group_structure: standardData.group_structure || data.group_structure || null
        })
      } catch (validationError) {
        if (validationError instanceof CompanyRelationshipValidationError) {
          return res.status(400).json({ 
            error: validationError.message,
            field: validationError.field 
          })
        }
        throw validationError
      }
    }

    // Resolve parent_company_id from parent_company name if needed
    let resolvedParentCompanyId = standardData.parent_company_id || data.parent_company_id || null
    if (!resolvedParentCompanyId && (standardData.parent_company || data.parent_company)) {
      const parentName = standardData.parent_company || data.parent_company
      const parentClient = db.prepare('SELECT id FROM clients WHERE client_name = ?').get(parentName)
      if (parentClient) {
        resolvedParentCompanyId = parentClient.id
      }
    }

    const result = db.prepare(`
      INSERT INTO coi_requests (
        request_id, client_id, requester_id, department,
        requestor_name, designation, entity, line_of_service,
        requested_document, language,
        parent_company, parent_company_id, company_type, ownership_percentage, control_type,
        client_location, relationship_with_client, client_type, client_status,
        service_type, service_category, global_service_category, global_service_type, service_description, requested_service_period_start, requested_service_period_end,
        full_ownership_structure, pie_status, related_affiliated_entities,
        international_operations, foreign_subsidiaries, global_clearance_status,
        custom_fields, form_version, group_structure, backup_approver_id,
        status, stage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      resolvedParentCompanyId,
      standardData.company_type || data.company_type || null,
      standardData.ownership_percentage !== undefined ? standardData.ownership_percentage : (data.ownership_percentage !== undefined ? data.ownership_percentage : null),
      standardData.control_type || data.control_type || null,
      standardData.client_location || data.client_location || '', 
      standardData.relationship_with_client || data.relationship_with_client || '', 
      standardData.client_type || data.client_type || '',
      standardData.client_status || data.client_status || '',
      standardData.service_type || data.service_type || '',
      standardData.service_category || data.service_category || '',
      standardData.global_service_category || data.global_service_category || '',
      standardData.global_service_type || data.global_service_type || '',
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
      standardData.group_structure || data.group_structure || null,
      standardData.backup_approver_id || data.backup_approver_id || null,
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

    // Parent company bidirectional sync: if existing BDO client and parent set and PRMS has TBD/empty, create update request for PRMS admin
    const clientId = standardData.client_id || data.client_id
    const parentCompany = (standardData.parent_company || data.parent_company || '').trim()
    if (clientId && parentCompany && isClientParentTBDOrEmpty(clientId)) {
      const client = db.prepare('SELECT client_code FROM clients WHERE id = ?').get(clientId)
      if (client) {
        try {
          db.prepare(`
            INSERT INTO parent_company_update_requests (
              client_id, client_code, requested_parent_company, source, status, coi_request_id, requested_by, requested_at, updated_at
            ) VALUES (?, ?, ?, 'COI', 'Pending', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).run(clientId, client.client_code, parentCompany, result.lastInsertRowid, user.id)
        } catch (err) {
          console.warn('[Parent company update request] Could not create:', err.message)
        }
      }
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

/**
 * Get approvers for backup selection (Section 6)
 * Returns Directors, Compliance, Partners, Finance for dropdown
 */
export async function getApproversForBackup(req, res) {
  try {
    const approvers = db.prepare(`
      SELECT id, name, email, role, department
      FROM users
      WHERE role IN ('Director', 'Compliance', 'Partner', 'Finance')
      AND COALESCE(active, 1) = 1
      ORDER BY role, name
    `).all()
    res.json(approvers)
  } catch (error) {
    console.error('Error fetching approvers for backup:', error)
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

    // ========================================
    // FLOOD PREVENTION: Check if user already has pending request for this client
    // ========================================
    const existingPending = db.prepare(`
      SELECT id, request_id FROM coi_requests 
      WHERE requester_id = ? 
      AND client_id = ?
      AND status IN ('Draft', 'Pending Director Approval', 'Pending Compliance', 'Pending Partner', 'Pending Finance')
      AND id != ?
    `).get(user.id, request.client_id, req.params.id)

    if (existingPending) {
      return res.status(400).json({
        error: 'You already have a pending request for this client. Please complete or withdraw that request first.',
        existing_request_id: existingPending.id,
        existing_request_code: existingPending.request_id
      })
    }

    // ========================================
    // GROUP STRUCTURE VALIDATION (IESBA 290.13)
    // ========================================
    try {
      const validatedData = validateGroupStructure(request)
      // Update request with any modifications (e.g., requires_compliance_verification flag)
      if (validatedData.requires_compliance_verification) {
        db.prepare(`
          UPDATE coi_requests SET requires_compliance_verification = 1 WHERE id = ?
        `).run(req.params.id)
      }
    } catch (validationError) {
      if (validationError instanceof GroupStructureValidationError) {
        return res.status(400).json({
          error: validationError.message,
          field: validationError.field,
          code: validationError.code,
          requiresGroupStructure: true
        })
      }
      throw validationError
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
    
    // ========================================
    // DUPLICATE BLOCKING WITH JUSTIFICATION
    // ========================================
    // If critical duplicates found and no justification provided, block submission
    const { duplicate_justification } = req.body || {}
    const criticalDuplicates = duplicates?.filter(d => d.action === 'block') || []
    
    if (criticalDuplicates.length > 0 && !duplicate_justification) {
      return res.status(400).json({
        error: 'Critical duplicate detected. Justification required to proceed.',
        requiresJustification: true,
        duplicates: criticalDuplicates,
        message: 'A proposal or engagement already exists for this client/service. Please provide a business justification explaining why this submission should proceed.'
      })
    }
    
    // If justification provided, save it to the request
    if (duplicate_justification) {
      db.prepare(`
        UPDATE coi_requests 
        SET duplicate_justification = ?,
            duplicate_override_by = ?,
            duplicate_override_date = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(duplicate_justification, user.id, req.params.id)
      
      console.log(`[Duplicate Override] Request ${request.request_id} - User ${user.name} provided justification: "${duplicate_justification.substring(0, 100)}..."`)
    }
    
    // ========================================
    // GROUP CONFLICT DETECTION (IESBA 290.13)
    // ========================================
    // Check for multi-level group conflicts (parent, subsidiary, sister companies)
    let groupConflicts = { conflicts: [], warnings: [] }
    let hasGroupConflicts = false
    
    if (request.parent_company) {
      try {
        groupConflicts = await checkGroupConflicts(req.params.id)
        hasGroupConflicts = groupConflicts.conflicts && groupConflicts.conflicts.length > 0
        
        if (hasGroupConflicts) {
          const criticalConflicts = groupConflicts.conflicts.filter(c => c.severity === 'CRITICAL')
          
          if (criticalConflicts.length > 0) {
            // Store conflicts in database for Compliance review
            db.prepare(`
              UPDATE coi_requests 
              SET group_conflicts_detected = ?,
                  requires_compliance_verification = 1
              WHERE id = ?
            `).run(
              JSON.stringify(criticalConflicts),
              req.params.id
            )
            
            console.log(`[Group Conflict] Request ${request.request_id} - ${criticalConflicts.length} critical group conflict(s) detected`)
            
            // Notify ALL Compliance officers about the flagged conflicts
            const complianceOfficers = db.prepare(`
              SELECT id, name, email FROM users 
              WHERE role = 'Compliance' AND is_active = 1
            `).all()
            
            if (complianceOfficers.length > 0) {
              await notifyGroupConflictFlagged(
                { ...request, client_name: client.client_name },
                complianceOfficers,
                criticalConflicts
              )
            }
          }
        }
      } catch (groupConflictError) {
        // Log but don't block submission if conflict detection fails
        console.error(`[Group Conflict] Error checking group conflicts for request ${request.request_id}:`, groupConflictError)
      }
    }
    
    // ========================================
    // INTERNATIONAL OPERATIONS CONFLICT DETECTION (IESBA 290.13)
    // ========================================
    // Check for conflicts in International Operations entities
    let internationalOpsConflicts = { conflicts: [], warnings: [] }
    let hasInternationalOpsConflicts = false
    
    if (request.international_operations && request.global_coi_form_data) {
      try {
        internationalOpsConflicts = await checkInternationalOperationsConflicts(req.params.id)
        hasInternationalOpsConflicts = internationalOpsConflicts.conflicts && internationalOpsConflicts.conflicts.length > 0
        
        if (hasInternationalOpsConflicts) {
          // Merge with main group conflicts
          groupConflicts.conflicts = [...(groupConflicts.conflicts || []), ...(internationalOpsConflicts.conflicts || [])]
          groupConflicts.warnings = [...(groupConflicts.warnings || []), ...(internationalOpsConflicts.warnings || [])]
          
          const criticalConflicts = internationalOpsConflicts.conflicts.filter(c => c.severity === 'CRITICAL')
          
          if (criticalConflicts.length > 0) {
            // Update stored conflicts to include International Operations conflicts
            const allCriticalConflicts = [
              ...(groupConflicts.conflicts.filter(c => c.severity === 'CRITICAL') || []),
              ...criticalConflicts
            ]
            
            db.prepare(`
              UPDATE coi_requests 
              SET group_conflicts_detected = ?,
                  requires_compliance_verification = 1
              WHERE id = ?
            `).run(
              JSON.stringify(allCriticalConflicts),
              req.params.id
            )
            
            console.log(`[International Operations Conflict] Request ${request.request_id} - ${criticalConflicts.length} critical International Operations conflict(s) detected`)
            
            // Notify Compliance officers about International Operations conflicts
            const complianceOfficers = db.prepare(`
              SELECT id, name, email FROM users 
              WHERE role = 'Compliance' AND is_active = 1
            `).all()
            
            if (complianceOfficers.length > 0) {
              await notifyGroupConflictFlagged(
                { ...request, client_name: client.client_name },
                complianceOfficers,
                criticalConflicts
              )
            }
          }
        }
      } catch (internationalOpsConflictError) {
        // Log but don't block submission if conflict detection fails
        console.error(`[International Operations Conflict] Error checking International Operations conflicts for request ${request.request_id}:`, internationalOpsConflictError)
      }
    }
    
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

    // Combine duplicates, group conflicts, and rule recommendations
    const allRecommendations = {
      duplicates: duplicates || [],
      groupConflicts: groupConflicts.conflicts || [],
      ruleRecommendations: ruleEvaluation.recommendations || [],
      totalRulesEvaluated: ruleEvaluation.totalRulesEvaluated || 0,
      matchedRules: ruleEvaluation.matchedRules || 0
    }

    // Determine status based on recommendations
    // If rule recommends "block", route to Compliance (not auto-reject)
    // If rule recommends "flag", add to conflicts
    // If rule recommends "require_approval", ensure Compliance review
    // If group conflicts detected, ensure Compliance review
    let newStatus = 'Pending Compliance'
    const hasBlockRecommendation = ruleEvaluation.recommendations?.some(r => r.recommendedAction === 'block')
    const hasRequireApproval = ruleEvaluation.recommendations?.some(r => r.recommendedAction === 'require_approval')
    const hasCriticalGroupConflicts = hasGroupConflicts && groupConflicts.conflicts.some(c => c.severity === 'CRITICAL')
    
    // Directors skip their own approval, go directly to Compliance
    if (user.role === 'Director') {
      newStatus = 'Pending Compliance'
    } else if (user.role === 'Requester' && user.director_id && !hasBlockRecommendation && !hasCriticalGroupConflicts) {
      // Team members require director approval first (unless blocked by rules or group conflicts)
      newStatus = 'Pending Director Approval'
    }
    // If hasBlockRecommendation, hasRequireApproval, or hasCriticalGroupConflicts, status is already 'Pending Compliance' (set above)

    // ========================================
    // PROSPECT TAGGING (Requirement 3)
    // ========================================
    // Business Rule: ALL proposals are prospects (regardless of client existence in PRMS)
    // If engagement_type is 'Proposal', tag as prospect and check PRMS for client linkage
    let isProspect = false
    let prmsClientId = null
    
    if (request.requested_document === 'Proposal' || request.engagement_type === 'Proposal') {
      isProspect = true
      
      // Check if client exists in PRMS (for group-level services linkage)
      // Use client_code to check against PRMS
      if (client.client_code) {
        try {
          // Mock PRMS check: Check if client exists in our clients table with a code
          const prmsClient = db.prepare('SELECT id, client_code FROM clients WHERE client_code = ?').get(client.client_code)
          if (prmsClient) {
            prmsClientId = prmsClient.client_code
            console.log(`[Prospect] Request ${request.request_id} - Prospect linked to existing PRMS client: ${prmsClientId}`)
          } else {
            console.log(`[Prospect] Request ${request.request_id} - Prospect is standalone (no PRMS match)`)
          }
        } catch (error) {
          console.error('Error checking PRMS client:', error)
          // If PRMS check fails, continue without linking (standalone prospect)
        }
      }
    }

    // ========================================
    // LEAD SOURCE ATTRIBUTION (CRM Feature)
    // ========================================
    // For proposals, capture lead source (first-touch, immutable)
    // Only set if not already set (immutable first-touch principle)
    let leadSourceId = request.lead_source_id // Keep existing if set
    
    if (isProspect && !leadSourceId) {
      const { lead_source_id: providedLeadSource } = req.body || {}
      
      if (providedLeadSource) {
        // Use provided lead source
        leadSourceId = providedLeadSource
      } else {
        // Auto-detect based on user role
        if (['Partner', 'Director'].includes(user.role)) {
          // Internal referral from Partner/Director
          const internalSource = db.prepare('SELECT id FROM lead_sources WHERE source_code = ?').get('internal_referral')
          leadSourceId = internalSource?.id
        } else {
          // Default to unknown
          const unknownSource = db.prepare('SELECT id FROM lead_sources WHERE source_code = ?').get('unknown')
          leadSourceId = unknownSource?.id
        }
      }
      
      console.log(`[Lead Source] Request ${request.request_id} - Lead source set to ID: ${leadSourceId}`)
    }

    // Update status with all recommendations, prospect information, and lead source
    db.prepare(`
      UPDATE coi_requests 
      SET status = ?, 
          duplication_matches = ?,
          is_prospect = ?,
          prms_client_id = ?,
          lead_source_id = COALESCE(?, lead_source_id)
      WHERE id = ?
    `).run(
      newStatus,
      JSON.stringify(allRecommendations),
      isProspect ? 1 : 0,
      prmsClientId,
      leadSourceId,
      req.params.id
    )

    // Parent company bidirectional sync: if existing BDO client and parent set and PRMS has TBD/empty, create update request for PRMS admin
    const parentCompanyTrimmed = (request.parent_company || '').trim()
    if (request.client_id && parentCompanyTrimmed && isClientParentTBDOrEmpty(request.client_id)) {
      try {
        const existing = db.prepare(`
          SELECT id FROM parent_company_update_requests
          WHERE client_id = ? AND coi_request_id = ? AND status = 'Pending'
        `).get(request.client_id, req.params.id)
        if (!existing) {
          db.prepare(`
            INSERT INTO parent_company_update_requests (
              client_id, client_code, requested_parent_company, source, status, coi_request_id, requested_by, requested_at, updated_at
            ) VALUES (?, ?, ?, 'COI', 'Pending', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).run(request.client_id, client.client_code, parentCompanyTrimmed, req.params.id, user.id)
        }
      } catch (err) {
        console.warn('[Parent company update request] Could not create on submit:', err.message)
      }
    }

    // ========================================
    // FUNNEL TRACKING: Log proposal submission
    // ========================================
    if (isProspect) {
      logFunnelEvent({
        prospectId: request.prospect_id,
        coiRequestId: req.params.id,
        fromStage: null,
        toStage: FUNNEL_STAGES.PROPOSAL_SUBMITTED,
        userId: user.id,
        userRole: user.role,
        notes: `Proposal submitted for ${client.client_name}`,
        metadata: { 
          serviceType: request.service_type, 
          prmsClientId,
          newStatus 
        }
      })
    }

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
        // Emit event for My Day/Week
        eventBus.emitEvent(EVENT_TYPES.DIRECTOR_APPROVAL_REQUIRED, {
          requestId: req.params.id,
          userId: user.id,
          targetUserId: user.director_id,
          data: { request_id: request.request_id, client_name: client.client_name }
        })
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
          
          // Emit event for My Day/Week (notify first compliance officer)
          if (complianceOfficers[0]) {
            eventBus.emitEvent(EVENT_TYPES.COMPLIANCE_REVIEW_REQUIRED, {
              requestId: req.params.id,
              userId: user.id,
              targetUserId: complianceOfficers[0].id,
              data: { request_id: request.request_id, client_name: client.client_name }
            })
          }
        }
      }
    } catch (notificationError) {
      // Log but don't fail the request submission
      console.error('Error sending submission notifications:', notificationError)
    }

    res.json({ 
      success: true, 
      duplicates: duplicates || [],
      groupConflicts: groupConflicts.conflicts || [],
      ruleRecommendations: ruleEvaluation.recommendations || [],
      requiresComplianceReview: hasBlockRecommendation || hasRequireApproval || hasCriticalGroupConflicts || duplicates?.some(d => d.action === 'block'),
      flagged: hasCriticalGroupConflicts,
      message: hasCriticalGroupConflicts 
        ? 'Request submitted but flagged for Compliance review due to potential group conflicts'
        : 'Request submitted successfully'
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

    // Role-based validation: Directors can only Approve or Reject (not "Approved with Restrictions")
    if (user.role === 'Director' && approvalStatus === 'Approved with Restrictions') {
      return res.status(403).json({ 
        error: 'Directors can only approve or reject requests. Additional options (Restrictions, More Info) are available to Compliance and Partner roles.' 
      })
    }

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
      
      // Emit event for approval
      eventBus.emitEvent(EVENT_TYPES.REQUEST_APPROVED, {
        requestId: req.params.id,
        userId: user.id,
        targetUserId: request.requester_id,
        data: { request_id: request.request_id, approved_by: 'Director' }
      })
    } else if (user.role === 'Compliance' && request.status === 'Pending Compliance') {
      updateField = 'compliance_review_status'
      dateField = 'compliance_review_date'
      byField = 'compliance_reviewed_by'
      notesField = 'compliance_review_notes'
      restrictionsField = 'compliance_restrictions'
      nextStatus = 'Pending Partner'
      
      // Emit event for approval
      eventBus.emitEvent(EVENT_TYPES.REQUEST_APPROVED, {
        requestId: req.params.id,
        userId: user.id,
        targetUserId: request.requester_id,
        data: { request_id: request.request_id, approved_by: 'Compliance' }
      })
      
      // Emit event for next approver (Partner)
      const partner = db.prepare('SELECT id FROM users WHERE role = ? AND is_active = 1 LIMIT 1').get('Partner')
      if (partner) {
        eventBus.emitEvent(EVENT_TYPES.PARTNER_APPROVAL_REQUIRED, {
          requestId: req.params.id,
          userId: user.id,
          targetUserId: partner.id,
          data: { request_id: request.request_id }
        })
      }
      
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
      
      // Update stage_entered_at for SLA tracking when status changes
      try {
        db.prepare(`
          UPDATE coi_requests 
          SET stage_entered_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(req.params.id)
      } catch (e) {
        // Column may not exist yet
      }
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

    // Notify requester of progress update
    const requester = getUserById(request.requester_id)
    if (requester && requester.email) {
      const requesterSubject = `COI Request ${request.request_id} - Approved by ${user.role}`
      const requesterBody = `Dear ${requester.name},

Your Conflict of Interest request has been approved by ${user.name} (${user.role}) and is now pending ${nextRole || 'final'} review.

Request ID: ${request.request_id}
Department: ${request.department || 'N/A'}
Service Type: ${request.service_type || 'N/A'}
Current Status: ${nextStatus}

You can track the progress of your request in the COI system:
http://localhost:5173/coi

Best regards,
COI System`
      
      sendEmail(requester.email, requesterSubject, requesterBody, { 
        requestId: request.id, 
        requestNumber: request.request_id,
        type: 'progress_update'
      })
    }

    // ========================================
    // FUNNEL TRACKING: Log status change for prospects
    // ========================================
    if (request.is_prospect) {
      // Map status to funnel stage
      const statusToStageMap = {
        'Pending Compliance': FUNNEL_STAGES.PENDING_COMPLIANCE,
        'Pending Partner': FUNNEL_STAGES.PENDING_PARTNER,
        'Pending Finance': FUNNEL_STAGES.PENDING_FINANCE
      }
      const fromStatusMap = {
        'Pending Director Approval': FUNNEL_STAGES.PENDING_DIRECTOR,
        'Pending Compliance': FUNNEL_STAGES.PENDING_COMPLIANCE,
        'Pending Partner': FUNNEL_STAGES.PENDING_PARTNER
      }
      
      const toStage = statusToStageMap[nextStatus]
      const fromStage = fromStatusMap[request.status]
      
      if (toStage) {
        logFunnelEvent({
          prospectId: request.prospect_id,
          coiRequestId: req.params.id,
          fromStage: fromStage,
          toStage: toStage,
          userId: user.id,
          userRole: user.role,
          notes: `${user.role} ${approvalStatus.toLowerCase()}`,
          metadata: { 
            approvalStatus,
            approvedBy: user.role,
            restrictions: restrictions || null
          }
        })
      }
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

    // Role-based validation: Directors cannot request more info (Compliance/Partner only)
    if (user.role === 'Director') {
      return res.status(403).json({ 
        error: 'Directors can only approve or reject requests. The "Need More Info" option is available to Compliance and Partner roles only.' 
      })
    }

    const { info_required, comments } = req.body
    
    let updateField, notesField
    
    if (user.role === 'Compliance' && request.status === 'Pending Compliance') {
      updateField = 'compliance_review_status'
      notesField = 'compliance_review_notes'
    } else if (user.role === 'Partner' && request.status === 'Pending Partner') {
      updateField = 'partner_approval_status'
      notesField = 'partner_approval_notes'
    } else if (user.role === 'Finance' && request.status === 'Pending Finance') {
      updateField = 'finance_approval_status'
      notesField = 'finance_approval_notes'
    } else {
      return res.status(400).json({ error: 'Invalid action for current status' })
    }

    // Set status back to allow requester to update
    // Also increment escalation_count for priority scoring
    db.prepare(`
      UPDATE coi_requests 
      SET ${updateField} = 'Need More Info',
          ${notesField} = ?,
          status = 'Draft',
          escalation_count = COALESCE(escalation_count, 0) + 1,
          stage_entered_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(`${comments || ''}\n\nInfo Required: ${info_required || 'Please provide more details.'}`, req.params.id)

    // Send notification to requester asking for more info
    sendNeedMoreInfoNotification(req.params.id, user.name, info_required || 'Please provide more details.')
    
    // Emit event for My Day/Week
    eventBus.emitEvent(EVENT_TYPES.MORE_INFO_REQUESTED, {
      requestId: req.params.id,
      userId: user.id,
      targetUserId: request.requester_id,
      data: { request_id: request.request_id, info_required }
    })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function rejectRequest(req, res) {
  try {
    const user = getUserById(req.userId)
    const { reason, recommendations = [], rejection_type = 'fixable', rejection_category } = req.body
    const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(req.params.id)

    // Meeting Change 2026-01-12: Additional rejection options for COI level and above
    // Director level: only approve or reject (no additional options)
    // Compliance and above: additional rejection categories
    
    let validRejectionTypes = ['fixable', 'permanent']
    let validRejectionCategories = []
    
    if (user.role === 'Compliance' || user.role === 'Partner') {
      // Additional rejection options for COI level and above
      validRejectionCategories = [
        'Conflict of Interest',
        'Insufficient Information',
        'Regulatory Compliance Issue',
        'Client Risk Assessment',
        'Service Type Conflict',
        'Duplication Detected',
        'Global Clearance Required',
        'Other'
      ]
    } else if (user.role === 'Director') {
      // Director level: only approve or reject (no additional categories)
      validRejectionCategories = []
    }

    // Validate rejection_type
    const finalRejectionType = validRejectionTypes.includes(rejection_type) ? rejection_type : 'fixable'
    
    // Validate rejection_category (only for Compliance and above)
    const finalRejectionCategory = (user.role === 'Compliance' || user.role === 'Partner') && 
                                   validRejectionCategories.includes(rejection_category) 
                                   ? rejection_category 
                                   : null

    // Also increment escalation_count for priority scoring (rejection is an escalation)
    db.prepare(`
      UPDATE coi_requests 
      SET status = 'Rejected',
          rejection_reason = ?,
          rejection_type = ?,
          rejection_category = ?,
          escalation_count = COALESCE(escalation_count, 0) + 1,
          stage_entered_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reason || 'No reason provided', finalRejectionType, finalRejectionCategory, req.params.id)
    
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
        notes: reason,
        rejectionCategory: finalRejectionCategory
      })
    }
    
    // Send rejection notification with rejection type and category
    sendRejectionNotification(req.params.id, user.name, reason || 'No reason provided', finalRejectionType, finalRejectionCategory)
    
    // Emit event for rejection
    eventBus.emitEvent(EVENT_TYPES.REQUEST_REJECTED, {
      requestId: req.params.id,
      userId: user.id,
      targetUserId: request.requester_id,
      data: { request_id: request.request_id, rejected_by: user.role, reason }
    })

    // ========================================
    // FUNNEL TRACKING: Log rejection (lost)
    // ========================================
    if (request.is_prospect) {
      logFunnelEvent({
        prospectId: request.prospect_id,
        coiRequestId: req.params.id,
        fromStage: request.status?.toLowerCase().replace(/ /g, '_'),
        toStage: FUNNEL_STAGES.LOST,
        userId: user.id,
        userRole: user.role,
        notes: reason || 'Rejected',
        metadata: { 
          rejectionType: finalRejectionType,
          rejectionCategory: finalRejectionCategory,
          rejectedBy: user.role
        }
      })
    }
    
    res.json({ 
      success: true, 
      rejection_type: finalRejectionType,
      rejection_category: finalRejectionCategory
    })
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
    
    // 9. Delete engagement codes
    try {
      db.prepare('DELETE FROM coi_engagement_codes WHERE coi_request_id = ?').run(req.params.id)
    } catch (err) {
      // Table might not exist, ignore
    }
    
    // 10. Delete compliance audit log entries
    try {
      db.prepare('DELETE FROM compliance_audit_log WHERE coi_request_id = ?').run(req.params.id)
    } catch (err) {
      // Table might not exist, ignore
    }
    
    // 11. Finally, delete the request itself
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
    const previousStatus = request.status
    db.prepare(`
      UPDATE coi_requests 
      SET engagement_code = ?,
          finance_code_status = 'Generated',
          financial_parameters = ?,
          status = 'Approved'
      WHERE id = ?
    `).run(code, JSON.stringify(financial_parameters), req.params.id)

    // ========================================
    // FUNNEL TRACKING: Log approval
    // ========================================
    if (request.is_prospect) {
      logFunnelEvent({
        prospectId: request.prospect_id,
        coiRequestId: req.params.id,
        fromStage: previousStatus?.toLowerCase().replace(/ /g, '_'),
        toStage: FUNNEL_STAGES.APPROVED,
        userId: user.id,
        userRole: user.role,
        notes: `Approved with engagement code: ${code}`,
        metadata: { 
          engagementCode: code,
          financialParameters: financial_parameters
        }
      })
    }

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

/**
 * Refresh duplicate detection for an existing request
 * Re-runs the improved fuzzy matching algorithm and updates stored results
 */
export async function refreshDuplicates(req, res) {
  try {
    const { id } = req.params
    
    // Get the request with client info
    const request = db.prepare(`
      SELECT r.*, c.client_name, c.client_code
      FROM coi_requests r
      LEFT JOIN clients c ON r.client_id = c.id
      WHERE r.id = ?
    `).get(id)
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }
    
    // Re-run duplicate detection with the improved algorithm
    const duplicates = await checkDuplication(
      request.client_name,
      request.id,
      request.service_type,
      request.pie_status === 'Yes',
      request
    )
    
    // Re-run rule evaluation
    const requestDataForRules = {
      ...request,
      client_name: request.client_name
    }
    const ruleEvaluation = evaluateRules(FieldMappingService.prepareForRuleEvaluation(requestDataForRules))
    
    // Combine results
    const allRecommendations = {
      duplicates: duplicates || [],
      ruleRecommendations: ruleEvaluation.recommendations || [],
      totalRulesEvaluated: ruleEvaluation.totalRulesEvaluated || 0,
      matchedRules: ruleEvaluation.matchedRules || 0,
      refreshedAt: new Date().toISOString()
    }
    
    // Update the stored results
    db.prepare(`
      UPDATE coi_requests 
      SET duplication_matches = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(allRecommendations), id)
    
    console.log(`[Refresh Duplicates] Request ${request.request_id}: ${duplicates?.length || 0} matches found (was refreshed)`)
    
    res.json({
      success: true,
      message: 'Duplicate detection refreshed',
      duplicatesFound: duplicates?.length || 0,
      recommendations: allRecommendations
    })
  } catch (error) {
    console.error('Error refreshing duplicates:', error)
    res.status(500).json({ error: error.message })
  }
}

// getUserById now imported from utils/userUtils.js

// ========================================
// PROSPECT MANAGEMENT ENDPOINTS (Req 3)
// ========================================

/**
 * Get all prospect requests (filtered)
 */
export async function getProspectRequests(req, res) {
  try {
    const { status, converted, linked_only } = req.query
    
    let query = `
      SELECT cr.*, c.client_name, c.client_code
      FROM coi_requests cr
      LEFT JOIN clients c ON cr.client_id = c.id
      WHERE cr.is_prospect = 1
    `
    const params = []
    
    if (status) {
      query += ' AND cr.status = ?'
      params.push(status)
    }
    
    if (converted === 'true') {
      query += ' AND cr.prospect_converted_at IS NOT NULL'
    } else if (converted === 'false') {
      query += ' AND cr.prospect_converted_at IS NULL'
    }
    
    if (linked_only === 'true') {
      query += ' AND cr.prms_client_id IS NOT NULL'
    }
    
    query += ' ORDER BY cr.created_at DESC'
    
    const prospects = db.prepare(query).all(...params)
    
    res.json({ prospects, total: prospects.length })
  } catch (error) {
    console.error('Error fetching prospect requests:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Get prospect conversion metrics
 */
export async function getProspectConversionMetrics(req, res) {
  try {
    const { period = 'month' } = req.query // 'month', 'quarter', 'year'
    
    // Calculate date range based on period
    let dateFilter = ''
    const now = new Date()
    if (period === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      dateFilter = `AND created_at >= '${firstDay}'`
    } else if (period === 'quarter') {
      const quarter = Math.floor(now.getMonth() / 3)
      const firstDay = new Date(now.getFullYear(), quarter * 3, 1).toISOString()
      dateFilter = `AND created_at >= '${firstDay}'`
    } else if (period === 'year') {
      const firstDay = new Date(now.getFullYear(), 0, 1).toISOString()
      dateFilter = `AND created_at >= '${firstDay}'`
    }
    
    // Total prospects
    const totalProspects = db.prepare(`
      SELECT COUNT(*) as count FROM coi_requests 
      WHERE is_prospect = 1 ${dateFilter}
    `).get()
    
    // Prospects linked to existing PRMS clients
    const linkedProspects = db.prepare(`
      SELECT COUNT(*) as count FROM coi_requests 
      WHERE is_prospect = 1 AND prms_client_id IS NOT NULL ${dateFilter}
    `).get()
    
    // Converted prospects
    const convertedProspects = db.prepare(`
      SELECT COUNT(*) as count FROM coi_requests 
      WHERE is_prospect = 1 AND prospect_converted_at IS NOT NULL ${dateFilter}
    `).get()
    
    // Existing clients (not prospects)
    const existingClients = db.prepare(`
      SELECT COUNT(*) as count FROM coi_requests 
      WHERE is_prospect = 0 ${dateFilter}
    `).get()
    
    // Calculate conversion rate
    const conversionRate = totalProspects.count > 0 
      ? ((convertedProspects.count / totalProspects.count) * 100).toFixed(2)
      : 0
    
    res.json({
      period,
      totalProspects: totalProspects.count,
      linkedProspects: linkedProspects.count,
      standaloneProspects: totalProspects.count - linkedProspects.count,
      convertedProspects: convertedProspects.count,
      existingClients: existingClients.count,
      conversionRate: parseFloat(conversionRate),
      totalRequests: totalProspects.count + existingClients.count
    })
  } catch (error) {
    console.error('Error fetching prospect metrics:', error)
    res.status(500).json({ error: error.message })
  }
}
/**
 * Clear conflict flag for a specific conflict entity
 * Requirement: Parent Company Verification - Allow Compliance to mark false positives
 */
export async function clearConflictFlag(req, res) {
  try {
    const { id } = req.params
    const { conflict_entity, notes } = req.body
    
    const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(id)
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }
    
    // Get current conflicts
    let conflicts = []
    if (request.group_conflicts_detected) {
      try {
        conflicts = typeof request.group_conflicts_detected === 'string'
          ? JSON.parse(request.group_conflicts_detected)
          : request.group_conflicts_detected
      } catch (e) {
        console.error('Error parsing group_conflicts_detected:', e)
      }
    }
    
    // Remove the specified conflict
    const remainingConflicts = conflicts.filter(c => c.entity_name !== conflict_entity)
    
    // Update request
    db.prepare(`
      UPDATE coi_requests 
      SET group_conflicts_detected = ?,
          requires_compliance_verification = ?
      WHERE id = ?
    `).run(
      remainingConflicts.length > 0 ? JSON.stringify(remainingConflicts) : null,
      remainingConflicts.length > 0 ? 1 : 0,
      id
    )
    
    res.json({
      success: true,
      message: 'Conflict flag cleared',
      remaining_conflicts: remainingConflicts,
      remaining_conflicts_count: remainingConflicts.length
    })
  } catch (error) {
    console.error('Error clearing conflict flag:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Get resolved conflicts for dashboard/reports
 */
export async function getResolvedConflicts(req, res) {
  try {
    const { status, date_from, date_to } = req.query
    
    let query = `
      SELECT 
        cr.id,
        cr.request_id,
        cr.client_name,
        cr.service_type,
        cr.group_conflicts_detected,
        cr.requires_compliance_verification,
        cr.created_at
      FROM coi_requests cr
      WHERE cr.group_conflicts_detected IS NOT NULL
    `
    const params = []
    
    if (status) {
      query += ' AND cr.status = ?'
      params.push(status)
    }
    
    if (date_from) {
      query += ' AND cr.created_at >= ?'
      params.push(date_from)
    }
    
    if (date_to) {
      query += ' AND cr.created_at <= ?'
      params.push(date_to)
    }
    
    query += ' ORDER BY cr.created_at DESC'
    
    const requests = db.prepare(query).all(...params)
    
    // Parse conflicts for each request
    const resolvedConflicts = requests.map(req => {
      let conflicts = []
      try {
        conflicts = typeof req.group_conflicts_detected === 'string'
          ? JSON.parse(req.group_conflicts_detected)
          : req.group_conflicts_detected
      } catch (e) {
        console.error('Error parsing conflicts:', e)
      }
      
      return {
        ...req,
        conflicts,
        conflicts_count: conflicts.length
      }
    })
    
    res.json({
      conflicts: resolvedConflicts,
      total: resolvedConflicts.length
    })
  } catch (error) {
    console.error('Error fetching resolved conflicts:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Dismiss a resolved conflict from dashboard
 */
export async function dismissResolvedConflict(req, res) {
  try {
    const { id } = req.params
    const { reason } = req.body
    const userId = req.userId
    
    const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(id)
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }
    
    // Insert into dismissed_resolved_conflicts table
    db.prepare(`
      INSERT INTO dismissed_resolved_conflicts (request_id, dismissed_by, reason)
      VALUES (?, ?, ?)
    `).run(id, userId, reason || 'Dismissed from dashboard')
    
    res.json({
      success: true,
      message: 'Resolved conflict dismissed'
    })
  } catch (error) {
    console.error('Error dismissing resolved conflict:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Verify group structure for a COI request (Compliance only)
 * Requirement: Parent Company Verification
 */
export async function verifyGroupStructure(req, res) {
  try {
    const { id } = req.params
    const { group_structure, parent_company, notes } = req.body
    const userId = req.userId
    
    const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(id)
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }
    
    // Update group structure verification
    db.prepare(`
      UPDATE coi_requests 
      SET group_structure = ?,
          parent_company = ?,
          parent_company_verified_by = ?,
          parent_company_verified_at = datetime('now'),
          requires_compliance_verification = 0
      WHERE id = ?
    `).run(
      group_structure || request.group_structure,
      parent_company || request.parent_company,
      userId,
      id
    )
    
    res.json({
      success: true,
      message: 'Group structure verified',
      group_structure: group_structure || request.group_structure,
      parent_company: parent_company || request.parent_company
    })
  } catch (error) {
    console.error('Error verifying group structure:', error)
    res.status(500).json({ error: error.message })
  }
}
