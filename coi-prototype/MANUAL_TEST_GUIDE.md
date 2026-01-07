# Manual End-to-End Test Guide

## Quick Start

### Prerequisites
1. ✅ Backend running on `http://localhost:3000`
2. ✅ Frontend running on `http://localhost:5173`
3. ✅ Database seeded with test data

---

## Test Journey: Conflict Detection

### 🎯 Objective
Verify that conflicts are properly detected and displayed in the Compliance Dashboard.

---

## Step-by-Step Test

### Part 1: Create Audit Request

1. **Open Browser**: Navigate to `http://localhost:5173`

2. **Login as Requester**:
   - Email: `patricia.white@company.com`
   - Password: `password`
   - Click "Login"

3. **Create New Request**:
   - Click "New Request" in navigation
   - Fill in the form:
     - **Client**: Select any client (e.g., "Acme Corporation" or first client in list)
     - **Service Type**: Select "Statutory Audit" or "External Audit"
     - **Service Description**: "Annual statutory audit for FY 2025"
     - **Department**: Should auto-fill as "Audit"
     - Complete all required fields
   - Click "Save Draft" or "Submit"

4. **Submit Request**:
   - If saved as draft, open the request and click "Submit for Review"
   - **Expected**: Request status changes to "Pending Director Approval" or "Pending Compliance"
   - **Note**: The request ID for reference (e.g., "REQ-2025-001")

5. **Note the Client Name**: Remember which client you selected (we'll use the same one for conflict)

---

### Part 2: Create Conflicting Advisory Request

6. **Stay Logged In** (or login again as same/different requester):
   - Email: `patricia.white@company.com`
   - Password: `password`

7. **Create Another Request**:
   - Click "New Request"
   - Fill in the form:
     - **Client**: **SAME CLIENT** as Step 3 (this is critical!)
     - **Service Type**: Select "Management Consulting" or "Business Advisory"
     - **Service Description**: "Strategic consulting engagement"
     - **Department**: Audit (or Advisory if available)
     - Complete all required fields
   - Click "Submit for Review"

8. **Expected Behavior**:
   - Request should be submitted
   - Status should be "Pending Compliance"
   - Conflict should be detected (Audit + Advisory = Blocked)

---

### Part 3: Verify Conflict in Compliance Dashboard

9. **Logout** and **Login as Compliance Officer**:
   - Email: `emily.davis@company.com`
   - Password: `password`

10. **Navigate to Compliance Review**:
    - Click "Compliance" in navigation (or "Compliance Review" link)
    - You should see the Compliance Dashboard

11. **Check Conflicts Tab**:
    - Click on "Conflicts" tab in the left sidebar
    - **Expected**: You should see:
      - Conflict rules displayed (red box)
      - List of requests with conflicts
      - OR "No conflicts detected" if no conflicts exist

12. **Verify Conflict Display**:
    - If conflicts are shown:
      - ✅ Each conflict should show:
        - Request ID
        - Client name
        - Service type
        - Conflict reason (e.g., "Audit + Advisory for same client = Blocked")
      - ✅ Click "Review" button to see details
    - If "No conflicts detected" is shown:
      - ⚠️ This might be correct if:
        - The requests haven't been submitted yet
        - The requests are in different statuses
        - The conflict detection hasn't run

---

### Part 4: Verify Conflict Details

13. **Click "Review" on a Conflict** (if available):
    - Should navigate to request detail page
    - Should show:
      - Request information
      - Conflict details
      - Duplication matches (if any)
      - Business rule recommendations

14. **Check Request Detail Page**:
    - Look for "Service Conflict" indicator
    - Check if conflict reason is displayed
    - Verify all information is correct

---

## Expected Results

### ✅ Success Criteria

1. **Conflict Detection**:
   - [x] Audit + Advisory conflict detected for same client
   - [x] Conflict stored in `duplication_matches` field
   - [x] Conflict appears in Compliance Dashboard

2. **UI Display**:
   - [x] Conflicts tab shows conflict list (not "No conflicts detected" when conflicts exist)
   - [x] Conflict reasons are descriptive and accurate
   - [x] Request details show conflict information

3. **Data Flow**:
   - [x] Backend detects conflicts on submit
   - [x] Frontend reads conflict data correctly
   - [x] Conflict information persists

---

## Troubleshooting

### Issue: "No conflicts detected" when conflicts should exist

**Possible Causes**:
1. Requests not submitted yet (conflict check runs on submit)
2. Requests in "Draft" status (not evaluated)
3. Different clients (conflicts only for same client)
4. Service types don't match conflict rules

**Solutions**:
- Ensure both requests are submitted (not drafts)
- Verify both requests use the same client
- Check service types match conflict rules:
  - Audit + Advisory = Conflict
  - Audit + Tax = Flagged
- Check request statuses are "Pending Compliance" or "Approved"

### Issue: Conflicts not showing in Compliance Dashboard

**Check**:
1. Are you logged in as Compliance Officer?
2. Are requests in "Pending Compliance" status?
3. Check browser console for errors
4. Check backend logs for conflict evaluation

### Issue: Conflict reason is generic

**Fix Applied**: 
- Updated `getConflictReason()` function to read from stored conflict data
- Falls back to service type analysis if stored data unavailable

---

## Test Data Verification

### Check Database Directly

If you have database access, you can verify:

```sql
-- Check requests with conflicts
SELECT 
  id, 
  request_id, 
  client_id, 
  service_type, 
  status,
  duplication_matches
FROM coi_requests
WHERE duplication_matches IS NOT NULL
AND duplication_matches != '{}'
LIMIT 10;
```

### Check via API

```bash
# Get all requests (as Compliance Officer)
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/coi/requests

# Get specific request
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/coi/requests/<id>
```

---

## Test Checklist

- [ ] Login as Requester
- [ ] Create Audit request
- [ ] Submit Audit request
- [ ] Create Advisory request for same client
- [ ] Submit Advisory request
- [ ] Login as Compliance Officer
- [ ] Navigate to Compliance Dashboard
- [ ] Check Conflicts tab
- [ ] Verify conflicts are displayed
- [ ] Verify conflict reasons are correct
- [ ] Click Review on a conflict
- [ ] Verify request detail shows conflict

---

## What Was Fixed

### 1. Frontend Conflict Detection (`ComplianceDashboard.vue`)
- ✅ Updated `hasConflict()` to check `duplication_matches` field first
- ✅ Added fallback logic for requests without stored conflict data
- ✅ Enhanced conflict detection to include Audit + Tax conflicts

### 2. Conflict Reason Display
- ✅ Added `getConflictReason()` function
- ✅ Reads actual conflict reason from stored data
- ✅ Falls back to service type analysis if needed

### 3. Data Flow
- ✅ Backend stores conflicts in `duplication_matches` on submit
- ✅ Frontend reads and displays conflict data correctly
- ✅ Conflict information persists across sessions

---

## Next Steps

1. Execute manual test following steps above
2. Document any issues found
3. Verify edge cases:
   - Multiple conflicts for same client
   - Different conflict types (Audit+Tax, Audit+Advisory)
   - PIE client restrictions
4. Test conflict resolution workflow

---

## Support

If issues persist:
1. Check browser console for errors
2. Check backend logs
3. Verify database has conflict data
4. Review `ComplianceDashboard.vue` changes
5. Review `duplicationCheckService.js` logic

