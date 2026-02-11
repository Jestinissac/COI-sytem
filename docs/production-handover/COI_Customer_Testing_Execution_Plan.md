# COI Prototype — Customer Testing Execution Plan

**Purpose:** Complete execution plan for fixing all gaps before deploying COI prototype to a server for customer testing. Give this document to Cursor as the task list.

**Date:** February 10, 2026
**Prerequisite:** Phase A (A1–A6) is COMPLETED. See `Phase_A_Before_After_Summary.md`.
**Source of truth:** `COI_Handover_Summary_for_Claude_Code.md` + this document.

---

## Rules for Implementation

```
- Auth: use req.userId and req.userRole only (never req.user).
- All endpoints returning COI request data must use mapResponseForRole(data, req.userRole).
- No emojis in email or notification content.
- Use parameterized queries; no string interpolation of user input in SQL.
- Use devLog() instead of console.log for debug output (already in environment.js).
- Prototype code: coi-prototype/backend and coi-prototype/frontend.
- Database: SQLite (coi-prototype/database/).
- Frontend: Vue 3 + TypeScript + Tailwind CSS.
- Backend: Express.js with ES module imports.
```

---

## Decisions (Locked)

- Login: Demo role-switcher (click role card → auto-login). No real OAuth for prototype.
- Approval flow: Make dynamic with `workflow_stages` table + WorkflowConfig UI.
- Seed rules: Pre-populate ~15 default CMA/IESBA rules on DB init.
- Reports: Implement top 5 priority reports, hide rest as "Phase 2".
- "Request New Client": Wire to existing CreateProspectModal.
- Form Builder: Fix 2 small issues (import + drag&drop).
- Global COI Clearance: Just additional info display, no export needed.
- BI Module: Skip for now.
- Social logins: Not appropriate for enterprise compliance — Azure AD SSO for production only.

---

## Phase B: User Journey Completeness + Core Fixes

### B1. Fix Form Builder (2 quick fixes)
**File:** `coi-prototype/frontend/src/views/FormBuilder.vue`
**Fix 1:** Add missing import — `ImpactAnalysisPanel` is referenced in template (line ~98) but never imported. Add:
```javascript
import ImpactAnalysisPanel from '@/components/ImpactAnalysisPanel.vue'
```
**Fix 2:** Fix drag & drop — `handleDrop()` function (line ~448) hardcodes drops to `section-1`. Update to detect which section element was dropped on using `event.target.closest('[data-section-id]')` or equivalent.

### B2. Wire "Need More Info" action for approvers
**Backend:** Endpoint already exists at `POST /api/coi/requests/:id/need-more-info` in `coiController.js`.
**Frontend files:** `coi-prototype/frontend/src/views/COIRequestDetail.vue`
- Director currently only has Approve/Reject buttons — add "Request More Info" button
- Wire to `POST /api/coi/requests/:id/need-more-info` with `info_required` text
- Track info request history: currently `coi_requests.info_required` stores only the latest. Change to `info_request_history` JSON array or add separate `info_requests` table:
```sql
CREATE TABLE info_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coi_request_id INTEGER NOT NULL,
  requested_by INTEGER NOT NULL,
  requested_by_role VARCHAR(50) NOT NULL,
  info_required TEXT NOT NULL,
  response TEXT,
  responded_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id),
  FOREIGN KEY (requested_by) REFERENCES users(id)
)
```

### B3. Add field-level form validation
**Files:** `coi-prototype/frontend/src/views/COIRequestForm.vue` + all `Step*.vue` components in `coi-prototype/frontend/src/components/coi-wizard/`
- Add validation on blur/change events (currently only validates on final submit)
- `Step4Service.vue`: Add end date >= start date validation
- `Step5Ownership.vue`: Add PIE tooltip explaining "Public Interest Entity" (use Tailwind tooltip or small info icon with hover text)
- Show validation errors inline next to fields (red border + error text below field)

