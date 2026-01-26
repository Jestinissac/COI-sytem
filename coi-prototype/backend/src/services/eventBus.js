import EventEmitter from 'events'
import { getDatabase } from '../database/init.js'

/**
 * Simple Event Bus for COI System
 * Uses Node.js EventEmitter for in-process event handling
 * 
 * Design: Minimal, functional, no over-engineering
 */

class COIEventBus extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(50) // Allow multiple subscribers
  }

  /**
   * Emit an event with optional logging
   */
  emitEvent(eventType, data) {
    const event = {
      eventType,
      requestId: data.requestId,
      userId: data.userId,
      targetUserId: data.targetUserId,
      data: data.data || {},
      timestamp: new Date()
    }

    // Emit event
    this.emit(eventType, event)
    
    // Optional: Log to database for debugging (if table exists)
    this.logEvent(event).catch(err => {
      // Silently fail if logging table doesn't exist
      if (!err.message.includes('no such table')) {
        console.error('Event logging error:', err)
      }
    })

    return event
  }

  /**
   * Optional: Log event to database for debugging
   */
  async logEvent(event) {
    try {
      const db = getDatabase()
      
      // Check if table exists
      const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='coi_events'").get()
      if (!tableInfo) {
        return // Table doesn't exist, skip logging
      }

      db.prepare(`
        INSERT INTO coi_events (event_type, request_id, user_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run(
        event.eventType,
        event.requestId || null,
        event.userId || null,
        event.timestamp.toISOString()
      )
    } catch (error) {
      // Ignore errors (table might not exist)
      if (!error.message.includes('no such table')) {
        throw error
      }
    }
  }
}

// Export singleton instance
export const eventBus = new COIEventBus()

// Event type constants
export const EVENT_TYPES = {
  // Approval workflow events (action required)
  DIRECTOR_APPROVAL_REQUIRED: 'DIRECTOR_APPROVAL_REQUIRED',
  COMPLIANCE_REVIEW_REQUIRED: 'COMPLIANCE_REVIEW_REQUIRED',
  PARTNER_APPROVAL_REQUIRED: 'PARTNER_APPROVAL_REQUIRED',
  MORE_INFO_REQUESTED: 'MORE_INFO_REQUESTED',
  
  // Status change events (informational)
  REQUEST_APPROVED: 'REQUEST_APPROVED',
  REQUEST_REJECTED: 'REQUEST_REJECTED',
  ENGAGEMENT_CODE_GENERATED: 'ENGAGEMENT_CODE_GENERATED',
  
  // Time-based events (deadlines) - handled by monitoringService, but can emit for My Day/Week
  PROPOSAL_EXPIRING_SOON: 'PROPOSAL_EXPIRING_SOON',
  ENGAGEMENT_EXPIRING_SOON: 'ENGAGEMENT_EXPIRING_SOON',
  STALE_REQUEST_ALERT: 'STALE_REQUEST_ALERT'
}

// SLA Event Constants
export const SLA_EVENTS = {
  WARNING: 'sla.warning',      // Request at 75%+ of SLA
  CRITICAL: 'sla.critical',    // Request at 90%+ of SLA
  BREACH: 'sla.breach',        // Request exceeded SLA
  RESOLVED: 'sla.resolved'     // Breached request completed
}

/**
 * Emit event with payload
 * Wrapper for eventBus.emitEvent for cleaner API
 */
export function emitEvent(eventType, payload) {
  return eventBus.emitEvent(eventType, {
    requestId: payload.requestId,
    userId: payload.userId,
    targetUserId: payload.targetUserId,
    data: payload
  })
}

/**
 * Subscribe to an event
 */
export function onEvent(eventType, handler) {
  eventBus.on(eventType, handler)
}

/**
 * Unsubscribe from an event
 */
export function offEvent(eventType, handler) {
  eventBus.off(eventType, handler)
}
