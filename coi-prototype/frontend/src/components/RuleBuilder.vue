<!--
  Rule Builder Component
  
  Edition Differences:
  - Standard Edition: Basic rule creation with simple conditions (block/flag actions)
  - Pro Edition: All Standard features PLUS:
    * IESBA rule templates (one-click import)
    * Rule categories (IESBA, Red Line, PIE, Tax, Custom)
    * Regulation references
    * Advanced conditions (AND/OR groups)
    * Impact analysis preview
    * Rule testing against recent requests
    * Recommendation actions (recommend_reject, recommend_flag, etc.)
    * PIE-specific and tax sub-type options
-->
<template>
  <div class="rule-builder space-y-6">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Business Rules</h2>
          <p class="text-sm text-gray-500 mt-1">Define validation, conflict, and workflow rules</p>
        </div>
        <div class="flex items-center gap-2">
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
    </div>

    <!-- Rules List -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">Active Rules</h3>
          <div class="flex items-center gap-3">
            <select
              v-model="filterCategory"
              class="px-3 py-2 text-sm border border-gray-300 rounded-md"
            >
              <option value="">All Categories</option>
              <option value="Custom">Custom</option>
              <template v-if="isPro">
                <option value="IESBA">IESBA</option>
                <option value="Red Line">Red Line</option>
                <option value="PIE">PIE</option>
                <option value="Tax">Tax</option>
              </template>
            </select>
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

        <div v-else class="space-y-6">
          <!-- Grouped by Category -->
          <div v-for="category in groupedRules" :key="category.name" class="space-y-3">
            <!-- Category Header -->
            <div class="sticky top-0 z-10 bg-gray-50 border-b-2 border-gray-300 py-3 px-4 -mx-6 -mt-6 mb-4 rounded-t-lg">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <h4 class="text-base font-bold text-gray-900">{{ category.name }}</h4>
                  <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                    {{ category.rules.length }} {{ category.rules.length === 1 ? 'rule' : 'rules' }}
                  </span>
                </div>
                <button
                  @click.stop="toggleCategory(category.name)"
                  class="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <svg 
                    class="w-4 h-4 transition-transform" 
                    :class="{ 'rotate-180': expandedCategories.has(category.name) }"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                  {{ expandedCategories.has(category.name) ? 'Collapse' : 'Expand' }}
                </button>
              </div>
            </div>
            
            <!-- Category Rules -->
            <div v-show="expandedCategories.has(category.name)" class="space-y-4">
              <div
                v-for="rule in category.rules"
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
                    <!-- Pro-only fields -->
                    <div v-if="isPro && rule.rule_category && rule.rule_category !== 'Custom'">
                      <span class="font-medium text-gray-700">Category:</span>
                      <span class="ml-2 text-gray-600">{{ rule.rule_category }}</span>
                    </div>
                    <div v-if="isPro && rule.regulation_reference">
                      <span class="font-medium text-gray-700">Regulation:</span>
                      <span class="ml-2 text-gray-600">{{ rule.regulation_reference }}</span>
                    </div>
                    <div v-if="isPro && rule.applies_to_pie">
                      <span class="font-medium text-gray-700">PIE Only:</span>
                      <span class="ml-2 text-gray-600">Yes</span>
                    </div>
                    <div v-if="isPro && rule.tax_sub_type">
                      <span class="font-medium text-gray-700">Tax Sub-Type:</span>
                      <span class="ml-2 text-gray-600">{{ rule.tax_sub_type }}</span>
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
    </div>
    </div>

    <!-- Create/Edit Rule Modal -->
    <div
      v-if="showCreateModal || editingRule"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeModal"
    >
      <div ref="modalContent" class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ editingRule ? 'Edit Rule' : 'Create New Rule' }}
          </h3>
        </div>

        <form @submit.prevent="saveRule" class="p-6 space-y-6" @change="onFormChange">
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

          <!-- Pro Version: IESBA Rule Templates -->
          <div v-if="isPro" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label class="block text-sm font-semibold text-blue-900 mb-2">IESBA Rule Templates (Pro)</label>
            <select
              v-model="selectedTemplate"
              @change="loadTemplate"
              class="w-full px-3 py-2 border border-blue-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select IESBA template...</option>
              <option value="red_line_management">Red Line: Management Responsibility</option>
              <option value="red_line_advocacy">Red Line: Advocacy</option>
              <option value="red_line_contingent_fees">Red Line: Contingent Fees</option>
              <option value="pie_tax_planning">PIE: Tax Planning Prohibited</option>
              <option value="pie_tax_compliance">PIE: Tax Compliance Requires Safeguards</option>
              <option value="pie_advisory">PIE: Advisory Services Prohibited</option>
              <option value="audit_tax_planning_pie">Audit + Tax Planning (PIE) - Prohibited</option>
              <option value="audit_tax_planning_nonpie">Audit + Tax Planning (Non-PIE) - Requires Safeguards</option>
              <option value="audit_tax_compliance">Audit + Tax Compliance - Likely Approved</option>
            </select>
            <p class="text-xs text-blue-700 mt-1">One-click import of IESBA-compliant rules</p>
          </div>

          <!-- Pro Version: Rule Category & Regulation -->
          <div v-if="isPro" class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Rule Category</label>
              <select
                v-model="ruleForm.rule_category"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="Custom">Custom</option>
                <option value="IESBA">IESBA</option>
                <option value="Red Line">Red Line</option>
                <option value="PIE">PIE</option>
                <option value="Tax">Tax</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Regulation Reference</label>
              <select
                v-model="ruleForm.regulation_reference"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select IESBA section...</option>
                <option value="IESBA Code Section 290">IESBA Code Section 290 (General)</option>
                <option value="IESBA Code Section 290.104">IESBA Code Section 290.104 (Management Responsibility)</option>
                <option value="IESBA Code Section 290.105">IESBA Code Section 290.105 (Advocacy)</option>
                <option value="IESBA Code Section 290.106">IESBA Code Section 290.106 (Contingent Fees)</option>
                <option value="EU Audit Regulation">EU Audit Regulation</option>
                <option value="EU Audit Regulation Article 4(2)">EU Audit Regulation Article 4(2) (Fee Cap)</option>
              </select>
            </div>
          </div>

          <!-- Pro Version: PIE-Specific & Tax Sub-Type -->
          <div v-if="isPro" class="grid grid-cols-2 gap-4">
            <div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="ruleForm.applies_to_pie"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span class="text-sm font-medium text-gray-700">Applies to PIE clients only</span>
              </label>
              <p class="text-xs text-gray-500 mt-1">Rule will only apply to Public Interest Entities</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tax Sub-Type (if applicable)</label>
              <select
                v-model="ruleForm.tax_sub_type"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not applicable</option>
                <option value="TAX_COMPLIANCE">Tax Compliance</option>
                <option value="TAX_PLANNING">Tax Planning</option>
                <option value="TAX_CALCULATIONS">Tax Calculations</option>
              </select>
            </div>
          </div>

          <!-- Condition Section -->
          <div class="border-t border-gray-200 pt-4">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-sm font-semibold text-gray-900">Condition (IF)</h4>
              <label v-if="isPro" class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="useAdvancedConditions"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span class="text-sm text-gray-600">Advanced (AND/OR groups) <span class="text-xs text-blue-600">(Pro)</span></span>
              </label>
            </div>
            
            <!-- Simple Mode: Single condition -->
            <div v-if="!useAdvancedConditions" class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Field</label>
                <select
                  v-model="ruleForm.condition_field"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  :disabled="loadingFields"
                >
                  <option value="">Select field...</option>
                  <!-- Dynamic fields grouped by category -->
                  <template v-if="Object.keys(ruleFields).length > 0">
                    <optgroup v-for="(category, catKey) in ruleFields" :key="catKey" :label="category.label">
                      <option v-for="field in category.fields" :key="field.id" :value="field.id">
                        {{ field.label }}
                      </option>
                    </optgroup>
                  </template>
                  <!-- Fallback flat list -->
                  <template v-else-if="allFields.length > 0">
                    <option v-for="field in allFields" :key="field.id" :value="field.id">
                      {{ field.label }}
                    </option>
                  </template>
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
                  <template v-if="ruleForm.condition_field && getOperatorsForField(ruleForm.condition_field).length > 0">
                    <option 
                      v-for="op in getOperatorsForField(ruleForm.condition_field)" 
                      :key="op.id" 
                      :value="op.id"
                    >
                      {{ op.label }}
                    </option>
                  </template>
                  <template v-else>
                    <option value="equals">Equals (=)</option>
                    <option value="not_equals">Not Equals (≠)</option>
                    <option value="contains">Contains</option>
                    <option value="not_contains">Not Contains</option>
                    <option value="in">In (comma-separated)</option>
                    <option value="not_in">Not In (comma-separated)</option>
                  </template>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Value</label>
                <!-- Show dropdown if field has predefined options -->
                <select
                  v-if="fieldHasOptions(ruleForm.condition_field)"
                  v-model="ruleForm.condition_value"
                  :disabled="!ruleForm.condition_operator"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select value...</option>
                  <option v-for="opt in getFieldOptions(ruleForm.condition_field)" :key="opt" :value="opt">
                    {{ opt }}
                  </option>
                </select>
                <!-- Show text input for free-form fields -->
                <input
                  v-else
                  v-model="ruleForm.condition_value"
                  type="text"
                  :disabled="!ruleForm.condition_operator"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="Enter value..."
                />
              </div>
            </div>

            <!-- Advanced Mode: Multiple conditions with AND/OR (Pro only) -->
            <div v-if="!isPro && useAdvancedConditions" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div>
                  <h5 class="text-sm font-semibold text-blue-900 mb-1">Advanced Conditions (Pro Feature)</h5>
                  <p class="text-sm text-blue-700 mb-2">Complex AND/OR condition groups are available in Pro Edition.</p>
                  <button 
                    @click="useAdvancedConditions = false"
                    class="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Switch back to simple mode
                  </button>
                </div>
              </div>
            </div>
            <ConditionBuilder
              v-else-if="isPro"
              v-model="conditionGroups"
              :field-categories="ruleFields"
              :operators="fieldOperators"
              :all-fields="allFields"
            />
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
                  <template v-if="isPro">
                    <!-- Pro Edition: Recommendation Actions -->
                    <option value="recommend_reject">Recommend Reject</option>
                    <option value="recommend_flag">Recommend Flag</option>
                    <option value="recommend_review">Recommend Review</option>
                    <option value="recommend_approve">Recommend Approve</option>
                  </template>
                  <template v-else>
                    <!-- Standard Edition: Direct Actions -->
                    <option value="block">Block</option>
                    <option value="flag">Flag</option>
                    <option value="require_approval">Require Approval</option>
                  </template>
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

          <!-- Pro Version: Recommendation Configuration -->
          <div v-if="isPro" class="border-t border-gray-200 pt-4">
            <h4 class="text-sm font-semibold text-gray-900 mb-4">Recommendation Configuration (Pro)</h4>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Confidence Level</label>
                <select
                  v-model="ruleForm.confidence_level"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
                <p class="text-xs text-gray-500 mt-1">How confident is this recommendation?</p>
              </div>
              
              <div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="ruleForm.can_override"
                    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span class="text-sm font-medium text-gray-700">Can be overridden</span>
                </label>
                <p class="text-xs text-gray-500 mt-1">Allow Compliance to override this recommendation</p>
              </div>
            </div>
            
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Guidance Text</label>
              <textarea
                v-model="ruleForm.guidance_text"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Provide guidance for Compliance officers reviewing this recommendation..."
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">Additional context for Compliance review</p>
            </div>
            
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Override Guidance</label>
              <textarea
                v-model="ruleForm.override_guidance"
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Instructions for when and how to override this recommendation..."
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">Guidance shown when override is attempted</p>
            </div>
          </div>

          <!-- Impact Analysis (Pro only - shown when editing) -->
          <div v-if="isPro && editingRule && (impactAnalysis || checkingImpact)" 
               :class="{
                 'bg-yellow-50 border-yellow-200': impactAnalysis && (impactAnalysis.riskLevel === 'high' || impactAnalysis.riskLevel === 'critical'),
                 'bg-blue-50 border-blue-200': impactAnalysis && impactAnalysis.riskLevel === 'medium',
                 'bg-green-50 border-green-200': impactAnalysis && impactAnalysis.riskLevel === 'low',
                 'bg-gray-50 border-gray-200': !impactAnalysis || checkingImpact
               }"
               class="border rounded-lg p-4">
            <div v-if="checkingImpact && !impactAnalysis" class="text-center py-4">
              <p class="text-sm text-gray-600">Analyzing impact...</p>
            </div>
            <div v-else-if="impactAnalysis" class="flex items-start">
              <svg v-if="impactAnalysis.riskLevel === 'high' || impactAnalysis.riskLevel === 'critical'" 
                   class="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <svg v-else class="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div class="flex-1">
                <h4 :class="{
                  'text-yellow-800': impactAnalysis.riskLevel === 'high' || impactAnalysis.riskLevel === 'critical',
                  'text-blue-800': impactAnalysis.riskLevel === 'medium',
                  'text-green-800': impactAnalysis.riskLevel === 'low'
                }" class="text-sm font-semibold mb-2">
                  Impact Analysis
                  <span v-if="checkingImpact" class="ml-2 text-xs font-normal">(Analyzing...)</span>
                </h4>
                <div :class="{
                  'text-yellow-700': impactAnalysis.riskLevel === 'high' || impactAnalysis.riskLevel === 'critical',
                  'text-blue-700': impactAnalysis.riskLevel === 'medium',
                  'text-green-700': impactAnalysis.riskLevel === 'low'
                }" class="text-sm space-y-1">
                  <p><strong>Risk Level:</strong> {{ impactAnalysis.riskLevel?.toUpperCase() }}</p>
                  <p v-if="impactAnalysis.affectedRequests?.currentlyMatching">
                    Currently matching: {{ impactAnalysis.affectedRequests.currentlyMatching }} request(s)
                  </p>
                  <p v-if="impactAnalysis.affectedRequests?.wouldStopMatching">
                    Would stop matching: {{ impactAnalysis.affectedRequests.wouldStopMatching }} request(s)
                  </p>
                  <p v-if="impactAnalysis.affectedRequests?.wouldStartMatching">
                    Would newly match: {{ impactAnalysis.affectedRequests.wouldStartMatching }} request(s)
                  </p>
                  <p v-if="impactAnalysis.pendingReviewsAffected">
                    Pending reviews affected: {{ impactAnalysis.pendingReviewsAffected }}
                  </p>
                  <p v-if="impactAnalysis.historicalExecutions?.totalExecutions">
                    Historical executions: {{ impactAnalysis.historicalExecutions.totalExecutions }}
                  </p>
                </div>
                <ul v-if="impactAnalysis.warnings && impactAnalysis.warnings.length > 0" 
                    :class="{
                      'text-yellow-700': impactAnalysis.riskLevel === 'high' || impactAnalysis.riskLevel === 'critical',
                      'text-blue-700': impactAnalysis.riskLevel === 'medium',
                      'text-green-700': impactAnalysis.riskLevel === 'low'
                    }"
                    class="mt-2 text-sm list-disc list-inside">
                  <li v-for="(warning, idx) in impactAnalysis.warnings" :key="idx">{{ warning }}</li>
                </ul>
                <p v-if="impactAnalysis.requiresApproval" 
                   :class="{
                     'text-yellow-800': impactAnalysis.riskLevel === 'high' || impactAnalysis.riskLevel === 'critical',
                     'text-blue-800': impactAnalysis.riskLevel === 'medium'
                   }"
                   class="mt-2 text-sm font-medium">
                  This change requires approval. Review the impact carefully before saving.
                </p>
                <p v-else-if="impactAnalysis.riskLevel === 'low'" class="mt-2 text-sm font-medium text-green-800">
                  Low impact change. Safe to proceed.
                </p>
              </div>
            </div>
          </div>

          <!-- Test Rule Panel (Pro only) -->
          <div v-if="isPro" class="border-t border-gray-200 pt-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-semibold text-gray-900">Test Rule <span class="text-xs text-blue-600">(Pro)</span></h4>
              <button
                type="button"
                @click="testRuleNow"
                :disabled="testingRule || !ruleForm.rule_name"
                class="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1"
              >
                <svg v-if="testingRule" class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Test Against Recent Requests
              </button>
            </div>
            
            <div v-if="testResults" class="bg-gray-50 rounded-lg p-3 text-sm">
              <div class="flex items-center gap-4 mb-3">
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span class="text-gray-700">Matches: <strong>{{ testResults.summary.wouldMatch }}</strong></span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 bg-gray-400 rounded-full"></span>
                  <span class="text-gray-700">No Match: <strong>{{ testResults.summary.wouldNotMatch }}</strong></span>
                </div>
                <span class="text-gray-500 text-xs">(of {{ testResults.testedAgainst }} recent requests)</span>
              </div>
              
              <div v-if="testResults.matches.length > 0" class="mb-2">
                <div class="text-xs font-medium text-green-700 mb-1">Would Match:</div>
                <div class="flex flex-wrap gap-1">
                  <span 
                    v-for="match in testResults.matches.slice(0, 5)" 
                    :key="match.id"
                    class="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded"
                    :title="match.service"
                  >
                    {{ match.requestId }}
                  </span>
                  <span v-if="testResults.matches.length > 5" class="text-xs text-gray-500">
                    +{{ testResults.matches.length - 5 }} more
                  </span>
                </div>
              </div>
              
              <div v-if="testResults.nonMatches.length > 0 && testResults.matches.length < 5">
                <div class="text-xs font-medium text-gray-600 mb-1">Would Not Match:</div>
                <div class="flex flex-wrap gap-1">
                  <span 
                    v-for="noMatch in testResults.nonMatches.slice(0, 3)" 
                    :key="noMatch.id"
                    class="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded"
                    :title="noMatch.service"
                  >
                    {{ noMatch.requestId }}
                  </span>
                  <span v-if="testResults.nonMatches.length > 3" class="text-xs text-gray-500">
                    +{{ testResults.nonMatches.length - 3 }} more
                  </span>
                </div>
              </div>
            </div>
            
            <p v-else class="text-xs text-gray-500">
              Click "Test" to see which recent requests would match this rule.
            </p>
          </div>

          <!-- Validation Errors/Warnings -->
          <div v-if="ruleValidation && (ruleValidation.errors.length > 0 || ruleValidation.warnings.length > 0)" 
               class="border rounded-lg p-4 space-y-3"
               :class="ruleValidation.errors.length > 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'">
            <div v-if="ruleValidation.errors.length > 0" class="text-red-700">
              <h5 class="font-semibold text-sm flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Validation Errors
              </h5>
              <ul class="mt-2 text-sm list-disc list-inside space-y-1">
                <li v-for="(err, idx) in ruleValidation.errors" :key="'err-'+idx">
                  <span class="font-medium">{{ err.field }}:</span> {{ err.message }}
                  <span v-if="err.severity === 'critical'" class="ml-1 px-1.5 py-0.5 bg-red-200 text-red-800 text-xs rounded">Critical</span>
                </li>
              </ul>
            </div>
            <div v-if="ruleValidation.warnings.length > 0" class="text-amber-700">
              <h5 class="font-semibold text-sm flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                Warnings
              </h5>
              <ul class="mt-2 text-sm list-disc list-inside space-y-1">
                <li v-for="(warn, idx) in ruleValidation.warnings" :key="'warn-'+idx">
                  <span class="font-medium">{{ warn.field }}:</span> {{ warn.message }}
                </li>
              </ul>
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
import ConditionBuilder from './rules/ConditionBuilder.vue'

