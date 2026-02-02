<template>
  <div class="bg-white rounded-2xl overflow-hidden" style="box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid #F3F4F6;">
    <div class="px-8 py-5" style="background: linear-gradient(to right, #6366F1, #4F46E5);">
      <h3 class="text-xl font-bold text-white flex items-center">
        <span class="mr-3 text-2xl">✍️</span>
        Signatory Details
      </h3>
    </div>
    <div class="p-8 bg-gray-50 space-y-6">
      <div 
        v-for="(signatory, index) in formData.signatories" 
        :key="index" 
        class="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-indigo-300 transition-colors"
      >
        <div class="flex gap-6">
          <div class="flex-1">
            <label class="block text-sm font-bold text-gray-800 mb-2">Name</label>
            <select
              :value="signatory.signatory_id"
              @change="updateSignatory(index, 'signatory_id', Number(($event.target as HTMLSelectElement).value))"
              class="w-full rounded-xl px-5 py-4 bg-white text-gray-800 text-base font-medium appearance-none cursor-pointer"
              style="border: 2px solid #E5E7EB; background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236B7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E'); background-position: right 1rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 3rem;"
              @focus="$event.target.style.borderColor='#6366F1'; $event.target.style.boxShadow='0 0 0 3px rgba(99, 102, 241, 0.1)'"
              @blur="$event.target.style.borderColor='#E5E7EB'; $event.target.style.boxShadow='none'"
            >
              <option value="">Select signatory...</option>
              <option v-for="employee in employees" :key="employee.id" :value="employee.id">
                {{ employee.name }}
              </option>
            </select>
          </div>
          <div class="flex-1">
            <label class="block text-sm font-bold text-gray-800 mb-2">Position</label>
            <input
              :value="signatory.position"
              @input="updateSignatory(index, 'position', ($event.target as HTMLInputElement).value)"
              type="text"
              class="w-full rounded-xl px-5 py-4 bg-white text-gray-800 text-base font-medium"
              style="border: 2px solid #E5E7EB;"
              placeholder="Enter position..."
              @focus="$event.target.style.borderColor='#6366F1'; $event.target.style.boxShadow='0 0 0 3px rgba(99, 102, 241, 0.1)'"
              @blur="$event.target.style.borderColor='#E5E7EB'; $event.target.style.boxShadow='none'"
            />
          </div>
          <div class="flex items-end">
            <button
              type="button"
              @click="removeSignatory(index)"
              class="px-5 py-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
      
      <button
        type="button"
        @click="addSignatory"
        class="w-full px-5 py-4 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors font-semibold border-2 border-dashed border-indigo-300"
      >
        + Add Signatory
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { WizardFormData } from '@/composables/useWizard'

const props = defineProps<{
  formData: WizardFormData
}>()

const emit = defineEmits<{
  update: [data: Partial<WizardFormData>]
}>()

const employees = ref<any[]>([
  { id: 1, name: 'John Smith' },
  { id: 2, name: 'Sarah Johnson' },
  { id: 3, name: 'Michael Brown' }
])

function addSignatory() {
  const newSignatories = [...props.formData.signatories, { signatory_id: null, position: '' }]
  emit('update', { signatories: newSignatories })
}

function removeSignatory(index: number) {
  const newSignatories = props.formData.signatories.filter((_, i) => i !== index)
  emit('update', { signatories: newSignatories })
}

function updateSignatory(index: number, field: 'signatory_id' | 'position', value: any) {
  const newSignatories = [...props.formData.signatories]
  newSignatories[index] = { ...newSignatories[index], [field]: value }
  emit('update', { signatories: newSignatories })
}
</script>

