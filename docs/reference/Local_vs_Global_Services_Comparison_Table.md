# Local (Kuwait) vs Global Services — Comparison Table

## When each list is used

| Context | List used | API / form |
|--------|-----------|------------|
| **Local COI** (no international operations) | Kuwait Local — 39 services, 6 categories | `international=false` → Kuwait template list |
| **Global COI** (international operations selected) | Global — 177+ services, 26+ categories | `international=true` → Full global catalog |

---

## Is the Kuwait list (39 services) reflecting correctly in the form?

**Yes.** The form is wired to show the Kuwait list for local COIs:

- **Form:** `COIRequestForm.vue` calls `GET /integration/service-types` with **`international: 'false'`** when loading the Line of Service / Service Type dropdowns (and does not send `international: 'true'` unless the user has checked “Client has international operations” and the Global block is used).
- **Backend:** `serviceTypeController.js` uses **`buildKuwaitTemplateList()`** when `international !== 'true'`, which returns **6 categories** and **39 services** (same structure as in the table below: Audit & Assurance 5, Advisory 23, Tax 6, Accounting 2, IT 1, Other Services 2).
- **Display:** The “Line of Service (local request)” dropdown is bound to `serviceTypes` (the 6 categories). The “Service Type (local)” dropdown is bound to `filteredServicesByCategory`, which is the `services` array of the selected category, so it shows exactly the service names from that list (e.g. “Statutory Audit Services”, “Internal Audit Services”, “Other Advisory Services”, etc.).

So the **39 Kuwait services and 6 lines of service** in the form match the Kuwait list defined in `buildKuwaitTemplateList()` (and in `seedKuwaitServiceCatalog.js`). The Global list is only used when **international operations** is selected; then the form fetches again with `international: 'true'` for the BDO Global Line of Service / Service Type dropdowns.

---

## Summary comparison

| Line of Service / Category | Local (Kuwait) | Global (BDO) |
|----------------------------|----------------|--------------|
| **Audit & Assurance** | 5 services | 5 services (same names: Statutory Audit, Review, Agreed-Upon Procedures, Compilation, Other) |
| **Advisory** | 1 category, 23 services | **Many categories** (e.g. Advisory - Analytics & Insights, Corporate Finance, Cyber security, Due Diligence, ESG, Forensics, Litigation Support, Management Consulting, M&A, Operational Excellence, Other, Outsourcing, Recruitment, Restructuring, Risk Management (RAS)); 100+ services total |
| **Tax Services** | 6 services | 10 services (adds Corporate/Individual Tax Advisory, Tax Planning, Transfer Pricing, etc.) |
| **Accounting Services** | 2 services | 6 services (adds Bookkeeping, Financial Statement Preparation, Payroll, Other) |
| **IT Services** | 1 service | 3 services (IT Audit, IT Services, IT Advisory) |
| **Other Services** | 2 services (Other Services, Not Applicable) | 12 services (includes Post Merger Integrations, Market and Feasibility Studies, Policies & Procedures, Capital Adequacy, AML, Other Advisory, etc.) |
| **Additional Global-only categories** | — | Business/Asset Valuation (3), Internal Audit Services (5), Transaction Services (2), Risk Management Services (1), Forensics Services (1), plus all Advisory - * sub-categories |
| **Total** | **6 categories, 39 services** | **26+ categories, 177+ services** |

---

## Side-by-side: categories and service counts

