# B11 — Rule Builder: Seed Rules + Computed Fields + Recommendation Modal — Implementation Plan

**Purpose:** (B11a) Seed ~15 default CMA/IESBA rules on DB init; (B11b) Add computed fields to rule evaluation; (B11c) Add a recommendation detail modal in Compliance so users can Accept/Override/Dismiss per rule and send that data to the existing approve API.

**Scope:** Database seed, [fieldMappingService.js](coi-prototype/backend/src/services/fieldMappingService.js), [ComplianceDashboard.vue](coi-prototype/frontend/src/views/ComplianceDashboard.vue), optional [RecommendationDetailModal.vue](coi-prototype/frontend/src/components/compliance/RecommendationDetailModal.vue). Backend approve API already accepts `acceptedRecommendations`, `rejectedRecommendations`, `overriddenRecommendations`.

### Naming conventions (consistency)

- **Database/backend:** Snake_case for columns and JSON keys from API (e.g. `rule_category`, `guidance_text`, `days_since_submission`).
- **Frontend:** CamelCase for component props and reactive state (e.g. `ruleRecommendations`, `acceptedRecommendations`). Map API keys to camelCase where needed.
- **Files:** PascalCase for Vue components (`RecommendationDetailModal.vue`), lowercase-with-dash for scripts (`seed-rules.sql`).

### Task dependencies and order

- **B11a** must be completed before **B11b**: rule evaluation uses `business_rules_config`; seeded rules may reference the new computed fields.
- **B11b** must be completed before **B11c** is meaningfully testable: recommendations are produced by the engine using the enhanced request data.
- **B11c** is independent of B11a/B11b for UI implementation but requires recommendations to exist for end-to-end verification.

**Recommended implementation order:** B11a → B11b → B11c. Each phase has verification and testing steps in **Section 6**.

### Documentation and handover

- Update or cross-reference [COI_Customer_Testing_Execution_Plan.md](docs/production-handover/COI_Customer_Testing_Execution_Plan.md) B11 section when seed rule set or modal behaviour is finalized.
- Document any new env or startup behaviour (e.g. “seed rules run on first init”) in [COI_Handover_Summary_for_Claude_Code.md](docs/production-handover/COI_Handover_Summary_for_Claude_Code.md) or production-handover README if relevant.

### Error handling (general)

- **Database:** All queries use parameterized statements; catch DB errors in callers (e.g. rule evaluation, init) and log with `console.error`; return safe defaults or rethrow as appropriate. Never expose raw DB errors to the client.
- **Computed fields:** Validate/null-check inputs before calculations; set sensible defaults (e.g. 0, false) when data is missing so rule engine does not receive undefined.
- **Frontend:** Validate override justification when user selects Override; show inline error until justification is provided. On approve API failure, show user-friendly toast/alert and do not clear modal state until success.

---

## 1. Current State

- **business_rules_config:** Table ensured in [init.js](coi-prototype/backend/src/database/init.js) with core columns; init adds Pro columns: `rule_category`, `regulation_reference`, `applies_to_pie`, `confidence_level`, `can_override`, `override_guidance`, `guidance_text`. Column `applies_to_cma` is added in a later init block. Init seeds 3 default rules if table is empty (simple conflict rules only).
- **fieldMappingService.prepareForRuleEvaluation:** Only copies common fields via `getValue()`; does **not** set `days_since_submission`, `is_group_company`, `engagement_duration` (months), or `has_active_audit`.
- **Recommendations:** [businessRulesEngine.js](coi-prototype/backend/src/services/businessRulesEngine.js) returns objects with `ruleId`, `ruleName`, `ruleType`, `recommendedAction`, `reason`, `confidence`, `canOverride`, `overrideGuidance`, `requiresComplianceReview`, `guidance`, `regulation`. Stored in request payload as `ruleRecommendations` and persisted (e.g. in compliance_audit_log). Frontend [ComplianceDashboard.vue](coi-prototype/frontend/src/views/ComplianceDashboard.vue) shows recommendation count/summary (`getRecommendationsSummary` uses `r.severity`; backend returns `confidence` — use `confidence` as severity for display if `severity` absent).
- **Compliance approve:** [coiController.js](coi-prototype/backend/src/controllers/coiController.js) around line 1069 reads `acceptedRecommendations`, `rejectedRecommendations`, `overriddenRecommendations` from `req.body` and passes them to `logComplianceDecision`. [ComplianceDashboard.vue](coi-prototype/frontend/src/views/ComplianceDashboard.vue) `handleApprove()` currently sends only `status` and `comments` — does **not** send the three recommendation arrays.

