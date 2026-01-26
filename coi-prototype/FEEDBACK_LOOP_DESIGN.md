# Feedback Loop Design

**Date:** January 2026  
**Status:** Simple, Effective Design

---

## Current State

### What Works (Verified)

**All notification functions exist and are called:**
- Submission confirmations ✅
- Approval notifications ✅
- Rejection notifications ✅
- Need More Info notifications ✅
- Engagement code notifications ✅
- Proposal executed notifications ✅
- Client response notifications ✅
- 30-day monitoring alerts ✅
- Proposal lapse notifications ✅

**Implementation Status:**
- 12 notification functions implemented
- All critical workflows have notifications
- Automated monitoring runs hourly

---

## Gaps

### Critical (All Fixed ✅)

1. **Requester Progress Updates** ✅ **IMPLEMENTED**
   - Status: Fixed in `coiController.js` (lines 971-994)
   - Implementation: Requester now receives progress update when request moves through approval chain

2. **Multiple Approvers** ✅ **IMPLEMENTED**
   - Status: Fixed in `notificationService.js` (lines 373-456)
   - Implementation: All approvers at each level now receive notifications (removed LIMIT 1)

---

## Simple Feedback Loop Design

### Core Rule

**"Notify requester of all status changes. Notify approvers when action required."**

### Notification Types

1. **Status Change** → Requester
2. **Action Required** → Approver
3. **Rejection** → Requester (immediate)
4. **Need More Info** → Requester (immediate)

### Workflow

```
Requester submits
  → Requester: "Request submitted, pending [Next Role]"
  → Next Approver: "Action required"

Approver approves
  → Requester: "Request approved by [Role], now with [Next Role]"
  → Next Approver: "Action required"

Approver rejects
  → Requester: "Request rejected" (immediate)

Approver needs more info
  → Requester: "Additional information required" (immediate)
```

### Urgency

- **Immediate:** Rejections, Need More Info, SLA breaches
- **Batched:** Progress updates (5-minute window)

---

## Implementation

### Fix 1: Requester Progress Updates

**File:** `coiController.js`  
**Location:** After line 968

```javascript
// After sendApprovalNotification
const requester = getUserById(request.requester_id)
if (requester && requester.email) {
  sendEmail(requester.email, 
    `COI Request ${request.request_id} - Approved by ${user.role}`,
    `Your request has been approved by ${user.name} and is now pending ${nextRole} review.`)
}
```

### Fix 2: Notify All Approvers

**File:** `notificationService.js`  
**Location:** Line 377

**Change:**
```javascript
// Replace getNextApprover() with getAllApprovers()
const approvers = db.prepare(`
  SELECT * FROM users WHERE role = ? AND is_active = 1
  ${request.department && (nextRole === 'Director' || nextRole === 'Compliance') ? 'AND department = ?' : ''}
`).all(nextRole, request.department || [])

approvers.forEach(approver => {
  sendEmail(approver.email, subject, body, { requestId, role: nextRole, restrictions })
})
```

---

## Summary

**Working:** 12 notification functions implemented  
**Status:** All critical gaps fixed ✅  
**Design:** 4 notification types, clear urgency rules

### Implementation Complete
- ✅ Requester progress updates implemented
- ✅ Multiple approvers notification implemented
- ✅ All stakeholders now receive appropriate notifications
