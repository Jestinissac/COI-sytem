import { getDatabase } from '../database/init.js'
import { getUserById } from '../utils/userUtils.js'

const db = getDatabase()

/**
 * Get all services for a specific client (COI + PRMS historical data)
 * Excludes all financial data (fees, costs)
 * Accessible to: Compliance, Partner, Super Admin
 */
export async function getClientServices(req, res) {
  try {
    const user = getUserById(req.userId)
    
    // Check permissions
    if (!['Compliance', 'Partner', 'Super Admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    const { clientId } = req.params
    
    // 1. Get COI services for this client
    const coiServices = db.prepare(`
      SELECT 
        cr.request_id,
        cr.service_type,
        cr.service_sub_category,
        cr.service_description,
        cr.requested_document as engagement_type,
        cr.requested_service_period_start as start_date,
        cr.requested_service_period_end as end_date,
        cr.status,
        cr.requestor_name as engagement_partner,
        cr.created_at,
        'COI' as source
      FROM coi_requests cr
      WHERE cr.client_id = ? AND cr.status IN ('Approved', 'Active', 'Completed')
      ORDER BY cr.created_at DESC
    `).all(clientId)
    
    // 2. Get PRMS historical engagements (mock for prototype)
    const prmsServices = await fetchPRMSEngagements(clientId)
    
    // 3. Merge and sort by date
    const allServices = [...coiServices, ...prmsServices]
      .sort((a, b) => new Date(b.start_date || b.created_at) - new Date(a.start_date || a.created_at))
    
    res.json({
      clientId,
      services: allServices,
      total: allServices.length,
      coiCount: coiServices.length,
      prmsCount: prmsServices.length
    })
  } catch (error) {
    console.error('Error fetching client services:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Get all client services across all clients (COI + PRMS)
 * With filters and pagination
 * Accessible to: Compliance, Partner, Super Admin
 */
export async function getAllClientServices(req, res) {
  try {
    const user = getUserById(req.userId)
    
    // Check permissions
    if (!['Compliance', 'Partner', 'Super Admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    const { 
      client, 
      service_type, 
      date_from, 
      date_to, 
      status, 
      partner, 
      source, // 'COI', 'PRMS', or 'all'
      page = 1, 
      limit = 50 
    } = req.query
    
    // Build COI query
    let coiQuery = `
      SELECT 
        cr.id,
        cr.request_id,
        c.client_name,
        c.client_code,
        cr.service_type,
        cr.service_sub_category,
        cr.service_description,
        cr.requested_document as engagement_type,
        cr.requested_service_period_start as start_date,
        cr.requested_service_period_end as end_date,
        cr.status,
        cr.requestor_name as engagement_partner,
        cr.created_at,
        'COI' as source
      FROM coi_requests cr
      LEFT JOIN clients c ON cr.client_id = c.id
      WHERE cr.status IN ('Approved', 'Active', 'Completed')
    `
    const coiParams = []
    
    if (client) {
      coiQuery += ' AND c.client_name LIKE ?'
      coiParams.push(`%${client}%`)
    }
    
    if (service_type) {
      coiQuery += ' AND cr.service_type LIKE ?'
      coiParams.push(`%${service_type}%`)
    }
    
    if (date_from) {
      coiQuery += ' AND cr.created_at >= ?'
      coiParams.push(date_from)
    }
    
    if (date_to) {
      coiQuery += ' AND cr.created_at <= ?'
      coiParams.push(date_to)
    }
    
    if (status) {
      coiQuery += ' AND cr.status = ?'
      coiParams.push(status)
    }
    
    if (partner) {
      coiQuery += ' AND cr.requestor_name LIKE ?'
      coiParams.push(`%${partner}%`)
    }
    
    // Get COI services (if source is 'COI' or 'all')
    let coiServices = []
    if (!source || source === 'all' || source === 'COI') {
      coiServices = db.prepare(coiQuery).all(...coiParams)
    }
    
    // Get PRMS services (if source is 'PRMS' or 'all')
    let prmsServices = []
    if (!source || source === 'all' || source === 'PRMS') {
      // For prototype: Get mock PRMS data for all clients
      prmsServices = await fetchAllPRMSEngagements({ client, service_type, date_from, date_to, status, partner })
    }
    
    // Merge and sort
    const allServices = [...coiServices, ...prmsServices]
      .sort((a, b) => new Date(b.start_date || b.created_at) - new Date(a.start_date || a.created_at))
    
    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const paginatedServices = allServices.slice(offset, offset + parseInt(limit))
    
    res.json({
      services: paginatedServices,
      total: allServices.length,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(allServices.length / parseInt(limit)),
      coiCount: coiServices.length,
      prmsCount: prmsServices.length
    })
  } catch (error) {
    console.error('Error fetching all client services:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Mock PRMS engagement data fetcher for a specific client
 * In production: Call PRMS API or query PRMS database
 */
async function fetchPRMSEngagements(clientId) {
  // For prototype: Return mock historical data
  // In production, this would be replaced with actual PRMS API calls
  
  // Mock: Get client info to generate realistic data
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId)
  
  if (!client) {
    return []
  }
  
  // Mock historical engagements (3 years of data)
  return [
    {
      engagement_id: `PRMS-${client.client_code}-2023-001`,
      service_type: 'Statutory Audit',
      service_sub_category: null,
      service_description: 'Annual statutory audit for year ending Dec 2023',
      engagement_type: 'Engagement',
      start_date: '2023-01-01',
      end_date: '2023-12-31',
      status: 'Completed',
      engagement_partner: 'John Partner',
      created_at: '2023-01-01',
      source: 'PRMS'
    },
    {
      engagement_id: `PRMS-${client.client_code}-2024-001`,
      service_type: 'Tax Compliance',
      service_sub_category: null,
      service_description: 'Tax return preparation and filing',
      engagement_type: 'Engagement',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      status: 'Completed',
      engagement_partner: 'Sarah Tax Lead',
      created_at: '2024-01-01',
      source: 'PRMS'
    }
  ]
}

/**
 * Mock PRMS engagement data fetcher for all clients (with filters)
 * In production: Call PRMS API or query PRMS database
 */
async function fetchAllPRMSEngagements(filters = {}) {
  // For prototype: Return mock data for all clients
  // In production, this would be replaced with actual PRMS API calls with filters applied
  
  const allClients = db.prepare('SELECT id, client_code, client_name FROM clients WHERE client_code IS NOT NULL LIMIT 10').all()
  
  const prmsData = []
  
  for (const client of allClients) {
    // Apply client filter if provided
    if (filters.client && !client.client_name.toLowerCase().includes(filters.client.toLowerCase())) {
      continue
    }
    
    // Mock 1-2 historical engagements per client
    const engagements = [
      {
        engagement_id: `PRMS-${client.client_code}-2023-001`,
        client_name: client.client_name,
        client_code: client.client_code,
        service_type: 'Statutory Audit',
        service_sub_category: null,
        service_description: 'Annual statutory audit',
        engagement_type: 'Engagement',
        start_date: '2023-01-01',
        end_date: '2023-12-31',
        status: 'Completed',
        engagement_partner: 'John Partner',
        created_at: '2023-01-01',
        source: 'PRMS'
      }
    ]
    
    // Apply service type filter
    const filteredEngagements = engagements.filter(e => {
      if (filters.service_type && !e.service_type.toLowerCase().includes(filters.service_type.toLowerCase())) {
        return false
      }
      if (filters.date_from && e.start_date < filters.date_from) {
        return false
      }
      if (filters.date_to && e.start_date > filters.date_to) {
        return false
      }
      if (filters.partner && !e.engagement_partner.toLowerCase().includes(filters.partner.toLowerCase())) {
        return false
      }
      return true
    })
    
    prmsData.push(...filteredEngagements)
  }
  
  return prmsData
}
