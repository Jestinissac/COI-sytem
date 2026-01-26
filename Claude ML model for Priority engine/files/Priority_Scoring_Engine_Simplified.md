# Priority Scoring Engine - Simplified Design

**COI Governance System**  
Version 1.0 - Simplified  
January 2025

---

## 1. Problem Statement

When system-generated notifications replace manual processes, users get overwhelmed with noise. Even after filtering to genuine requests, a Compliance Officer might have 25 items pending review. How do they know which to handle first?

### 1.1 Current State (from COI Workflow)

The existing workflow tracks requests through stages (Pending Review → Compliance → Partner → Finance) but provides no guidance on which request within a stage should be handled first.

### 1.2 Solution: Objective Priority Calculation

Calculate a priority score based on objective, measurable factors from existing data. No user-selected priority flags (which leads to gaming where "everything becomes urgent").

### 1.3 Design Principles

- **Simple**: Minimal tables, no over-engineering
- **Configurable**: Business can adjust weights without code changes
- **Grounded**: Only factors that exist in current COI data model
- **Transparent**: Users can see why something is prioritized

---

## 2. Priority Factors

These factors are derived from existing COI Workflow data fields. No new data collection required.

### 2.1 Factor Definitions

| Factor | Source (Existing Field) | Why It Matters |
|--------|------------------------|----------------|
| **SLA Status** | Calculated from workflow stage + time elapsed | Time-sensitive commitments |
| **External Deadline** | User-entered field (NEW - add to COI form) | Client/regulatory deadlines |
| **Client Type** | clients.client_type (PIE, International, Standard) | PIE requires more scrutiny |
| **Service Type** | coi_requests.service_type (Audit, Advisory, Tax) | Audit has regulatory deadlines |
| **Escalation Count** | Count of status bouncebacks in workflow | Repeated issues need attention |

### 2.2 What We Intentionally Excluded

| Excluded Factor | Reason |
|-----------------|--------|
| Revenue/Fee Amount | Not in current COI data model. Add later if business requires. |
| Request Age (days) | Redundant - SLA Status already captures time-based urgency. |
| User Priority Flag | Enables gaming. If everything is marked urgent, nothing is. |

---

## 3. Database Schema (2 Tables)

Simplified to just two tables: one for configuration, one for audit trail.

### 3.1 priority_config

Single table stores factors, weights, and value mappings together.

```sql
CREATE TABLE priority_config (
    factor_id VARCHAR(50) PRIMARY KEY,
    factor_name VARCHAR(100) NOT NULL,
    weight DECIMAL(3,1) DEFAULT 1.0,
    value_mappings JSON NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    updated_by INTEGER REFERENCES users(user_id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example value_mappings JSON:
-- {"BREACHED": 100, "CRITICAL": 80, "WARNING": 60, "ON_TRACK": 20}
```

### 3.2 Seed Data

```sql
INSERT INTO priority_config (factor_id, factor_name, weight, value_mappings) VALUES

('sla_status', 'SLA Status', 5.0, 
 '{"BREACHED": 100, "CRITICAL": 80, "WARNING": 60, "ON_TRACK": 20}'),

('external_deadline', 'External Deadline', 4.0,
 '{"OVERDUE": 100, "TODAY": 90, "THIS_WEEK": 60, "NEXT_WEEK": 30, "NONE": 0}'),

('client_type', 'Client Type', 3.0,
 '{"PIE": 100, "INTERNATIONAL": 70, "EXISTING": 40, "POTENTIAL": 40, "STANDARD": 20}'),

('service_type', 'Service Type', 2.0,
 '{"STATUTORY_AUDIT": 100, "TAX_COMPLIANCE": 80, "INTERNAL_AUDIT": 70, "ADVISORY": 40}'),

('escalation_count', 'Escalation Count', 3.0,
 '{"3+": 100, "2": 70, "1": 40, "0": 0}');
```

### 3.3 priority_audit

Simple audit log - who changed what and when.

```sql
CREATE TABLE priority_audit (
    audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
    factor_id VARCHAR(50) NOT NULL,
    field_changed VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by INTEGER REFERENCES users(user_id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(255)
);
```

---

## 4. Priority Calculation

### 4.1 Formula

Simple weighted average, normalized to 0-100 scale:

