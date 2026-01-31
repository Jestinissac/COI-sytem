import { getDatabase } from '../database/init.js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const db = getDatabase()

/**
 * Parse Global COI Form.txt to extract all services
 * Format: Category in column 1, Service Type in column 2
 * The file is tab-separated with "NaN" for empty cells
 */
function parseGlobalCOIForm() {
  const filePath = join(__dirname, '../../../../docs/coi-system/extracted_text/Global COI Form.txt')
  let content
  try {
    content = readFileSync(filePath, 'utf-8')
  } catch (error) {
    console.log('⚠️  Global COI Form.txt not found, using fallback')
    return []
  }
  
  const lines = content.split('\n')
  const services = []
  let currentCategory = null
  let displayOrder = 0
  
  // Find the Services List section
  let inServicesList = false
  let headerFound = false
  
  for (const line of lines) {
    // Check if we're in Services List section
    if (line.includes('--- Sheet: Services List ---')) {
      inServicesList = true
      continue
    }
    
    if (!inServicesList) continue
    
    // Skip header line (contains "Category" and "Service Type")
    if (line.includes('Category') && line.includes('Service Type')) {
      headerFound = true
      continue
    }
    
    if (!headerFound) continue
    
    // Parse line - format appears to be tab-separated or space-separated
    // Try splitting by tabs first, then by multiple spaces
    let parts = line.split('\t')
    if (parts.length < 3) {
      // Try splitting by multiple spaces
      parts = line.split(/\s{2,}/)
    }
    
    // The format shows: index 0 (row number), index 1 (Category or NaN), index 2 (Service Type)
    if (parts.length >= 3) {
      const categoryPart = parts[1]?.trim()
      const servicePart = parts[2]?.trim()
      
      // If category is not NaN or empty, it's a new category
      if (categoryPart && 
          categoryPart !== 'NaN' && 
          categoryPart !== '' && 
          !categoryPart.match(/^\d+$/) && // Not just a number
          categoryPart.length > 2) {
        currentCategory = categoryPart
      }
      
      // If service type exists and is not NaN, add it
      if (servicePart && 
          servicePart !== 'NaN' && 
          servicePart !== '' && 
          !servicePart.match(/^\d+$/) && // Not just a number
          servicePart.length > 2 &&
          currentCategory) {
        displayOrder++
        services.push({
          category: currentCategory,
          service_name: servicePart,
          display_order: displayOrder
        })
      }
    }
  }
  
  return services
}

/**
 * Generate service code from service name
 */
function generateServiceCode(category, serviceName) {
  // Create a code from category and service name
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
  
  // Combine and ensure uniqueness
  const code = `${categoryCode}_${serviceCode}`
  return code.substring(0, 50) // Max 50 chars
}

