-- Migration: Meeting Changes 2026-01-12
-- Adds prospects table, service type sub-categories, and additional rejection options

-- 1. Prospects table (separate from clients)
CREATE TABLE IF NOT EXISTS prospects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prospect_name VARCHAR(255) NOT NULL,
    commercial_registration VARCHAR(100),
    industry VARCHAR(100),
    nature_of_business TEXT,
    
    -- Link to existing client if prospect becomes client
    client_id INTEGER,
    
    -- Group level services tracking
    group_level_services TEXT, -- JSON array of service types
    
    -- PRMS integration
    prms_client_code VARCHAR(50), -- If client exists in PRMS
    prms_synced BOOLEAN DEFAULT 0,
    prms_sync_date DATETIME,
    
    -- Status
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Converted', 'Inactive')),
    converted_to_client_id INTEGER,
    converted_date DATETIME,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (converted_to_client_id) REFERENCES clients(id)
);

-- Indexes for prospects
CREATE INDEX IF NOT EXISTS idx_prospects_client ON prospects(client_id);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_prms_code ON prospects(prms_client_code);

-- 2. Service type sub-categories table
CREATE TABLE IF NOT EXISTS service_type_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_service_type VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_service_type, sub_category)
);

-- Insert Business/Asset Valuation sub-categories
INSERT OR IGNORE INTO service_type_categories (parent_service_type, sub_category, display_order) VALUES
('Business Valuation', 'Acquisition', 1),
('Business Valuation', 'Capital Increase', 2),
('Business Valuation', 'Financial Facilities', 3),
('Asset Valuation', 'Acquisition', 1),
('Asset Valuation', 'Capital Increase', 2),
('Asset Valuation', 'Financial Facilities', 3);

-- 3. Add service_sub_category column to coi_requests
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so this will be handled in init.js

-- 4. Add additional rejection reason types
-- Add rejection_category column to coi_requests
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so this will be handled in init.js

-- 5. Add proposal_to_engagement_conversion tracking
CREATE TABLE IF NOT EXISTS proposal_engagement_conversions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_proposal_request_id INTEGER NOT NULL,
    new_engagement_request_id INTEGER,
    conversion_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    converted_by INTEGER,
    conversion_reason TEXT,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Failed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (original_proposal_request_id) REFERENCES coi_requests(id),
    FOREIGN KEY (new_engagement_request_id) REFERENCES coi_requests(id),
    FOREIGN KEY (converted_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_conversions_original ON proposal_engagement_conversions(original_proposal_request_id);
CREATE INDEX IF NOT EXISTS idx_conversions_new ON proposal_engagement_conversions(new_engagement_request_id);

-- 6. Add compliance visibility tracking (for requirement 7)
-- Add column to track if service details are visible to compliance
-- Note: This will be handled via data segregation middleware, but we add a flag for explicit control
-- Add compliance_visible flag to coi_requests
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so this will be handled in init.js
