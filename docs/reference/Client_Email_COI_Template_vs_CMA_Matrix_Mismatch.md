# COI Template vs CMA Matrix — Mismatch and Suggested Options

**Purpose:** Client-facing summary for email.  
**Date:** January 2026.

---

## Problem Statement

The **COI (Conflict of Interest) request form** used in practice is based on a **generic COI template** (e.g. Line of Service, Service Type dropdowns). The **CMA (Capital Markets Authority) Matrix** that governs Kuwait-regulated clients is based on **Law No. (7) of 2010** and uses a **fixed list of 9 CMA service types** and strict combination rules (allowed / prohibited / conditional).

Today, **the template’s fields and service list do not match the CMA Matrix**. As a result:

- **Requestors** choose from a long, business-friendly list (e.g. “Other Advisory Services”, “Transaction Services”, “Other Services”) that does not map one-to-one to the 9 CMA services.
- **Compliance** cannot reliably tell whether a selected service falls under a CMA-regulated category (e.g. Investment Advisor, Asset Valuation, AML/CFT Assessment) without extra clarification.
- **Risk:** Engagements that are in scope of the CMA Matrix can be recorded under generic labels (e.g. “Other Advisory Services” or “Other Services”), so they are not consistently checked against the matrix and may bypass the intended controls.

In short: **the same form is used both for general COI workflow and for CMA-specific rules, but the template was not designed around the CMA Matrix**, so alignment is missing and compliance is harder to enforce.

---

## How the Template and Its Fields Do Not Match the CMA Matrix

### 1. Different service lists

| Aspect | COI Template (form) | CMA Matrix |
|--------|----------------------|------------|
| **Source** | Operational form / Global COI-style list | CMA Law No. (7) of 2010, Executive Bylaws (Modules 9, 15, 16, 17) |
| **Purpose** | Data collection, workflow, reporting | Define which service **combinations** are allowed/prohibited for the same client |
| **Service count** | Many options (e.g. 30–40+ in Kuwait list, 6 Line of Service categories) | **Exactly 9** CMA service types |
| **Wording** | Business-friendly (e.g. “Statutory Audit Services”, “Other Advisory Services”, “Other Services”) | Legal/regulatory (e.g. “External Audit”, “An Investment Advisor”, “Valuation of the assets”, “Assessment on the level of compliance with … AML/CFT Law”) |

So: **one dropdown value in the template often does not map to a single CMA service**, and some template options (e.g. “Other Services”, “Not Applicable”) have **no** direct CMA equivalent.

### 2. Catch-all options hide CMA-regulated work

The template includes **broad categories** that can cover both CMA-regulated and non-CMA work:

- **“Advisory”** and **“Other Advisory Services”**  
  Can include: Valuation, Investment Advisory, AML/CFT-related work (all in the CMA Matrix) or general consulting (not in the matrix). The form does not distinguish these unless we add a separate mechanism.

- **“Other Services”** and **“Not Applicable”**  
  Used when the engagement “doesn’t fit” the other lines of service. Some of these engagements may still fall under one of the 9 CMA services (e.g. internal audit, risk management). The template does not ask, so the system cannot reliably apply the matrix.

So: **template fields and dropdown choices do not, by themselves, match the CMA Matrix**; they only match after we add rules or clarification.

### 3. No direct link from form fields to matrix rules

- The **CMA Matrix** is a **9×9 combination matrix** (Service A + Service B → Allowed / Prohibited / Conditional).
- The **template** collects **one service per request** (Line of Service + Service Type) and does not:
  - Identify which of the 9 CMA services (if any) the selection corresponds to, or  
  - Store a **CMA service code** so that combination checks and reporting can be run against the matrix.

So: **even when a selection could map to a CMA service, the form does not currently require or store that mapping** in a way that aligns with the matrix.

### 4. Naming and “duplicate” confusion

- **“Advisory”** appears as both a **Line of Service** and inside options (e.g. “Other Advisory Services”).
- **“Other Services”** appears as both a **category** and a **service type**.
- Users can reasonably think “Advisory” and “Other Services” are similar or duplicate, and may choose the wrong one. That makes it harder to interpret data consistently and to map cleanly to the CMA Matrix.

---

## Suggested Options (for client decision)

We suggest choosing one or a combination of the following, depending on how much you want to change the current template vs. add safeguards.

### Option A — Keep template wording; add clarification only (minimal change)

- **What:** Do not change the COI template’s field labels or dropdown list. Add **short helper text** (and, if needed, internal guidance) so users understand:
  - “Advisory” = consulting and non-audit services.
  - “Other Services” = engagements that do not fit Audit, Tax, Accounting, IT, or Advisory.
