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
  const edition = ref<'standard' | 'pro'>('standard')
  const features = ref<string[]>([])

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isPro = computed(() => edition.value === 'pro')
  const isStandard = computed(() => edition.value === 'standard')

  async function login(email: string, password: string) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/97269499-42c7-4d24-b1e1-ecb46a2d8414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:23',message:'Frontend login attempt',data:{email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    try {
      const response = await api.post('/auth/login', { email, password })
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/97269499-42c7-4d24-b1e1-ecb46a2d8414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:26',message:'Frontend login response received',data:{userId:response.data.user?.id,role:response.data.user?.role,email:response.data.user?.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      token.value = response.data.token
      user.value = response.data.user
      systemAccess.value = response.data.systemAccess || []
      
      localStorage.setItem('token', token.value)
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      
      // Load edition and features after successful login
      try {
        await loadEdition()
      } catch (editionError) {
        console.warn('Failed to load edition after login:', editionError)
        // Don't fail login if edition loading fails
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/97269499-42c7-4d24-b1e1-ecb46a2d8414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:33',message:'Frontend login success',data:{storedRole:user.value?.role,storedEmail:user.value?.email,edition:edition.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      return { success: true }
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/97269499-42c7-4d24-b1e1-ecb46a2d8414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:35',message:'Frontend login error',data:{error:error.response?.data?.error||'Login failed',status:error.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/97269499-42c7-4d24-b1e1-ecb46a2d8414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:80',message:'loadEdition called',data:{currentEdition:edition.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    try {
      const response = await api.get('/config/features')
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/97269499-42c7-4d24-b1e1-ecb46a2d8414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:83',message:'loadEdition response received',data:{editionFromAPI:response.data.edition,featuresCount:response.data.features?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      edition.value = response.data.edition || 'standard'
      features.value = response.data.features || []
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/97269499-42c7-4d24-b1e1-ecb46a2d8414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:86',message:'loadEdition completed',data:{editionSet:edition.value,isPro:edition.value==='pro'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/97269499-42c7-4d24-b1e1-ecb46a2d8414',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:88',message:'loadEdition error',data:{error:error instanceof Error?error.message:'Unknown error'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error('Error loading edition:', error)
      edition.value = 'standard'
      features.value = []
    }
  }

  async function updateEdition(newEdition: 'standard' | 'pro') {
    try {
      await api.put('/config/edition', { edition: newEdition })
      edition.value = newEdition
      await loadEdition()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to update edition' }
    }
  }

  return {
    user,
    token,
    systemAccess,
    edition,
    features,
    isAuthenticated,
    isPro,
    isStandard,
    login,
    logout,
    checkAuth,
    loadEdition,
    updateEdition
  }
})


