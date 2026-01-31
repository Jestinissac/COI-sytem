import { getDatabase } from '../database/init.js'

const db = getDatabase()

/**
 * CMA Conflict Matrix Service
 * Checks CMA (Capital Markets Authority) rules for Kuwait-regulated clients
 * Based on Law No. (7) of 2010, CMA Matrix - 36 unique combinations
 */

/**
 * Map service type name to CMA service code
 * 
 * Since we now use exact CMA service names in the dropdown for CMA-regulated clients,
 * we can do direct lookup by service name. For backward compatibility, we also support
 * legacy service names that may still be in the database.
 */
const SERVICE_TYPE_TO_CMA_MAPPING = {
  // ============================================
  // EXACT CMA SERVICE NAMES (Primary - from CMA Matrix PDF)
  // ============================================
  'External Audit': 'EXTERNAL_AUDIT',
  'Internal Audit': 'INTERNAL_AUDIT',
  'Risk Management': 'RISK_MANAGEMENT',
  'Review the Internal Control Systems': 'INT_CTRL_REVIEW_CMA',
  'Review, evaluate the performance of the internal audit management/firm/unit': 'INT_AUDIT_PERF_REVIEW',
  'Assessment on the level of compliance with all legislative requirements and determinants set forth in the Anti-Money Laundering and Combating Financing of Terrorism Law': 'AML_CFT_ASSESSMENT',
  'An Investment Advisor': 'INVESTMENT_ADVISOR',
  'Valuation of the assets': 'ASSET_VALUATION',
  'Review the capital adequacy report': 'CAPITAL_ADEQUACY_REVIEW',
  
  // ============================================
  // EXTERNAL AUDIT VARIATIONS
  // ============================================
  'Statutory Audit': 'EXTERNAL_AUDIT',
  'Statutory Audit Services': 'EXTERNAL_AUDIT',
  'Group Audit': 'EXTERNAL_AUDIT',
  'IFRS Audit': 'EXTERNAL_AUDIT',
  'Audit Services': 'EXTERNAL_AUDIT',
  'Financial Statement Audit': 'EXTERNAL_AUDIT',
  'External Audit Services': 'EXTERNAL_AUDIT',
  
  // ============================================
  // INTERNAL AUDIT VARIATIONS
  // ============================================
  'Internal Audit Services': 'INTERNAL_AUDIT',
  
  // ============================================
  // RISK MANAGEMENT VARIATIONS
  // ============================================
  'Risk Management Services': 'RISK_MANAGEMENT',
  
  // ============================================
  // INTERNAL CONTROL REVIEW (ICR) - Module 15
  // ============================================
  'Internal Controls Review': 'INT_CTRL_REVIEW_CMA',
  'Internal Control Systems Review': 'INT_CTRL_REVIEW_CMA',
  'SOX & Internal Controls Services': 'INT_CTRL_REVIEW_CMA',
  'Internal Control Review': 'INT_CTRL_REVIEW_CMA',
  'ICR': 'INT_CTRL_REVIEW_CMA', // Abbreviation
  
  // ============================================
  // INTERNAL AUDIT PERFORMANCE REVIEW - Module 15
  // ============================================
  'Internal Audit Performance Review': 'INT_AUDIT_PERF_REVIEW',
  'Internal Audit Quality Assurance Services': 'INT_AUDIT_PERF_REVIEW',
  'Internal Audit QA': 'INT_AUDIT_PERF_REVIEW', // Abbreviation
  'Internal Audit Quality Assurance': 'INT_AUDIT_PERF_REVIEW',
  
  // ============================================
  // AML/CFT ASSESSMENT - Module 16
  // ============================================
  'AML Services (Book 16)': 'AML_CFT_ASSESSMENT',
  'AML Services': 'AML_CFT_ASSESSMENT',
  'AML/CFT Assessment': 'AML_CFT_ASSESSMENT',
  'AML/CFT Services': 'AML_CFT_ASSESSMENT',
  'Anti-Money Laundering Services': 'AML_CFT_ASSESSMENT',
  'CFT Services': 'AML_CFT_ASSESSMENT',
  'AML Assessment': 'AML_CFT_ASSESSMENT',
  'AML Compliance Assessment': 'AML_CFT_ASSESSMENT',
  
  // ============================================
  // INVESTMENT ADVISOR - Module 9
  // ============================================
  'Investment Advisor': 'INVESTMENT_ADVISOR',
  'Investment Advisory': 'INVESTMENT_ADVISOR',
  'Investment Advisory Services': 'INVESTMENT_ADVISOR',
  
  // ============================================
  // ASSET VALUATION - Module 9
  // ============================================
  'Asset Valuation': 'ASSET_VALUATION',
  'Business / Asset Valuation Services': 'ASSET_VALUATION',
  'Business Valuation': 'ASSET_VALUATION',
  'Valuation Services': 'ASSET_VALUATION',
  'Asset Valuation Services': 'ASSET_VALUATION',
  
  // ============================================
  // CAPITAL ADEQUACY REVIEW - Module 17
  // ============================================
  'Capital Adequacy Services (Book 7)': 'CAPITAL_ADEQUACY_REVIEW',
  'Capital Adequacy Services (Book 17)': 'CAPITAL_ADEQUACY_REVIEW',
  'Capital Adequacy Review': 'CAPITAL_ADEQUACY_REVIEW',
  'Capital Adequacy Services': 'CAPITAL_ADEQUACY_REVIEW',
  'Capital Adequacy Report Review': 'CAPITAL_ADEQUACY_REVIEW',
  'Book 17 Services': 'CAPITAL_ADEQUACY_REVIEW' // Common shorthand
}

