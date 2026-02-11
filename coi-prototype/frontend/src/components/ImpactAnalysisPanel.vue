<template>
  <div class="impact-analysis-panel bg-white rounded-lg shadow-sm border border-gray-200">
    <div class="px-4 py-3 border-b border-gray-200 bg-gray-50">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-900">Impact Analysis</h3>
        <button
          @click="refreshAnalysis"
          :disabled="loading"
          class="px-2 py-1 text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="p-4">
      <div v-if="loading" class="flex items-center justify-center py-8">
        <svg class="animate-spin h-5 w-5 text-primary-600 mr-2" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm text-gray-500">Analyzing impact...</span>
      </div>

      <div v-else-if="impact" class="space-y-4">
        <!-- Risk Level Badge -->
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-gray-500">Risk Level</span>
          <span 
            class="px-2.5 py-1 text-xs font-medium rounded-full"
            :class="getRiskClass(impact.riskLevel)"
          >
            {{ impact.riskLevel.toUpperCase() }}
          </span>
        </div>

        <!-- Affected Requests -->
        <div v-if="impact.affectedRequests && impact.affectedRequests.length > 0">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-gray-500">Affected Requests</span>
            <span class="text-xs font-semibold text-red-600">{{ impact.affectedRequests.length }}</span>
          </div>
          <div class="bg-red-50 border border-red-200 rounded p-2 max-h-32 overflow-y-auto">
            <div v-for="req in impact.affectedRequests.slice(0, 5)" :key="req.id" class="text-xs text-red-700 mb-1">
              {{ req.request_id }} - {{ req.status }}
            </div>
            <div v-if="impact.affectedRequests.length > 5" class="text-xs text-red-600 mt-1">
              + {{ impact.affectedRequests.length - 5 }} more...
            </div>
          </div>
        </div>

        <!-- Affected Workflows -->
        <div v-if="impact.affectedWorkflows && impact.affectedWorkflows.length > 0">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-gray-500">Workflows</span>
            <span class="text-xs font-semibold text-orange-600">{{ impact.affectedWorkflows.length }}</span>
          </div>
          <div class="bg-orange-50 border border-orange-200 rounded p-2">
            <div v-for="wf in impact.affectedWorkflows" :key="wf.workflow_name" class="text-xs text-orange-700">
              {{ wf.workflow_name }} - {{ wf.step_name }}
            </div>
          </div>
        </div>

        <!-- Affected Rules -->
        <div v-if="impact.affectedRules && impact.affectedRules.length > 0">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-gray-500">Business Rules</span>
            <span class="text-xs font-semibold text-purple-600">{{ impact.affectedRules.length }}</span>
          </div>
          <div class="bg-purple-50 border border-purple-200 rounded p-2">
            <div v-for="rule in impact.affectedRules" :key="rule.id" class="text-xs text-purple-700">
              {{ rule.rule_name }} ({{ rule.rule_type }})
            </div>
          </div>
        </div>

        <!-- Dependencies -->
        <div v-if="impact.dependencies && impact.dependencies.length > 0">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-gray-500">Field Dependencies</span>
            <span class="text-xs font-semibold text-primary-600">{{ impact.dependencies.length }}</span>
          </div>
          <div class="bg-blue-50 border border-blue-200 rounded p-2">
            <div v-for="dep in impact.dependencies" :key="dep.field_id" class="text-xs text-blue-700">
              {{ dep.field_label }} ({{ dep.dependency_type }})
            </div>
          </div>
        </div>

        <!-- Warnings -->
        <div v-if="impact.warnings && impact.warnings.length > 0" class="space-y-1">
          <div class="text-xs font-medium text-yellow-700 mb-2">Warnings</div>
          <div v-for="(warning, idx) in impact.warnings" :key="idx" class="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded p-2">
            Warning: {{ warning }}
          </div>
        </div>

        <!-- Errors -->
        <div v-if="impact.errors && impact.errors.length > 0" class="space-y-1">
          <div class="text-xs font-medium text-red-700 mb-2">Errors</div>
          <div v-for="(error, idx) in impact.errors" :key="idx" class="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
            Error: {{ error }}
          </div>
        </div>

        <!-- Approval Required -->
        <div v-if="impact.requiresApproval" class="bg-yellow-50 border border-yellow-200 rounded p-3">
          <div class="flex items-start">
            <svg class="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <div>
              <p class="text-sm font-medium text-yellow-800">Approval Required</p>
              <p class="text-xs text-yellow-700 mt-1">This change requires Super Admin approval before it can be applied.</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8 text-gray-400 text-sm">
        No impact analysis available. Select a field to analyze.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import api from '@/services/api'

const props = defineProps<{
  fieldId: string | null
  changeType?: string
}>()

const impact = ref<any>(null)
const loading = ref(false)

function getRiskClass(riskLevel: string) {
  const classes: Record<string, string> = {
    'low': 'bg-green-100 text-green-700',
    'medium': 'bg-yellow-100 text-yellow-700',
    'high': 'bg-orange-100 text-orange-700',
    'critical': 'bg-red-100 text-red-700'
  }
  return classes[riskLevel] || 'bg-gray-100 text-gray-700'
}

async function loadImpactAnalysis() {
  if (!props.fieldId) {
    impact.value = null
    return
  }

  loading.value = true
  try {
    const response = await api.get(`/change-management/fields/${props.fieldId}/impact`, {
      params: { changeType: props.changeType || 'analysis' }
    })
    impact.value = response.data.impact?.impact || response.data.impact
  } catch (error) {
    console.error('Failed to load impact analysis:', error)
    impact.value = null
  } finally {
    loading.value = false
  }
}

async function refreshAnalysis() {
  await loadImpactAnalysis()
}

watch(() => props.fieldId, loadImpactAnalysis, { immediate: true })
watch(() => props.changeType, loadImpactAnalysis)
</script>
