-- Lead Attribution and Funnel Tracking Migration
-- Date: 2026-01-20
-- Purpose: Add CRM features for prospect tracking, lead source attribution, and conversion funnel

-- ============================================
-- PART 1: Lead Sources Reference Table
-- ============================================

CREATE TABLE IF NOT EXISTS lead_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_code VARCHAR(50) UNIQUE NOT NULL,
    source_name VARCHAR(100) NOT NULL,
    source_category VARCHAR(50), -- 'referral', 'system', 'outbound', 'other'
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed lead sources (includes 'unknown' for existing data migration)
INSERT OR IGNORE INTO lead_sources (source_code, source_name, source_category) VALUES
    ('unknown', 'Unknown / Legacy', 'other'),
    ('internal_referral', 'Internal Referral (Partner/Director)', 'referral'),
    ('client_referral', 'Client Referral', 'referral'),
    ('insights_module', 'Client Intelligence Module', 'system'),
    ('cold_outreach', 'Cold Outreach', 'outbound'),
    ('direct_creation', 'Direct Client Creation', 'other'),
    ('marketing', 'Marketing Campaign', 'outbound'),
    ('event', 'Event / Conference', 'outbound');

-- ============================================
-- PART 2: Prospect Funnel Events Table
-- ============================================

CREATE TABLE IF NOT EXISTS prospect_funnel_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prospect_id INTEGER,
    coi_request_id INTEGER,
    
    -- Stage info
    from_stage VARCHAR(50),
    to_stage VARCHAR(50) NOT NULL,
    
    -- Attribution
    performed_by_user_id INTEGER,
    performed_by_role VARCHAR(50),
    
    -- Timing
    event_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    days_in_previous_stage INTEGER,
    
    -- Context
    notes TEXT,
    metadata TEXT, -- JSON for additional context
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (prospect_id) REFERENCES prospects(id),
    FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id),
    FOREIGN KEY (performed_by_user_id) REFERENCES users(id)
);

-- Indexes for funnel events
CREATE INDEX IF NOT EXISTS idx_funnel_prospect ON prospect_funnel_events(prospect_id);
CREATE INDEX IF NOT EXISTS idx_funnel_coi_request ON prospect_funnel_events(coi_request_id);
CREATE INDEX IF NOT EXISTS idx_funnel_stage ON prospect_funnel_events(to_stage);
CREATE INDEX IF NOT EXISTS idx_funnel_user ON prospect_funnel_events(performed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_funnel_timestamp ON prospect_funnel_events(event_timestamp);

-- ============================================
-- PART 3: Extend Prospects Table
-- ============================================

-- Add lead source and attribution columns to prospects table
-- Note: ALTER TABLE ADD COLUMN IF NOT EXISTS is not supported in SQLite
-- These will be added via init.js with error handling

-- ============================================
-- PART 4: Extend COI Requests Table  
-- ============================================

-- Add lead_source_id to coi_requests for direct proposal tracking
-- This allows tracking lead source at the COI request level for proposals

-- ============================================
-- PART 5: Funnel Stage Reference (Documentation)
-- ============================================

-- Funnel stages tracked:
-- lead_created        - Prospect record created
-- proposal_submitted  - COI request submitted with is_prospect=1
-- pending_director    - Awaiting director approval
-- pending_compliance  - Awaiting compliance review
-- pending_partner     - Awaiting partner approval
-- approved            - Proposal approved
-- engagement_started  - Converted to engagement
-- client_created      - PRMS client created
-- lost                - Rejected or abandoned
