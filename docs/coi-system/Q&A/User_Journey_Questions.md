# COI System - User Journey Questions & Answers

## Purpose
This document contains questions identified during end-to-end user journey planning. Answers should be provided by stakeholders to clarify requirements and fill gaps in the user journey documentation.

---

## Category 1: Client Management & PRMS Integration

### Q1: New Client Creation Workflow
**Question**: When a Requester requests a new client (client not in PRMS Client Master dropdown), what is the exact workflow?

**Details Needed**:
- Does the system send a notification to PRMS Admin?
- Is there an in-system request mechanism or external process?
- How long does client addition take?
- Can the Requester proceed with COI request while client is being added, or must they wait?
- Who approves new client additions in PRMS?

**Impact**: Affects Requester journey and system integration design.

---

### Q2: Client Master Data Synchronization
**Question**: How is Client Master data synchronized between PRMS and COI?

**Details Needed**:
- Real-time API sync or scheduled batch updates?
- What happens if client data changes in PRMS after COI request is created?
- Should COI system cache client data or always fetch from PRMS?
- How are client deletions handled?

**Impact**: Affects data consistency and integration architecture.

---

## Category 2: Approval & Delegation

### Q3: Director Approval for Team Members
**Question**: How does a Director provide written approval when a team member submits a COI request?

