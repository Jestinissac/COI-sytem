<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Top Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">New COI Request</h1>
            <p class="text-sm text-gray-500 mt-1">{{ formData.id ? `Editing Draft: COI-${formData.id}` : 'Create a new conflict of interest request' }}</p>
          </div>
          <div class="flex items-center space-x-3">
            <span class="text-sm text-gray-500">Auto-saved</span>
            <span class="w-2 h-2 bg-green-500 rounded-full"></span>
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
                  This request requires director approval. 
                  <span v-if="directorName">Your director: <strong>{{ directorName }}</strong>.</span>
                  You can upload director's written approval document (optional) or wait for in-system approval.
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
                <p class="text-sm text-green-700">
                  As a director, your requests go directly to Compliance review after submission.
                </p>
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
                  <p class="text-sm text-gray-500">Auto-populated from your profile</p>
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
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Entity <span class="text-red-500">*</span></label>
                  <select 
                    v-model="formData.entity"
                    @change="onEntityChange"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select entity...</option>
                    <option v-for="entity in entities" :key="entity.id" :value="entity.entity_name">
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
                  <p class="text-sm text-gray-500">Select the type of document</p>
                </div>
              </div>
              <span v-if="isSectionComplete('section-2')" class="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Complete</span>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-2 gap-4 mb-6">
                <label 
                  class="relative flex items-center p-4 border rounded cursor-pointer transition-colors"
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
                      <p class="text-xs text-gray-500">For new client engagements</p>
                    </div>
                  </div>
                  <div v-if="formData.requested_document === 'Proposal'" class="absolute top-2 right-2">
                    <svg class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                </label>
                <label 
                  class="relative flex items-center p-4 border rounded cursor-pointer transition-colors"
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
                      <p class="text-xs text-gray-500">For confirmed engagements</p>
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
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">
                    Lead Source
                    <span class="text-xs font-normal text-gray-500 ml-1">(How did this opportunity come to you?)</span>
                  </label>
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
                        {{ source.source_name }}
                      </option>
                    </optgroup>
                    <optgroup label="System">
                      <option 
                        v-for="source in leadSourcesByCategory.system" 
                        :key="source.id" 
                        :value="source.id"
                      >
                        {{ source.source_name }}
                      </option>
                    </optgroup>
                    <optgroup label="Outbound">
                      <option 
                        v-for="source in leadSourcesByCategory.outbound" 
                        :key="source.id" 
                        :value="source.id"
                      >
                        {{ source.source_name }}
                      </option>
                    </optgroup>
                    <optgroup label="Other">
                      <option 
                        v-for="source in leadSourcesByCategory.other" 
                        :key="source.id" 
                        :value="source.id"
                      >
                        {{ source.source_name }}
                      </option>
                    </optgroup>
                  </select>
                  <p class="text-xs text-gray-500 mt-1">
                    <span v-if="isPartnerOrDirector" class="text-green-600">
                      Will auto-set to "Internal Referral" if not selected
                    </span>
                    <span v-else>
                      Optional - helps track marketing effectiveness
                    </span>
                  </p>
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
                  <p class="text-sm text-gray-500">Select or request a new client</p>
                </div>
              </div>
              <span v-if="isSectionComplete('section-3')" class="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Complete</span>
            </div>
            <div class="p-6">
              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Select Client or Prospect <span class="text-red-500">*</span></label>
                  <div class="flex gap-3">
                    <select 
                      v-model="smartSelectValue"
                      @change="onSmartSelect"
                      class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Search or select...</option>
                      
                      <!-- PRMS Clients Section -->
                      <optgroup label="PRMS Clients">
                        <option v-for="client in clients" :key="'c-'+client.id" :value="'client:'+client.id">
                          {{ client.client_name || client.name }} ({{ client.client_code || client.code || '' }})
                        </option>
                      </optgroup>
                      
                      <!-- Prospects Section (CRM) -->
                      <optgroup v-if="prospects.length > 0" label="Prospects (CRM)">
                        <option v-for="prospect in prospects" :key="'p-'+prospect.id" :value="'prospect:'+prospect.id">
                          {{ prospect.prospect_name }} [Prospect]
                        </option>
                      </optgroup>
                      
                      <!-- Create New Option -->
                      <optgroup label="New">
                        <option value="new:prospect">+ Create New Prospect</option>
                      </optgroup>
                    </select>
                  </div>
                  <!-- Selection indicator -->
                  <p v-if="selectedEntityType === 'prospect'" class="mt-1.5 text-xs text-blue-600">
                    Using prospect from CRM. A COI request will be linked to this prospect.
                  </p>
                </div>
                
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Client Code</label>
                    <input
                      v-model="selectedClientCode"
                      type="text"
                      readonly
                      class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 text-sm"
                      placeholder="-"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Client Type</label>
                    <select 
                      v-model="formData.client_type"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select...</option>
                      <option>W.L.L.</option>
                      <option>W.L.L. Holding</option>
                      <option>K.S.C.C.</option>
                      <option>K.S.C.C. (Holding)</option>
                      <option>K.S.C.P.</option>
                      <option>K.S.C.P. (Holding)</option>
                      <option>S.C.P. (Holding)</option>
                      <option>S.P.C.</option>
                      <option>S.P.C. Holding</option>
                      <option>Portfolio</option>
                      <option>Fund</option>
                      <option>Scheme</option>
                      <option>Joint Venture Company</option>
                      <option>Solidarity Company</option>
                      <option>Simple Rec. Company</option>
                      <option>Shares Rec. Company</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Regulated By</label>
                    <select 
                      v-model="formData.regulated_body"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select...</option>
                      <option>MOCI</option>
                      <option>MOCI & CMA</option>
                      <option>MOCI & CBK</option>
                      <option>MOCI, CMA & CBK</option>
                      <option>MOCI & Boursa</option>
                      <option>Governmental Authority</option>
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <select 
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
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                    <select 
                      v-model="formData.client_location"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select...</option>
                      <option>State of Kuwait</option>
                      <option>Other Country</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Relationship</label>
                    <select 
                      v-model="formData.relationship_with_client"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select...</option>
                      <option>New Client</option>
                      <option>Current Client</option>
                      <option>Potential Client</option>
                      <option>Old Client</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">PIE Status</label>
                  <div class="flex items-center space-x-6">
                    <label class="flex items-center">
                      <input type="radio" v-model="formData.pie_status" value="Yes" class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"/>
                      <span class="ml-2 text-sm text-gray-700">Yes - PIE</span>
                    </label>
                    <label class="flex items-center">
                      <input type="radio" v-model="formData.pie_status" value="No" class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"/>
                      <span class="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>

                <!-- Group Structure Verification (Required for PIE/Audit) -->
                <div v-if="showGroupStructureSection" class="col-span-2">
                  <div class="border border-blue-200 bg-blue-50 rounded-lg p-4">
                    <label class="block text-sm font-semibold text-gray-900 mb-2">
                      Corporate Group Structure
                      <span class="text-red-500">*</span>
                    </label>
                    <p class="text-xs text-gray-600 mb-3">
                      Does this client belong to a larger corporate group or holding company?
                    </p>
                    
                    <div class="space-y-2">
                      <label class="flex items-center p-3 bg-white border rounded cursor-pointer transition-colors"
                             :class="formData.group_structure === 'standalone' ? 'border-gray-300 bg-gray-50' : 'border-gray-200 hover:border-gray-300'">
                        <input type="radio" v-model="formData.group_structure" value="standalone" 
                               class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"/>
                        <div class="ml-3">
                          <span class="text-sm font-medium text-gray-900">Standalone Entity</span>
                          <p class="text-xs text-gray-500">Not part of a larger group</p>
                        </div>
                      </label>
                      
                      <label class="flex items-center p-3 bg-white border rounded cursor-pointer transition-colors"
                             :class="formData.group_structure === 'has_parent' ? 'border-gray-300 bg-gray-50' : 'border-gray-200 hover:border-gray-300'">
                        <input type="radio" v-model="formData.group_structure" value="has_parent" 
                               class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"/>
                        <div class="ml-3">
                          <span class="text-sm font-medium text-gray-900">Part of Corporate Group</span>
                          <p class="text-xs text-gray-500">This entity has a parent or holding company</p>
                        </div>
                      </label>
                      
                      <label class="flex items-center p-3 bg-white border-2 border-amber-200 rounded-lg cursor-pointer transition-all"
                             :class="formData.group_structure === 'research_required' ? 'border-amber-500 bg-amber-50' : 'hover:border-amber-300'">
                        <input type="radio" v-model="formData.group_structure" value="research_required" 
                               class="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"/>
                        <div class="ml-3 flex-1">
                          <span class="text-sm font-medium text-gray-900">Not Sure</span>
                          <p class="text-xs text-gray-500">Compliance will verify during review</p>
                        </div>
                        <span class="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded">May delay approval</span>
                      </label>
                    </div>
                    
                    <!-- Parent Company Input (shown when has_parent selected) -->
                    <div v-if="formData.group_structure === 'has_parent'" class="mt-4 pt-4 border-t border-blue-200">
                      <label class="block text-sm font-medium text-gray-700 mb-1.5">
                        Parent Company Name <span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="formData.parent_company"
                        type="text"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., ABC Holdings, XYZ Group Ltd..."
                        required
                      />
                      <p class="text-xs text-gray-500 mt-1">Enter the name of the immediate parent or holding company</p>
                    </div>
                  </div>
                </div>

                <!-- Simple Parent Company field (for non-PIE/non-Audit) -->
                <div v-else class="space-y-4">
                  <!-- Company Type -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">
                      Company Type
                      <span class="text-gray-400 font-normal text-xs ml-1">(Industry Standard Classification)</span>
                    </label>
                    <select
                      v-model="formData.company_type"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      @change="onCompanyTypeChange"
                    >
                      <option value="">Select company type...</option>
                      <option value="Standalone">Standalone (Independent Entity)</option>
                      <option value="Subsidiary">Subsidiary (≥50% owned by parent)</option>
                      <option value="Affiliate">Affiliate (20-50% owned, significant influence)</option>
                      <option value="Sister">Sister Company (Shares same parent)</option>
                      <option value="Parent">Parent Company (Controls subsidiaries)</option>
                    </select>
                    <p v-if="formData.company_type" class="text-xs text-gray-500 mt-1">
                      <span v-if="formData.company_type === 'Subsidiary'">
                        Requires parent company with ≥50% ownership
                      </span>
                      <span v-else-if="formData.company_type === 'Affiliate'">
                        Requires parent company with 20-50% ownership (significant influence)
                      </span>
                      <span v-else-if="formData.company_type === 'Sister'">
                        Requires parent company (both entities share same parent)
                      </span>
                      <span v-else-if="formData.company_type === 'Standalone'">
                        Independent entity with no parent company
                      </span>
                      <span v-else-if="formData.company_type === 'Parent'">
                        This entity controls subsidiaries
                      </span>
                    </p>
                  </div>

                  <!-- Parent Company (shown when needed) -->
                  <div v-if="formData.company_type && formData.company_type !== 'Standalone' && formData.company_type !== 'Parent'">
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">
                      Parent Company
                      <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="formData.parent_company"
                      type="text"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter parent company name..."
                      :required="formData.company_type !== 'Standalone'"
                    />
                    <p class="text-xs text-gray-500 mt-1">Name of the controlling parent entity</p>
                  </div>

                  <!-- Ownership Percentage (for Subsidiary/Affiliate) -->
                  <div v-if="formData.company_type === 'Subsidiary' || formData.company_type === 'Affiliate'">
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">
                      Ownership Percentage (%)
                      <span class="text-gray-400 font-normal text-xs ml-1">(Industry Standard: ≥50% = Subsidiary, 20-50% = Affiliate)</span>
                    </label>
                    <input
                      v-model.number="formData.ownership_percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 75.5"
                    />
                    <p class="text-xs text-gray-500 mt-1">
                      <span v-if="formData.company_type === 'Subsidiary'">
                        Must be ≥50% for control (Subsidiary)
                      </span>
                      <span v-else>
                        Must be 20-50% for significant influence (Affiliate)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Section 4: Service Information -->
          <section id="section-4" class="bg-white rounded-lg shadow-sm border border-gray-200 scroll-mt-6">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div class="flex items-center">
                <span class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium mr-3">4</span>
                <div>
                  <h2 class="text-base font-semibold text-gray-900">Service Information</h2>
                  <p class="text-sm text-gray-500">Details about the requested service</p>
                </div>
              </div>
              <span v-if="isSectionComplete('section-4')" class="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Complete</span>
            </div>
            <div class="p-6 space-y-6">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Service Category <span class="text-red-500">*</span></label>
                  <select 
                    v-model="formData.service_category"
                    @change="onServiceCategoryChange"
                    :disabled="loadingServices || !formData.entity"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="">{{ loadingServices ? 'Loading services...' : (formData.entity ? 'Select category...' : 'Select entity first') }}</option>
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
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Service Type <span class="text-red-500">*</span></label>
                  <select 
                    v-model="formData.service_type"
                    @change="onServiceTypeChange"
                    :disabled="loadingServices || !formData.entity || !formData.service_category"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="">{{ formData.service_category ? 'Select service type...' : 'Select category first' }}</option>
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

              <!-- Sub-category (shown for Business/Asset Valuation with 3 radio options) -->
              <div v-if="availableSubCategories.length > 0" class="space-y-3">
                <label class="block text-sm font-medium text-gray-700 mb-2">Service Sub-Category <span class="text-red-500">*</span></label>
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
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the services to be provided..."
                ></textarea>
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
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <!-- External Deadline (Priority Scoring) -->
              <div class="border-t border-gray-200 pt-6 mt-4">
                <div class="flex items-start gap-3 mb-4">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-medium text-gray-900">External Deadline</h3>
                    <p class="text-xs text-gray-500">If this request has an external deadline (e.g., regulatory filing, client commitment), specify it here. This helps prioritize the request appropriately.</p>
                  </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Deadline Date</label>
                    <input
                      v-model="formData.external_deadline"
                      type="date"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Reason for Deadline</label>
                    <select
                      v-model="formData.deadline_reason"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">None / No external deadline</option>
                      <option value="Regulatory Filing">Regulatory Filing</option>
                      <option value="Client Board Meeting">Client Board Meeting</option>
                      <option value="AGM/Shareholder Meeting">AGM/Shareholder Meeting</option>
                      <option value="Statutory Requirement">Statutory Requirement</option>
                      <option value="Client Contract">Client Contract Commitment</option>
                      <option value="Tender/Bid Deadline">Tender/Bid Deadline</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <p v-if="formData.external_deadline" class="mt-2 text-xs text-amber-600">
                  <svg class="inline-block w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  External deadline will be factored into request prioritization.
                </p>
              </div>
            </div>
          </section>

          <!-- Section 5: Ownership Structure -->
          <section id="section-5" class="bg-white rounded-lg shadow-sm border border-gray-200 scroll-mt-6">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div class="flex items-center">
                <span class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium mr-3">5</span>
                <div>
                  <h2 class="text-base font-semibold text-gray-900">Ownership Structure</h2>
                  <p class="text-sm text-gray-500">Client ownership and related entities</p>
                </div>
              </div>
              <span v-if="isSectionComplete('section-5')" class="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Complete</span>
            </div>
            <div class="p-6 space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Full Ownership Structure</label>
                <textarea
                  v-model="formData.full_ownership_structure"
                  rows="4"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the ownership structure including shareholders and percentages..."
                ></textarea>
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
                  <p class="text-sm text-gray-500">Authorized signatories for the engagement</p>
                </div>
              </div>
              <span v-if="isSectionComplete('section-6')" class="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Complete</span>
            </div>
            <div class="p-6">
              <div class="bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm">
                <svg class="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <p>Signatories will be assigned during the approval process</p>
                <p class="text-xs mt-1">Based on the service type and client requirements</p>
              </div>
            </div>
          </section>

          <!-- Section 7: International Operations -->
          <section id="section-7" class="bg-white rounded-lg shadow-sm border border-gray-200 scroll-mt-6">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div class="flex items-center">
                <span class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium mr-3">7</span>
                <div>
                  <h2 class="text-base font-semibold text-gray-900">International Operations</h2>
                  <p class="text-sm text-gray-500">Cross-border and global clearance requirements</p>
                </div>
              </div>
              <span v-if="isSectionComplete('section-7')" class="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Complete</span>
            </div>
            <div class="p-6 space-y-6">
              <div>
                <label class="flex items-center">
                  <input 
                    type="checkbox" 
                    v-model="formData.international_operations"
                    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span class="ml-2 text-sm text-gray-700">Client has international operations</span>
                </label>
                <p class="mt-2 text-xs text-gray-500 ml-6">
                  If checked, you'll need to complete the Global COI Form below for submission to BDO Global COI Portal.
                </p>
              </div>

              <!-- Global COI Form Card (shown when international_operations is true) -->
              <div v-if="formData.international_operations" class="mt-6">
                <InternationalOperationsForm
                  :request-id="formData.id"
                  :initial-data="globalCOIFormData"
                  :countries="countries"
                  @update:data="handleGlobalCOIFormUpdate"
                />
              </div>
            </div>
          </section>

          <!-- Section 8: Director Approval Document (Team Members Only) -->
          <section v-if="isTeamMember" id="section-8" class="bg-white rounded-lg shadow-sm border border-gray-200 scroll-mt-6">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div class="flex items-center">
                <span class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium mr-3">8</span>
                <div>
                  <h2 class="text-base font-semibold text-gray-900">Director Approval Document</h2>
                  <p class="text-sm text-gray-500">Upload director's written approval (optional)</p>
                </div>
              </div>
            </div>
            <div class="p-6">
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p class="text-sm text-blue-700">
                  <strong>Note:</strong> If you have director's written approval document, you can upload it here. 
                  Alternatively, your director can approve this request in-system after submission.
                </p>
              </div>
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
      message="Are you sure you want to submit this COI request? Once submitted, it will be sent for approval."
      confirm-text="Submit Request"
      cancel-text="Review Again"
      type="success"
      icon="✓"
      @confirm="handleSubmit"
      @close="showConfirmModal = false"
    />
    
    <!-- Duplicate Justification Modal -->
    <div v-if="showJustificationModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900">Duplicate Detected</h3>
          </div>
        </div>
        
        <div class="p-6 space-y-4">
          <p class="text-sm text-gray-600">
            A proposal or engagement already exists for this client/service combination. 
            To proceed, please provide a business justification.
          </p>
          
          <!-- Show detected duplicates -->
          <div v-if="detectedDuplicates.length > 0" class="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p class="text-sm font-medium text-amber-800 mb-2">Existing records found:</p>
            <ul class="text-sm text-amber-700 space-y-1">
              <li v-for="(dup, idx) in detectedDuplicates" :key="idx" class="flex items-start gap-2">
                <span class="text-amber-500">•</span>
                <span>{{ dup.client_name || dup.entity_name }} - {{ dup.service_type || dup.type }} ({{ dup.status }})</span>
              </li>
            </ul>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Business Justification <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="duplicateJustification"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Explain why this submission should proceed despite the existing record..."
            ></textarea>
            <p class="mt-1 text-xs text-gray-500">
              This justification will be reviewed by Compliance and attached to the request.
            </p>
          </div>
        </div>
        
        <div class="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            @click="showJustificationModal = false; duplicateJustification = ''"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            @click="submitWithJustification"
            :disabled="!duplicateJustification.trim() || loading"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <span v-if="loading">Submitting...</span>
            <span v-else>Submit with Justification</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Create Prospect Modal (Smart Suggest) -->
  <div v-if="showCreateProspectModal" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="showCreateProspectModal = false"></div>
      
      <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto z-10">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Create New Prospect</h3>
          <p class="mt-1 text-sm text-gray-500">Add a new prospect to the CRM. This prospect will be automatically selected for your COI request.</p>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Prospect Name <span class="text-red-500">*</span></label>
            <input
              v-model="newProspect.prospect_name"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter prospect name"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
            <select
              v-model="newProspect.industry"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select industry...</option>
              <option value="Financial Services">Financial Services</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Technology">Technology</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Retail">Retail</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Energy">Energy</option>
              <option value="Government">Government</option>
              <option value="Education">Education</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Commercial Registration</label>
            <input
              v-model="newProspect.commercial_registration"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional"
            />
          </div>
        </div>
        
        <div class="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            @click="showCreateProspectModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            @click="createAndSelectProspect"
            :disabled="!newProspect.prospect_name.trim() || creatingProspect"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <span v-if="creatingProspect">Creating...</span>
            <span v-else>Create & Select</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useCOIRequestsStore } from '@/stores/coiRequests'
