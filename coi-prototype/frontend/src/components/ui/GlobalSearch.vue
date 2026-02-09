<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black bg-opacity-50" @click="close"></div>

        <!-- Search Modal -->
        <div class="flex min-h-full items-start justify-center p-8 pt-20">
          <div
            class="relative bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-2xl"
            @click.stop
          >
            <!-- Search Input -->
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="relative">
                <svg
                  class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  ref="searchInput"
                  v-model="query"
                  type="text"
                  placeholder="Search requests, clients, users..."
                  class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  @keydown.escape="close"
                  @keydown.enter="handleSearch"
                />
              </div>
            </div>

            <!-- Results -->
            <div class="max-h-96 overflow-y-auto">
              <!-- Empty State with Suggestions -->
              <div v-if="query.length < 2" class="px-6 py-6">
                <!-- Recent Items -->
                <div v-if="recentItems.length > 0" class="mb-6">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide">Recent Items</h3>
                  </div>
                  <div class="space-y-1">
                    <button
                      v-for="(item, index) in recentItems"
                      :key="index"
                      @click="handleRecentItemClick(item)"
                      class="w-full px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between group"
                    >
                      <div class="flex items-center gap-3 flex-1 min-w-0">
                        <component 
                          :is="item.type === 'request' ? RequestIcon : item.type === 'client' ? ClientIcon : NavigationIcon" 
                          class="w-4 h-4 text-gray-400 flex-shrink-0" 
                        />
                        <div class="flex-1 min-w-0">
                          <div class="text-sm font-medium text-gray-900 truncate">{{ item.title }}</div>
                          <div class="text-xs text-gray-500">{{ formatTimeAgo(item.timestamp) }}</div>
                        </div>
                      </div>
                      <svg class="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Recent Searches -->
                <div v-if="recentSearches.length > 0" class="mb-6">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide">Recent Searches</h3>
                    <button
                      @click="clearSearchHistory"
                      class="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                  <div class="space-y-1">
                    <button
                      v-for="(search, index) in recentSearches"
                      :key="index"
                      @click="handleHistoryClick(search.query)"
                      class="w-full px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between group"
                    >
                      <div class="flex items-center gap-3 flex-1 min-w-0">
                        <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        <div class="flex-1 min-w-0">
                          <div class="text-sm font-medium text-gray-900 truncate">{{ search.query }}</div>
                          <div class="text-xs text-gray-500">{{ formatTimeAgo(search.timestamp) }}</div>
                        </div>
                      </div>
                      <svg class="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Quick Actions -->
                <div>
                  <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h3>
                  <div class="space-y-1">
                    <button
                      v-for="(item, index) in getNavigationItemsForRole(userRole).slice(0, 5)"
                      :key="index"
                      @click="handleSelect({ title: item.title, description: `Navigate to ${item.title}`, route: item.route, icon: NavigationIcon, type: 'navigation' })"
                      class="w-full px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between group"
                    >
                      <div class="flex items-center gap-3">
                        <component :is="NavigationIcon" class="w-4 h-4 text-gray-400" />
                        <span class="text-sm font-medium text-gray-900">{{ item.title }}</span>
                      </div>
                      <svg class="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Suggestions (for 1 character queries) -->
              <div v-else-if="query.length === 1 && !isSearching && suggestions.length > 0" class="divide-y divide-gray-200">
                <div class="px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Suggestions</p>
                </div>
                <button
                  v-for="(suggestion, index) in suggestions"
                  :key="index"
                  @click="handleSelect(suggestion, suggestion.originalData)"
                  class="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                  :class="{ 'bg-gray-50': selectedIndex === index }"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <component :is="suggestion.icon" class="w-4 h-4 text-gray-400" />
                        <span class="text-sm font-medium text-gray-900">{{ suggestion.title }}</span>
                        <span v-if="suggestion.badge" class="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          {{ suggestion.badge }}
                        </span>
                      </div>
                      <p class="text-xs text-gray-500">{{ suggestion.description }}</p>
                    </div>
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </button>
              </div>

              <div v-else-if="isSearching" class="px-6 py-8 text-center">
                <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                <p class="text-sm text-gray-500 mt-2">Searching...</p>
              </div>

              <div v-else-if="query.length === 1 && suggestions.length === 0 && !isSearching" class="px-6 py-8 text-center">
                <p class="text-sm text-gray-500">Type more characters to search...</p>
              </div>

              <div v-else-if="results.length === 0 && query.length >= 2" class="px-6 py-8 text-center">
                <p class="text-sm text-gray-500">No results found for "{{ query }}"</p>
              </div>

              <div v-else class="divide-y divide-gray-200">
                <button
                  v-for="(result, index) in results"
                  :key="index"
                  @click="handleSelect(result, (result as any).originalData)"
                  class="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                  :class="{ 'bg-gray-50': selectedIndex === index }"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <component :is="result.icon" class="w-4 h-4 text-gray-400" />
                        <span class="text-sm font-medium text-gray-900">
                          <span v-for="(segment, i) in highlightText(result.title, query)" :key="i">
                            <mark v-if="segment.highlight" class="bg-yellow-100">{{ segment.text }}</mark>
                            <span v-else>{{ segment.text }}</span>
                          </span>
                        </span>
                        <span v-if="result.badge" class="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          {{ result.badge }}
                        </span>
                      </div>
                      <p class="text-xs text-gray-500">
                        <span v-for="(segment, i) in highlightText(result.description, query)" :key="i">
                          <mark v-if="segment.highlight" class="bg-yellow-100">{{ segment.text }}</mark>
                          <span v-else>{{ segment.text }}</span>
                        </span>
                      </p>
                    </div>
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </button>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div class="flex items-center gap-4 text-xs text-gray-500">
                <span class="flex items-center gap-1">
                  <kbd class="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">↑</kbd>
                  <kbd class="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">↓</kbd>
                  Navigate
                </span>
                <span class="flex items-center gap-1">
                  <kbd class="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">Enter</kbd>
                  Select
                </span>
                <span class="flex items-center gap-1">
                  <kbd class="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">Esc</kbd>
                  Close
                </span>
              </div>
              <span class="text-xs text-gray-500">
                <span v-if="query.length === 1 && suggestions.length > 0">
                  {{ suggestions.length }} suggestion{{ suggestions.length !== 1 ? 's' : '' }}
                </span>
                <span v-else>
                  {{ results.length }} result{{ results.length !== 1 ? 's' : '' }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCOIRequestsStore } from '@/stores/coiRequests'
