# Prototype End-to-End Issues List

**Generated:** From a skill-based end-to-end check of the COI prototype (production-handover-readiness, build-verification, business-consultant-partner, cio-cto-solution-alignment, security-compliance-production, ui-ux-coi, vue-coi-frontend, documentation-coi).

**Scope:** Backend, frontend, security, UI/UX, business rules, handover alignment.

---

## P0 — Critical (must fix before handover)

### Security & Compliance (security-compliance-production)

1. **Compliance sees commercial data in list endpoints**  
   - **Where:** `getMyRequests` (and any code using `getFilteredRequests`) returns full `coi_requests` rows including `financial_parameters`, `total_fees`, `engagement_code` for Compliance.  
   - **Evidence:** `dataSegregation.js` sets `req.query.exclude_commercial = true` for Compliance, but `getFilteredRequests()` does not use it; it returns `r.*` for all roles.  
   - **Fix:** Strip `financial_parameters`, `total_fees`, and `engagement_code` from list responses when `user.role === 'Compliance'` (e.g. in controller after `getFilteredRequests()` or inside a shared response mapper).

2. **Status name mismatch breaks Compliance reports**  
   - **Where:** `reportDataService.js`: `getComplianceSummaryReport`, and line 659 use status `'Pending Compliance Review'`.  
   - **Evidence:** Database and `coiController.js` use `'Pending Compliance'` (init.js, coiController submit/approve flow).  
   - **Fix:** Replace all `'Pending Compliance Review'` with `'Pending Compliance'` in `reportDataService.js` (and any other report/notification code using the wrong label).

---

## P1 — High (should fix before handover)

### UI/UX & Design (ui-ux-coi, build-verification, design-checker)

3. **Emojis in user-facing UI**  
   - **Where:**  
     - `RequesterDashboard.vue`: "⏳ Awaiting" in badge and in logic.  
     - `PartnerDashboard.vue`: "⏳ Awaiting", "⏳ ${days} days".  
     - `DirectorDashboard.vue`: "⏳ Awaiting".  
     - `LandingPage.vue`: icons "📊", "✅" for PRMS/COI tiles.  
     - `ImpactAnalysisPanel.vue`: "⚠️", "❌" in warning/error display.  
     - `FormBuilder.vue`: "📝", "📋" for field type icons/labels.  
     - `RuleBuilder.vue`: "✅" in success toast.  
     - `PRMSDemo.vue`: "📝", "📁" in UI.  
   - **Fix:** Replace with plain text or standard icons (e.g. "Awaiting", "Warning", "Error"; use SVG/icon component instead of emoji).

4. **Dieter Rams violations: gradients and heavy shadows**  
   - **Where (examples):**  
     - `COIRequestForm.vue`: `shadow-xl`.  
     - `ClientProspectCombobox.vue`: `shadow-lg`.  
     - `CreateProspectModal.vue`, `DuplicateJustificationModal.vue`: `shadow-xl` / `shadow-2xl`.  
     - `RuleBuilder.vue`, `ComplianceDashboard.vue`, `SuperAdminDashboard.vue`, `AdminDashboard.vue`: `shadow-xl`.  
     - `InternationalOperationsForm.vue`: `bg-gradient-to-r from-blue-50 to-blue-100`.  
     - `ClientCreationReviewModal.vue`: `bg-gradient-to-r from-purple-600 to-indigo-600`.  
     - `Reports.vue`: `bg-gradient-to-r from-blue-600 to-blue-700` on button.  
     - `PRMSDemo.vue`: multiple `bg-gradient-*`, `shadow-lg`.  
     - `ConfirmModal.vue`: `shadow-2xl`, gradient buttons.  
     - `Toast.vue`: `shadow-2xl`.  
     - `coi-wizard` steps (Step1–Step7): `bg-gradient-to-b from-*-50 to-white`.  
     - `WizardProgress.vue`: `bg-gradient-to-r from-primary-500 to-primary-600`, `shadow-lg`, `shadow-xl`, `scale-110`, `animate-pulse`.  
   - **Fix:** Use `shadow-sm` or borders instead of `shadow-lg`/`shadow-xl`/`shadow-2xl`; use `bg-white` or `bg-gray-50` instead of gradients; remove decorative gradients and heavy shadows per ui-design-standards and build-verification.

