import { getMyDay, getMyWeek, getMyMonth } from '../services/myDayWeekService.js'
import { getUserById } from '../utils/userUtils.js'
import { mapResponseForRole } from '../utils/responseMapper.js'
import { getDatabase } from '../database/init.js'

/**
 * My Day/Week/Month Controller
 * Provides API endpoints for personalized views
 */

export async function getMyDayData(req, res) {
  try {
    const user = getUserById(req.userId)
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }
    
    const myDayData = await getMyDay(user)
    if (user.role === 'Compliance') {
      if (myDayData.today?.actionRequired?.length) myDayData.today.actionRequired = mapResponseForRole(myDayData.today.actionRequired, user.role)
      if (myDayData.today?.expiring?.length) myDayData.today.expiring = mapResponseForRole(myDayData.today.expiring, user.role)
      if (myDayData.today?.overdue?.length) myDayData.today.overdue = mapResponseForRole(myDayData.today.overdue, user.role)
    }
    res.json(myDayData)
  } catch (error) {
    console.error('Error getting My Day data:', error)
    res.status(500).json({ error: error.message })
  }
}

export async function getMyWeekData(req, res) {
  try {
    const user = getUserById(req.userId)
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }
    
    const myWeekData = getMyWeek(user)
    if (user.role === 'Compliance') {
      if (myWeekData.thisWeek?.dueThisWeek?.length) myWeekData.thisWeek.dueThisWeek = mapResponseForRole(myWeekData.thisWeek.dueThisWeek, user.role)
      if (myWeekData.thisWeek?.expiringThisWeek?.length) myWeekData.thisWeek.expiringThisWeek = mapResponseForRole(myWeekData.thisWeek.expiringThisWeek, user.role)
      if (myWeekData.thisWeek?.groupedByDay && typeof myWeekData.thisWeek.groupedByDay === 'object') {
        for (const dayKey of Object.keys(myWeekData.thisWeek.groupedByDay)) {
          myWeekData.thisWeek.groupedByDay[dayKey] = mapResponseForRole(myWeekData.thisWeek.groupedByDay[dayKey], user.role)
        }
      }
    }
    res.json(myWeekData)
  } catch (error) {
    console.error('Error getting My Week data:', error)
    res.status(500).json({ error: error.message })
  }
}

export async function getMyMonthData(req, res) {
  try {
    const user = getUserById(req.userId)
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }
    
    const myMonthData = getMyMonth(user)
    if (user.role === 'Compliance' && myMonthData.thisMonth) {
      const m = myMonthData.thisMonth
      if (m.upcomingThisMonth?.length) m.upcomingThisMonth = mapResponseForRole(m.upcomingThisMonth, user.role)
      if (m.expiringThisMonth?.length) m.expiringThisMonth = mapResponseForRole(m.expiringThisMonth, user.role)
      if (m.groupedByDate && typeof m.groupedByDate === 'object') {
        for (const dateKey of Object.keys(m.groupedByDate)) {
          m.groupedByDate[dateKey] = mapResponseForRole(m.groupedByDate[dateKey], user.role)
        }
      }
    }
    res.json(myMonthData)
  } catch (error) {
    console.error('Error getting My Month data:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Get Event Bus Status - Critical/urgent events for status bar
 */
export async function getEventBusStatus(req, res) {
  try {
    const user = getUserById(req.userId)
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }
    
    const db = getDatabase()
    
    // Check if coi_events table exists
    const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='coi_events'").get()
    
    if (!tableInfo) {
      // Table doesn't exist, return empty events
      return res.json({
        events: [],
        count: 0
      })
    }
    
    // Get recent critical/urgent events for this user
    const criticalEventTypes = [
      'DIRECTOR_APPROVAL_REQUIRED',
      'COMPLIANCE_REVIEW_REQUIRED',
      'PARTNER_APPROVAL_REQUIRED',
      'MORE_INFO_REQUESTED',
      'PROPOSAL_EXPIRING_SOON',
      'ENGAGEMENT_EXPIRING_SOON',
      'STALE_REQUEST_ALERT'
    ]
    
    const placeholders = criticalEventTypes.map(() => '?').join(',')
    
    const criticalEvents = db.prepare(`
      SELECT 
        event_type,
        request_id,
        user_id,
        created_at
      FROM coi_events
      WHERE event_type IN (${placeholders})
      AND created_at >= datetime('now', '-24 hours')
      ORDER BY created_at DESC
      LIMIT 10
    `).all(...criticalEventTypes)
    
    res.json({
      events: criticalEvents.map(e => ({
        type: e.event_type,
        requestId: e.request_id,
        timestamp: e.created_at,
        message: formatEventMessage(e.event_type),
        priority: getEventPriority(e.event_type)
      })),
      count: criticalEvents.length
    })
  } catch (error) {
    console.error('Error getting event bus status:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Format event type to user-friendly message
 */
function formatEventMessage(eventType) {
  const messages = {
    'DIRECTOR_APPROVAL_REQUIRED': 'Director approval required',
    'COMPLIANCE_REVIEW_REQUIRED': 'Compliance review required',
    'PARTNER_APPROVAL_REQUIRED': 'Partner approval required',
    'MORE_INFO_REQUESTED': 'More information requested',
    'PROPOSAL_EXPIRING_SOON': 'Proposal expiring soon',
    'ENGAGEMENT_EXPIRING_SOON': 'Engagement expiring soon',
    'STALE_REQUEST_ALERT': 'Request has been pending too long'
  }
  return messages[eventType] || eventType
}

/**
 * Get event priority level
 */
function getEventPriority(eventType) {
  const criticalTypes = [
    'STALE_REQUEST_ALERT',
    'PROPOSAL_EXPIRING_SOON',
    'ENGAGEMENT_EXPIRING_SOON'
  ]
  
  const urgentTypes = [
    'DIRECTOR_APPROVAL_REQUIRED',
    'COMPLIANCE_REVIEW_REQUIRED',
    'PARTNER_APPROVAL_REQUIRED',
    'MORE_INFO_REQUESTED'
  ]
  
  if (criticalTypes.includes(eventType)) return 'critical'
  if (urgentTypes.includes(eventType)) return 'urgent'
  return 'normal'
}
