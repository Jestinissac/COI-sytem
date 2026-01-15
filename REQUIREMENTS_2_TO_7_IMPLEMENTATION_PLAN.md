# Requirements 2-7 Implementation Plan

**Created:** 2026-01-13  
**Status:** Ready for Implementation

---

## Overview

This plan addresses the remaining 6 requirements from the meeting:
1. **Requirement 2**: Service Type full list with sub-categories
2. **Requirement 3**: Prospect vs Client management (complete the implementation)
3. **Requirement 4**: Additional rejection options for Compliance only
4. **Requirement 5**: State management (HRMS integration research)
5. **Requirement 6**: Event-driven architecture (email alerts)
6. **Requirement 7**: Service visibility for Compliance team

---

## REQUIREMENT 2: Service Type Full List with Sub-Categories

### Current State
- Basic service types exist in the system
- Need to expand to full BDO service catalog
- Need to add sub-categories for "Business/Asset Valuation"

### Implementation Tasks

#### 2.1 Database Schema Updates
- Create `service_categories` table with fields:
  - `id` (primary key)
  - `name` (text, unique)
  - `parent_id` (nullable, self-referencing for sub-categories)
  - `description` (text, nullable)
  - `active` (boolean, default true)
  - `sort_order` (integer)
  - `created_at`, `updated_at`

- Create `service_types` table with fields:
  - `id` (primary key)
  - `name` (text, unique)
  - `category_id` (foreign key to service_categories)
  - `description` (text, nullable)
  - `active` (boolean, default true)
  - `sort_order` (integer)
  - `created_at`, `updated_at`

#### 2.2 Seed Data: Full Service List
Based on BDO service offerings and COI Template analysis:

**Assurance Services**
- Statutory Audit
- Internal Audit
- Review Engagements
- Agreed-Upon Procedures
- IFRS Advisory
- Due Diligence

**Tax Services**
- Corporate Tax Advisory
- Tax Compliance
- VAT Advisory
- Zakat Advisory
- Transfer Pricing
- Tax Planning

**Advisory Services**
- Business Consulting
- Risk Management
- Corporate Finance
- Transaction Advisory
- IT Advisory
- Forensic Services

**Business/Asset Valuation** (with sub-categories)
- Acquisition
- Capital Increase
- Financial Facilities
- Merger & Acquisition Valuation
- Fair Value Assessment
- Intangible Asset Valuation

**Outsourcing Services**
- Accounting Services
- Payroll Services
- CFO Services
- Bookkeeping
- Financial Reporting

**Other Services**
- Training & Development
- Secretarial Services
- Liquidation Services

#### 2.3 Backend API Updates
- `GET /api/service-categories` - Get all categories with hierarchical structure
- `GET /api/service-types` - Get all service types (with optional category filter)
- `GET /api/service-types/:categoryId` - Get service types by category
- `POST /api/service-categories` - Create new category (Admin/Super Admin only)
- `POST /api/service-types` - Create new service type (Admin/Super Admin only)
- `PUT /api/service-categories/:id` - Update category
- `PUT /api/service-types/:id` - Update service type
- `DELETE /api/service-categories/:id` - Soft delete (set active=false)
- `DELETE /api/service-types/:id` - Soft delete

#### 2.4 Update COI Request Schema
- Change `service_type` from text to `service_type_id` (foreign key to service_types)
- Add `service_subcategory_id` (nullable, foreign key to service_types for sub-categories)
- Create migration script to map existing text values to new IDs

#### 2.5 Frontend UI Updates
- Update service type selection in COI form to use cascading dropdowns:
  - First dropdown: Category selection
  - Second dropdown: Service type (filtered by category)
  - Third dropdown: Sub-category (conditionally shown for services like "Business/Asset Valuation")
- Update all views that display service types to show category > service > subcategory hierarchy
- Add service type management UI for Admin/Super Admin (similar to keywords page)

---

## REQUIREMENT 3: Prospect vs Client Management (Complete Implementation)

### Current State
- Basic prospect flow exists in proposal-to-engagement conversion
- Need to complete: prospect tagging, PRMS client checking, group-level services, filtering

### Implementation Tasks

#### 3.1 Database Schema Updates
- Add `is_prospect` boolean field to `coi_requests` table (default false)
- Add `prms_client_id` field to `coi_requests` table (nullable, stores PRMS client ID if linked)
- Add `prospect_parent_client_id` field (nullable, for linking prospect to existing PRMS client)
- Add `converted_to_client_at` timestamp field (nullable)

