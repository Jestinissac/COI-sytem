<template>
  <div class="min-h-screen flex items-center justify-center bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920');">
    <div class="absolute inset-0 bg-black/30"></div>
    
    <div class="relative z-10 w-full max-w-2xl mx-4">
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
      <div class="bg-white rounded-lg shadow-xl p-8 max-w-2xl">
        <!-- Environment Info (Read-only) -->
        <div v-if="environment" class="mb-4 p-2 rounded-lg text-xs text-center" :class="{
          'bg-red-50 text-red-700 border border-red-200': environment === 'production',
          'bg-orange-50 text-orange-700 border border-orange-200': environment === 'staging',
          'bg-blue-50 text-blue-700 border border-blue-200': environment === 'development',
          'bg-purple-50 text-purple-700 border border-purple-200': environment === 'test'
        }">
          <span class="font-medium">{{ environment.toUpperCase() }} Environment</span>
        </div>

        <!-- Default: Role grid -->
        <template v-if="!showAdvancedLogin">
          <h2 class="text-xl font-semibold text-gray-900 text-center mb-1">COI System Demo</h2>
          <p class="text-sm text-gray-600 text-center mb-6">Select a role to sign in.</p>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <button
              v-for="(user, index) in demoUsers"
              :key="index"
              type="button"
              :aria-label="'Sign in as ' + user.role"
              @click="loginAs(user)"
              :disabled="loading"
              class="role-card text-left px-4 py-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none"
            >
              <div class="font-medium text-gray-900">{{ user.role }}</div>
              <div class="text-xs text-gray-500 mt-0.5">{{ user.department }}</div>
              <div class="text-xs text-gray-400 mt-1">{{ user.description }}</div>
            </button>
          </div>
        </template>

        <!-- Error (shown for both grid and form) -->
        <div v-if="error" class="text-red-600 text-sm text-center mb-4">
          {{ error }}
        </div>

        <!-- Advanced Login toggle -->
        <div class="text-center">
          <button
            type="button"
            @click="showAdvancedLogin = !showAdvancedLogin"
            class="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:underline"
          >
            {{ showAdvancedLogin ? 'Hide Advanced Login' : 'Advanced Login' }}
          </button>
        </div>

        <!-- Advanced Login form -->
        <div v-if="showAdvancedLogin" class="mt-6 pt-6 border-t border-gray-200">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Sign in with email</h3>
          <form @submit.prevent="handleLogin" class="space-y-4">
            <div>
              <input
                v-model="email"
                type="email"
                placeholder="Email address"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <input
                v-model="password"
                type="password"
                placeholder="Password"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              :disabled="loading"
              class="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>
          <p class="text-xs text-gray-500 text-center mt-3">Demo users: password is <strong>password</strong></p>

          <!-- Test Environment Quick Login (Only shown in test environment) -->
          <div v-if="environment === 'test'" class="mt-4 pt-4 border-t border-gray-100">
            <p class="text-xs text-gray-500 text-center mb-2">Test Environment Quick Login</p>
            <button
              type="button"
              @click="fillTestLogin"
              class="w-full px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Login as Test User
            </button>
            <p class="text-xs text-gray-400 text-center mt-2">test@example.com / test123</p>
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

const DEMO_PASSWORD = 'password'
const demoUsers = [
  { role: 'Requester', email: 'patricia.white@company.com', department: 'Audit', description: 'Submit COI requests' },
  { role: 'Director', email: 'john.smith@company.com', department: 'Audit', description: 'Approve team requests' },
  { role: 'Compliance', email: 'emily.davis@company.com', department: 'Audit', description: 'Review regulations' },
  { role: 'Partner', email: 'robert.taylor@company.com', department: 'Audit', description: 'Final approval' },
  { role: 'Finance', email: 'lisa.thomas@company.com', department: 'Audit', description: 'Generate engagement codes' },
  { role: 'Admin', email: 'james.jackson@company.com', department: 'Audit', description: 'Execute and manage' },
  { role: 'Super Admin', email: 'admin@company.com', department: 'Other', description: 'System configuration' }
]

const routes: Record<string, string> = {
  'Requester': '/coi/requester',
  'Director': '/coi/director',
  'Compliance': '/coi/compliance',
  'Partner': '/coi/partner',
  'Finance': '/coi/finance',
  'Admin': '/coi/admin',
  'Super Admin': '/coi/super-admin'
}

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showAdvancedLogin = ref(false)
const environment = ref<string | null>(null)

// Fetch environment from backend on mount
onMounted(async () => {
  try {
    const response = await api.get('/health')
    environment.value = response.data.environment || 'development'
  } catch (_error) {
    environment.value = 'development'
  }
})

async function loginAs(user: { email: string; role: string }) {
  loading.value = true
  error.value = ''
  try {
    const result = await authStore.login(user.email, DEMO_PASSWORD)
    if (!result.success) {
      error.value = result.error === 'Login failed'
        ? 'Cannot reach server. Is the backend running on port 3000?'
        : (result.error || 'Invalid credentials')
      return
    }
    if (!authStore.user) {
      error.value = 'Login succeeded but user data is missing. Please try again.'
      return
    }
    const targetRoute = routes[user.role]
    if (targetRoute) {
      router.push(targetRoute)
    } else {
      error.value = 'Role not found.'
    }
  } catch (e: any) {
    error.value = e?.response?.data?.error || e?.message || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    const result = await authStore.login(email.value, password.value)
    if (!result.success) {
      error.value = result.error === 'Login failed'
        ? 'Cannot reach server. Is the backend running on port 3000?'
        : (result.error || 'Invalid credentials')
      return
    }
    if (!authStore.user) {
      error.value = 'Login succeeded but user data is missing. Please try again.'
      return
    }
    const targetRoute = routes[authStore.user.role] || '/coi/requester'
    router.push(targetRoute)
  } catch (e: any) {
    console.error('Login error:', e)
    error.value = e?.response?.data?.error || e?.message || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}

function fillTestLogin() {
  email.value = 'test@example.com'
  password.value = 'test123'
}
</script>
