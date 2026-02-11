# Phase A (A1–A6): Before and After — Detailed Summary

**Purpose:** Single reference for what existed before Phase A gap fixes and what is in place after. Use for verification, handover, and customer testing readiness.

**Reference:** `COI_Execution_Plan_Handover_and_Customer_Testing.md` (Phase A: Critical Blockers).  
**Date:** February 2026.

---

## A1. Remove emojis from notification/email content

| Aspect | Detail |
|--------|--------|
| **Scope** | `notificationService.js`, `emailService.js` — email subjects and bodies (and any notification text shown to users). |
| **Acceptance** | No emoji in any email subject or body in these two files; grep for common emoji returns zero matches in subject/body strings. |

### Before

- Email and notification content could include emoji characters (e.g. 🔴, ⚠️, 🚨, ✅, ❌, 📋) in subjects and bodies.
- BUILD_VERIFICATION_REPORT and handover summary listed “emojis in email/notification content” as a high-severity gap.
- Risk: Unprofessional appearance and potential encoding/accessibility issues in production.

### After

- **notificationService.js:** Debug/mock output uses `devLog`; no emoji in user-facing subject/body strings in the notification templates used for emails (per plan, emojis removed from subjects/bodies in this file).
- **emailService.js:** May still contain `console.log` with 📧 in mock path (debug only); user-facing email content (templates, subjects, bodies) should be plain text (e.g. "URGENT", "SLA BREACHED", "APPROVED WITH RESTRICTIONS").
- **Other backend services:** Some emoji may remain in other files (e.g. `monitoringService.js` renewal subject 🔄, `duplicationCheckService.js` reason strings, `emailService.js` console.log). A1 as specified targets only notificationService and emailService **subject and body**; full codebase emoji cleanup is optional follow-up.

### Verification

- Run: `grep -E '🔴|⚠️|🚨|✅|❌|📋|📌|🔔|📧|🔄' coi-prototype/backend/src/services/notificationService.js coi-prototype/backend/src/services/emailService.js` on **subject/body** strings (exclude dev-only console.log if desired). Target: zero matches in user-facing content.

---

## A2. Replace console.log with devLog

| Aspect | Detail |
|--------|--------|
| **Scope** | `environment.js` (or equivalent) exports `devLog`; `coiController.js`, `configController.js`, `authController.js`, `notificationService.js`, `monitoringService.js`. |
| **Acceptance** | With `NODE_ENV=production`, no debug output from these files; with `NODE_ENV=development`, debug output still appears. |

### Before

- Debug logging used raw `console.log` in multiple backend files.
- In production, this could leak debug information and clutter logs.
- Handover summary listed “console.log in production paths” as a medium-severity gap.

### After

- **environment.js:** Exports `devLog(...args)` that calls `console.log` only when not production (e.g. `isDevelopment()` or `process.env.NODE_ENV !== 'production'`).
- **notificationService.js:** Uses `import { devLog } from '../config/environment.js'`; mock email and escalation debug output use `devLog` instead of `console.log`.
- **monitoringService.js:** Uses `import { devLog } from '../config/environment.js'`; scheduled task and monitoring debug output use `devLog`.
- **Real errors:** `console.error` retained for actual errors.
- **Other listed files:** coiController, configController, authController — may still contain some `console.log`; replace with `devLog` where the intent is debug-only.

### Verification

- Set `NODE_ENV=production` and trigger flows that previously logged; confirm no debug lines from these files.
- Set `NODE_ENV=development` and confirm debug output still appears where `devLog` is used.

---

## A3. Fix hardcoded data

| Aspect | Detail |
|--------|--------|
| **Scope** | Step6 Signatories (signatory dropdown); Step1 Entity (entity dropdown). |
| **Acceptance** | Signatory dropdown populated from API; entity dropdown populated from API; no hardcoded option lists. |

### Before

- **Step6 Signatories:** Dropdown was filled from a hardcoded array of employees (e.g. John Smith, Sarah Johnson, Michael Brown).
- **Step1 Entity:** Entity dropdown had a single hardcoded option (e.g. "BDO Al Nisf & Partners") instead of dynamic entities.

### After

- **Step6 Signatories (`Step6Signatories.vue`):**
  - `employees` is a ref populated in `onMounted` via `GET /api/auth/users`.
  - Response is filtered to active users (`user.active`) and mapped to `{ id, name }`.
  - Dropdown: `<option v-for="employee in employees" :key="employee.id" :value="employee.id">{{ employee.name }}</option>`.
  - Loading and error state: `loadingUsers`, `usersError` used for UX.
