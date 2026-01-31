# Complete CRM Features Added to COI System

**Date:** January 20, 2026  
**Version:** Phase 3 Complete

---

## Overview

The COI System has been enhanced with comprehensive CRM (Customer Relationship Management) capabilities to track prospects from initial lead through client conversion. This document lists all CRM features, their locations, and which user groups can access them.

---

## 1. PROSPECT MANAGEMENT MODULE

| Feature | Location/Menu | User Groups | Description |
|---------|--------------|-------------|-------------|
| **Prospect Management Page** | `/coi/prospects` (Sidebar: "Prospect Management") | Admin, Super Admin, Director, Requester, Partner | Full CRUD for prospects with filtering |
| **Create Prospect** | Prospect Management → "Add Prospect" button | Admin, Super Admin, Director, Requester, Partner | Create new prospects with lead source |
| **Convert Prospect to Client** | Prospect row → "Convert" action | Admin, Super Admin, Director, Requester, Partner | Convert active prospect to client |
| **Link to Existing Client** | Prospect form → "Linked Client" field | Admin, Super Admin, Director, Requester, Partner | Link prospect to parent PRMS client |
| **Group Level Services** | Prospect detail | Admin, Super Admin, Director, Requester, Partner | Track services for prospect groups |
| **Filter by Status** | Prospect Management filters | Admin, Super Admin, Director, Requester, Partner | Active, Converted, Inactive |
| **Filter by PRMS Sync** | Prospect Management filters | Admin, Super Admin, Director, Requester, Partner | Synced / Not Synced |

---

## 2. LEAD SOURCE ATTRIBUTION

### Lead Source Dropdown Locations

| Feature | Location/Menu | User Groups | Description |
|---------|--------------|-------------|-------------|
| **Lead Source (Proposals)** | COI Request Form → "Lead Source" field | Requester, Director | Select lead source when creating proposals |
| **Lead Source (Prospects)** | Prospect Management → Create modal | Admin, Super Admin, Compliance, Partner | Auto-detected or manually selected |

### Available Lead Sources

| Lead Source | Code | Category |
|-------------|------|----------|
| Internal Referral (Partner/Director) | `internal_referral` | Referral |
| Client Referral | `client_referral` | Referral |
| Client Intelligence Module | `insights_module` | System |
| Cold Outreach | `cold_outreach` | Outbound |
| Marketing Campaign | `marketing` | Outbound |
| Event / Conference | `event` | Outbound |
| Direct Client Creation | `direct_creation` | Other |
| Unknown / Legacy | `unknown` | Other |

### Auto-Detection Logic

Lead source is automatically detected based on context:
1. If `source_opportunity_id` provided → `insights_module`
2. If `referred_by_client_id` provided → `client_referral`
3. If creator is Partner/Director → `internal_referral`
4. If explicitly provided → use provided value
5. Default → `unknown`

---

## 3. FUNNEL TRACKING

### Funnel Stages

```
Lead Created → Proposal Submitted → Pending Director → Pending Compliance 
    → Pending Partner → Pending Finance → Approved → Client Created
                            ↓
                          Lost
```

### Automatic Logging Points

| Stage | Trigger | Description |
|-------|---------|-------------|
| `lead_created` | Prospect record created | Initial prospect creation |
| `proposal_submitted` | COI request submitted with `is_prospect=1` | Proposal submission |
| `pending_director` | Status change | Awaiting director approval |
| `pending_compliance` | Status change | Awaiting compliance review |
| `pending_partner` | Status change | Awaiting partner approval |
| `pending_finance` | Status change | Awaiting finance approval |
| `approved` | Request approved | Proposal approved |
| `client_created` | PRMS client created | Full conversion complete |
| `lost` | Request rejected | Prospect lost |

### Logged Data Per Event

- Prospect ID / COI Request ID
- From Stage / To Stage
- User who performed action
- User role
- Days in previous stage
- Notes and metadata
- Timestamp

---

## 4. CRM DASHBOARD CARDS

**Component:** `CRMInsightsCards.vue`

| Card | Available On | Description |
|------|--------------|-------------|
| **Lead Source Distribution** | Requester, Director, Partner, Admin Dashboards | Mini bar chart showing prospects by source with best conversion rate |
| **Funnel Performance** | Requester, Director, Partner, Admin Dashboards | Overall conversion rate with funnel visualization |
| **AI Insights Effectiveness** | Requester, Director, Partner, Admin Dashboards | Prospects generated from Client Intelligence module |
| **Top Performers** | Requester, Director, Partner, Admin Dashboards | Leaderboard of users ranked by conversions |

