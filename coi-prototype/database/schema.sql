-- COI Prototype Database Schema

-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Requester', 'Director', 'Compliance', 'Partner', 'Finance', 'Admin', 'Super Admin')),
    department VARCHAR(50) NOT NULL CHECK (department IN ('Audit', 'Tax', 'Advisory', 'Accounting', 'Other')),
    line_of_service VARCHAR(100),
    director_id INTEGER,
    system_access TEXT, -- JSON array: ['HRMS', 'PRMS', 'COI']
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (director_id) REFERENCES users(id)
);

-- Clients table
CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_code VARCHAR(50) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    commercial_registration VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Potential')),
    industry VARCHAR(100),
    nature_of_business TEXT,
    parent_company_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_company_id) REFERENCES clients(id)
);

-- COI Requests table
CREATE TABLE coi_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER NOT NULL,
    requester_id INTEGER NOT NULL,
    department VARCHAR(50) NOT NULL,
    
    -- Requestor Information
    requestor_name VARCHAR(255),
    designation VARCHAR(50),
    entity VARCHAR(100),
    line_of_service VARCHAR(100),
    
    -- Document Information
    requested_document VARCHAR(50),
    language VARCHAR(50),
    
    -- Client Information
    parent_company VARCHAR(255),
    client_location VARCHAR(255),
    relationship_with_client VARCHAR(50),
    client_type VARCHAR(50),
    regulated_body VARCHAR(50),
    client_status VARCHAR(50),
    
    -- Service Information
    service_type VARCHAR(100),
    service_description TEXT NOT NULL,
    requested_service_period_start DATE,
    requested_service_period_end DATE,
    service_category VARCHAR(50),
    
    -- Ownership & Structure
    full_ownership_structure TEXT,
    pie_status VARCHAR(10),
    related_affiliated_entities TEXT,
    
    -- International Operations
    international_operations BOOLEAN DEFAULT 0,
    foreign_subsidiaries TEXT,
    global_clearance_status VARCHAR(50) DEFAULT 'Not Required',
    global_clearance_date DATETIME,
    global_clearance_verified_by INTEGER,
    
    -- Status and Workflow
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending Director Approval', 'Pending Compliance', 'Pending Partner', 'Pending Finance', 'Approved', 'Rejected', 'Lapsed', 'Active')),
    stage VARCHAR(50) DEFAULT 'Proposal' CHECK (stage IN ('Proposal', 'Engagement')),
    
    -- Director Approval
    director_approval_status VARCHAR(50) DEFAULT 'Pending' CHECK (director_approval_status IN ('Pending', 'Approved', 'Approved with Restrictions', 'Need More Info', 'Rejected')),
    director_approval_date DATETIME,
    director_approval_by INTEGER,
    director_approval_notes TEXT,
    director_restrictions TEXT, -- Details if approved with restrictions
    
    -- Compliance Review
    compliance_review_status VARCHAR(50) DEFAULT 'Pending' CHECK (compliance_review_status IN ('Pending', 'Approved', 'Approved with Restrictions', 'Need More Info', 'Rejected')),
    compliance_review_date DATETIME,
    compliance_reviewed_by INTEGER,
    compliance_review_notes TEXT,
    compliance_restrictions TEXT, -- Details if approved with restrictions
    duplication_matches TEXT, -- JSON array of matches
    
    -- Partner Approval
    partner_approval_status VARCHAR(50) DEFAULT 'Pending' CHECK (partner_approval_status IN ('Pending', 'Approved', 'Approved with Restrictions', 'Need More Info', 'Rejected')),
    partner_approval_date DATETIME,
    partner_approved_by INTEGER,
    partner_approval_notes TEXT,
    partner_restrictions TEXT, -- Details if approved with restrictions
    
    -- Finance Coding
    finance_code_status VARCHAR(50) DEFAULT 'Pending' CHECK (finance_code_status IN ('Pending', 'Generated')),
    financial_parameters TEXT, -- JSON: credit_terms, currency, risk_assessment
    engagement_code VARCHAR(50),
    
    -- Admin Execution
    execution_date DATETIME,
    proposal_sent_date DATETIME,
    client_response_date DATETIME,
    client_response_status VARCHAR(50),
    engagement_letter_issued_date DATETIME,
    isqm_forms_completed BOOLEAN DEFAULT 0,
    days_in_monitoring INTEGER DEFAULT 0,
    
    -- Dynamic Form Support
    custom_fields TEXT, -- JSON storage for dynamic/custom fields
    form_version INTEGER DEFAULT 1, -- Track which form version was used
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (director_approval_by) REFERENCES users(id),
    FOREIGN KEY (compliance_reviewed_by) REFERENCES users(id),
    FOREIGN KEY (partner_approved_by) REFERENCES users(id),
    FOREIGN KEY (global_clearance_verified_by) REFERENCES users(id)
);

