<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Top Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button 
              @click="goBack" 
              class="p-2 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Go back"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div v-if="request" data-section="status">
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
          <div class="flex items-center gap-2">
            <!-- Convert to Engagement button -->
            <button 
              v-if="canConvertToEngagement"
              @click="handleConvertToEngagement"
              class="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
              Convert to Engagement
            </button>
            <button 
              v-if="request?.status === 'Draft'"
              @click="editDraft"
              class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit Draft
            </button>
            <button 
              v-if="request?.status === 'Draft' && canDeleteDraft"
              @click="deleteDraft"
              :disabled="deleting"
              class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {{ deleting ? 'Deleting...' : 'Delete Draft' }}
            </button>
            <!-- Resubmit button for fixable rejections -->
            <button 
              v-if="canResubmit"
              @click="resubmitRequest"
              :disabled="resubmitting"
              class="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {{ resubmitting ? 'Converting...' : 'Modify and Resubmit' }}
            </button>
            <!-- Create new request for permanent rejections -->
            <router-link 
              v-if="request?.status === 'Rejected' && request?.rejection_type === 'permanent'"
              to="/coi/request/new"
              class="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
            >
              Create New Request
            </router-link>
          </div>
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
        <!-- Rejection Alert Banner (full width) -->
        <div v-if="request.status === 'Rejected'" class="col-span-3">
          <div :class="request.rejection_type === 'permanent' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'" class="border rounded-lg p-4">
            <div class="flex items-start gap-3">
              <div :class="request.rejection_type === 'permanent' ? 'text-red-600' : 'text-amber-600'" class="flex-shrink-0 mt-0.5">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h3 :class="request.rejection_type === 'permanent' ? 'text-red-800' : 'text-amber-800'" class="font-semibold">
                    Request Rejected
                  </h3>
                  <span :class="request.rejection_type === 'permanent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'" class="px-2 py-0.5 text-xs font-medium rounded">
                    {{ request.rejection_type === 'permanent' ? 'Permanent' : 'Fixable' }}
                  </span>
                </div>
                <p :class="request.rejection_type === 'permanent' ? 'text-red-700' : 'text-amber-700'" class="text-sm">
                  <strong>Reason:</strong> {{ request.rejection_reason || 'No reason provided' }}
                </p>
                <p :class="request.rejection_type === 'permanent' ? 'text-red-600' : 'text-amber-600'" class="text-sm mt-2">
                  <template v-if="request.rejection_type === 'permanent'">
                    This rejection is final and cannot be resubmitted. Please create a new request if circumstances have changed.
                  </template>
                  <template v-else>
                    You can modify and resubmit this request after addressing the feedback above.
                  </template>
                </p>
                <p class="text-xs text-gray-500 mt-2">
                  Rejected on {{ formatDate(request.updated_at) }}
                </p>
              </div>
            </div>
          </div>
        </div>
        
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
                    <td class="py-2 text-gray-500">Line of service</td>
                    <td class="py-2 text-gray-900">{{ request.line_of_service || 'N/A' }}</td>
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
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">Designation</td>
                    <td class="py-2 text-gray-900">{{ request.designation || 'N/A' }}</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">Language</td>
                    <td class="py-2 text-gray-900">{{ request.language || 'N/A' }}</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">Lead source</td>
                    <td class="py-2 text-gray-900">{{ request.lead_source_name || (request.lead_source_id ? 'N/A' : 'None') }}</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">Backup approver</td>
                    <td class="py-2 text-gray-900">{{ request.backup_approver_name || 'None' }}</td>
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
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">PIE Status</td>
                    <td class="py-2" :class="request.pie_status === 'Yes' ? 'text-red-600 font-medium' : 'text-gray-900'">
                      {{ request.pie_status || 'No' }}
                    </td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">Client status</td>
                    <td class="py-2 text-gray-900">{{ request.client_status || 'N/A' }}</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">Regulated body</td>
                    <td class="py-2 text-gray-900">{{ request.regulated_body || 'N/A' }}</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">Group structure</td>
                    <td class="py-2 text-gray-900">{{ request.group_structure || 'N/A' }}</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">Parent company</td>
                    <td class="py-2 text-gray-900">{{ request.parent_company || 'N/A' }}</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">Company type</td>
                    <td class="py-2 text-gray-900">{{ request.company_type || 'N/A' }}</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">Ownership %</td>
                    <td class="py-2 text-gray-900">{{ request.ownership_percentage != null ? request.ownership_percentage : 'N/A' }}</td>
                  </tr>
                  <tr>
                    <td class="py-2 text-gray-500">Control type</td>
                    <td class="py-2 text-gray-900">{{ request.control_type || 'N/A' }}</td>
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
            <div class="p-4 space-y-4">
              <table class="w-full text-sm">
                <tbody>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500 w-1/3">Service category</td>
                    <td class="py-2 text-gray-900">{{ request.service_category || 'N/A' }}</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">Service sub-category</td>
                    <td class="py-2 text-gray-900">{{ request.service_sub_category || 'N/A' }}</td>
                  </tr>
                  <template v-if="request.international_operations">
                    <tr class="border-b">
                      <td class="py-2 text-gray-500">Global service category</td>
                      <td class="py-2 text-gray-900">{{ request.global_service_category || 'N/A' }}</td>
                    </tr>
                    <tr class="border-b">
                      <td class="py-2 text-gray-500">Global service type</td>
                      <td class="py-2 text-gray-900">{{ request.global_service_type || 'N/A' }}</td>
                    </tr>
                  </template>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">Requested service period</td>
                    <td class="py-2 text-gray-900">
                      <span v-if="request.requested_service_period_start || request.requested_service_period_end">
                        {{ request.requested_service_period_start || '—' }} to {{ request.requested_service_period_end || '—' }}
                      </span>
                      <span v-else>N/A</span>
                    </td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">External deadline</td>
                    <td class="py-2 text-gray-900">{{ request.external_deadline ? formatDate(request.external_deadline) : 'N/A' }}</td>
                  </tr>
                  <tr class="border-b">
                    <td class="py-2 text-gray-500">Deadline reason</td>
                    <td class="py-2 text-gray-900">{{ request.deadline_reason || 'N/A' }}</td>
                  </tr>
                </tbody>
              </table>
              <p class="text-sm text-gray-700">{{ request.service_description || 'No description provided.' }}</p>
            </div>
          </div>

          <!-- Ownership & related entities -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
              <h2 class="font-medium text-gray-900">Ownership & related entities</h2>
            </div>
            <div class="p-4 space-y-4">
              <div>
                <span class="text-sm text-gray-500">International operations</span>
                <p class="text-sm text-gray-900 mt-0.5">{{ request.international_operations ? 'Yes' : 'No' }}</p>
              </div>
              <div v-if="request.full_ownership_structure">
                <span class="text-sm text-gray-500">Full ownership structure</span>
                <pre class="mt-1 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900 whitespace-pre-wrap">{{ request.full_ownership_structure }}</pre>
              </div>
              <div v-if="request.related_affiliated_entities">
                <span class="text-sm text-gray-500">Related affiliated entities</span>
                <p class="mt-1 text-sm text-gray-900">{{ request.related_affiliated_entities }}</p>
              </div>
              <!-- Global COI Form summary (when international and data present) -->
              <div v-if="request.international_operations && request.global_coi_form_data" class="border-t border-gray-200 pt-4">
                <button
                  type="button"
                  @click="showGlobalCOISummary = !showGlobalCOISummary"
                  class="flex items-center justify-between w-full text-left text-sm font-medium text-gray-900 hover:text-gray-700"
                >
                  <span>Global COI Form ({{ globalCOISummary.count }} countries, {{ globalCOISummary.entityCount }} entities)</span>
                  <svg :class="['w-4 h-4 text-gray-500 transition-transform', showGlobalCOISummary ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                <div v-show="showGlobalCOISummary" class="mt-3 space-y-2">
                  <div
                    v-for="(country, idx) in globalCOISummary.countries"
                    :key="idx"
                    class="p-3 bg-gray-50 border border-gray-200 rounded text-sm"
                  >
                    <span class="font-medium text-gray-900">{{ country.country_code || 'Unknown' }}</span>
                    <ul v-if="country.entities && country.entities.length" class="mt-2 ml-4 list-disc text-gray-700">
                      <li v-for="(ent, ei) in country.entities" :key="ei">
                        {{ ent.relationship_type ? `${ent.relationship_type}: ` : '' }}{{ ent.name || 'Unnamed' }}
                      </li>
                    </ul>
                    <p v-else class="mt-1 text-gray-500 text-xs">No entities</p>
                  </div>
                </div>
              </div>
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
              <div class="px-4 py-3">
                <button 
                  type="button"
                  class="w-full flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1 transition-colors text-left" 
                  @click="showPreviousCOI = !showPreviousCOI" 
                  v-if="validationChecks.hasPreviousCOI"
                >
                  <span class="text-gray-600">Previous COI</span>
                  <div class="flex items-center gap-2">
                    <span class="text-yellow-600 font-medium">
                      {{ validationChecks.previousCOICount }} found
                    </span>
                    <svg 
                      :class="showPreviousCOI ? 'rotate-180' : ''"
                      class="w-4 h-4 text-gray-400 transition-transform"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </button>
                <div class="flex items-center justify-between" v-else>
                  <span class="text-gray-600">Previous COI</span>
                  <span class="text-green-600 font-medium">None</span>
                </div>
                <!-- Expandable Previous COI List -->
                <div v-if="showPreviousCOI && validationChecks.hasPreviousCOI && previousEngagements.length > 0" class="mt-3 pt-3 border-t border-gray-200">
                  <div class="space-y-2 max-h-64 overflow-y-auto">
                    <button
                      type="button"
                      v-for="eng in previousEngagements" 
                      :key="eng.id"
                      class="w-full flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300 hover:shadow-sm transition-all cursor-pointer group text-left focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1"
                      @click.stop="navigateToEngagement(eng)"
                      :title="`Click to open ${eng.request_id} in a new tab`"
                    >
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{{ eng.request_id }}</span>
                          <span :class="eng.status === 'Active' ? 'text-green-600' : 'text-gray-500'" class="text-xs">
                            {{ eng.status }}
                          </span>
                        </div>
                        <div class="text-xs text-gray-600 mt-0.5">
                          {{ eng.service_type || 'N/A' }} · {{ formatDate(eng.created_at) }}
                        </div>
                      </div>
                      <svg class="w-4 h-4 text-gray-400 ml-2 flex-shrink-0 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div class="px-4 py-3">
                <button
                  type="button"
                  class="w-full flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1 transition-colors text-left" 
                  @click="showServiceConflict = !showServiceConflict" 
                  v-if="validationChecks.hasServiceConflict"
                >
                  <span class="text-gray-600">Service Conflict</span>
                  <div class="flex items-center gap-2">
                    <span class="text-red-600 font-medium">Yes</span>
                    <svg 
                      :class="showServiceConflict ? 'rotate-180' : ''"
                      class="w-4 h-4 text-gray-400 transition-transform"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </button>
                <div class="flex items-center justify-between" v-else>
                  <span class="text-gray-600">Service Conflict</span>
                  <span class="text-green-600 font-medium">None</span>
                </div>
                <!-- Expandable Service Conflict Details -->
                <div v-if="showServiceConflict && validationChecks.hasServiceConflict" class="mt-3 pt-3 border-t border-gray-200">
                  <div class="space-y-2">
                    <div class="text-xs text-red-700 mb-2 font-medium">Conflicting engagements:</div>
                    <button
                      type="button"
                      v-for="eng in conflictingEngagements" 
                      :key="eng.id"
                      class="w-full flex items-center justify-between p-2 bg-red-50 rounded border border-red-200 hover:bg-red-100 hover:border-red-300 hover:shadow-sm transition-all cursor-pointer group text-left focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
                      @click.stop="navigateToEngagement(eng)"
                      :title="`Click to open ${eng.request_id} in a new tab`"
                    >
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-medium text-gray-900 group-hover:text-blue-600">{{ eng.request_id }}</span>
                          <span class="text-xs text-red-600 font-medium">{{ eng.service_type }}</span>
                          <span :class="eng.status === 'Active' ? 'text-green-600' : 'text-gray-500'" class="text-xs">
                            {{ eng.status }}
                          </span>
                        </div>
                        <div class="text-xs text-gray-600 mt-0.5">
                          {{ formatDate(eng.created_at) }}
                        </div>
                      </div>
                      <svg class="w-4 h-4 text-gray-400 ml-2 flex-shrink-0 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                    <div v-if="conflictingEngagements.length === 0" class="text-xs text-gray-500 italic">
                      Conflict detected but details not available
                    </div>
                  </div>
                </div>
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
                <!-- Display conflict with regulation sources -->
                <div v-if="match.conflicts && match.conflicts.length > 0" class="mt-2">
                  <div v-for="(conflict, cIdx) in match.conflicts" :key="cIdx" class="mb-2">
                    <!-- Multiple regulations detected -->
                    <div v-if="conflict.allConflicts && conflict.allConflicts.length > 1" class="space-y-1">
                      <div class="text-xs font-medium text-yellow-800 mb-1">
                        Conflicts detected from multiple regulations:
                      </div>
                      <div v-for="(conf, idx) in conflict.allConflicts" :key="idx" class="text-xs text-yellow-700 pl-2 border-l-2 border-yellow-300">
                        <span class="font-medium">{{ conf.regulationSources?.join(', ') || conf.regulationSource || 'IESBA' }}:</span>
                        <span class="ml-1">{{ conf.reason }}</span>
                      </div>
                    </div>
                    <!-- Single regulation -->
                    <div v-else class="text-xs text-yellow-600">
                      <span v-if="conflict.regulationSource || conflict.regulationSources" class="font-medium">
                        {{ conflict.regulationSources?.join(', ') || conflict.regulationSource }}:
                      </span>
                      {{ conflict.reason }}
                    </div>
                  </div>
                </div>
                <!-- Fallback to match reason if no conflicts array -->
                <p v-else class="text-xs text-yellow-600">{{ match.reason }}</p>
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

          <!-- Director Approval Status -->
          <div v-if="shouldShowDirectorApprovalStatus" class="bg-white rounded-lg shadow-sm">
            <div class="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
              <h2 class="font-medium text-gray-900">Director Approval Status</h2>
            </div>
            <div class="p-4">
              <div class="space-y-3">
                <!-- Status Badge -->
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600">Status:</span>
                  <span 
                    :class="getDirectorApprovalStatusClass(effectiveDirectorApprovalStatus)"
                    class="px-2.5 py-1 text-xs font-medium rounded"
                  >
                    {{ getDirectorApprovalStatusLabel(effectiveDirectorApprovalStatus) }}
                  </span>
                </div>

                <!-- In-System Approval Details -->
                <div v-if="(effectiveDirectorApprovalStatus === 'Approved' || effectiveDirectorApprovalStatus === 'Approved with Restrictions') && (request.director_approval_by || hasDirectorApprovalDocument)" class="text-sm">
                  <div v-if="request.director_approval_by" class="text-gray-600 mb-1">Approved by:</div>
                  <div v-if="request.director_approval_by" class="text-gray-900 font-medium">{{ request.director_approval_by_name || 'Director' }}</div>
                  <div v-if="request.director_approval_date" class="text-xs text-gray-500 mt-1">
                    {{ formatDate(request.director_approval_date) }}
                  </div>
                  <div v-if="request.director_approval_notes" class="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                    {{ request.director_approval_notes }}
                  </div>
                  <div v-if="request.director_restrictions" class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    <strong>Restrictions:</strong> {{ request.director_restrictions }}
                  </div>
                </div>

                <!-- Document Upload Details -->
                <div v-if="hasDirectorApprovalDocument" class="text-sm">
                  <div class="text-gray-600 mb-2">Director approval document uploaded:</div>
                  <div v-for="doc in directorApprovalDocuments" :key="doc.id" class="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <span class="text-sm text-gray-900 flex-1">{{ doc.file_name }}</span>
                    <span class="text-xs text-gray-500">{{ formatDate(doc.created_at) }}</span>
                    <span class="text-xs text-gray-500">by {{ doc.uploaded_by_name || 'User' }}</span>
                  </div>
                </div>

                <!-- Pending Status - Only show if actually pending director approval -->
                <div v-if="request.status === 'Pending Director Approval' && effectiveDirectorApprovalStatus === 'Pending' && !hasDirectorApprovalDocument" class="text-sm text-gray-600">
                  Waiting for director approval. Director can approve in-system or you can upload an approval document.
                </div>
                
                <!-- Approver Unavailable Status - Requirement 5: HRMS Vacation Integration -->
                <div v-if="request.current_approver_status && !request.current_approver_status.is_available && authStore.user?.role === 'Requester'" 
                     class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-amber-800">
                        Approval Delayed - Approver Unavailable
                      </p>
                      <p class="text-sm text-amber-700 mt-1">
                        Your request is pending approval from <strong>{{ request.current_approver_status.approver_name }}</strong> 
                        ({{ request.current_approver_status.role }}), who is currently unavailable.
                      </p>
                      <p v-if="request.current_approver_status.unavailable_reason" class="text-xs text-amber-600 mt-1">
                        Reason: {{ request.current_approver_status.unavailable_reason }}
                      </p>
                      <p v-if="request.current_approver_status.unavailable_until" class="text-xs text-amber-600 mt-1">
                        Expected return: {{ formatDate(request.current_approver_status.unavailable_until) }}
                      </p>
                      <p class="text-xs text-amber-600 mt-2 italic">
                        Your request will be reviewed upon the approver's return. If this is urgent, please contact your department administrator.
                      </p>
                    </div>
                  </div>
                </div>
                
                <!-- Implied Approval Message - Show when status is beyond Director but no explicit approval recorded -->
                <div v-if="['Pending Compliance', 'Pending Partner', 'Pending Finance', 'Approved', 'Active'].includes(request.status) && !request.director_approval_by && !hasDirectorApprovalDocument && effectiveDirectorApprovalStatus === 'Approved'" class="text-sm text-gray-600 italic">
                  Director approval inferred from workflow progression.
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

          <!-- Engagement Code & Financial Parameters -->
          <div v-if="request.engagement_code || (authStore.user?.role === 'Finance' && request.status === 'Pending Finance')" class="bg-white rounded-lg shadow-sm">
            <div class="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
              <h2 class="font-medium text-gray-900">Engagement Code & Financial Details</h2>
            </div>
            <div class="p-4 space-y-4">
              <!-- Engagement Code -->
              <div v-if="request.engagement_code">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-sm text-gray-600">Engagement Code:</span>
                  <code class="text-sm font-mono font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded">{{ request.engagement_code }}</code>
                </div>
              </div>
              <div v-else-if="authStore.user?.role === 'Finance' && request.status === 'Pending Finance'" class="text-sm text-gray-500 italic">
                Engagement code will be generated after financial parameters are entered.
              </div>

              <!-- Financial Parameters -->
              <div v-if="financialParameters" class="border-t pt-4">
                <h3 class="text-sm font-medium text-gray-700 mb-3">Financial Parameters</h3>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div v-if="financialParameters.credit_terms">
                    <span class="text-gray-500">Credit Terms:</span>
                    <span class="ml-2 font-medium text-gray-900">{{ financialParameters.credit_terms }}</span>
                  </div>
                  <div v-if="financialParameters.currency">
                    <span class="text-gray-500">Currency:</span>
                    <span class="ml-2 font-medium text-gray-900">{{ financialParameters.currency }}</span>
                  </div>
                  <div v-if="financialParameters.risk_assessment">
                    <span class="text-gray-500">Risk Assessment:</span>
                    <span 
                      :class="{
                        'text-green-700': financialParameters.risk_assessment === 'Low',
                        'text-yellow-700': financialParameters.risk_assessment === 'Medium',
                        'text-orange-700': financialParameters.risk_assessment === 'High',
                        'text-red-700': financialParameters.risk_assessment === 'Very High'
                      }"
                      class="ml-2 font-medium"
                    >
                      {{ financialParameters.risk_assessment }}
                    </span>
                  </div>
                  <div v-if="financialParameters.pending_amount !== null && financialParameters.pending_amount !== undefined">
                    <span class="text-gray-500">Pending Amount:</span>
                    <span class="ml-2 font-medium text-gray-900">
                      {{ formatCurrency(financialParameters.pending_amount, financialParameters.currency) }}
                    </span>
                  </div>
                </div>
                <div v-if="financialParameters.notes" class="mt-3 pt-3 border-t">
                  <span class="text-gray-500 text-sm">Notes:</span>
                  <p class="text-sm text-gray-900 mt-1">{{ financialParameters.notes }}</p>
                </div>
              </div>
              <div v-else-if="request.engagement_code" class="text-sm text-gray-500 italic">
                Financial parameters not available.
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
              
              <!-- Enhanced Options (Compliance/Partner Only, NOT Directors) -->
              <div v-if="(userRole === 'Compliance' && request.status === 'Pending Compliance') || (userRole === 'Partner' && request.status === 'Pending Partner')" class="border-t pt-3 mt-3">
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
              
              <!-- Director Tooltip (Directors see only Approve/Reject) -->
              <div v-if="userRole === 'Director' && request.status === 'Pending Director Approval'" class="border-t pt-3 mt-3">
                <p class="text-xs text-gray-500 italic">
                  Note: Additional approval options (Restrictions, More Info) are available at Compliance level.
                </p>
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
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-md mx-4">
        <div class="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
          <h3 class="font-medium text-gray-900">Reject Request</h3>
        </div>
        <div class="p-4 space-y-4">
          <!-- Rejection Type Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Rejection Type</label>
            <div class="space-y-2">
              <label class="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-amber-50 transition-colors" :class="rejectionType === 'fixable' ? 'border-amber-500 bg-amber-50' : 'border-gray-200'">
                <input 
                  type="radio" 
                  v-model="rejectionType" 
                  value="fixable" 
                  class="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span class="text-sm font-medium text-gray-900">Fixable (allows resubmission)</span>
                </div>
              </label>
              <label class="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-red-50 transition-colors" :class="rejectionType === 'permanent' ? 'border-red-500 bg-red-50' : 'border-gray-200'">
                <input 
                  type="radio" 
                  v-model="rejectionType" 
                  value="permanent" 
                  class="mt-0.5 text-red-600 focus:ring-red-500"
                />
                <div>
                  <span class="text-sm font-medium text-gray-900">Permanent (no resubmission)</span>
                </div>
              </label>
            </div>
          </div>
          
          <!-- Rejection Reason -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Rejection Reason</label>
            <textarea 
              v-model="rejectionReason" 
              rows="3" 
              class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="Provide detailed reason for rejection (required)"
            ></textarea>
          </div>
          
          <div class="flex gap-2 pt-2">
            <button 
              @click="rejectRequestWithType" 
              :disabled="!rejectionReason.trim()"
              class="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
            <button 
              @click="showRejectModal = false; rejectionType = 'fixable'"
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
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-md mx-4">
        <div class="px-4 py-3 border-b border-gray-200 rounded-t-lg bg-gray-50">
          <h3 class="font-medium text-gray-900">Approve with Restrictions</h3>
        </div>
        <div class="p-4">
          <p class="text-sm text-gray-600 mb-3">Restrictions for this engagement:</p>
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
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-md mx-4">
        <div class="px-4 py-3 border-b border-gray-200 rounded-t-lg bg-gray-50">
          <h3 class="font-medium text-gray-900">Upload Attachment</h3>
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
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-md mx-4">
        <div class="px-4 py-3 border-b border-gray-200 rounded-t-lg bg-gray-50">
          <h3 class="font-medium text-gray-900">Request More Information</h3>
        </div>
        <div class="p-4">
          <p class="text-sm text-gray-600 mb-3">Information needed from the requester:</p>
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

    <!-- Conversion Modals -->
    <ConvertToEngagementModal
      v-if="!request?.is_prospect"
      :show="showConvertModal"
      :request="request"
      @cancel="showConvertModal = false"
      @converted="handleConverted"
    />

    <ProspectConversionModal
      v-if="request?.is_prospect"
      :show="showConvertModal"
      :request="request"
      :prospect="prospectData"
      @cancel="showConvertModal = false"
      @converted="handleProspectConverted"
    />

    <!-- Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import FileUpload from '@/components/FileUpload.vue'
