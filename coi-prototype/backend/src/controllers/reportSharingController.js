/**
 * Report Sharing Controller
 */

import {
  createReportShare,
  getSharedReport,
  revokeShare,
  getShareActivity,
  getUserShares
} from '../services/reportSharingService.js'
import { logAuditTrail } from '../services/auditTrailService.js'

/**
 * Create a shareable report link
 */
export async function createShare(req, res) {
  try {
    const { role, reportType } = req.params
    const userId = req.userId
    const {
      password,
      expiresInDays,
      accessLevel,
      allowedRoles,
      allowedUsers,
      ipWhitelist
    } = req.body

    const reportFilters = req.body.filters || {}

    const share = createReportShare(
      userId,
      `${role}/${reportType}`,
      reportFilters,
      {
        password,
        expiresInDays,
        accessLevel,
        allowedRoles,
        allowedUsers,
        ipWhitelist
      }
    )

    // Audit log
    logAuditTrail(
      userId,
      'Report',
      null,
      'REPORT_SHARED',
      `Created shareable link for ${reportType}`,
      {
        role,
        reportType,
        shareToken: share.shareToken,
        accessLevel,
        expiresAt: share.expiresAt
      }
    )

    res.json(share)
  } catch (error) {
    console.error('Error creating share:', error)
    res.status(500).json({ error: error.message || 'Failed to create share' })
  }
}

/**
 * Access shared report
 */
export async function accessSharedReport(req, res) {
  try {
    const { token } = req.params
    const { password } = req.body
    const userId = req.userId || null
    const ipAddress = req.ip || req.connection.remoteAddress
    const userAgent = req.get('user-agent')

    const share = getSharedReport(token, {
      password,
      userId,
      ipAddress,
      userAgent
    })

    res.json(share)
  } catch (error) {
    console.error('Error accessing shared report:', error)
    res.status(400).json({ error: error.message || 'Failed to access shared report' })
  }
}

/**
 * Revoke share
 */
export async function revokeShareLink(req, res) {
  try {
    const { token } = req.params
    const userId = req.userId

    const result = revokeShare(token, userId)

    // Audit log
    logAuditTrail(
      userId,
      'Report',
      null,
      'REPORT_SHARE_REVOKED',
      `Revoked shareable link`,
      { shareToken: token }
    )

    res.json(result)
  } catch (error) {
    console.error('Error revoking share:', error)
    res.status(400).json({ error: error.message || 'Failed to revoke share' })
  }
}

/**
 * Get share activity
 */
export async function getShareActivityLog(req, res) {
  try {
    const { token } = req.params
    const userId = req.userId

    const activity = getShareActivity(token, userId)

    res.json({ activity })
  } catch (error) {
    console.error('Error getting share activity:', error)
    res.status(400).json({ error: error.message || 'Failed to get share activity' })
  }
}

/**
 * Get user's shares
 */
export async function getMyShares(req, res) {
  try {
    const userId = req.userId

    const shares = getUserShares(userId)

    res.json({ shares })
  } catch (error) {
    console.error('Error getting user shares:', error)
    res.status(500).json({ error: error.message || 'Failed to get shares' })
  }
}

/**
 * Send report via email
 */
export async function sendReportEmail(req, res) {
  try {
    const { role, reportType } = req.params
    const userId = req.userId
    const { filters, recipients, message } = req.body

    // Get report data
    const { getRequesterSummaryReport, getDirectorOverviewReport, getComplianceSummaryReport } = await import('../services/reportDataService.js')
    
    let reportData
    switch (role) {
      case 'requester':
        reportData = getRequesterSummaryReport(userId, filters)
        break
      case 'director':
        reportData = getDirectorOverviewReport(userId, filters)
        break
      case 'compliance':
        reportData = getComplianceSummaryReport(userId, filters)
        break
      default:
        return res.status(400).json({ error: 'Invalid role for email sharing' })
    }

    // Generate PDF
    const { generatePDFReport } = await import('../services/pdfExportService.js')
    const pdfBuffer = await generatePDFReport(reportData, reportType, `${reportType} Report`, filters)

    // Send email with PDF attachment using nodemailer directly
    const nodemailer = (await import('nodemailer')).default
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    })

    // Send to all recipients
    for (const recipient of recipients) {
      await transporter.sendMail({
        from: process.env.SMTP_USER || 'noreply@coi-system.com',
        to: recipient,
        subject: `COI Report: ${reportType}`,
        text: message || `Please find attached the ${reportType} report.`,
        html: `<p>${message || `Please find attached the ${reportType} report.`}</p>`,
        attachments: [{
          filename: `${reportType}_${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer
        }]
      })
    }

    // Audit log
    logAuditTrail(
      userId,
      'Report',
      null,
      'REPORT_EMAILED',
      `Sent ${reportType} report via email`,
      {
        role,
        reportType,
        recipients: recipients.join(', ')
      }
    )

    res.json({ success: true, message: 'Report sent via email successfully' })
  } catch (error) {
    console.error('Error sending report email:', error)
    res.status(500).json({ error: error.message || 'Failed to send email' })
  }
}
