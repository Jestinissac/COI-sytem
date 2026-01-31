# COI System — Prototype to Production Handover Document

**Prepared for:** BDO Al Nisf & Partners
**Project:** Envision PRMS — Conflict of Interest (COI) Management System
**Document Type:** Prototype-to-Production Handover with Project Brief
**Date:** January 30, 2026
**Version:** 1.0 (SUPERSEDED — See v2.0)

> **NOTE:** This document has been superseded by **v2.0** with standalone API-first architecture.
> Updated version: `coi-prototype/docs/production-handover/COI_Prototype_to_Production_Handover_with_Project_Brief.md`

---

## 1. PROJECT BRIEF

### 1.1 Background

BDO Al Nisf & Partners requires a governance system to ensure that **no proposal or engagement letter can be issued or signed** without a full, documented, and approved COI review. The COI System acts as an upstream gatekeeper for the existing Project Resource Management System (PRMS), enforcing compliance before any project can be created.

### 1.2 Business Objective

Enforce mandatory conflict-of-interest checks across all client engagements by integrating a COI governance layer between HRMS (employee/role data) and PRMS (project/client data).

```
HRMS (Users, Roles, Permissions)
        ↓
COI System (Conflict Checks, Approvals, Engagement Codes)
        ↓
PRMS (Project Creation — requires valid Engagement Code)
```

### 1.3 Core Workflow

1. **Requester** creates a COI request (7-section form: client, service, ownership, signatory, international ops, review, submission)
2. **Director** reviews and approves with document upload
3. **Compliance** reviews with duplication detection (fuzzy matching) and rule-based assessment
4. **Partner** final approval
5. **Finance** generates engagement code and captures financial parameters
6. **Admin** executes proposal/engagement in PRMS using the engagement code
7. **Database constraint** prevents PRMS project creation without a valid, active engagement code

### 1.4 Scope Summary

| Area | Details |
|------|---------|
| **Users** | Team Members, Directors, Compliance Officers, Partners, Finance, Admin, Super Admin |
| **Dashboards** | 7 role-based dashboards with department-level data segregation |
| **Business Rules** | 88 rules (Standard + Pro editions), IESBA compliance framework, CMA matrix |
| **Integrations** | PRMS (clients, projects), HRMS (employees, roles), O365 (email) |
| **Key Features** | Fuzzy duplication detection, engagement code generation, dynamic field config, prospect-to-client conversion, parent company bidirectional sync |

---

## 2. PROTOTYPE DELIVERY SUMMARY

### 2.1 What Was Built

A **fully functional prototype** validating the end-to-end COI workflow, built with:

| Component | Technology | Status |
|-----------|-----------|--------|
| Frontend | Vue 3 + TypeScript + Tailwind CSS | Complete |
| Backend | Node.js + Express | Complete |
| Database | SQLite (prototype only) | Complete |
| Testing | Playwright E2E tests | Complete |
| Documentation | 150+ markdown files | Complete |

### 2.2 Prototype Success Criteria — All Met

- Database constraint prevents bypass (no project without valid engagement code)
- Approval workflow enforced (Director → Compliance → Partner → Finance → Admin)
- Engagement code generation and validation operational
- Fuzzy matching duplication checks functional (Levenshtein + scoring)
- End-to-end COI request flow verified
- Mock PRMS integration validates engagement codes
- Business Rules Engine with 88 rules
- IESBA compliance framework (Pro edition)
- 26 UI/UX improvements across 6 files (documented in COI_FORM_IMPROVEMENTS.md)

### 2.3 Key Prototype Files

| File / Directory | Purpose |
|-----------------|---------|
| `coi-prototype/frontend/` | Vue.js frontend with all dashboards and forms |
| `coi-prototype/backend/` | Express API with all controllers and services |
| `coi-prototype/database/` | SQLite schema and migrations |
| `coi-prototype/docs/prototype/` | 150+ implementation and test documents |
| `docs/coi-system/` | 45+ specification and research documents |
| `docs/production-handover/` | Handover guides and verification reports |

---

## 3. PROTOTYPE vs PRODUCTION — KEY DIFFERENCES

### 3.1 Infrastructure

| Aspect | Prototype | Production |
|--------|-----------|------------|
| **Database** | SQLite (local file) | SQL Server Enterprise Edition |
| **Authentication** | Mock JWT (any password accepted) | SSO / Active Directory |
| **Email** | Console logging | Microsoft O365 SMTP |
| **File Storage** | Local filesystem | Cloud storage (S3 / Azure Blob) |
| **Caching** | In-memory (basic) | Redis (distributed) |
| **Data Scale** | 50 employees, 100 clients, 200 projects | 2,000+ clients, 10,000+ active projects |

### 3.2 Integration Points

