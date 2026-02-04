import { getDatabase } from '../database/init.js'

const db = getDatabase()

/**
 * Generate service code from service name
 */
function generateServiceCode(category, serviceName) {
  const categoryCode = category
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .toUpperCase()
    .substring(0, 20)
  
  const serviceCode = serviceName
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .toUpperCase()
    .substring(0, 30)
  
  const code = `${categoryCode}_${serviceCode}`
  return code.substring(0, 50)
}

/**
 * Seed Kuwait Local Service Catalog (39 services from COI Template)
 * This is the local/Kuwait-specific list that matches the COI Template dropdown
 */
export function seedKuwaitServiceCatalog() {
  console.log('🌱 Seeding Kuwait Local Service Catalog from COI Template...')
  
  // Kuwait Template Service List (39 services organized by category)
  const kuwaitServiceList = [
    // Audit & Assurance (5 services)
    {
      category: 'Audit & Assurance',
      services: [
        'Statutory Audit Services',
        'Reviews Services',
        'Agreed Upon Procedures Services',
        'Related Services Engagements',
        'Other Audit Services'
      ]
    },
    // Advisory (23 services)
    {
      category: 'Advisory',
      services: [
        'Business / Asset Valuation Services',
        'Impairment Tests Services',
        'Management Consulting Services',
        'SOX & Internal Controls Services',
        'Internal Audit Services',
        'Transaction Services',
        'Risk Management Services',
        'Forensics Services',
        'Other – Post Merger Integrations',
        'IT Audit',
        'Restructuring Services',
        'Due Diligence Services',
        'Market and Feasibility Studies Services',
        'Policies & Procedures Services',
        'Business Planning Services',
        'Capital Adequacy Services (Book 7)',
        'AML Services (Book 16)',
        'Internal Audit Quality Assurance Services',
        'Performance and Profitability Improvement Services',
        'Capital Adequacy Services (Book 17)',
        'Clients\' Funds and Clients\' Assets Report Services (Book 7)',
        'Payroll and HR Services',
        'Other Advisory'
      ]
    },
    // Tax Services (6 services)
    {
      category: 'Tax Services',
      services: [
        'Corporate International Tax Services',
        'Tax Compliance & Assurance Engagements Services',
        'FATCA Services',
        'CRS Services',
        'Zakat Services',
        'Other Tax Services'
      ]
    },
    // Accounting Services (2 services)
    {
      category: 'Accounting Services',
      services: [
        'Book Keeping Services',
        'Accounting Services'
      ]
    },
    // IT Services (1 service)
    {
      category: 'IT Services',
      services: [
        'IT Services'
      ]
    },
    // Other / Not Applicable (2 services) — category renamed to avoid overlap with "Other Services" option
    {
      category: 'Other / Not Applicable',
      services: [
        'Other Services',
        'Not Applicable'
      ]
    }
  ]
  
  const insertService = db.prepare(`
    INSERT OR IGNORE INTO service_catalog_global (
      service_code, category, service_name, is_active, display_order, metadata
    ) VALUES (?, ?, ?, ?, ?, ?)
  `)
  
  let inserted = 0
  let skipped = 0
  let displayOrder = 0
  
  for (const categoryGroup of kuwaitServiceList) {
    for (const serviceName of categoryGroup.services) {
      displayOrder++
      const serviceCode = generateServiceCode(categoryGroup.category, serviceName)
      const metadata = JSON.stringify({ 
        source: 'COI Template - Kuwait Local', 
        version: '1.0',
        is_kuwait_local: true
      })
      
      try {
        insertService.run(
          serviceCode,
          categoryGroup.category,
          serviceName,
          1, // is_active
          displayOrder,
          metadata
        )
        inserted++
      } catch (error) {
        if (error.message.includes('UNIQUE constraint')) {
          skipped++
        } else {
          console.error(`Error seeding service ${serviceName}:`, error.message)
        }
      }
    }
  }
  
  console.log(`✅ Seeded ${inserted} Kuwait local services (${skipped} already existed)`)
  return { inserted, skipped, total: kuwaitServiceList.reduce((sum, cat) => sum + cat.services.length, 0) }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedKuwaitServiceCatalog()
}