---

## 2. B11a — Seed Rules

### 2.1 Create seed file

- **New file:** `coi-prototype/database/seed-rules.sql`
- **Content:** ~15 default rules as in [COI_Customer_Testing_Execution_Plan.md](docs/production-handover/COI_Customer_Testing_Execution_Plan.md) (B11 section): CMA red lines (2), IESBA red lines (3), IESBA PIE (2), independence (3), workflow (1), group/international (2). Use explicit column lists in every INSERT.
- **Columns to use (must exist):** `rule_name`, `rule_type`, `condition_field`, `condition_operator`, `condition_value`, `action_type`, `action_value`, `is_active`, `approval_status`, `created_by`, `rule_category`, `regulation_reference`, `applies_to_cma`, `applies_to_pie`, `confidence_level`, `can_override`, `guidance_text`. Ensure `created_by` is 1 (or first Super Admin id) and `approval_status` = 'Approved'.
- **Data integrity:** Add a short comment above each rule (or block) in seed-rules.sql describing the rule's purpose and regulatory context (e.g. CMA red line; IESBA PIE) for auditability.

### 2.2 Idempotency and script placement (decision)

- **Idempotency:** Use conditional insert in init: only run seed when count of CMA/IESBA rules is below 15 (or 0 for first-time only). Alternatively use unique constraint on (rule_category, rule_name) with INSERT OR IGNORE. Prefer count-and-skip in init to avoid duplicate rows.
- **Script placement:** Run the seed from init.js after business_rules_config and all Pro columns exist. In init: read seed-rules.sql (via fs/path), check row count; if below threshold, db.exec(sql) or parameterized INSERTs. Do not add a standalone script unless ops need to re-seed without full init; if added, document in script and handover docs.
- **Comments in seed-rules.sql:** Add a short comment above each rule (or block) describing purpose and regulatory context (e.g. CMA red line, IESBA PIE) for auditability.

### 2.3 Schema verification

- Confirm init adds `applies_to_cma` (already in init around line 1388). Confirm `guidance_text` is in the Pro columns list (already at 666). No schema change required if columns exist; if any INSERT column is missing, add an `ALTER TABLE` in init or a migration before seeding.

---

## 3. B11b — Computed Fields in prepareForRuleEvaluation

**File:** [fieldMappingService.js](coi-prototype/backend/src/services/fieldMappingService.js)

**Function:** `prepareForRuleEvaluation(requestData)`

Add the following **after** the existing common-fields loop and **before** `return enhanced`:

1. **days_since_submission**  
   - **Date handling:** Check for null/undefined before using any date; invalid or missing date → set `enhanced.days_since_submission = 0`.  
   - Use `requestData.submitted_at` if present; otherwise use `requestData.created_at` (or `updated_at`) as a proxy for submission time when status is not Draft.  
   - Formula: `Math.floor((Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24))`.  
   - **Default:** 0 when no valid date. Add a short comment in code: e.g. "Days since request entered workflow; used by staleness/lapse rules."

2. **is_group_company**  
   - `enhanced.is_group_company = !!(requestData.parent_company_id != null && requestData.parent_company_id !== '')`.  
   - **Default:** false when missing. Comment in code: "True if client has a parent company; used for group conflict rules."

3. **engagement_duration** (months)  
   - **Date handling:** Only compute when both start and end are valid (non-null, parseable); otherwise set `enhanced.engagement_duration = 0`.  
   - Formula: `Math.round((end - start) / (1000 * 60 * 60 * 24 * 30))`.  
   - Comment in code: "Duration in months for long-duration engagement rules (e.g. > 36 months)."

4. **has_active_audit**  
   - **Default:** false when `client_name` is missing or empty.  
   - Query: same client, service_type containing "Audit", status in ('Approved','Active'). Exclude current request when `requestData.id` is set: `AND id != ?`.  
   - **Parameterized queries:** Use only `db.prepare('...').get(clientName, requestId)` (or `.get(clientName)` when no id); never concatenate user input into SQL.  
   - `enhanced.has_active_audit = (row && row.count > 0)`. Use `getDatabase()` at top of function (or existing pattern in file).  
   - **Performance:** Consider an index on client_name (and status/service_type) if not present for the has_active_audit lookup; document in init or schema if added.

