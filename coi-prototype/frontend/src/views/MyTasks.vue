<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Professional Header with Breadcrumb -->
    <div class="bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-7xl mx-auto px-6 py-5">
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          <span>COI System</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
          <span class="text-gray-900 font-medium">My Tasks</span>
        </div>
        
        <!-- Header Content -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900 tracking-tight">My Tasks</h1>
            <p class="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <span class="inline-flex items-center gap-1">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                Role: <span class="font-medium text-gray-900">{{ user?.role }}</span>
              </span>
              <span class="text-gray-400">|</span>
              <span>{{ totalItems }} items need attention</span>
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button
              @click="refreshData"
              :disabled="loading"
              class="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm disabled:opacity-50"
            >
              <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-6">
      <!-- Tab Navigation -->
      <div class="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px" role="tablist">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :aria-selected="activeTab === tab.id"
              role="tab"
              class="relative px-6 py-4 text-sm font-medium transition-colors focus:outline-none"
              :class="activeTab === tab.id 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'"
            >
              <span class="flex items-center gap-2">
                <component :is="tab.icon" class="w-4 h-4" />
                {{ tab.label }}
                <span 
                  v-if="tab.count > 0"
                  class="ml-1 px-2 py-0.5 text-xs font-medium rounded-full"
                  :class="tab.count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'"
                >
                  {{ tab.count }}
                </span>
              </span>
            </button>
          </nav>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="i in 4" :key="i" class="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
            <div class="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div class="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div class="space-y-3">
            <div class="h-16 bg-gray-200 rounded"></div>
            <div class="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div v-else>
        <!-- Today Tab -->
        <div v-if="activeTab === 'day'">
          <!-- Stats Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div 
              @click="filterType = filterType === 'action' ? null : 'action'"
              class="bg-white rounded-lg border p-5 cursor-pointer transition-all hover:shadow-md"
              :class="filterType === 'action' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Action Required</p>
                  <p class="text-3xl font-semibold text-gray-900">{{ dayData.summary.totalActions }}</p>
                </div>
                <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                  </svg>
                </div>
              </div>
            </div>
            <div 
              @click="filterType = filterType === 'overdue' ? null : 'overdue'"
              class="bg-white rounded-lg border p-5 cursor-pointer transition-all hover:shadow-md"
              :class="filterType === 'overdue' ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 hover:border-gray-300'"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Overdue</p>
                  <p class="text-3xl font-semibold" :class="dayData.summary.urgentCount > 0 ? 'text-red-600' : 'text-gray-900'">{{ dayData.summary.urgentCount }}</p>
                </div>
                <div class="w-10 h-10 rounded-full flex items-center justify-center" :class="dayData.summary.urgentCount > 0 ? 'bg-red-50' : 'bg-gray-50'">
                  <svg class="w-5 h-5" :class="dayData.summary.urgentCount > 0 ? 'text-red-600' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
            </div>
            <div 
              @click="filterType = filterType === 'expiring' ? null : 'expiring'"
              class="bg-white rounded-lg border p-5 cursor-pointer transition-all hover:shadow-md"
              :class="filterType === 'expiring' ? 'border-amber-500 ring-1 ring-amber-500' : 'border-gray-200 hover:border-gray-300'"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Expiring Today</p>
                  <p class="text-3xl font-semibold" :class="dayData.summary.expiringCount > 0 ? 'text-amber-600' : 'text-gray-900'">{{ dayData.summary.expiringCount }}</p>
                </div>
                <div class="w-10 h-10 rounded-full flex items-center justify-center" :class="dayData.summary.expiringCount > 0 ? 'bg-amber-50' : 'bg-gray-50'">
                  <svg class="w-5 h-5" :class="dayData.summary.expiringCount > 0 ? 'text-amber-600' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-lg border border-gray-200 p-5">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Today</p>
                  <p class="text-3xl font-semibold text-gray-900">{{ dayData.today.actionRequired.length + dayData.today.overdue.length + dayData.today.expiring.length }}</p>
                </div>
                <div class="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Task List -->
          <TaskList 
            :items="filteredDayItems" 
            :empty-title="'All caught up!'"
            :empty-message="'You have no actionable items for today.'"
            @navigate="navigateToRequest"
          />
        </div>

        <!-- Week Tab -->
        <div v-if="activeTab === 'week'">
          <!-- Stats Card -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-lg border border-gray-200 p-5">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Items This Week</p>
                  <p class="text-3xl font-semibold text-gray-900">{{ weekData.summary.weekTotal }}</p>
                </div>
                <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-lg border border-gray-200 p-5">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Due This Week</p>
                  <p class="text-3xl font-semibold text-gray-900">{{ weekData.thisWeek.dueThisWeek.length }}</p>
                </div>
                <div class="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-lg border border-gray-200 p-5">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Expiring This Week</p>
                  <p class="text-3xl font-semibold" :class="weekData.thisWeek.expiringThisWeek.length > 0 ? 'text-amber-600' : 'text-gray-900'">{{ weekData.thisWeek.expiringThisWeek.length }}</p>
                </div>
                <div class="w-10 h-10 rounded-full flex items-center justify-center" :class="weekData.thisWeek.expiringThisWeek.length > 0 ? 'bg-amber-50' : 'bg-gray-50'">
                  <svg class="w-5 h-5" :class="weekData.thisWeek.expiringThisWeek.length > 0 ? 'text-amber-600' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-lg border border-gray-200 p-5">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Days with Tasks</p>
                  <p class="text-3xl font-semibold text-gray-900">{{ Object.keys(weekData.thisWeek.groupedByDay).length }}</p>
                </div>
                <div class="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Grouped Task List -->
          <GroupedTaskList 
            :grouped-items="weekData.thisWeek.groupedByDay"
            :empty-title="'Clear week ahead!'"
            :empty-message="'You have no items due this week.'"
            @navigate="navigateToRequest"
          />
        </div>

        <!-- Month Tab -->
        <div v-if="activeTab === 'month'">
          <!-- Stats Card -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-lg border border-gray-200 p-5">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Items This Month</p>
                  <p class="text-3xl font-semibold text-gray-900">{{ monthData.summary.monthTotal }}</p>
                </div>
                <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-lg border border-gray-200 p-5">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Upcoming</p>
                  <p class="text-3xl font-semibold text-gray-900">{{ monthData.thisMonth.upcomingThisMonth.length }}</p>
                </div>
                <div class="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-lg border border-gray-200 p-5">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Expiring This Month</p>
                  <p class="text-3xl font-semibold" :class="monthData.thisMonth.expiringThisMonth.length > 0 ? 'text-amber-600' : 'text-gray-900'">{{ monthData.thisMonth.expiringThisMonth.length }}</p>
                </div>
                <div class="w-10 h-10 rounded-full flex items-center justify-center" :class="monthData.thisMonth.expiringThisMonth.length > 0 ? 'bg-amber-50' : 'bg-gray-50'">
                  <svg class="w-5 h-5" :class="monthData.thisMonth.expiringThisMonth.length > 0 ? 'text-amber-600' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-lg border border-gray-200 p-5">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Days with Tasks</p>
                  <p class="text-3xl font-semibold text-gray-900">{{ Object.keys(monthData.thisMonth.groupedByDate).length }}</p>
                </div>
                <div class="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Grouped Task List -->
          <GroupedTaskList 
            :grouped-items="monthData.thisMonth.groupedByDate"
            :empty-title="'Clear month ahead!'"
            :empty-message="'You have no items due this month.'"
            @navigate="navigateToRequest"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { 
  getMyDay, getMyWeek, getMyMonth,
  type MyDayData, type MyWeekData, type MyMonthData 
} from '@/services/myDayWeekService'
import { useToast } from '@/composables/useToast'
import TaskList from '@/components/tasks/TaskList.vue'
import GroupedTaskList from '@/components/tasks/GroupedTaskList.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { error: showError } = useToast()

