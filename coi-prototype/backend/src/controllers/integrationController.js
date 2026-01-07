import { getDatabase } from '../database/init.js'

const db = getDatabase()

export async function getClients(req, res) {
  try {
    const clients = db.prepare('SELECT * FROM clients WHERE status = ? ORDER BY client_name').all('Active')
    res.json(clients)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function validateEngagementCode(req, res) {
  try {
    const { code } = req.params
    const engagement = db.prepare('SELECT * FROM coi_engagement_codes WHERE engagement_code = ? AND status = ?').get(code, 'Active')
    
    if (engagement) {
      res.json({ valid: true, engagement })
    } else {
      res.json({ valid: false })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function getEngagementCodes(req, res) {
  try {
    const codes = db.prepare(`
      SELECT engagement_code, service_type, year, status 
      FROM coi_engagement_codes 
      WHERE status = 'Active'
      ORDER BY year DESC, sequential_number DESC
      LIMIT 50
    `).all()
    res.json(codes)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function createProject(req, res) {
  try {
    const { engagement_code, client_code, project_id } = req.body
    
    if (!engagement_code || !client_code) {
      return res.status(400).json({ error: 'Engagement code and client code required' })
    }
    
    // Verify engagement code exists and is Active
    const engagement = db.prepare('SELECT * FROM coi_engagement_codes WHERE engagement_code = ? AND status = ?').get(engagement_code, 'Active')
    
    if (!engagement) {
      return res.status(400).json({ error: 'Invalid or inactive Engagement Code' })
    }
    
    // Generate project_id if not provided
    const finalProjectId = project_id || `PROJ-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
    
    // Insert project (trigger will enforce Active status check)
    try {
      const result = db.prepare(`
        INSERT INTO prms_projects (project_id, engagement_code, client_code, status)
        VALUES (?, ?, ?, 'Active')
      `).run(finalProjectId, engagement_code, client_code)
      
      res.json({ 
        success: true, 
        project_id: finalProjectId,
        id: result.lastInsertRowid 
      })
    } catch (error) {
      // Trigger will raise error if engagement code not Active
      if (error.message.includes('Engagement Code must be Active')) {
        return res.status(400).json({ error: 'Engagement Code must be Active to create PRMS project' })
      }
      throw error
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

