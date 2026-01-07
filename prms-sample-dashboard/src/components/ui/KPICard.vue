<template>
  <div :class="wrapperClass" class="border rounded-xl px-4 py-3">
    <div class="flex items-start justify-between gap-3">
      <div>
        <div class="text-sm text-gray-500">{{ title }}</div>
        <div class="mt-1 flex items-baseline gap-2">
          <div class="text-3xl font-bold">{{ formattedValue }}</div>
          <div v-if="trend !== undefined" :class="trend >= 0 ? 'text-green-600' : 'text-red-600'" class="text-xs font-medium">
            <span v-if="trend >= 0">▲</span>
            <span v-else>▼</span>
            {{ Math.abs(trend) }}%
          </div>
        </div>
        <div v-if="subtitle" class="text-xs text-gray-400 mt-1">{{ subtitle }}</div>
      </div>
      <button v-if="clickable" class="text-xs text-blue-600 hover:text-blue-800">View</button>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  value: number | string
  subtitle?: string
  trend?: number
  status?: 'success' | 'warning' | 'default'
  format?: 'currency' | 'number' | 'raw'
  unit?: string
  clickable?: boolean
}

const props = defineProps<Props>()

const formattedValue = computed(() => {
  if (typeof props.value === 'string') return props.value
  if (props.format === 'currency') {
    const val = typeof props.value === 'number' ? props.value : Number(props.value)
    return new Intl.NumberFormat('en-KW', { style: 'currency', currency: props.unit === 'KWD' ? 'KWD' : 'KWD', maximumFractionDigits: 0 }).format(val)
  }
  if (props.format === 'number') {
    return new Intl.NumberFormat('en-US').format(Number(props.value))
  }
  return String(props.value)
})

const wrapperClass = computed(() => {
  if (props.status === 'success') return 'bg-green-50 border-green-200'
  if (props.status === 'warning') return 'bg-yellow-50 border-yellow-200'
  return 'bg-white border-gray-200'
})
</script>


