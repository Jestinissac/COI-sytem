<template>
  <div class="space-y-6">
    <!-- Toggle for International Operations -->
    <div>
      <label class="flex items-center">
        <input 
          type="checkbox" 
          v-model="internationalOperations"
          class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <span class="ml-2 text-sm font-medium text-gray-700">Client has international operations</span>
      </label>
    </div>

    <!-- Countries List -->
    <div v-if="internationalOperations" class="space-y-4">
      <!-- Add Country Button -->
      <button
        type="button"
        @click="addCountry"
        class="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Add Country
      </button>

      <!-- Country Cards -->
      <div v-for="(country, countryIndex) in countries" :key="countryIndex" 
           class="border border-gray-200 rounded-lg overflow-hidden">
        <!-- Country Header (Collapsible) -->
        <div 
          @click="toggleCountry(countryIndex)"
          class="px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
        >
          <div class="flex items-center space-x-3">
            <svg 
              :class="['w-5 h-5 text-gray-400 transition-transform', country.expanded ? 'rotate-90' : '']"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
            <span class="font-medium text-gray-900">
              {{ getCountryName(country.country_code) || 'Select Country' }}
            </span>
            <span v-if="country.entities && country.entities.length > 0" 
                  class="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              {{ country.entities.length }} {{ country.entities.length === 1 ? 'entity' : 'entities' }}
            </span>
          </div>
          <button
            type="button"
            @click.stop="removeCountry(countryIndex)"
            class="text-red-600 hover:text-red-700 p-1"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Country Content (Expandable) -->
        <div v-show="country.expanded" class="p-4 space-y-4 bg-white">
          <!-- Country Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Country <span class="text-red-500">*</span></label>
            <select
              v-model="country.country_code"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          <!-- Entities List -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="block text-sm font-medium text-gray-700">Related Entities</label>
              <button
                type="button"
                @click="addEntity(countryIndex)"
                class="flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Add Entity
              </button>
            </div>

            <!-- Entity Items -->
            <div v-for="(entity, entityIndex) in country.entities" :key="entityIndex"
                 class="p-3 border border-gray-200 rounded-md bg-gray-50">
              <div class="space-y-2">
                <!-- Relationship Type -->
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Relationship Type <span class="text-red-500">*</span></label>
                  <select
                    v-model="entity.relationship_type"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select relationship...</option>
                    <option value="parent">Parent Company</option>
                    <option value="subsidiary">Subsidiary</option>
                    <option value="sister">Sister Company</option>
                  </select>
                  <p class="mt-1 text-xs text-gray-500">
                    <span v-if="entity.relationship_type === 'parent'">The controlling entity that owns this client</span>
                    <span v-else-if="entity.relationship_type === 'subsidiary'">An entity controlled by this client</span>
                    <span v-else-if="entity.relationship_type === 'sister'">Another entity sharing the same parent as this client</span>
                  </p>
                </div>
                
                <!-- Entity Name -->
                <div>
                  <input
                    v-model="entity.name"
                    type="text"
                    :placeholder="getEntityPlaceholder(entity.relationship_type)"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
                
                <!-- Details -->
                <div>
                  <textarea
                    v-model="entity.details"
                    rows="2"
                    placeholder="Additional details (optional)..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
                
                <!-- Remove Button -->
                <div class="flex justify-end">
                  <button
                    type="button"
                    @click="removeEntity(countryIndex, entityIndex)"
                    class="text-red-600 hover:text-red-700 p-1"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="!country.entities || country.entities.length === 0" 
                 class="text-center py-4 text-sm text-gray-500 border border-dashed border-gray-300 rounded-md">
              No related entities added yet. Click "+ Add Entity" to add a parent company, subsidiary, or sister company.
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State for Countries -->
      <div v-if="countries.length === 0"
           class="text-center py-8 text-sm text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
        <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p>No countries added yet.</p>
        <p class="text-xs mt-1">Click "Add Country" to get started.</p>
      </div>
    </div>

    <!-- Global Clearance Status -->
    <div v-if="internationalOperations">
      <label class="block text-sm font-medium text-gray-700 mb-1.5">Global Clearance Status</label>
      <select 
        v-model="globalClearanceStatus"
        class="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
import { ref } from 'vue'

const internationalOperations = ref(false)
const globalClearanceStatus = ref('Not Required')
const groupStructure = ref('has_parent') // Can be 'standalone', 'has_parent', 'research_required'

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
</script>
