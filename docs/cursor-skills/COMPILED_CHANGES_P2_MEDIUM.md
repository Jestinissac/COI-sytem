# P2 — Medium (fix in next pass)

**Parent:** [COMPILED_CHANGES_TO_MAKE.md](./COMPILED_CHANGES_TO_MAKE.md)

---

## 10. applyDataSegregation: align or remove

**Problem:** `applyDataSegregation` sets `req.query.exclude_commercial` but no route uses it and `getFilteredRequests` does not read it; dead code.

**Options:** (A) Remove `applyDataSegregation` and rely on response mapper (item 2). (B) Wire middleware on COI list/dashboard routes and implement `exclude_commercial` inside `getFilteredRequests` or in the mapper. Choose one and document.

**Files to change:** `coi-prototype/backend/src/middleware/dataSegregation.js`, and optionally `coi-prototype/backend/src/routes/coi.routes.js` if you add the middleware.

---

## 11. Audit report payloads for Compliance

**Action:** For every report endpoint that Compliance can call (e.g. `getComplianceSummaryReport`), ensure the payload does not include `engagement_code`, `total_fees`, or `financial_parameters`. If any report returns request-level financial data to Compliance, pass that data through `mapResponseForRole(..., 'Compliance')` or equivalent stripping.

**Files to review:** `coi-prototype/backend/src/services/reportDataService.js`, `coi-prototype/backend/src/controllers/reportController.js`.

---

## 12. Remove or guard frontend console.log

**Files to change:**
- `coi-prototype/frontend/src/stores/auth.ts` — Remove or guard `console.log('✅ Token refreshed successfully')`.
- `coi-prototype/frontend/src/services/api.ts` — Remove or guard `console.log('✅ Token refreshed automatically')` and `console.error('❌ Token refresh failed:', ...)`.
- `coi-prototype/frontend/src/composables/useKeyboardShortcuts.ts` — Remove or guard `console.log('[Keyboard] ✅ ...')`.

**Verification:** No `console.log`/`console.error` in production bundles for auth/api/shortcuts (or wrap in `import.meta.env.DEV`).
