export type ServiceLine = 'Audit' | 'Tax' | 'Advisory'
export type ProjectPhase = 'Planning' | 'Fieldwork' | 'Review' | 'Complete'

export interface Client {
  clientId: string
  clientName: string
  industry: string
  createdDate: string
  risk?: 'Low' | 'Medium' | 'High'
}

export interface Project {
  projectId: string
  projectName: string
  client: string // clientId
  serviceLine: ServiceLine
  startDate: string
  endDate?: string
  phase: ProjectPhase
  partner: string
  manager: string
  projectValue: number
  budget: number
  projectCost: number
  timesheets: TimesheetEntry[]
  employee: string
  riskLevel: 'Low' | 'Medium' | 'High'
  priority: 'Low' | 'Medium' | 'High'
  estimatedHours: number
  actualHours: number
}

export interface TeamAssignment {
  projectId: string
  employeeId: string
  employeeName: string
  grade: 'Associate' | 'Senior' | 'Manager' | 'Partner'
}

export interface TimesheetEntry {
  employee: string
  employeeName: string
  project: string
  date: string // ISO date
  hours?: number
  entryDate: string
  description?: string
  billable: boolean
  approved: boolean
}

export interface Invoice {
  invoiceId: string
  projectId: string
  clientId: string
  amountKWD: number
  issueDate: string
  dueDate: string
  paid: boolean
}

export interface Proposal {
  id: string
  clientName: string
  serviceLine: ServiceLine
  stage: 'RFP' | 'Submitted' | 'Won' | 'Lost'
  estValueKWD: number
  dueDate?: string
}

export interface Employee {
  employeeId: string
  employeeName: string
  grade: 'Associate' | 'Senior' | 'Manager' | 'Partner'
  department: 'Audit' | 'Tax' | 'Advisory' | 'Admin'
  email: string
  phone: string
  hireDate: string
  utilization: number
  activeProjects: string[]
}

export interface ProjectApproval {
  approvalId: string
  projectId: string
  type: 'Budget' | 'Scope' | 'Timeline' | 'Resource'
  status: 'Pending' | 'Approved' | 'Rejected'
  requestedBy: string
  requestedDate: string
  approvedBy?: string
  approvedDate?: string
  comments?: string
  priority: 'Low' | 'Medium' | 'High'
}

export interface ClientProject {
  clientId: string
  projectId: string
  projectName: string
  serviceLine: ServiceLine
  startDate: string
  endDate?: string
  status: ProjectPhase
  value: number
  risk: 'Low' | 'Medium' | 'High'
}

export interface DashboardMetric {
  id: string
  title: string
  value: number | string
  unit?: string
  trend?: number
  status?: 'success' | 'warning' | 'error' | 'info'
  clickable: boolean
  action?: string
  details?: any
}

export const clients: Client[] = [
  { clientId: 'C025001', clientName: 'Burgan Bank', industry: 'Banking', createdDate: '2025-01-15', risk: 'Low' },
  { clientId: 'C025002', clientName: 'Warba Bank', industry: 'Banking', createdDate: '2025-02-20', risk: 'Low' },
  { clientId: 'C025003', clientName: 'Kuwait Portland Cement', industry: 'Manufacturing', createdDate: '2025-03-05', risk: 'Medium' },
  { clientId: 'C025004', clientName: 'Humansoft', industry: 'Technology', createdDate: '2025-03-10', risk: 'Low' },
  { clientId: 'C024001', clientName: 'Gulf Bank', industry: 'Banking', createdDate: '2024-01-20', risk: 'Low' },
  { clientId: 'C024002', clientName: 'KIPCO', industry: 'Investment', createdDate: '2024-02-15', risk: 'Medium' },
  { clientId: 'C024003', clientName: 'Zain Kuwait', industry: 'Telecom', createdDate: '2024-03-25', risk: 'Low' },
  { clientId: 'C025005', clientName: 'Agility', industry: 'Logistics', createdDate: '2025-02-02', risk: 'Low' },
  { clientId: 'C025006', clientName: 'Boubyan', industry: 'Banking', createdDate: '2025-03-08', risk: 'Low' },
  { clientId: 'C024004', clientName: 'NBK', industry: 'Banking', createdDate: '2024-11-10', risk: 'Low' },
]

