import { getDatabase } from '../database/init.js'
import { generateEngagementCode } from '../services/engagementCodeService.js'
import { sendEmail } from '../services/emailService.js'

const db = getDatabase()

/**
 * Convert proposal to engagement and re-apply for COI
 * Meeting Requirement 2026-01-12: Convert proposal to engagement within the system and re-apply for COI
 */
export async function convertProposalToEngagement(req, res) {
  try {
    const { requestId } = req.params
    const { conversion_reason, requester_id } = req.body
    const userId = req.userId || requester_id
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' })
    }
    
    // Get the original proposal request
    const originalRequest = db.prepare(`
      SELECT * FROM coi_requests WHERE id = ?
    `).get(requestId)
    
    if (!originalRequest) {
      return res.status(404).json({ error: 'Request not found' })
    }
    
    // Verify it's a proposal stage request
    if (originalRequest.stage !== 'Proposal') {
      return res.status(400).json({ 
        error: 'Only proposal stage requests can be converted to engagement',
        current_stage: originalRequest.stage
      })
    }
    
    // Verify request is in appropriate status
    if (!['Approved', 'Active'].includes(originalRequest.status)) {
      return res.status(400).json({ 
        error: 'Request must be Approved or Active to convert to engagement',
        current_status: originalRequest.status
      })
    }
    
    // Check if this is a prospect and if client creation is required
    const isProspect = originalRequest.is_prospect === 1 || originalRequest.is_prospect === true
    
    if (isProspect) {
      // Check if client creation request already exists
      const existingCreationRequest = db.prepare(`
        SELECT * FROM prospect_client_creation_requests 
        WHERE coi_request_id = ? AND status IN ('Pending', 'In Review')
      `).get(requestId)
      
      if (existingCreationRequest) {
        return res.status(400).json({
          error: 'Client creation request already pending',
          requiresClientCreation: true,
          clientCreationRequestId: existingCreationRequest.id,
          message: 'A client creation request for this prospect is already pending PRMS Admin review.'
        })
      }
    }
    
    // Create conversion record
    const conversionResult = db.prepare(`
      INSERT INTO proposal_engagement_conversions (
        original_proposal_request_id,
        converted_by,
        conversion_reason,
        status
      ) VALUES (?, ?, ?, 'Pending')
    `).run(requestId, userId, conversion_reason || 'Proposal converted to engagement')
    
    const conversionId = conversionResult.lastInsertRowid
    
    // Create new COI request for engagement (copy from proposal)
    const newRequestId = `COI-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
    
    const newRequestResult = db.prepare(`
      INSERT INTO coi_requests (
        request_id,
        client_id,
        requester_id,
        department,
        requestor_name,
        designation,
        entity,
        line_of_service,
        requested_document,
        language,
        parent_company,
        client_location,
        relationship_with_client,
        client_type,
        regulated_body,
        client_status,
        service_type,
        service_sub_category,
        service_description,
        requested_service_period_start,
        requested_service_period_end,
        service_category,
        full_ownership_structure,
        pie_status,
        related_affiliated_entities,
        international_operations,
        foreign_subsidiaries,
        global_clearance_status,
        status,
        stage,
        custom_fields,
        form_version,
        compliance_visible,
        is_prospect,
        prospect_id
      ) SELECT 
        ?,
        client_id,
        requester_id,
        department,
        requestor_name,
        designation,
        entity,
        line_of_service,
        requested_document,
        language,
        parent_company,
        client_location,
        relationship_with_client,
        client_type,
        regulated_body,
        client_status,
        service_type,
        service_sub_category,
        service_description,
        requested_service_period_start,
        requested_service_period_end,
        service_category,
        full_ownership_structure,
        pie_status,
        related_affiliated_entities,
        international_operations,
        foreign_subsidiaries,
        global_clearance_status,
        'Draft',
        'Engagement',
        custom_fields,
        form_version,
        compliance_visible,
        is_prospect,
        prospect_id
      FROM coi_requests
      WHERE id = ?
    `).run(newRequestId, requestId)
    
    const newRequestId_db = newRequestResult.lastInsertRowid
    
    // Update conversion record with new request ID
    db.prepare(`
      UPDATE proposal_engagement_conversions SET
        new_engagement_request_id = ?,
        status = 'Completed'
      WHERE id = ?
    `).run(newRequestId_db, conversionId)
    
    // Update original request to mark as converted
    db.prepare(`
      UPDATE coi_requests SET
        status = 'Active',
        stage = 'Engagement',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(requestId)
    
    // Copy attachments if any
    const attachments = db.prepare(`
      SELECT * FROM coi_attachments WHERE coi_request_id = ?
    `).all(requestId)
    
    for (const attachment of attachments) {
      db.prepare(`
        INSERT INTO coi_attachments (
          coi_request_id,
          file_name,
          file_path,
          file_type,
          file_size,
          uploaded_by,
          attachment_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        newRequestId_db,
        attachment.file_name,
        attachment.file_path,
        attachment.file_type,
        attachment.file_size,
        attachment.uploaded_by,
        attachment.attachment_type
      )
    }
    
    // Get the new request
    const newRequest = db.prepare(`
      SELECT r.*, c.client_name, u.name as requester_name
      FROM coi_requests r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN users u ON r.requester_id = u.id
      WHERE r.id = ?
    `).get(newRequestId_db)
    
    // Send notification
    try {
      const requester = db.prepare('SELECT name, email FROM users WHERE id = ?').get(originalRequest.requester_id)
      if (requester && requester.email) {
        await sendEmail(
          requester.email,
          `Proposal Converted to Engagement - ${newRequest.request_id}`,
          `Dear ${requester.name},\n\nYour proposal (${originalRequest.request_id}) has been converted to an engagement.\n\nNew Engagement Request ID: ${newRequest.request_id}\n\nPlease review and submit the new engagement request for COI approval.\n\nBest regards,\nCOI System`
        )
      }
    } catch (emailError) {
      console.error('Error sending conversion notification:', emailError)
    }
    
    res.json({
      success: true,
      message: 'Proposal successfully converted to engagement',
      original_request_id: originalRequest.request_id,
      new_request: newRequest,
      conversion_id: conversionId,
      requiresClientCreation: isProspect,
      isProspect: isProspect,
      prospectId: originalRequest.prospect_id
    })
  } catch (error) {
    console.error('Error converting proposal to engagement:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Get conversion history for a request
 */
export async function getConversionHistory(req, res) {
  try {
    const { requestId } = req.params
    
    const conversions = db.prepare(`
      SELECT 
        c.*,
        u.name as converted_by_name,
        r1.request_id as original_request_id,
        r2.request_id as new_request_id
      FROM proposal_engagement_conversions c
      LEFT JOIN users u ON c.converted_by = u.id
      LEFT JOIN coi_requests r1 ON c.original_proposal_request_id = r1.id
      LEFT JOIN coi_requests r2 ON c.new_engagement_request_id = r2.id
      WHERE c.original_proposal_request_id = ? OR c.new_engagement_request_id = ?
      ORDER BY c.conversion_date DESC
    `).all(requestId, requestId)
    
    res.json(conversions)
  } catch (error) {
    console.error('Error fetching conversion history:', error)
    res.status(500).json({ error: error.message })
  }
}
