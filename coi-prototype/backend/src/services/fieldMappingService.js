/**
 * CENTRALIZED FIELD MAPPING SERVICE
 * Single source of truth for resolving field values from request data.
 * 
 * This service eliminates duplicate field mapping logic across:
 * - businessRulesEngine.js
 * - coiController.js
 * - impactAnalysisService.js
 * - Any other services that need to resolve field values
 */

import { getDatabase } from '../database/init.js'

/**
 * Helper: Get existing engagements for a client
 * Used for computing has_existing_statutory_audit, has_previous_engagements, etc.
 */
function getClientExistingEngagements(clientId, excludeRequestId = null) {
  if (!clientId) return []
  
  try {
    const db = getDatabase()
    let query = `
      SELECT id, request_id, service_type, status, pie_status
      FROM coi_requests 
      WHERE client_id = ? 
      AND status IN ('Approved', 'Active', 'Pending Director Approval', 'Pending Compliance', 'Pending Partner')
    `
    const params = [clientId]
    
    if (excludeRequestId) {
      query += ' AND id != ?'
      params.push(excludeRequestId)
    }
    
    return db.prepare(query).all(...params)
  } catch (error) {
    console.error('Error getting client existing engagements:', error)
    return []
  }
}

/**
 * Helper: Calculate days between two dates
 */
function getDaysBetween(startDate, endDate) {
  if (!startDate || !endDate) return null
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
}

/**
 * Helper: Calculate years between two dates
 */
function getYearsBetween(startDate, endDate) {
  if (!startDate || !endDate) return null
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null
  const diffTime = Math.abs(end - start)
  return diffTime / (1000 * 60 * 60 * 24 * 365)
}

/**
 * Helper: Parse numeric value safely
 */
function parseNumeric(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = parseFloat(value)
  return isNaN(parsed) ? null : parsed
}

/**
 * Helper: Parse boolean or string "Yes"/"No"
 */
function parseBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim()
    return lower === 'yes' || lower === 'true' || lower === '1'
  }
  return value === 1 || value === true
}