### B4. Fix engagement code race condition
**File:** `coi-prototype/backend/src/services/engagementCodeService.js`
- Add DB-level UNIQUE constraint:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_engagement_code_unique ON coi_engagement_codes(engagement_code);
```
- Wrap code generation in a transaction with retry:
```javascript
const MAX_RETRIES = 3;
for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
  try {
    const code = generateCode(serviceType);
    db.prepare('INSERT INTO coi_engagement_codes ...').run(code, ...);
    return code;
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' && attempt < MAX_RETRIES - 1) continue;
    throw err;
  }
}
```

### B5. Add success confirmation after form submission
**File:** `coi-prototype/frontend/src/views/COIRequestForm.vue`
- After successful submit API call, show a success modal:
  - Title: "Request Submitted Successfully"
  - Body: "Your COI request [REQ-ID] has been submitted for review."
  - Next steps: "It will be reviewed by a Director in your department."
  - Action buttons: "View Request" (navigate to detail) | "Create Another" (reset form) | "Go to Dashboard"

### B6. Verify and fix permission configuration
**Files:**
- `coi-prototype/backend/src/services/permissionService.js`
- `coi-prototype/frontend/src/views/PermissionConfig.vue`
- Verify Super Admin can configure all 24 permissions
- Test that role-permission mapping persists and is enforced
- Check that permission changes are audit-logged

### B7. Demo Login Role-Switcher
**File:** `coi-prototype/frontend/src/views/Login.vue`
**Current:** Password form with email/password fields. Mock auth accepts any password.
**Change to:** Role card grid for quick demo login.

**Implementation:**
```vue
<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
    <h1 class="text-2xl font-bold mb-2">COI System Demo</h1>
    <p class="text-gray-600 mb-8">Select a role to login</p>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
      <div v-for="user in demoUsers" :key="user.role"
           @click="loginAs(user)"
           class="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg hover:border-primary-500 border-2 border-transparent transition-all">
        <div class="text-3xl mb-2">{{ user.icon }}</div>
        <h3 class="font-semibold">{{ user.role }}</h3>
        <p class="text-sm text-gray-500">{{ user.department }}</p>
        <p class="text-xs text-gray-400 mt-2">{{ user.description }}</p>
      </div>
    </div>

    <button @click="showAdvanced = !showAdvanced" class="mt-6 text-sm text-gray-400 hover:text-gray-600">
      Advanced Login
    </button>

    <!-- Existing email/password form, shown only when showAdvanced is true -->
    <form v-if="showAdvanced" ...>...</form>
  </div>
</template>
```

**demoUsers array** (use actual users from DB seed):
```javascript
const demoUsers = [
  { role: 'Requester', email: 'requester@bdo.com', department: 'Audit', description: 'Submit COI requests', icon: '📝' },
  { role: 'Director', email: 'director@bdo.com', department: 'Audit', description: 'Approve team requests', icon: '👔' },
  { role: 'Compliance', email: 'compliance@bdo.com', department: 'Compliance', description: 'Review regulations', icon: '⚖️' },
  { role: 'Partner', email: 'partner@bdo.com', department: 'Audit', description: 'Final approval', icon: '🏛️' },
  { role: 'Finance', email: 'finance@bdo.com', department: 'Finance', description: 'Generate codes', icon: '💰' },
  { role: 'Admin', email: 'admin@bdo.com', department: 'Admin', description: 'Execute & manage', icon: '⚙️' },
  { role: 'Super Admin', email: 'superadmin@bdo.com', department: 'IT', description: 'System configuration', icon: '🔧' },
]
```

**loginAs(user):** Call `POST /api/auth/login` with `{ email: user.email, password: 'demo' }`. Backend mock auth accepts any password.

### B8. Dynamic Approval Flow
**Current state:** Approval chain hardcoded in `coiController.js` lines 969-1040 as if/else:
```
Director → Compliance → Partner → Finance
```

**Step 1: Create `workflow_stages` table**
Add to `coi-prototype/database/schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS workflow_stages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stage_order INTEGER NOT NULL,
  stage_name VARCHAR(100) NOT NULL,
  role_required VARCHAR(50) NOT NULL,
  status_name VARCHAR(100) NOT NULL UNIQUE,
  next_stage_id INTEGER,
  is_active BOOLEAN DEFAULT 1,
  can_skip BOOLEAN DEFAULT 0,
  skip_condition TEXT,
  is_required BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (next_stage_id) REFERENCES workflow_stages(id)
);

