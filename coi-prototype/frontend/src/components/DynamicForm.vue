<template>
  <div class="dynamic-form">
    <div v-for="section in formSections" :key="section.id" class="form-section mb-6">
      <h3 class="text-base font-semibold text-gray-900 mb-4">{{ section.label }}</h3>
      
      <div class="space-y-4">
        <div 
          v-for="field in getFieldsForSection(section.id)" 
          :key="field.field_id"
          v-show="shouldShowField(field)"
          class="form-field"
        >
          <label :for="field.field_id" class="block text-sm font-medium text-gray-700 mb-1.5">
            {{ field.field_label }}
            <span v-if="field.is_required" class="text-red-500 ml-1">*</span>
          </label>
          
          <!-- Text Input -->
          <input
            v-if="field.field_type === 'text'"
            :id="field.field_id"
            v-model="formData[field.field_id]"
            :placeholder="field.field_placeholder"
            :required="field.is_required"
            :readonly="field.is_readonly || isFieldFromSystem(field)"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :class="field.is_readonly || isFieldFromSystem(field) ? 'bg-gray-50' : ''"
          />
          
          <!-- Textarea -->
          <textarea
            v-else-if="field.field_type === 'textarea'"
            :id="field.field_id"
            v-model="formData[field.field_id]"
            :placeholder="field.field_placeholder"
            :required="field.is_required"
            :readonly="field.is_readonly || isFieldFromSystem(field)"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :class="field.is_readonly || isFieldFromSystem(field) ? 'bg-gray-50' : ''"
          />
          
          <!-- Select/Dropdown -->
          <select
            v-else-if="field.field_type === 'select'"
            :id="field.field_id"
            v-model="formData[field.field_id]"
            :required="field.is_required"
            :disabled="field.is_readonly || isFieldFromSystem(field)"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :class="field.is_readonly || isFieldFromSystem(field) ? 'bg-gray-50' : ''"
          >
            <option value="">{{ field.field_placeholder || 'Select...' }}</option>
            <option 
              v-for="option in getFieldOptions(field)" 
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>
          
          <!-- Date -->
          <input
            v-else-if="field.field_type === 'date'"
            :id="field.field_id"
            v-model="formData[field.field_id]"
            type="date"
            :required="field.is_required"
            :readonly="field.is_readonly || isFieldFromSystem(field)"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :class="field.is_readonly || isFieldFromSystem(field) ? 'bg-gray-50' : ''"
          />
          
          <!-- Number -->
          <input
            v-else-if="field.field_type === 'number'"
            :id="field.field_id"
            v-model.number="formData[field.field_id]"
            type="number"
            :required="field.is_required"
            :readonly="field.is_readonly || isFieldFromSystem(field)"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :class="field.is_readonly || isFieldFromSystem(field) ? 'bg-gray-50' : ''"
          />
          
          <!-- Show source system indicator -->
          <small v-if="isFieldFromSystem(field)" class="text-xs text-gray-500 mt-1 block">
            {{ field.source_system }}: {{ field.source_field }}
          </small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  formData: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'update:formData', data: Record<string, any>): void
}>()

const authStore = useAuthStore()
const formFields = ref<any[]>([])
const hrmsData = ref<any>({})
const prmsData = ref<any>({})

const sections = [
  { id: 'section-1', label: 'Requestor Information' },
  { id: 'section-2', label: 'Document Type' },
  { id: 'section-3', label: 'Client Details' },
  { id: 'section-4', label: 'Service Information' },
  { id: 'section-5', label: 'Ownership & Structure' },
  { id: 'section-6', label: 'Signatories' },
  { id: 'section-7', label: 'International Operations' }
]

const formSections = computed(() => {
  return sections.filter(section => 
    formFields.value.some(f => f.section_id === section.id)
  )
})

function getFieldsForSection(sectionId: string) {
  return formFields.value
    .filter(f => f.section_id === sectionId)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
}

function shouldShowField(field: any): boolean {
  if (!field.conditions) return true
  
  try {
    const condition = typeof field.conditions === 'string' 
      ? JSON.parse(field.conditions) 
      : field.conditions
    
    if (!condition.field) return true
    
    const fieldValue = props.formData[condition.field]
    
    switch (condition.operator) {
      case 'equals':
        return String(fieldValue) === String(condition.value)
      case 'not_equals':
        return String(fieldValue) !== String(condition.value)
      case 'contains':
        return String(fieldValue).includes(condition.value)
      default:
        return true
    }
  } catch {
    return true
  }
}

function isFieldFromSystem(field: any): boolean {
  return field.source_system && field.source_system !== 'manual'
}

function getFieldOptions(field: any): string[] {
  if (field.options) {
    try {
      return typeof field.options === 'string' 
        ? JSON.parse(field.options) 
        : field.options
    } catch {
      return []
    }
  }
  return []
}

