<template>
  <div class="min-h-screen bg-gray-50">
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
            <h1 class="text-2xl font-semibold text-gray-900 tracking-tight">Reports & Analytics</h1>
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
            <RouterLink
              to="/coi/reports/analytics"
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Open Analytics dashboard"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              Analytics
            </RouterLink>
            <button
              @click="showCatalog = !showCatalog"
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              :aria-expanded="showCatalog"
              aria-label="Toggle report catalog visibility"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
        <div class="bg-white rounded border border-gray-200 overflow-hidden">
          <!-- Catalog Header -->
          <div class="bg-white border-b border-gray-200 px-8 py-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Report Catalog</h2>
            <p class="text-gray-600 text-sm">Browse and select from available reports organized by your role and permissions</p>
          </div>
          
          <!-- Catalog Content -->
          <div class="p-8">
            <div class="space-y-10">
              <div v-for="roleGroup in reportCatalog" :key="roleGroup.role">
                <!-- Role Section Header -->
                <div class="flex items-center justify-between mb-6 pb-3 border-b border-gray-200">
                  <div class="flex items-center gap-3">
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900">{{ roleGroup.role }}</h3>
                      <p class="text-sm text-gray-500">Reports & Analytics</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {{ roleGroup.reports.filter(r => r.status === 'available').length }} Available
                    </span>
                  </div>
                </div>
                
                <!-- Report Cards Grid - Available Reports Only -->
                <div v-if="roleGroup.reports.filter(r => r.status === 'available').length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div
                    v-for="report in roleGroup.reports.filter(r => r.status === 'available')"
                    :key="report.id"
                    @click="selectReportFromCatalog(report)"
                    :class="[
                      'group relative bg-white rounded border transition-colors cursor-pointer overflow-hidden',
                      selectedReport === report.id 
                        ? 'border-gray-300' 
                        : 'border-gray-200 hover:border-gray-400'
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
                        <div class="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                          </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                          <h4 class="text-base font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{{ report.name }}</h4>
                          <div class="flex items-center gap-2 flex-wrap">
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 text-xs font-medium rounded-md">
                              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                              </svg>
                              Ready
                            </span>
                            <span v-if="report.category" class="inline-flex items-center px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-700 text-xs font-medium rounded-md">
                              {{ report.category === 'governance' ? 'Governance' : 'Operational' }}
                            </span>
                          </div>
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
                
                <!-- Planned Reports Section (Collapsible) -->
                <div v-if="roleGroup.reports.filter(r => r.status === 'coming-soon').length > 0" class="mt-8 pt-8 border-t border-gray-200">
                  <button
                    @click="showPlannedReports[roleGroup.role] = !showPlannedReports[roleGroup.role]"
                    class="flex items-center justify-between w-full text-left mb-4"
                  >
                    <div class="flex items-center gap-2">
                      <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <h4 class="text-sm font-semibold text-gray-700">Phase 2 Reports</h4>
                      <span class="inline-flex items-center px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 text-xs font-medium rounded">
                        {{ roleGroup.reports.filter(r => r.status === 'coming-soon').length }}
                      </span>
                    </div>
                    <svg 
                      class="w-5 h-5 text-gray-500 transition-transform"
                      :class="{ 'rotate-180': showPlannedReports[roleGroup.role] }"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  
                  <div v-if="showPlannedReports[roleGroup.role]" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div
                      v-for="report in roleGroup.reports.filter(r => r.status === 'coming-soon')"
                      :key="report.id"
                      class="group relative bg-gray-50 rounded border border-gray-200 overflow-hidden opacity-75"
                    >
                      <div class="p-6">
                        <!-- Report Icon & Title -->
                        <div class="flex items-start gap-4 mb-4">
                          <div class="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                            <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                          </div>
                          <div class="flex-1 min-w-0">
                            <h4 class="text-base font-semibold text-gray-600 mb-1">{{ report.name }}</h4>
                            <div class="flex items-center gap-2 flex-wrap">
                              <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium rounded-md">
                                Phase 2
                              </span>
                              <span v-if="report.category" class="inline-flex items-center px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 text-xs font-medium rounded-md">
                                {{ report.category === 'governance' ? 'Governance' : 'Operational' }}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <!-- Description -->
                        <p class="text-sm text-gray-500 mb-4 line-clamp-2">{{ report.description }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Professional Left Sidebar: Report Selection & Filters -->
        <div class="lg:col-span-4">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
            <!-- Sidebar Header -->
            <div class="bg-white px-6 py-4 border-b border-gray-200">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
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
                  class="w-full px-4 py-3 border border-gray-200 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-gray-300 transition-colors bg-white hover:border-gray-300"
                  aria-label="Select Report Type"
                  @keydown.enter="loadReportData(1)"
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
                      class="w-full px-4 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-gray-300 transition-colors hover:border-gray-300"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Date Range To</label>
                    <input
                      v-model="filters.dateTo"
                      type="date"
                      class="w-full px-4 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-gray-300 transition-colors hover:border-gray-300"
                    />
                  </div>
                </div>

                <!-- Status Filter -->
                <div v-if="showStatusFilter">
                  <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Request Status</label>
                  <select
                    v-model="filters.status"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-gray-300 transition-colors bg-white hover:border-gray-300"
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
                    class="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all hover:border-gray-300"
                  />
                </div>

                <!-- Conversion Status Filter (for Prospect Conversion) -->
                <div v-if="selectedReport === 'prospect-conversion'">
                  <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Conversion Status</label>
                  <select
                    v-model="filters.conversionStatus"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-gray-300 transition-colors bg-white hover:border-gray-300"
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
                  @click="loadReportData(1)"
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
                  class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 hover:border-gray-400 transition-colors"
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
        <div class="lg:col-span-8">
          <div class="bg-white rounded border border-gray-200 overflow-hidden">
            <!-- Professional Export Header -->
            <div v-if="reportData" class="bg-white px-8 py-6 border-b border-gray-200 no-print">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-xl font-semibold text-gray-900 flex items-center gap-3">
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
                    @click="showPrintPreview = true"
                    :disabled="!reportData"
                    class="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Print Preview"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                    </svg>
                    Print Preview
                  </button>
                  <button
                    @click="printReport"
                    :disabled="!reportData"
                    class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Print Report"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                    </svg>
                    Print
                  </button>
                  <button
                    @click="exportPDF"
                    :disabled="exporting !== null"
                    class="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                    {{ exporting === 'pdf' ? 'Exporting...' : 'Export PDF' }}
                  </button>
                  <button
                    @click="exportExcel"
                    :disabled="exporting !== null"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            <div class="p-8 print:p-4">
              <!-- Print Header (only visible when printing) -->
              <div class="hidden print:block mb-6 pb-4 border-b-2 border-gray-300">
                <h1 class="text-2xl font-semibold text-gray-900 mb-2">{{ getReportTitle() }}</h1>
                <div class="text-sm text-gray-600 space-y-1">
                  <p><strong>Generated:</strong> {{ new Date().toLocaleString() }}</p>
                  <p><strong>Role:</strong> {{ user?.role }}</p>
                  <p v-if="filters.dateFrom || filters.dateTo">
                    <strong>Date Range:</strong> {{ filters.dateFrom || 'All' }} to {{ filters.dateTo || 'All' }}
                  </p>
                </div>
              </div>
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
                  class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
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
                  @click="loadReportData(1)"
                  class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  Retry
                </button>
              </div>

              <div v-else-if="reportData" class="space-y-8">
                <!-- Governance Summary Cards (Top Priority) -->
                <div v-if="reportData.summary && (reportData.summary.totalRequests || reportData.summary.approvedCount !== undefined || reportData.summary.pendingCount !== undefined || reportData.summary.conflictsDetected !== undefined)" class="mb-8">
                  <div class="flex items-center gap-3 mb-6">
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                    <h3 class="text-xl font-bold text-gray-900">Governance Overview</h3>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <!-- Total Requests -->
                    <div v-if="reportData.summary.totalRequests !== undefined" class="bg-white border border-gray-200 rounded p-6">
                      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Requests</p>
                      <p class="text-3xl font-bold text-gray-900">{{ reportData.summary.totalRequests.toLocaleString() }}</p>
                    </div>
                    <!-- Approved Requests -->
                    <div v-if="reportData.summary.approvedCount !== undefined" class="bg-white border border-gray-200 rounded p-6">
                      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Approved</p>
                      <p class="text-3xl font-bold text-green-600">{{ reportData.summary.approvedCount.toLocaleString() }}</p>
                      <p v-if="reportData.summary.approvalRate !== undefined" class="text-xs text-gray-500 mt-1">{{ reportData.summary.approvalRate.toFixed(1) }}% approval rate</p>
                    </div>
                    <!-- Pending Approval -->
                    <div v-if="reportData.summary.pendingCount !== undefined" class="bg-white border border-gray-200 rounded p-6">
                      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pending Approval</p>
                      <p class="text-3xl font-bold text-amber-600">{{ reportData.summary.pendingCount.toLocaleString() }}</p>
                    </div>
                    <!-- Conflicts Detected -->
                    <div v-if="reportData.summary.conflictsDetected !== undefined" class="bg-white border border-gray-200 rounded p-6">
                      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Conflicts Detected</p>
                      <p class="text-3xl font-bold text-red-600">{{ reportData.summary.conflictsDetected.toLocaleString() }}</p>
                    </div>
                  </div>
                </div>

                <!-- Charts Section (if summary data exists) -->
                <div v-if="reportData.summary && (reportData.summary.byStatus || reportData.summary.byServiceType || reportData.summary.byClient)" class="mb-8">
                  <ReportCharts 
                    :summary-data="{
                      byStatus: reportData.summary.byStatus,
                      byServiceType: reportData.summary.byServiceType,
                      byClient: reportData.summary.byClient
                    }"
                    :clickable="true"
                    @status-click="handleStatusClick"
                    @service-type-click="handleServiceTypeClick"
                    @client-click="handleClientClick"
                  />
                </div>

                <!-- Professional Summary Section -->
                <div v-if="reportData.summary">
                  <div class="flex items-center gap-3 mb-6">
                    <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                    <h3 class="text-xl font-bold text-gray-900">Executive Summary</h3>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div
                      v-for="(value, key) in reportData.summary"
                      :key="key"
                      class="group relative bg-white border border-gray-200 rounded p-6 hover:border-gray-400 transition-colors"
                    >
                      <div class="absolute top-3 right-3">
                        <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
                        </svg>
                      </div>
                      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {{ formatKey(key) }}
                      </p>
                      
                      <!-- Handle nested objects (byStatus, byServiceType, byClient) -->
                      <div v-if="typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length > 0">
                        <div class="space-y-2">
                          <div
                            v-for="(subValue, subKey) in value"
                            :key="subKey"
                            class="flex items-center justify-between py-1.5 px-2 bg-white rounded border border-gray-100"
                          >
                            <span class="text-sm text-gray-600">{{ subKey }}</span>
                            <span class="text-sm font-semibold text-gray-900">{{ typeof subValue === 'number' ? subValue.toLocaleString() : subValue }}</span>
                          </div>
                        </div>
                        <div class="mt-3 pt-2 border-t border-gray-200">
                          <p class="text-xs text-gray-500">
                            Total: <span class="font-semibold text-gray-700">{{ Object.values(value).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0).toLocaleString() }}</span>
                          </p>
                        </div>
                      </div>
                      
                      <!-- Handle simple values (numbers, strings) -->
                      <div v-else>
                        <p class="text-3xl font-bold text-gray-900 mb-1">
                          {{ typeof value === 'number' ? value.toLocaleString() : formatValue(value) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Professional Requests Table -->
                <div v-if="reportData.requests && reportData.requests.length > 0">
                  <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-3">
                      <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <div>
                        <h3 class="text-xl font-bold text-gray-900">Request Details</h3>
                        <p class="text-sm text-gray-500">{{ filteredTableData.length }} of {{ reportData.requests.length }} records</p>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Selection Action Bar -->
                  <div v-if="selectedRowCount > 0" class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="flex items-center justify-center w-8 h-8 bg-primary-600 text-white rounded-full text-sm font-bold">
                        {{ selectedRowCount }}
                      </div>
                      <span class="text-sm font-medium text-blue-900">
                        {{ selectedRowCount === 1 ? '1 row selected' : `${selectedRowCount} rows selected` }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        @click="exportSelectedToExcel"
                        :disabled="exporting === 'excel'"
                        class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        Export Selected
                      </button>
                      <button
                        @click="clearSelection"
                        class="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                        Clear Selection
                      </button>
                    </div>
                  </div>
                  
                  <!-- Table Search and Filters -->
                  <div class="mb-4 space-y-3">
                    <!-- Search Input -->
                    <div class="relative">
                      <input
                        v-model="tableSearch"
                        type="text"
                        placeholder="Search in table..."
                        class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                    </div>
                    
                    <!-- Column Filters -->
                    <div class="flex items-center gap-3 flex-wrap">
                      <!-- Status Filter -->
                      <div v-if="hasStatusColumn" class="flex-1 min-w-[200px]">
                        <select
                          v-model="tableStatusFilter"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
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
                      <div v-if="hasServiceTypeColumn" class="flex-1 min-w-[200px]">
                        <input
                          v-model="tableServiceTypeFilter"
                          type="text"
                          placeholder="Filter by service type..."
                          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      
                      <!-- Clear Filters -->
                      <button
                        v-if="tableSearch || tableStatusFilter || tableServiceTypeFilter"
                        @click="clearTableFilters"
                        class="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                  <div class="overflow-hidden rounded border border-gray-200">
                    <div class="overflow-x-auto">
                      <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                          <tr>
                            <!-- Select All Checkbox -->
                            <th class="w-12 px-4 py-4">
                              <input
                                type="checkbox"
                                :checked="selectAll"
                                :indeterminate="selectedRowCount > 0 && selectedRowCount < filteredTableData.length"
                                @change="toggleSelectAll"
                                class="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
                                title="Select all rows"
                              />
                            </th>
                            <th
                              v-for="header in getTableHeaders(reportData.requests[0])"
                              :key="header"
                              @click="sortTable(header)"
                              @keydown.enter="sortTable(header)"
                              @keydown.space.prevent="sortTable(header)"
                              tabindex="0"
                              class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 select-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                              :class="{ 'bg-gray-100': sortColumn === header }"
                              role="columnheader"
                              :aria-sort="sortColumn === header ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'"
                              :aria-label="`Sort by ${formatKey(header)}`"
                            >
                              <div class="flex items-center gap-2">
                                <span>{{ formatKey(header) }}</span>
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getSortIcon(header)"/>
                                </svg>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-100" role="rowgroup">
                          <tr 
                            v-for="(row, index) in filteredTableData" 
                            :key="index" 
                            class="hover:bg-blue-50 transition-colors cursor-pointer"
                            :class="[
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                              isRowSelected(index) ? 'bg-blue-100 hover:bg-blue-100' : ''
                            ]"
                            role="row"
                            :aria-rowindex="index + 2"
                          >
                            <!-- Row Checkbox -->
                            <td class="w-12 px-4 py-4" @click.stop>
                              <input
                                type="checkbox"
                                :checked="isRowSelected(index)"
                                @change="toggleRowSelection(index)"
                                class="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
                              />
                            </td>
                            <td
                              v-for="header in getTableHeaders(reportData.requests[0])"
                              :key="header"
                              class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                              role="cell"
                              :headers="header"
                              @click="navigateToRequest(row)"
                            >
                              {{ formatTableValue(row[header], header) }}
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
                      <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
                      </svg>
                      <div>
                        <h3 class="text-xl font-bold text-gray-900">Engagement Codes</h3>
                        <p class="text-sm text-gray-500">{{ reportData.codes.length }} codes generated</p>
                      </div>
                    </div>
                  </div>
                  <div class="overflow-hidden rounded border border-gray-200">
                    <div class="overflow-x-auto">
                      <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
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
                              {{ formatTableValue(row[header], header) }}
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
                      <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                      <div>
                        <h3 class="text-xl font-bold text-gray-900">Prospects Overview</h3>
                        <p class="text-sm text-gray-500">{{ reportData.prospects.length }} prospects tracked</p>
                      </div>
                    </div>
                  </div>
                  <div class="overflow-hidden rounded border border-gray-200">
                    <div class="overflow-x-auto">
                      <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
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
                              {{ formatTableValue(row[header], header) }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <!-- Professional No Data State -->
                <div v-if="reportData && !reportData.requests && !reportData.codes && !reportData.prospects && (!reportData.summary || Object.keys(reportData.summary).length === 0)" class="text-center py-20">
                  <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                    <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                    </svg>
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
                  <p class="text-sm text-gray-500 mb-4">There is no data matching your current filters. Try adjusting your selection.</p>
                  <button
                    @click="clearFilters"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    Clear Filters
                  </button>
                </div>
                
                <!-- Empty Requests Table State -->
                <div v-if="reportData && reportData.requests && reportData.requests.length === 0" class="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <h3 class="text-base font-semibold text-gray-900 mb-2">No Requests Found</h3>
                  <p class="text-sm text-gray-500">No requests match your current filters. Try adjusting your date range or filters.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <ToastContainer />

    <!-- Print Preview Modal -->
    <div
      v-if="showPrintPreview"
      class="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Background overlay -->
        <div
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          @click="showPrintPreview = false"
        ></div>

        <!-- Modal panel -->
        <div class="inline-block align-bottom bg-white rounded border border-gray-200 text-left overflow-hidden sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
          <!-- Header -->
          <div class="bg-white px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Print Preview</h3>
              <div class="flex items-center gap-3">
                <button
                  @click="printReport"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                  </svg>
                  Print
                </button>
                <button
                  @click="showPrintPreview = false"
                  class="text-gray-400 hover:text-gray-500"
                  aria-label="Close"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Print Preview Content -->
          <div class="bg-white px-6 py-4 max-h-[70vh] overflow-y-auto print-preview-content">
            <div id="print-content" class="print-content">
              <!-- Report Header -->
              <div class="mb-6 pb-4 border-b-2 border-gray-300">
                <h1 class="text-2xl font-semibold text-gray-900 mb-2">{{ getReportTitle() }}</h1>
                <div class="text-sm text-gray-600 space-y-1">
                  <p><strong>Generated:</strong> {{ new Date().toLocaleString() }}</p>
                  <p><strong>Role:</strong> {{ user?.role }}</p>
                  <p v-if="filters.dateFrom || filters.dateTo">
                    <strong>Date Range:</strong> {{ filters.dateFrom || 'All' }} to {{ filters.dateTo || 'All' }}
                  </p>
                </div>
              </div>

              <!-- Summary Section -->
              <div v-if="reportData?.summary" class="mb-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">Executive Summary</h2>
                <div class="grid grid-cols-2 gap-4">
                  <div
                    v-for="(value, key) in reportData.summary"
                    :key="key"
                    class="border border-gray-200 rounded-lg p-4"
                  >
                    <h3 class="text-sm font-semibold text-gray-600 uppercase mb-2">{{ formatKey(key) }}</h3>
                    <div v-if="typeof value === 'object' && value !== null && !Array.isArray(value)">
                      <div v-for="(subValue, subKey) in value" :key="subKey" class="mb-1">
                        <span class="text-gray-600">{{ subKey }}:</span>
                        <span class="ml-2 font-semibold text-gray-900">{{ subValue }}</span>
                      </div>
                    </div>
                    <p v-else class="text-2xl font-semibold text-gray-900">{{ formatValue(value) }}</p>
                  </div>
                </div>
              </div>

              <!-- Requests Table -->
              <div v-if="reportData?.requests && reportData.requests.length > 0" class="mb-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">Request Details ({{ reportData.requests.length }} records)</h2>
                <table class="min-w-full border border-gray-300">
                  <thead class="bg-gray-100">
                    <tr>
                      <th
                        v-for="header in getTableHeaders(reportData.requests[0])"
                        :key="header"
                        class="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300"
                      >
                        {{ formatKey(header) }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, index) in reportData.requests"
                      :key="index"
                      :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
                    >
                      <td
                        v-for="header in getTableHeaders(reportData.requests[0])"
                        :key="header"
                        class="px-4 py-2 text-sm text-gray-900 border border-gray-300"
                      >
                        {{ formatTableValue(row[header], header) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Footer -->
              <div class="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500">
                <p>This report was generated from the COI System on {{ new Date().toLocaleString() }}</p>
                <p>For questions or concerns, please contact the Compliance Department.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Share Report Modal -->
    <ShareReportModal
      v-if="selectedReport"
      :is-open="showShareModal"
      :role="getRolePath()"
      :report-type="selectedReport"
      :filters="filters"
      @close="showShareModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ShareReportModal from '@/components/reports/ShareReportModal.vue'
import FilterChips from '@/components/reports/FilterChips.vue'
import ReportCharts from '@/components/reports/ReportCharts.vue'
import { getReportData, exportReportPDF, exportReportExcel, downloadBlob, type ReportFilters, type ReportData } from '@/services/reportService'

const toast = useToast()
const route = useRoute()

const authStore = useAuthStore()
const user = computed(() => authStore.user)

const selectedReport = ref('')
const filters = ref<ReportFilters>({})
const reportData = ref<ReportData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const exporting = ref<'pdf' | 'excel' | null>(null)
const showCatalog = ref(true)
const showPrintPreview = ref(false)
const showShareModal = ref(false)
const showPlannedReports = ref<Record<string, boolean>>({})

// Complete Report Catalog
const reportCatalog = computed(() => {
  const role = user.value?.role
  const allReports = [
    {
      role: 'Requester',
      reports: [
        { id: 'my-requests-summary', name: 'My Requests Summary', description: 'Personal tracking of all requests with status breakdown, service types, and processing times', dataPoints: 'Total, Status, Service Type, Client, Timeline', status: 'available', phase: '1', rolePath: 'requester', category: 'governance' },
        { id: 'my-request-details', name: 'My Request Details', description: 'Detailed view of specific request(s) with approval history and attachments', dataPoints: 'Full Details, History, Notes, Attachments', status: 'coming-soon', phase: '2', rolePath: 'requester', category: 'operational' },
        { id: 'my-request-status', name: 'My Request Status', description: 'Current status of all requests with days in status and next actions', dataPoints: 'Status, Stage, Days, Next Action', status: 'coming-soon', phase: '2', rolePath: 'requester', category: 'operational' },
        // CRM Reports for Requester (sales cycle participant)
        { id: 'lead-source-effectiveness', name: 'Lead Source Effectiveness', description: 'Analyze which lead sources generate the most conversions', dataPoints: 'Lead Source, Prospects, Conversions, Conversion Rate', status: 'available', phase: '1', rolePath: 'requester', category: 'operational' },
        { id: 'funnel-performance', name: 'Funnel Performance', description: 'Track prospect progression through the sales funnel', dataPoints: 'Stage, Count, Drop-off Rate, Avg Time in Stage', status: 'available', phase: '1', rolePath: 'requester', category: 'operational' },
        { id: 'insights-to-conversion', name: 'Insights to Conversion', description: 'Track effectiveness of AI-generated insights', dataPoints: 'Insights Generated, Acted Upon, Converted', status: 'available', phase: '1', rolePath: 'requester', category: 'operational' },
        { id: 'attribution-by-user', name: 'Attribution by User', description: 'Track conversions attributed to each user', dataPoints: 'User, Conversions, Avg Time, Success Rate', status: 'available', phase: '1', rolePath: 'requester', category: 'operational' },
        { id: 'pipeline-forecast', name: 'Pipeline Forecast', description: 'Forecast expected conversions based on current pipeline', dataPoints: 'Stage, Count, Probability, Expected Conversions', status: 'available', phase: '1', rolePath: 'requester', category: 'operational' },
        { id: 'conversion-trends', name: 'Conversion Trends', description: 'Monthly conversion trends over time', dataPoints: 'Month, Conversions, Rate, Trend Direction', status: 'available', phase: '1', rolePath: 'requester', category: 'operational' },
        { id: 'period-comparison', name: 'Period Comparison', description: 'Compare current vs previous period performance', dataPoints: 'Metric, Current, Previous, Change %', status: 'available', phase: '1', rolePath: 'requester', category: 'operational' },
        { id: 'lost-prospect-analysis', name: 'Lost Prospect Analysis', description: 'Analyze why prospects were lost', dataPoints: 'Reason, Count, Stage Lost, Lead Source', status: 'available', phase: '1', rolePath: 'requester', category: 'operational' }
      ]
    },
    {
      role: 'Director',
      reports: [
        { id: 'department-overview', name: 'Department Requests Overview', description: 'Department-wide request tracking with team member breakdown', dataPoints: 'Total, By Requester, Status, Service Type, Approval Rate', status: 'available', phase: '1', rolePath: 'director', category: 'governance' },
        { id: 'team-performance', name: 'Team Performance Report', description: 'Track team member request activity and performance metrics', dataPoints: 'Per Member, Approval Rate, Processing Time', status: 'coming-soon', phase: '2', rolePath: 'director', category: 'operational' },
        { id: 'pending-approvals', name: 'Pending Approvals Report', description: 'Track requests awaiting director approval with priority indicators', dataPoints: 'Request Details, Days Pending, Priority', status: 'coming-soon', phase: '2', rolePath: 'director', category: 'governance' },
        { id: 'department-service-analysis', name: 'Department Service Analysis', description: 'Analyze service types and trends in department', dataPoints: 'Service Distribution, Client Distribution, Trends', status: 'coming-soon', phase: '2', rolePath: 'director', category: 'operational' },
        // CRM Reports for Director (sales cycle participant)
        { id: 'lead-source-effectiveness', name: 'Lead Source Effectiveness', description: 'Analyze which lead sources generate the most conversions', dataPoints: 'Lead Source, Prospects, Conversions, Conversion Rate', status: 'available', phase: '1', rolePath: 'director', category: 'operational' },
        { id: 'funnel-performance', name: 'Funnel Performance', description: 'Track prospect progression through the sales funnel', dataPoints: 'Stage, Count, Drop-off Rate, Avg Time in Stage', status: 'available', phase: '1', rolePath: 'director', category: 'operational' },
        { id: 'insights-to-conversion', name: 'Insights to Conversion', description: 'Track effectiveness of AI-generated insights', dataPoints: 'Insights Generated, Acted Upon, Converted', status: 'available', phase: '1', rolePath: 'director', category: 'operational' },
        { id: 'attribution-by-user', name: 'Attribution by User', description: 'Track conversions attributed to each user', dataPoints: 'User, Conversions, Avg Time, Success Rate', status: 'available', phase: '1', rolePath: 'director', category: 'operational' },
        { id: 'pipeline-forecast', name: 'Pipeline Forecast', description: 'Forecast expected conversions based on current pipeline', dataPoints: 'Stage, Count, Probability, Expected Conversions', status: 'available', phase: '1', rolePath: 'director', category: 'operational' },
        { id: 'conversion-trends', name: 'Conversion Trends', description: 'Monthly conversion trends over time', dataPoints: 'Month, Conversions, Rate, Trend Direction', status: 'available', phase: '1', rolePath: 'director', category: 'operational' },
        { id: 'period-comparison', name: 'Period Comparison', description: 'Compare current vs previous period performance', dataPoints: 'Metric, Current, Previous, Change %', status: 'available', phase: '1', rolePath: 'director', category: 'operational' },
        { id: 'lost-prospect-analysis', name: 'Lost Prospect Analysis', description: 'Analyze why prospects were lost', dataPoints: 'Reason, Count, Stage Lost, Lead Source', status: 'available', phase: '1', rolePath: 'director', category: 'operational' }
      ]
    },
    {
      role: 'Compliance',
      reports: [
        { id: 'review-summary', name: 'Compliance Review Summary', description: 'Overview of all compliance reviews with conflicts and duplications', dataPoints: 'Pending Reviews, Conflicts, Duplications, Approval Rate', status: 'available', phase: '1', rolePath: 'compliance', category: 'governance' },
        { id: 'conflict-analysis', name: 'Conflict Analysis Report', description: 'Detailed conflict and duplication analysis with resolution status', dataPoints: 'Flagged Conflicts, Duplication Matches, Resolution', status: 'available', phase: '1', rolePath: 'compliance', category: 'governance' },
        { id: 'service-conflict-matrix', name: 'Service Conflict Matrix', description: 'Visual matrix of service conflicts by client with risk levels', dataPoints: 'Client List, Service Types, Conflict Indicators', status: 'coming-soon', phase: '2', rolePath: 'compliance', category: 'governance' },
        { id: 'global-clearance', name: 'Global Clearance Report', description: 'Track international operations requiring global clearance', dataPoints: 'International Requests, Clearance Status, Member Firm', status: 'coming-soon', phase: '2', rolePath: 'compliance', category: 'governance' },
        { id: 'compliance-decision', name: 'Compliance Decision Report', description: 'Track all compliance decisions with notes and restrictions', dataPoints: 'Decisions, Dates, Notes, Restrictions', status: 'coming-soon', phase: '2', rolePath: 'compliance', category: 'governance' },
        { id: 'duplication-detection', name: 'Duplication Detection Report', description: 'Detailed duplication matches with scores and actions', dataPoints: 'Matches, Scores, Reasons, Actions', status: 'coming-soon', phase: '2', rolePath: 'compliance', category: 'governance' }
      ]
    },
    {
      role: 'Partner',
      reports: [
        { id: 'pending-approvals', name: 'Pending Partner Approvals', description: 'Requests awaiting partner approval with compliance decisions', dataPoints: 'Request Details, Compliance Decision, Days Pending', status: 'available', phase: '1', rolePath: 'partner', category: 'governance' },
        { id: 'dashboard-summary', name: 'Partner Dashboard Summary', description: 'High-level overview with pending approvals and key metrics', dataPoints: 'Pending, Active Proposals, Engagements, Expiring', status: 'coming-soon', phase: '2', rolePath: 'partner', category: 'operational' },
        { id: 'active-engagements', name: 'Active Engagements Report', description: 'All active engagements overview with renewal dates', dataPoints: 'Engagement Code, Client, Dates, Status, Renewal', status: 'available', phase: '1', rolePath: 'partner', category: 'operational' },
        { id: 'expiring-engagements', name: 'Expiring Engagements Report', description: 'Engagements approaching renewal/expiry with action required', dataPoints: 'Expiry Date, Days Until, Renewal Status, Action', status: 'coming-soon', phase: '2', rolePath: 'partner', category: 'governance' },
        { id: 'approval-history', name: 'Partner Approval History', description: 'Track partner approval decisions with notes and restrictions', dataPoints: 'Decisions, Dates, Notes, Restrictions', status: 'coming-soon', phase: '2', rolePath: 'partner', category: 'governance' }
      ]
    },
    {
      role: 'Finance',
      reports: [
        { id: 'engagement-code-summary', name: 'Engagement Code Summary', description: 'Overview of engagement codes generated by service type and status', dataPoints: 'Total Codes, By Service Type, Status, Queue', status: 'available', phase: '1', rolePath: 'finance', category: 'governance' }
      ]
    },
    {
      role: 'Admin',
      reports: [
        { id: 'system-overview', name: 'System Overview Report', description: 'Complete system status with health metrics and alerts', dataPoints: 'Total Requests, Active Engagements, Alerts, Renewals', status: 'available', phase: '1', rolePath: 'admin', category: 'governance' },
        { id: 'prospect-conversion', name: 'Prospect Conversion Report', description: 'Track prospect to client conversion ratio and timeline', dataPoints: 'Total Prospects, Converted, Conversion Ratio, Timeline', status: 'available', phase: '1', rolePath: 'admin', category: 'operational' },
        { id: 'approval-workflow', name: 'Approval Workflow Report', description: 'Request counts by workflow stage for bottleneck analysis', dataPoints: 'By Stage, Total Requests', status: 'available', phase: '1', rolePath: 'admin', category: 'operational' },
        { id: 'sla-compliance', name: 'SLA Compliance Report', description: 'SLA breach and on-time counts by department and stage', dataPoints: 'Breached, On Time, By Department, By Stage', status: 'available', phase: '1', rolePath: 'admin', category: 'governance' },
        { id: 'conflict-analysis', name: 'Conflict Analysis Report', description: 'Detailed conflict and duplication analysis with resolution status', dataPoints: 'Flagged Conflicts, Duplication Matches, Resolution', status: 'available', phase: '1', rolePath: 'admin', category: 'governance' },
        { id: 'active-engagements', name: 'Active Engagements Report', description: 'All active engagements overview with renewal dates', dataPoints: 'Engagement Code, Client, Dates, Status, Renewal', status: 'available', phase: '1', rolePath: 'admin', category: 'operational' },
        { id: 'execution-tracking', name: 'Execution Tracking Report', description: 'Track proposal execution with 30-day deadline status', dataPoints: 'Execution Status, Dates, Deadline Status, Letter Status', status: 'coming-soon', phase: '2', rolePath: 'admin', category: 'governance' },
        { id: 'monitoring-alerts', name: 'Monitoring Alerts Report', description: 'All monitoring alerts with types and action taken', dataPoints: 'Alert Type, Dates, Days in Monitoring, Actions', status: 'coming-soon', phase: '2', rolePath: 'admin', category: 'governance' },
        { id: 'renewals-due', name: 'Renewals Due Report', description: 'Engagements requiring renewal with days until renewal', dataPoints: 'Engagement Code, Client, Renewal Date, Days Until', status: 'coming-soon', phase: '2', rolePath: 'admin', category: 'governance' },
        { id: '30-day-deadline-tracking', name: '30-Day Deadline Tracking', description: 'Monitor 30-day proposal deadlines and engagement letters', dataPoints: 'Execution Date, Deadline, Days Remaining, Status', status: 'coming-soon', phase: '2', rolePath: 'admin', category: 'governance' },
        { id: 'workflow-performance', name: 'Workflow Performance Report', description: 'Analyze workflow efficiency with bottlenecks and trends', dataPoints: 'Processing Time, Bottlenecks, Department Performance', status: 'coming-soon', phase: '2', rolePath: 'admin', category: 'operational' },
        { id: 'system-activity', name: 'System Activity Report', description: 'Overall system activity with user and department metrics', dataPoints: 'Requests Created, Approvals, Rejections, User Activity', status: 'coming-soon', phase: '2', rolePath: 'admin', category: 'operational' }
      ]
    },
    {
      role: 'Super Admin',
      reports: [
        { id: 'system-overview', name: 'System Overview Report', description: 'Complete system status with health metrics and alerts', dataPoints: 'Total Requests, Active Engagements, Alerts, Renewals', status: 'available', phase: '1', rolePath: 'admin', category: 'governance' },
        { id: 'prospect-conversion', name: 'Prospect Conversion Report', description: 'Track prospect to client conversion ratio and timeline', dataPoints: 'Total Prospects, Converted, Conversion Ratio, Timeline', status: 'available', phase: '1', rolePath: 'admin', category: 'operational' },
        { id: 'approval-workflow', name: 'Approval Workflow Report', description: 'Request counts by workflow stage for bottleneck analysis', dataPoints: 'By Stage, Total Requests', status: 'available', phase: '1', rolePath: 'admin', category: 'operational' },
        { id: 'sla-compliance', name: 'SLA Compliance Report', description: 'SLA breach and on-time counts by department and stage', dataPoints: 'Breached, On Time, By Department, By Stage', status: 'available', phase: '1', rolePath: 'admin', category: 'governance' },
        { id: 'department-performance', name: 'Department Performance Report', description: 'Compare department performance with approval rates', dataPoints: 'Department, Requests, Approval Rate, Processing Time', status: 'available', phase: '1', rolePath: 'admin', category: 'operational' },
        { id: 'conflict-analysis', name: 'Conflict Analysis Report', description: 'Detailed conflict and duplication analysis with resolution status', dataPoints: 'Flagged Conflicts, Duplication Matches, Resolution', status: 'available', phase: '1', rolePath: 'admin', category: 'governance' },
        { id: 'active-engagements', name: 'Active Engagements Report', description: 'All active engagements overview with renewal dates', dataPoints: 'Engagement Code, Client, Dates, Status, Renewal', status: 'available', phase: '1', rolePath: 'admin', category: 'operational' },
        { id: 'system-wide-analytics', name: 'System-Wide Analytics Report', description: 'Complete system overview with all metrics from all roles', dataPoints: 'All Metrics, Statistics, User Activity, Performance', status: 'coming-soon', phase: '2', rolePath: 'admin', category: 'operational' },
        { id: 'user-activity', name: 'User Activity Report', description: 'Track user activity across system with login and action data', dataPoints: 'User, Role, Requests, Approvals, Last Login', status: 'coming-soon', phase: '2', rolePath: 'admin', category: 'operational' },
        { id: 'department-performance', name: 'Department Performance Report', description: 'Compare department performance with approval rates', dataPoints: 'Department, Requests, Approval Rate, Processing Time', status: 'available', phase: '1', rolePath: 'admin', category: 'operational' },
        { id: 'business-rules', name: 'Business Rules Report', description: 'Track business rules usage with impact analysis', dataPoints: 'Rule Name, Times Triggered, Actions, Impact', status: 'coming-soon', phase: '2', rolePath: 'admin', category: 'operational' },
        { id: 'audit-trail', name: 'Audit Trail Report', description: 'Complete audit log with all actions and timestamps', dataPoints: 'Action Type, User, Entity, Timestamp, Details', status: 'coming-soon', phase: '2', rolePath: 'admin', category: 'governance' },
        { id: 'system-configuration', name: 'System Configuration Report', description: 'System settings and configuration details', dataPoints: 'Active Features, Settings, Form Versions, Workflow', status: 'coming-soon', phase: '2', rolePath: 'admin', category: 'operational' }
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
    toast.warning('This report is planned for Phase 2 and is not yet available.')
  }
}

const currentPage = ref(1)
const pageSize = ref(50)
const totalPages = ref(1)
const totalItems = ref(0)
const sortColumn = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')
const retryCount = ref(0)
const MAX_RETRIES = 3
const tableSearch = ref('')
const tableStatusFilter = ref('')
const tableServiceTypeFilter = ref('')

// Row selection state
const selectedRowIndices = ref<number[]>([])
const selectAll = ref(false)

// Computed for selection count (reactive)
const selectedRowCount = computed(() => selectedRowIndices.value.length)

// Helper to check if a row is selected
function isRowSelected(index: number): boolean {
  return selectedRowIndices.value.includes(index)
}

async function loadReportData(page = 1, retry = 0) {
  if (!selectedReport.value) return
  
  loading.value = true
  error.value = null
  currentPage.value = page
  
  try {
    const rolePath = getRolePath()
    const requestFilters = {
      ...filters.value,
      page: page,
      pageSize: pageSize.value,
      includeData: true
    }
    const data = await getReportData(rolePath, selectedReport.value, requestFilters)
    reportData.value = data
    retryCount.value = 0 // Reset on success
    
    // Update pagination info
    if (data.pagination) {
      currentPage.value = data.pagination.currentPage
      totalPages.value = data.pagination.totalPages
      totalItems.value = data.pagination.totalItems
    }
  } catch (err: any) {
    const errorMessage = err.response?.data?.error || err.message || 'Failed to load report data'
    
    // Retry logic with exponential backoff
    if (retry < MAX_RETRIES && (err.response?.status >= 500 || !err.response)) {
      retryCount.value = retry + 1
      const delay = Math.pow(2, retry) * 1000 // 1s, 2s, 4s
      
      toast.warning(`Retrying... (${retryCount.value}/${MAX_RETRIES})`)
      
      setTimeout(() => {
        loadReportData(page, retry + 1)
      }, delay)
      return
    }
    
    // Specific error messages
    if (err.response?.status === 429) {
      error.value = 'Rate limit exceeded. Please wait a moment and try again.'
    } else if (err.response?.status === 400) {
      error.value = err.response?.data?.errors?.join(', ') || err.response?.data?.error || 'Invalid request parameters'
    } else if (err.response?.status === 403) {
      error.value = 'You do not have permission to access this report.'
    } else if (err.response?.status === 404) {
      error.value = 'Report not found. Please select a different report.'
    } else if (!err.response) {
      error.value = 'Network error. Please check your connection and try again.'
    } else {
      error.value = errorMessage
    }
    
    console.error('Error loading report:', err)
    toast.error(error.value ?? 'Error loading report')
  } finally {
    if (retry === 0 || retry >= MAX_RETRIES) {
      loading.value = false
    }
  }
}

function retryLoadReport() {
  retryCount.value = 0
  loadReportData(currentPage.value, 0)
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    loadReportData(page)
  }
}

function changePageSize(newSize: number) {
  pageSize.value = Math.min(500, Math.max(10, newSize))
  currentPage.value = 1
  loadReportData(1)
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
    toast.error(err.response?.data?.error || 'Failed to export PDF. Please try again.')
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
    toast.error(err.response?.data?.error || 'Failed to export Excel. Please try again.')
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

function sortTable(column: string) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
  
  if (reportData.value?.requests) {
    reportData.value.requests.sort((a: any, b: any) => {
      const aVal = a[column]
      const bVal = b[column]
      
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      
      let comparison = 0
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }
      
      return sortDirection.value === 'asc' ? comparison : -comparison
    })
  }
}

function getSortIcon(column: string) {
  if (sortColumn.value !== column) {
    return 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'
  }
  return sortDirection.value === 'asc' 
    ? 'M5 15l7-7 7 7' 
    : 'M19 9l-7 7-7-7'
}

// Table filtering computed properties
const hasStatusColumn = computed(() => {
  if (!reportData.value?.requests || reportData.value.requests.length === 0) return false
  return 'status' in reportData.value.requests[0]
})

const hasServiceTypeColumn = computed(() => {
  if (!reportData.value?.requests || reportData.value.requests.length === 0) return false
  return 'service_type' in reportData.value.requests[0]
})

const filteredTableData = computed(() => {
  if (!reportData.value?.requests) return []
  
  let filtered = [...reportData.value.requests]
  
  // Apply search filter
  if (tableSearch.value) {
    const searchLower = tableSearch.value.toLowerCase()
    filtered = filtered.filter(row => {
      return Object.values(row).some(val => 
        val && String(val).toLowerCase().includes(searchLower)
      )
    })
  }
  
  // Apply status filter
  if (tableStatusFilter.value && hasStatusColumn.value) {
    filtered = filtered.filter(row => row.status === tableStatusFilter.value)
  }
  
  // Apply service type filter
  if (tableServiceTypeFilter.value && hasServiceTypeColumn.value) {
    const serviceTypeLower = tableServiceTypeFilter.value.toLowerCase()
    filtered = filtered.filter(row => 
      row.service_type && String(row.service_type).toLowerCase().includes(serviceTypeLower)
    )
  }
  
  // Apply sorting
  if (sortColumn.value) {
    const sortCol = sortColumn.value
    filtered.sort((a, b) => {
      const aVal = a[sortCol]
      const bVal = b[sortCol]
      
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection.value === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection.value === 'asc' ? aVal - bVal : bVal - aVal
      }
      
      return 0
    })
  }
  
  return filtered
})

function clearTableFilters() {
  tableSearch.value = ''
  tableStatusFilter.value = ''
  tableServiceTypeFilter.value = ''
}

// Row selection functions
function toggleRowSelection(index: number) {
  const idx = selectedRowIndices.value.indexOf(index)
  if (idx > -1) {
    selectedRowIndices.value.splice(idx, 1)
  } else {
    selectedRowIndices.value.push(index)
  }
  // Update selectAll state
  selectAll.value = filteredTableData.value.length > 0 && 
    filteredTableData.value.every((_, i) => selectedRowIndices.value.includes(i))
}

function toggleSelectAll() {
  if (selectAll.value) {
    // Deselect all
    selectedRowIndices.value = []
    selectAll.value = false
  } else {
    // Select all filtered rows
    selectedRowIndices.value = filteredTableData.value.map((_, index) => index)
    selectAll.value = true
  }
}

function clearSelection() {
  selectedRowIndices.value = []
  selectAll.value = false
}

function getSelectedData() {
  return filteredTableData.value.filter((_, index) => selectedRowIndices.value.includes(index))
}

async function exportSelectedToExcel() {
  const selected = getSelectedData()
  if (selected.length === 0) {
    toast.warning('No rows selected for export')
    return
  }
  
  exporting.value = 'excel'
  try {
    // Create a simple CSV export for selected data
    const headers = getTableHeaders(selected[0])
    const csvContent = [
      headers.join(','),
      ...selected.map(row => 
        headers.map(h => {
          const val = row[h] || ''
          // Escape commas and quotes
          return typeof val === 'string' && (val.includes(',') || val.includes('"'))
            ? `"${val.replace(/"/g, '""')}"`
            : val
        }).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const filename = `selected_${selectedReport.value}_${new Date().toISOString().split('T')[0]}.csv`
    downloadBlob(blob, filename)
    
    toast.success(`Exported ${selected.length} selected rows`)
  } catch (err: any) {
    toast.error('Failed to export selected data')
    console.error('Export error:', err)
  } finally {
    exporting.value = null
  }
}

// Watch for filter changes to reset selection
watch([tableSearch, tableStatusFilter, tableServiceTypeFilter], () => {
  clearSelection()
})

function navigateToRequest(row: any) {
  // Navigate to request detail if request_id exists
  if (row.request_id) {
    window.location.href = `/coi/requests/${row.request_id}`
  }
}

// Chart click handlers
function handleStatusClick(status: string) {
  tableStatusFilter.value = status
  tableSearch.value = ''
}

function handleServiceTypeClick(serviceType: string) {
  tableServiceTypeFilter.value = serviceType
  tableSearch.value = ''
}

function handleClientClick(clientName: string) {
  tableSearch.value = clientName
}

function getReportTitle(): string {
  const report = availableReports.value.find(r => r.id === selectedReport.value)
  return report?.name || 'Report'
}

function formatTableValue(value: any, header: string): string {
  if (value === null || value === undefined) return '—'
  
  // Format booleans
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  
  // Format numbers (including 0 and 1 that might be booleans)
  if (typeof value === 'number') {
    // Check if it's likely a boolean (0 or 1) based on header
    if ((value === 0 || value === 1) && (header.includes('is_') || header.includes('has_') || header.includes('active') || header.includes('approved'))) {
      return value === 1 ? 'Yes' : 'No'
    }
    return value.toLocaleString()
  }
  
  // Format dates
  if (header.includes('date') || header.includes('Date') || header.includes('_at') || header.includes('created') || header.includes('updated') || header.includes('time')) {
    if (typeof value === 'string' && (value.includes('T') || value.includes('-'))) {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        }
      } catch (e) {
        // If date parsing fails, return original value
      }
    }
  }
  
  // Format status values with badges (return plain text for table, but formatted)
  if (header.toLowerCase().includes('status')) {
    return String(value)
  }
  
  // Format objects - try to make them readable
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : '—'
    }
    // For objects, show key-value pairs if small, otherwise stringify
    const keys = Object.keys(value)
    if (keys.length <= 3) {
      return keys.map(k => `${k}: ${value[k]}`).join(', ')
    }
    return JSON.stringify(value)
  }
  
  return String(value)
}

function getVisiblePages(): number[] {
  const pages: number[] = []
  const maxVisible = 7
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
}

function printReport() {
  if (!reportData.value) {
    toast.warning('No report data available to print')
    return
  }

  // Close preview modal if open
  showPrintPreview.value = false

  // Create print window
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    toast.error('Please allow popups to print the report')
    return
  }

  const reportTitle = getReportTitle()
  const reportDate = new Date().toLocaleString()

  // Build HTML content
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportTitle} - ${new Date().toLocaleDateString()}</title>
      <style>
        @media print {
          @page {
            margin: 1cm;
            size: A4;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #1f2937;
        }
        h1 {
          color: #1f2937;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 10px;
          margin-bottom: 20px;
          font-size: 24px;
        }
        h2 {
          color: #374151;
          margin-top: 30px;
          margin-bottom: 15px;
          font-size: 18px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 5px;
        }
        .report-header {
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e5e7eb;
        }
        .report-header p {
          margin: 5px 0;
          font-size: 12px;
          color: #6b7280;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          margin-bottom: 30px;
          font-size: 11px;
        }
        th {
          background-color: #f3f4f6;
          text-align: left;
          padding: 10px;
          border: 1px solid #d1d5db;
          font-weight: 600;
          color: #374151;
        }
        td {
          padding: 8px 10px;
          border: 1px solid #d1d5db;
          color: #1f2937;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        .summary-card {
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 15px;
          background-color: #ffffff;
        }
        .summary-card h3 {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .summary-card .value {
          font-size: 20px;
          font-weight: bold;
          color: #1f2937;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #d1d5db;
          color: #6b7280;
          font-size: 10px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <h1>${reportTitle}</h1>
        <p><strong>Generated:</strong> ${reportDate}</p>
        <p><strong>Role:</strong> ${user.value?.role || 'N/A'}</p>
        ${filters.value.dateFrom || filters.value.dateTo ? `
        <p><strong>Date Range:</strong> ${filters.value.dateFrom || 'All'} to ${filters.value.dateTo || 'All'}</p>
        ` : ''}
      </div>
  `

  // Add Summary Section
  if (reportData.value.summary) {
    html += `
      <h2>Executive Summary</h2>
      <div class="summary-grid">
    `
    
    Object.keys(reportData.value.summary).forEach(key => {
      const value = reportData.value!.summary[key]
      html += `
        <div class="summary-card">
          <h3>${formatKey(key)}</h3>
      `
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.keys(value).forEach(subKey => {
          html += `
            <div style="margin-bottom: 5px;">
              <span style="color: #6b7280;">${subKey}:</span>
              <span style="font-weight: 600; margin-left: 5px;">${value[subKey]}</span>
            </div>
          `
        })
      } else {
        html += `<div class="value">${formatValue(value)}</div>`
      }
      
      html += `</div>`
    })
    
    html += `</div>`
  }

  // Add Requests Table
  if (reportData.value.requests && reportData.value.requests.length > 0) {
    const headers = getTableHeaders(reportData.value.requests[0])
    html += `
      <h2>Request Details (${reportData.value.requests.length} records)</h2>
      <table>
        <thead>
          <tr>
    `
    
    headers.forEach(header => {
      html += `<th>${formatKey(header)}</th>`
    })
    
    html += `
          </tr>
        </thead>
        <tbody>
    `
    
    reportData.value.requests.forEach((row: any, index: number) => {
      html += `<tr${index % 2 === 0 ? '' : ' style="background-color: #f9fafb;"'}>`
      headers.forEach(header => {
        html += `<td>${formatTableValue(row[header], header)}</td>`
      })
      html += `</tr>`
    })
    
    html += `
        </tbody>
      </table>
    `
  }

  // Add Footer
  html += `
      <div class="footer">
        <p>This report was generated from the COI System on ${new Date().toLocaleString()}</p>
        <p>For questions or concerns, please contact the Compliance Department.</p>
      </div>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()

  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.print()
  }, 250)
}

onMounted(() => {
  // Check for query parameters from chart clicks
  const query = route.query
  
  if (query.report) {
    // Set the selected report
    selectedReport.value = query.report as string
    showCatalog.value = false
    
    // Apply filters from query params
    if (query.status) {
      filters.value.status = query.status as string
    }
    if (query.serviceType) {
      filters.value.serviceType = query.serviceType as string
    }
    if (query.clientName) {
      // Note: We'd need to look up clientId from clientName
      // For now, we'll store it as a custom filter
      filters.value.clientName = query.clientName as string
    }
    if (query.clientId) {
      filters.value.clientId = parseInt(query.clientId as string)
    }
    
    // Load the report data with filters
    if (selectedReport.value) {
      loadReportData(1)
    }
  } else {
    // Auto-load first report if available
    if (availableReports.value.length > 0) {
      selectedReport.value = availableReports.value[0].id
    }
  }
})
</script>

<style scoped>
@media print {
  .print-preview-content {
    max-height: none;
    overflow: visible;
  }
  
  /* Hide non-printable elements */
  .no-print,
  button,
  .bg-gradient-to-r,
  .shadow-sm,
  .border-gray-200 {
    display: none !important;
  }
  
  /* Print-friendly layout */
  body {
    margin: 0;
    padding: 20px;
  }
  
  .col-span-4 {
    display: none;
  }
  
  .col-span-8 {
    width: 100%;
    max-width: 100%;
  }
  
  /* Ensure tables print properly */
  table {
    page-break-inside: auto;
  }
  
  tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }
  
  thead {
    display: table-header-group;
  }
  
  tfoot {
    display: table-footer-group;
  }
}

.print-content {
  background: white;
  padding: 20px;
}

/* Responsive Design Improvements */
@media (max-width: 1024px) {
  .grid-cols-12 {
    grid-template-columns: 1fr;
  }
  
  .lg\\:col-span-4,
  .lg\\:col-span-8 {
    grid-column: span 1;
  }
  
  .chart-container {
    overflow-x: auto;
  }
}

@media (max-width: 768px) {
  table {
    font-size: 0.875rem;
    min-width: 100%;
  }
  
  th, td {
    padding: 0.5rem 0.75rem;
  }
  
  .flex.items-center.gap-3 {
    flex-wrap: wrap;
  }
  
  .overflow-x-auto {
    -webkit-overflow-scrolling: touch;
  }
}
</style>
