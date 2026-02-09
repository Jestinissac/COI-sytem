<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="close"></div>

      <div class="inline-block align-bottom bg-white rounded border border-gray-200 text-left overflow-hidden sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900" id="modal-title">Share Report</h3>
            <button @click="close" class="text-gray-400 hover:text-gray-500" aria-label="Close">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="space-y-4">
            <!-- Share Options -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Share Method</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input type="radio" v-model="shareMethod" value="link" class="mr-2">
                  <span>Shareable Link</span>
                </label>
                <label class="flex items-center">
                  <input type="radio" v-model="shareMethod" value="email" class="mr-2">
                  <span>Email</span>
                </label>
              </div>
            </div>

            <!-- Link Sharing Options -->
            <div v-if="shareMethod === 'link'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Expires In</label>
                <select v-model="expiresInDays" class="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option :value="1">1 Day</option>
                  <option :value="7">7 Days</option>
                  <option :value="30">30 Days</option>
                  <option :value="90">90 Days</option>
                </select>
              </div>

              <div>
                <label class="flex items-center">
                  <input type="checkbox" v-model="requirePassword" class="mr-2">
                  <span class="text-sm text-gray-700">Require Password</span>
                </label>
                <input
                  v-if="requirePassword"
                  v-model="password"
                  type="password"
                  placeholder="Enter password"
                  class="mt-2 w-full border border-gray-300 rounded-md px-3 py-2"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Access Level</label>
                <select v-model="accessLevel" class="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="view">View Only</option>
                  <option value="download">View & Download</option>
                  <option value="export">View, Download & Export</option>
                </select>
              </div>

              <div v-if="shareLink" class="mt-4 p-3 bg-gray-50 rounded-md">
                <label class="block text-sm font-medium text-gray-700 mb-2">Shareable Link</label>
                <div class="flex items-center gap-2">
                  <input
                    :value="shareLink"
                    readonly
                    class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                  <button
                    @click="copyLink"
                    class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <!-- Email Sharing Options -->
            <div v-if="shareMethod === 'email'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                <input
                  v-model="emailRecipients"
                  type="text"
                  placeholder="email1@example.com, email2@example.com"
                  class="w-full border border-gray-300 rounded-md px-3 py-2"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Message (Optional)</label>
                <textarea
                  v-model="emailMessage"
                  rows="3"
                  class="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Add a custom message..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            @click="handleShare"
            :disabled="sharing"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            {{ sharing ? 'Sharing...' : shareMethod === 'link' && shareLink ? 'Update Share' : 'Create Share' }}
          </button>
          <button
            @click="close"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from '@/composables/useToast'
import { createReportShare, sendReportEmail } from '@/services/reportSharingService'

const toast = useToast()

interface Props {
  isOpen: boolean
  role: string
  reportType: string
  filters: Record<string, any>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const shareMethod = ref<'link' | 'email'>('link')
const expiresInDays = ref(30)
const requirePassword = ref(false)
const password = ref('')
const accessLevel = ref<'view' | 'download' | 'export'>('view')
const shareLink = ref('')
const sharing = ref(false)
const emailRecipients = ref('')
const emailMessage = ref('')

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    shareLink.value = ''
  }
})

function close() {
  emit('close')
}

async function handleShare() {
  if (shareMethod.value === 'link') {
    await createLinkShare()
  } else {
    await sendEmailShare()
  }
}

async function createLinkShare() {
  sharing.value = true
  try {
    const result = await createReportShare(props.role, props.reportType, props.filters, {
      password: requirePassword.value ? password.value : undefined,
      expiresInDays: expiresInDays.value,
      accessLevel: accessLevel.value
    })
    
    shareLink.value = `${window.location.origin}${result.shareUrl}`
    toast.success('Shareable link created successfully')
  } catch (error: any) {
    toast.error(error.message || 'Failed to create share')
  } finally {
    sharing.value = false
  }
}

async function sendEmailShare() {
  if (!emailRecipients.value.trim()) {
    toast.error('Please enter at least one recipient email')
    return
  }

  sharing.value = true
  try {
    await sendReportEmail(props.role, props.reportType, props.filters, {
      recipients: emailRecipients.value.split(',').map(e => e.trim()),
      message: emailMessage.value
    })
    
    toast.success('Report sent via email successfully')
    close()
  } catch (error: any) {
    toast.error(error.message || 'Failed to send email')
  } finally {
    sharing.value = false
  }
}

function copyLink() {
  if (shareLink.value) {
    navigator.clipboard.writeText(shareLink.value)
    toast.success('Link copied to clipboard')
  }
}
</script>
