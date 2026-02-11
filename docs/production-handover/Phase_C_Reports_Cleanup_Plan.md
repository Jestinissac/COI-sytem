# Phase C: Reports Cleanup — Plan

**Scope:** C1 (catalog/UI cleanup), C2 (top 5 reports implementation), C3 (CRM PDF/Excel export), C4 (ReportCharts line/doughnut), C5 (Analytics integration).

---

## Current state (brief)

- **Reports.vue:** Report catalog by role; "Available" vs "Planned Reports" (collapsible) with "Coming Soon" badge. Dropdown and view show only `status === 'available'` reports. Chart area uses `ReportCharts` with `summary.byStatus`, `byServiceType`, `byClient`.
- **reportDataService.js:** Exports COI reports (requester, director, compliance, partner, finance, admin) and 8 CRM reports (lead-source-effectiveness, funnel-performance, insights-to-conversion, attribution-by-user, pipeline-forecast, conversion-trends, period-comparison, lost-prospect-analysis). No dedicated functions yet for: Approval Workflow, SLA Compliance, Department Performance, Conflict Analysis, Active Engagements.
- **reportController.js:** `getReportData` routes by role + reportType; `exportReportPDF` and `exportReportExcel` support only one (or two) report types per role — CRM report types are **not** in the export switch cases.
- **pdfExportService.js / excelExportService.js:** Generic: summary, requests, codes, prospects. No report-type-specific layout; CRM report shapes may need explicit handling if they use different structures (e.g. funnel stages, trends).
- **ReportCharts.vue:** Uses Chart.js with `Pie` (ArcElement) and `Bar` (BarElement). No Line, Doughnut, or PointElement.
- **ReportingDashboard.vue:** "Advanced Reporting" view; route is `reports-old` (name: ReportingDashboard). No route `reports/analytics`.

---

## C1: Reports.vue — Catalog and "Coming Soon" / Phase 2

**Goal:** Hide the "Coming Soon" section or show remaining reports as "Phase 2" badge; keep only working reports plus the 5 new reports from C2.

**Data model for Phase 2**

- Define a **`phase`** field on report definitions: `phase: '1'` for current/available reports, `phase: '2'` for planned reports. Keep existing `status: 'available' | 'coming-soon'`; treat "Phase 2" as the **label** shown when `status === 'coming-soon'` (and optionally filter by `phase === '2'` for the planned section). Catalog logic: show "Available" when `status === 'available'`; show "Phase 2 Reports" section when there are reports with `status === 'coming-soon'` and use badge "Phase 2" instead of "Coming Soon".
- **Consistency:** The decision (hide vs relabel) applies to **all roles**: same rule for every role group in `reportCatalog` (either no planned section for any role, or all roles show Phase 2 section with the same badge/label).

**Options (choose one):**

1. **Hide "Coming Soon" section:** Remove or collapse-by-default the "Planned Reports" block so the catalog shows only available reports. No Phase 2 badge.
2. **Show as "Phase 2" badge:** Keep the planned section but replace "Coming Soon" with a "Phase 2" badge (and optionally rename "Planned Reports" to "Phase 2 Reports"). Still non-clickable or show same toast until implemented.

**Files:** [coi-prototype/frontend/src/views/Reports.vue](coi-prototype/frontend/src/views/Reports.vue)

**Tasks:**

- Define and use `phase: '1' | '2'` on report definitions; use "Phase 2" as the badge/label when showing planned reports (if not hidden).
- Decide and implement: either hide the block (e.g. remove `v-if="roleGroup.reports.filter(r => r.status === 'coming-soon').length > 0"` and the whole "Planned Reports" div) or change label/badge to "Phase 2". Apply the chosen behavior consistently for all roles.
- After C2: set the 5 new report definitions to `status: 'available'` and `phase: '1'`; ensure they appear in the catalog for the correct roles (see C2 role mapping).
- Ensure `availableReports` and catalog only list reports that have a backend implementation (working + the 5 from C2).
- Update any user-facing documentation or guides that refer to report availability or "Coming Soon" so they align with the chosen behavior (hidden planned section or Phase 2 label).

