<template>
  <div 
    :class="[
      'priority-badge',
      `priority-${level.toLowerCase()}`,
      { 'clickable': clickable }
    ]"
    @click="handleClick"
    :title="tooltipText"
  >
    <span class="priority-score">{{ score }}</span>
    <span v-if="showLabel" class="priority-label">{{ level }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  score: {
    type: Number,
    required: true,
    validator: (val) => val >= 0 && val <= 100
  },
  level: {
    type: String,
    default: 'MEDIUM',
    validator: (val) => ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(val)
  },
  showLabel: {
    type: Boolean,
    default: false
  },
  topFactors: {
    type: Array,
    default: () => []
  },
  clickable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['click'])

const tooltipText = computed(() => {
  let text = `Priority: ${props.level} (${props.score}/100)`
  if (props.topFactors.length > 0) {
    text += '\n' + props.topFactors.join('\n')
  }
  return text
})

const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<style scoped>
.priority-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: default;
  transition: all 0.2s ease;
}

.priority-badge.clickable {
  cursor: pointer;
}

.priority-badge.clickable:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

/* Critical - Red */
.priority-critical {
  background-color: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.priority-critical:hover {
  background-color: #fecaca;
}

/* High - Orange */
.priority-high {
  background-color: #ffedd5;
  color: #ea580c;
  border: 1px solid #fed7aa;
}

.priority-high:hover {
  background-color: #fed7aa;
}

/* Medium - Yellow */
.priority-medium {
  background-color: #fef9c3;
  color: #ca8a04;
  border: 1px solid #fef08a;
}

.priority-medium:hover {
  background-color: #fef08a;
}

/* Low - Green */
.priority-low {
  background-color: #dcfce7;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.priority-low:hover {
  background-color: #bbf7d0;
}

.priority-score {
  font-weight: 700;
}

.priority-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Pulse animation for critical items */
.priority-critical {
  animation: pulse-critical 2s infinite;
}

@keyframes pulse-critical {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(220, 38, 38, 0);
  }
}
</style>