const { success: showSuccess, error: showError } = useToast()
const authStore = useAuthStore()

// Ensure edition is loaded
onMounted(async () => {
  if (authStore.isAuthenticated && !authStore.edition) {
    await authStore.loadEdition()
  }
})

// Computed property for reactive Pro check
const isPro = computed(() => authStore.isPro)

const loading = ref(false)
const saving = ref(false)
const rules = ref<any[]>([])
const showCreateModal = ref(false)
const editingRule = ref<any>(null)
const modalContent = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const filterRuleType = ref('')
const filterCategory = ref('')
const isSuperAdmin = ref(false)
const expandedCategories = ref(new Set<string>(['Custom']))
const showRejectModal = ref(false)
const rejectingRule = ref<any>(null)
const rejectionReason = ref('')
const expandedRules = ref(new Set<number>())
const hasShownInitialError = ref(false)
const impactAnalysis = ref<any>(null)
const checkingImpact = ref(false)
const showImpactWarning = ref(false)
let impactCheckTimeout: any = null

// Dynamic field configuration
interface RuleField {
  id: string
  label: string
  type: string
  options?: string[]
  source?: string
  valueType?: string
  description?: string
}

interface FieldCategory {
  label: string
  fields: RuleField[]
}

interface FieldOperator {
  id: string
  label: string
}

