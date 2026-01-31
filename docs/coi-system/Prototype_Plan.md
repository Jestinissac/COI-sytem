# COI System - Prototype Development Plan

## Purpose of Prototype

### Primary Objective
Demonstrate that **no proposal or engagement letter can be issued or signed** without a full, documented, and approved COI review.

### Prototype Goals
1. **Validate Core Workflow**: Prove the mandatory sequential relationship (COI → PRMS)
2. **Demonstrate Governance**: Show multi-layered authorization works
3. **Test Integration**: Verify Engagement Code validation with PRMS
4. **User Experience**: Get stakeholder feedback on UI/UX
5. **Risk Mitigation**: Identify issues before full production build

### Success Criteria
- ✅ Database constraint prevents bypass (cannot create project without valid Engagement Code)
- ✅ Approval workflow enforced (Director → Compliance → Partner → Finance → Admin)
- ✅ Engagement Code generation and validation works
- ✅ Advanced duplication checks function (fuzzy matching + IESBA Red Lines)
- ✅ Users can complete end-to-end COI request flow
- ✅ Integration with PRMS (mock) validates Engagement Codes
- ✅ Business Rules Engine with 88 rules (Standard + Pro editions)
- ✅ IESBA Compliance Framework (Pro edition)
- ✅ Dynamic Form Builder (Pro edition)
- ✅ Change Management System (Pro edition)
- ✅ Testing Infrastructure (Playwright E2E tests)

---

## How to Build the Prototype

### Technology Stack

#### Frontend
- **Framework**: Vue 3 + TypeScript (matches PRMS sample dashboard)
- **UI Library**: Tailwind CSS (matches PRMS sample dashboard)
- **State Management**: Pinia
- **Routing**: Vue Router
- **Build Tool**: Vite
- **Charts**: Chart.js (if needed, matches PRMS sample dashboard)

#### Backend (Prototype)
- **API**: Node.js + Express ✅ **IMPLEMENTED**
- **Database**: SQLite (prototype) ✅ **IMPLEMENTED** with dynamic schema evolution
- **Authentication**: JWT-based ✅ **IMPLEMENTED** with role-based access control
- **Services**: Business Rules Engine, Duplication Check, Engagement Code Service ✅ **IMPLEMENTED**

#### Integration
- **PRMS**: Mock API (simulate PRMS responses)
- **HRMS**: Mock API (simulate HRMS responses)
- **Email**: Mock email service (log to console/file)

### Project Structure

```
coi-prototype/
├── frontend/
│   ├── src/
│   │   ├── views/
│   │   │   ├── LandingPage.vue          # Multi-system landing page
│   │   │   ├── RequesterDashboard.vue   # Requester view
│   │   │   ├── ComplianceDashboard.vue  # Compliance view
│   │   │   ├── PartnerDashboard.vue     # Partner view
│   │   │   ├── FinanceDashboard.vue     # Finance view
│   │   │   ├── AdminDashboard.vue       # Admin view
│   │   │   └── COIRequestForm.vue       # Request creation form
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── TopBar.vue
│   │   │   │   ├── Sidebar.vue
│   │   │   │   └── SystemTiles.vue      # HRMS, PRMS, COI tiles
│   │   │   ├── forms/
│   │   │   │   ├── ClientSelector.vue
│   │   │   │   ├── ServiceInfoForm.vue
│   │   │   │   ├── OwnershipForm.vue
│   │   │   │   └── SignatoryForm.vue
│   │   │   └── ui/
│   │   │       ├── Card.vue
│   │   │       ├── StatusBadge.vue
│   │   │       └── ApprovalButton.vue
│   │   ├── services/
│   │   │   ├── api.ts                   # API client
│   │   │   ├── prmsMock.ts             # Mock PRMS API
│   │   │   └── hrmsMock.ts             # Mock HRMS API
│   │   ├── stores/
│   │   │   ├── auth.ts                 # Authentication store
│   │   │   ├── coiRequests.ts          # COI requests store
│   │   │   └── clients.ts              # Client data store
│   │   └── router/
│   │       └── index.ts                # Route definitions
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── coi.routes.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── integration.routes.ts
│   │   ├── controllers/
│   │   │   ├── coiController.ts
│   │   │   └── validationController.ts
│   │   ├── services/
│   │   │   ├── engagementCodeService.ts
│   │   │   ├── duplicationCheckService.ts
│   │   │   └── notificationService.ts
│   │   ├── models/
│   │   │   └── coiRequest.ts
│   │   └── database/
│   │       ├── schema.sql
│   │       └── migrations/
│   └── package.json
└── README.md
```

### Database Schema (Prototype)

