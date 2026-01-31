# COI System — Prototype to Production Handover Document

**Prepared for:** BDO Al Nisf & Partners
**Project:** Envision PRMS — Conflict of Interest (COI) Management System
**Document Type:** Prototype-to-Production Handover with Project Brief & Architecture Specification
**Date:** January 30, 2026
**Version:** 3.0 (Merged — Post-Architecture Review)
**Architecture:** Standalone API-First ("Gatekeeper as a Service") — Orchestrator Pattern

---

## Executive Summary

**Decision:** Replace the tight-coupling architecture (direct SQL to HRMS, invasive PRMS schema changes) with a **standalone API-first architecture** using the **Orchestrator Pattern**.

**Key Shift:** COI acts as the gatekeeper for project creation via API contracts, not database constraints. PRMS receives projects from COI via API, eliminating the need for `ALTER TABLE` on legacy systems.

**Implementation Model:** Modular monolith (not distributed microservices) — one deployable unit with clean internal boundaries, suitable for BDO's scale (~2,000 clients, ~10,000 projects).

---

## 1. PROJECT BRIEF

### 1.1 Background

BDO Al Nisf & Partners requires a governance system to ensure that **no proposal or engagement letter can be issued or signed** without a full, documented, and approved COI review. The COI System acts as an upstream gatekeeper for the existing Project Resource Management System (PRMS), enforcing compliance before any project can be created.

### 1.2 Business Objective

Enforce mandatory conflict-of-interest checks across all client engagements by integrating a COI governance layer between HRMS (employee/role data) and PRMS (project/client data).

### 1.3 System Context

```
HRMS (Users, Roles, Permissions)
        |
        v
COI System  <-- Standalone API: owns its database, talks to
        |      external systems only through adapter interfaces
        v
PRMS (Project Creation -- orchestrated by COI, requires valid Engagement Code)
```

### 1.4 Core Workflow

1. **Requester** creates a COI request (7-section form: client, service, ownership, signatory, international ops, review, submission)
2. **Director** reviews and approves with document upload
3. **Compliance** reviews with duplication detection (fuzzy matching) and rule-based assessment
4. **Partner** final approval
5. **Finance** generates engagement code and captures financial parameters
6. **Admin** executes proposal/engagement — COI orchestrates project creation in PRMS using the engagement code
7. **Governance enforcement** — COI is the sole entry point for project creation; reconciliation audit catches any bypass

### 1.5 Scope Summary

| Area | Details |
|------|---------|
| **Users** | Team Members, Directors, Compliance Officers, Partners, Finance, Admin, Super Admin |
| **Dashboards** | 7 role-based dashboards with department-level data segregation |
| **Business Rules** | 88 rules (Standard + Pro editions), IESBA compliance framework, CMA matrix |
| **Integrations** | PRMS (via adapter), HRMS (via adapter with local cache), O365 (email service) |
| **Key Features** | Fuzzy duplication detection, engagement code generation, dynamic field config, prospect-to-client conversion, parent company bidirectional sync |

---

## 2. PROTOTYPE DELIVERY SUMMARY

### 2.1 What Was Built

A **fully functional prototype** validating the end-to-end COI workflow:

| Component | Technology | Status |
|-----------|-----------|--------|
| Frontend | Vue 3 + TypeScript + Tailwind CSS | Complete |
| Backend | Node.js + Express | Complete |
| Database | SQLite (prototype only) | Complete |
| Testing | Playwright E2E tests | Complete |
| Documentation | 150+ markdown files | Complete |

### 2.2 Prototype Success Criteria — All Met

- Database constraint prevents bypass (no project without valid engagement code)
- Approval workflow enforced (Director -> Compliance -> Partner -> Finance -> Admin)
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

## 3. PRODUCTION ARCHITECTURE: "Gatekeeper as a Service"

### 3.1 System Diagram

```
+-----------------+      +------------------+      +-----------------+
|  COI Frontend   |<---->|  COI API Core    |<---->|  SQL Server     |
|  (Vue.js)       |      |  (Node.js)       |      |  (COI DB)       |
+-----------------+      +--------+---------+      +-----------------+
                                  |
                    +-------------+-------------+
                    |             |             |
                    v             v             v
             +----------+  +----------+  +----------+
             |  HRMS    |  |  PRMS    |  |  Email   |
             |  Adapter |  |  Adapter |  |  Service |
             +----+-----+  +----+-----+  +----------+
                  |             |
             +----+-----+  +----+-----+
             | Azure AD |  | PRMS API |
             |  /LDAP   |  | (REST)   |
             +----------+  +----------+
```

### 3.2 Core Principles

| Principle | What It Means | Why It Matters |
|-----------|--------------|----------------|
| **Orchestration over Constraint** | COI creates projects in PRMS via API; PRMS does not enforce engagement codes at DB level | Non-invasive — no `ALTER TABLE` on legacy PRMS |
| **Anti-Corruption Layers** | Adapter services translate between COI domain language and external system APIs | External system changes are isolated to the adapter |
| **Database-per-Service** | COI owns its SQL Server instance; no direct queries to HRMS/PRMS databases | COI is independent of external schema changes |
| **Local Cache (CQRS)** | HRMS data synced to a local read model; dashboards never query HRMS directly | COI works during HRMS maintenance windows |
| **Async Outbox** | Cross-system writes go through a database-backed outbox queue with retry and dead letter | Reliable integration without message broker infrastructure |
| **Safety Net** | Nightly reconciliation audit detects any bypass attempts | Governance enforcement during transition period |
| **Modular Monolith** | Same logical boundaries as microservices, single deployment | Right-sized for BDO's operational capacity; extract later if needed |
| **Azure-Native** | APIM, Blob Storage, Key Vault, Application Insights | Aligns with existing Microsoft stack (SQL Server, O365) |

### 3.3 Why Standalone API — Not Tight Coupling

| Original Plan (v1) | Standalone API Architecture (v3) | Impact |
|---------------------|----------------------------------|--------|
| Direct SQL to HRMS | HRMS Adapter with local cache | COI works even if HRMS is down |
| `ALTER TABLE PRMS.dbo.Projects` required | PRMS Adapter with orchestration | No invasive changes to legacy PRMS database |
| Bidirectional sync (complex, fragile) | Event-driven outbox with clear source of truth | Predictable data flow, easier debugging |
| Business logic in controllers | Domain services with adapter interfaces | Testable, swappable integrations |
| No failure handling | Circuit breaker + outbox + dead letter | Resilient to external system downtime |

