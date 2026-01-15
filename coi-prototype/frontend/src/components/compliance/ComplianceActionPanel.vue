<template>
  <div class="bg-white rounded-lg p-4">
    <!-- Status Banner -->
    <div 
      v-if="complianceStatus !== 'fresh' || showFreshBanner"
      :class="bannerClass"
      class="rounded-lg p-4 mb-4"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- Stale State -->
          <template v-if="complianceStatus === 'stale'">
            <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <div>
              <p class="font-semibold text-amber-800">Alert: Rule Change Detected</p>
              <p class="text-sm text-amber-700">One or more compliance rules have changed since submission.</p>
            </div>
          </template>

          <!-- Re-Running State -->
          <template v-else-if="complianceStatus === 're-running'">
            <svg class="w-6 h-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div>
              <p class="font-semibold text-blue-800">Validating Against Latest Rule Set...</p>
              <p class="text-sm text-blue-700">Please wait while we re-evaluate this request.</p>
            </div>
          </template>

          <!-- Fresh State -->
          <template v-else-if="complianceStatus === 'fresh'">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <p class="font-semibold text-green-800">Validation Complete</p>
              <p class="text-sm text-green-700">Request has been validated against the latest rule set.</p>
            </div>
          </template>

          <!-- Error State -->
          <template v-else-if="complianceStatus === 'error'">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <p class="font-semibold text-red-800">Re-evaluation Failed</p>
              <p class="text-sm text-red-700">{{ errorMessage || 'Unable to validate. Please try again.' }}</p>
            </div>
          </template>
        </div>

        <!-- Action Button in Banner -->
        <div v-if="complianceStatus === 'stale'" class="flex-shrink-0">
          <button 
            @click="handleReRun"
            class="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Re-Run Compliance Check
          </button>
        </div>

        <div v-else-if="complianceStatus === 'error'" class="flex-shrink-0">
          <button 
            @click="handleReRun"
            class="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Retry
          </button>
        </div>
      </div>
    </div>

    <!-- Stale Reason Details (Expandable) -->
    <div v-if="request.stale_reason && complianceStatus === 'stale'" class="mb-4">
      <button 
        @click="showRuleChangeDetails = !showRuleChangeDetails"
        class="flex items-center text-sm text-gray-600 hover:text-gray-800"
      >
        <svg 
          class="w-4 h-4 mr-1 transition-transform" 
          :class="{ 'rotate-90': showRuleChangeDetails }"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
        What Changed?
      </button>
      <div v-if="showRuleChangeDetails" class="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p class="text-sm text-gray-700">{{ request.stale_reason }}</p>
      </div>
    </div>

    <!-- Group Structure Verification Section (Research Required) -->
    <div v-if="request.group_structure === 'research_required' || request.requires_compliance_verification" class="mb-4">
      <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <div class="flex-1">
            <h4 class="font-semibold text-amber-800">Group Structure Verification Required</h4>
            <p class="text-sm text-amber-700 mt-1">
              Requester indicated they were unsure of group structure. 
              Please verify parent company relationships before approval.
            </p>
            <p class="text-xs text-amber-600 mt-2 italic">
              Reference: IESBA Code Section 290.13 - "Audit client" includes parent, 
              subsidiaries, and affiliates. Independence requirements apply to entire group.
            </p>
          </div>
        </div>
        
        <!-- Verification Form -->
        <div class="mt-4 pt-4 border-t border-amber-200 space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Verified Group Structure</label>
            <select 
              v-model="verificationData.group_structure" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">Select verification result...</option>
              <option value="standalone">Confirmed Standalone Entity</option>
              <option value="has_parent">Part of Corporate Group</option>
            </select>
          </div>
          
          <div v-if="verificationData.group_structure === 'has_parent'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Parent Company Name</label>
            <input 
              v-model="verificationData.parent_company"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="Enter verified parent company name..."
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Verification Source</label>
            <select 
              v-model="verificationData.verification_source"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">Select source...</option>
              <option value="prms">PRMS Database</option>
              <option value="bdo_global">BDO Global Database</option>
              <option value="public_records">Public Records / Commercial Registry</option>
              <option value="client_confirmation">Client Confirmation</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Verification Notes</label>
            <textarea 
              v-model="verificationData.verification_notes"
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="Document the verification process..."
            ></textarea>
          </div>
          
          <button 
            @click="handleSaveVerification"
            :disabled="!canSaveVerification"
            class="w-full px-4 py-2 text-sm font-medium rounded-md transition-colors"
            :class="canSaveVerification 
              ? 'bg-amber-600 text-white hover:bg-amber-700' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'"
          >
            Save Verification & Re-check Conflicts
          </button>
        </div>
      </div>
    </div>

    <!-- Group Conflicts Display -->
    <div v-if="groupConflicts.length > 0" class="mb-4">
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <div class="flex-1">
            <h4 class="font-semibold text-red-800">Group Independence Conflicts Detected</h4>
            <p class="text-sm text-red-700 mt-1">
              {{ groupConflicts.length }} potential conflict(s) found within the corporate group.
            </p>
          </div>
        </div>
        
        <div class="mt-4 space-y-3">
          <div 
            v-for="(conflict, idx) in groupConflicts" 
            :key="idx"
            class="bg-white border border-red-200 rounded-lg p-3"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-900">{{ conflict.entity_name }}</span>
              <span 
                class="px-2 py-0.5 text-xs font-medium rounded"
                :class="conflict.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'"
              >
                {{ conflict.severity }}
              </span>
            </div>
            <div class="text-xs text-gray-600 space-y-1">
              <p><strong>Relationship:</strong> {{ conflict.relationship_path }}</p>
              <p><strong>Existing Service:</strong> {{ conflict.existing_service }}</p>
              <p v-if="conflict.conflicting_engagement_code">
                <strong>Engagement:</strong> {{ conflict.conflicting_engagement_code }}
              </p>
              <p><strong>Issue:</strong> {{ conflict.reason }}</p>
              <p v-if="conflict.conflicting_engagement_end_date" class="mt-2 pt-2 border-t border-gray-200">
                <strong>Conflict Ends:</strong> {{ formatDate(conflict.conflicting_engagement_end_date) }}
                <span class="block text-gray-500 mt-0.5 italic">
                  Partner/Compliance to decide if request can proceed after this date.
                </span>
              </p>
            </div>
            <div class="mt-3 flex gap-2">
              <button 
                @click="handleClearConflictFlag(conflict)"
                class="px-3 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded hover:bg-amber-200 transition-colors"
              >
                Mark as False Positive
              </button>
              <button 
                v-if="conflict.conflicting_engagement_code"
                @click="handleViewEngagement(conflict)"
                class="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                View Engagement
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Compliance Checks List -->
    <div v-if="complianceChecks.length > 0" class="mb-4">
      <h4 class="text-sm font-medium text-gray-700 mb-2">Compliance Checks</h4>
      <div class="space-y-2">
        <div 
          v-for="(check, index) in complianceChecks" 
          :key="index"
          class="flex items-center justify-between p-3 bg-white border rounded-lg"
        >
          <div class="flex items-center gap-2">
            <!-- Status Icon -->
            <svg 
              v-if="check.status === 'passed'"
              class="w-5 h-5 text-green-500" 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <svg 
              v-else-if="check.status === 'failed'"
              class="w-5 h-5 text-red-500" 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            <svg 
              v-else
              class="w-5 h-5 text-yellow-500" 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <span class="text-sm text-gray-700">{{ check.rule }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span 
              v-if="check.is_outdated"
              class="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded"
            >
              OUTDATED
            </span>
            <span 
              :class="statusBadgeClass(check.status)"
              class="px-2 py-0.5 text-xs font-medium rounded"
            >
              {{ check.status.toUpperCase() }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Last Checked Info -->
    <div v-if="request.last_rule_check_at && complianceStatus === 'fresh'" class="text-sm text-gray-500 mb-4">
      Last validated: {{ formatDate(request.last_rule_check_at) }}
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center gap-3 pt-4 border-t border-gray-200">
      <!-- Approve Button -->
      <button 
        @click="handleApprove"
        :disabled="!canApprove"
        :title="!canApprove ? 'Re-evaluation required before approval' : 'Approve this request'"
        class="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        :class="canApprove 
          ? 'bg-green-600 text-white hover:bg-green-700' 
          : 'bg-gray-200 text-gray-400 cursor-not-allowed'"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        Approve
      </button>

      <!-- Approve with Restrictions Button (Compliance Only) -->
      <button 
        @click="handleApproveWithRestrictions"
        :disabled="!canApprove"
        :title="!canApprove ? 'Re-evaluation required before approval' : 'Approve with conditions'"
        class="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        :class="canApprove 
          ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
          : 'bg-gray-200 text-gray-400 cursor-not-allowed'"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
        Approve with Restrictions
      </button>

      <!-- Need More Info Button (Compliance Only) -->
      <button 
        @click="handleRequestInfo"
        class="flex-1 inline-flex items-center justify-center px-4 py-2 border border-blue-500 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Need More Info
      </button>

      <!-- Reject Button -->
      <button 
        @click="handleReject"
        class="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
        Reject
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import type { COIRequest, ComplianceCheck } from '@/stores/coiRequests'
import api from '@/services/api'

interface GroupConflict {
  type: string
  severity: string
  entity_name: string
  entity_parent?: string
  relationship_path: string
  existing_service: string
  requested_service: string
  regulation: string
  reason: string
  action: string
  conflicting_engagement_id?: number
  conflicting_engagement_code?: string
  conflicting_engagement_end_date?: string
}

const props = defineProps<{
  request: COIRequest
}>()

const emit = defineEmits<{
  (e: 'approve'): void
  (e: 'approve-with-restrictions'): void
  (e: 'reject'): void
  (e: 'request-info'): void
  (e: 'updated', request: COIRequest): void
}>()

// Internal state
const complianceStatus = ref<'stale' | 're-running' | 'fresh' | 'error'>('fresh')
const errorMessage = ref<string | null>(null)
const showRuleChangeDetails = ref(false)
const showFreshBanner = ref(false)

// Verification form state
const verificationData = reactive({
  group_structure: '',
  parent_company: '',
  verification_source: '',
  verification_notes: ''
})

// Computed
const complianceChecks = computed<ComplianceCheck[]>(() => {
  if (!props.request.compliance_checks) return []
  if (typeof props.request.compliance_checks === 'string') {
    try {
      return JSON.parse(props.request.compliance_checks)
    } catch {
      return []
    }
  }
  return props.request.compliance_checks
})

const canApprove = computed(() => {
  return complianceStatus.value === 'fresh' && !props.request.requires_re_evaluation
})

// Parse group conflicts from JSON
const groupConflicts = computed<GroupConflict[]>(() => {
  if (!props.request.group_conflicts_detected) return []
  if (typeof props.request.group_conflicts_detected === 'string') {
    try {
      return JSON.parse(props.request.group_conflicts_detected)
    } catch {
      return []
    }
  }
  return props.request.group_conflicts_detected
})

// Can save verification (required fields filled)
const canSaveVerification = computed(() => {
  if (!verificationData.group_structure) return false
  if (verificationData.group_structure === 'has_parent' && !verificationData.parent_company.trim()) return false
  return true
})

const bannerClass = computed(() => {
  switch (complianceStatus.value) {
    case 'stale':
      return 'bg-amber-50 border border-amber-200'
    case 're-running':
      return 'bg-blue-50 border border-blue-200'
    case 'fresh':
      return 'bg-green-50 border border-green-200'
    case 'error':
      return 'bg-red-50 border border-red-200'
    default:
      return 'bg-gray-50 border border-gray-200'
  }
})

// Watch for request changes
watch(() => props.request.requires_re_evaluation, (newVal) => {
  if (newVal) {
    complianceStatus.value = 'stale'
  } else if (complianceStatus.value === 'stale') {
    complianceStatus.value = 'fresh'
  }
}, { immediate: true })

// Methods
function statusBadgeClass(status: string) {
  switch (status) {
    case 'passed':
      return 'bg-green-100 text-green-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    case 'warning':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleString()
}

async function handleReRun() {
  complianceStatus.value = 're-running'
  errorMessage.value = null
  
  try {
    const response = await api.post(`/coi/requests/${props.request.id}/re-evaluate`)
    
    if (response.data.success) {
      complianceStatus.value = 'fresh'
      showFreshBanner.value = true
      
      // Emit updated event with new data
      emit('updated', {
        ...props.request,
        requires_re_evaluation: false,
        stale_reason: null,
        compliance_checks: response.data.complianceChecks,
        last_rule_check_at: new Date().toISOString()
      })
      
      // Hide fresh banner after 5 seconds
      setTimeout(() => {
        showFreshBanner.value = false
      }, 5000)
    } else {
      throw new Error(response.data.error || 'Re-evaluation failed')
    }
  } catch (error: any) {
    complianceStatus.value = 'error'
    errorMessage.value = error.response?.data?.error || error.message || 'Failed to re-evaluate request'
  }
}

function handleApprove() {
  if (!canApprove.value) return
  emit('approve')
}

function handleApproveWithRestrictions() {
  if (!canApprove.value) return
  emit('approve-with-restrictions')
}

function handleReject() {
  emit('reject')
}

function handleRequestInfo() {
  emit('request-info')
}

// Handle saving group structure verification
async function handleSaveVerification() {
  if (!canSaveVerification.value) return
  
  try {
    const response = await api.post(`/coi/requests/${props.request.id}/verify-group-structure`, {
      group_structure: verificationData.group_structure,
      parent_company: verificationData.parent_company,
      verification_source: verificationData.verification_source,
      verification_notes: verificationData.verification_notes
    })
    
    if (response.data.success) {
      // Update the request with verified data
      emit('updated', {
        ...props.request,
        group_structure: verificationData.group_structure,
        parent_company: verificationData.parent_company || props.request.parent_company,
        requires_compliance_verification: 0,
        group_conflicts_detected: response.data.conflicts ? JSON.stringify(response.data.conflicts) : null,
        parent_company_verified_by: response.data.verified_by,
        parent_company_verified_at: new Date().toISOString()
      })
      
      // Reset form
      verificationData.group_structure = ''
      verificationData.parent_company = ''
      verificationData.verification_source = ''
      verificationData.verification_notes = ''
    }
  } catch (error: any) {
    console.error('Error saving verification:', error)
    errorMessage.value = error.response?.data?.error || 'Failed to save verification'
  }
}

// Handle clearing a false positive conflict flag
async function handleClearConflictFlag(conflict: GroupConflict) {
  const notes = prompt('Please provide a reason for marking this as a false positive:')
  if (!notes) return
  
  try {
    const response = await api.post(`/coi/requests/${props.request.id}/clear-conflict-flag`, {
      conflict_entity: conflict.entity_name,
      notes
    })
    
    if (response.data.success) {
      // Update the request with cleared conflicts
      emit('updated', {
        ...props.request,
        group_conflicts_detected: response.data.remaining_conflicts ? JSON.stringify(response.data.remaining_conflicts) : null,
        requires_compliance_verification: response.data.remaining_conflicts?.length > 0 ? 1 : 0
      })
    }
  } catch (error: any) {
    console.error('Error clearing conflict flag:', error)
    errorMessage.value = error.response?.data?.error || 'Failed to clear conflict flag'
  }
}

// Handle viewing conflicting engagement
function handleViewEngagement(conflict: GroupConflict) {
  if (conflict.conflicting_engagement_id) {
    window.open(`/coi/request/${conflict.conflicting_engagement_id}`, '_blank')
  }
}
</script>


