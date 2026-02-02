<template>
  <div class="bg-gray-100">
    <!-- Top Header -->
    <div class="bg-white border-b border-gray-200 mb-6">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">Finance Dashboard</h1>
            <p class="text-sm text-gray-500 mt-1">Engagement code generation and PRMS synchronization</p>
          </div>
        </div>
      </div>
    </div>

    <div class="px-6 pb-6">
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
              <div @click="activeTab = 'pending'" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Pending Finance</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ pendingFinance.length }}</p>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div @click="activeTab = 'codes'" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Code Queue</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ codeGenerationQueue }}</p>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div @click="activeTab = 'codes'" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-green-300 transition-all">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Active Engagements</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ activeEngagements }}</p>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div @click="activeTab = 'codes'" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-purple-300 transition-all">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Codes Generated</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ engagementCodesCount }}</p>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recent Codes -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900">Recent Engagement Codes</h2>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement Code</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="code in recentCodes" :key="code.engagement_code" class="hover:bg-gray-50">
                      <td class="px-6 py-4">
                        <span class="text-sm font-mono font-medium text-gray-900">{{ code.engagement_code }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-600">{{ code.request_id }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-600">{{ code.client_name || 'Not specified' }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">Active</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-500">{{ formatDate(code.created_at) }}</span>
                      </td>
                    </tr>
                    <tr v-if="recentCodes.length === 0">
                      <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                        No engagement codes generated yet
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Pending Finance Tab -->
          <div v-if="activeTab === 'pending'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="font-semibold text-gray-900">Pending Finance Approval</h2>
                  <button class="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Export
                  </button>
                </div>
                
                <!-- Filters Bar -->
                <div class="flex flex-wrap items-center gap-3">
                  <!-- Search -->
                  <div class="relative flex-1 min-w-[200px] max-w-[300px]">
                    <input 
                      v-model="searchQuery"
                      type="text" 
                      placeholder="Search by ID, client..." 
                      class="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg class="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                  
                  <!-- Service Type Filter -->
                  <select 
                    v-model="pendingServiceFilter"
                    class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Services</option>
                    <option v-for="service in uniqueServiceTypes" :key="service" :value="service">{{ service }}</option>
                  </select>
                  
                  <!-- Department Filter -->
                  <select 
                    v-model="pendingDepartmentFilter"
                    class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Departments</option>
                    <option v-for="dept in uniqueDepartments" :key="dept" :value="dept">{{ dept }}</option>
                  </select>
                  
                  <!-- Code Status Filter -->
                  <select 
                    v-model="pendingCodeStatusFilter"
                    class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="needs_code">Needs Code</option>
                    <option value="has_code">Has Code</option>
                  </select>
                  
                  <!-- Clear Filters -->
                  <button 
                    v-if="hasActivePendingFilters"
                    @click="clearPendingFilters"
                    class="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
                
                <!-- Summary Stats -->
                <div class="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-gray-900">{{ enhancedFilteredRequests.length }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Pending Finance</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-blue-600">{{ pendingNeedsCodeCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Needs Code</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-green-600">{{ pendingHasCodeCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Has Code</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-gray-600">{{ pendingServiceTypeCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Service Types</div>
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
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-if="loading">
                      <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        <div class="flex items-center justify-center">
                          <svg class="animate-spin h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </div>
                      </td>
                    </tr>
                    <tr v-else-if="coiStore.error && !loading">
                      <td colspan="6" class="px-6 py-8 text-center">
                        <p class="text-red-600 font-medium">Could not load requests</p>
                        <p class="text-sm text-gray-600 mt-1">{{ coiStore.error }}</p>
                        <button type="button" @click="coiStore.fetchRequests()" class="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Retry</button>
                      </td>
                    </tr>
                    <tr v-else-if="enhancedFilteredRequests.length === 0">
                      <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <p>No pending requests</p>
                      </td>
                    </tr>
                    <tr v-for="request in enhancedFilteredRequests" :key="request.id" class="hover:bg-gray-50">
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
                        <span class="text-sm text-gray-500">{{ formatDate(request.created_at) }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                          <button 
                            v-if="!request.engagement_code"
                            @click.stop="openCodeGenerationModal(request)" 
                            class="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors"
                          >
                            Generate Code
                          </button>
                          <div v-else class="flex items-center gap-2">
                            <code class="text-xs font-mono font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                              {{ request.engagement_code }}
                            </code>
                            <button
                              @click="viewCodeDetails(request)"
                              class="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded"
                              title="View code details"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination -->
              <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p class="text-sm text-gray-500">
                  Showing {{ enhancedFilteredRequests.length }} of {{ pendingFinance.length }} requests
                </p>
              </div>
            </div>
          </div>

          <!-- Engagement Codes Tab -->
          <div v-if="activeTab === 'codes'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900 mb-4">All Engagement Codes</h2>
                
                <!-- Filters Bar -->
                <div class="flex flex-wrap items-center gap-3">
                  <!-- Search -->
                  <div class="relative flex-1 min-w-[200px] max-w-[300px]">
                    <input 
                      v-model="codeSearchQuery"
                      type="text" 
                      placeholder="Search by code, client..." 
                      class="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg class="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                  
                  <!-- Status Filter -->
                  <select 
                    v-model="codeStatusFilter"
                    class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Approved">Approved</option>
                    <option value="Active">Active</option>
                  </select>
                  
                  <!-- Service Type Filter -->
                  <select 
                    v-model="codeServiceFilter"
                    class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Services</option>
                    <option v-for="service in uniqueServiceTypes" :key="service" :value="service">{{ service }}</option>
                  </select>
                  
                  <!-- Risk Filter -->
                  <select 
                    v-model="codeRiskFilter"
                    class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Risk Levels</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Very High">Very High</option>
                  </select>
                  
                  <!-- Clear Filters -->
                  <button 
                    v-if="hasActiveCodeFilters"
                    @click="clearCodeFilters"
                    class="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
                
                <!-- Summary Stats -->
                <div class="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-gray-900">{{ enhancedEngagementCodes.length }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Total Codes</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-green-600">{{ codesActiveCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Active</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-blue-600">{{ codesApprovedCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Approved</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-amber-600">{{ codesHighRiskCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">High Risk</div>
                  </div>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement Code</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Financial Details</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="code in enhancedEngagementCodes" :key="code.engagement_code" class="hover:bg-gray-50">
                      <td class="px-6 py-4">
                        <span class="text-sm font-mono font-medium text-gray-900">{{ code.engagement_code }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-600">{{ code.request_id }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-600">{{ code.client_name || 'Not specified' }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <div v-if="getFinancialParams(code)" class="text-xs space-y-1">
                          <div v-if="getFinancialParams(code).currency">
                            <span class="text-gray-500">Currency:</span>
                            <span class="ml-1 font-medium text-gray-900">{{ getFinancialParams(code).currency }}</span>
                          </div>
                          <div v-if="getFinancialParams(code).risk_assessment">
                            <span class="text-gray-500">Risk:</span>
                            <span 
                              :class="{
                                'text-green-700': getFinancialParams(code).risk_assessment === 'Low',
                                'text-yellow-700': getFinancialParams(code).risk_assessment === 'Medium',
                                'text-orange-700': getFinancialParams(code).risk_assessment === 'High',
                                'text-red-700': getFinancialParams(code).risk_assessment === 'Very High'
                              }"
                              class="ml-1 font-medium"
                            >
                              {{ getFinancialParams(code).risk_assessment }}
                            </span>
                          </div>
                        </div>
                        <span v-else class="text-xs text-gray-400">No financial data</span>
                      </td>
                      <td class="px-6 py-4">
                        <span :class="getStatusClass(code.status)" class="px-2 py-1 text-xs font-medium rounded">
                          {{ code.status }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <button @click="viewDetails(code)" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View →
                        </button>
                      </td>
                    </tr>
                    <tr v-if="enhancedEngagementCodes.length === 0">
                      <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
                        </svg>
                        <p>No engagement codes found</p>
                        <p v-if="hasActiveCodeFilters" class="text-sm mt-1">Try adjusting your filters</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- PRMS Sync Tab -->
          <div v-if="activeTab === 'prms'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900">PRMS Synchronization Status</h2>
                <p class="text-sm text-gray-500 mt-1">Engagement codes synced with PRMS system</p>
              </div>
              
              <div class="p-6">
                <!-- Sync Status -->
                <div class="grid grid-cols-3 gap-4 mb-6">
                  <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div class="flex items-center">
                      <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-green-800">Synced</p>
                        <p class="text-xl font-bold text-green-900">{{ prmsSyncCount }}</p>
                      </div>
                    </div>
                  </div>
                  <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div class="flex items-center">
                      <div class="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                        <svg class="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                        </svg>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-yellow-800">Pending Sync</p>
                        <p class="text-xl font-bold text-yellow-900">{{ pendingSyncCount }}</p>
                      </div>
                    </div>
                  </div>
                  <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div class="flex items-center">
                      <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                        <svg class="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                        </svg>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-red-800">Sync Failed</p>
                        <p class="text-xl font-bold text-red-900">0</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="text-center py-4">
                  <button class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700">
                    Sync Now
                  </button>
                  <p class="text-xs text-gray-500 mt-2">Last sync: {{ lastSyncTime }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Code Generation Modal -->
    <CodeGenerationModal
      v-if="showCodeModal && selectedRequest"
      :show="showCodeModal"
      :request="selectedRequest"
      @close="closeCodeModal"
      @success="handleCodeGenerated"
    />

    <!-- Keyboard Shortcuts Modal -->
    <KeyboardShortcutsModal
      :is-open="showHelpModal"
      :shortcut-groups="getShortcutGroups()"
      :format-key="formatShortcutKey"
      @close="showHelpModal = false"
    />

    <!-- Global Search -->
    <GlobalSearch
      :is-open="showSearch"
      :user-role="authStore.user?.role"
      :user-id="authStore.user?.id"
      :user-department="authStore.user?.department"
      @close="showSearch = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useCOIRequestsStore } from '@/stores/coiRequests'
import { useAuthStore } from '@/stores/auth'
import CodeGenerationModal from '@/components/finance/CodeGenerationModal.vue'
import { useToast } from '@/composables/useToast'
import GlobalSearch from '@/components/ui/GlobalSearch.vue'
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal.vue'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'

const router = useRouter()
const coiStore = useCOIRequestsStore()
const authStore = useAuthStore()
const toast = useToast()

const showSearch = ref(false)

// Keyboard shortcuts
const { 
  registerShortcuts, 
  showHelpModal, 
  toggleHelp, 
  getShortcutGroups, 
  formatShortcutKey 
} = useKeyboardShortcuts()

const activeTab = ref('overview')
const searchQuery = ref('')
const codeSearchQuery = ref('')
const showCodeModal = ref(false)
const selectedRequest = ref<any>(null)

// ============================================
// Enhanced Filter State Variables
// ============================================

// Pending Finance filters
const pendingServiceFilter = ref('all')
const pendingDepartmentFilter = ref('all')
const pendingCodeStatusFilter = ref('all')

// Engagement Codes filters
const codeStatusFilter = ref('all')
const codeServiceFilter = ref('all')
const codeRiskFilter = ref('all')

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
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' })
    ])
  }
}

const CodesIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14' })
    ])
  }
}

const PRMSIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' })
    ])
  }
}

