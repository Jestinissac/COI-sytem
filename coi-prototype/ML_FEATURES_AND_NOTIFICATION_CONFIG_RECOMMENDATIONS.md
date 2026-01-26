# ML Features & Notification Configuration Recommendations

**Date**: January 26, 2026  
**Status**: Verified Implementation Analysis

---

## Executive Summary

This document provides verified recommendations for:
1. ML feature expansion (sender/receiver relationships)
2. Dynamic notification configuration (similar to SLA)
3. ML learning from notification preferences

**Key Finding**: The current ML implementation has a bug - it references a non-existent `assigned_to` field. This must be fixed before ML can be trained.

---

## 1. ML Feature Expansion: Sender/Receiver Relationships

### Current State (Verified)

**Existing Fields:**
- ✅ `requester_id` - Tracks who created the request (exists in `coi_requests` table)
- ✅ `director_approval_by`, `compliance_reviewed_by`, `partner_approved_by` - Track who approved at each stage
- ❌ `assigned_to` - **DOES NOT EXIST** (referenced in ML code but not in schema)

**How Recipients Are Determined:**
- Recipients are determined by workflow stage (`status` field)
- System uses role-based routing: `getNextApprover(department, role)` function
- No fixed "assignee" - workflow determines who should act

### Recommendation: **NOT REQUIRED**

**Reasoning:**
1. **Workflow-based routing**: Recipients are determined by status, not fixed assignment
2. **Role-based system**: Director → Compliance → Partner → Finance (sequential workflow)
3. **Department filtering**: Already handled via `department` field matching

**However, fix the bug:**

The ML code incorrectly references `assigned_to`. Replace with role-based workload:

```python
# Current (BROKEN - field doesn't exist):
assignee_workload = (SELECT COUNT(*) FROM coi_requests r2 
                     WHERE r2.assigned_to = r.assigned_to ...)

# Recommended Fix:
requester_workload = (SELECT COUNT(*) FROM coi_requests r2 
                      WHERE r2.requester_id = r.requester_id 
                      AND r2.status NOT IN ('COMPLETED', 'REJECTED', 'LAPSED')
                      AND r2.request_id != r.request_id)

# OR role-based workload (for current approver):
# Calculate based on status -> role mapping
```

**Alternative Features to Consider:**
- `requester_experience_level` - Count of requester's previous requests (if useful)
- `approver_response_time_avg` - Average response time of current approver role (if tracked)
- `department_workload` - Count of pending requests in same department

**Verdict**: Sender/receiver relationships are already captured via `requester_id` and approval fields. No expansion needed, but fix the `assignee_workload` bug.

---

## 2. Dynamic Notification Configuration (Like SLA)

### Current State (Verified)

**SLA Configuration (✅ Configurable):**
- Stored in `sla_config` table
- Managed via admin UI (`/coi/admin/sla-config`)
- Configurable per workflow stage, service type, PIE status
- Admin can adjust thresholds dynamically

**Notification Configuration (❌ Hardcoded):**
- `NOTIFICATION_FILTER_CONFIG` is hardcoded in `notificationService.js` (lines 22-35)
- No database table for notification preferences
- No admin UI for configuration
- Cannot be adjusted without code changes

### Recommendation: **IMPLEMENT DYNAMIC CONFIGURATION**

**Why:**
1. **Consistency**: SLA is configurable, notifications should be too
2. **Business flexibility**: Different departments may need different notification rules
3. **User control**: Users should control their notification volume
4. **Production readiness**: Hardcoded config is not production-appropriate

### Proposed Implementation

#### Step 1: Create Notification Configuration Table

```sql
CREATE TABLE notification_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_type VARCHAR(50) NOT NULL,  -- 'GLOBAL', 'ROLE', 'USER', 'DEPARTMENT'
    config_scope VARCHAR(100),         -- Role name, user_id, or department name
    sla_immediate_thresholds TEXT,     -- JSON: ['BREACH', 'CRITICAL']
    sla_batch_thresholds TEXT,         -- JSON: ['WARNING']
    enable_priority_filtering BOOLEAN DEFAULT 1,
    max_digest_items INTEGER DEFAULT 10,
    min_priority_to_include VARCHAR(20) DEFAULT 'MEDIUM',  -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    use_ml_priority BOOLEAN DEFAULT 0,
    ml_min_accuracy DECIMAL(3,2) DEFAULT 0.70,
    is_active BOOLEAN DEFAULT 1,
    updated_by INTEGER REFERENCES users(id),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(config_type, config_scope)
);
```

