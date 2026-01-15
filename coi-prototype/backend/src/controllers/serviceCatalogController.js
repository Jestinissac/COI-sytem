import { getDatabase } from '../database/init.js'
import { getUserById } from '../utils/userUtils.js'

const db = getDatabase()

/**
 * Get Global catalog (all services)
 * Access: All authenticated users (read-only for most, editable by Super Admin/Admin/Compliance)
 */
export async function getGlobalCatalog(req, res) {
  try {
    const { category, search } = req.query
    
    let query = `
      SELECT 
        id, service_code, category, sub_category, service_name,
        description, is_active, display_order, metadata,
        created_at, updated_at
      FROM service_catalog_global
      WHERE 1=1
    `
    const params = []
    
    if (category) {
      query += ' AND category = ?'
      params.push(category)
    }
    
    if (search) {
      query += ' AND (service_name LIKE ? OR category LIKE ? OR description LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }
    
    query += ' ORDER BY category, display_order, service_name'
    
    const services = db.prepare(query).all(...params)
    
    res.json(services)
  } catch (error) {
    console.error('Error fetching global catalog:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Get entity catalog (enabled services for specific entity)
 */
export async function getEntityCatalog(req, res) {
  try {
    const { entityCode } = req.params
    const { includeCustom = 'true' } = req.query
    
    // Get entity name from code
    const entity = db.prepare('SELECT entity_name FROM entity_codes WHERE entity_code = ? AND is_active = 1').get(entityCode)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }
    
    const entityName = entity.entity_name
    
    // Get enabled services from Global catalog
    const enabledServices = db.prepare(`
      SELECT 
        scg.id, scg.service_code, scg.category, scg.sub_category,
        COALESCE(sce.custom_name, scg.service_name) as service_name,
        COALESCE(sce.custom_description, scg.description) as description,
        sce.is_enabled, sce.display_order, sce.notes,
        scg.metadata
      FROM service_catalog_global scg
      INNER JOIN service_catalog_entities sce ON scg.service_code = sce.service_code
      WHERE sce.entity_name = ? AND sce.is_enabled = 1
      ORDER BY sce.display_order, scg.category, scg.service_name
    `).all(entityName)
    
    let result = enabledServices
    
    // Include custom services if requested
    if (includeCustom === 'true') {
      const customServices = db.prepare(`
        SELECT 
          id, category, sub_category, service_name, description,
          is_active, display_order,
          'custom' as service_code
        FROM service_catalog_custom_services
        WHERE entity_name = ? AND is_active = 1
        ORDER BY display_order, category, service_name
      `).all(entityName)
      
      result = [...enabledServices, ...customServices]
    }
    
    res.json({
      entity: entityName,
      entityCode: entityCode,
      services: result,
      total: result.length
    })
  } catch (error) {
    console.error('Error fetching entity catalog:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Enable service for entity (from Global catalog)
 * Access: Super Admin, Admin, Compliance
 */
export async function enableServiceForEntity(req, res) {
  try {
    const user = getUserById(req.userId)
    
    if (!['Super Admin', 'Admin', 'Compliance'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    const { entityCode } = req.params
    const { serviceCode } = req.body
    
    if (!serviceCode) {
      return res.status(400).json({ error: 'serviceCode is required' })
    }
    
    // Get entity name
    const entity = db.prepare('SELECT entity_name FROM entity_codes WHERE entity_code = ? AND is_active = 1').get(entityCode)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }
    
    // Check if service exists in Global catalog
    const globalService = db.prepare('SELECT service_code FROM service_catalog_global WHERE service_code = ?').get(serviceCode)
    if (!globalService) {
      return res.status(404).json({ error: 'Service not found in Global catalog' })
    }
    
    // Check if already enabled
    const existing = db.prepare(`
      SELECT id, is_enabled FROM service_catalog_entities 
      WHERE entity_name = ? AND service_code = ?
    `).get(entity.entity_name, serviceCode)
    
    if (existing) {
      if (existing.is_enabled) {
        return res.status(400).json({ error: 'Service already enabled for this entity' })
      }
      
      // Re-enable
      db.prepare(`
        UPDATE service_catalog_entities 
        SET is_enabled = 1, enabled_by = ?, enabled_date = datetime('now'),
            disabled_by = NULL, disabled_date = NULL,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(user.id, existing.id)
      
      // Log history
      logCatalogHistory(entity.entity_name, serviceCode, 'enabled', null, { enabled_by: user.id }, user.id, 'Service re-enabled')
    } else {
      // Enable new service
      db.prepare(`
        INSERT INTO service_catalog_entities (
          entity_name, service_code, is_enabled,
          enabled_by, enabled_date
        ) VALUES (?, ?, 1, ?, datetime('now'))
      `).run(entity.entity_name, serviceCode, user.id)
      
      // Log history
      logCatalogHistory(entity.entity_name, serviceCode, 'enabled', null, { enabled_by: user.id }, user.id, 'Service enabled')
    }
    
    res.json({ success: true, message: 'Service enabled for entity' })
  } catch (error) {
    console.error('Error enabling service:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Disable service for entity
 * Access: Super Admin, Admin, Compliance
 */
export async function disableServiceForEntity(req, res) {
  try {
    const user = getUserById(req.userId)
    
    if (!['Super Admin', 'Admin', 'Compliance'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    const { entityCode, serviceCode } = req.params
    
    // Get entity name
    const entity = db.prepare('SELECT entity_name FROM entity_codes WHERE entity_code = ? AND is_active = 1').get(entityCode)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }
    
    // Get existing record
    const existing = db.prepare(`
      SELECT id FROM service_catalog_entities 
      WHERE entity_name = ? AND service_code = ?
    `).get(entity.entity_name, serviceCode)
    
    if (!existing) {
      return res.status(404).json({ error: 'Service not found in entity catalog' })
    }
    
    // Get old value for history
    const oldValue = db.prepare('SELECT * FROM service_catalog_entities WHERE id = ?').get(existing.id)
    
    // Disable
    db.prepare(`
      UPDATE service_catalog_entities 
      SET is_enabled = 0, disabled_by = ?, disabled_date = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(user.id, existing.id)
    
    // Log history
    logCatalogHistory(entity.entity_name, serviceCode, 'disabled', oldValue, { disabled_by: user.id }, user.id, 'Service disabled')
    
    res.json({ success: true, message: 'Service disabled for entity' })
  } catch (error) {
    console.error('Error disabling service:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Add custom service to entity (not in Global catalog)
 * Access: Super Admin, Admin, Compliance
 */
export async function addCustomService(req, res) {
  try {
    const user = getUserById(req.userId)
    
    if (!['Super Admin', 'Admin', 'Compliance'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    const { entityCode } = req.params
    const {
      category,
      sub_category,
      service_name,
      description,
      display_order = 0
    } = req.body
    
    if (!category || !service_name) {
      return res.status(400).json({ error: 'category and service_name are required' })
    }
    
    // Get entity name
    const entity = db.prepare('SELECT entity_name FROM entity_codes WHERE entity_code = ? AND is_active = 1').get(entityCode)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }
    
    const result = db.prepare(`
      INSERT INTO service_catalog_custom_services (
        entity_name, category, sub_category, service_name,
        description, is_active, display_order, created_by
      ) VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      entity.entity_name,
      category,
      sub_category || null,
      service_name,
      description || null,
      display_order,
      user.id
    )
    
    // Log history
    logCatalogHistory(entity.entity_name, null, 'created', null, { service_name, category }, user.id, 'Custom service created')
    
    const newService = db.prepare('SELECT * FROM service_catalog_custom_services WHERE id = ?').get(result.lastInsertRowid)
    
    res.status(201).json(newService)
  } catch (error) {
    console.error('Error adding custom service:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Update entity service (custom name, description, display order)
 * Access: Super Admin, Admin, Compliance
 */
export async function updateEntityService(req, res) {
  try {
    const user = getUserById(req.userId)
    
    if (!['Super Admin', 'Admin', 'Compliance'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    const { entityCode, serviceCode } = req.params
    const {
      custom_name,
      custom_description,
      display_order,
      notes
    } = req.body
    
    // Get entity name
    const entity = db.prepare('SELECT entity_name FROM entity_codes WHERE entity_code = ? AND is_active = 1').get(entityCode)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }
    
    // Check if it's a Global service or custom service
    const globalService = db.prepare(`
      SELECT id FROM service_catalog_entities 
      WHERE entity_name = ? AND service_code = ?
    `).get(entity.entity_name, serviceCode)
    
    if (globalService) {
      // Update Global service override
      const oldValue = db.prepare('SELECT * FROM service_catalog_entities WHERE id = ?').get(globalService.id)
      
      const updates = []
      const params = []
      
      if (custom_name !== undefined) {
        updates.push('custom_name = ?')
        params.push(custom_name)
      }
      if (custom_description !== undefined) {
        updates.push('custom_description = ?')
        params.push(custom_description)
      }
      if (display_order !== undefined) {
        updates.push('display_order = ?')
        params.push(display_order)
      }
      if (notes !== undefined) {
        updates.push('notes = ?')
        params.push(notes)
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' })
      }
      
      updates.push('updated_at = datetime("now")')
      params.push(globalService.id)
      
      db.prepare(`
        UPDATE service_catalog_entities 
        SET ${updates.join(', ')}
        WHERE id = ?
      `).run(...params)
      
      const newValue = db.prepare('SELECT * FROM service_catalog_entities WHERE id = ?').get(globalService.id)
      
      // Log history
      logCatalogHistory(entity.entity_name, serviceCode, 'updated', oldValue, newValue, user.id, 'Service updated')
      
      res.json(newValue)
    } else {
      // Update custom service
      const customService = db.prepare(`
        SELECT id FROM service_catalog_custom_services 
        WHERE entity_name = ? AND id = ?
      `).get(entity.entity_name, serviceCode)
      
      if (!customService) {
        return res.status(404).json({ error: 'Service not found' })
      }
      
      const oldValue = db.prepare('SELECT * FROM service_catalog_custom_services WHERE id = ?').get(customService.id)
      
      const updates = []
      const params = []
      
      if (service_name !== undefined) {
        updates.push('service_name = ?')
        params.push(service_name)
      }
      if (description !== undefined) {
        updates.push('description = ?')
        params.push(description)
      }
      if (display_order !== undefined) {
        updates.push('display_order = ?')
        params.push(display_order)
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' })
      }
      
      updates.push('updated_at = datetime("now")')
      params.push(customService.id)
      
      db.prepare(`
        UPDATE service_catalog_custom_services 
        SET ${updates.join(', ')}
        WHERE id = ?
      `).run(...params)
      
      const newValue = db.prepare('SELECT * FROM service_catalog_custom_services WHERE id = ?').get(customService.id)
      
      // Log history
      logCatalogHistory(entity.entity_name, null, 'updated', oldValue, newValue, user.id, 'Custom service updated')
      
      res.json(newValue)
    }
  } catch (error) {
    console.error('Error updating entity service:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Delete custom service
 * Access: Super Admin, Admin, Compliance
 */
export async function deleteCustomService(req, res) {
  try {
    const user = getUserById(req.userId)
    
    if (!['Super Admin', 'Admin', 'Compliance'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    const { entityCode, serviceCode } = req.params
    
    // Get entity name
    const entity = db.prepare('SELECT entity_name FROM entity_codes WHERE entity_code = ? AND is_active = 1').get(entityCode)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }
    
    // Get custom service
    const customService = db.prepare(`
      SELECT id FROM service_catalog_custom_services 
      WHERE entity_name = ? AND id = ?
    `).get(entity.entity_name, serviceCode)
    
    if (!customService) {
      return res.status(404).json({ error: 'Custom service not found' })
    }
    
    const oldValue = db.prepare('SELECT * FROM service_catalog_custom_services WHERE id = ?').get(customService.id)
    
    // Soft delete
    db.prepare(`
      UPDATE service_catalog_custom_services 
      SET is_active = 0, updated_at = datetime('now')
      WHERE id = ?
    `).run(customService.id)
    
    // Log history
    logCatalogHistory(entity.entity_name, null, 'deleted', oldValue, null, user.id, 'Custom service deleted')
    
    res.json({ success: true, message: 'Custom service deleted' })
  } catch (error) {
    console.error('Error deleting custom service:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Get catalog history
 */
export async function getCatalogHistory(req, res) {
  try {
    const { entityCode } = req.params
    const { serviceCode } = req.query
    
    // Get entity name
    const entity = db.prepare('SELECT entity_name FROM entity_codes WHERE entity_code = ? AND is_active = 1').get(entityCode)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }
    
    let query = `
      SELECT 
        sch.*,
        u.name as changed_by_name
      FROM service_catalog_history sch
      LEFT JOIN users u ON sch.changed_by = u.id
      WHERE sch.entity_name = ?
    `
    const params = [entity.entity_name]
    
    if (serviceCode) {
      query += ' AND sch.service_code = ?'
      params.push(serviceCode)
    }
    
    query += ' ORDER BY sch.created_at DESC LIMIT 100'
    
    const history = db.prepare(query).all(...params)
    
    res.json(history)
  } catch (error) {
    console.error('Error fetching catalog history:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Helper function to log catalog history
 */
function logCatalogHistory(entityName, serviceCode, action, oldValue, newValue, changedBy, changeReason) {
  try {
    db.prepare(`
      INSERT INTO service_catalog_history (
        entity_name, service_code, action,
        old_value, new_value, changed_by, change_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      entityName,
      serviceCode,
      action,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      changedBy,
      changeReason
    )
  } catch (error) {
    console.error('Error logging catalog history:', error)
    // Don't throw - history logging failure shouldn't break the operation
  }
}
