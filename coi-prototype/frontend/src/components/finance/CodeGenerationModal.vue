<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeModal">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" @click="closeModal"></div>

      <!-- Modal panel -->
      <div class="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
        <div class="bg-white px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Generate Engagement Code</h3>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-500">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="bg-white px-6 py-4">
          <!-- Request Info -->
          <div class="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 class="text-sm font-medium text-gray-700 mb-2">Request Information</h4>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-500">Request ID:</span>
                <span class="ml-2 font-medium text-gray-900">{{ request?.request_id }}</span>
              </div>
              <div>
                <span class="text-gray-500">Client:</span>
                <span class="ml-2 font-medium text-gray-900">{{ request?.client_name || 'Not specified' }}</span>
              </div>
              <div>
                <span class="text-gray-500">Service Type:</span>
                <span class="ml-2 font-medium text-gray-900">{{ request?.service_type || 'General' }}</span>
              </div>
              <div>
                <span class="text-gray-500">Department:</span>
                <span class="ml-2 font-medium text-gray-900">{{ request?.department || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <!-- Proactive "already has code" view when modal opens with request that has a code -->
          <div v-if="showAlreadyHasCodeView" class="space-y-4">
            <div class="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p class="text-sm font-medium text-amber-900 mb-2">This request already has an engagement code.</p>
              <p class="text-sm font-mono font-bold text-amber-900">{{ request?.engagement_code }}</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                @click="goToRequestDetail"
                class="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                View request
              </button>
              <button
                type="button"
                @click="closeModal"
                class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-200"
              >
                Close and refresh list
              </button>
            </div>
          </div>

          <!-- Generate form (only when request does not already have a code) -->
          <template v-else>
          <!-- Code Preview / Generated Code -->
          <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 class="text-sm font-medium text-blue-900 mb-2">
              {{ generatedCode ? 'Generated Engagement Code' : 'Engagement Code Preview' }}
            </h4>
            <div class="flex items-center gap-3">
              <code class="text-lg font-mono font-bold text-blue-900">{{ generatedCode || codePreview }}</code>
              <span v-if="generatedCode" class="text-xs text-green-600 bg-green-100 px-2 py-1 rounded flex items-center gap-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                Generated
              </span>
              <span v-else-if="codePreview" class="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                Preview
              </span>
              <button
                v-if="generatedCode"
                @click="copyToClipboard"
                class="ml-auto text-xs text-primary-600 hover:text-primary-700 bg-white border border-blue-200 px-2 py-1 rounded hover:bg-blue-50 flex items-center gap-1 transition-colors"
                :class="copySuccess ? 'bg-green-50 border-green-300 text-green-700' : ''"
                title="Copy to clipboard"
              >
                <svg v-if="!copySuccess" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                {{ copySuccess ? 'Copied!' : 'Copy' }}
              </button>
            </div>
            <p class="text-xs text-blue-600 mt-2">
              Format: ENG-{YEAR}-{SERVICE_TYPE}-{SEQUENTIAL_NUMBER}
            </p>
          </div>

          <!-- Financial Parameters Form -->
          <form @submit.prevent="generateCode" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <!-- Credit Terms -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Credit Terms <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="financialParams.credit_terms"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select credit terms...</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 60">Net 60</option>
                  <option value="Net 90">Net 90</option>
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <!-- Currency -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Currency <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="financialParams.currency"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select currency...</option>
                  <option value="KWD">KWD - Kuwaiti Dinar</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                  <option value="AED">AED - UAE Dirham</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <!-- Risk Assessment -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Risk Assessment <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="financialParams.risk_assessment"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select risk level...</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Very High">Very High</option>
                </select>
              </div>

              <!-- Pending Amount -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Pending Amount (Optional)
                </label>
                <input
                  v-model.number="financialParams.pending_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <!-- Notes -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                v-model="financialParams.notes"
                rows="3"
                placeholder="Additional financial notes or comments..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              ></textarea>
            </div>

            <!-- Success Message -->
            <div v-if="generatedCode && !error" class="p-3 bg-green-50 border border-green-200 rounded-md">
              <p class="text-sm text-green-800 flex items-center gap-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                Engagement code generated successfully! Financial parameters have been saved.
              </p>
            </div>

            <!-- Error Message with next steps -->
            <div v-if="error" class="p-4 bg-red-50 border-2 border-red-300 rounded-md space-y-3">
              <p class="text-sm font-medium text-red-800 flex items-center gap-2">
                <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                <span>{{ error }}</span>
              </p>
              <!-- Next step: already generated → View request -->
              <div v-if="errorType === 'already_generated'" class="pt-2 border-t border-red-200">
                <p class="text-xs text-red-700 mb-2">Next step:</p>
                <p class="text-sm text-red-800 mb-2">This request already has an engagement code. View the request to see the code and financial details, or close and refresh the list.</p>
                <p v-if="existingCodeFromApi" class="text-sm font-mono font-medium text-red-900 mb-2">Existing code: {{ existingCodeFromApi }}</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    @click="goToRequestDetail"
                    class="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
                  >
                    View request
                  </button>
                  <button
                    type="button"
                    @click="closeModal"
                    class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Close and refresh list
                  </button>
                </div>
              </div>
              <!-- Next step: code collision (409) → Try again -->
              <div v-else-if="errorType === 'code_collision'" class="pt-2 border-t border-red-200">
                <p class="text-xs text-red-700 mb-2">Next step:</p>
                <p v-if="collidedCodeFromApi" class="text-sm font-mono font-medium text-red-900 mb-2">Code already in use: {{ collidedCodeFromApi }}</p>
                <p class="text-sm text-red-800 mb-2">
                  <template v-if="collidedCodeFromApi">The code above is already in use by another request.</template>
                  <template v-else>The code we generated was already in use by another request.</template>
                  Click Try again to generate a new code.
                </p>
                <button
                  type="button"
                  @click="clearErrorAndRetry"
                  class="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
                >
                  Try again
                </button>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                v-if="!generatedCode"
                type="button"
                @click="generateCode"
                :disabled="generating || !isFormValid"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="generating" class="flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
                <span v-else>Generate Code</span>
              </button>
              <button
                v-else
                type="button"
                @click="closeModal"
                class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Done
              </button>
            </div>
          </form>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import api from '@/services/api'

const toast = useToast()

interface Props {
  show: boolean
  request: any
}

interface Emits {
  (e: 'close'): void
  (e: 'success', code: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const router = useRouter()

const financialParams = ref({
  credit_terms: '',
  currency: '',
  risk_assessment: '',
  pending_amount: null as number | null,
  notes: ''
})

const generating = ref(false)
const error = ref('')
const errorType = ref<'already_generated' | 'code_collision' | null>(null)
const existingCodeFromApi = ref('')
const collidedCodeFromApi = ref('')
const codePreview = ref('')
const generatedCode = ref('')
const copySuccess = ref(false)

// Computed property for request ID with fallback
const requestId = computed(() => {
  return props.request?.id || props.request?.request_id || null
})

// Proactive "already has code" view when modal opens with a request that already has an engagement code
const showAlreadyHasCodeView = computed(() => {
  return Boolean(props.show && props.request?.engagement_code)
})

// Calculate code preview based on service type
const calculateCodePreview = () => {
  if (!props.request?.service_type) {
    codePreview.value = ''
    return
  }

  const year = new Date().getFullYear()
  const serviceTypeMap: Record<string, string> = {
    'Tax': 'TAX',
    'Audit & Assurance': 'AUD',
    'Advisory': 'ADV',
    'Accounting': 'ACC',
    'Other': 'OTH'
  }
  const abbreviation = serviceTypeMap[props.request.service_type] || 'OTH'
  
  // Show format (sequential number will be calculated by backend)
  codePreview.value = `ENG-${year}-${abbreviation}-#####`
}

// Watch for request changes
watch(() => props.request, () => {
  if (props.request) {
    calculateCodePreview()
  }
}, { immediate: true })

// Watch for show prop
watch(() => props.show, (newVal) => {
  if (newVal && props.request) {
    calculateCodePreview()
    // Reset form and error state
    financialParams.value = {
      credit_terms: '',
      currency: '',
      risk_assessment: '',
      pending_amount: null,
      notes: ''
    }
    error.value = ''
    errorType.value = null
    existingCodeFromApi.value = ''
    collidedCodeFromApi.value = ''
    generatedCode.value = ''
    copySuccess.value = false
  }
})

function goToRequestDetail() {
  const id = props.request?.id ?? props.request?.request_id
  if (id) {
    router.push(`/coi/request/${id}`)
  }
  emit('close')
}

function clearErrorAndRetry() {
  error.value = ''
  errorType.value = null
  collidedCodeFromApi.value = ''
}

const isFormValid = computed(() => {
  return !!(
    financialParams.value.credit_terms?.trim() &&
    financialParams.value.currency?.trim() &&
    financialParams.value.risk_assessment?.trim()
  )
})

const closeModal = () => {
  if (!generating.value) {
    emit('close')
  }
}

const generateCode = async () => {
  console.log('[CodeGenerationModal] generateCode called')
  console.log('[CodeGenerationModal] Form state:', {
    credit_terms: financialParams.value.credit_terms,
    currency: financialParams.value.currency,
    risk_assessment: financialParams.value.risk_assessment,
    isFormValid: isFormValid.value
  })
  
  if (!isFormValid.value) {
    error.value = 'Please fill in all required fields (Credit Terms, Currency, and Risk Assessment)'
    console.warn('[CodeGenerationModal] Form validation failed')
    return
  }

  if (!requestId.value) {
    error.value = 'Invalid request. Please refresh and try again.'
    console.error('[CodeGenerationModal] Request ID missing:', props.request)
    return
  }

  generating.value = true
  error.value = ''
  generatedCode.value = ''

  try {
    const requestPayload = {
      financial_parameters: {
        credit_terms: financialParams.value.credit_terms.trim(),
        currency: financialParams.value.currency.trim(),
        risk_assessment: financialParams.value.risk_assessment.trim(),
        pending_amount: financialParams.value.pending_amount || null,
        notes: (financialParams.value.notes || '').trim()
      }
    }
    
    console.log('[CodeGenerationModal] Generating code for request:', requestId.value)
    console.log('[CodeGenerationModal] Request payload:', JSON.stringify(requestPayload, null, 2))
    
    const response = await api.post(`/coi/requests/${requestId.value}/generate-code`, requestPayload)

    console.log('[CodeGenerationModal] API Response received:', response.data)
    console.log('[CodeGenerationModal] Response status:', response.status)

    const engagementCode = response.data?.engagement_code || response.data?.code
    
    if (engagementCode) {
      console.log('[CodeGenerationModal] Code generated successfully:', engagementCode)
      generatedCode.value = engagementCode
      generating.value = false
      toast.success('Engagement code ' + engagementCode + ' generated successfully.')
      // Wait a moment to show the generated code, then emit success
      setTimeout(() => {
        emit('success', engagementCode)
        // Don't close immediately - let user see the code
      }, 1500)
    } else {
      const errorMsg = response.data?.message || 'Failed to generate engagement code. Please try again.'
      error.value = errorMsg
      generating.value = false
      console.error('[CodeGenerationModal] No engagement code in response:', response.data)
    }
  } catch (err: any) {
    console.error('[CodeGenerationModal] Error generating code:', err)
    const data = err.response?.data || {}
    const status = err.response?.status
    const errorMessage = data.error || data.message || err.message || 'Failed to generate engagement code. Please try again.'
    error.value = errorMessage
    errorType.value = null
    existingCodeFromApi.value = ''
    collidedCodeFromApi.value = ''

    // Prefer stable error_code from backend, then fallback to status + message
    const code = data.error_code
    if (code === 'request_already_has_code') {
      errorType.value = 'already_generated'
      if (data.existing_code) existingCodeFromApi.value = data.existing_code
    } else if (code === 'generated_code_collision') {
      errorType.value = 'code_collision'
      if (data.collided_code) collidedCodeFromApi.value = data.collided_code
    } else {
      // Fallback: 400 = already has code, 409 = collision; check 400 first so "already has code" wins
      if (status === 400 && (errorMessage.toLowerCase().includes('already generated') || errorMessage.toLowerCase().includes('already has'))) {
        errorType.value = 'already_generated'
        if (data.existing_code) existingCodeFromApi.value = data.existing_code
      } else if (status === 409 || (errorMessage.toLowerCase().includes('already exists') && !errorType.value)) {
        errorType.value = 'code_collision'
        if (data.collided_code) collidedCodeFromApi.value = data.collided_code
      }
    }

    generating.value = false
  }
}

const copyToClipboard = async () => {
  if (!generatedCode.value) return
  
  try {
    await navigator.clipboard.writeText(generatedCode.value)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = generatedCode.value
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      copySuccess.value = true
      setTimeout(() => {
        copySuccess.value = false
      }, 2000)
    } catch (fallbackErr) {
      console.error('Fallback copy failed:', fallbackErr)
    }
    document.body.removeChild(textArea)
  }
}
</script>
