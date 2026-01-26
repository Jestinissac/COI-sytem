/**
 * Company Relationship Validator
 * Validates company types and relationships per industry standards (IESBA 290.13)
 */

export class CompanyRelationshipValidationError extends Error {
  constructor(message, field = null) {
    super(message)
    this.name = 'CompanyRelationshipValidationError'
    this.field = field
  }
}

/**
 * Validate company type and relationship data
 * @param {object} requestData - COI request data
 * @throws {CompanyRelationshipValidationError} If validation fails
 */
export function validateCompanyRelationship(requestData) {
  const { company_type, parent_company_id, parent_company, ownership_percentage, control_type, group_structure } = requestData

  // Rule 1: If company_type is Subsidiary, parent_company_id or parent_company must be provided
  if (company_type === 'Subsidiary') {
    if (!parent_company_id && !parent_company) {
      throw new CompanyRelationshipValidationError(
        'Parent company is required for Subsidiary entities per IESBA 290.13',
        'parent_company'
      )
    }
    
    // Rule 1a: Subsidiary should have ownership_percentage >= 50% (industry standard: ≥50% = control)
    if (ownership_percentage !== null && ownership_percentage !== undefined) {
      if (ownership_percentage < 50) {
        throw new CompanyRelationshipValidationError(
          'Subsidiary requires ≥50% ownership for control. If ownership is <50%, use "Affiliate" type instead.',
          'ownership_percentage'
        )
      }
      if (ownership_percentage > 100) {
        throw new CompanyRelationshipValidationError(
          'Ownership percentage cannot exceed 100%',
          'ownership_percentage'
        )
      }
    }
    
    // Rule 1b: Control type should be Majority for Subsidiary
    if (control_type && control_type !== 'Majority' && control_type !== 'Joint') {
      console.warn(`Subsidiary with control_type "${control_type}" - expected Majority or Joint`)
    }
  }

  // Rule 2: If company_type is Affiliate, ownership_percentage should be 20-50%
  if (company_type === 'Affiliate') {
    if (ownership_percentage !== null && ownership_percentage !== undefined) {
      if (ownership_percentage < 20 || ownership_percentage >= 50) {
        throw new CompanyRelationshipValidationError(
          'Affiliate requires 20-50% ownership (significant influence, not control). For ≥50%, use "Subsidiary" type.',
          'ownership_percentage'
        )
      }
    }
    
    // Rule 2a: Control type should be Significant Influence for Affiliate
    if (control_type && control_type !== 'Significant Influence') {
      console.warn(`Affiliate with control_type "${control_type}" - expected Significant Influence`)
    }
  }

  // Rule 3: If company_type is Sister, parent_company_id or parent_company must be provided
  if (company_type === 'Sister') {
    if (!parent_company_id && !parent_company) {
      throw new CompanyRelationshipValidationError(
        'Parent company is required for Sister companies (both entities share the same parent)',
        'parent_company'
      )
    }
  }

  // Rule 4: If company_type is Standalone, no parent should be specified
  if (company_type === 'Standalone') {
    if (parent_company_id || parent_company) {
      throw new CompanyRelationshipValidationError(
        'Standalone entities cannot have a parent company',
        'parent_company'
      )
    }
    if (ownership_percentage && ownership_percentage > 20) {
      console.warn(`Standalone entity with ownership_percentage ${ownership_percentage}% - consider using Subsidiary or Affiliate type`)
    }
  }

  // Rule 5: If group_structure is 'has_parent', company_type should not be Standalone
  if (group_structure === 'has_parent' && company_type === 'Standalone') {
    throw new CompanyRelationshipValidationError(
      'Group structure "has_parent" conflicts with company type "Standalone"',
      'company_type'
    )
  }

  // Rule 6: If group_structure is 'standalone', company_type should be Standalone
  if (group_structure === 'standalone' && company_type && company_type !== 'Standalone') {
    console.warn(`Group structure "standalone" but company_type is "${company_type}" - may need review`)
  }

  // Rule 7: Ownership percentage validation (if provided)
  if (ownership_percentage !== null && ownership_percentage !== undefined) {
    if (ownership_percentage < 0 || ownership_percentage > 100) {
      throw new CompanyRelationshipValidationError(
        'Ownership percentage must be between 0% and 100%',
        'ownership_percentage'
      )
    }
  }

  return true
}

/**
 * Infer company type from ownership percentage (industry standard)
 * @param {number} ownershipPercentage - Ownership percentage (0-100)
 * @returns {string} Suggested company type
 */
export function inferCompanyTypeFromOwnership(ownershipPercentage) {
  if (!ownershipPercentage || ownershipPercentage === 0) {
    return 'Standalone'
  }
  if (ownershipPercentage >= 50) {
    return 'Subsidiary'
  }
  if (ownershipPercentage >= 20) {
    return 'Affiliate'
  }
  return 'Standalone'
}