```sql
-- Core Tables
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('Requester', 'Director', 'Compliance', 'Partner', 'Finance', 'Admin', 'Super Admin') NOT NULL,
    department VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_code VARCHAR(50) UNIQUE,
    client_name VARCHAR(255) NOT NULL,
    commercial_registration VARCHAR(100),
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coi_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER NOT NULL,
    requester_id INTEGER NOT NULL,
    service_description TEXT NOT NULL,
    service_type VARCHAR(50),
    status ENUM('Draft', 'Pending Director Approval', 'Pending Compliance', 'Pending Partner', 'Pending Finance', 'Approved', 'Rejected', 'Lapsed') DEFAULT 'Draft',
    director_approval_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    director_approval_date DATETIME,
    director_approval_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (requester_id) REFERENCES users(id)
);

CREATE TABLE coi_engagement_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    engagement_code VARCHAR(50) UNIQUE NOT NULL,
    coi_request_id INTEGER NOT NULL,
    status ENUM('Active', 'Inactive', 'Expired') DEFAULT 'Active',
    generated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    generated_by INTEGER,
    FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id)
);

-- Mock PRMS projects table (for validation)
CREATE TABLE prms_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id VARCHAR(50) UNIQUE,
    engagement_code VARCHAR(50) NOT NULL,
    client_code VARCHAR(50) NOT NULL,
    status VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (engagement_code) REFERENCES coi_engagement_codes(engagement_code)
);

-- Add constraint to prevent bypass
-- This is the CRITICAL fix from risk analysis
ALTER TABLE prms_projects
ADD CONSTRAINT fk_engagement_code
FOREIGN KEY (engagement_code)
REFERENCES coi_engagement_codes(engagement_code);

ALTER TABLE prms_projects
ADD CONSTRAINT chk_engagement_code_active
CHECK (
    EXISTS (
        SELECT 1 FROM coi_engagement_codes
        WHERE engagement_code = prms_projects.engagement_code
        AND status = 'Active'
    )
);
```

### Build Phases

#### Phase 1: Foundation (Week 1) ✅ **COMPLETE**
1. **Setup Project Structure** ✅ **COMPLETE**
   - ✅ Vue 3 + TypeScript project initialized
   - ✅ Tailwind CSS configured (BDO-inspired design)
   - ✅ Vue Router configured with role-based routes
   - ✅ Pinia stores setup (auth, coiRequests, clients)

2. **Database Setup** ✅ **COMPLETE**
   - ✅ SQLite database created with dynamic schema evolution
   - ✅ Schema migrations with foreign key constraints
   - ✅ Complete data seeding: 50 users, 100 clients, 200 projects, 22+ COI requests
   - ✅ Fuzzy matching test cases included

3. **Authentication** ✅ **COMPLETE**
   - ✅ JWT-based authentication
   - ✅ Role-based access control (7 roles)
   - ✅ Session management with token persistence
   - ✅ Login page with demo user quick-fill

4. **Multi-System Landing Page** ✅ **COMPLETE**
   - ✅ System tiles (HRMS, PRMS, COI)
   - ✅ Permission-based display
   - ✅ Navigation to COI system

#### Phase 2: Core COI Workflow (Week 2) ✅ **COMPLETE**
1. **Request Creation** ✅ **COMPLETE**
   - ✅ 7-section dynamic form (Requestor, Document, Client, Service, Ownership, Signatories, International)
   - ✅ Client selection from PRMS mock
   - ✅ Service information with service types
   - ✅ Ownership structure with PIE status
   - ✅ Signatory details
   - ✅ Draft saving and editing
   - ✅ Form validation

2. **Director Approval** ✅ **COMPLETE**
   - ✅ Approval workflow with status transitions
   - ✅ Director approval documents upload
   - ✅ Approval notes and restrictions
   - ✅ Notification system (mock)

3. **Compliance Review** ✅ **COMPLETE**
   - ✅ Review interface with duplication alerts
   - ✅ Approval/Rejection actions
   - ✅ Advanced duplication check (fuzzy matching with Levenshtein distance)
   - ✅ Match scoring (75-89% flag, 90%+ block)
   - ✅ IESBA Red Lines detection (Pro edition)
   - ✅ IESBA Decision Matrix (Pro edition)

4. **Partner Approval** ✅ **COMPLETE**
   - ✅ Partner dashboard with approval queue
   - ✅ Approval workflow
   - ✅ Full request visibility

