import { getDatabase } from '../database/init.js'

const db = getDatabase()

/**
 * Seed Additional Rules:
 * - IESBA category rules (standalone)
 * - Validation rules
 * - Conflict rules
 * - Custom rules
 */
export function seedAdditionalRules() {
  try {
    // Get Super Admin user for created_by
    const superAdmin = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('Super Admin')
    if (!superAdmin) {
      console.error('Super Admin user not found. Cannot seed additional rules.')
      return
    }
    const createdBy = superAdmin.id

    const rules = [
      // ========== IESBA Category Rules (Standalone) ==========
      {
        rule_name: 'IESBA: Auditor Independence - General Principle',
        rule_type: 'validation',
        rule_category: 'IESBA',
        condition_field: 'service_type',
        condition_operator: 'contains',
        condition_value: 'Audit',
        action_type: 'flag',
        action_value: 'Review required: Ensure no threats to auditor independence per IESBA Code Section 290',
        regulation_reference: 'IESBA Code Section 290 - Fundamental Principles',
        applies_to_pie: false,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString(),
        confidence_level: 'HIGH',
        can_override: 0,
        guidance_text: 'IESBA Code Section 290 requires auditors to identify and evaluate threats to independence. All audit engagements must be reviewed for potential independence threats.',
        override_guidance: 'Cannot override - fundamental principle'
      },
      {
        rule_name: 'IESBA: Self-Review Threat Detection',
        rule_type: 'conflict',
        rule_category: 'IESBA',
        condition_field: 'service_description',
        condition_operator: 'contains',
        condition_value: 'prepared financial statements,management decisions,internal controls design',
        action_type: 'block',
        action_value: 'CRITICAL: Self-review threat detected - auditor cannot audit own work per IESBA Code Section 290.113',
        regulation_reference: 'IESBA Code Section 290.113 - Self-Review Threats',
        applies_to_pie: false,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString(),
        confidence_level: 'CRITICAL',
        can_override: 0,
        guidance_text: 'Self-review threats occur when audit work is based on previous non-audit work performed by the same firm. This violates fundamental independence principles.',
        override_guidance: 'Cannot override - red line violation'
      },
      {
        rule_name: 'IESBA: Advocacy Threat - Litigation Support',
        rule_type: 'conflict',
        rule_category: 'IESBA',
        condition_field: 'service_type',
        condition_operator: 'contains',
        condition_value: 'Litigation Support,Dispute Resolution,Legal Representation',
        action_type: 'block',
        action_value: 'CRITICAL: Advocacy threat - acting as advocate violates independence per IESBA Code Section 290.107',
        regulation_reference: 'IESBA Code Section 290.107 - Advocacy Threats',
        applies_to_pie: false,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString(),
        confidence_level: 'CRITICAL',
        can_override: 0,
        guidance_text: 'Auditors cannot act as advocates for audit clients. This includes litigation support, dispute resolution, or legal representation services.',
        override_guidance: 'Cannot override - red line violation'
      },
      {
        rule_name: 'IESBA: Familiarity Threat - Long-Term Engagement',
        rule_type: 'validation',
        rule_category: 'IESBA',
        condition_field: 'engagement_duration',
        condition_operator: 'greater_than',
        condition_value: '5',
        action_type: 'flag',
        action_value: 'MEDIUM: Long-term engagement (>5 years) may create familiarity threat per IESBA Code Section 290.204',
        regulation_reference: 'IESBA Code Section 290.204 - Familiarity Threats',
        applies_to_pie: true,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString(),
        confidence_level: 'MEDIUM',
        can_override: 1,
        guidance_text: 'Long-term audit engagements may create familiarity threats. For PIE clients, rotation requirements apply after 5-7 years depending on jurisdiction.',
        override_guidance: 'May override with documented safeguards and rotation plan'
      },
      {
        rule_name: 'IESBA: Fee Dependence Threat',
        rule_type: 'validation',
        rule_category: 'IESBA',
        condition_field: 'total_fees',
        condition_operator: 'greater_than',
        condition_value: '15',
        action_type: 'flag',
        action_value: 'HIGH: Fee from single client exceeds 15% of total fees - dependence threat per IESBA Code Section 290.205',
        regulation_reference: 'IESBA Code Section 290.205 - Fee Dependence',
        applies_to_pie: true,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString(),
        confidence_level: 'HIGH',
        can_override: 1,
        guidance_text: 'When fees from a single client exceed 15% of total firm fees, a self-interest threat exists. For PIE clients, this threshold is stricter.',
        override_guidance: 'May override with documented safeguards and fee cap compliance'
      },

      // ========== Validation Rules ==========
      {
        rule_name: 'Validation: Required Fields Missing',
        rule_type: 'validation',
        rule_category: 'Custom',
        condition_field: 'client_name',
        condition_operator: 'equals',
        condition_value: '',
        action_type: 'block',
        action_value: 'Client name is required - cannot proceed without client identification',
        regulation_reference: '',
        applies_to_pie: false,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString(),
        confidence_level: 'HIGH',
        can_override: 0,
        guidance_text: 'All COI requests must include client name for proper identification and conflict checking.',
        override_guidance: 'Cannot override - required field'
      },
      {
        rule_name: 'Validation: Service Type Required',
        rule_type: 'validation',
        rule_category: 'Custom',
        condition_field: 'service_type',
        condition_operator: 'equals',
        condition_value: '',
        action_type: 'block',
        action_value: 'Service type is required - cannot determine conflicts without service classification',
        regulation_reference: '',
        applies_to_pie: false,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString(),
        confidence_level: 'HIGH',
        can_override: 0,
        guidance_text: 'Service type is essential for conflict detection and IESBA compliance checking.',
        override_guidance: 'Cannot override - required field'
      },
      {
        rule_name: 'Validation: PIE Status Must Be Specified',
        rule_type: 'validation',
        rule_category: 'Custom',
        condition_field: 'pie_status',
        condition_operator: 'equals',
        condition_value: '',
        action_type: 'flag',
        action_value: 'PIE status not specified - stricter rules may apply for PIE clients',
        regulation_reference: 'IESBA Code Section 290 - PIE Requirements',
        applies_to_pie: false,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString(),
        confidence_level: 'MEDIUM',
        can_override: 1,
        guidance_text: 'Public Interest Entity (PIE) status determines which IESBA rules apply. Missing status may result in incorrect conflict assessment.',
        override_guidance: 'May proceed if non-PIE status confirmed'
      },
      {
        rule_name: 'Validation: Engagement Start Date Required',
        rule_type: 'validation',
        rule_category: 'Custom',
        condition_field: 'engagement_start_date',
        condition_operator: 'equals',
        condition_value: '',
        action_type: 'flag',
        action_value: 'Engagement start date missing - required for duration and overlap checking',
        regulation_reference: '',
        applies_to_pie: false,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString(),
        confidence_level: 'MEDIUM',
        can_override: 1,
        guidance_text: 'Engagement dates are needed to check for overlapping services and duration-based threats.',
        override_guidance: 'May proceed with estimated dates'
      },
      {
        rule_name: 'Validation: Fee Amount Format',
        rule_type: 'validation',
        rule_category: 'Custom',
        condition_field: 'total_fees',
        condition_operator: 'not_equals',
        condition_value: 'numeric',
        action_type: 'flag',
        action_value: 'Fee amount must be numeric - invalid format detected',
        regulation_reference: '',
        applies_to_pie: false,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString(),
        confidence_level: 'MEDIUM',
        can_override: 0,
        guidance_text: 'Fee amounts must be numeric for proper calculation of fee dependence threats.',
        override_guidance: 'Cannot override - data format issue'
      },

      // ========== Conflict Rules ==========
      {
        rule_name: 'Conflict: Audit + Consulting for Same Client',
        rule_type: 'conflict',
        rule_category: 'Custom',
        condition_field: 'service_type',
        condition_operator: 'contains',
        condition_value: 'Audit,Consulting',
        action_type: 'block',
        action_value: 'HIGH: Audit and Consulting for same client creates independence threat',
        regulation_reference: 'IESBA Code Section 290',
        applies_to_pie: true,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString(),
        confidence_level: 'HIGH',
        can_override: 1,
        guidance_text: 'Providing consulting services to audit clients may create self-review and management participation threats.',
        override_guidance: 'May override with documented safeguards and separate engagement teams'
      },
      {
        rule_name: 'Conflict: Multiple Audit Engagements - Same Client',
        rule_type: 'conflict',
        rule_category: 'Custom',
        condition_field: 'service_type',
        condition_operator: 'contains',
        condition_value: 'Audit',
        action_type: 'flag',
        action_value: 'MEDIUM: Multiple audit engagements for same client - check for overlap and resource conflicts',
        regulation_reference: '',
        applies_to_pie: false,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString(),
        confidence_level: 'MEDIUM',
        can_override: 1,
        guidance_text: 'Multiple simultaneous audit engagements may create resource allocation issues and quality concerns.',
        override_guidance: 'May proceed if separate teams and no overlap confirmed'
      },
      {
        rule_name: 'Conflict: Tax + Advisory for PIE Client',
        rule_type: 'conflict',
        rule_category: 'Custom',
        condition_field: 'service_type',
        condition_operator: 'contains',
        condition_value: 'Tax,Advisory',
        action_type: 'block',
        action_value: 'HIGH: Tax and Advisory services for PIE audit client are restricted per IESBA',
        regulation_reference: 'IESBA Code Section 290',
        applies_to_pie: true,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString(),
        confidence_level: 'HIGH',
        can_override: 1,
        guidance_text: 'PIE audit clients have stricter restrictions on non-audit services. Tax planning and advisory services are generally prohibited.',
        override_guidance: 'May override only for tax compliance services with safeguards'
      },
      {
        rule_name: 'Conflict: Financial Interest in Client',
        rule_type: 'conflict',
        rule_category: 'Custom',
        condition_field: 'financial_interest',
        condition_operator: 'equals',
        condition_value: 'Yes',
        action_type: 'block',
        action_value: 'CRITICAL: Financial interest in audit client violates independence - immediate disqualification required',
        regulation_reference: 'IESBA Code Section 290.104',
        applies_to_pie: false,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString(),
        confidence_level: 'CRITICAL',
        can_override: 0,
        guidance_text: 'Any direct or material indirect financial interest in an audit client creates an unacceptable self-interest threat.',
        override_guidance: 'Cannot override - fundamental independence violation'
      },
      {
        rule_name: 'Conflict: Family Relationship with Client Management',
        rule_type: 'conflict',
        rule_category: 'Custom',
        condition_field: 'family_relationship',
        condition_operator: 'contains',
        condition_value: 'CEO,CFO,Director,Partner',
        action_type: 'flag',
        action_value: 'HIGH: Family relationship with client management may create familiarity threat',
        regulation_reference: 'IESBA Code Section 290.128',
        applies_to_pie: true,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString(),
        confidence_level: 'HIGH',
        can_override: 1,
        guidance_text: 'Close family relationships with client management may create familiarity threats. For PIE clients, restrictions are stricter.',
        override_guidance: 'May override with documented safeguards and independence review'
      },

      // ========== Custom Rules (5) ==========
      {
        rule_name: 'Custom: High-Value Engagement Review',
        rule_type: 'validation',
        rule_category: 'Custom',
        condition_field: 'total_fees',
        condition_operator: 'greater_than',
        condition_value: '1000000',
        action_type: 'flag',
        action_value: 'HIGH: Engagement value exceeds $1M - requires senior partner review',
        regulation_reference: '',
        applies_to_pie: false,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString(),
        confidence_level: 'MEDIUM',
        can_override: 1,
        guidance_text: 'High-value engagements require additional review to ensure proper resource allocation and quality standards.',
        override_guidance: 'May proceed with senior partner approval'
      },
      {
        rule_name: 'Custom: New Client Onboarding Check',
        rule_type: 'validation',
        rule_category: 'Custom',
        condition_field: 'client_relationship_duration',
        condition_operator: 'equals',
        condition_value: 'New',
        action_type: 'flag',
        action_value: 'MEDIUM: New client - perform enhanced due diligence and background check',
        regulation_reference: '',
        applies_to_pie: false,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString(),
        confidence_level: 'MEDIUM',
        can_override: 1,
        guidance_text: 'New clients require enhanced due diligence to identify potential conflicts and compliance issues before engagement.',
        override_guidance: 'May proceed after due diligence completion'
      },
      {
        rule_name: 'Custom: Cross-Border Engagement Flag',
        rule_type: 'validation',
        rule_category: 'Custom',
        condition_field: 'client_country',
        condition_operator: 'not_equals',
        condition_value: 'firm_country',
        action_type: 'flag',
        action_value: 'MEDIUM: Cross-border engagement - verify local regulations and licensing requirements',
        regulation_reference: '',
        applies_to_pie: false,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString(),
        confidence_level: 'MEDIUM',
        can_override: 1,
        guidance_text: 'Cross-border engagements require verification of local regulatory requirements and professional licensing.',
        override_guidance: 'May proceed after regulatory compliance confirmed'
      },
      {
        rule_name: 'Custom: Rapid Service Turnaround Alert',
        rule_type: 'validation',
        rule_category: 'Custom',
        condition_field: 'service_turnaround_days',
        condition_operator: 'less_than',
        condition_value: '7',
        action_type: 'flag',
        action_value: 'LOW: Rapid turnaround requested - ensure quality standards can be maintained',
        regulation_reference: '',
        applies_to_pie: false,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString(),
        confidence_level: 'LOW',
        can_override: 1,
        guidance_text: 'Rapid turnaround requests should be reviewed to ensure quality standards and professional standards are not compromised.',
        override_guidance: 'May proceed with quality assurance plan'
      },
      {
        rule_name: 'Custom: Industry Specialization Check',
        rule_type: 'validation',
        rule_category: 'Custom',
        condition_field: 'client_industry',
        condition_operator: 'in',
        condition_value: 'Financial Services,Banking,Insurance',
        action_type: 'flag',
        action_value: 'MEDIUM: Regulated industry client - verify specialized expertise and regulatory compliance',
        regulation_reference: '',
        applies_to_pie: false,
        is_active: 1,
        approval_status: 'Approved',
        created_by: createdBy,
        approved_by: createdBy,
        approved_at: new Date().toISOString(),
        confidence_level: 'MEDIUM',
        can_override: 1,
        guidance_text: 'Regulated industries require specialized expertise and additional regulatory compliance checks.',
        override_guidance: 'May proceed with specialized team assignment'
      }
    ]

    const stmt = db.prepare(`
      INSERT INTO business_rules_config (
        rule_name, rule_type, rule_category, condition_field, condition_operator, condition_value,
        action_type, action_value, regulation_reference, applies_to_pie, tax_sub_type,
        is_active, approval_status, created_by, approved_by, approved_at,
        confidence_level, can_override, guidance_text, override_guidance
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const transaction = db.transaction((rulesToInsert) => {
      let inserted = 0
      let skipped = 0
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
            rule.regulation_reference || null,
            rule.applies_to_pie ? 1 : 0,
            rule.tax_sub_type || null,
            rule.is_active,
            rule.approval_status,
            rule.created_by,
            rule.approved_by,
            rule.approved_at,
            rule.confidence_level || 'MEDIUM',
            rule.can_override !== undefined ? (rule.can_override ? 1 : 0) : 1,
            rule.guidance_text || null,
            rule.override_guidance || null
          )
          inserted++
        } catch (error) {
          if (error.message.includes('UNIQUE constraint') || error.message.includes('already exists')) {
            skipped++
          } else {
            console.error(`Error inserting rule "${rule.rule_name}":`, error.message)
          }
        }
      }
      return { inserted, skipped }
    })

    const result = transaction(rules)
    console.log(`✅ Seeded ${result.inserted} additional rules (${result.skipped} already existed)`)
    return result
  } catch (error) {
    console.error('Error seeding additional rules:', error)
    throw error
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAdditionalRules()
}
