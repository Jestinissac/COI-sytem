import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { requireRole } from '../middleware/auth.js'
import {
  getAllConfigs,
  getConfigForStage,
  updateConfig,
  getCalendar,
  syncCalendar,
  triggerCheck,
  getRequestSLAStatus,
  getBreaches
} from '../controllers/slaController.js'

const router = Router()

/**
 * SLA Routes
 * 
 * GET  /api/sla/config              - Get all SLA configurations
 * GET  /api/sla/config/:stageId     - Get SLA config for specific stage
 * PUT  /api/sla/config/:configId    - Update SLA configuration (admin only)
 * GET  /api/sla/calendar            - Get business calendar
 * POST /api/sla/calendar/sync       - Sync calendar from HRMS (admin only)
 * POST /api/sla/check               - Trigger SLA check (admin only)
 * GET  /api/sla/status/:requestId   - Get SLA status for a request
 * GET  /api/sla/breaches            - Get breach history
 */

// SLA status for requests - available to authenticated users
router.get('/status/:requestId', authenticateToken, getRequestSLAStatus)

// Configuration - viewable by Compliance and Admin
router.get('/config', authenticateToken, requireRole(['Super Admin', 'Admin', 'Compliance']), getAllConfigs)
router.get('/config/:stageId', authenticateToken, requireRole(['Super Admin', 'Admin', 'Compliance']), getConfigForStage)

// Configuration updates - admin only
router.put('/config/:configId', authenticateToken, requireRole(['Super Admin']), updateConfig)

// Calendar management
router.get('/calendar', authenticateToken, requireRole(['Super Admin', 'Admin']), getCalendar)
router.post('/calendar/sync', authenticateToken, requireRole(['Super Admin']), syncCalendar)

// Breach monitoring
router.post('/check', authenticateToken, requireRole(['Super Admin', 'Admin']), triggerCheck)
router.get('/breaches', authenticateToken, requireRole(['Super Admin', 'Admin', 'Compliance']), getBreaches)

export default router
