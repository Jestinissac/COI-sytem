import { getDatabase } from '../database/init.js'
import { getUserById } from '../utils/userUtils.js'

const db = getDatabase()

/**
 * Import services from Excel file
 * Format: Excel with columns: Category, Service Name, Description (optional)
 */
export async function importFromExcel(entityName, fileData, importedBy) {
  try {
    // Parse Excel data (assuming fileData is array of rows)
    // Format: [{ category: '...', service_name: '...', description: '...' }, ...]
    
    const services = []
    const errors = []
    
    for (let i = 0; i < fileData.length; i++) {
      const row = fileData[i]
      
      if (!row.category || !row.service_name) {
        errors.push(`Row ${i + 1}: Missing category or service_name`)
        continue
      }
      
      // Check if service exists in Global catalog
      const globalService = db.prepare(`
        SELECT service_code FROM service_catalog_global 
        WHERE category = ? AND service_name = ?
      `).get(row.category, row.service_name)
      
      if (globalService) {
        // Enable from Global catalog
        const existing = db.prepare(`
          SELECT id FROM service_catalog_entities 
          WHERE entity_name = ? AND service_code = ?
        `).get(entityName, globalService.service_code)
        
        if (!existing) {
          db.prepare(`
            INSERT INTO service_catalog_entities (
              entity_name, service_code, is_enabled,
              enabled_by, enabled_date
            ) VALUES (?, ?, 1, ?, datetime('now'))
          `).run(entityName, globalService.service_code, importedBy)
          services.push({ type: 'global', service_code: globalService.service_code })
        }
      } else {
        // Add as custom service
        const result = db.prepare(`
          INSERT INTO service_catalog_custom_services (
            entity_name, category, service_name, description,
            is_active, display_order, created_by
          ) VALUES (?, ?, ?, ?, 1, 0, ?)
        `).run(
          entityName,
          row.category,
          row.service_name,
          row.description || null,
          importedBy
        )
        services.push({ type: 'custom', id: result.lastInsertRowid })
      }
    }
    
    // Log import
    db.prepare(`
      INSERT INTO service_catalog_imports (
        entity_name, import_type, services_imported,
        services_failed, status, imported_by
      ) VALUES (?, 'excel', ?, ?, 'completed', ?)
    `).run(entityName, services.length, errors.length, importedBy)
    
    return {
      success: true,
      imported: services.length,
      failed: errors.length,
      errors
    }
  } catch (error) {
    console.error('Error importing from Excel:', error)
    throw error
  }
}

/**
 * Copy catalog from one entity to another
 */
export async function copyCatalogFromEntity(targetEntityName, sourceEntityName, copiedBy) {
  try {
    // Get all enabled services from source entity
    const sourceServices = db.prepare(`
      SELECT service_code, custom_name, custom_description, display_order
      FROM service_catalog_entities
      WHERE entity_name = ? AND is_enabled = 1
    `).all(sourceEntityName)
    
    // Get all custom services from source entity
    const sourceCustomServices = db.prepare(`
      SELECT category, sub_category, service_name, description, display_order
      FROM service_catalog_custom_services
      WHERE entity_name = ? AND is_active = 1
    `).all(sourceEntityName)
    
    let imported = 0
    
    // Copy enabled services
    for (const service of sourceServices) {
      const existing = db.prepare(`
        SELECT id FROM service_catalog_entities 
        WHERE entity_name = ? AND service_code = ?
      `).get(targetEntityName, service.service_code)
      
      if (!existing) {
        db.prepare(`
          INSERT INTO service_catalog_entities (
            entity_name, service_code, is_enabled,
            custom_name, custom_description, display_order,
            enabled_by, enabled_date
          ) VALUES (?, ?, 1, ?, ?, ?, ?, datetime('now'))
        `).run(
          targetEntityName,
          service.service_code,
          service.custom_name,
          service.custom_description,
          service.display_order,
          copiedBy
        )
        imported++
      }
    }
    
    // Copy custom services
    for (const service of sourceCustomServices) {
      db.prepare(`
        INSERT INTO service_catalog_custom_services (
          entity_name, category, sub_category, service_name,
          description, is_active, display_order, created_by
        ) VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      `).run(
        targetEntityName,
        service.category,
        service.sub_category,
        service.service_name,
        service.description,
        service.display_order,
        copiedBy
      )
      imported++
    }
    
    // Log import
    db.prepare(`
      INSERT INTO service_catalog_imports (
        entity_name, import_type, services_imported,
        status, imported_by
      ) VALUES (?, 'copy_from_entity', ?, 'completed', ?)
    `).run(targetEntityName, imported, copiedBy)
    
    return {
      success: true,
      imported
    }
  } catch (error) {
    console.error('Error copying catalog:', error)
    throw error
  }
}

