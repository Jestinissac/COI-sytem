<template>
  <span :class="badgeClasses" class="px-2 py-1 text-xs font-semibold rounded-full">
    {{ status }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
  variant?: 'default' | 'outline'
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

const badgeClasses = computed(() => {
  const colors = statusColors[props.status] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' }
  
  if (props.variant === 'outline') {
    return `border ${colors.border} ${colors.text} bg-transparent`
  }
  
  return `${colors.bg} ${colors.text}`
})
</script>

