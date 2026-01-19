<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="text-center mb-12">
        <div class="inline-block mb-4">
          <div class="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-xl mx-auto">
            <span class="text-4xl">🏢</span>
          </div>
        </div>
        <h1 class="text-5xl font-bold text-gray-900 mb-3">Envision Systems</h1>
        <p class="text-xl text-gray-600 mb-1">Welcome back, <span class="font-semibold text-primary-600">{{ authStore.user?.name }}</span></p>
        <p class="text-sm text-gray-500">{{ authStore.user?.role }} - {{ authStore.user?.department }}</p>
      </div>

      <div v-if="availableSystems.length === 0" class="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-200">
        <p class="text-gray-600">No systems available. Please contact your administrator.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <SystemTile
          v-for="system in availableSystems"
          :key="system.name"
          :system="system"
          @click="navigateToSystem(system.name)"
        />
      </div>

      <div class="text-center">
        <button
          @click="handleLogout"
          class="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 transition-all"
        >
          Logout
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import SystemTile from '@/components/layout/SystemTile.vue'

const router = useRouter()
const authStore = useAuthStore()
const { info } = useToast()

const systems = [
  { name: 'HRMS', label: 'Envision HR System', icon: '👥', route: '/hrms' },
  { name: 'PRMS', label: 'Envision PRMS', icon: '📊', route: '/prms' },
  { name: 'COI', label: 'COI System', icon: '✅', route: '/coi' },
]

const availableSystems = computed(() => {
  return systems.filter(system => 
    authStore.systemAccess.includes(system.name) || 
    authStore.user?.role === 'Super Admin'
  )
})


function navigateToSystem(systemName: string) {
  const system = systems.find(s => s.name === systemName)
  if (system) {
    if (systemName === 'COI') {
      router.push('/coi')
    } else {
      // Mock navigation for other systems
      info(`${system.label} - Coming soon in production version`)
    }
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

