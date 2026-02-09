import { getDatabase } from '../database/init.js'

const SERVICE_TYPE_ABBREVIATIONS = {
  'Tax': 'TAX',
  'Audit & Assurance': 'AUD',
  'Advisory': 'ADV',
  'Accounting': 'ACC',
  'Other': 'OTH'
}

/**
 * Synchronous engagement code generation for use inside a transaction.
 * Does SELECT next seq + INSERT; throws if UNIQUE constraint fails.
 * @returns {string} The generated engagement code
 */
export function generateEngagementCodeSync(serviceType, coiRequestId, generatedBy) {
  const db = getDatabase()
  const year = new Date().getFullYear()
  const abbreviation = SERVICE_TYPE_ABBREVIATIONS[serviceType] || 'OTH'
  const lastCode = db.prepare(`
    SELECT sequential_number 
    FROM coi_engagement_codes 
    WHERE service_type = ? AND year = ?
    ORDER BY sequential_number DESC 
    LIMIT 1
  `).get(abbreviation, year)
  const nextSeq = lastCode ? lastCode.sequential_number + 1 : 1
  const engagementCode = `ENG-${year}-${abbreviation}-${String(nextSeq).padStart(5, '0')}`
  try {
    db.prepare(`
      INSERT INTO coi_engagement_codes (
        engagement_code, coi_request_id, service_type, year, sequential_number, generated_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'Active')
    `).run(engagementCode, coiRequestId, abbreviation, year, nextSeq, generatedBy)
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint')) {
      err.attemptedCode = engagementCode
    }
    throw err
  }
  return engagementCode
}

export async function generateEngagementCode(serviceType, coiRequestId, generatedBy, financialParams = {}) {
  return generateEngagementCodeSync(serviceType, coiRequestId, generatedBy)
}

/**
 * Validates an engagement code format and existence in the database
 * 
 * @param {string} engagementCode - The engagement code to validate (e.g., "ENG-2026-TAX-00001")
 * @param {Object} options - Validation options
 * @param {boolean} options.checkExistence - Whether to check if code exists in database (default: true)
 * @param {boolean} options.checkStatus - Whether to verify code status is 'Active' (default: true)
 * @param {boolean} options.allowFutureYear - Whether to allow future years (default: false)
 * @returns {Object} Validation result with success flag, error message, and code details
 * 
 * @example
 * const result = validateEngagementCode('ENG-2026-TAX-00001')
 * if (result.success) {
 *   console.log('Valid code:', result.code)
 * } else {
 *   console.error('Invalid:', result.error)
 * }
 */
export function validateEngagementCode(engagementCode, options = {}) {
  const {
    checkExistence = true,
    checkStatus = true,
    allowFutureYear = false
  } = options

  // Initialize result object
  const result = {
    success: false,
    error: null,
    code: null,
    details: null
  }

  // Validate input type
  if (typeof engagementCode !== 'string' || !engagementCode.trim()) {
    result.error = 'Engagement code must be a non-empty string'
    return result
  }

  const code = engagementCode.trim().toUpperCase()

  // Validate format: ENG-YYYY-SVC-#####
  const codePattern = /^ENG-(\d{4})-(TAX|AUD|ADV|ACC|OTH)-(\d{5})$/
  const match = code.match(codePattern)

  if (!match) {
    result.error = `Invalid engagement code format. Expected format: ENG-YYYY-SVC-##### (e.g., ENG-2026-TAX-00001)`
    return result
  }

  const [, yearStr, serviceAbbr, sequenceStr] = match
  const year = parseInt(yearStr, 10)
  const sequence = parseInt(sequenceStr, 10)

  // Validate year range
  const currentYear = new Date().getFullYear()
  const minYear = 2020 // Reasonable minimum for the system
  const maxYear = allowFutureYear ? currentYear + 5 : currentYear

  if (year < minYear || year > maxYear) {
    result.error = `Invalid year: ${year}. Year must be between ${minYear} and ${maxYear}`
    return result
  }

  // Validate sequence number (should be 1-99999)
  if (sequence < 1 || sequence > 99999) {
    result.error = `Invalid sequence number: ${sequence}. Must be between 1 and 99999`
    return result
  }

  // Validate service abbreviation
  const validAbbreviations = Object.values(SERVICE_TYPE_ABBREVIATIONS)
  if (!validAbbreviations.includes(serviceAbbr)) {
    result.error = `Invalid service abbreviation: ${serviceAbbr}. Must be one of: ${validAbbreviations.join(', ')}`
    return result
  }

  // Extract code details
  result.code = {
    fullCode: code,
    year,
    serviceAbbreviation: serviceAbbr,
    sequenceNumber: sequence,
    formatted: code
  }

  // Check database existence and status if requested
  if (checkExistence || checkStatus) {
    try {
      const db = getDatabase()
      
      // Verify table exists before querying
      const tableCheck = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='coi_engagement_codes'
      `).get()

      if (!tableCheck) {
        result.error = 'Database table coi_engagement_codes does not exist'
        return result
      }

      // Query engagement code (schema uses generated_date)
      const codeRecord = db.prepare(`
        SELECT 
          engagement_code,
          coi_request_id,
          service_type,
          year,
          sequential_number,
          status,
          generated_by,
          generated_date
        FROM coi_engagement_codes
        WHERE engagement_code = ?
      `).get(code)

      if (checkExistence && !codeRecord) {
        result.error = `Engagement code ${code} does not exist in database`
        return result
      }

      if (checkStatus && codeRecord && codeRecord.status !== 'Active') {
        result.error = `Engagement code ${code} exists but status is '${codeRecord.status}', not 'Active'`
        result.details = codeRecord
        return result
      }

      // Code exists and is valid
      if (codeRecord) {
        result.details = {
          ...codeRecord,
          isValid: codeRecord.status === 'Active'
        }
      }
    } catch (error) {
      result.error = `Database error during validation: ${error.message}`
      return result
    }
  }

  // All validations passed
  result.success = true
  return result
}

/**
 * Validates multiple engagement codes in batch
 * 
 * @param {string[]} engagementCodes - Array of engagement codes to validate
 * @param {Object} options - Validation options (same as validateEngagementCode)
 * @returns {Object} Batch validation result with individual results and summary
 * 
 * @example
 * const batchResult = validateEngagementCodesBatch([
 *   'ENG-2026-TAX-00001',
 *   'ENG-2026-AUD-00002'
 * ])
 * console.log(`Valid: ${batchResult.summary.valid}, Invalid: ${batchResult.summary.invalid}`)
 */
export function validateEngagementCodesBatch(engagementCodes, options = {}) {
  if (!Array.isArray(engagementCodes)) {
    return {
      success: false,
      error: 'engagementCodes must be an array',
      results: [],
      summary: { total: 0, valid: 0, invalid: 0 }
    }
  }

  const results = engagementCodes.map(code => validateEngagementCode(code, options))
  
  const summary = {
    total: results.length,
    valid: results.filter(r => r.success).length,
    invalid: results.filter(r => !r.success).length
  }

  return {
    success: summary.invalid === 0,
    results,
    summary
  }
}


