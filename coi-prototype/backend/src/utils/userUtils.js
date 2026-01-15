import { getDatabase } from '../database/init.js'

const db = getDatabase()

/**
 * Get user by ID
 */
export function getUserById(userId) {
  if (!userId) {
    return null
  }
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
  return user || null
}

/**
 * Get user by email
 */
export function getUserByEmail(email) {
  if (!email) {
    return null
  }
  
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  return user || null
}
