import Database from 'better-sqlite3'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { getDatabaseName, validateEnvironment } from '../config/environment.js'
import { seedCMAServiceTypes } from '../scripts/seedCMAServiceTypes.js'
import { seedCMARules } from '../scripts/seedCMARules.js'
import { seedIESBARules } from '../scripts/seedIESBARules.js'
import { seedCMABusinessRules } from '../scripts/seedCMABusinessRules.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let db = null

/**
 * Get database path based on environment
 * @returns {string} Full path to database file
 */
function getDatabasePath() {
  // Validate environment first
  validateEnvironment()
  
  const basePath = join(__dirname, '../../../database')
  const dbName = getDatabaseName()
  return join(basePath, dbName)
}

export function getDatabase() {
  if (!db) {
    const dbPath = getDatabasePath()
    db = new Database(dbPath)
    db.pragma('foreign_keys = ON')
  }
  return db
}

export async function initDatabase() {
  const db = getDatabase()
  
  // Read and execute schema
  const schemaPath = join(__dirname, '../../../database/schema.sql')
  const schema = readFileSync(schemaPath, 'utf-8')
  
  // Split by semicolons and execute each statement
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  statements.forEach(statement => {
    try {
      db.exec(statement)
    } catch (error) {
      // Ignore errors for existing tables/indexes/triggers
      if (!error.message.includes('already exists')) {
        console.error('Schema error:', error.message)
      }
    }
  })
  
  // Add active column to users table if it doesn't exist
  try {
    db.exec('ALTER TABLE users ADD COLUMN active INTEGER DEFAULT 1')
  } catch (error) {
    // Column already exists, ignore
    if (!error.message.includes('duplicate column')) {
      console.log('Users table active column check:', error.message)
    }
  }

  // Add stale request handling columns to coi_requests
  const staleColumns = [
    { name: 'requires_re_evaluation', def: 'BOOLEAN DEFAULT 0' },
    { name: 'stale_reason', def: 'TEXT' },
    { name: 'compliance_checks', def: 'TEXT' },
    { name: 'last_rule_check_at', def: 'DATETIME' }
  ]
  
  for (const col of staleColumns) {
    try {
      db.exec(`ALTER TABLE coi_requests ADD COLUMN ${col.name} ${col.def}`)
      console.log(`✅ Added column ${col.name} to coi_requests`)
    } catch (error) {
      if (!error.message.includes('duplicate column')) {
        // Column already exists, that's fine
      }
    }
  }

  // Ensure restrictions columns exist for approval workflows
  const restrictionsColumns = [
    { name: 'director_restrictions', def: 'TEXT' },
    { name: 'compliance_restrictions', def: 'TEXT' },
    { name: 'partner_restrictions', def: 'TEXT' }
  ]
  
  for (const col of restrictionsColumns) {
    try {
      db.exec(`ALTER TABLE coi_requests ADD COLUMN ${col.name} ${col.def}`)
      console.log(`✅ Added column ${col.name} to coi_requests`)
    } catch (error) {
      if (!error.message.includes('duplicate column')) {
        // Column already exists, that's fine
      }
    }
  }

  // Ensure dynamic form support columns exist
  const dynamicFormColumns = [
    { name: 'custom_fields', def: 'TEXT' },
    { name: 'form_version', def: 'INTEGER DEFAULT 1' }
  ]
  
  for (const col of dynamicFormColumns) {
    try {
      db.exec(`ALTER TABLE coi_requests ADD COLUMN ${col.name} ${col.def}`)
      console.log(`✅ Added column ${col.name} to coi_requests`)
    } catch (error) {
      if (!error.message.includes('duplicate column')) {
        // Column already exists, that's fine
      }
    }
  }

  // Meeting Changes 2026-01-12: Add new columns for service sub-categories, rejection options, and compliance visibility
  const meetingChangesColumns = [
    { name: 'service_sub_category', def: 'VARCHAR(100)' },
    { name: 'rejection_category', def: 'VARCHAR(50)' }, // For additional rejection options
    { name: 'compliance_visible', def: 'BOOLEAN DEFAULT 1' }, // For requirement 7: compliance visibility
    { name: 'is_prospect', def: 'BOOLEAN DEFAULT 0' }, // Track if request is for a prospect
    { name: 'prospect_id', def: 'INTEGER' }, // Link to prospects table
    { name: 'prms_client_id', def: 'VARCHAR(50)' }, // Link to PRMS client if exists (for prospect linking)
    { name: 'prospect_converted_at', def: 'DATETIME' } // When prospect was converted to full client
  ]
  
  for (const col of meetingChangesColumns) {
    try {
      db.exec(`ALTER TABLE coi_requests ADD COLUMN ${col.name} ${col.def}`)
      console.log(`✅ Added column ${col.name} to coi_requests`)
    } catch (error) {
      if (!error.message.includes('duplicate column')) {
        // Column already exists, that's fine
      }
    }
  }

  // Create prospects table if it doesn't exist
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS prospects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prospect_name VARCHAR(255) NOT NULL,
        commercial_registration VARCHAR(100),
        industry VARCHAR(100),
        nature_of_business TEXT,
        client_id INTEGER,
        group_level_services TEXT,
        prms_client_code VARCHAR(50),
        prms_synced BOOLEAN DEFAULT 0,
        prms_sync_date DATETIME,
        status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Converted', 'Inactive')),
        converted_to_client_id INTEGER,
        converted_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (converted_to_client_id) REFERENCES clients(id)
      )
    `)
    console.log('✅ Created prospects table')
    
    // Create indexes
    db.exec('CREATE INDEX IF NOT EXISTS idx_prospects_client ON prospects(client_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_prospects_prms_code ON prospects(prms_client_code)')
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error('Error creating prospects table:', error.message)
    }
  }

  // Create service_type_categories table
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS service_type_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parent_service_type VARCHAR(100) NOT NULL,
        sub_category VARCHAR(100) NOT NULL,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(parent_service_type, sub_category)
      )
    `)
    console.log('✅ Created service_type_categories table')
    
    // Insert Business/Asset Valuation sub-categories
    const subCategories = [
      ['Business Valuation', 'Acquisition', 1],
      ['Business Valuation', 'Capital Increase', 2],
      ['Business Valuation', 'Financial Facilities', 3],
      ['Asset Valuation', 'Acquisition', 1],
      ['Asset Valuation', 'Capital Increase', 2],
      ['Asset Valuation', 'Financial Facilities', 3]
    ]
    
    for (const [parent, sub, order] of subCategories) {
      try {
        db.exec(`
          INSERT OR IGNORE INTO service_type_categories (parent_service_type, sub_category, display_order)
          VALUES ('${parent}', '${sub}', ${order})
        `)
      } catch (error) {
        // Ignore duplicate errors
      }
    }
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error('Error creating service_type_categories table:', error.message)
    }
  }

  // Create proposal_engagement_conversions table
  try {
    db.exec(`
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
      )
    `)
    console.log('✅ Created proposal_engagement_conversions table')
    
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversions_original ON proposal_engagement_conversions(original_proposal_request_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_conversions_new ON proposal_engagement_conversions(new_engagement_request_id)')
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error('Error creating proposal_engagement_conversions table:', error.message)
    }
  }

  // Create prospect_client_creation_requests table
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS prospect_client_creation_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prospect_id INTEGER NOT NULL,
        coi_request_id INTEGER NOT NULL,
        requester_id INTEGER NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        legal_form VARCHAR(100),
        industry VARCHAR(100),
        regulatory_body VARCHAR(100),
        parent_company VARCHAR(255),
        contact_details TEXT,
        physical_address TEXT,
        billing_address TEXT,
        description TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        submitted_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewed_by INTEGER,
        reviewed_date DATETIME,
        completion_notes TEXT,
        created_client_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (prospect_id) REFERENCES prospects(id),
        FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id),
        FOREIGN KEY (requester_id) REFERENCES users(id),
        FOREIGN KEY (reviewed_by) REFERENCES users(id),
        FOREIGN KEY (created_client_id) REFERENCES clients(id)
      )
    `)
    console.log('✅ prospect_client_creation_requests table ensured')
    
    db.exec('CREATE INDEX IF NOT EXISTS idx_client_creation_prospect ON prospect_client_creation_requests(prospect_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_client_creation_coi ON prospect_client_creation_requests(coi_request_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_client_creation_status ON prospect_client_creation_requests(status)')
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error('Error creating prospect_client_creation_requests table:', error.message)
    }
  }

  // Fix Schema Issues Migration 2026-01-19
  // Add missing columns that are causing runtime errors
  const schemaFixColumns = [
    { table: 'coi_requests', name: 'monitoring_days_elapsed', def: 'INTEGER DEFAULT 0' },
    { table: 'coi_requests', name: 'interval_alerts_sent', def: 'TEXT' },
    { table: 'coi_requests', name: 'renewal_notification_sent', def: 'TEXT' },
    { table: 'coi_requests', name: 'expiry_notification_sent', def: 'TEXT' },
    { table: 'coi_requests', name: 'compliance_reminder_sent', def: 'DATETIME' },
    { table: 'coi_requests', name: 'stale_notification_sent', def: 'DATETIME' },
    { table: 'prospects', name: 'prospect_code', def: 'VARCHAR(50)' }
  ]
  
  for (const col of schemaFixColumns) {
    try {
      db.exec(`ALTER TABLE ${col.table} ADD COLUMN ${col.name} ${col.def}`)
      console.log(`✅ Added column ${col.name} to ${col.table}`)
    } catch (error) {
      if (!error.message.includes('duplicate column')) {
        // Column already exists, that's fine
      }
    }
  }
  
  // Generate prospect codes for existing prospects without codes
  try {
    db.exec(`
      UPDATE prospects 
      SET prospect_code = 'PROS-' || strftime('%Y', created_at) || '-' || printf('%04d', id)
      WHERE prospect_code IS NULL
    `)
  } catch (error) {
    // Ignore errors
  }
  
  // Create index for prospect_code
  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_prospects_code ON prospects(prospect_code)')
  } catch (error) {
    // Ignore errors
  }

  // Service Catalog System Migration 2026-01-13
  // Create tables without foreign key constraints (FKs can be added later if needed)
  try {
    const migrationPath = join(__dirname, '../../../database/migrations/20260113_service_catalog.sql')
    const migration = readFileSync(migrationPath, 'utf-8')
    
    // Split by semicolons and execute each statement
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    let successCount = 0
    let errorCount = 0
    
    statements.forEach(statement => {
      try {
        db.exec(statement)
        successCount++
      } catch (error) {
        // Ignore errors for existing tables/indexes
        if (error.message.includes('already exists')) {
          successCount++
        } else {
          errorCount++
          // Only log unexpected errors
          if (!error.message.includes('no such table') || error.message.includes('main.entity_codes')) {
            // This is expected if table doesn't exist yet - the CREATE TABLE should create it
            // But if we get "no such table: main.entity_codes" on CREATE TABLE, that's a real error
            if (!statement.toUpperCase().includes('CREATE TABLE')) {
              console.error('Service catalog migration error:', error.message.substring(0, 100))
            }
          }
        }
      }
    })
    
    if (successCount > 0) {
      console.log(`✅ Service catalog tables initialized (${successCount} statements succeeded)`)
    } else if (errorCount > 0) {
      console.log(`⚠️  Service catalog migration: ${successCount} succeeded, ${errorCount} failed`)
    }
  } catch (error) {
    if (!error.message.includes('ENOENT')) {
      console.log('Service catalog migration:', error.message)
    }
  }

  // Initialize system_config table if it doesn't exist
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS system_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        config_key VARCHAR(100) UNIQUE NOT NULL,
        config_value TEXT NOT NULL,
        description TEXT,
        updated_by INTEGER,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES users(id)
      )
    `)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key)`)
    
    // Insert default edition if not exists
    const existing = db.prepare('SELECT id FROM system_config WHERE config_key = ?').get('system_edition')
    if (!existing) {
      db.prepare(`
        INSERT INTO system_config (config_key, config_value, description)
        VALUES (?, ?, ?)
      `).run('system_edition', 'standard', 'Current system edition: standard or pro')
    }
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log('System config table initialization:', error.message)
    }
  }

  // Ensure form_fields_config table exists
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS form_fields_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section_id VARCHAR(50) NOT NULL,
        field_id VARCHAR(100) UNIQUE NOT NULL,
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
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log('Form fields config table creation:', error.message)
    }
  }

  // Ensure form_templates and form_template_fields tables exist
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS form_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_name VARCHAR(255) UNIQUE NOT NULL,
        template_description TEXT,
        is_default BOOLEAN DEFAULT 0,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `)
    db.exec(`
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
        FOREIGN KEY (template_id) REFERENCES form_templates(id) ON DELETE CASCADE,
        UNIQUE(template_id, field_id)
      )
    `)
    db.exec('CREATE INDEX IF NOT EXISTS idx_template_name ON form_templates(template_name)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_template_fields_template ON form_template_fields(template_id)')
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log('Form templates table creation:', error.message)
    }
  }

  // Seed initial form fields if table is empty (run seed script)
  try {
    const fieldCount = db.prepare('SELECT COUNT(*) as count FROM form_fields_config').get().count
    if (fieldCount === 0) {
      // Seed will run automatically when script is imported
      import('../scripts/seedFormFields.js').then(() => {
        console.log('Form fields seeded')
      }).catch(err => {
        console.log('Form fields seed:', err.message)
      })
    }
  } catch (error) {
    if (!error.message.includes('no such table')) {
      console.log('Form fields seed check:', error.message)
    }
  }

  // Ensure business_rules_config table exists first
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS business_rules_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_name VARCHAR(255) NOT NULL,
        rule_type VARCHAR(50) NOT NULL,
        condition_field VARCHAR(100),
        condition_operator VARCHAR(50),
        condition_value TEXT,
        condition_groups TEXT,
        action_type VARCHAR(50),
        action_value TEXT,
        is_active BOOLEAN DEFAULT 1,
        approval_status VARCHAR(50) DEFAULT 'Pending',
        created_by INTEGER NOT NULL,
        approved_by INTEGER,
        approved_at DATETIME,
        rejection_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      )
    `)
    db.exec('CREATE INDEX IF NOT EXISTS idx_rules_type ON business_rules_config(rule_type)')
    console.log('✅ business_rules_config table ensured')
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log('Business rules config table creation:', error.message)
    }
  }
  
  // Add condition_groups column if it doesn't exist (for AND/OR logic)
  try {
    db.exec('ALTER TABLE business_rules_config ADD COLUMN condition_groups TEXT')
    console.log('✅ Added condition_groups column to business_rules_config')
  } catch (error) {
    if (!error.message.includes('duplicate column')) {
      // Column already exists, that's fine
    }
  }

  // Add Pro version columns if they don't exist
  const proColumns = [
    { name: 'rule_category', type: 'VARCHAR(50) DEFAULT "Custom"' },
    { name: 'regulation_reference', type: 'VARCHAR(255)' },
    { name: 'applies_to_pie', type: 'BOOLEAN DEFAULT 0' },
    { name: 'tax_sub_type', type: 'VARCHAR(50)' },
    { name: 'complex_conditions', type: 'TEXT' },
    { name: 'confidence_level', type: 'VARCHAR(20) DEFAULT "MEDIUM"' },
    { name: 'can_override', type: 'BOOLEAN DEFAULT 1' },
    { name: 'override_guidance', type: 'TEXT' },
    { name: 'guidance_text', type: 'TEXT' },
    { name: 'required_override_role', type: 'VARCHAR(50)' }
  ]

  for (const col of proColumns) {
    try {
      db.exec(`ALTER TABLE business_rules_config ADD COLUMN ${col.name} ${col.type}`)
      console.log(`✅ Added ${col.name} column to business_rules_config`)
    } catch (error) {
      if (!error.message.includes('duplicate column') && !error.message.includes('already exists')) {
        console.log(`Note: ${col.name} column:`, error.message)
      }
    }
  }

  // Seed default conflict rules if table is empty
  try {
    const ruleCount = db.prepare('SELECT COUNT(*) as count FROM business_rules_config').get().count
    if (ruleCount === 0) {
      // Get Super Admin user ID (or first admin user)
      const superAdmin = db.prepare(`
        SELECT id FROM users 
        WHERE role = 'Super Admin' OR role = 'Admin' 
        ORDER BY id LIMIT 1
      `).get()
      
      const adminId = superAdmin?.id || 1 // Fallback to user ID 1 if no admin found
      
      const defaultRules = [
        {
          rule_name: 'Audit + Advisory Conflict',
          rule_type: 'conflict',
          condition_field: 'service_type',
          condition_operator: 'contains',
          condition_value: 'Audit,Advisory',
          action_type: 'block',
          action_value: 'Audit + Advisory for same client = Blocked',
          is_active: 1,
          approval_status: 'Approved',
          created_by: adminId,
          approved_by: adminId,
          approved_at: new Date().toISOString()
        },
        {
          rule_name: 'Audit + Tax Compliance Review',
          rule_type: 'conflict',
          condition_field: 'service_type',
          condition_operator: 'contains',
          condition_value: 'Audit,Tax',
          action_type: 'require_approval',
          action_value: 'Audit + Tax Compliance = Review Required',
          is_active: 1,
          approval_status: 'Approved',
          created_by: adminId,
          approved_by: adminId,
          approved_at: new Date().toISOString()
        },
        {
          rule_name: 'Multiple Service Types from Different Departments',
          rule_type: 'conflict',
          condition_field: null,
          condition_operator: null,
          condition_value: null,
          action_type: 'flag',
          action_value: 'Multiple service types from different departments = Flagged',
          is_active: 1,
          approval_status: 'Approved',
          created_by: adminId,
          approved_by: adminId,
          approved_at: new Date().toISOString()
        }
      ]
      
      const insertStmt = db.prepare(`
        INSERT INTO business_rules_config (
          rule_name, rule_type, condition_field, condition_operator,
          condition_value, action_type, action_value, is_active,
          approval_status, created_by, approved_by, approved_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      defaultRules.forEach(rule => {
        insertStmt.run(
          rule.rule_name,
          rule.rule_type,
          rule.condition_field,
          rule.condition_operator,
          rule.condition_value,
          rule.action_type,
          rule.action_value,
          rule.is_active,
          rule.approval_status,
          rule.created_by,
          rule.approved_by,
          rule.approved_at
        )
      })
      
      console.log(`✅ Seeded ${defaultRules.length} default conflict rules`)
    }
  } catch (error) {
    // Table might not exist yet, that's okay
    if (!error.message.includes('no such table')) {
      console.log('Default rules seed check:', error.message)
    }
  }

  // Initialize field mappings for standard fields
  try {
    const mappingCount = db.prepare('SELECT COUNT(*) as count FROM form_field_mappings').get().count
    if (mappingCount === 0) {
      const standardMappings = [
        { field_id: 'requestor_name', db_column: 'requestor_name', is_custom: 0, data_type: 'text' },
        { field_id: 'designation', db_column: 'designation', is_custom: 0, data_type: 'text' },
        { field_id: 'entity', db_column: 'entity', is_custom: 0, data_type: 'text' },
        { field_id: 'line_of_service', db_column: 'line_of_service', is_custom: 0, data_type: 'text' },
        { field_id: 'requested_document', db_column: 'requested_document', is_custom: 0, data_type: 'text' },
        { field_id: 'language', db_column: 'language', is_custom: 0, data_type: 'text' },
        { field_id: 'client_id', db_column: 'client_id', is_custom: 0, data_type: 'number' },
        { field_id: 'client_type', db_column: 'client_type', is_custom: 0, data_type: 'text' },
        { field_id: 'client_location', db_column: 'client_location', is_custom: 0, data_type: 'text' },
        { field_id: 'relationship_with_client', db_column: 'relationship_with_client', is_custom: 0, data_type: 'text' },
        { field_id: 'regulated_body', db_column: 'regulated_body', is_custom: 0, data_type: 'text' },
        { field_id: 'client_status', db_column: 'client_status', is_custom: 0, data_type: 'text' },
        { field_id: 'pie_status', db_column: 'pie_status', is_custom: 0, data_type: 'text' },
        { field_id: 'parent_company', db_column: 'parent_company', is_custom: 0, data_type: 'text' },
        { field_id: 'service_type', db_column: 'service_type', is_custom: 0, data_type: 'text' },
        { field_id: 'service_category', db_column: 'service_category', is_custom: 0, data_type: 'text' },
        { field_id: 'service_description', db_column: 'service_description', is_custom: 0, data_type: 'text' },
        { field_id: 'requested_service_period_start', db_column: 'requested_service_period_start', is_custom: 0, data_type: 'date' },
        { field_id: 'requested_service_period_end', db_column: 'requested_service_period_end', is_custom: 0, data_type: 'date' },
        { field_id: 'full_ownership_structure', db_column: 'full_ownership_structure', is_custom: 0, data_type: 'text' },
        { field_id: 'related_affiliated_entities', db_column: 'related_affiliated_entities', is_custom: 0, data_type: 'text' },
        { field_id: 'international_operations', db_column: 'international_operations', is_custom: 0, data_type: 'boolean' },
        { field_id: 'foreign_subsidiaries', db_column: 'foreign_subsidiaries', is_custom: 0, data_type: 'text' },
        { field_id: 'global_clearance_status', db_column: 'global_clearance_status', is_custom: 0, data_type: 'text' }
      ]

      const stmt = db.prepare(`
        INSERT INTO form_field_mappings (field_id, db_column, is_custom, data_type)
        VALUES (?, ?, ?, ?)
      `)

      const transaction = db.transaction((mappings) => {
        for (const mapping of mappings) {
          try {
            stmt.run(mapping.field_id, mapping.db_column, mapping.is_custom, mapping.data_type)
          } catch (error) {
            // Ignore duplicates
            if (!error.message.includes('UNIQUE constraint')) {
              console.log('Error inserting field mapping:', error.message)
            }
          }
        }
      })

      transaction(standardMappings)
    }
  } catch (error) {
    if (!error.message.includes('no such table')) {
      console.log('Field mappings init:', error.message)
    }
  }

  // Initialize rules engine health
  try {
    const healthCount = db.prepare('SELECT COUNT(*) as count FROM rules_engine_health').get().count
    if (healthCount === 0) {
      db.prepare(`
        INSERT INTO rules_engine_health (engine_version, status, last_check_at)
        VALUES ('1.0', 'healthy', CURRENT_TIMESTAMP)
      `).run()
    }
  } catch (error) {
    if (!error.message.includes('no such table')) {
      console.log('Rules engine health init:', error.message)
    }
  }

  // Create trigger for Engagement Code validation (if not exists)
  try {
    db.exec(`
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
    `)
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error('Trigger creation error:', error.message)
    }
  }

  // Create uploaded_files table for ISQM and supporting documents
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS uploaded_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_name VARCHAR(255) NOT NULL,
        stored_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type VARCHAR(100),
        category VARCHAR(50) NOT NULL,
        document_type VARCHAR(100),
        request_id INTEGER,
        uploaded_by INTEGER,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES coi_requests(id),
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `)
    db.exec('CREATE INDEX IF NOT EXISTS idx_files_request ON uploaded_files(request_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_files_category ON uploaded_files(category)')
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log('Uploaded files table creation:', error.message)
    }
  }

  // Create compliance_reports table for monthly reports
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS compliance_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        report_data TEXT NOT NULL,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        generated_by INTEGER,
        FOREIGN KEY (generated_by) REFERENCES users(id),
        UNIQUE(month, year)
      )
    `)
    db.exec('CREATE INDEX IF NOT EXISTS idx_reports_period ON compliance_reports(year, month)')
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log('Compliance reports table creation:', error.message)
    }
  }

  // Create refresh_tokens table for JWT refresh token management
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        revoked BOOLEAN DEFAULT 0,
        revoked_at DATETIME,
        replaced_by_token TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)
    db.exec('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at)')
    console.log('✅ refresh_tokens table ensured')
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error('Error creating refresh_tokens table:', error.message)
    }
  }

  // Add monitoring columns to coi_requests if not present
  const monitoringColumns = [
    { name: 'engagement_end_date', def: 'DATE' },
    { name: 'expiry_notification_sent', def: 'TEXT' },
    { name: 'compliance_reminder_sent', def: 'DATETIME' },
    { name: 'stale_notification_sent', def: 'DATETIME' },
    { name: 'interval_alerts_sent', def: 'TEXT' },
    { name: 'renewal_notification_sent', def: 'TEXT' }  // For 3-year renewal alerts
  ]
  
  for (const col of monitoringColumns) {
    try {
      db.exec(`ALTER TABLE coi_requests ADD COLUMN ${col.name} ${col.def}`)
      console.log(`✅ Added column ${col.name} to coi_requests`)
    } catch (error) {
      // Column exists, ignore
    }
  }

  // Add rejection tracking columns for resubmission feature
  const rejectionColumns = [
    { name: 'rejection_reason', def: 'TEXT' },
    { name: 'rejection_type', def: "VARCHAR(20) DEFAULT 'fixable'" }
  ]
  
  for (const col of rejectionColumns) {
    try {
      db.exec(`ALTER TABLE coi_requests ADD COLUMN ${col.name} ${col.def}`)
      console.log(`✅ Added column ${col.name} to coi_requests`)
    } catch (error) {
      // Column exists, ignore
    }
  }

  // Add duplicate justification columns for override tracking
  const duplicateJustificationColumns = [
    { name: 'duplicate_justification', def: 'TEXT' },
    { name: 'duplicate_override_by', def: 'INTEGER' },
    { name: 'duplicate_override_date', def: 'DATETIME' }
  ]
  
  for (const col of duplicateJustificationColumns) {
    try {
      db.exec(`ALTER TABLE coi_requests ADD COLUMN ${col.name} ${col.def}`)
      console.log(`✅ Added column ${col.name} to coi_requests`)
    } catch (error) {
      // Column exists, ignore
    }
  }

  // Add group structure verification columns for parent company mapping (IESBA 290.13)
  const groupStructureColumns = [
    { name: 'group_structure', def: "TEXT CHECK(group_structure IN ('standalone', 'has_parent', 'research_required'))" },
    { name: 'parent_company_verified_by', def: 'INTEGER REFERENCES users(id)' },
    { name: 'parent_company_verified_at', def: 'DATETIME' },
    { name: 'group_conflicts_detected', def: 'TEXT' },  // JSON array of detected conflicts
    { name: 'requires_compliance_verification', def: 'INTEGER DEFAULT 0' }
  ]
  
  for (const col of groupStructureColumns) {
    try {
      db.exec(`ALTER TABLE coi_requests ADD COLUMN ${col.name} ${col.def}`)
      console.log(`✅ Added column ${col.name} to coi_requests`)
    } catch (error) {
      // Column exists, ignore
    }
  }

  // Add industry-standard company relationship fields (IESBA 290.13 compliance)
  const companyRelationshipColumns = [
    { name: 'company_type', def: "VARCHAR(50) CHECK(company_type IN ('Standalone', 'Subsidiary', 'Parent', 'Sister', 'Affiliate'))" },
    { name: 'parent_company_id', def: 'INTEGER REFERENCES clients(id)' },
    { name: 'ownership_percentage', def: 'DECIMAL(5,2) CHECK(ownership_percentage >= 0 AND ownership_percentage <= 100)' },
    { name: 'control_type', def: "VARCHAR(50) CHECK(control_type IN ('Majority', 'Minority', 'Joint', 'Significant Influence', 'None'))" }
  ]
  
  for (const col of companyRelationshipColumns) {
    try {
      db.exec(`ALTER TABLE coi_requests ADD COLUMN ${col.name} ${col.def}`)
      console.log(`✅ Added column ${col.name} to coi_requests`)
    } catch (error) {
      if (!error.message.includes('duplicate column')) {
        console.log(`Note: ${col.name} column:`, error.message)
      }
    }
  }

  // Add approver availability columns to users table
  const approverAvailabilityColumns = [
    { name: 'unavailable_reason', def: 'TEXT' },
    { name: 'unavailable_until', def: 'DATE' }
  ]
  
  for (const col of approverAvailabilityColumns) {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`)
      console.log(`✅ Added column ${col.name} to users`)
    } catch (error) {
      // Column exists, ignore
    }
  }

  // HRMS integration: map COI user to HRMS employee for status sync
  try {
    db.exec('ALTER TABLE users ADD COLUMN hrms_employee_id VARCHAR(100)')
    console.log('✅ Added column hrms_employee_id to users')
  } catch (error) {
    if (!error.message.includes('duplicate column')) {
      console.log('Note: users.hrms_employee_id:', error.message)
    }
  }

  // Goal 3: Configurable approver hierarchy (order per role) — lower number = first in chain
  try {
    db.exec('ALTER TABLE users ADD COLUMN approval_order INTEGER')
    console.log('✅ Added column approval_order to users')
  } catch (error) {
    if (!error.message.includes('duplicate column')) {
      console.log('Note: users.approval_order:', error.message)
    }
  }

  // COI Form Goals: global line of service + backup approver (2026-01-28)
  const coiFormGoalsColumns = [
    { name: 'global_service_category', def: 'VARCHAR(50)' },
    { name: 'global_service_type', def: 'VARCHAR(100)' },
    { name: 'backup_approver_id', def: 'INTEGER REFERENCES users(id)' }
  ]
  for (const col of coiFormGoalsColumns) {
    try {
      db.exec(`ALTER TABLE coi_requests ADD COLUMN ${col.name} ${col.def}`)
      console.log(`✅ Added column ${col.name} to coi_requests`)
    } catch (error) {
      if (!error.message.includes('duplicate column')) {
        console.log(`Note: coi_requests.${col.name}:`, error.message)
      }
    }
  }
  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_coi_requests_backup_approver ON coi_requests(backup_approver_id)')
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log('Note: idx_coi_requests_backup_approver:', error.message)
    }
  }

  // Create dismissed_resolved_conflicts table for tracking dismissed conflict resolution items
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS dismissed_resolved_conflicts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        dismissed_by INTEGER NOT NULL,
        dismissed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reason TEXT,
        FOREIGN KEY (request_id) REFERENCES coi_requests(id),
        FOREIGN KEY (dismissed_by) REFERENCES users(id)
      )
    `)
    db.exec('CREATE INDEX IF NOT EXISTS idx_dismissed_conflicts_request ON dismissed_resolved_conflicts(request_id)')
    console.log('✅ dismissed_resolved_conflicts table ensured')
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error('Error creating dismissed_resolved_conflicts table:', error.message)
    }
  }

  // Parent company bidirectional sync: optional text on clients (PRMS often has "TBD")
  try {
    db.exec('ALTER TABLE clients ADD COLUMN parent_company VARCHAR(255)')
    console.log('✅ Added column parent_company to clients')
  } catch (error) {
    if (!error.message.includes('duplicate column')) {
      console.log('Note: clients.parent_company:', error.message)
    }
  }

  // Parent company update requests: COI-originated parent updates require PRMS admin approval
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS parent_company_update_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        client_code VARCHAR(50) NOT NULL,
        requested_parent_company VARCHAR(255),
        requested_parent_company_id INTEGER REFERENCES clients(id),
        source VARCHAR(50) DEFAULT 'COI',
        status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
        coi_request_id INTEGER REFERENCES coi_requests(id),
        requested_by INTEGER NOT NULL REFERENCES users(id),
        requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewed_by INTEGER REFERENCES users(id),
        reviewed_at DATETIME,
        review_notes TEXT,
        prms_updated_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    db.exec('CREATE INDEX IF NOT EXISTS idx_parent_company_update_client ON parent_company_update_requests(client_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_parent_company_update_status ON parent_company_update_requests(status)')
    console.log('✅ parent_company_update_requests table ensured')
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error('Error creating parent_company_update_requests table:', error.message)
    }
  }

  // Backfill group_structure based on existing parent_company values
  try {
    const result = db.prepare(`
      UPDATE coi_requests 
      SET group_structure = CASE 
        WHEN parent_company IS NOT NULL AND parent_company != '' THEN 'has_parent'
        ELSE NULL
      END
      WHERE group_structure IS NULL
    `).run()
    if (result.changes > 0) {
      console.log(`✅ Backfilled group_structure for ${result.changes} existing requests`)
    }
  } catch (error) {
    // Ignore errors during backfill
  }
  
  // Seed Entity Codes
  try {
    const { seedEntityCodes } = await import('../scripts/seedEntityCodes.js')
    seedEntityCodes()
  } catch (error) {
    console.log('Note: Entity codes seeding skipped (may already exist)')
  }

  // Seed Service Catalogs (Kuwait Local + Global)
  try {
    // Seed Kuwait Local Service Catalog first (39 services from COI Template)
    const { seedKuwaitServiceCatalog } = await import('../scripts/seedKuwaitServiceCatalog.js')
    seedKuwaitServiceCatalog()
    
    // Then seed Global Service Catalog (177+ services from Global COI Form)
    const { seedGlobalServiceCatalog } = await import('../scripts/seedGlobalServiceCatalog.js')
    seedGlobalServiceCatalog()
  } catch (error) {
    console.log('Note: Service catalog seeding skipped (may already exist)')
  }

  // Seed CMA Rules (Phase 1.1 - CMA Foundation)
  try {
    // Create CMA tables directly (more reliable than parsing SQL file)
    db.pragma('foreign_keys = OFF')
    
    // Create cma_service_types table
    db.exec(`
      CREATE TABLE IF NOT EXISTS cma_service_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_code VARCHAR(50) NOT NULL UNIQUE,
        service_name_en TEXT NOT NULL,
        service_name_ar TEXT,
        legal_reference TEXT,
        module_reference TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Create cma_condition_codes table
    db.exec(`
      CREATE TABLE IF NOT EXISTS cma_condition_codes (
        code VARCHAR(50) PRIMARY KEY,
        description TEXT NOT NULL,
        requires_manual_review BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Create cma_combination_rules table
    db.exec(`
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
        UNIQUE(service_a_code, service_b_code)
      )
    `)
    
    // Create indexes
    db.exec('CREATE INDEX IF NOT EXISTS idx_cma_rules_service_a ON cma_combination_rules(service_a_code)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_cma_rules_service_b ON cma_combination_rules(service_b_code)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_cma_rules_allowed ON cma_combination_rules(allowed)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_cma_rules_condition ON cma_combination_rules(condition_code)')
    
    // Re-enable foreign keys
    db.pragma('foreign_keys = ON')
      
      // Add is_cma_regulated column if it doesn't exist
      try {
        db.exec('ALTER TABLE clients ADD COLUMN is_cma_regulated BOOLEAN DEFAULT 0')
        console.log('✅ Added is_cma_regulated column to clients table')
      } catch (error) {
        if (!error.message.includes('duplicate column')) {
          // Column already exists, that's fine
        }
      }
      
      // Seed CMA service types
      try {
        const serviceTypesResult = seedCMAServiceTypes()
        console.log(`✅ CMA Service Types: ${serviceTypesResult.inserted} inserted, ${serviceTypesResult.skipped} skipped`)
      } catch (seedError) {
        console.error('❌ Error seeding CMA Service Types:', seedError)
        throw seedError // Don't swallow errors
      }
      
      // Seed CMA combination rules
      try {
        const rulesResult = seedCMARules()
        console.log(`✅ CMA Combination Rules: ${rulesResult.inserted} inserted, ${rulesResult.skipped} skipped`)
      } catch (seedError) {
        console.error('❌ Error seeding CMA Combination Rules:', seedError)
        throw seedError // Don't swallow errors
      }
      
      // Verify CMA seeding succeeded
      try {
        const serviceCount = db.prepare('SELECT COUNT(*) as count FROM cma_service_types').get()
        const rulesCount = db.prepare('SELECT COUNT(*) as count FROM cma_combination_rules').get()
        const conditionCount = db.prepare('SELECT COUNT(*) as count FROM cma_condition_codes').get()
        
        if (serviceCount.count === 0) {
          console.warn('⚠️  CMA Service Types table is empty - seeding may have failed')
        } else {
          console.log(`✅ Verified: ${serviceCount.count} CMA service types in database`)
        }
        
        if (rulesCount.count === 0) {
          console.warn('⚠️  CMA Combination Rules table is empty - seeding may have failed')
        } else {
          console.log(`✅ Verified: ${rulesCount.count} CMA combination rules in database`)
        }
        
        if (conditionCount.count === 0) {
          console.warn('⚠️  CMA Condition Codes table is empty - seeding may have failed')
        } else {
          console.log(`✅ Verified: ${conditionCount.count} CMA condition codes in database`)
        }
      } catch (verifyError) {
        console.error('❌ Error verifying CMA data:', verifyError)
      }
      
      console.log('✅ CMA rules migration and seeding complete')
  } catch (error) {
    console.log('Note: CMA rules migration/seeding skipped (may already exist):', error.message)
  }

  // Add applies_to_cma column to business_rules_config (Rule Builder CMA integration)
  try {
    db.exec('ALTER TABLE business_rules_config ADD COLUMN applies_to_cma BOOLEAN DEFAULT 0')
    console.log('✅ Added applies_to_cma column to business_rules_config table')
  } catch (error) {
    if (!error.message.includes('duplicate column')) {
      // Column already exists, that's fine
    }
  }

  // Seed IESBA rules into business_rules_config (CMA + IESBA only)
  try {
    const iesbaResult = seedIESBARules()
    console.log(`✅ IESBA rules: ${iesbaResult.inserted} inserted, ${iesbaResult.skipped} skipped`)
  } catch (iesbaError) {
    console.log('Note: IESBA rules seed skipped (may already exist):', iesbaError?.message)
  }

  // Seed CMA rules into business_rules_config for Rule Builder display
  try {
    const cmaBizResult = seedCMABusinessRules()
    console.log(`✅ CMA business rules: ${cmaBizResult.inserted} inserted, ${cmaBizResult.skipped} skipped`)
  } catch (cmaBizError) {
    console.log('Note: CMA business rules seed skipped:', cmaBizError?.message)
  }

  // Create countries table and seed
  try {
    const countriesMigrationPath = join(__dirname, '../../../database/migrations/20260115_countries.sql')
    if (existsSync(countriesMigrationPath)) {
      const countriesMigration = readFileSync(countriesMigrationPath, 'utf-8')
      const statements = countriesMigration
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))
      
      statements.forEach(statement => {
        try {
          db.exec(statement)
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.error('Countries migration error:', error.message)
          }
        }
      })
      
      // Seed countries
      const { seedCountries } = await import('../scripts/seedCountries.js')
      seedCountries()
    }
  } catch (error) {
    console.log('Note: Countries migration/seeding skipped (may already exist)')
  }
  
  // Add missing indexes for reports performance
  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_coi_requests_created_at ON coi_requests(created_at)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_coi_requests_service_type ON coi_requests(service_type)')
    console.log('Report performance indexes created/verified')
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error('Index creation error:', error.message)
    }
  }

  // ============================================
  // Lead Attribution Migration (2026-01-20)
  // CRM Features: Lead Source Tracking & Funnel Events
  // ============================================
  
  // Create lead_sources table directly (more reliable than migration file)
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS lead_sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_code VARCHAR(50) UNIQUE NOT NULL,
        source_name VARCHAR(100) NOT NULL,
        source_category VARCHAR(50),
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ lead_sources table ensured')
    
    // Seed lead sources
    const leadSourcesSeeds = [
      ['unknown', 'Unknown / Legacy', 'other'],
      ['internal_referral', 'Internal Referral (Partner/Director)', 'referral'],
      ['client_referral', 'Client Referral', 'referral'],
      ['bdo_global', 'BDO Global', 'referral'],
      ['insights_module', 'Client Intelligence Module', 'system'],
      ['cold_outreach', 'Cold Outreach', 'outbound'],
      ['direct_creation', 'Direct Client Creation', 'other'],
      ['marketing', 'Marketing Campaign', 'outbound'],
      ['event', 'Event / Conference', 'outbound']
    ]
    
    const insertLeadSource = db.prepare(`
      INSERT OR IGNORE INTO lead_sources (source_code, source_name, source_category) 
      VALUES (?, ?, ?)
    `)
    
    let seededCount = 0
    for (const [code, name, category] of leadSourcesSeeds) {
      const result = insertLeadSource.run(code, name, category)
      if (result.changes > 0) seededCount++
    }
    if (seededCount > 0) {
      console.log(`✅ Seeded ${seededCount} lead sources`)
    }
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log('Lead sources table:', error.message)
    }
  }
  
  // Create prospect_funnel_events table
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS prospect_funnel_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prospect_id INTEGER,
        coi_request_id INTEGER,
        from_stage VARCHAR(50),
        to_stage VARCHAR(50) NOT NULL,
        performed_by_user_id INTEGER,
        performed_by_role VARCHAR(50),
        event_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        days_in_previous_stage INTEGER,
        notes TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (prospect_id) REFERENCES prospects(id),
        FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id),
        FOREIGN KEY (performed_by_user_id) REFERENCES users(id)
      )
    `)
    db.exec('CREATE INDEX IF NOT EXISTS idx_funnel_prospect ON prospect_funnel_events(prospect_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_funnel_coi_request ON prospect_funnel_events(coi_request_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_funnel_stage ON prospect_funnel_events(to_stage)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_funnel_user ON prospect_funnel_events(performed_by_user_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_funnel_timestamp ON prospect_funnel_events(event_timestamp)')
    console.log('✅ prospect_funnel_events table ensured')
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log('Prospect funnel events table:', error.message)
    }
  }

  // Add lead source and attribution columns to prospects table
  const prospectAttributionColumns = [
    { name: 'lead_source_id', def: 'INTEGER REFERENCES lead_sources(id)' },
    { name: 'referred_by_user_id', def: 'INTEGER REFERENCES users(id)' },
    { name: 'referred_by_client_id', def: 'INTEGER REFERENCES clients(id)' },
    { name: 'source_opportunity_id', def: 'INTEGER' },
    { name: 'source_notes', def: 'TEXT' }
  ]
  
  for (const col of prospectAttributionColumns) {
    try {
      db.exec(`ALTER TABLE prospects ADD COLUMN ${col.name} ${col.def}`)
      console.log(`✅ Added column ${col.name} to prospects`)
    } catch (error) {
      if (!error.message.includes('duplicate column')) {
        // Column already exists, that's fine
      }
    }
  }

  // Add lead_source_id to coi_requests for direct proposal tracking
  try {
    db.exec('ALTER TABLE coi_requests ADD COLUMN lead_source_id INTEGER REFERENCES lead_sources(id)')
    console.log('✅ Added lead_source_id to coi_requests')
  } catch (error) {
    if (!error.message.includes('duplicate column')) {
      // Column already exists
    }
  }

  // Create index for lead source lookups
  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_prospects_lead_source ON prospects(lead_source_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_coi_requests_lead_source ON coi_requests(lead_source_id)')
  } catch (error) {
    // Indexes may already exist
  }

  // Migrate existing prospects to 'unknown' lead source if they don't have one
  try {
    const unknownSource = db.prepare('SELECT id FROM lead_sources WHERE source_code = ?').get('unknown')
    if (unknownSource) {
      const result = db.prepare(`
        UPDATE prospects 
        SET lead_source_id = ? 
        WHERE lead_source_id IS NULL
      `).run(unknownSource.id)
      
      if (result.changes > 0) {
        console.log(`✅ Migrated ${result.changes} existing prospects to 'unknown' lead source`)
      }
    }
  } catch (error) {
    // Table or column may not exist yet
    if (!error.message.includes('no such table') && !error.message.includes('no such column')) {
      console.log('Lead source migration note:', error.message)
    }
  }

  // ============================================
  // PHASE 3: Lost Tracking & Stale Detection (2026-01-20)
  // ============================================
  
  // Add lost tracking columns to prospects table
  const lostTrackingColumns = [
    { name: 'lost_reason', def: 'TEXT' },
    { name: 'lost_at_stage', def: 'VARCHAR(50)' },
    { name: 'lost_date', def: 'DATETIME' },
    { name: 'stale_detected_at', def: 'DATETIME' },
    { name: 'stale_notification_sent_at', def: 'DATETIME' },
    { name: 'last_activity_at', def: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
  ]
  
  for (const col of lostTrackingColumns) {
    try {
      db.exec(`ALTER TABLE prospects ADD COLUMN ${col.name} ${col.def}`)
      console.log(`✅ Added column ${col.name} to prospects`)
    } catch (error) {
      if (!error.message.includes('duplicate column')) {
        // Column already exists, that's fine
      }
    }
  }
  
  // Add lost tracking columns to coi_requests table (for proposal-level tracking)
  const coiLostTrackingColumns = [
    { name: 'lost_reason', def: 'TEXT' },
    { name: 'lost_at_stage', def: 'VARCHAR(50)' },
    { name: 'lost_date', def: 'DATETIME' },
    { name: 'stale_detected_at', def: 'DATETIME' },
    { name: 'last_activity_at', def: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
  ]
  
  for (const col of coiLostTrackingColumns) {
    try {
      db.exec(`ALTER TABLE coi_requests ADD COLUMN ${col.name} ${col.def}`)
      console.log(`✅ Added column ${col.name} to coi_requests`)
    } catch (error) {
      if (!error.message.includes('duplicate column')) {
        // Column already exists
      }
    }
  }
  
  // Create index for stale detection queries
  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_prospects_last_activity ON prospects(last_activity_at)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_prospects_stale ON prospects(stale_detected_at)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_coi_requests_last_activity ON coi_requests(last_activity_at)')
  } catch (error) {
    // Indexes may already exist
  }
  
  // Backfill last_activity_at for existing prospects
  try {
    db.exec(`
      UPDATE prospects 
      SET last_activity_at = COALESCE(updated_at, created_at)
      WHERE last_activity_at IS NULL
    `)
    db.exec(`
      UPDATE coi_requests 
      SET last_activity_at = COALESCE(updated_at, created_at)
      WHERE last_activity_at IS NULL AND is_prospect = 1
    `)
  } catch (error) {
    // Ignore backfill errors
  }

  // Seed IESBA rules (Pro Version)
  try {
    // Use unified seeder instead of separate scripts
    const { seedRules } = await import('../scripts/seedRules.js')
    seedRules()
  } catch (error) {
    console.log('Note: IESBA rules seeding skipped (may already exist)')
  }

  // Seed additional rules (IESBA category, validation, conflict, custom)
  try {
    // Rules are now seeded by unified seedRules() above
  } catch (error) {
    console.log('Note: Additional rules seeding skipped (may already exist)')
  }

  // ============================================
  // PRIORITY SCORING & SLA CONFIGURATION (2026-01-21)
  // ============================================
  
  // Create priority_config table
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS priority_config (
        factor_id VARCHAR(50) PRIMARY KEY,
        factor_name VARCHAR(100) NOT NULL,
        weight DECIMAL(3,1) DEFAULT 1.0,
        value_mappings TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        updated_by INTEGER REFERENCES users(id),
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ priority_config table ensured')
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log('Priority config table:', error.message)
    }
  }
  
  // Create priority_audit table
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS priority_audit (
        audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
        factor_id VARCHAR(50) NOT NULL,
        field_changed VARCHAR(50) NOT NULL,
        old_value TEXT,
        new_value TEXT,
        changed_by INTEGER REFERENCES users(id),
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reason VARCHAR(255)
      )
    `)
    db.exec('CREATE INDEX IF NOT EXISTS idx_priority_audit_factor ON priority_audit(factor_id)')
    console.log('✅ priority_audit table ensured')
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log('Priority audit table:', error.message)
    }
  }
  
  // Create sla_config table
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS sla_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workflow_stage VARCHAR(100) NOT NULL,
        target_hours INTEGER NOT NULL,
        warning_threshold_percent INTEGER DEFAULT 75,
        critical_threshold_percent INTEGER DEFAULT 90,
        applies_to_service_type VARCHAR(100),
        applies_to_pie BOOLEAN,
        is_active BOOLEAN DEFAULT 1,
        updated_by INTEGER REFERENCES users(id),
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(workflow_stage, applies_to_service_type, applies_to_pie)
      )
    `)
    db.exec('CREATE INDEX IF NOT EXISTS idx_sla_config_stage ON sla_config(workflow_stage)')
    console.log('✅ sla_config table ensured')
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log('SLA config table:', error.message)
    }
  }
  
  // Create email_config table
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS email_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        config_name VARCHAR(100) NOT NULL DEFAULT 'default',
        smtp_host VARCHAR(255) NOT NULL,
        smtp_port INTEGER NOT NULL DEFAULT 587,
        smtp_secure BOOLEAN DEFAULT 0,
        smtp_user VARCHAR(255) NOT NULL,
        smtp_password VARCHAR(255) NOT NULL,
        from_email VARCHAR(255) NOT NULL,
        from_name VARCHAR(255) DEFAULT 'COI System',
        reply_to VARCHAR(255),
        is_active BOOLEAN DEFAULT 1,
        test_email VARCHAR(255),
        last_tested_at DATETIME,
        test_status VARCHAR(50),
        test_error TEXT,
        updated_by INTEGER REFERENCES users(id),
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(config_name)
      )
    `)
    db.exec('CREATE INDEX IF NOT EXISTS idx_email_config_active ON email_config(is_active)')
    console.log('✅ email_config table ensured')
    
    // Seed default email config if none exists
    const existingConfig = db.prepare('SELECT COUNT(*) as count FROM email_config').get()
    if (existingConfig.count === 0) {
      db.prepare(`
        INSERT INTO email_config (
          config_name, smtp_host, smtp_port, smtp_secure, 
          smtp_user, smtp_password, from_email, from_name, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'default',
        process.env.SMTP_HOST || 'smtp.gmail.com',
        parseInt(process.env.SMTP_PORT) || 587,
        process.env.SMTP_SECURE === 'true' ? 1 : 0,
        process.env.SMTP_USER || '',
        process.env.SMTP_PASS || '',
        process.env.SMTP_USER || 'noreply@coi-system.com',
        'COI System',
        0 // Inactive by default until configured
      )
      console.log('✅ Seeded default email config')
    }
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log('Email config table:', error.message)
    }
  }
  
  // Create business_calendar table
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS business_calendar (
        date DATE PRIMARY KEY,
        is_working_day BOOLEAN DEFAULT 1,
        holiday_name VARCHAR(100),
        working_hours_start TIME DEFAULT '09:00',
        working_hours_end TIME DEFAULT '18:00',
        synced_from_hrms BOOLEAN DEFAULT 0,
        synced_at DATETIME
      )
    `)
    db.exec('CREATE INDEX IF NOT EXISTS idx_business_calendar_working ON business_calendar(is_working_day)')
    console.log('✅ business_calendar table ensured')
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log('Business calendar table:', error.message)
    }
  }
  
  // Create sla_breach_log table
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS sla_breach_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        coi_request_id INTEGER NOT NULL REFERENCES coi_requests(id),
        workflow_stage VARCHAR(100) NOT NULL,
        breach_type VARCHAR(20) NOT NULL,
        target_hours INTEGER NOT NULL,
        actual_hours DECIMAL(10,2) NOT NULL,
        detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        notified_users TEXT
      )
    `)
    db.exec('CREATE INDEX IF NOT EXISTS idx_sla_breach_request ON sla_breach_log(coi_request_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_sla_breach_type ON sla_breach_log(breach_type)')
    console.log('✅ sla_breach_log table ensured')
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log('SLA breach log table:', error.message)
    }
  }
  
  // Create ML tables for future use
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS ml_weights (
        model_id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_type VARCHAR(50) NOT NULL,
        model_path VARCHAR(255),
        weights TEXT NOT NULL,
        accuracy DECIMAL(5,4),
        training_records INTEGER,
        trained_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 0,
        activated_by INTEGER REFERENCES users(id),
        activated_at DATETIME,
        notes TEXT
      )
    `)
    db.exec('CREATE INDEX IF NOT EXISTS idx_ml_weights_active ON ml_weights(model_type, is_active)')
    console.log('✅ ml_weights table ensured')
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log('ML weights table:', error.message)
    }
  }
  
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS ml_predictions (
        prediction_id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id VARCHAR(50) NOT NULL,
        predicted_score INTEGER,
        predicted_level VARCHAR(20),
        prediction_method VARCHAR(10),
        model_id INTEGER REFERENCES ml_weights(model_id),
        features_snapshot TEXT,
        predicted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        actual_outcome VARCHAR(20),
        outcome_recorded_at DATETIME
      )
    `)
    db.exec('CREATE INDEX IF NOT EXISTS idx_ml_predictions_request ON ml_predictions(request_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_ml_predictions_outcome ON ml_predictions(actual_outcome, predicted_at)')
    console.log('✅ ml_predictions table ensured')
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log('ML predictions table:', error.message)
    }
  }
  
  // Add priority/SLA columns to coi_requests
  const prioritySlaColumns = [
    { name: 'escalation_count', def: 'INTEGER DEFAULT 0' },
    { name: 'external_deadline', def: 'DATE' },
    { name: 'deadline_reason', def: 'VARCHAR(255)' },
    { name: 'deadline_source', def: "VARCHAR(50) DEFAULT 'system'" },
    { name: 'stage_entered_at', def: 'DATETIME' },
    { name: 'partner_override', def: 'BOOLEAN DEFAULT 0' },
    { name: 'complaint_logged', def: 'BOOLEAN DEFAULT 0' }
  ]
  
  for (const col of prioritySlaColumns) {
    try {
      db.exec(`ALTER TABLE coi_requests ADD COLUMN ${col.name} ${col.def}`)
      console.log(`✅ Added column ${col.name} to coi_requests`)
    } catch (error) {
      if (!error.message.includes('duplicate column')) {
        // Column already exists
      }
    }
  }
  
  // Create index for SLA calculations
  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_coi_requests_stage_entered ON coi_requests(stage_entered_at)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_coi_requests_external_deadline ON coi_requests(external_deadline)')
  } catch (error) {
    // Indexes may already exist
  }
  
  // Seed priority factors
  try {
    const priorityFactors = [
      ['sla_status', 'SLA Status', 5.0, '{"BREACHED": 100, "CRITICAL": 80, "WARNING": 60, "ON_TRACK": 20}'],
      ['external_deadline', 'External Deadline', 4.0, '{"OVERDUE": 100, "TODAY": 90, "THIS_WEEK": 60, "NEXT_WEEK": 30, "NONE": 0}'],
      ['pie_status', 'PIE Status', 3.0, '{"Yes": 100, "No": 20}'],
      ['international_operations', 'International Operations', 2.0, '{"1": 70, "0": 20}'],
      ['service_type', 'Service Type', 2.0, '{"Statutory Audit": 100, "Tax Compliance": 80, "Internal Audit": 70, "Advisory": 40, "Other": 30}'],
      ['escalation_count', 'Escalation Count', 3.0, '{"3+": 100, "2": 70, "1": 40, "0": 0}']
    ]
    
    const insertFactor = db.prepare(`
      INSERT OR IGNORE INTO priority_config (factor_id, factor_name, weight, value_mappings) 
      VALUES (?, ?, ?, ?)
    `)
    
    let seededFactors = 0
    for (const [factorId, factorName, weight, mappings] of priorityFactors) {
      const result = insertFactor.run(factorId, factorName, weight, mappings)
      if (result.changes > 0) seededFactors++
    }
    if (seededFactors > 0) {
      console.log(`✅ Seeded ${seededFactors} priority factors`)
    }
  } catch (error) {
    console.log('Priority factors seeding:', error.message)
  }
  
  // Seed SLA configurations
  try {
    const slaConfigs = [
      // Default SLAs for all requests
      ['Pending Director Approval', 24, 75, 90, null, null],
      ['Pending Compliance', 48, 75, 90, null, null],
      ['Pending Partner', 24, 75, 90, null, null],
      ['Pending Finance', 24, 75, 90, null, null],
      ['Draft', 168, 75, 90, null, null],  // 7 days
      ['More Info Requested', 48, 75, 90, null, null],
      // PIE client overrides (stricter)
      ['Pending Compliance', 24, 75, 90, null, 1],  // PIE = 24h instead of 48h
      ['Pending Partner', 16, 75, 90, null, 1]      // PIE = 16h instead of 24h
    ]
    
    const insertSla = db.prepare(`
      INSERT OR IGNORE INTO sla_config (workflow_stage, target_hours, warning_threshold_percent, critical_threshold_percent, applies_to_service_type, applies_to_pie) 
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    
    let seededSla = 0
    for (const config of slaConfigs) {
      const result = insertSla.run(...config)
      if (result.changes > 0) seededSla++
    }
    if (seededSla > 0) {
      console.log(`✅ Seeded ${seededSla} SLA configurations`)
    }
  } catch (error) {
    console.log('SLA config seeding:', error.message)
  }
  
  // Generate business calendar for next 90 days (prototype)
  try {
    const existingDays = db.prepare('SELECT COUNT(*) as count FROM business_calendar').get()
    
    if (existingDays.count < 30) {
      const today = new Date()
      const insertDay = db.prepare(`
        INSERT OR IGNORE INTO business_calendar (date, is_working_day, holiday_name) 
        VALUES (?, ?, ?)
      `)
      
      let generated = 0
      for (let i = 0; i < 90; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]
        const dayOfWeek = date.getDay()
        const isWorkingDay = dayOfWeek !== 0 && dayOfWeek !== 6  // Not Sunday (0) or Saturday (6)
        
        const result = insertDay.run(dateStr, isWorkingDay ? 1 : 0, null)
        if (result.changes > 0) generated++
      }
      
      if (generated > 0) {
        console.log(`✅ Generated ${generated} days in business calendar (prototype mode)`)
      }
    }
  } catch (error) {
    console.log('Business calendar generation:', error.message)
  }
  
  // Backfill stage_entered_at for existing requests
  try {
    db.exec(`
      UPDATE coi_requests 
      SET stage_entered_at = COALESCE(updated_at, created_at)
      WHERE stage_entered_at IS NULL
    `)
  } catch (error) {
    // Ignore backfill errors
  }

  // Create permission system tables
  try {
    createPermissionTables(db)
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.log('Permission tables creation error:', error.message)
    }
  }

  // Seed default permissions
  try {
    seedDefaultPermissions(db)
  } catch (error) {
    console.log('Permission seeding error:', error.message)
  }

  console.log('Database initialized')
}

