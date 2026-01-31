# Workflow vs Form Fields Clarification

## Date: 2026-01-15

---

## ✅ FORM FIELDS (Updated)

The following dropdown options have been updated in the COI Request Form:

1. **Designation** - Now has all 7 options:
   - Partner
   - Senior Director
   - Director
   - Associate Director
   - Senior Manager
   - Manager
   - Assistant Manager

2. **Client Type** - Now has all 16 options:
   - W.L.L.
   - W.L.L. Holding
   - K.S.C.C.
   - K.S.C.C. (Holding)
   - K.S.C.P.
   - K.S.C.P. (Holding)
   - S.C.P. (Holding)
   - S.P.C.
   - S.P.C. Holding
   - Portfolio
   - Fund
   - Scheme
   - Joint Venture Company
   - Solidarity Company
   - Simple Rec. Company
   - Shares Rec. Company

3. **Regulated Body** - Now has all 6 options:
   - MOCI
   - MOCI & CMA
   - MOCI & CBK
   - MOCI, CMA & CBK
   - MOCI & Boursa
   - Governmental Authority

4. **Relationship with Client** - Updated to match template:
   - New Client
   - Current Client
   - Potential Client
   - Old Client

5. **Client Location** - Updated:
   - State of Kuwait
   - Other Country (changed from "Other")

---

## 🔄 WORKFLOW FIELDS (Not Form Fields)

The following fields from the template are **part of the workflow/approval system**, not the initial request form:

### 1. **Status Dropdown** (Client Details)
- **Current Implementation**: Not in form, but tracked in database
- **Workflow Location**: Set automatically based on request status
- **Options**: N/A, Listed, Licensed, Listed & Licensed, OTC, Other
- **Recommendation**: Add to form as a dropdown in Client Details section (HIGH PRIORITY)

### 2. **Requested Service Period Dropdown**
- **Current Implementation**: Using date fields (From/To) instead
- **Template**: Dropdown with options (One Time, 1 Year, 2 Years, 3 Years, +3 Years)
- **Recommendation**: Add dropdown option, but keep date fields for flexibility (MEDIUM PRIORITY)

### 3. **Review Results Section** (5 fields)
These are handled in the **Compliance Dashboard** during review, not in the initial form:

- **Client Status** (Text) - ✅ Tracked in workflow
- **Service Date** (Date) - ✅ Tracked in workflow (previous service dates)
- **Notes** (Text) - ✅ Tracked in workflow (compliance_notes, rejection_reason)
- **Previous Services** (Dropdown) - ✅ Tracked in workflow (conflict detection)
- **Check Box4** (N/A) - ⚠️ Not explicitly tracked, but can be inferred

**Current Workflow Implementation:**
- Compliance officers review requests in `ComplianceDashboard.vue`
- Previous services are detected via conflict checking
- Notes are stored in `compliance_notes` and `rejection_reason` fields
- Service dates are tracked in `coi_requests` table

### 4. **Decision Section** (4 fields)
These are handled in the **approval workflow**, not the form:

- **Check Box1 (Proceed)** - ✅ Implemented as `status = 'Approved'`
- **Check Box2 (Reject)** - ✅ Implemented as `status = 'Rejected'`
- **Check Box3 (Escalate)** - ✅ Implemented as escalation to Partner/Compliance
- **Notes** - ✅ Implemented as `rejection_reason`, `approval_notes`, `compliance_notes`

**Current Workflow Implementation:**
- Decisions are made in `ComplianceDashboard.vue` and `PartnerDashboard.vue`
- Status changes: `Pending` → `Approved` / `Rejected` / `Escalated`
- Notes are stored in database fields

### 5. **Checked By Section** (3 fields)
These are **auto-populated from workflow**, not manual form fields:

- **Name** - ✅ Auto-populated from `compliance_reviewed_by` or `director_approval_by`
- **Designation_2** - ⚠️ Not explicitly stored, but can be fetched from user profile
- **Date1_af_date** - ✅ Auto-populated from `compliance_reviewed_at` or `director_approval_at`

**Current Workflow Implementation:**
- Checked by information is tracked in database:
  - `compliance_reviewed_by` (user_id)
  - `compliance_reviewed_at` (timestamp)
  - `director_approval_by` (user_id)
  - `director_approval_at` (timestamp)

### 6. **Approved By Section** (3 fields)
These are **auto-populated from workflow**, not manual form fields:

- **Name_2** - ✅ Auto-populated from `partner_approval_by` or `compliance_approval_by`
- **Designation_3** - ⚠️ Not explicitly stored, but can be fetched from user profile
- **Date2_af_date** - ✅ Auto-populated from `partner_approval_at` or `compliance_approval_at`

**Current Workflow Implementation:**
- Approved by information is tracked in database:
  - `partner_approval_by` (user_id)
  - `partner_approval_at` (timestamp)
  - `compliance_approval_by` (user_id)
  - `compliance_approval_at` (timestamp)

---

## 📊 SUMMARY

### Fields That Need to Be Added to Form:
1. **Status Dropdown** (Client Details) - HIGH PRIORITY
2. **Requested Service Period Dropdown** - MEDIUM PRIORITY (or clarify if date fields are sufficient)

### Fields That Are Already in Workflow (May Need UI Display):
1. **Review Results Section** - Already handled in Compliance Dashboard
2. **Decision Section** - Already handled in approval workflow
3. **Checked By Section** - Already tracked in database (may need to display in detail view)
4. **Approved By Section** - Already tracked in database (may need to display in detail view)

---

## 🎯 RECOMMENDATIONS

### Immediate Actions:
1. ✅ **DONE**: Update dropdown options (Designation, Client Type, Regulated Body, Relationship, Location)
2. **TODO**: Add "Status" dropdown to Client Details section in form
3. **TODO**: Consider adding "Requested Service Period" dropdown (or document that date fields are preferred)

### Display Enhancements:
1. **Add Review Results display** in `COIRequestDetail.vue`:
   - Show previous services detected
   - Show service dates
   - Show compliance notes
   - Show client status

2. **Add Checked By/Approved By display** in `COIRequestDetail.vue`:
   - Show who checked the request (with designation from user profile)
   - Show who approved the request (with designation from user profile)
   - Show dates

3. **Enhance Decision display** in `COIRequestDetail.vue`:
   - Show decision type (Proceed/Reject/Escalate) clearly
   - Show decision notes
   - Show decision history/log

### Database Considerations:
- Consider adding `client_status` field to `coi_requests` table if not already present
- Consider adding `requested_service_period` field (dropdown value) to complement date fields
- Ensure `designation` is stored in `users` table for Checked By/Approved By display

---

## 🔍 VERIFICATION NEEDED

Please verify:
1. Is "Status" (Listed, Licensed, etc.) a property of the **client** or the **request**?
   - If client property: Should be in `clients` table
   - If request property: Should be in `coi_requests` table

2. Should "Requested Service Period" be a dropdown or date fields?
   - Template shows dropdown, but date fields provide more flexibility
   - Consider: Dropdown for quick selection, date fields for custom periods

3. Should Review Results be editable in the detail view, or read-only display?
   - Template suggests they should be editable during review
   - Current system: Compliance officers can add notes, but previous services are auto-detected
