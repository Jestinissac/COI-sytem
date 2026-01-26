<template>
  <div class="priority-config-page">
    <div class="page-header">
      <h1>Priority Configuration</h1>
      <p class="subtitle">Configure how request priority scores are calculated</p>
    </div>
    
    <div v-if="loading" class="loading-state">
      Loading configuration...
    </div>
    
    <div v-else-if="error" class="error-state">
      {{ error }}
      <button @click="loadConfig" class="retry-btn">Retry</button>
    </div>
    
    <template v-else>
      <!-- Level Thresholds Info -->
      <div class="info-card">
        <h3>Priority Levels</h3>
        <div class="levels-grid">
          <div class="level-item critical">
            <span class="level-badge">CRITICAL</span>
            <span class="level-range">80-100</span>
          </div>
          <div class="level-item high">
            <span class="level-badge">HIGH</span>
            <span class="level-range">60-79</span>
          </div>
          <div class="level-item medium">
            <span class="level-badge">MEDIUM</span>
            <span class="level-range">40-59</span>
          </div>
          <div class="level-item low">
            <span class="level-badge">LOW</span>
            <span class="level-range">0-39</span>
          </div>
        </div>
        <p class="formula">
          <strong>Formula:</strong> Priority Score = Sum(Factor Score × Weight) / Sum(Weights)
        </p>
      </div>
      
      <!-- Factors Configuration -->
      <div class="factors-section">
        <h2>Priority Factors</h2>
        <p class="section-desc">Adjust weights to control how much each factor influences the priority score.</p>
        
        <div class="factors-list">
          <div 
            v-for="factor in factors" 
            :key="factor.factor_id" 
            class="factor-card"
            :class="{ 'inactive': !factor.is_active }"
          >
            <div class="factor-header">
              <div class="factor-title">
                <h4>{{ factor.factor_name }}</h4>
                <span class="factor-id">{{ factor.factor_id }}</span>
              </div>
              <label class="toggle">
                <input 
                  type="checkbox" 
                  :checked="factor.is_active"
                  @change="toggleActive(factor)"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
            
            <div class="factor-weight">
              <label>Weight</label>
              <div class="weight-control">
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  step="0.5"
                  :value="factor.weight"
                  @input="(e) => updateWeight(factor, parseFloat(e.target.value))"
                  :disabled="!factor.is_active"
                />
                <span class="weight-value">{{ factor.weight }}x</span>
              </div>
            </div>
            
            <div class="factor-mappings">
              <label>Value Scores (0-100)</label>
              <div class="mappings-grid">
                <div 
                  v-for="(score, value) in factor.value_mappings" 
                  :key="value"
                  class="mapping-item"
                >
                  <span class="mapping-value">{{ value }}</span>
                  <input 
                    type="number" 
                    min="0" 
                    max="100"
                    :value="score"
                    @input="(e) => updateMapping(factor, value, parseInt(e.target.value))"
                    :disabled="!factor.is_active"
                  />
                </div>
              </div>
            </div>
            
            <div class="factor-actions">
              <button 
                v-if="hasChanges(factor)" 
                @click="saveChanges(factor)"
                class="save-btn"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Audit History -->
      <div class="audit-section">
        <h2>Recent Changes</h2>
        <div v-if="auditHistory.length === 0" class="no-audit">
          No configuration changes recorded yet.
        </div>
        <div v-else class="audit-list">
          <div v-for="entry in auditHistory" :key="entry.audit_id" class="audit-entry">
            <div class="audit-info">
              <span class="audit-factor">{{ entry.factor_id }}</span>
              <span class="audit-field">{{ entry.field_changed }}</span>
            </div>
            <div class="audit-details">
              <span class="audit-user">{{ entry.changed_by_name || 'System' }}</span>
              <span class="audit-date">{{ formatDate(entry.changed_at) }}</span>
            </div>
            <div v-if="entry.reason" class="audit-reason">
              {{ entry.reason }}
            </div>
          </div>
        </div>
      </div>
    </template>
    
    <!-- Save Confirmation Modal -->
    <div v-if="showSaveModal" class="modal-overlay" @click.self="showSaveModal = false">
      <div class="modal-content">
        <h3>Save Changes</h3>
        <p>You are updating <strong>{{ pendingFactor?.factor_name }}</strong></p>
        <div class="form-group">
          <label>Reason for change (optional)</label>
          <textarea v-model="saveReason" placeholder="e.g., Adjusting SLA weight for Q1"></textarea>
        </div>
        <div class="modal-actions">
          <button @click="showSaveModal = false" class="cancel-btn">Cancel</button>
          <button @click="confirmSave" class="confirm-btn">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const loading = ref(true)
const error = ref(null)
const factors = ref([])
const auditHistory = ref([])
const originalFactors = ref({})

const showSaveModal = ref(false)
const pendingFactor = ref(null)
const saveReason = ref('')