#### Step 2: Create Admin UI (Similar to SLA Config)

**Route**: `/coi/admin/notification-config`

**Features:**
- Global defaults (system-wide)
- Role-specific overrides (Director, Compliance, Partner, etc.)
- Department-specific overrides (Audit, Tax, Advisory, etc.)
- User-specific preferences (optional - for power users)

#### Step 3: Update Notification Service

**File**: `coi-prototype/backend/src/services/notificationService.js`

**Changes:**
- Replace hardcoded `NOTIFICATION_FILTER_CONFIG` with database lookup
- Function: `getNotificationConfig(userId, role, department)`
- Priority: User config > Role config > Department config > Global config

**Example:**
```javascript
function getNotificationConfig(userId, role, department) {
  const db = getDatabase()
  
  // Try user-specific config
  let config = db.prepare(`
    SELECT * FROM notification_config 
    WHERE config_type = 'USER' AND config_scope = ? AND is_active = 1
  `).get(userId.toString())
  
  // Fall back to role config
  if (!config) {
    config = db.prepare(`
      SELECT * FROM notification_config 
      WHERE config_type = 'ROLE' AND config_scope = ? AND is_active = 1
    `).get(role)
  }
  
  // Fall back to department config
  if (!config) {
    config = db.prepare(`
      SELECT * FROM notification_config 
      WHERE config_type = 'DEPARTMENT' AND config_scope = ? AND is_active = 1
    `).get(department)
  }
  
  // Fall back to global defaults
  if (!config) {
    config = db.prepare(`
      SELECT * FROM notification_config 
      WHERE config_type = 'GLOBAL' AND config_scope IS NULL AND is_active = 1
    `).get()
  }
  
  // Parse JSON fields
  return {
    slaImmediateThresholds: JSON.parse(config.sla_immediate_thresholds || '["BREACH", "CRITICAL"]'),
    slaBatchThresholds: JSON.parse(config.sla_batch_thresholds || '["WARNING"]'),
    enablePriorityFiltering: config.enable_priority_filtering === 1,
    maxDigestItems: config.max_digest_items || 10,
    minPriorityToInclude: config.min_priority_to_include || 'MEDIUM',
    useMLPriority: config.use_ml_priority === 1,
    mlMinAccuracy: config.ml_min_accuracy || 0.70
  }
}
```

#### Step 4: Seed Default Configuration

```sql
-- Global defaults
INSERT INTO notification_config (config_type, config_scope, sla_immediate_thresholds, sla_batch_thresholds, enable_priority_filtering, max_digest_items, min_priority_to_include)
VALUES ('GLOBAL', NULL, '["BREACH", "CRITICAL"]', '["WARNING"]', 1, 10, 'MEDIUM');

-- Role-specific: Directors (more urgent)
INSERT INTO notification_config (config_type, config_scope, sla_immediate_thresholds, max_digest_items)
VALUES ('ROLE', 'Director', '["BREACH", "CRITICAL", "WARNING"]', 5);

-- Role-specific: Compliance (standard)
INSERT INTO notification_config (config_type, config_scope, max_digest_items, min_priority_to_include)
VALUES ('ROLE', 'Compliance', 15, 'LOW');
```

**Verdict**: Implement dynamic configuration similar to SLA. This is essential for production readiness and user control.

---

## 3. ML Learning from Notification Preferences

### Current State (Verified)

**ML Learning (Current):**
- ✅ ML learns from request outcomes (SLA breaches, escalations, complaints)
- ✅ ML uses 15 features from request data
- ❌ No notification preferences exist to learn from
- ❌ No user behavior tracking (click rates, response times)

**Notification Preferences:**
- ❌ No `notification_preferences` table exists
- ❌ No user preference UI exists
- ❌ No tracking of user notification interactions

### Recommendation: **PHASE 2 ENHANCEMENT** (Not Required for Initial ML)

**Why Not Now:**
1. **ML needs outcome data first**: ML should learn from actual problems (SLA breaches, escalations), not user preferences
2. **Preferences don't exist yet**: Must build preference system first
3. **Different learning objective**: 
   - Current ML: "Which requests are likely to have problems?"
   - Preference ML: "Which notifications do users actually act on?" (different problem)

**Future Enhancement (After 6 Months):**

Once notification preferences exist, ML could learn:

1. **User Engagement Patterns:**
   - Which notification types get clicked most?
   - Which priority levels trigger user action?
   - Time-of-day preferences (when users are most responsive)

