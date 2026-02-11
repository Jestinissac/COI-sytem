import jwt from 'jsonwebtoken'
import { getDatabase } from '../database/init.js'
import { 
  generateAccessToken, 
  generateRefreshToken, 
  storeRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens
} from '../utils/tokenUtils.js'
import { devLog } from '../config/environment.js'

const JWT_SECRET = process.env.JWT_SECRET || 'prototype-secret'

export async function login(req, res) {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  const db = getDatabase()
  
  // Mock authentication: Accept any password for prototype
  // Check for active users (COALESCE defaults to 1 if column doesn't exist)
  const user = db.prepare(`
    SELECT * FROM users 
    WHERE email = ? AND COALESCE(active, 1) = 1
  `).get(email)

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials or account is disabled' })
  }

  // In prototype, accept any password (skip password verification)

  // Parse system_access JSON
  let systemAccess = []
  try {
    systemAccess = user.system_access ? JSON.parse(user.system_access) : ['COI']
  } catch (e) {
    systemAccess = ['COI']
  }

  // Generate access token (short-lived) and refresh token (long-lived)
  const accessToken = generateAccessToken(user.id, user.role)
  const refreshToken = generateRefreshToken()
  
  // Store refresh token in database
  const stored = storeRefreshToken(user.id, refreshToken)
  if (!stored) {
    return res.status(500).json({ error: 'Failed to generate session tokens' })
  }

  // Return user without password
  const { password_hash, ...userWithoutPassword } = user

  res.json({
    token: accessToken, // Keep 'token' for backward compatibility
    accessToken,
    refreshToken,
    user: {
      ...userWithoutPassword,
      system_access: systemAccess
    },
    systemAccess
  })
}

export async function getCurrentUser(req, res) {
  const db = getDatabase()
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId)
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  let systemAccess = []
  try {
    systemAccess = user.system_access ? JSON.parse(user.system_access) : ['COI']
  } catch (e) {
    systemAccess = ['COI']
  }

  const { password_hash, ...userWithoutPassword } = user

  res.json({
    user: {
      ...userWithoutPassword,
      system_access: systemAccess
    },
    systemAccess
  })
}

export async function getAllUsers(req, res) {
  const db = getDatabase()
  // COALESCE(active, 1): default to active when column is missing (backward compatibility)
  const users = db.prepare(`
    SELECT 
      id, 
      name, 
      email, 
      role, 
      department, 
      line_of_service, 
      COALESCE(active, 1) as active 
    FROM users 
    ORDER BY name
  `).all()
  res.json(users)
}

export async function createUser(req, res) {
  const db = getDatabase()
  const { name, email, password, role, department, line_of_service, director_id, system_access } = req.body

  if (!name || !email || !password || !role || !department) {
    return res.status(400).json({ error: 'Name, email, password, role, and department are required' })
  }

  // Check if user already exists
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists' })
  }

  // PROTOTYPE ONLY: Store plain text. Production must hash passwords (e.g. bcrypt, min 10 rounds); no plaintext storage.
  const password_hash = password

  // Insert user
  const result = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, department, line_of_service, director_id, system_access, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    name,
    email,
    password_hash,
    role,
    department,
    line_of_service || null,
    director_id || null,
    system_access ? JSON.stringify(system_access) : JSON.stringify(['COI'])
  )

  // Log audit
  logAuditAction(req.userId, 'Create User', 'User', result.lastInsertRowid, { email, role, department }, req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1')

  res.json({ id: result.lastInsertRowid, message: 'User created successfully' })
}

