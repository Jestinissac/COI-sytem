# Standard Edition End-to-End Test Checklist

## Test Scenarios

### Authentication & Routing
- [ ] User login with valid credentials
- [ ] Role-based routing after login
- [ ] Invalid credentials rejection
- [ ] Token expiration handling
- [ ] Logout functionality

### COI Request Creation
- [ ] Create new COI request
- [ ] Complete all 7 sections:
  - [ ] Section 1: Requestor Info
  - [ ] Section 2: Document Type
  - [ ] Section 3: Client Details
  - [ ] Section 4: Service Info
  - [ ] Section 5: Ownership
  - [ ] Section 6: Signatories
  - [ ] Section 7: International
- [ ] Form validation (required fields)
- [ ] Conditional field display (Parent Company, International Operations)
- [ ] Save as draft functionality
- [ ] Submit request

### Draft Management
- [ ] View draft requests
- [ ] Edit draft request
- [ ] Update draft and resave
- [ ] Submit draft after editing
- [ ] Cannot edit non-draft requests

### Director Approval Workflow
- [ ] Director sees team member requests
- [ ] Director approves request
- [ ] Director rejects request
- [ ] Director approves with restrictions
- [ ] Director requests more information
- [ ] Status transitions correctly
- [ ] Notes/comments saved

### Compliance Review
- [ ] Compliance sees all department requests
- [ ] Duplication detection works
- [ ] Duplication matches displayed
- [ ] Compliance approves request
- [ ] Compliance rejects request
- [ ] Compliance approves with restrictions
- [ ] Compliance requests more information
- [ ] No commercial data visible (data segregation)

### Partner Approval
- [ ] Partner sees all requests
- [ ] Partner approves request
- [ ] Partner rejects request
- [ ] Partner approves with restrictions
- [ ] Partner requests more information
- [ ] Full visibility (no data segregation)

### Finance Engagement Code Generation
- [ ] Finance sees approved requests
- [ ] Generate engagement code
- [ ] Code format: ENG-YYYY-SVC-#####
- [ ] Service type abbreviations correct
- [ ] Sequential numbering per service type
- [ ] Code validation (mock PRMS check)

### Admin Execution Tracking
- [ ] Admin sees execution queue
- [ ] Record proposal sent date
- [ ] Record client response
- [ ] Record engagement letter issued
- [ ] Track follow-up dates
- [ ] Monitor 30-day proposal expiry
- [ ] Alert generation (10, 20, 30 days)

### Status Transitions
- [ ] Draft → Pending Director Approval
- [ ] Pending Director Approval → Pending Compliance
- [ ] Pending Compliance → Pending Partner
- [ ] Pending Partner → Pending Finance
- [ ] Pending Finance → Active
- [ ] Rejection at any stage
- [ ] Status badges display correctly

### Data Segregation
- [ ] Requester sees only own requests
- [ ] Director sees own + team requests (same department)
- [ ] Compliance sees all departments (no commercial data)
- [ ] Partner sees all departments (full visibility)
- [ ] Finance sees all departments
- [ ] Admin sees all departments
- [ ] Super Admin sees everything

### Business Rules Execution
- [ ] Block action works (prevents submission)
- [ ] Flag action works (shows warning)
- [ ] Rules trigger on correct conditions
- [ ] Multiple rules can apply
- [ ] Rule priority handling

### Edge Cases
- [ ] Request rejection at Director stage
- [ ] Request rejection at Compliance stage
- [ ] Request rejection at Partner stage
- [ ] Approval with restrictions
- [ ] Need more info workflow
- [ ] Request with no director (direct submission)
- [ ] International operations flow
- [ ] PIE status handling

### Dashboard Functionality
- [ ] Requester dashboard loads
- [ ] Director dashboard loads
- [ ] Compliance dashboard loads
- [ ] Partner dashboard loads
- [ ] Finance dashboard loads
- [ ] Admin dashboard loads
- [ ] Super Admin dashboard loads
- [ ] Filters work correctly
- [ ] Search functionality
- [ ] Status breakdowns accurate

### Navigation
- [ ] View request detail page
- [ ] Back navigation works
- [ ] Breadcrumbs (if implemented)
- [ ] Route guards prevent unauthorized access

## Test Execution Notes

**Test Date**: _______________
**Tester**: _______________
**Environment**: Local / Development / Production

**Issues Found**:
- 

**Critical Bugs**:
- 

**Missing Features**:
- 

