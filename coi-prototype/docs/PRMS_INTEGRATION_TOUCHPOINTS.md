# PRMS Integration Touch Points in User Journey

This document lists every place in the COI prototype where PRMS is referenced or implied in the user journey. Each touch point is marked for **placeholder coverage** so the prototype clearly indicates "PRMS not connected" where applicable.

---

## 1. Requester: COI Request Form

| Touch point | Location | Current behavior | Placeholder needed |
|-------------|----------|------------------|--------------------|
| Client selector label | `COIRequestForm.vue` | Text: "Existing client from PRMS" when entity = client and client selected | Optional: add tooltip or subtitle "In production, clients are synced from PRMS" |
| Parent company pre-fill | `COIRequestForm.vue` + `DynamicForm.vue` | On client select, `GET /integration/prms/client/:id` fills parent (data from local COI DB) | **Yes:** Add "Fetch from PRMS" modal (see plan); modal shows "PRMS not available — data from COI prototype" |
| Form fields sourced from PRMS | `DynamicForm.vue` | When `client_id` set, fetches same API and fills fields with `source_system === 'PRMS'` | Same as above: modal or inline note that data is COI placeholder |

**Summary:** Build **FetchPRMSDataModal** and open from form (e.g. "Load from PRMS" near client field). All pre-fill continues to use existing API; modal makes the "fetch PRMS" action explicit and shows placeholder disclaimer.

---

## 2. Any role: COI Request Detail

| Touch point | Location | Current behavior | Placeholder needed |
|-------------|----------|------------------|--------------------|
| System Checks – "Client in PRMS" | `COIRequestDetail.vue` | Yes/No from `/integration/clients` (COI local clients), not PRMS | **Yes:** Add short note under section: "In production, this checks PRMS Client Master." |
| Engagement code display | Same | Shows code; no PRMS call | No change |
| Toast on prospect convert | Same | "client creation request submitted to PRMS Admin" | Optional: append " (PRMS integration is placeholder in prototype)" in dev or leave as-is |

**Summary:** Add one line of placeholder copy in the System Checks area so "Client in PRMS" is clearly "simulated from COI client list until PRMS is connected."

**Implemented:** Compliance and Partner see a "View PRMS data" link in System Checks (when the request has a client). Click opens FetchPRMSDataModal in view-only mode with placeholder disclaimer; data auto-loads. See PRMS_DEEP_VISIBILITY_COMPLIANCE_PARTNER.md and PRMS_VISIBILITY_AND_DESIGN_PLAN.md.

---

## 3. Prospect Management

| Touch point | Location | Current behavior | Placeholder needed |
|-------------|----------|------------------|--------------------|
| Filter "PRMS Status" | `ProspectManagement.vue` | Synced / Not synced (from prospect `prms_synced`) | **Yes:** Subtitle or tooltip: "Synced = linked to PRMS client (prototype: COI client list)." |
| Create prospect – "PRMS Client Code" | Same | Input + "Check PRMS" button → `GET /prospects/prms/check` | **Yes:** Backend already TODO/placeholder (checks local `clients`). Add UI note: "In prototype, checks COI client list; in production this will check PRMS." |
| Table column PRMS code / ✓ | Same | Shows `prms_client_code` and synced checkmark | No change (data is already placeholder-driven) |

**Summary:** One short note near "Check PRMS" and optional filter subtitle so users know PRMS is not connected.

---

## 4. Finance Dashboard

| Touch point | Location | Current behavior | Placeholder needed |
|-------------|----------|------------------|--------------------|
| Tab "PRMS Sync" | `FinanceDashboard.vue` | Counts requests with engagement code + Active; no PRMS API call | **Yes:** Subtitle under tab: "In production, this reflects sync with PRMS; prototype shows COI data only." |
| "Fetch PRMS data" entry | Same (optional) | Not present | **Yes (per modal plan):** Add button that opens FetchPRMSDataModal for consistency |

**Summary:** Add PRMS Sync tab subtitle; optionally add "Fetch PRMS data" button opening the new modal.

---

## 5. Admin Dashboard

| Touch point | Location | Current behavior | Placeholder needed |
|-------------|----------|------------------|--------------------|
| Tab "Parent Company Updates (PRMS Admin)" | `AdminDashboard.vue` | List and approve/reject; backend updates local `clients` only | **Yes:** In `ParentCompanyUpdateRequestsPanel.vue`, add line: "In production, approval will push to PRMS Client Master." |
| Tab "Client Creations" | Same | Pending client creations; approve creates client in COI | **Yes:** In `ClientCreationReviewModal.vue` or panel: "In production, approved clients will be created in PRMS." |
| "Create Client in PRMS" button | `ClientCreationReviewModal.vue` | Creates client in COI DB; no PRMS call | Same as above: one sentence that production will push to PRMS |
| Execute proposal | `coiController.executeProposal` + notifications | Updates COI status and sends "execute and update PRMS" email; no PRMS API call | **Yes:** Optional post-execute note in UI: "In production, create project in PRMS (or use PRMS Demo)." Or link to PRMS Demo from Admin. |

