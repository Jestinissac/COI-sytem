/**
 * Parent company update requests: COI-originated parent updates require PRMS admin approval.
 * When user fills/updates parent in COI and PRMS has TBD/empty, create a request; PRMS Admin approves before push to PRMS.
 */

import { getDatabase } from '../database/init.js'

const db = getDatabase()

function getUserById (id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id)
}

/**
 * Check if client's parent in PRMS (local clients table) is TBD or empty — only then allow creating update request.
 */
export function isClientParentTBDOrEmpty (clientId) {
  const client = db.prepare('SELECT parent_company, parent_company_id FROM clients WHERE id = ?').get(clientId)
  if (!client) return false
  const text = client.parent_company != null ? String(client.parent_company).trim().toUpperCase() : ''
  if (text === 'TBD' || text === '') {
    if (client.parent_company_id == null) return true
  }
  return text === 'TBD' || (text === '' && client.parent_company_id == null)
}

/**
 * Create a parent company update request (when COI saves with existing client + parent and PRMS has TBD/empty).
 * POST /api/parent-company-update-requests
 */
export async function createParentUpdateRequest (req, res) {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ error: 'Authentication required' })
    const { client_id, client_code, requested_parent_company, requested_parent_company_id, coi_request_id } = req.body || {}
    if (!client_id || !client_code) {
      return res.status(400).json({ error: 'client_id and client_code are required' })
    }
    if (!isClientParentTBDOrEmpty(client_id)) {
      return res.status(400).json({
        error: 'Client already has a parent company in PRMS. Only create update request when PRMS has TBD or empty.',
        code: 'PRMS_PARENT_ALREADY_SET'
      })
    }
    const requestedParent = requested_parent_company != null ? String(requested_parent_company).trim() : null
    if (!requestedParent && requested_parent_company_id == null) {
      return res.status(400).json({ error: 'requested_parent_company or requested_parent_company_id is required' })
    }
    const result = db.prepare(`
      INSERT INTO parent_company_update_requests (
        client_id, client_code, requested_parent_company, requested_parent_company_id,
        source, status, coi_request_id, requested_by, requested_at, updated_at
      ) VALUES (?, ?, ?, ?, 'COI', 'Pending', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      client_id,
      client_code,
      requestedParent || null,
      requested_parent_company_id ?? null,
      coi_request_id ?? null,
      userId
    )
    const row = db.prepare('SELECT * FROM parent_company_update_requests WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(row)
  } catch (error) {
    console.error('Error creating parent company update request:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * List parent company update requests (PRMS Admin). Pending first.
 * GET /api/parent-company-update-requests
 */
export async function listParentUpdateRequests (req, res) {
  try {
    const statusFilter = req.query.status // optional: Pending, Approved, Rejected
    let query = `
      SELECT r.*,
        c.client_name,
        u_req.name AS requested_by_name,
        u_rev.name AS reviewed_by_name,
        coi.request_id AS coi_request_id_code
      FROM parent_company_update_requests r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN users u_req ON r.requested_by = u_req.id
      LEFT JOIN users u_rev ON r.reviewed_by = u_rev.id
      LEFT JOIN coi_requests coi ON r.coi_request_id = coi.id
      WHERE 1=1
    `
    const params = []
    if (statusFilter) {
      query += ' AND r.status = ?'
      params.push(statusFilter)
    }
    query += ' ORDER BY CASE r.status WHEN \'Pending\' THEN 0 WHEN \'Rejected\' THEN 1 ELSE 2 END, r.requested_at DESC'
    const rows = db.prepare(query).all(...params)
    res.json(rows)
  } catch (error) {
    console.error('Error listing parent company update requests:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Get one parent company update request by id.
 * GET /api/parent-company-update-requests/:id
 */
export async function getParentUpdateRequestById (req, res) {
  try {
    const { id } = req.params
    const row = db.prepare(`
      SELECT r.*,
        c.client_name,
        u_req.name AS requested_by_name,
        u_rev.name AS reviewed_by_name,
        coi.request_id AS coi_request_id_code
      FROM parent_company_update_requests r
      LEFT JOIN clients c ON r.client_id = c.id
      LEFT JOIN users u_req ON r.requested_by = u_req.id
      LEFT JOIN users u_rev ON r.reviewed_by = u_rev.id
      LEFT JOIN coi_requests coi ON r.coi_request_id = coi.id
      WHERE r.id = ?
    `).get(id)
    if (!row) return res.status(404).json({ error: 'Parent company update request not found' })
    res.json(row)
  } catch (error) {
    console.error('Error getting parent company update request:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Approve parent company update request (PRMS Admin). Mock: update local clients; production: call PRMS API.
 * POST /api/parent-company-update-requests/:id/approve
 */
export async function approveParentUpdateRequest (req, res) {
  try {
    const userId = req.userId
    const user = getUserById(userId)
    if (!user || !['Admin', 'Super Admin'].includes(user.role)) {
      return res.status(403).json({
        error: 'Only PRMS Admin or Super Admin can approve parent company update requests',
        required_role: 'Admin or Super Admin'
      })
    }
    const { id } = req.params
    const { review_notes } = req.body || {}
    const row = db.prepare('SELECT * FROM parent_company_update_requests WHERE id = ?').get(id)
    if (!row) return res.status(404).json({ error: 'Parent company update request not found' })
    if (row.status !== 'Pending') {
      return res.status(400).json({ error: 'Request is not pending', current_status: row.status })
    }
    db.transaction(() => {
      // Mock PRMS write: update local clients table (production would call PRMS API here)
      if (row.requested_parent_company) {
        db.prepare('UPDATE clients SET parent_company = ? WHERE id = ?').run(
          row.requested_parent_company,
          row.client_id
        )
      } else if (row.requested_parent_company_id != null) {
        db.prepare('UPDATE clients SET parent_company_id = ?, parent_company = NULL WHERE id = ?').run(
          row.requested_parent_company_id,
          row.client_id
        )
      }
      db.prepare(`
        UPDATE parent_company_update_requests
        SET status = 'Approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, review_notes = ?,
            prms_updated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(userId, review_notes ?? null, id)
    })()
    const updated = db.prepare('SELECT * FROM parent_company_update_requests WHERE id = ?').get(id)
    res.json(updated)
  } catch (error) {
    console.error('Error approving parent company update request:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Reject parent company update request (PRMS Admin).
 * POST /api/parent-company-update-requests/:id/reject
 */
export async function rejectParentUpdateRequest (req, res) {
  try {
    const userId = req.userId
    const user = getUserById(userId)
    if (!user || !['Admin', 'Super Admin'].includes(user.role)) {
      return res.status(403).json({
        error: 'Only PRMS Admin or Super Admin can reject parent company update requests',
        required_role: 'Admin or Super Admin'
      })
    }
    const { id } = req.params
    const { review_notes } = req.body || {}
    const row = db.prepare('SELECT * FROM parent_company_update_requests WHERE id = ?').get(id)
    if (!row) return res.status(404).json({ error: 'Parent company update request not found' })
    if (row.status !== 'Pending') {
      return res.status(400).json({ error: 'Request is not pending', current_status: row.status })
    }
    db.prepare(`
      UPDATE parent_company_update_requests
      SET status = 'Rejected', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, review_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(userId, review_notes ?? null, id)
    const updated = db.prepare('SELECT * FROM parent_company_update_requests WHERE id = ?').get(id)
    res.json(updated)
  } catch (error) {
    console.error('Error rejecting parent company update request:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Check if client parent is TBD/empty (for COI controller to decide whether to create update request).
 * GET /api/parent-company-update-requests/check-tbd/:clientId
 */
export async function checkClientParentTBD (req, res) {
  try {
    const { clientId } = req.params
    const client = db.prepare('SELECT id, client_code, client_name, parent_company, parent_company_id FROM clients WHERE id = ?').get(clientId)
    if (!client) return res.status(404).json({ error: 'Client not found' })
    const isTBD = isClientParentTBDOrEmpty(clientId)
    res.json({ client_id: client.id, client_code: client.client_code, client_name: client.client_name, parent_tbd_or_empty: isTBD })
  } catch (error) {
    console.error('Error checking client parent TBD:', error)
    res.status(500).json({ error: error.message })
  }
}
