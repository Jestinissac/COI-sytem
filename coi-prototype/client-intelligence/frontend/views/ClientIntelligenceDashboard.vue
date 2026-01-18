<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 mb-6">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">Client Relationship Intelligence</h1>
            <p class="text-sm text-gray-500 mt-1">Strategic client engagement opportunities and service portfolio insights</p>
          </div>
        </div>
      </div>
    </div>

    <div class="px-6 pb-6">
      <!-- Loading State -->
      <div v-if="store.loading" class="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div class="flex flex-col items-center justify-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-4 text-sm text-gray-600">Loading client intelligence data...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="store.error" class="bg-white rounded-lg shadow-sm border border-red-200 p-6 mb-6">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-red-800">Unable to load dashboard data</h3>
            <p class="mt-1 text-sm text-red-700">{{ store.error }}</p>
            <div class="mt-4">
              <button 
                @click="store.clearError(); loadData()" 
                class="text-sm font-medium text-red-600 hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Dashboard Content -->
      <div v-else class="space-y-6">
        <!-- Action Bar -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Generate insights from existing client and engagement data</p>
              <p class="text-xs text-gray-500 mt-1">Analyzes service gaps, engagement lifecycles, and business cycles to identify opportunities</p>
            </div>
            <button
              @click="generateInsights"
              :disabled="isGenerating"
              class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg v-if="!isGenerating" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div v-else class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {{ isGenerating ? 'Generating...' : 'Generate Insights' }}
            </button>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Active Opportunities</p>
                <p class="text-2xl font-semibold text-gray-900 mt-2">{{ dashboardSummary?.totalOpportunities || 0 }}</p>
              </div>
              <div class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Client Interactions (30d)</p>
                <p class="text-2xl font-semibold text-gray-900 mt-2">{{ dashboardSummary?.totalInteractions || 0 }}</p>
              </div>
              <div class="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Pending Recommendations</p>
                <p class="text-2xl font-semibold text-gray-900 mt-2">{{ store.recommendations.length }}</p>
              </div>
              <div class="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Priority Opportunities Panel -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-semibold text-gray-900">Priority Opportunities</h2>
                <p class="text-sm text-gray-500 mt-1">Recommended client engagement opportunities based on service portfolio analysis</p>
              </div>
            </div>
          </div>

          <div class="p-6">
            <div v-if="store.topRecommendations.length === 0" class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="mt-4 text-sm text-gray-500">No recommendations available at this time.</p>
              <p class="mt-1 text-xs text-gray-400">Recommendations will appear as trigger signals are generated based on client engagement data.</p>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="(rec, index) in store.topRecommendations.slice(0, 5)"
                :key="index"
                class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <span class="font-semibold text-gray-900">{{ rec.clientName }}</span>
                      <span 
                        class="px-2 py-1 text-xs font-medium rounded"
                        :class="getPriorityClass(rec.priority)"
                      >
                        {{ rec.priority.toUpperCase() }}
                      </span>
                      <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        Opportunity Score: {{ Math.round(rec.conversionProbability) }}
                      </span>
                    </div>
                    <div class="space-y-1">
                      <p class="text-sm text-gray-600">
                        <span class="font-medium">Service:</span> {{ rec.serviceName }}
                      </p>
                      <p class="text-sm text-gray-600">
                        <span class="font-medium">Recommended Date:</span> {{ formatDate(rec.suggestedDate) }}
                      </p>
                      <p v-if="rec.complianceStatus" class="text-xs mt-1">
                        <span 
                          class="px-2 py-0.5 rounded font-medium"
                          :class="getComplianceStatusClass(rec.complianceStatus)"
                        >
                          {{ getComplianceStatusLabel(rec.complianceStatus) }}
                        </span>
                        <span v-if="rec.complianceNote" class="ml-2 text-gray-600">{{ rec.complianceNote }}</span>
                      </p>
                      <p class="text-sm text-gray-700 mt-2">{{ rec.reasoning }}</p>
                    </div>
                  </div>
                  <div class="ml-4 flex flex-col gap-2">
                    <button
                      @click="initiateContact(rec)"
                      class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      Initiate Contact
                    </button>
                    <button
                      @click="viewDetails(rec)"
                      class="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors whitespace-nowrap"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- All Recommendations Table -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">All Recommendations</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommended Date</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opportunity Score</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reasoning</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-if="store.recommendations.length === 0">
                  <td colspan="7" class="px-6 py-8 text-center text-sm text-gray-500">
                    No recommendations available. The system will generate recommendations based on trigger signals.
                  </td>
                </tr>
                <tr
                  v-for="(rec, index) in store.recommendations"
                  :key="index"
                  class="hover:bg-gray-50"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ rec.clientName }}</div>
                    <div class="text-xs text-gray-500">{{ rec.clientCode }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ rec.serviceName }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ formatDate(rec.suggestedDate) }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span 
                      class="px-2 py-1 text-xs font-medium rounded"
                      :class="getPriorityClass(rec.priority)"
                    >
                      {{ rec.priority.toUpperCase() }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ Math.round(rec.conversionProbability) }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="space-y-1">
                      <div class="text-sm text-gray-700 max-w-xs truncate" :title="rec.reasoning">
                        {{ rec.reasoning }}
                      </div>
                      <div v-if="rec.complianceStatus" class="text-xs">
                        <span 
                          class="px-2 py-0.5 rounded font-medium"
                          :class="getComplianceStatusClass(rec.complianceStatus)"
                        >
                          {{ getComplianceStatusLabel(rec.complianceStatus) }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      @click="initiateContact(rec)"
                      class="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Contact
                    </button>
                    <button
                      @click="viewDetails(rec)"
                      class="text-gray-600 hover:text-gray-900"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useClientIntelligenceStore } from '../stores/clientIntelligence.ts'
