<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600">
        <h2 class="text-xl font-semibold text-white">Review Client Creation Request</h2>
        <p class="text-sm text-purple-100 mt-1">Complete and approve client information for PRMS</p>
      </div>

      <!-- Body -->
      <div class="px-6 py-4">
        <!-- Request Context -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 class="text-sm font-semibold text-blue-900 mb-2">Request Context</h3>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-blue-700 font-medium">COI Request:</span>
              <span class="text-blue-900 ml-2">{{ request?.coi_request_id_code }}</span>
            </div>
            <div>
              <span class="text-blue-700 font-medium">Submitted By:</span>
              <span class="text-blue-900 ml-2">{{ request?.requester_name }}</span>
            </div>
            <div>
              <span class="text-blue-700 font-medium">Prospect Name:</span>
              <span class="text-blue-900 ml-2">{{ request?.client_name }}</span>
            </div>
            <div>
              <span class="text-blue-700 font-medium">Submitted:</span>
              <span class="text-blue-900 ml-2">{{ formatDate(request?.submitted_date) }}</span>
            </div>
          </div>
        </div>

        <!-- Editable Form (pre-filled with requester data) -->
        <AddClientToPRMSForm 
          :prospect="{ prospect_name: request?.client_name }"
          :coi-request="{}"
          v-model="completedFormData"
          :admin-mode="true"
        />

        <!-- Admin Notes -->
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Admin Notes (Optional)</label>
          <textarea 
            v-model="adminNotes"
            rows="2"
            placeholder="Any notes about this client creation..."
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          ></textarea>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
        <button 
          @click="$emit('close')"
          class="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <div class="flex gap-2">
          <button 
            @click="handleReject"
            :disabled="processing"
            class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reject
          </button>
          <button 
            @click="handleComplete"
            :disabled="!isFormValid || processing"
            class="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="processing" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ processing ? 'Creating Client...' : 'Create Client in PRMS' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import api from '@/services/api'
import AddClientToPRMSForm from '@/components/engagement/AddClientToPRMSForm.vue'

const props = defineProps<{
  show: boolean
  request: any
}>()

const emit = defineEmits(['close', 'completed'])

const completedFormData = ref<any>({})
const adminNotes = ref('')
const processing = ref(false)

const isFormValid = computed(() => {
  return completedFormData.value.client_name && completedFormData.value.industry
})

// Pre-fill form with request data when modal opens
watch(() => props.request, (newRequest) => {
  if (newRequest) {
    completedFormData.value = {
      client_name: newRequest.client_name || '',
      legal_form: newRequest.legal_form || '',
      industry: newRequest.industry || '',
      regulatory_body: newRequest.regulatory_body || '',
      parent_company: newRequest.parent_company || '',
      contacts: newRequest.contact_details ? 
        (typeof newRequest.contact_details === 'string' ? 
          JSON.parse(newRequest.contact_details) : 
          newRequest.contact_details) : 
        [{ name: '', designation: '', email: '', phone: '', fax: '' }],
      physical_address: newRequest.physical_address || '',
      billing_address: newRequest.billing_address || '',
      description: newRequest.description || ''
    }
  }
}, { immediate: true })

async function handleComplete() {
  processing.value = true
  try {
    const response = await api.post(`/prospect-client-creation/${props.request.id}/complete`, {
      client_data: completedFormData.value,
      completion_notes: adminNotes.value
    })
    
    alert(`Client "${response.data.client.client_name}" successfully created in PRMS!\n\nClient ID: ${response.data.client.client_code}`)
    
    emit('completed', response.data)
    emit('close')
    
    // Reset form
    adminNotes.value = ''
  } catch (error: any) {
    console.error('Error completing client creation:', error)
    alert(error.response?.data?.error || 'Failed to create client')
  } finally {
    processing.value = false
  }
}

async function handleReject() {
  const reason = prompt('Enter rejection reason:')
  if (!reason) return
  
  processing.value = true
  try {
    await api.put(`/prospect-client-creation/${props.request.id}`, {
      status: 'Rejected',
      completion_notes: reason
    })
    
    alert('Client creation request rejected')
    
    emit('completed')
    emit('close')
  } catch (error: any) {
    console.error('Error rejecting request:', error)
    alert(error.response?.data?.error || 'Failed to reject request')
  } finally {
    processing.value = false
  }
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
