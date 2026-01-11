# Feedback Loop Analysis - User Workflow Notifications

**Date**: January 2025  
**Purpose**: Identify missing feedback loops and notification gaps in user workflows

---

## Executive Summary

**Status**: ⚠️ **Several feedback loops are missing**

While core approval/rejection notifications exist, several critical feedback loops are **not implemented**, particularly:
- Initial submission notifications
- 30-day monitoring interval alerts (every 10 days)
- Proposal lapse notifications
- Client response notifications
- Finance code generation → Partner notification

---

## Current Notification Status by User Flow

### 1. **Requester Flow**

#### ✅ **Implemented Notifications:**
- ✅ **Engagement Code Generated** → Requester notified (`sendEngagementCodeNotification`)
- ✅ **Proposal Executed** → Requester notified (`sendProposalExecutedNotification`)
- ✅ **Request Rejected** → Requester notified with reason (`sendRejectionNotification`)
- ✅ **Need More Information** → Requester notified (`sendNeedMoreInfoNotification`)
- ✅ **Engagement Expiring** → Requester notified (90/30/14/7/1 days prior)

#### ❌ **Missing Notifications:**
1. **Request Submitted Confirmation**
   - **Gap**: No confirmation email when requester submits request
   - **Impact**: Requester doesn't know if submission was successful
   - **Location**: `submitRequest()` in `coiController.js` (line 291)
   - **Fix**: Add notification after status update

2. **30-Day Monitoring Alerts (Every 10 Days)**
   - **Gap**: No automatic alerts every 10 days during 30-day window
   - **Requirement**: "An alert of which shall be sent to the requester, compliance department, admin (Malita & Nermin) and partner's emails every 10 days from the date of proposal approval"
   - **Impact**: Requester may not know proposal is approaching lapse
   - **Location**: `monitoringService.js` - needs interval alert function
   - **Fix**: Add `sendIntervalMonitoringAlerts()` function

3. **Proposal Lapsed Notification**
   - **Gap**: When proposal auto-lapses after 30 days, requester not notified
   - **Impact**: Requester doesn't know proposal expired
   - **Location**: `checkAndLapseExpiredProposals()` in `monitoringService.js` (line 99)
   - **Fix**: Send email notification to requester, admin, partner, compliance

4. **Client Approved Proposal**
   - **Gap**: When admin records client approval, requester not notified
   - **Impact**: Requester doesn't know engagement is now active
   - **Location**: `recordCountersigned()` in `executionController.js`
   - **Fix**: Add notification to requester

5. **Client Rejected Proposal**
   - **Gap**: When admin records client rejection, requester not notified
   - **Impact**: Requester doesn't know proposal was rejected
   - **Location**: `recordCountersigned()` in `executionController.js`
   - **Fix**: Add notification to requester

---

### 2. **Director Flow**

#### ✅ **Implemented Notifications:**
- ✅ **Approval Notification** → Next approver (Compliance) notified when Director approves

#### ❌ **Missing Notifications:**
1. **Team Member Submission**
   - **Gap**: When team member submits request, Director not notified
   - **Impact**: Director doesn't know there's a pending approval
   - **Location**: `submitRequest()` in `coiController.js` (line 291)
   - **Fix**: Add `notifyDirectorApprovalRequired()` when status = 'Pending Director Approval'

2. **Request Rejected by Compliance/Partner**
   - **Gap**: If request is rejected after Director approval, Director not notified
   - **Impact**: Director doesn't know their approved request was later rejected
   - **Location**: `rejectRequest()` in `coiController.js` (line 564)
   - **Fix**: Add notification to Director if `director_approval_by` exists

---

### 3. **Compliance Flow**

#### ✅ **Implemented Notifications:**
- ✅ **Approval Notification** → Next approver (Partner) notified when Compliance approves
- ✅ **Stale Request Alert** → Compliance notified when request needs re-evaluation (`notifyStaleRequest`)

#### ❌ **Missing Notifications:**
1. **Request Submitted for Review**
   - **Gap**: When request is submitted (Director or blocked), Compliance not notified
   - **Impact**: Compliance doesn't know there's a new request to review
   - **Location**: `submitRequest()` in `coiController.js` (line 291)
   - **Fix**: Add `notifyComplianceReviewRequired()` when status = 'Pending Compliance'

2. **30-Day Monitoring Alerts (Every 10 Days)**
   - **Gap**: Compliance not included in 10-day interval alerts
   - **Requirement**: "An alert of which shall be sent to the requester, compliance department, admin (Malita & Nermin) and partner's emails every 10 days"
   - **Impact**: Compliance not aware of proposals approaching lapse
   - **Location**: `monitoringService.js`
   - **Fix**: Include Compliance in interval alerts

