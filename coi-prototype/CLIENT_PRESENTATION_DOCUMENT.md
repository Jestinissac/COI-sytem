# COI System Prototype - Client Presentation Document

**Prepared for:** BDO Al Nisf & Partners  
**Project:** Conflict of Interest (COI) Management System  
**Document Type:** Prototype Scope and Workflow Documentation  
**Date:** January 2025

---

## Executive Summary

This document outlines the Conflict of Interest (COI) Management System prototype, designed to streamline and govern the process of managing client engagements, proposals, and conflict checks across all departments (Audit, Tax, Advisory, Accounting). The prototype demonstrates the complete end-to-end workflow from initial request creation through engagement activation, with strict department-based data segregation and role-based access control.

**Key Objectives:**
- Demonstrate complete COI workflow automation
- Showcase department-based data segregation
- Validate integration points with PRMS and HRMS
- Provide a functional prototype for stakeholder review and feedback

---

## 1. System Overview

### 1.1 Purpose

The COI System serves as an upstream governance gatekeeper for PRMS (Project Resource Management System), ensuring that:
- All client engagements undergo proper conflict of interest checks
- Department-based data segregation is enforced
- Approval workflows are followed before project creation
- Engagement codes are generated and validated before PRMS project setup

### 1.2 Integration Architecture

```
┌─────────────┐
│   HRMS      │ → User Management, Roles, Permissions
└─────────────┘
      ↓
┌─────────────┐
│   COI       │ → Conflict Checks, Approvals, Engagement Codes
│   System    │
└─────────────┘
      ↓
┌─────────────┐
│   PRMS      │ → Project Creation (validated by Engagement Code)
└─────────────┘
```

**Integration Flow:**
1. **HRMS** provides user data, roles, and permissions
2. **COI System** performs conflict checks and generates engagement codes
3. **PRMS** validates engagement codes before allowing project creation

---

## 2. End-to-End Workflow

### 2.1 Complete Request Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    COI REQUEST LIFECYCLE                         │
└─────────────────────────────────────────────────────────────────┘

1. REQUEST CREATION
   ├─ Requester creates COI request
   ├─ Fills complete COI template form (Sections A-G)
   ├─ Selects client (or requests new client)
   ├─ Adds service details and signatories
   └─ Saves as draft or submits

2. DIRECTOR APPROVAL (if team member)
   ├─ Director reviews team member request
   ├─ Approves or rejects
   └─ Request moves to Compliance

3. COMPLIANCE REVIEW
   ├─ System performs automatic duplication check
   ├─ Flags potential conflicts (fuzzy matching)
   ├─ Compliance Officer reviews matches
   ├─ Approves, rejects, or requests more information
   └─ Request moves to Partner

4. PARTNER APPROVAL
   ├─ Partner reviews compliance decision
   ├─ Approves or rejects
   └─ Request moves to Finance

