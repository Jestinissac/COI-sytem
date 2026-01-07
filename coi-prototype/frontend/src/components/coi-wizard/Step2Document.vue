<template>
  <div class="bg-white rounded-2xl overflow-hidden" style="box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid #F3F4F6;">
    <div class="px-8 py-5" style="background: linear-gradient(to right, #3B82F6, #2563EB);">
      <h3 class="text-xl font-bold text-white flex items-center">
        <span class="mr-3 text-2xl">📄</span>
        Document Information
      </h3>
    </div>
    <div class="p-8 bg-gradient-to-b from-blue-50 to-white">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="space-y-2">
          <label class="block text-sm font-bold text-gray-800 mb-2">Requested Document *</label>
          <select 
            :value="formData.requested_document"
            @change="handleUpdate('requested_document', ($event.target as HTMLSelectElement).value)"
            class="w-full rounded-xl px-5 py-4 bg-white text-gray-800 text-base font-medium appearance-none cursor-pointer"
            style="border: 2px solid #E5E7EB; background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236B7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E'); background-position: right 1rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 3rem;"
            required
            @focus="$event.target.style.borderColor='#3B82F6'; $event.target.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.1)'"
            @blur="$event.target.style.borderColor='#E5E7EB'; $event.target.style.boxShadow='none'"
          >
            <option value="">Select document type...</option>
            <option>Proposal</option>
            <option>Engagement Letter</option>
            <option>Both</option>
          </select>
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-bold text-gray-800 mb-2">Language *</label>
          <select 
            :value="formData.language"
            @change="handleUpdate('language', ($event.target as HTMLSelectElement).value)"
            class="w-full rounded-xl px-5 py-4 bg-white text-gray-800 text-base font-medium appearance-none cursor-pointer"
            style="border: 2px solid #E5E7EB; background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236B7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E'); background-position: right 1rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 3rem;"
            required
            @focus="$event.target.style.borderColor='#3B82F6'; $event.target.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.1)'"
            @blur="$event.target.style.borderColor='#E5E7EB'; $event.target.style.boxShadow='none'"
          >
            <option value="">Select language...</option>
            <option>English</option>
            <option>Arabic</option>
            <option>Both</option>
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
</script>

