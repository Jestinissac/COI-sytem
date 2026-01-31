# Dashboard & COI Detail – Design, Flow, and Other Improvements

This document applies **design-checker**, **flow-validator**, and **build-verification** criteria to:

- `frontend/src/views/RequesterDashboard.vue`
- `frontend/src/views/DashboardBase.vue`
- `frontend/src/views/COIRequestDetail.vue`

---

## 1. RequesterDashboard.vue

### Design-Checker (Dieter Rams / Enterprise Quality)

| Priority | Issue | Location | Current | Fix |
|----------|--------|----------|---------|-----|
| **P0** | Emoji in UI | EmptyState usage (e.g. ~218, ~274, ~358) | `icon="📋"` | Use an icon component (e.g. document/clipboard SVG) or omit `icon` so EmptyState uses no icon. Prefer a shared `DocumentIcon` component for consistency. |
| **P1** | Colored backgrounds in legend / modals | Legend (~519–541), Send Proposal / Follow Up / Record Response modals (~541–619) | `bg-green-100`, `bg-amber-100`, `bg-red-100`, `bg-gray-200` (legend); modal headers use colored backgrounds | Legend: keep status badges functional; consider neutral card `bg-white border border-gray-200` for legend container. Modals: use `bg-white` + `border-b border-gray-200` for headers instead of colored headers. |
| **P1** | Decorative icon container in list items | Recent Requests list (~229–232) | `w-8 h-8 rounded-full bg-blue-100` with blue icon | Use icon only: `w-5 h-5 text-gray-500` (or `text-gray-600`) without colored circle. |
| **P2** | Export button has no behavior | All Requests tab header (~253–261) | Button with no `@click` | Either wire to export (e.g. export current filtered list via `exportReportExcel` with current filters) or remove the button. |

### Flow-Validator (State Consistency)

| Issue | Location | Recommendation |
|-------|----------|----------------|
| **Pagination uses wrong total** | All Requests tab pagination (~450–464) | Table uses `paginatedEnhancedRequests` / `enhancedFilteredRequests`, but Next button uses `totalPages` (from `filteredRequests`). Use `enhancedTotalPages` for the All tab pagination so "Next" disables correctly. |
| **Page index can become invalid when filters change** | When `allStatusFilter`, `allServiceFilter`, or `searchQuery` change | Add a watcher (or derive in a computed) so that when `enhancedFilteredRequests.length` or filter inputs change, reset `currentPage` to `1` if `currentPage > enhancedTotalPages` (or always reset to 1 on filter change for predictable UX). |

### Other (Build Verification / UX)

- **Export (All Requests):** If you keep the Export button, implement export of the current filtered list (e.g. same dataset as the table) and show a toast on success/failure.
- **Keyboard / focus:** Modals (Send Proposal, Follow Up, Record Response) should trap focus and support Escape to close; consider a shared modal wrapper or existing `Modal` component.
- **Empty state in All tab (bug):** Desktop table (line ~357) and mobile block (line ~405) use `filteredRequests.length === 0` for the empty state, but the table data is `paginatedEnhancedRequests` / `enhancedFilteredRequests`. **Fix:** Use `enhancedFilteredRequests.length === 0` for both so “No requests found” matches what the user sees (e.g. after applying filters).

---

## 2. DashboardBase.vue

### Design-Checker

| Priority | Issue | Location | Recommendation |
|----------|--------|----------|----------------|
| **P2** | Custom hex for header | Header uses `bg-[#1e3a8a]` | Acceptable as brand header. If design system defines a token (e.g. `--header-bg`), use it for consistency. |
| **P3** | Reports tab icon | Line ~131 | Inline SVG in `baseTabs` is duplicated pattern; consider reusing the same icon component as elsewhere. |

### Flow-Validator

- No form state or conditional sections; flow-validator rules (mutually exclusive, ghost data, cross-section replication) do not apply. Role-based `visibleTabs` is derived from `authStore.user?.role`; no ghost state identified.

### Other

- **Import path:** `'../../../client-intelligence/frontend/services/featureFlag.ts'` leaves the coi-prototype frontend. If this is intentional (monorepo), consider a path alias (e.g. `@client-intelligence/...`) for clarity and to avoid breakage if structure changes.

---

## 3. COIRequestDetail.vue

### Design-Checker

