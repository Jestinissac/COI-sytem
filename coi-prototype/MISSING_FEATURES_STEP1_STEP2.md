# Missing Features: Step 1 & Step 2 Workflow Compliance

## Workflow Requirements (from COI Workflow text.txt)

### Step 1: Processing the initial form
- ✅ The requester shall initiate his request for either a proposal/engagement after filling in the mandatory information
- ✅ Choose from the drop list the client's name and include other specifications or create a new client
- ⚠️ **The requester shall be the director responsible with the option to assign this authority to any member of his team**
- ❌ **In the event of the form being filled by any other team member, the respective director's written approval shall be attached to the request**

### Step 2: Upon Chosen of International Operations
- ✅ Another additional tab shall be active upon the checking this box
- ✅ Attached an excel sheet including the required information currently required by Global COI portal

---

## Current Implementation Status

### ✅ What's Working:
1. Directors can create requests (role = 'Director')
2. Team members (Requesters) have `director_id` field linking them to their director
3. When team member submits, status goes to "Pending Director Approval"
4. Directors can see and approve team member requests in their dashboard
5. `coi_attachments` table exists in database schema

### ❌ What's Missing:

#### 1. Document Upload for Director Approval
**Requirement**: "the respective director's written approval shall be attached to the request"

**Missing**:
- No file upload UI in the request form
- No way to attach director's written approval document when team member submits
- No attachment display in request detail view
- No backend endpoint for file uploads

**Impact**: Team members cannot attach director's written approval as required by workflow

#### 2. Director Delegation Management
**Requirement**: "The requester shall be the director responsible with the option to assign this authority to any member of his team"

**Missing**:
- No UI for directors to assign/manage team members
- No way to see which team members are assigned to which director
- No delegation authority tracking
- Team member assignment is only done via `director_id` in user creation (Super Admin only)

**Impact**: Directors cannot manage their team assignments themselves

#### 3. Workflow Clarity
**Requirement**: Clear distinction between Director-as-requester vs Team-member-as-requester

**Missing**:
- No clear indication in the form that Directors don't need approval
- No warning/notice for team members that they need director approval
- No visual distinction showing who is the responsible director

**Impact**: Users may be confused about approval requirements

---

## Implementation Plan

### Priority 1: Document Upload for Director Approval
1. Add file upload component to request form (for team members)
2. Create backend endpoint: `POST /api/coi/requests/:id/attachments`
3. Store files in `uploads/` directory (prototype) or database (production)
4. Display attachments in request detail view
5. Add attachment type: `'director_approval'`

### Priority 2: Director Delegation UI
1. Add "Team Management" section to Director Dashboard
2. Allow directors to:
   - View their current team members
   - Assign new team members (from their department)
   - Remove team members
3. Update user's `director_id` field via API

### Priority 3: Workflow Clarity
1. Add notice in request form for team members: "This request requires director approval"
2. Show director name in request form header
3. Add visual indicator when director creates request (no approval needed)

---

## Database Schema (Already Exists)
```sql
CREATE TABLE coi_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coi_request_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_type VARCHAR(50),
    file_size INTEGER,
    uploaded_by INTEGER,
    attachment_type VARCHAR(50), -- 'justification', 'approval_document', 'isqm_form', 'global_clearance_excel'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);
```

**Note**: `attachment_type` should include `'director_approval'` for director approval documents.

---

## Next Steps
1. Implement file upload backend endpoint
2. Add file upload UI to request form
3. Add attachment display to request detail view
4. Add Director team management UI
5. Add workflow clarity indicators

