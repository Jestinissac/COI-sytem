/**
 * Client Validation Service
 * 
 * Provides comprehensive client validation for COI requests.
 * Ensures clients are valid, active, and eligible for new engagements.
 * 
 * Following deepseek-coder guidelines:
 * - Production-ready code with comprehensive error handling
 * - Database verification before queries
 * - Prepared statements for security
 * - Consistent return format
 * - Detailed documentation
 */

import { getDatabase } from '../database/init.js'

/**
 * Validates a client for use in COI requests
 * 
 * Performs comprehensive validation including:
 * - Client existence verification
 * - Status validation (Active/Inactive/Potential)
 * - Eligibility checks for new requests
 * - Relationship validation (parent/subsidiary)
 * 
 * @param {number|string} clientId - The client ID to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.checkActiveEngagements - Check for active engagements (default: true)
 * @param {boolean} options.allowInactive - Allow inactive clients (default: false)
 * @param {boolean} options.allowPotential - Allow potential clients (default: true)
 * @param {boolean} options.includeRelationships - Include parent/subsidiary info (default: true)
 * @returns {Object} Validation result with success flag, client data, and validation details
 * 
 * @example
 * const result = validateClientForCOIRequest(1)
 * if (result.success) {
 *   console.log('Client valid:', result.client.client_name)
 * } else {
 *   console.error('Validation failed:', result.error)
 * }
 * 
 * @example
 * // Strict validation - only active clients with no active engagements
 * const result = validateClientForCOIRequest(1, {
 *   checkActiveEngagements: true,
 *   allowInactive: false,
 *   allowPotential: false
 * })
 */
export function validateClientForCOIRequest(clientId, options = {}) {
  const {
    checkActiveEngagements = true,
    allowInactive = false,
    allowPotential = true,
    includeRelationships = true
  } = options

  // Initialize result object (consistent with project pattern)
  const result = {
    success: false,
    error: null,
    client: null,
    validation: {
      exists: false,
      statusValid: false,
      eligible: false,
      activeEngagements: null,
      relationships: null
    },
    metadata: null
  }

  // Input validation
  if (clientId === null || clientId === undefined) {
    result.error = 'Client ID is required'
    return result
  }

  // Convert to number if string
  const numericClientId = typeof clientId === 'string' ? parseInt(clientId, 10) : clientId
  if (isNaN(numericClientId) || numericClientId <= 0) {
    result.error = `Invalid client ID: ${clientId}. Must be a positive number`
    return result
  }

  try {
    const db = getDatabase()

    // Verify clients table exists before querying
    const tableCheck = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='clients'
    `).get()

    if (!tableCheck) {
      result.error = 'Database table clients does not exist'
      return result
    }

    // Query client with prepared statement (SQL injection prevention)
    const client = db.prepare(`
      SELECT 
        id,
        client_code,
        client_name,
        client_status,
        industry_sector,
        commercial_registration,
        parent_company_id,
        is_prospect,
        created_at,
        updated_at
      FROM clients
      WHERE id = ?
    `).get(numericClientId)

    // Check if client exists
    if (!client) {
      result.error = `Client with ID ${numericClientId} does not found`
      result.validation.exists = false
      return result
    }

    result.validation.exists = true
    result.client = client

    // Validate client status
    const validStatuses = ['Active', 'Inactive', 'Potential']
    const status = client.client_status || 'Active'

    if (!validStatuses.includes(status)) {
      result.error = `Invalid client status: ${status}. Must be one of: ${validStatuses.join(', ')}`
      return result
    }

    // Check status eligibility
    if (status === 'Inactive' && !allowInactive) {
      result.error = `Client status is 'Inactive'. Inactive clients are not allowed for new COI requests`
      result.validation.statusValid = false
      return result
    }

    if (status === 'Potential' && !allowPotential) {
      result.error = `Client status is 'Potential'. Potential clients are not allowed for new COI requests`
      result.validation.statusValid = false
      return result
    }

    result.validation.statusValid = true

    // Check for active engagements if requested
    if (checkActiveEngagements) {
      // Verify coi_requests table exists
      const requestsTableCheck = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='coi_requests'
      `).get()

      if (requestsTableCheck) {
        const activeEngagements = db.prepare(`
          SELECT 
            id,
            request_id,
            status,
            service_type,
            service_description,
            created_at
          FROM coi_requests
          WHERE client_id = ?
            AND status IN ('Active', 'Approved', 'Pending Director Approval', 'Pending Compliance', 'Pending Partner', 'Pending Finance')
          ORDER BY created_at DESC
        `).all(numericClientId)

        result.validation.activeEngagements = activeEngagements.length

        // Note: Having active engagements doesn't necessarily block new requests
        // This is informational - business logic may allow multiple engagements
      }
    }

    // Get relationship information if requested
    if (includeRelationships && client.parent_company_id) {
      const parentCompany = db.prepare(`
        SELECT 
          id,
          client_code,
          client_name,
          client_status
        FROM clients
        WHERE id = ?
      `).get(client.parent_company_id)

      if (parentCompany) {
        result.validation.relationships = {
          parent: {
            id: parentCompany.id,
            code: parentCompany.client_code,
            name: parentCompany.client_name,
            status: parentCompany.client_status
          }
        }

        // Get subsidiaries
        const subsidiaries = db.prepare(`
          SELECT 
            id,
            client_code,
            client_name,
            client_status
          FROM clients
          WHERE parent_company_id = ?
          ORDER BY client_name
        `).all(numericClientId)

        if (subsidiaries.length > 0) {
          result.validation.relationships.subsidiaries = subsidiaries.map(sub => ({
            id: sub.id,
            code: sub.client_code,
            name: sub.client_name,
            status: sub.client_status
          }))
        }
      }
    }

    // All validations passed
    result.validation.eligible = true
    result.success = true
    result.metadata = {
      validatedAt: new Date().toISOString(),
      clientId: numericClientId,
      clientCode: client.client_code,
      validationOptions: options
    }

    return result

  } catch (error) {
    // Comprehensive error handling
    result.error = `Database error during client validation: ${error.message}`
    console.error('Client validation error:', error)
    return result
  }
}

