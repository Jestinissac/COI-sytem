/**
 * Ambiguous Service Config
 * Services that require a clarification modal (Kuwait/CMA) to map to a specific CMA code or NULL.
 * Used when the user selects a catch-all (e.g. Other Advisory, Transaction Services).
 */

const AMBIGUOUS_SERVICE_CONFIG = {
  'Transaction Services': {
    requires_question: true,
    question_text: 'What is the primary nature of this transaction engagement?',
    options: [
      { label: 'Providing a Valuation Report (Business/Asset)', cma_code: 'ASSET_VALUATION' },
      { label: 'Advising on buying/selling securities (Investment Advice)', cma_code: 'INVESTMENT_ADVISOR' },
      { label: 'Standard Financial/Commercial Due Diligence', cma_code: null }
    ]
  },
  'Due Diligence Services': {
    requires_question: true,
    question_text: 'What is the primary nature of this transaction engagement?',
    options: [
      { label: 'Providing a Valuation Report (Business/Asset)', cma_code: 'ASSET_VALUATION' },
      { label: 'Advising on buying/selling securities (Investment Advice)', cma_code: 'INVESTMENT_ADVISOR' },
      { label: 'Standard Financial/Commercial Due Diligence', cma_code: null }
    ]
  },
  'Management Consulting Services': {
    requires_question: true,
    question_text: 'Does this engagement involve advising on Mergers, Acquisitions, or specific Investment strategies?',
    options: [
      { label: 'Yes, M&A or Investment Advice', cma_code: 'INVESTMENT_ADVISOR' },
      { label: 'No, General Consulting (HR, Ops, Strategy)', cma_code: null }
    ]
  },
  'Other Advisory': {
    requires_question: true,
    question_text: 'Does this service fall under any of the following CMA-regulated categories?',
    options: [
      { label: 'Valuation of Assets/Business', cma_code: 'ASSET_VALUATION' },
      { label: 'Investment Advisory', cma_code: 'INVESTMENT_ADVISOR' },
      { label: 'AML / CFT Compliance', cma_code: 'AML_CFT_ASSESSMENT' },
      { label: 'None of the above', cma_code: null }
    ]
  },
  'Other Audit Services': {
    requires_question: true,
    question_text: 'Does this engagement involve reviewing the performance or quality of the client\'s Internal Audit function?',
    options: [
      { label: 'Yes', cma_code: 'INT_AUDIT_PERF_REVIEW' },
      { label: 'No', cma_code: null }
    ]
  }
}

/**
 * Get config for a service type if it is ambiguous.
 * @param {string} serviceTypeName - Exact service type name (e.g. "Other Advisory")
 * @returns {object|null} Config with question_text and options, or null if not ambiguous
 */
export function getAmbiguousServiceConfig(serviceTypeName) {
  if (!serviceTypeName || typeof serviceTypeName !== 'string') return null
  const key = serviceTypeName.trim()
  return AMBIGUOUS_SERVICE_CONFIG[key] || null
}

/**
 * Check if a service type is ambiguous (requires clarification modal).
 * @param {string} serviceTypeName
 * @returns {boolean}
 */
export function isAmbiguousService(serviceTypeName) {
  return !!getAmbiguousServiceConfig(serviceTypeName)
}

/**
 * Get all ambiguous service configs (for API / frontend dropdown).
 * @returns {object} Map of serviceTypeName -> { requires_question, question_text, options }
 */
export function getAllAmbiguousServiceConfigs() {
  return { ...AMBIGUOUS_SERVICE_CONFIG }
}
