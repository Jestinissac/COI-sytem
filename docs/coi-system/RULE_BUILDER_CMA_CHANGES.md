# Rule Builder Changes for CMA Integration

## Overview

The Rule Builder (`RuleBuilder.vue`) needs updates to support CMA (Capital Markets Authority) rules and CMA-regulated clients. This document outlines the specific changes required.

**Date**: January 26, 2026  
**Phase**: 1.1 CMA Foundation - Rule Builder Integration

---

## Current Rule Builder State

### Existing Features
- ✅ Rule categories: Custom, IESBA, Red Line, PIE, Tax (Pro only)
- ✅ Regulation references: IESBA sections, EU Audit Regulation
- ✅ Condition fields: service_type, client_type, pie_status, etc.
- ✅ PIE-specific rules: `applies_to_pie` checkbox
- ✅ Tax sub-types: Support for tax service sub-categories

### Current Rule Categories (Pro Edition)
```javascript
// Line 389-397 in RuleBuilder.vue
<option value="Custom">Custom</option>
<option value="IESBA">IESBA</option>
<option value="Red Line">Red Line</option>
<option value="PIE">PIE</option>
<option value="Tax">Tax</option>
```

### Current Regulation References
```javascript
// Line 405-412 in RuleBuilder.vue
<option value="IESBA Code Section 290">IESBA Code Section 290 (General)</option>
<option value="IESBA Code Section 290.104">IESBA Code Section 290.104 (Management Responsibility)</option>
<option value="IESBA Code Section 290.105">IESBA Code Section 290.105 (Advocacy)</option>
<option value="IESBA Code Section 290.106">IESBA Code Section 290.106 (Contingent Fees)</option>
<option value="EU Audit Regulation">EU Audit Regulation</option>
<option value="EU Audit Regulation Article 4(2)">EU Audit Regulation Article 4(2) (Fee Cap)</option>
```

---

## Required Changes

### 1. Add "CMA" Rule Category ✅

**Location**: `RuleBuilder.vue` line 389-397

**Change**: Add CMA option to rule category dropdown

```vue
<select v-model="ruleForm.rule_category">
  <option value="Custom">Custom</option>
  <option value="IESBA">IESBA</option>
  <option value="Red Line">Red Line</option>
  <option value="PIE">PIE</option>
  <option value="Tax">Tax</option>
  <option value="CMA">CMA (Kuwait)</option> <!-- NEW -->
</select>
```

**Also Update**:
- Filter dropdown (line 46-57): Add CMA option
- Category order in `groupedRules` computed (line 1109): Add 'CMA' to categoryOrder

---

### 2. Add CMA Regulation References ✅

**Location**: `RuleBuilder.vue` line 405-412

**Change**: Add CMA regulation options to regulation reference dropdown

```vue
<select v-model="ruleForm.regulation_reference">
  <option value="">Select regulation...</option>
  <!-- IESBA Options (existing) -->
  <option value="IESBA Code Section 290">IESBA Code Section 290 (General)</option>
  <!-- ... existing IESBA options ... -->
  
  <!-- CMA Options (NEW) -->
  <optgroup label="CMA (Kuwait)">
    <option value="CMA Law No. 7 of 2010">CMA Law No. 7 of 2010</option>
    <option value="CMA Module Nine">CMA Module Nine (Mergers and Acquisitions)</option>
    <option value="CMA Module Fifteen">CMA Module Fifteen (Corporate Governance)</option>
    <option value="CMA Module Sixteen">CMA Module Sixteen (AML/CFT)</option>
    <option value="CMA Module Seventeen">CMA Module Seventeen (Capital Adequacy)</option>
  </optgroup>
</select>
```

---

### 3. Add CMA Client Condition Fields ✅

**Location**: `RuleBuilder.vue` - Condition field options

**Change**: Add condition fields for CMA-regulated clients

**Backend API Update Needed**: `/config/rule-fields` endpoint should return:

```javascript
{
  id: 'is_cma_regulated',
  label: 'CMA Regulated',
  type: 'boolean',
  description: 'Client is regulated by Capital Markets Authority (Kuwait)'
},
{
  id: 'regulated_body',
  label: 'Regulated Body',
  type: 'select',
  options: ['CMA', 'Central Bank', 'Ministry of Commerce', 'Other'],
  description: 'Regulatory body that oversees the client'
}
```

**Frontend Update**: These fields will automatically appear in condition builder if backend returns them.

---

### 4. Add CMA Service Types to Condition Options ✅

**Location**: Backend `/config/rule-fields` endpoint

**Change**: Add CMA service types to `service_type` field options

**New Service Types to Add**:
- Review the Internal Control Systems (Article 6-9, Module 15)
- Review, evaluate the performance of the internal audit management/firm/unit (Article 6-9, Module 15)
- Assessment on the level of compliance with AML/CFT Law (Article 7-7, Module 16)
- Investment Advisor (Articles 2-9, 3-1-5, 4-1-8, 5-9, Module 9)
- Valuation of the assets (Articles 2-10, 5-10, Module 9)
- Review the capital adequacy report (Article 2-3, Module 17)

