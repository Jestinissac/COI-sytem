import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

interface Client {
  id: number
  client_code: string
  client_name: string
  commercial_registration: string
  status: 'Active' | 'Inactive' | 'Potential'
  industry: string
  nature_of_business: string
  parent_company_id: number | null
}

export const useClientsStore = defineStore('clients', () => {
  const clients = ref<Client[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const activeClients = computed(() => 
    clients.value.filter(c => c.status === 'Active')
  )

  const recentClients = computed(() => 
    clients.value.slice(0, 5)
  )

  async function fetchClients() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/integration/clients')
      clients.value = response.data
    } catch (e: any) {
      error.value = e.message
      console.error('Failed to fetch clients:', e)
    } finally {
      loading.value = false
    }
  }

  function searchClients(query: string) {
    if (!query) return activeClients.value
    const lowerQuery = query.toLowerCase()
    return activeClients.value.filter(c => 
      c.client_name.toLowerCase().includes(lowerQuery) ||
      c.client_code.toLowerCase().includes(lowerQuery)
    )
  }

  function getClientById(id: number) {
    return clients.value.find(c => c.id === id)
  }

  function getClientByCode(code: string) {
    return clients.value.find(c => c.client_code === code)
  }

  return {
    clients,
    activeClients,
    recentClients,
    loading,
    error,
    fetchClients,
    searchClients,
    getClientById,
    getClientByCode
  }
})