export async function updateUser(req, res) {
  const db = getDatabase()
  const { id } = req.params
  const { name, email, role, department, line_of_service, director_id, system_access, active } = req.body

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  // Update user
  db.prepare(`
    UPDATE users 
    SET name = COALESCE(?, name),
        email = COALESCE(?, email),
        role = COALESCE(?, role),
        department = COALESCE(?, department),
        line_of_service = COALESCE(?, line_of_service),
        director_id = COALESCE(?, director_id),
        system_access = COALESCE(?, system_access),
        active = COALESCE(?, active)
    WHERE id = ?
  `).run(
    name || user.name,
    email || user.email,
    role || user.role,
    department || user.department,
    line_of_service !== undefined ? line_of_service : user.line_of_service,
    director_id !== undefined ? director_id : user.director_id,
    system_access ? JSON.stringify(system_access) : user.system_access,
    active !== undefined ? active : user.active,
    id
  )

  // Log audit
  logAuditAction(req.userId, 'Update User', 'User', id, { email: email || user.email, changes: req.body }, req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1')

  res.json({ message: 'User updated successfully' })
}

export async function disableUser(req, res) {
  const db = getDatabase()
  const { id } = req.params

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  if (user.role === 'Super Admin') {
    return res.status(403).json({ error: 'Cannot disable Super Admin user' })
  }

  // Disable user
  db.prepare('UPDATE users SET active = 0 WHERE id = ?').run(id)

  // Log audit
  logAuditAction(req.userId, 'Disable User', 'User', id, { email: user.email }, req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1')

  res.json({ message: 'User disabled successfully' })
}

export async function enableUser(req, res) {
  const db = getDatabase()
  const { id } = req.params

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  // Enable user
  db.prepare('UPDATE users SET active = 1 WHERE id = ?').run(id)

  // Log audit
  logAuditAction(req.userId, 'Enable User', 'User', id, { email: user.email }, req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1')

  res.json({ message: 'User enabled successfully' })
}

export async function getAuditLogs(req, res) {
  const db = getDatabase()
  const { limit = 100, offset = 0 } = req.query

  const logs = db.prepare(`
    SELECT 
      al.id,
      al.created_at as timestamp,
      u.name as user_name,
      u.email as user_email,
      al.action,
      al.entity_type,
      al.entity_id,
      al.details,
      al.ip_address as ip
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(limit), parseInt(offset))

  const total = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count

  res.json({ logs, total })
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(req, res) {
  const { refreshToken } = req.body
  
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' })
  }
  
  // Verify refresh token
  const verification = verifyRefreshToken(refreshToken)
  
  if (!verification.valid) {
    return res.status(401).json({ error: verification.error })
  }
  
  // Generate new access token
  const newAccessToken = generateAccessToken(verification.userId, verification.role)
  
  // Optional: Implement refresh token rotation for better security
  // Generate new refresh token and revoke the old one
  const newRefreshToken = generateRefreshToken()
  const stored = storeRefreshToken(verification.userId, newRefreshToken)
  
  if (stored) {
    // Revoke old refresh token and link it to the new one
    revokeRefreshToken(refreshToken, newRefreshToken)
  }
  
  // Get user data
  const db = getDatabase()
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(verification.userId)
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  
  let systemAccess = []
  try {
    systemAccess = user.system_access ? JSON.parse(user.system_access) : ['COI']
  } catch (e) {
    systemAccess = ['COI']
  }
  
  const { password_hash, ...userWithoutPassword } = user
  
  res.json({
    token: newAccessToken, // Keep 'token' for backward compatibility
    accessToken: newAccessToken,
    refreshToken: newRefreshToken, // Return new refresh token (rotation)
    user: {
      ...userWithoutPassword,
      system_access: systemAccess
    },
    systemAccess
  })
}

/**
 * Logout and revoke refresh token
 */
export async function logout(req, res) {
  const { refreshToken } = req.body
  
  if (refreshToken) {
    revokeRefreshToken(refreshToken)
  }
  
  res.json({ message: 'Logged out successfully' })
}

/**
 * Logout from all devices (revoke all refresh tokens)
 */
export async function logoutAll(req, res) {
  const userId = req.userId // From auth middleware
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  
  const revoked = revokeAllUserTokens(userId)
  
  if (revoked) {
    res.json({ message: 'Logged out from all devices successfully' })
  } else {
    res.status(500).json({ error: 'Failed to logout from all devices' })
  }
}

// Helper function to log audit actions
export function logAuditAction(userId, action, entityType, entityId, details, ipAddress) {
  const db = getDatabase()
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      action,
      entityType,
      entityId,
      JSON.stringify(details),
      ipAddress || '127.0.0.1'
    )
  } catch (error) {
    console.error('Failed to log audit action:', error)
  }
}


// ========================================
// APPROVER AVAILABILITY MANAGEMENT
// ========================================

/**
 * Get all approver users (Directors, Compliance, Partners, Finance)
 */
export async function getApproverUsers(req, res) {
  try {
    const db = getDatabase()
    
    const approvers = db.prepare(`
      SELECT id, name, email, role, is_active, unavailable_reason, unavailable_until
      FROM users
      WHERE role IN ('Director', 'Compliance', 'Partner', 'Finance')
      ORDER BY role, name
    `).all()
    
    res.json(approvers)
  } catch (error) {
    console.error('Error fetching approver users:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Update user availability status
 */
export async function updateUserAvailability(req, res) {
  try {
    const db = getDatabase()
    const { id } = req.params
    const { is_active, unavailable_reason, unavailable_until } = req.body
    const adminId = req.userId
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Don't allow changing availability of Admin/Super Admin users
    if (['Admin', 'Super Admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Cannot change availability of Admin users' })
    }
    
    db.prepare(`
      UPDATE users
      SET is_active = ?,
          unavailable_reason = ?,
          unavailable_until = ?
      WHERE id = ?
    `).run(
      is_active ? 1 : 0,
      unavailable_reason || null,
      unavailable_until || null,
      id
    )
    
    // Log the action
    logAuditAction(
      adminId,
      is_active ? 'USER_MARKED_AVAILABLE' : 'USER_MARKED_UNAVAILABLE',
      'user',
      id,
      {
        user_name: user.name,
        user_role: user.role,
        reason: unavailable_reason,
        until: unavailable_until
      },
      req.ip
    )
    
    devLog(`[Availability] User ${user.name} (${user.role}) marked as ${is_active ? 'available' : 'unavailable'} by admin ${adminId}`)
    
    res.json({
      success: true,
      user_id: id,
      is_active: is_active ? 1 : 0
    })
  } catch (error) {
    console.error('Error updating user availability:', error)
    res.status(500).json({ error: error.message })
  }
}