export const projects: Project[] = [
  { 
    projectId: 'P025001', 
    projectName: 'Burgan Bank Audit', 
    client: 'C025001', 
    serviceLine: 'Audit', 
    startDate: '2025-01-20', 
    phase: 'Complete', 
    partner: 'Partner A', 
    manager: 'Manager X', 
    projectValue: 45000, 
    budget: 45000, 
    projectCost: 44200,
    timesheets: [],
    employee: 'EMP001',
    riskLevel: 'Low',
    priority: 'Medium',
    estimatedHours: 200,
    actualHours: 195
  },
  { 
    projectId: 'P025002', 
    projectName: 'Warba Bank Review', 
    client: 'C025002', 
    serviceLine: 'Audit', 
    startDate: '2025-02-25', 
    phase: 'Review', 
    partner: 'Partner A', 
    manager: 'Manager Y', 
    projectValue: 35000, 
    budget: 36000, 
    projectCost: 32500,
    timesheets: [],
    employee: 'EMP002',
    riskLevel: 'Low',
    priority: 'High',
    estimatedHours: 180,
    actualHours: 165
  },
  { 
    projectId: 'P025003', 
    projectName: 'KPC Tax Advisory', 
    client: 'C025003', 
    serviceLine: 'Tax', 
    startDate: '2025-03-01', 
    phase: 'Fieldwork', 
    partner: 'Partner B', 
    manager: 'Manager Z', 
    projectValue: 55000, 
    budget: 52000, 
    projectCost: 39000,
    timesheets: [],
    employee: 'EMP003',
    riskLevel: 'Medium',
    priority: 'High',
    estimatedHours: 250,
    actualHours: 180
  },
  { 
    projectId: 'P025004', 
    projectName: 'Humansoft Audit', 
    client: 'C025004', 
    serviceLine: 'Audit', 
    startDate: '2025-03-12', 
    phase: 'Planning', 
    partner: 'Partner A', 
    manager: 'Manager X', 
    projectValue: 25000, 
    budget: 26000, 
    projectCost: 7000,
    timesheets: [],
    employee: 'EMP004',
    riskLevel: 'Low',
    priority: 'Medium',
    estimatedHours: 120,
    actualHours: 35
  },
  { 
    projectId: 'P025005', 
    projectName: 'NBK Compliance Review', 
    client: 'C024004', 
    serviceLine: 'Advisory', 
    startDate: '2025-03-15', 
    phase: 'Planning', 
    partner: 'Partner C', 
    manager: 'Manager W', 
    projectValue: 40000, 
    budget: 42000, 
    projectCost: 6000,
    timesheets: [],
    employee: 'EMP005',
    riskLevel: 'Medium',
    priority: 'High',
    estimatedHours: 200,
    actualHours: 30
  },
  { 
    projectId: 'P024001', 
    projectName: 'Gulf Bank Audit', 
    client: 'C024001', 
    serviceLine: 'Audit', 
    startDate: '2024-01-15', 
    phase: 'Complete', 
    partner: 'Partner A', 
    manager: 'Manager X', 
    projectValue: 42000, 
    budget: 42000, 
    projectCost: 41500,
    timesheets: [],
    employee: 'EMP001',
    riskLevel: 'Low',
    priority: 'Medium',
    estimatedHours: 190,
    actualHours: 188
  },
  { 
    projectId: 'P024002', 
    projectName: 'KIPCO Review', 
    client: 'C024002', 
    serviceLine: 'Advisory', 
    startDate: '2024-02-20', 
    phase: 'Complete', 
    partner: 'Partner C', 
    manager: 'Manager W', 
    projectValue: 38000, 
    budget: 38000, 
    projectCost: 37200,
    timesheets: [],
    employee: 'EMP005',
    riskLevel: 'Medium',
    priority: 'Medium',
    estimatedHours: 170,
    actualHours: 168
  },
  { 
    projectId: 'P024003', 
    projectName: 'Zain Audit', 
    client: 'C024003', 
    serviceLine: 'Audit', 
    startDate: '2024-03-10', 
    phase: 'Complete', 
    partner: 'Partner B', 
    manager: 'Manager V', 
    projectValue: 33000, 
    budget: 33000, 
    projectCost: 32900,
    timesheets: [],
    employee: 'EMP002',
    riskLevel: 'Low',
    priority: 'Medium',
    estimatedHours: 150,
    actualHours: 149
  },
  { 
    projectId: 'P025006', 
    projectName: 'Gulf Bank Tax Review', 
    client: 'C024001', 
    serviceLine: 'Tax', 
    startDate: '2025-02-10', 
    phase: 'Review', 
    partner: 'Partner B', 
    manager: 'Manager V', 
    projectValue: 32000, 
    budget: 31000, 
    projectCost: 28000,
    timesheets: [],
    employee: 'EMP003',
    riskLevel: 'Low',
    priority: 'High',
    estimatedHours: 160,
    actualHours: 140
  },
  { 
    projectId: 'P025007', 
    projectName: 'Agility Internal Audit', 
    client: 'C025005', 
    serviceLine: 'Audit', 
    startDate: '2025-02-05', 
    phase: 'Fieldwork', 
    partner: 'Partner A', 
    manager: 'Manager X', 
    projectValue: 30000, 
    budget: 29500, 
    projectCost: 21000,
    timesheets: [],
    employee: 'EMP004',
    riskLevel: 'Medium',
    priority: 'Medium',
    estimatedHours: 140,
    actualHours: 98
  },
  { 
    projectId: 'P025008', 
    projectName: 'Boubyan VAT Advisory', 
    client: 'C025006', 
    serviceLine: 'Tax', 
    startDate: '2025-03-08', 
    phase: 'Planning', 
    partner: 'Partner B', 
    manager: 'Manager Z', 
    projectValue: 28000, 
    budget: 27000, 
    projectCost: 5000,
    timesheets: [],
    employee: 'EMP005',
    riskLevel: 'Low',
    priority: 'Medium',
    estimatedHours: 130,
    actualHours: 25
  },
  { 
    projectId: 'P025009', 
    projectName: 'Zain ITGC Review', 
    client: 'C024003', 
    serviceLine: 'Advisory', 
    startDate: '2025-01-28', 
    phase: 'Review', 
    partner: 'Partner C', 
    manager: 'Manager W', 
    projectValue: 26000, 
    budget: 25000, 
    projectCost: 21000,
    timesheets: [],
    employee: 'EMP001',
    riskLevel: 'Medium',
    priority: 'High',
    estimatedHours: 120,
    actualHours: 105
  },
]