-- Engagement Codes table
CREATE TABLE coi_engagement_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    engagement_code VARCHAR(50) UNIQUE NOT NULL,
    coi_request_id INTEGER NOT NULL,
    service_type VARCHAR(10),
    year INTEGER NOT NULL,
    sequential_number INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Expired')),
    generated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    generated_by INTEGER,
    FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id),
    FOREIGN KEY (generated_by) REFERENCES users(id)
);

-- Mock PRMS projects table (for validation)
CREATE TABLE prms_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id VARCHAR(50) UNIQUE,
    engagement_code VARCHAR(50) NOT NULL,
    client_code VARCHAR(50) NOT NULL,
    status VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (engagement_code) REFERENCES coi_engagement_codes(engagement_code)
);

-- Trigger to enforce Engagement Code must be Active (CRITICAL: Prevents bypass)
-- SQLite doesn't support CHECK constraints with subqueries, so we use a trigger
CREATE TRIGGER IF NOT EXISTS check_engagement_code_active
BEFORE INSERT ON prms_projects
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM coi_engagement_codes
            WHERE engagement_code = NEW.engagement_code
            AND status = 'Active'
        ) THEN
            RAISE(ABORT, 'Engagement Code must be Active to create PRMS project')
    END;
END;

-- Client Requests table (for new client requests)
CREATE TABLE client_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name VARCHAR(255) NOT NULL,
    commercial_registration VARCHAR(100),
    requested_by INTEGER NOT NULL,
    requested_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Rejected')),
    prms_admin_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requested_by) REFERENCES users(id)
);

-- Signatories table
CREATE TABLE coi_signatories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coi_request_id INTEGER NOT NULL,
    signatory_id INTEGER NOT NULL,
    position VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id),
    FOREIGN KEY (signatory_id) REFERENCES users(id)
);

-- Attachments table
CREATE TABLE coi_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coi_request_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_type VARCHAR(50),
    file_size INTEGER,
    uploaded_by INTEGER,
    attachment_type VARCHAR(50), -- 'justification', 'approval_document', 'isqm_form', 'global_clearance_excel'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Audit Logs table
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    details TEXT, -- JSON
    ip_address VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ISQM Forms table (Client Screening Questionnaire & New Client Acceptance)
CREATE TABLE isqm_forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coi_request_id INTEGER NOT NULL,
    form_type VARCHAR(50) NOT NULL CHECK (form_type IN ('Client Screening Questionnaire', 'New Client Acceptance Checklist')),
    
    -- Client Screening Questionnaire Fields
    client_background TEXT,
    management_integrity VARCHAR(50), -- 'High', 'Medium', 'Low', 'Unknown'
    financial_stability VARCHAR(50),
    litigation_history BOOLEAN DEFAULT 0,
    litigation_details TEXT,
    regulatory_issues BOOLEAN DEFAULT 0,
    regulatory_details TEXT,
    related_party_concerns BOOLEAN DEFAULT 0,
    related_party_details TEXT,
    politically_exposed BOOLEAN DEFAULT 0,
    pep_details TEXT,
    aml_risk_level VARCHAR(50), -- 'High', 'Medium', 'Low'
    
    -- New Client Acceptance Fields
    engagement_risk_assessment VARCHAR(50), -- 'High', 'Medium', 'Low'
    competence_assessment VARCHAR(50), -- 'Adequate', 'Requires Training', 'Inadequate'
    resource_availability BOOLEAN DEFAULT 0,
    independence_confirmed BOOLEAN DEFAULT 0,
    fee_arrangement_appropriate BOOLEAN DEFAULT 0,
    terms_of_engagement_clear BOOLEAN DEFAULT 0,
    
    -- Common Fields
    overall_assessment VARCHAR(50), -- 'Accept', 'Accept with Conditions', 'Decline'
    conditions_notes TEXT,
    completed_by INTEGER,
    completed_date DATETIME,
    reviewed_by INTEGER,
    reviewed_date DATETIME,
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Completed', 'Reviewed', 'Approved')),
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id),
    FOREIGN KEY (completed_by) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Global COI Portal Submissions (for international engagements)
