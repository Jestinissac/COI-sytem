<template>
  <div class="w-full">
    <div class="mb-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-gray-900">
          Step {{ currentStep }} of {{ totalSteps }}
        </h3>
        <div class="text-sm text-gray-600">
          {{ Math.round((currentStep / totalSteps) * 100) }}% Complete
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          class="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500 ease-out"
          :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
        ></div>
      </div>
    </div>
    
    <!-- Step Indicators -->
    <div class="flex justify-between items-start">
      <div 
        v-for="step in steps" 
        :key="step.number"
        class="flex flex-col items-center flex-1 relative"
        :class="{ 'cursor-pointer': canClickStep(step.number) }"
        @click="handleStepClick(step.number)"
      >
        <!-- Connector Line -->
        <div 
          v-if="step.number < totalSteps"
          class="absolute top-6 left-1/2 w-full h-0.5 transition-colors duration-300"
          :class="step.number < currentStep ? 'bg-primary-500' : 'bg-gray-200'"
          style="z-index: 0;"
        ></div>
        
        <!-- Step Circle -->
        <div 
          class="relative z-10 w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2"
          :class="getStepClasses(step.number)"
        >
          <span v-if="step.number < currentStep" class="text-white text-xl">✓</span>
          <span v-else-if="step.number === currentStep" class="text-white">{{ step.number }}</span>
          <span v-else class="text-gray-400">{{ step.number }}</span>
        </div>
        
        <!-- Step Label -->
        <div class="mt-2 text-center">
          <div 
            class="text-xs font-medium transition-colors duration-300"
            :class="step.number <= currentStep ? 'text-gray-900' : 'text-gray-400'"
          >
            {{ step.label }}
          </div>
          <div 
            v-if="step.number === currentStep"
            class="text-xs text-primary-600 font-semibold mt-1"
          >
            Current
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  currentStep: number
  totalSteps: number
  completedSteps?: number[]
}>()

const emit = defineEmits<{
  goToStep: [step: number]
}>()

const steps = computed(() => [
  { number: 1, label: 'Requestor' },
  { number: 2, label: 'Document' },
  { number: 3, label: 'Client' },
  { number: 4, label: 'Service' },
  { number: 5, label: 'Ownership' },
  { number: 6, label: 'Signatories' },
  { number: 7, label: 'International' }
])

function getStepClasses(stepNumber: number) {
  if (stepNumber < props.currentStep) {
    // Completed step
    return 'bg-primary-500 border-primary-500 shadow-lg'
  } else if (stepNumber === props.currentStep) {
    // Current step
    return 'bg-gradient-to-br from-primary-500 to-primary-600 border-primary-600 shadow-xl scale-110 animate-pulse'
  } else {
    // Future step
    return 'bg-white border-gray-300'
  }
}

function canClickStep(stepNumber: number) {
  // Can click on completed steps or current step
  return stepNumber <= props.currentStep
}

function handleStepClick(stepNumber: number) {
  if (canClickStep(stepNumber)) {
    emit('goToStep', stepNumber)
  }
}
</script>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>