const tabs = computed(() => [
  { id: 'overview', label: 'Overview', icon: OverviewIcon, count: 0, alertColor: '' },
  { id: 'pending', label: 'Pending Finance', icon: PendingIcon, count: pendingFinance.value.length, alertColor: 'bg-indigo-100 text-indigo-700' },
  { id: 'codes', label: 'Engagement Codes', icon: CodesIcon, count: engagementCodesCount.value, alertColor: 'bg-gray-100 text-gray-600' },
  { id: 'prms', label: 'PRMS Sync', icon: PRMSIcon, count: pendingSyncCount.value, alertColor: 'bg-yellow-100 text-yellow-700' }
])

const pendingFinance = computed(() => requests.value.filter(r => r.status === 'Pending Finance'))
const codeGenerationQueue = computed(() => requests.value.filter(r => r.status === 'Approved' && !r.engagement_code).length)
const activeEngagements = computed(() => requests.value.filter(r => r.status === 'Active').length)
const engagementCodesCount = computed(() => requests.value.filter(r => r.engagement_code).length)
const prmsSyncCount = computed(() => requests.value.filter(r => r.engagement_code && r.status === 'Active').length)
const pendingSyncCount = computed(() => requests.value.filter(r => r.engagement_code && r.status === 'Approved').length)
const recentCodes = computed(() => requests.value.filter(r => r.engagement_code).slice(0, 5))
const allEngagementCodes = computed(() => {
  let codes = requests.value.filter(r => r.engagement_code)
  if (codeSearchQuery.value) {
    const q = codeSearchQuery.value.toLowerCase()
    codes = codes.filter(r => 
      r.engagement_code?.toLowerCase().includes(q) ||
      r.client_name?.toLowerCase().includes(q)
    )
  }
  return codes
})

