import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  getGlobalSubmission,
  createGlobalSubmission,
  updateGlobalSubmission,
  exportToExcel,
  updateSubmissionStatus,
  getPendingSubmissions
} from '../controllers/globalCOIController.js'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Get all pending international submissions
router.get('/pending', getPendingSubmissions)

// Get Global COI submission for a request
router.get('/request/:requestId', getGlobalSubmission)

// Create Global COI submission
router.post('/request/:requestId', createGlobalSubmission)

// Update Global COI submission
router.put('/:submissionId', updateGlobalSubmission)

// Export to Excel
router.get('/request/:requestId/export', exportToExcel)

// Update submission status (from Global Portal response)
router.put('/:submissionId/status', updateSubmissionStatus)

export default router