2. **Personalization:**
   - Adjust notification priority based on user's historical response patterns
   - Learn: "This user always acts on HIGH priority items, ignores MEDIUM"
   - Customize digest content per user

3. **Notification Effectiveness:**
   - Track: notification sent → user clicked → action taken → outcome
   - Learn: "Emails with priority score > 70 get 80% response rate"
   - Optimize: Send fewer, more effective notifications

**Implementation (Future):**

```sql
-- Track notification interactions
CREATE TABLE notification_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    notification_id INTEGER REFERENCES notification_queue(id),
    user_id INTEGER REFERENCES users(id),
    interaction_type VARCHAR(20),  -- 'CLICKED', 'IGNORED', 'ACTED', 'DISMISSED'
    interaction_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    action_taken VARCHAR(50),      -- 'APPROVED', 'REJECTED', 'VIEWED', etc.
    outcome VARCHAR(20)            -- 'GOOD', 'BAD' (filled after request resolved)
);

-- User notification preferences
CREATE TABLE user_notification_preferences (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    email_enabled BOOLEAN DEFAULT 1,
    digest_frequency VARCHAR(20) DEFAULT 'BATCHED',  -- 'IMMEDIATE', 'HOURLY', 'BATCHED', 'DAILY'
    min_priority_to_email VARCHAR(20) DEFAULT 'MEDIUM',
    quiet_hours_start TIME,  -- e.g., '18:00'
    quiet_hours_end TIME,    -- e.g., '09:00'
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**ML Model for Preferences (Future):**

After 6 months of interaction data:
- Train model: "Given user's preferences and notification features, predict if user will act"
- Use to filter: Only send notifications user is likely to act on
- Personalize: Adjust priority thresholds per user based on their engagement

**Verdict**: Not required for initial ML implementation. ML should learn from request outcomes first. Notification preference learning is a Phase 2 enhancement after preference system exists.

---

## 4. Critical Bug Fix: `assignee_workload` Feature

### Issue

**Files Affected:**
1. `coi-prototype/backend/ml/database.py` (line 200)
2. `coi-prototype/backend/src/services/mlPriorityService.js` (line 89)

**Problem:**
- Both files reference `r.assigned_to` and `request.assigned_to`
- This field **does not exist** in `coi_requests` table
- ML training will fail or return incorrect data

### Fix Required

**Option 1: Remove `assignee_workload` Feature**
- Simplest: Remove from feature list
- Update: `priority_ml_model.py` to remove from `feature_names`
- Update: `database.py` to remove from query
- Update: `mlPriorityService.js` to remove from feature extraction

**Option 2: Replace with `requester_workload`**
- Calculate workload of requester (who created the request)
- More meaningful: "Does this requester have many pending requests?"

**Option 3: Replace with Role-Based Workload**
- Calculate workload of current approver role
- Example: "How many requests are pending for Director role in Audit department?"

**Recommended: Option 2 + Option 3**

```python
# In database.py get_training_data():
-- Requester workload
requester_workload = (SELECT COUNT(*) FROM coi_requests r2 
                      WHERE r2.requester_id = r.requester_id 
                      AND r2.status NOT IN ('COMPLETED', 'REJECTED', 'LAPSED')
                      AND r2.request_id != r.request_id)

-- Role workload (for current approver role based on status)
role_workload = (SELECT COUNT(*) FROM coi_requests r2 
                 WHERE r2.status = r.status 
                 AND r2.department = r.department
                 AND r2.request_id != r.request_id)