const ruleFields = ref<Record<string, FieldCategory>>({})
const fieldOperators = ref<Record<string, FieldOperator[]>>({})
const allFields = ref<RuleField[]>([])
const loadingFields = ref(false)
const selectedTemplate = ref('')

// Condition builder mode
const useAdvancedConditions = ref(false)

interface ConditionGroup {
  operator: 'AND' | 'OR'
  conditions: Array<{
    field: string
    conditionOperator: string
    value: string
    operator?: 'AND' | 'OR'
  }>
}

const conditionGroups = ref<ConditionGroup[]>([
  { operator: 'AND', conditions: [{ field: '', conditionOperator: '', value: '', operator: 'AND' }] }
])

// Rule validation
interface ValidationError {
  field: string
  message: string
  severity?: string
}

interface RuleValidation {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  hasCriticalErrors: boolean
}

const ruleValidation = ref<RuleValidation | null>(null)
const validatingRule = ref(false)
let validationTimeout: any = null

// Test rule
interface TestResults {
  testedAgainst: number
  matches: Array<{ requestId: string; id: number; service: string; status: string }>
  nonMatches: Array<{ requestId: string; id: number; service: string; status: string }>
  summary: { wouldMatch: number; wouldNotMatch: number }
}

const testResults = ref<TestResults | null>(null)
const testingRule = ref(false)

