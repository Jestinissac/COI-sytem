# State Management & HRMS Integration Research

## Executive Summary

This document analyzes approaches for handling approver unavailability in the COI approval workflow, exploring HRMS integration options, notification strategies, and practical implementation recommendations for both prototype and production environments.

---

## 1. Problem Statement

### Business Challenge

When a COI request requires approval and the assigned approver (Director, Compliance Officer, or Partner) is unavailable due to vacation, sick leave, or other absence, the approval workflow stalls. This creates:

- **Workflow Bottlenecks**: Requests remain pending indefinitely
- **Business Delays**: Time-sensitive proposals miss deadlines
- **Lack of Transparency**: Requesters are unaware of approval delays
- **Manual Workarounds**: Admins must manually intervene or reassign requests

### Current Gaps

The COI prototype currently lacks:

1. **Approver Availability Detection**: No mechanism to identify when an approver is unavailable
2. **Requester Notifications**: No automatic alerts informing requesters of delays
3. **Delegation Mechanism**: No automatic reassignment to alternate approvers
4. **Out-of-Office Visibility**: Requesters cannot see approver status

---

## 2. HRMS Integration Options

### Option A: Direct HRMS API Integration (Real-Time Sync)

**Description**: Integrate directly with the organization's HRMS system via API to fetch real-time employee availability data.

**Technical Approach**:
- RESTful API calls to HRMS endpoints (e.g., `/employees/{id}/leave-status`)
- Scheduled sync every 6-24 hours to cache leave data locally
- Webhook subscriptions for real-time leave updates (if HRMS supports)

**Data Points Retrieved**:
- Employee ID
- Leave Status (On Leave, Available, On Business Trip)
- Leave Start Date / End Date
- Designated Delegate (if HRMS supports delegation)
- Leave Type (Annual Leave, Sick Leave, etc.)

**Pros**:
- ✅ Accurate, real-time data directly from authoritative source
- ✅ No manual data entry required
- ✅ Automatic synchronization
- ✅ Can integrate with existing HRMS delegation features

**Cons**:
- ❌ Requires HRMS API access and technical integration effort
- ❌ Dependency on HRMS system availability and API reliability
- ❌ May require IT department coordination and approvals
- ❌ Security and data privacy considerations (API keys, authentication)
- ❌ Potential cost for API usage or license fees

**Implementation Complexity**: **High** (2-3 weeks)

**Suitable For**: Production environment with mature IT infrastructure

---

### Option B: Manual Admin Entry (Simple, No Dependencies)

**Description**: Provide an admin interface for manually entering and managing approver unavailability periods.

**Technical Approach**:
- Simple database table: `approver_availability`
  - `user_id`, `unavailable_from`, `unavailable_to`, `reason`, `delegate_id`
- Admin UI form to add/edit/delete unavailability records
- Scheduled job checks daily for active unavailability periods

**Workflow**:
1. HR/Admin enters leave information manually
2. System checks approver availability when request reaches approval stage
3. If unavailable, triggers notification to requester and logs delay

**Pros**:
- ✅ Simple, fast to implement (1-2 days)
- ✅ No external dependencies or integrations
- ✅ Full control over data
- ✅ No API costs or security complexities
- ✅ Ideal for prototype and small teams

**Cons**:
- ❌ Manual data entry required (risk of outdated or incomplete data)
- ❌ Relies on admin diligence to keep data current
- ❌ No automatic sync with official HRMS records
- ❌ Potential for human error (wrong dates, missing entries)

**Implementation Complexity**: **Low** (1-2 days)

**Suitable For**: Prototype, small teams, or interim solution until HRMS integration is ready

---

### Option C: Hybrid (HRMS Sync + Manual Override)

**Description**: Combine automated HRMS sync with manual override capability for flexibility.

**Technical Approach**:
- Primary source: HRMS API (scheduled sync every 24 hours)
- Fallback/Override: Manual admin entry overrides HRMS data if needed
- Conflict resolution: Manual entry takes precedence

**Workflow**:
1. System syncs leave data from HRMS nightly
2. Admins can manually adjust or add records if HRMS data is incomplete/incorrect
3. System uses most recent data source (manual > HRMS sync)

**Pros**:
- ✅ Best of both worlds: Automation + flexibility
- ✅ Handles cases where HRMS data is incomplete or incorrect
- ✅ Graceful degradation if HRMS API is unavailable
- ✅ Admin control for urgent/edge cases

**Cons**:
- ❌ More complex than either option alone
- ❌ Still requires HRMS API integration effort
- ❌ Risk of data conflicts between HRMS and manual entries

