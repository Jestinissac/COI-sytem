<template>
  <div v-if="conversions.length > 0" class="bg-white border border-gray-200 rounded-lg p-4">
    <h3 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      Conversion History
    </h3>

    <div class="space-y-3">
      <div
        v-for="conversion in conversions"
        :key="conversion.id"
        class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span
                :class="getStatusClass(conversion.status)"
                class="px-2 py-1 text-xs font-semibold rounded-full"
              >
                {{ conversion.status }}
              </span>
              <span class="text-xs text-gray-500">
                {{ formatDate(conversion.conversion_date) }}
              </span>
            </div>
            
            <div class="mt-2 text-sm">
              <div class="flex items-center gap-2 text-gray-700">
                <span class="font-medium">Original Proposal:</span>
                <router-link
                  :to="`/coi/requests/${conversion.original_proposal_request_id}`"
                  class="text-purple-600 hover:text-purple-800 font-medium"
                >
                  {{ conversion.original_request_id }}
                </router-link>
              </div>
              
              <div v-if="conversion.new_engagement_request_id" class="flex items-center gap-2 text-gray-700 mt-1">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
                <span class="font-medium">New Engagement:</span>
                <router-link
                  :to="`/coi/requests/${conversion.new_engagement_request_id}`"
                  class="text-purple-600 hover:text-purple-800 font-medium"
                >
                  {{ conversion.new_request_id }}
                </router-link>
              </div>
            </div>
            
            <div v-if="conversion.conversion_reason" class="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
              <span class="font-medium">Reason:</span> {{ conversion.conversion_reason }}
            </div>
            
            <div v-if="conversion.converted_by_name" class="mt-2 text-xs text-gray-500">
              Converted by: {{ conversion.converted_by_name }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const props = defineProps<{
  requestId: number
}>()

const conversions = ref<any[]>([])

onMounted(async () => {
  await loadConversions()
})

async function loadConversions() {
  try {
    const response = await api.get(`/engagement/conversions/${props.requestId}`)
    conversions.value = response.data
  } catch (error) {
    console.error('Error loading conversion history:', error)
  }
}

function getStatusClass(status: string) {
  const classes = {
    'Completed': 'bg-green-100 text-green-800',
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Failed': 'bg-red-100 text-red-800'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

function formatDate(dateString: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
