/**
 * HRMS Integration Service
 * Employee status (active / vacation / resignation) for approval flow.
 * Prototype: mock implementation; production: call HRMS API.
 */

import { getDatabase } from '../database/init.js'

const USE_HRMS_STATUS = process.env.USE_HRMS_STATUS === 'true' || process.env.USE_HRMS_STATUS === '1'

/**
 * Get employee statuses from HRMS for given user IDs.
 * Used to filter approvers: only 'active' users are available for assignment.
 *
 * @param {number[]} userIds - COI users table IDs (or pass empty to get all approver-relevant)
 * @returns {Promise<Map<number, { status: 'active'|'vacation'|'resignation', unavailableUntil?: string }>>}
 *   Map of userId -> status. Missing entries treated as active (fallback).
 */
export async function getEmployeeStatuses(userIds) {
  if (!USE_HRMS_STATUS) {
    // Fallback: all active (no HRMS filter)
    const map = new Map()
    for (const id of userIds) {
      map.set(id, { status: 'active' })
    }
    return map
  }

  // Prototype: read from users table (synced by syncEmployeeStatusFromHRMS)
  const db = getDatabase()
  const result = new Map()
  for (const id of userIds) {
    const row = db.prepare(`
      SELECT is_active, active, unavailable_reason, unavailable_until
      FROM users WHERE id = ?
    `).get(id)
    if (!row) {
      result.set(id, { status: 'active' })
      continue
    }
    const active = row.is_active === 1 || row.active === 1
    if (!active) {
      const reason = (row.unavailable_reason || '').toLowerCase()
      const status = reason.includes('resign') ? 'resignation' : 'vacation'
      result.set(id, {
        status,
        unavailableUntil: row.unavailable_until || undefined
      })
    } else {
      result.set(id, { status: 'active' })
    }
  }
  return result
}

/**
 * Sync employee status from HRMS into COI users table.
 * Updates is_active, unavailable_reason, unavailable_until from HRMS.
 *
 * Prototype: mock — optionally seed from mock data or no-op.
 * Production: call HRMS API (e.g. GET /employees/status), map by hrms_employee_id or email, then update users.
 */
export async function syncEmployeeStatusFromHRMS() {
  if (!USE_HRMS_STATUS) {
    return { synced: 0, message: 'HRMS status sync disabled' }
  }

  // Prototype: no external API. If we had mock HRMS data we would update users here.
  // Example production flow:
  // const db = getDatabase()
  // const response = await fetch(HRMS_BASE_URL + '/employees/status', { headers: { Authorization: ... } })
  // const data = await response.json()
  // for (const emp of data.employees) {
  //   const userId = resolveUserIdFromHrmsId(emp.employeeId)
  //   if (userId) {
  //     db.prepare(`UPDATE users SET is_active = ?, unavailable_reason = ?, unavailable_until = ? WHERE id = ?`)
  //       .run(emp.status === 'active' ? 1 : 0, emp.status === 'vacation' ? 'Vacation' : emp.unavailableReason, emp.unavailableUntil || null, userId)
  //   }
  // }
  return { synced: 0, message: 'HRMS sync mock (no external call)' }
}

/**
 * Check if a user ID is available for approval (active per HRMS/local).
 * @param {number} userId
 * @returns {Promise<boolean>}
 */
export async function isUserAvailableForApproval(userId) {
  const statuses = await getEmployeeStatuses([userId])
  const s = statuses.get(userId)
  return !s || s.status === 'active'
}