**Implementation Complexity**: **Medium-High** (3-4 weeks)

**Suitable For**: Production with mature HRMS integration but need for flexibility

---

### Comparison Matrix

| **Criteria**                | **Option A: HRMS API** | **Option B: Manual Entry** | **Option C: Hybrid**       |
|----------------------------|------------------------|----------------------------|----------------------------|
| **Accuracy**                | ⭐⭐⭐⭐⭐ (Highest)      | ⭐⭐⭐ (Depends on admin)    | ⭐⭐⭐⭐ (High)              |
| **Implementation Effort**   | 🕒 High (2-3 weeks)    | 🕒 Low (1-2 days)          | 🕒 Medium-High (3-4 weeks) |
| **Maintenance Overhead**    | Low (automated)        | High (manual updates)      | Medium                     |
| **Reliability**             | Depends on HRMS        | Depends on admin           | High (fallback)            |
| **Cost**                    | $$$ (API, licenses)    | $ (internal only)          | $$$ (API + dev time)       |
| **Prototype Suitability**   | ❌ Too complex         | ✅ Perfect fit             | ⚠️ Overkill               |
| **Production Suitability**  | ✅ Recommended         | ⚠️ Interim only            | ✅ Ideal long-term         |

---

## 3. Notification Strategies

### Strategy 1: Inform Requester Only (No Auto-Delegation)

**Description**: Notify requester that their assigned approver is unavailable and expected return date.

**Workflow**:
1. Request reaches approval stage
2. System detects approver is unavailable
3. Email sent to requester: "Your request is pending approval from [Approver Name], who is currently unavailable until [Return Date]. Your request will be reviewed upon their return."
4. Request remains in approver's queue (no reassignment)

**Pros**:
- ✅ Simple, transparent communication
- ✅ Sets requester expectations (no surprises)
- ✅ No risk of incorrect delegation

**Cons**:
- ❌ Request remains stalled until approver returns
- ❌ No active resolution, just passive waiting
- ❌ Urgent requests still face delays

**Best For**: Non-urgent requests, short absences (1-3 days)

---

### Strategy 2: Auto-Delegation (Pre-Assigned Delegate)

**Description**: Automatically reassign requests to a pre-designated delegate when primary approver is unavailable.

**Workflow**:
1. Request reaches approval stage
2. System detects approver is unavailable
3. System checks for designated delegate (from HRMS or manual config)
4. Request automatically reassigned to delegate
5. Notifications sent to requester and delegate

**Delegation Rules**:
- Each approver must have a pre-assigned delegate (configured in HRMS or COI system)
- Delegate must have same or higher role level
- Delegate must not also be unavailable (recursive check)

**Pros**:
- ✅ Proactive solution, eliminates workflow stalls
- ✅ Urgent requests continue moving forward
- ✅ Business continuity maintained

**Cons**:
- ❌ Requires pre-configuration of delegates
- ❌ Risk if delegate is also unavailable (need fallback logic)
- ❌ Potential for approval by someone less familiar with context

**Best For**: Production environments, time-sensitive workflows, mature approval hierarchies

---

### Strategy 3: Auto-Escalation (Escalate After X Days)

**Description**: If approver is unavailable for more than X days, escalate request to their manager or a higher authority.

**Workflow**:
1. Request reaches approval stage
2. System detects approver is unavailable
3. Request enters "waiting" state for X days (e.g., 3 days)
4. If approver not returned after X days, escalate to manager/partner
5. Notifications sent at each stage

**Escalation Rules**:
- Directors escalate to Partner level
- Compliance escalates to Compliance Manager or Partner
- Partners escalate to Super Admin or designated fallback

**Pros**:
- ✅ Balances patience with urgency
- ✅ Allows short absences to resolve naturally
- ✅ Provides automatic safety net for long absences

**Cons**:
- ❌ Fixed escalation timer may not fit all scenarios
- ❌ Higher-level approvers may not want routine escalations
- ❌ More complex notification logic

**Best For**: Mix of urgent and routine requests, long absences (7+ days)

---

### Strategy Recommendation by Scenario

| **Scenario**                          | **Recommended Strategy**                              |
|---------------------------------------|-------------------------------------------------------|
| **Short absence (1-3 days)**          | Strategy 1: Inform requester, wait for return        |
| **Medium absence (4-7 days)**         | Strategy 2: Auto-delegate to pre-assigned backup      |
| **Long absence (7+ days)**            | Strategy 3: Auto-escalate after 3-5 day threshold     |
| **Urgent request (same-day approval)**| Strategy 2: Immediate auto-delegation                 |
| **Prototype/MVP**                     | Strategy 1: Simple notifications only                 |
| **Production (mature workflow)**      | Strategy 2 + Strategy 3: Hybrid (delegate first, then escalate) |

