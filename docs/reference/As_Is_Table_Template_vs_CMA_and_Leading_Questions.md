# As-Is: Template vs CMA Matrix and Leading Questions

## 1. What is in the template (COI form – Service Type dropdown)

The form uses **one Service Type** dropdown. The options below are the **template list** (Kuwait / BDO Al Nisf & Partners). Same list is used for **Service Type** and, where applicable, **Previous Services**.

| # | Line of Service | Service Type (template) |
|---|------------------|--------------------------|
| 1 | Audit & Assurance | Statutory Audit Services |
| 2 | Audit & Assurance | Reviews Services |
| 3 | Audit & Assurance | Agreed Upon Procedures Services |
| 4 | Audit & Assurance | Related Services Engagements |
| 5 | Audit & Assurance | Other Audit Services |
| 6 | Advisory | Business / Asset Valuation Services |
| 7 | Advisory | Impairment Tests Services |
| 8 | Advisory | Management Consulting Services |
| 9 | Advisory | SOX & Internal Controls Services |
| 10 | Advisory | Internal Audit Services |
| 11 | Advisory | Transaction Services |
| 12 | Advisory | Risk Management Services |
| 13 | Advisory | Forensics Services |
| 14 | Advisory | Other – Post Merger Integrations |
| 15 | Advisory | IT Audit |
| 16 | Advisory | Restructuring Services |
| 17 | Advisory | Due Diligence Services |
| 18 | Advisory | Market and Feasibility Studies Services |
| 19 | Advisory | Policies & Procedures Services |
| 20 | Advisory | Business Planning Services |
| 21 | Advisory | Capital Adequacy Services (Book 7) |
| 22 | Advisory | AML Services (Book 16) |
| 23 | Advisory | Internal Audit Quality Assurance Services |
| 24 | Advisory | Performance and Profitability Improvement Services |
| 25 | Advisory | Capital Adequacy Services (Book 17) |
| 26 | Advisory | Clients' Funds and Clients' Assets Report Services (Book 7) |
| 27 | Advisory | Payroll and HR Services |
| 28 | Advisory | Other Advisory Services |
| 29 | Tax Services | Corporate International Tax Services |
| 30 | Tax Services | Tax Compliance & Assurance Engagements Services |
| 31 | Tax Services | FATCA Services |
| 32 | Tax Services | CRS Services |
| 33 | Tax Services | Zakat Services |
| 34 | Tax Services | Other Tax Services |
| 35 | Accounting Services | Book Keeping Services |
| 36 | Accounting Services | Accounting Services |
| 37 | IT Services | IT Services |
| 38 | Other Services | Other Services |
| 39 | Other Services | Not Applicable |

---

## 2. What are the combinations in the CMA matrix

The **CMA Matrix** (Law No. (7) of 2010) uses **9 service types** only. For each pair (Service A × Service B), the matrix says **YES**, **NO**, or **Conditional** (e.g. independent teams).

### The 9 CMA services

| # | CMA service (matrix) |
|---|-----------------------|
| 1 | External Audit |
| 2 | Internal Audit |
| 3 | Risk Management |
| 4 | Review the Internal Control Systems (Article 6-9, Module 15) |
| 5 | Review, evaluate the performance of the internal audit management/firm/unit (Article 6-9, Module 15) |
| 6 | Assessment on the level of compliance with AML/CFT Law (Article 7-7, Module 16) |
| 7 | An Investment Advisor (Module 9) |
| 8 | Valuation of the assets (Module 9) |
| 9 | Review the capital adequacy report (Module 17) |

### Combination logic (summary)

- **Matrix** = 9×9 grid: for each pair (A, B), result is **Allowed (YES)**, **Prohibited (NO)**, or **Conditional** (e.g. independent teams).
- **Example:** External Audit + Internal Audit → **NO**. External Audit + Risk Management → **YES** (with conditions). Investment Advisor + Valuation of assets → **NO**.
- **Template** has 39 options; **CMA** has 9. So one template option can map to one CMA service, to none, or (for catch-alls) be ambiguous until clarified.

---

## 3. Our thoughts: proceeding with leading questions

| Aspect | Approach |
|--------|----------|
| **Gap** | Template options (e.g. “Other Advisory Services”, “Other Services”, “Transaction Services”, “Due Diligence Services”, “Management Consulting Services”, “Other Audit Services”) do not map 1:1 to the 9 CMA services. They can hide CMA-regulated work. |
| **Proposal** | Treat these as **ambiguous services**. For **Kuwait (CMA) clients**, when the user selects one of them, show a **single clarification step** (leading question + fixed options) before accepting the choice. |
| **Behaviour** | User selects e.g. “Other Advisory Services” → system shows one question: *“Does this service fall under any of the following CMA-regulated categories?”* with options such as: Valuation of Assets/Business → ASSET_VALUATION; Investment Advisory → INVESTMENT_ADVISOR; AML/CFT Compliance → AML_CFT_ASSESSMENT; **None of the above** → no CMA code. User’s answer is stored and used for CMA combination checks and reporting. |
| **Result** | Template list stays as-is; we do not change labels or dropdown. We only add a **clarification step** for ambiguous services so that every such selection is explicitly mapped to the CMA matrix (or to “not in matrix”). |
| **Scope of leading questions** | Applied only when **client is Kuwait** and **service type** is one of: Transaction Services, Due Diligence Services, Management Consulting Services, Other Advisory Services, Other Audit Services; and for “Other Services” / “Not Applicable” if we extend the logic. Direct matches (e.g. Statutory Audit Services, Internal Audit Services, AML Services (Book 16), Clients' Funds and Clients' Assets Report Services (Book 7)) do **not** need a leading question. |

---

## Quick reference

| | Template (as is) | CMA matrix | Our approach |
|---|------------------|------------|--------------|
| **What** | 39 service types in one dropdown (6 lines of service) | 9 services, 9×9 combination rules (YES/NO/Conditional) | Keep template as is; add leading-question step for ambiguous services (Kuwait only) |
| **Match** | One template option may map to 0, 1, or (if catch-all) “ambiguous” CMA services | Each matrix cell = one rule for a pair of the 9 services | Clarification step maps ambiguous template choices to one CMA code or “none” |
| **Result** | Form stays unchanged; users still choose from the same list | Combination checks and reporting use the 9 CMA services (and stored clarified code) | Fewer CMA-regulated engagements hidden under generic options; auditable mapping |
