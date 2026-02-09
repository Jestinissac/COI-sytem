<template>
  <span 
    :class="badgeClasses" 
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
    role="status"
    :aria-label="`Status: ${status}`"
  >
    <svg v-if="statusIcon" :class="iconClasses" class="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path :fill-rule="(statusIcon.fillRule ?? 'inherit') as 'inherit' | 'evenodd' | 'nonzero'" :d="statusIcon.path" :clip-rule="(statusIcon.clipRule ?? 'inherit') as 'inherit' | 'evenodd' | 'nonzero'" />
    </svg>
    <span>{{ status }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
  variant?: 'default' | 'outline'
  showIcon?: boolean
}>()

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  // Request statuses
  'Draft': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
  'Pending Director Approval': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  'Pending Compliance': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  'Pending Partner': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  'Pending Finance': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
  'Approved': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  'Active': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  'Rejected': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  'Completed': { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' },
  
  // Client statuses
  'Inactive': { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
  'Potential': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  
  // Risk levels
  'Low': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  'Medium': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  'High': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  
  // Duplication check
  'Clear': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  'Flag': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  'Block': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  'Needs Review': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
}

// Icons for accessibility (WCAG compliant)
const statusIcons: Record<string, { path: string; fillRule?: string; clipRule?: string }> = {
  'Approved': {
    path: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
    fillRule: 'evenodd',
    clipRule: 'evenodd'
  },
  'Active': {
    path: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
    fillRule: 'evenodd',
    clipRule: 'evenodd'
  },
  'Rejected': {
    path: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z',
    fillRule: 'evenodd',
    clipRule: 'evenodd'
  },
  'Pending Director Approval': {
    path: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z',
    fillRule: 'evenodd',
    clipRule: 'evenodd'
  },
  'Pending Compliance': {
    path: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z',
    fillRule: 'evenodd',
    clipRule: 'evenodd'
  },
  'Pending Partner': {
    path: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z',
    fillRule: 'evenodd',
    clipRule: 'evenodd'
  },
  'Pending Finance': {
    path: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z',
    fillRule: 'evenodd',
    clipRule: 'evenodd'
  },
  'Draft': {
    path: 'M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z',
    fillRule: 'evenodd',
    clipRule: 'evenodd'
  },
  'Completed': {
    path: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
    fillRule: 'evenodd',
    clipRule: 'evenodd'
  },
  'Clear': {
    path: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
    fillRule: 'evenodd',
    clipRule: 'evenodd'
  },
  'Flag': {
    path: 'M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z',
    fillRule: 'evenodd',
    clipRule: 'evenodd'
  },
  'Block': {
    path: 'M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z',
    fillRule: 'evenodd',
    clipRule: 'evenodd'
  },
}

const statusIcon = computed(() => {
  if (props.showIcon === false) return null
  return statusIcons[props.status] || null
})

const iconClasses = computed(() => {
  const colors = statusColors[props.status] || { text: 'text-gray-800' }
  return colors.text
})

const badgeClasses = computed(() => {
  const colors = statusColors[props.status] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' }
  
  if (props.variant === 'outline') {
    return `border ${colors.border} ${colors.text} bg-transparent`
  }
  
  return `${colors.bg} ${colors.text}`
})
</script>

