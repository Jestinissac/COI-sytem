import { getDatabase } from '../database/init.js'

const db = getDatabase()

// Get all prospects
export async function getProspects(req, res) {
  try {
    const { status, client_id, search, prms_synced } = req.query
    
    let query = `
      SELECT 
        p.*,
        c.client_name as linked_client_name,
        c.client_code as linked_client_code
      FROM prospects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE 1=1
    `
    const params = []
    
    if (status) {
      query += ' AND p.status = ?'
      params.push(status)
    }
    
    if (client_id) {
      query += ' AND p.client_id = ?'
      params.push(client_id)
    }
    
    if (prms_synced === 'true') {
      query += ' AND p.prms_synced = 1'
    } else if (prms_synced === 'false') {
      query += ' AND p.prms_synced = 0'
    }
    
    if (search) {
      query += ' AND (p.prospect_name LIKE ? OR p.commercial_registration LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm)
    }
    
    query += ' ORDER BY p.created_at DESC'
    
    const prospects = db.prepare(query).all(...params)
    
    // Parse group_level_services JSON
    const prospectsWithParsed = prospects.map(p => ({
      ...p,
      group_level_services: p.group_level_services ? JSON.parse(p.group_level_services) : []
    }))
    
    res.json(prospectsWithParsed)
  } catch (error) {
    console.error('Error fetching prospects:', error)
    res.status(500).json({ error: error.message })
  }
}

// Get single prospect
export async function getProspect(req, res) {
  try {
    const { id } = req.params
    
    const prospect = db.prepare(`
      SELECT 
        p.*,
        c.client_name as linked_client_name,
        c.client_code as linked_client_code
      FROM prospects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.id = ?
    `).get(id)
    
    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found' })
    }
    
    prospect.group_level_services = prospect.group_level_services 
      ? JSON.parse(prospect.group_level_services) 
      : []
    
    res.json(prospect)
  } catch (error) {
    console.error('Error fetching prospect:', error)
    res.status(500).json({ error: error.message })
  }
}

// Create prospect
export async function createProspect(req, res) {
  try {
    const {
      prospect_name,
      commercial_registration,
      industry,
      nature_of_business,
      client_id,
      group_level_services,
      prms_client_code
    } = req.body
    
    if (!prospect_name) {
      return res.status(400).json({ error: 'Prospect name is required' })
    }
    
    // Check if client exists in PRMS (if prms_client_code provided)
    let prms_synced = 0
    if (prms_client_code) {
      // TODO: Integrate with PRMS API to verify client exists
      // For now, if prms_client_code is provided, mark as synced
      prms_synced = 1
    }
    
    // If client_id provided, link prospect to existing client
    if (client_id) {
      const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(client_id)
      if (!client) {
        return res.status(400).json({ error: 'Client not found' })
      }
    }
    
    const result = db.prepare(`
      INSERT INTO prospects (
        prospect_name,
        commercial_registration,
        industry,
        nature_of_business,
        client_id,
        group_level_services,
        prms_client_code,
        prms_synced,
        prms_sync_date,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'Active')
    `).run(
      prospect_name,
      commercial_registration || null,
      industry || null,
      nature_of_business || null,
      client_id || null,
      group_level_services ? JSON.stringify(group_level_services) : null,
      prms_client_code || null,
      prms_synced
    )
    
    const newProspect = db.prepare('SELECT * FROM prospects WHERE id = ?').get(result.lastInsertRowid)
    newProspect.group_level_services = newProspect.group_level_services 
      ? JSON.parse(newProspect.group_level_services) 
      : []
    
    res.status(201).json(newProspect)
  } catch (error) {
    console.error('Error creating prospect:', error)
    res.status(500).json({ error: error.message })
  }
}