export const teamAssignments: TeamAssignment[] = [
  { projectId: 'P025001', employeeId: 'EMP001', employeeName: 'Ahmed Al-Rashid', grade: 'Associate' },
  { projectId: 'P025002', employeeId: 'EMP002', employeeName: 'Sara Khalil', grade: 'Senior' },
  { projectId: 'P025003', employeeId: 'EMP003', employeeName: 'Omar Saleh', grade: 'Manager' },
  { projectId: 'P025004', employeeId: 'EMP004', employeeName: 'Fatima Al-Sabah', grade: 'Associate' },
  { projectId: 'P025007', employeeId: 'EMP005', employeeName: 'Hassan Ali', grade: 'Senior' },
]

export const timesheets: TimesheetEntry[] = [
  { 
    employee: 'EMP001', 
    employeeName: 'Ahmed Al-Rashid', 
    project: 'P025001', 
    date: '2025-03-10', 
    hours: 8,
    entryDate: '2025-03-10',
    description: 'Audit fieldwork - testing controls',
    billable: true,
    approved: true
  },
  { 
    employee: 'EMP002', 
    employeeName: 'Sara Khalil', 
    project: 'P025002', 
    date: '2025-03-11', 
    hours: 7.5,
    entryDate: '2025-03-11',
    description: 'Review documentation and prepare report',
    billable: true,
    approved: true
  },
  { 
    employee: 'EMP003', 
    employeeName: 'Omar Saleh', 
    project: 'P025003', 
    date: '2025-03-12', 
    hours: 8,
    entryDate: '2025-03-12',
    description: 'Tax advisory - client meeting and analysis',
    billable: true,
    approved: false
  },
]

