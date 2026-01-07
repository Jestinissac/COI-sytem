<template>
  <div class="dependency-graph bg-white rounded-lg shadow-sm border border-gray-200">
    <div class="px-4 py-3 border-b border-gray-200 bg-gray-50">
      <h3 class="text-sm font-semibold text-gray-900">Dependency Graph</h3>
    </div>

    <div class="p-4">
      <div v-if="loading" class="flex items-center justify-center py-8">
        <svg class="animate-spin h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm text-gray-500">Loading dependencies...</span>
      </div>

      <div v-else-if="dependencies" class="space-y-4">
        <!-- Field Dependencies -->
        <div v-if="dependencies.fields && dependencies.fields.length > 0">
          <h4 class="text-xs font-medium text-gray-700 mb-2">Depends On Fields</h4>
          <div class="space-y-1">
            <div 
              v-for="field in dependencies.fields" 
              :key="field.field_id"
              class="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs"
            >
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span class="text-blue-700">{{ field.field_label || field.field_id }}</span>
              <span class="text-blue-500 ml-auto">{{ field.dependency_type }}</span>
            </div>
          </div>
        </div>

        <!-- Workflow Dependencies -->
        <div v-if="dependencies.workflows && dependencies.workflows.length > 0">
          <h4 class="text-xs font-medium text-gray-700 mb-2">Used In Workflows</h4>
          <div class="space-y-1">
            <div 
              v-for="workflow in dependencies.workflows" 
              :key="workflow.workflow_name"
              class="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs"
            >
              <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
              <span class="text-orange-700">{{ workflow.workflow_name }}</span>
              <span class="text-orange-500 ml-auto">{{ workflow.step_name }}</span>
            </div>
          </div>
        </div>

        <!-- Business Rule Dependencies -->
        <div v-if="dependencies.rules && dependencies.rules.length > 0">
          <h4 class="text-xs font-medium text-gray-700 mb-2">Referenced In Rules</h4>
          <div class="space-y-1">
            <div 
              v-for="rule in dependencies.rules" 
              :key="rule.id"
              class="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs"
            >
              <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              <span class="text-purple-700">{{ rule.rule_name }}</span>
              <span class="text-purple-500 ml-auto">{{ rule.rule_type }}</span>
            </div>
          </div>
        </div>

        <!-- Template Dependencies -->
        <div v-if="dependencies.templates && dependencies.templates.length > 0">
          <h4 class="text-xs font-medium text-gray-700 mb-2">Used In Templates</h4>
          <div class="space-y-1">
            <div 
              v-for="template in dependencies.templates" 
              :key="template.id"
              class="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs"
            >
              <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
              </svg>
              <span class="text-green-700">{{ template.template_name }}</span>
            </div>
          </div>
        </div>

        <!-- No Dependencies -->
        <div v-if="!hasDependencies" class="text-center py-8 text-gray-400 text-sm">
          No dependencies found for this field.
        </div>
      </div>

      <div v-else class="text-center py-8 text-gray-400 text-sm">
        Select a field to view dependencies.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import api from '@/services/api'

const props = defineProps<{
  fieldId: string | null
}>()

const dependencies = ref<any>(null)
const loading = ref(false)

const hasDependencies = computed(() => {
  if (!dependencies.value) return false
  return (
    (dependencies.value.fields && dependencies.value.fields.length > 0) ||
    (dependencies.value.workflows && dependencies.value.workflows.length > 0) ||
    (dependencies.value.rules && dependencies.value.rules.length > 0) ||
    (dependencies.value.templates && dependencies.value.templates.length > 0)
  )
})

async function loadDependencies() {
  if (!props.fieldId) {
    dependencies.value = null
    return
  }

  loading.value = true
  try {
    const response = await api.get(`/change-management/fields/${props.fieldId}/dependencies`)
    dependencies.value = response.data.dependencies
  } catch (error) {
    console.error('Failed to load dependencies:', error)
    dependencies.value = null
  } finally {
    loading.value = false
  }
}

