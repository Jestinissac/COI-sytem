<template>
  <div class="bg-white rounded-lg shadow-sm border-2 border-blue-200">
    <!-- Card Header -->
    <div class="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <h3 class="text-lg font-semibold text-white">Global COI Form</h3>
            <p class="text-sm text-blue-100">Required for international operations</p>
          </div>
        </div>
        <button
          v-if="hasData"
          @click="exportToExcel"
          :disabled="exporting"
          class="flex items-center px-4 py-2 bg-white text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg v-if="!exporting" class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <svg v-else class="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ exporting ? 'Exporting...' : 'Export to Excel' }}
        </button>
      </div>
    </div>

    <!-- Card Content -->
    <div class="p-6 space-y-6">
      <!-- Info Banner -->
      <div class="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
        <div class="flex items-start">
          <svg class="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div class="text-sm text-blue-800">
            <p class="font-medium mb-1">Global COI Form Required</p>
            <p>This form will be exported to Excel format for submission to BDO Global COI Portal. Please complete all required fields below.</p>
          </div>
        </div>
      </div>

      <!-- Form Fields -->
      <div class="grid grid-cols-2 gap-6">
        <!-- Client Information -->
        <div class="space-y-4">
          <h4 class="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Client Information</h4>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Client Name <span class="text-red-500">*</span></label>
            <input
              v-model="formData.clientName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter client name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Ultimate Parent Company</label>
            <input
              v-model="formData.ultimateParentCompany"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter parent company name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Location <span class="text-red-500">*</span></label>
            <input
              v-model="formData.location"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter location"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Client Type <span class="text-red-500">*</span></label>
            <select
              v-model="formData.clientType"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select client type...</option>
              <option value="Existing">Existing</option>
              <option value="Potential">Potential</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Client is PIE <span class="text-red-500">*</span></label>
            <select
              v-model="formData.clientIsPIE"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>

        <!-- Engagement Information -->
        <div class="space-y-4">
          <h4 class="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Engagement Information</h4>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Service Description <span class="text-red-500">*</span></label>
            <textarea
              v-model="formData.servicesDetails"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the services to be provided"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Nature of Engagement <span class="text-red-500">*</span></label>
            <input
              v-model="formData.natureOfEngagement"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter engagement nature"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Industry Sector</label>
            <input
              v-model="formData.industrySector"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter industry sector"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
            <input
              v-model="formData.website"
              type="url"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Engagement Involves Another Party</label>
            <select
              v-model="formData.engagementInvolvesAnotherParty"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>
      </div>

      <!-- International Countries Section -->
      <div class="border-t border-gray-200 pt-6">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-sm font-semibold text-gray-900">International Operations</h4>
          <button
            type="button"
            @click="addCountry"
            class="flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Country
          </button>
        </div>

        <div v-if="formData.countries && formData.countries.length > 0" class="space-y-3">
          <div
            v-for="(country, index) in formData.countries"
            :key="index"
            class="p-4 border border-gray-200 rounded-lg bg-gray-50"
          >
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Country</label>
                <select
                  v-model="country.country_code"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select country...</option>
                  <option v-for="c in countries" :key="c.iso_code || c.country_code" :value="c.iso_code || c.country_code">
                    {{ c.name || c.country_name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Entity Name</label>
                <input
                  v-model="country.entityName"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Entity name"
                />
              </div>
              <div class="flex items-end">
                <button
                  type="button"
                  @click="removeCountry(index)"
                  class="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-sm text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          No countries added. Click "Add Country" to add international operations.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from '@/composables/useToast'
import api from '@/services/api'

const props = defineProps<{
  requestId?: number | null
  initialData?: any
  countries?: any[]
}>()

const emit = defineEmits<{
  (e: 'update:data', data: any): void
}>()

const { showToast, showError } = useToast()
const exporting = ref(false)

const formData = ref({
  clientName: '',
  ultimateParentCompany: '',
  location: 'State of Kuwait',
  clientType: '',
  clientIsPIE: '',
  servicesDetails: '',
  natureOfEngagement: '',
  industrySector: '',
  website: '',
  engagementInvolvesAnotherParty: '',
  countries: [] as Array<{
    country_code: string
    entityName: string
  }>
})

// Load initial data if provided
if (props.initialData) {
  formData.value = {
    ...formData.value,
    ...props.initialData,
    countries: props.initialData.countries || []
  }
}

// Watch for changes to initialData prop to update form (for auto-population)
watch(() => props.initialData, (newData) => {
  if (newData) {
    // Only update if fields are empty (don't overwrite user input)
    Object.keys(newData).forEach(key => {
      if (newData[key] && (!formData.value[key] || formData.value[key] === '')) {
        if (key === 'countries') {
          formData.value.countries = newData.countries || []
        } else {
          formData.value[key] = newData[key]
        }
      }
    })
  }
}, { deep: true, immediate: true })

const hasData = computed(() => {
  return formData.value.clientName && 
         formData.value.location && 
         formData.value.clientType &&
         formData.value.clientIsPIE &&
         formData.value.servicesDetails &&
         formData.value.natureOfEngagement
})

// Watch for changes and emit updates
watch(formData, (newData) => {
  emit('update:data', newData)
}, { deep: true })

function addCountry() {
  if (!formData.value.countries) {
    formData.value.countries = []
  }
  formData.value.countries.push({
    country_code: '',
    entityName: ''
  })
}

function removeCountry(index: number) {
  if (formData.value.countries) {
    formData.value.countries.splice(index, 1)
  }
}

async function exportToExcel() {
  if (!hasData.value) {
    showError('Please complete all required fields before exporting')
    return
  }

  exporting.value = true
  try {
    if (props.requestId) {
      // Export existing request
      const response = await api.get(`/global/export-excel/${props.requestId}`, {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Global_COI_Form_${props.requestId}_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      showToast('Excel file downloaded successfully!', 'success')
    } else {
      // Export form data (new request)
      const response = await api.post('/global/generate-excel', formData.value, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Global_COI_Form_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      showToast('Excel file downloaded successfully!', 'success')
    }
  } catch (error: any) {
    console.error('Error exporting to Excel:', error)
    showError(error.response?.data?.error || 'Failed to export Excel file')
  } finally {
    exporting.value = false
  }
}

// Expose form data for parent component
defineExpose({
  formData,
  exportToExcel,
  hasData
})
</script>
