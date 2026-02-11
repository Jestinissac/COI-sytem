<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">Service Catalog Management</h1>
            <p class="text-sm text-gray-500 mt-1">Configure service catalogs for each entity (LC/NC interface)</p>
          </div>
          <div class="flex items-center gap-3">
            <!-- Entity Selector -->
            <select
              v-model="selectedEntityCode"
              @change="loadEntityCatalog"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select entity...</option>
              <option v-for="entity in entities" :key="entity.id" :value="entity.entity_code">
                {{ entity.entity_display_name || entity.entity_name }}
              </option>
            </select>
            
            <button
              v-if="selectedEntityCode"
              @click="showBulkImportModal = true"
              class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              Import
            </button>
            
            <button
              v-if="selectedEntityCode"
              @click="exportCatalog"
              class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Export
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-6">
      <div v-if="!selectedEntityCode" class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p class="text-gray-500">Please select an entity to manage its service catalog</p>
      </div>

      <div v-else class="grid grid-cols-12 gap-6">
        <!-- Left: Global Catalog Reference (Read-only) -->
        <div class="col-span-4">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
            <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-900">Global Catalog (Reference)</h3>
              <span class="text-xs text-gray-500">Read-only</span>
            </div>
            <div class="p-4">
              <input
                v-model="globalSearchQuery"
                type="text"
                placeholder="Search services..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-4 focus:ring-2 focus:ring-primary-500"
              />
              <div class="space-y-2 max-h-96 overflow-y-auto">
                <div
                  v-for="service in filteredGlobalServices"
                  :key="service.id"
                  class="p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                  :class="{ 'bg-blue-50 border-blue-300': isServiceEnabled(service.service_code) }"
                  @click="toggleService(service)"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <p class="text-xs font-medium text-gray-900">{{ service.service_name }}</p>
                      <p class="text-xs text-gray-500">{{ service.category }}</p>
                    </div>
                    <svg
                      v-if="isServiceEnabled(service.service_code)"
                      class="w-4 h-4 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Center: Entity Catalog (Enabled Services) -->
        <div class="col-span-5">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-900">
                {{ selectedEntityName }} Catalog
              </h3>
              <div class="flex items-center gap-2">
                <button
                  @click="showAddCustomModal = true"
                  class="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-md hover:bg-purple-700"
                >
                  + Custom Service
                </button>
                <button
                  @click="showBulkOperations = true"
                  class="px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded-md hover:bg-gray-700"
                >
                  Bulk Actions
                </button>
              </div>
            </div>
            <div class="p-4">
              <input
                v-model="entitySearchQuery"
                type="text"
                placeholder="Search enabled services..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-4 focus:ring-2 focus:ring-primary-500"
              />
              
              <div v-if="loading" class="text-center py-8">
                <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="service in filteredEntityServices"
                  :key="service.id || service.service_code"
                  class="p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <p class="text-sm font-medium text-gray-900">
                        {{ service.service_name }}
                      </p>
                      <p class="text-xs text-gray-500">{{ service.category }}</p>
                      <p v-if="service.description" class="text-xs text-gray-400 mt-1">{{ service.description }}</p>
                      <span
                        v-if="service.service_code === 'custom'"
                        class="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700"
                      >
                        Custom
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        @click="editService(service)"
                        class="p-1 text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button
                        @click="disableService(service)"
                        class="p-1 text-red-600 hover:text-red-900"
                        title="Disable"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div v-if="filteredEntityServices.length === 0" class="text-center py-8 text-gray-500">
                  <p>No services enabled for this entity.</p>
                  <p class="text-xs mt-2">Click services from Global Catalog to enable them.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: History & Info -->
        <div class="col-span-3">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
            <div class="px-4 py-3 border-b border-gray-200">
              <h3 class="text-sm font-semibold text-gray-900">Change History</h3>
            </div>
            <div class="p-4">
              <div v-if="loadingHistory" class="text-center py-4">
                <div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
              <div v-else class="space-y-3 max-h-96 overflow-y-auto">
                <div
                  v-for="entry in history"
                  :key="entry.id"
                  class="text-xs border-l-2 pl-3"
                  :class="getHistoryBorderColor(entry.action)"
                >
                  <p class="font-medium text-gray-900">{{ entry.action }}</p>
                  <p class="text-gray-500">{{ entry.service_code || 'Custom Service' }}</p>
                  <p class="text-gray-400">{{ formatDate(entry.created_at) }}</p>
                  <p v-if="entry.changed_by_name" class="text-gray-400">by {{ entry.changed_by_name }}</p>
                </div>
                <div v-if="history.length === 0" class="text-gray-400 text-xs text-center py-4">
                  No history yet
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Custom Service Modal -->
    <div v-if="showAddCustomModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Add Custom Service</h3>
        </div>
        <form @submit.prevent="saveCustomService" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category <span class="text-red-500">*</span></label>
            <input
              v-model="customServiceForm.category"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Advisory - Custom"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Service Name <span class="text-red-500">*</span></label>
            <input
              v-model="customServiceForm.service_name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              v-model="customServiceForm.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <button
              type="button"
              @click="showAddCustomModal = false"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : 'Add Service' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Bulk Operations Modal -->
    <div v-if="showBulkOperations" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Bulk Operations</h3>
        </div>
        <div class="p-6 space-y-4">
          <button
            @click="copyFromAnotherEntity"
            class="w-full px-4 py-3 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 text-left"
          >
            Copy from Another Entity
          </button>
          <button
            @click="bulkEnable"
            class="w-full px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 text-left"
          >
            Bulk Enable Services
          </button>
          <button
            @click="bulkDisable"
            class="w-full px-4 py-3 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 text-left"
          >
            Bulk Disable Services
          </button>
          <div class="pt-4 border-t">
            <button
              @click="showBulkOperations = false"
              class="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const entities = ref<any[]>([])