| Integration | Prototype | Production |
|-------------|-----------|------------|
| **PRMS** | Mock API (local DB) | Real REST API or direct SQL Server access |
| **HRMS** | Mock API (hardcoded data) | SQL Server Employee Master queries |
| **Email** | Console output | O365 Exchange/Outlook SMTP |
| **Client Master** | Local table (seeded) | Real-time sync from PRMS Client Master |
| **User Auth** | Simple JWT/session | Integrated SSO or Active Directory |

### 3.3 Architecture Changes

| Aspect | Prototype | Production |
|--------|-----------|------------|
| **Form Fields** | Hardcoded in Vue components | Database-driven dynamic configuration |
| **Business Rules** | Application-level logic | Stored procedures + application logic |
| **Engagement Codes** | Application-level counter | SQL Server stored procedure (thread-safe) |
| **Fuzzy Matching** | Fetch-all + Levenshtein | SQL Server SOUNDEX + filtered Levenshtein + Redis cache |
| **Document Mgmt** | Database BLOB / local files | Cloud storage with row-level security |
| **Audit Logging** | Basic | Comprehensive (SQL Server triggers + application) |

---

## 4. PRODUCTION BUILD REQUIREMENTS

### 4.1 Phase 1 — Foundation (HIGH Priority)

#### Database Migration: SQLite → SQL Server

- Migrate all schema definitions to SQL Server DDL
- Create stored procedures for: engagement code generation, duplication checks, validation, audit logging
- Implement comprehensive indexing strategy
- Set up backup and disaster recovery

#### Authentication & Authorization

- Integrate with Active Directory / SSO
- Map HRMS User Groups to COI roles (Director, Compliance, Partner, Finance, Admin, Super Admin)
- Implement proper JWT with secure secret management

#### PRMS Client Integration

- **API Endpoint Needed:** `GET /api/clients/check?client_code={code}` — verify client exists
- **API Endpoint Needed:** `POST /api/clients` — create client in PRMS Client Master
- **Code to Update:** `backend/src/controllers/prospectController.js` (line 298-321: `checkPRMSClient()`)
- **Code to Update:** `backend/src/controllers/prospectClientCreationController.js` (line 250-382: `completeClientCreation()`)

#### HRMS Integration

- Connect to HRMS Employee Master (`HRMS.dbo.EmployeeMaster`)
- Connect to HRMS User Groups (`HRMS.dbo.UserGroups`, `HRMS.dbo.UserGroupMembers`)
- Implement caching (5-10 min for employees, 15-30 min for groups)

### 4.2 Phase 2 — Project Operations (MEDIUM Priority)

#### PRMS Project Creation

- **API Endpoint Needed:** `POST /api/projects` — create project in PRMS
- **CRITICAL:** PRMS must add `EngagementCode` as a MANDATORY field in project creation
- Push financial parameters: billing currency, risk assessment, project value
- **Code to Update:** `backend/src/controllers/integrationController.js` (line 55-95: `createProject()`)
- **Code to Update:** `backend/src/controllers/coiController.js` (line 448-461: PRMS client check)

#### Engagement Code Validation

- Implement SQL Server stored procedure `sp_GenerateEngagementCode` (thread-safe with UPDLOCK)
- Foreign key constraint: `PRMS.dbo.Projects.EngagementCode → COI.dbo.coi_engagement_codes`
- Only accept codes with status = 'Active'

#### Parent Company Bidirectional Sync

- Read parent company from PRMS (normalize "TBD"/empty to null)
- COI updates to parent → create `parent_company_update_request` → PRMS Admin approval → write to PRMS
- PRMS-originated updates → webhook/poll → update COI records

### 4.3 Phase 3 — Enterprise Features (LOWER Priority)

#### Email Notifications (O365)

- SMTP: `smtp.office365.com:587` with TLS
- Email source: HRMS Employee Master (primary) + COI override
- Database-driven templates (admin-configurable)
- Delivery tracking and retry mechanism

#### Dynamic Field Configuration

- Implement `coi_field_config`, `coi_field_options`, `coi_field_conditions` tables
- Admin UI to add/modify/delete form fields without code changes
- Full audit trail via `coi_field_config_history`

#### Data Sync & Webhooks

- Client Master sync: real-time webhook or 5-minute polling from PRMS
- Project status sync: PRMS → COI notifications
- Conflict resolution for bidirectional updates

#### Performance Optimization

- Redis caching for clients, employees, duplication checks
- SQL Server stored procedure `sp_GetPotentialDuplicates` (SOUNDEX + prefix filtering)
- Query optimization for 10,000+ project scale

---

## 5. NEW FILES REQUIRED FOR PRODUCTION

| File | Purpose |
|------|---------|
| `backend/src/services/prmsService.js` | Real PRMS API client (checkClient, createClient, createProject, getToken) |
| `backend/src/services/hrmsService.js` | Real HRMS SQL Server queries (getEmployees, getUserGroups, getEmail) |
| `backend/src/services/emailService.js` | O365 SMTP email with templates and delivery tracking |
| `backend/src/config/prms.config.js` | PRMS API URL, credentials, timeout, retry settings |
| `backend/src/config/hrms.config.js` | HRMS SQL Server connection configuration |
| `backend/src/config/email.config.js` | O365 SMTP configuration |

