import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { requireRole } from '../middleware/auth.js'
import {
  getEmailConfig,
  updateEmailConfig,
  testEmailConfig,
  getEmailStatus
} from '../controllers/emailConfigController.js'

const router = Router()

/**
 * Email Configuration Routes
 * 
 * GET  /api/email/config          - Get email configuration (admin only)
 * PUT  /api/email/config          - Update email configuration (admin only)
 * POST /api/email/config/test     - Test email configuration (admin only)
 * GET  /api/email/config/status   - Get email status (admin only)
 */

// All routes require authentication and admin role
router.get('/config', authenticateToken, requireRole(['Super Admin', 'Admin']), getEmailConfig)
router.put('/config', authenticateToken, requireRole(['Super Admin', 'Admin']), updateEmailConfig)
router.post('/config/test', authenticateToken, requireRole(['Super Admin', 'Admin']), testEmailConfig)
router.get('/config/status', authenticateToken, requireRole(['Super Admin', 'Admin']), getEmailStatus)

export default router
