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
  getMonitoringAlerts
} from '../controllers/coiController.js'
import { sendIntervalAlerts, checkRenewalAlerts, getMonitoringAlertsSummary } from '../services/monitoringService.js'
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

export default router