### Card Interactions

Clicking any card navigates to the corresponding detailed report.

---

## 5. CRM REPORTS - PHASE 2

### Report Access by Role

| Report | Admin | Super Admin | Compliance | Partner |
|--------|:-----:|:-----------:|:----------:|:-------:|
| Lead Source Effectiveness | ✅ | ✅ | ✅ | ✅ |
| Funnel Performance | ✅ | ✅ | ✅ | ✅ |
| Insights-to-Conversion | ✅ | ✅ | ✅ | ✅ |
| Attribution by User | ✅ | ✅ | ✅ | ✅ |
| Prospect Conversion | ✅ | ✅ | ❌ | ❌ |

### Report Details

#### 5.1 Lead Source Effectiveness Report
- **API:** `POST /api/reports/{role}/lead-source-effectiveness`
- **Data Points:**
  - Total prospects by source
  - Conversion rate by source
  - Average days to convert
  - Best performing source
- **Chart:** Bar chart by lead source

#### 5.2 Funnel Performance Report
- **API:** `POST /api/reports/{role}/funnel-performance`
- **Data Points:**
  - Count at each stage
  - Drop-off percentage between stages
  - Average time in each stage
  - Bottleneck identification
- **Chart:** Horizontal funnel bar chart

#### 5.3 Insights-to-Conversion Report
- **API:** `POST /api/reports/{role}/insights-to-conversion`
- **Data Points:**
  - Opportunities generated by insights
  - Opportunities acted upon
  - Prospects created from insights
  - Insights conversion rate
- **Key Metric:** `Insights Conversion Rate = (Converted from Insights / Total) × 100`

#### 5.4 Attribution by User Report
- **API:** `POST /api/reports/{role}/attribution-by-user`
- **Grouping Options:** By user, by role, by department
- **Data Points:**
  - Conversions attributed to each user
  - Average conversion time
  - Workload distribution
  - Success rate

#### 5.5 Prospect Conversion Report
- **API:** `POST /api/reports/admin/prospect-conversion`
- **Data Points:**
  - Total prospects
  - Converted / Active / Pending / Lost counts
  - Conversion ratio
  - Linked to PRMS count
  - Breakdown by lead source

---

## 6. CRM REPORTS - PHASE 3

### New Reports

| Report | API Endpoint | Description |
|--------|--------------|-------------|
| **Pipeline Forecast** | `POST /api/reports/{role}/pipeline-forecast` | Expected conversions based on current pipeline |
| **Conversion Trends** | `POST /api/reports/{role}/conversion-trends` | Monthly trends over 12 months |
| **Period Comparison** | `POST /api/reports/{role}/period-comparison` | Month-over-month or quarter-over-quarter |
| **Lost Prospect Analysis** | `POST /api/reports/{role}/lost-prospect-analysis` | Analysis of lost prospects |

### Report Details

#### 6.1 Pipeline Forecast Report
- **Data Points:**
  - Prospects by stage with counts
  - Conversion probability per stage (historical or default)
  - Expected conversions (weighted)
  - Recently lost (30 days)
- **Chart:** Bar chart by stage with expected overlay
- **Note:** No confidence intervals - simplified approach

#### 6.2 Conversion Trends Report
- **Data Points:**
  - Monthly conversion counts
  - Conversion rate trends
  - Lead source performance over time
  - Overall trend direction (improving/stable/declining)
- **Chart:** Line chart over time
- **Note:** More meaningful after 6+ months of data

#### 6.3 Period Comparison Report
- **Comparison Types:** Month-over-Month, Quarter-over-Quarter
- **Data Points:**
  - Current vs previous period metrics
  - Delta and percentage change
  - Trend direction
  - Lead source comparison
- **Chart:** Side-by-side bar comparison

#### 6.4 Lost Prospect Analysis Report
- **Data Points:**
  - Total lost count
  - Lost by reason (pie chart)
  - Lost by stage (bar chart)
  - Lost by lead source with loss rate
  - Recent lost prospects list
- **Charts:** Pie chart (reasons), Bar chart (stages)

---

## 7. STALE DETECTION & LOST TRACKING

### Stale Thresholds

| Threshold | Days | Action |
|-----------|------|--------|
| Needs Follow-up | 14 days inactive | Flagged for attention |
| Stale Prospect | 30 days inactive | Marked as stale |
| Stale Proposal | 30 days pending | Proposal flagged |

### API Endpoints

