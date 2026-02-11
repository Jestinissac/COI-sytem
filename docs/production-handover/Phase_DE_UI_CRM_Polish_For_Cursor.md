# Phase D + E — UI/UX Polish + Prospect CRM Polish (Cursor Execution Plan)

**Date:** February 11, 2026
**Prerequisites:** Phases A, B, C all COMPLETED. Server running with fresh DB.
**Workspace:** `/Volumes/Dev Options/Master codebase/Envision PRMS/coi-prototype/`

---

## Terminology Clarification

```
- "Prospect CRM" = Prospect lifecycle management (create prospect → COI clearance → engagement → convert to client via PRMS)
- "Business Development" = Analytics/insights for upselling to existing clients (DEFERRED for prototype)
- "PRMS" = Project module where engagement letter is signed and prospect becomes a client
- The tab currently labelled "Business Development" in dashboards should be renamed to "Prospect CRM"
  because it manages the prospect-to-client lifecycle, NOT upsell analytics
```

---

## Rules for Implementation

```
- Auth: use req.userId and req.userRole only (never req.user).
- No emojis in email or notification content.
- Use devLog() instead of console.log for debug output.
- Frontend: Vue 3 + TypeScript + Tailwind CSS.
- Backend: Express.js with ES module imports.
- Database: SQLite (coi-prototype/database/).
- Tailwind primary color already defined: primary-500 (#0066CC), primary-600 (#0052CC), primary-700 (#003D99).
- Chart.js 4.5 + vue-chartjs 5.3 already installed.
- All dashboard tables already have overflow-x-auto. Do NOT re-add.
```

---

## Phase D: UI/UX Polish

### D1. Standardize Brand Colors (bg-blue → bg-primary)

**Problem:** 75 occurrences of `bg-blue-500`/`bg-blue-600` across 18 view files. Zero uses of the defined `bg-primary-*` palette.

**Task:** In ALL files under `coi-prototype/frontend/src/views/`, replace:
- `bg-blue-500` → `bg-primary-500`
- `bg-blue-600` → `bg-primary-600`
- `hover:bg-blue-600` → `hover:bg-primary-600`
- `hover:bg-blue-700` → `hover:bg-primary-700`
- `text-blue-600` → `text-primary-600` (only for interactive elements like buttons/links, NOT for status badges)
- `border-blue-500` → `border-primary-500`
- `focus:ring-blue-500` → `focus:ring-primary-500`

**DO NOT change:**
- Blue status badges (e.g., `bg-blue-100 text-blue-700` for "Need More Info" status) — these use blue semantically
- Blue info alerts/panels
- Chart colors (those are set in JS, not Tailwind)

**Files (all under `frontend/src/views/`):**
```
AdminDashboard.vue (3)
ServiceCatalogManagement.vue (3)
HRMSVacationManagement.vue (2)
ProspectManagement.vue (2)
SuperAdminDashboard.vue (13)
DashboardBase.vue (2)
FormBuilder.vue (3)
PRMSDemo.vue (1)
DirectorDashboard.vue (5)
ComplianceDashboard.vue (1)
EntityCodesManagement.vue (2)
COIRequestDetail.vue (7)
Login.vue (1)
RequesterDashboard.vue (8)
FinanceDashboard.vue (1)
WorkflowConfig.vue (1)
COIRequestForm.vue (12)
Reports.vue (8)
```

**Also check `frontend/src/components/` for the same pattern.**

**Verification:** After changes, run:
```bash
grep -r "bg-blue-600\|bg-blue-500" frontend/src/views/ | grep -v "blue-100\|blue-200\|blue-50\|blue-700 " | wc -l
# Should be 0 or near-zero (only status badge blues remain)
```

---

### D2. Add Breadcrumb Navigation

**File:** `coi-prototype/frontend/src/views/DashboardBase.vue`

**Current state:** Has a header with logo, user info, and logout. No breadcrumbs.

**Implementation:**
Add a breadcrumb bar below the header (before the tab navigation, around line 55):

```html
<!-- Breadcrumb Navigation -->
<nav class="px-6 py-2 bg-gray-50 border-b border-gray-200 text-sm" aria-label="Breadcrumb">
  <ol class="flex items-center gap-1.5 text-gray-500">
    <li>
      <router-link to="/coi" class="hover:text-primary-600 transition-colors">Home</router-link>
    </li>
    <li class="flex items-center gap-1.5">
      <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
      <span class="text-gray-900 font-medium">{{ currentPageTitle }}</span>
    </li>
  </ol>
</nav>
```