const loadConfig = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Load factors
    const factorsRes = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/priority/config`,
      {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      }
    )
    const factorsData = await factorsRes.json()
    
    if (factorsData.success) {
      factors.value = factorsData.factors
      // Store original state for change detection
      originalFactors.value = JSON.parse(JSON.stringify(
        factorsData.factors.reduce((acc, f) => {
          acc[f.factor_id] = { weight: f.weight, value_mappings: f.value_mappings, is_active: f.is_active }
          return acc
        }, {})
      ))
    }
    
    // Load audit history
    const auditRes = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/priority/audit?limit=20`,
      {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      }
    )
    const auditData = await auditRes.json()
    
    if (auditData.success) {
      auditHistory.value = auditData.audit
    }
  } catch (err) {
    error.value = 'Failed to load configuration'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const hasChanges = (factor) => {
  const original = originalFactors.value[factor.factor_id]
  if (!original) return false
  
  return (
    original.weight !== factor.weight ||
    original.is_active !== factor.is_active ||
    JSON.stringify(original.value_mappings) !== JSON.stringify(factor.value_mappings)
  )
}

const updateWeight = (factor, weight) => {
  const idx = factors.value.findIndex(f => f.factor_id === factor.factor_id)
  if (idx !== -1) {
    factors.value[idx].weight = weight
  }
}

const updateMapping = (factor, value, score) => {
  const idx = factors.value.findIndex(f => f.factor_id === factor.factor_id)
  if (idx !== -1) {
    factors.value[idx].value_mappings[value] = score
  }
}

const toggleActive = async (factor) => {
  const idx = factors.value.findIndex(f => f.factor_id === factor.factor_id)
  if (idx !== -1) {
    factors.value[idx].is_active = !factors.value[idx].is_active
  }
}

const saveChanges = (factor) => {
  pendingFactor.value = factor
  saveReason.value = ''
  showSaveModal.value = true
}

const confirmSave = async () => {
  if (!pendingFactor.value) return
  
  try {
    const factor = pendingFactor.value
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/priority/config/${factor.factor_id}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          weight: factor.weight,
          value_mappings: factor.value_mappings,
          is_active: factor.is_active,
          reason: saveReason.value
        })
      }
    )
    
    const data = await response.json()
    
    if (data.success) {
      // Update original state
      originalFactors.value[factor.factor_id] = {
        weight: factor.weight,
        value_mappings: JSON.parse(JSON.stringify(factor.value_mappings)),
        is_active: factor.is_active
      }
      
      // Reload audit history
      loadConfig()
    } else {
      alert(data.error || 'Failed to save')
    }
  } catch (err) {
    alert('Network error')
    console.error(err)
  } finally {
    showSaveModal.value = false
    pendingFactor.value = null
  }
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString()
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.priority-config-page {
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

.info-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.info-card h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
}

.levels-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.level-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  border-radius: 8px;
}

.level-item.critical { background: #fee2e2; }
.level-item.high { background: #ffedd5; }
.level-item.medium { background: #fef9c3; }
.level-item.low { background: #dcfce7; }

.level-badge {
  font-weight: 600;
  font-size: 12px;
}

.level-range {
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
}

.formula {
  margin-top: 16px;
  font-size: 13px;
  color: #4b5563;
  background: white;
  padding: 12px;
  border-radius: 6px;
}

.factors-section {
  margin-bottom: 32px;
}

.factors-section h2 {
  font-size: 18px;
  margin: 0 0 8px 0;
}

.section-desc {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 16px;
}

.factors-list {
  display: grid;
  gap: 16px;
}

.factor-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.factor-card.inactive {
  opacity: 0.6;
  background: #f9fafb;
}

.factor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.factor-title h4 {
  margin: 0;
  font-size: 16px;
}

.factor-id {
  font-size: 12px;
  color: #9ca3af;
  font-family: monospace;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle input:checked + .toggle-slider {
  background-color: #3b82f6;
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.factor-weight {
  margin-bottom: 16px;
}

.factor-weight label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px;
}

.weight-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.weight-control input[type="range"] {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  background: #e5e7eb;
  border-radius: 3px;
}

.weight-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
}

.weight-value {
  font-weight: 600;
  min-width: 40px;
}

.factor-mappings label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px;
}

.mappings-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mapping-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #f3f4f6;
  border-radius: 6px;
}

.mapping-value {
  font-size: 12px;
  color: #374151;
  min-width: 80px;
}

.mapping-item input {
  width: 50px;
  padding: 4px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
}

.factor-actions {
  margin-top: 16px;
  text-align: right;
}

.save-btn {
  padding: 8px 16px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.save-btn:hover {
  background: #059669;
}

.audit-section h2 {
  font-size: 18px;
  margin: 0 0 16px 0;
}

.no-audit {
  color: #9ca3af;
  text-align: center;
  padding: 24px;
}

.audit-list {
  display: grid;
  gap: 8px;
}

.audit-entry {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
}

.audit-info {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.audit-factor {
  font-weight: 500;
  font-family: monospace;
  background: #e0e7ff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.audit-field {
  font-size: 12px;
  color: #6b7280;
}

.audit-details {
  font-size: 12px;
  color: #9ca3af;
}

.audit-user {
  margin-right: 8px;
}

.audit-reason {
  margin-top: 4px;
  font-size: 12px;
  color: #4b5563;
  font-style: italic;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 400px;
  max-width: 90%;
}

.modal-content h3 {
  margin: 0 0 16px 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
}

.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.cancel-btn {
  padding: 8px 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
}

.confirm-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
</style>
