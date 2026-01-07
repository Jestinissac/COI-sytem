<template>
  <div class="space-y-8">
    <!-- KPI Cards Row 1 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <KPICard title="New Tax Clients" :value="newTaxClientsMTD" :trend="taxClientGrowthYoY" subtitle="vs March 2024" />
      <KPICard title="Tax Projects MTD" :value="newTaxProjectsMTD" :trend="taxProjectGrowthYoY" subtitle="vs last year" />
      <KPICard title="Tax Revenue YTD" :value="taxRevenueYTD" format="currency" unit="KWD" :trend="taxRevenueGrowthYoY" />
      <KPICard title="Team Utilization" :value="taxTeamUtilization" unit="%" />
    </div>

    <!-- KPI Cards Row 2 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <KPICard title="Active Projects" :value="activeTaxProjects" />
      <KPICard title="Completed Projects" :value="completedTaxProjects" />
      <KPICard title="Average Project Value" :value="averageProjectValue" format="currency" unit="KWD" />
      <KPICard title="Tax Compliance Rate" :value="taxComplianceRate" unit="%" />
    </div>

    <!-- Charts and Data Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-white p-6 rounded-lg shadow-sm h-80">
        <h3 class="text-lg font-semibold mb-4">Tax Practice Growth</h3>
        <BarChart :data="taxGrowthComparisonData" />
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm h-80">
        <h3 class="text-lg font-semibold mb-4">Revenue by Month</h3>
        <LineChart :data="monthlyRevenueData" />
      </div>
    </div>

    <!-- Project Status and Client Data -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">Project Status Breakdown</h3>
        <DoughnutChart :data="projectStatusData" />
        <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div class="flex items-center">
            <div class="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>Planning: {{ projectStatusCounts.planning }}</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span>Fieldwork: {{ projectStatusCounts.fieldwork }}</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <span>Review: {{ projectStatusCounts.review }}</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Complete: {{ projectStatusCounts.complete }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">Client Acquisition Pipeline</h3>
        <div class="space-y-4 max-h-64 overflow-y-auto">
          <div v-for="newClient in recentTaxClients" :key="newClient.id" class="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded">
            <div>
              <p class="font-medium">{{ newClient.clientName }}</p>
              <p class="text-sm text-gray-600">{{ newClient.industry }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-blue-600">{{ formatCurrency(newClient.projectValue) }}</p>
              <p class="text-xs text-gray-500">{{ newClient.startDate }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Project Table -->
    <div class="bg-white p-6 rounded-lg shadow-sm">
      <h3 class="text-lg font-semibold mb-4">Tax Projects Detail</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="project in detailedTaxProjects" :key="project.projectId">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ project.projectName }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ project.clientName }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getStatusClass(project.phase)">
                  {{ project.phase }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatCurrency(project.projectValue) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatCurrency(project.budget) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatCurrency(project.projectCost) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm" :class="getMarginClass(project.projectValue, project.projectCost)">
                {{ calculateMargin(project.projectValue, project.projectCost) }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tax Compliance Metrics -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">VAT Compliance</h3>
        <div class="text-center">
          <div class="text-3xl font-bold text-green-600">{{ vatComplianceRate }}%</div>
          <p class="text-sm text-gray-600 mt-2">On-time submissions</p>
        </div>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">Corporate Tax</h3>
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-600">{{ corporateTaxCompliance }}%</div>
          <p class="text-sm text-gray-600 mt-2">Filing accuracy</p>
        </div>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">Audit Risk</h3>
        <div class="text-center">
          <div class="text-3xl font-bold" :class="getRiskClass(auditRiskLevel)">{{ auditRiskLevel }}%</div>
          <p class="text-sm text-gray-600 mt-2">Risk assessment</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import KPICard from '@/components/ui/KPICard.vue'
import BarChart from '@/components/charts/BarChart.vue'
import LineChart from '@/components/charts/LineChart.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import { computed } from 'vue'
import { clients, projects } from '@/data/sample'

const now = new Date('2025-03-12')
const currentMonth = now.getMonth()
const currentYear = now.getFullYear()

const taxClients = clients.filter(c => projects.some(p => p.client === c.clientId && p.projectName.includes('Tax')))
const taxProjects = projects.filter(p => p.projectName.includes('Tax'))

const newTaxClientsMTD = taxClients.filter(c => {
  const createdDate = new Date(c.createdDate)
  return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
}).length

const newTaxProjectsMTD = taxProjects.filter(p => {
  const startDate = new Date(p.startDate)
  return startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear
}).length

// Calculate client growth YoY
const taxClients2024 = taxClients.filter(c => new Date(c.createdDate).getFullYear() === 2024).length
const taxClients2025 = taxClients.filter(c => new Date(c.createdDate).getFullYear() === 2025).length
const taxClientGrowthYoY = taxClients2024 === 0 ? 100 : Math.round(((taxClients2025 - taxClients2024) / taxClients2024) * 100)

const taxProjects2024 = taxProjects.filter(p => new Date(p.startDate).getFullYear() === 2024).length
const taxProjects2025 = taxProjects.filter(p => new Date(p.startDate).getFullYear() === 2025).length
const taxProjectGrowthYoY = taxProjects2024 === 0 ? 100 : Math.round(((taxProjects2025 - taxProjects2024) / taxProjects2024) * 100)

const taxRevenueYTD = taxProjects.filter(p => new Date(p.startDate).getFullYear() === 2025).reduce((sum, p) => sum + p.projectValue, 0)
const taxRevenue2024YTD = taxProjects.filter(p => new Date(p.startDate).getFullYear() === 2024).reduce((sum, p) => sum + p.projectValue, 0)
const taxRevenueGrowthYoY = taxRevenue2024YTD === 0 ? 100 : Math.round(((taxRevenueYTD - taxRevenue2024YTD) / taxRevenue2024YTD) * 100)

// Helper function to format growth percentages
const formatGrowthPercentage = (value: number, baseValue: number) => {
  if (baseValue === 0) return 'New'
  if (value === 0) return '0%'
  return `${value > 0 ? '+' : ''}${value}%`
}

const taxGrowthComparisonData = computed(() => ({
  labels: ['2024', '2025'],
  datasets: [
    { label: 'New Tax Projects', data: [taxProjects2024, taxProjects2025], backgroundColor: ['#9CA3AF', '#10B981'] },
  ],
}))

const recentTaxClients = [
  { id: 'N-1', clientName: 'KPC', industry: 'Oil & Gas', projectValue: 55000, startDate: '2025-03-01' },
  { id: 'N-2', clientName: 'Gulf Bank', industry: 'Banking', projectValue: 32000, startDate: '2025-02-10' },
]

const formatCurrency = (v: number) => new Intl.NumberFormat('en-KW', { style: 'currency', currency: 'KWD', maximumFractionDigits: 0 }).format(v)

const taxTeamUtilization = 87

// New computed properties for enhanced data
const activeTaxProjects = computed(() => taxProjects.filter(p => p.phase === 'Fieldwork' || p.phase === 'Review').length)
const completedTaxProjects = computed(() => taxProjects.filter(p => p.phase === 'Complete').length)
const averageProjectValue = computed(() => taxProjects.filter(p => p.phase === 'Complete').reduce((sum, p) => sum + p.projectValue, 0) / completedTaxProjects.value)
const taxComplianceRate = 98 // Example compliance rate
const vatComplianceRate = 99 // Example VAT compliance rate
const corporateTaxCompliance = 97 // Example corporate tax compliance rate
const auditRiskLevel = 85 // Example audit risk level

const projectStatusCounts = computed(() => {
  const counts: { [key: string]: number } = {
    planning: 0,
    fieldwork: 0,
    review: 0,
    complete: 0,
  }
  taxProjects.forEach(p => {
    counts[p.phase]++
  })
  return counts
})

const detailedTaxProjects = computed(() => {
  return taxProjects.map(p => ({
    projectId: p.projectId,
    projectName: p.projectName,
    clientName: clients.find(c => c.clientId === p.client)?.clientName || 'N/A',
    phase: p.phase,
    projectValue: p.projectValue,
    budget: p.budget,
    projectCost: p.projectCost,
    margin: calculateMargin(p.projectValue, p.projectCost),
  }))
})

const getStatusClass = (phase: string) => {
  switch (phase) {
    case 'Planning':
      return 'bg-blue-100 text-blue-800'
    case 'Fieldwork':
      return 'bg-yellow-100 text-yellow-800'
    case 'Review':
      return 'bg-orange-100 text-orange-800'
    case 'Complete':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getMarginClass = (projectValue: number, projectCost: number) => {
  const margin = calculateMargin(projectValue, projectCost)
  if (margin > 20) return 'text-green-600'
  if (margin > 10) return 'text-yellow-600'
  if (margin > 0) return 'text-orange-600'
  return 'text-red-600'
}

const calculateMargin = (projectValue: number, projectCost: number) => {
  if (projectCost === 0) return 0
  return Math.round(((projectValue - projectCost) / projectCost) * 100)
}

const getRiskClass = (riskLevel: number) => {
  if (riskLevel > 90) return 'text-red-600'
  if (riskLevel > 70) return 'text-orange-600'
  if (riskLevel > 50) return 'text-yellow-600'
  return 'text-green-600'
}

const monthlyRevenueData = computed(() => {
  const revenueByMonth: { [key: string]: number } = {}
  taxProjects.forEach(p => {
    const startDate = new Date(p.startDate)
    const monthYear = `${startDate.getMonth() + 1}-${startDate.getFullYear()}`
    if (!revenueByMonth[monthYear]) {
      revenueByMonth[monthYear] = 0
    }
    revenueByMonth[monthYear] += p.projectValue
  })
  return {
    labels: Object.keys(revenueByMonth),
    datasets: [
      {
        label: 'Tax Revenue YTD',
        data: Object.values(revenueByMonth),
        borderColor: '#4F46E5',
        backgroundColor: '#E0E7FF',
        tension: 0.1,
      },
    ],
  }
})

const projectStatusData = computed(() => ({
  labels: Object.keys(projectStatusCounts.value),
  datasets: [
    {
      data: Object.values(projectStatusCounts.value),
      backgroundColor: [
        '#4F46E5', // Blue for Planning
        '#F59E0B', // Yellow for Fieldwork
        '#EF4444', // Red for Review
        '#10B981', // Green for Complete
      ],
    },
  ],
}))
</script>