**Details Needed**:
- Is there an in-system approval mechanism (e.g., Director receives notification and clicks "Approve")?
- Or is it only document upload (team member uploads Director's signed approval)?
- Can Director delegate approval authority permanently to team members?
- Is there a delegation management system?

**Impact**: Affects Requester journey and approval workflow design.

---

### Q4: Multiple Partners Approval
**Question**: What if multiple partners need to approve a request?

**Details Needed**:
- Is there a partner assignment mechanism (Assigned Partner)?
- Can multiple partners be assigned to one request?
- Is approval required from all assigned partners or just one?
- How is partner assignment determined (by client, service type, department)?

**Impact**: Affects Partner journey and approval logic.

---

### Q5: Partner Approval Return Path
**Question**: When Partner selects "Need More Information", the request returns to Compliance (not Requester). Is this the correct workflow?

**Details Needed**:
- Why does it go to Compliance instead of Requester?
- Does Compliance then request information from Requester?
- What is the communication flow?
- Should there be a direct Partner-to-Requester communication channel?

**Impact**: Affects Partner and Compliance journeys.

---

## Category 3: International Operations & Global COI

### Q6: Global Independence Clearance Process
**Question**: How is Global COI portal integration handled for international operations?

**Details Needed**:
- Is it manual Excel upload only, or is there API integration planned?
- Who verifies Global independence clearance (Compliance or separate Global team)?
- What is the approval workflow for Global clearance?
- How long does Global clearance typically take?
- Can COI request proceed without Global clearance, or is it blocked?

**Impact**: Affects Compliance journey and International Operations workflow.

---

### Q7: Global COI Portal Updates
**Question**: The document mentions Global COI portal requirements "subject to further updates upon launching the new system by Global." How will this be handled?

**Details Needed**:
- Will field configuration system accommodate Global COI form changes?
- Who will update the Global COI form template when Global launches new system?
- Is there a notification mechanism for Global COI form updates?

**Impact**: Affects field configuration system and International Operations workflow.

---

## Category 4: Document Management

### Q8: Proposal Document Storage
**Question**: Where are proposal documents stored and managed?

**Details Needed**:
- Is there a document management system (DMS) integration?
- Or are documents stored in COI system database?
- What file formats are supported?
- What is the maximum file size?
- How long are documents retained?

**Impact**: Affects Admin journey and system architecture.

---

### Q9: ISQM Forms Management
**Question**: Where are ISQM forms (Client Screening Questionnaire, New Client Acceptance checklist) stored and managed?

**Details Needed**:
- Are forms part of COI system or separate system?
- Are forms digital (fillable in system) or PDF uploads?
- Who has access to completed ISQM forms?
- Are forms mandatory before engagement activation or can they be completed later?

**Impact**: Affects Admin journey and engagement activation workflow.

---

### Q10: Document Version Control
**Question**: How is document versioning handled?

**Details Needed**:
- If proposal is revised, how are versions tracked?
- Can users upload revised documents?
- Is there a document history/audit trail?

**Impact**: Affects document management and audit requirements.

---

## Category 5: Notifications & Alerts

### Q11: Email System Configuration
**Question**: What email system is used for notifications?

**Details Needed**:
- SMTP server configuration?
- Email templates required?
- Can users configure notification preferences?
- Are email notifications mandatory or optional?
- What email addresses are used (user email from HRMS or separate)?

**Impact**: Affects notification system design and user experience.

---

### Q12: Alert Delivery Methods
**Question**: How are alerts delivered to users?

**Details Needed**:
- Email only, or also in-app notifications?
- SMS notifications required?
- Push notifications for mobile?
- Can users set alert preferences (frequency, type)?

**Impact**: Affects notification system architecture.

---

### Q13: Alert Recipients
**Question**: For 30-day monitoring alerts, the document mentions "requester, compliance department, admin (Malita & Nermin) and partner's emails." Are these hardcoded or configurable?

**Details Needed**:
- Are admin emails (Malita & Nermin) hardcoded or role-based?
- What if admin team members change?
- Should there be a configurable alert recipient list?

**Impact**: Affects alert system configuration and maintainability.

---

## Category 6: Renewal & Extension Management

### Q14: Renewal Process Workflow
**Question**: What is the exact renewal workflow when an engagement reaches 3-year expiry?

**Details Needed**:
- Is renewal a new COI request or extension of existing engagement?
- What information needs to be updated for renewal?
- Who initiates renewal (Admin, Partner, or Requester)?
- Is there a simplified renewal process or full COI review required?

**Impact**: Affects renewal workflow design and Admin/Partner journeys.

---

### Q15: Extension Beyond 30 Days
**Question**: The document mentions "extension requests beyond 30 days require documented justification." What is the exact workflow?

**Details Needed**:
- Who can request extension (Requester, Admin, or both)?
- Who approves extension (Partner, Compliance, or Super Admin)?
- What is the maximum extension period?
- Can extensions be requested multiple times?
- What happens to the 30-day window after extension is approved?

**Impact**: Affects Admin journey and 30-day monitoring workflow.

---

## Category 7: Multiple Proposals Handling

### Q16: Simultaneous Proposals Conflict Resolution
**Question**: When multiple proposals are submitted for the same client during 30-day window, who makes the final decision on priority?

**Details Needed**:
- Is it always Compliance who assesses, or can Partner override?
- What if Partner written approval exists but Compliance still sees conflict?
- How are "business interests" documented and stored?
- Is there an escalation path if Compliance and Partner disagree?

**Impact**: Affects Compliance and Partner journeys, conflict resolution logic.

---

### Q17: Service Conflict Definition
**Question**: How is "conflicting vs non-conflicting services" determined?

**Details Needed**:
- Is there a predefined conflict matrix (e.g., Audit + Advisory = conflict)?
- Or is it case-by-case assessment?
- Can the system automatically detect service conflicts, or is it always manual review?
- Are there industry-specific conflict rules?

**Impact**: Affects automated conflict detection and Compliance review process.

---

## Category 8: Data Segregation & Access

### Q18: Team Member Access to Same Client
**Question**: If multiple team members serve the same client with different services, how is data segregation maintained?

**Details Needed**:
- Can team members see each other's requests if they're in the same "team"?
- How is "team" defined (same department, same director, manually assigned)?
- What if two different directors' teams serve the same client?
- Can Compliance see all requests for same client regardless of requester?

**Impact**: Affects data segregation logic and Requester/Compliance journeys.

---

### Q19: Commercial/Pricing Data Segregation
**Question**: Compliance is blocked from viewing commercials/pricing. Where is this data stored and who can access it?

**Details Needed**:
- Is pricing/commercial data a separate field in the request?
- Who can view it (Requester, Partner, Finance, Admin, Super Admin)?
- Is pricing data required for COI request, or optional?
- How is pricing data used in the workflow?

**Impact**: Affects data model, field configuration, and role-based access.

---

## Category 9: System Integration

### Q20: PRMS Project Creation Authorization
**Question**: When Engagement Code is sent to PRMS, what exactly happens in PRMS?

**Details Needed**:
- Does PRMS automatically create a project, or does Project Manager still need to initiate?
- What data is sent from COI to PRMS (just code, or also client/service details)?
- Can PRMS query COI system for additional details using Engagement Code?
- What happens if PRMS project creation fails after COI authorization?

**Impact**: Affects PRMS integration and Project Manager journey.

---

### Q21: Engagement Code Validation in PRMS
**Question**: How does PRMS validate Engagement Code against COI authorization table?

**Details Needed**:
- Is there a real-time API call from PRMS to COI?
- Or is there a shared database/view?
- What happens if COI system is down when PRMS tries to validate?
- Is there a cache/fallback mechanism?

**Impact**: Affects system integration architecture and reliability.

---

## Category 10: Workflow & Status Management

### Q22: Request Status Lifecycle
**Question**: What are all possible request statuses and state transitions?

**Details Needed**:
- Complete status list: Draft, Under Review, Compliance Review, Partner Review, Finance Coding, Admin Execution, Proposal Executed, Active, Rejected, Lapsed, Closed?
- Can status be changed backwards (e.g., from Partner Review back to Compliance)?
- Who can change status (role-based permissions)?
- Are there status change restrictions (e.g., cannot skip stages)?

**Impact**: Affects workflow engine design and all user journeys.

---

### Q23: Request Withdrawal
**Question**: Can a Requester withdraw a request after submission?

**Details Needed**:
- At what stages can request be withdrawn?
- Who can withdraw (only Requester, or also Admin/Super Admin)?
- What happens to withdrawn requests (deleted or archived)?
- Are there any restrictions on withdrawal (e.g., cannot withdraw if already approved)?

**Impact**: Affects Requester journey and request lifecycle.

---

### Q24: Request Reopening
**Question**: Can closed/rejected/lapsed requests be reopened?

**Details Needed**:
- Under what circumstances can requests be reopened?
- Who can reopen (Requester, Admin, Super Admin)?
- Is reopening a new request or continuation of old one?
- What information is preserved when reopening?

**Impact**: Affects request lifecycle and data management.

---

## Category 11: Reporting & Analytics

### Q25: Report Access Permissions
**Question**: Who can access which reports?

**Details Needed**:
- Can Requesters generate reports for their own requests only?
- Can Partners generate reports for all requests or only assigned ones?
- Can Compliance generate reports (with data segregation)?
- Are there role-based report restrictions?

**Impact**: Affects reporting system design and access control.

---

### Q26: Report Export Formats
**Question**: What export formats are required for reports?

**Details Needed**:
- PDF, Excel, CSV all required?
- Are there specific report templates/formats?
- Can users customize report content?
- Are reports printable directly from system?

**Impact**: Affects reporting functionality and user experience.

---

## Category 12: Field Configuration & Customization

### Q27: Field Configuration Permissions
**Question**: Who can modify field configurations?

**Details Needed**:
- Only Super Admin, or also other roles?
- Is there an approval process for field configuration changes?
- Can field configurations be tested before going live?
- Is there version control for field configurations?

**Impact**: Affects field configuration management and system flexibility.

---

### Q28: Conditional Field Logic Complexity
**Question**: How complex can conditional field logic be?

**Details Needed**:
- Simple show/hide based on one field, or complex multi-field conditions?
- Can conditions be nested (if A and B, then show C)?
- Are there limitations on conditional logic?
- Can users create custom conditions or only use predefined ones?

**Impact**: Affects field configuration system design and capabilities.

---

## Category 13: Audit & Compliance

### Q29: Audit Trail Requirements
**Question**: What level of audit trail detail is required?

**Details Needed**:
- Every field change, or only status changes?
- Who changed what and when?
- Are audit logs exportable?
- How long are audit logs retained?
- Are there compliance/regulatory requirements for audit trails?

**Impact**: Affects audit trail system design and data retention.

---

### Q30: Data Retention Policy
**Question**: How long is COI request data retained?

**Details Needed**:
- Are there regulatory retention requirements?
- Can data be archived vs deleted?
- Who can delete data (if ever)?
- Is there a data retention policy document?

**Impact**: Affects data management and system design.

---

## Next Steps

1. **Stakeholder Review**: Present these questions to stakeholders for answers
2. **Documentation Update**: Update user journeys based on answers
3. **Gap Resolution**: Resolve identified gaps in requirements
4. **Plan Refinement**: Update implementation plan based on clarifications

---

## Status Tracking

- [ ] Category 1: Client Management - Answered
- [ ] Category 2: Approval & Delegation - Answered
- [ ] Category 3: International Operations - Answered
- [ ] Category 4: Document Management - Answered
- [ ] Category 5: Notifications & Alerts - Answered
- [ ] Category 6: Renewal & Extension - Answered
- [ ] Category 7: Multiple Proposals - Answered
- [ ] Category 8: Data Segregation - Answered
- [ ] Category 9: System Integration - Answered
- [ ] Category 10: Workflow & Status - Answered
- [ ] Category 11: Reporting & Analytics - Answered
- [ ] Category 12: Field Configuration - Answered
- [ ] Category 13: Audit & Compliance - Answered

---

## Notes
- Questions should be answered by business stakeholders
- Technical questions may need input from IT/Development team
- Some questions may require clarification from Global COI team
- Answers should be documented and used to update user journeys and implementation plan


