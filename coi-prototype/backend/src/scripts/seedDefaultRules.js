import { getDatabase } from '../database/init.js'

const db = getDatabase()

/**
 * Seed default conflict rules into the database
 * These are the three standard conflict rules shown in the Compliance Dashboard
 */
export function seedDefaultRules() {
  try {
    // Check if rules already exist
    const ruleCount = db.prepare('SELECT COUNT(*) as count FROM business_rules_config').get().count
    if (ruleCount > 0) {
      console.log('Default rules already exist, skipping seed')
      return
    }

    // Get Super Admin user ID (or first admin user)
    const superAdmin = db.prepare(`
      SELECT id FROM users 
      WHERE role = 'Super Admin' OR role = 'Admin' 
      ORDER BY id LIMIT 1
    `).get()
    
    const adminId = superAdmin?.id || 1 // Fallback to user ID 1 if no admin found
    
    const defaultRules = [
      // Red Line Rules (will be detected by redLinesService in Pro, but also stored as rules)
      {
        rule_name: 'Red Line: Management Responsibility',
        rule_type: 'red_line',
        condition_field: 'service_description',
        condition_operator: 'contains',
        condition_value: 'management responsibility,managing financial statements',
        action_type: 'recommend_reject',
        action_value: 'Management responsibility for financial statements is a red line per IESBA Code Section 290.104',
        is_active: 1,
        approval_status: 'Approved',
        created_by: adminId,
        approved_by: adminId,
        approved_at: new Date().toISOString()
      },
      {
        rule_name: 'Red Line: Advocacy',
        rule_type: 'red_line',
        condition_field: 'service_description',
        condition_operator: 'contains',
        condition_value: 'advocate,advocacy,representing client in litigation',
        action_type: 'recommend_reject',
        action_value: 'Acting as advocate for client is a red line per IESBA Code Section 290.105',
        is_active: 1,
        approval_status: 'Approved',
        created_by: adminId,
        approved_by: adminId,
        approved_at: new Date().toISOString()
      },
      {
        rule_name: 'Red Line: Contingent Fees',
        rule_type: 'red_line',
        condition_field: 'service_description',
        condition_operator: 'contains',
        condition_value: 'contingent fee,contingency fee,success fee',
        action_type: 'recommend_reject',
        action_value: 'Contingent fees for audit clients are a red line per IESBA Code Section 290.106',
        is_active: 1,
        approval_status: 'Approved',
        created_by: adminId,
        approved_by: adminId,
        approved_at: new Date().toISOString()
      },
      // IESBA PIE + Tax Rules
      {
        rule_name: 'PIE + Tax Planning Prohibition',
        rule_type: 'pie_tax',
        condition_field: 'service_type',
        condition_operator: 'contains',
        condition_value: 'Tax Planning,Tax Advisory',
        action_type: 'recommend_reject',
        action_value: 'PIE: Tax Planning is prohibited per IESBA Code Section 290.212',
        is_active: 1,
        approval_status: 'Approved',
        created_by: adminId,
        approved_by: adminId,
        approved_at: new Date().toISOString()
      },
      {
        rule_name: 'PIE + Tax Compliance Review',
        rule_type: 'pie_tax',
        condition_field: 'service_type',
        condition_operator: 'contains',
        condition_value: 'Tax Compliance',
        action_type: 'recommend_flag',
        action_value: 'PIE: Tax Compliance requires enhanced safeguards per IESBA Code Section 290.212',
        is_active: 1,
        approval_status: 'Approved',
        created_by: adminId,
        approved_by: adminId,
        approved_at: new Date().toISOString()
      },
      // Standard Conflict Rules
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
        condition_field: null, // This is a complex rule that needs custom logic
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
    return defaultRules.length
  } catch (error) {
    if (error.message.includes('no such table')) {
      console.log('business_rules_config table does not exist yet')
      return 0
    }
    console.error('Error seeding default rules:', error.message)
    throw error
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDefaultRules()
}

