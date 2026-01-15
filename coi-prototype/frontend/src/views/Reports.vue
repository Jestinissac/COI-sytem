<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- Professional Header with Navigation Breadcrumb -->
    <div class="bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-7xl mx-auto px-6 py-5">
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          <span>COI System</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
          <span class="text-gray-900 font-medium">Reports & Analytics</span>
        </div>
        
        <!-- Header Content -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Reports & Analytics</h1>
            <p class="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <span class="inline-flex items-center gap-1">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Role: <span class="font-medium text-gray-900">{{ user?.role }}</span>
              </span>
              <span class="text-gray-400">•</span>
              <span>{{ availableReports.length }} reports available</span>
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button
              @click="showCatalog = !showCatalog"
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
              </svg>
              {{ showCatalog ? 'Hide Report Catalog' : 'Browse Report Catalog' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-8">
      <!-- Professional Report Catalog View -->
      <div v-if="showCatalog" class="mb-8">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <!-- Catalog Header -->
          <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <h2 class="text-xl font-bold text-white mb-2">Report Catalog</h2>
            <p class="text-blue-100 text-sm">Browse and select from available reports organized by your role and permissions</p>
          </div>
          
          <!-- Catalog Content -->
          <div class="p-8">
            <div class="space-y-10">
              <div v-for="roleGroup in reportCatalog" :key="roleGroup.role">
                <!-- Role Section Header -->
                <div class="flex items-center justify-between mb-6 pb-3 border-b-2 border-gray-200">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-lg font-bold text-gray-900">{{ roleGroup.role }}</h3>
                      <p class="text-sm text-gray-500">Reports & Analytics</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-lg">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {{ roleGroup.reports.filter(r => r.status === 'available').length }} Available
                    </span>
                  </div>
                </div>
                
                <!-- Report Cards Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div
                    v-for="report in roleGroup.reports.filter(r => r.status === 'available')"
                    :key="report.id"
                    @click="selectReportFromCatalog(report)"
                    :class="[
                      'group relative bg-white rounded-xl border-2 transition-all duration-200 cursor-pointer overflow-hidden',
                      selectedReport === report.id 
                        ? 'border-blue-500 shadow-lg shadow-blue-100 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                    ]"
                  >
                    <!-- Selected Indicator -->
                    <div v-if="selectedReport === report.id" class="absolute top-0 right-0 w-0 h-0 border-t-[50px] border-r-[50px] border-t-blue-500 border-r-transparent">
                      <svg class="absolute -top-11 right-1 w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                    </div>
                    
                    <div class="p-6">
                      <!-- Report Icon & Title -->
                      <div class="flex items-start gap-4 mb-4">
                        <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center group-hover:from-blue-100 group-hover:to-blue-200 transition-colors">
                          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                          </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                          <h4 class="text-base font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{{ report.name }}</h4>
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 text-xs font-medium rounded-md">
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                            Ready
                          </span>
                        </div>
                      </div>
                      
                      <!-- Description -->
                      <p class="text-sm text-gray-600 mb-4 line-clamp-2">{{ report.description }}</p>
                      
                      <!-- Data Points -->
                      <div class="bg-gray-50 rounded-lg p-3 mb-4">
                        <p class="text-xs font-medium text-gray-500 mb-1">Includes:</p>
                        <p class="text-xs text-gray-700">{{ report.dataPoints }}</p>
                      </div>
                      
                      <!-- Export Formats -->
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3 text-xs text-gray-500">
                          <span class="inline-flex items-center gap-1">
                            <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                            </svg>
                            PDF
                          </span>
                          <span class="inline-flex items-center gap-1">
                            <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            Excel
                          </span>
                        </div>
                        <svg class="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-8">
        <!-- Professional Left Sidebar: Report Selection & Filters -->
        <div class="col-span-4">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
            <!-- Sidebar Header -->
            <div class="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
                  </svg>
                </div>
                <div>
                  <h2 class="text-sm font-bold text-gray-900">Report Configuration</h2>
                  <p class="text-xs text-gray-500">Select and customize your report</p>
                </div>
              </div>
            </div>
            
            <div class="p-6 space-y-6">
              <!-- Report Selector -->
              <div>
                <label class="block text-sm font-semibold text-gray-900 mb-3">
                  <span class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Report Type
                  </span>
                </label>
                <select
                  v-model="selectedReport"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-300"
                >
                  <option value="" class="text-gray-500">Select a report type...</option>
                  <option
                    v-for="report in availableReports"
                    :key="report.id"
                    :value="report.id"
                    class="font-medium"
                  >
                    {{ report.name }}
                  </option>
                </select>
                <div v-if="selectedReport" class="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p class="text-xs text-blue-900 leading-relaxed">
                    <svg class="w-4 h-4 inline text-blue-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ getReportDescription(selectedReport) }}
                  </p>
                </div>
              </div>

              <!-- Filters Section -->
              <div v-if="selectedReport" class="space-y-5 pt-4 border-t-2 border-gray-100">
                <div class="flex items-center gap-2 mb-4">
                  <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                  </svg>
                  <h3 class="text-sm font-bold text-gray-900">Apply Filters</h3>
                </div>
                
                <!-- Date Range -->
                <div class="space-y-4">
                  <div>
                    <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Date Range From</label>
                    <input
                      v-model="filters.dateFrom"
                      type="date"
                      class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-300"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Date Range To</label>
                    <input
                      v-model="filters.dateTo"
                      type="date"
                      class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-300"
                    />
                  </div>
                </div>

                <!-- Status Filter -->
                <div v-if="showStatusFilter">
                  <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Request Status</label>
                  <select
                    v-model="filters.status"
                    class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-300"
                  >
                    <option value="">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Pending Compliance Review">Pending Compliance Review</option>
                    <option value="Pending Director Approval">Pending Director Approval</option>
                    <option value="Pending Partner Approval">Pending Partner Approval</option>
                    <option value="Approved">Approved</option>
                    <option value="Active">Active</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <!-- Service Type Filter -->
                <div v-if="showServiceTypeFilter">
                  <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Service Type</label>
                  <input
                    v-model="filters.serviceType"
                    type="text"
                    placeholder="e.g., Audit, Tax, Advisory"
                    class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-300"
                  />
                </div>

                <!-- Conversion Status Filter (for Prospect Conversion) -->
                <div v-if="selectedReport === 'prospect-conversion'">
                  <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Conversion Status</label>
                  <select
                    v-model="filters.conversionStatus"
                    class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-300"
                  >
                    <option value="">All</option>
                    <option value="Converted">Converted</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <!-- Action Buttons -->
              <div v-if="selectedReport" class="pt-5 space-y-3 border-t-2 border-gray-100">
                <button
                  @click="loadReportData"
                  :disabled="loading || !selectedReport"
                  class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                >
                  <svg v-if="!loading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  <svg v-else class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ loading ? 'Generating Report...' : 'Generate Report' }}
                </button>
                <button
                  @click="clearFilters"
                  class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Professional Main Content: Report Preview & Export -->
        <div class="col-span-8">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <!-- Professional Export Header -->
            <div v-if="reportData" class="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-5 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <span>Report Preview</span>
                    <span class="px-3 py-1 bg-green-100 border border-green-200 text-green-700 text-xs font-semibold rounded-lg">
                      <svg class="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                      Generated
                    </span>
                  </h2>
                  <p class="text-sm text-gray-600 mt-1">
                    {{ new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <button
                    @click="exportPDF"
                    :disabled="exporting"
                    class="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-red-500 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                    {{ exporting === 'pdf' ? 'Exporting...' : 'Export PDF' }}
                  </button>
                  <button
                    @click="exportExcel"
                    :disabled="exporting"
                    class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    {{ exporting === 'excel' ? 'Exporting...' : 'Export Excel' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Report Content with Professional Styling -->
            <div class="p-8">
              <!-- Empty State -->
              <div v-if="!selectedReport" class="text-center py-20">
                <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                  <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">No Report Selected</h3>
                <p class="text-sm text-gray-500 mb-6">Choose a report from the left sidebar to generate insights</p>
                <button
                  @click="showCatalog = true"
                  class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                  </svg>
                  Browse Report Catalog
                </button>
              </div>

              <!-- Loading State -->
              <div v-else-if="loading" class="text-center py-20">
                <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 mb-6">
                  <svg class="animate-spin w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Generating Report</h3>
                <p class="text-sm text-gray-500">Please wait while we compile your data...</p>
              </div>

              <!-- Error State -->
              <div v-else-if="error" class="text-center py-20">
                <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-6">
                  <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Failed to Load Report</h3>
                <p class="text-sm text-red-600 mb-6">{{ error }}</p>
                <button
                  @click="loadReportData"
                  class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  Retry
                </button>
              </div>

              <div v-else-if="reportData" class="space-y-8">
                <!-- Professional Summary Section -->
                <div v-if="reportData.summary">
                  <div class="flex items-center gap-3 mb-6">
                    <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                      </svg>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900">Executive Summary</h3>
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-5">
                    <div
                      v-for="(value, key) in reportData.summary"
                      :key="key"
                      class="group relative bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-lg transition-all"
                    >
                      <div class="absolute top-3 right-3">
                        <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
                          </svg>
                        </div>
                      </div>
                      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {{ formatKey(key) }}
                      </p>
                      <p class="text-3xl font-bold text-gray-900 mb-1">
                        {{ formatValue(value) }}
                      </p>
                      <div class="w-12 h-1 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full"></div>
                    </div>
                  </div>
                </div>

                <!-- Professional Requests Table -->
                <div v-if="reportData.requests && reportData.requests.length > 0">
                  <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 class="text-xl font-bold text-gray-900">Request Details</h3>
                        <p class="text-sm text-gray-500">{{ reportData.requests.length }} records</p>
                      </div>
                    </div>
                  </div>
                  <div class="overflow-hidden rounded-xl border-2 border-gray-200">
                    <div class="overflow-x-auto">
                      <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                          <tr>
                            <th
                              v-for="header in getTableHeaders(reportData.requests[0])"
                              :key="header"
                              class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
                            >
                              {{ formatKey(header) }}
                            </th>
                          </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-100">
                          <tr 
                            v-for="(row, index) in reportData.requests" 
                            :key="index" 
                            class="hover:bg-blue-50 transition-colors"
                            :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
                          >
                            <td
                              v-for="header in getTableHeaders(reportData.requests[0])"
                              :key="header"
                              class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                            >
                              {{ row[header] || '—' }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <!-- Professional Codes Table -->
                <div v-if="reportData.codes && reportData.codes.length > 0">
                  <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
                        </svg>
                      </div>
                      <div>
                        <h3 class="text-xl font-bold text-gray-900">Engagement Codes</h3>
                        <p class="text-sm text-gray-500">{{ reportData.codes.length }} codes generated</p>
                      </div>
                    </div>
                  </div>
                  <div class="overflow-hidden rounded-xl border-2 border-gray-200">
                    <div class="overflow-x-auto">
                      <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                          <tr>
                            <th
                              v-for="header in getTableHeaders(reportData.codes[0])"
                              :key="header"
                              class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
                            >
                              {{ formatKey(header) }}
                            </th>
                          </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-100">
                          <tr 
                            v-for="(row, index) in reportData.codes" 
                            :key="index" 
                            class="hover:bg-green-50 transition-colors"
                            :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
                          >
                            <td
                              v-for="header in getTableHeaders(reportData.codes[0])"
                              :key="header"
                              class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                            >
                              {{ row[header] || '—' }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <!-- Professional Prospects Table -->
                <div v-if="reportData.prospects && reportData.prospects.length > 0">
                  <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 class="text-xl font-bold text-gray-900">Prospects Overview</h3>
                        <p class="text-sm text-gray-500">{{ reportData.prospects.length }} prospects tracked</p>
                      </div>
                    </div>
                  </div>
                  <div class="overflow-hidden rounded-xl border-2 border-gray-200">
                    <div class="overflow-x-auto">
                      <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                          <tr>
                            <th
                              v-for="header in getTableHeaders(reportData.prospects[0])"
                              :key="header"
                              class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
                            >
                              {{ formatKey(header) }}
                            </th>
                          </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-100">
                          <tr 
                            v-for="(row, index) in reportData.prospects" 
                            :key="index" 
                            class="hover:bg-orange-50 transition-colors"
                            :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
                          >
                            <td
                              v-for="header in getTableHeaders(reportData.prospects[0])"
                              :key="header"
                              class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                            >
                              {{ row[header] || '—' }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <!-- Professional No Data State -->
                <div v-if="!reportData.requests && !reportData.codes && !reportData.prospects" class="text-center py-20">
                  <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                    <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                    </svg>
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
                  <p class="text-sm text-gray-500">There is no data matching your current filters. Try adjusting your selection.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getReportData, exportReportPDF, exportReportExcel, downloadBlob, type ReportFilters, type ReportData } from '@/services/reportService'

const authStore = useAuthStore()
const user = computed(() => authStore.user)

const selectedReport = ref('')
const filters = ref<ReportFilters>({})
const reportData = ref<ReportData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const exporting = ref<'pdf' | 'excel' | null>(null)
const showCatalog = ref(true)

// Complete Report Catalog
const reportCatalog = computed(() => {
  const role = user.value?.role
  const allReports = [
    {
      role: 'Requester',
      reports: [
        { id: 'my-requests-summary', name: 'My Requests Summary', description: 'Personal tracking of all requests with status breakdown, service types, and processing times', dataPoints: 'Total, Status, Service Type, Client, Timeline', status: 'available', rolePath: 'requester' },
        { id: 'my-request-details', name: 'My Request Details', description: 'Detailed view of specific request(s) with approval history and attachments', dataPoints: 'Full Details, History, Notes, Attachments', status: 'coming-soon', rolePath: 'requester' },
        { id: 'my-request-status', name: 'My Request Status', description: 'Current status of all requests with days in status and next actions', dataPoints: 'Status, Stage, Days, Next Action', status: 'coming-soon', rolePath: 'requester' }
      ]
    },
    {
      role: 'Director',
      reports: [
        { id: 'department-overview', name: 'Department Requests Overview', description: 'Department-wide request tracking with team member breakdown', dataPoints: 'Total, By Requester, Status, Service Type, Approval Rate', status: 'available', rolePath: 'director' },
        { id: 'team-performance', name: 'Team Performance Report', description: 'Track team member request activity and performance metrics', dataPoints: 'Per Member, Approval Rate, Processing Time', status: 'coming-soon', rolePath: 'director' },
        { id: 'pending-approvals', name: 'Pending Approvals Report', description: 'Track requests awaiting director approval with priority indicators', dataPoints: 'Request Details, Days Pending, Priority', status: 'coming-soon', rolePath: 'director' },
        { id: 'department-service-analysis', name: 'Department Service Analysis', description: 'Analyze service types and trends in department', dataPoints: 'Service Distribution, Client Distribution, Trends', status: 'coming-soon', rolePath: 'director' }
      ]
    },
    {
      role: 'Compliance',
      reports: [
        { id: 'review-summary', name: 'Compliance Review Summary', description: 'Overview of all compliance reviews with conflicts and duplications', dataPoints: 'Pending Reviews, Conflicts, Duplications, Approval Rate', status: 'available', rolePath: 'compliance' },
        { id: 'conflict-analysis', name: 'Conflict Analysis Report', description: 'Detailed conflict and duplication analysis with resolution status', dataPoints: 'Flagged Conflicts, Duplication Matches, Resolution', status: 'coming-soon', rolePath: 'compliance' },
        { id: 'service-conflict-matrix', name: 'Service Conflict Matrix', description: 'Visual matrix of service conflicts by client with risk levels', dataPoints: 'Client List, Service Types, Conflict Indicators', status: 'coming-soon', rolePath: 'compliance' },
        { id: 'global-clearance', name: 'Global Clearance Report', description: 'Track international operations requiring global clearance', dataPoints: 'International Requests, Clearance Status, Member Firm', status: 'coming-soon', rolePath: 'compliance' },
        { id: 'compliance-decision', name: 'Compliance Decision Report', description: 'Track all compliance decisions with notes and restrictions', dataPoints: 'Decisions, Dates, Notes, Restrictions', status: 'coming-soon', rolePath: 'compliance' },
        { id: 'duplication-detection', name: 'Duplication Detection Report', description: 'Detailed duplication matches with scores and actions', dataPoints: 'Matches, Scores, Reasons, Actions', status: 'coming-soon', rolePath: 'compliance' }
      ]
    },
    {
      role: 'Partner',
      reports: [
        { id: 'pending-approvals', name: 'Pending Partner Approvals', description: 'Requests awaiting partner approval with compliance decisions', dataPoints: 'Request Details, Compliance Decision, Days Pending', status: 'available', rolePath: 'partner' },
        { id: 'dashboard-summary', name: 'Partner Dashboard Summary', description: 'High-level overview with pending approvals and key metrics', dataPoints: 'Pending, Active Proposals, Engagements, Expiring', status: 'coming-soon', rolePath: 'partner' },
        { id: 'active-engagements', name: 'Active Engagements Report', description: 'All active engagements overview with renewal dates', dataPoints: 'Engagement Code, Client, Dates, Status, Renewal', status: 'coming-soon', rolePath: 'partner' },
        { id: 'expiring-engagements', name: 'Expiring Engagements Report', description: 'Engagements approaching renewal/expiry with action required', dataPoints: 'Expiry Date, Days Until, Renewal Status, Action', status: 'coming-soon', rolePath: 'partner' },
        { id: 'approval-history', name: 'Partner Approval History', description: 'Track partner approval decisions with notes and restrictions', dataPoints: 'Decisions, Dates, Notes, Restrictions', status: 'coming-soon', rolePath: 'partner' }
      ]
    },
    {
      role: 'Finance',
      reports: [
        { id: 'engagement-code-summary', name: 'Engagement Code Summary', description: 'Overview of engagement codes generated by service type and status', dataPoints: 'Total Codes, By Service Type, Status, Queue', status: 'available', rolePath: 'finance' }
      ]
    },
    {
      role: 'Admin',
      reports: [
        { id: 'system-overview', name: 'System Overview Report', description: 'Complete system status with health metrics and alerts', dataPoints: 'Total Requests, Active Engagements, Alerts, Renewals', status: 'available', rolePath: 'admin' },
        { id: 'prospect-conversion', name: 'Prospect Conversion Report', description: 'Track prospect to client conversion ratio and timeline', dataPoints: 'Total Prospects, Converted, Conversion Ratio, Timeline', status: 'available', rolePath: 'admin' },
        { id: 'execution-tracking', name: 'Execution Tracking Report', description: 'Track proposal execution with 30-day deadline status', dataPoints: 'Execution Status, Dates, Deadline Status, Letter Status', status: 'coming-soon', rolePath: 'admin' },
        { id: 'monitoring-alerts', name: 'Monitoring Alerts Report', description: 'All monitoring alerts with types and action taken', dataPoints: 'Alert Type, Dates, Days in Monitoring, Actions', status: 'coming-soon', rolePath: 'admin' },
        { id: 'renewals-due', name: 'Renewals Due Report', description: 'Engagements requiring renewal with days until renewal', dataPoints: 'Engagement Code, Client, Renewal Date, Days Until', status: 'coming-soon', rolePath: 'admin' },
        { id: '30-day-deadline-tracking', name: '30-Day Deadline Tracking', description: 'Monitor 30-day proposal deadlines and engagement letters', dataPoints: 'Execution Date, Deadline, Days Remaining, Status', status: 'coming-soon', rolePath: 'admin' },
        { id: 'workflow-performance', name: 'Workflow Performance Report', description: 'Analyze workflow efficiency with bottlenecks and trends', dataPoints: 'Processing Time, Bottlenecks, Department Performance', status: 'coming-soon', rolePath: 'admin' },
        { id: 'system-activity', name: 'System Activity Report', description: 'Overall system activity with user and department metrics', dataPoints: 'Requests Created, Approvals, Rejections, User Activity', status: 'coming-soon', rolePath: 'admin' }
      ]
    },
    {
      role: 'Super Admin',
      reports: [
        { id: 'system-overview', name: 'System Overview Report', description: 'Complete system status with health metrics and alerts', dataPoints: 'Total Requests, Active Engagements, Alerts, Renewals', status: 'available', rolePath: 'admin' },
        { id: 'prospect-conversion', name: 'Prospect Conversion Report', description: 'Track prospect to client conversion ratio and timeline', dataPoints: 'Total Prospects, Converted, Conversion Ratio, Timeline', status: 'available', rolePath: 'admin' },
        { id: 'system-wide-analytics', name: 'System-Wide Analytics Report', description: 'Complete system overview with all metrics from all roles', dataPoints: 'All Metrics, Statistics, User Activity, Performance', status: 'coming-soon', rolePath: 'admin' },
        { id: 'user-activity', name: 'User Activity Report', description: 'Track user activity across system with login and action data', dataPoints: 'User, Role, Requests, Approvals, Last Login', status: 'coming-soon', rolePath: 'admin' },
        { id: 'department-performance', name: 'Department Performance Report', description: 'Compare department performance with approval rates', dataPoints: 'Department, Requests, Approval Rate, Processing Time', status: 'coming-soon', rolePath: 'admin' },
        { id: 'business-rules', name: 'Business Rules Report', description: 'Track business rules usage with impact analysis', dataPoints: 'Rule Name, Times Triggered, Actions, Impact', status: 'coming-soon', rolePath: 'admin' },
        { id: 'audit-trail', name: 'Audit Trail Report', description: 'Complete audit log with all actions and timestamps', dataPoints: 'Action Type, User, Entity, Timestamp, Details', status: 'coming-soon', rolePath: 'admin' },
        { id: 'system-configuration', name: 'System Configuration Report', description: 'System settings and configuration details', dataPoints: 'Active Features, Settings, Form Versions, Workflow', status: 'coming-soon', rolePath: 'admin' }
      ]
    }
  ]
  
  // Filter to show only reports for current user's role
  if (role === 'Super Admin') {
    return allReports // Super Admin sees all
  }
  
  return allReports.filter(group => {
    if (group.role === role) return true
    if (role === 'Admin' && group.role === 'Admin') return true
    return false
  })
})

// Available reports based on role (for dropdown)
const availableReports = computed(() => {
  const role = user.value?.role
  const catalog = reportCatalog.value
  const reports: Array<{ id: string; name: string; description: string }> = []
  
  catalog.forEach(group => {
    group.reports.forEach(report => {
      if (report.status === 'available') {
        reports.push({
          id: report.id,
          name: report.name,
          description: report.description
        })
      }
    })
  })
  
  return reports
})

const showStatusFilter = computed(() => {
  return ['my-requests-summary', 'department-overview', 'review-summary'].includes(selectedReport.value)
})

const showServiceTypeFilter = computed(() => {
  return ['my-requests-summary', 'department-overview', 'engagement-code-summary'].includes(selectedReport.value)
})

function getReportDescription(reportId: string): string {
  const report = availableReports.value.find(r => r.id === reportId)
  return report?.description || ''
}

function getRolePath(): string {
  // Find the role path from the selected report in catalog
  if (selectedReport.value) {
    for (const group of reportCatalog.value) {
      const report = group.reports.find(r => r.id === selectedReport.value)
      if (report) {
        return report.rolePath
      }
    }
  }
  
  // Fallback to role-based mapping
  const role = user.value?.role
  const roleMap: Record<string, string> = {
    'Requester': 'requester',
    'Director': 'director',
    'Compliance': 'compliance',
    'Partner': 'partner',
    'Finance': 'finance',
    'Admin': 'admin',
    'Super Admin': 'admin'
  }
  return roleMap[role || ''] || 'requester'
}

function selectReportFromCatalog(report: any) {
  if (report.status === 'available') {
    selectedReport.value = report.id
    showCatalog.value = false
    // Scroll to report section
    setTimeout(() => {
      document.querySelector('.col-span-4')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  } else {
    alert('This report is coming soon. Phase 1 reports are currently available.')
  }
}

async function loadReportData() {
  if (!selectedReport.value) return
  
  loading.value = true
  error.value = null
  
  try {
    const rolePath = getRolePath()
    const data = await getReportData(rolePath, selectedReport.value, filters.value)
    reportData.value = data
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to load report data'
    console.error('Error loading report:', err)
  } finally {
    loading.value = false
  }
}

async function exportPDF() {
  if (!selectedReport.value) return
  
  exporting.value = 'pdf'
  try {
    const rolePath = getRolePath()
    const blob = await exportReportPDF(rolePath, selectedReport.value, filters.value)
    const filename = `${selectedReport.value}_${new Date().toISOString().split('T')[0]}.pdf`
    downloadBlob(blob, filename)
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to export PDF')
    console.error('Error exporting PDF:', err)
  } finally {
    exporting.value = null
  }
}

async function exportExcel() {
  if (!selectedReport.value) return
  
  exporting.value = 'excel'
  try {
    const rolePath = getRolePath()
    const blob = await exportReportExcel(rolePath, selectedReport.value, filters.value)
    const filename = `${selectedReport.value}_${new Date().toISOString().split('T')[0]}.xlsx`
    downloadBlob(blob, filename)
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to export Excel')
    console.error('Error exporting Excel:', err)
  } finally {
    exporting.value = null
  }
}

function clearFilters() {
  filters.value = {}
  reportData.value = null
}

function formatKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function formatValue(value: any): string {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value)
  }
  return String(value)
}

function getTableHeaders(data: any): string[] {
  return Object.keys(data || {})
}

onMounted(() => {
  // Auto-load first report if available
  if (availableReports.value.length > 0) {
    selectedReport.value = availableReports.value[0].id
  }
})
</script>
