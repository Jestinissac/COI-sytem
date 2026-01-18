/**
 * Client Intelligence Controller
 * Handles HTTP requests for client intelligence module
 */

import {
  getClientIntelligenceProfile,
  getClientOpportunities,
  createOpportunityFromTrigger,
  getClientInteractions,
  createClientInteraction
} from '../services/clientIntelligenceService.js'
import {
  getNextBestActions,
  getClientRecommendations,
  recordRecommendationFeedback
} from '../services/recommendationEngine.js'
import { generateTriggerSignals, generateTriggerSignalsForAllClients, getClientTriggerSignals, acknowledgeTriggerSignal } from '../services/triggerSignalService.js'

/**
 * Get client intelligence profile
 * GET /api/client-intelligence/clients/:clientId/profile
 */
export async function getClientProfile(req, res) {
  try {
    const { clientId } = req.params
    const profile = getClientIntelligenceProfile(parseInt(clientId))
    
    if (profile.error) {
      return res.status(404).json({ error: profile.error })
    }

    res.json(profile)
  } catch (error) {
    console.error('Error getting client profile:', error)
    res.status(500).json({ error: 'Failed to get client profile', message: error.message })
  }
}

/**
 * Get next best action recommendations
 * GET /api/client-intelligence/recommendations
 */
export async function getRecommendations(req, res) {
  try {
    const userId = req.user?.id
    const { limit } = req.query

    const result = getNextBestActions(userId, {
      limit: limit ? parseInt(limit) : 10
    })

    res.json(result)
  } catch (error) {
    console.error('Error getting recommendations:', error)
    res.status(500).json({ error: 'Failed to get recommendations', message: error.message })
  }
}

/**
 * Get recommendations for a specific client
 * GET /api/client-intelligence/clients/:clientId/recommendations
 */
export async function getClientRecommendationsEndpoint(req, res) {
  try {
    const { clientId } = req.params
    const userId = req.user?.id

    const result = getClientRecommendations(parseInt(clientId), userId)
    
    if (result.message) {
      return res.status(404).json({ error: result.message })
    }

    res.json(result)
  } catch (error) {
    console.error('Error getting client recommendations:', error)
    res.status(500).json({ error: 'Failed to get client recommendations', message: error.message })
  }
}

/**
 * Record recommendation feedback
 * POST /api/client-intelligence/recommendations/:recommendationId/feedback
 */
export async function recordFeedback(req, res) {
  try {
    const { recommendationId } = req.params
    const userId = req.user?.id
    const { action, outcome } = req.body

    if (!action) {
      return res.status(400).json({ error: 'Action is required' })
    }

    const result = recordRecommendationFeedback(
      parseInt(recommendationId),
      userId,
      action,
      outcome
    )

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Error recording feedback:', error)
    res.status(500).json({ error: 'Failed to record feedback', message: error.message })
  }
}

/**
 * Get client opportunities
 * GET /api/client-intelligence/clients/:clientId/opportunities
 */
export async function getOpportunities(req, res) {
  try {
    const { clientId } = req.params
    const { status, limit } = req.query

    const opportunities = getClientOpportunities(parseInt(clientId), {
      status,
      limit: limit ? parseInt(limit) : 50
    })

    res.json({ opportunities })
  } catch (error) {
    console.error('Error getting opportunities:', error)
    res.status(500).json({ error: 'Failed to get opportunities', message: error.message })
  }
}

/**
 * Create opportunity from trigger signal
 * POST /api/client-intelligence/triggers/:triggerId/create-opportunity
 */
export async function createOpportunity(req, res) {
  try {
    const { triggerId } = req.params
    const userId = req.user?.id

    const result = createOpportunityFromTrigger(parseInt(triggerId), userId)

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Error creating opportunity:', error)
    res.status(500).json({ error: 'Failed to create opportunity', message: error.message })
  }
}

/**
 * Get trigger signals for a client
 * GET /api/client-intelligence/clients/:clientId/triggers
 */
export async function getTriggers(req, res) {
  try {
    const { clientId } = req.params
    const { triggerType, priority, limit } = req.query

    const triggers = getClientTriggerSignals(parseInt(clientId), {
      triggerType,
      priority,
      limit: limit ? parseInt(limit) : 50
    })

    res.json({ triggers })
  } catch (error) {
    console.error('Error getting triggers:', error)
    res.status(500).json({ error: 'Failed to get triggers', message: error.message })
  }
}

