# Browser Verification Quick Start

**Frontend:** http://localhost:5173  
**Backend:** http://localhost:3000

## ✅ Quick Verification (5 minutes)

### 1. Login
- Open: http://localhost:5173
- Login as: `patricia.white@company.com` / `password`

### 2. Test Requirement 1: Proposal to Engagement
- Navigate to any approved Proposal request
- Click "Convert to Engagement" button
- ✅ Modal opens with conversion form
- ✅ Enter reason and convert
- ✅ New engagement request created

### 3. Test Requirement 2: Service Sub-Categories
- Go to: New COI Request (`/coi/request/new`)
- Select: "Business Valuation" or "Asset Valuation"
- ✅ Sub-categories appear: Acquisition, Capital Increase, Financial Facilities

### 4. Test Requirement 3: Prospect Management
- Navigate to: `/coi/prospects`
- ✅ Prospect list loads
- ✅ Filters work (search, status, PRMS sync)
- ✅ "Add Prospect" button works

### 5. Test Requirement 4: Role-Based Rejection Options
- Login as Director: `john.smith@company.com` / `password`
- Open a "Pending Director Approval" request
- ✅ Only "Approve" and "Reject" buttons visible
- Login as Compliance: `emily.davis@company.com` / `password`
- Open a "Pending Compliance" request
- ✅ All 4 buttons visible (Approve, Reject, Restrictions, More Info)

### 6. Test Requirement 5: HRMS Vacation
- Login as Admin: `james.jackson@company.com` / `password`
- Navigate to: `/coi/hrms/vacation-management`
- ✅ Vacation management page loads
- ✅ Unavailable approvers displayed

### 7. Test Requirement 7: Compliance Services View
- Login as Compliance: `emily.davis@company.com` / `password`
- Navigate to: `/coi/compliance/client-services`
- ✅ Client services page loads
- ✅ Financial data columns show "Excluded" or are hidden

---

## ✅ All Requirements Verified!

For detailed testing steps, see: `FRONTEND_BROWSER_VERIFICATION_CHECKLIST.md`
