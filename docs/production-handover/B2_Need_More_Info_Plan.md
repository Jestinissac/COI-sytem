# B2 — Wire "Need More Info" — Implementation Plan

**Purpose:** (1) Ensure Director (and other approvers) see and can use the "Request More Info" action in COI Request Detail; (2) Add `info_requests` table and persist each "need more info" as a row for history, while keeping current behaviour for status/notes and notifications.

**Scope:**
- **Frontend:** [COIRequestDetail.vue](coi-prototype/frontend/src/views/COIRequestDetail.vue) — button visibility and backend already wired at line ~1867.
- **Backend:** [coiController.js](coi-prototype/backend/src/controllers/coiController.js) — `requestMoreInfo` (allow Director, add insert into `info_requests`).
- **Database:** New table `info_requests` via migration in `coi-prototype/database/migrations/`.

**Reference:** [COI Customer Testing Execution Plan](COI_Customer_Testing_Execution_Plan.md) — B2. Wire "Need More Info" action for approvers.

---

## Current state

### Frontend (COIRequestDetail.vue)

- **Modal and API call:** "Need More Info" modal exists (lines ~1082–1112); `requestMoreInfo()` at line 1867 calls `POST /coi/requests/:id/need-more-info` with `info_required` and `comments`. This is already wired.
- **Visibility:** The "Need More Info" button is inside a block that shows only for **Compliance** and **Partner** (line 914):
  - `v-if="(userRole === 'Compliance' && request.status === 'Pending Compliance') || (userRole === 'Partner' && request.status === 'Pending Partner')"`
- **Director:** Does **not** see the button; they only see Approve/Reject and a tooltip that "Additional approval options (Restrictions, More Info) are available at Compliance level."

### Backend (coiController.js — requestMoreInfo)

- **Director blocked:** Lines 1268–1273 return 403 for `user.role === 'Director'` with message that "Need More Info" is for Compliance and Partner only.
- **Role/status handling:** Only Compliance (Pending Compliance), Partner (Pending Partner), and Finance (Pending Finance) have `updateField` / `notesField` set. Director is not handled.
- **Persistence:** Updates only `coi_requests`: sets role-specific status to `'Need More Info'`, notes field, `status = 'Draft'`, escalation_count, etc. No insert into an `info_requests` table; there is no history of multiple info requests.

### Database

- **coi_requests:** Has role-specific approval fields (e.g. `director_approval_status`, `director_approval_notes`; same for compliance, partner). No `info_required` column; the "latest" text is stored in the role notes (e.g. `compliance_review_notes`).
- **info_requests:** Table does not exist. Execution plan provides SQL (see below).

---

## Implementation

### Part 1 — Frontend: Show "Need More Info" for Director (and keep for others)

**File:** [COIRequestDetail.vue](coi-prototype/frontend/src/views/COIRequestDetail.vue)

**Goal:** Director sees the same "Need More Info" button when the request is in their queue (`Pending Director Approval`). Other approvers (Compliance, Partner, and optionally Finance) keep current visibility.

**Change:** Split the current "Additional Options" block into two blocks so that **only** "Need More Info" is shown to Director; "Approve with Restrictions" stays Compliance/Partner-only.

- **Current (lines ~914–934):** One block shows both buttons for Compliance and Partner only:
  ```html
  <!-- Enhanced Options (Compliance/Partner Only, NOT Directors) -->
  <div v-if="(userRole === 'Compliance' && request.status === 'Pending Compliance') || (userRole === 'Partner' && request.status === 'Pending Partner')" class="border-t pt-3 mt-3">
    <p class="text-xs text-gray-500 mb-2">Additional Options:</p>
    <div class="flex gap-2">
      <button ...>Approve with Restrictions</button>
      <button ...>Need More Info</button>
    </div>
  </div>
  ```