**Report catalog (C1 implementation)**

- **Phase field:** Every report in `reportCatalog` (Reports.vue) has a `phase` field: `phase: '1'` for available reports, `phase: '2'` for coming-soon reports. The catalog is grouped by role (Requester, Director, Compliance, Partner, Finance, Admin, Super Admin); each group has a `reports` array of `{ id, name, description, dataPoints, status, phase, rolePath, category }`.
- **UI label:** The planned section is titled **"Phase 2 Reports"** (not "Planned Reports"). The badge for non-available reports is **"Phase 2"** (not "Coming Soon"). The same rule applies to all roles. Clicking a Phase 2 report shows a toast: "This report is planned for Phase 2 and is not yet available."
- **Available reports:** Only reports with `status === 'available'` appear in the dropdown and runnable list; they have `phase: '1'`. The five C2 reports (Approval Workflow, SLA Compliance, Department Performance, Conflict Analysis, Active Engagements) are available for the roles specified in C2. No deprecated or duplicate catalog entries; Super Admin sees the same Admin reports plus the same list.
- **Documentation:** This plan and the verification section below document the chosen behaviour. Update any other user-facing guides that mention "Coming Soon" or report availability to use "Phase 2" and the Phase 2 Reports section name where relevant.

---

## C2: Implement top 5 reports (backend + definitions + charts)

**Goal:** Implement Approval Workflow, SLA Compliance, Department Performance, Conflict Analysis, and Active Engagements in backend and frontend; add/update report definitions and charts (stacked bar, bar, pie, table as needed).

**Sub-tasks (track individually):**

- **C2.1a** Approval Workflow (reportDataService + controller + definition + chart/table)
- **C2.1b** SLA Compliance (same)
- **C2.1c** Department Performance (same)
- **C2.1d** Conflict Analysis (same)
- **C2.1e** Active Engagements (same)

### Report IDs and roles (recommended)

| Report name             | Report ID (reportType)   | Primary role(s)     | Chart / view focus        |
|-------------------------|--------------------------|----------------------|----------------------------|
| Approval Workflow       | `approval-workflow`      | Admin, Super Admin   | Stacked bar (by stage)    |
| SLA Compliance          | `sla-compliance`         | Admin, Super Admin   | Bar / pie / table         |
| Department Performance  | `department-performance` | Admin, Super Admin   | Bar, table                |
| Conflict Analysis       | `conflict-analysis`       | Compliance (+ Admin) | Table, optional pie       |
| Active Engagements      | `active-engagements`     | Partner, Admin       | Table                     |

### C2.1 — Backend: reportDataService.js

**File:** [coi-prototype/backend/src/services/reportDataService.js](coi-prototype/backend/src/services/reportDataService.js)

Add five exported functions (signatures follow existing pattern: `userId`, `filters = {}`; use `getDatabase()`, prepared statements, apply role/department filters where applicable):

1. **getApprovalWorkflowReport(userId, filters)**  
   - Query requests grouped by status (or workflow stage); counts per stage; optional date filter.  
   - Return: `{ summary: { byStage: { 'Pending Director': n, 'Pending Compliance': n, ... }, totalRequests }, requests?: [] }` for stacked bar + optional table.

2. **getSLAComplianceReport(userId, filters)**  
   - Use `sla_breach_log` and/or SLA config + request dates; breach count, on-time count, by priority or department.  
   - Return: `{ summary: { breached, onTime, byDepartment?: {}, byPriority?: {} }, requests?: [] }` for bar/pie/table.

3. **getDepartmentPerformanceReport(userId, filters)**  
   - Requests by department; approval rate, count, avg processing time (from request timestamps or audit).  
   - Return: `{ summary: { byDepartment: { name: string, count, approvalRate, avgDays } }, requests?: [] }` for bar + table.

