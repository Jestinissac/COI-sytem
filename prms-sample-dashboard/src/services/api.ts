import axios from 'axios'

export interface DashboardResponse {
  metrics: {
    activeProjects: number
    teamUtilization: number
    monthlyRevenue: number
    clientSatisfaction: number
  }
  revenueTrend: any
  projectStatus: any
  auditServicesRevenue: any
  taxServices: any
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  const { data } = await axios.get<DashboardResponse>('/api/dashboard.json', { headers: { 'Cache-Control': 'no-cache' } })
  return data
}


