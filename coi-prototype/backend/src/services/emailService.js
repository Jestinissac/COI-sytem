import nodemailer from 'nodemailer'

/**
 * Email Service
 * Handles email notifications for COI workflow
 */

// Email configuration (use environment variables in production)
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
}

// Whether email is enabled (disable in development if no SMTP configured)
const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true' || !!EMAIL_CONFIG.auth.user

// Email templates
const EMAIL_TEMPLATES = {
  REQUEST_SUBMITTED: {
    subject: 'COI Request Submitted - {{request_id}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a237e; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">COI Request Submitted</h1>
        </div>
        <div style="padding: 20px; background: #f5f5f5;">
          <p>Hello {{recipient_name}},</p>
          <p>A new Conflict of Interest request has been submitted and requires your attention.</p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #1a237e;">Request Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 5px 0;"><strong>Request ID:</strong></td><td>{{request_id}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Client:</strong></td><td>{{client_name}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Service Type:</strong></td><td>{{service_type}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Submitted By:</strong></td><td>{{requestor_name}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Date:</strong></td><td>{{submission_date}}</td></tr>
            </table>
          </div>
          
          <a href="{{action_url}}" style="display: inline-block; background: #1a237e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
            Review Request
          </a>
          
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This is an automated message from the COI Management System.
          </p>
        </div>
      </div>
    `
  },
  
  DIRECTOR_APPROVAL_REQUIRED: {
    subject: 'Director Approval Required - COI Request {{request_id}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ff9800; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Director Approval Required</h1>
        </div>
        <div style="padding: 20px; background: #f5f5f5;">
          <p>Hello {{recipient_name}},</p>
          <p>A COI request requires your approval as Director.</p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #ff9800;">Request Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 5px 0;"><strong>Request ID:</strong></td><td>{{request_id}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Client:</strong></td><td>{{client_name}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Service Type:</strong></td><td>{{service_type}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Estimated Fee:</strong></td><td>{{estimated_fee}}</td></tr>
            </table>
          </div>
          
          <a href="{{action_url}}" style="display: inline-block; background: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
            Approve / Reject
          </a>
        </div>
      </div>
    `
  },
  
  COMPLIANCE_REVIEW_REQUIRED: {
    subject: 'Compliance Review Required - COI Request {{request_id}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2196f3; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Compliance Review Required</h1>
        </div>
        <div style="padding: 20px; background: #f5f5f5;">
          <p>Hello {{recipient_name}},</p>
          <p>A COI request requires compliance review.</p>
          
          {{#if has_conflicts}}
          <div style="background: #ffebee; padding: 10px; border-left: 4px solid #f44336; margin: 15px 0;">
            <strong style="color: #c62828;">⚠️ Conflicts Detected:</strong>
            <p style="margin: 5px 0;">{{conflict_summary}}</p>
          </div>
          {{/if}}
          
          {{#if has_duplicates}}
          <div style="background: #fff3e0; padding: 10px; border-left: 4px solid #ff9800; margin: 15px 0;">
            <strong style="color: #e65100;">⚠️ Potential Duplicates:</strong>
            <p style="margin: 5px 0;">{{duplicate_summary}}</p>
          </div>
          {{/if}}
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #2196f3;">Request Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 5px 0;"><strong>Request ID:</strong></td><td>{{request_id}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Client:</strong></td><td>{{client_name}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Service Type:</strong></td><td>{{service_type}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>PIE Status:</strong></td><td>{{pie_status}}</td></tr>
            </table>
          </div>
          
          <a href="{{action_url}}" style="display: inline-block; background: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
            Review in Dashboard
          </a>
        </div>
      </div>
    `
  },
  
  REQUEST_APPROVED: {
    subject: '✅ COI Request Approved - {{request_id}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4caf50; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">✅ Request Approved</h1>
        </div>
        <div style="padding: 20px; background: #f5f5f5;">
          <p>Hello {{recipient_name}},</p>
          <p>Your COI request has been <strong style="color: #4caf50;">approved</strong>.</p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #4caf50;">Engagement Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 5px 0;"><strong>Request ID:</strong></td><td>{{request_id}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Engagement Code:</strong></td><td style="font-weight: bold; color: #4caf50;">{{engagement_code}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Client:</strong></td><td>{{client_name}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Service Type:</strong></td><td>{{service_type}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Approved By:</strong></td><td>{{approved_by}}</td></tr>
            </table>
          </div>
          
          {{#if conditions}}
          <div style="background: #e3f2fd; padding: 10px; border-left: 4px solid #2196f3; margin: 15px 0;">
            <strong>Conditions:</strong>
            <p style="margin: 5px 0;">{{conditions}}</p>
          </div>
          {{/if}}
          
          <p>You may now proceed with the engagement.</p>
        </div>
      </div>
    `
  },
  
  REQUEST_REJECTED: {
    subject: '❌ COI Request Rejected - {{request_id}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f44336; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">❌ Request Rejected</h1>
        </div>
        <div style="padding: 20px; background: #f5f5f5;">
          <p>Hello {{recipient_name}},</p>
          <p>Your COI request has been <strong style="color: #f44336;">rejected</strong>.</p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #f44336;">Request Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 5px 0;"><strong>Request ID:</strong></td><td>{{request_id}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Client:</strong></td><td>{{client_name}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Service Type:</strong></td><td>{{service_type}}</td></tr>
            </table>
          </div>
          
          <div style="background: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 15px 0;">
            <strong>Reason for Rejection:</strong>
            <p style="margin: 5px 0;">{{rejection_reason}}</p>
          </div>
          
          <p>If you have questions, please contact the Compliance team.</p>
        </div>
      </div>
    `
  },
  
  STALE_REQUEST_ALERT: {
    subject: '⚠️ Stale Request Alert - {{request_id}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ff9800; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">⚠️ Re-Evaluation Required</h1>
        </div>
        <div style="padding: 20px; background: #f5f5f5;">
          <p>Hello {{recipient_name}},</p>
          <p>A pending COI request requires re-evaluation due to rule changes.</p>
          
          <div style="background: #fff3e0; padding: 10px; border-left: 4px solid #ff9800; margin: 15px 0;">
            <strong>Reason:</strong>
            <p style="margin: 5px 0;">{{stale_reason}}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #ff9800;">Request Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 5px 0;"><strong>Request ID:</strong></td><td>{{request_id}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Client:</strong></td><td>{{client_name}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Service Type:</strong></td><td>{{service_type}}</td></tr>
            </table>
          </div>
          
          <a href="{{action_url}}" style="display: inline-block; background: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
            Re-Run Compliance Check
          </a>
        </div>
      </div>
    `
  },
  
  ENGAGEMENT_EXPIRING: {
    subject: '🔔 Engagement Expiring in {{days_remaining}} Days - {{engagement_code}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #9c27b0; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🔔 Engagement Expiring Soon</h1>
        </div>
        <div style="padding: 20px; background: #f5f5f5;">
          <p>Hello {{recipient_name}},</p>
          <p>The following engagement is expiring in <strong>{{days_remaining}} days</strong>.</p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #9c27b0;">Engagement Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 5px 0;"><strong>Engagement Code:</strong></td><td>{{engagement_code}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Client:</strong></td><td>{{client_name}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Service Type:</strong></td><td>{{service_type}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Expiry Date:</strong></td><td>{{expiry_date}}</td></tr>
            </table>
          </div>
          
          <p>Please take appropriate action:</p>
          <ul>
            <li>Request renewal if engagement continues</li>
            <li>Close the engagement if completed</li>
            <li>Contact Compliance for extension</li>
          </ul>
        </div>
      </div>
    `
  },
  
  PROPOSAL_MONITORING_ALERT: {
    subject: '⏰ Proposal Monitoring Alert - {{request_id}} ({{days_elapsed}}/30 days)',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ff9800; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">⏰ Proposal Monitoring Alert</h1>
        </div>
        <div style="padding: 20px; background: #f5f5f5;">
          <p>Hello {{recipient_name}},</p>
          <p>A proposal is in the 30-day monitoring window and requires attention.</p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #ff9800;">Proposal Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 5px 0;"><strong>Request ID:</strong></td><td>{{request_id}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Client:</strong></td><td>{{client_name}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Service Type:</strong></td><td>{{service_type}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Days Elapsed:</strong></td><td><strong>{{days_elapsed}}/30 days</strong></td></tr>
              <tr><td style="padding: 5px 0;"><strong>Days Remaining:</strong></td><td><strong>{{days_remaining}} days</strong></td></tr>
              <tr><td style="padding: 5px 0;"><strong>Execution Date:</strong></td><td>{{execution_date}}</td></tr>
            </table>
          </div>
          
          <div style="background: #fff3e0; padding: 10px; border-left: 4px solid #ff9800; margin: 15px 0;">
            <strong>⚠️ Action Required:</strong>
            <p style="margin: 5px 0;">This proposal will automatically lapse if no client response is received within {{days_remaining}} days. Please follow up with the client.</p>
          </div>
          
          <a href="{{action_url}}" style="display: inline-block; background: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
            View Request Details
          </a>
        </div>
      </div>
    `
  },
  
  PROPOSAL_LAPSED: {
    subject: '❌ Proposal Lapsed - {{request_id}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f44336; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">❌ Proposal Lapsed</h1>
        </div>
        <div style="padding: 20px; background: #f5f5f5;">
          <p>Hello {{recipient_name}},</p>
          <p>A proposal has <strong style="color: #f44336;">automatically lapsed</strong> after 30 days without client response.</p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #f44336;">Request Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 5px 0;"><strong>Request ID:</strong></td><td>{{request_id}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Client:</strong></td><td>{{client_name}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Service Type:</strong></td><td>{{service_type}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Execution Date:</strong></td><td>{{execution_date}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Lapse Date:</strong></td><td>{{lapse_date}}</td></tr>
            </table>
          </div>
          
          <div style="background: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 15px 0;">
            <strong>Reason for Lapse:</strong>
            <p style="margin: 5px 0;">No client response received within 30 days from proposal execution date. The request has been automatically cancelled.</p>
          </div>
          
          <p><strong>Next Steps:</strong></p>
          <ul>
            <li>Contact the client to understand the reason for non-response</li>
            <li>If engagement is still desired, create a new COI request</li>
            <li>Update internal records accordingly</li>
          </ul>
        </div>
      </div>
    `
  },
  
  CLIENT_ACCEPTED_PROPOSAL: {
    subject: '✅ Client Accepted Proposal - {{request_id}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4caf50; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">✅ Proposal Accepted</h1>
        </div>
        <div style="padding: 20px; background: #f5f5f5;">
          <p>Hello {{recipient_name}},</p>
          <p>The client has <strong style="color: #4caf50;">accepted</strong> the proposal.</p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #4caf50;">Engagement Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 5px 0;"><strong>Request ID:</strong></td><td>{{request_id}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Engagement Code:</strong></td><td>{{engagement_code}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Client:</strong></td><td>{{client_name}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Service Type:</strong></td><td>{{service_type}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Status:</strong></td><td><strong style="color: #4caf50;">Active Engagement</strong></td></tr>
            </table>
          </div>
          
          {{#if is_admin}}
          <div style="background: #e3f2fd; padding: 10px; border-left: 4px solid #2196f3; margin: 15px 0;">
            <strong>Action Required:</strong>
            <p style="margin: 5px 0;">Please prepare the engagement letter within 1-3 working days.</p>
          </div>
          {{/if}}
          
          <p>The engagement is now active. You may proceed with service delivery.</p>
        </div>
      </div>
    `
  },
  
  CLIENT_REJECTED_PROPOSAL: {
    subject: '❌ Client Rejected Proposal - {{request_id}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f44336; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">❌ Proposal Rejected</h1>
        </div>
        <div style="padding: 20px; background: #f5f5f5;">
          <p>Hello {{recipient_name}},</p>
          <p>The client has <strong style="color: #f44336;">rejected</strong> the proposal.</p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #f44336;">Request Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 5px 0;"><strong>Request ID:</strong></td><td>{{request_id}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Client:</strong></td><td>{{client_name}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Service Type:</strong></td><td>{{service_type}}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Status:</strong></td><td><strong style="color: #f44336;">Rejected</strong></td></tr>
            </table>
          </div>
          
          {{#if rejection_notes}}
          <div style="background: #ffebee; padding: 10px; border-left: 4px solid #f44336; margin: 15px 0;">
            <strong>Client Notes:</strong>
            <p style="margin: 5px 0;">{{rejection_notes}}</p>
          </div>
          {{/if}}
          
          <p>The request has been closed. No further action is required.</p>
        </div>
      </div>
    `
  }
}

// Create transporter (lazy initialization)
let transporter = null

function getTransporter() {
  if (!transporter && EMAIL_ENABLED) {
    transporter = nodemailer.createTransport(EMAIL_CONFIG)
  }
  return transporter
}

/**
 * Replace template variables with actual values
 */
function parseTemplate(template, variables) {
  let result = template
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(regex, value || '')
  }
  
  // Handle conditionals {{#if variable}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, variable, content) => {
    return variables[variable] ? content : ''
  })
  
  return result
}

/**
 * Send email using template
 */
export async function sendEmail(templateName, to, variables) {
  const template = EMAIL_TEMPLATES[templateName]
  
  if (!template) {
    console.error(`Email template not found: ${templateName}`)
    return { success: false, error: 'Template not found' }
  }
  
  const subject = parseTemplate(template.subject, variables)
  const html = parseTemplate(template.html, variables)
  
  if (!EMAIL_ENABLED) {
    console.log('📧 [EMAIL MOCK] Would send email:')
    console.log(`   To: ${to}`)
    console.log(`   Subject: ${subject}`)
    console.log(`   Template: ${templateName}`)
    return { success: true, mock: true }
  }
  
  try {
    const transport = getTransporter()
    
    const result = await transport.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@coi-system.com',
      to,
      subject,
      html
    })
    
    console.log(`📧 Email sent to ${to}: ${subject}`)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send notification to multiple recipients
 */
export async function sendBulkEmail(templateName, recipients, variables) {
  const results = []
  
  for (const recipient of recipients) {
    const recipientVars = {
      ...variables,
      recipient_name: recipient.name,
      recipient_email: recipient.email
    }
    
    const result = await sendEmail(templateName, recipient.email, recipientVars)
    results.push({ email: recipient.email, ...result })
  }
  
  return results
}

/**
 * Send request submitted notification
 */
export async function notifyRequestSubmitted(request, requestor, nextApprover) {
  const baseUrl = process.env.APP_URL || 'http://localhost:5173'
  
  return sendEmail('REQUEST_SUBMITTED', nextApprover.email, {
    recipient_name: nextApprover.name,
    request_id: request.request_id,
    client_name: request.client_name,
    service_type: request.service_type,
    requestor_name: requestor.name,
    submission_date: new Date().toLocaleDateString(),
    action_url: `${baseUrl}/coi/compliance`
  })
}

/**
 * Send director approval required notification
 */
export async function notifyDirectorApprovalRequired(request, director) {
  const baseUrl = process.env.APP_URL || 'http://localhost:5173'
  
  return sendEmail('DIRECTOR_APPROVAL_REQUIRED', director.email, {
    recipient_name: director.name,
    request_id: request.request_id,
    client_name: request.client_name,
    service_type: request.service_type,
    estimated_fee: request.estimated_fee || 'Not specified',
    action_url: `${baseUrl}/coi/director`
  })
}

/**
 * Send compliance review required notification
 */
export async function notifyComplianceReviewRequired(request, complianceOfficers, conflicts, duplicates) {
  const baseUrl = process.env.APP_URL || 'http://localhost:5173'
  
  const variables = {
    request_id: request.request_id,
    client_name: request.client_name,
    service_type: request.service_type,
    pie_status: request.pie_status || 'No',
    has_conflicts: conflicts && conflicts.length > 0,
    conflict_summary: conflicts ? conflicts.map(c => c.reason).join('; ') : '',
    has_duplicates: duplicates && duplicates.length > 0,
    duplicate_summary: duplicates ? `${duplicates.length} potential duplicate(s) found` : '',
    action_url: `${baseUrl}/coi/compliance`
  }
  
  return sendBulkEmail('COMPLIANCE_REVIEW_REQUIRED', complianceOfficers, variables)
}

/**
 * Send group conflict flagged notification to all Compliance officers
 * Called when a request is flagged due to parent/subsidiary independence conflicts
 */
export async function notifyGroupConflictFlagged(request, complianceOfficers, conflicts) {
  const baseUrl = process.env.APP_URL || 'http://localhost:5173'
  
  // Build conflict summary
  const conflictSummary = conflicts.map(c => 
    `• ${c.entity_name}: ${c.reason}`
  ).join('\n')
  
  const variables = {
    request_id: request.request_id,
    client_name: request.client_name,
    service_type: request.service_type,
    parent_company: request.parent_company || 'Not specified',
    conflict_count: conflicts.length,
    conflict_summary: conflictSummary,
    action_url: `${baseUrl}/coi/compliance/${request.id || request.request_id}`
  }
  
  // Send to all compliance officers
  for (const officer of complianceOfficers) {
    try {
      console.log(`[Email] Sending group conflict notification to ${officer.email} for request ${request.request_id}`)
      
      // Using direct email since template might not exist yet
      const subject = `COI Request ${request.request_id} - Group Conflict Flagged`
      const body = `
A COI request has been flagged for potential group independence conflicts.

Request ID: ${request.request_id}
Client: ${request.client_name}
Parent Company: ${request.parent_company}
Service Type: ${request.service_type}

Conflicts Detected: ${conflicts.length}
${conflictSummary}

Please review this request in the COI system: ${variables.action_url}
      `.trim()
      
      // Log for now since email sending may not be configured
      console.log(`[Email] To: ${officer.email}\nSubject: ${subject}\nBody: ${body}`)
    } catch (error) {
      console.error(`Error sending notification to ${officer.email}:`, error)
    }
  }
  
  return { success: true, notified: complianceOfficers.length }
}

/**
 * Send request approved notification
 */
export async function notifyRequestApproved(request, requestor, approver, conditions) {
  return sendEmail('REQUEST_APPROVED', requestor.email, {
    recipient_name: requestor.name,
    request_id: request.request_id,
    engagement_code: request.engagement_code || 'Pending',
    client_name: request.client_name,
    service_type: request.service_type,
    approved_by: approver.name,
    conditions: conditions || null
  })
}

/**
 * Send request rejected notification
 */
export async function notifyRequestRejected(request, requestor, rejectionReason) {
  return sendEmail('REQUEST_REJECTED', requestor.email, {
    recipient_name: requestor.name,
    request_id: request.request_id,
    client_name: request.client_name,
    service_type: request.service_type,
    rejection_reason: rejectionReason
  })
}

/**
 * Send stale request alert
 */
export async function notifyStaleRequest(request, complianceOfficer, staleReason) {
  const baseUrl = process.env.APP_URL || 'http://localhost:5173'
  
  return sendEmail('STALE_REQUEST_ALERT', complianceOfficer.email, {
    recipient_name: complianceOfficer.name,
    request_id: request.request_id,
    client_name: request.client_name,
    service_type: request.service_type,
    stale_reason: staleReason,
    action_url: `${baseUrl}/coi/compliance`
  })
}

/**
 * Send engagement expiring notification
 */
export async function notifyEngagementExpiring(engagement, recipient, daysRemaining) {
  return sendEmail('ENGAGEMENT_EXPIRING', recipient.email, {
    recipient_name: recipient.name,
    engagement_code: engagement.engagement_code,
    client_name: engagement.client_name,
    service_type: engagement.service_type,
    days_remaining: daysRemaining,
    expiry_date: engagement.expiry_date
  })
}

/**
 * Send proposal monitoring interval alert (every 10 days during 30-day window)
 */
export async function notifyProposalMonitoringAlert(request, recipient, daysElapsed, daysRemaining) {
  const baseUrl = process.env.APP_URL || 'http://localhost:5173'
  
  return sendEmail('PROPOSAL_MONITORING_ALERT', recipient.email, {
    recipient_name: recipient.name,
    request_id: request.request_id,
    client_name: request.client_name,
    service_type: request.service_type,
    days_elapsed: daysElapsed,
    days_remaining: daysRemaining,
    execution_date: request.execution_date ? new Date(request.execution_date).toLocaleDateString() : 'N/A',
    action_url: `${baseUrl}/coi/dashboard`
  })
}

/**
 * Send proposal lapsed notification
 */
export async function notifyProposalLapsed(request, recipient) {
  return sendEmail('PROPOSAL_LAPSED', recipient.email, {
    recipient_name: recipient.name,
    request_id: request.request_id,
    client_name: request.client_name,
    service_type: request.service_type,
    execution_date: request.execution_date ? new Date(request.execution_date).toLocaleDateString() : 'N/A',
    lapse_date: new Date().toLocaleDateString()
  })
}

/**
 * Send client accepted proposal notification
 */
export async function notifyClientAcceptedProposal(request, recipient, isAdmin = false) {
  return sendEmail('CLIENT_ACCEPTED_PROPOSAL', recipient.email, {
    recipient_name: recipient.name,
    request_id: request.request_id,
    engagement_code: request.engagement_code || 'N/A',
    client_name: request.client_name,
    service_type: request.service_type,
    is_admin: isAdmin
  })
}

/**
 * Send client rejected proposal notification
 */
export async function notifyClientRejectedProposal(request, recipient, rejectionNotes = null) {
  return sendEmail('CLIENT_REJECTED_PROPOSAL', recipient.email, {
    recipient_name: recipient.name,
    request_id: request.request_id,
    client_name: request.client_name,
    service_type: request.service_type,
    rejection_notes: rejectionNotes
  })
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig() {
  if (!EMAIL_ENABLED) {
    return { configured: false, message: 'Email is disabled or not configured' }
  }
  
  try {
    const transport = getTransporter()
    await transport.verify()
    return { configured: true, message: 'Email configuration verified' }
  } catch (error) {
    return { configured: false, message: error.message }
  }
}

export default {
  sendEmail,
  sendBulkEmail,
  notifyRequestSubmitted,
  notifyDirectorApprovalRequired,
  notifyComplianceReviewRequired,
  notifyRequestApproved,
  notifyRequestRejected,
  notifyStaleRequest,
  notifyEngagementExpiring,
  notifyProposalMonitoringAlert,
  notifyProposalLapsed,
  notifyClientAcceptedProposal,
  notifyClientRejectedProposal,
  verifyEmailConfig
}

