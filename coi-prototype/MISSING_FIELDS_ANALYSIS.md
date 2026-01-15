# Missing Fields Analysis - COI Request Form vs Template

## Comparison Date: 2026-01-15

---

## ✅ FIELDS PRESENT (But May Need Updates)

### Section 1: Requestor Information
- ✅ Requestor Name
- ✅ Designation (⚠️ **Only 4 options, template has 7**)
  - Current: Director, Partner, Manager, Senior Manager
  - Template: Partner, Senior Director, Director, Associate Director, Senior Manager, Manager, Assistant Manager
- ✅ Entity
- ✅ Line of Service

### Section 2: Document Type
- ✅ Requested Document (⚠️ **Value mismatch**: "Engagement Letter" vs "Engagement")
- ✅ Language (⚠️ **Has extra option**: "Bilingual" not in template)

### Section 3: Client Details
- ✅ Client Name
- ✅ Parent Company
- ✅ Client Location (⚠️ **Options don't match**: Has "UAE", "Saudi Arabia", "Other" instead of "Other Country")
- ✅ Relationship with Client (⚠️ **Options don't match**)
  - Current: Existing Client, New Client, Referral
  - Template: New Client, Current Client, Potential Client, Old Client
- ✅ Client Type (⚠️ **Only 4 options, template has 16**)
  - Current: W.L.L., K.S.C., K.S.C.C., Sole Proprietorship
  - Template: W.L.L., W.L.L. Holding, K.S.C.C., K.S.C.C. (Holding), K.S.C.P., K.S.C.P. (Holding), S.C.P. (Holding), S.P.C., S.P.C. Holding, Portfolio, Fund, Scheme, Joint Venture Company, Solidarity Company, Simple Rec. Company, Shares Rec. Company
- ✅ Regulated Body (⚠️ **Only 3 options, template has 6**)
  - Current: CBK, CMA, None
  - Template: MOCI, MOCI & CMA, MOCI & CBK, MOCI, CMA & CBK, MOCI & Boursa, Governmental Authority
- ✅ PIE Status (Yes/No radio buttons)

### Section 4: Service Information
- ✅ Service Type
- ✅ Service Description
- ✅ Service Period Start (From)
- ✅ Service Period End (To)

### Section 5: Ownership Structure
- ✅ Full Ownership Structure
- ✅ Related Affiliated Entities (maps to "Other Related Data" but not structured as Row1/Row1_2)

---

## ❌ MISSING FIELDS

### Section 3: Client Details
1. **Status** (Dropdown - Combo Box10)
   - Options: N/A, Listed, Licensed, Listed & Licensed, OTC, Other
   - **Priority: HIGH** - This is a regulatory field

2. **Requested Service Period** (Dropdown - Combo Box11)
   - Options: One Time, 1 Year, 2 Years, 3 Years, +3 Years
   - **Priority: MEDIUM** - Currently using date fields (From/To), but template has this as a dropdown

### Section 5: Ownership Structure
3. **Other Related Data Row1** (Text field - left column)
   - **Priority: LOW** - Currently using "Related Affiliated Entities" as a single text field

4. **Other Related Data Row1_2** (Text field - right column)
   - **Priority: LOW** - Currently using "Related Affiliated Entities" as a single text field

### Section 6: Review Results (COMPLETELY MISSING)
5. **Client Status** (Text field)
   - **Priority: HIGH** - Used for compliance review

6. **Service Date** (Date field)
   - **Priority: HIGH** - Date of previous service

7. **Notes (if any)** (Text field)
   - **Priority: MEDIUM** - Additional notes for review

8. **Previous Services** (Dropdown - Combo Box100000)
   - Options: Same as Service Type (39 options)
   - **Priority: HIGH** - Critical for conflict detection

9. **Check Box4** (Checkbox - N/A for Previous Services)
   - Values: Yes / Off
   - **Priority: MEDIUM**

### Section 7: Checked By (COMPLETELY MISSING)
10. **Name** (Text field)
    - **Priority: MEDIUM** - Name of checker

11. **Designation_2** (Text field)
    - **Priority: MEDIUM** - Designation of checker

12. **Date1_af_date** (Date field)
    - **Priority: MEDIUM** - Date checked

### Section 8: Decision (COMPLETELY MISSING)
13. **Check Box1** (Checkbox - Proceed)
    - Values: Yes / Off
    - **Priority: HIGH** - This is the approval mechanism

14. **Check Box2** (Checkbox - Reject)
    - Values: Yes / Off
    - **Priority: HIGH** - This is the rejection mechanism

15. **Check Box3** (Checkbox - Escalate)
    - Values: Yes / Off
    - **Priority: HIGH** - This is the escalation mechanism

16. **Notes (if any)_2** (Text field)
    - **Priority: MEDIUM** - Decision notes

### Section 9: Approved By (COMPLETELY MISSING)
17. **Name_2** (Text field)
    - **Priority: MEDIUM** - Name of approver

18. **Designation_3** (Text field)
    - **Priority: MEDIUM** - Designation of approver

19. **Date2_af_date** (Date field)
    - **Priority: MEDIUM** - Approval date

---

## 📊 SUMMARY

### Fields Status:
- **Present**: 15 fields
- **Present but needs updates**: 8 fields (options mismatch)
- **Missing**: 19 fields

### Missing Sections:
1. **Review Results Section** - Completely missing (5 fields)
2. **Checked By Section** - Completely missing (3 fields)
3. **Decision Section** - Completely missing (4 fields)
4. **Approved By Section** - Completely missing (3 fields)

### Priority Breakdown:
- **HIGH Priority**: 7 fields (Status, Previous Services, Decision checkboxes)
- **MEDIUM Priority**: 8 fields (Service Date, Notes, Checked By, Approved By)
- **LOW Priority**: 4 fields (Other Related Data structure)

---

## 🔧 RECOMMENDATIONS

1. **Immediate Actions (HIGH Priority)**:
   - Add "Status" dropdown to Client Details section
   - Add "Requested Service Period" dropdown (or clarify if date fields are sufficient)
   - Add "Review Results" section with Previous Services dropdown
   - Implement Decision section (Proceed/Reject/Escalate checkboxes) - This may already exist in approval workflow, but needs to match template structure

2. **Short-term Actions (MEDIUM Priority)**:
   - Add "Checked By" section (may be auto-populated from workflow)
   - Add "Approved By" section (may be auto-populated from workflow)
   - Add "Service Date" and "Notes" fields to Review Results

3. **Long-term Actions (LOW Priority)**:
   - Restructure "Other Related Data" into Row1/Row1_2 format
   - Update dropdown options to match template exactly

4. **Option Updates Needed**:
   - Designation: Add Senior Director, Associate Director, Assistant Manager
   - Client Type: Add all 16 options from template
   - Regulated Body: Add MOCI, MOCI & CMA, MOCI & CBK, MOCI, CMA & CBK, MOCI & Boursa, Governmental Authority
   - Relationship with Client: Update to match template options
   - Client Location: Change "Other" to "Other Country"

---

## 📝 NOTES

- The current form has a workflow-based approval system, but the template shows explicit "Decision" and "Approved By" sections. These may need to be added as display-only fields that show the current workflow state, or the workflow needs to be updated to match the template structure.

- The "Review Results" section appears to be for compliance officers to review and document previous services and conflicts. This is currently handled in the compliance dashboard, but may need to be added to the form itself.

- The "Checked By" and "Approved By" sections may be auto-populated from the workflow system, but the template shows them as explicit fields that need to be filled.
