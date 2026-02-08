# COI Prototype — Architecture Digest

_Generated on 2026-02-07 11:45_

## Business Context

The COI (Conflict of Interest) Management System is part of the Envision PRMS
(Practice & Risk Management System). It manages the lifecycle of conflict-of-interest
checks for professional services engagements.

**Workflow stages:**
Requester → Director → Compliance → Partner → Finance → Admin Execution

**User roles (7):**
Requester, Director, Compliance, Partner, Finance, Admin, Super Admin

**Core domain concepts:**
- **COI Requests:** Conflict checks initiated by a Requester for a client engagement
- **Engagements:** Client engagements that require COI clearance
- **Compliance Rules:** IESBA, CMA, and firm-specific business rules
- **Approvals:** Multi-stage approval workflow with role-based gates
- **Service Catalog:** Categorized list of professional services offered

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express.js |
| Database | SQLite via better-sqlite3 |
| Frontend | Vue 3 + Vite + TypeScript |
| State | Pinia stores |
| Styling | Tailwind CSS |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Testing | Vitest (unit) + Playwright (E2E) |
| Exports | ExcelJS, PDFKit |

## Database Tables (from schema.sql)

```
audit_logs
business_rules_config
business_rules_config
client_requests
clients
coi_attachments
coi_engagement_codes
coi_requests
coi_signatories
emergency_bypass_log
emergency_bypass_log
engagement_renewals
execution_tracking
field_dependencies
field_dependencies
field_impact_analysis
field_impact_analysis
form_config_changes
form_config_changes
form_field_mappings
form_field_mappings
form_fields_config
form_fields_config
form_template_fields
form_template_fields
form_templates
form_templates
form_versions
form_versions
global_coi_submissions
isqm_forms
monitoring_alerts
prms_projects
rule_execution_log
rules_engine_health
rules_engine_health
users
workflow_config
workflow_config
```

**39 tables, 841 lines in schema.sql**

## Backend Modules

### Controllers (backend/src/controllers/)
```
analyticsController.js
attachmentController.js
authController.js
changeManagementController.js
coiController.js
complianceController.js
configController.js
countriesController.js
emailConfigController.js
engagementController.js
entityCodesController.js
executionController.js
globalCOIController.js
globalCOIFormController.js
integrationController.js
isqmController.js
loadTestController.js
myDayWeekController.js
parentCompanyUpdateController.js
priorityController.js
prospectClientCreationController.js
prospectController.js
reportController.js
reportSharingController.js
serviceCatalogController.js
serviceTypeController.js
slaController.js
```

### Services (backend/src/services/)
```
adIntegrationService.js
auditTrailService.js
businessRulesEngine.js
catalogImportService.js
clientValidationService.js
cmaConflictMatrix.js
configService.js
dataConsistencyService.js
duplicationCheckService.js
emailService.js
engagementCodeService.js
eventBus.js
excelExportService.js
fieldMappingService.js
fileUploadService.js
funnelTrackingService.js
hrmsIntegrationService.js
iesbaDecisionMatrix.js
impactAnalysisService.js
mlPriorityService.js
monitoringService.js
myDayWeekService.js
notificationService.js
pdfExportService.js
permissionService.js
priorityService.js
redLinesService.js
regulationService.js
reportCacheService.js
reportDataService.js
reportSharingService.js
rulesEngineService.js
similarCasesService.js
slaMonitorService.js
slaService.js
staleProspectService.js
```

### Routes (backend/src/routes/)
```
auth.routes.js
changeManagement.routes.js
coi.routes.js
compliance.routes.js
config.routes.js
countries.routes.js
email.routes.js
engagement.routes.js
entityCodes.routes.js
execution.routes.js
global.routes.js
integration.routes.js
isqm.routes.js
myDayWeek.routes.js
parentCompanyUpdate.routes.js
permission.routes.js
priority.routes.js
prospect.routes.js
prospectClientCreation.routes.js
reportSharing.routes.js
reports.routes.js
serviceCatalog.routes.js
sla.routes.js
```

## Route Mounts (from backend/src/index.js)

