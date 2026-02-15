/**
 * Expanded Seed Script for COI Prototype
 *
 * Adds realistic test data across ALL user roles and departments:
 * - 20+ users across Audit, Tax, Advisory, Accounting (Requesters, Directors, etc.)
 * - 20+ clients with varied company types and industries
 * - Additional prospects
 * - COI requests at EVERY workflow stage from multiple requesters
 *
 * Usage: node --experimental-vm-modules src/scripts/seedExpandedData.js
 * (Run from the backend directory)
 */

import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const dbPath = join(__dirname, '../../../database/coi-dev.db')

console.log(`Opening database: ${dbPath}`)
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

// ─── HELPERS ───────────────────────────────────────────────────────────────

function getOrInsertUser({ name, email, role, department, directorEmail, lineOfService }) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) return existing.id

  db.prepare(`
    INSERT INTO users (name, email, password_hash, role, department, line_of_service, system_access, active, is_active)
    VALUES (?, ?, 'password', ?, ?, ?, '["COI"]', 1, 1)
  `).run(name, email, role, department, lineOfService || null)

  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email)

  // Link requester to their director
  if (role === 'Requester' && directorEmail) {
    const director = db.prepare('SELECT id FROM users WHERE email = ?').get(directorEmail)
    if (director) {
      db.prepare('UPDATE users SET director_id = ? WHERE id = ?').run(director.id, user.id)
    }
  }

  return user.id
}

