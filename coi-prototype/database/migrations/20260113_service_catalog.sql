-- Migration: Service Catalog System 2026-01-13
-- Adds entity codes, service catalog tables, and related indexes

-- 1. Entity Codes Table (similar to HRMS keywords pattern)
CREATE TABLE IF NOT EXISTS entity_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_code VARCHAR(50) UNIQUE NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    entity_display_name VARCHAR(255),
    is_active BOOLEAN DEFAULT 1,
    is_default BOOLEAN DEFAULT 0,
    catalog_mode VARCHAR(50) DEFAULT 'independent' CHECK (catalog_mode IN ('inherit', 'independent')),
    created_by INTEGER,
    updated_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Service Catalog Global (Master Library - BDO Global services)
CREATE TABLE IF NOT EXISTS service_catalog_global (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    metadata TEXT, -- JSON: {source: 'Global COI Form', version: '1.0', etc.}
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Service Catalog Entities (Entity-specific catalogs)
CREATE TABLE IF NOT EXISTS service_catalog_entities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_name VARCHAR(100) NOT NULL, -- 'BDO Al Nisf & Partners', 'BDO Consulting'
    service_code VARCHAR(50) NOT NULL, -- References service_catalog_global.service_code
    is_enabled BOOLEAN DEFAULT 1,
    custom_name VARCHAR(255), -- Override service name for entity
    custom_description TEXT, -- Override description for entity
    display_order INTEGER DEFAULT 0,
    enabled_by INTEGER,
    enabled_date DATETIME,
    disabled_by INTEGER,
    disabled_date DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_name, service_code)
);

-- 4. Service Catalog Custom Services (Entity-specific services not in Global catalog)
CREATE TABLE IF NOT EXISTS service_catalog_custom_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_name VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Service Catalog History (Track changes)
CREATE TABLE IF NOT EXISTS service_catalog_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_name VARCHAR(100),
    service_code VARCHAR(50),
    action VARCHAR(50) NOT NULL CHECK (action IN ('enabled', 'disabled', 'created', 'updated', 'deleted')),
    old_value TEXT, -- JSON snapshot
    new_value TEXT, -- JSON snapshot
    changed_by INTEGER,
    change_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Service Catalog Imports (Track bulk imports)
CREATE TABLE IF NOT EXISTS service_catalog_imports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_name VARCHAR(100),
    import_type VARCHAR(50) CHECK (import_type IN ('excel', 'copy_from_entity', 'json')),
    source_file VARCHAR(500),
    services_imported INTEGER DEFAULT 0,
    services_failed INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    error_log TEXT,
    imported_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_entity_codes_code ON entity_codes(entity_code);
CREATE INDEX IF NOT EXISTS idx_entity_codes_active ON entity_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_service_catalog_global_code ON service_catalog_global(service_code);
CREATE INDEX IF NOT EXISTS idx_service_catalog_global_category ON service_catalog_global(category);
CREATE INDEX IF NOT EXISTS idx_service_catalog_entities_entity ON service_catalog_entities(entity_name);
CREATE INDEX IF NOT EXISTS idx_service_catalog_entities_code ON service_catalog_entities(service_code);
CREATE INDEX IF NOT EXISTS idx_service_catalog_entities_enabled ON service_catalog_entities(is_enabled);
CREATE INDEX IF NOT EXISTS idx_service_catalog_custom_entity ON service_catalog_custom_services(entity_name);
CREATE INDEX IF NOT EXISTS idx_service_catalog_history_entity ON service_catalog_history(entity_name);
CREATE INDEX IF NOT EXISTS idx_service_catalog_history_code ON service_catalog_history(service_code);
CREATE INDEX IF NOT EXISTS idx_service_catalog_imports_entity ON service_catalog_imports(entity_name);
