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
  const systemAccess = ref<string[]>([])

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  async function login(email: string, password: string) {
    try {
      const response = await api.post('/auth/login', { email, password })
      token.value = response.data.token
      user.value = response.data.user
      systemAccess.value = response.data.systemAccess || []
      
      localStorage.setItem('token', token.value)
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Login failed' }
    }
  }

  function logout() {
    user.value = null
    token.value = null
    systemAccess.value = []
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
  }

  async function checkAuth() {
    if (token.value) {
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
        const response = await api.get('/auth/me')
        user.value = response.data.user
        systemAccess.value = response.data.systemAccess || []
        return true
      } catch (error) {
        logout()
        return false
      }
    }
    return false
  }

  return {
    user,
    token,
    systemAccess,
    isAuthenticated,
    login,
    logout,
    checkAuth
  }
})