INSERT OR IGNORE INTO workflow_stages (id, stage_order, stage_name, role_required, status_name, next_stage_id, is_active, is_required) VALUES
  (1, 1, 'Director Review', 'Director', 'Pending Director Approval', 2, 1, 0),
  (2, 2, 'Compliance Review', 'Compliance', 'Pending Compliance', 3, 1, 1),
  (3, 3, 'Partner Approval', 'Partner', 'Pending Partner', 4, 1, 0),
  (4, 4, 'Finance - Code Generation', 'Finance', 'Pending Finance', NULL, 1, 0);
```
Note: `is_required = 1` for Compliance — cannot be disabled (regulatory).

**Step 2: Refactor `coiController.js` approve function**
Replace hardcoded if/else (lines 969-1040) with:
```javascript
function getNextStatus(currentStatus) {
  const currentStage = db.prepare(
    'SELECT * FROM workflow_stages WHERE status_name = ? AND is_active = 1'
  ).get(currentStatus);

  if (!currentStage || !currentStage.next_stage_id) {
    return 'Approved'; // No more stages
  }

  // Find next ACTIVE stage
  let nextStage = db.prepare(
    'SELECT * FROM workflow_stages WHERE id = ?'
  ).get(currentStage.next_stage_id);

  while (nextStage && !nextStage.is_active) {
    if (!nextStage.next_stage_id) return 'Approved';
    nextStage = db.prepare(
      'SELECT * FROM workflow_stages WHERE id = ?'
    ).get(nextStage.next_stage_id);
  }

  return nextStage ? nextStage.status_name : 'Approved';
}
```

**Step 3: Backend API for workflow config**
Add to `config.routes.js`:
```javascript
router.get('/workflow-stages', authenticate, configController.getWorkflowStages);
router.put('/workflow-stages/:id', authenticate, requireRole(['Super Admin']), configController.updateWorkflowStage);
router.post('/workflow-stages/reorder', authenticate, requireRole(['Super Admin']), configController.reorderWorkflowStages);
```

**Step 4: Frontend `WorkflowConfig.vue`**
New file: `coi-prototype/frontend/src/views/WorkflowConfig.vue`
- Show stages as sortable cards/list
- Each card: stage name, role, status name, active toggle, required badge
- Compliance stage: active toggle disabled (is_required = 1)
- Drag to reorder (updates stage_order + next_stage_id chain)
- Add route in `router/index.ts`: `/coi/super-admin/workflow-config`

### B9. Fix Feedback/Notifications at Every Stage
**Frontend gaps — `coi-prototype/frontend/src/views/COIRequestDetail.vue`:**

Currently after approve/reject/need-more-info, only `await loadRequest()` runs. NO toast. NO confirmation.

**Add toasts after every action:**
```javascript
// After successful approve:
toast.success(`Request approved. Moved to ${response.data.nextStatus}.`)

// Before reject — add confirmation:
const confirmed = await showConfirmationModal({
  title: 'Confirm Rejection',
  message: 'Are you sure you want to reject this request? This action will notify the requester.',
  confirmText: 'Reject',
  confirmClass: 'bg-red-600'
})
if (!confirmed) return

// After successful reject:
toast.success('Request rejected. Requester has been notified.')

// After need-more-info:
toast.success('Information request sent to requester.')

