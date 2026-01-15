import { getDatabase } from '../database/init.js'
import { sendEmail } from '../services/emailService.js'
import { getUserById } from '../utils/userUtils.js'

const db = getDatabase()

/**
 * Submit client creation request
 * Called when requester converts prospect to engagement and fills client form
 */
export async function submitClientCreationRequest(req, res) {
  try {
    const { 
      prospect_id,
      coi_request_id,
      client_name,
      legal_form,
      industry,
      regulatory_body,
      parent_company,
      contact_details,
      physical_address,
      billing_address,
      description
    } = req.body
    
    const requester_id = req.userId
    
    if (!requester_id) {
      return res.status(401).json({ error: 'User authentication required' })
    }
    
    if (!prospect_id || !coi_request_id || !client_name) {
      return res.status(400).json({ error: 'prospect_id, coi_request_id, and client_name are required' })
    }
    
    // Check if request already exists for this COI request
    const existing = db.prepare(`
      SELECT * FROM prospect_client_creation_requests 
      WHERE coi_request_id = ? AND status IN ('Pending', 'In Review')
    `).get(coi_request_id)
    
    if (existing) {
      return res.status(400).json({ 
        error: 'Client creation request already exists',
        existingRequestId: existing.id
      })
    }
    
    // Insert new request
    const result = db.prepare(`
      INSERT INTO prospect_client_creation_requests (
        prospect_id,
        coi_request_id,
        requester_id,
        client_name,
        legal_form,
        industry,
        regulatory_body,
        parent_company,
        contact_details,
        physical_address,
        billing_address,
        description,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
    `).run(
      prospect_id,
      coi_request_id,
      requester_id,
      client_name,
      legal_form,
      industry,
      regulatory_body,
      parent_company,
      typeof contact_details === 'string' ? contact_details : JSON.stringify(contact_details),
      physical_address,
      billing_address,
      description
    )
    
    const requestId = result.lastInsertRowid
    
    // Get request details with names
    const request = db.prepare(`
      SELECT 
        r.*,
        u.name as requester_name,
        u.email as requester_email,
        coi.request_id as coi_request_id_code
      FROM prospect_client_creation_requests r
      LEFT JOIN users u ON r.requester_id = u.id
      LEFT JOIN coi_requests coi ON r.coi_request_id = coi.id
      WHERE r.id = ?
    `).get(requestId)
    
    // Send email notification to PRMS Admins
    try {
      const admins = db.prepare(`
        SELECT email FROM users 
        WHERE role IN ('Admin', 'Super Admin') AND active = 1
      `).all()
      
      for (const admin of admins) {
        if (admin.email) {
          await sendEmail(
            admin.email,
            `New Client Creation Request - ${client_name}`,
            `Dear PRMS Admin,

A new client creation request has been submitted for your review.

Client Name: ${client_name}
COI Request: ${request.coi_request_id_code}
Submitted By: ${request.requester_name}
Date: ${new Date().toLocaleDateString()}

Please log in to the COI System Admin Dashboard to review and complete this request.

${process.env.APP_URL || 'http://localhost:5173'}/admin

Best regards,
COI System`
          )
        }
      }
    } catch (emailError) {
      console.error('Error sending notification email:', emailError)
    }
    
    res.json({
      success: true,
      message: 'Client creation request submitted successfully',
      request: request
    })
  } catch (error) {
    console.error('Error submitting client creation request:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Get pending requests (for PRMS Admin dashboard)
 */
export async function getPendingClientCreationRequests(req, res) {
  try {
    const requests = db.prepare(`
      SELECT 
        r.*,
        u.name as requester_name,
        coi.request_id as coi_request_id_code,
        p.prospect_name,
        p.prospect_code
      FROM prospect_client_creation_requests r
      LEFT JOIN users u ON r.requester_id = u.id
      LEFT JOIN coi_requests coi ON r.coi_request_id = coi.id
      LEFT JOIN prospects p ON r.prospect_id = p.id
      WHERE r.status IN ('Pending', 'In Review')
      ORDER BY r.submitted_date DESC
    `).all()
    
    res.json(requests)
  } catch (error) {
    console.error('Error fetching pending client creation requests:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Get request by ID
 */
export async function getClientCreationRequestById(req, res) {
  try {
    const { id } = req.params
    
    const request = db.prepare(`
      SELECT 
        r.*,
        u.name as requester_name,
        u.email as requester_email,
        coi.request_id as coi_request_id_code,
        p.prospect_name,
        p.prospect_code,
        reviewer.name as reviewed_by_name
      FROM prospect_client_creation_requests r
      LEFT JOIN users u ON r.requester_id = u.id
      LEFT JOIN coi_requests coi ON r.coi_request_id = coi.id
      LEFT JOIN prospects p ON r.prospect_id = p.id
      LEFT JOIN users reviewer ON r.reviewed_by = reviewer.id
      WHERE r.id = ?
    `).get(id)
    
    if (!request) {
      return res.status(404).json({ error: 'Client creation request not found' })
    }
    
    // Parse contact_details if it's a JSON string
    if (request.contact_details && typeof request.contact_details === 'string') {
      try {
        request.contact_details = JSON.parse(request.contact_details)
      } catch (e) {
        // Leave as string if parsing fails
      }
    }
    
    res.json(request)
  } catch (error) {
    console.error('Error fetching client creation request:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Update request (PRMS Admin review)
 * PRMS Admin validation required - Only Admin/Super Admin can review/update
 */
export async function updateClientCreationRequest(req, res) {
  try {
    const { id } = req.params
    const { status, completion_notes } = req.body
    
    // Get current user and validate PRMS Admin role
    const reviewer = getUserById(req.userId)
    if (!reviewer) {
      return res.status(401).json({ error: 'User authentication required' })
    }
    
    const reviewer_id = reviewer.id
    const reviewer_role = reviewer.role
    
    // Explicit PRMS Admin validation - Only Admin/Super Admin can review
    if (!['Admin', 'Super Admin'].includes(reviewer_role)) {
      return res.status(403).json({ 
        error: 'Only PRMS Admin or Super Admin can review and update client creation requests',
        required_role: 'Admin or Super Admin',
        current_role: reviewer_role
      })
    }
    
    const request = db.prepare('SELECT * FROM prospect_client_creation_requests WHERE id = ?').get(id)
    
    if (!request) {
      return res.status(404).json({ error: 'Client creation request not found' })
    }
    
    // Validate status transitions
    const validStatuses = ['Pending', 'In Review', 'Rejected', 'Completed']
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        valid_statuses: validStatuses,
        provided_status: status
      })
    }
    
    // Prevent status changes if already completed
    if (request.status === 'Completed' && status && status !== 'Completed') {
      return res.status(400).json({ 
        error: 'Cannot change status of a completed request',
        current_status: request.status
      })
    }
    
    db.prepare(`
      UPDATE prospect_client_creation_requests
      SET status = COALESCE(?, status),
          reviewed_by = ?,
          reviewed_date = CURRENT_TIMESTAMP,
          completion_notes = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, reviewer_id, completion_notes, id)
    
    res.json({
      success: true,
      message: 'Client creation request updated successfully',
      reviewed_by: reviewer_id,
      reviewed_by_name: reviewer.name,
      reviewed_by_role: reviewer_role
    })
  } catch (error) {
    console.error('Error updating client creation request:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Complete request (create client in PRMS, update prospect)
 * PRMS Admin validation required - Only Admin/Super Admin can complete
 */
export async function completeClientCreation(req, res) {
  try {
    const { id } = req.params
    const { client_data, completion_notes } = req.body
    
    // Get current user and validate PRMS Admin role
    const reviewer = getUserById(req.userId)
    if (!reviewer) {
      return res.status(401).json({ error: 'User authentication required' })
    }
    
    const reviewer_id = reviewer.id
    const reviewer_role = reviewer.role
    
    // Explicit PRMS Admin validation - Only Admin/Super Admin can validate and complete
    if (!['Admin', 'Super Admin'].includes(reviewer_role)) {
      return res.status(403).json({ 
        error: 'Only PRMS Admin or Super Admin can validate and complete client creation requests',
        required_role: 'Admin or Super Admin',
        current_role: reviewer_role,
        message: 'Client creation requests must be validated by a PRMS Admin before being completed.'
      })
    }
    
    // Get the request
    const request = db.prepare(`
      SELECT r.*, coi.request_id as coi_request_id_code
      FROM prospect_client_creation_requests r
      LEFT JOIN coi_requests coi ON r.coi_request_id = coi.id
      WHERE r.id = ?
    `).get(id)
    
    if (!request) {
      return res.status(404).json({ error: 'Client creation request not found' })
    }
    
    if (request.status === 'Completed') {
      return res.status(400).json({ error: 'Request already completed' })
    }
    
    // Validate that request is in a valid state for completion
    if (!['Pending', 'In Review'].includes(request.status)) {
      return res.status(400).json({ 
        error: 'Request must be in Pending or In Review status to be completed',
        current_status: request.status
      })
    }
    
    // Start transaction
    const transaction = db.transaction(() => {
      // 1. Create client in clients table
      const clientCode = `CLI-${String(Date.now()).slice(-6)}`
      
      const clientResult = db.prepare(`
        INSERT INTO clients (
          client_code,
          client_name,
          client_type,
          industry,
          location,
          status,
          parent_company,
          created_at
        ) VALUES (?, ?, ?, ?, ?, 'Active', ?, CURRENT_TIMESTAMP)
      `).run(
        clientCode,
        client_data.client_name || request.client_name,
        client_data.legal_form || request.legal_form,
        client_data.industry || request.industry,
        client_data.physical_address || request.physical_address,
        client_data.parent_company || request.parent_company
      )
      
      const newClientId = clientResult.lastInsertRowid
      
      // 2. Update prospects table
      db.prepare(`
        UPDATE prospects
        SET status = 'Converted to Client',
            converted_to_client_id = ?,
            converted_date = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newClientId, request.prospect_id)
      
      // 3. Update coi_requests table
      db.prepare(`
        UPDATE coi_requests
        SET client_id = ?,
            is_prospect = 0,
            prospect_id = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newClientId, request.coi_request_id)
      
      // 4. Update prospect_client_creation_requests (mark as validated and completed by PRMS Admin)
      db.prepare(`
        UPDATE prospect_client_creation_requests
        SET status = 'Completed',
            reviewed_by = ?,
            reviewed_date = CURRENT_TIMESTAMP,
            completion_notes = ?,
            created_client_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(reviewer_id, completion_notes, newClientId, id)
      
      return { newClientId, clientCode }
    })
    
    const { newClientId, clientCode } = transaction()
    
    // 5. Get requester details and send email notification
    try {
      const requester = db.prepare(`
        SELECT u.name, u.email, coi.id as coi_db_id, coi.request_id
        FROM users u
        LEFT JOIN coi_requests coi ON coi.requester_id = u.id
        WHERE u.id = ? AND coi.id = ?
      `).get(request.requester_id, request.coi_request_id)
      
      if (requester && requester.email) {
        await sendEmail(
          requester.email,
          `Client Created in PRMS - ${request.client_name}`,
          `Dear ${requester.name},

Great news! The client has been successfully created in PRMS.

Client Name: ${request.client_name}
Client ID: ${clientCode}
Status: Active in PRMS

Your engagement request (${requester.request_id}) is now ready to be reviewed and submitted.

Log in to continue:
${process.env.APP_URL || 'http://localhost:5173'}/coi/requests/${requester.coi_db_id}

Best regards,
COI System`
        )
      }
    } catch (emailError) {
      console.error('Error sending completion notification:', emailError)
    }
    
    res.json({
      success: true,
      message: 'Client created successfully in PRMS and validated by PRMS Admin',
      validated_by: reviewer_id,
      validated_by_name: reviewer.name,
      validated_by_role: reviewer_role,
      validated_at: new Date().toISOString(),
      client: {
        id: newClientId,
        client_code: clientCode,
        client_name: client_data.client_name || request.client_name
      }
    })
  } catch (error) {
    console.error('Error completing client creation:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Get requests for specific COI request
 */
export async function getClientCreationRequestsForCOI(req, res) {
  try {
    const { coiRequestId } = req.params
    
    const requests = db.prepare(`
      SELECT 
        r.*,
        u.name as requester_name,
        reviewer.name as reviewed_by_name
      FROM prospect_client_creation_requests r
      LEFT JOIN users u ON r.requester_id = u.id
      LEFT JOIN users reviewer ON r.reviewed_by = reviewer.id
      WHERE r.coi_request_id = ?
      ORDER BY r.submitted_date DESC
    `).all(coiRequestId)
    
    res.json(requests)
  } catch (error) {
    console.error('Error fetching client creation requests for COI:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Upload attachment to client creation request
 * NOTE: This reuses the existing coi_attachments table with a new attachment_type
 */
export async function uploadClientCreationAttachment(req, res) {
  try {
    const { requestId } = req.params
    const file = req.file
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
    
    const request = db.prepare('SELECT * FROM prospect_client_creation_requests WHERE id = ?').get(requestId)
    
    if (!request) {
      return res.status(404).json({ error: 'Client creation request not found' })
    }
    
    // Insert into coi_attachments with special attachment_type
    const result = db.prepare(`
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
      request.coi_request_id,
      file.originalname,
      file.path,
      file.mimetype,
      file.size,
      req.userId,
      'client_creation'
    )
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      attachment: {
        id: result.lastInsertRowid,
        file_name: file.originalname,
        file_size: file.size,
        file_type: file.mimetype
      }
    })
  } catch (error) {
    console.error('Error uploading attachment:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Get attachments for client creation request
 */
export async function getClientCreationAttachments(req, res) {
  try {
    const { requestId } = req.params
    
    const request = db.prepare('SELECT * FROM prospect_client_creation_requests WHERE id = ?').get(requestId)
    
    if (!request) {
      return res.status(404).json({ error: 'Client creation request not found' })
    }
    
    const attachments = db.prepare(`
      SELECT a.*, u.name as uploaded_by_name
      FROM coi_attachments a
      LEFT JOIN users u ON a.uploaded_by = u.id
      WHERE a.coi_request_id = ? AND a.attachment_type = 'client_creation'
      ORDER BY a.uploaded_at DESC
    `).all(request.coi_request_id)
    
    res.json(attachments)
  } catch (error) {
    console.error('Error fetching attachments:', error)
    res.status(500).json({ error: error.message })
  }
}
