<template>
  <div v-if="events.length > 0" class="bg-white border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-6">
      <!-- Collapsed View -->
      <div
        class="py-3 flex items-center justify-between cursor-pointer"
        @click="expanded = !expanded"
      >
        <div class="flex items-center gap-3">
          <span
            class="inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full"
            :class="hasCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'"
          >
            {{ events.length }}
          </span>
          <span class="text-sm font-medium text-gray-700">
            {{ hasCritical ? 'Critical' : 'Urgent' }} events requiring attention
          </span>
        </div>
        <button class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg
            class="w-5 h-5 transition-transform"
            :class="{ 'rotate-180': expanded }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <!-- Expanded View -->
      <div v-if="expanded" class="pb-4 space-y-2">
        <div
          v-for="(event, index) in events"
          :key="index"
          class="flex items-center justify-between p-3 rounded border cursor-pointer hover:bg-gray-50 transition-colors"
          :class="event.priority === 'critical' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'"
          @click="navigateToRequest(event.requestId)"
        >
          <div class="flex items-center gap-3">
            <span
              class="w-2 h-2 rounded-full"
              :class="event.priority === 'critical' ? 'bg-red-500' : 'bg-amber-500'"
            ></span>
            <div>
              <p class="text-sm font-medium text-gray-900">{{ event.message }}</p>
              <p v-if="event.requestId" class="text-xs text-gray-500">
                Request: {{ event.requestId }}
              </p>
            </div>
          </div>
          <span class="text-xs text-gray-400">
            {{ formatTimestamp(event.timestamp) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getEventBusStatus, type EventBusEvent } from '@/services/myDayWeekService'

const router = useRouter()

const events = ref<EventBusEvent[]>([])
const expanded = ref(false)
const refreshInterval = ref<number | null>(null)

const hasCritical = computed(() => {
  return events.value.some(e => e.priority === 'critical')
})

async function loadEvents() {
  try {
    const status = await getEventBusStatus()
    events.value = status.events
  } catch (err) {
    // Silently fail - status bar is non-critical
    console.error('Failed to load event bus status:', err)
  }
}

function navigateToRequest(requestId: string | null) {
  if (requestId) {
    router.push(`/coi/request/${requestId}`)
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

onMounted(() => {
  loadEvents()
  // Auto-refresh every 30 seconds
  refreshInterval.value = window.setInterval(loadEvents, 30000)
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})
</script>
