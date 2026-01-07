import { getDatabase } from '../database/init.js'

/**
 * Similar Cases Service
 * Finds historical decisions on similar COI requests to help Compliance Officers make informed decisions
 */

// Similarity weights for different factors
const SIMILARITY_WEIGHTS = {
  CLIENT_NAME: 0.25,
  SERVICE_TYPE: 0.25,
  PIE_STATUS: 0.15,
  INTERNATIONAL: 0.10,
  OWNERSHIP_STRUCTURE: 0.10,
  DECISION_OUTCOME: 0.15
}

/**
 * Find similar historical cases for a given request
 */
export function findSimilarCases(requestId, options = {}) {
  const db = getDatabase()
  const limit = options.limit || 10
  const minSimilarity = options.minSimilarity || 50
  
  // Get the target request
  const targetRequest = db.prepare(`
    SELECT r.*, c.client_name, c.industry_sector
    FROM coi_requests r
    LEFT JOIN clients c ON r.client_id = c.id
    WHERE r.id = ?
  `).get(requestId)
  
  if (!targetRequest) {
    return { success: false, error: 'Request not found', cases: [] }
  }
  
  // Get all completed requests (approved or rejected) excluding the target
  const historicalCases = db.prepare(`
    SELECT 
      r.*,
      c.client_name,
      c.industry_sector,
      u_requestor.name as requestor_name,
      u_compliance.name as compliance_reviewer,
      cal.decision_outcome,
      cal.justification,
      cal.override_reason,
      cal.approval_level
    FROM coi_requests r
    LEFT JOIN clients c ON r.client_id = c.id
    LEFT JOIN users u_requestor ON r.created_by = u_requestor.id
    LEFT JOIN users u_compliance ON r.compliance_reviewer_id = u_compliance.id
    LEFT JOIN compliance_audit_log cal ON r.id = cal.request_id 
      AND cal.action_type IN ('Approved', 'Rejected')
    WHERE r.id != ?
      AND r.status IN ('Approved', 'Rejected', 'Closed')
    ORDER BY r.updated_at DESC
    LIMIT 500
  `).all(requestId)
  
  // Calculate similarity scores
  const scoredCases = historicalCases.map(historicalCase => {
    const scores = calculateSimilarityScores(targetRequest, historicalCase)
    const totalScore = calculateTotalScore(scores)
    
    return {
      ...historicalCase,
      similarity: {
        total: Math.round(totalScore),
        breakdown: scores
      }
    }
  })
  
  // Filter by minimum similarity and sort
  const similarCases = scoredCases
    .filter(c => c.similarity.total >= minSimilarity)
    .sort((a, b) => b.similarity.total - a.similarity.total)
    .slice(0, limit)
    .map(formatCaseForUI)
  
  // Get aggregated statistics
  const stats = aggregateSimilarCasesStats(similarCases)
  
  return {
    success: true,
    targetRequest: {
      id: targetRequest.id,
      request_id: targetRequest.request_id,
      client_name: targetRequest.client_name,
      service_type: targetRequest.service_type
    },
    cases: similarCases,
    stats,
    totalFound: similarCases.length
  }
}

/**
 * Calculate similarity scores between two requests
 */
function calculateSimilarityScores(target, historical) {
  const scores = {}
  
  // Client name similarity (fuzzy match)
  scores.clientName = calculateNameSimilarity(
    target.client_name || '',
    historical.client_name || ''
  )
  
  // Service type match
  scores.serviceType = calculateServiceTypeSimilarity(
    target.service_type,
    historical.service_type
  )
  
  // PIE status match
  scores.pieStatus = target.pie_status === historical.pie_status ? 100 : 0
  
  // International operations match
  const targetIntl = parseInternationalOps(target.international_operations)
  const histIntl = parseInternationalOps(historical.international_operations)
  scores.international = calculateInternationalSimilarity(targetIntl, histIntl)
  
  // Ownership structure similarity
  scores.ownership = calculateOwnershipSimilarity(
    target.ownership_structure,
    historical.ownership_structure
  )
  
  // Industry sector match (bonus)
  scores.industrySector = target.industry_sector === historical.industry_sector ? 100 : 
    (areSimilarIndustries(target.industry_sector, historical.industry_sector) ? 50 : 0)
  
  return scores
}

/**
 * Calculate total weighted score
 */
function calculateTotalScore(scores) {
  let total = 0
  total += scores.clientName * SIMILARITY_WEIGHTS.CLIENT_NAME
  total += scores.serviceType * SIMILARITY_WEIGHTS.SERVICE_TYPE
  total += scores.pieStatus * SIMILARITY_WEIGHTS.PIE_STATUS
  total += scores.international * SIMILARITY_WEIGHTS.INTERNATIONAL
  total += scores.ownership * SIMILARITY_WEIGHTS.OWNERSHIP_STRUCTURE
  return total
}