CREATE TABLE global_coi_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coi_request_id INTEGER NOT NULL,
    submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Global Portal Required Fields
    member_firm VARCHAR(100),
    engagement_type VARCHAR(100),
    client_name VARCHAR(255),
    client_country VARCHAR(100),
    parent_entity_name VARCHAR(255),
    parent_entity_country VARCHAR(100),
    service_description TEXT,
    service_start_date DATE,
    service_end_date DATE,
    engagement_partner VARCHAR(255),
    estimated_fees DECIMAL(15, 2),
    fee_currency VARCHAR(10),
    
    -- Foreign Offices Involved
    foreign_offices_involved TEXT, -- JSON array
    
    -- Status
    submission_status VARCHAR(50) DEFAULT 'Pending' CHECK (submission_status IN ('Pending', 'Submitted', 'Approved', 'Rejected', 'More Info Required')),
    global_response_date DATETIME,
    global_reference_number VARCHAR(100),
    global_notes TEXT,
    
    -- Export tracking
    excel_exported BOOLEAN DEFAULT 0,
    excel_export_date DATETIME,
    exported_by INTEGER,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id),
    FOREIGN KEY (exported_by) REFERENCES users(id)
);

-- Engagement Renewals (3-year tracking)
CREATE TABLE engagement_renewals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coi_request_id INTEGER NOT NULL,
    engagement_code VARCHAR(50),
    original_start_date DATE NOT NULL,
    renewal_due_date DATE NOT NULL, -- 3 years from start
    
    -- Renewal Status
    renewal_status VARCHAR(50) DEFAULT 'Active' CHECK (renewal_status IN ('Active', 'Renewal Due', 'Renewed', 'Expired', 'Terminated')),
    
    -- Alerts
    alert_90_days_sent BOOLEAN DEFAULT 0,
    alert_60_days_sent BOOLEAN DEFAULT 0,
    alert_30_days_sent BOOLEAN DEFAULT 0,
    alert_expired_sent BOOLEAN DEFAULT 0,
    
    -- Renewal Details
    renewed_request_id INTEGER, -- Link to new COI request if renewed
    renewal_date DATETIME,
    renewed_by INTEGER,
    renewal_notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id),
    FOREIGN KEY (renewed_request_id) REFERENCES coi_requests(id),
    FOREIGN KEY (renewed_by) REFERENCES users(id)
);

