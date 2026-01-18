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

      <!-- International Countries Section - Option 3 Accordion Design -->
      <div class="border-t border-gray-200 pt-6">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-sm font-semibold text-gray-900">International Operations</h4>
          <button
            type="button"
            @click="addCountry"
            class="w-full max-w-xs flex items-center justify-center px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-colors"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Country
          </button>
        </div>

        <!-- Countries Accordion -->
        <div v-if="formData.countries && formData.countries.length > 0" class="space-y-3">
          <div
            v-for="(country, countryIndex) in formData.countries"
            :key="countryIndex"
            class="border border-gray-200 rounded-lg overflow-hidden"
          >
            <!-- Accordion Header -->
            <button
              type="button"
              @click="toggleCountry(countryIndex)"
              class="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-colors flex items-center justify-between"
            >
              <div class="flex items-center space-x-3">
                <div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-medium text-sm">
                  {{ countryIndex + 1 }}
                </div>
                <div class="text-left">
                  <div class="font-medium text-gray-900 flex items-center space-x-2">
                    <span>{{ getCountryName(country.country_code) || 'Select Country' }}</span>
                    <span v-if="country.country_code" class="text-xs font-normal text-gray-500">({{ country.country_code }})</span>
                  </div>
                  <div class="text-xs text-gray-500 mt-0.5">
                    <span v-if="country.entities && country.entities.length > 0">
                      {{ country.entities.length }} {{ country.entities.length === 1 ? 'entity' : 'entities' }}
                      <span class="text-gray-400 mx-1">•</span>
                      <span class="inline-flex items-center space-x-1">
                        <span v-if="country.entities.some((e: any) => e.relationship_type === 'parent')" class="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">Parent</span>
                        <span v-if="country.entities.some((e: any) => e.relationship_type === 'subsidiary')" class="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">Subsidiary</span>
                        <span v-if="country.entities.some((e: any) => e.relationship_type === 'sister')" class="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Sister</span>
                      </span>
                    </span>
                    <span v-else>No entities added</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <svg 
                  :class="['w-5 h-5 text-gray-400 transition-transform duration-200', country.expanded ? 'rotate-180' : '']"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
                <button
                  type="button"
                  @click.stop="removeCountry(countryIndex)"
                  class="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </button>

            <!-- Accordion Content -->
            <div v-show="country.expanded" class="border-t border-gray-200 bg-white">
              <div class="p-4 space-y-4">
                <!-- Country Selection -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Country <span class="text-red-500">*</span></label>
                  <select
                    v-model="country.country_code"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select country...</option>
                    <option v-for="c in availableCountries" :key="c.country_code || c.iso_code || c.iso_alpha_2" :value="c.country_code || c.iso_code || c.iso_alpha_2">
                      {{ c.country_name || c.name }}
                    </option>
                  </select>
                  <p v-if="!availableCountries || availableCountries.length === 0" class="mt-1 text-xs text-amber-600">
                    Loading countries...
                  </p>
                </div>

                <!-- Context Banner -->
                <div class="p-3 bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-400 rounded">
                  <div class="flex items-start">
                    <svg class="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div class="text-sm">
                      <p class="font-medium text-blue-900">Corporate Group Relationships</p>
                      <p class="text-xs text-blue-700 mt-1">
                        Add related entities: parent companies, subsidiaries, or sister companies (entities sharing the same parent).
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Entities Section -->
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <h4 class="text-sm font-medium text-gray-900">Related Entities</h4>
                    <button
                      type="button"
                      @click="addEntity(countryIndex)"
                      class="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                      </svg>
                      Add Entity
                    </button>
                  </div>

                  <!-- Entity Cards -->
                  <div class="space-y-3">
                    <div
                      v-for="(entity, entityIndex) in country.entities"
                      :key="entityIndex"
                      class="relative p-4 bg-white border-l-4 rounded-lg shadow-sm transition-all hover:shadow-md"
                      :class="{
                        'border-purple-500 bg-purple-50': entity.relationship_type === 'parent',
                        'border-blue-500 bg-blue-50': entity.relationship_type === 'subsidiary',
                        'border-green-500 bg-green-50': entity.relationship_type === 'sister',
                        'border-gray-300 bg-gray-50': !entity.relationship_type
                      }"
                    >
                      <div class="space-y-3">
                        <!-- Relationship Type Badge & Selector -->
                        <div class="flex items-start justify-between">
                          <div class="flex-1">
                            <label class="block text-xs font-medium text-gray-700 mb-1.5">Relationship Type <span class="text-red-500">*</span></label>
                            <div class="flex items-center space-x-2">
                              <select
                                v-model="entity.relationship_type"
                                class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                              >
                                <option value="">Select relationship...</option>
                                <option value="parent">Parent Company</option>
                                <option value="subsidiary">Subsidiary</option>
                                <option value="sister">Sister Company</option>
                              </select>
                              <!-- Relationship Badge -->
                              <span 
                                v-if="entity.relationship_type"
                                class="px-2.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
                                :class="{
                                  'bg-purple-100 text-purple-700': entity.relationship_type === 'parent',
                                  'bg-blue-100 text-blue-700': entity.relationship_type === 'subsidiary',
                                  'bg-green-100 text-green-700': entity.relationship_type === 'sister'
                                }"
                              >
                                <span v-if="entity.relationship_type === 'parent'">🏢 Parent</span>
                                <span v-else-if="entity.relationship_type === 'subsidiary'">📦 Subsidiary</span>
                                <span v-else-if="entity.relationship_type === 'sister'">🔗 Sister</span>
                              </span>
                            </div>
                            <p class="mt-1.5 text-xs text-gray-600">
                              <span v-if="entity.relationship_type === 'parent'">
                                <strong>Parent Company:</strong> The controlling entity that owns this client
                              </span>
                              <span v-else-if="entity.relationship_type === 'subsidiary'">
                                <strong>Subsidiary:</strong> An entity controlled by this client
                              </span>
                              <span v-else-if="entity.relationship_type === 'sister'">
                                <strong>Sister Company:</strong> Another entity sharing the same parent as this client
                              </span>
                              <span v-else class="text-gray-400">
                                Select the relationship type to this client
                              </span>
                            </p>
                          </div>
                        </div>
                        
                        <!-- Entity Name -->
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1.5">Entity Name <span class="text-red-500">*</span></label>
                          <input
                            v-model="entity.name"
                            type="text"
                            :placeholder="getEntityPlaceholder(entity.relationship_type)"
                            class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                          />
                        </div>
                        
                        <!-- Details -->
                        <div>
                          <label class="block text-xs font-medium text-gray-700 mb-1.5">Additional Details</label>
                          <textarea
                            v-model="entity.details"
                            rows="3"
                            placeholder="Registration number, address, business activities, etc."
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          />
                        </div>
                        
                        <!-- Remove Button -->
                        <div class="flex justify-end pt-2 border-t border-gray-200">
                          <button
                            type="button"
                            @click="removeEntity(countryIndex, entityIndex)"
                            class="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                            Remove Entity
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Empty State for Entities -->
                  <div
                    v-if="!country.entities || country.entities.length === 0"
                    class="p-4 text-center text-sm text-gray-500 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
                  >
                    <svg class="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                    </svg>
                    <p>No related entities added yet.</p>
                    <p class="text-xs mt-1">Click "+ Add Entity" to add a parent company, subsidiary, or sister company.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State for Countries -->
        <div
          v-else
          class="text-center py-12 text-sm text-gray-500 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
        >
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="font-medium text-gray-700 mb-1">No countries added yet</p>
          <p class="text-xs">Click "Add Country" above to get started.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
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