Add computed property `currentPageTitle` that returns the role dashboard name based on the current route:
```typescript
const currentPageTitle = computed(() => {
  const route = useRoute()
  const titles: Record<string, string> = {
    '/coi/requester': 'Requester Dashboard',
    '/coi/director': 'Director Dashboard',
    '/coi/compliance': 'Compliance Dashboard',
    '/coi/partner': 'Partner Dashboard',
    '/coi/finance': 'Finance Dashboard',
    '/coi/admin': 'Admin Dashboard',
    '/coi/super-admin': 'Super Admin Dashboard',
    '/coi/reports': 'Reports',
    '/coi/form-builder': 'Form Builder',
    '/coi/service-catalog': 'Service Catalog',
    '/coi/entity-codes': 'Entity Codes',
    '/coi/super-admin/workflow-config': 'Workflow Configuration',
  }
  return titles[route.path] || route.meta?.title || 'Dashboard'
})
```

**Also** add breadcrumbs to `COIRequestDetail.vue` — showing: Home > [Role Dashboard] > Request [ID]:
```html
<nav class="mb-4 text-sm" aria-label="Breadcrumb">
  <ol class="flex items-center gap-1.5 text-gray-500">
    <li><router-link to="/coi" class="hover:text-primary-600">Home</router-link></li>
    <li class="flex items-center gap-1.5">
      <span class="text-gray-400">/</span>
      <router-link :to="dashboardPath" class="hover:text-primary-600">{{ userRole }} Dashboard</router-link>
    </li>
    <li class="flex items-center gap-1.5">
      <span class="text-gray-400">/</span>
      <span class="text-gray-900 font-medium">Request {{ request?.request_id }}</span>
    </li>
  </ol>
</nav>
```

---

### D3. Make Tables Responsive — ALREADY DONE ✅

All dashboard tables already have `overflow-x-auto` wrappers. **Skip this task.**

---

### D4. Add Filter Persistence

**File:** `coi-prototype/frontend/src/views/ProspectManagement.vue`

**Current state:** 6 filters (search, status, checkboxes) use in-memory `ref()` only — reset on page refresh.

**Implementation:** Use route query params to persist filters:

```typescript
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Initialize filters from route query
const filters = reactive({
  search: (route.query.search as string) || '',
  prospectsOnly: route.query.prospectsOnly === 'true',
  existingClientsOnly: route.query.existingClientsOnly === 'true',
  convertedOnly: route.query.convertedOnly === 'true',
  status: (route.query.status as string) || '',
  prmsSynced: (route.query.prmsSynced as string) || ''
})

// Watch filters and update URL
watch(filters, (newFilters) => {
  const query: Record<string, string> = {}
  if (newFilters.search) query.search = newFilters.search
  if (newFilters.prospectsOnly) query.prospectsOnly = 'true'
  if (newFilters.existingClientsOnly) query.existingClientsOnly = 'true'
  if (newFilters.convertedOnly) query.convertedOnly = 'true'
  if (newFilters.status) query.status = newFilters.status
  if (newFilters.prmsSynced) query.prmsSynced = newFilters.prmsSynced
  router.replace({ query })
}, { deep: true })
```

**Optional:** Apply the same pattern to RequesterDashboard.vue and DirectorDashboard.vue for their tab/filter state.

---

### D5. Add Print View for Request Details

**File:** `coi-prototype/frontend/src/views/COIRequestDetail.vue`

**Step 1:** Add Print button in the header actions area (near the existing action buttons):

```html
<button
  @click="printRequest"
  class="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1.5"
>
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
  </svg>
  Print
</button>
```

**Step 2:** Add print function:
```typescript
function printRequest() {
  window.print()
}
```

**Step 3:** Add `@media print` CSS in a `<style>` block at the bottom of the file:

```css
@media print {
  /* Hide non-printable elements */
  nav, .no-print, button, .fixed, [role="dialog"],
  .breadcrumb-nav, .action-buttons, .tab-navigation {
    display: none !important;
  }

  /* Full width, no shadows */
  .max-w-4xl, .max-w-5xl, .max-w-6xl, .max-w-7xl {
    max-width: 100% !important;
  }
  .shadow-sm, .shadow, .shadow-md, .shadow-lg {
    box-shadow: none !important;
  }

  /* Ensure all content is visible */
  .overflow-hidden, .overflow-x-auto {
    overflow: visible !important;
  }

  /* Print-friendly colors */
  body {
    background: white !important;
    color: black !important;
  }

  /* Page break handling */
  .approval-section {
    page-break-inside: avoid;
  }
}
```