import ConvertToEngagementModal from '@/components/engagement/ConvertToEngagementModal.vue'
import ProspectConversionModal from '@/components/engagement/ProspectConversionModal.vue'
import api from '@/services/api'

const toast = useToast()

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
const rejectionType = ref<'fixable' | 'permanent'>('fixable')
const restrictions = ref('')
const infoRequired = ref('')
const previousEngagements = ref<any[]>([])
const duplicationMatches = ref<any[]>([])
const ruleRecommendations = ref<any[]>([])
const allRecommendations = ref<any[]>([]) // Pro: All recommendations (Red Lines, IESBA, Business Rules, Conflicts)
// CMA + IESBA only: always Pro
const isPro = ref(true)
const showDecisionLog = ref(false)
const decisionLog = ref<any[]>([]) // Pro: Decision history
const attachments = ref<any[]>([])
const showUploadModal = ref(false)
const showPreviousCOI = ref(false)
const showServiceConflict = ref(false)
const showGlobalCOISummary = ref(false)
const resubmitting = ref(false)
const showConvertModal = ref(false)
const prospectData = ref<any>(null)

const validationChecks = ref({
  clientExists: false,
  clientActive: false,
  hasPreviousCOI: false,
  previousCOICount: 0,
  hasServiceConflict: false
})

