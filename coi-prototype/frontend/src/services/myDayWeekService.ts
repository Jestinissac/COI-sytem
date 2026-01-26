import apiClient from './api'

export interface MyDayItem {
  id: number
  request_id: string
  client_name: string
  status: string
  daysPending: number
  actionType: string
  created_at: string
  [key: string]: any
}

export interface MyDayData {
  today: {
    actionRequired: MyDayItem[]
    expiring: MyDayItem[]
    overdue: MyDayItem[]
  }
  summary: {
    totalActions: number
    urgentCount: number
    expiringCount: number
  }
}

export interface MyWeekItem extends MyDayItem {
  dueDate?: string
  expiryDate?: string
}

export interface MyWeekData {
  thisWeek: {
    dueThisWeek: MyWeekItem[]
    expiringThisWeek: MyWeekItem[]
    groupedByDay: Record<string, MyWeekItem[]>
  }
  summary: {
    weekTotal: number
  }
}

export interface MyMonthItem extends MyDayItem {
  dueDate?: string
  expiryDate?: string
}

export interface MyMonthData {
  thisMonth: {
    upcomingThisMonth: MyMonthItem[]
    expiringThisMonth: MyMonthItem[]
    groupedByDate: Record<string, MyMonthItem[]>
  }
  summary: {
    monthTotal: number
  }
}

export interface EventBusEvent {
  type: string
  requestId: string | null
  timestamp: string
  message: string
  priority: 'critical' | 'urgent' | 'normal'
}

export interface EventBusStatus {
  events: EventBusEvent[]
  count: number
}

export async function getMyDay(): Promise<MyDayData> {
  const response = await apiClient.get('/my-day')
  return response.data
}

export async function getMyWeek(): Promise<MyWeekData> {
  const response = await apiClient.get('/my-week')
  return response.data
}

export async function getMyMonth(): Promise<MyMonthData> {
  const response = await apiClient.get('/my-month')
  return response.data
}

export async function getEventBusStatus(): Promise<EventBusStatus> {
  const response = await apiClient.get('/event-bus-status')
  return response.data
}

/**
 * Get all task data in one call (day, week, month)
 * More efficient for the unified MyTasks view
 */
export async function getMyTasks(): Promise<{
  day: MyDayData
  week: MyWeekData
  month: MyMonthData
}> {
  const [day, week, month] = await Promise.all([
    getMyDay(),
    getMyWeek(),
    getMyMonth()
  ])
  return { day, week, month }
}
