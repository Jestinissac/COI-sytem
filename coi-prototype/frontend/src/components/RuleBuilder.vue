<template>
  <div class="rule-builder space-y-6">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Business Rules</h2>
          <p class="text-sm text-gray-500 mt-1">Define validation, conflict, and workflow rules</p>
        </div>
        <button
          @click="showCreateModal = true"
          class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Create Rule
        </button>
      </div>
    </div>

    <!-- Rules List -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">Active Rules</h3>
          <div class="flex items-center gap-3">
            <select
              v-model="filterRuleType"
              class="px-3 py-2 text-sm border border-gray-300 rounded-md"
            >
              <option value="">All Types</option>
              <option value="validation">Validation</option>
              <option value="conflict">Conflict</option>
              <option value="workflow">Workflow</option>
            </select>
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search rules..."
                class="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg class="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="p-6">
        <div v-if="loading" class="flex items-center justify-center py-8">
          <svg class="animate-spin h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-sm text-gray-500">Loading rules...</span>
        </div>

        <div v-else-if="filteredRules.length === 0" class="text-center py-8 text-gray-500">
          <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p>No rules found. Create your first rule to get started.</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="rule in filteredRules"
            :key="rule.id"
            class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
            :class="rule.is_active ? 'bg-white' : 'bg-gray-50'"
            @click="toggleRuleDetails(rule.id)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h4 class="font-semibold text-gray-900">{{ rule.rule_name || 'Unnamed Rule' }}</h4>
                  <span
                    class="px-2 py-0.5 text-xs font-medium rounded"
                    :class="getRuleTypeClass(rule.rule_type)"
                  >
                    {{ rule.rule_type }}
                  </span>
                  <span
                    v-if="rule.approval_status === 'Pending'"
                    class="px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-700"
                  >
                    Pending Approval
                  </span>
                  <span
                    v-else-if="rule.approval_status === 'Rejected'"
                    class="px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700"
                  >
                    Rejected
                  </span>
                  <span
                    v-else-if="rule.approval_status === 'Approved' && rule.is_active"
                    class="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700"
                  >
                    Active
                  </span>
                  <span
                    v-else
                    class="px-2 py-0.5 text-xs font-medium rounded bg-gray-200 text-gray-600"
                  >
                    Inactive
                  </span>
                </div>

                <!-- Rule Logic Display -->
                <div class="bg-gray-50 rounded p-3 mb-3">
                  <div class="text-sm text-gray-700">
                    <span class="font-medium">IF</span>
                    <span v-if="rule.condition_field" class="mx-1">
                      <span class="text-blue-600">{{ rule.condition_field }}</span>
                      <span class="mx-1">{{ getOperatorLabel(rule.condition_operator) }}</span>
                      <span class="text-green-600">{{ rule.condition_value }}</span>
                    </span>
                    <span v-else class="mx-1 text-gray-400">(no condition - applies to all)</span>
                    <span class="font-medium mx-1">THEN</span>
                    <span class="text-purple-600">{{ getActionLabel(rule.action_type) }}</span>
                    <span v-if="rule.action_value" class="text-gray-600">: {{ rule.action_value }}</span>
                  </div>
                </div>

                <!-- Expanded Details -->
                <div v-if="expandedRules.has(Number(rule.id))" class="mt-3 pt-3 border-t border-gray-200 space-y-2">
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="font-medium text-gray-700">Rule ID:</span>
                      <span class="ml-2 text-gray-600">#{{ rule.id }}</span>
                    </div>
                    <div>
                      <span class="font-medium text-gray-700">Status:</span>
                      <span class="ml-2" :class="rule.is_active ? 'text-green-600' : 'text-gray-600'">
                        {{ rule.is_active ? 'Active' : 'Inactive' }}
                      </span>
                    </div>
                    <div>
                      <span class="font-medium text-gray-700">Approval Status:</span>
                      <span class="ml-2" :class="getApprovalStatusClass(rule.approval_status)">
                        {{ rule.approval_status || 'N/A' }}
                      </span>
                    </div>
                    <div v-if="rule.condition_operator">
                      <span class="font-medium text-gray-700">Operator:</span>
                      <span class="ml-2 text-gray-600">{{ rule.condition_operator }}</span>
                    </div>
                  </div>
                  
                  <div v-if="rule.description || rule.notes" class="mt-2">
                    <span class="font-medium text-gray-700">Description:</span>
                    <p class="mt-1 text-sm text-gray-600">{{ rule.description || rule.notes || 'No description provided' }}</p>
                  </div>
                </div>

                <div class="text-xs text-gray-500 space-y-1">
                  <div>Created by {{ rule.created_by_name || rule.created_by || 'Unknown' }} on {{ formatDate(rule.created_at) }}</div>
                  <div v-if="rule.approved_by_name || rule.approved_by">
                    Approved by {{ rule.approved_by_name || rule.approved_by }} on {{ formatDate(rule.approved_at) }}
                  </div>
                  <div v-if="rule.rejection_reason" class="text-red-600">
                    Rejected: {{ rule.rejection_reason }}
                  </div>
                  <div v-if="rule.updated_at && rule.updated_at !== rule.created_at">
                    Last updated: {{ formatDate(rule.updated_at) }}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 ml-4" @click.stop>
                <!-- Expand/Collapse Button -->
                <button
                  @click="toggleRuleDetails(rule.id)"
                  class="px-2 py-1.5 text-gray-600 hover:bg-gray-100 rounded"
                  :title="expandedRules.has(Number(rule.id)) ? 'Collapse details' : 'Expand details'"
                >
                  <svg 
                    class="w-4 h-4 transition-transform"
                    :class="expandedRules.has(Number(rule.id)) ? 'rotate-180' : ''"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                
                <!-- Super Admin Actions -->
                <template v-if="isSuperAdmin && rule.approval_status === 'Pending'">
                  <button
                    @click.stop="approveRule(rule)"
                    class="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    @click.stop="openRejectModal(rule)"
                    class="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </template>
                
                <!-- Regular Actions -->
                <button
                  v-if="rule.approval_status === 'Approved'"
                  @click.stop="toggleRule(rule)"
                  class="px-3 py-1.5 text-xs font-medium rounded"
                  :class="rule.is_active 
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'"
                >
                  {{ rule.is_active ? 'Disable' : 'Enable' }}
                </button>
                <button
                  @click.stop="editRule(rule)"
                  class="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  @click.stop="deleteRule(rule)"
                  class="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Rule Modal -->
    <div
      v-if="showCreateModal || editingRule"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ editingRule ? 'Edit Rule' : 'Create New Rule' }}
          </h3>
        </div>

        <form @submit.prevent="saveRule" class="p-6 space-y-6">
          <!-- Rule Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Rule Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="ruleForm.rule_name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Block Audit + Advisory Conflict"
            />
          </div>

          <!-- Rule Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Rule Type <span class="text-red-500">*</span>
            </label>
            <select
              v-model="ruleForm.rule_type"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select type...</option>
              <option value="validation">Validation</option>
              <option value="conflict">Conflict</option>
              <option value="workflow">Workflow</option>
            </select>
          </div>

          <!-- Condition Section -->
          <div class="border-t border-gray-200 pt-4">
            <h4 class="text-sm font-semibold text-gray-900 mb-4">Condition (IF)</h4>
            
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Field</label>
                <select
                  v-model="ruleForm.condition_field"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select field...</option>
                  <option value="service_type">Service Type</option>
                  <option value="client_type">Client Type</option>
                  <option value="pie_status">PIE Status</option>
                  <option value="client_location">Client Location</option>
                  <option value="relationship_with_client">Relationship</option>
                  <option value="international_operations">International Operations</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Operator</label>
                <select
                  v-model="ruleForm.condition_operator"
                  :disabled="!ruleForm.condition_field"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select operator...</option>
                  <option value="equals">Equals (=)</option>
                  <option value="not_equals">Not Equals (≠)</option>
                  <option value="contains">Contains</option>
                  <option value="not_contains">Not Contains</option>
                  <option value="starts_with">Starts With</option>
                  <option value="ends_with">Ends With</option>
                  <option value="greater_than">Greater Than (>)</option>
                  <option value="less_than">Less Than (<)</option>
                  <option value="greater_than_or_equal">Greater Than or Equal (≥)</option>
                  <option value="less_than_or_equal">Less Than or Equal (≤)</option>
                  <option value="in">In (comma-separated)</option>
                  <option value="not_in">Not In (comma-separated)</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Value</label>
                <input
                  v-model="ruleForm.condition_value"
                  type="text"
                  :disabled="!ruleForm.condition_operator"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="Enter value..."
                />
              </div>
            </div>
          </div>

          <!-- Action Section -->
          <div class="border-t border-gray-200 pt-4">
            <h4 class="text-sm font-semibold text-gray-900 mb-4">Action (THEN)</h4>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Action Type <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="ruleForm.action_type"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select action...</option>
                  <option value="block">Block</option>
                  <option value="flag">Flag</option>
                  <option value="require_approval">Require Approval</option>
                  <option value="set_status">Set Status</option>
                  <option value="send_notification">Send Notification</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Action Value</label>
                <input
                  v-model="ruleForm.action_value"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional: e.g., status name, message..."
                />
              </div>
            </div>
          </div>

          <!-- Active Status -->
          <div class="flex items-center">
            <input
              v-model="ruleForm.is_active"
              type="checkbox"
              id="is_active"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label for="is_active" class="ml-2 text-sm text-gray-700">
              Rule is active
            </label>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : (editingRule ? 'Update Rule' : 'Create Rule') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Reject Rule Modal -->
    <div
      v-if="showRejectModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showRejectModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Reject Rule</h3>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="rejectionReason"
              rows="4"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Please provide a reason for rejecting this rule..."
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              @click="showRejectModal = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              @click="rejectRule"
              class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
            >
              Reject Rule
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