---

## 4. Prototype vs Production Recommendations

### Prototype Recommendation

**Approach**: **Option B (Manual Entry) + Strategy 1 (Inform Requester)**

**Rationale**:
- Fast to implement (1-2 days total)
- No external dependencies or integration complexities
- Sufficient for demonstrating workflow awareness
- Admins can manually enter leave periods
- Requesters receive transparent status updates

**Implementation**:
1. Add `approver_availability` table
2. Create admin UI for managing unavailability records
3. Add daily scheduled job to check for unavailable approvers
4. Send email notifications to requesters when pending approver is unavailable
5. Display unavailability notice on request detail page

**Estimated Effort**: 2 days

---

### Production Recommendation

**Approach**: **Option C (Hybrid HRMS + Manual) + Strategy 2 (Auto-Delegation) + Strategy 3 (Escalation Fallback)**

**Rationale**:
- HRMS integration provides accurate, real-time data
- Manual override allows flexibility for urgent cases
- Auto-delegation keeps workflow moving
- Escalation ensures long absences don't stall critical requests
- Complete business continuity solution

**Implementation**:
1. Integrate with HRMS API (scheduled daily sync)
2. Add manual override capability for admins
3. Configure delegation rules (each approver → delegate)
4. Implement auto-delegation logic with fallback checks
5. Add escalation timer and logic (escalate after 5 days)
6. Enhanced notification system (multi-stage alerts)
7. Dashboard widget showing approver availability at a glance

**Estimated Effort**: 3-4 weeks

---

## 5. Technical Requirements (If Implemented)

### Database Schema

```sql
-- Approver Availability Tracking
CREATE TABLE approver_availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  unavailable_from DATE NOT NULL,
  unavailable_to DATE NOT NULL,
  reason VARCHAR(100),
  delegate_id INTEGER, -- Designated delegate during absence
  status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Completed', 'Cancelled'
  source VARCHAR(20) DEFAULT 'Manual', -- 'Manual', 'HRMS', 'Self-Service'
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (delegate_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
)

-- Delegation Configuration (Production)
CREATE TABLE delegation_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  approver_id INTEGER NOT NULL,
  delegate_id INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  effective_from DATE,
  effective_to DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (approver_id) REFERENCES users(id),
  FOREIGN KEY (delegate_id) REFERENCES users(id),
  UNIQUE(approver_id, delegate_id)
)

-- Delegation History (Audit Trail)
CREATE TABLE delegation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  original_approver_id INTEGER NOT NULL,
  delegated_to_id INTEGER NOT NULL,
  delegation_reason VARCHAR(200),
  delegated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  action_taken VARCHAR(50), -- 'Approved', 'Rejected', 'Pending'
  FOREIGN KEY (request_id) REFERENCES coi_requests(id),
  FOREIGN KEY (original_approver_id) REFERENCES users(id),
  FOREIGN KEY (delegated_to_id) REFERENCES users(id)
)
```

### API Endpoints

#### Admin Management

```javascript
// Add/Update Unavailability
POST /api/admin/approver-availability
Body: {
  user_id, unavailable_from, unavailable_to, reason, delegate_id
}

// Get All Unavailability Records
GET /api/admin/approver-availability
Query: ?status=Active&from_date=2026-01-01

// Delete Unavailability Record
DELETE /api/admin/approver-availability/:id
```

#### HRMS Integration (Production)

```javascript
// Sync Leave Data from HRMS
POST /api/admin/hrms/sync-leave-data

// Configure HRMS Integration Settings
PUT /api/admin/hrms/config
Body: { api_url, api_key, sync_frequency }
```

#### Requester Visibility

```javascript
// Check Approver Availability for Request
GET /api/coi/requests/:id/approver-status
Response: {
  approver_name, is_available, unavailable_until, delegate_name
}
```

### UI Mockups

#### 1. Admin: Manage Approver Availability

**Location**: `/admin/approver-availability`

**Features**:
- Table showing all upcoming and current unavailability periods
- Add/Edit/Delete unavailability records
- Filter by user, date range, status
- Quick actions: "Mark as returned early", "Extend absence"

#### 2. Requester: Approval Status with Unavailability Notice

**Location**: `/coi/request/:id` (Request Detail Page)