/**
 * Generate trigger signals for a client
 * POST /api/client-intelligence/clients/:clientId/generate-triggers
 */
export async function generateTriggers(req, res) {
  try {
    const { clientId } = req.params

    const result = generateTriggerSignals(parseInt(clientId))

    res.json(result)
  } catch (error) {
    console.error('Error generating triggers:', error)
    res.status(500).json({ error: 'Failed to generate triggers', message: error.message })
  }
}

/**
 * Generate trigger signals for all active clients
 * POST /api/client-intelligence/generate-all-triggers
 */
export async function generateAllTriggers(req, res) {
  try {
    const result = generateTriggerSignalsForAllClients()

    res.json(result)
  } catch (error) {
    console.error('Error generating triggers for all clients:', error)
    res.status(500).json({ error: 'Failed to generate triggers', message: error.message })
  }
}

/**
 * Acknowledge trigger signal
 * POST /api/client-intelligence/triggers/:triggerId/acknowledge
 */
export async function acknowledgeTrigger(req, res) {
  try {
    const { triggerId } = req.params

    const result = acknowledgeTriggerSignal(parseInt(triggerId))

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Error acknowledging trigger:', error)
    res.status(500).json({ error: 'Failed to acknowledge trigger', message: error.message })
  }
}

/**
 * Get client interactions
 * GET /api/client-intelligence/clients/:clientId/interactions
 */
export async function getInteractions(req, res) {
  try {
    const { clientId } = req.params
    const { opportunityId, limit } = req.query

    const interactions = getClientInteractions(parseInt(clientId), {
      opportunityId: opportunityId ? parseInt(opportunityId) : null,
      limit: limit ? parseInt(limit) : 50
    })

    res.json({ interactions })
  } catch (error) {
    console.error('Error getting interactions:', error)
    res.status(500).json({ error: 'Failed to get interactions', message: error.message })
  }
}

/**
 * Create client interaction
 * POST /api/client-intelligence/interactions
 */
export async function createInteraction(req, res) {
  try {
    const userId = req.user?.id
    const data = req.body

    if (!data.clientId || !data.interactionType) {
      return res.status(400).json({ error: 'clientId and interactionType are required' })
    }

    const result = createClientInteraction(data, userId)

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    console.error('Error creating interaction:', error)
    res.status(500).json({ error: 'Failed to create interaction', message: error.message })
  }
}

/**
 * Get dashboard summary
 * GET /api/client-intelligence/dashboard
 */
export async function getDashboardSummary(req, res) {
  try {
    const userId = req.user?.id

    // Get next best actions (with error handling)
    let recommendations = { recommendations: [], total: 0 }
    try {
      recommendations = getNextBestActions(userId, { limit: 5 })
    } catch (error) {
      console.error('Error getting recommendations:', error)
      // Continue with empty recommendations
    }

    // Get total opportunities count (with error handling)
    const { getDatabase } = await import('../../../backend/src/database/init.js')
    const db = getDatabase()
    
    let totalOpportunities = 0
    let totalInteractions = 0

    try {
      // Check if tables exist
      const opportunitiesTable = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='client_opportunities'
      `).get()
      
      if (opportunitiesTable) {
        const result = db.prepare(`
          SELECT COUNT(*) as count
          FROM client_opportunities
          WHERE status IN ('identified', 'contacted', 'proposal_sent')
        `).get()
        totalOpportunities = result?.count || 0
      }
    } catch (error) {
      console.error('Error getting opportunities count:', error)
    }

    try {
      const interactionsTable = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='client_interactions'
      `).get()
      
      if (interactionsTable) {
        const result = db.prepare(`
          SELECT COUNT(*) as count
          FROM client_interactions
          WHERE interaction_date >= date('now', '-30 days')
        `).get()
        totalInteractions = result?.count || 0
      }
    } catch (error) {
      console.error('Error getting interactions count:', error)
    }

    res.json({
      recommendations: recommendations.recommendations || [],
      totalOpportunities,
      totalInteractions
    })
  } catch (error) {
    console.error('Error getting dashboard summary:', error)
    res.status(500).json({ 
      error: 'Failed to load dashboard data', 
      message: 'Database tables may not be initialized. Please contact your administrator.',
      details: error.message 
    })
  }
}
