import {
  getRequesterSummaryReport,
  getDirectorOverviewReport,
  getComplianceSummaryReport,
  getPartnerPendingApprovalsReport,
  getEngagementCodeSummaryReport,
  getSystemOverviewReport,
  getProspectConversionReport,
  // Phase 2: CRM Attribution Reports
  getLeadSourceEffectivenessReport,
  getFunnelPerformanceReport,
  getInsightsToConversionReport,
  getAttributionByUserReport,
  // Phase 3: Advanced CRM Reports
  getPipelineForecastReport,
  getConversionTrendsReport,
  getPeriodComparisonReport,
  getLostProspectAnalysisReport
} from '../services/reportDataService.js'
import { generatePDFReport } from '../services/pdfExportService.js'
import { generateReportExcel } from '../services/excelExportService.js'
import { logAuditTrail } from '../services/auditTrailService.js'
import { getCachedReportData, cacheReportData } from '../services/reportCacheService.js'

/**
 * Get report data (no export)
 */
export async function getReportData(req, res) {
  try {
    const { role, reportType } = req.params
    const filters = req.body || {}
    const userId = req.userId
    
    // Check cache first (skip cache if includeData is false or page > 1)
    const skipCache = filters.includeData === 'false' || parseInt(filters.page) > 1
    let reportData = skipCache ? null : getCachedReportData(role, reportType, filters)
    
    if (!reportData) {
      // Route to appropriate report function based on role and reportType
    switch (role) {
      case 'requester':
        if (reportType === 'my-requests-summary') {
          reportData = getRequesterSummaryReport(userId, filters)
        // CRM Reports for Requester (sales cycle participant)
        } else if (reportType === 'lead-source-effectiveness') {
          reportData = getLeadSourceEffectivenessReport(userId, filters)
        } else if (reportType === 'funnel-performance') {
          reportData = getFunnelPerformanceReport(userId, filters)
        } else if (reportType === 'insights-to-conversion') {
          reportData = getInsightsToConversionReport(userId, filters)
        } else if (reportType === 'attribution-by-user') {
          reportData = getAttributionByUserReport(userId, filters)
        } else if (reportType === 'pipeline-forecast') {
          reportData = getPipelineForecastReport(userId, filters)
        } else if (reportType === 'conversion-trends') {
          reportData = getConversionTrendsReport(userId, filters)
        } else if (reportType === 'period-comparison') {
          reportData = getPeriodComparisonReport(userId, filters)
        } else if (reportType === 'lost-prospect-analysis') {
          reportData = getLostProspectAnalysisReport(userId, filters)
        } else {
          return res.status(400).json({ error: 'Invalid report type for Requester' })
        }
        break
        
      case 'director':
        if (reportType === 'department-overview') {
          reportData = getDirectorOverviewReport(userId, filters)
        // CRM Reports for Director (sales cycle participant)
        } else if (reportType === 'lead-source-effectiveness') {
          reportData = getLeadSourceEffectivenessReport(userId, filters)
        } else if (reportType === 'funnel-performance') {
          reportData = getFunnelPerformanceReport(userId, filters)
        } else if (reportType === 'insights-to-conversion') {
          reportData = getInsightsToConversionReport(userId, filters)
        } else if (reportType === 'attribution-by-user') {
          reportData = getAttributionByUserReport(userId, filters)
        } else if (reportType === 'pipeline-forecast') {
          reportData = getPipelineForecastReport(userId, filters)
        } else if (reportType === 'conversion-trends') {
          reportData = getConversionTrendsReport(userId, filters)
        } else if (reportType === 'period-comparison') {
          reportData = getPeriodComparisonReport(userId, filters)
        } else if (reportType === 'lost-prospect-analysis') {
          reportData = getLostProspectAnalysisReport(userId, filters)
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
        } else if (reportType === 'lead-source-effectiveness') {
          reportData = getLeadSourceEffectivenessReport(userId, filters)
        } else if (reportType === 'funnel-performance') {
          reportData = getFunnelPerformanceReport(userId, filters)
        } else if (reportType === 'insights-to-conversion') {
          reportData = getInsightsToConversionReport(userId, filters)
        } else if (reportType === 'attribution-by-user') {
          reportData = getAttributionByUserReport(userId, filters)
        // Phase 3 Reports
        } else if (reportType === 'pipeline-forecast') {
          reportData = getPipelineForecastReport(userId, filters)
        } else if (reportType === 'conversion-trends') {
          reportData = getConversionTrendsReport(userId, filters)
        } else if (reportType === 'period-comparison') {
          reportData = getPeriodComparisonReport(userId, filters)
        } else if (reportType === 'lost-prospect-analysis') {
          reportData = getLostProspectAnalysisReport(userId, filters)
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
        } else if (reportType === 'lead-source-effectiveness') {
          reportData = getLeadSourceEffectivenessReport(userId, filters)
        } else if (reportType === 'funnel-performance') {
          reportData = getFunnelPerformanceReport(userId, filters)
        } else if (reportType === 'insights-to-conversion') {
          reportData = getInsightsToConversionReport(userId, filters)
        } else if (reportType === 'attribution-by-user') {
          reportData = getAttributionByUserReport(userId, filters)
        // Phase 3 Reports
        } else if (reportType === 'pipeline-forecast') {
          reportData = getPipelineForecastReport(userId, filters)
        } else if (reportType === 'conversion-trends') {
          reportData = getConversionTrendsReport(userId, filters)
        } else if (reportType === 'period-comparison') {
          reportData = getPeriodComparisonReport(userId, filters)
        } else if (reportType === 'lost-prospect-analysis') {
          reportData = getLostProspectAnalysisReport(userId, filters)
        } else {
          return res.status(400).json({ error: 'Invalid report type for Admin' })
        }
        break
        
      default:
        return res.status(400).json({ error: 'Invalid role' })
      }
      
      // Cache the report data (only cache first page and if includeData is true)
      if (!skipCache && filters.includeData !== 'false' && (!filters.page || parseInt(filters.page) === 1)) {
        const cacheType = reportData.summary ? 'SUMMARY' : 'PAGINATED'
        cacheReportData(role, reportType, filters, reportData, cacheType)
      }
    }
    
    // Audit log: Report generation
    logAuditTrail(
      userId,
      'Report',
      null,
      'REPORT_GENERATED',
      `Generated ${reportType} report for role ${role}`,
      {
        role,
        reportType,
        filters: JSON.stringify(filters),
        timestamp: new Date().toISOString()
      }
    )
    
    res.json(reportData)
  } catch (error) {
    console.error('Error getting report data:', error)
    
    // Audit log: Report generation failure
    logAuditTrail(
      req.userId || null,
      'Report',
      null,
      'REPORT_GENERATION_FAILED',
      `Failed to generate ${req.params.reportType} report: ${error.message}`,
      {
        role: req.params.role,
        reportType: req.params.reportType,
        error: error.message
      }
    )
    
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
    const fileSize = buffer.length
    
    // Audit log: PDF export
    logAuditTrail(
      userId,
      'Report',
      null,
      'REPORT_EXPORTED_PDF',
      `Exported ${reportType} report as PDF`,
      {
        role,
        reportType,
        reportTitle,
        fileSize,
        fileSizeMB: (fileSize / (1024 * 1024)).toFixed(2),
        filters: JSON.stringify(filters),
        timestamp: new Date().toISOString()
      }
    )
    
    // Send file
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}_${new Date().toISOString().split('T')[0]}.pdf"`)
    res.send(buffer)
  } catch (error) {
    console.error('Error exporting PDF report:', error)
    
    // Audit log: PDF export failure
    logAuditTrail(
      req.userId,
      'Report',
      null,
      'REPORT_EXPORT_PDF_FAILED',
      `Failed to export ${req.params.reportType} as PDF: ${error.message}`,
      {
        role: req.params.role,
        reportType: req.params.reportType,
        error: error.message
      }
    )
    
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
    const fileSize = buffer.length
    
    // Audit log: Excel export
    logAuditTrail(
      userId,
      'Report',
      null,
      'REPORT_EXPORTED_EXCEL',
      `Exported ${reportType} report as Excel`,
      {
        role,
        reportType,
        reportTitle,
        filename,
        fileSize,
        fileSizeMB: (fileSize / (1024 * 1024)).toFixed(2),
        filters: JSON.stringify(filters),
        timestamp: new Date().toISOString()
      }
    )
    
    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  } catch (error) {
    console.error('Error exporting Excel report:', error)
    
    // Audit log: Excel export failure
    logAuditTrail(
      req.userId,
      'Report',
      null,
      'REPORT_EXPORT_EXCEL_FAILED',
      `Failed to export ${req.params.reportType} as Excel: ${error.message}`,
      {
        role: req.params.role,
        reportType: req.params.reportType,
        error: error.message
      }
    )
    
    res.status(500).json({ error: error.message || 'Failed to export Excel report' })
  }
}
