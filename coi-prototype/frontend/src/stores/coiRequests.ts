import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export interface ComplianceCheck {
  rule: string
  status: 'passed' | 'failed' | 'warning'
  is_outdated: boolean
  rule_id?: number
  checked_at?: string
}

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
  international_operations?: boolean
  created_at?: string
  updated_at?: string
  compliance_review_status?: string
  compliance_review_date?: string
  // Stale request handling
  requires_re_evaluation?: boolean
  stale_reason?: string
  compliance_checks?: ComplianceCheck[]
  last_rule_check_at?: string
  [key: string]: any // Allow additional properties from API
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