5. **Finance Coding** ✅ **COMPLETE**
   - ✅ Engagement Code generation (ENG-YYYY-SVC-#####)
   - ✅ Financial parameters entry
   - ✅ Code validation

#### Phase 3: Integration & Validation (Week 3) ✅ **COMPLETE**
1. **Engagement Code Validation** ✅ **COMPLETE**
   - ✅ Database constraints (CRITICAL - foreign key constraints)
   - ✅ PRMS mock API validation
   - ✅ Error handling with graceful fallbacks

2. **PRMS Integration (Mock)** ✅ **COMPLETE**
   - ✅ Client Master data fetch
   - ✅ Engagement Code validation endpoint
   - ✅ Project creation simulation

3. **30-Day Monitoring** ⚠️ **PARTIAL**
   - ✅ Monitoring service structure exists
   - ✅ Automatic lapse functionality (30-day proposals)
   - ⚠️ Cron job needs verification/testing

4. **Basic Dashboards** ✅ **COMPLETE**
   - ✅ All 7 role-based dashboards (Requester, Director, Compliance, Partner, Finance, Admin, Super Admin)
   - ✅ Request tracking with filters
   - ✅ Status overview with counts
   - ✅ Data segregation by role

#### Phase 4: Polish & Testing (Week 4) ✅ **COMPLETE + ENHANCED**
1. **UI/UX Refinement** ✅ **COMPLETE**
   - ✅ BDO-inspired design system (blue/red theme)
   - ✅ Responsive design (mobile-friendly)
   - ✅ Error handling UI with user-friendly messages
   - ✅ Modern card-based layouts
   - ✅ Professional typography

2. **Testing** ✅ **COMPLETE + ENHANCED**
   - ✅ Playwright E2E test suite (31 tests)
   - ✅ Custom API test scripts
   - ✅ Critical bug fixes verified
   - ✅ Test documentation (PLAYWRIGHT_TEST_FIXES.md)

3. **Documentation** ✅ **COMPLETE**
   - ✅ Multiple status documents (EDITION_PLANNED_VS_BUILT.md, COMPREHENSIVE_BUILD_REVIEW.md)
   - ✅ API documentation (in code)
   - ✅ Architecture fixes documentation
   - ✅ Test results documentation

---

## UI Design Decisions

### Option 1: Match PRMS UI
**Approach**: Use same design system as PRMS sample dashboard

**Pros**:
- ✅ Consistent user experience across systems
- ✅ Users familiar with existing UI patterns
- ✅ Faster development (reuse components)
- ✅ Professional, cohesive look

**Cons**:
- ⚠️ Need to analyze PRMS UI patterns
- ⚠️ May need to adapt some components

### Option 2: Crawl PRMS App
**Approach**: Analyze PRMS application to extract UI patterns

**Pros**:
- ✅ Exact match with production PRMS
- ✅ Users see familiar interface

**Cons**:
- ❌ Time-consuming
- ❌ May not be necessary if PRMS sample dashboard is representative
- ❌ Production PRMS may have different tech stack

### Option 3: Create New Design ✅ **SELECTED**
**Approach**: Design new UI from scratch

**Pros**:
- ✅ Modern, fresh design
- ✅ Optimized for COI workflow
- ✅ Can use latest UI/UX best practices
- ✅ Tailored to COI-specific needs

**Cons**:
- ⚠️ More design work required
- ⚠️ Users need to learn new patterns
- ⚠️ Inconsistent with existing systems (acceptable for prototype)

### Decision: **Option 3 - Create New Design**

**Rationale**:
1. Prototype allows for new design exploration
2. Can optimize UI specifically for COI workflow
3. Modern design can improve user experience
4. Can establish new design system for future

**Action Plan**:
1. Design modern, clean UI using Tailwind CSS
2. Focus on COI workflow optimization
3. Use Vue 3 + TypeScript (same tech stack)
4. Create reusable component library
5. Apply consistent design tokens (colors, spacing, typography)
6. Ensure responsive design

---

## PRMS Integration Approach

### Option 1: Crawl PRMS App
**What it means**: Programmatically analyze PRMS application to extract:
- UI components
- API endpoints
- Data structures
- Authentication flow

**For Prototype**: ❌ **Not needed** ✅ **SELECTED: NO CRAWL**
- Use mock APIs
- Focus on workflow, not exact integration
- Faster development

**When to Use (Production)**:
- Need exact API contracts
- Need to match production UI exactly
- Integration testing with real system

### Option 2: Mock PRMS API ✅ **SELECTED**
**What it means**: Create mock API that simulates PRMS responses

**Implementation**:
```typescript
// services/prmsMock.ts
export const prmsMockApi = {
  // Get clients from PRMS Client Master
  async getClients() {
    return [
      { client_code: 'CLI-001', client_name: 'ABC Corp', status: 'Active' },
      { client_code: 'CLI-002', client_name: 'XYZ Ltd', status: 'Active' },
      // ... more mock data
    ];
  },

  // Validate Engagement Code
  async validateEngagementCode(code: string) {
    // Check if code exists and is Active in COI database
    const isValid = await checkEngagementCodeInDB(code);
    return { valid: isValid, code };
  },

  // Create project (simulated)
  async createProject(engagementCode: string, clientCode: string) {
    // This will fail if Engagement Code doesn't exist or isn't Active
    // (enforced by database constraint)
    try {
      await db.insert('prms_projects', {
        engagement_code: engagementCode,
        client_code: clientCode,
        // ... other fields
      });
      return { success: true, project_id: 'PROJ-001' };
    } catch (error) {
      // Database constraint will prevent invalid codes
      return { success: false, error: 'Invalid Engagement Code' };
    }
  }
};
```

**Pros**:
- ✅ Fast development
- ✅ No dependency on PRMS system
- ✅ Can test all scenarios
- ✅ Demonstrates integration concept

**Cons**:
- ⚠️ Not real integration
- ⚠️ May miss edge cases

**For Prototype**: ✅ **SELECTED - Use Mock APIs**

### Option 3: Real PRMS API (For Production)
**What it means**: Integrate with actual PRMS API

**Implementation**:
- REST API calls to PRMS
- Authentication/authorization
- Error handling
- Retry logic (Phase 2)

**For Prototype**: ❌ **Not needed**

---

## Decision: PRMS Crawling ✅ **CONFIRMED: NO CRAWL**

### Question: Do we need to crawl PRMS app?

**Answer: NO, not for prototype** ✅ **CONFIRMED**

**Reasoning**:
1. **Prototype Goal**: Demonstrate workflow, not exact integration
2. **Mock APIs**: Sufficient to show integration concept
3. **Time**: Crawling adds complexity without prototype value
4. **Focus**: Core purpose fulfillment, faster delivery
5. **Faster Timeline**: No crawling = faster development

### For Prototype: Use Mock APIs ✅
- Simulate PRMS Client Master API
- Simulate Engagement Code validation
- Simulate project creation
- Database constraints enforce real validation

### When to Crawl PRMS (Production Only)
- Need exact API contracts
- Need to match production UI exactly
- Need to understand production data structures
- Integration testing with real system

---

## Critical Implementation Requirements

### Phase 1 Fixes (Must Have - 20 minutes)

1. **Database Foreign Key Constraint**
   ```sql
   ALTER TABLE prms_projects
   ADD CONSTRAINT fk_engagement_code
   FOREIGN KEY (engagement_code)
   REFERENCES coi_engagement_codes(engagement_code);
   ```

2. **Active Status Check**
   ```sql
   ALTER TABLE prms_projects
   ADD CONSTRAINT chk_engagement_code_active
   CHECK (
     EXISTS (
       SELECT 1 FROM coi_engagement_codes
       WHERE engagement_code = prms_projects.engagement_code
       AND status = 'Active'
     )
   );
   ```

3. **Server-Side Approval Check**
   ```typescript
   if (requester.role !== 'Director' && !request.director_approval) {
     throw new Error('Director approval required');
   }
   ```

4. **Basic Error Logging**
   ```typescript
   try {
     await sendNotification();
   } catch (error) {
     logger.error('Notification failed', error);
   }
   ```

---

## Prototype Deliverables

### Code
- ✅ Working COI system (frontend + backend)
- ✅ Database with constraints
- ✅ Mock PRMS/HRMS APIs
- ✅ End-to-end workflow

### Documentation
- ✅ User guide
- ✅ API documentation
- ✅ Database schema
- ✅ Deployment guide

### Demo
- ✅ Live prototype
- ✅ Demo scenarios
- ✅ Stakeholder presentation

---

## Timeline ✅ **FASTER DELIVERY**

### Accelerated Timeline (Prioritize Core Features)

**Week 1**: Foundation + Core Workflow
- Day 1-2: Project setup + Database
- Day 3-4: Authentication + Landing Page
- Day 5: Request creation form (basic)

**Week 2**: Core Workflow + Integration
- Day 1-2: Approval workflows (Director, Compliance, Partner)
- Day 3: Finance coding + Engagement Code generation
- Day 4: Database constraints (CRITICAL)
- Day 5: PRMS mock integration + Validation

**Week 2.5**: Essential Features
- Day 1: Basic dashboards (role-based)
- Day 2: 30-day monitoring (simple cron)
- Day 3: Testing + Bug fixes

**Total**: ~2.5 weeks for working prototype (core features only)

### Prioritized Features (Must Have)
1. ✅ Multi-system landing page
2. ✅ COI request creation
3. ✅ Approval workflows (all roles)
4. ✅ Engagement Code generation
5. ✅ Database constraints (prevents bypass)
6. ✅ PRMS validation (mock)
7. ✅ Basic dashboards

### Deferred Features (Can Skip for Prototype)
- ~~❌ Advanced fuzzy matching (basic is enough)~~ ✅ **IMPLEMENTED** - Advanced fuzzy matching with IESBA enhancements
- ~~❌ Complex audit logging (basic is enough)~~ ✅ **IMPLEMENTED** - Comprehensive audit trail
- ⚠️ Enhanced notifications (basic is enough) - **Mock notifications implemented**
- ✅ ISQM digital forms (PDF upload is enough) - **File upload system implemented**
- ✅ Advanced reporting (basic dashboards are enough) - **All dashboards implemented**

---

## Next Steps

1. ✅ Review this plan
2. ⏳ Decide on UI approach (Option 1 recommended)
3. ⏳ Setup project structure
4. ⏳ Create database schema
5. ⏳ Start Phase 1 development

---

## Decisions Made ✅

1. **UI Approach**: ✅ **Option 3 - Create New Design** - **IMPLEMENTED**
2. **PRMS Crawling**: ✅ **NO - Use Mock APIs** - **IMPLEMENTED**
3. **Timeline**: ✅ **Faster - 2.5 weeks (prioritize core features)** - **COMPLETED**
4. **Post-Prototype Handoff**: ✅ **Technical team (SQL Server procedures) + Frontend team (Vue.js)**
5. **Environment**: ✅ **Cloud** - **READY FOR DEPLOYMENT**
6. **Design System**: ✅ **BDO-inspired (blue/red theme, modern, professional)** - **IMPLEMENTED**
7. **Data Requirements**: ✅ **50 employees, 100 clients, 200 active projects, 22+ COI requests** - **SEEDED**
8. **Edition Model**: ✅ **Standard + Pro Editions** - **IMPLEMENTED**
9. **Rules Engine**: ✅ **88 rules with IESBA compliance** - **IMPLEMENTED**
10. **Testing**: ✅ **Playwright E2E test suite** - **IMPLEMENTED**

---

## Post-Prototype Handoff Plan

### After Prototype Success

**Prototype Purpose**: Validate workflow, get stakeholder approval, demonstrate core purpose

**Production Handoff**:
1. **Backend Team (Technical Team)**:
   - Build SQL Server Enterprise Edition procedures
   - Implement production database schema
   - Create stored procedures for:
     - Engagement Code generation
     - Duplication checks
     - Validation logic
     - Audit logging
   - API development (RESTful services)
   - Integration with real PRMS/HRMS systems

2. **Frontend Team**:
   - Build production Vue.js application
   - Use prototype as reference for:
     - UI/UX patterns
     - Component structure
     - User workflows
     - Integration points
   - Implement production-ready features
   - Performance optimization
   - Security hardening

**Prototype Deliverables for Handoff**:
- ✅ Working prototype (frontend + backend)
- ✅ Database schema (SQLite → SQL Server conversion guide)
- ✅ API documentation
- ✅ UI/UX mockups and patterns
- ✅ User journey documentation
- ✅ Integration specifications
- ✅ Test scenarios and results

---

## Environment: Cloud ✅

### Cloud Deployment (Prototype)

**Recommended Platforms**:
- **Frontend**: Vercel, Netlify, or AWS Amplify
- **Backend**: AWS Lambda, Azure Functions, or Railway
- **Database**: Cloud SQL (PostgreSQL) or AWS RDS
- **Storage**: Cloud storage for documents (AWS S3, Azure Blob)

**Benefits**:
- ✅ Accessible to stakeholders
- ✅ No local setup required
- ✅ Easy to demo
- ✅ Can share URL for testing

**Production Considerations**:
- SQL Server Enterprise Edition (on-premise or cloud)
- Proper security and authentication
- Scalability planning
- Backup and disaster recovery

---

## Design System: BDO-Inspired ✅

### Design Inspiration from BDO Website

**Color Palette** (Inspired, not exact):
- **Primary Blue**: `#0066CC` or `#0052CC` (professional, trustworthy)
- **Accent Red**: `#CC0000` or `#DC143C` (energy, attention)
- **Neutral Grays**: `#F5F5F5`, `#E0E0E0`, `#666666`, `#333333`
- **Success Green**: `#28A745`
- **Warning Orange**: `#FFC107`
- **Error Red**: `#DC3545`

**Design Principles** (Based on BDO):
- ✅ Clean, modern, professional
- ✅ Clear typography hierarchy
- ✅ Generous white space
- ✅ Subtle gradients for banners/sections
- ✅ Card-based layouts
- ✅ Clear call-to-action buttons
- ✅ Responsive design

**Tailwind Configuration**:
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6F2FF',
          100: '#CCE5FF',
          500: '#0066CC',  // Primary blue
          600: '#0052CC',
          700: '#003D99',
        },
        accent: {
          500: '#CC0000',  // Accent red
          600: '#990000',
        },
        // ... other colors
      }
    }
  }
}
```

**UI Components Style**:
- Modern, clean cards with subtle shadows
- Blue primary buttons, red for critical actions
- Professional typography (Inter, Roboto, or similar)
- Consistent spacing and padding
- Clear visual hierarchy

---

## Data Requirements & Seeding Strategy ✅

### Mock Data Requirements

#### 1. Employees (50 employees)
**Distribution**:
- 5 Directors
- 8 Compliance Officers
- 10 Partners
- 5 Finance Team members
- 5 Admin team members
- 17 Requesters (Directors + Team Members)

**Data Fields**:
- Employee ID, Name, Email
- Role, Department
- Manager/Director assignment
- User groups (for permissions)

**Example**:
```json
{
  "id": 1,
  "name": "John Smith",
  "email": "john.smith@company.com",
  "role": "Director",
  "department": "Audit",
  "director_id": null
}
```

#### 2. Clients (100 clients)
**Distribution**:
- 70 Active clients
- 20 Inactive clients
- 10 Potential clients

**Data Fields**:
- Client Code, Client Name
- Commercial Registration
- Status (Active/Inactive/Potential)
- Industry, Nature of Business
- Parent Company (for some clients)

**Examples for Fuzzy Matching**:
- "ABC Corporation" vs "ABC Corp" vs "ABC Corp Ltd"
- "XYZ Industries" vs "XYZ Industry" vs "XYZ Industries LLC"
- "Global Tech Solutions" vs "Global Technology Solutions"
- Similar names to test duplication detection

#### 3. Active Projects (200 projects)
**Distribution**:
- Various service types (Assurance, Advisory, Tax, Accounting)
- Different statuses (Active, Completed, On Hold)
- Linked to clients and Engagement Codes
- Various service years

**Purpose**: 
- Show existing engagements in system
- Test duplication checks
- Demonstrate PRMS integration

#### 4. Pending COI Requests (20 requests)
**Distribution**:
- 10 at Proposal Stage (various approval stages)
- 10 at Engagement Stage (awaiting client approval)

**Stages**:
- 3 Draft
- 2 Pending Director Approval
- 2 Pending Compliance Review
- 2 Pending Partner Approval
- 1 Pending Finance Coding
- 5 Approved (awaiting client response)
- 5 Active Engagements

**Purpose**:
- Show workflow in action
- Demonstrate different statuses
- Test approval workflows
- Show 30-day monitoring

---

## Fuzzy Matching Examples for Compliance Team

### How Scores Are Calculated

**Algorithm**: Levenshtein Distance with abbreviation normalization

**Process**:
1. **Normalize** strings (lowercase, trim, remove punctuation)
2. **Normalize abbreviations** (Corp → Corporation, Ltd → Limited, Inc → Incorporated, LLC → Limited Liability Company)
3. **Check exact match** → 100% score
4. **Check core name match** (after removing suffixes) → 85% score
5. **Calculate Levenshtein distance** → Similarity percentage
6. **Apply thresholds**:
   - 90-100%: High confidence (Block)
   - 75-89%: Medium confidence (Flag)
   - <75%: Low confidence (No action)

**Detailed Algorithm**: See `Fuzzy_Matching_Algorithm_Details.md`

### Scenario Planning

#### Example 1: Exact Match (High Confidence)
**New Request**: "ABC Corporation"
**Existing Engagement**: "ABC Corporation"
**Match Score**: 100%
**Calculation**: Exact string match after normalization
**Action**: Block submission, require justification

#### Example 2: Abbreviation Match (High Confidence)
**New Request**: "ABC Corp"
**Existing Engagement**: "ABC Corporation"
**Match Score**: 85%
**Calculation**: 
- Normalize: "ABC Corp" → "ABC Corporation"
- Core name: "ABC" = "ABC" ✓
- Score: 85% (abbreviation match, core name identical)
**Action**: Flag for review, show existing engagement details

#### Example 3: Full Abbreviation Match
**New Request**: "XYZ Industries LLC"
**Existing Engagement**: "XYZ Industries Limited Liability Company"
**Match Score**: 90%
**Calculation**:
- Normalize: "LLC" → "Limited Liability Company"
- After normalization: Both identical
- Score: 90% (full abbreviation expansion)
**Action**: Flag for review, show similarity

#### Example 4: Parent/Subsidiary Relationship
**New Request**: "ABC Subsidiary Inc"
**Existing Engagement**: "ABC Corporation" (parent)
**Match Score**: 70%
**Calculation**:
- Core name: "ABC Subsidiary" vs "ABC" (similar but not identical)
- Levenshtein similarity: ~70%
- Plus parent relationship flag
- Score: 70% + relationship context
**Action**: Flag for review, show parent relationship

#### Example 5: Similar Name (Different Entity)
**New Request**: "New ABC Ltd"
**Existing Engagement**: "ABC Ltd"
**Match Score**: 75%
**Calculation**:
- Core name: "New ABC" vs "ABC" (different - "New" prefix)
- Levenshtein distance: 4 characters
- Similarity: ((15 - 4) / 15) × 100 = 73% → rounded to 75%
**Action**: Flag for review, but allow manual override (different entities)

### Implementation for Prototype

```typescript
// services/duplicationCheckService.ts
interface DuplicationResult {
  matchScore: number;
  existingEngagement: Engagement;
  reason: string;
  action: 'block' | 'flag' | 'allow';
}

