import express from 'express'
import { 
  login, 
  getCurrentUser, 
  getAllUsers, 
  createUser, 
  updateUser, 
  disableUser, 
  enableUser,
  getAuditLogs,
  refreshAccessToken,
  logout,
  logoutAll,
  getApproverUsers,
  updateUserAvailability
} from '../controllers/authController.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Authentication routes
router.post('/login', login)
router.post('/refresh', refreshAccessToken) // Refresh access token
router.post('/logout', logout) // Logout (revoke refresh token)
router.post('/logout-all', authenticateToken, logoutAll) // Logout from all devices

// User routes
router.get('/me', authenticateToken, getCurrentUser)
router.get('/users', authenticateToken, getAllUsers)

// Super Admin only routes
router.post('/users', authenticateToken, requireRole('Super Admin'), createUser)
router.put('/users/:id', authenticateToken, requireRole('Super Admin'), updateUser)
router.post('/users/:id/disable', authenticateToken, requireRole('Super Admin'), disableUser)
router.post('/users/:id/enable', authenticateToken, requireRole('Super Admin'), enableUser)
router.get('/audit-logs', authenticateToken, requireRole('Super Admin'), getAuditLogs)

// Admin routes for user availability management
router.get('/users/approvers', authenticateToken, requireRole('Admin', 'Super Admin'), getApproverUsers)
router.post('/users/:id/availability', authenticateToken, requireRole('Admin', 'Super Admin'), updateUserAvailability)

export default router


