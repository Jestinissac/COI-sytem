import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { getDatabase } from '../database/init.js'

const JWT_SECRET = process.env.JWT_SECRET || 'prototype-secret'
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'prototype-refresh-secret'

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m' // 15 minutes for access tokens
const REFRESH_TOKEN_EXPIRY_DAYS = 7 // 7 days for refresh tokens

/**
 * Generate an access token (JWT)
 */
export function generateAccessToken(userId, role) {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  )
}

/**
 * Generate a refresh token (random string)
 */
export function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex')
}

/**
 * Store refresh token in database
 */
export function storeRefreshToken(userId, refreshToken) {
  const db = getDatabase()
  
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)
  
  try {
    db.prepare(`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `).run(userId, refreshToken, expiresAt.toISOString())
    
    return true
  } catch (error) {
    console.error('Failed to store refresh token:', error)
    return false
  }
}

/**
 * Verify and get refresh token from database
 */
export function verifyRefreshToken(refreshToken) {
  const db = getDatabase()
  
  try {
    const tokenRecord = db.prepare(`
      SELECT 
        rt.id,
        rt.user_id,
        rt.token,
        rt.expires_at,
        rt.revoked,
        u.role,
        u.active
      FROM refresh_tokens rt
      INNER JOIN users u ON rt.user_id = u.id
      WHERE rt.token = ?
    `).get(refreshToken)
    
    if (!tokenRecord) {
      return { valid: false, error: 'Invalid refresh token' }
    }
    
    // Check if token is revoked
    if (tokenRecord.revoked) {
      return { valid: false, error: 'Refresh token has been revoked' }
    }
    
    // Check if user is active
    if (!tokenRecord.active) {
      return { valid: false, error: 'User account is disabled' }
    }
    
    // Check if token is expired
    const expiresAt = new Date(tokenRecord.expires_at)
    if (expiresAt < new Date()) {
      // Clean up expired token
      revokeRefreshToken(refreshToken)
      return { valid: false, error: 'Refresh token has expired' }
    }
    
    return {
      valid: true,
      userId: tokenRecord.user_id,
      role: tokenRecord.role,
      tokenId: tokenRecord.id
    }
  } catch (error) {
    console.error('Error verifying refresh token:', error)
    return { valid: false, error: 'Token verification failed' }
  }
}

/**
 * Revoke a refresh token
 */
export function revokeRefreshToken(refreshToken, replacedByToken = null) {
  const db = getDatabase()
  
  try {
    db.prepare(`
      UPDATE refresh_tokens 
      SET revoked = 1, 
          revoked_at = CURRENT_TIMESTAMP,
          replaced_by_token = ?
      WHERE token = ?
    `).run(replacedByToken, refreshToken)
    
    return true
  } catch (error) {
    console.error('Failed to revoke refresh token:', error)
    return false
  }
}

/**
 * Revoke all refresh tokens for a user (logout from all devices)
 */
export function revokeAllUserTokens(userId) {
  const db = getDatabase()
  
  try {
    db.prepare(`
      UPDATE refresh_tokens 
      SET revoked = 1, 
          revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND revoked = 0
    `).run(userId)
    
    return true
  } catch (error) {
    console.error('Failed to revoke all user tokens:', error)
    return false
  }
}

/**
 * Clean up expired tokens (should be run periodically)
 */
export function cleanupExpiredTokens() {
  const db = getDatabase()
  
  try {
    const result = db.prepare(`
      DELETE FROM refresh_tokens 
      WHERE expires_at < datetime('now') OR revoked = 1
    `).run()
    
    console.log(`🧹 Cleaned up ${result.changes} expired/revoked tokens`)
    return result.changes
  } catch (error) {
    console.error('Failed to cleanup expired tokens:', error)
    return 0
  }
}

/**
 * Verify access token
 */
export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return { valid: true, payload: decoded }
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { valid: false, error: 'Access token has expired', expired: true }
    }
    return { valid: false, error: 'Invalid access token' }
  }
}
