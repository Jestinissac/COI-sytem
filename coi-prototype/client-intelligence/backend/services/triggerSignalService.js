/**
 * Trigger Signal Service
 * Generates and manages trigger signals for opportunity identification
 */

import { getDatabase } from '../../../backend/src/database/init.js'
import { isClientIntelligenceEnabled } from '../../../backend/src/services/configService.js'
import eventBus from './eventBus.js'

const db = getDatabase()

/**
 * Generate trigger signals for a client
 */
export function generateTriggerSignals(clientId) {
  if (!isClientIntelligenceEnabled()) {
    return { signals: [], message: 'Feature disabled' }
  }

  const signals = []

  // 1. Engagement lifecycle triggers
  const lifecycleSignals = generateEngagementLifecycleSignals(clientId)
  signals.push(...lifecycleSignals)

  // 2. Business cycle triggers
  const businessCycleSignals = generateBusinessCycleSignals(clientId)
  signals.push(...businessCycleSignals)

  // 3. Service gap triggers
  const serviceGapSignals = generateServiceGapSignals(clientId)
  signals.push(...serviceGapSignals)

  // 4. Client milestone triggers
  const milestoneSignals = generateMilestoneSignals(clientId)
  signals.push(...milestoneSignals)

  // Store signals in database
  storeTriggerSignals(signals)

  // Emit events for real-time processing
  signals.forEach(signal => {
    eventBus.emitTriggerSignal(signal.trigger_type, {
      clientId: signal.client_id,
      signalId: signal.id,
      ...signal
    })
  })

  return { signals, count: signals.length }
}

/**
 * Generate trigger signals for all active clients
 * Useful for initial data generation or periodic refresh
 */
export function generateTriggerSignalsForAllClients() {
  if (!isClientIntelligenceEnabled()) {
    return { totalClients: 0, totalSignals: 0, message: 'Feature disabled' }
  }

  if (!tableExists('clients')) {
    return { totalClients: 0, totalSignals: 0, message: 'Clients table not found' }
  }

  let totalClients = 0
  let totalSignals = 0
  const results = []

  try {
    // Get all active clients
    const clients = db.prepare(`
      SELECT id, client_name, client_code
      FROM clients
      WHERE status = 'Active'
      ORDER BY client_name
    `).all()

    totalClients = clients.length

    for (const client of clients) {
      try {
        const result = generateTriggerSignals(client.id)
        totalSignals += result.count
        results.push({
          clientId: client.id,
          clientName: client.client_name,
          signalsGenerated: result.count
        })
      } catch (error) {
        console.error(`Error generating signals for client ${client.id}:`, error)
        results.push({
          clientId: client.id,
          clientName: client.client_name,
          signalsGenerated: 0,
          error: error.message
        })
      }
    }

    return {
      totalClients,
      totalSignals,
      results,
      message: `Generated ${totalSignals} signals for ${totalClients} clients`
    }
  } catch (error) {
    console.error('Error generating signals for all clients:', error)
    return {
      totalClients: 0,
      totalSignals: 0,
      error: error.message
    }
  }
}

/**
 * Check if a table exists in the database
 */
