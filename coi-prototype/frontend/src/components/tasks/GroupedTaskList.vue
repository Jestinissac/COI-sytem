<template>
  <div class="space-y-4">
    <!-- Grouped Items -->
    <div
      v-for="(items, dateKey) in groupedItems"
      :key="dateKey"
      class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
    >
      <!-- Date Header -->
      <div class="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-gray-900">{{ dateKey }}</h3>
          </div>
          <span class="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
            {{ items.length }} {{ items.length === 1 ? 'item' : 'items' }}
          </span>
        </div>
      </div>

      <!-- Task Items -->
      <div class="divide-y divide-gray-100">
        <div
          v-for="item in items"
          :key="item.id"
          @click="$emit('navigate', item.id)"
          class="group relative px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
          :class="getPriorityClass(item)"
        >
          <div class="flex items-start gap-4">
            <!-- Priority Indicator -->
            <div 
              class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
              :class="getPriorityBgClass(item)"
            >
              <svg v-if="item.daysPending > 14" class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <svg v-else-if="item.actionType === 'Expiring'" class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <svg v-else class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-1">
                <span class="font-semibold text-gray-900">{{ item.request_id }}</span>
                <StatusBadge :status="item.status" />
                <span 
                  v-if="item.daysPending > 14" 
                  class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700"
                >
                  Overdue
                </span>
              </div>
              <p class="text-sm text-gray-700 mb-1 truncate">{{ item.client_name }}</p>
              <p class="text-xs text-gray-500">{{ item.actionType }}</p>
            </div>

            <!-- Metadata -->
            <div class="flex-shrink-0 text-right">
              <p v-if="item.dueDate" class="text-sm text-gray-600">{{ item.dueDate }}</p>
              <p v-if="item.expiryDate" class="text-sm text-amber-600">{{ item.expiryDate }}</p>
              <p v-if="item.daysPending > 0" class="text-xs text-gray-400 mt-1">
                {{ item.daysPending }} {{ item.daysPending === 1 ? 'day' : 'days' }} pending
              </p>
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
    </div>

    <!-- Empty State -->
    <div v-if="Object.keys(groupedItems).length === 0" class="bg-white rounded-lg border border-gray-200 shadow-sm px-6 py-12 text-center">
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

interface TaskItem {
  id: number
  request_id: string
  client_name: string
  status: string
  daysPending: number
  actionType: string
  dueDate?: string
  expiryDate?: string
  [key: string]: any
}

defineProps<{
  groupedItems: Record<string, TaskItem[]>
  emptyTitle?: string
  emptyMessage?: string
}>()

defineEmits<{
  navigate: [id: number]
}>()

function getPriorityClass(item: TaskItem): string {
  if (item.daysPending > 14) {
    return 'border-l-4 border-l-red-500'
  }
  if (item.daysPending > 7) {
    return 'border-l-4 border-l-amber-500'
  }
  if (item.actionType === 'Expiring') {
    return 'border-l-4 border-l-amber-500'
  }
  return 'border-l-4 border-l-transparent'
}

function getPriorityBgClass(item: TaskItem): string {
  if (item.daysPending > 14) {
    return 'bg-red-50'
  }
  if (item.actionType === 'Expiring') {
    return 'bg-amber-50'
  }
  return 'bg-blue-50'
}
</script>