const globalCOISummary = computed(() => {
  const raw = request.value?.global_coi_form_data
  if (!raw) return { count: 0, entityCount: 0, countries: [] }
  let data: { countries?: Array<{ country_code?: string; entities?: Array<{ relationship_type?: string; name?: string }> }> }
  try {
    data = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return { count: 0, entityCount: 0, countries: [] }
  }
  const countries = Array.isArray(data?.countries) ? data.countries : []
  const entityCount = countries.reduce((sum, c) => sum + (Array.isArray(c?.entities) ? c.entities.length : 0), 0)
  return { count: countries.length, entityCount, countries }
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

const userRole = computed(() => authStore.user?.role ?? '')

// Check if request can be resubmitted (fixable rejections only, requester only)
const canResubmit = computed(() => {
  if (!request.value) return false
  // Only rejected requests can be resubmitted
  if (request.value.status !== 'Rejected') return false
  // Only the requester can resubmit (use loose equality to handle string/number type mismatch)
  if (String(request.value.requester_id) !== String(authStore.user?.id)) return false
  // Permanent rejections cannot be resubmitted
  if (request.value.rejection_type === 'permanent') return false
  // Allow resubmission for fixable rejections (or null/undefined for backward compatibility)
  return true
})

onMounted(async () => {
  await loadRequest()
})

// Handle context from query parameters after request loads
watch(() => request.value, async (newRequest) => {
  if (newRequest && route.query.from === 'expiring') {
    // Wait for DOM to update, then scroll to status section
    await nextTick()
    setTimeout(() => {
      const statusSection = document.querySelector('[data-section="status"]')
      if (statusSection) {
        // Scroll to top first, then to the section
        window.scrollTo({ top: 0, behavior: 'instant' })
        setTimeout(() => {
          statusSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
          // Highlight the section briefly
          statusSection.classList.add('ring-2', 'ring-orange-500', 'ring-opacity-50', 'rounded-md', 'p-2', 'transition-all')
          setTimeout(() => {
            statusSection.classList.remove('ring-2', 'ring-orange-500', 'ring-opacity-50', 'rounded-md', 'p-2', 'transition-all')
          }, 2000)
        }, 100)
      }
    }, 300)
  }
}, { immediate: true })

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
          // New format: duplicates is an object with matches array inside
          const dupData = matchesData.duplicates
          duplicationMatches.value = Array.isArray(dupData) 
            ? dupData 
            : (dupData.matches || [])
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
    toast.success('Attachment deleted')
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to delete attachment')
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

const hasDirectorApprovalDocument = computed(() => {
  return attachments.value.some(a => a.attachment_type === 'director_approval')
})

const directorApprovalDocuments = computed(() => {
  return attachments.value.filter(a => a.attachment_type === 'director_approval')
})

function getDirectorApprovalStatusLabel(status: string | null): string {
  if (!status) return 'Pending'
  const labels: Record<string, string> = {
    'Pending': 'Pending',
    'Approved': 'Approved',
    'Approved with Restrictions': 'Approved with Restrictions',
    'Need More Info': 'Need More Info',
    'Rejected': 'Rejected'
  }
  return labels[status] || status
}

function getDirectorApprovalStatusClass(status: string | null): string {
  if (!status) return 'bg-yellow-100 text-yellow-700'
  const classes: Record<string, string> = {
    'Pending': 'bg-yellow-100 text-yellow-700',
    'Approved': 'bg-green-100 text-green-700',
    'Approved with Restrictions': 'bg-orange-100 text-orange-700',
    'Need More Info': 'bg-blue-100 text-blue-700',
    'Rejected': 'bg-red-100 text-red-700'
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

function handleAttachmentUploaded(attachment: any) {
  attachments.value.push(attachment)
  showUploadModal.value = false
  // Refresh attachments list
  fetchAttachments()
}

function handleAttachmentError(error: string) {
  toast.error(error)
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
    toast.error(error.response?.data?.error || 'Failed to download attachment. Please try again.')
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

// Financial Parameters
const financialParameters = computed(() => {
  if (!request.value?.financial_parameters) return null
  try {
    const params = typeof request.value.financial_parameters === 'string'
      ? JSON.parse(request.value.financial_parameters)
      : request.value.financial_parameters
    return params
  } catch {
    return null
  }
})

function formatCurrency(amount: number, currency: string = 'KWD'): string {
  if (amount === null || amount === undefined) return 'N/A'
  const currencySymbols: Record<string, string> = {
    'KWD': 'KWD',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'SAR': 'SAR',
    'AED': 'AED'
  }
  const symbol = currencySymbols[currency] || currency
  return `${symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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

function navigateToEngagement(engagement: any) {
  if (!engagement || !engagement.id) {
    console.error('Invalid engagement data:', engagement)
    return
  }
  // Open in a new tab so user can compare both requests
  const route = router.resolve(`/coi/request/${engagement.id}`)
  window.open(route.href, '_blank')
}

const conflictingEngagements = computed(() => {
  if (!validationChecks.value.hasServiceConflict || !request.value) return []
  
  // Get conflicting engagements based on service type
  const auditServices = ['audit', 'assurance']
  const advisoryServices = ['advisory', 'consulting']
  
  const currentService = (request.value.service_type || '').toLowerCase()
  const currentIsAudit = auditServices.some(s => currentService.includes(s))
  const currentIsAdvisory = advisoryServices.some(s => currentService.includes(s))
  
  return previousEngagements.value.filter((eng: any) => {
    const engService = (eng.service_type || '').toLowerCase()
    const engIsAudit = auditServices.some(s => engService.includes(s))
    const engIsAdvisory = advisoryServices.some(s => engService.includes(s))
    
    // Check if this is a conflict: Audit + Advisory
    return ['Active', 'Approved'].includes(eng.status) && 
           ((currentIsAudit && engIsAdvisory) || (currentIsAdvisory && engIsAudit))
  })
})

// Compute effective director approval status based on request stage
const effectiveDirectorApprovalStatus = computed(() => {
  if (!request.value) return null
  
  const status = request.value.status
  const directorStatus = request.value.director_approval_status
  
  // If status is beyond Director stage, director must have approved (even if not explicitly set)
  const directorCompletedStatuses = ['Pending Compliance', 'Pending Partner', 'Pending Finance', 'Approved', 'Active']
  if (directorCompletedStatuses.includes(status)) {
    // If director_approval_status is explicitly set, use it; otherwise infer "Approved"
    return directorStatus || 'Approved'
  }
  
  // If status is "Pending Director Approval", use actual status or default to "Pending"
  if (status === 'Pending Director Approval') {
    return directorStatus || 'Pending'
  }
  
  // For other statuses (Draft, Rejected, etc.), return the actual status if set
  return directorStatus || null
})

// Determine if Director Approval Status section should be shown
const shouldShowDirectorApprovalStatus = computed(() => {
  if (!request.value) return false
  
  const status = request.value.status
  const directorStatus = request.value.director_approval_status
  const hasDocument = hasDirectorApprovalDocument.value
  
  // Always show if status is "Pending Director Approval"
  if (status === 'Pending Director Approval') return true
  
  // Show if director has explicitly approved (has status or document)
  if (directorStatus === 'Approved' || directorStatus === 'Approved with Restrictions' || hasDocument) return true
  
  // Show if status is beyond Director stage (to show approval details)
  const directorCompletedStatuses = ['Pending Compliance', 'Pending Partner', 'Pending Finance', 'Approved', 'Active']
  if (directorCompletedStatuses.includes(status)) return true
  
  return false
})

function editDraft() {
  localStorage.setItem('coi-edit-request', JSON.stringify(request.value))
  router.push('/coi/request/new')
}

const deleting = ref(false)
const canDeleteDraft = computed(() => {
  if (!request.value || request.value.status !== 'Draft') return false
  const userId = authStore.user?.id
  const role = authStore.user?.role
  return String(request.value.requester_id) === String(userId) || ['Admin', 'Super Admin'].includes(role || '')
})

const canConvertToEngagement = computed(() => {
  return request.value?.stage === 'Proposal' 
    && (request.value?.status === 'Approved' || request.value?.status === 'Active')
    && ['Requester', 'Director', 'Admin', 'Super Admin'].includes(authStore.user?.role || '')
})

async function deleteDraft() {
  if (!request.value || !canDeleteDraft.value) return
  
  if (!confirm(`Are you sure you want to delete draft "${request.value.request_id}"? This action cannot be undone.`)) {
    return
  }
  
  deleting.value = true
  try {
    await api.delete(`/coi/requests/${request.value.id}`)
    toast.success('Draft deleted successfully')
    // Navigate back to requester dashboard
    setTimeout(() => router.push('/coi/requester'), 1000)
  } catch (error: any) {
    console.error('Failed to delete draft:', error)
    toast.error(error.response?.data?.error || 'Failed to delete draft. Please try again.')
  } finally {
    deleting.value = false
  }
}

async function handleConvertToEngagement() {
  if (request.value?.is_prospect) {
    // Fetch prospect data
    try {
      const response = await api.get(`/prospects/${request.value.prospect_id}`)
      prospectData.value = response.data
    } catch (error) {
      console.error('Error fetching prospect:', error)
    }
  }
  showConvertModal.value = true
}

async function handleConverted(result: any) {
  showConvertModal.value = false
  
  // Show success message
  toast.success(`Proposal successfully converted to engagement. New Request: ${result.new_request.request_id}`)
  
  // Navigate to new engagement after a short delay
  setTimeout(() => {
    router.push(`/coi/request/${result.new_request.id}`)
  }, 1500)
}

async function handleProspectConverted(result: any) {
  showConvertModal.value = false
  
  // Show success message
  toast.success(`Engagement created and client creation request submitted to PRMS Admin. New Request: ${result.new_request.request_id}`)
  
  // Navigate to new engagement after a short delay
  setTimeout(() => {
    router.push(`/coi/request/${result.new_request.id}`)
  }, 1500)
}

// Resubmit a rejected request (converts to Draft for editing)
async function resubmitRequest() {
  if (!canResubmit.value) return
  
  resubmitting.value = true
  try {
    const response = await api.post(`/coi/requests/${request.value.id}/resubmit`)
    if (response.data.success) {
      // Reload the request to get updated status
      await loadRequest()
      toast.success('Request converted to draft. You can now edit and resubmit.')
    }
  } catch (error: any) {
    console.error('Failed to resubmit:', error)
    toast.error(error.response?.data?.error || 'Failed to resubmit request. Please try again.')
  } finally {
    resubmitting.value = false
  }
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

// Reject request with rejection type (fixable or permanent)
async function rejectRequestWithType() {
  actionLoading.value = true
  try {
    await api.post(`/coi/requests/${request.value.id}/reject`, { 
      reason: rejectionReason.value,
      rejection_type: rejectionType.value
    })
    showRejectModal.value = false
    await loadRequest()
    rejectionReason.value = ''
    rejectionType.value = 'fixable' // Reset to default
  } catch (error) {
    console.error('Failed to reject:', error)
  } finally {
    actionLoading.value = false
  }
}
</script>
