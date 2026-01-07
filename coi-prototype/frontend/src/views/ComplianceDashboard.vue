<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Top Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">Compliance Review</h1>
            <p class="text-sm text-gray-500 mt-1">Review requests for conflicts and duplications</p>
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
                    <p class="text-sm text-gray-500">Pending Review</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ pendingRequests.length }}</p>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Conflicts Flagged</p>
                    <p class="text-2xl font-bold text-red-600 mt-1">{{ conflictsCount }}</p>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Duplications</p>
                    <p class="text-2xl font-bold text-yellow-600 mt-1">{{ duplicationsCount }}</p>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Global Clearance</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ globalClearanceCount }}</p>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Service Type Conflict Matrix -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900">Service Conflict Matrix</h2>
                <p class="text-sm text-gray-500 mt-1">Active engagements by client and service type</p>
              </div>
              <div class="p-6">
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="text-left">
                        <th class="pb-3 font-medium text-gray-500">Client</th>
                        <th class="pb-3 font-medium text-gray-500 text-center">Audit</th>
                        <th class="pb-3 font-medium text-gray-500 text-center">Tax</th>
                        <th class="pb-3 font-medium text-gray-500 text-center">Advisory</th>
                        <th class="pb-3 font-medium text-gray-500 text-center">Other</th>
                        <th class="pb-3 font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      <tr v-for="matrix in conflictMatrix" :key="matrix.client">
                        <td class="py-3 font-medium text-gray-900">{{ matrix.client }}</td>
                        <td class="py-3 text-center">
                          <span v-if="matrix.audit" class="inline-flex w-6 h-6 rounded-full bg-blue-100 text-blue-600 items-center justify-center text-xs font-medium">✓</span>
                          <span v-else class="text-gray-300">-</span>
                        </td>
                        <td class="py-3 text-center">
                          <span v-if="matrix.tax" class="inline-flex w-6 h-6 rounded-full bg-green-100 text-green-600 items-center justify-center text-xs font-medium">✓</span>
                          <span v-else class="text-gray-300">-</span>
                        </td>
                        <td class="py-3 text-center">
                          <span v-if="matrix.advisory" class="inline-flex w-6 h-6 rounded-full bg-purple-100 text-purple-600 items-center justify-center text-xs font-medium">✓</span>
                          <span v-else class="text-gray-300">-</span>
                        </td>
                        <td class="py-3 text-center">
                          <span v-if="matrix.other" class="inline-flex w-6 h-6 rounded-full bg-gray-100 text-gray-600 items-center justify-center text-xs font-medium">✓</span>
                          <span v-else class="text-gray-300">-</span>
                        </td>
                        <td class="py-3">
                          <span 
                            :class="matrix.conflict ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'"
                            class="px-2 py-1 text-xs font-medium rounded"
                          >
                            {{ matrix.conflict ? '⚠ Conflict' : 'Clear' }}
                          </span>
                        </td>
                      </tr>
                      <tr v-if="conflictMatrix.length === 0">
                        <td colspan="6" class="py-8 text-center text-gray-500">No client data available</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Pending Review Tab -->
          <div v-if="activeTab === 'pending'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 class="font-semibold text-gray-900">Pending Compliance Review</h2>
                <div class="flex items-center gap-3">
                  <select v-model="filterType" class="px-3 py-2 text-sm border border-gray-300 rounded-md">
                    <option value="all">All Requests</option>
                    <option value="conflicts">With Conflicts</option>
                    <option value="duplications">With Duplications</option>
                    <option value="clean">Clean Requests</option>
                  </select>
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
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validation</th>
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
                    <tr v-else-if="filteredRequests.length === 0">
                      <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <p>No pending reviews</p>
                      </td>
                    </tr>
                    <tr v-for="request in filteredRequests" :key="request.id" class="hover:bg-gray-50">
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
                        <span class="text-sm text-gray-600">{{ request.requester_name || 'Unknown' }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex flex-wrap gap-1">
                          <span 
                            v-if="hasConflict(request)"
                            class="px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700"
                          >
                            Conflict
                          </span>
                          <span 
                            v-if="hasDuplication(request)"
                            class="px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-700"
                          >
                            Duplicate
                          </span>
                          <span 
                            v-if="!hasConflict(request) && !hasDuplication(request)"
                            class="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700"
                          >
                            Clear
                          </span>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-500">{{ formatDate(request.created_at) }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <button 
                          @click="viewDetails(request)" 
                          class="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
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
                  Showing {{ filteredRequests.length }} of {{ pendingRequests.length }} requests
                </p>
              </div>
            </div>
          </div>

          <!-- Conflicts Tab -->
          <div v-if="activeTab === 'conflicts'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900">Service Type Conflicts</h2>
                <p class="text-sm text-gray-500 mt-1">Requests with potential independence violations</p>
              </div>
              
              <div class="p-6">
                <!-- Conflict Rules -->
                <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h3 class="text-sm font-semibold text-red-800 mb-2">Conflict Rules</h3>
                  <ul class="text-sm text-red-700 space-y-1">
                    <li>• Audit + Advisory for same client = <strong>Blocked</strong></li>
                    <li>• Audit + Tax Compliance = <strong>Review Required</strong></li>
                    <li>• Multiple service types from different departments = <strong>Flagged</strong></li>
                  </ul>
                </div>

                <div class="space-y-4">
                  <div 
                    v-for="request in conflictRequests" 
                    :key="request.id"
                    class="border border-red-200 rounded-lg p-4 bg-red-50"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <p class="font-medium text-gray-900">{{ request.request_id }}</p>
                        <p class="text-sm text-gray-600">{{ request.client_name }} • {{ request.service_type }}</p>
                        <div class="mt-2 text-sm text-red-700">
                          <strong>Conflict:</strong> Client already has active Audit engagement
                        </div>
                      </div>
                      <button 
                        @click="viewDetails(request)"
                        class="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                  <div v-if="conflictRequests.length === 0" class="text-center py-8 text-gray-500">
                    <svg class="w-12 h-12 mx-auto text-green-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p>No conflicts detected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Duplications Tab -->
          <div v-if="activeTab === 'duplications'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900">Potential Duplications</h2>
                <p class="text-sm text-gray-500 mt-1">Requests that match existing clients or engagements</p>
              </div>
              
              <div class="p-6">
                <div class="space-y-4">
                  <div 
                    v-for="request in duplicationRequests" 
                    :key="request.id"
                    class="border border-yellow-200 rounded-lg p-4 bg-yellow-50"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <p class="font-medium text-gray-900">{{ request.request_id }}</p>
                        <p class="text-sm text-gray-600">{{ request.client_name }} • {{ request.service_type }}</p>
                        <div class="mt-2">
                          <p class="text-sm font-medium text-yellow-800">Potential Matches:</p>
                          <ul class="text-sm text-yellow-700 mt-1">
                            <li v-for="(match, idx) in getMatches(request)" :key="idx">
                              • {{ match.existingEngagement?.client_name || 'Unknown' }} ({{ match.matchScore }}% match)
                            </li>
                          </ul>
                        </div>
                      </div>
                      <button 
                        @click="viewDetails(request)"
                        class="px-3 py-1.5 bg-yellow-600 text-white text-sm font-medium rounded hover:bg-yellow-700"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                  <div v-if="duplicationRequests.length === 0" class="text-center py-8 text-gray-500">
                    <svg class="w-12 h-12 mx-auto text-green-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p>No duplications detected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Rule Builder Tab -->
          <div v-if="activeTab === 'rules'" class="space-y-6">
            <RuleBuilder />
          </div>

          <!-- History Tab -->
          <div v-if="activeTab === 'history'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900">Review History</h2>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Decision</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="item in reviewHistory" :key="item.id" class="hover:bg-gray-50">
                      <td class="px-6 py-4">
                        <span class="text-sm font-medium text-gray-900">{{ item.request_id }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-600">{{ item.client_name || 'Not specified' }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span 
                          :class="getDecisionClass(item.compliance_review_status || item.status)"
                          class="px-2 py-1 text-xs font-medium rounded"
                        >
                          {{ getDecisionLabel(item.compliance_review_status || item.status) }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-500">{{ formatDate(item.compliance_review_date || item.updated_at) }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <button @click="viewDetails(item)" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View →
                        </button>
                      </td>
                    </tr>
                    <tr v-if="reviewHistory.length === 0">
                      <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                        No review history found
                      </td>
                    </tr>
                  </tbody>
                </table>
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
import RuleBuilder from '@/components/RuleBuilder.vue'

const router = useRouter()
const coiStore = useCOIRequestsStore()

const activeTab = ref('overview')
const searchQuery = ref('')
const filterType = ref('all')

const loading = computed(() => coiStore.loading)
const requests = computed(() => coiStore.requests)

// Icon components
const OverviewIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' })
    ])
  }
}

const PendingIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' })
    ])
  }
}

const ConflictIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' })
    ])
  }
}

const DuplicateIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z' })
    ])
  }
}

const HistoryIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' })
    ])
  }
}

const RuleBuilderIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
    ])
  }
}

const pendingRequests = computed(() => requests.value.filter(r => r.status === 'Pending Compliance'))

const conflictsCount = computed(() => {
  // Count requests where the client has conflicting service types
  return requests.value.filter(r => hasConflict(r)).length
})

const duplicationsCount = computed(() => {
  return requests.value.filter(r => hasDuplication(r)).length
})

const globalClearanceCount = computed(() => requests.value.filter(r => r.international_operations).length)

const conflictRequests = computed(() => requests.value.filter(r => hasConflict(r) && r.status === 'Pending Compliance'))

const duplicationRequests = computed(() => requests.value.filter(r => hasDuplication(r) && r.status === 'Pending Compliance'))

const reviewHistory = computed(() => requests.value.filter(r => 
  ['Pending Partner', 'Pending Finance', 'Approved', 'Active', 'Rejected'].includes(r.status)
).slice(0, 10))

// Build conflict matrix for overview
const conflictMatrix = computed(() => {
  const clientMap = new Map<string, any>()
  
  requests.value.forEach(r => {
    if (!r.client_name || r.status === 'Draft' || r.status === 'Rejected') return
    
    const key = r.client_name
    if (!clientMap.has(key)) {
      clientMap.set(key, {
        client: r.client_name,
        audit: false,
        tax: false,
        advisory: false,
        other: false,
        conflict: false
      })
    }
    
    const entry = clientMap.get(key)!
    const serviceType = (r.service_type || '').toLowerCase()
    
    if (serviceType.includes('audit')) entry.audit = true
    else if (serviceType.includes('tax')) entry.tax = true
    else if (serviceType.includes('advisory') || serviceType.includes('consulting')) entry.advisory = true
    else entry.other = true
    
    // Check for conflict: Audit + Advisory
    if (entry.audit && entry.advisory) {
      entry.conflict = true
    }
  })
  
  return Array.from(clientMap.values()).slice(0, 5)
})

