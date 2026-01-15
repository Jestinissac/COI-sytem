import { appendFileSync } from 'fs'
import { getDatabase } from '../database/init.js'

const db = getDatabase()

export function sendEmail(to, subject, body, metadata = {}) {
  const timestamp = new Date().toISOString()
  
  // Log to console
  console.log('╔════════════════════════════════════════════════════════════════')
  console.log('║ 📧 MOCK EMAIL SENT')
  console.log('╠════════════════════════════════════════════════════════════════')
  console.log(`║ To: ${to}`)
  console.log(`║ Subject: ${subject}`)
  console.log(`║ Time: ${timestamp}`)
  console.log('╠════════════════════════════════════════════════════════════════')
  console.log(`║ Body:`)
  console.log(`║ ${body.replace(/\n/g, '\n║ ')}`)
  console.log('╚════════════════════════════════════════════════════════════════')
  
  // Log to file
  try {
    const logEntry = `[${timestamp}] TO: ${to} | SUBJECT: ${subject}\n`
    appendFileSync('/tmp/coi-emails.log', logEntry)
  } catch (error) {
    console.error('Failed to write email log:', error.message)
  }
  
  return { success: true, message: 'Email sent (mock)' }
}

export function sendApprovalNotification(requestId, approverName, nextRole, restrictions = null) {
  const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(requestId)
  if (!request) return
  
  const nextUser = getNextApprover(request.department, nextRole)
  if (!nextUser) return
  
  const restrictionsText = restrictions ? `

⚠️ APPROVED WITH RESTRICTIONS:
${restrictions}

Please ensure these restrictions are noted and followed.` : ''
  
  const subject = `COI Request ${request.request_id} - Pending Your Approval${restrictions ? ' (With Restrictions)' : ''}`
  const body = `Dear ${nextUser.name},

A Conflict of Interest request has been approved by ${approverName} and is now pending your review.

Request ID: ${request.request_id}
Department: ${request.department}
Service Type: ${request.service_type}
Current Status: Pending ${nextRole} Approval${restrictionsText}

Please log in to the COI system to review and approve this request:
http://localhost:5173/coi

Best regards,
COI System`

  return sendEmail(nextUser.email, subject, body, { requestId, role: nextRole, restrictions })
}

export function sendNeedMoreInfoNotification(requestId, approverName, infoRequired) {
  const request = db.prepare(`
    SELECT r.*, u.name as requester_name, u.email as requester_email
    FROM coi_requests r
    INNER JOIN users u ON r.requester_id = u.id
    WHERE r.id = ?
  `).get(requestId)
  
  if (!request) return
  
  const subject = `COI Request ${request.request_id} - Additional Information Required`
  const body = `Dear ${request.requester_name},

Your Conflict of Interest request requires additional information before it can be processed further.

Request ID: ${request.request_id}
Requested By: ${approverName}

📋 INFORMATION REQUIRED:
${infoRequired}

Please log in to the COI system, update your request with the requested information, and re-submit:
http://localhost:5173/coi

Best regards,
COI System`

  return sendEmail(request.requester_email, subject, body, { requestId, infoRequired })
}

export function sendRejectionNotification(requestId, rejectorName, reason, rejectionType = 'fixable', rejectionCategory = null) {
  const request = db.prepare(`
    SELECT r.*, u.name as requester_name, u.email as requester_email
    FROM coi_requests r
    INNER JOIN users u ON r.requester_id = u.id
    WHERE r.id = ?
  `).get(requestId)
  
  if (!request) return
  
  const isPermanent = rejectionType === 'permanent'
  const subject = `COI Request ${request.request_id} - Rejected${isPermanent ? ' (Final)' : ''}`
  
  // Differentiate message based on rejection type
  const resubmissionGuidance = isPermanent
    ? `This rejection is final and cannot be resubmitted. If circumstances have changed significantly, please create a new COI request.`
    : `You can modify and resubmit this request after addressing the feedback. Log in to the COI system and click "Modify and Resubmit" to update your request.`
  
  // Add rejection category if provided (for Compliance and above)
  const categoryInfo = rejectionCategory ? `\nRejection Category: ${rejectionCategory}` : ''
  
  const body = `Dear ${request.requester_name},

Your Conflict of Interest request has been rejected by ${rejectorName}.

Request ID: ${request.request_id}
Department: ${request.department}
Service Type: ${request.service_type}
Rejection Type: ${isPermanent ? 'Permanent (Final)' : 'Fixable (Can Resubmit)'}${categoryInfo}
Rejection Reason: ${reason}

${resubmissionGuidance}

Please log in to the COI system to review the details:
http://localhost:5173/coi/request/${requestId}

Best regards,
COI System`

  return sendEmail(request.requester_email, subject, body, { requestId, reason, rejectionType, rejectionCategory })
}

