import { getDatabase } from '../database/init.js';
import { sendEmail } from '../services/notificationService.js';
import { notifyClientAcceptedProposal, notifyClientRejectedProposal } from '../services/emailService.js';
import { createRenewalTracking } from '../services/monitoringService.js';

const db = getDatabase();

// Get execution tracking for a COI request
export async function getExecutionTracking(req, res) {
  const { requestId } = req.params
  
  try {
    let tracking = db.prepare(
      'SELECT * FROM execution_tracking WHERE coi_request_id = ?'
    ).get(requestId)
    
    if (!tracking) {
      // Create tracking record if doesn't exist
      const result = db.prepare(`
        INSERT INTO execution_tracking (coi_request_id) VALUES (?)
      `).run(requestId)
      
      tracking = { id: result.lastInsertRowid, coi_request_id: requestId }
    }
    
    res.json(tracking)
  } catch (error) {
    console.error('Error fetching execution tracking:', error)
    res.status(500).json({ error: 'Failed to fetch execution tracking' })
  }
}

// Update proposal preparation
export async function prepareProposal(req, res) {
  const { requestId } = req.params
  const userId = req.user?.id
  
  try {
    db.prepare(`
      UPDATE execution_tracking SET
        proposal_prepared_date = datetime('now'),
        proposal_prepared_by = ?,
        updated_by = ?,
        updated_at = datetime('now')
      WHERE coi_request_id = ?
    `).run(userId, userId, requestId)
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error updating proposal preparation:', error)
    res.status(500).json({ error: 'Failed to update proposal preparation' })
  }
}

