import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import {
  reportGenerationRateLimiter,
  reportExportRateLimiter
} from '../middleware/rateLimiter.js'
import {
  validateReportFilters,
  validateExportSize
} from '../middleware/reportValidator.js'
import {
  getReportData,
  exportReportPDF,
  exportReportExcel
} from '../controllers/reportController.js'

const router = express.Router()

// All report routes require authentication
router.use(authenticateToken)

/**
 * Get report data (preview)
 * POST /api/reports/:role/:reportType
 */
router.post('/:role/:reportType', reportGenerationRateLimiter, validateReportFilters, (req, res, next) => {
  const { role } = req.params
  const userRole = req.userRole
  
  // Role-based access control
  const roleMapping = {
    'requester': ['Requester'],
    'director': ['Director'],
    'compliance': ['Compliance'],
    'partner': ['Partner'],
    'finance': ['Finance'],
    'admin': ['Admin', 'Super Admin']
  }
  
  const allowedRoles = roleMapping[role]
  if (!allowedRoles || !allowedRoles.includes(userRole)) {
    return res.status(403).json({ error: 'Access denied for this report' })
  }
  
  next()
}, getReportData)

/**
 * Export report as PDF
 * POST /api/reports/:role/:reportType/export/pdf
 */
router.post('/:role/:reportType/export/pdf', reportExportRateLimiter, validateReportFilters, validateExportSize, (req, res, next) => {
  const { role } = req.params
  const userRole = req.userRole
  
  const roleMapping = {
    'requester': ['Requester'],
    'director': ['Director'],
    'compliance': ['Compliance'],
    'partner': ['Partner'],
    'finance': ['Finance'],
    'admin': ['Admin', 'Super Admin']
  }
  
  const allowedRoles = roleMapping[role]
  if (!allowedRoles || !allowedRoles.includes(userRole)) {
    return res.status(403).json({ error: 'Access denied for this report' })
  }
  
  next()
}, exportReportPDF)

/**
 * Export report as Excel
 * POST /api/reports/:role/:reportType/export/excel
 */
router.post('/:role/:reportType/export/excel', reportExportRateLimiter, validateReportFilters, validateExportSize, (req, res, next) => {
  const { role } = req.params
  const userRole = req.userRole
  
  const roleMapping = {
    'requester': ['Requester'],
    'director': ['Director'],
    'compliance': ['Compliance'],
    'partner': ['Partner'],
    'finance': ['Finance'],
    'admin': ['Admin', 'Super Admin']
  }
  
  const allowedRoles = roleMapping[role]
  if (!allowedRoles || !allowedRoles.includes(userRole)) {
    return res.status(403).json({ error: 'Access denied for this report' })
  }
  
  next()
}, exportReportExcel)

export default router