4. **getConflictAnalysisReport(userId, filters)**  
   - Resolved/unresolved conflicts; duplication matches; data from existing conflict/duplication tables or flags on requests. Compliance must not receive commercial fields (align with response mapper / data segregation).  
   - Return: `{ summary: { totalConflicts, resolved, unresolved, byType?: {} }, conflicts?: [], duplications?: [] }` for table + optional pie.

5. **getActiveEngagementsReport(userId, filters)**  
   - Active engagements (e.g. status = Approved, engagement_code present); client, dates, renewal; from `coi_requests` (and related).  
   - Return: `{ summary: { total, byServiceType?: {} }, requests?: [] }` (requests = engagement rows) for table.

Use existing helpers (`applyRoleFilters`, `applyDateFilter`, `getBaseRequestQuery`) where applicable. Enforce role/department visibility (Director: own department; Compliance: no financials; Admin/Super Admin: full).

**Edge cases and robustness:** Each of the five report functions must handle **empty datasets** (return `{ summary: { ... }, requests: [] }` or equivalent with zeroed counts) and **invalid or missing filters** (e.g. invalid date range, missing optional params) without throwing; validate/sanitize filter inputs and return a valid structure. Document the expected return shape for the empty case for each report.

**Unit tests:** Implement unit tests for each of the five new report functions in reportDataService.js (e.g. in `reportDataService.test.js` or existing test file). Tests should assert: (1) return shape (summary keys, presence of requests/conflicts/duplications as applicable), (2) empty-data behavior, (3) role/filter application where relevant (e.g. department scoping).

### C2.2 — Backend: reportController.js

**File:** [coi-prototype/backend/src/controllers/reportController.js](coi-prototype/backend/src/controllers/reportController.js)

- Import the five new functions from `reportDataService.js`.
- In **getReportData**, add branches for:
  - `approval-workflow`, `sla-compliance`, `department-performance` for role `admin` (and Super Admin uses admin).
  - `conflict-analysis` for roles `compliance` and `admin`.
  - `active-engagements` for roles `partner` and `admin`.
- Map Super Admin to same as admin for these report types (existing pattern).

### C2.3 — Frontend: Report definitions in Reports.vue

**File:** [coi-prototype/frontend/src/views/Reports.vue](coi-prototype/frontend/src/views/Reports.vue)

- In `reportCatalog`, set the five reports to **`status: 'available'`** and correct `rolePath` / role group:
  - Approval Workflow: Admin & Super Admin, id `approval-workflow`.
  - SLA Compliance: Admin & Super Admin, id `sla-compliance`.
  - Department Performance: Admin & Super Admin, id `department-performance` (already exists as coming-soon; flip to available).
  - Conflict Analysis: Compliance (and Admin/Super Admin), id `conflict-analysis` (already exists as coming-soon; flip to available).
  - Active Engagements: Partner & Admin/Super Admin, id `active-engagements` (already exists as coming-soon; flip to available).
- Ensure each has `name`, `description`, `dataPoints`, `category` as needed.

### C2.4 — Frontend: Charts and table in Reports.vue

- For reports that expose `summary.byStage`, `summary.byDepartment`, `summary.byPriority`, etc., extend the chart area so that:
  - **approval-workflow:** Use stacked bar (by stage) — either extend `ReportCharts` to accept a "stacked bar" config and `byStage` data, or add a report-type-specific block in Reports.vue that uses a stacked bar with the new data.
  - **sla-compliance:** Bar and/or pie (by department/priority); table for breach list.
  - **department-performance:** Bar chart + table (by department).
  - **conflict-analysis:** Table (and optional pie if summary counts by type).
  - **active-engagements:** Table only (engagement list).

