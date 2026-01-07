import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Database from 'better-sqlite3'
import { readFileSync, existsSync, unlinkSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Delete existing database to start fresh
const dbPath = join(__dirname, '../../database/coi.db')
if (existsSync(dbPath)) {
  unlinkSync(dbPath)
  console.log('Deleted existing database')
}

// Initialize new database
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

// Read and execute schema
const schemaPath = join(__dirname, '../../database/schema.sql')
const schema = readFileSync(schemaPath, 'utf-8')

try {
  db.exec(schema)
  console.log('Schema executed successfully')
} catch (error) {
  console.error('Schema error:', error.message)
}

console.log('Database initialized for seeding')

// Constants
const passwordHash = '$2a$10$mockhashforprototypeonly'
const currentYear = new Date().getFullYear()

// ============================================================
// PHASE 1: SEED USERS (50 employees)
// ============================================================
// Distribution: 5 Directors, 8 Compliance, 10 Partners, 5 Finance, 5 Admin, 17 Requesters

const users = []

// Audit Department (15 employees)
users.push(
  { name: 'John Smith', email: 'john.smith@company.com', role: 'Director', department: 'Audit', director_id: null },
  { name: 'Sarah Johnson', email: 'sarah.johnson@company.com', role: 'Director', department: 'Audit', director_id: null },
  { name: 'Emily Davis', email: 'emily.davis@company.com', role: 'Compliance', department: 'Audit', director_id: null },
  { name: 'David Wilson', email: 'david.wilson@company.com', role: 'Compliance', department: 'Audit', director_id: null },
  { name: 'Robert Taylor', email: 'robert.taylor@company.com', role: 'Partner', department: 'Audit', director_id: null },
  { name: 'Jennifer Martinez', email: 'jennifer.martinez@company.com', role: 'Partner', department: 'Audit', director_id: null },
  { name: 'William Anderson', email: 'william.anderson@company.com', role: 'Partner', department: 'Audit', director_id: null },
  { name: 'Lisa Thomas', email: 'lisa.thomas@company.com', role: 'Finance', department: 'Audit', director_id: null },
  { name: 'James Jackson', email: 'james.jackson@company.com', role: 'Admin', department: 'Audit', director_id: null },
  { name: 'Patricia White', email: 'patricia.white@company.com', role: 'Requester', department: 'Audit', director_id: 1 },
  { name: 'Christopher Harris', email: 'christopher.harris@company.com', role: 'Requester', department: 'Audit', director_id: 1 },
  { name: 'Linda Martin', email: 'linda.martin@company.com', role: 'Requester', department: 'Audit', director_id: 2 },
  { name: 'Daniel Thompson', email: 'daniel.thompson@company.com', role: 'Requester', department: 'Audit', director_id: 2 },
  { name: 'Barbara Garcia', email: 'barbara.garcia@company.com', role: 'Requester', department: 'Audit', director_id: 1 },
  { name: 'Michael Brown', email: 'michael.brown@company.com', role: 'Requester', department: 'Audit', director_id: 2 }
)

// Tax Department (12 employees)
users.push(
  { name: 'Richard Moore', email: 'richard.moore@company.com', role: 'Director', department: 'Tax', director_id: null },
  { name: 'Joseph Rodriguez', email: 'joseph.rodriguez@company.com', role: 'Compliance', department: 'Tax', director_id: null },
  { name: 'Jessica Lewis', email: 'jessica.lewis@company.com', role: 'Compliance', department: 'Tax', director_id: null },
  { name: 'Thomas Walker', email: 'thomas.walker@company.com', role: 'Partner', department: 'Tax', director_id: null },
  { name: 'Karen Hall', email: 'karen.hall@company.com', role: 'Partner', department: 'Tax', director_id: null },
  { name: 'Charles Allen', email: 'charles.allen@company.com', role: 'Finance', department: 'Tax', director_id: null },
  { name: 'Nancy Young', email: 'nancy.young@company.com', role: 'Admin', department: 'Tax', director_id: null },
  { name: 'Matthew King', email: 'matthew.king@company.com', role: 'Requester', department: 'Tax', director_id: 16 },
  { name: 'Betty Wright', email: 'betty.wright@company.com', role: 'Requester', department: 'Tax', director_id: 16 },
  { name: 'Anthony Lopez', email: 'anthony.lopez@company.com', role: 'Requester', department: 'Tax', director_id: 16 },
  { name: 'Helen Hill', email: 'helen.hill@company.com', role: 'Requester', department: 'Tax', director_id: 16 },
  { name: 'Susan Clark', email: 'susan.clark@company.com', role: 'Requester', department: 'Tax', director_id: 16 }
)

// Advisory Department (10 employees)
users.push(
  { name: 'Mark Scott', email: 'mark.scott@company.com', role: 'Director', department: 'Advisory', director_id: null },
  { name: 'Sandra Green', email: 'sandra.green@company.com', role: 'Compliance', department: 'Advisory', director_id: null },
  { name: 'Donna Baker', email: 'donna.baker@company.com', role: 'Partner', department: 'Advisory', director_id: null },
  { name: 'Steven Nelson', email: 'steven.nelson@company.com', role: 'Partner', department: 'Advisory', director_id: null },
  { name: 'Carol Carter', email: 'carol.carter@company.com', role: 'Finance', department: 'Advisory', director_id: null },
  { name: 'Paul Mitchell', email: 'paul.mitchell@company.com', role: 'Admin', department: 'Advisory', director_id: null },
  { name: 'Michelle Perez', email: 'michelle.perez@company.com', role: 'Requester', department: 'Advisory', director_id: 28 },
  { name: 'Andrew Roberts', email: 'andrew.roberts@company.com', role: 'Requester', department: 'Advisory', director_id: 28 },
  { name: 'Dorothy Turner', email: 'dorothy.turner@company.com', role: 'Requester', department: 'Advisory', director_id: 28 },
  { name: 'Donald Adams', email: 'donald.adams@company.com', role: 'Requester', department: 'Advisory', director_id: 28 }
)

// Accounting Department (8 employees)
users.push(
  { name: 'Kenneth Phillips', email: 'kenneth.phillips@company.com', role: 'Director', department: 'Accounting', director_id: null },
  { name: 'Amy Campbell', email: 'amy.campbell@company.com', role: 'Compliance', department: 'Accounting', director_id: null },
  { name: 'Joshua Parker', email: 'joshua.parker@company.com', role: 'Partner', department: 'Accounting', director_id: null },
  { name: 'Angela Evans', email: 'angela.evans@company.com', role: 'Finance', department: 'Accounting', director_id: null },
  { name: 'Kevin Edwards', email: 'kevin.edwards@company.com', role: 'Admin', department: 'Accounting', director_id: null },
  { name: 'Brian Stewart', email: 'brian.stewart@company.com', role: 'Requester', department: 'Accounting', director_id: 38 },
  { name: 'Emma Sanchez', email: 'emma.sanchez@company.com', role: 'Requester', department: 'Accounting', director_id: 38 },
  { name: 'Brenda Collins', email: 'brenda.collins@company.com', role: 'Requester', department: 'Accounting', director_id: 38 }
)

// Other Department (5 employees)
users.push(
  { name: 'Super Admin', email: 'admin@company.com', role: 'Super Admin', department: 'Other', director_id: null },
  { name: 'George Morris', email: 'george.morris@company.com', role: 'Compliance', department: 'Other', director_id: null },
  { name: 'Ruth Rogers', email: 'ruth.rogers@company.com', role: 'Partner', department: 'Other', director_id: null },
  { name: 'Frank Reed', email: 'frank.reed@company.com', role: 'Finance', department: 'Other', director_id: null },
  { name: 'Sharon Cook', email: 'sharon.cook@company.com', role: 'Admin', department: 'Other', director_id: null }
)

// Insert users
const insertUser = db.prepare(`
  INSERT INTO users (email, name, password_hash, role, department, director_id, system_access)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)

users.forEach((user) => {
  try {
    insertUser.run(
      user.email,
      user.name,
      passwordHash,
      user.role,
      user.department,
      user.director_id,
      JSON.stringify(['COI', 'PRMS'])
    )
  } catch (error) {
    console.error(`Error inserting user ${user.email}:`, error.message)
  }
})

console.log(`Inserted ${users.length} users`)

// Count by role
const roleCounts = db.prepare('SELECT role, COUNT(*) as count FROM users GROUP BY role').all()
console.log('Users by role:', roleCounts)

// ============================================================
// PHASE 2: SEED CLIENTS (100 clients)
// ============================================================
// Distribution: 70 Active, 20 Inactive, 10 Potential
// Include fuzzy matching test cases

const clients = [
  // Fuzzy matching test cases (first 10)
  { client_name: 'ABC Corporation', status: 'Active', industry: 'Finance' },
  { client_name: 'ABC Corp', status: 'Active', industry: 'Finance' },
  { client_name: 'ABC Corp Ltd', status: 'Active', industry: 'Finance' },
  { client_name: 'XYZ Industries', status: 'Active', industry: 'Manufacturing' },
  { client_name: 'XYZ Industry LLC', status: 'Active', industry: 'Manufacturing' },
  { client_name: 'Global Tech Solutions', status: 'Active', industry: 'Technology' },
  { client_name: 'Global Technology Solutions', status: 'Active', industry: 'Technology' },
  { client_name: 'ABC Subsidiary Inc', status: 'Active', industry: 'Finance', parent_id: 1 },
  { client_name: 'New Client Ltd', status: 'Active', industry: 'Retail' },
  { client_name: 'Different Entity Corp', status: 'Active', industry: 'Healthcare' },
]

// Generate remaining 90 clients
const industries = ['Technology', 'Finance', 'Manufacturing', 'Retail', 'Healthcare', 'Energy', 'Telecommunications']
for (let i = 11; i <= 100; i++) {
  let status = 'Active'
  if (i > 70 && i <= 90) status = 'Inactive'
  if (i > 90) status = 'Potential'
  
  clients.push({
    client_name: `Client ${String(i).padStart(3, '0')} Company`,
    status: status,
    industry: industries[i % industries.length]
  })
}

const insertClient = db.prepare(`
  INSERT INTO clients (client_code, client_name, commercial_registration, status, industry, nature_of_business, parent_company_id)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)

clients.forEach((client, index) => {
  try {
    insertClient.run(
      `CLI-${String(index + 1).padStart(3, '0')}`,
      client.client_name,
      `CR-${String(index + 1).padStart(6, '0')}`,
      client.status,
      client.industry,
      `Business operations for ${client.client_name}`,
      client.parent_id || null
    )
  } catch (error) {
    console.error(`Error inserting client ${client.client_name}:`, error.message)
  }
})

console.log(`Inserted ${clients.length} clients`)

// Count by status
const clientCounts = db.prepare('SELECT status, COUNT(*) as count FROM clients GROUP BY status').all()
console.log('Clients by status:', clientCounts)

// ============================================================
// PHASE 3: SEED COI REQUESTS (20 requests at various stages)
// ============================================================
// Distribution per plan:
// - 3 Draft
// - 2 Pending Director Approval
// - 2 Pending Compliance Review
// - 2 Pending Partner Approval
// - 1 Pending Finance Coding
// - 5 Approved (awaiting client response)
// - 5 Active Engagements

const getRequestersByDept = (dept) => {
  return db.prepare('SELECT id FROM users WHERE department = ? AND role = ?').all(dept, 'Requester').map(u => u.id)
}

const auditRequesters = getRequestersByDept('Audit')
const taxRequesters = getRequestersByDept('Tax')
const advisoryRequesters = getRequestersByDept('Advisory')
const accountingRequesters = getRequestersByDept('Accounting')

const coiRequests = [
  // 3 Drafts
  { request_id: `COI-${currentYear}-001`, client_id: 1, requester_id: auditRequesters[0], department: 'Audit', service_type: 'Statutory Audit Services', status: 'Draft', stage: 'Proposal' },
  { request_id: `COI-${currentYear}-002`, client_id: 4, requester_id: taxRequesters[0], department: 'Tax', service_type: 'Tax Compliance', status: 'Draft', stage: 'Proposal' },
  { request_id: `COI-${currentYear}-003`, client_id: 6, requester_id: advisoryRequesters[0], department: 'Advisory', service_type: 'Management Consulting', status: 'Draft', stage: 'Proposal' },
  
  // 2 Pending Director Approval
  { request_id: `COI-${currentYear}-004`, client_id: 2, requester_id: auditRequesters[1], department: 'Audit', service_type: 'Statutory Audit Services', status: 'Pending Director Approval', stage: 'Proposal' },
  { request_id: `COI-${currentYear}-005`, client_id: 5, requester_id: taxRequesters[1], department: 'Tax', service_type: 'Tax Advisory', status: 'Pending Director Approval', stage: 'Proposal' },
  
  // 2 Pending Compliance - WITH DUPLICATION FLAGS for testing
  { request_id: `COI-${currentYear}-006`, client_id: 6, requester_id: auditRequesters[2], department: 'Audit', service_type: 'Statutory Audit Services', status: 'Pending Compliance', stage: 'Proposal', duplication_matches: JSON.stringify([]) },
  { request_id: `COI-${currentYear}-007`, client_id: 7, requester_id: auditRequesters[3], department: 'Audit', service_type: 'Statutory Audit Services', status: 'Pending Compliance', stage: 'Proposal', duplication_matches: JSON.stringify([]) },
  
  // 2 Pending Partner
  { request_id: `COI-${currentYear}-008`, client_id: 11, requester_id: taxRequesters[2], department: 'Tax', service_type: 'Tax Compliance', status: 'Pending Partner', stage: 'Proposal' },
  { request_id: `COI-${currentYear}-009`, client_id: 12, requester_id: advisoryRequesters[1], department: 'Advisory', service_type: 'Business Advisory', status: 'Pending Partner', stage: 'Proposal' },
  
  // 1 Pending Finance
  { request_id: `COI-${currentYear}-010`, client_id: 13, requester_id: auditRequesters[4], department: 'Audit', service_type: 'Statutory Audit Services', status: 'Pending Finance', stage: 'Proposal' },
  
  // 5 Approved (awaiting client)
  { request_id: `COI-${currentYear}-011`, client_id: 14, requester_id: auditRequesters[0], department: 'Audit', service_type: 'Statutory Audit Services', status: 'Approved', stage: 'Proposal', engagement_code: `ENG-${currentYear}-AUD-00001` },
  { request_id: `COI-${currentYear}-012`, client_id: 15, requester_id: taxRequesters[0], department: 'Tax', service_type: 'Tax Compliance', status: 'Approved', stage: 'Proposal', engagement_code: `ENG-${currentYear}-TAX-00001` },
  { request_id: `COI-${currentYear}-013`, client_id: 16, requester_id: advisoryRequesters[0], department: 'Advisory', service_type: 'Management Consulting', status: 'Approved', stage: 'Proposal', engagement_code: `ENG-${currentYear}-ADV-00001` },
  { request_id: `COI-${currentYear}-014`, client_id: 17, requester_id: accountingRequesters[0], department: 'Accounting', service_type: 'Bookkeeping', status: 'Approved', stage: 'Proposal', engagement_code: `ENG-${currentYear}-ACC-00001` },
  { request_id: `COI-${currentYear}-015`, client_id: 18, requester_id: auditRequesters[1], department: 'Audit', service_type: 'Statutory Audit Services', status: 'Approved', stage: 'Proposal', engagement_code: `ENG-${currentYear}-AUD-00002` },
  
  // 5 Active Engagements
  { request_id: `COI-${currentYear}-016`, client_id: 19, requester_id: auditRequesters[2], department: 'Audit', service_type: 'Statutory Audit Services', status: 'Active', stage: 'Engagement', engagement_code: `ENG-${currentYear}-AUD-00003`, days_in_monitoring: 5 },
  { request_id: `COI-${currentYear}-017`, client_id: 20, requester_id: taxRequesters[1], department: 'Tax', service_type: 'Tax Compliance', status: 'Active', stage: 'Engagement', engagement_code: `ENG-${currentYear}-TAX-00002`, days_in_monitoring: 15 },
  { request_id: `COI-${currentYear}-018`, client_id: 21, requester_id: advisoryRequesters[1], department: 'Advisory', service_type: 'Business Advisory', status: 'Active', stage: 'Engagement', engagement_code: `ENG-${currentYear}-ADV-00002`, days_in_monitoring: 25 },
  { request_id: `COI-${currentYear}-019`, client_id: 22, requester_id: accountingRequesters[1], department: 'Accounting', service_type: 'Accounting Services', status: 'Active', stage: 'Engagement', engagement_code: `ENG-${currentYear}-ACC-00002`, days_in_monitoring: 28 },
  { request_id: `COI-${currentYear}-020`, client_id: 23, requester_id: auditRequesters[3], department: 'Audit', service_type: 'Statutory Audit Services', status: 'Active', stage: 'Engagement', engagement_code: `ENG-${currentYear}-AUD-00004`, days_in_monitoring: 32 },
]

// Additional requests with fuzzy match test cases
coiRequests.push(
  // Request for "ABC Corp" which should match "ABC Corporation"
  { request_id: `COI-${currentYear}-021`, client_id: 2, requester_id: auditRequesters[0], department: 'Audit', service_type: 'Statutory Audit Services', status: 'Pending Compliance', stage: 'Proposal', duplication_matches: JSON.stringify([{ matchScore: 85, existingEngagement: { client_name: 'ABC Corporation', engagement_code: 'ENG-2025-AUD-00001' }, reason: 'Abbreviation match', action: 'flag' }]) },
  // Request for "Different Entity Corp" - no matches
  { request_id: `COI-${currentYear}-022`, client_id: 10, requester_id: advisoryRequesters[0], department: 'Advisory', service_type: 'Management Consulting', status: 'Pending Compliance', stage: 'Proposal', duplication_matches: JSON.stringify([{ matchScore: 80, existingEngagement: { client_name: 'Different Entity Inc', engagement_code: null }, reason: 'Similar name detected', action: 'flag' }, { matchScore: 75, existingEngagement: { client_name: 'Entity Corp', engagement_code: null }, reason: 'Similar name detected', action: 'flag' }]) }
)

const insertRequest = db.prepare(`
  INSERT INTO coi_requests (
    request_id, client_id, requester_id, department,
    requestor_name, designation, entity, line_of_service,
    requested_document, language,
    client_location, relationship_with_client, client_type,
    service_type, service_description,
    pie_status, global_clearance_status,
    status, stage, engagement_code, days_in_monitoring, duplication_matches
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

coiRequests.forEach(request => {
  try {
    const requester = db.prepare('SELECT name FROM users WHERE id = ?').get(request.requester_id)
    insertRequest.run(
      request.request_id,
      request.client_id,
      request.requester_id,
      request.department,
      requester?.name || 'Unknown',
      'Manager',
      'BDO Al Nisf & Partners',
      request.department,
      'Proposal',
      'English',
      'State of Kuwait',
      'New Client',
      'W.L.L.',
      request.service_type,
      `${request.service_type} for client ${request.client_id}`,
      'No',
      'Not Required',
      request.status,
      request.stage,
      request.engagement_code || null,
      request.days_in_monitoring || 0,
      request.duplication_matches || null
    )
  } catch (error) {
    console.error(`Error inserting request ${request.request_id}:`, error.message)
  }
})

console.log(`Inserted ${coiRequests.length} COI requests`)

// Count by status
const requestCounts = db.prepare('SELECT status, COUNT(*) as count FROM coi_requests GROUP BY status').all()
console.log('COI Requests by status:', requestCounts)

// ============================================================
// PHASE 4: SEED ENGAGEMENT CODES for Approved/Active requests
// ============================================================

const approvedRequests = db.prepare(`
  SELECT id, request_id, engagement_code, service_type 
  FROM coi_requests 
  WHERE engagement_code IS NOT NULL
`).all()

const insertEngagementCode = db.prepare(`
  INSERT INTO coi_engagement_codes (engagement_code, coi_request_id, service_type, year, sequential_number, status)
  VALUES (?, ?, ?, ?, ?, 'Active')
`)

let engSeq = 1
approvedRequests.forEach(request => {
  try {
    const serviceCode = request.service_type?.substring(0, 3).toUpperCase() || 'OTH'
    insertEngagementCode.run(
      request.engagement_code,
      request.id,
      serviceCode,
      currentYear,
      engSeq++
    )
  } catch (error) {
    if (!error.message.includes('UNIQUE')) {
      console.error(`Error inserting engagement code ${request.engagement_code}:`, error.message)
    }
  }
})

console.log(`Inserted ${approvedRequests.length} engagement codes`)

// ============================================================
// PHASE 5: SEED PROJECTS (200 projects linked to engagement codes)
// ============================================================

// Get all existing engagement codes
const existingCodes = db.prepare('SELECT engagement_code FROM coi_engagement_codes').all()
const engagementCodes = existingCodes.map(c => c.engagement_code)

// Create additional engagement codes for 200 projects
const serviceTypes = ['AUD', 'TAX', 'ADV', 'ACC', 'OTH']
const projectYear = currentYear - 1

// First create engagement codes for historical projects
const historicalCoiRequestId = db.prepare('SELECT id FROM coi_requests LIMIT 1').get().id

for (let i = 0; i < 200; i++) {
  const serviceType = serviceTypes[i % serviceTypes.length]
  const engCode = `ENG-${projectYear}-${serviceType}-${String(i + 100).padStart(5, '0')}`
  
  try {
    insertEngagementCode.run(engCode, historicalCoiRequestId, serviceType, projectYear, i + 100)
    engagementCodes.push(engCode)
  } catch (error) {
    if (!error.message.includes('UNIQUE')) {
      console.error(`Error inserting eng code ${engCode}:`, error.message)
    }
  }
}

// Now create projects
const insertProject = db.prepare(`
  INSERT INTO prms_projects (project_id, engagement_code, client_code, status)
  VALUES (?, ?, ?, ?)
`)

let projectsInserted = 0
for (let i = 0; i < 200; i++) {
  const engCode = engagementCodes[i % engagementCodes.length]
  const clientCode = `CLI-${String((i % 70) + 1).padStart(3, '0')}`
  const projectId = `PROJ-${projectYear}-${String(i + 1).padStart(4, '0')}`
  const status = i < 150 ? 'Active' : i < 180 ? 'Completed' : 'On Hold'
  
  try {
    insertProject.run(projectId, engCode, clientCode, status)
    projectsInserted++
  } catch (error) {
    if (!error.message.includes('UNIQUE') && !error.message.includes('Engagement Code must be Active')) {
      console.error(`Error inserting project ${projectId}:`, error.message)
    }
  }
}

console.log(`Inserted ${projectsInserted} projects`)

// Count by status
const projectCounts = db.prepare('SELECT status, COUNT(*) as count FROM prms_projects GROUP BY status').all()
console.log('Projects by status:', projectCounts)

// ============================================================
// FINAL SUMMARY
// ============================================================

console.log('\n========== SEEDING COMPLETE ==========')
console.log(`Users: ${db.prepare('SELECT COUNT(*) as count FROM users').get().count}`)
console.log(`Clients: ${db.prepare('SELECT COUNT(*) as count FROM clients').get().count}`)
console.log(`COI Requests: ${db.prepare('SELECT COUNT(*) as count FROM coi_requests').get().count}`)
console.log(`Engagement Codes: ${db.prepare('SELECT COUNT(*) as count FROM coi_engagement_codes').get().count}`)
console.log(`PRMS Projects: ${db.prepare('SELECT COUNT(*) as count FROM prms_projects').get().count}`)
console.log('=======================================\n')

db.close()
