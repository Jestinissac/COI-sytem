<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 max-w-lg w-full">
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900">Duplicate Detected</h3>
        </div>
      </div>

      <div class="p-6 space-y-4">
        <p class="text-sm text-gray-600">
          A proposal or engagement already exists. Provide a business justification to proceed.
        </p>

        <div v-if="duplicates.length > 0" class="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p class="text-sm font-medium text-amber-800 mb-2">Existing records found:</p>
          <ul class="text-sm text-amber-700 space-y-1">
            <li v-for="(dup, idx) in duplicates" :key="idx" class="flex items-start gap-2">
              <span class="text-amber-500">•</span>
              <span>{{ dup.client_name || dup.entity_name }} - {{ dup.service_type || dup.type }} ({{ dup.status }})</span>
            </li>
          </ul>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Business Justification <span class="text-red-500">*</span>
          </label>
          <textarea
            :value="justification"
            @input="$emit('update:justification', ($event.target as HTMLTextAreaElement).value)"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Explain why this submission should proceed despite the existing record..."
            aria-required="true"
          ></textarea>
        </div>
      </div>

      <div class="p-6 border-t border-gray-200 flex gap-3 justify-end">
        <button
          type="button"
          @click="$emit('cancel')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="$emit('confirm')"
          :disabled="!justification.trim() || loading"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <span v-if="loading">Submitting...</span>
          <span v-else>Submit with Justification</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean
  justification: string
  duplicates: { client_name?: string; entity_name?: string; service_type?: string; type?: string; status?: string }[]
  loading?: boolean
}>()

defineEmits<{
  'update:justification': [value: string]
  cancel: []
  confirm: []
}>()
</script>
