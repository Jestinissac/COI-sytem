<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">Entity Codes Management</h1>
            <p class="text-sm text-gray-500 mt-1">Manage entities (similar to HRMS keywords pattern)</p>
          </div>
          <button
            @click="showCreateModal = true"
            class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Entity
          </button>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-6">
      <!-- Entities Table -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-base font-semibold text-gray-900">Entities</h2>
        </div>
        
        <div v-if="loading" class="p-12 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-sm text-gray-500">Loading entities...</p>
        </div>

        <div v-else-if="error" class="p-6">
          <div class="bg-red-50 border border-red-200 rounded-md p-4">
            <p class="text-sm text-red-800">{{ error }}</p>
          </div>
        </div>

        <div v-else>
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity Code</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catalog Mode</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="entity in entities" :key="entity.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ entity.entity_code }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ entity.entity_name }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ entity.entity_display_name || '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="entity.catalog_mode === 'inherit' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'">
                    {{ entity.catalog_mode }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="entity.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                    {{ entity.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span v-if="entity.is_default" class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    Default
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    @click="editEntity(entity)"
                    class="text-primary-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    v-if="!entity.is_default"
                    @click="deleteEntity(entity)"
                    class="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="entities.length === 0" class="p-12 text-center text-gray-500">
            <p>No entities found. Click "Add Entity" to create one.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ showEditModal ? 'Edit Entity' : 'Create Entity' }}
          </h3>
        </div>
        
        <form @submit.prevent="saveEntity" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Entity Code <span class="text-red-500">*</span></label>
            <input
              v-model="formData.entity_code"
              type="text"
              required
              :readonly="showEditModal"
              :class="showEditModal ? 'bg-gray-50' : ''"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="BDO_AL_NISF"
            />
            <p class="mt-1 text-xs text-gray-500">Unique code (cannot be changed after creation)</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Entity Name <span class="text-red-500">*</span></label>
            <input
              v-model="formData.entity_name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="BDO Al Nisf & Partners"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              v-model="formData.entity_display_name"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="BDO Al Nisf & Partners"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Catalog Mode</label>
            <select
              v-model="formData.catalog_mode"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="independent">Independent</option>
              <option value="inherit">Inherit from Global</option>
            </select>
          </div>

          <div class="flex items-center">
            <input
              v-model="formData.is_default"
              type="checkbox"
              id="is_default"
              class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label for="is_default" class="ml-2 text-sm text-gray-700">Set as default entity</label>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const entities = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingEntity = ref<any>(null)

const formData = ref({
  entity_code: '',
  entity_name: '',
  entity_display_name: '',
  catalog_mode: 'independent',
  is_default: false
})

async function fetchEntities() {
  loading.value = true
  error.value = null
  try {
    const response = await api.get('/entity-codes')
    entities.value = response.data
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to fetch entities'
  } finally {
    loading.value = false
  }
}

function editEntity(entity: any) {
  editingEntity.value = entity
  formData.value = {
    entity_code: entity.entity_code,
    entity_name: entity.entity_name,
    entity_display_name: entity.entity_display_name || '',
    catalog_mode: entity.catalog_mode || 'independent',
    is_default: entity.is_default || false
  }
  showEditModal.value = true
}

async function saveEntity() {
  saving.value = true
  try {
    if (showEditModal.value && editingEntity.value) {
      // Update
      await api.put(`/entity-codes/${editingEntity.value.entity_code}`, formData.value)
    } else {
      // Create
      await api.post('/entity-codes', formData.value)
    }
    await fetchEntities()
    closeModal()
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to save entity'
    alert(error.value)
  } finally {
    saving.value = false
  }
}

async function deleteEntity(entity: any) {
  if (!confirm(`Are you sure you want to delete "${entity.entity_name}"?`)) {
    return
  }
  
  try {
    await api.delete(`/entity-codes/${entity.entity_code}`)
    await fetchEntities()
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to delete entity'
    alert(error.value)
  }
}

function closeModal() {
  showCreateModal.value = false
  showEditModal.value = false
  editingEntity.value = null
  formData.value = {
    entity_code: '',
    entity_name: '',
    entity_display_name: '',
    catalog_mode: 'independent',
    is_default: false
  }
}

onMounted(() => {
  // Check if user is Super Admin
  if (authStore.user?.role !== 'Super Admin') {
    error.value = 'Access denied. Only Super Admin can manage entity codes.'
    return
  }
  fetchEntities()
})
</script>