| Endpoint | Method | User Groups | Description |
|----------|--------|-------------|-------------|
| `/api/prospects/stale/summary` | GET | All authenticated | Get stale detection summary |
| `/api/prospects/stale/needs-followup` | GET | All authenticated | List prospects needing follow-up |
| `/api/prospects/stale/run-detection` | POST | Admin, Compliance | Manually run stale detection |
| `/api/prospects/lost/analysis` | GET | All authenticated | Get lost prospects analysis |
| `/api/prospects/lost/reasons` | GET | All authenticated | Get valid lost reason codes |
| `/api/prospects/:id/mark-lost` | POST | All authenticated | Mark prospect as lost |
| `/api/prospects/:id/activity` | POST | All authenticated | Update activity (reset stale timer) |

### Lost Reason Codes

| Code | Display Name |
|------|--------------|
| `stale_no_activity` | Stale / No Activity |
| `rejected_by_compliance` | Rejected by Compliance |
| `rejected_by_director` | Rejected by Director |
| `rejected_by_partner` | Rejected by Partner |
| `client_declined` | Client Declined |
| `competitor_won` | Competitor Won |
| `budget_constraints` | Budget Constraints |
| `timing_not_right` | Timing Not Right |
| `no_response` | No Response |
| `other` | Other |

---

## 8. CLIENT INTELLIGENCE INTEGRATION

### Create Prospect from Opportunity

- **API:** `POST /api/prospects/from-opportunity/:opportunity_id`
- **User Groups:** Partner, Director, Admin, Super Admin
- **Behavior:**
  - Creates prospect from Client Intelligence opportunity
  - Auto-sets lead source to `insights_module`
  - Links `source_opportunity_id` for attribution
  - Updates opportunity status to `prospect_created`
  - Logs funnel event `lead_created`

### Tracking Chain

```
Client Intelligence Opportunity
        ↓
    Prospect Created (source_opportunity_id linked)
        ↓
    Proposal Submitted
        ↓
    Approval Workflow
        ↓
    Client Created
```

---

## 9. DATABASE SCHEMA

### New Tables