import { useClientsStore } from '@/stores/clients'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import { h } from 'vue'

interface Props {
  isOpen: boolean
  userRole?: string
  userId?: number
  userDepartment?: string
}

interface SearchResult {
  title: string
  description: string
  route?: string
  action?: () => void
  icon?: any
  badge?: string
  type?: 'request' | 'client' | 'navigation' | 'user'
  originalData?: any // Store original data for recent items tracking
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const router = useRouter()
const coiStore = useCOIRequestsStore()
const clientsStore = useClientsStore()
const authStore = useAuthStore()

// Get user info from props or auth store
const userRole = computed(() => props.userRole || authStore.user?.role || 'Requester')
const userId = computed(() => props.userId || authStore.user?.id)
const userDepartment = computed(() => props.userDepartment || authStore.user?.department)

const query = ref('')
const results = ref<SearchResult[]>([])
const isSearching = ref(false)
const selectedIndex = ref(0)
const searchInput = ref<HTMLInputElement | null>(null)
const allRequests = ref<any[]>([])
const allClients = ref<any[]>([])
const allUsers = ref<any[]>([])

// Search history and recent items
const recentSearches = ref<Array<{query: string, timestamp: number}>>([])
const recentItems = ref<Array<{type: string, id: number, title: string, route?: string, timestamp: number}>>([])
const suggestions = ref<SearchResult[]>([])

// Icon components
const RequestIcon = {
  render: () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
  ])
}

const ClientIcon = {
  render: () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' })
  ])
}

const NavigationIcon = {
  render: () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' })
  ])
}

