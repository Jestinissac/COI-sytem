/**
 * Client Intelligence Store (Pinia)
 * State management for client intelligence module
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Recommendation, ClientOpportunity, ClientInteraction } from '../services/clientIntelligenceApi.ts'
import {
  getNextBestActions,
  getClientProfile,
  getClientOpportunities,
  getClientInteractions,
  createClientInteraction,
  getDashboardSummary,
  generateAllTriggerSignals
} from '../services/clientIntelligenceApi.ts'

export const useClientIntelligenceStore = defineStore('clientIntelligence', () => {
  // State
  const recommendations = ref<Recommendation[]>([])
  const selectedClientId = ref<number | null>(null)
  const clientProfile = ref<any>(null)
  const opportunities = ref<ClientOpportunity[]>([])
  const interactions = ref<ClientInteraction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const dashboardSummary = ref<any>(null)

  // Computed
  const topRecommendations = computed(() => {
    return recommendations.value.slice(0, 5)
  })

  const highPriorityRecommendations = computed(() => {
    return recommendations.value.filter(r => r.priority === 'high' || r.priority === 'critical')
  })

  // Actions
  async function fetchRecommendations(limit = 10) {
    loading.value = true
    error.value = null
    try {
      const result = await getNextBestActions(limit)
      recommendations.value = result.recommendations
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch recommendations'
      console.error('Error fetching recommendations:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchClientProfile(clientId: number) {
    loading.value = true
    error.value = null
    try {
      const profile = await getClientProfile(clientId)
      clientProfile.value = profile
      selectedClientId.value = clientId
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch client profile'
      console.error('Error fetching client profile:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchClientOpportunities(clientId: number, options?: { status?: string; limit?: number }) {
    loading.value = true
    error.value = null
    try {
      const result = await getClientOpportunities(clientId, options)
      opportunities.value = result.opportunities
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch opportunities'
      console.error('Error fetching opportunities:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchClientInteractions(clientId: number, options?: { opportunityId?: number; limit?: number }) {
    loading.value = true
    error.value = null
    try {
      const result = await getClientInteractions(clientId, options)
      interactions.value = result.interactions
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch interactions'
      console.error('Error fetching interactions:', err)
    } finally {
      loading.value = false
    }
  }

  async function addClientInteraction(data: {
    clientId: number
    opportunityId?: number
    interactionType: string
    interactionDate?: string
    subject?: string
    notes?: string
    outcome?: string
    nextAction?: string
    nextActionDate?: string
  }) {
    loading.value = true
    error.value = null
    try {
      const result = await createClientInteraction(data)
      if (result.success && selectedClientId.value) {
        // Refresh interactions
        await fetchClientInteractions(selectedClientId.value)
      }
      return result
    } catch (err: any) {
      error.value = err.message || 'Failed to create interaction'
      console.error('Error creating interaction:', err)
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function fetchDashboardSummary() {
    loading.value = true
    error.value = null
    try {
      const summary = await getDashboardSummary()
      dashboardSummary.value = summary
      recommendations.value = summary.recommendations || []
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch dashboard summary'
      console.error('Error fetching dashboard summary:', err)
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  async function generateInsights() {
    loading.value = true
    error.value = null
    try {
      const result = await generateAllTriggerSignals()
      // Refresh dashboard after generating signals
      await fetchDashboardSummary()
      return result
    } catch (err: any) {
      error.value = err.message || 'Failed to generate insights'
      console.error('Error generating insights:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function reset() {
    recommendations.value = []
    selectedClientId.value = null
    clientProfile.value = null
    opportunities.value = []
    interactions.value = []
    dashboardSummary.value = null
    error.value = null
  }

  return {
    // State
    recommendations,
    selectedClientId,
    clientProfile,
    opportunities,
    interactions,
    loading,
    error,
    dashboardSummary,
    // Computed
    topRecommendations,
    highPriorityRecommendations,
    // Actions
    fetchRecommendations,
    fetchClientProfile,
    fetchClientOpportunities,
    fetchClientInteractions,
    addClientInteraction,
    fetchDashboardSummary,
    generateInsights,
    clearError,
    reset
  }
})
