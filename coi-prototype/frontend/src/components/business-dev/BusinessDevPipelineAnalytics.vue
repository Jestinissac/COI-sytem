<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Pipeline & Analytics</h3>
        <p class="text-sm text-gray-500">Track your sales funnel, forecast, and reports</p>
      </div>
      <button 
        @click="refreshData" 
        :disabled="loading"
        class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
      >
        <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Refresh
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !hasData" class="flex items-center justify-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <template v-else>
      <!-- Live Metrics Section -->
      <div>
        <h4 class="text-sm font-semibold text-gray-700 mb-3">Live Metrics</h4>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Lead Sources Card -->
          <div 
            class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer" 
            @click="$emit('viewReport', 'lead-source-effectiveness')"
          >
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm text-gray-500">Lead Sources</p>
              <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
            </div>
            <!-- Empty state -->
            <template v-if="!leadSourceData.total_prospects">
              <p class="text-xl font-bold text-gray-400">--</p>
              <p class="text-xs text-gray-400 mt-1">No leads tracked yet</p>
            </template>
            <!-- Data state -->
            <template v-else>
              <p class="text-2xl font-bold text-gray-900">{{ leadSourceData.total_prospects }}</p>
              <p class="text-xs text-gray-500 mt-1">
                <span class="text-green-600 font-medium">{{ leadSourceData.best_conversion_rate || 0 }}%</span> 
                best conversion
              </p>
            </template>
          </div>

          <!-- Conversion Rate Card -->
          <div 
            class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer" 
            @click="$emit('viewReport', 'funnel-performance')"
          >
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm text-gray-500">Conversion Rate</p>
              <div class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                </svg>
              </div>
            </div>
            <!-- Empty state -->
            <template v-if="!funnelData.total_leads">
              <p class="text-xl font-bold text-gray-400">--</p>
              <p class="text-xs text-gray-400 mt-1">No funnel data yet</p>
            </template>
            <!-- Data state -->
            <template v-else>
              <p class="text-2xl font-bold text-gray-900">{{ funnelData.overall_conversion_rate || 0 }}%</p>
              <p class="text-xs text-gray-500 mt-1">
                {{ funnelData.total_leads }} leads → {{ funnelData.total_conversions || 0 }} won
              </p>
            </template>
          </div>

          <!-- Pipeline Forecast Card -->
          <div 
            class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer" 
            @click="$emit('viewReport', 'pipeline-forecast')"
          >
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm text-gray-500">Pipeline Forecast</p>
              <div class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
            </div>
            <!-- Empty state -->
            <template v-if="!forecastData.expected_conversions">
              <p class="text-xl font-bold text-gray-400">--</p>
              <p class="text-xs text-gray-400 mt-1">No forecast data yet</p>
            </template>
            <!-- Data state -->
            <template v-else>
              <p class="text-2xl font-bold text-gray-900">{{ forecastData.expected_conversions }}</p>
              <p class="text-xs text-gray-500 mt-1">Expected conversions this period</p>
            </template>
          </div>

          <!-- Client Interactions Card -->
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm text-gray-500">Interactions (Last 30 Days)</p>
              <div class="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                <svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
            </div>
            <!-- Empty state -->
            <template v-if="!interactionsCount">
              <p class="text-xl font-bold text-gray-400">--</p>
              <p class="text-xs text-gray-400 mt-1">No interactions recorded</p>
            </template>
            <!-- Data state -->
            <template v-else>
              <p class="text-2xl font-bold text-gray-900">{{ interactionsCount }}</p>
              <p class="text-xs text-gray-500 mt-1">Client touchpoints</p>
            </template>
          </div>
        </div>
      </div>

      <!-- Sales Funnel Section -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h4 class="text-sm font-semibold text-gray-900 mb-4">Sales Funnel</h4>
        
        <!-- Empty state -->
        <div v-if="!funnelStages.length" class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
          </svg>
          <p class="mt-4 text-sm text-gray-500">No funnel data available.</p>
          <p class="mt-1 text-xs text-gray-400">Add prospects and track their progress to see pipeline visualization.</p>
        </div>
        
        <!-- Data state -->
        <div v-else class="space-y-3">
          <div v-for="(stage, idx) in funnelStages" :key="idx" class="flex items-center gap-4">
            <div class="w-32 text-sm text-gray-600 text-right">{{ stage.name }}</div>
            <div class="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
              <div 
                class="h-full rounded-full transition-all flex items-center justify-end pr-2"
                :class="stage.color"
                :style="{ width: `${stage.percentage}%` }"
              >
                <span class="text-xs font-medium text-white">{{ stage.count }}</span>
              </div>
            </div>
            <div class="w-16 text-sm text-gray-500 text-right">{{ stage.percentage }}%</div>
          </div>
        </div>
      </div>

      <!-- Period Comparison Section -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h4 class="text-sm font-semibold text-gray-900">Period Comparison</h4>
            <p class="text-xs text-gray-500">This Month vs Last Month</p>
          </div>
          <button 
            @click="$emit('viewReport', 'period-comparison')"
            class="text-xs text-blue-600 hover:text-blue-800"
          >
            View Full Report
          </button>
        </div>
        
        <!-- Empty state -->
        <div v-if="!periodData.current && !periodData.previous" class="text-center py-6">
          <svg class="mx-auto h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <p class="mt-3 text-sm text-gray-500">No conversions recorded yet.</p>
          <p class="mt-1 text-xs text-gray-400">Data will appear once prospects are converted to clients.</p>
        </div>
        
        <!-- Data state -->
        <div v-else class="grid grid-cols-3 gap-4 text-center">
          <div class="p-3 bg-gray-50 rounded-lg">
            <p class="text-xs text-gray-500 mb-1">This Month</p>
            <p class="text-xl font-bold text-gray-900">{{ periodData.current || 0 }}</p>
            <p class="text-xs text-gray-500">conversions</p>
          </div>
          <div class="p-3 bg-gray-50 rounded-lg">
            <p class="text-xs text-gray-500 mb-1">Last Month</p>
            <p class="text-xl font-bold text-gray-900">{{ periodData.previous || 0 }}</p>
            <p class="text-xs text-gray-500">conversions</p>
          </div>
          <div class="p-3 rounded-lg" :class="periodData.change > 0 ? 'bg-green-50' : periodData.change < 0 ? 'bg-red-50' : 'bg-gray-50'">
            <p class="text-xs text-gray-500 mb-1">Change</p>
            <p class="text-xl font-bold" :class="periodData.change > 0 ? 'text-green-600' : periodData.change < 0 ? 'text-red-600' : 'text-gray-600'">
              {{ periodData.change > 0 ? '+' : '' }}{{ periodData.change || 0 }}%
            </p>
            <p class="text-xs text-gray-500">vs last month</p>
          </div>
        </div>
      </div>

      <!-- Reports Catalog Section -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-semibold text-gray-700">Reports</h4>
          <router-link 
            to="/coi/reports"
            class="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View All Reports
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </router-link>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <!-- Lead Source Effectiveness -->
          <div 
            @click="$emit('viewReport', 'lead-source-effectiveness')"
            class="bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">Lead Sources</p>
                <p class="text-xs text-gray-500">Source effectiveness</p>
              </div>
            </div>
          </div>

          <!-- Funnel Performance -->
          <div 
            @click="$emit('viewReport', 'funnel-performance')"
            class="bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">Funnel Performance</p>
                <p class="text-xs text-gray-500">Pipeline progression</p>
              </div>
            </div>
          </div>

          <!-- Conversion Trends -->
          <div 
            @click="$emit('viewReport', 'conversion-trends')"
            class="bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">Conversion Trends</p>
                <p class="text-xs text-gray-500">Patterns over time</p>
              </div>
            </div>
          </div>

          <!-- Attribution by User -->
          <div 
            @click="$emit('viewReport', 'attribution-by-user')"
            class="bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">Attribution</p>
                <p class="text-xs text-gray-500">By user</p>
              </div>
            </div>
          </div>

          <!-- Pipeline Forecast -->
          <div 
            @click="$emit('viewReport', 'pipeline-forecast')"
            class="bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">Pipeline Forecast</p>
                <p class="text-xs text-gray-500">Expected conversions</p>
              </div>
            </div>
          </div>

          <!-- Period Comparison -->
          <div 
            @click="$emit('viewReport', 'period-comparison')"
            class="bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">Period Comparison</p>
                <p class="text-xs text-gray-500">Month over month</p>
              </div>
            </div>
          </div>

          <!-- AI Insights Effectiveness -->
          <div 
            @click="$emit('viewReport', 'insights-to-conversion')"
            class="bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">AI Insights</p>
                <p class="text-xs text-gray-500">Effectiveness</p>
              </div>
            </div>
          </div>

          <!-- Lost Prospect Analysis -->
          <div 
            @click="$emit('viewReport', 'lost-prospect-analysis')"
            class="bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">Lost Analysis</p>
                <p class="text-xs text-gray-500">Why prospects lost</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const emit = defineEmits(['viewReport'])

