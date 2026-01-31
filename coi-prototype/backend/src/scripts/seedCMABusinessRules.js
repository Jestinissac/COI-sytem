import { getDatabase } from '../database/init.js'

/**
 * Seed CMA rules into business_rules_config for Rule Builder display.
 * Reads from cma_combination_rules (enforcement stays there); these rows
 * give visibility in the Business Rules UI under the CMA category.
 */
export function seedCMABusinessRules() {
  const db = getDatabase()
  try {
    console.log('🌱 Seeding CMA rules into business_rules_config...')

    const existing = db.prepare(`
      SELECT COUNT(*) as count FROM business_rules_config WHERE rule_category = 'CMA'
    `).get()
    if (existing.count > 0) {
      console.log('✅ CMA business rules already seeded')
      return { inserted: 0, skipped: existing.count }
    }

    // Ensure cma_combination_rules and cma_service_types exist and are populated
    const cmaCount = db.prepare('SELECT COUNT(*) as count FROM cma_combination_rules').get()
    if (cmaCount.count === 0) {
      console.log('⚠️ cma_combination_rules empty; run CMA seed first. Skipping CMA business rules.')
      return { inserted: 0, skipped: 0 }
    }

    const superAdmin = db.prepare(`
      SELECT id FROM users WHERE role = 'Super Admin' OR role = 'Admin' ORDER BY id LIMIT 1
    `).get()
    const adminId = superAdmin?.id || 1

    const rows = db.prepare(`
      SELECT r.*,
             a.service_name_en AS service_a_name,
             b.service_name_en AS service_b_name
      FROM cma_combination_rules r
      LEFT JOIN cma_service_types a ON r.service_a_code = a.service_code
      LEFT JOIN cma_service_types b ON r.service_b_code = b.service_code
      ORDER BY r.service_a_code, r.service_b_code
    `).all()

    const insertStmt = db.prepare(`
      INSERT INTO business_rules_config (
        rule_name, rule_type, condition_field, condition_operator, condition_value,
        action_type, action_value, is_active, approval_status, created_by, approved_by, approved_at,
        rule_category, regulation_reference, applies_to_pie, applies_to_cma,
        confidence_level, can_override, guidance_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'Approved', ?, ?, datetime('now'), 'CMA', ?, 0, 1, ?, ?, ?)
    `)

    let inserted = 0
    for (const row of rows) {
      const nameA = row.service_a_name || row.service_a_code || 'Service A'
      const nameB = row.service_b_name || row.service_b_code || 'Service B'
      const label = row.allowed ? 'Conditional (independent teams)' : 'Prohibited'
      const ruleName = `CMA: ${nameA} + ${nameB} – ${label}`
      const actionType = row.allowed ? 'recommend_review' : 'recommend_reject'
      const canOverride = row.allowed ? 1 : 0
      const confidence = row.allowed ? 'MEDIUM' : 'HIGH'
      const reg = row.legal_reference || 'CMA Law No. 7 of 2010'

      insertStmt.run(
        ruleName,
        'conflict',
        'service_type',
        'contains',
        `${nameA},${nameB}`,
        actionType,
        row.reason_text || '',
        adminId,
        adminId,
        reg,
        confidence,
        canOverride,
        row.reason_text || ''
      )
      inserted++
    }

    console.log(`✅ Seeded ${inserted} CMA rules into business_rules_config`)
    return { inserted, skipped: 0 }
  } catch (error) {
    console.error('Error seeding CMA business rules:', error)
    return { inserted: 0, skipped: 0 }
  }
}
