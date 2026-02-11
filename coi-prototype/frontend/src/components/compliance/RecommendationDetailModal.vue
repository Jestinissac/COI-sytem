<!--
  B11c: Recommendation detail modal for Compliance.
  Shows each rule recommendation with Accept / Override (with justification) / Dismiss.
  Emits confirm with acceptedRecommendations, rejectedRecommendations, overriddenRecommendations.
-->
<template>
  <div v-if="show" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60] flex items-center justify-center">
    <div class="relative p-6 bg-white w-full max-w-3xl mx-4 my-8 rounded-lg shadow-xl max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4 shrink-0">
        <h3 class="text-xl font-semibold text-gray-900">Review recommendations</h3>
        <button
          type="button"
          @click="close"
          class="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <p class="text-sm text-gray-600 mb-4 shrink-0">
        Review each recommendation and choose Accept, Override with reason, or Dismiss.
      </p>

      <!-- Summary line -->
      <div class="mb-4 px-3 py-2 bg-gray-50 rounded border border-gray-200 text-sm text-gray-700 shrink-0">
        {{ summaryLine }}
      </div>

      <!-- List of recommendations -->
      <div class="flex-1 overflow-y-auto space-y-4 min-h-0">
        <div
          v-for="(rec, index) in parsedRecommendations"
          :key="recKey(rec, index)"
          class="border border-gray-200 rounded-lg p-4 bg-white"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <p class="font-medium text-gray-900">{{ rec.ruleName || 'Rule' }}</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ rec.regulation || rec.ruleType || 'Rule' }}</p>
              <p class="text-sm text-gray-700 mt-2">{{ rec.reason }}</p>
              <p v-if="rec.guidance" class="text-sm text-gray-600 mt-1">{{ rec.guidance }}</p>
              <span
                class="inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded"
                :class="confidenceClass(rec.confidence || rec.severity)"
              >
                {{ rec.confidence || rec.severity || 'Medium' }}
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                :class="choiceFor(rec, index) === 'accept' ? 'ring-2 ring-green-500 bg-green-50 text-green-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                class="px-3 py-1.5 text-sm font-medium rounded transition-colors"
                @click="setChoice(rec, index, 'accept')"
              >
                Accept
              </button>
              <button
                v-if="rec.canOverride !== false"
                type="button"
                :class="choiceFor(rec, index) === 'override' ? 'ring-2 ring-amber-500 bg-amber-50 text-amber-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                class="px-3 py-1.5 text-sm font-medium rounded transition-colors"
                @click="setChoice(rec, index, 'override')"
              >
                Override
              </button>
              <button
                type="button"
                :class="choiceFor(rec, index) === 'dismiss' ? 'ring-2 ring-red-500 bg-red-50 text-red-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                class="px-3 py-1.5 text-sm font-medium rounded transition-colors"
                @click="setChoice(rec, index, 'dismiss')"
              >
                Dismiss
              </button>
            </div>
          </div>
          <!-- Override justification (required when Override is selected) -->
          <div v-if="choiceFor(rec, index) === 'override'" class="mt-3">
            <label :for="'justification-' + recKey(rec, index)" class="block text-sm font-medium text-gray-700 mb-1">
              Justification <span class="text-red-500">*</span>
            </label>
            <textarea
              :id="'justification-' + recKey(rec, index)"
              v-model="overrideJustifications[recKey(rec, index)]"
              rows="2"
              placeholder="Provide a reason for overriding this recommendation..."
              class="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              @blur="touchOverride(rec, index)"
            />
            <p v-if="overrideError(rec, index)" class="text-xs text-red-600 mt-1">Justification is required when overriding.</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 shrink-0">
        <button
          type="button"
          @click="close"
          class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          :disabled="!canConfirm"
          class="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-primary-600 text-white hover:bg-primary-700"
          @click="confirm"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    show: boolean
    recommendations: unknown[] | string | null | undefined
    requestId?: string | number
  }>(),
  { requestId: undefined }
)

const emit = defineEmits<{
  close: []
  confirm: [payload: { acceptedRecommendations: (string | number)[]; rejectedRecommendations: (string | number)[]; overriddenRecommendations: { ruleId: string | number; justification: string }[] }]
}>()

/** Per-rule choice: 'accept' | 'override' | 'dismiss' (default accept for simplicity) */
const choices = ref<Record<string, 'accept' | 'override' | 'dismiss'>>({})
/** Justification text for overridden rules (keyed by ruleId or index) */
const overrideJustifications = ref<Record<string, string>>({})
/** Touched override fields for showing validation */
const touchedOverrides = ref<Record<string, boolean>>({})

