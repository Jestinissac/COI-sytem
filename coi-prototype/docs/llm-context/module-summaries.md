# COI Prototype — Module Summaries

_Generated on 2026-02-07 11:45_

Each section shows a file's imports, exports, and function signatures.

## Backend Controllers

### backend/src/controllers/analyticsController.js (174 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { isProduction, getEnvironment } from '../config/environment.js'
3:import { getUserById } from '../utils/userUtils.js'
```

**Exports:**
```
171:export default {
```

---

### backend/src/controllers/attachmentController.js (215 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { getUserById } from '../utils/userUtils.js'
3:import fs from 'fs'
4:import path from 'path'
5:import { fileURLToPath } from 'url'
```

---

### backend/src/controllers/authController.js (452 lines)

**Imports:**
```
1:import jwt from 'jsonwebtoken'
2:import { getDatabase } from '../database/init.js'
3:import { 
```

**Exports:**
```
348:export function logAuditAction(userId, action, entityType, entityId, details, ipAddress) {
```

**Functions / Methods:**
```
145:  logAuditAction(req.userId, 'Create User', 'User', result.lastInsertRowid, { email, role, department }, req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1')
185:  logAuditAction(req.userId, 'Update User', 'User', id, { email: email || user.email, changes: req.body }, req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1')
207:  logAuditAction(req.userId, 'Disable User', 'User', id, { email: user.email }, req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1')
225:  logAuditAction(req.userId, 'Enable User', 'User', id, { email: user.email }, req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1')
```

---

### backend/src/controllers/changeManagementController.js (368 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { analyzeFieldChange, generateImpactReport, updateImpactCache, getRulesEngineStatus as getImpactStatus } from '../services/impactAnalysisService.js'
3:import { validateFieldRemoval, validateFieldTypeChange, validateFieldRename, checkDataIntegrity } from '../services/dataConsistencyService.js'
4:import { validateWithFallback, emergencyBypass, getRulesEngineStatus, resetRulesEngine, performHealthCheck } from '../services/rulesEngineService.js'
```

---

### backend/src/controllers/coiController.js (2224 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { getFilteredRequests } from '../middleware/dataSegregation.js'
3:import { checkDuplication, checkGroupConflicts, checkInternationalOperationsConflicts } from '../services/duplicationCheckService.js'
4:import { sendApprovalNotification, sendRejectionNotification, sendEngagementCodeNotification, sendProposalExecutedNotification, sendNeedMoreInfoNotification, sendEmail } from '../services/notificationService.js'
5:import { notifyRequestSubmitted, notifyDirectorApprovalRequired, notifyComplianceReviewRequired, notifyGroupConflictFlagged } from '../services/emailService.js'
6:import { generateEngagementCode as generateCode } from '../services/engagementCodeService.js'
7:import { updateMonitoringDays, getApproachingLimitRequests, getExceededLimitRequests } from '../services/monitoringService.js'
8:import { evaluateRules } from '../services/businessRulesEngine.js'
9:import FieldMappingService from '../services/fieldMappingService.js'
10:import { parseRecommendations, logComplianceDecision } from '../services/auditTrailService.js'
11:import { getUserById } from '../utils/userUtils.js'
12:import { mapResponseForRole } from '../utils/responseMapper.js'
13:import { validateGroupStructure, GroupStructureValidationError } from '../validators/groupStructureValidator.js'
14:import { validateCompanyRelationship, CompanyRelationshipValidationError } from '../validators/companyRelationshipValidator.js'
15:import { isClientParentTBDOrEmpty } from './parentCompanyUpdateController.js'
16:import { mapServiceTypeToCMA } from '../services/cmaConflictMatrix.js'
17:import { eventBus, EVENT_TYPES } from '../services/eventBus.js'
18:import { logFunnelEvent, logStatusChange, FUNNEL_STAGES } from '../services/funnelTrackingService.js'
```

**Functions / Methods:**
```
60:function getCurrentFormVersion() {
71:function getFieldMappings() {
```

---

### backend/src/controllers/complianceController.js (280 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { getUserById } from '../utils/userUtils.js'
```

**Functions / Methods:**
```
180:async function fetchPRMSEngagements(clientId) {
226:async function fetchAllPRMSEngagements(filters = {}) {
```

---

### backend/src/controllers/configController.js (1906 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { analyzeFieldChange, updateImpactCache, analyzeRuleChange } from '../services/impactAnalysisService.js'
3:import { validateWithFallback } from '../services/rulesEngineService.js'
4:import { 
```

**Exports:**
```
703:export function validateRule(rule) {
```

**Functions / Methods:**
```
24:function flagAffectedRequests(ruleId, ruleName) {
412:function normalizeValue(value) {
434:function identifyDuplicates(rules) {
1731:function evaluateSingleCondition(rule, request) {
1789:function evaluateCondition(fieldValue, operator, conditionValue) {
```

---

### backend/src/controllers/countriesController.js (68 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
```

---

### backend/src/controllers/emailConfigController.js (292 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { sendTestEmail, clearEmailConfigCache } from '../services/emailService.js'
```

---

### backend/src/controllers/engagementController.js (269 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { generateEngagementCode } from '../services/engagementCodeService.js'
3:import { sendEmail } from '../services/emailService.js'
```

---

### backend/src/controllers/entityCodesController.js (230 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { getUserById } from '../utils/userUtils.js'
```

---

### backend/src/controllers/executionController.js (468 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js';
2:import { getUserById } from '../utils/userUtils.js';
3:import { sendEmail } from '../services/notificationService.js';
4:import { notifyClientAcceptedProposal, notifyClientRejectedProposal } from '../services/emailService.js';
5:import { createRenewalTracking } from '../services/monitoringService.js';
```

**Functions / Methods:**
```
11:function canUserUpdateRequest(userId, userRole, userDept, request) {
```

---

### backend/src/controllers/globalCOIController.js (225 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js';
```

---

### backend/src/controllers/globalCOIFormController.js (199 lines)

**Imports:**
```
1:import { generateGlobalCOIFormExcel } from '../services/excelExportService.js'
2:import { getDatabase } from '../database/init.js'
3:import { validateInternationalOperationsEntities, CompanyRelationshipValidationError } from '../validators/companyRelationshipValidator.js'
```

**Functions / Methods:**
```
79:async function generateGlobalCOIFormExcelFromData(requestData) {
177:function extractCategory(serviceType) {
```

---

### backend/src/controllers/integrationController.js (113 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
```

**Functions / Methods:**
```
6:function normalizeParentForPrefill (value) {
```

---

### backend/src/controllers/isqmController.js (150 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js';
```

---

### backend/src/controllers/loadTestController.js (324 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { queueNotification, flushNotificationBatch, getNoiseReductionStats } from '../services/notificationService.js'
3:import { eventBus, EVENT_TYPES } from '../services/eventBus.js'
4:import { isLoadTestingAllowed, getEnvironment, getEnvironmentConfig } from '../config/environment.js'
```

**Exports:**
```
320:export default {
```

**Functions / Methods:**
```
199:function getOrCreateTestUsers(count) {
216:function getOrCreateTestClients(count) {
254:function createSyntheticRequest(user, client, index) {
281:function generateSyntheticNotifications(requestId, requester, allUsers) {
```

---

### backend/src/controllers/myDayWeekController.js (181 lines)

**Imports:**
```
1:import { getMyDay, getMyWeek, getMyMonth } from '../services/myDayWeekService.js'
2:import { getUserById } from '../utils/userUtils.js'
3:import { mapResponseForRole } from '../utils/responseMapper.js'
4:import { getDatabase } from '../database/init.js'
```

**Functions / Methods:**
```
148:function formatEventMessage(eventType) {
164:function getEventPriority(eventType) {
```

---

### backend/src/controllers/parentCompanyUpdateController.js (230 lines)

**Imports:**
```
6:import { getDatabase } from '../database/init.js'
```

**Exports:**
```
17:export function isClientParentTBDOrEmpty (clientId) {
```

**Functions / Methods:**
```
10:function getUserById (id) {
```

---

### backend/src/controllers/priorityController.js (340 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { getUserById } from '../utils/userUtils.js'
3:import { getFilteredRequests } from '../middleware/dataSegregation.js'
4:import {
```

**Exports:**
```
333:export default {
```

---

### backend/src/controllers/prospectClientCreationController.js (583 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { sendEmail } from '../services/emailService.js'
3:import { getUserById } from '../utils/userUtils.js'
4:import { logFunnelEvent, FUNNEL_STAGES } from '../services/funnelTrackingService.js'
```

---

### backend/src/controllers/prospectController.js (620 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { getUserById } from '../utils/userUtils.js'
3:import { logFunnelEvent, FUNNEL_STAGES, getLeadSourceIdOrDefault } from '../services/funnelTrackingService.js'
```

**Functions / Methods:**
```
16:function autoDetectLeadSource(params, user) {
```

---

### backend/src/controllers/reportController.js (450 lines)

**Imports:**
```
1:import {
20:import { generatePDFReport } from '../services/pdfExportService.js'
21:import { generateReportExcel } from '../services/excelExportService.js'
22:import { logAuditTrail } from '../services/auditTrailService.js'
23:import { getCachedReportData, cacheReportData } from '../services/reportCacheService.js'
```

---

### backend/src/controllers/reportSharingController.js (231 lines)

**Imports:**
```
5:import {
12:import { logAuditTrail } from '../services/auditTrailService.js'
```

---

### backend/src/controllers/serviceCatalogController.js (529 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { getUserById } from '../utils/userUtils.js'
```

**Functions / Methods:**
```
509:function logCatalogHistory(entityName, serviceCode, action, oldValue, newValue, changedBy, changeReason) {
```

---

### backend/src/controllers/serviceTypeController.js (508 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { getCMAMetadataForService } from '../services/cmaConflictMatrix.js'
3:import { getAllAmbiguousServiceConfigs } from '../config/ambiguousServiceConfig.js'
```

**Functions / Methods:**
```
12:function buildKuwaitTemplateList() {
252:function buildFullGlobalList() {
```

---

### backend/src/controllers/slaController.js (392 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import {
13:import {
```

**Exports:**
```
383:export default {
```

---

## Backend Services

### backend/src/services/adIntegrationService.js (50 lines)

**Imports:**
```
7:import { getDatabase } from '../database/init.js'
```

**Exports:**
```
18:export function getApproversFromAD(context) {
```

---

### backend/src/services/auditTrailService.js (217 lines)

**Imports:**
```
6:import { getDatabase } from '../database/init.js'
```

**Exports:**
```
13:export function logComplianceDecision({
87:export function getAuditTrail(requestId) {
111:export function parseRecommendations(request) {
129:export function logAuditTrail(userId, entityType, entityId, actionType, description, metadata = {}) {
168:export function getGeneralAuditTrail(filters = {}) {
212:export default {
```

---

### backend/src/services/businessRulesEngine.js (505 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { checkRedLines } from './redLinesService.js'
3:import { evaluateIESBADecisionMatrix } from './iesbaDecisionMatrix.js'
4:import FieldMappingService from './fieldMappingService.js'
5:import { isCMARegulated } from './cmaConflictMatrix.js'
```

**Exports:**
```
15:export function evaluateRules(requestData) {
484:export function getRuleExecutionHistory(requestId) {
```

**Functions / Methods:**
```
163:function mapActionToRecommendation(actionType) {
178:function getConfidenceLevel(rule) {
193:function canOverrideAction(rule) {
207:function getOverrideGuidance(rule) {
220:function getRegulationReference(rule) {
255:function evaluateRule(rule, requestData) {
288:function evaluateConditionGroups(rule, requestData) {
372:function evaluateCondition(fieldValue, operator, conditionValue) {
445:function getReason(rule, requestData) {
455:function logRuleExecutions(executionLogs, requestId) {
```

---

### backend/src/services/catalogImportService.js (302 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { getUserById } from '../utils/userUtils.js'
```

---

### backend/src/services/clientValidationService.js (360 lines)

**Imports:**
```
15:import { getDatabase } from '../database/init.js'
```

**Exports:**
```
50:export function validateClientForCOIRequest(clientId, options = {}) {
259:export function validateClientsBatch(clientIds, options = {}) {
295:export function getClientEligibilitySummary(clientId) {
```

---

### backend/src/services/cmaConflictMatrix.js (345 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
```

**Exports:**
```
113:export function isCMARegulated(clientData, requestData = null) {
131:export function mapServiceTypeToCMA(serviceTypeName) {
172:export function getCMAMetadataForService(serviceTypeName) {
185:export function checkCMARules(serviceA, serviceB, clientData = null, requestData = null) {
255:export function getCMAServiceTypes() {
274:export function getCMAServiceTypesGrouped() {
323:export function getCMARule(serviceACode, serviceBCode) {
```

---

### backend/src/services/configService.js (206 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
```

**Exports:**
```
28:export function getSystemEdition() {
33:export function setSystemEdition(edition, userId) {
61:export function isFeatureEnabled(featureName) {
67:export function getEditionFeatures() {
72:export function getAllFeatures() {
76:export function isProEdition() {
81:export function isStandardEdition() {
97:export function isClientIntelligenceEnabled() {
129:export function enableClientIntelligence(userId) {
158:export function disableClientIntelligence(userId) {
182:export function getClientIntelligenceStatus() {
```

---

### backend/src/services/dataConsistencyService.js (252 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { getAffectedRequests } from './impactAnalysisService.js'
```

**Exports:**
```
6:export function validateFieldRemoval(fieldId) {
65:export function validateFieldTypeChange(fieldId, newType) {
126:export function validateFieldRename(oldFieldId, newFieldId) {
169:export function checkDataIntegrity(fieldId) {
217:export function validateRequiredStatusChange(fieldId, newRequiredStatus) {
```

---

### backend/src/services/duplicationCheckService.js (870 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { checkRedLines } from './redLinesService.js'
3:import { evaluateIESBADecisionMatrix } from './iesbaDecisionMatrix.js'
4:import { checkCMARules } from './cmaConflictMatrix.js'
```

**Exports:**
```
870:export { calculateSimilarity }
```

**Functions / Methods:**
```
147:function checkServiceTypeConflict(existingServiceType, newServiceType, clientData = null, requestData = null) {
192:async function checkRelatedPartyConflicts(clientName, newServiceType, excludeRequestId) {
255:function extractBaseName(clientName) {
267:function calculateSimilarity(str1, str2) {
337:function normalizeString(str) {
345:function expandAbbreviations(str) {
379:function levenshteinDistance(str1, str2) {
407:function getMatchReason(score) {
425:function isAuditServiceType(serviceType) {
749:function findEntitiesWithParent(parentName, excludeRequestId, db) {
789:function findMultiLevelRelationships(parentName, excludeRequestId, db) {
825:function evaluateIndependenceConflict(requestedService, existingService, existingPIE, requestedPIE) {
```

---

### backend/src/services/emailService.js (871 lines)

**Imports:**
```
1:import nodemailer from 'nodemailer'
2:import { getDatabase } from '../database/init.js'
```

**Exports:**
```
847:export function clearEmailConfigCache() {
853:export default {
```

**Functions / Methods:**
```
17:function getEmailConfig() {
72:function isEmailEnabled() {
465:function getTransporter() {
481:function parseTemplate(template, variables) {
```

---

### backend/src/services/engagementCodeService.js (227 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
```

**Exports:**
```
60:export function validateEngagementCode(engagementCode, options = {}) {
202:export function validateEngagementCodesBatch(engagementCodes, options = {}) {
```

---

### backend/src/services/eventBus.js (130 lines)

**Imports:**
```
1:import EventEmitter from 'events'
2:import { getDatabase } from '../database/init.js'
```

**Exports:**
```
76:export const eventBus = new COIEventBus()
79:export const EVENT_TYPES = {
98:export const SLA_EVENTS = {
109:export function emitEvent(eventType, payload) {
121:export function onEvent(eventType, handler) {
128:export function offEvent(eventType, handler) {
```

**Functions / Methods:**
```
11:class COIEventBus extends EventEmitter {
12:  constructor() {
20:  emitEvent(eventType, data) {
47:  async logEvent(event) {
```

---

### backend/src/services/excelExportService.js (436 lines)

**Imports:**
```
1:import ExcelJS from 'exceljs'
2:import { getDatabase } from '../database/init.js'
```

**Exports:**
```
9:export function mapCOIRequestToGlobalForm(coiRequest, client) {
```

**Functions / Methods:**
```
41:function extractCategory(serviceType) {
```

---

### backend/src/services/fieldMappingService.js (389 lines)

**Imports:**
```
12:import { getDatabase } from '../database/init.js'
```

**Exports:**
```
389:export default FieldMappingService
```

**Functions / Methods:**
```
18:function getClientExistingEngagements(clientId, excludeRequestId = null) {
46:function getDaysBetween(startDate, endDate) {
57:function getYearsBetween(startDate, endDate) {
69:function parseNumeric(value) {
78:function parseBoolean(value) {
94:  getValue(requestData, fieldName) {
326:  getMultipleValues(requestData, fieldNames) {
340:  prepareForRuleEvaluation(requestData) {
```

---

### backend/src/services/fileUploadService.js (345 lines)

**Imports:**
```
1:import fs from 'fs'
2:import path from 'path'
3:import { getDatabase } from '../database/init.js'
4:import { logAuditTrail } from './auditTrailService.js'
```

**Exports:**
```
49:export function validateFile(file) {
144:export function getFile(fileId) {
152:export function getFilesForRequest(requestId) {
164:export function getISQMDocuments(filters = {}) {
193:export function deleteFile(fileId, userId) {
230:export function linkFileToRequest(fileId, requestId, userId) {
248:export function getFileStatistics() {
287:export function getISQMDocumentTypes() {
334:export default {
```

**Functions / Methods:**
```
29:function ensureUploadDirs() {
```

---

### backend/src/services/funnelTrackingService.js (412 lines)

**Imports:**
```
19:import { getDatabase } from '../database/init.js'
```

**Exports:**
```
26:export const FUNNEL_STAGES = {
43:export function mapStatusToStage(status) {
62:export function getLastEventTimestamp(prospectId, coiRequestId) {
90:export function calculateDaysInStage(fromTimestamp, toTimestamp = new Date().toISOString()) {
117:export function logFunnelEvent({
184:export function logStatusChange({
238:export function getFunnelEvents(prospectId, coiRequestId = null) {
272:export function getFunnelStageCounts(dateFrom = null, dateTo = null) {
306:export function getConversionFunnelMetrics(dateFrom = null, dateTo = null) {
366:export function getLeadSourceIdOrDefault(sourceCode) {
386:export function getLeadSources() {
400:export default {
```

---

### backend/src/services/hrmsIntegrationService.js (92 lines)

**Imports:**
```
7:import { getDatabase } from '../database/init.js'
```

---

### backend/src/services/iesbaDecisionMatrix.js (121 lines)

**Exports:**
```
11:export function evaluateIESBADecisionMatrix(requestData) {
95:export function involvesManagementResponsibility(requestData) {
112:export function getRequiredSafeguards(requestData) {
```

---

### backend/src/services/impactAnalysisService.js (871 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
```

**Exports:**
```
10:export function analyzeFieldChange(fieldId, changeType) {
103:export function getAffectedRequests(fieldId) {
136:export function getDependencies(fieldId) {
236:export function validateChange(fieldId, newConfig) {
303:export function generateImpactReport(fieldId, changeType) {
321:export function updateImpactCache(fieldId) {
369:export function updateRulesEngineHealth(status, error) {
394:export function getRulesEngineStatus() {
405:export function resetRulesEngine() {
416:export function analyzeRuleChange(ruleId, proposedChanges) {
```

**Functions / Methods:**
```
146:function getFieldDependencies(fieldId) {
184:function getWorkflowDependencies(fieldId) {
214:function getBusinessRuleDependencies(fieldId) {
225:function getTemplateDependencies(fieldId) {
292:function checkDataTypeCompatibility(oldType, newType) {
408:  updateRulesEngineHealth('healthy', null)
587:function findMatchingRequests(rule) {
640:function evaluateRuleMatch(rule, requestData) {
661:function getFieldValueForRule(requestData, fieldId) {
684:function evaluateConditionForRule(fieldValue, operator, conditionValue) {
719:function determineChangeType(currentRule, proposedChanges) {
757:function calculateRuleChangeRisk(impact, currentRule, proposedChanges) {
```

---

### backend/src/services/mlPriorityService.js (231 lines)

**Imports:**
```
1:import { execFile } from 'child_process'
2:import { promisify } from 'util'
3:import { join, dirname } from 'path'
4:import { fileURLToPath } from 'url'
5:import { getDatabase } from '../database/init.js'
6:import { calculateSLAStatus } from './slaService.js'
```

**Exports:**
```
217:export function isMLModelAvailable() {
224:export function getMLModelInfo() {
```

**Functions / Methods:**
```
186:async function logPrediction(requestId, prediction, method) {
```

---

### backend/src/services/monitoringService.js (1005 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { notifyEngagementExpiring, notifyProposalMonitoringAlert, notifyProposalLapsed } from './emailService.js'
3:import { logAuditTrail } from './auditTrailService.js'
```

**Exports:**
```
11:export function updateMonitoringDays() {
44:export function getApproachingLimitRequests(daysRemaining = 25) {
64:export function getExceededLimitRequests() {
83:export function createRenewalTracking(requestId, renewalData) {
100:export function sendIntervalAlerts() {
258:export function checkRenewalAlerts() {
262:export function getMonitoringAlertsSummary() {
844:export function getMonitoringDashboard() {
969:export function startMonitoringScheduler() {
988:export function stopMonitoringScheduler() {
996:export default {
```

**Functions / Methods:**
```
626:async function notifyEngagementRenewal(engagement, recipient, daysUntilRenewal) {
985:  runScheduledTasks()
```

---

### backend/src/services/myDayWeekService.js (598 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { getFilteredRequests } from '../middleware/dataSegregation.js'
3:import { calculatePriority, PRIORITY_LEVEL } from './priorityService.js'
4:import { calculateSLAStatus, SLA_STATUS } from './slaService.js'
```

**Exports:**
```
123:export function getMyWeek(user) {
439:export function getMyMonth(user) {
```

**Functions / Methods:**
```
197:function needsMyActionToday(request, user) {
267:function needsMyActionThisWeek(request, user, daysPending) {
288:function isOverdue(request, daysPending, user) {
315:function isExpiringToday(request, todayStr) {
336:function isExpiringThisWeek(request, today, weekFromNow) {
356:function getActionType(request, user) {
395:function getDueDate(request, createdDate) {
420:function getExpiryDate(request) {
528:function needsMyActionThisMonth(request, user, daysPending) {
542:function isExpiringThisMonth(request, today, monthFromNow) {
562:function getDueDateForMonth(request, createdDate) {
585:function getExpiryDateForMonth(request) {
```

---

### backend/src/services/notificationService.js (1291 lines)

**Imports:**
```
1:import { appendFileSync } from 'fs'
2:import { getDatabase } from '../database/init.js'
3:import { calculatePriority, PRIORITY_LEVEL } from './priorityService.js'
4:import { getApproversFromAD } from './adIntegrationService.js'
```

**Exports:**
```
47:export function queueNotification(recipientId, notificationType, payload, isUrgent = false) {
372:export function getNoiseReductionStats(days = 7) {
667:export function sendEmail(to, subject, body, metadata = {}) {
693:export function sendApprovalNotification(requestId, approverName, nextRole, restrictions = null) {
782:export function sendNeedMoreInfoNotification(requestId, approverName, infoRequired) {
812:export function sendRejectionNotification(requestId, rejectorName, reason, rejectionType = 'fixable', rejectionCategory = null) {
854:export function sendEngagementCodeNotification(requestId, engagementCode) {
935:export function sendProposalExecutedNotification(requestId, projectId) {
1062:export function sendApproverUnavailableNotification(requestId, approverName, approverRole, unavailableReason, unavailableUntil) {
1115:export function handleSLAWarning(payload) {
1156:export function handleSLACritical(payload) {
1197:export function handleSLABreach(payload) {
1276:export function initSLANotificationHandlers() {
```

**Functions / Methods:**
```
94:async function sortNotificationsByPriority(notifications) {
198:async function filterNotificationsByPriority(notifications, maxItems = null) {
433:async function buildDigestBody(recipientName, notifications) {
568:function getBatchId() {
580:function updateNotificationStats(updates) {
628:function ensureNotificationQueueTable() {
647:function ensureNotificationStatsTable() {
881:  sendEmail(request.requester_email, requesterSubject, requesterBody, { requestId, engagementCode })
965:function getNextApprover(department, role, requestId = null) {
1050:function sendEscalationNotification(role, department, admins) {
1119:  queueNotification(requesterId, 'SLA_WARNING', {
1160:  queueNotification(requesterId, 'SLA_CRITICAL', {
1203:  queueNotification(requesterId, 'SLA_BREACH', {
1260:function getApproverRoleForStage(stage) {
```

---

### backend/src/services/pdfExportService.js (163 lines)

**Imports:**
```
1:import PDFDocument from 'pdfkit'
```

**Exports:**
```
6:export function generatePDFReport(reportData, reportType, reportTitle, filters = {}) {
```

---

### backend/src/services/permissionService.js (269 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
```

**Exports:**
```
14:export function checkPermission(userRole, permissionKey) {
43:export function getRolePermissions(role) {
78:export function grantPermission(role, permissionKey, grantedBy) {
136:export function revokePermission(role, permissionKey, revokedBy, reason = null) {
178:export function getAllPermissions() {
194:export function getPermissionsByCategory(category) {
211:export function getPermissionAuditLog(filters = {}) {
257:export function hasAnyPermission(userRole, permissionKeys) {
267:export function hasAllPermissions(userRole, permissionKeys) {
```

---

### backend/src/services/priorityService.js (396 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { calculateSLAStatus, calculateDeadlineStatus, SLA_STATUS } from './slaService.js'
3:import { 
```

**Exports:**
```
15:export const PRIORITY_LEVEL = {
25:export function getActiveConfig() {
44:export function getFactorConfig(factorId) {
101:export function calculatePriorityWithRules(request) {
192:export function getLevel(score) {
202:export function getLevelThresholds() {
214:export function updateWeight(factorId, newWeight, userId, reason = '') {
245:export function updateValueMappings(factorId, newMappings, userId, reason = '') {
277:export function toggleFactorActive(factorId, isActive, userId, reason = '') {
304:export function getFactorAuditHistory(factorId, limit = 50) {
322:export function getAllAuditHistory(limit = 100) {
339:export function calculatePrioritiesBatch(requests) {
380:export default {
```

**Functions / Methods:**
```
150:function extractValue(request, factorId, slaStatus = null) {
```

---

### backend/src/services/redLinesService.js (153 lines)

**Exports:**
```
11:export function checkRedLines(requestData) {
```

**Functions / Methods:**
```
68:function isManagementResponsibilityViolation(requestData) {
97:function isAdvocacyViolation(requestData) {
119:function isContingentFeeViolation(requestData) {
```

---

### backend/src/services/regulationService.js (409 lines)

**Exports:**
```
211:export function getRegulation(codeOrAlias) {
219:export function getAllRegulations() {
229:export function searchRegulations(keyword) {
249:export function getRegulationsBySeverity(severity) {
261:export function getRegulationsByJurisdiction(jurisdiction) {
275:export function enrichRegulationReference(referenceText) {
319:export function getApplicableRegulations(serviceType, isPIE = false, jurisdiction = 'International') {
373:export function formatRegulationForUI(regulation) {
399:export default {
```

**Functions / Methods:**
```
389:function getSeverityColor(severity) {
```

---

### backend/src/services/reportCacheService.js (138 lines)

**Exports:**
```
28:export function getCachedReport(key) {
44:export function setCachedReport(key, data, ttl = CACHE_TTL.PAGINATED) {
55:export function cacheReportData(role, reportType, filters, data, cacheType = 'PAGINATED') {
70:export function getCachedReportData(role, reportType, filters) {
78:export function invalidateReportCache(role, reportType) {
90:export function invalidateAllReportCaches() {
101:export function cleanupExpiredCache() {
116:export function getCacheStats() {
```

**Functions / Methods:**
```
20:function generateCacheKey(role, reportType, filters) {
```

---

### backend/src/services/reportDataService.js (1817 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { getUserById } from '../utils/userUtils.js'
3:import { calculatePagination, getCountQuery, formatPaginationResponse } from '../utils/pagination.js'
4:import { isProduction } from '../config/environment.js'
```

**Exports:**
```
97:export function getRequesterSummaryReport(userId, filters = {}) {
304:export function getDirectorOverviewReport(userId, filters = {}) {
409:export function getComplianceSummaryReport(userId, filters = {}) {
487:export function getPartnerPendingApprovalsReport(userId, filters = {}) {
536:export function getEngagementCodeSummaryReport(userId, filters = {}) {
619:export function getSystemOverviewReport(userId, filters = {}) {
677:export function getProspectConversionReport(userId, filters = {}) {
782:export function getLeadSourceEffectivenessReport(userId, filters = {}) {
932:export function getFunnelPerformanceReport(userId, filters = {}) {
1031:export function getInsightsToConversionReport(userId, filters = {}) {
1136:export function getAttributionByUserReport(userId, filters = {}) {
1251:export function getPipelineForecastReport(userId, filters = {}) {
1371:export function getConversionTrendsReport(userId, filters = {}) {
1502:export function getPeriodComparisonReport(userId, filters = {}) {
1655:export function getLostProspectAnalysisReport(userId, filters = {}) {
```

**Functions / Methods:**
```
16:function applyRoleFilters(user, baseQuery, params = []) {
46:function applyDateFilter(query, params, dateFrom, dateTo, dateColumn = 'r.created_at') {
62:function getBaseRequestQuery() {
```

---

### backend/src/services/reportSharingService.js (283 lines)

**Imports:**
```
6:import { getDatabase } from '../database/init.js'
7:import crypto from 'crypto'
8:import bcrypt from 'bcryptjs'
```

**Exports:**
```
67:export function createReportShare(userId, reportType, reportFilters, options = {}) {
118:export function getSharedReport(shareToken, options = {}) {
204:export function revokeShare(shareToken, userId) {
231:export function getShareActivity(shareToken, userId) {
260:export function getUserShares(userId) {
```

**Functions / Methods:**
```
15:function ensureTablesExist() {
60:function generateShareToken() {
68:  ensureTablesExist()
119:  ensureTablesExist()
170:  logShareAccess(share.id, userId, ipAddress, options.userAgent)
184:function logShareAccess(shareId, userId, ipAddress, userAgent) {
185:  ensureTablesExist()
205:  ensureTablesExist()
232:  ensureTablesExist()
261:  ensureTablesExist()
```

---

### backend/src/services/rulesEngineService.js (244 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { updateRulesEngineHealth, resetRulesEngine as resetImpactEngine } from './impactAnalysisService.js'
```

**Exports:**
```
11:export function checkRulesEngineHealth() {
163:export function emergencyBypass(changeId, userId, reason) {
205:export function getRulesEngineStatus() {
220:export function resetRulesEngine() {
235:export function performHealthCheck() {
```

**Functions / Methods:**
```
137:function basicFieldValidation(fieldId, change) {
223:  updateRulesEngineHealth('healthy', null)
224:  resetImpactEngine()
```

---

### backend/src/services/similarCasesService.js (473 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
```

**Exports:**
```
21:export function findSimilarCases(requestId, options = {}) {
402:export function findCasesByCriteria(criteria) {
452:export function getClientDecisionHistory(clientId) {
```

**Functions / Methods:**
```
103:function calculateSimilarityScores(target, historical) {
142:function calculateTotalScore(scores) {
155:function calculateNameSimilarity(name1, name2) {
179:function normalizeCompanyName(name) {
191:function levenshteinDistance(str1, str2) {
218:function calculateServiceTypeSimilarity(type1, type2) {
244:function parseInternationalOps(ops) {
256:function calculateInternationalSimilarity(ops1, ops2) {
281:function calculateOwnershipSimilarity(struct1, struct2) {
308:function safeParseJSON(str) {
319:function areSimilarIndustries(ind1, ind2) {
343:function formatCaseForUI(caseData) {
368:function aggregateSimilarCasesStats(cases) {
```

---

### backend/src/services/slaMonitorService.js (300 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
2:import { calculateSLAStatus, SLA_STATUS } from './slaService.js'
3:import { emitEvent, SLA_EVENTS } from './eventBus.js'
```

**Exports:**
```
145:export function logBreach(request, slaStatus) {
190:export function resolveBreach(requestId, workflowStage = null) {
229:export function getBreachHistory(requestId) {
242:export function getUnresolvedBreaches() {
264:export function getBreachStats(startDate, endDate) {
287:export function clearCache() {
291:export default {
```

---

### backend/src/services/slaService.js (430 lines)

**Imports:**
```
1:import { getDatabase } from '../database/init.js'
```

**Exports:**
```
9:export const SLA_STATUS = {
20:export function getSLAConfig(workflowStage, serviceType = null, isPIE = null) {
94:export function calculateBusinessHours(startDate, endDate = new Date()) {
142:export function calculateElapsedHours(startDate, endDate = new Date()) {
155:export function calculateSLAStatus(request) {
216:export function getEffectiveDeadline(request) {
246:export function calculateDeadlineStatus(externalDeadline) {
277:export function getAllSLAConfigs() {
290:export function updateSLAConfig(configId, updates, userId, reason = '') {
346:export function syncCalendarFromHRMS(holidays) {
379:export function generatePrototypeCalendar(days = 90) {
407:export function getBusinessCalendar(startDate, endDate) {
417:export default {
```

---

### backend/src/services/staleProspectService.js (479 lines)

**Imports:**
```
14:import { getDatabase } from '../database/init.js'
15:import { logFunnelEvent, FUNNEL_STAGES } from './funnelTrackingService.js'
```

**Exports:**
```
29:export const LOST_REASONS = {
46:export function detectStaleProspects() {
72:export function detectProspectsNeedingFollowup() {
99:export function detectStaleProposals() {
131:export function markProspectAsStale(prospectId, reason = LOST_REASONS.STALE) {
167:export function markProposalAsStale(coiRequestId) {
206:export function markProspectAsLost(prospectId, reason, stage = null, userId = null) {
245:export function updateProspectActivity(prospectId) {
266:export function updateCoiRequestActivity(coiRequestId) {
287:export function runStaleDetectionJob() {
350:export function getStaleDetectionSummary() {
395:export function getLostProspectsAnalysis(dateFrom = null, dateTo = null) {
465:export default {
```

---

## Backend Routes

### backend/src/routes/auth.routes.js (44 lines)

**Imports:**
```
1:import express from 'express'
2:import { 
17:import { authenticateToken, requireRole } from '../middleware/auth.js'
```

**Exports:**
```
42:export default router
```

---

### backend/src/routes/changeManagement.routes.js (45 lines)

**Imports:**
```
1:import express from 'express'
2:import { authenticateToken, requireRole } from '../middleware/auth.js'
3:import {
```

**Exports:**
```
43:export default router
```

---

### backend/src/routes/coi.routes.js (424 lines)

**Imports:**
```
1:import express from 'express'
2:import { getDatabase } from '../database/init.js'
3:import { authenticateToken, requireRole } from '../middleware/auth.js'
4:import {
31:import { findSimilarCases, findCasesByCriteria, getClientDecisionHistory } from '../services/similarCasesService.js'
32:import { getRegulation, getAllRegulations, searchRegulations, getApplicableRegulations } from '../services/regulationService.js'
33:import { 
44:import { getFilesForRequest, getISQMDocuments, getISQMDocumentTypes, getFileStatistics } from '../services/fileUploadService.js'
45:import { uploadAttachment, getAttachments, downloadAttachment, deleteAttachment } from '../controllers/attachmentController.js'
46:import multer from 'multer'
47:import path from 'path'
48:import fs from 'fs'
49:import { fileURLToPath } from 'url'
362:import { getMyDay, getMyWeek } from '../services/myDayWeekService.js'
397:import { runLoadTest, getNoiseStats, cleanupLoadTest } from '../controllers/loadTestController.js'
398:import { isLoadTestingAllowed, getEnvironment } from '../config/environment.js'
418:import { getBusinessAnalytics, getPerformanceAnalytics } from '../controllers/analyticsController.js'
```

**Exports:**
```
423:export default router
```

**Functions / Methods:**
```
71:const fileFilter = (req, file, cb) => {
401:const requireLoadTestingEnvironment = (req, res, next) => {
410:  next()
```

---

### backend/src/routes/compliance.routes.js (23 lines)

**Imports:**
```
1:import express from 'express'
2:import { authenticateToken, requireRole } from '../middleware/auth.js'
3:import { getClientServices, getAllClientServices } from '../controllers/complianceController.js'
```

**Exports:**
```
23:export default router
```

**Functions / Methods:**
```
13:  requireRole('Compliance', 'Partner', 'Super Admin'), 
19:  requireRole('Compliance', 'Partner', 'Super Admin'), 
```

---

### backend/src/routes/config.routes.js (119 lines)

**Imports:**
```
1:import express from 'express'
2:import { authenticateToken, requireRole } from '../middleware/auth.js'
3:import {
34:import { getCMAServiceTypes, getCMARule, getCMAServiceTypesGrouped } from '../services/cmaConflictMatrix.js'
```

**Exports:**
```
119:export default router
```

---

### backend/src/routes/countries.routes.js (13 lines)

**Imports:**
```
1:import express from 'express'
2:import { authenticateToken } from '../middleware/auth.js'
3:import { getCountries, getCountry } from '../controllers/countriesController.js'
```

**Exports:**
```
13:export default router
```

---

### backend/src/routes/email.routes.js (28 lines)

**Imports:**
```
1:import { Router } from 'express'
2:import { authenticateToken } from '../middleware/auth.js'
3:import { requireRole } from '../middleware/auth.js'
4:import {
```

**Exports:**
```
28:export default router
```

---

### backend/src/routes/engagement.routes.js (15 lines)

**Imports:**
```
1:import express from 'express'
2:import { authenticateToken } from '../middleware/auth.js'
3:import {
```

**Exports:**
```
15:export default router
```

---

### backend/src/routes/entityCodes.routes.js (31 lines)

**Imports:**
```
1:import express from 'express'
2:import { authenticateToken } from '../middleware/auth.js'
3:import {
```

**Exports:**
```
31:export default router
```

---

### backend/src/routes/execution.routes.js (50 lines)

**Imports:**
```
1:import express from 'express'
2:import { authenticateToken } from '../middleware/auth.js'
3:import {
```

**Exports:**
```
49:export default router
```

---

### backend/src/routes/global.routes.js (44 lines)

**Imports:**
```
1:import express from 'express'
2:import { authenticateToken } from '../middleware/auth.js'
3:import {
11:import { exportGlobalCOIFormExcel } from '../services/excelExportService.js'
12:import { generateExcelFromFormData } from '../controllers/globalCOIFormController.js'
```

**Exports:**
```
43:export default router
```

---

### backend/src/routes/integration.routes.js (104 lines)

**Imports:**
```
1:import express from 'express'
2:import { authenticateToken } from '../middleware/auth.js'
3:import { getClients, validateEngagementCode, getEngagementCodes, createProject } from '../controllers/integrationController.js'
4:import { getServiceTypes, getServiceSubCategories, getAmbiguousServiceConfig } from '../controllers/serviceTypeController.js'
5:import { getDatabase } from '../database/init.js'
```

**Exports:**
```
103:export default router
```

**Functions / Methods:**
```
55:function normalizeParentForPrefill (value) {
```

---

### backend/src/routes/isqm.routes.js (32 lines)

**Imports:**
```
1:import express from 'express'
2:import { authenticateToken } from '../middleware/auth.js'
3:import {
```

**Exports:**
```
31:export default router
```

---

### backend/src/routes/myDayWeek.routes.js (22 lines)

**Imports:**
```
1:import express from 'express'
2:import { authenticateToken } from '../middleware/auth.js'
3:import { getMyDayData, getMyWeekData, getMyMonthData, getEventBusStatus } from '../controllers/myDayWeekController.js'
```

**Exports:**
```
22:export default router
```

---

### backend/src/routes/parentCompanyUpdate.routes.js (34 lines)

**Imports:**
```
1:import express from 'express'
2:import { authenticateToken, requireRole } from '../middleware/auth.js'
3:import {
```

**Exports:**
```
34:export default router
```

---

### backend/src/routes/permission.routes.js (119 lines)

**Imports:**
```
1:import express from 'express'
2:import { authenticateToken, requireRole, requirePermission } from '../middleware/auth.js'
3:import {
```

**Exports:**
```
119:export default router
```

---

### backend/src/routes/priority.routes.js (36 lines)

**Imports:**
```
1:import { Router } from 'express'
2:import { authenticateToken } from '../middleware/auth.js'
3:import { requireRole } from '../middleware/auth.js'
4:import {
```

**Exports:**
```
36:export default router
```

---

### backend/src/routes/prospect.routes.js (139 lines)

**Imports:**
```
1:import express from 'express'
2:import { authenticateToken } from '../middleware/auth.js'
3:import {
15:import {
```

**Exports:**
```
139:export default router
```

---

### backend/src/routes/prospectClientCreation.routes.js (38 lines)

**Imports:**
```
1:import express from 'express'
2:import { authenticateToken, requireRole } from '../middleware/auth.js'
3:import {
```

**Exports:**
```
38:export default router
```

---

### backend/src/routes/reportSharing.routes.js (50 lines)

**Imports:**
```
1:import express from 'express'
2:import { authenticateToken } from '../middleware/auth.js'
3:import {
```

**Exports:**
```
50:export default router
```

---

### backend/src/routes/reports.routes.js (98 lines)

**Imports:**
```
1:import express from 'express'
2:import { authenticateToken, requireRole } from '../middleware/auth.js'
3:import {
7:import {
11:import {
```

**Exports:**
```
98:export default router
```

**Functions / Methods:**
```
45:  next()
70:  next()
95:  next()
```

---

### backend/src/routes/serviceCatalog.routes.js (168 lines)

**Imports:**
```
1:import express from 'express'
2:import { authenticateToken } from '../middleware/auth.js'
3:import {
13:import {
20:import { getUserById } from '../utils/userUtils.js'
21:import { getDatabase } from '../database/init.js'
```

**Exports:**
```
168:export default router
```

---

### backend/src/routes/sla.routes.js (48 lines)

**Imports:**
```
1:import { Router } from 'express'
2:import { authenticateToken } from '../middleware/auth.js'
3:import { requireRole } from '../middleware/auth.js'
4:import {
```

**Exports:**
```
48:export default router
```

---

## Frontend Stores

### frontend/src/stores/auth.ts (184 lines)

**Imports:**
```
1:import { defineStore } from 'pinia'
2:import { ref, computed } from 'vue'
3:import api from '@/services/api'
```

**Exports:**
```
16:export const useAuthStore = defineStore('auth', () => {
```

---

### frontend/src/stores/clients.ts (72 lines)

**Imports:**
```
1:import { defineStore } from 'pinia'
2:import { ref, computed } from 'vue'
3:import api from '@/services/api'
```

**Exports:**
```
16:export const useClientsStore = defineStore('clients', () => {
```

---

### frontend/src/stores/coiRequests.ts (143 lines)

**Imports:**
```
1:import { defineStore } from 'pinia'
2:import { ref } from 'vue'
3:import api from '@/services/api'
```

**Exports:**
```
40:export const useCOIRequestsStore = defineStore('coiRequests', () => {
```

---

### frontend/src/stores/environment.ts (81 lines)

**Imports:**
```
1:import { defineStore } from 'pinia'
2:import { ref } from 'vue'
3:import api from '@/services/api'
```

**Exports:**
```
34:export const useEnvironmentStore = defineStore('environment', () => {
```

---

### frontend/src/stores/reports.ts (137 lines)

**Imports:**
```
1:import { defineStore } from 'pinia'
2:import { ref, computed } from 'vue'
```

**Exports:**
```
15:export const useReportsStore = defineStore('reports', () => {
```

**Functions / Methods:**
```
42:  loadSavedReports()
```

---

### frontend/src/stores/toast.ts (45 lines)

**Imports:**
```
1:import { ref } from 'vue'
```

**Exports:**
```
12:export function useToastStore() {
```

---

## Frontend Router

### frontend/src/router/index.ts (267 lines)

**Imports:**
```
1:import { createRouter, createWebHistory } from 'vue-router'
2:import { useAuthStore } from '@/stores/auth'
```

**Exports:**
```
268:export default router
```

---

