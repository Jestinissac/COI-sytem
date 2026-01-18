import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface SavedReport {
  id: string
  name: string
  role: string
  reportType: string
  filters: Record<string, any>
  isFavorite: boolean
  createdAt: string
  lastUsed: string
}

export const useReportsStore = defineStore('reports', () => {
  const savedReports = ref<SavedReport[]>([])
  const MAX_SAVED_REPORTS = 50
  const MAX_RECENT_REPORTS = 10

  // Load from localStorage on init
  function loadSavedReports() {
    try {
      const stored = localStorage.getItem('coi_saved_reports')
      if (stored) {
        savedReports.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading saved reports:', error)
    }
  }

  // Save to localStorage
  function saveToStorage() {
    try {
      localStorage.setItem('coi_saved_reports', JSON.stringify(savedReports.value))
    } catch (error) {
      console.error('Error saving reports to storage:', error)
    }
  }

  // Initialize
  loadSavedReports()

  // Get favorite reports
  const favoriteReports = computed(() => {
    return savedReports.value
      .filter(r => r.isFavorite)
      .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
  })

  // Get recently used reports
  const recentReports = computed(() => {
    return savedReports.value
      .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
      .slice(0, MAX_RECENT_REPORTS)
  })

  // Save a report configuration
  function saveReport(name: string, role: string, reportType: string, filters: Record<string, any>) {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newReport: SavedReport = {
      id,
      name,
      role,
      reportType,
      filters,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    }

    savedReports.value.unshift(newReport)
    
    // Limit total saved reports
    if (savedReports.value.length > MAX_SAVED_REPORTS) {
      savedReports.value = savedReports.value.slice(0, MAX_SAVED_REPORTS)
    }

    saveToStorage()
    return id
  }

  // Update report
  function updateReport(id: string, updates: Partial<SavedReport>) {
    const index = savedReports.value.findIndex(r => r.id === id)
    if (index !== -1) {
      savedReports.value[index] = { ...savedReports.value[index], ...updates }
      saveToStorage()
    }
  }

  // Delete report
  function deleteReport(id: string) {
    savedReports.value = savedReports.value.filter(r => r.id !== id)
    saveToStorage()
  }

  // Toggle favorite
  function toggleFavorite(id: string) {
    const report = savedReports.value.find(r => r.id === id)
    if (report) {
      report.isFavorite = !report.isFavorite
      saveToStorage()
    }
  }

  // Update last used
  function updateLastUsed(id: string) {
    const report = savedReports.value.find(r => r.id === id)
    if (report) {
      report.lastUsed = new Date().toISOString()
      // Move to top
      savedReports.value = [
        report,
        ...savedReports.value.filter(r => r.id !== id)
      ]
      saveToStorage()
    }
  }

  // Get report by ID
  function getReport(id: string): SavedReport | undefined {
    return savedReports.value.find(r => r.id === id)
  }

  return {
    savedReports,
    favoriteReports,
    recentReports,
    saveReport,
    updateReport,
    deleteReport,
    toggleFavorite,
    updateLastUsed,
    getReport
  }
})
