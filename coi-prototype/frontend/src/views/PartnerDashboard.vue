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
          <div class="flex items-center gap-3">
            <button
              @click="printTrackingReport"
              class="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              Print Tracking Report
            </button>
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
              <div @click="activeTab = 'pending'" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-purple-300 transition-all">
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
              <div @click="activeTab = 'status'" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all">
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
              <div @click="activeTab = 'engagements'" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-green-300 transition-all">
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
              <div @click="activeTab = 'redflags'" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-red-300 transition-all">
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

          <!-- Engagement Status Tab (Monitoring) -->
          <div v-if="activeTab === 'status'" class="space-y-6">
            <!-- Summary Stats -->
            <div class="grid grid-cols-4 gap-4">
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div class="text-2xl font-bold text-gray-900">{{ approvedByMe.length }}</div>
                <div class="text-sm text-gray-500">Total Approved</div>
              </div>
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div class="text-2xl font-bold text-green-600">{{ approvedByMe.filter(r => r.client_response_status === 'Accepted').length }}</div>
                <div class="text-sm text-gray-500">Client Signed</div>
              </div>
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div class="text-2xl font-bold text-amber-600">{{ approvedByMe.filter(r => !r.client_response_status && r.status !== 'Lapsed').length }}</div>
                <div class="text-sm text-gray-500">Awaiting Response</div>
              </div>
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div class="text-2xl font-bold text-gray-500">{{ approvedByMe.filter(r => r.status === 'Lapsed').length }}</div>
                <div class="text-sm text-gray-500">Lapsed</div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900">Engagement Status</h2>
                <p class="text-sm text-gray-500 mt-1">Proposals you approved - track their current status</p>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved Date</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Response</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eng. Code</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="request in approvedByMe" :key="request.id" class="hover:bg-gray-50">
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
                        <span class="text-sm text-gray-500">{{ formatDate(request.partner_approval_date || request.updated_at) }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span 
                          :class="getClientResponseClass(request.client_response_status || (request.status === 'Lapsed' ? 'Lapsed' : 'Awaiting'))"
                          class="px-2.5 py-1 text-xs font-semibold rounded-full"
                        >
                          {{ getClientResponseLabel(request) }}
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
                    <tr v-if="approvedByMe.length === 0">
                      <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        No approved engagements found
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- All History Tab (Enhanced with filters) -->
          <div v-if="activeTab === 'engagements'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 class="font-semibold text-gray-900">All Proposals & Engagements History</h2>
                  <p class="text-sm text-gray-500 mt-1">Complete historical view including cancelled and lapsed requests</p>
                </div>
                <div class="flex items-center gap-2">
                  <select v-model="historyStatusFilter" class="text-sm border border-gray-300 rounded-md px-3 py-1.5">
                    <option value="all">All Status</option>
                    <option value="Draft">Draft</option>
                    <option value="Pending Director Approval">Pending Director</option>
                    <option value="Pending Compliance">Pending Compliance</option>
                    <option value="Pending Partner">Pending Partner</option>
                    <option value="Pending Finance">Pending Finance</option>
                    <option value="Approved">Approved</option>
                    <option value="Active">Active</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Lapsed">Lapsed</option>
                  </select>
                  <input 
                    v-model="historyDateFilter" 
                    type="date" 
                    class="text-sm border border-gray-300 rounded-md px-3 py-1.5"
                    placeholder="From date"
                  />
                  <button
                    @click="printRequestReport(null)"
                    class="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                    </svg>
                    Print
                  </button>
                  <button @click="exportToExcel" class="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Export
                  </button>
                </div>
              </div>

              <!-- Summary stats -->
              <div class="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-6 text-sm">
                <span class="text-gray-600">Total: <strong>{{ filteredHistory.length }}</strong></span>
                <span class="text-green-600">Active: <strong>{{ filteredHistory.filter(r => r.status === 'Active').length }}</strong></span>
                <span class="text-blue-600">Approved: <strong>{{ filteredHistory.filter(r => r.status === 'Approved').length }}</strong></span>
                <span class="text-red-600">Rejected: <strong>{{ filteredHistory.filter(r => r.status === 'Rejected').length }}</strong></span>
                <span class="text-gray-500">Lapsed: <strong>{{ filteredHistory.filter(r => r.status === 'Lapsed').length }}</strong></span>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eng. Code</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="request in filteredHistory" :key="request.id" class="hover:bg-gray-50">
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
                        <span class="text-sm text-gray-500">{{ formatDate(request.created_at) }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-600 font-mono">{{ request.engagement_code || '-' }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                          <button @click="viewDetails(request)" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            View →
                          </button>
                          <button
                            @click="printRequestReport(request)"
                            class="text-gray-600 hover:text-gray-800"
                            title="Print tracking report"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="filteredHistory.length === 0">
                      <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        No requests found matching filters
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination info -->
              <div class="px-6 py-4 border-t border-gray-200">
                <p class="text-sm text-gray-500">
                  Showing {{ filteredHistory.length }} of {{ allRequestsHistory.length }} total requests
                </p>
              </div>
            </div>
          </div>

          <!-- COI Decisions Tab -->
          <div v-if="activeTab === 'decisions'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 class="font-semibold text-gray-900">COI Decisions</h2>
                  <p class="text-sm text-gray-500 mt-1">All approval and rejection decisions with reasons</p>
                </div>
                <div class="flex items-center gap-2">
                  <select v-model="decisionFilter" class="text-sm border border-gray-300 rounded-md px-3 py-1.5">
                    <option value="all">All Decisions</option>
                    <option value="Approved">Approved</option>
                    <option value="Approved with Restrictions">With Restrictions</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance Decision</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner Decision</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restrictions/Reason</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="request in filteredDecisions" :key="request.id" class="hover:bg-gray-50">
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
                        <span :class="getDecisionBadgeClass(request.compliance_approval_status || 'Pending')" class="px-2 py-1 text-xs font-medium rounded border">
                          {{ request.compliance_approval_status || 'Pending' }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <span :class="getDecisionBadgeClass(request.partner_approval_status || request.status)" class="px-2 py-1 text-xs font-medium rounded border">
                          {{ request.partner_approval_status || request.status }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <span v-if="request.compliance_restrictions || request.partner_restrictions || request.rejection_reason" class="text-sm text-gray-600 max-w-xs truncate block" :title="request.compliance_restrictions || request.partner_restrictions || request.rejection_reason">
                          {{ request.compliance_restrictions || request.partner_restrictions || request.rejection_reason || '-' }}
                        </span>
                        <span v-else class="text-sm text-gray-400">-</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-500">{{ formatDate(request.partner_approval_date || request.compliance_approval_date || request.updated_at) }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <button @click="viewDetails(request)" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View →
                        </button>
                      </td>
                    </tr>
                    <tr v-if="filteredDecisions.length === 0">
                      <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                        No decisions found
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Engagement Letters Tab -->
          <div v-if="activeTab === 'letters'" class="space-y-6">
            <!-- Summary Stats -->
            <div class="grid grid-cols-4 gap-4">
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div class="text-2xl font-bold text-gray-900">{{ engagementLetters.filter(r => r.proposal_sent_date && !r.client_response_date).length }}</div>
                <div class="text-sm text-gray-500">Awaiting Response</div>
              </div>
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div class="text-2xl font-bold text-green-600">{{ engagementLetters.filter(r => r.client_response_status === 'Accepted').length }}</div>
                <div class="text-sm text-gray-500">Signed</div>
              </div>
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div class="text-2xl font-bold text-amber-600">{{ engagementLetters.filter(r => r.proposal_sent_date && getDaysWaiting(r.proposal_sent_date) >= 20 && !r.client_response_date).length }}</div>
                <div class="text-sm text-gray-500">Near 30-Day Limit</div>
              </div>
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div class="text-2xl font-bold text-blue-600">{{ engagementLetters.filter(r => r.engagement_letter_issued).length }}</div>
                <div class="text-sm text-gray-500">Letters Issued</div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900">Engagement Letter Status</h2>
                <p class="text-sm text-gray-500 mt-1">Track proposal lifecycle and client signatures (30-day countdown)</p>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposal Sent</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Waiting</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Letter Status</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eng. Code</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="request in engagementLetters" :key="request.id" class="hover:bg-gray-50">
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
                        <span class="text-sm text-gray-500">{{ request.proposal_sent_date ? formatDate(request.proposal_sent_date) : 'Not sent' }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <div v-if="request.proposal_sent_date && !request.client_response_date" class="flex items-center">
                          <div class="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              class="h-2 rounded-full transition-all"
                              :class="getDaysWaiting(request.proposal_sent_date) >= 25 ? 'bg-red-500' : getDaysWaiting(request.proposal_sent_date) >= 15 ? 'bg-orange-500' : 'bg-green-500'"
                              :style="`width: ${Math.min(100, (getDaysWaiting(request.proposal_sent_date) / 30) * 100)}%`"
                            ></div>
                          </div>
                          <span class="text-sm font-medium" :class="getDaysWaiting(request.proposal_sent_date) >= 25 ? 'text-red-600' : 'text-gray-600'">
                            {{ getDaysWaiting(request.proposal_sent_date) }}/30
                          </span>
                        </div>
                        <span v-else-if="request.client_response_date" class="text-sm text-green-600">Complete</span>
                        <span v-else class="text-sm text-gray-400">-</span>
                      </td>
                      <td class="px-6 py-4">
                        <span :class="getLetterStatusClass(request)" class="px-2 py-1 text-xs font-medium rounded">
                          {{ getLetterStatusLabel(request) }}
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
                    <tr v-if="engagementLetters.length === 0">
                      <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                        No engagement letters to track
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Red Flags Tab -->
          <div v-if="activeTab === 'redflags'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200 bg-red-50">
                <h2 class="font-semibold text-red-900">Red Flags & Conflicts</h2>
                <p class="text-sm text-red-700 mt-1">Requests with independence threats, conflicts, or compliance issues</p>
              </div>

              <div class="divide-y divide-gray-200">
                <div v-for="request in redFlagRequests" :key="request.id" class="p-6">
                  <div class="flex items-start justify-between mb-4">
                    <div>
                      <div class="flex items-center gap-3">
                        <span class="text-sm font-bold text-gray-900">{{ request.request_id }}</span>
                        <span :class="getStatusClass(request.status)" class="px-2 py-1 text-xs font-medium rounded">
                          {{ request.status }}
                        </span>
                      </div>
                      <p class="text-sm text-gray-600 mt-1">{{ request.client_name }} • {{ request.service_type }}</p>
                    </div>
                    <button @click="viewDetails(request)" class="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700">
                      Investigate
                    </button>
                  </div>
                  
                  <div class="space-y-2">
                    <div 
                      v-for="(flag, idx) in getRedFlagDetails(request)" 
                      :key="idx"
                      class="flex items-start p-3 rounded-lg"
                      :class="flag.severity === 'HIGH' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'"
                    >
                      <div class="flex-shrink-0 mr-3">
                        <span v-if="flag.severity === 'HIGH'" class="text-red-500">🚨</span>
                        <span v-else class="text-amber-500">⚠️</span>
                      </div>
                      <div class="flex-1">
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-medium" :class="flag.severity === 'HIGH' ? 'text-red-800' : 'text-amber-800'">
                            {{ flag.type }}
                          </span>
                          <span class="px-1.5 py-0.5 text-xs rounded" :class="flag.severity === 'HIGH' ? 'bg-red-200 text-red-700' : 'bg-amber-200 text-amber-700'">
                            {{ flag.severity }}
                          </span>
                        </div>
                        <p class="text-sm mt-1" :class="flag.severity === 'HIGH' ? 'text-red-700' : 'text-amber-700'">
                          {{ flag.message }}
                        </p>
                        <p v-if="flag.details" class="text-xs mt-1" :class="flag.severity === 'HIGH' ? 'text-red-600' : 'text-amber-600'">
                          {{ flag.details }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div v-if="redFlagRequests.length === 0" class="p-8 text-center text-gray-500">
                  <svg class="w-12 h-12 mx-auto text-green-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p>No red flags or conflicts detected</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Group Services Tab -->
          <div v-if="activeTab === 'group'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900">Group-Level Services</h2>
                <p class="text-sm text-gray-500 mt-1">All services across client groups and parent companies</p>
              </div>

              <div class="divide-y divide-gray-200">
                <div v-for="(services, groupName) in groupedServices" :key="groupName" class="p-6">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                        </svg>
                      </div>
                      <div>
                        <h3 class="font-medium text-gray-900">{{ groupName }}</h3>
                        <p class="text-sm text-gray-500">{{ services.length }} engagement(s)</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <span v-if="services.some(s => hasRedFlags(s))" class="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700">
                        Has Conflicts
                      </span>
                      <span class="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600">
                        {{ [...new Set(services.map(s => s.service_type))].length }} service type(s)
                      </span>
                    </div>
                  </div>
                  
                  <div class="ml-13 space-y-2">
                    <div 
                      v-for="service in services" 
                      :key="service.id"
                      class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div class="flex items-center gap-3">
                        <span class="text-sm font-medium text-gray-900">{{ service.request_id }}</span>
                        <span class="text-sm text-gray-600">{{ service.service_type || 'General' }}</span>
                        <span :class="getStatusClass(service.status)" class="px-2 py-0.5 text-xs font-medium rounded">
                          {{ service.status }}
                        </span>
                      </div>
                      <button @click="viewDetails(service)" class="text-blue-600 hover:text-blue-800 text-sm">
                        View →
                      </button>
                    </div>
                  </div>
                </div>
                
                <div v-if="Object.keys(groupedServices).length === 0" class="p-8 text-center text-gray-500">
                  No group services found
                </div>
              </div>
            </div>
          </div>

          <!-- 3-Year Renewals Tab -->
          <div v-if="activeTab === 'renewals'" class="space-y-6">
            <!-- Alert Banner -->
            <div v-if="renewalAlerts.length > 0" class="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div class="flex items-center">
                <svg class="w-5 h-5 text-amber-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <span class="text-amber-800 font-medium">{{ renewalAlerts.length }} engagement(s) approaching 3-year renewal</span>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900">3-Year Engagement Renewals</h2>
                <p class="text-sm text-gray-500 mt-1">Engagements requiring renewal review (alerts at 90, 30, 14, 7 days)</p>
              </div>

              <div class="divide-y divide-gray-200">
                <div v-for="request in renewalAlerts" :key="request.id" class="p-6">
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="flex items-center gap-3 mb-2">
                        <span class="text-sm font-bold text-gray-900">{{ request.request_id }}</span>
                        <span 
                          class="px-2 py-1 text-xs font-medium rounded"
                          :class="getDaysUntilRenewal(request) <= 7 ? 'bg-red-100 text-red-700' : getDaysUntilRenewal(request) <= 30 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'"
                        >
                          {{ getDaysUntilRenewal(request) }} days until renewal
                        </span>
                      </div>
                      <p class="text-sm text-gray-600">{{ request.client_name }} • {{ request.service_type }}</p>
                      <div class="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span class="text-gray-500">Engagement Start:</span>
                          <span class="ml-2 text-gray-900">{{ formatDate(request.engagement_start_date) }}</span>
                        </div>
                        <div>
                          <span class="text-gray-500">Renewal Date:</span>
                          <span class="ml-2 text-gray-900 font-medium">{{ getRenewalDate(request) }}</span>
                        </div>
                        <div>
                          <span class="text-gray-500">Eng. Code:</span>
                          <span class="ml-2 text-gray-900 font-mono">{{ request.engagement_code || '-' }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="flex flex-col gap-2">
                      <button @click="viewDetails(request)" class="px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded hover:bg-amber-700">
                        Review
                      </button>
                      <button class="px-3 py-1.5 border border-amber-300 text-amber-700 text-sm font-medium rounded hover:bg-amber-50">
                        Initiate Renewal
                      </button>
                    </div>
                  </div>
                </div>
                
                <div v-if="renewalAlerts.length === 0" class="p-8 text-center text-gray-500">
                  <svg class="w-12 h-12 mx-auto text-green-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p>No engagements due for 3-year renewal</p>
                </div>
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
                        @click="viewDetails(request, 'expiring')"
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
const decisionFilter = ref('all')

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

const StatusIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' })
    ])
  }
}

// Approved by me - requests that this partner approved
const approvedByMe = computed(() => requests.value.filter(r => 
  r.partner_approved_by && 
  (r.status === 'Approved' || r.status === 'Active' || r.status === 'Pending Finance' || r.status === 'Lapsed')
))

// New Icon Components for additional tabs
const DecisionsIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' })
    ])
  }
}

const LettersIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' })
    ])
  }
}

const GroupIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' })
    ])
  }
}

const RedFlagIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9' })
    ])
  }
}

const RenewalIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' })
    ])
  }
}

const tabs = computed(() => [
  { id: 'overview', label: 'Overview', icon: OverviewIcon, count: 0, alertColor: '' },
  { id: 'pending', label: 'Pending Approval', icon: PendingIcon, count: pendingApprovals.value.length, alertColor: 'bg-purple-100 text-purple-700' },
  { id: 'decisions', label: 'COI Decisions', icon: DecisionsIcon, count: coiDecisions.value.length, alertColor: 'bg-green-100 text-green-700' },
  { id: 'letters', label: 'Engagement Letters', icon: LettersIcon, count: engagementLetters.value.length, alertColor: 'bg-indigo-100 text-indigo-700' },
  { id: 'redflags', label: 'Red Flags', icon: RedFlagIcon, count: redFlagRequests.value.length, alertColor: 'bg-red-100 text-red-700' },
  { id: 'group', label: 'Group Services', icon: GroupIcon, count: 0, alertColor: '' },
  { id: 'renewals', label: '3-Year Renewals', icon: RenewalIcon, count: renewalAlerts.value.length, alertColor: 'bg-amber-100 text-amber-700' },
  { id: 'status', label: 'Engagement Status', icon: StatusIcon, count: approvedByMe.value.length, alertColor: 'bg-blue-100 text-blue-700' },
  { id: 'engagements', label: 'All History', icon: EngagementsIcon, count: allRequestsHistory.value.length, alertColor: 'bg-gray-100 text-gray-600' },
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

// NEW: COI Decisions - all requests with compliance or partner decisions
const coiDecisions = computed(() => requests.value.filter(r => 
  r.compliance_approval_status || r.partner_approval_status || 
  ['Approved', 'Approved with Restrictions', 'Rejected', 'Active'].includes(r.status)
).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()))

// NEW: Engagement Letters - approved requests awaiting or with engagement letters
const engagementLetters = computed(() => requests.value.filter(r => 
  ['Approved', 'Active', 'Pending Finance'].includes(r.status) || r.stage === 'Engagement'
).sort((a, b) => {
  // Sort by days waiting (proposals sent but not signed first)
  const aDays = a.proposal_sent_date && !a.client_response_date ? getDaysWaiting(a.proposal_sent_date) : 0
  const bDays = b.proposal_sent_date && !b.client_response_date ? getDaysWaiting(b.proposal_sent_date) : 0
  return bDays - aDays
}))

// NEW: Red Flag Requests - detailed view of requests with flags
const redFlagRequests = computed(() => requests.value.filter(r => hasRedFlags(r) || hasConflicts(r)))

// NEW: 3-Year Renewal Alerts
const renewalAlerts = computed(() => requests.value.filter(r => {
  if (r.status !== 'Active' || !r.engagement_start_date) return false
  const engagementDate = new Date(r.engagement_start_date)
  const threeYearsLater = new Date(engagementDate)
  threeYearsLater.setFullYear(threeYearsLater.getFullYear() + 3)
  const now = new Date()
  const daysUntilRenewal = Math.ceil((threeYearsLater.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return daysUntilRenewal <= 90 && daysUntilRenewal > -30 // Within 90 days before or 30 days after
}))

// NEW: All Requests History (including cancelled, lapsed, rejected)
const allRequestsHistory = computed(() => [...requests.value].sort((a, b) => 
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
))

// NEW: Group services by client parent
const groupedServices = computed(() => {
  const groups: Record<string, any[]> = {}
  requests.value.forEach(r => {
    const parentKey = r.parent_company || r.client_name || 'Unknown'
    if (!groups[parentKey]) groups[parentKey] = []
    groups[parentKey].push(r)
  })
  return groups
})

// Filters for history tab
const historyStatusFilter = ref('all')
const historyDateFilter = ref('')

const filteredHistory = computed(() => {
  let filtered = allRequestsHistory.value
  
  if (historyStatusFilter.value !== 'all') {
    filtered = filtered.filter(r => r.status === historyStatusFilter.value)
  }
  
  if (historyDateFilter.value) {
    const filterDate = new Date(historyDateFilter.value)
    filtered = filtered.filter(r => new Date(r.created_at) >= filterDate)
  }
  
  return filtered
})

// Filtered COI Decisions
const filteredDecisions = computed(() => {
  if (decisionFilter.value === 'all') return coiDecisions.value
  return coiDecisions.value.filter(r => {
    const status = r.partner_approval_status || r.status
    return status === decisionFilter.value
  })
})

// Helper functions for new features
function getDaysWaiting(dateString: string): number {
  if (!dateString) return 0
  const sent = new Date(dateString)
  const now = new Date()
  return Math.ceil((now.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24))
}

function hasConflicts(request: any): boolean {
  if (!request.duplication_matches) return false
  try {
    const matches = typeof request.duplication_matches === 'string' 
      ? JSON.parse(request.duplication_matches) 
      : request.duplication_matches
    
    // Check for rule recommendations with conflicts
    const ruleRecs = matches.ruleRecommendations || []
    return ruleRecs.some((r: any) => r.ruleType === 'conflict' || r.recommendedAction === 'FLAG' || r.recommendedAction === 'REJECT')
  } catch { 
    return false 
  }
}

function getRedFlagDetails(request: any): any[] {
  if (!request.duplication_matches) return []
  try {
    const matches = typeof request.duplication_matches === 'string' 
      ? JSON.parse(request.duplication_matches) 
      : request.duplication_matches
    
    const flags: any[] = []
    
    // Duplication flags
    const duplicates = matches.duplicates || []
    if (Array.isArray(duplicates) && duplicates.length > 0) {
      duplicates.forEach((d: any) => {
        flags.push({
          type: 'Duplication',
          severity: d.action === 'block' ? 'HIGH' : 'MEDIUM',
          message: d.reason || 'Similar client detected',
          details: d.existingEngagement?.client_name || 'Unknown'
        })
      })
    }
    
    // Rule recommendation flags
    const ruleRecs = matches.ruleRecommendations || []
    ruleRecs.forEach((r: any) => {
      if (r.recommendedAction === 'FLAG' || r.recommendedAction === 'REJECT') {
        flags.push({
          type: r.ruleType === 'conflict' ? 'Service Conflict' : 'Compliance',
          severity: r.confidence || 'MEDIUM',
          message: r.reason || r.ruleName,
          details: r.guidance || ''
        })
      }
    })
    
    return flags
  } catch { 
    return [] 
  }
}

function getDaysUntilRenewal(request: any): number {
  if (!request.engagement_start_date) return 999
  const engagementDate = new Date(request.engagement_start_date)
  const threeYearsLater = new Date(engagementDate)
  threeYearsLater.setFullYear(threeYearsLater.getFullYear() + 3)
  const now = new Date()
  return Math.ceil((threeYearsLater.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function getRenewalDate(request: any): string {
  if (!request.engagement_start_date) return 'N/A'
  const engagementDate = new Date(request.engagement_start_date)
  const threeYearsLater = new Date(engagementDate)
  threeYearsLater.setFullYear(threeYearsLater.getFullYear() + 3)
  return threeYearsLater.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getDecisionBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    'Approved': 'bg-green-100 text-green-800 border-green-300',
    'Approved with Restrictions': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Rejected': 'bg-red-100 text-red-800 border-red-300',
    'Pending': 'bg-gray-100 text-gray-800 border-gray-300'
  }
  return classes[status] || 'bg-gray-100 text-gray-600 border-gray-300'
}

function getLetterStatusClass(request: any): string {
  if (request.client_response_status === 'Accepted' || request.engagement_letter_signed) {
    return 'bg-green-100 text-green-800'
  }
  if (request.engagement_letter_issued) {
    return 'bg-blue-100 text-blue-800'
  }
  if (request.proposal_sent_date) {
    const days = getDaysWaiting(request.proposal_sent_date)
    if (days >= 25) return 'bg-red-100 text-red-800'
    if (days >= 15) return 'bg-orange-100 text-orange-800'
    return 'bg-amber-100 text-amber-800'
  }
  return 'bg-gray-100 text-gray-600'
}

function getLetterStatusLabel(request: any): string {
  if (request.client_response_status === 'Accepted' || request.engagement_letter_signed) {
    return '✓ Signed'
  }
  if (request.engagement_letter_issued) {
    return 'Letter Issued'
  }
  if (request.proposal_sent_date) {
    const days = getDaysWaiting(request.proposal_sent_date)
    return `⏳ ${days} days`
  }
  return 'Pending'
}

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

function getClientResponseClass(status: string) {
  const classes: Record<string, string> = {
    'Accepted': 'bg-green-100 text-green-700 border border-green-300',
    'Signed': 'bg-green-100 text-green-700 border border-green-300',
    'Rejected': 'bg-red-100 text-red-700 border border-red-300',
    'Lapsed': 'bg-gray-200 text-gray-600 border border-gray-300',
    'Awaiting': 'bg-amber-100 text-amber-700 border border-amber-300',
    'Negotiating': 'bg-blue-100 text-blue-700 border border-blue-300'
  }
  return classes[status] || 'bg-gray-100 text-gray-600 border border-gray-300'
}

function getClientResponseLabel(request: any) {
  if (request.status === 'Lapsed') return 'Lapsed'
  if (request.client_response_status === 'Accepted') return '✓ Signed'
  if (request.client_response_status === 'Rejected') return '✗ Rejected'
  if (request.client_response_status === 'Negotiating') return '⟳ Negotiating'
  if (request.proposal_sent_date && !request.client_response_date) return '⏳ Awaiting'
  return 'Pending'
}

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getInitials(name: string) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function viewDetails(request: any, context?: string) {
  const query: any = {}
  if (context) {
    query.from = context
  }
  router.push({
    path: `/coi/request/${request.id}`,
    query
  })
}

function printRequestReport(request: any | null) {
  // If specific request provided, print that; otherwise print all engagements
  const requestsToPrint = request ? [request] : allEngagements.value
  
  if (requestsToPrint.length === 0) {
    alert('No requests to print')
    return
  }

  // Create print window
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to print the report')
    return
  }

  // Build HTML content
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>COI Tracking Report - ${new Date().toLocaleDateString()}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
        h2 { color: #374151; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f3f4f6; text-align: left; padding: 12px; border: 1px solid #d1d5db; font-weight: 600; }
        td { padding: 10px; border: 1px solid #d1d5db; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .status-approved { color: #059669; font-weight: 600; }
        .status-pending { color: #d97706; font-weight: 600; }
        .status-active { color: #059669; font-weight: 600; }
        .status-rejected { color: #dc2626; font-weight: 600; }
        .header-info { margin-bottom: 20px; color: #6b7280; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #d1d5db; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>COI Request Tracking Report</h1>
      <div class="header-info">
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Requests:</strong> ${requestsToPrint.length}</p>
        <p><strong>Report Type:</strong> ${request ? 'Individual Request' : 'All Engagements'}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Client Name</th>
            <th>Service Type</th>
            <th>Status</th>
            <th>Engagement Code</th>
            <th>Requester</th>
            <th>Director</th>
            <th>Partner</th>
            <th>Created Date</th>
            <th>Department</th>
          </tr>
        </thead>
        <tbody>
  `

  requestsToPrint.forEach((req: any) => {
    const statusClass = req.status === 'Active' || req.status === 'Approved' 
      ? 'status-approved' 
      : req.status === 'Rejected' || req.status === 'Lapsed'
      ? 'status-rejected'
      : 'status-pending'
    
    html += `
          <tr>
            <td><strong>${req.request_id || 'N/A'}</strong></td>
            <td>${req.client_name || 'Not specified'}</td>
            <td>${req.service_type || 'General'}</td>
            <td class="${statusClass}">${req.status || 'N/A'}</td>
            <td><code>${req.engagement_code || '-'}</code></td>
            <td>${req.requester_name || req.requestor_name || 'N/A'}</td>
            <td>${req.director_approval_by_name || (req.director_approval_by ? 'Pending' : 'N/A')}</td>
            <td>${req.partner_approved_by_name || (req.partner_approved_by ? 'Pending' : 'N/A')}</td>
            <td>${formatDate(req.created_at)}</td>
            <td>${req.department || 'N/A'}</td>
          </tr>
    `
  })

  html += `
        </tbody>
      </table>
      
      <div class="footer">
        <p>This report was generated from the COI System on ${new Date().toLocaleString()}</p>
        <p>For questions or concerns, please contact the Compliance Department.</p>
      </div>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  
  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.print()
  }, 250)
}

function exportToExcel() {
  const dataToExport = filteredHistory.value
  
  if (dataToExport.length === 0) {
    alert('No data to export')
    return
  }
  
  // Create CSV content
  const headers = ['Request ID', 'Client', 'Service Type', 'Status', 'Stage', 'Created Date', 'Engagement Code', 'Partner Decision', 'Compliance Decision', 'Restrictions']
  
  const rows = dataToExport.map(r => [
    r.request_id || '',
    r.client_name || '',
    r.service_type || '',
    r.status || '',
    r.stage || '',
    r.created_at ? new Date(r.created_at).toLocaleDateString() : '',
    r.engagement_code || '',
    r.partner_approval_status || '',
    r.compliance_approval_status || '',
    r.compliance_restrictions || r.partner_restrictions || ''
  ])
  
  // Escape CSV values
  const escapeCsv = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => escapeCsv(String(cell))).join(','))
  ].join('\n')
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `COI_Export_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function printTrackingReport() {
  // Print comprehensive tracking report with all requests
  const allRequests = requests.value.filter(r => 
    ['Pending Partner', 'Pending Finance', 'Approved', 'Active', 'Rejected', 'Lapsed'].includes(r.status)
  )
  
  if (allRequests.length === 0) {
    alert('No requests available to print')
    return
  }

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to print the report')
    return
  }

  // Group by status
  const byStatus: Record<string, any[]> = {}
  allRequests.forEach(req => {
    const status = req.status || 'Unknown'
    if (!byStatus[status]) byStatus[status] = []
    byStatus[status].push(req)
  })

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>COI Complete Tracking Report - ${new Date().toLocaleDateString()}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
        h2 { color: #374151; margin-top: 30px; margin-bottom: 15px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
        .summary-card { background: #f3f4f6; padding: 15px; border-radius: 8px; min-width: 150px; }
        .summary-card strong { display: block; font-size: 24px; color: #1f2937; }
        .summary-card span { color: #6b7280; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f3f4f6; text-align: left; padding: 12px; border: 1px solid #d1d5db; font-weight: 600; }
        td { padding: 10px; border: 1px solid #d1d5db; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .status-approved { color: #059669; font-weight: 600; }
        .status-pending { color: #d97706; font-weight: 600; }
        .status-active { color: #059669; font-weight: 600; }
        .status-rejected { color: #dc2626; font-weight: 600; }
        .header-info { margin-bottom: 20px; color: #6b7280; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #d1d5db; color: #6b7280; font-size: 12px; }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>COI Complete Tracking Report</h1>
      <div class="header-info">
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Report Period:</strong> All Active and Historical Requests</p>
      </div>
      
      <div class="summary">
        <div class="summary-card">
          <strong>${allRequests.length}</strong>
          <span>Total Requests</span>
        </div>
        <div class="summary-card">
          <strong>${activeEngagements.value.length}</strong>
          <span>Active Engagements</span>
        </div>
        <div class="summary-card">
          <strong>${pendingApprovals.value.length}</strong>
          <span>Pending Approval</span>
        </div>
        <div class="summary-card">
          <strong>${activeProposals.value.length}</strong>
          <span>Active Proposals</span>
        </div>
      </div>
  `

  // Print by status
  Object.keys(byStatus).sort().forEach(status => {
    const statusRequests = byStatus[status]
    html += `
      <h2>${status} (${statusRequests.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Client Name</th>
            <th>Service Type</th>
            <th>Engagement Code</th>
            <th>Requester</th>
            <th>Director</th>
            <th>Partner</th>
            <th>Created Date</th>
            <th>Department</th>
          </tr>
        </thead>
        <tbody>
    `
    
    statusRequests.forEach((req: any) => {
      html += `
          <tr>
            <td><strong>${req.request_id || 'N/A'}</strong></td>
            <td>${req.client_name || 'Not specified'}</td>
            <td>${req.service_type || 'General'}</td>
            <td><code>${req.engagement_code || '-'}</code></td>
            <td>${req.requester_name || req.requestor_name || 'N/A'}</td>
            <td>${req.director_approval_by_name || (req.director_approval_by ? 'Pending' : 'N/A')}</td>
            <td>${req.partner_approved_by_name || (req.partner_approved_by ? 'Pending' : 'N/A')}</td>
            <td>${formatDate(req.created_at)}</td>
            <td>${req.department || 'N/A'}</td>
          </tr>
      `
    })
    
    html += `
        </tbody>
      </table>
    `
  })

  html += `
      <div class="footer">
        <p>This comprehensive tracking report was generated from the COI System on ${new Date().toLocaleString()}</p>
        <p>For questions or concerns, please contact the Compliance Department.</p>
      </div>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  
  setTimeout(() => {
    printWindow.print()
  }, 250)
}

onMounted(() => {
  coiStore.fetchRequests()
})
</script>
