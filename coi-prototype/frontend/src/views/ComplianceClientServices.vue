<template>
  <div class="min-h-screen bg-gray-100">
    <div class="max-w-7xl mx-auto px-6 py-6">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-semibold text-gray-900">Client Services Overview</h1>
              <p class="text-sm text-gray-500 mt-1">All services for existing clients (excluding costs/fees) - Requirement 7</p>
            </div>
            <div class="flex items-center gap-3">
              <button
                @click="showAllClients = !showAllClients"
                class="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
              >
                {{ showAllClients ? 'View Single Client' : 'View All Clients' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- Client Search -->
            <div v-if="showAllClients">
              <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Client</label>
              <input
                v-model="filters.client"
                type="text"
                placeholder="Search clients..."
                class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Service Type Filter -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Service Type</label>
              <input
                v-model="filters.service_type"
                type="text"
                placeholder="Filter by service type..."
                class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Date Range -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Date From</label>
              <input
                v-model="filters.date_from"
                type="date"
                class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Date To</label>
              <input
                v-model="filters.date_to"
                type="date"
                class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Single Client View -->
      <div v-if="!showAllClients" class="space-y-6">
        <!-- Client Selector -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Select Client</label>
          <select
            v-model="selectedClientId"
            @change="fetchClientServices"
            class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select a client --</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">
              {{ client.client_name }} ({{ client.client_code || 'N/A' }})
            </option>
          </select>
        </div>

        <!-- Client Services Timeline -->
        <div v-if="selectedClientId && clientServices.length > 0" class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="font-semibold text-gray-900">Services Timeline</h2>
            <p class="text-sm text-gray-500 mt-1">{{ clientServices.length }} service(s) found</p>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div v-for="service in clientServices" :key="service.request_id || service.id" 
                   class="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded-r-lg">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <span class="text-sm font-medium text-gray-900">{{ service.service_type }}</span>
                      <span :class="getStatusClass(service.status)" class="px-2 py-1 text-xs font-medium rounded">
                        {{ service.status }}
                      </span>
                      <span class="text-xs text-gray-500">{{ service.source }}</span>
                    </div>
                    <p v-if="service.service_description" class="text-sm text-gray-600 mb-2">
                      {{ service.service_description }}
                    </p>
                    <div class="grid grid-cols-2 gap-4 text-xs text-gray-500">
                      <div>
                        <span class="font-medium">Start:</span> {{ formatDate(service.start_date || service.created_at) }}
                      </div>
                      <div>
                        <span class="font-medium">End:</span> {{ formatDate(service.end_date) || 'Ongoing' }}
                      </div>
                      <div v-if="service.engagement_partner">
                        <span class="font-medium">Partner:</span> {{ service.engagement_partner }}
                      </div>
                      <div v-if="service.service_sub_category">
                        <span class="font-medium">Sub-category:</span> {{ service.service_sub_category }}
                      </div>
                    </div>
                  </div>
                  <div class="ml-4">
                    <span class="text-xs text-gray-400">{{ service.request_id || 'N/A' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- All Clients View -->
      <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="font-semibold text-gray-900">All Client Services</h2>
          <p class="text-sm text-gray-500 mt-1">{{ allServices.length }} service(s) across all clients</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub-Category</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="service in filteredAllServices" :key="service.id || service.request_id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ service.client_name }}</div>
                  <div class="text-xs text-gray-500">{{ service.client_code || 'N/A' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ service.service_type }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ service.service_sub_category || 'N/A' }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusClass(service.status)" class="px-2 py-1 text-xs font-medium rounded">
                    {{ service.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(service.start_date || service.created_at) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(service.end_date) || 'Ongoing' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ service.engagement_partner || 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="service.source === 'COI' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'" 
                        class="px-2 py-1 text-xs font-medium rounded">
                    {{ service.source }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button @click="viewService(service)" class="text-blue-600 hover:text-blue-900">View</button>
                </td>
              </tr>
              <tr v-if="filteredAllServices.length === 0">
                <td colspan="9" class="px-6 py-8 text-center text-gray-500">
                  No services found matching your filters.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()

const clients = ref<any[]>([])
const clientServices = ref<any[]>([])
const allServices = ref<any[]>([])
const loading = ref(false)
const showAllClients = ref(true)
const selectedClientId = ref('')

const filters = ref({
  client: '',
  service_type: '',
  date_from: '',
  date_to: '',
  status: '',
  partner: '',
  source: ''
})

const filteredAllServices = computed(() => {
  let result = allServices.value

  if (filters.value.client) {
    const search = filters.value.client.toLowerCase()
    result = result.filter(s => 
      s.client_name?.toLowerCase().includes(search) ||
      s.client_code?.toLowerCase().includes(search)
    )
  }

  if (filters.value.service_type) {
    const search = filters.value.service_type.toLowerCase()
    result = result.filter(s => 
      s.service_type?.toLowerCase().includes(search) ||
      s.service_sub_category?.toLowerCase().includes(search)
    )
  }

  if (filters.value.date_from) {
    result = result.filter(s => {
      const serviceDate = new Date(s.start_date || s.created_at)
      return serviceDate >= new Date(filters.value.date_from)
    })
  }

  if (filters.value.date_to) {
    result = result.filter(s => {
      const serviceDate = new Date(s.start_date || s.created_at)
      return serviceDate <= new Date(filters.value.date_to)
    })
  }

  return result
})

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    'Approved': 'bg-green-100 text-green-700',
    'Active': 'bg-blue-100 text-blue-700',
    'Completed': 'bg-gray-100 text-gray-700',
    'Pending': 'bg-yellow-100 text-yellow-700'
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function fetchClients() {
  try {
    const response = await api.get('/clients')
    clients.value = response.data
  } catch (error: any) {
    console.error('Error fetching clients:', error)
  }
}

async function fetchClientServices() {
  if (!selectedClientId.value) {
    clientServices.value = []
    return
  }
  loading.value = true
  try {
    const response = await api.get(`/compliance/client-services/${selectedClientId.value}`)
    clientServices.value = response.data.services || []
  } catch (error: any) {
    console.error('Error fetching client services:', error)
    alert(error.response?.data?.error || 'Failed to fetch client services')
  } finally {
    loading.value = false
  }
}

async function fetchAllClientServices() {
  loading.value = true
  try {
    const params: any = {}
    if (filters.value.client) params.client = filters.value.client
    if (filters.value.service_type) params.service_type = filters.value.service_type
    if (filters.value.date_from) params.date_from = filters.value.date_from
    if (filters.value.date_to) params.date_to = filters.value.date_to
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.partner) params.partner = filters.value.partner
    if (filters.value.source) params.source = filters.value.source

    const response = await api.get('/compliance/all-client-services', { params })
    allServices.value = response.data.services || []
  } catch (error: any) {
    console.error('Error fetching all client services:', error)
    alert(error.response?.data?.error || 'Failed to fetch services')
  } finally {
    loading.value = false
  }
}

function viewService(service: any) {
  if (service.request_id) {
    router.push(`/coi/request/${service.id || service.request_id}`)
  }
}

watch([() => filters.value.client, () => filters.value.service_type, () => filters.value.date_from, () => filters.value.date_to], () => {
  if (showAllClients.value) {
    fetchAllClientServices()
  }
})

onMounted(() => {
  fetchClients()
  fetchAllClientServices()
})
</script>