#### `lead_sources`
```sql
CREATE TABLE lead_sources (
    id INTEGER PRIMARY KEY,
    source_code VARCHAR(50) UNIQUE NOT NULL,
    source_name VARCHAR(100) NOT NULL,
    source_category VARCHAR(50),  -- 'referral', 'system', 'outbound', 'other'
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `prospect_funnel_events`
```sql
CREATE TABLE prospect_funnel_events (
    id INTEGER PRIMARY KEY,
    prospect_id INTEGER,
    coi_request_id INTEGER,
    from_stage VARCHAR(50),
    to_stage VARCHAR(50) NOT NULL,
    performed_by_user_id INTEGER,
    performed_by_role VARCHAR(50),
    event_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    days_in_previous_stage INTEGER,
    notes TEXT,
    metadata TEXT,  -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Columns Added to `prospects`

| Column | Type | Description |
|--------|------|-------------|
| `lead_source_id` | INTEGER FK | Reference to lead_sources |
| `referred_by_user_id` | INTEGER FK | User who made the referral |
| `referred_by_client_id` | INTEGER FK | Client who referred |
| `source_opportunity_id` | INTEGER | Client Intelligence opportunity link |
| `source_notes` | TEXT | Attribution notes |
| `lost_reason` | TEXT | Why prospect was lost |
| `lost_at_stage` | VARCHAR(50) | Stage when lost |
| `lost_date` | DATETIME | When marked as lost |
| `stale_detected_at` | DATETIME | When flagged as stale |
| `stale_notification_sent_at` | DATETIME | Notification tracking |
| `last_activity_at` | DATETIME | Last activity timestamp |

### Columns Added to `coi_requests`

| Column | Type | Description |
|--------|------|-------------|
| `lead_source_id` | INTEGER FK | Lead source for proposals |
| `lost_reason` | TEXT | Why request was lost |
| `lost_at_stage` | VARCHAR(50) | Stage when lost |
| `lost_date` | DATETIME | When marked lost |
| `stale_detected_at` | DATETIME | When flagged stale |
| `last_activity_at` | DATETIME | Last activity timestamp |

---

## 10. NAVIGATION & MENU ACCESS

### Sidebar Menu Items

| Menu Item | Route | User Groups |
|-----------|-------|-------------|
| Prospect Management | `/coi/prospects` | Admin, Super Admin, Director, Requester, Partner |
| Reports & Analytics | `/coi/reports` | All roles (filtered by permissions) |
| Client Intelligence | `/coi/client-intelligence` | Requester, Director, Partner, Admin, Super Admin |

### Role-Based Report Access Matrix

**Note:** CRM features are available to sales cycle participants (Requester, Director, Partner) rather than Compliance, as they are involved in prospect management and conversions.

| Role | Standard Reports | CRM Reports (Phase 2) | CRM Reports (Phase 3) |
|------|------------------|----------------------|----------------------|
| Requester | My Requests Summary | ✅ All 4 | ✅ All 4 |
| Director | Department Overview | ✅ All 4 | ✅ All 4 |
| Compliance | Review Summary | ❌ | ❌ |
| Partner | Pending Approvals | ✅ All 4 | ✅ All 4 |
| Finance | Engagement Codes | ❌ | ❌ |
| Admin | System Overview, Prospect Conversion | ✅ All 4 | ✅ All 4 |
| Super Admin | All Reports | ✅ All 4 | ✅ All 4 |

---

## 11. BACKEND SERVICES

### Service Files

| Service | File | Purpose |
|---------|------|---------|
| Funnel Tracking | `funnelTrackingService.js` | Log and query funnel events |
| Stale Detection | `staleProspectService.js` | Detect stale prospects, mark lost |
| Report Data | `reportDataService.js` | Generate all report data |
| Prospect Controller | `prospectController.js` | Prospect CRUD with lead source |

### Key Functions

#### funnelTrackingService.js
- `logFunnelEvent()` - Log a funnel stage transition
- `logStatusChange()` - Log COI status change as funnel event
- `getFunnelEvents()` - Get events for a prospect
- `getConversionFunnelMetrics()` - Calculate funnel metrics
- `getLeadSourceIdOrDefault()` - Get lead source with fallback

#### staleProspectService.js
- `detectStaleProspects()` - Find prospects inactive 30+ days
- `detectProspectsNeedingFollowup()` - Find prospects inactive 14-30 days
- `detectStaleProposals()` - Find stale proposals
- `markProspectAsLost()` - Mark prospect as lost with reason
- `runStaleDetectionJob()` - Run full stale detection
- `getLostProspectsAnalysis()` - Analyze lost prospects

---

## 12. IMPLEMENTATION PHASES

### Phase 1 (Complete)
- [x] Lead sources table and seed data
- [x] Prospect funnel events table
- [x] Lead source columns on prospects/coi_requests
- [x] Funnel tracking service
- [x] 3 critical funnel hooks (proposal_submitted, approved, client_created)
- [x] Prospect Conversion Report bug fix

### Phase 2 (Complete)
- [x] Lead source dropdown in COI Request Form
- [x] Lead source dropdown in Prospect Management
- [x] Remaining funnel hooks (7 status change points)
- [x] Lead Source Effectiveness Report
- [x] Funnel Performance Report
- [x] Insights-to-Conversion Report
- [x] Attribution by User Report
- [x] CRM Dashboard Cards component
- [x] Role-based report filtering

### Phase 3 (Complete)
- [x] Create prospect from opportunity API
- [x] Lost reason and lost_at_stage fields
- [x] Stale detection service and API
- [x] Pipeline Forecast Report
- [x] Conversion Trends Report
- [x] Period Comparison Report
- [x] Lost Prospect Analysis Report

---

## 13. API QUICK REFERENCE

### Prospect APIs
```
GET    /api/prospects                         - List all prospects
GET    /api/prospects/:id                     - Get single prospect
POST   /api/prospects                         - Create prospect
PUT    /api/prospects/:id                     - Update prospect
POST   /api/prospects/:id/convert-to-client   - Convert to client
GET    /api/prospects/lead-sources            - Get lead sources
POST   /api/prospects/from-opportunity/:id    - Create from CI opportunity
```

### Stale Detection APIs
```
GET    /api/prospects/stale/summary           - Stale detection summary
GET    /api/prospects/stale/needs-followup    - Prospects needing followup
POST   /api/prospects/stale/run-detection     - Run stale detection job
GET    /api/prospects/lost/analysis           - Lost prospects analysis
GET    /api/prospects/lost/reasons            - Lost reason codes
POST   /api/prospects/:id/mark-lost           - Mark prospect as lost
POST   /api/prospects/:id/activity            - Update activity timestamp
```

### CRM Report APIs
```
POST   /api/reports/{role}/lead-source-effectiveness
POST   /api/reports/{role}/funnel-performance
POST   /api/reports/{role}/insights-to-conversion
POST   /api/reports/{role}/attribution-by-user
POST   /api/reports/{role}/pipeline-forecast
POST   /api/reports/{role}/conversion-trends
POST   /api/reports/{role}/period-comparison
POST   /api/reports/{role}/lost-prospect-analysis
```

Where `{role}` is one of: `compliance`, `partner`, `admin`

---

*Document generated: January 20, 2026*
