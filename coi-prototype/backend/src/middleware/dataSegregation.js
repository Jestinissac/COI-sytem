import { getDatabase } from '../database/init.js'

export function applyDataSegregation(req, res, next) {
  const user = req.user
  
  if (!user) {
    return next()
  }

  // Add filters based on role
  if (user.role === 'Requester') {
    req.query.department = user.department
    req.query.requester_id = user.id
  } else if (user.role === 'Director') {
    req.query.department = user.department
    req.query.include_team = true
  } else if (user.role === 'Compliance') {
    req.query.exclude_commercial = true
  }
  // Super Admin has no restrictions

  next()
}

export function getFilteredRequests(user, filters = {}) {
  const db = getDatabase()
  let query = `
    SELECT r.*, c.client_name, c.client_code, u.name as requester_name, u.department as requester_department
    FROM coi_requests r
    INNER JOIN clients c ON r.client_id = c.id
    INNER JOIN users u ON r.requester_id = u.id
    WHERE 1=1
  `
  const params = []

  // Apply role-based filtering
  if (user.role === 'Requester') {
    query += ' AND r.requester_id = ? AND r.department = ?'
    params.push(user.id, user.department)
  } else if (user.role === 'Director') {
    // Get team member IDs
    const teamMembers = db.prepare(`
      SELECT id FROM users WHERE director_id = ? AND department = ?
    `).all(user.id, user.department)
    
    const teamMemberIds = teamMembers.map(tm => tm.id)
    teamMemberIds.push(user.id) // Include director's own requests
    
    if (teamMemberIds.length > 0) {
      const placeholders = teamMemberIds.map(() => '?').join(',')
      query += ` AND r.requester_id IN (${placeholders}) AND r.department = ?`
      params.push(...teamMemberIds, user.department)
    } else {
      query += ' AND r.requester_id = ? AND r.department = ?'
      params.push(user.id, user.department)
    }
  }
  // Compliance, Partner, Finance, Admin, Super Admin see all departments

  // Apply additional filters
  if (filters.status) {
    query += ' AND r.status = ?'
    params.push(filters.status)
  }

  if (filters.department && (user.role === 'Compliance' || user.role === 'Partner' || user.role === 'Finance' || user.role === 'Admin' || user.role === 'Super Admin')) {
    query += ' AND r.department = ?'
    params.push(filters.department)
  }

  query += ' ORDER BY r.created_at DESC'

  return db.prepare(query).all(...params)
}

