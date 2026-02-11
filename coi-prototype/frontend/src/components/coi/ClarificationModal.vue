<template>
  <div v-if="show" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
    <div class="relative p-8 bg-white w-full max-w-lg mx-4 rounded-lg shadow-xl">
      <!-- Header -->
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
          <span class="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </span>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Clarification required</h3>
            <p v-if="serviceTypeName" class="text-sm text-gray-500 mt-0.5">Service: {{ serviceTypeName }}</p>
          </div>
        </div>
        <button
          type="button"
          @click="cancel"
          class="text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="Close"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Question -->
      <p class="text-sm font-medium text-gray-700 mb-4">{{ questionText }}</p>

      <!-- Options (radio) -->
      <fieldset class="space-y-2 mb-6">
        <legend class="sr-only">Select one option</legend>
        <label
          v-for="(opt, idx) in options"
          :key="idx"
          class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
          :class="selectedIndex === idx ? 'border-primary-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'"
        >
          <input
            type="radio"
            :name="`clarification-${serviceTypeName}`"
            :value="idx"
            v-model="selectedIndex"
            class="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
          />
          <span class="text-sm text-gray-900">{{ opt.label }}</span>
        </label>
      </fieldset>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <button
          type="button"
          @click="cancel"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="confirm"
          :disabled="selectedIndex < 0"
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    show: boolean
    serviceTypeName: string
    questionText: string
    options: Array<{ label: string; cma_code: string | null }>
  }>(),
  { show: false, serviceTypeName: '', questionText: '', options: () => [] }
)

const emit = defineEmits<{
  confirm: [cmaCode: string | null]
  cancel: []
}>()

const selectedIndex = ref<number>(-1)

function confirm() {
  if (selectedIndex.value < 0 || selectedIndex.value >= props.options.length) return
  const opt = props.options[selectedIndex.value]
  emit('confirm', opt.cma_code ?? null)
}

function cancel() {
  emit('cancel')
}

watch(
  () => props.show,
  (visible) => {
    if (visible) selectedIndex.value = -1
  }
)
</script>
