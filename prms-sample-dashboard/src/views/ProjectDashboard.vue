<template>
  <div class="space-y-8">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <KPICard title="Completion" :value="completionPct + '%'" />
      <KPICard title="Budget Consumption" :value="budgetConsumptionPct + '%'" :trend="budgetConsumptionPct" />
      <KPICard title="Tasks Completed" :value="tasksCompleted + '/' + totalTasks" />
      <KPICard title="Pending TS Approvals" :value="pendingTimesheetApprovals" status="warning" />
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm">
      <h3 class="text-lg font-semibold mb-4">Timeline</h3>
      <div class="space-y-2">
        <div v-for="phase in phases" :key="phase.name" class="space-y-1">
          <div class="flex justify-between text-sm">
            <span class="font-medium">{{ phase.name }}</span>
            <span class="text-gray-500">{{ phase.start }} → {{ phase.end }}</span>
          </div>
          <div class="h-3 bg-gray-200 rounded">
            <div class="h-3 bg-blue-500 rounded" :style="`width: ${phase.progress}%`"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-white p-6 rounded-lg shadow-sm h-80">
        <h3 class="text-lg font-semibold mb-4">Task Progress</h3>
        <DoughnutChart :data="taskProgressData" />
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">Team Timesheet Summary (This Week)</h3>
        <div class="space-y-3">
          <div v-for="row in timesheetSummary" :key="row.employeeId" class="flex items-center justify-between p-3 border rounded">
            <div>
              <div class="font-medium">{{ row.employeeName }}</div>
              <div class="text-xs text-gray-500">{{ row.grade }}</div>
            </div>
            <div class="text-right">
              <div class="text-sm">{{ row.hours }} hrs</div>
              <div class="text-xs text-gray-500">Target {{ row.target }} hrs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import KPICard from '@/components/ui/KPICard.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import { useRoute } from 'vue-router'
import { projects, teamAssignments } from '@/data/sample'
import { computed } from 'vue'

const route = useRoute()
const projectId = route.params.id ? String(route.params.id) : 'P025003'
const project = projects.find(p => p.projectId === projectId) || projects[0]

const completionPct = 62
const budgetConsumptionPct = Math.round((project.projectCost / project.budget) * 100)

const tasksCompleted = 18
const totalTasks = 24
const taskProgressData = {
  labels: ['Not Started', 'In Progress', 'Completed'],
  datasets: [
    { data: [6, 6, 12], backgroundColor: ['#9CA3AF', '#60A5FA', '#10B981'] },
  ],
}

const phases = [
  { name: 'Planning', start: '2025-03-01', end: '2025-03-07', progress: 100 },
  { name: 'Fieldwork', start: '2025-03-08', end: '2025-03-21', progress: 60 },
  { name: 'Review', start: '2025-03-22', end: '2025-03-28', progress: 20 },
]

const timesheetSummary = computed(() => teamAssignments.filter(t => t.projectId === project.projectId).map(t => ({
  employeeId: t.employeeId,
  employeeName: t.employeeName,
  grade: t.grade,
  hours: 32,
  target: 40,
})))

const pendingTimesheetApprovals = 3
</script>



