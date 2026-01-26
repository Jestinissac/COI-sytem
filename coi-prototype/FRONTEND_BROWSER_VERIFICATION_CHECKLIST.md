# Frontend Browser Verification Checklist

**Date:** January 2026  
**Frontend URL:** http://localhost:5173  
**Backend URL:** http://localhost:3000

---

## Pre-Verification Setup

1. ✅ Ensure backend is running: `cd backend && npm run dev`
2. ✅ Ensure frontend is running: `cd frontend && npm run dev`
3. ✅ Open browser: http://localhost:5173

---

## Test User Credentials

Use these credentials for testing:

- **Requester**: `patricia.white@company.com` / `password`
- **Director**: `john.smith@company.com` / `password`
- **Compliance**: `emily.davis@company.com` / `password`
- **Partner**: `robert.taylor@company.com` / `password`
- **Admin**: `james.jackson@company.com` / `password`

---

## ✅ Requirement 1: Convert Proposal to Engagement

### Test Steps:
1. Login as **Requester** (`patricia.white@company.com`)
2. Navigate to a COI request that has:
   - Stage: `Proposal`
   - Status: `Approved` or `Active`
3. Open the request detail page: `/coi/request/:id`
4. **Verify:**
   - ✅ "Convert to Engagement" button is visible
   - ✅ Button is enabled
5. Click "Convert to Engagement"
6. **Verify Modal:**
   - ✅ Modal opens with proposal details
   - ✅ Shows "What Happens Next" section
   - ✅ Conversion reason field is present and required
   - ✅ "Convert to Engagement" button is disabled until reason is entered
7. Enter conversion reason: "Client signed proposal on Jan 15, 2026"
8. Click "Convert to Engagement"
9. **Verify:**
   - ✅ Success message appears
   - ✅ Redirects to new engagement request
   - ✅ New request has Stage: `Engagement`
   - ✅ New request has Status: `Draft`
   - ✅ All data is copied from proposal

### Expected Result:
✅ Proposal successfully converts to engagement with new COI request created

---

## ✅ Requirement 2: Service Type Sub-Categories

### Test Steps:
1. Login as **Requester** (`patricia.white@company.com`)
2. Navigate to: `/coi/request/new`
3. Fill in required fields:
   - Entity: Select any entity
   - Service Category: Select any category
4. **Verify Service Type Dropdown:**
   - ✅ Full list of 177+ services is displayed
   - ✅ Services are organized by category
5. Select "Business Valuation" or "Asset Valuation" as service type
6. **Verify Sub-Categories:**
   - ✅ Sub-category section appears
   - ✅ Three radio buttons appear:
     - Acquisition
     - Capital Increase
     - Financial Facilities
   - ✅ One sub-category must be selected
   - ✅ Form validation requires sub-category selection

### Expected Result:
✅ Sub-categories display correctly for Business/Asset Valuation services

---

## ✅ Requirement 3: Prospect Management

### Test Steps:
1. Login as **Requester** or **Admin**
2. Navigate to: `/coi/prospects` (or via sidebar menu)
3. **Verify Prospect Management Page:**
   - ✅ Page loads with prospect list
   - ✅ Header shows "Prospect Management"
   - ✅ "Add Prospect" button is visible
4. **Verify Filters:**
   - ✅ Search box (search by name, industry, CR, PRMS code)
   - ✅ "Prospects Only" checkbox
   - ✅ "Linked to Existing Clients" checkbox
   - ✅ "Converted Prospects" checkbox
   - ✅ Status dropdown (All, Active, Converted, Inactive)
   - ✅ PRMS sync filter (All, Existing Client, New Prospect)
5. **Test Search:**
   - Enter search term
   - ✅ Results filter in real-time
6. **Test Filters:**
   - Check "Prospects Only"
   - ✅ Only standalone prospects shown
   - Check "Linked to Existing Clients"
   - ✅ Only linked prospects shown
7. Click "Add Prospect"
8. **Verify Create Modal:**
   - ✅ Modal opens
   - ✅ Fields: Name, Commercial Registration, Industry, PRMS Client Code
   - ✅ "Check PRMS" button works
   - ✅ Lead Source Attribution section visible
9. Fill in prospect details and create
10. **Verify:**
    - ✅ Prospect appears in list
    - ✅ Can view prospect details
    - ✅ Can convert prospect to client (if active)

### Expected Result:
✅ All prospect management features work correctly

---

## ✅ Requirement 4: Additional Rejection Options (Role-Based)

### Test Steps:

#### As Director:
1. Login as **Director** (`john.smith@company.com`)
2. Navigate to a request with status: `Pending Director Approval`
3. Open request detail: `/coi/request/:id`
4. **Verify:**
   - ✅ Only "Approve" and "Reject" buttons visible
   - ✅ "Approve with Restrictions" button NOT visible
   - ✅ "Need More Info" button NOT visible
   - ✅ Tooltip shows: "Additional approval options are available at Compliance level"

#### As Compliance:
1. Login as **Compliance** (`emily.davis@company.com`)
2. Navigate to a request with status: `Pending Compliance`
3. Open request detail: `/coi/request/:id`
4. **Verify:**
   - ✅ "Approve" button visible
   - ✅ "Reject" button visible
   - ✅ "Approve with Restrictions" button visible
   - ✅ "Need More Info" button visible