function checkDuplication(clientName: string): DuplicationResult[] {
  const existing = getAllActiveEngagements();
  const matches = [];
  
  for (const engagement of existing) {
    const score = fuzzyMatch(clientName, engagement.clientName);
    
    if (score >= 90) {
      matches.push({
        matchScore: score,
        existingEngagement: engagement,
        reason: 'Exact or very close match',
        action: 'block'
      });
    } else if (score >= 75) {
      matches.push({
        matchScore: score,
        existingEngagement: engagement,
        reason: 'Similar name detected',
        action: 'flag'
      });
    }
  }
  
  return matches;
}
```

### Compliance Dashboard View

**What Compliance Team Sees**:
1. **Pending Reviews** (with duplication flags)
   - Request details
   - Duplication matches (if any)
   - Match scores and reasons
   - Existing engagement details
   - Action buttons (Approve/Reject/Request Info)

2. **Duplication Alerts**
   - High confidence matches (blocked)
   - Medium confidence matches (flagged)
   - Parent/subsidiary relationships

3. **Review History**
   - Previously reviewed requests
   - Justifications provided
   - Approval/rejection reasons

---

## Stakeholder-Specific Data & Views

### 1. Requester (Director/Team Member)

**What They See**:
- **My Requests Dashboard**:
  - Total requests: 5-8 requests per requester
  - Status breakdown (Draft, Pending, Approved, Rejected)
  - Recent activity
  - Pending approvals needed

- **Client Selection**:
  - Dropdown with 100 clients
  - Search/filter functionality
  - "Request New Client" option
  - Recent clients used

- **Request Creation**:
  - Form with all COI Template fields
  - Dynamic fields based on selections
  - Save as draft capability
  - Validation feedback

**Data Needed**:
- 5-8 COI requests per requester (mix of statuses)
- Access to all 100 clients for selection
- Service type options
- Employee list for signatories

---

### 2. Compliance Officer

**What They See**:
- **Pending Reviews Dashboard**:
  - 5-7 requests pending review
  - Duplication alerts (with match scores)
  - High-priority items (conflicts detected)
  - Request details and history

- **Duplication Detection**:
  - Fuzzy matching results
  - Match scores and reasons
  - Existing engagement details
  - Parent/subsidiary relationships

- **Review Actions**:
  - Approve/Reject/Request Info buttons
  - Justification field (for overrides)
  - Global clearance status tracking

**Data Needed**:
- 5-7 requests in "Pending Compliance" status
- Duplication matches for each (with scores)
- Existing engagements for comparison
- Global clearance statuses

**Fuzzy Matching Examples**:
- Request 1: "ABC Corp" → Match: "ABC Corporation" (85% score)
- Request 2: "XYZ Industries" → Match: "XYZ Industry LLC" (80% score)
- Request 3: "Global Tech" → Match: "Global Technology Solutions" (75% score)
- Request 4: "New Client Ltd" → No match (different entity)

---

### 3. Partner

**What They See**:
- **Partner Dashboard**:
  - All active/past proposals
  - COI decisions
  - Engagement Letters
  - Engagement Codes
  - Group-level services
  - Red flags (conflicts, restrictions)
  - Expiry/renewal alerts

- **Approval Queue**:
  - 3-5 requests pending partner approval
  - Compliance review summary
  - Request details
  - Approval/Reject actions

**Data Needed**:
- 3-5 requests in "Pending Partner" status
- All approved requests (for tracking)
- Engagement codes generated
- Renewal alerts (if any approaching)

---

### 4. Finance Team

**What They See**:
- **Finance Coding Dashboard**:
  - 2-3 requests pending finance coding
  - Financial parameters entry
  - Engagement Code generation
  - Code history

- **Financial Assessment**:
  - Credit terms
  - Currency
  - Risk assessment
  - Pending amounts (if any)

**Data Needed**:
- 2-3 requests in "Pending Finance" status
- Financial parameters to enter
- Engagement code sequence numbers
- Client financial history (mock)

---

### 5. Admin Team

**What They See**:
- **Admin Dashboard**:
  - 5-7 requests in execution phase
  - Proposal execution tracking
  - Engagement letter preparation
  - 30-day monitoring alerts
  - ISQM forms management

- **Execution Tracking**:
  - Proposal sent dates
  - Client response tracking
  - Engagement letter issuance
  - Status updates

**Data Needed**:
- 5-7 requests in "Approved" or "Active" status
- Execution dates
  - Some approaching 30-day limit (for alerts)
- ISQM forms (some completed, some pending)

---

### 6. Super Admin

**What They See**:
- **System Overview**:
  - All requests (all statuses)
  - System statistics
  - User management
  - Configuration settings
  - Audit logs

**Data Needed**:
- All 20 pending COI requests
- All 200 active projects
- All 100 clients
- All 50 employees
- System statistics

---

## Data Seeding Script

### Structure

```typescript
// scripts/seedData.ts
interface SeedData {
  employees: Employee[];
  clients: Client[];
  projects: Project[];
  coiRequests: COIRequest[];
}

