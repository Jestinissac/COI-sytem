import { getDatabase } from '../database/init.js'
import { getFilteredRequests } from '../middleware/dataSegregation.js'
import { calculatePriority, PRIORITY_LEVEL } from './priorityService.js'
import { calculateSLAStatus, SLA_STATUS } from './slaService.js'

/**
 * My Day/Week Service
 * Provides personalized views of actionable items based on user role and data segregation
 * Enhanced with priority scoring and SLA tracking
 * 
 * Design: Simple, functional, uses existing data segregation
 */

/**
 * Get My Day view - Today's actionable items
 */
export async function getMyDay(user) {
  const db = getDatabase()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]
  
  // Get all requests for this user (respects data segregation)
  const allRequests = getFilteredRequests(user)
  
  const actionRequired = []
  const expiring = []
  const overdue = []
  
  for (const request of allRequests) {
    const createdDate = new Date(request.created_at)
    const daysPending = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24))
    
    // Calculate priority and SLA for all requests
    let priority = null
    let slaStatus = null
    
    try {
      priority = await calculatePriority(request)
      slaStatus = calculateSLAStatus(request)
    } catch (error) {
      // Fallback if priority calculation fails
      priority = { score: 50, level: PRIORITY_LEVEL.MEDIUM, breakdown: [], topFactors: [] }
      slaStatus = { status: SLA_STATUS.ON_TRACK, hoursRemaining: 48 }
    }
    
    // Action Required Today
    if (needsMyActionToday(request, user)) {
      actionRequired.push({
        ...request,
        daysPending,
        actionType: getActionType(request, user),
        priorityScore: priority.score,
        priorityLevel: priority.level,
        priorityFactors: priority.topFactors,
        slaStatus: slaStatus.status,
        slaHoursRemaining: slaStatus.hoursRemaining
      })
    }
    
    // Overdue (pending >14 days or SLA breached) - only for items user can act on
    if (isOverdue(request, daysPending, user) || slaStatus.status === SLA_STATUS.BREACHED) {
      // Avoid duplicates
      const alreadyInOverdue = overdue.some(r => r.id === request.id)
      if (!alreadyInOverdue) {
        overdue.push({
          ...request,
          daysPending,
          actionType: getActionType(request, user),
          priorityScore: priority.score,
          priorityLevel: priority.level,
          priorityFactors: priority.topFactors,
          slaStatus: slaStatus.status,
          slaHoursRemaining: slaStatus.hoursRemaining
        })
      }
    }
    
    // Expiring Today (proposals/engagements)
    if (isExpiringToday(request, todayStr)) {
      expiring.push({
        ...request,
        daysPending,
        actionType: 'Expiring',
        priorityScore: priority.score,
        priorityLevel: priority.level
      })
    }
  }
  
  // Sort by priority score (highest first) instead of just days pending
  actionRequired.sort((a, b) => b.priorityScore - a.priorityScore)
  overdue.sort((a, b) => b.priorityScore - a.priorityScore)
  
  // Count by priority level
  const priorityCounts = {
    [PRIORITY_LEVEL.CRITICAL]: actionRequired.filter(r => r.priorityLevel === PRIORITY_LEVEL.CRITICAL).length,
    [PRIORITY_LEVEL.HIGH]: actionRequired.filter(r => r.priorityLevel === PRIORITY_LEVEL.HIGH).length,
    [PRIORITY_LEVEL.MEDIUM]: actionRequired.filter(r => r.priorityLevel === PRIORITY_LEVEL.MEDIUM).length,
    [PRIORITY_LEVEL.LOW]: actionRequired.filter(r => r.priorityLevel === PRIORITY_LEVEL.LOW).length
  }
  
  return {
    today: {
      actionRequired,
      expiring,
      overdue
    },
    summary: {
      totalActions: actionRequired.length + overdue.length,
      urgentCount: overdue.length,
      expiringCount: expiring.length,
      priorityCounts,
      slaBreach: actionRequired.filter(r => r.slaStatus === SLA_STATUS.BREACHED).length,
      slaCritical: actionRequired.filter(r => r.slaStatus === SLA_STATUS.CRITICAL).length
    }
  }
}

/**
 * Get My Week view - This week's items
 */
