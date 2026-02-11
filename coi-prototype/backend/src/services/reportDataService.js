import { getDatabase } from '../database/init.js'
import { getUserById } from '../utils/userUtils.js'
import { calculatePagination, getCountQuery, formatPaginationResponse } from '../utils/pagination.js'
import { isProduction } from '../config/environment.js'

const db = getDatabase()

// Default pagination settings
const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 500
const MAX_EXPORT_RECORDS = 10000 // Limit exports to prevent memory issues

/**
 * Apply role-based data filtering for reports
 */
function applyRoleFilters(user, baseQuery, params = []) {
  if (user.role === 'Requester') {
    baseQuery += ' AND r.requester_id = ?'
    params.push(user.id)
  } else if (user.role === 'Director') {
    // Get team member IDs
    const teamMembers = db.prepare(`
      SELECT id FROM users WHERE director_id = ? AND department = ?
    `).all(user.id, user.department)
    
    const teamMemberIds = teamMembers.map(tm => tm.id)
    teamMemberIds.push(user.id) // Include director's own requests
    
    if (teamMemberIds.length > 0) {
      const placeholders = teamMemberIds.map(() => '?').join(',')
      baseQuery += ` AND r.requester_id IN (${placeholders})`
      params.push(...teamMemberIds)
    } else {
      baseQuery += ' AND r.requester_id = ?'
      params.push(user.id)
    }
  }
  // Compliance, Partner, Finance, Admin, Super Admin see all departments
  
  return { query: baseQuery, params }
}

/**
 * Apply date range filter
 */
function applyDateFilter(query, params, dateFrom, dateTo, dateColumn = 'r.created_at') {
  if (dateFrom) {
    query += ` AND ${dateColumn} >= ?`
    params.push(dateFrom)
  }
  if (dateTo) {
    query += ` AND ${dateColumn} <= ?`
    params.push(dateTo + ' 23:59:59')
  }
  return { query, params }
}

/**
 * Get base request query with joins
 * In production, automatically excludes test data
 */
function getBaseRequestQuery() {
  // In production, automatically exclude test data
  const excludeTestData = isProduction() ? " AND r.request_id NOT LIKE 'LOAD-TEST-%'" : ''
  
  return `
    SELECT 
      r.*,
      c.client_name,
      c.client_code,
      u.name as requester_name,
      u.department as requester_department,
      d.name as director_approval_by_name,
      p.name as partner_approved_by_name,
      et.proposal_sent_date,
      et.client_response_received as client_response_date,
      et.client_response_type as client_response_status,
      et.engagement_letter_sent_date as engagement_letter_issued,
      ec.engagement_code
    FROM coi_requests r
    INNER JOIN clients c ON r.client_id = c.id
    INNER JOIN users u ON r.requester_id = u.id
    LEFT JOIN users d ON r.director_approval_by = d.id
    LEFT JOIN users p ON r.partner_approved_by = p.id
    LEFT JOIN execution_tracking et ON r.id = et.coi_request_id
    LEFT JOIN coi_engagement_codes ec ON r.id = ec.coi_request_id
    WHERE 1=1${excludeTestData}
  `
}

// ==================== REQUester REPORTS ====================

/**
 * 1.1 My Requests Summary Report
 * Optimized for large datasets with pagination
 */
export function getRequesterSummaryReport(userId, filters = {}) {
  const user = getUserById(userId)
  if (!user) throw new Error('User not found')
  
  // Extract pagination params
  const page = Math.max(1, parseInt(filters.page) || 1)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(filters.pageSize) || DEFAULT_PAGE_SIZE))
  const includeData = filters.includeData !== 'false' // Default to true for backward compatibility
  
  const { dateFrom, dateTo, status, serviceType, clientId, clientName } = filters
  
  // Build base WHERE clause and params (reusable for all queries)
  // In production, automatically exclude test data from reports
  let whereClause = `
    FROM coi_requests r
    INNER JOIN clients c ON r.client_id = c.id
    INNER JOIN users u ON r.requester_id = u.id
    WHERE 1=1
  `
  let baseParams = []
  
  // Exclude test data in production reports (for clean analytics)
  if (isProduction()) {
    whereClause += ' AND r.request_id NOT LIKE ?'
    baseParams.push('LOAD-TEST-%')
  }
  
  // Apply role filter
  if (user.role === 'Requester') {
    whereClause += ' AND r.requester_id = ?'
    baseParams.push(user.id)
  }
  
  // Apply filters
  if (status) {
    whereClause += ' AND r.status = ?'
    baseParams.push(status)
  }
  if (serviceType) {
    whereClause += ' AND r.service_type LIKE ?'
    baseParams.push(`%${serviceType}%`)
  }
  if (clientId) {
    whereClause += ' AND r.client_id = ?'
    baseParams.push(clientId)
  }
  if (clientName) {
    whereClause += ' AND c.client_name LIKE ?'
    baseParams.push(`%${clientName}%`)
  }
  
  // Apply date filter
  if (dateFrom) {
    whereClause += ' AND r.created_at >= ?'
    baseParams.push(dateFrom)
  }
  if (dateTo) {
    whereClause += ' AND r.created_at <= ?'
    baseParams.push(dateTo + ' 23:59:59')
  }
  
  // Get total count (optimized)
  const countQuery = `SELECT COUNT(*) as total ${whereClause}`
  const totalResult = db.prepare(countQuery).get(...baseParams)
  const totalRequests = totalResult?.total || 0
  
  // Calculate summary metrics using optimized aggregation
  const byStatus = {}
  const byServiceType = {}
  const byClient = {}
  
  // Get status breakdown
  const statusQuery = `SELECT r.status, COUNT(*) as count ${whereClause} GROUP BY r.status`
  const statusData = db.prepare(statusQuery).all(...baseParams)
  statusData.forEach(row => {
    byStatus[row.status] = row.count
  })
  
  // Get service type breakdown
  const serviceQuery = `SELECT r.service_type, COUNT(*) as count ${whereClause} GROUP BY r.service_type`
  const serviceData = db.prepare(serviceQuery).all(...baseParams)
  serviceData.forEach(row => {
    byServiceType[row.service_type || 'Unknown'] = row.count
  })
  
  // Get client breakdown
  const clientQuery = `SELECT c.client_name, COUNT(*) as count ${whereClause} GROUP BY c.client_name`
  const clientData = db.prepare(clientQuery).all(...baseParams)
  clientData.forEach(row => {
    byClient[row.client_name || 'Unknown'] = row.count
  })
  
  // Calculate average processing time (only for approved requests)
  const processingQuery = `
    SELECT 
      r.created_at,
      r.partner_approval_date
    ${whereClause}
    AND r.status = 'Approved'
    AND r.partner_approval_date IS NOT NULL
    AND r.created_at IS NOT NULL
  `
  const processingData = db.prepare(processingQuery).all(...baseParams)
  
  let totalProcessingTime = 0
  let processedCount = 0
  processingData.forEach(req => {
    const created = new Date(req.created_at)
    const approved = new Date(req.partner_approval_date)
    const days = (approved - created) / (1000 * 60 * 60 * 24)
    totalProcessingTime += days
    processedCount++
  })
  
  const avgProcessingTime = processedCount > 0 ? (totalProcessingTime / processedCount).toFixed(2) : 0
  
  // Calculate governance metrics
  const approvedCount = byStatus['Approved'] || 0
  const pendingStatuses = ['Pending Director Approval', 'Pending Compliance', 'Pending Partner', 'Pending Finance', 'More Info Requested']
  const pendingCount = pendingStatuses.reduce((sum, status) => sum + (byStatus[status] || 0), 0)
  
  // Count conflicts detected
  const conflictsQuery = `SELECT COUNT(*) as count ${whereClause} AND r.group_conflicts_detected IS NOT NULL AND r.group_conflicts_detected != ''`
  const conflictsResult = db.prepare(conflictsQuery).get(...baseParams)
  const conflictsDetected = conflictsResult?.count || 0
  
  // Count engagement codes generated
  const engagementCodesQuery = `SELECT COUNT(*) as count ${whereClause} AND r.engagement_code IS NOT NULL AND r.engagement_code != ''`
  const engagementCodesResult = db.prepare(engagementCodesQuery).get(...baseParams)
  const engagementCodesGenerated = engagementCodesResult?.count || 0
  
  // Calculate approval rate
  const approvalRate = totalRequests > 0 ? ((approvedCount / totalRequests) * 100).toFixed(1) : 0
  
  // Get paginated requests data (only if requested)
  let requests = []
  let pagination = null
  
  if (includeData) {
    // Apply pagination
    const paginationInfo = calculatePagination(page, pageSize, totalRequests)
    const dataQuery = `
      SELECT 
        r.request_id,
        r.service_type,
        r.status,
        r.created_at,
        r.updated_at,
        r.department,
        c.client_name,
        u.name as requester_name,
        CASE 
          WHEN r.created_at IS NOT NULL THEN 
            CAST((julianday('now') - julianday(r.created_at)) AS INTEGER)
          ELSE NULL
        END as days_pending
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `
    const dataParams = [...baseParams, paginationInfo.pageSize, paginationInfo.offset]
    
    requests = db.prepare(dataQuery).all(...dataParams)
    
    pagination = {
      currentPage: paginationInfo.currentPage,
      pageSize: paginationInfo.pageSize,
      totalItems: totalRequests,
      totalPages: paginationInfo.totalPages,
      hasNext: paginationInfo.hasNext,
      hasPrev: paginationInfo.hasPrev
    }
  }
  
  return {
    summary: {
      totalRequests,
      approvedCount,
      pendingCount,
      conflictsDetected,
      engagementCodesGenerated,
      approvalRate: parseFloat(approvalRate),
      byStatus,
      byServiceType,
      byClient,
      avgProcessingTime: parseFloat(avgProcessingTime)
    },
    requests: requests.map(r => ({
      request_id: r.request_id,
      client_name: r.client_name,
      service_type: r.service_type,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      requester_name: r.requester_name,
      department: r.department,
      days_pending: r.days_pending
    })),
    pagination
  }
}