**Dependencies:** None beyond existing `getDatabase()`. Ensure `fieldMappingService` does not create circular dependency with `businessRulesEngine` (it doesn’t).

---

## 4. B11c — Recommendation Detail Modal

### 4.1 Data shape

- Recommendations on a request come from `request.rule_recommendations` (JSON array). Each item has: `ruleId`, `ruleName`, `ruleType`, `recommendedAction`, `reason`, `confidence` (backend; frontend may treat as `severity`), `canOverride`, `overrideGuidance`, `guidance`, `regulation`.  
- For display, use `confidence` as the severity/level if `severity` is missing (so “Critical/High/Medium” labels work).

### 4.2 Component choice (decision)

- **Decision:** Use a **separate component** [RecommendationDetailModal.vue](coi-prototype/frontend/src/components/compliance/RecommendationDetailModal.vue) for reuse, testability, and clearer separation of concerns. ComplianceDashboard (and COIRequestDetail if added later) opens this modal when the user clicks "Review recommendations" from the request row or from inside the review modal.
- **Props:** Pass `recommendations` (array), `requestId` (optional, for context), and `modelValue` or `show` for visibility.
- **Events:** Emit `close` and `confirm` with payload `{ acceptedRecommendations, rejectedRecommendations, overriddenRecommendations }` so the parent can store state and send it on Approve. Use Vue 3 pattern: props down, events up; no direct mutation of parent state from the modal.

### 4.3 Modal content (per rule)

- For each recommendation: **rule name**, **category** (from rule_category if stored on recommendation, or “Rule”), **confidence/severity**, **action type**, **reason**, **guidance text**.  
- **Actions per rule:**  
  - **Accept** — add this rule to “accepted” list.  
  - **Override** — add to “overridden” list and require a short **justification** (textarea). Only show if `canOverride` is true.  
  - **Dismiss** — add to “rejected” list (or “dismissed”; backend uses `rejectedRecommendations`).  
- Summary line: e.g. “3 of 5 accepted, 1 overridden, 1 dismissed.”


### 4.3a State management

- Use Vue's reactivity: hold per-rule choices (accepted / overridden / dismissed) and override justifications in refs or reactive state inside the modal (or in the parent keyed by request id). When the user confirms, emit the three arrays to the parent; parent stores them (e.g. `recommendationChoicesByRequestId[requestId]`) and passes them into the approve request. No need for Vuex/Pinia for this flow unless recommendation state is shared across many views.

### 4.3b Validation

- **Override justification:** When the user selects Override for a rule, require a non-empty justification (e.g. min length or required validation on the textarea). Disable Done/Apply or show an inline error until every overridden rule has a justification. Do not allow submitting the modal with empty override reasons.

### 4.3c UI/UX

- Provide clear labels for each action (Accept / Override / Dismiss) and a short instruction at the top. Ensure the summary line is visible so the user sees how many are accepted, overridden, and dismissed before confirming.

### 4.4 Wiring to approve API

- When Compliance approves (either from ComplianceDashboard review modal or from COIRequestDetail), include in the approve request body:  
  `acceptedRecommendations`, `rejectedRecommendations`, `overriddenRecommendations`.  
- **Format:** Arrays of identifiers (e.g. `ruleId`) or full objects; backend [coiController.js](coi-prototype/backend/src/controllers/coiController.js) and [auditTrailService.js](coi-prototype/backend/src/services/auditTrailService.js) already accept arrays and JSON-stringify them. Use the same shape as already documented (e.g. array of rule ids or `{ ruleId, justification }` for overrides).  
- **ComplianceDashboard:** In `handleApprove` (and any “approve with restrictions” path), build the three arrays from the recommendation modal state (or from inline per-rule choices) and send them in the POST body along with `approval_type` and `comments`/`restrictions`.  
- **COIRequestDetail.vue:** If Compliance can also approve from the request detail page, ensure the same three arrays are sent when the approval form includes recommendation handling (if that UI is added there; otherwise B11c can be limited to ComplianceDashboard).

