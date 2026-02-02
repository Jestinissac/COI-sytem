/**
 * Response mapper for role-based data stripping.
 * Compliance must not receive commercial data (financial_parameters, total_fees, engagement_code, fee_details).
 */

const COMMERCIAL_FIELDS = ['financial_parameters', 'total_fees', 'engagement_code', 'fee_details']

function stripCommercialFromRow(row) {
  if (!row || typeof row !== 'object') return row
  const out = { ...row }
  for (const key of COMMERCIAL_FIELDS) {
    if (out[key] !== undefined) delete out[key]
  }
  return out
}

/**
 * Map response data for the given role. For Compliance, strips commercial fields from request rows.
 * @param {Array|Object} rowsOrSingle - Array of request-like objects or a single request-like object
 * @param {string} userRole - User role (e.g. 'Compliance', 'Partner')
 * @returns {Array|Object} Same shape as input with commercial fields removed for Compliance
 */
export function mapResponseForRole(rowsOrSingle, userRole) {
  if (userRole !== 'Compliance') return rowsOrSingle

  if (Array.isArray(rowsOrSingle)) {
    return rowsOrSingle.map(row => stripCommercialFromRow(row))
  }
  if (rowsOrSingle && typeof rowsOrSingle === 'object') {
    return stripCommercialFromRow(rowsOrSingle)
  }
  return rowsOrSingle
}
