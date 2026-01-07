<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Top Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">Partner Review</h1>
            <p class="text-sm text-gray-500 mt-1">Final approval and risk assessment</p>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-6">
      <div class="flex gap-6">
        <!-- Left Sidebar Navigation -->
        <div class="w-56 flex-shrink-0">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
            <nav class="py-2">
              <a
                v-for="tab in tabs"
                :key="tab.id"
                href="#"
                @click.prevent="activeTab = tab.id"
                class="flex items-center px-4 py-3 text-sm transition-colors border-l-2"
                :class="activeTab === tab.id 
                  ? 'bg-blue-50 border-blue-600 text-blue-700 font-medium' 
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
              >
                <component :is="tab.icon" class="w-5 h-5 mr-3" />
                {{ tab.label }}
                <span 
                  v-if="tab.count > 0" 
                  class="ml-auto px-2 py-0.5 text-xs font-medium rounded-full"
                  :class="tab.alertColor"
                >
                  {{ tab.count }}
                </span>
              </a>
            </nav>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="flex-1">
          <!-- Overview Tab -->
          <div v-if="activeTab === 'overview'" class="space-y-6">
            <!-- Stats Cards -->
            <div class="grid grid-cols-4 gap-4">
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Pending Approval</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ pendingApprovals.length }}</p>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Active Proposals</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ activeProposals.length }}</p>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Active Engagements</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ activeEngagements.length }}</p>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Red Flags</p>
                    <p class="text-2xl font-bold text-red-600 mt-1">{{ redFlagsCount }}</p>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 class="font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div class="space-y-3">
                <div v-for="request in recentRequests" :key="request.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                      <span class="text-purple-600 text-xs font-medium">{{ getInitials(request.client_name) }}</span>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">{{ request.request_id }}</p>
                      <p class="text-xs text-gray-500">{{ request.client_name || 'No client' }} • {{ request.service_type || 'General' }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span :class="getStatusClass(request.status)" class="px-2 py-1 text-xs font-medium rounded">
                      {{ getStatusLabel(request.status) }}
                    </span>
                    <button @click="viewDetails(request)" class="text-blue-600 hover:text-blue-800 text-sm">
                      View →
                    </button>
                  </div>
                </div>
                <div v-if="recentRequests.length === 0" class="text-center py-4 text-gray-500">
                  No recent activity
                </div>
              </div>
            </div>
          </div>

          <!-- Pending Approvals Tab -->
          <div v-if="activeTab === 'pending'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 class="font-semibold text-gray-900">Pending Partner Approval</h2>
                <div class="relative">
                  <input 
                    v-model="searchQuery"
                    type="text" 
                    placeholder="Search requests..." 
                    class="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <svg class="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-if="loading">
                      <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        <div class="flex items-center justify-center">
                          <svg class="animate-spin h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </div>
                      </td>
                    </tr>
                    <tr v-else-if="filteredPending.length === 0">
                      <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <p>No pending approvals</p>
                      </td>
                    </tr>
                    <tr v-for="request in filteredPending" :key="request.id" class="hover:bg-gray-50">
                      <td class="px-6 py-4">
                        <span class="text-sm font-medium text-gray-900">{{ request.request_id }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-600">{{ request.client_name || 'Not specified' }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-600">{{ request.service_type || 'General' }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-600">{{ request.department }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-1">
                          <span 
                            v-if="hasRedFlags(request)"
                            class="px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700"
                          >
                            🚩 High
                          </span>
                          <span 
                            v-else
                            class="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700"
                          >
                            Low
                          </span>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-500">{{ formatDate(request.created_at) }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <button 
                          @click="viewDetails(request)" 
                          class="px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination -->
              <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p class="text-sm text-gray-500">
                  Showing {{ filteredPending.length }} of {{ pendingApprovals.length }} requests
                </p>
              </div>
            </div>
          </div>

          <!-- Engagements Tab -->
          <div v-if="activeTab === 'engagements'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 class="font-semibold text-gray-900">All Engagements</h2>
                <button class="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  Export
                </button>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eng. Code</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="request in allEngagements" :key="request.id" class="hover:bg-gray-50">
                      <td class="px-6 py-4">
                        <span class="text-sm font-medium text-gray-900">{{ request.request_id }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-600">{{ request.client_name || 'Not specified' }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-600">{{ request.service_type || 'General' }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span :class="getStatusClass(request.status)" class="px-2 py-1 text-xs font-medium rounded">
                          {{ request.status }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-600 font-mono">{{ request.engagement_code || '-' }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <button @click="viewDetails(request)" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View →
                        </button>
                      </td>
                    </tr>
                    <tr v-if="allEngagements.length === 0">
                      <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        No engagements found
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Expiring Tab -->
          <div v-if="activeTab === 'expiring'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900">Expiring Soon</h2>
                <p class="text-sm text-gray-500 mt-1">Engagements nearing monitoring limit or renewal</p>
              </div>

              <div class="p-6">
                <div class="space-y-4">
                  <div 
                    v-for="request in expiringSoon" 
                    :key="request.id"
                    class="border border-orange-200 rounded-lg p-4 bg-orange-50"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <p class="font-medium text-gray-900">{{ request.request_id }}</p>
                        <p class="text-sm text-gray-600">{{ request.client_name }} • {{ request.service_type }}</p>
                        <div class="mt-2 text-sm text-orange-700">
                          <strong>{{ request.days_in_monitoring || 0 }} days</strong> in monitoring (limit: 30 days)
                        </div>
                      </div>
                      <button 
                        @click="viewDetails(request)"
                        class="px-3 py-1.5 bg-orange-600 text-white text-sm font-medium rounded hover:bg-orange-700"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                  <div v-if="expiringSoon.length === 0" class="text-center py-8 text-gray-500">
                    <svg class="w-12 h-12 mx-auto text-green-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p>No engagements expiring soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useCOIRequestsStore } from '@/stores/coiRequests'

const router = useRouter()
const coiStore = useCOIRequestsStore()

const activeTab = ref('overview')
const searchQuery = ref('')

const loading = computed(() => coiStore.loading)
const requests = computed(() => coiStore.requests)

// Icon components
const OverviewIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' })
    ])
  }
}

const PendingIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' })
    ])
  }
}

const EngagementsIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' })
    ])
  }
}

const ExpiringIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' })
    ])
  }
}

const tabs = computed(() => [
  { id: 'overview', label: 'Overview', icon: OverviewIcon, count: 0, alertColor: '' },
  { id: 'pending', label: 'Pending Approval', icon: PendingIcon, count: pendingApprovals.value.length, alertColor: 'bg-purple-100 text-purple-700' },
  { id: 'engagements', label: 'All Engagements', icon: EngagementsIcon, count: allEngagements.value.length, alertColor: 'bg-gray-100 text-gray-600' },
  { id: 'expiring', label: 'Expiring Soon', icon: ExpiringIcon, count: expiringSoon.value.length, alertColor: 'bg-orange-100 text-orange-700' }
])

const pendingApprovals = computed(() => requests.value.filter(r => r.status === 'Pending Partner'))
const activeProposals = computed(() => requests.value.filter(r => r.stage === 'Proposal' && ['Approved', 'Pending Finance'].includes(r.status)))
const activeEngagements = computed(() => requests.value.filter(r => r.status === 'Active'))
const allEngagements = computed(() => requests.value.filter(r => 
  ['Pending Partner', 'Pending Finance', 'Approved', 'Active'].includes(r.status)
))
const expiringSoon = computed(() => requests.value.filter(r => 
  r.status === 'Active' && r.days_in_monitoring && r.days_in_monitoring >= 20
))
const recentRequests = computed(() => [...requests.value].sort((a, b) => 
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
).slice(0, 5))

const redFlagsCount = computed(() => requests.value.filter(r => hasRedFlags(r)).length)

const filteredPending = computed(() => {
  if (!searchQuery.value) return pendingApprovals.value
  const q = searchQuery.value.toLowerCase()
  return pendingApprovals.value.filter(r => 
    r.request_id?.toLowerCase().includes(q) ||
    r.client_name?.toLowerCase().includes(q)
  )
})

function hasRedFlags(request: any): boolean {
  if (!request.duplication_matches) return false
  try {
    const matches = typeof request.duplication_matches === 'string' 
      ? JSON.parse(request.duplication_matches) 
      : request.duplication_matches
    return matches && matches.length > 0
  } catch { 
    return false 
  }
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    'Draft': 'bg-gray-100 text-gray-700',
    'Pending Director Approval': 'bg-yellow-100 text-yellow-700',
    'Pending Compliance': 'bg-blue-100 text-blue-700',
    'Pending Partner': 'bg-purple-100 text-purple-700',
    'Pending Finance': 'bg-indigo-100 text-indigo-700',
    'Approved': 'bg-green-100 text-green-700',
    'Approved with Restrictions': 'bg-yellow-100 text-yellow-700',
    'Active': 'bg-green-100 text-green-700',
    'Rejected': 'bg-red-100 text-red-700'
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    'Pending Partner': 'Pending',
    'Pending Finance': 'Finance Review'
  }
  return labels[status] || status
}

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getInitials(name: string) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function viewDetails(request: any) {
  router.push(`/coi/request/${request.id}`)
}

onMounted(() => {
  coiStore.fetchRequests()
})
</script>
