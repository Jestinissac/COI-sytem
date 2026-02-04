<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Top Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">New COI Request</h1>
            <p class="text-sm text-gray-500 mt-1">{{ formData.id ? `Editing Draft: COI-${formData.id}` : 'New COI request' }}</p>
          </div>
          <div class="flex items-center space-x-3" role="status" aria-live="polite">
            <template v-if="saveStatus === 'saving'">
              <span class="text-sm text-gray-600">Saving...</span>
              <span class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            </template>
            <template v-else-if="saveStatus === 'saved' && lastSavedAt">
              <span class="text-sm text-gray-500">Saved at {{ formatSaveTime(lastSavedAt) }}</span>
              <span class="w-2 h-2 bg-green-500 rounded-full"></span>
            </template>
            <template v-else-if="saveStatus === 'error'">
              <span class="text-sm text-red-600">Save failed</span>
              <span class="w-2 h-2 bg-red-500 rounded-full"></span>
            </template>
            <template v-else-if="isDirty">
              <span class="text-sm text-amber-600">Unsaved changes</span>
              <span class="w-2 h-2 bg-amber-500 rounded-full"></span>
            </template>
            <template v-else>
              <span class="text-sm text-gray-500">Auto-saved</span>
              <span class="w-2 h-2 bg-green-500 rounded-full"></span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-6">
      <div class="flex gap-6">
        <!-- Left Sidebar Navigation -->
        <div class="w-64 flex-shrink-0">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
            <!-- Progress Header -->
            <div class="px-4 py-4 border-b border-gray-200">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">Progress</span>
                <span class="text-sm text-gray-500">{{ completedSectionsCount }} of {{ totalSteps }}</span>
              </div>
              <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-blue-600 transition-all duration-300"
                  :style="{ width: `${(completedSectionsCount / totalSteps) * 100}%` }"
                ></div>
              </div>
            </div>

            <!-- Section Navigation -->
            <nav class="py-2">
              <a
                v-for="section in sections"
                :key="section.id"
                href="#"
                @click.prevent="scrollToSection(section.id)"
                class="flex items-center px-4 py-3 text-sm transition-colors border-l-2"
                :class="activeSection === section.id 
                  ? 'bg-gray-50 border-gray-300 text-gray-900 font-medium' 
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
              >
                <span 
                  class="w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3 flex-shrink-0"
                  :class="isSectionComplete(section.id) 
                    ? 'bg-green-500 text-white' 
                    : activeSection === section.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'"
                >
                  <svg v-if="isSectionComplete(section.id)" class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  <span v-else>{{ section.number }}</span>
                </span>
                {{ section.label }}
              </a>
            </nav>

            <!-- Action Buttons -->
            <div class="px-4 py-4 border-t border-gray-200 space-y-3">
              <button
                @click="handleSaveDraft"
                :disabled="loading"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Save Draft
              </button>
              <button
                @click="showConfirmModal = true"
                :disabled="loading || !isFormValid"
                class="w-full px-4 py-2.5 rounded-md text-sm font-medium text-white transition-colors"
                :class="isFormValid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'"
              >
                <span v-if="loading">Submitting...</span>
                <span v-else>Submit Request</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="flex-1 space-y-6">
          <!-- Workflow Notice -->
          <div v-if="isTeamMember" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start">
              <svg class="w-5 h-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div class="flex-1">
                <h3 class="text-sm font-medium text-blue-900 mb-1">Director Approval Required</h3>
                <p class="text-sm text-blue-700">
                  <span v-if="directorName">Your director: <strong>{{ directorName }}</strong>.</span>
                  Upload written approval or wait for in-system approval.
                </p>
              </div>
            </div>
          </div>
          <div v-else-if="isDirector" class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-start">
              <svg class="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div class="flex-1">
                <h3 class="text-sm font-medium text-green-900 mb-1">Direct to Compliance</h3>
                <p class="text-sm text-green-700">Your requests go directly to Compliance.</p>
              </div>
            </div>
          </div>

          <!-- Form Load Error Banner -->
          <div v-if="formLoadError" class="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <div class="flex-1">
                <p class="text-sm font-medium text-red-800">{{ formLoadError }}</p>
                <button
                  type="button"
                  @click="retryFormLoad"
                  class="mt-2 text-sm font-medium text-red-700 hover:text-red-900 underline"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>

          <!-- Section 1: Requestor Information -->
          <section id="section-1" class="bg-white rounded-lg shadow-sm border border-gray-200 scroll-mt-6">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div class="flex items-center">
                <span class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium mr-3">1</span>
                <div>
                  <h2 class="text-base font-semibold text-gray-900">Requestor Information</h2>
                </div>
              </div>
              <span v-if="isSectionComplete('section-1')" class="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Complete</span>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Requestor Name</label>
                  <input
                    v-model="formData.requestor_name"
                    type="text"
                    readonly
                    class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 text-sm"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                  <input
                    v-model="formData.line_of_service"
                    type="text"
                    readonly
                    class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 text-sm"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Designation <span class="text-red-500">*</span></label>
                  <select 
                    v-model="formData.designation"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-required="true"
                  >
                    <option value="">Select designation...</option>
                    <option>Partner</option>
                    <option>Senior Director</option>
                    <option>Director</option>
                    <option>Associate Director</option>
                    <option>Senior Manager</option>
                    <option>Manager</option>
                    <option>Assistant Manager</option>
                  </select>
                </div>
                <div>
                  <label for="form_entity" class="block text-sm font-medium text-gray-700 mb-1.5">Entity <span class="text-red-500">*</span></label>
                  <select
                    id="form_entity"
                    v-model="formData.entity"
                    @change="onEntityChange"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-required="true"
                  >
                    <option value="">Select entity...</option>
                    <option v-for="entity in entityOptions" :key="entity.id ?? entity.entity_code ?? entity.entity_name" :value="entity.entity_name">
                      {{ entity.entity_display_name || entity.entity_name }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <!-- Section 2: Document Type -->
          <section id="section-2" class="bg-white rounded-lg shadow-sm border border-gray-200 scroll-mt-6">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div class="flex items-center">
                <span class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium mr-3">2</span>
                <div>
                  <h2 class="text-base font-semibold text-gray-900">Document Type</h2>
                </div>
              </div>
              <span v-if="isSectionComplete('section-2')" class="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Complete</span>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-2 gap-4 mb-6">
                <label 
                  class="relative flex items-center p-4 border rounded cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                  :class="formData.requested_document === 'Proposal' ? 'border-gray-300 bg-gray-50' : 'border-gray-200 hover:border-gray-300'"
                >
                  <input 
                    type="radio" 
                    v-model="formData.requested_document" 
                    value="Proposal" 
                    class="sr-only"
                  />
                  <div class="flex items-center">
                    <svg class="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <div>
                      <p class="font-medium text-gray-900">Proposal</p>
                    </div>
                  </div>
                  <div v-if="formData.requested_document === 'Proposal'" class="absolute top-2 right-2">
                    <svg class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                </label>
                <label 
                  class="relative flex items-center p-4 border rounded cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                  :class="formData.requested_document === 'Engagement Letter' ? 'border-gray-300 bg-gray-50' : 'border-gray-200 hover:border-gray-300'"
                >
                  <input 
                    type="radio" 
                    v-model="formData.requested_document" 
                    value="Engagement Letter" 
                    class="sr-only"
                  />
                  <div class="flex items-center">
                    <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mr-3">
                      <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">Engagement Letter</p>
                    </div>
                  </div>
                  <div v-if="formData.requested_document === 'Engagement Letter'" class="absolute top-2 right-2">
                    <svg class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                </label>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Language</label>
                  <select 
                    v-model="formData.language"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>English</option>
                    <option>Arabic</option>
                    <option>Bilingual</option>
                  </select>
                </div>
                
                <!-- Lead Source (only for Proposals) -->
                <div v-if="formData.requested_document === 'Proposal'">
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Lead Source</label>
                  <select 
                    v-model="formData.lead_source_id"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option :value="null">Select lead source...</option>
                    <optgroup label="Referrals">
                      <option 
                        v-for="source in leadSourcesByCategory.referral" 
                        :key="source.id" 
                        :value="source.id"
                      >
                        {{ getLeadSourceDisplayName(source) }}
                      </option>
                    </optgroup>
                    <optgroup label="System">
                      <option 
                        v-for="source in leadSourcesByCategory.system" 
                        :key="source.id" 
                        :value="source.id"
                      >
                        {{ getLeadSourceDisplayName(source) }}
                      </option>
                    </optgroup>
                    <optgroup label="Outbound">
                      <option 
                        v-for="source in leadSourcesByCategory.outbound" 
                        :key="source.id" 
                        :value="source.id"
                      >
                        {{ getLeadSourceDisplayName(source) }}
                      </option>
                    </optgroup>
                    <optgroup label="Other">
                      <option 
                        v-for="source in leadSourcesByCategory.other" 
                        :key="source.id" 
                        :value="source.id"
                      >
                        {{ getLeadSourceDisplayName(source) }}
                      </option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <!-- Section 3: Client Details -->
          <section id="section-3" class="bg-white rounded-lg shadow-sm border border-gray-200 scroll-mt-6">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div class="flex items-center">
                <span class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium mr-3">3</span>
                <div>
                  <h2 class="text-base font-semibold text-gray-900">Client Details</h2>
                </div>
              </div>
              <span v-if="isSectionComplete('section-3')" class="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Complete</span>
            </div>
            <div class="p-6">
              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Select Client or Prospect <span class="text-red-500">*</span></label>
                  <div class="flex flex-col gap-1.5">
                    <ClientProspectCombobox
                      :model-value="smartSelectValue"
                      :clients="clients"
                      :prospects="prospects"
                      :loading="clientsLoading"
                      :error="clientsError"
                      :disabled="clientsLoading"
                      placeholder="Search by name or code..."
                      :aria-required="true"
                      @update:model-value="(v) => { smartSelectValue = v; onSmartSelect() }"
                    />
                    <p v-if="clientsLoading" class="text-xs text-gray-500" aria-live="polite">Loading clients...</p>
                    <p v-else-if="clientsError" class="text-xs text-red-600 flex items-center gap-2" role="alert" aria-live="assertive">
                      {{ clientsError }}
                      <button
                        type="button"
                        @click="fetchClients"
                        class="font-medium text-blue-600 hover:text-blue-800 underline"
                      >
                        Retry
                      </button>
                    </p>
                    <template v-else>
                      <p v-if="selectedEntityType === 'prospect'" class="text-xs text-gray-500">Prospect from CRM.</p>
                      <p v-else-if="selectedEntityType === 'client' && formData.client_id" class="text-xs text-gray-500">Existing client from PRMS.</p>
                    </template>
                  </div>
                </div>

                <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wide mt-6 mb-2">Identification</h4>
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label for="client_code" class="block text-sm font-medium text-gray-700 mb-1.5">Client Code</label>
                    <input
                      id="client_code"
                      v-model="selectedClientCode"
                      type="text"
                      readonly
                      class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 text-sm"
                      placeholder="-"
                    />
                  </div>
                  <div>
                    <label for="client_type" class="block text-sm font-medium text-gray-700 mb-1.5">Client Type</label>
                    <select
                      id="client_type"
                      v-model="formData.client_type"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select...</option>
                      <option v-for="ct in CLIENT_TYPES" :key="ct" :value="ct">{{ ct }}</option>
                    </select>
                  </div>
                  <div>
                    <label for="regulated_body" class="block text-sm font-medium text-gray-700 mb-1.5">Regulated By</label>
                    <select
                      id="regulated_body"
                      v-model="formData.regulated_body"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select...</option>
                      <option v-for="rb in REGULATED_BODIES" :key="rb" :value="rb">{{ rb }}</option>
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label for="client_status" class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <select
                      id="client_status"
                      v-model="formData.client_status"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select...</option>
                      <option>N/A</option>
                      <option>Listed</option>
                      <option>Licensed</option>
                      <option>Listed & Licensed</option>
                      <option>OTC</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label for="client_location" class="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                    <select
                      id="client_location"
                      v-model="formData.client_location"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select...</option>
                      <option 
                        v-for="(c, i) in locationOptions" 
                        :key="c.country_code || c.country_name || String(i)" 
                        :value="c.country_name"
                      >
                        {{ c.country_name }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label for="relationship_with_client" class="block text-sm font-medium text-gray-700 mb-1.5">Relationship</label>
                    <select
                      id="relationship_with_client"
                      v-model="formData.relationship_with_client"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select...</option>
                      <option>New Client</option>
                      <option>Existing Client</option>
                      <option>Former Client</option>
                    </select>
                  </div>
                </div>

                <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wide mt-6 mb-2">PIE & structure</h4>
                <div role="group" aria-labelledby="pie_status_label">
                  <span id="pie_status_label" class="block text-sm font-medium text-gray-700 mb-2">PIE Status</span>
                  <div class="flex items-center space-x-6">
                    <label for="pie_status_yes" class="flex items-center">
                      <input id="pie_status_yes" type="radio" v-model="formData.pie_status" value="Yes" class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" name="pie_status"/>
                      <span class="ml-2 text-sm text-gray-700">Yes - PIE</span>
                    </label>
                    <label for="pie_status_no" class="flex items-center">
                      <input id="pie_status_no" type="radio" v-model="formData.pie_status" value="No" class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" name="pie_status"/>
                      <span class="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>

                <!-- Group Structure Verification (Required for PIE/Audit) -->
                <div v-if="showGroupStructureSection" class="mt-4">
                  <div class="border border-gray-200 bg-gray-50 rounded-lg p-4">
                    <label class="block text-sm font-semibold text-gray-900 mb-2">
                      Corporate Group Structure
                      <span class="text-red-500">*</span>
                    </label>
                    <div class="space-y-2" role="group" aria-labelledby="group_structure_label">
                      <span id="group_structure_label" class="sr-only">Corporate Group Structure</span>
                      <label for="group_structure_standalone" class="flex items-center p-3 bg-white border rounded cursor-pointer transition-colors"
                             :class="formData.group_structure === 'standalone' ? 'border-gray-300 bg-gray-50' : 'border-gray-200 hover:border-gray-300'">
                        <input id="group_structure_standalone" type="radio" v-model="formData.group_structure" value="standalone" 
                               class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" name="group_structure"/>
                        <div class="ml-3">
                          <span class="text-sm font-medium text-gray-900">Standalone Entity</span>
                        </div>
                      </label>
                      
                      <label for="group_structure_has_parent" class="flex items-center p-3 bg-white border rounded cursor-pointer transition-colors"
                             :class="formData.group_structure === 'has_parent' ? 'border-gray-300 bg-gray-50' : 'border-gray-200 hover:border-gray-300'">
                        <input id="group_structure_has_parent" type="radio" v-model="formData.group_structure" value="has_parent" 
                               class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" name="group_structure"/>
                        <div class="ml-3">
                          <span class="text-sm font-medium text-gray-900">Part of Corporate Group</span>
                        </div>
                      </label>
                      
                      <label for="group_structure_research_required" class="flex items-center p-3 bg-white border rounded cursor-pointer transition-colors"
                             :class="formData.group_structure === 'research_required' ? 'border-gray-300 bg-gray-50' : 'border-gray-200 hover:border-gray-300'">
                        <input id="group_structure_research_required" type="radio" v-model="formData.group_structure" value="research_required" 
                               class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" name="group_structure"/>
                        <div class="ml-3 flex-1">
                          <span class="text-sm font-medium text-gray-900">Not Sure</span>
                        </div>
                        <span class="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded">May delay approval</span>
                      </label>
                    </div>
                    
                    <!-- Parent Company Input (shown when has_parent selected) -->
                    <div v-if="formData.group_structure === 'has_parent'" class="mt-4 pt-4 border-t border-gray-200">
                      <label for="parent_company_group" class="block text-sm font-medium text-gray-700 mb-1.5">
                        Parent Company Name <span class="text-red-500">*</span>
                      </label>
                      <input
                        id="parent_company_group"
                        v-model="formData.parent_company"
                        type="text"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., ABC Holdings, XYZ Group Ltd..."
                        required
                        aria-required="true"
                      />
                      <p v-if="formData.group_structure === 'has_parent' && parentCompanyError" class="text-xs text-red-500 mt-1" role="alert">{{ parentCompanyError }}</p>
                    </div>
                  </div>
                </div>

                <!-- Simple Parent Company field (for non-PIE/non-Audit) -->
                <div v-else class="space-y-4">
                  <!-- Company Type -->
                  <div>
                    <label for="company_type" class="block text-sm font-medium text-gray-700 mb-1.5">Company Type</label>
                    <select
                      id="company_type"
                      v-model="formData.company_type"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      @change="onCompanyTypeChange"
                    >
                      <option value="">Select company type...</option>
                      <option value="Standalone">Standalone</option>
                      <option value="Subsidiary">Subsidiary</option>
                      <option value="Affiliate">Affiliate</option>
                      <option value="Sister">Sister</option>
                      <option value="Parent">Parent</option>
                    </select>
                  </div>

                  <!-- Parent Company (shown when needed) -->
                  <div v-if="formData.company_type && formData.company_type !== 'Standalone' && formData.company_type !== 'Parent'">
                    <label for="parent_company" class="block text-sm font-medium text-gray-700 mb-1.5">
                      Parent Company
                      <span class="text-red-500">*</span>
                    </label>
                    <input
                      id="parent_company"
                      v-model="formData.parent_company"
                      type="text"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter parent company name..."
                      :required="formData.company_type !== 'Standalone'"
                      :aria-required="formData.company_type !== 'Standalone' && formData.company_type !== 'Parent'"
                    />
                    <p v-if="(formData.company_type === 'Subsidiary' || formData.company_type === 'Affiliate' || formData.company_type === 'Sister') && parentCompanyError" class="text-xs text-red-500 mt-1" role="alert">{{ parentCompanyError }}</p>
                  </div>

                  <!-- Ownership Percentage (for Subsidiary/Affiliate) -->
                  <div v-if="formData.company_type === 'Subsidiary' || formData.company_type === 'Affiliate'">
                    <label for="ownership_percentage" class="block text-sm font-medium text-gray-700 mb-1.5">Ownership Percentage (%)</label>
                    <input
                      id="ownership_percentage"
                      v-model.number="formData.ownership_percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 75.5"
                      :required="formData.company_type === 'Subsidiary' || formData.company_type === 'Affiliate'"
                      :aria-required="formData.company_type === 'Subsidiary' || formData.company_type === 'Affiliate'"
                    />
                    <p class="text-xs text-gray-500 mt-1">
                      <span v-if="formData.company_type === 'Subsidiary'">Subsidiary: 50–100%.</span>
                      <span v-else-if="formData.company_type === 'Affiliate'">Affiliate: 20–49%.</span>
                    </p>
                    <p v-if="ownershipPercentageError" class="text-xs text-red-500 mt-1" role="alert">{{ ownershipPercentageError }}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Section 4: Service Information (includes International Operations) -->
          <section id="section-4" class="bg-white rounded-lg shadow-sm border border-gray-200 scroll-mt-6">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div class="flex items-center">
                <span class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium mr-3">4</span>
                <div>
                  <h2 class="text-base font-semibold text-gray-900">Service Information</h2>
                </div>
              </div>
              <span v-if="isSectionComplete('section-4')" class="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Complete</span>
            </div>
            <div class="p-6 space-y-6">
              <!-- International Operations (at top so Line of Service can reflect it) -->
              <div class="pb-4 border-b border-gray-200">
                <label class="flex items-center">
                  <input 
                    type="checkbox" 
                    v-model="formData.international_operations"
                    :disabled="!isInternationalOperationsAllowed"
                    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span class="ml-2 text-sm font-medium text-gray-700">Client has international operations</span>
                </label>
              </div>

              <!-- Line of Service (local request) - always shown -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    Line of Service (local request) <span class="text-red-500">*</span>
                  </label>
                  <select 
                    v-model="formData.service_category"
                    @change="onServiceCategoryChange"
                    :disabled="loadingServices || !formData.entity"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    aria-required="true"
                  >
                    <option value="">{{ loadingServices ? 'Loading services...' : (formData.entity ? 'Select line of service...' : 'Select entity first') }}</option>
                    <option 
                      v-for="category in serviceTypes" 
                      :key="category.category" 
                      :value="category.category"
                    >
                      {{ category.category }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Service Type (local) <span class="text-red-500">*</span></label>
                  <select 
                    v-model="formData.service_type"
                    @change="onServiceTypeChange"
                    :disabled="loadingServices || !formData.entity || !formData.service_category"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    aria-required="true"
                  >
                    <option value="">{{ formData.service_category ? 'Select specific service type...' : 'Select line of service first' }}</option>
                    <option 
                      v-for="service in filteredServicesByCategory" 
                      :key="service.value || service"
                      :value="service.value || service"
                    >
                      {{ service.label || service }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Line of Service (BDO Global) - when international operations -->
              <div v-if="formData.international_operations" class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Line of Service (BDO Global)</label>
                  <select 
                    v-model="formData.global_service_category"
                    @change="onGlobalServiceCategoryChange"
                    :disabled="loadingGlobalServices || !formData.entity"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="">{{ loadingGlobalServices ? 'Loading...' : (formData.entity ? 'Select BDO Global line of service...' : 'Select entity first') }}</option>
                    <option 
                      v-for="category in globalServiceTypes" 
                      :key="category.category" 
                      :value="category.category"
                    >
                      {{ category.category }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Service Type (BDO Global)</label>
                  <select 
                    v-model="formData.global_service_type"
                    :disabled="loadingGlobalServices || !formData.entity || !formData.global_service_category"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="">{{ formData.global_service_category ? 'Select BDO Global service type...' : 'Select line of service first' }}</option>
                    <option 
                      v-for="service in filteredGlobalServicesByCategory" 
                      :key="service.value || service"
                      :value="service.value || service"
                    >
                      {{ service.label || service }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Sub-category (shown for Business/Asset Valuation with 3 radio options) -->
              <div v-if="availableSubCategories.length > 0" class="space-y-3" role="group" aria-required="true" aria-labelledby="service-subcategory-label">
                <label id="service-subcategory-label" class="block text-sm font-medium text-gray-700 mb-2">Service Sub-Category <span class="text-red-500">*</span></label>
                <div class="grid grid-cols-3 gap-4">
                  <label 
                    v-for="subCat in availableSubCategories" 
                    :key="subCat"
                    class="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                    :class="formData.service_sub_category === subCat ? 'bg-blue-50 border-blue-500' : ''"
                  >
                    <input
                      type="radio"
                      :value="subCat"
                      v-model="formData.service_sub_category"
                      class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span class="ml-2 text-sm text-gray-700 font-medium">{{ subCat }}</span>
                  </label>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Service Description <span class="text-red-500">*</span></label>
                <textarea
                  v-model="formData.service_description"
                  rows="4"
                  maxlength="2000"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the services to be provided..."
                  aria-required="true"
                ></textarea>
                <div class="flex items-center justify-between mt-1">
                  <p v-if="serviceDescriptionError" class="text-xs text-red-500" role="alert">{{ serviceDescriptionError }}</p>
                  <span v-else></span>
                  <span class="text-xs text-gray-400">{{ (formData.service_description || '').length }} / 2000</span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Service Period Start</label>
                  <input
                    v-model="formData.requested_service_period_start"
                    type="date"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Service Period End</label>
                  <input
                    v-model="formData.requested_service_period_end"
                    type="date"
                    :min="formData.requested_service_period_start || undefined"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <!-- External Deadline (Priority Scoring) -->
              <div class="border-t border-gray-200 pt-6 mt-4">
                <h3 class="text-sm font-medium text-gray-900 mb-4">External Deadline</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Deadline Date</label>
                    <input
                      v-model="formData.external_deadline"
                      type="date"
                      :min="todayIso"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Reason for Deadline</label>
                    <select
                      v-model="formData.deadline_reason"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option v-for="dr in DEADLINE_REASONS" :key="dr.value || 'none'" :value="dr.value">{{ dr.label }}</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Global COI Form (when international operations) -->
              <div v-if="formData.international_operations" class="border-t border-gray-200 pt-6 mt-4">
                <InternationalOperationsForm
                  :request-id="formData.id"
                  :initial-data="globalCOIFormData"
                  :countries="countries"
                  @update:data="handleGlobalCOIFormUpdate"
                />
              </div>
            </div>
          </section>

          <!-- Section 5: Ownership Structure (hidden when international; required for local-only) -->
          <section v-if="!formData.international_operations" id="section-5" class="bg-white rounded-lg shadow-sm border border-gray-200 scroll-mt-6">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div class="flex items-center">
                <span class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium mr-3">5</span>
                <div>
                  <h2 class="text-base font-semibold text-gray-900">Ownership Structure</h2>
                </div>
              </div>
              <span v-if="isSectionComplete('section-5')" class="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Complete</span>
            </div>
            <div class="p-6 space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Full Ownership Structure</label>
                <div class="space-y-3">
                  <div v-if="ownershipRows.length > 0" class="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                    <table class="min-w-full divide-y divide-gray-200 text-sm">
                      <thead class="bg-gray-100">
                        <tr>
                          <th scope="col" class="px-3 py-2 text-left font-medium text-gray-700">Name</th>
                          <th scope="col" class="px-3 py-2 text-left font-medium text-gray-700 w-28">%</th>
                          <th scope="col" class="w-10"></th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-200 bg-white">
                        <tr v-for="(row, idx) in ownershipRows" :key="idx">
                          <td class="px-3 py-2">
                            <input
                              v-model="row.name"
                              type="text"
                              class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Entity or shareholder"
                            />
                          </td>
                          <td class="px-3 py-2">
                            <input
                              v-model="row.percentage"
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0–100"
                            />
                          </td>
                          <td class="px-2 py-2">
                            <button
                              type="button"
                              @click="removeOwnershipRow(idx)"
                              class="text-gray-400 hover:text-red-600 p-1"
                              aria-label="Remove row"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div class="px-3 py-2 border-t border-gray-200 bg-gray-50">
                      <button
                        type="button"
                        @click="addOwnershipRow"
                        class="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        + Add row
                      </button>
                    </div>
                  </div>
                  <button
                    v-else
                    type="button"
                    @click="addOwnershipRow"
                    class="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 hover:border-gray-400 hover:text-gray-800"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8v8H4V4h8m8 8h-8V4H4v8h8z"/>
                    </svg>
                    Add shareholder / ownership row
                  </button>
                </div>
                <div class="mt-3">
                  <div v-if="ownershipRows.length > 0" class="flex items-center justify-between mb-1">
                    <p class="text-xs text-gray-500">Editable above via rows, or clear rows to type freely.</p>
                    <button
                      type="button"
                      @click="ownershipRows = []"
                      class="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Clear rows
                    </button>
                  </div>
                  <textarea
                    v-model="formData.full_ownership_structure"
                    rows="4"
                    :readonly="ownershipRows.length > 0"
                    :class="[
                      'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                      ownershipRows.length > 0 ? 'bg-gray-50 cursor-not-allowed' : ''
                    ]"
                    :placeholder="ownershipRows.length > 0 ? 'Populated from rows above' : 'Or describe the ownership structure in your own words (shareholders and percentages)...'"
                  ></textarea>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Related/Affiliated Entities</label>
                <textarea
                  v-model="formData.related_affiliated_entities"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="List any related or affiliated entities..."
                ></textarea>
              </div>
            </div>
          </section>

          <!-- Section 6: Signatories -->
          <section id="section-6" class="bg-white rounded-lg shadow-sm border border-gray-200 scroll-mt-6">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div class="flex items-center">
                <span class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium mr-3">6</span>
                <div>
                  <h2 class="text-base font-semibold text-gray-900">Signatories</h2>
                </div>
              </div>
              <span v-if="isSectionComplete('section-6')" class="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Complete</span>
            </div>
            <div class="p-6 space-y-4">
              <div v-if="isTeamMember && directorName" class="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
                <p class="text-sm text-gray-700">
                  <span class="font-medium text-gray-900">Primary approver:</span> {{ directorName }}
                </p>
              </div>
              <div v-else-if="isDirector" class="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                <p class="text-sm text-green-800">Your requests go directly to Compliance.</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Backup approver (optional)</label>
                <select
                  v-model="formData.backup_approver_id"
                  class="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">None — use default escalation</option>
                  <option
                    v-for="approver in approverUsers"
                    :key="approver.id"
                    :value="approver.id"
                  >
                    {{ approver.name }} ({{ approver.role }}{{ approver.department ? `, ${approver.department}` : '' }})
                  </option>
                </select>
              </div>
            </div>
          </section>

          <!-- Section 7: Director Approval Document (Team Members Only) -->
          <section v-if="isTeamMember" id="section-7" class="bg-white rounded-lg shadow-sm border border-gray-200 scroll-mt-6">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div class="flex items-center">
                <span class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium mr-3">7</span>
                <div>
                  <h2 class="text-base font-semibold text-gray-900">Director Approval Document</h2>
                </div>
              </div>
            </div>
            <div class="p-6">
              <FileUpload
                v-if="formData.id"
                :request-id="formData.id"
                :attachment-type="'director_approval'"
                :show-attachment-type="false"
                @uploaded="handleFileUploaded"
                @error="handleFileError"
              />
              <div v-else class="text-sm text-gray-500 italic">
                Save as draft first to upload documents
              </div>
            </div>
          </section>

          <!-- Bottom Spacer -->
          <div class="h-8"></div>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <ToastContainer />
    
    <!-- Confirmation Modal -->
    <ConfirmModal 
      :is-open="showConfirmModal"
      title="Submit COI Request"
      message="Submit this request? It will be sent for approval."
      confirm-text="Submit Request"
      cancel-text="Review Again"
      type="success"
      icon="✓"
      @confirm="handleSubmit"
      @close="showConfirmModal = false"
    />
    
    <DuplicateJustificationModal
      :open="showJustificationModal"
      :justification="duplicateJustification"
      @update:justification="duplicateJustification = $event"
      :duplicates="detectedDuplicates"
      :loading="loading"
      @cancel="showJustificationModal = false; duplicateJustification = ''"
      @confirm="submitWithJustification"
    />

    <ClarificationModal
      :show="showClarificationModal"
      :service-type-name="formData.service_type"
      :question-text="clarificationModalConfig.question_text"
      :options="clarificationModalConfig.options"
      @confirm="onClarificationConfirm"
      @cancel="onClarificationCancel"
    />

    <CreateProspectModal
      :open="showCreateProspectModal"
      :prospect="newProspect"
      @update:prospect="newProspect = $event"
      :creating="creatingProspect"
      @cancel="showCreateProspectModal = false"
      @confirm="createAndSelectProspect"
    />
  </div>

  <!-- Unsaved changes leave confirmation -->
  <div v-if="showLeaveConfirm" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 max-w-sm w-full p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-2">Unsaved changes</h3>
      <p class="text-sm text-gray-600 mb-4">You have unsaved changes. Leave anyway?</p>
      <div class="flex gap-3 justify-end">
        <button
          @click="confirmLeave(false)"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          Stay
        </button>
        <button
          @click="confirmLeave(true)"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          Leave
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useCOIRequestsStore } from '@/stores/coiRequests'
import { useAuthStore } from '@/stores/auth'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import FileUpload from '@/components/FileUpload.vue'
import InternationalOperationsForm from '@/components/coi/InternationalOperationsForm.vue'
import ClientProspectCombobox from '@/components/coi/ClientProspectCombobox.vue'
import DuplicateJustificationModal from '@/components/coi/DuplicateJustificationModal.vue'
import ClarificationModal from '@/components/coi/ClarificationModal.vue'
import CreateProspectModal from '@/components/coi/CreateProspectModal.vue'
import { CLIENT_TYPES, REGULATED_BODIES, DEADLINE_REASONS } from '@/constants/coiFormOptions'
import api from '@/services/api'

const router = useRouter()
const route = useRoute()
const coiStore = useCOIRequestsStore()
const authStore = useAuthStore()
const { success, error: showError, warning, info } = useToast()

const loading = ref(false)
const showConfirmModal = ref(false)
const activeSection = ref('section-1')

// Save state for header indicator
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const lastSavedAt = ref<Date | null>(null)
const isDirty = ref(false)
const showLeaveConfirm = ref(false)
let pendingLeaveNext: ((value: boolean) => void) | null = null

function formatSaveTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

const formLoadError = ref<string | null>(null)

const clients = ref<any[]>([])
const clientsLoading = ref(false)
const clientsError = ref('')
const prospects = ref<any[]>([]) // Prospects from CRM for Smart Suggest
const selectedClientCode = ref('')
const directorName = ref('')
const allUsers = ref<any[]>([])
// Fallback options when API fails (used for first-paint and InternationalOperationsForm)
const FALLBACK_ENTITIES = [
  { entity_code: 'BDO_AL_NISF', entity_name: 'BDO Al Nisf & Partners', entity_display_name: 'BDO Al Nisf & Partners', is_active: 1, is_default: 1 },
  { entity_code: 'BDO_CONSULTING', entity_name: 'BDO Consulting', entity_display_name: 'BDO Consulting', is_active: 1, is_default: 0 }
]
const FALLBACK_COUNTRIES = [
  { country_code: 'KWT', country_name: 'State of Kuwait', is_active: 1 },
  { country_code: 'OTHER', country_name: 'Other Country', is_active: 1 }
]
const entities = ref<any[]>([...FALLBACK_ENTITIES])
const serviceTypes = ref<any[]>([])
const globalServiceTypes = ref<any[]>([])
const loadingGlobalServices = ref(false)
const approverUsers = ref<{ id: number; name: string; email: string; role: string; department?: string }[]>([])
const countries = ref<any[]>([...FALLBACK_COUNTRIES])
const serviceSubCategories = ref<any>({}) // Store sub-categories by service type
const loadingServices = ref(false)
const leadSources = ref<any[]>([]) // Lead sources for proposals

// Ambiguous service clarification (Kuwait/CMA): modal when user selects catch-all service type
const ambiguousServiceConfig = ref<Record<string, { question_text: string; options: Array<{ label: string; cma_code: string | null }> }>>({})
const showClarificationModal = ref(false)
const clarificationModalConfig = ref<{ question_text: string; options: Array<{ label: string; cma_code: string | null }> }>({ question_text: '', options: [] })

// Smart Suggest: Track selection type (client, prospect, or new)
const selectedEntityType = ref<'client' | 'prospect' | null>(null)
const selectedProspectId = ref<number | null>(null)
const showCreateProspectModal = ref(false)
const creatingProspect = ref(false)
const newProspect = ref({
  prospect_name: '',
  industry: '',
  commercial_registration: ''
})

// Computed properties for user role
const isTeamMember = computed(() => {
  return authStore.user?.role === 'Requester' && authStore.user?.director_id
})

const isDirector = computed(() => {
  return authStore.user?.role === 'Director'
})

const isPartnerOrDirector = computed(() => {
  return ['Partner', 'Director'].includes(authStore.user?.role || '')
})

// Lead sources grouped by category
const leadSourcesByCategory = computed(() => {
  const grouped: Record<string, any[]> = {
    referral: [],
    system: [],
    outbound: [],
    other: []
  }
  
  leadSources.value.forEach((source: any) => {
    const category = source.source_category || 'other'
    if (grouped[category]) {
      grouped[category].push(source)
    } else {
      grouped.other.push(source)
    }
  })
  
  return grouped
})

// Lead source display label: mask "Client Intelligence Module" as "System generated" in UI only
function getLeadSourceDisplayName(source: { source_code?: string; source_name?: string }) {
  if (source?.source_code === 'insights_module') return 'System generated'
  return source?.source_name ?? ''
}

// Structured ownership rows (Section 5) – serialized into full_ownership_structure
const ownershipRows = ref<{ name: string; percentage: string }[]>([])

function addOwnershipRow() {
  ownershipRows.value.push({ name: '', percentage: '' })
}

function removeOwnershipRow(idx: number) {
  ownershipRows.value.splice(idx, 1)
}

// Parse "Name: X%" lines from draft into ownership rows (optional)
function parseOwnershipRowsFromText(text: string | null | undefined): { name: string; percentage: string }[] {
  if (!text || !String(text).trim()) return []
  const lines = String(text).split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const rows: { name: string; percentage: string }[] = []
  const re = /^(.+?):\s*([\d.]+)\s*%?$/
  for (const line of lines) {
    const m = line.match(re)
    if (m) rows.push({ name: m[1].trim(), percentage: m[2] })
  }
  return rows
}

watch(
  ownershipRows,
  () => {
    if (ownershipRows.value.length === 0) return
    const lines = ownershipRows.value.map(
      (r) => `${(r.name && r.name.trim()) || '—'}: ${r.percentage !== '' && r.percentage != null ? r.percentage : '0'}%`
    )
    formData.value.full_ownership_structure = lines.join('\n')
  },
  { deep: true, flush: 'post' }
)

// Normalize service option to { value, label, ...rest } so dropdown binding works (backend may return string or object)
function normalizeServiceOption(service: any): { value: string; label: string; [key: string]: any } {
  if (service == null) return { value: '', label: '' }
  if (typeof service === 'string') return { value: service, label: service }
  const val = service.value ?? service.label ?? service.name ?? String(service)
  const lbl = service.label ?? service.value ?? service.name ?? String(service)
  return { ...service, value: val, label: lbl }
}

// Get services filtered by selected category (normalized so Line of Service -> Service Type relation works)
const filteredServicesByCategory = computed(() => {
  if (!formData.value.service_category || !serviceTypes.value.length) {
    return []
  }
  const selectedCategory = serviceTypes.value.find((cat: any) => cat.category === formData.value.service_category)
  if (!selectedCategory || !selectedCategory.services?.length) {
    return []
  }
  return selectedCategory.services.map((s: any) => normalizeServiceOption(s)).filter((o: { value: string }) => o.value !== '')
})

// CMA code of selected service (for info banner when Kuwait client)
const selectedServiceCmaCode = computed(() => {
  if (!formData.value.service_type || !filteredServicesByCategory.value.length) return null
  const s = filteredServicesByCategory.value.find((x: any) => (x.value || x) === formData.value.service_type)
  return (s as any)?.cma_code ?? null
})

const filteredGlobalServicesByCategory = computed(() => {
  if (!formData.value.global_service_category || !globalServiceTypes.value.length) {
    return []
  }
  const selectedCategory = globalServiceTypes.value.find((cat: any) => cat.category === formData.value.global_service_category)
  if (!selectedCategory || !selectedCategory.services?.length) {
    return []
  }
  return selectedCategory.services.map((s: any) => normalizeServiceOption(s)).filter((o: { value: string }) => o.value !== '')
})

// Get available sub-categories for selected service type
// For Business/Asset Valuation: Acquisition, Capital Increase, Financial Facilities
const availableSubCategories = computed(() => {
  if (!formData.value.service_type) {
    return []
  }
  const serviceName = formData.value.service_type
  // Check if it's Business/Asset Valuation service
  if ((serviceName.includes('Business') && serviceName.includes('Valuation')) || 
      (serviceName.includes('Asset') && serviceName.includes('Valuation')) ||
      serviceName === 'Business / Asset Valuation Services') {
    // Return the 3 sub-categories for Business/Asset Valuation
    return ['Acquisition', 'Capital Increase', 'Financial Facilities']
  }
  // For other services, use the sub-categories from the API
  if (serviceSubCategories.value && serviceSubCategories.value[serviceName]) {
    return serviceSubCategories.value[serviceName] || []
  }
  return []
})

// Form data with defaults
const formData = ref({
  id: null as number | null,
  requestor_name: authStore.user?.name || '',
  designation: '',
  entity: 'BDO Al Nisf & Partners',
  line_of_service: authStore.user?.department || '',
  requested_document: 'Proposal',
  language: 'English',
  client_id: null as number | null,
  client_name: '',
  client_type: '',
  client_location: 'State of Kuwait',
  relationship_with_client: '',
  regulated_body: '',
  client_status: '',
  pie_status: 'No',
  group_structure: '',  // 'standalone', 'has_parent', 'research_required'
  parent_company: '',
  company_type: '',  // 'Standalone', 'Subsidiary', 'Parent', 'Sister', 'Affiliate'
  parent_company_id: null as number | null,
  ownership_percentage: null as number | null,
  control_type: '',  // 'Majority', 'Minority', 'Joint', 'Significant Influence', 'None'
  service_type: '',
  service_type_cma_code: undefined as string | null | undefined, // Clarified CMA code from ambiguous-service modal (Kuwait)
  service_category: '',
  service_sub_category: '',
  global_service_category: '',
  global_service_type: '',
  service_description: '',
  requested_service_period_start: '',
  requested_service_period_end: '',
  external_deadline: '',
  deadline_reason: '',
  full_ownership_structure: '',
  related_affiliated_entities: '',
  international_operations: false,
  country_code: '',
  foreign_subsidiaries: '',
  global_clearance_status: 'Not Required',
  global_coi_form_data: null as any,
  backup_approver_id: null as number | null,  // Backup approver when primary is NA (Goal 3)
  lead_source_id: null as number | null  // Lead source for proposals (CRM feature)
})

// Global COI Form data (for international operations)
const globalCOIFormData = ref<any>(null)

// Handle Global COI Form updates
function handleGlobalCOIFormUpdate(data: any) {
  globalCOIFormData.value = data
  formData.value.global_coi_form_data = data
}

// Auto-populate Global COI Form from main form data
function populateGlobalCOIForm() {
  if (!formData.value.international_operations) {
    return
  }
  
  // Get selected client data if available
  let selectedClient: any = null
  if (formData.value.client_id) {
    selectedClient = clients.value.find((c: any) => c.id === formData.value.client_id)
  }
  
  // Map main form data to Global COI Form structure
  const mappedData: any = {
    clientName: formData.value.client_name || selectedClient?.client_name || '',
    ultimateParentCompany: formData.value.parent_company || '',
    location: formData.value.client_location || selectedClient?.location || 'State of Kuwait',
    clientType: formData.value.relationship_with_client === 'Existing Client' ? 'Existing' :
                (formData.value.relationship_with_client === 'Potential Client' || formData.value.relationship_with_client === 'New Client') ? 'Potential' :
                formData.value.relationship_with_client || '',
    clientIsPIE: formData.value.pie_status === 'Yes' ? 'Yes' : 
                 formData.value.pie_status === 'No' ? 'No' : '',
    servicesDetails: formData.value.service_description || '',
    natureOfEngagement: formData.value.service_type || '',
    industrySector: selectedClient?.industry || formData.value.industry || '',
    website: selectedClient?.website || formData.value.website || '',
    engagementInvolvesAnotherParty: formData.value.related_affiliated_entities ? 'Yes' : 'No',
    countries: []
  }
  
  // Parse foreign_subsidiaries or country_code into countries array
  if (formData.value.country_code) {
    mappedData.countries.push({
      country_code: formData.value.country_code,
      entityName: formData.value.foreign_subsidiaries || ''
    })
  } else if (formData.value.foreign_subsidiaries) {
    // If we have foreign_subsidiaries but no country_code, add a placeholder
    mappedData.countries.push({
      country_code: '',
      entityName: formData.value.foreign_subsidiaries
    })
  }
  
  // Update globalCOIFormData (defer to nextTick to avoid recursive updates)
  nextTick(() => {
    globalCOIFormData.value = mappedData
    formData.value.global_coi_form_data = mappedData
  })
}

const sections = [
  { id: 'section-1', number: 1, label: 'Requestor Info' },
  { id: 'section-2', number: 2, label: 'Document Type' },
  { id: 'section-3', number: 3, label: 'Client Details' },
  { id: 'section-4', number: 4, label: 'Service Info' },
  { id: 'section-5', number: 5, label: 'Ownership' },
  { id: 'section-6', number: 6, label: 'Signatories' }
]

// Inline validation messages (real-time)
const ownershipPercentageError = computed(() => {
  const ct = formData.value.company_type
  if (ct !== 'Subsidiary' && ct !== 'Affiliate') return ''
  const pct = formData.value.ownership_percentage
  const num = pct !== null && pct !== undefined ? Number(pct) : NaN
  if (isNaN(num) || num === null || num === undefined) return 'Ownership percentage is required.'
  if (ct === 'Subsidiary' && (num < 50 || num > 100)) return 'Subsidiary requires 50–100%.'
  if (ct === 'Affiliate' && (num < 20 || num >= 50)) return 'Affiliate requires 20–49%.'
  return ''
})

const parentCompanyError = computed(() => {
  const needsParent =
    formData.value.group_structure === 'has_parent' ||
    (formData.value.company_type && formData.value.company_type !== 'Standalone' && formData.value.company_type !== 'Parent')
  if (!needsParent) return ''
  const val = formData.value.parent_company
  if (!val || !String(val).trim()) return 'Parent company is required.'
  return ''
})

const serviceDescriptionError = computed(() => {
  const val = formData.value.service_description
  if (!val || !String(val).trim()) return 'Service description is required.'
  return ''
})

// Check if a section is complete
function isSectionComplete(sectionId: string): boolean {
  switch (sectionId) {
    case 'section-1':
      return !!(formData.value.designation && formData.value.entity)
    case 'section-2':
      return !!(formData.value.requested_document)
    case 'section-3': {
      if (!formData.value.client_id) return false
      // Subsidiary/Affiliate require parent company and ownership % in valid range
      const ct = formData.value.company_type
      if (ct === 'Subsidiary' || ct === 'Affiliate') {
        const parentOk = !!(formData.value.parent_company && String(formData.value.parent_company).trim())
        const pct = formData.value.ownership_percentage
        const pctNum = pct !== null && pct !== undefined ? Number(pct) : NaN
        const ownershipOk = ct === 'Subsidiary'
          ? !isNaN(pctNum) && pctNum >= 50 && pctNum <= 100
          : !isNaN(pctNum) && pctNum >= 20 && pctNum < 50
        return parentOk && ownershipOk
      }
      return true
    }
    case 'section-4': {
      const serviceOk = !!(formData.value.service_type && formData.value.service_description)
      if (!serviceOk) return false
      // When international, optionally require Global form has at least one country
      if (formData.value.international_operations) {
        const globalData = formData.value.global_coi_form_data
        return !!(globalData && Array.isArray(globalData.countries) && globalData.countries.length > 0)
      }
      return true
    }
    case 'section-5':
      // When international, ownership is in Global COI Form — section hidden, treat complete
      if (formData.value.international_operations) return true
      // When local-only, require Full Ownership Structure (Goal 2)
      return !!(formData.value.full_ownership_structure && String(formData.value.full_ownership_structure).trim())
    case 'section-6':
      return true // Auto-assigned / backup optional
    case 'section-7':
      // Director Approval Document: complete when draft saved so upload is available
      return !isTeamMember.value || !!formData.value.id
    default:
      return false
  }
}

const totalSteps = computed(() => sections.length + (isTeamMember.value ? 1 : 0))

const completedSectionsCount = computed(() => {
  const fromSections = sections.filter(s => isSectionComplete(s.id)).length
  const section7 = isTeamMember.value && isSectionComplete('section-7') ? 1 : 0
  return fromSections + section7
})

const isFormValid = computed(() => {
  const base = isSectionComplete('section-1') &&
    isSectionComplete('section-2') &&
    isSectionComplete('section-3') &&
    isSectionComplete('section-4')
  // When local-only, Section 5 (Ownership) is required (Goal 2)
  if (!formData.value.international_operations) {
    return base && isSectionComplete('section-5')
  }
  return base
})

const todayIso = computed(() => new Date().toISOString().slice(0, 10))

// FlowValidator: Standalone entities cannot have international operations (UI state alignment)
const isInternationalOperationsAllowed = computed(() => formData.value.company_type !== 'Standalone')

// Determines if the group structure verification section should be shown
// Required for PIE clients and Audit engagements (IESBA 290.13)
const showGroupStructureSection = computed(() => {
  return formData.value.pie_status === 'Yes' || isAuditServiceType(formData.value.service_type)
})

// Helper function to check if a service type is an audit service
function isAuditServiceType(serviceType: string): boolean {
  if (!serviceType) return false
  
  const auditServices = [
    'Statutory Audit', 'External Audit', 'Group Audit', 'IFRS Audit',
    'Audit', 'Assurance', 'Financial Statement Audit',
    'Limited Review', 'Agreed Upon Procedures'
  ]
  
  // Exact match
  if (auditServices.includes(serviceType)) return true
  
  // Contains 'Audit' but not 'Internal Audit'
  const lower = serviceType.toLowerCase()
  if (lower.includes('audit') && !lower.includes('internal')) return true
  
  // Contains 'Assurance'
  if (lower.includes('assurance')) return true
  
  return false
}

// Scroll to section
function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeSection.value = sectionId
  }
}

// Smart Suggest: Combined value for the dropdown
const smartSelectValue = ref('')

// Handle Smart Suggest selection
function onSmartSelect() {
  const value = smartSelectValue.value
  
  if (!value) {
    // Clear selection
    formData.value.client_id = null
    selectedClientCode.value = ''
    formData.value.client_name = ''
    selectedEntityType.value = null
    selectedProspectId.value = null
    return
  }
  
  const [type, id] = value.split(':')
  
  if (type === 'client') {
    // PRMS Client selected — pre-fill parent from PRMS when not TBD (parent company bidirectional sync)
    const clientId = parseInt(id)
    const client = clients.value.find(c => c.id === clientId)
    if (client) {
      formData.value.client_id = clientId
      selectedClientCode.value = client.client_code || client.code || ''
      formData.value.client_name = client.client_name || client.name || ''
      formData.value.parent_company = client.parent_company || ''
      // Clear relationship so user chooses (existing client can be upsell, referral, etc.)
      formData.value.relationship_with_client = ''
      // Set regulated_body if available
      if (client.regulated_body) {
        formData.value.regulated_body = client.regulated_body
      }
      selectedEntityType.value = 'client'
      selectedProspectId.value = null
      
      // If entity is selected, refresh service types (to check if CMA-regulated)
      if (formData.value.entity) {
        fetchServiceTypes()
      }
    }
  } else if (type === 'prospect') {
    // Prospect selected from CRM
    const prospectId = parseInt(id)
    const prospect = prospects.value.find(p => p.id === prospectId)
    if (prospect) {
      // For prospects, we don't have a client_id yet
      // Store prospect info in form data
      formData.value.client_id = null
      formData.value.client_name = prospect.prospect_name
      selectedClientCode.value = prospect.commercial_registration || ''
      selectedEntityType.value = 'prospect'
      selectedProspectId.value = prospectId
    }
  } else if (type === 'new' && id === 'prospect') {
    // Open create prospect modal
    showCreateProspectModal.value = true
    // Reset the dropdown to previous selection
    if (selectedEntityType.value === 'client' && formData.value.client_id) {
      smartSelectValue.value = `client:${formData.value.client_id}`
    } else if (selectedEntityType.value === 'prospect' && selectedProspectId.value) {
      smartSelectValue.value = `prospect:${selectedProspectId.value}`
    } else {
      smartSelectValue.value = ''
    }
  }
}

// Legacy function for backward compatibility (also pre-fills parent from PRMS when existing client)
function onClientSelect() {
  const client = clients.value.find(c => c.id === formData.value.client_id)
  if (client) {
    selectedClientCode.value = client.client_code || client.code || ''
    formData.value.client_name = client.client_name || client.name || ''
    formData.value.parent_company = client.parent_company || formData.value.parent_company || ''
  } else {
    selectedClientCode.value = ''
    formData.value.client_name = ''
  }
}

// Fetch clients
async function fetchClients() {
  clientsLoading.value = true
  clientsError.value = ''
  try {
    const response = await api.get('/integration/clients')
    clients.value = response.data || []
  } catch (err: any) {
    clients.value = []
    clientsError.value = err.response?.data?.error || err.message || 'Failed to load clients.'
  } finally {
    clientsLoading.value = false
  }
}

// Pre-fill existing client from route (e.g. "Create COI for this client" from PRMS)
function applyRouteQueryClientPrefill() {
  const clientIdParam = route.query.client_id
  const clientCodeParam = route.query.client_code
  if (!clientIdParam && !clientCodeParam) return

  let client: { id: number; client_name?: string; name?: string; client_code?: string; code?: string; parent_company?: string; regulated_body?: string } | undefined
  if (clientIdParam) {
    const id = typeof clientIdParam === 'string' ? parseInt(clientIdParam, 10) : Number(clientIdParam)
    if (!Number.isNaN(id)) client = clients.value.find((c: any) => c.id === id)
  }
  if (!client && clientCodeParam) {
    const code = String(clientCodeParam).trim()
    client = clients.value.find((c: any) => (c.client_code || c.code || '') === code)
  }
  if (!client) return

  formData.value.client_id = client.id
  formData.value.client_name = client.client_name || client.name || ''
  selectedClientCode.value = client.client_code || client.code || ''
  formData.value.parent_company = client.parent_company || ''
  formData.value.relationship_with_client = ''
  if (client.regulated_body) formData.value.regulated_body = client.regulated_body
  smartSelectValue.value = `client:${client.id}`
  selectedEntityType.value = 'client'
  selectedProspectId.value = null
  if (formData.value.entity) fetchServiceTypes()
}

// Fetch prospects for Smart Suggest dropdown
async function fetchProspects() {
  try {
    const response = await api.get('/prospects/dropdown')
    prospects.value = response.data || []
  } catch (err: any) {
    prospects.value = []
  }
}

// Create new prospect and auto-select it (Smart Suggest)
async function createAndSelectProspect() {
  if (!newProspect.value.prospect_name.trim()) {
    showError('Prospect name is required')
    return
  }
  
  creatingProspect.value = true
  
  try {
    // Create the prospect via API
    const response = await api.post('/prospects', {
      prospect_name: newProspect.value.prospect_name.trim(),
      industry: newProspect.value.industry || null,
      commercial_registration: newProspect.value.commercial_registration || null,
      status: 'Active',
      lead_source_id: null // Will be auto-detected as COI Form
    })
    
    const createdProspect = response.data

    // Add to prospects list
    prospects.value.unshift({
      id: createdProspect.id,
      prospect_name: createdProspect.prospect_name,
      industry: createdProspect.industry,
      commercial_registration: createdProspect.commercial_registration,
      status: 'Active'
    })
    
    // Auto-select the new prospect
    smartSelectValue.value = `prospect:${createdProspect.id}`
    formData.value.client_id = null
    formData.value.client_name = createdProspect.prospect_name
    selectedClientCode.value = createdProspect.commercial_registration || ''
    selectedEntityType.value = 'prospect'
    selectedProspectId.value = createdProspect.id
    
    // Close modal and reset form
    showCreateProspectModal.value = false
    newProspect.value = {
      prospect_name: '',
      industry: '',
      commercial_registration: ''
    }
    
    success('Prospect created and selected')
  } catch (err: any) {
    showError(err.response?.data?.error || 'Failed to create prospect')
  } finally {
    creatingProspect.value = false
  }
}

// Stable options for Entity dropdown (avoids empty list when API fails or during updates)
const entityOptions = computed(() => (entities.value?.length ? entities.value : FALLBACK_ENTITIES))

// Fetch entity codes (for Entity dropdown)
async function fetchEntities() {
  try {
    const response = await api.get('/entity-codes')
    const raw = response?.data
    const list = Array.isArray(raw) ? raw : (Array.isArray((raw as any)?.data) ? (raw as any).data : [])
    const filtered = list.filter((e: any) => e && (e.is_active !== 0 && e.is_active !== false))
    entities.value = filtered.length > 0 ? filtered : [...FALLBACK_ENTITIES]
  } catch {
    entities.value = [...FALLBACK_ENTITIES]
  }
  if (!formData.value.entity && entities.value.length > 0) {
    const defaultEntity = entities.value.find((e: any) => e.is_default) || entities.value[0]
    nextTick(() => {
      formData.value.entity = defaultEntity.entity_name
      onEntityChange()
    })
  }
}

// Fetch countries (master data for Location dropdown). Never leaves countries empty.
async function fetchCountries() {
  try {
    const response = await api.get('/countries')
    const raw = response?.data
    const list = Array.isArray(raw) ? raw : (Array.isArray((raw as any)?.data) ? (raw as any).data : [])
    const valid = list.filter((c: any) => c && (c.country_code != null || c.country_name != null))
    countries.value = valid.length > 0 ? [...valid] : [...FALLBACK_COUNTRIES]
  } catch {
    countries.value = [...FALLBACK_COUNTRIES]
  }
  if (!countries.value.length) countries.value = [...FALLBACK_COUNTRIES]
}

// Stable options for Location dropdown: always a new array so the select gets a consistent list.
const locationOptions = computed(() => {
  const src = countries.value?.length ? countries.value : FALLBACK_COUNTRIES
  return Array.isArray(src) ? [...src] : [...FALLBACK_COUNTRIES]
})

// Normalize "Kuwait" to "State of Kuwait" when options use the latter. Watch array reference only (no deep) to avoid recursive updates.
const KUWAIT_NAMES = { short: 'Kuwait', canonical: 'State of Kuwait' }
watch(() => countries.value, () => {
  const loc = formData.value.client_location
  if (loc !== KUWAIT_NAMES.short) return
  const opts = locationOptions.value
  const hasShort = opts.some((c: any) => (c.country_name || '') === KUWAIT_NAMES.short)
  const hasCanonical = opts.some((c: any) => (c.country_name || '') === KUWAIT_NAMES.canonical)
  if (!hasShort && hasCanonical) {
    nextTick(() => {
      if (formData.value.client_location === KUWAIT_NAMES.short) {
        formData.value.client_location = KUWAIT_NAMES.canonical
      }
    })
  }
}, { flush: 'post' })

// Kuwait location check (CMA applies to all Kuwait clients)
const KUWAIT_LOCATIONS = ['kuwait', 'state of kuwait', 'kwt']
function isLocationKuwait(loc: string | undefined | null): boolean {
  if (!loc) return false
  const normalized = String(loc).toLowerCase().trim()
  return KUWAIT_LOCATIONS.some(k => normalized === k || normalized.includes(k))
}

// Check if selected client is CMA-regulated (location-based: Kuwait = CMA; fallback to regulated_body / is_cma_regulated)
const isClientCMARegulated = computed(() => {
  // Location-based: form or client location indicates Kuwait
  if (isLocationKuwait(formData.value.client_location)) return true
  const client = formData.value.client_id ? clients.value.find((c: any) => c.id === formData.value.client_id) : null
  if (client && isLocationKuwait((client as any).client_location || (client as any).country)) return true
  if (!client) return false
  // Fallback: regulated_body or is_cma_regulated
  if ((client as any).regulated_body && (
    String((client as any).regulated_body).includes('CMA') ||
    String((client as any).regulated_body).includes('Capital Markets Authority')
  )) return true
  if ((client as any).is_cma_regulated === true || (client as any).is_cma_regulated === 1) return true
  if (formData.value.regulated_body && (
    String(formData.value.regulated_body).includes('CMA') ||
    String(formData.value.regulated_body).includes('Capital Markets Authority')
  )) return true
  return false
})

// Fetch ambiguous service config (clarification modal for Kuwait/CMA)
async function fetchAmbiguousServiceConfig() {
  try {
    const response = await api.get('/integration/ambiguous-service-config')
    const raw = response.data?.ambiguousServiceConfig || {}
    const normalized: Record<string, { question_text: string; options: Array<{ label: string; cma_code: string | null }> }> = {}
    for (const [key, val] of Object.entries(raw)) {
      const v = val as any
      if (v?.requires_question && v?.question_text && Array.isArray(v?.options)) {
        normalized[key] = { question_text: v.question_text, options: v.options }
      }
    }
    ambiguousServiceConfig.value = normalized
  } catch {
    ambiguousServiceConfig.value = {}
  }
}

// Fetch service types filtered by entity
async function fetchServiceTypes() {
  if (!formData.value.entity) {
    serviceTypes.value = []
    serviceSubCategories.value = {}
    return
  }
  
  loadingServices.value = true

  try {
    // Full Kuwait template list; when CMA-regulated, include CMA metadata for [CMA] tag and info banner
    let entityCode = entities.value.find((e: any) => e.entity_name === formData.value.entity)?.entity_code
    if (!entityCode && entities.value.length > 0) {
      entityCode = entities.value[0]?.entity_code
    }
    const params: any = { international: 'false' }
    if (entityCode) params.entity = entityCode
    if (isClientCMARegulated.value) params.include_cma_metadata = 'true'
    const response = await api.get('/integration/service-types', { params })
    const list = response.data?.serviceTypes || []
    serviceTypes.value = list
    serviceSubCategories.value = response.data.subCategories || {}
  } catch (err: any) {
    serviceTypes.value = []
    serviceSubCategories.value = {}
  } finally {
    loadingServices.value = false
  }
}

// Handle service category change
function onServiceCategoryChange() {
  // Clear service type and sub-category when category changes
  formData.value.service_type = ''
  formData.value.service_sub_category = ''
}

// Handle global service category change
function onGlobalServiceCategoryChange() {
  formData.value.global_service_type = ''
}

// Fetch BDO Global service types (when international operations)
async function fetchGlobalServiceTypes() {
  if (!formData.value.entity) {
    globalServiceTypes.value = []
    return
  }
  loadingGlobalServices.value = true
  try {
    let entityCode = entities.value.find((e: any) => e.entity_name === formData.value.entity)?.entity_code
    if (!entityCode && entities.value.length > 0) {
      entityCode = entities.value[0]?.entity_code
    }
    const params: any = { international: 'true' }
    if (entityCode) {
      params.entity = entityCode
    }
    const response = await api.get('/integration/service-types', { params })
    globalServiceTypes.value = response.data.serviceTypes || []
  } catch (err: any) {
    // Keep previous list on failure (e.g. 401) so the dropdown doesn't disappear
  } finally {
    loadingGlobalServices.value = false
  }
}

// Handle service type change
function onServiceTypeChange() {
  const serviceType = formData.value.service_type
  // Clear clarified CMA code when service type changes; will be set again if ambiguous + modal confirm
  formData.value.service_type_cma_code = undefined

  // Auto-populate category from the selected service type if not already set
  if (serviceType && !formData.value.service_category) {
    const serviceCategory = serviceTypes.value.find((cat: any) => 
      cat.services.some((s: any) => (s.value || s) === serviceType)
    )
    if (serviceCategory) {
      formData.value.service_category = serviceCategory.category
    }
  }

  // Ambiguous service (Kuwait): show clarification modal so we can map to CMA code or NULL
  if (isClientCMARegulated.value && serviceType) {
    const config = ambiguousServiceConfig.value[serviceType]
    if (config?.requires_question && config?.question_text && config?.options?.length) {
      clarificationModalConfig.value = { question_text: config.question_text, options: config.options }
      showClarificationModal.value = true
      return
    }
  }
  
  // Validate CMA compliance if client is CMA-regulated (non-ambiguous path)
  if (isClientCMARegulated.value && serviceType) {
    const selectedService = filteredServicesByCategory.value.find((s: any) => 
      (s.value || s) === serviceType
    )
    if (!selectedService || !selectedService.is_cma_regulated) {
      // Service is not CMA-compliant; backend will validate during conflict check
    }
  }
  
  // Clear sub-category when service type changes
  formData.value.service_sub_category = ''
}

function onClarificationConfirm(cmaCode: string | null) {
  formData.value.service_type_cma_code = cmaCode
  showClarificationModal.value = false
}

function onClarificationCancel() {
  formData.value.service_type = ''
  formData.value.service_type_cma_code = undefined
  showClarificationModal.value = false
}

// Handle company type change - auto-infer control type and sync with group_structure
function onCompanyTypeChange() {
  const companyType = formData.value.company_type
  
  // Auto-sync group_structure based on company type
  if (companyType === 'Standalone') {
    formData.value.group_structure = 'standalone'
    formData.value.parent_company = ''
    formData.value.parent_company_id = null
    formData.value.ownership_percentage = null
    formData.value.control_type = 'None'
  } else if (companyType === 'Subsidiary' || companyType === 'Affiliate' || companyType === 'Sister') {
    formData.value.group_structure = 'has_parent'
    // Keep parent_company if already set
  } else if (companyType === 'Parent') {
    formData.value.group_structure = 'standalone' // Parent is standalone, but controls others
    formData.value.parent_company = ''
    formData.value.parent_company_id = null
    formData.value.ownership_percentage = null
    formData.value.control_type = 'None'
  }
  
  // Auto-infer control type from ownership percentage
  if (formData.value.ownership_percentage !== null && formData.value.ownership_percentage !== undefined) {
    if (formData.value.ownership_percentage >= 50) {
      formData.value.control_type = 'Majority'
    } else if (formData.value.ownership_percentage >= 20) {
      formData.value.control_type = 'Significant Influence'
    } else {
      formData.value.control_type = 'Minority'
    }
  }
}

// Handle entity change
function onEntityChange() {
  fetchServiceTypes()
}

// Auto-save functionality
let autoSaveInterval: number | null = null
let serverAutoSaveTimeout: number | null = null

function startAutoSave() {
  autoSaveInterval = window.setInterval(() => {
    saveToLocalStorage()
  }, 30000)
}

function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval)
    autoSaveInterval = null
  }
  if (serverAutoSaveTimeout) {
    clearTimeout(serverAutoSaveTimeout)
    serverAutoSaveTimeout = null
  }
}

