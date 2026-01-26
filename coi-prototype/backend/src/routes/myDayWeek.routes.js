import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { getMyDayData, getMyWeekData, getMyMonthData, getEventBusStatus } from '../controllers/myDayWeekController.js'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// GET /api/my-day - Get today's actionable items
router.get('/my-day', getMyDayData)

// GET /api/my-week - Get this week's items
router.get('/my-week', getMyWeekData)

// GET /api/my-month - Get this month's items
router.get('/my-month', getMyMonthData)

// GET /api/event-bus-status - Get critical events for status bar
router.get('/event-bus-status', getEventBusStatus)

export default router
