import jwt from 'jsonwebtoken'
import { getDatabase } from '../database/init.js'

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'prototype-secret')
    req.userId = decoded.userId
    req.userRole = decoded.role
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // Handle both array argument and individual arguments
    // If first argument is an array, use it; otherwise use all arguments
    const roles = Array.isArray(allowedRoles[0]) 
      ? allowedRoles[0] 
      : allowedRoles
    
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        userRole: req.userRole
      })
    }
    next()
  }
}