---

## 4. SOLVING THE CRITICAL CONSTRAINT: "No Project Without Engagement Code"

### 4.1 Primary Enforcement: COI Orchestration

COI becomes the **sole entry point** for project creation. PRMS receives approved, validated projects from COI — never the other way around.

```
Engagement Code Generated (Finance)
        |
        v
Admin clicks "Create Project in PRMS"
        |
        v
COI API Core validates:
  - Engagement code is ACTIVE and not expired
  - Client exists and is approved
  - All approvals in chain are complete
        |
        v
Outbox enqueues PRMS_CREATE_PROJECT with idempotency key
        |
        v
Outbox Worker processes:
  PRMS Adapter calls PRMS API:
    POST /api/v1/projects { engagementCode, clientCode, ... }
        |
        v
On success: COI links PRMS project ID back to engagement code
        |
        v
Engagement code status -> USED
```

**PRMS requirements are minimal:** Accept an `engagementCode` field in the project creation API (optional from PRMS's perspective — enforcement is entirely in COI).

### 4.2 Safety Net: Reconciliation Audit

Because users could potentially create projects in PRMS directly (bypassing COI), a nightly reconciliation job catches governance violations:

```
Schedule: 2:00 AM Asia/Kuwait (0 2 * * *)
Window:   Last 24 hours of PRMS projects

Steps:
  1. Fetch all PRMS projects created since last audit (paginated)
  2. Compare against COI engagement_codes table
  3. Detect: Missing codes, Invalid codes, Expired codes, Client mismatches
  4. Insert violations to reconciliation_violations table
  5. Alert Compliance team if violations found
  6. Compliance reviews and resolves via remediation API
```

This is essential during the transition period when users are learning the new workflow. The reconciliation does not block — it alerts, creating an audit trail for compliance review.

**Remediation API:**
- `POST /api/v1/reconciliation/resolve` — Mark violation as resolved with notes
- `POST /api/v1/reconciliation/false-positive` — Mark as false positive (e.g., legacy projects pre-dating COI)

### 4.3 What PRMS Needs to Change

| Change | Scope | Notes |
|--------|-------|-------|
| Accept `engagementCode` field in project creation API | Minimal — one optional field | PRMS stores it but does not enforce it |
| Expose `GET /api/v1/projects` (list projects) | Needed for reconciliation audit | Read-only, filterable by date |
| Expose `POST /api/v1/projects` (create project) | Needed for COI orchestration | COI calls this on behalf of Admin |

**No `ALTER TABLE`, no foreign key constraints, no cross-database dependencies.**

---

## 5. API CONTRACT: COI <-> PRMS Integration

This section is the specification to share with the PRMS development team.

### 5.1 Authentication

- **Type:** OAuth2 Client Credentials (Azure AD) or API Key with rotation schedule
- **Required Headers:**
  - `Authorization: Bearer {token}` — OAuth2 access token
  - `X-Request-ID: {uuid}` — Correlation ID for distributed tracing
  - `X-Idempotency-Key: {key}` — Deduplication key (prevents double-creates on retry)
  - `Content-Type: application/json`

### 5.2 Endpoints: COI -> PRMS

#### 5.2.1 Validate Client

```http
GET /api/v1/clients/validate?client_code={code}
Authorization: Bearer {token}
X-Request-ID: {uuid}
```

**Response 200:** Client exists in PRMS
```json
{
  "exists": true,
  "client_code": "CLI-001",
  "client_id": "PRMS-12345",
  "client_name": "ABC Corporation",
  "parent_company": "ABC Global Holdings",
  "status": "Active"
}
```

**Response 404:** Client not found
```json
{
  "exists": false,
  "suggestions": [
    { "client_code": "CLI-002", "client_name": "ABC Corp Ltd", "similarity": 0.87 }
  ]
}
```

#### 5.2.2 Create Client (Prospect Conversion)

```http
POST /api/v1/clients
Authorization: Bearer {token}
X-Request-ID: {uuid}
X-Idempotency-Key: coi-client-{coi_prospect_id}
Content-Type: application/json

{
  "coi_reference_id": "COI-2026-001234",
  "client_name": "Acme Corporation",
  "legal_form": "W.L.L.",
  "industry": "Technology",
  "regulatory_body": "MOCI",
  "parent_company_name": "Acme Global Holdings",
  "contact_details": [
    { "name": "John Doe", "email": "john@acme.com", "phone": "+965-XXXX-XXXX" }
  ],
  "physical_address": "Kuwait City, Kuwait",
  "billing_address": "Same as physical",
  "source": "COI_SYSTEM",
  "metadata": {
    "coi_request_id": "REQ-2026-000456",
    "approval_date": "2026-01-28T10:30:00Z",
    "approved_by": "Partner Name"
  }
}
```

**Response 201:** Client created
```json
{
  "success": true,
  "client_id": "PRMS-99999",
  "client_code": "CLI-456",
  "client_name": "Acme Corporation",
  "status": "Active",
  "created_at": "2026-01-28T10:35:00Z"
}
```

**Response 409:** Already exists (idempotency hit — safe to treat as success)
```json
{
  "success": true,
  "client_id": "PRMS-99999",
  "client_code": "CLI-456",
  "already_existed": true
}
```

**Response 400:** Validation error
```json
{
  "success": false,
  "errors": [
    { "field": "client_name", "message": "Client name is required" }
  ]
}
```

#### 5.2.3 Create Project (Orchestrated Gatekeeper)

```http
POST /api/v1/projects
Authorization: Bearer {token}
X-Request-ID: {uuid}
X-Idempotency-Key: coi-proj-{engagement_code}
Content-Type: application/json

{
  "engagement_code": "COI-2026-KWT-000123",
  "client_id": "PRMS-99999",
  "client_code": "CLI-456",
  "project_name": "Acme Corporation - Audit 2026",
  "service_type": "AUD",
  "start_date": "2026-04-01",
  "billing_currency": "KWD",
  "project_value": 15000,
  "risk_assessment": "Medium",
  "coi_metadata": {
    "coi_request_id": "REQ-2026-000456",
    "director_approved_by": "Director Name",
    "director_approved_at": "2026-01-20T09:00:00Z",
    "compliance_approved_by": "Compliance Officer",
    "compliance_approved_at": "2026-01-22T14:00:00Z",
    "partner_approved_by": "Partner Name",
    "partner_approved_at": "2026-01-25T11:00:00Z",
    "finance_code_generated_by": "Finance Officer",
    "finance_code_generated_at": "2026-01-27T16:00:00Z"
  }
}
```

**Response 201:** Project created
```json
{
  "success": true,
  "prms_project_id": "PRJ-2026-00789",
  "engagement_code": "COI-2026-KWT-000123",
  "status": "Active",
  "created_at": "2026-01-28T10:40:00Z"
}
```

**Response 400:** Invalid or expired engagement code
```json
{
  "success": false,
  "error": "INVALID_ENGAGEMENT_CODE",
  "message": "Engagement code not found or expired"
}
```

**Response 409:** Already exists (idempotency hit)
```json
{
  "success": true,
  "prms_project_id": "PRJ-2026-00789",
  "already_existed": true
}
```

#### 5.2.4 Update Client Parent Company

```http
PATCH /api/v1/clients/{client_id}/parent-company
Authorization: Bearer {token}
X-Request-ID: {uuid}
X-Idempotency-Key: coi-parent-{update_request_id}
Content-Type: application/json

{
  "parent_company_name": "New Parent Holdings",
  "coi_update_request_id": "PUR-2026-000012",
  "approved_by": "PRMS Admin Name",
  "approved_at": "2026-01-29T14:00:00Z"
}
```

**Response 200:** Updated
**Response 404:** Client not found

#### 5.2.5 List Projects (Reconciliation Query)

```http
GET /api/v1/projects?created_since={ISO_date}&page={n}&per_page=100&include_engagement_codes=true
Authorization: Bearer {token}
X-Request-ID: {uuid}
```

**Response 200:**
```json
{
  "projects": [
    {
      "prms_project_id": "PRJ-2026-00789",
      "engagement_code": "COI-2026-KWT-000123",
      "client_id": "PRMS-99999",
      "created_by": "admin@bdo.com",
      "created_at": "2026-01-28T10:40:00Z"
    },
    {
      "prms_project_id": "PRJ-2026-00790",
      "engagement_code": null,
      "client_id": "PRMS-88888",
      "created_by": "user@bdo.com",
      "created_at": "2026-01-28T11:00:00Z"
    }
  ],
  "pagination": { "page": 1, "per_page": 100, "total": 2 }
}
```

**Purpose:** Daily reconciliation audit compares this list against COI engagement codes to detect bypasses (projects with `engagement_code: null` or invalid codes).

### 5.3 Endpoint: COI Validation Service (For External Consumers)

This standalone endpoint can be called by PRMS, API Gateway, or any system that needs to validate an engagement code.

```http
POST /api/v1/validate-engagement-code
Authorization: Bearer {token}
Content-Type: application/json

{
  "engagement_code": "COI-2026-KWT-000123",
  "client_id": "PRMS-99999"
}
```

**Response 200:** Valid
```json
{
  "valid": true,
  "status": "ACTIVE",
  "client_id": "PRMS-99999",
  "approved_by": "Partner Name",
  "expires_at": "2026-07-28T23:59:59Z"
}
```

**Response 403:** Invalid
```json
{
  "valid": false,
  "reason": "EXPIRED",
  "expired_at": "2026-01-15T23:59:59Z"
}
```

---

## 6. SQL SERVER SCHEMA

### 6.1 Engagement Code Generation (Thread-Safe)

```sql
CREATE TABLE engagement_code_sequences (
    sequence_name   VARCHAR(50) PRIMARY KEY,   -- e.g. 'COI-2026-KWT'
    last_value      BIGINT NOT NULL DEFAULT 0,
    year            INT NOT NULL,
    updated_at      DATETIME2
);

CREATE TABLE engagement_codes (
    engagement_code     VARCHAR(50) PRIMARY KEY,
    coi_request_id      VARCHAR(50) NOT NULL,
    prms_client_id      VARCHAR(50) NULL,
    prms_project_id     VARCHAR(50) NULL,          -- Linked after project creation
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                        -- PENDING -> ACTIVE -> USED | EXPIRED
    generated_by        INT NOT NULL,
    generated_at        DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    activated_at        DATETIME2 NULL,
    used_at             DATETIME2 NULL,
    expires_at          DATETIME2 NULL,

    INDEX IX_engagement_codes_status (status),
    INDEX IX_engagement_codes_client (prms_client_id, status),
    INDEX IX_engagement_codes_request (coi_request_id)
);

-- Atomic code generation (thread-safe)
CREATE PROCEDURE sp_GenerateEngagementCode
    @RegionCode VARCHAR(10),
    @CoiRequestId VARCHAR(50),
    @GeneratedBy INT,
    @NewCode VARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
    BEGIN TRANSACTION;

    DECLARE @nextVal BIGINT;
    DECLARE @currentYear INT = YEAR(GETUTCDATE());

    -- Attempt atomic increment (existing sequence)
    UPDATE engagement_code_sequences
    SET @nextVal = last_value = last_value + 1,
        updated_at = GETUTCDATE()
    WHERE sequence_name = @RegionCode AND year = @currentYear;

    -- If sequence doesn't exist for this region+year, create it
    IF @@ROWCOUNT = 0
    BEGIN
        SET @nextVal = 1;
        INSERT INTO engagement_code_sequences (sequence_name, last_value, year, updated_at)
        VALUES (@RegionCode, 1, @currentYear, GETUTCDATE());
    END

    -- Generate formatted code
    SET @NewCode = 'COI-' + CAST(@currentYear AS VARCHAR(4)) + '-' +
                   @RegionCode + '-' +
                   RIGHT('000000' + CAST(@nextVal AS VARCHAR(6)), 6);

    -- Insert engagement code record
    INSERT INTO engagement_codes (engagement_code, coi_request_id, status, generated_by, generated_at)
    VALUES (@NewCode, @CoiRequestId, 'PENDING', @GeneratedBy, GETUTCDATE());

    COMMIT TRANSACTION;
END;
```

### 6.2 Outbox Pattern (Reliable Async Integration)

```sql
-- Main outbox queue
CREATE TABLE outbox (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    event_type      VARCHAR(100) NOT NULL,
                    -- PRMS_CREATE_CLIENT, PRMS_CREATE_PROJECT,
                    -- PRMS_UPDATE_PARENT_COMPANY, EMAIL_NOTIFICATION
    payload         NVARCHAR(MAX) NOT NULL,       -- JSON payload
    correlation_id  VARCHAR(50) NOT NULL,          -- For distributed tracing
    idempotency_key VARCHAR(100) NOT NULL,         -- Prevents duplicate processing
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                    -- PENDING -> PROCESSING -> COMPLETED | FAILED -> DEAD_LETTER
    retry_count     INT NOT NULL DEFAULT 0,
    max_retries     INT NOT NULL DEFAULT 5,
    next_retry_at   DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    last_error      NVARCHAR(MAX) NULL,
    created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    processed_at    DATETIME2 NULL,
    created_by      INT NOT NULL,

    CONSTRAINT CK_outbox_payload_json CHECK (ISJSON(payload) = 1),
    CONSTRAINT UQ_outbox_idempotency UNIQUE (idempotency_key),
    INDEX IX_outbox_status_retry (status, next_retry_at)
        WHERE status IN ('PENDING', 'FAILED')
);

-- Dead letter queue (permanently failed messages)
CREATE TABLE outbox_dead_letter (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    original_message_id BIGINT NOT NULL,
    event_type          VARCHAR(100) NOT NULL,
    payload             NVARCHAR(MAX) NOT NULL,
    correlation_id      VARCHAR(50) NOT NULL,
    idempotency_key     VARCHAR(100) NOT NULL,
    total_attempts      INT NOT NULL,
    final_error         NVARCHAR(MAX) NOT NULL,
    failed_at           DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    resolved_at         DATETIME2 NULL,          -- NULL until ops team resolves
    resolution_notes    NVARCHAR(MAX) NULL,

    CONSTRAINT CK_dead_letter_payload_json CHECK (ISJSON(payload) = 1),
    INDEX IX_dead_letter_unresolved (resolved_at) WHERE resolved_at IS NULL
);

-- Idempotency key tracking (prevents re-processing across restarts)
CREATE TABLE idempotency_keys (
    idempotency_key VARCHAR(100) PRIMARY KEY,
    result_status   VARCHAR(20) NOT NULL,        -- SUCCESS, FAILED
    result_payload  NVARCHAR(MAX) NULL,           -- Cached response from external system
    created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    expires_at      DATETIME2 NOT NULL            -- Clean up old keys periodically
);
```

### 6.3 Reconciliation Audit (Governance Safety Net)

```sql
CREATE TABLE reconciliation_violations (
    id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    audit_date          DATE NOT NULL,
    audit_run_id        VARCHAR(50) NOT NULL,     -- Groups violations from same run
    prms_project_id     VARCHAR(50) NOT NULL,
    engagement_code     VARCHAR(50) NULL,          -- NULL if missing entirely
    client_id           VARCHAR(50) NULL,
    violation_type      VARCHAR(50) NOT NULL,
                        -- MISSING_CODE, INVALID_CODE, EXPIRED_CODE, CLIENT_MISMATCH
    prms_created_by     VARCHAR(100) NOT NULL,     -- Who created in PRMS (for investigation)
    prms_created_at     DATETIME2 NOT NULL,
    detected_at         DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    status              VARCHAR(20) NOT NULL DEFAULT 'OPEN',
                        -- OPEN -> RESOLVED | FALSE_POSITIVE
    resolved_by         INT NULL,
    resolved_at         DATETIME2 NULL,
    resolution_notes    NVARCHAR(MAX) NULL,

    INDEX IX_violations_open (status, audit_date) WHERE status = 'OPEN',
    INDEX IX_violations_audit_run (audit_run_id)
);
```

### 6.4 HRMS Local Cache (CQRS Read Model)

```sql
CREATE TABLE employee_cache (
    employee_id     INT PRIMARY KEY,
    full_name       NVARCHAR(255) NOT NULL,
    email           NVARCHAR(255) NOT NULL,
    department      NVARCHAR(100) NULL,
    position        NVARCHAR(100) NULL,
    manager_id      INT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'Active',
    synced_at       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    INDEX IX_employee_cache_email (email),
    INDEX IX_employee_cache_dept (department)
);

CREATE TABLE user_group_cache (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    employee_id     INT NOT NULL,
    hrms_group_name VARCHAR(100) NOT NULL,
    coi_role        VARCHAR(50) NOT NULL,         -- Mapped: COI_Directors -> Director
    synced_at       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    INDEX IX_user_group_employee (employee_id),
    INDEX IX_user_group_role (coi_role)
);

CREATE TABLE sync_status (
    sync_type       VARCHAR(50) PRIMARY KEY,      -- HRMS_EMPLOYEES, HRMS_GROUPS, PRMS_CLIENTS
    last_sync_at    DATETIME2 NULL,
    last_sync_status VARCHAR(20) NOT NULL DEFAULT 'NEVER',
                    -- NEVER, SUCCESS, FAILED
    records_synced  INT NULL,
    last_error      NVARCHAR(MAX) NULL,
    next_sync_at    DATETIME2 NULL
);
```

---

## 7. INTEGRATION ARCHITECTURE

### 7.1 HRMS Integration (Read-Only Sync)

COI never queries HRMS directly. An HRMS Adapter syncs data to the local cache.

**Sync mechanism:**
- If HRMS exposes API: poll `GET /employees?modifiedSince={lastSync}` on schedule
- If HRMS only exposes Active Directory/LDAP: delta sync query
- Write results to `employee_cache` and `user_group_cache` tables
- Update `sync_status` table with last sync time and result

**COI dashboards and auth** query the local cache only. If HRMS is down, COI continues operating on cached data.

**Role mapping:**

| HRMS User Group | COI Role |
|-----------------|----------|
| COI_Directors | Director |
| COI_Compliance | Compliance |
| COI_Partners | Partner |
| COI_Finance | Finance |
| COI_Admin | Admin |
| COI_SuperAdmin | Super Admin |
| (default) | Team Member / Requester |

### 7.2 PRMS Integration (Adapter with Circuit Breaker)

All PRMS operations go through a single adapter module.

| Operation | Direction | Trigger | Outbox? |
|-----------|-----------|---------|---------|
| Validate client | COI -> PRMS | During COI request creation | No (synchronous, cached) |
| Create client | COI -> PRMS | On prospect-to-client conversion | Yes |
| Create project | COI -> PRMS | On Admin "execute" action | Yes |
| Update parent company | COI -> PRMS | On parent company update approval | Yes |
| Sync client list | PRMS -> COI | Scheduled (every 5 min) | No (background worker) |
| Reconciliation audit | COI <- PRMS | Nightly (2:00 AM Kuwait) | No (background worker) |

**Circuit breaker configuration:**
- **Failure threshold:** 50% failure rate over rolling 10-request window
- **Open state duration:** 30 seconds (then half-open, allow one probe request)
- **Library:** opossum (Node.js)
- **Fallback:** When circuit is open, PRMS writes are queued in outbox (processed when circuit closes)

### 7.3 Outbox Worker (Implementation Details)

**Polling strategy:**
- Poll interval: 5 seconds
- Batch size: 10 messages
- Claim mechanism: `UPDATE ... SET status = 'PROCESSING' ... WITH (UPDLOCK, READPAST)` (skip locked rows)
- Supports multiple worker instances for high availability

**Retry logic:**
- Exponential backoff with jitter: `delay = 2^retry_count * 1000ms + random(0..1000ms)`
- Example delays: 1s, 2s, 4s, 8s, 16s (plus jitter)
- After max retries (default 5): move to `outbox_dead_letter`, alert operations team

**Idempotency:**
- Before processing, check `idempotency_keys` table
- If key exists with SUCCESS status, skip processing (return cached result)
- Prevents duplicate creates on retry (e.g., PRMS received the request but COI didn't get the response)

**Dead letter handling:**
- Operations dashboard shows unresolved dead letter items
- Manual retry: move back to outbox with reset retry count
- Resolve: mark as resolved with notes (e.g., "manually created in PRMS")

### 7.4 Prospect-to-Client Conversion (Async Outbox Flow)

```
1. PRMS Admin approves client creation request in COI Admin Dashboard
2. COI creates client record locally (status: PENDING_SYNC)
3. Outbox enqueues:
   {
     event_type: "PRMS_CREATE_CLIENT",
     idempotency_key: "coi-client-{prospect_id}",
     payload: { clientData, coiReferenceId }
   }
4. Outbox Worker processes:
   a. Check idempotency_keys — skip if already processed
   b. Call PRMS Adapter -> POST /api/v1/clients
   c. On 201 (created) or 409 (already exists):
      - Update COI client record: prmsClientId, status = SYNCED
      - Store idempotency key with SUCCESS
   d. On failure (network, 500, etc.):
      - Increment retry_count, set next_retry_at with backoff
      - After max retries: move to dead letter, alert admin
5. Admin Dashboard shows sync status: PENDING_SYNC / SYNCED / SYNC_FAILED
```

User sees immediate success. PRMS sync happens asynchronously. COI is always the source of truth.

### 7.5 Parent Company Bidirectional Sync

**COI -> PRMS direction:**
1. User enters/updates parent company in COI request
2. If client exists in PRMS and PRMS has "TBD" or empty parent:
   -> Create `parent_company_update_request` (status: Pending)
3. PRMS Admin approves in Admin Dashboard
4. Outbox enqueues `PRMS_UPDATE_PARENT_COMPANY`
5. Worker calls PRMS Adapter -> `PATCH /api/v1/clients/{id}/parent-company`
6. COI record updated (prms_synced = true)

**PRMS -> COI direction:**
1. Scheduled client sync worker detects parent company change
2. Update `client_cache` table
3. Flag any active COI requests for that client for review

### 7.6 Email Service (O365)

| Aspect | Detail |
|--------|--------|
| **Provider** | Microsoft O365 (smtp.office365.com:587, TLS) |
| **Email source** | `employee_cache` (synced from HRMS) + COI user profile override |
| **Templates** | Database-driven (`email_templates` table), admin-configurable |
| **Delivery** | Outbox-backed with retry, delivery tracking, audit log |
| **Recipients** | Role-based lookup from local cache (no HRMS call at send time) |

---

## 8. PRODUCTION CODEBASE STRUCTURE

### 8.1 Modular Monolith Layout

```
coi-api/
|-- src/
|   |-- core/                           # COI business logic
|   |   |-- services/
|   |   |   |-- approvalService.ts              # Approval workflow orchestration
|   |   |   |-- engagementCodeService.ts        # Code generation and validation
|   |   |   |-- duplicationService.ts           # Fuzzy matching and detection
|   |   |   |-- rulesEngineService.ts           # Business rules (88 rules, IESBA)
|   |   |   |-- coiRequestService.ts            # Request lifecycle management
|   |   |   `-- reconciliationService.ts        # Nightly PRMS audit
|   |   |-- domain/
|   |   |   |-- coiRequest.ts                   # Domain entity
|   |   |   |-- engagementCode.ts               # Domain entity
|   |   |   `-- client.ts                       # Domain entity
|   |   `-- events/
|   |       |-- eventBus.ts                     # In-process event emitter
|   |       `-- eventHandlers.ts                # Approval state transitions
|   |
|   |-- adapters/                       # Anti-corruption layers
|   |   |-- prms/
|   |   |   |-- prmsAdapter.ts                  # PRMS API client
|   |   |   |-- prmsMapper.ts                   # Map COI domain <-> PRMS API contracts
|   |   |   `-- prmsHealthCheck.ts              # Health check + circuit breaker
|   |   |-- hrms/
|   |   |   |-- hrmsAdapter.ts                  # HRMS API/LDAP client
|   |   |   |-- hrmsSyncWorker.ts               # Background sync to local cache
|   |   |   `-- hrmsRoleMapper.ts               # HRMS groups -> COI roles
|   |   `-- email/
|   |       |-- emailAdapter.ts                 # O365 SMTP client
|   |       `-- emailTemplateService.ts         # Database-driven templates
|   |
|   |-- sync/                           # Background workers
|   |   |-- outboxProcessor.ts                  # Process outbox queue (batch claim, retry, dead letter)
|   |   |-- clientSyncWorker.ts                 # Periodic PRMS client list sync
|   |   `-- reconciliationWorker.ts             # Nightly PRMS project audit
|   |
|   |-- api/                            # Express routes (BFF for Vue frontend)
|   |   |-- routes/
|   |   |   |-- coi.routes.ts
|   |   |   |-- auth.routes.ts
|   |   |   |-- integration.routes.ts
|   |   |   |-- admin.routes.ts
|   |   |   |-- reconciliation.routes.ts        # Violation review + remediation
|   |   |   |-- validation.routes.ts            # /validate-engagement-code (external)
|   |   |   `-- health.routes.ts                # Health check endpoints
|   |   |-- middleware/
|   |   |   |-- auth.ts                         # JWT + SSO validation
|   |   |   |-- roleGuard.ts                    # Role-based access control
|   |   |   |-- correlationId.ts                # Distributed tracing
|   |   |   `-- rateLimiter.ts
|   |   `-- controllers/
|   |       |-- coiController.ts
|   |       |-- prospectController.ts
|   |       |-- approvalController.ts
|   |       |-- reconciliationController.ts     # Resolve/false-positive violations
|   |       `-- validationController.ts         # Engagement code validation
|   |
|   `-- infrastructure/                 # Cross-cutting concerns
|       |-- database/
|       |   |-- connection.ts                   # SQL Server connection pool (mssql)
|       |   |-- migrations/                     # SQL Server DDL migrations
|       |   `-- repositories/                   # Data access layer
|       |-- cache/
|       |   `-- cacheService.ts                 # Redis (or in-memory fallback)
|       |-- config/
|       |   |-- app.config.ts                   # Environment-based configuration
|       |   |-- prms.config.ts
|       |   |-- hrms.config.ts
|       |   `-- email.config.ts
|       |-- logging/
|       |   `-- logger.ts                       # Structured logging with correlation IDs
|       |-- secrets/
|       |   `-- secretsManager.ts               # Azure Key Vault or env-based
|       `-- health/
|           `-- healthCheck.ts                  # Aggregated health (DB, PRMS, HRMS, email)
```

---

## 9. EXISTING CODE — REFACTORING MAP

All refactoring replaces direct DB calls or mock logic with adapter calls. Business logic in controllers is preserved.

| File | Function | Current (Prototype) | Production Change |
|------|----------|--------------------|--------------------|
| `controllers/prospectController.js` | `checkPRMSClient()` L298-321 | Local DB query | Call `prmsAdapter.checkClient(code)` |
| `controllers/prospectClientCreationController.js` | `completeClientCreation()` L250-382 | Local DB insert | Create locally (PENDING_SYNC) + enqueue to outbox |
| `controllers/integrationController.js` | `createProject()` L55-95 | Local DB insert | Validate engagement code + enqueue to outbox |
| `controllers/coiController.js` | PRMS check L448-461 | Mock return | Call `prmsAdapter.checkClient()` |
| `controllers/parentCompanyUpdateController.js` | Approval flow | Local DB update | Outbox -> `prmsAdapter.updateClientParent()` |
| Auth middleware | Login/session | Mock JWT (any password) | SSO/AD via HRMS Adapter cache |
| Email service | Notifications | Console.log | `emailAdapter.send()` via outbox |
| (new) Reconciliation worker | — | Not present | Nightly PRMS audit + violation tracking |
| (new) Outbox processor | — | Not present | Batch claim + retry + dead letter |

---

## 10. PROTOTYPE vs PRODUCTION — COMPARISON

### 10.1 Infrastructure

| Aspect | Prototype | Production |
|--------|-----------|------------|
| **Database** | SQLite (local file) | SQL Server Enterprise (COI's own instance) |
| **Authentication** | Mock JWT (any password) | SSO / Active Directory via HRMS Adapter |
| **Email** | Console logging | O365 SMTP via Email Adapter (outbox-backed) |
| **File Storage** | Local filesystem | Azure Blob Storage |
| **Caching** | In-memory (basic) | Redis (Azure Cache for Redis) |
| **Data Scale** | 50 employees, 100 clients, 200 projects | 2,000+ clients, 10,000+ active projects |
| **External Systems** | Mock APIs (hardcoded data) | Adapter layer with circuit breaker + outbox |
| **Observability** | Console logs | Structured logging, correlation IDs, health checks |
| **Secrets** | Hardcoded / .env | Azure Key Vault |

### 10.2 Integration Approach

| Integration | Prototype | Production |
|-------------|-----------|------------|
| **PRMS** | Mock API (local DB) | PRMS Adapter -> PRMS REST API (no direct DB access) |
| **HRMS** | Mock API (hardcoded) | HRMS Adapter -> HRMS API/LDAP -> local cache |
| **Email** | Console output | Email Adapter -> O365 SMTP (outbox-backed) |
| **Client Master** | Local table (seeded) | Scheduled sync from PRMS via adapter |
| **User Auth** | Simple JWT/session | SSO/AD validated via HRMS Adapter cache |
| **Governance** | DB constraint (local) | COI Orchestration + reconciliation audit |

### 10.3 Architecture

| Aspect | Prototype | Production |
|--------|-----------|------------|
| **Form Fields** | Hardcoded in Vue components | Database-driven dynamic configuration |
| **Business Rules** | Application logic | Application logic (same engine, no stored procs needed) |
| **Engagement Codes** | App-level counter | SQL Server SERIALIZABLE stored procedure |
| **Fuzzy Matching** | Fetch-all + Levenshtein | SQL Server Full-Text + DIFFERENCE() pre-filter |
| **Document Mgmt** | Local files | Azure Blob Storage with metadata DB |
| **Audit Logging** | Basic console | Structured audit with correlation IDs |
| **Project Creation** | Local mock insert | COI orchestrates via PRMS Adapter + outbox |
| **Governance** | Local DB foreign key | API orchestration + nightly reconciliation audit |
| **Failure Handling** | None | Circuit breaker + outbox retry + dead letter |

---

## 11. PRODUCTION BUILD PHASES

### Phase 1 — Foundation (HIGH Priority)

**Database:**
- Migrate SQLite schema to SQL Server DDL
- Set up connection pooling (mssql driver)
- Create outbox, outbox_dead_letter, idempotency_keys tables
- Create employee_cache, user_group_cache, sync_status tables
- Create engagement_code_sequences and sp_GenerateEngagementCode stored procedure
- Indexing strategy for COI request queries and fuzzy search
- Backup and disaster recovery plan

**Authentication:**
- Integrate SSO / Active Directory
- HRMS Adapter: sync user groups to local cache
- Map HRMS groups to COI roles
- JWT with secure secret management (Azure Key Vault)

**PRMS Adapter (Client Operations):**
- `checkClient(clientCode)` — synchronous, with Redis cache
- `createClient(clientData)` — outbox-backed, idempotent
- Circuit breaker wrapping all PRMS calls (opossum)
- Code to refactor:
  - `controllers/prospectController.js` L298-321: route through PRMS Adapter
  - `controllers/prospectClientCreationController.js` L250-382: async outbox flow

**HRMS Adapter:**
- Sync worker: poll HRMS API or LDAP on schedule (configurable: 5-15 min)
- Write to employee_cache, user_group_cache tables
- Dashboard queries read from local cache only

**Outbox Processor:**
- Batch claim with UPDLOCK, READPAST
- Exponential backoff with jitter
- Dead letter after max retries
- Idempotency key checking

### Phase 2 — Orchestration (MEDIUM Priority)

**Project Creation Orchestration:**
- `createProject(engagementCode, projectData)` — validates code, enqueues to outbox, links result
- Code to refactor:
  - `controllers/integrationController.js` L55-95: route through PRMS Adapter + outbox
  - `controllers/coiController.js` L448-461: route through PRMS Adapter

**Engagement Code Validation Endpoint:**
- `POST /api/v1/validate-engagement-code` — standalone, for PRMS or API Gateway
- Returns: `{ valid, status, approvedBy, clientId, expiresAt }`

**Reconciliation Audit:**
- Nightly worker (2:00 AM Kuwait): fetch PRMS projects, compare to COI codes
- Insert violations to reconciliation_violations table
- Alert Compliance team if violations found
- Remediation API: resolve or mark false positive

**Parent Company Sync:**
- COI -> PRMS: via parent_company_update_request approval + outbox
- PRMS -> COI: via scheduled client sync worker

### Phase 3 — Enterprise Features (LOWER Priority)

**Email (O365):**
- Email Adapter with O365 SMTP (smtp.office365.com:587, TLS)
- Database-driven templates (admin-configurable)
- Outbox-backed delivery with retry and tracking
- Email source: employee_cache + COI profile override

**Dynamic Field Configuration:**
- `coi_field_config`, `coi_field_options`, `coi_field_conditions` tables
- Admin UI for field management (no code changes needed)
- Full audit trail via `coi_field_config_history`

**Observability:**
- Structured logging (pino) with correlation IDs across all adapter calls
- Health check endpoint: `/api/health` (aggregates DB, PRMS, HRMS, email status)
- Azure Application Insights integration
- Circuit breaker metrics per adapter
- Dead letter queue monitoring dashboard

**Secrets Management:**
- Azure Key Vault for: PRMS API credentials, HRMS connection, SMTP password, JWT secret
- No credentials in .env files or source code in production
- Credential rotation schedule

---

## 12. TECHNOLOGY STACK (Production)

Aligned with BDO's Microsoft ecosystem.

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | Vue 3 + TypeScript + Tailwind CSS | Same as prototype |
| **Backend** | Node.js + Express + TypeScript | Same runtime, add TypeORM/Prisma for SQL Server |
| **Database** | SQL Server Enterprise | COI's own instance (database-per-service) |
| **ORM** | TypeORM or Prisma | Type-safe queries, migration tooling |
| **Cache** | Azure Cache for Redis | Dashboard reads, client cache, adapter responses |
| **File Storage** | Azure Blob Storage | Documents, ISQM forms |
| **Email** | O365 SMTP (nodemailer) | Via Email Adapter, outbox-backed |
| **Auth** | Azure Active Directory / SSO | Via HRMS Adapter cache |
| **Secrets** | Azure Key Vault | All credentials and API keys |
| **API Gateway** | Azure APIM (or Nginx if on-prem) | Rate limiting, SSO, logging |
| **Circuit Breaker** | opossum (Node.js) | Wraps PRMS and HRMS adapter calls |
| **Logging** | pino | Structured JSON, correlation IDs |
| **Monitoring** | Azure Application Insights | Health checks, metrics, alerting |

---

## 13. TESTING & VERIFICATION

### Existing Test Coverage (Prototype)

- Playwright E2E tests covering core workflows
- Build verification reports (BUILD_VERIFICATION_SUMMARY.md)
- Requirements coverage report (REQUIREMENTS_COVERAGE_REPORT.md)
- Permission system verification (end-to-end verified)
- Feature delivery report (COI_SYSTEM_FEATURE_DELIVERY_REPORT.md)

### Production Testing Required

**Integration Tests:**
- [ ] PRMS Adapter: client validate, create client, create project, update parent
- [ ] HRMS Adapter: sync worker, role mapping, cache population
- [ ] Email Adapter: O365 send, retry, template rendering

**Outbox & Reliability Tests:**
- [ ] Outbox processor: batch claim, retry logic, exponential backoff with jitter
- [ ] Dead letter: move after max retries, manual retry from dead letter
- [ ] Idempotency: duplicate idempotency keys handled correctly
- [ ] Circuit breaker: trip, queue fallback, half-open probe, recovery

**Governance Tests:**
- [ ] Reconciliation audit: detect MISSING_CODE, INVALID_CODE, EXPIRED_CODE, CLIENT_MISMATCH
- [ ] Reconciliation remediation: resolve, false-positive workflows
- [ ] Engagement code concurrency: parallel generation produces unique codes

**Infrastructure Tests:**
- [ ] SQL Server migration validation (all data types, constraints, indexes)
- [ ] SSO/AD authentication flow
- [ ] Azure Key Vault secret retrieval
- [ ] Health check endpoint (all adapters reporting)
- [ ] Degraded mode: PRMS down (outbox queues), HRMS down (cache serves)

**Scale & Regression Tests:**
- [ ] Load testing: 2,000+ clients, 10,000+ projects, 100 concurrent requests
- [ ] Chaos testing: PRMS failure scenarios, HRMS timeout scenarios
- [ ] Full regression of all 7 role-based dashboards
- [ ] Parent company bidirectional sync
- [ ] Security audit: penetration test on validation API and auth flow

---

## 14. RISK REGISTER

| Risk | Impact | Mitigation |
|------|--------|------------|
| PRMS users bypass COI and create projects directly | **Critical** — governance violated | Reconciliation audit (nightly); Compliance alerts; transition training; remediation API |
| HRMS unavailable | High — no fresh user/role data | Local cache (CQRS read model); COI operates on cached data; sync_status monitoring |
| PRMS API unavailable | High — can't sync projects | Circuit breaker + outbox queue; items processed when PRMS recovers; dead letter for permanent failures |
| Concurrent engagement code generation | High — duplicate codes | SQL Server SERIALIZABLE stored procedure with atomic UPDATE + @@ROWCOUNT check |
| Data sync conflicts (COI <-> PRMS) | Medium — stale data | Clear source-of-truth per field; idempotency keys; outbox ensures ordered processing |
| Adapter API contract changes | Medium — integration breaks | API versioning in adapters; health checks detect failures early; circuit breaker isolates impact |
| Secrets exposure | High — security breach | Azure Key Vault; no .env in production; rotation schedule |
| Outbox permanently failed messages | Medium — lost integration events | Dead letter queue with monitoring; operations dashboard; manual retry capability |
| No distributed tracing | Medium — debugging difficulty | Correlation IDs in all adapter calls and outbox messages; structured logging (pino) |

---

## 15. DECISION LOG

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Monolith vs Microservices** | Modular monolith | Single deployable unit reduces operational overhead for BDO's ~10K-project scale; can extract services later if needed |
| **Outbox vs RabbitMQ** | Database-backed outbox | Eliminates message broker infrastructure; simpler ops for BDO IT team; transactional consistency with COI database |
| **Orchestration vs DB Constraint** | COI orchestrates project creation | Non-invasive to PRMS; no ALTER TABLE risks; allows gradual migration; PRMS only adds one optional field |
| **SQL Server Full-Text vs Elasticsearch** | SQL Server DIFFERENCE() + Full-Text | At 10K records, in-app Levenshtein + SQL indexing is sufficient; eliminates ES cluster management |
| **Circuit breaker library** | opossum (Node.js) | Mature, well-tested, lightweight; per-adapter isolation; configurable thresholds |
| **Retry strategy** | Exponential backoff with jitter | Prevents thundering herd on PRMS recovery; jitter distributes retry load |
| **Cache** | Redis (Azure Cache for Redis) | Fast dashboard reads; degrade gracefully to in-memory if Redis unavailable |
| **Azure vs AWS** | Azure-native stack | Aligns with BDO's existing Microsoft ecosystem (SQL Server, O365, Active Directory) |
| **Reconciliation approach** | Alert, don't block | During transition, users need time to adopt new workflow; blocking would cause operational disruption |

---

## 16. DELIVERABLES CHECKLIST

- [ ] API contract document (Section 5) shared with PRMS team for endpoint development
- [ ] Azure AD app registrations for COI and PRMS service-to-service auth
- [ ] SQL Server DDL scripts (engagement codes, outbox, dead letter, reconciliation, cache tables)
- [ ] sp_GenerateEngagementCode stored procedure (tested for concurrency)
- [ ] Outbox Processor implementation (TypeScript: batch claim, retry, dead letter)
- [ ] Reconciliation Auditor implementation (TypeScript + cron schedule)
- [ ] PRMS Adapter with circuit breaker, idempotency, and health check
- [ ] HRMS Adapter with sync worker and role mapping
- [ ] Email Adapter with O365 SMTP and template service
- [ ] Health check endpoints (`/api/health`) for all adapters
- [ ] Correlation ID middleware for distributed tracing
- [ ] Azure Key Vault integration for secrets
- [ ] Runbook: "What to do when PRMS is down"
- [ ] Runbook: "How to process dead letter items"
- [ ] Runbook: "How to resolve reconciliation violations"

---

## 17. REFERENCE DOCUMENTATION

| Document | Location |
|----------|----------|
| Detailed Prototype vs Production Guide | `docs/production-handover/Prototype_vs_Production_Handoff_Guide.md` |
| PRMS Integration Current State | `docs/production-handover/PRMS_INTEGRATION_CURRENT_STATE.md` |
| Permission System Verification | `docs/production-handover/PERMISSION_SYSTEM_VERIFICATION_REPORT.md` |
| COI Form Improvements (26 items) | `coi-prototype/COI_FORM_IMPROVEMENTS.md` |
| COI System Scope of Work | `docs/coi-system/COI_System_Prototype_Scope_of_Work.md` |
| IESBA vs CMA Service Mapping | `docs/coi-system/IESBA_vs_CMA_Service_Mapping.md` |
| User Journeys (End-to-End) | `docs/coi-system/User_Journeys_End_to_End.md` |
| Risk Analysis & Failure Points | `docs/coi-system/Risk_Analysis_and_Failure_Points.md` |
| Feature Delivery Report | `docs/analysis/COI_SYSTEM_FEATURE_DELIVERY_REPORT.md` |
| v1 Handover (superseded) | `docs/production-handover/COI_Prototype_to_Production_Handover_with_Project_Brief.md` |

---

## 18. NEXT STEPS

1. **Share API Contract (Section 5)** with PRMS team for endpoint development
2. **Provision Azure resources** (SQL Database, APIM, Key Vault, Redis, Blob Storage)
3. **Implement sp_GenerateEngagementCode** and test concurrency safety
4. **Build outbox processor** and validate retry + dead letter flow
5. **Build PRMS adapter** with circuit breaker and idempotency
6. **Build reconciliation auditor** and validate violation detection

---

## 19. SIGN-OFF

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Project Lead | | | |
| Technical Lead | | | |
| PRMS Team Lead | | | |
| Compliance Representative | | | |
| IT Infrastructure | | | |

---

*Version 3.0 — Merged document combining handover context, architecture specification, API contracts, and implementation details.*
*Supersedes v1.0 (tight-coupling) and v2.0 (architecture only).*
*Source: Envision PRMS COI System prototype documentation.*
