// Simple toast notification composable
export function useToast() {
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    // Simple alert for now - can be enhanced with a toast library later
    if (type === 'error') {
      alert(`Error: ${message}`)
    } else if (type === 'success') {
      alert(`Success: ${message}`)
    } else if (type === 'warning') {
      alert(`Warning: ${message}`)
    } else {
      alert(message)
    }
  }

  return {
    success: (message: string) => showToast(message, 'success'),
    error: (message: string) => showToast(message, 'error'),
    warning: (message: string) => showToast(message, 'warning'),
    info: (message: string) => showToast(message, 'info')
  }
}
