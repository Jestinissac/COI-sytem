# COI Prototype - Test Checklist

## Testing Infrastructure Status

### ✅ Setup Complete
- [x] Vitest installed for backend
- [x] Vitest installed for frontend
- [x] Playwright installed for E2E
- [x] Test directories created
- [x] Sample tests created
- [x] Test fixtures created
- [x] Configuration files created
- [x] Test scripts added to package.json

---

## Backend Tests

### Authentication & Authorization
- [ ] User login with valid credentials
- [ ] User login with invalid credentials
- [ ] JWT token generation
- [ ] JWT token validation
- [ ] JWT token expiration
- [ ] Role-based access control
- [ ] Unauthorized access rejection

### COI Request Management
- [ ] Create new COI request
- [ ] Save COI request as draft
- [ ] Update existing draft
- [ ] Submit COI request for approval
- [ ] Delete COI request
- [ ] View COI request details
- [ ] List COI requests (with pagination)
- [ ] Filter COI requests by status
- [ ] Filter COI requests by department

### Approval Workflow
- [ ] Director approval
- [ ] Director approval with restrictions
- [ ] Director rejection
- [ ] Director "need more info"
- [ ] Compliance review
- [ ] Partner approval
- [ ] Finance code generation
- [ ] Admin execution
- [ ] Status transitions

### Duplication Detection
- [ ] Exact client name match
- [ ] Fuzzy client name matching (Levenshtein)
- [ ] Detect duplicate requests within 30 days
- [ ] Service conflict detection (Audit + Advisory)
- [ ] Service conflict detection (Audit + Accounting)
- [ ] PIE (Public Interest Entity) restrictions
- [ ] Flag allowed combinations (Audit + Tax)

### File Management
- [ ] Upload file (PDF)
- [ ] Upload file (DOCX)
- [ ] Upload file (XLSX)
- [ ] Upload file (Image)
- [ ] Reject invalid file type
- [ ] Reject file exceeding size limit (10MB)
- [ ] Download file
- [ ] Delete file
- [ ] List files for request
- [ ] File permission checks

### Engagement Code Service
- [ ] Generate engagement code
- [ ] Validate engagement code format
- [ ] Prevent duplicate codes
- [ ] Associate code with request

### Data Segregation
- [ ] Requester sees only own department
- [ ] Director sees team member requests
- [ ] Compliance sees all except commercial data
- [ ] Partner sees own department
- [ ] Finance sees all departments
- [ ] Admin sees all departments
- [ ] Super Admin sees everything

### Monitoring Service
- [ ] 30-day monitoring activation
- [ ] Monitoring status updates
- [ ] Monitoring completion

---

## Frontend Tests

### Components

#### UI Components
- [ ] StatusBadge renders correctly
- [ ] StatusBadge shows correct colors
- [ ] Toast notification displays
- [ ] Toast notification auto-dismisses
- [ ] ConfirmModal opens/closes
- [ ] ConfirmModal handles confirmation
- [ ] ConfirmModal handles cancellation

#### Form Components
- [ ] FileUpload accepts valid files
- [ ] FileUpload rejects invalid files
- [ ] FileUpload shows upload progress
- [ ] FileUpload displays file list
- [ ] FileUpload removes files

#### Wizard Components
- [ ] WizardProgress shows current step
- [ ] Step2Document renders correctly
- [ ] Step3Client validates input
- [ ] Step4Service handles service selection
- [ ] Step5Ownership validates data
- [ ] Step6Signatories manages list
- [ ] Step7International completes wizard

### Stores

#### Auth Store
- [ ] Initialize with null user/token
- [ ] Set user on login
- [ ] Set token on login
- [ ] Clear user/token on logout
- [ ] Persist to localStorage
- [ ] Restore from localStorage
- [ ] isAuthenticated computed property
- [ ] Role-based getters

#### COI Requests Store
- [ ] Fetch requests list
- [ ] Create new request
- [ ] Update existing request
- [ ] Delete request
- [ ] Filter by status
- [ ] Filter by department
- [ ] Handle API errors

#### Clients Store
- [ ] Fetch clients list
- [ ] Search clients
- [ ] Filter active clients
- [ ] Handle API errors

### Views

#### Login View
- [ ] Renders login form
- [ ] Validates email input
- [ ] Validates password input
- [ ] Shows error on invalid login
- [ ] Redirects on successful login
- [ ] Remembers redirect path

#### Dashboard Views
- [ ] RequesterDashboard shows requests
- [ ] DirectorDashboard shows pending approvals
- [ ] ComplianceDashboard shows reviews
- [ ] PartnerDashboard shows partner queue
- [ ] FinanceDashboard shows finance queue
- [ ] AdminDashboard shows all requests
- [ ] SuperAdminDashboard shows admin features

#### COI Request Form
- [ ] Multi-step wizard navigation
- [ ] Form validation on each step
- [ ] Save as draft functionality
- [ ] Submit request
- [ ] Handle validation errors
- [ ] Preserve data on navigation

#### COI Request Detail
- [ ] Display request details
- [ ] Show attachments
- [ ] Show approval history
- [ ] Director approval actions
- [ ] Compliance review actions
- [ ] Comments/notes display

---

