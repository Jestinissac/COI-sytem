<template>
  <div class="score-breakdown-modal" v-if="visible" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Priority Score Breakdown</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>
      
      <div v-if="loading" class="loading">
        Loading...
      </div>
      
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      
      <template v-else>
        <!-- Overall Score -->
        <div class="score-overview">
          <div class="score-circle" :class="`level-${breakdown?.level?.toLowerCase()}`">
            <span class="score-value">{{ breakdown?.score }}</span>
            <span class="score-max">/100</span>
          </div>
          <div class="score-info">
            <div class="score-level">{{ breakdown?.level }}</div>
            <div class="score-request">{{ requestId }}</div>
          </div>
        </div>
        
        <!-- Level Thresholds -->
        <div class="thresholds">
          <div class="threshold-bar">
            <div class="threshold-segment low" style="width: 40%">LOW</div>
            <div class="threshold-segment medium" style="width: 20%">MED</div>
            <div class="threshold-segment high" style="width: 20%">HIGH</div>
            <div class="threshold-segment critical" style="width: 20%">CRIT</div>
            <div 
              class="score-marker" 
              :style="{ left: `${breakdown?.score}%` }"
            ></div>
          </div>
          <div class="threshold-labels">
            <span>0</span>
            <span>40</span>
            <span>60</span>
            <span>80</span>
            <span>100</span>
          </div>
        </div>
        
        <!-- Factor Breakdown -->
        <div class="factors-section">
          <h4>Contributing Factors</h4>
          <table class="factors-table">
            <thead>
              <tr>
                <th>Factor</th>
                <th>Value</th>
                <th>Score</th>
                <th>Weight</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="factor in breakdown?.breakdown" 
                :key="factor.factorId"
                :class="{ 'high-contribution': factor.contribution > 100 }"
              >
                <td class="factor-name">{{ factor.factor }}</td>
                <td class="factor-value">{{ factor.value }}</td>
                <td class="factor-score">{{ factor.score }}</td>
                <td class="factor-weight">{{ factor.weight }}x</td>
                <td class="factor-contribution">{{ Math.round(factor.contribution) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4"><strong>Total</strong></td>
                <td><strong>{{ totalContribution }}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <!-- SLA Status -->
        <div v-if="breakdown?.slaStatus" class="sla-section">
          <h4>SLA Status</h4>
          <div class="sla-details">
            <div class="sla-stat">
              <span class="sla-label">Status</span>
              <span :class="['sla-value', `sla-${breakdown.slaStatus.status?.toLowerCase()}`]">
                {{ breakdown.slaStatus.status }}
              </span>
            </div>
            <div class="sla-stat">
              <span class="sla-label">Target</span>
              <span class="sla-value">{{ breakdown.slaStatus.targetHours }}h</span>
            </div>
            <div class="sla-stat">
              <span class="sla-label">Elapsed</span>
              <span class="sla-value">{{ breakdown.slaStatus.hoursElapsed }}h</span>
            </div>
            <div class="sla-stat">
              <span class="sla-label">Remaining</span>
              <span class="sla-value">{{ breakdown.slaStatus.hoursRemaining }}h</span>
            </div>
          </div>
          <div class="sla-progress">
            <div 
              class="sla-progress-bar" 
              :class="`sla-${breakdown.slaStatus.status?.toLowerCase()}`"
              :style="{ width: `${Math.min(breakdown.slaStatus.percentUsed, 100)}%` }"
            ></div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  requestId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['close'])

const authStore = useAuthStore()
const loading = ref(false)
const error = ref(null)
const breakdown = ref(null)

const totalContribution = computed(() => {
  if (!breakdown.value?.breakdown) return 0
  return Math.round(breakdown.value.breakdown.reduce((sum, f) => sum + f.contribution, 0))
})

const fetchBreakdown = async () => {
  if (!props.requestId) return
  
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/priority/breakdown/${props.requestId}`,
      {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      }
    )
    
    const data = await response.json()
    
    if (data.success) {
      breakdown.value = data.priority
    } else {
      error.value = data.error || 'Failed to load breakdown'
    }
  } catch (err) {
    error.value = 'Network error. Please try again.'
    console.error('Error fetching breakdown:', err)
  } finally {
    loading.value = false
  }
}

const close = () => {
  emit('close')
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    fetchBreakdown()
  }
})
</script>

<style scoped>
.score-breakdown-modal {
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
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
}

.loading, .error {
  padding: 40px;
  text-align: center;
}

.error {
  color: #dc2626;
}

.score-overview {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: #f9fafb;
}

.score-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

.level-critical { background: linear-gradient(135deg, #dc2626, #b91c1c); }
.level-high { background: linear-gradient(135deg, #ea580c, #c2410c); }
.level-medium { background: linear-gradient(135deg, #ca8a04, #a16207); }
.level-low { background: linear-gradient(135deg, #16a34a, #15803d); }

.score-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.score-max {
  font-size: 12px;
  opacity: 0.8;
}

.score-info {
  flex: 1;
}

.score-level {
  font-size: 20px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.score-request {
  color: #6b7280;
  font-size: 14px;
  margin-top: 4px;
}

.thresholds {
  padding: 16px 24px;
}

.threshold-bar {
  display: flex;
  height: 24px;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.threshold-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: white;
}

.threshold-segment.low { background: #16a34a; }
.threshold-segment.medium { background: #ca8a04; }
.threshold-segment.high { background: #ea580c; }
.threshold-segment.critical { background: #dc2626; }

.score-marker {
  position: absolute;
  top: -4px;
  width: 4px;
  height: 32px;
  background: #1f2937;
  border-radius: 2px;
  transform: translateX(-50%);
}

.threshold-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #6b7280;
  margin-top: 4px;
}

.factors-section, .sla-section {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

.factors-section h4, .sla-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.factors-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.factors-table th, .factors-table td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.factors-table th {
  font-weight: 600;
  color: #6b7280;
  font-size: 11px;
  text-transform: uppercase;
}

.factor-name {
  font-weight: 500;
}

.factor-value {
  color: #6b7280;
}

.factor-contribution {
  font-weight: 600;
}

.high-contribution {
  background: #fef3c7;
}

.factors-table tfoot td {
  border-top: 2px solid #e5e7eb;
  border-bottom: none;
}

.sla-details {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.sla-stat {
  text-align: center;
}

.sla-label {
  display: block;
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.sla-value {
  font-size: 16px;
  font-weight: 600;
}

.sla-breached { color: #dc2626; }
.sla-critical { color: #ea580c; }
.sla-warning { color: #ca8a04; }
.sla-on_track { color: #16a34a; }

.sla-progress {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.sla-progress-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.sla-progress-bar.sla-breached { background: #dc2626; }
.sla-progress-bar.sla-critical { background: #ea580c; }
.sla-progress-bar.sla-warning { background: #ca8a04; }
.sla-progress-bar.sla-on_track { background: #16a34a; }
</style>