export function sendEngagementCodeNotification(requestId, engagementCode) {
  const request = db.prepare(`
    SELECT r.*, u.name as requester_name, u.email as requester_email
    FROM coi_requests r
    INNER JOIN users u ON r.requester_id = u.id
    WHERE r.id = ?
  `).get(requestId)
  
  if (!request) return
  
  // Notify requester
  const requesterSubject = `COI Request ${request.request_id} - Engagement Code Generated`
  const requesterBody = `Dear ${request.requester_name},

Your Conflict of Interest request has been approved and an engagement code has been generated.

Request ID: ${request.request_id}
Engagement Code: ${engagementCode}
Department: ${request.department}
Service Type: ${request.service_type}

You can now proceed with client engagement activities. Please log in to the COI system for full details:
http://localhost:5173/coi

Best regards,
COI System`

  sendEmail(request.requester_email, requesterSubject, requesterBody, { requestId, engagementCode })
  
  // Notify Admin team
  const adminUsers = db.prepare('SELECT * FROM users WHERE role = ?').all('Admin')
  adminUsers.forEach(admin => {
    const adminSubject = `Action Required: Execute Proposal for ${request.request_id}`
    const adminBody = `Dear ${admin.name},

A new engagement code has been generated and requires proposal execution.

Request ID: ${request.request_id}
Engagement Code: ${engagementCode}
Department: ${request.department}
Service Type: ${request.service_type}

Please execute the proposal and update PRMS:
http://localhost:5173/coi/admin

Best regards,
COI System`

    sendEmail(admin.email, adminSubject, adminBody, { requestId, engagementCode })
  })
  
  // Notify Partner (if assigned)
  if (request.partner_approved_by) {
    const partner = db.prepare('SELECT * FROM users WHERE id = ?').get(request.partner_approved_by)
    if (partner && partner.email) {
      const partnerSubject = `Engagement Code Generated - ${request.request_id}`
      const partnerBody = `Dear ${partner.name},

An engagement code has been generated for a COI request that you approved.

Request ID: ${request.request_id}
Engagement Code: ${engagementCode}
Department: ${request.department}
Service Type: ${request.service_type}
Client: ${request.client_name || 'Not specified'}

The engagement code is now available for tracking and monitoring purposes.

Please log in to the COI system for full details:
http://localhost:5173/coi

Best regards,
COI System`

      sendEmail(partner.email, partnerSubject, partnerBody, { requestId, engagementCode })
    }
  }
  
  return { success: true }
}

export function sendProposalExecutedNotification(requestId, projectId) {
  const request = db.prepare(`
    SELECT r.*, u.name as requester_name, u.email as requester_email
    FROM coi_requests r
    INNER JOIN users u ON r.requester_id = u.id
    WHERE r.id = ?
  `).get(requestId)
  
  if (!request) return
  
  const subject = `COI Request ${request.request_id} - Proposal Executed`
  const body = `Dear ${request.requester_name},

The proposal for your Conflict of Interest request has been executed in PRMS.

Request ID: ${request.request_id}
Project ID: ${projectId}
Status: Active Engagement

Your engagement is now active. Please proceed with service delivery according to the approved scope.

Log in to view full details:
http://localhost:5173/coi

Best regards,
COI System`

  return sendEmail(request.requester_email, subject, body, { requestId, projectId })
}

function getNextApprover(department, role) {
  // First, try to find an active approver for the requested role
  let query = 'SELECT * FROM users WHERE role = ? AND is_active = 1'
  const params = [role]
  
  if (role === 'Director' || role === 'Compliance') {
    query += ' AND department = ?'
    params.push(department)
  }
  
  query += ' ORDER BY RANDOM() LIMIT 1'  // Random selection among available approvers
  
  const approver = db.prepare(query).get(...params)
  
  if (approver) {
    return approver
  }
  
  // No active approver found - escalate to Admin
  console.log(`[Escalation] No active ${role} approvers available${department ? ` for department ${department}` : ''}. Escalating to Admin.`)
  
  const admins = db.prepare(`
    SELECT * FROM users WHERE role IN ('Admin', 'Super Admin') AND is_active = 1
  `).all()
  
  if (admins.length > 0) {
    // Notify admins about the unavailable approvers
    sendEscalationNotification(role, department, admins)
    return admins[0]  // Return an admin to handle the request
  }
  
  // Fallback: return any admin (even inactive) as last resort
  const anyAdmin = db.prepare(`SELECT * FROM users WHERE role IN ('Admin', 'Super Admin') LIMIT 1`).get()
  if (anyAdmin) {
    console.warn(`[Critical] No active admins available. Using ${anyAdmin.name} as fallback.`)
    return anyAdmin
  }
  
  return null
}

// Send escalation notification to admins when approvers are unavailable
function sendEscalationNotification(role, department, admins) {
  const message = `No active ${role} approvers available${department ? ` for department ${department}` : ''}. Manual reassignment may be required.`
  
  console.log(`[Escalation Notification] ${message}`)
  
  for (const admin of admins) {
    // Log for now - actual email would be sent here
    console.log(`[Email] Sending escalation notification to ${admin.email}: ${message}`)
  }
}

// Requirement 5: Notify requester when approver is unavailable
export function sendApproverUnavailableNotification(requestId, approverName, approverRole, unavailableReason, unavailableUntil) {
  const request = db.prepare(`
    SELECT r.*, u.name as requester_name, u.email as requester_email
    FROM coi_requests r
    INNER JOIN users u ON r.requester_id = u.id
    WHERE r.id = ?
  `).get(requestId)
  
  if (!request) return
  
  const untilDate = unavailableUntil ? new Date(unavailableUntil).toLocaleDateString() : 'an unknown date'
  const reasonText = unavailableReason || 'on leave'
  
  const subject = `COI Request ${request.request_id} - Approval Delayed (Approver Unavailable)`
  const body = `Dear ${request.requester_name},

Your Conflict of Interest request is pending approval, but the assigned approver is currently unavailable.

Request ID: ${request.request_id}
Assigned Approver: ${approverName} (${approverRole})
Status: ${reasonText}
Expected Return: ${untilDate}

Your request will be reviewed upon the approver's return. If this is urgent, please contact your department administrator.

Request Details:
- Client: ${request.client_name || 'N/A'}
- Service Type: ${request.service_type || 'N/A'}
- Current Status: ${request.status}

You can view your request at:
http://localhost:5173/coi/request/${request.id}

Best regards,
COI System`

  return sendEmail(request.requester_email, subject, body, { 
    requestId, 
    approverName, 
    approverRole, 
    unavailableReason, 
    unavailableUntil 
  })
}

