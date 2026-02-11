# COI: Execution Plan — Production Handover & Customer Testing Readiness

**Purpose:** Single reference for any developer to execute production handover readiness and customer-testing gap fixes. No prior COI context required; each item is specific and verifiable.

**Date:** February 2026  
**Scope:** (1) Production handover readiness checklist and verification, (2) Customer testing gap fixes in phases A–E (optional F).

---

## Part 1 — Production Handover Readiness

Complete these **before** sign-off. They verify that the prototype meets handover criteria and docs are aligned.

### 1.1 Build verification

| # | Action | How to verify |
|---|--------|----------------|
| 1 | User journeys work for all roles | Log in as Requester, Director, Compliance, Partner, Finance, Admin, Super Admin; complete at least one full flow Draft → … → Active. |
| 2 | Business rules enforced | No engagement code without full approval chain; duplication check blocks/flags; department segregation (Requester sees own, Director sees team, etc.). |
| 3 | No emojis in UI/email/notifications | Search codebase for emoji in notification/email content; replace with plain text (see Phase A1). |
| 4 | Design / copy | No AI filler; human-like copy; Dieter Rams compliance per BUILD_VERIFICATION_REPORT if applicable. |

**Reference:** `coi-prototype/docs/BUILD_VERIFICATION_REPORT.md`, `docs/coi-system/User_Journeys_End_to_End.md`.

### 1.2 Handover document alignment

| # | Action | How to verify |
|---|--------|----------------|
| 1 | Handover doc matches build | Ensure `coi-prototype/docs/production-handover/COI_Prototype_to_Production_Handover_with_Project_Brief.md` Section 2 (Prototype Delivery Summary) and Section 16 (Deliverables) reflect current features and prototype-done vs production-todo. |
| 2 | Prototype vs production explicit | `docs/production-handover/Prototype_vs_Production_Handoff_Guide.md` and `docs/production-handover/COI_Handover_Summary_for_Claude_Code.md` list what is done vs production-only. |
| 3 | API contract (Section 5) and next steps (Section 18) | Handover doc Section 5 and 18 are actionable for PRMS/implementation team. |

### 1.3 Security and data segregation

| # | Action | How to verify |
|---|--------|----------------|
| 1 | Auth context | Backend uses `req.userId` and `req.userRole` only (never `req.user`). Grep for `req.user.` and `req.user?` in backend; expect no matches. |
| 2 | Response mapper | Every endpoint that returns full COI request data uses `mapResponseForRole(data, req.userRole)`. Check: `coi-prototype/backend/src/controllers/coiController.js`, `myDayWeekController.js`. |
| 3 | Sensitive routes protected | All COI/admin/integration routes use `authenticateToken` and appropriate `requireRole()` or `requirePermission()`. |
| 4 | Parameterized queries | No user input concatenated into SQL; use `.prepare()` with `?` placeholders. |

**Reference:** `.cursor/rules/backend-patterns.mdc`, `.cursor/rules/coi-code-quality-checklist.mdc`.

### 1.4 Sign-off readiness

| # | Action |
|---|--------|
| 1 | No open P0/P1 blockers for handover acceptance. |
| 2 | Section 19 sign-off table in handover doc has roles and next steps clear. |
| 3 | Production testing required (Section 13) — checklist available for integration, outbox, governance, infra, scale tests. |

---

## Part 2 — Customer Testing Readiness (Gap Fixes)

Execute in order: **Phase A → B → C → D → E**. Optional **Phase F** only if SSO is required for the demo.

---

### Phase A: Critical Blockers

#### A1. Remove emojis from notification/email content

| Item | Detail |
|------|--------|
| **Files** | `coi-prototype/backend/src/services/notificationService.js`, `coi-prototype/backend/src/services/emailService.js` |
| **Action** | Search for emoji characters (e.g. 🔴, ⚠️, 🚨, ✅, ❌, 📋) in subject and body strings. Replace with plain text (e.g. "URGENT", "SLA BREACHED", "APPROVED WITH RESTRICTIONS", "INFORMATION REQUIRED"). |
| **Acceptance** | No emoji in any email subject or body; run grep for common emoji in these two files and get zero matches. |

#### A2. Replace console.log with devLog