// Update prospect
export async function updateProspect(req, res) {
  try {
    const { id } = req.params
    const {
      prospect_name,
      commercial_registration,
      industry,
      nature_of_business,
      client_id,
      group_level_services,
      prms_client_code,
      status
    } = req.body
    
    const existing = db.prepare('SELECT id FROM prospects WHERE id = ?').get(id)
    if (!existing) {
      return res.status(404).json({ error: 'Prospect not found' })
    }
    
    db.prepare(`
      UPDATE prospects SET
        prospect_name = COALESCE(?, prospect_name),
        commercial_registration = COALESCE(?, commercial_registration),
        industry = COALESCE(?, industry),
        nature_of_business = COALESCE(?, nature_of_business),
        client_id = COALESCE(?, client_id),
        group_level_services = COALESCE(?, group_level_services),
        prms_client_code = COALESCE(?, prms_client_code),
        status = COALESCE(?, status),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      prospect_name,
      commercial_registration,
      industry,
      nature_of_business,
      client_id,
      group_level_services ? JSON.stringify(group_level_services) : null,
      prms_client_code,
      status,
      id
    )
    
    const updated = db.prepare('SELECT * FROM prospects WHERE id = ?').get(id)
    updated.group_level_services = updated.group_level_services 
      ? JSON.parse(updated.group_level_services) 
      : []
    
    res.json(updated)
  } catch (error) {
    console.error('Error updating prospect:', error)
    res.status(500).json({ error: error.message })
  }
}

// Convert prospect to client
export async function convertProspectToClient(req, res) {
  try {
    const { id } = req.params
    const { client_code, client_name } = req.body
    
    const prospect = db.prepare('SELECT * FROM prospects WHERE id = ?').get(id)
    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found' })
    }
    
    if (prospect.status === 'Converted') {
      return res.status(400).json({ error: 'Prospect already converted' })
    }
    
    // Create new client or use existing
    let clientId = prospect.client_id
    
    if (!clientId) {
      // Create new client
      if (!client_code || !client_name) {
        return res.status(400).json({ error: 'client_code and client_name required to create new client' })
      }
      
      const clientResult = db.prepare(`
        INSERT INTO clients (
          client_code,
          client_name,
          commercial_registration,
          industry,
          nature_of_business,
          status
        ) VALUES (?, ?, ?, ?, ?, 'Active')
      `).run(
        client_code,
        client_name || prospect.prospect_name,
        prospect.commercial_registration,
        prospect.industry,
        prospect.nature_of_business
      )
      
      clientId = clientResult.lastInsertRowid
    }
    
    // Update prospect
    db.prepare(`
      UPDATE prospects SET
        status = 'Converted',
        converted_to_client_id = ?,
        converted_date = datetime('now'),
        client_id = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(clientId, clientId, id)
    
    // Update any COI requests linked to this prospect
    db.prepare(`
      UPDATE coi_requests SET
        client_id = ?,
        is_prospect = 0,
        prospect_id = NULL
      WHERE prospect_id = ?
    `).run(clientId, id)
    
    const updated = db.prepare(`
      SELECT p.*, c.client_name, c.client_code
      FROM prospects p
      JOIN clients c ON p.converted_to_client_id = c.id
      WHERE p.id = ?
    `).get(id)
    
    res.json({ 
      success: true, 
      prospect: updated,
      client_id: clientId
    })
  } catch (error) {
    console.error('Error converting prospect to client:', error)
    res.status(500).json({ error: error.message })
  }
}

// Check if prospect exists in PRMS
export async function checkPRMSClient(req, res) {
  try {
    const { prms_client_code } = req.query
    
    if (!prms_client_code) {
      return res.status(400).json({ error: 'prms_client_code is required' })
    }
    
    // TODO: Integrate with PRMS API
    // For now, return mock response
    // In production, this should call PRMS API to verify client exists
    
    const exists = db.prepare('SELECT id FROM clients WHERE client_code = ?').get(prms_client_code)
    
    res.json({
      exists: !!exists,
      prms_client_code,
      client_id: exists?.id || null
    })
  } catch (error) {
    console.error('Error checking PRMS client:', error)
    res.status(500).json({ error: error.message })
  }
}

// Get prospects by client (group level services)
export async function getProspectsByClient(req, res) {
  try {
    const { client_id } = req.params
    
    const prospects = db.prepare(`
      SELECT * FROM prospects
      WHERE client_id = ? AND status = 'Active'
      ORDER BY created_at DESC
    `).all(client_id)
    
    const prospectsWithParsed = prospects.map(p => ({
      ...p,
      group_level_services: p.group_level_services ? JSON.parse(p.group_level_services) : []
    }))
    
    res.json(prospectsWithParsed)
  } catch (error) {
    console.error('Error fetching prospects by client:', error)
    res.status(500).json({ error: error.message })
  }
}
