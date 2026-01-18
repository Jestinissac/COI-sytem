# Client Intelligence Module

## Connection to COI System

**YES, they are fully connected!** The Client Intelligence module analyzes existing COI data to generate insights:

### Data Sources (from COI System):

1. **`coi_requests` table** - Analyzes:
   - Engagements ending soon (30-90 days) → **Renewal Opportunities**
   - Service types used by clients → **Service Gap Analysis**
   - Engagement lifecycle stages → **Conversion Opportunities**

2. **`clients` table** - Analyzes:
   - Client relationships (parent/subsidiary) → **Relationship Intelligence**
   - Business cycles (fiscal year-end, quarter-end) → **Timing Opportunities**

3. **`service_catalog_global` table** - Analyzes:
   - Available services vs. services used → **White-Space Analysis**

### How It Works:

1. **Create COI Requests** in the COI system (via "New Request" or API)
2. **Set End Dates** on engagements (creates renewal opportunities)
3. **Use Different Service Types** (creates service gap opportunities)
4. **Click "Generate Insights"** in Client Intelligence dashboard
5. **System analyzes** all COI data and generates recommendations

## Creating More Opportunities

### Option 1: Use the Sample Generator Script

```bash
cd coi-prototype/backend
npm run generate-opportunities
```

This creates:
- **Renewal Opportunities**: Engagements ending in 30-90 days
- **Service Gap Opportunities**: Clients with limited service types
- **Business Cycle Data**: Fiscal year-end and quarter-end dates

### Option 2: Create COI Requests Manually

1. Go to COI Dashboard → "New Request"
2. Create requests with:
   - **End dates in next 30-90 days** → Creates renewal opportunities
   - **Different service types** → Creates service gap analysis
   - **Active/Approved status** → Included in analysis

### Option 3: Use API to Create Requests

```javascript
POST /api/coi/requests
{
  "client_id": 1,
  "service_type": "Tax Services",
  "service_description": "Annual tax compliance",
  "requested_service_period_start": "2025-01-01",
  "requested_service_period_end": "2026-01-15", // Ending soon = renewal opportunity
  "status": "Active",
  "stage": "Engagement"
}
```

## What Creates Insights?

### 1. Engagement Lifecycle Triggers
- **Engagements ending in 30-90 days** → High priority renewal opportunities
- **Engagements ending in 60-90 days** → Medium priority renewal opportunities
- **Recent proposals** → Conversion opportunities

### 2. Service Gap Triggers
- **Clients using 1-2 services** → Opportunities for additional services
- **Service catalog has 10+ services** → Many gap opportunities
- **Parent company uses different services** → Cross-sell opportunities

### 3. Business Cycle Triggers
- **Fiscal year-end approaching** → Year-end service opportunities
- **Quarter-end approaching** → Quarterly service opportunities
- **Tax deadlines** → Tax service opportunities

### 4. Relationship Triggers
- **Parent company uses services client doesn't** → Relationship-based opportunities
- **Sister companies use different services** → Cross-sell opportunities

## Quick Start: Generate Sample Data

```bash
# From coi-prototype/backend directory
npm run generate-opportunities
```

Then:
1. Go to Client Intelligence dashboard
2. Click "Generate Insights"
3. View recommendations

## Data Flow

```
COI System Data
    ↓
[coi_requests] → Engagement Lifecycle Analysis
[clients] → Relationship Intelligence
[service_catalog_global] → Service Gap Analysis
    ↓
Trigger Signal Generation
    ↓
Recommendation Engine
    ↓
Client Intelligence Dashboard
```

## Best Practices for More Insights

1. **Create engagements with end dates** - The closer the end date, the higher the priority
2. **Use diverse service types** - More service types = more gap opportunities
3. **Set up business cycles** - Add fiscal year-end dates to clients
4. **Create parent-subsidiary relationships** - Enables relationship intelligence
5. **Keep engagements active** - Only Active/Approved engagements are analyzed
