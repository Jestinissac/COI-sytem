# Add Clickable Charts to Landing Page

## Problem
Charts were removed from Reports view (correctly), but they should be available on the Landing Page as actionable visualizations. Users should be able to click on chart segments/bars to navigate to filtered reports.

## Solution
Add interactive, clickable charts to the Landing Page that:
1. Display COI system summary data (byStatus, byServiceType, byClient)
2. Are clickable - clicking navigates to Reports with appropriate filters
3. Only show when COI system is available to the user
4. Are role-aware (show data relevant to user's role)

## Changes Required

### 1. Update LandingPage.vue
- **File:** `coi-prototype/frontend/src/views/LandingPage.vue`
- **Action:** 
  - Add a new section after system tiles that displays charts (only if COI is available)
  - Import ReportCharts component
  - Add state management for loading summary data
  - Fetch summary data based on user role
  - Handle chart click events to navigate to reports

### 2. Enhance ReportCharts Component
- **File:** `coi-prototype/frontend/src/components/reports/ReportCharts.vue`
- **Action:**
  - Add `@click` event handlers to chart elements
  - Add `onClick` prop/emit to handle chart segment clicks
  - Make charts interactive with hover states indicating clickability
  - Add cursor pointer styling

### 3. Create Landing Page Summary Service
- **File:** `coi-prototype/frontend/src/services/landingPageService.ts` (new file)
- **Action:**
  - Create function to fetch summary data based on user role
  - Map user role to appropriate report type:
    - Requester → 'my-requests-summary'
    - Director → 'department-overview'
    - Compliance → 'review-summary'
    - Partner → 'pending-approvals'
    - Admin/Super Admin → 'system-overview'
  - Return summary data in format expected by ReportCharts

### 4. Add Navigation Logic
- **File:** `coi-prototype/frontend/src/views/LandingPage.vue`
- **Action:**
  - Handle chart clicks to navigate to `/coi/reports` with filters:
    - Status chart click → filter by status
    - Service type chart click → filter by serviceType
    - Client chart click → filter by clientId
  - Use router with query params to pass filters

## Implementation Details

### Chart Click Behavior
- **Pie Chart (Status):** Clicking a segment navigates to Reports with `status` filter
- **Bar Chart (Service Type):** Clicking a bar navigates to Reports with `serviceType` filter
- **Bar Chart (Client):** Clicking a bar navigates to Reports with `clientId` filter

### Data Fetching
- Fetch summary data on component mount (only if COI system is available)
- Show loading state while fetching
- Handle errors gracefully
- Cache data to avoid repeated API calls

### UI/UX Considerations
- Charts should be visually distinct from system tiles
- Add section header: "COI System Overview" or "Quick Insights"
- Make it clear charts are clickable (hover effects, cursor changes)
- Responsive design for mobile/tablet
- Show empty state if no data available

## Files to Modify

1. `coi-prototype/frontend/src/views/LandingPage.vue` - Add charts section
2. `coi-prototype/frontend/src/components/reports/ReportCharts.vue` - Add click handlers
3. `coi-prototype/frontend/src/services/landingPageService.ts` - New service for fetching summary data

## Verification

After implementation:
1. Landing page shows charts when COI system is available
2. Charts display correct data based on user role
3. Clicking chart segments navigates to Reports with correct filters
4. Charts are responsive and accessible
5. Loading and error states work correctly
