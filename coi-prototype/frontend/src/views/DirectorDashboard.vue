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
              <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="activeTab = tab.id"
                @keydown.enter="activeTab = tab.id"
                @keydown.space.prevent="activeTab = tab.id"
                :aria-selected="activeTab === tab.id"
                :aria-label="tab.label"
                role="tab"
                class="w-full flex items-center px-4 py-3 text-sm transition-colors border-l-2 text-left"
                :class="activeTab === tab.id 
                  ? 'bg-blue-50 border-blue-600 text-blue-700 font-medium' 
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
            </nav>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="flex-1">
          <!-- Overview Tab -->
          <div v-if="activeTab === 'overview'" class="space-y-6">
            <!-- Stats Cards - Clickable -->
            <div class="grid grid-cols-4 gap-4">
              <div @click="activeTab = 'pending'" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-orange-300 transition-all">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Pending Approval</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ pendingApproval.length }}</p>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div @click="activeTab = 'team'" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">In Progress</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ inProgress }}</p>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div @click="activeTab = 'approved'" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-green-300 transition-all">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Approved</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ approved }}</p>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div @click="activeTab = 'tracking'" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-purple-300 transition-all">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Active Engagements</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ active }}</p>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recent Activity -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <div class="p-6">
                <div class="space-y-4">
                  <div v-for="request in recentRequests" :key="request.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center">
                      <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <span class="text-blue-600 text-xs font-medium">{{ getInitials(request.requester_name) }}</span>
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
              <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 class="font-semibold text-gray-900">Pending Director Approval</h2>
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
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
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
                    <tr v-else-if="filteredPending.length === 0">
                      <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <p>No pending approvals</p>
                        <p class="text-sm mt-1">All caught up!</p>
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
                        <span class="text-sm text-gray-600">{{ request.requester_name || 'Unknown' }}</span>
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
                  Showing {{ filteredPending.length }} of {{ pendingApproval.length }} requests
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
              <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 class="font-semibold text-gray-900">Team Requests</h2>
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
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="request in teamRequests" :key="request.id" class="hover:bg-gray-50">
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
                        <span class="text-sm text-gray-500">{{ formatDate(request.created_at) }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <button @click="viewDetails(request)" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View →
                        </button>
                      </td>
                    </tr>
                    <tr v-if="teamRequests.length === 0">
                      <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        No team requests found
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Approved Tab -->
          <div v-if="activeTab === 'approved'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900">Approved Requests</h2>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved Date</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="request in approvedRequests" :key="request.id" class="hover:bg-gray-50">
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
                        <span class="text-sm text-gray-500">{{ formatDate(request.director_approval_date || request.updated_at) }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <button @click="viewDetails(request)" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View →
                        </button>
                      </td>
                    </tr>
                    <tr v-if="approvedRequests.length === 0">
                      <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                        No approved requests found
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Team Tracking Tab -->
          <div v-if="activeTab === 'tracking'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <div class="flex items-center justify-between">
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
                    <tr v-for="request in filteredTrackingRequests" :key="request.id" class="hover:bg-gray-50">
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
                    <tr v-if="filteredTrackingRequests.length === 0">
                      <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        {{ trackingPhase === 'proposal' ? 'No proposals in tracking' : 'No active engagements' }}
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
        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
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
        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
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
        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useCOIRequestsStore } from '@/stores/coiRequests'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const router = useRouter()
const coiStore = useCOIRequestsStore()
const authStore = useAuthStore()

const activeTab = ref('overview')
const searchQuery = ref('')

// Phase filter for Team Tracking tab
const trackingPhase = ref<'proposal' | 'engagement'>('proposal')

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

const tabs = computed(() => [
  { id: 'overview', label: 'Overview', icon: OverviewIcon, count: 0 },
  { id: 'pending', label: 'Pending Approval', icon: PendingIcon, count: pendingApproval.value.length },
  { id: 'team', label: 'Team Requests', icon: TeamIcon, count: teamRequests.value.length },
  { id: 'tracking', label: 'Team Tracking', icon: TrackingIcon, count: trackableRequests.value.length },
  { id: 'approved', label: 'Approved', icon: ApprovedIcon, count: approvedRequests.value.length }
])

const pendingApproval = computed(() => requests.value.filter(r => r.status === 'Pending Director Approval'))
const teamRequests = computed(() => requests.value.filter(r => r.department === authStore.user?.department))
const approvedRequests = computed(() => requests.value.filter(r => 
  r.director_approval_status === 'Approved' || r.status === 'Approved' || r.status === 'Active'
))
const recentRequests = computed(() => [...requests.value].sort((a, b) => 
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
).slice(0, 5))

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

const filteredPending = computed(() => {
  if (!searchQuery.value) return pendingApproval.value
  const q = searchQuery.value.toLowerCase()
  return pendingApproval.value.filter(r => 
    r.request_id?.toLowerCase().includes(q) ||
    r.client_name?.toLowerCase().includes(q) ||
    r.requester_name?.toLowerCase().includes(q)
  )
})

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
  if (request.proposal_sent_date && !request.client_response_date) return '⏳ Awaiting'
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
    alert('Proposal sent successfully!')
    closeSendProposalModal()
    coiStore.fetchRequests()
  } catch (error: any) {
    console.error('Error sending proposal:', error)
    alert(error.response?.data?.error || 'Failed to send proposal')
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
    alert('Follow-up recorded successfully!')
    closeFollowUpModal()
    coiStore.fetchRequests()
  } catch (error: any) {
    console.error('Error recording follow-up:', error)
    alert(error.response?.data?.error || 'Failed to record follow-up')
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
    alert('Client response recorded successfully!')
    closeRecordResponseModal()
    coiStore.fetchRequests()
  } catch (error: any) {
    console.error('Error recording response:', error)
    alert(error.response?.data?.error || 'Failed to record client response')
  } finally {
    recordingResponse.value = false
  }
}

onMounted(() => {
  coiStore.fetchRequests()
})
</script>
