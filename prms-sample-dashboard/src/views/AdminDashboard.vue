<template>
  <div class="space-y-8">
    <!-- Employee Performance Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <KPICard title="Total Employees" :value="employees.length" />
      <KPICard title="Avg Utilization" :value="averageUtilization" unit="%" />
      <KPICard title="High Performers" :value="highPerformers" />
      <KPICard title="Training Hours" :value="totalTrainingHours" unit="hrs" />
    </div>

    <!-- Employee Performance Table -->
    <div class="bg-white p-6 rounded-lg shadow-sm">
      <h3 class="text-lg font-semibold mb-4">Employee Performance Dashboard</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="emp in employeePerformance" :key="emp.employeeId" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span class="text-sm font-medium text-blue-600">{{ getInitials(emp.employeeName) }}</span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{{ emp.employeeName }}</div>
                    <div class="text-sm text-gray-500">{{ emp.grade }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ emp.department }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div class="bg-blue-600 h-2 rounded-full" :style="`width: ${emp.utilization}%`"></div>
                  </div>
                  <span class="text-sm text-gray-900">{{ emp.utilization }}%</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div class="h-2 rounded-full" :class="getPerformanceColor(emp.performanceScore)"></div>
                  </div>
                  <span class="text-sm text-gray-900">{{ emp.performanceScore }}</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ emp.projectsWorked }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <span class="text-sm font-medium text-gray-900">{{ emp.averageRating }}</span>
                  <div class="ml-2 flex items-center">
                    <div v-for="i in 5" :key="i" class="text-yellow-400">
                      <svg v-if="i <= emp.averageRating" class="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                      </svg>
                      <svg v-else class="w-4 h-4 fill-current text-gray-300" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Resource Allocation and Skills -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">Resource Allocation</h3>
        <div class="space-y-4">
          <div v-for="allocation in resourceAllocation" :key="allocation.employeeId" class="p-4 border rounded-lg">
            <div class="flex justify-between items-center mb-2">
              <span class="font-medium">{{ getEmployeeName(allocation.employeeId) }}</span>
              <span class="text-sm px-2 py-1 rounded-full" :class="getAvailabilityClass(allocation.availability)">
                {{ allocation.availability }}
              </span>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span>Utilization:</span>
                <span class="font-medium">{{ allocation.utilization }}%</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>Projects:</span>
                <span class="font-medium">{{ allocation.projects.length }}</span>
              </div>
              <div class="text-xs text-gray-500">
                Skills: {{ allocation.skills.join(', ') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">Department Performance</h3>
        <BarChart :data="departmentPerformanceData" />
      </div>
    </div>

    <!-- Compliance and Training -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">Compliance Overview</h3>
        <div class="space-y-4">
          <div v-for="(value, key) in complianceMetrics" :key="key" class="flex justify-between items-center">
            <span class="capitalize">{{ key.replace(/([A-Z])/g, ' $1').trim() }}</span>
            <div class="flex items-center">
              <div class="w-20 bg-gray-200 rounded-full h-2 mr-2">
                <div class="h-2 rounded-full bg-green-500" :style="`width: ${value}%`"></div>
              </div>
              <span class="text-sm font-medium">{{ value }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">Training & Development</h3>
        <div class="space-y-4">
          <div v-for="emp in employeePerformance" :key="emp.employeeId" class="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <div class="font-medium">{{ emp.employeeName }}</div>
              <div class="text-sm text-gray-500">{{ emp.certifications.join(', ') }}</div>
            </div>
            <div class="text-right">
              <div class="text-sm font-semibold">{{ emp.trainingHours }} hrs</div>
              <div class="text-xs text-gray-500">This month</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Project Risk and Issues Summary -->
    <div class="bg-white p-6 rounded-lg shadow-sm">
      <h3 class="text-lg font-semibold mb-4">Project Risk & Issues Summary</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="text-center p-4 bg-red-50 rounded-lg">
          <div class="text-2xl font-bold text-red-600">{{ totalRisks }}</div>
          <div class="text-sm text-red-700">Open Risks</div>
        </div>
        <div class="text-center p-4 bg-yellow-50 rounded-lg">
          <div class="text-2xl font-bold text-yellow-600">{{ totalIssues }}</div>
          <div class="text-sm text-yellow-700">Active Issues</div>
        </div>
        <div class="text-center p-4 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">{{ totalChangeRequests }}</div>
          <div class="text-sm text-blue-700">Change Requests</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 class="font-medium mb-3">High Priority Items</h4>
          <div class="space-y-2">
            <div v-for="item in highPriorityItems" :key="item.id" class="p-3 bg-red-50 border border-red-200 rounded">
              <div class="font-medium text-red-800">{{ item.title }}</div>
              <div class="text-sm text-red-600">{{ item.description }}</div>
              <div class="text-xs text-red-500 mt-1">Assigned to: {{ item.assignedTo }}</div>
            </div>
          </div>
        </div>

        <div>
          <h4 class="font-medium mb-3">Recent Change Requests</h4>
          <div class="space-y-2">
            <div v-for="cr in recentChangeRequests" :key="cr.id" class="p-3 bg-blue-50 border border-blue-200 rounded">
              <div class="font-medium text-blue-800">{{ cr.title }}</div>
              <div class="text-sm text-blue-600">{{ cr.type }} - {{ cr.priority }} Priority</div>
              <div class="text-xs text-blue-500 mt-1">Status: {{ cr.status }}</div>
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
import { computed } from 'vue'
import { employees, employeePerformance, resourceAllocation, complianceReports, projectTracking } from '@/data/sample'

// Computed properties
const averageUtilization = computed(() => 
  Math.round(employees.reduce((sum, emp) => sum + emp.utilization, 0) / employees.length)
)

const highPerformers = computed(() => 
  employeePerformance.filter(emp => emp.performanceScore >= 90).length
)

const totalTrainingHours = computed(() => 
  employeePerformance.reduce((sum, emp) => sum + emp.trainingHours, 0)
)

const complianceMetrics = computed(() => {
  const report = complianceReports[0]
  return {
    auditCompliance: report.auditCompliance,
    taxCompliance: report.taxCompliance,
    regulatoryCompliance: report.regulatoryCompliance,
    internalPolicyCompliance: report.internalPolicyCompliance
  }
})

const totalRisks = computed(() => 
  projectTracking.reduce((sum, pt) => sum + pt.risks.filter(r => r.status === 'Open').length, 0)
)

const totalIssues = computed(() => 
  projectTracking.reduce((sum, pt) => sum + pt.issues.filter(i => i.status !== 'Closed').length, 0)
)

const totalChangeRequests = computed(() => 
  projectTracking.reduce((sum, pt) => sum + pt.changeRequests.filter(cr => cr.status === 'Under Review').length, 0)
)

const highPriorityItems = computed(() => {
  const items: Array<{
    id: string
    title: string
    description: string
    assignedTo: string
  }> = []
  
  // Add high priority risks
  projectTracking.forEach(pt => {
    pt.risks.filter(r => r.impact === 'High' && r.status === 'Open').forEach(risk => {
      items.push({
        id: `risk-${risk.id}`,
        title: `Risk: ${risk.description}`,
        description: `Probability: ${risk.probability}, Impact: ${risk.impact}`,
        assignedTo: risk.assignedTo
      })
    })
  })
  
  // Add critical issues
  projectTracking.forEach(pt => {
    pt.issues.filter(i => i.priority === 'Critical' && i.status !== 'Closed').forEach(issue => {
      items.push({
        id: `issue-${issue.id}`,
        title: `Issue: ${issue.title}`,
        description: issue.description,
        assignedTo: issue.assignedTo
      })
    })
  })
  
  return items.slice(0, 3) // Show top 3
})

const recentChangeRequests = computed(() => {
  const allCRs = projectTracking.flatMap(pt => pt.changeRequests)
  return allCRs
    .filter(cr => cr.status === 'Under Review')
    .sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime())
    .slice(0, 3)
})

const departmentPerformanceData = computed(() => {
  const deptData: Record<string, { count: number; totalUtilization: number }> = {}
  employees.forEach(emp => {
    if (!deptData[emp.department]) {
      deptData[emp.department] = { count: 0, totalUtilization: 0 }
    }
    deptData[emp.department].count++
    deptData[emp.department].totalUtilization += emp.utilization
  })
  
  return {
    labels: Object.keys(deptData),
    datasets: [
      {
        label: 'Average Utilization',
        data: Object.values(deptData).map(d => Math.round(d.totalUtilization / d.count)),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
      }
    ]
  }
})

// Helper functions
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const getPerformanceColor = (score: number) => {
  if (score >= 90) return 'bg-green-500'
  if (score >= 80) return 'bg-blue-500'
  if (score >= 70) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getEmployeeName = (employeeId: string) => {
  return employees.find(e => e.employeeId === employeeId)?.employeeName || 'Unknown'
}

const getAvailabilityClass = (availability: string) => {
  switch (availability) {
    case 'Available': return 'bg-green-100 text-green-800'
    case 'Partially Available': return 'bg-yellow-100 text-yellow-800'
    case 'Unavailable': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
</script>



