/**
 * AD (Active Directory) Integration Service
 * First-level approvers: who is in the approval chain (Director, Compliance, Partner, Finance).
 * Prototype: mock (return current DB users by role); production: call AD API or use AD-synced users.
 */

import { getDatabase } from '../database/init.js'

const USE_AD_APPROVERS = process.env.USE_AD_APPROVERS === 'true' || process.env.USE_AD_APPROVERS === '1'

/**
 * Get approver candidates from AD for a given context.
 * Used as first level in approval flow; result is then filtered by HRMS status (is_active) and backup.
 *
 * @param {{ department?: string, role: string }} context - role (Director, Compliance, Partner, Finance), optional department
 * @returns {Array<object>} Full user rows (same shape as users table) for filtering by is_active
 */
export function getApproversFromAD(context) {
  if (!USE_AD_APPROVERS) {
    return []
  }

  const db = getDatabase()
  const { department, role } = context

  // Prototype: return current DB users by role (as if synced from AD); full rows for is_active filter
  let query = 'SELECT * FROM users WHERE role = ?'
  const params = [role]
  if (role === 'Director' || role === 'Compliance') {
    if (department) {
      query += ' AND department = ?'
      params.push(department)
    }
  }
  query += ' ORDER BY name'

  return db.prepare(query).all(...params)
}

/**
 * Sync users from AD into COI users table (optional).
 * Prototype: no-op. Production: call AD API, upsert users and director_id.
 */
export async function syncUsersFromAD() {
  if (!USE_AD_APPROVERS) {
    return { synced: 0, message: 'AD sync disabled' }
  }
  // Prototype: no external call
  return { synced: 0, message: 'AD sync mock (no external call)' }
}