const UserIcon = {
  render: () => h('svg', { class: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' })
  ])
}

// localStorage functions for search history
const SEARCH_HISTORY_KEY = 'coi_search_history'
const RECENT_ITEMS_KEY = 'coi_recent_items'
const MAX_SEARCH_HISTORY = 10
const MAX_RECENT_ITEMS = 5

function saveSearchHistory(query: string) {
  try {
    const history = loadSearchHistory()
    // Remove duplicate if exists
    const filtered = history.filter(h => h.query.toLowerCase() !== query.toLowerCase())
    // Add new search at the beginning
    const updated = [{ query, timestamp: Date.now() }, ...filtered].slice(0, MAX_SEARCH_HISTORY)
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated))
    recentSearches.value = updated
  } catch (error) {
    console.error('Error saving search history:', error)
  }
}

function loadSearchHistory(): Array<{query: string, timestamp: number}> {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (stored) {
      const history = JSON.parse(stored)
      recentSearches.value = history
      return history
    }
  } catch (error) {
    console.error('Error loading search history:', error)
  }
  return []
}

function clearSearchHistory() {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY)
    recentSearches.value = []
  } catch (error) {
    console.error('Error clearing search history:', error)
  }
}

function saveRecentItem(item: {type: string, id: number, title: string, route?: string}) {
  try {
    const items = loadRecentItems()
    // Remove duplicate if exists
    const filtered = items.filter(i => !(i.type === item.type && i.id === item.id))
    // Add new item at the beginning
    const updated = [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT_ITEMS)
    localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated))
    recentItems.value = updated
  } catch (error) {
    console.error('Error saving recent item:', error)
  }
}

function loadRecentItems(): Array<{type: string, id: number, title: string, route?: string, timestamp: number}> {
  try {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY)
    if (stored) {
      const items = JSON.parse(stored)
      // Filter items older than 30 days
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
      const filtered = items.filter((item: any) => item.timestamp > thirtyDaysAgo)
      recentItems.value = filtered
      return filtered
    }
  } catch (error) {
    console.error('Error loading recent items:', error)
  }
  return []
}

// Highlight text segments (safe, no v-html)
function highlightText(text: string, query: string): Array<{text: string, highlight: boolean}> {
  if (!query || !text) return [{ text, highlight: false }]
  // Escape regex special characters
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  const parts = text.split(regex)
  return parts.filter(p => p).map((part) => ({
    text: part,
    highlight: part.toLowerCase() === query.toLowerCase()
  }))
}

