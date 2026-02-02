# P1 — High (should fix before handover)

**Parent:** [COMPILED_CHANGES_TO_MAKE.md](./COMPILED_CHANGES_TO_MAKE.md)

---

## 4. Enforce JWT and refresh secrets in production

**Problem:** Code uses `process.env.JWT_SECRET || 'prototype-secret'` (and similar for refresh). In production without env, this allows key compromise.

**Files to change:**
- `coi-prototype/backend/src/index.js` (or a small `config/security.js` loaded at startup) — After `dotenv.config()`, if `NODE_ENV === 'production'`, require `process.env.JWT_SECRET` and `process.env.REFRESH_TOKEN_SECRET` to be set and not equal to `'prototype-secret'` / `'prototype-refresh-secret'`. If not, throw and exit (e.g. `throw new Error('JWT_SECRET must be set in production')`).
- Optionally: `coi-prototype/backend/src/middleware/auth.js` and `coi-prototype/backend/src/utils/tokenUtils.js` — In production, do not fall back to default; require env to be set (or rely on startup check above).

**Verification:** Set `NODE_ENV=production` and omit `JWT_SECRET`; app should fail to start with a clear error.

---

## 5. Document password hashing for production

**Problem:** Prototype stores passwords in plain text. Handover must state production must use bcrypt (or equivalent).

**Files to change:**
- `coi-prototype/docs/production-handover/COI_Prototype_to_Production_Handover_with_Project_Brief.md` — In security or deployment section, add explicit requirement: "Production must hash passwords (e.g. bcrypt, min 10 rounds); no plaintext storage. Prototype uses plaintext for convenience only."
- `coi-prototype/backend/src/controllers/authController.js` — Keep or strengthen comment that plaintext is prototype-only and production must use hashing.

**Verification:** Handover doc is searchable for "password" and "bcrypt"/"hash"; requirement is unambiguous.

---

## 6. Remove emojis from user-facing UI

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

## 7. Remove emojis from backend email and notifications

**Files to change:**
- `coi-prototype/backend/src/services/emailService.js` — Remove "🔔" from email subject (e.g. engagement expiring).
- `coi-prototype/backend/src/services/monitoringService.js` — Remove "📌" from any user-facing or log text that is sent to clients.

**Verification:** Search backend for emoji in strings; remove or replace with plain text.

---

## 8. Reduce Dieter Rams violations: shadows and gradients

**Problem:** Heavy shadows (`shadow-lg`, `shadow-xl`, `shadow-2xl`) and decorative gradients violate ui-design-standards and build-verification.

**Files to change (examples; apply pattern project-wide):**
- Modals: `COIRequestForm.vue`, `ClientProspectCombobox.vue`, `CreateProspectModal.vue`, `DuplicateJustificationModal.vue`, `RuleBuilder.vue`, `ComplianceDashboard.vue`, `SuperAdminDashboard.vue`, `AdminDashboard.vue`, `ClientCreationReviewModal.vue`, `InfoRequestModal.vue`, `RestrictionsModal.vue`, `ConvertToEngagementModal.vue`, `ProspectConversionModal.vue`, `EditionSwitcher.vue`, `FormBuilder.vue`, `CodeGenerationModal.vue`, `Login.vue`, `ProspectManagement.vue`, `BusinessDevProspects.vue`, `ActionDropdownModal.vue`, `HelpTooltip.vue`, `ServiceCatalogManagement.vue`, `EntityCodesManagement.vue`, `KeyboardShortcutsModal.vue`, `ConfirmModal.vue`, `Toast.vue` — Replace `shadow-xl` / `shadow-2xl` with `shadow-sm` or `border border-gray-200` where appropriate.
- Gradients: `InternationalOperationsForm.vue`, `ClientCreationReviewModal.vue`, `Reports.vue`, `PRMSDemo.vue`, `ConfirmModal.vue`, `coi-wizard/Step1Requestor.vue` through `Step7International.vue`, `WizardProgress.vue`, `Option1CardDesign.vue`, `Option3AccordionDesign.vue` — Replace `bg-gradient-*` with `bg-white` or `bg-gray-50` unless functional (e.g. status). Buttons: use `bg-blue-600` instead of gradient where possible.
- `PRMSDemo.vue` — Multiple gradients and shadows; simplify to flat, neutral palette per ui-design-standards.

**Verification:** Grep for `shadow-lg`, `shadow-xl`, `shadow-2xl`, `bg-gradient` in `coi-prototype/frontend`; remaining uses should be justified or removed.

---

## 9. Remove debug console.log from request path

**Files to change:**
- `coi-prototype/backend/src/controllers/coiController.js` — Remove `console.log('[NEW CODE v2] Request ID:', ...)` and `console.log('[NEW CODE v2] Request found:', ...)` from `getRequestById`.

**Verification:** No `console.log` in coiController request handlers (or guard with `NODE_ENV !== 'production'` if needed for dev).
