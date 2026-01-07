// Simple toast notification composable
export function useToast() {
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Simple alert for now - can be enhanced with a toast library later
    if (type === 'error') {
      alert(`Error: ${message}`)
    } else if (type === 'success') {
      alert(`Success: ${message}`)
    } else {
      alert(message)
    }
  }

  return {
    success: (message: string) => showToast(message, 'success'),
    error: (message: string) => showToast(message, 'error'),
    info: (message: string) => showToast(message, 'info')
  }
}