| Item | Detail |
|------|--------|
| **Files** | Create or extend: `coi-prototype/backend/src/config/environment.js` (or new `coi-prototype/backend/src/utils/devLog.js`). Then: `coiController.js`, `configController.js`, `authController.js`, `notificationService.js`, `monitoringService.js`. |
| **Action** | (1) Export `devLog` that calls `console.log` only when `isDevelopment()` or `process.env.NODE_ENV !== 'production'`. (2) Replace every debug `console.log` in the five files with `devLog`. Leave `console.error` for real errors. |
| **Acceptance** | With `NODE_ENV=production`, no debug output from these files; with `NODE_ENV=development`, debug output still appears. |

#### A3. Fix hardcoded data

| Item | Detail |
|------|--------|
| **Step6 Signatories** | **File:** `coi-prototype/frontend/src/components/coi-wizard/Step6Signatories.vue`. **Action:** Remove hardcoded array of 3 employees (e.g. John Smith, Sarah Johnson, Michael Brown). Fetch from `GET /api/auth/users` (auth routes are under `/api/auth`). Filter to active users (truthy check on `user.active`). **Acceptance:** Signatory dropdown is populated from API. |
| **Step1 Entity** | **File:** `coi-prototype/frontend/src/components/coi-wizard/Step1Requestor.vue`. **Action:** Replace single hardcoded option "BDO Al Nisf & Partners" with options from `GET /api/entity-codes`. Use `entity_display_name` or `entity_name` for display; store `entity_name` in form. Set default via `emit('update', { entity: ... })` only (do not mutate `formData` prop). **Acceptance:** Entity dropdown is populated from API. |
| **Reference** | Model feedback and ratings (Qwen 3, Llama 70B, Qwen 2.5): `docs/production-handover/Phase_A3_Model_Feedback_and_Ratings.md`. Use Step6 pattern and corrected Step1 scope (change only Entity dropdown; keep Requestor Information layout). |

#### A4. Wire "Request New Client" to CreateProspectModal

| Item | Detail |
|------|--------|
| **File** | `coi-prototype/frontend/src/components/coi-wizard/Step3Client.vue` |
| **Action** | Remove the `info('Client request feature - coming soon')` call. Import and use `CreateProspectModal` from `coi-prototype/frontend/src/components/coi/CreateProspectModal.vue`. On "Request New Client" click, open the modal; pass callback to refresh client list or set selected prospect if needed. |
| **Acceptance** | Clicking "Request New Client" opens CreateProspectModal; after creating prospect, list updates or selection is set as specified. |

#### A5. Fix notification bell

| Item | Detail |
|------|--------|
| **File** | `coi-prototype/frontend/src/views/DashboardBase.vue` (bell icon ~lines 22–29) |
| **Action** | **Option A:** Add backend `GET /api/notifications` (or use existing `notification_queue` data), wire count badge and dropdown list to the bell. **Option B:** Hide the bell for customer demo (e.g. `v-if="false"` or remove). Choose one and implement. |
| **Acceptance** | Bell either shows real notification count/dropdown or is not visible. |

#### A6. Loading states and error messages

| Item | Detail |
|------|--------|
| **Files** | RequesterDashboard, DirectorDashboard, ComplianceDashboard, PartnerDashboard, FinanceDashboard, AdminDashboard, SuperAdminDashboard (all under `coi-prototype/frontend/src/views/`). |
| **Action** | Add loading indicator (spinner or skeleton) while API calls are in progress. Replace generic "Failed to load" with role- or context-specific messages. |
| **Acceptance** | Each dashboard shows loading state during fetch and a clear, specific error message on failure. |

---

### Phase B: User Journey Completeness

#### B1. Form Builder (two fixes)

| Item | Detail |
|------|--------|
| **File** | `coi-prototype/frontend/src/views/FormBuilder.vue` |
| **Fix 1** | Add missing import for `ImpactAnalysisPanel` (component is used in template ~line 98). Resolve path (e.g. `@/components/ImpactAnalysisPanel.vue` or as per project alias). |
| **Fix 2** | In `handleDrop()` (~line 448), replace hardcoded `'section-1'` with the section derived from the drop target (e.g. `event.target.closest('.section-container')` or a data attribute on the drop zone). |
| **Acceptance** | Form Builder loads without console errors; dragging a field onto a section drops it into that section, not always section-1. |

#### B2. "Need More Info" for approvers

| Item | Detail |
|------|--------|
| **Backend** | `POST /api/coi/requests/:id/need-more-info` already exists. |
| **Frontend** | In `coi-prototype/frontend/src/views/COIRequestDetail.vue`, confirm Director/Compliance/Partner approval views show a "Request Info" (or equivalent) action that opens ClarificationModal and calls the need-more-info endpoint. Optionally show info-request history (currently only latest may be stored). |
| **Acceptance** | Each approver role can request more info; requester receives notification and can respond. |

