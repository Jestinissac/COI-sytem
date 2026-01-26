import api from './api'

export interface ReportFilters {
  dateFrom?: string
  dateTo?: string
  status?: string
  serviceType?: string
  clientId?: number
  clientName?: string
  requesterId?: number
  department?: string
  conflictLevel?: string
  conversionStatus?: string
  includeData?: boolean | string
  page?: number
  pageSize?: number
  [key: string]: any
}

export interface ReportData {
  summary: Record<string, any>
  requests?: any[]
  codes?: any[]
  prospects?: any[]
  pagination?: {
    currentPage: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Get report data (preview)
 */
export async function getReportData(role: string, reportType: string, filters: ReportFilters = {}): Promise<ReportData> {
  const response = await api.post(`/reports/${role}/${reportType}`, filters)
  return response.data
}

/**
 * Export report as PDF
 */
export async function exportReportPDF(role: string, reportType: string, filters: ReportFilters = {}): Promise<Blob> {
  const response = await api.post(`/reports/${role}/${reportType}/export/pdf`, filters, {
    responseType: 'blob'
  })
  return response.data
}

/**
 * Export report as Excel
 */
export async function exportReportExcel(role: string, reportType: string, filters: ReportFilters = {}): Promise<Blob> {
  const response = await api.post(`/reports/${role}/${reportType}/export/excel`, filters, {
    responseType: 'blob'
  })
  return response.data
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
