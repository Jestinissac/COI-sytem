<template>
  <div v-if="show" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
    <div class="relative p-8 bg-white w-full max-w-2xl mx-4 rounded-lg shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold text-gray-900">Request More Information</h3>
        <button
          @click="cancel"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Request Info -->
      <div v-if="request" class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">Request ID:</span>
            <span class="ml-2 font-medium text-gray-900">{{ request.request_id }}</span>
          </div>
          <div>
            <span class="text-gray-500">Requester:</span>
            <span class="ml-2 font-medium text-gray-900">{{ request.requester_name || request.requestor_name }}</span>
          </div>
          <div class="col-span-2">
            <span class="text-gray-500">Client:</span>
            <span class="ml-2 font-medium text-gray-900">{{ request.client_name }}</span>
          </div>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="requestInfo">
        <!-- Information Required -->
        <div class="mb-6">
          <label for="infoRequired" class="block text-sm font-medium text-gray-700 mb-2">
            What information do you need? <span class="text-red-500">*</span>
          </label>
          <p class="text-sm text-gray-500 mb-3">
            Be specific about what information or clarification you need from the requester.
          </p>
          <textarea
            id="infoRequired"
            v-model="infoRequired"
            rows="6"
            required
            placeholder="Example:&#10;1. Please provide detailed ownership structure including all beneficial owners&#10;2. Clarify the scope of services - does this include tax advisory or only compliance?&#10;3. Provide copies of previous engagement letters with this client"
            class="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <p class="text-xs text-gray-500 mt-2">
            {{ infoRequired.length }} characters
          </p>
        </div>

        <!-- Additional Context (Optional) -->
        <div class="mb-6">
          <label for="context" class="block text-sm font-medium text-gray-700 mb-2">
            Additional Context (Optional)
          </label>
          <textarea
            id="context"
            v-model="context"
            rows="3"
            placeholder="Provide any additional context or explain why this information is needed..."
            class="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <!-- Info Banner -->
        <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div class="text-sm text-blue-800">
              <p class="font-medium mb-1">What happens next?</p>
              <p>The request will return to Draft status, and the requester will be notified via email about the additional information needed. They can then update and resubmit the request.</p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="cancel"
            class="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="!infoRequired.trim() || isSubmitting"
            class="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
            :class="infoRequired.trim() && !isSubmitting
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-300 cursor-not-allowed'"
          >
            <span v-if="isSubmitting" class="flex items-center gap-2">
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </span>
            <span v-else>Request Information</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { COIRequest } from '@/stores/coiRequests'
import api from '@/services/api'

const props = defineProps<{
  show: boolean
  request: COIRequest | null
}>()

const emit = defineEmits<{
  (e: 'requested'): void
  (e: 'cancel'): void
}>()

const infoRequired = ref('')
const context = ref('')
const isSubmitting = ref(false)

// Reset form when modal opens/closes
watch(() => props.show, (newVal) => {
  if (!newVal) {
    infoRequired.value = ''
    context.value = ''
    isSubmitting.value = false
  }
})

async function requestInfo() {
  if (!props.request || !infoRequired.value.trim() || isSubmitting.value) return
  
  isSubmitting.value = true
  
  try {
    const fullComments = context.value.trim() 
      ? `${infoRequired.value.trim()}\n\nAdditional Context:\n${context.value.trim()}`
      : infoRequired.value.trim()

    await api.post(`/coi/requests/${props.request.id}/request-more-info`, {
      info_required: infoRequired.value.trim(),
      comments: fullComments
    })
    
    emit('requested')
    infoRequired.value = ''
    context.value = ''
  } catch (error: any) {
    console.error('Error requesting more information:', error)
    alert(error.response?.data?.error || 'Failed to request information')
  } finally {
    isSubmitting.value = false
  }
}

function cancel() {
  emit('cancel')
}
</script>
