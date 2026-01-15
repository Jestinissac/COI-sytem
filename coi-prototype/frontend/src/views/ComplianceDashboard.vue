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
            <!-- Stats Cards - Clickable -->
            <div class="grid grid-cols-4 gap-4">
              <div @click="activeTab = 'pending'" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all">
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
              <div @click="activeTab = 'conflicts'" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-red-300 transition-all">
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
              <div @click="activeTab = 'duplications'" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-yellow-300 transition-all">
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
              <div @click="activeTab = 'pipeline'" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-purple-300 transition-all">
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
                            v-if="request.requires_re_evaluation"
                            class="px-2 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-700"
                            title="Rules changed - requires re-evaluation"
                          >
                            Stale
                          </span>
                          <span 
                            v-if="hasRecommendations(request)"
                            class="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700"
                            :title="getRecommendationsSummary(request)"
                          >
                            {{ getRecommendationsCount(request) }} Recommendation(s)
                          </span>
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
                            v-if="!hasConflict(request) && !hasDuplication(request) && !hasRecommendations(request) && !request.requires_re_evaluation"
                            class="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700"
                          >
                            Clear
                          </span>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-500">{{ formatDate(request.created_at || '') }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                          <button 
                            @click="viewDetails(request)" 
                            class="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                          >
                            Review
                          </button>
                          <button 
                            v-if="request.international_operations"
                            @click="exportGlobalCOIForm(request)"
                            :disabled="exportingRequestId === request.id"
                            class="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                            title="Export Global COI Form"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            {{ exportingRequestId === request.id ? 'Exporting...' : 'Export' }}
                          </button>
                        </div>
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

          <!-- Pipeline Health Tab -->
          <div v-if="activeTab === 'pipeline'" class="space-y-6">
            <!-- Pipeline Funnel Stats -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 class="font-semibold text-gray-900 mb-4">Proposal Pipeline</h2>
              <div class="grid grid-cols-6 gap-4">
                <div class="text-center p-4 bg-blue-50 rounded-lg">
                  <div class="text-3xl font-bold text-blue-600">{{ pipelineStats.totalApproved }}</div>
                  <div class="text-sm text-gray-600 mt-1">Total Approved</div>
                </div>
                <div class="text-center p-4 bg-indigo-50 rounded-lg">
                  <div class="text-3xl font-bold text-indigo-600">{{ pipelineStats.proposalsSent }}</div>
                  <div class="text-sm text-gray-600 mt-1">Proposals Sent</div>
                </div>
                <div class="text-center p-4 bg-amber-50 rounded-lg">
                  <div class="text-3xl font-bold text-amber-600">{{ pipelineStats.awaitingResponse }}</div>
                  <div class="text-sm text-gray-600 mt-1">Awaiting Response</div>
                </div>
                <div class="text-center p-4 bg-green-50 rounded-lg">
                  <div class="text-3xl font-bold text-green-600">{{ pipelineStats.clientSigned }}</div>
                  <div class="text-sm text-gray-600 mt-1">Client Signed</div>
                </div>
                <div class="text-center p-4 bg-red-50 rounded-lg">
                  <div class="text-3xl font-bold text-red-600">{{ pipelineStats.clientRejected }}</div>
                  <div class="text-sm text-gray-600 mt-1">Client Rejected</div>
                </div>
                <div class="text-center p-4 bg-gray-100 rounded-lg">
                  <div class="text-3xl font-bold text-gray-600">{{ pipelineStats.lapsed }}</div>
                  <div class="text-sm text-gray-600 mt-1">Lapsed (30-day)</div>
                </div>
              </div>
            </div>

            <!-- Engagement Health -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 class="font-semibold text-gray-900 mb-4">Engagement Health</h2>
              <div class="grid grid-cols-3 gap-4">
                <div class="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-3xl font-bold text-green-600">{{ pipelineStats.activeEngagements }}</div>
                      <div class="text-sm text-gray-600 mt-1">Active Engagements</div>
                    </div>
                    <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-3xl font-bold text-amber-600">{{ upcomingRenewalsCount }}</div>
                      <div class="text-sm text-gray-600 mt-1">Upcoming Renewals (90 days)</div>
                    </div>
                    <div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div class="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-3xl font-bold text-purple-600">{{ conversionRate }}%</div>
                      <div class="text-sm text-gray-600 mt-1">Conversion Rate</div>
                    </div>
                    <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Proposals Approaching Lapse -->
            <div v-if="approachingLapse.length > 0" class="bg-white rounded-lg shadow-sm border border-amber-200">
              <div class="px-6 py-4 border-b border-amber-200 bg-amber-50">
                <h2 class="font-semibold text-amber-800">⚠ Proposals Approaching 30-Day Lapse</h2>
                <p class="text-sm text-amber-700 mt-1">These proposals need urgent follow-up</p>
              </div>
              <div class="p-4">
                <div class="space-y-3">
                  <div 
                    v-for="request in approachingLapse" 
                    :key="request.id"
                    class="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
                  >
                    <div>
                      <p class="font-medium text-gray-900">{{ request.request_id }}</p>
                      <p class="text-sm text-gray-600">{{ request.client_name }} • {{ request.service_type }}</p>
                    </div>
                    <div class="text-right">
                      <span class="text-amber-700 font-medium">{{ getDaysRemaining(request) }} days left</span>
                      <button 
                        @click="viewDetails(request)"
                        class="block mt-1 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View →
                      </button>
                    </div>
                  </div>
                </div>
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
                          <strong>Conflict:</strong> {{ getConflictReason(request) }}
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

          <!-- Stale Requests Tab -->
          <div v-if="activeTab === 'stale'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900">Stale Requests</h2>
                <p class="text-sm text-gray-500 mt-1">Requests that require re-evaluation due to rule changes</p>
              </div>
              
              <div class="p-6">
                <!-- Info Banner -->
                <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <div>
                      <h3 class="text-sm font-semibold text-amber-800">Rule Changes Detected</h3>
                      <p class="text-sm text-amber-700 mt-1">
                        These requests were submitted before recent rule changes. They must be re-evaluated 
                        before approval to ensure compliance with the latest rule set.
                      </p>
                    </div>
                  </div>
                </div>

                <div class="space-y-4">
                  <div 
                    v-for="request in staleRequests" 
                    :key="request.id"
                    class="border border-amber-200 rounded-lg p-4 bg-amber-50"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <p class="font-medium text-gray-900">{{ request.request_id }}</p>
                        <p class="text-sm text-gray-600">{{ request.client_name }} • {{ request.service_type }}</p>
                        <div class="mt-2 text-sm text-amber-700">
                          <strong>Reason:</strong> {{ request.stale_reason || 'Rules modified since submission' }}
                        </div>
                      </div>
                      <button 
                        @click="viewDetails(request)"
                        class="px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded hover:bg-amber-700"
                      >
                        Review & Re-Evaluate
                      </button>
                    </div>
                  </div>
                  <div v-if="staleRequests.length === 0" class="text-center py-8 text-gray-500">
                    <svg class="w-12 h-12 mx-auto text-green-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p>All requests are up to date with the current rules</p>
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
                        <span class="text-sm text-gray-500">{{ formatDate(item.compliance_review_date || item.updated_at || '') }}</span>
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

    <!-- Review Modal -->
    <div 
      v-if="showReviewModal && selectedRequest" 
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <!-- Backdrop -->
        <div 
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          @click="closeReviewModal"
        ></div>

        <!-- Modal Panel -->
        <div class="relative inline-block w-full max-w-3xl bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                Review Request: {{ selectedRequest.request_id }}
              </h3>
              <p class="text-sm text-gray-500">
                {{ selectedRequest.client_name }} • {{ selectedRequest.service_type }}
              </p>
            </div>
            <button 
              @click="closeReviewModal"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="px-6 py-4 max-h-96 overflow-y-auto">
            <!-- Request Details Summary -->
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p class="text-xs text-gray-500 uppercase tracking-wide">Requester</p>
                <p class="text-sm text-gray-900">{{ selectedRequest.requester_name || 'N/A' }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 uppercase tracking-wide">Department</p>
                <p class="text-sm text-gray-900">{{ selectedRequest.department || 'N/A' }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 uppercase tracking-wide">Service Description</p>
                <p class="text-sm text-gray-900">{{ selectedRequest.service_description || 'N/A' }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 uppercase tracking-wide">Submitted</p>
                <p class="text-sm text-gray-900">{{ formatDate(selectedRequest.created_at || '') }}</p>
              </div>
            </div>

            <!-- Compliance Action Panel -->
            <ComplianceActionPanel 
              :request="selectedRequest"
              @approve="handleApprove"
              @approve-with-restrictions="handleApproveWithRestrictions"
              @reject="handleReject"
              @request-info="handleRequestInfo"
              @updated="handleRequestUpdated"
            />
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <button 
              @click="goToFullDetails(selectedRequest)"
              class="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View Full Details →
            </button>
            <button 
              @click="closeReviewModal"
              class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Restrictions Modal -->
  <RestrictionsModal 
    :show="showRestrictionsModal"
    :request="selectedRequest"
    @approve="handleRestrictionsApproved"
    @cancel="showRestrictionsModal = false"
  />

  <!-- Info Request Modal -->
  <InfoRequestModal 
    :show="showInfoRequestModal"
    :request="selectedRequest"
    @requested="handleInfoRequested"
    @cancel="showInfoRequestModal = false"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useCOIRequestsStore, type COIRequest } from '@/stores/coiRequests'
import RuleBuilder from '@/components/RuleBuilder.vue'
import ComplianceActionPanel from '@/components/compliance/ComplianceActionPanel.vue'
import RestrictionsModal from '@/components/compliance/RestrictionsModal.vue'
import InfoRequestModal from '@/components/compliance/InfoRequestModal.vue'
import api from '@/services/api'

const router = useRouter()
const coiStore = useCOIRequestsStore()

// Modal state for reviewing requests
const showReviewModal = ref(false)
const selectedRequest = ref<COIRequest | null>(null)
const exportingRequestId = ref<number | null>(null)
const showRestrictionsModal = ref(false)
const showInfoRequestModal = ref(false)

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

const StaleIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' })
    ])
  }
}

