# Data Seeding and Stakeholder Views Plan

## Purpose
This document details the mock data requirements and stakeholder-specific views for the COI prototype, ensuring each stakeholder sees relevant, realistic data for demonstration purposes.

---

## Mock Data Requirements

### 1. Employees (50 employees)

**Role Distribution**:
- 5 Directors
- 8 Compliance Officers
- 10 Partners
- 5 Finance Team members
- 5 Admin team members
- 17 Requesters (Team Members who report to Directors)

**Data Structure**:
```typescript
interface Employee {
  id: number;
  employee_id: string;        // e.g., "EMP-001"
  name: string;
  email: string;
  role: 'Director' | 'Compliance' | 'Partner' | 'Finance' | 'Admin' | 'Requester';
  department: string;          // Audit, Tax, Advisory, etc.
  director_id?: number;        // For team members
  user_groups: string[];      // For permissions
}
```

**Examples**:
- Director: "John Smith" (Audit Director)
- Compliance: "Jane Doe" (Compliance Officer)
- Partner: "Robert Johnson" (Partner - Tax)
- Finance: "Sarah Williams" (Finance Manager)
- Admin: "Michael Brown" (Admin Coordinator)
- Requester: "Emily Davis" (Team Member, reports to Director)

---

### 2. Clients (100 clients)

**Status Distribution**:
- 70 Active clients
- 20 Inactive clients
- 10 Potential clients

**Data Structure**:
```typescript
interface Client {
  id: number;
  client_code: string;        // e.g., "CLI-001"
  client_name: string;
  commercial_registration: string;
  status: 'Active' | 'Inactive' | 'Potential';
  industry: string;
  nature_of_business: string;
  parent_company_id?: number;  // For subsidiaries
}
```

**Fuzzy Matching Test Cases** (Include similar names):
1. "ABC Corporation" (Active)
2. "ABC Corp" (Active) - Similar to #1
3. "ABC Corp Ltd" (Active) - Similar to #1, #2
4. "XYZ Industries" (Active)
5. "XYZ Industry LLC" (Active) - Similar to #4
6. "Global Tech Solutions" (Active)
7. "Global Technology Solutions" (Active) - Similar to #6
8. "ABC Subsidiary Inc" (Active) - Parent: "ABC Corporation"
9. "New Client Ltd" (Active) - No similar matches
10. "Different Entity Corp" (Active) - No similar matches

**Purpose**: Test duplication detection algorithm with various similarity levels.

---

### 3. Active Projects (200 projects)

**Distribution**:
- 80 Assurance projects
- 50 Advisory projects
- 40 Tax projects
- 20 Accounting projects
- 10 Other projects

**Status Distribution**:
- 150 Active
- 30 Completed
- 20 On Hold

**Data Structure**:
```typescript
interface Project {
  id: number;
  project_id: string;          // e.g., "PROJ-2024-001"
  engagement_code: string;      // Links to COI
  client_code: string;
  service_type: string;
  service_year: number;
  status: 'Active' | 'Completed' | 'On Hold';
  start_date: Date;
  end_date?: Date;
}
```

**Purpose**:
- Show existing engagements in system
- Test duplication checks against active projects
- Demonstrate PRMS integration
- Show project history

---

### 4. Pending COI Requests (20 requests)

**Status Distribution**:
- 3 Draft (saved but not submitted)
- 2 Pending Director Approval
- 2 Pending Compliance Review (with duplication flags)
- 2 Pending Partner Approval
- 1 Pending Finance Coding
- 5 Approved (awaiting client response - in 30-day window)
- 5 Active Engagements (client approved, engagement letter issued)

**Stage Distribution**:
- 10 at Proposal Stage (Draft → Finance)
- 10 at Engagement Stage (Approved → Active)

**Data Structure**:
```typescript
interface COIRequest {
  id: number;
  request_id: string;          // e.g., "COI-2025-001"
  client_id: number;
  requester_id: number;
  service_description: string;
  service_type: string;
  status: string;
  stage: 'Proposal' | 'Engagement';
  director_approval_status: 'Pending' | 'Approved' | 'Rejected';
  compliance_review_status: 'Pending' | 'Approved' | 'Rejected' | 'Request Info';
  partner_approval_status: 'Pending' | 'Approved' | 'Rejected';
  finance_code_status: 'Pending' | 'Generated';
  engagement_code?: string;
  created_at: Date;
  updated_at: Date;
}
```