// Debounced server auto-save: persists draft to server 30s after last change
function scheduleServerAutoSave() {
  if (serverAutoSaveTimeout) clearTimeout(serverAutoSaveTimeout)
  serverAutoSaveTimeout = window.setTimeout(async () => {
    // Only auto-save to server when dirty and form has minimum data
    if (!isDirty.value || loading.value) return
    if (!formData.value.designation && !formData.value.client_id) return
    saveStatus.value = 'saving'
    try {
      if (formData.value.id) {
        await coiStore.updateRequest(formData.value.id, formData.value)
      } else {
        const result = await coiStore.createRequest(formData.value)
        if (result?.id) formData.value.id = result.id
      }
      saveStatus.value = 'saved'
      lastSavedAt.value = new Date()
      await nextTick()
      isDirty.value = false
      saveToLocalStorage()
    } catch {
      saveStatus.value = 'error'
    }
  }, 30000)
}

function saveToLocalStorage() {
  localStorage.setItem('coi-wizard-data', JSON.stringify(formData.value))
}

function loadFromLocalStorage(): boolean {
  const saved = localStorage.getItem('coi-wizard-data')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      formData.value = { ...formData.value, ...parsed }
      return true
    } catch {
      return false
    }
  }
  return false
}

function clearLocalStorage() {
  localStorage.removeItem('coi-wizard-data')
}

