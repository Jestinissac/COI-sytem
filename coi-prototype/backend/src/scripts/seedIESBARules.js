import { getDatabase } from '../database/init.js'

/**
 * Seed IESBA conflict rules into business_rules_config.
 * Migrates former CONFLICT_MATRIX logic into IESBA-category rules.
 * Pair evaluation is handled by evaluateIESBADecisionMatrix; these rules
 * provide visibility in Rule Builder and documentation.
 */
export function seedIESBARules() {
  const db = getDatabase()
  try {
    console.log('🌱 Seeding IESBA rules into business_rules_config...')

    const existing = db.prepare(`
      SELECT COUNT(*) as count FROM business_rules_config WHERE rule_category = 'IESBA'
    `).get()
    if (existing.count > 0) {
      console.log('✅ IESBA rules already seeded')
      return { inserted: 0, skipped: existing.count }
    }

    const superAdmin = db.prepare(`
      SELECT id FROM users WHERE role = 'Super Admin' OR role = 'Admin' ORDER BY id LIMIT 1
    `).get()
    const adminId = superAdmin?.id || 1

    const rules = [
      { name: 'IESBA: Audit + Advisory Blocked', field: 'service_type', op: 'contains', value: 'Statutory Audit,External Audit,Management Consulting,Business Advisory', action: 'recommend_reject', reason: 'Management consulting threatens auditor independence', reg: 'IESBA Code Section 290' },
      { name: 'IESBA: Audit + Accounting Blocked', field: 'service_type', op: 'contains', value: 'Statutory Audit,External Audit,Bookkeeping,Accounting Services', action: 'recommend_reject', reason: 'Cannot audit own bookkeeping work (self-review threat)', reg: 'IESBA Code Section 290' },
      { name: 'IESBA: Audit + Valuation Blocked', field: 'service_type', op: 'contains', value: 'Statutory Audit,External Audit,Valuation Services,Business Valuation', action: 'recommend_reject', reason: 'Cannot audit valuations we performed (self-review threat)', reg: 'IESBA Code Section 290' },
      { name: 'IESBA: Audit + Internal Audit Blocked', field: 'service_type', op: 'contains', value: 'Statutory Audit,External Audit,Internal Audit', action: 'recommend_reject', reason: 'Cannot outsource internal audit function for audit client', reg: 'IESBA Code Section 290' },
      { name: 'IESBA: Audit + Tax Planning Blocked', field: 'service_type', op: 'contains', value: 'Statutory Audit,External Audit,Tax Planning,Tax Advisory', action: 'recommend_reject', reason: 'Tax planning for audit client creates self-review threat - PROHIBITED', reg: 'IESBA Code Section 290.212' },
      { name: 'IESBA: Audit + Tax Compliance Flagged', field: 'service_type', op: 'contains', value: 'Statutory Audit,External Audit,Tax Compliance,Tax Return', action: 'recommend_review', reason: 'Tax compliance services require safeguards and fee cap review', reg: 'IESBA Code Section 290' },
      { name: 'IESBA: Audit + Due Diligence Flagged', field: 'service_type', op: 'contains', value: 'Statutory Audit,External Audit,Due Diligence,Transaction Advisory', action: 'recommend_review', reason: 'Due diligence may create self-review threat', reg: 'IESBA Code Section 290' },
      { name: 'IESBA: Audit + IT Advisory Flagged', field: 'service_type', op: 'contains', value: 'Statutory Audit,External Audit,IT Advisory,Cybersecurity', action: 'recommend_review', reason: 'IT systems advice may affect audit scope', reg: 'IESBA Code Section 290' }
    ]

    const insertStmt = db.prepare(`
      INSERT INTO business_rules_config (
        rule_name, rule_type, condition_field, condition_operator, condition_value,
        action_type, action_value, is_active, approval_status, created_by, approved_by, approved_at,
        rule_category, regulation_reference, applies_to_pie, applies_to_cma,
        confidence_level, can_override, guidance_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'Approved', ?, ?, datetime('now'), 'IESBA', ?, 0, 0, ?, ?, ?)
    `)

    let inserted = 0
    for (const r of rules) {
      const canOverride = r.action === 'recommend_review' ? 1 : 0
      const confidence = r.action === 'recommend_reject' ? 'HIGH' : 'MEDIUM'
      insertStmt.run(
        r.name,
        'conflict',
        r.field,
        r.op,
        r.value,
        r.action,
        r.reason,
        adminId,
        adminId,
        r.reg,
        confidence,
        canOverride,
        r.reason
      )
      inserted++
    }

    console.log(`✅ Seeded ${inserted} IESBA rules`)
    return { inserted, skipped: 0 }
  } catch (error) {
    console.error('Error seeding IESBA rules:', error)
    return { inserted: 0, skipped: 0 }
  }
}