const lastSyncTime = computed(() => {
  const now = new Date()
  return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
})

const filteredRequests = computed(() => {
  if (!searchQuery.value) return pendingFinance.value
  const q = searchQuery.value.toLowerCase()
  return pendingFinance.value.filter(r => 
    r.request_id?.toLowerCase().includes(q) ||
    r.client_name?.toLowerCase().includes(q)
  )
})

// ============================================
// Unique Values for Filters
// ============================================
const uniqueServiceTypes = computed(() => {
  const services = new Set<string>()
  requests.value.forEach(r => {
    if (r.service_type) services.add(r.service_type)
  })
  return Array.from(services).sort()
})

const uniqueDepartments = computed(() => {
  const depts = new Set<string>()
  requests.value.forEach(r => {
    if (r.department) depts.add(r.department)
  })
  return Array.from(depts).sort()
})

// ============================================
// Enhanced Pending Finance Filtering
// ============================================
const enhancedFilteredRequests = computed(() => {
  let filtered = pendingFinance.value
  
  // Search filter
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(r => 
      r.request_id?.toLowerCase().includes(q) ||
      r.client_name?.toLowerCase().includes(q)
    )
  }
  
  // Service type filter
  if (pendingServiceFilter.value !== 'all') {
    filtered = filtered.filter(r => r.service_type === pendingServiceFilter.value)
  }
  
  // Department filter
  if (pendingDepartmentFilter.value !== 'all') {
    filtered = filtered.filter(r => r.department === pendingDepartmentFilter.value)
  }
  
  // Code status filter
  if (pendingCodeStatusFilter.value !== 'all') {
    if (pendingCodeStatusFilter.value === 'needs_code') {
      filtered = filtered.filter(r => !r.engagement_code)
    } else if (pendingCodeStatusFilter.value === 'has_code') {
      filtered = filtered.filter(r => r.engagement_code)
    }
  }
  
  return filtered
})

