# B2 — Fix "Need More Info" (CHECK Constraint Error + Director Access)

**Error:** `CHECK constraint failed: director_approval_status IN ('Pending', 'Approved', 'Rejected')`
**Endpoint:** `POST /api/coi/requests/:id/need-more-info`

## Root Cause

Three bugs found:

1. **Stale live database** — The live `.db` file was created from an older `schema.sql` where `director_approval_status CHECK` only allowed `('Pending', 'Approved', 'Rejected')`. The current `schema.sql` (line 83) correctly includes `'Need More Info'` and `'Approved with Restrictions'`, but `CREATE TABLE IF NOT EXISTS` never recreates existing tables — so the old CHECK constraint persists.

2. **Director blocked in code** — `coiController.js` lines 1213-1218 explicitly return 403 for Directors trying to use "Need More Info".

3. **Wrong Finance column name** — `coiController.js` line 1231 references `finance_approval_status` but the schema has `finance_code_status`. This would crash Finance "Need More Info" too.

---

## Fix Steps (4 parts, do in order)

### Step 1: Delete and recreate the database

The simplest fix for the stale CHECK constraint. SQLite cannot ALTER CHECK constraints, so the table must be recreated.

```bash
# 1. Stop the backend server (Ctrl+C)

# 2. Find and delete the database file
ls coi-prototype/database/*.db
# e.g. coi-prototype/database/coi_dev.db or similar
rm coi-prototype/database/*.db

# 3. Restart the backend — init.js will recreate from current schema.sql
cd coi-prototype/backend && npm run dev
```

This reseeds demo users and starts with a clean DB using the correct CHECK constraints.

**Verify:** After restart, open SQLite and check:
```bash
sqlite3 coi-prototype/database/<dbname>.db ".schema coi_requests" | grep director_approval_status
```
Should show: `CHECK (director_approval_status IN ('Pending', 'Approved', 'Approved with Restrictions', 'Need More Info', 'Rejected'))`

#### Alternative: One-time script (keeps existing data)

If you need to keep data, run the fix script with the backend **stopped**:

```bash
cd coi-prototype/backend
# Stop the backend first, then:
NODE_ENV=development node scripts/fixB2CheckConstraint.js
# Then start the backend again
npm run dev
```

The script recreates `coi_requests` with the expanded CHECK and copies all rows. If the issue persists after init migration, this script runs the same logic in isolation.

---

### Step 2: Fix backend — coiController.js

**File:** `coi-prototype/backend/src/controllers/coiController.js`

#### 2a. Remove the Director 403 block

Find and **delete** these lines (around lines 1213-1218):

```javascript
// REMOVE THIS ENTIRE BLOCK:
    // Role-based validation: Directors cannot request more info (Compliance/Partner only)
    if (user.role === 'Director') {
      return res.status(403).json({
        error: 'Directors can only approve or reject requests. The "Need More Info" option is available to Compliance and Partner roles only.'
      })
    }
```

#### 2b. Add Director case to the role/status if-else chain

Replace the current if-else chain (which starts with Compliance) with this — adding Director at the top:

```javascript
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
      updateField = 'finance_code_status'
      notesField = 'partner_approval_notes'
    } else {
      return res.status(400).json({ error: 'Invalid action for current status' })
    }
```

**Note on Finance:** The schema has `finance_code_status` with CHECK `('Pending', 'Generated')` — it does NOT allow `'Need More Info'`. Two options:
- **Option A:** Don't support "Need More Info" for Finance (remove the Finance case entirely — Finance only generates codes, doesn't review). This is the safer option.
- **Option B:** Add a migration to change `finance_code_status` CHECK to include `'Need More Info'`.

**Recommended: Option A** — Remove the Finance case since Finance role generates engagement codes, not reviews COI requests. The final chain:

```javascript
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
    } else {
      return res.status(400).json({ error: 'Invalid action for current status' })
    }
```

#### 2c. Add INSERT into info_requests (after the updateField/notesField block, before the existing UPDATE)

Add this before the existing `db.prepare('UPDATE coi_requests ...')`:

```javascript
    // Track info request history (B2d)
    try {
      db.prepare(`
        INSERT INTO info_requests (coi_request_id, requested_by, requested_by_role, info_required)
        VALUES (?, ?, ?, ?)
      `).run(
        req.params.id,
        req.userId,
        user.role,
        (req.body.info_required || '').trim() || 'Please provide more details.'
      )
    } catch (infoErr) {
      // Table may not exist yet if migration hasn't run — log and continue
      devLog('info_requests insert skipped:', infoErr.message)
    }
```