import { useAuthStore } from '@/stores/auth'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import FileUpload from '@/components/FileUpload.vue'
import InternationalOperationsForm from '@/components/coi/InternationalOperationsForm.vue'
import api from '@/services/api'

const router = useRouter()
const coiStore = useCOIRequestsStore()
const authStore = useAuthStore()
const { success, error: showError, warning, info } = useToast()

const loading = ref(false)
const showConfirmModal = ref(false)
const activeSection = ref('section-1')
const totalSteps = 7

const clients = ref<any[]>([])
const prospects = ref<any[]>([]) // Prospects from CRM for Smart Suggest
const selectedClientCode = ref('')
const directorName = ref('')
const allUsers = ref<any[]>([])
const entities = ref<any[]>([])
const serviceTypes = ref<any[]>([])
const countries = ref<any[]>([])
const serviceSubCategories = ref<any>({}) // Store sub-categories by service type
const loadingServices = ref(false)
const leadSources = ref<any[]>([]) // Lead sources for proposals

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

// Get services filtered by selected category
const filteredServicesByCategory = computed(() => {
  if (!formData.value.service_category || !serviceTypes.value.length) {
    return []
  }
  const selectedCategory = serviceTypes.value.find((cat: any) => cat.category === formData.value.service_category)
  if (!selectedCategory) {
    return []
  }
  return selectedCategory.services || []
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
  service_category: '',
  service_sub_category: '',
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
                formData.value.relationship_with_client === 'Potential Client' ? 'Potential' : 
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
  
  // Update globalCOIFormData
  globalCOIFormData.value = mappedData
  formData.value.global_coi_form_data = mappedData
  
  console.log('[Frontend] Auto-populated Global COI Form from main form data:', mappedData)
}

const sections = [
  { id: 'section-1', number: 1, label: 'Requestor Info' },
  { id: 'section-2', number: 2, label: 'Document Type' },
  { id: 'section-3', number: 3, label: 'Client Details' },
  { id: 'section-4', number: 4, label: 'Service Info' },
  { id: 'section-5', number: 5, label: 'Ownership' },
  { id: 'section-6', number: 6, label: 'Signatories' },
  { id: 'section-7', number: 7, label: 'International' }
]

// Check if a section is complete
function isSectionComplete(sectionId: string): boolean {
  switch (sectionId) {
    case 'section-1':
      return !!(formData.value.designation && formData.value.entity)
    case 'section-2':
      return !!(formData.value.requested_document)
    case 'section-3':
      return !!(formData.value.client_id)
    case 'section-4':
      return !!(formData.value.service_type && formData.value.service_description)
    case 'section-5':
      return true // Optional section
    case 'section-6':
      return true // Auto-assigned
    case 'section-7':
      return true // Optional section
    default:
      return false
  }
}

const completedSectionsCount = computed(() => {
  return sections.filter(s => isSectionComplete(s.id)).length
})

const isFormValid = computed(() => {
  return isSectionComplete('section-1') && 
         isSectionComplete('section-2') && 
         isSectionComplete('section-3') && 
         isSectionComplete('section-4')
})

// Determines if the group structure verification section should be shown
// Required for PIE clients and Audit engagements (IESBA 290.13)
const showGroupStructureSection = computed(() => {
  return formData.pie_status === 'Yes' || isAuditServiceType(formData.service_type)
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
    // PRMS Client selected
    const clientId = parseInt(id)
    const client = clients.value.find(c => c.id === clientId)
    if (client) {
      formData.value.client_id = clientId
      selectedClientCode.value = client.client_code || client.code || ''
      formData.value.client_name = client.client_name || client.name || ''
      selectedEntityType.value = 'client'
      selectedProspectId.value = null
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

// Legacy function for backward compatibility
function onClientSelect() {
  const client = clients.value.find(c => c.id === formData.value.client_id)
  if (client) {
    selectedClientCode.value = client.client_code || client.code || ''
    formData.value.client_name = client.client_name || client.name || ''
  } else {
    selectedClientCode.value = ''
    formData.value.client_name = ''
  }
}

// Fetch clients
async function fetchClients() {
  try {
    console.log('[Frontend] Fetching clients...')
    const response = await api.get('/integration/clients')
    clients.value = response.data || []
    console.log('[Frontend] Clients fetched:', clients.value.length, 'clients')
    if (clients.value.length === 0) {
      console.warn('[Frontend] No clients returned from API')
    }
  } catch (err: any) {
    console.error('Failed to fetch clients:', err)
    console.error('Error response:', err.response?.data)
    console.error('Error status:', err.response?.status)
    clients.value = []
  }
}

// Fetch prospects for Smart Suggest dropdown
async function fetchProspects() {
  try {
    console.log('[Frontend] Fetching prospects for dropdown...')
    const response = await api.get('/prospects/dropdown')
    prospects.value = response.data || []
    console.log('[Frontend] Prospects fetched:', prospects.value.length, 'prospects')
  } catch (err: any) {
    console.error('Failed to fetch prospects:', err)
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
    console.log('[Frontend] Created prospect:', createdProspect)
    
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
    console.error('Failed to create prospect:', err)
    showError(err.response?.data?.error || 'Failed to create prospect')
  } finally {
    creatingProspect.value = false
  }
}

// Fetch entity codes
async function fetchEntities() {
  try {
    const response = await api.get('/entity-codes')
    entities.value = response.data.filter((e: any) => e.is_active)
    
    // Set default entity if none selected
    if (!formData.entity && entities.value.length > 0) {
      const defaultEntity = entities.value.find((e: any) => e.is_default) || entities.value[0]
      formData.entity = defaultEntity.entity_name
      onEntityChange()
    }
  } catch (err) {
    console.error('Failed to fetch entities:', err)
  }
}

// Fetch countries (master data)
async function fetchCountries() {
  try {
    const response = await api.get('/countries')
    countries.value = response.data
  } catch (err) {
    console.error('Failed to fetch countries:', err)
  }
}

// Fetch service types filtered by entity
async function fetchServiceTypes() {
  console.log('[Frontend] fetchServiceTypes called, entity:', formData.value.entity)
  if (!formData.value.entity) {
    console.log('[Frontend] No entity, returning early')
    serviceTypes.value = []
    serviceSubCategories.value = {}
    return
  }
  
  loadingServices.value = true
  console.log('[Frontend] Starting API call...')
  console.log('[Frontend] formData.value.entity:', formData.value.entity)
  console.log('[Frontend] entities.value:', entities.value)
  try {
    // Find entity code - try to match by entity_name first
    let entityCode = entities.value.find((e: any) => e.entity_name === formData.value.entity)?.entity_code
    
    // If not found, try to find by exact match or partial match
    if (!entityCode && entities.value.length > 0) {
      // Try first entity as fallback
      entityCode = entities.value[0]?.entity_code
      console.log('[Frontend] Using fallback entity code:', entityCode)
    }
    
    const params: any = {}
    
    if (entityCode) {
      params.entity = entityCode
      console.log('[Frontend] Using entity code:', entityCode)
    } else {
      console.warn('[Frontend] No entity code found, calling API without entity param')
    }
    
    // Use Kuwait list by default (39 services), only use global list if international_operations is true
    // This ensures Kuwait list is used for regular requests
    if (formData.value.international_operations) {
      params.international = 'true'
    } else {
      // Explicitly set to false to ensure Kuwait list is returned
      params.international = 'false'
    }
    
    console.log('[Frontend] API params:', params)
    console.log('[Frontend] international_operations value:', formData.value.international_operations)
    const response = await api.get('/integration/service-types', { params })
    console.log('[Frontend] Service types response:', response.data)
    console.log('[Frontend] Service types array:', response.data?.serviceTypes)
    console.log('[Frontend] Service types length:', response.data?.serviceTypes?.length)
    console.log('[Frontend] Categories:', response.data?.serviceTypes?.map((c: any) => c.category))
    serviceTypes.value = response.data.serviceTypes || []
    serviceSubCategories.value = response.data.subCategories || {}
    console.log('[Frontend] serviceTypes.value after assignment:', serviceTypes.value.length)
  } catch (err: any) {
    console.error('Failed to fetch service types:', err)
    console.error('Error response:', err.response)
    console.error('Error data:', err.response?.data)
    console.error('Error status:', err.response?.status)
    console.error('Error message:', err.message)
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

// Handle service type change
function onServiceTypeChange() {
  // Auto-populate category from the selected service type if not already set
  if (formData.value.service_type && !formData.value.service_category) {
    const serviceCategory = serviceTypes.value.find((cat: any) => 
      cat.services.some((s: any) => (s.value || s) === formData.value.service_type)
    )
    if (serviceCategory) {
      formData.value.service_category = serviceCategory.category
    }
  }
  
  // Clear sub-category when service type changes
  formData.value.service_sub_category = ''
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
}

function saveToLocalStorage() {
  localStorage.setItem('coi-wizard-data', JSON.stringify(formData.value))
}

function loadFromLocalStorage(): boolean {
  const saved = localStorage.getItem('coi-wizard-data')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      // Force international_operations to false by default (for Kuwait list)
      // Only keep it true if user explicitly checked the checkbox
      parsed.international_operations = false
      formData.value = { ...formData.value, ...parsed }
      console.log('[Frontend] Loaded from localStorage, set international_operations to false')
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

// Handle save draft
async function handleSaveDraft() {
  loading.value = true
  try {
    await coiStore.createRequest(formData.value)
    success('Draft saved successfully')
    saveToLocalStorage()
    router.push('/coi/requester')
  } catch (err: any) {
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
    const result = await coiStore.createRequest(formData.value)
    pendingRequestId.value = result.id
    
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
      result.id, 
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
    } catch (error) {
      console.error('Failed to fetch director name:', error)
    }
  }
}

function handleFileUploaded() {
  success('File uploaded successfully!')
}

function handleFileError(error: string) {
  showError(error)
}

// Watch international_operations to refetch services and populate Global COI Form
watch(() => formData.value.international_operations, (newValue) => {
  if (formData.value.entity) {
    fetchServiceTypes()
  }
  
  // When international_operations is checked, auto-populate Global COI Form
  if (newValue) {
    populateGlobalCOIForm()
  }
})

// Watch entity to fetch service types when entity is selected or changes
watch(() => formData.value.entity, (newEntity, oldEntity) => {
  if (newEntity && newEntity !== oldEntity) {
    console.log('[Frontend] Entity changed to:', newEntity, 'fetching service types...')
    // Small delay to ensure entities list is loaded
    setTimeout(() => {
      fetchServiceTypes()
    }, 100)
  }
})

// Watch main form fields to auto-update Global COI Form when international_operations is enabled
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
  // Only auto-update if international_operations is enabled
  if (formData.value.international_operations) {
    populateGlobalCOIForm()
  }
}, { deep: true })

// Watch main form fields to auto-update Global COI Form when international_operations is enabled
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
  // Only auto-update if international_operations is enabled
  if (formData.value.international_operations) {
    populateGlobalCOIForm()
  }
}, { deep: true })

// Fetch lead sources for proposals (CRM feature)
async function fetchLeadSources() {
  try {
    const response = await api.get('/prospects/lead-sources')
    leadSources.value = response.data
    console.log('[Frontend] Loaded lead sources:', leadSources.value.length)
  } catch (e) {
    console.error('Failed to fetch lead sources:', e)
    // Don't block form - lead source is optional
  }
}

// Lifecycle
onMounted(async () => {
  console.log('[Frontend] onMounted called, formData.value.entity:', formData.value.entity)
  
  try {
    await fetchClients()
    await fetchProspects() // Smart Suggest: Load prospects from CRM
    await fetchCountries()
    await fetchLeadSources()
  } catch (e) {
    console.error('Failed to fetch clients:', e)
  }
  
  try {
    await fetchEntities()
  } catch (e) {
    console.error('Failed to fetch entities:', e)
  }
  
  try {
    await fetchDirectorName()
  } catch (e) {
    console.error('Failed to fetch director name:', e)
  }
  
  // Force international_operations to false by default (for Kuwait list)
  // This ensures Kuwait list (6 categories) loads instead of global list (27 categories)
  formData.value.international_operations = false
  console.log('[Frontend] Set international_operations to false by default for Kuwait list')
  
  // Fetch service types if entity is already set (even if entities failed to load)
  console.log('[Frontend] Checking if should fetch service types, formData.value.entity:', formData.value.entity)
  // Always try to fetch service types - entity might be set by default
  if (formData.value.entity) {
    console.log('[Frontend] Entity is set, calling fetchServiceTypes')
    try {
      await fetchServiceTypes()
    } catch (e) {
      console.error('Failed to fetch service types:', e)
    }
  } else {
    console.log('[Frontend] Entity is NOT set, will fetch after entity is selected')
    // Watch for entity changes to fetch service types
  }
  
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
        service_category: request.service_category || '',
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
        lead_source_id: request.lead_source_id || null
      }
      onClientSelect()
      localStorage.removeItem('coi-edit-request')
      info('Draft loaded for editing')
    } catch (error) {
      console.error('Failed to load draft for editing:', error)
      showError('Failed to load draft data')
    }
  } else {
    const hasSavedData = loadFromLocalStorage()
    if (hasSavedData) {
      onClientSelect()
      info('Restored previous draft')
    }
  }
  
  startAutoSave()
  setupIntersectionObserver()
})

onUnmounted(() => {
  stopAutoSave()
  if (observer) {
    observer.disconnect()
  }
})

// Watch for form changes
watch(formData, () => {
  saveToLocalStorage()
}, { deep: true })
</script>

<style scoped>
.scroll-mt-6 {
  scroll-margin-top: 1.5rem;
}
</style>
