# B8 — Dynamic approval flow & B6 — Permission config verification (plan)

**Priority 3 (Infrastructure + config)** from the COI Customer Testing Completion Plan.

**Status**

- **B8:** Implemented (migration, init, helper + approveRequest, config API and routes, WorkflowConfig.vue, route, Super Admin link). Verify build per **B8.5**.
- **B6:** Manual verification only; no code changes. Use **Part 2** scope and verification checklist; code readiness confirmed below.

---

## Part 1: B8 — Dynamic approval flow

### Current state

- **Approval flow:** Hardcoded in [coiController.js](coi-prototype/backend/src/controllers/coiController.js) `approveRequest` (approx. lines 1027–1096): Director → `Pending Compliance`, Compliance → `Pending Partner`, Partner → `Pending Finance`. Finance is not an approval step in that block; status `Pending Finance` leads to the generate-code endpoint, which sets status to `Approved`.
- **Config API:** [config.routes.js](coi-prototype/backend/src/routes/config.routes.js) exposes GET/POST `/workflow` which use [getWorkflowConfig](coi-prototype/backend/src/controllers/configController.js) / [saveWorkflowConfig](coi-prototype/backend/src/controllers/configController.js). These operate on the **form workflow** table `workflow_config` (step_order, step_name, step_status, required_role, etc.), **not** approval stages. No table or API exists yet for **approval** workflow stages.
- **Schema:** No `workflow_stages` table. `workflow_config` is for form steps; `sla_config` has a `workflow_stage` column (string) for SLA targets.

### B8 scope

1. **DB:** Add table `workflow_stages` and seed default chain Director → Compliance → Partner → Finance; Compliance `is_required = 1`.
2. **Backend:** Replace hardcoded next-status in `approveRequest` with a helper that reads from `workflow_stages`; keep Finance as special (Pending Finance → generate code → Approved).
3. **Config API:** New routes for workflow **stages** (GET/PUT list, reorder); Super Admin only; implement in configController.
4. **Frontend:** New WorkflowConfig.vue (list stages, sortable, active toggle, reorder); route under Super Admin.

---

### B8.1 — Database: table `workflow_stages` and seed

**New migration:** e.g. `coi-prototype/database/migrations/YYYYMMDD_workflow_stages.sql`

**Table columns (per spec):**

- `id` — INTEGER PRIMARY KEY AUTOINCREMENT
- `stage_order` — INTEGER NOT NULL (display and sequence order)
- `stage_name` — VARCHAR(100) (e.g. "Director", "Compliance", "Partner", "Finance")
- `role_required` — VARCHAR(50) (role that approves at this stage)
- `status_name` — VARCHAR(100) UNIQUE NOT NULL (e.g. "Pending Director Approval", "Pending Compliance", "Pending Partner", "Pending Finance")
- `next_stage_id` — INTEGER NULL (FK to workflow_stages.id; NULL for last stage before Approved)
- `is_active` — BOOLEAN DEFAULT 1
- `can_skip` — BOOLEAN DEFAULT 0
- `skip_condition` — TEXT NULL (optional JSON or expression for when stage can be skipped)
- `is_required` — BOOLEAN DEFAULT 0 (Compliance = 1 so it cannot be disabled)

**Seed default chain:**

| stage_order | stage_name | role_required | status_name                | next_stage_id | is_active | is_required |
|-------------|------------|---------------|----------------------------|---------------|-----------|-------------|
| 1           | Director   | Director      | Pending Director Approval  | 2             | 1         | 0           |
| 2           | Compliance | Compliance    | Pending Compliance         | 3             | 1         | 1           |
| 3           | Partner    | Partner       | Pending Partner           | 4             | 1         | 0           |
| 4           | Finance    | Finance       | Pending Finance            | NULL          | 1         | 0           |

After Finance there is no next stage; the existing generate-code endpoint sets status to `Approved`. So `next_stage_id = NULL` for Finance is correct.

- Add migration file (e.g. YYYYMMDD_add_workflow_stages_table.sql) in database/migrations; ensure it is run via the project migration or init process. Seed only if table is empty (idempotent); do not overwrite. Optional: index on role_required; status_name is already unique.

### B8.2 — Backend: helper and change to `approveRequest`