export function seedGlobalServiceCatalog() {
  console.log('🌱 Seeding Global Service Catalog from Global COI Form...')
  
  try {
    // Parse services from file
    const services = parseGlobalCOIForm()
    
    if (services.length === 0) {
      console.log('⚠️  No services found in Global COI Form.txt. Using fallback data.')
      // Fallback: Use services from serviceTypeController if file parsing fails
      return seedFallbackServices()
    }
    
    const insertService = db.prepare(`
      INSERT OR IGNORE INTO service_catalog_global (
        service_code, category, service_name, description,
        is_active, display_order, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    let inserted = 0
    let skipped = 0
    
    for (const service of services) {
      const serviceCode = generateServiceCode(service.category, service.service_name)
      const metadata = JSON.stringify({
        source: 'Global COI Form',
        version: '1.0',
        extracted_date: new Date().toISOString()
      })
      
      try {
        insertService.run(
          serviceCode,
          service.category,
          service.service_name,
          null, // description
          1, // is_active
          service.display_order,
          metadata
        )
        inserted++
      } catch (error) {
        if (error.message.includes('UNIQUE constraint')) {
          skipped++
        } else {
          console.error(`Error seeding service ${service.service_name}:`, error.message)
        }
      }
    }
    
    console.log(`✅ Seeded ${inserted} services (${skipped} already existed)`)
    return { inserted, skipped }
  } catch (error) {
    console.error('Error seeding global service catalog:', error.message)
    console.log('⚠️  Falling back to basic service list...')
    return seedFallbackServices()
  }
}

/**
 * Fallback: Seed services from serviceTypeController structure
 * This uses the comprehensive list already defined in the controller
 */
function seedFallbackServices() {
  // Import the service list structure from serviceTypeController
  // For now, we'll define it here to avoid circular dependencies
  const fullServiceTypeList = [
    { category: 'Audit & Assurance', services: ['Statutory Audit Services', 'Review Services', 'Agreed-Upon Procedures', 'Compilation Services', 'Other (Audit & Assurance)'] },
    { category: 'Advisory - Analytics & Insights', services: ['Data Analytics (Enterprise Data Warehouse, Data Engineering, Reporting & Visualizations)', 'Predictive and/or Data Analytics, AI and Machine Learning', 'Other (Advisory - Analytics & Insights)'] },
    { category: 'Advisory - Corporate Finance, Transactions and Restructuring', services: ['Capital Markets & Raising Finance', 'Company Insolvency', 'Corporate Finance', 'Corporate Restructuring', 'Debt Advisory', 'Debt Restructuring', 'Individual Insolvency', 'Post-merger integrations and/or restructuring', 'Private finance initiatives and public private partnerships', 'Raising finance (excluding treasury services)', 'Raising finance (including treasury services)', 'Transactions', 'Working Capital and Operational Advisory', 'Other (Advisory - Corporate Finance, Transactions and Restructuring)'] },
    { category: 'Advisory - Cyber security', services: ['CIO/CISO Advisory Services', 'Cloud Migration Services', 'Cybersecurity Audits ISO 27001', 'Cybersecurity education, training and simulations', 'Cybersecurity Policies, Plans, and Procedures development', 'Cybersecurity review and advisory', 'Cybersecurity Risk Management Assessments', 'Cybersecurity Table-top Services', 'Data Privacy services and data mapping', 'EU-GDPR data privacy compliance', 'Incident Response Services', 'Information Governance, Risk and Compliance', 'IT Vendor Risk Management', 'Managed IT/Security Services', 'Managed Security Operations Centre (SOC)', 'Payment Card industry (PCI) Security Readiness Assessments', 'PCI Security Audits', 'Penetration Testing', 'Security Incident Event Manager (SIEM)', 'Virtual Desktop Services', 'Vulnerability assessments', 'Other (Advisory - Cyber security)'] },
    { category: 'Advisory - Due Diligence', services: ['Due Diligence', 'Transaction Advisory Services (TAS) (excluding cash management)', 'Transaction Advisory Services (TAS) (including cash management)', 'Other (Advisory - Due Diligence)'] },
    { category: 'Advisory - Enablement & Adoption', services: ['Change Management', 'Programme Governance', 'Other (Advisory - Enablement & Adoption)'] },
    { category: 'Advisory - ESG Services', services: ['ESG Consulting', 'ESG Due Diligence', 'ESG Reporting', 'ESG Solutions', 'Other (ESG Services)'] },
    { category: 'Advisory - Forensics Investigations', services: ['Anti-Money Laundering', 'Asset Tracing', 'Contentious Bankruptcy (fraudulent/preferential conveyances, solvency analysis)', 'Corruption', 'Crimes against the Company', 'Cyber Crimes and Security Breaches', 'Data Privacy Breaches and Assessments', 'Financial Reporting and Public Disclosures', 'Forensic Technology Services (eDiscovery, Data Analytics)', 'Fraud and Corruption Due Diligence', 'Fraud and Corruption Risk Assessments', 'Investigative Due Diligence/Background Checks/Integrity Services', 'Monitorships and Forensic Accounting Support for Monitors', 'Whistleblower Services (Hotlines & Reporting)', 'Other (Advisory - Forensics Investigations)'] },
    { category: 'Advisory - Litigation Support/Dispute Resolution', services: ['Accountants\' and Auditors\' Negligence (Professional Standard of Care Opinions)', 'Arbitrator, government-appointed Umpire or Referee in commercial disputes (*Neutral)', 'Construction Delay Claims', 'Cross Border dispute resolution', 'Economic Loss Quantification and Business Valuations in litigation', 'Insurance Claims (Insured/Business Interruption Loss Analysis)', 'Intellectual Property Disputes', 'Matrimonial disputes (income determination, family asset valuation)', 'Personal Injury/Medical Malpractice/Motor Vehicle Accident Loss Quantification', 'Trustee or Liquidator in Receivership (excluding treasury services)', 'Trustee or Liquidator in Receivership (including treasury services)', 'Other (Advisory - Litigation Support/Dispute Resolution)'] },
    { category: 'Advisory - Management Consulting', services: ['Asset Management Consulting', 'Compensation advisory', 'Compliance Management Consulting', 'Corporate Governance', 'Financial Management Advisory', 'Performance advisory', 'Program & Project Management', 'Systems and Procedures Consulting', 'Other (Advisory - Management Consulting)'] },
    { category: 'Advisory - Merger & Acquisitions', services: ['M&A services', 'Post Investment Monitoring', 'Other (Advisory - Merger & Acquisitions)'] },
    { category: 'Advisory - Operational Excellence', services: ['Capacity Assessment & Optimization', 'Capital Planning & Optimization', 'Cost Reduction / EBITDA Improvement', 'Other (Advisory - Operational Excellence)'] },
    { category: 'Advisory - Other', services: ['Accounting Advisory', 'Actuarial Services', 'Audit Advisory', 'Business continuity planning', 'Corporate Social Responsibility', 'Customised Training (Courses, Training needs assessment, planning, budget, Training Projects and management)', 'Employee Stock Option Plan (ESOP) Services', 'Executive/Board Level Professional Services', 'Financial Modelling', 'HR advisory', 'Interim Management Services', 'International Institutions and Donor Assurance (IIDA) - Advisory and/or Delivery', 'IPO Preparedness', 'Real Estate Advisory', 'Solvency services', 'Standardised Training', 'Succession Planning', 'Other (Advisory)'] },
    { category: 'Advisory - Outsourcing', services: ['Managed Security', 'Managed Services (Service Desk, Infrastructure-MS, Application-MS, Virtual DBA, onsite support, etc.)', 'Program & Project Management', 'Other (Advisory - Outsourcing)'] },
    { category: 'Advisory - Recruitment', services: ['Recruitment services', 'Other (Advisory - Recruitment)'] },
    { category: 'Advisory - Restructuring', services: ['Business restructuring', 'Corporate Trustee or Receivership or Solvent liquidation', 'Creditor Representation', 'Other (Advisory - Restructuring)'] },
    { category: 'Advisory - Risk Management (RAS)', services: ['Brand Standards compliance', 'Business process enhancement', 'Enterprise risk management', 'Fraud prevention', 'Internal Audit', 'Internal Controls Consulting', 'Other (Advisory - Risk Management)', 'Risk Management Consulting', 'Sarbanes-Oxley (SOX) Compliance', 'Third Party Risk Management'] },
    { category: 'Business/Asset Valuation', services: ['Business Valuation', 'Asset Valuation', 'Impairment Tests Services'] },
    { category: 'Tax Services', services: ['Corporate Tax Advisory', 'Individual Tax Advisory', 'Tax Compliance', 'Tax Planning', 'Transfer Pricing', 'Tax Compliance & Assurance Engagements Services', 'FATCA Services', 'CRS Services', 'Zakat Services', 'Other (Tax Services)'] },
    { category: 'Accounting Services', services: ['Bookkeeping', 'Financial Statement Preparation', 'Book Keeping Services', 'Accounting Services', 'Payroll and HR Services', 'Other (Accounting Services)'] },
    { category: 'Internal Audit Services', services: ['Internal Audit Services', 'Internal Audit', 'Internal Controls Review', 'Internal Audit Quality Assurance Services', 'SOX & Internal Controls Services'] },
    { category: 'IT Services', services: ['IT Audit', 'IT Services', 'IT Advisory'] },
    { category: 'Transaction Services', services: ['Transaction Services', 'Due Diligence Services'] },
    { category: 'Risk Management Services', services: ['Risk Management Services'] },
    { category: 'Forensics Services', services: ['Forensics Services'] },
    { category: 'Other Services', services: ['Other - Post Merger Integrations', 'Market and Feasibility Studies Services', 'Policies & Procedures Services', 'Business Planning Services', 'Capital Adequacy Services (Book 7)', 'AML Services (Book 16)', 'Performance and Profitability Improvement Services', 'Capital Adequacy Services (Book 17)', 'Clients\' Funds and Clients\' Assets Report Services (Book 7)', 'Other Advisory Services', 'Other Services', 'Not Applicable'] }
  ]
  
  const insertService = db.prepare(`
    INSERT OR IGNORE INTO service_catalog_global (
      service_code, category, service_name, is_active, display_order, metadata
    ) VALUES (?, ?, ?, ?, ?, ?)
  `)
  
  let inserted = 0
  let order = 0
  
  for (const categoryGroup of fullServiceTypeList) {
    for (const serviceName of categoryGroup.services) {
      order++
      const serviceCode = generateServiceCode(categoryGroup.category, serviceName)
      const metadata = JSON.stringify({ source: 'COI Template', version: '1.0' })
      
      try {
        insertService.run(
          serviceCode,
          categoryGroup.category,
          serviceName,
          1,
          order,
          metadata
        )
        inserted++
      } catch (error) {
        // Ignore duplicates
      }
    }
  }
  
  console.log(`✅ Seeded ${inserted} services from COI Template`)
  return { inserted, skipped: 0 }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedGlobalServiceCatalog()
}
