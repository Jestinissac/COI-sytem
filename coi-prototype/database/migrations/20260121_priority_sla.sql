-- =====================================================
-- Priority Scoring & SLA Configuration Migration
-- Date: 2026-01-21
-- Description: Creates tables for priority scoring engine,
--              SLA configuration, and ML pipeline support
-- =====================================================

-- =====================================================
-- PRIORITY SCORING TABLES
-- =====================================================

-- Priority factor configuration
-- Stores weights and value mappings for each priority factor
CREATE TABLE IF NOT EXISTS priority_config (
    factor_id VARCHAR(50) PRIMARY KEY,
    factor_name VARCHAR(100) NOT NULL,
    weight DECIMAL(3,1) DEFAULT 1.0,
    value_mappings TEXT NOT NULL,  -- JSON: {"value": score}
    is_active BOOLEAN DEFAULT 1,
    updated_by INTEGER REFERENCES users(id),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit trail for priority config changes
CREATE TABLE IF NOT EXISTS priority_audit (
    audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
    factor_id VARCHAR(50) NOT NULL,
    field_changed VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by INTEGER REFERENCES users(id),
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(255)
);

-- =====================================================
-- SLA CONFIGURATION TABLES
-- =====================================================

-- SLA targets per workflow stage
CREATE TABLE IF NOT EXISTS sla_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_stage VARCHAR(100) NOT NULL,
    target_hours INTEGER NOT NULL,
    warning_threshold_percent INTEGER DEFAULT 75,
    critical_threshold_percent INTEGER DEFAULT 90,
    applies_to_service_type VARCHAR(100),  -- NULL = all service types
    applies_to_pie BOOLEAN,                 -- NULL = all, 1 = PIE only, 0 = non-PIE only
    is_active BOOLEAN DEFAULT 1,
    updated_by INTEGER REFERENCES users(id),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workflow_stage, applies_to_service_type, applies_to_pie)
);

-- Business calendar (synced from HRMS in production)
CREATE TABLE IF NOT EXISTS business_calendar (
    date DATE PRIMARY KEY,
    is_working_day BOOLEAN DEFAULT 1,
    holiday_name VARCHAR(100),
    working_hours_start TIME DEFAULT '09:00',
    working_hours_end TIME DEFAULT '18:00',
    synced_from_hrms BOOLEAN DEFAULT 0,
    synced_at DATETIME
);

-- SLA breach history (for reporting and escalation)
CREATE TABLE IF NOT EXISTS sla_breach_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coi_request_id INTEGER NOT NULL REFERENCES coi_requests(id),
    workflow_stage VARCHAR(100) NOT NULL,
    breach_type VARCHAR(20) NOT NULL,  -- 'WARNING', 'CRITICAL', 'BREACHED'
    target_hours INTEGER NOT NULL,
    actual_hours DECIMAL(10,2) NOT NULL,
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    notified_users TEXT  -- JSON array of user IDs notified
);

-- =====================================================
-- ML PIPELINE TABLES (Future Use)
-- =====================================================

-- Store trained ML models
CREATE TABLE IF NOT EXISTS ml_weights (
    model_id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_type VARCHAR(50) NOT NULL,        -- 'priority_weights'
    model_path VARCHAR(255),                 -- Path to saved model file
    weights TEXT NOT NULL,                   -- JSON: Learned coefficients
    accuracy DECIMAL(5,4),                   -- Test set accuracy
    training_records INTEGER,                -- Number of records used
    trained_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 0,             -- Only one active per type
    activated_by INTEGER REFERENCES users(id),
    activated_at DATETIME,
    notes TEXT
);

-- Store predictions for monitoring
CREATE TABLE IF NOT EXISTS ml_predictions (
    prediction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id VARCHAR(50) NOT NULL,
    predicted_score INTEGER,
    predicted_level VARCHAR(20),
    prediction_method VARCHAR(10),           -- 'ML' or 'RULES'
    model_id INTEGER REFERENCES ml_weights(model_id),
    features_snapshot TEXT,                  -- JSON: Features at time of prediction
    predicted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    actual_outcome VARCHAR(20),              -- 'GOOD' or 'BAD'
    outcome_recorded_at DATETIME
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_priority_audit_factor ON priority_audit(factor_id);
CREATE INDEX IF NOT EXISTS idx_priority_audit_date ON priority_audit(changed_at);
CREATE INDEX IF NOT EXISTS idx_sla_config_stage ON sla_config(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_sla_breach_request ON sla_breach_log(coi_request_id);
CREATE INDEX IF NOT EXISTS idx_sla_breach_type ON sla_breach_log(breach_type);
CREATE INDEX IF NOT EXISTS idx_business_calendar_working ON business_calendar(is_working_day);
CREATE INDEX IF NOT EXISTS idx_ml_weights_active ON ml_weights(model_type, is_active);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_request ON ml_predictions(request_id);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_outcome ON ml_predictions(actual_outcome, predicted_at);
