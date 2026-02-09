import { getDatabase } from '../database/init.js'
import { getUserById } from '../utils/userUtils.js'
import { logFunnelEvent, FUNNEL_STAGES, getLeadSourceIdOrDefault } from '../services/funnelTrackingService.js'

const db = getDatabase()

/**
 * Auto-detect lead source based on context (industry standard: first-touch, immutable)
 * Priority:
 * 1. If source_opportunity_id provided → 'insights_module'
 * 2. If referred_by_client_id provided → 'client_referral'
 * 3. If creator is Partner/Director → 'internal_referral'
 * 4. If lead_source_id explicitly provided → use it
 * 5. Default → 'unknown'
 */
function autoDetectLeadSource(params, user) {
  const { source_opportunity_id, referred_by_client_id, lead_source_id } = params
  
  // Priority 1: From Insights Module opportunity
  if (source_opportunity_id) {
    return {
      lead_source_id: getLeadSourceIdOrDefault('insights_module'),
      source: 'insights_module',
      auto_detected: true
    }
  }
  
  // Priority 2: Client referral
  if (referred_by_client_id) {
    return {
      lead_source_id: getLeadSourceIdOrDefault('client_referral'),
      source: 'client_referral',
      auto_detected: true
    }
  }
  
  // Priority 3: Internal referral (Partner/Director creating prospect)
  if (user && ['Partner', 'Director'].includes(user.role)) {
    return {
      lead_source_id: getLeadSourceIdOrDefault('internal_referral'),
      source: 'internal_referral',
      auto_detected: true,
      referred_by_user_id: user.id
    }
  }
  
  // Priority 4: Explicitly provided lead source
  if (lead_source_id) {
    return {
      lead_source_id: lead_source_id,
      source: 'manual',
      auto_detected: false
    }
  }
  
  // Priority 5: Default to unknown
  return {
    lead_source_id: getLeadSourceIdOrDefault('unknown'),
    source: 'unknown',
    auto_detected: true
  }
}

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

