<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">Form Builder</h1>
            <p class="text-sm text-gray-500 mt-1">Configure COI request form fields</p>
          </div>
          <div class="flex items-center gap-3">
            <!-- Template Selector -->
            <select
              v-model="selectedTemplate"
              @change="loadTemplate"
              class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Load Template...</option>
              <option v-for="template in templates" :key="template.id" :value="template.id">
                {{ template.template_name }}{{ template.is_default ? ' (Default)' : '' }}
              </option>
            </select>
            
            <button
              @click="importFromExistingForm"
              class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              Import from Existing
            </button>
            
            <button
              @click="showSaveTemplateModal = true"
              class="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
              </svg>
              Save as Template
            </button>
            
            <button
              @click="saveForm"
              :disabled="saving"
              class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : 'Save Form' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-6">
      <div class="grid grid-cols-12 gap-6">
        <!-- Left: Field Types Palette -->
        <div class="col-span-3">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-3">Field Types</h3>
            <div class="space-y-2">
              <div
                v-for="type in fieldTypes"
                :key="type.value"
                class="field-type-item p-3 border border-gray-200 rounded-md cursor-move hover:bg-gray-50 transition-colors"
                draggable="true"
                @dragstart="(e) => handleDragStart(type, e as DragEvent)"
              >
                <div class="flex items-center gap-2">
                  <span class="text-lg">{{ type.icon }}</span>
                  <span class="text-sm text-gray-700">{{ type.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Center: Form Canvas -->
        <div class="col-span-6">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-900">Form Canvas</h3>
              <button
                v-if="selectedField"
                @click="showImpactAnalysis = !showImpactAnalysis"
                class="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                Impact Analysis
              </button>
            </div>
            
            <!-- Impact Analysis Panel (shown when field selected) -->
            <div v-if="showImpactAnalysis && selectedField" class="px-4 py-3 border-b border-gray-200 bg-blue-50">
              <ImpactAnalysisPanel 
                :field-id="selectedField.field_id || selectedField.id"
                :change-type="getChangeTypeForField(selectedField)"
              />
            </div>
            <div class="p-4 space-y-6" @drop="handleDrop" @dragover.prevent>
              <div v-for="section in sections" :key="section.id" class="section-container">
                <div class="section-header flex items-center justify-between mb-3">
                  <h4 class="text-sm font-medium text-gray-900">{{ section.label }}</h4>
                  <button
                    @click="addFieldToSection(section.id)"
                    class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    + Add Field
                  </button>
                </div>
                
                <div class="fields-list space-y-2">
                  <div
                    v-for="field in getFieldsForSection(section.id)"
                    :key="field.id || field.field_id"
                    class="field-item p-3 border border-gray-200 rounded-md hover:border-blue-300 cursor-pointer transition-colors"
                    :class="selectedField?.id === field.id ? 'border-blue-500 bg-blue-50' : 'bg-white'"
                    @click="editField(field)"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-xs text-gray-500">{{ getFieldTypeIcon(field.field_type) }}</span>
                          <span class="text-sm font-medium text-gray-900">{{ field.field_label || 'Unnamed Field' }}</span>
                          <span v-if="field.is_required" class="text-xs text-red-500">*</span>
                          <span v-if="isFieldFromSystem(field)" class="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                            {{ field.source_system }}
                          </span>
                        </div>
                        <div class="text-xs text-gray-500">
                          {{ field.field_type }} • {{ field.section_id }}
                        </div>
                      </div>
                      <div class="flex items-center gap-1">
                        <button
                          @click.stop="moveFieldUp(field)"
                          class="p-1 text-gray-400 hover:text-gray-600"
                          :disabled="!canMoveUp(field)"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                          </svg>
                        </button>
                        <button
                          @click.stop="moveFieldDown(field)"
                          class="p-1 text-gray-400 hover:text-gray-600"
                          :disabled="!canMoveDown(field)"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                          </svg>
                        </button>
                        <button
                          @click.stop="deleteField(field.id || field.field_id)"
                          class="p-1 text-red-400 hover:text-red-600"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="getFieldsForSection(section.id).length === 0"
                    class="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-md"
                  >
                    Drag fields here or click "Add Field"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Field Properties Editor -->
        <div class="col-span-3">
          <div v-if="selectedField" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-6">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Field Properties</h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Field Label</label>
                <input
                  v-model="selectedField.field_label"
                  type="text"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Field Type</label>
                <select
                  v-model="selectedField.field_type"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                >
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="select">Dropdown</option>
                  <option value="date">Date</option>
                  <option value="number">Number</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Section</label>
                <select
                  v-model="selectedField.section_id"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                >
                  <option v-for="section in sections" :key="section.id" :value="section.id">
                    {{ section.label }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Placeholder</label>
                <input
                  v-model="selectedField.field_placeholder"
                  type="text"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :id="`required-${selectedField.id}`"
                  v-model="selectedField.is_required"
                  class="h-4 w-4 text-blue-600"
                />
                <label :for="`required-${selectedField.id}`" class="text-xs text-gray-700">Required</label>
              </div>

              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :id="`readonly-${selectedField.id}`"
                  v-model="selectedField.is_readonly"
                  class="h-4 w-4 text-blue-600"
                />
                <label :for="`readonly-${selectedField.id}`" class="text-xs text-gray-700">Readonly</label>
              </div>

              <div v-if="selectedField.field_type === 'select'">
                <label class="block text-xs font-medium text-gray-700 mb-1">Options (one per line)</label>
                <textarea
                  v-model="optionsText"
                  rows="4"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Data Source</label>
                <select
                  v-model="selectedField.source_system"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                >
                  <option value="manual">Manual Entry</option>
                  <option value="HRMS">HRMS</option>
                  <option value="PRMS">PRMS</option>
                  <option value="COI">COI System</option>
                </select>
              </div>

              <div v-if="selectedField.source_system !== 'manual'">
                <label class="block text-xs font-medium text-gray-700 mb-1">Source Field</label>
                <input
                  v-model="selectedField.source_field"
                  type="text"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  :placeholder="getSourceFieldPlaceholder(selectedField.source_system)"
                />
                <small class="text-xs text-gray-500 mt-1 block">
                  e.g., user.name, client.client_name
                </small>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Conditional Display</label>
                <div class="space-y-2">
                  <select
                    v-model="conditionField"
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">No condition</option>
                    <option v-for="f in allFields" :key="f.field_id" :value="f.field_id">
                      {{ f.field_label }}
                    </option>
                  </select>
                  <select
                    v-if="conditionField"
                    v-model="conditionOperator"
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="equals">Equals</option>
                    <option value="not_equals">Not Equals</option>
                    <option value="contains">Contains</option>
                  </select>
                  <input
                    v-if="conditionField"
                    v-model="conditionValue"
                    type="text"
                    placeholder="Value"
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                @click="saveFieldProperties"
                class="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
              >
                Save Properties
              </button>
            </div>
          </div>
          <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center text-gray-500 text-sm">
            Select a field to edit properties
          </div>
        </div>
      </div>
    </div>

    <!-- Save Template Modal -->
    <div v-if="showSaveTemplateModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div class="px-4 py-3 border-b border-gray-200">
          <h3 class="font-medium text-gray-900">Save Form as Template</h3>
        </div>
        <div class="p-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Template Name <span class="text-red-500">*</span></label>
            <input
              v-model="templateName"
              type="text"
              placeholder="e.g., Standard COI Form, Audit Request Form"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Description (optional)</label>
            <textarea
              v-model="templateDescription"
              rows="2"
              placeholder="Describe this template..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            ></textarea>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="setAsDefault"
              v-model="setAsDefault"
              class="h-4 w-4 text-purple-600"
            />
            <label for="setAsDefault" class="text-sm text-gray-700">Set as default template</label>
          </div>
          <div class="flex gap-2 mt-4">
            <button
              @click="saveTemplate"
              :disabled="!templateName.trim() || savingTemplate"
              class="flex-1 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {{ savingTemplate ? 'Saving...' : 'Save Template' }}
            </button>
            <button
              @click="showSaveTemplateModal = false"
              class="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
            >
              Cancel
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

const { success, error: showError } = useToast()

const sections = [
  { id: 'section-1', label: 'Requestor Information' },
  { id: 'section-2', label: 'Document Type' },
  { id: 'section-3', label: 'Client Details' },
  { id: 'section-4', label: 'Service Information' },
  { id: 'section-5', label: 'Ownership & Structure' },
  { id: 'section-6', label: 'Signatories' },
  { id: 'section-7', label: 'International Operations' }
]

const fieldTypes = [
  { value: 'text', label: 'Text Input', icon: '📝' },
  { value: 'textarea', label: 'Textarea', icon: '📄' },
  { value: 'select', label: 'Dropdown', icon: '📋' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'number', label: 'Number', icon: '🔢' }
]

const fields = ref<any[]>([])
const selectedField = ref<any>(null)
const saving = ref(false)
const conditionField = ref('')
const conditionOperator = ref('equals')
const conditionValue = ref('')
const optionsText = ref('')
const templates = ref<any[]>([])
const selectedTemplate = ref('')
const showSaveTemplateModal = ref(false)
const templateName = ref('')
const templateDescription = ref('')
const setAsDefault = ref(false)
const savingTemplate = ref(false)
const showImpactAnalysis = ref(false)

const allFields = computed(() => fields.value)

function getFieldsForSection(sectionId: string) {
  const sectionFields = fields.value
    .filter(f => f.section_id === sectionId)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  
  // Debug logging for section filtering
  if (sectionFields.length > 0) {
    console.log(`Section ${sectionId} has ${sectionFields.length} fields:`, sectionFields.map(f => f.field_label || f.field_id))
  }
  
  return sectionFields
}

function handleDragStart(type: any, event: DragEvent) {
  if (event?.dataTransfer) {
    event.dataTransfer.setData('fieldType', type.value)
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  const fieldType = event.dataTransfer?.getData('fieldType')
  if (fieldType) {
    // Find which section was dropped on (simplified - drops to first section)
    addNewField(fieldType, 'section-1')
  }
}

function addNewField(fieldType: string, sectionId: string) {
  const newField = {
    id: `temp_${Date.now()}`,
    section_id: sectionId,
    field_id: `field_${Date.now()}`,
    field_type: fieldType,
    field_label: 'New Field',
    field_placeholder: '',
    is_required: false,
    is_readonly: false,
    source_system: 'manual',
    source_field: '',
    display_order: fields.value.length + 1
  }
  fields.value.push(newField)
  editField(newField)
}

function addFieldToSection(sectionId: string) {
  addNewField('text', sectionId)
}

function editField(field: any) {
  selectedField.value = { ...field }
  showImpactAnalysis.value = false // Reset impact analysis when selecting new field
  if (field.options) {
    try {
      const options = typeof field.options === 'string' ? JSON.parse(field.options) : field.options
      optionsText.value = Array.isArray(options) ? options.join('\n') : ''
    } catch {
      optionsText.value = ''
    }
  } else {
    optionsText.value = ''
  }
  
  if (field.conditions) {
    try {
      const condition = typeof field.conditions === 'string' ? JSON.parse(field.conditions) : field.conditions
      conditionField.value = condition.field || ''
      conditionOperator.value = condition.operator || 'equals'
      conditionValue.value = condition.value || ''
    } catch {
      conditionField.value = ''
      conditionOperator.value = 'equals'
      conditionValue.value = ''
    }
  } else {
    conditionField.value = ''
    conditionOperator.value = 'equals'
    conditionValue.value = ''
  }
}

function saveFieldProperties() {
  if (!selectedField.value) return

  // Update options
  if (selectedField.value.field_type === 'select' && optionsText.value) {
    selectedField.value.options = JSON.stringify(
      optionsText.value.split('\n').filter(o => o.trim())
    )
  } else {
    selectedField.value.options = null
  }

  // Update conditions
  if (conditionField.value) {
    selectedField.value.conditions = JSON.stringify({
      field: conditionField.value,
      operator: conditionOperator.value,
      value: conditionValue.value
    })
  } else {
    selectedField.value.conditions = null
  }

  // Update in fields array
  const index = fields.value.findIndex(f => (f.id || f.field_id) === (selectedField.value.id || selectedField.value.field_id))
  if (index >= 0) {
    fields.value[index] = { ...selectedField.value }
  }

  selectedField.value = null
  success('Field properties saved')
}

function deleteField(fieldId: string) {
  if (confirm('Are you sure you want to delete this field?')) {
    fields.value = fields.value.filter(f => (f.id || f.field_id) !== fieldId)
    if (selectedField.value && (selectedField.value.id || selectedField.value.field_id) === fieldId) {
      selectedField.value = null
    }
  }
}

function moveFieldUp(field: any) {
  const index = fields.value.findIndex(f => (f.id || f.field_id) === (field.id || field.field_id))
  if (index > 0) {
    const prevField = fields.value[index - 1]
    if (prevField.section_id === field.section_id) {
      const temp = prevField.display_order
      prevField.display_order = field.display_order
      field.display_order = temp
      fields.value.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    }
  }
}

function moveFieldDown(field: any) {
  const index = fields.value.findIndex(f => (f.id || f.field_id) === (field.id || field.field_id))
  if (index < fields.value.length - 1) {
    const nextField = fields.value[index + 1]
    if (nextField.section_id === field.section_id) {
      const temp = nextField.display_order
      nextField.display_order = field.display_order
      field.display_order = temp
      fields.value.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    }
  }
}

function canMoveUp(field: any): boolean {
  const index = fields.value.findIndex(f => (f.id || f.field_id) === (field.id || field.field_id))
  return index > 0 && fields.value[index - 1].section_id === field.section_id
}

function canMoveDown(field: any): boolean {
  const index = fields.value.findIndex(f => (f.id || f.field_id) === (field.id || field.field_id))
  return index < fields.value.length - 1 && fields.value[index + 1].section_id === field.section_id
}

function isFieldFromSystem(field: any): boolean {
  return field.source_system && field.source_system !== 'manual'
}

function getFieldTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    'text': '📝',
    'textarea': '📄',
    'select': '📋',
    'date': '📅',
    'number': '🔢'
  }
  return icons[type] || '📝'
}

function getSourceFieldPlaceholder(system: string): string {
  const placeholders: Record<string, string> = {
    'HRMS': 'user.name, user.director.name, user.department',
    'PRMS': 'client.client_name, client.client_code, client.status',
    'COI': 'request.request_id, request.status'
  }
  return placeholders[system] || ''
}

function getChangeTypeForField(field: any): string {
  // Determine change type based on field state
  if (field.id && field.id.toString().startsWith('imported_')) {
    return 'field_added'
  }
  // Check if field exists in database
  // For now, assume it's a modification
  return 'field_modified'
}

function importFromExistingForm() {
  if (confirm('This will replace all current fields with fields from the existing COI form. Continue?')) {
    // Extract fields from existing COIRequestForm structure
    const existingFormFields = [
      // Section 1: Requestor Information
      {
        section_id: 'section-1',
        field_id: 'requestor_name',
        field_type: 'text',
        field_label: 'Requestor Name',
        is_required: false,
        is_readonly: true,
        source_system: 'HRMS',
        source_field: 'user.name',
        display_order: 1
      },
      {
        section_id: 'section-1',
        field_id: 'line_of_service',
        field_type: 'text',
        field_label: 'Department',
        is_required: false,
        is_readonly: true,
        source_system: 'HRMS',
        source_field: 'user.department',
        display_order: 2
      },
      {
        section_id: 'section-1',
        field_id: 'designation',
        field_type: 'select',
        field_label: 'Designation',
        field_placeholder: 'Select designation...',
        is_required: true,
        is_readonly: false,
        options: JSON.stringify(['Director', 'Partner', 'Manager', 'Senior Manager']),
        source_system: 'manual',
        display_order: 3
      },
      {
        section_id: 'section-1',
        field_id: 'entity',
        field_type: 'select',
        field_label: 'Entity',
        field_placeholder: 'Select entity...',
        is_required: true,
        is_readonly: false,
        options: JSON.stringify(['BDO Al Nisf & Partners']),
        default_value: 'BDO Al Nisf & Partners',
        source_system: 'manual',
        display_order: 4
      },
      
      // Section 2: Document Type
      {
        section_id: 'section-2',
        field_id: 'requested_document',
        field_type: 'select',
        field_label: 'Requested Document',
        field_placeholder: 'Select document type...',
        is_required: true,
        is_readonly: false,
        options: JSON.stringify(['Proposal', 'Engagement Letter']),
        default_value: 'Proposal',
        source_system: 'manual',
        display_order: 1
      },
      {
        section_id: 'section-2',
        field_id: 'language',
        field_type: 'select',
        field_label: 'Language',
        field_placeholder: 'Select language...',
        is_required: true,
        is_readonly: false,
        options: JSON.stringify(['English', 'Arabic']),
        default_value: 'English',
        source_system: 'manual',
        display_order: 2
      },
      
      // Section 3: Client Details
      {
        section_id: 'section-3',
        field_id: 'client_id',
        field_type: 'select',
        field_label: 'Select Client',
        field_placeholder: 'Select client...',
        is_required: true,
        is_readonly: false,
        source_system: 'PRMS',
        source_field: 'client.client_name',
        display_order: 1
      },
      {
        section_id: 'section-3',
        field_id: 'client_type',
        field_type: 'select',
        field_label: 'Client Type',
        field_placeholder: 'Select client type...',
        is_required: false,
        is_readonly: false,
        options: JSON.stringify(['Existing', 'New', 'Potential']),
        source_system: 'manual',
        display_order: 2
      },
      {
        section_id: 'section-3',
        field_id: 'client_location',
        field_type: 'text',
        field_label: 'Location',
        field_placeholder: 'Enter location...',
        is_required: false,
        is_readonly: false,
        default_value: 'State of Kuwait',
        source_system: 'manual',
        display_order: 3
      },
      {
        section_id: 'section-3',
        field_id: 'relationship_with_client',
        field_type: 'select',
        field_label: 'Relationship',
        field_placeholder: 'Select relationship...',
        is_required: false,
        is_readonly: false,
        options: JSON.stringify(['New Client', 'Existing Client', 'Related Party']),
        source_system: 'manual',
        display_order: 4
      },
      {
        section_id: 'section-3',
        field_id: 'regulated_body',
        field_type: 'text',
        field_label: 'Regulated By',
        field_placeholder: 'Enter regulated body...',
        is_required: false,
        is_readonly: false,
        source_system: 'manual',
        display_order: 5
      },
      {
        section_id: 'section-3',
        field_id: 'pie_status',
        field_type: 'select',
        field_label: 'PIE Status',
        field_placeholder: 'Select PIE status...',
        is_required: true,
        is_readonly: false,
        options: JSON.stringify(['Yes', 'No']),
        default_value: 'No',
        source_system: 'manual',
        display_order: 6
      },
      {
        section_id: 'section-3',
        field_id: 'parent_company',
        field_type: 'text',
        field_label: 'Parent Company (if any)',
        field_placeholder: 'Enter parent company name...',
        is_required: false,
        is_readonly: false,
        conditions: JSON.stringify({
          field: 'pie_status',
          operator: 'equals',
          value: 'Yes'
        }),
        source_system: 'PRMS',
        source_field: 'parent_company.client_name',
        display_order: 7
      },
      
      // Section 4: Service Information
      {
        section_id: 'section-4',
        field_id: 'service_type',
        field_type: 'select',
        field_label: 'Service Type',
        field_placeholder: 'Select service type...',
        is_required: true,
        is_readonly: false,
        options: JSON.stringify([
          'Statutory Audit',
          'External Audit',
          'Tax Compliance',
          'Tax Advisory',
          'Management Consulting',
          'Business Advisory',
          'Internal Audit'
        ]),
        source_system: 'manual',
        display_order: 1
      },
      {
        section_id: 'section-4',
        field_id: 'service_category',
        field_type: 'text',
        field_label: 'Service Category',
        field_placeholder: 'Enter service category...',
        is_required: false,
        is_readonly: false,
        source_system: 'manual',
        display_order: 2
      },
      {
        section_id: 'section-4',
        field_id: 'service_description',
        field_type: 'textarea',
        field_label: 'Service Description',
        field_placeholder: 'Describe the services to be provided...',
        is_required: true,
        is_readonly: false,
        source_system: 'manual',
        display_order: 3
      },
      {
        section_id: 'section-4',
        field_id: 'requested_service_period_start',
        field_type: 'date',
        field_label: 'Service Period Start',
        is_required: false,
        is_readonly: false,
        source_system: 'manual',
        display_order: 4
      },
      {
        section_id: 'section-4',
        field_id: 'requested_service_period_end',
        field_type: 'date',
        field_label: 'Service Period End',
        is_required: false,
        is_readonly: false,
        source_system: 'manual',
        display_order: 5
      },
      
      // Section 5: Ownership Structure
      {
        section_id: 'section-5',
        field_id: 'full_ownership_structure',
        field_type: 'textarea',
        field_label: 'Full Ownership Structure',
        field_placeholder: 'Describe the full ownership structure...',
        is_required: false,
        is_readonly: false,
        source_system: 'manual',
        display_order: 1
      },
      {
        section_id: 'section-5',
        field_id: 'related_affiliated_entities',
        field_type: 'textarea',
        field_label: 'Related/Affiliated Entities',
        field_placeholder: 'List related or affiliated entities...',
        is_required: false,
        is_readonly: false,
        source_system: 'manual',
        display_order: 2
      },
      
      // Section 7: International Operations
      {
        section_id: 'section-7',
        field_id: 'international_operations',
        field_type: 'select',
        field_label: 'International Operations',
        field_placeholder: 'Select...',
        is_required: false,
        is_readonly: false,
        options: JSON.stringify(['Yes', 'No']),
        default_value: 'No',
        source_system: 'manual',
        display_order: 1
      },
      {
        section_id: 'section-7',
        field_id: 'foreign_subsidiaries',
        field_type: 'textarea',
        field_label: 'Foreign Subsidiaries',
        field_placeholder: 'List foreign subsidiaries...',
        is_required: false,
        is_readonly: false,
        conditions: JSON.stringify({
          field: 'international_operations',
          operator: 'equals',
          value: 'Yes'
        }),
        source_system: 'manual',
        display_order: 2
      }
    ]
    
    // Assign IDs to fields and ensure proper structure
    fields.value = existingFormFields.map((field: any, index: number) => ({
      ...field,
      id: field.id || field.field_id || `imported-${Date.now()}-${index}`,
      is_required: Boolean(field.is_required),
      is_readonly: Boolean(field.is_readonly),
      display_order: field.display_order || index + 1,
      section_id: field.section_id || 'section-1'
    }))
    
    success('Form imported from existing COI form! Review and save when ready.')
  }
}

async function saveForm() {
  saving.value = true
  try {
    // Assign display orders if missing
    fields.value.forEach((field, index) => {
      if (!field.display_order) {
        field.display_order = index + 1
      }
    })

    await api.post('/config/form-fields', { fields: fields.value })
    success('Form configuration saved successfully!')
  } catch (error: any) {
    showError(error.response?.data?.error || 'Failed to save form configuration')
  } finally {
    saving.value = false
  }
}

async function loadTemplate() {
  if (!selectedTemplate.value) return
  
  if (confirm('This will replace all current fields with the selected template. Continue?')) {
    try {
      console.log('Loading template:', selectedTemplate.value)
      const loadResponse = await api.post(`/config/templates/${selectedTemplate.value}/load`)
      console.log('Template load response:', loadResponse.data)
      
      // Use fields from the load response if available, otherwise reload from API
      if (loadResponse.data.fields && loadResponse.data.fields.length > 0) {
        // Ensure each field has an id for Vue reactivity and proper structure
        fields.value = loadResponse.data.fields.map((field: any, index: number) => ({
          ...field,
          id: field.id || field.field_id || `temp-${index}`,
          is_required: Boolean(field.is_required),
          is_readonly: Boolean(field.is_readonly),
          display_order: field.display_order || index + 1,
          section_id: field.section_id || 'section-1'
        }))
        console.log('Using fields from load response:', fields.value.length, 'fields')
        console.log('Field structure sample:', fields.value[0])
        console.log('Fields by section:', fields.value.reduce((acc: any, f: any) => {
          acc[f.section_id] = (acc[f.section_id] || 0) + 1
          return acc
        }, {}))
      } else {
        // Fallback: reload form fields from the database after template is loaded
        const response = await api.get('/config/form-fields')
        console.log('Form fields after load:', response.data.fields?.length || 0, 'fields')
        fields.value = (response.data.fields || []).map((field: any, index: number) => ({
          ...field,
          id: field.id || field.field_id || `temp-${index}`,
          is_required: Boolean(field.is_required),
          is_readonly: Boolean(field.is_readonly),
          display_order: field.display_order || index + 1,
          section_id: field.section_id || 'section-1'
        }))
        console.log('Reloaded fields structure sample:', fields.value[0])
      }
      
      if (fields.value.length === 0) {
        showError('Template loaded but no fields found. The template may be empty.')
      } else {
        success(`Template loaded successfully! ${fields.value.length} fields loaded.`)
      }
      selectedTemplate.value = '' // Reset selector
    } catch (error: any) {
      console.error('Error loading template:', error)
      console.error('Error response:', error.response?.data)
      showError(error.response?.data?.error || 'Failed to load template')
      selectedTemplate.value = '' // Reset if error
    }
  } else {
    selectedTemplate.value = '' // Reset if cancelled
  }
}

async function saveTemplate() {
  if (!templateName.value.trim()) {
    showError('Template name is required')
    return
  }
  
  savingTemplate.value = true
  try {
    // Assign display orders if missing
    fields.value.forEach((field, index) => {
      if (!field.display_order) {
        field.display_order = index + 1
      }
    })

    console.log('Saving template:', templateName.value)
    console.log('Fields to save:', fields.value.length, 'fields')
    console.log('Fields by section:', fields.value.reduce((acc: any, f: any) => {
      acc[f.section_id] = (acc[f.section_id] || 0) + 1
      return acc
    }, {}))

    await api.post('/config/templates', {
      template_name: templateName.value,
      template_description: templateDescription.value,
      is_default: setAsDefault.value,
      fields: fields.value
    })
    
    success('Template saved successfully!')
    showSaveTemplateModal.value = false
    templateName.value = ''
    templateDescription.value = ''
    setAsDefault.value = false
    await loadTemplates() // Refresh template list
  } catch (error: any) {
    showError(error.response?.data?.error || 'Failed to save template')
  } finally {
    savingTemplate.value = false
  }
}

async function loadTemplates() {
  try {
    const response = await api.get('/config/templates')
    templates.value = response.data.templates || []
    console.log('Loaded templates:', templates.value.length, templates.value)
    if (templates.value.length === 0) {
      console.log('No templates found. Save a template first to load it later.')
    }
  } catch (error: any) {
    console.error('Failed to load templates:', error)
    console.error('Error response:', error.response?.data)
    showError('Failed to load templates: ' + (error.response?.data?.error || error.message))
  }
}

onMounted(async () => {
  try {
    const response = await api.get('/config/form-fields')
    const rawFields = response.data.fields || []
    
    // Ensure each field has proper structure with IDs
    fields.value = rawFields.map((field: any, index: number) => ({
      ...field,
      id: field.id || field.field_id || `temp-${index}`,
      is_required: Boolean(field.is_required),
      is_readonly: Boolean(field.is_readonly),
      display_order: field.display_order || index + 1,
      section_id: field.section_id || 'section-1'
    }))
    
    console.log('Loaded', fields.value.length, 'form fields on mount')
    console.log('Fields by section:', fields.value.reduce((acc: any, f: any) => {
      acc[f.section_id] = (acc[f.section_id] || 0) + 1
      return acc
    }, {}))
  } catch (error) {
    console.error('Failed to load form fields:', error)
  }
  
  await loadTemplates()
})
</script>
