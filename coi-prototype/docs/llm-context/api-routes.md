# COI Prototype — API Routes

_Generated on 2026-02-07 11:44_

## Route Mount Points (from index.js)

```
9:import authRoutes from './routes/auth.routes.js'
10:import coiRoutes from './routes/coi.routes.js'
11:import integrationRoutes from './routes/integration.routes.js'
12:import isqmRoutes from './routes/isqm.routes.js'
13:import globalRoutes from './routes/global.routes.js'
14:import executionRoutes from './routes/execution.routes.js'
15:import configRoutes from './routes/config.routes.js'
16:import changeManagementRoutes from './routes/changeManagement.routes.js'
17:import prospectRoutes from './routes/prospect.routes.js'
18:import engagementRoutes from './routes/engagement.routes.js'
19:import serviceCatalogRoutes from './routes/serviceCatalog.routes.js'
20:import entityCodesRoutes from './routes/entityCodes.routes.js'
21:import reportsRoutes from './routes/reports.routes.js'
22:import reportSharingRoutes from './routes/reportSharing.routes.js'
23:import prospectClientCreationRoutes from './routes/prospectClientCreation.routes.js'
24:import parentCompanyUpdateRoutes from './routes/parentCompanyUpdate.routes.js'
25:import complianceRoutes from './routes/compliance.routes.js'
26:import countriesRoutes from './routes/countries.routes.js'
27:import myDayWeekRoutes from './routes/myDayWeek.routes.js'
28:import priorityRoutes from './routes/priority.routes.js'
29:import slaRoutes from './routes/sla.routes.js'
30:import emailRoutes from './routes/email.routes.js'
31:import permissionRoutes from './routes/permission.routes.js'
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
149:import('../../client-intelligence/backend/routes/clientIntelligence.routes.js')
151:    app.use('/api/client-intelligence', module.default)
```

## Route Definitions by File

### auth.routes.js

```
  22:router.post('/login', login)
  23:router.post('/refresh', refreshAccessToken) // Refresh access token
  24:router.post('/logout', logout) // Logout (revoke refresh token)
  25:router.post('/logout-all', authenticateToken, logoutAll) // Logout from all devices
  28:router.get('/me', authenticateToken, getCurrentUser)
  29:router.get('/users', authenticateToken, getAllUsers)
  32:router.post('/users', authenticateToken, requireRole('Super Admin'), createUser)
  33:router.put('/users/:id', authenticateToken, requireRole('Super Admin'), updateUser)
  34:router.post('/users/:id/disable', authenticateToken, requireRole('Super Admin'), disableUser)
  35:router.post('/users/:id/enable', authenticateToken, requireRole('Super Admin'), enableUser)
  36:router.get('/audit-logs', authenticateToken, requireRole('Super Admin'), getAuditLogs)
  39:router.get('/users/approvers', authenticateToken, requireRole('Admin', 'Super Admin'), getApproverUsers)
  40:router.post('/users/:id/availability', authenticateToken, requireRole('Admin', 'Super Admin'), updateUserAvailability)
```

### changeManagement.routes.js

```
  25:router.post('/fields/:id/validate-change', validateFieldChange)
  26:router.get('/fields/:id/impact', getFieldImpact)
  27:router.get('/fields/:id/dependencies', getFieldDependencies)
  30:router.post('/changes', recordChange)
  31:router.get('/changes', getChanges)
  32:router.get('/changes/:id', getChangeDetails)
  33:router.post('/changes/:id/approve', requireRole('Admin', 'Super Admin'), approveChange)
  34:router.post('/changes/:id/reject', requireRole('Admin', 'Super Admin'), rejectChange)
  35:router.post('/changes/:id/rollback', requireRole('Admin', 'Super Admin'), rollbackChange)
  36:router.post('/changes/:id/emergency-bypass', requireRole('Super Admin'), emergencyBypassChange)
  39:router.get('/rules-engine/health', getRulesEngineHealth)
  40:router.post('/rules-engine/reset', requireRole('Super Admin'), resetRulesEngineHealth)
  41:router.post('/rules-engine/health-check', requireRole('Admin', 'Super Admin'), performHealthCheckEndpoint)
```

### coi.routes.js

