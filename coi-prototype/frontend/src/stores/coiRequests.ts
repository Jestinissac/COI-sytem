import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export interface COIRequest {
  id: number
  request_id: string
  client_id: number
  requester_id: number
  department: string
  service_description: string
  service_type: string
  status: string
  stage: string
  client_name?: string
  client_code?: string
  requester_name?: string
  duplication_matches?: any[]
}

export const useCOIRequestsStore = defineStore('coiRequests', () => {
  const requests = ref<COIRequest[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRequests(filters = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/coi/requests', { params: filters })
      requests.value = response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch requests'
    } finally {
      loading.value = false
    }
  }

  async function createRequest(data: any) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/coi/requests', data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create request'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function submitRequest(id: number) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/coi/requests/${id}/submit`)
      await fetchRequests()
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to submit request'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getRequestById(id: number) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/coi/requests/${id}`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch request'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function approveRequest(id: number) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/coi/requests/${id}/approve`)
      await fetchRequests()
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to approve request'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    requests,
    loading,
    error,
    fetchRequests,
    createRequest,
    submitRequest,
    approveRequest,
    getRequestById
  }
})