**Specific Examples**:

**Request 1 - Duplication Flag (High Match)**:
- Client: "ABC Corp"
- Existing: "ABC Corporation" (85% match)
- Status: Pending Compliance Review
- Flag: High confidence duplication

**Request 2 - Duplication Flag (Medium Match)**:
- Client: "XYZ Industry LLC"
- Existing: "XYZ Industries" (80% match)
- Status: Pending Compliance Review
- Flag: Medium confidence duplication

**Request 3 - No Duplication**:
- Client: "New Client Ltd"
- Existing: None
- Status: Pending Compliance Review
- Flag: No matches

**Request 4 - Parent/Subsidiary**:
- Client: "ABC Subsidiary Inc"
- Existing: "ABC Corporation" (parent, 70% match + relationship)
- Status: Pending Compliance Review
- Flag: Parent relationship detected

---

## Stakeholder-Specific Views

### 1. Requester (Director/Team Member)

**Dashboard View**:
```
┌─────────────────────────────────────────┐
│ My COI Requests                         │
├─────────────────────────────────────────┤
│ Total Requests: 6                       │
│ ├─ Draft: 1                             │
│ ├─ Pending Approval: 2                  │
│ ├─ Under Review: 1                      │
│ ├─ Approved: 1                         │
│ └─ Active: 1                            │
│                                         │
│ Recent Activity                         │
│ ├─ COI-2025-015 (Pending Compliance)    │
│ ├─ COI-2025-012 (Approved)             │
│ └─ COI-2025-008 (Active)                │
└─────────────────────────────────────────┘
```

**What They See**:
- **My Requests**: 5-8 requests (their own requests only)
- **Status Breakdown**: Visual chart showing status distribution
- **Recent Activity**: Last 5 requests with status
- **Pending Actions**: Requests needing their attention
- **Create New Request**: Button to start new request

**Client Selection**:
- Dropdown with 100 clients
- Search/filter functionality
- Shows: Client Code, Client Name, Status
- "Request New Client" option at bottom
- Recent clients used (last 5)

**Data Needed**:
- 5-8 COI requests assigned to this requester
- Mix of statuses (Draft, Pending, Approved, Active)
- All 100 clients available for selection
- Service type options
- Employee list for signatories

---

### 2. Compliance Officer

