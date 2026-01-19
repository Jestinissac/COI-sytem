import { getReportData, type ReportFilters } from './reportService'

/**
 * Map user role to appropriate report type for landing page summary
 */
function getReportTypeForRole(role: string): { rolePath: string; reportType: string } | null {
  const roleMapping: Record<string, { rolePath: string; reportType: string }> = {
    'Requester': { rolePath: 'requester', reportType: 'my-requests-summary' },
    'Director': { rolePath: 'director', reportType: 'department-overview' },
    'Compliance': { rolePath: 'compliance', reportType: 'review-summary' },
    'Partner': { rolePath: 'partner', reportType: 'pending-approvals' },
    'Admin': { rolePath: 'admin', reportType: 'system-overview' },
    'Super Admin': { rolePath: 'admin', reportType: 'system-overview' }
  }
  
  return roleMapping[role] || null
}

/**
 * Fetch summary data for landing page charts
 * Returns summary data in format expected by ReportCharts component
 */
export async function getLandingPageSummary(role: string): Promise<{
  byStatus?: Record<string, number>
  byServiceType?: Record<string, number>
  byClient?: Record<string, number>
} | null> {
  try {
    const reportConfig = getReportTypeForRole(role)
    if (!reportConfig) {
      return null
    }

    // Fetch summary data with minimal filters (just get overview)
    const reportData = await getReportData(reportConfig.rolePath, reportConfig.reportType, {
      includeData: false, // Only get summary, not full data
      page: 1,
      pageSize: 1
    })

    // Extract summary data
    if (reportData.summary) {
      return {
        byStatus: reportData.summary.byStatus,
        byServiceType: reportData.summary.byServiceType,
        byClient: reportData.summary.byClient
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching landing page summary:', error)
    return null
  }
}