```
  104:router.get('/approvers', getApproversForBackup)
  107:router.get('/requests', getMyRequests)
  108:router.get('/requests/prospects', getProspectRequests) // Must come before /:id
  109:router.get('/requests/:id', getRequestById)
  110:router.post('/requests', createRequest)
  111:router.put('/requests/:id', updateRequest)
  112:router.delete('/requests/:id', deleteRequest) // Delete draft requests only
  113:router.post('/requests/:id/submit', submitRequest)
  116:router.post('/requests/:id/approve', approveRequest)
  117:router.post('/requests/:id/reject', rejectRequest)
  118:router.post('/requests/:id/resubmit', resubmitRejectedRequest) // Resubmit rejected requests (fixable only)
  119:router.post('/requests/:id/request-info', requestInfo)
  120:router.post('/requests/:id/need-more-info', requestMoreInfo) // Enhanced: returns to requester with specific questions
  123:router.post('/requests/:id/re-evaluate', requireRole('Compliance'), reEvaluateRequest)
  126:router.post('/requests/:id/verify-group-structure', requireRole('Compliance'), verifyGroupStructure)
  127:router.post('/requests/:id/clear-conflict-flag', requireRole('Compliance'), clearConflictFlag)
  130:router.get('/resolved-conflicts', requireRole('Compliance', 'Partner'), getResolvedConflicts)
  131:router.post('/resolved-conflicts/:id/dismiss', requireRole('Compliance', 'Partner'), dismissResolvedConflict)
  134:router.post('/requests/:id/refresh-duplicates', requireRole('Compliance', 'Admin', 'Super Admin'), refreshDuplicates)
  137:router.post('/requests/:id/generate-code', requireRole('Finance'), generateEngagementCode)
  140:router.post('/requests/:id/execute', requireRole('Admin'), executeProposal)
  143:router.get('/dashboard/:role', getDashboardData)
  144:router.get('/dashboard/prospect-metrics', getProspectConversionMetrics)
  147:router.post('/monitoring/update', requireRole('Admin'), updateMonitoring)
  148:router.get('/monitoring/alerts', requireRole('Admin'), getMonitoringAlerts)
  151:router.post('/monitoring/send-interval-alerts', requireRole('Admin'), async (req, res) => {
  161:router.post('/monitoring/send-proposal-alerts', requireRole('Admin'), async (req, res) => {
  170:router.post('/monitoring/check-renewals', requireRole('Admin'), async (req, res) => {
  179:router.get('/monitoring/summary', requireRole('Admin'), async (req, res) => {
  189:router.post('/monitoring/check-lapses', requireRole('Admin', 'Super Admin'), async (req, res) => {
  199:router.post('/monitoring/check-3year-renewals', requireRole('Admin', 'Super Admin'), async (req, res) => {
  209:router.post('/requests/:id/attachments', upload.single('file'), uploadAttachment)
  210:router.get('/requests/:id/attachments', getAttachments)
  211:router.get('/requests/:id/attachments/:attachmentId/download', downloadAttachment)
  212:router.delete('/requests/:id/attachments/:attachmentId', deleteAttachment)
  215:router.get('/requests/:id/similar-cases', requireRole('Compliance', 'Admin', 'Super Admin'), async (req, res) => {
  229:router.post('/similar-cases/search', requireRole('Compliance', 'Admin', 'Super Admin'), async (req, res) => {
  238:router.get('/clients/:clientId/decision-history', requireRole('Compliance', 'Admin', 'Super Admin'), async (req, res) => {
  248:router.get('/regulations', async (req, res) => {
  257:router.get('/regulations/search', async (req, res) => {
  267:router.get('/regulations/:code', async (req, res) => {
  279:router.get('/regulations/applicable/:serviceType', async (req, res) => {
  294:router.get('/isqm/types', async (req, res) => {
  303:router.get('/isqm/documents', requireRole('Compliance', 'Admin', 'Super Admin'), async (req, res) => {
  312:router.get('/requests/:id/files', async (req, res) => {
  321:router.get('/files/stats', requireRole('Admin', 'Super Admin'), async (req, res) => {
  331:router.get('/monitoring/dashboard', requireRole('Admin', 'Super Admin', 'Compliance'), async (req, res) => {
  340:router.post('/monitoring/run-tasks', requireRole('Admin', 'Super Admin'), async (req, res) => {
  349:router.get('/reports/monthly/:year/:month', requireRole('Admin', 'Super Admin'), async (req, res) => {
  364:router.get('/my-day', async (req, res) => {
  379:router.get('/my-week', async (req, res) => {
  413:router.post('/admin/load-test', requireRole('Admin', 'Super Admin'), requireLoadTestingEnvironment, runLoadTest)
  414:router.get('/admin/noise-stats', requireRole('Admin', 'Super Admin'), getNoiseStats)
  415:router.delete('/admin/load-test/cleanup', requireRole('Admin', 'Super Admin'), requireLoadTestingEnvironment, cleanupLoadTest)
  420:router.get('/admin/analytics/business', requireRole('Admin', 'Super Admin'), getBusinessAnalytics)
  421:router.get('/admin/analytics/performance', requireRole('Admin', 'Super Admin'), getPerformanceAnalytics)
```

