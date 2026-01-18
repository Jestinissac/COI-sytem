import { getDatabase } from '../database/init.js'
import { getUserById } from '../utils/userUtils.js'
import { calculatePagination, getCountQuery, formatPaginationResponse } from '../utils/pagination.js'

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
 */
function getBaseRequestQuery() {
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
    WHERE 1=1
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
  
  const { dateFrom, dateTo, status, serviceType, clientId } = filters
  
  // Build base WHERE clause and params (reusable for all queries)
  let whereClause = `
    FROM coi_requests r
    INNER JOIN clients c ON r.client_id = c.id
    INNER JOIN users u ON r.requester_id = u.id
    WHERE 1=1
  `
  let baseParams = []
  
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
        c.client_name
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
      updated_at: r.updated_at
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
  const { dateFrom, dateTo, requesterId, status, serviceType } = filters
  
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
      created_at: r.created_at
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
    return r.status === 'Pending Compliance Review' || r.status === 'Rejected'
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
      totalPendingReviews: requests.filter(r => r.status === 'Pending Compliance Review').length,
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
    WHERE status IN ('Pending Compliance Review', 'Pending Director Approval', 'Pending Partner Approval')
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
  
  // Get all prospects from COI system (new clients)
  let query = `
    SELECT 
      r.*,
      c.client_name,
      c.client_code,
      CASE 
        WHEN c.id IN (SELECT DISTINCT client_id FROM coi_requests WHERE status = 'Active') 
        THEN 'Converted'
        WHEN c.id IN (SELECT DISTINCT client_id FROM coi_requests WHERE status IN ('Approved', 'Active'))
        THEN 'Active'
        ELSE 'Inactive'
      END as prospect_status
    FROM coi_requests r
    INNER JOIN clients c ON r.client_id = c.id
    WHERE r.relationship_with_client = 'New Client'
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
  const inactiveProspects = prospects.filter(p => p.prospect_status === 'Inactive').length
  
  // Check if prospects are linked to existing PRMS clients (simplified - check client_code)
  const linkedToPRMS = prospects.filter(p => p.client_code && p.client_code.startsWith('CLI-')).length
  
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
      inactiveProspects,
      linkedToPRMS,
      conversionRatio: parseFloat(conversionRatio)
    },
    prospects: filteredProspects.map(p => ({
      request_id: p.request_id,
      client_name: p.client_name,
      client_code: p.client_code,
      service_type: p.service_type,
      status: p.status,
      prospect_status: p.prospect_status,
      created_at: p.created_at
    }))
  }
}