export const employees: Employee[] = [
  {
    employeeId: 'EMP001',
    employeeName: 'Ahmed Al-Rashid',
    grade: 'Senior',
    department: 'Audit',
    email: 'ahmed.alrashid@envision.com',
    phone: '+965-1234-5678',
    hireDate: '2023-01-15',
    utilization: 92,
    activeProjects: ['P025001', 'P024001', 'P025009']
  },
  {
    employeeId: 'EMP002',
    employeeName: 'Sara Khalil',
    grade: 'Manager',
    department: 'Audit',
    email: 'sara.khalil@envision.com',
    phone: '+965-1234-5679',
    hireDate: '2022-03-20',
    utilization: 88,
    activeProjects: ['P025002', 'P024003']
  },
  {
    employeeId: 'EMP003',
    employeeName: 'Omar Saleh',
    grade: 'Senior',
    department: 'Tax',
    email: 'omar.saleh@envision.com',
    phone: '+965-1234-5680',
    hireDate: '2023-06-10',
    utilization: 95,
    activeProjects: ['P025003', 'P025006']
  },
  {
    employeeId: 'EMP004',
    employeeName: 'Fatima Al-Sabah',
    grade: 'Associate',
    department: 'Audit',
    email: 'fatima.alsabah@envision.com',
    phone: '+965-1234-5681',
    hireDate: '2024-09-01',
    utilization: 78,
    activeProjects: ['P025004', 'P025007']
  },
  {
    employeeId: 'EMP005',
    employeeName: 'Hassan Ali',
    grade: 'Senior',
    department: 'Advisory',
    email: 'hassan.ali@envision.com',
    phone: '+965-1234-5682',
    hireDate: '2022-11-15',
    utilization: 85,
    activeProjects: ['P025005', 'P024002', 'P025008']
  }
]

export const projectApprovals: ProjectApproval[] = [
  {
    approvalId: 'APV001',
    projectId: 'P025003',
    type: 'Budget',
    status: 'Pending',
    requestedBy: 'Manager Z',
    requestedDate: '2025-03-10',
    comments: 'Additional budget required for extended fieldwork',
    priority: 'High'
  },
  {
    approvalId: 'APV002',
    projectId: 'P025004',
    type: 'Scope',
    status: 'Approved',
    requestedBy: 'Manager X',
    requestedDate: '2025-03-08',
    approvedBy: 'Partner A',
    approvedDate: '2025-03-09',
    comments: 'Scope expansion approved for additional testing',
    priority: 'Medium'
  },
  {
    approvalId: 'APV003',
    projectId: 'P025005',
    type: 'Resource',
    status: 'Pending',
    requestedBy: 'Manager W',
    requestedDate: '2025-03-12',
    comments: 'Additional senior consultant needed',
    priority: 'High'
  },
  {
    approvalId: 'APV004',
    projectId: 'P025006',
    type: 'Timeline',
    status: 'Rejected',
    requestedBy: 'Manager V',
    requestedDate: '2025-03-05',
    approvedBy: 'Partner B',
    approvedDate: '2025-03-06',
    comments: 'Timeline extension not feasible due to client constraints',
    priority: 'Medium'
  }
]

