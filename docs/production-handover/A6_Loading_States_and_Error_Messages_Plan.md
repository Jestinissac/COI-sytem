# A6. Loading States and Error Messages — Implementation Plan

**Reference:** COI Execution Plan Handover (A6)  
**Scope:** RequesterDashboard, DirectorDashboard, ComplianceDashboard, PartnerDashboard, FinanceDashboard, AdminDashboard, SuperAdminDashboard.

**Goal:** Add loading indicators (spinner/skeleton) and replace generic "Failed to load" with role- or context-specific error copy on all seven dashboards.

---

## 1. Consistency, reuse, and accessibility

These rules apply across all dashboards so behaviour and UX stay uniform.

### 1.1 Reusable components

- **Error block:** Use the existing **EmptyState** component for error UI everywhere possible: pass `title` (role-specific copy from §7), `:message` (e.g. `coiStore.error`), and `action: { label: 'Retry', onClick: retryFn, ariaLabel: 'Retry loading [context]' }`. EmptyState must be extended to accept optional `action.ariaLabel` so the Retry button gets a context-specific `aria-label` while still showing visible text "Retry". For table error rows, render EmptyState inside the cell (one cell with appropriate colspan). This keeps all dashboards consistent and reusable.
- **Loading:** Use existing **LoadingSpinner** (`@/components/ui/LoadingSpinner.vue`) for spinner + optional message (e.g. "Loading...", "Loading execution queue..."). Use **SkeletonCard** / **SkeletonLoader** where a skeleton is preferred (e.g. RequesterDashboard Recent Requests). No new loading component required.
- **Retry button:** Every error block must offer Retry where applicable. Use visible label **"Retry"** and `aria-label="Retry loading [context]"` (e.g. "Retry loading requests", "Retry loading compliance queue") so the action is clear and screen-reader friendly.

### 1.2 Accessibility

- **Loading:** Wrap loading UI in a container with `role="status"` and `aria-live="polite"` so screen readers announce when loading starts/finishes. LoadingSpinner already has `aria-label="Loading"`; ensure the surrounding context (e.g. table row or card) has `role="status"` when it’s the only content shown.
- **Errors:** Present error blocks in a container with `role="alert"` and `aria-live="assertive"` so errors are announced immediately. When using EmptyState for errors, add a wrapper with `role="alert"` and `aria-live="assertive"` around it (EmptyState itself is `role="region"` with an aria-label; the alert wrapper is for live region behaviour).
- **Copy:** Use the copy reference (§7) consistently; keep messages clear and concise.

### 1.3 Testing (post-implementation)

- **Normal and edge cases:** (1) **Loading:** Throttle network or delay API; confirm a loading state (spinner/skeleton) appears. (2) **Failure:** Stop backend or use invalid endpoint; confirm the role-specific error message and Retry appear. (3) **Retry:** Use Retry and confirm the request is re-issued and loading/error states update. (4) **Empty data:** With backend up and no data, confirm empty state is shown (not the error state). (5) **Accessibility:** Optionally verify with a screen reader that loading and error regions are announced (role/aria-live).

---

## 3. Shared context (coiRequests store)

- **Store:** `coi-prototype/frontend/src/stores/coiRequests.ts`
- **Behavior:** `fetchRequests()` sets `loading` and, on failure, `error` (API message or default: *"Failed to fetch requests. Is the backend running on port 3000?"*).
- **Decision:** Keep store default as-is. Each dashboard will show a **role/context-specific title** (e.g. "Could not load your requests") and optionally display `coiStore.error` as the detail message so technical info remains available where appropriate.

---

## 4. Dashboard-by-dashboard plan

### 4.1 RequesterDashboard

| Aspect | Current state | Action |
|--------|----------------|--------|
| **Loading** | Skeleton in "Recent Requests" card; table has loading state. | Keep as-is (already adequate). |
| **Error – main table** | EmptyState title: "Could not load requests"; body: `coiStore.error`. | **Replace title** with: *"Could not load your requests"*. Keep `:message="coiStore.error"`. Use EmptyState with `action: { label: 'Retry', onClick: () => coiStore.fetchRequests(), ariaLabel: 'Retry loading requests' }` and wrapper `role="alert"` / `aria-live="assertive"`. |
| **Error – Recent Requests card** | When `coiStore.error` is set, `recentRequests` is empty and card shows "No recent requests" (misleading). | **Add error branch:** Before the empty-state branch, add `v-else-if="coiStore.error"` and show EmptyState: title *"Could not load your recent requests"*, `:message="coiStore.error"`, `action: { label: 'Retry', onClick: () => coiStore.fetchRequests(), ariaLabel: 'Retry loading recent requests' }`. Wrap in a div with `role="alert"` and `aria-live="assertive"`. |

**Copy summary:** "Could not load your requests" / "Could not load your recent requests".

---

### 4.2 DirectorDashboard