/**
 * Infer control type from ownership percentage
 * @param {number} ownershipPercentage - Ownership percentage (0-100)
 * @returns {string} Control type
 */
export function inferControlTypeFromOwnership(ownershipPercentage) {
  if (!ownershipPercentage || ownershipPercentage === 0) {
    return 'None'
  }
  if (ownershipPercentage >= 50) {
    return 'Majority'
  }
  if (ownershipPercentage >= 20) {
    return 'Significant Influence'
  }
  return 'Minority'
}

/**
 * Get relationship description for display
 * @param {object} requestData - COI request data
 * @returns {string} Human-readable relationship description
 */
export function getRelationshipDescription(requestData) {
  const { company_type, ownership_percentage, parent_company, parent_company_id } = requestData
  
  if (company_type === 'Standalone') {
    return 'Independent entity with no parent company'
  }
  
  if (company_type === 'Subsidiary') {
    const ownership = ownership_percentage ? `${ownership_percentage}%` : 'majority'
    return `Subsidiary of ${parent_company || 'parent company'} (${ownership} ownership)`
  }
  
  if (company_type === 'Affiliate') {
    const ownership = ownership_percentage ? `${ownership_percentage}%` : '20-50%'
    return `Affiliate of ${parent_company || 'parent company'} (${ownership} ownership, significant influence)`
  }
  
  if (company_type === 'Sister') {
    return `Sister company (shares parent with other entities: ${parent_company || 'parent company'})`
  }
  
  if (company_type === 'Parent') {
    return 'Parent company (controls subsidiaries)'
  }
  
  return 'Relationship not specified'
}

/**
 * Validate International Operations entities
 * Validates ownership percentages and control types for entities in global_coi_form_data
 * @param {object} globalCOIData - Global COI form data with countries and entities
 * @throws {CompanyRelationshipValidationError} If validation fails
 */
export function validateInternationalOperationsEntities(globalCOIData) {
  if (!globalCOIData || !globalCOIData.countries || !Array.isArray(globalCOIData.countries)) {
    return true // No international operations, validation passes
  }
  
  const errors = []
  
  for (let countryIndex = 0; countryIndex < globalCOIData.countries.length; countryIndex++) {
    const country = globalCOIData.countries[countryIndex]
    const entities = country.entities || []
    
    for (let entityIndex = 0; entityIndex < entities.length; entityIndex++) {
      const entity = entities[entityIndex]
      const { relationship_type, name, ownership_percentage } = entity
      
      // Rule 1: Subsidiary requires ≥50% ownership
      if (relationship_type === 'subsidiary') {
        if (ownership_percentage === null || ownership_percentage === undefined || ownership_percentage === 0) {
          errors.push({
            field: `countries[${countryIndex}].entities[${entityIndex}].ownership_percentage`,
            message: `Ownership percentage is required for Subsidiary entity "${name || 'unnamed'}"`
          })
        } else if (ownership_percentage < 50) {
          errors.push({
            field: `countries[${countryIndex}].entities[${entityIndex}].ownership_percentage`,
            message: `Subsidiary "${name || 'unnamed'}" requires ≥50% ownership for control. If ownership is <50%, use "Affiliate" type instead.`
          })
        } else if (ownership_percentage > 100) {
          errors.push({
            field: `countries[${countryIndex}].entities[${entityIndex}].ownership_percentage`,
            message: `Ownership percentage cannot exceed 100% for entity "${name || 'unnamed'}"`
          })
        }
      }
      
      // Rule 2: Affiliate requires 20-50% ownership
      if (relationship_type === 'affiliate') {
        if (ownership_percentage === null || ownership_percentage === undefined || ownership_percentage === 0) {
          errors.push({
            field: `countries[${countryIndex}].entities[${entityIndex}].ownership_percentage`,
            message: `Ownership percentage is required for Affiliate entity "${name || 'unnamed'}"`
          })
        } else if (ownership_percentage < 20 || ownership_percentage >= 50) {
          errors.push({
            field: `countries[${countryIndex}].entities[${entityIndex}].ownership_percentage`,
            message: `Affiliate "${name || 'unnamed'}" requires 20-50% ownership (significant influence, not control). For ≥50%, use "Subsidiary" type.`
          })
        }
      }
      
      // Rule 3: Ownership percentage must be 0-100% if provided
      if (ownership_percentage !== null && ownership_percentage !== undefined) {
        if (ownership_percentage < 0 || ownership_percentage > 100) {
          errors.push({
            field: `countries[${countryIndex}].entities[${entityIndex}].ownership_percentage`,
            message: `Ownership percentage must be between 0% and 100% for entity "${name || 'unnamed'}"`
          })
        }
      }
    }
  }
  
  if (errors.length > 0) {
    const firstError = errors[0]
    throw new CompanyRelationshipValidationError(
      `International Operations validation failed: ${firstError.message}`,
      firstError.field
    )
  }
  
  return true
}
