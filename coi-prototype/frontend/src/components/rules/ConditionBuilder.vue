<template>
  <div class="condition-builder space-y-4">
    <!-- Condition Groups -->
    <div 
      v-for="(group, groupIndex) in conditionGroups" 
      :key="groupIndex"
      class="condition-group border border-gray-200 rounded-lg p-4"
      :class="{ 'bg-blue-50 border-blue-200': groupIndex === 0, 'bg-gray-50': groupIndex > 0 }"
    >
      <!-- Group Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-gray-700">
            {{ groupIndex === 0 ? 'IF' : group.operator.toUpperCase() }}
          </span>
          <span class="text-xs text-gray-500">
            Group {{ groupIndex + 1 }} ({{ group.conditions.length }} condition{{ group.conditions.length !== 1 ? 's' : '' }})
          </span>
        </div>
        <div class="flex items-center gap-2">
          <!-- Group operator toggle (AND/OR) for groups after first -->
          <template v-if="groupIndex > 0">
            <button
              type="button"
              @click="toggleGroupOperator(groupIndex)"
              class="px-2 py-1 text-xs font-medium rounded transition-colors"
              :class="group.operator === 'AND' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'"
            >
              {{ group.operator }}
            </button>
          </template>
          <!-- Remove group button -->
          <button
            v-if="conditionGroups.length > 1"
            type="button"
            @click="removeGroup(groupIndex)"
            class="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Remove group"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Conditions within group -->
      <div class="space-y-3">
        <div 
          v-for="(condition, condIndex) in group.conditions" 
          :key="condIndex"
          class="condition-row flex items-start gap-3"
        >
          <!-- Condition operator (AND/OR within group) -->
          <div v-if="condIndex > 0" class="flex-shrink-0 w-16 pt-2">
            <button
              type="button"
              @click="toggleConditionOperator(groupIndex, condIndex)"
              class="px-2 py-1 text-xs font-medium rounded w-full transition-colors"
              :class="condition.operator === 'AND' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'"
            >
              {{ condition.operator || 'AND' }}
            </button>
          </div>
          <div v-else class="flex-shrink-0 w-16"></div>

          <!-- Field selector -->
          <div class="flex-1">
            <select
              v-model="condition.field"
              @change="onFieldChange(groupIndex, condIndex)"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select field...</option>
              <template v-if="fieldCategories && Object.keys(fieldCategories).length > 0">
                <optgroup v-for="(category, catKey) in fieldCategories" :key="catKey" :label="category.label">
                  <option v-for="field in category.fields" :key="field.id" :value="field.id">
                    {{ field.label }}
                  </option>
                </optgroup>
              </template>
              <template v-else>
                <option v-for="field in allFields" :key="field.id" :value="field.id">
                  {{ field.label }}
                </option>
              </template>
            </select>
          </div>

          <!-- Operator selector -->
          <div class="flex-1">
            <select
              v-model="condition.conditionOperator"
              :disabled="!condition.field"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Operator...</option>
              <option v-for="op in getOperatorsForField(condition.field)" :key="op.id" :value="op.id">
                {{ op.label }}
              </option>
            </select>
          </div>

          <!-- Value input -->
          <div class="flex-1">
            <select
              v-if="fieldHasOptions(condition.field)"
              v-model="condition.value"
              :disabled="!condition.conditionOperator"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select value...</option>
              <option v-for="opt in getFieldOptions(condition.field)" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
            <input
              v-else
              v-model="condition.value"
              type="text"
              :disabled="!condition.conditionOperator"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="Enter value..."
            />
          </div>

          <!-- Remove condition button -->
          <button
            v-if="group.conditions.length > 1 || conditionGroups.length > 1"
            type="button"
            @click="removeCondition(groupIndex, condIndex)"
            class="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Remove condition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>

        <!-- Add condition button -->
        <button
          type="button"
          @click="addCondition(groupIndex)"
          class="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add condition to this group
        </button>
      </div>
    </div>

    <!-- Add new group button -->
    <button
      type="button"
      @click="addGroup"
      class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg transition-colors w-full justify-center"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
      </svg>
      Add condition group (OR)
    </button>

    <!-- Summary of conditions -->
    <div v-if="hasConditions" class="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div class="text-xs font-medium text-gray-500 mb-2">Rule Summary:</div>
      <div class="text-sm text-gray-700 font-mono">
        {{ conditionSummary }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface RuleField {
  id: string
  label: string
  type: string
  options?: string[]
}

interface FieldCategory {
  label: string
  fields: RuleField[]
}

interface FieldOperator {
  id: string
  label: string
}

interface Condition {
  field: string
  conditionOperator: string
  value: string
  operator?: 'AND' | 'OR'
}

interface ConditionGroup {
  operator: 'AND' | 'OR'
  conditions: Condition[]
}

const props = defineProps<{
  modelValue?: ConditionGroup[]
  fieldCategories?: Record<string, FieldCategory>
  operators?: Record<string, FieldOperator[]>
  allFields?: RuleField[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ConditionGroup[]]
}>()

// Initialize with default empty group
const conditionGroups = ref<ConditionGroup[]>([
  {
    operator: 'AND',
    conditions: [{ field: '', conditionOperator: '', value: '', operator: 'AND' }]
  }
])

// Watch for external model changes
watch(() => props.modelValue, (newVal) => {
  if (newVal && newVal.length > 0) {
    conditionGroups.value = JSON.parse(JSON.stringify(newVal))
  }
}, { immediate: true, deep: true })

// Emit changes
watch(conditionGroups, (newVal) => {
  emit('update:modelValue', JSON.parse(JSON.stringify(newVal)))
}, { deep: true })

// Computed
const hasConditions = computed(() => {
  return conditionGroups.value.some(g => 
    g.conditions.some(c => c.field && c.conditionOperator && c.value)
  )
})

const conditionSummary = computed(() => {
  const parts: string[] = []
  
  conditionGroups.value.forEach((group, gIdx) => {
    const groupParts: string[] = []
    
    group.conditions.forEach((cond, cIdx) => {
      if (cond.field && cond.conditionOperator && cond.value) {
        const fieldLabel = getFieldLabel(cond.field)
        const opLabel = getOperatorSymbol(cond.conditionOperator)
        const prefix = cIdx > 0 ? ` ${cond.operator || 'AND'} ` : ''
        groupParts.push(`${prefix}${fieldLabel} ${opLabel} "${cond.value}"`)
      }
    })
    
    if (groupParts.length > 0) {
      const prefix = gIdx > 0 ? ` ${group.operator} ` : 'IF '
      parts.push(`${prefix}(${groupParts.join('')})`)
    }
  })
  
  return parts.join('') || 'No conditions defined'
})

// Helper functions
function getFieldLabel(fieldId: string): string {
  const allFieldsList = props.allFields || []
  const field = allFieldsList.find(f => f.id === fieldId)
  return field?.label || fieldId
}

function getOperatorSymbol(op: string): string {
  const symbols: Record<string, string> = {
    'equals': '=',
    'not_equals': '≠',
    'contains': 'contains',
    'not_contains': 'not contains',
    'starts_with': 'starts with',
    'ends_with': 'ends with',
    'greater_than': '>',
    'less_than': '<',
    'greater_than_or_equal': '≥',
    'less_than_or_equal': '≤',
    'in': 'in',
    'not_in': 'not in',
    'is_true': 'is true',
    'is_false': 'is false',
    'is_empty': 'is empty',
    'is_not_empty': 'is not empty'
  }
  return symbols[op] || op
}

function getOperatorsForField(fieldId: string): FieldOperator[] {
  const allFieldsList = props.allFields || []
  const field = allFieldsList.find(f => f.id === fieldId)
  if (!field) return []
  
  const fieldType = field.type || 'text'
  const operators = props.operators || {}
  return operators[fieldType] || [
    { id: 'equals', label: 'Equals' },
    { id: 'not_equals', label: 'Not Equals' },
    { id: 'contains', label: 'Contains' }
  ]
}

function getFieldOptions(fieldId: string): string[] {
  const allFieldsList = props.allFields || []
  const field = allFieldsList.find(f => f.id === fieldId)
  return field?.options || []
}

function fieldHasOptions(fieldId: string): boolean {
  const allFieldsList = props.allFields || []
  const field = allFieldsList.find(f => f.id === fieldId)
  return !!(field?.options && field.options.length > 0)
}

// Actions
function addCondition(groupIndex: number) {
  conditionGroups.value[groupIndex].conditions.push({
    field: '',
    conditionOperator: '',
    value: '',
    operator: 'AND'
  })
}

function removeCondition(groupIndex: number, condIndex: number) {
  conditionGroups.value[groupIndex].conditions.splice(condIndex, 1)
  
  // Remove empty groups (except the first one)
  if (conditionGroups.value[groupIndex].conditions.length === 0) {
    if (conditionGroups.value.length > 1) {
      conditionGroups.value.splice(groupIndex, 1)
    } else {
      // Keep at least one condition in the first group
      conditionGroups.value[0].conditions.push({
        field: '',
        conditionOperator: '',
        value: '',
        operator: 'AND'
      })
    }
  }
}

function addGroup() {
  conditionGroups.value.push({
    operator: 'OR',
    conditions: [{ field: '', conditionOperator: '', value: '', operator: 'AND' }]
  })
}

function removeGroup(groupIndex: number) {
  if (conditionGroups.value.length > 1) {
    conditionGroups.value.splice(groupIndex, 1)
  }
}

function toggleGroupOperator(groupIndex: number) {
  const group = conditionGroups.value[groupIndex]
  group.operator = group.operator === 'AND' ? 'OR' : 'AND'
}

function toggleConditionOperator(groupIndex: number, condIndex: number) {
  const condition = conditionGroups.value[groupIndex].conditions[condIndex]
  condition.operator = condition.operator === 'AND' ? 'OR' : 'AND'
}

function onFieldChange(groupIndex: number, condIndex: number) {
  // Reset operator and value when field changes
  const condition = conditionGroups.value[groupIndex].conditions[condIndex]
  condition.conditionOperator = ''
  condition.value = ''
}

// Export for parent component
defineExpose({
  getConditionGroups: () => conditionGroups.value,
  setConditionGroups: (groups: ConditionGroup[]) => {
    conditionGroups.value = groups
  },
  hasValidConditions: () => hasConditions.value
})
</script>

<style scoped>
.condition-builder {
  max-height: 400px;
  overflow-y: auto;
}

.condition-group {
  transition: all 0.2s ease;
}

.condition-row {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

