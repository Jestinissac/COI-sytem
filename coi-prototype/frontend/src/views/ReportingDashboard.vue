<template>
  <div class="reporting-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <h1>Advanced Reporting</h1>
        <p>Comprehensive analytics and insights for COI management</p>
      </div>
      <div class="header-actions">
        <select v-model="selectedPeriod" class="period-select">
          <option value="week">Last 7 Days</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
          <option value="custom">Custom Range</option>
        </select>
        <button @click="exportReport" class="export-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Export Report
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading dashboard data...</p>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="dashboard-content">
      <!-- Key Metrics Row -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div class="metric-content">
            <span class="metric-value">{{ metrics.totalRequests }}</span>
            <span class="metric-label">Total Requests</span>
            <span class="metric-trend" :class="metrics.requestsTrend > 0 ? 'up' : 'down'">
              {{ metrics.requestsTrend > 0 ? '+' : '' }}{{ metrics.requestsTrend }}% vs last period
            </span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="metric-content">
            <span class="metric-value">{{ metrics.approvalRate }}%</span>
            <span class="metric-label">Approval Rate</span>
            <span class="metric-trend up">{{ metrics.approved }} approved</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="metric-content">
            <span class="metric-value">{{ metrics.avgProcessingDays }}</span>
            <span class="metric-label">Avg Days to Process</span>
            <span class="metric-trend" :class="metrics.processingTrend < 0 ? 'up' : 'down'">
              {{ metrics.processingTrend < 0 ? '' : '+' }}{{ metrics.processingTrend }} days vs target
            </span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="metric-content">
            <span class="metric-value">{{ metrics.conflictsDetected }}</span>
            <span class="metric-label">Conflicts Detected</span>
            <span class="metric-trend">{{ metrics.conflictRate }}% of requests</span>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <!-- Status Distribution -->
        <div class="chart-card">
          <h3>Request Status Distribution</h3>
          <div class="pie-chart-container">
            <div class="pie-chart">
              <svg viewBox="0 0 100 100">
                <circle 
                  v-for="(segment, index) in statusSegments" 
                  :key="index"
                  cx="50" 
                  cy="50" 
                  r="40"
                  fill="transparent"
                  :stroke="segment.color"
                  stroke-width="20"
                  :stroke-dasharray="segment.dashArray"
                  :stroke-dashoffset="segment.offset"
                  transform="rotate(-90 50 50)"
                />
              </svg>
            </div>
            <div class="pie-legend">
              <div v-for="(item, key) in statusData" :key="key" class="legend-item">
                <span class="legend-color" :style="{ background: getStatusColor(key) }"></span>
                <span class="legend-label">{{ key }}</span>
                <span class="legend-value">{{ item }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Requests Over Time -->
        <div class="chart-card wide">
          <h3>Requests Over Time</h3>
          <div class="line-chart">
            <div class="chart-area">
              <div 
                v-for="(point, index) in timelineData" 
                :key="index" 
                class="chart-bar"
                :style="{ height: getBarHeight(point.count) + '%' }"
              >
                <span class="bar-value">{{ point.count }}</span>
              </div>
            </div>
            <div class="chart-labels">
              <span v-for="(point, index) in timelineData" :key="index">{{ point.date }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tables Row -->
      <div class="tables-row">
        <!-- Service Type Breakdown -->
        <div class="table-card">
          <h3>Requests by Service Type</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Service Type</th>
                <th>Count</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in serviceTypeData" :key="index">
                <td>{{ item.type }}</td>
                <td>{{ item.count }}</td>
                <td>
                  <div class="progress-bar">
                    <div class="progress" :style="{ width: item.percentage + '%' }"></div>
                  </div>
                  <span class="percentage">{{ item.percentage }}%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Recent Activity -->
        <div class="table-card">
          <h3>Recent Activity</h3>
          <div class="activity-list">
            <div v-for="(activity, index) in recentActivity" :key="index" class="activity-item">
              <div class="activity-icon" :class="activity.type">
                <svg v-if="activity.type === 'approved'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else-if="activity.type === 'rejected'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div class="activity-content">
                <span class="activity-title">{{ activity.title }}</span>
                <span class="activity-meta">{{ activity.user }} • {{ activity.time }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Monthly Report Section -->
      <div class="monthly-report-section">
        <div class="section-header">
          <h3>Monthly Compliance Report</h3>
          <div class="month-selector">
            <select v-model="selectedMonth" class="month-select">
              <option v-for="month in availableMonths" :key="month.value" :value="month.value">
                {{ month.label }}
              </option>
            </select>
            <button @click="generateReport" class="generate-btn" :disabled="generatingReport">
              {{ generatingReport ? 'Generating...' : 'Generate Report' }}
            </button>
          </div>
        </div>

        <div v-if="monthlyReport" class="report-preview">
          <div class="report-header">
            <h4>{{ monthlyReport.period }}</h4>
            <span class="generated-at">Generated: {{ formatDate(monthlyReport.generatedAt) }}</span>
          </div>
          <div class="report-stats">
            <div class="report-stat">
              <span class="stat-value">{{ monthlyReport.total }}</span>
              <span class="stat-label">Total Requests</span>
            </div>
            <div class="report-stat">
              <span class="stat-value text-green">{{ monthlyReport.byStatus?.Approved || 0 }}</span>
              <span class="stat-label">Approved</span>
            </div>
            <div class="report-stat">
              <span class="stat-value text-red">{{ monthlyReport.byStatus?.Rejected || 0 }}</span>
              <span class="stat-label">Rejected</span>
            </div>
            <div class="report-stat">
              <span class="stat-value">{{ monthlyReport.averageProcessingTime }}</span>
              <span class="stat-label">Avg Days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

interface Metrics {
  totalRequests: number
  approved: number
  rejected: number
  pending: number
  approvalRate: number
  avgProcessingDays: number
  conflictsDetected: number
  conflictRate: number
  requestsTrend: number
  processingTrend: number
}

interface TimelinePoint {
  date: string
  count: number
}

interface ServiceTypeItem {
  type: string
  count: number
  percentage: number
}

interface ActivityItem {
  type: 'approved' | 'rejected' | 'created'
  title: string
  user: string
  time: string
}

interface MonthlyReport {
  period: string
  total: number
  byStatus: Record<string, number>
  byServiceType: Record<string, number>
  averageProcessingTime: number
  conflictsDetected: number
  duplicatesFound: number
  generatedAt?: string
}

const loading = ref(true)
const selectedPeriod = ref('month')
const selectedMonth = ref('')
const generatingReport = ref(false)
const monthlyReport = ref<MonthlyReport | null>(null)

const metrics = ref<Metrics>({
  totalRequests: 0,
  approved: 0,
  rejected: 0,
  pending: 0,
  approvalRate: 0,
  avgProcessingDays: 0,
  conflictsDetected: 0,
  conflictRate: 0,
  requestsTrend: 0,
  processingTrend: 0
})

const statusData = ref<Record<string, number>>({})
const timelineData = ref<TimelinePoint[]>([])
const serviceTypeData = ref<ServiceTypeItem[]>([])
const recentActivity = ref<ActivityItem[]>([])

const availableMonths = computed(() => {
  const months = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    })
  }
  return months
})

