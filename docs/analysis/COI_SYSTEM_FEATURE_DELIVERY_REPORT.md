# COI System - Feature Delivery Report

**Date:** January 21, 2026  
**System:** Proposal & Engagement Local Conflict of Interest (COI) Check & Processing System

---

## Document Basis

- Requirements: `docs/coi-system/extracted_text/COI Workflow.txt`
- Implementation status: `coi-prototype/COMPREHENSIVE_BUILD_REVIEW.md`, `STANDARD_EDITION_STATUS.md`, `PRO_VERSION_STATUS.md`
- CRM features: `CRM_FEATURES_COMPLETE_LIST.md`
- Additional features: Priority Scoring Engine, SLA Management System

**Note:** Prototype system. Email service uses mock implementation. PRMS integration is mock. Ready for production upgrades.

---

## Core Requirements

### System Objectives

| Requirement | Status | Implementation |
|------------|--------|----------------|
| Eliminate Excel trackers | Complete | SQLite database (prototype), SQL Server ready |
| Prevent duplicate proposals | Complete | Fuzzy matching algorithm, automatic blocking |
| Partner dashboard | Complete | Partner Dashboard with proposals, decisions, codes, alerts |
| Mandatory data fields | Complete | Form validation, server-side validation |
| Automate finance coding | Complete | Engagement code generation (ENG-YYYY-SVC-#####) |
| Alerts for expiry, renewal, lapses | Complete | 30-day monitoring, 3-year renewal alerts, automatic lapse |

### Required Data Fields

| Category | Fields | Status | Implementation |
|----------|--------|-------|----------------|
| Service Information | Description, scope, recurring/new/linked, service type, valuation purposes | Complete | 7-section form, service type dropdown, dates |
| Client Information | Legal name, commercial registration, nature of business, new/existing/potential, engagement code, introduction source | Complete | Client selector, PRMS integration, lead source tracking |
| Ownership & Structure | Parent company, ownership structure, PIE status, related entities | Complete | Ownership form, PIE checkbox, group structure linking |
| Signatory Details | Names and positions | Complete | Signatory form section |
| International Operations | Checkbox, foreign subsidiaries, global clearance | Complete | International Operations form, country selection, file upload |

### Workflow Steps

| Step | Requirement | Status | Implementation |
|------|------------|--------|----------------|
| Step 1: Initial Form | Requester initiates, director approval, team member attachment, ISQM forms | Complete | Request form, director assignment, file upload |
| Step 2: International Operations | Additional tab, Excel attachment | Complete | Conditional form, file upload |
| Step 3: Compliance Review | Automatic alerts, auto-lapse after 30 days, alerts every 10 days, approval options | Complete | Duplication detection, 30-day scheduler, compliance dashboard |
| Step 4: Partner Approval | Approval options, transfer to admin, return to compliance | Complete | Partner dashboard, approval workflow, status transitions |
| Step 5: Finance Coding | Engagement code, financial parameters, due amounts | Complete | Finance dashboard, code generation, financial form |
| Step 6: Execution | Execution date, 30-day tracking, client response, engagement letter, renewal alerts | Complete | Admin dashboard, execution tracking, automatic lapse, renewal alerts |

### Automation Features

| Feature | Requirement | Status | Implementation |
|---------|------------|--------|----------------|
| Duplicate Detection | Proposal exists, engagement active, parent/subsidiary conflicts, block with justification | Complete | Fuzzy matching, parent-subsidiary checking, match scoring, blocking |
| Client Management | No free-text, auto-complete, group linking, duplicate prevention, fuzzy matching | Complete | Client dropdown, search, auto-complete, group linking, fuzzy alerts |
| Security & Access | Role-based access (Partners, Compliance, Directors, Finance, Admin) | Complete | 7 roles, data segregation middleware, permission-based UI |

---

## Additional Features

### Business Rules Engine

| Feature | Status | Implementation |
|---------|--------|----------------|
| Business Rules Engine | Complete | Rule evaluation, recommendations with confidence levels (CRITICAL, HIGH, MEDIUM, LOW), block/flag actions |
| IESBA Red Lines Detection | Complete | Detects Management Responsibility, Advocacy, Contingent Fees |
| IESBA Decision Matrix | Complete | PIE + Tax service evaluation |
| Rule Builder UI | Complete | Visual interface, approval workflow |
| Impact Analysis | Complete | Shows affected requests |
| Rule Health Monitoring | Complete | Tracks effectiveness, circuit breaker pattern |

### SLA Management System

| Feature | Status | Implementation |
|---------|--------|----------------|
| Per-Stage SLA Targets | Complete | Configurable targets for Director, Compliance, Partner, Finance |
| PIE Client Overrides | Complete | Stricter SLAs for PIE clients |
| Business Calendar | Complete | Working days calculation, HRMS sync ready |
| SLA Status Tracking | Complete | On Track / Warning (75%) / Critical (90%) / Breached |
| SLA Breach Detection | Complete | Automatic detection and logging |
| Priority Integration | Complete | SLA status factored into priority calculation |
| Configuration UI | Complete | Admin interface for adjusting targets |

### Event-Driven Notification System

| Feature | Status | Implementation |
|---------|--------|----------------|
| Event Bus | Complete | Node.js EventEmitter (prototype), ready for message queue |
| Notification Batching | Complete | Groups notifications within 5-minute windows |
| Urgent Bypass | Complete | Critical alerts sent immediately |
| Role-Based Routing | Complete | Notifications sent to relevant stakeholders only |
| SLA Event Integration | Complete | SLA warning/critical/breach events trigger notifications |
| Notification Queue | Complete | Database-backed queue |

**Note:** Email service is mock (logs to console/file). SMTP integration required for production.

### CRM Features

| Feature | Status | Implementation |
|---------|--------|----------------|
| Prospect Management | Complete | Full lifecycle tracking from lead to engagement |
| Lead Source Tracking | Complete | 8 lead sources (referral, marketing, insights module, etc.) |
| Funnel Analytics | Complete | 8 funnel stages, conversion tracking |
| Funnel Events Logging | Complete | Event tracking with timestamps, user attribution, days in stage |
| Prospect-to-Client Conversion | Complete | Conversion workflow |
| CRM Dashboard Cards | Complete | Lead source distribution, funnel performance, insights effectiveness, top performers |
| CRM Reports | Complete | Lead source effectiveness, funnel performance, insights-to-conversion, attribution, pipeline forecast, trends, period comparison, lost analysis |
| Stale Detection | Complete | 14-day follow-up, 30-day stale detection |
| Lost Prospect Tracking | Complete | Track lost prospects with reasons and stage |

### Client Intelligence

| Feature | Status | Implementation |
|---------|--------|----------------|
| Client Intelligence Module | Complete | Feature-flagged, analyzes COI data for opportunities |
| Service Gap Analysis | Complete | Identifies services client doesn't use |
| Renewal Opportunity Detection | Complete | Flags engagements ending in 30-90 days |
| Relationship Intelligence | Complete | Parent-subsidiary cross-sell opportunities |
| Compliance-Filtered Recommendations | Complete | Only recommends services allowed by IESBA rules |
| Opportunity Generation | Complete | Creates opportunities from COI data analysis |

**Note:** Feature-flagged module. Requires COI data to be present.

### Priority Scoring Engine

| Feature | Status | Implementation |
|---------|--------|----------------|
| Multi-Factor Priority Calculation | Complete | Weighted scoring based on SLA status, external deadlines, PIE status, service type, escalations |
| Configurable Priority Factors | Complete | Admin can adjust weights and value mappings |
| Priority Levels | Complete | CRITICAL (80-100), HIGH (60-79), MEDIUM (40-59), LOW (0-39) |
| Priority Badges | Complete | Visual indicators in task lists and dashboards |
| Score Breakdown Modal | Complete | Detailed explanation of priority calculation |
| My Day/Week/Month Views | Complete | Tasks sorted by priority score |

### Monitoring & Alerts

| Feature | Status | Implementation |
|---------|--------|----------------|
| 30-Day Proposal Monitoring | Complete | Hourly scheduler, automatic lapse after 30 days |
| Interval Monitoring Alerts | Complete | Alerts at 10, 20, 30 days |
| 3-Year Renewal Alerts | Complete | Alerts 90/60/30 days before expiry |
| Stale Request Detection | Complete | 14-day follow-up, 30-day stale |
| Automated Monitoring Scheduler | Complete | Hourly checks for lapses, renewals, SLA status |

---

## Meeting Requirements Coverage (January 2026)

### Requirement 1: Convert Proposal to Engagement & Re-apply COI

**Status:** Complete

**What it does:**
- Users can convert approved proposals to engagement stage
- System creates new COI request for engagement automatically
- All proposal data is copied to the new engagement request
- System tracks the relationship between proposal and engagement
- User can add conversion reason when converting

**Where to use:**
- Available in COI Request Detail view
- Button appears for approved proposals
- Modal window for entering conversion reason

---

### Requirement 2: Service Type Full List + Sub-Categories

**Status:** Complete

**What it does:**
- Full list of 177+ services across 26+ categories available
- Business/Asset Valuation services have sub-categories:
  - Acquisition
  - Capital Increase
  - Financial Facilities
- Service list adapts based on entity and international operations flag

**Where to use:**
- Service type dropdown in COI Request Form
- Sub-category selection appears when Business/Asset Valuation is selected

---

### Requirement 3: Prospect Management (Separate from Clients)

**Status:** Partial

**What it does:**
- Prospects are managed separately from clients
- System checks if prospect exists in PRMS
- If PRMS client exists, prospect is linked to that client
- Group level services can be tracked for prospects
- Prospect management page available

**What's missing:**
- Enhanced search and filter options in prospect list
- Group level services management interface

**Where to use:**
- Prospect Management page in sidebar
- Prospect selection in COI Request Form

---

### Requirement 4: Additional Rejection Options (COI+ Only)

**Status:** Complete

**What it does:**
- Directors can only Approve or Reject requests
- Compliance and Partner roles have additional options:
  - Approved with Restrictions
  - Need More Info
  - Rejected (with rejection types: fixable, permanent)
- System prevents directors from using additional options

**Where to use:**
- Approval buttons in COI Request Detail view
- Different buttons shown based on user role

---

### Requirement 5: State Management - HRMS Vacation Integration

**Status:** Partial

**What it does:**
- Admin can mark approvers as unavailable (vacation, leave)
- System filters out unavailable approvers when assigning requests
- Admin can set unavailable reason and return date
- System escalates to Admin when no active approvers available

**What's missing:**
- Automatic notification to requester when approver is unavailable
- Automatic sync from HRMS system (currently manual admin setting)
- Display of approver vacation status to requester

**Where to use:**
- Admin User Management page
- System automatically handles approver selection

---

### Requirement 6: Event-Driven Architecture Research

**Status:** Researched, lightweight implementation exists

**What it does:**
- System batches similar notifications to reduce email overload
- Critical alerts (SLA breaches, rejections) are sent immediately
- Notifications are routed only to relevant stakeholders
- System groups notifications within time windows

**Note:** Internal suggestion from Envision team. System implements lightweight pattern suitable for prototype. Architecture ready for production message queue if needed.

---

### Requirement 7: Compliance - All Services (Excluding Costs/Fees)

**Status:** Partial

**What it does:**
- Compliance team can view all services for existing clients
- Financial data (fees, costs, billing) is automatically hidden from Compliance view
- System shows service history without financial details
- Data segregation ensures Compliance only sees non-financial information

**What's missing:**
- Frontend interface for viewing client services history
- Frontend interface for all clients services overview
- Verification that financial data is properly hidden in UI

**Where to use:**
- Compliance Dashboard (when implemented)
- Client detail view (when implemented)

---

## Summary

### Meeting Requirements

| Status | Count | Requirements |
|--------|-------|--------------|
| Complete | 4 | Requirements 1, 2, 4, 6 |
| Partial | 3 | Requirements 3, 5, 7 |

### Core Workflow

All mandatory workflow requirements from COI Workflow document are implemented.

### Additional Features

- Business Rules Engine
- SLA Management System
- Event-Driven Notifications
- CRM Prospect Management
- Client Intelligence Module
- Priority Scoring Engine

### Prototype Status

- Database: SQLite (prototype), SQL Server ready
- Event System: Node.js EventEmitter (prototype), message queue ready
- Email Service: Mock (prototype), SMTP required
- PRMS Integration: Mock (prototype), real API required
- HRMS Integration: Calendar structure ready, API integration required

---

## Technical Architecture

### Database
- SQLite (prototype)
- Schema ready for SQL Server Enterprise Edition

### Event System
- Node.js EventEmitter (prototype)
- Architecture ready for RabbitMQ/AWS SNS

### Email Service
- Mock implementation (logs to console/file)
- SMTP integration required for production

### Integrations
- PRMS: Mock API, real API integration required
- HRMS: Calendar structure ready, API integration required

### Security
- Role-based access control (7 roles)
- Data segregation middleware
- Audit logging

---

**Document Prepared By:** Development Team