- **New structure:**
  1. **Need More Info** (single button) — visible for Director, Compliance, Partner, and optionally Finance:
     - Director when `request.status === 'Pending Director Approval'`
     - Compliance when `request.status === 'Pending Compliance'`
     - Partner when `request.status === 'Pending Partner'`
     - Finance when `request.status === 'Pending Finance'` (optional)
  2. **Approve with Restrictions** (single button) — visible only for Compliance and Partner (unchanged).

  Example replacement:

  ```html
  <!-- Need More Info: Director, Compliance, Partner (and optionally Finance) -->
  <div v-if="(userRole === 'Director' && request.status === 'Pending Director Approval') || (userRole === 'Compliance' && request.status === 'Pending Compliance') || (userRole === 'Partner' && request.status === 'Pending Partner')" class="border-t pt-3 mt-3">
    <p class="text-xs text-gray-500 mb-2">Additional Options:</p>
    <button
      @click="showInfoModal = true"
      :disabled="actionLoading"
      class="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
    >
      Need More Info
    </button>
  </div>

  <!-- Approve with Restrictions: Compliance and Partner only -->
  <div v-if="(userRole === 'Compliance' && request.status === 'Pending Compliance') || (userRole === 'Partner' && request.status === 'Pending Partner')" class="border-t pt-3 mt-3">
    <button
      @click="showRestrictionsModal = true"
      :disabled="actionLoading"
      class="w-full px-3 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
    >
      Approve with Restrictions
    </button>
  </div>
  ```

  To include Finance for "Need More Info", add to the first block’s condition: `|| (userRole === 'Finance' && request.status === 'Pending Finance')`.

**Consistent button styling:** Use the same button classes for "Need More Info" for all roles (e.g. `class="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"`) so the button looks identical whether the user is Director, Compliance, or Partner.

**Director tooltip (lines 932–936):** Update the note so it does not imply Directors cannot request more info. Replace the current text with: "Approval with restrictions is available at Compliance level." (Directors now have "Need More Info" in the block above, so the tooltip only clarifies where "Approve with Restrictions" lives.) Alternatively remove the Director-only tooltip entirely.

**Verification:** Log in as Director, open a request in "Pending Director Approval"; confirm "Need More Info" is visible; open modal, enter text, submit; confirm API succeeds and request returns to Draft with director approval status "Need More Info".

---

### Part 2 — Backend: Allow Director (and optionally Finance) and add info_requests

**File:** [coiController.js](coi-prototype/backend/src/controllers/coiController.js)

**2.1 Remove Director block and add Director to role/status handling**

- **Remove** the block that returns 403 for `user.role === 'Director'` (lines 1268–1273).
- **Replace** the role/status logic with a clear, ordered structure. Use the **exact** column names from the schema (e.g. `compliance_review_status` / `compliance_review_notes`, not `compliance_approval_status`):

  ```js
  let updateField, notesField
  if (user.role === 'Director' && request.status === 'Pending Director Approval') {
    updateField = 'director_approval_status'
    notesField = 'director_approval_notes'
  } else if (user.role === 'Compliance' && request.status === 'Pending Compliance') {
    updateField = 'compliance_review_status'
    notesField = 'compliance_review_notes'
  } else if (user.role === 'Partner' && request.status === 'Pending Partner') {
    updateField = 'partner_approval_status'
    notesField = 'partner_approval_notes'
  } else if (user.role === 'Finance' && request.status === 'Pending Finance') {
    updateField = 'finance_approval_status'
    notesField = 'finance_approval_notes'
  } else {
    return res.status(403).json({ error: 'You are not authorized to perform this action for the current request status.' })
  }
  ```

**2.2 Insert into info_requests in addition to updating coi_requests**

- After determining `updateField` / `notesField` and before or after the existing `UPDATE coi_requests`:
  - **Insert** one row into `info_requests`. The project uses **better-sqlite3** (synchronous), so use `db.prepare(...).run(...)`:

  ```js
  const db = getDatabase()
  db.prepare(`
    INSERT INTO info_requests (coi_request_id, requested_by, requested_by_role, info_required)
    VALUES (?, ?, ?, ?)
  `).run(
    req.params.id,
    req.userId,
    user.role,
    (req.body.info_required || '').trim() || 'Please provide more details.'
  )
  ```

- **Keep** the existing `UPDATE coi_requests` (status to Draft, role status/notes, escalation_count). The role notes field holds the "latest" text for display; no need to add an `info_required` column on `coi_requests` unless product requires it.

**Verification:** As Director and as Compliance, call "Need More Info" and confirm a new row in `info_requests` and that `coi_requests` is updated as today (status, notes, escalation_count). Notification and event emission remain unchanged.

---

### Part 3 — Database: Add info_requests table (migration)

**Location:** `coi-prototype/database/migrations/`

**New file:** Use a consistent naming convention, e.g. `20260210_add_info_requests_table.sql` (date + short description).

