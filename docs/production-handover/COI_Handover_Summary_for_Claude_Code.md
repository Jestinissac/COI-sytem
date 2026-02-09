# COI Prototype — Handover Summary for Claude Code

**Purpose:** Give this document to Claude Code (or any production implementer) as the single source of: (1) what is **done** in the current build vs handover docs, (2) what is **not done** (production-only), (3) known gaps to fix before or during production, and (4) how to use this as **inputs** for production work.

**Date:** February 9, 2026  
**Verified against:** Current codebase, `COI_Prototype_to_Production_Handover_with_Project_Brief.md`, `Prototype_vs_Production_Handoff_Guide.md`, `production-handover-readiness` skill, `BUILD_VERIFICATION_REPORT.md`

---

## 1. What Is DONE (Verified Against Current Build)

### 1.1 Prototype success criteria (handover Section 2.2) — Met

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Database constraint prevents bypass (no project without valid engagement code) | Done | `integrationController.createProject` validates engagement code; `prms_projects` table + trigger (SQLite) |
| Approval workflow enforced (Director → Compliance → Partner → Finance → Admin) | Done | `coiController.js` approve/reject with role-based `nextStatus`; no skip |
| Engagement code generation and validation operational | Done | `engagementCodeService.js`, `integrationController.validateEngagementCode`, `createProject` |
| Fuzzy matching duplication checks (Levenshtein + scoring) | Done | `duplicationCheckService.js`; block/flag + duplicate justification on submit |
| End-to-end COI request flow | Done | 7-step wizard + detail/approval flows; all role dashboards |
| Mock PRMS integration (engagement codes, clients, project create) | Done | `integrationController.js`: `getClients`, `validateEngagementCode`, `createProject` (local DB) |
| Business Rules Engine (88 rules) | Done | `businessRulesEngine.js`, `rulesEngineService.js`, CMA/IESBA |
| IESBA compliance framework (Pro edition) | Done | Red lines, decision matrix, rule evaluation |
| 26 UI/UX improvements | Done | Documented in `coi-prototype/docs/reference/COI_FORM_IMPROVEMENTS.md` |

### 1.2 Key prototype components present

| Area | Location | Notes |
|------|----------|--------|
| Frontend | `coi-prototype/frontend/` | Vue 3 + TypeScript + Tailwind; 7 role dashboards (Requester, Director, Compliance, Partner, Finance, Admin, Super Admin) |
| Backend | `coi-prototype/backend/src/` | Express, controllers/services/routes; auth middleware sets `req.userId`, `req.userRole` (not `req.user`) |
| Database | `coi-prototype/database/` | SQLite schema + migrations (e.g. permissions, parent_company_update_requests, notification_queue, lead_sources, prospects) |
| Data segregation | `responseMapper.js`, `dataSegregation.js` | `mapResponseForRole(rawData, req.userRole)` used in coiController and myDayWeekController; Compliance gets no financial_parameters, engagement_code, total_fees, fee_details |
| Parent company update workflow | `parentCompanyUpdateController.js`, `ParentCompanyUpdateRequestsPanel.vue` | Request → PRMS Admin approve/reject → mock update (production: call PRMS API) |
| Resubmission workflow | `coiController.resubmitRejectedRequest`, `rejection_type` | fixable vs permanent; only fixable can resubmit |
| Permission system | `permissionService.js`, `PermissionConfig.vue`, `usePermissions.ts` | 24 permissions, role-permission mapping, audit log, Super Admin only config |
| E2E tests | `coi-prototype/e2e/tests/`, `playwright.config.ts` | Playwright; `npm run test:e2e` |
| Build verification | `coi-prototype/docs/BUILD_VERIFICATION_REPORT.md` | User journeys + business logic Pass; emoji/logging issues documented |

### 1.3 Features listed in Prototype vs Production Handoff Guide — Present in build

- Finance module (financial parameters modal, code preview, backend validation, display)
- Resubmission (rejection_type, resubmit endpoint, UI)
- Notifications (notificationService, emailService — mock/console; role-based, templates)
- Foreign key / cascade delete (draft delete in coiController)
- Rule deduplication (configController identifyDuplicates, cleanup endpoint)
- Parent company bidirectional sync (read TBD/empty; update request + approval panel)
- Conflict detection UI (expandable sections, clickable items)
- Dynamic permission system (permissions, role_permissions, permission_audit_log)
- Prospects/CRM (prospects, lead_sources, funnel events, stale detection)
- My Day/Week/Month (myDayWeekService, myDayWeekController, views)
- Notification batching (notification_queue, notification_stats; flush job not wired to cron in prototype)
- Service catalog (entity_codes, service_catalog_global, service_catalog_entities)
- Company relationships / IESBA 290.13 (company_type, parent_company_id, group_structure, etc.)
- Master search (GlobalSearch.vue, shortcut, relevance, fuzzy)

---

## 2. What Is NOT Done (Production-Only)

These are **not** in the prototype; they are specified in the handover for production implementation.

