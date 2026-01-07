<template>
  <div class="bg-white rounded-2xl overflow-hidden" style="box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid #F3F4F6;">
    <div class="px-8 py-5" style="background: linear-gradient(to right, #10B981, #059669);">
      <h3 class="text-xl font-bold text-white flex items-center">
        <span class="mr-3 text-2xl">🏢</span>
        Client Information
      </h3>
    </div>
    <div class="p-8 bg-gradient-to-b from-green-50 to-white space-y-8">
      <div>
        <label class="block text-sm font-bold text-gray-800 mb-2">Client Name *</label>
        <select
          :value="formData.client_id"
          @change="handleUpdate('client_id', Number(($event.target as HTMLSelectElement).value))"
          class="w-full rounded-xl px-5 py-4 bg-white text-gray-800 text-base font-medium appearance-none cursor-pointer"
          style="border: 2px solid #E5E7EB; background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236B7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E'); background-position: right 1rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 3rem;"
          required
          @focus="$event.target.style.borderColor='#10B981'; $event.target.style.boxShadow='0 0 0 3px rgba(16, 185, 129, 0.1)'"
          @blur="$event.target.style.borderColor='#E5E7EB'; $event.target.style.boxShadow='none'"
        >
          <option value="">Select client...</option>
          <option v-for="client in clients" :key="client.id" :value="client.id">
            {{ client.client_name }} ({{ client.client_code }})
          </option>
        </select>
        <button
          type="button"
          @click="requestNewClient"
          class="mt-3 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
        >
          + Request New Client
        </button>
      </div>
      
      <div v-if="showParentCompany" class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
        <label class="block text-sm font-bold text-gray-800 mb-2">Parent Company *</label>
        <input
          :value="formData.parent_company"
          @input="handleUpdate('parent_company', ($event.target as HTMLInputElement).value)"
          type="text"
          class="w-full rounded-xl px-5 py-4 bg-white text-gray-800 text-base font-medium"
          style="border: 2px solid #FCD34D;"
          :required="showParentCompany"
        />
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="space-y-2">
          <label class="block text-sm font-bold text-gray-800 mb-2">Relationship with Client *</label>
          <select 
            :value="formData.relationship_with_client"
            @change="handleUpdate('relationship_with_client', ($event.target as HTMLSelectElement).value)"
            class="w-full rounded-xl px-5 py-4 bg-white text-gray-800 text-base font-medium appearance-none cursor-pointer"
            style="border: 2px solid #E5E7EB; background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236B7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E'); background-position: right 1rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 3rem;"
            required
            @focus="$event.target.style.borderColor='#10B981'; $event.target.style.boxShadow='0 0 0 3px rgba(16, 185, 129, 0.1)'"
            @blur="$event.target.style.borderColor='#E5E7EB'; $event.target.style.boxShadow='none'"
          >
            <option value="">Select relationship...</option>
            <option>New Client</option>
            <option>Existing Client</option>
            <option>Potential Client</option>
          </select>
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-bold text-gray-800 mb-2">Client Type *</label>
          <select 
            :value="formData.client_type"
            @change="handleUpdate('client_type', ($event.target as HTMLSelectElement).value)"
            class="w-full rounded-xl px-5 py-4 bg-white text-gray-800 text-base font-medium appearance-none cursor-pointer"
            style="border: 2px solid #E5E7EB; background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236B7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E'); background-position: right 1rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 3rem;"
            required
            @focus="$event.target.style.borderColor='#10B981'; $event.target.style.boxShadow='0 0 0 3px rgba(16, 185, 129, 0.1)'"
            @blur="$event.target.style.borderColor='#E5E7EB'; $event.target.style.boxShadow='none'"
          >
            <option value="">Select client type...</option>
            <option>W.L.L. (With Limited Liability)</option>
            <option>S.A.K. (Shareholding Company)</option>
            <option>K.S.C. (Kuwait Shareholding Company)</option>
            <option>Partnership</option>
            <option>Sole Proprietorship</option>
            <option>Other</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { WizardFormData } from '@/composables/useWizard'
import api from '@/services/api'

const props = defineProps<{
  formData: WizardFormData
}>()

const emit = defineEmits<{
  update: [data: Partial<WizardFormData>]
}>()

const clients = ref<any[]>([])

const showParentCompany = computed(() => {
  return props.formData.relationship_with_client === 'Potential Client' ||
         props.formData.international_operations ||
         props.formData.pie_status === 'Yes'
})

async function loadClients() {
  try {
    const response = await api.get('/integration/clients')
    clients.value = response.data
  } catch (error) {
    console.error('Failed to load clients:', error)
  }
}

function handleUpdate(field: keyof WizardFormData, value: any) {
  emit('update', { [field]: value })
}

function requestNewClient() {
  info('Client request feature - coming soon')
}

// Import useToast
import { useToast } from '@/composables/useToast'
const { info: showInfo } = useToast()
const info = showInfo

onMounted(() => {
  loadClients()
})
</script>