| Priority | Issue | Location | Current | Fix |
|----------|--------|----------|---------|-----|
| **P0** | Excessive shadow on modals | Reject / Restrictions / Upload / Need More Info modals (~509, 548, 563, 579) | `shadow-xl` | Use `shadow-sm` (or `border border-gray-200`) to align with “shadow-sm max” and Dieter Rams. |
| **P1** | Colored section backgrounds | Rejection banner (~108), Director Approval doc list (~428), Duplication Alert (~357), System Recommendations (~328), Approver Unavailable (~421), modal headers | `bg-red-50`, `bg-amber-50`, `bg-blue-50`, `bg-yellow-50`, `bg-green-50`, etc. | For non-badge areas, prefer `bg-white` or `bg-gray-50` with `border border-gray-200` (or status-left border only). Keep status badges (e.g. Fixable/Permanent) as functional color. |
| **P2** | Director Approval document list | ~427–434 | `bg-blue-50` per document row | Use `bg-gray-50` or `bg-white` with `border border-gray-200`. |

### Flow-Validator

- Detail view is read-heavy with actions (approve, reject, upload, etc.). No multi-section form with parent/child or cross-section replication in this file.
- **Reject modal:** `rejectionType` and `rejectionReason` are reset on submit/cancel; no ghost data.
- **Scroll from query:** `from=expiring` scroll and highlight is correctly tied to `request` and DOM; no inconsistency.

### Other (Build Verification / UX)

- **Modals:** Same as RequesterDashboard: ensure focus trap and Escape-to-close for Reject, Restrictions, Upload, Need More Info modals.
- **Error handling:** Replace raw `alert()` for delete-attachment failure (~696) with toast (e.g. `toast.error(...)`) for consistency with the rest of the app.
- **Director tooltip:** The Director-only tip (~489) uses an emoji (ℹ️). Per design-checker, use text only (e.g. “Note:” or “Info:”) or a small SVG icon.

---

## 4. Summary of Actions

### RequesterDashboard.vue

1. **Bug:** Fix All tab pagination: use `enhancedTotalPages` instead of `totalPages` for the Next button (line ~461).
2. **Bug:** Use `enhancedFilteredRequests.length === 0` for empty state in All tab (desktop table and mobile block), not `filteredRequests.length === 0`.
3. Reset `currentPage` to 1 when filters (search, status, service) or `enhancedFilteredRequests` change.
4. Remove or replace emoji in EmptyState (`icon="📋"`) with an icon component or no icon (lines ~210, ~360, ~406).
5. Wire the All Requests “Export” button to an export of the current filtered list, or remove it.
6. Reduce decorative styling (e.g. blue circle behind list icons); use simple icon only.
7. Optionally unify modal headers to neutral (white + border) and keep status colors only for badges.

### DashboardBase.vue

1. Optional: use a design token for header background if one exists.
2. Optional: normalize import path for client-intelligence (e.g. alias).

### COIRequestDetail.vue

1. Change modal containers from `shadow-xl` to `shadow-sm` (or border-only).
2. Replace colored section backgrounds with neutral (`bg-white` / `bg-gray-50` + border) where they are not status badges.
3. Replace Director tooltip emoji (ℹ️) with text or a small icon.
4. Replace `alert()` on attachment delete failure with toast.
5. Add focus trap and Escape-to-close for modals if not already present.

---

## 5. Document Notes & Caveats

- **Colored alert callouts (COIRequestDetail):** Rejection banner, Approver Unavailable, and Duplication/Recommendations sections use tinted backgrounds (e.g. `bg-amber-50`, `bg-red-50`) for risk communication. Strict Dieter Rams says “neutral only”; if your design system allows **functional** alert tints for warnings/errors, you can keep those and only change decorative areas (e.g. modal headers, document list). Otherwise treat all as P1 and move to neutral.
- **Legend in RequesterDashboard:** The Active tab legend (Client Response / Engagement Status) uses colored badges with borders. Those are status semantics; the doc suggests a neutral **container** (`bg-white border border-gray-200`) while keeping the badge colors. No change to the suggestion.
- **Implementation order:** Fix the **pagination bug** and **empty-state bug** first (user-facing correctness); then emoji/Export/design tweaks.

---

## 6. References

- **Design-checker:** `.cursor/agents/design-checker.md` (Dieter Rams, no emojis/placeholders, enterprise quality).
- **Flow-validator:** `.cursor/agents/flow-validator.md` (mutually exclusive, ghost data, cross-section sync, UI state alignment).
- **Build verification:** `.cursor/skills/build-verification/SKILL.md` (user journeys, business logic, Dieter Rams).
- **UI design standards:** `.cursor/rules/ui-design-standards.mdc` (8px grid, palette, typography, borders/shadows).