const hasActivePendingFilters = computed(() => {
  return searchQuery.value !== '' ||
    pendingServiceFilter.value !== 'all' ||
    pendingDepartmentFilter.value !== 'all' ||
    pendingCodeStatusFilter.value !== 'all'
})

const pendingNeedsCodeCount = computed(() => pendingFinance.value.filter(r => !r.engagement_code).length)
const pendingHasCodeCount = computed(() => pendingFinance.value.filter(r => r.engagement_code).length)
const pendingServiceTypeCount = computed(() => {
  const services = new Set(enhancedFilteredRequests.value.map(r => r.service_type).filter(Boolean))
  return services.size
})

function clearPendingFilters() {
  searchQuery.value = ''
  pendingServiceFilter.value = 'all'
  pendingDepartmentFilter.value = 'all'
  pendingCodeStatusFilter.value = 'all'
}

// ============================================
// Enhanced Engagement Codes Filtering
// ============================================
const enhancedEngagementCodes = computed(() => {
  let codes = requests.value.filter(r => r.engagement_code)
  
  // Search filter
  if (codeSearchQuery.value) {
    const q = codeSearchQuery.value.toLowerCase()
    codes = codes.filter(r => 
      r.engagement_code?.toLowerCase().includes(q) ||
      r.client_name?.toLowerCase().includes(q)
    )
  }
  
  // Status filter
  if (codeStatusFilter.value !== 'all') {
    codes = codes.filter(r => r.status === codeStatusFilter.value)
  }
  
  // Service type filter
  if (codeServiceFilter.value !== 'all') {
    codes = codes.filter(r => r.service_type === codeServiceFilter.value)
  }
  
  // Risk filter
  if (codeRiskFilter.value !== 'all') {
    codes = codes.filter(r => {
      const params = getFinancialParams(r)
      return params?.risk_assessment === codeRiskFilter.value
    })
  }
  
  return codes
})