// Format timestamp to relative time
function formatTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`
  return new Date(timestamp).toLocaleDateString()
}

// Filter requests based on user role
function filterRequestsByRole(requests: any[]): any[] {
  const role = userRole.value
  const uid = userId.value
  const dept = userDepartment.value
  
  if (!role || !uid) return requests
  
  switch (role) {
    case 'Requester':
      // Only their own requests
      return requests.filter(r => r.requester_id === uid)
    
    case 'Director':
      // Department requests + team members (backend handles this, but filter here too)
      return requests.filter(r => r.department === dept)
    
    case 'Compliance':
      // All requests (backend filters)
      return requests
    
    case 'Partner':
      // All requests
      return requests
    
    case 'Finance':
      // All requests
      return requests
    
    case 'Admin':
    case 'Super Admin':
      // All requests
      return requests
    
    default:
      return requests
  }
}

// Load data when modal opens
async function loadSearchData() {
  try {
    // Load requests with role-based filtering
    if (coiStore.requests.length === 0) {
      await coiStore.fetchRequests()
    }
    // Apply role-based filtering
    allRequests.value = filterRequestsByRole(coiStore.requests || [])
    
    // Load clients (all roles can see clients)
    if (clientsStore.clients.length === 0) {
      await clientsStore.fetchClients()
    }
    allClients.value = clientsStore.clients || []
    
    // Load users (only for Admin/Super Admin)
    if (userRole.value === 'Admin' || userRole.value === 'Super Admin') {
      try {
        const usersResponse = await api.get('/users/approvers')
        allUsers.value = usersResponse.data || []
      } catch (err) {
        console.log('Could not load users for search:', err)
        allUsers.value = []
      }
    } else {
      allUsers.value = []
    }
  } catch (error) {
    console.error('Error loading search data:', error)
  }
}

// Calculate relevance score for a search result
function calculateRelevanceScore(result: SearchResult, query: string, originalData?: any): number {
  const lowerQuery = query.toLowerCase().trim()
  const lowerTitle = result.title.toLowerCase()
  const lowerDescription = result.description.toLowerCase()
  let score = 0
  
  // Exact match in title: +10 points
  if (lowerTitle === lowerQuery) {
    score += 10
  }
  // Title starts with query: +3 points
  else if (lowerTitle.startsWith(lowerQuery)) {
    score += 3
  }
  // Title contains query: +1 point
  else if (lowerTitle.includes(lowerQuery)) {
    score += 1
  }
  
  // Exact match in description: +5 points
  if (lowerDescription === lowerQuery) {
    score += 5
  }
  // Description contains query: +1 point
  else if (lowerDescription.includes(lowerQuery)) {
    score += 1
  }
  
  // Recent item bonus (accessed in last 7 days): +2 points
  if (result.type && result.type !== 'navigation') {
    const recentItem = recentItems.value.find(item => 
      item.type === result.type && 
      item.title === result.title
    )
    if (recentItem) {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      if (recentItem.timestamp > sevenDaysAgo) {
        score += 2
      }
    }
  }
  
  // Status priority (for requests): +1 to +3 points
  if (result.type === 'request' && result.badge && originalData) {
    const status = result.badge.toLowerCase()
    if (status.includes('pending')) {
      score += 3
    } else if (status.includes('approved') || status.includes('active')) {
      score += 2
    } else if (status.includes('completed') || status.includes('closed')) {
      score += 1
    }
  }
  
  return score
}

// Real search function
async function performSearch(searchQuery: string): Promise<SearchResult[]> {
  const lowerQuery = searchQuery.toLowerCase().trim()
  if (lowerQuery.length < 2) return []
  
  const searchResults: Array<SearchResult & { score?: number, originalData?: any }> = []
  
  // Search COI Requests (with fuzzy matching fallback)
  allRequests.value.forEach((request: any) => {
    const requestId = (request.request_id || '').toLowerCase()
    const clientName = (request.client_name || '').toLowerCase()
    const serviceType = (request.service_type || '').toLowerCase()
    
    // Exact match
    const exactMatch = requestId.includes(lowerQuery) || 
                      clientName.includes(lowerQuery) || 
                      serviceType.includes(lowerQuery)
    
    // Fuzzy match (if no exact match and query length >= 3)
    let fuzzyMatch = false
    if (!exactMatch && lowerQuery.length >= 3) {
      const requestIdSimilarity = calculateSimilarity(requestId, lowerQuery)
      const clientNameSimilarity = calculateSimilarity(clientName, lowerQuery)
      fuzzyMatch = requestIdSimilarity >= 70 || clientNameSimilarity >= 70
    }
    
    if (exactMatch || fuzzyMatch) {
      const result: SearchResult & { score?: number, originalData?: any } = {
        title: request.request_id || `Request #${request.id}`,
        description: `${request.client_name || 'Unknown Client'} - ${request.service_type || 'N/A'}`,
        route: `/coi/request/${request.id}`,
        icon: RequestIcon,
        badge: request.status,
        type: 'request',
        originalData: request
      }
      result.score = calculateRelevanceScore(result, searchQuery, request)
      searchResults.push(result)
    }
  })
  
  // Search Clients (with fuzzy matching fallback)
  allClients.value.forEach((client: any) => {
    const clientName = (client.client_name || client.name || '').toLowerCase()
    const clientCode = (client.client_code || client.code || '').toLowerCase()
    
    // Exact match
    const exactMatch = clientName.includes(lowerQuery) || clientCode.includes(lowerQuery)
    
    // Fuzzy match (if no exact match and query length >= 3)
    let fuzzyMatch = false
    if (!exactMatch && lowerQuery.length >= 3) {
      const clientNameSimilarity = calculateSimilarity(clientName, lowerQuery)
      const clientCodeSimilarity = calculateSimilarity(clientCode, lowerQuery)
      fuzzyMatch = clientNameSimilarity >= 70 || clientCodeSimilarity >= 70
    }
    
    if (exactMatch || fuzzyMatch) {
      const result: SearchResult & { score?: number, originalData?: any } = {
        title: client.client_name || client.name || 'Unknown Client',
        description: `Client Code: ${client.client_code || client.code || 'N/A'}`,
        route: undefined, // Client detail route doesn't exist - use action instead
        action: () => {
          // Navigate to reports page with client filter
          router.push({ path: '/coi/reports', query: { clientId: client.id } })
        },
        icon: ClientIcon,
        type: 'client',
        originalData: client
      }
      result.score = calculateRelevanceScore(result, searchQuery, client)
      searchResults.push(result)
    }
  })
  
  // Search Users
  allUsers.value.forEach((user: any) => {
    const userName = (user.name || '').toLowerCase()
    const userEmail = (user.email || '').toLowerCase()
    
    if (userName.includes(lowerQuery) || userEmail.includes(lowerQuery)) {
      const result: SearchResult & { score?: number, originalData?: any } = {
        title: user.name || 'Unknown User',
        description: `${user.email || ''} - ${user.role || ''}`,
        icon: UserIcon,
        badge: user.role,
        type: 'user',
        originalData: user
      }
      result.score = calculateRelevanceScore(result, searchQuery, user)
      searchResults.push(result)
    }
  })
  
  // Search Navigation Items (role-based)
  const navigationItems = getNavigationItemsForRole(userRole.value)
  
  navigationItems.forEach(item => {
    if (item.keywords.some((keyword: string) => lowerQuery.includes(keyword)) || 
        item.title.toLowerCase().includes(lowerQuery)) {
      const result: SearchResult & { score?: number, originalData?: any } = {
        title: item.title,
        description: `Navigate to ${item.title}`,
        route: item.route,
        icon: NavigationIcon,
        type: 'navigation'
      }
      result.score = calculateRelevanceScore(result, searchQuery)
      searchResults.push(result)
    }
  })
  
  // Sort by relevance score (descending), then limit to top 20
  // Keep originalData for handleSelect to use
  return searchResults
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 20)
    .map(({ score, ...result }) => result) // Remove score but keep originalData
}

