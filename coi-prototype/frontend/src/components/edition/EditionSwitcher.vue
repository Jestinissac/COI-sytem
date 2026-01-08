<template>
  <div class="edition-switcher">
    <!-- Current Edition Display -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">System Edition</h3>
          <p class="text-sm text-gray-500 mt-1">Manage system features and capabilities</p>
        </div>
        <div class="flex items-center gap-3">
          <span
            class="px-3 py-1.5 text-sm font-medium rounded-full"
            :class="edition === 'pro' 
              ? 'bg-purple-100 text-purple-700' 
              : 'bg-blue-100 text-blue-700'"
          >
            {{ edition === 'pro' ? 'Pro Edition' : 'Standard Edition' }}
          </span>
        </div>
      </div>

      <!-- Toggle Switch -->
      <div class="flex items-center justify-between py-4 border-t border-gray-200">
        <div>
          <p class="text-sm font-medium text-gray-900">Switch Edition</p>
          <p class="text-xs text-gray-500 mt-1">
            {{ edition === 'standard' ? 'Upgrade to Pro' : 'Downgrade to Standard' }}
          </p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            :checked="edition === 'pro'"
            @click.prevent="handleToggle"
            :disabled="switching"
            class="sr-only peer"
            ref="toggleInput"
          />
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          <span class="ml-3 text-sm font-medium text-gray-700">
            {{ edition === 'standard' ? 'Standard' : 'Pro' }}
          </span>
        </label>
      </div>

      <!-- Feature Comparison -->
      <div class="mt-6 border-t border-gray-200 pt-4">
        <h4 class="text-sm font-semibold text-gray-900 mb-3">Feature Comparison</h4>
        <div class="space-y-2">
          <div
            v-for="feature in allFeatures"
            :key="feature.name"
            class="flex items-center justify-between text-sm"
          >
            <span class="text-gray-700">{{ feature.name }}</span>
            <div class="flex items-center gap-4">
              <span
                class="w-20 text-center"
                :class="feature.standard ? 'text-green-600 font-medium' : 'text-gray-400'"
              >
                {{ feature.standard ? '✓' : '—' }}
              </span>
              <span
                class="w-20 text-center"
                :class="feature.pro ? 'text-purple-600 font-medium' : 'text-gray-400'"
              >
                {{ feature.pro ? '✓' : '—' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div
      v-if="showConfirmModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showConfirmModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Confirm Edition Change</h3>
        </div>
        <div class="p-6">
          <p class="text-sm text-gray-700 mb-4">
            Are you sure you want to switch from <strong>{{ edition === 'standard' ? 'Standard' : 'Pro' }}</strong> to 
            <strong>{{ edition === 'standard' ? 'Pro' : 'Standard' }}</strong> edition?
          </p>
          <div class="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
            <p class="text-xs text-yellow-800">
              <strong>Note:</strong> This will {{ edition === 'standard' ? 'enable' : 'disable' }} Pro features. 
              Existing requests will not be affected.
            </p>
          </div>
          <div class="flex items-center justify-end gap-3">
            <button
              @click="showConfirmModal = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              @click="confirmSwitch"
              :disabled="switching"
              class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {{ switching ? 'Switching...' : 'Confirm Switch' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const authStore = useAuthStore()
const { success, error } = useToast()

const edition = computed(() => authStore.edition)
const switching = ref(false)
const showConfirmModal = ref(false)
const toggleInput = ref<HTMLInputElement | null>(null)

const allFeatures = [
  { name: 'Basic Rules Engine', standard: true, pro: true },
  { name: 'Fixed Form Structure', standard: true, pro: true },
  { name: 'Duplication Detection', standard: true, pro: true },
  { name: 'Engagement Code Generation', standard: true, pro: true },
  { name: 'Role-Based Dashboards', standard: true, pro: true },
  { name: 'Advanced Rules Engine (Recommendations)', standard: false, pro: true },
  { name: 'Dynamic Form Builder', standard: false, pro: true },
  { name: 'Change Management', standard: false, pro: true },
  { name: 'Impact Analysis', standard: false, pro: true },
  { name: 'Field Dependency Tracking', standard: false, pro: true },
  { name: 'Rules Engine Health Monitoring', standard: false, pro: true }
]

function handleToggle(event: Event) {
  event.preventDefault()
  const target = event.target as HTMLInputElement
  
  // Determine the intended new edition based on current state
  const intendedEdition = edition.value === 'standard' ? 'pro' : 'standard'
  
  // Show confirmation modal
  showConfirmModal.value = true
  
  // Reset checkbox to current state (prevent visual toggle until confirmed)
  if (toggleInput.value) {
    toggleInput.value.checked = edition.value === 'pro'
  }
}

async function confirmSwitch() {
  switching.value = true
  try {
    const newEdition = edition.value === 'standard' ? 'pro' : 'standard'
    const result = await authStore.updateEdition(newEdition)
    
    if (result.success) {
      success(`System edition switched to ${newEdition === 'pro' ? 'Pro' : 'Standard'}`)
      showConfirmModal.value = false
      
      // Update checkbox state to match new edition
      if (toggleInput.value) {
        toggleInput.value.checked = newEdition === 'pro'
      }
      
      // Force a small delay to ensure the store is updated before UI re-renders
      await new Promise(resolve => setTimeout(resolve, 100))
    } else {
      error(result.error || 'Failed to switch edition')
      // Reset checkbox on error
      if (toggleInput.value) {
        toggleInput.value.checked = edition.value === 'pro'
      }
    }
  } catch (e: any) {
    error(e.message || 'Failed to switch edition')
    // Reset checkbox on error
    if (toggleInput.value) {
      toggleInput.value.checked = edition.value === 'pro'
    }
  } finally {
    switching.value = false
  }
}

onMounted(async () => {
  if (authStore.isAuthenticated && !authStore.edition) {
    await authStore.loadEdition()
  }
})
</script>