- Use existing `reportData.summary` and `reportData.requests` (or `conflicts`/`duplications`/engagement list) for tables; reuse `ReportCharts` where shape matches (`byStatus`-like keys) or add minimal new props/chart types in ReportCharts (C4 can add line/doughnut for other reports).

---

## C3: CRM report PDF/Excel export

**Goal:** Add PDF and Excel export support in the backend for all 8 CRM report types, for roles that already have access to them in getReportData.

**CRM report types:**  
`lead-source-effectiveness`, `funnel-performance`, `insights-to-conversion`, `attribution-by-user`, `pipeline-forecast`, `conversion-trends`, `period-comparison`, `lost-prospect-analysis`

**Consistent pattern for CRM export**

- **Mapping:** Maintain a single map (or switch) from `reportType` (e.g. `lead-source-effectiveness`) to `{ getter, title }` (e.g. `getLeadSourceEffectivenessReport`, "Lead Source Effectiveness"). Use this map in both `exportReportPDF` and `exportReportExcel` so adding a new CRM report type is one place.
- **Data structures:** Ensure that existing `generatePDFReport` and `generateReportExcel` can handle CRM report payloads. If CRM reports already return `summary` and/or `requests`/`prospects`, no change. If they use different keys (e.g. `funnelStages`, `trends`), either (a) normalize in the controller to summary + one of the known keys before calling the generators, or (b) extend the generators once with a small number of conditional branches keyed by reportType. Prefer (a) to keep export services generic. Document the decision.

**Files:**

- [coi-prototype/backend/src/controllers/reportController.js](coi-prototype/backend/src/controllers/reportController.js)
- [coi-prototype/backend/src/services/pdfExportService.js](coi-prototype/backend/src/services/pdfExportService.js) (if CRM payloads need custom sections)
- [coi-prototype/backend/src/services/excelExportService.js](coi-prototype/backend/src/services/excelExportService.js) (if CRM payloads need custom sheets)

**Tasks:**

1. **reportController.js — exportReportPDF and exportReportExcel**
   - Define a consistent mapping: reportType to `{ getter, title }` for all 8 CRM report types; use it in both PDF and Excel export branches. In each role branch (requester, director, partner, admin), add cases for the 8 CRM report types using this map: call the getter, set reportTitle, then call `generatePDFReport` / `generateReportExcel`.

2. **Export services**
   - Current implementation is generic (summary, requests, codes, prospects). If CRM reports return different top-level keys, add a normalization layer in the controller or minimal report-type-specific sections in the export services. Document which approach is used.

3. **Optional:** Consider adding a way to download sample exports for each CRM report type (e.g. test data or fixture) for QA and validation. Implement only if time permits; not blocking.

**Role–report matrix for export:** Requester, Director, Partner, Admin (and Super Admin as admin) each can export the CRM report types they can already run in getReportData.

**C3 Implementation**

- **reportController.js:** Added frozen constant `CRM_REPORT_SPEC` mapping each of the 8 CRM report types to `{ getter, title }`. In `exportReportPDF` and `exportReportExcel`, for roles `requester`, `director`, `partner`, and `admin`, existing role-specific report types are unchanged; if `reportType` is not one of those, the handler checks `CRM_REPORT_SPEC[reportType]` and, when present, calls the getter and sets `reportTitle` before calling `generatePDFReport` / `generateReportExcel`. Export services (pdfExportService.js, excelExportService.js) are unchanged; they already accept generic `summary` and `requests` (or equivalent) and CRM payloads are passed through as returned by the getters.

---

## C4: ReportCharts.vue — Line and Doughnut

**Goal:** Register LineElement, PointElement and support line and doughnut chart types with options. Design for extensibility so additional chart types can be added later without refactoring.

**File:** [coi-prototype/frontend/src/components/reports/ReportCharts.vue](coi-prototype/frontend/src/components/reports/ReportCharts.vue)