// Generate autocomplete suggestions
function generateSuggestions(query: string): SearchResult[] {
  const lowerQuery = query.toLowerCase().trim()
  if (lowerQuery.length < 1) return []
  
  const suggestionsList: SearchResult[] = []
  
  // Get top 3 matching requests
  const matchingRequests = allRequests.value
    .filter((request: any) => {
      const requestId = (request.request_id || '').toLowerCase()
      const clientName = (request.client_name || '').toLowerCase()
      return requestId.includes(lowerQuery) || clientName.includes(lowerQuery)
    })
    .slice(0, 3)
  
  matchingRequests.forEach((request: any) => {
    suggestionsList.push({
      title: request.request_id || `Request #${request.id}`,
      description: `${request.client_name || 'Unknown Client'}`,
      route: `/coi/request/${request.id}`,
      icon: RequestIcon,
      badge: request.status,
      type: 'request',
      originalData: request
    })
  })
  
  // Get top 2 matching clients
  const matchingClients = allClients.value
    .filter((client: any) => {
      const clientName = (client.client_name || client.name || '').toLowerCase()
      const clientCode = (client.client_code || client.code || '').toLowerCase()
      return clientName.includes(lowerQuery) || clientCode.includes(lowerQuery)
    })
    .slice(0, 2)
  
  matchingClients.forEach((client: any) => {
    suggestionsList.push({
      title: client.client_name || client.name || 'Unknown Client',
      description: `Client Code: ${client.client_code || client.code || 'N/A'}`,
      route: undefined,
      action: () => {
        router.push({ path: '/coi/reports', query: { clientId: client.id } })
      },
      icon: ClientIcon,
      type: 'client',
      originalData: client
    })
  })
  
  return suggestionsList.slice(0, 5)
}

