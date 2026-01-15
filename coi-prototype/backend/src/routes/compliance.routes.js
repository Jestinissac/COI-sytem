import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { getClientServices, getAllClientServices } from '../controllers/complianceController.js'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Compliance-only routes (also accessible to Partner and Super Admin)
// Get services for a specific client (COI + PRMS historical data)
router.get('/client-services/:clientId', 
  requireRole('Compliance', 'Partner', 'Super Admin'), 
  getClientServices
)

// Get all client services across all clients with filters
router.get('/all-client-services', 
  requireRole('Compliance', 'Partner', 'Super Admin'), 
  getAllClientServices
)

export default router
