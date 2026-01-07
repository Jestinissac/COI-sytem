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
  approveBusinessRule,
  rejectBusinessRule,
  deleteBusinessRule,
  getFormTemplates,
  getFormTemplate,
  saveFormTemplate,
  deleteFormTemplate,
  loadFormTemplate
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
router.delete('/business-rules/:id', requireRole('Admin', 'Super Admin', 'Compliance'), deleteBusinessRule)

// Form Templates (Admin only)
router.get('/templates', getFormTemplates)
router.get('/templates/:id', getFormTemplate)
router.post('/templates', requireRole('Admin', 'Super Admin'), saveFormTemplate)
router.delete('/templates/:id', requireRole('Admin', 'Super Admin'), deleteFormTemplate)
router.post('/templates/:id/load', requireRole('Admin', 'Super Admin'), loadFormTemplate)

export default router


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
  approveBusinessRule,
  rejectBusinessRule,
  deleteBusinessRule,
  getFormTemplates,
  getFormTemplate,
  saveFormTemplate,
  deleteFormTemplate,
  loadFormTemplate
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
router.delete('/business-rules/:id', requireRole('Admin', 'Super Admin', 'Compliance'), deleteBusinessRule)

// Form Templates (Admin only)
router.get('/templates', getFormTemplates)
router.get('/templates/:id', getFormTemplate)
router.post('/templates', requireRole('Admin', 'Super Admin'), saveFormTemplate)
router.delete('/templates/:id', requireRole('Admin', 'Super Admin'), deleteFormTemplate)
router.post('/templates/:id/load', requireRole('Admin', 'Super Admin'), loadFormTemplate)

export default router

