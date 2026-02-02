<template>
  <div class="bg-white rounded-2xl overflow-hidden" style="box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid #F3F4F6;">
    <div class="px-8 py-5" style="background: linear-gradient(to right, #14B8A6, #0D9488);">
      <h3 class="text-xl font-bold text-white flex items-center">
        <span class="mr-3 text-2xl">🌍</span>
        International Operations
      </h3>
    </div>
    <div class="p-8 bg-gray-50 space-y-8">
      <div class="flex items-center p-6 bg-white rounded-xl border-2 border-gray-200">
        <label class="flex items-center cursor-pointer">
          <input
            :checked="formData.international_operations"
            @change="handleUpdate('international_operations', ($event.target as HTMLInputElement).checked)"
            type="checkbox"
            class="w-6 h-6 text-teal-500 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
          />
          <span class="ml-4 text-gray-900 font-bold text-base">Has International Operations</span>
        </label>
      </div>
      
      <div v-if="formData.international_operations" class="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <label class="block text-sm font-bold text-gray-800 mb-2">Foreign Subsidiaries</label>
        <textarea
          :value="formData.foreign_subsidiaries"
          @input="handleUpdate('foreign_subsidiaries', ($event.target as HTMLTextAreaElement).value)"
          rows="3"
          class="w-full rounded-xl px-5 py-4 bg-white text-gray-800 text-base font-medium resize-none"
          style="border: 2px solid #93C5FD;"
          placeholder="List foreign subsidiaries..."
          @focus="$event.target.style.borderColor='#3B82F6'; $event.target.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.1)'"
          @blur="$event.target.style.borderColor='#93C5FD'; $event.target.style.boxShadow='none'"
        ></textarea>
      </div>
      
      <div v-if="!formData.international_operations" class="text-center py-12">
        <span class="text-6xl mb-4 block">🌍</span>
        <p class="text-gray-500 text-lg">No international operations</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WizardFormData } from '@/composables/useWizard'

const props = defineProps<{
  formData: WizardFormData
}>()

const emit = defineEmits<{
  update: [data: Partial<WizardFormData>]
}>()

function handleUpdate(field: keyof WizardFormData, value: any) {
  emit('update', { [field]: value })
}
</script>