#### B3. Field-level validation

| Item | Detail |
|------|--------|
| **Files** | `COIRequestForm.vue`, step components (e.g. Step4Service, Step5Ownership). |
| **Action** | Add validation on blur/change (not only on submit). Show validation errors inline next to fields. Step4Service: enforce end date >= start date. Step5Ownership: add tooltip for "Public Interest Entity" (PIE). |
| **Acceptance** | Invalid end date or required fields show inline errors before submit; PIE is explained in tooltip. |

#### B4. Engagement code race condition

| Item | Detail |
|------|--------|
| **File** | `coi-prototype/backend/src/services/engagementCodeService.js` |
| **Note** | `coi_engagement_codes.engagement_code` already has UNIQUE in schema; no new constraint. |
| **Action** | Wrap code generation in a database transaction. On unique constraint violation, retry (e.g. 2–3 times) with a new code. |
| **Acceptance** | Concurrent code generation does not produce duplicates; under load, no unique violation errors to client. |

#### B5. Success confirmation after submit

| Item | Detail |
|------|--------|
| **File** | `coi-prototype/frontend/src/views/COIRequestForm.vue` |
| **Action** | After successful submit, show a success modal with request ID, short next steps, and a link to the request detail page to track progress. |
| **Acceptance** | User sees confirmation with request ID and link; clicking link opens request detail. |

#### B6. Permission configuration

| Item | Detail |
|------|--------|
| **Action** | Smoke-test: log in as Super Admin, open Permission Config (`/coi/admin/permission-config` or equivalent). Verify all 24 permissions can be toggled per role and that role-permission mapping is persisted and applied (e.g. restrict a permission and confirm it is enforced). |
| **Acceptance** | Super Admin can configure permissions; changes persist and affect access. |

#### B7. Rule Builder verification

| Item | Detail |
|------|--------|
| **Action** | In Compliance dashboard, open Rule Builder. Load rules, create a rule, edit, run impact analysis, approve as Super Admin, delete a test rule. Fix any bugs (e.g. missing `business_rules_config` table in init, wrong API base path). Ensure `console.log` in getBusinessRules is gated (covered by A2). |
| **Acceptance** | Rule Builder loads, CRUD and approve work; impact analysis runs; no console errors. |

---

### Phase C: Reports Cleanup

#### C1. Hide or label "coming soon" reports

| Item | Detail |
|------|--------|
| **File** | `coi-prototype/frontend/src/views/Reports.vue` |
| **Action** | Remove or relocate the "Coming Soon" block (~line 204). Either hide unimplemented reports or show them with a "Coming in Phase 2" badge. Unimplemented reports include: System Config, User Activity, Business Rules, Audit Trail, My Request Details, Team Performance, Pending Approvals, Department Service Analysis, and others not yet built. |
| **Acceptance** | No misleading "Coming Soon" without Phase 2 label; implemented reports are clearly available. |

#### C2. Top 5 priority reports

| # | Report | Roles | Action |
|---|--------|-------|--------|
| 1 | Approval Workflow Report | Admin, Compliance | Backend: expose time at each stage from coi_requests timestamps. Frontend: wire in Reports.vue. |
| 2 | SLA Compliance Report | Admin | Backend: SLA breach/warning counts. Frontend: wire in Reports.vue. |
| 3 | Department Performance | Director, Admin | Backend: request counts/approval rates by department. Frontend: wire in Reports.vue. |
| 4 | Conflict Analysis Report | Compliance | Backend: conflicts detected, resolution rates, types. Frontend: wire in Reports.vue. |
| 5 | Active Engagements Report | Partner, Admin | Backend: active status requests with engagement codes. Frontend: wire in Reports.vue. |

**Files:** `coi-prototype/backend/src/services/reportDataService.js`, `coi-prototype/backend/src/controllers/reportController.js`, `coi-prototype/frontend/src/views/Reports.vue`.  
**Acceptance:** Each report returns correct role-filtered data and displays in UI.

#### C3. CRM report PDF/Excel export

| Item | Detail |
|------|--------|
| **Files** | `coi-prototype/backend/src/services/pdfExportService.js`, `excelExportService.js` |
| **Action** | Add export support for the 8 CRM reports: Lead Source, Funnel, Insights, Attribution, Pipeline, Conversion, Period Comparison, Lost Prospect. |
| **Acceptance** | User can export each CRM report as PDF and/or Excel. |

