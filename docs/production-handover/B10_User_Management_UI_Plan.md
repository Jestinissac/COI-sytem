# B10 — User management UI (plan)

## Objective

Verify and complete the User management UI in **SuperAdminDashboard.vue** (Users tab): table columns, create/edit modals, disable/enable, and filters. Do **not** require all 24 permissions for this tab; B6 (permission config) is separate.

---

## Current state

**File:** [coi-prototype/frontend/src/views/SuperAdminDashboard.vue](coi-prototype/frontend/src/views/SuperAdminDashboard.vue)

| Item | Status |
|------|--------|
| **Table columns** | Name, Email, Role, Department, Status (Active/Inactive), Actions. **Missing:** Line of service (optional; backend has it, GET /users does not return it). |
| **Create modal** | Name, Email, Password, Role, Department. **Missing:** Line of service (optional). |
| **Edit modal** | Name, Email, Role, Department. **Missing:** Line of service (optional). |
| **Disable / Enable** | Present: Disable (red), Enable (green); Super Admin cannot be disabled. |
| **Filters** | Search (name/email), **Role** dropdown. **Missing:** **Department** filter, **Active** filter (All / Active / Inactive). |

**Backend:** [authController.js](coi-prototype/backend/src/controllers/authController.js) — `getAllUsers` returns `id, name, email, role, department, active` (no `line_of_service`). `createUser` and `updateUser` already accept `line_of_service`. Routes: GET `/auth/users` (authenticateToken only); POST/PUT/disable/enable require `requireRole('Super Admin')`. No granular permission checks for the Users tab; access is by route (Super Admin dashboard).

**Schema:** `users` has `department`, `line_of_service` (VARCHAR(100)).

---

## Scope

1. **Table:** Ensure columns: name, email, role, department, **line_of_service** (if needed; optional column), active (Status), actions. Add line_of_service column and backend support for it in GET response.
2. **Create modal:** Add optional **Line of service** field; send in POST body.
3. **Edit modal:** Add optional **Line of service** field; send in PUT body.
4. **Disable/Enable:** Keep as-is (no change).
5. **Filters:** Add **department** filter (All, Audit, Tax, Advisory, Accounting, Other) and **active** filter (All, Active, Inactive). Keep existing search and role filter.
6. **Permissions:** Do **not** gate the Users tab on the 24 granular permissions. Access remains via Super Admin dashboard route; B6 is separate.

---

## 1. Backend: return `line_of_service` in GET /users

**File:** [coi-prototype/backend/src/controllers/authController.js](coi-prototype/backend/src/controllers/authController.js)

- In `getAllUsers`, add `line_of_service` to the SELECT (after `department`). Schema already has the column.  
  Example: `SELECT id, name, email, role, department, line_of_service, COALESCE(active, 1) as active FROM users ORDER BY name`.
- Keep existing `db.prepare(...).all()` and `res.json(users)` — this codebase uses **better-sqlite3** (synchronous), not `db.query()` / `users.rows`. Do not replace with async/await DB calls.
- Keep or add a brief comment that `COALESCE(active, 1)` defaults to active when the column is missing (backward compatibility).

---

## 2. Frontend: table column Line of service

**File:** [coi-prototype/frontend/src/views/SuperAdminDashboard.vue](coi-prototype/frontend/src/views/SuperAdminDashboard.vue)

- In the Users table `<thead>`, add a column **Line of service** (e.g. after Department, before Status). Match existing header style (e.g. `class="px-4 py-3 text-left font-medium"`).
- In the table body, add a cell: `{{ user.line_of_service || '—' }}` (or equivalent for empty). Keep cell styling consistent with other columns.
- Optional: add a `title` (tooltip) on the header or cell for "Line of service" if the term may be unclear to users.
- No change to `fetchUsers` mapping if backend returns `line_of_service`; response is spread into `users.value` so the field will appear automatically.

---

## 3. Frontend: filters (department, active)

**File:** [coi-prototype/frontend/src/views/SuperAdminDashboard.vue](coi-prototype/frontend/src/views/SuperAdminDashboard.vue)

- Add refs with default empty: `departmentFilter = ref('')`, `activeFilter = ref('')`. Use option values `'Active'` / `'Inactive'` for active filter so logic is clear (empty = All).
- In the filters bar (next to existing role dropdown), add:
  - **Department** dropdown: options All Departments (value `''`), Audit, Tax, Advisory, Accounting, Other.
  - **Status** (or Active) dropdown: options All (value `''`), Active, Inactive.
- In `filteredUsers` computed (extend existing logic):
  - If `departmentFilter.value`, filter by `user.department === departmentFilter.value`.
  - If `activeFilter.value === 'Active'`, keep only users where `user.active` is truthy; if `activeFilter.value === 'Inactive'`, keep only falsy; if `''`, do not filter by status.
- No need to reset filters on other actions unless you add an explicit "Clear filters" control; default `''` is sufficient.

---

## 4. Frontend: create modal — Line of service

**File:** [coi-prototype/frontend/src/views/SuperAdminDashboard.vue](coi-prototype/frontend/src/views/SuperAdminDashboard.vue)