export const clientProjects: ClientProject[] = [
  {
    clientId: 'C025001',
    projectId: 'P025001',
    projectName: 'Burgan Bank Audit',
    serviceLine: 'Audit',
    startDate: '2025-01-20',
    endDate: '2025-03-15',
    status: 'Complete',
    value: 45000,
    risk: 'Low'
  },
  {
    clientId: 'C025002',
    projectId: 'P025002',
    projectName: 'Warba Bank Review',
    serviceLine: 'Audit',
    startDate: '2025-02-25',
    status: 'Review',
    value: 35000,
    risk: 'Low'
  },
  {
    clientId: 'C025003',
    projectId: 'P025003',
    projectName: 'KPC Tax Advisory',
    serviceLine: 'Tax',
    startDate: '2025-03-01',
    status: 'Fieldwork',
    value: 55000,
    risk: 'Medium'
  }
]

export const dashboardMetrics: DashboardMetric[] = [
  {
    id: 'total-projects',
    title: 'Total Projects',
    value: projects.length,
    status: 'info',
    clickable: true,
    action: 'view-all-projects',
    details: { filter: 'all' }
  },
  {
    id: 'active-projects',
    title: 'Active Projects',
    value: projects.filter(p => p.phase !== 'Complete').length,
    status: 'success',
    clickable: true,
    action: 'view-active-projects',
    details: { filter: 'active' }
  },
  {
    id: 'pending-approvals',
    title: 'Pending Approvals',
    value: projectApprovals.filter(a => a.status === 'Pending').length,
    status: 'warning',
    clickable: true,
    action: 'view-pending-approvals',
    details: { filter: 'pending' }
  },
  {
    id: 'overdue-timesheets',
    title: 'Overdue Timesheets',
    value: 3,
    status: 'error',
    clickable: true,
    action: 'view-overdue-timesheets',
    details: { filter: 'overdue' }
  }
]

// Add sample timesheet data to projects
projects.forEach(project => {
  if (project.timesheets.length === 0) {
    // Generate sample timesheet entries for the last 30 days
    const today = new Date()
    const startDate = new Date(project.startDate)
    const endDate = project.endDate ? new Date(project.endDate) : today
    
    for (let d = new Date(startDate); d <= endDate && d <= today; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) { // Skip weekends
        const hours = Math.random() > 0.3 ? Math.floor(Math.random() * 4) + 4 : 0 // 70% chance of work day
        if (hours > 0) {
          project.timesheets.push({
            employee: project.employee,
            employeeName: employees.find(e => e.employeeId === project.employee)?.employeeName || 'Unknown',
            project: project.projectId,
            date: d.toISOString().split('T')[0],
            hours,
            entryDate: d.toISOString().split('T')[0],
            description: `${project.phase} work on ${project.projectName}`,
            billable: true,
            approved: Math.random() > 0.2 // 80% chance of approval
          })
        }
      }
    }
  }
})

// Sample Financial Reports
export const financialReports: FinancialReport[] = [
  {
    id: 'FR-2025-Q1',
    period: 'QTD',
    year: 2025,
    quarter: 1,
    totalRevenue: 1250000,
    totalExpenses: 875000,
    grossProfit: 375000,
    netProfit: 298000,
    profitMargin: 23.8,
    revenueByService: {
      'Audit': 450000,
      'Tax': 380000,
      'Advisory': 420000
    },
    expensesByCategory: {
      'Personnel': 520000,
      'Technology': 150000,
      'Office': 80000,
      'Marketing': 60000,
      'Other': 65000
    },
    cashFlow: 285000,
    outstandingInvoices: 180000,
    overdueInvoices: 45000
  },
  {
    id: 'FR-2025-MTD',
    period: 'MTD',
    year: 2025,
    month: 3,
    totalRevenue: 420000,
    totalExpenses: 295000,
    grossProfit: 125000,
    netProfit: 98000,
    profitMargin: 23.3,
    revenueByService: {
      'Audit': 150000,
      'Tax': 140000,
      'Advisory': 130000
    },
    expensesByCategory: {
      'Personnel': 175000,
      'Technology': 50000,
      'Office': 25000,
      'Marketing': 20000,
      'Other': 25000
    },
    cashFlow: 95000,
    outstandingInvoices: 65000,
    overdueInvoices: 15000
  }
]