const ruleForm = ref({
  rule_name: '',
  rule_type: '',
  condition_field: '',
  condition_operator: '',
  condition_value: '',
  action_type: '',
  action_value: '',
  is_active: true,
  rule_category: 'Custom' as string,
  regulation_reference: '' as string,
  applies_to_pie: false as boolean,
  tax_sub_type: '' as string,
  confidence_level: 'MEDIUM' as string,
  can_override: true as boolean,
  guidance_text: '' as string,
  override_guidance: '' as string
})

const filteredRules = computed(() => {
  let filtered = rules.value

  // For Standard users, only show Custom category rules
  if (!isPro.value) {
    filtered = filtered.filter(r => {
      const category = r.rule_category || 'Custom'
      return category === 'Custom'
    })
  }

  if (filterRuleType.value) {
    filtered = filtered.filter(r => r.rule_type === filterRuleType.value)
  }

  if (filterCategory.value) {
    filtered = filtered.filter(r => (r.rule_category || 'Custom') === filterCategory.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(r =>
      r.rule_name.toLowerCase().includes(q) ||
      r.rule_type.toLowerCase().includes(q) ||
      (r.condition_field && r.condition_field.toLowerCase().includes(q)) ||
      (r.rule_category && r.rule_category.toLowerCase().includes(q))
    )
  }

  return filtered
})

const groupedRules = computed(() => {
  const groups: Record<string, any[]> = {}
  
  filteredRules.value.forEach(rule => {
    const category = rule.rule_category || 'Custom'
    // For Standard users, only group Custom category
    if (isPro.value || category === 'Custom') {
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(rule)
    }
  })
  
  // Define category order - Standard users only see Custom
  const categoryOrder = isPro.value 
    ? ['Red Line', 'IESBA', 'PIE', 'Tax', 'Custom']
    : ['Custom']
  const orderedCategories = categoryOrder.filter(cat => groups[cat])
  const otherCategories = Object.keys(groups).filter(cat => !categoryOrder.includes(cat))
  
  return [...orderedCategories, ...otherCategories].map(name => ({
    name,
    rules: groups[name].sort((a, b) => (a.rule_name || '').localeCompare(b.rule_name || ''))
  }))
})

function toggleCategory(categoryName: string) {
  if (expandedCategories.value.has(categoryName)) {
    expandedCategories.value.delete(categoryName)
  } else {
    expandedCategories.value.add(categoryName)
  }
}

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
    'recommend_reject': 'Recommend Reject',
    'recommend_flag': 'Recommend Flag',
    'recommend_review': 'Recommend Review',
    'recommend_approve': 'Recommend Approve',
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
    console.log('Is Pro:', isPro.value)
    
    rules.value = response.data.rules || []
    
    // Log category breakdown
    const categoryBreakdown = rules.value.reduce((acc: any, rule: any) => {
      const category = rule.rule_category || 'Custom'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})
    console.log('Rules by category:', categoryBreakdown)
    console.log('Custom category rules:', rules.value.filter((r: any) => (r.rule_category || 'Custom') === 'Custom').length)
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
  // If impact analysis requires approval, confirm with user
  if (impactAnalysis.value?.requiresApproval && !showImpactWarning.value) {
    const confirmed = confirm(
      `This rule change has high impact:\n\n` +
      `- ${impactAnalysis.value.affectedRequests?.currentlyMatching || 0} requests currently match\n` +
      `- ${impactAnalysis.value.pendingReviewsAffected || 0} pending reviews affected\n\n` +
      `Are you sure you want to proceed?`
    )
    if (!confirmed) {
      return
    }
  }
  
  saving.value = true
  try {
    // Build payload with condition_groups if using advanced mode
    const payload: any = { ...ruleForm.value }
    
    if (useAdvancedConditions.value) {
      // Store condition groups as JSON string
      payload.condition_groups = JSON.stringify(conditionGroups.value)
      // Clear single condition fields when using advanced mode
      payload.condition_field = null
      payload.condition_operator = null
      payload.condition_value = null
    } else {
      // Clear condition_groups when using simple mode
      payload.condition_groups = null
    }
    
    let response
    if (editingRule.value) {
      // Include forceUpdate if user confirmed high-impact change
      const finalPayload = {
        ...payload,
        ...(impactAnalysis.value?.requiresApproval ? { forceUpdate: true, acknowledgeImpact: true } : {})
      }
      response = await api.put(`/config/business-rules/${editingRule.value.id}`, finalPayload)
      
      // Check if API returned requiresApproval response
      if (response.data.requiresApproval && !finalPayload.forceUpdate) {
        // Show impact and ask for confirmation
        impactAnalysis.value = response.data.impactAnalysis
        showImpactWarning.value = true
        saving.value = false
        showError('Please review the impact analysis and confirm the change')
        return
      }
    } else {
      response = await api.post('/config/business-rules', payload)
    }
    
    const message = response.data.requiresApproval
      ? 'Rule saved and pending Super Admin approval'
      : 'Rule saved successfully'
    
    showSuccess(message)
    closeModal()
    await loadRules()
  } catch (error: any) {
    // Handle impact analysis response
    if (error.response?.data?.requiresApproval && error.response?.data?.impactAnalysis) {
      impactAnalysis.value = error.response.data.impactAnalysis
      showImpactWarning.value = true
      showError('Please review the impact analysis and confirm the change')
    } else {
      showError(error.response?.data?.error || 'Failed to save rule')
    }
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

async function editRule(rule: any) {
  editingRule.value = rule
  ruleForm.value = {
    rule_name: rule.rule_name,
    rule_type: rule.rule_type,
    condition_field: rule.condition_field || '',
    condition_operator: rule.condition_operator || '',
    condition_value: rule.condition_value || '',
    action_type: rule.action_type,
    action_value: rule.action_value || '',
    is_active: rule.is_active === 1 || rule.is_active === true,
    rule_category: rule.rule_category || 'Custom',
    regulation_reference: rule.regulation_reference || '',
    applies_to_pie: rule.applies_to_pie === 1 || rule.applies_to_pie === true,
    tax_sub_type: rule.tax_sub_type || '',
    confidence_level: rule.confidence_level || 'MEDIUM',
    can_override: rule.can_override !== undefined ? (rule.can_override === 1 || rule.can_override === true) : true,
    guidance_text: rule.guidance_text || '',
    override_guidance: rule.override_guidance || ''
  }
  
  // Load condition_groups if present
  if (rule.condition_groups) {
    try {
      const groups = typeof rule.condition_groups === 'string' 
        ? JSON.parse(rule.condition_groups) 
        : rule.condition_groups
      conditionGroups.value = groups
      useAdvancedConditions.value = true
    } catch (e) {
      console.error('Error parsing condition_groups:', e)
      useAdvancedConditions.value = false
    }
  } else {
    useAdvancedConditions.value = false
    // Reset condition groups to default
    conditionGroups.value = [
      { operator: 'AND', conditions: [{ field: '', conditionOperator: '', value: '', operator: 'AND' }] }
    ]
  }
  
  showCreateModal.value = true
  
  // Check impact when editing (will be updated as user makes changes)
  await checkImpact()
}

async function checkImpact() {
  if (!editingRule.value) {
    impactAnalysis.value = null
    return
  }
  
  // Debounce impact checking to avoid too many API calls
  if (impactCheckTimeout) {
    clearTimeout(impactCheckTimeout)
  }
  
  impactCheckTimeout = setTimeout(async () => {
    checkingImpact.value = true
    try {
      console.log('Checking impact for rule:', editingRule.value.id, 'with changes:', ruleForm.value)
      const response = await api.post(`/config/business-rules/${editingRule.value.id}/impact`, ruleForm.value)
      console.log('Impact analysis response:', response.data)
      if (response.data && response.data.impactAnalysis) {
        impactAnalysis.value = response.data.impactAnalysis
        showImpactWarning.value = response.data.requiresApproval || false
        console.log('Impact analysis set:', impactAnalysis.value)
      } else {
        console.warn('No impact analysis in response:', response.data)
        // Show a default low-risk analysis
        impactAnalysis.value = {
          riskLevel: 'low',
          affectedRequests: { currentlyMatching: 0 },
          warnings: []
        }
      }
    } catch (error: any) {
      // Impact analysis failed, log error but continue
      console.error('Impact analysis check failed:', error.response?.data || error.message)
      console.error('Error details:', error)
      // Show a default analysis instead of hiding
      if (!impactAnalysis.value) {
        impactAnalysis.value = {
          riskLevel: 'low',
          affectedRequests: { currentlyMatching: 0 },
          warnings: ['Impact analysis unavailable - check console for details'],
          error: error.response?.data?.error || error.message
        }
      }
      showImpactWarning.value = false
    } finally {
      checkingImpact.value = false
    }
  }, 500) // Wait 500ms after user stops typing
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
  impactAnalysis.value = null
  showImpactWarning.value = false
  useAdvancedConditions.value = false
  ruleValidation.value = null
  testResults.value = null
  selectedTemplate.value = ''
  conditionGroups.value = [
    { operator: 'AND', conditions: [{ field: '', conditionOperator: '', value: '', operator: 'AND' }] }
  ]
  ruleForm.value = {
    rule_name: '',
    rule_type: '',
    condition_field: '',
    condition_operator: '',
    condition_value: '',
    action_type: '',
    action_value: '',
    is_active: true,
    rule_category: 'Custom',
    regulation_reference: '',
    applies_to_pie: false,
    tax_sub_type: '',
    confidence_level: 'MEDIUM',
    can_override: true,
    guidance_text: '',
    override_guidance: ''
  }
}

// Pro Version: Load IESBA template
function loadTemplate() {
  if (!selectedTemplate.value) return
  
  // Open modal if not already open
  if (!showCreateModal.value && !editingRule.value) {
    showCreateModal.value = true
  }
  
  const templates: Record<string, any> = {
    red_line_management: {
      rule_name: 'Red Line: Management Responsibility',
      rule_type: 'conflict',
      rule_category: 'Red Line',
      condition_field: 'service_description',
      condition_operator: 'contains',
      condition_value: 'management responsibility,financial statements preparation',
      action_type: 'recommend_reject',
      action_value: 'CRITICAL: Management responsibility violates auditor independence per IESBA Code Section 290.104',
      regulation_reference: 'IESBA Code Section 290.104',
      applies_to_pie: false,
      confidence_level: 'HIGH',
      can_override: false,
      is_active: true
    },
    red_line_advocacy: {
      rule_name: 'Red Line: Advocacy',
      rule_type: 'conflict',
      rule_category: 'Red Line',
      condition_field: 'service_description',
      condition_operator: 'contains',
      condition_value: 'advocate,litigation support,court representation',
      action_type: 'recommend_reject',
      action_value: 'CRITICAL: Acting as advocate violates auditor independence',
      regulation_reference: 'IESBA Code Section 290',
      applies_to_pie: false,
      confidence_level: 'HIGH',
      can_override: false,
      is_active: true
    },
    red_line_contingent_fees: {
      rule_name: 'Red Line: Contingent Fees',
      rule_type: 'conflict',
      rule_category: 'Red Line',
      condition_field: 'service_description',
      condition_operator: 'contains',
      condition_value: 'contingent fee,success fee,performance based',
      action_type: 'recommend_reject',
      action_value: 'CRITICAL: Contingent fees violate auditor independence',
      regulation_reference: 'IESBA Code Section 290',
      applies_to_pie: false,
      confidence_level: 'HIGH',
      can_override: false,
      is_active: true
    },
    pie_tax_planning: {
      rule_name: 'PIE: Tax Planning Prohibited',
      rule_type: 'conflict',
      rule_category: 'PIE',
      condition_field: 'pie_status',
      condition_operator: 'equals',
      condition_value: 'Yes',
      action_type: 'recommend_reject',
      action_value: 'HIGH: Tax Planning for PIE audit client is prohibited',
      regulation_reference: 'IESBA Code Section 290',
      applies_to_pie: true,
      tax_sub_type: 'TAX_PLANNING',
      confidence_level: 'HIGH',
      can_override: false,
      is_active: true
    },
    pie_tax_compliance: {
      rule_name: 'PIE: Tax Compliance Requires Safeguards',
      rule_type: 'conflict',
      rule_category: 'PIE',
      condition_field: 'pie_status',
      condition_operator: 'equals',
      condition_value: 'Yes',
      action_type: 'recommend_review',
      action_value: 'MEDIUM: Tax Compliance for PIE requires safeguards and fee cap review',
      regulation_reference: 'IESBA Code Section 290',
      applies_to_pie: true,
      tax_sub_type: 'TAX_COMPLIANCE',
      confidence_level: 'MEDIUM',
      can_override: true,
      is_active: true
    },
    pie_advisory: {
      rule_name: 'PIE: Advisory Services Prohibited',
      rule_type: 'conflict',
      rule_category: 'PIE',
      condition_field: 'pie_status',
      condition_operator: 'equals',
      condition_value: 'Yes',
      action_type: 'recommend_reject',
      action_value: 'HIGH: Advisory services for PIE audit client are prohibited',
      regulation_reference: 'IESBA Code Section 290',
      applies_to_pie: true,
      confidence_level: 'HIGH',
      can_override: false,
      is_active: true
    },
    audit_tax_planning_pie: {
      rule_name: 'Audit + Tax Planning (PIE) - Prohibited',
      rule_type: 'conflict',
      rule_category: 'Tax',
      condition_field: 'service_type',
      condition_operator: 'contains',
      condition_value: 'Tax Planning,Tax Strategy',
      action_type: 'recommend_reject',
      action_value: 'HIGH: Tax Planning for PIE audit client is prohibited - cannot override',
      regulation_reference: 'IESBA Code Section 290',
      applies_to_pie: true,
      tax_sub_type: 'TAX_PLANNING',
      confidence_level: 'HIGH',
      can_override: false,
      is_active: true
    },
    audit_tax_planning_nonpie: {
      rule_name: 'Audit + Tax Planning (Non-PIE) - Requires Safeguards',
      rule_type: 'conflict',
      rule_category: 'Tax',
      condition_field: 'service_type',
      condition_operator: 'contains',
      condition_value: 'Tax Planning,Tax Strategy',
      action_type: 'recommend_review',
      action_value: 'MEDIUM: Tax Planning for non-PIE audit client requires safeguards',
      regulation_reference: 'IESBA Code Section 290',
      applies_to_pie: false,
      tax_sub_type: 'TAX_PLANNING',
      confidence_level: 'MEDIUM',
      can_override: true,
      is_active: true
    },
    audit_tax_compliance: {
      rule_name: 'Audit + Tax Compliance - Likely Approved',
      rule_type: 'conflict',
      rule_category: 'Tax',
      condition_field: 'service_type',
      condition_operator: 'contains',
      condition_value: 'Tax Compliance,Tax Return',
      action_type: 'recommend_flag',
      action_value: 'LOW: Tax Compliance usually approved with safeguards',
      regulation_reference: 'IESBA Code Section 290',
      applies_to_pie: false,
      tax_sub_type: 'TAX_COMPLIANCE',
      confidence_level: 'LOW',
      can_override: true,
      is_active: true
    }
  }
  
  const template = templates[selectedTemplate.value]
  if (template) {
    // Open modal if not already open
    if (!showCreateModal.value && !editingRule.value) {
      showCreateModal.value = true
      // Wait for modal to render before populating
      setTimeout(() => {
        populateTemplate(template)
      }, 100)
    } else {
      populateTemplate(template)
    }
  } else {
    showError('Template not found. Please try again.')
    selectedTemplate.value = ''
  }
}

function populateTemplate(template: any) {
  // Ensure we're using simple mode (not advanced) for templates
  useAdvancedConditions.value = false
  
  // Clear existing form and populate with template
  ruleForm.value = {
    rule_name: template.rule_name || '',
    rule_type: template.rule_type || '',
    condition_field: template.condition_field || '',
    condition_operator: template.condition_operator || '',
    condition_value: template.condition_value || '',
    action_type: template.action_type || '',
    action_value: template.action_value || '',
    is_active: template.is_active !== undefined ? template.is_active : true,
    rule_category: template.rule_category || 'Custom',
    regulation_reference: template.regulation_reference || '',
    applies_to_pie: template.applies_to_pie || false,
    tax_sub_type: template.tax_sub_type || '',
    confidence_level: template.confidence_level || 'MEDIUM',
    can_override: template.can_override !== undefined ? template.can_override : true,
    guidance_text: template.guidance_text || '',
    override_guidance: template.override_guidance || ''
  }
  
  // Reset template selector to allow selecting another template
  const templateName = selectedTemplate.value
  setTimeout(() => {
    selectedTemplate.value = ''
  }, 200)
  
  const displayName = templateName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
  showSuccess(`✅ Template "${displayName}" loaded successfully! Review and customize as needed.`)
  
  // Scroll to top of form to show the loaded fields
  setTimeout(() => {
    if (modalContent.value) {
      modalContent.value.scrollTop = 0
    }
  }, 150)
}

// Validate rule in real-time
async function validateRuleDebounced() {
  // Clear previous timeout
  if (validationTimeout) {
    clearTimeout(validationTimeout)
  }
  
  // Debounce validation
  validationTimeout = setTimeout(async () => {
    await validateRuleNow()
  }, 500)
}

async function validateRuleNow() {
  // Only validate if we have minimum required fields
  if (!ruleForm.value.rule_name && !ruleForm.value.rule_type && !ruleForm.value.action_type) {
    ruleValidation.value = null
    return
  }
  
  validatingRule.value = true
  try {
    const payload: any = { ...ruleForm.value }
    
    if (useAdvancedConditions.value) {
      payload.condition_groups = JSON.stringify(conditionGroups.value)
    }
    
    if (editingRule.value) {
      payload.id = editingRule.value.id
    }
    
    const response = await api.post('/config/validate-rule', payload)
    ruleValidation.value = response.data
  } catch (error: any) {
    console.error('Validation error:', error)
    // Don't show error for validation failures
  } finally {
    validatingRule.value = false
  }
}

// Handler for form changes - validates and checks impact
function onFormChange() {
  validateRuleDebounced()
  checkImpact()
}

// Test rule against recent requests
async function testRuleNow() {
  if (!ruleForm.value.rule_name) return
  
  testingRule.value = true
  testResults.value = null
  
  try {
    const payload: any = { ...ruleForm.value }
    
    if (useAdvancedConditions.value) {
      payload.condition_groups = JSON.stringify(conditionGroups.value)
    }
    
    const response = await api.post('/config/test-rule?limit=20', payload)
    testResults.value = response.data.results
  } catch (error: any) {
    console.error('Error testing rule:', error)
    showError('Failed to test rule')
  } finally {
    testingRule.value = false
  }
}

// Load available fields for rule building
async function loadRuleFields() {
  loadingFields.value = true
  try {
    const response = await api.get('/config/rule-fields')
    ruleFields.value = response.data.categories || {}
    fieldOperators.value = response.data.operators || {}
    allFields.value = response.data.allFields || []
    console.log('Loaded rule fields:', Object.keys(ruleFields.value).length, 'categories')
  } catch (error: any) {
    console.error('Error loading rule fields:', error)
    // Fallback to hardcoded fields if API fails
    allFields.value = [
      { id: 'service_type', label: 'Service Type', type: 'select', options: ['Statutory Audit', 'External Audit', 'Tax Compliance', 'Tax Advisory', 'Management Consulting', 'Business Advisory', 'Internal Audit'] },
      { id: 'client_type', label: 'Client Type', type: 'select', options: ['Existing', 'New', 'Potential'] },
      { id: 'pie_status', label: 'PIE Status', type: 'select', options: ['Yes', 'No'] },
      { id: 'client_location', label: 'Client Location', type: 'select', options: ['State of Kuwait', 'GCC', 'International'] },
      { id: 'relationship_with_client', label: 'Relationship', type: 'select', options: ['Direct', 'Referral', 'Group Company'] },
      { id: 'international_operations', label: 'International Operations', type: 'select', options: ['Yes', 'No'] }
    ]
  } finally {
    loadingFields.value = false
  }
}

// Get operators for a specific field type
function getOperatorsForField(fieldId: string): FieldOperator[] {
  const field = allFields.value.find(f => f.id === fieldId)
  if (!field) return []
  
  const fieldType = field.type || 'text'
  return fieldOperators.value[fieldType] || [
    { id: 'equals', label: 'Equals' },
    { id: 'not_equals', label: 'Not Equals' },
    { id: 'contains', label: 'Contains' }
  ]
}

// Get field options for selected field
function getFieldOptions(fieldId: string): string[] {
  const field = allFields.value.find(f => f.id === fieldId)
  return field?.options || []
}

// Check if field has predefined options
function fieldHasOptions(fieldId: string): boolean {
  const field = allFields.value.find(f => f.id === fieldId)
  return !!(field?.options && field.options.length > 0)
}

onMounted(() => {
  loadRules()
  loadRuleFields()
})
</script>

