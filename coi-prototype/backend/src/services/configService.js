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
  try {
    const config = db.prepare('SELECT config_value FROM system_config WHERE config_key = ?').get('system_edition')
    return config?.config_value || 'standard'
  } catch (error) {
    console.error('Error getting system edition:', error)
    return 'standard'
  }
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
  return getSystemEdition() === 'pro'
}

export function isStandardEdition() {
  return getSystemEdition() === 'standard'
}