| Aspect | Current state | Action |
|--------|----------------|--------|
| **Loading** | Spinner + "Loading..." in table. | Keep as-is; add `role="status"` and `aria-live="polite"` to the loading row container. |
| **Error** | Row: inline "Could not load requests" + `coiStore.error` + Retry. | **Use EmptyState** inside the error row: title *"Could not load team requests"*, `:message="coiStore.error"`, `action: { label: 'Retry', onClick: () => coiStore.fetchRequests(), ariaLabel: 'Retry loading team requests' }`. Put `role="alert"` and `aria-live="assertive"` on the `<td>` or a wrapper div inside it. |

**Copy summary:** "Could not load team requests".

---

### 4.3 ComplianceDashboard

| Aspect | Current state | Action |
|--------|----------------|--------|
| **Loading** | Spinner + "Loading..." in table. | Keep as-is; add `role="status"` and `aria-live="polite"` to the loading row container. |
| **Error** | Row: inline "Could not load requests" + `coiStore.error` + Retry. | **Use EmptyState** inside the error row: title *"Could not load compliance queue"*, `:message="coiStore.error"`, `action: { label: 'Retry', onClick: () => coiStore.fetchRequests(), ariaLabel: 'Retry loading compliance queue' }`. Put `role="alert"` and `aria-live="assertive"` on the `<td>` or a wrapper div inside it. |

**Copy summary:** "Could not load compliance queue".

---

### 4.4 PartnerDashboard

| Aspect | Current state | Action |
|--------|----------------|--------|
| **Loading** | Loading row (spinner + "Loading..."). | Keep as-is; add `role="status"` and `aria-live="polite"` to the loading row container. |
| **Error** | **Missing.** When `coiStore.error` is set, table shows empty "No pending approvals". | **Add error row:** Before the empty-state row, add `<tr v-else-if="coiStore.error && !loading">` with one `<td colspan="7">` containing **EmptyState**: title *"Could not load partner approvals"*, `:message="coiStore.error"`, `action: { label: 'Retry', onClick: () => coiStore.fetchRequests(), ariaLabel: 'Retry loading partner approvals' }`. Put `role="alert"` and `aria-live="assertive"` on the `<td>` or a wrapper div inside it. |

**Copy summary:** "Could not load partner approvals".

---

### 4.5 FinanceDashboard

| Aspect | Current state | Action |
|--------|----------------|--------|
| **Loading** | Spinner + "Loading..." in table. | Keep as-is; add `role="status"` and `aria-live="polite"` to the loading row container. |
| **Error** | Row: inline "Could not load requests" + `coiStore.error` + Retry. | **Use EmptyState** inside the error row: title *"Could not load finance queue"*, `:message="coiStore.error"`, `action: { label: 'Retry', onClick: () => coiStore.fetchRequests(), ariaLabel: 'Retry loading finance queue' }`. Put `role="alert"` and `aria-live="assertive"` on the `<td>` or a wrapper div inside it. |

**Copy summary:** "Could not load finance queue".

---

### 4.6 AdminDashboard

| Aspect | Current state | Action |
|--------|----------------|--------|
| **Loading** | Overview and Execution tab use `coiStore.requests` (and derived computeds) but **no loading UI**. | **Add loading:** On **Overview**, when `coiStore.loading` is true, show a subtle loading state (e.g. skeleton or spinner on the stats cards / system overview) with `role="status"` and `aria-live="polite"`. On **Execution** tab, add a loading table row using LoadingSpinner with message "Loading execution queue..." and same accessibility. |
| **Error** | **No error UI.** When `coiStore.error` is set, overview shows zeros and execution shows "No items in execution queue". | **Add error UI:** **Overview:** When `coiStore.error`, show EmptyState with title *"Could not load admin overview"*, `:message="coiStore.error"`, `action: { label: 'Retry', onClick: () => coiStore.fetchRequests(), ariaLabel: 'Retry loading admin overview' }`, inside a wrapper with `role="alert"` and `aria-live="assertive"`. **Execution tab:** Add an error row with one `<td colspan="6">` (execution table has 6 columns) containing EmptyState: title *"Could not load execution queue"*, `:message="coiStore.error"`, `action: { label: 'Retry', onClick: () => coiStore.fetchRequests(), ariaLabel: 'Retry loading execution queue' }`; put `role="alert"` and `aria-live="assertive"` on the cell or inner wrapper. |

**Copy summary:** "Could not load admin overview", "Could not load execution queue".

**Note:** Overview and Execution error blocks must use EmptyState with `:message="coiStore.error"` (Vue binding), not `message="{{ coiStore.error }}"`.

---

### 4.7 SuperAdminDashboard

