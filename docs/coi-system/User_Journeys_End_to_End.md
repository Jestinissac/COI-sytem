# COI System - End-to-End User Journeys

## Overview
This document outlines complete user journeys for all roles in the COI system, from initial login through to engagement activation and renewal management.

---

## Journey 1: Requester (Director/Auditor) - Complete Flow

### 1.1 Initial Login & Navigation

**Step 1: Multi-System Landing Page**
- User logs into unified platform
- System checks user permissions (HRMS, PRMS, COI)
- Landing page displays tiles for accessible systems
- User clicks "COI System" tile

**Step 2: COI System Entry**
- User redirected to COI system
- System identifies user role: Requester
- User sees "My Requests" dashboard
- Dashboard shows:
  - Total requests submitted
  - Active requests by status
  - Pending approvals
  - Recent activity

### 1.2 Creating a New COI Request

**Step 3: Initiate New Request**
- User clicks "Create New Request" button
- System displays dynamic form (fields from configuration)
- Form sections: Client Data, Service Information, Ownership & Structure, Signatory Details, International Operations

**Step 4: Fill Request Form**

**Section A: Service Information**
- User enters exact description and scope
- Selects service type: Recurring / New / Linked to existing engagement
- Selects service category: Assurance / Advisory / Tax / Accounting / Other
- If applicable, enters valuation purposes
- System validates mandatory fields

**Section B: Client Information**
- User selects client from dropdown (PRMS Client Master)
  - **If client not found**: User clicks "Request New Client"
    - System creates "Client Request" entry in `client_requests` table
    - System sends notification to PRMS Admin
    - User can continue filling COI form (saved as draft)
    - User can save draft COI request
    - Once PRMS Admin adds client, user receives notification
    - User can then select new client from dropdown and submit COI request
- System auto-fills: Full legal name, Commercial registration
- User enters: Nature of business, Operating sectors
- User selects: Client status (New / Existing / Potential)
  
  **If Existing Client:**
  - User enters: Existing Engagement Code (reference)
  - System displays: Service history, Partner in charge (from previous requests)
  
  **If New Client:**
  - User enters: Introduction source, Due diligence notes

**Section C: Ownership & Structure**
- User enters: Full ownership structure
- User selects: PIE status (Yes/No)
- User enters: Related/affiliated entities under common control
  
  **Conditional Field - Parent Company:**
  - If International/PIE/Potential: Parent Company field becomes mandatory
  - User enters: Parent company name
  - System validates: Parent company exists in system or flags for review

**Section D: Signatory Details**
- User adds signatories (dynamic list):
  - Name: Dropdown from Employee Master
  - Position: Auto-filled from Employee Master
  - Can add multiple signatories

**Section E: International Operations**
- User checks: "International Operations" checkbox
- Additional tab activates
- User enters: Foreign subsidiaries, branches, affiliates
- User uploads: Excel sheet for Global COI portal (if required)
- System flags: Global independence clearance required

**Step 5: Automated Validation**
- User clicks "Validate" or "Submit"
- System performs:
  - Fuzzy matching: Checks for similar entity names
  - Duplication check:
    - Existing active proposals for same entity
    - Active engagements for same entity
    - Parent/subsidiary active engagements
  
  **If Conflict Detected:**
  - System blocks submission
  - Displays conflict details
  - User must provide formal written justification
  - User uploads justification document
  - User can resubmit with justification

**If No Conflict:**
- System allows submission

**Step 6: Request Submission**
- User reviews all entered data
- **If submitted by team member (not Director)**:
  - System sends notification to Director
  - Director receives notification in dashboard
  - Director can view request details
  - Director clicks "Approve" button in system
  - System records Director approval with timestamp
  - Optional: Director can attach approval document as backup
  - Once Director approves, request can be submitted
- User clicks "Submit Request"
- System:
  - Assigns unique COI Request ID (e.g., COI-2025-001)
  - Sets status to "Under Review"
  - Sends notification to Compliance Department
  - Displays confirmation message
  - Redirects to "My Requests" dashboard

### 1.3 Monitoring Request Status

