# PRMS Deep Visibility for Compliance and Partner — Visibility and Design Plan

This plan defines **where and how** Compliance and Partner get PRMS visibility and how the **design** stays within Dieter Rams and the COI design system (8px grid, gray/white, single blue accent, no decorative elements).

---

## 1. Visibility plan

### 1.1 Where to show "View PRMS data"

**Location:** `COIRequestDetail.vue`, inside the **System Checks** sidebar block.

**Exact placement:**
- After the existing line: *"In production, this checks PRMS Client Master."* (around line 397).
- Add a new row in the same `divide-y` list, so it stays visually part of System Checks and uses the same spacing (`px-4 py-3`).

**When to show:**
- `request.client_id` is set (request has a client).
- User role is **Compliance** or **Partner** (use `authStore.user?.role` and check `['Compliance','Partner'].includes(role)`).
- Do **not** show for Requester, Director, Finance, Admin unless product explicitly extends visibility later.

**Control type:** Use a **link** (button styled as text link), not a full-width button, so it reads as a secondary action and keeps the sidebar minimal. Same pattern as "Load from PRMS" on the request form (text link).

### 1.2 Modal open behavior (Compliance / Partner)

**Recommendation: Auto-fetch when modal opens in view-only mode.**

- When the user opens the modal from Request Detail, we already have `initialClientId = request.client_id` and the client is pre-selected.
- **Auto-call** the fetch (e.g. in a `watch` on `show` + `initialClientId`) so the result block (client name, code, parent company, disclaimer) is visible without an extra click.
- **Rationale:** For a view-only flow, the user’s intent is "see PRMS data for this client." One click to open and see data is better than open → click Fetch → see data. Keep the "Fetch" button so they can re-fetch or change client if needed.

**Implementation note:** In `FetchPRMSDataModal`, when `show` becomes true and `initialClientId` is set, call `fetchData()` once after the client list is available (or after a short `nextTick`). Avoid double-fetch on mount if the parent already passes clients.

### 1.3 "PRMS Database" tooltip (Compliance)

**Where:** `ComplianceActionPanel.vue`, Verification Source field (the select with option "PRMS Database").

**Recommendation: Contextual helper text instead of a tooltip on the option.**

- **Option A (preferred):** When `verificationData.verification_source === 'prms'`, show one line of helper text **below** the select:  
  *"In production, verification can be checked against PRMS."*  
  Use `text-xs text-gray-500 mt-1`. No icon, no extra component; minimal and within design system.
- **Option B:** Add a `title` attribute on the `<option value="prms">` element:  
  `title="In production, verification can be checked against PRMS."`  
  Native tooltip on hover; no layout change, but option tooltips are not always well supported in all browsers.
- **Avoid:** HelpTooltip next to the label (adds an icon and uses `shadow-xl`, which violates design-checker rules). If a dedicated tooltip component is used later, it must use `shadow-sm` and neutral colors only.

**Copy (final):** *"In production, verification can be checked against PRMS."* — Specific, human-like, no emojis, no placeholder tone.

---

## 2. Design plan

### 2.1 "View PRMS data" control (COIRequestDetail)

**Control:** Text link (button with link styling).

**Label copy:** **"View PRMS data"** (no "Fetch" in the label to avoid implying they are triggering a sync; "View" matches read-only).

**Markup and classes:**
- Use a `<button type="button">` for accessibility (focus, keyboard, no href).
- Classes:  
  `text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1 -mx-1`  
  So: single blue accent, neutral hover (darker blue + underline), 8px grid–friendly padding, focus ring for a11y.
- Layout: Same row as "Client in PRMS" or the next row. Prefer a dedicated row:  
  `<div class="px-4 py-3">` with the helper line and the link:  
  *"In production, this checks PRMS Client Master."*  
  **View PRMS data** (button)

**Spacing:** `px-4 py-3` to match sibling rows in System Checks; `gap-2` or `mt-2` between the note and the link so hierarchy is clear.

**No:** Colored background, icon next to the link, or "Fetch PRMS data (view only)" (too long; keep "View PRMS data").

### 2.2 FetchPRMSDataModal when opened from Request Detail

**Current state:** Modal already uses:
- `bg-white`, `border border-gray-200`, `shadow-sm` (compliant).
- Result block: `border border-gray-200 rounded-md bg-gray-50` (compliant; gray-50 is allowed for subtle grouping).
- Text: `text-gray-500`, `text-gray-700`, `text-gray-900` (compliant).
- Primary button: `bg-blue-600` (single accent, compliant).

**No design changes required** for the modal when used with `showApplyButton=false`. If any other instance of the modal uses `bg-blue-50` or colored borders, those should be `bg-gray-50` and `border-gray-200` only.

**Copy in modal:** Already compliant — "PRMS integration is not available. Showing data from COI prototype." is specific and not placeholder/AI tone. Keep as is.

