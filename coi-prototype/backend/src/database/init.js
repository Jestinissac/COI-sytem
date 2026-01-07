import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
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

export function initDatabase() {
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

  // Seed initial form fields if table is empty (run seed script)
  try {
    const fieldCount = db.prepare('SELECT COUNT(*) as count FROM form_fields_config').get().count
    if (fieldCount === 0) {
      // Seed will run automatically when script is imported
      import('../scripts/seedFormFields.js').catch(err => {
        console.log('Form fields seed:', err.message)
      })
    }
  } catch (error) {
    // Table might not exist yet, that's okay
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
  
  console.log('Database initialized')
}

export default getDatabase