**Step 7: View Request Status**
- User navigates to "My Requests" dashboard
- Sees request in list with current status
- Can click to view request details
- Sees timeline showing:
  - Submission date
  - Current stage (Compliance Review / Partner Approval / Finance Coding / Admin Execution)
  - Time spent in each stage

**Step 8: Respond to Information Requests**
- If Compliance requests more information:
  - User receives notification (email/system alert)
  - Request appears in "Pending Information" section
  - User clicks request to view compliance comments
  - User updates form with additional information
  - User resubmits request
  - Request returns to Compliance queue

**Step 9: View Approved Request**
- When request is approved:
  - User receives notification
  - Request appears in "Approved" section
  - User can view:
    - Engagement Code (if generated)
    - Proposal status
    - Execution date
    - Client response status

**Step 10: Handle Rejected Request**
- If request is rejected:
  - User receives notification with rejection reason
  - Request appears in "Rejected" section
  - User can view rejection comments
  - User can create new request (if needed)

### 1.4 Post-Approval Activities

**Step 11: Monitor 30-Day Window**
- After proposal execution:
  - User receives alerts every 10 days
  - User can view proposal status in dashboard
  - User can follow up with client if needed

**Step 12: Handle Client Rejection**
- If client rejects proposal:
  - User sends rejection confirmation email to Admin
  - Admin attaches email to request
  - Request is closed
  - User can view closed request in history

---

## Journey 2: Compliance Officer - Complete Flow

### 2.1 Initial Login & Navigation

**Step 1: Multi-System Landing Page**
- Compliance Officer logs in
- Sees COI System tile (if has access)
- Clicks "COI System" tile

**Step 2: COI System Entry**
- System identifies role: Compliance
- User sees Compliance Dashboard (Full COI Workspace)
- Dashboard shows:
  - Pending Reviews count
  - Reviews completed today/this week
  - Average review time
  - Requests requiring more information

### 2.2 Reviewing COI Requests

**Step 3: Access Review Queue**
- User navigates to "Review Queue"
- Sees list of all requests pending compliance review
- Table shows:
  - Request ID, Client Name, Service Type
  - Submission Date, Requester
  - Conflict Alerts (if any)
  - International Operations Flag
  - Days in queue

**Step 4: Select Request for Review**
- User clicks on a request
- System displays full request details
- User can see:
  - All form data (Service, Client, Ownership, Signatories)
  - Automated conflict detection results
  - Justification documents (if conflict was detected)
  - **Note**: User CANNOT see commercials/pricing (data segregation)

**Step 5: Detailed Review Process**

**Review Ownership Structure:**
- User reviews: Parent company, Ownership structure, PIE status
- User checks: Related/affiliated entities
- User verifies: Data completeness

**Review Conflict Alerts:**
- If conflict detected:
  - User reviews conflict details
  - User reviews justification provided
  - User assesses if justification is acceptable

**Review International Operations:**
- If International Operations selected:
  - User checks: Global independence clearance status (Pending/Approved/Rejected)
  - User verifies: Excel sheet uploaded for Global COI portal (external process)
  - User updates: Global clearance status in system
  - **Configurable Blocking**: System checks if Global clearance is required before approval
    - If configured as required: Request blocked until Global clearance = Approved
    - If configured as optional: Request can proceed, Global clearance tracked separately
  - User confirms: All global requirements met (if blocking is enabled)

**Review Service Details:**
- User verifies: Service description and scope
- User checks: Service type and category
- User confirms: All mandatory fields completed

**Step 6: Make Review Decision**

User selects one of four options:

**Option A: Approve**
- User clicks "Approve"
- System prompts for optional comments
- User enters comments (if any)
- User confirms approval
- System:
  - Updates request status to "Partner Review"
  - Sends notification to Assigned Partner
  - Records decision in audit trail
  - Removes from Compliance queue

**Option B: Approve with Restrictions**
- User clicks "Approve with Restrictions"
- User enters restriction details/comments
- User confirms approval
- System:
  - Updates request status to "Partner Review"
  - Attaches restriction notes
  - Sends notification to Partner
  - Records decision

**Option C: Need More Information**
- User clicks "Need More Information"
- User enters specific information needed
- User selects which sections need updates
- User confirms
- System:
  - Updates request status to "Pending Information"
  - Returns request to Requester
  - Sends notification to Requester
  - Records decision

