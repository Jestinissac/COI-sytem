import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { getClients, validateEngagementCode, getEngagementCodes, createProject } from '../controllers/integrationController.js'
import { getDatabase } from '../database/init.js'

const router = express.Router()

router.use(authenticateToken)

router.get('/clients', getClients)
router.get('/validate-engagement-code/:code', validateEngagementCode)
router.get('/engagement-codes', getEngagementCodes)
router.post('/projects', createProject)

// HRMS/PRMS Data Sources for LC/NC
router.get('/hrms/user-data', async (req, res) => {
  try {
    const db = getDatabase()
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId)
    
    let director = null
    if (user.director_id) {
      director = db.prepare('SELECT * FROM users WHERE id = ?').get(user.director_id)
    }
    
    // In production, this would query HRMS
    // For prototype, return data from COI users table
    res.json({
      user: {
        name: user.name,
        email: user.email,
        department: user.department,
        line_of_service: user.line_of_service,
        role: user.role
      },
      director: director ? {
        name: director.name,
        email: director.email,
        department: director.department
      } : null,
      hierarchy: {
        // Can include manager chain, department structure, etc.
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/prms/client/:clientId', async (req, res) => {
  try {
    const db = getDatabase()
    const { clientId } = req.params
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId)
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }
    
    let parentCompany = null
    if (client.parent_company_id) {
      parentCompany = db.prepare('SELECT * FROM clients WHERE id = ?').get(client.parent_company_id)
    }
    
    // In production, this would query PRMS
    res.json({
      client: {
        client_name: client.client_name,
        client_code: client.client_code,
        status: client.status,
        industry: client.industry,
        commercial_registration: client.commercial_registration
      },
      parent_company: parentCompany ? {
        client_name: parentCompany.client_name,
        client_code: parentCompany.client_code
      } : null
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router


  try {
    const db = getDatabase()
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId)
    
    let director = null
    if (user.director_id) {
      director = db.prepare('SELECT * FROM users WHERE id = ?').get(user.director_id)
    }
    
    // In production, this would query HRMS
    // For prototype, return data from COI users table
    res.json({
      user: {
        name: user.name,
        email: user.email,
        department: user.department,
        line_of_service: user.line_of_service,
        role: user.role
      },
      director: director ? {
        name: director.name,
        email: director.email,
        department: director.department
      } : null,
      hierarchy: {
        // Can include manager chain, department structure, etc.
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/prms/client/:clientId', async (req, res) => {
  try {
    const db = getDatabase()
    const { clientId } = req.params
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId)
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }
    
    let parentCompany = null
    if (client.parent_company_id) {
      parentCompany = db.prepare('SELECT * FROM clients WHERE id = ?').get(client.parent_company_id)
    }
    
    // In production, this would query PRMS
    res.json({
      client: {
        client_name: client.client_name,
        client_code: client.client_code,
        status: client.status,
        industry: client.industry,
        commercial_registration: client.commercial_registration
      },
      parent_company: parentCompany ? {
        client_name: parentCompany.client_name,
        client_code: parentCompany.client_code
      } : null
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router