const selectedEntityCode = ref('')
const selectedEntityName = ref('')
const globalServices = ref<any[]>([])
const entityServices = ref<any[]>([])
const history = ref<any[]>([])
const loading = ref(false)
const loadingHistory = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

const globalSearchQuery = ref('')
const entitySearchQuery = ref('')
const showAddCustomModal = ref(false)
const showBulkOperations = ref(false)
const showBulkImportModal = ref(false)

const customServiceForm = ref({
  category: '',
  sub_category: '',
  service_name: '',
  description: ''
})

const filteredGlobalServices = computed(() => {
  if (!globalSearchQuery.value) return globalServices.value
  const query = globalSearchQuery.value.toLowerCase()
  return globalServices.value.filter(s =>
    s.service_name.toLowerCase().includes(query) ||
    s.category.toLowerCase().includes(query)
  )
})

const filteredEntityServices = computed(() => {
  let services = entityServices.value
  if (entitySearchQuery.value) {
    const query = entitySearchQuery.value.toLowerCase()
    services = services.filter(s =>
      s.service_name.toLowerCase().includes(query) ||
      s.category.toLowerCase().includes(query)
    )
  }
  return services
})

async function fetchEntities() {
  try {
    const response = await api.get('/entity-codes')
    entities.value = response.data.filter((e: any) => e.is_active)
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to fetch entities'
  }
}

async function fetchGlobalCatalog() {
  try {
    const response = await api.get('/service-catalog/global')
    globalServices.value = response.data.filter((s: any) => s.is_active)
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to fetch global catalog'
  }
}

async function loadEntityCatalog() {
  if (!selectedEntityCode.value) {
    entityServices.value = []
    return
  }
  
  const entity = entities.value.find(e => e.entity_code === selectedEntityCode.value)
  if (entity) {
    selectedEntityName.value = entity.entity_display_name || entity.entity_name
  }
  
  loading.value = true
  try {
    const response = await api.get(`/service-catalog/entity/${selectedEntityCode.value}`)
    entityServices.value = response.data.services || []
    await fetchHistory()
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to load entity catalog'
  } finally {
    loading.value = false
  }
}

async function fetchHistory() {
  if (!selectedEntityCode.value) return
  
  loadingHistory.value = true
  try {
    const response = await api.get(`/service-catalog/history/${selectedEntityCode.value}`)
    history.value = response.data || []
  } catch (err: any) {
    console.error('Failed to fetch history:', err)
  } finally {
    loadingHistory.value = false
  }
}

function isServiceEnabled(serviceCode: string) {
  return entityServices.value.some(s => s.service_code === serviceCode && s.is_enabled !== false)
}

async function toggleService(service: any) {
  if (isServiceEnabled(service.service_code)) {
    await disableService(service)
  } else {
    await enableService(service)
  }
}

async function enableService(service: any) {
  try {
    await api.post(`/service-catalog/entity/${selectedEntityCode.value}/enable`, {
      serviceCode: service.service_code
    })
    await loadEntityCatalog()
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to enable service')
  }
}

async function disableService(service: any) {
  if (!confirm(`Disable "${service.service_name}"?`)) return
  
  try {
    await api.post(`/service-catalog/entity/${selectedEntityCode.value}/disable/${service.service_code}`)
    await loadEntityCatalog()
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to disable service')
  }
}

async function saveCustomService() {
  saving.value = true
  try {
    await api.post(`/service-catalog/entity/${selectedEntityCode.value}/custom`, customServiceForm.value)
    await loadEntityCatalog()
    showAddCustomModal.value = false
    customServiceForm.value = {
      category: '',
      sub_category: '',
      service_name: '',
      description: ''
    }
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to add custom service')
  } finally {
    saving.value = false
  }
}

function editService(service: any) {
  // TODO: Implement edit modal
  alert('Edit functionality coming soon')
}

async function exportCatalog() {
  try {
    const response = await api.get(`/service-catalog/entity/${selectedEntityCode.value}/export-excel`)
    // Convert to Excel download
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `catalog_${selectedEntityCode.value}_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to export catalog')
  }
}

function copyFromAnotherEntity() {
  // TODO: Implement copy from entity
  alert('Copy functionality coming soon')
}

function bulkEnable() {
  // TODO: Implement bulk enable
  alert('Bulk enable functionality coming soon')
}

function bulkDisable() {
  // TODO: Implement bulk disable
  alert('Bulk disable functionality coming soon')
}

function getHistoryBorderColor(action: string) {
  const colors: Record<string, string> = {
    enabled: 'border-green-500',
    disabled: 'border-red-500',
    created: 'border-primary-500',
    updated: 'border-yellow-500',
    deleted: 'border-gray-500'
  }
  return colors[action] || 'border-gray-300'
}

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(async () => {
  // Check permissions
  if (!['Super Admin', 'Admin', 'Compliance'].includes(authStore.user?.role || '')) {
    error.value = 'Access denied. Only Super Admin, Admin, and Compliance can manage service catalogs.'
    return
  }
  
  await fetchEntities()
  await fetchGlobalCatalog()
})
</script>
