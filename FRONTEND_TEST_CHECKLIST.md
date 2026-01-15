# Frontend Testing Checklist

**Date:** January 15, 2026  
**Frontend Server:** http://localhost:5173  
**Backend Server:** http://localhost:3000

---

## ✅ Pre-Test Verification

- [x] Frontend server running on port 5173
- [x] Backend routes registered:
  - [x] `/api/prospects` - Prospect routes
  - [x] `/api/compliance` - Compliance routes
- [x] No linter errors in new components
- [x] Routes added to router

---

## 🧪 Test 1: Prospect Management (`/coi/prospects`)

### Setup
1. Login as Admin, Super Admin, Compliance, or Partner
2. Navigate to `/coi/prospects`

### Test Cases

#### 1.1 View Prospects List
- [ ] Page loads without errors
- [ ] Header shows "Prospect Management"
- [ ] "Add Prospect" button is visible
- [ ] Table displays existing prospects (if any)
- [ ] Columns: Prospect Name, Industry, Linked Client, PRMS Code, Status, Group Services, Actions

#### 1.2 Search Functionality
- [ ] Type in search box
- [ ] Results filter by prospect name
- [ ] Results filter by industry
- [ ] Results filter by commercial registration
- [ ] Results filter by PRMS code

#### 1.3 Filters
- [ ] **Prospects Only**: Shows only standalone prospects (no client_id)
- [ ] **Linked to Existing Clients**: Shows only prospects with client_id
- [ ] **Converted Prospects**: Shows only status = "Converted"
- [ ] **Status Filter**: Filters by Active/Converted/Inactive
- [ ] **PRMS Status**: Filters by synced/not synced

#### 1.4 Create Prospect
- [ ] Click "Add Prospect" button
- [ ] Modal opens
- [ ] Fill in required fields (Prospect Name)
- [ ] Fill optional fields (Commercial Registration, Industry, PRMS Code)
- [ ] Click "Check PRMS" button (if PRMS code entered)
- [ ] Submit form
- [ ] Prospect created successfully
- [ ] Modal closes
- [ ] New prospect appears in list

#### 1.5 View Prospect
- [ ] Click "View" button on a prospect
- [ ] Navigates to prospect detail (if route exists) or shows details

#### 1.6 Convert Prospect
- [ ] Click "Convert" button on active prospect
- [ ] Confirmation dialog appears
- [ ] Confirm conversion
- [ ] Prospect status changes to "Converted"

---

## 🧪 Test 2: Approver Status Display (`/coi/request/:id`)

### Setup
1. Login as Requester
2. Create or view a COI request that is pending approval
3. Ensure an approver (Director/Compliance/Partner) is marked as unavailable in Admin Dashboard

### Test Cases

#### 2.1 Approver Available (Normal Flow)
- [ ] View request detail page
- [ ] No "Approver Unavailable" banner appears
- [ ] Normal approval workflow displayed

#### 2.2 Approver Unavailable
- [ ] Mark an approver as unavailable in Admin Dashboard:
  - Set `is_active = 0`
  - Set `unavailable_reason = "On vacation"`
  - Set `unavailable_until = "2026-01-20"`
- [ ] View request detail page as Requester
- [ ] **Amber warning banner appears** with:
  - [ ] "Approval Delayed - Approver Unavailable" heading
  - [ ] Approver name displayed
  - [ ] Approver role displayed
  - [ ] Unavailable reason displayed
  - [ ] Expected return date displayed
  - [ ] Helpful message about request being reviewed upon return

#### 2.3 Banner Visibility
- [ ] Banner only visible to Requesters (not to approvers themselves)
- [ ] Banner only appears when `current_approver_status.is_available === false`
- [ ] Banner styling: amber background, warning icon

---

## 🧪 Test 3: Compliance Client Services View (`/coi/compliance/client-services`)

### Setup
1. Login as Compliance, Partner, or Super Admin
2. Navigate to `/coi/compliance/client-services`

### Test Cases

#### 3.1 All Clients View (Default)
- [ ] Page loads without errors
- [ ] Header shows "Client Services Overview"
- [ ] "View All Clients" is default view
- [ ] Table displays all services across all clients
- [ ] Columns: Client, Service Type, Sub-Category, Status, Start Date, End Date, Partner, Source, Actions