// ==================== DIRECTOR REPORTS ====================

/**
 * 2.1 Department Requests Overview
 */
export function getDirectorOverviewReport(userId, filters = {}) {
  const user = getUserById(userId)
  if (!user) throw new Error('User not found')
  if (user.role !== 'Director') throw new Error('Access denied')
  
  let { query, params } = applyRoleFilters(user, getBaseRequestQuery())
  const { dateFrom, dateTo, requesterId, status, serviceType, clientId, clientName } = filters
  
  // Apply filters
  if (requesterId) {
    query += ' AND r.requester_id = ?'
    params.push(requesterId)
  }
  if (status) {
    query += ' AND r.status = ?'
    params.push(status)
  }
  if (serviceType) {
    query += ' AND r.service_type LIKE ?'
    params.push(`%${serviceType}%`)
  }
  if (clientId) {
    query += ' AND r.client_id = ?'
    params.push(clientId)
  }
  if (clientName) {
    query += ' AND c.client_name LIKE ?'
    params.push(`%${clientName}%`)
  }
  
  const { query: dateQuery, params: dateParams } = applyDateFilter(query, params, dateFrom, dateTo)
  query = dateQuery
  params = dateParams
  
  const requests = db.prepare(query).all(...params)
  
  // Calculate metrics
  const totalRequests = requests.length
  const byRequester = {}
  const byStatus = {}
  const byServiceType = {}
  const pendingApprovals = requests.filter(r => r.status === 'Pending Director Approval')
  let approvedCount = 0
  let totalProcessingTime = 0
  let processedCount = 0
  
  requests.forEach(req => {
    // By requester
    const requester = req.requester_name || 'Unknown'
    byRequester[requester] = (byRequester[requester] || 0) + 1
    
    // By status
    byStatus[req.status] = (byStatus[req.status] || 0) + 1
    
    // By service type
    const service = req.service_type || 'Unknown'
    byServiceType[service] = (byServiceType[service] || 0) + 1
    
    // Approval rate
    if (req.status === 'Approved' || req.status === 'Active') {
      approvedCount++
    }
    
    // Processing time
    if (req.status === 'Approved' && req.partner_approval_date && req.created_at) {
      const created = new Date(req.created_at)
      const approved = new Date(req.partner_approval_date)
      const days = (approved - created) / (1000 * 60 * 60 * 24)
      totalProcessingTime += days
      processedCount++
    }
  })
  
  const approvalRate = totalRequests > 0 ? ((approvedCount / totalRequests) * 100).toFixed(2) : 0
  const avgProcessingTime = processedCount > 0 ? (totalProcessingTime / processedCount).toFixed(2) : 0
  
  return {
    summary: {
      totalRequests,
      byRequester,
      byStatus,
      byServiceType,
      pendingApprovals: pendingApprovals.length,
      approvalRate: parseFloat(approvalRate),
      avgProcessingTime: parseFloat(avgProcessingTime)
    },
    requests: requests.map(r => ({
      request_id: r.request_id,
      requester_name: r.requester_name,
      client_name: r.client_name,
      service_type: r.service_type,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at || r.created_at,
      requester_department: r.requester_department,
      department: r.requester_department || r.department || 'N/A' // Use requester_department from base query
    }))
  }
}

// ==================== COMPLIANCE REPORTS ====================

/**
 * 3.1 Compliance Review Summary
 */
export function getComplianceSummaryReport(userId, filters = {}) {
  const user = getUserById(userId)
  if (!user) throw new Error('User not found')
  if (user.role !== 'Compliance') throw new Error('Access denied')
  
  let query = getBaseRequestQuery()
  let params = []
  const { dateFrom, dateTo, status, conflictLevel } = filters
  
  // Apply filters
  if (status) {
    query += ' AND r.status = ?'
    params.push(status)
  }
  
  const { query: dateQuery, params: dateParams } = applyDateFilter(query, params, dateFrom, dateTo)
  query = dateQuery
  params = dateParams
  
  const requests = db.prepare(query).all(...params)
  
  // Get conflicts and duplications
  const conflictsFlagged = requests.filter(r => {
    // Check if request has conflicts (simplified - check for rule recommendations)
    return r.status === 'Pending Compliance' || r.status === 'Rejected'
  }).length
  
  // Get duplications (requests with duplicate_justification or flagged duplicates)
  const duplicationsDetected = requests.filter(r => r.duplicate_justification).length
  
  // Global clearance required
  const globalClearanceRequired = requests.filter(r => r.international_operations).length
  
  // Calculate approval/rejection rate
  const approved = requests.filter(r => r.status === 'Approved' || r.status === 'Active').length
  const rejected = requests.filter(r => r.status === 'Rejected').length
  const totalReviewed = approved + rejected
  const approvalRate = totalReviewed > 0 ? ((approved / totalReviewed) * 100).toFixed(2) : 0
  
  // Average review time (from compliance review to decision)
  let totalReviewTime = 0
  let reviewCount = 0
  requests.forEach(req => {
    if (req.compliance_decision_date && req.compliance_review_date) {
      const review = new Date(req.compliance_review_date)
      const decision = new Date(req.compliance_decision_date)
      const days = (decision - review) / (1000 * 60 * 60 * 24)
      totalReviewTime += days
      reviewCount++
    }
  })
  const avgReviewTime = reviewCount > 0 ? (totalReviewTime / reviewCount).toFixed(2) : 0
  
  return {
    summary: {
      totalPendingReviews: requests.filter(r => r.status === 'Pending Compliance').length,
      conflictsFlagged,
      duplicationsDetected,
      globalClearanceRequired,
      approvalRate: parseFloat(approvalRate),
      avgReviewTime: parseFloat(avgReviewTime)
    },
    requests: requests.map(r => ({
      request_id: r.request_id,
      client_name: r.client_name,
      service_type: r.service_type,
      status: r.status,
      compliance_review_date: r.compliance_review_date,
      compliance_decision_date: r.compliance_decision_date
    }))
  }
}

// ==================== PARTNER REPORTS ====================

/**
 * 4.2 Pending Partner Approvals Report
 */
export function getPartnerPendingApprovalsReport(userId, filters = {}) {
  const user = getUserById(userId)
  if (!user) throw new Error('User not found')
  if (user.role !== 'Partner') throw new Error('Access denied')
  
  let query = getBaseRequestQuery() + ' AND r.status = ?'
  let params = ['Pending Partner Approval']
  const { dateFrom, dateTo } = filters
  
  const { query: dateQuery, params: dateParams } = applyDateFilter(query, params, dateFrom, dateTo)
  query = dateQuery
  params = dateParams
  
  const requests = db.prepare(query).all(...params)
  
  // Calculate days pending
  const now = new Date()
  const requestsWithDays = requests.map(req => {
    const created = new Date(req.created_at)
    const daysPending = Math.floor((now - created) / (1000 * 60 * 60 * 24))
    return {
      ...req,
      days_pending: daysPending
    }
  })
  
  return {
    summary: {
      totalPending: requests.length
    },
    requests: requestsWithDays.map(r => ({
      request_id: r.request_id,
      client_name: r.client_name,
      service_type: r.service_type,
      requester_name: r.requester_name,
      requester_department: r.requester_department,
      compliance_decision: r.compliance_decision || 'Pending',
      director_approval_status: r.director_approval_date ? 'Approved' : 'Pending',
      days_pending: r.days_pending,
      created_at: r.created_at
    }))
  }
}

// ==================== FINANCE REPORTS ====================

/**
 * 5.1 Engagement Code Summary
 */