---

## 6. EXISTING CODE TO UPDATE

| File | Function | Change Required |
|------|----------|----------------|
| `controllers/prospectController.js` | `checkPRMSClient()` (L298-321) | Replace local DB query with real PRMS API call |
| `controllers/prospectClientCreationController.js` | `completeClientCreation()` (L250-382) | Replace local insert with PRMS API → then sync to COI |
| `controllers/integrationController.js` | `createProject()` (L55-95) | Replace local insert with PRMS API call |
| `controllers/coiController.js` | PRMS check (L448-461) | Replace mock with real API |
| `controllers/parentCompanyUpdateController.js` | Approval flow | Replace local update with PRMS API write after approval |

---

## 7. PRMS SCHEMA CHANGES REQUIRED

```sql
-- MANDATORY: Add EngagementCode to PRMS Projects table
ALTER TABLE PRMS.dbo.Projects
ADD EngagementCode VARCHAR(50) NOT NULL;

-- Foreign key to COI system
ALTER TABLE PRMS.dbo.Projects
ADD CONSTRAINT FK_Projects_EngagementCode
FOREIGN KEY (EngagementCode)
REFERENCES COI.dbo.coi_engagement_codes(engagement_code);
```

This is the single most critical production requirement — it enforces the core governance rule that no project can exist without an approved COI review.

---

## 8. TESTING & VERIFICATION

### Existing Test Coverage

- Playwright E2E tests covering core workflows
- Build verification reports (BUILD_VERIFICATION_SUMMARY.md)
- Requirements coverage report (REQUIREMENTS_COVERAGE_REPORT.md)
- Permission system verification (end-to-end verified)
- Feature delivery report (COI_SYSTEM_FEATURE_DELIVERY_REPORT.md)

### Production Testing Required

- [ ] SQL Server migration validation (all data types, constraints, indexes)
- [ ] PRMS API integration tests (client check, client creation, project creation)
- [ ] HRMS integration tests (employee data, user groups, email lookup)
- [ ] O365 email delivery tests (send, retry, tracking)
- [ ] Load testing at production scale (2,000+ clients, 10,000+ projects)
- [ ] SSO/AD authentication flow testing
- [ ] Cross-system data sync verification
- [ ] Engagement code concurrency testing (thread-safe generation)
- [ ] Parent company bidirectional sync testing
- [ ] Full regression of all 7 role-based dashboards

---

## 9. RISK REGISTER

| Risk | Impact | Mitigation |
|------|--------|------------|
| PRMS lacks EngagementCode field | **Critical** — core governance fails | Coordinate with PRMS team to add mandatory field before COI go-live |
| HRMS API unavailable | High — no user/role data | Implement fallback to cached data; configure health checks |
| PRMS API latency | Medium — slow client lookups | Redis caching with 5-min TTL; async background sync |
| Concurrent engagement code generation | High — duplicate codes | SQL Server stored procedure with UPDLOCK + ROWLOCK |
| Data sync conflicts (COI ↔ PRMS) | Medium — stale data | Define source-of-truth per field; implement conflict resolution rules |

---

## 10. REFERENCE DOCUMENTATION

| Document | Location |
|----------|----------|
| Main Handoff Guide | `docs/production-handover/Prototype_vs_Production_Handoff_Guide.md` |
| PRMS Integration Current State | `docs/production-handover/PRMS_INTEGRATION_CURRENT_STATE.md` |
| Permission System Verification | `docs/production-handover/PERMISSION_SYSTEM_VERIFICATION_REPORT.md` |
| COI Form Improvements (26 items) | `coi-prototype/COI_FORM_IMPROVEMENTS.md` |
| COI System Scope of Work | `docs/coi-system/COI_System_Prototype_Scope_of_Work.md` |
| IESBA vs CMA Service Mapping | `docs/coi-system/IESBA_vs_CMA_Service_Mapping.md` |
| User Journeys (End-to-End) | `docs/coi-system/User_Journeys_End_to_End.md` |
| Risk Analysis & Failure Points | `docs/coi-system/Risk_Analysis_and_Failure_Points.md` |
| Feature Delivery Report | `docs/analysis/COI_SYSTEM_FEATURE_DELIVERY_REPORT.md` |

---

## 11. SIGN-OFF

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Project Lead | | | |
| Technical Lead | | | |
| PRMS Team Lead | | | |
| Compliance Representative | | | |
| IT Infrastructure | | | |

---

*Document generated from Envision PRMS COI System prototype documentation.*
*Source: `/Users/jestinissac/Documents/Envision PRMS/`*
