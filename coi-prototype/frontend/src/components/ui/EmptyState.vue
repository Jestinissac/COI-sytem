<template>
  <div class="text-center py-12">
    <div v-if="icon" class="mb-4">
      <component :is="icon" class="w-16 h-16 mx-auto text-gray-300" />
    </div>
    <h3 v-if="title" class="text-lg font-medium text-gray-900 mb-2">{{ title }}</h3>
    <p v-if="message" class="text-sm text-gray-500 mb-6 max-w-md mx-auto">{{ message }}</p>
    <div v-if="action" class="flex justify-center gap-3">
      <router-link
        v-if="action.to"
        :to="action.to"
        class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
      >
        {{ action.label }}
      </router-link>
      <button
        v-else-if="action.onClick"
        @click="action.onClick"
        class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
      >
        {{ action.label }}
      </button>
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
  }
}>()
</script>
