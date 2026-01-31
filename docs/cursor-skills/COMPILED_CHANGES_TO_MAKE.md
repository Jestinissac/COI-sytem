# Compiled List of Changes to Make

**Source:** Skills-based E2E check (production-handover-readiness, build-verification, business-consultant-partner, cio-cto-solution-alignment, security-compliance-production, ui-ux-coi, vue-coi-frontend, documentation-coi, code-review) + CTO/CIO second-layer review.

**Use:** Single ordered checklist for implementing fixes. Work through P0 first, then P1, P2, P3.

---

## P0 — Critical (must fix before handover)

### 1. Fix req.user usage (auth context)

**Problem:** Auth middleware sets only `req.userId` and `req.userRole`; it never sets `req.user`. Controllers that use `req.user` get `undefined` and throw (e.g. priority, SLA).

**Files to change:**
- `coi-prototype/backend/src/controllers/priorityController.js` — replace `const user = req.user` with `const user = getUserById(req.userId)` (and add import for `getUserById` from `../utils/userUtils.js`). Apply in `getQueue` and `getGrouped`.
- `coi-prototype/backend/src/controllers/slaController.js` — replace `req.user.id` with `req.userId` (or get user via `getUserById(req.userId)` if full user needed).
- `coi-prototype/backend/src/controllers/executionController.js` — replace all `req.user?.id`, `req.user?.role`, `req.user?.department` with `req.userId`, `req.userRole`, and user from `getUserById(req.userId)` for department.
- `coi-prototype/backend/src/controllers/isqmController.js` — replace `req.user?.id` with `req.userId`.
- `coi-prototype/backend/src/controllers/globalCOIController.js` — replace `req.user?.id` with `req.userId`.
- `coi-prototype/backend/src/controllers/configController.js` — replace `req.user?.id` with `req.userId` (lines 1861, 1888).
- `coi-prototype/backend/src/middleware/dataSegregation.js` — `applyDataSegregation` uses `req.user`; either remove this middleware from use or have a preceding middleware set `req.user`; if no route uses it, document or remove.

**Verification:** Call `GET /api/priority/queue` and `GET /api/priority/grouped` as an authenticated user; expect 200 and data, not 500.

---

### 2. Strip commercial data for Compliance in all list/dashboard/My Day responses

**Problem:** Compliance receives `financial_parameters`, `total_fees`, `engagement_code` wherever full request rows are returned. Currently only `getRequestById` strips; list, dashboard, and My Day/Week/Month do not.

**Approach:** Introduce a single response mapper (e.g. `mapResponseForRole(data, userRole)` in `coi-prototype/backend/src/utils/responseMapper.js`) that strips `financial_parameters`, `total_fees`, `engagement_code` (and `fee_details` if present) when `userRole === 'Compliance'`. Apply it everywhere request data is sent to the client.

**Files to change:**
- **New:** `coi-prototype/backend/src/utils/responseMapper.js` — implement `mapResponseForRole(rowsOrSingle, userRole)`; for Compliance, strip commercial fields from each row or single object.
- `coi-prototype/backend/src/controllers/coiController.js` — In `getMyRequests`, after `getFilteredRequests(user, req.query)`, pass result through mapper with `user.role` before `res.json(...)`. In `getDashboardData` (line ~1620), ensure any returned request rows are passed through the mapper for the current user’s role.
- `coi-prototype/backend/src/controllers/myDayWeekController.js` — Before sending `getMyDay`, `getMyWeek`, `getMyMonth` responses, map any request objects in the payload through `mapResponseForRole(..., user.role)` (user is already available via `getUserById(req.userId)`).
- `coi-prototype/backend/src/controllers/priorityController.js` — After fixing req.user (item 1), ensure queue/grouped responses that contain request rows are passed through the mapper for Compliance.
- Keep existing stripping in `getRequestById` for Compliance; optionally refactor to use the same mapper for consistency.

**Verification:** Log in as Compliance; call list, dashboard, My Day/Week/Month (and priority queue once fixed). Responses must not contain `financial_parameters`, `total_fees`, `engagement_code`.

---

### 3. Replace wrong status string in reports

**Problem:** `reportDataService.js` uses `'Pending Compliance Review'` but the database and workflow use `'Pending Compliance'`. Compliance summary report undercounts.

**Files to change:**
- `coi-prototype/backend/src/services/reportDataService.js` — Replace every occurrence of `'Pending Compliance Review'` with `'Pending Compliance'` (lines 433, 464, 659 and any others). Grep for `Pending Compliance Review` in this file and in `notificationService.js` / `monitoringService.js` and fix consistently.

**Verification:** Run Compliance summary report; pending count should match requests in status `Pending Compliance`.

---

## P1 — High (should fix before handover)

### 4. Enforce JWT and refresh secrets in production

**Problem:** Code uses `process.env.JWT_SECRET || 'prototype-secret'` (and similar for refresh). In production without env, this allows key compromise.

