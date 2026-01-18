/**
 * Report Cache Service
 * Implements in-memory caching for report data
 * Use Redis in production for distributed caching
 */

// In-memory cache store
const cacheStore = new Map()

// Cache TTLs (in milliseconds)
const CACHE_TTL = {
  SUMMARY: 5 * 60 * 1000,      // 5 minutes for summary metrics
  PAGINATED: 2 * 60 * 1000,     // 2 minutes for paginated results
  CHART_DATA: 5 * 60 * 1000     // 5 minutes for chart data
}

/**
 * Generate cache key from report parameters
 */
function generateCacheKey(role, reportType, filters) {
  const filterString = JSON.stringify(filters || {})
  return `report:${role}:${reportType}:${Buffer.from(filterString).toString('base64')}`
}

/**
 * Get cached data
 */
export function getCachedReport(key) {
  const cached = cacheStore.get(key)
  if (!cached) return null

  // Check if expired
  if (Date.now() > cached.expiresAt) {
    cacheStore.delete(key)
    return null
  }

  return cached.data
}

/**
 * Set cache data
 */
export function setCachedReport(key, data, ttl = CACHE_TTL.PAGINATED) {
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + ttl,
    createdAt: Date.now()
  })
}

/**
 * Cache report data with appropriate TTL
 */
export function cacheReportData(role, reportType, filters, data, cacheType = 'PAGINATED') {
  const key = generateCacheKey(role, reportType, filters)
  const ttl = CACHE_TTL[cacheType] || CACHE_TTL.PAGINATED
  
  // Only cache if data exists and is not too large
  if (data && JSON.stringify(data).length < 10 * 1024 * 1024) { // 10MB limit
    setCachedReport(key, data, ttl)
  }
  
  return key
}

/**
 * Get cached report data
 */
export function getCachedReportData(role, reportType, filters) {
  const key = generateCacheKey(role, reportType, filters)
  return getCachedReport(key)
}

/**
 * Invalidate cache for a specific report type
 */
export function invalidateReportCache(role, reportType) {
  const prefix = `report:${role}:${reportType}:`
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key)
    }
  }
}

/**
 * Invalidate all report caches
 */
export function invalidateAllReportCaches() {
  for (const key of cacheStore.keys()) {
    if (key.startsWith('report:')) {
      cacheStore.delete(key)
    }
  }
}

/**
 * Clean up expired cache entries
 */
export function cleanupExpiredCache() {
  const now = Date.now()
  for (const [key, cached] of cacheStore.entries()) {
    if (now > cached.expiresAt) {
      cacheStore.delete(key)
    }
  }
}

// Clean up expired cache every 5 minutes
setInterval(cleanupExpiredCache, 5 * 60 * 1000)

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const now = Date.now()
  let totalEntries = 0
  let expiredEntries = 0
  let totalSize = 0

  for (const [key, cached] of cacheStore.entries()) {
    totalEntries++
    if (now > cached.expiresAt) {
      expiredEntries++
    } else {
      totalSize += JSON.stringify(cached.data).length
    }
  }

  return {
    totalEntries,
    activeEntries: totalEntries - expiredEntries,
    expiredEntries,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    cacheStoreSize: cacheStore.size
  }
}
