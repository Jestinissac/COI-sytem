<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Top Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">Director Dashboard</h1>
            <p class="text-sm text-gray-500 mt-1">Manage team requests and approvals</p>
          </div>
          <router-link 
            to="/coi/request/new" 
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            + New Request
          </router-link>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-6">
      <div class="flex gap-6">
        <!-- Left Sidebar Navigation -->
        <div class="hidden md:block w-56 flex-shrink-0">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
            <nav class="py-2" role="tablist">
              <template v-for="tab in tabs" :key="tab.id">
                <!-- Divider before CRM tab -->
                <div v-if="tab.divider" class="border-t border-gray-200 my-2 mx-4"></div>
                <button
                  @click="activeTab = tab.id"
                  @keydown.enter="activeTab = tab.id"
                  @keydown.space.prevent="activeTab = tab.id"
                  :aria-selected="activeTab === tab.id"
                  :aria-label="tab.label"
                  role="tab"
                  class="w-full flex items-center px-4 py-3 text-sm transition-colors border-l-2 text-left"
                  :class="activeTab === tab.id 
                    ? 'bg-gray-50 border-gray-300 text-gray-900 font-medium' 
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
                >
                  <component :is="tab.icon" class="w-5 h-5 mr-3" aria-hidden="true" />
                  {{ tab.label }}
                  <span 
                    v-if="tab.count > 0" 
                    class="ml-auto px-2 py-0.5 text-xs font-medium rounded-full"
                    :class="tab.id === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'"
                    aria-label="{{ tab.count }} items"
                  >
                    {{ tab.count }}
                  </span>
                </button>
              </template>
            </nav>
            
            <!-- Quick Actions -->
            <div class="px-4 py-4 border-t border-gray-200 space-y-2">
              <router-link 
                to="/coi/my-tasks"
                class="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                aria-label="My Tasks"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
                My Tasks
              </router-link>
            </div>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="flex-1">
          <!-- Overview Tab -->
          <div v-if="activeTab === 'overview'" class="space-y-8">
            <!-- Stats Cards - Minimal Design -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div @click="activeTab = 'pending'" class="bg-white rounded border border-gray-200 p-6 cursor-pointer hover:border-gray-400 transition-colors">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Pending Approval</p>
                    <p class="text-3xl font-semibold text-gray-900">{{ pendingApproval.length }}</p>
                  </div>
                  <div class="ml-4">
                    <svg class="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div @click="activeTab = 'team'" class="bg-white rounded border border-gray-200 p-6 cursor-pointer hover:border-gray-400 transition-colors">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">In Progress</p>
                    <p class="text-3xl font-semibold text-gray-900">{{ inProgress }}</p>
                  </div>
                  <div class="ml-4">
                    <svg class="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div @click="activeTab = 'approved'" class="bg-white rounded border border-gray-200 p-6 cursor-pointer hover:border-gray-400 transition-colors">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Approved</p>
                    <p class="text-3xl font-semibold text-gray-900">{{ approved }}</p>
                  </div>
                  <div class="ml-4">
                    <svg class="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div @click="activeTab = 'tracking'" class="bg-white rounded border border-gray-200 p-6 cursor-pointer hover:border-gray-400 transition-colors">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Active Engagements</p>
                    <p class="text-3xl font-semibold text-gray-900">{{ active }}</p>
                  </div>
                  <div class="ml-4">
                    <svg class="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Insights Charts - Hero Section -->
            <div v-if="summaryData" class="bg-white rounded border border-gray-200">
              <div class="px-8 pt-8 pb-6 border-b border-gray-100">
                <h2 class="text-xl font-semibold text-gray-900 mb-1">Insights</h2>
                <p class="text-sm text-gray-500">Click charts to filter reports</p>
              </div>
              
              <div v-if="loadingSummary" class="px-8 py-16 text-center">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
                <p class="mt-4 text-sm text-gray-500">Loading insights...</p>
              </div>
              
              <div v-else-if="summaryData" class="p-8">
                <ReportCharts
                  :summary-data="summaryData"
                  :clickable="true"
                  @status-click="handleStatusClick"
                  @service-type-click="handleServiceTypeClick"
                  @client-click="handleClientClick"
                />
              </div>
            </div>

            <!-- Recent Activity -->
            <div class="bg-white rounded border border-gray-200">
              <div class="px-8 py-6 border-b border-gray-100">
                <h2 class="text-xl font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <div class="p-8">
                <div class="space-y-4">
                  <div v-for="request in recentRequests" :key="request.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center">
                      <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <span class="text-blue-600 text-xs font-medium">{{ getInitials(request.requester_name || '') }}</span>
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
                  <div v-if="recentRequests.length === 0" class="text-center py-8 text-gray-500">
                    No recent activity
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pending Approvals Tab -->
          <div v-if="activeTab === 'pending'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900 mb-4">Pending Director Approval</h2>
                
                <!-- Filters Bar -->
                <div class="flex flex-wrap items-center gap-3">
                  <!-- Search -->
                  <div class="relative flex-1 min-w-[200px] max-w-[300px]">
                    <input 
                      v-model="searchQuery"
                      type="text" 
                      placeholder="Search by ID, client, requester..." 
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
                  
                  <!-- Risk Filter -->
                  <select 
                    v-model="pendingRiskFilter"
                    class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Risk Levels</option>
                    <option value="high">High Risk (Conflicts)</option>
                    <option value="normal">Normal</option>
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
                    <div class="text-2xl font-semibold text-gray-900">{{ enhancedFilteredPending.length }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Pending Review</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-orange-600">{{ pendingHighRiskCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">High Risk</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-gray-600">{{ pendingServiceTypeCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Service Types</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-blue-600">{{ pendingDepartmentCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Departments</div>
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
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Pending</th>
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
                    <tr v-else-if="coiStore.error && !coiStore.loading">
                      <td colspan="7" class="px-6 py-8 text-center">
                        <p class="text-red-600 font-medium">Could not load requests</p>
                        <p class="text-sm text-gray-600 mt-1">{{ coiStore.error }}</p>
                        <button type="button" @click="coiStore.fetchRequests()" class="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Retry</button>
                      </td>
                    </tr>
                    <tr v-else-if="enhancedFilteredPending.length === 0">
                      <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <p>No pending approvals</p>
                        <p class="text-sm mt-1">All caught up!</p>
                      </td>
                    </tr>
                    <tr v-for="request in enhancedFilteredPending" :key="request.id" class="hover:bg-gray-50">
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
                        <span class="text-sm text-gray-500">{{ formatDate(request.created_at || '') }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span 
                          :class="getDaysPendingClass(request)"
                          class="text-sm font-medium"
                        >
                          {{ getDaysPending(request) }} {{ getDaysPending(request) === 1 ? 'day' : 'days' }}
                        </span>
                        <p v-if="getDaysPending(request) > 14" class="text-xs text-red-600 font-medium mt-1">Overdue</p>
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
                  Showing {{ enhancedFilteredPending.length }} of {{ pendingApproval.length }} requests
                </p>
                <div class="flex items-center gap-2">
                  <button class="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50" disabled>
                    Previous
                  </button>
                  <span class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded">1</span>
                  <button class="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50" disabled>
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Team Requests Tab -->
          <div v-if="activeTab === 'team'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="font-semibold text-gray-900">Team Requests</h2>
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
                      v-model="teamSearchQuery"
                      type="text" 
                      placeholder="Search by ID, client, requester..." 
                      class="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg class="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                  
                  <!-- Status Filter -->
                  <select 
                    v-model="teamStatusFilter"
                    class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Pending Director Approval">Pending Director</option>
                    <option value="Pending Compliance">Pending Compliance</option>
                    <option value="Pending Partner">Pending Partner</option>
                    <option value="Pending Finance">Pending Finance</option>
                    <option value="Approved">Approved</option>
                    <option value="Active">Active</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  
                  <!-- Service Type Filter -->
                  <select 
                    v-model="teamServiceFilter"
                    class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Services</option>
                    <option v-for="service in uniqueServiceTypes" :key="service" :value="service">{{ service }}</option>
                  </select>
                  
                  <!-- Clear Filters -->
                  <button 
                    v-if="hasActiveTeamFilters"
                    @click="clearTeamFilters"
                    class="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
                
                <!-- Summary Stats -->
                <div class="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-gray-900">{{ filteredTeamRequests.length }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Team Requests</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-yellow-600">{{ teamPendingCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">In Progress</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-green-600">{{ teamApprovedCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Approved</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-gray-600">{{ teamDraftCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Drafts</div>
                  </div>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="request in filteredTeamRequests" :key="request.id" class="hover:bg-gray-50">
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
                          {{ getStatusLabel(request.status) }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-500">{{ formatDate(request.created_at || '') }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <button @click="viewDetails(request)" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View →
                        </button>
                      </td>
                    </tr>
                    <tr v-if="filteredTeamRequests.length === 0">
                      <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <p>No team requests found</p>
                        <p v-if="hasActiveTeamFilters" class="text-sm mt-1">Try adjusting your filters</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- Pagination -->
              <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p class="text-sm text-gray-500">
                  Showing {{ filteredTeamRequests.length }} of {{ teamRequests.length }} requests
                </p>
              </div>
            </div>
          </div>

          <!-- Approved Tab -->
          <div v-if="activeTab === 'approved'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900 mb-4">Approved Requests</h2>
                
                <!-- Filters Bar -->
                <div class="flex flex-wrap items-center gap-3">
                  <!-- Search -->
                  <div class="relative flex-1 min-w-[200px] max-w-[300px]">
                    <input 
                      v-model="approvedSearchQuery"
                      type="text" 
                      placeholder="Search by ID, client..." 
                      class="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg class="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                  
                  <!-- Status Filter -->
                  <select 
                    v-model="approvedStatusFilter"
                    class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Approved">Approved</option>
                    <option value="Active">Active</option>
                  </select>
                  
                  <!-- Service Type Filter -->
                  <select 
                    v-model="approvedServiceFilter"
                    class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Services</option>
                    <option v-for="service in uniqueServiceTypes" :key="service" :value="service">{{ service }}</option>
                  </select>
                  
                  <!-- Clear Filters -->
                  <button 
                    v-if="hasActiveApprovedFilters"
                    @click="clearApprovedFilters"
                    class="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
                
                <!-- Summary Stats -->
                <div class="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-gray-900">{{ filteredApprovedRequests.length }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Total</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-green-600">{{ approvedOnlyCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Approved</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-blue-600">{{ activeOnlyCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Active</div>
                  </div>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved Date</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="request in filteredApprovedRequests" :key="request.id" class="hover:bg-gray-50">
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
                        <span class="text-sm text-gray-500">{{ formatDate(request.director_approval_date || request.updated_at) }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <button @click="viewDetails(request)" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View →
                        </button>
                      </td>
                    </tr>
                    <tr v-if="filteredApprovedRequests.length === 0">
                      <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <p>No approved requests found</p>
                        <p v-if="hasActiveApprovedFilters" class="text-sm mt-1">Try adjusting your filters</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- Pagination -->
              <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p class="text-sm text-gray-500">
                  Showing {{ filteredApprovedRequests.length }} of {{ approvedRequests.length }} requests
                </p>
              </div>
            </div>
          </div>

          <!-- Team Tracking Tab -->
          <div v-if="activeTab === 'tracking'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h2 class="font-semibold text-gray-900">Team Tracking</h2>
                    <p class="text-sm text-gray-500 mt-1">Track proposals and engagements for you and your team</p>
                  </div>
                  <!-- Phase Filter -->
                  <div class="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      @click="trackingPhase = 'proposal'"
                      :class="trackingPhase === 'proposal' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:text-gray-900'"
                      class="px-4 py-1.5 text-sm font-medium rounded-md transition-all"
                    >
                      Proposal Tracking
                    </button>
                    <button
                      @click="trackingPhase = 'engagement'"
                      :class="trackingPhase === 'engagement' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:text-gray-900'"
                      class="px-4 py-1.5 text-sm font-medium rounded-md transition-all"
                    >
                      Engagement Tracking
                    </button>
                  </div>
                </div>
                
                <!-- Filters Bar -->
                <div class="flex flex-wrap items-center gap-3">
                  <!-- Search -->
                  <div class="relative flex-1 min-w-[200px] max-w-[300px]">
                    <input 
                      v-model="trackingSearchQuery"
                      type="text" 
                      placeholder="Search by ID, client, requester..." 
                      class="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg class="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                  
                  <!-- Service Type Filter -->
                  <select 
                    v-model="trackingServiceFilter"
                    class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Services</option>
                    <option v-for="service in uniqueServiceTypes" :key="service" :value="service">{{ service }}</option>
                  </select>
                  
                  <!-- Client Response Filter (Proposal phase only) -->
                  <select 
                    v-if="trackingPhase === 'proposal'"
                    v-model="trackingResponseFilter"
                    class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Responses</option>
                    <option value="Awaiting">Awaiting Response</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Lapsed">Lapsed</option>
                  </select>
                  
                  <!-- My Requests Only Checkbox -->
                  <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      v-model="trackingMyRequestsOnly"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    My requests only
                  </label>
                  
                  <!-- Clear Filters -->
                  <button 
                    v-if="hasActiveTrackingFilters"
                    @click="clearTrackingFilters"
                    class="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
                
                <!-- Summary Stats -->
                <div class="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-gray-900">{{ enhancedFilteredTrackingRequests.length }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">{{ trackingPhase === 'proposal' ? 'Proposals' : 'Engagements' }}</div>
                  </div>
                  <template v-if="trackingPhase === 'proposal'">
                    <div class="text-center">
                      <div class="text-2xl font-semibold text-amber-600">{{ trackingAwaitingCount }}</div>
                      <div class="text-xs text-gray-500 uppercase tracking-wide">Awaiting</div>
                    </div>
                    <div class="text-center">
                      <div class="text-2xl font-semibold text-green-600">{{ trackingAcceptedCount }}</div>
                      <div class="text-xs text-gray-500 uppercase tracking-wide">Accepted</div>
                    </div>
                    <div class="text-center">
                      <div class="text-2xl font-semibold text-gray-500">{{ trackingLapsedCount }}</div>
                      <div class="text-xs text-gray-500 uppercase tracking-wide">Lapsed</div>
                    </div>
                  </template>
                  <template v-else>
                    <div class="text-center">
                      <div class="text-2xl font-semibold text-green-600">{{ trackingActiveCount }}</div>
                      <div class="text-xs text-gray-500 uppercase tracking-wide">Active</div>
                    </div>
                    <div class="text-center">
                      <div class="text-2xl font-semibold text-amber-600">{{ trackingNearRenewalCount }}</div>
                      <div class="text-xs text-gray-500 uppercase tracking-wide">Near Renewal</div>
                    </div>
                  </template>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {{ trackingPhase === 'proposal' ? 'Client Response' : 'Renewal Date' }}
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="request in enhancedFilteredTrackingRequests" :key="request.id" class="hover:bg-gray-50">
                      <td class="px-6 py-4">
                        <span class="text-sm font-medium text-gray-900">{{ request.request_id }}</span>
                        <p v-if="request.engagement_code" class="text-xs text-gray-500 mt-1">{{ request.engagement_code }}</p>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-600">{{ request.requester_name || 'Unknown' }}</span>
                        <span 
                          v-if="String(request.requester_id) === String(authStore.user?.id)"
                          class="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
                        >
                          You
                        </span>
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
                        <template v-if="trackingPhase === 'proposal'">
                          <span 
                            :class="getClientResponseClass(request.client_response_status || (request.status === 'Lapsed' ? 'Lapsed' : 'Awaiting'))"
                            class="px-2.5 py-1 text-xs font-semibold rounded-full"
                          >
                            {{ getClientResponseLabel(request) }}
                          </span>
                          <p v-if="request.proposal_sent_date && !request.client_response_date && request.status !== 'Lapsed'" class="text-xs text-gray-500 mt-1">
                            {{ getDaysElapsed(request) }} days elapsed
                          </p>
                        </template>
                        <template v-else>
                          <span class="text-sm text-gray-600">
                            {{ getRenewalDate(request) }}
                          </span>
                          <p v-if="isNearingRenewal(request)" class="text-xs text-amber-600 font-medium">
                            ⚠ Due for renewal
                          </p>
                        </template>
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                          <!-- Proposal Phase Actions -->
                          <template v-if="trackingPhase === 'proposal'">
                            <button 
                              v-if="!request.proposal_sent_date && request.status === 'Approved'"
                              @click="openSendProposalModal(request)"
                              class="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
                            >
                              Send Proposal
                            </button>
                            <button 
                              v-if="request.proposal_sent_date && !request.client_response_date && request.status !== 'Lapsed'"
                              @click="openFollowUpModal(request)"
                              class="px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded hover:bg-amber-600"
                            >
                              Follow Up
                            </button>
                            <button 
                              v-if="request.proposal_sent_date && !request.client_response_date && request.status !== 'Lapsed'"
                              @click="openRecordResponseModal(request)"
                              class="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700"
                            >
                              Record Response
                            </button>
                          </template>
                          <button @click="viewDetails(request)" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            View →
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="enhancedFilteredTrackingRequests.length === 0">
                      <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                        </svg>
                        <p>{{ trackingPhase === 'proposal' ? 'No proposals in tracking' : 'No active engagements' }}</p>
                        <p v-if="hasActiveTrackingFilters" class="text-sm mt-1">Try adjusting your filters</p>
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

    <!-- Send Proposal Modal -->
    <div v-if="showSendProposalModal && selectedProposalRequest" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75" @click="closeSendProposalModal"></div>
        <div class="relative bg-white rounded border border-gray-200 w-full max-w-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Send Proposal</h3>
          <p class="text-sm text-gray-600 mb-4">
            Send proposal for <strong>{{ selectedProposalRequest.request_id }}</strong>
            <span v-if="selectedProposalRequest.requester_name" class="block text-xs text-gray-500">
              Requester: {{ selectedProposalRequest.requester_name }}
            </span>
          </p>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Client Email *</label>
              <input 
                v-model="proposalEmail"
                type="email"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="client@company.com"
              />
            </div>
            <div class="flex items-center gap-2">
              <input type="checkbox" v-model="includeDisclaimer" id="includeDisclaimerDir" class="rounded">
              <label for="includeDisclaimerDir" class="text-sm text-gray-600">Include 30-day validity disclaimer</label>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button @click="closeSendProposalModal" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button 
              @click="sendProposal"
              :disabled="!proposalEmail || sendingProposal"
              class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {{ sendingProposal ? 'Sending...' : 'Send Proposal' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Follow Up Modal -->
    <div v-if="showFollowUpModal && selectedProposalRequest" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75" @click="closeFollowUpModal"></div>
        <div class="relative bg-white rounded border border-gray-200 w-full max-w-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Record Follow-Up</h3>
          <p class="text-sm text-gray-600 mb-4">
            Record follow-up for <strong>{{ selectedProposalRequest.request_id }}</strong>
          </p>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Follow-Up Number</label>
              <select v-model="followUpNumber" class="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="1">1st Follow-Up</option>
                <option value="2">2nd Follow-Up</option>
                <option value="3">3rd Follow-Up</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea 
                v-model="followUpNotes"
                rows="3"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Details of the follow-up..."
              ></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button @click="closeFollowUpModal" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button 
              @click="recordFollowUp"
              :disabled="recordingFollowUp"
              class="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50"
            >
              {{ recordingFollowUp ? 'Recording...' : 'Record Follow-Up' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Record Response Modal -->
    <div v-if="showRecordResponseModal && selectedProposalRequest" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75" @click="closeRecordResponseModal"></div>
        <div class="relative bg-white rounded border border-gray-200 w-full max-w-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Record Client Response</h3>
          <p class="text-sm text-gray-600 mb-4">
            Record client response for <strong>{{ selectedProposalRequest.request_id }}</strong>
          </p>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Response Type *</label>
              <div class="flex gap-3">
                <label class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-green-50" :class="responseType === 'Accepted' ? 'border-green-500 bg-green-50' : ''">
                  <input type="radio" v-model="responseType" value="Accepted" class="text-green-600">
                  <span class="text-sm font-medium text-green-700">✓ Accepted</span>
                </label>
                <label class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-red-50" :class="responseType === 'Rejected' ? 'border-red-500 bg-red-50' : ''">
                  <input type="radio" v-model="responseType" value="Rejected" class="text-red-600">
                  <span class="text-sm font-medium text-red-700">✗ Rejected</span>
                </label>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea 
                v-model="responseNotes"
                rows="3"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes..."
              ></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button @click="closeRecordResponseModal" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button 
              @click="recordClientResponse"
              :disabled="!responseType || recordingResponse"
              class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {{ recordingResponse ? 'Recording...' : 'Record Response' }}
            </button>
          </div>

          <!-- Business Development Tab -->
          <div v-if="activeTab === 'business-dev'" class="space-y-6">
            <!-- Sub-tab Navigation -->
            <div class="bg-white rounded border border-gray-200">
              <div class="border-b border-gray-200">
                <nav class="flex -mb-px">
                  <button
                    v-for="subTab in bdSubTabs"
                    :key="subTab.id"
                    @click="activeBDSubTab = subTab.id"
                    class="px-6 py-3 text-sm font-medium border-b-2 transition-colors"
                    :class="activeBDSubTab === subTab.id 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                  >
                    {{ subTab.label }}
                  </button>
                </nav>
              </div>
              
              <!-- Sub-tab Content -->
              <div class="p-6">
                <!-- Prospects Sub-tab -->
                <BusinessDevProspects v-if="activeBDSubTab === 'prospects'" />
                
                <!-- Pipeline & Analytics Sub-tab -->
                <BusinessDevPipelineAnalytics v-else-if="activeBDSubTab === 'pipeline-analytics'" @viewReport="handleViewReport" />
                
                <!-- AI Insights Sub-tab -->
                <BusinessDevAIInsights v-else-if="activeBDSubTab === 'ai-insights'" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Toast Container -->
    <ToastContainer />
    
    <!-- Chart Data Modal -->
    <ChartDataModal
      :is-open="showDataModal"
      :title="modalTitle"
      :data="modalData"
      :loading="modalLoading"
      :show-department="true"
      @close="showDataModal = false"
      @export="handleExportData"
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
import { useToast } from '@/composables/useToast'
import api from '@/services/api'

const { success: toastSuccess, error: toastError } = useToast()
import ReportCharts from '@/components/reports/ReportCharts.vue'
import BusinessDevProspects from '@/components/business-dev/BusinessDevProspects.vue'
import BusinessDevPipelineAnalytics from '@/components/business-dev/BusinessDevPipelineAnalytics.vue'
import BusinessDevAIInsights from '@/components/business-dev/BusinessDevAIInsights.vue'
import { getLandingPageSummary } from '@/services/landingPageService'
import { getReportData, exportReportExcel, downloadBlob } from '@/services/reportService'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ChartDataModal from '@/components/dashboard/ChartDataModal.vue'
import GlobalSearch from '@/components/ui/GlobalSearch.vue'
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal.vue'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'

const router = useRouter()
const coiStore = useCOIRequestsStore()
const authStore = useAuthStore()

const activeTab = ref('overview')
const searchQuery = ref('')
const showSearch = ref(false)

// Keyboard shortcuts
const { 
  registerShortcuts, 
  showHelpModal, 
  toggleHelp, 
  getShortcutGroups, 
  formatShortcutKey 
} = useKeyboardShortcuts()

// Phase filter for Team Tracking tab
const trackingPhase = ref<'proposal' | 'engagement'>('proposal')

// ============================================
// Enhanced Filter State Variables
// ============================================

// Pending Approvals filters
const pendingServiceFilter = ref('all')
const pendingDepartmentFilter = ref('all')
const pendingRiskFilter = ref('all')

// Team Requests filters
const teamSearchQuery = ref('')
const teamStatusFilter = ref('all')
const teamServiceFilter = ref('all')

// Approved Requests filters
const approvedSearchQuery = ref('')
const approvedStatusFilter = ref('all')
const approvedServiceFilter = ref('all')

// Team Tracking filters
const trackingSearchQuery = ref('')
const trackingServiceFilter = ref('all')
const trackingResponseFilter = ref('all')
const trackingMyRequestsOnly = ref(false)

// Modal states for execution tracking
const showSendProposalModal = ref(false)
const showFollowUpModal = ref(false)
const showRecordResponseModal = ref(false)
const selectedProposalRequest = ref<any>(null)

// Modal form data
const proposalEmail = ref('')
const includeDisclaimer = ref(true)
const sendingProposal = ref(false)

const followUpNumber = ref('1')
const followUpNotes = ref('')
const recordingFollowUp = ref(false)

const responseType = ref('')
const responseNotes = ref('')
const recordingResponse = ref(false)

const loading = computed(() => coiStore.loading)
const requests = computed(() => coiStore.requests)

// Chart data for Quick Insights
const summaryData = ref<{
  byStatus?: Record<string, number>
  byServiceType?: Record<string, number>
  byClient?: Record<string, number>
} | null>(null)
const loadingSummary = ref(false)

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

const TeamIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' })
    ])
  }
}

const ApprovedIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' })
    ])
  }
}

const TrackingIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' })
    ])
  }
}

const BusinessDevIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' })
    ])
  }
}

const tabs = computed(() => [
  { id: 'overview', label: 'Overview', icon: OverviewIcon, count: 0, divider: false },
  { id: 'pending', label: 'Pending Approval', icon: PendingIcon, count: pendingApproval.value.length, divider: false },
  { id: 'team', label: 'Team Requests', icon: TeamIcon, count: teamRequests.value.length, divider: false },
  { id: 'tracking', label: 'Team Tracking', icon: TrackingIcon, count: trackableRequests.value.length, divider: false },
  { id: 'approved', label: 'Approved', icon: ApprovedIcon, count: approvedRequests.value.length, divider: false },
  { id: 'business-dev', label: 'Business Development', icon: BusinessDevIcon, count: 0, divider: true }
])

// Business Development sub-tabs
const activeBDSubTab = ref('prospects')
const bdSubTabs = [
  { id: 'prospects', label: 'Prospects' },
  { id: 'pipeline-analytics', label: 'Pipeline & Analytics' },
  { id: 'ai-insights', label: 'AI Insights' }
]

const pendingApproval = computed(() => requests.value.filter(r => r.status === 'Pending Director Approval'))
const teamRequests = computed(() => requests.value.filter(r => r.department === authStore.user?.department))
const approvedRequests = computed(() => requests.value.filter(r => 
  r.director_approval_status === 'Approved' || r.status === 'Approved' || r.status === 'Active'
))
const recentRequests = computed(() => [...requests.value].sort((a, b) => {
  const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
  const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
  return bDate - aDate
}).slice(0, 5))

// Trackable requests: Own + Team's approved/active requests
const trackableRequests = computed(() => {
  const userId = authStore.user?.id
  const userDept = authStore.user?.department
  return requests.value.filter(r => 
    (r.status === 'Approved' || r.status === 'Active' || r.status === 'Lapsed') &&
    (String(r.requester_id) === String(userId) || r.department === userDept)
  )
})

// Filtered trackable requests based on phase
const filteredTrackingRequests = computed(() => {
  if (trackingPhase.value === 'proposal') {
    // Proposal phase: Approved but not yet Active (client hasn't signed)
    return trackableRequests.value.filter(r => 
      r.status === 'Approved' || r.status === 'Lapsed' || 
      (r.status === 'Active' && !r.client_response_date)
    )
  } else {
    // Engagement phase: Active engagements (client signed)
    return trackableRequests.value.filter(r => 
      r.status === 'Active' && r.client_response_status === 'Accepted'
    )
  }
})

const inProgress = computed(() => requests.value.filter(r => r.status.includes('Pending')).length)
const approved = computed(() => requests.value.filter(r => r.status === 'Approved' || r.status === 'Active').length)
const active = computed(() => requests.value.filter(r => r.status === 'Active').length)

// Removed - using enhancedFilteredPending instead

// ============================================
// Helper Functions for Risk Detection
// ============================================
function hasRedFlags(request: any): boolean {
  // Check for conflicts or high-risk indicators
  if (request.duplication_matches) {
    try {
      const matches = typeof request.duplication_matches === 'string' 
        ? JSON.parse(request.duplication_matches) 
        : request.duplication_matches
      if (matches?.duplicates?.some((m: any) => m.conflicts?.length > 0)) {
        return true
      }
    } catch { /* ignore */ }
  }
  return false
}

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
// Enhanced Pending Approvals Filtering
// ============================================
function getDaysPending(request: any): number {
  if (!request?.created_at) return 0
  const created = new Date(request.created_at)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - created.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

function getDaysPendingClass(request: any): string {
  const days = getDaysPending(request)
  if (days > 14) return 'text-red-600'
  if (days > 7) return 'text-amber-600'
  return 'text-gray-600'
}

const enhancedFilteredPending = computed(() => {
  let filtered = pendingApproval.value
  
  // Search filter
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(r => 
      r.request_id?.toLowerCase().includes(q) ||
      r.client_name?.toLowerCase().includes(q) ||
      r.requester_name?.toLowerCase().includes(q)
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
  
  // Risk filter
  if (pendingRiskFilter.value !== 'all') {
    if (pendingRiskFilter.value === 'high') {
      filtered = filtered.filter(r => hasRedFlags(r))
    } else {
      filtered = filtered.filter(r => !hasRedFlags(r))
    }
  }
  
  // Sort by urgency: overdue first (>14 days), then by days pending (descending)
  filtered.sort((a, b) => {
    const aDays = getDaysPending(a)
    const bDays = getDaysPending(b)
    const aOverdue = aDays > 14
    const bOverdue = bDays > 14
    
    // Overdue items first
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1
    
    // Then sort by days pending (most pending first)
    return bDays - aDays
  })
  
  return filtered
})

const hasActivePendingFilters = computed(() => {
  return searchQuery.value !== '' ||
    pendingServiceFilter.value !== 'all' ||
    pendingDepartmentFilter.value !== 'all' ||
    pendingRiskFilter.value !== 'all'
})

const pendingHighRiskCount = computed(() => pendingApproval.value.filter(r => hasRedFlags(r)).length)
const pendingServiceTypeCount = computed(() => {
  const services = new Set(enhancedFilteredPending.value.map(r => r.service_type).filter(Boolean))
  return services.size
})
const pendingDepartmentCount = computed(() => {
  const depts = new Set(enhancedFilteredPending.value.map(r => r.department).filter(Boolean))
  return depts.size
})

function clearPendingFilters() {
  searchQuery.value = ''
  pendingServiceFilter.value = 'all'
  pendingDepartmentFilter.value = 'all'
  pendingRiskFilter.value = 'all'
}

// ============================================
// Enhanced Team Requests Filtering
// ============================================
const filteredTeamRequests = computed(() => {
  let filtered = teamRequests.value
  
  // Search filter
  if (teamSearchQuery.value) {
    const q = teamSearchQuery.value.toLowerCase()
    filtered = filtered.filter(r => 
      r.request_id?.toLowerCase().includes(q) ||
      r.client_name?.toLowerCase().includes(q) ||
      r.requester_name?.toLowerCase().includes(q)
    )
  }
  
  // Status filter
  if (teamStatusFilter.value !== 'all') {
    filtered = filtered.filter(r => r.status === teamStatusFilter.value)
  }
  
  // Service type filter
  if (teamServiceFilter.value !== 'all') {
    filtered = filtered.filter(r => r.service_type === teamServiceFilter.value)
  }
  
  return filtered
})

const hasActiveTeamFilters = computed(() => {
  return teamSearchQuery.value !== '' ||
    teamStatusFilter.value !== 'all' ||
    teamServiceFilter.value !== 'all'
})

const teamPendingCount = computed(() => teamRequests.value.filter(r => r.status?.includes('Pending')).length)
const teamApprovedCount = computed(() => teamRequests.value.filter(r => r.status === 'Approved' || r.status === 'Active').length)
const teamDraftCount = computed(() => teamRequests.value.filter(r => r.status === 'Draft').length)

function clearTeamFilters() {
  teamSearchQuery.value = ''
  teamStatusFilter.value = 'all'
  teamServiceFilter.value = 'all'
}

// ============================================
// Enhanced Approved Requests Filtering
// ============================================
const filteredApprovedRequests = computed(() => {
  let filtered = approvedRequests.value
  
  // Search filter
  if (approvedSearchQuery.value) {
    const q = approvedSearchQuery.value.toLowerCase()
    filtered = filtered.filter(r => 
      r.request_id?.toLowerCase().includes(q) ||
      r.client_name?.toLowerCase().includes(q)
    )
  }
  
  // Status filter
  if (approvedStatusFilter.value !== 'all') {
    filtered = filtered.filter(r => r.status === approvedStatusFilter.value)
  }
  
  // Service type filter
  if (approvedServiceFilter.value !== 'all') {
    filtered = filtered.filter(r => r.service_type === approvedServiceFilter.value)
  }
  
  return filtered
})

const hasActiveApprovedFilters = computed(() => {
  return approvedSearchQuery.value !== '' ||
    approvedStatusFilter.value !== 'all' ||
    approvedServiceFilter.value !== 'all'
})

const approvedOnlyCount = computed(() => approvedRequests.value.filter(r => r.status === 'Approved').length)
const activeOnlyCount = computed(() => approvedRequests.value.filter(r => r.status === 'Active').length)

function clearApprovedFilters() {
  approvedSearchQuery.value = ''
  approvedStatusFilter.value = 'all'
  approvedServiceFilter.value = 'all'
}

// ============================================
// Enhanced Team Tracking Filtering
// ============================================
const enhancedFilteredTrackingRequests = computed(() => {
  let filtered = filteredTrackingRequests.value
  
  // Search filter
  if (trackingSearchQuery.value) {
    const q = trackingSearchQuery.value.toLowerCase()
    filtered = filtered.filter(r => 
      r.request_id?.toLowerCase().includes(q) ||
      r.client_name?.toLowerCase().includes(q) ||
      r.requester_name?.toLowerCase().includes(q)
    )
  }
  
  // Service type filter
  if (trackingServiceFilter.value !== 'all') {
    filtered = filtered.filter(r => r.service_type === trackingServiceFilter.value)
  }
  
  // Client response filter (proposal phase only)
  if (trackingPhase.value === 'proposal' && trackingResponseFilter.value !== 'all') {
    filtered = filtered.filter(r => {
      if (trackingResponseFilter.value === 'Awaiting') {
        return r.proposal_sent_date && !r.client_response_date && r.status !== 'Lapsed'
      } else if (trackingResponseFilter.value === 'Lapsed') {
        return r.status === 'Lapsed'
      } else {
        return r.client_response_status === trackingResponseFilter.value
      }
    })
  }
  
  // My requests only filter
  if (trackingMyRequestsOnly.value) {
    const userId = authStore.user?.id
    filtered = filtered.filter(r => String(r.requester_id) === String(userId))
  }
  
  return filtered
})

const hasActiveTrackingFilters = computed(() => {
  return trackingSearchQuery.value !== '' ||
    trackingServiceFilter.value !== 'all' ||
    trackingResponseFilter.value !== 'all' ||
    trackingMyRequestsOnly.value
})

const trackingAwaitingCount = computed(() => 
  filteredTrackingRequests.value.filter(r => 
    r.proposal_sent_date && !r.client_response_date && r.status !== 'Lapsed'
  ).length
)
const trackingAcceptedCount = computed(() => 
  filteredTrackingRequests.value.filter(r => r.client_response_status === 'Accepted').length
)
const trackingLapsedCount = computed(() => 
  filteredTrackingRequests.value.filter(r => r.status === 'Lapsed').length
)
const trackingActiveCount = computed(() => 
  filteredTrackingRequests.value.filter(r => r.status === 'Active').length
)
const trackingNearRenewalCount = computed(() => 
  filteredTrackingRequests.value.filter(r => isNearingRenewal(r)).length
)

function clearTrackingFilters() {
  trackingSearchQuery.value = ''
  trackingServiceFilter.value = 'all'
  trackingResponseFilter.value = 'all'
  trackingMyRequestsOnly.value = false
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    'Draft': 'bg-gray-100 text-gray-700',
    'Pending Director Approval': 'bg-orange-100 text-orange-700',
    'Pending Compliance': 'bg-blue-100 text-blue-700',
    'Pending Partner': 'bg-purple-100 text-purple-700',
    'Pending Finance': 'bg-indigo-100 text-indigo-700',
    'Approved': 'bg-green-100 text-green-700',
    'Approved with Restrictions': 'bg-yellow-100 text-yellow-700',
    'Active': 'bg-green-100 text-green-700',
    'Rejected': 'bg-red-100 text-red-700',
    'Need More Info': 'bg-amber-100 text-amber-700'
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    'Pending Director Approval': 'Pending Director',
    'Pending Compliance': 'In Compliance',
    'Pending Partner': 'Pending Partner',
    'Pending Finance': 'Finance Review',
    'Approved with Restrictions': 'Approved*'
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

// Client response helpers
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
  if (request.proposal_sent_date && !request.client_response_date) return 'Awaiting'
  return 'Pending'
}

function getDaysElapsed(request: any): number {
  if (!request.proposal_sent_date) return 0
  const sent = new Date(request.proposal_sent_date)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - sent.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getRenewalDate(request: any): string {
  if (!request.client_response_date && !request.engagement_start_date) return 'N/A'
  const startDate = new Date(request.engagement_start_date || request.client_response_date)
  const renewalDate = new Date(startDate)
  renewalDate.setFullYear(renewalDate.getFullYear() + 3)
  return renewalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isNearingRenewal(request: any): boolean {
  if (!request.client_response_date && !request.engagement_start_date) return false
  const startDate = new Date(request.engagement_start_date || request.client_response_date)
  const renewalDate = new Date(startDate)
  renewalDate.setFullYear(renewalDate.getFullYear() + 3)
  const now = new Date()
  const daysUntilRenewal = Math.floor((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return daysUntilRenewal <= 90 && daysUntilRenewal > 0
}

// Send Proposal Modal
function openSendProposalModal(request: any) {
  selectedProposalRequest.value = request
  proposalEmail.value = ''
  includeDisclaimer.value = true
  showSendProposalModal.value = true
}

function closeSendProposalModal() {
  showSendProposalModal.value = false
  selectedProposalRequest.value = null
}

async function sendProposal() {
  if (!selectedProposalRequest.value || !proposalEmail.value) return
  
  sendingProposal.value = true
  try {
    await api.post(`/coi/execution/${selectedProposalRequest.value.id}/send-proposal`, {
      sent_to: proposalEmail.value,
      include_disclaimer: includeDisclaimer.value
    })
    toastSuccess('Proposal sent successfully!')
    closeSendProposalModal()
    coiStore.fetchRequests()
  } catch (error: any) {
    console.error('Error sending proposal:', error)
    toastError(error.response?.data?.error || 'Failed to send proposal')
  } finally {
    sendingProposal.value = false
  }
}

// Follow Up Modal
function openFollowUpModal(request: any) {
  selectedProposalRequest.value = request
  followUpNumber.value = '1'
  followUpNotes.value = ''
  showFollowUpModal.value = true
}

function closeFollowUpModal() {
  showFollowUpModal.value = false
  selectedProposalRequest.value = null
}

async function recordFollowUp() {
  if (!selectedProposalRequest.value) return
  
  recordingFollowUp.value = true
  try {
    await api.post(`/coi/execution/${selectedProposalRequest.value.id}/follow-up`, {
      follow_up_number: followUpNumber.value,
      notes: followUpNotes.value
    })
    toastSuccess('Follow-up recorded successfully!')
    closeFollowUpModal()
    coiStore.fetchRequests()
  } catch (error: any) {
    console.error('Error recording follow-up:', error)
    toastError(error.response?.data?.error || 'Failed to record follow-up')
  } finally {
    recordingFollowUp.value = false
  }
}

// Record Response Modal
function openRecordResponseModal(request: any) {
  selectedProposalRequest.value = request
  responseType.value = ''
  responseNotes.value = ''
  showRecordResponseModal.value = true
}

function closeRecordResponseModal() {
  showRecordResponseModal.value = false
  selectedProposalRequest.value = null
}

async function recordClientResponse() {
  if (!selectedProposalRequest.value || !responseType.value) return
  
  recordingResponse.value = true
  try {
    await api.post(`/coi/execution/${selectedProposalRequest.value.id}/response`, {
      response_type: responseType.value,
      notes: responseNotes.value
    })
    toastSuccess('Client response recorded successfully!')
    closeRecordResponseModal()
    coiStore.fetchRequests()
  } catch (error: any) {
    console.error('Error recording response:', error)
    toastError(error.response?.data?.error || 'Failed to record client response')
  } finally {
    recordingResponse.value = false
  }
}

// Load summary data for charts
async function loadSummaryData() {
  if (!authStore.user?.role) {
    return
  }

  loadingSummary.value = true
  try {
    const data = await getLandingPageSummary(authStore.user.role)
    if (data && (data.byStatus || data.byServiceType || data.byClient)) {
      summaryData.value = data
    }
  } catch (error) {
    console.error('Error loading summary data:', error)
  } finally {
    loadingSummary.value = false
  }
}

// Modal state for chart data
const showDataModal = ref(false)
const modalData = ref<any[]>([])
const modalTitle = ref('')
const modalLoading = ref(false)
const currentFilter = ref<{ status?: string; serviceType?: string; clientName?: string }>({})

// Handle chart clicks - open modal with filtered data
async function handleStatusClick(status: string) {
  modalTitle.value = `Requests with Status: ${status}`
  modalLoading.value = true
  showDataModal.value = true
  currentFilter.value = { status }
  
  try {
    const reportData = await getReportData(
      'director',
      'department-overview',
      { status, includeData: true, pageSize: 500 }
    )
    modalData.value = reportData.requests || []
  } catch (error) {
    console.error('Error loading chart data:', error)
    toastError('Failed to load request data')
    modalData.value = []
  } finally {
    modalLoading.value = false
  }
}

async function handleServiceTypeClick(serviceType: string) {
  modalTitle.value = `Requests for Service Type: ${serviceType}`
  modalLoading.value = true
  showDataModal.value = true
  currentFilter.value = { serviceType }
  
  try {
    const reportData = await getReportData(
      'director',
      'department-overview',
      { serviceType, includeData: true, pageSize: 500 }
    )
    modalData.value = reportData.requests || []
  } catch (error) {
    console.error('Error loading chart data:', error)
    toastError('Failed to load request data')
    modalData.value = []
  } finally {
    modalLoading.value = false
  }
}

async function handleClientClick(clientName: string) {
  modalTitle.value = `Requests for Client: ${clientName}`
  modalLoading.value = true
  showDataModal.value = true
  currentFilter.value = { clientName }
  
  try {
    const reportData = await getReportData(
      'director',
      'department-overview',
      { clientName, includeData: true, pageSize: 500 }
    )
    modalData.value = reportData.requests || []
  } catch (error) {
    console.error('Error loading chart data:', error)
    toastError('Failed to load request data')
    modalData.value = []
  } finally {
    modalLoading.value = false
  }
}

// Handle export from modal
async function handleExportData() {
  try {
    const blob = await exportReportExcel(
      'director',
      'department-overview',
      { ...currentFilter.value, includeData: true }
    )
    downloadBlob(blob, `coi-requests-${Date.now()}.xlsx`)
    toastSuccess('Data exported successfully')
  } catch (error) {
    console.error('Error exporting data:', error)
    toastError('Failed to export data')
  }
}

// Handle CRM card click - navigate to reports
function handleViewReport(reportType: string) {
  router.push({ path: '/coi/reports', query: { report: reportType } })
}

onMounted(() => {
  coiStore.fetchRequests()
  loadSummaryData()
  
  registerShortcuts([
    {
      key: 'k',
      description: 'Open search',
      handler: () => { showSearch.value = true },
      modifier: 'ctrl',
      group: 'Navigation'
    },
    {
      key: '/',
      description: 'Show keyboard shortcuts',
      handler: toggleHelp,
      modifier: 'ctrl',
      group: 'General'
    }
  ])
})
</script>