const hasActiveCodeFilters = computed(() => {
  return codeSearchQuery.value !== '' ||
    codeStatusFilter.value !== 'all' ||
    codeServiceFilter.value !== 'all' ||
    codeRiskFilter.value !== 'all'
})

const codesActiveCount = computed(() => 
  requests.value.filter(r => r.engagement_code && r.status === 'Active').length
)
const codesApprovedCount = computed(() => 
  requests.value.filter(r => r.engagement_code && r.status === 'Approved').length
)
const codesHighRiskCount = computed(() => 
  requests.value.filter(r => {
    if (!r.engagement_code) return false
    const params = getFinancialParams(r)
    return params?.risk_assessment === 'High' || params?.risk_assessment === 'Very High'
  }).length
)

function clearCodeFilters() {
  codeSearchQuery.value = ''
  codeStatusFilter.value = 'all'
  codeServiceFilter.value = 'all'
  codeRiskFilter.value = 'all'
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    'Approved': 'bg-green-100 text-green-700',
    'Active': 'bg-green-100 text-green-700',
    'Pending Finance': 'bg-indigo-100 text-indigo-700'
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getFinancialParams(request: any) {
  if (!request?.financial_parameters) return null
  try {
    return typeof request.financial_parameters === 'string'
      ? JSON.parse(request.financial_parameters)
      : request.financial_parameters
  } catch {
    return null
  }
}

function viewDetails(request: any) {
  router.push(`/coi/request/${request.id}`)
}

function openCodeGenerationModal(request: any) {
  try {
    console.log('[FinanceDashboard] openCodeGenerationModal called with request:', request)
    
    if (!request) {
      console.error('[FinanceDashboard] No request provided to openCodeGenerationModal')
      toast.error('Invalid request. Please try again.')
      return
    }
    
    // Verify request has required properties
    if (!request.id && !request.request_id) {
      console.error('[FinanceDashboard] Request missing ID:', request)
      toast.error('Invalid request data. Request ID is missing. Please refresh the page.')
      return
    }
    
    if (request.engagement_code) {
      toast.error('Engagement code already generated for this request')
      return
    }
    
    console.log('[FinanceDashboard] Opening modal for request:', {
      id: request.id,
      request_id: request.request_id,
      service_type: request.service_type,
      client_name: request.client_name
    })
    
    selectedRequest.value = request
    showCodeModal.value = true
  } catch (error) {
    console.error('[FinanceDashboard] Error opening code generation modal:', error)
    toast.error('Failed to open code generation form. Please try again.')
  }
}

function closeCodeModal() {
  showCodeModal.value = false
  selectedRequest.value = null
}

function handleCodeGenerated(code: string) {
  toast.success(`Engagement code ${code} generated successfully`)
  // Refresh requests to show updated status
  coiStore.fetchRequests()
  closeCodeModal()
}

function viewCodeDetails(request: any) {
  router.push(`/coi/request/${request.id}`)
}

onMounted(() => {
  coiStore.fetchRequests()
})
</script>
