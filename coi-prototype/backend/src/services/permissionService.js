import { getDatabase } from '../database/init.js'

/**
 * Permission Service
 * Handles dynamic permission checking, granting, and revocation
 */

/**
 * Check if a role has a specific permission
 * @param {string} userRole - The user's role
 * @param {string} permissionKey - The permission key to check
 * @returns {boolean} - True if role has permission, false otherwise
 */
export function checkPermission(userRole, permissionKey) {
  const db = getDatabase()
  
  // Super Admin has all permissions by default
  if (userRole === 'Super Admin') {
    return true
  }
  
  // Check if permission exists in role_permissions table
  const permission = db.prepare(`
    SELECT is_granted 
    FROM role_permissions 
    WHERE role = ? AND permission_key = ?
  `).get(userRole, permissionKey)
  
  // If explicit permission exists, return its value
  if (permission) {
    return permission.is_granted === 1 || permission.is_granted === true
  }
  
  // If no explicit permission found, return false (deny by default)
  return false
}

/**
 * Get all permissions for a specific role
 * @param {string} role - The role to get permissions for
 * @returns {Array} - Array of permission objects with is_granted status
 */
export function getRolePermissions(role) {
  const db = getDatabase()
  
  // Super Admin gets all permissions
  if (role === 'Super Admin') {
    const allPermissions = db.prepare(`
      SELECT 
        p.*,
        1 as is_granted
      FROM permissions p
      ORDER BY p.category, p.name
    `).all()
    return allPermissions
  }
  
  // Get permissions for specific role
  const permissions = db.prepare(`
    SELECT 
      p.*,
      COALESCE(rp.is_granted, 0) as is_granted
    FROM permissions p
    LEFT JOIN role_permissions rp ON p.permission_key = rp.permission_key AND rp.role = ?
    ORDER BY p.category, p.name
  `).all(role)
  
  return permissions
}

/**
 * Grant a permission to a role
 * @param {string} role - The role to grant permission to
 * @param {string} permissionKey - The permission key to grant
 * @param {number} grantedBy - User ID who granted this permission
 * @returns {Object} - Result object with success status
 */
export function grantPermission(role, permissionKey, grantedBy) {
  const db = getDatabase()
  
  // Verify permission exists
  const permission = db.prepare(`
    SELECT id FROM permissions WHERE permission_key = ?
  `).get(permissionKey)
  
  if (!permission) {
    throw new Error(`Permission '${permissionKey}' does not exist`)
  }
  
  // Check if already granted
  const existing = db.prepare(`
    SELECT id, is_granted FROM role_permissions 
    WHERE role = ? AND permission_key = ?
  `).get(role, permissionKey)
  
  const transaction = db.transaction(() => {
    if (existing) {
      // Update existing permission
      if (existing.is_granted === 1 || existing.is_granted === true) {
        return { success: true, message: 'Permission already granted', changed: false }
      }
      
      db.prepare(`
        UPDATE role_permissions 
        SET is_granted = 1, granted_by = ?, granted_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(grantedBy, existing.id)
    } else {
      // Insert new permission
      db.prepare(`
        INSERT INTO role_permissions (role, permission_key, is_granted, granted_by)
        VALUES (?, ?, 1, ?)
      `).run(role, permissionKey, grantedBy)
    }
    
    // Log audit trail
    db.prepare(`
      INSERT INTO permission_audit_log (role, permission_key, action, changed_by)
      VALUES (?, ?, 'granted', ?)
    `).run(role, permissionKey, grantedBy)
    
    return { success: true, message: 'Permission granted successfully', changed: true }
  })
  
  return transaction()
}

/**
 * Revoke a permission from a role
 * @param {string} role - The role to revoke permission from
 * @param {string} permissionKey - The permission key to revoke
 * @param {number} revokedBy - User ID who revoked this permission
 * @param {string} reason - Optional reason for revocation
 * @returns {Object} - Result object with success status
 */
export function revokePermission(role, permissionKey, revokedBy, reason = null) {
  const db = getDatabase()
  
  // Cannot revoke permissions from Super Admin
  if (role === 'Super Admin') {
    throw new Error('Cannot revoke permissions from Super Admin role')
  }
  
  // Check if permission exists
  const existing = db.prepare(`
    SELECT id FROM role_permissions 
    WHERE role = ? AND permission_key = ?
  `).get(role, permissionKey)
  
  if (!existing) {
    return { success: false, message: 'Permission not found for this role', changed: false }
  }
  
  const transaction = db.transaction(() => {
    // Update to explicitly denied (is_granted = 0)
    db.prepare(`
      UPDATE role_permissions 
      SET is_granted = 0, granted_by = ?, granted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(revokedBy, existing.id)
    
    // Log audit trail
    db.prepare(`
      INSERT INTO permission_audit_log (role, permission_key, action, changed_by, reason)
      VALUES (?, ?, 'revoked', ?, ?)
    `).run(role, permissionKey, revokedBy, reason)
    
    return { success: true, message: 'Permission revoked successfully', changed: true }
  })
  
  return transaction()
}

/**
 * Get all available permissions in the system
 * @returns {Array} - Array of all permission objects
 */
export function getAllPermissions() {
  const db = getDatabase()
  
  const permissions = db.prepare(`
    SELECT * FROM permissions 
    ORDER BY category, name
  `).all()
  
  return permissions
}

/**
 * Get permissions by category
 * @param {string} category - The category to filter by
 * @returns {Array} - Array of permission objects in the category
 */
export function getPermissionsByCategory(category) {
  const db = getDatabase()
  
  const permissions = db.prepare(`
    SELECT * FROM permissions 
    WHERE category = ?
    ORDER BY name
  `).all(category)
  
  return permissions
}

/**
 * Get permission audit log
 * @param {Object} filters - Optional filters (role, permissionKey, limit, offset)
 * @returns {Array} - Array of audit log entries
 */
export function getPermissionAuditLog(filters = {}) {
  const db = getDatabase()
  
  let query = `
    SELECT 
      pal.*,
      u.name as changed_by_name,
      u.email as changed_by_email
    FROM permission_audit_log pal
    LEFT JOIN users u ON pal.changed_by = u.id
    WHERE 1=1
  `
  const params = []
  
  if (filters.role) {
    query += ' AND pal.role = ?'
    params.push(filters.role)
  }
  
  if (filters.permissionKey) {
    query += ' AND pal.permission_key = ?'
    params.push(filters.permissionKey)
  }
  
  query += ' ORDER BY pal.changed_at DESC'
  
  if (filters.limit) {
    query += ' LIMIT ?'
    params.push(filters.limit)
    
    if (filters.offset) {
      query += ' OFFSET ?'
      params.push(filters.offset)
    }
  }
  
  const logs = db.prepare(query).all(...params)
  return logs
}

/**
 * Check if user has any of the specified permissions
 * @param {string} userRole - The user's role
 * @param {Array<string>} permissionKeys - Array of permission keys to check
 * @returns {boolean} - True if user has at least one permission
 */
export function hasAnyPermission(userRole, permissionKeys) {
  return permissionKeys.some(key => checkPermission(userRole, key))
}

/**
 * Check if user has all of the specified permissions
 * @param {string} userRole - The user's role
 * @param {Array<string>} permissionKeys - Array of permission keys to check
 * @returns {boolean} - True if user has all permissions
 */
export function hasAllPermissions(userRole, permissionKeys) {
  return permissionKeys.every(key => checkPermission(userRole, key))
}