**Extensibility:** Design the component so new chart types (e.g. radar, polarArea) can be added with one branch and one registration. For example: a single "chart config" prop such as `charts: Array<{ type: 'pie'|'bar'|'line'|'doughnut', data, options?: object }>` and a small internal router (v-if/v-else or component :is) that picks the right Chart.js component.

**Standard options:** Define and reuse a standard set of options per chart type. Store as named constants (e.g. `defaultLineOptions`, `defaultDoughnutOptions`) so Reports.vue or other callers can override only what they need. Document in the plan or in ReportCharts.vue for reuse.
- **Line:** responsive, maintainAspectRatio, tooltip, legend, scales (category/time + linear), optional fill.
- **Doughnut:** same as pie with `cutout: '60%'` (or configurable).

**Tasks:**

1. **Chart.js registration**
   - Import and register: `LineElement`, `PointElement`, `Filler` (optional, for area under line).
   - Import and use `Line` and `Doughnut` from `vue-chartjs` (or equivalent).

2. **Doughnut**
   - Same data shape as pie (e.g. `ArcElement`); add a second set of options (doughnut cutout) or a prop `variant: 'pie' | 'doughnut'` and use one component with different options. Use `defaultDoughnutOptions`.

3. **Line**
   - Accept a dataset suitable for line (e.g. `{ labels: string[], datasets: [{ label, data: number[] }] }`). Add a section in the template that renders when a line dataset is provided; use `defaultLineOptions` and same Chart.js options pattern (tooltip, legend, scales for time or category).

4. **Props**
   - Extend props (e.g. `lineData`, `doughnutData`, or a generic `charts: { type: 'line'|'doughnut'|'bar'|'pie', data, options? }[]`) so Reports.vue can pass data for the new chart types when report type is approval-workflow, conversion-trends, etc.

5. **If complexity grows:** If Line or Doughnut logic becomes complex (many variants or report-specific overrides), consider extracting them into separate components (e.g. ReportLineChart.vue, ReportDoughnutChart.vue) or Storybook stories for ReportCharts to keep the main component maintainable.

**C4 Implementation**

- **ReportCharts.vue:** Chart.js now registers `LineElement`, `PointElement`, and `Filler`; component uses `Line` and `Doughnut` from vue-chartjs. Exported constants `defaultLineOptions` and `defaultDoughnutOptions` provide responsive, tooltip, legend, and (for line) category/linear scales; doughnut uses `cutout: '60%'`. Optional props `lineData` and `doughnutData` added (with exported `LineChartData` and `DoughnutChartData` types). Template includes optional Line chart block (when `lineData` has labels) and Doughnut chart block (when `doughnutData` has labels), each with an export button using `exportChartRef` for PNG download. Callers can pass line/doughnut data when report type supports it (e.g. conversion-trends, approval-workflow).

---

## C5: Analytics (ReportingDashboard) integration

**Goal:** Integrate ReportingDashboard as an "Analytics" tab on the Reports page or link from Reports; ensure route `/coi/reports/analytics` exists.

**Exact functionality and design**

- **Content:** Analytics shows the existing ReportingDashboard: static dashboard with metrics cards, charts, period selector, and export; data is loaded on enter/period change (not real-time push). No new behavior beyond placement and navigation.
- **Real-time vs static:** Current design is static per load; no real-time push. If real-time updates are required later, that is a separate enhancement.

**Navigation and UX**

- Ensure navigation is **intuitive**: (1) If using a tab, place "Reports" and "Analytics" at the same level (e.g. top of Reports.vue). (2) If using a link, use a clear label (e.g. "Advanced Analytics" or "Analytics Dashboard") and place it prominently (e.g. header next to "Browse Report Catalog"). (3) From Analytics, provide a clear way back to the report catalog (e.g. "Back to Reports" or the same tab). Ensure users can switch between Report catalog and Analytics view without confusion.

**Accessibility**

