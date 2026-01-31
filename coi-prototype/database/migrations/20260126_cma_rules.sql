-- =====================================================
-- CMA Conflict Matrix Migration
-- Date: 2026-01-26
-- Description: Creates tables for CMA (Capital Markets Authority) 
--              service types and combination rules
--              Based on Law No. (7) of 2010, Kuwait
-- =====================================================

-- =====================================================
-- CMA SERVICE TYPES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS cma_service_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_code VARCHAR(50) NOT NULL UNIQUE,
    service_name_en TEXT NOT NULL,
    service_name_ar TEXT,
    legal_reference TEXT,
    module_reference TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CMA CONDITION CODES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS cma_condition_codes (
    code VARCHAR(50) PRIMARY KEY,
    description TEXT NOT NULL,
    requires_manual_review BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CMA COMBINATION RULES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS cma_combination_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_a_code VARCHAR(50) NOT NULL,
    service_b_code VARCHAR(50) NOT NULL,
    allowed BOOLEAN NOT NULL,
    condition_code VARCHAR(50),
    severity_level VARCHAR(20) DEFAULT 'BLOCKED',
    legal_reference TEXT,
    reason_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_a_code, service_b_code),
    FOREIGN KEY (service_a_code) REFERENCES cma_service_types(service_code),
    FOREIGN KEY (service_b_code) REFERENCES cma_service_types(service_code),
    FOREIGN KEY (condition_code) REFERENCES cma_condition_codes(code)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_cma_rules_service_a ON cma_combination_rules(service_a_code);
CREATE INDEX IF NOT EXISTS idx_cma_rules_service_b ON cma_combination_rules(service_b_code);
CREATE INDEX IF NOT EXISTS idx_cma_rules_allowed ON cma_combination_rules(allowed);
CREATE INDEX IF NOT EXISTS idx_cma_rules_condition ON cma_combination_rules(condition_code);

-- =====================================================
-- CLIENT CMA REGULATION FLAG
-- =====================================================

-- Add is_cma_regulated flag to clients table if it doesn't exist
-- Note: We can also use existing regulated_body field with LIKE '%CMA%'
-- This migration adds explicit flag for clarity

-- Check if column exists before adding (SQLite doesn't support IF NOT EXISTS for ALTER TABLE)
-- This will be handled in init.js with try-catch
