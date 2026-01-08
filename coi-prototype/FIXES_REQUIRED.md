# Required Fixes - Priority Order

## CRITICAL - Fix Immediately (System Broken)

### Fix 1: Missing Imports in coi.routes.js
**File**: `backend/src/routes/coi.routes.js`  
**Line**: 22

**Add to imports**:
```javascript
import { 
  getMonitoringDashboard, 
  runScheduledTasks, 
  generateMonthlyReport,
  sendIntervalAlerts, 
  checkRenewalAlerts, 
  getMonitoringAlertsSummary 
} from '../services/monitoringService.js'
```

**Impact**: Routes `/monitoring/send-interval-alerts`, `/monitoring/check-renewals`, `/monitoring/summary` will crash

---

### Fix 2: Missing Imports in coiController.js
**File**: `backend/src/controllers/coiController.js`  
**Line**: 1-8 (add after existing imports)

**Add**:
```javascript
import { parseRecommendations, logComplianceDecision } from '../services/auditTrailService.js'
```

**Impact**: Compliance approval and rejection will fail with "function not defined" error

---

### Fix 3: Commercial Data Exclusion Not Enforced
**File**: `backend/src/controllers/coiController.js`  
**Function**: `getRequestById()`  
**Line**: 116-122

**Current Code**:
```javascript
const response = {
  ...request,
  client_name: client?.client_name || null,
  client_code: client?.client_code || null,
  requester_name: requester?.requester_name || request.requestor_name || null,
  signatories
}
```

**Fix**: Exclude commercial fields for Compliance role
```javascript
// Merge data
const response = {
  ...request,
  client_name: client?.client_name || null,
  client_code: client?.client_code || null,
  requester_name: requester?.requester_name || request.requestor_name || null,
  signatories
}

// Exclude commercial data for Compliance role
if (user.role === 'Compliance') {
  delete response.financial_parameters
  delete response.engagement_code
  delete response.total_fees
  // Remove any other commercial fields
}
```

**Impact**: Compliance team can see financial data, violating data segregation

---

### Fix 4: Wrong Status on Proposal Execution
**File**: `backend/src/controllers/coiController.js`  
**Function**: `executeProposal()`  
**Line**: 571-580

**Current Code**:
```javascript
db.prepare(`
  UPDATE coi_requests 
  SET execution_date = ?,
      proposal_sent_date = ?,
      status = 'Active',
      stage = 'Engagement',
      days_in_monitoring = 0,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`).run(executionDate, executionDate, req.params.id)
```

**Fix**: Keep status as 'Approved', stage as 'Proposal'
```javascript
db.prepare(`
  UPDATE coi_requests 
  SET execution_date = ?,
      proposal_sent_date = ?,
      status = 'Approved',  // Keep as Approved, not Active
      stage = 'Proposal',   // Keep as Proposal until client accepts
      days_in_monitoring = 0,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`).run(executionDate, executionDate, req.params.id)
```

**Impact**: Requests become Active before client accepts, violating business rules

---

## HIGH PRIORITY - Fix Soon

### Fix 5: Automatic 30-Day Lapse Not Implemented
**Files**: 
- `backend/src/services/monitoringService.js` (add function)
- Create scheduled job/cron

**Add Function**:
```javascript
export async function checkAndLapseExpiredProposals() {
  const db = getDatabase()
  
  // Find proposals executed >30 days ago with no client response
  const expiredProposals = db.prepare(`
    SELECT id, request_id, client_id, execution_date
    FROM coi_requests
    WHERE status = 'Approved'
      AND stage = 'Proposal'
      AND execution_date IS NOT NULL
      AND client_response_date IS NULL
      AND DATE(execution_date, '+30 days') < DATE('now')
  `).all()
  
  const lapsed = []
  for (const proposal of expiredProposals) {
    db.prepare(`
      UPDATE coi_requests 
      SET status = 'Lapsed',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(proposal.id)
    
    // Send notification
    sendLapseNotification(proposal.id)
    lapsed.push(proposal.request_id)
  }
  
  return { lapsed: lapsed.length, requestIds: lapsed }
}
```

**Add Route** (for manual trigger or cron):
```javascript
router.post('/monitoring/check-lapses', requireRole('Admin', 'Super Admin'), async (req, res) => {
  try {
    const result = await checkAndLapseExpiredProposals()
    res.json({ success: true, result })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
```

**Impact**: Requests never automatically lapse, remain open indefinitely

---

### Fix 6: Clarify Director Status Routing
**File**: `backend/src/controllers/coiController.js`  
**Function**: `submitRequest()`  
**Line**: 315-318

**Current Code**:
```javascript
// If team member, require director approval first (unless blocked by rules)
if (user.role === 'Requester' && user.director_id && !hasBlockRecommendation) {
  newStatus = 'Pending Director Approval'
}
```

**Fix**: Add explicit Director check for clarity
```javascript
// Directors skip their own approval, go directly to Compliance
if (user.role === 'Director') {
  newStatus = 'Pending Compliance'
} else if (user.role === 'Requester' && user.director_id && !hasBlockRecommendation) {
  newStatus = 'Pending Director Approval'
}
```

**Impact**: Logic is unclear, may cause confusion (though may work correctly)

---

## MEDIUM PRIORITY - Code Quality

### Fix 7: Consolidate getUserById
**Create**: `backend/src/utils/userUtils.js`
```javascript
import { getDatabase } from '../database/init.js'

const db = getDatabase()

export function getUserById(userId) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
}
```

**Update**: All files using `getUserById()` to import from utils

**Files to Update**:
- `backend/src/controllers/coiController.js`
- `backend/src/controllers/attachmentController.js`

---

## Summary

**Critical Fixes**: 4 (system broken without these)
**High Priority**: 2 (missing features)
**Medium Priority**: 1 (code quality)

**Total Files to Modify**: 3
**New Files to Create**: 1 (userUtils.js)
**New Functions to Add**: 1 (checkAndLapseExpiredProposals)
