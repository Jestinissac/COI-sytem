<template>
  <div class="space-y-8">
    <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
      <KPICard title="Total Project Value" :value="totalProjectValue" format="currency" unit="KWD" />
      <KPICard title="Budget vs Actual (Δ)" :value="budgetDeltaPct + '%'" :trend="budgetDeltaPct" />
      <KPICard title="Projects On Track" :value="onTrackCount" />
      <KPICard title="At Risk" :value="atRiskCount" status="warning" />
      <KPICard title="Pending Approvals" :value="pendingApprovals" status="warning" />
    </div>

    <!-- New Projects and Clients Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">New Projects This Month</h3>
        <div class="space-y-3 max-h-64 overflow-y-auto">
          <div v-for="project in newProjectsThisMonth" :key="project.projectId" 
               class="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
               @click="handleProjectClick(project)">
            <div>
              <div class="font-medium text-blue-600">{{ project.projectName }}</div>
              <div class="text-xs text-gray-500">{{ getClientName(project.client) }} • {{ project.serviceLine }}</div>
              <div class="text-xs text-gray-400">Started: {{ formatDate(project.startDate) }}</div>
            </div>
            <div class="text-right">
              <div class="text-sm font-semibold">{{ formatCurrency(project.projectValue) }}</div>
              <div class="text-xs text-gray-500">{{ project.phase }}</div>
            </div>
          </div>
          <div v-if="newProjectsThisMonth.length === 0" class="text-center text-gray-500 py-4">
            No new projects this month
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">New Clients This Month</h3>
        <div class="space-y-3 max-h-64 overflow-y-auto">
          <div v-for="client in newClientsThisMonth" :key="client.clientId" 
               class="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
               @click="handleClientClick(client)">
            <div>
              <div class="font-medium text-green-600">{{ client.clientName }}</div>
              <div class="text-xs text-gray-500">{{ client.industry }}</div>
              <div class="text-xs text-gray-400">Added: {{ formatDate(client.createdDate) }}</div>
            </div>
            <div class="text-right">
              <div class="text-sm font-semibold">{{ getClientProjectCount(client.clientId) }} projects</div>
              <div class="text-xs text-gray-500">{{ getClientRiskLevel(client.risk || 'Low') }}</div>
            </div>
          </div>
          <div v-if="newClientsThisMonth.length === 0" class="text-center text-gray-500 py-4">
            No new clients this month
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-white p-6 rounded-lg shadow-sm h-80">
        <h3 class="text-lg font-semibold mb-4">Portfolio Financials</h3>
        <BarChart :data="portfolioFinancialsData" />
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm h-80">
        <h3 class="text-lg font-semibold mb-4">Project Status Distribution</h3>
        <DoughnutChart :data="statusDistributionData" />
      </div>
    </div>

    <!-- Missing Timesheets Section -->
    <div class="bg-white p-6 rounded-lg shadow-sm">
      <h3 class="text-lg font-semibold mb-4">Missing Timesheets</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Entry</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Missing</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="entry in missingTimesheets" :key="`${entry.employeeName}-${entry.projectName}`" 
                class="hover:bg-gray-50 cursor-pointer transition-colors"
                @click="handleTimesheetClick">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ entry.employeeName }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ entry.projectName }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(entry.lastEntry) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ entry.daysMissing }} days</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getTimesheetStatusClass(entry.daysMissing)">
                  {{ getTimesheetStatus(entry.daysMissing) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="missingTimesheets.length === 0" class="text-center text-gray-500 py-8">
          All timesheets are up to date
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-white p-6 rounded-lg shadow-sm h-80">
        <h3 class="text-lg font-semibold mb-4">Overall Resource Utilization</h3>
        <div class="h-full flex items-center justify-center">
          <div class="w-64">
            <div class="text-center text-3xl font-bold">{{ resourceUtilization }}%</div>
            <div class="mt-2 h-3 rounded bg-gray-200">
              <div class="h-3 rounded" :class="utilClass" :style="`width: ${resourceUtilization}%`"></div>
            </div>
            <div class="text-center text-xs text-gray-500 mt-1">Target: 85-95%</div>
          </div>
        </div>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">At-Risk Projects</h3>
        <div class="space-y-3">
          <div v-for="p in atRiskProjects" :key="p.projectId" 
               class="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
               @click="handleProjectClick(p)">
            <div>
              <div class="font-medium">{{ p.projectName }}</div>
              <div class="text-xs text-gray-500">{{ getClientName(p.client) }} • {{ p.serviceLine }}</div>
            </div>
            <div class="text-right">
              <div class="text-sm">Δ {{ getBudgetVariance(p) }}%</div>
              <div class="text-xs text-gray-500">Budget {{ formatCurrency(p.budget) }} / Cost {{ formatCurrency(p.projectCost) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Project Detail Modal -->
  <div v-if="showProjectModal && selectedProject" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Project Details</h3>
        <button @click="showProjectModal = false" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="space-y-3">
        <div><strong>Project:</strong> {{ selectedProject.projectName }}</div>
        <div><strong>Client:</strong> {{ getClientName(selectedProject.client) }}</div>
        <div><strong>Service Line:</strong> {{ selectedProject.serviceLine }}</div>
        <div><strong>Status:</strong> {{ selectedProject.phase }}</div>
        <div><strong>Value:</strong> {{ formatCurrency(selectedProject.projectValue) }}</div>
        <div><strong>Budget:</strong> {{ formatCurrency(selectedProject.budget) }}</div>
        <div><strong>Cost:</strong> {{ formatCurrency(selectedProject.projectCost) }}</div>
        <div><strong>Risk Level:</strong> {{ selectedProject.riskLevel }}</div>
        <div><strong>Priority:</strong> {{ selectedProject.priority }}</div>
      </div>
    </div>
  </div>

  <!-- Client Detail Modal -->
  <div v-if="showClientModal && selectedClient" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Client Details</h3>
        <button @click="showClientModal = false" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="space-y-3">
        <div><strong>Client:</strong> {{ selectedClient.clientName }}</div>
        <div><strong>Industry:</strong> {{ selectedClient.industry }}</div>
        <div><strong>Created:</strong> {{ formatDate(selectedClient.createdDate) }}</div>
        <div><strong>Risk Level:</strong> {{ selectedClient.risk || 'Low' }}</div>
        <div><strong>Active Projects:</strong> {{ getClientProjectCount(selectedClient.clientId) }}</div>
      </div>
    </div>
  </div>

  <!-- Timesheet Modal -->
  <div v-if="showTimesheetModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Missing Timesheets Overview</h3>
        <button @click="showTimesheetModal = false" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="space-y-3">
        <div class="text-sm text-gray-600">Total missing timesheets: {{ missingTimesheets.length }}</div>
        <div class="text-sm text-gray-600">Click on any row above to view detailed timesheet information.</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import KPICard from '@/components/ui/KPICard.vue'
import BarChart from '@/components/charts/BarChart.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import { clients, projects, employees, projectApprovals, dashboardMetrics } from '@/data/sample'
import { computed, ref } from 'vue'

// Reactive state for selected filters
const selectedFilter = ref('all')
const showProjectModal = ref(false)
const showClientModal = ref(false)
const showTimesheetModal = ref(false)
const selectedProject = ref<typeof projects[number] | null>(null)
const selectedClient = ref<typeof clients[number] | null>(null)

// Click handlers for interactive widgets
const handleProjectClick = (project: typeof projects[number]) => {
  selectedProject.value = project
  showProjectModal.value = true
}

const handleClientClick = (client: typeof clients[number]) => {
  selectedClient.value = client
  showClientModal.value = true
}

const handleTimesheetClick = () => {
  showTimesheetModal.value = true
}

const handleMetricClick = (metric: any) => {
  selectedFilter.value = metric.details?.filter || 'all'
  // You can add navigation logic here
  console.log('Metric clicked:', metric)
}

const totalProjectValue = computed(() => projects.reduce((s, p) => s + p.projectValue, 0))

const totalBudget = computed(() => projects.reduce((s, p) => s + p.budget, 0))
const totalCost = computed(() => projects.reduce((s, p) => s + p.projectCost, 0))
const budgetDeltaPct = computed(() => Math.round(((totalBudget.value - totalCost.value) / totalBudget.value) * 100))

const onTrackCount = computed(() => projects.filter(p => p.projectCost <= p.budget && p.phase !== 'Complete').length)
const atRisk = (p: typeof projects[number]) => p.projectCost > p.budget || p.phase === 'Review'
const atRiskProjects = computed(() => projects.filter(atRisk))
const atRiskCount = computed(() => atRiskProjects.value.length)

const portfolioFinancialsData = computed(() => {
  const groups = ['Audit', 'Tax', 'Advisory']
  const budgetBy = groups.map(g => projects.filter(p => p.serviceLine === g).reduce((s, p) => s + p.budget, 0))
  const costBy = groups.map(g => projects.filter(p => p.serviceLine === g).reduce((s, p) => s + p.projectCost, 0))
  return {
    labels: groups,
    datasets: [
      { label: 'Budget', data: budgetBy, backgroundColor: '#93C5FD' },
      { label: 'Actual Cost', data: costBy, backgroundColor: '#3B82F6' },
    ],
  }
})

const statusDistributionData = computed(() => {
  const statuses = ['Planning', 'Fieldwork', 'Review', 'Complete']
  const counts = statuses.map(s => projects.filter(p => p.phase === s).length)
  return {
    labels: statuses,
    datasets: [
      { data: counts, backgroundColor: ['#60A5FA', '#34D399', '#F59E0B', '#9CA3AF'] },
    ],
  }
})

const resourceUtilization = 88
const utilClass = computed(() => (resourceUtilization > 95 || resourceUtilization < 80 ? 'bg-yellow-500' : 'bg-green-500'))

const pendingApprovals = computed(() => projectApprovals.filter(a => a.status === 'Pending').length)

const newProjectsThisMonth = computed(() => {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  return projects.filter(p => new Date(p.startDate) >= startOfMonth)
})

const newClientsThisMonth = computed(() => {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  return clients.filter(c => new Date(c.createdDate) >= startOfMonth)
})

const getClientProjectCount = (clientId: string) => {
  const client = clients.find(c => c.clientId === clientId)
  if (!client) return 0
  return projects.filter(p => p.client === clientId).length
}

const getClientRiskLevel = (risk: string) => {
  if (risk === 'High') return 'High Risk'
  if (risk === 'Medium') return 'Medium Risk'
  if (risk === 'Low') return 'Low Risk'
  return 'Unknown Risk'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-KW', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
}

const missingTimesheets = computed(() => {
  const today = new Date()
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  return projects
    .filter(p => p.phase !== 'Complete')
    .map(p => {
      const lastEntry = p.timesheets.length > 0 
        ? new Date(p.timesheets[p.timesheets.length - 1].entryDate)
        : new Date(p.startDate)
      
      const daysMissing = Math.ceil((today.getTime() - lastEntry.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        employeeName: employees.find(e => e.employeeId === p.employee)?.employeeName || 'Unknown',
        projectName: p.projectName,
        lastEntry: p.timesheets.length > 0 ? p.timesheets[p.timesheets.length - 1].entryDate : p.startDate,
        daysMissing: daysMissing,
        status: getTimesheetStatus(daysMissing),
        project: p
      }
    })
    .filter(entry => entry.daysMissing > 3)
    .sort((a, b) => b.daysMissing - a.daysMissing)
})

const getTimesheetStatus = (daysMissing: number) => {
  if (daysMissing > 30) return 'Overdue'
  if (daysMissing > 15) return 'Warning'
  if (daysMissing > 7) return 'Attention'
  return 'On Track'
}

const getTimesheetStatusClass = (daysMissing: number) => {
  if (daysMissing > 30) return 'bg-red-100 text-red-800'
  if (daysMissing > 15) return 'bg-yellow-100 text-yellow-800'
  if (daysMissing > 7) return 'bg-orange-100 text-orange-800'
  return 'bg-green-100 text-green-800'
}

const getClientName = (clientId: string) => clients.find(c => c.clientId === clientId)?.clientName || 'Unknown'
const getBudgetVariance = (p: typeof projects[number]) => {
  if (!p.budget || p.budget === 0) return 0
  return Math.round(((p.projectCost - p.budget) / p.budget) * 100)
}
const formatCurrency = (v: number) => new Intl.NumberFormat('en-KW', { style: 'currency', currency: 'KWD', maximumFractionDigits: 0 }).format(v)
</script>



