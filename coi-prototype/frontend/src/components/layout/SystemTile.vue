<template>
  <div
    @click="$emit('click')"
    class="bg-white rounded border border-gray-200 p-6 cursor-pointer hover:border-gray-400 transition-colors"
  >
    <div class="text-center">
      <div class="w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <span class="text-4xl">{{ system.icon }}</span>
      </div>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">
        {{ system.label }}
      </h3>
      <p class="text-gray-500 text-sm font-medium">Click to access →</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  system: {
    name: string
    label: string
    icon: string
    route: string
  }
}>()

defineEmits<{
  click: []
}>()
</script>

