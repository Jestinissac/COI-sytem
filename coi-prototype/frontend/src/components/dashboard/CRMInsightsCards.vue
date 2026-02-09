<template>
  <div class="space-y-4">
    <!-- CRM Insights Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">CRM Insights</h3>
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
    <div v-if="loading && !hasData" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div class="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div class="h-3 bg-gray-200 rounded w-full"></div>
      </div>
    </div>

    <!-- CRM Cards Grid -->
    <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Lead Source Distribution Card -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer" @click="$emit('viewReport', 'lead-source-effectiveness')">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm text-gray-500">Lead Sources</p>
          <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
        </div>
        <p class="text-2xl font-bold text-gray-900">{{ leadSourceData.total_prospects || 0 }}</p>
        <p class="text-xs text-gray-500 mt-1">
          <span class="text-green-600 font-medium">{{ leadSourceData.best_conversion_rate || 0 }}%</span> 
          best conversion ({{ leadSourceData.best_performing_source || 'N/A' }})
        </p>
        <!-- Mini bar chart -->
        <div v-if="leadSourceData.chart_data?.length" class="mt-3 flex items-end gap-1 h-8">
          <div 
            v-for="(item, idx) in leadSourceData.chart_data.slice(0, 5)" 
            :key="idx"
            class="bg-indigo-200 hover:bg-indigo-300 rounded-t flex-1 transition-colors"
            :style="{ height: `${Math.max(10, (item.value / maxLeadSourceValue) * 100)}%` }"
            :title="`${item.name}: ${item.value}`"
          ></div>
        </div>
      </div>

      <!-- Funnel Performance Card -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer" @click="$emit('viewReport', 'funnel-performance')">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm text-gray-500">Funnel Performance</p>
          <div class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
            </svg>
          </div>
        </div>
        <p class="text-2xl font-bold text-gray-900">{{ funnelData.overall_conversion_rate || 0 }}%</p>
        <p class="text-xs text-gray-500 mt-1">
          {{ funnelData.total_leads || 0 }} leads → {{ funnelData.total_conversions || 0 }} conversions
        </p>
        <!-- Simple funnel visualization -->
        <div v-if="funnelData.chart_data?.length" class="mt-3 space-y-1">
          <div 
            v-for="(stage, idx) in funnelData.chart_data.slice(0, 4)" 
            :key="idx"
            class="h-1.5 bg-purple-200 rounded-full overflow-hidden"
          >
            <div 
              class="h-full bg-purple-500 rounded-full"
              :style="{ width: `${Math.max(5, stage.conversion_rate)}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Insights Module Effectiveness Card -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer" @click="$emit('viewReport', 'insights-to-conversion')">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm text-gray-500">AI Insights</p>
          <div class="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
            <svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
        </div>
        <p class="text-2xl font-bold text-gray-900">{{ insightsData.prospects_from_insights || 0 }}</p>
        <p class="text-xs text-gray-500 mt-1">
          <span class="text-cyan-600 font-medium">{{ insightsData.insights_conversion_rate || 0 }}%</span> 
          converted from insights
        </p>
        <div class="mt-3 flex items-center gap-2">
          <div class="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              class="bg-cyan-500 rounded-full h-2 transition-all"
              :style="{ width: `${insightsData.opportunity_to_prospect_rate || 0}%` }"
            ></div>
          </div>
          <span class="text-xs text-gray-500">{{ insightsData.opportunity_to_prospect_rate || 0 }}%</span>
        </div>
      </div>

      <!-- Top Performers Card -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer" @click="$emit('viewReport', 'attribution-by-user')">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm text-gray-500">Top Performers</p>
          <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
            </svg>
          </div>
        </div>
        <p class="text-2xl font-bold text-gray-900">{{ attributionData.top_performer || 'N/A' }}</p>
        <p class="text-xs text-gray-500 mt-1">
          <span class="text-amber-600 font-medium">{{ attributionData.top_performer_conversions || 0 }}</span> 
          conversions
        </p>
        <!-- Mini leaderboard -->
        <div v-if="attributionData.chart_data?.length" class="mt-3 space-y-1">
          <div 
            v-for="(person, idx) in attributionData.chart_data.slice(0, 3)" 
            :key="idx"
            class="flex items-center gap-2 text-xs"
          >
            <span class="w-4 text-gray-400">{{ Number(idx) + 1 }}.</span>
            <span class="flex-1 truncate text-gray-700">{{ person.name }}</span>
            <span class="font-medium text-gray-900">{{ person.converted }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const emit = defineEmits(['viewReport'])

const loading = ref(false)
const error = ref('')

// Report data
const leadSourceData = ref<any>({ summary: {} })
const funnelData = ref<any>({ summary: {} })
const insightsData = ref<any>({ summary: {} })
const attributionData = ref<any>({ summary: {} })

const hasData = computed(() => {
  return leadSourceData.value.summary?.total_prospects !== undefined ||
         funnelData.value.summary?.total_leads !== undefined
})

const maxLeadSourceValue = computed(() => {
  const values = leadSourceData.value.chart_data?.map((d: any) => d.value) || [1]
  return Math.max(...values, 1)
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

async function fetchInsightsData() {
  try {
    const response = await api.post('/reports/admin/insights-to-conversion', {})
    insightsData.value = response.data.summary || {}
  } catch (e: any) {
    console.error('Failed to fetch insights data:', e)
  }
}

async function fetchAttributionData() {
  try {
    const response = await api.post('/reports/admin/attribution-by-user', {})
    attributionData.value = response.data.summary || {}
    attributionData.value.chart_data = response.data.chart_data || []
  } catch (e: any) {
    console.error('Failed to fetch attribution data:', e)
  }
}

async function refreshData() {
  loading.value = true
  error.value = ''
  
  try {
    await Promise.all([
      fetchLeadSourceData(),
      fetchFunnelData(),
      fetchInsightsData(),
      fetchAttributionData()
    ])
  } catch (e: any) {
    error.value = e.message || 'Failed to load CRM insights'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshData()
})
</script>
