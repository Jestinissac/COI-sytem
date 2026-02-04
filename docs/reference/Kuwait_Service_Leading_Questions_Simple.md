# Kuwait Service List — Alignment & Leading Questions (Simple Reference)

## 1. Kuwait list (as-is)

Use **exact labels** from the current Kuwait list. Internal Audit is under **Advisory**, not Audit & Assurance.

| Line of Service | Service types (exact label) |
|-----------------|-----------------------------|
| **Audit & Assurance** | Statutory Audit Services, Reviews Services, Agreed Upon Procedures Services, Related Services Engagements, Other Audit Services |
| **Advisory** | Business / Asset Valuation Services, Impairment Tests Services, Management Consulting Services, SOX & Internal Controls Services, **Internal Audit Services**, Transaction Services, Risk Management Services, Forensics Services, Other – Post Merger Integrations, IT Audit, Restructuring Services, Due Diligence Services, Market and Feasibility Studies Services, Policies & Procedures Services, Business Planning Services, Capital Adequacy Services (Book 7), AML Services (Book 16), Internal Audit Quality Assurance Services, Performance and Profitability Improvement Services, Capital Adequacy Services (Book 17), Clients' Funds and Clients' Assets Report Services (Book 7), Payroll and HR Services, Other Advisory Services |
| **Tax Services** | Corporate International Tax Services, Tax Compliance & Assurance Engagements Services, FATCA Services, CRS Services, Zakat Services, Other Tax Services |
| **Accounting Services** | Book Keeping Services, Accounting Services |
| **IT Services** | IT Services |
| **Other Services** | Other Services, Not Applicable |

**Action:** Keep this list exactly. Attach leading questions only to the service types in the table below.

### How this is enforced (exact labels, Internal Audit under Advisory)

- **Where the list is defined**
  - **Seed:** `coi-prototype/backend/src/scripts/seedKuwaitServiceCatalog.js` — defines the 39 services by category and inserts them into `service_catalog_global`.
  - **Controller:** `coi-prototype/backend/src/controllers/serviceTypeController.js` — `buildKuwaitTemplateList()` returns the same structure; if the DB has no Kuwait data, it uses a **hardcoded fallback** with the same categories and labels.

- **Internal Audit under Advisory**
  - In both the seed and the controller fallback, **Audit & Assurance** has only: Statutory Audit Services, Reviews Services, Agreed Upon Procedures Services, Related Services Engagements, Other Audit Services (5 services).
  - **Internal Audit Services** is listed under **Advisory** (with Business/Asset Valuation, Management Consulting, Transaction Services, Due Diligence, Other Advisory Services, etc.). So the form dropdown shows "Internal Audit Services" only when the user has selected Line of Service = **Advisory**, not under Audit & Assurance.

- **Exact labels**
  - The **option value** in the form is the exact string from this list (e.g. `"Agreed Upon Procedures Services"`, `"Internal Audit Services"`, `"Other Advisory Services"`). Leading-question config (e.g. `ambiguousServiceConfig.js`) must use these **exact strings as keys** so that when the user selects a service type, the system can look up whether to show a clarification modal.

---

## 2. Service type → CMA code (direct or via leading question)

| Kuwait type (exact) | Leading question? | CMA code | Note |
|---------------------|--------------------|----------|------|
| Statutory Audit Services | No | EXTERNAL_AUDIT | Direct |
| Reviews Services | Optional* | EXTERNAL_AUDIT or none | *Add one question if needed |
| Agreed Upon Procedures Services | Yes | INT_CTRL_REVIEW_CMA or null | "Is the subject matter the client's Internal Control Systems over financial reporting?" |
| Related Services Engagements | No | (none) or derive | Direct / no CMA |
| Other Audit Services | Yes | INT_AUDIT_PERF_REVIEW or null | "Does this involve reviewing the performance/quality of the client's Internal Audit function?" |
| Internal Audit Services | No | INTERNAL_AUDIT | Direct (under Advisory) |
| Risk Management Services | No | RISK_MANAGEMENT | Direct |
| AML Services (Book 16) | No | AML_CFT_ASSESSMENT | Direct |
| Capital Adequacy Services (Book 7) | No | CAPITAL_ADEQUACY_REVIEW | Direct |
| Capital Adequacy Services (Book 17) | No | CAPITAL_ADEQUACY_REVIEW | Direct |
| Business / Asset Valuation Services | No | ASSET_VALUATION | Direct |
| Management Consulting Services | Yes | INVESTMENT_ADVISOR or null | "Does this involve M&A or Investment strategies (buying/selling securities)?" |
| Transaction Services | Yes | ASSET_VALUATION / INVESTMENT_ADVISOR / null | Same question as Due Diligence |
| Due Diligence Services | Yes | ASSET_VALUATION / INVESTMENT_ADVISOR / null | "Valuation report, Investment advice, or Standard due diligence?" |
| Other Advisory Services | Yes | From checklist | "Valuation, Investment Advice, AML, Internal Controls, or None?" |
| All other Kuwait types | No | null (or as mapped) | No leading question |

---

## 3. Leading-question text (for implementation)

| Kuwait type | Question | Options → CMA code |
|-------------|----------|---------------------|
| **Other Audit Services** | Does this engagement involve reviewing the performance or quality of the client's Internal Audit function? | Yes → INT_AUDIT_PERF_REVIEW; No → null |
| **Agreed Upon Procedures Services** | Is the specific subject matter of this AUP the client's Internal Control Systems over financial reporting? | Yes → INT_CTRL_REVIEW_CMA; No → null |
| **Management Consulting Services** | Does this consulting engagement involve advising on Mergers, Acquisitions, or Investment strategies (buying/selling securities)? | Yes → INVESTMENT_ADVISOR; No → null |
| **Transaction Services** | What is the primary nature of this engagement? | Valuation (Business/Asset) → ASSET_VALUATION; Investment Advice → INVESTMENT_ADVISOR; Standard Financial/Commercial Due Diligence → null |
| **Due Diligence Services** | Same as Transaction Services | Same options → same CMA codes |
| **Other Advisory Services** | Does this service fall under any of the following? | Valuation of Assets/Business → ASSET_VALUATION; Investment Advisory → INVESTMENT_ADVISOR; AML/CFT → AML_CFT_ASSESSMENT; Internal Controls → INT_CTRL_REVIEW_CMA; None of the above → null |

---

## 4. Summary

- **Direct (no question):** Statutory Audit, Internal Audit, Risk Management, AML (Book 16), Capital Adequacy (Book 7/17), Business/Asset Valuation. Use exact Kuwait labels; map straight to CMA code.
- **Leading question:** Other Audit, Agreed Upon Procedures, Management Consulting, Transaction Services, Due Diligence, Other Advisory. Show one question (or checklist for Other Advisory); set CMA code from answer or null.
- **Reviews Services:** Decide one rule (e.g. no question → EXTERNAL_AUDIT, or one question). Add to config when decided.
