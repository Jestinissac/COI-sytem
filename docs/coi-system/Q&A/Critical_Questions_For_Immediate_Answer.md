# Critical Questions - Immediate Answers Required

## Purpose
These are the most critical questions that need answers before prototype development can proceed. Please provide answers to ensure accurate implementation.

---

## 🔴 CRITICAL QUESTION 1: New Client Creation Workflow

**When a Requester needs to add a new client (client not in PRMS Client Master dropdown):**

**Question**: What is the exact workflow?

**Options to Consider:**
- A) System sends notification to PRMS Admin, Requester waits for client to be added, then continues
- B) System creates a "Client Request" that PRMS Admin processes, Requester can save draft COI request
- C) Requester fills COI form with new client details, system auto-creates client request in PRMS
- D) Other (please specify)

**Additional Details Needed:**
- How long does client addition typically take?
- Can Requester proceed with COI request while client is being added?
- Who approves new client additions in PRMS?
- Is there a notification when client is added?

**Impact**: Blocks Requester from creating COI request if workflow is unclear.

---

## 🔴 CRITICAL QUESTION 2: Director Approval for Team Members

**When a team member (not Director) submits a COI request:**

**Question**: How does Director provide written approval?

**Options to Consider:**
- A) In-system approval: Director receives notification, clicks "Approve" button in system
- B) Document upload only: Team member uploads Director's signed approval document
- C) Both: Director can approve in-system OR team member uploads document
- D) Other (please specify)

**Additional Details Needed:**
- Can Director delegate permanent approval authority to team members?
- Is there a delegation management system?
- What format is the written approval (email, signed document, system approval)?

**Impact**: Affects Requester submission workflow and approval mechanism design.

---

## 🔴 CRITICAL QUESTION 3: Global COI Integration & Clearance

**For requests with International Operations:**

**Question 3a**: How is Global independence clearance obtained and verified?

**Options to Consider:**
- A) Manual process: Compliance uploads Excel sheet, manually verifies clearance
- B) API integration: System integrates with Global COI portal (if available)
- C) Hybrid: Manual upload now, API integration planned for future
- D) Other (please specify)

**Question 3b**: Who verifies Global independence clearance?

**Options:**
- A) Compliance Officer (same person reviewing COI request)
- B) Separate Global COI team
- C) Automated system check
- D) Other (please specify)

**Question 3c**: Can COI request proceed without Global clearance, or is it blocked?

**Options:**
- A) Blocked: Request cannot proceed until Global clearance obtained
- B) Can proceed: Global clearance can be obtained later
- C) Conditional: Depends on service type or other factors
- D) Other (please specify)

**Additional Details Needed:**
- How long does Global clearance typically take?
- What happens when Global COI portal requirements change?

**Impact**: Affects International Operations workflow and Compliance review process.

---

## 🔴 CRITICAL QUESTION 4: Document Management System

**Question 4a**: Where are proposal documents, engagement letters, and ISQM forms stored?

**Options to Consider:**
- A) COI system database (file storage in database)
- B) Separate Document Management System (DMS) integration
- C) File server/cloud storage (SharePoint, Google Drive, etc.)
- D) Other (please specify)

**Question 4b**: Are ISQM forms (Client Screening Questionnaire, New Client Acceptance checklist) digital or PDF uploads?

**Options:**
- A) Digital forms: Fillable directly in COI system
- B) PDF uploads: Forms filled externally, then uploaded
- C) Both: Some digital, some PDF
- D) Other (please specify)

**Question 4c**: Who has access to completed ISQM forms?

**Options:**
- A) Admin only
- B) Admin and Compliance
- C) Admin, Compliance, and Partner
- D) All roles (with data segregation)
- E) Other (please specify)

**Additional Details Needed:**
- Maximum file size for uploads?
- Supported file formats?
- Document retention period?

**Impact**: Affects Admin workflow, system architecture, and document storage design.

---

## 🔴 CRITICAL QUESTION 5: Email/Notification System

**Question 5a**: What email system is used for notifications?

**Options to Consider:**
- A) Microsoft Exchange/Outlook
- B) Gmail/Google Workspace
- C) Custom SMTP server
- D) Other (please specify)

**Question 5b**: For 30-day monitoring alerts, the document mentions specific admin emails (Malita & Nermin). Are these:

**Options:**
- A) Hardcoded: Specific email addresses in system
- B) Role-based: Emails of users with "Admin" role
- C) Configurable: Admin can set alert recipient list
- D) Other (please specify)

**Question 5c**: Where do user email addresses come from?

**Options:**
- A) HRMS Employee Master (fetched from SQL Server)
- B) User profile in COI system
- C) Both: HRMS as source, can be overridden in COI
- D) Other (please specify)

**Additional Details Needed:**
- SMTP server configuration available?
- Email templates required?
- Can users configure notification preferences (opt-in/opt-out)?

**Impact**: Affects notification system design, email integration, and user communication.

---

## ✅ ANSWERS PROVIDED

### Q1: New Client Creation Workflow
**Answer**: **B** - System creates "Client Request" for PRMS Admin, Requester can save draft

**Recommendation**: This is the best option because:
- Allows Requester to continue working without blocking
- Creates audit trail of client request
- PRMS Admin can process client addition asynchronously
- Requester can complete COI form and save as draft
- Once client is added, Requester can submit COI request