- **Step1 Entity (`Step1Requestor.vue`):**
  - Entity options come from `GET /api/entity-codes`; display uses `entity_display_name` or `entity_name`; form stores `entity_name`.
  - Dropdown: `v-for="e in entities"` with `e.entity_display_name || e.entity_name`; value is `e.entity_name`.
  - Loading/error: `loadingEntities`, `entitiesError` with inline messages ("Loading entities...", "Failed to load entities. Please try again later.").
  - Default/update via `emit('update', { entity: ... })` only (no direct prop mutation).

### Verification

- Open COI wizard Step 6: signatory dropdown lists users from API (active only).
- Open Step 1: entity dropdown lists entities from entity-codes API; selecting one updates form correctly.

---

## A4. Wire "Request New Client" to CreateProspectModal

| Aspect | Detail |
|--------|--------|
| **Scope** | `Step3Client.vue` — "Request New Client" button. |
| **Acceptance** | Clicking "Request New Client" opens CreateProspectModal; after creating prospect, list updates or selection is set as specified. |

### Before

- "Request New Client" triggered a placeholder (e.g. `info('Client request feature - coming soon')`) and did not open a real modal or create a prospect.

### After

- **Step3Client.vue:**
  - Imports `CreateProspectModal` from `@/components/coi/CreateProspectModal.vue`.
  - State: `showCreateProspectModal`, `newProspect`, `creatingProspect`.
  - "Request New Client" button click sets `showCreateProspectModal = true` and resets `newProspect`.
  - Modal is bound: `:open="showCreateProspectModal"`, `:prospect="newProspect"`, `@update:prospect`, `@cancel`, `@confirm="createAndSelectProspect"`.
  - On confirm, `createAndSelectProspect` creates the prospect (API), then closes modal and refreshes client/prospect list or sets the new prospect as selected so the user can continue the wizard.

### Verification

- On Step 3 Client, click "Request New Client"; CreateProspectModal opens. Create a prospect and confirm; modal closes and list/selection updates as designed.

---

## A5. Fix notification bell

| Aspect | Detail |
|--------|--------|
| **Scope** | `DashboardBase.vue` — notification bell (lines ~22–29). |
| **Acceptance** | Bell either shows real notification count/dropdown or is not visible. |

### Before

- Bell was visible but not wired to real notifications (no backend `GET /api/notifications` or use of `notification_queue` for count/dropdown).
- Could confuse users during customer demo.

### After

- **Option B implemented:** Bell is hidden for customer demo.
  - In `DashboardBase.vue`: the notification block is wrapped in `<template v-if="false">` with a comment: `<!-- Notification bell hidden for customer demo (A5) -->`.
  - No UI change for end users; real notification wiring can be added later (Option A) when backend and data are ready.

### Verification

- Load any dashboard that uses DashboardBase; notification bell is not visible. Remove `v-if="false"` (and implement Option A) when notifications are ready for production.

---

## A6. Loading states and error messages

| Aspect | Detail |
|--------|--------|
| **Scope** | All seven dashboards: Requester, Director, Compliance, Partner, Finance, Admin, SuperAdmin (`coi-prototype/frontend/src/views/*Dashboard.vue`). |
| **Acceptance** | Each dashboard shows a loading state during fetch and a clear, role- or context-specific error message on failure (with Retry where applicable). |

### Before

- **RequesterDashboard:** Table and mobile showed generic "Could not load requests"; Recent Requests card showed "No recent requests" when the real state was an error (no dedicated error branch). Loading: skeleton/table loading present.
- **DirectorDashboard:** Inline error row with "Could not load requests" + `coiStore.error` + Retry; no `aria-label` on Retry; loading row without `role="status"` / `aria-live="polite"`.
- **ComplianceDashboard:** Same as Director — generic title, inline markup, no EmptyState, no accessibility on loading/error.
- **PartnerDashboard:** Loading row present; **no error row** — when `coiStore.error` was set, table showed empty "No pending approvals" (misleading). No loading row accessibility.
- **FinanceDashboard:** Same as Director/Compliance — generic "Could not load requests", inline row, no EmptyState, no loading a11y.
- **AdminDashboard:** Overview and Execution tab had **no loading or error UI**; when fetch failed, overview showed zeros and execution showed "No items in execution queue" with no error message or Retry.
- **SuperAdminDashboard:** Users and Audit Logs tabs had no loading indicator on first fetch; errors only via toast ("Failed to fetch users", "Failed to fetch audit logs") with no inline error block or Retry in context.

