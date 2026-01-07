import { getDatabase } from '../database/init.js'

const SERVICE_TYPE_ABBREVIATIONS = {
  'Tax': 'TAX',
  'Audit & Assurance': 'AUD',
  'Advisory': 'ADV',
  'Accounting': 'ACC',
  'Other': 'OTH'
}

export async function generateEngagementCode(serviceType, coiRequestId, generatedBy, financialParams = {}) {
  const db = getDatabase()
  const year = new Date().getFullYear()
  
  // Get abbreviation
  const abbreviation = SERVICE_TYPE_ABBREVIATIONS[serviceType] || 'OTH'
  
  // Get next sequential number
  const lastCode = db.prepare(`
    SELECT sequential_number 
    FROM coi_engagement_codes 
    WHERE service_type = ? AND year = ?
    ORDER BY sequential_number DESC 
    LIMIT 1
  `).get(abbreviation, year)
  
  const nextSeq = lastCode ? lastCode.sequential_number + 1 : 1
  
  // Generate code
  const engagementCode = `ENG-${year}-${abbreviation}-${String(nextSeq).padStart(5, '0')}`
  
  // Insert into engagement codes table
  db.prepare(`
    INSERT INTO coi_engagement_codes (
      engagement_code, coi_request_id, service_type, year, sequential_number, generated_by, status
    ) VALUES (?, ?, ?, ?, ?, ?, 'Active')
  `).run(engagementCode, coiRequestId, abbreviation, year, nextSeq, generatedBy)
  
  return engagementCode
}


