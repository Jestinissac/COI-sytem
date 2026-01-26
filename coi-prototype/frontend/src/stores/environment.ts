import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export type Environment = 'production' | 'staging' | 'development' | 'test'

const ENVIRONMENT_KEY = 'coi_environment'
const DEFAULT_ENV: Environment = 'development'

// Environment configuration
const ENV_CONFIG: Record<Environment, { name: string; apiUrl: string; color: string }> = {
  production: {
    name: 'Production',
    apiUrl: '/api',
    color: 'red'
  },
  staging: {
    name: 'Staging',
    apiUrl: '/api',
    color: 'orange'
  },
  development: {
    name: 'Development',
    apiUrl: '/api',
    color: 'blue'
  },
  test: {
    name: 'Test',
    apiUrl: '/api',
    color: 'purple'
  }
}

export const useEnvironmentStore = defineStore('environment', () => {
  const currentEnv = ref<Environment>(
    (localStorage.getItem(ENVIRONMENT_KEY) as Environment) || DEFAULT_ENV
  )

  function setEnvironment(env: Environment) {
    currentEnv.value = env
    localStorage.setItem(ENVIRONMENT_KEY, env)
    
    // Update API base URL if needed (for future multi-backend support)
    const config = ENV_CONFIG[env]
    // For now, all environments use the same API proxy
    // In the future, this could point to different backend URLs
    
    console.log(`🌍 Environment switched to: ${config.name}`)
  }

  function getEnvironmentConfig() {
    return ENV_CONFIG[currentEnv.value]
  }

  function isTest() {
    return currentEnv.value === 'test'
  }

  function isProduction() {
    return currentEnv.value === 'production'
  }

  function isStaging() {
    return currentEnv.value === 'staging'
  }

  function isDevelopment() {
    return currentEnv.value === 'development'
  }

  return {
    currentEnv,
    setEnvironment,
    getEnvironmentConfig,
    isTest,
    isProduction,
    isStaging,
    isDevelopment,
    ENV_CONFIG
  }
})