-- Monitoring Alerts (10-day intervals)
CREATE TABLE monitoring_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coi_request_id INTEGER NOT NULL,
    alert_type VARCHAR(50) NOT NULL, -- '10_day', '20_day', '30_day', 'expired'
    alert_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_to TEXT, -- JSON array of email addresses
    sent_status VARCHAR(50) DEFAULT 'Pending' CHECK (sent_status IN ('Pending', 'Sent', 'Failed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id)
);

-- Execution Tracking (Admin workflow)
CREATE TABLE execution_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coi_request_id INTEGER NOT NULL,
    
    -- Proposal Execution
    proposal_prepared_date DATETIME,
    proposal_prepared_by INTEGER,
    proposal_sent_date DATETIME,
    proposal_sent_by INTEGER,
    proposal_sent_to VARCHAR(255),
    
    -- Client Response
    follow_up_1_date DATETIME,
    follow_up_2_date DATETIME,
    follow_up_3_date DATETIME,
    client_response_received DATETIME,
    client_response_type VARCHAR(50), -- 'Accepted', 'Rejected', 'Negotiating', 'No Response'
    
    -- Engagement Letter
    engagement_letter_prepared_date DATETIME,
    engagement_letter_prepared_by INTEGER,
    engagement_letter_sent_date DATETIME,
    engagement_letter_signed_date DATETIME,
    
    -- Countersigned Documents
    countersigned_proposal_received DATETIME,
    countersigned_engagement_received DATETIME,
    
    -- Admin Notes
    admin_notes TEXT,
    updated_by INTEGER,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id),
    FOREIGN KEY (proposal_prepared_by) REFERENCES users(id),
    FOREIGN KEY (proposal_sent_by) REFERENCES users(id),
    FOREIGN KEY (engagement_letter_prepared_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_coi_requests_requester ON coi_requests(requester_id);
CREATE INDEX idx_coi_requests_department ON coi_requests(department);
CREATE INDEX idx_coi_requests_status ON coi_requests(status);
CREATE INDEX idx_coi_requests_client ON coi_requests(client_id);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_director ON users(director_id);
CREATE INDEX idx_engagement_codes_status ON coi_engagement_codes(status);

-- LC/NC Configuration Tables

-- Form Fields Configuration
CREATE TABLE IF NOT EXISTS form_fields_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id VARCHAR(50) NOT NULL,
    field_id VARCHAR(100) UNIQUE NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- 'text', 'textarea', 'select', 'date', 'number'
    field_label VARCHAR(255) NOT NULL,
    field_placeholder VARCHAR(255),
    is_required BOOLEAN DEFAULT 0,
    is_readonly BOOLEAN DEFAULT 0,
    default_value TEXT,
    options TEXT, -- JSON array for select: ["Option1", "Option2"]
    validation_rules TEXT, -- JSON: {"min": 1, "max": 100, "pattern": "..."}
    conditions TEXT, -- JSON: {"field": "pie_status", "operator": "equals", "value": "Yes"}
    display_order INTEGER DEFAULT 0,
    source_system VARCHAR(50), -- 'HRMS', 'PRMS', 'COI', 'manual'
    source_field VARCHAR(100), -- e.g., 'user.name', 'client.client_name'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workflow Configuration
CREATE TABLE IF NOT EXISTS workflow_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_name VARCHAR(100) NOT NULL DEFAULT 'default',
    step_order INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_status VARCHAR(100) NOT NULL,
    required_role VARCHAR(50),
    is_required BOOLEAN DEFAULT 1,
    conditions TEXT, -- JSON: when to show this step
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workflow_name, step_order)
);

-- Business Rules Configuration
CREATE TABLE IF NOT EXISTS business_rules_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'validation', 'workflow', 'conflict'
    condition_field VARCHAR(100),
    condition_operator VARCHAR(50), -- 'equals', 'contains', 'greater_than'
    condition_value TEXT,
    action_type VARCHAR(50), -- 'block', 'flag', 'require_approval', 'set_status'
    action_value TEXT,
    is_active BOOLEAN DEFAULT 1,
    approval_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    created_by INTEGER NOT NULL,
    approved_by INTEGER,
    approved_at DATETIME,
    rejection_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Form Templates
CREATE TABLE IF NOT EXISTS form_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_name VARCHAR(255) UNIQUE NOT NULL,
    template_description TEXT,
    is_default BOOLEAN DEFAULT 0,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Form Template Fields (links fields to templates)
CREATE TABLE IF NOT EXISTS form_template_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    section_id VARCHAR(50) NOT NULL,
    field_id VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    field_label VARCHAR(255) NOT NULL,
    field_placeholder VARCHAR(255),
    is_required BOOLEAN DEFAULT 0,
    is_readonly BOOLEAN DEFAULT 0,
    default_value TEXT,
    options TEXT,
    validation_rules TEXT,
    conditions TEXT,
    display_order INTEGER DEFAULT 0,
    source_system VARCHAR(50),
    source_field VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES form_templates(id) ON DELETE CASCADE,
    UNIQUE(template_id, field_id)
);