const seedData: SeedData = {
  employees: [
    // 50 employees with various roles
    { id: 1, name: "John Smith", role: "Director", ... },
    { id: 2, name: "Jane Doe", role: "Compliance", ... },
    // ... 48 more
  ],
  
  clients: [
    // 100 clients with various statuses
    { id: 1, client_code: "CLI-001", client_name: "ABC Corporation", ... },
    { id: 2, client_code: "CLI-002", client_name: "ABC Corp", ... }, // Similar name for fuzzy matching
    // ... 98 more
  ],
  
  projects: [
    // 200 active projects
    { id: 1, project_id: "PROJ-001", engagement_code: "ENG-2024-TAX-001", ... },
    // ... 199 more
  ],
  
  coiRequests: [
    // 20 pending COI requests at various stages
    { id: 1, request_id: "COI-2025-001", status: "Pending Compliance", ... },
    // ... 19 more
  ]
};
```

### Fuzzy Matching Test Cases

**Included in Seed Data**:
1. "ABC Corporation" (existing) vs "ABC Corp" (new request)
2. "XYZ Industries" (existing) vs "XYZ Industry LLC" (new request)
3. "Global Tech Solutions" (existing) vs "Global Technology Solutions" (new request)
4. Parent: "ABC Corp" (existing) vs Subsidiary: "ABC Subsidiary Inc" (new request)
5. "New Client Ltd" (new) - no match (different entity)

---

## Stakeholder Demo Scenarios

### Scenario 1: Requester Creates New Request
1. Requester logs in
2. Sees "My Requests" dashboard (5-8 requests)
3. Clicks "Create New Request"
4. Sees client dropdown (100 clients)
5. Selects client or requests new one
6. Fills form, saves draft
7. Submits request

### Scenario 2: Compliance Reviews with Duplication
1. Compliance Officer logs in
2. Sees 5-7 pending reviews
3. Opens request with duplication flag
4. Sees fuzzy match: "ABC Corp" → "ABC Corporation" (85% match)
5. Reviews existing engagement details
6. Decides: Approve (with justification) or Request Info

### Scenario 3: Partner Approves Request
1. Partner logs in
2. Sees dashboard with all active proposals
3. Sees 3-5 requests pending approval
4. Reviews compliance decision
5. Approves request
6. Sees request move to Finance

### Scenario 4: Finance Generates Engagement Code
1. Finance Team logs in
2. Sees 2-3 requests pending coding
3. Enters financial parameters
4. System generates: "ENG-2025-TAX-00142"
5. Code saved and linked to request

### Scenario 5: Admin Executes Proposal
1. Admin logs in
2. Sees 5-7 requests in execution phase
3. Updates execution date
4. 30-day monitoring starts
5. Sees alerts for requests approaching limit

### Scenario 6: PRMS Validation (Mock)
1. User tries to create project in PRMS (mock)
2. Enters Engagement Code: "ENG-2025-TAX-00142"
3. System validates code exists and is Active
4. Project created successfully
5. Try invalid code → Blocked by database constraint

---

## Implementation Checklist

### Data Seeding ✅ **COMPLETE**
- [x] Create 50 employees (all roles) - **50 users seeded**
- [x] Create 100 clients (with similar names for fuzzy matching) - **100 clients seeded**
- [x] Create 200 active projects (linked to Engagement Codes) - **200 projects seeded**
- [x] Create 20 pending COI requests (various stages) - **22+ requests seeded**
- [x] Link requests to employees/clients - **All linked**
- [x] Create duplication test cases - **Fuzzy matching test cases included**

### Fuzzy Matching ✅ **COMPLETE + ENHANCED**
- [x] Implement basic fuzzy matching algorithm - **Advanced Levenshtein distance**
- [x] Create test cases (5 examples above) - **All test cases included**
- [x] Show match scores in Compliance dashboard - **Implemented with visual alerts**
- [x] Allow manual override for false positives - **Override functionality exists**
- [x] **NEW**: IESBA Red Lines detection (Pro) - **Implemented**
- [x] **NEW**: IESBA Decision Matrix (Pro) - **Implemented**

### Stakeholder Views ✅ **COMPLETE**
- [x] Requester dashboard (5-8 requests) - **Full dashboard with filters**
- [x] Compliance dashboard (5-7 pending, duplication alerts) - **Enhanced with Rule Builder**
- [x] Partner dashboard (3-5 pending, all active proposals) - **Full dashboard**
- [x] Finance dashboard (2-3 pending, code generation) - **Full dashboard**
- [x] Admin dashboard (5-7 execution, 30-day alerts) - **Full dashboard**
- [x] Super Admin dashboard (all data, statistics) - **Full dashboard with Edition Switcher**

### Design Implementation ✅ **COMPLETE**
- [x] BDO-inspired color palette - **Blue/red theme implemented**
- [x] Modern, clean UI components - **Card-based layouts**
- [x] Responsive design - **Mobile-friendly**
- [x] Professional typography - **Consistent typography system**
- [x] Card-based layouts - **All dashboards use cards**

### Pro Edition Features ✅ **~90% COMPLETE**
- [x] Advanced Rules Engine (88 rules) - **Complete**
- [x] IESBA Compliance Framework - **Complete**
- [x] Dynamic Form Builder - **Complete**
- [x] Change Management System - **Complete**
- [x] Impact Analysis - **Complete**
- [x] Rules Engine Health Monitoring - **Complete**
- [x] Rule Builder UI - **Complete**
- [ ] Historical Decisions UI - **Service exists, UI pending**
- [ ] Regulation Links UI - **Service exists, UI pending**
- [ ] Full Form Version Control - **Partial (change tracking only)**

---

## Next Steps

1. ✅ Review this updated plan
2. ⏳ Create data seeding script
3. ⏳ Design BDO-inspired UI components
4. ⏳ Implement fuzzy matching algorithm
5. ⏳ Build stakeholder-specific dashboards
6. ⏳ Setup cloud environment
7. ⏳ Begin Phase 1 development

---

## Related Documents

- Risk Analysis: `Risk_Analysis_and_Failure_Points.md`
- User Journeys: `User_Journeys_End_to_End.md`
- Implementation Decisions: `Q&A/Implementation_Decisions_Summary.md`
- Architecture Decision: `Architecture_Decision_Event_Driven.md`
- Data Seeding & Stakeholder Views: `Data_Seeding_and_Stakeholder_Views_Plan.md`
- Fuzzy Matching Algorithm: `Fuzzy_Matching_Algorithm_Details.md`