watch(() => props.fieldId, loadDependencies, { immediate: true })
</script>

  <div class="dependency-graph bg-white rounded-lg shadow-sm border border-gray-200">
    <div class="px-4 py-3 border-b border-gray-200 bg-gray-50">
      <h3 class="text-sm font-semibold text-gray-900">Dependency Graph</h3>
    </div>

    <div class="p-4">
      <div v-if="loading" class="flex items-center justify-center py-8">
        <svg class="animate-spin h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm text-gray-500">Loading dependencies...</span>
      </div>

      <div v-else-if="dependencies" class="space-y-4">
        <!-- Field Dependencies -->
        <div v-if="dependencies.fields && dependencies.fields.length > 0">
          <h4 class="text-xs font-medium text-gray-700 mb-2">Depends On Fields</h4>
          <div class="space-y-1">
            <div 
              v-for="field in dependencies.fields" 
              :key="field.field_id"
              class="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs"
            >
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span class="text-blue-700">{{ field.field_label || field.field_id }}</span>
              <span class="text-blue-500 ml-auto">{{ field.dependency_type }}</span>
            </div>
          </div>
        </div>

        <!-- Workflow Dependencies -->
        <div v-if="dependencies.workflows && dependencies.workflows.length > 0">
          <h4 class="text-xs font-medium text-gray-700 mb-2">Used In Workflows</h4>
          <div class="space-y-1">
            <div 
              v-for="workflow in dependencies.workflows" 
              :key="workflow.workflow_name"
              class="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs"
            >
              <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
              <span class="text-orange-700">{{ workflow.workflow_name }}</span>
              <span class="text-orange-500 ml-auto">{{ workflow.step_name }}</span>
            </div>
          </div>
        </div>

        <!-- Business Rule Dependencies -->
        <div v-if="dependencies.rules && dependencies.rules.length > 0">
          <h4 class="text-xs font-medium text-gray-700 mb-2">Referenced In Rules</h4>
          <div class="space-y-1">
            <div 
              v-for="rule in dependencies.rules" 
              :key="rule.id"
              class="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs"
            >
              <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              <span class="text-purple-700">{{ rule.rule_name }}</span>
              <span class="text-purple-500 ml-auto">{{ rule.rule_type }}</span>
            </div>
          </div>
        </div>

        <!-- Template Dependencies -->
        <div v-if="dependencies.templates && dependencies.templates.length > 0">
          <h4 class="text-xs font-medium text-gray-700 mb-2">Used In Templates</h4>
          <div class="space-y-1">
            <div 
              v-for="template in dependencies.templates" 
              :key="template.id"
              class="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs"
            >
              <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
              </svg>
              <span class="text-green-700">{{ template.template_name }}</span>
            </div>
          </div>
        </div>

        <!-- No Dependencies -->
        <div v-if="!hasDependencies" class="text-center py-8 text-gray-400 text-sm">
          No dependencies found for this field.
        </div>
      </div>

      <div v-else class="text-center py-8 text-gray-400 text-sm">
        Select a field to view dependencies.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import api from '@/services/api'

const props = defineProps<{
  fieldId: string | null
}>()

const dependencies = ref<any>(null)
const loading = ref(false)

const hasDependencies = computed(() => {
  if (!dependencies.value) return false
  return (
    (dependencies.value.fields && dependencies.value.fields.length > 0) ||
    (dependencies.value.workflows && dependencies.value.workflows.length > 0) ||
    (dependencies.value.rules && dependencies.value.rules.length > 0) ||
    (dependencies.value.templates && dependencies.value.templates.length > 0)
  )
})

async function loadDependencies() {
  if (!props.fieldId) {
    dependencies.value = null
    return
  }

  loading.value = true
  try {
    const response = await api.get(`/change-management/fields/${props.fieldId}/dependencies`)
    dependencies.value = response.data.dependencies
  } catch (error) {
    console.error('Failed to load dependencies:', error)
    dependencies.value = null
  } finally {
    loading.value = false
  }
}

watch(() => props.fieldId, loadDependencies, { immediate: true })
</script>

