import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  getProspects,
  getProspect,
  createProspect,
  updateProspect,
  convertProspectToClient,
  checkPRMSClient,
  getProspectsByClient,
  getLeadSources,
  createProspectFromOpportunity,
  getProspectsForDropdown
} from '../controllers/prospectController.js'
import {
  runStaleDetectionJob,
  getStaleDetectionSummary,
  getLostProspectsAnalysis,
  markProspectAsLost,
  updateProspectActivity,
  detectProspectsNeedingFollowup,
  LOST_REASONS
} from '../services/staleProspectService.js'

const router = express.Router()

router.use(authenticateToken)

// Lead sources endpoint (must be before /:id to avoid conflict)
router.get('/lead-sources', getLeadSources)

// Prospects for dropdown (Smart Suggest) - must be before /:id
router.get('/dropdown', getProspectsForDropdown)

// Phase 3: Stale detection endpoints (must be before /:id)
router.get('/stale/summary', async (req, res) => {
  try {
    const summary = getStaleDetectionSummary()
    res.json(summary)
  } catch (error) {
    console.error('Error getting stale summary:', error)
    res.status(500).json({ error: error.message })
  }
})

router.get('/stale/needs-followup', async (req, res) => {
  try {
    const prospects = detectProspectsNeedingFollowup()
    res.json(prospects)
  } catch (error) {
    console.error('Error getting prospects needing followup:', error)
    res.status(500).json({ error: error.message })
  }
})

router.post('/stale/run-detection', async (req, res) => {
  try {
    // Only admin/compliance can run stale detection manually
    const userRole = req.userRole
    if (!['Admin', 'Super Admin', 'Compliance'].includes(userRole)) {
      return res.status(403).json({ error: 'Only Admin or Compliance can run stale detection' })
    }
    const results = runStaleDetectionJob()
    res.json(results)
  } catch (error) {
    console.error('Error running stale detection:', error)
    res.status(500).json({ error: error.message })
  }
})

router.get('/lost/analysis', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query
    const analysis = getLostProspectsAnalysis(dateFrom, dateTo)
    res.json(analysis)
  } catch (error) {
    console.error('Error getting lost analysis:', error)
    res.status(500).json({ error: error.message })
  }
})

router.get('/lost/reasons', async (req, res) => {
  try {
    res.json(LOST_REASONS)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/', getProspects)
router.get('/:id', getProspect)
router.post('/', createProspect)
router.put('/:id', updateProspect)
router.post('/:id/convert-to-client', convertProspectToClient)
router.get('/client/:client_id/prospects', getProspectsByClient)
router.get('/prms/check', checkPRMSClient)

// Create prospect from Client Intelligence opportunity
router.post('/from-opportunity/:opportunity_id', createProspectFromOpportunity)

// Phase 3: Mark prospect as lost
router.post('/:id/mark-lost', async (req, res) => {
  try {
    const { id } = req.params
    const { reason, stage } = req.body
    const userId = req.userId
    
    if (!reason) {
      return res.status(400).json({ error: 'Lost reason is required' })
    }
    
    const result = markProspectAsLost(parseInt(id), reason, stage, userId)
    if (!result) {
      return res.status(404).json({ error: 'Prospect not found or already lost' })
    }
    
    res.json(result)
  } catch (error) {
    console.error('Error marking prospect as lost:', error)
    res.status(500).json({ error: error.message })
  }
})

// Phase 3: Update prospect activity (resets stale timer)
router.post('/:id/activity', async (req, res) => {
  try {
    const { id } = req.params
    const success = updateProspectActivity(parseInt(id))
    if (!success) {
      return res.status(404).json({ error: 'Prospect not found' })
    }
    res.json({ success: true, message: 'Activity recorded' })
  } catch (error) {
    console.error('Error updating prospect activity:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