-- Indexes for configuration tables
CREATE INDEX IF NOT EXISTS idx_form_fields_section ON form_fields_config(section_id);
CREATE INDEX IF NOT EXISTS idx_workflow_name ON workflow_config(workflow_name);
CREATE INDEX IF NOT EXISTS idx_rules_type ON business_rules_config(rule_type);
CREATE INDEX IF NOT EXISTS idx_template_name ON form_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_template_fields_template ON form_template_fields(template_id);

-- Form Field Mappings (maps field_id to database columns)
CREATE TABLE IF NOT EXISTS form_field_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_id VARCHAR(100) UNIQUE NOT NULL,
    db_column VARCHAR(100), -- NULL if custom field (stored in JSON)
    is_custom BOOLEAN DEFAULT 0, -- 1 = stored in custom_fields JSON, 0 = stored in db_column
    data_type VARCHAR(50) DEFAULT 'text', -- 'text', 'number', 'date', 'boolean', 'json'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Form Versions (track form configuration changes)
CREATE TABLE IF NOT EXISTS form_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version_number INTEGER UNIQUE NOT NULL,
    version_name VARCHAR(255),
    form_config_snapshot TEXT, -- JSON snapshot of form_fields_config at this version
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_field_mappings_field_id ON form_field_mappings(field_id);
CREATE INDEX IF NOT EXISTS idx_form_versions_number ON form_versions(version_number);

-- Enterprise Change Management Tables

-- Form configuration change history
CREATE TABLE IF NOT EXISTS form_config_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    change_type VARCHAR(50) NOT NULL, -- 'field_added', 'field_removed', 'field_modified', 'field_renamed'
    field_id VARCHAR(100),
    old_config TEXT, -- JSON snapshot of old configuration
    new_config TEXT, -- JSON snapshot of new configuration
    changed_by INTEGER NOT NULL,
    change_reason TEXT,
    requires_approval BOOLEAN DEFAULT 0,
    approval_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    approved_by INTEGER,
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (changed_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Field dependency tracking
CREATE TABLE IF NOT EXISTS field_dependencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_id VARCHAR(100) NOT NULL,
    depends_on_field_id VARCHAR(100), -- Field that this field depends on
    depends_on_workflow_step VARCHAR(100), -- Workflow step dependency
    depends_on_business_rule INTEGER, -- Business rule dependency
    dependency_type VARCHAR(50), -- 'conditional_display', 'validation', 'calculation'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (depends_on_business_rule) REFERENCES business_rules_config(id)
);

-- Impact analysis cache
CREATE TABLE IF NOT EXISTS field_impact_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_id VARCHAR(100) NOT NULL,
    affected_requests_count INTEGER DEFAULT 0,
    affected_templates_count INTEGER DEFAULT 0,
    affected_workflows_count INTEGER DEFAULT 0,
    affected_rules_count INTEGER DEFAULT 0,
    last_analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    analysis_snapshot TEXT -- JSON: detailed breakdown
);

-- Rules engine health monitoring
CREATE TABLE IF NOT EXISTS rules_engine_health (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    engine_version VARCHAR(50) NOT NULL DEFAULT '1.0',
    status VARCHAR(50) DEFAULT 'healthy', -- 'healthy', 'degraded', 'failed'
    last_check_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    error_count INTEGER DEFAULT 0,
    last_error TEXT
);

-- Emergency bypass log (when rules engine fails)
CREATE TABLE IF NOT EXISTS emergency_bypass_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    change_id INTEGER NOT NULL,
    bypassed_by INTEGER NOT NULL,
    bypass_reason TEXT NOT NULL,
    rules_engine_status TEXT, -- Why it failed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (change_id) REFERENCES form_config_changes(id),
    FOREIGN KEY (bypassed_by) REFERENCES users(id)
);

-- Indexes for change management
CREATE INDEX IF NOT EXISTS idx_config_changes_field ON form_config_changes(field_id);
CREATE INDEX IF NOT EXISTS idx_config_changes_status ON form_config_changes(approval_status);
CREATE INDEX IF NOT EXISTS idx_dependencies_field ON field_dependencies(field_id);
CREATE INDEX IF NOT EXISTS idx_impact_analysis_field ON field_impact_analysis(field_id);
CREATE INDEX IF NOT EXISTS idx_bypass_log_change ON emergency_bypass_log(change_id);