### Backend hygiene

5. **Debug logging in request path**  
   - **Where:** `coiController.js` `getRequestById`: `console.log('[NEW CODE v2] Request ID:', ...)` and `console.log('[NEW CODE v2] Request found:', ...)`.  
   - **Fix:** Remove or guard with env (e.g. only in development).

6. **Emoji in backend email/subject (optional for P1)**  
   - **Where:** `emailService.js`: subject uses "🔔"; `monitoringService.js`: "📌" in text.  
   - **Fix:** Remove emojis from email subjects and body text for professional tone and compatibility.

---

## P2 — Medium (fix in next pass)

### Consistency & docs

7. **applyDataSegregation not used on COI list**  
   - **Where:** `coi.routes.js` does not use `applyDataSegregation` middleware; `getFilteredRequests` is called with `req.query` but response stripping for Compliance is not applied to list.  
   - **Note:** Fix for issue 1 (strip commercial data in controller for Compliance) addresses the leak; optionally also apply `applyDataSegregation` for consistency if other logic depends on `exclude_commercial`.

8. **Reports: verify Compliance cannot see engagement_code / total_fees**  
   - **Where:** `reportDataService.js`: Compliance can call `getComplianceSummaryReport`; other report endpoints are role-gated.  
   - **Action:** Confirm no report payload returned to Compliance includes `engagement_code`, `total_fees`, or `financial_parameters`; if any does, add stripping (same as getRequestById).

### UI/UX

9. **Console.log in frontend**  
   - **Where:** `auth.ts`, `api.ts`, `useKeyboardShortcuts.ts`: `console.log`/`console.error` for token refresh and shortcuts.  
   - **Fix:** Remove or wrap in dev-only checks.

---

## P3 — Low / polish

10. **coi-wizard step backgrounds**  
    - All steps use `bg-gradient-to-b from-*-50 to-white`; consider neutral `bg-gray-50` or `bg-white` for consistency with Dieter Rams and ui-design-standards.

11. **StatusBadge / dashboard copy**  
    - Ensure all status labels and helper text are human-like and specific (no generic AI-style taglines); current search found no "Welcome to…" / "Click here to get started" in frontend.

---

## Summary by skill

| Skill | Issues found |
|-------|------------------|
| **production-handover-readiness** | Checklist satisfied only after P0/P1 fixes (security, status bug, UI/design). |
| **security-compliance-production** | 1 (commercial data in list), 2 (status name), 8 (reports verification). |
| **build-verification / ui-ux-coi** | 3 (emojis), 4 (gradients/shadows), 10 (wizard gradients). |
| **cio-cto-solution-alignment** | No new gaps; requirements vs solution alignment depends on fixing 1, 2, 4. |
| **business-consultant-partner** | Commercial data segregation (1, 2, 8) affects partner-level expectations. |
| **documentation-coi** | Handover doc Section 2.2 is accurate; status label in reports (2) should match DB. |

---

## Recommended order of fix

1. **P0-1:** Strip commercial data for Compliance in list responses (`getMyRequests` and any other use of `getFilteredRequests` for Compliance).  
2. **P0-2:** Replace `'Pending Compliance Review'` with `'Pending Compliance'` in `reportDataService.js`.  
3. **P1-3:** Remove or replace emojis in UI (dashboards, LandingPage, ImpactAnalysisPanel, FormBuilder, RuleBuilder, PRMSDemo).  
4. **P1-4:** Reduce gradients and heavy shadows per ui-design-standards (modals, wizard, PRMSDemo, ConfirmModal, Toast).  
5. **P1-5, P2-9:** Remove debug `console.log` in coiController and frontend.  
6. **P2-8:** Audit report payloads for Compliance; strip commercial fields if present.

---

*This list was produced by applying the project’s Cursor skills (production-handover-readiness, build-verification, business-consultant-partner, cio-cto-solution-alignment, security-compliance-production, ui-ux-coi, vue-coi-frontend, documentation-coi) to the prototype codebase and handover document.*

**Second-layer review (CTO/CIO):** See [CTO_CIO_SECOND_LAYER_REVIEW.md](CTO_CIO_SECOND_LAYER_REVIEW.md) for anti-hallucination verification and additional P0/P1 findings (req.user, dashboard/My Day leak, secrets, passwords).