**Dashboard View**:
```
┌─────────────────────────────────────────┐
│ Compliance Review Queue                 │
├─────────────────────────────────────────┤
│ Pending Reviews: 6                      │
│                                         │
│ ┌───────────────────────────────────┐ │
│ │ COI-2025-018                        │ │
│ │ Client: ABC Corp                    │ │
│ │ ⚠️ DUPLICATION ALERT                │ │
│ │ Match: ABC Corporation (85%)       │ │
│ │ [View Details] [Approve] [Reject]   │ │
│ └───────────────────────────────────┘ │
│                                         │
│ ┌───────────────────────────────────┐ │
│ │ COI-2025-017                        │ │
│ │ Client: XYZ Industry LLC           │ │
│ │ ⚠️ DUPLICATION ALERT                │ │
│ │ Match: XYZ Industries (80%)        │ │
│ │ [View Details] [Approve] [Reject]   │ │
│ └───────────────────────────────────┘ │
│                                         │
│ ┌───────────────────────────────────┐ │
│ │ COI-2025-016                        │ │
│ │ Client: New Client Ltd             │ │
│ │ ✓ No Duplications                  │ │
│ │ [View Details] [Approve] [Reject]   │ │
│ └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**What They See**:
- **Pending Reviews**: 5-7 requests awaiting compliance review
- **Duplication Alerts**: Visual indicators for matches
  - 🔴 High confidence (90%+) - Blocked
  - 🟡 Medium confidence (75-89%) - Flagged
  - 🟢 Low confidence (<75%) - No flag
- **Match Details**: 
  - Match score percentage
  - Existing engagement details
  - Similarity reason
  - Parent/subsidiary relationships
- **Review Actions**: Approve, Reject, Request More Info
- **Justification Field**: Required for overrides

**Fuzzy Matching Examples** (What Compliance Sees):

**Example 1 - High Match (Blocked)**:
```
Request: "ABC Corp"
Existing: "ABC Corporation"
Match Score: 85%
Similarity: Very close match, likely same entity
Action: BLOCKED - Requires justification to proceed
```

**Example 2 - Medium Match (Flagged)**:
```
Request: "XYZ Industry LLC"
Existing: "XYZ Industries"
Match Score: 80%
Similarity: Similar name, may be related
Action: FLAGGED - Review required
```

**Example 3 - Parent/Subsidiary**:
```
Request: "ABC Subsidiary Inc"
Existing: "ABC Corporation" (Parent)
Match Score: 70% + Parent Relationship
Similarity: Subsidiary of existing client
Action: FLAGGED - Parent relationship detected
```

**Example 4 - No Match**:
```
Request: "New Client Ltd"
Existing: None
Match Score: 0%
Similarity: No matches found
Action: CLEAR - No duplications
```

**Data Needed**:
- 5-7 requests in "Pending Compliance" status
- Duplication matches for each (with scores and details)
- Existing engagements for comparison
- Global clearance statuses (for International Operations)
- Review history

---

### 3. Partner

**Dashboard View**:
```
┌─────────────────────────────────────────┐
│ Partner Dashboard                       │
├─────────────────────────────────────────┤
│ Pending Approvals: 4                    │
│ Active Proposals: 45                    │
│ Active Engagements: 32                  │
│                                         │
│ ┌───────────────────────────────────┐ │
│ │ COI-2025-014 (Pending Approval)    │ │
│ │ Client: Global Tech Solutions      │ │
│ │ Compliance: ✓ Approved            │ │
│ │ [Approve] [Reject] [Request Info]  │ │
│ └───────────────────────────────────┘ │
│                                         │
│ Engagement Codes                        │
│ ├─ ENG-2025-TAX-00142 (Active)         │
│ ├─ ENG-2025-AUD-00098 (Active)        │
│ └─ ...                                 │
│                                         │
│ Renewal Alerts                          │
│ ├─ 3 engagements expiring in 90 days   │
│ └─ 1 engagement expiring in 60 days    │
└─────────────────────────────────────────┘
```

**What They See**:
- **Pending Approvals**: 3-5 requests awaiting partner approval
- **All Active Proposals**: Complete list of approved proposals
- **All Active Engagements**: Complete list of active engagements
- **Engagement Codes**: All codes generated
- **Group-Level Services**: Services across related entities
- **Red Flags**: Conflicts, restrictions, issues
- **Expiry/Renewal Alerts**: Engagements approaching 3-year renewal

**Data Needed**:
- 3-5 requests in "Pending Partner" status
- All approved requests (for tracking)
- All engagement codes generated
- Renewal alerts (if any approaching 3-year mark)
- Group-level service summaries

---

### 4. Finance Team

**Dashboard View**:
```
┌─────────────────────────────────────────┐
│ Finance Coding Queue                    │
├─────────────────────────────────────────┤
│ Pending Coding: 3                       │
│                                         │
│ ┌───────────────────────────────────┐ │
│ │ COI-2025-013                       │ │
│ │ Client: ABC Corporation            │ │
│ │ Service: Tax Advisory              │ │
│ │ [Enter Financial Params] [Generate]│ │
│ └───────────────────────────────────┘ │
│                                         │
│ Generated Codes (This Month)            │
│ ├─ ENG-2025-TAX-00142                  │
│ ├─ ENG-2025-AUD-00098                  │
│ └─ ENG-2025-ADV-00056                  │
└─────────────────────────────────────────┘
```

**What They See**:
- **Pending Coding**: 2-3 requests awaiting finance coding
- **Financial Parameters Entry**:
  - Credit terms
  - Currency
  - Risk assessment
  - Pending amounts (if any)
- **Engagement Code Generation**:
  - Service type abbreviation
  - Year
  - Sequential number
  - Generated code display
- **Code History**: Recently generated codes

**Data Needed**:
- 2-3 requests in "Pending Finance" status
- Financial parameters to enter
- Engagement code sequence numbers (for generation)
- Client financial history (mock data)

---

### 5. Admin Team

**Dashboard View**:
```
┌─────────────────────────────────────────┐
│ Admin Dashboard                         │
├─────────────────────────────────────────┤
│ Execution Queue: 7                      │
│                                         │
│ ┌───────────────────────────────────┐ │
│ │ COI-2025-012 (Approved)            │ │
│ │ Client: XYZ Industries             │ │
│ │ Engagement Code: ENG-2025-TAX-00142│ │
│ │ [Execute Proposal] [Issue Letter]  │ │
│ └───────────────────────────────────┘ │
│                                         │
│ 30-Day Monitoring                       │
│ ├─ 2 requests approaching limit (20 days)│
│ ├─ 3 requests in monitoring (10 days)   │
│ └─ 2 requests awaiting client response  │
│                                         │
│ ISQM Forms                              │
│ ├─ 5 forms completed                   │
│ └─ 2 forms pending                     │
└─────────────────────────────────────────┘
```

**What They See**:
- **Execution Queue**: 5-7 requests in execution phase
- **Proposal Execution**:
  - Execution date entry
  - Proposal document upload
  - Client communication tracking
- **30-Day Monitoring**:
  - Requests in monitoring window
  - Days remaining
  - Alerts for approaching limit (every 10 days)
- **Engagement Letter**:
  - Preparation and issuance
  - ISQM forms completion
  - Status updates
- **Client Response Tracking**:
  - Approved (sign back)
  - Rejected
  - Lapsed (30 days)

**Data Needed**:
- 5-7 requests in "Approved" or "Active" status
- Execution dates (some approaching 30-day limit)
- ISQM forms (some completed, some pending)
- Client response statuses

---

### 6. Super Admin

**Dashboard View**:
```
┌─────────────────────────────────────────┐
│ System Overview                         │
├─────────────────────────────────────────┤
│ Total Requests: 20                      │
│ Total Clients: 100                      │
│ Total Employees: 50                     │
│ Active Projects: 200                    │
│                                         │
│ Request Status Breakdown                │
│ ├─ Draft: 3                            │
│ ├─ Pending: 8                          │
│ ├─ Approved: 5                         │
│ └─ Active: 4                           │
│                                         │
│ System Statistics                       │
│ ├─ Average approval time: 5.2 days    │
│ ├─ Duplication detection rate: 15%     │
│ └─ Engagement codes generated: 142     │
└─────────────────────────────────────────┘
```

**What They See**:
- **System Overview**: All data, all statuses
- **Statistics**: System-wide metrics
- **User Management**: All 50 employees
- **Configuration**: System settings
- **Audit Logs**: All system activities

**Data Needed**:
- All 20 pending COI requests
- All 200 active projects
- All 100 clients
- All 50 employees
- System statistics and metrics

---

## Fuzzy Matching Implementation

### Algorithm: Levenshtein Distance

```typescript
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 100;
  
  const distance = levenshteinDistance(
    longer.toLowerCase(),
    shorter.toLowerCase()
  );
  
  return ((longer.length - distance) / longer.length) * 100;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}
