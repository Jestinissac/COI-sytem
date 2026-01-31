# Business Rules and Impact Analysis - System Documentation

## Overview

This document provides a comprehensive understanding of the Business Rules Engine and Impact Analysis system in the COI (Conflict of Interest) Management System. It is designed to be shared with other LLMs or developers who need to understand, maintain, or extend this system.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Business Rules System](#business-rules-system)
3. [Impact Analysis Framework](#impact-analysis-framework)
4. [Risk Assessment Methodology](#risk-assessment-methodology)
5. [Data Structures](#data-structures)
6. [API Endpoints](#api-endpoints)
7. [Key Concepts](#key-concepts)
8. [Examples](#examples)

---

## System Architecture

### High-Level Flow

```
COI Request Submission
    ↓
Business Rules Engine Evaluation
    ↓
Rule Matching & Action Execution
    ↓
Impact Analysis (for rule changes)
    ↓
Compliance Review & Decision
```

### Core Components

1. **Business Rules Engine** (`businessRulesEngine.js`)
   - Evaluates rules against COI requests
   - Returns actions (Standard) or recommendations (Pro)
   - Logs rule executions

2. **Impact Analysis Service** (`impactAnalysisService.js`)
   - Analyzes impact of rule changes before they're applied
   - Calculates risk levels
   - Identifies affected requests and dependencies

3. **Rule Builder UI** (`RuleBuilder.vue`)
   - Admin interface for creating/editing rules
   - Displays impact analysis before saving
   - Requires approval for high-risk changes

---

## Business Rules System

### Rule Structure

A business rule consists of:

1. **Rule Metadata**
   - `id`: Unique identifier
   - `rule_name`: Human-readable name
   - `rule_type`: Type of rule (`validation`, `conflict`, `workflow`)
   - `is_active`: Whether rule is currently active
   - `approval_status`: `Pending`, `Approved`, or `Rejected`

2. **Condition (IF)**
   - `condition_field`: Field to evaluate (e.g., `service_type`, `pie_status`)
   - `condition_operator`: Comparison operator (`equals`, `contains`, `in`, `not_in`, etc.)
   - `condition_value`: Value to compare against

3. **Action (THEN)**
   - `action_type`: What to do when rule matches
   - `action_value`: Additional data for the action

### Rule Types

#### 1. Validation Rules
- Purpose: Validate request data completeness/accuracy
- Example: "IF `pie_status` equals 'Yes' THEN require `parent_company` field"
- Action Types: `flag`, `require_approval`

#### 2. Conflict Rules
- Purpose: Detect prohibited service combinations
- Example: "IF `service_type` contains 'Audit,Tax' THEN block request"
- Action Types: Should be `block` or `recommend_reject` (never `recommend_approve`)
- **Critical**: Conflict rules must prevent conflicts, not allow them

#### 3. Workflow Rules
- Purpose: Control request routing and status transitions
- Example: "IF `requested_document` equals 'Proposal' THEN set status to 'Pending Partner'"
- Action Types: `set_status`, `send_notification`, `require_approval`

### Action Types

#### Standard Edition Actions (Enforced)
- `block`: Immediately block the request
- `flag`: Flag for review but allow to proceed
- `require_approval`: Require manual approval before proceeding

#### Pro Edition Actions (Recommendations)
- `recommend_reject`: Recommend rejection (high confidence)
- `recommend_flag`: Recommend flagging for review
- `recommend_review`: Recommend additional review
- `recommend_approve`: Recommend approval (lowest severity)

#### Common Actions
- `set_status`: Change request status
- `send_notification`: Send alert/notification

### Rule Evaluation Process

```javascript
// Pseudocode
for each active approved rule:
    if rule.condition matches request data:
        if system is Pro edition:
            return recommendation (not enforced)
        else:
            execute action (enforced)
        log execution to rule_execution_log
```

### Rule Matching Logic

**Condition Operators:**
- `equals` / `=`: Exact match (case-insensitive)
- `not_equals` / `!=`: Not equal
- `contains`: Field value contains condition value
- `not_contains`: Field value does not contain condition value
- `in`: Field value matches any value in comma-separated list
- `not_in`: Field value does not match any value in list

**Example:**
```javascript
Rule: {
  condition_field: "service_type",
  condition_operator: "contains",
  condition_value: "Audit,Tax"
}

Request: { service_type: "External Audit, Tax Compliance" }
Result: MATCHES (because "External Audit, Tax Compliance" contains both "Audit" and "Tax")
```

---

## Impact Analysis Framework

### Purpose

Impact analysis evaluates the consequences of changing a business rule **before** the change is applied. It helps prevent:
- Breaking existing compliance workflows
- Invalidating pending compliance reviews
- Accidentally allowing prohibited conflicts
- Disrupting active requests

### When Impact Analysis Runs

1. **Rule Creation**: When a new rule is created
2. **Rule Update**: When an existing rule is modified
3. **Rule Deactivation**: When a rule is disabled
4. **Pre-Update Check**: When user edits a rule in UI (real-time)

### Impact Analysis Dimensions

#### 1. Historical Execution Analysis
- **What**: How many times has this rule been executed?
- **Why**: Rules with high execution history have more impact
- **Data Source**: `rule_execution_log` table
- **Metrics**:
  - Total executions
  - Unique requests affected
  - Recent executions (last 30 days) vs historical

#### 2. Current Matching Requests
- **What**: Which active requests currently match this rule?
- **Why**: Changing the rule affects these requests
- **Data Source**: `coi_requests` table (evaluated against rule)
- **Metrics**:
  - Count of currently matching requests
  - Request IDs and statuses

#### 3. Proposed Change Impact
- **What**: How would the change affect request matching?
- **Why**: Understand before/after differences
- **Method**: Simulate rule with proposed changes
- **Metrics**:
  - Requests that would stop matching (condition tightened)
  - Requests that would start matching (condition relaxed)
  - Requests with changed actions (action type changed)

#### 4. Pending Reviews Affected
- **What**: Are there pending compliance reviews that reference this rule?
- **Why**: Changing rule might invalidate existing compliance decisions
- **Data Source**: `coi_requests.duplication_matches` (JSON field containing rule recommendations)
- **Metrics**:
  - Count of pending reviews with this rule
  - Status of affected reviews

#### 5. Rule Interdependencies
- **What**: Do other rules depend on this rule or share conditions?
- **Why**: Changing one rule might affect others
- **Method**: Check for rules with:
  - Same condition fields
  - Overlapping conditions
  - Same rule type category

#### 6. Regulatory Compliance Impact
- **What**: Does the change affect regulatory compliance?
- **Why**: Conflict rules have higher regulatory impact
- **Factors**:
  - Rule type (conflict > validation > workflow)
  - Action type severity (block > reject > flag > approve)
  - Misconfiguration detection (conflict rule with approve action = critical)

### Risk Assessment Methodology

#### Current Implementation (Additive Scoring)

**Risk Score Calculation:**
```javascript
riskScore = 0

// Historical executions
if (totalExecutions > 50) riskScore += 3
else if (totalExecutions > 10) riskScore += 2
else if (totalExecutions > 0) riskScore += 1

// Currently matching requests
if (currentlyMatching > 20) riskScore += 3
else if (currentlyMatching > 5) riskScore += 2
else if (currentlyMatching > 0) riskScore += 1

// Pending reviews
if (pendingReviews > 5) riskScore += 3
else if (pendingReviews > 0) riskScore += 2

// Action type changes (conflict rules)
if (conflictRule && actionChangedToApprove) riskScore += 5

// Risk level mapping
if (riskScore >= 7) return 'critical'
else if (riskScore >= 4) return 'high'
else if (riskScore >= 2) return 'medium'
else return 'low'
```

**Limitations:**
- Arbitrary point values
- No structured methodology
- Hard-coded thresholds
- Doesn't use industry-standard risk matrix

#### Proposed Enhancement (Risk Matrix)

**Risk = Likelihood × Impact**

**Likelihood Factors:**
- Historical execution frequency
- Current matching requests
- Pending reviews affected
- Rule type criticality

**Impact Factors:**
- Regulatory compliance (conflict rules = high)
- Business process disruption
- Data integrity risk
- Audit trail implications

**Risk Matrix:**
```
        Impact
        Low  Medium  High  Critical
Likelihood
Low      L     L      M      M
Medium   L     M      H      H
High     M     H      C      C
```

### Risk Levels

1. **Low**: Minimal impact, safe to proceed
   - No historical executions
   - No pending reviews
   - No currently matching requests
   - Non-critical rule type

2. **Medium**: Moderate impact, proceed with caution
   - Some historical executions (< 10)
   - Few pending reviews (< 5)
   - Some matching requests (< 5)
   - Non-critical rule type

3. **High**: Significant impact, requires review
   - Many historical executions (> 10)
   - Multiple pending reviews (> 5)
   - Many matching requests (> 5)
   - Critical rule type (conflict)

4. **Critical**: Severe impact, requires approval
   - Very high historical executions (> 50)
   - Many pending reviews (> 5)
   - Many matching requests (> 20)
   - Conflict rule with inappropriate action (e.g., `recommend_approve`)
   - Action type change from blocking to non-blocking

### Approval Requirements

**Requires Approval When:**
- Risk level is `high` or `critical`
- Conflict rule is being changed to less restrictive action
- Rule affects pending compliance reviews
- Rule has high historical execution count (> 50)

**Approval Process:**
1. Impact analysis runs automatically
2. If `requiresApproval = true`, update is blocked
3. User must explicitly acknowledge impact (`acknowledgeImpact: true`)
4. Update proceeds with audit trail

---

## Data Structures

### Rule Object

```typescript
interface BusinessRule {
  id: number
  rule_name: string
  rule_type: 'validation' | 'conflict' | 'workflow'
  condition_field: string | null
  condition_operator: 'equals' | 'contains' | 'in' | 'not_in' | ...
  condition_value: string | null
  action_type: 'block' | 'flag' | 'recommend_reject' | 'recommend_approve' | ...
  action_value: string | null
  is_active: boolean
  approval_status: 'Pending' | 'Approved' | 'Rejected'
  created_by: number
  approved_by: number | null
  approved_at: string | null
  created_at: string
  updated_at: string
}
```

### Impact Analysis Result

```typescript
interface ImpactAnalysis {
  ruleId: number
  ruleName: string
  ruleType: 'validation' | 'conflict' | 'workflow'
  changeType: 'condition_changed' | 'action_changed' | 'activation_changed' | 'no_change'
  
  affectedRequests: {
    currentlyMatching: number
    wouldMatch: number
    wouldStopMatching: number
    wouldStartMatching: number
    requestIds: number[]
  }
  
  historicalExecutions: {
    totalExecutions: number
    uniqueRequests: number
    recentExecutions?: number  // Last 30 days
  }
  
  pendingReviewsAffected: number
  
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  warnings: string[]
  errors: string[]
  requiresApproval: boolean
  
  actionTypeChange?: {
    from: string
    to: string
  }
  
  // Proposed enhancements
  likelihood?: 'low' | 'medium' | 'high'
  impact?: {
    regulatory: 'low' | 'medium' | 'high' | 'critical'
    operational: 'low' | 'medium' | 'high'
    dataIntegrity: 'low' | 'medium' | 'high'
  }
  ruleInterdependencies?: Array<{
    ruleId: number
    ruleName: string
    relationship: 'same_field' | 'overlapping_condition' | 'same_type'
  }>
  rollbackComplexity?: 'easy' | 'medium' | 'hard'
}
```

### Rule Execution Log

```typescript
interface RuleExecutionLog {
  id: number
  rule_id: number
  coi_request_id: number
  condition_matched: boolean
  action_taken: string | null
  execution_result: string  // JSON string
  executed_at: string
}
```

---

## API Endpoints

### Rule Management

**GET `/api/config/business-rules`**
- Returns all business rules
- Query params: `?type=conflict`, `?status=active`
- Response: `{ rules: BusinessRule[] }`

**POST `/api/config/business-rules`**
- Creates new rule
- Body: `BusinessRule` (without `id`)
- Response: `{ success: true, rule: BusinessRule }`

**PUT `/api/config/business-rules/:id`**
- Updates existing rule
- Body: Partial `BusinessRule`
- **Performs impact analysis automatically**
- If high risk: Returns `{ requiresApproval: true, impactAnalysis: ImpactAnalysis }`
- Body can include: `{ acknowledgeImpact: true, forceUpdate: true }` to proceed
- Response: `{ success: true, rule: BusinessRule, impactAnalysis?: ImpactAnalysis }`

**DELETE `/api/config/business-rules/:id`**
- Deletes rule
- Response: `{ success: true }`

**POST `/api/config/business-rules/:id/approve`**
- Approves pending rule (Super Admin only)
- Response: `{ success: true, rule: BusinessRule }`

**POST `/api/config/business-rules/:id/reject`**
- Rejects pending rule (Super Admin only)
- Body: `{ reason: string }`
- Response: `{ success: true }`

### Impact Analysis

**POST `/api/config/business-rules/:id/impact`**
- Pre-update impact analysis
- Body: `Partial<BusinessRule>` (proposed changes)
- Response: `{ success: true, impactAnalysis: ImpactAnalysis, requiresApproval: boolean }`
- **Use this endpoint to check impact before updating**

---

## Key Concepts

### 1. Rule Lifecycle

```
Draft → Pending Approval → Approved/Rejected → Active/Inactive
```

- **Draft**: Rule created but not submitted
- **Pending**: Rule submitted, awaiting Super Admin approval
- **Approved**: Rule can be activated
- **Rejected**: Rule cannot be used
- **Active**: Rule is currently evaluating requests
- **Inactive**: Rule exists but doesn't evaluate

### 2. Edition Differences

**Standard Edition:**
- Rules return **actions** (enforced)
- `block` actually blocks requests
- `flag` flags but allows to proceed
- Simpler, more restrictive

**Pro Edition:**
- Rules return **recommendations** (not enforced)
- `recommend_reject` suggests rejection (Compliance decides)
- `recommend_approve` suggests approval (Compliance decides)
- More flexible, compliance team makes final decisions

### 3. Conflict Rules - Special Handling

**Critical Rules:**
- Conflict rules detect prohibited service combinations
- **MUST** use blocking/rejecting actions
- **MUST NOT** use `recommend_approve` (would allow conflicts)
- Impact analysis flags conflict rules with inappropriate actions as **CRITICAL**

**Example Misconfiguration:**
```javascript
{
  rule_type: 'conflict',
  condition_field: 'service_type',
  condition_value: 'Audit,Tax',
  action_type: 'recommend_approve'  // ❌ WRONG - allows conflicts!
}
```

**Correct Configuration:**
```javascript
{
  rule_type: 'conflict',
  condition_field: 'service_type',
  condition_value: 'Audit,Tax',
  action_type: 'block'  // ✅ CORRECT - blocks conflicts
}
```

### 4. Impact Analysis Timing

**Real-time (UI):**
- Runs as user edits rule in Rule Builder
- Debounced (500ms delay)
- Shows impact panel with risk level
- Updates as user changes fields

**Pre-save:**
- Runs when user clicks "Update Rule"
- If high risk, blocks save and shows warning
- User must acknowledge impact to proceed

**Post-save:**
- Impact analysis result stored in audit trail
- Used for compliance reporting

### 5. Rule Matching Algorithm

```javascript
function evaluateRuleMatch(rule, requestData) {
  // 1. If no condition, rule always matches (catch-all)
  if (!rule.condition_field) return true
  
  // 2. Get field value from request
  const fieldValue = getFieldValue(requestData, rule.condition_field)
  if (fieldValue === undefined || fieldValue === null) return false
  
  // 3. Evaluate condition
  return evaluateCondition(fieldValue, rule.condition_operator, rule.condition_value)
}
```

**Field Value Resolution:**
- Direct property: `requestData.service_type`
- Nested property: `requestData.client.name` (dot notation)
- Custom fields: `requestData.custom_fields.field_name`

---

## Examples

### Example 1: Creating a Conflict Rule

**Request:**
```http
POST /api/config/business-rules
Content-Type: application/json

{
  "rule_name": "Audit + Advisory Conflict",
  "rule_type": "conflict",
  "condition_field": "service_type",
  "condition_operator": "contains",
  "condition_value": "Audit,Advisory",
  "action_type": "block",
  "action_value": "Audit and Advisory services cannot be provided to the same client",
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "rule": {
    "id": 1,
    "rule_name": "Audit + Advisory Conflict",
    "rule_type": "conflict",
    "approval_status": "Pending",
    ...
  }
}
```

### Example 2: Impact Analysis for Rule Change

**Request:**
```http
POST /api/config/business-rules/2/impact
Content-Type: application/json

{
  "action_type": "recommend_approve"
}
```

**Response:**
```json
{
  "success": true,
  "impactAnalysis": {
    "ruleId": 2,
    "ruleName": "Audit + Tax Compliance Review",
    "ruleType": "conflict",
    "changeType": "action_changed",
    "affectedRequests": {
      "currentlyMatching": 0,
      "wouldMatch": 0,
      "wouldStopMatching": 0,
      "wouldStartMatching": 0,
      "requestIds": []
    },
    "historicalExecutions": {
      "totalExecutions": 0,
      "uniqueRequests": 0
    },
    "pendingReviewsAffected": 0,
    "riskLevel": "critical",
    "warnings": [
      "CRITICAL: Conflict rules must block or recommend rejection, not approval",
      "WARNING: Conflict rule is configured with a non-blocking action - this may allow prohibited conflicts"
    ],
    "requiresApproval": true,
    "actionTypeChange": {
      "from": "block",
      "to": "recommend_approve"
    }
  },
  "requiresApproval": true
}
```

### Example 3: Updating Rule with High Impact

**Request:**
```http
PUT /api/config/business-rules/2
Content-Type: application/json

{
  "action_type": "recommend_approve",
  "acknowledgeImpact": true,
  "forceUpdate": true
}
```

**Response (if acknowledged):**
```json
{
  "success": true,
  "message": "Rule updated",
  "rule": { ... },
  "impactAnalysis": { ... },
  "requiresApproval": true
}
```

**Response (if not acknowledged):**
```json
{
  "error": "High impact change requires explicit acknowledgment",
  "requiresApproval": true,
  "impactAnalysis": { ... }
}
```

### Example 4: Rule Matching Scenario

**Rule:**
```javascript
{
  rule_type: "conflict",
  condition_field: "service_type",
  condition_operator: "contains",
  condition_value: "Audit,Tax",
  action_type: "block"
}
```

**Request 1:**
```javascript
{
  service_type: "External Audit, Tax Compliance"
}
```
**Result:** ✅ MATCHES (contains both "Audit" and "Tax") → BLOCKED

**Request 2:**
```javascript
{
  service_type: "External Audit"
}
```
**Result:** ❌ NO MATCH (doesn't contain "Tax") → NOT BLOCKED

**Request 3:**
```javascript
{
  service_type: "Tax Advisory, Management Consulting"
}
```
**Result:** ✅ MATCHES (contains "Tax") → BLOCKED

---

## Best Practices

### Rule Design

1. **Be Specific**: Use precise condition values
2. **Test Conditions**: Verify rule matches expected requests
3. **Document Purpose**: Clear rule names and descriptions
4. **Avoid Overlap**: Don't create redundant rules
5. **Review Regularly**: Audit rules for relevance

### Impact Analysis

1. **Always Check Impact**: Use impact analysis before saving
2. **Review Warnings**: Pay attention to risk level and warnings
3. **Acknowledge High Risk**: Don't bypass approval requirements
4. **Test Changes**: Verify impact analysis accuracy
5. **Monitor After Change**: Check if change had expected effect

### Conflict Rules

1. **Never Use Approve**: Conflict rules must block or reject
2. **Clear Messages**: Action value should explain why blocked
3. **Regular Review**: Ensure conflict rules are still relevant
4. **Document Regulations**: Reference IESBA/regulatory requirements

---

## Troubleshooting

### Rule Not Matching Expected Requests

**Check:**
1. Rule is `is_active = true`
2. Rule has `approval_status = 'Approved'`
3. Condition field exists in request data
4. Condition operator logic (case-insensitive, contains vs equals)
5. Condition value format (comma-separated for 'in' operator)

### Impact Analysis Shows Low Risk But Should Be High

**Check:**
1. Historical execution data exists in `rule_execution_log`
2. Pending reviews have rule ID in `duplication_matches` JSON
3. Currently matching requests are being found correctly
4. Rule type and action type are being evaluated correctly

### Conflict Rule Allowing Conflicts

**Check:**
1. Action type is not `recommend_approve` or `set_status`
2. Rule is actually active and approved
3. Condition is matching correctly
4. No other rules are overriding this rule

---

## Future Enhancements

1. **Risk Matrix Implementation**: Replace additive scoring with Likelihood × Impact matrix
2. **Configurable Thresholds**: Allow admins to adjust risk level boundaries
3. **Rule Interdependency Analysis**: Detect and warn about related rules
4. **Time-based Weighting**: Recent executions weighted higher than historical
5. **Rollback Assessment**: Evaluate how difficult it would be to undo changes
6. **Business Impact Dimensions**: Separate regulatory, operational, and data integrity impacts

---

## Related Files

- `backend/src/services/businessRulesEngine.js` - Rule evaluation engine
- `backend/src/services/impactAnalysisService.js` - Impact analysis logic
- `backend/src/controllers/configController.js` - Rule management API
- `backend/src/routes/config.routes.js` - API routes
- `frontend/src/components/RuleBuilder.vue` - Rule management UI
- `database/schema.sql` - Database schema definitions

---

## Version History

- **v1.0** (Current): Additive risk scoring, basic impact analysis
- **v2.0** (Planned): Risk matrix, configurable thresholds, enhanced analysis

---

**Last Updated:** 2026-01-07  
**Maintained By:** COI System Development Team