// Get prospects for dropdown (minimal data, active only)
export async function getProspectsForDropdown(req, res) {
  try {
    const { search } = req.query
    
    let query = `
      SELECT 
        p.id,
        p.prospect_name,
        p.industry,
        p.commercial_registration,
        p.status,
        p.client_id,
        c.client_name as linked_client_name
      FROM prospects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.status = 'Active'
    `
    const params = []
    
    if (search) {
      query += ' AND (p.prospect_name LIKE ? OR p.commercial_registration LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm)
    }
    
    query += ' ORDER BY p.prospect_name ASC LIMIT 50'
    
    const prospects = db.prepare(query).all(...params)
    
    res.json(prospects)
  } catch (error) {
    console.error('Error fetching prospects for dropdown:', error)
    return res.status(500).json({ error: 'Failed to load prospects.' })
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

// Create prospect with lead source auto-detection
export async function createProspect(req, res) {
  try {
    const {
      prospect_name,
      commercial_registration,
      industry,
      nature_of_business,
      client_id,
      group_level_services,
      prms_client_code,
      // New lead attribution fields
      lead_source_id,
      referred_by_client_id,
      source_opportunity_id,
      source_notes
    } = req.body
    
    if (!prospect_name) {
      return res.status(400).json({ error: 'Prospect name is required' })
    }
    
    // Get current user for auto-detection
    const user = req.userId ? getUserById(req.userId) : null
    
    // Auto-detect lead source based on context (industry standard: first-touch, immutable)
    const leadSourceResult = autoDetectLeadSource({
      source_opportunity_id,
      referred_by_client_id,
      lead_source_id
    }, user)
    
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
    
    // Validate referred_by_client_id if provided
    if (referred_by_client_id) {
      const referringClient = db.prepare('SELECT id FROM clients WHERE id = ?').get(referred_by_client_id)
      if (!referringClient) {
        return res.status(400).json({ error: 'Referring client not found' })
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
        status,
        lead_source_id,
        referred_by_user_id,
        referred_by_client_id,
        source_opportunity_id,
        source_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'Active', ?, ?, ?, ?, ?)
    `).run(
      prospect_name,
      commercial_registration || null,
      industry || null,
      nature_of_business || null,
      client_id || null,
      group_level_services ? JSON.stringify(group_level_services) : null,
      prms_client_code || null,
      prms_synced,
      leadSourceResult.lead_source_id,
      leadSourceResult.referred_by_user_id || null,
      referred_by_client_id || null,
      source_opportunity_id || null,
      source_notes || null
    )
    
    const newProspect = db.prepare(`
      SELECT p.*, ls.source_name as lead_source_name, ls.source_category as lead_source_category
      FROM prospects p
      LEFT JOIN lead_sources ls ON p.lead_source_id = ls.id
      WHERE p.id = ?
    `).get(result.lastInsertRowid)
    
    newProspect.group_level_services = newProspect.group_level_services 
      ? JSON.parse(newProspect.group_level_services) 
      : []
    
    // Log funnel event: lead_created
    logFunnelEvent({
      prospectId: newProspect.id,
      coiRequestId: null,
      fromStage: null,
      toStage: FUNNEL_STAGES.LEAD_CREATED,
      userId: user?.id,
      userRole: user?.role,
      notes: `Prospect created: ${prospect_name}`,
      metadata: {
        lead_source: leadSourceResult.source,
        auto_detected: leadSourceResult.auto_detected,
        source_opportunity_id
      }
    })
    
    res.status(201).json({
      ...newProspect,
      lead_source_auto_detected: leadSourceResult.auto_detected,
      lead_source_detection_reason: leadSourceResult.source
    })
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

// Get all lead sources for dropdowns
export async function getLeadSources(req, res) {
  try {
    const leadSources = db.prepare(`
      SELECT id, source_code, source_name, source_category
      FROM lead_sources
      WHERE is_active = 1
      ORDER BY 
        CASE source_category 
          WHEN 'referral' THEN 1 
          WHEN 'system' THEN 2 
          WHEN 'outbound' THEN 3 
          ELSE 4 
        END,
        source_name
    `).all()
    
    res.json(leadSources)
  } catch (error) {
    console.error('Error fetching lead sources:', error)
    return res.status(500).json({ error: 'Failed to load lead sources.' })
  }
}

// Create prospect from opportunity (Client Intelligence integration)
export async function createProspectFromOpportunity(req, res) {
  try {
    const { opportunity_id } = req.params
    const user = req.userId ? getUserById(req.userId) : null
    
    // Get the opportunity
    const opportunity = db.prepare(`
      SELECT co.*, c.client_name, c.industry
      FROM client_opportunities co
      JOIN clients c ON co.client_id = c.id
      WHERE co.id = ?
    `).get(opportunity_id)
    
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' })
    }
    
    // Check if prospect already exists for this opportunity
    const existingProspect = db.prepare(`
      SELECT id FROM prospects WHERE source_opportunity_id = ?
    `).get(opportunity_id)
    
    if (existingProspect) {
      return res.status(400).json({ 
        error: 'Prospect already exists for this opportunity',
        prospect_id: existingProspect.id
      })
    }
    
    // Auto-set lead source to insights_module
    const leadSourceId = getLeadSourceIdOrDefault('insights_module')
    
    // Create prospect from opportunity
    const result = db.prepare(`
      INSERT INTO prospects (
        prospect_name,
        industry,
        nature_of_business,
        status,
        lead_source_id,
        source_opportunity_id,
        source_notes
      ) VALUES (?, ?, ?, 'Active', ?, ?, ?)
    `).run(
      opportunity.title || `Opportunity from ${opportunity.client_name}`,
      opportunity.industry,
      opportunity.description,
      leadSourceId,
      opportunity_id,
      `Created from Client Intelligence opportunity: ${opportunity.opportunity_type}`
    )
    
    const newProspect = db.prepare(`
      SELECT p.*, ls.source_name as lead_source_name
      FROM prospects p
      LEFT JOIN lead_sources ls ON p.lead_source_id = ls.id
      WHERE p.id = ?
    `).get(result.lastInsertRowid)
    
    // Update opportunity status
    db.prepare(`
      UPDATE client_opportunities 
      SET status = 'prospect_created', 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(opportunity_id)
    
    // Log funnel event
    logFunnelEvent({
      prospectId: newProspect.id,
      coiRequestId: null,
      fromStage: null,
      toStage: FUNNEL_STAGES.LEAD_CREATED,
      userId: user?.id,
      userRole: user?.role,
      notes: `Prospect created from Client Intelligence opportunity`,
      metadata: {
        lead_source: 'insights_module',
        auto_detected: true,
        source_opportunity_id: opportunity_id,
        opportunity_type: opportunity.opportunity_type
      }
    })
    
    res.status(201).json({
      ...newProspect,
      lead_source_auto_detected: true,
      lead_source_detection_reason: 'insights_module',
      source_opportunity: opportunity
    })
  } catch (error) {
    console.error('Error creating prospect from opportunity:', error)
    res.status(500).json({ error: error.message })
  }
}
