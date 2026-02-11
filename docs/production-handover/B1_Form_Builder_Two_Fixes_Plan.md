# B1 — Form Builder (2 Fixes) — Implementation Plan

**Purpose:** Fix two issues in FormBuilder.vue: (1) add the missing import for `ImpactAnalysisPanel`; (2) make drag-and-drop resolve the target section from the drop event and pass that section id to `addNewField` instead of always using `'section-1'`.

**Scope:** Single file — [FormBuilder.vue](coi-prototype/frontend/src/views/FormBuilder.vue). Component [ImpactAnalysisPanel.vue](coi-prototype/frontend/src/components/ImpactAnalysisPanel.vue) already exists.

**Reference:** [COI Customer Testing Execution Plan](COI_Customer_Testing_Execution_Plan.md) — B1. Fix Form Builder (2 quick fixes).

**Terminology (used consistently in this plan):**  
- **Section container** — the div that wraps one form section (header + fields list).  
- **Drop target** — the section (or element within it) that receives the drop.  
- **Section id** — the section’s identifier (e.g. `section-1`, `section-2`), stored in `section.id` and in `data-section-id` on the section container.

---

## Current state

1. **ImpactAnalysisPanel**  
   - Used in the template (lines ~98–101) inside the Form Canvas when a field is selected and "Impact Analysis" is toggled.  
   - **Not imported** in the script — the component is referenced but the import is missing, which will cause a build/runtime error.

2. **handleDrop**  
   - Bound on the canvas wrapper: `<div class="p-4 space-y-6" @drop="handleDrop" @dragover.prevent>`.  
   - Ignores drop location and always calls `addNewField(fieldType, 'section-1')`, so every dropped field goes to section 1.  
   - Section containers (and the empty-state drop hint) do **not** have `data-section-id`, so the drop target cannot be inferred from the event.

---

## Fix 1 — Add ImpactAnalysisPanel import

**File:** [FormBuilder.vue](coi-prototype/frontend/src/views/FormBuilder.vue)

**Action:** In the `<script setup>` block, add the component import with the other imports (after `useToast` or with the existing imports).

- **Reason:** The component is referenced in the template but never imported. Vue will fail to resolve `<ImpactAnalysisPanel>` at build or runtime, causing a missing-component error. Adding the import fixes this.
- Add (comment optional but recommended for traceability):
  ```ts
  // B1 Fix: Import ImpactAnalysisPanel (referenced in template).
  import ImpactAnalysisPanel from '@/components/ImpactAnalysisPanel.vue'
  ```
- **Location:** With the other top-level imports (e.g. after `import { useToast } from '@/composables/useToast'`). No need to register in `components` when using `<script setup>` — the imported component is auto-available in the template.

**Verification:** Build the frontend (`npm run build` from `coi-prototype/frontend`); the Form Builder view should compile without missing-component errors. Open Form Builder, select a field, and open "Impact Analysis" to confirm the panel renders.

---

## Fix 2 — Resolve drop target section and use it in addNewField

**File:** [FormBuilder.vue](coi-prototype/frontend/src/views/FormBuilder.vue)

### 2.1 Add `data-section-id` to drop zones

- **Reason:** The drop handler receives a single `drop` event on the canvas wrapper and does not know which section the user dropped onto. Adding `data-section-id` on each section container gives us a way to identify the target section from `event.target` (the element under the cursor when the drop occurs).
- The **section container** is the natural drop zone for each section. Add the attribute so we can resolve the target from the event.
- In the template, on the section container div (the one with `v-for="section in sections"` and `class="section-container"`), add `:data-section-id="section.id"` so the drop target can be resolved. Optionally add the comment below for traceability:
  ```html
  <!-- B1 Fix: data-section-id for drop target resolution -->
  <div v-for="section in sections" :key="section.id" class="section-container" :data-section-id="section.id">
  ```
- **Why this works:** The empty-state div ("Drag fields here or click Add Field") is already inside the section container, so drops on it will have that section container as an ancestor; no extra attribute is required there.

### 2.2 Update handleDrop to resolve target section

- **Reason:** The current implementation always adds fields to `'section-1'`. We need to determine the correct section id from the drop location so that the new field is added to the section under the cursor (the drop target).
- In `handleDrop`, after `event.preventDefault()` and reading `fieldType` from `event.dataTransfer?.getData('fieldType')` (the key set in `handleDragStart`), resolve the section id from the drop target and pass it to `addNewField`. Replace the existing `addNewField(fieldType, 'section-1')` with:
  ```ts
  // B1 Fix: Resolve drop target section from event (was hardcoded 'section-1').
  const sectionEl = (event.target as HTMLElement)?.closest?.('[data-section-id]')
  const sectionId = sectionEl?.getAttribute?.('data-section-id') || 'section-1'
  addNewField(fieldType, sectionId)
  ```
