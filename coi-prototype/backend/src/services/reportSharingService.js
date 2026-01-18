/**
 * Report Sharing Service
 * Handles secure report sharing with access control
 */

import { getDatabase } from '../database/init.js'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const db = getDatabase()

/**
 * Ensure report_shares table exists
 */
function ensureTablesExist() {
  // Create report_shares table
  db.exec(`
    CREATE TABLE IF NOT EXISTS report_shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_type VARCHAR(100) NOT NULL,
      report_filters TEXT NOT NULL,
      share_token VARCHAR(255) UNIQUE NOT NULL,
      created_by INTEGER NOT NULL,
      password_hash VARCHAR(255),
      expires_at DATETIME,
      access_level VARCHAR(50) DEFAULT 'view',
      allowed_roles TEXT,
      allowed_users TEXT,
      ip_whitelist TEXT,
      access_count INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `)

  // Create report_share_access table
  db.exec(`
    CREATE TABLE IF NOT EXISTS report_share_access (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      share_id INTEGER NOT NULL,
      accessed_by INTEGER,
      ip_address VARCHAR(45),
      user_agent TEXT,
      accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (share_id) REFERENCES report_shares(id),
      FOREIGN KEY (accessed_by) REFERENCES users(id)
    )
  `)

  // Create indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_report_shares_token ON report_shares(share_token)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_report_shares_created_by ON report_shares(created_by)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_report_share_access_share ON report_share_access(share_id)')
}

/**
 * Generate secure share token
 */
function generateShareToken() {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create a shareable report link
 */
export function createReportShare(userId, reportType, reportFilters, options = {}) {
  ensureTablesExist()

  const {
    password,
    expiresInDays = 30,
    accessLevel = 'view',
    allowedRoles = [],
    allowedUsers = [],
    ipWhitelist = []
  } = options

  const shareToken = generateShareToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  let passwordHash = null
  if (password) {
    passwordHash = bcrypt.hashSync(password, 10)
  }

  const shareId = db.prepare(`
    INSERT INTO report_shares (
      report_type, report_filters, share_token, created_by,
      password_hash, expires_at, access_level,
      allowed_roles, allowed_users, ip_whitelist
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    reportType,
    JSON.stringify(reportFilters),
    shareToken,
    userId,
    passwordHash,
    expiresAt.toISOString(),
    accessLevel,
    JSON.stringify(allowedRoles),
    JSON.stringify(allowedUsers),
    JSON.stringify(ipWhitelist)
  ).lastInsertRowid

  return {
    id: shareId,
    shareToken,
    shareUrl: `/api/reports/share/${shareToken}`,
    expiresAt: expiresAt.toISOString()
  }
}

/**
 * Get shared report by token
 */
export function getSharedReport(shareToken, options = {}) {
  ensureTablesExist()

  const { password, userId, ipAddress } = options

  const share = db.prepare(`
    SELECT * FROM report_shares
    WHERE share_token = ? AND is_active = 1
  `).get(shareToken)

  if (!share) {
    throw new Error('Share not found or has been revoked')
  }

  // Check expiration
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    throw new Error('Share has expired')
  }

  // Check password
  if (share.password_hash) {
    if (!password) {
      throw new Error('Password required')
    }
    if (!bcrypt.compareSync(password, share.password_hash)) {
      throw new Error('Invalid password')
    }
  }

  // Check IP whitelist
  if (share.ip_whitelist) {
    const whitelist = JSON.parse(share.ip_whitelist)
    if (whitelist.length > 0 && ipAddress && !whitelist.includes(ipAddress)) {
      throw new Error('IP address not allowed')
    }
  }

  // Check user/role access
  if (userId) {
    const allowedUsers = share.allowed_users ? JSON.parse(share.allowed_users) : []
    const allowedRoles = share.allowed_roles ? JSON.parse(share.allowed_roles) : []
    
    if (allowedUsers.length > 0 && !allowedUsers.includes(userId)) {
      // Check role
      const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId)
      if (!user || !allowedRoles.includes(user.role)) {
        throw new Error('Access denied')
      }
    }
  }

  // Log access
  logShareAccess(share.id, userId, ipAddress, options.userAgent)

  return {
    id: share.id,
    reportType: share.report_type,
    reportFilters: JSON.parse(share.report_filters),
    accessLevel: share.access_level,
    createdAt: share.created_at
  }
}

/**
 * Log share access
 */
function logShareAccess(shareId, userId, ipAddress, userAgent) {
  ensureTablesExist()

  // Update access count
  db.prepare(`
    UPDATE report_shares
    SET access_count = access_count + 1
    WHERE id = ?
  `).run(shareId)

  // Log access
  db.prepare(`
    INSERT INTO report_share_access (share_id, accessed_by, ip_address, user_agent)
    VALUES (?, ?, ?, ?)
  `).run(shareId, userId || null, ipAddress || null, userAgent || null)
}

/**
 * Revoke share
 */
export function revokeShare(shareToken, userId) {
  ensureTablesExist()

  const share = db.prepare(`
    SELECT created_by FROM report_shares WHERE share_token = ?
  `).get(shareToken)

  if (!share) {
    throw new Error('Share not found')
  }

  if (share.created_by !== userId) {
    throw new Error('Only the creator can revoke this share')
  }

  db.prepare(`
    UPDATE report_shares
    SET is_active = 0
    WHERE share_token = ?
  `).run(shareToken)

  return { success: true }
}

/**
 * Get share activity
 */
export function getShareActivity(shareToken, userId) {
  ensureTablesExist()

  const share = db.prepare(`
    SELECT created_by FROM report_shares WHERE share_token = ?
  `).get(shareToken)

  if (!share || share.created_by !== userId) {
    throw new Error('Access denied')
  }

  const activity = db.prepare(`
    SELECT 
      rsa.*,
      u.name as accessed_by_name,
      u.email as accessed_by_email
    FROM report_share_access rsa
    LEFT JOIN users u ON rsa.accessed_by = u.id
    WHERE rsa.share_id = (SELECT id FROM report_shares WHERE share_token = ?)
    ORDER BY rsa.accessed_at DESC
    LIMIT 100
  `).all(shareToken)

  return activity
}

/**
 * Get user's shares
 */
export function getUserShares(userId) {
  ensureTablesExist()

  const shares = db.prepare(`
    SELECT 
      id,
      report_type,
      share_token,
      expires_at,
      access_level,
      access_count,
      is_active,
      created_at
    FROM report_shares
    WHERE created_by = ?
    ORDER BY created_at DESC
  `).all(userId)

  return shares.map(share => ({
    ...share,
    shareUrl: `/api/reports/share/${share.share_token}`,
    isExpired: share.expires_at && new Date(share.expires_at) < new Date()
  }))
}