```

### Match Thresholds

- **90%+**: High confidence - Block submission
- **75-89%**: Medium confidence - Flag for review
- **<75%**: Low confidence - No action needed

### Additional Checks

1. **Abbreviation Matching**:
   - "Corp" = "Corporation"
   - "Ltd" = "Limited"
   - "Inc" = "Incorporated"
   - "LLC" = "Limited Liability Company"

2. **Parent/Subsidiary Detection**:
   - Check parent_company_id field
   - Flag if parent has active engagement
   - Show relationship in match details

3. **Common Words Removal**:
   - Remove common words: "The", "A", "An", "And", "Or"
   - Focus on unique identifiers

---

## Data Seeding Script Structure

```typescript
// scripts/seedData.ts

export const seedData = {
  // 50 employees
  employees: generateEmployees(50),
  
  // 100 clients (with fuzzy matching test cases)
  clients: generateClients(100),
  
  // 200 active projects
  projects: generateProjects(200),
  
  // 20 pending COI requests
  coiRequests: generateCOIRequests(20),
  
  // Link relationships
  relationships: {
    // Assign requesters to directors
    directorAssignments: assignTeamMembers(),
    
    // Link projects to clients and engagement codes
    projectLinks: linkProjects(),
    
    // Create parent/subsidiary relationships
    clientRelationships: createClientRelationships(),
  }
};

