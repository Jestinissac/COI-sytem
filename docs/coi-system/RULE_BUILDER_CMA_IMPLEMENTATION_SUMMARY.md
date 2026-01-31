# Rule Builder CMA Changes - Implementation Summary

## Quick Answer: What Changed?

**The Rule Builder now needs to support CMA (Kuwait Capital Markets Authority) rules and CMA-regulated clients.**

---

## Key Changes Required

### 1. **Add "CMA" Rule Category** (UI Change)
- Add "CMA" option to rule category dropdown
- Add CMA to category filter
- Update category ordering

### 2. **Add CMA Regulation References** (UI Change)
- Add CMA Law No. 7 of 2010
- Add CMA Module references (9, 15, 16, 17)

### 3. **Add "Applies to CMA" Checkbox** (UI + Backend)
- Similar to existing "Applies to PIE" checkbox
- New field: `applies_to_cma` in `business_rules_config` table

### 4. **Add CMA Client Condition Fields** (Backend)
- `is_cma_regulated` - Boolean field (already partially supported via `regulated_body`)
- Update `/config/rule-fields` endpoint

### 5. **Add CMA Service Types** (Backend)
- Add CMA-specific services to `service_type` field options
- Fetch from `cma_service_types` table

### 6. **CMA Rules Reference View** (New Component)
- Read-only view of 36 CMA Matrix rules
- For reference only (not editable)

---

## Current State vs Required State

### Current Rule Categories
```
✅ Custom
✅ IESBA (Pro)
✅ Red Line (Pro)
✅ PIE (Pro)
✅ Tax (Pro)
❌ CMA - MISSING
```

### Current Regulation References
```
✅ IESBA Code Section 290
✅ EU Audit Regulation
❌ CMA Law No. 7 of 2010 - MISSING
❌ CMA Modules - MISSING
```

### Current Condition Fields
```
✅ regulated_body (has 'CMA' option)
❌ is_cma_regulated (boolean) - MISSING
✅ service_type (but missing CMA services)
```

### Current Rule Fields
```
✅ applies_to_pie
❌ applies_to_cma - MISSING
```

---

## Implementation Priority

### Phase 1: Essential (Immediate)
1. ✅ Add CMA category to dropdown
2. ✅ Add CMA regulation references
3. ✅ Add "Applies to CMA" checkbox
4. ✅ Add `applies_to_cma` column to database

### Phase 2: Enhanced (Next)
5. ✅ Add `is_cma_regulated` condition field
6. ✅ Add CMA service types to service_type options
7. ✅ Update rule evaluation to check `applies_to_cma`

### Phase 3: Reference (Future)
8. ✅ Create CMA Rules Reference component (read-only)

---

## Code Changes Summary

### Frontend (`RuleBuilder.vue`)
- **Line 392-397**: Add `<option value="CMA">CMA (Kuwait)</option>`
- **Line 405-412**: Add CMA regulation options
- **Line 417-430**: Add "Applies to CMA" checkbox (similar to PIE)
- **Line 46-57**: Add CMA to filter dropdown
- **Line 1109**: Add 'CMA' to categoryOrder array

### Backend (`configController.js`)
- **Line 1494**: `regulated_body` already has 'CMA' option ✅
- **Line 1518**: Add `is_cma_regulated` field to complianceFields
- **Line 1505**: Add CMA service types to `service_type` options
- **Line 878**: Add `applies_to_cma` to INSERT statement
- **Line 895**: Add `applies_to_cma` handling

### Database
- **Migration**: Add `applies_to_cma BOOLEAN DEFAULT 0` to `business_rules_config`

### Backend (`businessRulesEngine.js`)
- **Import**: `import { isCMARegulated } from './cmaConflictMatrix.js'`
- **Update**: Check `applies_to_cma` flag before evaluating rule

---

## Example: What a CMA Rule Looks Like

### Rule Created in Rule Builder
```javascript
{
  rule_name: 'CMA: High Value Service Review',
  rule_type: 'validation',
  rule_category: 'CMA', // NEW
  condition_field: 'total_fees',
  condition_operator: 'greater_than',
  condition_value: '500000',
  action_type: 'flag',
  action_value: 'CMA: High value service requires additional compliance review',
  regulation_reference: 'CMA Law No. 7 of 2010', // NEW
  applies_to_cma: true, // NEW
  applies_to_pie: false,
  is_active: 1
}
```

### How It Works
1. User creates rule in Rule Builder
2. Checks "Applies to CMA" checkbox
3. Rule is saved with `applies_to_cma = true`
4. When evaluating requests:
   - Check if client is CMA-regulated
   - If yes AND `applies_to_cma = true`, evaluate rule
   - If no OR `applies_to_cma = false`, skip rule

---

## Important Distinction

### CMA Matrix Rules (36 Fixed Rules)
- **Location**: `cma_combination_rules` table
- **Editable**: ❌ No (regulatory requirements)
- **Managed By**: Database seed scripts
- **Display**: Read-only reference view

### CMA Business Rules (Custom Rules)
- **Location**: `business_rules_config` table
- **Editable**: ✅ Yes (admin-created)
- **Managed By**: Rule Builder UI
- **Display**: Editable in Rule Builder

**Rule Builder allows creating CMA-specific custom rules that complement (not replace) the fixed CMA Matrix rules.**

---

## Files to Modify

### Must Modify
1. `frontend/src/components/RuleBuilder.vue` - UI changes
2. `backend/src/controllers/configController.js` - Add CMA fields and `applies_to_cma`
3. `backend/src/services/businessRulesEngine.js` - Check `applies_to_cma` flag
4. `database/migrations/` - Add `applies_to_cma` column

### Optional (Phase 3)
5. `frontend/src/components/CMARulesReference.vue` - New component (read-only CMA rules view)

---

## Testing Checklist

- [ ] CMA category appears in dropdown (Pro only)
- [ ] CMA regulation references available
- [ ] "Applies to CMA" checkbox saves correctly
- [ ] CMA-specific rules only apply to CMA clients
- [ ] Category filter includes CMA
- [ ] Rules grouped correctly by CMA category
- [ ] Backend validates `applies_to_cma` field

---

**Status**: Ready for implementation  
**Estimated Effort**: 2-3 hours  
**Priority**: Medium (complements Phase 1.1 CMA Foundation)