### compliance.routes.js

```
  12:router.get('/client-services/:clientId', 
  18:router.get('/all-client-services', 
```

### config.routes.js

```
  42:router.get('/form-fields', getFormFields)
  43:router.post('/form-fields', requireRole('Admin', 'Super Admin'), saveFormFields)
  44:router.get('/form-fields/:id', getFormField)
  45:router.put('/form-fields/:id', requireRole('Admin', 'Super Admin'), updateFormField)
  46:router.delete('/form-fields/:id', requireRole('Admin', 'Super Admin'), deleteFormField)
  49:router.get('/workflow', getWorkflowConfig)
  50:router.post('/workflow', requireRole('Admin', 'Super Admin'), saveWorkflowConfig)
  53:router.get('/business-rules', getBusinessRules)
  54:router.post('/business-rules', requireRole('Admin', 'Super Admin', 'Compliance'), saveBusinessRule)
  55:router.put('/business-rules/:id', requireRole('Admin', 'Super Admin', 'Compliance'), updateBusinessRule)
  56:router.post('/business-rules/:id/impact', requireRole('Admin', 'Super Admin', 'Compliance'), getRuleChangeImpact)
  57:router.delete('/business-rules/:id', requireRole('Admin', 'Super Admin', 'Compliance'), deleteBusinessRule)
  58:router.post('/business-rules/:id/approve', requireRole('Super Admin'), approveBusinessRule)
  59:router.post('/business-rules/:id/reject', requireRole('Super Admin'), rejectBusinessRule)
  60:router.post('/business-rules/cleanup-duplicates', requireRole('Super Admin'), cleanupDuplicateRules)
  63:router.get('/rule-fields', getRuleFields)
  66:router.post('/validate-rule', validateRuleEndpoint)
  69:router.post('/test-rule', testRule)
  72:router.get('/templates', getFormTemplates)
  73:router.get('/templates/:id', getFormTemplate)
  74:router.post('/templates', requireRole('Admin', 'Super Admin'), saveFormTemplate)
  75:router.delete('/templates/:id', requireRole('Admin', 'Super Admin'), deleteFormTemplate)
  76:router.post('/templates/:id/load', requireRole('Admin', 'Super Admin'), loadFormTemplate)
  79:router.get('/edition', getSystemEditionConfig)
  80:router.put('/edition', requireRole('Super Admin'), updateSystemEdition)
  81:router.get('/features', getEnabledFeatures)
  84:router.get('/client-intelligence/status', getClientIntelligenceStatusEndpoint)
  85:router.post('/client-intelligence/enable', requireRole('Super Admin'), enableClientIntelligenceEndpoint)
  86:router.post('/client-intelligence/disable', requireRole('Super Admin'), disableClientIntelligenceEndpoint)
  89:router.get('/cma/service-types', authenticateToken, (req, res) => {
  99:router.get('/cma/service-types-grouped', authenticateToken, (req, res) => {
  109:router.get('/cma/rules/:serviceA/:serviceB', authenticateToken, (req, res) => {
```

### countries.routes.js

```
  10:router.get('/', getCountries)
  11:router.get('/:code', getCountry)
```

### email.routes.js

```
  23:router.get('/config', authenticateToken, requireRole(['Super Admin', 'Admin']), getEmailConfig)
  24:router.put('/config', authenticateToken, requireRole(['Super Admin', 'Admin']), updateEmailConfig)
  25:router.post('/config/test', authenticateToken, requireRole(['Super Admin', 'Admin']), testEmailConfig)
  26:router.get('/config/status', authenticateToken, requireRole(['Super Admin', 'Admin']), getEmailStatus)
```

### engagement.routes.js

```
  12:router.post('/proposal/:requestId/convert', convertProposalToEngagement)
  13:router.get('/conversion-history/:requestId', getConversionHistory)
```

### entityCodes.routes.js

```
  17:router.get('/', getEntityCodes)
  20:router.get('/:code', getEntityCode)
  23:router.post('/', createEntityCode)
  26:router.put('/:code', updateEntityCode)
  29:router.delete('/:code', deleteEntityCode)
```

### execution.routes.js