- Analytics tab or link must be keyboard-focusable and activatable with Enter/Space; tab order logical.
- Analytics view (ReportingDashboard) must be screen-reader friendly: headings, chart labels, and export button have appropriate aria labels or live regions where needed. Audit ReportingDashboard for keyboard navigation and screen reader support; fix critical gaps as part of C5.

**Options (choose one):**

1. **Tab on Reports page**
   - In Reports.vue, add a top-level tab strip (e.g. "Reports" | "Analytics"). When "Analytics" is selected, render `ReportingDashboard.vue` (import and use as a child component) in the main content area, or embed via a wrapper that preserves ReportingDashboard’s header/period/export.

2. **Link from Reports page**
   - Add a prominent link/button on Reports.vue (e.g. in the header next to "Browse Report Catalog") that navigates to `/coi/reports/analytics`. No tab; Analytics is a separate full page.

**Route**

**File:** [coi-prototype/frontend/src/router/index.ts](coi-prototype/frontend/src/router/index.ts)

- Add a route so that `/coi/reports/analytics` resolves:
  - Either as a **child** of the reports route (e.g. `path: 'reports', children: [{ path: 'analytics', component: ReportingDashboard.vue }]`) so the URL is `/coi/reports/analytics`, or
  - As a **sibling**: `path: 'reports/analytics'`, component `ReportingDashboard.vue`, same meta as current ReportingDashboard (e.g. roles: Admin, Super Admin, Compliance).
- Remove or keep `reports-old`; if kept, redirect `reports-old` to `reports/analytics` so old links still work.

**Files:** Reports.vue (tab or link), router/index.ts.

**C5 Implementation**

- **router/index.ts:** New route `path: 'reports/analytics'`, name `ReportingDashboard`, component ReportingDashboard.vue, meta: `roles: ['Admin', 'Super Admin', 'Compliance']`. Route `reports-old` now redirects to `/coi/reports/analytics` (duplicate route removed).
- **Reports.vue:** Header link "Analytics" (RouterLink to `/coi/reports/analytics`) with `aria-label="Open Analytics dashboard"` and focus ring; catalog toggle has `aria-expanded` and `aria-label="Toggle report catalog visibility"`.
- **ReportingDashboard.vue:** "Back to Reports" link at top (RouterLink to `/coi/reports`) with `.back-link` styles and focus outline. Main content uses `<main role="main" aria-labelledby="advanced-reporting-heading">`; key metrics, charts, and data tables wrapped in `<section>` with `aria-label`. Period select, export button, and monthly-report month select/generate button have `aria-label`; main heading has `id="advanced-reporting-heading"`.

---

## Summary table

| Item | Scope | Main files |
|------|--------|------------|
| C1 | Catalog: phase field; hide or "Phase 2" badge; consistent for all roles; docs update | Reports.vue |
| C2 | Five sub-tasks (C2.1a–e); 5 reports; edge-case handling; unit tests | reportDataService.js, reportController.js, Reports.vue (definitions + charts/tables) |
| C3 | PDF/Excel for 8 CRM reports; reportType→getter/title mapping; normalization; optional sample exports | reportController.js, optionally pdfExportService.js, excelExportService.js |
| C4 | Line and Doughnut; extensible design; defaultLineOptions/defaultDoughnutOptions; split if complex | ReportCharts.vue |
| C5 | Analytics = static ReportingDashboard; route; intuitive navigation; accessibility (keyboard, screen reader) | Reports.vue, router/index.ts |

---

## Suggested order of implementation

1. **C2** (backend + definitions + charts; include sub-tasks C2.1a–e and unit tests) so the 5 reports exist and can be marked available for C1.
2. **C1** (catalog cleanup, Phase 2 data model, set the 5 to available, documentation).
3. **C4** (ReportCharts line/doughnut; extensibility and standard options) if any of the 5 or existing reports will use them; otherwise can follow C3.
4. **C3** (CRM PDF/Excel export; mapping and normalization).
5. **C5** (Analytics route, tab or link, navigation, accessibility).