// Handle save draft – update existing draft if id is set, otherwise create
async function handleSaveDraft() {
  saveStatus.value = 'saving'
  loading.value = true
  try {
    if (formData.value.id) {
      await coiStore.updateRequest(formData.value.id, formData.value)
    } else {
      const result = await coiStore.createRequest(formData.value)
      if (result?.id) formData.value.id = result.id
    }
    saveStatus.value = 'saved'
    lastSavedAt.value = new Date()
    await nextTick()
    isDirty.value = false
    success('Draft saved successfully')
    saveToLocalStorage()
    // Stay on page so user can continue editing; they can navigate via sidebar
  } catch (err: any) {
    saveStatus.value = 'error'
    showError(err.response?.data?.error || 'Failed to save draft')
  } finally {
    loading.value = false
  }
}

// Duplicate justification state
const showJustificationModal = ref(false)
const duplicateJustification = ref('')
const detectedDuplicates = ref<any[]>([])
const pendingRequestId = ref<number | null>(null)

// Handle submit
async function handleSubmit() {
  showConfirmModal.value = false
  
  loading.value = true
  try {
    // Use existing draft if available; otherwise create a new one
    let requestId: number
    if (formData.value.id) {
      await coiStore.updateRequest(formData.value.id, formData.value)
      requestId = formData.value.id
    } else {
      const result = await coiStore.createRequest(formData.value)
      requestId = result.id
      formData.value.id = result.id
    }
    pendingRequestId.value = requestId

    // Try to submit with justification and lead_source_id if provided
    const submitPayload: any = {}

    if (duplicateJustification.value) {
      submitPayload.duplicate_justification = duplicateJustification.value
    }

    // Include lead_source_id for proposals (CRM attribution feature)
    if (formData.value.requested_document === 'Proposal' && formData.value.lead_source_id) {
      submitPayload.lead_source_id = formData.value.lead_source_id
    }

    const submitResult = await coiStore.submitRequest(
      requestId,
      Object.keys(submitPayload).length > 0 ? submitPayload : undefined
    )
    
    // Check for duplicates - handle both array and object formats
    const dupes = submitResult?.duplicates
    const hasDuplicates = Array.isArray(dupes) 
      ? dupes.length > 0 
      : (dupes?.matches?.length > 0 || dupes?.recommendations?.length > 0)
    
    if (hasDuplicates) {
      showError('Duplication detected! Please review.')
    } else if (submitResult?.flagged) {
      // Request was flagged for group conflicts - show warning but still success
      warning('Request submitted but flagged for Compliance review due to potential group conflicts. You will be notified once the review is complete.')
      clearLocalStorage()
      stopAutoSave()
      duplicateJustification.value = ''
      
      setTimeout(() => {
        router.push('/coi/requester')
      }, 2000)
    } else {
      success('Request submitted successfully!')
      clearLocalStorage()
      stopAutoSave()
      duplicateJustification.value = ''
      
      setTimeout(() => {
        router.push('/coi/requester')
      }, 1500)
    }
  } catch (err: any) {
    // Check if this is a duplicate blocking error
    if (err.response?.data?.requiresJustification) {
      // Handle both array and object formats for duplicates
      const dupes = err.response.data.duplicates
      detectedDuplicates.value = Array.isArray(dupes) 
        ? dupes 
        : (dupes?.matches || [])
      showJustificationModal.value = true
      loading.value = false
      return
    }
    showError(err.response?.data?.error || err.message || 'Failed to submit request')
  } finally {
    loading.value = false
  }
}