// After engagement code generation:
toast.success(`Engagement code ${response.data.engagementCode} generated successfully.`)
```

**Backend notification gaps — `coi-prototype/backend/src/controllers/coiController.js`:**

1. **Previous approvers not notified.** In the approve function, after updating status, also notify previous approvers:
```javascript
// After approval, notify previous approvers
const previousApprovers = getPreviousApprovers(request.id);
for (const approver of previousApprovers) {
  notifyApproverProgressUpdate(approver, request, newStatus);
}
```

2. **Finance code generation has no notification.** In `generateEngagementCode` or equivalent function, add:
```javascript
notifyEngagementCodeGenerated(request.requester_id, engagementCode, request.id);
notifyAdminExecutionRequired(request.id, engagementCode);
```

### B10. User Management UI in SuperAdmin Dashboard
**File:** `coi-prototype/frontend/src/views/SuperAdminDashboard.vue`
**Backend APIs already exist:**
- `GET /api/auth/users` — list all users
- `POST /api/auth/users` — create user
- `PUT /api/auth/users/:id` — update user
- `POST /api/auth/users/:id/disable` — disable user
- `POST /api/auth/users/:id/enable` — enable user

**Add Users tab with:**
- Table: name, email, role, department, line_of_service, active (badge), actions
- "Create User" button → modal with: name, email, role (dropdown), department, password
- Edit button per row → modal with: name, email, role, department, active toggle
- Disable/Enable toggle per row
- Search/filter by role, department, active status

### B11. Rule Builder Fixes

**B11a. Seed Rules**
New file: `coi-prototype/database/seed-rules.sql`
Create ~15 default rules:

```sql
-- CMA Red Lines (Kuwait)
INSERT INTO business_rules_config (rule_name, rule_type, condition_field, condition_operator, condition_value, action_type, action_value, is_active, approval_status, created_by, rule_category, regulation_reference, applies_to_cma, confidence_level, can_override) VALUES
('CMA: Audit + Bookkeeping Prohibited', 'conflict', 'service_type', 'contains', 'Bookkeeping', 'block', 'CMA regulation prohibits providing bookkeeping services to audit clients', 1, 'Approved', 1, 'CMA', 'CMA Corporate Governance Rules', 1, 'CRITICAL', 0),
('CMA: Audit + Management Consulting Prohibited', 'conflict', 'service_type', 'contains', 'Management Consulting', 'block', 'CMA prohibits management consulting for audit clients', 1, 'Approved', 1, 'CMA', 'CMA Corporate Governance Rules', 1, 'CRITICAL', 0);

-- IESBA Red Lines (Global)
INSERT INTO business_rules_config (rule_name, rule_type, condition_field, condition_operator, condition_value, action_type, action_value, is_active, approval_status, created_by, rule_category, regulation_reference, applies_to_pie, confidence_level, can_override, guidance_text) VALUES
('IESBA Red Line: Management Responsibility', 'conflict', 'service_type', 'contains', 'Management Functions', 'recommend_reject', 'IESBA 290.104: Assuming management responsibility creates self-review threat', 1, 'Approved', 1, 'IESBA', 'IESBA Code Section 290.104', 0, 'CRITICAL', 0, 'Management responsibility involves making decisions on behalf of the client. This is an absolute prohibition under IESBA.'),
('IESBA Red Line: Advocacy Threat', 'conflict', 'service_type', 'contains', 'Tax Advocacy', 'recommend_reject', 'IESBA 290.105: Acting as advocate creates advocacy threat to independence', 1, 'Approved', 1, 'IESBA', 'IESBA Code Section 290.105', 0, 'CRITICAL', 0, 'Advocacy involves promoting or defending a client position to the extent it compromises objectivity.'),
('IESBA Red Line: Contingent Fees for Audit', 'conflict', 'service_type', 'contains', 'Contingent Fee', 'recommend_reject', 'IESBA 290.106: Contingent fees for audit clients create self-interest threat', 1, 'Approved', 1, 'IESBA', 'IESBA Code Section 290.106', 0, 'CRITICAL', 0, 'Contingent fees create a direct financial interest in the outcome.'),