const FieldMappingService = {
  /**
   * Extracts or computes a value for a specific field from request data
   * @param {Object} requestData - The raw request data (from database or API)
   * @param {String} fieldName - The field to look up (e.g., 'total_fees', 'client_name', 'engagement_duration')
   * @returns {*} The field value, or null/undefined if not found
   */
  getValue(requestData, fieldName) {
    if (!requestData || !fieldName) return null

    // 1. Handle nested paths like "client.client_name"
    if (fieldName.includes('.')) {
      const parts = fieldName.split('.')
      let value = requestData
      for (const part of parts) {
        if (value && typeof value === 'object') {
          value = value[part]
        } else {
          value = null
          break
        }
      }
      if (value !== null && value !== undefined) return value
    }

    // 2. Direct field access (check top-level first)
    if (requestData[fieldName] !== undefined && requestData[fieldName] !== null) {
      return requestData[fieldName]
    }

    // 3. Computed fields (calculated from other fields)
    switch (fieldName) {
      case 'client_name':
        // Try multiple sources for client name
        return requestData.client_name || 
               requestData.client?.name || 
               requestData.client?.client_name ||
               null

      case 'client_country':
        return requestData.client_country || 
               requestData.client?.country ||
               requestData.client?.client_country ||
               null

      case 'client_industry':
        return requestData.client_industry || 
               requestData.client?.industry ||
               requestData.client?.industry_sector ||
               null

      case 'client_type':
        return requestData.client_type || 
               requestData.client?.client_type ||
               null

      case 'client_relationship_duration':
        return requestData.client_relationship_duration || 
               requestData.client?.relationship_duration ||
               null

      case 'engagement_start_date':
        // Map to requested_service_period_start
        return requestData.engagement_start_date || 
               requestData.requested_service_period_start ||
               null

      case 'engagement_end_date':
        // Map to requested_service_period_end
        return requestData.engagement_end_date || 
               requestData.requested_service_period_end ||
               null

      case 'engagement_duration':
        // Calculate in years from start/end dates
        const startDate = requestData.engagement_start_date || 
                         requestData.requested_service_period_start
        const endDate = requestData.engagement_end_date || 
                       requestData.requested_service_period_end
        return getYearsBetween(startDate, endDate)

      case 'service_turnaround_days':
        // Calculate in days from start/end dates
        const start = requestData.engagement_start_date || 
                     requestData.requested_service_period_start
        const end = requestData.engagement_end_date || 
                   requestData.requested_service_period_end
        return getDaysBetween(start, end)

      case 'total_fees':
        // Try multiple sources for fees
        if (requestData.total_fees !== undefined) {
          return parseNumeric(requestData.total_fees)
        }
        if (requestData.commercials?.total_amount !== undefined) {
          return parseNumeric(requestData.commercials.total_amount)
        }
        if (requestData.fee_amount !== undefined) {
          return parseNumeric(requestData.fee_amount)
        }
        return null

      case 'financial_interest':
        return requestData.financial_interest || 
               requestData.has_financial_interest ||
               null

      case 'family_relationship':
        return requestData.family_relationship || 
               requestData.family_relationships ||
               null

      case 'is_international':
        // Handle boolean or string "Yes"
        return parseBoolean(requestData.is_international) ||
               parseBoolean(requestData.international_operations) ||
               false

      case 'pie_status':
        // Normalize to "Yes"/"No" or boolean
        const pieValue = requestData.pie_status
        if (pieValue === null || pieValue === undefined) return null
        if (typeof pieValue === 'boolean') return pieValue ? 'Yes' : 'No'
        return String(pieValue)

      case 'is_cma_regulated':
        // Get from client data or request data
        if (requestData.is_cma_regulated !== undefined) {
          return parseBoolean(requestData.is_cma_regulated)
        }
        if (requestData.client?.is_cma_regulated !== undefined) {
          return parseBoolean(requestData.client.is_cma_regulated)
        }
        // Fallback: check regulated_body
        const regulatedBody = requestData.regulated_body || 
                             requestData.client?.regulated_body
        if (regulatedBody && (regulatedBody.includes('CMA') || 
                              regulatedBody.includes('Capital Markets Authority'))) {
          return true
        }
        return false

      case 'regulated_body':
        return requestData.regulated_body || 
               requestData.client?.regulated_body ||
               null

      case 'service_type':
        return requestData.service_type || null

      case 'service_category':
        return requestData.service_category || null

      case 'service_description':
        return requestData.service_description || null

      // ============================================
      // SMART COMPUTED FIELDS FOR IESBA RULES
      // These check existing engagements for real threats
      // ============================================
      
      case 'has_existing_statutory_audit':
        // Check if client already has a statutory audit engagement
        const engagementsForStatutory = getClientExistingEngagements(requestData.client_id, requestData.id)
        return engagementsForStatutory.some(e => 
          e.service_type && 
          (e.service_type.toLowerCase().includes('statutory audit') ||
           e.service_type.toLowerCase() === 'external audit')
        ) ? 'Yes' : 'No'

      case 'has_existing_internal_audit':
        // Check if client already has an internal audit engagement
        const engagementsForInternal = getClientExistingEngagements(requestData.client_id, requestData.id)
        return engagementsForInternal.some(e => 
          e.service_type && e.service_type.toLowerCase().includes('internal audit')
        ) ? 'Yes' : 'No'

      case 'has_existing_audit_engagement':
        // Check if client has ANY audit engagement (statutory, internal, external)
        const engagementsForAudit = getClientExistingEngagements(requestData.client_id, requestData.id)
        return engagementsForAudit.some(e => 
          e.service_type && e.service_type.toLowerCase().includes('audit')
        ) ? 'Yes' : 'No'

      case 'has_previous_engagements':
        // Check if client has any previous engagements
        const engagementsForPrevious = getClientExistingEngagements(requestData.client_id, requestData.id)
        return engagementsForPrevious.length > 0 ? 'Yes' : 'No'

      case 'previous_engagement_count':
        // Count of previous engagements for this client
        const engagementsForCount = getClientExistingEngagements(requestData.client_id, requestData.id)
        return engagementsForCount.length

      case 'existing_service_types':
        // Comma-separated list of existing service types for this client
        const engagementsForTypes = getClientExistingEngagements(requestData.client_id, requestData.id)
        return engagementsForTypes.map(e => e.service_type).filter(Boolean).join(',')

      case 'is_audit_service':
        // Check if current service is an audit service
        const svcType = requestData.service_type || ''
        return svcType.toLowerCase().includes('audit') ? 'Yes' : 'No'

      case 'is_statutory_audit':
        // Check if current service is specifically statutory audit
        const svcTypeStatutory = requestData.service_type || ''
        return (svcTypeStatutory.toLowerCase().includes('statutory audit') ||
                svcTypeStatutory.toLowerCase() === 'external audit') ? 'Yes' : 'No'

      case 'is_internal_audit':
        // Check if current service is internal audit
        const svcTypeInternal = requestData.service_type || ''
        return svcTypeInternal.toLowerCase().includes('internal audit') ? 'Yes' : 'No'

      default:
        // Check custom_fields JSON if field not found
        if (requestData.custom_fields) {
          try {
            const customFields = typeof requestData.custom_fields === 'string'
              ? JSON.parse(requestData.custom_fields)
              : requestData.custom_fields
            if (customFields && typeof customFields === 'object' && customFields[fieldName] !== undefined) {
              return customFields[fieldName]
            }
          } catch (e) {
            // Invalid JSON, ignore
          }
        }
        return null
    }
  },

  /**
   * Get multiple field values at once (for efficiency)
   * @param {Object} requestData - The raw request data
   * @param {Array<String>} fieldNames - Array of field names to resolve
   * @returns {Object} Object with field names as keys and values as values
   */
  getMultipleValues(requestData, fieldNames) {
    const result = {}
    for (const fieldName of fieldNames) {
      result[fieldName] = this.getValue(requestData, fieldName)
    }
    return result
  },

  /**
   * Prepare request data for rule evaluation
   * This ensures all computed fields are available
   * @param {Object} requestData - Raw request data from database
   * @returns {Object} Enhanced request data with computed fields
   */
  prepareForRuleEvaluation(requestData) {
    if (!requestData) return null

    // Get all commonly used fields
    const commonFields = [
      'client_name',
      'client_country',
      'client_industry',
      'client_type',
      'client_relationship_duration',
      'engagement_start_date',
      'engagement_end_date',
      'engagement_duration',
      'service_turnaround_days',
      'total_fees',
      'financial_interest',
      'family_relationship',
      'is_international',
      'pie_status',
      'is_cma_regulated',
      'regulated_body',
      'service_type',
      'service_category',
      'service_description',
      // Smart IESBA fields
      'has_existing_statutory_audit',
      'has_existing_internal_audit',
      'has_existing_audit_engagement',
      'has_previous_engagements',
      'previous_engagement_count',
      'existing_service_types',
      'is_audit_service',
      'is_statutory_audit',
      'is_internal_audit'
    ]

    const enhanced = { ...requestData }

    // Add common fields from getValue
    for (const field of commonFields) {
      if (enhanced[field] === undefined) {
        enhanced[field] = this.getValue(requestData, field)
      }
    }

    // --- B11b: Computed fields for rule evaluation (null-safe, with defaults) ---

    // Days since request entered workflow; used by staleness/lapse rules.
    const submissionTimestamp = requestData.submitted_at || requestData.created_at || requestData.updated_at
    if (submissionTimestamp != null && submissionTimestamp !== '') {
      const ts = new Date(submissionTimestamp).getTime()
      if (!Number.isNaN(ts)) {
        enhanced.days_since_submission = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24))
      } else {
        enhanced.days_since_submission = 0
      }
    } else {
      enhanced.days_since_submission = 0
    }

    // True if client has a parent company; used for group conflict rules.
    enhanced.is_group_company = !!(requestData.parent_company_id != null && requestData.parent_company_id !== '')

    // Duration in months for long-duration engagement rules (e.g. > 36 months).
    const startRaw = requestData.engagement_start_date || requestData.requested_service_period_start
    const endRaw = requestData.engagement_end_date || requestData.requested_service_period_end
    if (startRaw != null && endRaw != null && startRaw !== '' && endRaw !== '') {
      const start = new Date(startRaw).getTime()
      const end = new Date(endRaw).getTime()
      if (!Number.isNaN(start) && !Number.isNaN(end)) {
        enhanced.engagement_duration = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30))
      } else {
        enhanced.engagement_duration = 0
      }
    } else {
      enhanced.engagement_duration = 0
    }

    // Whether this client has another Approved/Active Audit engagement (excludes current request).
    enhanced.has_active_audit = false
    const clientId = requestData.client_id != null ? requestData.client_id : null
    if (clientId != null && clientId !== '') {
      try {
        const db = getDatabase()
        const excludeId = requestData.id != null && requestData.id !== '' ? requestData.id : null
        const stmt = excludeId != null
          ? db.prepare(`
              SELECT COUNT(*) as count FROM coi_requests
              WHERE client_id = ? AND (service_type LIKE '%Audit%' OR service_type = 'Audit')
              AND status IN ('Approved', 'Active') AND id != ?
            `)
          : db.prepare(`
              SELECT COUNT(*) as count FROM coi_requests
              WHERE client_id = ? AND (service_type LIKE '%Audit%' OR service_type = 'Audit')
              AND status IN ('Approved', 'Active')
            `)
        const row = excludeId != null ? stmt.get(clientId, excludeId) : stmt.get(clientId)
        enhanced.has_active_audit = !!(row && row.count > 0)
      } catch (err) {
        console.error('fieldMappingService prepareForRuleEvaluation has_active_audit:', err.message)
      }
    }

    return enhanced
  }
}

export default FieldMappingService
