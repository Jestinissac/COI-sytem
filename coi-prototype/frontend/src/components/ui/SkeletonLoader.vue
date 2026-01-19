<template>
  <div 
    class="space-y-4" 
    :class="containerClass"
    role="status"
    aria-busy="true"
    :aria-label="ariaLabel"
  >
    <span class="sr-only">{{ ariaLabel }}</span>
    
    <!-- Text lines variant -->
    <template v-if="variant === 'text'">
      <div v-for="i in lines" :key="i" class="animate-pulse">
        <div 
          class="skeleton rounded" 
          :class="lineClass"
          :style="{ width: i === lines && lastLineWidth ? lastLineWidth : '100%' }"
        ></div>
      </div>
    </template>
    
    <!-- Card variant -->
    <template v-else-if="variant === 'card'">
      <div class="animate-pulse bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center gap-4 mb-4">
          <div class="skeleton w-12 h-12 rounded-full"></div>
          <div class="flex-1 space-y-2">
            <div class="skeleton h-4 rounded w-3/4"></div>
            <div class="skeleton h-3 rounded w-1/2"></div>
          </div>
        </div>
        <div class="space-y-3">
          <div class="skeleton h-3 rounded"></div>
          <div class="skeleton h-3 rounded w-5/6"></div>
        </div>
      </div>
    </template>
    
    <!-- Table variant -->
    <template v-else-if="variant === 'table'">
      <div class="animate-pulse">
        <!-- Header -->
        <div class="flex gap-4 pb-3 border-b border-gray-200 mb-3">
          <div v-for="col in columns" :key="col" class="skeleton h-4 rounded" :style="{ width: `${100/columns}%` }"></div>
        </div>
        <!-- Rows -->
        <div v-for="row in rows" :key="row" class="flex gap-4 py-3 border-b border-gray-100">
          <div v-for="col in columns" :key="col" class="skeleton h-4 rounded" :style="{ width: `${100/columns}%` }"></div>
        </div>
      </div>
    </template>
    
    <!-- Form variant -->
    <template v-else-if="variant === 'form'">
      <div class="animate-pulse space-y-6">
        <div v-for="i in fields" :key="i" class="space-y-2">
          <div class="skeleton h-4 rounded w-1/4"></div>
          <div class="skeleton h-10 rounded"></div>
        </div>
      </div>
    </template>
    
    <!-- Stats variant -->
    <template v-else-if="variant === 'stats'">
      <div class="grid grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="animate-pulse bg-white rounded-lg border border-gray-200 p-4">
          <div class="skeleton h-4 rounded w-1/2 mb-2"></div>
          <div class="skeleton h-8 rounded w-3/4"></div>
        </div>
      </div>
    </template>
    
    <!-- Chart variant -->
    <template v-else-if="variant === 'chart'">
      <div class="animate-pulse bg-white rounded-lg border border-gray-200 p-6">
        <div class="skeleton h-5 rounded w-1/4 mb-4"></div>
        <div class="flex items-end gap-2 h-48">
          <div v-for="i in 7" :key="i" class="skeleton rounded-t flex-1" :style="{ height: `${20 + Math.random() * 80}%` }"></div>
        </div>
      </div>
    </template>
    
    <!-- Default text variant -->
    <template v-else>
      <div v-for="i in lines" :key="i" class="animate-pulse">
        <div 
          class="skeleton rounded" 
          :class="lineClass"
          :style="{ width: i === lines && lastLineWidth ? lastLineWidth : '100%' }"
        ></div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'text' | 'card' | 'table' | 'form' | 'stats' | 'chart'
  lines?: number
  height?: 'sm' | 'md' | 'lg'
  lastLineWidth?: string
  containerClass?: string
  ariaLabel?: string
  // Table variant props
  rows?: number
  columns?: number
  // Form variant props
  fields?: number
}>(), {
  variant: 'text',
  lines: 3,
  height: 'md',
  lastLineWidth: '75%',
  containerClass: '',
  ariaLabel: 'Loading content...',
  rows: 5,
  columns: 4,
  fields: 3
})

const lineClass = computed(() => {
  switch (props.height) {
    case 'sm':
      return 'h-3'
    case 'lg':
      return 'h-6'
    default:
      return 'h-4'
  }
})
</script>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #e0e0e0 20%,
    #f0f0f0 40%,
    #f0f0f0 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
