import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import {
  validateFieldChange,
  getFieldImpact,
  getFieldDependencies,
  recordChange,
  approveChange,
  rejectChange,
  rollbackChange,
  getChanges,
  getChangeDetails,
  emergencyBypassChange,
  getRulesEngineHealth,
  resetRulesEngineHealth,
  performHealthCheckEndpoint
} from '../controllers/changeManagementController.js'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Field validation and impact analysis
router.post('/fields/:id/validate-change', validateFieldChange)
router.get('/fields/:id/impact', getFieldImpact)
router.get('/fields/:id/dependencies', getFieldDependencies)

// Change management
router.post('/changes', recordChange)
router.get('/changes', getChanges)
router.get('/changes/:id', getChangeDetails)
router.post('/changes/:id/approve', requireRole('Admin', 'Super Admin'), approveChange)
router.post('/changes/:id/reject', requireRole('Admin', 'Super Admin'), rejectChange)
router.post('/changes/:id/rollback', requireRole('Admin', 'Super Admin'), rollbackChange)
router.post('/changes/:id/emergency-bypass', requireRole('Super Admin'), emergencyBypassChange)

// Rules engine health
router.get('/rules-engine/health', getRulesEngineHealth)
router.post('/rules-engine/reset', requireRole('Super Admin'), resetRulesEngineHealth)
router.post('/rules-engine/health-check', requireRole('Admin', 'Super Admin'), performHealthCheckEndpoint)

export default router


