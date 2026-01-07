import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  getISQMForms,
  createClientScreening,
  createClientAcceptance,
  updateISQMForm,
  reviewISQMForm
} from '../controllers/isqmController.js'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Get ISQM forms for a COI request
router.get('/request/:requestId', getISQMForms)

// Create Client Screening Questionnaire
router.post('/request/:requestId/screening', createClientScreening)

// Create New Client Acceptance Checklist
router.post('/request/:requestId/acceptance', createClientAcceptance)

// Update ISQM form
router.put('/:formId', updateISQMForm)

// Review ISQM form (compliance/partner)
router.post('/:formId/review', reviewISQMForm)

export default router

