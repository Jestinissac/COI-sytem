<template>
  <div v-if="show" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
    <div class="relative p-8 bg-white w-full max-w-2xl mx-4 rounded-lg shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold text-gray-900">Approve with Restrictions</h3>
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
            <span class="text-gray-500">Client:</span>
            <span class="ml-2 font-medium text-gray-900">{{ request.client_name }}</span>
          </div>
          <div class="col-span-2">
            <span class="text-gray-500">Service Type:</span>
            <span class="ml-2 font-medium text-gray-900">{{ request.service_type }}</span>
          </div>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="approve">
        <!-- Restrictions Textarea -->
        <div class="mb-6">
          <label for="restrictions" class="block text-sm font-medium text-gray-700 mb-2">
            Restrictions and Conditions <span class="text-red-500">*</span>
          </label>
          <p class="text-sm text-gray-500 mb-3">
            Enter any restrictions, conditions, or safeguards that must be applied to this engagement.
          </p>
          <textarea
            id="restrictions"
            v-model="restrictions"
            rows="6"
            required
            placeholder="Example: This engagement is approved subject to the following conditions:&#10;1. Annual fee cap of $50,000&#10;2. Prior approval required for any additional services&#10;3. Quarterly reporting to Compliance team"
            class="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
          />
          <p class="text-xs text-gray-500 mt-2">
            {{ restrictions.length }} characters
          </p>
        </div>

        <!-- Additional Comments (Optional) -->
        <div class="mb-6">
          <label for="comments" class="block text-sm font-medium text-gray-700 mb-2">
            Additional Comments (Optional)
          </label>
          <textarea
            id="comments"
            v-model="comments"
            rows="3"
            placeholder="Any additional notes or context for this approval..."
            class="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
          />
        </div>

        <!-- Warning Banner -->
        <div class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <div class="text-sm text-yellow-800">
              <p class="font-medium mb-1">Important Notice</p>
              <p>These restrictions will be recorded and must be communicated to all relevant parties. The engagement team will be notified of these conditions.</p>
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
            :disabled="!restrictions.trim() || isSubmitting"
            class="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
            :class="restrictions.trim() && !isSubmitting
              ? 'bg-yellow-600 hover:bg-yellow-700'
              : 'bg-gray-300 cursor-not-allowed'"
          >
            <span v-if="isSubmitting" class="flex items-center gap-2">
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
            <span v-else>Approve with Restrictions</span>
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
  (e: 'approve'): void
  (e: 'cancel'): void
}>()

const restrictions = ref('')
const comments = ref('')
const isSubmitting = ref(false)

// Reset form when modal opens/closes
watch(() => props.show, (newVal) => {
  if (!newVal) {
    restrictions.value = ''
    comments.value = ''
    isSubmitting.value = false
  }
})

async function approve() {
  if (!props.request || !restrictions.value.trim() || isSubmitting.value) return
  
  isSubmitting.value = true
  
  try {
    await api.post(`/coi/requests/${props.request.id}/approve`, {
      approval_type: 'Approved with Restrictions',
      restrictions: restrictions.value.trim(),
      comments: comments.value.trim() || undefined
    })
    
    emit('approve')
    restrictions.value = ''
    comments.value = ''
  } catch (error: any) {
    console.error('Error approving with restrictions:', error)
    alert(error.response?.data?.error || 'Failed to approve request with restrictions')
  } finally {
    isSubmitting.value = false
  }
}

function cancel() {
  emit('cancel')
}
</script>
