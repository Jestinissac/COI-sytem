<template>
  <div class="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200">
    <div class="px-4 md:px-6">
      <div class="h-14 flex items-center justify-between">
        <div class="font-semibold text-gray-800">Envision PRMS</div>
        <div class="hidden md:flex items-center gap-3">
          <div class="relative">
            <input type="text" placeholder="Search…" class="pl-9 pr-3 py-2 w-64 rounded-md border-gray-200 focus:ring-2 focus:ring-primary-600 focus:border-primary-600" />
            <span class="absolute left-2 top-2.5 text-gray-400">
              <slot name="search-icon">🔍</slot>
            </span>
          </div>
          <div class="flex items-center rounded-md border border-gray-200 overflow-hidden">
            <button class="px-3 py-1.5 text-xs" :class="period==='MTD' ? 'bg-gray-100 text-gray-900' : 'text-gray-600'" @click="$emit('change:period','MTD')">MTD</button>
            <button class="px-3 py-1.5 text-xs" :class="period==='QTD' ? 'bg-gray-100 text-gray-900' : 'text-gray-600'" @click="$emit('change:period','QTD')">QTD</button>
            <button class="px-3 py-1.5 text-xs" :class="period==='YTD' ? 'bg-gray-100 text-gray-900' : 'text-gray-600'" @click="$emit('change:period','YTD')">YTD</button>
          </div>
          <button class="w-8 h-8 rounded-full bg-gray-200"></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ period?: 'MTD' | 'QTD' | 'YTD' }>()
defineEmits<{ (e: 'change:period', value: 'MTD' | 'QTD' | 'YTD'): void }>()
</script>


