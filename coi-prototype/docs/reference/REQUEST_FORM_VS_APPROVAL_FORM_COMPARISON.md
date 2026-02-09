# Request Form vs Approval Form – Field & Mapping Comparison

**Build verification:** Compare COI **input request form** (COIRequestForm.vue) with **approval/detail view** (COIRequestDetail.vue) for field parity and mapping consistency.

## Implementation status (parity achieved)

The following recommendations have been implemented:

- **Department and line of service:** The approval view now shows both `request.department` and `request.line_of_service` (two rows in Request Details).
- **Draft save:** Backend `updateRequest` (PUT `/coi/requests/:id`) now persists all standard form fields and `global_coi_form_data` for draft requests.
- **global_coi_form_data:** Column added to `coi_requests` in init.js; included in createRequest INSERT and updateRequest UPDATE; stored as JSON string.
- **getRequestById:** Resolves and returns `backup_approver_name` and `lead_source_name` for display.
- **Approval view parity:** COIRequestDetail now displays all previously missing fields: designation, language, lead source, backup approver; client status, regulated body, group structure, parent company, company type, ownership %, control type; service category, sub-category, global service (when international), requested period, external deadline, deadline reason; full ownership structure, related affiliated entities, international operations flag; and an expandable Global COI Form summary (countries and entities) when `international_operations` is true and `global_coi_form_data` is present.

---

## 1. Data flow

| Stage | Source | Notes |
|-------|--------|--------|
| **Input** | `COIRequestForm.vue` → `formData` | User fills form; payload uses camelCase/snake_case keys matching backend |
| **Persist** | `coiController.createRequest` / draft save | Uses `STANDARD_FIELD_MAPPINGS` (field_id → db_column); some columns set from server (e.g. `department` from user) |
| **API response** | `getRequestById` | Returns `...request` (DB row) + `client_name`, `client_code`, `requester_name` (from users), `director_approval_by_name`, etc. |
| **Approval view** | `COIRequestDetail.vue` | Reads `request.*` from API; displays a subset of fields |

---

## 2. Field comparison matrix

### 2.1 Request details (Section 1–2 style)

| Form field (COIRequestForm) | Backend column / API | Shown on approval (COIRequestDetail) | Mapping note |
|-----------------------------|----------------------|--------------------------------------|--------------|
| `requestor_name` | `requestor_name` | Yes – `request.requestor_name \|\| request.requester_name` | API also returns `requester_name` from users join; detail uses both. OK. |
| `line_of_service` | `line_of_service` | No – detail shows `request.department` only | **Difference:** Detail shows “Department” but uses `request.department` (set from **user.department** at create), not form’s `line_of_service`. Approvers see org unit, not the form’s line of service. |
| `designation` | `designation` | **No** | Not displayed on approval view. |
| `entity` | `entity` | Yes – `request.entity` | OK. |
| `requested_document` | `requested_document` | Yes – `request.requested_document` | OK. |
| `language` | `language` | **No** | Not displayed on approval view. |
| `lead_source_id` | `lead_source_id` | **No** | Not displayed on approval view. |

### 2.2 Client details

| Form field | Backend column / API | Shown on approval | Mapping note |
|------------|----------------------|-------------------|--------------|
| `client_id` | `client_id` | Used implicitly (client_name, client_code from join) | OK. |
| `client_name` | (from clients join) | Yes – `request.client_name` | API merges client_name from clients table. OK. |
| `client_code` | (from clients join) | Yes – `request.client_code` | OK. |
| `client_type` | `client_type` | Yes – `request.client_type` | OK. |
| `client_location` | `client_location` | Yes – `request.client_location` | OK. |
| `client_status` | `client_status` | **No** | Not displayed on approval view. |
| `relationship_with_client` | `relationship_with_client` | Yes – `request.relationship_with_client` | OK. |
| `regulated_body` | `regulated_body` | **No** | Not displayed on approval view. |
| `pie_status` | `pie_status` | Yes – `request.pie_status` | OK. |
| `group_structure` | `group_structure` | **No** | Not displayed on approval view. |
| `parent_company` | `parent_company` | **No** | Not displayed on approval view. |
| `company_type` | `company_type` | **No** | Not displayed on approval view. |
| `ownership_percentage` | `ownership_percentage` | **No** | Not displayed on approval view. |
| `control_type` | `control_type` | **No** | Not displayed on approval view. |

### 2.3 Service & engagement

| Form field | Backend column / API | Shown on approval | Mapping note |
|------------|----------------------|-------------------|--------------|
| `service_type` | `service_type` | Yes – in header and elsewhere | OK. |
| `service_category` | `service_category` | **No** | Not displayed on approval view. |
| `service_sub_category` | `service_sub_category` | **No** | Not displayed on approval view. |
| `global_service_category` | `global_service_category` | **No** | Not displayed on approval view. |
| `global_service_type` | `global_service_type` | **No** | Not displayed on approval view. |
| `service_description` | `service_description` | Yes – “Service Description” block | OK. |
| `requested_service_period_start` | `requested_service_period_start` | **No** | Not displayed on approval view. |
| `requested_service_period_end` | `requested_service_period_end` | **No** | Not displayed on approval view. |
| `external_deadline` | `external_deadline` | **No** | Not displayed on approval view. |
| `deadline_reason` | `deadline_reason` | **No** | Not displayed on approval view. |