const loading = ref(false)

// Report data
const leadSourceData = ref<any>({})
const funnelData = ref<any>({})
const forecastData = ref<any>({})
const periodData = ref<any>({ current: 0, previous: 0, change: 0 })
const interactionsCount = ref(0)

const hasData = computed(() => {
  return leadSourceData.value.total_prospects !== undefined ||
         funnelData.value.total_leads !== undefined
})

const funnelStages = computed(() => {
  const stages = funnelData.value.chart_data || []
  if (!stages.length) return []
  
  const total = stages[0]?.count || 1
  const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500']
  
  return stages.map((stage: any, idx: number) => ({
    name: stage.stage || stage.name || `Stage ${idx + 1}`,
    count: stage.count || 0,
    percentage: Math.round((stage.count / total) * 100) || 0,
    color: colors[idx % colors.length]
  }))
})

async function fetchLeadSourceData() {
  try {
    const response = await api.post('/reports/admin/lead-source-effectiveness', {})
    leadSourceData.value = response.data.summary || {}
    leadSourceData.value.chart_data = response.data.chart_data || []
  } catch (e: any) {
    console.error('Failed to fetch lead source data:', e)
  }
}

async function fetchFunnelData() {
  try {
    const response = await api.post('/reports/admin/funnel-performance', {})
    funnelData.value = response.data.summary || {}
    funnelData.value.chart_data = response.data.chart_data || []
  } catch (e: any) {
    console.error('Failed to fetch funnel data:', e)
  }
}

async function fetchForecastData() {
  try {
    const response = await api.post('/reports/admin/pipeline-forecast', {})
    forecastData.value = response.data.summary || {}
  } catch (e: any) {
    console.error('Failed to fetch forecast data:', e)
  }
}

async function fetchPeriodData() {
  try {
    const response = await api.post('/reports/admin/period-comparison', {})
    const summary = response.data.summary || {}
    periodData.value = {
      current: summary.current_period_conversions || 0,
      previous: summary.previous_period_conversions || 0,
      change: summary.change_percentage || 0
    }
  } catch (e: any) {
    console.error('Failed to fetch period data:', e)
  }
}

async function refreshData() {
  loading.value = true
  
  try {
    await Promise.all([
      fetchLeadSourceData(),
      fetchFunnelData(),
      fetchForecastData(),
      fetchPeriodData()
    ])
  } catch (e: any) {
    console.error('Failed to load pipeline data:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshData()
})
</script>