**Content (idempotent — safe to run multiple times):**

```sql
-- B2: Need More Info history (idempotent)
CREATE TABLE IF NOT EXISTS info_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coi_request_id INTEGER NOT NULL,
  requested_by INTEGER NOT NULL,
  requested_by_role VARCHAR(50) NOT NULL,
  info_required TEXT NOT NULL,
  response TEXT,
  responded_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id),
  FOREIGN KEY (requested_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_info_requests_coi_request_id ON info_requests(coi_request_id);
CREATE INDEX IF NOT EXISTS idx_info_requests_requested_by ON info_requests(requested_by);
```

**Applying the migration:**

- **Option A:** Run the file once manually (e.g. `sqlite3 path/to/db < 20260210_add_info_requests_table.sql`) or via a migration runner if the project has one.
- **Option B:** In [init.js](coi-prototype/backend/src/database/init.js), add a block that reads and executes this migration file (same pattern as the existing service catalog migration at line ~443). The use of `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` keeps the migration idempotent. Do not assume a generic "run all .sql files in migrations/" loop exists unless added; the current pattern is one migration file per block.

**Verification:** After migration, `SELECT * FROM info_requests` works; foreign keys to `coi_requests` and `users` are valid.

---

## File checklist

| # | File | Action |
|---|------|--------|
| 1 | coi-prototype/frontend/src/views/COIRequestDetail.vue | Show "Need More Info" for Director (and optionally Finance): extend or split the "Additional Options" block and update/remove Director tooltip. |
| 2 | coi-prototype/backend/src/controllers/coiController.js | Remove 403 for Director; add Director (and Finance if needed) to updateField/notesField; insert row into info_requests in requestMoreInfo. |
| 3 | coi-prototype/database/migrations/ | Add migration file (e.g. 20260210_add_info_requests_table.sql) with CREATE TABLE IF NOT EXISTS info_requests and CREATE INDEX IF NOT EXISTS. |
| 4 | coi-prototype/backend/src/database/init.js (optional) | Run the info_requests migration on init so the table exists without manual run. |

---

## Verification summary

1. **Frontend:** Director (and other approvers as configured) see "Request More Info" when the request is in their queue; modal opens and submit calls the API successfully.
2. **Backend:** requestMoreInfo accepts Director (and Finance if added); each call inserts one row into `info_requests` and still updates `coi_requests` and sends notifications as today.
3. **DB:** Table `info_requests` exists; rows are created with correct `coi_request_id`, `requested_by`, `requested_by_role`, `info_required`; optional `response`/`responded_at` for future use.

---

## Verification steps (per role and layer)

**Frontend (manual):**

- Log in as **Director**: open a request in "Pending Director Approval". **Expected:** "Need More Info" is visible; no tooltip saying Directors cannot request more info. Open modal, enter text, submit; request returns to Draft, director approval status "Need More Info".
- Log in as **Compliance**: open a request in "Pending Compliance". **Expected:** "Need More Info" and "Approve with Restrictions" both visible; "Need More Info" uses same button styling as for Director. Test modal and submit.
- Log in as **Partner**: open a request in "Pending Partner". **Expected:** Same as Compliance. Test modal and submit.
- Log in as **Finance** (if included): open a request in "Pending Finance". **Expected:** "Need More Info" visible and working.

**Backend:**

- Verify `requestMoreInfo` handles Director, Compliance, Partner, and Finance (when applicable) and returns 403 for other role/status combinations.
- Confirm each successful call inserts one row into `info_requests` and updates `coi_requests` (status, notes, escalation_count) and that notifications/events still fire.

**Database:**

- Confirm table `info_requests` exists with expected columns and indexes.
- After test calls, run `SELECT * FROM info_requests` and check `coi_request_id`, `requested_by`, `requested_by_role`, `info_required`; verify foreign keys (e.g. no orphan ids).

---

## Out of scope (explicit)

The following are **not** in scope for B2; document clearly to avoid confusion during implementation and testing:

- UI for requester to "respond" to an info request (filling `response`, `responded_at`); table supports it for later.
- Changing notification text or event payloads beyond what is needed for the new table.
- Adding an `info_required` column on `coi_requests` unless product explicitly wants a single "latest" field separate from role notes.
- A generic migration runner that runs all `.sql` files in `migrations/` (unless the team adds one); the plan assumes one migration file and optional single block in init.js).

---

