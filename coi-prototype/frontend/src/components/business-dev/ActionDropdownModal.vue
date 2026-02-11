<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">Take Action</h3>
        <p class="text-sm text-gray-500 mt-1">
          {{ recommendation?.clientName }} - {{ recommendation?.serviceName }}
        </p>
      </div>

      <!-- Action Options -->
      <div class="px-6 py-4 space-y-3">
        <!-- Create Prospect Option -->
        <label 
          class="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors"
          :class="selectedAction === 'prospect' ? 'border-primary-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
        >
          <input 
            type="radio" 
            v-model="selectedAction" 
            value="prospect"
            class="mt-1 w-4 h-4 text-blue-600"
          />
          <div class="flex-1">
            <p class="font-medium text-gray-900">Create Prospect</p>
            <p class="text-sm text-gray-500">Add as new prospect in CRM pipeline</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
          </div>
        </label>

        <!-- Create COI Request Option -->
        <label 
          class="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors"
          :class="selectedAction === 'coi' ? 'border-primary-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
        >
          <input 
            type="radio" 
            v-model="selectedAction" 
            value="coi"
            class="mt-1 w-4 h-4 text-blue-600"
          />
          <div class="flex-1">
            <p class="font-medium text-gray-900">Create COI Request</p>
            <p class="text-sm text-gray-500">Start conflict of interest check for this client</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
        </label>

        <!-- Log Interaction Option -->
        <label 
          class="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors"
          :class="selectedAction === 'log' ? 'border-primary-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
        >
          <input 
            type="radio" 
            v-model="selectedAction" 
            value="log"
            class="mt-1 w-4 h-4 text-blue-600"
          />
          <div class="flex-1">
            <p class="font-medium text-gray-900">Log Interaction Only</p>
            <p class="text-sm text-gray-500">Record contact without formal process</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </div>
        </label>
      </div>

      <!-- Log Interaction Form (shown when log is selected) -->
      <div v-if="selectedAction === 'log'" class="px-6 pb-4 space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Interaction Type</label>
          <select v-model="interactionData.type" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option value="call">Phone Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
            <option value="follow_up">Follow-up</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea 
            v-model="interactionData.notes" 
            rows="2" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Brief notes about the interaction..."
          ></textarea>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          @click="executeAction"
          :disabled="!selectedAction || processing"
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <div v-if="processing" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          {{ processing ? 'Processing...' : 'Continue' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const props = defineProps<{
  recommendation: any
}>()

const emit = defineEmits(['close', 'action-taken'])

const router = useRouter()

const selectedAction = ref<'prospect' | 'coi' | 'log' | ''>('')
const processing = ref(false)

const interactionData = ref({
  type: 'call',
  notes: ''
})

async function executeAction() {
  if (!selectedAction.value) return
  
  processing.value = true
  
  try {
    switch (selectedAction.value) {
      case 'prospect':
        await createProspect()
        break
      case 'coi':
        navigateToCOI()
        break
      case 'log':
        await logInteraction()
        break
    }
    
    emit('action-taken')
  } catch (error: any) {
    console.error('Action failed:', error)
    alert(error.response?.data?.error || 'Action failed. Please try again.')
  } finally {
    processing.value = false
  }
}

async function createProspect() {
  // Create prospect from opportunity
  const opportunityId = props.recommendation?.opportunityId || props.recommendation?.id
  
  if (opportunityId) {
    await api.post(`/prospects/from-opportunity/${opportunityId}`)
  } else {
    // Create prospect directly
    await api.post('/prospects', {
      prospect_name: props.recommendation?.clientName,
      industry: props.recommendation?.industry || null,
      status: 'Active',
      source_notes: `Created from AI insight: ${props.recommendation?.reasoning}`
    })
  }
  
  // Navigate to prospects tab
  emit('close')
}

function navigateToCOI() {
  const clientName = encodeURIComponent(props.recommendation?.clientName || '')
  const clientId = props.recommendation?.clientId
  
  let query = `?client_name=${clientName}`
  if (clientId) {
    query += `&client_id=${clientId}`
  }
  
  router.push(`/coi/request/new${query}`)
  emit('close')
}

async function logInteraction() {
  await api.post('/client-intelligence/interactions', {
    clientId: props.recommendation?.clientId,
    opportunityId: props.recommendation?.opportunityId || null,
    interactionType: interactionData.value.type,
    interactionDate: new Date().toISOString().split('T')[0],
    subject: `Follow-up: ${props.recommendation?.serviceName}`,
    notes: interactionData.value.notes || `Contacted regarding ${props.recommendation?.serviceName} opportunity.`,
    outcome: 'pending',
    nextAction: 'Schedule follow-up',
    nextActionDate: props.recommendation?.suggestedDate
  })
}
</script>