| Aspect | Current state | Action |
|--------|----------------|--------|
| **Data sources** | COI requests (`coiStore.fetchRequests()`), users (`fetchUsers()`), audit logs (`fetchAuditLogs()`). No shared loading ref for initial load. | Add or reuse loading/error per section. |
| **Loading** | User list and audit logs have no loading indicator during first fetch. | **Add loading:** While `fetchUsers()` is in progress, show spinner or skeleton in the Users tab content. When `activeTab === 'logs'` and audit logs are loading, show spinner/skeleton in the logs area (may require a small `loadingLogs` ref). COI stats (Total Requests) already come from coiStore; if we show a global loading for initial mount, we can use `coiStore.loading` for the KPI row or leave KPIs as-is and only fix copy. |
| **Error** | Toasts: "Failed to fetch users", "Failed to fetch audit logs". | **Replace with inline EmptyState:** In Users tab when `usersError` is set, show EmptyState with title *"Could not load user list. Please try again."*, `:message="usersError"`, `action: { label: 'Retry', onClick: fetchUsers, ariaLabel: 'Retry loading user list' }` inside a wrapper with `role="alert"` and `aria-live="assertive"`. In Logs tab when `logsError` is set, show EmptyState with title *"Could not load audit logs. Please try again."*, `:message="logsError"`, `action: { label: 'Retry', onClick: fetchAuditLogs, ariaLabel: 'Retry loading audit logs' }` and same wrapper. Set error refs from catch blocks instead of (or in addition to) toasts. |

**Copy summary:** "Could not load user list. Please try again.", "Could not load audit logs. Please try again."

**Optional:** If Super Admin also shows a list of COI requests anywhere and uses `coiStore.error`, use title *"Could not load system requests"* for that block.

---

## 5. Implementation order

1. **PartnerDashboard** — Add missing error row (high impact; currently no error surface).
2. **RequesterDashboard** — Add error state to Recent Requests card; replace table error title.
3. **DirectorDashboard, ComplianceDashboard, FinanceDashboard** — Replace error title copy only (low risk).
4. **AdminDashboard** — Add loading and error for Overview and Execution tab.
5. **SuperAdminDashboard** — Add loading for users/logs; replace error copy and add inline error + Retry where appropriate.

---

## 6. Acceptance criteria (per execution plan)

- Each of the seven dashboards shows a **loading state** (spinner or skeleton) while the relevant API calls are in progress.
- Each dashboard shows a **clear, role- or context-specific error message** on failure (no generic "Failed to load" as the primary title).
- Where applicable, **Retry** is available (visible label "Retry", with context-specific `aria-label` per §1.1).
- Loading and error UIs follow the accessibility rules in §1.2 (role/aria-live). Error and loading patterns reuse components per §1.1.

---

## 7. Copy reference (quick lookup)

| Dashboard | Error message (title / context) |
|-----------|---------------------------------|
| Requester | "Could not load your requests" / "Could not load your recent requests" |
| Director | "Could not load team requests" |
| Compliance | "Could not load compliance queue" |
| Partner | "Could not load partner approvals" |
| Finance | "Could not load finance queue" |
| Admin | "Could not load admin overview" / "Could not load execution queue" |
| Super Admin | "Could not load user list. Please try again." / "Could not load audit logs. Please try again." |

---

## 8. Files to touch

| File | Changes |
|------|--------|
| `coi-prototype/frontend/src/components/ui/EmptyState.vue` | Extend `action` prop with optional `ariaLabel`; use `action.ariaLabel \|\| action.label` for button/link `aria-label`. |
| `coi-prototype/frontend/src/views/RequesterDashboard.vue` | Error title + EmptyState action.ariaLabel in table and mobile; add error branch + EmptyState in Recent Requests card. |
| `coi-prototype/frontend/src/views/DirectorDashboard.vue` | Replace inline error row with EmptyState in cell; add loading row role/aria-live. |
| `coi-prototype/frontend/src/views/ComplianceDashboard.vue` | Replace inline error row with EmptyState in cell; add loading row role/aria-live. |
| `coi-prototype/frontend/src/views/PartnerDashboard.vue` | Add error row with EmptyState in cell; add loading row role/aria-live. |
| `coi-prototype/frontend/src/views/FinanceDashboard.vue` | Replace inline error row with EmptyState in cell; add loading row role/aria-live. |
| `coi-prototype/frontend/src/views/AdminDashboard.vue` | Loading + error (EmptyState) on Overview; loading + error row (EmptyState, colspan=6) on Execution tab. |
| `coi-prototype/frontend/src/views/SuperAdminDashboard.vue` | Loading refs and error refs for Users and Logs; EmptyState inline error + Retry in both tabs. |

Store default error message: no change (dashboards override title only).

---

## Document history

- **v1:** Initial plan (dashboard-by-dashboard actions, copy reference, implementation order).
- **v2:** Incorporated reviewer (Qwen) feedback: added **§1 Consistency, reuse, and accessibility** (reusable EmptyState/LoadingSpinner pattern, Retry button and aria-label rules, `role="status"` / `aria-live="polite"` for loading, `role="alert"` / `aria-live="assertive"` for errors); added **§1.3 Testing**; tightened per-dashboard actions with explicit Retry accessibility and shared component usage; extended acceptance criteria to include accessibility and reuse.
- **v3:** Second round (Qwen): fixed §1.1 cross-reference (§5 → §7); made **EmptyState** the single error block pattern for all dashboards and required **EmptyState** to be extended with optional `action.ariaLabel`; specified use of EmptyState inside table error rows for Director, Compliance, Finance, Partner (with correct Vue binding `:message="coiStore.error"`); added loading row accessibility for all; clarified Execution tab colspan=6; expanded §1.3 Testing to include empty-data and accessibility checks; aligned SuperAdmin copy and EmptyState usage.