-- Rule Execution Logging
CREATE TABLE IF NOT EXISTS rule_execution_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_id INTEGER NOT NULL,
    coi_request_id INTEGER NOT NULL,
    condition_matched BOOLEAN,
    action_taken VARCHAR(50),
    execution_result TEXT,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rule_id) REFERENCES business_rules_config(id),
    FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id)
);

CREATE INDEX IF NOT EXISTS idx_rule_execution_request ON rule_execution_log(coi_request_id);
CREATE INDEX IF NOT EXISTS idx_rule_execution_rule ON rule_execution_log(rule_id);

CREATE INDEX idx_users_director ON users(director_id);
CREATE INDEX idx_engagement_codes_status ON coi_engagement_codes(status);

-- LC/NC Configuration Tables

-- Form Fields Configuration
CREATE TABLE IF NOT EXISTS form_fields_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id VARCHAR(50) NOT NULL,
    field_id VARCHAR(100) UNIQUE NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- 'text', 'textarea', 'select', 'date', 'number'
    field_label VARCHAR(255) NOT NULL,
    field_placeholder VARCHAR(255),
    is_required BOOLEAN DEFAULT 0,
    is_readonly BOOLEAN DEFAULT 0,
    default_value TEXT,
    options TEXT, -- JSON array for select: ["Option1", "Option2"]
    validation_rules TEXT, -- JSON: {"min": 1, "max": 100, "pattern": "..."}
    conditions TEXT, -- JSON: {"field": "pie_status", "operator": "equals", "value": "Yes"}
    display_order INTEGER DEFAULT 0,
    source_system VARCHAR(50), -- 'HRMS', 'PRMS', 'COI', 'manual'
    source_field VARCHAR(100), -- e.g., 'user.name', 'client.client_name'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workflow Configuration
CREATE TABLE IF NOT EXISTS workflow_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_name VARCHAR(100) NOT NULL DEFAULT 'default',
    step_order INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_status VARCHAR(100) NOT NULL,
    required_role VARCHAR(50),
    is_required BOOLEAN DEFAULT 1,
    conditions TEXT, -- JSON: when to show this step
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workflow_name, step_order)
);

-- Business Rules Configuration
CREATE TABLE IF NOT EXISTS business_rules_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'validation', 'workflow', 'conflict'
    condition_field VARCHAR(100),
    condition_operator VARCHAR(50), -- 'equals', 'contains', 'greater_than'
    condition_value TEXT,
    action_type VARCHAR(50), -- 'block', 'flag', 'require_approval', 'set_status'
    action_value TEXT,
    is_active BOOLEAN DEFAULT 1,
    approval_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    created_by INTEGER NOT NULL,
    approved_by INTEGER,
    approved_at DATETIME,
    rejection_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Form Templates
CREATE TABLE IF NOT EXISTS form_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_name VARCHAR(255) UNIQUE NOT NULL,
    template_description TEXT,
    is_default BOOLEAN DEFAULT 0,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Form Template Fields (links fields to templates)
CREATE TABLE IF NOT EXISTS form_template_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    section_id VARCHAR(50) NOT NULL,
    field_id VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    field_label VARCHAR(255) NOT NULL,
    field_placeholder VARCHAR(255),
    is_required BOOLEAN DEFAULT 0,
    is_readonly BOOLEAN DEFAULT 0,
    default_value TEXT,
    options TEXT,
    validation_rules TEXT,
    conditions TEXT,
    display_order INTEGER DEFAULT 0,
    source_system VARCHAR(50),
    source_field VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES form_templates(id) ON DELETE CASCADE,
    UNIQUE(template_id, field_id)
);

-- Indexes for configuration tables
CREATE INDEX IF NOT EXISTS idx_form_fields_section ON form_fields_config(section_id);
CREATE INDEX IF NOT EXISTS idx_workflow_name ON workflow_config(workflow_name);
CREATE INDEX IF NOT EXISTS idx_rules_type ON business_rules_config(rule_type);
CREATE INDEX IF NOT EXISTS idx_template_name ON form_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_template_fields_template ON form_template_fields(template_id);