```
Priority Score = Sum(FactorScore × Weight) / Sum(Weight) 

Example:
- SLA Status: CRITICAL (80) × weight 5.0 = 400
- External Deadline: THIS_WEEK (60) × weight 4.0 = 240  
- Client Type: PIE (100) × weight 3.0 = 300
- Service Type: STATUTORY_AUDIT (100) × weight 2.0 = 200
- Escalation: 0 (0) × weight 3.0 = 0

Total: 1140 / 17.0 = 67 (HIGH priority)
```

### 4.2 Urgency Levels

Map numeric score to display categories:

| Score | Level | UI Treatment |
|-------|-------|--------------|
| 80-100 | **CRITICAL** | Red badge, top of list, requires immediate action |
| 60-79 | **HIGH** | Orange badge, prioritized section |
| 40-59 | **MEDIUM** | Yellow badge, standard section |
| 0-39 | **LOW** | Green badge, can be deferred |

### 4.3 Service Implementation

```javascript
// services/priorityService.js

class PriorityService {
  
  async calculatePriority(request) {
    const config = await this.getActiveConfig();
    
    let totalWeightedScore = 0;
    let totalWeight = 0;
    const breakdown = [];
    
    for (const factor of config) {
      const rawValue = this.extractValue(request, factor.factor_id);
      const score = factor.value_mappings[rawValue] || 0;
      const weighted = score * factor.weight;
      
      totalWeightedScore += weighted;
      totalWeight += factor.weight;
      
      breakdown.push({
        factor: factor.factor_name,
        value: rawValue,
        score: score,
        weight: factor.weight,
        contribution: weighted
      });
    }
    
    const finalScore = Math.round(totalWeightedScore / totalWeight);
    
    return {
      score: finalScore,
      level: this.getLevel(finalScore),
      breakdown
    };
  }
  
  extractValue(request, factorId) {
    switch (factorId) {
      case 'sla_status':
        return this.calculateSLAStatus(request);
      case 'external_deadline':
        return this.calculateDeadlineStatus(request.external_deadline);
      case 'client_type':
        return request.client?.client_type || 'STANDARD';
      case 'service_type':
        return request.service_type || 'ADVISORY';
      case 'escalation_count':
        const count = request.escalation_count || 0;
        if (count >= 3) return '3+';
        return count.toString();
    }
  }
  
  getLevel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }
}
```

---

## 5. Admin Configuration UI

Simple interface for business users to adjust weights without developer involvement.

### 5.1 Weight Adjustment Screen

```
┌─────────────────────────────────────────────────────────────────┐
│ Priority Configuration                           [Save Changes] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Adjust how much each factor influences priority ranking.        │
│                                                                 │
│ Factor              Current Weight    Adjust                    │
│ ─────────────────────────────────────────────────────────────── │
│ SLA Status          5.0               [─────●─────] ▼           │
│ External Deadline   4.0               [────●──────] ▼           │
│ Client Type         3.0               [───●───────] ▼           │
│ Escalation Count    3.0               [───●───────] ▼           │
│ Service Type        2.0               [──●────────] ▼           │
│                                                                 │
│ ─────────────────────────────────────────────────────────────── │
│ [Reset to Defaults]                                             │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Value Mapping Editor

Allow business to adjust how raw values translate to scores:

```
┌─────────────────────────────────────────────────────────────────┐
│ Edit Value Mappings: SLA Status                          [Save] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Value          Score (0-100)    Description                     │
│ ─────────────────────────────────────────────────────────────── │
│ BREACHED       [100]            SLA time exceeded               │
│ CRITICAL       [ 80]            <2 hours remaining              │
│ WARNING        [ 60]            <8 hours remaining              │
│ ON_TRACK       [ 20]            Within SLA                      │
│                                                                 │
│ [+ Add Value]                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. My Day/Week Integration

How priority scores appear in the existing task management interface.

### 6.1 Task List with Priority

