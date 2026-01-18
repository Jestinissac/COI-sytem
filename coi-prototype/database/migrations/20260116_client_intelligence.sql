-- Migration: Client Intelligence Module 2026-01-16
-- Adds tables for Business Development Intelligence module
-- This is an optional add-on module that can be enabled/disabled via feature flag

-- 1. Extend clients table with business cycle information
ALTER TABLE clients ADD COLUMN fiscal_year_end_date DATE;
ALTER TABLE clients ADD COLUMN quarter_end_dates TEXT; -- JSON array: ["Q1: 2026-03-31", "Q2: 2026-06-30", ...]
ALTER TABLE clients ADD COLUMN business_cycle_type VARCHAR(50); -- 'fiscal_year', 'calendar_year', 'custom'

-- 2. Extend service_catalog_global with timing information
ALTER TABLE service_catalog_global ADD COLUMN typical_timing VARCHAR(50); -- 'year_end', 'quarter_end', 'monthly', 'on_demand', 'seasonal'
ALTER TABLE service_catalog_global ADD COLUMN deadline_days INTEGER; -- Days before deadline when opportunity should be flagged
ALTER TABLE service_catalog_global ADD COLUMN seasonal_pattern TEXT; -- JSON: {months: [1,2,3], description: "Q1 tax season"}

-- 3. Client Milestones (client-specific important dates)
CREATE TABLE IF NOT EXISTS client_milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    milestone_type VARCHAR(50) NOT NULL, -- 'fiscal_year_end', 'quarter_end', 'annual_review', 'contract_renewal', 'custom'
    milestone_date DATE NOT NULL,
    description TEXT,
    is_recurring BOOLEAN DEFAULT 1,
    recurrence_pattern TEXT, -- JSON: {type: 'yearly', 'quarterly', 'monthly', offset_days: 0}
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_client_milestones_client ON client_milestones(client_id);
CREATE INDEX IF NOT EXISTS idx_client_milestones_date ON client_milestones(milestone_date);

-- 4. Trigger Signals (system-generated opportunity triggers)
CREATE TABLE IF NOT EXISTS trigger_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    trigger_type VARCHAR(50) NOT NULL, -- 'engagement_lifecycle', 'business_cycle', 'service_specific', 'client_milestone', 'relationship_based', 'service_gap'
    trigger_subtype VARCHAR(50), -- 'renewal_window', 'year_end', 'quarter_end', 'service_gap', etc.
    service_id INTEGER, -- Reference to service_catalog_global.id (optional)
    engagement_id INTEGER, -- Reference to coi_requests.id (optional)
    signal_date DATE NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'converted', 'dismissed', 'expired')),
    metadata TEXT, -- JSON: Additional context about the trigger
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME, -- When trigger becomes stale
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (service_id) REFERENCES service_catalog_global(id),
    FOREIGN KEY (engagement_id) REFERENCES coi_requests(id)
);

CREATE INDEX IF NOT EXISTS idx_trigger_signals_client ON trigger_signals(client_id);
CREATE INDEX IF NOT EXISTS idx_trigger_signals_date ON trigger_signals(signal_date);
CREATE INDEX IF NOT EXISTS idx_trigger_signals_status ON trigger_signals(status);
CREATE INDEX IF NOT EXISTS idx_trigger_signals_type ON trigger_signals(trigger_type);

