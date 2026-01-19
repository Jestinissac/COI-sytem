<template>
  <div 
    class="text-center py-12"
    role="region"
    :aria-label="title || 'Empty state'"
  >
    <div v-if="icon" class="mb-4" aria-hidden="true">
      <component v-if="typeof icon !== 'string'" :is="icon" class="w-16 h-16 mx-auto text-gray-300" />
      <span v-else class="text-6xl block">{{ icon }}</span>
    </div>
    <h3 v-if="title" class="text-lg font-medium text-gray-900 mb-2">{{ title }}</h3>
    <p v-if="message" class="text-sm text-gray-500 mb-6 max-w-md mx-auto">{{ message }}</p>
    <div v-if="action" class="flex justify-center gap-3">
      <router-link
        v-if="action.to"
        :to="action.to"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        :aria-label="action.label"
      >
        <svg v-if="action.showIcon !== false" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        {{ action.label }}
      </router-link>
      <button
        v-else-if="action.onClick"
        @click="action.onClick"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        :aria-label="action.label"
      >
        <svg v-if="action.showIcon !== false" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        {{ action.label }}
      </button>
    </div>
    
    <!-- Secondary action -->
    <div v-if="secondaryAction" class="mt-4">
      <button
        v-if="secondaryAction.onClick"
        @click="secondaryAction.onClick"
        class="text-sm text-gray-500 hover:text-gray-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        :aria-label="secondaryAction.label"
      >
        {{ secondaryAction.label }}
      </button>
      <router-link
        v-else-if="secondaryAction.to"
        :to="secondaryAction.to"
        class="text-sm text-gray-500 hover:text-gray-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        :aria-label="secondaryAction.label"
      >
        {{ secondaryAction.label }}
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon?: any
  title?: string
  message?: string
  action?: {
    label: string
    to?: string
    onClick?: () => void
    showIcon?: boolean
  }
  secondaryAction?: {
    label: string
    to?: string
    onClick?: () => void
  }
}>()
</script>
