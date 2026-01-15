<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">Convert Proposal to Engagement</h2>
        <p class="text-sm text-gray-600 mt-1">This is a prospect (not yet in PRMS)</p>
      </div>

      <!-- Warning Banner -->
      <div class="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <div class="flex-1">
            <h3 class="text-sm font-semibold text-amber-900">Prospect Requires PRMS Client Creation</h3>
            <p class="text-sm text-amber-800 mt-1">
              Before the engagement can proceed, this prospect must be added to PRMS as a client.
              You'll need to submit a client creation request to the PRMS Admin.
            </p>
          </div>
        </div>
      </div>

      <!-- Body with tabs -->
      <div class="px-6 py-4">
        <!-- Tab Navigation -->
        <div class="flex border-b border-gray-200 mb-4">
          <button
            @click="currentTab = 'conversion'"
            :class="currentTab === 'conversion' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600'"
            class="px-4 py-2 border-b-2 font-medium text-sm transition-colors"
          >
            1. Conversion Details
          </button>
          <button
            @click="currentTab = 'client'"
            :class="currentTab === 'client' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600'"
            class="px-4 py-2 border-b-2 font-medium text-sm transition-colors"
          >
            2. Add Client to PRMS
          </button>
        </div>

        <!-- Tab 1: Conversion Details -->
        <div v-if="currentTab === 'conversion'" class="space-y-4">
          <!-- Current proposal info -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-blue-900 mb-2">Current Proposal</h3>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-blue-700 font-medium">Request ID:</span>
                <span class="text-blue-900 ml-2">{{ request?.request_id }}</span>
              </div>
              <div>
                <span class="text-blue-700 font-medium">Status:</span>
                <span class="text-blue-900 ml-2">{{ request?.status }}</span>
              </div>
              <div class="col-span-2">
                <span class="text-blue-700 font-medium">Prospect Name:</span>
                <span class="text-blue-900 ml-2">{{ request?.client_name }}</span>
              </div>
              <div class="col-span-2">
                <span class="text-blue-700 font-medium">Service:</span>
                <span class="text-blue-900 ml-2">{{ request?.service_type }}</span>
              </div>
            </div>
          </div>

          <!-- Conversion Reason -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Conversion Reason <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="conversionReason"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Prospect accepted proposal and signed engagement letter..."
            ></textarea>
          </div>

          <!-- What happens next -->
          <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-purple-900 mb-3">What Happens Next?</h3>
            <ul class="space-y-2 text-sm text-purple-800">
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>An engagement COI request will be created (Stage: Engagement, Status: Draft)</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>Your client creation request will be sent to PRMS Admin for review</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>Once approved, the prospect will become a client in PRMS</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>You'll be notified to submit the engagement request for COI approval</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Tab 2: Client Creation Form -->
        <div v-if="currentTab === 'client'" class="space-y-4">
          <AddClientToPRMSForm 
            :prospect="prospect"
            :coi-request="request"
            v-model="clientFormData"
          />
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex justify-between">
        <button @click="$emit('cancel')" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          Cancel
        </button>
        <div class="flex gap-2">
          <button
            v-if="currentTab === 'client'"
            @click="currentTab = 'conversion'"
            class="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            v-if="currentTab === 'conversion'"
            @click="currentTab = 'client'"
            :disabled="!conversionReason"
            class="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next: Add Client Info
          </button>
          <button
            v-if="currentTab === 'client'"
            @click="submitAll"
            :disabled="!isClientFormValid || converting"
            class="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="converting" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ converting ? 'Processing...' : 'Convert & Submit to PRMS Admin' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import api from '@/services/api'
import AddClientToPRMSForm from './AddClientToPRMSForm.vue'

const props = defineProps<{
  show: boolean
  request: any
  prospect: any
}>()

const emit = defineEmits(['cancel', 'converted'])

const currentTab = ref<'conversion' | 'client'>('conversion')
const conversionReason = ref('')
const clientFormData = ref<any>({})
const converting = ref(false)

const isClientFormValid = computed(() => {
  return clientFormData.value.client_name && clientFormData.value.industry
})

async function submitAll() {
  if (!conversionReason.value || !isClientFormValid.value) return
  
  converting.value = true
  try {
    // Step 1: Convert proposal to engagement
    const conversionResponse = await api.post(`/engagement/proposal/${props.request.id}/convert`, {
      conversion_reason: conversionReason.value
    })
    
    const newEngagementId = conversionResponse.data.new_request.id
    
    // Step 2: Submit client creation request
    await api.post('/prospect-client-creation/submit', {
      prospect_id: props.prospect.id,
      coi_request_id: newEngagementId,
      client_name: clientFormData.value.client_name,
      legal_form: clientFormData.value.legal_form,
      industry: clientFormData.value.industry,
      regulatory_body: clientFormData.value.regulatory_body,
      parent_company: clientFormData.value.parent_company,
      contact_details: JSON.stringify(clientFormData.value.contacts || []),
      physical_address: clientFormData.value.physical_address,
      billing_address: clientFormData.value.billing_address,
      description: clientFormData.value.description
    })
    
    emit('converted', conversionResponse.data)
    
    // Reset form
    currentTab.value = 'conversion'
    conversionReason.value = ''
    clientFormData.value = {}
  } catch (error: any) {
    console.error('Error during prospect conversion:', error)
    alert(error.response?.data?.error || 'Failed to complete conversion and client creation')
  } finally {
    converting.value = false
  }
}
</script>