// Submit with justification
async function submitWithJustification() {
  if (!duplicateJustification.value.trim()) {
    showError('Please provide a justification')
    return
  }
  
  showJustificationModal.value = false
  loading.value = true
  
  try {
    const submitResult = await coiStore.submitRequest(
      pendingRequestId.value!, 
      { duplicate_justification: duplicateJustification.value }
    )
    
    success('Request submitted with justification!')
    clearLocalStorage()
    stopAutoSave()
    duplicateJustification.value = ''
    
    setTimeout(() => {
      router.push('/coi/requester')
    }, 1500)
  } catch (err: any) {
    showError(err.response?.data?.error || err.message || 'Failed to submit request')
  } finally {
    loading.value = false
  }
}

// Intersection Observer for active section tracking
let observer: IntersectionObserver | null = null

function setupIntersectionObserver() {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id
        }
      })
    },
    { threshold: 0.3, rootMargin: '-100px 0px -50% 0px' }
  )

  sections.forEach((section) => {
    const element = document.getElementById(section.id)
    if (element) observer?.observe(element)
  })
}

async function fetchDirectorName() {
  if (isTeamMember.value && authStore.user?.director_id) {
    try {
      const response = await api.get('/auth/users')
      allUsers.value = response.data
      const director = response.data.find((u: any) => u.id === authStore.user?.director_id)
      if (director) {
        directorName.value = director.name
      }
    } catch { /* non-critical */ }
  }
}