/**
 * Check if client is CMA-regulated.
 * CMA + IESBA only: All Kuwait clients are CMA-regulated; always return true.
 */
export function isCMARegulated(clientData) {
  return true
}

/**
 * Map service type name to CMA service code
 * 
 * Priority:
 * 1. Direct lookup (exact match) - fastest for CMA service names
 * 2. Case-insensitive lookup
 * 3. Database lookup (fallback for legacy data)
 */
function mapServiceTypeToCMA(serviceTypeName) {
  if (!serviceTypeName) return null
  
  // Direct lookup (exact match) - for CMA service names from dropdown
  if (SERVICE_TYPE_TO_CMA_MAPPING[serviceTypeName]) {
    return SERVICE_TYPE_TO_CMA_MAPPING[serviceTypeName]
  }
  
  // Case-insensitive lookup (for legacy data)
  // NOTE: This is EXACT match (case-insensitive), NOT fuzzy substring matching
  // Fuzzy matching is too risky (e.g., "Audit" could match incorrectly)
  const serviceLower = serviceTypeName.toLowerCase().trim()
  for (const [key, value] of Object.entries(SERVICE_TYPE_TO_CMA_MAPPING)) {
    if (key.toLowerCase().trim() === serviceLower) {
      return value
    }
  }
  
  // Database lookup (fallback) - check if service name matches CMA service name in DB
  try {
    const cmaService = db.prepare(`
      SELECT service_code 
      FROM cma_service_types 
      WHERE LOWER(TRIM(service_name_en)) = LOWER(TRIM(?))
      LIMIT 1
    `).get(serviceTypeName)
    
    if (cmaService) {
      return cmaService.service_code
    }
  } catch (error) {
    // Database lookup failed, continue to return null
    console.warn('Database lookup for CMA service failed:', error.message)
  }
  
  // Log warning for unmapped services (for monitoring)
  console.warn(`[CMA Mapping] No mapping found for service: "${serviceTypeName}"`)
  
  return null
}

/**
 * Check CMA rules for service combination
 * Returns conflict if CMA rule exists and is violated
 * Rules are bidirectional (A+B = B+A)
 */
