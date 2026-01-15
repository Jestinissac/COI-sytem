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

    <!-- Countries and Entities Table -->
    <div v-if="internationalOperations" class="space-y-4">
      <!-- Add Country Button -->
      <div class="flex justify-end">
        <button
          type="button"
          @click="addCountry"
          class="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add Country
        </button>
      </div>

      <!-- Table View -->
      <div class="overflow-hidden border border-gray-200 rounded-lg">
        <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relationship</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity Name</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <!-- Country Rows -->
            <template v-for="(country, countryIndex) in countries" :key="countryIndex">
              <!-- Main Country Row -->
              <tr class="bg-blue-50">
                <td class="px-4 py-3 whitespace-nowrap">
                  <select
                    v-model="country.country_code"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select country...</option>
                    <option value="KWT">Kuwait</option>
                    <option value="SAU">Saudi Arabia</option>
                    <option value="ARE">United Arab Emirates</option>
                    <option value="USA">United States</option>
                    <option value="GBR">United Kingdom</option>
                  </select>
                </td>
                <td colspan="3" class="px-4 py-3">
                  <button
                    type="button"
                    @click="addEntity(countryIndex)"
                    class="flex items-center text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Add Entity
                  </button>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right">
                  <button
                    type="button"
                    @click="removeCountry(countryIndex)"
                    class="text-red-600 hover:text-red-700"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </td>
              </tr>
              
              <!-- Entity Rows (Sub-rows) -->
              <tr v-for="(entity, entityIndex) in country.entities" :key="entityIndex" class="bg-gray-50">
                <td class="px-4 py-2"></td>
                <td class="px-4 py-2">
                  <select
                    v-model="entity.relationship_type"
                    class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select...</option>
                    <option value="parent">Parent Company</option>
                    <option value="subsidiary">Subsidiary</option>
                    <option value="sister">Sister Company</option>
                  </select>
                </td>
                <td class="px-4 py-2">
                  <input
                    v-model="entity.name"
                    type="text"
                    :placeholder="getEntityPlaceholder(entity.relationship_type)"
                    class="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </td>
                <td class="px-4 py-2">
                  <input
                    v-model="entity.details"
                    type="text"
                    placeholder="Details..."
                    class="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </td>
                <td class="px-4 py-2 whitespace-nowrap text-right">
                  <button
                    type="button"
                    @click="removeEntity(countryIndex, entityIndex)"
                    class="text-red-600 hover:text-red-700"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </td>
              </tr>
              
              <!-- Empty Entity State -->
              <tr v-if="!country.entities || country.entities.length === 0" class="bg-gray-50">
                <td class="px-4 py-2"></td>
                <td colspan="4" class="px-4 py-2 text-sm text-gray-500 italic">
                  No related entities added yet
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <!-- Empty State -->
        <div v-if="countries.length === 0"
             class="text-center py-12 text-sm text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>No countries added yet. Click "Add Country" to get started.</p>
        </div>
      </div>

      <!-- Global Clearance Status -->
      <div>
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const internationalOperations = ref(false)
const globalClearanceStatus = ref('Not Required')
const groupStructure = ref('has_parent')

const countries = ref<Array<{
  country_code: string
  entities: Array<{
    relationship_type: string
    name: string
    details: string
  }>
}>>([])

function addCountry() {
  countries.value.push({
    country_code: '',
    entities: []
  })
}

function removeCountry(index: number) {
  countries.value.splice(index, 1)
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
