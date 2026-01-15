import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  convertProposalToEngagement,
  getConversionHistory
} from '../controllers/engagementController.js'

const router = express.Router()

router.use(authenticateToken)

router.post('/proposal/:requestId/convert', convertProposalToEngagement)
router.get('/conversion-history/:requestId', getConversionHistory)

export default router
