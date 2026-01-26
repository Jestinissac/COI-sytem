import { getDatabase } from '../database/init.js'
import { checkRedLines } from './redLinesService.js'
import { evaluateIESBADecisionMatrix } from './iesbaDecisionMatrix.js'
import { isProEdition } from './configService.js'

// Service type categories
const SERVICE_CATEGORIES = {
  AUDIT: ['Statutory Audit', 'External Audit', 'Group Audit', 'IFRS Audit'],
  INTERNAL_AUDIT: ['Internal Audit', 'Internal Controls Review'],
  ADVISORY: ['Management Consulting', 'Business Advisory', 'Strategy Consulting', 'Restructuring'],
  // Pro Version: Split TAX into sub-types
  TAX_COMPLIANCE: ['Tax Compliance', 'Tax Return Preparation', 'Tax Filing'],
  TAX_PLANNING: ['Tax Planning', 'Tax Advisory', 'Tax Strategy', 'Tax Optimization'],
  TAX_CALCULATIONS: ['Tax Calculations', 'Transfer Pricing', 'Tax Valuation'],
  // Legacy TAX category (for backward compatibility)
  TAX: ['Tax Compliance', 'Tax Advisory', 'Transfer Pricing', 'Tax Planning'],
  ACCOUNTING: ['Bookkeeping', 'Accounting Services', 'Financial Reporting', 'Payroll Services'],
  VALUATION: ['Valuation Services', 'Business Valuation', 'Asset Valuation'],
  DUE_DILIGENCE: ['Due Diligence', 'Transaction Advisory', 'M&A Advisory'],
  IT_ADVISORY: ['IT Advisory', 'Cybersecurity', 'IT Audit']
}

// Conflict matrix: Which services CANNOT be provided together
const CONFLICT_MATRIX = {
  // If client has AUDIT, these services are BLOCKED
  AUDIT: {
    blocked: ['ADVISORY', 'ACCOUNTING', 'VALUATION', 'INTERNAL_AUDIT', 'TAX_PLANNING'], // Pro: TAX_PLANNING blocked
    flagged: ['TAX', 'TAX_COMPLIANCE', 'TAX_CALCULATIONS', 'DUE_DILIGENCE', 'IT_ADVISORY'], // Pro: Tax sub-types
    reason: {
      ADVISORY: 'Management consulting threatens auditor independence',
      ACCOUNTING: 'Cannot audit own bookkeeping work (self-review threat)',
      VALUATION: 'Cannot audit valuations we performed (self-review threat)',
      INTERNAL_AUDIT: 'Cannot outsource internal audit function for audit client',
      TAX: 'Tax services for audit client require fee cap review',
      TAX_COMPLIANCE: 'Tax compliance services require safeguards and fee cap review',
      TAX_PLANNING: 'Tax planning for audit client creates self-review threat - PROHIBITED',
      TAX_CALCULATIONS: 'Tax calculations require safeguards and fee cap review',
      DUE_DILIGENCE: 'Due diligence may create self-review threat',
      IT_ADVISORY: 'IT systems advice may affect audit scope'
    }
  },
  // If client has ADVISORY, AUDIT is blocked (cooling-off required)
  ADVISORY: {
    blocked: ['AUDIT'],
    flagged: [],
    reason: {
      AUDIT: 'Cooling-off period required after management consulting (typically 2 years)'
    }
  },
  // If client has ACCOUNTING, AUDIT is blocked
  ACCOUNTING: {
    blocked: ['AUDIT'],
    flagged: [],
    reason: {
      AUDIT: 'Cannot audit financial statements we prepared (self-review threat)'
    }
  },
  // If client has VALUATION, AUDIT is flagged
  VALUATION: {
    blocked: ['AUDIT'],
    flagged: [],
    reason: {
      AUDIT: 'Cannot audit valuations we performed (self-review threat)'
    }
  },
  // Internal audit conflicts
  INTERNAL_AUDIT: {
    blocked: ['AUDIT'],
    flagged: [],
    reason: {
      AUDIT: 'Cannot provide external audit where internal audit was outsourced to us'
    }
  }
}

// PIE (Public Interest Entity) additional restrictions
const PIE_RESTRICTIONS = {
  blocked: ['ADVISORY', 'ACCOUNTING', 'VALUATION', 'INTERNAL_AUDIT', 'IT_ADVISORY', 'TAX_PLANNING'], // Pro: TAX_PLANNING blocked for PIE
  flagged: ['TAX', 'TAX_COMPLIANCE', 'TAX_CALCULATIONS', 'DUE_DILIGENCE'], // Pro: Tax sub-types
  feeCapApplies: true, // Non-audit fees cannot exceed 70% of audit fees
  reason: 'PIE audit clients have strict non-audit service restrictions under EU/local regulations'
}

