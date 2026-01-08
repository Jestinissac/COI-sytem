/**
 * Audit Trail Service
 * Logs all Compliance decisions with full context
 */

import { getDatabase } from '../database/init.js'

const db = getDatabase()

/**
 * Log Compliance decision with full audit trail
 */
export function logComplianceDecision({
  requestId,
  userId,
  userName,
  userRole,
  decision, // 'Approved', 'Rejected', 'Request Info', 'Override'
  recommendations = [],
  acceptedRecommendations = [],
  rejectedRecommendations = [],
  overriddenRecommendations = [],
  justification = null,
  approvalLevel = null, // 'Compliance', 'Partner', 'Super Admin'
  restrictions = null,
  notes = null
}) {
  try {
    // Ensure audit_log table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS compliance_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_role VARCHAR(50) NOT NULL,
        decision VARCHAR(50) NOT NULL,
        decision_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        recommendations TEXT,
        accepted_recommendations TEXT,
        rejected_recommendations TEXT,
        overridden_recommendations TEXT,
        justification TEXT,
        approval_level VARCHAR(50),
        restrictions TEXT,
        notes TEXT,
        FOREIGN KEY (request_id) REFERENCES coi_requests(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `)
    
    const stmt = db.prepare(`
      INSERT INTO compliance_audit_log (
        request_id, user_id, user_name, user_role, decision,
        recommendations, accepted_recommendations, rejected_recommendations,
        overridden_recommendations, justification, approval_level,
        restrictions, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run(
      requestId,
      userId,
      userName,
      userRole,
      decision,
      JSON.stringify(recommendations),
      JSON.stringify(acceptedRecommendations),
      JSON.stringify(rejectedRecommendations),
      JSON.stringify(overriddenRecommendations),
      justification || null,
      approvalLevel || null,
      restrictions || null,
      notes || null
    )
    
    console.log(`[Audit] Compliance decision logged: ${decision} by ${userName} for request ${requestId}`)
  } catch (error) {
    console.error('[Audit] Error logging compliance decision:', error)
    // Don't throw - audit logging should not break the workflow
  }
}

/**
 * Get audit trail for a request
 */
export function getAuditTrail(requestId) {
  try {
    const logs = db.prepare(`
      SELECT * FROM compliance_audit_log
      WHERE request_id = ?
      ORDER BY decision_timestamp DESC
    `).all(requestId)
    
    return logs.map(log => ({
      ...log,
      recommendations: log.recommendations ? JSON.parse(log.recommendations) : [],
      accepted_recommendations: log.accepted_recommendations ? JSON.parse(log.accepted_recommendations) : [],
      rejected_recommendations: log.rejected_recommendations ? JSON.parse(log.rejected_recommendations) : [],
      overridden_recommendations: log.overridden_recommendations ? JSON.parse(log.overridden_recommendations) : []
    }))
  } catch (error) {
    console.error('[Audit] Error fetching audit trail:', error)
    return []
  }
}

/**
 * Parse recommendations from request data
 */
export function parseRecommendations(request) {
  try {
    if (!request.duplication_matches) return []
    
    const data = typeof request.duplication_matches === 'string'
      ? JSON.parse(request.duplication_matches)
      : request.duplication_matches
      
    return data.ruleRecommendations || []
  } catch {
    return []
  }
}

/**
 * General-purpose audit trail logging
 * Used for any action that needs to be recorded in the audit log
 */
export function logAuditTrail(userId, entityType, entityId, actionType, description, metadata = {}) {
  try {
    // Ensure general audit_trail table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_trail (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        entity_type VARCHAR(100) NOT NULL,
        entity_id INTEGER,
        action_type VARCHAR(100) NOT NULL,
        description TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `)
    
    db.prepare(`
      INSERT INTO audit_trail (user_id, entity_type, entity_id, action_type, description, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      userId || null,
      entityType,
      entityId || null,
      actionType,
      description || null,
      JSON.stringify(metadata)
    )
    
    console.log(`[Audit] ${actionType} on ${entityType}#${entityId}: ${description}`)
  } catch (error) {
    console.error('[Audit] Error logging audit trail:', error)
    // Don't throw - audit logging should not break the workflow
  }
}

/**
 * Get general audit trail entries
 */
export function getGeneralAuditTrail(filters = {}) {
  try {
    let query = 'SELECT * FROM audit_trail WHERE 1=1'
    const params = []
    
    if (filters.entityType) {
      query += ' AND entity_type = ?'
      params.push(filters.entityType)
    }
    
    if (filters.entityId) {
      query += ' AND entity_id = ?'
      params.push(filters.entityId)
    }
    
    if (filters.userId) {
      query += ' AND user_id = ?'
      params.push(filters.userId)
    }
    
    if (filters.actionType) {
      query += ' AND action_type = ?'
      params.push(filters.actionType)
    }
    
    query += ' ORDER BY created_at DESC'
    
    if (filters.limit) {
      query += ' LIMIT ?'
      params.push(filters.limit)
    }
    
    const logs = db.prepare(query).all(...params)
    
    return logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : {}
    }))
  } catch (error) {
    console.error('[Audit] Error fetching audit trail:', error)
    return []
  }
}

export default {
  logComplianceDecision,
  getAuditTrail,
  parseRecommendations,
  logAuditTrail,
  getGeneralAuditTrail
}