import { getDatabase } from '../database/init.js'

/**
 * Seed CMA Combination Rules
 * All 36 unique combinations from CMA Matrix
 * Rules are bidirectional (A+B = B+A)
 */
export function seedCMARules() {
  const db = getDatabase()
  try {
    console.log('🌱 Seeding CMA Combination Rules...')

    // First, seed condition codes
    seedCMAConditionCodes()

    // Check if already seeded
    const existingCount = db.prepare('SELECT COUNT(*) as count FROM cma_combination_rules').get()
    if (existingCount.count > 0) {
      console.log('✅ CMA Combination Rules already seeded')
      return { inserted: existingCount.count, skipped: 0 }
    }

    // All 36 combinations (bidirectional - stored once, checked both ways)
    const rules = [
      // Row 1: External Audit Combinations (8 rules)
      { a: 'EXTERNAL_AUDIT', b: 'INTERNAL_AUDIT', allowed: false, condition: null, severity: 'BLOCKED', legal: null, reason: "Overlap of two services. When the internal audit service is linked to the administrative executive aspect of the company, the firm's independence to perform the external audit is violated" },
      { a: 'EXTERNAL_AUDIT', b: 'RISK_MANAGEMENT', allowed: false, condition: null, severity: 'BLOCKED', legal: null, reason: "When the risk management service is linked to the administrative executive aspect of the company, the firm's independence to perform the external audit is violated" },
      { a: 'EXTERNAL_AUDIT', b: 'INT_CTRL_REVIEW_CMA', allowed: true, condition: 'INDEPENDENT_TEAMS', severity: 'CONDITIONAL', legal: null, reason: "Provided that both of two services should be assigned to two independent teams and lack of any other reasons that might affect the independence" },
      { a: 'EXTERNAL_AUDIT', b: 'INT_AUDIT_PERF_REVIEW', allowed: true, condition: 'INDEPENDENT_TEAMS', severity: 'CONDITIONAL', legal: null, reason: "Provided that both of two services should be assigned to two independent teams and lack of any other reasons that might affect the independence" },
      { a: 'EXTERNAL_AUDIT', b: 'AML_CFT_ASSESSMENT', allowed: true, condition: 'INDEPENDENT_TEAMS', severity: 'CONDITIONAL', legal: null, reason: "Provided that both of two services should be assigned to two independent teams and lack of any other reasons that might affect the independence" },
      { a: 'EXTERNAL_AUDIT', b: 'INVESTMENT_ADVISOR', allowed: false, condition: null, severity: 'BLOCKED', legal: 'Module Nine, Articles 2-9, 3-1-5, 4-1-8, 5-9', reason: "According to provisions of articles 2-9, 3-1-5, 4-1-8 and 5-9 of Module Nine (Mergers and Acquisitions) of the executive bylaws" },
      { a: 'EXTERNAL_AUDIT', b: 'ASSET_VALUATION', allowed: false, condition: null, severity: 'BLOCKED', legal: 'Module Nine, Articles 2-10, 5-10', reason: "According to provisions of articles 2-10 and 5-10 of Module Nine (Mergers and Acquisitions) of the executive bylaws" },
      { a: 'EXTERNAL_AUDIT', b: 'CAPITAL_ADEQUACY_REVIEW', allowed: true, condition: 'INDEPENDENT_TEAMS', severity: 'CONDITIONAL', legal: null, reason: "Provided that both of two services should be assigned to two independent teams and lack of any other reasons that might affect the independence" },
      
      // Row 2: Internal Audit Combinations (7 rules)
      { a: 'INTERNAL_AUDIT', b: 'RISK_MANAGEMENT', allowed: true, condition: 'INDEPENDENT_TEAMS', severity: 'CONDITIONAL', legal: null, reason: "Provided that both of two services should be assigned to two independent teams and lack of any other reasons that might affect the independence" },
      { a: 'INTERNAL_AUDIT', b: 'INT_CTRL_REVIEW_CMA', allowed: false, condition: null, severity: 'BLOCKED', legal: null, reason: "When the internal audit service is linked to the administrative executive aspect of the company, the firm's independence to review the internal control systems is violated" },
      { a: 'INTERNAL_AUDIT', b: 'INT_AUDIT_PERF_REVIEW', allowed: false, condition: null, severity: 'BLOCKED', legal: null, reason: "When the internal audit service is linked to the administrative executive aspect of the company, the firm's independence to review, evaluate the performance of the internal audit management/firm/unit is violated" },
      { a: 'INTERNAL_AUDIT', b: 'AML_CFT_ASSESSMENT', allowed: false, condition: null, severity: 'BLOCKED', legal: null, reason: "When the internal audit service is linked to the administrative executive aspect of the company, the firm's independence to assess the level of compliance with all legislative requirements and determinants related to the Anti-Money Laundering and Combating Financing of Terrorism Law is violated" },
      { a: 'INTERNAL_AUDIT', b: 'INVESTMENT_ADVISOR', allowed: false, condition: null, severity: 'BLOCKED', legal: 'Module Nine, Articles 2-9, 3-1-5, 4-1-8, 5-9', reason: "According to provisions of articles 2-9, 3-1-5, 4-1-8 and 5-9 of Module Nine (Mergers and Acquisitions) of the executive bylaws" },
      { a: 'INTERNAL_AUDIT', b: 'ASSET_VALUATION', allowed: false, condition: null, severity: 'BLOCKED', legal: 'Module Nine, Articles 2-10, 5-10', reason: "According to provisions of articles 2-10 and 5-10 of Module Nine (Mergers and Acquisitions) of the executive bylaws" },
      { a: 'INTERNAL_AUDIT', b: 'CAPITAL_ADEQUACY_REVIEW', allowed: false, condition: null, severity: 'BLOCKED', legal: null, reason: "Overlap of two services. When the internal audit service is linked to the administrative executive aspect of the company, the firm's independence to review the capital adequacy report is violated" },
      
      // Row 3: Risk Management Combinations (6 rules)
      { a: 'RISK_MANAGEMENT', b: 'INT_CTRL_REVIEW_CMA', allowed: false, condition: null, severity: 'BLOCKED', legal: null, reason: "When the risk management service is linked to the administrative executive aspect of the company, the firm's independence to review the internal control systems is violated" },
      { a: 'RISK_MANAGEMENT', b: 'INT_AUDIT_PERF_REVIEW', allowed: false, condition: null, severity: 'BLOCKED', legal: null, reason: "When the risk management service is linked to the administrative executive aspect of the company, the firm's independence to review, evaluate the performance of the internal audit management/firm/unit is violated" },
      { a: 'RISK_MANAGEMENT', b: 'AML_CFT_ASSESSMENT', allowed: false, condition: null, severity: 'BLOCKED', legal: null, reason: "When the internal risk management is linked to the administrative executive aspect of the company, the firm's independence to assess the level of compliance with all legislative requirements and determinants related to the Anti-Money Laundering and Combating Financing of Terrorism Law is violated" },
      { a: 'RISK_MANAGEMENT', b: 'INVESTMENT_ADVISOR', allowed: false, condition: null, severity: 'BLOCKED', legal: 'Module Nine, Articles 2-9, 3-1-5, 4-1-8, 5-9', reason: "According to provisions of articles 2-9, 3-1-5, 4-1-8 and 5-9 of Module Nine (Mergers and Acquisitions) of the executive bylaws" },
      { a: 'RISK_MANAGEMENT', b: 'ASSET_VALUATION', allowed: false, condition: null, severity: 'BLOCKED', legal: 'Module Nine, Articles 2-10, 5-10', reason: "According to provisions of articles 2-10 and 5-10 of Module Nine (Mergers and Acquisitions) of the executive bylaws" },
      { a: 'RISK_MANAGEMENT', b: 'CAPITAL_ADEQUACY_REVIEW', allowed: false, condition: null, severity: 'BLOCKED', legal: null, reason: "Overlap of two services. When the risk management service is linked to the administrative executive aspect of the company, the firm's independence to review the capital adequacy report is violated" },
      
      // Row 4: Internal Control Review Combinations (5 rules)
      { a: 'INT_CTRL_REVIEW_CMA', b: 'INT_AUDIT_PERF_REVIEW', allowed: false, condition: null, severity: 'BLOCKED', legal: 'Module Fifteen, Article 6-9', reason: "According to provisions of article 6-9 of Module Fifteen (Corporate Governance) of the executive bylaws" },
      { a: 'INT_CTRL_REVIEW_CMA', b: 'AML_CFT_ASSESSMENT', allowed: true, condition: 'INDEPENDENT_TEAMS', severity: 'CONDITIONAL', legal: null, reason: "Provided that both of two services should be assigned to two independent teams and lack of any other reasons that might affect the independence" },
      { a: 'INT_CTRL_REVIEW_CMA', b: 'INVESTMENT_ADVISOR', allowed: false, condition: null, severity: 'BLOCKED', legal: 'Module Nine, Articles 2-9, 3-1-5, 4-1-8, 5-9', reason: "According to provisions of articles 2-9, 3-1-5, 4-1-8 and 5-9 of Module Nine (Mergers and Acquisitions) of the executive bylaws" },
      { a: 'INT_CTRL_REVIEW_CMA', b: 'ASSET_VALUATION', allowed: false, condition: null, severity: 'BLOCKED', legal: 'Module Nine, Articles 2-10, 5-10', reason: "According to provisions of articles 2-10 and 5-10 of Module Nine (Mergers and Acquisitions) of the executive bylaws" },
      { a: 'INT_CTRL_REVIEW_CMA', b: 'CAPITAL_ADEQUACY_REVIEW', allowed: true, condition: 'INDEPENDENT_TEAMS', severity: 'CONDITIONAL', legal: null, reason: "Provided that both of two services should be assigned to two independent teams and lack of any other reasons that might affect the independence" },
      
      // Row 5: Internal Audit Performance Review Combinations (4 rules)
      { a: 'INT_AUDIT_PERF_REVIEW', b: 'AML_CFT_ASSESSMENT', allowed: true, condition: 'INDEPENDENT_TEAMS', severity: 'CONDITIONAL', legal: null, reason: "Provided that both of two services should be assigned to two independent teams and lack of any other reasons that might affect the independence" },
      { a: 'INT_AUDIT_PERF_REVIEW', b: 'INVESTMENT_ADVISOR', allowed: false, condition: null, severity: 'BLOCKED', legal: 'Module Nine, Articles 2-9, 3-1-5, 4-1-8, 5-9', reason: "According to provisions of articles 2-9, 3-1-5, 4-1-8 and 5-9 of Module Nine (Mergers and Acquisitions) of the executive bylaws" },
      { a: 'INT_AUDIT_PERF_REVIEW', b: 'ASSET_VALUATION', allowed: false, condition: null, severity: 'BLOCKED', legal: 'Module Nine, Articles 2-10, 5-10', reason: "According to provisions of articles 2-10 and 5-10 of Module Nine (Mergers and Acquisitions) of the executive bylaws" },
      { a: 'INT_AUDIT_PERF_REVIEW', b: 'CAPITAL_ADEQUACY_REVIEW', allowed: true, condition: 'INDEPENDENT_TEAMS', severity: 'CONDITIONAL', legal: null, reason: "Provided that both of two services should be assigned to two independent teams and lack of any other reasons that might affect the independence" },
      
      // Row 6: AML Assessment Combinations (3 rules)
      { a: 'AML_CFT_ASSESSMENT', b: 'INVESTMENT_ADVISOR', allowed: false, condition: null, severity: 'BLOCKED', legal: 'Module Nine, Articles 2-9, 3-1-5, 4-1-8, 5-9', reason: "According to provisions of articles 2-9, 3-1-5, 4-1-8 and 5-9 of Module Nine (Mergers and Acquisitions) of the executive bylaws" },
      { a: 'AML_CFT_ASSESSMENT', b: 'ASSET_VALUATION', allowed: false, condition: null, severity: 'BLOCKED', legal: 'Module Nine, Articles 2-10, 5-10', reason: "According to provisions of articles 2-10 and 5-10 of Module Nine (Mergers and Acquisitions) of the executive bylaws" },
      { a: 'AML_CFT_ASSESSMENT', b: 'CAPITAL_ADEQUACY_REVIEW', allowed: true, condition: 'INDEPENDENT_TEAMS', severity: 'CONDITIONAL', legal: null, reason: "Provided that both of two services should be assigned to two independent teams and lack of any other reasons that might affect the independence" },
      
      // Row 7: Investment Advisor Combinations (2 rules)
      { a: 'INVESTMENT_ADVISOR', b: 'ASSET_VALUATION', allowed: false, condition: null, severity: 'BLOCKED', legal: 'Module Nine, Articles 2-9, 3-1-5', reason: "According to provisions of articles 2-9 and 3-1-5 of Module Nine (Mergers and Acquisitions) of the executive bylaws" },
      { a: 'INVESTMENT_ADVISOR', b: 'CAPITAL_ADEQUACY_REVIEW', allowed: false, condition: null, severity: 'BLOCKED', legal: 'Module Nine, Articles 2-9, 3-1-5, 4-1-8, 5-9', reason: "According to provisions of articles 2-9, 3-1-5, 4-1-8 and 5-9 of Module Nine (Mergers and Acquisitions) of the executive bylaws" },
      
      // Row 8: Asset Valuation Combinations (1 rule)
      { a: 'ASSET_VALUATION', b: 'CAPITAL_ADEQUACY_REVIEW', allowed: false, condition: null, severity: 'BLOCKED', legal: 'Module Nine, Article 2-10', reason: "According to provisions of articles 2-10 of Module Nine (Mergers and Acquisitions) of the executive bylaws" }
    ]

    const insertStmt = db.prepare(`
      INSERT INTO cma_combination_rules 
      (service_a_code, service_b_code, allowed, condition_code, severity_level, legal_reference, reason_text)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const insertMany = db.transaction((rules) => {
      let inserted = 0
      for (const rule of rules) {
        try {
          insertStmt.run(
            rule.a,
            rule.b,
            rule.allowed ? 1 : 0,
            rule.condition || null,
            rule.severity,
            rule.legal || null,
            rule.reason
          )
          inserted++
        } catch (error) {
          if (!error.message.includes('UNIQUE constraint')) {
            console.error(`Error inserting rule ${rule.a} + ${rule.b}:`, error.message)
          }
        }
      }
      return inserted
    })

    const inserted = insertMany(rules)
    console.log(`✅ Seeded ${inserted} CMA Combination Rules`)

    return { inserted, skipped: rules.length - inserted }
  } catch (error) {
    console.error('❌ Error seeding CMA Combination Rules:', error)
    throw error
  }
}

/**
 * Seed CMA Condition Codes
 */
function seedCMAConditionCodes() {
  const db = getDatabase()
  try {
    const conditionCodes = [
      {
        code: 'INDEPENDENT_TEAMS',
        description: 'Provided that both of two services should be assigned to two independent teams and lack of any other reasons that might affect the independence',
        requires_manual_review: 1
      }
    ]

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO cma_condition_codes (code, description, requires_manual_review)
      VALUES (?, ?, ?)
    `)

    for (const condition of conditionCodes) {
      insertStmt.run(condition.code, condition.description, condition.requires_manual_review)
    }

    console.log('✅ Seeded CMA Condition Codes')
  } catch (error) {
    console.error('❌ Error seeding CMA Condition Codes:', error)
    // Don't throw - condition codes may already exist
  }
}
