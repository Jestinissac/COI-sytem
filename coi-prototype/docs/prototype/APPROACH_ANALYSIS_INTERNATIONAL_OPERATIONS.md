# Approach Analysis: International Operations + Prospects + Parent Companies

## Current Implementation Analysis

### ✅ What Works (Main Form)

**For Prospects with Parent Companies:**
- `coi_requests.parent_company` (TEXT) - Free text field ✅
- `coi_requests.parent_company_id` (INTEGER) - Structured link if parent exists in clients table ✅
- `checkGroupConflicts()` checks `parent_company` field using:
  1. Structured `parent_company_id` (if parent is existing client)
  2. Text matching with Levenshtein (if parent is external or name variation) ✅
- Works for prospects because it searches `coi_requests` table, not `clients` table ✅

**Why Free Text + Levenshtein:**
- Prospects don't have `client_id` (not in PRMS yet) ✅
- Parent company might be external (not a BDO client) ✅
- Name variations: "Google Inc" vs "Google LLC" ✅
- Levenshtein catches variations (85% similarity threshold) ✅

### ❌ What's Missing (International Operations)

**Gap Identified:**
- International Operations entities are stored in `global_coi_form_data` (JSON) or `countries[].entities[]`
- These entities are **NOT checked for conflicts** during submission
- `checkGroupConflicts()` only checks `coi_requests.parent_company` (main form field)

**Example Scenario:**
```
Prospect Request:
- Client: "ABC Manufacturing" (Kuwait) - prospect, not in PRMS
- Parent Company: "ABC Holdings" (Kuwait) - checked ✅

International Operations:
- Country: UAE
- Entity: "ABC UAE Subsidiary" (subsidiary)
- Entity Parent: "XYZ Holdings" (UAE)

Existing BDO Client:
- "XYZ Holdings" (UAE) - Statutory Audit (Active)

Current System:
- ✅ Detects conflict: "ABC Manufacturing" parent = "ABC Holdings" (if exists)
- ❌ MISSES conflict: "ABC UAE Subsidiary" parent = "XYZ Holdings" (existing client)
```

**IESBA 290.13 Requirement:**
- If we audit "XYZ Holdings", we CANNOT provide certain services to its subsidiaries
- "ABC UAE Subsidiary" is a subsidiary of "XYZ Holdings"
- This conflict MUST be detected

## Is Adding Ownership Percentage the Right Approach?

### ✅ YES - For Industry Standards

**Adding ownership_percentage and control_type:**
- ✅ Aligns with industry standards (IESBA 290.13)
- ✅ Enables proper classification (Subsidiary ≥50% vs Affiliate 20-50%)
- ✅ Improves data quality and validation
- ✅ Supports future conflict detection enhancements

### ⚠️ BUT - Missing Conflict Detection

**Critical Gap:**
- Ownership percentage alone doesn't solve conflict detection
- International Operations entities need to be checked against existing BDO clients
- Need to check:
  1. Entity name matches existing client
  2. Entity parent company matches existing client
  3. Entity parent company matches existing client's parent company

## Recommended Approach

### Option 1: Extend Conflict Detection (Recommended)

**Enhance `checkGroupConflicts()` to also check International Operations entities:**

```javascript
export async function checkGroupConflicts(requestId) {
  const request = db.prepare(`SELECT * FROM coi_requests WHERE id = ?`).get(requestId)
  
  // ... existing parent_company checks ...
  
  // NEW: Check International Operations entities
  if (request.global_coi_form_data) {
    const globalData = JSON.parse(request.global_coi_form_data)
    const countries = globalData.countries || []
    
    for (const country of countries) {
      const entities = country.entities || []
      
      for (const entity of entities) {
        // Check 1: Entity name matches existing client
        const entityNameMatches = await checkEntityNameConflicts(entity.name, requestId)
        
        // Check 2: Entity parent matches existing client
        if (entity.relationship_type === 'subsidiary' || entity.relationship_type === 'parent') {
          const parentConflicts = await checkEntityParentConflicts(entity.name, requestId)
          conflicts.push(...parentConflicts)
        }
      }
    }
  }
  
  return { conflicts, warnings }
}
```

**Pros:**
- ✅ Detects conflicts for International Operations entities
- ✅ Works for prospects (searches coi_requests, not clients)
- ✅ Uses same Levenshtein matching logic
- ✅ IESBA 290.13 compliant

**Cons:**
- ⚠️ Additional processing time (checking multiple entities)
- ⚠️ More complex conflict detection logic

### Option 2: Store International Operations Entities Separately

**Create `international_operations_entities` table:**
```sql
CREATE TABLE international_operations_entities (
  id INTEGER PRIMARY KEY,
  coi_request_id INTEGER,
  country_code VARCHAR(10),
  entity_name VARCHAR(255),
  relationship_type VARCHAR(50),
  parent_company_name VARCHAR(255),
  ownership_percentage DECIMAL(5,2),
  control_type VARCHAR(50),
  FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id)
);
```

**Pros:**
- ✅ Structured data (easier to query)
- ✅ Can index for faster conflict detection
- ✅ Better data integrity

**Cons:**
- ❌ More complex (requires schema changes)
- ❌ Migration needed for existing data
- ❌ Over-engineering for prototype?

### Option 3: Keep Current + Add Validation Only

**Just add ownership_percentage validation:**
- ✅ Simple, aligns with industry standards
- ❌ Doesn't solve conflict detection gap
- ❌ International Operations entities still not checked

## Recommendation

**Hybrid Approach:**

1. **Add ownership_percentage and control_type** (as planned) ✅
   - Industry standards compliance
   - Better data quality

2. **Extend conflict detection** to check International Operations entities ✅
   - Use same Levenshtein matching logic
   - Check entity names and parent companies
   - Works for prospects (searches coi_requests table)

3. **Keep free text + Levenshtein** ✅
   - Correct approach for prospects
   - Handles external entities
   - Catches name variations

**Files to Modify:**
- `duplicationCheckService.js` - Add `checkInternationalOperationsConflicts()` function
- `coiController.js` - Call new function in `submitRequest()`
- `InternationalOperationsForm.vue` - Add ownership_percentage field (as planned)

## Questions to Clarify

1. **Should International Operations entities be checked for conflicts?**
   - According to IESBA 290.13: YES
   - If parent company is existing BDO client, conflict must be detected

2. **Should we check entity names directly?**
   - If "ABC UAE Subsidiary" is already a BDO client, should we detect duplicate?

3. **Performance concern?**
   - Checking multiple entities per request adds processing time
   - Acceptable trade-off for compliance?

## Conclusion

**Current approach (free text + Levenshtein) is CORRECT for prospects.** ✅

**Adding ownership_percentage is CORRECT for industry standards.** ✅

**BUT we need to extend conflict detection to International Operations entities.** ⚠️

The plan should include:
1. Add ownership_percentage field (as planned) ✅
2. Add conflict detection for International Operations entities (NEW) ⚠️
3. Keep free text + Levenshtein approach (already correct) ✅