export function getMyWeek(user) {
  const db = getDatabase()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekFromNow = new Date(today)
  weekFromNow.setDate(weekFromNow.getDate() + 7)
  
  // Get all requests for this user (respects data segregation)
  const allRequests = getFilteredRequests(user)
  
  const dueThisWeek = []
  const expiringThisWeek = []
  
  allRequests.forEach(request => {
    const createdDate = new Date(request.created_at)
    const daysPending = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24))
    
    // Due This Week (needs action within 7 days)
    if (needsMyActionThisWeek(request, user, daysPending)) {
      const dueDate = getDueDate(request, createdDate)
      dueThisWeek.push({
        ...request,
        daysPending,
        dueDate,
        actionType: getActionType(request, user)
      })
    }
    
    // Expiring This Week
    if (isExpiringThisWeek(request, today, weekFromNow)) {
      const expiryDate = getExpiryDate(request)
      expiringThisWeek.push({
        ...request,
        daysPending,
        expiryDate,
        actionType: 'Expiring'
      })
    }
  })
  
  // Group by day
  const groupedByDay = {}
  dueThisWeek.forEach(item => {
    const dayKey = item.dueDate || 'Unknown'
    if (!groupedByDay[dayKey]) {
      groupedByDay[dayKey] = []
    }
    groupedByDay[dayKey].push(item)
  })
  
  expiringThisWeek.forEach(item => {
    const dayKey = item.expiryDate || 'Unknown'
    if (!groupedByDay[dayKey]) {
      groupedByDay[dayKey] = []
    }
    groupedByDay[dayKey].push(item)
  })
  
  return {
    thisWeek: {
      dueThisWeek,
      expiringThisWeek,
      groupedByDay
    },
    summary: {
      weekTotal: dueThisWeek.length + expiringThisWeek.length
    }
  }
}

/**
 * Check if request needs my action today
 * Aligned with user roles and workflow stages
 */
function needsMyActionToday(request, user) {
  // ============================================
  // REQUESTER TASKS
  // ============================================
  if (user.role === 'Requester' && request.requester_id === user.id) {
    // Draft requests need to be completed and submitted
    if (request.status === 'Draft') {
      return true
    }
    // Rejected requests need to be fixed and resubmitted
    if (request.status === 'Rejected') {
      return true
    }
    // More Info Requested - requester needs to provide additional information
    if (request.status === 'More Info Requested') {
      return true
    }
  }
  
  // ============================================
  // DIRECTOR TASKS
  // ============================================
  if (user.role === 'Director') {
    // Primary task: Approve requests pending director approval
    if (request.status === 'Pending Director Approval') {
      return true
    }
    // Directors can also submit their own requests (they have Requester capabilities)
    if (request.requester_id === user.id) {
      if (request.status === 'Draft' || request.status === 'Rejected' || request.status === 'More Info Requested') {
        return true
      }
    }
  }
  
  // ============================================
  // COMPLIANCE TASKS
  // ============================================
  if (user.role === 'Compliance' && request.status === 'Pending Compliance') {
    return true
  }
  
  // ============================================
  // PARTNER TASKS
  // ============================================
  if (user.role === 'Partner' && request.status === 'Pending Partner') {
    return true
  }
  
  // ============================================
  // FINANCE TASKS
  // ============================================
  if (user.role === 'Finance' && request.status === 'Pending Finance') {
    return true
  }
  
  // ============================================
  // ADMIN / SUPER ADMIN TASKS
  // ============================================
  // Admins see escalated/stale items that need intervention
  if ((user.role === 'Admin' || user.role === 'Super Admin') && request.requires_re_evaluation) {
    return true
  }
  
  return false
}

/**
 * Check if request needs my action this week
 */
function needsMyActionThisWeek(request, user, daysPending) {
  // If needs action today, it's also due this week
  if (needsMyActionToday(request, user)) {
    return true
  }
  
  // If approaching deadline (7-14 days pending), show as upcoming
  if (daysPending >= 7 && daysPending < 14) {
    // Show items user can act on that are approaching deadline
    if (needsMyActionToday(request, user)) {
      return true
    }
  }
  
  return false
}

/**
 * Check if request is overdue (>14 days pending)
 * Only returns true if the user can act on this overdue item
 */