### After

- **Shared component:** `EmptyState.vue` extended with optional `action.ariaLabel`; button/link use `:aria-label="action.ariaLabel ?? action.label"` for context-specific Retry (e.g. "Retry loading requests").
- **RequesterDashboard:** Table and mobile error title set to "Could not load your requests"; both use EmptyState with `:message="coiStore.error"` and `ariaLabel: 'Retry loading requests'`; wrapper `role="alert"` and `aria-live="assertive"`. Recent Requests card has dedicated error branch: `v-else-if="coiStore.error"` with EmptyState "Could not load your recent requests" and Retry with `ariaLabel: 'Retry loading recent requests'`.
- **DirectorDashboard:** Loading row has `role="status"` and `aria-live="polite"`. Error row uses EmptyState in cell: title "Could not load team requests", `:message="coiStore.error"`, action with `ariaLabel: 'Retry loading team requests'`; cell has `role="alert"` and `aria-live="assertive"`.
- **ComplianceDashboard:** Same pattern: loading row a11y; error row EmptyState "Could not load compliance queue" with `ariaLabel: 'Retry loading compliance queue'`.
- **PartnerDashboard:** Error row added: `v-else-if="coiStore.error && !loading"` with EmptyState "Could not load partner approvals" and Retry `ariaLabel: 'Retry loading partner approvals'`; loading row has `role="status"` and `aria-live="polite"`.
- **FinanceDashboard:** Same as Director/Compliance: loading row a11y; error row EmptyState "Could not load finance queue" with `ariaLabel: 'Retry loading finance queue'`.
- **AdminDashboard:** Overview: when `coiStore.loading`, block with LoadingSpinner "Loading overview..." and `role="status"` / `aria-live="polite"`; when `coiStore.error`, EmptyState "Could not load admin overview" with Retry and `ariaLabel: 'Retry loading admin overview'`. Execution tab: loading row with LoadingSpinner "Loading execution queue..." and a11y; error row with EmptyState "Could not load execution queue" in `<td colspan="6">` with Retry and `ariaLabel: 'Retry loading execution queue'`.
- **SuperAdminDashboard:** Refs added: `usersLoading`, `usersError`, `loadingLogs`, `logsError`. `fetchUsers` / `fetchAuditLogs` set these and use context-specific toast copy. Users tab: when `usersLoading`, LoadingSpinner "Loading user list..." with `role="status"` / `aria-live="polite"`; when `usersError`, EmptyState "Could not load user list. Please try again." with `:message="usersError"` and Retry `ariaLabel: 'Retry loading user list'`. Audit Logs tab: same pattern with "Loading audit logs...", "Could not load audit logs. Please try again.", and Retry `ariaLabel: 'Retry loading audit logs'`.

### Verification

- Per dashboard: throttle network or stop backend → loading state appears, then role-specific error with Retry; use Retry → request re-issued and state updates. Empty data (backend up, no data) shows empty state, not error. Optional: screen reader for `role="status"` / `role="alert"` and `aria-live` announcements.

### Reference

- Full spec: `docs/production-handover/A6_Loading_States_and_Error_Messages_Plan.md`.

---

## Summary table

| Item | Before | After |
|------|--------|--------|
| **A1** | Emojis in email/notification subject and body in notificationService, emailService | User-facing subject/body in those files use plain text; dev-only logs may still use emoji elsewhere |
| **A2** | Debug `console.log` in production in listed files | `devLog` in environment.js; notificationService and monitoringService use devLog; other listed files may need remaining console.log replaced |
| **A3** | Step6 hardcoded signatories; Step1 single hardcoded entity | Step6: signatories from GET /api/auth/users (active); Step1: entities from GET /api/entity-codes |
| **A4** | "Request New Client" showed coming-soon message | Opens CreateProspectModal; on confirm, prospect created and list/selection updated |
| **A5** | Bell visible but not wired to notifications | Bell hidden for demo (`v-if="false"` in DashboardBase) |
| **A6** | Generic "Failed to load" / "Could not load requests"; missing error row on Partner; no loading/error on Admin Overview/Execution or SuperAdmin Users/Logs | All seven dashboards: role-specific error copy, EmptyState + Retry with ariaLabel, loading/error a11y (role/aria-live); Partner has error row; Admin and SuperAdmin have full loading and error UI |

---

## Document history

- Initial version: Before/after for A1–A6 from execution plan and current codebase state (February 2026).