// Simple Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  const len1 = str1.length
  const len2 = str2.length
  
  if (len1 === 0) return len2
  if (len2 === 0) return len1
  
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[len2][len1]
}

// Calculate similarity percentage (0-100)
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0
  
  const normalized1 = str1.toLowerCase().trim()
  const normalized2 = str2.toLowerCase().trim()
  
  if (normalized1 === normalized2) return 100
  
  // Check if one contains the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 80
  }
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(normalized1, normalized2)
  const maxLen = Math.max(normalized1.length, normalized2.length)
  if (maxLen === 0) return 100
  
  return Math.max(0, Math.round(((maxLen - distance) / maxLen) * 100))
}

// Get navigation items based on user role
function getNavigationItemsForRole(role: string) {
  const baseItems = [
    { title: 'Reports', route: '/coi/reports', keywords: ['report', 'reports', 'analytics'] },
    { title: 'New Request', route: '/coi/request/new', keywords: ['new', 'create', 'request', 'form'] }
  ]
  
  const roleSpecificItems: Record<string, any[]> = {
    'Requester': [
      { title: 'My Requests', route: '/coi/requester', keywords: ['overview', 'dashboard', 'my requests'] }
    ],
    'Director': [
      { title: 'Director Dashboard', route: '/coi/director', keywords: ['overview', 'dashboard', 'director'] },
      { title: 'Pending Approvals', route: '/coi/director', keywords: ['pending', 'approval', 'approve'] }
    ],
    'Compliance': [
      { title: 'Compliance Dashboard', route: '/coi/compliance', keywords: ['overview', 'dashboard', 'compliance'] },
      { title: 'Pending Reviews', route: '/coi/compliance', keywords: ['pending', 'review', 'compliance'] }
    ],
    'Partner': [
      { title: 'Partner Dashboard', route: '/coi/partner', keywords: ['overview', 'dashboard', 'partner'] },
      { title: 'Pending Approvals', route: '/coi/partner', keywords: ['pending', 'approval', 'approve'] }
    ],
    'Finance': [
      { title: 'Finance Dashboard', route: '/coi/finance', keywords: ['overview', 'dashboard', 'finance'] },
      { title: 'Pending Approvals', route: '/coi/finance', keywords: ['pending', 'approval', 'approve'] }
    ],
    'Admin': [
      { title: 'Admin Dashboard', route: '/coi/admin', keywords: ['overview', 'dashboard', 'admin'] },
      { title: 'Execution Queue', route: '/coi/admin', keywords: ['execution', 'queue', 'proposal'] },
      { title: 'Monitoring', route: '/coi/admin', keywords: ['monitoring', 'alerts', 'tracking'] },
      { title: 'Renewals', route: '/coi/admin', keywords: ['renewal', 'renew', '3-year'] },
      { title: 'User Management', route: '/coi/admin', keywords: ['user', 'users', 'management', 'approver'] },
      { title: 'Client Creations', route: '/coi/admin', keywords: ['client', 'creation', 'pending'] },
      { title: 'ISQM Forms', route: '/coi/admin', keywords: ['isqm', 'form', 'forms'] },
      { title: 'Global COI', route: '/coi/admin', keywords: ['global', 'international', 'coi'] },
      { title: 'Configuration', route: '/coi/admin', keywords: ['config', 'configuration', 'settings'] },
      { title: 'SLA Configuration', route: '/coi/admin/sla-config', keywords: ['sla', 'service level', 'agreement'] },
      { title: 'Priority Configuration', route: '/coi/admin/priority-config', keywords: ['priority', 'scoring', 'rules'] }
    ],
    'Super Admin': [
      { title: 'Super Admin Dashboard', route: '/coi/super-admin', keywords: ['overview', 'dashboard', 'super admin'] },
      { title: 'User Management', route: '/coi/super-admin', keywords: ['user', 'users', 'management'] },
      { title: 'Role Perspectives', route: '/coi/super-admin', keywords: ['role', 'perspective', 'perspectives'] },
      { title: 'Configuration', route: '/coi/super-admin', keywords: ['config', 'configuration', 'settings'] },
      { title: 'Audit Logs', route: '/coi/super-admin', keywords: ['audit', 'log', 'logs'] },
      { title: 'SLA Configuration', route: '/coi/admin/sla-config', keywords: ['sla', 'service level', 'agreement'] },
      { title: 'Priority Configuration', route: '/coi/admin/priority-config', keywords: ['priority', 'scoring', 'rules'] }
    ]
  }
  
  return [...baseItems, ...(roleSpecificItems[role] || [])]
}