/**
 * Fuzzy name similarity using Levenshtein distance
 */
function calculateNameSimilarity(name1, name2) {
  if (!name1 || !name2) return 0
  
  const normalized1 = normalizeCompanyName(name1)
  const normalized2 = normalizeCompanyName(name2)
  
  if (normalized1 === normalized2) return 100
  
  // Check if one contains the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 80
  }
  
  // Levenshtein distance
  const distance = levenshteinDistance(normalized1, normalized2)
  const maxLen = Math.max(normalized1.length, normalized2.length)
  if (maxLen === 0) return 100
  
  return Math.max(0, Math.round(((maxLen - distance) / maxLen) * 100))
}

/**
 * Normalize company name for comparison
 */
function normalizeCompanyName(name) {
  return name
    .toLowerCase()
    .replace(/\b(ltd|limited|inc|incorporated|corp|corporation|llc|plc|sa|ag|gmbh|holdings|group|international|global)\b/gi, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1, str2) {
  const matrix = []
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[str2.length][str1.length]
}

/**
 * Service type similarity with category matching
 */
function calculateServiceTypeSimilarity(type1, type2) {
  if (!type1 || !type2) return 0
  if (type1 === type2) return 100
  
  const categories = {
    AUDIT: ['Statutory Audit', 'External Audit', 'Group Audit', 'IFRS Audit'],
    TAX: ['Tax Compliance', 'Tax Advisory', 'Transfer Pricing', 'Tax Planning'],
    ADVISORY: ['Management Consulting', 'Business Advisory', 'Strategy Consulting'],
    ACCOUNTING: ['Bookkeeping', 'Accounting Services', 'Financial Reporting'],
    VALUATION: ['Valuation Services', 'Business Valuation', 'Asset Valuation'],
    DUE_DILIGENCE: ['Due Diligence', 'Transaction Advisory', 'M&A Advisory']
  }
  
  let cat1 = null, cat2 = null
  for (const [category, services] of Object.entries(categories)) {
    if (services.some(s => type1.toLowerCase().includes(s.toLowerCase()))) cat1 = category
    if (services.some(s => type2.toLowerCase().includes(s.toLowerCase()))) cat2 = category
  }
  
  if (cat1 && cat2 && cat1 === cat2) return 75
  return 0
}

/**
 * Parse international operations JSON
 */
function parseInternationalOps(ops) {
  if (!ops) return null
  try {
    return typeof ops === 'string' ? JSON.parse(ops) : ops
  } catch {
    return null
  }
}

/**
 * Calculate international operations similarity
 */
function calculateInternationalSimilarity(ops1, ops2) {
  if (!ops1 && !ops2) return 100
  if (!ops1 || !ops2) return 0
  
  const hasIntl1 = ops1.hasInternationalOps
  const hasIntl2 = ops2.hasInternationalOps
  
  if (hasIntl1 !== hasIntl2) return 0
  if (!hasIntl1 && !hasIntl2) return 100
  
  // Compare countries
  const countries1 = new Set((ops1.countries || []).map(c => c.toLowerCase()))
  const countries2 = new Set((ops2.countries || []).map(c => c.toLowerCase()))
  
  if (countries1.size === 0 && countries2.size === 0) return 100
  
  const intersection = [...countries1].filter(c => countries2.has(c))
  const union = new Set([...countries1, ...countries2])
  
  return Math.round((intersection.length / union.size) * 100)
}

/**
 * Calculate ownership structure similarity
 */
function calculateOwnershipSimilarity(struct1, struct2) {
  if (!struct1 && !struct2) return 100
  if (!struct1 || !struct2) return 0
  
  const parsed1 = typeof struct1 === 'string' ? safeParseJSON(struct1) : struct1
  const parsed2 = typeof struct2 === 'string' ? safeParseJSON(struct2) : struct2
  
  if (!parsed1 || !parsed2) return 0
  
  // Compare key aspects
  let matches = 0
  let total = 0
  
  if (parsed1.isPubliclyTraded !== undefined && parsed2.isPubliclyTraded !== undefined) {
    total++
    if (parsed1.isPubliclyTraded === parsed2.isPubliclyTraded) matches++
  }
  
  if (parsed1.hasGovernmentOwnership !== undefined && parsed2.hasGovernmentOwnership !== undefined) {
    total++
    if (parsed1.hasGovernmentOwnership === parsed2.hasGovernmentOwnership) matches++
  }
  
  if (total === 0) return 50
  return Math.round((matches / total) * 100)
}

function safeParseJSON(str) {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

/**
 * Check if industries are similar
 */
function areSimilarIndustries(ind1, ind2) {
  if (!ind1 || !ind2) return false
  
  const industryGroups = {
    FINANCIAL: ['Banking', 'Insurance', 'Investment', 'Financial Services', 'Asset Management'],
    TECH: ['Technology', 'Software', 'IT Services', 'Telecommunications'],
    MANUFACTURING: ['Manufacturing', 'Industrial', 'Automotive', 'Aerospace'],
    HEALTHCARE: ['Healthcare', 'Pharmaceutical', 'Biotech', 'Medical'],
    RETAIL: ['Retail', 'Consumer Goods', 'E-commerce', 'FMCG'],
    ENERGY: ['Energy', 'Oil & Gas', 'Utilities', 'Renewable Energy']
  }
  
  for (const industries of Object.values(industryGroups)) {
    const has1 = industries.some(i => ind1.toLowerCase().includes(i.toLowerCase()))
    const has2 = industries.some(i => ind2.toLowerCase().includes(i.toLowerCase()))
    if (has1 && has2) return true
  }
  
  return false
}

/**
 * Format case for UI display
 */
function formatCaseForUI(caseData) {
  return {
    id: caseData.id,
    requestId: caseData.request_id,
    clientName: caseData.client_name,
    serviceType: caseData.service_type,
    pieStatus: caseData.pie_status,
    status: caseData.status,
    decision: {
      outcome: caseData.decision_outcome || caseData.status,
      justification: caseData.justification,
      overrideReason: caseData.override_reason,
      approvalLevel: caseData.approval_level,
      reviewedBy: caseData.compliance_reviewer,
      date: caseData.compliance_review_date || caseData.updated_at
    },
    similarity: caseData.similarity,
    createdAt: caseData.created_at,
    updatedAt: caseData.updated_at
  }
}

/**
 * Aggregate statistics from similar cases
 */
function aggregateSimilarCasesStats(cases) {
  if (cases.length === 0) {
    return {
      totalCases: 0,
      approvedRate: 0,
      rejectedRate: 0,
      averageSimilarity: 0,
      commonReasons: []
    }
  }
  
  const approved = cases.filter(c => c.status === 'Approved').length
  const rejected = cases.filter(c => c.status === 'Rejected').length
  const avgSimilarity = cases.reduce((sum, c) => sum + c.similarity.total, 0) / cases.length
  
  // Extract common justifications/reasons
  const reasons = cases
    .filter(c => c.decision.justification)
    .map(c => c.decision.justification)
  
  return {
    totalCases: cases.length,
    approvedCount: approved,
    rejectedCount: rejected,
    approvedRate: Math.round((approved / cases.length) * 100),
    rejectedRate: Math.round((rejected / cases.length) * 100),
    averageSimilarity: Math.round(avgSimilarity),
    commonReasons: reasons.slice(0, 3)
  }
}

/**
 * Find cases by specific criteria
 */
export function findCasesByCriteria(criteria) {
  const db = getDatabase()
  
  let query = `
    SELECT 
      r.*,
      c.client_name,
      c.industry_sector,
      u.name as compliance_reviewer
    FROM coi_requests r
    LEFT JOIN clients c ON r.client_id = c.id
    LEFT JOIN users u ON r.compliance_reviewer_id = u.id
    WHERE r.status IN ('Approved', 'Rejected', 'Closed')
  `
  const params = []
  
  if (criteria.serviceType) {
    query += ` AND r.service_type LIKE ?`
    params.push(`%${criteria.serviceType}%`)
  }
  
  if (criteria.pieStatus) {
    query += ` AND r.pie_status = ?`
    params.push(criteria.pieStatus)
  }
  
  if (criteria.outcome) {
    query += ` AND r.status = ?`
    params.push(criteria.outcome)
  }
  
  if (criteria.dateFrom) {
    query += ` AND r.created_at >= ?`
    params.push(criteria.dateFrom)
  }
  
  if (criteria.dateTo) {
    query += ` AND r.created_at <= ?`
    params.push(criteria.dateTo)
  }
  
  query += ` ORDER BY r.updated_at DESC LIMIT ?`
  params.push(criteria.limit || 50)
  
  return db.prepare(query).all(...params).map(formatCaseForUI)
}

/**
 * Get decision history for a specific client
 */
export function getClientDecisionHistory(clientId) {
  const db = getDatabase()
  
  const requests = db.prepare(`
    SELECT 
      r.*,
      c.client_name,
      u.name as compliance_reviewer,
      cal.decision_outcome,
      cal.justification
    FROM coi_requests r
    LEFT JOIN clients c ON r.client_id = c.id
    LEFT JOIN users u ON r.compliance_reviewer_id = u.id
    LEFT JOIN compliance_audit_log cal ON r.id = cal.request_id
      AND cal.action_type IN ('Approved', 'Rejected')
    WHERE r.client_id = ?
    ORDER BY r.created_at DESC
  `).all(clientId)
  
  return requests.map(formatCaseForUI)
}