function handleFileUploaded() {
  success('File uploaded successfully!')
}

function handleFileError(error: string) {
  showError(error)
}

// Watch international_operations to refetch services and populate Global COI Form (Ghost Data: clear when off)
watch(() => formData.value.international_operations, (newValue) => {
  if (newValue) {
    if (formData.value.entity) {
      fetchGlobalServiceTypes()
    }
    populateGlobalCOIForm()
  } else {
    nextTick(() => {
      formData.value.global_service_category = ''
      formData.value.global_service_type = ''
      formData.value.global_coi_form_data = null
      globalCOIFormData.value = null
      globalServiceTypes.value = []
    })
  }
})

// FlowValidator: Standalone ⟹ no international operations (Mutually Exclusive + Ghost Data)
watch(() => formData.value.company_type, (newVal) => {
  if (newVal === 'Standalone') {
    nextTick(() => {
      formData.value.international_operations = false
      formData.value.global_service_category = ''
      formData.value.global_service_type = ''
      formData.value.global_coi_form_data = null
      globalCOIFormData.value = null
      globalServiceTypes.value = []
    })
  }
})

// Watch entity to fetch service types when entity is selected or changes
watch(() => formData.value.entity, (newEntity, oldEntity) => {
  if (newEntity && newEntity !== oldEntity) {
    // Small delay to ensure entities list is loaded
    setTimeout(() => {
      fetchServiceTypes()
      if (formData.value.international_operations) {
        fetchGlobalServiceTypes()
      }
    }, 100)
  }
})