**Keep the existing UPDATE, notification, and event emission exactly as-is.** The UPDATE on lines 1239-1248 already correctly sets `${updateField} = 'Need More Info'` and the notes/status/escalation fields.

---

### Step 3: Fix frontend — COIRequestDetail.vue

**File:** `coi-prototype/frontend/src/views/COIRequestDetail.vue`

#### 3a. Show "Need More Info" button for Director

Find the block that shows "Additional Options" (around line 914). It currently has:

```html
<div v-if="(userRole === 'Compliance' && request.status === 'Pending Compliance') || (userRole === 'Partner' && request.status === 'Pending Partner')" class="border-t pt-3 mt-3">
```

Replace the v-if to include Director:

```html
<!-- Need More Info: Director, Compliance, Partner -->
<div v-if="(userRole === 'Director' && request.status === 'Pending Director Approval') || (userRole === 'Compliance' && request.status === 'Pending Compliance') || (userRole === 'Partner' && request.status === 'Pending Partner')" class="border-t pt-3 mt-3">
  <p class="text-xs text-gray-500 mb-2">Additional Options:</p>
  <div class="flex gap-2">
    <!-- Approve with Restrictions: Compliance and Partner only -->
    <button
      v-if="userRole === 'Compliance' || userRole === 'Partner'"
      @click="showRestrictionsModal = true"
      :disabled="actionLoading"
      class="flex-1 px-3 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
    >
      Approve with Restrictions
    </button>
    <!-- Need More Info: all three roles -->
    <button
      @click="showInfoModal = true"
      :disabled="actionLoading"
      class="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
    >
      Need More Info
    </button>
  </div>
</div>
```

#### 3b. Update or remove the Director tooltip

Find the Director-only tooltip (around lines 932-936) that says something like:
```
"Additional approval options (Restrictions, More Info) are available at Compliance level."
```

**Replace** with:
```html
<!-- Director note: Approve with Restrictions is available at Compliance level -->
<p v-if="userRole === 'Director' && request.status === 'Pending Director Approval'" class="text-xs text-gray-400 mt-2">
  Approval with restrictions is available at Compliance level.
</p>
```

Or **remove** the tooltip entirely since Director now has "Need More Info" in the block above.

---

### Step 4: Add info_requests table

**File:** `coi-prototype/backend/src/database/init.js`

Add this block after the existing schema initialization (after the `statements.forEach(...)` block, around line 61):

```javascript
  // B2: Create info_requests table for Need More Info history
  try {
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
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error('info_requests migration error:', error.message)
    }
  }
```

---

## Verification

### Test 1: Director "Need More Info"
1. Delete the DB file and restart backend
2. Log in as **Requester** → Create and submit a COI request
3. Log in as **Director** → Open the request (should be "Pending Director Approval")
4. Verify "Need More Info" button is visible
5. Click it → Enter text → Submit
6. **Expected:** No error. Request status changes to "Draft". `director_approval_status` = "Need More Info". A row is inserted into `info_requests`.

### Test 2: Compliance "Need More Info"
1. Submit a new request → Approve as Director → request moves to "Pending Compliance"
2. Log in as **Compliance** → Open the request
3. Verify both "Approve with Restrictions" and "Need More Info" buttons are visible
4. Click "Need More Info" → Enter text → Submit
5. **Expected:** No error. `compliance_review_status` = "Need More Info". Row in `info_requests`.

### Test 3: Partner "Need More Info"
Same flow as Compliance, but at Partner stage.

### Test 4: Verify info_requests table
```sql
SELECT * FROM info_requests;
```
Should show one row per "Need More Info" action with correct `coi_request_id`, `requested_by`, `requested_by_role`, `info_required`.

---

## Summary of changes

| File | Change |
|------|--------|
| Database file (`.db`) | Delete and recreate from current schema.sql |
| `backend/src/database/init.js` | Add `info_requests` table creation |
| `backend/src/controllers/coiController.js` | Remove Director 403 block; add Director to role/status chain; remove Finance case; add INSERT into info_requests |
| `frontend/src/views/COIRequestDetail.vue` | Extend "Need More Info" v-if to include Director; update Director tooltip |
