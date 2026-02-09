# PRMS Deep Visibility for Compliance and Partner

## 0. Data segregation (authoritative)

- **Compliance:** Sees **everything except commercials and financial info** (no fees, engagement codes, financial_parameters, fee_details). Response mapper and API design enforce this.
- **Partner:** **No limits** — full visibility across the COI system.

All PRMS-related visibility for these roles must respect the above. The "View PRMS data" modal uses the existing `GET /integration/prms/client/:id` endpoint, which returns only client master fields (name, code, status, industry, commercial_registration, parent_company) and no fees or engagement code — so it is safe for Compliance.

---

## 1. Is this a good feature?

**Yes.** Compliance and Partner need **deep visibility** into request context to make informed decisions. Where that context involves PRMS (client master, parent company, project linkage), they should see it with **clear placeholder** messaging so the prototype is honest about integration state and production behavior is understood.

### Why it fits

- **Compliance** reviews full request details (ownership, client, conflicts) but not commercials. Knowing whether the client exists in the client master and what PRMS would show (client name, code, parent company) supports:
  - Data completeness and consistency checks
  - Parent company / group structure verification
  - Clear understanding that “Client in PRMS” in System Checks is backed by PRMS in production

- **Partner** reviews business context, compliance decision, engagement history, and group-level view. Seeing the same PRMS-style client/parent data for the request’s client supports:
  - Strategic and relationship context
  - Consistency with client master before approval
  - Alignment with “engagement history (if existing client)” in the journey

- **Placeholders:** Whenever PRMS is involved, the UI should state that the prototype uses COI data and that in production this comes from PRMS. That keeps the feature correct technically and avoids misleading users.

---

## 2. Current state

| Role       | Where they see PRMS today |
|-----------|----------------------------|
| Compliance | COI Request Detail: System Checks (“Client in PRMS” + note). Verification source dropdown: “PRMS Database” (no tooltip). |
| Partner    | COI Request Detail: same System Checks. Prospect Management: filter + “Check PRMS” note. |

**Gaps**

- Neither role can **open** the same “PRMS data” view (client + parent, placeholder disclaimer) that Requester gets via “Load from PRMS” on the form. So they see a single “Client in PRMS” Yes/No and a line of text, but not the full placeholder payload (client name/code, parent company, “Projects: placeholder”).
- Compliance has no explanation on the “PRMS Database” verification source option.

---

## 3. Feature: Deep PRMS visibility with placeholders

### 3.1 Goal

- Give **Compliance** and **Partner** the same **view-only** “PRMS data” experience for the request’s client when they are on COI Request Detail.
- Keep all PRMS touchpoints for these roles as **placeholders** (clear “prototype vs production” copy).
- Add one small placeholder for Compliance: tooltip on “PRMS Database” verification source.

### 3.2 Scope

**In scope**

1. **COI Request Detail (Compliance and Partner)**  
   - When the request has a `client_id`, show a **“View PRMS data”** link or button in the **System Checks** area (e.g. next to or under “Client in PRMS”).  
   - Click opens **FetchPRMSDataModal** in **view-only** mode:
     - `show=true`, `initialClientId=request.client_id`, `showApplyButton=false`.
     - Clients list: fetch `/integration/clients` when opening the modal (same as Finance Dashboard) and pass to modal.
   - Modal shows the same placeholder disclaimer and result block (client name/code, parent company, Projects: placeholder). No “Apply to form” (read-only).

2. **Compliance Action Panel**  
   - Add a short **tooltip** (or helper text) for the “PRMS Database” verification source option: e.g. “In production, verification can be checked against PRMS.”

3. **No new APIs**  
   - Reuse `GET /integration/prms/client/:clientId` and `GET /integration/clients`. No backend changes.

**Out of scope**

- Letting Compliance or Partner **edit** request form or apply PRMS data to a form (they don’t use the form).
- Giving them access to Finance Dashboard or Requester-only flows.
- Changing data segregation: Compliance continues to see everything except commercials/financial info; Partner has no limits. The View PRMS data modal uses the existing PRMS client endpoint (client master data only; no fees, no engagement code), which is safe for Compliance.

### 3.3 User experience

- **Compliance / Partner** opens a request that has a client.
- In the **System Checks** sidebar they see “Client in PRMS” Yes/No and the existing note “In production, this checks PRMS Client Master.”
- They see a link: **“View PRMS data”** (or “Fetch PRMS data (view only)”).
- Click opens the modal:
  - Client pre-selected (request’s client).
  - They can click “Fetch” to load data (or we could auto-fetch when modal opens for view-only to reduce a click).
  - Result shows client name, code, parent company, “Projects: None (placeholder)” and the standard disclaimer: “PRMS integration is not available. Showing data from COI prototype.”
  - Only “Close” / “Cancel” (no “Apply to form”).

### 3.4 Technical approach

| Item | Approach |
|------|----------|
| Component | Reuse `FetchPRMSDataModal.vue` with `showApplyButton=false`. |
| Where to add control | `COIRequestDetail.vue`: in the System Checks block, after the “Client in PRMS” row (or after the existing placeholder note). |
| Visibility | Show “View PRMS data” only when `request.client_id` is set and user role is Compliance or Partner (optional: also Director/Admin for consistency). |
| Clients for modal | When opening modal, call `GET /integration/clients` and pass the list into the modal (same pattern as Finance Dashboard). Optionally pre-select `request.client_id` and auto-call fetch so the result is visible immediately. |
| Role check | Use `authStore.user?.role` (e.g. `['Compliance','Partner'].includes(role)`). |

### 3.5 Placeholder consistency

- All PRMS-related copy for Compliance and Partner remains **placeholder-clear**:
  - System Checks note (already present).
  - Modal disclaimer (already in FetchPRMSDataModal).
  - New: “PRMS Database” tooltip in Compliance Action Panel.
- Data segregation is unchanged: Compliance sees everything except commercials/financial info; Partner has full visibility. The PRMS client API used by the modal does not return commercial/financial data.

---

## 4. Implementation checklist

- [ ] **COIRequestDetail.vue**
  - Import `FetchPRMSDataModal` and `api`.
  - Add state: `showPrmsModal`, `prmsModalClients` (array).
  - In System Checks section: when `request.client_id` and role is Compliance or Partner, render “View PRMS data” link/button.
  - On click: set `showPrmsModal = true`, fetch `/integration/clients`, set `prmsModalClients`, open modal with `initial-client-id="request.client_id"`, `show-apply-button="false"`.
  - Optional: when modal opens with `initialClientId`, auto-call fetch so result is shown without an extra click (or keep one “Fetch” click for consistency with other uses).
- [ ] **ComplianceActionPanel.vue**
  - Add tooltip or helper text for the “PRMS Database” option: “In production, verification can be checked against PRMS.”
- [ ] **FetchPRMSDataModal.vue**
  - No change required; already supports `showApplyButton=false` and `initialClientId`.
- [ ] **Docs**
  - Update `PRMS_INTEGRATION_TOUCHPOINTS.md` to note that Compliance and Partner have “View PRMS data” on Request Detail and Compliance has “PRMS Database” tooltip.

---

## 5. Success criteria

- Compliance and Partner can open “View PRMS data” from a request that has a client and see the same placeholder client/parent/projects block and disclaimer as other roles.
- All PRMS references for these roles include placeholder wording where applicable.
- No new APIs; no change to auth or data segregation.
