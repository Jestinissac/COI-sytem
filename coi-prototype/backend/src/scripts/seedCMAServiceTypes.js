import { getDatabase } from '../database/init.js'

/**
 * Seed CMA Service Types
 * Based on CMA Matrix - 9 service types
 */
export function seedCMAServiceTypes() {
  const db = getDatabase()
  
  try {
    console.log('🌱 Seeding CMA Service Types...')

    // Check if already seeded
    const existingCount = db.prepare('SELECT COUNT(*) as count FROM cma_service_types').get()
    if (existingCount.count > 0) {
      console.log('✅ CMA Service Types already seeded')
      return { inserted: existingCount.count, skipped: 0 }
    }

    const serviceTypes = [
      {
        service_code: 'EXTERNAL_AUDIT',
        service_name_en: 'External Audit',
        service_name_ar: 'التدقيق الخارجي',
        legal_reference: 'General audit requirements',
        module_reference: null
      },
      {
        service_code: 'INTERNAL_AUDIT',
        service_name_en: 'Internal Audit',
        service_name_ar: 'التدقيق الداخلي',
        legal_reference: 'General internal audit',
        module_reference: null
      },
      {
        service_code: 'RISK_MANAGEMENT',
        service_name_en: 'Risk Management',
        service_name_ar: 'إدارة المخاطر',
        legal_reference: 'General risk management',
        module_reference: null
      },
      {
        service_code: 'INT_CTRL_REVIEW_CMA',
        service_name_en: 'Review the Internal Control Systems',
        service_name_ar: 'مراجعة أنظمة الرقابة الداخلية',
        legal_reference: 'Article 6-9',
        module_reference: 'Module Fifteen (Corporate Governance)'
      },
      {
        service_code: 'INT_AUDIT_PERF_REVIEW',
        service_name_en: 'Review, evaluate the performance of the internal audit management/firm/unit',
        service_name_ar: 'مراجعة وتقييم أداء إدارة/شركة/وحدة التدقيق الداخلي',
        legal_reference: 'Article 6-9',
        module_reference: 'Module Fifteen (Corporate Governance)'
      },
      {
        service_code: 'AML_CFT_ASSESSMENT',
        service_name_en: 'Assessment on the level of compliance with all legislative requirements and determinants set forth in the Anti-Money Laundering and Combating Financing of Terrorism Law',
        service_name_ar: 'تقييم مستوى الامتثال لجميع المتطلبات والمحددات التشريعية المنصوص عليها في قانون مكافحة غسل الأموال ومكافحة تمويل الإرهاب',
        legal_reference: 'Article 7-7',
        module_reference: 'Module Sixteen (Anti-Money Laundering and Combating Financing of Terrorism)'
      },
      {
        service_code: 'INVESTMENT_ADVISOR',
        service_name_en: 'An Investment Advisor',
        service_name_ar: 'مستشار استثماري',
        legal_reference: 'Articles 2-9, 3-1-5, 4-1-8, 5-9',
        module_reference: 'Module Nine (Mergers and Acquisitions)'
      },
      {
        service_code: 'ASSET_VALUATION',
        service_name_en: 'Valuation of the assets',
        service_name_ar: 'تقييم الأصول',
        legal_reference: 'Articles 2-10, 5-10',
        module_reference: 'Module Nine (Mergers and Acquisitions)'
      },
      {
        service_code: 'CAPITAL_ADEQUACY_REVIEW',
        service_name_en: 'Review the capital adequacy report',
        service_name_ar: 'مراجعة تقرير كفاية رأس المال',
        legal_reference: 'Article 2-3',
        module_reference: 'Module Seventeen'
      }
    ]

    const insertStmt = db.prepare(`
      INSERT INTO cma_service_types 
      (service_code, service_name_en, service_name_ar, legal_reference, module_reference)
      VALUES (?, ?, ?, ?, ?)
    `)

    const insertMany = db.transaction((services) => {
      let inserted = 0
      for (const service of services) {
        try {
          insertStmt.run(
            service.service_code,
            service.service_name_en,
            service.service_name_ar || null,
            service.legal_reference,
            service.module_reference || null
          )
          inserted++
        } catch (error) {
          if (!error.message.includes('UNIQUE constraint')) {
            console.error(`Error inserting ${service.service_code}:`, error.message)
          }
        }
      }
      return inserted
    })

    const inserted = insertMany(serviceTypes)
    console.log(`✅ Seeded ${inserted} CMA Service Types`)

    return { inserted, skipped: serviceTypes.length - inserted }
  } catch (error) {
    console.error('❌ Error seeding CMA Service Types:', error)
    throw error
  }
}
