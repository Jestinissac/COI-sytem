<template>
  <div class="min-h-screen bg-gray-100">
    <div class="max-w-7xl mx-auto px-6 py-6">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-semibold text-gray-900">Prospect Management</h1>
              <p class="text-sm text-gray-500 mt-1">Manage prospects separately from clients</p>
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
        </div>

        <!-- Filters - Requirement 3: Prospect Management -->
        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- Search -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Search</label>
              <input
                v-model="filters.search"
                type="text"
                placeholder="Search prospects..."
                class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Prospects Only Filter -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Filter</label>
              <div class="space-y-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="filters.prospectsOnly"
                    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span class="text-sm text-gray-700">Prospects Only</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="filters.existingClientsOnly"
                    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span class="text-sm text-gray-700">Linked to Existing Clients</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="filters.convertedOnly"
                    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span class="text-sm text-gray-700">Converted Prospects</span>
                </label>
              </div>
            </div>

            <!-- Status Filter -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Status</label>
              <select
                v-model="filters.status"
                class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <p class="text-xs text-gray-500 mb-1">Synced = linked to PRMS client (prototype: COI client list).</p>
              <select
                v-model="filters.prmsSynced"
                class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="synced">Existing Client</option>
                <option value="not_synced">New Prospect</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Prospects List -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prospect Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linked Client</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Code</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group Services</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="prospect in filteredProspects" :key="prospect.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ prospect.prospect_name }}</div>
                  <div v-if="prospect.commercial_registration" class="text-xs text-gray-500">
                    CR: {{ prospect.commercial_registration }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ prospect.industry || 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span v-if="prospect.client_id" class="text-blue-600">Linked</span>
                  <span v-else class="text-gray-400">Standalone</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span v-if="prospect.prms_client_code" class="flex items-center gap-1">
                    {{ prospect.prms_client_code }}
                    <span v-if="prospect.prms_synced" class="text-green-600" title="Synced with PRMS">✓</span>
                  </span>
                  <span v-else class="text-gray-400">N/A</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusClass(prospect.status)" class="px-2 py-1 text-xs font-medium rounded">
                    {{ prospect.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                  <span v-if="prospect.group_level_services && JSON.parse(prospect.group_level_services || '[]').length > 0">
                    {{ JSON.parse(prospect.group_level_services).length }} service(s)
                  </span>
                  <span v-else class="text-gray-400">None</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button @click="viewProspect(prospect)" class="text-blue-600 hover:text-blue-900">View</button>
                  <button v-if="prospect.status === 'Active'" @click="convertToClient(prospect)" class="text-green-600 hover:text-green-900">Convert</button>
                </td>
              </tr>
              <tr v-if="filteredProspects.length === 0">
                <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                  No prospects found matching your filters.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create Prospect Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showCreateModal = false">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
              <input v-model="newProspect.prospect_name" type="text" required class="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Commercial Registration</label>
                <input v-model="newProspect.commercial_registration" type="text" class="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <input v-model="newProspect.industry" type="text" class="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">PRMS Client Code (if exists)</label>
              <p class="text-xs text-gray-500 mb-1">In prototype, checks COI client list; in production this will check PRMS.</p>
              <input v-model="newProspect.prms_client_code" type="text" class="w-full px-3 py-2 border rounded-lg" 
                     placeholder="Check if client exists in PRMS" />
              <button type="button" @click="checkPRMSClient" class="mt-2 text-sm text-blue-600 hover:text-blue-800">
                Check PRMS
              </button>
            </div>
            
            <!-- Lead Source Attribution (CRM Feature) -->
            <div class="border-t pt-4 mt-4">
              <h4 class="text-sm font-semibold text-gray-900 mb-3">Lead Source Attribution</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Lead Source</label>
                  <select v-model="newProspect.lead_source_id" class="w-full px-3 py-2 border rounded-lg">
                    <option :value="null">Auto-detect based on role</option>
                    <optgroup label="Referrals">
                      <option v-for="source in leadSourcesByCategory.referral" :key="source.id" :value="source.id">
                        {{ source.source_name }}
                      </option>
                    </optgroup>
                    <optgroup label="System">
                      <option v-for="source in leadSourcesByCategory.system" :key="source.id" :value="source.id">
                        {{ source.source_name }}
                      </option>
                    </optgroup>
                    <optgroup label="Outbound">
                      <option v-for="source in leadSourcesByCategory.outbound" :key="source.id" :value="source.id">
                        {{ source.source_name }}
                      </option>
                    </optgroup>
                  </select>
                  <p class="text-xs text-gray-500 mt-1">
                    <span v-if="isPartnerOrDirector" class="text-green-600">
                      Will auto-set to "Internal Referral" if not selected
                    </span>
                    <span v-else>
                      Optional - system will auto-detect
                    </span>
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Referred by Client</label>
                  <select v-model="newProspect.referred_by_client_id" class="w-full px-3 py-2 border rounded-lg">
                    <option :value="null">None (not a client referral)</option>
                    <option v-for="client in clients" :key="client.id" :value="client.id">
                      {{ client.client_name }}
                    </option>
                  </select>
                  <p class="text-xs text-gray-500 mt-1">
                    If selected, lead source auto-sets to "Client Referral"
                  </p>
                </div>
              </div>
              <div class="mt-3">
                <label class="block text-sm font-medium text-gray-700 mb-1">Source Notes</label>
                <textarea v-model="newProspect.source_notes" rows="2" class="w-full px-3 py-2 border rounded-lg text-sm"
                          placeholder="Optional: How did this prospect come to you?"></textarea>
              </div>
            </div>
            
            <div class="flex gap-3 justify-end pt-4 border-t">
              <button type="button" @click="showCreateModal = false" class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
              <button type="submit" :disabled="creating" class="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
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
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const prospects = ref<any[]>([])
const clients = ref<any[]>([])
const leadSources = ref<any[]>([])
const loading = ref(false)
const creating = ref(false)
const showCreateModal = ref(false)

const filters = ref({
  search: '',
  prospectsOnly: false,
  existingClientsOnly: false,
  convertedOnly: false,
  status: '',
  prmsSynced: ''
})

const newProspect = ref({
  prospect_name: '',
  commercial_registration: '',
  industry: '',
  prms_client_code: '',
  lead_source_id: null as number | null,
  referred_by_client_id: null as number | null,
  source_notes: ''
})

// Computed properties
const isPartnerOrDirector = computed(() => {
  return ['Partner', 'Director'].includes(authStore.user?.role || '')
})

const leadSourcesByCategory = computed(() => {
  const grouped: Record<string, any[]> = {
    referral: [],
    system: [],
    outbound: [],
    other: []
  }
  
  leadSources.value.forEach((source: any) => {
    const category = source.source_category || 'other'
    if (grouped[category]) {
      grouped[category].push(source)
    } else {
      grouped.other.push(source)
    }
  })
  
  return grouped
})

const filteredProspects = computed(() => {
  let result = prospects.value

  // Search filter
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    result = result.filter(p => 
      p.prospect_name?.toLowerCase().includes(search) ||
      p.industry?.toLowerCase().includes(search) ||
      p.commercial_registration?.toLowerCase().includes(search) ||
      p.prms_client_code?.toLowerCase().includes(search)
    )
  }

  // Prospects only (standalone, not linked to clients)
  if (filters.value.prospectsOnly) {
    result = result.filter(p => !p.client_id)
  }

  // Existing clients only (linked to clients)
  if (filters.value.existingClientsOnly) {
    result = result.filter(p => p.client_id)
  }

  // Converted only
  if (filters.value.convertedOnly) {
    result = result.filter(p => p.status === 'Converted')
  }

  // Status filter
  if (filters.value.status) {
    result = result.filter(p => p.status === filters.value.status)
  }

  // PRMS sync filter
  if (filters.value.prmsSynced === 'synced') {
    result = result.filter(p => p.prms_synced === 1)
  } else if (filters.value.prmsSynced === 'not_synced') {
    result = result.filter(p => !p.prms_synced || p.prms_synced === 0)
  }

  return result
})

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    'Active': 'bg-green-100 text-green-700',
    'Converted': 'bg-blue-100 text-blue-700',
    'Inactive': 'bg-gray-100 text-gray-700'
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

async function fetchProspects() {
  loading.value = true
  try {
    const response = await api.get('/prospects')
    prospects.value = response.data
  } catch (error: any) {
    console.error('Error fetching prospects:', error)
    alert(error.response?.data?.error || 'Failed to fetch prospects')
  } finally {
    loading.value = false
  }
}

async function createProspect() {
  creating.value = true
  try {
    await api.post('/prospects', newProspect.value)
    await fetchProspects()
    showCreateModal.value = false
    newProspect.value = {
      prospect_name: '',
      commercial_registration: '',
      industry: '',
      prms_client_code: '',
      lead_source_id: null,
      referred_by_client_id: null,
      source_notes: ''
    }
  } catch (error: any) {
    console.error('Error creating prospect:', error)
    alert(error.response?.data?.error || 'Failed to create prospect')
  } finally {
    creating.value = false
  }
}

async function checkPRMSClient() {
  if (!newProspect.value.prms_client_code) {
    alert('Please enter a PRMS client code')
    return
  }
  try {
    const response = await api.get('/prospects/prms/check', {
      params: { prms_client_code: newProspect.value.prms_client_code }
    })
    if (response.data.exists) {
      alert(`Client exists in PRMS. Client ID: ${response.data.client_id}`)
    } else {
      alert('Client not found in PRMS. This will be created as a standalone prospect.')
    }
  } catch (error: any) {
    console.error('Error checking PRMS client:', error)
    alert(error.response?.data?.error || 'Failed to check PRMS client')
  }
}

function viewProspect(prospect: any) {
  router.push(`/coi/prospect/${prospect.id}`)
}

function convertToClient(prospect: any) {
  if (confirm(`Convert prospect "${prospect.prospect_name}" to client?`)) {
    // Navigate to conversion flow
    router.push(`/coi/prospect/${prospect.id}/convert`)
  }
}

async function fetchLeadSources() {
  try {
    const res = await api.get('/prospects/lead-sources').catch(() => ({ data: [] }))
    leadSources.value = res?.data ?? []
  } catch {
    leadSources.value = []
  }
}

async function fetchClients() {
  try {
    const res = await api.get('/integration/clients').catch(() => ({ data: [] }))
    clients.value = res?.data ?? []
  } catch {
    clients.value = []
  }
}

onMounted(async () => {
  await Promise.all([
    fetchProspects(),
    fetchLeadSources(),
    fetchClients()
  ])
})
</script>