3. **Proposal Lapsed Notification**
   - **Gap**: When proposal auto-lapses, Compliance not notified
   - **Impact**: Compliance doesn't know proposal expired
   - **Location**: `checkAndLapseExpiredProposals()` in `monitoringService.js`
   - **Fix**: Send email notification to Compliance

---

### 4. **Partner Flow**

#### ✅ **Implemented Notifications:**
- ✅ **Approval Notification** → Next approver (Finance) notified when Partner approves
- ✅ **Engagement Expiring** → Partner notified (90/30/14/7/1 days prior)

#### ❌ **Missing Notifications:**
1. **Compliance Approval → Partner Notification**
   - **Gap**: When Compliance approves, Partner not notified
   - **Impact**: Partner doesn't know there's a pending approval
   - **Location**: `approveRequest()` in `coiController.js` (line 372)
   - **Status**: ⚠️ **PARTIALLY IMPLEMENTED** - `sendApprovalNotification` is called (line 510), but need to verify it works for Partner role
   - **Fix**: Verify `sendApprovalNotification` correctly finds Partner users

2. **30-Day Monitoring Alerts (Every 10 Days)**
   - **Gap**: Partner not included in 10-day interval alerts
   - **Requirement**: "An alert of which shall be sent to the requester, compliance department, admin (Malita & Nermin) and partner's emails every 10 days"
   - **Impact**: Partner not aware of proposals approaching lapse
   - **Location**: `monitoringService.js`
   - **Fix**: Include Partner in interval alerts

3. **Proposal Lapsed Notification**
   - **Gap**: When proposal auto-lapses, Partner not notified
   - **Impact**: Partner doesn't know proposal expired
   - **Location**: `checkAndLapseExpiredProposals()` in `monitoringService.js`
   - **Fix**: Send email notification to Partner

4. **Finance Code Generated**
   - **Gap**: When Finance generates engagement code, Partner not notified
   - **Impact**: Partner doesn't know engagement code was created
   - **Location**: `generateEngagementCode()` in `coiController.js` (line 624)
   - **Fix**: Add Partner to notification list

---

### 5. **Finance Flow**

#### ✅ **Implemented Notifications:**
- ✅ **Approval Notification** → Next approver notified when Finance generates code
   - **Note**: Actually, Finance generates code, so this may not apply

#### ❌ **Missing Notifications:**
1. **Partner Approval → Finance Notification**
   - **Gap**: When Partner approves, Finance not notified
   - **Impact**: Finance doesn't know there's a request needing code generation
   - **Location**: `approveRequest()` in `coiController.js` (line 372)
   - **Status**: ⚠️ **PARTIALLY IMPLEMENTED** - `sendApprovalNotification` is called (line 510), but need to verify it works for Finance role
   - **Fix**: Verify `sendApprovalNotification` correctly finds Finance users

---

### 6. **Admin Flow**

#### ✅ **Implemented Notifications:**
- ✅ **Engagement Code Generated** → Admin notified (`sendEngagementCodeNotification`)

#### ❌ **Missing Notifications:**
1. **30-Day Monitoring Alerts (Every 10 Days)**
   - **Gap**: Admin not included in 10-day interval alerts
   - **Requirement**: "An alert of which shall be sent to the requester, compliance department, admin (Malita & Nermin) and partner's emails every 10 days"
   - **Impact**: Admin not aware of proposals approaching lapse
   - **Location**: `monitoringService.js`
   - **Fix**: Include Admin in interval alerts

2. **Proposal Lapsed Notification**
   - **Gap**: When proposal auto-lapses, Admin not notified
   - **Impact**: Admin doesn't know proposal expired
   - **Location**: `checkAndLapseExpiredProposals()` in `monitoringService.js`
   - **Fix**: Send email notification to Admin

3. **Client Response Received**
   - **Gap**: When client approves/rejects proposal, Admin may need reminder to update system
   - **Impact**: Admin may forget to update status
   - **Location**: `recordCountersigned()` in `executionController.js`
   - **Fix**: Add confirmation notification (optional)

---

## Critical Missing Features

### 🔴 **Priority 1: 30-Day Monitoring Interval Alerts**

**Requirement**: "An alert of which shall be sent to the requester, compliance department, admin (Malita & Nermin) and partner's emails every 10 days from the date of proposal approval"

**Current Status**: ❌ **NOT IMPLEMENTED**

**What's Missing**:
- Function to send alerts at 10, 20, and 30 days after proposal execution
- Recipients: Requester, Compliance, Admin, Partner
- Content: Days remaining, proposal details, action required

**Location to Fix**: `monitoringService.js` - needs new function `sendIntervalMonitoringAlerts()`

**Impact**: High - This is a core requirement from COI Workflow document

---

### 🔴 **Priority 2: Proposal Lapse Notifications**

**Requirement**: "The request shall be automatically cancelled and a copy of which shall be sent to all involved parties 'emails"

