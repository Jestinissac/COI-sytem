<template>
  <div class="min-h-screen bg-gray-100">
    <div class="max-w-7xl mx-auto px-6 py-6">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-semibold text-gray-900">HRMS Vacation Management</h1>
              <p class="text-sm text-gray-500 mt-1">State Management - Employee & Approver Vacation Status (Requirement 5)</p>
            </div>
            <div class="flex items-center gap-3">
              <button
                @click="syncHRMS"
                :disabled="syncing"
                :aria-label="syncing ? 'Syncing with HRMS' : 'Sync with HRMS'"
                :aria-busy="syncing"
                class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg v-if="syncing" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                {{ syncing ? 'Syncing...' : 'Sync with HRMS' }}
              </button>
              <span class="text-xs text-gray-500">
                Last sync: {{ lastSyncTime || 'Never' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Info Banner -->
        <div class="px-6 py-3 bg-blue-50 border-b border-blue-200">
          <div class="flex items-start gap-2">
            <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div class="text-sm text-blue-700">
              <p class="font-medium">HRMS Integration Status</p>
              <p class="mt-1">This system automatically syncs employee vacation data from HRMS. When an approver is on vacation, requesters are automatically notified about approval delays.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px">
            <button
              @click="activeTab = 'approvers'"
              :class="activeTab === 'approvers' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              class="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
            >
              Approvers on Vacation
              <span v-if="vacationApprovers.length > 0" class="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                {{ vacationApprovers.length }}
              </span>
            </button>
            <button
              @click="activeTab = 'affected'"
              :class="activeTab === 'affected' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              class="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
            >
              Affected Requests
              <span v-if="affectedRequests.length > 0" class="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                {{ affectedRequests.length }}
              </span>
            </button>
            <button
              @click="activeTab = 'sync'"
              :class="activeTab === 'sync' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              class="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
            >
              HRMS Sync Log
            </button>
          </nav>
        </div>

        <!-- Approvers on Vacation Tab -->
        <div v-if="activeTab === 'approvers'" class="p-6">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Approvers Currently on Vacation</h2>
              <p class="text-sm text-gray-500 mt-1">These approvers are unavailable and may delay request approvals</p>
            </div>
            <div class="flex items-center gap-2">
              <input
                v-model="approverSearch"
                type="text"
                placeholder="Search approvers..."
                class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approver</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vacation Reason</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Until</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HRMS Source</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affected Requests</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="approver in filteredVacationApprovers" :key="approver.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-sm font-medium text-red-700 mr-3">
                        {{ approver.name?.charAt(0) || '?' }}
                      </div>
                      <div>
                        <div class="text-sm font-medium text-gray-900">{{ approver.name }}</div>
                        <div class="text-xs text-gray-500">{{ approver.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                      {{ approver.role }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ approver.department || 'N/A' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span class="capitalize">{{ approver.unavailable_reason || 'Vacation' }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {{ formatDate(approver.unavailable_from) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {{ formatDate(approver.unavailable_until) || 'Indefinite' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                      <span v-if="approver.hrms_synced" class="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded flex items-center gap-1">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                        HRMS
                      </span>
                      <span v-else class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        Manual
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                      {{ approver.affected_requests_count || 0 }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button @click="viewAffectedRequests(approver)" class="text-blue-600 hover:text-blue-900 mr-3">
                      View Requests
                    </button>
                    <button @click="markAvailable(approver)" class="text-green-600 hover:text-green-900">
                      Mark Available
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredVacationApprovers.length === 0">
                  <td colspan="9" class="px-6 py-8 text-center text-gray-500">
                    <div class="flex flex-col items-center gap-2">
                      <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <p>No approvers currently on vacation</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Affected Requests Tab -->
        <div v-if="activeTab === 'affected'" class="p-6">
          <div class="mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Requests Affected by Approver Vacation</h2>
            <p class="text-sm text-gray-500 mt-1">These requests are delayed because their approver is on vacation</p>
          </div>

          <div class="space-y-4">
            <div v-for="request in affectedRequests" :key="request.id" 
                 class="bg-white border border-amber-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <span class="text-sm font-semibold text-gray-900">{{ request.request_id }}</span>
                    <span class="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                      Approval Delayed
                    </span>
                  </div>
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="text-gray-500">Client:</span>
                      <span class="ml-2 font-medium text-gray-900">{{ request.client_name }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500">Service:</span>
                      <span class="ml-2 font-medium text-gray-900">{{ request.service_type }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500">Requester:</span>
                      <span class="ml-2 font-medium text-gray-900">{{ request.requester_name }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500">Status:</span>
                      <span class="ml-2 font-medium text-gray-900">{{ request.status }}</span>
                    </div>
                  </div>
                  <div class="mt-3 p-3 bg-amber-50 rounded-lg">
                    <div class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                      <div class="flex-1">
                        <p class="text-sm font-medium text-amber-800">
                          Waiting for: <strong>{{ request.approver_name }}</strong> ({{ request.approver_role }})
                        </p>
                        <p class="text-xs text-amber-700 mt-1">
                          Vacation: {{ request.approver_vacation_reason }} • Returns: {{ formatDate(request.approver_vacation_until) }}
                        </p>
                        <p class="text-xs text-amber-600 mt-2 italic">
                          Requester has been notified about the delay
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex flex-col gap-2 ml-4">
                  <button @click="viewRequest(request)" class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700">
                    View Request
                  </button>
                  <button @click="notifyRequester(request)" class="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200">
                    Notify Again
                  </button>
                </div>
              </div>
            </div>
            <div v-if="affectedRequests.length === 0" class="text-center py-12 bg-white rounded-lg border border-gray-200">
              <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-gray-500">No requests are currently affected by approver vacations</p>
            </div>
          </div>
        </div>

        <!-- HRMS Sync Log Tab -->
        <div v-if="activeTab === 'sync'" class="p-6">
          <div class="mb-4">
            <h2 class="text-lg font-semibold text-gray-900">HRMS Sync History</h2>
            <p class="text-sm text-gray-500 mt-1">Log of all HRMS synchronization events</p>
          </div>

          <div class="space-y-3">
            <div v-for="log in syncLogs" :key="log.id" 
                 class="bg-white border border-gray-200 rounded-lg p-4">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span :class="log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                          class="px-2 py-1 text-xs font-medium rounded">
                      {{ log.status === 'success' ? 'Success' : 'Failed' }}
                    </span>
                    <span class="text-sm font-medium text-gray-900">{{ log.sync_type }}</span>
                    <span class="text-xs text-gray-500">{{ formatDateTime(log.synced_at) }}</span>
                  </div>
                  <p class="text-sm text-gray-600">{{ log.message }}</p>
                  <div v-if="log.updated_count" class="mt-2 text-xs text-gray-500">
                    Updated {{ log.updated_count }} employee(s)
                  </div>
                </div>
              </div>
            </div>
            <div v-if="syncLogs.length === 0" class="text-center py-8 text-gray-500">
              No sync history available
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import api from '@/services/api'

const toast = useToast()

const router = useRouter()

const activeTab = ref('approvers')
const syncing = ref(false)
const lastSyncTime = ref<string | null>(null)
const approverSearch = ref('')

const vacationApprovers = ref<any[]>([])
const affectedRequests = ref<any[]>([])
const syncLogs = ref<any[]>([])

const filteredVacationApprovers = computed(() => {
  if (!approverSearch.value) return vacationApprovers.value
  
  const search = approverSearch.value.toLowerCase()
  return vacationApprovers.value.filter(a => 
    a.name?.toLowerCase().includes(search) ||
    a.email?.toLowerCase().includes(search) ||
    a.role?.toLowerCase().includes(search) ||
    a.department?.toLowerCase().includes(search)
  )
})

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(dateString: string) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function syncHRMS() {
  syncing.value = true
  try {
    // Mock API call - in production, this would sync with HRMS
    await new Promise(resolve => setTimeout(resolve, 2000))
    lastSyncTime.value = new Date().toLocaleString()
    await fetchVacationApprovers()
    await fetchAffectedRequests()
    await fetchSyncLogs()
  } catch (error: any) {
    console.error('Error syncing with HRMS:', error)
    toast.error('Failed to sync with HRMS. Please try again.')
  } finally {
    syncing.value = false
  }
}

async function fetchVacationApprovers() {
  try {
    // Mock data - in production, this would come from API
    vacationApprovers.value = [
      {
        id: 1,
        name: 'John Director',
        email: 'john.director@company.com',
        role: 'Director',
        department: 'Audit',
        unavailable_reason: 'vacation',
        unavailable_from: '2026-01-10',
        unavailable_until: '2026-01-20',
        hrms_synced: true,
        affected_requests_count: 3
      },
      {
        id: 2,
        name: 'Sarah Compliance',
        email: 'sarah.compliance@company.com',
        role: 'Compliance',
        department: 'Compliance',
        unavailable_reason: 'sick_leave',
        unavailable_from: '2026-01-15',
        unavailable_until: '2026-01-18',
        hrms_synced: true,
        affected_requests_count: 1
      }
    ]
  } catch (error: any) {
    console.error('Error fetching vacation approvers:', error)
  }
}

async function fetchAffectedRequests() {
  try {
    // Mock data - in production, this would come from API
    affectedRequests.value = [
      {
        id: 1,
        request_id: 'COI-2026-001234',
        client_name: 'ABC Corporation',
        service_type: 'Audit Services',
        requester_name: 'Jane Requester',
        status: 'Pending Director Approval',
        approver_name: 'John Director',
        approver_role: 'Director',
        approver_vacation_reason: 'Vacation',
        approver_vacation_until: '2026-01-20'
      },
      {
        id: 2,
        request_id: 'COI-2026-001235',
        client_name: 'XYZ Ltd',
        service_type: 'Tax Services',
        requester_name: 'Bob Requester',
        status: 'Pending Compliance',
        approver_name: 'Sarah Compliance',
        approver_role: 'Compliance',
        approver_vacation_reason: 'Sick Leave',
        approver_vacation_until: '2026-01-18'
      }
    ]
  } catch (error: any) {
    console.error('Error fetching affected requests:', error)
  }
}

async function fetchSyncLogs() {
  try {
    // Mock data - in production, this would come from API
    syncLogs.value = [
      {
        id: 1,
        sync_type: 'Full Sync',
        status: 'success',
        message: 'Successfully synced 45 employees from HRMS',
        updated_count: 2,
        synced_at: new Date().toISOString()
      },
      {
        id: 2,
        sync_type: 'Incremental Sync',
        status: 'success',
        message: 'Updated vacation status for 2 employees',
        updated_count: 2,
        synced_at: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  } catch (error: any) {
    console.error('Error fetching sync logs:', error)
  }
}

function viewAffectedRequests(approver: any) {
  activeTab.value = 'affected'
  // Filter affected requests by approver
}

function viewRequest(request: any) {
  router.push(`/coi/request/${request.id}`)
}

function notifyRequester(request: any) {
  // In production, this would send a notification
  toast.success(`Notification sent to ${request.requester_name} about approval delay`)
}

function markAvailable(approver: any) {
  // In production, this would update the approver status
  if (confirm(`Mark ${approver.name} as available?`)) {
    // Update logic here
    fetchVacationApprovers()
  }
}

onMounted(() => {
  fetchVacationApprovers()
  fetchAffectedRequests()
  fetchSyncLogs()
})
</script>
