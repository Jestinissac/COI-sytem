<template>
  <div class="bg-white rounded-2xl overflow-hidden" style="box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid #F3F4F6;">
    <div class="px-8 py-5" style="background: linear-gradient(to right, #F97316, #EA580C);">
      <h3 class="text-xl font-bold text-white flex items-center">
        <span class="mr-3 text-2xl">🏛️</span>
        Ownership & Structure
      </h3>
    </div>
    <div class="p-8 bg-gray-50 space-y-8">
      <div>
        <label class="block text-sm font-bold text-gray-800 mb-2">Full Ownership Structure</label>
        <textarea
          :value="formData.full_ownership_structure"
          @input="handleUpdate('full_ownership_structure', ($event.target as HTMLTextAreaElement).value)"
          rows="4"
          class="w-full rounded-xl px-5 py-4 bg-white text-gray-800 text-base font-medium resize-none"
          style="border: 2px solid #E5E7EB;"
          placeholder="Describe the ownership structure..."
          @focus="onInputFocus"
          @blur="onInputBlur"
        ></textarea>
      </div>
      
      <div>
        <label class="block text-sm font-bold text-gray-800 mb-3">PIE Status *</label>
        <div class="flex space-x-8">
          <label class="flex items-center cursor-pointer group">
            <input 
              :checked="formData.pie_status === 'Yes'"
              @change="handleUpdate('pie_status', 'Yes')"
              type="radio" 
              name="pie_status"
              value="Yes" 
              class="w-5 h-5 text-orange-500 border-gray-300 focus:ring-orange-500 cursor-pointer" 
            />
            <span class="ml-3 text-gray-700 font-medium group-hover:text-orange-600 transition-colors">Yes</span>
          </label>
          <label class="flex items-center cursor-pointer group">
            <input 
              :checked="formData.pie_status === 'No'"
              @change="handleUpdate('pie_status', 'No')"
              type="radio" 
              name="pie_status"
              value="No" 
              class="w-5 h-5 text-orange-500 border-gray-300 focus:ring-orange-500 cursor-pointer" 
            />
            <span class="ml-3 text-gray-700 font-medium group-hover:text-orange-600 transition-colors">No</span>
          </label>
        </div>
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

function onInputFocus(e: Event) {
  const el = e.target as HTMLElement
  if (el) {
    el.style.borderColor = '#F97316'
    el.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)'
  }
}

function onInputBlur(e: Event) {
  const el = e.target as HTMLElement
  if (el) {
    el.style.borderColor = '#E5E7EB'
    el.style.boxShadow = 'none'
  }
}
</script>