// Sample Employee Performance Data
export const employeePerformance: EmployeePerformance[] = [
  {
    employeeId: 'EMP001',
    employeeName: 'Ahmed Al-Rashid',
    grade: 'Senior',
    department: 'Audit',
    period: 'MTD',
    year: 2025,
    month: 3,
    billableHours: 168,
    nonBillableHours: 12,
    utilization: 93.3,
    projectsWorked: 3,
    averageRating: 4.8,
    clientFeedback: ['Excellent technical skills', 'Great communication', 'Delivered on time'],
    certifications: ['CPA', 'CIA', 'CISA'],
    trainingHours: 8,
    performanceScore: 92
  },
  {
    employeeId: 'EMP002',
    employeeName: 'Sara Khalil',
    grade: 'Manager',
    department: 'Audit',
    period: 'MTD',
    year: 2025,
    month: 3,
    billableHours: 160,
    nonBillableHours: 20,
    utilization: 88.9,
    projectsWorked: 2,
    averageRating: 4.6,
    clientFeedback: ['Strong leadership', 'Good project management'],
    certifications: ['CPA', 'MBA'],
    trainingHours: 12,
    performanceScore: 88
  },
  {
    employeeId: 'EMP003',
    employeeName: 'Omar Saleh',
    grade: 'Senior',
    department: 'Tax',
    period: 'MTD',
    year: 2025,
    month: 3,
    billableHours: 175,
    nonBillableHours: 5,
    utilization: 97.2,
    projectsWorked: 2,
    averageRating: 4.9,
    clientFeedback: ['Outstanding tax expertise', 'Very responsive'],
    certifications: ['CPA', 'Tax Specialist'],
    trainingHours: 6,
    performanceScore: 95
  }
]

// Sample Client Analytics
export const clientAnalytics: ClientAnalytics[] = [
  {
    clientId: 'C025001',
    totalProjects: 3,
    totalRevenue: 112000,
    averageProjectValue: 37333,
    projectSuccessRate: 100,
    clientSatisfaction: 4.8,
    retentionRate: 100,
    referralCount: 2,
    industry: 'Banking',
    riskProfile: 'Low',
    lastEngagement: '2025-03-15',
    nextReviewDate: '2025-06-15',
    relationshipManager: 'Partner A'
  },
  {
    clientId: 'C025003',
    totalProjects: 1,
    totalRevenue: 55000,
    averageProjectValue: 55000,
    projectSuccessRate: 100,
    clientSatisfaction: 4.7,
    retentionRate: 100,
    referralCount: 1,
    industry: 'Oil & Gas',
    riskProfile: 'Medium',
    lastEngagement: '2025-03-12',
    nextReviewDate: '2025-04-12',
    relationshipManager: 'Partner B'
  }
]

