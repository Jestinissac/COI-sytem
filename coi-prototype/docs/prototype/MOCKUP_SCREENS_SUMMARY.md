# Mockup Screens Summary

**Date:** January 15, 2026  
**Purpose:** UI Mockups for Requirements 5 & 7

---

## ✅ SCREEN 1: HRMS Vacation Management (Requirement 5)

### File: `frontend/src/views/HRMSVacationManagement.vue`

### Features:
1. **HRMS Sync Button**
   - Sync with HRMS to get latest vacation data
   - Shows last sync time
   - Loading state during sync

2. **Three Tabs:**
   - **Approvers on Vacation Tab:**
     - Table showing all approvers currently on vacation
     - Columns: Approver, Role, Department, Vacation Reason, From/Until dates
     - HRMS source indicator (synced from HRMS vs manual)
     - Affected requests count
     - Search functionality
     - Actions: View Affected Requests, Mark Available
   
   - **Affected Requests Tab:**
     - List of all requests delayed due to approver vacation
     - Shows request details (ID, Client, Service, Requester)
     - Displays approver vacation info (reason, return date)
     - Indicates requester has been notified
     - Actions: View Request, Notify Again
   
   - **HRMS Sync Log Tab:**
     - History of all HRMS sync events
     - Shows sync type, status, message, updated count
     - Timestamp for each sync

3. **Info Banner:**
   - Explains HRMS integration status
   - Describes automatic requester notification

### Route:
- `/coi/hrms/vacation-management`
- Access: Admin, Super Admin, Compliance

### Key UI Elements:
- ✅ Vacation status badges (red for unavailable)
- ✅ HRMS sync indicator (green checkmark for synced)
- ✅ Affected requests count badges
- ✅ Search/filter functionality
- ✅ Responsive table design
- ✅ Empty states with helpful messages

---

## ✅ SCREEN 2: Compliance Client Services (Requirement 7)

### File: `frontend/src/views/ComplianceClientServices.vue` (Enhanced)

### Features:
1. **Header Section:**
   - Title: "Client Services Overview"
   - Subtitle: "All services for existing clients (excluding costs/fees) - Requirement 7"
   - Compliance View badge (green)
   - Note: "Financial data (costs/fees) excluded for compliance review"

2. **Two View Modes:**
   - **All Clients View (Default):**
     - Table showing all services across all clients
     - Columns: Client, Service Type, Sub-Category, Status, Start/End Dates, Partner, Source
     - **NEW:** "Costs/Fees" column showing "Excluded" with lock icon
     - Filters: Client search, Service Type, Date range
     - View button to see service details
   
   - **Single Client View:**
     - Client selector dropdown
     - Timeline view of services for selected client
     - Each service card shows:
       - Service type and status
       - **NEW:** "Costs/Fees Excluded" badge (red)
       - Service description
       - Start/End dates, Partner, Sub-category
       - Request ID

3. **Data Segregation:**
   - All service information visible (type, description, category, sub-category, dates, partner)
   - Financial data (costs/fees) clearly marked as excluded
   - Visual indicators (lock icons, badges) showing exclusion

### Route:
- `/coi/compliance/client-services`
- Access: Compliance role only

### Key UI Elements:
- ✅ "Costs/Fees Excluded" column in table
- ✅ Lock icon indicators
- ✅ Red badge showing "Costs/Fees Excluded" in timeline view
- ✅ Compliance View badge in header
- ✅ Filter/search functionality
- ✅ Toggle between All Clients and Single Client view

---

## 📋 IMPLEMENTATION STATUS

### HRMS Vacation Management:
- ✅ Component created: `HRMSVacationManagement.vue`
- ✅ Route added: `/coi/hrms/vacation-management`
- ✅ Three tabs implemented
- ✅ Mock data structure ready
- ⚠️ Backend API integration needed (currently uses mock data)

### Compliance Client Services:
- ✅ Component enhanced: `ComplianceClientServices.vue`
- ✅ Route exists: `/coi/compliance/client-services`
- ✅ Costs/Fees exclusion indicators added
- ✅ Visual badges and icons added
- ✅ Backend already filters financial data (dataSegregation middleware)

---

## 🎯 NEXT STEPS

### For HRMS Vacation Management:
1. **Backend API Endpoints Needed:**
   - `GET /api/hrms/vacation/approvers` - Get approvers on vacation
   - `GET /api/hrms/vacation/affected-requests` - Get affected requests
   - `POST /api/hrms/sync` - Sync with HRMS
   - `GET /api/hrms/sync/logs` - Get sync history
   - `PUT /api/users/:id/availability` - Mark approver available

2. **HRMS Integration:**
   - Connect to HRMS API for vacation data
   - Auto-sync on schedule (cron job)
   - Update `users` table with vacation status

3. **Requester Notification:**
   - Auto-notify when approver goes on vacation
   - Show notification in request detail view
   - Email notification option

### For Compliance Client Services:
1. **Backend Verification:**
   - Verify `dataSegregation` middleware is working
   - Test that `financial_parameters` are excluded
   - Ensure all service data is visible

2. **Enhancements (Optional):**
   - Export to Excel (excluding costs/fees)
   - Advanced filtering options
   - Service history timeline view

---

## 📸 VISUAL ELEMENTS

### HRMS Vacation Management:
- **Red badges:** Unavailable approvers
- **Green checkmarks:** HRMS synced data
- **Amber badges:** Affected requests count
- **Warning icons:** Vacation status alerts

### Compliance Client Services:
- **Green badge:** "Compliance View"
- **Red badge:** "Costs/Fees Excluded"
- **Lock icons:** Financial data exclusion
- **Blue badges:** Service status

---

## ✅ COMPLETION STATUS

| Feature | Status | Notes |
|---------|--------|-------|
| HRMS Vacation Management UI | ✅ Complete | Mockup ready, needs backend |
| Compliance Client Services UI | ✅ Complete | Enhanced with exclusion indicators |
| Routes | ✅ Complete | Both routes added |
| Visual Indicators | ✅ Complete | Badges, icons, badges added |
| Backend Integration | ⚠️ Partial | Compliance view works, HRMS needs API |

---

**Both mockup screens are ready for review and backend integration!**
