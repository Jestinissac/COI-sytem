<template>
  <div class="min-h-screen flex items-center justify-center bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920');">
    <div class="absolute inset-0 bg-black/30"></div>
    
    <div class="relative z-10 w-full max-w-md mx-4">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 text-white">
          <svg class="w-12 h-12" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="3"/>
            <path d="M16 24h16M24 16v16" stroke="currentColor" stroke-width="3"/>
          </svg>
          <div class="text-left">
            <div class="text-2xl font-bold tracking-wide">ENVISION</div>
            <div class="text-xs tracking-widest text-blue-200">EMPOWERING FUTURE</div>
          </div>
        </div>
      </div>

      <!-- Login Card -->
      <div class="bg-white rounded-lg shadow-xl p-8">
        <h2 class="text-xl font-semibold text-gray-900 text-center mb-6">SIGN IN</h2>
        
        <!-- Environment Info (Read-only) -->
        <div v-if="environment" class="mb-4 p-2 rounded-lg text-xs text-center" :class="{
          'bg-red-50 text-red-700 border border-red-200': environment === 'production',
          'bg-orange-50 text-orange-700 border border-orange-200': environment === 'staging',
          'bg-blue-50 text-blue-700 border border-blue-200': environment === 'development',
          'bg-purple-50 text-purple-700 border border-purple-200': environment === 'test'
        }">
          <span class="font-medium">{{ environment.toUpperCase() }} Environment</span>
        </div>
        
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <input
              v-model="email"
              type="email"
              placeholder="Email address"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <input
              v-model="password"
              type="password"
              placeholder="Password"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div v-if="error" class="text-red-600 text-sm text-center">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <!-- Test Environment Quick Login (Only shown in test environment) -->
        <div v-if="environment === 'test'" class="mt-6 pt-6 border-t">
          <p class="text-xs text-gray-500 text-center mb-3">Test Environment Quick Login</p>
          <button
            @click="fillTestLogin"
            class="w-full px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Login as Test User
          </button>
          <p class="text-xs text-gray-400 text-center mt-2">test@example.com / test123</p>
        </div>

        <!-- Demo Users -->
        <div class="mt-6 pt-6 border-t">
          <p class="text-xs text-gray-500 text-center mb-3">Demo Users (password: password)</p>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <button @click="fillDemo('patricia.white@company.com')" class="px-2 py-1.5 border rounded hover:bg-gray-50 text-left">
              <span class="font-medium">Requester</span>
              <span class="text-gray-400 block truncate">patricia.white@company.com</span>
            </button>
            <button @click="fillDemo('john.smith@company.com')" class="px-2 py-1.5 border rounded hover:bg-gray-50 text-left">
              <span class="font-medium">Director</span>
              <span class="text-gray-400 block truncate">john.smith@company.com</span>
            </button>
            <button @click="fillDemo('emily.davis@company.com')" class="px-2 py-1.5 border rounded hover:bg-gray-50 text-left">
              <span class="font-medium">Compliance</span>
              <span class="text-gray-400 block truncate">emily.davis@company.com</span>
            </button>
            <button @click="fillDemo('robert.taylor@company.com')" class="px-2 py-1.5 border rounded hover:bg-gray-50 text-left">
              <span class="font-medium">Partner</span>
              <span class="text-gray-400 block truncate">robert.taylor@company.com</span>
            </button>
            <button @click="fillDemo('lisa.thomas@company.com')" class="px-2 py-1.5 border rounded hover:bg-gray-50 text-left">
              <span class="font-medium">Finance</span>
              <span class="text-gray-400 block truncate">lisa.thomas@company.com</span>
            </button>
            <button @click="fillDemo('james.jackson@company.com')" class="px-2 py-1.5 border rounded hover:bg-gray-50 text-left">
              <span class="font-medium">Admin</span>
              <span class="text-gray-400 block truncate">james.jackson@company.com</span>
            </button>
            <button @click="fillDemo('admin@company.com')" class="px-2 py-1.5 border rounded hover:bg-gray-50 text-left">
              <span class="font-medium">Super Admin</span>
              <span class="text-gray-400 block truncate">admin@company.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const environment = ref<string | null>(null)

// Fetch environment from backend on mount
onMounted(async () => {
  try {
    const response = await api.get('/health')
    environment.value = response.data.environment || 'development'
  } catch (error) {
    // If health endpoint doesn't exist, default to development
    environment.value = 'development'
  }
})

async function handleLogin() {
  loading.value = true
  error.value = ''
  
  try {
    const result = await authStore.login(email.value, password.value)
    
    if (!result.success) {
      error.value = result.error === 'Login failed'
        ? 'Cannot reach server. Is the backend running on port 3000?'
        : (result.error || 'Invalid credentials')
      loading.value = false
      return
    }
    
    // Ensure user data is available
    if (!authStore.user) {
      error.value = 'Login succeeded but user data is missing. Please try again.'
      loading.value = false
      return
    }
    
    // Route based on role
    const role = authStore.user.role
    const routes: Record<string, string> = {
      'Requester': '/coi/requester',
      'Director': '/coi/director',
      'Compliance': '/coi/compliance',
      'Partner': '/coi/partner',
      'Finance': '/coi/finance',
      'Admin': '/coi/admin',
      'Super Admin': '/coi/super-admin'
    }
    const targetRoute = routes[role] || '/coi/requester'
    
    router.push(targetRoute)
  } catch (e: any) {
    console.error('Login error:', e)
    error.value = e.response?.data?.error || e.message || 'Login failed. Please check your credentials and try again.'
  } finally {
    loading.value = false
  }
}

function fillDemo(demoEmail: string) {
  email.value = demoEmail
  password.value = 'password'
}

function fillTestLogin() {
  email.value = 'test@example.com'
  password.value = 'test123'
}
</script>
