<template>
  <div class="space-y-8">
    <!-- Financial Overview KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
      <KPICard title="Total Revenue" :value="currentFinancial.totalRevenue" format="currency" unit="KWD" :trend="revenueTrend" />
      <KPICard title="Net Profit" :value="currentFinancial.netProfit" format="currency" unit="KWD" :trend="profitTrend" />
      <KPICard title="Profit Margin" :value="currentFinancial.profitMargin" unit="%" />
      <KPICard title="Cash Flow" :value="currentFinancial.cashFlow" format="currency" unit="KWD" />
      <KPICard title="Outstanding Invoices" :value="currentFinancial.outstandingInvoices" format="currency" unit="KWD" status="warning" />
    </div>

    <!-- Revenue by Service Line Chart -->
    <div class="bg-white p-6 rounded-lg shadow-sm">
      <h3 class="text-lg font-semibold mb-4">Revenue by Service Line</h3>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BarChart :data="revenueByServiceData" />
        <div class="space-y-4">
          <div v-for="(revenue, service) in currentFinancial.revenueByService" :key="service" class="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span class="font-medium">{{ service }}</span>
            <span class="text-lg font-semibold text-blue-600">{{ formatCurrency(revenue) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Expenses Breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">Expenses by Category</h3>
        <DoughnutChart :data="expensesData" />
        <div class="mt-4 space-y-2">
          <div v-for="(expense, category) in currentFinancial.expensesByCategory" :key="category" class="flex justify-between text-sm">
            <span>{{ category }}</span>
            <span class="font-medium">{{ formatCurrency(expense) }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">Financial Performance Trends</h3>
        <LineChart :data="financialTrendsData" />
      </div>
    </div>

    <!-- Invoice Management -->
    <div class="bg-white p-6 rounded-lg shadow-sm">
      <h3 class="text-lg font-semibold mb-4">Invoice Management</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="text-center p-4 bg-green-50 rounded-lg">
          <div class="text-2xl font-bold text-green-600">{{ currentFinancial.outstandingInvoices }}</div>
          <div class="text-sm text-green-700">Outstanding</div>
        </div>
        <div class="text-center p-4 bg-yellow-50 rounded-lg">
          <div class="text-2xl font-bold text-yellow-600">{{ currentFinancial.overdueInvoices }}</div>
          <div class="text-sm text-yellow-700">Overdue</div>
        </div>
        <div class="text-center p-4 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">{{ overduePercentage }}%</div>
          <div class="text-sm text-blue-700">Overdue Rate</div>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="invoice in invoices" :key="invoice.invoiceId" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ invoice.invoiceId }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ getClientName(invoice.clientId) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatCurrency(invoice.amountKWD) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(invoice.dueDate) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getInvoiceStatusClass(invoice)">
                  {{ invoice.paid ? 'Paid' : 'Outstanding' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Profitability Analysis -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">Profitability by Service Line</h3>
        <div class="space-y-4">
          <div v-for="(revenue, service) in currentFinancial.revenueByService" :key="service" class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>{{ service }}</span>
              <span class="font-medium">{{ formatCurrency(revenue) }}</span>
            </div>
            <div class="h-2 bg-gray-200 rounded">
              <div class="h-2 bg-blue-500 rounded" :style="`width: ${(revenue / currentFinancial.totalRevenue) * 100}%`"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">Cash Flow Analysis</h3>
        <div class="space-y-4">
          <div class="flex justify-between">
            <span>Operating Cash Flow</span>
            <span class="font-medium text-green-600">{{ formatCurrency(currentFinancial.cashFlow) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Investing Cash Flow</span>
            <span class="font-medium text-red-600">-{{ formatCurrency(25000) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Financing Cash Flow</span>
            <span class="font-medium text-blue-600">{{ formatCurrency(15000) }}</span>
          </div>
          <div class="border-t pt-2">
            <div class="flex justify-between font-semibold">
              <span>Net Cash Flow</span>
              <span :class="currentFinancial.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ formatCurrency(currentFinancial.cashFlow) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Financial Metrics Dashboard -->
    <div class="bg-white p-6 rounded-lg shadow-sm">
      <h3 class="text-lg font-semibold mb-4">Key Financial Metrics</h3>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="text-center p-4 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">{{ currentFinancial.profitMargin }}%</div>
          <div class="text-sm text-blue-700">Profit Margin</div>
        </div>
        <div class="text-center p-4 bg-green-50 rounded-lg">
          <div class="text-2xl font-bold text-green-600">{{ formatCurrency(currentFinancial.grossProfit) }}</div>
          <div class="text-sm text-green-700">Gross Profit</div>
        </div>
        <div class="text-center p-4 bg-purple-50 rounded-lg">
          <div class="text-2xl font-bold text-purple-600">{{ formatCurrency(currentFinancial.totalExpenses) }}</div>
          <div class="text-sm text-purple-700">Total Expenses</div>
        </div>
        <div class="text-center p-4 bg-orange-50 rounded-lg">
          <div class="text-2xl font-bold text-orange-600">{{ formatCurrency(currentFinancial.totalRevenue) }}</div>
          <div class="text-sm text-orange-700">Total Revenue</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import KPICard from '@/components/ui/KPICard.vue'
import BarChart from '@/components/charts/BarChart.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import LineChart from '@/components/charts/LineChart.vue'
import { computed } from 'vue'
import { financialReports, invoices, clients } from '@/data/sample'

// Get current financial data (MTD)
const currentFinancial = computed(() => financialReports.find(r => r.period === 'MTD') || financialReports[0])

// Calculate trends (comparing MTD to previous period)
const revenueTrend = computed(() => {
  const current = currentFinancial.value.totalRevenue
  const previous = 380000 // Previous month revenue
  return Math.round(((current - previous) / previous) * 100)
})

const profitTrend = computed(() => {
  const current = currentFinancial.value.netProfit
  const previous = 75000 // Previous month profit
  return Math.round(((current - previous) / previous) * 100)
})

const overduePercentage = computed(() => {
  if (currentFinancial.value.outstandingInvoices === 0) return 0
  return Math.round((currentFinancial.value.overdueInvoices / currentFinancial.value.outstandingInvoices) * 100)
})

// Chart data
const revenueByServiceData = computed(() => ({
  labels: Object.keys(currentFinancial.value.revenueByService),
  datasets: [
    {
      label: 'Revenue by Service Line',
      data: Object.values(currentFinancial.value.revenueByService),
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
    },
  ],
}))

const expensesData = computed(() => ({
  labels: Object.keys(currentFinancial.value.expensesByCategory),
  datasets: [
    {
      data: Object.values(currentFinancial.value.expensesByCategory),
      backgroundColor: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'],
    },
  ],
}))

const financialTrendsData = computed(() => ({
  labels: ['Jan', 'Feb', 'Mar'],
  datasets: [
    {
      label: 'Revenue',
      data: [380000, 400000, currentFinancial.value.totalRevenue],
      borderColor: '#3B82F6',
      backgroundColor: '#DBEAFE',
      tension: 0.1,
    },
    {
      label: 'Expenses',
      data: [280000, 290000, currentFinancial.value.totalExpenses],
      borderColor: '#EF4444',
      backgroundColor: '#FEE2E2',
      tension: 0.1,
    },
  ],
}))

// Helper functions
const getClientName = (clientId: string) => clients.find(c => c.clientId === clientId)?.clientName || 'Unknown'
const formatCurrency = (value: number) => new Intl.NumberFormat('en-KW', { style: 'currency', currency: 'KWD', maximumFractionDigits: 0 }).format(value)
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-KW')

const getInvoiceStatusClass = (invoice: any) => {
  if (invoice.paid) return 'bg-green-100 text-green-800'
  const dueDate = new Date(invoice.dueDate)
  const today = new Date()
  if (dueDate < today) return 'bg-red-100 text-red-800'
  return 'bg-yellow-100 text-yellow-800'
}
</script>