- **How `closest()` works:** `event.target` is the DOM element that received the drop (e.g. a section header, a field row, or the empty-state div). That element may be nested inside the section container. `element.closest('[data-section-id]')` walks up the DOM from that element and returns the first ancestor (or the element itself) that has the attribute. We then read the section id from that element. If the user drops on anything inside a section container that has `data-section-id`, we get the correct section id.
- **Fallback:** If no element with `data-section-id` is found (e.g. drop on canvas padding outside any section container), use `'section-1'` so behavior remains safe.

**Result:** Dropping a field type onto a section (header, field list, or empty area of that section) adds the field to that section.

**Verification:** Open Form Builder, drag a field type from the palette and drop it onto different sections (e.g. "Client Details", "Signatories"); confirm the new field appears in the section under the drop and that its `section_id` matches (e.g. in the field’s displayed "section_id" in the list or in the saved form).

---

## File checklist

| # | File | Action |
|---|------|--------|
| 1 | coi-prototype/frontend/src/views/FormBuilder.vue | Add `import ImpactAnalysisPanel from '@/components/ImpactAnalysisPanel.vue'` (optional: add B1 Fix comment above it). |
| 2 | coi-prototype/frontend/src/views/FormBuilder.vue | Add `:data-section-id="section.id"` to the section container div (optional: add B1 Fix comment above the div). |
| 3 | coi-prototype/frontend/src/views/FormBuilder.vue | In `handleDrop`, resolve `sectionId` via `event.target.closest('[data-section-id]')?.getAttribute('data-section-id')`, pass to `addNewField(fieldType, sectionId)`, and use fallback `'section-1'` (optional: add B1 Fix comment before the logic). |

---

## Verification commands

Run from `coi-prototype/frontend`:

```bash
# Verify Fix 1: build must succeed (no missing component)
npm run build

# Verify both fixes in the browser: start dev server, then open Form Builder
npm run dev
```

**Manual verification steps (after dev server is running):**

1. Open the Form Builder route in the app.
2. **Fix 1:** Select any field in the canvas, then toggle "Impact Analysis". **Expected:** The `ImpactAnalysisPanel` renders without errors; no missing-component warning in console.
3. **Fix 2:** Drag a field type (e.g. "Text Input") from the left palette and drop it onto a section other than the first (e.g. "Client Details" or "Signatories"). **Expected:** The new field appears in that section’s list, not in "Requestor Information".
4. Repeat step 3 for two or three different sections. **Expected:** Each new field appears in the section under the drop.
5. Confirm the field’s **section id** matches the drop target: check the field row text (it shows `section_id`) or save the form and inspect the saved config. **Expected:** `section_id` equals the section you dropped onto (e.g. `section-3` for "Client Details").

---

## Suggested code comments

When applying the changes, optional comments help future maintainers:

- **Fix 1 (import):** Above the new import line:
  ```ts
  // B1 Fix: Import ImpactAnalysisPanel (referenced in template).
  import ImpactAnalysisPanel from '@/components/ImpactAnalysisPanel.vue'
  ```

- **Fix 2.1 (template):** On the section container, the attribute itself documents the fix; optionally a template comment above the div:
  ```html
  <!-- B1 Fix: data-section-id for drop target resolution -->
  <div v-for="section in sections" :key="section.id" class="section-container" :data-section-id="section.id">
  ```

- **Fix 2.2 (handleDrop):** Inside the function, replace the hardcoded call with the resolution logic and call (comment + three lines):
  ```ts
  // B1 Fix: Resolve drop target section from event (was hardcoded 'section-1').
  const sectionEl = (event.target as HTMLElement)?.closest?.('[data-section-id]')
  const sectionId = sectionEl?.getAttribute?.('data-section-id') || 'section-1'
  addNewField(fieldType, sectionId)
  ```

---

## Verification summary

1. **Fix 1:** Frontend build passes; Form Builder loads; selecting a field and opening "Impact Analysis" shows the `ImpactAnalysisPanel` without errors.  
2. **Fix 2:** Dragging a field type from the palette and dropping it on different sections adds the new field to the section under the cursor (the drop target); the field’s `section_id` matches the dropped section.

---

## Verification complete

**Date:** 2025-02-10

- **FormBuilder.vue:** All three B1 fixes (ImpactAnalysisPanel import, `data-section-id` on section container, handleDrop using drop target section) implemented and verified in code.
- **ImpactAnalysisPanel.vue:** Duplicate template/script block removed (pre-existing); single template and script confirmed.
- **Automated:** No linter errors; `npm run build` passes.
- **Manual:** Run `npm run dev`, open Form Builder, then (1) select a field and toggle Impact Analysis, (2) drag a field onto another section and confirm it appears there, (3) confirm the new field’s `section_id` matches the drop target.

---

## Out of scope

- Changing section list or section ids.  
- Adding new drop zones (e.g. between sections).  
- Changing ImpactAnalysisPanel behavior or props.