import { useToast } from '../../../frontend/src/composables/useToast.ts'

const store = useClientIntelligenceStore()
const dashboardSummary = ref<any>(null)
const isGenerating = ref(false)
const toast = useToast()

onMounted(async () => {
  await loadData()
})

async function loadData() {
  try {
    await store.fetchDashboardSummary()
    dashboardSummary.value = store.dashboardSummary
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
}

async function generateInsights() {
  isGenerating.value = true
  try {
    const result = await store.generateInsights()
    toast.success(
      `Generated ${result.totalSignals} insights from ${result.totalClients} clients`
    )
    // Refresh dashboard
    await loadData()
  } catch (error: any) {
    toast.error(
      error.message || 'Failed to generate insights. Please try again.'
    )
  } finally {
    isGenerating.value = false
  }
}

function formatDate(dateString: string): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function getPriorityClass(priority: string): string {
  const classes: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-800'
  }
  return classes[priority.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

async function initiateContact(recommendation: any) {
  try {
    // Create interaction record
    const interactionData = {
      clientId: recommendation.clientId,
      opportunityId: recommendation.opportunityId || null,
      interactionType: 'call',
      interactionDate: new Date().toISOString().split('T')[0],
      subject: `Follow-up: ${recommendation.serviceName}`,
      notes: `Contacted regarding ${recommendation.serviceName} opportunity. ${recommendation.reasoning}`,
      outcome: 'pending',
      nextAction: 'Schedule follow-up meeting',
      nextActionDate: recommendation.suggestedDate
    }

    const result = await store.addClientInteraction(interactionData)
    
    if (result.success) {
      toast.success(`Interaction logged for ${recommendation.clientName}`)
      // Refresh dashboard to show updated interaction count
      await loadData()
    } else {
      toast.error(result.message || 'Failed to log interaction')
    }
  } catch (error: any) {
    console.error('Error initiating contact:', error)
    toast.error(error.message || 'Failed to initiate contact')
  }
}

function getComplianceStatusClass(status: string): string {
  const classes: Record<string, string> = {
    compliance_safe: 'bg-green-100 text-green-800',
    requires_safeguards: 'bg-yellow-100 text-yellow-800',
    review_required: 'bg-blue-100 text-blue-800',
    blocked: 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

function getComplianceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    compliance_safe: '✓ Compliance Safe',
    requires_safeguards: '⚠ Requires Safeguards',
    review_required: 'ℹ Review Required',
    blocked: '✗ Blocked'
  }
  return labels[status] || status
}

function viewDetails(recommendation: any) {
  // TODO: Open detail modal
  console.log('View details for:', recommendation)
  alert(`View details for ${recommendation.clientName}`)
}
</script>
