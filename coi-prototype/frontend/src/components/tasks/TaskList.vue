<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Priority Items
        </h3>
        <span class="text-sm text-gray-500">{{ items.length }} {{ items.length === 1 ? 'item' : 'items' }}</span>
      </div>
    </div>

    <!-- Task Items -->
    <div v-if="items.length > 0" class="divide-y divide-gray-100">
      <div
        v-for="item in items"
        :key="item.id"
        @click="$emit('navigate', item.id)"
        class="group relative px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
        :class="getItemBorderClass(item)"
      >
        <div class="flex items-start gap-4">
          <!-- Priority Score Badge -->
          <div 
            class="flex-shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center"
            :class="getPriorityBgClass(item)"
          >
            <span class="text-lg font-bold" :class="getPriorityTextClass(item)">
              {{ item.priorityScore || '—' }}
            </span>
            <span v-if="item.priorityLevel" class="text-[9px] font-medium uppercase" :class="getPriorityTextClass(item)">
              {{ item.priorityLevel }}
            </span>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="font-semibold text-gray-900">{{ item.request_id }}</span>
              <StatusBadge :status="item.status" />
              <!-- SLA Status Badge -->
              <SLABadge 
                v-if="item.slaStatus"
                :status="item.slaStatus"
                :hours-remaining="item.slaHoursRemaining || 0"
              />
              <span 
                v-if="item.daysPending > 14 && !item.slaStatus" 
                class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700"
              >
                Overdue
              </span>
            </div>
            <p class="text-sm text-gray-700 mb-1 truncate">{{ item.client_name }}</p>
            <div class="flex items-center gap-2">
              <p class="text-xs text-gray-500">{{ item.actionType }}</p>
              <span v-if="item.priorityFactors?.length" class="text-xs text-gray-400">
                · {{ item.priorityFactors.join(' · ') }}
              </span>
            </div>
          </div>

          <!-- Metadata -->
          <div class="flex-shrink-0 text-right">
            <p v-if="item.slaHoursRemaining !== undefined" class="text-sm font-medium" :class="getSLAColorClass(item)">
              {{ formatTimeRemaining(item.slaHoursRemaining) }}
            </p>
            <p v-else-if="item.daysPending > 0" class="text-sm font-medium" :class="item.daysPending > 14 ? 'text-red-600' : item.daysPending > 7 ? 'text-amber-600' : 'text-gray-600'">
              {{ item.daysPending }}d
            </p>
            <p class="text-xs text-gray-400 mt-1">{{ item.slaHoursRemaining !== undefined ? 'SLA' : 'pending' }}</p>
          </div>

          <!-- Arrow -->
          <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="px-6 py-12 text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
        <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-1">{{ emptyTitle }}</h3>
      <p class="text-sm text-gray-500">{{ emptyMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import StatusBadge from '@/components/ui/StatusBadge.vue'
import SLABadge from '@/components/sla/SLABadge.vue'

interface TaskItem {
  id: number
  request_id: string
  client_name: string
  status: string
  daysPending: number
  actionType: string
  category?: 'action' | 'overdue' | 'expiring'
  priorityScore?: number
  priorityLevel?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  priorityFactors?: string[]
  slaStatus?: 'BREACHED' | 'CRITICAL' | 'WARNING' | 'ON_TRACK'
  slaHoursRemaining?: number
  [key: string]: any
}

defineProps<{
  items: TaskItem[]
  emptyTitle?: string
  emptyMessage?: string
}>()

defineEmits<{
  navigate: [id: number]
}>()

function getItemBorderClass(item: TaskItem): string {
  // Use priority level if available
  if (item.priorityLevel === 'CRITICAL') {
    return 'border-l-4 border-l-red-500'
  }
  if (item.priorityLevel === 'HIGH') {
    return 'border-l-4 border-l-orange-500'
  }
  if (item.priorityLevel === 'MEDIUM') {
    return 'border-l-4 border-l-yellow-500'
  }
  if (item.priorityLevel === 'LOW') {
    return 'border-l-4 border-l-green-500'
  }
  
  // Fallback to old logic
  if (item.daysPending > 14 || item.category === 'overdue') {
    return 'border-l-4 border-l-red-500'
  }
  if (item.daysPending > 7) {
    return 'border-l-4 border-l-amber-500'
  }
  if (item.actionType === 'Expiring' || item.category === 'expiring') {
    return 'border-l-4 border-l-amber-500'
  }
  return 'border-l-4 border-l-transparent'
}

function getPriorityBgClass(item: TaskItem): string {
  if (item.priorityLevel === 'CRITICAL' || item.slaStatus === 'BREACHED') {
    return 'bg-red-50'
  }
  if (item.priorityLevel === 'HIGH' || item.slaStatus === 'CRITICAL') {
    return 'bg-orange-50'
  }
  if (item.priorityLevel === 'MEDIUM' || item.slaStatus === 'WARNING') {
    return 'bg-yellow-50'
  }
  if (item.priorityLevel === 'LOW') {
    return 'bg-green-50'
  }
  return 'bg-blue-50'
}

function getPriorityTextClass(item: TaskItem): string {
  if (item.priorityLevel === 'CRITICAL' || item.slaStatus === 'BREACHED') {
    return 'text-red-600'
  }
  if (item.priorityLevel === 'HIGH' || item.slaStatus === 'CRITICAL') {
    return 'text-orange-600'
  }
  if (item.priorityLevel === 'MEDIUM' || item.slaStatus === 'WARNING') {
    return 'text-yellow-700'
  }
  if (item.priorityLevel === 'LOW') {
    return 'text-green-600'
  }
  return 'text-blue-600'
}

function getSLAColorClass(item: TaskItem): string {
  if (item.slaStatus === 'BREACHED') return 'text-red-600'
  if (item.slaStatus === 'CRITICAL') return 'text-orange-600'
  if (item.slaStatus === 'WARNING') return 'text-yellow-700'
  return 'text-gray-600'
}

function formatTimeRemaining(hours: number): string {
  if (hours < 0) {
    return `${Math.abs(Math.round(hours))}h over`
  }
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`
  }
  if (hours < 24) {
    return `${Math.round(hours)}h`
  }
  const days = Math.floor(hours / 24)
  return `${days}d`
}
</script>
