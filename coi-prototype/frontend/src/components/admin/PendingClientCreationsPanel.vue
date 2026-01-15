<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200">
      <h2 class="font-semibold text-gray-900">Pending Client Creation Requests</h2>
      <p class="text-sm text-gray-500 mt-1">Review and complete client creation for prospects</p>
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

    <div v-else-if="requests.length === 0" class="p-6 text-center text-gray-500">
      <svg class="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <p>No pending client creation requests</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted By</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted Date</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="request in requests" :key="request.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ request.coi_request_id_code }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ request.client_name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              {{ request.requester_name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              {{ formatDate(request.submitted_date) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="getStatusClass(request.status)" class="px-2 py-1 text-xs font-semibold rounded-full">
                {{ request.status }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button 
                @click="reviewRequest(request)"
                class="text-purple-600 hover:text-purple-900 font-medium transition-colors"
              >
                Review & Complete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Review Modal -->
    <ClientCreationReviewModal
      :show="showReviewModal"
      :request="selectedRequest"
      @close="closeReviewModal"
      @completed="handleCompleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import ClientCreationReviewModal from './ClientCreationReviewModal.vue'

const requests = ref<any[]>([])
const loading = ref(true)
const showReviewModal = ref(false)
const selectedRequest = ref<any>(null)

const emit = defineEmits(['refresh'])

onMounted(async () => {
  await loadRequests()
})

async function loadRequests() {
  loading.value = true
  try {
    const response = await api.get('/prospect-client-creation/pending')
    requests.value = response.data
  } catch (error) {
    console.error('Error loading pending requests:', error)
  } finally {
    loading.value = false
  }
}

function reviewRequest(request: any) {
  selectedRequest.value = request
  showReviewModal.value = true
}

function closeReviewModal() {
  showReviewModal.value = false
  selectedRequest.value = null
}

async function handleCompleted() {
  await loadRequests()
  emit('refresh')
  closeReviewModal()
}

function getStatusClass(status: string) {
  const classes = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'In Review': 'bg-blue-100 text-blue-800',
    'Completed': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800'
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