// Sample Project Tracking Data
export const projectTracking: ProjectTracking[] = [
  {
    projectId: 'P025003',
    milestones: [
      {
        id: 'M001',
        name: 'Project Kickoff',
        description: 'Initial client meeting and project setup',
        dueDate: '2025-03-01',
        status: 'Completed',
        completionPercentage: 100,
        dependencies: [],
        assignedTo: 'Manager Z'
      },
      {
        id: 'M002',
        name: 'Fieldwork Phase',
        description: 'Data collection and analysis',
        dueDate: '2025-03-21',
        status: 'In Progress',
        completionPercentage: 60,
        dependencies: ['M001'],
        assignedTo: 'Omar Saleh'
      }
    ],
    risks: [
      {
        id: 'R001',
        description: 'Client data availability delays',
        probability: 'Medium',
        impact: 'Medium',
        status: 'Open',
        mitigationPlan: 'Early data request and backup sources',
        assignedTo: 'Manager Z',
        dueDate: '2025-03-25'
      }
    ],
    issues: [
      {
        id: 'I001',
        title: 'Missing client documentation',
        description: 'Some required documents not provided by client',
        priority: 'Medium',
        status: 'In Progress',
        reportedBy: 'Omar Saleh',
        assignedTo: 'Manager Z',
        reportedDate: '2025-03-10',
        resolution: 'Following up with client for missing documents'
      }
    ],
    changeRequests: [
      {
        id: 'CR001',
        title: 'Extended fieldwork period',
        description: 'Additional time needed for comprehensive analysis',
        type: 'Timeline',
        priority: 'High',
        status: 'Under Review',
        impact: 'Medium',
        submittedBy: 'Manager Z',
        submittedDate: '2025-03-12',
        estimatedCost: 8000,
        estimatedTime: 5
      }
    ],
    qualityMetrics: {
      projectId: 'P025003',
      codeQuality: 0,
      documentationQuality: 85,
      testingCoverage: 0,
      defectRate: 0,
      clientSatisfaction: 4.7,
      auditScore: 0,
      complianceScore: 90
    },
    stakeholderFeedback: [
      {
        id: 'SF001',
        stakeholderType: 'Client',
        stakeholderName: 'KPC Management',
        feedback: 'Very professional approach and clear communication',
        rating: 5,
        date: '2025-03-10',
        category: 'Communication'
      }
    ]
  }
]

// Sample Compliance Reports
export const complianceReports: ComplianceReport[] = [
  {
    id: 'CR-2025-Q1',
    period: 'QTD',
    year: 2025,
    quarter: 1,
    auditCompliance: 98,
    taxCompliance: 99,
    regulatoryCompliance: 97,
    internalPolicyCompliance: 96,
    riskAssessments: 12,
    trainingCompletions: 45,
    incidentReports: 2,
    correctiveActions: 8
  }
]

// Sample Resource Allocation
export const resourceAllocation: ResourceAllocation[] = [
  {
    employeeId: 'EMP001',
    period: 'MTD',
    year: 2025,
    month: 3,
    allocatedHours: 168,
    availableHours: 180,
    utilization: 93.3,
    projects: ['P025001', 'P024001', 'P025009'],
    skills: ['Audit', 'Internal Controls', 'Risk Assessment'],
    availability: 'Partially Available',
    nextAvailableDate: '2025-04-01'
  },
  {
    employeeId: 'EMP003',
    period: 'MTD',
    year: 2025,
    month: 3,
    allocatedHours: 175,
    availableHours: 180,
    utilization: 97.2,
    projects: ['P025003', 'P025006'],
    skills: ['Tax Advisory', 'VAT', 'Corporate Tax'],
    availability: 'Partially Available',
    nextAvailableDate: '2025-03-25'
  }
]

export const invoices: Invoice[] = [
  { invoiceId: 'INV-250301', projectId: 'P025003', clientId: 'C025003', amountKWD: 22000, issueDate: '2025-03-05', dueDate: '2025-04-05', paid: false },
  { invoiceId: 'INV-250210', projectId: 'P025006', clientId: 'C024001', amountKWD: 15000, issueDate: '2025-02-18', dueDate: '2025-03-18', paid: false },
  { invoiceId: 'INV-250115', projectId: 'P025001', clientId: 'C025001', amountKWD: 18000, issueDate: '2025-01-25', dueDate: '2025-02-25', paid: true },
]

export const proposals: Proposal[] = [
  { id: 'PR-01', clientName: 'Agility', serviceLine: 'Audit', stage: 'RFP', estValueKWD: 32000, dueDate: '2025-04-02' },
  { id: 'PR-02', clientName: 'Boubyan', serviceLine: 'Tax', stage: 'Submitted', estValueKWD: 28000 },
  { id: 'PR-03', clientName: 'Humansoft', serviceLine: 'Advisory', stage: 'Won', estValueKWD: 26000 },
  { id: 'PR-04', clientName: 'Zain Kuwait', serviceLine: 'Audit', stage: 'Lost', estValueKWD: 22000 },
]