**Summary:** Add one-line placeholder copy in Parent Company panel, Client Creation modal/panel, and optionally after Execute to clarify PRMS is not connected.

---

## 6. Engagement / Conversion flows

| Touch point | Location | Current behavior | Placeholder needed |
|-------------|----------|------------------|--------------------|
| ProspectConversionModal | `ProspectConversionModal.vue` | "Add Client to PRMS", "Submit to PRMS Admin", "become a client in PRMS" | **Yes:** Add small note in modal: "PRMS integration is simulated in prototype; submission is to COI Admin." |
| AddClientToPRMSForm | `AddClientToPRMSForm.vue` | "Will be assigned by PRMS Admin", "for PRMS" | Optional: "In production, PRMS Admin will complete in PRMS." |

**Summary:** One line in ProspectConversionModal; optional line in AddClientToPRMSForm.

---

## 7. Compliance

| Touch point | Location | Current behavior | Placeholder needed |
|-------------|----------|------------------|--------------------|
| Verification Source "PRMS Database" | `ComplianceActionPanel.vue` | Dropdown option only; no API | Optional: tooltip "In production, verification can be checked against PRMS." |

**Summary:** Low priority; tooltip is enough if desired.

**Implemented:** When Verification Source is "PRMS Database", helper text is shown below the select: "In production, verification can be checked against PRMS."

---

## 8. PRMS Demo (standalone)

| Touch point | Location | Current behavior | Placeholder needed |
|-------------|----------|------------------|--------------------|
| PRMS Demo view | `PRMSDemo.vue` | Create project with engagement code → `POST /integration/projects` (local `prms_projects` table) | Already a demo; optional banner: "This simulates PRMS project creation; real PRMS will be connected in production." |

**Summary:** Optional banner; page is already clearly a demo.

---

## 9. Backend / API (no direct user journey)

| Touch point | Location | Current behavior | Placeholder needed |
|-------------|----------|------------------|--------------------|
| `GET /integration/prms/client/:id` | `integration.routes.js` | Returns client + parent from COI DB; comment "In production, this would query PRMS" | Keep comment; used by DynamicForm and (when built) FetchPRMSDataModal |
| `GET /prospects/prms/check` | `prospectController.checkPRMSClient` | TODO; checks local `clients` by code | Already placeholder; frontend note above |
| Parent company approve | `parentCompanyUpdateController` | Updates local clients; comment re: production PRMS API | Keep; UI placeholder in panel |
| `POST /integration/projects` | `integrationController.createProject` | Inserts into `prms_projects` (local) | Used by PRMS Demo; no user-facing change |
| Notifications | `notificationService.js` | "execute and update PRMS", "executed in PRMS" | Copy is correct; no change |

**Summary:** Backend is already placeholder-ready; comments and UI notes complete the picture.

---

## 10. Other references

| Touch point | Location | Placeholder needed |
|-------------|----------|--------------------|
| Form Builder – source system "PRMS" | `FormBuilder.vue` | No; admin config only |
| ClientProspectCombobox – "PRMS Clients" section label | `ClientProspectCombobox.vue` | Optional: "Clients (in production from PRMS)" |
| Landing page – "Envision PRMS" link | `LandingPage.vue` | No (navigation) |
| Report data – linkedToPRMS, prms_client_id | `reportDataService.js` | No (data only) |

---

## Priority order for placeholder coverage

1. **High (user-facing, explicit PRMS action)**  
   - **FetchPRMSDataModal** on COI Request Form (and optionally Finance PRMS tab).  
   - **Prospect Management:** Note near "Check PRMS" and PRMS Status filter.  
   - **Admin:** One line each in Parent Company panel and Client Creation modal/panel.

2. **Medium (user sees "PRMS" but data is COI)**  
   - **COI Request Detail:** "Client in PRMS" System Checks note.  
   - **Finance Dashboard:** PRMS Sync tab subtitle.  
   - **ProspectConversionModal:** One line that PRMS is simulated.

3. **Low (optional polish)**  
   - Execute proposal: post-action note or link to PRMS Demo.  
   - Compliance "PRMS Database" tooltip.  
   - PRMS Demo banner; ClientProspectCombobox label.

---

## Files to touch (checklist)

- `frontend/src/components/integration/FetchPRMSDataModal.vue` (new)
- `frontend/src/views/COIRequestForm.vue` (modal + optional tooltip)
- `frontend/src/views/COIRequestDetail.vue` (System Checks note)
- `frontend/src/views/ProspectManagement.vue` (Check PRMS + filter note)
- `frontend/src/views/FinanceDashboard.vue` (PRMS Sync subtitle + optional button)
- `frontend/src/components/admin/ParentCompanyUpdateRequestsPanel.vue` (one line)
- `frontend/src/components/admin/ClientCreationReviewModal.vue` or panel (one line)
- `frontend/src/components/engagement/ProspectConversionModal.vue` (one line)
- Optional: `AdminDashboard.vue` (post-execute note / link), `ComplianceActionPanel.vue` (tooltip), `PRMSDemo.vue` (banner), `ClientProspectCombobox.vue` (label)

No backend API changes required for placeholders beyond existing behavior; optional `GET /integration/prms/clients/search` only if modal needs search-by-code.
