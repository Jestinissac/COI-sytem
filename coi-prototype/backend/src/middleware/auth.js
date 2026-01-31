import jwt from 'jsonwebtoken'
import { getDatabase } from '../database/init.js'
import { checkPermission } from '../services/permissionService.js'

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

/**
 * Middleware to require a specific permission
 * Falls back to role-based check if permission system not initialized
 * @param {string} permissionKey - The permission key to check
 * @returns {Function} - Express middleware function
 */
export function requirePermission(permissionKey) {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    try {
      // Check if permission exists in database (permission system initialized)
      const db = getDatabase()
      const permission = db.prepare(`
        SELECT id FROM permissions WHERE permission_key = ?
      `).get(permissionKey)
      
      if (permission) {
        // Permission system is initialized, use it
        const hasPermission = checkPermission(req.userRole, permissionKey)
        
        if (!hasPermission) {
          // Get permission name for better error message
          const permInfo = db.prepare(`
            SELECT name FROM permissions WHERE permission_key = ?
          `).get(permissionKey)
          
          return res.status(403).json({
            error: 'Insufficient permissions',
            required: permissionKey,
            requiredName: permInfo?.name || permissionKey,
            userRole: req.userRole,
            message: `You need '${permInfo?.name || permissionKey}' permission. Contact your Super Admin.`
          })
        }
      } else {
        // Permission system not initialized, fall back to role-based check
        // This allows backward compatibility during migration
        // For now, allow Super Admin and Admin for most permissions
        // This is a temporary fallback - should be removed once all permissions are seeded
        const allowedRoles = ['Super Admin', 'Admin']
        if (!allowedRoles.includes(req.userRole)) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            required: permissionKey,
            userRole: req.userRole,
            message: `Permission '${permissionKey}' not found. Using role-based fallback.`
          })
        }
      }
      
      next()
    } catch (error) {
      console.error('Permission check error:', error)
      return res.status(500).json({ 
        error: 'Permission check failed',
        message: error.message 
      })
    }
  }
}


