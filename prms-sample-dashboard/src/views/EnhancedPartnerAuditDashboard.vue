<template>
  <div class="space-y-8">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <KPICard title="New Clients MTD" :value="newClientsMTD" :trend="clientGrowthYoY" subtitle="vs same month last year" status="success" />
      <KPICard title="New Projects MTD" :value="newProjectsMTD" :trend="projectGrowthYoY" subtitle="vs March 2024" status="success" />
      <KPICard title="Missing Timesheets" :value="missingTimesheetsCount" status="warning" subtitle="This week" clickable />
      <KPICard title="Revenue YTD" :value="revenueYTD" format="currency" unit="KWD" :trend="revenueGrowthYoY" subtitle="vs YTD 2024" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-white p-6 rounded-lg shadow-sm h-80">
        <h3 class="text-lg font-semibold mb-4">New Clients: 2024 vs 2025</h3>
        <BarChart :data="clientComparisonData" />
        <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div class="text-center">
            <p class="text-gray-600">2024 (Jan-Mar)</p>
            <p class="font-bold text-lg">{{ clients2024Q1 }}</p>
          </div>
          <div class="text-center">
            <p class="text-gray-600">2025 (Jan-Mar)</p>
            <p class="font-bold text-lg text-green-600">{{ clients2025Q1 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm h-80">
        <h3 class="text-lg font-semibold mb-4">New Projects: 2024 vs 2025</h3>
        <LineChart :data="projectTrendData" />
        <div class="mt-4 flex justify-between text-sm">
          <span>Growth Rate: <strong class="text-green-600">+{{ projectGrowthYoY }}%</strong></span>
          <span>Avg per Month: <strong>{{ avgProjectsPerMonth }}</strong></span>
        </div>
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Missing Timesheets Alert</h3>
        <span :class="getComplianceColor(timesheetCompliance)" class="px-3 py-1 rounded-full text-sm font-medium">{{ timesheetCompliance }}% Compliance</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 class="font-medium text-red-600 mb-3">Missing This Week ({{ missingTimesheetsCount }})</h4>
          <div class="space-y-2">
            <div v-for="missing in missingTimesheets" :key="missing.id" class="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <div>
                <p class="font-medium">{{ missing.employeeName }}</p>
                <p class="text-sm text-gray-600">{{ missing.projectName }}</p>
              </div>
              <div class="text-right">
                <p class="text-red-600 font-medium">{{ missing.daysCount }} days</p>
                <button class="text-xs text-blue-600 hover:text-blue-800">Send Reminder</button>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h4 class="font-medium mb-3">Weekly Compliance Trend</h4>
          <div class="space-y-3">
            <div v-for="week in weeklyCompliance" :key="week.week" class="flex justify-between items-center">
              <span class="text-sm">{{ week.week }}</span>
              <div class="flex items-center space-x-2">
                <div class="w-24 bg-gray-200 rounded-full h-2">
                  <div :class="getComplianceBarColor(week.compliance)" class="h-2 rounded-full transition-all duration-300" :style="`width: ${week.compliance}%`"></div>
                </div>
                <span class="text-sm font-medium w-12">{{ week.compliance }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import KPICard from '@/components/ui/KPICard.vue'
import BarChart from '@/components/charts/BarChart.vue'
import LineChart from '@/components/charts/LineChart.vue'
import { computed, ref } from 'vue'
import { clients, projects, timesheets, teamAssignments } from '@/data/sample'


const currentDate = ref(new Date('2025-03-12'))
const currentMonth = computed(() => currentDate.value.getMonth())
const currentYear = computed(() => currentDate.value.getFullYear())

const newClientsMTD = computed(() => clients.filter(c => {
  const createdDate = new Date(c.createdDate)
  return createdDate.getMonth() === currentMonth.value && createdDate.getFullYear() === currentYear.value
}).length)

const newProjectsMTD = computed(() => projects.filter(p => {
  const startDate = new Date(p.startDate)
  return startDate.getMonth() === currentMonth.value && startDate.getFullYear() === currentYear.value
}).length)

const clients2024Q1 = computed(() => clients.filter(c => {
  const createdDate = new Date(c.createdDate)
  return createdDate.getFullYear() === 2024 && createdDate.getMonth() <= 2
}).length)

const clients2025Q1 = computed(() => clients.filter(c => {
  const createdDate = new Date(c.createdDate)
  return createdDate.getFullYear() === 2025 && createdDate.getMonth() <= 2
}).length)

const clientGrowthYoY = computed(() => Math.round(((clients2025Q1.value - clients2024Q1.value) / clients2024Q1.value) * 100))

const projects2024Q1 = computed(() => projects.filter(p => {
  const startDate = new Date(p.startDate)
  return startDate.getFullYear() === 2024 && startDate.getMonth() <= 2
}).length)

const projects2025Q1 = computed(() => projects.filter(p => {
  const startDate = new Date(p.startDate)
  return startDate.getFullYear() === 2025 && startDate.getMonth() <= 2
}).length)

const projectGrowthYoY = computed(() => Math.round(((projects2025Q1.value - projects2024Q1.value) / projects2024Q1.value) * 100))

const revenue2024YTD = computed(() => projects
  .filter(p => new Date(p.startDate).getFullYear() === 2024 && new Date(p.startDate).getMonth() <= 2)
  .reduce((sum, p) => sum + p.projectValue, 0))

const revenue2025YTD = computed(() => projects
  .filter(p => new Date(p.startDate).getFullYear() === 2025 && new Date(p.startDate).getMonth() <= 2)
  .reduce((sum, p) => sum + p.projectValue, 0))

const revenueGrowthYoY = computed(() => Math.round(((revenue2025YTD.value - revenue2024YTD.value) / revenue2024YTD.value) * 100))

const expectedTimesheets = computed(() => {
  const workingDays = ['2025-03-10', '2025-03-11', '2025-03-12']
  const rows: Array<{ employee: string; employeeName: string; project: string; date: string }> = []
  teamAssignments.forEach(assignment => {
    workingDays.forEach(date => {
      rows.push({ employee: assignment.employeeId, employeeName: assignment.employeeName, project: assignment.projectId, date })
    })
  })
  return rows
})

const missingTimesheets = computed(() => expectedTimesheets.value.filter(expected => {
  return !timesheets.some(submitted => submitted.employee === expected.employee && submitted.date === expected.date)
}).map(missing => ({
  id: `${missing.employee}-${missing.date}`,
  employeeName: missing.employeeName,
  projectName: projects.find(p => p.projectId === missing.project)?.projectName || 'Unknown Project',
  daysCount: Math.floor((new Date().getTime() - new Date(missing.date).getTime()) / (1000 * 60 * 60 * 24)),
})))

const missingTimesheetsCount = computed(() => missingTimesheets.value.length)
const submittedTimesheetsCount = computed(() => timesheets.length)
const timesheetCompliance = computed(() => {
  const expected = expectedTimesheets.value.length
  return expected ? Math.round((submittedTimesheetsCount.value / expected) * 100) : 100
})

const clientComparisonData = computed(() => ({
  labels: ['Jan', 'Feb', 'Mar'],
  datasets: [
    { label: '2024', data: [1, 1, 1], backgroundColor: '#9CA3AF' },
    { label: '2025', data: [1, 1, 2], backgroundColor: '#3B82F6' },
  ],
}))

const projectTrendData = computed(() => ({
  labels: ['Jan 2024', 'Feb 2024', 'Mar 2024', 'Jan 2025', 'Feb 2025', 'Mar 2025'],
  datasets: [
    { label: 'New Projects', data: [1, 1, 1, 1, 1, 3], borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.1)', tension: 0.4 },
  ],
}))

const weeklyCompliance = computed(() => ([
  { week: 'Week 1', compliance: 95 },
  { week: 'Week 2', compliance: 88 },
  { week: 'Week 3', compliance: 92 },
  { week: 'This Week', compliance: timesheetCompliance.value },
]))

const getComplianceColor = (compliance: number) => {
  if (compliance >= 95) return 'bg-green-100 text-green-800'
  if (compliance >= 85) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

const getComplianceBarColor = (compliance: number) => {
  if (compliance >= 95) return 'bg-green-500'
  if (compliance >= 85) return 'bg-yellow-500'
  return 'bg-red-500'
}

const revenueYTD = computed(() => revenue2025YTD.value)
const avgProjectsPerMonth = computed(() => Math.round(projects2025Q1.value / 3))

</script>


