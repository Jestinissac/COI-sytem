<template>
  <div 
    class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
    style="max-width: 420px;"
  >
    <TransitionGroup name="toast-list">
      <Toast
        v-for="toast in toasts"
        :key="toast.id"
        :toast="toast"
        @close="removeToast(toast.id)"
      />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '@/stores/toast'
import Toast from './Toast.vue'

const { toasts, removeToast } = useToastStore()
</script>

<style scoped>
.toast-list-enter-active {
  transition: all 0.3s ease-out;
}

.toast-list-leave-active {
  transition: all 0.2s ease-in;
}

.toast-list-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-list-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.toast-list-move {
  transition: transform 0.3s ease;
}
</style>

