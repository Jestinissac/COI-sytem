<template>
  <div class="sla-config-page">
    <div class="page-header">
      <h1>SLA Configuration</h1>
      <p class="subtitle">Configure Service Level Agreement targets per workflow stage</p>
    </div>
    
    <div v-if="loading" class="loading-state">
      Loading configuration...
    </div>
    
    <div v-else-if="error" class="error-state">
      {{ error }}
      <button @click="loadConfig" class="retry-btn">Retry</button>
    </div>
    
    <template v-else>
      <!-- SLA Status Legend -->
      <div class="status-legend">
        <div class="legend-item on-track">
          <span class="legend-dot"></span>
          <span>On Track (0-{{ warningThreshold }}%)</span>
        </div>
        <div class="legend-item warning">
          <span class="legend-dot"></span>
          <span>Warning ({{ warningThreshold }}-{{ criticalThreshold }}%)</span>
        </div>
        <div class="legend-item critical">
          <span class="legend-dot"></span>
          <span>Critical ({{ criticalThreshold }}-100%)</span>
        </div>
        <div class="legend-item breached">
          <span class="legend-dot"></span>
          <span>Breached (>100%)</span>
        </div>
      </div>
      
      <!-- SLA Configurations by Stage -->
      <div class="configs-section">
        <h2>Workflow Stage SLAs</h2>
        
      <div v-if="groupedConfigs.length === 0" class="no-configs">
        <p><strong>No SLA configurations found.</strong></p>
        <p style="margin-top: 8px; font-size: 14px;">SLA configurations are created automatically when the system initializes. If none are visible, please contact your system administrator.</p>
      </div>
      <div v-else class="configs-grid">
        <div v-for="group in groupedConfigs" :key="group.stage" class="config-group">
            <div class="group-header">
              <h3>{{ group.stage }}</h3>
              <span class="config-count">{{ getConfigCount(group) }} {{ getConfigCount(group) === 1 ? 'configuration' : 'configurations' }}</span>
            </div>
            
            <!-- Default Config -->
            <div v-if="group.default" class="config-card default">
              <div class="config-badge">Default</div>
              <div class="config-fields">
                <div class="field">
                  <label>Target Hours</label>
                  <div class="input-group">
                    <input 
                      type="number" 
                      :value="group.default.target_hours"
                      @input="(e) => updateConfig(group.default.id, 'target_hours', parseInt(e.target.value))"
                      min="1"
                      max="720"
                    />
                    <span class="unit">hours</span>
                  </div>
                  <span class="field-hint">Range: 1-720 hours (30 days max)</span>
                </div>
                <div class="field">
                  <label>Warning at</label>
                  <div class="input-group">
                    <input 
                      type="number"
                      :value="group.default.warning_threshold_percent"
                      @input="(e) => updateConfig(group.default.id, 'warning_threshold_percent', parseInt(e.target.value))"
                      min="1"
                      max="99"
                    />
                    <span class="unit">%</span>
                  </div>
                </div>
                <div class="field">
                  <label>Critical at</label>
                  <div class="input-group">
                    <input 
                      type="number"
                      :value="group.default.critical_threshold_percent"
                      @input="(e) => updateConfig(group.default.id, 'critical_threshold_percent', parseInt(e.target.value))"
                      min="1"
                      max="99"
                    />
                    <span class="unit">%</span>
                  </div>
                </div>
              </div>
              <button 
                v-if="hasChanges(group.default.id)" 
                @click="saveConfig(group.default)"
                class="save-btn"
              >
                Save
              </button>
            </div>
            
            <!-- PIE Override -->
            <div v-if="group.pie_override" class="config-card pie-override">
              <div class="config-badge pie">PIE Override</div>
              <p class="override-desc">Stricter SLA for Public Interest Entity clients</p>
              <div class="config-fields">
                <div class="field">
                  <label>Target Hours</label>
                  <div class="input-group">
                    <input 
                      type="number" 
                      :value="group.pie_override.target_hours"
                      @input="(e) => updateConfig(group.pie_override.id, 'target_hours', parseInt(e.target.value))"
                      min="1"
                      max="720"
                    />
                    <span class="unit">hours</span>
                  </div>
                  <span class="field-hint">Range: 1-720 hours (30 days max)</span>
                </div>
              </div>
              <button 
                v-if="hasChanges(group.pie_override.id)" 
                @click="saveConfig(group.pie_override)"
                class="save-btn"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Business Calendar Section -->
      <div class="calendar-section">
        <div class="section-header">
          <h2>Business Calendar</h2>
          <div class="calendar-actions">
            <button @click="generateCalendar" class="action-btn secondary" :disabled="generatingCalendar">
              {{ generatingCalendar ? 'Generating...' : 'Generate 90 Days' }}
            </button>
          </div>
        </div>
        
        <div class="calendar-stats" v-if="calendarStats">
          <div class="stat-card">
            <span class="stat-value">{{ calendarStats.workingDays }}</span>
            <span class="stat-label">Working Days</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ calendarStats.holidays }}</span>
            <span class="stat-label">Holidays</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ calendarStats.syncedFromHrms }}</span>
            <span class="stat-label">From HRMS</span>
          </div>
        </div>
        
        <p class="calendar-note">
          <strong>Note:</strong> In production, holidays are synced from HRMS. 
          Use "Generate 90 Days" to create a prototype calendar with weekends marked as non-working.
        </p>
      </div>
      
      <!-- Breach Summary -->
      <div class="breaches-section">
        <div class="section-header">
          <h2>Active SLA Breaches</h2>
          <button @click="triggerSLACheck" class="action-btn" :disabled="checkingBreaches">
            {{ checkingBreaches ? 'Checking...' : 'Check Now' }}
          </button>
        </div>
        
        <div v-if="breaches.length === 0" class="no-breaches">
          No active SLA breaches. All requests are within their SLA targets.
        </div>
        <div v-else class="breaches-list">
          <div v-for="breach in breaches" :key="breach.id" class="breach-card">
            <div class="breach-header">
              <span class="breach-request">{{ breach.request_id }}</span>
              <span :class="['breach-type', breach.breach_type.toLowerCase()]">{{ breach.breach_type }}</span>
            </div>
            <div class="breach-details">
              <span>{{ breach.client_name }}</span>
              <span class="breach-stage">{{ breach.workflow_stage }}</span>
            </div>
            <div class="breach-timing">
              Target: {{ breach.target_hours }}h | Actual: {{ Math.round(breach.actual_hours) }}h
            </div>
          </div>
        </div>
      </div>
    </template>
    
    <!-- Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const toast = useToast()