**File:** [coi-prototype/backend/src/controllers/coiController.js](coi-prototype/backend/src/controllers/coiController.js)

- **New helper** (e.g. `getNextApprovalStatus(currentStatus)`):
  - Query `workflow_stages` for the row where `status_name` = currentStatus` and `is_active = 1`.
  - If not found, return `null` (caller can treat as invalid or final).
  - If found and `next_stage_id` is not null, read next row by `id = next_stage_id` and return that row’s `status_name`.
  - If `next_stage_id` is null (Finance stage), return `null` to mean “next is Approved only after Finance generates code”; do not move to Approved from `approveRequest` for Finance.
- **Replace hardcoded next-status in `approveRequest`:**
  - Instead of setting `nextStatus = 'Pending Compliance'` / `'Pending Partner'` / `'Pending Finance'` from role/status ifs, call the helper: `nextStatus = getNextApprovalStatus(request.status)`.
  - If helper returns `null` and current role is not Finance, treat as “no next stage” (e.g. invalid transition or already at end). If current role is Finance and status is Pending Finance, do **not** set status to Approved in approveRequest — Finance step remains “generate code via existing endpoint → status becomes Approved”.
  - Keep existing logic for which `updateField` / `dateField` / `byField` / `notesField` / `restrictionsField` to set based on current role and status (Director vs Compliance vs Partner). Only the **value** of `nextStatus` becomes dynamic from `workflow_stages`.
- **Notification / role mapping:** The existing `roleMapping` object (`Pending Compliance` → Compliance, etc.) can remain for notifications, or be derived from `workflow_stages` (e.g. next row’s `role_required`) for consistency. Prefer one source of truth (workflow_stages) if you refactor.

**Finance behaviour (unchanged):**

- When status is `Pending Finance`, Finance does **not** approve via `approveRequest` to set Approved; they use the generate-engagement-code endpoint. That endpoint already sets status to `Approved`. So `approveRequest` should not accept Finance + Pending Finance as an approval that sets nextStatus; only Director/Compliance/Partner use `approveRequest` to move to the next stage.

---

### B8.3 — Config API: workflow-stages routes and controller

**File:** [coi-prototype/backend/src/routes/config.routes.js](coi-prototype/backend/src/routes/config.routes.js)

- Add routes (Super Admin only):
  - `GET /workflow-stages` — list all workflow stages ordered by `stage_order`.
  - `PUT /workflow-stages` — update one or more stages (e.g. is_active, can_skip, skip_condition, or reorder). Design so that reorder updates `stage_order` and optionally `next_stage_id` to keep chain consistent.
  - Optionally `PUT /workflow-stages/reorder` — body: array of `{ id, stage_order }` to reorder; then recalc `next_stage_id` so each stage points to the next by order.

**File:** [coi-prototype/backend/src/controllers/configController.js](coi-prototype/backend/src/controllers/configController.js)

- **getWorkflowStages:** SELECT * FROM workflow_stages ORDER BY stage_order. Return JSON array.
- **updateWorkflowStage:** Accept body with id and fields to update (e.g. is_active, can_skip, skip_condition). Do not allow setting `is_required = 0` for the Compliance stage (or enforce is_required in DB/validation). Use parameterized queries.
- **reorderWorkflowStages:** Accept body array of `{ id, stage_order }`. Update stage_order for each; then update all `next_stage_id` so that stage N’s next_stage_id = id of stage N+1 (and last stage has next_stage_id NULL).

Wire these in config.routes.js with `requireRole('Super Admin')` (and authenticateToken).

---

### B8.4 — Frontend: WorkflowConfig.vue and route

**New file:** [coi-prototype/frontend/src/views/WorkflowConfig.vue](coi-prototype/frontend/src/views/WorkflowConfig.vue)

- **List stages:** Fetch GET /config/workflow-stages (or whatever mount path config routes use, e.g. `/api/coi/config/workflow-stages`). Display table or list: stage_order, stage_name, role_required, status_name, is_active, is_required.
- **Sortable/reorder:** Use a sortable list (e.g. drag-handles and reorder, or up/down buttons). On reorder, call PUT workflow-stages/reorder with new order.
- **Active toggle:** Per stage, show a toggle for `is_active`. Disabled for the Compliance stage when `is_required === 1`. On change, call PUT workflow-stages (update single stage).
- **Styling:** Match existing admin/super-admin patterns (e.g. same card/table style as SuperAdminDashboard or PermissionConfig).
- **Access:** Only Super Admin (route meta or guard).

**Route:** [coi-prototype/frontend/src/router/index.ts](coi-prototype/frontend/src/router/index.ts)

- Add route under the COI / super-admin area, e.g. path `workflow-config`, name `WorkflowConfig`, component WorkflowConfig.vue, meta `{ roles: ['Super Admin'] }`. Full path e.g. `/coi/super-admin/workflow-config` (if base is `/coi` and super-admin is a child).

**Link from Super Admin:**

- In [SuperAdminDashboard.vue](coi-prototype/frontend/src/views/SuperAdminDashboard.vue) (Configuration tab or similar), add a link/card to “Workflow configuration” or “Approval stages” that navigates to `/coi/super-admin/workflow-config`.

---

### B8.5 — Verify build

After implementing B8, verify that the backend and frontend build and that the workflow-stages API and UI behave correctly.

**Backend**

- There is no separate `npm run migrate` script. The B8 migration runs on server startup in [init.js](coi-prototype/backend/src/database/init.js); ensure the server starts without errors so the `workflow_stages` table is created and seeded.
- From `coi-prototype/backend`: run `npm install`, then `npm run dev`. If port 3000 is in use, start on another port (e.g. `PORT=5000 npm run dev` or `PORT=5001 npm run dev`).

**Frontend**

- From `coi-prototype/frontend`: run `npm install`, then `npm run build` (vue-tsc + vite build). Then `npm run dev` to run the dev server (e.g. Vite on port 5173).

**API contract (for manual or automated tests)**

- All workflow-stages endpoints require authentication and **Super Admin** role. Without a valid JWT you get **401**; with a non–Super Admin role you get **403**.
- **Update stage:** The API uses **PUT `/api/config/workflow-stages`** with the stage **id in the body**, not in the path. Do not use `PUT /api/config/workflow-stages/:id`.

**Example test commands** (replace `YOUR_SUPER_ADMIN_JWT` with a token obtained after logging in as Super Admin):

**GET workflow stages**

```sh
curl -H "Authorization: Bearer YOUR_SUPER_ADMIN_JWT" http://localhost:5000/api/config/workflow-stages
```

Expected: JSON array of workflow stages (e.g. Director, Compliance, Partner, Finance) with `id`, `stage_order`, `stage_name`, `role_required`, `status_name`, `is_active`, `is_required`, etc.

**PUT reorder**

```sh
curl -X PUT http://localhost:5000/api/config/workflow-stages/reorder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_JWT" \
  -d '[{"id": 1, "stage_order": 2}, {"id": 2, "stage_order": 1}, {"id": 3, "stage_order": 3}, {"id": 4, "stage_order": 4}]'
