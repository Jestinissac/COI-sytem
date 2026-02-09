<template>
  <div class="space-y-6">
    <!-- Info Banner -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p class="text-sm text-blue-800">
        <strong>Note:</strong> Fill in as much information as you have. Fields you don't know (like Client ID) 
        will be completed by the PRMS Admin. Required fields are marked with *. In production, PRMS Admin will complete in PRMS.
      </p>
    </div>

    <!-- Client Information Section -->
    <div class="bg-white border border-gray-200 rounded-lg p-4">
      <h3 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
        Client Information
      </h3>
      
      <div class="grid grid-cols-2 gap-4">
        <!-- Client ID (disabled, system-generated) -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Client ID</label>
          <input 
            type="text" 
            disabled 
            placeholder="Will be assigned by PRMS Admin"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
          />
        </div>

        <!-- Name (required, pre-filled from prospect) -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Name <span class="text-red-500">*</span>
          </label>
          <input 
            v-model="formData.client_name"
            type="text" 
            required
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <!-- Legal Form -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Legal Form</label>
          <select v-model="formData.legal_form" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
            <option value="">Select Legal Form</option>
            <option value="W.L.L.">W.L.L.</option>
            <option value="S.P.C.">S.P.C.</option>
            <option value="K.S.C.C.">K.S.C.C.</option>
            <option value="K.S.C.P.">K.S.C.P.</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <!-- Parent Company -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Parent Company</label>
          <input 
            v-model="formData.parent_company"
            type="text"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
          />
        </div>

        <!-- Industry -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Industry <span class="text-red-500">*</span>
          </label>
          <select v-model="formData.industry" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
            <option value="">Select Industry</option>
            <option value="Financial Services">Financial Services</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Technology">Technology</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Retail">Retail</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <!-- Regulatory Body -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Regulatory Body</label>
          <select v-model="formData.regulatory_body" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
            <option value="">Select Regulatory Body</option>
            <option value="CBK">CBK - Central Bank of Kuwait</option>
            <option value="CMA">CMA - Capital Markets Authority</option>
            <option value="MOCI">MOCI - Ministry of Commerce and Industry</option>
            <option value="None">None</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Contact Details Section -->
    <div class="bg-white border border-gray-200 rounded-lg p-4">
      <h3 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
        </svg>
        Contact Details
      </h3>

      <div v-for="(contact, index) in formData.contacts" :key="index" class="grid grid-cols-5 gap-3 mb-3">
        <input v-model="contact.name" placeholder="Contact Person Name" class="px-3 py-2 text-sm border rounded-lg" />
        <input v-model="contact.designation" placeholder="Designation" class="px-3 py-2 text-sm border rounded-lg" />
        <input v-model="contact.email" type="email" placeholder="Email" class="px-3 py-2 text-sm border rounded-lg" />
        <input v-model="contact.phone" placeholder="Phone" class="px-3 py-2 text-sm border rounded-lg" />
        <div class="flex items-center gap-2">
          <input v-model="contact.fax" placeholder="Fax" class="flex-1 px-3 py-2 text-sm border rounded-lg" />
          <button 
            v-if="formData.contacts.length > 1"
            @click="removeContact(index)"
            class="p-2 text-red-600 hover:bg-red-50 rounded"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>

      <button 
        @click="addContact"
        class="text-sm text-purple-600 hover:text-purple-800 font-medium"
      >
        + Add Another Contact
      </button>
    </div>

    <!-- Address Information Section -->
    <div class="bg-white border border-gray-200 rounded-lg p-4">
      <h3 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        Address Information
      </h3>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Physical Address</label>
          <textarea 
            v-model="formData.physical_address"
            rows="3"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
          ></textarea>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Billing Address</label>
          <textarea 
            v-model="formData.billing_address"
            rows="3"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
          ></textarea>
        </div>

        <div class="col-span-2">
          <label class="block text-xs font-medium text-gray-700 mb-1">Description</label>
          <textarea 
            v-model="formData.description"
            rows="2"
            placeholder="Any additional information about the client..."
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  prospect: any
  coiRequest: any
  modelValue: any
  adminMode?: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const formData = ref({
  client_name: props.prospect?.prospect_name || props.coiRequest?.client_name || '',
  legal_form: '',
  industry: props.prospect?.industry || '',
  regulatory_body: '',
  parent_company: '',
  contacts: [{
    name: props.prospect?.contact_person || '',
    designation: '',
    email: props.prospect?.contact_email || '',
    phone: props.prospect?.contact_phone || '',
    fax: ''
  }],
  physical_address: props.prospect?.location || '',
  billing_address: '',
  description: props.prospect?.notes || ''
})

watch(formData, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

function addContact() {
  formData.value.contacts.push({ name: '', designation: '', email: '', phone: '', fax: '' })
}

function removeContact(index: number) {
  formData.value.contacts.splice(index, 1)
}
</script>
