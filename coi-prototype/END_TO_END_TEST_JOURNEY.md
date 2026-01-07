# End-to-End Test Journey

## Test Date: 2026-01-07

## Test Objective
Verify complete user journey from request creation to conflict detection and resolution.

---

## Test Scenario 1: Requester Creates Audit Request

### Step 1: Login as Requester
- **User**: `patricia.white@company.com`
- **Password**: `password`
- **Role**: Requester (Audit Department)
- **Expected**: Successfully logged in, redirected to Requester dashboard

### Step 2: Create New COI Request
- Navigate to "New Request"
- Fill in form:
  - **Client**: Select an existing client (e.g., "Acme Corporation")
  - **Service Type**: "Statutory Audit" or "External Audit"
  - **Service Description**: "Annual statutory audit for FY 2025"
  - **Department**: Audit
  - **All required fields**: Complete
- **Expected**: Request created in "Draft" status

### Step 3: Submit Request
- Click "Submit for Review"
- **Expected**: 
  - Request status changes to "Pending Director Approval" or "Pending Compliance"
  - Duplication check runs
  - Business rules evaluation runs
  - Conflict detection runs (if applicable)

---

## Test Scenario 2: Compliance Officer Reviews Conflicts

### Step 4: Login as Compliance Officer
- **User**: `emily.davis@company.com`
- **Password**: `password`
- **Role**: Compliance Officer
- **Expected**: Successfully logged in, redirected to Compliance Dashboard

### Step 5: Navigate to Conflicts Tab
- Click on "Compliance Review" → "Conflicts" tab
- **Expected**: 
  - See list of requests with conflicts
  - Conflict rules displayed
  - Each conflict shows:
    - Request ID
    - Client name
    - Service type
    - Conflict reason

### Step 6: Verify Conflict Detection
- Check if the Audit request from Scenario 1 appears (if there's a conflicting service)
- **Expected**: 
  - If no conflicts exist, see "No conflicts detected" message
  - If conflicts exist, they should be displayed with proper reasons

---

## Test Scenario 3: Create Conflicting Request

### Step 7: Login as Different Requester (or same)
- **User**: `patricia.white@company.com` (or another requester)
- **Password**: `password`

### Step 8: Create Advisory Request for Same Client
- Navigate to "New Request"
- Fill in form:
  - **Client**: Same client as Step 2 (e.g., "Acme Corporation")
  - **Service Type**: "Management Consulting" or "Business Advisory"
  - **Service Description**: "Strategic consulting engagement"
  - **Department**: Advisory (or Audit if Advisory not available)
- **Expected**: Request created

### Step 9: Submit Advisory Request
- Click "Submit for Review"
- **Expected**: 
  - Request submitted
  - Conflict detection should identify:
    - Audit + Advisory for same client = **BLOCKED**
    - Request routed to Compliance for review

---

## Test Scenario 4: Verify Conflict Appears in Compliance Dashboard

### Step 10: Login as Compliance Officer Again
- **User**: `emily.davis@company.com`
- **Password**: `password`

### Step 11: Check Conflicts Tab
- Navigate to Compliance Review → Conflicts
- **Expected**: 
  - Both requests (Audit and Advisory) should appear
  - Conflict reason should be: "Audit + Advisory for same client = Blocked"
  - Or: "Service type conflict detected" with proper details

### Step 12: Review Conflict Details
- Click "Review" button on a conflict
- **Expected**: 
  - Navigate to request detail page
  - See conflict information
  - See duplication matches (if any)
  - See business rule recommendations

---

## Test Scenario 5: Test Conflict Resolution

### Step 13: Approve or Reject Conflicting Request
- As Compliance Officer, review the conflicting request
- **Options**:
  - **Approve with Restrictions**: If override is allowed
  - **Reject**: If conflict cannot be resolved
  - **Request More Info**: If additional details needed

### Step 14: Verify Status Update
- After decision, check request status
- **Expected**: 
  - Status updated appropriately
  - Conflict still visible in history
  - Audit trail maintained

---

## Test Scenario 6: Test Other Conflict Types

### Step 15: Create Tax Compliance Request
- Create request with:
  - **Client**: Same client with Audit engagement
  - **Service Type**: "Tax Compliance" or "Tax Advisory"
- **Expected**: 
  - Conflict detected: "Audit + Tax Compliance = Review Required"
  - Request flagged for review

### Step 16: Verify Multiple Conflict Types
- Check Conflicts tab
- **Expected**: 
  - Different conflict types displayed
  - Proper severity indicators
  - Clear conflict reasons

---

## Expected Results Summary

### ✅ Conflict Detection
- [x] Conflicts detected when Audit + Advisory for same client
- [x] Conflicts detected when Audit + Tax for same client
- [x] Conflict reasons displayed correctly
- [x] Conflicts appear in Compliance Dashboard

### ✅ Data Flow
- [x] Request submission triggers conflict check
- [x] Backend stores conflict data in `duplication_matches`
- [x] Frontend reads and displays conflict data
- [x] Conflict information persists across sessions

### ✅ UI/UX
- [x] "No conflicts detected" only shows when truly no conflicts
- [x] Conflict cards display proper information
- [x] Conflict reasons are descriptive
- [x] Navigation works correctly

---

## Known Issues to Verify

1. **Conflict Detection Logic**:
   - ✅ Fixed: Frontend now checks `duplication_matches` field
   - ✅ Fixed: Added `getConflictReason()` function
   - ⚠️ Verify: Existing requests may need re-submission to populate conflict data

2. **Backend Conflict Evaluation**:
   - ✅ Backend runs `checkDuplication()` on submit
   - ✅ Service type conflicts detected via `checkServiceTypeConflict()`
   - ✅ Conflicts stored in `duplication_matches` JSON field

3. **Frontend Display**:
   - ✅ `hasConflict()` function updated to check stored data
   - ✅ Fallback logic for requests without stored conflict data
   - ✅ Conflict reasons displayed dynamically

---

## Test Execution Notes

### Manual Test Steps
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open browser: `http://localhost:5173`
4. Follow test scenarios above
5. Document any issues found

### Automated Test (Future)
- API tests for conflict detection endpoints
- Integration tests for conflict evaluation
- E2E tests with Playwright/Cypress

---

## Test Results

### Status: ✅ Ready for Testing
- All fixes implemented
- Conflict detection logic updated
- UI components updated
- Ready for manual verification

### Next Steps
1. Execute manual test scenarios
2. Document any edge cases found
3. Create automated tests for regression
4. Update documentation with findings

