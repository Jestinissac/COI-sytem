import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import {
  submitClientCreationRequest,
  getPendingClientCreationRequests,
  getClientCreationRequestById,
  updateClientCreationRequest,
  completeClientCreation,
  getClientCreationRequestsForCOI,
  uploadClientCreationAttachment,
  getClientCreationAttachments
} from '../controllers/prospectClientCreationController.js'

const router = express.Router()

// Submit new client creation request (requester fills form)
router.post('/submit', authenticateToken, submitClientCreationRequest)

// Get all pending requests (PRMS Admin dashboard)
router.get('/pending', authenticateToken, requireRole('Admin', 'Super Admin'), getPendingClientCreationRequests)

// Get specific request by ID
router.get('/:id', authenticateToken, getClientCreationRequestById)

// Update request status/notes (PRMS Admin)
router.put('/:id', authenticateToken, requireRole('Admin', 'Super Admin'), updateClientCreationRequest)

// Complete request - create client in PRMS (PRMS Admin)
router.post('/:id/complete', authenticateToken, requireRole('Admin', 'Super Admin'), completeClientCreation)

// Get all requests for a specific COI request
router.get('/coi/:coiRequestId', authenticateToken, getClientCreationRequestsForCOI)

// Document attachments
router.post('/:requestId/attachments', authenticateToken, uploadClientCreationAttachment)
router.get('/:requestId/attachments', authenticateToken, getClientCreationAttachments)

export default router