export async function checkDuplication(clientName, excludeRequestId = null, newServiceType = null, isPIE = false, requestData = null) {
  const db = getDatabase()
  const isPro = isProEdition()
  
  const allRecommendations = []
  
  // Pro Version: Phase 8 - Execution Order with Priority System
  // 1. Red Lines Check (Pro only) - HIGHEST PRIORITY
  if (isPro && requestData) {
    const redLines = checkRedLines(requestData)
    if (redLines && redLines.length > 0) {
      redLines.forEach(redLine => {
        allRecommendations.push({
          ...redLine,
          source: 'RED_LINES',
          priority: 1 // Highest priority
        })
      })
    }
  }
  
  // Get all active engagements for potential matches
  let activeRequests
  if (excludeRequestId) {
    activeRequests = db.prepare(`
      SELECT r.*, c.client_name, c.client_code, c.parent_company_id
      FROM coi_requests r
      INNER JOIN clients c ON r.client_id = c.id
      WHERE r.status IN ('Approved', 'Active') AND r.id != ?
    `).all(excludeRequestId)
  } else {
    activeRequests = db.prepare(`
      SELECT r.*, c.client_name, c.client_code, c.parent_company_id
      FROM coi_requests r
      INNER JOIN clients c ON r.client_id = c.id
      WHERE r.status IN ('Approved', 'Active')
    `).all()
  }

  const matches = []
  
  for (const request of activeRequests) {
    // 1. Check client name similarity
    const nameScore = calculateSimilarity(clientName, request.client_name)
    
    if (nameScore >= 75) {
      const match = {
        matchScore: nameScore,
        matchType: 'CLIENT_NAME',
        existingEngagement: {
          request_id: request.request_id,
          client_name: request.client_name,
          client_code: request.client_code,
          service_type: request.service_type,
          engagement_code: request.engagement_code,
          status: request.status
        },
        reason: getMatchReason(nameScore),
        action: nameScore >= 90 ? 'block' : 'flag',
        conflicts: []
      }
      
      // 2. Check service type conflicts
      if (newServiceType && request.service_type) {
        const serviceConflict = checkServiceTypeConflict(
          request.service_type, 
          newServiceType, 
          request.pie_status === 'Yes' || isPIE
        )
        
        if (serviceConflict) {
          match.conflicts.push(serviceConflict)
          
          // Escalate action if there's a service conflict
          if (serviceConflict.severity === 'CRITICAL') {
            match.action = 'block'
            match.reason = serviceConflict.reason
          } else if (serviceConflict.severity === 'HIGH' && match.action !== 'block') {
            match.action = 'flag'
          }
        }
      }
      
      matches.push(match)
    }
  }

  // Also check for related party / group company conflicts
  const relatedPartyMatches = await checkRelatedPartyConflicts(clientName, newServiceType, excludeRequestId)
  matches.push(...relatedPartyMatches)

  // Pro Version: Phase 8 - IESBA Decision Matrix (after business rules, before conflict matrix)
  if (isPro && requestData && newServiceType) {
    const iesbaRecommendations = evaluateIESBADecisionMatrix({
      ...requestData,
      service_type: newServiceType,
      pie_status: isPIE ? 'Yes' : 'No'
    })
    if (iesbaRecommendations && iesbaRecommendations.length > 0) {
      iesbaRecommendations.forEach(rec => {
        allRecommendations.push({
          ...rec,
          source: 'IESBA_DECISION_MATRIX',
          priority: 2 // Second priority (after Red Lines, before Business Rules)
        })
      })
    }
  }
  
  // Convert matches to recommendations format (Pro) or keep as matches (Standard)
  if (isPro) {
    matches.forEach(match => {
      allRecommendations.push({
        severity: match.action === 'block' ? 'CRITICAL' : 'HIGH',
        recommendedAction: match.action === 'block' ? 'REJECT' : 'FLAG',
        confidence: match.matchScore >= 90 ? 'HIGH' : 'MEDIUM',
        reason: match.reason,
        regulation: match.conflicts?.[0]?.regulation || 'IESBA Code of Ethics',
        canOverride: match.action !== 'block',
        requiresComplianceReview: true,
        source: 'CONFLICT_MATRIX',
        priority: 4, // Lowest priority
        matchData: match
      })
    })
    
    // Sort by priority (Red Lines > IESBA Matrix > Conflict Matrix)
    allRecommendations.sort((a, b) => (a.priority || 99) - (b.priority || 99))
    
    return {
      recommendations: allRecommendations,
      matches: matches, // Keep for backward compatibility
      isPro: true
    }
  }

  return matches.sort((a, b) => {
    // Sort by action (block first), then by score
    if (a.action === 'block' && b.action !== 'block') return -1
    if (b.action === 'block' && a.action !== 'block') return 1
    return b.matchScore - a.matchScore
  })
}

