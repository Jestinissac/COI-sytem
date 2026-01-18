import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  createShare,
  accessSharedReport,
  revokeShareLink,
  getShareActivityLog,
  getMyShares,
  sendReportEmail
} from '../controllers/reportSharingController.js'

const router = express.Router()

/**
 * Create shareable link
 * POST /api/reports/:role/:reportType/share
 */
router.post('/:role/:reportType/share', authenticateToken, createShare)

/**
 * Access shared report (public endpoint, but may require password)
 * GET /api/reports/share/:token
 */
router.get('/share/:token', accessSharedReport)

/**
 * Revoke share
 * DELETE /api/reports/share/:token
 */
router.delete('/share/:token', authenticateToken, revokeShareLink)

/**
 * Get share activity
 * GET /api/reports/share/:token/activity
 */
router.get('/share/:token/activity', authenticateToken, getShareActivityLog)

/**
 * Get user's shares
 * GET /api/reports/shares
 */
router.get('/shares', authenticateToken, getMyShares)

/**
 * Send report via email
 * POST /api/reports/:role/:reportType/share/email
 */
router.post('/:role/:reportType/share/email', authenticateToken, sendReportEmail)

export default router