/**
 * Create permission system tables if they don't exist
 */
function createPermissionTables(db) {
  // Create permissions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      permission_key VARCHAR(100) NOT NULL UNIQUE,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      category VARCHAR(50) NOT NULL,
      is_system BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // Create role_permissions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role VARCHAR(50) NOT NULL,
      permission_key VARCHAR(100) NOT NULL REFERENCES permissions(permission_key) ON DELETE CASCADE,
      is_granted BOOLEAN DEFAULT 1,
      granted_by INTEGER REFERENCES users(id),
      granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(role, permission_key)
    )
  `)
  
  // Create permission_audit_log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS permission_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role VARCHAR(50) NOT NULL,
      permission_key VARCHAR(100) NOT NULL,
      action VARCHAR(20) NOT NULL,
      changed_by INTEGER NOT NULL REFERENCES users(id),
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reason TEXT
    )
  `)
  
  // Create indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_permissions_key ON permissions(permission_key)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_role_permissions_key ON role_permissions(permission_key)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_role_permissions_granted ON role_permissions(role, is_granted)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_permission_audit_role ON permission_audit_log(role)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_permission_audit_key ON permission_audit_log(permission_key)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_permission_audit_date ON permission_audit_log(changed_at)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_permission_audit_user ON permission_audit_log(changed_by)')
  
  console.log('✅ Permission tables ensured')
}