function tableExists(tableName) {
  try {
    const result = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `).get(tableName)
    return !!result
  } catch (error) {
    return false
  }
}

/**
 * Generate engagement lifecycle triggers (renewals, end dates)
 */
function generateEngagementLifecycleSignals(clientId) {
  const signals = []
  
  // Check if required tables exist
  if (!tableExists('coi_requests')) {
    console.warn('Client Intelligence: coi_requests table not found, skipping engagement lifecycle signals')
    return signals
  }

  const today = new Date()
  const ninetyDaysFromNow = new Date(today)
  ninetyDaysFromNow.setDate(today.getDate() + 90)

  try {
    // Find engagements ending soon
    const endingEngagements = db.prepare(`
      SELECT id, request_id, service_type, requested_service_period_end, status
      FROM coi_requests
      WHERE client_id = ?
        AND status IN ('Active', 'Approved')
        AND requested_service_period_end IS NOT NULL
        AND requested_service_period_end BETWEEN date('now') AND date('now', '+90 days')
      ORDER BY requested_service_period_end ASC
    `).all(clientId)

    endingEngagements.forEach(engagement => {
      const daysUntilEnd = Math.ceil((new Date(engagement.requested_service_period_end) - today) / (1000 * 60 * 60 * 24))
      
      signals.push({
        client_id: clientId,
        trigger_type: 'engagement_lifecycle',
        trigger_subtype: 'renewal_window',
        engagement_id: engagement.id,
        signal_date: new Date().toISOString().split('T')[0],
        priority: daysUntilEnd <= 30 ? 'high' : daysUntilEnd <= 60 ? 'medium' : 'low',
        status: 'active',
        metadata: JSON.stringify({
          engagement_id: engagement.request_id,
          service_type: engagement.service_type,
          end_date: engagement.requested_service_period_end,
          days_until_end: daysUntilEnd
        })
      })
    })
  } catch (error) {
    console.error('Error generating engagement lifecycle signals:', error)
  }

  return signals
}

/**
 * Generate business cycle triggers (year-end, quarter-end)
 */
function generateBusinessCycleSignals(clientId) {
  const signals = []
  
  // Check if required tables exist
  if (!tableExists('clients')) {
    console.warn('Client Intelligence: clients table not found, skipping business cycle signals')
    return signals
  }

  const today = new Date()
  let client
  try {
    client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId)
  } catch (error) {
    console.error('Error fetching client for business cycle signals:', error)
    return signals
  }
  
  if (!client) return signals

  // Check fiscal year end
  if (client.fiscal_year_end_date) {
    const fiscalYearEnd = new Date(client.fiscal_year_end_date)
    fiscalYearEnd.setFullYear(today.getFullYear()) // Use current year
    
    // If date has passed this year, use next year
    if (fiscalYearEnd < today) {
      fiscalYearEnd.setFullYear(today.getFullYear() + 1)
    }

    const daysUntilYearEnd = Math.ceil((fiscalYearEnd - today) / (1000 * 60 * 60 * 24))
    
    if (daysUntilYearEnd <= 90) {
      signals.push({
        client_id: clientId,
        trigger_type: 'business_cycle',
        trigger_subtype: 'fiscal_year_end',
        signal_date: today.toISOString().split('T')[0],
        priority: daysUntilYearEnd <= 30 ? 'high' : 'medium',
        status: 'active',
        metadata: JSON.stringify({
          fiscal_year_end: client.fiscal_year_end_date,
          days_until: daysUntilYearEnd
        })
      })
    }
  }

  // Check quarter ends
  if (client.quarter_end_dates) {
    try {
      const quarterEnds = JSON.parse(client.quarter_end_dates)
      quarterEnds.forEach((quarter, index) => {
        const [quarterLabel, dateStr] = quarter.split(': ')
        const quarterDate = new Date(dateStr)
        
        if (quarterDate >= today && quarterDate <= new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)) {
          const daysUntil = Math.ceil((quarterDate - today) / (1000 * 60 * 60 * 24))
          
          signals.push({
            client_id: clientId,
            trigger_type: 'business_cycle',
            trigger_subtype: 'quarter_end',
            signal_date: today.toISOString().split('T')[0],
            priority: daysUntil <= 14 ? 'high' : 'medium',
            status: 'active',
            metadata: JSON.stringify({
              quarter: quarterLabel,
              quarter_end: dateStr,
              days_until: daysUntil
            })
          })
        }
      })
    } catch (e) {
      console.error('Error parsing quarter_end_dates:', e)
    }
  }

  return signals
}

/**
 * Generate service gap triggers
 */
function generateServiceGapSignals(clientId) {
  const signals = []
  
  // Check if required tables exist
  if (!tableExists('coi_requests') || !tableExists('service_catalog_global')) {
    console.warn('Client Intelligence: Required tables not found, skipping service gap signals')
    return signals
  }

  try {
    // Get services used by client
    const clientServices = db.prepare(`
      SELECT DISTINCT service_type
      FROM coi_requests
      WHERE client_id = ? AND status IN ('Active', 'Approved')
    `).all(clientId).map(r => r.service_type)

    // Get all available services
    const allServices = db.prepare(`
      SELECT id, service_code, service_name, category
      FROM service_catalog_global
      WHERE is_active = 1
    `).all()

  // Find gaps (services not used by client)
  const gaps = allServices.filter(service => {
    // Simple matching - can be enhanced with fuzzy matching
    return !clientServices.some(clientService => 
      clientService && service.service_name.toLowerCase().includes(clientService.toLowerCase())
    )
  })

    // Limit to top 5 gaps
    gaps.slice(0, 5).forEach(service => {
      signals.push({
        client_id: clientId,
        trigger_type: 'service_gap',
        trigger_subtype: 'white_space',
        service_id: service.id,
        signal_date: new Date().toISOString().split('T')[0],
        priority: 'medium',
        status: 'active',
        metadata: JSON.stringify({
          service_code: service.service_code,
          service_name: service.service_name,
          category: service.category
        })
      })
    })
  } catch (error) {
    console.error('Error generating service gap signals:', error)
  }

  return signals
}

/**
 * Generate client milestone triggers
 */
function generateMilestoneSignals(clientId) {
  const signals = []
  
  // Check if required table exists
  if (!tableExists('client_milestones')) {
    // Table doesn't exist yet - this is OK, just return empty array
    return signals
  }

  const today = new Date()
  const thirtyDaysFromNow = new Date(today)
  thirtyDaysFromNow.setDate(today.getDate() + 30)

  try {
    // Find upcoming milestones
    const upcomingMilestones = db.prepare(`
      SELECT *
      FROM client_milestones
      WHERE client_id = ?
        AND milestone_date BETWEEN date('now') AND date('now', '+30 days')
      ORDER BY milestone_date ASC
    `).all(clientId)

    upcomingMilestones.forEach(milestone => {
      const daysUntil = Math.ceil((new Date(milestone.milestone_date) - today) / (1000 * 60 * 60 * 24))
      
      signals.push({
        client_id: clientId,
        trigger_type: 'client_milestone',
        trigger_subtype: milestone.milestone_type,
        signal_date: today.toISOString().split('T')[0],
        priority: daysUntil <= 7 ? 'high' : 'medium',
        status: 'active',
        metadata: JSON.stringify({
          milestone_type: milestone.milestone_type,
          milestone_date: milestone.milestone_date,
          description: milestone.description,
          days_until: daysUntil
        })
      })
    })
  } catch (error) {
    console.error('Error generating milestone signals:', error)
  }

  return signals
}

/**
 * Store trigger signals in database
 */
function storeTriggerSignals(signals) {
  if (signals.length === 0) return

  // Check if table exists
  if (!tableExists('trigger_signals')) {
    console.warn('Client Intelligence: trigger_signals table not found, cannot store signals')
    return
  }

  try {
    const insert = db.prepare(`
      INSERT INTO trigger_signals (
        client_id, trigger_type, trigger_subtype, service_id, engagement_id,
        signal_date, priority, status, metadata, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const insertMany = db.transaction((signals) => {
      for (const signal of signals) {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 90) // Expire after 90 days
        
        insert.run(
          signal.client_id,
          signal.trigger_type,
          signal.trigger_subtype,
          signal.service_id || null,
          signal.engagement_id || null,
          signal.signal_date,
          signal.priority,
          signal.status,
          signal.metadata,
          expiresAt.toISOString().split('T')[0]
        )
      }
    })

    insertMany(signals)
  } catch (error) {
    console.error('Error storing trigger signals:', error)
  }
}

