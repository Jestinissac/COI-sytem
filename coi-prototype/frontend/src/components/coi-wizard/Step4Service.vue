<template>
  <div class="bg-white rounded-2xl overflow-hidden" style="box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid #F3F4F6;">
    <div class="px-8 py-5" style="background: linear-gradient(to right, #8B5CF6, #7C3AED);">
      <h3 class="text-xl font-bold text-white flex items-center">
        <span class="mr-3 text-2xl">⚙️</span>
        Service Information
      </h3>
    </div>
    <div class="p-8 bg-gradient-to-b from-purple-50 to-white space-y-8">
      <div>
        <label class="block text-sm font-bold text-gray-800 mb-2">Service Type *</label>
        <select 
          :value="formData.service_type"
          @change="handleUpdate('service_type', ($event.target as HTMLSelectElement).value)"
          class="w-full rounded-xl px-5 py-4 bg-white text-gray-800 text-base font-medium appearance-none cursor-pointer"
          style="border: 2px solid #E5E7EB; background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236B7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E'); background-position: right 1rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 3rem;"
          required
          @focus="$event.target.style.borderColor='#8B5CF6'; $event.target.style.boxShadow='0 0 0 3px rgba(139, 92, 246, 0.1)'"
          @blur="$event.target.style.borderColor='#E5E7EB'; $event.target.style.boxShadow='none'"
        >
          <option value="">Select service type...</option>
          <optgroup label="Audit & Assurance">
            <option>Statutory Audit Services</option>
            <option>Review Services</option>
            <option>Agreed-Upon Procedures</option>
            <option>Compilation Services</option>
          </optgroup>
          <optgroup label="Advisory">
            <option>Management Consulting</option>
            <option>Corporate Finance</option>
            <option>Transactions</option>
            <option>Due Diligence</option>
          </optgroup>
          <optgroup label="Tax">
            <option>Tax Compliance</option>
            <option>Tax Advisory</option>
            <option>Tax Planning</option>
          </optgroup>
          <optgroup label="Accounting">
            <option>Bookkeeping</option>
            <option>Financial Reporting</option>
          </optgroup>
        </select>
      </div>
      
      <div>
        <label class="block text-sm font-bold text-gray-800 mb-2">Service Description *</label>
        <textarea
          :value="formData.service_description"
          @input="handleUpdate('service_description', ($event.target as HTMLTextAreaElement).value)"
          rows="4"
          class="w-full rounded-xl px-5 py-4 bg-white text-gray-800 text-base font-medium resize-none"
          style="border: 2px solid #E5E7EB;"
          placeholder="Describe the services to be provided..."
          required
          @focus="$event.target.style.borderColor='#8B5CF6'; $event.target.style.boxShadow='0 0 0 3px rgba(139, 92, 246, 0.1)'"
          @blur="$event.target.style.borderColor='#E5E7EB'; $event.target.style.boxShadow='none'"
        ></textarea>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="space-y-2">
          <label class="block text-sm font-bold text-gray-800 mb-2">Service Period Start *</label>
          <input
            :value="formData.requested_service_period_start"
            @input="handleUpdate('requested_service_period_start', ($event.target as HTMLInputElement).value)"
            type="date"
            class="w-full rounded-xl px-5 py-4 bg-white text-gray-800 text-base font-medium"
            style="border: 2px solid #E5E7EB;"
            required
            @focus="$event.target.style.borderColor='#8B5CF6'; $event.target.style.boxShadow='0 0 0 3px rgba(139, 92, 246, 0.1)'"
            @blur="$event.target.style.borderColor='#E5E7EB'; $event.target.style.boxShadow='none'"
          />
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-bold text-gray-800 mb-2">Service Period End *</label>
          <input
            :value="formData.requested_service_period_end"
            @input="handleUpdate('requested_service_period_end', ($event.target as HTMLInputElement).value)"
            type="date"
            class="w-full rounded-xl px-5 py-4 bg-white text-gray-800 text-base font-medium"
            style="border: 2px solid #E5E7EB;"
            required
            @focus="$event.target.style.borderColor='#8B5CF6'; $event.target.style.boxShadow='0 0 0 3px rgba(139, 92, 246, 0.1)'"
            @blur="$event.target.style.borderColor='#E5E7EB'; $event.target.style.boxShadow='none'"
          />
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

