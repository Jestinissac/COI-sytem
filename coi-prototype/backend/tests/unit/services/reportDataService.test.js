import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAll = vi.fn(() => [])
const mockGet = vi.fn(() => ({ count: 0, c: 0 }))
const mockDb = {
  prepare: () => ({
    all: mockAll,
    get: mockGet
  })
}

const adminUser = { id: 1, role: 'Admin', department: 'Dept A' }
const complianceUser = { id: 2, role: 'Compliance', department: 'Dept A' }
const partnerUser = { id: 3, role: 'Partner', department: 'Dept A' }

vi.mock('../../../src/database/init.js', () => ({ getDatabase: () => mockDb }))
vi.mock('../../../src/utils/userUtils.js', () => ({ getUserById: vi.fn(() => adminUser) }))
vi.mock('../../../src/config/environment.js', () => ({ isProduction: () => false }))

const {
  getApprovalWorkflowReport,
  getSLAComplianceReport,
  getDepartmentPerformanceReport,
  getConflictAnalysisReport,
  getActiveEngagementsReport
} = await import('../../../src/services/reportDataService.js')

const { getUserById } = await import('../../../src/utils/userUtils.js')

describe('reportDataService — Phase C top 5 reports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAll.mockReturnValue([])
    mockGet.mockReturnValue({ count: 0, c: 0 })
    getUserById.mockReturnValue(adminUser)
  })

  describe('getApprovalWorkflowReport', () => {
    it('returns summary.byStage and summary.totalRequests and requests array', () => {
      mockAll.mockReturnValue([{ status: 'Pending Compliance', count: 2 }])
      const result = getApprovalWorkflowReport(1, {})
      expect(result).toHaveProperty('summary')
      expect(result.summary).toHaveProperty('byStage')
      expect(result.summary).toHaveProperty('totalRequests')
      expect(result).toHaveProperty('requests')
      expect(Array.isArray(result.requests)).toBe(true)
    })

    it('handles empty dataset with zeroed counts', () => {
      mockAll.mockReturnValue([])
      const result = getApprovalWorkflowReport(1, {})
      expect(result.summary.byStage).toEqual({})
      expect(result.summary.totalRequests).toBe(0)
      expect(result.requests).toEqual([])
    })

    it('handles invalid or missing filters without throwing', () => {
      expect(() => getApprovalWorkflowReport(1, { dateFrom: 'invalid' })).not.toThrow()
      expect(() => getApprovalWorkflowReport(1, null)).not.toThrow()
    })
  })

  describe('getSLAComplianceReport', () => {
    it('returns summary with breached, onTime, byDepartment, byWorkflowStage and requests', () => {
      mockAll.mockReturnValue([])
      const result = getSLAComplianceReport(1, {})
      expect(result).toHaveProperty('summary')
      expect(result.summary).toHaveProperty('breached')
      expect(result.summary).toHaveProperty('onTime')
      expect(result.summary).toHaveProperty('byDepartment')
      expect(result.summary).toHaveProperty('byWorkflowStage')
      expect(result).toHaveProperty('requests')
      expect(Array.isArray(result.requests)).toBe(true)
    })

    it('handles empty dataset', () => {
      mockAll.mockReturnValue([])
      mockGet.mockReturnValue({ c: 0 })
      const result = getSLAComplianceReport(1, {})
      expect(result.summary.breached).toBe(0)
      expect(result.requests).toEqual([])
    })
  })

  describe('getDepartmentPerformanceReport', () => {
    it('returns summary.byDepartment array and requests array', () => {
      mockAll.mockReturnValue([{ department: 'Dept A', count: 5, approved: 2 }])
      const result = getDepartmentPerformanceReport(1, {})
      expect(result).toHaveProperty('summary')
      expect(result.summary).toHaveProperty('byDepartment')
      expect(Array.isArray(result.summary.byDepartment)).toBe(true)
      expect(result).toHaveProperty('requests')
      expect(Array.isArray(result.requests)).toBe(true)
    })

    it('handles empty dataset', () => {
      mockAll.mockReturnValue([])
      const result = getDepartmentPerformanceReport(1, {})
      expect(result.summary.byDepartment).toEqual([])
      expect(result.requests).toEqual([])
    })
  })

  describe('getConflictAnalysisReport', () => {
    it('returns summary (totalConflicts, resolved, unresolved, byType), conflicts, duplications', () => {
      mockAll.mockReturnValue([])
      getUserById.mockReturnValue(complianceUser)
      const result = getConflictAnalysisReport(2, {})
      expect(result).toHaveProperty('summary')
      expect(result.summary).toHaveProperty('totalConflicts')
      expect(result.summary).toHaveProperty('resolved')
      expect(result.summary).toHaveProperty('unresolved')
      expect(result.summary).toHaveProperty('byType')
      expect(result).toHaveProperty('conflicts')
      expect(result).toHaveProperty('duplications')
      expect(Array.isArray(result.conflicts)).toBe(true)
      expect(Array.isArray(result.duplications)).toBe(true)
    })

    it('handles empty dataset', () => {
      mockAll.mockReturnValue([])
      getUserById.mockReturnValue(complianceUser)
      const result = getConflictAnalysisReport(2, {})
      expect(result.summary.totalConflicts).toBe(0)
      expect(result.conflicts).toEqual([])
      expect(result.duplications).toEqual([])
    })
  })

  describe('getActiveEngagementsReport', () => {
    it('returns summary.total, summary.byServiceType and requests array', () => {
      mockAll.mockReturnValue([])
      getUserById.mockReturnValue(partnerUser)
      const result = getActiveEngagementsReport(3, {})
      expect(result).toHaveProperty('summary')
      expect(result.summary).toHaveProperty('total')
      expect(result.summary).toHaveProperty('byServiceType')
      expect(result).toHaveProperty('requests')
      expect(Array.isArray(result.requests)).toBe(true)
    })

    it('handles empty dataset', () => {
      mockAll.mockReturnValue([])
      getUserById.mockReturnValue(partnerUser)
      const result = getActiveEngagementsReport(3, {})
      expect(result.summary.total).toBe(0)
      expect(result.summary.byServiceType).toEqual({})
      expect(result.requests).toEqual([])
    })
  })
})