#### 3.2 PRMS Client Check Logic
- Create `/api/prms/check-client` endpoint that:
  - Accepts client name, email, phone, tax_id
  - Performs fuzzy matching against PRMS client database
  - Returns match confidence and client details
  - Suggests if client exists or is truly new prospect

#### 3.3 Prospect Tagging Logic
- During COI request creation:
  - If `engagement_type` = "Proposal", automatically tag as prospect (`is_prospect = true`)
  - Run PRMS client check
  - If match found (>80% confidence), link to existing client (`prms_client_id`, `prospect_parent_client_id`)
  - If no match, create as standalone prospect

#### 3.4 Group-Level Services Tracking
- Create `client_services_history` table:
  - `id` (primary key)
  - `client_id` (reference to PRMS or prospect)
  - `coi_request_id` (foreign key)
  - `service_type_id` (foreign key)
  - `service_date` (date)
  - `engagement_status` (proposal/active/completed)
  - `created_at`, `updated_at`

- When a COI request is created for an existing client, log the service
- When a prospect converts to client, migrate all historical services

#### 3.5 Prospect Conversion Flow
- When proposal is converted to engagement:
  - If `is_prospect = true` and no `prms_client_id`:
    - Trigger client creation request (already implemented)
  - Once PRMS Admin completes client creation:
    - Set `prms_client_id`
    - Set `converted_to_client_at = CURRENT_TIMESTAMP`
    - Set `is_prospect = false`
    - Migrate all services to `client_services_history`

#### 3.6 Filtering & Search
- Add filters to COI requests list:
  - "Prospects Only" checkbox
  - "Existing Clients Only" checkbox
  - "Converted Prospects" checkbox
- Add prospect status badge in request cards/tables
- Update dashboard to show:
  - Total Prospects
  - Prospects Converted to Clients (this month/quarter/year)
  - Conversion Rate

---

## REQUIREMENT 4: Additional Rejection Options for Compliance Only

### Current State
- All approval levels have same options: Approve, Reject, Approve with Restrictions, Need More Info
- Need to restrict "Approve with Restrictions" and "Need More Info" to Compliance/Partner levels only

### Implementation Tasks

#### 4.1 Backend Validation
- Update approval endpoint validation:
  - Check user role
  - If role = "Director": only allow `approved` or `rejected` actions
  - If role = "Compliance" or "Partner": allow all actions including `approved_with_restrictions`, `need_more_info`

#### 4.2 Frontend UI Updates
- Update `ApprovalActions.vue` component:
  - Accept user role as prop
  - Conditionally render action buttons based on role:
    - Director: Show only "Approve" and "Reject" buttons
    - Compliance/Partner: Show all buttons including "Approve with Restrictions" and "Need More Info"

#### 4.3 Update Approval Flow UI
- In request detail view, show available actions based on current approver's role
- Add tooltip/help text: "Additional options available for Compliance and Partner levels"

---

## REQUIREMENT 5: State Management - HRMS Integration Research

### Research Questions
1. How to detect when an approver is on vacation/leave?
2. How to notify the requester of approver unavailability?
3. Should the approval automatically escalate or wait?
4. How to integrate with HRMS employee status data?

### Implementation Tasks

#### 5.1 HRMS Integration Research Document
- Create research document covering:
  - HRMS API endpoints for employee status
  - Leave/vacation data structure
  - Real-time vs batch sync approaches
  - Alternative solutions if HRMS API not available

#### 5.2 Approver Status Tracking
- Add `employee_status` table:
  - `user_id` (foreign key to users)
  - `status` (active/on_leave/vacation/sick_leave)
  - `unavailable_from` (date)
  - `unavailable_until` (date)
  - `delegate_user_id` (nullable, who handles approvals during absence)
  - `auto_delegate` (boolean, whether to auto-assign to delegate)
  - `last_synced_at` (timestamp)

#### 5.3 Approval Assignment Logic
- When COI request reaches approval stage:
  - Check if assigned approver is unavailable
  - If unavailable and `auto_delegate = true`, assign to delegate
  - If unavailable and no delegate, notify requester with expected return date
  - Send email to requester: "Your request is pending approval from [Name] who is currently unavailable until [Date]"

#### 5.4 Admin UI for Approver Status
- Create "Approver Availability" management page (Super Admin/Admin only):
  - List all approvers with current status
  - Manually set status (for prototype; can be HRMS-synced in production)
  - Assign delegates
  - View approval queue for each approver

#### 5.5 Notification System
- Add notification when requester views request:
  - "Pending approval from [Name] (Currently unavailable until [Date])"
  - Show delegate if assigned
  - Show expected approval timeline

