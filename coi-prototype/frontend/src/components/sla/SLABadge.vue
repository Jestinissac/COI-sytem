<template>
  <div 
    :class="[
      'sla-badge',
      `sla-${status.toLowerCase()}`,
      { 'sla-breached-pulse': status === 'BREACHED' }
    ]"
    :title="tooltipText"
  >
    <span v-if="status === 'BREACHED'" class="sla-icon">!</span>
    <span v-else-if="status === 'CRITICAL'" class="sla-icon">!!</span>
    <span class="sla-text">{{ displayText }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (val) => ['BREACHED', 'CRITICAL', 'WARNING', 'ON_TRACK'].includes(val)
  },
  hoursRemaining: {
    type: Number,
    default: 0
  },
  targetHours: {
    type: Number,
    default: 48
  },
  percentUsed: {
    type: Number,
    default: 0
  }
})

const displayText = computed(() => {
  if (props.status === 'BREACHED') {
    const overdue = Math.abs(props.hoursRemaining)
    if (overdue < 1) {
      return `${Math.round(overdue * 60)}m overdue`
    }
    return `${Math.round(overdue)}h overdue`
  }
  
  if (props.hoursRemaining <= 0) {
    return 'Due now'
  }
  
  if (props.hoursRemaining < 1) {
    return `${Math.round(props.hoursRemaining * 60)}m left`
  }
  
  if (props.hoursRemaining < 24) {
    return `${Math.round(props.hoursRemaining)}h left`
  }
  
  const days = Math.floor(props.hoursRemaining / 24)
  const hours = Math.round(props.hoursRemaining % 24)
  if (hours > 0) {
    return `${days}d ${hours}h left`
  }
  return `${days}d left`
})

const tooltipText = computed(() => {
  let text = `SLA Status: ${props.status}\n`
  text += `Target: ${props.targetHours}h\n`
  text += `Progress: ${props.percentUsed}%`
  
  if (props.status === 'BREACHED') {
    text += `\nOverdue by ${Math.round(Math.abs(props.hoursRemaining))}h`
  } else if (props.hoursRemaining > 0) {
    text += `\n${Math.round(props.hoursRemaining)}h remaining`
  }
  
  return text
})
</script>

<style scoped>
.sla-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

/* Breached - Red, pulsing */
.sla-breached {
  background-color: #dc2626;
  color: white;
}

.sla-breached-pulse {
  animation: pulse-sla 1.5s infinite;
}

@keyframes pulse-sla {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Critical - Orange */
.sla-critical {
  background-color: #ea580c;
  color: white;
}

/* Warning - Yellow */
.sla-warning {
  background-color: #fef08a;
  color: #854d0e;
}

/* On Track - Green/Gray */
.sla-on_track {
  background-color: #e5e7eb;
  color: #4b5563;
}

.sla-icon {
  font-weight: 700;
}

.sla-text {
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
}
</style>