## Qwen feedback incorporated

- **Frontend:** Consistent "Need More Info" button styling across roles; single block with one button and same classes. Tooltip clarified so Directors are not told they cannot request more info.
- **Backend:** Role handling expressed as an explicit if/else chain with correct schema column names (`compliance_review_status` / `compliance_review_notes`, etc.); insert into `info_requests` using better-sqlite3 `db.prepare().run()` with required fields only.
- **Migration:** File naming convention (`20260210_add_info_requests_table.sql`); idempotent `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`; note that init.js currently runs migrations by explicit path, not a generic loop.
- **Verification:** Role-by-role frontend checks (Director, Compliance, Partner, Finance) plus backend and DB checks; out-of-scope items listed explicitly.

---

## Final review (Qwen)

Before implementation, confirm:

- **Frontend:** "Need More Info" visible for Director, Compliance, Partner (and optionally Finance); "Approve with Restrictions" only for Compliance and Partner; tooltip updated; same button classes for "Need More Info" across roles.
- **Backend:** Role handling uses correct schema column names; 403 for Director removed; insert into `info_requests` with better-sqlite3; existing UPDATE to `coi_requests` (and notifications/events) kept.
- **Migration:** File name e.g. `20260210_add_info_requests_table.sql`; `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`; migration applied manually or via init.js.

---

## Final code snippets

Reference snippets only. Apply in the correct files and keep existing behaviour where noted.

### COIRequestDetail.vue (replace the single "Additional Options" block)

**File:** `coi-prototype/frontend/src/views/COIRequestDetail.vue`

- "Need More Info" uses **blue** styling; "Approve with Restrictions" uses **yellow** (do not use blue for both).

```html
<!-- Need More Info: Director, Compliance, Partner (and optionally Finance) -->
<div v-if="(userRole === 'Director' && request.status === 'Pending Director Approval') || (userRole === 'Compliance' && request.status === 'Pending Compliance') || (userRole === 'Partner' && request.status === 'Pending Partner')" class="border-t pt-3 mt-3">
  <p class="text-xs text-gray-500 mb-2">Additional Options:</p>
  <button
    @click="showInfoModal = true"
    :disabled="actionLoading"
    class="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
  >
    Need More Info
  </button>
</div>
<!-- Approve with Restrictions: Compliance and Partner only -->
<div v-if="(userRole === 'Compliance' && request.status === 'Pending Compliance') || (userRole === 'Partner' && request.status === 'Pending Partner')" class="border-t pt-3 mt-3">
  <button
    @click="showRestrictionsModal = true"
    :disabled="actionLoading"
    class="w-full px-3 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
  >
    Approve with Restrictions
  </button>
</div>
```

To include Finance in "Need More Info", add to the first `v-if`: `|| (userRole === 'Finance' && request.status === 'Pending Finance')`.

### coiController.js (requestMoreInfo)

**File:** `coi-prototype/backend/src/controllers/coiController.js`

- **Remove** the block that returns 403 for `user.role === 'Director'`.
- **Replace** the existing if/else (Compliance, Partner, Finance only) with the chain below; then **add** the insert into `info_requests`; **keep** the existing UPDATE to `coi_requests` (same SET and notes value as today: `\${comments || ''}\n\nInfo Required: \${info_required || '...'}`, plus `stage_entered_at`, `updated_at`, `WHERE id = ?`), and keep `sendNeedMoreInfoNotification`, `eventBus.emitEvent`, `res.json`.

```js
let updateField, notesField
if (user.role === 'Director' && request.status === 'Pending Director Approval') {
  updateField = 'director_approval_status'
  notesField = 'director_approval_notes'
} else if (user.role === 'Compliance' && request.status === 'Pending Compliance') {
  updateField = 'compliance_review_status'
  notesField = 'compliance_review_notes'
} else if (user.role === 'Partner' && request.status === 'Pending Partner') {
  updateField = 'partner_approval_status'
  notesField = 'partner_approval_notes'
} else if (user.role === 'Finance' && request.status === 'Pending Finance') {
  updateField = 'finance_approval_status'
  notesField = 'finance_approval_notes'
} else {
  return res.status(403).json({ error: 'You are not authorized to perform this action for the current request status.' })
}

const db = getDatabase()
db.prepare(`
  INSERT INTO info_requests (coi_request_id, requested_by, requested_by_role, info_required)
  VALUES (?, ?, ?, ?)