#### 3.2 Filters
- [ ] **Client Filter**: Type client name, results filter
- [ ] **Service Type Filter**: Type service type, results filter
- [ ] **Date From**: Select date, results filter by start date
- [ ] **Date To**: Select date, results filter by end date

#### 3.3 Financial Data Exclusion
- [ ] **VERIFY**: No cost/fee columns in table
- [ ] **VERIFY**: No financial parameters displayed
- [ ] **VERIFY**: Service information (type, description, dates) IS visible
- [ ] **VERIFY**: Engagement partner IS visible
- [ ] **VERIFY**: Status IS visible

#### 3.4 Single Client View
- [ ] Click "View Single Client" button
- [ ] Client selector dropdown appears
- [ ] Select a client from dropdown
- [ ] Services timeline loads for that client
- [ ] Timeline shows:
  - [ ] Service type
  - [ ] Status badge
  - [ ] Source (COI/PRMS)
  - [ ] Start and end dates
  - [ ] Engagement partner (if available)
  - [ ] Sub-category (if available)

#### 3.5 Service Details
- [ ] Click "View" button on a service
- [ ] Navigates to COI request detail page
- [ ] Request detail shows full service information

#### 3.6 Data Sources
- [ ] Services from COI requests are displayed
- [ ] Services from PRMS (if integrated) are displayed
- [ ] Source badge shows "COI" or "PRMS"
- [ ] Services are sorted by date (newest first)

---

## 🧪 Test 4: Navigation & Access Control

### Test Cases

#### 4.1 Route Access
- [ ] `/coi/prospects` accessible to: Admin, Super Admin, Compliance, Partner
- [ ] `/coi/prospects` NOT accessible to: Requester, Director, Finance
- [ ] `/coi/compliance/client-services` accessible to: Compliance, Partner, Super Admin
- [ ] `/coi/compliance/client-services` NOT accessible to: Requester, Director, Finance, Admin

#### 4.2 Navigation Links
- [ ] Links work from dashboard (if added)
- [ ] Browser back button works
- [ ] Direct URL navigation works

---

## 🐛 Common Issues to Check

### Prospect Management
- [ ] API calls use correct endpoints (`/api/prospects`)
- [ ] Error handling for failed API calls
- [ ] Loading states during API calls
- [ ] Empty state when no prospects found
- [ ] Form validation (required fields)

### Approver Status
- [ ] Backend returns `current_approver_status` in API response
- [ ] Frontend handles null/undefined approver status
- [ ] Date formatting works correctly
- [ ] Banner doesn't appear for non-requesters

### Compliance Services
- [ ] API calls use correct endpoints (`/api/compliance/client-services/:id`, `/api/compliance/all-client-services`)
- [ ] Error handling for failed API calls
- [ ] Loading states during API calls
- [ ] Empty state when no services found
- [ ] Date filters work correctly
- [ ] Financial data is truly excluded (check network tab)

---

## 📝 Test Results Template

```
Test Date: ___________
Tester: ___________
Frontend Version: ___________

Prospect Management:
- Passed: ___
- Failed: ___
- Notes: ___________

Approver Status Display:
- Passed: ___
- Failed: ___
- Notes: ___________

Compliance Services View:
- Passed: ___
- Failed: ___
- Notes: ___________

Overall Status: [ ] Pass [ ] Fail
Issues Found: ___________
```

---

## 🚀 Quick Test Commands

### Check Frontend Server
```bash
curl http://localhost:5173
```

### Check Backend API
```bash
# Prospects endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/prospects

# Compliance services endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/compliance/all-client-services
```

### Check Routes
```bash
# In browser console
window.location.href = '/coi/prospects'
window.location.href = '/coi/compliance/client-services'
```

---

## ✅ Success Criteria

All tests pass when:
1. ✅ All components load without errors
2. ✅ All filters and search work correctly
3. ✅ API calls succeed and data displays correctly
4. ✅ Financial data is excluded from Compliance view
5. ✅ Approver status displays correctly for unavailable approvers
6. ✅ Access control works (correct roles can access, wrong roles cannot)
7. ✅ No console errors
8. ✅ No network errors (except expected 401s for unauthorized access)
