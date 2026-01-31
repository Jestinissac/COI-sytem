# COI System Prototype - Scope of Work

**Prepared for:** BDO Al Nisf & Partners  
**Project:** Conflict of Interest (COI) Management System - Prototype  
**Document Type:** Scope of Work  
**Date:** January 2026  
**Version:** 1.0

---

## Executive Summary

This document outlines the scope of work for developing a functional prototype of the Conflict of Interest (COI) Management System. The prototype will demonstrate the complete end-to-end workflow from initial request creation through engagement activation, with strict department-based data segregation and role-based access control.

**Primary Objective:** Demonstrate that **no proposal or engagement letter can be issued or signed** without a full, documented, and approved COI review.

**Prototype Goals:**
1. Validate core workflow and mandatory sequential relationship (COI → PRMS)
2. Demonstrate multi-layered authorization and governance
3. Test integration concepts with PRMS (mock integration)
4. Gather stakeholder feedback on UI/UX
5. Identify and mitigate risks before full production build

---

## 1. Project Overview

### 1.1 Purpose

The COI System serves as an upstream governance gatekeeper for PRMS (Project Resource Management System), ensuring that:
- All client engagements undergo proper conflict of interest checks
- Department-based data segregation is enforced
- Approval workflows are followed before project creation
- Engagement codes are generated and validated before PRMS project setup

### 1.2 Integration Architecture

```
┌─────────────┐
│   HRMS      │ → User Management, Roles, Permissions
└─────────────┘
      ↓
┌─────────────┐
│   COI       │ → Conflict Checks, Approvals, Engagement Codes
│   System    │
└─────────────┘
      ↓
┌─────────────┐
│   PRMS      │ → Project Creation (validated by Engagement Code)
└─────────────┘
```

---

## 2. Scope of Work

### 2.1 In Scope

#### 2.1.1 Core Workflow Implementation

**Request Creation & Management**
- Multi-section COI request form (7 sections)
- Client selection from PRMS Client Master (mock integration)
- Service information capture
- Ownership structure documentation
- Signatory details
- International operations handling
- Draft saving and editing capability

**Approval Workflows**
- Director approval workflow with document upload
- Compliance review with duplication detection
- Partner approval workflow
- Finance engagement code generation
- Admin execution tracking
- Status tracking across all stages

**Business Rules Engine**
- Configurable business rules (Standard Edition)
- Rule-based validation and flagging
- Rule approval workflow (Super Admin)
- Rule builder interface

**Duplication Detection**
- Advanced fuzzy matching algorithm
- Client name similarity detection
- Match scoring and confidence levels
- Visual alerts in Compliance dashboard
- Manual override capability