function isOverdue(request, daysPending, user) {
  if (daysPending <= 14) return false
  
  // Only show overdue items to users who can act on them
  switch (request.status) {
    case 'Pending Director Approval':
      return user.role === 'Director'
    case 'Pending Compliance':
      return user.role === 'Compliance'
    case 'Pending Partner':
      return user.role === 'Partner'
    case 'Pending Finance':
      return user.role === 'Finance'
    case 'More Info Requested':
    case 'Draft':
    case 'Rejected':
      // Only the requester sees their own overdue drafts/rejected items
      return (user.role === 'Requester' || user.role === 'Director') && request.requester_id === user.id
    default:
      // Admin/Super Admin see all overdue items for escalation
      return user.role === 'Admin' || user.role === 'Super Admin'
  }
}

/**
 * Check if proposal/engagement is expiring today
 */
function isExpiringToday(request, todayStr) {
  // Check proposal expiry (30 days from execution)
  if (request.requested_document === 'Proposal' && request.proposal_executed_date) {
    const executedDate = new Date(request.proposal_executed_date)
    executedDate.setDate(executedDate.getDate() + 30)
    const expiryStr = executedDate.toISOString().split('T')[0]
    return expiryStr === todayStr
  }
  
  // Check engagement expiry (from engagement_end_date)
  if (request.engagement_end_date) {
    const expiryStr = new Date(request.engagement_end_date).toISOString().split('T')[0]
    return expiryStr === todayStr
  }
  
  return false
}

/**
 * Check if proposal/engagement is expiring this week
 */
function isExpiringThisWeek(request, today, weekFromNow) {
  // Check proposal expiry
  if (request.requested_document === 'Proposal' && request.proposal_executed_date) {
    const executedDate = new Date(request.proposal_executed_date)
    executedDate.setDate(executedDate.getDate() + 30)
    return executedDate >= today && executedDate <= weekFromNow
  }
  
  // Check engagement expiry
  if (request.engagement_end_date) {
    const expiryDate = new Date(request.engagement_end_date)
    return expiryDate >= today && expiryDate <= weekFromNow
  }
  
  return false
}

/**
 * Get action type for request - describes what action the user needs to take
 */
function getActionType(request, user) {
  // Approver action types
  if (user.role === 'Director' && request.status === 'Pending Director Approval') {
    return 'Director Approval Required'
  }
  if (user.role === 'Compliance' && request.status === 'Pending Compliance') {
    return 'Compliance Review Required'
  }
  if (user.role === 'Partner' && request.status === 'Pending Partner') {
    return 'Partner Approval Required'
  }
  if (user.role === 'Finance' && request.status === 'Pending Finance') {
    return 'Finance Approval Required'
  }
  
  // Requester/Director action types (for their own requests)
  if ((user.role === 'Requester' || user.role === 'Director') && request.requester_id === user.id) {
    if (request.status === 'Draft') {
      return 'Complete and Submit'
    }
    if (request.status === 'Rejected') {
      return 'Fix and Resubmit'
    }
    if (request.status === 'More Info Requested') {
      return 'Provide Additional Information'
    }
  }
  
  // Admin action types
  if ((user.role === 'Admin' || user.role === 'Super Admin') && request.requires_re_evaluation) {
    return 'Re-evaluation Required'
  }
  
  return 'Action Required'
}

/**
 * Get due date for request
 */
function getDueDate(request, createdDate) {
  // If overdue, due date is today
  const daysPending = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24))
  if (daysPending > 14) {
    return 'Today'
  }
  
  // Calculate days until due (14 days from creation)
  const dueDate = new Date(createdDate)
  dueDate.setDate(dueDate.getDate() + 14)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
  
  if (daysUntilDue === 0) return 'Today'
  if (daysUntilDue === 1) return 'Tomorrow'
  if (daysUntilDue <= 7) {
    return dueDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }
  return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Get expiry date for request
 */
function getExpiryDate(request) {
  if (request.requested_document === 'Proposal' && request.proposal_executed_date) {
    const executedDate = new Date(request.proposal_executed_date)
    executedDate.setDate(executedDate.getDate() + 30)
    return executedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }
  
  if (request.engagement_end_date) {
    const expiryDate = new Date(request.engagement_end_date)
    return expiryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }
  
  return 'Unknown'
}

/**
 * Get My Month view - This month's upcoming items
 * Groups items by date for calendar-like view
 */
