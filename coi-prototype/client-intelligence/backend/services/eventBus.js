/**
 * Event Bus Service
 * Simple event bus for trigger signal notifications
 * Uses Node.js EventEmitter for internal event handling
 */

import { EventEmitter } from 'events'
import { isClientIntelligenceEnabled } from '../../../backend/src/services/configService.js'

class ClientIntelligenceEventBus extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(50) // Allow multiple subscribers
    this.isEnabled = false
  }

  /**
   * Initialize event bus (only if feature is enabled)
   */
  initialize() {
    if (!isClientIntelligenceEnabled()) {
      return
    }

    this.isEnabled = true
    // No default listeners - events are available for future use if needed
  }

  /**
   * Emit trigger signal event
   */
  emitTriggerSignal(triggerType, data) {
    if (!this.isEnabled) {
      return
    }

    this.emit(`trigger:${triggerType}`, data)
  }

  /**
   * Register custom event listener
   */
  subscribe(eventName, handler) {
    if (!this.isEnabled) {
      return
    }
    this.on(eventName, handler)
  }

  /**
   * Remove event listener
   */
  unsubscribe(eventName, handler) {
    this.off(eventName, handler)
  }
}

// Singleton instance
const eventBus = new ClientIntelligenceEventBus()

// Auto-initialize if feature is enabled
if (isClientIntelligenceEnabled()) {
  eventBus.initialize()
}

export default eventBus
