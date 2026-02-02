<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="handleClose" class="relative z-50">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-50" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-sm border border-gray-200 transition-all">
              <div class="flex justify-center mb-6">
                <div class="w-16 h-16 rounded-full flex items-center justify-center" style="background: linear-gradient(135deg, #0066CC, #0052CC);">
                  <span class="text-white text-3xl">{{ icon }}</span>
                </div>
              </div>
              
              <DialogTitle
                as="h3"
                class="text-2xl font-bold text-center text-gray-900 mb-3"
              >
                {{ title }}
              </DialogTitle>
              
              <div class="mt-2">
                <p class="text-base text-gray-600 text-center">
                  {{ message }}
                </p>
              </div>

              <div class="mt-8 flex gap-4">
                <button
                  type="button"
                  class="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  @click="handleClose"
                >
                  {{ cancelText }}
                </button>
                <button
                  type="button"
                  class="flex-1 px-6 py-3 text-white rounded-xl font-semibold transition-all"
                  :class="confirmButtonClasses"
                  @click="handleConfirm"
                >
                  {{ confirmText }}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle
} from '@headlessui/vue'

const props = withDefaults(defineProps<{
  isOpen: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'danger' | 'success'
  icon?: string
}>(), {
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  type: 'info',
  icon: '❓'
})

const emit = defineEmits<{
  confirm: []
  close: []
}>()

const confirmButtonClasses = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl'
    case 'warning':
      return 'bg-yellow-600 hover:bg-yellow-700 shadow-sm'
    case 'success':
      return 'bg-green-600 hover:bg-green-700 shadow-sm'
    default:
      return 'bg-primary-600 hover:bg-primary-700 shadow-sm'
  }
})

function handleConfirm() {
  emit('confirm')
  emit('close')
}

function handleClose() {
  emit('close')
}
</script>