function getOrInsertClient({ code, name, status, industry, parentCompany, isCmaRegulated }) {
  const existing = db.prepare('SELECT id FROM clients WHERE client_code = ?').get(code)
  if (existing) return existing.id

  db.prepare(`
    INSERT INTO clients (client_code, client_name, status, industry, parent_company, is_cma_regulated)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(code, name, status || 'Active', industry || null, parentCompany || null, isCmaRegulated ? 1 : 0)

  return db.prepare('SELECT id FROM clients WHERE client_code = ?').get(code).id
}

function getOrInsertProspect({ name, code, industry, commercialReg, status }) {
  const existing = db.prepare('SELECT id FROM prospects WHERE prospect_code = ?').get(code)
  if (existing) return existing.id

  db.prepare(`
    INSERT INTO prospects (prospect_name, prospect_code, industry, commercial_registration, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, code, industry || null, commercialReg || null, status || 'Active')

  return db.prepare('SELECT id FROM prospects WHERE prospect_code = ?').get(code).id
}

function getNextRequestId() {
  const year = new Date().getFullYear()
  const max = db.prepare(`
    SELECT MAX(CAST(REPLACE(request_id, 'COI-${year}-', '') AS INTEGER)) as n
    FROM coi_requests WHERE request_id LIKE 'COI-${year}-%'
  `).get()
  const next = (max?.n || 0) + 1
  return `COI-${year}-${String(next).padStart(3, '0')}`
}

function insertRequest(data) {
  const reqId = getNextRequestId()

  db.prepare(`
    INSERT INTO coi_requests (
      request_id, client_id, requester_id, department, requestor_name,
      designation, entity, service_type, service_description, service_category,
      stage, status, client_type, regulated_body, pie_status,
      group_structure, company_type, international_operations,
      director_approval_status, director_approval_date, director_approval_by, director_approval_notes,
      compliance_review_status, compliance_review_date, compliance_reviewed_by, compliance_review_notes,
      partner_approval_status, partner_approval_date, partner_approved_by, partner_approval_notes,
      finance_code_status, engagement_code,
      is_prospect, prospect_id, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?,
      ?, ?, datetime('now', ?), datetime('now', ?)
    )
  `).run(
    reqId, data.clientId, data.requesterId, data.department, data.requesterName,
    data.designation || 'Senior', data.entity || 'Main Office', data.serviceType, data.serviceDescription, data.serviceCategory || null,
    data.stage || 'Proposal', data.status, data.clientType || null, data.regulatedBody || null, data.pieStatus || null,
    data.groupStructure || 'standalone', data.companyType || 'Standalone', data.internationalOps ? 1 : 0,
    data.directorStatus || 'Pending', data.directorDate || null, data.directorBy || null, data.directorNotes || null,
    data.complianceStatus || 'Pending', data.complianceDate || null, data.complianceBy || null, data.complianceNotes || null,
    data.partnerStatus || 'Pending', data.partnerDate || null, data.partnerBy || null, data.partnerNotes || null,
    data.financeStatus || 'Pending', data.engagementCode || null,
    data.isProspect ? 1 : 0, data.prospectId || null, data.createdOffset || '-0 days', data.createdOffset || '-0 days'
  )

  console.log(`  ${reqId} | ${data.status.padEnd(28)} | ${data.department.padEnd(10)} | ${data.requesterName}`)
  return reqId
}


// ─── 1. USERS ──────────────────────────────────────────────────────────────

console.log('\n=== Seeding Users ===')

// Directors first (so we can link requesters to them)
const directors = {
  audit: getOrInsertUser({ name: 'John Smith', email: 'john.smith@company.com', role: 'Director', department: 'Audit' }),
  tax: getOrInsertUser({ name: 'Sarah Mitchell', email: 'sarah.mitchell@company.com', role: 'Director', department: 'Tax' }),
  advisory: getOrInsertUser({ name: 'David Chen', email: 'david.chen@company.com', role: 'Director', department: 'Advisory' }),
  accounting: getOrInsertUser({ name: 'Fatima Al-Rashidi', email: 'fatima.rashidi@company.com', role: 'Director', department: 'Accounting' }),
}
console.log('Directors:', directors)

// Compliance officers (one per department + shared)
const compliance = {
  audit: getOrInsertUser({ name: 'Emily Davis', email: 'emily.davis@company.com', role: 'Compliance', department: 'Audit' }),
  tax: getOrInsertUser({ name: 'Nadia Hussain', email: 'nadia.hussain@company.com', role: 'Compliance', department: 'Tax' }),
  advisory: getOrInsertUser({ name: 'Marcus Brown', email: 'marcus.brown@company.com', role: 'Compliance', department: 'Advisory' }),
  accounting: getOrInsertUser({ name: 'Leila Khoury', email: 'leila.khoury@company.com', role: 'Compliance', department: 'Accounting' }),
}
console.log('Compliance:', compliance)

// Partners
const partners = {
  audit: getOrInsertUser({ name: 'Robert Taylor', email: 'robert.taylor@company.com', role: 'Partner', department: 'Audit' }),
  tax: getOrInsertUser({ name: 'Ahmad Al-Sabah', email: 'ahmad.sabah@company.com', role: 'Partner', department: 'Tax' }),
  advisory: getOrInsertUser({ name: 'Diana Rodriguez', email: 'diana.rodriguez@company.com', role: 'Partner', department: 'Advisory' }),
  accounting: getOrInsertUser({ name: 'Khalid Al-Mutairi', email: 'khalid.mutairi@company.com', role: 'Partner', department: 'Accounting' }),
}
console.log('Partners:', partners)

// Finance
const finance = {
  shared: getOrInsertUser({ name: 'Lisa Thomas', email: 'lisa.thomas@company.com', role: 'Finance', department: 'Audit' }),
  tax: getOrInsertUser({ name: 'Reem Al-Fahad', email: 'reem.fahad@company.com', role: 'Finance', department: 'Tax' }),
}
console.log('Finance:', finance)

// Requesters — multiple per department
const requesters = {
  // Audit department
  patricia: getOrInsertUser({ name: 'Patricia White', email: 'patricia.white@company.com', role: 'Requester', department: 'Audit', directorEmail: 'john.smith@company.com' }),
  omar: getOrInsertUser({ name: 'Omar Al-Hassan', email: 'omar.hassan@company.com', role: 'Requester', department: 'Audit', directorEmail: 'john.smith@company.com' }),
  jennifer: getOrInsertUser({ name: 'Jennifer Lee', email: 'jennifer.lee@company.com', role: 'Requester', department: 'Audit', directorEmail: 'john.smith@company.com' }),

  // Tax department
  michael: getOrInsertUser({ name: 'Michael Carter', email: 'michael.carter@company.com', role: 'Requester', department: 'Tax', directorEmail: 'sarah.mitchell@company.com' }),
  noura: getOrInsertUser({ name: 'Noura Al-Qattan', email: 'noura.qattan@company.com', role: 'Requester', department: 'Tax', directorEmail: 'sarah.mitchell@company.com' }),

  // Advisory department
  rachel: getOrInsertUser({ name: 'Rachel Thompson', email: 'rachel.thompson@company.com', role: 'Requester', department: 'Advisory', directorEmail: 'david.chen@company.com' }),
  youssef: getOrInsertUser({ name: 'Youssef Mansour', email: 'youssef.mansour@company.com', role: 'Requester', department: 'Advisory', directorEmail: 'david.chen@company.com' }),
  anna: getOrInsertUser({ name: 'Anna Kowalski', email: 'anna.kowalski@company.com', role: 'Requester', department: 'Advisory', directorEmail: 'david.chen@company.com' }),

  // Accounting department
  tariq: getOrInsertUser({ name: 'Tariq Al-Enezi', email: 'tariq.enezi@company.com', role: 'Requester', department: 'Accounting', directorEmail: 'fatima.rashidi@company.com' }),
  samantha: getOrInsertUser({ name: 'Samantha Green', email: 'samantha.green@company.com', role: 'Requester', department: 'Accounting', directorEmail: 'fatima.rashidi@company.com' }),
}
console.log('Requesters:', requesters)


// ─── 2. CLIENTS ────────────────────────────────────────────────────────────

console.log('\n=== Seeding Clients ===')

const clients = {
  acme: getOrInsertClient({ code: 'CLI-001', name: 'Acme Corp', status: 'Active', industry: 'Manufacturing' }),
  global: getOrInsertClient({ code: 'CLI-002', name: 'Global Industries Ltd', status: 'Active', industry: 'Manufacturing' }),
  tech: getOrInsertClient({ code: 'CLI-003', name: 'Tech Solutions Inc', status: 'Active', industry: 'Technology' }),

  // Kuwait-style companies
  nbk: getOrInsertClient({ code: 'CLI-004', name: 'National Bank of Kuwait K.S.C.P.', status: 'Active', industry: 'Banking', isCmaRegulated: true }),
  zain: getOrInsertClient({ code: 'CLI-005', name: 'Zain Telecommunications K.S.C.', status: 'Active', industry: 'Telecommunications', isCmaRegulated: true }),
  agility: getOrInsertClient({ code: 'CLI-006', name: 'Agility Public Warehousing K.S.C.P.', status: 'Active', industry: 'Logistics', isCmaRegulated: true }),
  kipco: getOrInsertClient({ code: 'CLI-007', name: 'KIPCO - Kuwait Projects Company K.S.C.P.', status: 'Active', industry: 'Investment', isCmaRegulated: true }),
  gulf: getOrInsertClient({ code: 'CLI-008', name: 'Gulf Cable & Electrical Industries K.S.C.P.', status: 'Active', industry: 'Manufacturing', isCmaRegulated: true }),
  burgan: getOrInsertClient({ code: 'CLI-009', name: 'Burgan Bank K.P.S.C.', status: 'Active', industry: 'Banking', isCmaRegulated: true }),
  mezzan: getOrInsertClient({ code: 'CLI-010', name: 'Mezzan Holding K.S.C.C.', status: 'Active', industry: 'Food & Beverage' }),

  // Non-listed / private companies
  alshaya: getOrInsertClient({ code: 'CLI-011', name: 'M.H. Alshaya Co. W.L.L.', status: 'Active', industry: 'Retail' }),
  alghanim: getOrInsertClient({ code: 'CLI-012', name: 'Alghanim Industries W.L.L.', status: 'Active', industry: 'Diversified' }),
  kfh: getOrInsertClient({ code: 'CLI-013', name: 'Kuwait Finance House K.S.C.P.', status: 'Active', industry: 'Islamic Banking', isCmaRegulated: true }),
  equate: getOrInsertClient({ code: 'CLI-014', name: 'EQUATE Petrochemical Company K.S.C.C.', status: 'Active', industry: 'Petrochemicals' }),
  americana: getOrInsertClient({ code: 'CLI-015', name: 'Americana Restaurants International PLC', status: 'Active', industry: 'Food & Beverage' }),

  // Subsidiary / parent relationships
  boubyan: getOrInsertClient({ code: 'CLI-016', name: 'Boubyan Bank K.S.C.P.', status: 'Active', industry: 'Islamic Banking', isCmaRegulated: true, parentCompany: 'National Bank of Kuwait K.S.C.P.' }),
  wataniya: getOrInsertClient({ code: 'CLI-017', name: 'Wataniya Telecom (Ooredoo Kuwait) K.S.C.P.', status: 'Active', industry: 'Telecommunications', isCmaRegulated: true }),

  // Real estate
  mabanee: getOrInsertClient({ code: 'CLI-018', name: 'Mabanee Company K.S.C.P.', status: 'Active', industry: 'Real Estate', isCmaRegulated: true }),
  tamdeen: getOrInsertClient({ code: 'CLI-019', name: 'Tamdeen Real Estate Co. K.S.C.C.', status: 'Active', industry: 'Real Estate' }),

  // Oil & Gas
  knpc: getOrInsertClient({ code: 'CLI-020', name: 'Kuwait National Petroleum Company K.S.C.', status: 'Active', industry: 'Oil & Gas' }),

  // Healthcare
  dhaman: getOrInsertClient({ code: 'CLI-021', name: 'Health Assurance Hospitals Company (Dhaman) K.S.C.P.', status: 'Active', industry: 'Healthcare', isCmaRegulated: true }),

  // Inactive client for testing
  oldco: getOrInsertClient({ code: 'CLI-022', name: 'Al-Watan Trading Co. W.L.L.', status: 'Inactive', industry: 'Trading' }),
}
console.log(`Clients seeded: ${Object.keys(clients).length}`)


// ─── 3. PROSPECTS ──────────────────────────────────────────────────────────

console.log('\n=== Seeding Prospects ===')

const newProspects = {
  p17: getOrInsertProspect({ name: 'Al-Jazeera Steel Industries W.L.L.', code: 'PROS-2026-0017', industry: 'Manufacturing', commercialReg: 'CR-2024-99881' }),
  p18: getOrInsertProspect({ name: 'Kuwait Cement Company K.S.C.P.', code: 'PROS-2026-0018', industry: 'Construction Materials', commercialReg: 'CR-2019-44521' }),
  p19: getOrInsertProspect({ name: 'Al-Salhiya Real Estate Co.', code: 'PROS-2026-0019', industry: 'Real Estate', commercialReg: 'CR-2020-55678' }),
  p20: getOrInsertProspect({ name: 'Gulf Renewable Energy Co.', code: 'PROS-2026-0020', industry: 'Energy', commercialReg: 'CR-2025-10234' }),
}
console.log(`New prospects added: ${Object.keys(newProspects).length}`)


// ─── 4. COI REQUESTS — ALL WORKFLOW STAGES ─────────────────────────────────

console.log('\n=== Seeding COI Requests ===')
console.log('  Request ID                    | Status                       | Dept       | Requester')
console.log('  ' + '-'.repeat(90))

const draftPlaceholder = db.prepare("SELECT id FROM clients WHERE client_code = ?").get('DRAFT-NO-CLIENT')
const draftClientId = draftPlaceholder?.id

// Helper: date offset strings for created_at ordering
const now = new Date()

// ── AUDIT DEPARTMENT ──

// Draft requests
insertRequest({
  clientId: clients.nbk, requesterId: requesters.omar, department: 'Audit',
  requesterName: 'Omar Al-Hassan', serviceType: 'Statutory Audit Services',
  serviceDescription: 'Annual statutory audit of financial statements for FY2025',
  status: 'Draft', stage: 'Proposal', clientType: 'Listed', regulatedBody: 'CMA',
  pieStatus: 'Yes', groupStructure: 'has_parent', companyType: 'Parent',
  createdOffset: '-10 days'
})

insertRequest({
  clientId: clients.zain, requesterId: requesters.jennifer, department: 'Audit',
  requesterName: 'Jennifer Lee', serviceType: 'Reviews Services',
  serviceDescription: 'Interim financial review Q3 2026',
  status: 'Draft', stage: 'Proposal', clientType: 'Listed', regulatedBody: 'CMA',
  pieStatus: 'Yes', groupStructure: 'standalone', companyType: 'Standalone',
  createdOffset: '-8 days'
})

// Pending Director Approval
insertRequest({
  clientId: clients.agility, requesterId: requesters.patricia, department: 'Audit',
  requesterName: 'Patricia White', serviceType: 'Statutory Audit Services',
  serviceDescription: 'Full scope audit of Agility consolidated financials FY2025',
  status: 'Pending Director Approval', stage: 'Proposal',
  clientType: 'Listed', regulatedBody: 'CMA', pieStatus: 'Yes',
  groupStructure: 'has_parent', companyType: 'Parent',
  createdOffset: '-7 days'
})

// Pending Compliance (Director approved)
insertRequest({
  clientId: clients.kipco, requesterId: requesters.omar, department: 'Audit',
  requesterName: 'Omar Al-Hassan', serviceType: 'Statutory Audit Services',
  serviceDescription: 'Audit of KIPCO investment portfolio and subsidiaries',
  status: 'Pending Compliance', stage: 'Proposal',
  clientType: 'Listed', regulatedBody: 'CMA', pieStatus: 'Yes',
  groupStructure: 'has_parent', companyType: 'Parent',
  directorStatus: 'Approved', directorDate: new Date(now - 5 * 86400000).toISOString(), directorBy: directors.audit,
  directorNotes: 'Approved. Ensure independence confirmations are obtained for all subsidiaries.',
  createdOffset: '-9 days'
})

// Pending Partner (Director + Compliance approved)
insertRequest({
  clientId: clients.burgan, requesterId: requesters.jennifer, department: 'Audit',
  requesterName: 'Jennifer Lee', serviceType: 'Statutory Audit Services',
  serviceDescription: 'Statutory audit of Burgan Bank and its subsidiaries',
  status: 'Pending Partner', stage: 'Proposal',
  clientType: 'Listed', regulatedBody: 'CMA', pieStatus: 'Yes',
  groupStructure: 'has_parent', companyType: 'Parent',
  directorStatus: 'Approved', directorDate: new Date(now - 8 * 86400000).toISOString(), directorBy: directors.audit,
  directorNotes: 'Approved. Standard engagement terms apply.',
  complianceStatus: 'Approved', complianceDate: new Date(now - 6 * 86400000).toISOString(), complianceBy: compliance.audit,
  complianceNotes: 'No conflicts identified. Independence confirmed across all entities.',
  createdOffset: '-12 days'
})

// Pending Finance (All approvals done)
insertRequest({
  clientId: clients.gulf, requesterId: requesters.patricia, department: 'Audit',
  requesterName: 'Patricia White', serviceType: 'Statutory Audit Services',
  serviceDescription: 'Audit of Gulf Cable manufacturing operations and financial statements',
  status: 'Pending Finance', stage: 'Engagement',
  clientType: 'Listed', regulatedBody: 'CMA', pieStatus: 'Yes',
  groupStructure: 'standalone', companyType: 'Standalone',
  directorStatus: 'Approved', directorDate: new Date(now - 14 * 86400000).toISOString(), directorBy: directors.audit,
  complianceStatus: 'Approved', complianceDate: new Date(now - 12 * 86400000).toISOString(), complianceBy: compliance.audit,
  partnerStatus: 'Approved', partnerDate: new Date(now - 10 * 86400000).toISOString(), partnerBy: partners.audit,
  partnerNotes: 'Approved. Fee structure reviewed and acceptable.',
  createdOffset: '-20 days'
})

// Approved (complete workflow)
insertRequest({
  clientId: clients.mezzan, requesterId: requesters.omar, department: 'Audit',
  requesterName: 'Omar Al-Hassan', serviceType: 'Agreed Upon Procedures Services',
  serviceDescription: 'AUP engagement for inventory count verification',
  status: 'Approved', stage: 'Engagement',
  clientType: 'Unlisted', groupStructure: 'standalone', companyType: 'Standalone',
  directorStatus: 'Approved', directorDate: new Date(now - 25 * 86400000).toISOString(), directorBy: directors.audit,
  complianceStatus: 'Approved', complianceDate: new Date(now - 23 * 86400000).toISOString(), complianceBy: compliance.audit,
  partnerStatus: 'Approved', partnerDate: new Date(now - 21 * 86400000).toISOString(), partnerBy: partners.audit,
  financeStatus: 'Generated', engagementCode: 'ENG-2026-A001',
  createdOffset: '-30 days'
})

// Rejected
insertRequest({
  clientId: clients.oldco, requesterId: requesters.patricia, department: 'Audit',
  requesterName: 'Patricia White', serviceType: 'Statutory Audit Services',
  serviceDescription: 'Audit of Al-Watan Trading — historical financials',
  status: 'Rejected', stage: 'Proposal',
  groupStructure: 'standalone', companyType: 'Standalone',
  directorStatus: 'Rejected', directorDate: new Date(now - 5 * 86400000).toISOString(), directorBy: directors.audit,
  directorNotes: 'Rejected: Client is inactive and has outstanding fee disputes from prior engagement.',
  createdOffset: '-6 days'
})


// ── TAX DEPARTMENT ──

// Draft
insertRequest({
  clientId: clients.alshaya, requesterId: requesters.michael, department: 'Tax',
  requesterName: 'Michael Carter', serviceType: 'Tax Compliance Services',
  serviceDescription: 'Corporate income tax compliance and advisory for FY2025',
  status: 'Draft', stage: 'Proposal',
  groupStructure: 'has_parent', companyType: 'Subsidiary',
  createdOffset: '-4 days'
})

// Pending Director
insertRequest({
  clientId: clients.alghanim, requesterId: requesters.noura, department: 'Tax',
  requesterName: 'Noura Al-Qattan', serviceType: 'Tax Advisory Services',
  serviceDescription: 'Transfer pricing advisory for cross-border transactions',
  status: 'Pending Director Approval', stage: 'Proposal',
  groupStructure: 'has_parent', companyType: 'Parent', internationalOps: true,
  createdOffset: '-6 days'
})

// Pending Compliance
insertRequest({
  clientId: clients.kfh, requesterId: requesters.michael, department: 'Tax',
  requesterName: 'Michael Carter', serviceType: 'Tax Compliance Services',
  serviceDescription: 'Zakat calculation and Sharia compliance tax advisory',
  status: 'Pending Compliance', stage: 'Proposal',
  clientType: 'Listed', regulatedBody: 'CMA', pieStatus: 'Yes',
  groupStructure: 'has_parent', companyType: 'Parent',
  directorStatus: 'Approved', directorDate: new Date(now - 4 * 86400000).toISOString(), directorBy: directors.tax,
  createdOffset: '-8 days'
})

// Pending Partner
insertRequest({
  clientId: clients.equate, requesterId: requesters.noura, department: 'Tax',
  requesterName: 'Noura Al-Qattan', serviceType: 'Tax Advisory Services',
  serviceDescription: 'VAT implementation readiness assessment for petrochemical operations',
  status: 'Pending Partner', stage: 'Proposal',
  groupStructure: 'standalone', companyType: 'Standalone',
  directorStatus: 'Approved', directorDate: new Date(now - 10 * 86400000).toISOString(), directorBy: directors.tax,
  complianceStatus: 'Approved', complianceDate: new Date(now - 7 * 86400000).toISOString(), complianceBy: compliance.tax,
  createdOffset: '-14 days'
})

// Approved
insertRequest({
  clientId: clients.americana, requesterId: requesters.michael, department: 'Tax',
  requesterName: 'Michael Carter', serviceType: 'Tax Compliance Services',
  serviceDescription: 'Annual tax return preparation and filing',
  status: 'Approved', stage: 'Engagement',
  groupStructure: 'standalone', companyType: 'Standalone',
  directorStatus: 'Approved', directorDate: new Date(now - 20 * 86400000).toISOString(), directorBy: directors.tax,
  complianceStatus: 'Approved', complianceDate: new Date(now - 18 * 86400000).toISOString(), complianceBy: compliance.tax,
  partnerStatus: 'Approved', partnerDate: new Date(now - 16 * 86400000).toISOString(), partnerBy: partners.tax,
  financeStatus: 'Generated', engagementCode: 'ENG-2026-T001',
  createdOffset: '-25 days'
})


// ── ADVISORY DEPARTMENT ──

// Draft
insertRequest({
  clientId: clients.mabanee, requesterId: requesters.rachel, department: 'Advisory',
  requesterName: 'Rachel Thompson', serviceType: 'Business / Asset Valuation Services',
  serviceDescription: 'Valuation of The Avenues Mall expansion project for financing purposes',
  status: 'Draft', stage: 'Proposal', serviceCategory: 'Advisory',
  clientType: 'Listed', regulatedBody: 'CMA', pieStatus: 'Yes',
  groupStructure: 'standalone', companyType: 'Standalone',
  createdOffset: '-3 days'
})

// Pending Director
insertRequest({
  clientId: clients.tamdeen, requesterId: requesters.youssef, department: 'Advisory',
  requesterName: 'Youssef Mansour', serviceType: 'Business / Asset Valuation Services',
  serviceDescription: 'Portfolio valuation of mixed-use real estate developments',
  status: 'Pending Director Approval', stage: 'Proposal', serviceCategory: 'Advisory',
  groupStructure: 'standalone', companyType: 'Standalone',
  createdOffset: '-5 days'
})

// Pending Compliance
insertRequest({
  clientId: clients.knpc, requesterId: requesters.anna, department: 'Advisory',
  requesterName: 'Anna Kowalski', serviceType: 'Internal Audit Services',
  serviceDescription: 'Internal audit of procurement and contract management processes',
  status: 'Pending Compliance', stage: 'Proposal', serviceCategory: 'Advisory',
  groupStructure: 'standalone', companyType: 'Standalone',
  directorStatus: 'Approved', directorDate: new Date(now - 6 * 86400000).toISOString(), directorBy: directors.advisory,
  directorNotes: 'Approved. Verify no prior audit relationship that would impair independence.',
  createdOffset: '-10 days'
})

// Pending Partner (with restrictions from director)
insertRequest({
  clientId: clients.dhaman, requesterId: requesters.rachel, department: 'Advisory',
  requesterName: 'Rachel Thompson', serviceType: 'Consulting Services',
  serviceDescription: 'Healthcare operations efficiency consulting and process improvement',
  status: 'Pending Partner', stage: 'Proposal', serviceCategory: 'Advisory',
  clientType: 'Listed', regulatedBody: 'CMA',
  groupStructure: 'standalone', companyType: 'Standalone',
  directorStatus: 'Approved with Restrictions', directorDate: new Date(now - 8 * 86400000).toISOString(), directorBy: directors.advisory,
  directorNotes: 'Approved with restriction: Scope must exclude any financial statement preparation work.',
  complianceStatus: 'Approved', complianceDate: new Date(now - 5 * 86400000).toISOString(), complianceBy: compliance.advisory,
  complianceNotes: 'No conflicts. Director restriction noted and carried forward.',
  createdOffset: '-12 days'
})

// Approved
insertRequest({
  clientId: clients.wataniya, requesterId: requesters.youssef, department: 'Advisory',
  requesterName: 'Youssef Mansour', serviceType: 'Consulting Services',
  serviceDescription: 'Digital transformation roadmap and IT strategy advisory',
  status: 'Approved', stage: 'Engagement', serviceCategory: 'Advisory',
  clientType: 'Listed', regulatedBody: 'CMA',
  groupStructure: 'standalone', companyType: 'Standalone',
  directorStatus: 'Approved', directorDate: new Date(now - 22 * 86400000).toISOString(), directorBy: directors.advisory,
  complianceStatus: 'Approved', complianceDate: new Date(now - 20 * 86400000).toISOString(), complianceBy: compliance.advisory,
  partnerStatus: 'Approved', partnerDate: new Date(now - 18 * 86400000).toISOString(), partnerBy: partners.advisory,
  financeStatus: 'Generated', engagementCode: 'ENG-2026-V001',
  createdOffset: '-28 days'
})


// ── ACCOUNTING DEPARTMENT ──

// Draft
insertRequest({
  clientId: clients.alshaya, requesterId: requesters.tariq, department: 'Accounting',
  requesterName: 'Tariq Al-Enezi', serviceType: 'Accounting & Bookkeeping Services',
  serviceDescription: 'Monthly bookkeeping and management reporting for retail outlets',
  status: 'Draft', stage: 'Proposal', serviceCategory: 'Accounting',
  groupStructure: 'has_parent', companyType: 'Subsidiary',
  createdOffset: '-2 days'
})

// Pending Director
insertRequest({
  clientId: clients.boubyan, requesterId: requesters.samantha, department: 'Accounting',
  requesterName: 'Samantha Green', serviceType: 'Accounting & Bookkeeping Services',
  serviceDescription: 'IFRS conversion and financial statement preparation advisory',
  status: 'Pending Director Approval', stage: 'Proposal', serviceCategory: 'Accounting',
  clientType: 'Listed', regulatedBody: 'CMA', pieStatus: 'Yes',
  groupStructure: 'has_parent', companyType: 'Subsidiary',
  createdOffset: '-4 days'
})

// Pending Compliance
insertRequest({
  clientId: clients.alghanim, requesterId: requesters.tariq, department: 'Accounting',
  requesterName: 'Tariq Al-Enezi', serviceType: 'Accounting & Bookkeeping Services',
  serviceDescription: 'Consolidation and group reporting for diversified portfolio',
  status: 'Pending Compliance', stage: 'Proposal', serviceCategory: 'Accounting',
  groupStructure: 'has_parent', companyType: 'Parent',
  directorStatus: 'Approved', directorDate: new Date(now - 5 * 86400000).toISOString(), directorBy: directors.accounting,
  createdOffset: '-9 days'
})

// Approved
insertRequest({
  clientId: clients.acme, requesterId: requesters.samantha, department: 'Accounting',
  requesterName: 'Samantha Green', serviceType: 'Accounting & Bookkeeping Services',
  serviceDescription: 'Annual financial statement preparation and payroll processing',
  status: 'Approved', stage: 'Engagement', serviceCategory: 'Accounting',
  groupStructure: 'standalone', companyType: 'Standalone',
  directorStatus: 'Approved', directorDate: new Date(now - 18 * 86400000).toISOString(), directorBy: directors.accounting,
  complianceStatus: 'Approved', complianceDate: new Date(now - 16 * 86400000).toISOString(), complianceBy: compliance.accounting,
  partnerStatus: 'Approved', partnerDate: new Date(now - 14 * 86400000).toISOString(), partnerBy: partners.accounting,
  financeStatus: 'Generated', engagementCode: 'ENG-2026-C001',
  createdOffset: '-22 days'
})


// ── PROSPECT-BASED REQUESTS ──

// Prospect request (Draft) from Advisory
insertRequest({
  clientId: draftClientId, requesterId: requesters.anna, department: 'Advisory',
  requesterName: 'Anna Kowalski', serviceType: 'Business / Asset Valuation Services',
  serviceDescription: 'Preliminary valuation of renewable energy startup for investment advisory',
  status: 'Draft', stage: 'Proposal', serviceCategory: 'Advisory',
  groupStructure: 'standalone', companyType: 'Standalone',
  isProspect: true, prospectId: newProspects.p20,
  createdOffset: '-1 days'
})

// Prospect request (Pending Director) from Tax
insertRequest({
  clientId: draftClientId, requesterId: requesters.noura, department: 'Tax',
  requesterName: 'Noura Al-Qattan', serviceType: 'Tax Advisory Services',
  serviceDescription: 'Tax structuring advisory for cement company expansion',
  status: 'Pending Director Approval', stage: 'Proposal',
  groupStructure: 'standalone', companyType: 'Standalone',
  isProspect: true, prospectId: newProspects.p18,
  createdOffset: '-3 days'
})


// ─── SUMMARY ───────────────────────────────────────────────────────────────

const totalUsers = db.prepare('SELECT COUNT(*) as n FROM users').get().n
const totalClients = db.prepare('SELECT COUNT(*) as n FROM clients').get().n
const totalProspects = db.prepare('SELECT COUNT(*) as n FROM prospects').get().n
const totalRequests = db.prepare('SELECT COUNT(*) as n FROM coi_requests').get().n

console.log('\n=== Seed Summary ===')
console.log(`Users:      ${totalUsers}`)
console.log(`Clients:    ${totalClients}`)
console.log(`Prospects:  ${totalProspects}`)
console.log(`Requests:   ${totalRequests}`)

// Status breakdown
const statusBreakdown = db.prepare(`
  SELECT status, COUNT(*) as n FROM coi_requests GROUP BY status ORDER BY
  CASE status
    WHEN 'Draft' THEN 1
    WHEN 'Pending Director Approval' THEN 2
    WHEN 'Pending Compliance' THEN 3
    WHEN 'Pending Partner' THEN 4
    WHEN 'Pending Finance' THEN 5
    WHEN 'Approved' THEN 6
    WHEN 'Rejected' THEN 7
  END
`).all()
console.log('\nRequests by status:')
for (const row of statusBreakdown) {
  console.log(`  ${row.status.padEnd(28)} ${row.n}`)
}

// Department breakdown
const deptBreakdown = db.prepare(`
  SELECT department, COUNT(*) as n FROM coi_requests GROUP BY department ORDER BY department
`).all()
console.log('\nRequests by department:')
for (const row of deptBreakdown) {
  console.log(`  ${row.department.padEnd(12)} ${row.n}`)
}

console.log('\n✅ Expanded seed data complete!')
console.log('Login credentials: any email above with password "password"')
console.log('\nSample logins by role:')
console.log('  Requester (Audit):      patricia.white@company.com')
console.log('  Requester (Tax):        michael.carter@company.com')
console.log('  Requester (Advisory):   rachel.thompson@company.com')
console.log('  Requester (Accounting): tariq.enezi@company.com')
console.log('  Director  (Audit):      john.smith@company.com')
console.log('  Director  (Tax):        sarah.mitchell@company.com')
console.log('  Compliance (Audit):     emily.davis@company.com')
console.log('  Partner   (Advisory):   diana.rodriguez@company.com')
console.log('  Finance:                lisa.thomas@company.com')

db.close()
