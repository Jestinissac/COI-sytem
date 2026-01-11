# PRMS Financial Data Integration Analysis

## Current State

### What is Currently Sent to PRMS
When creating a project in PRMS via `/integration/projects`, the system only sends:
- `engagement_code` (required)
- `client_code` (required)
- `project_id` (optional, auto-generated if not provided)

### What is NOT Currently Sent
Financial parameters captured during engagement code generation:
- `credit_terms` (Net 15, 30, 60, 90, Due on Receipt, Custom)
- `currency` (KWD, USD, EUR, GBP, SAR, AED)
- `risk_assessment` (Low, Medium, High, Very High)
- `pending_amount` (optional)
- `notes` (optional)

## Analysis: Should Financial Parameters Be Pushed to PRMS?

### ✅ **YES - Recommended Approach**

**Rationale:**
1. **Project Financial Setup**: PRMS likely needs currency and credit terms to:
   - Set up billing/invoicing for the project
   - Configure payment terms
   - Track financial transactions in the correct currency

2. **Risk Management**: Risk assessment helps PRMS:
   - Flag high-risk projects for additional monitoring
   - Apply appropriate financial controls
   - Set up approval workflows

3. **Data Consistency**: Financial parameters are captured at engagement code generation (the right time) and should flow to PRMS to avoid:
   - Manual re-entry
   - Data inconsistencies
   - Missing financial setup

4. **Business Logic**: If Finance team is capturing this data during code generation, it's likely needed downstream in PRMS.

### ❌ **NO - Alternative Approach**

**Rationale:**
1. **Separation of Concerns**: COI system handles compliance; PRMS handles project execution
2. **PRMS May Have Different Fields**: PRMS might have its own financial setup workflow
3. **Optional Data**: Some fields (pending_amount, notes) may not be required at project creation
4. **Can Be Added Later**: Financial parameters could be added to PRMS projects after creation

## Recommendation

### **Option A: Full Integration (Recommended)**
Push all financial parameters to PRMS when creating a project:

**Implementation:**
1. Extend `prms_projects` table to include:
   ```sql
   ALTER TABLE prms_projects ADD COLUMN credit_terms VARCHAR(50);
   ALTER TABLE prms_projects ADD COLUMN currency VARCHAR(10);
   ALTER TABLE prms_projects ADD COLUMN risk_assessment VARCHAR(20);
   ALTER TABLE prms_projects ADD COLUMN pending_amount DECIMAL(15,2);
   ALTER TABLE prms_projects ADD COLUMN financial_notes TEXT;
   ```

2. Update `createProject` in `integrationController.js` to:
   - Fetch financial parameters from `coi_requests` using `engagement_code`
   - Include them in the INSERT statement

3. Update API endpoint to accept optional financial parameters (for backward compatibility)

**Pros:**
- Complete data flow from COI to PRMS
- No manual re-entry
- Consistent financial setup

**Cons:**
- Requires PRMS schema changes
- May need PRMS API updates (if real integration)

### **Option B: Minimal Integration (Pragmatic)**
Push only essential financial parameters:

**Implementation:**
- Send `currency` and `credit_terms` only (most critical for project setup)
- Store full financial parameters in COI system for reference
- PRMS can fetch additional details via API if needed

**Pros:**
- Minimal changes
- Covers essential needs
- Flexible for future expansion

**Cons:**
- Risk assessment and notes not available in PRMS
- May require additional API calls later

### **Option C: No Integration (Current State)**
Keep financial parameters in COI system only:

**Implementation:**
- No changes needed
- Financial parameters remain in `coi_requests.financial_parameters`
- PRMS users manually enter financial data

**Pros:**
- No integration complexity
- Systems remain decoupled
- PRMS can use its own financial workflow

**Cons:**
- Manual data entry
- Potential inconsistencies
- Duplicate work

## Decision Matrix

| Factor | Option A (Full) | Option B (Minimal) | Option C (None) |
|--------|----------------|-------------------|-----------------|
| **Data Completeness** | ✅ Complete | ⚠️ Partial | ❌ None |
| **Implementation Effort** | ⚠️ High | ✅ Low | ✅ None |
| **User Experience** | ✅ Best | ⚠️ Good | ❌ Manual |
| **Maintenance** | ⚠️ Medium | ✅ Low | ✅ None |
| **Future Flexibility** | ✅ High | ⚠️ Medium | ❌ Low |

## Recommended Next Steps

1. **Confirm PRMS Requirements**: Check with PRMS team/requirements:
   - Does PRMS have fields for financial parameters?
   - When are financial parameters needed (at creation or later)?
   - What format does PRMS expect?

2. **If PRMS Needs Financial Data**: Implement **Option B (Minimal Integration)**
   - Add `currency` and `credit_terms` to `prms_projects`
   - Update `createProject` to fetch and include these fields
   - Keep full financial parameters in COI for reference

3. **If PRMS Doesn't Need It**: Keep **Option C (Current State)**
   - Document that financial parameters are COI-specific
   - PRMS can fetch via API if needed later

## Implementation Example (Option B)

```javascript
// In integrationController.js - createProject function
export async function createProject(req, res) {
  try {
    const { engagement_code, client_code, project_id } = req.body
    
    // ... existing validation ...
    
    // Fetch financial parameters from COI request
    const coiRequest = db.prepare(`
      SELECT financial_parameters 
      FROM coi_requests 
      WHERE engagement_code = ?
    `).get(engagement_code)
    
    let financialParams = null
    if (coiRequest?.financial_parameters) {
      try {
        financialParams = typeof coiRequest.financial_parameters === 'string'
          ? JSON.parse(coiRequest.financial_parameters)
          : coiRequest.financial_parameters
      } catch (e) {
        console.warn('Failed to parse financial_parameters:', e)
      }
    }
    
    // Insert project with financial parameters
    const result = db.prepare(`
      INSERT INTO prms_projects (
        project_id, 
        engagement_code, 
        client_code, 
        status,
        currency,
        credit_terms
      )
      VALUES (?, ?, ?, 'Active', ?, ?)
    `).run(
      finalProjectId, 
      engagement_code, 
      client_code,
      financialParams?.currency || null,
      financialParams?.credit_terms || null
    )
    
    // ... rest of function ...
  }
}
```

## Conclusion

**Recommendation: Option B (Minimal Integration)**
- Push `currency` and `credit_terms` to PRMS (essential for project setup)
- Keep full financial parameters in COI system for reference
- Allows future expansion if needed
- Minimal implementation effort with maximum value

**Action Required:**
1. Confirm with stakeholders if PRMS needs financial parameters
2. If yes, implement Option B
3. If no, document decision and keep current state
