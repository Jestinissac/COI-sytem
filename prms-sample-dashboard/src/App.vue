<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import TopBar from '@/components/layout/TopBar.vue'
const period = ref<'MTD'|'QTD'|'YTD'>('MTD')
const handlePeriodChange = (val: 'MTD'|'QTD'|'YTD') => { period.value = val }
const route = useRoute()
const router = useRouter()
const go = (name: string, params?: Record<string, any>) => {
  console.log('Navigating to:', name, params)
  // Use direct navigation without complex fallback logic
  router.push({ name, params }).catch((error) => {
    console.error('Navigation error:', error)
    // Simple fallback - just log the error
    console.log('Navigation failed, but continuing...')
  })
}
const viewKey = ref(0)
const showView = ref(true)

// Remove the aggressive view refresh that's causing navigation issues
// watch(() => route.fullPath, async () => {
//   showView.value = false
//   await nextTick()
//   showView.value = true
//   viewKey.value++
// })

// Instead, use a simpler approach that doesn't interfere with navigation
// Simple route change listener to ensure debug info updates
watch(() => route.name, (newRoute) => {
  console.log('Route changed to:', newRoute)
  // Only update key when route actually changes, don't refresh the view
  viewKey.value++
}, { immediate: true })
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r border-gray-200 hidden md:block relative z-50">
      <div class="px-6 py-4 border-b">
        <h1 class="text-lg font-semibold">Envision PRMS</h1>
        <p class="text-xs text-gray-500">Production-like stack</p>
      </div>
      <nav class="p-4 space-y-1">
        <button @click="go('management')" class="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 border-l-4" :class="$route.name === 'management' ? 'bg-gray-50 border-primary-600 text-gray-900' : 'border-transparent text-gray-700'">Management</button>
        <button @click="go('finance')" class="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 border-l-4" :class="$route.name === 'finance' ? 'bg-gray-50 border-primary-600 text-gray-900' : 'border-transparent text-gray-700'">Finance</button>
        <button @click="go('project')" class="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 border-l-4" :class="$route.name === 'project' || $route.name === 'project-detail' ? 'bg-gray-50 border-primary-600 text-gray-900' : 'border-transparent text-gray-700'">Project</button>
        <button @click="go('admin')" class="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 border-l-4" :class="$route.name === 'admin' ? 'bg-gray-50 border-primary-600 text-gray-900' : 'border-transparent text-gray-700'">Admin</button>
        <button @click="go('auditor')" class="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 border-l-4" :class="$route.name === 'auditor' ? 'bg-gray-50 border-primary-600 text-gray-900' : 'border-transparent text-gray-700'">Auditor</button>
        <div class="h-px bg-gray-200 my-3"></div>
        <button @click="go('partner-audit')" class="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 border-l-4" :class="$route.name === 'partner-audit' ? 'bg-gray-50 border-primary-600 text-gray-900' : 'border-transparent text-gray-700'">Partner: Audit</button>
        <button @click="go('partner-tax')" class="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 border-l-4" :class="$route.name === 'partner-tax' ? 'bg-gray-50 border-primary-600 text-gray-900' : 'border-transparent text-gray-700'">Partner: Tax</button>
      </nav>
    </aside>

    <!-- Main -->
    <main class="flex-1">
      <TopBar :period="period" @change:period="handlePeriodChange" />
      <!-- Navigation Debug Info -->
      <div class="bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs text-blue-700">
        <span class="font-medium">Current Route:</span> {{ $route.name }} ({{ $route.path }})
        <span class="ml-4 font-medium">Navigation Status:</span> 
        <span :class="showView ? 'text-green-600' : 'text-yellow-600'">
          {{ showView ? 'Ready' : 'Loading...' }}
        </span>
      </div>
      <div class="p-4 md:p-6 max-w-7xl mx-auto">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
</style>
