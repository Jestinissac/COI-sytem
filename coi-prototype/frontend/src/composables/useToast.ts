import { useToastStore } from '@/stores/toast'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

// Toast notification composable
export function useToast() {
  const { toasts, addToast, removeToast } = useToastStore()

  return {
    toasts,
    success: (message: string, duration = 5000) => addToast(message, 'success', duration),
    error: (message: string, duration = 7000) => addToast(message, 'error', duration),
    warning: (message: string, duration = 6000) => addToast(message, 'warning', duration),
    info: (message: string, duration = 5000) => addToast(message, 'info', duration),
    remove: removeToast
  }
}
