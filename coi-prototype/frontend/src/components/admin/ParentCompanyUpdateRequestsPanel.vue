<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200">
      <h2 class="font-semibold text-gray-900">Parent Company Update Requests</h2>
      <p class="text-sm text-gray-500 mt-1">Parent company updates from COI require PRMS Admin approval before they are sent to the Client Master.</p>
    </div>

    <div v-if="loading" class="p-6 text-center text-gray-500">
      <div class="flex items-center justify-center">
        <svg class="animate-spin h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading requests...
      </div>
    </div>

    <div v-else-if="filteredRequests.length === 0" class="p-6 text-center text-gray-500">
      <svg class="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
      </svg>
      <p>No {{ statusFilter ? statusFilter.toLowerCase() : 'pending' }} parent company update requests</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested Parent</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COI Request</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th v-if="statusFilter === 'Pending' || !statusFilter" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="row in filteredRequests" :key="row.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <span class="font-medium text-gray-900">{{ row.client_name }}</span>
              <span class="text-gray-500 ml-1">({{ row.client_code }})</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
              {{ row.requested_parent_company || (row.requested_parent_company_id ? 'Linked client' : '—') }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ row.requested_by_name }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ row.coi_request_id_code || '—' }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ formatDate(row.requested_at) }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="getStatusClass(row.status)" class="px-2 py-1 text-xs font-semibold rounded-full">
                {{ row.status }}
              </span>
            </td>
            <td v-if="statusFilter === 'Pending' || !statusFilter" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <template v-if="row.status === 'Pending'">
                <button
                  @click="approve(row)"
                  class="text-green-600 hover:text-green-900 font-medium mr-3"
                >
                  Approve
                </button>
                <button
                  @click="reject(row)"
                  class="text-red-600 hover:text-red-900 font-medium"
                >
                  Reject
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Status filter -->
    <div class="px-6 py-3 border-t border-gray-200 bg-gray-50 flex gap-2">
      <button
        @click="statusFilter = ''"
        :class="!statusFilter ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-100'"
        class="px-3 py-1.5 text-sm font-medium rounded border border-gray-200"
      >
        All
      </button>
      <button
        @click="statusFilter = 'Pending'"
        :class="statusFilter === 'Pending' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-100'"
        class="px-3 py-1.5 text-sm font-medium rounded border border-gray-200"
      >
        Pending
      </button>
      <button
        @click="statusFilter = 'Approved'"
        :class="statusFilter === 'Approved' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-100'"
        class="px-3 py-1.5 text-sm font-medium rounded border border-gray-200"
      >
        Approved
      </button>
      <button
        @click="statusFilter = 'Rejected'"
        :class="statusFilter === 'Rejected' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-100'"
        class="px-3 py-1.5 text-sm font-medium rounded border border-gray-200"
      >
        Rejected
      </button>
    </div>

    <!-- Reject modal -->
    <div v-if="showRejectModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showRejectModal = false">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-md w-full mx-4">
        <h3 class="text-base font-semibold text-gray-900 mb-2">Reject parent company update</h3>
        <p class="text-sm text-gray-600 mb-4">Optional note for the requester:</p>
        <textarea
          v-model="rejectNotes"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="Reason for rejection (optional)"
        />
        <div class="flex justify-end gap-2 mt-4">
          <button @click="showRejectModal = false" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button @click="confirmReject" class="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700">Reject</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const requests = ref<any[]>([])
const loading = ref(true)
const statusFilter = ref('')
const showRejectModal = ref(false)
const rejectNotes = ref('')
const selectedRow = ref<any>(null)

const emit = defineEmits(['refresh'])

const filteredRequests = computed(() => {
  if (!statusFilter.value) return requests.value
  return requests.value.filter((r: any) => r.status === statusFilter.value)
})

onMounted(async () => {
  await loadRequests()
})

async function loadRequests() {
  loading.value = true
  try {
    const response = await api.get('/parent-company-update-requests')
    requests.value = response.data || []
  } catch (error) {
    console.error('Error loading parent company update requests:', error)
  } finally {
    loading.value = false
  }
}

async function approve(row: any) {
  try {
    await api.post(`/parent-company-update-requests/${row.id}/approve`, {})
    await loadRequests()
    emit('refresh')
  } catch (error) {
    console.error('Error approving:', error)
  }
}

function reject(row: any) {
  selectedRow.value = row
  rejectNotes.value = ''
  showRejectModal.value = true
}

async function confirmReject() {
  if (!selectedRow.value) return
  try {
    await api.post(`/parent-company-update-requests/${selectedRow.value.id}/reject`, { review_notes: rejectNotes.value })
    showRejectModal.value = false
    selectedRow.value = null
    await loadRequests()
    emit('refresh')
  } catch (error) {
    console.error('Error rejecting:', error)
  }
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

function formatDate(dateString: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
