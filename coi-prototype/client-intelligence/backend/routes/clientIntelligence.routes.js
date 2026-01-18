/**
 * Client Intelligence Routes
 * All routes are protected by feature flag middleware
 */

import express from 'express'
import { authenticateToken } from '../../../backend/src/middleware/auth.js'
import { isClientIntelligenceEnabled } from '../../../backend/src/services/configService.js'
import {
  getClientProfile,
  getRecommendations,
  getClientRecommendationsEndpoint,
  recordFeedback,
  getOpportunities,
  createOpportunity,
  getTriggers,
  generateTriggers,
  generateAllTriggers,
  acknowledgeTrigger,
  getInteractions,
  createInteraction,
  getDashboardSummary
} from '../controllers/clientIntelligenceController.js'

const router = express.Router()

/**
 * Feature flag middleware
 * Checks if client intelligence module is enabled
 */
function requireClientIntelligence(req, res, next) {
  if (!isClientIntelligenceEnabled()) {
    return res.status(404).json({ 
      error: 'Client Intelligence module is disabled',
      message: 'This feature is currently not available. Please contact your administrator.'
    })
  }
  next()
}

// All routes require authentication and feature flag check
router.use(authenticateToken)
router.use(requireClientIntelligence)

// Dashboard
router.get('/dashboard', getDashboardSummary)

// Recommendations
router.get('/recommendations', getRecommendations)
router.get('/clients/:clientId/recommendations', getClientRecommendationsEndpoint)
router.post('/recommendations/:recommendationId/feedback', recordFeedback)

// Client Intelligence
router.get('/clients/:clientId/profile', getClientProfile)

// Opportunities
router.get('/clients/:clientId/opportunities', getOpportunities)
router.post('/triggers/:triggerId/create-opportunity', createOpportunity)

// Trigger Signals
router.get('/clients/:clientId/triggers', getTriggers)
router.post('/clients/:clientId/generate-triggers', generateTriggers)
router.post('/generate-all-triggers', generateAllTriggers)
router.post('/triggers/:triggerId/acknowledge', acknowledgeTrigger)

// Interactions
router.get('/clients/:clientId/interactions', getInteractions)
router.post('/interactions', createInteraction)

export default router
