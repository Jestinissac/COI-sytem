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
                  ? 'bg-blue-50 border-blue-600 text-blue-700 font-medium' 
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
              <svg class="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <option>Director</option>
                    <option>Partner</option>
                    <option>Manager</option>
                    <option>Senior Manager</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Entity <span class="text-red-500">*</span></label>
                  <select 
                    v-model="formData.entity"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select entity...</option>
                    <option>BDO Al Nisf & Partners</option>
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
                  class="relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all"
                  :class="formData.requested_document === 'Proposal' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
                >
                  <input 
                    type="radio" 
                    v-model="formData.requested_document" 
                    value="Proposal" 
                    class="sr-only"
                  />
                  <div class="flex items-center">
                    <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                      <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">Proposal</p>
                      <p class="text-xs text-gray-500">For new client engagements</p>
                    </div>
                  </div>
                  <div v-if="formData.requested_document === 'Proposal'" class="absolute top-2 right-2">
                    <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                </label>
                <label 
                  class="relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all"
                  :class="formData.requested_document === 'Engagement Letter' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
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
                    <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                </label>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Language</label>
                <select 
                  v-model="formData.language"
                  class="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>English</option>
                  <option>Arabic</option>
                  <option>Bilingual</option>
                </select>
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
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Select Client <span class="text-red-500">*</span></label>
                  <div class="flex gap-3">
                    <select 
                      v-model="formData.client_id"
                      @change="onClientSelect"
                      class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option :value="null">Search or select client...</option>
                      <option v-for="client in clients" :key="client.id" :value="client.id">
                        {{ client.name }} ({{ client.code }})
                      </option>
                    </select>
                    <button 
                      type="button"
                      class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      + Request New Client
                    </button>
                  </div>
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
                      <option>K.S.C.</option>
                      <option>K.S.C.C.</option>
                      <option>Sole Proprietorship</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Regulated By</label>
                    <select 
                      v-model="formData.regulated_body"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select...</option>
                      <option>CBK</option>
                      <option>CMA</option>
                      <option>None</option>
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                    <select 
                      v-model="formData.client_location"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select...</option>
                      <option>State of Kuwait</option>
                      <option>UAE</option>
                      <option>Saudi Arabia</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1.5">Relationship</label>
                    <select 
                      v-model="formData.relationship_with_client"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select...</option>
                      <option>Existing Client</option>
                      <option>New Client</option>
                      <option>Referral</option>
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

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Parent Company (if any)</label>
                  <input
                    v-model="formData.parent_company"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter parent company name..."
                  />
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
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Service Type <span class="text-red-500">*</span></label>
                  <select 
                    v-model="formData.service_type"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select service type...</option>
                    <option>Statutory Audit</option>
                    <option>Internal Audit</option>
                    <option>Tax Advisory</option>
                    <option>Tax Compliance</option>
                    <option>Management Consulting</option>
                    <option>Due Diligence</option>
                    <option>Valuation</option>
                    <option>Other Advisory</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Service Category</label>
                  <select 
                    v-model="formData.service_category"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select category...</option>
                    <option>Audit & Assurance</option>
                    <option>Advisory</option>
                    <option>Tax</option>
                    <option>Other Regulated</option>
                  </select>
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
              </div>

              <div v-if="formData.international_operations" class="space-y-4 pl-6 border-l-2 border-blue-200">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Foreign Subsidiaries</label>
                  <textarea
                    v-model="formData.foreign_subsidiaries"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="List countries and subsidiaries..."
                  ></textarea>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Global Clearance Status</label>
                  <select 
                    v-model="formData.global_clearance_status"
                    class="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option>Not Required</option>
                    <option>Pending</option>
                    <option>Approved</option>
                    <option>Rejected</option>
                  </select>
                </div>
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
import api from '@/services/api'

const router = useRouter()
const coiStore = useCOIRequestsStore()
const authStore = useAuthStore()
const { success, error: showError, info } = useToast()

const loading = ref(false)
const showConfirmModal = ref(false)
const activeSection = ref('section-1')
const totalSteps = 7

const clients = ref<any[]>([])
const selectedClientCode = ref('')
const directorName = ref('')
const allUsers = ref<any[]>([])

// Computed properties for user role
const isTeamMember = computed(() => {
  return authStore.user?.role === 'Requester' && authStore.user?.director_id
})

const isDirector = computed(() => {
  return authStore.user?.role === 'Director'
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
  pie_status: 'No',
  parent_company: '',
  service_type: '',
  service_category: '',
  service_description: '',
  requested_service_period_start: '',
  requested_service_period_end: '',
  full_ownership_structure: '',
  related_affiliated_entities: '',
  international_operations: false,
  foreign_subsidiaries: '',
  global_clearance_status: 'Not Required'
})

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

// Scroll to section
function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeSection.value = sectionId
  }
}

// Handle client selection
function onClientSelect() {
  const client = clients.value.find(c => c.id === formData.value.client_id)
  if (client) {
    selectedClientCode.value = client.code
    formData.value.client_name = client.name
  } else {
    selectedClientCode.value = ''
    formData.value.client_name = ''
  }
}

// Fetch clients
async function fetchClients() {
  try {
    const response = await api.get('/integration/prms/clients')
    clients.value = response.data
  } catch (err) {
    console.error('Failed to fetch clients:', err)
  }
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

// Handle submit
async function handleSubmit() {
  showConfirmModal.value = false
  loading.value = true
  try {
    const result = await coiStore.createRequest(formData.value)
    const submitResult = await coiStore.submitRequest(result.id)
    
    if (submitResult && submitResult.duplicates && submitResult.duplicates.length > 0) {
      showError('Duplication detected! Please review.')
    } else {
      success('Request submitted successfully!')
      clearLocalStorage()
      stopAutoSave()
      
      setTimeout(() => {
        router.push('/coi/requester')
      }, 1500)
    }
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

// Lifecycle
onMounted(async () => {
  await fetchClients()
  await fetchDirectorName()
  
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
        pie_status: request.pie_status || 'No',
        parent_company: request.parent_company || '',
        service_type: request.service_type || '',
        service_category: request.service_category || '',
        service_description: request.service_description || '',
        requested_service_period_start: request.requested_service_period_start || '',
        requested_service_period_end: request.requested_service_period_end || '',
        full_ownership_structure: request.full_ownership_structure || '',
        related_affiliated_entities: request.related_affiliated_entities || '',
        international_operations: request.international_operations === 1 || request.international_operations === true,
        foreign_subsidiaries: request.foreign_subsidiaries || '',
        global_clearance_status: request.global_clearance_status || 'Not Required'
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
