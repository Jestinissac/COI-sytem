<template>
  <div class="min-h-screen bg-slate-100">
    <!-- Top Header - Dark Blue -->
    <header class="bg-[#1e3a8a] text-white">
      <div class="flex items-center justify-between px-6 h-14">
        <!-- Logo & Title -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <svg class="w-8 h-8" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2"/>
              <path d="M10 16h12M16 10v12" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span class="text-lg font-semibold">ENVISION</span>
          </div>
          <div class="h-6 w-px bg-blue-400"></div>
          <span class="text-sm font-medium text-blue-200">COI System</span>
        </div>

        <!-- Right Side - User Info -->
        <div class="flex items-center gap-4">
          <!-- Notification bell hidden for customer demo (A5) -->
          <template v-if="false">
            <!-- Notifications -->
            <button 
              class="p-2 hover:bg-blue-800 rounded-lg"
              aria-label="Notifications"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
            </button>
          </template>

          <!-- User -->
          <div class="flex items-center gap-3">
            <div class="text-right">
              <div class="text-sm font-medium">{{ authStore.user?.name }}</div>
              <div class="text-xs text-blue-200">{{ authStore.user?.role }}</div>
            </div>
            <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
              {{ getInitials(authStore.user?.name) }}
            </div>
          </div>

          <button 
            @click="handleLogout" 
            class="px-3 py-1.5 text-sm bg-primary-700 hover:bg-primary-600 rounded-lg"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    <!-- Navigation Tabs -->
    <nav class="bg-[#1e3a8a] border-t border-blue-700">
      <div class="flex items-center gap-1 px-6">
        <router-link 
          v-for="tab in visibleTabs" 
          :key="tab.path"
          :to="tab.path"
          class="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors"
          :class="isActiveTab(tab.path) ? 'bg-slate-100 text-gray-900' : 'text-blue-200 hover:text-white hover:bg-blue-800'"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </router-link>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="p-6">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { isClientIntelligenceEnabled } from '../../../client-intelligence/frontend/services/featureFlag.ts'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const intelligenceEnabled = ref(false)

onMounted(async () => {
  intelligenceEnabled.value = await isClientIntelligenceEnabled()
})

// Icon components
const DashboardIcon = () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' })
])

const RequestIcon = () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
])

const ApprovalIcon = () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' })
])

const ReportsIcon = () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' })
])

const SettingsIcon = () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }),
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' })
])

// Define tabs based on user role
const allTabs = computed(() => {
  const userRole = authStore.user?.role
  const baseTabs = []
  
  // Dashboard tab - different path based on role
  if (userRole === 'Requester') baseTabs.push({ path: '/coi/requester', label: 'Dashboard', icon: DashboardIcon })
  if (userRole === 'Director') baseTabs.push({ path: '/coi/director', label: 'Dashboard', icon: DashboardIcon })
  if (userRole === 'Compliance') baseTabs.push({ path: '/coi/compliance', label: 'Dashboard', icon: DashboardIcon })
  if (userRole === 'Partner') baseTabs.push({ path: '/coi/partner', label: 'Dashboard', icon: DashboardIcon })
  if (userRole === 'Finance') baseTabs.push({ path: '/coi/finance', label: 'Dashboard', icon: DashboardIcon })
  if (userRole === 'Admin') baseTabs.push({ path: '/coi/admin', label: 'Dashboard', icon: DashboardIcon })
  if (userRole === 'Super Admin') baseTabs.push({ path: '/coi/super-admin', label: 'Dashboard', icon: DashboardIcon })
  
  // New Request - for Requesters and Directors
  if (['Requester', 'Director', 'Admin', 'Super Admin'].includes(userRole || '')) {
    baseTabs.push({ path: '/coi/request/new', label: 'New Request', icon: RequestIcon })
  }
  
  // Reports - available for all roles
  baseTabs.push({ 
    path: '/coi/reports', 
    label: 'Reports', 
    icon: () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
    ])
  })
  
  // Role-specific tabs for Super Admin to see all
  if (userRole === 'Super Admin') {
    baseTabs.push({ path: '/coi/compliance', label: 'Compliance', icon: ApprovalIcon })
    baseTabs.push({ path: '/coi/partner', label: 'Partner', icon: ApprovalIcon })
    baseTabs.push({ path: '/coi/finance', label: 'Finance', icon: ApprovalIcon })
  }
  
  // Note: Business Intelligence is now integrated into the Prospect CRM tab
  // in each role's dashboard (RequesterDashboard, DirectorDashboard, etc.)
  // The separate top-nav BI link has been removed to avoid fragmentation
  
  return baseTabs
})

const visibleTabs = allTabs

function isActiveTab(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

function getInitials(name: string | undefined) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>
