<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Top Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button @click="goBack" class="p-2 hover:bg-gray-100 rounded-md transition-colors">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div v-if="request">
              <div class="flex items-center gap-3">
                <h1 class="text-xl font-semibold text-gray-900">{{ request.request_id }}</h1>
                <span :class="getStatusClass(request.status)" class="px-2.5 py-1 text-xs font-medium rounded">
                  {{ request.status }}
                </span>
              </div>
              <p class="text-sm text-gray-500 mt-1">{{ request.client_name || 'No client' }} · {{ request.service_type || 'General' }}</p>
            </div>
            <div v-else>
              <h1 class="text-xl font-semibold text-gray-900">Request Details</h1>
            </div>
          </div>
          <button 
            v-if="request?.status === 'Draft'"
            @click="editDraft"
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Edit Draft
          </button>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-6">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-12 bg-white rounded-lg shadow-sm">
        <div class="flex items-center justify-center">
          <svg class="animate-spin h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-gray-500">Loading request...</span>
        </div>
      </div>
    
      <div v-else-if="request" class="grid grid-cols-3 gap-6">
        <!-- Main Content (2 cols) -->
        <div class="col-span-2 space-y-6">
          <!-- Request Details -->
          <div class="bg-white rounded-lg shadow-sm">
            <div class="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
              <h2 class="font-medium text-gray-900">Request Details</h2>
            </div>
            <div class="p-4">
              <table class="w-full text-sm">
                <tbody>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500 w-1/3">Requestor</td>
                    <td class="py-2 text-gray-900">{{ request.requestor_name || request.requester_name || 'N/A' }}</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">Department</td>
                    <td class="py-2 text-gray-900">{{ request.department || 'N/A' }}</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">Entity</td>
                    <td class="py-2 text-gray-900">{{ request.entity || 'BDO Al Nisf & Partners' }}</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">Document Type</td>
                    <td class="py-2 text-gray-900">{{ request.requested_document || 'Proposal' }}</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">Stage</td>
                    <td class="py-2 text-gray-900">{{ request.stage || 'Proposal' }}</td>
                  </tr>
                  <tr>
                    <td class="py-2 text-gray-500">Created</td>
                    <td class="py-2 text-gray-900">{{ formatDate(request.created_at) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Client Details -->
          <div class="bg-white rounded-lg shadow-sm">
            <div class="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
              <h2 class="font-medium text-gray-900">Client Information</h2>
            </div>
            <div class="p-4">
              <table class="w-full text-sm">
                <tbody>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500 w-1/3">Client Name</td>
                    <td class="py-2 text-gray-900">{{ request.client_name || 'N/A' }}</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">Client Code</td>
                    <td class="py-2 text-gray-900 font-mono">{{ request.client_code || 'N/A' }}</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">Location</td>
                    <td class="py-2 text-gray-900">{{ request.client_location || 'N/A' }}</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">Client Type</td>
                    <td class="py-2 text-gray-900">{{ request.client_type || 'N/A' }}</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">Relationship</td>
                    <td class="py-2 text-gray-900">{{ request.relationship_with_client || 'New Client' }}</td>
                  </tr>
                  <tr>
                    <td class="py-2 text-gray-500">PIE Status</td>
                    <td class="py-2" :class="request.pie_status === 'Yes' ? 'text-red-600 font-medium' : 'text-gray-900'">
                      {{ request.pie_status || 'No' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Service Description -->
          <div class="bg-white rounded-lg shadow-sm">
            <div class="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
              <h2 class="font-medium text-gray-900">Service Description</h2>
            </div>
            <div class="p-4">
              <p class="text-sm text-gray-700">{{ request.service_description || 'No description provided.' }}</p>
            </div>
          </div>

          <!-- Previous Engagements -->
          <div v-if="previousEngagements.length > 0" class="bg-white rounded-lg shadow-sm">
            <div class="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
              <h2 class="font-medium text-gray-900">Previous Engagements ({{ previousEngagements.length }})</h2>
            </div>
            <table class="w-full text-sm">
              <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th class="px-4 py-2 text-left">Request ID</th>
                  <th class="px-4 py-2 text-left">Service</th>
                  <th class="px-4 py-2 text-left">Status</th>
                  <th class="px-4 py-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="eng in previousEngagements" :key="eng.id">
                  <td class="px-4 py-2 text-gray-900">{{ eng.request_id }}</td>
                  <td class="px-4 py-2 text-gray-600">{{ eng.service_type }}</td>
                  <td class="px-4 py-2">
                    <span :class="eng.status === 'Active' ? 'text-green-600' : 'text-gray-500'">{{ eng.status }}</span>
                  </td>
                  <td class="px-4 py-2 text-gray-500">{{ formatDate(eng.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sidebar (1 col) -->
        <div class="space-y-6">
          <!-- System Checks -->
          <div class="bg-white rounded-lg shadow-sm">
            <div class="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
              <h2 class="font-medium text-gray-900">System Checks</h2>
            </div>
            <div v-if="validationLoading" class="p-4 text-center text-sm text-gray-500">
              Running checks...
            </div>
            <div v-else class="divide-y text-sm">
              <div class="px-4 py-3 flex items-center justify-between">
                <span class="text-gray-600">Client in PRMS</span>
                <span :class="validationChecks.clientExists ? 'text-green-600' : 'text-red-600'" class="font-medium">
                  {{ validationChecks.clientExists ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="px-4 py-3 flex items-center justify-between">
                <span class="text-gray-600">Client Active</span>
                <span :class="validationChecks.clientActive ? 'text-green-600' : 'text-yellow-600'" class="font-medium">
                  {{ validationChecks.clientActive ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="px-4 py-3 flex items-center justify-between">
                <span class="text-gray-600">Previous COI</span>
                <span :class="validationChecks.hasPreviousCOI ? 'text-yellow-600' : 'text-green-600'" class="font-medium">
                  {{ validationChecks.hasPreviousCOI ? `${validationChecks.previousCOICount} found` : 'None' }}
                </span>
              </div>
              <div class="px-4 py-3 flex items-center justify-between">
                <span class="text-gray-600">Service Conflict</span>
                <span :class="validationChecks.hasServiceConflict ? 'text-red-600' : 'text-green-600'" class="font-medium">
                  {{ validationChecks.hasServiceConflict ? 'Yes' : 'None' }}
                </span>
              </div>
            </div>
          </div>

          <!-- System Recommendations -->
          <div v-if="ruleRecommendations && ruleRecommendations.length > 0" class="bg-blue-50 border border-blue-200 rounded-lg">
            <div class="px-4 py-3 border-b border-blue-200 bg-blue-100 rounded-t-lg">
              <h2 class="font-medium text-blue-800">System Recommendations</h2>
              <p class="text-xs text-blue-600 mt-1">{{ ruleRecommendations.length }} rule(s) matched</p>
            </div>
            <div class="p-4 space-y-3">
              <div v-for="(rec, i) in ruleRecommendations" :key="i" class="bg-white rounded-lg p-3 border border-blue-200">
                <div class="flex items-start justify-between mb-2">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-medium text-blue-900">{{ rec.ruleName }}</span>
                      <span 
                        :class="getRecommendationBadgeClass(rec.recommendedAction)"
                        class="px-2 py-0.5 text-xs font-medium rounded"
                      >
                        {{ getRecommendationLabel(rec.recommendedAction) }}
                      </span>
                    </div>
                    <p class="text-sm text-blue-700">{{ rec.reason || rec.guidance }}</p>
                  </div>
                </div>
                <div class="text-xs text-blue-600 mt-2">
                  <span>Confidence: {{ rec.confidence || 'MEDIUM' }}</span>
                  <span v-if="rec.canOverride" class="ml-3">• Can be overridden</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Duplication Alert -->
          <div v-if="duplicationMatches && duplicationMatches.length > 0" class="bg-yellow-50 border border-yellow-200 rounded-lg">
            <div class="px-4 py-3 border-b border-yellow-200 bg-yellow-100 rounded-t-lg">
              <h2 class="font-medium text-yellow-800">Duplication Alert</h2>
            </div>
            <div class="p-4 space-y-2">
              <div v-for="(match, i) in duplicationMatches" :key="i" class="text-sm">
                <div class="flex justify-between text-yellow-800">
                  <span>{{ match.existingEngagement?.client_name || 'Unknown' }}</span>
                  <span class="font-medium">{{ match.matchScore }}%</span>
                </div>
                <p class="text-xs text-yellow-600">{{ match.reason }}</p>
              </div>
            </div>
          </div>

          <!-- Attachments -->
          <div class="bg-white rounded-lg shadow-sm">
            <div class="px-4 py-3 border-b bg-gray-50 rounded-t-lg flex items-center justify-between">
              <h2 class="font-medium text-gray-900">Attachments</h2>
              <button
                v-if="canUploadAttachment"
                @click="showUploadModal = true"
                class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Upload
              </button>
            </div>
            <div class="p-4">
              <div v-if="attachments.length === 0" class="text-center py-6 text-gray-500 text-sm">
                No attachments uploaded
              </div>
              <div v-else class="space-y-2">
                <div
                  v-for="attachment in attachments"
                  :key="attachment.id"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div class="flex items-center flex-1 min-w-0">
                    <svg class="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ attachment.file_name }}</p>
                      <div class="flex items-center gap-2 mt-1">
                        <span 
                          :class="getAttachmentTypeClass(attachment.attachment_type)"
                          class="px-2 py-0.5 text-xs font-medium rounded"
                        >
                          {{ getAttachmentTypeLabel(attachment.attachment_type) }}
                        </span>
                        <span class="text-xs text-gray-500">{{ formatFileSize(attachment.file_size) }}</span>
                        <span class="text-xs text-gray-500">·</span>
                        <span class="text-xs text-gray-500">{{ formatDate(attachment.created_at) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 ml-3">
                    <button
                      @click="downloadAttachment(attachment.id)"
                      class="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Download
                    </button>
                    <button
                      v-if="canDeleteAttachment(attachment)"
                      @click="deleteAttachment(attachment.id)"
                      class="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Workflow -->
          <div class="bg-white rounded-lg shadow-sm">
            <div class="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
              <h2 class="font-medium text-gray-900">Workflow</h2>
            </div>
            <div class="p-4 space-y-2 text-sm">
              <div v-for="step in workflowSteps" :key="step.name" class="flex items-center gap-3">
                <div 
                  class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                  :class="step.completed ? 'bg-green-500 text-white' : step.current ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'"
                >
                  <span v-if="step.completed">✓</span>
                  <span v-else>{{ step.index }}</span>
                </div>
                <span :class="step.current ? 'text-blue-600 font-medium' : step.completed ? 'text-gray-900' : 'text-gray-400'">
                  {{ step.name }}
                </span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="canApprove" class="bg-white rounded-lg shadow-sm">
            <div class="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
              <h2 class="font-medium text-gray-900">Actions</h2>
            </div>
            <div class="p-4 space-y-3">
              <textarea 
                v-model="approvalComments" 
                rows="2" 
                class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Comments (optional)"
              ></textarea>
              
              <!-- Standard Approve/Reject -->
              <div class="flex gap-2">
                <button 
                  @click="approveRequest('Approved')" 
                  :disabled="actionLoading"
                  class="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button 
                  @click="showRejectModal = true" 
                  :disabled="actionLoading"
                  class="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
              
              <!-- Enhanced Options -->
              <div class="border-t pt-3 mt-3">
                <p class="text-xs text-gray-500 mb-2">Additional Options:</p>
                <div class="flex gap-2">
                  <button 
                    @click="showRestrictionsModal = true" 
                    :disabled="actionLoading"
                    class="flex-1 px-3 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                  >
                    Approve with Restrictions
                  </button>
                  <button 
                    @click="showInfoModal = true" 
                    :disabled="actionLoading"
                    class="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    Need More Info
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12 bg-white rounded-lg shadow-sm">
        <svg class="w-12 h-12 mx-auto text-red-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <p class="text-red-600">Request not found</p>
        <button @click="goBack" class="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm">
          Go Back
        </button>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="showRejectModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
        <div class="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
          <h3 class="font-medium text-gray-900">Reject Request</h3>
        </div>
        <div class="p-4">
          <textarea 
            v-model="rejectionReason" 
            rows="3" 
            class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
            placeholder="Rejection reason (required)"
          ></textarea>
          <div class="flex gap-2 mt-3">
            <button 
              @click="rejectRequest" 
              :disabled="!rejectionReason.trim()"
              class="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
            <button 
              @click="showRejectModal = false"
              class="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Approve with Restrictions Modal -->
    <div v-if="showRestrictionsModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div class="px-4 py-3 border-b bg-yellow-50 rounded-t-lg">
          <h3 class="font-medium text-yellow-800">Approve with Restrictions</h3>
        </div>
        <div class="p-4">
          <p class="text-sm text-gray-600 mb-3">Specify the restrictions that must be followed for this engagement:</p>
          <textarea 
            v-model="restrictions" 
            rows="4" 
            class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-500"
            placeholder="Enter restrictions (required). E.g.:&#10;- No advisory services to be provided&#10;- Review required before any additional services&#10;- Partner must approve any scope changes"
          ></textarea>
          <div class="flex gap-2 mt-3">
            <button 
              @click="approveWithRestrictions" 
              :disabled="!restrictions.trim()"
              class="flex-1 px-3 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
            >
              Approve with Restrictions
            </button>
            <button 
              @click="showRestrictionsModal = false"
              class="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Upload Attachment Modal -->
    <div v-if="showUploadModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div class="px-4 py-3 border-b bg-blue-50 rounded-t-lg">
          <h3 class="font-medium text-blue-800">Upload Attachment</h3>
        </div>
        <div class="p-4">
          <FileUpload
            v-if="request?.id"
            :request-id="request.id"
            :show-attachment-type="true"
            @uploaded="handleAttachmentUploaded"
            @error="handleAttachmentError"
          />
        </div>
        <div class="px-4 py-3 border-t flex justify-end">
          <button 
            @click="showUploadModal = false"
            class="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
    
    <!-- Need More Info Modal -->
    <div v-if="showInfoModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div class="px-4 py-3 border-b bg-blue-50 rounded-t-lg">
          <h3 class="font-medium text-blue-800">Request More Information</h3>
        </div>
        <div class="p-4">
          <p class="text-sm text-gray-600 mb-3">Specify what information is needed from the requester:</p>
          <textarea 
            v-model="infoRequired" 
            rows="4" 
            class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter required information (required). E.g.:&#10;- Please provide ownership structure details&#10;- Clarify the relationship with parent company&#10;- Attach supporting documents for PIE status"
          ></textarea>
          <div class="flex gap-2 mt-3">
            <button 
              @click="requestMoreInfo" 
              :disabled="!infoRequired.trim()"
              class="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Request Information
            </button>
            <button 
              @click="showInfoModal = false"
              class="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import FileUpload from '@/components/FileUpload.vue'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const request = ref<any>(null)
const loading = ref(true)
const validationLoading = ref(true)
const actionLoading = ref(false)
const showRejectModal = ref(false)
const showRestrictionsModal = ref(false)
const showInfoModal = ref(false)
const approvalComments = ref('')
const rejectionReason = ref('')
const restrictions = ref('')
const infoRequired = ref('')
const previousEngagements = ref<any[]>([])
const duplicationMatches = ref<any[]>([])
const ruleRecommendations = ref<any[]>([])
const allRecommendations = ref<any[]>([]) // Pro: All recommendations (Red Lines, IESBA, Business Rules, Conflicts)
const isPro = ref(false) // Pro edition flag
const showDecisionLog = ref(false)
const decisionLog = ref<any[]>([]) // Pro: Decision history
const attachments = ref<any[]>([])
const showUploadModal = ref(false)

const validationChecks = ref({
  clientExists: false,
  clientActive: false,
  hasPreviousCOI: false,
  previousCOICount: 0,
  hasServiceConflict: false
})

const workflowSteps = computed(() => {
  const status = request.value?.status || ''
  return [
    { name: 'Draft', index: 1, completed: status !== 'Draft', current: status === 'Draft' },
    { name: 'Director', index: 2, completed: ['Pending Compliance', 'Pending Partner', 'Pending Finance', 'Approved', 'Active'].includes(status), current: status === 'Pending Director Approval' },
    { name: 'Compliance', index: 3, completed: ['Pending Partner', 'Pending Finance', 'Approved', 'Active'].includes(status), current: status === 'Pending Compliance' },
    { name: 'Partner', index: 4, completed: ['Pending Finance', 'Approved', 'Active'].includes(status), current: status === 'Pending Partner' },
    { name: 'Finance', index: 5, completed: ['Approved', 'Active'].includes(status), current: status === 'Pending Finance' },
    { name: 'Active', index: 6, completed: status === 'Active', current: status === 'Approved' }
  ]
})

const canApprove = computed(() => {
  const role = authStore.user?.role
  const status = request.value?.status
  if (role === 'Director' && status === 'Pending Director Approval') return true
  if (role === 'Compliance' && status === 'Pending Compliance') return true
  if (role === 'Partner' && status === 'Pending Partner') return true
  if (role === 'Finance' && status === 'Pending Finance') return true
  if (role === 'Super Admin') return true
  return false
})

onMounted(async () => {
  await loadRequest()
})

async function loadRequest() {
  try {
    const response = await api.get(`/coi/requests/${route.params.id}`)
    request.value = response.data
    
    if (request.value.duplication_matches) {
      try {
        const matchesData = typeof request.value.duplication_matches === 'string' 
          ? JSON.parse(request.value.duplication_matches) 
          : request.value.duplication_matches
        
        // Handle new format with ruleRecommendations
        if (matchesData.duplicates) {
          duplicationMatches.value = matchesData.duplicates || []
          ruleRecommendations.value = matchesData.ruleRecommendations || []
        } else if (Array.isArray(matchesData)) {
          // Old format - just duplicates
          duplicationMatches.value = matchesData
          ruleRecommendations.value = []
        } else {
          duplicationMatches.value = []
          ruleRecommendations.value = []
        }
      } catch { 
        duplicationMatches.value = []
        ruleRecommendations.value = []
      }
    }
    
    await fetchAttachments()
    await runValidations()
  } catch (error) {
    console.error('Failed to load request:', error)
  } finally {
    loading.value = false
  }
}

async function fetchAttachments() {
  if (!request.value?.id) return
  try {
    const response = await api.get(`/coi/requests/${request.value.id}/attachments`)
    attachments.value = response.data.attachments || []
  } catch (error) {
    console.error('Failed to fetch attachments:', error)
  }
}

const canUploadAttachment = computed(() => {
  if (!request.value) return false
  const role = authStore.user?.role
  const userId = authStore.user?.id
  
  // Requester, director, admin, compliance can upload
  return request.value.requester_id === userId ||
    (role === 'Director' && request.value.requester_id === authStore.user?.director_id) ||
    ['Admin', 'Super Admin', 'Compliance'].includes(role || '')
})

function canDeleteAttachment(attachment: any): boolean {
  if (!request.value) return false
  const role = authStore.user?.role
  const userId = authStore.user?.id
  
  return attachment.uploaded_by === userId ||
    request.value.requester_id === userId ||
    ['Admin', 'Super Admin'].includes(role || '')
}

async function deleteAttachment(attachmentId: number) {
  if (!confirm('Are you sure you want to delete this attachment?')) return
  
  try {
    await api.delete(`/coi/requests/${request.value.id}/attachments/${attachmentId}`)
    attachments.value = attachments.value.filter(a => a.id !== attachmentId)
  } catch (error: any) {
    alert(error.response?.data?.error || 'Failed to delete attachment')
  }
}

function getAttachmentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'director_approval': 'Director Approval',
    'justification': 'Justification',
    'isqm_form': 'ISQM Form',
    'global_clearance_excel': 'Global Clearance'
  }
  return labels[type] || type
}

function getAttachmentTypeClass(type: string): string {
  const classes: Record<string, string> = {
    'director_approval': 'bg-blue-100 text-blue-700',
    'justification': 'bg-purple-100 text-purple-700',
    'isqm_form': 'bg-green-100 text-green-700',
    'global_clearance_excel': 'bg-yellow-100 text-yellow-700'
  }
  return classes[type] || 'bg-gray-100 text-gray-700'
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function handleAttachmentUploaded(attachment: any) {
  attachments.value.push(attachment)
  showUploadModal.value = false
  // Refresh attachments list
  fetchAttachments()
}

function handleAttachmentError(error: string) {
  alert(error)
}

async function downloadAttachment(attachmentId: number) {
  try {
    const response = await api.get(
      `/coi/requests/${request.value.id}/attachments/${attachmentId}/download`,
      { responseType: 'blob' }
    )
    const attachment = attachments.value.find(a => a.id === attachmentId)
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', attachment?.file_name || 'attachment')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error: any) {
    alert(error.response?.data?.error || 'Failed to download attachment')
  }
}

async function runValidations() {
  validationLoading.value = true
  try {
    if (request.value.client_id) {
      try {
        const clientResponse = await api.get('/integration/clients')
        const client = clientResponse.data.find((c: any) => c.id === request.value.client_id)
        validationChecks.value.clientExists = !!client
        validationChecks.value.clientActive = client?.status === 'Active'
      } catch {
        validationChecks.value.clientExists = false
        validationChecks.value.clientActive = false
      }
    }
    
    try {
      const requestsResponse = await api.get('/coi/requests')
      const prevEngagements = requestsResponse.data.filter((r: any) => 
        r.client_id === request.value.client_id && r.id !== request.value.id
      )
      previousEngagements.value = prevEngagements
      validationChecks.value.hasPreviousCOI = prevEngagements.length > 0
      validationChecks.value.previousCOICount = prevEngagements.length
      
      const auditServices = ['Statutory Audit', 'External Audit', 'IFRS Audit']
      const advisoryServices = ['Management Consulting', 'Business Advisory', 'Strategy Consulting']
      const currentIsAudit = auditServices.some(s => request.value.service_type?.includes(s))
      const hasAdvisory = prevEngagements.some((r: any) => 
        advisoryServices.some(s => r.service_type?.includes(s)) && ['Active', 'Approved'].includes(r.status)
      )
      const currentIsAdvisory = advisoryServices.some(s => request.value.service_type?.includes(s))
      const hasAudit = prevEngagements.some((r: any) => 
        auditServices.some(s => r.service_type?.includes(s)) && ['Active', 'Approved'].includes(r.status)
      )
      validationChecks.value.hasServiceConflict = (currentIsAudit && hasAdvisory) || (currentIsAdvisory && hasAudit)
    } catch {
      previousEngagements.value = []
    }
  } finally {
    validationLoading.value = false
  }
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    'Draft': 'bg-gray-100 text-gray-700',
    'Pending Director Approval': 'bg-yellow-100 text-yellow-700',
    'Pending Compliance': 'bg-blue-100 text-blue-700',
    'Pending Partner': 'bg-purple-100 text-purple-700',
    'Pending Finance': 'bg-indigo-100 text-indigo-700',
    'Approved': 'bg-green-100 text-green-700',
    'Active': 'bg-green-100 text-green-700',
    'Rejected': 'bg-red-100 text-red-700'
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getRecommendationBadgeClass(action: string) {
  const classes: Record<string, string> = {
    'block': 'bg-red-100 text-red-700',
    'flag': 'bg-yellow-100 text-yellow-700',
    'require_approval': 'bg-orange-100 text-orange-700',
    'set_status': 'bg-blue-100 text-blue-700',
    'send_notification': 'bg-purple-100 text-purple-700'
  }
  return classes[action] || 'bg-gray-100 text-gray-700'
}

function getRecommendationLabel(action: string) {
  const labels: Record<string, string> = {
    'block': 'Recommend Block',
    'flag': 'Recommend Flag',
    'require_approval': 'Require Approval',
    'set_status': 'Set Status',
    'send_notification': 'Send Notification'
  }
  return labels[action] || action
}

function goBack() { router.back() }

function editDraft() {
  localStorage.setItem('coi-edit-request', JSON.stringify(request.value))
  router.push('/coi/request/new')
}

async function approveRequest(approvalType: string = 'Approved') {
  actionLoading.value = true
  try {
    await api.post(`/coi/requests/${request.value.id}/approve`, { 
      approval_type: approvalType,
      comments: approvalComments.value 
    })
    await loadRequest()
    approvalComments.value = ''
  } catch (error) {
    console.error('Failed to approve:', error)
  } finally {
    actionLoading.value = false
  }
}

async function approveWithRestrictions() {
  actionLoading.value = true
  try {
    await api.post(`/coi/requests/${request.value.id}/approve`, { 
      approval_type: 'Approved with Restrictions',
      restrictions: restrictions.value,
      comments: approvalComments.value 
    })
    showRestrictionsModal.value = false
    restrictions.value = ''
    await loadRequest()
  } catch (error) {
    console.error('Failed to approve with restrictions:', error)
  } finally {
    actionLoading.value = false
  }
}

async function requestMoreInfo() {
  actionLoading.value = true
  try {
    await api.post(`/coi/requests/${request.value.id}/need-more-info`, { 
      info_required: infoRequired.value,
      comments: approvalComments.value 
    })
    showInfoModal.value = false
    infoRequired.value = ''
    await loadRequest()
  } catch (error) {
    console.error('Failed to request more info:', error)
  } finally {
    actionLoading.value = false
  }
}

async function rejectRequest() {
  actionLoading.value = true
  try {
    await api.post(`/coi/requests/${request.value.id}/reject`, { reason: rejectionReason.value })
    showRejectModal.value = false
    await loadRequest()
    rejectionReason.value = ''
  } catch (error) {
    console.error('Failed to reject:', error)
  } finally {
    actionLoading.value = false
  }
}
</script>
