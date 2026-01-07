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

