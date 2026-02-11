<template>
  <div class="space-y-6">
    <!-- Header with Generate Button -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">AI Insights</h3>
        <p class="text-sm text-gray-500">AI-powered client engagement recommendations</p>
      </div>
      <button
        @click="generateInsights"
        :disabled="isGenerating"
        class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <svg v-if="!isGenerating" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <div v-else class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        {{ isGenerating ? 'Generating...' : 'Generate New Insights' }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-4 text-sm text-gray-600">Loading AI insights...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex items-start">
        <svg class="h-5 w-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Unable to load insights</h3>
          <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          <button @click="loadData" class="mt-2 text-sm font-medium text-red-600 hover:text-red-800">
            Try again
          </button>
        </div>
      </div>
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Active Opportunities</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ summary.totalOpportunities || 0 }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Pending Actions</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ recommendations.length }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">High Priority</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ highPriorityCount }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendations List -->
      <div class="bg-white rounded-lg border border-gray-200">
        <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h4 class="text-sm font-semibold text-gray-900">Recommendations</h4>
          <span class="text-xs text-gray-500">{{ recommendations.length }} pending</span>
        </div>

        <div v-if="recommendations.length === 0" class="p-8 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="mt-4 text-sm text-gray-500">No recommendations available.</p>
          <p class="mt-1 text-xs text-gray-400">Click "Generate New Insights" to analyze client data.</p>
        </div>

        <div v-else class="divide-y divide-gray-200">
          <div
            v-for="rec in recommendations.slice(0, 10)"
            :key="rec.id || rec.clientId"
            class="p-4 hover:bg-gray-50"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-medium text-gray-900">{{ rec.clientName }}</span>
                  <span 
                    class="px-2 py-0.5 text-xs font-medium rounded"
                    :class="getPriorityClass(rec.priority)"
                  >
                    {{ rec.priority?.toUpperCase() }}
                  </span>
                  <span class="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                    Score: {{ Math.round(rec.conversionProbability || 0) }}
                  </span>
                </div>
                <p class="text-sm text-gray-600">
                  <span class="font-medium">Service:</span> {{ rec.serviceName }}
                </p>
                <p class="text-sm text-gray-500 mt-1">{{ rec.reasoning }}</p>
                <p v-if="rec.suggestedDate" class="text-xs text-gray-400 mt-1">
                  Suggested contact: {{ formatDate(rec.suggestedDate) }}
                </p>
              </div>
              <div class="ml-4 flex-shrink-0">
                <button
                  @click="openActionModal(rec)"
                  class="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
                >
                  Take Action
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Action Modal -->
    <ActionDropdownModal
      v-if="showActionModal"
      :recommendation="selectedRecommendation"
      @close="showActionModal = false"
      @action-taken="handleActionTaken"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import ActionDropdownModal from './ActionDropdownModal.vue'

const loading = ref(false)
const error = ref('')
const isGenerating = ref(false)
const showActionModal = ref(false)
const selectedRecommendation = ref<any>(null)

const summary = ref<any>({})
const recommendations = ref<any[]>([])

const highPriorityCount = computed(() => {
  return recommendations.value.filter(r => 
    r.priority === 'high' || r.priority === 'critical'
  ).length
})

async function loadData() {
  loading.value = true
  error.value = ''
  
  try {
    // Fetch dashboard summary
    const summaryResponse = await api.get('/client-intelligence/dashboard/summary')
    summary.value = summaryResponse.data || {}
    
    // Fetch recommendations
    const recsResponse = await api.get('/client-intelligence/recommendations')
    recommendations.value = recsResponse.data?.recommendations || []
  } catch (e: any) {
    console.error('Failed to load AI insights:', e)
    error.value = e.response?.data?.error || 'Failed to load insights'
  } finally {
    loading.value = false
  }
}

async function generateInsights() {
  isGenerating.value = true
  
  try {
    await api.post('/client-intelligence/generate-signals')
    // Reload data after generation
    await loadData()
  } catch (e: any) {
    console.error('Failed to generate insights:', e)
    error.value = e.response?.data?.error || 'Failed to generate insights'
  } finally {
    isGenerating.value = false
  }
}

function openActionModal(rec: any) {
  selectedRecommendation.value = rec
  showActionModal.value = true
}

function handleActionTaken() {
  showActionModal.value = false
  loadData() // Refresh data
}

function getPriorityClass(priority: string) {
  const classes: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-800'
  }
  return classes[priority?.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

onMounted(() => {
  loadData()
})
</script>
