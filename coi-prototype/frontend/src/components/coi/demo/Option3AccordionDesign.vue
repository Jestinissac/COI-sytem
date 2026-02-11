<template>
  <div class="space-y-6">
    <!-- Toggle for International Operations -->
    <div class="flex items-center justify-between">
      <label class="flex items-center">
        <input 
          type="checkbox" 
          v-model="internationalOperations"
          class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-primary-500"
        />
        <span class="ml-2 text-sm font-medium text-gray-700">Client has international operations</span>
      </label>
      <button
        v-if="!internationalOperations || countries.length === 0"
        type="button"
        @click="loadSampleData"
        class="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
      >
        Load Sample Data
      </button>
    </div>

    <!-- Countries Accordion -->
    <div v-if="internationalOperations" class="space-y-3">
      <!-- Add Country Button -->
      <button
        type="button"
        @click="addCountry"
        class="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-colors"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Add Country
      </button>

      <!-- Country Accordion Items -->
      <div v-for="(country, countryIndex) in countries" :key="countryIndex"
           class="border border-gray-200 rounded-lg overflow-hidden">
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
                    <span v-if="country.entities.some(e => e.relationship_type === 'parent')" class="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">Parent</span>
                    <span v-if="country.entities.some(e => e.relationship_type === 'subsidiary')" class="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">Subsidiary</span>
                    <span v-if="country.entities.some(e => e.relationship_type === 'sister')" class="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Sister</span>
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
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select country...</option>
                <option value="KWT">Kuwait</option>
                <option value="SAU">Saudi Arabia</option>
                <option value="ARE">United Arab Emirates</option>
                <option value="USA">United States</option>
                <option value="GBR">United Kingdom</option>
              </select>
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
                    <span v-if="groupStructure === 'has_parent'">
                      This client has a parent company. You can add the parent company or sister companies (entities sharing the same parent).
                    </span>
                    <span v-else>
                      Add related entities: parent companies, subsidiaries, or sister companies (entities sharing the same parent).
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <!-- Entities Section -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-gray-900">
                  Related Entities
                </h4>
                <button
                  type="button"
                  @click="addEntity(countryIndex)"
                  class="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
                >
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Add Entity
                </button>
              </div>

              <!-- Entity Cards -->
              <div class="space-y-3">
                <div v-for="(entity, entityIndex) in country.entities" :key="entityIndex"
                     class="relative p-4 bg-white border-l-4 rounded-lg shadow-sm transition-all hover:shadow-md"
                     :class="{
                       'border-purple-500 bg-purple-50': entity.relationship_type === 'parent',
                       'border-primary-500 bg-blue-50': entity.relationship_type === 'subsidiary',
                       'border-green-500 bg-green-50': entity.relationship_type === 'sister',
                       'border-gray-300 bg-gray-50': !entity.relationship_type
                     }">
                  <div class="space-y-3">
                    <!-- Relationship Type Badge & Selector -->
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <label class="block text-xs font-medium text-gray-700 mb-1.5">Relationship Type <span class="text-red-500">*</span></label>
                        <div class="flex items-center space-x-2">
                          <select
                            v-model="entity.relationship_type"
                            class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white font-medium"
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
                        class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white font-medium"
                      />
                    </div>
                    
                    <!-- Details -->
                    <div>
                      <label class="block text-xs font-medium text-gray-700 mb-1.5">Additional Details</label>
                      <textarea
                        v-model="entity.details"
                        rows="3"
                        placeholder="Registration number, address, business activities, etc."
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
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

                <!-- Empty State -->
                <div v-if="!country.entities || country.entities.length === 0" 
                     class="p-4 text-center text-sm text-gray-500 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
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
      <!-- Empty State for Countries -->
      <div v-if="countries.length === 0"
           class="text-center py-12 text-sm text-gray-500 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p class="font-medium text-gray-700 mb-1">No countries added yet</p>
        <p class="text-xs">Click "Add Country" above to get started.</p>
      </div>
    </div>

    <!-- Global Clearance Status -->
    <div v-if="internationalOperations">
      <label class="block text-sm font-medium text-gray-700 mb-1.5">Global Clearance Status</label>
      <select 
        v-model="globalClearanceStatus"
        class="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <option>Not Required</option>
        <option>Pending</option>
        <option>Approved</option>
        <option>Rejected</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const internationalOperations = ref(false)