---

## REQUIREMENT 6: Event-Driven Architecture (Email Alerts)

### Research Questions
1. Is event-driven architecture suitable for managing email alerts?
2. How to reduce "noise" and ensure right alert to right person at right time?
3. What are the implementation options (simple vs complex)?
4. What are alternatives if event-driven is too complex for prototype?

### Implementation Tasks

#### 6.1 Research Document: Event-Driven Architecture
- Create comprehensive research document covering:
  - What is event-driven architecture?
  - Benefits for COI system email alerts
  - Implementation complexity
  - Prototype vs Production approaches
  - Alternative solutions

#### 6.2 Event Catalog Definition
Define all events that should trigger notifications:

**COI Request Events:**
- `coi.request.created` - New COI request submitted
- `coi.request.approved` - Request approved at any level
- `coi.request.rejected` - Request rejected
- `coi.request.approved_with_restrictions` - Approved with restrictions
- `coi.request.need_more_info` - More information requested
- `coi.request.resubmitted` - Request resubmitted after revision
- `coi.request.converted_to_engagement` - Proposal converted to engagement
- `coi.request.nearing_deadline` - Request approaching review deadline

**Approval Events:**
- `approval.assigned` - Approval assigned to approver
- `approval.reminded` - Reminder sent to approver
- `approval.overdue` - Approval overdue
- `approval.escalated` - Approval escalated to next level

**Client/Prospect Events:**
- `client.creation_requested` - New client creation request submitted
- `client.creation_completed` - Client creation completed by PRMS Admin
- `prospect.converted` - Prospect converted to client

**System Events:**
- `conflict.detected` - Potential conflict detected
- `independence.threat` - Independence threat identified
- `document.uploaded` - Supporting document uploaded
- `comment.added` - New comment added to request

#### 6.3 Notification Rules Engine
- Create `notification_rules` table:
  - `id` (primary key)
  - `event_type` (e.g., "coi.request.created")
  - `recipient_role` (e.g., "Compliance", "Partner", "Requester")
  - `recipient_user_id` (nullable, for specific user notifications)
  - `notification_channel` (email/in-app/both)
  - `template_id` (reference to email template)
  - `conditions` (JSON, e.g., only if service_type = "Audit")
  - `priority` (low/medium/high)
  - `active` (boolean)
  - `created_at`, `updated_at`

#### 6.4 Email Template System
- Create `email_templates` table:
  - `id` (primary key)
  - `name` (text, unique)
  - `subject` (text, supports variables)
  - `body_html` (text, supports variables)
  - `body_text` (text, plain text fallback)
  - `variables` (JSON, list of available variables)
  - `active` (boolean)
  - `created_at`, `updated_at`

- Seed templates for all event types

#### 6.5 Event Bus Implementation (Simplified for Prototype)
- Create `eventBus.js` utility:
  - `emit(eventType, payload)` - Emit event
  - `subscribe(eventType, handler)` - Subscribe to events
  - `unsubscribe(eventType, handler)` - Unsubscribe

- Create `notificationService.js`:
  - Listen to all events
  - Query `notification_rules` for matching rules
  - Apply conditions
  - Generate and send notifications
  - Log notification history

#### 6.6 Notification Queue (Optional for Prototype)
- Create `notification_queue` table:
  - `id` (primary key)
  - `event_type` (text)
  - `recipient_email` (text)
  - `subject` (text)
  - `body_html` (text)
  - `priority` (low/medium/high)
  - `status` (pending/sent/failed)
  - `scheduled_for` (timestamp, for delayed notifications)
  - `sent_at` (timestamp, nullable)
  - `error_message` (text, nullable)
  - `created_at`

- Create background job to process queue (simple interval for prototype)

#### 6.7 Smart Notification Filtering (Reduce Noise)
- Implement digest/batching:
  - Group similar notifications within time window (e.g., 1 hour)
  - Send single email with multiple updates instead of multiple emails
- User preferences:
  - Allow users to configure notification preferences
  - Frequency: Real-time, Daily Digest, Weekly Summary
  - Event type selection: Which events to receive

#### 6.8 Admin UI: Notification Management
- Create "Notification Settings" page:
  - View all notification rules
  - Enable/disable rules
  - Create custom rules
  - Test notifications
  - View notification history/logs

---

## REQUIREMENT 7: Service Visibility for Compliance Team

### Current State
- All services for existing clients should be visible to Compliance team
- Need to exclude cost/fee information
- Need to show historical services across all engagements

### Implementation Tasks