### 4.5 UX flow

1. User filters or opens a request that has `rule_recommendations` (length > 0).  
2. User opens the request (e.g. “View details” or review modal).  
3. A “Review recommendations” or “Recommendation detail” control opens the modal (or expands an inline block).  
4. User sets Accept / Override (with justification) / Dismiss for each rule; modal shows summary.  
5. User confirms (e.g. “Done” or “Apply”). Modal closes and state is stored (e.g. in a ref keyed by request id).  
6. When user clicks “Approve” (or “Approve with restrictions”), the approve request includes the three arrays from that state.

---

## 5. File checklist and documentation

| Item | File | Action |
|------|------|--------|
| B11a | coi-prototype/database/seed-rules.sql | Create; ~15 INSERTs with correct columns; add comments above each rule describing purpose and regulatory context. |
| B11a | coi-prototype/backend/src/database/init.js | After business_rules_config + applies_to_cma, run seed (exec SQL or insert-if-empty). |
| B11b | coi-prototype/backend/src/services/fieldMappingService.js | In prepareForRuleEvaluation, add days_since_submission, is_group_company, engagement_duration, has_active_audit; use getDatabase() and parameterized queries; add brief comments for each computed field; set defaults for missing data. |
| B11b | (optional) backend tests | Add or extend unit tests for prepareForRuleEvaluation: null/missing dates, empty client_name, has_active_audit query with parameterized args. |
| B11c | RecommendationDetailModal.vue | New component: props (recommendations, requestId, show); emit confirm with three arrays; validation for override justification; document component in code or storybook. |
| B11c | ComplianceDashboard.vue | Integrate modal; "Review recommendations" entry point; store recommendation choices (e.g. ref keyed by request id); pass three arrays into handleApprove; document changes (e.g. "B11c: recommendation detail modal and approval payload"). |
| B11c | ComplianceDashboard.vue handleApprove | Send acceptedRecommendations, rejectedRecommendations, overriddenRecommendations in POST body. |

**Commit / handover:** Include a short summary in commit message or handover note: e.g. "B11: seed CMA/IESBA rules, computed fields for rule evaluation, Compliance recommendation detail modal with Accept/Override/Dismiss and approval API payload."

---

## 6. Verification and testing strategy

### B11a — Seed rules

- After DB init, query `SELECT COUNT(*) FROM business_rules_config WHERE rule_category IN ('CMA','IESBA') OR rule_category = 'Custom'` — expect at least ~15 rows. Rule names from execution plan appear.
- Verify no duplicate rules: check that re-running init (or seed) does not create duplicate rows (idempotency).
- Spot-check a few rule rows for correct columns (rule_category, regulation_reference, guidance_text, applies_to_cma, applies_to_pie).

### B11b — Computed fields

- Submit or load a request with dates and client; trigger rule evaluation (e.g. submit a COI request); verify in logs or by rule outcome that rules using `engagement_duration`, `days_since_submission`, `is_group_company`, or `has_active_audit` fire when expected.
- **Edge cases:** Test with missing dates (expect days_since_submission = 0, engagement_duration = 0); empty client_name (expect has_active_audit = false); null parent_company_id (expect is_group_company = false). Ensure no undefined or thrown errors.

### B11c — Recommendation modal

- As Compliance, open a request that has recommendations; open recommendation detail modal; set Accept / Override (with justification) / Dismiss per rule; confirm summary line updates.
- **Validation:** Confirm that Override requires a justification (Done/Apply disabled or inline error until filled).
- **API:** Click Approve and confirm the approval request body includes `acceptedRecommendations`, `rejectedRecommendations`, `overriddenRecommendations` with correct shape; confirm audit log or backend receives and logs them.

---

## 7. Out of Scope / Notes

- **Rule priority/ordering:** Not required for B11; can be added later.  
- **Rule expiration dates, export/import:** Deferred.  
- **severity vs confidence:** Backend returns `confidence`; frontend summary currently uses `severity`. Either map `confidence` to `severity` in the API response for the request, or in the frontend use `r.confidence || r.severity` for display so both work.  
- **submitted_at:** If `coi_requests` has no `submitted_at` column, use `created_at` (or first non-Draft transition) for `days_since_submission`; if you add `submitted_at` later, switch the computed field to use it.