async function loadFieldValue(field: any) {
  if (!field.source_system || !field.source_field) return

  try {
    let value = null
    
    if (field.source_system === 'HRMS') {
      // Load from HRMS data
      const path = field.source_field.split('.')
      value = path.reduce((obj: any, key: string) => obj?.[key], hrmsData.value)
    } else if (field.source_system === 'PRMS') {
      // Load from PRMS data
      const path = field.source_field.split('.')
      value = path.reduce((obj: any, key: string) => obj?.[key], prmsData.value)
    } else if (field.source_system === 'COI') {
      // Load from COI system (form data)
      const path = field.source_field.split('.')
      value = path.reduce((obj: any, key: string) => obj?.[key], props.formData)
    }
    
    if (value !== null && value !== undefined) {
      const updatedData = {
        ...props.formData,
        [field.field_id]: value
      }
      emit('update:formData', updatedData)
    }
  } catch (error) {
    console.error(`Failed to load ${field.source_system} field:`, error)
  }
}

onMounted(async () => {
  // Load form configuration
  try {
    const response = await api.get('/config/form-fields')
    formFields.value = response.data.fields || []
  } catch (error) {
    console.error('Failed to load form fields:', error)
    // If no config exists, form will be empty (admin needs to configure)
  }

  // Load HRMS data for current user
  try {
    const hrmsResponse = await api.get('/integration/hrms/user-data')
    hrmsData.value = hrmsResponse.data
  } catch (error) {
    console.error('Failed to load HRMS data:', error)
  }

  // Load PRMS data if client is selected
  if (props.formData.client_id) {
    try {
      const prmsResponse = await api.get(`/integration/prms/client/${props.formData.client_id}`)
      prmsData.value = prmsResponse.data
    } catch (error) {
      console.error('Failed to load PRMS data:', error)
    }
  }

  // Auto-populate fields from HRMS/PRMS
  formFields.value.forEach(field => {
    if (isFieldFromSystem(field)) {
      loadFieldValue(field)
    }
  })
})

// Watch for client changes to reload PRMS data
watch(() => props.formData.client_id, async (newClientId) => {
  if (newClientId) {
    try {
      const prmsResponse = await api.get(`/integration/prms/client/${newClientId}`)
      prmsData.value = prmsResponse.data
      
      // Reload PRMS-sourced fields
      formFields.value
        .filter(f => f.source_system === 'PRMS')
        .forEach(field => loadFieldValue(field))
    } catch (error) {
      console.error('Failed to load PRMS data:', error)
    }
  }
})
</script>

  <div class="dynamic-form">
    <div v-for="section in formSections" :key="section.id" class="form-section mb-6">
      <h3 class="text-base font-semibold text-gray-900 mb-4">{{ section.label }}</h3>
      
      <div class="space-y-4">
        <div 
          v-for="field in getFieldsForSection(section.id)" 
          :key="field.field_id"
          v-show="shouldShowField(field)"
          class="form-field"
        >
          <label :for="field.field_id" class="block text-sm font-medium text-gray-700 mb-1.5">
            {{ field.field_label }}
            <span v-if="field.is_required" class="text-red-500 ml-1">*</span>
          </label>
          
          <!-- Text Input -->
          <input
            v-if="field.field_type === 'text'"
            :id="field.field_id"
            v-model="formData[field.field_id]"
            :placeholder="field.field_placeholder"
            :required="field.is_required"
            :readonly="field.is_readonly || isFieldFromSystem(field)"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :class="field.is_readonly || isFieldFromSystem(field) ? 'bg-gray-50' : ''"
          />
          
          <!-- Textarea -->
          <textarea
            v-else-if="field.field_type === 'textarea'"
            :id="field.field_id"
            v-model="formData[field.field_id]"
            :placeholder="field.field_placeholder"
            :required="field.is_required"
            :readonly="field.is_readonly || isFieldFromSystem(field)"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :class="field.is_readonly || isFieldFromSystem(field) ? 'bg-gray-50' : ''"
          />
          
          <!-- Select/Dropdown -->
          <select
            v-else-if="field.field_type === 'select'"
            :id="field.field_id"
            v-model="formData[field.field_id]"
            :required="field.is_required"
            :disabled="field.is_readonly || isFieldFromSystem(field)"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :class="field.is_readonly || isFieldFromSystem(field) ? 'bg-gray-50' : ''"
          >
            <option value="">{{ field.field_placeholder || 'Select...' }}</option>
            <option 
              v-for="option in getFieldOptions(field)" 
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>
          
          <!-- Date -->
          <input
            v-else-if="field.field_type === 'date'"
            :id="field.field_id"
            v-model="formData[field.field_id]"
            type="date"
            :required="field.is_required"
            :readonly="field.is_readonly || isFieldFromSystem(field)"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :class="field.is_readonly || isFieldFromSystem(field) ? 'bg-gray-50' : ''"
          />
          
          <!-- Number -->
          <input
            v-else-if="field.field_type === 'number'"
            :id="field.field_id"
            v-model.number="formData[field.field_id]"
            type="number"
            :required="field.is_required"
            :readonly="field.is_readonly || isFieldFromSystem(field)"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :class="field.is_readonly || isFieldFromSystem(field) ? 'bg-gray-50' : ''"
          />
          
          <!-- Show source system indicator -->
          <small v-if="isFieldFromSystem(field)" class="text-xs text-gray-500 mt-1 block">
            {{ field.source_system }}: {{ field.source_field }}
          </small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  formData: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'update:formData', data: Record<string, any>): void
}>()

