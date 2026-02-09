import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export interface User {
  id: number
  email: string
  name: string
  role: 'Requester' | 'Director' | 'Compliance' | 'Partner' | 'Finance' | 'Admin' | 'Super Admin'
  department: 'Audit' | 'Tax' | 'Advisory' | 'Accounting' | 'Other'
  line_of_service?: string
  director_id?: number
  system_access: string[]
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const systemAccess = ref<string[]>([])
  const edition = ref<'standard' | 'pro'>('standard')
  const features = ref<string[]>([])

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  // CMA + IESBA only: always Pro
  const isPro = computed(() => true)
  const isStandard = computed(() => edition.value === 'standard')

  async function login(email: string, password: string) {
    try {
      const response = await api.post('/auth/login', { email, password })
      
      // Store both access and refresh tokens
      token.value = response.data.token || response.data.accessToken
      refreshToken.value = response.data.refreshToken
      user.value = response.data.user
      systemAccess.value = response.data.systemAccess || []
      
      if (token.value) localStorage.setItem('token', token.value)
      if (refreshToken.value) localStorage.setItem('refreshToken', refreshToken.value)
      if (token.value) api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      
      // Load edition and features after successful login
      try {
        await loadEdition()
      } catch (editionError) {
        console.warn('Failed to load edition after login:', editionError)
        // Don't fail login if edition loading fails
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Login failed' }
    }
  }

  async function logout() {
    // Call backend to revoke refresh token
    try {
      if (refreshToken.value) {
        await api.post('/auth/logout', { refreshToken: refreshToken.value })
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
      // Continue with local logout even if API call fails
    }
    
    // Clear local state
    user.value = null
    token.value = null
    refreshToken.value = null
    systemAccess.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    delete api.defaults.headers.common['Authorization']
  }

  async function refreshAccessToken() {
    if (!refreshToken.value) {
      logout()
      return { success: false, error: 'No refresh token available' }
    }

    try {
      // Don't include Authorization header for refresh request
      const currentAuth = api.defaults.headers.common['Authorization']
      delete api.defaults.headers.common['Authorization']
      
      const response = await api.post('/auth/refresh', { refreshToken: refreshToken.value })
      
      // Update tokens with new ones (token rotation)
      token.value = response.data.token || response.data.accessToken
      refreshToken.value = response.data.refreshToken
      user.value = response.data.user
      systemAccess.value = response.data.systemAccess || []
      
      if (token.value) localStorage.setItem('token', token.value)
      if (refreshToken.value) localStorage.setItem('refreshToken', refreshToken.value)
      if (token.value) api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      
      if (import.meta.env?.DEV) console.log('Token refreshed successfully')
      return { success: true }
    } catch (error: any) {
      console.error('Token refresh failed:', error.response?.data || error)
      logout()
      return { success: false, error: error.response?.data?.error || 'Token refresh failed' }
    }
  }

  async function checkAuth() {
    if (token.value) {
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
        const response = await api.get('/auth/me')
        user.value = response.data.user
        systemAccess.value = response.data.systemAccess || []
        await loadEdition()
        return true
      } catch (error) {
        logout()
        return false
      }
    }
    return false
  }

  async function loadEdition() {
    try {
      const response = await api.get('/config/features')
      edition.value = response.data.edition || 'standard'
      features.value = response.data.features || []
    } catch (error) {
      console.error('Error loading edition:', error)
      edition.value = 'standard'
      features.value = []
    }
  }

  async function updateEdition(newEdition: 'standard' | 'pro') {
    try {
      const response = await api.put('/config/edition', { edition: newEdition })
      // Use the edition from the API response to ensure consistency
      const updatedEdition = response.data?.edition || newEdition
      
      // Set edition immediately to ensure UI updates
      edition.value = updatedEdition
      
      // Reload features to ensure they match the new edition
      // Use a small delay to ensure database update is complete
      await new Promise(resolve => setTimeout(resolve, 50))
      await loadEdition()
      
      // Ensure edition value is preserved after loadEdition
      // (loadEdition should get the updated value, but ensure it matches)
      if (edition.value !== updatedEdition) {
        console.warn(`Edition mismatch after load: expected ${updatedEdition}, got ${edition.value}. Correcting...`)
        edition.value = updatedEdition
      }
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to update edition' }
    }
  }

  return {
    user,
    token,
    refreshToken,
    systemAccess,
    edition,
    features,
    isAuthenticated,
    isPro,
    isStandard,
    login,
    logout,
    refreshAccessToken,
    checkAuth,
    loadEdition,
    updateEdition
  }
})


