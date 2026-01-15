<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900">Convert Proposal to Engagement</h2>
        <button @click="$emit('cancel')" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="px-6 py-4 space-y-6">
        <!-- Current Proposal Info -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Current Proposal
          </h3>
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
              <span class="text-blue-700 font-medium">Client:</span>
              <span class="text-blue-900 ml-2">{{ request?.client_name }}</span>
            </div>
            <div class="col-span-2">
              <span class="text-blue-700 font-medium">Service:</span>
              <span class="text-blue-900 ml-2">{{ request?.service_type }}</span>
            </div>
          </div>
        </div>

        <!-- What Happens Next -->
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            What Happens Next?
          </h3>
          <ul class="space-y-2 text-sm text-purple-800">
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span>A new COI request will be created with <strong>Stage: Engagement</strong> and <strong>Status: Draft</strong></span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span>All data and attachments will be copied from this proposal</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span>The original proposal will remain for reference</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span>You'll need to <strong>review and submit</strong> the new engagement for fresh COI approval</span>
            </li>
          </ul>
        </div>

        <!-- Conversion Reason -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Conversion Reason <span class="text-red-500">*</span>
          </label>
          <textarea
            v-model="conversionReason"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., Client accepted proposal and signed engagement letter on Jan 10, 2026. Work commences Jan 15, 2026."
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">Provide context for this conversion (audit trail requirement)</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
        <button 
          @click="$emit('cancel')"
          class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button 
          @click="convert"
          :disabled="!conversionReason || converting"
          class="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg v-if="converting" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ converting ? 'Converting...' : 'Convert to Engagement' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '@/services/api'

const props = defineProps<{
  show: boolean
  request: any
}>()

const emit = defineEmits(['cancel', 'converted'])

const conversionReason = ref('')
const converting = ref(false)

async function convert() {
  if (!conversionReason.value) return
  
  converting.value = true
  try {
    const response = await api.post(`/engagement/proposal/${props.request.id}/convert`, {
      conversion_reason: conversionReason.value
    })
    
    emit('converted', response.data)
    conversionReason.value = ''
  } catch (error: any) {
    console.error('Error converting proposal:', error)
    alert(error.response?.data?.error || 'Failed to convert proposal to engagement')
  } finally {
    converting.value = false
  }
}
</script>
