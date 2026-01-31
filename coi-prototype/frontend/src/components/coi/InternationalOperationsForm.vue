<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <!-- Card Header -->
    <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
      <div class="flex items-center space-x-3">
        <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Global COI Form</h3>
        </div>
      </div>
    </div>

    <!-- Card Content -->
    <div class="p-6 space-y-6">
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
              readonly
              class="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-700"
              placeholder="Synced from main request"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Ultimate Parent Company</label>
            <input
              v-model="formData.ultimateParentCompany"
              type="text"
              readonly
              class="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-700"
              placeholder="Synced from main request"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Location <span class="text-red-500">*</span></label>
            <input
              v-model="formData.location"
              type="text"
              readonly
              class="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-700"
              placeholder="Synced from main request"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Client Type <span class="text-red-500">*</span></label>
            <select
              v-model="formData.clientType"
              disabled
              class="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-700"
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
              disabled
              class="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-700"
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
              readonly
              class="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-700"
              placeholder="Synced from main request"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Nature of Engagement <span class="text-red-500">*</span></label>
            <input
              v-model="formData.natureOfEngagement"
              type="text"
              readonly
              class="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-700"
              placeholder="Synced from main request"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Industry Sector</label>
            <input
              v-model="formData.industrySector"
              type="text"
              readonly
              class="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-700"
              placeholder="Synced from main request"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
            <input
              v-model="formData.website"
              type="url"
              readonly
              class="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-700"
              placeholder="Synced from main request"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Engagement Involves Another Party</label>
            <select
              v-model="formData.engagementInvolvesAnotherParty"
              disabled
              class="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-700"
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
            class="w-full max-w-xs flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
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
              class="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between border-b border-gray-200"
            >
              <div class="flex items-center space-x-3">
                <div class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-medium text-sm">
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
                          <span v-if="country.entities.some((e: any) => e.relationship_type === 'affiliate')" class="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">Affiliate</span>
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
                        'border-amber-500 bg-amber-50': entity.relationship_type === 'affiliate',
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
                                <option value="subsidiary">Subsidiary (≥50% ownership)</option>
                                <option value="affiliate">Affiliate (20-50% ownership)</option>
                                <option value="sister">Sister Company</option>
                              </select>
                              <!-- Relationship Badge -->
                              <span 
                                v-if="entity.relationship_type"
                                class="px-2.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
                                :class="{
                                  'bg-purple-100 text-purple-700': entity.relationship_type === 'parent',
                                  'bg-blue-100 text-blue-700': entity.relationship_type === 'subsidiary',
                                  'bg-amber-100 text-amber-700': entity.relationship_type === 'affiliate',
                                  'bg-green-100 text-green-700': entity.relationship_type === 'sister'
                                }"
                              >
                                <span v-if="entity.relationship_type === 'parent'">🏢 Parent</span>
                                <span v-else-if="entity.relationship_type === 'subsidiary'">📦 Subsidiary</span>
                                <span v-else-if="entity.relationship_type === 'affiliate'">🤝 Affiliate</span>
                                <span v-else-if="entity.relationship_type === 'sister'">🔗 Sister</span>
                              </span>
                            </div>
                            <p class="mt-1.5 text-xs text-gray-600">
                              <span v-if="entity.relationship_type === 'parent'">
                                <strong>Parent Company:</strong> The controlling entity that owns this client
                              </span>
                              <span v-else-if="entity.relationship_type === 'subsidiary'">
                                <strong>Subsidiary:</strong> An entity controlled by this client (≥50% ownership)
                              </span>
                              <span v-else-if="entity.relationship_type === 'affiliate'">
                                <strong>Affiliate:</strong> An entity with significant influence (20-50% ownership)
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
                        
                        <!-- Ownership Percentage (for Subsidiary/Affiliate) -->
                        <div v-if="entity.relationship_type === 'subsidiary' || entity.relationship_type === 'affiliate'">
                          <label class="block text-xs font-medium text-gray-700 mb-1.5">
                            Ownership Percentage (%)
                            <span class="text-gray-400 font-normal text-xs ml-1">
                              ({{ entity.relationship_type === 'subsidiary' ? '≥50% required' : '20-50% required' }})
                            </span>
                            <span class="text-red-500">*</span>
                          </label>
                          <input
                            v-model.number="entity.ownership_percentage"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            placeholder="e.g., 75.5"
                            @blur="validateEntityOwnership(countryIndex, entityIndex)"
                          />
                          <p v-if="entity.ownership_error" class="mt-1 text-xs text-red-600">
                            {{ entity.ownership_error }}
                          </p>
                        </div>
                        
                        <!-- Control Type (auto-inferred, display-only) -->
                        <div v-if="entity.ownership_percentage !== null && entity.ownership_percentage !== undefined && entity.ownership_percentage > 0">
                          <label class="block text-xs font-medium text-gray-700 mb-1.5">Control Type</label>
                          <input
                            :value="getControlType(entity.ownership_percentage)"
                            type="text"
                            readonly
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-600"
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
      ownership_percentage?: number | null
      control_type?: string | null
      ownership_error?: string
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
          details: '',
          ownership_percentage: null,
          control_type: null
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

