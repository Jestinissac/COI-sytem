import Database from 'better-sqlite3'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let db = null

export function getDatabase() {
  if (!db) {
    const dbPath = join(__dirname, '../../../database/coi.db')
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

  console.log('Database initialized')
}

export default getDatabase
