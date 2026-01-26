/**
 * Input Validation Middleware for Reports
 * Validates all report filters and parameters
 */

// Valid status values
const VALID_STATUSES = [
  'Draft',
  'Pending Director Approval',
  'Pending Compliance',
  'Pending Partner',
  'Pending Finance',
  'Approved',
  'Rejected',
  'Lapsed',
  'Active'
]

// Valid service types (common ones)
const VALID_SERVICE_TYPES = [
  'Audit',
  'Tax',
  'Advisory',
  'Accounting',
  'Business/Asset Valuation',
  'Financial Facilities',
  'Capital Increase',
  'Acquisition'
]

/**
 * Validate date format (YYYY-MM-DD)
 */
function isValidDate(dateString) {
  if (!dateString) return true // Optional field
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false
  
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date)
}

/**
 * Validate pagination parameters
 */
function validatePagination(page, pageSize) {
  const pageNum = parseInt(page)
  const sizeNum = parseInt(pageSize)
  
  if (page && (isNaN(pageNum) || pageNum < 1)) {
    return { valid: false, error: 'Page must be a positive integer' }
  }
  
  if (pageSize && (isNaN(sizeNum) || sizeNum < 1 || sizeNum > 500)) {
    return { valid: false, error: 'Page size must be between 1 and 500' }
  }
  
  return { valid: true }
}

/**
 * Sanitize string input (prevent SQL injection)
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return input
  // Remove potentially dangerous characters
  return input.replace(/[<>'"]/g, '').trim()
}

/**
 * Validate report filters
 */
export function validateReportFilters(req, res, next) {
  const filters = req.body || {}
  const errors = []

  // Validate dateFrom
  if (filters.dateFrom && !isValidDate(filters.dateFrom)) {
    errors.push('dateFrom must be in YYYY-MM-DD format')
  }

  // Validate dateTo
  if (filters.dateTo && !isValidDate(filters.dateTo)) {
    errors.push('dateTo must be in YYYY-MM-DD format')
  }

  // Validate date range (dateTo should be after dateFrom)
  if (filters.dateFrom && filters.dateTo) {
    const fromDate = new Date(filters.dateFrom)
    const toDate = new Date(filters.dateTo)
    if (toDate < fromDate) {
      errors.push('dateTo must be after or equal to dateFrom')
    }
  }

  // Validate status
  if (filters.status) {
    const status = sanitizeString(filters.status)
    if (!VALID_STATUSES.includes(status)) {
      errors.push(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`)
    } else {
      filters.status = status // Use sanitized value
    }
  }

  // Validate serviceType
  if (filters.serviceType) {
    const serviceType = sanitizeString(filters.serviceType)
    // Allow partial matches for service type
    if (serviceType.length > 100) {
      errors.push('serviceType must be 100 characters or less')
    } else {
      filters.serviceType = serviceType // Use sanitized value
    }
  }

  // Validate clientId
  if (filters.clientId) {
    const clientId = parseInt(filters.clientId)
    if (isNaN(clientId) || clientId < 1) {
      errors.push('clientId must be a positive integer')
    } else {
      filters.clientId = clientId
    }
  }

  // Validate clientName
  if (filters.clientName) {
    const clientName = sanitizeString(filters.clientName)
    if (clientName.length > 200) {
      errors.push('clientName must be 200 characters or less')
    } else {
      filters.clientName = clientName
    }
  }

  // Validate requesterId
  if (filters.requesterId) {
    const requesterId = parseInt(filters.requesterId)
    if (isNaN(requesterId) || requesterId < 1) {
      errors.push('requesterId must be a positive integer')
    } else {
      filters.requesterId = requesterId
    }
  }

  // Validate pagination
  if (filters.page || filters.pageSize) {
    const paginationResult = validatePagination(filters.page, filters.pageSize)
    if (!paginationResult.valid) {
      errors.push(paginationResult.error)
    }
  }

  // Validate includeData (boolean or string)
  if (filters.includeData !== undefined) {
    // Accept both boolean and string values
    if (typeof filters.includeData === 'boolean') {
      filters.includeData = filters.includeData ? 'true' : 'false'
    } else if (filters.includeData !== 'true' && filters.includeData !== 'false') {
      errors.push('includeData must be true or false')
    }
  }

  // If there are errors, return them
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      errors
    })
  }

  // Replace req.body with sanitized filters
  req.body = filters
  next()
}

/**
 * Validate export size limits
 */
export function validateExportSize(req, res, next) {
  const filters = req.body || {}
  
  // Check if export would exceed limits
  // This is a basic check - actual size will be validated during export
  if (filters.pageSize && parseInt(filters.pageSize) > 10000) {
    return res.status(400).json({
      error: 'Export size limit exceeded',
      message: 'Maximum 10,000 records allowed per export'
    })
  }

  next()
}
