# Suggested List and Leading Questions Mapping

## Purpose

Maps the **suggested list** (Line of Service categories and Service Types) to **leading questions** so users and support can quickly route engagements to the right option and reduce confusion between Advisory and Other Services.

---

## 1. Suggested list (Line of Service categories)

| # | Category (Line of Service) | Role in list |
|---|----------------------------|--------------|
| 1 | Audit & Assurance | Main audit/review/assurance work |
| 2 | Advisory | Consulting and non-audit services |
| 3 | Tax Services | Tax compliance, planning, transfer pricing |
| 4 | Accounting Services | Bookkeeping, accounting, payroll |
| 5 | IT Services | IT advisory, cybersecurity, IT audit |
| 6 | Other Services | Engagements that don’t fit 1–5 |

**Note:** “Advisory” = consulting/non-audit. “Other Services” = catch-all for anything that isn’t Audit, Tax, Accounting, IT, or Advisory.

---

## 2. Leading questions → category mapping

Use these questions to steer the user to the correct Line of Service:

| Leading question | Suggested category |
|------------------|--------------------|
| Is this an audit, review, or assurance engagement? | **Audit & Assurance** |
| Is this consulting, strategy, M&A, risk, valuation, due diligence, or other non-audit advisory? | **Advisory** |
| Is this mainly tax (compliance, planning, transfer pricing)? | **Tax Services** |
| Is this bookkeeping, accounting, or payroll? | **Accounting Services** |
| Is this IT advisory, cybersecurity, or IT audit? | **IT Services** |
| Does it not clearly fit Audit, Tax, Accounting, IT, or Advisory? | **Other Services** |

---

## 3. Advisory vs Other Services – leading questions (avoid “duplicate” feel)

| If the user says… | Leading question to ask | Suggested choice |
|-------------------|--------------------------|-------------------|
| “It’s advisory” or “consulting” | “Is it consulting, strategy, M&A, risk, valuation, due diligence, or similar non-audit work?” | **Advisory** → then pick the specific Advisory service type |
| “It’s other” or “none of the above” | “So it doesn’t fit Audit, Tax, Accounting, IT, or Advisory?” | **Other Services** → then “Other Services” or “Not Applicable” |
| “Not sure” | “Is it mainly consulting/non-audit (Advisory) or something that doesn’t fit the other five categories (Other Services)?” | Clarify then choose one |

**One-line UX copy (already in form):**  
*“Advisory = consulting and non-audit services. Other Services = engagements that don’t fit Audit, Tax, Accounting, IT, or Advisory.”*

---

## 4. Service type level – suggested list under each category

- **Audit & Assurance:** Statutory Audit, Review, Agreed-Upon Procedures, Compilation, Other (Audit & Assurance).
- **Advisory:** Many sub-categories (e.g. Corporate Finance, Due Diligence, Risk Management, Management Consulting, Other Advisory Services, etc.).
- **Tax Services:** Corporate Tax Advisory, Individual Tax Advisory, Tax Compliance, Tax Planning, Transfer Pricing, Other (Tax).
- **Accounting Services:** Bookkeeping, Accounting Services, Payroll, etc.
- **IT Services:** IT Advisory, Cybersecurity, IT Audit, etc.
- **Other Services:** Other Services, Not Applicable.

Leading question at this level: *“Which specific service type best describes this engagement?”* — with the dropdown filtered by the chosen Line of Service.

---

## 5. Summary table: suggested list ↔ leading questions

| Suggested list item | Leading question (short) |
|---------------------|---------------------------|
| Audit & Assurance | Audit, review, or assurance? |
| Advisory | Consulting or non-audit advisory? |
| Tax Services | Mainly tax work? |
| Accounting Services | Bookkeeping, accounting, or payroll? |
| IT Services | IT advisory, cybersecurity, or IT audit? |
| Other Services | Doesn’t fit the above five? |

This mapping can be used for training, help text, or support scripts when users are unsure which option to select.

---

