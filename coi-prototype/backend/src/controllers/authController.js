import jwt from 'jsonwebtoken'
import { getDatabase } from '../database/init.js'

const JWT_SECRET = process.env.JWT_SECRET || 'prototype-secret'

export async function login(req, res) {
  const { email, password } = req.body
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  const db = getDatabase()
  
  // Mock authentication: Accept any password for prototype
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  // In prototype, accept any password (skip password verification)

  // Parse system_access JSON
  let systemAccess = []
  try {
    systemAccess = user.system_access ? JSON.parse(user.system_access) : ['COI']
  } catch (e) {
    systemAccess = ['COI']
  }

  // Generate token
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  )

  // Return user without password
  const { password_hash, ...userWithoutPassword } = user

  res.json({
    token,
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
  // Use COALESCE to default to 1 (active) if column doesn't exist yet
  const users = db.prepare(`
    SELECT 
      id, 
      name, 
      email, 
      role, 
      department, 
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

  // Hash password (in production, use bcrypt)
  const password_hash = password // In prototype, store plain text (NOT for production!)

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

