<template>
  <div class="min-h-screen">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">PRMS Integration Demo</h1>
      <p class="text-gray-600 mt-1">Demonstrates the COI → PRMS integration and engagement code validation</p>
    </div>

    <!-- Key Constraint Explanation -->
    <div class="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl shadow-lg p-6 mb-8 text-white">
      <h2 class="text-xl font-bold mb-4">Database Constraint</h2>
      <p class="opacity-90 mb-4">
        The PRMS system has a database constraint that ensures projects can ONLY be created with valid Engagement Codes from the COI system.
      </p>
      <div class="bg-white/10 rounded-lg p-4 font-mono text-sm">
        <span class="text-yellow-300">CHECK</span> (engagement_code <span class="text-yellow-300">IN</span> (<span class="text-yellow-300">SELECT</span> engagement_code <span class="text-yellow-300">FROM</span> coi_engagement_codes <span class="text-yellow-300">WHERE</span> status = 'Active'))
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Engagement Code Validation -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
          <h2 class="text-lg font-bold text-white">Validate Engagement Code</h2>
        </div>
        <div class="p-6">
          <p class="text-gray-600 mb-4">Enter an engagement code to check if it's valid in the COI system.</p>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Engagement Code</label>
            <input
              type="text"
              v-model="validationCode"
              placeholder="e.g., ENG-2026-AUD-00001"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            @click="validateCode"
            :disabled="validating"
            class="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {{ validating ? 'Validating...' : 'Validate Code' }}
          </button>
          
          <!-- Validation Result -->
          <div v-if="validationResult" class="mt-4">
            <div
              :class="validationResult.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'"
              class="border rounded-lg p-4"
            >
              <div class="flex items-center gap-2 mb-2">
                <span :class="validationResult.valid ? 'text-green-600' : 'text-red-600'">
                  {{ validationResult.valid ? '✓' : '✗' }}
                </span>
                <span :class="validationResult.valid ? 'text-green-800' : 'text-red-800'" class="font-semibold">
                  {{ validationResult.valid ? 'Valid Engagement Code' : 'Invalid Engagement Code' }}
                </span>
              </div>
              <p :class="validationResult.valid ? 'text-green-600' : 'text-red-600'" class="text-sm">
                {{ validationResult.message }}
              </p>
              <div v-if="validationResult.details" class="mt-3 text-sm text-gray-600">
                <p><strong>Service Type:</strong> {{ validationResult.details.service_type }}</p>
                <p><strong>Status:</strong> {{ validationResult.details.status }}</p>
              </div>
            </div>
          </div>
          
          <!-- Quick Test Codes -->
          <div class="mt-6">
            <p class="text-sm font-medium text-gray-700 mb-2">Quick Test:</p>
            <div class="flex flex-wrap gap-2">
              <button
                @click="validationCode = 'ENG-2026-AUD-00001'; validateCode()"
                class="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full hover:bg-green-200"
              >
                Valid Code
              </button>
              <button
                @click="validationCode = 'ENG-2099-XXX-99999'; validateCode()"
                class="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full hover:bg-red-200"
              >
                Invalid Code
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Project Creation Simulation -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
          <h2 class="text-lg font-bold text-white">Simulate Project Creation</h2>
        </div>
        <div class="p-6">
          <p class="text-gray-600 mb-4">Try creating a PRMS project with different engagement codes.</p>
          
          <div class="space-y-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Project ID</label>
              <input
                type="text"
                v-model="newProject.projectId"
                placeholder="e.g., PROJ-2026-0001"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Engagement Code</label>
              <input
                type="text"
                v-model="newProject.engagementCode"
                placeholder="e.g., ENG-2026-AUD-00001"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Client Code</label>
              <input
                type="text"
                v-model="newProject.clientCode"
                placeholder="e.g., CLI-001"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <button
            @click="createProject"
            :disabled="creatingProject"
            class="w-full px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {{ creatingProject ? 'Creating...' : 'Create Project' }}
          </button>
          
          <!-- Creation Result -->
          <div v-if="creationResult" class="mt-4">
            <div
              :class="creationResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'"
              class="border rounded-lg p-4"
            >
              <div class="flex items-center gap-2 mb-2">
                <span :class="creationResult.success ? 'text-green-600' : 'text-red-600'">
                  {{ creationResult.success ? '✓' : '✗' }}
                </span>
                <span :class="creationResult.success ? 'text-green-800' : 'text-red-800'" class="font-semibold">
                  {{ creationResult.success ? 'Project Created Successfully' : 'Project Creation Failed' }}
                </span>
              </div>
              <p :class="creationResult.success ? 'text-green-600' : 'text-red-600'" class="text-sm">
                {{ creationResult.message }}
              </p>
            </div>
          </div>
          
          <!-- Quick Test Projects -->
          <div class="mt-6">
            <p class="text-sm font-medium text-gray-700 mb-2">Quick Test:</p>
            <div class="flex flex-wrap gap-2">
              <button
                @click="setValidProject"
                class="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full hover:bg-green-200"
              >
                Valid Project
              </button>
              <button
                @click="setInvalidProject"
                class="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full hover:bg-red-200"
              >
                Invalid Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Workflow Diagram -->
    <div class="bg-white rounded-xl shadow-lg overflow-hidden mt-6">
      <div class="bg-gradient-to-r from-gray-700 to-gray-900 px-6 py-4">
        <h2 class="text-lg font-bold text-white">Integration Workflow</h2>
      </div>
      <div class="p-6">
        <div class="flex flex-wrap items-center justify-center gap-4 text-center">
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-2">
              <span class="text-2xl" aria-hidden="true">Doc</span>
            </div>
            <span class="text-sm font-medium text-gray-900">COI Request</span>
            <span class="text-xs text-gray-500">Created</span>
          </div>
          
          <div class="text-gray-400 text-2xl">→</div>
          
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-2">
              <span class="text-2xl">✓</span>
            </div>
            <span class="text-sm font-medium text-gray-900">Approvals</span>
            <span class="text-xs text-gray-500">Director → Compliance → Partner</span>
          </div>
          
          <div class="text-gray-400 text-2xl">→</div>
          
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-2">
              <span class="text-2xl">🔢</span>
            </div>
            <span class="text-sm font-medium text-gray-900">Eng. Code</span>
            <span class="text-xs text-gray-500">Generated by Finance</span>
          </div>
          
          <div class="text-gray-400 text-2xl">→</div>
          
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-2">
              <span class="text-2xl" aria-hidden="true">Folder</span>
            </div>
            <span class="text-sm font-medium text-gray-900">PRMS Project</span>
            <span class="text-xs text-gray-500">Created with valid code</span>
          </div>
        </div>
        
        <div class="mt-6 p-4 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-600">
            <strong>Key Point:</strong> Without a valid Engagement Code from the COI system, PRMS will reject the project creation. 
            This ensures all projects go through the proper COI approval workflow before being created in PRMS.
          </p>
        </div>
      </div>
    </div>

    <!-- Active Engagement Codes List -->
    <div class="bg-white rounded-xl shadow-lg overflow-hidden mt-6">
      <div class="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
        <h2 class="text-lg font-bold text-white">Active Engagement Codes from COI</h2>
      </div>
      <div class="p-6">
        <div v-if="loadingCodes" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engagement Code</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service Type</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Use for Test</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="code in engagementCodes" :key="code.engagement_code" class="hover:bg-gray-50">
                <td class="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">{{ code.engagement_code }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{{ code.service_type }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{{ code.year }}</td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {{ code.status }}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <button
                    @click="useCodeForTest(code.engagement_code)"
                    class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Use
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useToast } from '@/composables/useToast'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import api from '@/services/api'

const { success, error, warning, info } = useToast()
function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info') {
  if (type === 'success') success(message)
  else if (type === 'error') error(message)
  else if (type === 'warning') warning(message)
  else info(message)
}