**Files to change:**
- `coi-prototype/backend/src/index.js` (or a small `config/security.js` loaded at startup) — After `dotenv.config()`, if `NODE_ENV === 'production'`, require `process.env.JWT_SECRET` and `process.env.REFRESH_TOKEN_SECRET` to be set and not equal to `'prototype-secret'` / `'prototype-refresh-secret'`. If not, throw and exit (e.g. `throw new Error('JWT_SECRET must be set in production')`).
- Optionally: `coi-prototype/backend/src/middleware/auth.js` and `coi-prototype/backend/src/utils/tokenUtils.js` — In production, do not fall back to default; require env to be set (or rely on startup check above).

**Verification:** Set `NODE_ENV=production` and omit `JWT_SECRET`; app should fail to start with a clear error.

---

### 5. Document password hashing for production

**Problem:** Prototype stores passwords in plain text. Handover must state production must use bcrypt (or equivalent).

**Files to change:**
- `coi-prototype/docs/production-handover/COI_Prototype_to_Production_Handover_with_Project_Brief.md` — In security or deployment section, add explicit requirement: "Production must hash passwords (e.g. bcrypt, min 10 rounds); no plaintext storage. Prototype uses plaintext for convenience only."
- `coi-prototype/backend/src/controllers/authController.js` — Keep or strengthen comment that plaintext is prototype-only and production must use hashing.

**Verification:** Handover doc is searchable for "password" and "bcrypt"/"hash"; requirement is unambiguous.

---

### 6. Remove emojis from user-facing UI

**Problem:** Emojis in UI violate human-like design and ui-ux-coi / design-checker rules.

**Files to change:**
- `coi-prototype/frontend/src/views/RequesterDashboard.vue` — Replace "⏳ Awaiting" with "Awaiting" (badge and logic).
- `coi-prototype/frontend/src/views/PartnerDashboard.vue` — Replace "⏳ Awaiting", "⏳ ${days} days" with plain text.
- `coi-prototype/frontend/src/views/DirectorDashboard.vue` — Replace "⏳ Awaiting" with "Awaiting".
- `coi-prototype/frontend/src/views/LandingPage.vue` — Replace "📊", "✅" with SVG icons or remove icon column/text.
- `coi-prototype/frontend/src/components/ImpactAnalysisPanel.vue` — Replace "⚠️", "❌" with text "Warning", "Error" or use icon component.
- `coi-prototype/frontend/src/views/FormBuilder.vue` — Replace "📝", "📋" with SVG or icon component.
- `coi-prototype/frontend/src/components/RuleBuilder.vue` — Replace "✅" in success toast with text (e.g. "Template loaded successfully").
- `coi-prototype/frontend/src/views/PRMSDemo.vue` — Replace "📝", "📁" with icons or text.

**Verification:** Grep frontend for common emoji codepoints; no emojis in labels, toasts, or dashboard copy.

---

### 7. Remove emojis from backend email and notifications

**Files to change:**
- `coi-prototype/backend/src/services/emailService.js` — Remove "🔔" from email subject (e.g. engagement expiring).
- `coi-prototype/backend/src/services/monitoringService.js` — Remove "📌" from any user-facing or log text that is sent to clients.

**Verification:** Search backend for emoji in strings; remove or replace with plain text.

---

### 8. Reduce Dieter Rams violations: shadows and gradients

**Problem:** Heavy shadows (`shadow-lg`, `shadow-xl`, `shadow-2xl`) and decorative gradients violate ui-design-standards and build-verification.

**Files to change (examples; apply pattern project-wide):**
- Modals: `COIRequestForm.vue`, `ClientProspectCombobox.vue`, `CreateProspectModal.vue`, `DuplicateJustificationModal.vue`, `RuleBuilder.vue`, `ComplianceDashboard.vue`, `SuperAdminDashboard.vue`, `AdminDashboard.vue`, `ClientCreationReviewModal.vue`, `InfoRequestModal.vue`, `RestrictionsModal.vue`, `ConvertToEngagementModal.vue`, `ProspectConversionModal.vue`, `EditionSwitcher.vue`, `FormBuilder.vue`, `CodeGenerationModal.vue`, `Login.vue`, `ProspectManagement.vue`, `BusinessDevProspects.vue`, `ActionDropdownModal.vue`, `HelpTooltip.vue`, `ServiceCatalogManagement.vue`, `EntityCodesManagement.vue`, `KeyboardShortcutsModal.vue`, `ConfirmModal.vue`, `Toast.vue` — Replace `shadow-xl` / `shadow-2xl` with `shadow-sm` or `border border-gray-200` where appropriate.
- Gradients: `InternationalOperationsForm.vue`, `ClientCreationReviewModal.vue`, `Reports.vue`, `PRMSDemo.vue`, `ConfirmModal.vue`, `coi-wizard/Step1Requestor.vue` through `Step7International.vue`, `WizardProgress.vue`, `Option1CardDesign.vue`, `Option3AccordionDesign.vue` — Replace `bg-gradient-*` with `bg-white` or `bg-gray-50` unless functional (e.g. status). Buttons: use `bg-blue-600` instead of gradient where possible.
- `PRMSDemo.vue` — Multiple gradients and shadows; simplify to flat, neutral palette per ui-design-standards.

