<template>
  <div class="similar-cases-panel">
    <!-- Header -->
    <div class="panel-header" @click="isExpanded = !isExpanded">
      <div class="header-left">
        <svg class="icon" :class="{ 'rotate-90': isExpanded }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
        <h3>Similar Historical Cases</h3>
        <span v-if="cases.length > 0" class="badge">{{ cases.length }}</span>
      </div>
      <div class="header-stats" v-if="stats && cases.length > 0">
        <span class="stat approved">{{ stats.approvedRate }}% approved</span>
        <span class="stat avg-similarity">~{{ stats.averageSimilarity }}% match</span>
      </div>
    </div>

    <!-- Content -->
    <div v-if="isExpanded" class="panel-content">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Finding similar cases...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="loadSimilarCases" class="retry-btn">Retry</button>
      </div>

      <!-- No Cases -->
      <div v-else-if="cases.length === 0" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>No similar historical cases found</p>
        <span class="subtext">This appears to be a unique request</span>
      </div>

      <!-- Cases List -->
      <div v-else class="cases-list">
        <!-- Stats Summary -->
        <div class="stats-summary">
          <div class="stat-card">
            <span class="stat-value text-green-600">{{ stats.approvedCount }}</span>
            <span class="stat-label">Approved</span>
          </div>
          <div class="stat-card">
            <span class="stat-value text-red-600">{{ stats.rejectedCount }}</span>
            <span class="stat-label">Rejected</span>
          </div>
          <div class="stat-card">
            <span class="stat-value text-blue-600">{{ stats.averageSimilarity }}%</span>
            <span class="stat-label">Avg Match</span>
          </div>
        </div>

        <!-- Case Cards -->
        <div 
          v-for="caseItem in cases" 
          :key="caseItem.id" 
          class="case-card"
          :class="{ 'approved': caseItem.status === 'Approved', 'rejected': caseItem.status === 'Rejected' }"
        >
          <div class="case-header">
            <div class="case-title">
              <span class="client-name">{{ caseItem.clientName }}</span>
              <span class="request-id">{{ caseItem.requestId }}</span>
            </div>
            <div class="similarity-badge" :class="getSimilarityClass(caseItem.similarity.total)">
              {{ caseItem.similarity.total }}% match
            </div>
          </div>

          <div class="case-details">
            <div class="detail-row">
              <span class="label">Service:</span>
              <span class="value">{{ caseItem.serviceType }}</span>
            </div>
            <div class="detail-row">
              <span class="label">PIE:</span>
              <span class="value">{{ caseItem.pieStatus || 'No' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Decision:</span>
              <span class="value" :class="caseItem.status.toLowerCase()">
                {{ caseItem.status }}
              </span>
            </div>
          </div>

          <!-- Decision Details -->
          <div v-if="caseItem.decision" class="decision-section">
            <div v-if="caseItem.decision.reviewedBy" class="reviewer">
              Reviewed by {{ caseItem.decision.reviewedBy }}
            </div>
            <div v-if="caseItem.decision.justification" class="justification">
              <strong>Justification:</strong> {{ caseItem.decision.justification }}
            </div>
          </div>

          <!-- Similarity Breakdown (expandable) -->
          <div class="similarity-breakdown" v-if="showBreakdown === caseItem.id">
            <h4>Similarity Breakdown</h4>
            <div class="breakdown-grid">
              <div class="breakdown-item">
                <span class="breakdown-label">Client Name</span>
                <div class="progress-bar">
                  <div class="progress" :style="{ width: caseItem.similarity.breakdown.clientName + '%' }"></div>
                </div>
                <span class="breakdown-value">{{ caseItem.similarity.breakdown.clientName }}%</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">Service Type</span>
                <div class="progress-bar">
                  <div class="progress" :style="{ width: caseItem.similarity.breakdown.serviceType + '%' }"></div>
                </div>
                <span class="breakdown-value">{{ caseItem.similarity.breakdown.serviceType }}%</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">PIE Status</span>
                <div class="progress-bar">
                  <div class="progress" :style="{ width: caseItem.similarity.breakdown.pieStatus + '%' }"></div>
                </div>
                <span class="breakdown-value">{{ caseItem.similarity.breakdown.pieStatus }}%</span>
              </div>
            </div>
          </div>

          <button 
            class="toggle-breakdown" 
            @click="showBreakdown = showBreakdown === caseItem.id ? null : caseItem.id"
          >
            {{ showBreakdown === caseItem.id ? 'Hide Details' : 'Show Match Details' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import api from '@/services/api'

interface SimilarityBreakdown {
  clientName: number
  serviceType: number
  pieStatus: number
  international?: number
  ownership?: number
}

interface Decision {
  outcome: string
  justification?: string
  overrideReason?: string
  approvalLevel?: string
  reviewedBy?: string
  date?: string
}

interface SimilarCase {
  id: number
  requestId: string
  clientName: string
  serviceType: string
  pieStatus: string
  status: string
  decision: Decision
  similarity: {
    total: number
    breakdown: SimilarityBreakdown
  }
  createdAt: string
  updatedAt: string
}

interface Stats {
  totalCases: number
  approvedCount: number
  rejectedCount: number
  approvedRate: number
  rejectedRate: number
  averageSimilarity: number
  commonReasons: string[]
}

const props = defineProps<{
  requestId: number
  autoLoad?: boolean
}>()

const emit = defineEmits<{
  (e: 'loaded', cases: SimilarCase[]): void
  (e: 'caseSelected', caseItem: SimilarCase): void
}>()

const isExpanded = ref(true)
const loading = ref(false)
const error = ref<string | null>(null)
const cases = ref<SimilarCase[]>([])
const stats = ref<Stats | null>(null)
const showBreakdown = ref<number | null>(null)

async function loadSimilarCases() {
  if (!props.requestId) return
  
  loading.value = true
  error.value = null
  
  try {
    const response = await api.get(`/coi/requests/${props.requestId}/similar-cases`, {
      params: { limit: 10, minSimilarity: 50 }
    })
    
    if (response.data.success) {
      cases.value = response.data.cases || []
      stats.value = response.data.stats || null
      emit('loaded', cases.value)
    } else {
      error.value = response.data.error || 'Failed to load similar cases'
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to load similar cases'
    console.error('Error loading similar cases:', err)
  } finally {
    loading.value = false
  }
}

function getSimilarityClass(score: number): string {
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium'
  return 'low'
}

onMounted(() => {
  if (props.autoLoad !== false) {
    loadSimilarCases()
  }
})

watch(() => props.requestId, () => {
  if (props.autoLoad !== false) {
    loadSimilarCases()
  }
})

defineExpose({ loadSimilarCases })
</script>

<style scoped>
.similar-cases-panel {
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-left h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.icon {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}

.icon.rotate-90 {
  transform: rotate(90deg);
}

.badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.header-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.stat {
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.15);
}

.panel-content {
  padding: 16px;
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  text-align: center;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.subtext {
  color: #94a3b8;
  font-size: 12px;
}

.retry-btn {
  margin-top: 12px;
  padding: 6px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: #f8fafc;
  padding: 12px;
  border-radius: 6px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
}

.cases-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.case-card {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px;
  transition: all 0.2s;
}

.case-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.case-card.approved {
  border-left: 3px solid #10b981;
}

.case-card.rejected {
  border-left: 3px solid #ef4444;
}

.case-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.case-title {
  display: flex;
  flex-direction: column;
}

.client-name {
  font-weight: 600;
  color: #1e293b;
}

.request-id {
  font-size: 12px;
  color: #64748b;
}

.similarity-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.similarity-badge.high {
  background: #dcfce7;
  color: #166534;
}

.similarity-badge.medium {
  background: #fef9c3;
  color: #854d0e;
}

.similarity-badge.low {
  background: #fee2e2;
  color: #991b1b;
}

.case-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  font-size: 12px;
  margin-bottom: 8px;
}

.detail-row {
  display: flex;
  flex-direction: column;
}

.detail-row .label {
  color: #94a3b8;
  font-size: 10px;
  text-transform: uppercase;
}

.detail-row .value {
  font-weight: 500;
  color: #334155;
}

.detail-row .value.approved {
  color: #10b981;
}

.detail-row .value.rejected {
  color: #ef4444;
}

.decision-section {
  background: #f8fafc;
  padding: 8px;
  border-radius: 4px;
  margin-top: 8px;
  font-size: 12px;
}

.reviewer {
  color: #64748b;
  margin-bottom: 4px;
}

.justification {
  color: #334155;
}

.similarity-breakdown {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.similarity-breakdown h4 {
  margin: 0 0 8px;
  font-size: 12px;
  color: #64748b;
}

.breakdown-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.breakdown-item {
  display: grid;
  grid-template-columns: 100px 1fr 40px;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.breakdown-label {
  color: #64748b;
}

.progress-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
  transition: width 0.3s;
}

.breakdown-value {
  text-align: right;
  font-weight: 500;
  color: #334155;
}

.toggle-breakdown {
  width: 100%;
  margin-top: 8px;
  padding: 6px;
  background: transparent;
  border: 1px dashed #cbd5e1;
  border-radius: 4px;
  color: #64748b;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-breakdown:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #334155;
}

.text-green-600 { color: #16a34a; }
.text-red-600 { color: #dc2626; }
.text-blue-600 { color: #2563eb; }
</style>

