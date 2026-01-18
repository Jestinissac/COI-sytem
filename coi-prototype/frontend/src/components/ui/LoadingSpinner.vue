<template>
  <div :class="containerClass">
    <svg 
      class="animate-spin text-blue-600" 
      :class="spinnerSize"
      fill="none" 
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span v-if="message" :class="messageClass">{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
  message?: string
  fullScreen?: boolean
  center?: boolean
}>(), {
  size: 'md',
  fullScreen: false,
  center: true
})

const spinnerSize = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-4 w-4'
    case 'lg':
      return 'h-8 w-8'
    default:
      return 'h-5 w-5'
  }
})

const containerClass = computed(() => {
  const base = 'flex items-center'
  const alignment = props.center ? 'justify-center' : ''
  const spacing = props.message ? 'gap-2' : ''
  const full = props.fullScreen ? 'min-h-screen' : 'py-12'
  return `${base} ${alignment} ${spacing} ${full}`
})

const messageClass = computed(() => {
  const base = 'text-gray-500'
  const size = props.size === 'sm' ? 'text-xs' : props.size === 'lg' ? 'text-base' : 'text-sm'
  return `${base} ${size}`
})
</script>
