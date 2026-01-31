<template>
  <div v-if="open" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('cancel')"></div>

      <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto z-10">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Create New Prospect</h3>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Prospect Name <span class="text-red-500">*</span></label>
            <input
              :value="prospect.prospect_name"
              @input="emit('update:prospect', { ...prospect, prospect_name: ($event.target as HTMLInputElement).value })"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter prospect name"
              aria-required="true"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
            <select
              :value="prospect.industry"
              @change="emit('update:prospect', { ...prospect, industry: ($event.target as HTMLSelectElement).value })"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select industry...</option>
              <option value="Financial Services">Financial Services</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Technology">Technology</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Retail">Retail</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Energy">Energy</option>
              <option value="Government">Government</option>
              <option value="Education">Education</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Commercial Registration</label>
            <input
              :value="prospect.commercial_registration"
              @input="emit('update:prospect', { ...prospect, commercial_registration: ($event.target as HTMLInputElement).value })"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional"
            />
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
            :disabled="!prospect.prospect_name.trim() || creating"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <span v-if="creating">Creating...</span>
            <span v-else>Create & Select</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  'update:prospect': [value: { prospect_name: string; industry: string; commercial_registration: string }]
  cancel: []
  confirm: []
}>()

defineProps<{
  open: boolean
  prospect: { prospect_name: string; industry: string; commercial_registration: string }
  creating?: boolean
}>()
</script>
