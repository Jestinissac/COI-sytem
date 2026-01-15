/**
 * Group Structure Validation Rules
 * 
 * Implements IESBA Code Section 290.13 requirements for parent company verification.
 * PIE clients and Audit engagements must verify group structure.
 */

// Comprehensive audit service detection (combines all audit-related types)
export function isAuditService(serviceType) {
  const auditServices = [
    // From SERVICE_CATEGORIES.AUDIT
    'Statutory Audit', 'External Audit', 'Group Audit', 'IFRS Audit',
    // Audit & Assurance category
    'Audit', 'Assurance', 'Financial Statement Audit',
    'Limited Review', 'Agreed Upon Procedures',
  ]
  
  if (!serviceType) return false
  
  // Exact match
  if (auditServices.includes(serviceType)) return true
  
  // Contains 'Audit' but not 'Internal Audit'
  const lower = serviceType.toLowerCase()
  if (lower.includes('audit') && !lower.includes('internal')) return true
  
  // Contains 'Assurance' 
  if (lower.includes('assurance')) return true
  
  return false
}

/**
 * Validation Error class for group structure validation
 */
export class GroupStructureValidationError extends Error {
  constructor({ field, message, code }) {
    super(message)
    this.name = 'GroupStructureValidationError'
    this.field = field
    this.code = code
  }
}

/**
 * Validate group structure requirements based on PIE status and service type
 * 
 * @param {Object} requestData - The COI request data
 * @returns {Object} - Validation result with any modifications to requestData
 * @throws {GroupStructureValidationError} - If validation fails
 */
export function validateGroupStructure(requestData) {
  const { service_type, pie_status, group_structure, parent_company } = requestData
  
  const isAudit = isAuditService(service_type)
  
  // Rule 1: PIE clients MUST verify group structure
  if (pie_status === 'Yes' && !group_structure) {
    throw new GroupStructureValidationError({
      field: 'group_structure',
      message: 'Group structure verification required for Public Interest Entity clients',
      code: 'IESBA_PIE_GROUP_REQUIRED'  // Internal code for audit trail
    })
  }
  
  // Rule 2: Audit clients MUST verify group structure
  if (isAudit && !group_structure) {
    throw new GroupStructureValidationError({
      field: 'group_structure',
      message: 'Group structure verification required for audit engagements',
      code: 'IESBA_AUDIT_GROUP_REQUIRED'  // Internal code for audit trail
    })
  }
  
  // Rule 3: If "has_parent" selected, must identify parent
  if (group_structure === 'has_parent' && (!parent_company || parent_company.trim() === '')) {
    throw new GroupStructureValidationError({
      field: 'parent_company',
      message: 'Parent company name must be provided',
      code: 'PARENT_COMPANY_REQUIRED'
    })
  }
  
  // Rule 4: "research_required" flags for Compliance verification
  const result = { ...requestData }
  if (group_structure === 'research_required') {
    result.requires_compliance_verification = 1
  }
  
  return result
}

/**
 * Check if group structure verification is required for given request
 * Used by frontend to show/hide the group structure section
 * 
 * @param {Object} requestData - The COI request data
 * @returns {boolean} - Whether group structure verification is required
 */
export function requiresGroupStructureVerification(requestData) {
  const { service_type, pie_status } = requestData
  return pie_status === 'Yes' || isAuditService(service_type)
}

export default {
  validateGroupStructure,
  isAuditService,
  requiresGroupStructureVerification,
  GroupStructureValidationError
}
