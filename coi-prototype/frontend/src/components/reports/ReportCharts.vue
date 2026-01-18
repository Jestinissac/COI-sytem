<template>
  <div class="report-charts space-y-6">
    <!-- Status Breakdown Pie Chart -->
    <div v-if="summaryData.byStatus && Object.keys(summaryData.byStatus).length > 0" class="chart-container">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-lg font-semibold text-gray-900">Status Distribution</h4>
        <button
          @click="exportChart('statusChart', 'Status Distribution')"
          class="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          aria-label="Export status chart"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Export
        </button>
      </div>
      <div class="bg-white rounded-lg p-4 border border-gray-200">
        <PieChart
          ref="statusChart"
          :data="statusChartData"
          :options="pieChartOptions"
          aria-label="Status distribution pie chart"
        />
      </div>
    </div>

    <!-- Service Type Bar Chart -->
    <div v-if="summaryData.byServiceType && Object.keys(summaryData.byServiceType).length > 0" class="chart-container">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-lg font-semibold text-gray-900">Service Type Distribution</h4>
        <button
          @click="exportChart('serviceChart', 'Service Type Distribution')"
          class="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          aria-label="Export service type chart"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Export
        </button>
      </div>
      <div class="bg-white rounded-lg p-4 border border-gray-200">
        <BarChart
          ref="serviceChart"
          :data="serviceChartData"
          :options="barChartOptions"
          aria-label="Service type distribution bar chart"
        />
      </div>
    </div>

    <!-- Client Distribution Bar Chart -->
    <div v-if="summaryData.byClient && Object.keys(summaryData.byClient).length > 0" class="chart-container">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-lg font-semibold text-gray-900">Client Distribution</h4>
        <button
          @click="exportChart('clientChart', 'Client Distribution')"
          class="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          aria-label="Export client chart"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Export
        </button>
      </div>
      <div class="bg-white rounded-lg p-4 border border-gray-200">
        <BarChart
          ref="clientChart"
          :data="clientChartData"
          :options="barChartOptions"
          aria-label="Client distribution bar chart"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Pie as PieChart, Bar as BarChart } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
)

interface Props {
  summaryData: {
    byStatus?: Record<string, number>
    byServiceType?: Record<string, number>
    byClient?: Record<string, number>
  }
}

const props = defineProps<Props>()

const statusChart = ref<InstanceType<typeof PieChart> | null>(null)
const serviceChart = ref<InstanceType<typeof BarChart> | null>(null)
const clientChart = ref<InstanceType<typeof BarChart> | null>(null)

// Color palette for charts
const colors = {
  status: {
    'Approved': '#10b981',
    'Rejected': '#ef4444',
    'Pending Director Approval': '#f59e0b',
    'Pending Compliance': '#3b82f6',
    'Pending Partner': '#8b5cf6',
    'Pending Finance': '#ec4899',
    'Draft': '#6b7280',
    'Lapsed': '#9ca3af',
    'Active': '#22c55e'
  },
  default: [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ]
}

// Status Pie Chart Data
const statusChartData = computed(() => {
  if (!props.summaryData.byStatus) return null
  
  const labels = Object.keys(props.summaryData.byStatus)
  const data = Object.values(props.summaryData.byStatus)
  const backgroundColors = labels.map(label => colors.status[label] || colors.default[0])
  
  return {
    labels,
    datasets: [{
      label: 'Requests',
      data,
      backgroundColor: backgroundColors,
      borderColor: '#ffffff',
      borderWidth: 2
    }]
  }
})

// Service Type Bar Chart Data
const serviceChartData = computed(() => {
  if (!props.summaryData.byServiceType) return null
  
  const labels = Object.keys(props.summaryData.byServiceType)
  const data = Object.values(props.summaryData.byServiceType)
  
  return {
    labels,
    datasets: [{
      label: 'Requests',
      data,
      backgroundColor: colors.default[0],
      borderColor: colors.default[0],
      borderWidth: 1
    }]
  }
})

// Client Bar Chart Data
const clientChartData = computed(() => {
  if (!props.summaryData.byClient) return null
  
  const labels = Object.keys(props.summaryData.byClient)
  const data = Object.values(props.summaryData.byClient)
  
  return {
    labels,
    datasets: [{
      label: 'Requests',
      data,
      backgroundColor: colors.default[1],
      borderColor: colors.default[1],
      borderWidth: 1
    }]
  }
})

// Chart Options
const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 1.5,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        padding: 15,
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const label = context.label || ''
          const value = context.parsed || 0
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const percentage = ((value / total) * 100).toFixed(1)
          return `${label}: ${value} (${percentage}%)`
        }
      }
    }
  },
  accessibility: {
    enabled: true
  }
}

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 2,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          return `${context.dataset.label}: ${context.parsed.y}`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1
      }
    }
  },
  accessibility: {
    enabled: true
  }
}

// Export chart function
function exportChart(chartRef: string, chartTitle: string) {
  const chart = chartRef === 'statusChart' ? statusChart.value : 
                chartRef === 'serviceChart' ? serviceChart.value : 
                clientChart.value
  
  if (!chart || !chart.chart) return
  
  const canvas = chart.chart.canvas
  const url = canvas.toDataURL('image/png')
  
  // Create download link
  const link = document.createElement('a')
  link.download = `${chartTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`
  link.href = url
  link.click()
}
</script>

<style scoped>
.chart-container {
  @apply w-full;
}

@media (max-width: 768px) {
  .chart-container {
    @apply overflow-x-auto;
  }
}
</style>
