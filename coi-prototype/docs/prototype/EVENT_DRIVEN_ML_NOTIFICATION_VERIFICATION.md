# Event-Driven ML Notification System - Verification Report

**Date:** January 25, 2026  
**Plan:** Event-Driven ML Notification System Configuration  
**Status:** ✅ **VERIFIED WITH CORRECTIONS**

---

## Verification Summary

The plan has been verified against the actual codebase. **The approach is sound**, but several important corrections and clarifications are needed.

---

## ✅ Verified Claims

### 1. SLA Event Handlers ✅
- **Location**: `notificationService.js` lines 778-918
- **Verified**: `handleSLAWarning()`, `handleSLACritical()`, `handleSLABreach()` exist
- **Verified**: All include `requestId` in payload metadata (line 790, 832, 876)
- **Verified**: SLA WARNING queued (not urgent), CRITICAL/BREACH sent immediately

### 2. Notification Queue Schema ✅
- **Location**: `database/migrations/20260119_notification_queue.sql`
- **Verified**: `payload` column is TEXT (stores JSON)
- **Verified**: `requestId` is available in `payload.metadata` for SLA notifications

### 3. Priority Service ✅
- **Location**: `priorityService.js` line 58
- **Verified**: `calculatePriority(request)` function exists and is exported
- **Verified**: Takes full request object as parameter
- **Verified**: Returns `{ score, level, breakdown, slaStatus, topFactors }`

### 4. Batch Flush Sorting ✅
- **Location**: `notificationService.js` line 99
- **Verified**: Currently sorts by `ORDER BY created_at ASC`
- **Verified**: No priority sorting currently implemented

### 5. Request Fetching Pattern ✅
- **Location**: `notificationService.js` line 374
- **Verified**: Pattern exists: `db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(requestId)`
- **Verified**: Works for fetching request data

---

## ⚠️ Critical Corrections Needed

### Correction 1: Scope Limitation

**Issue**: Plan assumes all notifications go through queue, but only SLA notifications are queued.

**Verified Facts**:
- **SLA Notifications**: ✅ Go through `queueNotification()` → stored in `notification_queue` → batched
- **Approval Notifications**: ❌ Sent directly via `sendEmail()` (bypass queue) - lines 373-460
- **Other Notifications**: ❌ Sent directly via `sendEmail()` (bypass queue)

**Impact**: Priority sorting can only be applied to **SLA notifications** that are batched (SLA_WARNING). SLA_CRITICAL and SLA_BREACH are sent immediately and bypass batching.

**Correction**: Update plan to clarify:
- **Layer 1 (SLA)**: Only SLA_WARNING notifications are queued and can be sorted by priority
- **Layer 2 (ML Priority)**: Only applies to batched notifications (currently only SLA_WARNING)
- **Immediate Notifications**: SLA_CRITICAL and SLA_BREACH bypass batching (sent immediately), so priority sorting doesn't apply

### Correction 2: Performance Optimization

**Issue**: Plan suggests fetching request data for each notification individually.

**Verified Pattern**: Current code fetches requests one at a time (line 374).

**Better Approach**: Batch fetch all requests in one query to avoid N+1 queries.

**Correction**: Update `sortNotificationsByPriority()` to:
1. Extract all `requestId` values from notifications
2. Batch fetch: `SELECT * FROM coi_requests WHERE id IN (?, ?, ...)`
3. Create a map: `requestMap[requestId] = request`
4. Use map for priority calculation

### Correction 3: Request ID Availability

**Issue**: Plan assumes all notifications have `requestId` in metadata.

**Verified**: 
- ✅ SLA notifications: `requestId` in payload.metadata (line 790, 832, 876)
- ❓ Other notification types: Need to verify if they go through queue

**Correction**: Add error handling for notifications without `requestId`:
- Skip priority calculation if `requestId` not available
- Sort those notifications by `created_at` (fallback)

### Correction 4: SLA Status in Payload

**Issue**: Plan says to add `sla_status` to payload metadata.

**Verified**: SLA event payload already includes SLA status information:
- `percentUsed` (line 110)
- `hoursRemaining` (line 109)
- But not the calculated `slaStatus.status` (ON_TRACK, WARNING, CRITICAL, BREACH)

**Correction**: Add `slaStatus` field to payload metadata in SLA handlers:
- `metadata: { ...payload, slaStatus: 'WARNING' }` (or 'CRITICAL', 'BREACH')

