import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  getGlobalCatalog,
  getEntityCatalog,
  enableServiceForEntity,
  disableServiceForEntity,
  addCustomService,
  updateEntityService,
  deleteCustomService,
  getCatalogHistory
} from '../controllers/serviceCatalogController.js'
import {
  importFromExcel,
  copyCatalogFromEntity,
  bulkEnableServices,
  bulkDisableServices,
  exportToExcelFormat
} from '../services/catalogImportService.js'
import { getUserById } from '../utils/userUtils.js'
import { getDatabase } from '../database/init.js'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Global catalog (read-only for most users)
router.get('/global', getGlobalCatalog)

// Entity catalog
router.get('/entity/:entityCode', getEntityCatalog)

// Enable/disable services
router.post('/entity/:entityCode/enable', enableServiceForEntity)
router.post('/entity/:entityCode/disable/:serviceCode', disableServiceForEntity)

// Custom services
router.post('/entity/:entityCode/custom', addCustomService)
router.put('/entity/:entityCode/service/:serviceCode', updateEntityService)
router.delete('/entity/:entityCode/service/:serviceCode', deleteCustomService)

// History
router.get('/history/:entityCode', getCatalogHistory)

// Bulk operations
router.post('/entity/:entityCode/import-excel', async (req, res) => {
  try {
    const user = getUserById(req.userId)
    if (!['Super Admin', 'Admin', 'Compliance'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    const db = getDatabase()
    const { entityCode } = req.params
    const entity = db.prepare('SELECT entity_name FROM entity_codes WHERE entity_code = ? AND is_active = 1').get(entityCode)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }
    
    // fileData should be in req.body (parsed from uploaded Excel)
    const result = await importFromExcel(entity.entity_name, req.body.fileData || [], user.id)
    res.json(result)
  } catch (error) {
    console.error('Error importing Excel:', error)
    res.status(500).json({ error: error.message })
  }
})

router.get('/entity/:entityCode/export-excel', async (req, res) => {
  try {
    const db = getDatabase()
    const { entityCode } = req.params
    const entity = db.prepare('SELECT entity_name FROM entity_codes WHERE entity_code = ? AND is_active = 1').get(entityCode)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }
    
    const data = await exportToExcelFormat(entity.entity_name)
    res.json(data)
  } catch (error) {
    console.error('Error exporting Excel:', error)
    res.status(500).json({ error: error.message })
  }
})

router.post('/entity/:entityCode/copy-from/:sourceEntityCode', async (req, res) => {
  try {
    const user = getUserById(req.userId)
    if (!['Super Admin', 'Admin', 'Compliance'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    const db = getDatabase()
    const { entityCode, sourceEntityCode } = req.params
    
    const targetEntity = db.prepare('SELECT entity_name FROM entity_codes WHERE entity_code = ? AND is_active = 1').get(entityCode)
    const sourceEntity = db.prepare('SELECT entity_name FROM entity_codes WHERE entity_code = ? AND is_active = 1').get(sourceEntityCode)
    
    if (!targetEntity || !sourceEntity) {
      return res.status(404).json({ error: 'Entity not found' })
    }
    
    const result = await copyCatalogFromEntity(targetEntity.entity_name, sourceEntity.entity_name, user.id)
    res.json(result)
  } catch (error) {
    console.error('Error copying catalog:', error)
    res.status(500).json({ error: error.message })
  }
})

router.post('/entity/:entityCode/bulk-enable', async (req, res) => {
  try {
    const user = getUserById(req.userId)
    if (!['Super Admin', 'Admin', 'Compliance'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    const db = getDatabase()
    const { entityCode } = req.params
    const { serviceCodes } = req.body
    
    if (!Array.isArray(serviceCodes)) {
      return res.status(400).json({ error: 'serviceCodes must be an array' })
    }
    
    const entity = db.prepare('SELECT entity_name FROM entity_codes WHERE entity_code = ? AND is_active = 1').get(entityCode)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }
    
    const result = await bulkEnableServices(entity.entity_name, serviceCodes, user.id)
    res.json(result)
  } catch (error) {
    console.error('Error bulk enabling:', error)
    res.status(500).json({ error: error.message })
  }
})

router.post('/entity/:entityCode/bulk-disable', async (req, res) => {
  try {
    const user = getUserById(req.userId)
    if (!['Super Admin', 'Admin', 'Compliance'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    const db = getDatabase()
    const { entityCode } = req.params
    const { serviceCodes } = req.body
    
    if (!Array.isArray(serviceCodes)) {
      return res.status(400).json({ error: 'serviceCodes must be an array' })
    }
    
    const entity = db.prepare('SELECT entity_name FROM entity_codes WHERE entity_code = ? AND is_active = 1').get(entityCode)
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' })
    }
    
    const result = await bulkDisableServices(entity.entity_name, serviceCodes, user.id)
    res.json(result)
  } catch (error) {
    console.error('Error bulk disabling:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
