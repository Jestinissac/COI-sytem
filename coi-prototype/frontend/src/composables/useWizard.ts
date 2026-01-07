import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export interface WizardFormData {
  // Requestor Information
  requestor_name: string
  designation: string
  entity: string
  line_of_service: string
  
  // Document Information
  requested_document: string
  language: string
  
  // Client Information
  client_id: number | null
  parent_company: string
  client_location: string
  relationship_with_client: string
  client_type: string
  
  // Service Information
  service_type: string
  service_description: string
  requested_service_period_start: string
  requested_service_period_end: string
  
  // Ownership & Structure
  full_ownership_structure: string
  pie_status: string
  related_affiliated_entities: string
  
  // Signatories
  signatories: Array<{ signatory_id: number | null; position: string }>
  
  // International Operations
  international_operations: boolean
  foreign_subsidiaries: string
}

export function useWizard() {
  const authStore = useAuthStore()
  const currentStep = ref(1)
  const totalSteps = 7
  const completedSteps = ref<number[]>([])
  
  const formData = ref<WizardFormData>({
    requestor_name: authStore.user?.name || '',
    designation: '',
    entity: 'BDO Al Nisf & Partners',
    line_of_service: authStore.user?.department || '',
    requested_document: '',
    language: '',
    client_id: null,
    parent_company: '',
    client_location: 'State of Kuwait',
    relationship_with_client: '',
    client_type: '',
    service_type: '',
    service_description: '',
    requested_service_period_start: '',
    requested_service_period_end: '',
    full_ownership_structure: '',
    pie_status: 'No',
    related_affiliated_entities: '',
    signatories: [{ signatory_id: null, position: '' }],
    international_operations: false,
    foreign_subsidiaries: ''
  })
  
  const progress = computed(() => (currentStep.value / totalSteps) * 100)
  
  const canGoNext = computed(() => currentStep.value < totalSteps)
  const canGoPrev = computed(() => currentStep.value > 1)
  
  function nextStep() {
    if (canGoNext.value) {
      if (!completedSteps.value.includes(currentStep.value)) {
        completedSteps.value.push(currentStep.value)
      }
      currentStep.value++
    }
  }
  
  function prevStep() {
    if (canGoPrev.value) {
      currentStep.value--
    }
  }
  
  function goToStep(step: number) {
    if (step >= 1 && step <= totalSteps) {
      // Can only go to completed steps or the next step
      if (completedSteps.value.includes(step - 1) || step === 1 || step <= currentStep.value) {
        currentStep.value = step
      }
    }
  }
  
  function updateFormData(data: Partial<WizardFormData>) {
    formData.value = { ...formData.value, ...data }
    saveToLocalStorage()
  }
  
  function saveToLocalStorage() {
    try {
      localStorage.setItem('coi-wizard-data', JSON.stringify({
        formData: formData.value,
        currentStep: currentStep.value,
        completedSteps: completedSteps.value,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }
  
  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('coi-wizard-data')
      if (saved) {
        const data = JSON.parse(saved)
        // Check if data is less than 24 hours old
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          formData.value = { ...formData.value, ...data.formData }
          currentStep.value = data.currentStep || 1
          completedSteps.value = data.completedSteps || []
          return true
        }
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
    }
    return false
  }
  
  function clearLocalStorage() {
    try {
      localStorage.removeItem('coi-wizard-data')
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
  }
  
  function resetWizard() {
    currentStep.value = 1
    completedSteps.value = []
    formData.value = {
      requestor_name: authStore.user?.name || '',
      designation: '',
      entity: 'BDO Al Nisf & Partners',
      line_of_service: authStore.user?.department || '',
      requested_document: '',
      language: '',
      client_id: null,
      parent_company: '',
      client_location: 'State of Kuwait',
      relationship_with_client: '',
      client_type: '',
      service_type: '',
      service_description: '',
      requested_service_period_start: '',
      requested_service_period_end: '',
      full_ownership_structure: '',
      pie_status: 'No',
      related_affiliated_entities: '',
      signatories: [{ signatory_id: null, position: '' }],
      international_operations: false,
      foreign_subsidiaries: ''
    }
    clearLocalStorage()
  }
  
  return {
    currentStep,
    totalSteps,
    completedSteps,
    formData,
    progress,
    canGoNext,
    canGoPrev,
    nextStep,
    prevStep,
    goToStep,
    updateFormData,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,
    resetWizard
  }
}