**Current Status**: ⚠️ **PARTIALLY IMPLEMENTED**
- Status is updated to "Lapsed" ✅
- Notifications array is created ✅
- **But emails are NOT sent** ❌

**What's Missing**:
- Email notifications to all parties when proposal lapses
- Recipients: Requester, Compliance, Admin, Partner
- Content: Request ID, lapse reason, next steps

**Location to Fix**: `checkAndLapseExpiredProposals()` in `monitoringService.js` (line 99)

**Impact**: High - Users don't know proposals have lapsed

---

### 🟡 **Priority 3: Initial Submission Notifications**

**Current Status**: ❌ **NOT IMPLEMENTED**

**What's Missing**:
1. **Requester Submission Confirmation**
   - Requester should receive confirmation email when request is submitted
   - Should include: Request ID, next step (Director/Compliance), estimated timeline

2. **Director Notification (Team Member Submissions)**
   - Director should be notified when team member submits request
   - Should include: Request ID, team member name, client, service type

3. **Compliance Notification (All Submissions)**
   - Compliance should be notified when request reaches their queue
   - Should include: Request ID, conflicts/duplicates detected, urgency level

**Location to Fix**: `submitRequest()` in `coiController.js` (line 291)

**Impact**: Medium - Users don't know when requests enter their queue

---

### 🟡 **Priority 4: Client Response Notifications**

**Current Status**: ❌ **NOT IMPLEMENTED**

**What's Missing**:
1. **Client Approved Proposal**
   - Requester notified: Engagement is now active
   - Admin notified: Prepare engagement letter (1-3 working days)
   - Partner notified: Engagement activated

2. **Client Rejected Proposal**
   - Requester notified: Proposal rejected, request closed
   - Admin notified: Request closed, no further action

**Location to Fix**: `recordCountersigned()` in `executionController.js`

**Impact**: Medium - Users don't know client response status

---

### 🟡 **Priority 5: Finance Code Generation → Partner Notification**

**Current Status**: ❌ **NOT IMPLEMENTED**

**What's Missing**:
- When Finance generates engagement code, Partner should be notified
- Partner needs to know engagement code for tracking

**Location to Fix**: `generateEngagementCode()` in `coiController.js` (line 624)

**Impact**: Low - Partner can see code in dashboard, but notification is helpful

---

## Implementation Recommendations

### **Immediate Actions Required:**

1. **Add 30-Day Interval Alerts** (Priority 1)
   ```javascript
   // In monitoringService.js
   export async function sendIntervalMonitoringAlerts() {
     // Find proposals in 30-day window
     // Send alerts at 10, 20, 30 days
     // Notify: Requester, Compliance, Admin, Partner
   }
   ```

2. **Add Proposal Lapse Email Notifications** (Priority 1)
   ```javascript
   // In checkAndLapseExpiredProposals()
   // After updating status to 'Lapsed'
   // Send email notifications to all parties
   ```

3. **Add Initial Submission Notifications** (Priority 3)
   ```javascript
   // In submitRequest()
   // After status update
   // Send notifications based on next status:
   // - If 'Pending Director Approval' → notifyDirectorApprovalRequired()
   // - If 'Pending Compliance' → notifyComplianceReviewRequired()
   // - Always send confirmation to requester
   ```

4. **Add Client Response Notifications** (Priority 4)
   ```javascript
   // In recordCountersigned()
   // After recording client response
   // Send notifications based on response:
   // - If approved → notify requester, admin, partner
   // - If rejected → notify requester, admin
   ```

---

## Summary Table

| User Role | Missing Notifications | Priority | Impact |
|-----------|----------------------|----------|--------|
| **Requester** | Submission confirmation, 30-day interval alerts, Proposal lapse, Client response | High | Users don't know status |
| **Director** | Team member submission, Request rejected after approval | Medium | Director unaware of pending approvals |
| **Compliance** | Request submitted, 30-day interval alerts, Proposal lapse | High | Compliance unaware of new requests |
| **Partner** | Compliance approval, 30-day interval alerts, Proposal lapse, Finance code | Medium | Partner unaware of pending approvals |
| **Finance** | Partner approval | Medium | Finance unaware of pending coding |
| **Admin** | 30-day interval alerts, Proposal lapse | High | Admin unaware of proposals approaching lapse |

---

## Conclusion

**Critical Gaps Identified:**
1. ❌ **30-day interval alerts** (every 10 days) - **NOT IMPLEMENTED**
2. ❌ **Proposal lapse email notifications** - **NOT IMPLEMENTED**
3. ❌ **Initial submission notifications** - **NOT IMPLEMENTED**
4. ❌ **Client response notifications** - **NOT IMPLEMENTED**

**Recommendation**: Implement Priority 1 and Priority 2 items immediately as they are core requirements from the COI Workflow document. Priority 3 and 4 can be added in next iteration.
