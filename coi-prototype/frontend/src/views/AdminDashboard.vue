<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Top Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            <p class="text-sm text-gray-500 mt-1">Execution tracking, monitoring, and system management</p>
          </div>
          <div class="flex items-center gap-3">
            <router-link
              to="/coi/form-builder"
              class="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Form Builder
            </router-link>
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
              <div @click="activeTab = 'execution'" class="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:border-gray-300 transition-colors">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Total Requests</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ totalRequests }}</p>
                  </div>
                  <div class="w-10 h-10 flex items-center justify-center">
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div @click="activeTab = 'global'" class="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:border-gray-300 transition-colors">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Active Engagements</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ activeEngagements }}</p>
                  </div>
                  <div class="w-10 h-10 flex items-center justify-center">
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div @click="activeTab = 'monitoring'" class="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:border-gray-300 transition-colors">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Monitoring Alerts</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ alertCount }}</p>
                  </div>
                  <div class="w-10 h-10 flex items-center justify-center">
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div @click="activeTab = 'renewals'" class="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:border-gray-300 transition-colors">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">Renewals Due</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ renewalsDue }}</p>
                  </div>
                  <div class="w-10 h-10 flex items-center justify-center">
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Summary -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900">System Overview</h2>
              </div>
              <div class="p-6 grid grid-cols-3 gap-4">
                <div class="bg-white border-l-4 border-yellow-500 border border-gray-200 rounded-lg p-4">
                  <div class="flex items-center mb-2">
                    <span class="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                    <span class="text-sm font-medium text-gray-900">10-Day Alerts</span>
                  </div>
                  <p class="text-2xl font-bold text-gray-900">{{ tenDayAlerts.length }}</p>
                </div>
                <div class="bg-white border-l-4 border-orange-500 border border-gray-200 rounded-lg p-4">
                  <div class="flex items-center mb-2">
                    <span class="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
                    <span class="text-sm font-medium text-gray-900">20-Day Alerts</span>
                  </div>
                  <p class="text-2xl font-bold text-gray-900">{{ twentyDayAlerts.length }}</p>
                </div>
                <div class="bg-white border-l-4 border-red-500 border border-gray-200 rounded-lg p-4">
                  <div class="flex items-center mb-2">
                    <span class="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                    <span class="text-sm font-medium text-gray-900">30-Day Exceeded</span>
                  </div>
                  <p class="text-2xl font-bold text-gray-900">{{ thirtyDayAlerts.length }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Execution Queue Tab -->
          <div v-if="activeTab === 'execution'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900">Proposal Execution Workflow</h2>
                <p class="text-sm text-gray-500 mt-1">Track proposals from approval to engagement</p>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eng. Code</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="item in executionQueue" :key="item.id" class="hover:bg-gray-50">
                      <td class="px-6 py-4">
                        <span class="text-sm font-medium text-blue-600">{{ item.request_id }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-600">{{ item.client_name }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm font-mono text-gray-600">{{ item.engagement_code || 'Pending' }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span :class="getStageClass(item)" class="px-2 py-1 text-xs font-medium rounded">
                          {{ getStageLabel(item) }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-600">{{ item.days_in_monitoring || 0 }}</span>
                      </td>
                      <td class="px-6 py-4 space-x-2">
                        <button v-if="!item.proposal_sent_date" @click="sendProposal(item)" class="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Send Proposal</button>
                        <button v-else-if="!item.client_response_type" @click="recordResponse(item)" class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">Record Response</button>
                        <button v-else-if="item.client_response_type === 'Accepted'" @click="sendEngagementLetter(item)" class="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200">Send EL</button>
                        <button @click="viewDetails(item)" class="text-blue-600 hover:text-blue-800 text-xs">View</button>
                      </td>
                    </tr>
                    <tr v-if="executionQueue.length === 0">
                      <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        No items in execution queue
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Monitoring Tab -->
          <div v-if="activeTab === 'monitoring'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 class="font-semibold text-gray-900">10/20/30 Day Monitoring</h2>
                  <p class="text-sm text-gray-500 mt-1">Engagement tracking and expiry alerts</p>
                </div>
                <button @click="runMonitoringCheck" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                  Send Alerts
                </button>
              </div>

              <div class="p-6 space-y-6">
                <!-- 10-Day Alerts -->
                <div>
                  <h3 class="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <span class="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                    10-Day Alerts ({{ tenDayAlerts.length }})
                  </h3>
                  <div v-if="tenDayAlerts.length" class="bg-white border-l-4 border-yellow-500 border border-gray-200 rounded-lg divide-y divide-gray-200">
                    <div v-for="alert in tenDayAlerts" :key="alert.id" class="flex justify-between items-center p-3">
                      <div>
                        <span class="text-sm font-medium text-gray-900">{{ alert.request_id }}</span>
                        <span class="text-sm text-gray-500 ml-2">{{ alert.client_name }}</span>
                      </div>
                      <div class="flex items-center gap-3">
                        <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{{ alert.days_in_monitoring }} days</span>
                        <button @click="viewDetails(alert)" class="text-gray-600 hover:text-gray-900 text-sm">View</button>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-sm text-gray-400 py-2">No 10-day alerts</div>
                </div>

                <!-- 20-Day Alerts -->
                <div>
                  <h3 class="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <span class="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
                    20-Day Alerts ({{ twentyDayAlerts.length }})
                  </h3>
                  <div v-if="twentyDayAlerts.length" class="bg-white border-l-4 border-orange-500 border border-gray-200 rounded-lg divide-y divide-gray-200">
                    <div v-for="alert in twentyDayAlerts" :key="alert.id" class="flex justify-between items-center p-3">
                      <div>
                        <span class="text-sm font-medium text-gray-900">{{ alert.request_id }}</span>
                        <span class="text-sm text-gray-500 ml-2">{{ alert.client_name }}</span>
                      </div>
                      <div class="flex items-center gap-3">
                        <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{{ alert.days_in_monitoring }} days - URGENT</span>
                        <button @click="viewDetails(alert)" class="text-gray-600 hover:text-gray-900 text-sm">View</button>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-sm text-gray-400 py-2">No 20-day alerts</div>
                </div>

                <!-- 30-Day Exceeded -->
                <div>
                  <h3 class="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <span class="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                    30-Day Exceeded ({{ thirtyDayAlerts.length }})
                  </h3>
                  <div v-if="thirtyDayAlerts.length" class="bg-white border-l-4 border-red-500 border border-gray-200 rounded-lg divide-y divide-gray-200">
                    <div v-for="alert in thirtyDayAlerts" :key="alert.id" class="flex justify-between items-center p-3">
                      <div>
                        <span class="text-sm font-medium text-gray-900">{{ alert.request_id }}</span>
                        <span class="text-sm text-gray-500 ml-2">{{ alert.client_name }}</span>
                      </div>
                      <div class="flex items-center gap-3">
                        <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{{ alert.days_in_monitoring }} days - LAPSED</span>
                        <button @click="viewDetails(alert)" class="text-gray-600 hover:text-gray-900 text-sm">View</button>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-sm text-gray-400 py-2">No 30-day exceeded alerts</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Renewals Tab -->
          <div v-if="activeTab === 'renewals'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900">3-Year Renewal Tracking</h2>
                <p class="text-sm text-gray-500 mt-1">Engagements due for renewal review</p>
              </div>

              <div class="p-6">
                <div class="grid grid-cols-3 gap-4 mb-6">
                  <div class="bg-white border-l-4 border-red-500 border border-gray-200 rounded-lg p-4">
                    <p class="text-sm font-medium text-gray-900">30-Day Warning</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ renewal30Day.length }}</p>
                  </div>
                  <div class="bg-white border-l-4 border-orange-500 border border-gray-200 rounded-lg p-4">
                    <p class="text-sm font-medium text-gray-900">60-Day Warning</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ renewal60Day.length }}</p>
                  </div>
                  <div class="bg-white border-l-4 border-yellow-500 border border-gray-200 rounded-lg p-4">
                    <p class="text-sm font-medium text-gray-900">90-Day Warning</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">{{ renewal90Day.length }}</p>
                  </div>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request ID</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Renewal Due</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                      <tr v-for="item in allRenewals" :key="item.id" class="hover:bg-gray-50">
                        <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ item.request_id }}</td>
                        <td class="px-4 py-3 text-sm text-gray-600">{{ item.client_name }}</td>
                        <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(item.created_at) }}</td>
                        <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(item.next_renewal_date) }}</td>
                        <td class="px-4 py-3">
                          <span :class="getRenewalStatusClass(item)" class="px-2 py-1 text-xs font-medium rounded">
                            {{ item.renewal_alert_status || 'None' }}
                          </span>
                        </td>
                      </tr>
                      <tr v-if="allRenewals.length === 0">
                        <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                          No renewals due
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- ISQM Tab -->
          <div v-if="activeTab === 'isqm'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 class="font-semibold text-gray-900">ISQM Forms Management</h2>
                  <p class="text-sm text-gray-500 mt-1">Client Screening and New Client Acceptance</p>
                </div>
                <button class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                  + Upload Form
                </button>
              </div>

              <div class="p-6">
                <div class="grid grid-cols-2 gap-6">
                  <div class="border border-gray-200 rounded-lg p-6">
                    <div class="flex items-center mb-4">
                      <div class="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 class="font-medium text-gray-900">Client Screening Questionnaire</h3>
                        <p class="text-sm text-gray-500">Pre-engagement risk assessment</p>
                      </div>
                    </div>
                    <div class="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                      <svg class="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                      </svg>
                      <p class="text-sm text-gray-500">Upload PDF template</p>
                    </div>
                  </div>

                  <div class="border border-gray-200 rounded-lg p-6">
                    <div class="flex items-center mb-4">
                      <div class="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                        </svg>
                      </div>
                      <div>
                        <h3 class="font-medium text-gray-900">New Client Acceptance Checklist</h3>
                        <p class="text-sm text-gray-500">Acceptance documentation</p>
                      </div>
                    </div>
                    <div class="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                      <svg class="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                      </svg>
                      <p class="text-sm text-gray-500">Upload PDF template</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Client Creations Tab -->
          <div v-if="activeTab === 'client-creations'" class="space-y-6">
            <PendingClientCreationsPanel @refresh="loadPendingClientCreations" />
          </div>

          <!-- Parent Company Updates Tab (PRMS Admin) -->
          <div v-if="activeTab === 'parent-updates'" class="space-y-6">
            <ParentCompanyUpdateRequestsPanel @refresh="loadPendingParentUpdates" />
          </div>

          <!-- User Management Tab (Approver Availability) -->
          <div v-if="activeTab === 'users'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900">Approver Availability Management</h2>
                <p class="text-sm text-gray-500 mt-1">Manage approver availability for workflow routing</p>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Until</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="user in approverUsers" :key="user.id" class="hover:bg-gray-50">
                      <td class="px-6 py-4">
                        <div class="flex items-center">
                          <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 mr-3">
                            {{ user.name?.charAt(0) || '?' }}
                          </div>
                          <div>
                            <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                            <div class="text-xs text-gray-500">{{ user.email }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-gray-700">{{ user.role }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span 
                          :class="user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                          class="px-2 py-1 text-xs font-medium rounded"
                        >
                          {{ user.is_active ? 'Available' : 'Unavailable' }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <span v-if="user.unavailable_until" class="text-sm text-gray-600">
                          {{ formatDate(user.unavailable_until) }}
                        </span>
                        <span v-else-if="!user.is_active" class="text-sm text-gray-400 italic">Indefinite</span>
                        <span v-else class="text-sm text-gray-400">-</span>
                      </td>
                      <td class="px-6 py-4">
                        <button 
                          v-if="user.is_active"
                          @click="openAvailabilityModal(user, 'unavailable')"
                          class="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Mark Unavailable
                        </button>
                        <button 
                          v-else
                          @click="markUserAvailable(user)"
                          class="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                        >
                          Mark Available
                        </button>
                      </td>
                    </tr>
                    <tr v-if="approverUsers.length === 0">
                      <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                        No approver users found
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Configuration Tab -->
          <div v-if="activeTab === 'config'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="font-semibold text-gray-900">System Configuration</h2>
                <p class="text-sm text-gray-500 mt-1">Configure system settings and workflows</p>
              </div>
              <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <router-link
                    to="/coi/admin/priority-config"
                    class="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                      </div>
                      <div>
                        <div class="font-medium text-sm text-gray-900">Priority Configuration</div>
                        <div class="text-xs text-gray-500">Configure priority scoring rules</div>
                      </div>
                    </div>
                  </router-link>
                  <router-link
                    to="/coi/admin/sla-config"
                    class="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div>
                        <div class="font-medium text-sm text-gray-900">SLA Configuration</div>
                        <div class="text-xs text-gray-500">Configure Service Level Agreements</div>
                      </div>
                    </div>
                  </router-link>
                  <router-link
                    to="/coi/admin/email-config"
                    class="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center">
                        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                      </div>
                      <div>
                        <div class="font-medium text-sm text-gray-900">Email Configuration</div>
                        <div class="text-xs text-gray-500">Configure SMTP settings for notifications</div>
                      </div>
                    </div>
                  </router-link>
                </div>
              </div>
            </div>
          </div>

          <!-- Global COI Tab -->
          <div v-if="activeTab === 'global'" class="space-y-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
              <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 class="font-semibold text-gray-900">Global COI Portal</h2>
                  <p class="text-sm text-gray-500 mt-1">International engagement management and export</p>
                </div>
                <button @click="exportToExcel" class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  Export to Excel
                </button>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request ID</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Countries</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Global Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="item in globalEngagements" :key="item.id" class="hover:bg-gray-50">
                      <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ item.request_id }}</td>
                      <td class="px-6 py-4 text-sm text-gray-600">{{ item.client_name }}</td>
                      <td class="px-6 py-4 text-sm text-gray-600">{{ item.service_type }}</td>
                      <td class="px-6 py-4 text-sm text-gray-600">{{ item.foreign_subsidiaries || 'N/A' }}</td>
                      <td class="px-6 py-4">
                        <span :class="getGlobalStatusClass(item.global_clearance_status)" class="px-2 py-1 text-xs font-medium rounded">
                          {{ item.global_clearance_status }}
                        </span>
                      </td>
                    </tr>
                    <tr v-if="globalEngagements.length === 0">
                      <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                        No international engagements
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

    <!-- Availability Modal -->
    <div v-if="showAvailabilityModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Mark {{ selectedUser?.name }} as Unavailable</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <select v-model="availabilityForm.reason" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="">Select reason...</option>
              <option value="vacation">Vacation</option>
              <option value="business_trip">Business Trip</option>
              <option value="sick_leave">Sick Leave</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Unavailable Until (Optional)</label>
            <input 
              v-model="availabilityForm.until" 
              type="date" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <p class="text-xs text-gray-500 mt-1">Leave empty for indefinite unavailability</p>
          </div>
          <div class="bg-amber-50 border border-amber-200 rounded-md p-3">
            <p class="text-xs text-amber-700">
              <strong>Note:</strong> When this user is marked unavailable, requests that would be 
              routed to them will be escalated to the next available approver or to Admin.
            </p>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showAvailabilityModal = false" class="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button @click="submitAvailabilityChange" class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700">
            Mark Unavailable
          </button>
        </div>
      </div>
    </div>

    <!-- Response Modal -->
    <div v-if="showResponseModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Record Client Response</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Response Type</label>
            <select v-model="responseType" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="">Select response...</option>
              <option value="Accepted">Accepted</option>
              <option value="Declined">Declined</option>
              <option value="Pending">Still Pending</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea v-model="responseNotes" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showResponseModal = false" class="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button @click="submitResponse" class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Save Response
          </button>
        </div>
      </div>
    </div>

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
      @close="showSearch = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useCOIRequestsStore } from '@/stores/coiRequests'
