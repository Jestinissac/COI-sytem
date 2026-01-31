# Envision COI System

**Governance Before Every Engagement**

BDO Al Nisf & Partners | Envision PRMS Platform | January 2026

---

## The Problem

Issuing proposals or engagement letters without a documented, approved conflict-of-interest review exposes the firm to regulatory sanctions, reputational damage, and IESBA non-compliance. Manual checks are inconsistent, unauditable, and easy to bypass — creating blind spots that regulators and quality reviewers will find.

## The Solution

The Envision COI System is an **upstream governance gatekeeper** for PRMS. No project can be created — and no engagement code issued — without a fully documented, multi-level COI review. The system enforces compliance *before* any client work begins, not after.

---

## Core Workflow

```
 Requester        Director       Compliance       Partner        Finance         Admin           PRMS
    |                |               |               |              |               |              |
    |  Create COI    |               |               |              |               |              |
    |  Request       |               |               |              |               |              |
    |  (7-section    |               |               |              |               |              |
    |   form)        |               |               |              |               |              |
    +--------------->|  Review &     |               |              |               |              |
                     |  Approve      |               |              |               |              |
                     +-------------->|  Duplication   |              |               |              |
                                     |  Detection &  |              |               |              |
                                     |  Assessment   |              |               |              |
                                     +-------------->|  Final       |               |              |
                                                     |  Approval    |               |              |
                                                     +------------>|  Generate     |              |
                                                                    |  Engagement   |              |
                                                                    |  Code         |              |
                                                                    +-------------->|  Execute     |
                                                                                    |  Proposal    |
                                                                                    +------------>|
                                                                                    | Create       |
                                                                                    | Project      |
```

**Governance enforcement:** COI is the sole entry point for project creation. A nightly reconciliation audit detects any bypass attempts.

---

## Key Features

- **7 role-based dashboards** with department-level data segregation (Requester, Director, Compliance, Partner, Finance, Admin, Super Admin)
- **88 business rules** across Standard and Pro editions — configurable without code changes
- **IESBA compliance framework** with CMA service matrix, Red Lines detection, and PIE-specific restrictions
- **Fuzzy duplication detection** using Levenshtein distance scoring with SOUNDEX/DIFFERENCE() pre-filtering
- **Auto-generated engagement codes** with database constraint enforcement — thread-safe, no duplicates
- **Prospect-to-client conversion** with parent company bidirectional sync between COI and PRMS
- **Dynamic field configuration** — admin-managed form fields, options, and conditional logic; no developer intervention required
- **O365 email notifications** with database-driven templates, outbox-backed delivery, and tracking

---

## Integration Points

| System | Direction | Purpose |
|--------|-----------|---------|
| **PRMS** | COI --> PRMS | Client validation, project creation orchestration, engagement code enforcement |
| **HRMS** | HRMS --> COI | Employee sync, role mapping, department data (local cache — COI operates if HRMS is down) |
| **O365** | COI --> O365 | Email notifications with retry, delivery tracking, and audit log |
| **Active Directory** | AD --> COI | SSO authentication, user group-to-role mapping |

---

\pagebreak

## Architecture Overview

```
+------------------+       +------------------+       +------------------+
|  COI Frontend    | <---> |  COI API Core    | <---> |  SQL Server      |
|  (Vue 3 + TS)    |       |  (Node.js)       |       |  (COI Database)  |
+------------------+       +--------+---------+       +------------------+
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
               | Azure AD  |  | PRMS API |
               |  / LDAP   |  | (REST)   |
               +----------+  +----------+
```

**Standalone API-first system** — modular monolith with clean internal boundaries. Anti-corruption layers (adapters) isolate COI from external system changes. Circuit breakers and an outbox queue ensure reliable integration even during external system downtime.

**Azure-native stack:** SQL Server Enterprise, Azure Cache for Redis, Azure Blob Storage, Azure Key Vault, Application Insights.

---

## Scale & Performance

| Metric | Target |
|--------|--------|
| Clients | 2,000+ |
| Active projects | 10,000+ |
| Concurrent users | 100+ |
| Caching | Redis (dashboard reads, client lookups, adapter responses) |
| Reliability | Circuit breaker + outbox retry + dead letter queue |
| Governance | Nightly reconciliation audit (2:00 AM Kuwait time) |

---

## Prototype Status

A **fully functional prototype** has been delivered and verified:

| Component | Technology | Status |
|-----------|-----------|--------|
| Frontend | Vue 3 + TypeScript + Tailwind CSS | Complete |
| Backend | Node.js + Express | Complete |
| Database | SQLite (prototype) | Complete |
| Testing | Playwright E2E tests | Complete |
| Documentation | 150+ markdown files | Complete |
| UI/UX | 26 improvements across 6 files | Complete |

All 7 success criteria met: engagement code enforcement, approval workflow, duplication detection, business rules engine (88 rules), IESBA framework, end-to-end flow verification, and PRMS mock integration.

---

## Production Roadmap

| Phase | Scope | Priority |
|-------|-------|----------|
| **Phase 1 — Foundation** | SQL Server migration, SSO/Active Directory auth, HRMS adapter with local cache, PRMS client adapter with circuit breaker, outbox processor with retry and dead letter | High |
| **Phase 2 — Orchestration** | Project creation via PRMS adapter, engagement code validation API, nightly reconciliation audit, parent company bidirectional sync | Medium |
| **Phase 3 — Enterprise** | O365 email with templates and tracking, dynamic field configuration (admin UI), structured logging with correlation IDs, Azure Key Vault secrets, Application Insights monitoring | Lower |

**PRMS team requirement (minimal):** Accept an `engagementCode` field in the project creation API. No `ALTER TABLE`, no foreign keys, no cross-database dependencies.

---

## Next Step

**Approve the production build** and schedule coordination with the PRMS development team to implement the EngagementCode field in the project creation API. The API contract specification (OAuth2, idempotency, full request/response schemas) is ready for handoff.

---

*Envision COI System v3.0 — Standalone API-First Architecture ("Gatekeeper as a Service")*
*Prepared by Envision Business Solutions for BDO Al Nisf & Partners*