## E2E Tests

### Authentication Flow
- [ ] Login page loads
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Session persistence after reload
- [ ] Logout functionality
- [ ] Redirect to login when unauthenticated
- [ ] Role-based dashboard routing

### COI Request Workflow (Requester)
- [ ] Create new COI request
- [ ] Navigate through wizard steps
- [ ] Upload documents
- [ ] Save as draft
- [ ] Edit existing draft
- [ ] Submit request
- [ ] View submitted request

### Approval Workflow (Director)
- [ ] View pending approvals
- [ ] Open request details
- [ ] Approve request
- [ ] Approve with restrictions
- [ ] Reject request
- [ ] Request more information
- [ ] Add comments

### Compliance Review Workflow
- [ ] View compliance review queue
- [ ] Review for duplicates
- [ ] Review service conflicts
- [ ] Flag PIE restrictions
- [ ] Complete review
- [ ] Add compliance notes

### Partner Approval Workflow
- [ ] View partner approval queue
- [ ] Review and approve
- [ ] Handle escalations

### Finance Code Generation
- [ ] Generate engagement code
- [ ] Verify code format
- [ ] Assign to request

### Admin Execution
- [ ] Execute approved requests
- [ ] Activate 30-day monitoring
- [ ] Mark as completed

### Data Segregation E2E
- [ ] Requester sees only department data
- [ ] Director sees team data
- [ ] Unauthorized access blocked
- [ ] Role-based navigation items

### File Management E2E
- [ ] Upload multiple files
- [ ] Download files
- [ ] Delete files
- [ ] View file list

---

## Performance Tests

### Backend Performance
- [ ] API response time < 200ms (simple queries)
- [ ] API response time < 500ms (complex queries)
- [ ] Database query optimization
- [ ] Concurrent request handling
- [ ] File upload performance

### Frontend Performance
- [ ] Page load time < 2s
- [ ] Component render time < 100ms
- [ ] Large list rendering (virtualization)
- [ ] Bundle size optimization

---

## Security Tests

### Authentication Security
- [ ] Password hashing (bcrypt)
- [ ] JWT secret security
- [ ] Token expiration enforcement
- [ ] Brute force protection

### Authorization Security
- [ ] Role-based access enforcement
- [ ] Department segregation enforcement
- [ ] Unauthorized endpoint access blocked
- [ ] CSRF protection (if applicable)

### Input Validation
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] File upload validation
- [ ] Input sanitization

### API Security
- [ ] CORS configuration
- [ ] Rate limiting (if applicable)
- [ ] Authentication on protected routes
- [ ] Secure headers

---

## Cross-Browser Tests (E2E)

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari/WebKit
- [ ] Edge (Chromium-based)

---

## Mobile Responsiveness

- [ ] Mobile viewport (375px)
- [ ] Tablet viewport (768px)
- [ ] Desktop viewport (1920px)
- [ ] Touch interactions
- [ ] Mobile navigation

---

## Accessibility Tests

- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] ARIA labels
- [ ] Focus management
- [ ] Color contrast
- [ ] Form labels

---

## Error Handling

### Backend Error Handling
- [ ] 400 Bad Request
- [ ] 401 Unauthorized
- [ ] 403 Forbidden
- [ ] 404 Not Found
- [ ] 500 Internal Server Error
- [ ] Database connection errors
- [ ] File system errors

### Frontend Error Handling
- [ ] API error display
- [ ] Network error handling
- [ ] Form validation errors
- [ ] File upload errors
- [ ] 404 page
- [ ] Error boundaries

---

## Integration Tests

- [ ] Frontend → Backend API communication
- [ ] Database transactions
- [ ] File upload end-to-end
- [ ] Email notifications (if implemented)
- [ ] PRMS integration (if implemented)

---

## Coverage Goals

### Current Coverage
- Backend: ___% (Target: 80%+)
- Frontend: ___% (Target: 70%+)
- E2E Critical Paths: ___% (Target: 100%)

### Critical Paths (Must be 100% covered)
- [ ] Login/Authentication
- [ ] COI Request Creation
- [ ] Director Approval
- [ ] Compliance Review
- [ ] Engagement Code Generation
- [ ] File Upload/Download

---

## Test Data Validation

- [ ] Test users exist in test database
- [ ] Test clients exist in test database
- [ ] Test COI requests exist
- [ ] Fixtures match schema
- [ ] Test data covers edge cases

---

## CI/CD Integration

- [ ] Tests run on commit
- [ ] Tests run on pull request
- [ ] Coverage reports generated
- [ ] Failed tests block deployment
- [ ] E2E tests in staging environment

---

## Documentation

- [x] TESTING_GUIDE.md created
- [x] TESTING_QUICK_START.md created
- [x] TEST_CHECKLIST.md created
- [ ] Inline test documentation
- [ ] Test naming conventions followed
- [ ] README updated with test info

---

## Notes

Use this checklist to track your testing progress. As you complete each test, mark it with [x].

**Priority Levels:**
- 🔴 Critical (Must have before production)
- 🟡 Important (Should have soon)
- 🟢 Nice to have (Can be added later)

Mark each item with a priority to help focus testing efforts.

---

**Last Updated**: 2026-01-07
