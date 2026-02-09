<template>
  <div class="bg-white rounded-2xl overflow-hidden" style="box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid #F3F4F6;">
    <div class="px-8 py-5" style="background: linear-gradient(to right, #0066CC, #0052CC);">
      <h3 class="text-xl font-bold text-white flex items-center">
        <span class="mr-3 text-2xl">👤</span>
        Requestor Information
      </h3>
    </div>
    <div class="p-8 bg-gray-50">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="space-y-2">
          <label class="block text-sm font-bold text-gray-800 mb-2">Requestor Name</label>
          <input
            :value="formData.requestor_name"
            type="text"
            readonly
            class="w-full rounded-xl px-5 py-4 bg-gray-100 text-gray-700 text-base font-medium"
            style="border: 2px solid #E5E7EB;"
          />
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-bold text-gray-800 mb-2">Designation *</label>
          <select 
            :value="formData.designation"
            @change="handleUpdate('designation', ($event.target as HTMLSelectElement).value)"
            class="w-full rounded-xl px-5 py-4 bg-white text-gray-800 text-base font-medium appearance-none cursor-pointer"
            style="border: 2px solid #E5E7EB; background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236B7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E'); background-position: right 1rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 3rem;"
            required
            @focus="onInputFocus"
            @blur="onInputBlur"
          >
            <option value="">Select designation...</option>
            <option>Director</option>
            <option>Partner</option>
            <option>Manager</option>
            <option>Senior Manager</option>
            <option>Other</option>
          </select>
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-bold text-gray-800 mb-2">Entity *</label>
          <select 
            :value="formData.entity"
            @change="handleUpdate('entity', ($event.target as HTMLSelectElement).value)"
            class="w-full rounded-xl px-5 py-4 bg-white text-gray-800 text-base font-medium appearance-none cursor-pointer"
            style="border: 2px solid #E5E7EB; background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236B7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E'); background-position: right 1rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 3rem;"
            required
            @focus="onInputFocus"
            @blur="onInputBlur"
          >
            <option value="">Select entity...</option>
            <option>BDO Al Nisf & Partners</option>
          </select>
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-bold text-gray-800 mb-2">Line of Service *</label>
          <select 
            :value="formData.line_of_service"
            @change="handleUpdate('line_of_service', ($event.target as HTMLSelectElement).value)"
            class="w-full rounded-xl px-5 py-4 bg-white text-gray-800 text-base font-medium appearance-none cursor-pointer"
            style="border: 2px solid #E5E7EB; background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236B7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E'); background-position: right 1rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 3rem;"
            required
            @focus="onInputFocus"
            @blur="onInputBlur"
          >
            <option value="">Select service...</option>
            <option>Audit & Assurance</option>
            <option>Advisory</option>
            <option>Tax</option>
            <option>Accounting</option>
            <option>Other Regulated Services</option>
          </select>
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
    el.style.borderColor = '#0066CC'
    el.style.boxShadow = '0 0 0 3px rgba(0, 102, 204, 0.1)'
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

