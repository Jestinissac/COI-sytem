import { ref } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

const toasts = ref<Toast[]>([])

export function useToastStore() {
  const addToast = (message: string, type: Toast['type'] = 'info', duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const toast: Toast = { id, message, type, duration }
    toasts.value.push(toast)
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    
    return id
  }
  
  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  const clearAll = () => {
    toasts.value = []
  }
  
  return {
    toasts,
    addToast,
    removeToast,
    clearAll
  }
}