// Watch main form fields to auto-update Global COI Form when international_operations is enabled. flush: 'post' to avoid recursive updates.
watch([
  () => formData.value.client_name,
  () => formData.value.parent_company,
  () => formData.value.client_location,
  () => formData.value.relationship_with_client,
  () => formData.value.pie_status,
  () => formData.value.service_description,
  () => formData.value.service_type,
  () => formData.value.country_code,
  () => formData.value.foreign_subsidiaries
], () => {
  if (formData.value.international_operations) {
    populateGlobalCOIForm()
  }
}, { flush: 'post' })

// Fetch lead sources for proposals (CRM feature)
async function fetchLeadSources() {
  try {
    const response = await api.get('/prospects/lead-sources')
    leadSources.value = response.data
  } catch {
    // Don't block form - lead source is optional
  }
}

// Load critical form data (clients, entities, service types). Sets formLoadError on failure.
async function loadFormData() {
  formLoadError.value = null
  let criticalFailures = 0

  // Ensure Entity and Location dropdowns have options immediately (avoid empty while API loads)
  if (!entities.value?.length) entities.value = [...FALLBACK_ENTITIES]
  if (!countries.value?.length) countries.value = [...FALLBACK_COUNTRIES]

  try {
    await fetchClients()
  } catch {
    criticalFailures++
  }

  try {
    await Promise.all([fetchEntities(), fetchCountries()])
  } catch {
    criticalFailures++
  }

  if (formData.value.entity) {
    try {
      await fetchServiceTypes()
    } catch {
      criticalFailures++
    }
  }

  if (criticalFailures === 3) {
    formLoadError.value = 'Failed to load form data. Please check your connection and retry.'
  }

  // Non-critical fetches – best effort
  try { await fetchProspects() } catch { /* optional */ }
  try { await fetchLeadSources() } catch { /* optional */ }
  try { await fetchDirectorName() } catch { /* optional */ }
  try {
    const approversRes = await api.get('/coi/approvers')
    approverUsers.value = approversRes.data || []
  } catch { /* optional */ }

  // Ensure Entity and Countries dropdowns always have options (fallback if API failed)
  if (entities.value.length === 0) {
    entities.value = [...FALLBACK_ENTITIES]
    if (!formData.value.entity && entities.value.length > 0) {
      const defaultEntity = entities.value.find((e: any) => e.is_default) || entities.value[0]
      nextTick(() => {
        formData.value.entity = defaultEntity.entity_name
        onEntityChange()
      })
    }
  }
  // When we have entities but no selection (e.g. fallback set entities but didn't default), default entity and load Line of Service
  if (entities.value.length > 0 && !formData.value.entity) {
    const defaultEntity = entities.value.find((e: any) => e.is_default) || entities.value[0]
    nextTick(() => {
      formData.value.entity = defaultEntity.entity_name
      onEntityChange()
    })
  }
  if (countries.value.length === 0) {
    countries.value = [...FALLBACK_COUNTRIES]
  }
}