**Also** add `no-print` class to action buttons container, modals, and the back/navigation buttons so they are hidden when printing.

---

## Phase E: Prospect CRM Polish

### E1. Add Prospect Pipeline Funnel Visualization

**File:** `coi-prototype/frontend/src/views/ProspectManagement.vue`

**Data source:** Backend already has `prospect_funnel_events` table. Need API endpoint + frontend chart.

**Step 1: Backend API** — Add endpoint in `coi-prototype/backend/src/controllers/prospectController.js`:

```javascript
// GET /api/coi/prospects/funnel-summary
export async function getFunnelSummary(req, res) {
  try {
    const db = getDatabase()
    const stages = [
      { key: 'Draft', label: 'Draft' },
      { key: 'Pending Director Approval', label: 'Director Review' },
      { key: 'Pending Compliance', label: 'Compliance Review' },
      { key: 'Pending Partner', label: 'Partner Approval' },
      { key: 'Pending Finance', label: 'Finance' },
      { key: 'Approved', label: 'Approved' },
      { key: 'Active', label: 'Active' }
    ]

    const counts = stages.map(stage => {
      const row = db.prepare(`
        SELECT COUNT(*) as count FROM coi_requests
        WHERE is_prospect = 1 AND status = ?
      `).get(stage.key)
      return { stage: stage.label, count: row?.count || 0 }
    })

    // Also get total prospects and conversion rate
    const total = db.prepare('SELECT COUNT(*) as count FROM prospects').get()
    const converted = db.prepare("SELECT COUNT(*) as count FROM prospects WHERE status = 'Converted'").get()

    res.json({
      funnel: counts,
      total: total?.count || 0,
      converted: converted?.count || 0,
      conversionRate: total?.count > 0 ? ((converted?.count || 0) / total.count * 100).toFixed(1) : '0.0'
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

**Step 2: Register route** in the prospect routes file (wherever prospect routes are registered):
```javascript
router.get('/prospects/funnel-summary', authMiddleware, getFunnelSummary)
```

**Step 3: Frontend Funnel Chart** — Add above the prospects table in `ProspectManagement.vue`:

```html
<!-- CRM Funnel Overview -->
<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
  <h3 class="text-lg font-semibold text-gray-900 mb-4">Prospect Pipeline</h3>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
    <div class="text-center p-3 bg-gray-50 rounded-lg">
      <p class="text-2xl font-bold text-primary-600">{{ funnelData.total }}</p>
      <p class="text-xs text-gray-500">Total Prospects</p>
    </div>
    <div class="text-center p-3 bg-green-50 rounded-lg">
      <p class="text-2xl font-bold text-green-600">{{ funnelData.converted }}</p>
      <p class="text-xs text-gray-500">Converted</p>
    </div>
    <div class="text-center p-3 bg-blue-50 rounded-lg">
      <p class="text-2xl font-bold text-blue-600">{{ funnelData.conversionRate }}%</p>
      <p class="text-xs text-gray-500">Conversion Rate</p>
    </div>
    <div class="text-center p-3 bg-amber-50 rounded-lg">
      <p class="text-2xl font-bold text-amber-600">{{ activePipeline }}</p>
      <p class="text-xs text-gray-500">In Pipeline</p>
    </div>
  </div>
  <!-- Horizontal Bar Funnel -->
  <div class="space-y-2">
    <div v-for="stage in funnelData.funnel" :key="stage.stage" class="flex items-center gap-3">
      <span class="text-xs text-gray-600 w-28 text-right truncate">{{ stage.stage }}</span>
      <div class="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="getFunnelBarColor(stage.stage)"
          :style="{ width: getFunnelBarWidth(stage.count) + '%' }"
        ></div>
        <span class="absolute inset-0 flex items-center justify-center text-xs font-medium"
              :class="stage.count > 0 ? 'text-white' : 'text-gray-400'">
          {{ stage.count }}
        </span>
      </div>
    </div>
  </div>
