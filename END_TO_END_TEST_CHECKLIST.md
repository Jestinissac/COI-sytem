# End-to-End Test Checklist: Resubmission Feature

## Prerequisites
- ✅ Backend server running on `http://localhost:3000`
- ✅ Frontend server running on `http://localhost:5173`
- ✅ Database initialized with rejection columns
- ✅ Test users available:
  - Requester (e.g., `patricia.white@company.com`)
  - Approver (Director/Compliance/Partner)

---

## Test Scenario 1: Fixable Rejection → Successful Resubmission

### Step 1: Create and Submit Request
- [ ] Login as Requester
- [ ] Create new COI request
- [ ] Fill required fields (client, service type, etc.)
- [ ] Submit request
- [ ] **Verify**: Request status = "Pending Director Approval" or "Pending Compliance"

### Step 2: Reject as Fixable
- [ ] Logout and login as Approver (Director/Compliance/Partner)
- [ ] Navigate to pending requests
- [ ] Open the request detail page
- [ ] Click "Reject" button
- [ ] **Verify**: Rejection modal opens with:
  - [ ] Two radio buttons: "Fixable" and "Permanent"
  - [ ] "Fixable" is selected by default
  - [ ] Rejection reason textarea is visible
- [ ] Select "Fixable (allows resubmission)"
- [ ] Enter rejection reason: "Missing client information. Please provide complete client details."
- [ ] Click "Reject"
- [ ] **Verify**:
  - [ ] Request status changes to "Rejected"
  - [ ] Success message appears
  - [ ] Modal closes

### Step 3: View as Requester (Dashboard)
- [ ] Logout and login as Requester
- [ ] Navigate to Requester Dashboard
- [ ] Click "Rejected" tab
- [ ] **Verify**:
  - [ ] Rejected request appears in table
  - [ ] Rejection Type badge shows "Fixable" (amber/yellow color)
  - [ ] Rejection reason is displayed (truncated if long)
  - [ ] "Resubmit" button is visible
  - [ ] "View" button is visible

### Step 4: View as Requester (Detail Page)
- [ ] Click "View" on the rejected request
- [ ] **Verify**:
  - [ ] Rejection alert banner appears at top (amber/yellow background)
  - [ ] Banner shows "Request Rejected" with "Fixable" badge
  - [ ] Rejection reason is displayed
  - [ ] Message: "You can modify and resubmit this request after addressing the feedback above."
  - [ ] "Modify and Resubmit" button is visible in header
  - [ ] "Create New Request" button is NOT visible

### Step 5: Resubmit Request
- [ ] Click "Modify and Resubmit" button (or "Resubmit" from dashboard)
- [ ] **Verify**:
  - [ ] Success message: "Request converted to draft. You can now edit and resubmit."
  - [ ] Request status changes to "Draft"
  - [ ] "Edit Draft" button appears in header
  - [ ] Rejection banner disappears
  - [ ] All approval statuses are reset (no previous approvals shown)

### Step 6: Edit and Resubmit
- [ ] Click "Edit Draft"
- [ ] **Verify**: Request form opens with existing data
- [ ] Add missing information (e.g., complete client details)
- [ ] Submit request
- [ ] **Verify**: Request goes through approval workflow again

---

## Test Scenario 2: Permanent Rejection → No Resubmission

### Step 1: Reject as Permanent
- [ ] Login as Approver
- [ ] Find another pending request
- [ ] Click "Reject"
- [ ] Select "Permanent (no resubmission)"
- [ ] Enter reason: "Hard IESBA prohibition violation. Cannot be mitigated."
- [ ] Click "Reject"
- [ ] **Verify**: Request status = "Rejected"

### Step 2: View as Requester (Dashboard)
- [ ] Login as Requester
- [ ] Go to "Rejected" tab
- [ ] **Verify**:
  - [ ] Rejected request appears
  - [ ] Rejection Type badge shows "Permanent" (red color)
  - [ ] "Resubmit" button is NOT visible
  - [ ] "New Request" link is visible instead

### Step 3: View as Requester (Detail Page)
- [ ] Click "View" on permanent rejection
- [ ] **Verify**:
  - [ ] Rejection alert banner appears (red background)
  - [ ] Banner shows "Permanent" badge
  - [ ] Message: "This rejection is final and cannot be resubmitted. Please create a new request if circumstances have changed."
  - [ ] "Modify and Resubmit" button is NOT visible
  - [ ] "Create New Request" button is visible

### Step 4: Attempt Resubmission (Should Fail)
- [ ] Try to access resubmit endpoint directly (if possible)
- [ ] **Verify**: API returns 400 error: "This request was permanently rejected and cannot be resubmitted..."

---

## Test Scenario 3: Client Rejection (Automatic Permanent)

### Step 1: Execute Proposal
- [ ] Login as Admin
- [ ] Find an approved request
- [ ] Execute proposal (generate engagement code)
- [ ] **Verify**: Request status = "Active" or "Pending Client Response"

### Step 2: Record Client Rejection
- [ ] Record client response as "Rejected"
- [ ] Add notes: "Client declined the proposal"
- [ ] **Verify**:
  - [ ] Request status = "Rejected"
  - [ ] Rejection type = "permanent" (automatic)
  - [ ] Rejection reason = client's notes

### Step 3: Verify Permanent Status
- [ ] Login as Requester
- [ ] View the rejected request
- [ ] **Verify**: Same as Test Scenario 2, Step 3 (permanent rejection behavior)

---

## Test Scenario 4: Rejection Type Selection UI

