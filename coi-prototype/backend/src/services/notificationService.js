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

export function sendRejectionNotification(requestId, rejectorName, reason) {
  const request = db.prepare(`
    SELECT r.*, u.name as requester_name, u.email as requester_email
    FROM coi_requests r
    INNER JOIN users u ON r.requester_id = u.id
    WHERE r.id = ?
  `).get(requestId)
  
  if (!request) return
  
  const subject = `COI Request ${request.request_id} - Rejected`
  const body = `Dear ${request.requester_name},

Your Conflict of Interest request has been rejected by ${rejectorName}.

Request ID: ${request.request_id}
Department: ${request.department}
Service Type: ${request.service_type}
Rejection Reason: ${reason}

Please log in to the COI system to review the feedback and make necessary changes:
http://localhost:5173/coi

Best regards,
COI System`

  return sendEmail(request.requester_email, subject, body, { requestId, reason })
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
  let query = 'SELECT * FROM users WHERE role = ?'
  const params = [role]
  
  if (role === 'Director' || role === 'Compliance') {
    query += ' AND department = ?'
    params.push(department)
  }
  
  query += ' LIMIT 1'
  
  return db.prepare(query).get(...params)
}

