# How to Get More Insights - Client Intelligence Module

## ✅ YES, They Are Connected!

The **Client Intelligence module is directly connected** to your COI system data. It analyzes existing COI requests, clients, and engagements to generate insights automatically.

## How They're Connected

### Data Flow:

```
COI System Data
    ↓
[coi_requests table] → Engagement Lifecycle Analysis
[clients table] → Relationship Intelligence  
[service_catalog_global] → Service Gap Analysis
    ↓
Trigger Signal Generation
    ↓
Recommendation Engine
    ↓
Client Intelligence Dashboard
```

### What Gets Analyzed:

1. **COI Requests (`coi_requests` table)**
   - Engagements ending in 30-90 days → **Renewal Opportunities**
   - Service types used per client → **Service Gap Analysis**
   - Engagement status and stages → **Conversion Opportunities**

2. **Clients (`clients` table)**
   - Parent-subsidiary relationships → **Relationship Intelligence**
   - Business cycles (fiscal year-end, quarter-end) → **Timing Opportunities**

3. **Service Catalog (`service_catalog_global` table)**
   - Available services vs. services used → **White-Space Analysis**

## How to Create More Opportunities

### Method 1: Use the Sample Generator Script (Recommended)

```bash
cd coi-prototype/backend
npm run generate-opportunities
```

**What it creates:**
- ✅ **8 renewal opportunities** - Engagements ending in 30-90 days
- ✅ **10 service gap opportunities** - Clients with limited service types
- ✅ **10 clients with business cycle data** - Fiscal year-end and quarter-end dates

### Method 2: Create COI Requests Manually

1. Go to **COI Dashboard** → **"New Request"**
2. Create requests with:
   - **End dates in next 30-90 days** → Creates renewal opportunities
   - **Different service types** → Creates service gap analysis
   - **Status: Active or Approved** → Included in analysis

### Method 3: Update Existing Engagements

Update existing COI requests to have:
- **End dates in next 30-90 days** → Will show as renewal opportunities
- **Different service types** → Will create service gap opportunities

## What Creates Which Insights?

### 1. Renewal Opportunities
**Created by:** Engagements ending soon
- End date: 30-60 days → **High Priority**
- End date: 60-90 days → **Medium Priority**
- Status: Active or Approved
- Stage: Engagement

**Example:**
```sql
UPDATE coi_requests 
SET requested_service_period_end = date('now', '+45 days')
WHERE id = [engagement_id]
```

### 2. Service Gap Opportunities
**Created by:** Clients using limited services
- Client uses 1-2 services → Many gap opportunities
- Service catalog has 10+ services → More gaps identified
- Parent company uses different services → Cross-sell opportunities

**Example:**
Create COI requests with different service types for the same client:
- Client A: Only has "Statutory Audit"
- Gap: Could also use "Tax Services", "Advisory Services", etc.

### 3. Business Cycle Opportunities
**Created by:** Client business cycle data
- Fiscal year-end dates → Year-end service opportunities
- Quarter-end dates → Quarterly service opportunities

**Example:**
```sql
UPDATE clients 
SET fiscal_year_end_date = '2026-12-31',
    quarter_end_dates = '["Q1: 2026-03-31", "Q2: 2026-06-30", "Q3: 2026-09-30", "Q4: 2026-12-31"]',
    business_cycle_type = 'fiscal_year'
WHERE id = [client_id]
```

### 4. Relationship Opportunities
**Created by:** Parent-subsidiary relationships
- Parent company uses services → Subsidiary opportunities
- Sister companies use different services → Cross-sell opportunities

**Example:**
```sql
UPDATE clients 
SET parent_company_id = [parent_client_id]
WHERE id = [subsidiary_client_id]
```

## Quick Start Guide

### Step 1: Generate Sample Opportunities
```bash
cd coi-prototype/backend
npm run generate-opportunities
```

### Step 2: Generate Insights
1. Go to **Client Intelligence Dashboard**
2. Click **"Generate Insights"** button
3. Wait for analysis to complete

### Step 3: View Recommendations
- **Priority Opportunities** panel shows top recommendations
- **All Recommendations** table shows all opportunities
- Click **"Initiate Contact"** to act on opportunities

## Tips for More Insights

1. **Create engagements with end dates** - Closer end dates = higher priority
2. **Use diverse service types** - More service types = more gap opportunities  
3. **Set up business cycles** - Add fiscal year-end dates to clients
4. **Create relationships** - Link parent-subsidiary companies
5. **Keep engagements active** - Only Active/Approved engagements are analyzed

## Understanding the Connection

### Real-Time Analysis
- The system analyzes **existing COI data** - no separate data entry needed
- When you click "Generate Insights", it:
  1. Scans all active clients
  2. Analyzes their COI requests
  3. Identifies patterns and opportunities
  4. Generates recommendations

### Automatic Updates
- New COI requests → Automatically included in next analysis
- Updated end dates → Automatically included in renewal analysis
- New service types → Automatically included in gap analysis

### No Duplicate Data
- **Uses existing COI data** - No need to re-enter client information
- **Analyzes engagement history** - Based on actual COI requests
- **Service catalog integration** - Uses same service catalog as COI system

## Example: Creating a Renewal Opportunity

1. **Find an existing engagement:**
   ```sql
   SELECT id, request_id, client_id, service_type, requested_service_period_end
   FROM coi_requests
   WHERE status = 'Active'
   LIMIT 1
   ```

2. **Update end date to be soon:**
   ```sql
   UPDATE coi_requests
   SET requested_service_period_end = date('now', '+45 days')
   WHERE id = [engagement_id]
   ```

3. **Generate insights:**
   - Go to Client Intelligence dashboard
   - Click "Generate Insights"
   - See renewal opportunity appear!

## Summary

✅ **They ARE connected** - Client Intelligence analyzes COI system data  
✅ **No separate data entry** - Uses existing clients, engagements, services  
✅ **Automatic analysis** - Click "Generate Insights" to analyze all data  
✅ **Real-time updates** - New COI requests automatically included  
✅ **Easy to create opportunities** - Use the script or update existing engagements

The more COI data you have (clients, engagements, service types), the more insights you'll get!
