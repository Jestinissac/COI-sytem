import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  getEntityCodes,
  getEntityCode,
  createEntityCode,
  updateEntityCode,
  deleteEntityCode
} from '../controllers/entityCodesController.js'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Get all entity codes (for dropdowns, etc.)
router.get('/', getEntityCodes)

// Get single entity code
router.get('/:code', getEntityCode)

// Create entity code (Super Admin only)
router.post('/', createEntityCode)

// Update entity code (Super Admin only)
router.put('/:code', updateEntityCode)

// Delete entity code (Super Admin only)
router.delete('/:code', deleteEntityCode)

export default router