**Option D: Reject**
- User clicks "Reject"
- User enters rejection reason (mandatory)
- User confirms rejection
- System:
  - Updates request status to "Rejected"
  - Sends notification to Requester
  - Closes request
  - Records decision

### 2.3 Handling Multiple Proposals for Same Client

**Step 7: Assess Overlapping Proposals**
- If new proposal received for same client during 30-day window:
- System alerts Compliance Officer
- User reviews both proposals:
  - Service types
  - Service scopes
  - Timeline overlap
  
**Decision Logic:**
- **If services not conflicting:**
  - User approves both proposals
  - Both proceed independently
  
- **If potential conflict:**
  - User assesses priority
  - Default: Priority to earlier submission
  - If Partner written approval exists for later submission:
    - User reviews Partner approval document
    - User can approve both with notes
  - User documents decision with evidence

### 2.4 Dashboard Monitoring

**Step 8: Monitor Review Metrics**
- User views Compliance Dashboard
- Reviews:
  - Review queue status
  - Conflict detection trends
  - Review efficiency metrics
  - International operations queue

---

## Journey 3: Partner - Complete Flow

### 3.1 Initial Login & Navigation

**Step 1: Multi-System Landing Page**
- Partner logs in
- Sees COI System tile
- Clicks "COI System" tile

**Step 2: COI System Entry**
- System identifies role: Partner
- User sees Partner Dashboard (One-Click Dashboard)
- Dashboard displays:
  - KPI cards: Active Proposals, Pending Approvals, Active Engagements, Renewals, Red Flags
  - Active/Past Proposals table
  - COI Decisions summary
  - Engagement Codes
  - Group-level services
  - Red flags/alerts
  - Expiry/renewal alerts

### 3.2 Reviewing Requests for Approval

**Step 3: Access Pending Approvals**
- User views "Pending Partner Approvals" section
- Sees list of requests approved by Compliance
- Table shows:
  - Request ID, Client Name, Service Type
  - Compliance decision and comments
  - Submission date, Days pending
  - Conflict status

**Step 4: Review Request Details**
- User clicks on request
- System displays:
  - Complete request details
  - Compliance decision and comments
  - Any restrictions noted by Compliance
  - Business context
  - Engagement history (if existing client)
  - Group-level service overview

**Step 5: Strategic Review**
- User reviews:
  - Business alignment
  - Client relationship
  - Service portfolio
  - Group-level conflicts
  - Strategic considerations

**Step 6: Make Partner Decision**

User selects one of four options:

**Option A: Approve**
- User clicks "Approve"
- User enters optional comments
- User confirms approval
- System:
  - Updates request status to "Finance Coding"
  - Sends notification to Finance Team
  - Records decision
  - Removes from Partner queue

**Option B: Approve with Restrictions**
- User clicks "Approve with Restrictions"
- User enters restriction details
- User confirms approval
- System:
  - Updates status to "Finance Coding"
  - Attaches restriction notes
  - Sends notification to Finance

**Option C: Need More Information**
- User clicks "Need More Information"
- User enters information needed
- User confirms
- System:
  - Updates status to "Compliance Review" (NOT back to Requester)
  - Returns to Compliance Department
  - Sends notification to Compliance
  - Records decision

**Option D: Reject**
- User clicks "Reject"
- User enters rejection reason
- User confirms rejection
- System:
  - Updates status to "Rejected"
  - Sends notification to Requester
  - Closes request
  - Records decision

### 3.3 Dashboard Monitoring

**Step 7: Monitor Dashboard Metrics**
- User views dashboard regularly
- Monitors:
  - Active proposals status
  - COI decisions trends
  - Engagement codes generated
  - Group-level services
  - Red flags and alerts
  - Upcoming renewals

**Step 8: Print Tracking Reports**
- User selects request(s)
- User clicks "Print Tracking Report"
- System generates report with:
  - Request details
  - COI decisions
  - Engagement codes
  - Status history
- User can export to PDF/Excel

**Step 9: Handle Renewal Alerts**
- User receives renewal alerts (90 days before expiry)
- User reviews engagement details
- User can initiate renewal process if needed

---

## Journey 4: Finance Officer - Complete Flow

### 4.1 Initial Login & Navigation

