<template>
  <div v-if="activeFilters.length > 0" class="flex flex-wrap items-center gap-2 mb-4">
    <span class="text-sm font-medium text-gray-700">Active Filters:</span>
    <span
      v-for="filter in activeFilters"
      :key="filter.key"
      class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
    >
      <span>{{ filter.label }}: {{ filter.value }}</span>
      <button
        @click="removeFilter(filter.key)"
        class="text-blue-600 hover:text-blue-800"
        :aria-label="`Remove ${filter.label} filter`"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </span>
    <button
      @click="clearAll"
      class="text-sm text-gray-600 hover:text-gray-800 underline"
      aria-label="Clear all filters"
    >
      Clear All
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Filter {
  key: string
  label: string
  value: string | number
}

interface Props {
  filters: Record<string, any>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'remove-filter': [key: string]
  'clear-all': []
}>()

const activeFilters = computed(() => {
  const filters: Filter[] = []
  
  if (props.filters.dateFrom) {
    filters.push({ key: 'dateFrom', label: 'From Date', value: props.filters.dateFrom })
  }
  if (props.filters.dateTo) {
    filters.push({ key: 'dateTo', label: 'To Date', value: props.filters.dateTo })
  }
  if (props.filters.status) {
    filters.push({ key: 'status', label: 'Status', value: props.filters.status })
  }
  if (props.filters.serviceType) {
    filters.push({ key: 'serviceType', label: 'Service Type', value: props.filters.serviceType })
  }
  if (props.filters.clientId) {
    filters.push({ key: 'clientId', label: 'Client', value: props.filters.clientId })
  }
  
  return filters
})

function removeFilter(key: string) {
  emit('remove-filter', key)
}

function clearAll() {
  emit('clear-all')
}
</script>