**Engagement Code Management**
- Automatic code generation (format: ENG-YYYY-SVC-#####)
- Code validation
- Financial parameters entry
- PRMS integration validation (mock)

**Role-Based Dashboards**
- Requester Dashboard
- Director Dashboard
- Compliance Dashboard (with Rule Builder in Pro Edition)
- Partner Dashboard
- Finance Dashboard
- Admin Dashboard
- Super Admin Dashboard

**Data Segregation**
- Department-based data access control
- Role-based visibility restrictions
- Commercial data protection (Compliance role restrictions)

#### 2.1.2 Pro Edition Features (Optional Enhancement)

**Advanced Rules Engine**
- IESBA compliance framework
- Red Lines detection (Management Responsibility, Advocacy, Contingent Fees)
- IESBA Decision Matrix
- PIE-specific restrictions
- Tax service differentiation
- Recommendation-based system (not auto-blocking)
- Confidence levels and override permissions

**Dynamic Form Builder**
- Drag-and-drop form builder
- Custom field creation
- Field dependencies
- Conditional display rules
- Form templates
- HRMS/PRMS data source mapping

**Change Management**
- Change tracking and approval workflows
- Impact analysis
- Emergency bypass capability
- Audit trail

**Rules Engine Health Monitoring**
- Status monitoring
- Error tracking
- Health check endpoints

#### 2.1.3 User Interface & Experience

**Design System**
- BDO-inspired design (blue/red theme)
- Modern, professional interface
- Responsive design (mobile-friendly)
- Card-based layouts
- Consistent typography and spacing

**Multi-System Landing Page**
- System tiles (HRMS, PRMS, COI)
- Permission-based display
- Seamless navigation

#### 2.1.4 Integration & Validation

**PRMS Mock Integration**
- Client Master data fetch
- Engagement Code validation endpoint
- Project creation simulation
- Database constraints to prevent bypass

**HRMS Mock Integration**
- User data fetch
- Role and permission management

#### 2.1.5 Testing & Quality Assurance

**End-to-End Testing**
- Playwright E2E test suite
- Workflow validation
- Integration testing
- Critical bug fixes verification

**Documentation**
- User guide
- API documentation
- System architecture documentation

### 2.2 Out of Scope

**Production Features (Deferred to Production Build)**
- Real PRMS/HRMS API integration (mock APIs used in prototype)
- Real email notification system (mock notifications)
- Advanced reporting and analytics
- Complex audit logging (basic audit trail included)
- ISQM digital forms (PDF upload capability included)
- Production-grade security hardening
- Performance optimization for large datasets
- Multi-tenant architecture
- Advanced backup and disaster recovery

**Infrastructure**
- Production deployment
- Cloud infrastructure setup (prototype runs locally)
- Database migration tools
- CI/CD pipeline

**Additional Features**
- Mobile native applications
- Advanced search and filtering
- Bulk operations
- Advanced workflow customization
- Multi-language support

---

## 3. Deliverables

### 3.1 Functional Prototype

**Working Application**
- Complete COI system (frontend + backend)
- All 7 role-based dashboards
- End-to-end workflow from request creation to engagement activation
- Business rules engine with configurable rules
- Duplication detection system
- Engagement code generation and validation

**Database**
- SQLite database with complete schema
- Seeded test data (50 users, 100 clients, 200 projects, 22+ COI requests)
- Database constraints to prevent bypass

**Mock Integrations**
- PRMS mock API (Client Master, Engagement Code validation)
- HRMS mock API (User data, roles)

### 3.2 Documentation

**User Documentation**
- User guide for each role
- Workflow documentation
- Feature overview

**Technical Documentation**
- API documentation
- Database schema documentation
- System architecture overview
- Integration specifications

**Testing Documentation**
- Test scenarios and results
- E2E test suite documentation

### 3.3 Demo & Presentation

**Live Prototype**
- Functional prototype accessible for stakeholder review
- Demo scenarios for each user role
- Stakeholder presentation materials

---

## 4. Success Criteria

The prototype will be considered successful when it demonstrates:

1. ✅ **Database Constraint Enforcement**
   - Cannot create project without valid Engagement Code
   - Foreign key constraints prevent bypass

2. ✅ **Complete Approval Workflow**
   - Director → Compliance → Partner → Finance → Admin workflow enforced
   - Status transitions work correctly
   - All approval stages functional

3. ✅ **Engagement Code Generation**
   - Automatic code generation works
   - Code format: ENG-YYYY-SVC-#####
   - PRMS validation (mock) functions correctly

4. ✅ **Duplication Detection**
   - Fuzzy matching algorithm works
   - Match scores displayed correctly
   - Manual override capability functional

5. ✅ **End-to-End User Flow**
   - Users can complete full COI request flow
   - All roles can perform their designated tasks
   - Data segregation works correctly

6. ✅ **Business Rules Engine**
   - Rules can be created and configured
   - Rules execute on request submission
   - Rule recommendations/actions work correctly

7. ✅ **User Experience**
   - Intuitive, professional interface
   - Responsive design
   - Clear error handling

---

## 5. Technology Stack

### 5.1 Frontend
- **Framework:** Vue 3 with TypeScript
- **UI Library:** Tailwind CSS
- **State Management:** Pinia
- **Routing:** Vue Router
- **Build Tool:** Vite

### 5.2 Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite (prototype)
- **Authentication:** JWT (JSON Web Tokens)

### 5.3 Integration
- **PRMS:** Mock API (simulates PRMS responses)
- **HRMS:** Mock API (simulates HRMS responses)
- **Email:** Mock service (logs to console/file)

---

## 6. Timeline

### 6.1 Development Phases

**Phase 1: Foundation** ✅ **Complete**
- Project setup and structure
- Database schema and migrations
- Authentication system
- Multi-system landing page

**Phase 2: Core COI Workflow** ✅ **Complete**
- Request creation form
- All approval workflows
- Engagement code generation
- Duplication detection

**Phase 3: Integration & Validation** ✅ **Complete**
- PRMS mock integration
- Engagement code validation
- Role-based dashboards
- 30-day monitoring (structure)

**Phase 4: Polish & Testing** ✅ **Complete**
- UI/UX refinement
- E2E testing
- Documentation
- Bug fixes

**Total Development Time:** ~2.5 weeks (completed)

### 6.2 Current Status

**Standard Edition:** ✅ **100% Complete** - Production Ready  
**Pro Edition:** ✅ **~90% Complete** - Core features implemented

---

## 7. Data Requirements

### 7.1 Test Data Included

**Users (50 employees)**
- Directors, Compliance Officers, Partners
- Finance Team, Admin Team, Requesters
- Distributed across all departments

**Clients (100 clients)**
- 70 Active clients
- 20 Inactive clients
- 10 Potential clients
- Includes fuzzy matching test cases

**Projects (200 active projects)**
- Various service types
- Linked to Engagement Codes
- Different statuses

**COI Requests (22+ requests)**
- Various stages (Draft, Pending, Approved, Active)
- Distributed across approval workflow
- Includes test scenarios

---

## 8. User Roles & Permissions

### 8.1 Role Definitions

**Requester**
- Create and manage own COI requests
- View own requests and status
- Submit requests for approval

**Director**
- Approve requests from team members
- View department requests
- Upload approval documents

**Compliance**
- Review all requests for conflicts
- View duplication alerts
- Approve/reject requests
- Manage business rules (Pro Edition)

**Partner**
- Final approval authority
- View all active proposals
- Review compliance decisions

**Finance**
- Generate Engagement Codes
- Enter financial parameters
- Validate codes

**Admin**
- Execute proposals
- Track engagement letters
- Monitor 30-day deadlines
- Manage system configuration

**Super Admin**
- Full system access
- User management
- System configuration
- Edition switching (Standard/Pro)

### 8.2 Data Segregation

- **Requester:** Own requests only
- **Director:** Own + team requests (department-based)
- **Compliance:** All departments (no commercial data)
- **Partner:** All departments (full visibility)
- **Finance:** All departments
- **Admin:** All departments
- **Super Admin:** No restrictions

---

## 9. Key Features

### 9.1 Standard Edition Features

- Complete COI workflow (7 stages)
- Business rules engine (basic)
- Duplication detection (fuzzy matching)
- Engagement code generation
- Role-based dashboards
- Data segregation
- Draft saving/editing
- File uploads (attachments)

### 9.2 Pro Edition Features (Optional)

- Advanced Rules Engine (88 rules)
- IESBA Compliance Framework
- Red Lines Detection
- IESBA Decision Matrix
- Dynamic Form Builder
- Change Management System
- Impact Analysis
- Rules Engine Health Monitoring
- Enhanced Rule Builder UI

---

## 10. Integration Points

### 10.1 PRMS Integration (Mock)

**Client Master Data**
- Fetch client list from PRMS
- Client selection in COI form
- Client data validation

**Engagement Code Validation**
- Validate codes before project creation
- Database constraints enforce validation
- Error handling for invalid codes

**Project Creation Simulation**
- Simulate project creation with Engagement Code
- Demonstrate constraint enforcement
- Show validation workflow

### 10.2 HRMS Integration (Mock)

**User Data**
- Fetch user information
- Role and permission management
- Department assignment

---

## 11. Design & User Experience

### 11.1 Design System

**Design Principles**
- Clean, modern, professional interface
- Intuitive navigation and user flows
- Consistent visual design across all screens
- Responsive design for various devices

### 11.2 User Experience

- Intuitive navigation
- Clear status indicators
- Helpful error messages
- Consistent interaction patterns
- Mobile-friendly interface

---

## 12. Testing & Quality Assurance

### 12.1 Testing Approach

**Testing Activities**
- Complete workflow validation
- Role-based access verification
- Integration testing with mock systems
- User acceptance testing scenarios
- Stakeholder review sessions

### 12.2 Quality Standards

- All critical workflows functional and tested
- User-friendly interface with clear error messages
- Consistent user experience across all roles
- All features work as specified

---

## 13. Handoff & Next Steps

### 13.1 Prototype Deliverables

Upon completion, the following will be provided:

1. **Working Prototype**
   - Functional application with all features
   - Test data for demonstration
   - Access for stakeholder review

2. **Documentation**
   - User guides for each role
   - Workflow documentation
   - Feature overview
   - System architecture overview

3. **Demo & Presentation**
   - Live prototype demonstration
   - Demo scenarios for each user role
   - Presentation materials

### 13.2 Production Handoff

**Prototype Purpose:**
- Validate workflow and business processes
- Get stakeholder approval for approach
- Demonstrate core functionality
- Identify process improvements before production build

**Next Steps:**
- Production build will be based on validated prototype workflows
- Technical implementation will be optimized for production environment
- Integration with real PRMS/HRMS systems will be implemented

---

## 14. Assumptions & Dependencies

### 14.1 Assumptions

- Mock APIs sufficient for prototype demonstration
- SQLite database adequate for prototype
- Local development environment available
- Stakeholder availability for review sessions
- Test data requirements understood

### 14.2 Dependencies

- Access to PRMS/HRMS specifications (for mock API design)
- Stakeholder feedback on UI/UX
- Approval of design system
- Test data requirements confirmation

---

## 15. Risks & Mitigation

### 15.1 Identified Risks

**Technical Risks**
- Integration complexity (mitigated by mock APIs)
- Performance with large datasets (mitigated by prototype scope)
- Browser compatibility (mitigated by testing)

**Project Risks**
- Scope creep (mitigated by clear scope definition)
- Timeline delays (mitigated by phased approach)
- Stakeholder availability (mitigated by flexible review schedule)

### 15.2 Mitigation Strategies

- Clear scope definition
- Phased development approach
- Regular stakeholder communication
- Early testing and feedback
- Flexible timeline adjustments

---

## 16. Acceptance Criteria

The prototype will be considered acceptable when:

1. ✅ All core workflows function end-to-end
2. ✅ All 7 role-based dashboards are functional
3. ✅ Business rules engine works correctly
4. ✅ Duplication detection functions properly
5. ✅ Engagement code generation and validation works
6. ✅ Database constraints prevent bypass
7. ✅ UI/UX meets design standards
8. ✅ Documentation is complete
9. ✅ E2E tests pass
10. ✅ Stakeholder approval received

---

## 17. Change Management

### 17.1 Scope Changes

Any changes to the scope of work must be:
- Documented in writing
- Approved by stakeholders
- Impact assessed (timeline, resources)
- Incorporated into project plan

### 17.2 Version Control

- All code changes tracked in version control
- Documentation updates versioned
- Change log maintained

---

## 18. Contact & Support

**Project Team:**
- Development Team: [Contact Information]
- Project Manager: [Contact Information]
- Technical Lead: [Contact Information]

**Support:**
- Technical questions: [Support Channel]
- Bug reports: [Issue Tracker]
- Feature requests: [Request Channel]

---

## 19. Appendix

### 19.1 Related Documents

- Risk Analysis: `Risk_Analysis_and_Failure_Points.md`
- User Journeys: `User_Journeys_End_to_End.md`
- Implementation Decisions: `Q&A/Implementation_Decisions_Summary.md`
- Architecture Decision: `Architecture_Decision_Event_Driven.md`
- Data Seeding & Stakeholder Views: `Data_Seeding_and_Stakeholder_Views_Plan.md`
- Fuzzy Matching Algorithm: `Fuzzy_Matching_Algorithm_Details.md`

### 19.2 Glossary

**COI:** Conflict of Interest  
**PRMS:** Project Resource Management System  
**HRMS:** Human Resource Management System  
**PIE:** Public Interest Entity  
**IESBA:** International Ethics Standards Board for Accountants  
**Engagement Code:** Unique identifier for client engagements (format: ENG-YYYY-SVC-#####)

---

## Document Control

**Version:** 1.0  
**Date:** January 2026  
**Status:** Final  
**Next Review:** Upon prototype completion  
**Approved By:** [Stakeholder Name]  
**Date Approved:** [Date]

---

**End of Scope of Work Document**