`).run(
  req.params.id,
  req.userId,
  user.role,
  (req.body.info_required || '').trim() || 'Please provide more details.'
)

// Keep existing UPDATE coi_requests (same SET: updateField, notesField, status = 'Draft', escalation_count, stage_entered_at, updated_at; notes = comments + info_required; WHERE id = ?)
// Keep sendNeedMoreInfoNotification, eventBus.emitEvent, res.json({ success: true })
```

**Current implementation reference (exact behaviour):** The UPDATE must pass the **combined notes** as the first argument and `req.params.id` as the second. Notifications and events use the following signatures:

```js
// UPDATE: notes = comments + "Info Required: " + info_required; two arguments to .run()
db.prepare(`
  UPDATE coi_requests 
  SET ${updateField} = 'Need More Info',
      ${notesField} = ?,
      status = 'Draft',
      escalation_count = COALESCE(escalation_count, 0) + 1,
      stage_entered_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`).run(`${comments || ''}\n\nInfo Required: ${info_required || 'Please provide more details.'}`, req.params.id)

sendNeedMoreInfoNotification(req.params.id, user.name, info_required || 'Please provide more details.')
eventBus.emitEvent(EVENT_TYPES.MORE_INFO_REQUESTED, {
  requestId: req.params.id,
  userId: user.id,
  targetUserId: request.requester_id,
  data: { request_id: request.request_id, info_required }
})
res.json({ success: true })
```

Do **not** use only `info_required` in `.run()` or generic messages for notification/event; the requester must see the actual info_required text and the event payload must match what My Day/Week expects.

### Migration file

**File:** `coi-prototype/database/migrations/20260210_add_info_requests_table.sql`

```sql
-- B2: Need More Info history (idempotent)
CREATE TABLE IF NOT EXISTS info_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coi_request_id INTEGER NOT NULL,
  requested_by INTEGER NOT NULL,
  requested_by_role VARCHAR(50) NOT NULL,
  info_required TEXT NOT NULL,
  response TEXT,
  responded_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id),
  FOREIGN KEY (requested_by) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_info_requests_coi_request_id ON info_requests(coi_request_id);
CREATE INDEX IF NOT EXISTS idx_info_requests_requested_by ON info_requests(requested_by);
```

### init.js (optional — run migration on startup)

**File:** `coi-prototype/backend/src/database/init.js`

Either read and execute the migration file (same pattern as the existing service catalog migration around line 443), or run the SQL inline. If inline, better-sqlite3 `db.exec()` can run multiple statements in one string; ensure the table and indexes are created (idempotent).

```js
// Optional: ensure info_requests exists on init (idempotent)
try {
  const db = getDatabase()
  db.exec(`
    CREATE TABLE IF NOT EXISTS info_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coi_request_id INTEGER NOT NULL,
      requested_by INTEGER NOT NULL,
      requested_by_role VARCHAR(50) NOT NULL,
      info_required TEXT NOT NULL,
      response TEXT,
      responded_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id),
      FOREIGN KEY (requested_by) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_info_requests_coi_request_id ON info_requests(coi_request_id);
    CREATE INDEX IF NOT EXISTS idx_info_requests_requested_by ON info_requests(requested_by);
  `)
} catch (e) {
  if (!e.message.includes('already exists')) console.error('info_requests migration:', e.message)
}
```

---

## Final verification

1. **Frontend:** Log in as Director, Compliance, Partner, Finance (if applicable); confirm "Need More Info" is visible only when appropriate; test modal and API for each role.
2. **Backend:** Confirm `requestMoreInfo` handles all roles and returns 403 for invalid role/status; each success inserts one row into `info_requests` and updates `coi_requests`; notifications and events still fire.
3. **Database:** Table `info_requests` exists with expected columns and indexes; after tests, `SELECT * FROM info_requests` shows correct `coi_request_id`, `requested_by`, `requested_by_role`, `info_required`; no orphan FKs.

---

## Verification complete

**Date:** 2025-02-10

- **Build:** Frontend `npm run build` (coi-prototype/frontend) passes; COIRequestDetail and B2 changes compile.
- **Init:** Backend init creates `info_requests` table (migration run from init.js); table verified present after init.
- **Manual:** Pending — run the steps under "Final verification" (Director/Compliance/Partner login, button visibility, modal and API, then backend/DB checks).
