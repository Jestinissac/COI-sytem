# International Operations Section - Design Options

## Option 1: Card-Based Design with Expandable Countries
**Best for:** Clean, organized view with clear hierarchy

```vue
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
    <!-- Toggle for International Operations -->
    <div>
      <label class="flex items-center">
        <input 
          type="checkbox" 
          v-model="formData.international_operations"
          class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <span class="ml-2 text-sm font-medium text-gray-700">Client has international operations</span>
      </label>
    </div>

    <!-- Countries List (shown when international_operations is true) -->
    <div v-if="formData.international_operations" class="space-y-4">
      <!-- Add Country Button -->
      <button
        type="button"
        @click="addCountry"
        class="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Add Country
      </button>

      <!-- Country Cards -->
      <div v-for="(country, countryIndex) in formData.international_countries" :key="countryIndex" 
           class="border border-gray-200 rounded-lg overflow-hidden">
        <!-- Country Header (Collapsible) -->
        <div 
          @click="toggleCountry(countryIndex)"
          class="px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
        >
          <div class="flex items-center space-x-3">
            <svg 
              :class="['w-5 h-5 text-gray-400 transition-transform', country.expanded ? 'rotate-90' : '']"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
            <span class="font-medium text-gray-900">
              {{ getCountryName(country.country_code) || 'Select Country' }}
            </span>
            <span v-if="country.entities && country.entities.length > 0" 
                  class="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              {{ country.entities.length }} {{ country.entities.length === 1 ? 'entity' : 'entities' }}
            </span>
          </div>
          <button
            type="button"
            @click.stop="removeCountry(countryIndex)"
            class="text-red-600 hover:text-red-700 p-1"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Country Content (Expandable) -->
        <div v-show="country.expanded" class="p-4 space-y-4 bg-white">
          <!-- Country Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Country <span class="text-red-500">*</span></label>
            <select
              v-model="country.country_code"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select country...</option>
              <option v-for="c in countries" :key="c.id" :value="c.country_code">
                {{ c.country_name }}
              </option>
            </select>
          </div>

          <!-- Entity Type Indicator -->
          <div v-if="formData.group_structure === 'has_parent'" 
               class="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div class="flex items-start">
              <svg class="w-5 h-5 text-amber-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div class="text-sm text-amber-800">
                <p class="font-medium">Parent Company Context</p>
                <p class="text-xs mt-1">Based on group structure, enter parent company details for this country.</p>
              </div>
            </div>
          </div>

          <!-- Entities List -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="block text-sm font-medium text-gray-700">
                {{ formData.group_structure === 'has_parent' ? 'Parent Company' : 'Subsidiaries' }}
              </label>
              <button
                type="button"
                @click="addEntity(countryIndex)"
                class="flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Add {{ formData.group_structure === 'has_parent' ? 'Parent Company' : 'Subsidiary' }}
              </button>
            </div>

            <!-- Entity Items -->
            <div v-for="(entity, entityIndex) in country.entities" :key="entityIndex"
                 class="p-3 border border-gray-200 rounded-md bg-gray-50">
              <div class="flex items-start justify-between">
                <div class="flex-1 space-y-2">
                  <input
                    v-model="entity.name"
                    type="text"
                    :placeholder="formData.group_structure === 'has_parent' ? 'Parent company name...' : 'Subsidiary name...'"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <textarea
                    v-model="entity.details"
                    rows="2"
                    placeholder="Additional details (optional)..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  type="button"
                  @click="removeEntity(countryIndex, entityIndex)"
                  class="ml-3 text-red-600 hover:text-red-700 p-1"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="!country.entities || country.entities.length === 0" 
                 class="text-center py-4 text-sm text-gray-500 border border-dashed border-gray-300 rounded-md">
              No {{ formData.group_structure === 'has_parent' ? 'parent companies' : 'subsidiaries' }} added yet. Click "+" to add.
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State for Countries -->
      <div v-if="!formData.international_countries || formData.international_countries.length === 0"
           class="text-center py-8 text-sm text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
        <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p>No countries added yet.</p>
        <p class="text-xs mt-1">Click "Add Country" to get started.</p>
      </div>
    </div>

    <!-- Global Clearance Status (always visible when international_operations is true) -->
    <div v-if="formData.international_operations">
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
</section>
```

---

## Option 2: Table-Based Design with Inline Editing
**Best for:** Compact view, easy to scan multiple entries