function retryFormLoad() {
  loadFormData()
}

// Lifecycle
onMounted(async () => {
  // Ensure Location and Entity dropdowns have options on first paint (synchronous, before any async).
  if (!entities.value?.length) entities.value = [...FALLBACK_ENTITIES]
  if (!countries.value?.length) countries.value = [...FALLBACK_COUNTRIES]
  await fetchAmbiguousServiceConfig()
  await loadFormData()
  
  // Check if editing existing draft
  const editRequestData = localStorage.getItem('coi-edit-request')
  if (editRequestData) {
    try {
      const request = JSON.parse(editRequestData)
      formData.value = {
        id: request.id,
        requestor_name: request.requester_name || request.requestor_name || authStore.user?.name || '',
        designation: request.designation || '',
        entity: request.entity || 'BDO Al Nisf & Partners',
        line_of_service: request.line_of_service || request.department || authStore.user?.department || '',
        requested_document: request.requested_document || 'Proposal',
        language: request.language || 'English',
        client_id: request.client_id || null,
        client_name: request.client_name || '',
        client_type: request.client_type || '',
        client_location: request.client_location || 'State of Kuwait',
        relationship_with_client: request.relationship_with_client || '',
        regulated_body: request.regulated_body || '',
        client_status: request.client_status || '',
        pie_status: request.pie_status || 'No',
        group_structure: request.group_structure || '',
        parent_company: request.parent_company || '',
        service_type: request.service_type || '',
        service_type_cma_code: request.service_type_cma_code ?? undefined,
        service_category: request.service_category || '',
        service_sub_category: request.service_sub_category || '',
        global_service_category: request.global_service_category || '',
        global_service_type: request.global_service_type || '',
        service_description: request.service_description || '',
        requested_service_period_start: request.requested_service_period_start || '',
        requested_service_period_end: request.requested_service_period_end || '',
        external_deadline: request.external_deadline || '',
        deadline_reason: request.deadline_reason || '',
        full_ownership_structure: request.full_ownership_structure || '',
        related_affiliated_entities: request.related_affiliated_entities || '',
        international_operations: request.international_operations === 1 || request.international_operations === true || false,
        foreign_subsidiaries: request.foreign_subsidiaries || '',
        global_clearance_status: request.global_clearance_status || 'Not Required',
        backup_approver_id: request.backup_approver_id || null,
        lead_source_id: request.lead_source_id || null
      }
      isDirty.value = false
      ownershipRows.value = parseOwnershipRowsFromText(formData.value.full_ownership_structure)
      onClientSelect()
      localStorage.removeItem('coi-edit-request')
      info('Draft loaded for editing')
      if (formData.value.international_operations && formData.value.entity) {
        try {
          await fetchGlobalServiceTypes()
        } catch { /* non-critical */ }
      }
    } catch {
      showError('Failed to load draft data')
    }
  } else {
    const hasSavedData = loadFromLocalStorage()
    if (hasSavedData) {
      isDirty.value = false
      ownershipRows.value = parseOwnershipRowsFromText(formData.value.full_ownership_structure)
      onClientSelect()
      info('Restored previous draft')
      if (formData.value.international_operations && formData.value.entity) {
        try {
          await fetchGlobalServiceTypes()
        } catch { /* non-critical */ }
      }
    } else {
      applyRouteQueryClientPrefill()
    }
  }
  
  startAutoSave()
  setupIntersectionObserver()
  beforeUnloadHandler = (e: BeforeUnloadEvent) => {
    if (isDirty.value) e.preventDefault()
  }
  window.addEventListener('beforeunload', beforeUnloadHandler)
})