const pendingRequests = computed(() => requests.value.filter(r => r.status === 'Pending Compliance'))

const conflictsCount = computed(() => {
  // Count requests with conflicts that are in Pending Compliance status
  // This matches what's shown in the Conflicts tab
  return requests.value.filter(r => hasConflict(r) && r.status === 'Pending Compliance').length
})

const duplicationsCount = computed(() => {
  return requests.value.filter(r => hasDuplication(r)).length
})

const globalClearanceCount = computed(() => requests.value.filter(r => r.international_operations).length)

const staleCount = computed(() => {
  return requests.value.filter(r => r.requires_re_evaluation && r.status === 'Pending Compliance').length
})

// Pipeline health computed properties
const upcomingRenewalsCount = computed(() => {
  return requests.value.filter(r => {
    if (r.status !== 'Active' || !r.client_response_date) return false
    const startDate = new Date(r.engagement_start_date || r.client_response_date)
    const renewalDate = new Date(startDate)
    renewalDate.setFullYear(renewalDate.getFullYear() + 3)
    const now = new Date()
    const daysUntilRenewal = Math.floor((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilRenewal <= 90 && daysUntilRenewal > 0
  }).length
})

const conversionRate = computed(() => {
  const sent = pipelineStats.value.proposalsSent
  const signed = pipelineStats.value.clientSigned
  if (sent === 0) return 0
  return Math.round((signed / sent) * 100)
})

const approachingLapse = computed(() => {
  return requests.value.filter(r => {
    if (!r.proposal_sent_date || r.client_response_date || r.status === 'Lapsed') return false
    const sent = new Date(r.proposal_sent_date)
    const now = new Date()
    const daysElapsed = Math.floor((now.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24))
    return daysElapsed >= 20 && daysElapsed < 30
  }).sort((a, b) => new Date(a.proposal_sent_date!).getTime() - new Date(b.proposal_sent_date!).getTime())
})

function getDaysRemaining(request: any): number {
  if (!request.proposal_sent_date) return 0
  const sent = new Date(request.proposal_sent_date)
  const lapsed = new Date(sent)
  lapsed.setDate(lapsed.getDate() + 30)
  const now = new Date()
  return Math.max(0, Math.floor((lapsed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

const staleRequests = computed(() => {
  return requests.value.filter(r => r.requires_re_evaluation && r.status === 'Pending Compliance')
})

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

const PipelineIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' })
    ])
  }
}

// Pipeline health stats
const pipelineStats = computed(() => {
  const approved = requests.value.filter(r => ['Approved', 'Active', 'Lapsed'].includes(r.status))
  return {
    totalApproved: approved.length,
    proposalsSent: approved.filter(r => r.proposal_sent_date).length,
    awaitingResponse: approved.filter(r => r.proposal_sent_date && !r.client_response_date && r.status !== 'Lapsed').length,
    clientSigned: approved.filter(r => r.client_response_status === 'Accepted').length,
    clientRejected: approved.filter(r => r.client_response_status === 'Rejected').length,
    lapsed: approved.filter(r => r.status === 'Lapsed').length,
    activeEngagements: requests.value.filter(r => r.status === 'Active').length
  }
})

const tabs = computed(() => [
  { id: 'overview', label: 'Overview', icon: OverviewIcon, count: 0, alertColor: '' },
  { id: 'pending', label: 'Pending Review', icon: PendingIcon, count: pendingRequests.value.length, alertColor: 'bg-blue-100 text-blue-700' },
  { id: 'pipeline', label: 'Pipeline Health', icon: PipelineIcon, count: 0, alertColor: '' },
  { id: 'stale', label: 'Stale Requests', icon: StaleIcon, count: staleCount.value, alertColor: 'bg-amber-100 text-amber-700' },
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
  // First, check if duplication_matches contains conflicts (from backend evaluation)
  if (request.duplication_matches) {
    try {
      const matches = typeof request.duplication_matches === 'string' 
        ? JSON.parse(request.duplication_matches) 
        : request.duplication_matches
      
      if (matches && matches.duplicates && Array.isArray(matches.duplicates)) {
        // Check if any duplicate match has conflicts
        const hasServiceConflict = matches.duplicates.some((match: any) => {
          return match.conflicts && match.conflicts.length > 0
        })
        if (hasServiceConflict) {
          return true
        }
      }
    } catch (e) {
      // Invalid JSON, continue to fallback check
    }
  }
  
  // Fallback: Check if client has conflicting service types in current requests
  const clientRequests = requests.value.filter(r => 
    r.client_name === request.client_name && 
    r.id !== request.id &&
    !['Draft', 'Rejected'].includes(r.status)
  )
  
  const currentService = (request.service_type || '').toLowerCase()
  const isAudit = currentService.includes('audit')
  const isAdvisory = currentService.includes('advisory') || currentService.includes('consulting')
  const isTax = currentService.includes('tax')
  
  for (const other of clientRequests) {
    const otherService = (other.service_type || '').toLowerCase()
    const otherIsAudit = otherService.includes('audit')
    const otherIsAdvisory = otherService.includes('advisory') || otherService.includes('consulting')
    const otherIsTax = otherService.includes('tax')
    
    // Audit + Advisory = Conflict (Blocked)
    if ((isAudit && otherIsAdvisory) || (isAdvisory && otherIsAudit)) {
      return true
    }
    // Audit + Tax = Conflict (Review Required)
    if ((isAudit && otherIsTax) || (isTax && otherIsAudit)) {
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
    if (matches && matches.duplicates && Array.isArray(matches.duplicates)) {
      return matches.duplicates.length > 0
    }
    return matches && matches.length > 0
  } catch { 
    return false 
  }
}

function getConflictReason(request: any): string {
  // Try to get conflict reason from stored duplication_matches
  if (request.duplication_matches) {
    try {
      const matches = typeof request.duplication_matches === 'string' 
        ? JSON.parse(request.duplication_matches) 
        : request.duplication_matches
      
      if (matches && matches.duplicates && Array.isArray(matches.duplicates)) {
        // Find first conflict
        for (const match of matches.duplicates) {
          if (match.conflicts && match.conflicts.length > 0) {
            const conflict = match.conflicts[0]
            return conflict.reason || conflict.message || 'Service type conflict detected'
          }
          if (match.reason) {
            return match.reason
          }
        }
      }
    } catch (e) {
      // Invalid JSON, continue to fallback
    }
  }
  
  // Fallback: Generate reason from service type analysis
  const currentService = (request.service_type || '').toLowerCase()
  const clientRequests = requests.value.filter(r => 
    r.client_name === request.client_name && 
    r.id !== request.id &&
    !['Draft', 'Rejected'].includes(r.status)
  )
  
  const isAudit = currentService.includes('audit')
  const isAdvisory = currentService.includes('advisory') || currentService.includes('consulting')
  const isTax = currentService.includes('tax')
  
  for (const other of clientRequests) {
    const otherService = (other.service_type || '').toLowerCase()
    const otherIsAudit = otherService.includes('audit')
    const otherIsAdvisory = otherService.includes('advisory') || otherService.includes('consulting')
    const otherIsTax = otherService.includes('tax')
    
    if (isAudit && otherIsAdvisory) {
      return 'Audit + Advisory for same client = Blocked'
    }
    if (isAdvisory && otherIsAudit) {
      return 'Advisory + Audit for same client = Blocked'
    }
    if (isAudit && otherIsTax) {
      return 'Audit + Tax Compliance = Review Required'
    }
    if (isTax && otherIsAudit) {
      return 'Tax Compliance + Audit = Review Required'
    }
  }
  
  return 'Service type conflict detected'
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

function hasRecommendations(request: any): boolean {
  if (!request.rule_recommendations) return false
  try {
    const recommendations = typeof request.rule_recommendations === 'string'
      ? JSON.parse(request.rule_recommendations)
      : request.rule_recommendations
    return Array.isArray(recommendations) && recommendations.length > 0
  } catch {
    return false
  }
}

function getRecommendationsCount(request: any): number {
  if (!hasRecommendations(request)) return 0
  try {
    const recommendations = typeof request.rule_recommendations === 'string'
      ? JSON.parse(request.rule_recommendations)
      : request.rule_recommendations
    return Array.isArray(recommendations) ? recommendations.length : 0
  } catch {
    return 0
  }
}

function getRecommendationsSummary(request: any): string {
  if (!hasRecommendations(request)) return ''
  try {
    const recommendations = typeof request.rule_recommendations === 'string'
      ? JSON.parse(request.rule_recommendations)
      : request.rule_recommendations
    if (!Array.isArray(recommendations)) return ''
    
    const critical = recommendations.filter((r: any) => r.severity === 'CRITICAL').length
    const high = recommendations.filter((r: any) => r.severity === 'HIGH').length
    const medium = recommendations.filter((r: any) => r.severity === 'MEDIUM').length
    
    const parts = []
    if (critical > 0) parts.push(`${critical} Critical`)
    if (high > 0) parts.push(`${high} High`)
    if (medium > 0) parts.push(`${medium} Medium`)
    
    return parts.length > 0 ? parts.join(', ') : `${recommendations.length} recommendation(s)`
  } catch {
    return ''
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
  selectedRequest.value = request
  showReviewModal.value = true
}

function closeReviewModal() {
  showReviewModal.value = false
  selectedRequest.value = null
}

function goToFullDetails(request: any) {
  closeReviewModal()
  router.push(`/coi/request/${request.id}`)
}

async function handleApprove() {
  if (!selectedRequest.value) return
  try {
    await api.post(`/coi/requests/${selectedRequest.value.id}/approve`, {
      status: 'Approved',
      comments: 'Approved by Compliance'
    })
    await coiStore.fetchRequests()
    closeReviewModal()
  } catch (error: any) {
    console.error('Error approving request:', error)
    alert(error.response?.data?.error || 'Failed to approve request')
  }
}

function handleApproveWithRestrictions() {
  showRestrictionsModal.value = true
}

async function handleRestrictionsApproved() {
  showRestrictionsModal.value = false
  await coiStore.fetchRequests()
  closeReviewModal()
}

async function handleReject() {
  if (!selectedRequest.value) return
  const reason = prompt('Please provide a reason for rejection:')
  if (!reason) return
  
  try {
    await api.post(`/coi/requests/${selectedRequest.value.id}/reject`, { reason })
    await coiStore.fetchRequests()
    closeReviewModal()
  } catch (error: any) {
    console.error('Error rejecting request:', error)
    alert(error.response?.data?.error || 'Failed to reject request')
  }
}

function handleRequestInfo() {
  showInfoRequestModal.value = true
}

async function handleInfoRequested() {
  showInfoRequestModal.value = false
  await coiStore.fetchRequests()
  closeReviewModal()
}

async function handleRequestInfoOld() {
  if (!selectedRequest.value) return
  const question = prompt('What additional information do you need?')
  if (!question) return
  
  try {
    await api.post(`/coi/requests/${selectedRequest.value.id}/request-info`, { question })
    await coiStore.fetchRequests()
    closeReviewModal()
  } catch (error: any) {
    console.error('Error requesting info:', error)
    alert(error.response?.data?.error || 'Failed to request information')
  }
}

function handleRequestUpdated(updatedRequest: COIRequest) {
  // Update the request in the store/local state
  if (selectedRequest.value) {
    selectedRequest.value = updatedRequest
  }
  // Refresh the list
  coiStore.fetchRequests()
}

// Export Global COI Form Excel
async function exportGlobalCOIForm(request: any) {
  if (!request.international_operations) {
    alert('Global COI Form export is only available for requests with international operations')
    return
  }
  
  exportingRequestId.value = request.id
  try {
    const response = await api.get(`/global/export-excel/${request.id}`, {
      responseType: 'blob'
    })
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Global_COI_Form_${request.request_id}_${new Date().toISOString().split('T')[0]}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    alert('Global COI Form exported successfully!')
  } catch (error: any) {
    console.error('Failed to export:', error)
    alert(error.response?.data?.error || 'Failed to export Global COI Form')
  } finally {
    exportingRequestId.value = null
  }
}

onMounted(() => {
  coiStore.fetchRequests()
})
</script>
