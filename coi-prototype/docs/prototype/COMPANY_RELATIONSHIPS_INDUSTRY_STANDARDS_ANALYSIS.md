# Company Relationships - Industry Standards Alignment Analysis

## Current Configuration Status

### ✅ What's Implemented

1. **Database Schema:**
   - `clients.parent_company_id` (INTEGER, Foreign Key) - Structured parent-child relationship
   - `coi_requests.parent_company` (TEXT) - Free text field for parent company name
   - `coi_requests.group_structure` (TEXT) - Values: 'standalone', 'has_parent', 'research_required'

2. **Form Implementation:**
   - Group structure selection (standalone/has_parent/research_required)
   - Parent company text input
   - International Operations form with relationship types (parent/subsidiary/sister)

3. **Conflict Detection:**
   - `checkGroupConflicts()` function exists
   - Detects siblings (same parent)
   - Detects children (where this client is parent)
   - Multi-level relationship detection
   - IESBA 290.13 compliance checks

### ❌ What's Missing (Industry Standards Gap)

1. **Company Type Classification:**
   - ❌ No explicit "company type" field (Parent/Subsidiary/Sister/Affiliate)
   - ❌ No ownership percentage tracking
   - ❌ No distinction between Subsidiary (≥50% control) vs Affiliate (20-50% influence)

2. **Structured Relationships:**
   - ❌ Parent company stored as TEXT, not linked entity
   - ❌ No relationship type stored in database
   - ❌ Sister companies detected by text matching, not structured links

3. **Data Quality:**
   - ❌ No validation of ownership percentages
   - ❌ No verification that parent company exists in system
   - ❌ Text-based matching prone to errors (e.g., "Google Inc" vs "Google LLC")

4. **Industry Standard Fields Missing:**
   - ❌ No `ownership_percentage` field
   - ❌ No `control_type` field (majority/minority/joint control)
   - ❌ No `entity_type` field (Parent/Subsidiary/Sister/Affiliate/Standalone)

---

## Industry Standards (IESBA 290.13 + Corporate Law)

### Standard Definitions

| Relationship Type | Definition | Ownership Threshold | Control Level |
|------------------|------------|---------------------|---------------|
| **Parent Company** | Controlling entity | Owns ≥50% voting rights | Full control (board appointments, strategic decisions) |
| **Subsidiary** | Controlled entity | Parent owns ≥50% | Controlled by parent |
| **Sister Company** | Same parent | Both have same parent | No direct control between sisters |
| **Affiliate/Associate** | Significant influence | 20-50% ownership | Significant influence, not control |
| **Standalone** | Independent entity | <20% external ownership | Independent operations |

### IESBA 290.13 Requirements

> **"Audit Client" Definition:**
> Includes the entity itself, its **parent company**, **subsidiaries**, **affiliates**, and related entities under **common control**.
> Independence requirements apply to the **ENTIRE corporate group**.

**Translation:**
- If auditing Entity A → Cannot provide prohibited services to:
  - Entity A's parent company
  - Entity A's subsidiaries  
  - Entity A's sister companies (same parent)
  - Entity A's affiliates (if significant influence)

---

## Current System vs Industry Standards

### ✅ Aligned Areas

1. **Terminology:** Uses correct terms (Parent, Subsidiary, Sister)
2. **IESBA Compliance:** References IESBA 290.13 in conflict detection
3. **Group Structure:** Captures standalone vs has_parent
4. **Conflict Detection:** Checks parent, children, and siblings

### ⚠️ Partially Aligned Areas

1. **Relationship Types:**
   - ✅ Available in International Operations form
   - ❌ Not stored in main COI request
   - ❌ Not used in conflict detection logic

2. **Parent Company:**
   - ✅ Captured as text field
   - ⚠️ Not linked to structured `clients.parent_company_id`
   - ❌ No validation that parent exists

### ❌ Not Aligned Areas

1. **Company Type Classification:**
   - Missing: Explicit company type field
   - Missing: Ownership percentage
   - Missing: Control type (majority/minority)

2. **Data Structure:**
   - Parent company stored as TEXT (unstructured)
   - No relationship type stored in `coi_requests` table
   - Sister companies detected by fuzzy text matching only

3. **Validation:**
   - No ownership percentage validation
   - No verification that parent company exists in system
   - No distinction between Subsidiary (control) vs Affiliate (influence)

---

## Recommended Improvements (Industry Standards Alignment)

### Priority 1: Structured Relationships

**Add to `coi_requests` table:**
```sql
ALTER TABLE coi_requests ADD COLUMN company_type VARCHAR(50) 
  CHECK (company_type IN ('Standalone', 'Subsidiary', 'Parent', 'Sister', 'Affiliate'));

ALTER TABLE coi_requests ADD COLUMN parent_company_id INTEGER 
  REFERENCES clients(id);

ALTER TABLE coi_requests ADD COLUMN ownership_percentage DECIMAL(5,2);
```

### Priority 2: Enhanced Conflict Detection

**Update conflict detection to use:**
- Structured `parent_company_id` links (not text matching)
- Company type to determine relationship
- Ownership percentage for affiliate vs subsidiary distinction

### Priority 3: Data Validation

**Add validation rules:**
- If `company_type = 'Subsidiary'` → `parent_company_id` required
- If `company_type = 'Subsidiary'` → `ownership_percentage` should be ≥50%
- If `company_type = 'Affiliate'` → `ownership_percentage` should be 20-50%
- Parent company must exist in `clients` table

### Priority 4: UI Enhancement

**Update COI Request Form:**
- Add "Company Type" dropdown (Standalone/Subsidiary/Parent/Sister/Affiliate)
- Add "Parent Company" search/select (not free text)
- Add "Ownership Percentage" field (for subsidiaries/affiliates)
- Show relationship visualization

---

## Current Implementation Score

| Aspect | Status | Industry Standard Alignment |
|--------|--------|----------------------------|
| **Terminology** | ✅ Good | Aligned - Uses correct terms |
| **IESBA Compliance** | ⚠️ Partial | References IESBA but missing structured data |
| **Data Structure** | ❌ Weak | Text-based, not structured relationships |
| **Conflict Detection** | ⚠️ Partial | Works but uses fuzzy text matching |
| **Validation** | ❌ Missing | No ownership/control validation |
| **Company Types** | ❌ Missing | No explicit type classification |

**Overall Score: 5/10** - Partially aligned, needs structured relationships

---

## Recommendation

**Current State:** System has basic parent company tracking but relies on text matching.

**Industry Standard:** Requires structured relationships with ownership percentages and explicit company types.

**Action Required:** 
1. Add structured relationship fields to database
2. Update forms to capture company type and ownership
3. Enhance conflict detection to use structured links
4. Add validation per industry standards

This will ensure full IESBA 290.13 compliance and industry-standard corporate relationship management.