```
124:app.use('/api/auth', authRoutes)
125:app.use('/api/coi', coiRoutes)
126:app.use('/api/integration', integrationRoutes)
127:app.use('/api/isqm', isqmRoutes)
128:app.use('/api/global', globalRoutes)
129:app.use('/api/execution', executionRoutes)
130:app.use('/api/config', configRoutes)
131:app.use('/api/change-management', changeManagementRoutes)
132:app.use('/api/prospects', prospectRoutes)
133:app.use('/api/engagement', engagementRoutes)
134:app.use('/api/service-catalog', serviceCatalogRoutes)
135:app.use('/api/entity-codes', entityCodesRoutes)
136:app.use('/api/countries', countriesRoutes)
137:app.use('/api/reports', reportsRoutes)
138:app.use('/api/reports', reportSharingRoutes)
139:app.use('/api/prospect-client-creation', prospectClientCreationRoutes)
140:app.use('/api/parent-company-update-requests', parentCompanyUpdateRoutes)
141:app.use('/api/compliance', complianceRoutes)
142:app.use('/api', myDayWeekRoutes)
143:app.use('/api/priority', priorityRoutes)
144:app.use('/api/sla', slaRoutes)
145:app.use('/api/email', emailRoutes)
146:app.use('/api/permissions', permissionRoutes)
151:    app.use('/api/client-intelligence', module.default)
```

## Middleware
```
auth.js
dataSegregation.js
rateLimiter.js
reportValidator.js
```

## Frontend Modules

### Pinia Stores (frontend/src/stores/)
```
auth.ts
clients.ts
coiRequests.ts
environment.ts
reports.ts
toast.ts
```

### Views (frontend/src/views/)
```
AdminDashboard.vue
COIRequestDetail.vue
COIRequestForm.vue
ComplianceClientServices.vue
ComplianceDashboard.vue
DashboardBase.vue
DirectorDashboard.vue
EmailConfig.vue
EntityCodesManagement.vue
FinanceDashboard.vue
FormBuilder.vue
HRMSVacationManagement.vue
InternationalOperationsDemo.vue
LandingPage.vue
Login.vue
MyTasks.vue
PRMSDemo.vue
PartnerDashboard.vue
PermissionConfig.vue
PriorityConfig.vue
ProspectManagement.vue
ReportingDashboard.vue
Reports.vue
RequesterDashboard.vue
SLAConfig.vue
ServiceCatalogManagement.vue
SuperAdminDashboard.vue
```

### Component Directories (frontend/src/components/)
```
admin
business-dev
coi
coi-wizard
coi/demo
compliance
dashboard
edition
engagement
finance
forms
layout
priority
reports
rules
sla
tasks
ui
```

## Key Business Logic Files

| File | Purpose |
|---|---|
| `backend/src/services/businessRulesEngine.js` (505 lines) | Core rules engine for conflict evaluation |
| `backend/src/services/iesbaDecisionMatrix.js` (121 lines) | IESBA ethics standard decision matrix |
| `backend/src/services/cmaConflictMatrix.js` (345 lines) | CMA conflict detection matrix |
| `backend/src/services/engagementCodeService.js` (227 lines) | Engagement code generation logic |
| `backend/src/services/emailService.js` (871 lines) | Email notification service |
| `backend/src/services/notificationService.js` (1291 lines) | In-app notification service |
| `backend/src/services/auditTrailService.js` (217 lines) | Audit trail / history tracking |
| `backend/src/services/permissionService.js` (269 lines) | Role-based permission checks |
| `backend/src/services/slaService.js` (430 lines) | SLA monitoring and tracking |
| `backend/src/services/priorityService.js` (396 lines) | Request priority calculation |
| `backend/src/controllers/coiController.js` (2224 lines) | Main COI request CRUD operations |
| `backend/src/controllers/complianceController.js` (280 lines) | Compliance review operations |
| `backend/src/controllers/engagementController.js` (269 lines) | Engagement management operations |

## Database Seeds (backend/src/scripts/ + database/seed/)
```
createRulesTable.js
seedCMABusinessRules.js
seedCMARules.js
seedCMAServiceTypes.js
seedCountries.js
seedEntityCodes.js
seedFormFields.js
seedGlobalServiceCatalog.js
seedIESBARules.js
seedKuwaitServiceCatalog.js
seedRules.js
seedServiceCatalogs.js
runSeed.js
seedData.js
```

## File Counts

| Category | Count |
|---|---|
| Backend Controllers | 27 |
| Backend Services | 36 |
| Backend Routes | 23 |
| Frontend Components (.vue) | 65 |
| Frontend Views (.vue) | 27 |
| Frontend Stores | 6 |
| Database Migrations | 15 |
| E2E Tests | 28 |

**Total backend lines:** 0
**Total frontend lines:** 0
