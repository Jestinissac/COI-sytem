<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeModal">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" @click="closeModal" aria-hidden="true" />
      <div class="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-sm border border-gray-200 sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Fetch data from PRMS</h3>
            <button type="button" @click="closeModal" class="text-gray-400 hover:text-gray-500" aria-label="Close">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div class="px-6 py-4">
          <p class="text-sm text-gray-600 mb-4">
            Load client and parent company data. In production this would query PRMS; the prototype uses COI data.
          </p>
          <div class="mb-4">
            <label for="prms-client-select" class="block text-sm font-medium text-gray-700 mb-2">Client</label>
            <select
              id="prms-client-select"
              v-model="selectedClientId"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              :disabled="loading"
            >
              <option :value="null">Select a client...</option>
              <option v-for="c in clients" :key="c.id" :value="c.id">
                {{ c.client_name || c.name }} ({{ c.client_code || c.code }})
              </option>
            </select>
          </div>
          <div class="flex gap-2 mb-4">
            <button
              type="button"
              :disabled="!selectedClientId || loading"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:pointer-events-none"
              @click="fetchData"
            >
              {{ loading ? 'Fetching...' : 'Fetch' }}
            </button>
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              @click="closeModal"
            >
              Cancel
            </button>
          </div>
          <div v-if="fetchError" class="mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
            <p class="text-sm text-gray-700">{{ fetchError }}</p>
          </div>
          <div v-else-if="fetchedData" class="mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Result</p>
            <p class="text-xs text-gray-500 mb-3">PRMS integration is not available. Showing data from COI prototype.</p>
            <dl class="grid grid-cols-2 gap-2 text-sm">
              <dt class="text-gray-500">Client name</dt>
              <dd class="font-medium text-gray-900">{{ fetchedData.client?.client_name ?? '—' }}</dd>
              <dt class="text-gray-500">Client code</dt>
              <dd class="font-medium text-gray-900">{{ fetchedData.client?.client_code ?? '—' }}</dd>
              <dt class="text-gray-500">Parent company</dt>
              <dd class="font-medium text-gray-900">{{ fetchedData.parent_company ?? '—' }}</dd>
              <dt class="text-gray-500">Projects</dt>
              <dd class="text-gray-600">None (placeholder)</dd>
            </dl>
            <div v-if="showApplyButton" class="mt-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                @click="applyToForm"
              >
                Apply to form
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import api from '@/services/api'

const props = withDefaults(
  defineProps<{
    show: boolean
    initialClientId?: number | null
    clients: Array<{ id: number; client_name?: string; name?: string; client_code?: string; code?: string }>
    showApplyButton?: boolean
  }>(),
  { initialClientId: null, showApplyButton: true }
)

const emit = defineEmits<{
  close: []
  apply: [payload: { parent_company?: string; client?: Record<string, unknown> }]
}>()

const selectedClientId = ref<number | null>(props.initialClientId ?? null)
const loading = ref(false)
const fetchError = ref('')
const fetchedData = ref<{
  client?: { client_name?: string; client_code?: string; status?: string; industry?: string; commercial_registration?: string }
  parent_company?: string
  parent_company_detail?: Record<string, unknown>
} | null>(null)

watch(
  () => props.show,
  (visible) => {
    if (visible) {
      selectedClientId.value = props.initialClientId ?? null
      fetchError.value = ''
      fetchedData.value = null
      if (props.initialClientId != null && !props.showApplyButton) {
        nextTick(() => fetchData())
      }
    }
  }
)

watch(
  () => props.initialClientId,
  (id) => {
    if (id != null) selectedClientId.value = id
  }
)

function closeModal() {
  emit('close')
}

async function fetchData() {
  const id = selectedClientId.value
  if (!id) return
  loading.value = true
  fetchError.value = ''
  fetchedData.value = null
  try {
    const res = await api.get(`/integration/prms/client/${id}`)
    fetchedData.value = res.data
  } catch (e: unknown) {
    const msg = e && typeof e === 'object' && 'response' in e && e.response && typeof e.response === 'object' && 'data' in e.response
      ? (e.response as { data?: { error?: string } }).data?.error
      : 'Failed to load client data.'
    fetchError.value = msg || 'Failed to load client data.'
  } finally {
    loading.value = false
  }
}

function applyToForm() {
  if (fetchedData.value) {
    emit('apply', {
      parent_company: fetchedData.value.parent_company ?? undefined,
      client: fetchedData.value.client
    })
  }
  closeModal()
}
</script>