function checkServiceTypeConflict(existingServiceType, newServiceType, isPIE = false) {
  const existingCategory = getServiceCategory(existingServiceType)
  const newCategory = getServiceCategory(newServiceType)
  
  if (!existingCategory || !newCategory) return null
  
  // Check if PIE restrictions apply
  if (isPIE && existingCategory === 'AUDIT') {
    if (PIE_RESTRICTIONS.blocked.includes(newCategory)) {
      return {
        type: 'PIE_RESTRICTION',
        severity: 'CRITICAL',
        existingService: existingServiceType,
        newService: newServiceType,
        reason: `🚫 PIE AUDIT CLIENT: ${newServiceType} is PROHIBITED for Public Interest Entity audit clients`,
        regulation: 'EU Audit Regulation / Local Independence Rules'
      }
    }
    if (PIE_RESTRICTIONS.flagged.includes(newCategory)) {
      return {
        type: 'PIE_FEE_CAP',
        severity: 'HIGH',
        existingService: existingServiceType,
        newService: newServiceType,
        reason: `⚠️ PIE Fee Cap: Non-audit fees must not exceed 70% of audit fees`,
        regulation: 'EU Audit Regulation Article 4(2)'
      }
    }
  }
  
  // Check general conflict matrix
  const conflictConfig = CONFLICT_MATRIX[existingCategory]
  if (!conflictConfig) return null
  
  if (conflictConfig.blocked && conflictConfig.blocked.includes(newCategory)) {
    return {
      type: 'INDEPENDENCE_CONFLICT',
      severity: 'CRITICAL',
      existingService: existingServiceType,
      newService: newServiceType,
      reason: `🚫 INDEPENDENCE THREAT: ${conflictConfig.reason[newCategory]}`,
      regulation: 'IESBA Code of Ethics / Local Independence Rules'
    }
  }
  
  if (conflictConfig.flagged && conflictConfig.flagged.includes(newCategory)) {
    return {
      type: 'POTENTIAL_CONFLICT',
      severity: 'HIGH',
      existingService: existingServiceType,
      newService: newServiceType,
      reason: `⚠️ REVIEW REQUIRED: ${conflictConfig.reason[newCategory] || 'Potential independence concern'}`,
      regulation: 'IESBA Code of Ethics'
    }
  }
  
  return null
}

function getServiceCategory(serviceType) {
  if (!serviceType) return null
  
  const normalizedService = serviceType.toLowerCase()
  
  // Pro Version: Check tax sub-types first (more specific)
  for (const [category, services] of Object.entries(SERVICE_CATEGORIES)) {
    if (category.startsWith('TAX_')) {
      // Check tax sub-types first
      if (services.some(s => normalizedService.includes(s.toLowerCase()) || s.toLowerCase().includes(normalizedService))) {
        return category
      }
    }
  }
  
  // Then check other categories (including legacy TAX)
  for (const [category, services] of Object.entries(SERVICE_CATEGORIES)) {
    if (!category.startsWith('TAX_')) {
      if (services.some(s => normalizedService.includes(s.toLowerCase()) || s.toLowerCase().includes(normalizedService))) {
        return category
      }
    }
  }
  
  return null
}

// Pro Version: Get tax sub-type from service type
function getTaxSubType(serviceType) {
  if (!serviceType) return null
  const normalized = serviceType.toLowerCase()
  
  if (SERVICE_CATEGORIES.TAX_COMPLIANCE.some(s => normalized.includes(s.toLowerCase()))) {
    return 'TAX_COMPLIANCE'
  }
  if (SERVICE_CATEGORIES.TAX_PLANNING.some(s => normalized.includes(s.toLowerCase()))) {
    return 'TAX_PLANNING'
  }
  if (SERVICE_CATEGORIES.TAX_CALCULATIONS.some(s => normalized.includes(s.toLowerCase()))) {
    return 'TAX_CALCULATIONS'
  }
  
  return null
}