- **Pros:** No change to existing forms or data; quick to implement.  
- **Cons:** Does not by itself align template choices with the CMA Matrix; compliance still depends on manual interpretation.

**Use when:** You want to reduce confusion only and are comfortable with compliance resolving ambiguity manually.

---

### Option B — Clarification modal for “ambiguous” services (recommended technical safeguard)

- **What:** Keep the current template list, but when a **Kuwait (CMA) client** selects a **catch-all** service type (e.g. “Other Advisory Services”, “Other Services”, “Transaction Services”, “Due Diligence Services”, “Management Consulting Services”, “Other Audit Services”), the **system shows a short clarification step** (one question with fixed options) before accepting the choice.  
  The answer is used to set a **CMA service code** (or “none”) and stored for audit and for applying the CMA Matrix.
- **Pros:**  
  - Template stays as-is; no need to change form labels or dropdowns.  
  - Ensures that ambiguous selections are explicitly mapped to the CMA Matrix (or to “no CMA service”) before the request is accepted.  
  - Reduces the risk of CMA-regulated work being hidden under generic options.
- **Cons:** One extra step for the requestor when they choose an ambiguous service for a Kuwait client.

**Use when:** You want to keep the current template but enforce a clear link between form choices and the CMA Matrix for Kuwait clients.

---

### Option C — Rename categories/options for clarity (no new modal)

- **What:** Change **labels only** (in system and any printed form), for example:  
  - “Other Services” (category) → e.g. “General / Other” or “Other (non-Advisory)” so it is clearly distinct from “Advisory”.  
  - “Other Advisory Services” → e.g. “Other Advisory” so it is clearly “other under Advisory” and less easily confused with “Other Services”.  
- **Pros:** Reduces perceived duplication and clarifies intent without adding a clarification step.  
- **Cons:** Does not by itself map choices to the 9 CMA services; compliance still needs to interpret.

**Use when:** You want clearer naming without introducing the clarification modal.

---

### Option D — Align template dropdown with CMA where possible (larger change)

- **What:** For **Kuwait (or CMA) clients only**, show a **service list that is aligned with the 9 CMA services** (and optionally a small “Other / Not in matrix” option). For other clients, keep the current template list.
- **Pros:** Form choices map directly to the CMA Matrix; combination checks and reporting are straightforward.  
- **Cons:** Two different service lists to maintain; possible training and support overhead; may require change control and user communication.

**Use when:** You are willing to change the user experience for Kuwait clients to prioritise strict alignment with the CMA Matrix.

---

### Option E — “More information required” workflow (human review)

- **What:** When a requestor selects an ambiguous service for a Kuwait client, the system does **not** block or clarify in-form. Instead, the request is flagged as **“More information required”** and routed to Compliance (and optionally Director). Compliance and the requestor exchange messages (or use a simple workflow) until Compliance can determine whether the engagement touches the CMA Matrix and how to record it.
- **Pros:** Compliance has full control and can handle complex or unusual cases.  
- **Cons:** Slower; depends on back-and-forth; less automated and less auditable than a structured clarification step.

**Use when:** You prefer human judgement over an in-form clarification for ambiguous cases.

---

## Recommendation (short)

- **Immediate:** Use **Option A** (helper text) to reduce confusion between “Advisory” and “Other Services” with no change to the template.  
- **For CMA alignment:** Implement **Option B** (clarification modal for ambiguous services) so that template fields are explicitly linked to the CMA Matrix (or “no CMA”) for Kuwait clients, without changing the template’s structure.  
- **Optional:** Add **Option C** (renaming) if you want clearer labels in addition to Option B.  
- **Option D** or **Option E** can be considered later if you decide you need a different balance between user experience, compliance control, and automation.

---

## Next steps we suggest

1. **Confirm** which option(s) you want to adopt (A only; A + B; A + B + C; etc.).  
2. **Confirm** whether the list of “ambiguous” service types (Other Advisory Services, Other Services, Transaction Services, Due Diligence Services, Management Consulting Services, Other Audit Services) is correct for your process or should be adjusted.  
3. **Confirm** that the suggested clarification questions and options (e.g. for “Other Advisory Services”: Valuation, Investment Advisory, AML/CFT, None of the above) are acceptable from a compliance and legal perspective.  
4. We will then align implementation (and any training/communications) with your choices.

If you prefer, we can schedule a short call to walk through the mismatch and options and agree the way forward.

---

*This note is for discussion and decision. It does not constitute legal or regulatory advice.*
