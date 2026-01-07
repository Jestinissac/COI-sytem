<template>
  <div
    @click="$emit('click')"
    class="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8 cursor-pointer hover:shadow-2xl hover:border-primary-300 transition-all transform hover:-translate-y-2 group"
  >
    <div class="text-center">
      <div class="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:from-primary-200 group-hover:to-primary-300 transition-all">
        <span class="text-4xl">{{ system.icon }}</span>
      </div>
      <h3 class="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
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