**Implementation**: These should be fetched from `cma_service_types` table or added to service catalog.

---

### 5. Add CMA Rules View (Read-Only) ✅

**Location**: `RuleBuilder.vue` - New section or tab

**Change**: Display CMA Matrix rules (read-only) for reference

**New Component/Section**:
```vue
<!-- CMA Rules Reference Section -->
<div v-if="isPro" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <div class="flex items-center justify-between mb-4">
    <div>
      <h3 class="text-lg font-semibold text-gray-900">CMA Matrix Rules (Reference)</h3>
      <p class="text-sm text-gray-500 mt-1">36 regulatory combinations from CMA Law No. 7 of 2010</p>
    </div>
    <span class="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
      Read-Only
    </span>
  </div>
  
  <!-- CMA Rules Table/List -->
  <CMARulesReference />
</div>
```

**New Component**: `CMARulesReference.vue` - Displays all 36 CMA rules in a table

---

### 6. Update Category Filter ✅

**Location**: `RuleBuilder.vue` line 46-57

**Change**: Add CMA to filter dropdown

```vue
<select v-model="filterCategory">
  <option value="">All Categories</option>
  <option value="Custom">Custom</option>
  <template v-if="isPro">
    <option value="IESBA">IESBA</option>
    <option value="Red Line">Red Line</option>
    <option value="PIE">PIE</option>
    <option value="Tax">Tax</option>
    <option value="CMA">CMA</option> <!-- NEW -->
  </template>
</select>
```

---

### 7. Update Category Ordering ✅

**Location**: `RuleBuilder.vue` line 1108-1110

**Change**: Add CMA to category order

```javascript
const categoryOrder = isPro.value 
  ? ['Red Line', 'IESBA', 'CMA', 'PIE', 'Tax', 'Custom'] // Added CMA
  : ['Custom']
```

---

### 8. Add CMA-Specific Rule Templates (Pro) ✅

**Location**: `RuleBuilder.vue` - Rule templates section

**Change**: Add CMA rule templates for quick creation

**New Templates**:
```javascript
{
  name: 'CMA: Block Investment Advisor + Audit',
  category: 'CMA',
  condition: {
    field: 'service_type',
    operator: 'contains',
    value: 'Investment Advisor'
  },
  action: {
    type: 'block',
    value: 'CMA: Investment Advisor prohibited with Audit per Module Nine'
  },
  regulation_reference: 'CMA Module Nine, Articles 2-9, 3-1-5, 4-1-8, 5-9',
  applies_to_cma: true
}
```

---

### 9. Add "Applies to CMA" Checkbox ✅

**Location**: `RuleBuilder.vue` - Pro fields section (similar to `applies_to_pie`)

**Change**: Add checkbox to mark rules as CMA-specific

```vue
<!-- Pro Version: CMA-Specific Rules -->
<div v-if="isPro" class="flex items-center gap-2">
  <input
    type="checkbox"
    id="applies_to_cma"
    v-model="ruleForm.applies_to_cma"
    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
  />
  <label for="applies_to_cma" class="text-sm font-medium text-gray-700">
    Applies to CMA-Regulated Clients Only
  </label>
</div>
```

**Backend Update**: Add `applies_to_cma` column to `business_rules_config` table (if not exists)

---

### 10. Update Rule Evaluation Logic ✅

**Location**: `businessRulesEngine.js`

**Change**: Check `applies_to_cma` flag before evaluating rule

```javascript
// In evaluateRule() function
function evaluateRule(rule, requestData) {
  // Check if rule applies to CMA clients only
  if (rule.applies_to_cma) {
    const clientData = getClientData(requestData.client_id)
    if (!isCMARegulated(clientData)) {
      return null // Rule doesn't apply to non-CMA clients
    }
  }
  
  // ... rest of rule evaluation
}
```

---

## Implementation Checklist

### Frontend Changes
- [ ] Add "CMA" option to rule category dropdown
- [ ] Add CMA regulation references to dropdown
- [ ] Add CMA to category filter
- [ ] Update category ordering to include CMA
- [ ] Add "Applies to CMA" checkbox (Pro)
- [ ] Create `CMARulesReference.vue` component (read-only view)
- [ ] Add CMA rule templates (Pro)

### Backend Changes
- [ ] Add `applies_to_cma` column to `business_rules_config` table
- [ ] Update `/config/rule-fields` endpoint to include:
  - `is_cma_regulated` field
  - `regulated_body` field
  - CMA service types in `service_type` options
- [ ] Update `businessRulesEngine.js` to check `applies_to_cma` flag
- [ ] Create `/api/cma/rules` endpoint to fetch CMA rules (read-only)

### Database Changes
- [ ] Migration: Add `applies_to_cma BOOLEAN DEFAULT 0` to `business_rules_config`

---

## Example: Creating a CMA-Specific Rule

### Use Case
Create a rule that flags requests for CMA-regulated clients when service fee exceeds threshold.

