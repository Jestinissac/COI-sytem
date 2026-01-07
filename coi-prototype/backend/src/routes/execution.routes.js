import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  getExecutionTracking,
  prepareProposal,
  sendProposal,
  recordFollowUp,
  recordClientResponse,
  prepareEngagementLetter,
  sendEngagementLetter,
  recordSignedEngagement,
  recordCountersigned,
  getExecutionQueue,
  addAdminNotes
} from '../controllers/executionController.js'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Get all requests in execution phase
router.get('/queue', getExecutionQueue)

// Get execution tracking for a COI request
router.get('/request/:requestId', getExecutionTracking)

// Proposal workflow
router.post('/request/:requestId/prepare-proposal', prepareProposal)
router.post('/request/:requestId/send-proposal', sendProposal)

// Follow-up workflow
router.post('/request/:requestId/follow-up', recordFollowUp)

// Client response
router.post('/request/:requestId/client-response', recordClientResponse)

// Engagement letter workflow
router.post('/request/:requestId/prepare-engagement-letter', prepareEngagementLetter)
router.post('/request/:requestId/send-engagement-letter', sendEngagementLetter)
router.post('/request/:requestId/signed-engagement', recordSignedEngagement)

// Countersigned documents
router.post('/request/:requestId/countersigned', recordCountersigned)

// Admin notes
router.post('/request/:requestId/notes', addAdminNotes)

export default router