export function getEngagementCodeSummaryReport(userId, filters = {}) {
  const user = getUserById(userId)
  if (!user) throw new Error('User not found')
  if (user.role !== 'Finance') throw new Error('Access denied')
  
  const { dateFrom, dateTo, serviceType, status } = filters
  
  let query = `
    SELECT 
      ec.*,
      r.service_type,
      r.status,
      r.client_id,
      c.client_name
    FROM coi_engagement_codes ec
    INNER JOIN coi_requests r ON ec.coi_request_id = r.id
    INNER JOIN clients c ON r.client_id = c.id
    WHERE 1=1
  `
  let params = []
  
  if (serviceType) {
    query += ' AND r.service_type LIKE ?'
    params.push(`%${serviceType}%`)
  }
  if (status) {
    query += ' AND r.status = ?'
    params.push(status)
  }
  
  const { query: dateQuery, params: dateParams } = applyDateFilter(query, params, dateFrom, dateTo, 'ec.created_at')
  query = dateQuery
  params = dateParams
  
  const codes = db.prepare(query).all(...params)
  
  // Calculate metrics
  const totalCodes = codes.length
  const byServiceType = {}
  const byStatus = {}
  const activeCodes = codes.filter(c => c.status === 'Active' || !c.status).length
  const inactiveCodes = codes.filter(c => c.status === 'Inactive').length
  
  // Pending code generation queue (approved requests without codes)
  const pendingQueue = db.prepare(`
    SELECT COUNT(*) as count
    FROM coi_requests r
    LEFT JOIN coi_engagement_codes ec ON r.id = ec.coi_request_id
    WHERE r.status = 'Approved' AND ec.id IS NULL
  `).get()
  
  codes.forEach(code => {
    const service = code.service_type || 'Unknown'
    byServiceType[service] = (byServiceType[service] || 0) + 1
    
    const stat = code.status || 'Active'
    byStatus[stat] = (byStatus[stat] || 0) + 1
  })
  
  return {
    summary: {
      totalCodesGenerated: totalCodes,
      byServiceType,
      byStatus,
      activeCodes,
      inactiveCodes,
      pendingCodeGenerationQueue: pendingQueue?.count || 0
    },
    codes: codes.map(c => ({
      engagement_code: c.engagement_code,
      client_name: c.client_name,
      service_type: c.service_type,
      status: c.status || 'Active',
      created_at: c.created_at
    }))
  }
}

// ==================== ADMIN REPORTS ====================

/**
 * 6.1 System Overview Report
 */
export function getSystemOverviewReport(userId, filters = {}) {
  const user = getUserById(userId)
  if (!user) throw new Error('User not found')
  if (!['Admin', 'Super Admin'].includes(user.role)) throw new Error('Access denied')
  
  const { dateFrom, dateTo } = filters
  
  // Total requests
  let query = 'SELECT COUNT(*) as count FROM coi_requests WHERE 1=1'
  let params = []
  const { query: dateQuery, params: dateParams } = applyDateFilter(query, params, dateFrom, dateTo)
  const totalRequests = db.prepare(dateQuery).get(...dateParams)?.count || 0
  
  // Active engagements
  const activeEngagements = db.prepare(`
    SELECT COUNT(*) as count
    FROM coi_requests
    WHERE status = 'Active'
  `).get()?.count || 0
  
  // Monitoring alerts
  const monitoringAlerts = db.prepare(`
    SELECT COUNT(*) as count
    FROM monitoring_alerts
    WHERE alert_sent = 1
  `).get()?.count || 0
  
  // Renewals due (within 90 days)
  const now = new Date()
  const renewalsDue = db.prepare(`
    SELECT COUNT(*) as count
    FROM engagement_renewals
    WHERE renewal_due_date <= date('now', '+90 days')
    AND renewal_status = 'Pending'
  `).get()?.count || 0
  
  // System health metrics
  const staleRequests = db.prepare(`
    SELECT COUNT(*) as count
    FROM coi_requests
    WHERE status IN ('Pending Compliance', 'Pending Director Approval', 'Pending Partner Approval')
    AND updated_at < date('now', '-30 days')
  `).get()?.count || 0
  
  return {
    summary: {
      totalRequests,
      activeEngagements,
      monitoringAlerts,
      renewalsDue,
      staleRequests
    }
  }
}

/**
 * 6.8 Prospect Conversion Report
 */
export function getProspectConversionReport(userId, filters = {}) {
  const user = getUserById(userId)
  if (!user) throw new Error('User not found')
  if (!['Admin', 'Super Admin'].includes(user.role)) throw new Error('Access denied')
  
  const { dateFrom, dateTo, status, conversionStatus } = filters
  
  // Get all prospects from COI system
  // BUG FIX (2026-01-20): Changed from relationship_with_client = 'New Client' to is_prospect = 1
  // The is_prospect flag is the correct indicator for prospects, set when engagement_type is 'Proposal'
  let query = `
    SELECT 
      r.*,
      c.client_name,
      c.client_code,
      ls.source_name as lead_source_name,
      ls.source_category as lead_source_category,
      CASE 
        WHEN r.prospect_converted_at IS NOT NULL THEN 'Converted'
        WHEN r.status = 'Approved' THEN 'Active'
        WHEN r.status = 'Active' THEN 'Active'
        WHEN r.status = 'Rejected' THEN 'Lost'
        ELSE 'Pending'
      END as prospect_status
    FROM coi_requests r
    LEFT JOIN clients c ON r.client_id = c.id
    LEFT JOIN lead_sources ls ON r.lead_source_id = ls.id
    WHERE r.is_prospect = 1
    AND 1=1
  `
  let params = []
  
  if (status) {
    query += ' AND r.status = ?'
    params.push(status)
  }
  
  const { query: dateQuery, params: dateParams } = applyDateFilter(query, params, dateFrom, dateTo)
  query = dateQuery
  params = dateParams
  
  const prospects = db.prepare(query).all(...params)
  
  // Calculate metrics
  const totalProspects = prospects.length
  const convertedProspects = prospects.filter(p => p.prospect_status === 'Converted').length
  const activeProspects = prospects.filter(p => p.prospect_status === 'Active').length
  const pendingProspects = prospects.filter(p => p.prospect_status === 'Pending').length
  const lostProspects = prospects.filter(p => p.prospect_status === 'Lost').length
  
  // Check if prospects are linked to existing PRMS clients
  const linkedToPRMS = prospects.filter(p => p.prms_client_id).length
  
  // Lead source breakdown
  const byLeadSource = prospects.reduce((acc, p) => {
    const source = p.lead_source_name || 'Unknown'
    acc[source] = (acc[source] || 0) + 1
    return acc
  }, {})
  
  const conversionRatio = totalProspects > 0 ? ((convertedProspects / totalProspects) * 100).toFixed(2) : 0
  
  // Filter by conversion status if provided
  let filteredProspects = prospects
  if (conversionStatus) {
    filteredProspects = prospects.filter(p => p.prospect_status === conversionStatus)
  }
  
  return {
    summary: {
      totalProspects,
      convertedProspects,
      activeProspects,
      pendingProspects,
      lostProspects,
      linkedToPRMS,
      conversionRatio: parseFloat(conversionRatio),
      byLeadSource
    },
    prospects: filteredProspects.map(p => ({
      request_id: p.request_id,
      client_name: p.client_name,
      client_code: p.client_code,
      service_type: p.service_type,
      status: p.status,
      prospect_status: p.prospect_status,
      lead_source: p.lead_source_name,
      lead_source_category: p.lead_source_category,
      prms_client_id: p.prms_client_id,
      created_at: p.created_at,
      prospect_converted_at: p.prospect_converted_at
    }))
  }
}

/**
 * ============================================
 * PHASE C: TOP 5 REPORTS (Approval Workflow, SLA, Department, Conflict, Active Engagements)
 * ============================================
 */

/**
 * Approval Workflow Report — counts by workflow status (stacked bar)
 * Admin / Super Admin only. Handles empty data and invalid filters.
 */
