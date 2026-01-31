# PRMS Integration Analysis - Financial Parameters

## Executive Summary

After examining the PRMS system at `http://prms.envisionsystem.com`, I've identified the fields available in both **Client Creation** and **Project Creation** forms. This analysis determines whether financial parameters from COI should be pushed to PRMS.

## PRMS Project Creation Form Analysis

**URL:** `http://prms.envisionsystem.com/project/add`

### Required Fields (*)
- **Project Name*** (text input)
- **Service Type*** (dropdown)
- **Client*** (dropdown - must exist in PRMS)
- **Start Date*** (date picker)

### Financial/Relevant Fields Found

1. **Billing Currency** (dropdown)
   - **Status:** ✅ **EXISTS**
   - **Matches COI:** Yes - This directly corresponds to `financial_parameters.currency` in COI
   - **Recommendation:** **SHOULD BE PUSHED** from COI to PRMS

2. **Billing Contact** (text input)
   - **Status:** ✅ **EXISTS**
   - **Matches COI:** Partial - COI doesn't capture this, but it's a billing-related field
   - **Recommendation:** Not applicable (COI doesn't have this data)

3. **Project Value** (text input)
   - **Status:** ✅ **EXISTS**
   - **Matches COI:** Partial - COI has `pending_amount` which could relate
   - **Recommendation:** Optional - Could map `pending_amount` if available

4. **Cost** (text input)
   - **Status:** ✅ **EXISTS**
   - **Matches COI:** No direct match
   - **Recommendation:** Not applicable

5. **Budget Recovery (%)** (text input)
   - **Status:** ✅ **EXISTS**
   - **Matches COI:** No direct match
   - **Recommendation:** Not applicable

6. **Budget Hour** (text input)
   - **Status:** ✅ **EXISTS**
   - **Matches COI:** No direct match
   - **Recommendation:** Not applicable

### Risk/Assessment Fields

1. **Risks** (textbox - free text)
   - **Status:** ✅ **EXISTS**
   - **Matches COI:** Partial - COI has `risk_assessment` (dropdown: Low, Medium, High, Very High)
   - **Recommendation:** **SHOULD BE PUSHED** - Map COI's structured risk assessment to PRMS free text field
   - **Mapping Strategy:** Convert dropdown value to descriptive text (e.g., "Risk Assessment: High" or "High Risk")

### Missing Fields in PRMS

1. **Credit Terms**
   - **Status:** ❌ **NOT FOUND**
   - **COI Has:** Yes (`financial_parameters.credit_terms`)
   - **Recommendation:** **DO NOT PUSH** - PRMS doesn't have this field

2. **Engagement Code**
   - **Status:** ❌ **NOT FOUND**
   - **COI Has:** Yes (`engagement_code`)
   - **Recommendation:** **CRITICAL GAP** - This should be added to PRMS or stored separately
   - **Note:** Engagement code validation is critical for COI-PRMS integration

3. **Risk Assessment (Structured)**
   - **Status:** ⚠️ **PARTIAL** - PRMS has free text "Risks", not structured dropdown
   - **COI Has:** Yes (structured: Low, Medium, High, Very High)
   - **Recommendation:** **PUSH AS TEXT** - Convert structured value to descriptive text

### Other Project Fields (Not Financial)
- Department
- Business Unit
- Referral Client
- Project Director
- Project Partner
- Project Manager
- Status
- Targeted End Date
- Contractual End Date
- Duration Hr
- Constraints
- Communication Plan
- Quality Plan
- Assumptions
- Dependencies
- Timeline Schedule
- Procurement Plan
- Closure Criteria
- Description

---

## PRMS Client Creation Form Analysis

**URL:** `http://prms.envisionsystem.com/client/add`

### Fields Found

1. **Billing Address** (text input)
   - **Status:** ✅ **EXISTS**
   - **Matches COI:** No direct match
   - **Recommendation:** Not applicable

### Financial Fields in Client Form
- **None found** - Client form appears to be basic client information only
- No currency, credit terms, or risk assessment fields at client level

---

## Recommendations

### ✅ **Option B: Minimal Integration (RECOMMENDED - UPDATED)**

Based on PRMS field analysis, push the following financial parameters:

#### **Fields to Push to PRMS:**

1. **Billing Currency** ✅
   - **Source:** `financial_parameters.currency` from COI
   - **Target:** `Billing Currency` dropdown in PRMS Project Creation
   - **Priority:** **HIGH** - Direct field match
   - **Action:** Push during project creation

2. **Risks (Risk Assessment)** ✅
   - **Source:** `financial_parameters.risk_assessment` from COI
   - **Target:** `Risks` textbox in PRMS Project Creation
   - **Priority:** **MEDIUM** - Needs conversion (structured → text)
   - **Action:** Convert dropdown value to descriptive text
   - **Mapping:**
     - "Low" → "Risk Assessment: Low"
     - "Medium" → "Risk Assessment: Medium"
     - "High" → "Risk Assessment: High"
     - "Very High" → "Risk Assessment: Very High"

3. **Project Value (Optional)** ⚠️
   - **Source:** `financial_parameters.pending_amount` from COI
   - **Target:** `Project Value` text input in PRMS
   - **Priority:** **LOW** - Optional mapping
   - **Action:** Push if `pending_amount` is provided

#### **Fields NOT to Push:**

1. **Credit Terms** ❌
   - **Reason:** PRMS doesn't have this field
   - **Action:** Keep in COI only

2. **Engagement Code** ⚠️
   - **Reason:** PRMS doesn't have this field in project creation form
   - **Action:** **CRITICAL** - Need to determine where engagement code should be stored:
     - Option A: Add field to PRMS project form
     - Option B: Store in separate mapping table
     - Option C: Use project name or description to include engagement code

---

## Implementation Plan

### Phase 1: Core Integration (Required)

1. **Update `createProject` API in COI:**
   ```javascript
   // Fetch financial parameters from COI request
   const coiRequest = db.prepare(`
     SELECT financial_parameters, engagement_code
     FROM coi_requests 
     WHERE engagement_code = ?
   `).get(engagement_code)
   
   let financialParams = null
   if (coiRequest?.financial_parameters) {
     financialParams = JSON.parse(coiRequest.financial_parameters)
   }
   
   // Map risk assessment to text
   const riskText = financialParams?.risk_assessment 
     ? `Risk Assessment: ${financialParams.risk_assessment}`
     : null
   
   // Insert project with financial parameters
   db.prepare(`
     INSERT INTO prms_projects (
       project_id, 
       engagement_code, 
       client_code, 
       status,
       billing_currency,
       risks,
       project_value
     )
     VALUES (?, ?, ?, 'Active', ?, ?, ?)
   `).run(
     finalProjectId, 
     engagement_code, 
     client_code,
     financialParams?.currency || null,
     riskText,
     financialParams?.pending_amount || null
   )
   ```

2. **Update `prms_projects` table schema:**
   ```sql
   ALTER TABLE prms_projects ADD COLUMN billing_currency VARCHAR(10);
   ALTER TABLE prms_projects ADD COLUMN risks TEXT;
   ALTER TABLE prms_projects ADD COLUMN project_value DECIMAL(15,2);
   ```

### Phase 2: Engagement Code Integration (Critical)

**Decision Required:** Where should engagement code be stored in PRMS?

- **Option A:** Add `engagement_code` field to PRMS project form (requires PRMS changes)
- **Option B:** Store in `prms_projects` table and use for validation only
- **Option C:** Include in project description or notes field

**Recommendation:** **Option B** - Store in database for validation, but don't require PRMS UI changes immediately.

---

## Summary Table

| COI Financial Parameter | PRMS Field | Match Type | Push? | Priority |
|-------------------------|------------|------------|-------|----------|
| `currency` | Billing Currency | ✅ Direct Match | ✅ **YES** | **HIGH** |
| `risk_assessment` | Risks | ⚠️ Text Conversion | ✅ **YES** | **MEDIUM** |
| `pending_amount` | Project Value | ⚠️ Optional | ⚠️ **OPTIONAL** | **LOW** |
| `credit_terms` | ❌ Not Found | ❌ No Match | ❌ **NO** | N/A |
| `engagement_code` | ❌ Not Found | ⚠️ Critical Gap | ⚠️ **NEEDS DECISION** | **CRITICAL** |
| `notes` | Description | ⚠️ Partial | ⚠️ **OPTIONAL** | **LOW** |

---

## Conclusion

**Answer to Original Question: "Should financial parameters be pushed to PRMS?"**

**YES - But selectively:**

1. ✅ **Push `currency`** → PRMS `Billing Currency` (HIGH priority)
2. ✅ **Push `risk_assessment`** → PRMS `Risks` as text (MEDIUM priority)
3. ⚠️ **Push `pending_amount`** → PRMS `Project Value` (OPTIONAL, LOW priority)
4. ❌ **Do NOT push `credit_terms`** - PRMS doesn't have this field
5. ⚠️ **Engagement Code** - CRITICAL decision needed on where to store

**Next Steps:**
1. Implement Phase 1 (currency and risk assessment)
2. Decide on engagement code storage strategy
3. Test integration with PRMS API (if available) or update mock database