```

**Priority**: **CRITICAL** - Must fix before ML training can succeed.

---

## 5. Email Handling Best Practices

### Current Implementation (Verified)

**Email Types:**
1. **Immediate Alerts**: SLA BREACH, SLA CRITICAL, REJECTION (sent immediately)
2. **Batched Digest**: SLA WARNING, status updates (grouped in 5-minute window)

**Email Content:**
- Subject line with priority indicator
- Request details (ID, client, stage)
- Action buttons: "View Request", "Approve", "Reject" (if applicable)
- Priority score and top factors

### Recommendation: **Daily Digests with Review/Approve Buttons**

**Best Approach:**

1. **Immediate Alerts** (Keep as-is):
   - SLA BREACH → Immediate email with "View & Resolve" button
   - SLA CRITICAL → Immediate email with "Review Now" button
   - REJECTION → Immediate email with "View Details" button

2. **Daily Digest** (Enhance current batching):
   - **Frequency**: Once per day (e.g., 9:00 AM)
   - **Content**: Priority-ordered list of pending items
   - **Format**: Grouped by priority level (CRITICAL, HIGH, MEDIUM, LOW)
   - **Actions**: Each item has "Review" button linking to request detail page
   - **Summary**: "You have 5 CRITICAL, 8 HIGH, 12 MEDIUM items pending"

3. **Review/Approve Buttons in Email**:
   - ✅ **Good**: "View Request" button (links to request detail page)
   - ⚠️ **Consider**: "Quick Approve" button (if security allows)
   - ❌ **Not Recommended**: Direct approve from email (security risk, no audit trail)

**Security Considerations:**
- Email links should require authentication (token-based)
- Approve actions should happen in-app (not via email link)
- Email should be informational + navigation, not transactional

**Example Digest Email:**

```
Subject: COI System Daily Digest - 25 Items Requiring Your Attention

Hello [Name],

Here's your prioritized task list for today:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 CRITICAL PRIORITY (5 items)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Request COI-2026-045 - ABC Corporation
   Priority Score: 85/100 | SLA: ⚡ WARNING
   Top Factors: SLA Status: WARNING, External Deadline: Yes
   [View Request] [Review Now]

2. Request COI-2026-042 - XYZ Ltd
   Priority Score: 78/100 | SLA: ⚡ WARNING
   Top Factors: PIE Status: Yes, Service Type: Tax Advisory
   [View Request] [Review Now]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟠 HIGH PRIORITY (8 items)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. Request COI-2026-040 - ...
   [View Request]

[View All Items in Dashboard]
```

**Verdict**: Daily digests with priority ordering + "View Request" buttons. Approve actions should happen in-app for security and audit trail.

---

## Implementation Priority

### Phase 1: Critical Fixes (Immediate)

1. **Fix `assignee_workload` bug** (CRITICAL)
   - Remove or replace with `requester_workload` / `role_workload`
   - Update all 3 files: `database.py`, `mlPriorityService.js`, `priority_ml_model.py`

### Phase 2: Dynamic Configuration (High Priority)

2. **Create `notification_config` table**
3. **Create admin UI** (`/coi/admin/notification-config`)
4. **Update notification service** to use database config
5. **Seed default configurations**

### Phase 3: Enhanced Email Handling (Medium Priority)

6. **Implement daily digest** (replace 5-minute batching)
7. **Add priority grouping** to digest emails
8. **Add "View Request" buttons** with secure token links

### Phase 4: ML Preference Learning (Future - After 6 Months)

9. **Create `notification_interactions` table**
10. **Create `user_notification_preferences` table**
11. **Build preference UI**
12. **Train ML model on user engagement patterns**

---

## Summary

| Question | Answer | Priority |
|----------|--------|----------|
| Expand ML to sender/receiver? | **No** - Already captured via `requester_id`. Fix `assignee_workload` bug instead. | **Critical** (bug fix) |
| Dynamic notification config like SLA? | **Yes** - Implement `notification_config` table and admin UI | **High** |
| ML learn from notification preferences? | **Not yet** - Build preference system first, then Phase 2 ML enhancement | **Low** (future) |
| Daily digests with approve buttons? | **Yes** - Daily digests with "View Request" buttons. Approve in-app only. | **Medium** |

---

## Files Requiring Changes

### Critical (Bug Fix)
1. `coi-prototype/backend/ml/database.py` - Fix `assignee_workload` query
2. `coi-prototype/backend/src/services/mlPriorityService.js` - Fix `assignee_workload` calculation
3. `coi-prototype/backend/ml/priority_ml_model.py` - Remove or replace `assignee_workload` feature

### High Priority (Dynamic Config)
4. `coi-prototype/database/migrations/` - Create `notification_config` table migration
5. `coi-prototype/backend/src/services/notificationService.js` - Replace hardcoded config with DB lookup
6. `coi-prototype/backend/src/controllers/notificationController.js` - Add config CRUD endpoints
7. `coi-prototype/frontend/src/views/NotificationConfig.vue` - Create admin UI (similar to SLAConfig.vue)

### Medium Priority (Email Enhancement)
8. `coi-prototype/backend/src/services/notificationService.js` - Update `flushNotificationBatch()` for daily digest
9. `coi-prototype/backend/src/services/emailService.js` - Enhance digest email template

---

**Document Status**: Verified against actual codebase  
**Last Updated**: January 26, 2026
