import { getDatabase } from '../database/init.js'

// Service type categories
const SERVICE_CATEGORIES = {
  AUDIT: ['Statutory Audit', 'External Audit', 'Group Audit', 'IFRS Audit'],
  INTERNAL_AUDIT: ['Internal Audit', 'Internal Controls Review'],
  ADVISORY: ['Management Consulting', 'Business Advisory', 'Strategy Consulting', 'Restructuring'],
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
    blocked: ['ADVISORY', 'ACCOUNTING', 'VALUATION', 'INTERNAL_AUDIT'],
    flagged: ['TAX', 'DUE_DILIGENCE', 'IT_ADVISORY'],
    reason: {
      ADVISORY: 'Management consulting threatens auditor independence',
      ACCOUNTING: 'Cannot audit own bookkeeping work (self-review threat)',
      VALUATION: 'Cannot audit valuations we performed (self-review threat)',
      INTERNAL_AUDIT: 'Cannot outsource internal audit function for audit client',
      TAX: 'Tax services for audit client require fee cap review',
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
  blocked: ['ADVISORY', 'ACCOUNTING', 'VALUATION', 'INTERNAL_AUDIT', 'IT_ADVISORY'],
  flagged: ['TAX', 'DUE_DILIGENCE'],
  feeCapApplies: true, // Non-audit fees cannot exceed 70% of audit fees
  reason: 'PIE audit clients have strict non-audit service restrictions under EU/local regulations'
}

export async function checkDuplication(clientName, excludeRequestId = null, newServiceType = null, isPIE = false) {
  const db = getDatabase()
  
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
  
  for (const [category, services] of Object.entries(SERVICE_CATEGORIES)) {
    if (services.some(s => normalizedService.includes(s.toLowerCase()) || s.toLowerCase().includes(normalizedService))) {
      return category
    }
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

  // Levenshtein distance
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
