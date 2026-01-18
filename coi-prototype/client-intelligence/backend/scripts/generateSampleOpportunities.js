/**
 * Generate Sample Opportunities Script
 * Creates sample COI requests with various scenarios to generate insights
 * 
 * Usage: node client-intelligence/backend/scripts/generateSampleOpportunities.js
 */

import { getDatabase } from '../../../backend/src/database/init.js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const db = getDatabase()

// Service types that will create different opportunities
const SERVICE_TYPES = [
  'Statutory Audit',
  'Tax Services',
  'Advisory Services',
  'Accounting Services',
  'Internal Audit',
  'Due Diligence',
  'Valuation Services',
  'Forensic Accounting',
  'Risk Advisory',
  'IT Advisory'
]

/**
 * Generate sample COI requests that will create insights
 */
async function generateSampleOpportunities() {
  console.log('Generating sample opportunities for Client Intelligence insights...\n')

  // Get existing clients
  const clients = db.prepare("SELECT id, client_name FROM clients WHERE status = 'Active' LIMIT 20").all()
  
  if (clients.length === 0) {
    console.log('No active clients found. Please seed clients first.')
    return
  }

  // Get a requester user
  const requester = db.prepare("SELECT id, department FROM users WHERE role = 'Requester' LIMIT 1").get()
  
  if (!requester) {
    console.log('No requester user found. Please seed users first.')
    return
  }

  const currentYear = new Date().getFullYear()
  const created = []
  const today = new Date()

  // Scenario 1: Update existing engagements OR create new ones ending soon (30-90 days)
  console.log('Creating/updating engagements ending soon (renewal opportunities)...')
  
  // First, try to update existing Active engagements to have end dates in next 30-90 days
  const existingActive = db.prepare(`
    SELECT r.id, r.client_id, r.request_id, c.client_name
    FROM coi_requests r
    LEFT JOIN clients c ON r.client_id = c.id
    WHERE r.status IN ('Active', 'Approved') 
      AND (r.requested_service_period_end IS NULL OR r.requested_service_period_end > date('now', '+90 days'))
    LIMIT 10
  `).all()

  let renewalCount = 0
  for (let i = 0; i < existingActive.length && i < 8; i++) {
    const engagement = existingActive[i]
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + 30 + (i * 10)) // Spread over 30-90 days
    
    const startDate = new Date(endDate)
    startDate.setFullYear(startDate.getFullYear() - 1)

    try {
      db.prepare(`
        UPDATE coi_requests
        SET requested_service_period_start = ?,
            requested_service_period_end = ?,
            status = 'Active',
            stage = 'Engagement'
        WHERE id = ?
      `).run(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        engagement.id
      )
      renewalCount++
      created.push({ type: 'Renewal Opportunity', client: engagement.client_name || `Client ${engagement.client_id}`, endDate: endDate.toISOString().split('T')[0] })
    } catch (error) {
      console.error(`Error updating engagement ${engagement.request_id}:`, error.message)
    }
  }

  // If we don't have enough, create new ones
  if (renewalCount < 5) {
    const clientsNeeded = clients.slice(0, Math.min(5 - renewalCount, clients.length))
    
    // Get max request number to avoid conflicts
    const maxResult = db.prepare(`
      SELECT MAX(CAST(SUBSTR(request_id, 10) AS INTEGER)) as max_num 
      FROM coi_requests 
      WHERE request_id LIKE ?
    `).get(`COI-${currentYear}-%`)
    let requestCounter = (maxResult?.max_num || 0) + 1

    for (let i = 0; i < clientsNeeded.length; i++) {
      const client = clientsNeeded[i]
      const endDate = new Date(today)
      endDate.setDate(today.getDate() + 30 + (i * 10))
      
      const startDate = new Date(endDate)
      startDate.setFullYear(startDate.getFullYear() - 1)

      const requestId = `COI-${currentYear}-${String(requestCounter++).padStart(3, '0')}`
      
      try {
        db.prepare(`
          INSERT INTO coi_requests (
            request_id, client_id, requester_id, department,
            requestor_name, service_type, service_description,
            requested_service_period_start, requested_service_period_end,
            status, stage, pie_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          requestId,
          client.id,
          requester.id,
          requester.department,
          'System Generated',
          SERVICE_TYPES[i % SERVICE_TYPES.length],
          `Sample engagement for ${client.client_name} - ${SERVICE_TYPES[i % SERVICE_TYPES.length]}`,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          'Active',
          'Engagement',
          'No'
        )
        renewalCount++
        created.push({ type: 'Renewal Opportunity', client: client.client_name, endDate: endDate.toISOString().split('T')[0] })
      } catch (error) {
        if (!error.message.includes('UNIQUE')) {
          console.error(`Error creating request for ${client.client_name}:`, error.message)
        }
      }
    }
  }

  // Scenario 2: Ensure clients have limited service types - Creates service gap opportunities
  console.log('Ensuring clients have limited service types (service gap opportunities)...')
  
  // Check which clients have how many different service types
  const clientServiceCounts = db.prepare(`
    SELECT 
      c.id,
      c.client_name,
      COUNT(DISTINCT r.service_type) as service_count
    FROM clients c
    LEFT JOIN coi_requests r ON c.id = r.client_id AND r.status IN ('Active', 'Approved')
    WHERE c.status = 'Active'
    GROUP BY c.id, c.client_name
    HAVING service_count < 3 OR service_count IS NULL
    LIMIT 10
  `).all()

  let gapCount = 0
  for (let i = 0; i < clientServiceCounts.length; i++) {
    const clientInfo = clientServiceCounts[i]
    // Give each client only 1 service type (creates gaps)
    const serviceType = SERVICE_TYPES[i % 3] // Limit to first 3 services
    
    // Check if client already has this service
    const existing = db.prepare(`
      SELECT id FROM coi_requests 
      WHERE client_id = ? AND service_type = ? AND status IN ('Active', 'Approved')
      LIMIT 1
    `).get(clientInfo.id, serviceType)

    if (!existing) {
      const endDate = new Date(today)
      endDate.setDate(today.getDate() + 180) // 6 months from now
      const startDate = new Date(endDate)
      startDate.setFullYear(startDate.getFullYear() - 1)

      // Get max request number
      const maxResult = db.prepare(`
        SELECT MAX(CAST(SUBSTR(request_id, 10) AS INTEGER)) as max_num 
        FROM coi_requests 
        WHERE request_id LIKE ?
      `).get(`COI-${currentYear}-%`)
      let requestCounter = (maxResult?.max_num || 0) + 1

      const requestId = `COI-${currentYear}-${String(requestCounter++).padStart(3, '0')}`
      
      try {
        db.prepare(`
          INSERT INTO coi_requests (
            request_id, client_id, requester_id, department,
            requestor_name, service_type, service_description,
            requested_service_period_start, requested_service_period_end,
            status, stage, pie_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          requestId,
          clientInfo.id,
          requester.id,
          requester.department,
          'System Generated',
          serviceType,
          `Sample engagement for ${clientInfo.client_name} - ${serviceType}`,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          'Active',
          'Engagement',
          'No'
        )
        gapCount++
        created.push({ type: 'Service Gap Opportunity', client: clientInfo.client_name, service: serviceType })
      } catch (error) {
        if (!error.message.includes('UNIQUE')) {
          console.error(`Error creating request for ${clientInfo.client_name}:`, error.message)
        }
      }
    }
  }

  // Scenario 3: Add business cycle data to clients (year-end, quarter-end)
  console.log('Adding business cycle data to clients...')
  const clientsForCycles = clients.slice(0, 10)
  
  for (let i = 0; i < clientsForCycles.length; i++) {
    const client = clientsForCycles[i]
    const fiscalYearEnd = new Date(currentYear, 11, 31) // Dec 31
    const quarterEnds = [
      `Q1: ${currentYear}-03-31`,
      `Q2: ${currentYear}-06-30`,
      `Q3: ${currentYear}-09-30`,
      `Q4: ${currentYear}-12-31`
    ]
    
    try {
      // Check if columns exist before updating
      db.prepare(`
        UPDATE clients 
        SET fiscal_year_end_date = ?,
            quarter_end_dates = ?,
            business_cycle_type = 'fiscal_year'
        WHERE id = ?
      `).run(
        fiscalYearEnd.toISOString().split('T')[0],
        JSON.stringify(quarterEnds),
        client.id
      )
      created.push({ type: 'Business Cycle Data', client: client.client_name })
    } catch (error) {
      // Columns might not exist - that's OK
      console.log(`Note: Could not update business cycle for ${client.client_name} (columns may not exist)`)
    }
  }

  console.log('\n✅ Sample opportunities created:')
  console.log(`   - ${created.filter(c => c.type === 'Renewal Opportunity').length} renewal opportunities (engagements ending 30-90 days)`)
  console.log(`   - ${created.filter(c => c.type === 'Service Gap Opportunity').length} service gap opportunities (clients with limited services)`)
  console.log(`   - ${created.filter(c => c.type === 'Business Cycle Data').length} clients with business cycle data`)
  console.log(`\n📊 Total: ${created.length} opportunities created`)
  console.log('\n💡 Next steps:')
  console.log('   1. Go to Client Intelligence dashboard')
  console.log('   2. Click "Generate Insights" button')
  console.log('   3. View recommendations based on these opportunities')
  console.log('\n')
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith(process.argv[1]) ||
                     process.argv[1]?.includes('generateSampleOpportunities.js')

if (isMainModule || process.argv[1]?.includes('generateSampleOpportunities')) {
  generateSampleOpportunities()
    .then(() => {
      console.log('Script completed')
      process.exit(0)
    })
    .catch(error => {
      console.error('Script error:', error)
      process.exit(1)
    })
}

export { generateSampleOpportunities }
