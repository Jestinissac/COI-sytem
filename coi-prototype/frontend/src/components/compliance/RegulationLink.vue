<template>
  <span class="regulation-link-wrapper">
    <a 
      v-if="regulation && regulation.url"
      :href="regulation.url"
      target="_blank"
      rel="noopener noreferrer"
      class="regulation-link"
      :class="severityClass"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
    >
      <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
      {{ displayCode }}
    </a>
    <span 
      v-else 
      class="regulation-text"
      :class="severityClass"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
    >
      {{ displayCode }}
    </span>

    <!-- Tooltip -->
    <Transition name="fade">
      <div v-if="showTooltip && regulation" class="regulation-tooltip">
        <div class="tooltip-header">
          <span class="tooltip-code">{{ regulation.code }}</span>
          <span class="tooltip-severity" :class="severityClass">{{ regulation.severity }}</span>
        </div>
        <div class="tooltip-title">{{ regulation.title }}</div>
        <div class="tooltip-description">{{ regulation.description }}</div>
        <div v-if="regulation.jurisdiction" class="tooltip-jurisdiction">
          <svg class="jurisdiction-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          {{ regulation.jurisdiction }}
        </div>
        <div v-if="regulation.url" class="tooltip-action">
          Click to view full regulation
        </div>
      </div>
    </Transition>
  </span>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

interface Regulation {
  code: string
  title: string
  description: string
  url?: string
  severity: string
  jurisdiction?: string
  sections?: Record<string, string>
}

const props = defineProps<{
  code: string
  inline?: boolean
}>()

const showTooltip = ref(false)
const regulation = ref<Regulation | null>(null)
const loading = ref(false)

const displayCode = computed(() => {
  return regulation.value?.code || props.code
})

const severityClass = computed(() => {
  if (!regulation.value) return ''
  switch (regulation.value.severity) {
    case 'CRITICAL': return 'severity-critical'
    case 'HIGH': return 'severity-high'
    case 'MEDIUM': return 'severity-medium'
    case 'LOW': return 'severity-low'
    default: return ''
  }
})

async function loadRegulation() {
  if (!props.code) return
  
  loading.value = true
  try {
    const response = await api.get(`/coi/regulations/${encodeURIComponent(props.code)}`)
    if (response.data.success) {
      regulation.value = response.data.regulation
    }
  } catch (err) {
    // If API fails, use the code as-is
    regulation.value = {
      code: props.code,
      title: props.code,
      description: 'External regulatory reference',
      severity: 'MEDIUM'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadRegulation()
})
</script>

<style scoped>
.regulation-link-wrapper {
  position: relative;
  display: inline-block;
}

.regulation-link, .regulation-text {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.regulation-link {
  cursor: pointer;
}

.regulation-link:hover {
  text-decoration: underline;
}

.link-icon {
  width: 12px;
  height: 12px;
}

/* Severity Colors */
.severity-critical {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.severity-critical:hover {
  background: #fee2e2;
}

.severity-high {
  background: #fff7ed;
  color: #9a3412;
  border: 1px solid #fed7aa;
}

.severity-high:hover {
  background: #ffedd5;
}

.severity-medium {
  background: #fefce8;
  color: #854d0e;
  border: 1px solid #fef08a;
}

.severity-medium:hover {
  background: #fef9c3;
}

.severity-low {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.severity-low:hover {
  background: #dcfce7;
}

/* Tooltip */
.regulation-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  padding: 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-bottom: 8px;
}

.regulation-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 8px solid transparent;
  border-top-color: white;
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.tooltip-code {
  font-weight: 700;
  color: #1e293b;
  font-size: 14px;
}

.tooltip-severity {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.tooltip-title {
  font-weight: 600;
  color: #334155;
  margin-bottom: 4px;
  font-size: 13px;
}

.tooltip-description {
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
  margin-bottom: 8px;
}

.tooltip-jurisdiction {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #94a3b8;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
}

.jurisdiction-icon {
  width: 14px;
  height: 14px;
}

.tooltip-action {
  font-size: 10px;
  color: #667eea;
  margin-top: 8px;
  text-align: center;
  font-style: italic;
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
</style>

