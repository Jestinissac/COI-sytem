-- =====================================================
-- Dynamic Permission System Migration
-- Date: 2026-01-26
-- Description: Creates tables for dynamic permission system,
--              role-based permissions, and permission audit logging
-- =====================================================

-- =====================================================
-- PERMISSIONS TABLE
-- =====================================================

-- Core permissions catalog
-- Stores all available permissions in the system
CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    permission_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,  -- 'Configuration', 'User Management', 'Reports', 'Requests', 'System'
    is_system BOOLEAN DEFAULT 1,    -- System permissions cannot be deleted
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ROLE PERMISSIONS TABLE
-- =====================================================

-- Role-permission mappings
-- Defines which permissions are granted to which roles
CREATE TABLE IF NOT EXISTS role_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role VARCHAR(50) NOT NULL,
    permission_key VARCHAR(100) NOT NULL REFERENCES permissions(permission_key) ON DELETE CASCADE,
    is_granted BOOLEAN DEFAULT 1,   -- true = granted, false = explicitly denied
    granted_by INTEGER REFERENCES users(id),
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, permission_key)
);

-- =====================================================
-- PERMISSION AUDIT LOG TABLE
-- =====================================================

-- Audit trail for permission changes
-- Tracks all permission grants and revocations
CREATE TABLE IF NOT EXISTS permission_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role VARCHAR(50) NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL,    -- 'granted' or 'revoked'
    changed_by INTEGER NOT NULL REFERENCES users(id),
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason TEXT
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_permissions_key ON permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_key ON role_permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_role_permissions_granted ON role_permissions(role, is_granted);
CREATE INDEX IF NOT EXISTS idx_permission_audit_role ON permission_audit_log(role);
CREATE INDEX IF NOT EXISTS idx_permission_audit_key ON permission_audit_log(permission_key);
CREATE INDEX IF NOT EXISTS idx_permission_audit_date ON permission_audit_log(changed_at);
CREATE INDEX IF NOT EXISTS idx_permission_audit_user ON permission_audit_log(changed_by);