// Validation state
const validationCode = ref('')
const validating = ref(false)
const validationResult = ref<{ valid: boolean; message: string; details?: any } | null>(null)

// Project creation state
const newProject = reactive({
  projectId: '',
  engagementCode: '',
  clientCode: 'CLI-001'
})
const creatingProject = ref(false)
const creationResult = ref<{ success: boolean; message: string } | null>(null)

// Engagement codes
const engagementCodes = ref<any[]>([])
const loadingCodes = ref(true)

// Methods
async function validateCode() {
  if (!validationCode.value) {
    showToast('Please enter an engagement code', 'error')
    return
  }
  
  validating.value = true
  validationResult.value = null
  
  try {
    const response = await api.get(`/integration/validate-engagement-code/${validationCode.value}`)
    validationResult.value = {
      valid: response.data.valid,
      message: response.data.valid 
        ? 'This engagement code is valid and can be used for project creation.'
        : 'This engagement code is not valid or not active in the COI system.',
      details: response.data.details
    }
  } catch (error: any) {
    validationResult.value = {
      valid: false,
      message: error.response?.data?.error || 'Failed to validate engagement code'
    }
  } finally {
    validating.value = false
  }
}

async function createProject() {
  if (!newProject.projectId || !newProject.engagementCode || !newProject.clientCode) {
    showToast('Please fill in all fields', 'error')
    return
  }
  
  creatingProject.value = true
  creationResult.value = null
  
  try {
    // First validate the code
    const validationResponse = await api.get(`/integration/validate-engagement-code/${newProject.engagementCode}`)
    
    if (!validationResponse.data.valid) {
      creationResult.value = {
        success: false,
        message: `Database constraint violation: Engagement Code "${newProject.engagementCode}" is not valid or not active in the COI system. Project creation blocked.`
      }
      return
    }
    
    // Simulate project creation
    creationResult.value = {
      success: true,
      message: `Project "${newProject.projectId}" would be created successfully in PRMS with engagement code "${newProject.engagementCode}".`
    }
    showToast('Project creation simulated successfully', 'success')
  } catch (error: any) {
    creationResult.value = {
      success: false,
      message: error.response?.data?.error || 'Failed to create project'
    }
  } finally {
    creatingProject.value = false
  }
}

function setValidProject() {
  if (engagementCodes.value.length > 0) {
    newProject.projectId = `PROJ-2026-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`
    newProject.engagementCode = engagementCodes.value[0].engagement_code
    newProject.clientCode = 'CLI-001'
  }
}

function setInvalidProject() {
  newProject.projectId = `PROJ-2026-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`
  newProject.engagementCode = 'ENG-INVALID-CODE'
  newProject.clientCode = 'CLI-001'
}

function useCodeForTest(code: string) {
  newProject.engagementCode = code
  validationCode.value = code
  showToast(`Code "${code}" set for testing`, 'info')
}

async function fetchEngagementCodes() {
  loadingCodes.value = true
  try {
    const response = await api.get('/integration/engagement-codes')
    engagementCodes.value = response.data.slice(0, 10)
  } catch (error) {
    // Use mock data if API fails
    engagementCodes.value = [
      { engagement_code: 'ENG-2026-AUD-00001', service_type: 'AUD', year: 2026, status: 'Active' },
      { engagement_code: 'ENG-2026-TAX-00001', service_type: 'TAX', year: 2026, status: 'Active' },
      { engagement_code: 'ENG-2026-ADV-00001', service_type: 'ADV', year: 2026, status: 'Active' },
    ]
  } finally {
    loadingCodes.value = false
  }
}

onMounted(() => {
  fetchEngagementCodes()
})
</script>