/**
 * Seed default permissions based on current hardcoded rules
 */
function seedDefaultPermissions(db) {
  // Check if permissions table exists (from migration)
  const tableCheck = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='permissions'
  `).get()
  
  if (!tableCheck) {
    console.log('ℹ️  Permissions table not found - run migration first')
    return
  }
  
  // Check if permissions already seeded
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM permissions').get()
  if (existingCount.count > 0) {
    console.log('✅ Permissions already seeded')
    return
  }
  
  console.log('Seeding default permissions...')
  
  // Define all permissions based on plan
  const permissions = [
    // Configuration Permissions
    { key: 'email.config.view', name: 'View Email Configuration', desc: 'View email configuration settings', category: 'Configuration' },
    { key: 'email.config.edit', name: 'Edit Email Configuration', desc: 'Edit email configuration settings', category: 'Configuration' },
    { key: 'email.config.test', name: 'Test Email Configuration', desc: 'Test email configuration', category: 'Configuration' },
    { key: 'sla.config.view', name: 'View SLA Configuration', desc: 'View SLA configuration settings', category: 'Configuration' },
    { key: 'sla.config.edit', name: 'Edit SLA Configuration', desc: 'Edit SLA configuration settings', category: 'Configuration' },
    { key: 'priority.config.view', name: 'View Priority Configuration', desc: 'View priority scoring configuration', category: 'Configuration' },
    { key: 'priority.config.edit', name: 'Edit Priority Configuration', desc: 'Edit priority scoring configuration', category: 'Configuration' },
    
    // User Management Permissions
    { key: 'users.create', name: 'Create Users', desc: 'Create new users', category: 'User Management' },
    { key: 'users.edit', name: 'Edit Users', desc: 'Edit existing users', category: 'User Management' },
    { key: 'users.disable', name: 'Disable Users', desc: 'Disable or enable users', category: 'User Management' },
    { key: 'users.view', name: 'View Users', desc: 'View user list', category: 'User Management' },
    
    // System Permissions
    { key: 'system.edition.switch', name: 'Switch Edition', desc: 'Switch between Standard and Pro editions', category: 'System' },
    { key: 'system.audit.view', name: 'View Audit Logs', desc: 'View system audit logs', category: 'System' },
    { key: 'system.config.view', name: 'View System Configuration', desc: 'View system configuration', category: 'System' },
    { key: 'permissions.manage', name: 'Manage Permissions', desc: 'Manage role-based permissions', category: 'System' },
    
    // Request Permissions
    { key: 'requests.create', name: 'Create COI Requests', desc: 'Create new COI requests', category: 'Requests' },
    { key: 'requests.approve.director', name: 'Approve as Director', desc: 'Approve requests as Director', category: 'Requests' },
    { key: 'requests.approve.compliance', name: 'Approve as Compliance', desc: 'Approve requests as Compliance', category: 'Requests' },
    { key: 'requests.approve.partner', name: 'Approve as Partner', desc: 'Approve requests as Partner', category: 'Requests' },
    { key: 'requests.generate.code', name: 'Generate Engagement Codes', desc: 'Generate engagement codes (Finance)', category: 'Requests' },
    { key: 'requests.execute', name: 'Execute Proposals', desc: 'Execute proposals (Admin)', category: 'Requests' },
    { key: 'requests.view.all', name: 'View All Requests', desc: 'View requests across all departments', category: 'Requests' },
  ]
  
  // Insert permissions
  const insertPermission = db.prepare(`
    INSERT INTO permissions (permission_key, name, description, category, is_system)
    VALUES (?, ?, ?, ?, 1)
  `)
  
  const insertRolePermission = db.prepare(`
    INSERT INTO role_permissions (role, permission_key, is_granted)
    VALUES (?, ?, 1)
  `)
  
  const transaction = db.transaction(() => {
    // Insert all permissions
    permissions.forEach(perm => {
      insertPermission.run(perm.key, perm.name, perm.desc, perm.category)
    })
    
    // Super Admin: All permissions (handled in service, but we can still log them)
    // Admin: Configuration view/edit, request execution
    const adminPermissions = [
      'email.config.view', 'email.config.edit', 'email.config.test',
      'sla.config.view', 'priority.config.view',
      'requests.execute', 'requests.view.all', 'system.config.view'
    ]
    adminPermissions.forEach(key => {
      insertRolePermission.run('Admin', key)
    })
    
    // Compliance: SLA view, request approval
    const compliancePermissions = [
      'sla.config.view',
      'requests.approve.compliance', 'requests.view.all'
    ]
    compliancePermissions.forEach(key => {
      insertRolePermission.run('Compliance', key)
    })
    
    // Director: Request approval, view team requests
    const directorPermissions = [
      'requests.approve.director', 'requests.create', 'requests.view.all'
    ]
    directorPermissions.forEach(key => {
      insertRolePermission.run('Director', key)
    })
    
    // Partner: Request approval, view all
    const partnerPermissions = [
      'requests.approve.partner', 'requests.view.all'
    ]
    partnerPermissions.forEach(key => {
      insertRolePermission.run('Partner', key)
    })
    
    // Finance: Generate codes, view all
    const financePermissions = [
      'requests.generate.code', 'requests.view.all'
    ]
    financePermissions.forEach(key => {
      insertRolePermission.run('Finance', key)
    })
    
    // Requester: Create requests, view own
    const requesterPermissions = [
      'requests.create'
    ]
    requesterPermissions.forEach(key => {
      insertRolePermission.run('Requester', key)
    })
  })
  
  transaction()
  console.log(`✅ Seeded ${permissions.length} default permissions`)
}

export default getDatabase