**Verification:** Grep for `shadow-lg`, `shadow-xl`, `shadow-2xl`, `bg-gradient` in `coi-prototype/frontend`; remaining uses should be justified or removed.

---

### 9. Remove debug console.log from request path

**Files to change:**
- `coi-prototype/backend/src/controllers/coiController.js` — Remove `console.log('[NEW CODE v2] Request ID:', ...)` and `console.log('[NEW CODE v2] Request found:', ...)` from `getRequestById`.

**Verification:** No `console.log` in coiController request handlers (or guard with `NODE_ENV !== 'production'` if needed for dev).

---

## P2 — Medium (fix in next pass)

### 10. applyDataSegregation: align or remove

**Problem:** `applyDataSegregation` sets `req.query.exclude_commercial` but no route uses it and `getFilteredRequests` does not read it; dead code.

**Options:** (A) Remove `applyDataSegregation` and rely on response mapper (item 2). (B) Wire middleware on COI list/dashboard routes and implement `exclude_commercial` inside `getFilteredRequests` or in the mapper. Choose one and document.

**Files to change:** `coi-prototype/backend/src/middleware/dataSegregation.js`, and optionally `coi-prototype/backend/src/routes/coi.routes.js` if you add the middleware.

---

### 11. Audit report payloads for Compliance

**Action:** For every report endpoint that Compliance can call (e.g. `getComplianceSummaryReport`), ensure the payload does not include `engagement_code`, `total_fees`, or `financial_parameters`. If any report returns request-level financial data to Compliance, pass that data through `mapResponseForRole(..., 'Compliance')` or equivalent stripping.

**Files to review:** `coi-prototype/backend/src/services/reportDataService.js`, `coi-prototype/backend/src/controllers/reportController.js`.

---

### 12. Remove or guard frontend console.log

**Files to change:**
- `coi-prototype/frontend/src/stores/auth.ts` — Remove or guard `console.log('✅ Token refreshed successfully')`.
- `coi-prototype/frontend/src/services/api.ts` — Remove or guard `console.log('✅ Token refreshed automatically')` and `console.error('❌ Token refresh failed:', ...)`.
- `coi-prototype/frontend/src/composables/useKeyboardShortcuts.ts` — Remove or guard `console.log('[Keyboard] ✅ ...')`.

**Verification:** No `console.log`/`console.error` in production bundles for auth/api/shortcuts (or wrap in `import.meta.env.DEV`).

---

## P3 — Low / polish

### 13. coi-wizard step backgrounds

**Action:** In `coi-prototype/frontend/src/components/coi-wizard/Step1Requestor.vue` through `Step7International.vue`, consider replacing `bg-gradient-to-b from-*-50 to-white` with `bg-gray-50` or `bg-white` for consistency with Dieter Rams.

---

### 14. StatusBadge and dashboard copy

**Action:** Spot-check status labels and empty-state/helper text for human-like, specific wording (no generic AI-style taglines). No change required if already compliant.

---

## Recommended order of implementation

1. **P0-1** — Fix req.user usage (priority, SLA, execution, isqm, global, config, dataSegregation).
2. **P0-2** — Add response mapper and apply to getMyRequests, getDashboardData, myDayWeekController, priorityController; keep getRequestById stripping or refactor to mapper.
3. **P0-3** — Replace 'Pending Compliance Review' with 'Pending Compliance' in reportDataService (and related).
4. **P1-4** — Enforce JWT/refresh secrets at startup for production.
5. **P1-5** — Document password hashing in handover and authController.
6. **P1-6** — Remove emojis from UI (dashboards, LandingPage, ImpactAnalysisPanel, FormBuilder, RuleBuilder, PRMSDemo).
7. **P1-7** — Remove emojis from backend email/monitoring.
8. **P1-8** — Reduce shadows and gradients across modals, wizard, PRMSDemo, ConfirmModal, Toast.
9. **P1-9** — Remove debug console.log in coiController.
10. **P2-10** — applyDataSegregation: remove or wire and implement.
11. **P2-11** — Audit report payloads for Compliance; strip if needed.
12. **P2-12** — Remove or guard frontend console.log (auth, api, keyboard shortcuts).
13. **P3-13** — Wizard step backgrounds (optional).
14. **P3-14** — Copy review (optional).

---

## Source documents

- **Issues list:** `docs/cursor-skills/PROTOTYPE_E2E_ISSUES_LIST.md`
- **CTO/CIO review:** `docs/cursor-skills/CTO_CIO_SECOND_LAYER_REVIEW.md`
- **How to use skills:** `docs/cursor-skills/HOW_TO_USE_SKILLS.md`