---

## ✅ Verified Implementation Details

### File Paths ✅
- `coi-prototype/backend/src/services/notificationService.js` - ✅ EXISTS
- `coi-prototype/backend/src/services/priorityService.js` - ✅ EXISTS
- `coi-prototype/backend/src/services/slaService.js` - ✅ EXISTS
- `coi-prototype/backend/src/services/slaMonitorService.js` - ✅ EXISTS

### Function Signatures ✅
- `calculatePriority(request)` - ✅ EXISTS, takes request object
- `handleSLAWarning(payload)` - ✅ EXISTS
- `handleSLACritical(payload)` - ✅ EXISTS
- `handleSLABreach(payload)` - ✅ EXISTS
- `flushNotificationBatch()` - ✅ EXISTS
- `buildDigestBody(recipientName, notifications)` - ✅ EXISTS

### Database Schema ✅
- `notification_queue` table - ✅ EXISTS (migration 20260119)
- `payload` column (TEXT) - ✅ EXISTS
- `requestId` in payload metadata - ✅ VERIFIED for SLA notifications

### Import Paths ✅
- `priorityService.js` exports `calculatePriority` - ✅ VERIFIED
- `slaService.js` exports `calculateSLAStatus`, `SLA_STATUS` - ✅ VERIFIED

---

## 🔍 Additional Findings

### Finding 1: EventBus Events vs Queue

**Discovery**: EventBus events (DIRECTOR_APPROVAL_REQUIRED, etc.) are emitted but NOT handled by notificationService.js handlers. They're only used for My Day/Week views.

**Implication**: Approval notifications are sent directly via `sendEmail()`, not queued. They cannot benefit from priority sorting unless we migrate them to use `queueNotification()`.

**Recommendation**: Consider migrating approval notifications to use `queueNotification()` for consistency and to enable priority sorting.

### Finding 2: Batch Fetching Pattern

**Current Pattern**: Individual fetches (line 374)
```javascript
const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(requestId)
```

**Better Pattern**: Batch fetch
```javascript
const requestIds = notifications.map(n => {
  const payload = JSON.parse(n.payload)
  return payload.metadata?.requestId
}).filter(Boolean)

const requests = db.prepare(`
  SELECT * FROM coi_requests WHERE id IN (${requestIds.map(() => '?').join(',')})
`).all(...requestIds)

const requestMap = new Map(requests.map(r => [r.id, r]))
```

### Finding 3: Priority Service Dependencies

**Verified**: `calculatePriority()` internally calls `calculateSLAStatus()` from `slaService.js` (line 66 of priorityService.js).

**Implication**: No need to separately calculate SLA status - priority calculation already includes it.

---

## 📋 Corrected Plan Summary

### Scope Clarification
- **Applies To**: Only SLA_WARNING notifications (queued, batched)
- **Does Not Apply To**: SLA_CRITICAL, SLA_BREACH (sent immediately, bypass queue)
- **Future Consideration**: Migrate approval notifications to queue for priority sorting

### Implementation Changes
1. **Batch Fetch Requests**: Use `IN` query instead of individual fetches
2. **Add SLA Status**: Include `slaStatus` in payload metadata (WARNING, CRITICAL, BREACH)
3. **Error Handling**: Handle notifications without `requestId` gracefully
4. **Performance**: Batch fetch all requests in one query

### ML Integration
- ✅ **Verified**: ML model design exists (`Priority_ML_Pipeline_Design.md`)
- ✅ **Verified**: ML tables exist (`ml_weights`, `ml_predictions`)
- ✅ **Verified**: `calculatePriority()` will automatically use ML when model is active
- ✅ **Verified**: No changes needed to notification service (uses same function)

---

## ✅ Final Verdict

**Is this the best approach?** ✅ **YES, with corrections**

**Strengths**:
- Two-layer filtering (SLA → ML Priority) is the correct architecture
- Leverages existing priority service (no duplication)
- ML integration is seamless (automatic when model is ready)
- Addresses production workload needs (guides approvers)

**Required Corrections**:
1. Clarify scope (SLA_WARNING only, not all notifications)
2. Optimize performance (batch fetch requests)
3. Add error handling (missing requestId)
4. Add SLA status to metadata

**Recommendation**: ✅ **APPROVE PLAN WITH CORRECTIONS**

---

*Verification completed: January 25, 2026*