**Step 1: Multi-System Landing Page**
- Finance Officer logs in
- Sees COI System tile
- Clicks "COI System" tile

**Step 2: COI System Entry**
- System identifies role: Finance
- User sees Finance Dashboard (Engagement Code Module)
- Dashboard shows:
  - Finance Coding Queue
  - Engagement Codes Generated (today/week/month)
  - Credit Risk Overview
  - Financial Parameters Summary

### 4.2 Finance Coding Process

**Step 3: Access Finance Coding Queue**
- User navigates to "Finance Coding Queue"
- Sees requests approved by Partner
- Table shows:
  - Request ID, Client Name, Service Type
  - Partner approval date
  - Credit Risk Assessment Status
  - Days pending

**Step 4: Select Request for Finance Coding**
- User clicks on request
- System displays:
  - Request details (no pricing/commercials visible)
  - Client information
  - Service information
  - Partner approval details

**Step 5: Credit Risk Assessment**
- User reviews:
  - Client payment history (from PRMS or internal records)
  - Previous engagement payment records
  - Credit terms history
  - Any pending amounts
- User assesses credit risk: High / Medium / Low
- User enters risk assessment notes

**Step 6: Enter Financial Parameters**
- User enters:
  - Credit terms (e.g., Net 30, Net 60)
  - Currency (KWD, USD, EUR, etc.)
  - Due pending amounts (if any)
  - Comments/concerns:
    - Late payment history
    - Payment issues
    - Special conditions
    - Other financial concerns

**Step 7: Generate Engagement Code**
- User reviews all financial information
- User clicks "Generate Engagement Code"
- System:
  - Determines service type abbreviation (TAX, AUD, ADV, ACC, OTH)
  - Gets current year
  - Queries last sequential number for year + service type
  - Increments sequential number
  - Generates code: `ENG-{YEAR}-{SERVICE_TYPE}-{SEQUENTIAL_NUMBER}`
  - Validates uniqueness
  - Saves to `coi_engagement_codes` table
  - Links to COI request
  - Displays generated code to user
- User confirms code generation
- System:
  - Updates request status to "Admin Execution"
  - Sends notification to Admin Team
  - Records code generation in audit trail

### 4.3 Dashboard Monitoring

**Step 8: Monitor Finance Metrics**
- User views Finance Dashboard
- Reviews:
  - Codes generated today/week/month
  - Code generation trends
  - Service type breakdown
  - Credit risk distribution

---

## Journey 5: Admin Team - Complete Flow

### 5.1 Initial Login & Navigation

**Step 1: Multi-System Landing Page**
- Admin Team member logs in
- Sees COI System tile
- Clicks "COI System" tile

**Step 2: COI System Entry**
- System identifies role: Admin
- User sees Admin Dashboard (Execution Process)
- Dashboard shows:
  - Execution Queue
  - 30-Day Monitoring
  - Engagement Activation
  - Renewal Management

### 5.2 Proposal Execution

**Step 3: Access Execution Queue**
- User navigates to "Execution Queue"
- Sees requests with Engagement Codes (ready for execution)
- Table shows:
  - Request ID, Client Name, Service Type
  - Engagement Code
  - Partner approval date
  - Finance coding date
  - Days pending execution

**Step 4: Prepare Proposal Document**
- User clicks on request
- System displays:
  - Complete request details
  - Engagement Code
  - All approvals and decisions
- User prepares proposal document (external process)
- User includes Engagement Code in proposal
- User includes disclaimer (highlighted)

**Step 5: Record Execution Date**
- User clicks "Record Execution"
- User enters execution date
- User uploads proposal document (optional)
- User confirms execution
- System:
  - Updates request status to "Proposal Executed"
  - Activates 30-day monitoring window
  - Schedules automated alerts (every 10 days)
  - Sends initial notification to Requester, Admin, Partner
  - Records execution in audit trail

### 5.3 30-Day Monitoring

**Step 6: Monitor 30-Day Window**
- User views "30-Day Monitoring" section
- Sees all proposals in 30-day window
- Table shows:
  - Request ID, Client Name
  - Execution Date
  - Days Remaining
  - Client Response Status
  - Alert Schedule (10-day intervals)