#### 7.1 Backend API: Client Services View
- Create `GET /api/clients/:clientId/services` endpoint:
  - Returns all services for a client
  - Includes data from:
    - Current COI requests
    - Historical COI requests (completed/archived)
    - PRMS engagement data (if integrated)
  - Exclude fields: `estimated_fees`, `actual_fees`, `billing_*`, `cost_*`
  - Include fields: `service_type`, `engagement_type`, `start_date`, `end_date`, `status`, `engagement_partner`, `team_members`

- Add role-based access control:
  - Only Compliance, Partner, Super Admin can access
  - Regular users cannot see other clients' full service history

#### 7.2 Backend API: All Clients Services Overview
- Create `GET /api/compliance/all-client-services` endpoint:
  - Returns aggregated view of all client services
  - Grouped by client
  - Filtered by date range, service type, partner, etc.
  - Exclude financial data
  - Accessible only to Compliance team

#### 7.3 Frontend UI: Client Services History
- Create new route: `/compliance/client-services/:clientId`
- Show timeline of all services for the client:
  - Service type and category
  - Engagement dates
  - Status (proposal/active/completed)
  - Engagement partner
  - Team members
  - Conflicts identified (if any)
  - Documents (excluding financial documents)

#### 7.4 Frontend UI: All Clients Services Dashboard
- Create new route: `/compliance/all-services`
- Show filterable table/cards of all client services:
  - Filters: Client, Service Type, Date Range, Status, Partner
  - Export to Excel (without financial data)
  - Search by client name, service type
  - Group by service type or client

#### 7.5 Navigation Updates
- Add "All Client Services" link to Compliance team navigation
- Add breadcrumbs for navigation between client details and services

---

## Implementation Priority & Order

### Phase 1: Quick Wins (2-3 hours)
1. **Requirement 4**: Rejection options (simplest, no DB changes)
2. **Requirement 7**: Service visibility (backend queries + simple UI)

### Phase 2: Service Catalog (3-4 hours)
3. **Requirement 2**: Service types with sub-categories (DB schema + seeding + UI updates)

### Phase 3: Prospect Management (3-4 hours)
4. **Requirement 3**: Complete prospect vs client flow (DB updates + logic + filtering)

### Phase 4: State Management (2-3 hours)
5. **Requirement 5**: HRMS research + approver status tracking (research doc + basic implementation)

### Phase 5: Event-Driven Architecture (4-6 hours)
6. **Requirement 6**: Email alerts with event system (most complex, includes research + implementation)

**Total Estimated Time: 14-20 hours**

---

## Testing Checklist

### Requirement 2: Service Types
- [ ] Service categories display correctly in dropdowns
- [ ] Sub-categories appear for "Business/Asset Valuation"
- [ ] Admin can add/edit service types
- [ ] Existing COI requests migrated correctly

### Requirement 3: Prospect Management
- [ ] New proposals tagged as prospects
- [ ] PRMS client check works with fuzzy matching
- [ ] Prospect converts to client after engagement conversion
- [ ] Filters show prospects vs clients correctly
- [ ] Conversion rate displayed in dashboard

### Requirement 4: Rejection Options
- [ ] Director sees only Approve/Reject buttons
- [ ] Compliance sees all action buttons including "Approve with Restrictions"
- [ ] Backend validation prevents director from using restricted actions

### Requirement 5: State Management
- [ ] Approver status displays in admin UI
- [ ] Requester notified when approver unavailable
- [ ] Delegate receives approval if assigned
- [ ] Expected return date shown

### Requirement 6: Event-Driven Architecture
- [ ] Events emitted for all defined event types
- [ ] Notification rules trigger correctly
- [ ] Email templates render with variables
- [ ] User can configure notification preferences
- [ ] Digest/batching reduces email noise
- [ ] Admin can view notification logs

### Requirement 7: Service Visibility
- [ ] Compliance can view all client services
- [ ] Financial data excluded from response
- [ ] Historical services display in timeline
- [ ] Export to Excel works without financial data
- [ ] Filters and search work correctly

---

## Rollback Plan

- All database migrations are reversible
- Feature flags can be used to disable new features if needed
- Backup database before starting implementation
- Test each phase independently before proceeding

---

## Notes

- Some features (HRMS integration, full event-driven architecture) are marked for "research + prototype implementation" - production implementation will require deeper integration
- Email sending uses existing email utility (if available) or logs to console for prototype testing
- PRMS client checking requires mock data or actual PRMS database access
- All changes maintain backward compatibility with existing data

---

**End of Plan**