async function checkRelatedPartyConflicts(clientName, newServiceType, excludeRequestId) {
  const db = getDatabase()
  
  // Find potential parent/subsidiary relationships
  // This is a simplified check - in production would use proper hierarchy tables
  const relatedMatches = []
  
  // Check if client name contains common parent/subsidiary indicators
  const parentIndicators = ['Holdings', 'Group', 'International', 'Global']
  const subsidiaryIndicators = ['Subsidiary', 'Branch', 'Division']
  
  const baseName = extractBaseName(clientName)
  
  // Find clients with similar base names (potential related parties)
  const potentialRelated = db.prepare(`
    SELECT DISTINCT c.*, r.service_type, r.status, r.request_id, r.engagement_code, r.pie_status
    FROM clients c
    LEFT JOIN coi_requests r ON c.id = r.client_id AND r.status IN ('Approved', 'Active')
    WHERE c.client_name LIKE ? AND r.id != ?
  `).all(`%${baseName}%`, excludeRequestId || 0)
  
  for (const related of potentialRelated) {
    if (!related.request_id) continue
    
    const relatedBaseName = extractBaseName(related.client_name)
    if (relatedBaseName === baseName && related.client_name !== clientName) {
      const match = {
        matchScore: 80,
        matchType: 'RELATED_PARTY',
        existingEngagement: {
          request_id: related.request_id,
          client_name: related.client_name,
          service_type: related.service_type,
          engagement_code: related.engagement_code,
          status: related.status
        },
        reason: `🔗 RELATED PARTY: "${related.client_name}" appears to be related to "${clientName}"`,
        action: 'flag',
        conflicts: []
      }
      
      // Check if audit independence extends to related party
      if (newServiceType && related.service_type) {
        const existingCategory = getServiceCategory(related.service_type)
        const newCategory = getServiceCategory(newServiceType)
        
        if (existingCategory === 'AUDIT' && ['ADVISORY', 'ACCOUNTING'].includes(newCategory)) {
          match.action = 'block'
          match.conflicts.push({
            type: 'RELATED_PARTY_INDEPENDENCE',
            severity: 'CRITICAL',
            reason: `🚫 Parent/Subsidiary of audit client - independence rules extend to related entities`
          })
        }
      }
      
      relatedMatches.push(match)
    }
  }
  
  return relatedMatches
}

