import { getDatabase } from '../database/init.js'

const db = getDatabase()

/**
 * Seed IESBA-Compliant Rules
 * Pro Version: All rules return recommendations (not auto-actions)
 * Compliance team maintains full control
 */
export function seedIESBARules() {
  try {
    // Get Super Admin user for created_by
    const superAdmin = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('Super Admin')
    if (!superAdmin) {
      console.error('Super Admin user not found. Cannot seed IESBA rules.')
      return
    }
    const createdBy = superAdmin.id

    const rules = [
      // Red Lines Rules
      {
        rule_name: 'Red Line: Management Responsibility',
        rule_type: 'conflict',
        rule_category: 'Red Line',
        condition_field: 'service_description',
        condition_operator: 'contains',
        condition_value: 'management responsibility,financial statements preparation,management decision',
        action_type: 'block',
        action_value: 'CRITICAL: Management responsibility violates auditor independence per IESBA Code Section 290.104',
        regulation_reference: 'IESBA Code Section 290.104',
        applies_to_pie: false, // Applies to all clients
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString()
      },
      {
        rule_name: 'Red Line: Advocacy',
        rule_type: 'conflict',
        rule_category: 'Red Line',
        condition_field: 'service_description',
        condition_operator: 'contains',
        condition_value: 'advocate,litigation support,court representation,dispute resolution',
        action_type: 'block',
        action_value: 'CRITICAL: Acting as advocate violates auditor independence per IESBA Code Section 290',
        regulation_reference: 'IESBA Code Section 290',
        applies_to_pie: false,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString()
      },
      {
        rule_name: 'Red Line: Contingent Fees',
        rule_type: 'conflict',
        rule_category: 'Red Line',
        condition_field: 'service_description',
        condition_operator: 'contains',
        condition_value: 'contingent fee,success fee,performance based fee,outcome based',
        action_type: 'block',
        action_value: 'CRITICAL: Contingent fees violate auditor independence per IESBA Code Section 290',
        regulation_reference: 'IESBA Code Section 290',
        applies_to_pie: false,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString()
      },
      
      // PIE Rules
      {
        rule_name: 'PIE: Tax Planning Prohibited',
        rule_type: 'conflict',
        rule_category: 'PIE',
        condition_field: 'pie_status',
        condition_operator: 'equals',
        condition_value: 'Yes',
        action_type: 'block',
        action_value: 'HIGH: Tax Planning for PIE audit client is prohibited per IESBA Code Section 290',
        regulation_reference: 'IESBA Code Section 290',
        applies_to_pie: true,
        tax_sub_type: 'TAX_PLANNING',
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString()
      },
      {
        rule_name: 'PIE: Tax Compliance Requires Safeguards',
        rule_type: 'conflict',
        rule_category: 'PIE',
        condition_field: 'pie_status',
        condition_operator: 'equals',
        condition_value: 'Yes',
        action_type: 'flag',
        action_value: 'MEDIUM: Tax Compliance for PIE requires safeguards and fee cap review per IESBA Code Section 290',
        regulation_reference: 'IESBA Code Section 290',
        applies_to_pie: true,
        tax_sub_type: 'TAX_COMPLIANCE',
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString()
      },
      {
        rule_name: 'PIE: Advisory Services Prohibited',
        rule_type: 'conflict',
        rule_category: 'PIE',
        condition_field: 'pie_status',
        condition_operator: 'equals',
        condition_value: 'Yes',
        action_type: 'block',
        action_value: 'HIGH: Advisory services for PIE audit client are prohibited per IESBA Code Section 290',
        regulation_reference: 'IESBA Code Section 290',
        applies_to_pie: true,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString()
      },
      
      // Tax Service Rules
      {
        rule_name: 'Audit + Tax Planning (PIE) - Prohibited',
        rule_type: 'conflict',
        rule_category: 'Tax',
        condition_field: 'service_type',
        condition_operator: 'contains',
        condition_value: 'Tax Planning,Tax Strategy',
        action_type: 'block',
        action_value: 'HIGH: Tax Planning for PIE audit client is prohibited - cannot override',
        regulation_reference: 'IESBA Code Section 290',
        applies_to_pie: true,
        tax_sub_type: 'TAX_PLANNING',
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString()
      },
      {
        rule_name: 'Audit + Tax Planning (Non-PIE) - Requires Safeguards',
        rule_type: 'conflict',
        rule_category: 'Tax',
        condition_field: 'service_type',
        condition_operator: 'contains',
        condition_value: 'Tax Planning,Tax Strategy',
        action_type: 'flag',
        action_value: 'MEDIUM: Tax Planning for non-PIE audit client requires safeguards and review',
        regulation_reference: 'IESBA Code Section 290',
        applies_to_pie: false,
        tax_sub_type: 'TAX_PLANNING',
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString()
      },
      {
        rule_name: 'Audit + Tax Compliance - Likely Approved',
        rule_type: 'conflict',
        rule_category: 'Tax',
        condition_field: 'service_type',
        condition_operator: 'contains',
        condition_value: 'Tax Compliance,Tax Return',
        action_type: 'flag',
        action_value: 'LOW: Tax Compliance usually approved with safeguards and fee cap compliance',
        regulation_reference: 'IESBA Code Section 290',
        applies_to_pie: false,
        tax_sub_type: 'TAX_COMPLIANCE',
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString()
      }
    ]

    const stmt = db.prepare(`
      INSERT INTO business_rules_config (
        rule_name, rule_type, rule_category, condition_field, condition_operator, condition_value,
        action_type, action_value, regulation_reference, applies_to_pie, tax_sub_type,
        is_active, approval_status, created_by, approved_by, approved_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const transaction = db.transaction((rulesToInsert) => {
      for (const rule of rulesToInsert) {
        try {
          stmt.run(
            rule.rule_name,
            rule.rule_type,
            rule.rule_category,
            rule.condition_field,
            rule.condition_operator,
            rule.condition_value,
            rule.action_type,
            rule.action_value,
            rule.regulation_reference,
            rule.applies_to_pie ? 1 : 0,
            rule.tax_sub_type || null,
            rule.is_active,
            rule.approval_status,
            rule.created_by,
            rule.approved_by,
            rule.approved_at
          )
        } catch (error) {
          if (!error.message.includes('UNIQUE constraint')) {
            console.error(`Error inserting rule "${rule.rule_name}":`, error.message)
          }
        }
      }
    })

    transaction(rules)
    console.log(`✅ Seeded ${rules.length} IESBA-compliant rules`)
  } catch (error) {
    console.error('Error seeding IESBA rules:', error)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedIESBARules()
}