/**
 * Get active trigger signals for a client
 */
export function getClientTriggerSignals(clientId, options = {}) {
  if (!isClientIntelligenceEnabled()) {
    return []
  }

  // Check if table exists
  if (!tableExists('trigger_signals')) {
    return []
  }

  let query = `
    SELECT *
    FROM trigger_signals
    WHERE client_id = ? AND status = 'active'
  `
  const params = [clientId]
  
  try {

  if (options.triggerType) {
    query += ' AND trigger_type = ?'
    params.push(options.triggerType)
  }

  if (options.priority) {
    query += ' AND priority = ?'
    params.push(options.priority)
  }

    query += ' ORDER BY priority DESC, signal_date ASC LIMIT ?'
    params.push(options.limit || 50)

    return db.prepare(query).all(...params)
  } catch (error) {
    console.error('Error getting client trigger signals:', error)
    return []
  }
}

/**
 * Acknowledge a trigger signal
 */
export function acknowledgeTriggerSignal(signalId) {
  if (!isClientIntelligenceEnabled()) {
    return { success: false, message: 'Feature disabled' }
  }

  try {
    db.prepare(`
      UPDATE trigger_signals
      SET status = 'acknowledged'
      WHERE id = ?
    `).run(signalId)

    return { success: true }
  } catch (error) {
    console.error('Error acknowledging trigger signal:', error)
    return { success: false, error: error.message }
  }
}