// Fields replicated from main form — always sync when parent sends new data (e.g. PIE from Section 3)
const REPLICATED_FROM_MAIN = [
  'clientName', 'ultimateParentCompany', 'location', 'clientType', 'clientIsPIE',
  'servicesDetails', 'natureOfEngagement', 'industrySector', 'website', 'engagementInvolvesAnotherParty'
]

// Watch for changes to initialData prop to update form (replicate main form context)
watch(() => props.initialData, (newData) => {
  if (newData) {
    Object.keys(newData).forEach(key => {
      const typedKey = key as keyof typeof newData
      const value = newData[typedKey]
      if (key === 'countries') {
        if (value && Array.isArray(value) && value.length > 0) {
          formData.value.countries = transformCountries(value)
        }
      } else if (REPLICATED_FROM_MAIN.includes(key)) {
        // Always replicate from main form so UI/UX state is consistent (e.g. PIE Yes in Section 3 → Client is PIE Yes here)
        if (value !== undefined && value !== null) {
          (formData.value as any)[key] = value
        }
      } else if (value && (!(formData.value as any)[key] || (formData.value as any)[key] === '')) {
        // Other fields: only fill when empty
        (formData.value as any)[key] = value
      }
    })
  }
}, { deep: true, immediate: true })

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
    details: '',
    ownership_percentage: null,
    control_type: null
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
    case 'affiliate':
      return 'Affiliate company name...'
    case 'sister':
      return 'Sister company name...'
    default:
      return 'Entity name...'
  }
}

function getControlType(ownership: number | null | undefined): string {
  if (!ownership || ownership === 0) return 'None'
  if (ownership >= 50) return 'Majority'
  if (ownership >= 20) return 'Significant Influence'
  return 'Minority'
}

function validateEntityOwnership(countryIndex: number, entityIndex: number) {
  const entity = formData.value.countries[countryIndex]?.entities[entityIndex]
  if (!entity) return
  
  // Clear previous error
  entity.ownership_error = undefined
  
  // Only validate if ownership is provided and relationship type requires it
  if (entity.relationship_type === 'subsidiary' || entity.relationship_type === 'affiliate') {
    const ownership = entity.ownership_percentage
    
    if (ownership === null || ownership === undefined || ownership === 0) {
      entity.ownership_error = 'Ownership percentage is required for ' + entity.relationship_type
      return false
    }
    
    if (entity.relationship_type === 'subsidiary') {
      if (ownership < 50) {
        entity.ownership_error = 'Subsidiary requires ≥50% ownership for control. If ownership is <50%, use "Affiliate" type instead.'
        return false
      }
      if (ownership > 100) {
        entity.ownership_error = 'Ownership percentage cannot exceed 100%'
        return false
      }
    } else if (entity.relationship_type === 'affiliate') {
      if (ownership < 20 || ownership >= 50) {
        entity.ownership_error = 'Affiliate requires 20-50% ownership (significant influence, not control). For ≥50%, use "Subsidiary" type.'
        return false
      }
    }
    
    // Auto-infer control type
    entity.control_type = getControlType(ownership)
  }
  
  return true
}

// Expose form data for parent component (export removed — Compliance does Excel separately)
defineExpose({
  formData
})
</script>