### 2.4 Ownership & international

| Form field | Backend column / API | Shown on approval | Mapping note |
|------------|----------------------|-------------------|--------------|
| `full_ownership_structure` | `full_ownership_structure` | **No** | Not displayed on approval view. |
| `related_affiliated_entities` | `related_affiliated_entities` | **No** | Not displayed on approval view. |
| `international_operations` | `international_operations` | **No** | Not displayed on approval view. |
| `global_coi_form_data` | `global_coi_form_data` (if column exists) or custom_fields | **No** | Not displayed on approval view. Countries/entities not shown. |
| `country_code` / `foreign_subsidiaries` | `foreign_subsidiaries` | **No** | Not displayed on approval view. |
| `backup_approver_id` | `backup_approver_id` | **No** | Not displayed on approval view. |

### 2.5 Backend-only / workflow

| Item | Set by | Shown on approval |
|------|--------|-------------------|
| `department` | Backend at create: `user.department` | Yes – as “Department” |
| `stage` | Backend | Yes – `request.stage` |
| `request_id` | Backend | Yes |
| `requester_name` | API: from users join (or requestor_name) | Yes – via requestor_name \|\| requester_name |
| `created_at` | Backend | Yes |

---

## 3. Summary of differences

### 3.1 Mapping / semantic differences

1. **Department vs line of service**
   - **Form:** User sees “Department” but the field is `formData.line_of_service` (and may be pre-filled from `authStore.user?.department`).
   - **Backend create:** Writes `user.department` into `coi_requests.department` and form’s `line_of_service` into `coi_requests.line_of_service`.
   - **Approval view:** Shows `request.department` (user’s org at create time), not `request.line_of_service`.
   - **Risk:** If “Department” on the form is meant to be the same as what approvers see, they should match. If the form allows changing “line of service” to something different from the user’s department, approvers never see that; they only see `department`.

2. **Requestor name**
   - **Form:** `requestor_name`.
   - **API:** Returns both `requestor_name` (DB) and `requester_name` (from users join).
   - **Detail:** `request.requestor_name || request.requester_name`. Correct and safe.

### 3.2 Fields on form but not on approval view

Approvers do **not** see these submitted values on the main detail/approval view:

- Designation  
- Language  
- Lead source  
- Client status  
- Regulated body  
- Group structure  
- Parent company  
- Company type  
- Ownership % / control type  
- Service category / sub-category  
- Global service category / type  
- Requested service period (start/end)  
- External deadline / deadline reason  
- Full ownership structure  
- Related affiliated entities  
- International operations (flag)  
- Global COI form data (countries + entities)  
- Backup approver  

So the **approval form shows a subset** of the request; many compliance- and engagement-relevant fields exist only on the request form and in the DB/API.

---

## 4. Recommendations (build verification)

1. **Department / line of service**
   - Decide whether “Department” on the approval view should be:
     - `request.department` (current), or
     - `request.line_of_service` (form value), or
     - both (e.g. “Department: X, Line of service: Y”).
   - If the form allows a different line of service than the user’s department, approvers should see the form value; consider showing `request.line_of_service` or both.

2. **Approval view completeness**
   - Consider surfacing on the approval/detail view (at least for relevant roles):
     - Designation, language (if needed for audit)
     - Regulated body, client status (compliance)
     - Group structure, parent company, company type, ownership % (governance / IESBA)
     - Service category / sub-category (and global service type if international)
     - Requested service period, external deadline
     - Full ownership structure, related affiliated entities (or a short summary)
     - International operations flag and, when true, a summary or expandable section of Global COI Form (countries/entities) from `global_coi_form_data`
     - Backup approver (e.g. name resolved from `backup_approver_id`)

3. **Single source of truth**
   - Backend `STANDARD_FIELD_MAPPINGS` and create/update logic are the single source for form field → DB column mapping.
   - Detail view should use the same property names as the API (which returns DB column names plus merged fields). No extra client-side mapping is required except for display labels and optional fallbacks (e.g. requestor_name || requester_name).

4. **global_coi_form_data**
   - Confirm how draft save persists `global_coi_form_data` (column vs custom_fields) so that submitted requests always have it available for approval view and for duplication/conflict logic.

**Status:** All four recommendations above have been implemented (see "Implementation status" at the top of this document).

---

## 5. Reference files

| Purpose | File |
|--------|------|
| Request form (input) | `coi-prototype/frontend/src/views/COIRequestForm.vue` |
| Approval / detail view | `coi-prototype/frontend/src/views/COIRequestDetail.vue` |
| Backend create + field mapping | `coi-prototype/backend/src/controllers/coiController.js` (STANDARD_FIELD_MAPPINGS, createRequest, getRequestById) |
| Backend field resolution | `coi-prototype/backend/src/services/fieldMappingService.js` |
| Response mapper (role-based) | `coi-prototype/backend/src/utils/responseMapper.js` |

---

*Generated for build verification – Request form vs Approval form field and mapping comparison.*