5. FINANCE CODING
   ├─ Finance enters financial parameters
   ├─ System generates Engagement Code (ENG-YYYY-SVC-#####)
   └─ Request status: Approved

6. ADMIN EXECUTION
   ├─ Admin executes proposal
   ├─ Issues engagement letter
   ├─ Updates ISQM forms
   └─ Monitors 30-day window

7. PRMS INTEGRATION
   ├─ Engagement Code validated in PRMS
   ├─ Project created with valid code
   └─ Status: Active
```

### 2.2 Detailed Workflow Steps

#### Phase 1: Request Initiation

**Actor:** Requester (Director, Manager, Team Member)

1. **Login & Navigation**
   - User logs into unified platform
   - Sees multi-system landing page (HRMS, PRMS, COI)
   - Clicks "COI System" tile
   - Redirected to role-specific dashboard

2. **Create New Request**
   - Clicks "Create New Request"
   - System displays complete COI template form
   - Form sections:
     - **Section A:** Requestor Information (Name, Designation, Entity, Line of Service)
     - **Section B:** Document Information (Proposal/Engagement Letter, Language)
     - **Section C:** Client Information (Client Name, Parent Company, Location, Type, Regulated Body)
     - **Section D:** Service Information (Service Type, Description, Period)
     - **Section E:** Ownership & Structure (Ownership Structure, PIE Status)
     - **Section F:** Signatory Details (Dynamic list of signatories)
     - **Section G:** International Operations (Global clearance status)

3. **Client Selection**
   - Dropdown shows 100+ clients from PRMS Client Master
   - Searchable client list
   - Option to "Request New Client" (creates client request for PRMS Admin)
   - Can save draft while waiting for new client

4. **Form Submission**
   - Validates all mandatory fields
   - Checks for director approval requirement (if team member)
   - Saves request with status: "Draft" or "Pending Director Approval"

#### Phase 2: Director Approval (Team Members Only)

**Actor:** Director

1. **Dashboard View**
   - Sees "Pending Approvals" section
   - Lists all team member requests from their department
   - Shows request details: Request ID, Client, Requester Name

2. **Review & Decision**
   - Clicks "View Details" to see full request
   - Reviews all form sections
   - Clicks "Approve" or "Reject"
   - Optional: Adds approval notes
   - System updates status to "Pending Compliance"

**Note:** Directors creating their own requests skip this step (auto-approved)

#### Phase 3: Compliance Review

**Actor:** Compliance Officer

1. **Review Queue**
   - Sees all pending requests from all departments
   - **No commercial data visible** (pricing, fees excluded)
   - Sees duplication alerts with match scores

2. **Automatic Duplication Detection**
   - System performs fuzzy matching on client names
   - Algorithm: Levenshtein Distance with abbreviation normalization
   - Match thresholds:
     - **90-100%:** Block (high confidence duplicate)
     - **75-89%:** Flag (medium confidence, requires review)
     - **<75%:** No action

3. **Review Process**
   - Reviews flagged duplications
   - Sees existing engagement details (if match found)
   - Decides:
     - **Approve:** Request proceeds (with optional justification)
     - **Reject:** Request blocked
     - **Request Info:** Returns to Requester for more information

4. **Global Clearance (if applicable)**
   - Updates Global COI clearance status
   - Uploads Excel for Global COI portal
   - Tracks verification

5. **Status Update**
   - System updates status to "Pending Partner"

#### Phase 4: Partner Approval

**Actor:** Partner

1. **Dashboard View**
   - Sees all pending requests from all departments
   - Full visibility (including commercial data)
   - Sees compliance decision and notes

2. **Review & Decision**
   - Reviews compliance decision
   - Reviews full request details
   - Clicks "Approve" or "Reject"
   - System updates status to "Pending Finance"

#### Phase 5: Finance Coding

**Actor:** Finance Team

1. **Coding Queue**
   - Sees approved requests pending engagement code generation
   - Views financial parameters section

2. **Generate Engagement Code**
   - Enters financial parameters:
     - Credit terms
     - Currency (KWD, USD, EUR)
     - Risk assessment
   - Clicks "Generate Engagement Code"
   - System generates code: `ENG-YYYY-SVC-#####`
     - Format: `ENG-2025-TAX-00142`
     - Components: Year, Service Type Abbreviation, Sequential Number
   - Code saved and linked to request
   - Status updated to "Approved"

#### Phase 6: Admin Execution

**Actor:** Admin Team

1. **Execution Queue**
   - Sees approved requests ready for execution
   - Views engagement codes

2. **Proposal Execution**
   - Updates execution date
   - Uploads proposal document
   - Tracks client communication

3. **Engagement Letter**
   - Prepares engagement letter
   - Uploads signed letter
   - Updates status to "Active"

4. **ISQM Forms**
   - Completes digital ISQM forms
   - Or uploads PDF forms
   - Tracks completion status

5. **30-Day Monitoring**
   - System tracks requests in 30-day monitoring window
   - Sends alerts at 10-day intervals
   - Updates final status (Approved/Rejected/Lapsed)

#### Phase 7: PRMS Integration

**Actor:** Project Manager / PRMS User

1. **Project Creation in PRMS**
   - User attempts to create project in PRMS
   - Enters Engagement Code: `ENG-2025-TAX-00142`
   - System validates:
     - Code exists in COI system
     - Code status is "Active"
     - Code not expired
   - If valid: Project created successfully
   - If invalid: Project creation blocked

2. **Database Constraint Enforcement**
   - Foreign key constraint ensures only valid engagement codes
   - CHECK constraint ensures only active codes
   - Prevents bypass of COI workflow

---

## 3. Scope of Work

### 3.1 Prototype Scope

#### 3.1.1 Core Features Included

✅ **Authentication & Authorization**
- Multi-system landing page (HRMS, PRMS, COI)
- Role-based access control
- JWT token management
- Mock authentication (accepts any password for prototype)

✅ **COI Request Management**
- Complete COI template form (all sections A-G)
- All dropdowns with options from COI Template PDF
- Conditional field logic (Parent Company, International Operations)
- Form validation
- Save as draft functionality
- Request submission

✅ **Approval Workflows**
- Director approval (for team members)
- Compliance review with duplication detection
- Partner approval
- Finance engagement code generation
- Admin execution and monitoring

✅ **Data Segregation**
- Department-based filtering (Audit, Tax, Advisory, Accounting, Other)
- Role-based access rules:
  - **Requester:** Own requests only, same department
  - **Director:** Own + team member requests, same department
  - **Compliance:** All departments, no commercial data
  - **Partner:** All departments, full visibility
  - **Finance:** All departments, financial data access
  - **Admin:** All departments, execution access
  - **Super Admin:** No restrictions

✅ **Duplication Detection**
- Fuzzy matching algorithm (Levenshtein Distance)
- Abbreviation normalization (Corp → Corporation, Ltd → Limited)
- Match scoring (75-89% flag, 90%+ block)
- Visual alerts in Compliance dashboard

✅ **Engagement Code Generation**
- Automatic code generation: `ENG-YYYY-SVC-#####`
- Service type abbreviations (TAX, AUD, ADV, ACC, OTH)
- Sequential numbering per service type
- Code validation in PRMS (mock)

✅ **Dashboards & Reporting**
- Role-specific dashboards
- Status breakdowns
- Department statistics
- Request filtering
- Export capabilities (structure ready)

✅ **Client Management**
- Client selection from PRMS Client Master (mock)
- New client request workflow
- Client search and filtering

#### 3.1.2 Integration Points (Mocked)

🔶 **HRMS Integration**
- User data: Mocked (50 employees seeded)
- Roles and permissions: Mocked
- Employee master: Mocked
- **Production:** Will integrate with SQL Server Enterprise Edition

🔶 **PRMS Integration**
- Client Master: Mocked (100 clients seeded)
- Engagement Code validation: Mocked
- Project creation: Mocked
- **Production:** Will integrate with live PRMS system

🔶 **Email/Notification System**
- Email templates: Structure ready
- Notification logic: Implemented
- **Production:** Will integrate with O365/Exchange

### 3.2 Prototype Limitations

⚠️ **Mock Data**
- All data is seeded/mocked for demonstration
- No real HRMS/PRMS integration
- No actual email sending (logged to console)

⚠️ **Authentication**
- Accepts any password (prototype only)
- No password complexity requirements
- No password reset functionality

⚠️ **Database**
- Uses SQLite (prototype)
- **Production:** Will use SQL Server Enterprise Edition

⚠️ **File Uploads**
- Structure ready but files stored in database (prototype)
- **Production:** Will use proper file storage system

⚠️ **Reports**
- Dashboard structure and filtering ready
- PDF/Excel export structure ready
- **Production:** Will implement full export functionality

⚠️ **Advanced Features**
- No email notifications (structure ready)
- No audit trail export (structure ready)
- No advanced analytics (basic stats only)

---

## 4. Prototype Data

### 4.1 Seeded Data

#### 4.1.1 Users (50 Employees)

**Distribution by Department:**
- **Audit:** 15 employees
  - 3 Directors
  - 2 Compliance Officers
  - 3 Partners
  - 1 Finance
  - 1 Admin
  - 5 Requesters
- **Tax:** 12 employees
  - 2 Directors
  - 2 Compliance Officers
  - 2 Partners
  - 1 Finance
  - 1 Admin
  - 4 Requesters
- **Advisory:** 10 employees
  - 1 Director
  - 2 Compliance Officers
  - 2 Partners
  - 1 Finance
  - 1 Admin
  - 3 Requesters
- **Accounting:** 8 employees
  - 1 Director
  - 1 Compliance Officer
  - 2 Partners
  - 1 Finance
  - 1 Admin
  - 2 Requesters
- **Other:** 5 employees
  - 1 Director
  - 1 Compliance Officer
  - 1 Partner
  - 1 Finance
  - 1 Admin (Super Admin)

**Director-Team Relationships:**
- Directors have team members assigned
- Team members require director approval for requests

#### 4.1.2 Clients (100 Clients)

**Distribution:**
- 70 Active clients
- 20 Inactive clients
- 10 Potential clients

**Fuzzy Matching Test Cases:**
- "ABC Corporation" vs "ABC Corp" (85% match - flagged)
- "XYZ Industries" vs "XYZ Industry LLC" (80% match - flagged)
- "Global Tech Solutions" vs "Global Technology Solutions" (90% match - blocked)
- "ABC Subsidiary Inc" (parent: ABC Corporation)
- "New Client Ltd" (no matches)

#### 4.1.3 Projects (200 Projects)

**Distribution:**
- 150 Active projects
- 30 Completed projects
- 20 On Hold projects

**Engagement Codes:**
- Format: `ENG-2024-SVC-#####`
- Service types: TAX, AUD, ADV, ACC, OTH
- Linked to COI requests (mock validation)

#### 4.1.4 COI Requests (20 Requests)

**Distribution by Department:**
- Audit: 8 requests
- Tax: 6 requests
- Advisory: 4 requests
- Accounting: 2 requests

**Status Distribution:**
- 3 Draft
- 2 Pending Director Approval
- 2 Pending Compliance
- 2 Pending Partner
- 1 Pending Finance
- 5 Approved
- 5 Active

**Stages:**
- Proposal: 10 requests
- Engagement: 10 requests

### 4.2 Test Scenarios

#### Scenario 1: Requester Creates Request with Duplication
1. Requester logs in (e.g., `patricia.white@company.com`)
2. Creates new COI request
3. Selects client "ABC Corp"
4. System flags: "ABC Corp" matches "ABC Corporation" (85% match)
5. Request submitted → Pending Director Approval
6. Director approves → Pending Compliance
7. Compliance sees duplication alert, reviews, approves with justification

#### Scenario 2: Team Member Requires Director Approval
1. Team member creates request
2. Submits request
3. Status: "Pending Director Approval"
4. Director sees in dashboard
5. Director approves
6. Status: "Pending Compliance"

#### Scenario 3: Compliance Reviews Multiple Departments
1. Compliance Officer logs in
2. Sees requests from all departments (Audit, Tax, Advisory, Accounting)
3. No commercial data visible (pricing, fees hidden)
4. Reviews duplication alerts
5. Approves/rejects with notes

#### Scenario 4: Finance Generates Engagement Code
1. Finance logs in
2. Sees approved request pending coding
3. Enters financial parameters (credit terms, currency)
4. Clicks "Generate Engagement Code"
5. System generates: `ENG-2025-TAX-00142`
6. Code saved and linked to request

#### Scenario 5: PRMS Validation (Mock)
1. User attempts to create project in PRMS (mock)
2. Enters Engagement Code: `ENG-2025-TAX-00142`
3. System validates code exists and is Active
4. Project created successfully
5. Invalid code → Blocked by database constraint

---

## 5. User Roles and Permissions

### 5.1 Role Definitions

| Role | Department Access | Data Visibility | Key Actions |
|------|------------------|----------------|-------------|
| **Requester** | Own department only | Own requests only | Create, view, edit draft requests |
| **Director** | Own department | Own + team member requests | Approve team requests, create own requests |
| **Compliance** | All departments | All requests (no commercial data) | Review, approve/reject, flag duplications |
| **Partner** | All departments | All requests (full visibility) | Final approval, oversight |
| **Finance** | All departments | All requests (financial data) | Generate engagement codes |
| **Admin** | All departments | All requests | Execute proposals, manage 30-day monitoring |
| **Super Admin** | All departments | All data (no restrictions) | System configuration, user management |

### 5.2 Data Segregation Rules

**Strict Segregation (Requester):**
- Can only see requests they personally created
- Limited to their department
- Cannot see other requesters' requests

**Department Segregation (Director):**
- Sees own requests
- Sees team member requests (same department)
- Cannot see other departments

**Cross-Department (Compliance, Partner, Finance, Admin):**
- Sees all departments
- Compliance: No commercial data
- Others: Full visibility

---

## 6. Technical Architecture

### 6.1 Technology Stack

**Frontend:**
- Vue 3 with TypeScript
- Tailwind CSS (BDO-inspired design)
- Pinia (state management)
- Vue Router (routing)
- Vite (build tool)

**Backend:**
- Node.js with Express
- SQLite (prototype database)
- JWT authentication
- RESTful API

**Database:**
- SQLite (prototype)
- **Production:** SQL Server Enterprise Edition

### 6.2 Key Features

**Dynamic Field Configuration:**
- COI template fields stored in database
- Can add/modify fields without code changes
- Conditional field logic configurable

**Fuzzy Matching:**
- Application-level algorithm (Levenshtein Distance)
- Smart database filtering for performance
- Caching support (structure ready)

**Engagement Code Generation:**
- Automatic sequential numbering
- Service type-based prefixes
- Year-based organization

---

## 7. Prototype Demonstration Plan

### 7.1 Demo Flow

1. **Login & Navigation** (5 minutes)
   - Show multi-system landing page
   - Login as different user roles
   - Navigate to COI system

2. **Requester Journey** (10 minutes)
   - Create new COI request
   - Fill complete form (all sections)
   - Show client selection
   - Submit request
   - View own dashboard (strict segregation)

3. **Director Journey** (5 minutes)
   - View pending approvals
   - Approve team member request
   - View department requests

4. **Compliance Journey** (10 minutes)
   - View review queue (all departments)
   - See duplication alerts
   - Review and approve requests
   - Show no commercial data visibility

5. **Partner Journey** (5 minutes)
   - View all pending requests
   - Approve requests
   - View engagement codes

6. **Finance Journey** (5 minutes)
   - Generate engagement codes
   - Enter financial parameters
   - View generated codes

7. **Admin Journey** (5 minutes)
   - Execute proposals
   - View 30-day monitoring
   - Manage ISQM forms

8. **Data Segregation Demo** (5 minutes)
   - Login as different roles
   - Show department-based filtering
   - Demonstrate access restrictions

### 7.2 Key Points to Highlight

✅ **Complete Workflow:** End-to-end from request to engagement activation  
✅ **Data Segregation:** Strict department-based access control  
✅ **Duplication Detection:** Automatic conflict identification  
✅ **Approval Workflows:** Multi-stage approval process  
✅ **Integration Ready:** Structure for HRMS/PRMS integration  
✅ **Scalable Architecture:** Ready for production deployment

---

## 8. Next Steps

### 8.1 Post-Prototype

1. **Stakeholder Feedback**
   - Gather feedback from all user roles
   - Identify gaps or additional requirements
   - Prioritize enhancements

2. **Production Planning**
   - Technical team: SQL Server procedures
   - Frontend team: Vue.js production build
   - Integration team: HRMS/PRMS connections
   - Security team: Authentication and authorization

3. **Production Deployment**
   - Database migration (SQLite → SQL Server)
   - Integration with HRMS (SQL Server Enterprise Edition)
   - Integration with PRMS (Client Master, Engagement Code validation)
   - Email integration (O365/Exchange)
   - File storage system
   - Security hardening

### 8.2 Timeline

- **Prototype:** Complete and ready for demonstration
- **Feedback Collection:** 1-2 weeks
- **Production Development:** 6-8 weeks (estimated)
- **Testing & Deployment:** 2-3 weeks (estimated)

---

## 9. Contact & Support

For questions, feedback, or clarifications regarding the prototype:

- **Technical Questions:** [Technical Contact]
- **Workflow Questions:** [Business Analyst Contact]
- **Demo Scheduling:** [Project Manager Contact]

---

## Appendix A: COI Template Sections

### Section A: Requestor Information
- Requestor Name (auto-filled)
- Designation (Director, Partner, Manager, Senior Manager, Other)
- Entity (BDO Al Nisf & Partners)
- Line of Service (Audit & Assurance, Advisory, Tax, Accounting, Other Regulated Services)

### Section B: Document Information
- Requested Document (Proposal, Engagement Letter, Both)
- Language (English, Arabic, Both)

### Section C: Client Information
- Client Name (from PRMS Client Master)
- Parent Company (conditional)
- Client Location (State of Kuwait, Other)
- Relationship with Client (New, Existing, Potential)
- Client Type (W.L.L., S.A.K., K.S.C., Partnership, Sole Proprietorship, Other)
- Regulated Body (MOCI, CMA, CBK, Other, N/A)
- Status (Active, Inactive, Suspended, N/A)

### Section D: Service Information
- Service Type (extensive list from COI Template)
- Service Description (mandatory)
- Requested Service Period (date range)
- Service Category (Assurance, Advisory, Tax, Accounting, Other)

### Section E: Ownership & Structure
- Full Ownership Structure
- PIE Status (Yes, No)
- Related/Affiliated Entities

### Section F: Signatory Details
- Dynamic list of signatories
- Name (from Employee Master)
- Position (auto-filled)

### Section G: International Operations
- International Operations (checkbox)
- Foreign Subsidiaries (conditional)
- Global Clearance Status (Not Required, Pending, Approved, Rejected)
- Excel Upload (for Global COI portal)

---

## Appendix B: Engagement Code Format

**Format:** `ENG-YYYY-SVC-#####`

**Example:** `ENG-2025-TAX-00142`

**Components:**
- **ENG:** Engagement prefix
- **YYYY:** Year (4 digits)
- **SVC:** Service type abbreviation
  - TAX: Tax Services
  - AUD: Audit & Assurance
  - ADV: Advisory
  - ACC: Accounting
  - OTH: Other
- **#####:** Sequential number (5 digits, zero-padded)

**Generation Logic:**
- Sequential numbering per service type per year
- Starts at 00001 each year
- Increments for each new engagement code

---

---

## Appendix C: Prototype Data Summary

### Test Users Available

**Login Credentials (All use password: `password`):**

| Role | Email | Department | Access |
|------|-------|------------|--------|
| Director | john.smith@company.com | Audit | COI, PRMS |
| Requester | patricia.white@company.com | Audit | COI |
| Compliance | emily.davis@company.com | Audit | COI |
| Partner | robert.taylor@company.com | Audit | COI, PRMS |
| Finance | lisa.thomas@company.com | Audit | COI |
| Admin | james.jackson@company.com | Audit | COI |
| Super Admin | admin@company.com | Other | HRMS, PRMS, COI |

**Note:** Similar users available for Tax, Advisory, and Accounting departments.

### Sample Data Highlights

- **50 Employees** across 5 departments
- **100 Clients** (70 Active, 20 Inactive, 10 Potential)
- **200 Projects** with engagement codes
- **20 COI Requests** in various stages
- **Fuzzy Matching Test Cases** included for duplication detection

---

## Appendix D: Key Features Demonstration

### Feature 1: Department-Based Data Segregation
- **Requester:** Sees only own requests (strict isolation)
- **Director:** Sees own + team member requests (department only)
- **Compliance:** Sees all departments (no commercial data)
- **Partner:** Sees all departments (full visibility)

### Feature 2: Automatic Duplication Detection
- Real-time fuzzy matching on client names
- Visual alerts with match scores
- Override capability with justification

### Feature 3: Engagement Code Generation
- Automatic sequential numbering
- Service type-based organization
- PRMS validation (mock)

### Feature 4: Complete COI Template
- All 7 sections (A-G) implemented
- All dropdowns populated
- Conditional field logic
- Form validation

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Status:** Ready for Client Review

---

## Document Control

**Prepared By:** Development Team  
**Reviewed By:** [To be completed]  
**Approved By:** [To be completed]  
**Distribution:** BDO Al Nisf & Partners - Project Stakeholders