-- 5. Client Intelligence Cache (pre-computed intelligence data)
CREATE TABLE IF NOT EXISTS client_intelligence_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    cache_type VARCHAR(50) NOT NULL, -- 'service_gap', 'relationship_intelligence', 'engagement_lifecycle', 'comprehensive'
    cache_data TEXT NOT NULL, -- JSON: Cached analysis results
    computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME, -- When cache should be refreshed
    version INTEGER DEFAULT 1,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_intelligence_cache_client ON client_intelligence_cache(client_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_cache_type ON client_intelligence_cache(cache_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_intelligence_cache_unique ON client_intelligence_cache(client_id, cache_type);

-- 6. Client Opportunities (identified business development opportunities)
CREATE TABLE IF NOT EXISTS client_opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    opportunity_type VARCHAR(50) NOT NULL, -- 'service_gap', 'relationship_opportunity', 'renewal', 'expansion', 'cross_sell'
    service_id INTEGER, -- Reference to service_catalog_global.id
    related_engagement_id INTEGER, -- Reference to coi_requests.id (if related to existing engagement)
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    conversion_probability DECIMAL(5,2) DEFAULT 50.0, -- AI/ML prediction: 0-100%
    suggested_contact_date DATE,
    status VARCHAR(50) DEFAULT 'identified' CHECK (status IN ('identified', 'contacted', 'proposal_sent', 'converted', 'lost', 'dismissed')),
    source_trigger_id INTEGER, -- Reference to trigger_signals.id
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    converted_at DATETIME, -- When opportunity converted to COI request
    converted_to_request_id INTEGER, -- Reference to coi_requests.id
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (service_id) REFERENCES service_catalog_global(id),
    FOREIGN KEY (related_engagement_id) REFERENCES coi_requests(id),
    FOREIGN KEY (source_trigger_id) REFERENCES trigger_signals(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (converted_to_request_id) REFERENCES coi_requests(id)
);

CREATE INDEX IF NOT EXISTS idx_opportunities_client ON client_opportunities(client_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON client_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_priority ON client_opportunities(priority);
CREATE INDEX IF NOT EXISTS idx_opportunities_date ON client_opportunities(suggested_contact_date);

-- 7. Client Interactions (tracking client outreach and communication)
CREATE TABLE IF NOT EXISTS client_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    opportunity_id INTEGER, -- Reference to client_opportunities.id (optional)
    interaction_type VARCHAR(50) NOT NULL, -- 'call', 'email', 'meeting', 'proposal', 'follow_up'
    interaction_date DATETIME NOT NULL,
    subject VARCHAR(255),
    notes TEXT,
    outcome VARCHAR(50), -- 'positive', 'neutral', 'negative', 'no_response', 'scheduled_followup'
    next_action VARCHAR(255), -- What should happen next
    next_action_date DATE, -- When next action should occur
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (opportunity_id) REFERENCES client_opportunities(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_interactions_client ON client_interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_interactions_opportunity ON client_interactions(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON client_interactions(interaction_date);
CREATE INDEX IF NOT EXISTS idx_interactions_next_action ON client_interactions(next_action_date);

-- 8. Opportunity Interactions (linking opportunities to interactions)
CREATE TABLE IF NOT EXISTS opportunity_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    opportunity_id INTEGER NOT NULL,
    interaction_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (opportunity_id) REFERENCES client_opportunities(id) ON DELETE CASCADE,
    FOREIGN KEY (interaction_id) REFERENCES client_interactions(id) ON DELETE CASCADE,
    UNIQUE(opportunity_id, interaction_id)
);

CREATE INDEX IF NOT EXISTS idx_opp_interactions_opp ON opportunity_interactions(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opp_interactions_int ON opportunity_interactions(interaction_id);

-- 9. Recommendation Engine Cache (AI/ML recommendation results)
CREATE TABLE IF NOT EXISTS recommendation_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, -- NULL = system-wide recommendations
    client_id INTEGER, -- NULL = all clients
    recommendation_type VARCHAR(50) NOT NULL, -- 'next_best_action', 'service_recommendation', 'timing_optimization'
    recommendation_data TEXT NOT NULL, -- JSON: Ranked recommendations with scores
    computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    model_version VARCHAR(50), -- Track which ML model version generated this
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_recommendation_user ON recommendation_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_client ON recommendation_cache(client_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_type ON recommendation_cache(recommendation_type);

-- 10. Learning Feedback (for ML model training)
CREATE TABLE IF NOT EXISTS learning_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recommendation_id INTEGER, -- Reference to recommendation_cache.id
    opportunity_id INTEGER, -- Reference to client_opportunities.id
    user_action VARCHAR(50) NOT NULL, -- 'accepted', 'rejected', 'modified', 'dismissed'
    actual_outcome VARCHAR(50), -- 'converted', 'lost', 'pending', 'no_action'
    feedback_score INTEGER, -- 1-5 rating of recommendation quality
    feedback_notes TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recommendation_id) REFERENCES recommendation_cache(id),
    FOREIGN KEY (opportunity_id) REFERENCES client_opportunities(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_learning_feedback_recommendation ON learning_feedback(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_learning_feedback_opportunity ON learning_feedback(opportunity_id);