export function getMyMonth(user) {
  const db = getDatabase()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const monthFromNow = new Date(today)
  monthFromNow.setMonth(monthFromNow.getMonth() + 1)
  
  // Get all requests for this user (respects data segregation)
  const allRequests = getFilteredRequests(user)
  
  const upcomingThisMonth = []
  const expiringThisMonth = []
  
  allRequests.forEach(request => {
    const createdDate = new Date(request.created_at)
    const daysPending = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24))
    
    // Due This Month (needs action within 30 days)
    if (needsMyActionThisMonth(request, user, daysPending)) {
      const dueDate = getDueDateForMonth(request, createdDate)
      upcomingThisMonth.push({
        ...request,
        daysPending,
        dueDate,
        actionType: getActionType(request, user)
      })
    }
    
    // Expiring This Month
    if (isExpiringThisMonth(request, today, monthFromNow)) {
      const expiryDate = getExpiryDateForMonth(request)
      expiringThisMonth.push({
        ...request,
        daysPending,
        expiryDate,
        actionType: 'Expiring'
      })
    }
  })
  
  // Group by date (similar to My Week pattern)
  const groupedByDate = {}
  upcomingThisMonth.forEach(item => {
    const dateKey = item.dueDate || 'Unknown'
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = []
    }
    groupedByDate[dateKey].push(item)
  })
  
  expiringThisMonth.forEach(item => {
    const dateKey = item.expiryDate || 'Unknown'
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = []
    }
    groupedByDate[dateKey].push(item)
  })
  
  // Sort dates chronologically
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    if (a === 'Today') return -1
    if (b === 'Today') return 1
    if (a === 'Tomorrow') return -1
    if (b === 'Tomorrow') return 1
    if (a === 'Unknown') return 1
    if (b === 'Unknown') return -1
    return new Date(a) - new Date(b)
  })
  
  const sortedGroupedByDate = {}
  sortedDates.forEach(date => {
    sortedGroupedByDate[date] = groupedByDate[date]
  })
  
  return {
    thisMonth: {
      upcomingThisMonth,
      expiringThisMonth,
      groupedByDate: sortedGroupedByDate
    },
    summary: {
      monthTotal: upcomingThisMonth.length + expiringThisMonth.length
    }
  }
}

/**
 * Check if request needs my action this month (within 30 days)
 */
function needsMyActionThisMonth(request, user, daysPending) {
  // If needs action today, it's also due this month
  if (needsMyActionToday(request, user)) {
    return true
  }
  
  // Show items user can act on within 30 days
  // The needsMyActionToday already handles role-based filtering
  return false
}

/**
 * Check if proposal/engagement is expiring this month
 */
function isExpiringThisMonth(request, today, monthFromNow) {
  // Check proposal expiry
  if (request.requested_document === 'Proposal' && request.proposal_executed_date) {
    const executedDate = new Date(request.proposal_executed_date)
    executedDate.setDate(executedDate.getDate() + 30)
    return executedDate >= today && executedDate <= monthFromNow
  }
  
  // Check engagement expiry
  if (request.engagement_end_date) {
    const expiryDate = new Date(request.engagement_end_date)
    return expiryDate >= today && expiryDate <= monthFromNow
  }
  
  return false
}

/**
 * Get due date for request (for month view - includes full date)
 */
function getDueDateForMonth(request, createdDate) {
  // If overdue, due date is today
  const daysPending = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24))
  if (daysPending > 14) {
    return 'Today'
  }
  
  // Calculate days until due (14 days from creation)
  const dueDate = new Date(createdDate)
  dueDate.setDate(dueDate.getDate() + 14)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
  
  if (daysUntilDue === 0) return 'Today'
  if (daysUntilDue === 1) return 'Tomorrow'
  
  return dueDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

/**
 * Get expiry date for request (for month view - includes full date)
 */
function getExpiryDateForMonth(request) {
  if (request.requested_document === 'Proposal' && request.proposal_executed_date) {
    const executedDate = new Date(request.proposal_executed_date)
    executedDate.setDate(executedDate.getDate() + 30)
    return executedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }
  
  if (request.engagement_end_date) {
    const expiryDate = new Date(request.engagement_end_date)
    return expiryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }
  
  return 'Unknown'
}