```
┌─────────────────────────────────────────────────────────────────┐
│ My Day - Compliance Review                    15 items pending  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 🔴 CRITICAL (2)                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ REQ-2025-00142 - Kuwait Oil Company              Score: 87  │ │
│ │ Statutory Audit | PIE | SLA BREACHED                        │ │
│ │                                            [Review Now →]   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ REQ-2025-00148 - Al Ahli Bank                    Score: 82  │ │
│ │ Tax Compliance | Deadline: Tomorrow                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ 🟠 HIGH (4)                                                     │
│ │ REQ-2025-00145 - ABC Holdings                    Score: 67  │ │
│ │ REQ-2025-00151 - XYZ Trading                     Score: 63  │ │
│ │ [+2 more]                                                   │ │
│                                                                 │
│ 🟡 MEDIUM (5) | 🟢 LOW (4)                      [View All →]   │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Score Breakdown (On Click)

When user clicks on a score, show how it was calculated:

```
┌─────────────────────────────────────────────────────────────────┐
│ Priority Breakdown: REQ-2025-00142                         [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Overall Score: 87 / 100                          Level: CRITICAL│
│                                                                 │
│ Factor              Value           Score   Weight   Points     │
│ ─────────────────────────────────────────────────────────────── │
│ SLA Status          BREACHED        100     5.0      500        │
│ Client Type         PIE             100     3.0      300        │
│ Service Type        STATUTORY_AUDIT 100     2.0      200        │
│ External Deadline   NONE            0       4.0      0          │
│ Escalation Count    0               0       3.0      0          │
│ ─────────────────────────────────────────────────────────────── │
│ Total: 1000 / 17 weights = 87                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. API Endpoints

Minimal API surface - only what's needed.

### 7.1 Get Prioritized Queue

**GET** `/api/priority/queue?role={role}`

Returns user's pending tasks sorted by priority score.

```json
{
  "items": [
    {
      "requestId": "REQ-2025-00142",
      "clientName": "Kuwait Oil Company",
      "score": 87,
      "level": "CRITICAL",
      "topFactors": ["SLA BREACHED", "PIE client"]
    }
  ],
  "summary": {
    "critical": 2,
    "high": 4,
    "medium": 5,
    "low": 4
  }
}
```

### 7.2 Get Score Breakdown

**GET** `/api/priority/breakdown/{requestId}`

Returns detailed calculation for a single request.

```json
{
  "requestId": "REQ-2025-00142",
  "score": 87,
  "level": "CRITICAL",
  "breakdown": [
    {"factor": "SLA Status", "value": "BREACHED", "score": 100, "weight": 5.0},
    {"factor": "Client Type", "value": "PIE", "score": 100, "weight": 3.0}
  ]
}
```

### 7.3 Get/Update Configuration

**GET** `/api/priority/config`

Returns current configuration (weights and value mappings).

**PUT** `/api/priority/config/{factorId}`

Updates weight or value mappings for a factor. Requires ADMIN role.

```json
// Request body
{
  "weight": 4.5,
  "reason": "Increasing SLA weight for Q1 audit season"
}

// Response
{
  "success": true,
  "auditId": 123
}
```

---

## 8. Implementation Checklist

### 8.1 Database Changes

1. Create priority_config table
2. Create priority_audit table
3. Insert seed data for 5 factors
4. Add external_deadline column to coi_requests (if not exists)

### 8.2 Backend

1. Create priorityService.js with calculatePriority()
2. Create priorityController.js with 3 endpoints
3. Integrate with myDayWeekService.js to sort by score

### 8.3 Frontend

1. Add PriorityBadge.vue component
2. Add ScoreBreakdown.vue modal
3. Add PriorityConfig.vue admin page
4. Update MyTasks.vue to group by priority level

### 8.4 Testing

1. Unit tests for priority calculation
2. Verify score changes when config is updated
3. Validate audit log captures changes

---

## 9. Questions for Stakeholder Validation

Before implementation, confirm these decisions with business stakeholders:

| # | Question | Default Assumption |
|---|----------|-------------------|
| 1 | What are the SLA target times per workflow stage? | TBD - need business input |
| 2 | Should EXISTING clients rank higher or lower than POTENTIAL clients? | Equal (both = 40) |
| 3 | Is fee/revenue amount a prioritization factor? | No (not in current scope) |
| 4 | What are the CRITICAL/WARNING SLA thresholds? | TBD - e.g., <2hrs / <8hrs |
| 5 | Who can modify priority configuration? | SUPER_ADMIN only |

### 9.1 Future Enhancements (Out of Scope)

These can be added later if needed:

- Revenue/fee amount as a factor
- Workload balancing across team members
- Auto-escalation when priority exceeds threshold
- Preview impact of config changes before saving

---

## Appendix: Comparison with Original Design

| Original (Over-Engineered) | Simplified |
|---------------------------|------------|
| 4 database tables | **2 tables** |
| 8 priority factors | **5 factors** |
| Separate value_mappings table | **JSON column** |
| Effective dating (from/to) | **Simple timestamp** |
| 6 API endpoints | **3 endpoints** |
| IP/user agent logging | **Basic audit** |
| Revenue band factor | **Removed** (not in sources) |
| Request age factor | **Removed** (redundant) |
| Partner priority flag | **Removed** (enables gaming) |