// Debounce timer for search
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// Watch for query changes with debounce
watch(query, async (newQuery) => {
  // Clear existing timer
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  
  if (newQuery.length < 2) {
    results.value = []
    suggestions.value = []
    return
  }
  
  // Debounce search (300ms)
  debounceTimer = setTimeout(async () => {
    isSearching.value = true
    
    // Generate suggestions for short queries (1 character)
    if (newQuery.length === 1) {
      const generatedSuggestions = generateSuggestions(newQuery)
      suggestions.value = generatedSuggestions
      results.value = []
    } else {
      // Full search for longer queries
      suggestions.value = []
      const searchResults = await performSearch(newQuery)
      results.value = searchResults
      
      // Save search to history (only if query is meaningful and has results)
      if (newQuery.trim().length >= 2 && searchResults.length > 0) {
        saveSearchHistory(newQuery.trim())
      }
    }
    
    isSearching.value = false
    selectedIndex.value = 0
  }, 300)
})

// Watch for modal open to focus input and load data
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      searchInput.value?.focus()
      query.value = ''
      results.value = []
      suggestions.value = []
    })
    // Load search data and history when modal opens
    await loadSearchData()
    loadSearchHistory()
    loadRecentItems()
  }
})


function handleSelect(result: SearchResult, originalData?: any) {
  // Save to recent items before navigation
  if (result.type && result.type !== 'navigation') {
    let itemId = 0
    if (result.type === 'request' && result.route) {
      itemId = parseInt(result.route.split('/').pop() || '0')
    } else if (result.type === 'client' && originalData) {
      itemId = originalData.id || 0
    } else if (result.type === 'user' && originalData) {
      itemId = originalData.id || 0
    }
    
    if (itemId > 0) {
      saveRecentItem({
        type: result.type,
        id: itemId,
        title: result.title,
        route: result.route
      })
    }
  }
  
  if (result.route) {
    router.push(result.route)
  } else if (result.action) {
    result.action()
  }
  close()
}

function handleHistoryClick(historyQuery: string) {
  query.value = historyQuery
  // Trigger search
  results.value = []
  isSearching.value = true
  performSearch(historyQuery).then(searchResults => {
    results.value = searchResults
    isSearching.value = false
    selectedIndex.value = 0
  })
}

function handleRecentItemClick(item: {type: string, id: number, title: string, route?: string}) {
  if (item.route) {
    router.push(item.route)
    close()
  } else {
    // If no route, search for it
    query.value = item.title
    handleHistoryClick(item.title)
  }
}

function close() {
  emit('close')
  query.value = ''
  results.value = []
  selectedIndex.value = 0
}

// Keyboard navigation
function handleKeydown(event: KeyboardEvent) {
  if (!props.isOpen) return
  
  const maxIndex = query.value.length === 1 && suggestions.value.length > 0 
    ? suggestions.value.length - 1 
    : results.value.length - 1
  
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, maxIndex)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  }
}

function handleSearch() {
  if (query.value.length === 1 && suggestions.value.length > 0) {
    if (selectedIndex.value < suggestions.value.length) {
      const suggestion = suggestions.value[selectedIndex.value]
      handleSelect(suggestion, suggestion.originalData)
    }
  } else if (results.value.length > 0 && selectedIndex.value < results.value.length) {
    const result = results.value[selectedIndex.value] as SearchResult & { originalData?: any }
    handleSelect(result, result.originalData)
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})
</script>

<style scoped>
kbd {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
}
</style>
