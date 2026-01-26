<template>
  <div class="space-y-4">
    <!-- Header with Add Button -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Prospects</h3>
        <p class="text-sm text-gray-500">Manage your sales pipeline prospects</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Add Prospect
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-gray-50 rounded-lg p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Search -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Search</label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Search prospects..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Status</label>
          <select
            v-model="filters.status"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Converted">Converted</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <!-- Existing Client Filter -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Existing Client</label>
          <select
            v-model="filters.prmsSynced"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All</option>
            <option value="synced">Existing Client</option>
            <option value="not_synced">New Prospect</option>
          </select>
        </div>

        <!-- Quick Filters -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Quick Filters</label>
          <div class="flex flex-wrap gap-2">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                v-model="filters.prospectsOnly"
                class="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="text-xs text-gray-700">Prospects Only</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Prospects Table -->
    <div v-else class="overflow-x-auto rounded-lg border border-gray-200">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prospect Name</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Source</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="prospect in filteredProspects" :key="prospect.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ prospect.prospect_name }}</div>
              <div v-if="prospect.commercial_registration" class="text-xs text-gray-500">
                CR: {{ prospect.commercial_registration }}
              </div>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
              {{ prospect.industry || 'N/A' }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
              {{ prospect.lead_source_name || 'Unknown' }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
              <span :class="getStatusClass(prospect.status)" class="px-2 py-1 text-xs font-medium rounded">
                {{ prospect.status }}
              </span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(prospect.created_at) }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
              <button @click="viewProspect(prospect)" class="text-blue-600 hover:text-blue-900">View</button>
              <button v-if="prospect.status === 'Active'" @click="startCOIRequest(prospect)" class="text-green-600 hover:text-green-900">COI Request</button>
            </td>
          </tr>
          <tr v-if="filteredProspects.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-gray-500">
              No prospects found matching your filters.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-4 gap-4">
      <div class="bg-gray-50 rounded-lg p-3 text-center">
        <p class="text-2xl font-bold text-gray-900">{{ prospects.length }}</p>
        <p class="text-xs text-gray-500">Total Prospects</p>
      </div>
      <div class="bg-green-50 rounded-lg p-3 text-center">
        <p class="text-2xl font-bold text-green-600">{{ activeCount }}</p>
        <p class="text-xs text-gray-500">Active</p>
      </div>
      <div class="bg-blue-50 rounded-lg p-3 text-center">
        <p class="text-2xl font-bold text-blue-600">{{ convertedCount }}</p>
        <p class="text-xs text-gray-500">Converted</p>
      </div>
      <div class="bg-gray-100 rounded-lg p-3 text-center">
        <p class="text-2xl font-bold text-gray-600">{{ inactiveCount }}</p>
        <p class="text-xs text-gray-500">Inactive</p>
      </div>
    </div>

    <!-- Create Prospect Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showCreateModal = false">
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Create New Prospect</h3>
          <button @click="showCreateModal = false" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="px-6 py-4">
          <form @submit.prevent="createProspect" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Prospect Name *</label>
              <input v-model="newProspect.prospect_name" type="text" required class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Commercial Registration</label>
                <input v-model="newProspect.commercial_registration" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select v-model="newProspect.industry" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="">Select industry...</option>
                  <option value="Financial Services">Financial Services</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Technology">Technology</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Energy">Energy</option>
                  <option value="Government">Government</option>
                  <option value="Education">Education</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div class="flex gap-3 justify-end pt-4 border-t">
              <button type="button" @click="showCreateModal = false" class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                Cancel
              </button>
              <button type="submit" :disabled="creating" class="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                {{ creating ? 'Creating...' : 'Create Prospect' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()

const prospects = ref<any[]>([])
const loading = ref(false)
const creating = ref(false)
const showCreateModal = ref(false)

const filters = ref({
  search: '',
  prospectsOnly: false,
  status: '',
  prmsSynced: ''
})

const newProspect = ref({
  prospect_name: '',
  commercial_registration: '',
  industry: ''
})

// Computed
const filteredProspects = computed(() => {
  let result = prospects.value

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    result = result.filter(p => 
      p.prospect_name?.toLowerCase().includes(search) ||
      p.commercial_registration?.toLowerCase().includes(search) ||
      p.industry?.toLowerCase().includes(search)
    )
  }

  if (filters.value.status) {
    result = result.filter(p => p.status === filters.value.status)
  }

  if (filters.value.prmsSynced === 'synced') {
    result = result.filter(p => p.prms_synced)
  } else if (filters.value.prmsSynced === 'not_synced') {
    result = result.filter(p => !p.prms_synced)
  }

  if (filters.value.prospectsOnly) {
    result = result.filter(p => !p.client_id)
  }

  return result
})

const activeCount = computed(() => prospects.value.filter(p => p.status === 'Active').length)
const convertedCount = computed(() => prospects.value.filter(p => p.status === 'Converted').length)
const inactiveCount = computed(() => prospects.value.filter(p => p.status === 'Inactive').length)

// Methods
async function fetchProspects() {
  loading.value = true
  try {
    const response = await api.get('/prospects')
    prospects.value = response.data || []
  } catch (error) {
    console.error('Failed to fetch prospects:', error)
  } finally {
    loading.value = false
  }
}

async function createProspect() {
  if (!newProspect.value.prospect_name.trim()) return
  
  creating.value = true
  try {
    await api.post('/prospects', {
      prospect_name: newProspect.value.prospect_name,
      commercial_registration: newProspect.value.commercial_registration || null,
      industry: newProspect.value.industry || null,
      status: 'Active'
    })
    
    showCreateModal.value = false
    newProspect.value = { prospect_name: '', commercial_registration: '', industry: '' }
    await fetchProspects()
  } catch (error) {
    console.error('Failed to create prospect:', error)
  } finally {
    creating.value = false
  }
}

function viewProspect(prospect: any) {
  router.push(`/coi/prospects?view=${prospect.id}`)
}

function startCOIRequest(prospect: any) {
  router.push(`/coi/request/new?prospect=${prospect.id}&client_name=${encodeURIComponent(prospect.prospect_name)}`)
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    'Active': 'bg-green-100 text-green-800',
    'Converted': 'bg-blue-100 text-blue-800',
    'Inactive': 'bg-gray-100 text-gray-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

onMounted(() => {
  fetchProspects()
})
</script>