/**
 * Bulk enable services for entity
 */
export async function bulkEnableServices(entityName, serviceCodes, enabledBy) {
  try {
    let enabled = 0
    
    for (const serviceCode of serviceCodes) {
      // Check if service exists in Global catalog
      const globalService = db.prepare('SELECT service_code FROM service_catalog_global WHERE service_code = ?').get(serviceCode)
      if (!globalService) {
        continue
      }
      
      const existing = db.prepare(`
        SELECT id, is_enabled FROM service_catalog_entities 
        WHERE entity_name = ? AND service_code = ?
      `).get(entityName, serviceCode)
      
      if (existing) {
        if (!existing.is_enabled) {
          db.prepare(`
            UPDATE service_catalog_entities 
            SET is_enabled = 1, enabled_by = ?, enabled_date = datetime('now'),
                disabled_by = NULL, disabled_date = NULL,
                updated_at = datetime('now')
            WHERE id = ?
          `).run(enabledBy, existing.id)
          enabled++
        }
      } else {
        db.prepare(`
          INSERT INTO service_catalog_entities (
            entity_name, service_code, is_enabled,
            enabled_by, enabled_date
          ) VALUES (?, ?, 1, ?, datetime('now'))
        `).run(entityName, serviceCode, enabledBy)
        enabled++
      }
    }
    
    return {
      success: true,
      enabled
    }
  } catch (error) {
    console.error('Error bulk enabling services:', error)
    throw error
  }
}

/**
 * Bulk disable services for entity
 */
export async function bulkDisableServices(entityName, serviceCodes, disabledBy) {
  try {
    let disabled = 0
    
    for (const serviceCode of serviceCodes) {
      const existing = db.prepare(`
        SELECT id FROM service_catalog_entities 
        WHERE entity_name = ? AND service_code = ?
      `).get(entityName, serviceCode)
      
      if (existing && existing.is_enabled) {
        db.prepare(`
          UPDATE service_catalog_entities 
          SET is_enabled = 0, disabled_by = ?, disabled_date = datetime('now'),
              updated_at = datetime('now')
          WHERE id = ?
        `).run(disabledBy, existing.id)
        disabled++
      }
    }
    
    return {
      success: true,
      disabled
    }
  } catch (error) {
    console.error('Error bulk disabling services:', error)
    throw error
  }
}

/**
 * Export entity catalog to Excel format (returns data structure)
 */
export async function exportToExcelFormat(entityName) {
  try {
    // Get enabled services
    const enabledServices = db.prepare(`
      SELECT 
        scg.category,
        COALESCE(sce.custom_name, scg.service_name) as service_name,
        COALESCE(sce.custom_description, scg.description) as description,
        scg.service_code
      FROM service_catalog_global scg
      INNER JOIN service_catalog_entities sce ON scg.service_code = sce.service_code
      WHERE sce.entity_name = ? AND sce.is_enabled = 1
      ORDER BY scg.category, scg.service_name
    `).all(entityName)
    
    // Get custom services
    const customServices = db.prepare(`
      SELECT category, service_name, description
      FROM service_catalog_custom_services
      WHERE entity_name = ? AND is_active = 1
      ORDER BY category, service_name
    `).all(entityName)
    
    return {
      entity: entityName,
      services: [
        ...enabledServices.map(s => ({
          category: s.category,
          service_name: s.service_name,
          description: s.description,
          type: 'global'
        })),
        ...customServices.map(s => ({
          category: s.category,
          service_name: s.service_name,
          description: s.description,
          type: 'custom'
        }))
      ]
    }
  } catch (error) {
    console.error('Error exporting catalog:', error)
    throw error
  }
}