const { success: showSuccess, error: showError } = useToast()
const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const rules = ref<any[]>([])
const showCreateModal = ref(false)
const editingRule = ref<any>(null)
const searchQuery = ref('')
const filterRuleType = ref('')
const isSuperAdmin = ref(false)
const showRejectModal = ref(false)
const rejectingRule = ref<any>(null)
const rejectionReason = ref('')
const expandedRules = ref(new Set<number>())
const hasShownInitialError = ref(false)

const ruleForm = ref({
  rule_name: '',
  rule_type: '',
  condition_field: '',
  condition_operator: '',
  condition_value: '',
  action_type: '',
  action_value: '',
  is_active: true
})

const filteredRules = computed(() => {
  let filtered = rules.value

  if (filterRuleType.value) {
    filtered = filtered.filter(r => r.rule_type === filterRuleType.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(r =>
      r.rule_name.toLowerCase().includes(q) ||
      r.rule_type.toLowerCase().includes(q) ||
      (r.condition_field && r.condition_field.toLowerCase().includes(q))
    )
  }

  return filtered
})

function getRuleTypeClass(type: string) {
  const classes: Record<string, string> = {
    'validation': 'bg-blue-100 text-blue-700',
    'conflict': 'bg-red-100 text-red-700',
    'workflow': 'bg-purple-100 text-purple-700'
  }
  return classes[type] || 'bg-gray-100 text-gray-700'
}

function getOperatorLabel(operator: string) {
  const labels: Record<string, string> = {
    'equals': '=',
    'not_equals': '≠',
    'contains': 'contains',
    'greater_than': '>',
    'less_than': '<',
    'in': 'in'
  }
  return labels[operator] || operator
}

function getActionLabel(action: string) {
  const labels: Record<string, string> = {
    'block': 'Block Request',
    'flag': 'Flag for Review',
    'require_approval': 'Require Approval',
    'set_status': 'Set Status',
    'send_notification': 'Send Notification'
  }
  return labels[action] || action
}

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function toggleRuleDetails(ruleId: number | string) {
  const id = Number(ruleId)
  if (expandedRules.value.has(id)) {
    expandedRules.value.delete(id)
  } else {
    expandedRules.value.add(id)
  }
}

function getApprovalStatusClass(status: string) {
  const classes: Record<string, string> = {
    'Approved': 'text-green-600',
    'Pending': 'text-yellow-600',
    'Rejected': 'text-red-600'
  }
  return classes[status] || 'text-gray-600'
}

async function loadRules() {
  loading.value = true
  try {
    // Check user role from auth store
    isSuperAdmin.value = authStore.user?.role === 'Super Admin'
    
    // Load rules (include pending for Super Admin)
    const response = await api.get('/config/business-rules', {
      params: { includePending: isSuperAdmin.value ? 'true' : 'false' }
    })
    
    console.log('Rules API Response:', response.data)
    console.log('Rules count:', response.data?.rules?.length || 0)
    console.log('User role:', authStore.user?.role)
    console.log('Is Super Admin:', isSuperAdmin.value)
    
    rules.value = response.data.rules || []
    hasShownInitialError.value = false // Reset on success
    
    if (rules.value.length === 0) {
      console.warn('No rules found. This might be expected if no rules have been created yet.')
    }
  } catch (error: any) {
    console.error('Error loading rules:', error)
    console.error('Error response:', error.response?.data)
    
    // Handle 404 gracefully - just show empty state
    if (error.response?.status === 404) {
      rules.value = []
      if (!hasShownInitialError.value) {
        console.warn('Business rules endpoint not found. Showing empty state.')
        hasShownInitialError.value = true
      }
    } else {
      // Only show error for non-404 errors, and only once on initial load
      if (!hasShownInitialError.value) {
        showError(error.response?.data?.error || 'Failed to load rules')
        hasShownInitialError.value = true
      }
      rules.value = []
    }
  } finally {
    loading.value = false
  }
}

async function approveRule(rule: any) {
  try {
    await api.post(`/config/business-rules/${rule.id}/approve`, {})
    showSuccess('Rule approved and activated')
    await loadRules()
  } catch (error: any) {
    showError(error.response?.data?.error || 'Failed to approve rule')
  }
}

function openRejectModal(rule: any) {
  rejectingRule.value = rule
  rejectionReason.value = ''
  showRejectModal.value = true
}

async function rejectRule() {
  if (!rejectionReason.value.trim()) {
    showError('Please provide a rejection reason')
    return
  }

  try {
    await api.post(`/config/business-rules/${rejectingRule.value.id}/reject`, {
      reason: rejectionReason.value
    })
    showSuccess('Rule rejected')
    showRejectModal.value = false
    rejectingRule.value = null
    rejectionReason.value = ''
    await loadRules()
  } catch (error: any) {
    showError(error.response?.data?.error || 'Failed to reject rule')
  }
}

async function saveRule() {
  saving.value = true
  try {
    let response
    if (editingRule.value) {
      response = await api.put(`/config/business-rules/${editingRule.value.id}`, ruleForm.value)
    } else {
      response = await api.post('/config/business-rules', ruleForm.value)
    }
    
    const message = response.data.requiresApproval
      ? 'Rule saved and pending Super Admin approval'
      : 'Rule saved successfully'
    
    showSuccess(message)
    closeModal()
    await loadRules()
  } catch (error: any) {
    showError(error.response?.data?.error || 'Failed to save rule')
  } finally {
    saving.value = false
  }
}

async function toggleRule(rule: any) {
  try {
    await api.put(`/config/business-rules/${rule.id}`, {
      ...rule,
      is_active: !rule.is_active
    })
    showSuccess(`Rule ${rule.is_active ? 'disabled' : 'enabled'}`)
    await loadRules()
  } catch (error: any) {
    showError(error.response?.data?.error || 'Failed to update rule')
  }
}

function editRule(rule: any) {
  editingRule.value = rule
  ruleForm.value = {
    rule_name: rule.rule_name,
    rule_type: rule.rule_type,
    condition_field: rule.condition_field || '',
    condition_operator: rule.condition_operator || '',
    condition_value: rule.condition_value || '',
    action_type: rule.action_type,
    action_value: rule.action_value || '',
    is_active: rule.is_active === 1 || rule.is_active === true
  }
  showCreateModal.value = true
}

async function deleteRule(rule: any) {
  if (!confirm(`Are you sure you want to delete "${rule.rule_name}"?`)) {
    return
  }

  try {
    await api.delete(`/config/business-rules/${rule.id}`)
    showSuccess('Rule deleted successfully')
    await loadRules()
  } catch (error: any) {
    showError(error.response?.data?.error || 'Failed to delete rule')
  }
}

function closeModal() {
  showCreateModal.value = false
  editingRule.value = null
  ruleForm.value = {
    rule_name: '',
    rule_type: '',
    condition_field: '',
    condition_operator: '',
    condition_value: '',
    action_type: '',
    action_value: '',
    is_active: true
  }
}

onMounted(() => {
  loadRules()
})
</script>