import PendingClientCreationsPanel from '@/components/admin/PendingClientCreationsPanel.vue'
import ParentCompanyUpdateRequestsPanel from '@/components/admin/ParentCompanyUpdateRequestsPanel.vue'
import api from '@/services/api'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal.vue'
import GlobalSearch from '@/components/ui/GlobalSearch.vue'

const router = useRouter()
const coiStore = useCOIRequestsStore()

const activeTab = ref('overview')
const showResponseModal = ref(false)
const selectedRequest = ref<any>(null)
const responseType = ref('')
const responseNotes = ref('')
const showSearch = ref(false)

// Keyboard shortcuts
const { 
  registerShortcuts, 
  showHelpModal, 
  toggleHelp, 
  getShortcutGroups, 
  formatShortcutKey 
} = useKeyboardShortcuts()

// Register keyboard shortcuts
onMounted(() => {
  console.log('[AdminDashboard] Registering keyboard shortcuts')
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
    },
    {
      key: 'g o',
      description: 'Go to Overview',
      handler: () => { activeTab.value = 'overview' },
      group: 'Navigation'
    },
    {
      key: 'g e',
      description: 'Go to Execution Queue',
      handler: () => { activeTab.value = 'execution' },
      group: 'Navigation'
    },
    {
      key: 'g m',
      description: 'Go to Monitoring',
      handler: () => { activeTab.value = 'monitoring' },
      group: 'Navigation'
    },
    {
      key: 'g r',
      description: 'Go to Renewals',
      handler: () => { activeTab.value = 'renewals' },
      group: 'Navigation'
    },
    {
      key: 'g u',
      description: 'Go to User Management',
      handler: () => { activeTab.value = 'users' },
      group: 'Navigation'
    },
    {
      key: 'g c',
      description: 'Go to Configuration',
      handler: () => { activeTab.value = 'config' },
      group: 'Navigation'
    }
  ])
})

