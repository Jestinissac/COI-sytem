# COI Form Goals Implementation Summary

**Date:** 2026-01-28

## Goals Implemented

### Goal 1: International Operations position + Line of Service (local + global)

- **International Operations** moved into **Section 4 (Service Information)** at the top, before Line of Service.
- **Section 7** removed as a separate section; **Global COI Form** is now inside Section 4 when "Client has international operations" is checked.
- **Line of Service (local request)** always uses the Kuwait list; labels updated to "Line of Service (local request)" and "Service Type (local)".
- **Line of Service (BDO Global)** appears when international operations is checked: second row of dropdowns ("Line of Service (BDO Global)" and "Service Type (BDO Global)") populated via `fetchGlobalServiceTypes()` (API with `international=true`).
- Sidebar **sections** reduced from 7 to 6 (International removed); **Section 8 (Director Approval)** renumbered to **Section 7** for team members.
- **Backend:** `coi_requests` has `global_service_category` and `global_service_type`; create request and field mappings updated. **Frontend:** `formData.global_service_category`, `formData.global_service_type`, `globalServiceTypes`, `loadingGlobalServices`, `fetchGlobalServiceTypes()`, `filteredGlobalServicesByCategory`, load/save and watchers updated.

### Goal 2: Section 5 (Ownership) optional when international

- **Section 5** is **hidden** when `formData.international_operations === true` (`v-if="!formData.international_operations"`).
- When international, ownership is taken from the Global COI Form; when local-only, Section 5 is shown and used as before.
- **Completion:** `isSectionComplete('section-5')` returns true when international; when local, section remains optional for submit.
- No backend validation change: ownership fields are not required when `international_operations` is true.

### Goal 3: Section 6 (Signatories) – hierarchy note + backup approver

- **Section 6** copy: "Approvers are assigned from hierarchy (AD, PRMS, HRMS). You may select a backup approver if your primary is unavailable."
- **Backup approver** dropdown added; options from `GET /coi/approvers` (Directors, Compliance, Partners, Finance). Option "None — use default escalation" binds to empty.
- **Backend:** `coi_requests.backup_approver_id` added (migration in `init.js` and `20260128_coi_form_goals.sql`). **getNextApprover** (notificationService): when no active primary approver for the role, uses `request.backup_approver_id` if set and that user is active (`active = 1 OR is_active = 1`); otherwise escalates to Admin as before.
- **New endpoint:** `GET /coi/approvers` returns approvers for backup selection (authenticated, no Admin role required).

## Files Touched

- **Frontend:** `frontend/src/views/COIRequestForm.vue` (Section 4 layout, Section 5 visibility, Section 6 UI, sections array, formData, fetchServiceTypes/fetchGlobalServiceTypes, watchers, load/save).
- **Backend:** `backend/src/controllers/coiController.js` (STANDARD_FIELD_MAPPINGS, INSERT columns/values, getApproversForBackup). `backend/src/routes/coi.routes.js` (GET /approvers). `backend/src/services/notificationService.js` (getNextApprover backup logic). `backend/src/database/init.js` (migration for global_service_category, global_service_type, backup_approver_id).
- **Migration:** `database/migrations/20260128_coi_form_goals.sql`.

## Database Schema (verified)

- **coi_requests:** `global_service_category` VARCHAR(50), `global_service_type` VARCHAR(100), `backup_approver_id` INTEGER REFERENCES users(id). Index: `idx_coi_requests_backup_approver`.

## Design Compliance

- New UI uses neutral backgrounds (`bg-gray-50`, `bg-white`), `border-gray-200`/`border-gray-300`, single accent (blue for focus), 8px grid spacing where applicable. Section 6 and Section 4 International block avoid gradients and decorative shadows.

## Feedback Loops

- Existing requester progress and "no approvers available" behaviour kept. When backup is used, `getNextApprover` returns the backup user and notifications flow as for any other approver. No change to "notify all approvers" for the next role; backup only applies when no primary is available (escalation path).