const authStore = useAuthStore()
const formFields = ref<any[]>([])
const hrmsData = ref<any>({})
const prmsData = ref<any>({})

const sections = [
  { id: 'section-1', label: 'Requestor Information' },
  { id: 'section-2', label: 'Document Type' },
  { id: 'section-3', label: 'Client Details' },
  { id: 'section-4', label: 'Service Information' },
  { id: 'section-5', label: 'Ownership & Structure' },
  { id: 'section-6', label: 'Signatories' },
  { id: 'section-7', label: 'International Operations' }
]

const formSections = computed(() => {
  return sections.filter(section => 
    formFields.value.some(f => f.section_id === section.id)
  )
})

function getFieldsForSection(sectionId: string) {
  return formFields.value
    .filter(f => f.section_id === sectionId)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
}

function shouldShowField(field: any): boolean {
  if (!field.conditions) return true
  
  try {
    const condition = typeof field.conditions === 'string' 
      ? JSON.parse(field.conditions) 
      : field.conditions
    
    if (!condition.field) return true
    
    const fieldValue = props.formData[condition.field]
    
    switch (condition.operator) {
      case 'equals':
        return String(fieldValue) === String(condition.value)
      case 'not_equals':
        return String(fieldValue) !== String(condition.value)
      case 'contains':
        return String(fieldValue).includes(condition.value)
      default:
        return true
    }
  } catch {
    return true
  }
}

function isFieldFromSystem(field: any): boolean {
  return field.source_system && field.source_system !== 'manual'
}

function getFieldOptions(field: any): string[] {
  if (field.options) {
    try {
      return typeof field.options === 'string' 
        ? JSON.parse(field.options) 
        : field.options
    } catch {
      return []
    }
  }
  return []
}

async function loadFieldValue(field: any) {
  if (!field.source_system || !field.source_field) return

  try {
    let value = null
    
    if (field.source_system === 'HRMS') {
      // Load from HRMS data
      const path = field.source_field.split('.')
      value = path.reduce((obj: any, key: string) => obj?.[key], hrmsData.value)
    } else if (field.source_system === 'PRMS') {
      // Load from PRMS data
      const path = field.source_field.split('.')
      value = path.reduce((obj: any, key: string) => obj?.[key], prmsData.value)
    } else if (field.source_system === 'COI') {
      // Load from COI system (form data)
      const path = field.source_field.split('.')
      value = path.reduce((obj: any, key: string) => obj?.[key], props.formData)
    }
    
    if (value !== null && value !== undefined) {
      const updatedData = {
        ...props.formData,
        [field.field_id]: value
      }
      emit('update:formData', updatedData)
    }
  } catch (error) {
    console.error(`Failed to load ${field.source_system} field:`, error)
  }
}

onMounted(async () => {
  // Load form configuration
  try {
    const response = await api.get('/config/form-fields')
    formFields.value = response.data.fields || []
  } catch (error) {
    console.error('Failed to load form fields:', error)
    // If no config exists, form will be empty (admin needs to configure)
  }

  // Load HRMS data for current user
  try {
    const hrmsResponse = await api.get('/integration/hrms/user-data')
    hrmsData.value = hrmsResponse.data
  } catch (error) {
    console.error('Failed to load HRMS data:', error)
  }

  // Load PRMS data if client is selected
  if (props.formData.client_id) {
    try {
      const prmsResponse = await api.get(`/integration/prms/client/${props.formData.client_id}`)
      prmsData.value = prmsResponse.data
    } catch (error) {
      console.error('Failed to load PRMS data:', error)
    }
  }

  // Auto-populate fields from HRMS/PRMS
  formFields.value.forEach(field => {
    if (isFieldFromSystem(field)) {
      loadFieldValue(field)
    }
  })
})

// Watch for client changes to reload PRMS data
watch(() => props.formData.client_id, async (newClientId) => {
  if (newClientId) {
    try {
      const prmsResponse = await api.get(`/integration/prms/client/${newClientId}`)
      prmsData.value = prmsResponse.data
      
      // Reload PRMS-sourced fields
      formFields.value
        .filter(f => f.source_system === 'PRMS')
        .forEach(field => loadFieldValue(field))
    } catch (error) {
      console.error('Failed to load PRMS data:', error)
    }
  }
})
</script>