**UI Element**:
```
┌──────────────────────────────────────────────────┐
│ ⚠️ Approval Status                               │
├──────────────────────────────────────────────────┤
│ Status: Pending Director Approval                │
│                                                   │
│ ℹ️ John Director is currently unavailable        │
│   Expected return: January 20, 2026              │
│   Your request will be reviewed upon return.     │
│                                                   │
│   For urgent matters, contact: jane@bdo.com      │
└──────────────────────────────────────────────────┘
```

#### 3. Dashboard: Approver Availability Widget

**Location**: Dashboard sidebars

**UI Element**:
```
┌──────────────────────────────────────┐
│ 📅 Team Availability                 │
├──────────────────────────────────────┤
│ • John Director      ✅ Available    │
│ • Sarah Compliance   🚫 On Leave     │
│   (Returns: Jan 20)                  │
│ • Mike Partner       ✅ Available    │
└──────────────────────────────────────┘
```

---

## 6. Migration Path

### Phase 1: Prototype (Week 1)

**Goal**: Demonstrate basic unavailability awareness

1. Implement manual admin entry for unavailability periods (1 day)
2. Add scheduled job to check unavailability status (0.5 days)
3. Send email notifications to requesters if approver unavailable (0.5 days)
4. Add unavailability notice to request detail page (0.5 days)

**Result**: Basic state management with manual input, requester awareness

---

### Phase 2: Interim Production (Weeks 2-4)

**Goal**: Add auto-delegation and improve UX

1. Implement delegation configuration (admins assign delegates) (1 week)
2. Add auto-delegation logic when approver unavailable (1 week)
3. Enhanced notifications (multi-party: requester, original approver, delegate) (3 days)
4. Dashboard widget showing team availability (2 days)

**Result**: Proactive workflow continuity with delegation

---

### Phase 3: Full Production (Weeks 5-8)

**Goal**: Integrate with HRMS for automation

1. HRMS API integration (scheduled sync) (2 weeks)
2. Hybrid mode (HRMS + manual override) (1 week)
3. Auto-escalation logic (escalate after 5 days) (1 week)
4. Advanced analytics (approval delay trends, delegation frequency) (2 days)
5. Self-service portal (employees update their own availability) (Optional, 1 week)

**Result**: Fully automated, enterprise-grade state management

---

## 7. Recommendation

### For COI Prototype

**Recommended Solution**: **Option B (Manual Entry) + Strategy 1 (Inform Requester)**

**Justification**:
- Fastest path to demonstrating the feature (2 days implementation)
- No external dependencies or integration risks
- Sufficient to show stakeholders the workflow awareness capability
- Easy to test and validate with mock data
- Can be expanded later without throwing away code

**Next Steps**:
1. Add `approver_availability` table to database
2. Create admin UI form for managing availability
3. Implement email notifications to requesters
4. Add unavailability banner on request detail page

---

### For Production Implementation

**Recommended Solution**: **Option C (Hybrid HRMS + Manual) + Strategy 2 (Auto-Delegation) + Strategy 3 (Escalation)**

**Justification**:
- Provides complete business continuity
- Balances automation with flexibility
- Scales to handle all absence scenarios
- Maintains audit trail for compliance
- Positions system as enterprise-grade workflow solution

**Phased Rollout**:
- **Phase 1**: Manual entry + notifications (immediate)
- **Phase 2**: Add delegation capability (within 1 month)
- **Phase 3**: HRMS integration + escalation (within 3 months)

---

## 8. Risk Assessment

| **Risk**                                    | **Impact** | **Mitigation**                                      |
|---------------------------------------------|------------|-----------------------------------------------------|
| HRMS API unavailable/unreliable             | High       | Hybrid mode with manual fallback                    |
| Delegate also unavailable                   | Medium     | Recursive check + escalation to higher level        |
| Wrong delegate assigned                     | Medium     | Admin review of delegation config quarterly         |
| Manual data entry errors/outdated           | Medium     | Daily scheduled check + email reminders to admins   |
| Notification overload (too many emails)     | Low        | Digest emails, configurable notification preferences|

---

## Conclusion

For the **COI prototype**, implement a simple **manual admin entry system with requester notifications** to demonstrate state management awareness. This can be delivered in 2 days with no external dependencies.

For **production**, adopt a **hybrid HRMS + manual approach with auto-delegation and escalation fallback** to ensure complete workflow continuity. Implement in phases over 3 months, starting with manual delegation before adding HRMS integration.

This approach balances speed-to-market for the prototype with a scalable, enterprise-ready solution for production deployment.