### 2.3 Compliance "PRMS Database" helper text

**If Option A (helper text when source is PRMS):**
- Wrapper: no extra box; just a `<p>` below the select.
- Classes: `text-xs text-gray-500 mt-2` (8px grid: mt-2 = 8px; or mt-1 = 4px if tighter).
- Copy: *"In production, verification can be checked against PRMS."*

**If Option B (title on option):**
- Add `title="In production, verification can be checked against PRMS."` to `<option value="prms">PRMS Database</option>`.
- No layout or style change.

**No:** Emojis, icons, or colored backgrounds. Keep the rest of ComplianceActionPanel unchanged for this feature.

### 2.4 Design system checklist (Dieter Rams / COI standards)

- **Spacing:** 8px grid only (`p-2`, `p-4`, `gap-2`, `gap-4`, `mt-2`, etc.). No `p-3`, `gap-3`, `gap-5`.
- **Backgrounds:** `bg-white`, `bg-gray-50`, `bg-gray-100` only. No `bg-blue-50`, `bg-amber-50`, etc., in new elements.
- **Borders:** `border border-gray-200` or `border-gray-300`. No colored borders, no `border-2` unless functional.
- **Shadows:** `shadow-sm` max. No `shadow-lg`, `shadow-xl`, `shadow-2xl`.
- **Links/primary actions:** `text-blue-600 hover:text-blue-800` (and optional `hover:underline`). No `hover:border-blue-500` or other colored hovers for this control.
- **Typography:** Labels `text-xs font-medium text-gray-500 uppercase tracking-wide`; body `text-sm text-gray-700`; headings `text-lg font-semibold text-gray-900`.
- **No:** Gradients, decorative icons, placeholder/AI-style copy, emojis.

---

## 3. Implementation checklist

Use this when implementing; order is logical, not strict.

**COIRequestDetail.vue**
- [ ] Import `FetchPRMSDataModal` and `api`. Add state: `showPrmsModal`, `prmsModalClients` (array).
- [ ] Compute or use `authStore.user?.role`; add a computed or inline check: show "View PRMS data" only when `request?.client_id` and role is Compliance or Partner.
- [ ] In System Checks, after the "In production, this checks PRMS Client Master." line, add a row that shows the "View PRMS data" link (button with link styling as in 2.1). Use `px-4 py-3` for the row.
- [ ] On link click: set `showPrmsModal = true`, fetch `GET /integration/clients`, assign result to `prmsModalClients`, open modal with `:initial-client-id="request.client_id"`, `:show-apply-button="false"`, `:clients="prmsModalClients"`.
- [ ] (Optional) In the modal, when opened with `initialClientId`, auto-fetch once so the result is visible without an extra click (implement in `FetchPRMSDataModal` via watch on `show` + `initialClientId`, or pass a prop like `autoFetchOnce`).

**FetchPRMSDataModal.vue**
- [ ] If auto-fetch is desired: when `show` becomes true and `initialClientId` is set, call `fetchData()` once (e.g. in a watch) after clients are ready. Ensure no double-fetch.
- [ ] Confirm result and error blocks use only `bg-gray-50`, `border-gray-200`, `text-gray-*` (no colored backgrounds). Fix any violation.

**ComplianceActionPanel.vue**
- [ ] Either: (A) When `verificationData.verification_source === 'prms'`, render a `<p class="text-xs text-gray-500 mt-2">In production, verification can be checked against PRMS.</p>` below the Verification Source select; or (B) add `title="In production, verification can be checked against PRMS."` to the `<option value="prms">PRMS Database</option>`.

**Docs**
- [ ] Update `PRMS_INTEGRATION_TOUCHPOINTS.md` (and optionally `PRMS_DEEP_VISIBILITY_COMPLIANCE_PARTNER.md`) to state that Compliance and Partner have "View PRMS data" on Request Detail and Compliance has the PRMS Database helper/tooltip.

**Design pass**
- [ ] Run through design-checker standards: no gradients, no shadow-lg/xl, no colored backgrounds in new UI, no emojis, 8px grid, human-like copy only.
- [ ] Verify focus and keyboard: "View PRMS data" button is focusable and dismissable (modal close with Escape if already implemented).

---

## 4. Summary

| Item | Decision |
|------|----------|
| Where | System Checks block, after "In production, this checks PRMS Client Master." |
| When | `request.client_id` set and role is Compliance or Partner |
| Control | Text link: "View PRMS data" (button with link styling) |
| Modal | Existing FetchPRMSDataModal, view-only (`showApplyButton=false`), optional auto-fetch on open |
| PRMS Database | Helper text when value is prms, or title on option; copy: "In production, verification can be checked against PRMS." |
| Design | 8px grid, gray/white, single blue accent for link, no decorative elements, no colored backgrounds in new UI |

This plan keeps visibility and design aligned with the feature doc (data segregation, placeholders) and with Dieter Rams / COI design standards.
