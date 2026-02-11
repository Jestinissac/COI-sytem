<template>
  <div class="min-h-screen bg-gray-100">
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-4xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <router-link
              to="/coi/super-admin"
              class="text-gray-500 hover:text-gray-700"
              aria-label="Back to Super Admin"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </router-link>
            <div>
              <h1 class="text-xl font-semibold text-gray-900">Approval Workflow Stages</h1>
              <p class="text-sm text-gray-500 mt-0.5">Configure order and active state of approval stages (Super Admin only)</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-6 py-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-900">Stages</h2>
          <button
            v-if="stages.length > 0 && orderDirty"
            @click="saveOrder"
            :disabled="savingOrder"
            class="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {{ savingOrder ? 'Saving…' : 'Save order' }}
          </button>
        </div>

        <div v-if="loading" class="p-12 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-sm text-gray-500">Loading workflow stages…</p>
        </div>

        <div v-else-if="loadError" class="p-6">
          <div class="bg-red-50 border border-red-200 rounded-md p-4">
            <p class="text-sm text-red-800">{{ loadError }}</p>
          </div>
        </div>

        <div v-else-if="stages.length === 0" class="p-12 text-center text-gray-500">
          <p>No workflow stages found. Run the B8 migration to seed the table.</p>
        </div>

        <ul v-else class="divide-y divide-gray-200">
          <li
            v-for="(stage, index) in stages"
            :key="stage.id"
            class="px-6 py-4 flex items-center gap-4"
          >
            <div class="flex flex-col gap-0.5">
              <button
                type="button"
                :disabled="index === 0 || savingOrder"
                @click="moveUp(index)"
                class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Move up"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                </svg>
              </button>
              <button
                type="button"
                :disabled="index === stages.length - 1 || savingOrder"
                @click="moveDown(index)"
                class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Move down"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
            </div>
            <span class="text-sm font-medium text-gray-500 w-8">{{ stage.stage_order }}</span>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900">{{ stage.stage_name }}</div>
              <div class="text-sm text-gray-500">{{ stage.status_name }} · {{ stage.role_required }}</div>
            </div>
            <label class="flex items-center gap-2 shrink-0">
              <span class="text-sm text-gray-600">Active</span>
              <input
                type="checkbox"
                :checked="Boolean(stage.is_active)"
                :disabled="stage.is_required === 1"
                @change="onToggleActive(stage, ($event.target as HTMLInputElement).checked)"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span v-if="stage.is_required === 1" class="text-xs text-gray-400">(required)</span>
            </label>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

interface WorkflowStage {
  id: number
  stage_order: number
  stage_name: string
  role_required: string
  status_name: string
  next_stage_id: number | null
  is_active: number
  can_skip: number
  skip_condition: string | null
  is_required: number
}

const stages = ref<WorkflowStage[]>([])
const loading = ref(true)
const loadError = ref('')
const savingOrder = ref(false)
const orderDirty = ref(false)
const { success, error: showError } = useToast()

function fetchStages() {
  loading.value = true
  loadError.value = ''
  api.get<WorkflowStage[]>('/config/workflow-stages')
    .then((res) => {
      stages.value = Array.isArray(res.data) ? res.data : []
      orderDirty.value = false
    })
    .catch((err) => {
      loadError.value = err.response?.data?.error || 'Failed to load workflow stages.'
    })
    .finally(() => {
      loading.value = false
    })
}

function moveUp(index: number) {
  if (index <= 0) return
  const arr = [...stages.value]
  ;[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]
  stages.value = arr.map((s, i) => ({ ...s, stage_order: i + 1 }))
  orderDirty.value = true
}

function moveDown(index: number) {
  if (index >= stages.value.length - 1) return
  const arr = [...stages.value]
  ;[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]]
  stages.value = arr.map((s, i) => ({ ...s, stage_order: i + 1 }))
  orderDirty.value = true
}

function saveOrder() {
  if (stages.value.length === 0) return
  savingOrder.value = true
  const body = stages.value.map((s, i) => ({ id: s.id, stage_order: i + 1 }))
  api.put('/config/workflow-stages/reorder', body)
    .then(() => {
      success('Workflow order saved.')
      orderDirty.value = false
      fetchStages()
    })
    .catch((err) => {
      showError(err.response?.data?.error || 'Failed to save order.')
    })
    .finally(() => {
      savingOrder.value = false
    })
}

function onToggleActive(stage: WorkflowStage, active: boolean) {
  api.put('/config/workflow-stages', { id: stage.id, is_active: active })
    .then(() => {
      success(active ? 'Stage enabled.' : 'Stage disabled.')
      const s = stages.value.find((x) => x.id === stage.id)
      if (s) s.is_active = active ? 1 : 0
    })
    .catch((err) => {
      showError(err.response?.data?.error || 'Failed to update stage.')
    })
}

onMounted(() => {
  fetchStages()
})
</script>
