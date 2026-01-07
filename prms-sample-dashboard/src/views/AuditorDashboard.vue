<template>
  <div class="space-y-8">
    <!-- System Security & Compliance KPIs -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <KPICard title="Active Users" :value="activeUsersCount" />
      <KPICard title="Failed Logins" :value="failedLoginsCount" status="warning" />
      <KPICard title="System Alerts" :value="systemAlertsCount" status="warning" />
      <KPICard title="Compliance Score" :value="overallComplianceScore" unit="%" />
    </div>

    <!-- System Security Overview -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">System Access Patterns</h3>
        <BarChart :data="accessPatternsData" />
        <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div class="text-center p-3 bg-blue-50 rounded">
            <p class="text-gray-600">Peak Hours</p>
            <p class="font-bold text-blue-600">9 AM - 5 PM</p>
          </div>
          <div class="text-center p-3 bg-green-50 rounded">
            <p class="text-gray-600">Off-hours Access</p>
            <p class="font-bold text-green-600">{{ offHoursAccessCount }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">Security Incidents</h3>
        <div class="space-y-4">
          <div v-for="incident in recentSecurityIncidents" :key="incident.id" class="p-4 border rounded-lg" :class="getIncidentClass(incident.severity)">
            <div class="flex justify-between items-start">
              <div>
                <div class="font-medium">{{ incident.title }}</div>
                <div class="text-sm text-gray-600">{{ incident.description }}</div>
                <div class="text-xs text-gray-500 mt-1">User: {{ incident.user }} • IP: {{ incident.ipAddress }}</div>
              </div>
              <span class="px-2 py-1 rounded-full text-xs font-medium" :class="getSeverityClass(incident.severity)">
                {{ incident.severity }}
              </span>
            </div>
            <div class="mt-2 text-xs text-gray-500">{{ incident.timestamp }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Comprehensive Audit Log -->
    <div class="bg-white p-6 rounded-lg shadow-sm">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">System Audit Log</h3>
        <div class="flex gap-3">
          <input class="border rounded px-3 py-2 w-48" placeholder="Filter by user" v-model="filters.user" />
          <select v-model="filters.action" class="border rounded px-3 py-2">
            <option value="">All Actions</option>
            <option value="Login">Login</option>
            <option value="Logout">Logout</option>
            <option value="Create">Create</option>
            <option value="Edit">Edit</option>
            <option value="Delete">Delete</option>
            <option value="Approve">Approve</option>
            <option value="Reject">Reject</option>
            <option value="Export">Export</option>
            <option value="Access">Access</option>
          </select>
          <select v-model="filters.severity" class="border rounded px-3 py-2">
            <option value="">All Severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="log in filteredAuditLogs" :key="log.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ log.timestamp }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ log.user }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getActionClass(log.action)">
                  {{ log.action }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ log.module }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getSeverityClass(log.severity)">
                  {{ log.severity }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ log.ipAddress }}</td>
              <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" :title="log.details">{{ log.details }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="mt-4 text-sm text-gray-500">
        Showing {{ filteredAuditLogs.length }} of {{ auditLogs.length }} audit entries
      </div>
    </div>

    <!-- Compliance & Policy Monitoring -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">Policy Compliance Status</h3>
        <div class="space-y-4">
          <div v-for="policy in compliancePolicies" :key="policy.id" class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="font-medium">{{ policy.name }}</span>
              <span class="text-sm px-2 py-1 rounded-full" :class="getComplianceClass(policy.status)">
                {{ policy.status }}
              </span>
            </div>
            <div class="h-2 bg-gray-200 rounded">
              <div class="h-2 rounded" :class="getComplianceBarClass(policy.status)" :style="`width: ${policy.complianceRate}%`"></div>
            </div>
            <div class="text-xs text-gray-500">{{ policy.description }}</div>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-4">User Access Rights</h3>
        <div class="space-y-3">
          <div v-for="user in userAccessRights" :key="user.id" class="p-3 border rounded-lg">
            <div class="flex justify-between items-center mb-2">
              <span class="font-medium">{{ user.name }}</span>
              <span class="text-sm px-2 py-1 rounded-full" :class="getAccessClass(user.accessLevel)">
                {{ user.accessLevel }}
              </span>
            </div>
            <div class="text-sm text-gray-600">{{ user.role }}</div>
            <div class="text-xs text-gray-500 mt-1">Last access: {{ user.lastAccess }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- System Health & Performance -->
    <div class="bg-white p-6 rounded-lg shadow-sm">
      <h3 class="text-lg font-semibold mb-4">System Health Metrics</h3>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="text-center p-4 bg-green-50 rounded-lg">
          <div class="text-2xl font-bold text-green-600">{{ systemUptime }}%</div>
          <div class="text-sm text-green-700">System Uptime</div>
        </div>
        <div class="text-center p-4 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">{{ activeSessions }}</div>
          <div class="text-sm text-blue-700">Active Sessions</div>
        </div>
        <div class="text-center p-4 bg-yellow-50 rounded-lg">
          <div class="text-2xl font-bold text-yellow-600">{{ pendingApprovals }}</div>
          <div class="text-sm text-yellow-700">Pending Approvals</div>
        </div>
        <div class="text-center p-4 bg-purple-50 rounded-lg">
          <div class="text-2xl font-bold text-purple-600">{{ dataBackupStatus }}</div>
          <div class="text-sm text-purple-700">Backup Status</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import KPICard from '@/components/ui/KPICard.vue'
import BarChart from '@/components/charts/BarChart.vue'
import { computed, reactive } from 'vue'

// Filters for audit log
const filters = reactive({ 
  user: '', 
  action: '', 
  severity: '' 
})

// System metrics
const activeUsersCount = 45
const failedLoginsCount = 12
const systemAlertsCount = 3
const overallComplianceScore = 94
const offHoursAccessCount = 8
const systemUptime = 99.8
const activeSessions = 23
const pendingApprovals = 7
const dataBackupStatus = 100

// Security incidents
const recentSecurityIncidents = [
  {
    id: 'SI-001',
    title: 'Multiple Failed Login Attempts',
    description: 'User account locked due to 5 failed login attempts',
    user: 'unknown@external.com',
    ipAddress: '192.168.1.100',
    severity: 'Medium',
    timestamp: '2025-03-12 14:30'
  },
  {
    id: 'SI-002',
    title: 'Unauthorized Access Attempt',
    description: 'Attempted access to restricted admin module',
    user: 'user@company.com',
    ipAddress: '10.0.0.50',
    severity: 'High',
    timestamp: '2025-03-12 13:15'
  },
  {
    id: 'SI-003',
    title: 'Data Export Request',
    description: 'Large data export request from non-standard location',
    user: 'manager@company.com',
    ipAddress: '172.16.0.25',
    severity: 'Low',
    timestamp: '2025-03-12 11:45'
  }
]

// Comprehensive audit log
const auditLogs = [
  { id: 'L-01', timestamp: '2025-03-12 15:30', user: 'admin@prms', action: 'Login', module: 'Authentication', severity: 'Low', ipAddress: '192.168.1.1', details: 'Successful login from office network' },
  { id: 'L-02', timestamp: '2025-03-12 15:25', user: 'pm@prms', action: 'Create', module: 'Project Management', severity: 'Low', ipAddress: '192.168.1.10', details: 'Created new project P025010' },
  { id: 'L-03', timestamp: '2025-03-12 15:20', user: 'fin@prms', action: 'Approve', module: 'Finance', severity: 'Medium', ipAddress: '192.168.1.15', details: 'Approved invoice INV-250301 for KWD 22,000' },
  { id: 'L-04', timestamp: '2025-03-12 15:15', user: 'auditor@prms', action: 'Export', module: 'Reports', severity: 'Medium', ipAddress: '192.168.1.20', details: 'Exported compliance report for Q1 2025' },
  { id: 'L-05', timestamp: '2025-03-12 15:10', user: 'unknown@external.com', action: 'Login', module: 'Authentication', severity: 'High', ipAddress: '203.0.113.1', details: 'Failed login attempt - account locked' },
  { id: 'L-06', timestamp: '2025-03-12 15:05', user: 'manager@prms', action: 'Edit', module: 'User Management', severity: 'Medium', ipAddress: '192.168.1.25', details: 'Updated user permissions for EMP001' },
  { id: 'L-07', timestamp: '2025-03-12 15:00', user: 'admin@prms', action: 'Access', module: 'System Admin', severity: 'High', ipAddress: '192.168.1.1', details: 'Accessed system configuration panel' },
  { id: 'L-08', timestamp: '2025-03-12 14:55', user: 'pm@prms', action: 'Delete', module: 'Project Management', severity: 'Medium', ipAddress: '192.168.1.10', details: 'Deleted draft project proposal' }
]

// Compliance policies
const compliancePolicies = [
  { id: 'CP-01', name: 'Password Policy', status: 'Compliant', complianceRate: 98, description: 'Strong password requirements and regular updates' },
  { id: 'CP-02', name: 'Access Control', status: 'Compliant', complianceRate: 95, description: 'Role-based access control implementation' },
  { id: 'CP-03', name: 'Data Encryption', status: 'Warning', complianceRate: 87, description: 'Data encryption at rest and in transit' },
  { id: 'CP-04', name: 'Audit Logging', status: 'Compliant', complianceRate: 100, description: 'Comprehensive system activity logging' },
  { id: 'CP-05', name: 'Backup Procedures', status: 'Compliant', complianceRate: 92, description: 'Regular data backup and recovery testing' }
]

// User access rights
const userAccessRights = [
  { id: 'UAR-01', name: 'Admin User', role: 'System Administrator', accessLevel: 'Full Access', lastAccess: '2025-03-12 15:30' },
  { id: 'UAR-02', name: 'PM User', role: 'Project Manager', accessLevel: 'Project Access', lastAccess: '2025-03-12 15:25' },
  { id: 'UAR-03', name: 'Finance User', role: 'Finance Manager', accessLevel: 'Finance Access', lastAccess: '2025-03-12 15:20' },
  { id: 'UAR-04', name: 'Auditor User', role: 'Internal Auditor', accessLevel: 'Read Only', lastAccess: '2025-03-12 15:15' }
]

// Computed properties
const filteredAuditLogs = computed(() => auditLogs.filter(log => (
  (!filters.user || log.user.toLowerCase().includes(filters.user.toLowerCase())) &&
  (!filters.action || log.action === filters.action) &&
  (!filters.severity || log.severity === filters.severity)
)))

const accessPatternsData = computed(() => ({
  labels: ['6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'],
  datasets: [
    { label: 'User Logins', data: [2, 15, 8, 12, 6, 3], backgroundColor: '#3B82F6' },
    { label: 'System Actions', data: [5, 45, 25, 38, 18, 8], backgroundColor: '#10B981' }
  ]
}))

// Helper functions
const getIncidentClass = (severity: string) => {
  switch (severity) {
    case 'Critical': return 'bg-red-50 border-red-200'
    case 'High': return 'bg-orange-50 border-orange-200'
    case 'Medium': return 'bg-yellow-50 border-yellow-200'
    case 'Low': return 'bg-blue-50 border-blue-200'
    default: return 'bg-gray-50 border-gray-200'
  }
}

const getSeverityClass = (severity: string) => {
  switch (severity) {
    case 'Critical': return 'bg-red-100 text-red-800'
    case 'High': return 'bg-orange-100 text-orange-800'
    case 'Medium': return 'bg-yellow-100 text-yellow-800'
    case 'Low': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getActionClass = (action: string) => {
  switch (action) {
    case 'Login': return 'bg-green-100 text-green-800'
    case 'Logout': return 'bg-gray-100 text-gray-800'
    case 'Create': return 'bg-blue-100 text-blue-800'
    case 'Edit': return 'bg-yellow-100 text-yellow-800'
    case 'Delete': return 'bg-red-100 text-red-800'
    case 'Approve': return 'bg-green-100 text-green-800'
    case 'Reject': return 'bg-red-100 text-red-800'
    case 'Export': return 'bg-purple-100 text-purple-800'
    case 'Access': return 'bg-indigo-100 text-indigo-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getComplianceClass = (status: string) => {
  switch (status) {
    case 'Compliant': return 'bg-green-100 text-green-800'
    case 'Warning': return 'bg-yellow-100 text-yellow-800'
    case 'Non-Compliant': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getComplianceBarClass = (status: string) => {
  switch (status) {
    case 'Compliant': return 'bg-green-500'
    case 'Warning': return 'bg-yellow-500'
    case 'Non-Compliant': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

const getAccessClass = (accessLevel: string) => {
  switch (accessLevel) {
    case 'Full Access': return 'bg-red-100 text-red-800'
    case 'Project Access': return 'bg-blue-100 text-blue-800'
    case 'Finance Access': return 'bg-green-100 text-green-800'
    case 'Read Only': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
</script>



