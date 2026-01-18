/**
 * Feature Flag Service (Frontend)
 * Handles client intelligence feature flag checks
 */

import api from '../../../frontend/src/services/api.ts'

export interface FeatureFlagStatus {
  enabled: boolean
  edition: string
  reason: string
  lastUpdated: string | null
  updatedBy: number | null
}

/**
 * Check if Client Intelligence module is enabled
 */
export async function isClientIntelligenceEnabled(): Promise<boolean> {
  try {
    const response = await api.get<FeatureFlagStatus>('/config/client-intelligence/status')
    return response.data.enabled
  } catch (error) {
    console.error('Error checking feature flag:', error)
    return false // Fail-safe: disabled on error
  }
}

/**
 * Get feature flag status
 */
export async function getClientIntelligenceStatus(): Promise<FeatureFlagStatus> {
  try {
    const response = await api.get<FeatureFlagStatus>('/config/client-intelligence/status')
    return response.data
  } catch (error) {
    console.error('Error getting feature flag status:', error)
    return {
      enabled: false,
      edition: 'standard',
      reason: 'Error checking status',
      lastUpdated: null,
      updatedBy: null
    }
  }
}

/**
 * Enable Client Intelligence module
 * Requires: Super Admin role
 */
export async function enableClientIntelligence(): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await api.post('/config/client-intelligence/enable')
    return { success: true, ...response.data }
  } catch (error: any) {
    console.error('Error enabling feature:', error)
    return { 
      success: false, 
      message: error.response?.data?.error || 'Failed to enable feature' 
    }
  }
}

/**
 * Disable Client Intelligence module
 * Requires: Super Admin role
 */
export async function disableClientIntelligence(): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await api.post('/config/client-intelligence/disable')
    return { success: true, ...response.data }
  } catch (error: any) {
    console.error('Error disabling feature:', error)
    return { 
      success: false, 
      message: error.response?.data?.error || 'Failed to disable feature' 
    }
  }
}