- Add `line_of_service: ''` to the `newUser` ref object.
- In the Add User modal, add an optional field **Line of service** (text input). Use a clear placeholder (e.g. "Optional" or "e.g. Audit — Financial Services"). Do not add to `isNewUserValid`; leave creation validation as name, email, password, role, department only.
- In `handleAddUser`, send the request with existing `api.post('/auth/users', ...)`. Include `line_of_service: newUser.value.line_of_service || undefined` (or null) in the payload. Backend treats it as optional.
- In `closeAddUserModal`, reset the full `newUser` object including `line_of_service: ''`.

---

## 5. Frontend: edit modal — Line of service

**File:** [coi-prototype/frontend/src/views/SuperAdminDashboard.vue](coi-prototype/frontend/src/views/SuperAdminDashboard.vue)

- Once GET /users returns `line_of_service`, `openEditUserModal(user)` sets `editingUser.value = { ...user }`, so the field is **pre-filled** from the backend. No extra fetch needed.
- In the Edit User modal, add an optional **Line of service** text input bound to `editingUser.line_of_service`. Use the same placeholder as create if desired.
- In `handleUpdateUser`, keep using `api.put(\`/auth/users/${editingUser.value.id}\`, { ... })` and include `line_of_service: editingUser.value.line_of_service ?? null` in the body. Backend accepts optional; leaving it unchanged or clearing it must not cause errors.
- `isEditUserValid` stays as-is (name, email, role, department required); line_of_service remains optional.

---

## 6. Permissions (no change)

- The Users tab is shown to anyone who can open the Super Admin dashboard (route-level). The component uses `usePermissions()` elsewhere (e.g. link to permission-config); the **Users tab** must not require the 24 granular permissions to view or use. No new permission checks for the Users tab; B6 is separate.

---

## Summary

| # | Task | File(s) |
|---|------|--------|
| 1 | Add `line_of_service` to GET /users response | authController.js |
| 2 | Add table column Line of service | SuperAdminDashboard.vue |
| 3 | Add department and active filters (refs + UI + filteredUsers) | SuperAdminDashboard.vue |
| 4 | Add Line of service to create modal and POST | SuperAdminDashboard.vue |
| 5 | Add Line of service to edit modal and PUT | SuperAdminDashboard.vue |
| 6 | Confirm no 24-permission gate for Users tab | No code change |

---

## Qwen feedback — what to use and what to correct

**Useful and incorporated above:**
- Backward compatibility: keep `COALESCE(active, 1)` and a brief comment; add `line_of_service` to SELECT (schema has it).
- Table: consistent styling for the new column; optional tooltip for "Line of service."
- Filters: default `ref('')` for department and active filters; clear option values (e.g. `'Active'` / `'Inactive'`) in `filteredUsers`.
- Create modal: optional field, clear placeholder, reset `line_of_service` in `closeAddUserModal`; do not add to required validation.
- Edit modal: explicitly note that `line_of_service` is pre-filled from `user` once GET returns it; updating without changing the field must work.

**Do not copy Qwen’s code as-is:**
- **Backend:** This app uses **better-sqlite3** (synchronous). Use `db.prepare('SELECT ...').all()` and `res.json(users)`. Do **not** use `db.query()`, `users.rows`, or async/await for this query.
- **Frontend:** Use the existing **api** (axios) instance for `api.get`, `api.post`, `api.put` — do not replace with raw `fetch()`.

---

## Implementation notes (code examples)

When implementing, follow the **existing file patterns** in [SuperAdminDashboard.vue](coi-prototype/frontend/src/views/SuperAdminDashboard.vue) and [authController.js](coi-prototype/backend/src/controllers/authController.js). The examples in the feedback are illustrative; adjust as follows.

1. **Backend**
   - Use `const db = getDatabase()` (already imported from `../database/init.js` in authController). Do **not** add `require('better-sqlite3')` or a new db instance in the controller. The project uses **ES modules** (`import` / `export`), not CommonJS.

2. **filteredUsers**
   - **Extend** the existing computed; do **not** replace it. The current logic already applies `userSearch` (name/email) and `roleFilter`. Add `departmentFilter` and `activeFilter` in the same computed so all four filters apply together (search, role, department, active).

3. **PUT (edit user)**
   - The current `handleUpdateUser` sends an **explicit** body: `{ name, email, role, department }`. Add `line_of_service: editingUser.value.line_of_service ?? null` to that object. Do **not** send `...editingUser.value` as the body (it includes `id`, `active`, etc.; keep the payload explicit).

4. **POST (create user)**
   - The current `handleAddUser` sends `api.post('/auth/users', newUser.value)`. Adding `line_of_service: ''` to the `newUser` ref is enough; the backend already accepts optional `line_of_service`. Optionally send `line_of_service: newUser.value.line_of_service || undefined` if you want to omit the key when empty.

5. **API import**
   - In SuperAdminDashboard, `api` is imported from `@/services/api`. Use that; no need to change the import path.

---

## Out of scope (B6)

- Permission-config UI and the 24 permissions model are separate (B6). This plan only ensures the User management CRUD and filters work and do not depend on those permissions.