---

## Key files reference

| Area | File(s) |
|------|--------|
| Catalog / UI | coi-prototype/frontend/src/views/Reports.vue |
| Report data | coi-prototype/backend/src/services/reportDataService.js |
| Report API | coi-prototype/backend/src/controllers/reportController.js |
| PDF export | coi-prototype/backend/src/services/pdfExportService.js |
| Excel export | coi-prototype/backend/src/services/excelExportService.js |
| Charts | coi-prototype/frontend/src/components/reports/ReportCharts.vue |
| Analytics | coi-prototype/frontend/src/views/ReportingDashboard.vue |
| Routes | coi-prototype/frontend/src/router/index.ts |

---

## Amendments (Qwen feedback) — incorporated

This plan has been updated to include:

- **C1:** `phase` field on report definitions; consistent behavior for all roles; documentation task for report availability/Coming Soon.
- **C2:** Five trackable sub-tasks (C2.1a–e); edge-case handling (empty datasets, invalid/missing filters); unit tests for each report function (return shape, empty data, filters/role).
- **C3:** Consistent reportType to getter/title mapping; clarification on export service handling (normalize in controller or minimal type-specific sections); optional sample exports for QA.
- **C4:** Extensible chart-type design (e.g. charts array + internal router); standard option sets (defaultLineOptions, defaultDoughnutOptions); note on extracting components or Storybook if complexity grows.
- **C5:** Definition of Analytics as static ReportingDashboard (no real-time push); intuitive navigation and back-to-catalog; accessibility (keyboard focus/activation, screen reader, audit ReportingDashboard).

---

## Verification plan and current status

Use this section to verify that Phase C tasks have been implemented correctly. **Current status** reflects the codebase at the time of the last verification run.

### C1: Catalog and "Coming Soon" / Phase 2

**Verification steps**

1. **Report definitions:** In [Reports.vue](coi-prototype/frontend/src/views/Reports.vue), confirm each report has a `phase` field (`'1'` or `'2'`) and that "Coming Soon" reports use a "Phase 2" badge if that option was chosen.
2. **UI behaviour:** For Admin, Super Admin, Compliance, Partner, confirm the catalog shows only available reports when `status === 'available'`; if Phase 2 section is shown, it uses the "Phase 2" badge and the same rule for all roles.
3. **Documentation:** Check user-facing docs for alignment with the chosen behaviour (hidden planned section or Phase 2 label).

**Verification files:** `coi-prototype/frontend/src/views/Reports.vue`, documentation.

**Current status:** **Implemented.** Report definitions have `phase: '1'` (available) or `phase: '2'` (coming-soon). Section title is "Phase 2 Reports"; badge text is "Phase 2". Toast for Phase 2 reports: "This report is planned for Phase 2 and is not yet available." Documentation: Report catalog (C1 implementation) added to this plan; Phase 2 label and section name documented.

---

### C2: Top 5 reports

**Verification steps**

1. **Backend:** In [reportDataService.js](coi-prototype/backend/src/services/reportDataService.js), confirm the five functions exist: `getApprovalWorkflowReport`, `getSLAComplianceReport`, `getDepartmentPerformanceReport`, `getConflictAnalysisReport`, `getActiveEngagementsReport`, and that they handle empty datasets and invalid/missing filters.
2. **Controller:** In [reportController.js](coi-prototype/backend/src/controllers/reportController.js), confirm `getReportData` includes the five report types with correct role checks (admin, compliance, partner).
3. **Frontend:** In Reports.vue, confirm the five reports are in `reportCatalog` with `status: 'available'` and correct `rolePath`.
4. **Charts/tables:** Manually test each report: stacked bar, bar, pie, table as specified.
5. **Unit tests:** In test files (e.g. `reportDataService.test.js`), confirm tests for return shape, empty data, and role/filter application for each new report function.

**Verification files:** reportDataService.js, reportController.js, Reports.vue, test files.

