<template>
  <div class="file-upload">
    <div
      v-if="!uploading"
      @drop.prevent="handleDrop"
      @dragover.prevent="dragover = true"
      @dragleave.prevent="dragover = false"
      @click="triggerFileInput"
      class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
      :class="dragover ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="acceptTypes"
        @change="handleFileSelect"
        class="hidden"
      />
      <div class="flex flex-col items-center">
        <svg class="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
        </svg>
        <p class="text-sm text-gray-600 mb-1">
          <span class="text-blue-600 font-medium">Click to upload</span> or drag and drop
        </p>
        <p class="text-xs text-gray-500">
          {{ acceptText }} (Max {{ maxSizeMB }}MB)
        </p>
      </div>
    </div>

    <div v-if="uploading" class="border-2 border-blue-300 rounded-lg p-6 text-center bg-blue-50">
      <div class="flex flex-col items-center">
        <svg class="animate-spin h-8 w-8 text-blue-600 mb-3" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-sm text-gray-600">Uploading {{ uploadProgress }}%...</p>
      </div>
    </div>

    <!-- File Preview List -->
    <div v-if="files.length > 0 && !uploading" class="mt-4 space-y-2">
      <div
        v-for="(file, index) in files"
        :key="index"
        class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
      >
        <div class="flex items-center flex-1 min-w-0">
          <svg class="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ file.name }}</p>
            <p class="text-xs text-gray-500">{{ formatFileSize(file.size) }}</p>
          </div>
        </div>
        <button
          @click.stop="removeFile(index)"
          class="ml-3 text-red-600 hover:text-red-800 flex-shrink-0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Attachment Type Selector -->
    <div v-if="showAttachmentType && files.length > 0" class="mt-3">
      <label class="block text-sm font-medium text-gray-700 mb-1">Attachment Type</label>
      <select
        v-model="selectedAttachmentType"
        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="justification">Justification Document</option>
        <option value="director_approval">Director Approval</option>
        <option value="isqm_form">ISQM Form</option>
        <option value="global_clearance_excel">Global Clearance Excel</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import api from '@/services/api'

interface Props {
  requestId?: number | string
  acceptTypes?: string
  maxSizeMB?: number
  showAttachmentType?: boolean
  attachmentType?: string
  multiple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  acceptTypes: '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif',
  maxSizeMB: 10,
  showAttachmentType: true,
  attachmentType: 'justification',
  multiple: false
})

const emit = defineEmits<{
  (e: 'uploaded', file: any): void
  (e: 'removed', index: number): void
  (e: 'error', error: string): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const dragover = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const files = ref<File[]>([])
const selectedAttachmentType = ref(props.attachmentType)

const acceptText = computed(() => {
  if (props.acceptTypes.includes('pdf')) return 'PDF, DOCX, XLSX, Images'
  return 'Files'
})

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    processFiles(Array.from(target.files))
  }
}

function handleDrop(event: DragEvent) {
  dragover.value = false
  if (event.dataTransfer?.files) {
    processFiles(Array.from(event.dataTransfer.files))
  }
}

function processFiles(newFiles: File[]) {
  const maxSize = props.maxSizeMB * 1024 * 1024
  const validFiles: File[] = []

  for (const file of newFiles) {
    if (file.size > maxSize) {
      emit('error', `File "${file.name}" exceeds ${props.maxSizeMB}MB limit`)
      continue
    }
    validFiles.push(file)
  }

  if (props.multiple) {
    files.value.push(...validFiles)
  } else {
    files.value = validFiles.slice(0, 1)
  }

  // Auto-upload if requestId is provided
  if (props.requestId && files.value.length > 0) {
    uploadFiles()
  }
}

function removeFile(index: number) {
  files.value.splice(index, 1)
  emit('removed', index)
}

async function uploadFiles() {
  if (files.value.length === 0) return

  if (!props.requestId) {
    emit('error', 'Request ID is required for upload')
    return
  }

  uploading.value = true
  uploadProgress.value = 0

  try {
    for (const file of files.value) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('attachment_type', selectedAttachmentType.value)

      const response = await api.post(
        `/coi/requests/${props.requestId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            }
          }
        }
      )

      emit('uploaded', response.data.attachment)
    }

    files.value = []
    uploadProgress.value = 0
  } catch (error: any) {
    emit('error', error.response?.data?.error || 'Upload failed')
  } finally {
    uploading.value = false
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// Expose upload function for parent component
defineExpose({
  uploadFiles,
  clearFiles: () => { files.value = [] },
  getFiles: () => files.value
})
</script>