const globalClearanceStatus = ref('Not Required')
const groupStructure = ref('has_parent')

const countries = ref<Array<{
  country_code: string
  expanded: boolean
  entities: Array<{
    relationship_type: string
    name: string
    details: string
  }>
}>>([])

function getCountryName(code: string) {
  const countryNames: Record<string, string> = {
    'KWT': 'Kuwait',
    'SAU': 'Saudi Arabia',
    'ARE': 'United Arab Emirates',
    'USA': 'United States',
    'GBR': 'United Kingdom'
  }
  return countryNames[code] || ''
}

function addCountry() {
  countries.value.push({
    country_code: '',
    expanded: true,
    entities: []
  })
}

function removeCountry(index: number) {
  countries.value.splice(index, 1)
}

function toggleCountry(index: number) {
  countries.value[index].expanded = !countries.value[index].expanded
}

function addEntity(countryIndex: number) {
  if (!countries.value[countryIndex].entities) {
    countries.value[countryIndex].entities = []
  }
  // Smart default based on group structure
  let defaultRelationship = ''
  if (groupStructure.value === 'has_parent') {
    defaultRelationship = 'parent'
  } else if (groupStructure.value === 'standalone') {
    defaultRelationship = 'subsidiary'
  }
  
  countries.value[countryIndex].entities.push({
    relationship_type: defaultRelationship,
    name: '',
    details: ''
  })
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

function removeEntity(countryIndex: number, entityIndex: number) {
  countries.value[countryIndex].entities.splice(entityIndex, 1)
}

// Auto-load sample data on mount for demo purposes
onMounted(() => {
  // Uncomment the line below to auto-load sample data
  // loadSampleData()
})

function loadSampleData() {
  internationalOperations.value = true
  countries.value = [
    {
      country_code: 'KWT',
      expanded: true,
      entities: [
        {
          relationship_type: 'parent',
          name: 'Al-Noor Holding Company K.S.C.C',
          details: 'Parent company registered in Kuwait. Main holding entity controlling multiple subsidiaries across GCC region.'
        },
        {
          relationship_type: 'sister',
          name: 'Al-Noor Trading Company W.L.L',
          details: 'Sister company operating in trading and distribution. Shares same parent as client.'
        }
      ]
    },
    {
      country_code: 'SAU',
      expanded: true,
      entities: [
        {
          relationship_type: 'subsidiary',
          name: 'Al-Noor Manufacturing Saudi Arabia Ltd.',
          details: 'Subsidiary established in 2020. Manufacturing operations in Riyadh Industrial Zone. Registration: 1234567890'
        },
        {
          relationship_type: 'subsidiary',
          name: 'Al-Noor Services KSA',
          details: 'Service subsidiary providing technical support and maintenance services across Saudi Arabia.'
        }
      ]
    },
    {
      country_code: 'ARE',
      expanded: false,
      entities: [
        {
          relationship_type: 'subsidiary',
          name: 'Al-Noor UAE Free Zone Company',
          details: 'Free zone entity in Dubai. Established for regional operations and logistics hub. License: FZ-2021-4567'
        },
        {
          relationship_type: 'sister',
          name: 'Al-Noor Real Estate Development LLC',
          details: 'Sister company in UAE focusing on real estate development projects. Shares parent with client.'
        },
        {
          relationship_type: 'sister',
          name: 'Al-Noor Investment Holdings LLC',
          details: 'Investment holding company managing regional portfolio. Sister entity under same parent structure.'
        }
      ]
    },
    {
      country_code: 'USA',
      expanded: false,
      entities: [
        {
          relationship_type: 'subsidiary',
          name: 'Al-Noor Americas Inc.',
          details: 'US subsidiary incorporated in Delaware. Established for North American market expansion. EIN: 12-3456789'
        }
      ]
    }
  ]
}
</script>
