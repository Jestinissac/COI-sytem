import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { requireRole } from '../middleware/auth.js'
import {
  getQueue,
  getBreakdown,
  getConfig,
  updateConfig,
  getAuditHistory,
  getGrouped
} from '../controllers/priorityController.js'

const router = Router()

/**
 * Priority Routes
 * 
 * GET  /api/priority/queue          - Get prioritized queue for current user
 * GET  /api/priority/grouped        - Get requests grouped by priority level
 * GET  /api/priority/breakdown/:id  - Get detailed priority breakdown for a request
 * GET  /api/priority/config         - Get priority configuration (admin only)
 * PUT  /api/priority/config/:id     - Update priority factor (admin only)
 * GET  /api/priority/audit          - Get audit history (admin only)
 */

// Queue and breakdown - available to all authenticated users
router.get('/queue', authenticateToken, getQueue)
router.get('/grouped', authenticateToken, getGrouped)
router.get('/breakdown/:requestId', authenticateToken, getBreakdown)

// Configuration - admin only
router.get('/config', authenticateToken, requireRole(['Super Admin', 'Admin']), getConfig)
router.put('/config/:factorId', authenticateToken, requireRole(['Super Admin']), updateConfig)
router.get('/audit', authenticateToken, requireRole(['Super Admin', 'Admin']), getAuditHistory)

export default router