onBeforeRouteLeave((_to, _from, next) => {
  if (!isDirty.value) {
    next()
    return
  }
  pendingLeaveNext = next
  showLeaveConfirm.value = true
  next(false)
})

function confirmLeave(leave: boolean) {
  if (pendingLeaveNext) {
    pendingLeaveNext(leave)
    pendingLeaveNext = null
  }
  showLeaveConfirm.value = false
}

let beforeUnloadHandler: ((e: BeforeUnloadEvent) => void) | null = null

onUnmounted(() => {
  stopAutoSave()
  if (beforeUnloadHandler) {
    window.removeEventListener('beforeunload', beforeUnloadHandler)
  }
  if (observer) {
    observer.disconnect()
  }
})

// Watch for form changes (mark dirty and persist). flush: 'post' + debounce to avoid recursive updates.
let formDataWatchTimeout: number | null = null
watch(formData, () => {
  isDirty.value = true
  if (formDataWatchTimeout) clearTimeout(formDataWatchTimeout)
  formDataWatchTimeout = window.setTimeout(() => {
    formDataWatchTimeout = null
    saveToLocalStorage()
    scheduleServerAutoSave()
  }, 150)
}, { deep: true, flush: 'post' })
</script>

<style scoped>
.scroll-mt-6 {
  scroll-margin-top: 1.5rem;
}
</style>