```vue
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
    <!-- Toggle for International Operations -->
    <div>
      <label class="flex items-center">
        <input 
          type="checkbox" 
          v-model="formData.international_operations"
          class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <span class="ml-2 text-sm font-medium text-gray-700">Client has international operations</span>
      </label>
    </div>

    <!-- Countries and Entities Table (shown when international_operations is true) -->
    <div v-if="formData.international_operations" class="space-y-4">
      <!-- Add Country Button -->
      <div class="flex justify-end">
        <button
          type="button"
          @click="addCountry"
          class="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add Country
        </button>
      </div>

      <!-- Table View -->
      <div class="overflow-hidden border border-gray-200 rounded-lg">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {{ formData.group_structure === 'has_parent' ? 'Parent Company' : 'Subsidiaries' }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <!-- Country Rows -->
            <template v-for="(country, countryIndex) in formData.international_countries" :key="countryIndex">
              <!-- Main Country Row -->
              <tr class="bg-blue-50">
                <td class="px-4 py-3 whitespace-nowrap">
                  <select
                    v-model="country.country_code"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select country...</option>
                    <option v-for="c in countries" :key="c.id" :value="c.country_code">
                      {{ c.country_name }}
                    </option>
                  </select>
                </td>
                <td colspan="2" class="px-4 py-3">
                  <button
                    type="button"
                    @click="addEntity(countryIndex)"
                    class="flex items-center text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Add {{ formData.group_structure === 'has_parent' ? 'Parent Company' : 'Subsidiary' }}
                  </button>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-right">
                  <button
                    type="button"
                    @click="removeCountry(countryIndex)"
                    class="text-red-600 hover:text-red-700"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </td>
              </tr>
              
              <!-- Entity Rows (Sub-rows) -->
              <tr v-for="(entity, entityIndex) in country.entities" :key="entityIndex" class="bg-gray-50">
                <td class="px-4 py-2"></td>
                <td class="px-4 py-2">
                  <input
                    v-model="entity.name"
                    type="text"
                    :placeholder="formData.group_structure === 'has_parent' ? 'Parent company name...' : 'Subsidiary name...'"
                    class="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </td>
                <td class="px-4 py-2">
                  <input
                    v-model="entity.details"
                    type="text"
                    placeholder="Additional details..."
                    class="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </td>
                <td class="px-4 py-2 whitespace-nowrap text-right">
                  <button
                    type="button"
                    @click="removeEntity(countryIndex, entityIndex)"
                    class="text-red-600 hover:text-red-700"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </td>
              </tr>
              
              <!-- Empty Entity State -->
              <tr v-if="!country.entities || country.entities.length === 0" class="bg-gray-50">
                <td class="px-4 py-2"></td>
                <td colspan="3" class="px-4 py-2 text-sm text-gray-500 italic">
                  No {{ formData.group_structure === 'has_parent' ? 'parent companies' : 'subsidiaries' }} added yet
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <!-- Empty State -->
        <div v-if="!formData.international_countries || formData.international_countries.length === 0"
             class="text-center py-12 text-sm text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>No countries added yet. Click "Add Country" to get started.</p>
        </div>
      </div>

      <!-- Global Clearance Status -->
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
```

---

## Option 3: Accordion with Nested Cards
**Best for:** Maximum organization, clear visual hierarchy