// Send proposal to client
export async function sendProposal(req, res) {
  const { requestId } = req.params
  const userId = req.user?.id
  const { sent_to, include_disclaimer } = req.body
  
  try {
    db.prepare(`
      UPDATE execution_tracking SET
        proposal_sent_date = datetime('now'),
        proposal_sent_by = ?,
        proposal_sent_to = ?,
        updated_by = ?,
        updated_at = datetime('now')
      WHERE coi_request_id = ?
    `).run(userId, sent_to, userId, requestId)
    
    // Update main request table
    db.prepare(`
      UPDATE coi_requests SET
        proposal_sent_date = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(requestId)
    
    // Get request details for notification
    const request = db.prepare(`
      SELECT r.*, c.client_name FROM coi_requests r
      JOIN clients c ON r.client_id = c.id
      WHERE r.id = ?
    `).get(requestId)
    
    // Send email notification (mock)
    if (include_disclaimer) {
      sendEmail(
        [sent_to],
        `Proposal for Services - ${request.request_id}`,
        `Dear Client,\n\nPlease find attached our proposal for ${request.service_type} services.\n\nIMPORTANT DISCLAIMER: This proposal is valid for 30 days from the date of issue. If no response is received within this period, the proposal will automatically lapse.\n\nPlease sign and return the proposal at your earliest convenience.\n\nBest regards,\nBDO Al Nisf & Partners`
      )
    }
    
    res.json({ success: true, message: 'Proposal sent successfully' })
  } catch (error) {
    console.error('Error sending proposal:', error)
    res.status(500).json({ error: 'Failed to send proposal' })
  }
}

// Record follow-up
export async function recordFollowUp(req, res) {
  const { requestId } = req.params
  const userId = req.user?.id
  const { follow_up_number, notes } = req.body
  
  try {
    const field = `follow_up_${follow_up_number}_date`
    
    db.prepare(`
      UPDATE execution_tracking SET
        ${field} = datetime('now'),
        admin_notes = COALESCE(admin_notes, '') || '\n' || datetime('now') || ': Follow-up ${follow_up_number} - ' || ?,
        updated_by = ?,
        updated_at = datetime('now')
      WHERE coi_request_id = ?
    `).run(notes || 'Follow-up sent', userId, requestId)
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error recording follow-up:', error)
    res.status(500).json({ error: 'Failed to record follow-up' })
  }
}

// Record client response
export async function recordClientResponse(req, res) {
  const { requestId } = req.params
  const userId = req.user?.id
  const { response_type, notes } = req.body
  
  try {
    db.prepare(`
      UPDATE execution_tracking SET
        client_response_received = datetime('now'),
        client_response_type = ?,
        admin_notes = COALESCE(admin_notes, '') || '\n' || datetime('now') || ': Client Response - ' || ? || ' - ' || ?,
        updated_by = ?,
        updated_at = datetime('now')
      WHERE coi_request_id = ?
    `).run(response_type, response_type, notes || '', userId, requestId)
    
    // Update main request table
    db.prepare(`
      UPDATE coi_requests SET
        client_response_date = datetime('now'),
        client_response_status = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(response_type, requestId)
    
    // Get full request details for notifications
    const request = db.prepare(`
      SELECT r.*, c.client_name, u.name as requester_name, u.email as requester_email
      FROM coi_requests r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN users u ON r.requester_id = u.id
      WHERE r.id = ?
    `).get(requestId)
    
    // If client accepted, update status
    if (response_type === 'Accepted') {
      db.prepare(`
        UPDATE coi_requests SET status = 'Active', stage = 'Engagement' WHERE id = ?
      `).run(requestId)
      
      // Create renewal tracking (3-year)
      if (request.engagement_code) {
        createRenewalTracking(requestId, request.engagement_code, new Date().toISOString())
      }
      
      // Send notifications for client acceptance
      try {
        // Notify requester
        if (request.requester_email) {
          await notifyClientAcceptedProposal(request, {
            name: request.requester_name,
            email: request.requester_email
          }, false)
        }
        
        // Notify Admin users
        const adminUsers = db.prepare('SELECT id, name, email FROM users WHERE role = ? AND is_active = 1').all('Admin')
        for (const admin of adminUsers) {
          await notifyClientAcceptedProposal(request, admin, true)
        }
        
        // Notify Partner (if assigned)
        if (request.partner_approved_by) {
          const partner = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(request.partner_approved_by)
          if (partner) {
            await notifyClientAcceptedProposal(request, partner, false)
          }
        }
      } catch (notificationError) {
        console.error('Error sending client acceptance notifications:', notificationError)
      }
    } else if (response_type === 'Rejected') {
      // Client rejection is always permanent - cannot be resubmitted
      db.prepare(`
        UPDATE coi_requests 
        SET status = 'Rejected',
            rejection_reason = ?,
            rejection_type = 'permanent'
        WHERE id = ?
      `).run(notes || 'Client rejected the proposal', requestId)
      
      // Send notifications for client rejection
      try {
        // Notify requester
        if (request.requester_email) {
          await notifyClientRejectedProposal(request, {
            name: request.requester_name,
            email: request.requester_email
          }, notes || null)
        }
        
        // Notify Admin users
        const adminUsers = db.prepare('SELECT id, name, email FROM users WHERE role = ? AND is_active = 1').all('Admin')
        for (const admin of adminUsers) {
          await notifyClientRejectedProposal(request, admin, notes || null)
        }
      } catch (notificationError) {
        console.error('Error sending client rejection notifications:', notificationError)
      }
    }
    
    res.json({ success: true, new_status: response_type === 'Accepted' ? 'Active' : response_type === 'Rejected' ? 'Rejected' : 'Pending' })
  } catch (error) {
    console.error('Error recording client response:', error)
    res.status(500).json({ error: 'Failed to record client response' })
  }
}

// Prepare engagement letter
export async function prepareEngagementLetter(req, res) {
  const { requestId } = req.params
  const userId = req.user?.id
  
  try {
    db.prepare(`
      UPDATE execution_tracking SET
        engagement_letter_prepared_date = datetime('now'),
        engagement_letter_prepared_by = ?,
        updated_by = ?,
        updated_at = datetime('now')
      WHERE coi_request_id = ?
    `).run(userId, userId, requestId)
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error preparing engagement letter:', error)
    res.status(500).json({ error: 'Failed to prepare engagement letter' })
  }
}

// Send engagement letter
export async function sendEngagementLetter(req, res) {
  const { requestId } = req.params
  const userId = req.user?.id
  
  try {
    db.prepare(`
      UPDATE execution_tracking SET
        engagement_letter_sent_date = datetime('now'),
        updated_by = ?,
        updated_at = datetime('now')
      WHERE coi_request_id = ?
    `).run(userId, requestId)
    
    // Update main request table
    db.prepare(`
      UPDATE coi_requests SET
        engagement_letter_issued_date = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(requestId)
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error sending engagement letter:', error)
    res.status(500).json({ error: 'Failed to send engagement letter' })
  }
}

// Record signed engagement letter
export async function recordSignedEngagement(req, res) {
  const { requestId } = req.params
  const userId = req.user?.id
  
  try {
    db.prepare(`
      UPDATE execution_tracking SET
        engagement_letter_signed_date = datetime('now'),
        updated_by = ?,
        updated_at = datetime('now')
      WHERE coi_request_id = ?
    `).run(userId, requestId)
    
    // Update ISQM forms status
    db.prepare(`
      UPDATE coi_requests SET
        isqm_forms_completed = 1,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(requestId)
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error recording signed engagement:', error)
    res.status(500).json({ error: 'Failed to record signed engagement' })
  }
}

// Record countersigned documents
export async function recordCountersigned(req, res) {
  const { requestId } = req.params
  const userId = req.user?.id
  const { document_type } = req.body // 'proposal' or 'engagement'
  
  try {
    const field = document_type === 'proposal' ? 
      'countersigned_proposal_received' : 
      'countersigned_engagement_received'
    
    db.prepare(`
      UPDATE execution_tracking SET
        ${field} = datetime('now'),
        updated_by = ?,
        updated_at = datetime('now')
      WHERE coi_request_id = ?
    `).run(userId, requestId)
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error recording countersigned document:', error)
    res.status(500).json({ error: 'Failed to record countersigned document' })
  }
}

// Get all requests in execution phase
export async function getExecutionQueue(req, res) {
  try {
    const requests = db.prepare(`
      SELECT 
        r.id, r.request_id, r.status, r.stage, r.engagement_code,
        r.proposal_sent_date, r.days_in_monitoring,
        c.client_name,
        et.proposal_prepared_date, et.proposal_sent_date as et_sent_date,
        et.client_response_type, et.engagement_letter_sent_date
      FROM coi_requests r
      JOIN clients c ON r.client_id = c.id
      LEFT JOIN execution_tracking et ON r.id = et.coi_request_id
      WHERE r.status IN ('Approved', 'Active')
      ORDER BY r.updated_at DESC
    `).all()
    
    res.json(requests)
  } catch (error) {
    console.error('Error fetching execution queue:', error)
    res.status(500).json({ error: 'Failed to fetch execution queue' })
  }
}

// Add admin notes
export async function addAdminNotes(req, res) {
  const { requestId } = req.params
  const userId = req.user?.id
  const { notes } = req.body
  
  try {
    db.prepare(`
      UPDATE execution_tracking SET
        admin_notes = COALESCE(admin_notes, '') || '\n' || datetime('now') || ': ' || ?,
        updated_by = ?,
        updated_at = datetime('now')
      WHERE coi_request_id = ?
    `).run(notes, userId, requestId)
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error adding admin notes:', error)
    res.status(500).json({ error: 'Failed to add admin notes' })
  }
}