-- IESBA PIE-Specific Rules
('IESBA: PIE Tax Planning Prohibited', 'conflict', 'pie_status', 'equals', 'Yes', 'recommend_reject', 'IESBA 290.212: Tax planning services prohibited for PIE audit clients', 1, 'Approved', 1, 'IESBA', 'IESBA Code Section 290.212', 1, 'HIGH', 0, 'Tax planning for PIE audit clients creates self-review threat. Hard prohibition under IESBA.'),
('IESBA: PIE Tax Compliance Review Required', 'conflict', 'pie_status', 'equals', 'Yes', 'recommend_flag', 'IESBA 290.212: Tax compliance for PIE requires safeguards review', 1, 'Approved', 1, 'IESBA', 'IESBA Code Section 290.212', 1, 'MEDIUM', 1, 'Tax compliance for PIE is permitted with appropriate safeguards. Document safeguards applied.'),

-- Independence Rules
('Independence: Advisory to Audit Client', 'conflict', 'service_type', 'contains', 'Advisory', 'recommend_flag', 'Providing advisory services to an existing audit client requires independence review', 1, 'Approved', 1, 'IESBA', 'IESBA Code Section 290.150', 0, 'HIGH', 1, 'Review whether the advisory engagement could impair audit independence.'),
('Independence: High-Value Engagement Review', 'validation', 'total_fees', 'greater_than', '100000', 'recommend_flag', 'High-value engagements (>100K) require additional partner review', 1, 'Approved', 1, 'Custom', '', 0, 'MEDIUM', 1, 'Engagements above 100K require additional scrutiny per firm policy.'),
('Independence: Long-Duration Engagement', 'validation', 'engagement_duration', 'greater_than', '36', 'recommend_flag', 'Engagements exceeding 3 years require rotation review', 1, 'Approved', 1, 'IESBA', 'IESBA Code Section 290.151', 0, 'MEDIUM', 1, 'Extended engagements may create familiarity threat. Review rotation requirements.'),

-- Workflow Rules
('Approval: Expedited Low-Risk', 'workflow', 'total_fees', 'less_than', '10000', 'recommend_approve', 'Low-value engagement eligible for expedited approval', 1, 'Approved', 1, 'Custom', '', 0, 'LOW', 1, 'Engagements below 10K may qualify for simplified approval path.'),

