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
import { exportGlobalCOIFormExcel } from '../services/excelExportService.js'
import { generateExcelFromFormData } from '../controllers/globalCOIFormController.js'

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

// Export to Excel (old format - returns JSON)
router.get('/request/:requestId/export', exportToExcel)

// Export Global COI Form Excel (new - generates actual Excel file, Compliance only, international_operations required)
router.get('/export-excel/:requestId', exportGlobalCOIFormExcel)

// Generate Excel from form data (for new requests before submission)
router.post('/generate-excel', generateExcelFromFormData)

// Update submission status (from Global Portal response)
router.put('/:submissionId/status', updateSubmissionStatus)

export default router