const statusSegments = computed(() => {
  const total = Object.values(statusData.value).reduce((sum, val) => sum + val, 0)
  if (total === 0) return []
  
  let offset = 0
  const circumference = 2 * Math.PI * 40
  
  return Object.entries(statusData.value).map(([status, count]) => {
    const percentage = (count / total) * 100
    const dashLength = (percentage / 100) * circumference
    const segment = {
      color: getStatusColor(status),
      dashArray: `${dashLength} ${circumference - dashLength}`,
      offset: -offset
    }
    offset += dashLength
    return segment
  })
})

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'Approved': '#10b981',
    'Rejected': '#ef4444',
    'Pending Director': '#f59e0b',
    'Pending Compliance': '#3b82f6',
    'Pending Partner': '#8b5cf6',
    'Draft': '#6b7280'
  }
  return colors[status] || '#94a3b8'
}

function getBarHeight(count: number): number {
  const max = Math.max(...timelineData.value.map(p => p.count), 1)
  return (count / max) * 100
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function loadDashboardData() {
  loading.value = true
  try {
    const response = await api.get('/coi/monitoring/dashboard')
    if (response.data.success) {
      const dashboard = response.data.dashboard
      
      // Populate metrics
      metrics.value = {
        totalRequests: dashboard.monthlyStats?.total || 0,
        approved: dashboard.monthlyStats?.approved || 0,
        rejected: dashboard.monthlyStats?.rejected || 0,
        pending: dashboard.alerts?.pendingCompliance || 0,
        approvalRate: dashboard.monthlyStats?.approvalRate || 0,
        avgProcessingDays: 3,
        conflictsDetected: dashboard.alerts?.staleRequests || 0,
        conflictRate: 5,
        requestsTrend: 12,
        processingTrend: -1
      }
      
      // Status distribution
      statusData.value = {
        'Approved': dashboard.monthlyStats?.approved || 0,
        'Rejected': dashboard.monthlyStats?.rejected || 0,
        'Pending Compliance': dashboard.alerts?.pendingCompliance || 0,
        'Pending Director': dashboard.alerts?.pendingDirector || 0
      }
      
      // Timeline data
      timelineData.value = dashboard.weeklyActivity || []
    }
    
    // Load service type breakdown
    await loadServiceTypeData()
    
    // Load recent activity
    await loadRecentActivity()
    
  } catch (error) {
    console.error('Error loading dashboard:', error)
  } finally {
    loading.value = false
  }
}

async function loadServiceTypeData() {
  try {
    const response = await api.get('/coi/requests')
    const requests = response.data.requests || response.data || []
    
    const typeCounts: Record<string, number> = {}
    requests.forEach((req: any) => {
      const type = req.service_type || 'Unknown'
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })
    
    const total = Object.values(typeCounts).reduce((sum, val) => sum + val, 0)
    serviceTypeData.value = Object.entries(typeCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  } catch (error) {
    console.error('Error loading service type data:', error)
  }
}

async function loadRecentActivity() {
  try {
    const response = await api.get('/coi/requests')
    const requests = (response.data.requests || response.data || []).slice(0, 5)
    
    recentActivity.value = requests.map((req: any) => ({
      type: req.status === 'Approved' ? 'approved' : 
            req.status === 'Rejected' ? 'rejected' : 'created',
      title: `${req.request_id || 'Request'} - ${req.service_type || 'Unknown'}`,
      user: req.requestor_name || 'Unknown',
      time: req.updated_at ? new Date(req.updated_at).toLocaleDateString() : 'N/A'
    }))
  } catch (error) {
    console.error('Error loading recent activity:', error)
  }
}

async function generateReport() {
  if (!selectedMonth.value) {
    selectedMonth.value = availableMonths.value[0]?.value || ''
  }
  
  generatingReport.value = true
  try {
    const [year, month] = selectedMonth.value.split('-')
    const response = await api.get(`/coi/reports/monthly/${year}/${month}`)
    if (response.data.success) {
      monthlyReport.value = {
        ...response.data.report,
        generatedAt: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error generating report:', error)
  } finally {
    generatingReport.value = false
  }
}

function exportReport() {
  const data = {
    metrics: metrics.value,
    statusDistribution: statusData.value,
    serviceTypes: serviceTypeData.value,
    generatedAt: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `coi-report-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  selectedMonth.value = availableMonths.value[0]?.value || ''
  loadDashboardData()
})
</script>

<style scoped>
.reporting-dashboard {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-content h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.header-content p {
  margin: 4px 0 0;
  color: #64748b;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.period-select {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  font-size: 14px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.export-btn svg {
  width: 16px;
  height: 16px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-icon svg {
  width: 24px;
  height: 24px;
}

.metric-icon.blue {
  background: #dbeafe;
  color: #2563eb;
}

.metric-icon.green {
  background: #dcfce7;
  color: #16a34a;
}

.metric-icon.orange {
  background: #ffedd5;
  color: #ea580c;
}

.metric-icon.red {
  background: #fee2e2;
  color: #dc2626;
}

.metric-content {
  display: flex;
  flex-direction: column;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.metric-label {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 4px;
}

.metric-trend {
  font-size: 11px;
  font-weight: 500;
}

.metric-trend.up {
  color: #16a34a;
}

.metric-trend.down {
  color: #dc2626;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-card h3 {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.pie-chart-container {
  display: flex;
  align-items: center;
  gap: 24px;
}

.pie-chart {
  width: 120px;
  height: 120px;
}

.pie-legend {
  flex: 1;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-label {
  flex: 1;
  color: #64748b;
}

.legend-value {
  font-weight: 600;
  color: #1e293b;
}

.line-chart {
  height: 200px;
  display: flex;
  flex-direction: column;
}

.chart-area {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 0 8px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  position: relative;
  transition: height 0.3s;
}

.bar-value {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
}

.chart-labels {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-top: 1px solid #e2e8f0;
  margin-top: 8px;
}

.chart-labels span {
  flex: 1;
  text-align: center;
  font-size: 10px;
  color: #94a3b8;
}

.tables-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.table-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-card h3 {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th, .data-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.data-table th {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.data-table td {
  font-size: 13px;
  color: #334155;
}

.progress-bar {
  width: 60px;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  display: inline-block;
  vertical-align: middle;
  margin-right: 8px;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
}

.percentage {
  font-size: 11px;
  color: #94a3b8;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-icon svg {
  width: 16px;
  height: 16px;
}

.activity-icon.approved {
  background: #dcfce7;
  color: #16a34a;
}

.activity-icon.rejected {
  background: #fee2e2;
  color: #dc2626;
}

.activity-icon.created {
  background: #dbeafe;
  color: #2563eb;
}

.activity-content {
  display: flex;
  flex-direction: column;
}

.activity-title {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.activity-meta {
  font-size: 11px;
  color: #94a3b8;
}

.monthly-report-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.month-selector {
  display: flex;
  gap: 12px;
}

.month-select {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  font-size: 14px;
}

.generate-btn {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.generate-btn:hover:not(:disabled) {
  background: #5b6fd6;
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.report-preview {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.report-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.generated-at {
  font-size: 12px;
  color: #94a3b8;
}

.report-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.report-stat {
  text-align: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.report-stat .stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.report-stat .stat-value.text-green {
  color: #16a34a;
}

.report-stat .stat-value.text-red {
  color: #dc2626;
}

.report-stat .stat-label {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
}

@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .charts-row, .tables-row {
    grid-template-columns: 1fr;
  }
}
</style>

