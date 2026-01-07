import express from 'express'
import { 
  login, 
  getCurrentUser, 
  getAllUsers, 
  createUser, 
  updateUser, 
  disableUser, 
  enableUser,
  getAuditLogs 
} from '../controllers/authController.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.post('/login', login)
router.get('/me', authenticateToken, getCurrentUser)
router.get('/users', authenticateToken, getAllUsers)

// Super Admin only routes
router.post('/users', authenticateToken, requireRole('Super Admin'), createUser)
router.put('/users/:id', authenticateToken, requireRole('Super Admin'), updateUser)
router.post('/users/:id/disable', authenticateToken, requireRole('Super Admin'), disableUser)
router.post('/users/:id/enable', authenticateToken, requireRole('Super Admin'), enableUser)
router.get('/audit-logs', authenticateToken, requireRole('Super Admin'), getAuditLogs)

export default router


