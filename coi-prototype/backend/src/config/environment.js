/**
 * Environment Configuration Helper
 * Provides environment detection and validation for the COI system
 */

/**
 * Get current environment
 * @returns {string} Environment name (production, staging, development, test)
 */
export function getEnvironment() {
  return process.env.NODE_ENV || 'development'
}

/**
 * Check if current environment is production
 * @returns {boolean}
 */
export function isProduction() {
  return getEnvironment() === 'production'
}

/**
 * Check if current environment is staging
 * @returns {boolean}
 */
export function isStaging() {
  return getEnvironment() === 'staging'
}

/**
 * Check if current environment is development
 * @returns {boolean}
 */
export function isDevelopment() {
  return getEnvironment() === 'development'
}

/**
 * Check if current environment is test
 * @returns {boolean}
 */
export function isTest() {
  return getEnvironment() === 'test'
}

/**
 * Check if load testing is allowed in current environment
 * Load testing is only allowed in staging, development, and test environments
 * @returns {boolean}
 */
export function isLoadTestingAllowed() {
  const env = getEnvironment()
  return env === 'staging' || env === 'development' || env === 'test'
}

/**
 * Get database name based on environment
 * @returns {string} Database filename
 */
export function getDatabaseName() {
  const env = getEnvironment()
  
  switch (env) {
    case 'production':
      return 'coi.db'
    case 'staging':
      return 'coi-staging.db'
    case 'test':
      return 'coi-test.db'
    default:
      return 'coi-dev.db'
  }
}

/**
 * Validate environment configuration
 * @throws {Error} If environment is invalid
 */
export function validateEnvironment() {
  const env = getEnvironment()
  const validEnvironments = ['production', 'staging', 'development', 'test']
  
  if (!validEnvironments.includes(env)) {
    throw new Error(
      `Invalid NODE_ENV: ${env}. Must be one of: ${validEnvironments.join(', ')}`
    )
  }
}

/**
 * Get environment-specific configuration
 * @returns {object} Environment configuration
 */
export function getEnvironmentConfig() {
  const env = getEnvironment()
  
  return {
    environment: env,
    isProduction: isProduction(),
    isStaging: isStaging(),
    isDevelopment: isDevelopment(),
    isTest: isTest(),
    loadTestingAllowed: isLoadTestingAllowed(),
    databaseName: getDatabaseName(),
    enableLoadTesting: isLoadTestingAllowed()
  }
}
