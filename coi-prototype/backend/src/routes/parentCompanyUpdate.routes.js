import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import {
  createParentUpdateRequest,
  listParentUpdateRequests,
  getParentUpdateRequestById,
  approveParentUpdateRequest,
  rejectParentUpdateRequest,
  checkClientParentTBD
} from '../controllers/parentCompanyUpdateController.js'

const router = express.Router()

router.use(authenticateToken)

// Check if client parent is TBD/empty (for COI form to decide whether to create update request)
router.get('/check-tbd/:clientId', checkClientParentTBD)

// Create parent company update request (when COI saves with existing client + parent and PRMS has TBD/empty)
router.post('/', createParentUpdateRequest)

// List parent company update requests (PRMS Admin)
router.get('/', requireRole('Admin', 'Super Admin'), listParentUpdateRequests)

// Get one by id
router.get('/:id', getParentUpdateRequestById)

// Approve (PRMS Admin) — mock: update local clients; production: call PRMS API
router.post('/:id/approve', requireRole('Admin', 'Super Admin'), approveParentUpdateRequest)

// Reject (PRMS Admin)
router.post('/:id/reject', requireRole('Admin', 'Super Admin'), rejectParentUpdateRequest)

export default router
