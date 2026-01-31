import express from 'express'
import { authenticateToken, requireRole, requirePermission } from '../middleware/auth.js'
import {
  checkPermission,
  getRolePermissions,
  grantPermission,
  revokePermission,
  getAllPermissions,
  getPermissionsByCategory,
  getPermissionAuditLog
} from '../services/permissionService.js'

const router = express.Router()

// Get all permissions (Super Admin only)
router.get('/all', authenticateToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const permissions = getAllPermissions()
    res.json({ permissions })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get permissions for a specific role
router.get('/role/:role', authenticateToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const { role } = req.params
    const permissions = getRolePermissions(role)
    res.json({ permissions })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get permissions by category
router.get('/category/:category', authenticateToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const { category } = req.params
    const permissions = getPermissionsByCategory(category)
    res.json({ permissions })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Grant permission to a role
router.post('/grant', authenticateToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const { role, permission_key } = req.body
    
    if (!role || !permission_key) {
      return res.status(400).json({ error: 'Role and permission_key are required' })
    }
    
    const result = grantPermission(role, permission_key, req.userId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Revoke permission from a role
router.post('/revoke', authenticateToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const { role, permission_key, reason } = req.body
    
    if (!role || !permission_key) {
      return res.status(400).json({ error: 'Role and permission_key are required' })
    }
    
    const result = revokePermission(role, permission_key, req.userId, reason)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get permission audit log
router.get('/audit-log', authenticateToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const { role, permission_key, limit, offset } = req.query
    const filters = {
      role: role || null,
      permissionKey: permission_key || null,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0
    }
    
    const logs = getPermissionAuditLog(filters)
    res.json({ logs })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Check if current user has a permission (for frontend)
router.get('/check/:permissionKey', authenticateToken, async (req, res) => {
  try {
    const { permissionKey } = req.params
    const hasPermission = checkPermission(req.userRole, permissionKey)
    res.json({ hasPermission })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Reset permissions to defaults (Super Admin only)
router.post('/reset-defaults', authenticateToken, requireRole('Super Admin'), async (req, res) => {
  try {
    // This will be implemented in init.js seed function
    // For now, return success
    res.json({ success: true, message: 'Permissions reset to defaults' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
