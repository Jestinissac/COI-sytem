<template>
  <div 
    class="toast pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl shadow-sm border border-gray-200"
    :class="toastClasses"
    style="animation: slideIn 0.3s ease-out;"
  >
    <div class="p-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <span class="text-2xl">{{ icon }}</span>
        </div>
        <div class="ml-3 w-0 flex-1 pt-0.5">
          <p class="text-sm font-medium text-gray-900">
            {{ toast.message }}
          </p>
        </div>
        <div class="ml-4 flex flex-shrink-0">
          <button
            @click="$emit('close')"
            class="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
            :class="closeButtonClasses"
          >
            <span class="sr-only">Close</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Toast } from '@/composables/useToast'

const props = defineProps<{
  toast: Toast
}>()

defineEmits<{
  close: []
}>()

const icon = computed(() => {
  switch (props.toast.type) {
    case 'success':
      return '✓'
    case 'error':
      return '✕'
    case 'warning':
      return '⚠'
    case 'info':
      return 'ℹ'
    default:
      return '✓'
  }
})

const toastClasses = computed(() => {
  switch (props.toast.type) {
    case 'success':
      return 'bg-green-50 border-2 border-green-500'
    case 'error':
      return 'bg-red-50 border-2 border-red-500'
    case 'warning':
      return 'bg-yellow-50 border-2 border-yellow-500'
    case 'info':
      return 'bg-blue-50 border-2 border-blue-500'
    default:
      return 'bg-white border-2 border-gray-200'
  }
})

const closeButtonClasses = computed(() => {
  switch (props.toast.type) {
    case 'success':
      return 'focus:ring-green-500'
    case 'error':
      return 'focus:ring-red-500'
    case 'warning':
      return 'focus:ring-yellow-500'
    case 'info':
      return 'focus:ring-blue-500'
    default:
      return 'focus:ring-gray-500'
  }
})
</script>

<style scoped>
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast {
  will-change: transform, opacity;
}
</style>

