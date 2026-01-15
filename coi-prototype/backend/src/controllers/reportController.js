import {
  getRequesterSummaryReport,
  getDirectorOverviewReport,
  getComplianceSummaryReport,
  getPartnerPendingApprovalsReport,
  getEngagementCodeSummaryReport,
  getSystemOverviewReport,
  getProspectConversionReport
} from '../services/reportDataService.js'
import { generatePDFReport } from '../services/pdfExportService.js'
import { generateReportExcel } from '../services/excelExportService.js'

/**
 * Get report data (no export)
 */
export async function getReportData(req, res) {
  try {
    const { role, reportType } = req.params
    const filters = req.body || {}
    const userId = req.userId
    
    let reportData
    
    // Route to appropriate report function based on role and reportType
    switch (role) {
      case 'requester':
        if (reportType === 'my-requests-summary') {
          reportData = getRequesterSummaryReport(userId, filters)
        } else {
          return res.status(400).json({ error: 'Invalid report type for Requester' })
        }
        break
        
      case 'director':
        if (reportType === 'department-overview') {
          reportData = getDirectorOverviewReport(userId, filters)
        } else {
          return res.status(400).json({ error: 'Invalid report type for Director' })
        }
        break
        
      case 'compliance':
        if (reportType === 'review-summary') {
          reportData = getComplianceSummaryReport(userId, filters)
        } else {
          return res.status(400).json({ error: 'Invalid report type for Compliance' })
        }
        break
        
      case 'partner':
        if (reportType === 'pending-approvals') {
          reportData = getPartnerPendingApprovalsReport(userId, filters)
        } else {
          return res.status(400).json({ error: 'Invalid report type for Partner' })
        }
        break
        
      case 'finance':
        if (reportType === 'engagement-code-summary') {
          reportData = getEngagementCodeSummaryReport(userId, filters)
        } else {
          return res.status(400).json({ error: 'Invalid report type for Finance' })
        }
        break
        
      case 'admin':
        if (reportType === 'system-overview') {
          reportData = getSystemOverviewReport(userId, filters)
        } else if (reportType === 'prospect-conversion') {
          reportData = getProspectConversionReport(userId, filters)
        } else {
          return res.status(400).json({ error: 'Invalid report type for Admin' })
        }
        break
        
      default:
        return res.status(400).json({ error: 'Invalid role' })
    }
    
    res.json(reportData)
  } catch (error) {
    console.error('Error getting report data:', error)
    res.status(500).json({ error: error.message || 'Failed to get report data' })
  }
}

/**
 * Export report as PDF
 */
export async function exportReportPDF(req, res) {
  try {
    const { role, reportType } = req.params
    const filters = req.body || {}
    const userId = req.userId
    
    // Get report data
    let reportData
    let reportTitle
    
    switch (role) {
      case 'requester':
        if (reportType === 'my-requests-summary') {
          reportData = getRequesterSummaryReport(userId, filters)
          reportTitle = 'My Requests Summary Report'
        } else {
          return res.status(400).json({ error: 'Invalid report type' })
        }
        break
        
      case 'director':
        if (reportType === 'department-overview') {
          reportData = getDirectorOverviewReport(userId, filters)
          reportTitle = 'Department Requests Overview'
        } else {
          return res.status(400).json({ error: 'Invalid report type' })
        }
        break
        
      case 'compliance':
        if (reportType === 'review-summary') {
          reportData = getComplianceSummaryReport(userId, filters)
          reportTitle = 'Compliance Review Summary'
        } else {
          return res.status(400).json({ error: 'Invalid report type' })
        }
        break
        
      case 'partner':
        if (reportType === 'pending-approvals') {
          reportData = getPartnerPendingApprovalsReport(userId, filters)
          reportTitle = 'Pending Partner Approvals'
        } else {
          return res.status(400).json({ error: 'Invalid report type' })
        }
        break
        
      case 'finance':
        if (reportType === 'engagement-code-summary') {
          reportData = getEngagementCodeSummaryReport(userId, filters)
          reportTitle = 'Engagement Code Summary'
        } else {
          return res.status(400).json({ error: 'Invalid report type' })
        }
        break
        
      case 'admin':
        if (reportType === 'system-overview') {
          reportData = getSystemOverviewReport(userId, filters)
          reportTitle = 'System Overview Report'
        } else if (reportType === 'prospect-conversion') {
          reportData = getProspectConversionReport(userId, filters)
          reportTitle = 'Prospect Conversion Report'
        } else {
          return res.status(400).json({ error: 'Invalid report type' })
        }
        break
        
      default:
        return res.status(400).json({ error: 'Invalid role' })
    }
    
    // Generate PDF
    const buffer = await generatePDFReport(reportData, reportType, reportTitle, filters)
    
    // Send file
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}_${new Date().toISOString().split('T')[0]}.pdf"`)
    res.send(buffer)
  } catch (error) {
    console.error('Error exporting PDF report:', error)
    res.status(500).json({ error: error.message || 'Failed to export PDF report' })
  }
}

/**
 * Export report as Excel
 */
export async function exportReportExcel(req, res) {
  try {
    const { role, reportType } = req.params
    const filters = req.body || {}
    const userId = req.userId
    
    // Get report data
    let reportData
    let reportTitle
    
    switch (role) {
      case 'requester':
        if (reportType === 'my-requests-summary') {
          reportData = getRequesterSummaryReport(userId, filters)
          reportTitle = 'My Requests Summary Report'
        } else {
          return res.status(400).json({ error: 'Invalid report type' })
        }
        break
        
      case 'director':
        if (reportType === 'department-overview') {
          reportData = getDirectorOverviewReport(userId, filters)
          reportTitle = 'Department Requests Overview'
        } else {
          return res.status(400).json({ error: 'Invalid report type' })
        }
        break
        
      case 'compliance':
        if (reportType === 'review-summary') {
          reportData = getComplianceSummaryReport(userId, filters)
          reportTitle = 'Compliance Review Summary'
        } else {
          return res.status(400).json({ error: 'Invalid report type' })
        }
        break
        
      case 'partner':
        if (reportType === 'pending-approvals') {
          reportData = getPartnerPendingApprovalsReport(userId, filters)
          reportTitle = 'Pending Partner Approvals'
        } else {
          return res.status(400).json({ error: 'Invalid report type' })
        }
        break
        
      case 'finance':
        if (reportType === 'engagement-code-summary') {
          reportData = getEngagementCodeSummaryReport(userId, filters)
          reportTitle = 'Engagement Code Summary'
        } else {
          return res.status(400).json({ error: 'Invalid report type' })
        }
        break
        
      case 'admin':
        if (reportType === 'system-overview') {
          reportData = getSystemOverviewReport(userId, filters)
          reportTitle = 'System Overview Report'
        } else if (reportType === 'prospect-conversion') {
          reportData = getProspectConversionReport(userId, filters)
          reportTitle = 'Prospect Conversion Report'
        } else {
          return res.status(400).json({ error: 'Invalid report type' })
        }
        break
        
      default:
        return res.status(400).json({ error: 'Invalid role' })
    }
    
    // Generate Excel
    const { buffer, filename } = await generateReportExcel(reportData, reportType, reportTitle, filters)
    
    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  } catch (error) {
    console.error('Error exporting Excel report:', error)
    res.status(500).json({ error: error.message || 'Failed to export Excel report' })
  }
}
