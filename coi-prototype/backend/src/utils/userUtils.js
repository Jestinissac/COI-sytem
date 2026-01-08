/**
 * User Utility Functions
 * Centralized user-related helper functions
 */

import { getDatabase } from '../database/init.js'

const db = getDatabase()

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Object|null} User object or null if not found
 */
export function getUserById(userId) {
  if (!userId) return null
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
}

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Object|null} User object or null if not found
 */
export function getUserByEmail(email) {
  if (!email) return null
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email)
}