5. Click "Approve with Restrictions"
6. **Verify Modal:**
   - ✅ Modal opens
   - ✅ Restrictions text field
   - ✅ Comments field
   - ✅ Can submit with restrictions
7. Click "Need More Info"
8. **Verify Modal:**
   - ✅ Modal opens
   - ✅ Info required field
   - ✅ Comments field
   - ✅ Can submit request for more info

#### As Partner:
1. Login as **Partner** (`robert.taylor@company.com`)
2. Navigate to a request with status: `Pending Partner`
3. **Verify:**
   - ✅ All four options available (same as Compliance)

### Expected Result:
✅ Directors see only Approve/Reject; Compliance/Partner see all options

---

## ✅ Requirement 5: HRMS Vacation Integration

### Test Steps:
1. Login as **Admin** (`james.jackson@company.com`)
2. Navigate to: `/coi/hrms/vacation-management`
3. **Verify Vacation Management Page:**
   - ✅ Page loads
   - ✅ Shows "Approvers Currently on Vacation" tab
   - ✅ Shows "Affected Requests" tab
   - ✅ Shows "Sync Logs" tab
4. **Verify Approver List:**
   - ✅ Unavailable approvers displayed
   - ✅ Shows: Name, Role, Department, Reason, Dates
   - ✅ Shows affected request count
   - ✅ "Mark Available" button works
5. **Test Marking Approver Unavailable:**
   - Go to User Management (if available)
   - Mark an approver as unavailable
   - Set reason: "Vacation"
   - Set return date
   - ✅ Approver appears in vacation list
6. **Test Request Submission:**
   - Login as **Requester**
   - Submit a new COI request
   - If assigned approver is unavailable:
     - ✅ System filters out unavailable approver
     - ✅ Request assigned to available approver or Admin
     - ✅ Requester receives notification (check email logs)

### Expected Result:
✅ Unavailable approvers are filtered, and requesters are notified

---

## ✅ Requirement 6: Event-Driven Notification Batching

### Test Steps:
1. Login as **Requester** (`patricia.white@company.com`)
2. Submit multiple COI requests (3-5 requests)
3. **Verify:**
   - ✅ Each request submission shows success message
   - ✅ Notifications are queued (check backend logs)
4. Wait 5 minutes (batch window)
5. **Verify:**
   - ✅ Batched notifications sent as digest
   - ✅ Urgent notifications (rejections) sent immediately
6. **Check Notification Stats:**
   - Backend logs should show:
     - Total generated
     - Total sent
     - Batched count
     - Digest count
     - Noise reduction percentage

### Expected Result:
✅ Notifications are batched, urgent ones sent immediately

---

## ✅ Requirement 7: Compliance - All Services (Excluding Financial Data)

### Test Steps:
1. Login as **Compliance** (`emily.davis@company.com`)
2. Navigate to: `/coi/compliance/client-services`
3. **Verify Compliance Client Services Page:**
   - ✅ Page loads
   - ✅ Header shows "Client Services Overview"
   - ✅ Badge shows "Compliance View"
   - ✅ Note: "Financial data (costs/fees) excluded"
4. **Verify Filters:**
   - ✅ Client filter
   - ✅ Service type filter
   - ✅ Date range filters
   - ✅ Status filter
   - ✅ Partner filter
   - ✅ Source filter
5. **Verify Service List:**
   - ✅ Services displayed in table
   - ✅ Financial columns show "Excluded" badge or are hidden
   - ✅ No fee/cost/billing data visible
   - ✅ Service details visible (type, description, dates, status)
6. **Test View All Clients:**
   - Toggle "View All Clients"
   - ✅ All clients' services displayed
   - ✅ Financial data still excluded
7. **Test Single Client View:**
   - Select a client
   - ✅ Only that client's services shown
   - ✅ Financial data excluded

### Expected Result:
✅ Compliance can view all services without financial data

---

## Verification Summary

After completing all tests, verify:

- ✅ All 7 requirements work in browser
- ✅ No console errors
- ✅ No network errors (check browser DevTools)
- ✅ All routes accessible
- ✅ All modals open and close correctly
- ✅ All forms validate correctly
- ✅ All buttons trigger correct actions

---

## Troubleshooting

### If frontend doesn't load:
1. Check backend is running: `curl http://localhost:3000/api/health`
2. Check frontend is running: `curl http://localhost:5173`
3. Check browser console for errors

### If login fails:
1. Verify backend database is seeded
2. Check backend logs for errors
3. Try different user credentials

### If routes don't work:
1. Check router configuration in `frontend/src/router/index.ts`
2. Verify user role has access to route
3. Check browser console for route errors

---

## Browser Testing Commands

You can also test via terminal using curl:

```bash
# Test backend health
curl http://localhost:3000/api/health

# Test frontend (should return HTML)
curl http://localhost:5173

# Test API endpoints (with auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/coi/requests
```

---

**Status:** Ready for browser verification  
**Last Updated:** January 2026