**Step 7: Handle Automated Alerts**
- System sends alerts every 10 days:
  - Day 10: Alert sent
  - Day 20: Alert sent
  - Day 30: Final alert sent
- User receives alerts in dashboard
- User can view alert history
- User can manually send reminders if needed

**Step 8: Handle Client Response**

**Scenario A: Client Approves (Signs Proposal)**
- Client signs and returns proposal
- User receives signed proposal document
- User clicks "Client Approved"
- User uploads signed proposal document
- User confirms approval
- System:
  - Updates status to "Active"
  - Triggers Engagement Letter workflow
  - Activates 3-year renewal alert
  - Sends notification to all parties
  - Records activation

**Scenario B: Client Rejects**
- Requester sends rejection confirmation email to Admin
- User receives email
- User clicks "Client Rejected"
- User uploads rejection confirmation email
- User confirms rejection
- System:
  - Updates status to "Rejected"
  - Closes request
  - Sends notification to all parties
  - Preserves historical data

**Scenario C: Lapse (No Response)**
- 30 days pass with no client response
- System automatically:
  - Updates status to "Lapsed"
  - Closes request
  - Sends notification to all parties
  - Preserves historical data
- User sees lapsed request in dashboard
- User can view lapsed request details

### 5.4 Engagement Activation

**Step 9: Issue Engagement Letter**
- After client approval:
- User prepares Engagement Letter (within 1-3 working days)
- User includes Engagement Code
- User uploads Engagement Letter (stored in COI system database)
- System records Engagement Letter issuance

**Step 11: Complete ISQM Forms**
- User accesses ISQM forms section
- **Two Methods Available**:
  - **Method 1 - Digital Forms**: User fills forms directly in COI system
    - Client Screening Questionnaire (digital form)
    - New Client Acceptance checklist (digital form)
  - **Method 2 - PDF Upload**: User uploads completed PDF forms
    - For existing/active projects with completed forms
    - User uploads PDF files
- System validates forms are completed
- System stores forms in database (digital or PDF)
- System attaches forms to request
- **Access Control**: All roles can view ISQM forms with data segregation
  - Admin: Full access (upload, edit, view)
  - Compliance: View only (verification)
  - Partner: View only (oversight)
  - Requester: View own request forms only
  - Finance: View only (if needed)

**Step 12: Finalize Engagement**
- User reviews all documents
- User confirms engagement is complete
- System:
  - Finalizes engagement status
  - Sends Engagement Code to PRMS via API
  - Authorizes project creation in PRMS
  - Records finalization

### 5.5 Renewal Management

**Step 12: Monitor Renewals**
- User views "Renewal Management" section
- Sees engagements due for renewal:
  - 90 days before expiry
  - 60 days before expiry
  - 30 days before expiry
- User receives renewal alerts
- User can initiate renewal process
- User can view renewal history

---

## Journey 6: Super Admin - Complete Flow

### 6.1 Initial Login & Navigation

**Step 1: Multi-System Landing Page**
- Super Admin logs in
- Sees all system tiles (HRMS, PRMS, COI)
- Clicks "COI System" tile

**Step 2: COI System Entry**
- System identifies role: Super Admin
- User sees Super Admin Dashboard
- Dashboard shows:
  - System Overview (all requests, all stages)
  - Cross-System Analytics
  - Data Segregation View
  - System Health Metrics

### 6.2 System Administration

**Step 3: View All Requests**
- User can view all requests across all requesters
- User can see:
  - All request details (including commercials/pricing)
  - All status changes
  - Complete audit trail
  - Cross-team submissions

**Step 4: Field Configuration Management**
- User navigates to "Field Configuration"
- User can:
  - Add new fields
  - Edit existing fields
  - Delete fields
  - Reorder fields/sections
  - Configure validation rules
  - Set up conditional logic
  - Manage dropdown options
  - Preview form layout

**Step 5: System Monitoring**
- User monitors:
  - System health
  - User activity
  - Performance metrics
  - Error logs
  - Integration status

**Step 6: Data Management**
- User can:
  - Export all data
  - Generate comprehensive reports
  - View audit trails
  - Manage system settings
  - Configure alerts

---

## Journey 7: Project Manager (PRMS) - Integration Flow

