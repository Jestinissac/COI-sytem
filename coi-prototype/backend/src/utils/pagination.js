/**
 * Pagination utilities for reports and large datasets
 */

/**
 * Calculate pagination metadata
 */
export function calculatePagination(page, pageSize, totalItems) {
  const totalPages = Math.ceil(totalItems / pageSize)
  const currentPage = Math.max(1, Math.min(page, totalPages))
  const offset = (currentPage - 1) * pageSize
  const hasNext = currentPage < totalPages
  const hasPrev = currentPage > 1

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    offset,
    hasNext,
    hasPrev,
    startIndex: offset + 1,
    endIndex: Math.min(offset + pageSize, totalItems)
  }
}

/**
 * Apply pagination to SQL query
 */
export function applyPagination(query, params, page, pageSize) {
  const pagination = calculatePagination(page, pageSize, 0) // Total will be calculated separately
  query += ` LIMIT ? OFFSET ?`
  params.push(pagination.pageSize, pagination.offset)
  return { query, params, pagination }
}

/**
 * Get count query from select query
 */
export function getCountQuery(selectQuery) {
  // Extract the FROM clause and everything after it
  const fromMatch = selectQuery.match(/FROM\s+.*$/i)
  if (!fromMatch) {
    throw new Error('Invalid query: No FROM clause found')
  }
  
  // Get WHERE clause if exists
  const whereMatch = selectQuery.match(/WHERE\s+.*?(?=\s+ORDER\s+BY|\s+GROUP\s+BY|\s+LIMIT|$)/i)
  const whereClause = whereMatch ? whereMatch[0] : ''
  
  // Build count query
  return `SELECT COUNT(*) as total ${fromMatch[0]} ${whereClause}`
}

/**
 * Format pagination response
 */
export function formatPaginationResponse(data, pagination, totalItems) {
  return {
    data,
    pagination: {
      ...pagination,
      totalItems
    }
  }
}