function generateEmployees(count: number): Employee[] {
  const roles = ['Director', 'Compliance', 'Partner', 'Finance', 'Admin', 'Requester'];
  const departments = ['Audit', 'Tax', 'Advisory', 'Accounting'];
  
  // Generate employees with proper role distribution
  // ...
}

function generateClients(count: number): Client[] {
  // Include fuzzy matching test cases:
  // - ABC Corporation, ABC Corp, ABC Corp Ltd
  // - XYZ Industries, XYZ Industry LLC
  // - Global Tech Solutions, Global Technology Solutions
  // - ABC Subsidiary Inc (parent: ABC Corporation)
  // ...
}

function generateCOIRequests(count: number): COIRequest[] {
  // Distribute across statuses:
  // - 3 Draft
  // - 2 Pending Director Approval
  // - 2 Pending Compliance (with duplication flags)
  // - 2 Pending Partner
  // - 1 Pending Finance
  // - 5 Approved (30-day window)
  // - 5 Active
  // ...
}
```

---

## Stakeholder Demo Flow

### Demo Scenario 1: Requester Creates Request with Duplication

1. **Requester logs in**
   - Sees dashboard with 6 requests
   - Clicks "Create New Request"

2. **Selects Client**
   - Types "ABC" in search
   - Sees: "ABC Corporation", "ABC Corp", "ABC Corp Ltd"
   - Selects "ABC Corp"

3. **Fills Form**
   - Enters service description
   - Adds signatories
   - Submits request

4. **Director Approval** (if team member)
   - Director sees notification
   - Approves request

5. **Compliance Review**
   - Compliance Officer sees request
   - System flags: "ABC Corp" matches "ABC Corporation" (85%)
   - Shows existing engagement details
   - Compliance reviews and approves with justification

### Demo Scenario 2: Compliance Reviews Multiple Duplications

1. **Compliance Officer logs in**
   - Sees 6 pending reviews
   - 3 have duplication flags

2. **Reviews First Flagged Request**
   - "ABC Corp" → "ABC Corporation" (85% - High)
   - Reviews existing engagement
   - Approves with justification: "Different division"

3. **Reviews Second Flagged Request**
   - "XYZ Industry LLC" → "XYZ Industries" (80% - Medium)
   - Reviews existing engagement
   - Requests more information

4. **Reviews Third Request**
   - "New Client Ltd" → No matches
   - Approves immediately

### Demo Scenario 3: End-to-End Workflow

1. **Requester** creates request
2. **Director** approves (if needed)
3. **Compliance** reviews (with duplication check)
4. **Partner** approves
5. **Finance** generates Engagement Code
6. **Admin** executes proposal
7. **PRMS** validates code (mock) and creates project

---

## Implementation Priority

### Phase 1: Core Data (Week 1)
- [ ] Seed 50 employees
- [ ] Seed 100 clients (with fuzzy matching cases)
- [ ] Seed 200 projects
- [ ] Seed 20 COI requests (basic)

### Phase 2: Relationships (Week 1)
- [ ] Link employees (director assignments)
- [ ] Link projects to clients
- [ ] Create parent/subsidiary relationships
- [ ] Assign COI requests to employees

### Phase 3: Fuzzy Matching (Week 2)
- [ ] Implement Levenshtein algorithm
- [ ] Create duplication test cases
- [ ] Link duplications to COI requests
- [ ] Display in Compliance dashboard

### Phase 4: Stakeholder Views (Week 2)
- [ ] Requester dashboard (filtered data)
- [ ] Compliance dashboard (with duplication alerts)
- [ ] Partner dashboard
- [ ] Finance dashboard
- [ ] Admin dashboard
- [ ] Super Admin dashboard

---

## Related Documents

- Prototype Plan: `COI System /Prototype_Plan.md`
- User Journeys: `COI System /User_Journeys_End_to_End.md`
- Risk Analysis: `COI System /Risk_Analysis_and_Failure_Points.md`