### Rule Configuration
```javascript
{
  rule_name: 'CMA: High Service Fee Review',
  rule_type: 'validation',
  rule_category: 'CMA',
  condition_field: 'service_fee',
  condition_operator: 'greater_than',
  condition_value: '100000',
  action_type: 'flag',
  action_value: 'CMA: Service fee exceeds threshold - requires additional review',
  regulation_reference: 'CMA Law No. 7 of 2010',
  applies_to_cma: true, // NEW FIELD
  applies_to_pie: false,
  is_active: 1
}
```

### Condition Logic
```
IF client.is_cma_regulated = true 
AND service_fee > 100000
THEN flag for review
```

---

## Example: CMA Service Combination Rule

### Use Case
Create a custom rule that blocks Internal Audit + Risk Management if not using independent teams.

### Rule Configuration
```javascript
{
  rule_name: 'CMA: Internal Audit + Risk Management - Independent Teams Required',
  rule_type: 'conflict',
  rule_category: 'CMA',
  condition_field: 'service_type',
  condition_operator: 'contains',
  condition_value: 'Internal Audit,Risk Management',
  action_type: 'block',
  action_value: 'CMA: Internal Audit + Risk Management requires independent teams per CMA Matrix',
  regulation_reference: 'CMA Law No. 7 of 2010',
  applies_to_cma: true,
  guidance_text: 'Both services must be assigned to two independent teams',
  can_override: false
}
```

---

## Key Differences: CMA Rules vs Business Rules

| Aspect | CMA Rules (Database) | Business Rules (Rule Builder) |
|--------|---------------------|------------------------------|
| **Source** | CMA Matrix (36 fixed combinations) | User-created custom rules |
| **Storage** | `cma_combination_rules` table | `business_rules_config` table |
| **Editable** | ❌ No (regulatory requirements) | ✅ Yes (admin-created) |
| **Scope** | Service combinations only | Any condition/action |
| **Priority** | Priority 0 (highest) | Priority 4 (lowest) |
| **Display** | Read-only reference view | Editable in Rule Builder |

---

## Integration Points

### 1. Rule Builder UI
- Shows CMA category rules
- Allows creating CMA-specific custom rules
- Displays CMA Matrix rules as reference (read-only)

### 2. Conflict Detection
- CMA rules checked first (via `cmaConflictMatrix.js`)
- Business rules checked after (via `businessRulesEngine.js`)
- CMA-specific business rules only apply to CMA clients

### 3. Rule Evaluation Order
```
1. CMA Matrix Rules (cmaConflictMatrix.js) - Priority 0
2. Red Lines (redLinesService.js) - Priority 1
3. IESBA Decision Matrix (iesbaDecisionMatrix.js) - Priority 2
4. Business Rules (businessRulesEngine.js) - Priority 4
   - Includes CMA-specific business rules (if applies_to_cma = true)
```

---

## Files to Modify

### Frontend
1. `coi-prototype/frontend/src/components/RuleBuilder.vue`
   - Add CMA category option
   - Add CMA regulation references
   - Add "Applies to CMA" checkbox
   - Update category filter and ordering
   - Add CMA rules reference section

2. `coi-prototype/frontend/src/components/CMARulesReference.vue` (NEW)
   - Display 36 CMA rules in table format
   - Read-only view with legal references
   - Filter/search capabilities

### Backend
1. `coi-prototype/backend/src/controllers/configController.js`
   - Update `/config/rule-fields` endpoint to include CMA fields
   - Add `applies_to_cma` to rule save/update

2. `coi-prototype/backend/src/services/businessRulesEngine.js`
   - Check `applies_to_cma` flag before evaluating rule
   - Import `isCMARegulated` from `cmaConflictMatrix.js`

3. `coi-prototype/backend/src/routes/config.routes.js`
   - Add `/api/cma/rules` endpoint (read-only, returns CMA Matrix rules)

### Database
1. `coi-prototype/database/migrations/20260126_cma_rules.sql` (already created)
2. New migration: Add `applies_to_cma` column to `business_rules_config`

---

## Testing Checklist

- [ ] CMA category appears in dropdown (Pro only)
- [ ] CMA regulation references available
- [ ] "Applies to CMA" checkbox works
- [ ] CMA-specific rules only apply to CMA clients
- [ ] CMA rules reference view displays all 36 rules
- [ ] Category filter includes CMA
- [ ] Rules grouped correctly by category
- [ ] Backend validates `applies_to_cma` field

---

## Summary

The Rule Builder needs these changes to support CMA:

1. **UI Updates**: Add CMA category, regulation references, and "Applies to CMA" checkbox
2. **Backend Updates**: Add `applies_to_cma` field and update rule evaluation
3. **New Component**: CMA Rules Reference view (read-only)
4. **Database**: Add `applies_to_cma` column to `business_rules_config`

**Note**: CMA Matrix rules (36 combinations) remain in `cma_combination_rules` table and are NOT editable through Rule Builder. They are regulatory requirements. Rule Builder allows creating additional CMA-specific custom rules that complement the fixed CMA Matrix rules.