function extractBaseName(clientName) {
  // Remove common suffixes and prefixes to find base company name
  return clientName
    .replace(/\b(Holdings|Group|International|Global|Subsidiary|Branch|Division|Ltd|Limited|Inc|Corp|Corporation|LLC|PLC|SA|AG|GmbH)\b/gi, '')
    .replace(/[^\w\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 2)
    .join(' ')
}

function calculateSimilarity(str1, str2) {
  const normalized1 = normalizeString(str1)
  const normalized2 = normalizeString(str2)
  
  if (normalized1 === normalized2) {
    return 100
  }

  // Check abbreviation match
  const expanded1 = expandAbbreviations(normalized1)
  const expanded2 = expandAbbreviations(normalized2)
  
  if (expanded1 === expanded2) {
    return 85
  }

  // ========================================
  // FIX: Handle numeric identifier patterns
  // ========================================
  // Detect if names differ primarily by numeric codes (e.g., "Client 021 Company" vs "Client 019 Company")
  // These should be treated as DIFFERENT entities, not similar ones
  
  // Extract numeric patterns from both strings
  const nums1 = expanded1.match(/\d+/g) || []
  const nums2 = expanded2.match(/\d+/g) || []
  
  // Remove numbers to get the "template" of the name
  const template1 = expanded1.replace(/\d+/g, '###')
  const template2 = expanded2.replace(/\d+/g, '###')
  
  // If templates are identical but numbers differ, these are distinct entities
  if (template1 === template2 && nums1.length > 0 && nums2.length > 0) {
    // Check if any corresponding numbers differ
    const numsDiffer = nums1.some((n, i) => nums2[i] && n !== nums2[i])
    if (numsDiffer) {
      // Names follow same pattern but have different identifiers
      // Return 0% to completely ignore these matches (no service conflict checks)
      return 0 // Completely different entities - do not match
    }
  }
  
  // Also check for sequential/similar numeric patterns that indicate distinct entities
  // e.g., "ABC-001" vs "ABC-002" or "Project 15" vs "Project 16"
  if (nums1.length > 0 && nums2.length > 0) {
    // Get non-numeric parts
    const textOnly1 = expanded1.replace(/\d+/g, '').replace(/\s+/g, ' ').trim()
    const textOnly2 = expanded2.replace(/\d+/g, '').replace(/\s+/g, ' ').trim()
    
    // If text parts are very similar (>90%) but numbers differ, treat as distinct
    if (textOnly1 && textOnly2) {
      const textDistance = levenshteinDistance(textOnly1, textOnly2)
      const maxTextLen = Math.max(textOnly1.length, textOnly2.length)
      const textSimilarity = maxTextLen > 0 ? ((maxTextLen - textDistance) / maxTextLen) * 100 : 0
      
      if (textSimilarity > 90 && nums1.join('') !== nums2.join('')) {
        // Same naming convention, different ID numbers = different entities
        return 0 // Completely different entities - do not match
      }
    }
  }

  // Standard Levenshtein distance for other cases
  const distance = levenshteinDistance(expanded1, expanded2)
  const maxLength = Math.max(expanded1.length, expanded2.length)
  
  if (maxLength === 0) return 100
  
  return Math.round(((maxLength - distance) / maxLength) * 100)
}

function normalizeString(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
}

function expandAbbreviations(str) {
  const abbreviations = {
    'corp': 'corporation',
    'ltd': 'limited',
    'inc': 'incorporated',
    'llc': 'limited liability company',
    'co': 'company',
    'intl': 'international',
    'natl': 'national',
    'assoc': 'association',
    'grp': 'group',
    'holdings': 'holding',
    'pvt': 'private',
    'plc': 'public limited company',
    'gmbh': 'gesellschaft mit beschrankter haftung',
    'sa': 'sociedad anonima',
    'ag': 'aktiengesellschaft',
    'ltd.': 'limited',
    'inc.': 'incorporated',
    'corp.': 'corporation',
    'co.': 'company',
    'intl.': 'international'
  }

  let expanded = str
  for (const [abbr, full] of Object.entries(abbreviations)) {
    const escapedAbbr = abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\b${escapedAbbr}\\b`, 'gi')
    expanded = expanded.replace(regex, full)
  }
  
  return expanded
}

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

function getMatchReason(score) {
  if (score >= 90) {
    return 'Exact or very close match'
  } else if (score >= 75) {
    return 'Similar name detected'
  }
  return 'Low similarity'
}

// ========================================
// GROUP CONFLICT DETECTION (IESBA 290.13)
// ========================================
// Detects conflicts across parent/subsidiary relationships

const AUDIT_SERVICES = ['Statutory Audit', 'External Audit', 'Group Audit', 'IFRS Audit', 'Audit', 'Assurance', 'Financial Statement Audit', 'Limited Review', 'Agreed Upon Procedures']
const PROHIBITED_SERVICES = ['Tax Advocacy', 'Bookkeeping', 'Management Functions', 'Management Consulting']
const ADVISORY_SERVICES = ['Management Consulting', 'Business Advisory', 'Strategy Consulting']

function isAuditServiceType(serviceType) {
  if (!serviceType) return false
  
  // Exact match
  if (AUDIT_SERVICES.includes(serviceType)) return true
  
  // Contains 'Audit' but not 'Internal Audit'
  const lower = serviceType.toLowerCase()
  if (lower.includes('audit') && !lower.includes('internal')) return true
  
  // Contains 'Assurance' 
  if (lower.includes('assurance')) return true
  
  return false
}

/**
 * Check for group/parent company conflicts
 * Uses structured relationships (parent_company_id) when available, falls back to text matching
 * 
 * @param {number} requestId - The COI request ID to check
 * @returns {Object} - { conflicts: [], warnings: [] }
 */
export async function checkGroupConflicts(requestId) {
  const db = getDatabase()
  const request = db.prepare(`
    SELECT * FROM coi_requests WHERE id = ?
  `).get(requestId)
  
  if (!request) {
    return { conflicts: [], warnings: [] }
  }
  
  const conflicts = []
  const warnings = []
  
  // Use structured relationship (parent_company_id) if available, otherwise fall back to text
  const parentCompanyId = request.parent_company_id
  const parentCompanyName = request.parent_company
  
  if (!parentCompanyId && !parentCompanyName) {
    return { conflicts: [], warnings: [] }
  }
  
  let allRelated = []
  
  // Phase 1: Use structured parent_company_id for accurate sibling detection (preferred method)
  if (parentCompanyId) {
    // Find all entities with same parent_company_id (sister companies)
    const structuredSiblings = db.prepare(`
      SELECT r.*, c.client_name as parent_name
      FROM coi_requests r
      LEFT JOIN clients c ON r.parent_company_id = c.id
      WHERE r.parent_company_id = ?
      AND r.status IN ('Approved', 'Active', 'Pending Finance', 'Pending Partner')
      AND r.id != ?
    `).all(parentCompanyId, requestId)
    
    allRelated.push(...structuredSiblings.map(s => ({
      ...s,
      relationship_type: 'sister',
      relationship_path: `Same Parent (ID: ${parentCompanyId}) → ${s.client_name}`
    })))
    
    // Find parent company itself (if it exists in clients table)
    const parentCompany = db.prepare(`
      SELECT r.*
      FROM coi_requests r
      WHERE r.client_id = ?
      AND r.status IN ('Approved', 'Active', 'Pending Finance', 'Pending Partner')
      AND r.id != ?
    `).all(parentCompanyId, requestId)
    
    allRelated.push(...parentCompany.map(p => ({
      ...p,
      relationship_type: 'parent',
      relationship_path: `Parent Company → ${p.client_name}`
    })))
  }
  
  // Phase 2: Find entities where THIS client is listed as parent (children/subsidiaries)
  // Check both structured (parent_company_id) and text-based (parent_company) relationships
  const childrenStructured = parentCompanyId ? db.prepare(`
    SELECT r.*
    FROM coi_requests r
    WHERE r.parent_company_id = (
      SELECT client_id FROM coi_requests WHERE id = ?
    )
    AND r.status IN ('Approved', 'Active', 'Pending Finance', 'Pending Partner')
    AND r.id != ?
  `).all(requestId, requestId) : []
  
  const childrenText = request.client_name ? findEntitiesWithParent(request.client_name, requestId, db) : []
  
  // Merge and deduplicate
  const allChildren = [...childrenStructured, ...childrenText]
  const uniqueChildren = Array.from(new Map(allChildren.map(c => [c.id, c])).values())
  
  allRelated.push(...uniqueChildren.map(c => ({
    ...c,
    relationship_type: 'subsidiary',
    relationship_path: `${request.client_name} → ${c.client_name} (Subsidiary)`
  })))
  
  // Phase 3: Fallback to text-based matching for legacy data or when structured link unavailable
  if (!parentCompanyId && parentCompanyName) {
    const textSiblings = findEntitiesWithParent(parentCompanyName, requestId, db)
    allRelated.push(...textSiblings.map(s => ({
      ...s,
      relationship_type: 'sister',
      relationship_path: `Same Parent (${parentCompanyName}) → ${s.client_name}`
    })))
    
    // Multi-level relationships (grandparent/cousin detection)
    const multiLevel = findMultiLevelRelationships(parentCompanyName, requestId, db)
    allRelated.push(...multiLevel)
  }
  
  // Deduplicate by request ID
  const uniqueRelated = Array.from(new Map(allRelated.map(r => [r.id, r])).values())
  
  for (const related of uniqueRelated) {
    const conflict = evaluateIndependenceConflict(
      request.service_type,
      related.service_type,
      related.pie_status,
      request.pie_status
    )
    
    if (conflict) {
      conflicts.push({
        type: 'GROUP_INDEPENDENCE_VIOLATION',
        severity: conflict.severity,
        entity_name: related.client_name,
        entity_parent: related.parent_company,
        relationship_path: related.relationship_path,
        existing_service: related.service_type,
        requested_service: request.service_type,
        regulation: 'IESBA 290.13',
        reason: conflict.reason,
        action: conflict.action,
        // Track when conflicting engagement ends (for dashboard/reports)
        conflicting_engagement_id: related.id,
        conflicting_engagement_code: related.engagement_code || related.request_id,
        conflicting_engagement_end_date: related.requested_service_period_end || null
      })
    }
  }
  
  return { conflicts, warnings }
}

/**
 * Check conflicts for International Operations entities
 * This extends group conflict detection to entities listed in global_coi_form_data
 * @param {number} requestId - COI request ID
 * @returns {object} Object with conflicts and warnings arrays
 */
export async function checkInternationalOperationsConflicts(requestId) {
  const db = getDatabase()
  const request = db.prepare(`
    SELECT * FROM coi_requests WHERE id = ?
  `).get(requestId)
  
  if (!request) {
    return { conflicts: [], warnings: [] }
  }
  
  // Check if request has international operations
  if (!request.international_operations || !request.global_coi_form_data) {
    return { conflicts: [], warnings: [] }
  }
  
  let globalData
  try {
    globalData = JSON.parse(request.global_coi_form_data)
  } catch (parseError) {
    console.warn(`[International Operations Conflict] Failed to parse global_coi_form_data for request ${requestId}:`, parseError)
    return { conflicts: [], warnings: [] }
  }
  
  if (!globalData.countries || !Array.isArray(globalData.countries)) {
    return { conflicts: [], warnings: [] }
  }
  
  const conflicts = []
  const warnings = []
  
  // Iterate through all countries and entities
  for (const country of globalData.countries) {
    const entities = country.entities || []
    
    for (const entity of entities) {
      const entityName = entity.name
      if (!entityName) continue
      
      // Check 1: Entity name matches existing client (duplicate check)
      const entityNameResult = await checkDuplication(
        entityName,
        requestId,
        request.service_type,
        request.pie_status === 'Yes',
        request
      )
      
      // Handle both Pro format (object with matches) and Standard format (array)
      const entityNameMatches = entityNameResult?.matches || (Array.isArray(entityNameResult) ? entityNameResult : [])
      
      if (entityNameMatches && entityNameMatches.length > 0) {
        const criticalMatches = entityNameMatches.filter(m => m.action === 'block')
        if (criticalMatches.length > 0) {
          conflicts.push({
            type: 'INTERNATIONAL_OPERATIONS_DUPLICATE',
            severity: 'CRITICAL',
            entity_name: entityName,
            entity_country: country.country_code || '',
            relationship_type: entity.relationship_type || '',
            ownership_percentage: entity.ownership_percentage || null,
            existing_engagements: criticalMatches.map(m => ({
              request_id: m.existingEngagement.request_id,
              client_name: m.existingEngagement.client_name,
              service_type: m.existingEngagement.service_type,
              status: m.existingEngagement.status
            })),
            reason: `International Operations entity "${entityName}" matches existing BDO client`,
            action: 'block',
            regulation: 'IESBA 290.13'
          })
        }
      }
      
      // Check 2: Entity parent company matches existing client (group conflict)
      // For subsidiary/affiliate entities, check if their parent is an existing BDO client
      if (entity.relationship_type === 'subsidiary' || entity.relationship_type === 'affiliate') {
        // If entity has a parent company name in details or we can infer it
        // Note: In the current form structure, entity details might contain parent info
        // This is a simplified check - in production, you might want to add a dedicated parent_company field for entities
        
        // Check if entity name itself is a parent of other entities (reverse relationship)
        const entitiesWithThisParent = findEntitiesWithParent(entityName, requestId, db)
        
        if (entitiesWithThisParent.length > 0) {
          for (const related of entitiesWithThisParent) {
            const conflict = evaluateIndependenceConflict(
              request.service_type,
              related.service_type,
              related.pie_status,
              request.pie_status
            )
            
            if (conflict) {
              conflicts.push({
                type: 'INTERNATIONAL_OPERATIONS_GROUP_CONFLICT',
                severity: conflict.severity,
                entity_name: entityName,
                entity_country: country.country_code || '',
                relationship_type: entity.relationship_type || '',
                ownership_percentage: entity.ownership_percentage || null,
                related_entity_name: related.client_name,
                existing_service: related.service_type,
                requested_service: request.service_type,
                regulation: 'IESBA 290.13',
                reason: conflict.reason,
                action: conflict.action,
                conflicting_engagement_id: related.id,
                conflicting_engagement_code: related.engagement_code || related.request_id
              })
            }
          }
        }
      }
      
      // Check 3: Entity name matches existing client's parent company (multi-level conflict)
      // Find all requests where this entity name appears as a parent company
      const requestsWithThisParent = db.prepare(`
        SELECT r.*, c.client_name
        FROM coi_requests r
        LEFT JOIN clients c ON r.client_id = c.id
        WHERE (r.parent_company LIKE ? OR r.parent_company = ?)
        AND r.status IN ('Approved', 'Active', 'Pending Finance', 'Pending Partner')
        AND r.id != ?
      `).all(`%${entityName}%`, entityName, requestId)
      
      for (const related of requestsWithThisParent) {
        // Use Levenshtein to confirm match
        const similarity = calculateSimilarity(entityName, related.parent_company || '')
        if (similarity >= 85) {
          const conflict = evaluateIndependenceConflict(
            request.service_type,
            related.service_type,
            related.pie_status,
            request.pie_status
          )
          
          if (conflict) {
            conflicts.push({
              type: 'INTERNATIONAL_OPERATIONS_PARENT_CONFLICT',
              severity: conflict.severity,
              entity_name: entityName,
              entity_country: country.country_code || '',
              relationship_type: entity.relationship_type || '',
              ownership_percentage: entity.ownership_percentage || null,
              existing_client_parent: related.parent_company,
              existing_client_name: related.client_name,
              existing_service: related.service_type,
              requested_service: request.service_type,
              regulation: 'IESBA 290.13',
              reason: `International Operations entity "${entityName}" matches parent company of existing client "${related.client_name}"`,
              action: conflict.action,
              conflicting_engagement_id: related.id,
              conflicting_engagement_code: related.engagement_code || related.request_id
            })
          }
        }
      }
    }
  }
  
  return { conflicts, warnings }
}

/**
 * Find entities with the same parent company
 */
function findEntitiesWithParent(parentName, excludeRequestId, db) {
  if (!parentName) return []
  
  // Phase 1: Exact text match (fast)
  let matches = db.prepare(`
    SELECT * FROM coi_requests
    WHERE parent_company = ?
    AND status IN ('Approved', 'Active', 'Pending Finance', 'Pending Partner')
    AND id != ?
  `).all(parentName, excludeRequestId)
  
  // Phase 2: Fuzzy match (catches variations like "Google Inc" vs "Google LLC")
  const allPotential = db.prepare(`
    SELECT * FROM coi_requests
    WHERE parent_company IS NOT NULL
    AND status IN ('Approved', 'Active', 'Pending Finance', 'Pending Partner')
    AND id != ?
  `).all(excludeRequestId)
  
  for (const potential of allPotential) {
    const similarity = calculateSimilarity(parentName, potential.parent_company)
    if (similarity >= 85 && !matches.find(m => m.id === potential.id)) {
      matches.push({
        ...potential,
        match_type: 'fuzzy',
        similarity_score: similarity
      })
    }
  }
  
  return matches.map(m => ({ 
    ...m, 
    relationship_path: `${parentName} → ${m.client_name}` 
  }))
}

/**
 * Find multi-level relationships (grandparent/cousin detection)
 * Uses in-memory fuzzy filtering to catch spelling variations
 */
function findMultiLevelRelationships(parentName, excludeRequestId, db) {
  const multiLevel = []
  
  // Load all active entities for in-memory fuzzy filtering
  // For prototype with <1000 rows, this is faster than multiple fuzzy SQL queries
  const allEntities = db.prepare(`
    SELECT * FROM coi_requests
    WHERE parent_company IS NOT NULL
    AND status IN ('Approved', 'Active', 'Pending Finance', 'Pending Partner')
  `).all()
  
  // Fuzzy find grandparents (entities whose client_name matches the input parentName)
  const potentialGrandparents = allEntities.filter(e => 
    calculateSimilarity(e.client_name, parentName) >= 85
  )
  
  for (const gp of potentialGrandparents) {
    // Found a grandparent (e.g., 'ABC MENA' matches input 'ABC MENA Holdings')
    
    // Find all siblings at the grandparent level (Aunts/Uncles)
    const gpSiblings = findEntitiesWithParent(gp.parent_company, excludeRequestId, db)
    
    multiLevel.push(...gpSiblings.map(s => ({
      ...s,
      relationship_path: `${gp.parent_company} → ${gp.client_name} (Grandparent) → ${s.client_name}`,
      match_type: 'fuzzy_grandparent',
      similarity_score: calculateSimilarity(gp.client_name, parentName)
    })))
  }
  
  return multiLevel
}

/**
 * Evaluate if there's an independence conflict between services
 */
function evaluateIndependenceConflict(requestedService, existingService, existingPIE, requestedPIE) {
  const isRequestedAudit = isAuditServiceType(requestedService)
  const isExistingAudit = isAuditServiceType(existingService)
  const isRequestedProhibited = PROHIBITED_SERVICES.some(s => requestedService?.includes(s))
  const isExistingProhibited = PROHIBITED_SERVICES.some(s => existingService?.includes(s))
  const isExistingAdvisory = ADVISORY_SERVICES.some(s => existingService?.includes(s))
  
  // IESBA 290: Cannot provide prohibited services to audit client group
  if (isExistingAudit && isRequestedProhibited) {
    return {
      severity: 'CRITICAL',
      action: 'BLOCK',
      reason: `Cannot provide ${requestedService} to group where entity has active audit engagement`
    }
  }
  
  // Advisory → Audit requires Compliance/Partner review
  if (isRequestedAudit && isExistingAdvisory) {
    return {
      severity: 'CRITICAL',
      action: 'BLOCK',
      reason: `Cannot accept audit engagement when group entity has ${existingService} - review required`
    }
  }
  
  if (isRequestedAudit && isExistingProhibited) {
    return {
      severity: 'CRITICAL',
      action: 'BLOCK',
      reason: `Cannot accept audit engagement when group entity has ${existingService} engagement`
    }
  }
  
  // PIE restrictions extend to group
  if ((existingPIE === 'Yes' || requestedPIE === 'Yes') && isExistingAudit && isRequestedProhibited) {
    return {
      severity: 'CRITICAL',
      action: 'BLOCK',
      reason: 'PIE independence rules apply to entire corporate group'
    }
  }
  
  return null
}

export { calculateSimilarity }
