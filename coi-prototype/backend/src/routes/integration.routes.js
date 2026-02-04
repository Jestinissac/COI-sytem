import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { getClients, validateEngagementCode, getEngagementCodes, createProject } from '../controllers/integrationController.js'
import { getServiceTypes, getServiceSubCategories, getAmbiguousServiceConfig } from '../controllers/serviceTypeController.js'
import { getDatabase } from '../database/init.js'

const router = express.Router()

router.use(authenticateToken)

router.get('/clients', getClients)
router.get('/validate-engagement-code/:code', validateEngagementCode)
router.get('/engagement-codes', getEngagementCodes)
router.post('/projects', createProject)
router.get('/service-types', getServiceTypes)
router.get('/service-types/:serviceType/sub-categories', getServiceSubCategories)
router.get('/ambiguous-service-config', getAmbiguousServiceConfig)

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

// Treat PRMS "TBD" as empty for pre-fill (parent company bidirectional sync)
function normalizeParentForPrefill (value) {
  if (value == null || value === '') return null
  const v = String(value).trim().toUpperCase()
  if (v === 'TBD' || v === '') return null
  return value
}

router.get('/prms/client/:clientId', async (req, res) => {
  try {
    const db = getDatabase()
    const { clientId } = req.params
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId)
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }
    
    let parentCompany = null
    let parentCompanyName = null
    if (client.parent_company_id) {
      parentCompany = db.prepare('SELECT * FROM clients WHERE id = ?').get(client.parent_company_id)
      parentCompanyName = parentCompany ? parentCompany.client_name : null
    }
    if (parentCompanyName == null && client.parent_company) {
      parentCompanyName = client.parent_company
    }
    parentCompanyName = normalizeParentForPrefill(parentCompanyName)
    
    // In production, this would query PRMS
    res.json({
      client: {
        client_name: client.client_name,
        client_code: client.client_code,
        status: client.status,
        industry: client.industry,
        commercial_registration: client.commercial_registration
      },
      parent_company: parentCompanyName,
      parent_company_detail: parentCompany ? {
        client_name: parentCompany.client_name,
        client_code: parentCompany.client_code
      } : null
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router

