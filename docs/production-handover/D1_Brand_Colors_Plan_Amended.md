# D1 — Standardize brand colors (amended with Qwen feedback)

**Reference:** [Phase_DE_UI_CRM_Polish_For_Cursor.md](Phase_DE_UI_CRM_Polish_For_Cursor.md) (D1 section)  
**Scope:** `coi-prototype/frontend/src/views/` and `coi-prototype/frontend/src/components/`  
**Tailwind:** Primary palette in `coi-prototype/frontend/tailwind.config.js` (primary-500, primary-600, primary-700).

---

## Replacement rules

| Find | Replace with | Notes |
|------|--------------|--------|
| `bg-blue-500` | `bg-primary-500` | Buttons, step indicators, progress bars |
| `bg-blue-600` | `bg-primary-600` | Primary buttons, avatars, toggles |
| `hover:bg-blue-600` | `hover:bg-primary-600` | Button/link hover |
| `hover:bg-blue-700` | `hover:bg-primary-700` | Button hover |
| `text-blue-600` | `text-primary-600` | **Only** on links/buttons (see exclusions) |
| `border-blue-500` | `border-primary-500` | Input focus, selected-tab border |
| `focus:ring-blue-500` | `focus:ring-primary-500` | Form/control focus |
| `focus:border-blue-500` | `focus:border-primary-500` | Input focus |

**Optional:** `hover:text-blue-800` → `hover:text-primary-700` when used with `text-blue-600` on the same link/button.

---

## Do NOT change

- **Status badges:** e.g. `bg-blue-100 text-blue-700`, `bg-blue-100 text-blue-600`, `alertColor: 'bg-blue-100 text-blue-700'`, status maps. Leave as-is.
- **Header/nav decorative blue:** `text-blue-200`, `hover:bg-blue-800` in DashboardBase (unless extending scope).
- **Chart colors in JS:** In `BusinessDevPipelineAnalytics.vue` line 402: `const colors = ['bg-blue-500', 'bg-indigo-500', ...]` — **do not change**. Explicitly verify after all replacements that this line still contains `'bg-blue-500'`.

---

## Implementation approach

1. **Global replace (safe everywhere)**  
   Apply in `frontend/src/views` and `frontend/src/components`. **Order:** do `hover:bg-blue-*` before `bg-blue-*`. **Exclude** `BusinessDevPipelineAnalytics.vue` from any `bg-blue-500` replace. **After replace:** verify manually that no status-badge or context-specific uses were changed.
   - `hover:bg-blue-600` → `hover:bg-primary-600`
   - `hover:bg-blue-700` → `hover:bg-primary-700`
   - `bg-blue-500` → `bg-primary-500` (excluding BusinessDevPipelineAnalytics.vue)
   - `bg-blue-600` → `bg-primary-600`
   - `border-blue-500` → `border-primary-500`
   - `focus:ring-blue-500` → `focus:ring-primary-500`
   - `focus:border-blue-500` → `focus:border-primary-500`

2. **DashboardBase.vue**  
   Avatar: `bg-blue-600` → `bg-primary-600`. Logout button: `bg-blue-700 hover:bg-blue-600` → `bg-primary-700 hover:bg-primary-600` (hover stays primary-600). Leave `text-blue-200`, `hover:bg-blue-800` unless extending scope.

3. **text-blue-600 (targeted)**  
   Replace only on links/buttons. Do **not** replace when part of a status badge (same element has `bg-blue-100` or `text-blue-700`).
   - **Targeted grep:**  
     `grep -rn "text-blue-600" src/views/ src/components/ --include="*.vue" | grep -v "bg-blue-100" | grep -v "text-blue-700"`
   - Manually verify each result; replace only on links/buttons. Optional: where replaced, also change `hover:text-blue-800` → `hover:text-primary-700`.

4. **Chart JS exception**  
   In `BusinessDevPipelineAnalytics.vue`, do **not** change:  
   `const colors = ['bg-blue-500', 'bg-indigo-500', ...]`  
   Verify after all replacements that this line is unchanged.

---

## Backup and version control

- Commit (or stage) in a way that allows easy revert (e.g. single commit "D1: standardize brand colors bg-blue to bg-primary").

---

## Verification

Run from `coi-prototype/frontend`:

1. **No unintended primary-blue left:**  
   `grep -r "bg-blue-600\|bg-blue-500" src/views/ src/components/ --include="*.vue" | grep -v "blue-100\|blue-200\|blue-50\|blue-700 " | grep -v "BusinessDevPipelineAnalytics"`  
   **Expected:** 0 lines.

2. **Status badges unchanged:**  
   `grep -r "bg-blue-100\|text-blue-700" src/views/ src/components/ --include="*.vue" | wc -l`  
   **Expected:** Multiple matches (badges still present).

3. **Chart JS unchanged:** Open `BusinessDevPipelineAnalytics.vue`; confirm `const colors = ['bg-blue-500', ...]` is still present.

4. **Manual:** Open dashboards and primary actions (Login, Requester New request, Form submit); confirm buttons/links use #0066CC.

---

## Suggested next steps after implementation

- Run the app: `npm run dev` (from `coi-prototype` or `coi-prototype/frontend`). As Requester, Director, Partner, confirm primary buttons/links use #0066CC.
- Run E2E: `npx playwright test <relevant-test-suite>` from `coi-prototype` to ensure no regressions.

---

## Files affected (from grep)

**Views:** DashboardBase, RequesterDashboard, DirectorDashboard, PartnerDashboard, ComplianceDashboard, COIRequestDetail, COIRequestForm, AdminDashboard, SuperAdminDashboard, FinanceDashboard, Reports, Login, FormBuilder, WorkflowConfig, ProspectManagement, PRMSDemo, ServiceCatalogManagement, EntityCodesManagement, HRMSVacationManagement.

**Components:** EmptyState, Button, ShareReportModal, FetchPRMSDataModal, RuleBuilder, RecommendationDetailModal, InfoRequestModal, ClarificationModal, DuplicateJustificationModal, CreateProspectModal, ClientProspectCombobox, Option3AccordionDesign, Option2TableDesign, InternationalOperationsForm, EditionSwitcher, BusinessDevProspects, BusinessDevAIInsights, ActionDropdownModal, ImpactAnalysisPanel.

**Optional:** InternationalOperationsDesignOptions.md (markdown examples).
