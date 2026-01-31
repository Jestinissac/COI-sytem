<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-gray-900">System Administration</h1>
      <div class="flex items-center gap-3">
        <router-link
          to="/coi/entity-codes"
          class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
          </svg>
          Entity Codes
        </router-link>
        <router-link
          to="/coi/service-catalog"
          class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Service Catalog
        </router-link>
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

    <!-- Rules: CMA (primary) + IESBA (secondary) only -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex items-center gap-2">
      <span class="text-sm font-medium text-gray-700">Rules framework:</span>
      <span class="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">CMA</span>
      <span class="text-gray-400">+</span>
      <span class="px-2 py-1 text-xs font-medium rounded bg-indigo-100 text-indigo-700">IESBA</span>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-4 gap-4">
      <div class="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
        <div class="text-3xl font-bold text-gray-900">{{ totalUsers }}</div>
        <div class="text-sm text-gray-500">Total Users</div>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
        <div class="text-3xl font-bold text-gray-900">{{ activeUsers }}</div>
        <div class="text-sm text-gray-500">Active Users</div>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
        <div class="text-3xl font-bold text-gray-900">{{ totalRequests }}</div>
        <div class="text-sm text-gray-500">Total Requests</div>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
        <div class="text-3xl font-bold text-gray-900">{{ auditLogsCount }}</div>
        <div class="text-sm text-gray-500">Audit Logs</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="bg-white rounded-lg shadow-sm">
      <div class="border-b">
        <div class="flex gap-1 px-4">
          <button 
            @click="activeTab = 'users'"
            :class="activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'"
            class="px-4 py-3 text-sm font-medium"
          >
            User Management
          </button>
          <button 
            @click="activeTab = 'perspectives'"
            :class="activeTab === 'perspectives' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'"
            class="px-4 py-3 text-sm font-medium"
          >
            Role Perspectives
          </button>
          <button 
            @click="activeTab = 'config'"
            :class="activeTab === 'config' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'"
            class="px-4 py-3 text-sm font-medium"
          >
            Configuration
          </button>
          <button 
            @click="activeTab = 'logs'"
            :class="activeTab === 'logs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'"
            class="px-4 py-3 text-sm font-medium"
          >
            Audit Logs
          </button>
        </div>
      </div>

      <!-- Users Tab -->
      <div v-if="activeTab === 'users'" class="p-4">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="relative">
              <input 
                v-model="userSearch"
                type="text" 
                placeholder="Search users..." 
                class="pl-8 pr-3 py-1.5 text-sm border rounded w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <svg class="w-4 h-4 text-gray-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <select v-model="roleFilter" class="text-sm border rounded px-3 py-1.5">
              <option value="">All Roles</option>
              <option value="Requester">Requester</option>
              <option value="Director">Director</option>
              <option value="Compliance">Compliance</option>
              <option value="Partner">Partner</option>
              <option value="Finance">Finance</option>
              <option value="Admin">Admin</option>
              <option value="Super Admin">Super Admin</option>
            </select>
          </div>
          <button 
            @click="openAddUserModal"
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            + Add User
          </button>
        </div>

        <table class="w-full">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-4 py-3 text-left font-medium">Name</th>
              <th class="px-4 py-3 text-left font-medium">Email</th>
              <th class="px-4 py-3 text-left font-medium">Role</th>
              <th class="px-4 py-3 text-left font-medium">Department</th>
              <th class="px-4 py-3 text-left font-medium">Status</th>
              <th class="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ user.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ user.email }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ user.role }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ user.department }}</td>
              <td class="px-4 py-3">
                <span :class="user.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'" class="px-2 py-1 text-xs font-medium rounded">
                  {{ user.active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <button 
                  @click="openEditUserModal(user)"
                  class="text-blue-600 hover:text-blue-800 text-sm mr-2"
                >
                  Edit
                </button>
                <button 
                  v-if="user.active"
                  @click="handleDisableUser(user)"
                  :disabled="user.role === 'Super Admin'"
                  class="text-red-600 hover:text-red-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Disable
                </button>
                <button 
                  v-else
                  @click="handleEnableUser(user)"
                  class="text-green-600 hover:text-green-800 text-sm"
                >
                  Enable
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="flex items-center justify-between px-4 py-3 border-t">
          <div class="text-sm text-gray-500">Showing {{ filteredUsers.length }} of {{ users.length }} users</div>
        </div>
      </div>

      <!-- Role Perspectives Tab -->
      <div v-if="activeTab === 'perspectives'" class="p-4">
        <div class="mb-6">
          <h3 class="font-medium text-gray-900 mb-2">View as Role</h3>
          <p class="text-sm text-gray-500 mb-4">Switch between role perspectives to see what each user type experiences</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="role in roleOptions"
              :key="role.value"
              @click="selectedPerspective = role.value"
              :class="selectedPerspective === role.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            >
              {{ role.label }}
            </button>
          </div>
        </div>

        <!-- Perspective Content -->
        <div class="border rounded-lg p-4 bg-gray-50">
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-medium text-gray-900">
              {{ getRolePerspectiveTitle(selectedPerspective) }}
            </h4>
            <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
              Preview Mode
            </span>
          </div>

          <!-- Requester Perspective -->
          <div v-if="selectedPerspective === 'Requester'" class="space-y-4">
            <div class="grid grid-cols-4 gap-4">
              <div class="bg-white p-3 rounded border">
                <div class="text-xl font-bold">{{ requesterStats.total }}</div>
                <div class="text-xs text-gray-500">Total Requests</div>
              </div>
              <div class="bg-white p-3 rounded border">
                <div class="text-xl font-bold text-yellow-600">{{ requesterStats.pending }}</div>
                <div class="text-xs text-gray-500">In Progress</div>
              </div>
              <div class="bg-white p-3 rounded border">
                <div class="text-xl font-bold text-green-600">{{ requesterStats.approved }}</div>
                <div class="text-xs text-gray-500">Approved</div>
              </div>
              <div class="bg-white p-3 rounded border">
                <div class="text-xl font-bold text-gray-500">{{ requesterStats.drafts }}</div>
                <div class="text-xs text-gray-500">Drafts</div>
              </div>
            </div>
            <p class="text-sm text-gray-600">
              Requesters can create COI requests, track their status, send proposals, and record client responses.
            </p>
          </div>

          <!-- Director Perspective -->
          <div v-if="selectedPerspective === 'Director'" class="space-y-4">
            <div class="grid grid-cols-4 gap-4">
              <div class="bg-white p-3 rounded border">
                <div class="text-xl font-bold text-orange-600">{{ directorStats.pendingApproval }}</div>
                <div class="text-xs text-gray-500">Pending Approval</div>
              </div>
              <div class="bg-white p-3 rounded border">
                <div class="text-xl font-bold text-blue-600">{{ directorStats.teamRequests }}</div>
                <div class="text-xs text-gray-500">Team Requests</div>
              </div>
              <div class="bg-white p-3 rounded border">
                <div class="text-xl font-bold text-green-600">{{ directorStats.approved }}</div>
                <div class="text-xs text-gray-500">Approved</div>
              </div>
              <div class="bg-white p-3 rounded border">
                <div class="text-xl font-bold text-purple-600">{{ directorStats.tracking }}</div>
                <div class="text-xs text-gray-500">In Tracking</div>
              </div>
            </div>
            <p class="text-sm text-gray-600">
              Directors approve team requests and can track proposals/engagements for their entire team.
            </p>
          </div>

          <!-- Compliance Perspective -->
          <div v-if="selectedPerspective === 'Compliance'" class="space-y-4">
            <div class="grid grid-cols-4 gap-4">
              <div class="bg-white p-3 rounded border">
                <div class="text-xl font-bold text-blue-600">{{ complianceStats.pending }}</div>
                <div class="text-xs text-gray-500">Pending Review</div>
              </div>
              <div class="bg-white p-3 rounded border">
                <div class="text-xl font-bold text-red-600">{{ complianceStats.conflicts }}</div>
                <div class="text-xs text-gray-500">Conflicts</div>
              </div>
              <div class="bg-white p-3 rounded border">
                <div class="text-xl font-bold text-yellow-600">{{ complianceStats.duplications }}</div>
                <div class="text-xs text-gray-500">Duplications</div>
              </div>
              <div class="bg-white p-3 rounded border">
                <div class="text-xl font-bold text-amber-600">{{ complianceStats.stale }}</div>
                <div class="text-xs text-gray-500">Stale Requests</div>
              </div>
            </div>
            <p class="text-sm text-gray-600">
              Compliance reviews requests for conflicts, manages business rules, and monitors pipeline health.
            </p>
          </div>

          <!-- Partner Perspective -->
          <div v-if="selectedPerspective === 'Partner'" class="space-y-4">
            <div class="grid grid-cols-4 gap-4">
              <div class="bg-white p-3 rounded border">
                <div class="text-xl font-bold text-purple-600">{{ partnerStats.pendingApproval }}</div>
                <div class="text-xs text-gray-500">Pending Approval</div>
              </div>
              <div class="bg-white p-3 rounded border">
                <div class="text-xl font-bold text-green-600">{{ partnerStats.active }}</div>
                <div class="text-xs text-gray-500">Active Engagements</div>
              </div>
              <div class="bg-white p-3 rounded border">
                <div class="text-xl font-bold text-red-600">{{ partnerStats.redFlags }}</div>
                <div class="text-xs text-gray-500">Red Flags</div>
              </div>
              <div class="bg-white p-3 rounded border">
                <div class="text-xl font-bold text-orange-600">{{ partnerStats.expiring }}</div>
                <div class="text-xs text-gray-500">Expiring Soon</div>
              </div>
            </div>
            <p class="text-sm text-gray-600">
              Partners provide final approval, monitor engagement status, and track expiring engagements.
            </p>
          </div>

          <!-- Finance Perspective -->
          <div v-if="selectedPerspective === 'Finance'" class="space-y-4">
            <div class="grid grid-cols-4 gap-4">
              <div class="bg-white p-3 rounded border">
                <div class="text-xl font-bold text-indigo-600">{{ financeStats.pendingCodes }}</div>
                <div class="text-xs text-gray-500">Pending Codes</div>
              </div>
              <div class="bg-white p-3 rounded border">
                <div class="text-xl font-bold text-green-600">{{ financeStats.generated }}</div>
                <div class="text-xs text-gray-500">Codes Generated</div>
              </div>
              <div class="bg-white p-3 rounded border">
                <div class="text-xl font-bold text-gray-600">{{ financeStats.total }}</div>
                <div class="text-xs text-gray-500">Total This Year</div>
              </div>
              <div class="bg-white p-3 rounded border">
                <div class="text-xl font-bold text-blue-600">{{ financeStats.active }}</div>
                <div class="text-xs text-gray-500">Active Engagements</div>
              </div>
            </div>
            <p class="text-sm text-gray-600">
              Finance generates engagement codes and manages financial parameters for approved requests.
            </p>
          </div>
        </div>

        <!-- Quick Access Links -->
        <div class="mt-6">
          <h4 class="font-medium text-gray-900 mb-3">Quick Access</h4>
          <div class="flex flex-wrap gap-2">
            <router-link 
              v-if="selectedPerspective === 'Requester'"
              to="/coi/requester"
              class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Open Requester Dashboard →
            </router-link>
            <router-link 
              v-if="selectedPerspective === 'Director'"
              to="/coi/director"
              class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Open Director Dashboard →
            </router-link>
            <router-link 
              v-if="selectedPerspective === 'Compliance'"
              to="/coi/compliance"
              class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Open Compliance Dashboard →
            </router-link>
            <router-link 
              v-if="selectedPerspective === 'Partner'"
              to="/coi/partner"
              class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Open Partner Dashboard →
            </router-link>
            <router-link 
              v-if="selectedPerspective === 'Finance'"
              to="/coi/finance"
              class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Open Finance Dashboard →
            </router-link>
          </div>
        </div>
      </div>

      <!-- Configuration Tab -->
      <div v-if="activeTab === 'config'" class="p-4">
        <div class="space-y-6">
          <!-- Configuration Tools -->
          <div>
            <h3 class="font-medium text-gray-900 mb-4">Configuration Tools</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
              <router-link
                to="/coi/admin/permission-config"
                class="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </div>
                  <div>
                    <div class="font-medium text-sm text-gray-900">Permission Configuration</div>
                    <div class="text-xs text-gray-500">Manage role-based permissions dynamically</div>
                  </div>
                </div>
              </router-link>
            </div>
          </div>

          <div>
            <h3 class="font-medium text-gray-900 mb-4">Workflow Settings</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div class="font-medium text-sm">Director Approval Required</div>
                  <div class="text-xs text-gray-500">All requests require director sign-off</div>
                </div>
                <button class="w-12 h-6 bg-blue-600 rounded-full relative">
                  <span class="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                </button>
              </div>
              <div class="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div class="font-medium text-sm">Compliance Review</div>
                  <div class="text-xs text-gray-500">Enable compliance team review</div>
                </div>
                <button class="w-12 h-6 bg-blue-600 rounded-full relative">
                  <span class="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                </button>
              </div>
              <div class="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div class="font-medium text-sm">30-Day Monitoring</div>
                  <div class="text-xs text-gray-500">Enable automatic monitoring period</div>
                </div>
                <button class="w-12 h-6 bg-blue-600 rounded-full relative">
                  <span class="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 class="font-medium text-gray-900 mb-4">Notification Settings</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div class="font-medium text-sm">Email Notifications</div>
                  <div class="text-xs text-gray-500">Send email on status changes</div>
                </div>
                <button class="w-12 h-6 bg-blue-600 rounded-full relative">
                  <span class="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Audit Logs Tab -->
      <div v-if="activeTab === 'logs'" class="p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-medium text-gray-900">System Audit Logs</h3>
          <button 
            @click="exportAuditLogs"
            class="flex items-center gap-2 px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Export Logs
          </button>
        </div>

        <table class="w-full">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-4 py-3 text-left font-medium">Timestamp</th>
              <th class="px-4 py-3 text-left font-medium">User</th>
              <th class="px-4 py-3 text-left font-medium">Action</th>
              <th class="px-4 py-3 text-left font-medium">Target</th>
              <th class="px-4 py-3 text-left font-medium">IP Address</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="log in auditLogsList" :key="log.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm text-gray-500">{{ formatTimestamp(log.timestamp) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900">{{ log.user_name || 'System' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ log.action }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ log.entity_type }} {{ log.entity_id ? `#${log.entity_id}` : '' }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-500 font-mono">{{ log.ip || 'N/A' }}</td>
            </tr>
            <tr v-if="auditLogsList.length === 0">
              <td colspan="5" class="px-4 py-8 text-center text-gray-500">No audit logs found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add User Modal -->
    <div v-if="showAddUserModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div class="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
          <h3 class="font-medium text-gray-900">Add New User</h3>
        </div>
        <div class="p-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input 
              v-model="newUser.name"
              type="text" 
              class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Full name"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input 
              v-model="newUser.email"
              type="email" 
              class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="user@company.com"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input 
              v-model="newUser.password"
              type="password" 
              class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Password"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select 
                v-model="newUser.role"
                class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select role</option>
                <option value="Requester">Requester</option>
                <option value="Director">Director</option>
                <option value="Compliance">Compliance</option>
                <option value="Partner">Partner</option>
                <option value="Finance">Finance</option>
                <option value="Admin">Admin</option>
                <option value="Super Admin">Super Admin</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select 
                v-model="newUser.department"
                class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select department</option>
                <option value="Audit">Audit</option>
                <option value="Tax">Tax</option>
                <option value="Advisory">Advisory</option>
                <option value="Accounting">Accounting</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div class="flex gap-2 mt-4">
            <button 
              @click="handleAddUser"
              :disabled="!isNewUserValid || loading"
              class="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {{ loading ? 'Creating...' : 'Create User' }}
            </button>
            <button 
              @click="closeAddUserModal"
              class="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditUserModal && editingUser" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div class="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
          <h3 class="font-medium text-gray-900">Edit User</h3>
        </div>
        <div class="p-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input 
              v-model="editingUser.name"
              type="text" 
              class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input 
              v-model="editingUser.email"
              type="email" 
              class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select 
                v-model="editingUser.role"
                class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Requester">Requester</option>
                <option value="Director">Director</option>
                <option value="Compliance">Compliance</option>
                <option value="Partner">Partner</option>
                <option value="Finance">Finance</option>
                <option value="Admin">Admin</option>
                <option value="Super Admin">Super Admin</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select 
                v-model="editingUser.department"
                class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Audit">Audit</option>
                <option value="Tax">Tax</option>
                <option value="Advisory">Advisory</option>
                <option value="Accounting">Accounting</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div class="flex gap-2 mt-4">
            <button 
              @click="handleUpdateUser"
              :disabled="!isEditUserValid || loading"
              class="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {{ loading ? 'Updating...' : 'Update User' }}
            </button>
            <button 
              @click="closeEditUserModal"
              class="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
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
      :user-role="authStore.user?.role"
      :user-id="authStore.user?.id"
      :user-department="authStore.user?.department"
      @close="showSearch = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCOIRequestsStore } from '@/stores/coiRequests'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import GlobalSearch from '@/components/ui/GlobalSearch.vue'
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal.vue'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { usePermissions } from '@/composables/usePermissions'

const coiStore = useCOIRequestsStore()
const authStore = useAuthStore()
const { success, error: showError } = useToast()
const { hasPermission } = usePermissions()

const activeTab = ref('users')
const userSearch = ref('')
const roleFilter = ref('')
const loading = ref(false)
const showAddUserModal = ref(false)
const showEditUserModal = ref(false)
const editingUser = ref<any>(null)
const showSearch = ref(false)

// Keyboard shortcuts
const { 
  registerShortcuts, 
  showHelpModal, 
  toggleHelp, 
  getShortcutGroups, 
  formatShortcutKey 
} = useKeyboardShortcuts()

const users = ref<any[]>([])
const auditLogsList = ref<any[]>([])

// Role Perspectives
const selectedPerspective = ref('Requester')
const roleOptions = [
  { value: 'Requester', label: 'Requester' },
  { value: 'Director', label: 'Director' },
  { value: 'Compliance', label: 'Compliance' },
  { value: 'Partner', label: 'Partner' },
  { value: 'Finance', label: 'Finance' }
]

function getRolePerspectiveTitle(role: string) {
  const titles: Record<string, string> = {
    'Requester': 'Requester Dashboard Overview',
    'Director': 'Director Dashboard Overview',
    'Compliance': 'Compliance Dashboard Overview',
    'Partner': 'Partner Dashboard Overview',
    'Finance': 'Finance Dashboard Overview'
  }
  return titles[role] || 'Dashboard Overview'
}

// Role-specific stats computed properties
const requesterStats = computed(() => ({
  total: coiStore.requests.length,
  pending: coiStore.requests.filter(r => r.status.includes('Pending')).length,
  approved: coiStore.requests.filter(r => r.status === 'Approved' || r.status === 'Active').length,
  drafts: coiStore.requests.filter(r => r.status === 'Draft').length
}))

const directorStats = computed(() => ({
  pendingApproval: coiStore.requests.filter(r => r.status === 'Pending Director Approval').length,
  teamRequests: coiStore.requests.length, // All visible requests
  approved: coiStore.requests.filter(r => r.director_approval_status === 'Approved').length,
  tracking: coiStore.requests.filter(r => ['Approved', 'Active', 'Lapsed'].includes(r.status)).length
}))

const complianceStats = computed(() => ({
  pending: coiStore.requests.filter(r => r.status === 'Pending Compliance').length,
  conflicts: coiStore.requests.filter(r => r.duplication_matches && r.status === 'Pending Compliance').length,
  duplications: coiStore.requests.filter(r => r.duplication_matches).length,
  stale: coiStore.requests.filter(r => r.requires_re_evaluation && r.status === 'Pending Compliance').length
}))

const partnerStats = computed(() => ({
  pendingApproval: coiStore.requests.filter(r => r.status === 'Pending Partner').length,
  active: coiStore.requests.filter(r => r.status === 'Active').length,
  redFlags: coiStore.requests.filter(r => r.duplication_matches).length,
  expiring: coiStore.requests.filter(r => r.status === 'Active' && r.days_in_monitoring && r.days_in_monitoring >= 20).length
}))

const financeStats = computed(() => ({
  pendingCodes: coiStore.requests.filter(r => r.status === 'Pending Finance' && !r.engagement_code).length,
  generated: coiStore.requests.filter(r => r.engagement_code).length,
  total: coiStore.requests.filter(r => r.engagement_code).length,
  active: coiStore.requests.filter(r => r.status === 'Active').length
}))

const totalUsers = computed(() => users.value.length)
const activeUsers = computed(() => users.value.filter(u => u.active).length)
const totalRequests = computed(() => coiStore.requests.length)
const auditLogsCount = computed(() => auditLogsList.value.length)

const newUser = ref({
  name: '',
  email: '',
  password: '',
  role: '',
  department: ''
})

const filteredUsers = computed(() => {
  let result = users.value
  if (userSearch.value) {
    const q = userSearch.value.toLowerCase()
    result = result.filter(u => 
      u.name.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q)
    )
  }
  if (roleFilter.value) {
    result = result.filter(u => u.role === roleFilter.value)
  }
  return result
})

const isNewUserValid = computed(() => {
  return newUser.value.name && 
         newUser.value.email && 
         newUser.value.password && 
         newUser.value.role && 
         newUser.value.department
})

const isEditUserValid = computed(() => {
  return editingUser.value && 
         editingUser.value.name && 
         editingUser.value.email && 
         editingUser.value.role && 
         editingUser.value.department
})

// Watch for tab changes to load audit logs
watch(activeTab, (newTab) => {
  if (newTab === 'logs') {
    fetchAuditLogs()
  }
})

onMounted(async () => {
  await authStore.loadEdition()
  await coiStore.fetchRequests()
  await fetchUsers()
  
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

async function fetchUsers() {
  try {
    const response = await api.get('/auth/users')
    users.value = response.data.map((u: any) => ({ 
      ...u, 
      active: u.active !== undefined ? u.active : 1 
    }))
  } catch (e) {
    showError('Failed to fetch users')
    console.error(e)
  }
}

async function fetchAuditLogs() {
  try {
    const response = await api.get('/auth/audit-logs', { params: { limit: 100 } })
    auditLogsList.value = response.data.logs || []
  } catch (e) {
    showError('Failed to fetch audit logs')
    console.error(e)
  }
}

function openAddUserModal() {
  newUser.value = { name: '', email: '', password: '', role: '', department: '' }
  showAddUserModal.value = true
}

function closeAddUserModal() {
  showAddUserModal.value = false
  newUser.value = { name: '', email: '', password: '', role: '', department: '' }
}

function openEditUserModal(user: any) {
  editingUser.value = { ...user }
  showEditUserModal.value = true
}

function closeEditUserModal() {
  showEditUserModal.value = false
  editingUser.value = null
}

async function handleAddUser() {
  if (!isNewUserValid.value) return
  
  loading.value = true
  try {
    await api.post('/auth/users', newUser.value)
    success('User created successfully')
    closeAddUserModal()
    await fetchUsers()
  } catch (e: any) {
    showError(e.response?.data?.error || 'Failed to create user')
  } finally {
    loading.value = false
  }
}

async function handleUpdateUser() {
  if (!isEditUserValid.value || !editingUser.value.id) return
  
  loading.value = true
  try {
    await api.put(`/auth/users/${editingUser.value.id}`, {
      name: editingUser.value.name,
      email: editingUser.value.email,
      role: editingUser.value.role,
      department: editingUser.value.department
    })
    success('User updated successfully')
    closeEditUserModal()
    await fetchUsers()
  } catch (e: any) {
    showError(e.response?.data?.error || 'Failed to update user')
  } finally {
    loading.value = false
  }
}

async function handleDisableUser(user: any) {
  if (user.role === 'Super Admin') {
    showError('Cannot disable Super Admin user')
    return
  }
  
  if (!confirm(`Are you sure you want to disable ${user.name}?`)) return
  
  try {
    await api.post(`/auth/users/${user.id}/disable`)
    success('User disabled successfully')
    await fetchUsers()
  } catch (e: any) {
    showError(e.response?.data?.error || 'Failed to disable user')
  }
}

async function handleEnableUser(user: any) {
  try {
    await api.post(`/auth/users/${user.id}/enable`)
    success('User enabled successfully')
    await fetchUsers()
  } catch (e: any) {
    showError(e.response?.data?.error || 'Failed to enable user')
  }
}

function exportAuditLogs() {
  const csv = [
    ['Timestamp', 'User', 'Action', 'Target', 'IP Address'],
    ...auditLogsList.value.map(log => [
      formatTimestamp(log.timestamp),
      log.user_name || 'System',
      log.action,
      `${log.entity_type} ${log.entity_id ? `#${log.entity_id}` : ''}`,
      log.ip || 'N/A'
    ])
  ].map(row => row.join(',')).join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  window.URL.revokeObjectURL(url)
  success('Audit logs exported')
}

function formatTimestamp(timestamp: string) {
  if (!timestamp) return 'N/A'
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>