| # | Local (Kuwait) category | Local # services | Global category (equivalent or split) | Global # services |
|---|--------------------------|------------------|----------------------------------------|-------------------|
| 1 | Audit & Assurance | 5 | Audit & Assurance | 5 |
| 2 | Advisory | 23 | Advisory - Analytics & Insights | 3 |
|  |  |  | Advisory - Corporate Finance, Transactions and Restructuring | 14 |
|  |  |  | Advisory - Cyber security | 22 |
|  |  |  | Advisory - Due Diligence | 4 |
|  |  |  | Advisory - Enablement & Adoption | 3 |
|  |  |  | Advisory - ESG Services | 5 |
|  |  |  | Advisory - Forensics Investigations | 15 |
|  |  |  | Advisory - Litigation Support/Dispute Resolution | 12 |
|  |  |  | Advisory - Management Consulting | 9 |
|  |  |  | Advisory - Merger & Acquisitions | 3 |
|  |  |  | Advisory - Operational Excellence | 4 |
|  |  |  | Advisory - Other | 18 |
|  |  |  | Advisory - Outsourcing | 4 |
|  |  |  | Advisory - Recruitment | 2 |
|  |  |  | Advisory - Restructuring | 4 |
|  |  |  | Advisory - Risk Management (RAS) | 10 |
|  |  |  | Business/Asset Valuation | 3 |
|  |  |  | Internal Audit Services | 5 |
|  |  |  | Transaction Services | 2 |
|  |  |  | Risk Management Services | 1 |
|  |  |  | Forensics Services | 1 |
|  |  |  | Other Services (global) | 12 |
| 3 | Tax Services | 6 | Tax Services | 10 |
| 4 | Accounting Services | 2 | Accounting Services | 6 |
| 5 | IT Services | 1 | IT Services | 3 |
| 6 | Other Services | 2 | (included in Other Services row above) | — |

---

## Local (Kuwait) — full service list by category

| Line of Service | Service types |
|-----------------|----------------|
| **Audit & Assurance** | Statutory Audit Services, Reviews Services, Agreed Upon Procedures Services, Related Services Engagements, Other Audit Services |
| **Advisory** | Business / Asset Valuation Services, Impairment Tests Services, Management Consulting Services, SOX & Internal Controls Services, Internal Audit Services, Transaction Services, Risk Management Services, Forensics Services, Other – Post Merger Integrations, IT Audit, Restructuring Services, Due Diligence Services, Market and Feasibility Studies Services, Policies & Procedures Services, Business Planning Services, Capital Adequacy Services (Book 7), AML Services (Book 16), Internal Audit Quality Assurance Services, Performance and Profitability Improvement Services, Capital Adequacy Services (Book 17), Clients' Funds and Clients' Assets Report Services (Book 7), Payroll and HR Services, Other Advisory Services |
| **Tax Services** | Corporate International Tax Services, Tax Compliance & Assurance Engagements Services, FATCA Services, CRS Services, Zakat Services, Other Tax Services |
| **Accounting Services** | Book Keeping Services, Accounting Services |
| **IT Services** | IT Services |
| **Other Services** | Other Services, Not Applicable |

---

## Global — category list (service counts only)

| Global category | # Services |
|-----------------|------------|
| Audit & Assurance | 5 |
| Advisory - Analytics & Insights | 3 |
| Advisory - Corporate Finance, Transactions and Restructuring | 14 |
| Advisory - Cyber security | 22 |
| Advisory - Due Diligence | 4 |
| Advisory - Enablement & Adoption | 3 |
| Advisory - ESG Services | 5 |
| Advisory - Forensics Investigations | 15 |
| Advisory - Litigation Support/Dispute Resolution | 12 |
| Advisory - Management Consulting | 9 |
| Advisory - Merger & Acquisitions | 3 |
| Advisory - Operational Excellence | 4 |
| Advisory - Other | 18 |
| Advisory - Outsourcing | 4 |
| Advisory - Recruitment | 2 |
| Advisory - Restructuring | 4 |
| Advisory - Risk Management (RAS) | 10 |
| Business/Asset Valuation | 3 |
| Tax Services | 10 |
| Accounting Services | 6 |
| Internal Audit Services | 5 |
| IT Services | 3 |
| Transaction Services | 2 |
| Risk Management Services | 1 |
| Forensics Services | 1 |
| Other Services | 12 |

---

## Difference in one line

- **Local:** One simplified list (BDO Kuwait template): 6 categories, 39 services. Advisory is a single category.
- **Global:** Full BDO Global catalog: 26+ categories, 177+ services. Advisory is split into many sub-categories (Analytics, Corporate Finance, Cyber, Due Diligence, ESG, Forensics, Litigation, Management Consulting, M&A, etc.), and there are separate categories for Business/Asset Valuation, Internal Audit, Transaction Services, Risk Management, Forensics.