export function getApprovalWorkflowReport(userId, filters = {}) {
  try {
    const user = getUserById(userId)
    if (!user || !['Admin', 'Super Admin'].includes(user.role)) {
      return { summary: { byStage: {}, totalRequests: 0 }, requests: [] }
    }
    const dateFrom = filters.dateFrom || null
    const dateTo = filters.dateTo || null
    let where = 'WHERE 1=1'
    const params = []
    if (dateFrom) {
      where += ' AND created_at >= ?'
      params.push(dateFrom)
    }
    if (dateTo) {
      where += ' AND created_at <= ?'
      params.push(dateTo + ' 23:59:59')
    }
    if (isProduction()) {
      where += ' AND request_id NOT LIKE ?'
      params.push('LOAD-TEST-%')
    }
    const rows = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM coi_requests
      ${where}
      GROUP BY status
    `).all(...params)
    const byStage = {}
    let totalRequests = 0
    rows.forEach(row => {
      byStage[row.status || 'Unknown'] = row.count
      totalRequests += row.count
    })
    return { summary: { byStage, totalRequests }, requests: [] }
  } catch (err) {
    return { summary: { byStage: {}, totalRequests: 0 }, requests: [] }
  }
}

/**
 * SLA Compliance Report — breach counts and on-time; by department/workflow_stage
 * Admin / Super Admin only. Handles empty data.
 */
export function getSLAComplianceReport(userId, filters = {}) {
  try {
    const user = getUserById(userId)
    if (!user || !['Admin', 'Super Admin'].includes(user.role)) {
      return { summary: { breached: 0, onTime: 0, byDepartment: {}, byWorkflowStage: {} }, requests: [] }
    }
    const breachRows = db.prepare(`
      SELECT b.breach_type, b.workflow_stage, b.coi_request_id, r.department
      FROM sla_breach_log b
      INNER JOIN coi_requests r ON r.id = b.coi_request_id
    `).all()
    let breached = 0
    const byDepartment = {}
    const byWorkflowStage = {}
    breachRows.forEach(row => {
      breached += 1
      const dept = row.department || 'Unknown'
      byDepartment[dept] = (byDepartment[dept] || 0) + 1
      const stage = row.workflow_stage || 'Unknown'
      byWorkflowStage[stage] = (byWorkflowStage[stage] || 0) + 1
    })
    const totalInScope = db.prepare(`
      SELECT COUNT(*) as c FROM coi_requests WHERE status NOT IN ('Draft', 'Rejected', 'Lapsed')
    `).get()?.c || 0
    const onTime = Math.max(0, totalInScope - breached)
    return {
      summary: { breached, onTime, byDepartment, byWorkflowStage },
      requests: breachRows.map(r => ({ coi_request_id: r.coi_request_id, workflow_stage: r.workflow_stage, breach_type: r.breach_type, department: r.department }))
    }
  } catch (err) {
    return { summary: { breached: 0, onTime: 0, byDepartment: {}, byWorkflowStage: {} }, requests: [] }
  }
}

/**
 * Department Performance Report — by department: count, approval rate, avg processing time
 * Admin / Super Admin only. Handles empty data.
 */
export function getDepartmentPerformanceReport(userId, filters = {}) {
  try {
    const user = getUserById(userId)
    if (!user || !['Admin', 'Super Admin'].includes(user.role)) {
      return { summary: { byDepartment: [] }, requests: [] }
    }
    const dateFrom = filters.dateFrom || null
    const dateTo = filters.dateTo || null
    let where = 'WHERE 1=1'
    const params = []
    if (dateFrom) {
      where += ' AND r.created_at >= ?'
      params.push(dateFrom)
    }
    if (dateTo) {
      where += ' AND r.created_at <= ?'
      params.push(dateTo + ' 23:59:59')
    }
    if (isProduction()) {
      where += ' AND r.request_id NOT LIKE ?'
      params.push('LOAD-TEST-%')
    }
    const deptRows = db.prepare(`
      SELECT r.department,
        COUNT(*) as count,
        SUM(CASE WHEN r.status = 'Approved' OR r.status = 'Active' THEN 1 ELSE 0 END) as approved
      FROM coi_requests r
      ${where}
      GROUP BY r.department
    `).all(...params)
    const byDepartment = deptRows.map(row => {
      const count = row.count || 0
      const approved = row.approved || 0
      return {
        name: row.department || 'Unknown',
        count,
        approvalRate: count > 0 ? ((approved / count) * 100).toFixed(1) : '0',
        avgDays: '-' // optional: compute from director_approval_date/partner_approval_date if needed
      }
    })
    return { summary: { byDepartment }, requests: [] }
  } catch (err) {
    return { summary: { byDepartment: [] }, requests: [] }
  }
}

/**
 * Conflict Analysis Report — conflicts and duplications; Compliance (no commercial fields) and Admin
 * Handles empty data. Compliance role: do not include financial_parameters, engagement_code, etc.
 */
export function getConflictAnalysisReport(userId, filters = {}) {
  try {
    const user = getUserById(userId)
    if (!user || !['Compliance', 'Admin', 'Super Admin'].includes(user.role)) {
      return { summary: { totalConflicts: 0, resolved: 0, unresolved: 0, byType: {} }, conflicts: [], duplications: [] }
    }
    let where = 'WHERE (group_conflicts_detected IS NOT NULL AND group_conflicts_detected != "" AND group_conflicts_detected != "[]") OR (duplication_matches IS NOT NULL AND duplication_matches != "" AND duplication_matches != "[]")'
    const params = []
    if (filters.dateFrom) {
      where += ' AND r.created_at >= ?'
      params.push(filters.dateFrom)
    }
    if (filters.dateTo) {
      where += ' AND r.created_at <= ?'
      params.push(filters.dateTo + ' 23:59:59')
    }
    const rows = db.prepare(`
      SELECT r.id, r.request_id, r.status, r.compliance_review_status, r.group_conflicts_detected, r.duplication_matches, r.department
      FROM coi_requests r
      ${where}
    `).all(...params)
    let totalConflicts = 0
    let resolved = 0
    let unresolved = 0
    const byType = { group: 0, duplication: 0 }
    const conflicts = []
    const duplications = []
    rows.forEach(row => {
      const hasGroup = row.group_conflicts_detected && String(row.group_conflicts_detected).trim() !== '' && String(row.group_conflicts_detected) !== '[]'
      const hasDup = row.duplication_matches && String(row.duplication_matches).trim() !== '' && String(row.duplication_matches) !== '[]'
      if (hasGroup) {
        byType.group = (byType.group || 0) + 1
        conflicts.push({ request_id: row.request_id, type: 'group', compliance_review_status: row.compliance_review_status })
      }
      if (hasDup) {
        byType.duplication = (byType.duplication || 0) + 1
        duplications.push({ request_id: row.request_id, compliance_review_status: row.compliance_review_status })
      }
    })
    totalConflicts = rows.length
    resolved = rows.filter(r => r.compliance_review_status === 'Approved' || r.compliance_review_status === 'Approved with Restrictions').length
    unresolved = totalConflicts - resolved
    return {
      summary: { totalConflicts, resolved, unresolved, byType },
      conflicts,
      duplications
    }
  } catch (err) {
    return { summary: { totalConflicts: 0, resolved: 0, unresolved: 0, byType: {} }, conflicts: [], duplications: [] }
  }
}

/**
 * Active Engagements Report — approved requests with engagement code; Partner and Admin
 * Handles empty data.
 */
export function getActiveEngagementsReport(userId, filters = {}) {
  try {
    const user = getUserById(userId)
    if (!user || !['Partner', 'Admin', 'Super Admin'].includes(user.role)) {
      return { summary: { total: 0, byServiceType: {} }, requests: [] }
    }
    let where = "WHERE (r.status = 'Approved' OR r.status = 'Active') AND r.engagement_code IS NOT NULL AND r.engagement_code != ''"
    const params = []
    if (filters.dateFrom) {
      where += ' AND r.created_at >= ?'
      params.push(filters.dateFrom)
    }
    if (filters.dateTo) {
      where += ' AND r.created_at <= ?'
      params.push(filters.dateTo + ' 23:59:59')
    }
    if (isProduction()) {
      where += ' AND r.request_id NOT LIKE ?'
      params.push('LOAD-TEST-%')
    }
    const requests = db.prepare(`
      SELECT r.request_id, r.engagement_code, r.service_type, r.status, r.requested_service_period_start, r.requested_service_period_end, c.client_name
      FROM coi_requests r
      INNER JOIN clients c ON r.client_id = c.id
      ${where}
      ORDER BY r.requested_service_period_end DESC
    `).all(...params)
    const byServiceType = {}
    requests.forEach(row => {
      const st = row.service_type || 'Unknown'
      byServiceType[st] = (byServiceType[st] || 0) + 1
    })
    return {
      summary: { total: requests.length, byServiceType },
      requests
    }
  } catch (err) {
    return { summary: { total: 0, byServiceType: {} }, requests: [] }
  }
}

/**
 * ============================================
 * PHASE 2: CRM ATTRIBUTION REPORTS
 * ============================================
 */

/**
 * 6.9 Lead Source Effectiveness Report
 * Shows conversion rates and counts by lead source
 */
export function getLeadSourceEffectivenessReport(userId, filters = {}) {
  const user = getUserById(userId)
  if (!user) throw new Error('User not found')
  
  // Role-based access: Admin, Super Admin, Compliance, Partner, Director, Requester can view
  if (!['Admin', 'Super Admin', 'Compliance', 'Partner', 'Director', 'Requester'].includes(user.role)) {
    throw new Error('Access denied')
  }
  
  const { dateFrom, dateTo } = filters
  
  // Build date filter
  let dateFilter = ''
  const dateParams = []
  if (dateFrom) {
    dateFilter += ' AND r.created_at >= ?'
    dateParams.push(dateFrom)
  }
  if (dateTo) {
    dateFilter += ' AND r.created_at <= ?'
    dateParams.push(dateTo + ' 23:59:59')
  }
  
  // Get lead source effectiveness metrics
  // Query both COI requests (is_prospect=1) and prospects table
  // First, get from COI requests
  const coiProspects = db.prepare(`
    SELECT 
      COALESCE(ls.source_name, 'Unknown') as lead_source,
      COALESCE(ls.source_category, 'other') as category,
      COUNT(*) as total_prospects,
      SUM(CASE WHEN r.status = 'Approved' OR r.prospect_converted_at IS NOT NULL THEN 1 ELSE 0 END) as converted,
      SUM(CASE WHEN r.status = 'Rejected' THEN 1 ELSE 0 END) as lost,
      SUM(CASE WHEN r.status IN ('Pending Director', 'Pending Compliance', 'Pending Partner', 'Pending Finance') THEN 1 ELSE 0 END) as in_progress,
      ROUND(
        CAST(SUM(CASE WHEN r.status = 'Approved' OR r.prospect_converted_at IS NOT NULL THEN 1 ELSE 0 END) AS FLOAT) / 
        NULLIF(COUNT(*), 0) * 100, 
        1
      ) as conversion_rate,
      AVG(
        CASE WHEN r.status = 'Approved' 
        THEN julianday(r.updated_at) - julianday(r.created_at) 
        ELSE NULL END
      ) as avg_days_to_convert
    FROM coi_requests r
    LEFT JOIN lead_sources ls ON r.lead_source_id = ls.id
    WHERE r.is_prospect = 1
    ${dateFilter}
    GROUP BY COALESCE(ls.source_name, 'Unknown'), COALESCE(ls.source_category, 'other')
  `).all(...dateParams)
  
  // Also get from prospects table (standalone prospects not yet linked to COI requests)
  const standaloneProspects = db.prepare(`
    SELECT 
      COALESCE(ls.source_name, 'Unknown') as lead_source,
      COALESCE(ls.source_category, 'other') as category,
      COUNT(*) as total_prospects,
      SUM(CASE WHEN p.status = 'Converted' THEN 1 ELSE 0 END) as converted,
      SUM(CASE WHEN p.status = 'Lost' THEN 1 ELSE 0 END) as lost,
      SUM(CASE WHEN p.status = 'Active' THEN 1 ELSE 0 END) as in_progress,
      0 as conversion_rate,
      NULL as avg_days_to_convert
    FROM prospects p
    LEFT JOIN lead_sources ls ON p.lead_source_id = ls.id
    WHERE NOT EXISTS (
      SELECT 1 FROM coi_requests r WHERE r.prospect_id = p.id
    )
    ${dateFilter.replace('r.created_at', 'p.created_at')}
    GROUP BY COALESCE(ls.source_name, 'Unknown'), COALESCE(ls.source_category, 'other')
  `).all(...dateParams)
  
  // Merge results by lead source
  const sourceMap = new Map()
  
  // Add COI request prospects
  coiProspects.forEach(row => {
    const key = `${row.lead_source}|${row.category}`
    sourceMap.set(key, { ...row })
  })
  
  // Merge standalone prospects
  standaloneProspects.forEach(row => {
    const key = `${row.lead_source}|${row.category}`
    if (sourceMap.has(key)) {
      const existing = sourceMap.get(key)
      existing.total_prospects += row.total_prospects
      existing.converted += row.converted
      existing.lost += row.lost
      existing.in_progress += row.in_progress
      // Recalculate conversion rate
      existing.conversion_rate = existing.total_prospects > 0
        ? Math.round((existing.converted / existing.total_prospects) * 1000) / 10
        : 0
    } else {
      sourceMap.set(key, { ...row })
    }
  })
  
  const leadSourceMetrics = Array.from(sourceMap.values())
    .sort((a, b) => b.total_prospects - a.total_prospects)
  
  // Calculate totals
  const totals = leadSourceMetrics.reduce((acc, row) => ({
    total_prospects: acc.total_prospects + row.total_prospects,
    converted: acc.converted + row.converted,
    lost: acc.lost + row.lost,
    in_progress: acc.in_progress + row.in_progress
  }), { total_prospects: 0, converted: 0, lost: 0, in_progress: 0 })
  
  totals.overall_conversion_rate = totals.total_prospects > 0 
    ? Math.round((totals.converted / totals.total_prospects) * 1000) / 10 
    : 0
  
  // Best performing source
  const bestSource = leadSourceMetrics.length > 0 
    ? leadSourceMetrics.reduce((best, curr) => 
        (curr.conversion_rate || 0) > (best.conversion_rate || 0) ? curr : best
      )
    : null
  
  return {
    summary: {
      ...totals,
      best_performing_source: bestSource?.lead_source || 'N/A',
      best_conversion_rate: bestSource?.conversion_rate || 0
    },
    by_source: leadSourceMetrics.map(row => ({
      lead_source: row.lead_source,
      category: row.category,
      total_prospects: row.total_prospects,
      converted: row.converted,
      lost: row.lost,
      in_progress: row.in_progress,
      conversion_rate: row.conversion_rate || 0,
      avg_days_to_convert: row.avg_days_to_convert ? Math.round(row.avg_days_to_convert) : null
    })),
    // Chart data for simple bar chart
    chart_data: leadSourceMetrics.map(row => ({
      name: row.lead_source,
      value: row.total_prospects,
      converted: row.converted,
      conversion_rate: row.conversion_rate || 0
    }))
  }
}

/**
 * 6.10 Funnel Performance Report
 * Shows prospect journey through stages with drop-off rates
 */
export function getFunnelPerformanceReport(userId, filters = {}) {
  const user = getUserById(userId)
  if (!user) throw new Error('User not found')
  
  // Role-based access: Admin, Super Admin, Compliance, Partner, Director, Requester can view
  if (!['Admin', 'Super Admin', 'Compliance', 'Partner', 'Director', 'Requester'].includes(user.role)) {
    throw new Error('Access denied')
  }
  
  const { dateFrom, dateTo } = filters
  
  // Build date filter for funnel events
  let dateFilter = ''
  const dateParams = []
  if (dateFrom) {
    dateFilter += ' AND pfe.event_timestamp >= ?'
    dateParams.push(dateFrom)
  }
  if (dateTo) {
    dateFilter += ' AND pfe.event_timestamp <= ?'
    dateParams.push(dateTo + ' 23:59:59')
  }
  
  // Define funnel stages in order
  const stages = [
    { code: 'lead_created', label: 'Lead Created', order: 1 },
    { code: 'proposal_submitted', label: 'Proposal Submitted', order: 2 },
    { code: 'pending_director', label: 'Director Review', order: 3 },
    { code: 'pending_compliance', label: 'Compliance Review', order: 4 },
    { code: 'pending_partner', label: 'Partner Review', order: 5 },
    { code: 'approved', label: 'Approved', order: 6 },
    { code: 'client_created', label: 'Client Created', order: 7 }
  ]
  
  // Get counts for each stage
  const stageCounts = db.prepare(`
    SELECT 
      to_stage,
      COUNT(DISTINCT COALESCE(prospect_id, coi_request_id)) as count,
      AVG(days_in_previous_stage) as avg_days_in_stage
    FROM prospect_funnel_events pfe
    WHERE 1=1 ${dateFilter}
    GROUP BY to_stage
  `).all(...dateParams)
  
  // Map stage counts to ordered stages
  const stageCountMap = new Map(stageCounts.map(s => [s.to_stage, s]))
  
  const funnelData = stages.map((stage, index) => {
    const data = stageCountMap.get(stage.code) || { count: 0, avg_days_in_stage: null }
    const prevStage = index > 0 ? stages[index - 1] : null
    const prevCount = prevStage ? (stageCountMap.get(prevStage.code)?.count || 0) : data.count
    
    return {
      stage: stage.label,
      stage_code: stage.code,
      order: stage.order,
      count: data.count,
      avg_days_in_stage: data.avg_days_in_stage ? Math.round(data.avg_days_in_stage) : null,
      conversion_rate: prevCount > 0 ? Math.round((data.count / prevCount) * 100) : 100,
      drop_off: prevCount - data.count,
      drop_off_rate: prevCount > 0 ? Math.round(((prevCount - data.count) / prevCount) * 100) : 0
    }
  })
  
  // Overall funnel metrics
  const firstStageCount = funnelData[0]?.count || 0
  const lastStageCount = funnelData[funnelData.length - 1]?.count || 0
  const overallConversion = firstStageCount > 0 
    ? Math.round((lastStageCount / firstStageCount) * 1000) / 10 
    : 0
  
  // Find biggest drop-off point
  const biggestDropOff = funnelData.reduce((max, curr) => 
    curr.drop_off > (max?.drop_off || 0) ? curr : max
  , null)
  
  return {
    summary: {
      total_leads: firstStageCount,
      total_conversions: lastStageCount,
      overall_conversion_rate: overallConversion,
      biggest_drop_off_stage: biggestDropOff?.stage || 'N/A',
      biggest_drop_off_count: biggestDropOff?.drop_off || 0
    },
    funnel_stages: funnelData,
    // Simple bar chart data (not Sankey)
    chart_data: funnelData.map(s => ({
      stage: s.stage,
      count: s.count,
      conversion_rate: s.conversion_rate
    }))
  }
}

/**
 * 6.11 Insights-to-Conversion Report
 * Tracks prospects created from Client Intelligence module
 */
export function getInsightsToConversionReport(userId, filters = {}) {
  const user = getUserById(userId)
  if (!user) throw new Error('User not found')
  
  // Role-based access: Admin, Super Admin, Compliance, Partner, Director, Requester can view
  if (!['Admin', 'Super Admin', 'Compliance', 'Partner', 'Director', 'Requester'].includes(user.role)) {
    throw new Error('Access denied')
  }
  
  const { dateFrom, dateTo } = filters
  
  // Build date filter
  let dateFilter = ''
  const dateParams = []
  if (dateFrom) {
    dateFilter += ' AND p.created_at >= ?'
    dateParams.push(dateFrom)
  }
  if (dateTo) {
    dateFilter += ' AND p.created_at <= ?'
    dateParams.push(dateTo + ' 23:59:59')
  }
  
  // Get insights-sourced prospects
  const insightsProspects = db.prepare(`
    SELECT 
      p.*,
      ls.source_name as lead_source_name,
      co.opportunity_type,
      co.title as opportunity_title,
      co.conversion_probability as predicted_probability
    FROM prospects p
    LEFT JOIN lead_sources ls ON p.lead_source_id = ls.id
    LEFT JOIN client_opportunities co ON p.source_opportunity_id = co.id
    WHERE ls.source_code = 'insights_module'
    ${dateFilter}
    ORDER BY p.created_at DESC
  `).all(...dateParams)
  
  // Get insights-sourced COI requests (proposals)
  const insightsCOIRequests = db.prepare(`
    SELECT 
      r.*,
      c.client_name,
      ls.source_name as lead_source_name
    FROM coi_requests r
    LEFT JOIN clients c ON r.client_id = c.id
    LEFT JOIN lead_sources ls ON r.lead_source_id = ls.id
    WHERE r.is_prospect = 1 
    AND ls.source_code = 'insights_module'
    ${dateFilter.replace('p.created_at', 'r.created_at')}
    ORDER BY r.created_at DESC
  `).all(...dateParams)
  
  // Calculate metrics
  const totalFromInsights = insightsProspects.length + insightsCOIRequests.length
  const convertedCount = insightsProspects.filter(p => p.status === 'Converted').length +
    insightsCOIRequests.filter(r => r.status === 'Approved' || r.prospect_converted_at).length
  
  // Get total Client Intelligence opportunities for comparison
  const totalOpportunities = db.prepare(`
    SELECT COUNT(*) as count FROM client_opportunities
    WHERE created_at >= COALESCE(?, '1900-01-01')
    AND created_at <= COALESCE(?, '2100-12-31')
  `).get(dateFrom || null, dateTo ? dateTo + ' 23:59:59' : null)
  
  const opportunityToProspectRate = totalOpportunities.count > 0 
    ? Math.round((totalFromInsights / totalOpportunities.count) * 1000) / 10 
    : 0
  
  const insightsConversionRate = totalFromInsights > 0 
    ? Math.round((convertedCount / totalFromInsights) * 1000) / 10 
    : 0
  
  return {
    summary: {
      total_opportunities_generated: totalOpportunities.count,
      prospects_from_insights: totalFromInsights,
      opportunity_to_prospect_rate: opportunityToProspectRate,
      converted_from_insights: convertedCount,
      insights_conversion_rate: insightsConversionRate
    },
    prospects: insightsProspects.map(p => ({
      id: p.id,
      prospect_name: p.prospect_name,
      status: p.status,
      opportunity_type: p.opportunity_type,
      opportunity_title: p.opportunity_title,
      predicted_probability: p.predicted_probability,
      created_at: p.created_at
    })),
    coi_requests: insightsCOIRequests.map(r => ({
      request_id: r.request_id,
      client_name: r.client_name,
      service_type: r.service_type,
      status: r.status,
      created_at: r.created_at
    }))
  }
}

/**
 * 6.12 Attribution by User/Role Report
 * Shows which users/roles are most effective at converting prospects
 */
export function getAttributionByUserReport(userId, filters = {}) {
  const user = getUserById(userId)
  if (!user) throw new Error('User not found')
  
  // Role-based access: Admin, Super Admin, Compliance, Partner, Director, Requester can view
  if (!['Admin', 'Super Admin', 'Compliance', 'Partner', 'Director', 'Requester'].includes(user.role)) {
    throw new Error('Access denied')
  }
  
  const { dateFrom, dateTo, groupBy = 'user' } = filters
  
  // Build date filter
  let dateFilter = ''
  const dateParams = []
  if (dateFrom) {
    dateFilter += ' AND r.created_at >= ?'
    dateParams.push(dateFrom)
  }
  if (dateTo) {
    dateFilter += ' AND r.created_at <= ?'
    dateParams.push(dateTo + ' 23:59:59')
  }
  
  let groupByColumn, groupByLabel
  if (groupBy === 'role') {
    groupByColumn = 'u.role'
    groupByLabel = 'role'
  } else if (groupBy === 'department') {
    groupByColumn = 'u.department'
    groupByLabel = 'department'
  } else {
    groupByColumn = 'u.name'
    groupByLabel = 'user'
  }
  
  // Get attribution metrics by user/role
  const attributionMetrics = db.prepare(`
    SELECT 
      ${groupByColumn} as group_name,
      u.role as user_role,
      COUNT(*) as total_prospects_created,
      SUM(CASE WHEN r.status = 'Approved' OR r.prospect_converted_at IS NOT NULL THEN 1 ELSE 0 END) as converted,
      SUM(CASE WHEN r.status = 'Rejected' THEN 1 ELSE 0 END) as lost,
      ROUND(
        CAST(SUM(CASE WHEN r.status = 'Approved' OR r.prospect_converted_at IS NOT NULL THEN 1 ELSE 0 END) AS FLOAT) / 
        NULLIF(COUNT(*), 0) * 100, 
        1
      ) as conversion_rate,
      AVG(
        CASE WHEN r.status = 'Approved' 
        THEN julianday(r.updated_at) - julianday(r.created_at) 
        ELSE NULL END
      ) as avg_days_to_convert
    FROM coi_requests r
    JOIN users u ON r.requester_id = u.id
    WHERE r.is_prospect = 1
    ${dateFilter}
    GROUP BY ${groupByColumn}${groupBy === 'user' ? ', u.role' : ''}
    ORDER BY total_prospects_created DESC
  `).all(...dateParams)
  
  // Calculate totals
  const totals = attributionMetrics.reduce((acc, row) => ({
    total_prospects_created: acc.total_prospects_created + row.total_prospects_created,
    converted: acc.converted + row.converted,
    lost: acc.lost + row.lost
  }), { total_prospects_created: 0, converted: 0, lost: 0 })
  
  // Find top performer
  const topPerformer = attributionMetrics.length > 0 
    ? attributionMetrics.reduce((best, curr) => 
        curr.converted > (best?.converted || 0) ? curr : best
      )
    : null
  
  return {
    summary: {
      ...totals,
      overall_conversion_rate: totals.total_prospects_created > 0 
        ? Math.round((totals.converted / totals.total_prospects_created) * 1000) / 10 
        : 0,
      top_performer: topPerformer?.group_name || 'N/A',
      top_performer_conversions: topPerformer?.converted || 0
    },
    group_by: groupByLabel,
    by_group: attributionMetrics.map(row => ({
      name: row.group_name,
      role: row.user_role,
      total_prospects_created: row.total_prospects_created,
      converted: row.converted,
      lost: row.lost,
      conversion_rate: row.conversion_rate || 0,
      avg_days_to_convert: row.avg_days_to_convert ? Math.round(row.avg_days_to_convert) : null
    })),
    // Chart data
    chart_data: attributionMetrics.slice(0, 10).map(row => ({
      name: row.group_name,
      value: row.total_prospects_created,
      converted: row.converted,
      conversion_rate: row.conversion_rate || 0
    }))
  }
}

/**
 * ============================================
 * PHASE 3: ADVANCED CRM REPORTS
 * ============================================
 */

/**
 * 6.13 Pipeline Forecast Report
 * Shows expected conversions based on current pipeline stage counts
 * No confidence intervals - just counts and historical conversion rates
 */
export function getPipelineForecastReport(userId, filters = {}) {
  const user = getUserById(userId)
  if (!user) throw new Error('User not found')
  
  // Role-based access: Admin, Super Admin, Compliance, Partner, Director, Requester can view
  if (!['Admin', 'Super Admin', 'Compliance', 'Partner', 'Director', 'Requester'].includes(user.role)) {
    throw new Error('Access denied')
  }
  
  // Get current pipeline by stage (only active prospects)
  const pipelineByStage = db.prepare(`
    SELECT 
      r.status,
      COUNT(*) as count,
      AVG(julianday('now') - julianday(r.created_at)) as avg_days_in_pipeline
    FROM coi_requests r
    WHERE r.is_prospect = 1
      AND r.status NOT IN ('Approved', 'Rejected', 'Cancelled')
    GROUP BY r.status
    ORDER BY 
      CASE r.status
        WHEN 'Draft' THEN 1
        WHEN 'Pending Director' THEN 2
        WHEN 'Pending Compliance' THEN 3
        WHEN 'Pending Partner' THEN 4
        WHEN 'Pending Finance' THEN 5
        ELSE 6
      END
  `).all()
  
  // Get historical conversion rates by stage (for weighting)
  // Based on what percentage of prospects at each stage eventually converted
  const historicalRates = db.prepare(`
    SELECT 
      pfe.to_stage,
      COUNT(DISTINCT pfe.prospect_id) as entered_stage,
      SUM(CASE WHEN p.status = 'Converted' THEN 1 ELSE 0 END) as eventually_converted
    FROM prospect_funnel_events pfe
    LEFT JOIN prospects p ON pfe.prospect_id = p.id
    WHERE pfe.to_stage IN ('pending_director', 'pending_compliance', 'pending_partner', 'approved')
    GROUP BY pfe.to_stage
  `).all()
  
  // Map historical rates
  const rateMap = new Map()
  historicalRates.forEach(r => {
    const rate = r.entered_stage > 0 
      ? Math.round((r.eventually_converted / r.entered_stage) * 100) 
      : 0
    rateMap.set(r.to_stage, rate)
  })
  
  // Default rates if no historical data
  const defaultRates = {
    'Draft': 10,
    'Pending Director': 25,
    'Pending Compliance': 50,
    'Pending Partner': 75,
    'Pending Finance': 85,
    'Approved': 95
  }
  
  // Calculate weighted forecast
  const forecast = pipelineByStage.map(stage => {
    const stageKey = stage.status.toLowerCase().replace(/ /g, '_')
    const historicalRate = rateMap.get(stageKey)
    const conversionProbability = historicalRate !== undefined 
      ? historicalRate 
      : (defaultRates[stage.status] || 50)
    
    return {
      stage: stage.status,
      current_count: stage.count,
      conversion_probability: conversionProbability,
      expected_conversions: Math.round(stage.count * (conversionProbability / 100) * 10) / 10,
      avg_days_in_pipeline: stage.avg_days_in_pipeline 
        ? Math.round(stage.avg_days_in_pipeline) 
        : null,
      data_source: historicalRate !== undefined ? 'historical' : 'default'
    }
  })
  
  // Total pipeline value
  const totalInPipeline = pipelineByStage.reduce((sum, s) => sum + s.count, 0)
  const totalExpectedConversions = forecast.reduce((sum, f) => sum + f.expected_conversions, 0)
  
  // Get recently lost for context
  const recentlyLost = db.prepare(`
    SELECT COUNT(*) as count FROM prospects
    WHERE status = 'Inactive' 
      AND lost_date >= date('now', '-30 days')
  `).get()?.count || 0
  
  return {
    summary: {
      total_in_pipeline: totalInPipeline,
      expected_conversions: Math.round(totalExpectedConversions * 10) / 10,
      overall_forecast_rate: totalInPipeline > 0 
        ? Math.round((totalExpectedConversions / totalInPipeline) * 1000) / 10 
        : 0,
      recently_lost_30d: recentlyLost,
      data_freshness: 'real-time'
    },
    pipeline_stages: forecast,
    // Simple bar chart data
    chart_data: forecast.map(f => ({
      stage: f.stage,
      count: f.current_count,
      expected: f.expected_conversions,
      probability: f.conversion_probability
    })),
    note: 'Conversion probabilities based on historical data where available, defaults otherwise. No confidence intervals applied.'
  }
}

/**
 * 6.14 Conversion Trends Report
 * Shows monthly/quarterly conversion counts and trends
 * Note: More meaningful after 6+ months of data
 */
export function getConversionTrendsReport(userId, filters = {}) {
  const user = getUserById(userId)
  if (!user) throw new Error('User not found')
  
  // Role-based access: Admin, Super Admin, Compliance, Partner, Director, Requester can view
  if (!['Admin', 'Super Admin', 'Compliance', 'Partner', 'Director', 'Requester'].includes(user.role)) {
    throw new Error('Access denied')
  }
  
  const { period = 'monthly', months = 12 } = filters
  
  // Get monthly conversion data
  const monthlyData = db.prepare(`
    SELECT 
      strftime('%Y-%m', r.created_at) as month,
      COUNT(*) as total_created,
      SUM(CASE WHEN r.status = 'Approved' OR r.prospect_converted_at IS NOT NULL THEN 1 ELSE 0 END) as converted,
      SUM(CASE WHEN r.status = 'Rejected' THEN 1 ELSE 0 END) as lost
    FROM coi_requests r
    WHERE r.is_prospect = 1
      AND r.created_at >= date('now', '-' || ? || ' months')
    GROUP BY strftime('%Y-%m', r.created_at)
    ORDER BY month ASC
  `).all(months)
  
  // Calculate conversion rates and trends
  const trendsData = monthlyData.map((month, index) => {
    const conversionRate = month.total_created > 0 
      ? Math.round((month.converted / month.total_created) * 1000) / 10 
      : 0
    
    // Calculate change from previous month
    let change = null
    let changePercent = null
    if (index > 0) {
      const prevMonth = monthlyData[index - 1]
      const prevRate = prevMonth.total_created > 0 
        ? (prevMonth.converted / prevMonth.total_created) * 100 
        : 0
      change = conversionRate - prevRate
      changePercent = prevRate > 0 
        ? Math.round((change / prevRate) * 1000) / 10 
        : null
    }
    
    return {
      month: month.month,
      total_created: month.total_created,
      converted: month.converted,
      lost: month.lost,
      conversion_rate: conversionRate,
      change_from_prev: change ? Math.round(change * 10) / 10 : null,
      change_percent: changePercent,
      trend: change === null ? 'neutral' : (change > 0 ? 'up' : (change < 0 ? 'down' : 'neutral'))
    }
  })
  
  // Calculate overall trends
  const recentMonths = trendsData.slice(-3)
  const olderMonths = trendsData.slice(-6, -3)
  
  const recentAvgRate = recentMonths.length > 0 
    ? recentMonths.reduce((sum, m) => sum + m.conversion_rate, 0) / recentMonths.length 
    : 0
  const olderAvgRate = olderMonths.length > 0 
    ? olderMonths.reduce((sum, m) => sum + m.conversion_rate, 0) / olderMonths.length 
    : 0
  
  const overallTrend = recentAvgRate > olderAvgRate 
    ? 'improving' 
    : (recentAvgRate < olderAvgRate ? 'declining' : 'stable')
  
  // Lead source trends
  const leadSourceTrends = db.prepare(`
    SELECT 
      strftime('%Y-%m', r.created_at) as month,
      COALESCE(ls.source_name, 'Unknown') as lead_source,
      COUNT(*) as count,
      SUM(CASE WHEN r.status = 'Approved' OR r.prospect_converted_at IS NOT NULL THEN 1 ELSE 0 END) as converted
    FROM coi_requests r
    LEFT JOIN lead_sources ls ON r.lead_source_id = ls.id
    WHERE r.is_prospect = 1
      AND r.created_at >= date('now', '-' || ? || ' months')
    GROUP BY strftime('%Y-%m', r.created_at), ls.source_name
    ORDER BY month ASC, count DESC
  `).all(months)
  
  // Group by lead source
  const byLeadSource = {}
  leadSourceTrends.forEach(row => {
    if (!byLeadSource[row.lead_source]) {
      byLeadSource[row.lead_source] = []
    }
    byLeadSource[row.lead_source].push({
      month: row.month,
      count: row.count,
      converted: row.converted,
      rate: row.count > 0 ? Math.round((row.converted / row.count) * 1000) / 10 : 0
    })
  })
  
  return {
    summary: {
      months_analyzed: monthlyData.length,
      total_prospects: monthlyData.reduce((sum, m) => sum + m.total_created, 0),
      total_converted: monthlyData.reduce((sum, m) => sum + m.converted, 0),
      recent_avg_rate: Math.round(recentAvgRate * 10) / 10,
      older_avg_rate: Math.round(olderAvgRate * 10) / 10,
      overall_trend: overallTrend,
      data_sufficient: monthlyData.length >= 6
    },
    monthly_trends: trendsData,
    by_lead_source: byLeadSource,
    // Chart data for line chart
    chart_data: trendsData.map(m => ({
      month: m.month,
      created: m.total_created,
      converted: m.converted,
      rate: m.conversion_rate
    })),
    note: monthlyData.length < 6 
      ? 'Note: Trends are more meaningful with 6+ months of data.' 
      : null
  }
}

/**
 * 6.15 Period Comparison Report
 * Compares current period vs previous period
 * Simplified: Just shows current vs last month/quarter delta
 */
export function getPeriodComparisonReport(userId, filters = {}) {
  const user = getUserById(userId)
  if (!user) throw new Error('User not found')
  
  // Role-based access: Admin, Super Admin, Compliance, Partner, Director, Requester can view
  if (!['Admin', 'Super Admin', 'Compliance', 'Partner', 'Director', 'Requester'].includes(user.role)) {
    throw new Error('Access denied')
  }
  
  const { compareType = 'month' } = filters // 'month' or 'quarter'
  
  let currentPeriodStart, previousPeriodStart, previousPeriodEnd
  
  if (compareType === 'quarter') {
    currentPeriodStart = "date('now', 'start of month', '-2 months')"
    previousPeriodStart = "date('now', 'start of month', '-5 months')"
    previousPeriodEnd = "date('now', 'start of month', '-2 months', '-1 day')"
  } else {
    currentPeriodStart = "date('now', 'start of month')"
    previousPeriodStart = "date('now', 'start of month', '-1 month')"
    previousPeriodEnd = "date('now', 'start of month', '-1 day')"
  }
  
  // Current period metrics
  const currentPeriod = db.prepare(`
    SELECT 
      COUNT(*) as total_prospects,
      SUM(CASE WHEN status = 'Approved' OR prospect_converted_at IS NOT NULL THEN 1 ELSE 0 END) as converted,
      SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as lost
    FROM coi_requests
    WHERE is_prospect = 1
      AND created_at >= ${currentPeriodStart}
  `).get()
  
  // Previous period metrics
  const previousPeriod = db.prepare(`
    SELECT 
      COUNT(*) as total_prospects,
      SUM(CASE WHEN status = 'Approved' OR prospect_converted_at IS NOT NULL THEN 1 ELSE 0 END) as converted,
      SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as lost
    FROM coi_requests
    WHERE is_prospect = 1
      AND created_at >= ${previousPeriodStart}
      AND created_at <= ${previousPeriodEnd}
  `).get()
  
  // Calculate deltas
  const calculateDelta = (current, previous) => {
    const change = current - previous
    const percentChange = previous > 0 
      ? Math.round((change / previous) * 1000) / 10 
      : (current > 0 ? 100 : 0)
    return { change, percentChange, trend: change > 0 ? 'up' : (change < 0 ? 'down' : 'neutral') }
  }
  
  const currentRate = currentPeriod.total_prospects > 0 
    ? Math.round((currentPeriod.converted / currentPeriod.total_prospects) * 1000) / 10 
    : 0
  const previousRate = previousPeriod.total_prospects > 0 
    ? Math.round((previousPeriod.converted / previousPeriod.total_prospects) * 1000) / 10 
    : 0
  
  const prospectsDelta = calculateDelta(currentPeriod.total_prospects, previousPeriod.total_prospects)
  const convertedDelta = calculateDelta(currentPeriod.converted, previousPeriod.converted)
  const rateDelta = calculateDelta(currentRate, previousRate)
  
  // Lead source comparison
  const currentBySource = db.prepare(`
    SELECT 
      COALESCE(ls.source_name, 'Unknown') as lead_source,
      COUNT(*) as count,
      SUM(CASE WHEN r.status = 'Approved' OR r.prospect_converted_at IS NOT NULL THEN 1 ELSE 0 END) as converted
    FROM coi_requests r
    LEFT JOIN lead_sources ls ON r.lead_source_id = ls.id
    WHERE r.is_prospect = 1
      AND r.created_at >= ${currentPeriodStart}
    GROUP BY ls.source_name
    ORDER BY count DESC
  `).all()
  
  const previousBySource = db.prepare(`
    SELECT 
      COALESCE(ls.source_name, 'Unknown') as lead_source,
      COUNT(*) as count,
      SUM(CASE WHEN r.status = 'Approved' OR r.prospect_converted_at IS NOT NULL THEN 1 ELSE 0 END) as converted
    FROM coi_requests r
    LEFT JOIN lead_sources ls ON r.lead_source_id = ls.id
    WHERE r.is_prospect = 1
      AND r.created_at >= ${previousPeriodStart}
      AND r.created_at <= ${previousPeriodEnd}
    GROUP BY ls.source_name
    ORDER BY count DESC
  `).all()
  
  // Merge source data
  const previousSourceMap = new Map(previousBySource.map(s => [s.lead_source, s]))
  const sourceComparison = currentBySource.map(current => {
    const previous = previousSourceMap.get(current.lead_source) || { count: 0, converted: 0 }
    return {
      lead_source: current.lead_source,
      current_count: current.count,
      current_converted: current.converted,
      previous_count: previous.count,
      previous_converted: previous.converted,
      count_change: current.count - previous.count,
      converted_change: current.converted - previous.converted
    }
  })
  
  return {
    summary: {
      comparison_type: compareType === 'quarter' ? 'Quarter-over-Quarter' : 'Month-over-Month',
      current_period: {
        total_prospects: currentPeriod.total_prospects,
        converted: currentPeriod.converted,
        lost: currentPeriod.lost,
        conversion_rate: currentRate
      },
      previous_period: {
        total_prospects: previousPeriod.total_prospects,
        converted: previousPeriod.converted,
        lost: previousPeriod.lost,
        conversion_rate: previousRate
      },
      deltas: {
        prospects: prospectsDelta,
        converted: convertedDelta,
        conversion_rate: rateDelta
      },
      overall_performance: rateDelta.trend === 'up' ? 'improving' : (rateDelta.trend === 'down' ? 'declining' : 'stable')
    },
    by_lead_source: sourceComparison,
    chart_data: {
      current: {
        label: compareType === 'quarter' ? 'This Quarter' : 'This Month',
        prospects: currentPeriod.total_prospects,
        converted: currentPeriod.converted,
        rate: currentRate
      },
      previous: {
        label: compareType === 'quarter' ? 'Last Quarter' : 'Last Month',
        prospects: previousPeriod.total_prospects,
        converted: previousPeriod.converted,
        rate: previousRate
      }
    }
  }
}

/**
 * 6.16 Lost Prospect Analysis Report
 * Shows lost prospects by stage and reason (simple bar/pie charts)
 */
export function getLostProspectAnalysisReport(userId, filters = {}) {
  const user = getUserById(userId)
  if (!user) throw new Error('User not found')
  
  // Role-based access: Admin, Super Admin, Compliance, Partner, Director, Requester can view
  if (!['Admin', 'Super Admin', 'Compliance', 'Partner', 'Director', 'Requester'].includes(user.role)) {
    throw new Error('Access denied')
  }
  
  const { dateFrom, dateTo } = filters
  
  // Build date filter
  let dateFilter = ''
  const dateParams = []
  if (dateFrom) {
    dateFilter += ' AND p.lost_date >= ?'
    dateParams.push(dateFrom)
  }
  if (dateTo) {
    dateFilter += ' AND p.lost_date <= ?'
    dateParams.push(dateTo + ' 23:59:59')
  }
  
  // Lost by reason (pie chart data)
  const byReason = db.prepare(`
    SELECT 
      COALESCE(lost_reason, 'unknown') as reason,
      CASE lost_reason
        WHEN 'stale_no_activity' THEN 'Stale / No Activity'
        WHEN 'rejected_by_compliance' THEN 'Rejected by Compliance'
        WHEN 'rejected_by_director' THEN 'Rejected by Director'
        WHEN 'rejected_by_partner' THEN 'Rejected by Partner'
        WHEN 'client_declined' THEN 'Client Declined'
        WHEN 'competitor_won' THEN 'Competitor Won'
        WHEN 'budget_constraints' THEN 'Budget Constraints'
        WHEN 'timing_not_right' THEN 'Timing Not Right'
        WHEN 'no_response' THEN 'No Response'
        ELSE 'Other / Unknown'
      END as reason_label,
      COUNT(*) as count
    FROM prospects p
    WHERE p.status = 'Inactive' AND p.lost_date IS NOT NULL
    ${dateFilter}
    GROUP BY lost_reason
    ORDER BY count DESC
  `).all(...dateParams)
  
  // Lost by stage (bar chart data)
  const byStage = db.prepare(`
    SELECT 
      COALESCE(lost_at_stage, 'unknown') as stage,
      COUNT(*) as count
    FROM prospects p
    WHERE p.status = 'Inactive' AND p.lost_date IS NOT NULL
    ${dateFilter}
    GROUP BY lost_at_stage
    ORDER BY 
      CASE lost_at_stage
        WHEN 'lead_created' THEN 1
        WHEN 'proposal_submitted' THEN 2
        WHEN 'pending_director' THEN 3
        WHEN 'pending_compliance' THEN 4
        WHEN 'pending_partner' THEN 5
        WHEN 'approved' THEN 6
        ELSE 7
      END
  `).all(...dateParams)
  
  // Lost by lead source
  const byLeadSource = db.prepare(`
    SELECT 
      COALESCE(ls.source_name, 'Unknown') as lead_source,
      COUNT(*) as lost_count,
      (
        SELECT COUNT(*) FROM prospects p2 
        LEFT JOIN lead_sources ls2 ON p2.lead_source_id = ls2.id
        WHERE ls2.source_name = ls.source_name OR (ls2.source_name IS NULL AND ls.source_name IS NULL)
      ) as total_from_source
    FROM prospects p
    LEFT JOIN lead_sources ls ON p.lead_source_id = ls.id
    WHERE p.status = 'Inactive' AND p.lost_date IS NOT NULL
    ${dateFilter}
    GROUP BY ls.source_name
    ORDER BY lost_count DESC
  `).all(...dateParams)
  
  // Calculate loss rate by source
  const byLeadSourceWithRate = byLeadSource.map(s => ({
    ...s,
    loss_rate: s.total_from_source > 0 
      ? Math.round((s.lost_count / s.total_from_source) * 1000) / 10 
      : 0
  }))
  
  // Recent lost prospects list
  const recentLost = db.prepare(`
    SELECT 
      p.id,
      p.prospect_name,
      p.lost_reason,
      p.lost_at_stage,
      p.lost_date,
      ls.source_name as lead_source
    FROM prospects p
    LEFT JOIN lead_sources ls ON p.lead_source_id = ls.id
    WHERE p.status = 'Inactive' AND p.lost_date IS NOT NULL
    ${dateFilter}
    ORDER BY p.lost_date DESC
    LIMIT 20
  `).all(...dateParams)
  
  // Total lost
  const totalLost = db.prepare(`
    SELECT COUNT(*) as count FROM prospects p
    WHERE p.status = 'Inactive' AND p.lost_date IS NOT NULL
    ${dateFilter}
  `).get(...dateParams)?.count || 0
  
  // Most common reason
  const topReason = byReason.length > 0 ? byReason[0] : null
  
  // Most problematic stage
  const topStage = byStage.length > 0 ? byStage[0] : null
  
  return {
    summary: {
      total_lost: totalLost,
      top_reason: topReason?.reason_label || 'N/A',
      top_reason_count: topReason?.count || 0,
      top_stage: topStage?.stage || 'N/A',
      top_stage_count: topStage?.count || 0
    },
    by_reason: byReason.map(r => ({
      reason: r.reason,
      label: r.reason_label,
      count: r.count,
      percentage: totalLost > 0 ? Math.round((r.count / totalLost) * 1000) / 10 : 0
    })),
    by_stage: byStage.map(s => ({
      stage: s.stage,
      count: s.count,
      percentage: totalLost > 0 ? Math.round((s.count / totalLost) * 1000) / 10 : 0
    })),
    by_lead_source: byLeadSourceWithRate,
    recent_lost: recentLost.map(p => ({
      id: p.id,
      name: p.prospect_name,
      reason: p.lost_reason,
      stage: p.lost_at_stage,
      date: p.lost_date,
      lead_source: p.lead_source
    })),
    // Chart data
    reason_pie_data: byReason.map(r => ({
      name: r.reason_label,
      value: r.count
    })),
    stage_bar_data: byStage.map(s => ({
      stage: s.stage,
      count: s.count
    }))
  }
}
