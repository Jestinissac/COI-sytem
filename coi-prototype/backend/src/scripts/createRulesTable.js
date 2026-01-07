import { getDatabase } from '../database/init.js'

const db = getDatabase()

console.log('Creating business_rules_config table and seeding default rules...')

try {
  // Create table
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
  console.log('✅ Table created')

  // Check if rules exist
  const ruleCount = db.prepare('SELECT COUNT(*) as count FROM business_rules_config').get().count
  console.log(`Current rules count: ${ruleCount}`)

  if (ruleCount === 0) {
    // Get Super Admin user ID
    const superAdmin = db.prepare(`
      SELECT id FROM users 
      WHERE role = 'Super Admin' OR role = 'Admin' 
      ORDER BY id LIMIT 1
    `).get()
    
    const adminId = superAdmin?.id || 1
    console.log(`Using admin ID: ${adminId}`)
    
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
    
    // Verify
    const newCount = db.prepare('SELECT COUNT(*) as count FROM business_rules_config').get().count
    console.log(`Total rules now: ${newCount}`)
    
    // Show the rules
    const rules = db.prepare('SELECT id, rule_name, rule_type, approval_status, is_active FROM business_rules_config').all()
    console.log('\nRules in database:')
    rules.forEach(rule => {
      console.log(`  - ${rule.rule_name} (${rule.rule_type}) - ${rule.approval_status} - Active: ${rule.is_active}`)
    })
  } else {
    console.log('Rules already exist, skipping seed')
  }
  
  console.log('\n✅ Done!')
} catch (error) {
  console.error('❌ Error:', error.message)
  console.error(error)
  process.exit(1)
}

