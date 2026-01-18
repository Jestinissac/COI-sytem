/**
 * Client Intelligence API Service
 * API calls for client intelligence module
 */

import api from '../../../frontend/src/services/api.ts'

export interface Recommendation {
  clientId: number
  clientName: string
  clientCode: string
  serviceId: number | null
  serviceName: string
  suggestedDate: string
  priority: string
  triggerType: string
  triggerSubtype: string
  reasoning: string
  score: number
  conversionProbability: number
  complianceStatus?: 'compliance_safe' | 'requires_safeguards' | 'review_required' | 'blocked'
  complianceNote?: string | null
  complianceReason?: string
  regulation?: string | null
}

export interface ClientOpportunity {
  id: number
  clientId: number
  opportunityType: string
  serviceId: number | null
  title: string
  description: string
  priority: string
  conversionProbability: number
  suggestedContactDate: string
  status: string
  clientName?: string
  serviceName?: string
}

export interface ClientInteraction {
  id: number
  clientId: number
  opportunityId: number | null
  interactionType: string
  interactionDate: string
  subject: string | null
  notes: string | null
  outcome: string | null
  nextAction: string | null
  nextActionDate: string | null
  createdByName?: string
  opportunityTitle?: string
}

/**
 * Get next best action recommendations
 */
export async function getNextBestActions(limit = 10): Promise<{ recommendations: Recommendation[]; total: number }> {
  const response = await api.get('/client-intelligence/recommendations', {
    params: { limit }
  })
  return response.data
}

/**
 * Get client intelligence profile
 */
export async function getClientProfile(clientId: number) {
  const response = await api.get(`/client-intelligence/clients/${clientId}/profile`)
  return response.data
}

/**
 * Get client opportunities
 */
export async function getClientOpportunities(clientId: number, options?: { status?: string; limit?: number }): Promise<{ opportunities: ClientOpportunity[] }> {
  const response = await api.get(`/client-intelligence/clients/${clientId}/opportunities`, {
    params: options
  })
  return response.data
}

/**
 * Create opportunity from trigger
 */
export async function createOpportunityFromTrigger(triggerId: number): Promise<{ success: boolean; opportunityId?: number; message?: string }> {
  const response = await api.post(`/client-intelligence/triggers/${triggerId}/create-opportunity`)
  return response.data
}

/**
 * Get client interactions
 */
export async function getClientInteractions(clientId: number, options?: { opportunityId?: number; limit?: number }): Promise<{ interactions: ClientInteraction[] }> {
  const response = await api.get(`/client-intelligence/clients/${clientId}/interactions`, {
    params: options
  })
  return response.data
}

/**
 * Create client interaction
 */
export async function createClientInteraction(data: {
  clientId: number
  opportunityId?: number
  interactionType: string
  interactionDate?: string
  subject?: string
  notes?: string
  outcome?: string
  nextAction?: string
  nextActionDate?: string
}): Promise<{ success: boolean; interactionId?: number; message?: string }> {
  const response = await api.post('/client-intelligence/interactions', data)
  return response.data
}

/**
 * Get dashboard summary
 */
export async function getDashboardSummary() {
  const response = await api.get('/client-intelligence/dashboard')
  return response.data
}

/**
 * Generate trigger signals for all clients
 */
export async function generateAllTriggerSignals(): Promise<{
  totalClients: number
  totalSignals: number
  message: string
  results?: Array<{
    clientId: number
    clientName: string
    signalsGenerated: number
    error?: string
  }>
}> {
  const response = await api.post('/client-intelligence/generate-all-triggers')
  return response.data
}

/**
 * Record recommendation feedback
 */
export async function recordRecommendationFeedback(recommendationId: number, action: string, outcome?: string): Promise<{ success: boolean }> {
  const response = await api.post(`/client-intelligence/recommendations/${recommendationId}/feedback`, {
    action,
    outcome
  })
  return response.data
}
