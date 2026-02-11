<template>
  <Transition name="modal">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click.self="handleClose"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" aria-hidden="true"></div>

      <!-- Modal Container -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div
          ref="modalRef"
          class="relative bg-white rounded border border-gray-200 max-w-6xl w-full max-h-[90vh] flex flex-col"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-8 py-6 border-b border-gray-200">
            <div>
              <h2 id="modal-title" class="text-xl font-semibold text-gray-900">{{ title }}</h2>
              <p v-if="data.length > 0" class="text-sm text-gray-500 mt-1">
                {{ data.length }} {{ data.length === 1 ? 'request' : 'requests' }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <!-- Export Button -->
              <button
                v-if="data.length > 0"
                @click="handleExport"
                class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                aria-label="Export to Excel"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Export Excel
              </button>
              <!-- Close Button -->
              <button
                @click="handleClose"
                class="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                aria-label="Close modal"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-hidden flex flex-col">
            <!-- Loading State -->
            <div v-if="loading" class="flex-1 flex items-center justify-center py-16">
              <div class="text-center">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
                <p class="mt-4 text-sm text-gray-500">Loading data...</p>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="!loading && data.length === 0" class="flex-1 flex items-center justify-center py-16">
              <div class="text-center">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <h3 class="mt-4 text-sm font-medium text-gray-900">No requests found</h3>
                <p class="mt-2 text-sm text-gray-500">No requests match the selected filter criteria.</p>
              </div>
            </div>

            <!-- Table -->
            <div v-else class="flex-1 overflow-auto">
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th
                        v-for="column in columns"
                        :key="column.key"
                        :class="['sortable', sortColumn === column.key ? `sort-${sortDirection}` : '']"
                        @click="handleSort(column.key)"
                        :aria-sort="sortColumn === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'"
                      >
                        <div class="flex items-center gap-2">
                          <span>{{ column.label }}</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, index) in sortedData"
                      :key="row.id || row.request_id || index"
                      class="hover:bg-gray-50 transition-colors"
                    >
                      <td class="font-medium text-gray-900">{{ row.request_id || 'N/A' }}</td>
                      <td>{{ row.client_name || 'N/A' }}</td>
                      <td>{{ row.service_type || 'N/A' }}</td>
                      <td>
                        <StatusBadge :status="row.status || 'Unknown'" />
                      </td>
                      <td>{{ row.requester_name || 'N/A' }}</td>
                      <td class="text-gray-600">{{ formatDate(row.created_at) }}</td>
                      <td class="text-gray-600">{{ formatDate(row.updated_at) }}</td>
                      <td v-if="showDepartment">{{ row.department || row.requester_department || 'N/A' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Pagination (if needed) -->
            <div v-if="data.length > pageSize" class="px-8 py-4 border-t border-gray-200 flex items-center justify-between">
              <p class="text-sm text-gray-500">
                Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ data.length }} requests
              </p>
              <div class="flex items-center gap-2">
                <button
                  @click="currentPage--"
                  :disabled="currentPage === 1"
                  class="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <span class="text-sm font-medium text-gray-700">Page {{ currentPage }} of {{ totalPages }}</span>
                <button
                  @click="currentPage++"
                  :disabled="currentPage === totalPages"
                  class="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'

interface Props {
  isOpen: boolean
  title: string
  data: any[]
  loading?: boolean
  showDepartment?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showDepartment: false
})

const emit = defineEmits<{
  close: []
  export: []
}>()

// Table columns
const columns = computed(() => {
  const baseColumns = [
    { key: 'request_id', label: 'Request ID' },
    { key: 'client_name', label: 'Client' },
    { key: 'service_type', label: 'Service Type' },
    { key: 'status', label: 'Status' },
    { key: 'requester_name', label: 'Requester' },
    { key: 'created_at', label: 'Created' },
    { key: 'updated_at', label: 'Updated' }
  ]
  
  if (props.showDepartment) {
    baseColumns.push({ key: 'department', label: 'Department' })
  }
  
  return baseColumns
})

// Sorting
const sortColumn = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

// Pagination
const pageSize = 50
const currentPage = ref(1)

// Computed
const sortedData = computed(() => {
  let result = [...props.data]
  
  // Apply sorting
  if (sortColumn.value) {
    result.sort((a, b) => {
      const aVal = a[sortColumn.value!]
      const bVal = b[sortColumn.value!]
      
      // Handle null/undefined
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      
      // Handle dates
      if (sortColumn.value === 'created_at' || sortColumn.value === 'updated_at') {
        const aDate = new Date(aVal).getTime()
        const bDate = new Date(bVal).getTime()
        return sortDirection.value === 'asc' ? aDate - bDate : bDate - aDate
      }
      
      // Handle strings
      const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' })
      return sortDirection.value === 'asc' ? comparison : -comparison
    })
  }
  
  // Apply pagination
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return result.slice(start, end)
})

const totalPages = computed(() => Math.ceil(props.data.length / pageSize))
const startIndex = computed(() => (currentPage.value - 1) * pageSize)
const endIndex = computed(() => Math.min(startIndex.value + pageSize, props.data.length))

// Methods
function handleSort(column: string) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
  // Reset to first page when sorting changes
  currentPage.value = 1
}

function handleClose() {
  emit('close')
}

function handleExport() {
  emit('export')
}

function formatDate(date: string | null | undefined): string {
  if (!date) return 'N/A'
  try {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return 'N/A'
  }
}

// Focus trap for accessibility
const modalRef = ref<HTMLElement | null>(null)
const previousActiveElement = ref<HTMLElement | null>(null)

function trapFocus(event: KeyboardEvent) {
  if (!props.isOpen || !modalRef.value) return
  
  const focusableElements = modalRef.value.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  if (focusableElements.length === 0) return
  
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  
  if (event.key === 'Tab') {
    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }
}

// Keyboard navigation
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.isOpen) {
    handleClose()
  }
  trapFocus(event)
}

// Watch for modal open/close to manage focus
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    // Store current active element
    previousActiveElement.value = document.activeElement as HTMLElement
    // Focus first focusable element in modal
    nextTick(() => {
      if (modalRef.value) {
        const firstFocusable = modalRef.value.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (firstFocusable) {
          firstFocusable.focus()
        }
      }
    })
  } else {
    // Restore focus to previous element
    if (previousActiveElement.value) {
      previousActiveElement.value.focus()
    }
  }
})

// Watch for data changes and reset pagination
watch(() => props.data, () => {
  currentPage.value = 1
  sortColumn.value = null
  sortDirection.value = 'asc'
}, { deep: true })

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.table-container {
  max-height: 60vh;
  overflow-y: auto;
  overflow-x: auto;
  border: 1px solid #e5e7eb;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 800px;
}

.data-table th {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  position: sticky;
  top: 0;
  z-index: 10;
  white-space: nowrap;
}

.data-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
  position: relative;
  padding-right: 24px;
}

.data-table th.sortable:hover {
  background: #f3f4f6;
}

.data-table th.sortable::after {
  content: '';
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  opacity: 0.3;
}

.data-table th.sort-asc::after {
  border-bottom: 6px solid #6b7280;
  opacity: 1;
}

.data-table th.sort-desc::after {
  border-top: 6px solid #6b7280;
  opacity: 1;
}

.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
}

.data-table tbody tr:nth-child(even) {
  background: #f9fafb;
}

.data-table tbody tr:hover {
  background: #f3f4f6;
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from .bg-white,
.modal-leave-to .bg-white {
  transform: scale(0.95);
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .data-table {
    font-size: 12px;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px;
  }
}
</style>
