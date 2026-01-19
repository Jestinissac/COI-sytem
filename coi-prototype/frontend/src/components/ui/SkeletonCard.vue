<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
    <div class="flex items-center space-x-4 mb-4">
      <div class="skeleton rounded-full h-12 w-12"></div>
      <div class="flex-1 space-y-2 py-1">
        <div class="skeleton h-4 rounded w-3/4"></div>
        <div class="skeleton h-3 rounded w-1/2"></div>
      </div>
    </div>
    <div v-if="showContent" class="space-y-2">
      <div class="skeleton h-3 rounded w-full"></div>
      <div class="skeleton h-3 rounded w-5/6"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  showContent?: boolean
}>(), {
  showContent: true
})
</script>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #e0e0e0 20%,
    #f0f0f0 40%,
    #f0f0f0 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}
</style>
