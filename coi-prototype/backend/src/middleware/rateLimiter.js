/**
 * Rate Limiting Middleware for Reports
 * Limits report generation and export operations per user
 */

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map()

/**
 * Clean up old entries periodically
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.expiresAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

/**
 * Rate limiter for report generation
 * Max 10 reports per minute per user
 */
export function reportGenerationRateLimiter(req, res, next) {
  const userId = req.userId
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const key = `report_gen:${userId}`
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 10

  const userData = rateLimitStore.get(key) || { count: 0, resetAt: now + windowMs }

  // Reset if window expired
  if (now > userData.resetAt) {
    userData.count = 0
    userData.resetAt = now + windowMs
  }

  // Check limit
  if (userData.count >= maxRequests) {
    const retryAfter = Math.ceil((userData.resetAt - now) / 1000)
    return res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Maximum ${maxRequests} reports per minute. Please try again in ${retryAfter} seconds.`,
      retryAfter
    })
  }

  // Increment counter
  userData.count++
  userData.expiresAt = now + (windowMs * 2) // Keep entry for 2 windows
  rateLimitStore.set(key, userData)

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', maxRequests)
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - userData.count))
  res.setHeader('X-RateLimit-Reset', Math.ceil(userData.resetAt / 1000))

  next()
}

/**
 * Rate limiter for report exports
 * Max 5 exports per hour per user
 */
export function reportExportRateLimiter(req, res, next) {
  const userId = req.userId
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const key = `report_export:${userId}`
  const now = Date.now()
  const windowMs = 60 * 60 * 1000 // 1 hour
  const maxRequests = 5

  const userData = rateLimitStore.get(key) || { count: 0, resetAt: now + windowMs }

  // Reset if window expired
  if (now > userData.resetAt) {
    userData.count = 0
    userData.resetAt = now + windowMs
  }

  // Check limit
  if (userData.count >= maxRequests) {
    const retryAfter = Math.ceil((userData.resetAt - now) / 1000)
    const retryAfterMinutes = Math.ceil(retryAfter / 60)
    return res.status(429).json({
      error: 'Too many exports',
      message: `Export rate limit exceeded. Maximum ${maxRequests} exports per hour. Please try again in ${retryAfterMinutes} minute(s).`,
      retryAfter,
      retryAfterMinutes
    })
  }

  // Increment counter
  userData.count++
  userData.expiresAt = now + (windowMs * 2) // Keep entry for 2 windows
  rateLimitStore.set(key, userData)

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', maxRequests)
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - userData.count))
  res.setHeader('X-RateLimit-Reset', Math.ceil(userData.resetAt / 1000))

  next()
}