-- Group Conflict Rules
('Group: Parent Company Conflict Check', 'conflict', 'parent_company_id', 'is_not_empty', '', 'recommend_flag', 'Client has parent company — check for group-level independence conflicts', 1, 'Approved', 1, 'IESBA', 'IESBA Code Section 290.13', 0, 'HIGH', 1, 'When a client is part of a group, independence requirements extend to the entire group structure.'),
('International: Cross-Border Operations', 'conflict', 'international_operations', 'equals', 'true', 'recommend_flag', 'Client has international operations — check foreign entity conflicts', 1, 'Approved', 1, 'IESBA', 'IESBA Code Section 290.25', 0, 'MEDIUM', 1, 'International operations require checking conflicts in all jurisdictions.');
```

Run this seed file after schema creation (add to DB init script).

**B11b. Computed Fields**
**File:** `coi-prototype/backend/src/services/businessRulesEngine.js` (or wherever `FieldMappingService.prepareForRuleEvaluation` is)
Implement:
```javascript
function prepareForRuleEvaluation(requestData) {
  const enhanced = { ...requestData };

  // days_since_submission
  if (requestData.submitted_at) {
    enhanced.days_since_submission = Math.floor(
      (Date.now() - new Date(requestData.submitted_at).getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  // is_group_company
  enhanced.is_group_company = !!requestData.parent_company_id;

  // engagement_duration (months)
  if (requestData.engagement_start_date && requestData.engagement_end_date) {
    const start = new Date(requestData.engagement_start_date);
    const end = new Date(requestData.engagement_end_date);
    enhanced.engagement_duration = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30));
  }

  // has_active_audit — check if this client has an active audit engagement
  if (requestData.client_name) {
    const activeAudit = db.prepare(`
      SELECT COUNT(*) as count FROM coi_requests
      WHERE client_name = ? AND service_type LIKE '%Audit%'
      AND status IN ('Approved', 'Active')
    `).get(requestData.client_name);
    enhanced.has_active_audit = activeAudit.count > 0;
  }

  return enhanced;
}
```

**B11c. Recommendation Detail Modal for Compliance**
**File:** `coi-prototype/frontend/src/views/ComplianceDashboard.vue`
Currently shows recommendation count/summary but no detail view.
Add a `RecommendationDetailModal.vue` component:
- Shows each matched rule with: rule name, category, confidence level, action type, reason, guidance text
- Per-rule actions: Accept | Override (requires justification textarea) | Dismiss
- Summary: "3 of 5 recommendations accepted, 1 overridden, 1 dismissed"
- Wire to Compliance approval flow — override data included in approval API call

---

## Phase C: Reports Cleanup

### C1. Hide "coming-soon" reports
**File:** `coi-prototype/frontend/src/views/Reports.vue`
- Hide or badge as "Phase 2": System Config, User Activity, Business Rules, Audit Trail, My Request Details, Team Performance, Pending Approvals, Department Service Analysis, and all other unimplemented reports
- Keep only: reports that have working data + the 5 new ones from C2

### C2. Implement top 5 priority reports
**Backend:** `coi-prototype/backend/src/services/reportDataService.js` + `reportController.js`
**Frontend:** `coi-prototype/frontend/src/views/Reports.vue`

| # | Report | Roles | Data Source | Chart Type |
|---|--------|-------|-------------|------------|
| 1 | Approval Workflow Report | Admin, Compliance | Time at each stage from coi_requests timestamps (submitted_at, director_approval_at, compliance_reviewed_at, partner_approved_at, finance_approved_at) | Stacked bar + summary table |
| 2 | SLA Compliance Report | Admin | notification_stats + SLA breach data | Bar chart (met/warning/breach) |
| 3 | Department Performance | Director, Admin | coi_requests grouped by department — counts, avg time, approval rate | Bar chart + table |
| 4 | Conflict Analysis Report | Compliance | rule_recommendations JSON parsed — conflict types, resolution rates | Pie + table |
| 5 | Active Engagements Report | Partner, Admin | coi_requests WHERE status IN ('Approved','Active') with engagement_code | Table with filters + status badges |

### C3. Add CRM report PDF/Excel export
**Files:** `coi-prototype/backend/src/services/pdfExportService.js`, `excelExportService.js`
- Add export endpoints for existing 8 CRM reports
- PDF: Use `pdfkit` or `puppeteer` (check what's already in package.json)
- Excel: Use `exceljs` or `xlsx`

### C4. Add line chart for trends
**File:** `coi-prototype/frontend/src/components/reports/ReportCharts.vue`
- Import `LineElement, PointElement` from Chart.js and register
- Add `chartType: 'line'` option in chart config
- Add `chartType: 'doughnut'` variant
- Use line chart for: monthly submission trends, approval time trends, conversion trends

### C5. Integrate ReportingDashboard
**File:** `coi-prototype/frontend/src/views/ReportingDashboard.vue`
- Add as "Analytics" tab in Reports.vue, OR
- Add link from Reports page: "View Analytics Dashboard →"
- Register route if not already: `/coi/reports/analytics`

---

## Phase D: UI/UX Polish

### D1. Standardize styling
- Colors: Replace `bg-blue-600` with `bg-primary-600` everywhere (Tailwind config already has primary)
- Padding: Cards → `p-6`, Table cells → `px-6 py-4`
- Border radius: Cards → `rounded-lg`, Modals → `rounded-xl`, Buttons → `rounded-md`
- Shadows: Cards → `shadow-sm hover:shadow-md`, Modals → `shadow-xl`

### D2. Add breadcrumb navigation
**File:** `coi-prototype/frontend/src/views/DashboardBase.vue`
Add below header:
```vue
<nav class="text-sm text-gray-500 px-6 py-2 bg-gray-50 border-b">
  <span>Home</span> <span class="mx-1">›</span>
  <span>{{ roleName }} Dashboard</span>
  <template v-if="currentTab">
    <span class="mx-1">›</span>
    <span class="text-gray-700">{{ currentTab }}</span>
  </template>
</nav>
```

### D3. Make tables responsive
All dashboard tab components with `<table>`:
- Wrap in `<div class="overflow-x-auto">`
- Add `min-w-[800px]` or appropriate min-width to table
- This ensures horizontal scroll on small screens

### D4. Add filter persistence
Dashboard components:
- Use `useRoute().query` to store active filters as URL params
- On mount, read filters from URL
- On filter change, update URL with `router.replace({ query: { ...filters } })`

### D5. Add print view for request details
**File:** `coi-prototype/frontend/src/views/COIRequestDetail.vue`
- Add "Print" button in header
- Add print CSS:
```css
@media print {
  .sidebar, .header, .breadcrumb, .action-buttons { display: none !important; }
  .print-only { display: block !important; }
  body { font-size: 12pt; }
}
```

---

## Phase E: CRM Polish

### E1. Pipeline funnel visualization
**File:** `coi-prototype/frontend/src/views/ProspectManagement.vue`
- Add funnel chart at top of page showing count at each stage: New → Contacted → Qualified → Proposal → Won/Lost
- Data: Query `prospect_funnel_events` grouped by latest stage per prospect
- Use Chart.js bar chart styled as funnel (decreasing width) or `chartjs-chart-funnel`

### E2. Activity timeline for prospects
**File:** `coi-prototype/frontend/src/views/ProspectManagement.vue`
- In prospect detail/expand view, show chronological timeline
- Data: `prospect_funnel_events` for that prospect, ordered by date
- Each event: date, stage change, notes

### E3. Improve prospect search/filters
**File:** `coi-prototype/frontend/src/views/ProspectManagement.vue`
- Add filter bar with: status dropdown, lead source dropdown, date range picker, industry dropdown
- Currently only searches by name/CR number

---

## Execution Order

### Priority 1 (Do first — highest customer-visible impact)
1. B9 — Feedback/toasts at every stage
2. B7 — Demo login role-switcher
3. B11 — Rule builder seed rules + computed fields + recommendation modal
4. B1 — Form Builder 2 fixes

### Priority 2 (Complete user journeys)
5. B2 — Wire "Need More Info"
6. B5 — Success confirmation on submit
7. B3 — Field validation
8. B4 — Engagement code race condition
9. B10 — User management UI

### Priority 3 (Infrastructure + config)
10. B8 — Dynamic approval flow
11. B6 — Permission config verification

### Priority 4 (Reports)
12. C1 — Hide coming-soon reports
13. C2 — Implement top 5 reports
14. C3 — CRM report exports
15. C4 — Line charts
16. C5 — ReportingDashboard

### Priority 5 (Polish)
17. D1-D5 — UI styling, breadcrumbs, responsive tables, filters, print
18. E1-E3 — CRM funnel, timeline, filters

---

## Verification Checklist

After all phases, verify:

1. [ ] Demo Login — click each role card → auto-login → correct dashboard
2. [ ] Full Chain — Draft → Director → Compliance → Partner → Finance → Active (toasts at each step)
3. [ ] Rejection — confirmation modal appears → reject → requester notified → resubmit works
4. [ ] Need More Info — Director requests info → requester sees it → responds → back to Director
5. [ ] Rule Builder — 15 seed rules visible → create new rule → test → approve → triggers on submit
6. [ ] Recommendations — Compliance sees detail modal → accept/override per rule → logged
7. [ ] Engagement Code — generate → unique → concurrent test passes
8. [ ] Form Builder — add field → drag to section → impact panel loads
9. [ ] Workflow Config — Super Admin disables Director stage → approval skips Director
10. [ ] User Management — Super Admin creates user, edits role, disables user
11. [ ] Reports — 5 new reports render → charts correct → PDF/Excel export works
12. [ ] CRM — create prospect from Step 3 → funnel chart shows → timeline shows events
13. [ ] Mobile — 375px/768px → tables scroll → forms usable
14. [ ] No emojis in emails (verify A1 still holds)
15. [ ] No console.log in production mode (verify A2 still holds)
16. [ ] Run E2E: `cd coi-prototype && npm run test:e2e`