// User availability management
const showAvailabilityModal = ref(false)
const selectedUser = ref<any>(null)
const availabilityForm = ref({
  reason: '',
  until: ''
})

const requests = computed(() => coiStore.requests)

// Icon components
const OverviewIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' })
    ])
  }
}

const ExecutionIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' })
    ])
  }
}

const MonitoringIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' })
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

const ISQMIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' })
    ])
  }
}

const ConfigIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }),
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' })
    ])
  }
}

const GlobalIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064' })
    ])
  }
}

const ParentCompanyIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' })
    ])
  }
}
const ClientCreationsIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' })
    ])
  }
}

// Stats
const totalRequests = computed(() => requests.value.length)
const activeEngagements = computed(() => requests.value.filter(r => r.status === 'Active').length)
const pendingProposals = computed(() => requests.value.filter(r => r.stage === 'Proposal' && r.status === 'Approved').length)
const alertCount = computed(() => tenDayAlerts.value.length + twentyDayAlerts.value.length + thirtyDayAlerts.value.length)
const renewalsDue = computed(() => allRenewals.value.length)

// Monitoring alerts
const tenDayAlerts = computed(() => requests.value.filter(r => 
  r.days_in_monitoring >= 10 && r.days_in_monitoring < 20 && r.status === 'Approved'
))
const twentyDayAlerts = computed(() => requests.value.filter(r => 
  r.days_in_monitoring >= 20 && r.days_in_monitoring < 30 && r.status === 'Approved'
))
const thirtyDayAlerts = computed(() => requests.value.filter(r => 
  r.days_in_monitoring >= 30 && r.status === 'Approved'
))

