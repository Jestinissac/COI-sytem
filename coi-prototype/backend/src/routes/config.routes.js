import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import {
  getFormFields,
  saveFormFields,
  getFormField,
  updateFormField,
  deleteFormField,
  getWorkflowConfig,
  saveWorkflowConfig,
  getBusinessRules,
  saveBusinessRule,
  updateBusinessRule,
  getRuleChangeImpact,
  approveBusinessRule,
  rejectBusinessRule,
  deleteBusinessRule,
  cleanupDuplicateRules,
  getFormTemplates,
  getFormTemplate,
  saveFormTemplate,
  deleteFormTemplate,
  loadFormTemplate,
  getSystemEditionConfig,
  updateSystemEdition,
  getEnabledFeatures,
  getRuleFields,
  validateRuleEndpoint,
  testRule,
  getClientIntelligenceStatusEndpoint,
  enableClientIntelligenceEndpoint,
  disableClientIntelligenceEndpoint
} from '../controllers/configController.js'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Form Fields Configuration (Admin only)
router.get('/form-fields', getFormFields)
router.post('/form-fields', requireRole('Admin', 'Super Admin'), saveFormFields)
router.get('/form-fields/:id', getFormField)
router.put('/form-fields/:id', requireRole('Admin', 'Super Admin'), updateFormField)
router.delete('/form-fields/:id', requireRole('Admin', 'Super Admin'), deleteFormField)

// Workflow Configuration (Admin only)
router.get('/workflow', getWorkflowConfig)
router.post('/workflow', requireRole('Admin', 'Super Admin'), saveWorkflowConfig)

// Business Rules Configuration (Admin only)
router.get('/business-rules', getBusinessRules)
router.post('/business-rules', requireRole('Admin', 'Super Admin', 'Compliance'), saveBusinessRule)
router.put('/business-rules/:id', requireRole('Admin', 'Super Admin', 'Compliance'), updateBusinessRule)
router.post('/business-rules/:id/impact', requireRole('Admin', 'Super Admin', 'Compliance'), getRuleChangeImpact)
router.delete('/business-rules/:id', requireRole('Admin', 'Super Admin', 'Compliance'), deleteBusinessRule)
router.post('/business-rules/:id/approve', requireRole('Super Admin'), approveBusinessRule)
router.post('/business-rules/:id/reject', requireRole('Super Admin'), rejectBusinessRule)
router.post('/business-rules/cleanup-duplicates', requireRole('Super Admin'), cleanupDuplicateRules)

// Rule Fields API - Get all available fields for rule building
router.get('/rule-fields', getRuleFields)

// Rule Validation API - Validate rule before saving
router.post('/validate-rule', validateRuleEndpoint)

// Test Rule API - Test rule against sample/real requests
router.post('/test-rule', testRule)

// Form Templates (Admin only)
router.get('/templates', getFormTemplates)
router.get('/templates/:id', getFormTemplate)
router.post('/templates', requireRole('Admin', 'Super Admin'), saveFormTemplate)
router.delete('/templates/:id', requireRole('Admin', 'Super Admin'), deleteFormTemplate)
router.post('/templates/:id/load', requireRole('Admin', 'Super Admin'), loadFormTemplate)

// Edition Management (Super Admin only)
router.get('/edition', getSystemEditionConfig)
router.put('/edition', requireRole('Super Admin'), updateSystemEdition)
router.get('/features', getEnabledFeatures)

// Client Intelligence Feature Flag (Super Admin only)
router.get('/client-intelligence/status', getClientIntelligenceStatusEndpoint)
router.post('/client-intelligence/enable', requireRole('Super Admin'), enableClientIntelligenceEndpoint)
router.post('/client-intelligence/disable', requireRole('Super Admin'), disableClientIntelligenceEndpoint)

export default router