**Current status:** **Implemented.** reportDataService.js has all five functions; reportController.js getReportData routes by role and reportType; Reports.vue catalog has the five reports as `status: 'available'` with correct rolePath; reportDataService.test.js has 11 unit tests (shape, empty data, invalid filters) and all pass.

---

### C3: CRM report PDF/Excel export

**Verification steps**

1. **Mapping:** In reportController.js, confirm a single mapping from `reportType` to `{ getter, title }` for all 8 CRM report types, used in both `exportReportPDF` and `exportReportExcel`.
2. **Export services:** In pdfExportService.js and excelExportService.js, confirm either normalization in the controller or minimal type-specific handling; document which approach is used.
3. **Optional:** If sample exports exist, confirm they match the expected structure.

**Verification files:** reportController.js, pdfExportService.js, excelExportService.js.

**Current status:** **Implemented.** reportController.js has `CRM_REPORT_SPEC` mapping all 8 CRM report types to getter and title; both `exportReportPDF` and `exportReportExcel` use it for requester, director, partner, and admin. Export services unchanged; CRM payloads passed through as returned by getters.

---

### C4: ReportCharts — Line and Doughnut

**Verification steps**

1. **Registration:** In [ReportCharts.vue](coi-prototype/frontend/src/components/reports/ReportCharts.vue), confirm `LineElement`, `PointElement`, `Filler` are imported and registered, and that `Line` and `Doughnut` from vue-chartjs are used.
2. **Options:** Confirm `defaultLineOptions` and `defaultDoughnutOptions` are defined and reused.
3. **Props/template:** Confirm the component accepts a generic `charts` prop (or equivalent) and renders line and doughnut based on data type.

**Verification files:** ReportCharts.vue.

**Current status:** **Implemented.** ReportCharts.vue registers LineElement, PointElement, Filler and uses Line and Doughnut; `defaultLineOptions` and `defaultDoughnutOptions` exported; optional props `lineData` and `doughnutData` with template blocks and export buttons.

---

### C5: Analytics (ReportingDashboard) integration

**Verification steps**

1. **Navigation:** On the Reports page, confirm an "Analytics" tab or link is present and reachable.
2. **Route:** In [router/index.ts](coi-prototype/frontend/src/router/index.ts), confirm `/coi/reports/analytics` resolves to ReportingDashboard.vue.
3. **Functionality:** Open Analytics and confirm it shows ReportingDashboard content (metrics, charts, period selector).
4. **Accessibility:** Check keyboard navigation and screen reader support (headings, chart labels, export).
5. **Redirect:** If applicable, confirm `/coi/reports-old` redirects to `/coi/reports/analytics`.

**Verification files:** Reports.vue, router/index.ts.

**Current status:** **Implemented.** Route `/coi/reports/analytics` (name ReportingDashboard) points to ReportingDashboard.vue; `reports-old` redirects to it. Reports.vue header has Analytics link; ReportingDashboard has Back to Reports link and accessibility (aria-label, main/section landmarks, focus styles).

---

### Summary

| Phase | Implemented | Notes |
|-------|-------------|--------|
| C1 | Yes | `phase` field; "Phase 2 Reports" section and badge; docs in plan. |
| C2 | Yes | Five report functions, controller wiring, catalog, unit tests. |
| C3 | Yes | CRM_REPORT_SPEC map; PDF/Excel export for 8 CRM types (requester, director, partner, admin). |
| C4 | Yes | Line/Doughnut registration, default options, lineData/doughnutData props. |
| C5 | Yes | reports/analytics route; Analytics link; Back to Reports; a11y (aria, landmarks). |

**Next step:** Phase C (C1–C5) is implemented. Optional: add unit tests for export controller and ReportCharts; run accessibility audit (e.g. Lighthouse/Axe); extend Reports.vue to pass `lineData`/`doughnutData` to ReportCharts where report types support it.
