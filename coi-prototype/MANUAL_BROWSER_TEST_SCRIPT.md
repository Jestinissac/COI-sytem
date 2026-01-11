# COI Prototype - Manual Browser Test Script

**Date**: 2026-01-08
**URL**: http://localhost:5173
**Browser**: Chrome

---

## 🎯 Test Execution Instructions

Follow each step exactly as written. Mark each test as you complete it:
- ✅ = Working correctly
- ⚠️ = Partial issue
- ❌ = Broken/Error

---

## TEST SESSION 1: REQUESTER FLOW

### Step 1: Login as Requester
1. Open Chrome and go to: **http://localhost:5173**
2. You should see a login page
3. Enter credentials:
   - Email: `patricia.white@company.com`
   - Password: `password`
4. Click **Login** button

**Expected Result**: Redirected to dashboard
**Mark**: [ ]

---

### Step 2: Verify Dashboard Loads
1. Check that you see:
   - User name displayed (Patricia White)
   - Navigation menu
   - Dashboard content/statistics
   - List of COI requests

**What do you see?**
- Number of requests visible: _______
- Menu items visible: _______

**Mark**: [ ]

---

### Step 3: Explore Navigation Menu
Click through each menu item and report what you see:

1. **Dashboard** (if exists)
   - Loads: Yes / No
   - Shows: _______

2. **New Request** or **Create Request** (if exists)
   - Button/Link visible: Yes / No
   - Clicks: Yes / No
   - Opens: _______

3. **My Requests** (if exists)
   - Shows list: Yes / No
   - Count: _______

4. Any other menu items you see:
   - _______________________
   - _______________________

**Mark**: [ ]

---

### Step 4: View Existing Request Details
1. Look for any COI requests in a list/table
2. Find a request with status "Draft" (if available)
3. Click **View** or the request row

**What happens?**
- New page opens: Yes / No
- Shows request details: Yes / No
- Can you see:
  - Client name: _______
  - Status: _______
  - Services: _______
  - Attachments section: Yes / No

**Mark**: [ ]

---

### Step 5: Test "Edit Draft" (if Draft exists)
1. On the request detail page, look for **Edit Draft** button
2. Click it

**What happens?**
- Opens form/wizard: Yes / No
- Shows pre-filled data: Yes / No
- Number of steps/sections: _______

**Mark**: [ ]

---

### Step 6: Test Create New Request
1. Go back to dashboard
2. Click **New Request** / **Create COI Request** button

**What happens?**
- Form opens: Yes / No
- Wizard starts: Yes / No
- First step title: _______

**Now try to fill out the form:**

**Step 1 - Requester Info:**
- Can you fill your name: Yes / No
- Can you select designation: Yes / No

**Step 2 - Document Type:**
- Can you select document type: Yes / No
- Options available: _______

**Step 3 - Client Info:**
- Can you search/select client: Yes / No
- Can you type client name: Yes / No

**Step 4 - Services:**
- Can you select services: Yes / No
- Options available: _______

**Try to Save as Draft:**
- Click **Save Draft** button
- Does it save: Yes / No
- Error message: _______

**Mark**: [ ]

---

### Step 7: Test File Upload (if available)
1. If you're in a request detail or form
2. Look for **Upload** or **Attachments** section
3. Click **Upload File** or similar button

**What happens?**
- Upload dialog opens: Yes / No
- Can select file: Yes / No
- Upload completes: Yes / No
- File appears in list: Yes / No

**Mark**: [ ]

---

### Step 8: Logout
1. Find **Logout** button (usually top-right or in menu)
2. Click it

**What happens?**
- Redirects to login: Yes / No
- Session cleared: Yes / No

**Mark**: [ ]

---

## TEST SESSION 2: DIRECTOR FLOW

### Step 9: Login as Director
1. Login with:
   - Email: `john.smith@company.com`
   - Password: `password`

**Expected Result**: Director Dashboard
**Mark**: [ ]

---

### Step 10: Check Director Dashboard
**What's different from Requester?**
- More requests visible: Yes / No
- Number of requests: _______
- Can see team member requests: Yes / No

**Look for these sections:**
1. **Pending Approval** section
   - Exists: Yes / No
   - Shows requests: Yes / No
   - Count: _______

2. **Tabs** (if exists)
   - Tab names: _______________________
   - Can switch tabs: Yes / No

**Mark**: [ ]

---

### Step 11: Test Approval Workflow
1. Find a request with status "Pending Director Approval"
2. Click to view details
3. Look for **Approve** button

**What happens when you try to approve?**
- Approve button exists: Yes / No
- Can add comments: Yes / No
- Click Approve
- Success message: Yes / No
- Error message: _______

**Mark**: [ ]

---

### Step 12: Logout
Logout and prepare for next role test
**Mark**: [ ]

---

## TEST SESSION 3: COMPLIANCE FLOW

### Step 13: Login as Compliance
1. Login with:
   - Email: `emily.davis@company.com`
   - Password: `password`

**Expected Result**: Compliance Dashboard
**Mark**: [ ]

---

### Step 14: Check Compliance Dashboard
**Look for these sections/tabs:**
1. **Pending Review**
   - Exists: Yes / No
   - Request count: _______