## 6. When leading questions are needed vs not (CMA)

**Rule:** Leading questions are **only** needed when the selected Line of Service / Service Type is a **catch-all** and we need to know whether **CMA matrix rules** are touched (Kuwait clients). Straightforward selections do **not** need leading questions.

### 6.1 No leading questions needed (straightforward selections)

When the user picks a **specific service type that directly maps to a CMA service or clearly does not**, the system already knows CMA applicability. No extra questions.

| Selection | CMA applicability | Leading questions? |
|-----------|-------------------|---------------------|
| **Audit & Assurance** → Statutory Audit, External Audit, Review, etc. | Maps to CMA External Audit (if Kuwait) | **No** |
| **Advisory** → Internal Audit, Risk Management Services, Internal Controls Review, AML/CFT Assessment, Investment Advisor, Asset Valuation, Capital Adequacy Review, etc. | Maps to a CMA matrix service | **No** |
| **Tax Services** → any | No CMA matrix service | **No** |
| **Accounting Services** → any | No CMA matrix service | **No** |
| **IT Services** → any (in Kuwait list) | No direct CMA matrix service | **No** |
| **Other Services** → Not Applicable (and confirmed not one of the 9 CMA services) | No CMA | **No** (after one-time clarification if needed) |

So: **leading questions are not needed for straightforward selections.**

### 6.2 Leading questions needed (catch-alls that may touch CMA)

Only these **standard list** options need **additional clarification** to see if CMA matrix rules are touched:

| Line of Service | Service type (catch-all) | Why leading questions? |
|-----------------|--------------------------|--------------------------|
| **Advisory** | Other Advisory Services | Could be Risk Management, Investment Advisor, Asset Valuation, Internal Control Review, etc. (CMA) or pure consulting (no CMA). |
| **Other Services** | Other Services | Could be something that fits one of the 9 CMA services (e.g. internal audit, risk management) or truly “other” with no CMA touch. |
| **Other Services** | Not Applicable | Same as above; need to confirm it doesn’t actually touch any CMA matrix service. |

### 6.3 The 9 CMA matrix services (reference for leading questions)

When asking leading questions for Advisory / Other Services, the aim is to see if the engagement touches **any** of these:

1. External Audit  
2. Internal Audit  
3. Risk Management  
4. Review the Internal Control Systems (Module 15)  
5. Review, evaluate the performance of the internal audit management/firm/unit (Module 15)  
6. Assessment on the level of compliance with AML/CFT Law (Module 16)  
7. An Investment Advisor (Module 9)  
8. Valuation of the assets (Module 9)  
9. Review the capital adequacy report (Module 17)  

### 6.4 Suggested leading questions for “does this touch CMA?”

Use only when **Kuwait client** and user selected **Advisory → Other Advisory Services** or **Other Services → Other Services / Not Applicable**:

- *“Does this engagement involve any of: external audit, internal audit, risk management, internal control review, internal audit performance review, AML/CFT assessment, investment advisory, asset valuation, or capital adequacy review?”*  
  - **If yes** → Route to the specific CMA service type (or Compliance) so CMA matrix rules apply.  
  - **If no** → No CMA matrix rules; treat as non-CMA service.

Shorter variant for UX:  
*“Does this service fall under any of the 9 CMA matrix services (e.g. internal audit, risk management, investment advisor, asset valuation, AML/CFT, capital adequacy)?”*

### 6.5 Summary

| Scenario | Leading questions? |
|----------|--------------------|
| Specific service type that maps to CMA (e.g. Statutory Audit, Risk Management Services, Asset Valuation) | **No** |
| Specific service type that clearly does not map to CMA (e.g. Tax Compliance, Bookkeeping) | **No** |
| Advisory → **Other Advisory Services** (Kuwait client) | **Yes** – “Does this touch any of the 9 CMA matrix services?” |
| Other Services → **Other Services** or **Not Applicable** (Kuwait client) | **Yes** – same question |
| All other selections | **No** |