const parsedRecommendations = computed(() => {
  if (!props.recommendations) return []
  const raw = typeof props.recommendations === 'string' ? (() => { try { return JSON.parse(props.recommendations) } catch { return [] } })() : props.recommendations
  return Array.isArray(raw) ? raw : []
})

function recKey(rec: { ruleId?: string | number } & Record<string, unknown>, index: number): string {
  return rec.ruleId != null ? String(rec.ruleId) : 'i' + index
}

function choiceFor(rec: { ruleId?: string | number } & Record<string, unknown>, index: number): 'accept' | 'override' | 'dismiss' {
  return choices.value[recKey(rec, index)] ?? 'accept'
}

function setChoice(rec: { ruleId?: string | number } & Record<string, unknown>, index: number, choice: 'accept' | 'override' | 'dismiss') {
  const key = recKey(rec, index)
  choices.value = { ...choices.value, [key]: choice }
  if (choice !== 'override') {
    overrideJustifications.value = { ...overrideJustifications.value, [key]: '' }
  }
}

function touchOverride(rec: { ruleId?: string | number } & Record<string, unknown>, index: number) {
  const key = recKey(rec, index)
  touchedOverrides.value = { ...touchedOverrides.value, [key]: true }
}

function overrideError(rec: { ruleId?: string | number } & Record<string, unknown>, index: number): boolean {
  if (choiceFor(rec, index) !== 'override') return false
  const key = recKey(rec, index)
  const val = (overrideJustifications.value[key] ?? '').trim()
  return touchedOverrides.value[key] === true && val === ''
}

const canConfirm = computed(() => {
  const list = parsedRecommendations.value
  for (let i = 0; i < list.length; i++) {
    const key = recKey(list[i] as { ruleId?: string | number } & Record<string, unknown>, i)
    if (choices.value[key] === 'override') {
      if (!(overrideJustifications.value[key] ?? '').trim()) return false
    }
  }
  return true
})

const summaryLine = computed(() => {
  const list = parsedRecommendations.value
  if (list.length === 0) return 'No recommendations.'
  let accepted = 0
  let overridden = 0
  let dismissed = 0
  list.forEach((rec, i) => {
    const key = recKey(rec as { ruleId?: string | number } & Record<string, unknown>, i)
    const c = choices.value[key] ?? 'accept'
    if (c === 'accept') accepted++
    else if (c === 'override') overridden++
    else dismissed++
  })
  const parts = []
  if (accepted > 0) parts.push(`${accepted} accepted`)
  if (overridden > 0) parts.push(`${overridden} overridden`)
  if (dismissed > 0) parts.push(`${dismissed} dismissed`)
  return parts.length ? `${list.length} recommendation(s): ${parts.join(', ')}` : `${list.length} recommendation(s)`
})

function confidenceClass(level: string): string {
  const l = (level || '').toUpperCase()
  if (l === 'CRITICAL') return 'bg-red-100 text-red-800'
  if (l === 'HIGH') return 'bg-amber-100 text-amber-800'
  if (l === 'MEDIUM') return 'bg-blue-100 text-blue-800'
  if (l === 'LOW') return 'bg-gray-100 text-gray-700'
  return 'bg-gray-100 text-gray-700'
}

function close() {
  emit('close')
}

function confirm() {
  if (!canConfirm.value) return
  const accepted: (string | number)[] = []
  const rejected: (string | number)[] = []
  const overridden: { ruleId: string | number; justification: string }[] = []
  parsedRecommendations.value.forEach((rec, i) => {
    const r = rec as { ruleId?: string | number } & Record<string, unknown>
    const key = recKey(r, i)
    const id = r.ruleId != null ? r.ruleId : i
    const c = choices.value[key] ?? 'accept'
    if (c === 'accept') accepted.push(id as string | number)
    else if (c === 'override') overridden.push({ ruleId: id as string | number, justification: (overrideJustifications.value[key] ?? '').trim() })
    else rejected.push(id as string | number)
  })
  emit('confirm', {
    acceptedRecommendations: accepted,
    rejectedRecommendations: rejected,
    overriddenRecommendations: overridden
  })
}

// Reset state when modal opens with new recommendations
watch(() => [props.show, props.recommendations], () => {
  if (props.show) {
    choices.value = {}
    overrideJustifications.value = {}
    touchedOverrides.value = {}
  }
}, { immediate: true })
</script>