### Step 1: Test Rejection Modal
- [ ] Login as Approver
- [ ] Open reject modal for any pending request
- [ ] **Verify**:
  - [ ] Two radio button options visible:
    - "Fixable (allows resubmission)" with explanation
    - "Permanent (no resubmission)" with explanation
  - [ ] Default selection is "Fixable"
  - [ ] Rejection reason textarea is required (button disabled if empty)
  - [ ] Visual feedback on selection (border/background color changes)

### Step 2: Test Both Types
- [ ] Reject one request as "Fixable" → verify resubmission works
- [ ] Reject another as "Permanent" → verify resubmission blocked

---

## Test Scenario 5: Notification Verification

### Step 1: Check Email Notifications
- [ ] After rejecting a request (both types), check requester's email
- [ ] **Verify for Fixable Rejection**:
  - [ ] Subject: "COI Request [ID] - Rejected"
  - [ ] Body includes: "Rejection Type: Fixable (Can Resubmit)"
  - [ ] Body includes: "You can modify and resubmit this request..."
  - [ ] Link to request detail page included

- [ ] **Verify for Permanent Rejection**:
  - [ ] Subject: "COI Request [ID] - Rejected (Final)"
  - [ ] Body includes: "Rejection Type: Permanent (Final)"
  - [ ] Body includes: "This rejection is final and cannot be resubmitted..."
  - [ ] Link to request detail page included

---

## Test Scenario 6: Edge Cases & Validation

### Step 1: Authorization Check
- [ ] As Requester A, try to resubmit Requester B's rejected request
- [ ] **Verify**: 
  - [ ] API returns 403 error
  - [ ] Error message: "Only the requester can resubmit this request"
  - [ ] Resubmit button not visible (frontend check)

### Step 2: Status Validation
- [ ] Try to resubmit a request that is not "Rejected" (e.g., "Draft" or "Approved")
- [ ] **Verify**:
  - [ ] API returns 400 error
  - [ ] Error message: "Only rejected requests can be resubmitted"
  - [ ] Resubmit button not visible (frontend check)

### Step 3: Backward Compatibility
- [ ] Check if old rejected requests (before feature) exist
- [ ] **Verify**:
  - [ ] They appear in "Rejected" tab
  - [ ] They show as "Fixable" (default)
  - [ ] Resubmission works for them (null/undefined treated as fixable)

### Step 4: Multiple Rejections
- [ ] Reject a request as "Fixable"
- [ ] Resubmit it
- [ ] Reject it again as "Permanent"
- [ ] **Verify**: Latest rejection type takes precedence (cannot resubmit)

---

## Test Scenario 7: Workflow Reset Verification

### Step 1: Verify Approval Statuses Reset
- [ ] Create request and get it approved by Director
- [ ] Reject it as "Fixable"
- [ ] Resubmit it
- [ ] **Verify**:
  - [ ] `director_approval_status` = NULL
  - [ ] `director_approval_by` = NULL
  - [ ] `director_approval_date` = NULL
  - [ ] Same for Compliance and Partner approval fields
  - [ ] Request goes through full workflow again

### Step 2: Verify Rejection Data Preserved
- [ ] After resubmission, check request data
- [ ] **Verify**:
  - [ ] `rejection_reason` is still stored (for audit trail)
  - [ ] `rejection_type` is still stored
  - [ ] Request can be edited normally

---

## Test Scenario 8: Compliance Dashboard Quick Reject

### Step 1: Quick Reject from Compliance Dashboard
- [ ] Login as Compliance
- [ ] Use quick reject from Compliance Dashboard (if available)
- [ ] **Verify**:
  - [ ] Rejection defaults to "fixable" (backend default)
  - [ ] Request can be resubmitted
  - [ ] Note: Full rejection modal in detail page is preferred for type selection

---

## Expected Results Summary

| Test Case | Expected Result | Status |
|-----------|----------------|--------|
| Fixable rejection → Resubmit | ✅ Converts to Draft, can edit | ⬜ |
| Permanent rejection → Resubmit | ❌ Blocked, shows "Create New Request" | ⬜ |
| Client rejection | ✅ Automatic permanent, cannot resubmit | ⬜ |
| Rejection modal UI | ✅ Shows both types with explanations | ⬜ |
| Email notifications | ✅ Different messages for fixable vs permanent | ⬜ |
| Authorization check | ✅ Only requester can resubmit | ⬜ |
| Status validation | ✅ Only rejected requests can be resubmitted | ⬜ |
| Workflow reset | ✅ All approval statuses cleared on resubmit | ⬜ |
| Backward compatibility | ✅ Old rejections treated as fixable | ⬜ |

---

## Known Issues / Notes

1. **ComplianceDashboard quick reject**: Uses simple prompt, defaults to 'fixable'. For full control, use detail page rejection modal.
2. **Rejection reason preservation**: Rejection reason/type are preserved for audit trail even after resubmission.

---

## Quick Test Commands

```bash
# Check if servers are running
curl http://localhost:3000/api/health
curl http://localhost:5173

# Check database columns exist
sqlite3 coi-prototype/backend/database.sqlite "PRAGMA table_info(coi_requests);" | grep rejection
```

---

## Test Completion Checklist

- [ ] All Test Scenario 1 steps completed
- [ ] All Test Scenario 2 steps completed
- [ ] All Test Scenario 3 steps completed
- [ ] All Test Scenario 4 steps completed
- [ ] All Test Scenario 5 steps completed
- [ ] All Test Scenario 6 steps completed
- [ ] All Test Scenario 7 steps completed
- [ ] All Test Scenario 8 steps completed
- [ ] No errors in browser console
- [ ] No errors in backend logs
- [ ] All expected results match actual results

---

**Test Date**: _______________  
**Tester**: _______________  
**Status**: ⬜ Pass / ⬜ Fail / ⬜ Partial