const authStore = useAuthStore()
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const loading = ref(true)
const error = ref(null)
const configs = ref([])
const groupedConfigs = ref([])
const originalConfigs = ref({})
const breaches = ref([])
const calendarStats = ref(null)

const checkingBreaches = ref(false)
const generatingCalendar = ref(false)

// Default thresholds (from first config)
const warningThreshold = computed(() => configs.value[0]?.warning_threshold_percent || 75)
const criticalThreshold = computed(() => configs.value[0]?.critical_threshold_percent || 90)

const loadConfig = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Load SLA configs
    const configRes = await fetch(`${API_URL}/api/sla/config`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    const configData = await configRes.json()
    
    if (!configRes.ok) {
      throw new Error(configData.error || 'Failed to load SLA configuration')
    }
    
    if (configData.success) {
      configs.value = configData.configs || []
      groupedConfigs.value = configData.grouped || []
      
      // Store original for change detection
      originalConfigs.value = (configData.configs || []).reduce((acc, c) => {
        acc[c.id] = { ...c }
        return acc
      }, {})
    } else {
      throw new Error(configData.error || 'Failed to load configuration')
    }
    
    // Load breaches
    const breachRes = await fetch(`${API_URL}/api/sla/breaches?resolved=false`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    const breachData = await breachRes.json()
    
    if (breachRes.ok && breachData.success) {
      breaches.value = breachData.breaches || []
    }
    
    // Load calendar stats
    const calRes = await fetch(`${API_URL}/api/sla/calendar`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    const calData = await calRes.json()
    
    if (calRes.ok && calData.success) {
      calendarStats.value = calData.stats || null
    }
  } catch (err) {
    error.value = err.message || 'Failed to load configuration'
    console.error('SLA Config load error:', err)
  } finally {
    loading.value = false
  }
}

const getConfigCount = (group) => {
  let count = 0
  if (group.default) count++
  if (group.pie_override) count++
  count += group.service_overrides?.length || 0
  return count
}

const updateConfig = (configId, field, value) => {
  const config = configs.value.find(c => c.id === configId)
  if (config) {
    config[field] = value
  }
  
  // Also update in grouped
  for (const group of groupedConfigs.value) {
    if (group.default?.id === configId) {
      group.default[field] = value
    }
    if (group.pie_override?.id === configId) {
      group.pie_override[field] = value
    }
  }
}

const hasChanges = (configId) => {
  const current = configs.value.find(c => c.id === configId)
  const original = originalConfigs.value[configId]
  
  if (!current || !original) return false
  
  return (
    current.target_hours !== original.target_hours ||
    current.warning_threshold_percent !== original.warning_threshold_percent ||
    current.critical_threshold_percent !== original.critical_threshold_percent
  )
}

const saveConfig = async (config) => {
  try {
    const response = await fetch(`${API_URL}/api/sla/config/${config.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target_hours: config.target_hours,
        warning_threshold_percent: config.warning_threshold_percent,
        critical_threshold_percent: config.critical_threshold_percent,
        reason: 'Updated via admin UI'
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      originalConfigs.value[config.id] = { ...config }
      toast.success('SLA configuration saved successfully')
    } else {
      toast.error(data.error || 'Failed to save configuration')
    }
  } catch (err) {
    toast.error('Network error. Please check your connection and try again.')
    console.error(err)
  }
}

const triggerSLACheck = async () => {
  checkingBreaches.value = true
  
  try {
    const response = await fetch(`${API_URL}/api/sla/check`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    
    const data = await response.json()
    
    if (data.success) {
      // Reload breaches
      const breachRes = await fetch(`${API_URL}/api/sla/breaches?resolved=false`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      })
      const breachData = await breachRes.json()
      
      if (breachData.success) {
        breaches.value = breachData.breaches
      }
      
      const breachCount = data.results.breached.length
      if (breachCount > 0) {
        toast.warning(`SLA check complete: ${data.results.checked} checked, ${breachCount} breach${breachCount === 1 ? '' : 'es'} found`)
      } else {
        toast.success(`SLA check complete: ${data.results.checked} checked, no breaches found`)
      }
    }
  } catch (err) {
    toast.error('Failed to run SLA check. Please try again.')
    console.error(err)
  } finally {
    checkingBreaches.value = false
  }
}

const generateCalendar = async () => {
  generatingCalendar.value = true
  
  try {
    const response = await fetch(`${API_URL}/api/sla/calendar/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ generatePrototype: true, days: 90 })
    })
    
    const data = await response.json()
    
    if (data.success) {
      toast.success(data.message || 'Business calendar generated successfully')
      loadConfig() // Reload stats
    } else {
      toast.error(data.error || 'Failed to generate calendar')
    }
  } catch (err) {
    toast.error('Failed to generate calendar. Please try again.')
    console.error(err)
  } finally {
    generatingCalendar.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.sla-config-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.subtitle {
  color: #6b7280;
  margin-top: 4px;
}

.loading-state, .error-state {
  text-align: center;
  padding: 40px;
}

.retry-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.status-legend {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  padding: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-item.on-track .legend-dot { background: #16a34a; }
.legend-item.warning .legend-dot { background: #ca8a04; }
.legend-item.critical .legend-dot { background: #ea580c; }
.legend-item.breached .legend-dot { background: #dc2626; }

.configs-section, .calendar-section, .breaches-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h2, .configs-section h2 {
  margin: 0 0 16px 0;
  font-size: 18px;
}

.configs-grid {
  display: grid;
  gap: 24px;
}

.config-group {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.group-header {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-header h3 {
  margin: 0;
  font-size: 16px;
}

.config-count {
  font-size: 12px;
  color: #6b7280;
}

.config-card {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.config-card:last-child {
  border-bottom: none;
}

.config-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  margin-bottom: 12px;
  background: #e5e7eb;
  color: #374151;
}

.config-badge.pie {
  background: white;
  border: 1px solid #fbbf24;
  color: #92400e;
}

.override-desc {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 12px;
}

.config-fields {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.field {
  flex: 1;
  min-width: 120px;
}

.field label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.input-group input {
  width: 80px;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.input-group .unit {
  color: #6b7280;
  font-size: 13px;
}

.field-hint {
  display: block;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.save-btn {
  margin-top: 12px;
  padding: 6px 14px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.save-btn:hover {
  background: #059669;
}

.calendar-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  flex: 1;
  padding: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: #111827;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

.calendar-note {
  font-size: 13px;
  color: #6b7280;
  background: white;
  border: 1px solid #fbbf24;
  padding: 12px;
  border-radius: 6px;
}

.action-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.action-btn.secondary {
  background: #6b7280;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.no-breaches {
  text-align: center;
  padding: 32px;
  color: #16a34a;
  background: white;
  border: 1px solid #86efac;
  border-radius: 8px;
}

.breaches-list {
  display: grid;
  gap: 12px;
}

.breach-card {
  padding: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #dc2626;
  border-radius: 8px;
}

.breach-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.breach-request {
  font-weight: 600;
}

.breach-type {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.breach-type.breached {
  background: #dc2626;
  color: white;
}

.breach-type.critical {
  background: #ea580c;
  color: white;
}

.breach-type.warning {
  background: #fef08a;
  color: #854d0e;
}

.breach-details {
  font-size: 13px;
  color: #4b5563;
  margin-bottom: 4px;
}

.breach-stage {
  margin-left: 8px;
  color: #9ca3af;
}

.breach-timing {
  font-size: 12px;
  font-family: monospace;
  color: #6b7280;
}

.no-configs {
  text-align: center;
  padding: 40px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #6b7280;
}
</style>