2. **Duplications** tab
   - Exists: Yes / No
   - Click it
   - Shows matches: Yes / No

3. **Conflict Check**
   - Exists: Yes / No

**Mark**: [ ]

---

### Step 15: Test Duplication Check
1. Open a request pending compliance review
2. Look for duplication/match information

**What do you see?**
- Shows similar clients: Yes / No
- Match percentage displayed: Yes / No (e.g., "85% match")
- Color coding: Yes / No
- Can override: Yes / No

**Mark**: [ ]

---

### Step 16: Test Compliance Review
1. Find **Complete Review** or **Approve** button
2. Try to complete review

**Result:**
- Works: Yes / No
- Error: _______

**Mark**: [ ]

---

### Step 17: Logout
**Mark**: [ ]

---

## TEST SESSION 4: FINANCE FLOW

### Step 18: Login as Finance
1. Login with:
   - Email: `lisa.thomas@company.com`
   - Password: `password`

**Mark**: [ ]

---

### Step 19: Test Engagement Code Generation
1. Look for requests pending finance action
2. Find **Generate Code** or **Generate Engagement Code** button

**What happens?**
- Button exists: Yes / No
- Click it
- Code generates: Yes / No
- Code format (e.g., ENG-2026-AUD-00001): _______

**Mark**: [ ]

---

### Step 20: Logout
**Mark**: [ ]

---

## TEST SESSION 5: ADMIN FLOW

### Step 21: Login as Admin
1. Login with:
   - Email: `james.jackson@company.com`
   - Password: `password`

**Mark**: [ ]

---

### Step 22: Check Admin Features
**Look for:**
1. **Execute** button/section
   - Exists: Yes / No

2. **Monitoring** section (30-day monitoring)
   - Exists: Yes / No
   - Shows active engagements: Yes / No

3. **ISQM Forms** upload
   - Exists: Yes / No
   - Can upload: Yes / No

**Mark**: [ ]

---

### Step 23: Test Execution
1. Find request ready for execution
2. Click **Execute** button

**Result:**
- Works: Yes / No
- Changes status: Yes / No
- Error: _______

**Mark**: [ ]

---

## TEST SESSION 6: UI/UX CHECKS

### Step 24: Responsive Design (Login as any user)
1. Resize browser window to mobile size (375px width)
2. Check if layout adapts

**Result:**
- Mobile friendly: Yes / No
- Menu collapses: Yes / No
- Tables scroll: Yes / No

**Mark**: [ ]

---

### Step 25: Search & Filters
1. Look for search bar on dashboard
2. Look for filter dropdowns (status, department, etc.)

**Can you:**
- Search by client name: Yes / No
- Filter by status: Yes / No
- Filter by date: Yes / No

**Mark**: [ ]

---

### Step 26: Status Badges
**Check if status badges display with colors:**
- Draft: Color = _______
- Pending Director Approval: Color = _______
- Pending Compliance: Color = _______
- Approved: Color = _______
- Active: Color = _______
- Rejected: Color = _______

**Mark**: [ ]

---

### Step 27: Notifications/Toasts
**During any action (save, approve, etc.):**
- Success toasts appear: Yes / No
- Error toasts appear: Yes / No
- Auto-dismiss: Yes / No

**Mark**: [ ]

---

### Step 28: Loading States
**When loading data:**
- Spinner shows: Yes / No
- Loading text shows: Yes / No
- Smooth transitions: Yes / No

**Mark**: [ ]

---

## 🐛 BUG REPORT SECTION

### Issues Found
List any bugs, errors, or unexpected behavior:

1. **Error/Issue**: _______________________
   - Page/Screen: _______________________
   - Steps to reproduce: _______________________
   - Error message: _______________________

2. **Error/Issue**: _______________________
   - Page/Screen: _______________________
   - Steps to reproduce: _______________________
   - Error message: _______________________

3. **Error/Issue**: _______________________
   - Page/Screen: _______________________
   - Steps to reproduce: _______________________
   - Error message: _______________________

---

## ✅ FEATURE CHECKLIST

Mark what works:
- [ ] Login/Logout
- [ ] Dashboard loads
- [ ] View request details
- [ ] Create new request
- [ ] Save draft
- [ ] Edit draft
- [ ] File upload
- [ ] Director approval
- [ ] Compliance review
- [ ] Duplication detection
- [ ] Finance code generation
- [ ] Admin execution
- [ ] Search functionality
- [ ] Filters
- [ ] Status badges
- [ ] Navigation menu
- [ ] Responsive design
- [ ] Notifications/Toasts

---

## 📊 TEST SUMMARY

**Total Tests**: 28
**Passed**: _______
**Failed**: _______
**Partial**: _______

**Overall Status**: _______________

**Recommendation**: _______________

---

## 🎯 PRIORITY FIXES NEEDED

Based on your testing, list top 3 issues to fix:
1. _______________________
2. _______________________
3. _______________________

---

**Tester Name**: _______________________
**Test Date**: 2026-01-08
**Test Duration**: _______ minutes
**Browser**: Chrome
**Completion**: _______%

---

## 📸 SCREENSHOTS

If you encounter errors, take screenshots and note:
- Screenshot 1: _______________________
- Screenshot 2: _______________________
- Screenshot 3: _______________________