**Implementation**:
- When Requester selects "Request New Client":
  - System creates `client_requests` table entry
  - Sends notification to PRMS Admin
  - Allows Requester to continue filling COI form
  - COI form can be saved as draft
  - Once client added to PRMS, Requester can select client and submit

### Q2: Director Approval for Team Members
**Answer**: **A** - In-system: Director clicks "Approve" button

**Recommendation**: This is the best option because:
- Faster workflow (no document upload needed)
- Better audit trail (system records approval)
- Real-time notifications
- Can add document upload as optional backup

**Implementation**:
- When team member submits request:
  - System sends notification to Director
  - Director sees "Pending Approval" in dashboard
  - Director can view request details
  - Director clicks "Approve" button
  - Optional: Director can attach approval document as backup
  - System records approval with timestamp and user ID

### Q3: Global COI Integration

**Q3a: How is Global independence clearance obtained?**
**Answer**: **Manual Excel upload** - Status updates to stakeholders is enough (outside COI system)

**Implementation**:
- Compliance Officer uploads Excel sheet for Global COI portal
- System tracks Global clearance status (Pending/Approved/Rejected)
- Status updates sent to stakeholders
- No API integration needed (external process)

**Q3b: Who verifies Global clearance?**
**Answer**: **A** - Compliance Officer

**Q3c: Can request proceed without Global clearance?**
**Answer**: **C** - Conditional (depends on factors) - **Needs to be configurable**

**Recommendation**: Make it configurable because:
- Different service types may have different requirements
- Some clients may have pre-existing Global clearance
- Business rules may change over time

**Implementation**:
- Add configuration field: `require_global_clearance_before_approval` (boolean)
- Can be set per service type or client type
- If true: Request blocked until Global clearance obtained
- If false: Request can proceed, Global clearance tracked separately
- Compliance Officer can override if needed

### Q4: Document Management

**Q4a: Where are documents stored?**
**Answer**: **A** - COI system database

**Implementation**:
- Documents stored in `coi_attachments` table
- File storage in database (BLOB) or file system with database references
- Maximum file size: To be configured (recommend 10MB default)
- Supported formats: PDF, DOCX, XLSX, images

**Q4b: Are ISQM forms digital or PDF uploads?**
**Answer**: **C** - Both (digital and PDF uploads)

**Reason**: Active projects may have ISQM forms that must be uploaded for open COI requests

**Implementation**:
- Digital forms: Fillable directly in COI system
- PDF uploads: For existing/active projects with completed forms
- System supports both methods
- Forms can be completed in system OR uploaded as PDF

**Q4c: Who has access to ISQM forms?**
**Answer**: **D** - All roles (with segregation)

**Recommendation**: This is the best option because:
- Compliance needs to verify forms are completed
- Partner needs visibility for oversight
- Admin manages form completion
- Requesters can view their own request forms
- Data segregation ensures appropriate access

**Implementation**:
- Admin: Full access (upload, edit, view)
- Compliance: View only (verification)
- Partner: View only (oversight)
- Requester: View own request forms only
- Finance: View only (if needed for financial assessment)

### Q5: Email/Notification System

**Q5a: What email system is used?**
**Answer**: **Microsoft Exchange/Outlook (O365)**

**Implementation**:
- O365 SMTP configuration
- Email templates for different notification types
- HTML email support
- Attachment support for reports

**Q5b: Admin emails (Malita & Nermin) are:**
**Answer**: **B** - Role-based (Admin role emails)

**Implementation**:
- System fetches all users with "Admin" role
- Sends notifications to all Admin role users
- No hardcoded emails
- If Admin team changes, system automatically updates recipients

**Q5c: Where do user emails come from?**
**Answer**: **C** - Both (HRMS source, can override)

**Implementation**:
- Primary source: HRMS Employee Master (SQL Server)
- Can be overridden in COI system user profile
- Fallback: If HRMS email not available, use COI profile email
- User can update email in profile if needed

---

## 📝 Additional Implementation Notes

### Based on Answers:

1. **Client Request Workflow**:
   - Create `client_requests` table
   - Notification system for PRMS Admin
   - Draft COI request capability
   - Client addition status tracking

2. **Director Approval**:
   - In-system approval workflow
   - Notification system for Directors
   - Optional document upload as backup
   - Approval delegation capability (future enhancement)

3. **Global COI**:
   - Excel upload functionality
   - Status tracking (Pending/Approved/Rejected)
   - Configurable blocking rules
   - Status update notifications

4. **Document Management**:
   - Database storage for documents
   - Digital form builder for ISQM forms
   - PDF upload support
   - Role-based document access

5. **Notifications**:
   - O365 SMTP integration
   - Role-based recipient lists
   - Email from HRMS with override capability
   - Multiple notification types (status changes, alerts, reminders)

---

## Status: ✅ All Critical Questions Answered

**Date Answered**: [Current Date]
**Next Steps**: 
1. Update user journeys with these answers
2. Update implementation plan
3. Proceed with prototype development

---

## Next Steps After Answers

1. Update user journeys with answers
2. Update implementation plan
3. Resolve remaining gaps
4. Proceed with prototype development

---

## Related Documents

- Full User Journeys: `../User_Journeys_End_to_End.md`
- All Questions (30): `User_Journey_Questions.md`
- Gaps Summary: `Journey_Gaps_Summary.md`

