import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import {
  getMyRequests,
  getRequestById,
  createRequest,
  updateRequest,
  submitRequest,
  approveRequest,
  rejectRequest,
  requestInfo,
  requestMoreInfo,
  generateEngagementCode,
  executeProposal,
  getDashboardData,
  updateMonitoring,
  getMonitoringAlerts,
  reEvaluateRequest
} from '../controllers/coiController.js'
import { findSimilarCases, findCasesByCriteria, getClientDecisionHistory } from '../services/similarCasesService.js'
import { getRegulation, getAllRegulations, searchRegulations, getApplicableRegulations } from '../services/regulationService.js'
import { getMonitoringDashboard, runScheduledTasks, generateMonthlyReport } from '../services/monitoringService.js'
import { getFilesForRequest, getISQMDocuments, getISQMDocumentTypes, getFileStatistics } from '../services/fileUploadService.js'
import { uploadAttachment, getAttachments, downloadAttachment, deleteAttachment } from '../controllers/attachmentController.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/coi-requests')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext)
    cb(null, `${name}-${uniqueSuffix}${ext}`)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif'
  ]
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Allowed types: PDF, DOCX, XLSX, images'), false)
  }
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
})

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Request CRUD
router.get('/requests', getMyRequests)
router.get('/requests/:id', getRequestById)
router.post('/requests', createRequest)
router.put('/requests/:id', updateRequest)
router.post('/requests/:id/submit', submitRequest)

// Approval workflows
router.post('/requests/:id/approve', approveRequest)
router.post('/requests/:id/reject', rejectRequest)
router.post('/requests/:id/request-info', requestInfo)
router.post('/requests/:id/need-more-info', requestMoreInfo) // Enhanced: returns to requester with specific questions

// Stale request handling - re-evaluate against current rules
router.post('/requests/:id/re-evaluate', requireRole('Compliance'), reEvaluateRequest)

// Finance
router.post('/requests/:id/generate-code', requireRole('Finance'), generateEngagementCode)

// Admin
router.post('/requests/:id/execute', requireRole('Admin'), executeProposal)

// Dashboards
router.get('/dashboard/:role', getDashboardData)

// Monitoring (Admin only)
router.post('/monitoring/update', requireRole('Admin'), updateMonitoring)
router.get('/monitoring/alerts', requireRole('Admin'), getMonitoringAlerts)

// Enhanced Monitoring - 10-day intervals and renewal alerts
router.post('/monitoring/send-interval-alerts', requireRole('Admin'), async (req, res) => {
  try {
    const result = sendIntervalAlerts()
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/monitoring/check-renewals', requireRole('Admin'), async (req, res) => {
  try {
    const result = checkRenewalAlerts()
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/monitoring/summary', requireRole('Admin'), async (req, res) => {
  try {
    const result = getMonitoringAlertsSummary()
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Attachment routes
router.post('/requests/:id/attachments', upload.single('file'), uploadAttachment)
router.get('/requests/:id/attachments', getAttachments)
router.get('/requests/:id/attachments/:attachmentId/download', downloadAttachment)
router.delete('/requests/:id/attachments/:attachmentId', deleteAttachment)

// Similar Cases - Find historical decisions for compliance review
router.get('/requests/:id/similar-cases', requireRole('Compliance', 'Admin', 'Super Admin'), async (req, res) => {
  try {
    const { id } = req.params
    const { limit, minSimilarity } = req.query
    const result = findSimilarCases(parseInt(id), {
      limit: limit ? parseInt(limit) : 10,
      minSimilarity: minSimilarity ? parseInt(minSimilarity) : 50
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/similar-cases/search', requireRole('Compliance', 'Admin', 'Super Admin'), async (req, res) => {
  try {
    const cases = findCasesByCriteria(req.body)
    res.json({ success: true, cases })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/clients/:clientId/decision-history', requireRole('Compliance', 'Admin', 'Super Admin'), async (req, res) => {
  try {
    const history = getClientDecisionHistory(parseInt(req.params.clientId))
    res.json({ success: true, history })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Regulations - Get regulation references
router.get('/regulations', async (req, res) => {
  try {
    const regulations = getAllRegulations()
    res.json({ success: true, regulations })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/regulations/search', async (req, res) => {
  try {
    const { q } = req.query
    const regulations = searchRegulations(q || '')
    res.json({ success: true, regulations })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/regulations/:code', async (req, res) => {
  try {
    const regulation = getRegulation(req.params.code)
    if (!regulation) {
      return res.status(404).json({ error: 'Regulation not found' })
    }
    res.json({ success: true, regulation })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/regulations/applicable/:serviceType', async (req, res) => {
  try {
    const { isPIE, jurisdiction } = req.query
    const regulations = getApplicableRegulations(
      req.params.serviceType,
      isPIE === 'true',
      jurisdiction
    )
    res.json({ success: true, regulations })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ISQM Documents
router.get('/isqm/types', async (req, res) => {
  try {
    const types = getISQMDocumentTypes()
    res.json({ success: true, types })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/isqm/documents', requireRole('Compliance', 'Admin', 'Super Admin'), async (req, res) => {
  try {
    const documents = getISQMDocuments(req.query)
    res.json({ success: true, documents })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/requests/:id/files', async (req, res) => {
  try {
    const files = getFilesForRequest(parseInt(req.params.id))
    res.json({ success: true, files })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/files/stats', requireRole('Admin', 'Super Admin'), async (req, res) => {
  try {
    const stats = getFileStatistics()
    res.json({ success: true, stats })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Monitoring Dashboard
router.get('/monitoring/dashboard', requireRole('Admin', 'Super Admin', 'Compliance'), async (req, res) => {
  try {
    const dashboard = getMonitoringDashboard()
    res.json({ success: true, dashboard })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/monitoring/run-tasks', requireRole('Admin', 'Super Admin'), async (req, res) => {
  try {
    const result = await runScheduledTasks()
    res.json({ success: true, result })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/reports/monthly/:year/:month', requireRole('Admin', 'Super Admin'), async (req, res) => {
  try {
    const { year, month } = req.params
    const report = await generateMonthlyReport(parseInt(month), parseInt(year))
    res.json({ success: true, report })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router

