<template>
  <div v-if="needRefresh" class="fixed bottom-4 right-4 z-[9999] max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4">
    <div class="flex items-start gap-3">
      <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
        <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-900">Update available</p>
        <p class="text-xs text-gray-500 mt-0.5">A new version of COI System is ready.</p>
        <div class="flex gap-2 mt-3">
          <button
            @click="updateServiceWorker()"
            class="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Update now
          </button>
          <button
            @click="close()"
            class="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'

const {
  needRefresh,
  updateServiceWorker,
} = useRegisterSW({
  onRegisteredSW(_swUrl: string, registration: ServiceWorkerRegistration | undefined) {
    if (registration) {
      setInterval(() => { registration.update() }, 60 * 60 * 1000)
    }
  },
})

function close() {
  needRefresh.value = false
}
</script>
