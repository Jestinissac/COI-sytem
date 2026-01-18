import api from './api'

export interface ShareOptions {
  password?: string
  expiresInDays?: number
  accessLevel?: 'view' | 'download' | 'export'
  allowedRoles?: string[]
  allowedUsers?: number[]
  ipWhitelist?: string[]
}

export interface EmailShareOptions {
  recipients: string[]
  message?: string
}

/**
 * Create a shareable report link
 */
export async function createReportShare(
  role: string,
  reportType: string,
  filters: Record<string, any>,
  options: ShareOptions = {}
) {
  const response = await api.post(`/reports/${role}/${reportType}/share`, {
    filters,
    ...options
  })
  return response.data
}

/**
 * Access a shared report
 */
export async function accessSharedReport(token: string, password?: string) {
  const response = await api.get(`/reports/share/${token}`, {
    params: password ? { password } : {}
  })
  return response.data
}

/**
 * Revoke a share
 */
export async function revokeShare(token: string) {
  const response = await api.delete(`/reports/share/${token}`)
  return response.data
}

/**
 * Get share activity
 */
export async function getShareActivity(token: string) {
  const response = await api.get(`/reports/share/${token}/activity`)
  return response.data
}

/**
 * Get user's shares
 */
export async function getMyShares() {
  const response = await api.get('/reports/shares')
  return response.data
}

/**
 * Send report via email
 */
export async function sendReportEmail(
  role: string,
  reportType: string,
  filters: Record<string, any>,
  options: EmailShareOptions
) {
  const response = await api.post(`/reports/${role}/${reportType}/share/email`, {
    filters,
    ...options
  })
  return response.data
}