const user = computed(() => authStore.user)
const loading = ref(true)
const activeTab = ref<'day' | 'week' | 'month'>('day')
const filterType = ref<'action' | 'overdue' | 'expiring' | null>(null)

// Data
const dayData = ref<MyDayData>({
  today: { actionRequired: [], expiring: [], overdue: [] },
  summary: { totalActions: 0, urgentCount: 0, expiringCount: 0 }
})

const weekData = ref<MyWeekData>({
  thisWeek: { dueThisWeek: [], expiringThisWeek: [], groupedByDay: {} },
  summary: { weekTotal: 0 }
})

const monthData = ref<MyMonthData>({
  thisMonth: { upcomingThisMonth: [], expiringThisMonth: [], groupedByDate: {} },
  summary: { monthTotal: 0 }
})

// Tab icons as render functions
const ClockIcon = () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' })
])

const CalendarWeekIcon = () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' })
])

const CalendarMonthIcon = () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' })
])

const tabs = computed(() => [
  { 
    id: 'day' as const, 
    label: 'Today', 
    icon: ClockIcon,
    count: dayData.value.summary.totalActions + dayData.value.summary.expiringCount
  },
  { 
    id: 'week' as const, 
    label: 'This Week', 
    icon: CalendarWeekIcon,
    count: weekData.value.summary.weekTotal
  },
  { 
    id: 'month' as const, 
    label: 'This Month', 
    icon: CalendarMonthIcon,
    count: monthData.value.summary.monthTotal
  }
])

const totalItems = computed(() => {
  return dayData.value.summary.totalActions + dayData.value.summary.expiringCount
})

const filteredDayItems = computed(() => {
  const allItems = [
    ...dayData.value.today.actionRequired.map(item => ({ ...item, category: 'action' as const })),
    ...dayData.value.today.overdue.map(item => ({ ...item, category: 'overdue' as const })),
    ...dayData.value.today.expiring.map(item => ({ ...item, category: 'expiring' as const }))
  ]
  
  if (!filterType.value) return allItems
  return allItems.filter(item => item.category === filterType.value)
})

// Initialize tab from query param
onMounted(() => {
  const tab = route.query.tab as string
  if (tab && ['day', 'week', 'month'].includes(tab)) {
    activeTab.value = tab as 'day' | 'week' | 'month'
  }
  loadAllData()
})

// Update URL when tab changes
watch(activeTab, (newTab) => {
  router.replace({ query: { ...route.query, tab: newTab } })
})

async function loadAllData() {
  try {
    loading.value = true
    const [day, week, month] = await Promise.all([
      getMyDay(),
      getMyWeek(),
      getMyMonth()
    ])
    dayData.value = day
    weekData.value = week
    monthData.value = month
  } catch (err: any) {
    showError('Failed to load tasks: ' + (err.message || 'Unknown error'))
  } finally {
    loading.value = false
  }
}

async function refreshData() {
  await loadAllData()
}

function navigateToRequest(requestId: number) {
  router.push(`/coi/request/${requestId}`)
}
</script>