// Execution queue
const executionQueue = computed(() => requests.value.filter(r => 
  ['Approved', 'Active'].includes(r.status) && r.engagement_code
))

// Renewals
const renewal30Day = computed(() => requests.value.filter(r => r.renewal_alert_status === '30-Day'))
const renewal60Day = computed(() => requests.value.filter(r => r.renewal_alert_status === '60-Day'))
const renewal90Day = computed(() => requests.value.filter(r => r.renewal_alert_status === '90-Day'))
const allRenewals = computed(() => [...renewal30Day.value, ...renewal60Day.value, ...renewal90Day.value])

// Global engagements
const globalEngagements = computed(() => requests.value.filter(r => r.international_operations))

// Client creation requests
const pendingClientCreations = ref(0)
const pendingParentUpdates = ref(0)

const UserIcon = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' })
    ])
  }
}

// Approver users (Directors, Compliance, Partners, Finance)
const approverUsers = ref<any[]>([])

const tabs = computed(() => [
  { id: 'overview', label: 'Overview', icon: OverviewIcon, count: 0, alertColor: '' },
  { id: 'execution', label: 'Execution Queue', icon: ExecutionIcon, count: executionQueue.value.length, alertColor: 'bg-blue-100 text-blue-700' },
  { id: 'monitoring', label: 'Monitoring', icon: MonitoringIcon, count: alertCount.value, alertColor: alertCount.value > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600' },
  { id: 'renewals', label: '3-Year Renewals', icon: RenewalIcon, count: renewalsDue.value, alertColor: 'bg-purple-100 text-purple-700' },
  { id: 'users', label: 'User Management', icon: UserIcon, count: approverUsers.value.filter(u => !u.is_active).length, alertColor: approverUsers.value.filter(u => !u.is_active).length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600' },
  { id: 'client-creations', label: 'Client Creations', icon: ClientCreationsIcon, count: pendingClientCreations.value, alertColor: pendingClientCreations.value > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600' },
  { id: 'parent-updates', label: 'Parent Company Updates', icon: ParentCompanyIcon, count: pendingParentUpdates.value, alertColor: pendingParentUpdates.value > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600' },
  { id: 'isqm', label: 'ISQM Forms', icon: ISQMIcon, count: 0, alertColor: '' },
  { id: 'global', label: 'Global COI', icon: GlobalIcon, count: globalEngagements.value.length, alertColor: 'bg-gray-100 text-gray-600' },
  { id: 'config', label: 'Configuration', icon: ConfigIcon, count: 0, alertColor: '' }
])

function getStageClass(item: any) {
  if (!item.proposal_sent_date) return 'bg-gray-100 text-gray-700'
  if (!item.client_response_type) return 'bg-yellow-100 text-yellow-700'
  if (item.client_response_type === 'Accepted') return 'bg-green-100 text-green-700'
  return 'bg-red-100 text-red-700'
}

function getStageLabel(item: any) {
  if (!item.proposal_sent_date) return 'Proposal Pending'
  if (!item.client_response_type) return 'Awaiting Response'
  if (item.client_response_type === 'Accepted') return 'Accepted'
  return item.client_response_type
}

function getRenewalStatusClass(item: any) {
  const status = item.renewal_alert_status || 'None'
  const classes: Record<string, string> = {
    '30-Day': 'bg-red-100 text-red-700',
    '60-Day': 'bg-orange-100 text-orange-700',
    '90-Day': 'bg-yellow-100 text-yellow-700',
    'None': 'bg-gray-100 text-gray-700'
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

function getGlobalStatusClass(status: string) {
  const classes: Record<string, string> = {
    'Approved': 'bg-green-100 text-green-700',
    'Pending': 'bg-yellow-100 text-yellow-700',
    'Not Required': 'bg-gray-100 text-gray-700',
    'Rejected': 'bg-red-100 text-red-700'
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function viewDetails(item: any) {
  router.push(`/coi/request/${item.id}`)
}

async function sendProposal(item: any) {
  try {
    await api.post(`/coi/requests/${item.id}/execute`, { action: 'send_proposal' })
    coiStore.fetchRequests()
  } catch (error) {
    console.error('Failed to send proposal:', error)
  }
}

function recordResponse(item: any) {
  selectedRequest.value = item
  showResponseModal.value = true
}

async function submitResponse() {
  if (!selectedRequest.value || !responseType.value) return
  try {
    await api.post(`/coi/requests/${selectedRequest.value.id}/execute`, {
      action: 'record_response',
      response_type: responseType.value,
      notes: responseNotes.value
    })
    showResponseModal.value = false
    selectedRequest.value = null
    responseType.value = ''
    responseNotes.value = ''
    coiStore.fetchRequests()
  } catch (error) {
    console.error('Failed to record response:', error)
  }
}

async function sendEngagementLetter(item: any) {
  try {
    await api.post(`/coi/requests/${item.id}/execute`, { action: 'send_engagement_letter' })
    coiStore.fetchRequests()
  } catch (error) {
    console.error('Failed to send engagement letter:', error)
  }
}

async function runMonitoringCheck() {
  try {
    await api.post('/coi/monitoring/update')
    coiStore.fetchRequests()
  } catch (error) {
    console.error('Failed to run monitoring check:', error)
  }
}

function exportToExcel() {
  // Trigger Excel export
  const data = globalEngagements.value.map(item => ({
    'Request ID': item.request_id,
    'Client': item.client_name,
    'Service': item.service_type,
    'Countries': item.foreign_subsidiaries,
    'Status': item.global_clearance_status
  }))
  console.log('Exporting to Excel:', data)
  // Implementation would generate actual Excel file
}

onMounted(() => {
  coiStore.fetchRequests()
  loadPendingClientCreations()
  loadPendingParentUpdates()
  loadApproverUsers()
})

async function loadPendingClientCreations() {
  try {
    const response = await api.get('/prospect-client-creation/pending')
    pendingClientCreations.value = response.data.length
  } catch (error) {
    console.error('Error loading pending client creations:', error)
  }
}

async function loadPendingParentUpdates() {
  try {
    const response = await api.get('/parent-company-update-requests', { params: { status: 'Pending' } })
    pendingParentUpdates.value = (response.data || []).length
  } catch (error) {
    console.error('Error loading pending parent company updates:', error)
  }
}

async function loadApproverUsers() {
  try {
    const response = await api.get('/users/approvers')
    approverUsers.value = response.data
  } catch (error) {
    console.error('Error loading approver users:', error)
  }
}

function openAvailabilityModal(user: any, action: string) {
  selectedUser.value = user
  availabilityForm.value = { reason: '', until: '' }
  showAvailabilityModal.value = true
}

async function submitAvailabilityChange() {
  if (!selectedUser.value) return
  
  try {
    await api.post(`/users/${selectedUser.value.id}/availability`, {
      is_active: false,
      unavailable_reason: availabilityForm.value.reason,
      unavailable_until: availabilityForm.value.until || null
    })
    showAvailabilityModal.value = false
    loadApproverUsers()
  } catch (error) {
    console.error('Error updating user availability:', error)
  }
}

async function markUserAvailable(user: any) {
  try {
    await api.post(`/users/${user.id}/availability`, {
      is_active: true,
      unavailable_reason: null,
      unavailable_until: null
    })
    loadApproverUsers()
  } catch (error) {
    console.error('Error updating user availability:', error)
  }
}
</script>
