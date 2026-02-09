import { getDatabase } from '../database/init.js'
import { getUserById } from '../utils/userUtils.js'

const db = getDatabase()

/**
 * Get all entity codes
 * Access: All authenticated users (for dropdowns, etc.)
 */
export async function getEntityCodes(req, res) {
  try {
    const entities = db.prepare(`
      SELECT 
        id, entity_code, entity_name, entity_display_name,
        is_active, is_default, catalog_mode,
        created_at, updated_at
      FROM entity_codes
      WHERE is_active = 1
      ORDER BY is_default DESC, entity_name ASC
    `).all()
    
    res.json(entities)
  } catch (error) {
    console.error('Error fetching entity codes:', error)
    res.status(500).json({ error: 'Failed to load entity codes.' })
  }
}

/**
 * Get single entity code by code
 */
export async function getEntityCode(req, res) {
  try {
    const { code } = req.params
    
    const entity = db.prepare(`
      SELECT 
        id, entity_code, entity_name, entity_display_name,
        is_active, is_default, catalog_mode,
        created_by, updated_by,
        created_at, updated_at
      FROM entity_codes
      WHERE entity_code = ? AND is_active = 1
    `).get(code)
    
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }
    
    res.json(entity)
  } catch (error) {
    console.error('Error fetching entity code:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Create new entity code
 * Access: Super Admin only
 */
export async function createEntityCode(req, res) {
  try {
    const user = getUserById(req.userId)
    
    if (user.role !== 'Super Admin') {
      return res.status(403).json({ error: 'Only Super Admin can create entity codes' })
    }
    
    const {
      entity_code,
      entity_name,
      entity_display_name,
      catalog_mode = 'independent'
    } = req.body
    
    if (!entity_code || !entity_name) {
      return res.status(400).json({ error: 'entity_code and entity_name are required' })
    }
    
    // Validate catalog_mode
    if (!['inherit', 'independent'].includes(catalog_mode)) {
      return res.status(400).json({ error: 'catalog_mode must be "inherit" or "independent"' })
    }
    
    // Check if code already exists
    const existing = db.prepare('SELECT id FROM entity_codes WHERE entity_code = ?').get(entity_code)
    if (existing) {
      return res.status(400).json({ error: 'Entity code already exists' })
    }
    
    const result = db.prepare(`
      INSERT INTO entity_codes (
        entity_code, entity_name, entity_display_name,
        catalog_mode, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      entity_code,
      entity_name,
      entity_display_name || entity_name,
      catalog_mode,
      user.id,
      user.id
    )
    
    const newEntity = db.prepare('SELECT * FROM entity_codes WHERE id = ?').get(result.lastInsertRowid)
    
    res.status(201).json(newEntity)
  } catch (error) {
    console.error('Error creating entity code:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Update entity code
 * Access: Super Admin only
 */
export async function updateEntityCode(req, res) {
  try {
    const user = getUserById(req.userId)
    
    if (user.role !== 'Super Admin') {
      return res.status(403).json({ error: 'Only Super Admin can update entity codes' })
    }
    
    const { code } = req.params
    const {
      entity_name,
      entity_display_name,
      catalog_mode,
      is_default
    } = req.body
    
    // Check if entity exists
    const existing = db.prepare('SELECT id FROM entity_codes WHERE entity_code = ?').get(code)
    if (!existing) {
      return res.status(404).json({ error: 'Entity not found' })
    }
    
    // If setting as default, unset other defaults
    if (is_default === true || is_default === 1) {
      db.prepare('UPDATE entity_codes SET is_default = 0 WHERE entity_code != ?').run(code)
    }
    
    // Build update query dynamically
    const updates = []
    const params = []
    
    if (entity_name !== undefined) {
      updates.push('entity_name = ?')
      params.push(entity_name)
    }
    if (entity_display_name !== undefined) {
      updates.push('entity_display_name = ?')
      params.push(entity_display_name)
    }
    if (catalog_mode !== undefined) {
      if (!['inherit', 'independent'].includes(catalog_mode)) {
        return res.status(400).json({ error: 'catalog_mode must be "inherit" or "independent"' })
      }
      updates.push('catalog_mode = ?')
      params.push(catalog_mode)
    }
    if (is_default !== undefined) {
      updates.push('is_default = ?')
      params.push(is_default ? 1 : 0)
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }
    
    updates.push('updated_by = ?')
    updates.push('updated_at = datetime("now")')
    params.push(user.id)
    params.push(code)
    
    db.prepare(`
      UPDATE entity_codes 
      SET ${updates.join(', ')}
      WHERE entity_code = ?
    `).run(...params)
    
    const updated = db.prepare('SELECT * FROM entity_codes WHERE entity_code = ?').get(code)
    
    res.json(updated)
  } catch (error) {
    console.error('Error updating entity code:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Deactivate entity code (soft delete)
 * Access: Super Admin only
 */
export async function deleteEntityCode(req, res) {
  try {
    const user = getUserById(req.userId)
    
    if (user.role !== 'Super Admin') {
      return res.status(403).json({ error: 'Only Super Admin can delete entity codes' })
    }
    
    const { code } = req.params
    
    // Check if entity exists
    const existing = db.prepare('SELECT id, is_default FROM entity_codes WHERE entity_code = ?').get(code)
    if (!existing) {
      return res.status(404).json({ error: 'Entity not found' })
    }
    
    // Don't allow deleting default entity
    if (existing.is_default) {
      return res.status(400).json({ error: 'Cannot delete default entity. Set another entity as default first.' })
    }
    
    // Soft delete (set is_active = 0)
    db.prepare(`
      UPDATE entity_codes 
      SET is_active = 0, updated_by = ?, updated_at = datetime('now')
      WHERE entity_code = ?
    `).run(user.id, code)
    
    res.json({ success: true, message: 'Entity deactivated successfully' })
  } catch (error) {
    console.error('Error deleting entity code:', error)
    res.status(500).json({ error: error.message })
  }
}
