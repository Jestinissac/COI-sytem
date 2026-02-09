<template>
  <div class="report-charts">
    <!-- Grid Layout for Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Status Breakdown Pie Chart -->
      <div v-if="summaryData.byStatus && Object.keys(summaryData.byStatus).length > 0" class="chart-container">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900">Status Distribution</h3>
          <button
            @click="exportChart('statusChart', 'Status Distribution')"
            class="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors"
            aria-label="Export status chart"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            <span>Export</span>
          </button>
        </div>
        <div :class="{ 'cursor-pointer': clickable }">
          <PieChart
            ref="statusChart"
            id="statusChart"
            :data="statusChartData"
            :options="pieChartOptions"
            aria-label="Status distribution pie chart"
            v-if="statusChartData"
          />
        </div>
      </div>

      <!-- Service Type Bar Chart -->
      <div v-if="summaryData.byServiceType && Object.keys(summaryData.byServiceType).length > 0" class="chart-container">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900">Service Type Distribution</h3>
          <button
            @click="exportChart('serviceChart', 'Service Type Distribution')"
            class="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors"
            aria-label="Export service type chart"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            <span>Export</span>
          </button>
        </div>
        <div :class="{ 'cursor-pointer': clickable }">
          <BarChart
            ref="serviceChart"
            id="serviceChart"
            :data="serviceChartData"
            :options="barChartOptions"
            aria-label="Service type distribution bar chart"
            v-if="serviceChartData"
          />
        </div>
      </div>
    </div>

    <!-- Client Distribution Bar Chart - Full Width -->
    <div v-if="summaryData.byClient && Object.keys(summaryData.byClient).length > 0" class="chart-container mt-8">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-medium text-gray-900">Client Distribution</h3>
        <button
          @click="exportChart('clientChart', 'Client Distribution')"
          class="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors"
          aria-label="Export client chart"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          <span>Export</span>
        </button>
      </div>
      <div :class="{ 'cursor-pointer': clickable }">
        <BarChart
          ref="clientChart"
          id="clientChart"
          :data="clientChartData"
          :options="barChartOptions"
          aria-label="Client distribution bar chart"
          v-if="clientChartData"
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
  clickable?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'status-click': [status: string]
  'service-type-click': [serviceType: string]
  'client-click': [clientName: string]
}>()

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
  const backgroundColors = labels.map(label => (colors.status as Record<string, string>)[label] || colors.default[0])
  
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

// Chart Options with click handlers
const pieChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 1.2,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        padding: 12,
        font: {
          size: 11,
          family: 'system-ui, -apple-system, sans-serif'
        },
        color: '#374151',
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const label = context.label || ''
          const value = context.parsed || 0
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const percentage = ((value / total) * 100).toFixed(1)
          return `${label}: ${value} (${percentage}%)${props.clickable ? ' - Click to filter' : ''}`
        }
      }
    }
  },
  onClick: props.clickable ? (event: any, elements: any[], chart: any) => {
    if (elements && elements.length > 0 && chart) {
      const element = elements[0]
      if (chart.data && chart.data.labels) {
        const label = chart.data.labels[element.index]
        if (label) {
          emit('status-click', label as string)
        }
      }
    }
  } : undefined,
  onHover: props.clickable ? (event: any, elements: any[]) => {
    if (event && event.native && event.native.target) {
      event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default'
    }
  } : undefined,
  accessibility: {
    enabled: true
  }
}))

const barChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 2.2,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          return `${context.dataset.label}: ${context.parsed.y}${props.clickable ? ' - Click to filter' : ''}`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
        font: {
          size: 11,
          family: 'system-ui, -apple-system, sans-serif'
        },
        color: '#6B7280'
      },
      grid: {
        color: '#F3F4F6',
        lineWidth: 1
      }
    },
    x: {
      ticks: {
        font: {
          size: 11,
          family: 'system-ui, -apple-system, sans-serif'
        },
        color: '#6B7280'
      },
      grid: {
        display: false
      }
    }
  },
  onClick: props.clickable ? (event: any, elements: any[], chart: any) => {
    if (elements && elements.length > 0 && chart) {
      const element = elements[0]
      if (chart.data && chart.data.labels) {
        const label = chart.data.labels[element.index]
        const chartId = chart.canvas?.id
        if (chartId === 'serviceChart' && label) {
          emit('service-type-click', label as string)
        } else if (chartId === 'clientChart' && label) {
          emit('client-click', label as string)
        }
      }
    }
  } : undefined,
  onHover: props.clickable ? (event: any, elements: any[]) => {
    if (event && event.native && event.native.target) {
      event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default'
    }
  } : undefined,
  accessibility: {
    enabled: true
  }
}))

// Export chart function
function exportChart(chartRef: string, chartTitle: string) {
  const chart = chartRef === 'statusChart' ? statusChart.value : 
                chartRef === 'serviceChart' ? serviceChart.value : 
                clientChart.value
  
  if (!chart || !chart.chart) return
  
  const canvas = (chart as { chart?: { canvas: HTMLCanvasElement } })?.chart?.canvas
  if (!canvas) return
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

.report-charts {
  @apply w-full;
}

@media (max-width: 1024px) {
  .report-charts .grid {
    @apply grid-cols-1;
  }
}

@media (max-width: 768px) {
  .chart-container {
    @apply overflow-x-auto;
  }
}
</style>