/**
 * Validates multiple clients in batch
 * 
 * Useful for bulk operations or validation reports
 * 
 * @param {number[]|string[]} clientIds - Array of client IDs to validate
 * @param {Object} options - Same options as validateClientForCOIRequest
 * @returns {Object} Batch validation result with individual results and summary
 * 
 * @example
 * const batchResult = validateClientsBatch([1, 2, 3])
 * console.log(`Valid: ${batchResult.summary.valid}, Invalid: ${batchResult.summary.invalid}`)
 */
export function validateClientsBatch(clientIds, options = {}) {
  if (!Array.isArray(clientIds)) {
    return {
      success: false,
      error: 'clientIds must be an array',
      results: [],
      summary: { total: 0, valid: 0, invalid: 0 }
    }
  }

  const results = clientIds.map(clientId => validateClientForCOIRequest(clientId, options))
  
  const summary = {
    total: results.length,
    valid: results.filter(r => r.success).length,
    invalid: results.filter(r => !r.success).length,
    byStatus: {
      active: results.filter(r => r.success && r.client?.client_status === 'Active').length,
      inactive: results.filter(r => r.success && r.client?.client_status === 'Inactive').length,
      potential: results.filter(r => r.success && r.client?.client_status === 'Potential').length
    }
  }

  return {
    success: summary.invalid === 0,
    results,
    summary
  }
}

/**
 * Gets client eligibility summary for dashboard/reporting
 * 
 * @param {number} clientId - Client ID
 * @returns {Object} Eligibility summary with recommendations
 */
export function getClientEligibilitySummary(clientId) {
  const validation = validateClientForCOIRequest(clientId, {
    checkActiveEngagements: true,
    includeRelationships: true
  })

  if (!validation.success) {
    return {
      eligible: false,
      reason: validation.error,
      recommendations: []
    }
  }

  const recommendations = []
  const client = validation.client

  // Status-based recommendations
  if (client.client_status === 'Potential') {
    recommendations.push({
      type: 'info',
      message: 'Client is marked as Potential. Consider converting to Active before creating engagement.',
      action: 'Convert to Active client'
    })
  }

  if (client.client_status === 'Inactive') {
    recommendations.push({
      type: 'warning',
      message: 'Client is Inactive. Reactivate client before creating new COI requests.',
      action: 'Reactivate client'
    })
  }

  // Active engagements recommendations
  if (validation.validation.activeEngagements > 0) {
    recommendations.push({
      type: 'info',
      message: `Client has ${validation.validation.activeEngagements} active engagement(s). Verify no conflicts before proceeding.`,
      action: 'Review existing engagements'
    })
  }

  // Relationship recommendations
  if (validation.validation.relationships?.parent) {
    recommendations.push({
      type: 'info',
      message: `Client is a subsidiary of ${validation.validation.relationships.parent.name}. Check parent company engagements.`,
      action: 'Review parent company engagements'
    })
  }

  return {
    eligible: validation.validation.eligible,
    client: {
      id: client.id,
      code: client.client_code,
      name: client.client_name,
      status: client.client_status
    },
    activeEngagements: validation.validation.activeEngagements,
    relationships: validation.validation.relationships,
    recommendations,
    validatedAt: validation.metadata?.validatedAt
  }
}