| Item | Handover reference | Production action |
|------|--------------------|-------------------|
| Outbox pattern | Handover Section 6.2, 7.3 | Implement `outbox`, `outbox_dead_letter`, `idempotency_keys`; outbox processor (batch claim, retry, dead letter) |
| Reconciliation audit | Handover Section 4.2, 6.3 | Nightly job: fetch PRMS projects, compare to COI engagement_codes, insert reconciliation_violations; remediation API |
| PRMS Adapter | Handover Section 7.2, 8.1 | Replace local/mock calls with `prmsAdapter` (checkClient, createClient, createProject, updateParentCompany) via REST |
| HRMS Adapter | Handover Section 7.1, 8.1 | HRMS sync worker → employee_cache, user_group_cache; dashboards read cache only |
| SSO / Azure AD auth | Handover Section 10.1, Prototype guide Section 5 | Replace mock JWT login with SSO/AD; role from HRMS groups |
| Real email | Handover Section 7.6, Prototype guide Section 6 | O365 SMTP via email adapter; outbox-backed delivery |
| SQL Server | Handover Section 6 | Migrate schema + migrations to SQL Server; sp_GenerateEngagementCode (thread-safe), indexes |
| Dynamic field config (DB-driven forms) | Prototype guide Section 3 | coi_field_config, coi_field_options, coi_field_conditions; admin UI; optional for Phase 2 |
| Circuit breaker | Handover Section 7.2 | opossum (or similar) around PRMS/HRMS adapter calls |
| Azure (Key Vault, Blob, APIM, App Insights) | Handover Section 12 | Secrets, file storage, API gateway, monitoring |

---

## 3. Known Gaps (Fix Before or During Production)

From BUILD_VERIFICATION_REPORT.md and code-quality rules:

| Gap | Severity | Location | Action for Claude Code |
|-----|----------|----------|-------------------------|
| Emojis in email/notification content | High | notificationService.js, emailService.js | Remove all emojis from subjects and bodies; use plain text (e.g. "URGENT: Request REQ-001 - SLA Critical"). |
| console.log in production paths | Medium | coiController, configController, authController, notificationService, monitoringService | Introduce devLog (gated by isDevelopment()); replace debug console.log with devLog. |
| Handover doc reference | Low | Handover Section 2.2 | COI_FORM_IMPROVEMENTS.md lives at `coi-prototype/docs/reference/COI_FORM_IMPROVEMENTS.md` (not in root). |

---

## 4. Key File and Doc References

| Purpose | Path |
|---------|------|
| Main handover (architecture, API contract, phases) | `coi-prototype/docs/production-handover/COI_Prototype_to_Production_Handover_with_Project_Brief.md` |
| Prototype vs production (placeholders, DB, integrations) | `docs/production-handover/Prototype_vs_Production_Handoff_Guide.md` |
| Production handover readiness skill | `docs/cursor-skills/production-handover-readiness.md` |
| Build verification (what passed/failed) | `coi-prototype/docs/BUILD_VERIFICATION_REPORT.md` |
| Auth pattern (req.userId / req.userRole) | `.cursor/rules/backend-patterns.mdc`, `.cursor/rules/coi-code-quality-checklist.mdc` |
| Response mapper | `coi-prototype/backend/src/utils/responseMapper.js` |
| PRMS/HRMS touchpoints | `coi-prototype/docs/PRMS_INTEGRATION_TOUCHPOINTS.md` (if present) |

---

## 5. How to Use This as Inputs for Claude Code

### 5.1 Suggested prompt prefix (for Claude Code)

You can paste something like this when handing off to Claude Code:

```
You are implementing production COI from the prototype. Use this handover summary as the source of truth.

Context:
- Read: docs/production-handover/COI_Handover_Summary_for_Claude_Code.md
- Prototype code: coi-prototype/backend and coi-prototype/frontend
- Full handover (API contract, SQL Server, outbox, reconciliation): coi-prototype/docs/production-handover/COI_Prototype_to_Production_Handover_with_Project_Brief.md
- Prototype vs production details: docs/production-handover/Prototype_vs_Production_Handoff_Guide.md

Rules:
- Auth: use req.userId and req.userRole only (never req.user).
- All endpoints returning COI request data must use mapResponseForRole(data, req.userRole).
- No emojis in email or notification content.
- Use parameterized queries; no string interpolation of user input in SQL.
```

### 5.2 Inputs Claude Code should expect

- **Task type:** e.g. “Implement outbox processor”, “Add PRMS adapter and replace createProject”, “Migrate schema to SQL Server”, “Remove emojis from notificationService”.
- **Scope:** Which module (backend/frontend), which file or area (e.g. integration, auth, email).
- **Constraints:** Environment (Node version, SQL Server version), no new heavy dependencies unless specified.
- **Acceptance:** Reference handover section or checklist item (e.g. “Section 6.2 outbox”, “Section 13 integration tests”).

### 5.3 Outputs to ask from Claude Code

- Code changes with file paths.
- Short note on “prototype vs production” where behavior diverges (e.g. “here we call PRMS API instead of local DB”).
- Any new env vars or config.
- If adding endpoints: method, path, auth, and relation to handover Section 5 (API contract).

---

## 6. One-Paragraph Summary for Copy-Paste

**COI prototype:** Vue 3 + Express + SQLite prototype is complete for all handover Section 2.2 success criteria: approval workflow, engagement codes, duplication checks, mock PRMS/HRMS, 7 role dashboards, data segregation (mapResponseForRole), parent company update workflow, resubmission, permissions, prospects/CRM, My Day/Week, notifications (mock). Not in prototype: outbox, reconciliation audit, real PRMS/HRMS adapters, SSO, O365 email, SQL Server migration, circuit breaker, Azure. Known gaps: remove emojis from email/notification content; replace debug console.log with devLog. Use COI_Handover_Summary_for_Claude_Code.md plus the main handover and Prototype_vs_Production_Handoff_Guide as inputs for production work; give Claude Code the prompt prefix and input/output format above for consistent handoff.