export function checkCMARules(serviceA, serviceB, clientData = null) {
  // CMA + IESBA only: CMA rules apply to ALL clients (no gate)

  // Map service types to CMA codes
  const cmaCodeA = mapServiceTypeToCMA(serviceA)
  const cmaCodeB = mapServiceTypeToCMA(serviceB)
  
  // If neither service maps to CMA, no CMA rule applies
  if (!cmaCodeA && !cmaCodeB) {
    return null
  }
  
  // If only one service maps, check if it conflicts with any CMA service
  // For now, we only check if both services are CMA services
  if (!cmaCodeA || !cmaCodeB) {
    return null // Partial mapping - CMA rules don't apply
  }
  
  // Check CMA combination rule (bidirectional)
  // Try A+B first, then B+A
  let rule = db.prepare(`
    SELECT * FROM cma_combination_rules
    WHERE (service_a_code = ? AND service_b_code = ?)
       OR (service_a_code = ? AND service_b_code = ?)
    LIMIT 1
  `).get(cmaCodeA, cmaCodeB, cmaCodeB, cmaCodeA)
  
  if (!rule) {
    return null // No CMA rule for this combination
  }
  
  // Rule found - check if allowed
  if (rule.allowed === 1 || rule.allowed === true) {
    // YES - Allowed with conditions
    if (rule.condition_code === 'INDEPENDENT_TEAMS') {
      return {
        type: 'CMA_CONDITIONAL_ALLOWED',
        severity: 'HIGH',
        reason: rule.reason_text || 'CMA: Service combination allowed with independent teams requirement',
        regulation: 'CMA Law No. 7 of 2010',
        regulationSource: 'CMA',
        legalReference: rule.legal_reference || null,
        conditionCode: rule.condition_code,
        conditionDescription: 'Both services must be assigned to two independent teams',
        canOverride: false, // Condition must be met
        requiresAttestation: true, // Require UI checkbox attestation
        attestationText: 'I attest that independent teams will be assigned per CMA Module 15 requirements'
      }
    }
    // YES without condition (shouldn't happen per matrix, but handle it)
    return null
  } else {
    // NO - Prohibited
    return {
      type: 'CMA_PROHIBITION',
      severity: 'CRITICAL',
      reason: rule.reason_text || 'CMA: Service combination prohibited',
      regulation: 'CMA Law No. 7 of 2010',
      regulationSource: 'CMA',
      legalReference: rule.legal_reference || null,
      canOverride: false,
      conditionCode: null
    }
  }
}

/**
 * Get all CMA service types (for UI dropdowns)
 */
export function getCMAServiceTypes() {
  try {
    const services = db.prepare(`
      SELECT service_code, service_name_en, service_name_ar, legal_reference, module_reference
      FROM cma_service_types
      ORDER BY service_code
    `).all()
    
    return services
  } catch (error) {
    console.error('Error fetching CMA service types:', error)
    return []
  }
}

/**
 * Get CMA service types grouped by Line of Service (for COI Template compliance)
 * Groups the 9 CMA services into categories matching the COI Template structure
 */
export function getCMAServiceTypesGrouped() {
  try {
    const services = getCMAServiceTypes()
    
    // Group CMA services by Line of Service (category)
    // This matches the COI Template structure: Line of Service -> Specific Service Type
    const grouped = [
      {
        category: 'Audit & Assurance',
        lineOfService: 'Audit & Assurance',
        services: services.filter(s => 
          s.service_code === 'EXTERNAL_AUDIT' || 
          s.service_code === 'INTERNAL_AUDIT'
        ).map(s => ({
          value: s.service_name_en, // Use exact CMA name for 1:1 mapping
          label: s.service_name_en,
          code: s.service_code,
          legal_reference: s.legal_reference,
          module_reference: s.module_reference,
          is_cma_regulated: true
        }))
      },
      {
        category: 'Advisory',
        lineOfService: 'Advisory',
        services: services.filter(s => 
          s.service_code !== 'EXTERNAL_AUDIT' && 
          s.service_code !== 'INTERNAL_AUDIT'
        ).map(s => ({
          value: s.service_name_en, // Use exact CMA name for 1:1 mapping
          label: s.service_name_en,
          code: s.service_code,
          legal_reference: s.legal_reference,
          module_reference: s.module_reference,
          is_cma_regulated: true
        }))
      }
    ]
    
    return grouped
  } catch (error) {
    console.error('Error fetching grouped CMA service types:', error)
    return []
  }
}

/**
 * Get CMA rule for service combination (for display/debugging)
 */
export function getCMARule(serviceACode, serviceBCode) {
  try {
    const rule = db.prepare(`
      SELECT 
        r.*,
        a.service_name_en as service_a_name,
        b.service_name_en as service_b_name,
        c.description as condition_description
      FROM cma_combination_rules r
      LEFT JOIN cma_service_types a ON r.service_a_code = a.service_code
      LEFT JOIN cma_service_types b ON r.service_b_code = b.service_code
      LEFT JOIN cma_condition_codes c ON r.condition_code = c.code
      WHERE (r.service_a_code = ? AND r.service_b_code = ?)
         OR (r.service_a_code = ? AND r.service_b_code = ?)
      LIMIT 1
    `).get(serviceACode, serviceBCode, serviceBCode, serviceACode)
    
    return rule || null
  } catch (error) {
    console.error('Error fetching CMA rule:', error)
    return null
  }
}