</div>
```

Add the data fetching and helper functions:
```typescript
const funnelData = ref({ funnel: [], total: 0, converted: 0, conversionRate: '0.0' })

const activePipeline = computed(() =>
  funnelData.value.funnel.reduce((sum: number, s: any) => sum + s.count, 0) -
  (funnelData.value.funnel.find((s: any) => s.stage === 'Active')?.count || 0)
)

async function fetchFunnelData() {
  try {
    const { data } = await api.get('/coi/prospects/funnel-summary')
    funnelData.value = data
  } catch (error) {
    // Silently handle - funnel is optional
  }
}

function getFunnelBarWidth(count: number) {
  const max = Math.max(...funnelData.value.funnel.map((s: any) => s.count), 1)
  return Math.max((count / max) * 100, count > 0 ? 8 : 0)
}

function getFunnelBarColor(stage: string) {
  const colors: Record<string, string> = {
    'Draft': 'bg-gray-400',
    'Director Review': 'bg-blue-400',
    'Compliance Review': 'bg-indigo-500',
    'Partner Approval': 'bg-purple-500',
    'Finance': 'bg-amber-500',
    'Approved': 'bg-green-500',
    'Active': 'bg-green-600'
  }
  return colors[stage] || 'bg-gray-400'
}

// Call on mount
onMounted(() => {
  fetchFunnelData()
  // ... existing onMounted code
})
```

---

### E2. Add Prospect Activity Timeline

**File:** `coi-prototype/frontend/src/views/ProspectManagement.vue`

**Step 1: Backend API** — Add to `prospectController.js`:

```javascript
// GET /api/coi/prospects/:id/timeline
export async function getProspectTimeline(req, res) {
  try {
    const db = getDatabase()
    const events = db.prepare(`
      SELECT pfe.*, u.name as user_name
      FROM prospect_funnel_events pfe
      LEFT JOIN users u ON pfe.user_id = u.id
      WHERE pfe.prospect_id = ?
      ORDER BY pfe.created_at DESC
      LIMIT 50
    `).all(req.params.id)

    res.json(events)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

Register: `router.get('/prospects/:id/timeline', authMiddleware, getProspectTimeline)`

**Step 2: Frontend Timeline** — Add a timeline panel that shows when a prospect row is expanded or selected:

```html
<!-- Activity Timeline Panel (shown when prospect selected) -->
<div v-if="selectedProspect && timelineEvents.length > 0" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4">
  <h4 class="text-sm font-semibold text-gray-900 mb-3">Activity Timeline - {{ selectedProspect.prospect_name }}</h4>
  <div class="relative pl-6 space-y-4">
    <div class="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200"></div>
    <div v-for="event in timelineEvents" :key="event.id" class="relative">
      <div class="absolute -left-4 w-3 h-3 rounded-full border-2 border-white"
           :class="getTimelineDotColor(event.to_stage)"></div>
      <div class="bg-gray-50 rounded-lg p-3">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm font-medium text-gray-900">
              {{ event.from_stage || 'Created' }} → {{ event.to_stage }}
            </p>
            <p v-if="event.notes" class="text-xs text-gray-600 mt-0.5">{{ event.notes }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-gray-500">{{ formatDate(event.created_at) }}</p>
            <p class="text-xs text-gray-400">{{ event.user_name || 'System' }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

Add data and helpers:
```typescript
const selectedProspect = ref(null)
const timelineEvents = ref([])

async function selectProspect(prospect: any) {
  selectedProspect.value = prospect
  try {
    const { data } = await api.get(`/coi/prospects/${prospect.id}/timeline`)
    timelineEvents.value = data
  } catch (error) {
    timelineEvents.value = []
  }
}

function getTimelineDotColor(stage: string) {
  const colors: Record<string, string> = {
    'Draft': 'bg-gray-400',
    'Pending Director Approval': 'bg-blue-500',
    'Pending Compliance': 'bg-indigo-500',
    'Pending Partner': 'bg-purple-500',
    'Pending Finance': 'bg-amber-500',
    'Approved': 'bg-green-500',
    'Active': 'bg-green-600',
    'Converted': 'bg-emerald-500',
    'Lost': 'bg-red-500'
  }
  return colors[stage] || 'bg-gray-400'
}
```

Make the prospect table rows clickable: add `@click="selectProspect(prospect)"` and `cursor-pointer hover:bg-gray-50` class.

---

### E3. Improve Prospect Search/Filters — ALREADY DONE ✅

ProspectManagement.vue already has 6 filters:
- Text search
- Prospects Only / Existing Clients / Converted
- Status dropdown (Active/Converted/Inactive)
- PRMS Sync filter

**Skip this task** — filters are comprehensive. D4 adds URL persistence for them.

---

### D6. Rename "Business Development" Tab → "Prospect CRM"

**Why:** The tab currently labelled "Business Development" manages the prospect-to-client lifecycle (create prospect → COI clearance → engagement → convert). "Business Development" implies upsell analytics (which is deferred). Rename to "Prospect CRM" to match the actual functionality.

**Changes — Label only (keep `id: 'business-dev'` and all internal variable names unchanged):**

| File | Line | Current | New |
|------|------|---------|-----|
| `RequesterDashboard.vue` | 1388 | `label: 'Business Development'` | `label: 'Prospect CRM'` |
| `DirectorDashboard.vue` | 1223 | `label: 'Business Development'` | `label: 'Prospect CRM'` |
| `PartnerDashboard.vue` | 1581 | `label: 'Business Development'` | `label: 'Prospect CRM'` |

**Also update comments (optional but tidy):**
- `RequesterDashboard.vue` line 1161: `<!-- Business Development Tab -->` → `<!-- Prospect CRM Tab -->`
- `RequesterDashboard.vue` line 1391: `// Business Development sub-tabs` → `// Prospect CRM sub-tabs`
- `DirectorDashboard.vue` line 1001: `<!-- Business Development Tab -->` → `<!-- Prospect CRM Tab -->`
- `DirectorDashboard.vue` line 1226: `// Business Development sub-tabs` → `// Prospect CRM sub-tabs`
- `PartnerDashboard.vue` line 1358: `<!-- Business Development Tab -->` → `<!-- Prospect CRM Tab -->`
- `PartnerDashboard.vue` line 1584: `// Business Development sub-tabs` → `// Prospect CRM sub-tabs`
- `PartnerDashboard.vue` line 33: `<!-- Divider before Business Development tab -->` → `<!-- Divider before Prospect CRM tab -->`

**DO NOT rename:**
- The `id: 'business-dev'` tab identifier (used in routing/query params — changing this would break bookmarks and router redirects)
- Component file names or folder names (`components/business-dev/BusinessDevProspects.vue` etc.)
- Variable names (`BusinessDevIcon`, `activeBDSubTab`, `bdSubTabs`)
- The router redirect in `router/index.ts` line 189 (`tab: 'business-dev'`)
- Backend references in `init.js` (feature flag comments)

**Verification:** Open any dashboard → the tab should now read "Prospect CRM" instead of "Business Development". All sub-tabs (Prospects, Pipeline & Analytics, AI Insights) should still work.

---

## Execution Order

1. **D6** — Rename "Business Development" → "Prospect CRM" (label-only, 5 min)
2. **D1** — Brand color standardization (find-replace, 10 min)
3. **D2** — Breadcrumbs (DashboardBase + COIRequestDetail, 15 min)
4. **D5** — Print view (COIRequestDetail, 10 min)
5. **D4** — Filter persistence (ProspectManagement, 10 min)
6. **E1** — Prospect pipeline funnel (backend API + frontend chart, 20 min)
7. **E2** — Prospect activity timeline (backend API + frontend panel, 15 min)

**Skip:** D3 (already done), E3 (already done)

---

## Verification

1. **D6 check:** Open RequesterDashboard, DirectorDashboard, PartnerDashboard — tab reads "Prospect CRM" (not "Business Development"). Sub-tabs (Prospects, Pipeline & Analytics, AI Insights) all still functional.
2. **D1 check:** Open any dashboard — primary buttons should be `#0066CC` brand color, not default blue
3. **D2 check:** Navigate to any dashboard — breadcrumb shows "Home > [Role] Dashboard". Open a request detail — shows "Home > [Role] Dashboard > Request COI-2026-001"
4. **D5 check:** Open a request detail → click Print → browser print dialog opens. Preview shows clean layout without buttons/navigation
5. **D4 check:** Go to ProspectManagement → set a filter → refresh page → filter should persist in URL
6. **E1 check:** Open ProspectManagement → see prospect pipeline funnel with stage bars and summary cards at top
7. **E2 check:** Click a prospect row → timeline panel appears below showing stage transitions with timestamps
