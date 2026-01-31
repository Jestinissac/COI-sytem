import { getDatabase } from '../database/init.js'

const db = getDatabase()

const EDITION_FEATURES = {
  standard: [
    'basic_rules_engine',
    'fixed_form_structure',
    'basic_duplication_detection',
    'engagement_code_generation',
    'role_based_dashboards'
  ],
  pro: [
    'basic_rules_engine',
    'fixed_form_structure',
    'basic_duplication_detection',
    'engagement_code_generation',
    'role_based_dashboards',
    'advanced_rules_engine',
    'dynamic_form_builder',
    'change_management',
    'impact_analysis',
    'field_dependency_tracking',
    'rules_engine_health_monitoring'
  ]
}

export function getSystemEdition() {
  // CMA (primary) + IESBA (secondary) only: always Pro
  return 'pro'
}

export function setSystemEdition(edition, userId) {
  if (edition !== 'standard' && edition !== 'pro') {
    throw new Error('Invalid edition. Must be "standard" or "pro"')
  }

  try {
    const existing = db.prepare('SELECT id FROM system_config WHERE config_key = ?').get('system_edition')
    
    if (existing) {
      db.prepare(`
        UPDATE system_config 
        SET config_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE config_key = ?
      `).run(edition, userId, 'system_edition')
    } else {
      db.prepare(`
        INSERT INTO system_config (config_key, config_value, description, updated_by)
        VALUES (?, ?, ?, ?)
      `).run('system_edition', edition, 'Current system edition: standard or pro', userId)
    }

    return { success: true, edition }
  } catch (error) {
    console.error('Error setting system edition:', error)
    throw error
  }
}

export function isFeatureEnabled(featureName) {
  const edition = getSystemEdition()
  const features = EDITION_FEATURES[edition] || EDITION_FEATURES.standard
  return features.includes(featureName)
}

export function getEditionFeatures() {
  const edition = getSystemEdition()
  return EDITION_FEATURES[edition] || EDITION_FEATURES.standard
}

export function getAllFeatures() {
  return EDITION_FEATURES
}

export function isProEdition() {
  // CMA + IESBA only: always true
  return true
}

export function isStandardEdition() {
  return getSystemEdition() === 'standard'
}

// ========================================
// CLIENT INTELLIGENCE FEATURE FLAG
// ========================================

/**
 * Check if Client Intelligence module is enabled
 * Checks in priority order:
 * 1. Explicit config flag (client_intelligence_enabled)
 * 2. Pro edition (includes intelligence module)
 * 3. Environment variable (CLIENT_INTELLIGENCE_ENABLED)
 * 4. Default: false
 */
export function isClientIntelligenceEnabled() {
  try {
    // Priority 1: Explicit config flag
    const config = db.prepare('SELECT config_value FROM system_config WHERE config_key = ?').get('client_intelligence_enabled')
    if (config?.config_value) {
      return config.config_value === 'true' || config.config_value === '1'
    }

    // Priority 2: Pro edition includes intelligence module
    const edition = getSystemEdition()
    if (edition === 'pro') {
      return true // Pro edition includes intelligence module by default
    }

    // Priority 3: Environment variable
    if (process.env.CLIENT_INTELLIGENCE_ENABLED) {
      return process.env.CLIENT_INTELLIGENCE_ENABLED === 'true' || process.env.CLIENT_INTELLIGENCE_ENABLED === '1'
    }

    // Default: disabled
    return false
  } catch (error) {
    console.error('Error checking client intelligence feature flag:', error)
    return false // Fail-safe: disabled on error
  }
}

/**
 * Enable Client Intelligence module
 * @param {number} userId - User ID performing the action (for audit)
 * @returns {Object} Success status
 */
export function enableClientIntelligence(userId) {
  try {
    const existing = db.prepare('SELECT id FROM system_config WHERE config_key = ?').get('client_intelligence_enabled')
    
    if (existing) {
      db.prepare(`
        UPDATE system_config 
        SET config_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE config_key = ?
      `).run('true', userId, 'client_intelligence_enabled')
    } else {
      db.prepare(`
        INSERT INTO system_config (config_key, config_value, description, updated_by)
        VALUES (?, ?, ?, ?)
      `).run('client_intelligence_enabled', 'true', 'Client Intelligence module enabled/disabled flag', userId)
    }

    return { success: true, enabled: true }
  } catch (error) {
    console.error('Error enabling client intelligence:', error)
    throw error
  }
}

/**
 * Disable Client Intelligence module
 * @param {number} userId - User ID performing the action (for audit)
 * @returns {Object} Success status
 */
export function disableClientIntelligence(userId) {
  try {
    const existing = db.prepare('SELECT id FROM system_config WHERE config_key = ?').get('client_intelligence_enabled')
    
    if (existing) {
      db.prepare(`
        UPDATE system_config 
        SET config_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE config_key = ?
      `).run('false', userId, 'client_intelligence_enabled')
    } else {
      db.prepare(`
        INSERT INTO system_config (config_key, config_value, description, updated_by)
        VALUES (?, ?, ?, ?)
      `).run('client_intelligence_enabled', 'false', 'Client Intelligence module enabled/disabled flag', userId)
    }    return { success: true, enabled: false }
  } catch (error) {
    console.error('Error disabling client intelligence:', error)
    throw error
  }
}/**
 * Get Client Intelligence module status
 * @returns {Object} Status information
 */
export function getClientIntelligenceStatus() {
  try {
    const enabled = isClientIntelligenceEnabled()
    const edition = getSystemEdition()
    const config = db.prepare('SELECT updated_by, updated_at FROM system_config WHERE config_key = ?').get('client_intelligence_enabled')
    
    return {
      enabled,
      edition,
      reason: enabled 
        ? (edition === 'pro' ? 'Enabled via Pro edition' : 'Explicitly enabled')
        : 'Disabled',
      lastUpdated: config?.updated_at || null,
      updatedBy: config?.updated_by || null
    }
  } catch (error) {
    console.error('Error getting client intelligence status:', error)
    return {
      enabled: false,
      edition: 'standard',
      reason: 'Error checking status',
      lastUpdated: null,
      updatedBy: null
    }
  }
}