```

Expected: `{"success": true, "message": "Workflow stages reordered"}` (or similar). Ensure the full ordered list is sent; the backend updates `stage_order` and recomputes `next_stage_id`.

**PUT update stage (e.g. toggle active)**

```sh
curl -X PUT http://localhost:5000/api/config/workflow-stages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_JWT" \
  -d '{"id": 1, "is_active": false}'
```

Expected: `{"success": true, "message": "Workflow stage updated"}`. The stage id is in the **body** (`id`), not in the URL path.

**Manual UI check**

1. Log in as **Super Admin**, open the Super Admin dashboard (e.g. `http://localhost:5173/coi/super-admin`).
2. Open the **Configuration** tab and click the **Workflow Configuration** card (or go to `/coi/super-admin/workflow-config`).
3. Confirm workflow stages load, reorder with up/down and **Save order**, and toggle **Active** where allowed (the Compliance stage's toggle is disabled when `is_required`).

---

## Part 2: B6 — Permission config verification

B6 is **manual verification**, not implementation. No code changes are required unless gaps are found.

### Scope

1. **Super Admin can configure all permissions**  
   Verify that in [PermissionConfig.vue](coi-prototype/frontend/src/views/PermissionConfig.vue) a Super Admin user can see and toggle all permissions (the plan refers to “24” — the codebase seeds 22 in [init.js](coi-prototype/backend/src/database/init.js) permissions array; verify whatever count exists in DB). Super Admin is treated as “has all” in [permissionService.js](coi-prototype/backend/src/services/permissionService.js); the UI should still load all permissions and allow viewing the matrix.

2. **Role–permission mapping persists and is enforced**  
   - **Persists:** Grant/revoke in PermissionConfig call [grantPermission](coi-prototype/backend/src/services/permissionService.js) / revokePermission and write to `role_permissions`. Verify that after refresh or re-login, the same role still has the same permissions.  
   - **Enforced:** Routes or features that use `requirePermission(permissionKey)` or [checkPermission](coi-prototype/backend/src/services/permissionService.js) (e.g. in [auth.js](coi-prototype/backend/src/middleware/auth.js)) actually deny access when the role does not have that permission, and allow when it does.

3. **Permission changes are audit-logged**  
   [permissionService.js](coi-prototype/backend/src/services/permissionService.js) already inserts into `permission_audit_log` on grant (around line 118) and revoke (around line 164). Verify that each grant/revoke in the UI creates an audit log entry (role, permission_key, action, changed_by, and reason when applicable). PermissionConfig.vue has an “Audit log” section; confirm it displays these entries.

### B6 code verification (readiness)

The following exist in the codebase and are ready for manual B6 verification:

- **permissionService.js:** `grantPermission`, `revokePermission`; both insert into `permission_audit_log` (role, permission_key, action, changed_by, reason on revoke). `checkPermission(userRole, permissionKey)` and helpers for any/every key.
- **init.js:** `permission_audit_log` table and indexes created; permissions seeded.
- **auth.js:** `requirePermission(permissionKey)` middleware; uses `checkPermission(req.userRole, permissionKey)`; returns 403 when missing.
- **permission.routes.js:** Grant/revoke endpoints call `grantPermission` / `revokePermission` with `req.userId`; audit-log endpoint returns logs for UI.
- **PermissionConfig.vue:** Audit section present; loads audit log via `/permissions/audit-log`; displays role, permission_key, action, changed_by, changed_at, reason.

### Verification checklist (manual)

- [ ] Log in as Super Admin; open Permission Config (e.g. `/coi/admin/permission-config`). All permissions listed; matrix shows roles and toggles.
- [ ] Toggle a permission for a non–Super Admin role; reload page — toggle state persists.
- [ ] Call an endpoint or use a feature that requires a permission; revoke that permission for the role; confirm access is denied; re-grant and confirm access allowed.
- [ ] After grant/revoke, open audit log in Permission Config; confirm new entries with correct role, permission_key, action, changed_by.
- [ ] Document any missing behaviour (e.g. permission not enforced somewhere, or audit not written) as follow-up tasks.

---

## Summary

| Item | Type | Action |
|------|------|--------|
| B8.1 | DB | Add migration `workflow_stages` table + seed Director → Compliance → Partner → Finance; Compliance is_required=1 |
| B8.2 | Backend | Helper from workflow_stages; replace hardcoded nextStatus in approveRequest; Finance remains generate-code → Approved |
| B8.3 | Backend | config.routes: GET/PUT workflow-stages, reorder; configController: getWorkflowStages, updateWorkflowStage, reorderWorkflowStages |
| B8.4 | Frontend | WorkflowConfig.vue (list, sortable, active toggle); route /coi/super-admin/workflow-config; link from Super Admin |
| B8.5 | Verify build | Backend/frontend install & build; API curl examples (GET/PUT workflow-stages, PUT reorder); note: update uses body `id`, not path `:id`; manual UI check |
| B6 | Verification | Manually verify permissionService + PermissionConfig: all permissions configurable, persistence, enforcement, audit log |

---

## Qwen feedback — what to use and what is optional

**Incorporated (add to plan or implementation):**

- **B8.1 Migration naming:** Use consistent naming, e.g. `YYYYMMDD_add_workflow_stages_table.sql` (or `YYYYMMDD_workflow_stages.sql`); align with existing migrations in [coi-prototype/database/migrations](coi-prototype/database/migrations).
- **B8.1 Seed idempotency:** Seed only if no rows exist (e.g. `SELECT COUNT(*) FROM workflow_stages`; if 0, run INSERTs). Do not overwrite existing data.
- **B8.1 Indexes (optional):** `status_name` is UNIQUE so already indexed in SQLite. Optionally add index on `role_required` if the UI or API filters by role. `stage_order` is used in ORDER BY and in reorder logic; index optional.
- **B8.2 Helper:** Add try/catch in `getNextApprovalStatus`; on DB error return null or rethrow so `approveRequest` can respond 500 or handle safely. Do not expose raw DB errors to client.
- **B8.3 PUT validation:** Validate and sanitize input: ids and stage_order as integers; is_active, can_skip as booleans. Use parameterized queries only. Reject unexpected or invalid payloads with 400.
- **B8.3 Reorder edge cases:** In `reorderWorkflowStages`, correctly set `next_stage_id` when a stage is moved to the first or last position (first has no previous; last has `next_stage_id = NULL`). Recompute all next_stage_id from the new order in one pass.
- **B8.4 Frontend:** Show success feedback (e.g. toast) after save/reorder; show error message on failed API and allow retry or dismiss. Match existing dashboard patterns for toasts/errors.
- **B6 Verification:** Add to checklist: test with at least two different non–Super Admin roles to confirm enforcement is consistent.

**Optional (not required for the plan to be complete):**

- **B8.4 Accessibility:** Keyboard-accessible reorder (e.g. up/down buttons with focus management) is good practice; not mandated in this plan.
- **Documentation:** Brief comments in code (e.g. why Compliance has `is_required = 1`) are recommended; not a separate deliverable.
- **Code reviews / testing:** Unit tests for the helper, integration tests for workflow-stages API, and E2E for WorkflowConfig are recommended post-implementation; not part of the implementation steps in this plan.

**Not required or already covered:**

- **B6 “Logging”:** Verification already includes “confirm new entries” in the permission audit log; that is the log to verify. No separate application logging step needed for B6.

---

## Implementation pitfalls (do not copy suggested code as-is)

When implementing B8, follow the **existing codebase patterns**. Suggested code from assistants often assumes a different stack.

**Database / migration**

- Use a **current** migration date (e.g. 20260210), not 20231015.
- **Seed:** SQLite auto-generates `id`; you cannot rely on "WHERE NOT EXISTS (SELECT 1 FROM workflow_stages WHERE id = 1)" for idempotent seed because ids do not exist before insert. Prefer: run seed only when `SELECT COUNT(*) FROM workflow_stages` returns 0; insert four rows; then update `next_stage_id` for the first three rows using their ids (or insert one-by-one and use `last_insert_rowid()`).

**Backend (coiController.js)**

- Use **better-sqlite3** (synchronous): `getDatabase()` and `db.prepare(...).get()` / `.all()`. No `await db.query()`.
- **getNextApprovalStatus** must be **synchronous**; return next `status_name` or null. Use try/catch.
- In **approveRequest**, only replace how `nextStatus` is set (call helper). Keep the existing if/else for `updateField`, `dateField`, `byField`, `notesField`, `restrictionsField` (e.g. `director_approval_status`, not `director_approved`).

**Backend (config)**

- Use **ES modules** and `getDatabase()` / `db.prepare()`. Do not build UPDATE from `Object.keys(updates)`. Identify Compliance by `status_name = 'Pending Compliance'` or `is_required = 1`, not by `id === 2`.

**Frontend**

- Use **Vue 3 Composition API** and `<script setup>`, not Options API. Use `api` from `@/services/api`. Config base path is **`/config/`** (e.g. `api.get('/config/workflow-stages')`). Add route as child of `super-admin` with `() => import('@/views/WorkflowConfig.vue')`. Add link in SuperAdminDashboard Configuration tab area.

---

## Key files

| Area | File(s) |
|------|--------|
| B8 DB | coi-prototype/database/migrations/YYYYMMDD_workflow_stages.sql |
| B8 approveRequest | coi-prototype/backend/src/controllers/coiController.js |
| B8 config API | coi-prototype/backend/src/routes/config.routes.js, configController.js |
| B8 frontend | coi-prototype/frontend/src/views/WorkflowConfig.vue, router/index.ts, SuperAdminDashboard.vue |
| B6 verify | permissionService.js, PermissionConfig.vue, auth.js (requirePermission), permission_audit_log |
