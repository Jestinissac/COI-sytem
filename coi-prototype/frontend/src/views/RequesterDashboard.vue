<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Top Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">My Requests</h1>
            <p class="text-sm text-gray-500 mt-1">Track and manage your COI requests</p>
          </div>
          <router-link 
            to="/coi/request/new" 
            class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
          >
            + New Request
          </router-link>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <!-- Mobile Menu Button -->
      <button 
        @click="sidebarOpen = !sidebarOpen"
        class="md:hidden mb-4 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label="Toggle navigation menu"
        :aria-expanded="sidebarOpen"
      >
        <svg v-if="!sidebarOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
        <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <div class="flex gap-6">
        <!-- Left Sidebar Navigation - Mobile Responsive -->
        <aside 
          :class="[
            'w-64 flex-shrink-0 transition-transform duration-300 ease-in-out',
            'md:translate-x-0 md:static md:block',
            sidebarOpen ? 'translate-x-0 fixed inset-y-0 left-0 z-50 md:relative' : '-translate-x-full md:translate-x-0'
          ]"
        >
          <!-- Mobile Overlay -->
          <div 
            v-if="sidebarOpen"
            @click="sidebarOpen = false"
            class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            aria-hidden="true"
          ></div>
          
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6 h-full md:h-auto overflow-y-auto md:overflow-y-visible">
            <nav class="py-2" role="tablist">
              <template v-for="tab in tabs" :key="tab.id">
                <!-- Divider before CRM tab -->
                <div v-if="tab.divider" class="border-t border-gray-200 my-2 mx-4"></div>
                <button
                  @click="activeTab = tab.id; sidebarOpen = false"
                  @keydown.enter="activeTab = tab.id; sidebarOpen = false"
                  @keydown.space.prevent="activeTab = tab.id; sidebarOpen = false"
                  :aria-selected="activeTab === tab.id"
                  :aria-label="`${tab.label} tab`"
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
                    :class="tab.alertColor"
                    :aria-label="`${tab.count} items`"
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
                @click="sidebarOpen = false"
                class="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                aria-label="My Tasks"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
                My Tasks
              </router-link>
              <router-link 
                to="/coi/request/new"
                @click="sidebarOpen = false"
                class="flex items-center justify-center w-full px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="Create new COI request"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                New Request
              </router-link>
            </div>
          </div>
        </aside>

        <!-- Main Content Area -->
        <div class="flex-1">
          <!-- Overview Tab -->
          <div v-if="activeTab === 'overview'" class="space-y-8">
            <!-- Stats Cards - Minimal Design -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div @click="activeTab = 'all'" class="bg-white rounded border border-gray-200 p-6 cursor-pointer hover:border-gray-400 transition-colors">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Total Requests</p>
                    <p class="text-3xl font-semibold text-gray-900">{{ totalRequests }}</p>
                  </div>
                  <div class="ml-4">
                    <svg class="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div @click="activeTab = 'pending'" class="bg-white rounded border border-gray-200 p-6 cursor-pointer hover:border-gray-400 transition-colors">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">In Progress</p>
                    <p class="text-3xl font-semibold text-gray-900">{{ inProgressCount }}</p>
                  </div>
                  <div class="ml-4">
                    <svg class="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div @click="activeTab = 'active'" class="bg-white rounded border border-gray-200 p-6 cursor-pointer hover:border-gray-400 transition-colors">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Approved</p>
                    <p class="text-3xl font-semibold text-gray-900">{{ approvedCount }}</p>
                  </div>
                  <div class="ml-4">
                    <svg class="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div @click="activeTab = 'drafts'" class="bg-white rounded border border-gray-200 p-6 cursor-pointer hover:border-gray-500 transition-colors group">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Drafts</p>
                    <p class="text-3xl font-semibold text-gray-900">{{ draftCount }}</p>
                  </div>
                  <div class="ml-4">
                    <svg class="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </div>
                </div>
                <div class="mt-4 h-0.5 bg-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
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

            <!-- Recent Requests -->
            <div class="bg-white rounded border border-gray-200">
              <div class="px-8 py-6 border-b border-gray-100">
                <h2 class="text-xl font-semibold text-gray-900">Recent Requests</h2>
              </div>
              <div class="p-8">
                <!-- Loading State -->
                <div v-if="loading" class="space-y-3">
                  <SkeletonCard v-for="i in 3" :key="i" />
                </div>
                <!-- Error State -->
                <div v-else-if="coiStore.error" role="alert" aria-live="assertive">
                  <EmptyState
                    title="Could not load your recent requests"
                    :message="coiStore.error"
                    :action="{ label: 'Retry', onClick: () => coiStore.fetchRequests(), ariaLabel: 'Retry loading recent requests' }"
                  />
                </div>
                <!-- Empty State -->
                <EmptyState
                  v-else-if="recentRequests.length === 0"
                  title="No recent requests"
                  message="Get started by creating your first COI request"
                  :action="{ label: 'Create Request', to: '/coi/request/new' }"
                />
                <!-- Requests List -->
                <div v-else class="space-y-3">
                  <div v-for="request in recentRequests" :key="request.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center">
                      <svg class="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <div>
                        <p class="text-sm font-medium text-gray-900">{{ request.request_id }}</p>
                        <p class="text-xs text-gray-500">{{ request.client_name || 'No client' }} • {{ request.service_type || 'General' }}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-3">
                      <span :class="getStatusClass(request.status || '')" class="px-2 py-1 text-xs font-medium rounded">
                        {{ getStatusLabel(request.status) }}
                      </span>
                      <button 
                        @click="viewRequest(request)" 
                        class="text-primary-600 hover:text-primary-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                        aria-label="View request details"
                      >
                        View →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- All Requests Tab -->
          <div v-if="activeTab === 'all'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="font-semibold text-gray-900">All My Requests</h2>
                  <button 
                    @click="exportAllRequestsList"
                    :disabled="exportingAllList || enhancedFilteredRequests.length === 0"
                    class="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                    aria-label="Export requests"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    {{ exportingAllList ? 'Exporting...' : 'Export' }}
                  </button>
                </div>
                
                <!-- Filters Bar -->
                <div class="flex flex-wrap items-center gap-3">
                  <!-- Search -->
                  <div class="relative flex-1 min-w-[200px] max-w-[300px]">
                    <input 
                      v-model="searchQuery"
                      type="text" 
                      placeholder="Search by ID, client, service..." 
                      class="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <svg class="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                  
                  <!-- Status Filter -->
                  <select 
                    v-model="allStatusFilter"
                    class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Pending">In Progress</option>
                    <option value="Approved">Approved</option>
                    <option value="Active">Active</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  
                  <!-- Service Type Filter -->
                  <select 
                    v-model="allServiceFilter"
                    class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Services</option>
                    <option v-for="service in uniqueServiceTypes" :key="service" :value="service">{{ service }}</option>
                  </select>
                  
                  <!-- Clear Filters -->
                  <button 
                    v-if="hasActiveAllFilters"
                    @click="clearAllFilters"
                    class="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
                
                <!-- Summary Stats -->
                <div class="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-gray-900">{{ enhancedFilteredRequests.length }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Total</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-gray-600">{{ allDraftCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Drafts</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-yellow-600">{{ allPendingCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">In Progress</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-green-600">{{ allApprovedCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Approved</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-red-600">{{ allRejectedCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Rejected</div>
                  </div>
                </div>
              </div>

              <!-- Desktop Table View -->
              <div class="hidden md:block overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-if="loading">
                      <td colspan="6" class="px-6 py-8">
                        <div class="flex items-center justify-center space-x-4">
                          <SkeletonCard v-for="i in 3" :key="i" />
                        </div>
                      </td>
                    </tr>
                    <tr v-else-if="coiStore.error && !loading">
                      <td colspan="6" class="px-6 py-8" role="alert" aria-live="assertive">
                        <EmptyState
                          title="Could not load your requests"
                          :message="coiStore.error"
                          :action="{ label: 'Retry', onClick: () => coiStore.fetchRequests(), ariaLabel: 'Retry loading requests' }"
                        />
                      </td>
                    </tr>
                    <tr v-else-if="enhancedFilteredRequests.length === 0">
                      <td colspan="6" class="px-6 py-8">
                        <EmptyState
                          title="No requests found"
                          message="Try adjusting your filters or create a new request"
                          :action="{ label: 'Create Request', to: '/coi/request/new' }"
                        />
                      </td>
                    </tr>
                    <tr v-for="request in paginatedEnhancedRequests" :key="request.id" class="hover:bg-gray-50">
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
                        <button 
                          @click="viewRequest(request)" 
                          class="text-primary-600 hover:text-primary-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                          aria-label="View request details"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Mobile Card Layout -->
              <div class="md:hidden space-y-4">
                <div v-if="loading" class="space-y-4">
                  <SkeletonCard v-for="i in 5" :key="i" />
                </div>
                <div v-else-if="coiStore.error" role="alert" aria-live="assertive">
                  <EmptyState
                    title="Could not load your requests"
                    :message="coiStore.error"
                    :action="{ label: 'Retry', onClick: () => coiStore.fetchRequests(), ariaLabel: 'Retry loading requests' }"
                  />
                </div>
                <EmptyState
                  v-else-if="enhancedFilteredRequests.length === 0"
                  title="No requests found"
                  message="Try adjusting your filters or create a new request"
                  :action="{ label: 'Create Request', to: '/coi/request/new' }"
                />
                <div 
                  v-for="request in paginatedEnhancedRequests" 
                  :key="request.id" 
                  class="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                >
                  <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                      <p class="text-sm font-medium text-gray-900 mb-1">{{ request.request_id }}</p>
                      <p class="text-xs text-gray-500">{{ request.client_name || 'Not specified' }}</p>
                    </div>
                    <span :class="getStatusClass(request.status || '')" class="px-2 py-1 text-xs font-medium rounded">
                      {{ getStatusLabel(request.status || '') }}
                    </span>
                  </div>
                  <div class="space-y-2 mb-3">
                    <div class="flex justify-between text-xs">
                      <span class="text-gray-500">Service Type:</span>
                      <span class="text-gray-900">{{ request.service_type || 'General' }}</span>
                    </div>
                    <div class="flex justify-between text-xs">
                      <span class="text-gray-500">Date:</span>
                      <span class="text-gray-900">{{ formatDate(request.created_at || '') }}</span>
                    </div>
                  </div>
                  <button 
                    @click="viewRequest(request)" 
                    class="w-full mt-3 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    aria-label="View request details"
                  >
                    View Details
                  </button>
                </div>
              </div>

              <!-- Pagination -->
              <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p class="text-sm text-gray-500">
                  Showing {{ enhancedStartIndex + 1 }} to {{ enhancedEndIndex }} of {{ enhancedFilteredRequests.length }} requests
                </p>
                <div class="flex items-center gap-2">
                  <button 
                    @click="currentPage--" 
                    :disabled="currentPage === 1"
                    class="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span class="px-3 py-1.5 text-sm bg-primary-600 text-white rounded">{{ currentPage }}</span>
                  <button 
                    @click="currentPage++" 
                    :disabled="currentPage >= enhancedTotalPages"
                    class="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Drafts Tab -->
          <div v-if="activeTab === 'drafts'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900">Draft Requests</h2>
                <p class="text-sm text-gray-500 mt-1">Continue editing your saved drafts</p>
              </div>

              <div class="p-6">
                <div class="space-y-4">
                  <div 
                    v-for="request in draftRequests" 
                    :key="request.id"
                    class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <p class="font-medium text-gray-900">{{ request.request_id }}</p>
                        <p class="text-sm text-gray-500 mt-1">{{ request.client_name || 'No client selected' }}</p>
                        <p class="text-xs text-gray-400 mt-2">Last updated: {{ formatDate(request.updated_at || '') }}</p>
                      </div>
                      <div class="flex gap-2">
                        <button 
                          @click="editDraft(request)"
                          class="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded hover:bg-primary-700"
                        >
                          Continue Editing
                        </button>
                        <button 
                          @click="viewRequest(request)"
                          class="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50"
                        >
                          View
                        </button>
                        <button 
                          @click="deleteDraft(request)"
                          class="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  <div v-if="draftRequests.length === 0" class="text-center py-8 text-gray-500">
                    <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    <p>No draft requests</p>
                    <router-link to="/coi/request/new" class="text-blue-600 hover:underline text-sm mt-2 inline-block">
                      Create a new request →
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pending Tab -->
          <div v-if="activeTab === 'pending'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900 mb-4">Pending Requests</h2>
                <p class="text-sm text-gray-500 mb-4">Requests awaiting approval</p>
                
                <!-- Filters Bar -->
                <div class="flex flex-wrap items-center gap-3">
                  <!-- Search -->
                  <div class="relative flex-1 min-w-[200px] max-w-[300px]">
                    <input 
                      v-model="pendingSearchQuery"
                      type="text" 
                      placeholder="Search by ID, client..." 
                      class="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <svg class="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                  
                  <!-- Stage Filter -->
                  <select 
                    v-model="pendingStageFilter"
                    class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Stages</option>
                    <option value="Pending Director Approval">Director Review</option>
                    <option value="Pending Compliance">Compliance Review</option>
                    <option value="Pending Partner">Partner Approval</option>
                    <option value="Pending Finance">Finance Review</option>
                  </select>
                  
                  <!-- Service Type Filter -->
                  <select 
                    v-model="pendingServiceFilter"
                    class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Services</option>
                    <option v-for="service in uniqueServiceTypes" :key="service" :value="service">{{ service }}</option>
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
                    <div class="text-2xl font-semibold text-gray-900">{{ filteredPendingRequests.length }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">In Progress</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-orange-600">{{ pendingDirectorCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Director</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-blue-600">{{ pendingComplianceCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Compliance</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-purple-600">{{ pendingPartnerCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Partner</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-indigo-600">{{ pendingFinanceCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Finance</div>
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
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stage</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Pending</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="request in filteredPendingRequests" :key="request.id" class="hover:bg-gray-50">
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
                        <span 
                          :class="getDaysPendingClass(request)"
                          class="text-sm font-medium"
                        >
                          {{ getDaysPending(request) }} {{ getDaysPending(request) === 1 ? 'day' : 'days' }}
                        </span>
                        <p v-if="getDaysPending(request) > 14" class="text-xs text-red-600 font-medium mt-1">Overdue</p>
                      </td>
                      <td class="px-6 py-4">
                        <button @click="viewRequest(request)" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
                          Track →
                        </button>
                      </td>
                    </tr>
                    <tr v-if="filteredPendingRequests.length === 0">
                      <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <p>No pending requests</p>
                        <p v-if="hasActivePendingFilters" class="text-sm mt-1">Try adjusting your filters</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- Pagination -->
              <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p class="text-sm text-gray-500">
                  Showing {{ filteredPendingRequests.length }} of {{ pendingRequests.length }} requests
                </p>
              </div>
            </div>
          </div>

          <!-- Active Engagements Tab -->
          <div v-if="activeTab === 'active'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <div class="flex items-center justify-between">
                  <div>
                    <h2 class="font-semibold text-gray-900">Active Engagements & Proposals</h2>
                    <p class="text-sm text-gray-500 mt-1">Track and manage client responses</p>
                  </div>
                  <!-- Phase Filter -->
                  <div class="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      @click="activePhase = 'proposal'"
                      :class="activePhase === 'proposal' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:text-gray-900'"
                      class="px-4 py-1.5 text-sm font-medium rounded-md transition-all"
                    >
                      Proposal Tracking
                    </button>
                    <button
                      @click="activePhase = 'engagement'"
                      :class="activePhase === 'engagement' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:text-gray-900'"
                      class="px-4 py-1.5 text-sm font-medium rounded-md transition-all"
                    >
                      Engagement Tracking
                    </button>
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
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {{ activePhase === 'proposal' ? 'Client Response' : 'Engagement Status' }}
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {{ activePhase === 'proposal' ? 'Days Elapsed' : 'Renewal Date' }}
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="request in filteredActiveEngagements" :key="request.id" class="hover:bg-gray-50">
                      <td class="px-6 py-4">
                        <span class="text-sm font-medium text-gray-900">{{ request.request_id }}</span>
                        <p v-if="request.engagement_code" class="text-xs text-gray-500 mt-1">{{ request.engagement_code }}</p>
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
                        <template v-if="activePhase === 'proposal'">
                          <span 
                            :class="getClientResponseClass(request.client_response_status || (request.status === 'Lapsed' ? 'Lapsed' : 'Awaiting'))"
                            class="px-2.5 py-1 text-xs font-semibold rounded-full"
                          >
                            {{ getClientResponseLabel(request) }}
                          </span>
                          <p v-if="request.client_response_date" class="text-xs text-gray-500 mt-1">
                            {{ formatDate(request.client_response_date) }}
                          </p>
                        </template>
                        <template v-else>
                          <span class="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                            Active
                          </span>
                          <p v-if="request.engagement_start_date" class="text-xs text-gray-500 mt-1">
                            Since {{ formatDate(request.engagement_start_date || request.client_response_date) }}
                          </p>
                        </template>
                      </td>
                      <td class="px-6 py-4">
                        <template v-if="activePhase === 'proposal'">
                          <template v-if="request.proposal_sent_date && !request.client_response_date && request.status !== 'Lapsed'">
                            <span 
                              :class="getDaysElapsedClass(request)"
                              class="text-sm font-medium"
                            >
                              {{ getDaysElapsed(request) }} days
                            </span>
                            <p class="text-xs text-gray-500">of 30 max</p>
                          </template>
                          <span v-else-if="request.status === 'Lapsed'" class="text-sm text-gray-500">
                            Expired
                          </span>
                          <span v-else class="text-sm text-gray-500">-</span>
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
                          <template v-if="activePhase === 'proposal'">
                            <button 
                              v-if="!request.proposal_sent_date && request.status === 'Approved'"
                              @click="openSendProposalModal(request)"
                              class="px-2 py-1 bg-primary-600 text-white text-xs font-medium rounded hover:bg-primary-700"
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
                          <button @click="viewRequest(request)" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
                            View →
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="filteredActiveEngagements.length === 0">
                      <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        {{ activePhase === 'proposal' ? 'No proposals in tracking' : 'No active engagements' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Legend -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 class="text-sm font-medium text-gray-700 mb-3">
                {{ activePhase === 'proposal' ? 'Client Response Status Legend' : 'Engagement Status Legend' }}
              </h3>
              <div v-if="activePhase === 'proposal'" class="flex flex-wrap gap-4 text-sm">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-1 bg-green-100 text-green-700 border border-green-300 rounded-full text-xs font-semibold">✓ Signed</span>
                  <span class="text-gray-600">Client accepted the proposal</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-1 bg-amber-100 text-amber-700 border border-amber-300 rounded-full text-xs font-semibold">Awaiting</span>
                  <span class="text-gray-600">Waiting for client response</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-1 bg-red-100 text-red-700 border border-red-300 rounded-full text-xs font-semibold">✗ Rejected</span>
                  <span class="text-gray-600">Client rejected the proposal</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-1 bg-gray-200 text-gray-600 border border-gray-300 rounded-full text-xs font-semibold">Lapsed</span>
                  <span class="text-gray-600">30-day period expired without response</span>
                </div>
              </div>
              <div v-else class="flex flex-wrap gap-4 text-sm">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-1 bg-green-100 text-green-700 border border-green-300 rounded-full text-xs font-semibold">Active</span>
                  <span class="text-gray-600">Engagement is in progress</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-1 bg-amber-100 text-amber-700 border border-amber-300 rounded-full text-xs font-semibold">⚠ Due for renewal</span>
                  <span class="text-gray-600">Approaching 3-year renewal date</span>
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
                  Send proposal to client for <strong>{{ selectedProposalRequest.request_id }}</strong>
                </p>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Client Email *</label>
                    <input 
                      v-model="proposalEmail"
                      type="email"
                      class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      placeholder="client@company.com"
                    />
                  </div>
                  <div class="flex items-center gap-2">
                    <input type="checkbox" v-model="includeDisclaimer" id="includeDisclaimer" class="rounded">
                    <label for="includeDisclaimer" class="text-sm text-gray-600">Include 30-day validity disclaimer</label>
                  </div>
                </div>
                <div class="flex justify-end gap-3 mt-6">
                  <button @click="closeSendProposalModal" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                    Cancel
                  </button>
                  <button 
                    @click="sendProposal"
                    :disabled="!proposalEmail || sendingProposal"
                    class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
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
                  Record a follow-up for <strong>{{ selectedProposalRequest.request_id }}</strong>
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
                      class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
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
                      <label class="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50" :class="responseType === 'Negotiating' ? 'border-gray-300 bg-gray-50' : ''">
                        <input type="radio" v-model="responseType" value="Negotiating" class="text-blue-600">
                        <span class="text-sm font-medium text-blue-700">⟳ Negotiating</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea 
                      v-model="responseNotes"
                      rows="3"
                      class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      placeholder="Additional notes about the response..."
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
              </div>
            </div>
          </div>

          <!-- Rejected Tab -->
          <div v-if="activeTab === 'rejected'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900 mb-4">Rejected Requests</h2>
                <p class="text-sm text-gray-500 mb-4">Requests that were rejected - some may be resubmitted</p>
                
                <!-- Filters Bar -->
                <div class="flex flex-wrap items-center gap-3">
                  <!-- Search -->
                  <div class="relative flex-1 min-w-[200px] max-w-[300px]">
                    <input 
                      v-model="rejectedSearchQuery"
                      type="text" 
                      placeholder="Search by ID, client..." 
                      class="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <svg class="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                  
                  <!-- Rejection Type Filter -->
                  <select 
                    v-model="rejectedTypeFilter"
                    class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Types</option>
                    <option value="fixable">Fixable</option>
                    <option value="permanent">Permanent</option>
                  </select>
                  
                  <!-- Service Type Filter -->
                  <select 
                    v-model="rejectedServiceFilter"
                    class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Services</option>
                    <option v-for="service in uniqueServiceTypes" :key="service" :value="service">{{ service }}</option>
                  </select>
                  
                  <!-- Clear Filters -->
                  <button 
                    v-if="hasActiveRejectedFilters"
                    @click="clearRejectedFilters"
                    class="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
                
                <!-- Summary Stats -->
                <div class="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-gray-900">{{ filteredRejectedRequests.length }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Total Rejected</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-amber-600">{{ rejectedFixableCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Fixable</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-semibold text-red-600">{{ rejectedPermanentCount }}</div>
                    <div class="text-xs text-gray-500 uppercase tracking-wide">Permanent</div>
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
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejection Type</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="request in filteredRejectedRequests" :key="request.id" class="hover:bg-gray-50">
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
                        <span 
                          :class="request.rejection_type === 'permanent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'" 
                          class="px-2 py-1 text-xs font-medium rounded"
                        >
                          {{ request.rejection_type === 'permanent' ? 'Permanent' : 'Fixable' }}
                        </span>
                      </td>
                      <td class="px-6 py-4 max-w-xs">
                        <span class="text-sm text-gray-600 truncate block" :title="request.rejection_reason || 'No reason provided'">
                          {{ (request.rejection_reason || 'No reason provided').substring(0, 50) }}{{ (request.rejection_reason || '').length > 50 ? '...' : '' }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                          <button @click="viewRequest(request)" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
                            View
                          </button>
                          <button 
                            v-if="request.rejection_type !== 'permanent'"
                            @click="resubmitRequest(request)"
                            class="text-amber-600 hover:text-amber-800 text-sm font-medium"
                          >
                            Resubmit
                          </button>
                          <router-link 
                            v-if="request.rejection_type === 'permanent'"
                            to="/coi/request/new"
                            class="text-gray-600 hover:text-gray-800 text-sm font-medium"
                          >
                            New Request
                          </router-link>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="filteredRejectedRequests.length === 0">
                      <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <p>No rejected requests</p>
                        <p v-if="hasActiveRejectedFilters" class="text-sm mt-1">Try adjusting your filters</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Prospect CRM Tab -->
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
                      ? 'border-primary-500 text-primary-600' 
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
import { ref, computed, watch, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useCOIRequestsStore } from '@/stores/coiRequests'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import api from '@/services/api'
import ReportCharts from '@/components/reports/ReportCharts.vue'
import BusinessDevProspects from '@/components/business-dev/BusinessDevProspects.vue'
import BusinessDevPipelineAnalytics from '@/components/business-dev/BusinessDevPipelineAnalytics.vue'
import BusinessDevAIInsights from '@/components/business-dev/BusinessDevAIInsights.vue'
import { getLandingPageSummary } from '@/services/landingPageService'
import { getReportData, exportReportExcel, downloadBlob } from '@/services/reportService'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import ChartDataModal from '@/components/dashboard/ChartDataModal.vue'
import GlobalSearch from '@/components/ui/GlobalSearch.vue'
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal.vue'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'

const router = useRouter()
const coiStore = useCOIRequestsStore()
const authStore = useAuthStore()
const toast = useToast()

const activeTab = ref('overview')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const sidebarOpen = ref(false)
const showSearch = ref(false)

// Keyboard shortcuts
const { 
  registerShortcuts, 
  showHelpModal, 
  toggleHelp, 
  getShortcutGroups, 
  formatShortcutKey 
} = useKeyboardShortcuts()

// Phase filter for Active tab
const activePhase = ref<'proposal' | 'engagement'>('proposal')

// ============================================
// Enhanced Filter State Variables
// ============================================

// All Requests filters
const allStatusFilter = ref('all')
const allServiceFilter = ref('all')

// Pending Requests filters
const pendingSearchQuery = ref('')
const pendingStageFilter = ref('all')
const pendingServiceFilter = ref('all')

// Rejected Requests filters
const rejectedSearchQuery = ref('')
const rejectedTypeFilter = ref('all')
const rejectedServiceFilter = ref('all')

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
const exportingAllList = ref(false)

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

const AllIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
    ])
  }
}

const DraftsIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' })
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

const RejectedIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' })
    ])
  }
}

const ActiveIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' })
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
  { id: 'overview', label: 'Overview', icon: OverviewIcon, count: 0, alertColor: '', divider: false },
  { id: 'all', label: 'All Requests', icon: AllIcon, count: totalRequests.value, alertColor: 'bg-gray-100 text-gray-600', divider: false },
  { id: 'drafts', label: 'Drafts', icon: DraftsIcon, count: draftCount.value, alertColor: 'bg-gray-100 text-gray-600', divider: false },
  { id: 'pending', label: 'Pending', icon: PendingIcon, count: inProgressCount.value, alertColor: 'bg-yellow-100 text-yellow-700', divider: false },
  { id: 'active', label: 'Active', icon: ActiveIcon, count: activeEngagementsCount.value, alertColor: 'bg-green-100 text-green-700', divider: false },
  { id: 'rejected', label: 'Rejected', icon: RejectedIcon, count: rejectedCount.value, alertColor: 'bg-red-100 text-red-700', divider: false },
  { id: 'business-dev', label: 'Prospect CRM', icon: BusinessDevIcon, count: 0, alertColor: '', divider: true }
])

// Prospect CRM sub-tabs
const activeBDSubTab = ref('prospects')
const bdSubTabs = [
  { id: 'prospects', label: 'Prospects' },
  { id: 'pipeline-analytics', label: 'Pipeline & Analytics' },
  { id: 'ai-insights', label: 'AI Insights' }
]

// Stats
const totalRequests = computed(() => requests.value.length)
const draftCount = computed(() => requests.value.filter(r => r.status === 'Draft').length)
const approvedCount = computed(() => requests.value.filter(r => r.status === 'Approved' || r.status === 'Active').length)
const inProgressCount = computed(() => requests.value.filter(r => r.status.includes('Pending')).length)
const rejectedCount = computed(() => requests.value.filter(r => r.status === 'Rejected').length)
const activeEngagementsCount = computed(() => requests.value.filter(r => 
  r.status === 'Approved' || r.status === 'Active' || r.status === 'Lapsed'
).length)

const draftRequests = computed(() => requests.value.filter(r => r.status === 'Draft'))
const pendingRequests = computed(() => requests.value.filter(r => r.status.includes('Pending')))
const rejectedRequests = computed(() => requests.value.filter(r => r.status === 'Rejected'))
const activeEngagements = computed(() => requests.value.filter(r => 
  r.status === 'Approved' || r.status === 'Active' || r.status === 'Lapsed'
))

// Filtered active engagements based on phase
const filteredActiveEngagements = computed(() => {
  if (activePhase.value === 'proposal') {
    // Proposal phase: Approved but not yet Active (client hasn't signed)
    return activeEngagements.value.filter(r => 
      r.status === 'Approved' || r.status === 'Lapsed' || 
      (r.status === 'Active' && !r.client_response_date)
    )
  } else {
    // Engagement phase: Active engagements (client signed)
    return activeEngagements.value.filter(r => 
      r.status === 'Active' && r.client_response_status === 'Accepted'
    )
  }
})

const recentRequests = computed(() => [...requests.value].sort((a, b) => 
  new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
).slice(0, 5))

// Filtered & Paginated
const filteredRequests = computed(() => {
  if (!searchQuery.value) return requests.value
  const q = searchQuery.value.toLowerCase()
  return requests.value.filter(r => 
    r.request_id?.toLowerCase().includes(q) ||
    r.client_name?.toLowerCase().includes(q) ||
    r.service_type?.toLowerCase().includes(q)
  )
})

const totalPages = computed(() => Math.ceil(filteredRequests.value.length / pageSize.value))
const startIndex = computed(() => (currentPage.value - 1) * pageSize.value)
const endIndex = computed(() => Math.min(startIndex.value + pageSize.value, filteredRequests.value.length))
const paginatedRequests = computed(() => filteredRequests.value.slice(startIndex.value, endIndex.value))

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

// ============================================
// Enhanced All Requests Filtering
// ============================================
const enhancedFilteredRequests = computed(() => {
  let filtered = requests.value
  
  // Search filter
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(r => 
      r.request_id?.toLowerCase().includes(q) ||
      r.client_name?.toLowerCase().includes(q) ||
      r.service_type?.toLowerCase().includes(q)
    )
  }
  
  // Status filter
  if (allStatusFilter.value !== 'all') {
    if (allStatusFilter.value === 'Pending') {
      filtered = filtered.filter(r => r.status?.includes('Pending'))
    } else {
      filtered = filtered.filter(r => r.status === allStatusFilter.value)
    }
  }
  
  // Service type filter
  if (allServiceFilter.value !== 'all') {
    filtered = filtered.filter(r => r.service_type === allServiceFilter.value)
  }
  
  return filtered
})

const hasActiveAllFilters = computed(() => {
  return searchQuery.value !== '' ||
    allStatusFilter.value !== 'all' ||
    allServiceFilter.value !== 'all'
})

const allDraftCount = computed(() => requests.value.filter(r => r.status === 'Draft').length)
const allPendingCount = computed(() => requests.value.filter(r => r.status?.includes('Pending')).length)
const allApprovedCount = computed(() => requests.value.filter(r => r.status === 'Approved' || r.status === 'Active').length)
const allRejectedCount = computed(() => requests.value.filter(r => r.status === 'Rejected').length)

const enhancedTotalPages = computed(() => Math.ceil(enhancedFilteredRequests.value.length / pageSize.value))
const enhancedStartIndex = computed(() => (currentPage.value - 1) * pageSize.value)
const enhancedEndIndex = computed(() => Math.min(enhancedStartIndex.value + pageSize.value, enhancedFilteredRequests.value.length))
const paginatedEnhancedRequests = computed(() => enhancedFilteredRequests.value.slice(enhancedStartIndex.value, enhancedEndIndex.value))

function clearAllFilters() {
  searchQuery.value = ''
  allStatusFilter.value = 'all'
  allServiceFilter.value = 'all'
  currentPage.value = 1
}

// Reset to page 1 when All tab filters change so pagination stays valid
watch([searchQuery, allStatusFilter, allServiceFilter], () => {
  if (activeTab.value === 'all') {
    currentPage.value = 1
  }
})
// Clamp current page when filtered list shrinks (e.g. after refresh)
watch(enhancedTotalPages, (total) => {
  if (activeTab.value === 'all' && total > 0 && currentPage.value > total) {
    currentPage.value = total
  }
})

// ============================================
// Enhanced Pending Requests Filtering
// ============================================
function getDaysPending(request: any): number {
  if (!request.created_at) return 0
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

const filteredPendingRequests = computed(() => {
  let filtered = pendingRequests.value
  
  // Search filter
  if (pendingSearchQuery.value) {
    const q = pendingSearchQuery.value.toLowerCase()
    filtered = filtered.filter(r => 
      r.request_id?.toLowerCase().includes(q) ||
      r.client_name?.toLowerCase().includes(q)
    )
  }
  
  // Stage filter
  if (pendingStageFilter.value !== 'all') {
    filtered = filtered.filter(r => r.status === pendingStageFilter.value)
  }
  
  // Service type filter
  if (pendingServiceFilter.value !== 'all') {
    filtered = filtered.filter(r => r.service_type === pendingServiceFilter.value)
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
  return pendingSearchQuery.value !== '' ||
    pendingStageFilter.value !== 'all' ||
    pendingServiceFilter.value !== 'all'
})

const pendingDirectorCount = computed(() => pendingRequests.value.filter(r => r.status === 'Pending Director Approval').length)
const pendingComplianceCount = computed(() => pendingRequests.value.filter(r => r.status === 'Pending Compliance').length)
const pendingPartnerCount = computed(() => pendingRequests.value.filter(r => r.status === 'Pending Partner').length)
const pendingFinanceCount = computed(() => pendingRequests.value.filter(r => r.status === 'Pending Finance').length)

function clearPendingFilters() {
  pendingSearchQuery.value = ''
  pendingStageFilter.value = 'all'
  pendingServiceFilter.value = 'all'
}

// ============================================
// Enhanced Rejected Requests Filtering
// ============================================
const filteredRejectedRequests = computed(() => {
  let filtered = rejectedRequests.value
  
  // Search filter
  if (rejectedSearchQuery.value) {
    const q = rejectedSearchQuery.value.toLowerCase()
    filtered = filtered.filter(r => 
      r.request_id?.toLowerCase().includes(q) ||
      r.client_name?.toLowerCase().includes(q)
    )
  }
  
  // Type filter
  if (rejectedTypeFilter.value !== 'all') {
    filtered = filtered.filter(r => r.rejection_type === rejectedTypeFilter.value)
  }
  
  // Service type filter
  if (rejectedServiceFilter.value !== 'all') {
    filtered = filtered.filter(r => r.service_type === rejectedServiceFilter.value)
  }
  
  return filtered
})

const hasActiveRejectedFilters = computed(() => {
  return rejectedSearchQuery.value !== '' ||
    rejectedTypeFilter.value !== 'all' ||
    rejectedServiceFilter.value !== 'all'
})

const rejectedFixableCount = computed(() => rejectedRequests.value.filter(r => r.rejection_type !== 'permanent').length)
const rejectedPermanentCount = computed(() => rejectedRequests.value.filter(r => r.rejection_type === 'permanent').length)

function clearRejectedFilters() {
  rejectedSearchQuery.value = ''
  rejectedTypeFilter.value = 'all'
  rejectedServiceFilter.value = 'all'
}

function getStatusClass(status: string | undefined) {
  if (!status) return 'bg-gray-100 text-gray-700'
  const classes: Record<string, string> = {
    'Draft': 'bg-gray-100 text-gray-700',
    'Pending Director Approval': 'bg-yellow-100 text-yellow-700',
    'Pending Compliance': 'bg-blue-100 text-blue-700',
    'Pending Partner': 'bg-purple-100 text-purple-700',
    'Pending Finance': 'bg-indigo-100 text-indigo-700',
    'Approved': 'bg-green-100 text-green-700',
    'Approved with Restrictions': 'bg-yellow-100 text-yellow-700',
    'Active': 'bg-green-100 text-green-700',
    'Rejected': 'bg-red-100 text-red-700',
    'Need More Info': 'bg-amber-100 text-amber-700',
    'Lapsed': 'bg-gray-200 text-gray-600'
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
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
  if (request.proposal_sent_date && !request.client_response_date) return 'Awaiting Response'
  return 'Pending'
}

function getStatusLabel(status: string | undefined) {
  if (!status) return 'Unknown'
  const labels: Record<string, string> = {
    'Pending Director Approval': 'Director Review',
    'Pending Compliance': 'Compliance Review',
    'Pending Partner': 'Partner Approval',
    'Pending Finance': 'Finance Review',
    'Approved with Restrictions': 'Approved*'
  }
  return labels[status] || status
}

function formatDate(dateString: string | undefined) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getDaysElapsed(request: any) {
  if (!request.proposal_sent_date) return 0
  const sent = new Date(request.proposal_sent_date)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - sent.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getDaysElapsedClass(request: any) {
  const days = getDaysElapsed(request)
  if (days >= 25) return 'text-red-600'
  if (days >= 20) return 'text-amber-600'
  if (days >= 10) return 'text-yellow-600'
  return 'text-green-600'
}

function viewRequest(request: any) {
  router.push(`/coi/request/${request.id}`)
}

function editDraft(request: any) {
  // Store request data for editing
  localStorage.setItem('coi-edit-request', JSON.stringify(request))
  router.push('/coi/request/new')
}

async function resubmitRequest(request: any) {
  if (request.rejection_type === 'permanent') {
    toast.error('This request was permanently rejected and cannot be resubmitted.')
    return
  }
  
  try {
    const response = await api.post(`/coi/requests/${request.id}/resubmit`)
    
    if (response.data.success) {
      toast.success('Request converted to draft. You can now edit and resubmit.')
      // Refresh the requests list
      coiStore.fetchRequests()
      // Navigate to the request detail page for editing
      router.push(`/coi/request/${request.id}`)
    } else {
      toast.error(response.data.error || 'Failed to resubmit request.')
    }
  } catch (error: any) {
    console.error('Failed to resubmit:', error)
    toast.error(error.response?.data?.error || 'Failed to resubmit request. Please try again.')
  }
}

async function deleteDraft(request: any) {
  if (request.status !== 'Draft') {
    toast.error('Only draft requests can be deleted.')
    return
  }
  
  if (!confirm(`Are you sure you want to delete draft "${request.request_id}"? This action cannot be undone.`)) {
    return
  }
  
  try {
    await api.delete(`/coi/requests/${request.id}`)
    toast.success('Draft deleted successfully')
    // Refresh the requests list
    coiStore.fetchRequests()
  } catch (error: any) {
    console.error('Failed to delete draft:', error)
    toast.error(error.response?.data?.error || 'Failed to delete draft. Please try again.')
  }
}

// Engagement tracking helper functions
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
    toast.success('Proposal sent successfully!')
    closeSendProposalModal()
    coiStore.fetchRequests()
  } catch (error: any) {
    console.error('Error sending proposal:', error)
    toast.error(error.response?.data?.error || 'Failed to send proposal')
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
    toast.success('Follow-up recorded successfully!')
    closeFollowUpModal()
    coiStore.fetchRequests()
  } catch (error: any) {
    console.error('Error recording follow-up:', error)
    toast.error(error.response?.data?.error || 'Failed to record follow-up')
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
    toast.success('Client response recorded successfully!')
    closeRecordResponseModal()
    coiStore.fetchRequests()
  } catch (error: any) {
    console.error('Error recording response:', error)
    toast.error(error.response?.data?.error || 'Failed to record client response')
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
      'requester',
      'my-requests-summary',
      { status, includeData: true, pageSize: 500 }
    )
    modalData.value = reportData.requests || []
  } catch (error) {
    console.error('Error loading chart data:', error)
    toast.error('Failed to load request data')
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
      'requester',
      'my-requests-summary',
      { serviceType, includeData: true, pageSize: 500 }
    )
    modalData.value = reportData.requests || []
  } catch (error) {
    console.error('Error loading chart data:', error)
    toast.error('Failed to load request data')
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
      'requester',
      'my-requests-summary',
      { clientName, includeData: true, pageSize: 500 }
    )
    modalData.value = reportData.requests || []
  } catch (error) {
    console.error('Error loading chart data:', error)
    toast.error('Failed to load request data')
    modalData.value = []
  } finally {
    modalLoading.value = false
  }
}

// Handle export from modal
async function handleExportData() {
  try {
    const blob = await exportReportExcel(
      'requester',
      'my-requests-summary',
      { ...currentFilter.value, includeData: true }
    )
    downloadBlob(blob, `coi-requests-${Date.now()}.xlsx`)
    toast.success('Data exported successfully')
  } catch (error) {
    console.error('Error exporting data:', error)
    toast.error('Failed to export data')
  }
}

// Export current All Requests filtered list as Excel
async function exportAllRequestsList() {
  if (enhancedFilteredRequests.value.length === 0) return
  exportingAllList.value = true
  try {
    const filters: Record<string, unknown> = {
      includeData: true,
      pageSize: enhancedFilteredRequests.value.length
    }
    if (allStatusFilter.value !== 'all') {
      filters.status = allStatusFilter.value
    }
    if (allServiceFilter.value !== 'all') {
      filters.serviceType = allServiceFilter.value
    }
    if (searchQuery.value.trim()) {
      filters.search = searchQuery.value.trim()
    }
    const blob = await exportReportExcel('requester', 'my-requests-summary', filters)
    downloadBlob(blob, `coi-requests-${Date.now()}.xlsx`)
    toast.success('Requests exported successfully')
  } catch (error) {
    console.error('Error exporting requests:', error)
    toast.error('Failed to export requests')
  } finally {
    exportingAllList.value = false
  }
}

// Handle CRM card click - navigate to reports
function handleViewReport(reportType: string) {
  router.push({ path: '/coi/reports', query: { report: reportType } })
}

// Register keyboard shortcuts
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