-- Form Field Mappings (maps field_id to database columns)
CREATE TABLE IF NOT EXISTS form_field_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_id VARCHAR(100) UNIQUE NOT NULL,
    db_column VARCHAR(100), -- NULL if custom field (stored in JSON)
    is_custom BOOLEAN DEFAULT 0, -- 1 = stored in custom_fields JSON, 0 = stored in db_column
    data_type VARCHAR(50) DEFAULT 'text', -- 'text', 'number', 'date', 'boolean', 'json'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Form Versions (track form configuration changes)
CREATE TABLE IF NOT EXISTS form_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version_number INTEGER UNIQUE NOT NULL,
    version_name VARCHAR(255),
    form_config_snapshot TEXT, -- JSON snapshot of form_fields_config at this version
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_field_mappings_field_id ON form_field_mappings(field_id);
CREATE INDEX IF NOT EXISTS idx_form_versions_number ON form_versions(version_number);

-- Enterprise Change Management Tables

-- Form configuration change history
CREATE TABLE IF NOT EXISTS form_config_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    change_type VARCHAR(50) NOT NULL, -- 'field_added', 'field_removed', 'field_modified', 'field_renamed'
    field_id VARCHAR(100),
    old_config TEXT, -- JSON snapshot of old configuration
    new_config TEXT, -- JSON snapshot of new configuration
    changed_by INTEGER NOT NULL,
    change_reason TEXT,
    requires_approval BOOLEAN DEFAULT 0,
    approval_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    approved_by INTEGER,
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (changed_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Field dependency tracking
CREATE TABLE IF NOT EXISTS field_dependencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_id VARCHAR(100) NOT NULL,
    depends_on_field_id VARCHAR(100), -- Field that this field depends on
    depends_on_workflow_step VARCHAR(100), -- Workflow step dependency
    depends_on_business_rule INTEGER, -- Business rule dependency
    dependency_type VARCHAR(50), -- 'conditional_display', 'validation', 'calculation'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (depends_on_business_rule) REFERENCES business_rules_config(id)
);

-- Impact analysis cache
CREATE TABLE IF NOT EXISTS field_impact_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_id VARCHAR(100) NOT NULL,
    affected_requests_count INTEGER DEFAULT 0,
    affected_templates_count INTEGER DEFAULT 0,
    affected_workflows_count INTEGER DEFAULT 0,
    affected_rules_count INTEGER DEFAULT 0,
    last_analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    analysis_snapshot TEXT -- JSON: detailed breakdown
);

-- Rules engine health monitoring
CREATE TABLE IF NOT EXISTS rules_engine_health (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    engine_version VARCHAR(50) NOT NULL DEFAULT '1.0',
    status VARCHAR(50) DEFAULT 'healthy', -- 'healthy', 'degraded', 'failed'
    last_check_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    error_count INTEGER DEFAULT 0,
    last_error TEXT
);

-- Emergency bypass log (when rules engine fails)
CREATE TABLE IF NOT EXISTS emergency_bypass_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    change_id INTEGER NOT NULL,
    bypassed_by INTEGER NOT NULL,
    bypass_reason TEXT NOT NULL,
    rules_engine_status TEXT, -- Why it failed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (change_id) REFERENCES form_config_changes(id),
    FOREIGN KEY (bypassed_by) REFERENCES users(id)
);

-- Indexes for change management
CREATE INDEX IF NOT EXISTS idx_config_changes_field ON form_config_changes(field_id);
CREATE INDEX IF NOT EXISTS idx_config_changes_status ON form_config_changes(approval_status);
CREATE INDEX IF NOT EXISTS idx_dependencies_field ON field_dependencies(field_id);
CREATE INDEX IF NOT EXISTS idx_impact_analysis_field ON field_impact_analysis(field_id);
CREATE INDEX IF NOT EXISTS idx_bypass_log_change ON emergency_bypass_log(change_id);