export interface FinancialReport {
  id: string
  period: 'MTD' | 'QTD' | 'YTD'
  year: number
  month?: number
  quarter?: number
  totalRevenue: number
  totalExpenses: number
  grossProfit: number
  netProfit: number
  profitMargin: number
  revenueByService: { [key in ServiceLine]: number }
  expensesByCategory: { [key: string]: number }
  cashFlow: number
  outstandingInvoices: number
  overdueInvoices: number
}

export interface EmployeePerformance {
  employeeId: string
  employeeName: string
  grade: string
  department: 'Audit' | 'Tax' | 'Advisory' | 'Admin'
  period: 'MTD' | 'QTD' | 'YTD'
  year: number
  month?: number
  quarter?: number
  billableHours: number
  nonBillableHours: number
  utilization: number
  projectsWorked: number
  averageRating: number
  clientFeedback: string[]
  certifications: string[]
  trainingHours: number
  performanceScore: number
}

export interface ClientAnalytics {
  clientId: string
  totalProjects: number
  totalRevenue: number
  averageProjectValue: number
  projectSuccessRate: number
  clientSatisfaction: number
  retentionRate: number
  referralCount: number
  industry: string
  riskProfile: 'Low' | 'Medium' | 'High'
  lastEngagement: string
  nextReviewDate: string
  relationshipManager: string
}

export interface ProjectTracking {
  projectId: string
  milestones: Milestone[]
  risks: ProjectRisk[]
  issues: ProjectIssue[]
  changeRequests: ChangeRequest[]
  qualityMetrics: QualityMetrics
  stakeholderFeedback: StakeholderFeedback[]
}

export interface Milestone {
  id: string
  name: string
  description: string
  dueDate: string
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed'
  completionPercentage: number
  dependencies: string[]
  assignedTo: string
}

export interface ProjectRisk {
  id: string
  description: string
  probability: 'Low' | 'Medium' | 'High'
  impact: 'Low' | 'Medium' | 'High'
  status: 'Open' | 'Mitigated' | 'Closed'
  mitigationPlan: string
  assignedTo: string
  dueDate: string
}

export interface ProjectIssue {
  id: string
  title: string
  description: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed'
  reportedBy: string
  assignedTo: string
  reportedDate: string
  resolvedDate?: string
  resolution: string
}

export interface ChangeRequest {
  id: string
  title: string
  description: string
  type: 'Scope' | 'Timeline' | 'Budget' | 'Resource'
  priority: 'Low' | 'Medium' | 'High'
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected'
  impact: 'Low' | 'Medium' | 'High'
  submittedBy: string
  submittedDate: string
  approvedBy?: string
  approvedDate?: string
  estimatedCost: number
  estimatedTime: number
}

export interface QualityMetrics {
  projectId: string
  codeQuality: number
  documentationQuality: number
  testingCoverage: number
  defectRate: number
  clientSatisfaction: number
  auditScore: number
  complianceScore: number
}

export interface StakeholderFeedback {
  id: string
  stakeholderType: 'Client' | 'Internal' | 'Vendor'
  stakeholderName: string
  feedback: string
  rating: number
  date: string
  category: 'Communication' | 'Quality' | 'Timeline' | 'Budget' | 'Overall'
}

export interface ComplianceReport {
  id: string
  period: 'MTD' | 'QTD' | 'YTD'
  year: number
  month?: number
  quarter?: number
  auditCompliance: number
  taxCompliance: number
  regulatoryCompliance: number
  internalPolicyCompliance: number
  riskAssessments: number
  trainingCompletions: number
  incidentReports: number
  correctiveActions: number
}

export interface ResourceAllocation {
  employeeId: string
  period: 'MTD' | 'QTD' | 'YTD'
  year: number
  month?: number
  quarter?: number
  allocatedHours: number
  availableHours: number
  utilization: number
  projects: string[]
  skills: string[]
  availability: 'Available' | 'Partially Available' | 'Unavailable'
  nextAvailableDate: string
}