```vue
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
    <!-- Toggle for International Operations -->
    <div>
      <label class="flex items-center">
        <input 
          type="checkbox" 
          v-model="formData.international_operations"
          class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <span class="ml-2 text-sm font-medium text-gray-700">Client has international operations</span>
      </label>
    </div>

    <!-- Countries Accordion (shown when international_operations is true) -->
    <div v-if="formData.international_operations" class="space-y-3">
      <!-- Add Country Button -->
      <button
        type="button"
        @click="addCountry"
        class="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-colors"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Add Country
      </button>

      <!-- Country Accordion Items -->
      <div v-for="(country, countryIndex) in formData.international_countries" :key="countryIndex"
           class="border border-gray-200 rounded-lg overflow-hidden">
        <!-- Accordion Header -->
        <button
          type="button"
          @click="toggleCountry(countryIndex)"
          class="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-colors flex items-center justify-between"
        >
          <div class="flex items-center space-x-3">
            <div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-medium text-sm">
              {{ countryIndex + 1 }}
            </div>
            <div class="text-left">
              <div class="font-medium text-gray-900">
                {{ getCountryName(country.country_code) || 'Select Country' }}
              </div>
              <div class="text-xs text-gray-500">
                {{ country.entities && country.entities.length > 0 
                  ? `${country.entities.length} ${country.entities.length === 1 ? 'entity' : 'entities'}` 
                  : 'No entities added' }}
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <svg 
              :class="['w-5 h-5 text-gray-400 transition-transform duration-200', country.expanded ? 'rotate-180' : '']"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
            <button
              type="button"
              @click.stop="removeCountry(countryIndex)"
              class="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </button>

        <!-- Accordion Content -->
        <div v-show="country.expanded" class="border-t border-gray-200 bg-white">
          <div class="p-4 space-y-4">
            <!-- Country Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Country <span class="text-red-500">*</span></label>
              <select
                v-model="country.country_code"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select country...</option>
                <option v-for="c in countries" :key="c.id" :value="c.country_code">
                  {{ c.country_name }}
                </option>
              </select>
            </div>

            <!-- Context Banner -->
            <div v-if="formData.group_structure === 'has_parent'" 
                 class="p-3 bg-gradient-to-r from-amber-50 to-amber-100 border-l-4 border-amber-400 rounded">
              <div class="flex items-start">
                <svg class="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div class="text-sm">
                  <p class="font-medium text-amber-900">Parent Company Context</p>
                  <p class="text-xs text-amber-700 mt-1">Enter parent company details for this country based on group structure.</p>
                </div>
              </div>
            </div>

            <!-- Entities Section -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-gray-900">
                  {{ formData.group_structure === 'has_parent' ? 'Parent Companies' : 'Subsidiaries' }}
                </h4>
                <button
                  type="button"
                  @click="addEntity(countryIndex)"
                  class="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Add
                </button>
              </div>

              <!-- Entity Cards -->
              <div class="space-y-2">
                <div v-for="(entity, entityIndex) in country.entities" :key="entityIndex"
                     class="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div class="flex items-start space-x-3">
                    <div class="flex-1 space-y-2">
                      <input
                        v-model="entity.name"
                        type="text"
                        :placeholder="formData.group_structure === 'has_parent' ? 'Parent company name...' : 'Subsidiary name...'"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      />
                      <textarea
                        v-model="entity.details"
                        rows="2"
                        placeholder="Additional details (registration, address, etc.)..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      @click="removeEntity(countryIndex, entityIndex)"
                      class="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Empty State -->
                <div v-if="!country.entities || country.entities.length === 0" 
                     class="p-4 text-center text-sm text-gray-500 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <svg class="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                  <p>No {{ formData.group_structure === 'has_parent' ? 'parent companies' : 'subsidiaries' }} added yet.</p>
                  <p class="text-xs mt-1">Click "+ Add" to add one.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State for Countries -->
      <div v-if="!formData.international_countries || formData.international_countries.length === 0"
           class="text-center py-12 text-sm text-gray-500 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p class="font-medium text-gray-700 mb-1">No countries added yet</p>
        <p class="text-xs">Click "Add Country" above to get started.</p>
      </div>
    </div>

    <!-- Global Clearance Status -->
    <div v-if="formData.international_operations">
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
</section>
```

---

## Required JavaScript Functions

All three options require these functions in the component:

```typescript
// Data structure
const formData = ref({
  // ... other fields
  international_operations: false,
  international_countries: [] as Array<{
    country_code: string
    expanded?: boolean
    entities: Array<{
      name: string
      details: string
    }>
  }>,
  global_clearance_status: 'Not Required'
})

// Functions
function addCountry() {
  formData.value.international_countries.push({
    country_code: '',
    expanded: true,
    entities: []
  })
}

function removeCountry(index: number) {
  formData.value.international_countries.splice(index, 1)
}

function toggleCountry(index: number) {
  formData.value.international_countries[index].expanded = 
    !formData.value.international_countries[index].expanded
}

function addEntity(countryIndex: number) {
  if (!formData.value.international_countries[countryIndex].entities) {
    formData.value.international_countries[countryIndex].entities = []
  }
  formData.value.international_countries[countryIndex].entities.push({
    name: '',
    details: ''
  })
}

function removeEntity(countryIndex: number, entityIndex: number) {
  formData.value.international_countries[countryIndex].entities.splice(entityIndex, 1)
}

function getCountryName(countryCode: string) {
  const country = countries.value.find(c => c.country_code === countryCode)
  return country?.country_name || ''
}
```

---

## Recommendation

**Option 3 (Accordion with Nested Cards)** is recommended because:
- ✅ Clear visual hierarchy
- ✅ Easy to scan multiple countries
- ✅ Expandable/collapsible reduces visual clutter
- ✅ Nested cards clearly show parent-subsidiary relationship
- ✅ Good for 2-3 entities per country
- ✅ Professional appearance