```
  23:router.get('/queue', getExecutionQueue)
  26:router.get('/request/:requestId', getExecutionTracking)
  29:router.post('/request/:requestId/prepare-proposal', prepareProposal)
  30:router.post('/request/:requestId/send-proposal', sendProposal)
  33:router.post('/request/:requestId/follow-up', recordFollowUp)
  36:router.post('/request/:requestId/client-response', recordClientResponse)
  39:router.post('/request/:requestId/prepare-engagement-letter', prepareEngagementLetter)
  40:router.post('/request/:requestId/send-engagement-letter', sendEngagementLetter)
  41:router.post('/request/:requestId/signed-engagement', recordSignedEngagement)
  44:router.post('/request/:requestId/countersigned', recordCountersigned)
  47:router.post('/request/:requestId/notes', addAdminNotes)
```

### global.routes.js

```
  20:router.get('/pending', getPendingSubmissions)
  23:router.get('/request/:requestId', getGlobalSubmission)
  26:router.post('/request/:requestId', createGlobalSubmission)
  29:router.put('/:submissionId', updateGlobalSubmission)
  32:router.get('/request/:requestId/export', exportToExcel)
  35:router.get('/export-excel/:requestId', exportGlobalCOIFormExcel)
  38:router.post('/generate-excel', generateExcelFromFormData)
  41:router.put('/:submissionId/status', updateSubmissionStatus)
```

### integration.routes.js

```
  11:router.get('/clients', getClients)
  12:router.get('/validate-engagement-code/:code', validateEngagementCode)
  13:router.get('/engagement-codes', getEngagementCodes)
  14:router.post('/projects', createProject)
  15:router.get('/service-types', getServiceTypes)
  16:router.get('/service-types/:serviceType/sub-categories', getServiceSubCategories)
  17:router.get('/ambiguous-service-config', getAmbiguousServiceConfig)
  20:router.get('/hrms/user-data', async (req, res) => {
  62:router.get('/prms/client/:clientId', async (req, res) => {
```

### isqm.routes.js

```
  17:router.get('/request/:requestId', getISQMForms)
  20:router.post('/request/:requestId/screening', createClientScreening)
  23:router.post('/request/:requestId/acceptance', createClientAcceptance)
  26:router.put('/:formId', updateISQMForm)
  29:router.post('/:formId/review', reviewISQMForm)
```

### myDayWeek.routes.js

```
  11:router.get('/my-day', getMyDayData)
  14:router.get('/my-week', getMyWeekData)
  17:router.get('/my-month', getMyMonthData)
  20:router.get('/event-bus-status', getEventBusStatus)
```

### parentCompanyUpdate.routes.js

```
  17:router.get('/check-tbd/:clientId', checkClientParentTBD)
  20:router.post('/', createParentUpdateRequest)
  23:router.get('/', requireRole('Admin', 'Super Admin'), listParentUpdateRequests)
  26:router.get('/:id', getParentUpdateRequestById)
  29:router.post('/:id/approve', requireRole('Admin', 'Super Admin'), approveParentUpdateRequest)
  32:router.post('/:id/reject', requireRole('Admin', 'Super Admin'), rejectParentUpdateRequest)
```

### permission.routes.js

```
  16:router.get('/all', authenticateToken, requireRole('Super Admin'), async (req, res) => {
  26:router.get('/role/:role', authenticateToken, requireRole('Super Admin'), async (req, res) => {
  37:router.get('/category/:category', authenticateToken, requireRole('Super Admin'), async (req, res) => {
  48:router.post('/grant', authenticateToken, requireRole('Super Admin'), async (req, res) => {
  64:router.post('/revoke', authenticateToken, requireRole('Super Admin'), async (req, res) => {
  80:router.get('/audit-log', authenticateToken, requireRole('Super Admin'), async (req, res) => {
  98:router.get('/check/:permissionKey', authenticateToken, async (req, res) => {
  109:router.post('/reset-defaults', authenticateToken, requireRole('Super Admin'), async (req, res) => {
```

### priority.routes.js

```
  27:router.get('/queue', authenticateToken, getQueue)
  28:router.get('/grouped', authenticateToken, getGrouped)
  29:router.get('/breakdown/:requestId', authenticateToken, getBreakdown)
  32:router.get('/config', authenticateToken, requireRole(['Super Admin', 'Admin']), getConfig)
  33:router.put('/config/:factorId', authenticateToken, requireRole(['Super Admin']), updateConfig)
  34:router.get('/audit', authenticateToken, requireRole(['Super Admin', 'Admin']), getAuditHistory)
```

### prospect.routes.js

