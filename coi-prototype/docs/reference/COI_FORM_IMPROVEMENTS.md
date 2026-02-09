# COI Request Form – Improvements Summary

This document records the 26 distinct improvements made to the COI Request Form across two rounds. Use it for handoff, QA, or future reference.

---

## Round 1: Original 16 Improvements (Phases 1–5)

### Phase 1 — Quick wins

| #   | Item                       | File             | Change |
|-----|----------------------------|------------------|--------|
| 2.1 | Relationship options       | COIRequestForm.vue | Replaced 5 ambiguous options with 3: **New Client**, **Existing Client**, **Former Client**. |
| 2.2 | Ownership % helper         | COIRequestForm.vue | Conditional helper text under ownership field: "Subsidiary: 50–100%" / "Affiliate: 20–49%". Added `aria-required`. |
| 2.3 | Service period cross-validation | COIRequestForm.vue | `:min="formData.requested_service_period_start"` on end date input. |
| 3.1 | totalSteps fix             | COIRequestForm.vue | `totalSteps` is now `computed(() => sections.length + (isTeamMember ? 1 : 0))`. Section-7 completion tracked. Progress reaches 100% for both roles. |
| 4.1 | aria-required              | COIRequestForm.vue | Added to all 14 required fields (Designation, Entity, Client, Parent Company, Service fields, modals). |
| 4.2 | Radio focus style          | COIRequestForm.vue | `focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2` on both document type radio labels. |

### Phase 2 — UX core

| #   | Item                 | File             | Change |
|-----|----------------------|------------------|--------|
| 1.2 | Inline validation    | COIRequestForm.vue | 3 computed error messages: `ownershipPercentageError`, `parentCompanyError`, `serviceDescriptionError`. Shown with `role="alert"` under respective fields. |
| 1.3 | Auto-save indicator  | COIRequestForm.vue | `saveStatus` ref with 5 states: Saving…/amber, Saved at HH:mm/green, Save failed/red, Unsaved changes/amber, Auto-saved/green. Container has `role="status"` and `aria-live="polite"`. |
| 1.4 | Unsaved-changes warning | COIRequestForm.vue | `onBeforeRouteLeave` guard + in-app Stay/Leave modal. `beforeunload` browser dialog. `isDirty` tracking. |
| 1.5 | Section 6 primary approver | COIRequestForm.vue | Team members see "Primary approver: {name}" in gray box. Directors see "Your requests go directly to Compliance" in green box. |

### Phase 3 — Client picker + data

| #   | Item                  | File                          | Change |
|-----|-----------------------|-------------------------------|--------|
| 1.1 | Searchable combobox   | **New:** `components/coi/ClientProspectCombobox.vue` | Typeahead input with PRMS Clients / Prospects / New sections. Keyboard nav, click-outside, full ARIA. Replaces plain `<select>` in form. |
| 3.2 | Constants file        | **New:** `constants/coiFormOptions.ts` | `CLIENT_TYPES`, `REGULATED_BODIES`, `DEADLINE_REASONS` extracted from hardcoded template options. |
| 3.3 | Client list loading/error | COIRequestForm.vue         | `clientsLoading` / `clientsError` refs. "Loading clients…" with `aria-live="polite"`, error + Retry button with `role="alert"`. |

### Phase 4 — Accessibility

| #   | Item                     | File             | Change |
|-----|--------------------------|------------------|--------|
| 4.3 | aria-live on client states | COIRequestForm.vue | `aria-live="polite"` on loading text; `role="alert"` and `aria-live="assertive"` on error block. |

### Phase 5 — Optional

| #   | Item                    | File             | Change |
|-----|-------------------------|------------------|--------|
| 2.4 | Structured ownership input | COIRequestForm.vue | Add/remove shareholder rows (Name + %). Serialized to `full_ownership_structure` as "Name: X%" lines. Parsed back on draft load. |
| 3.4 | Extract modals          | **New:** `DuplicateJustificationModal.vue`, `CreateProspectModal.vue` | Inline modal markup extracted into reusable components with props/events. |

---

## Round 2: Bug Fixes & Improvements (Phases 1–4)

### Phase 1 — Critical bugs (A2, A4)

| #  | Item                      | File                    | Change |
|----|---------------------------|-------------------------|--------|
| A2 | Save draft create vs update | `stores/coiRequests.ts` | Added `updateRequest(id, data)` → `PUT /coi/requests/:id`. |
| A2 |                           | COIRequestForm.vue      | `handleSaveDraft`: calls `updateRequest` when `formData.id` exists; `createRequest` only for new drafts. |
| A4 | Submit uses existing draft | COIRequestForm.vue      | `handleSubmit`: calls `updateRequest` + `submitRequest(existingId)` when `formData.id` exists. No more orphaned drafts. |

### Phase 2 — Data integrity (A3, A1)

| #  | Item                          | File             | Change |
|----|-------------------------------|------------------|--------|
| A3 | international_operations preserved | COIRequestForm.vue | Removed `parsed.international_operations = false` from `loadFromLocalStorage()`. Removed second forced `= false` from `onMounted`. User’s saved choice is now preserved. |
| A1 | Debounced server auto-save    | COIRequestForm.vue | `scheduleServerAutoSave()`: 30s debounce after last form change. Guards: only when `isDirty`, not loading, and form has minimum data. Uses same create/update logic. Cleared by `stopAutoSave()`. |

### Phase 3 — Robustness (B1, B2, B3)

| #  | Item                        | File             | Change |
|----|-----------------------------|------------------|--------|
| B1 | Ownership rows/textarea conflict | COIRequestForm.vue | Textarea is `:readonly` when rows exist. Helper: "Editable above via rows, or clear rows to type freely." + "Clear rows" button. |
| B2 | Form load error boundary    | COIRequestForm.vue | `formLoadError` ref + `loadFormData()` tracking critical failures (clients + entities + service types). Red banner with Retry button (`role="alert"`). `retryFormLoad()` re-runs fetches. |
| B3 | Strip console.log           | COIRequestForm.vue | All `console.log`, `console.error`, `console.warn` removed (30+ statements). Catch-only blocks replaced with `/* non-critical */` where needed. |

### Phase 4 — UX polish (C1, C2, C3)

| #  | Item                      | File                    | Change |
|----|---------------------------|-------------------------|--------|
| C1 | Combobox scroll-into-view | ClientProspectCombobox.vue | `listRef` on `<ul>`, watcher on `focusedIndex` calls `scrollIntoView({ block: 'nearest' })` on focused option. Also fixed pre-existing TS errors (`opt.id` → `String(opt.id)`). |
| C2 | Service description char count | COIRequestForm.vue  | `maxlength="2000"` on textarea + "X / 2000" character counter below. |
| C3 | External deadline min=today | COIRequestForm.vue  | `:min="todayIso"` on deadline date input. `todayIso` computed: `new Date().toISOString().slice(0, 10)`. |

---

## Files changed / created

| File | Status |
|------|--------|
| `frontend/src/views/COIRequestForm.vue` | Modified (all phases) |
| `frontend/src/stores/coiRequests.ts` | Modified (added `updateRequest`) |
| `frontend/src/components/coi/ClientProspectCombobox.vue` | Created + modified (scroll fix, TS fix) |
| `frontend/src/components/coi/DuplicateJustificationModal.vue` | Created |
| `frontend/src/components/coi/CreateProspectModal.vue` | Created |
| `frontend/src/constants/coiFormOptions.ts` | Created |

**Total: 26 distinct improvements across 6 files.**