### 7.1 Project Creation in PRMS

**Step 1: Access PRMS**
- Project Manager logs into PRMS
- Navigates to Project Creation

**Step 2: Enter Engagement Code**
- User enters Engagement Code (from COI)
- Format: `ENG-2025-TAX-00142`

**Step 3: Code Validation**
- PRMS validates code against COI authorization table
- System checks:
  - Code exists in COI system
  - Code status is "Active"
  - Code is linked to approved COI request
  - Code is not expired or cancelled

**Step 4: Validation Result**

**If Valid:**
- System displays COI request details
- System allows project creation
- User proceeds with project setup
- System generates Project ID
- Project ID linked to Engagement Code

**If Invalid:**
- System blocks project creation
- System displays error message:
  - "Invalid Engagement Code"
  - "Engagement Code not found"
  - "Engagement Code not authorized"
  - "Please contact COI Admin"
- User cannot proceed until valid code is provided

**Step 5: Project Setup**
- User creates project with validated Engagement Code
- Project is linked to COI request
- Project operations can begin

---

## Common User Journey Elements

### Error Handling
- System displays clear error messages
- User can retry failed operations
- System logs all errors for admin review

### Notifications
- **Email System**: Microsoft O365 (Exchange/Outlook)
  - SMTP configuration for O365
  - HTML email templates
  - Attachment support for reports
- **Email Source**: 
  - Primary: HRMS Employee Master (SQL Server)
  - Override: COI system user profile (user can update)
  - Fallback: COI profile if HRMS not available
- **Notification Recipients**:
  - Role-based: All users with relevant roles (e.g., all Admin role users)
  - No hardcoded email addresses
  - Auto-updates if team members change
- **Notification Types**:
  - Email notifications for status changes
  - In-app notifications in dashboard
  - Alert badges for pending actions
  - 30-day monitoring alerts (every 10 days)
  - Renewal alerts (90/60/30 days before expiry)

### Search & Filter
- All dashboards support search
- Filter by: Date range, Status, Client, Service Type, Requester
- Advanced filters available

### Export & Print
- Export data to PDF/Excel/CSV
- Print reports and tracking documents
- Print-friendly views

### Help & Support
- Contextual help tooltips
- User guides accessible
- Support contact information

---

## Answers to Critical Questions

### Q1: New Client Creation - ANSWERED
**Answer**: System creates "Client Request" for PRMS Admin, Requester can save draft
- Client request created in system
- Notification sent to PRMS Admin
- Requester can continue and save draft COI request
- Once client added, Requester can select and submit

### Q2: Director Approval - ANSWERED
**Answer**: In-system approval (Director clicks "Approve" button)
- Director receives notification
- One-click approve in dashboard
- Optional document upload as backup
- System records approval with audit trail

### Q3: Global COI - ANSWERED
**Q3a**: Manual Excel upload, status updates to stakeholders (external process)
**Q3b**: Compliance Officer verifies
**Q3c**: Configurable - can be required or optional based on configuration
- Configuration field: `require_global_clearance_before_approval`
- Can be set per service type or client type
- Compliance can override if needed

### Q4: Document Management - ANSWERED
**Q4a**: COI system database storage
**Q4b**: Both digital forms and PDF uploads supported
**Q4c**: All roles with data segregation
- Admin: Full access
- Compliance: View only
- Partner: View only
- Requester: Own requests only
- Finance: View only

### Q5: Email/Notifications - ANSWERED
**Q5a**: Microsoft O365 (Exchange/Outlook)
**Q5b**: Role-based (Admin role emails, not hardcoded)
**Q5c**: Both HRMS source with COI override capability

---

## Remaining Gaps (Non-Critical)

These gaps can be addressed during development or in later phases:

7. **Renewal Process**
   - Gap: What is the exact renewal workflow?
   - Question: Is renewal a new COI request or extension of existing?

8. **Extension Beyond 30 Days**
   - Gap: Extension request process not detailed
   - Question: Who approves extensions? What is the workflow?

9. **Multiple Partners**
   - Gap: What if multiple partners need to approve?
   - Question: Is there a partner assignment mechanism?

10. **Delegation**
    - Gap: How does Director delegate authority to team members?
    - Question: Is there a delegation management system?

