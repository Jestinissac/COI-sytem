# Q&A Answers Record

## Date: [Current Session]

---

## Q1: New Client Creation Workflow
**Answer**: B - System creates "Client Request" for PRMS Admin, Requester can save draft

**Selected Option**: B
**Recommendation**: Best option - allows async processing, audit trail, non-blocking workflow

**Implementation Details**:
- Create `client_requests` table
- Notification to PRMS Admin
- Requester can save COI form as draft
- Once client added, Requester can select and submit

---

## Q2: Director Approval for Team Members
**Answer**: A - In-system: Director clicks "Approve" button

**Selected Option**: A
**Recommendation**: Best option - faster, better audit trail, real-time

**Implementation Details**:
- Notification to Director when team member submits
- Director dashboard shows "Pending Approval"
- One-click approve button
- Optional document upload as backup
- System records approval with timestamp

---

## Q3: Global COI Integration

### Q3a: How is Global independence clearance obtained?
**Answer**: Manual Excel upload - Status updates to stakeholders is enough (outside COI system)

**Selected Option**: Manual Excel upload
**Note**: External process, no API integration needed

**Implementation Details**:
- Excel upload functionality
- Status tracking: Pending/Approved/Rejected
- Status update notifications to stakeholders

### Q3b: Who verifies Global clearance?
**Answer**: A - Compliance Officer

**Selected Option**: A

### Q3c: Can request proceed without Global clearance?
**Answer**: C - Conditional (depends on factors) - Needs to be configurable

**Selected Option**: C
**Requirement**: Must be configurable

**Implementation Details**:
- Configuration field: `require_global_clearance_before_approval` (boolean)
- Can be set per service type or client type
- Compliance Officer can override if needed
- If true: Request blocked until Global clearance
- If false: Request can proceed, clearance tracked separately

---

## Q4: Document Management

### Q4a: Where are documents stored?
**Answer**: A - COI system database

**Selected Option**: A

**Implementation Details**:
- Documents in `coi_attachments` table
- File storage in database or file system with DB references
- Max file size: 10MB (configurable)
- Formats: PDF, DOCX, XLSX, images

### Q4b: Are ISQM forms digital or PDF uploads?
**Answer**: C - Both (digital and PDF uploads)

**Selected Option**: C
**Reason**: Active projects may have ISQM forms that must be uploaded for open COI requests

**Implementation Details**:
- Digital forms: Fillable in COI system
- PDF uploads: For existing/active projects
- System supports both methods

### Q4c: Who has access to ISQM forms?
**Answer**: D - All roles (with segregation)

**Selected Option**: D
**Recommendation**: Best option - appropriate access for all roles with data segregation

**Implementation Details**:
- Admin: Full access (upload, edit, view)
- Compliance: View only (verification)
- Partner: View only (oversight)
- Requester: View own request forms only
- Finance: View only (if needed)

---

## Q5: Email/Notification System

### Q5a: What email system is used?
**Answer**: Microsoft Exchange/Outlook (O365)

**Selected Option**: O365

**Implementation Details**:
- O365 SMTP configuration
- HTML email templates
- Attachment support

### Q5b: Admin emails (Malita & Nermin) are:
**Answer**: B - Role-based (Admin role emails)

**Selected Option**: B

**Implementation Details**:
- Fetch all users with "Admin" role
- Send to all Admin role users
- No hardcoded emails
- Auto-updates if Admin team changes

### Q5c: Where do user emails come from?
**Answer**: C - Both (HRMS source, can override)

**Selected Option**: C

**Implementation Details**:
- Primary: HRMS Employee Master (SQL Server)
- Override: COI system user profile
- Fallback: COI profile if HRMS not available
- User can update email in profile

---

## Summary of Recommendations Implemented

1. ✅ Client Request workflow with draft capability
2. ✅ In-system Director approval with optional document backup
3. ✅ Configurable Global clearance blocking rules
4. ✅ Database document storage with role-based access
5. ✅ Both digital and PDF ISQM forms
6. ✅ Role-based email notifications (O365)
7. ✅ HRMS email source with override capability

---

## Next Actions

- [x] Answers recorded
- [ ] User journeys updated with answers
- [ ] Implementation plan updated
- [ ] Prototype development can proceed