const toast = useToast()
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
    expanded: boolean
    entities: Array<{
      relationship_type: string
      name: string
      details: string
    }>
  }>
})

// Transform countries data from old format to new format
function transformCountries(countriesData: any[]) {
  if (!countriesData || !Array.isArray(countriesData)) return []
  
  return countriesData.map((country: any) => {
    // If it's the old format (country_code, entityName), transform it
    if (country.entityName && !country.entities) {
      return {
        country_code: country.country_code || '',
        expanded: true,
        entities: [{
          relationship_type: '',
          name: country.entityName || '',
          details: ''
        }]
      }
    }
    // If it's already the new format, ensure expanded and entities exist
    return {
      country_code: country.country_code || '',
      expanded: country.expanded !== undefined ? country.expanded : true,
      entities: country.entities || []
    }
  })
}

// Load initial data if provided
if (props.initialData) {
  formData.value = {
    ...formData.value,
    ...props.initialData,
    countries: transformCountries(props.initialData.countries || [])
  }
}

// Watch for changes to initialData prop to update form (for auto-population)
watch(() => props.initialData, (newData) => {
  if (newData) {
    // Only update if fields are empty (don't overwrite user input)
    Object.keys(newData).forEach(key => {
      if (newData[key] && (!formData.value[key] || formData.value[key] === '')) {
        if (key === 'countries') {
          formData.value.countries = transformCountries(newData.countries || [])
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

// Fetch countries if not provided via props
const localCountries = ref<any[]>([])

async function fetchCountries() {
  if (props.countries && props.countries.length > 0) {
    console.log('[InternationalOperationsForm] Countries provided via props, skipping fetch')
    return // Countries already provided via props
  }
  
  console.log('[InternationalOperationsForm] Fetching countries from API...')
  try {
    const response = await api.get('/countries')
    console.log('[InternationalOperationsForm] Countries API response:', response.data)
    localCountries.value = response.data || []
    console.log('[InternationalOperationsForm] Set localCountries to:', localCountries.value.length, 'countries')
  } catch (error: any) {
    console.error('[InternationalOperationsForm] Failed to fetch countries:', error)
    console.error('[InternationalOperationsForm] Error details:', error.response?.data || error.message)
    toast.error('Failed to load countries. Please refresh the page.')
  }
}

// Use props.countries if available, otherwise use localCountries
const availableCountries = computed(() => {
  return (props.countries && props.countries.length > 0) ? props.countries : localCountries.value
})

function getCountryName(code: string) {
  if (!code) return ''
  const countriesList = availableCountries.value
  if (!countriesList || !Array.isArray(countriesList)) return ''
  const country = countriesList.find((c: any) => 
    (c.country_code === code) || 
    (c.iso_code === code) || 
    (c.iso_alpha_2 === code)
  )
  return country ? (country.country_name || country.name) : ''
}

// Watch for countries prop changes (in case parent loads them asynchronously)
watch(() => props.countries, (newCountries) => {
  console.log('[InternationalOperationsForm] Countries prop changed:', newCountries?.length || 0)
  if (newCountries && newCountries.length > 0 && localCountries.value.length === 0) {
    console.log('[InternationalOperationsForm] Using countries from props (watched)')
  }
}, { immediate: true })

// Fetch countries on mount if not provided
onMounted(async () => {
  console.log('[InternationalOperationsForm] onMounted, props.countries:', props.countries?.length || 0)
  if (!props.countries || props.countries.length === 0) {
    console.log('[InternationalOperationsForm] No countries from props, fetching...')
    await fetchCountries()
  } else {
    console.log('[InternationalOperationsForm] Using countries from props:', props.countries.length)
  }
  console.log('[InternationalOperationsForm] availableCountries after mount:', availableCountries.value.length)
})

function addCountry() {
  if (!formData.value.countries) {
    formData.value.countries = []
  }
  formData.value.countries.push({
    country_code: '',
    expanded: true,
    entities: []
  })
}

function removeCountry(index: number) {
  if (formData.value.countries) {
    formData.value.countries.splice(index, 1)
  }
}

function toggleCountry(index: number) {
  if (formData.value.countries && formData.value.countries[index]) {
    formData.value.countries[index].expanded = !formData.value.countries[index].expanded
  }
}

function addEntity(countryIndex: number) {
  if (!formData.value.countries || !formData.value.countries[countryIndex]) return
  
  if (!formData.value.countries[countryIndex].entities) {
    formData.value.countries[countryIndex].entities = []
  }
  
  formData.value.countries[countryIndex].entities.push({
    relationship_type: '',
    name: '',
    details: ''
  })
}

function removeEntity(countryIndex: number, entityIndex: number) {
  if (formData.value.countries && 
      formData.value.countries[countryIndex] && 
      formData.value.countries[countryIndex].entities) {
    formData.value.countries[countryIndex].entities.splice(entityIndex, 1)
  }
}

function getEntityPlaceholder(relationshipType: string) {
  switch (relationshipType) {
    case 'parent':
      return 'Parent company name...'
    case 'subsidiary':
      return 'Subsidiary name...'
    case 'sister':
      return 'Sister company name...'
    default:
      return 'Entity name...'
  }
}

async function exportToExcel() {
  if (!hasData.value) {
    toast.error('Please complete all required fields before exporting')
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
      
      toast.success('Excel file downloaded successfully!')
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
      
      toast.success('Excel file downloaded successfully!')
    }
  } catch (error: any) {
    console.error('Error exporting to Excel:', error)
    toast.error(error.response?.data?.error || 'Failed to export Excel file')
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