const tabs = computed(() => [
  { id: 'overview', label: 'Overview', icon: OverviewIcon, count: 0, alertColor: '' },
  { id: 'pending', label: 'Pending Review', icon: PendingIcon, count: pendingRequests.value.length, alertColor: 'bg-blue-100 text-blue-700' },
  { id: 'conflicts', label: 'Conflicts', icon: ConflictIcon, count: conflictsCount.value, alertColor: 'bg-red-100 text-red-700' },
  { id: 'duplications', label: 'Duplications', icon: DuplicateIcon, count: duplicationsCount.value, alertColor: 'bg-yellow-100 text-yellow-700' },
  { id: 'rules', label: 'Rule Builder', icon: RuleBuilderIcon, count: 0, alertColor: '' },
  { id: 'history', label: 'History', icon: HistoryIcon, count: 0, alertColor: '' }
])

const filteredRequests = computed(() => {
  let filtered = pendingRequests.value
  
  // Apply filter type
  if (filterType.value === 'conflicts') {
    filtered = filtered.filter(r => hasConflict(r))
  } else if (filterType.value === 'duplications') {
    filtered = filtered.filter(r => hasDuplication(r))
  } else if (filterType.value === 'clean') {
    filtered = filtered.filter(r => !hasConflict(r) && !hasDuplication(r))
  }
  
  // Apply search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(r => 
      r.request_id?.toLowerCase().includes(q) ||
      r.client_name?.toLowerCase().includes(q) ||
      r.requester_name?.toLowerCase().includes(q)
    )
  }
  
  return filtered
})

function hasConflict(request: any): boolean {
  // Check if client has conflicting service types
  const clientRequests = requests.value.filter(r => 
    r.client_name === request.client_name && 
    r.id !== request.id &&
    !['Draft', 'Rejected'].includes(r.status)
  )
  
  const currentService = (request.service_type || '').toLowerCase()
  const isAudit = currentService.includes('audit')
  const isAdvisory = currentService.includes('advisory') || currentService.includes('consulting')
  
  for (const other of clientRequests) {
    const otherService = (other.service_type || '').toLowerCase()
    const otherIsAudit = otherService.includes('audit')
    const otherIsAdvisory = otherService.includes('advisory') || otherService.includes('consulting')
    
    // Audit + Advisory = Conflict
    if ((isAudit && otherIsAdvisory) || (isAdvisory && otherIsAudit)) {
      return true
    }
  }
  
  return false
}

function hasDuplication(request: any): boolean {
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

function getMatches(request: any): any[] {
  if (!request.duplication_matches) return []
  try {
    const matches = typeof request.duplication_matches === 'string' 
      ? JSON.parse(request.duplication_matches) 
      : request.duplication_matches
    return matches || []
  } catch { 
    return [] 
  }
}

function getDecisionClass(status: string) {
  const classes: Record<string, string> = {
    'Approved': 'bg-green-100 text-green-700',
    'Pending Partner': 'bg-green-100 text-green-700',
    'Pending Finance': 'bg-green-100 text-green-700',
    'Rejected': 'bg-red-100 text-red-700',
    'Need More Info': 'bg-amber-100 text-amber-700'
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

function getDecisionLabel(status: string) {
  const labels: Record<string, string> = {
    'Pending Partner': 'Approved → Partner',
    'Pending Finance': 'Approved → Finance'
  }
  return labels[status] || status
}

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function viewDetails(request: any) {
  router.push(`/coi/request/${request.id}`)
}

onMounted(() => {
  coiStore.fetchRequests()
})
</script>