#### C4. Line and doughnut charts

| Item | Detail |
|------|--------|
| **File** | `coi-prototype/frontend/src/components/reports/ReportCharts.vue` |
| **Action** | Add Chart.js `LineElement`; implement line chart for time-series and doughnut for summary views. |
| **Acceptance** | Reports that need trends show line chart; summary views can use doughnut. |

#### C5. ReportingDashboard integration

| Item | Detail |
|------|--------|
| **Action** | Either integrate `ReportingDashboard.vue` into Reports.vue as an "Analytics" tab or add a clear route/link from Reports to ReportingDashboard. |
| **Acceptance** | User can reach ReportingDashboard from Reports without guessing. |

---

### Phase D: UI/UX Polish

| ID | Action | Acceptance |
|----|--------|------------|
| D1 | Standardize colors (e.g. `bg-primary-600`), card padding `p-6`, radius (`rounded-lg` cards, `rounded-xl` modals), shadows across dashboards and modals. | Consistent look across main views. |
| D2 | In `DashboardBase.vue`, add breadcrumb: Home > [Role Dashboard] > [Current Tab/Page]. | Breadcrumb reflects current location. |
| D3 | In dashboard tab components, wrap tables in `overflow-x-auto`; consider card layout on small viewports. | Tables scroll horizontally on mobile; no layout break. |
| D4 | Persist filters (e.g. route query params or composable); restore when returning to a tab. | Filters survive tab switch/return. |
| D5 | In `COIRequestDetail.vue`, add print-friendly CSS (`@media print`) and a "Print" button. | Print view is readable and complete. |

---

### Phase E: CRM Polish

| Item | Detail |
|------|--------|
| **File** | `coi-prototype/frontend/src/views/ProspectManagement.vue` |
| **E1** | Add pipeline funnel visualization (data: `prospect_funnel_events`). Use Chart.js or a funnel chart library. |
| **E2** | Add activity timeline per prospect (chronological funnel events). |
| **E3** | Add filters: status, lead source, date range, industry (in addition to existing name/CR search). |
| **Acceptance** | Funnel chart, timeline, and filters work with existing backend data. |

---

### Phase F (optional): SSO-style login for demo

Only if the customer requires SSO in the room.

| Item | Detail |
|------|--------|
| **Option 1 (recommended)** | Mock SSO: "Sign in with Microsoft" button → stub page → post back with mock token; backend validates token and looks up user by email in `users` table. No real Azure AD. |
| **Option 2** | Real Azure AD / OIDC (e.g. `passport-azure-ad`): app registration, client ID/secret, redirect URIs. |
| **Acceptance** | User can complete login via chosen option; role and permissions unchanged. |

---

## Part 3 — Decisions and Reference (No Execution)

- **Approval flow:** Keep fixed (Director → Compliance → Partner → Finance → Admin). Dynamic workflow is production/Phase 2.
- **Requester notification on approval:** Optional: add email to requester when request moves to next stage (e.g. "Approved by Director; now with Compliance"). Implement in Phase B or as follow-up; body plain text only.
- **Users/roles from AD/HRMS:** Prototype keeps DB users; production per handover (HRMS adapter, cache, role mapping). Social logins not recommended for COI.

**Key references:**

- Handover doc: `coi-prototype/docs/production-handover/COI_Prototype_to_Production_Handover_with_Project_Brief.md`
- Prototype vs production: `docs/production-handover/Prototype_vs_Production_Handoff_Guide.md`
- Handover summary for implementers: `docs/production-handover/COI_Handover_Summary_for_Claude_Code.md`
- Build verification: `coi-prototype/docs/BUILD_VERIFICATION_REPORT.md`
- Production handover readiness skill: `docs/cursor-skills/production-handover-readiness.md`

---

## Verification after all phases

1. Login as each role; complete full journey Draft → … → Active.
2. Test rejection (fixable) and resubmission; Need More Info; engagement code generation and uniqueness.
3. Create prospect from Step 3 (Request New Client).
4. Run reports and exports (top 5 + CRM); Form Builder (drag to correct section, ImpactAnalysisPanel); Rule Builder (load, create, edit, impact, approve).
5. Check mobile viewport; no emojis in emails; no debug console.log in production build.
6. Run E2E: `cd coi-prototype && npm run test:e2e`.
7. Confirm handover doc and Part 1 checklist are satisfied for sign-off.