```
  30:router.get('/lead-sources', getLeadSources)
  33:router.get('/dropdown', getProspectsForDropdown)
  36:router.get('/stale/summary', async (req, res) => {
  46:router.get('/stale/needs-followup', async (req, res) => {
  56:router.post('/stale/run-detection', async (req, res) => {
  71:router.get('/lost/analysis', async (req, res) => {
  82:router.get('/lost/reasons', async (req, res) => {
  90:router.get('/', getProspects)
  91:router.get('/:id', getProspect)
  92:router.post('/', createProspect)
  93:router.put('/:id', updateProspect)
  94:router.post('/:id/convert-to-client', convertProspectToClient)
  95:router.get('/client/:client_id/prospects', getProspectsByClient)
  96:router.get('/prms/check', checkPRMSClient)
  99:router.post('/from-opportunity/:opportunity_id', createProspectFromOpportunity)
  102:router.post('/:id/mark-lost', async (req, res) => {
  125:router.post('/:id/activity', async (req, res) => {
```

### prospectClientCreation.routes.js

```
  17:router.post('/submit', authenticateToken, submitClientCreationRequest)
  20:router.get('/pending', authenticateToken, requireRole('Admin', 'Super Admin'), getPendingClientCreationRequests)
  23:router.get('/:id', authenticateToken, getClientCreationRequestById)
  26:router.put('/:id', authenticateToken, requireRole('Admin', 'Super Admin'), updateClientCreationRequest)
  29:router.post('/:id/complete', authenticateToken, requireRole('Admin', 'Super Admin'), completeClientCreation)
  32:router.get('/coi/:coiRequestId', authenticateToken, getClientCreationRequestsForCOI)
  35:router.post('/:requestId/attachments', authenticateToken, uploadClientCreationAttachment)
  36:router.get('/:requestId/attachments', authenticateToken, getClientCreationAttachments)
```

### reportSharing.routes.js

```
  18:router.post('/:role/:reportType/share', authenticateToken, createShare)
  24:router.get('/share/:token', accessSharedReport)
  30:router.delete('/share/:token', authenticateToken, revokeShareLink)
  36:router.get('/share/:token/activity', authenticateToken, getShareActivityLog)
  42:router.get('/shares', authenticateToken, getMyShares)
  48:router.post('/:role/:reportType/share/email', authenticateToken, sendReportEmail)
```

### reports.routes.js

```
  26:router.post('/:role/:reportType', reportGenerationRateLimiter, validateReportFilters, (req, res, next) => {
  52:router.post('/:role/:reportType/export/pdf', reportExportRateLimiter, validateReportFilters, validateExportSize, (req, res, next) => {
  77:router.post('/:role/:reportType/export/excel', reportExportRateLimiter, validateReportFilters, validateExportSize, (req, res, next) => {
```

### serviceCatalog.routes.js

```
  29:router.get('/global', getGlobalCatalog)
  32:router.get('/entity/:entityCode', getEntityCatalog)
  35:router.post('/entity/:entityCode/enable', enableServiceForEntity)
  36:router.post('/entity/:entityCode/disable/:serviceCode', disableServiceForEntity)
  39:router.post('/entity/:entityCode/custom', addCustomService)
  40:router.put('/entity/:entityCode/service/:serviceCode', updateEntityService)
  41:router.delete('/entity/:entityCode/service/:serviceCode', deleteCustomService)
  44:router.get('/history/:entityCode', getCatalogHistory)
  47:router.post('/entity/:entityCode/import-excel', async (req, res) => {
  70:router.get('/entity/:entityCode/export-excel', async (req, res) => {
  87:router.post('/entity/:entityCode/copy-from/:sourceEntityCode', async (req, res) => {
  112:router.post('/entity/:entityCode/bulk-enable', async (req, res) => {
  140:router.post('/entity/:entityCode/bulk-disable', async (req, res) => {
```

### sla.routes.js

```
  31:router.get('/status/:requestId', authenticateToken, getRequestSLAStatus)
  34:router.get('/config', authenticateToken, requireRole(['Super Admin', 'Admin', 'Compliance']), getAllConfigs)
  35:router.get('/config/:stageId', authenticateToken, requireRole(['Super Admin', 'Admin', 'Compliance']), getConfigForStage)
  38:router.put('/config/:configId', authenticateToken, requireRole(['Super Admin']), updateConfig)
  41:router.get('/calendar', authenticateToken, requireRole(['Super Admin', 'Admin']), getCalendar)
  42:router.post('/calendar/sync', authenticateToken, requireRole(['Super Admin']), syncCalendar)
  45:router.post('/check', authenticateToken, requireRole(['Super Admin', 'Admin']), triggerCheck)
  46:router.get('/breaches', authenticateToken, requireRole(['Super Admin', 'Admin', 'Compliance']), getBreaches)
```

## Summary

- **Route files:** 23
- **Total route definitions:** 0
