# Rule Change Impact Analysis - Current State & Gap Analysis

## Current Implementation Status

### ✅ **Field Changes - HAS Impact Analysis**

When form fields are changed, the system performs comprehensive impact analysis via `impactAnalysisService.js`:

**What is analyzed:**
1. **Affected Requests**: Counts requests using the field
2. **Workflow Dependencies**: Checks if field is used in workflow conditions
3. **Business Rule Dependencies**: Identifies rules that reference the field
4. **Field Dependencies**: Finds fields that conditionally depend on this field
5. **Template Dependencies**: Checks if field is in active templates

**Risk Assessment:**
- Low: No dependencies
- Medium: < 50 requests affected
- High: > 50 requests OR used in workflows/rules
- Critical: Used in workflows AND rules

**Location:** `backend/src/services/impactAnalysisService.js`
- Function: `analyzeFieldChange(fieldId, changeType)`
- Used in: `configController.js` when saving/updating/removing form fields

---

### ❌ **Rule Changes - NO Impact Analysis**

When business rules are changed, **NO impact analysis is performed**.

**Current Behavior:**
- `updateBusinessRule()` in `configController.js` directly updates the rule
- Only checks if re-approval is needed (if non-Super Admin updates approved rule)
- **Does NOT check:**
  - Which requests would be affected by the rule change
  - How many requests currently match this rule
  - Whether changing the condition would cause requests to no longer match
  - Whether changing the action would affect pending compliance reviews
  - Historical rule execution impact

**Location:** `backend/src/controllers/configController.js`
- Function: `updateBusinessRule(req, res)` (lines 452-514)
- **Missing:** Impact analysis before rule update

---

## What's Missing for Rule Change Impact Analysis

### 1. **Affected Requests Analysis**
- Find all requests that currently match the rule (before change)
- Find all requests that would match the rule (after change)
- Identify requests that would:
  - Stop matching (rule condition changed)
  - Start matching (rule condition changed)
  - Change recommendation/action (action type changed)

### 2. **Rule Execution History**
- Check `rule_execution_log` table for historical matches
- Analyze how many times rule has been executed
- Identify requests that were previously affected by this rule

### 3. **Pending Compliance Reviews**
- Check if any pending compliance reviews have recommendations from this rule
- Warn if changing rule would invalidate existing compliance decisions
- Flag if rule change affects requests in "Pending Compliance" status

### 4. **Risk Assessment**
- Low: Rule has never been executed, no pending reviews
- Medium: Rule executed < 10 times, < 5 pending reviews
- High: Rule executed > 10 times, > 5 pending reviews
- Critical: Rule affects requests in "Pending Compliance" or "Pending Partner" status

### 5. **Change Type Analysis**
- **Condition Change**: Affects which requests match
- **Action Type Change**: Affects what happens when rule matches (block → flag, etc.)
- **Action Value Change**: Affects the message/guidance shown
- **Rule Deactivation**: Stops rule from matching future requests

---

## Proposed Solution

### New Function: `analyzeRuleChange(ruleId, proposedChanges)`

**Location:** `backend/src/services/impactAnalysisService.js`

**What it should do:**

1. **Get Current Rule State**
   ```javascript
   const currentRule = db.prepare('SELECT * FROM business_rules_config WHERE id = ?').get(ruleId)
   ```

2. **Get Historical Rule Executions**
   ```javascript
   const executions = db.prepare(`
     SELECT COUNT(*) as count, 
            COUNT(DISTINCT coi_request_id) as unique_requests
     FROM rule_execution_log 
     WHERE rule_id = ?
   `).get(ruleId)
   ```

3. **Find Currently Matching Requests**
   - Evaluate current rule against all active/pending requests
   - Store list of matching request IDs

4. **Simulate Proposed Changes**
   - Create temporary rule with proposed changes
   - Evaluate new rule against same requests
   - Compare: which requests would match differently

5. **Check Pending Compliance Reviews**
   ```javascript
   const pendingWithRule = db.prepare(`
     SELECT id, request_id, status, duplication_matches
     FROM coi_requests
     WHERE status IN ('Pending Compliance', 'Pending Partner')
     AND duplication_matches LIKE '%"ruleId":' || ? || '%'
   `).all(ruleId)
   ```

6. **Generate Impact Report**
   ```javascript
   return {
     ruleId,
     changeType: determineChangeType(currentRule, proposedChanges),
     affectedRequests: {
       currentlyMatching: currentMatches.length,
       wouldMatch: newMatches.length,
       wouldStopMatching: stoppedMatching.length,
       wouldStartMatching: startedMatching.length
     },
     historicalExecutions: executions.count,
     pendingReviewsAffected: pendingWithRule.length,
     riskLevel: calculateRiskLevel(...),
     warnings: generateWarnings(...),
     requiresApproval: riskLevel === 'high' || riskLevel === 'critical'
   }
   ```

### Integration Point

**Update `updateBusinessRule()` in `configController.js`:**

```javascript
export async function updateBusinessRule(req, res) {
  try {
    const { id } = req.params
    const updates = req.body
    
    // NEW: Perform impact analysis BEFORE updating
    const impactAnalysis = await analyzeRuleChange(id, updates)
    
    // If high/critical risk, require explicit approval
    if (impactAnalysis.requiresApproval && !req.body.forceUpdate) {
      return res.status(200).json({
        requiresApproval: true,
        impactAnalysis,
        message: 'Rule change requires approval due to high impact'
      })
    }
    
    // Continue with existing update logic...
    // ...
  }
}
```

---

## Implementation Priority

### Phase 1: Basic Impact Analysis (High Priority)
- ✅ Count historical rule executions
- ✅ Find requests that currently match the rule
- ✅ Check pending compliance reviews
- ✅ Basic risk assessment

### Phase 2: Advanced Analysis (Medium Priority)
- ✅ Simulate rule changes to find new matches
- ✅ Compare before/after matching requests
- ✅ Detailed change type analysis
- ✅ Warning generation

### Phase 3: UI Integration (Medium Priority)
- ✅ Show impact analysis in Rule Builder UI
- ✅ Require confirmation for high-risk changes
- ✅ Display affected requests list
- ✅ Show pending reviews that would be affected

---

## Database Tables Available

1. **`rule_execution_log`**: Tracks when rules are executed
   - `rule_id`, `coi_request_id`, `condition_matched`, `action_taken`

2. **`coi_requests`**: All COI requests
   - `id`, `request_id`, `status`, `duplication_matches` (contains rule recommendations)

3. **`business_rules_config`**: Current rule definitions
   - All rule fields needed for comparison

---

## Example Impact Analysis Output

```json
{
  "ruleId": 1,
  "ruleName": "Audit + Advisory Conflict",
  "changeType": "condition_changed",
  "affectedRequests": {
    "currentlyMatching": 12,
    "wouldMatch": 8,
    "wouldStopMatching": 4,
    "wouldStartMatching": 0
  },
  "historicalExecutions": 45,
  "pendingReviewsAffected": 3,
  "riskLevel": "high",
  "warnings": [
    "4 requests would no longer match this rule",
    "3 pending compliance reviews reference this rule",
    "Rule has been executed 45 times historically"
  ],
  "requiresApproval": true
}
```

---

## Next Steps

1. **Create `analyzeRuleChange()` function** in `impactAnalysisService.js`
2. **Integrate into `updateBusinessRule()`** controller
3. **Add API endpoint** for pre-update impact analysis
4. **Update Rule Builder UI** to show impact before saving
5. **Add approval workflow** for high-risk rule changes

