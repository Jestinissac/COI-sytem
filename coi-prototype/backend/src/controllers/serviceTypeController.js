import { getDatabase } from '../database/init.js'

const db = getDatabase()

/**
 * Build Kuwait Template List from database
 * Uses Kuwait Local services (39 services from COI Template) and groups Advisory sub-categories
 * Falls back to hardcoded Kuwait list if database doesn't have Kuwait services
 */
function buildKuwaitTemplateList() {
  // Define the 39 Kuwait services from COI Template (exact match)
  const kuwaitServicesList = [
    // Audit & Assurance (5)
    'Statutory Audit Services',
    'Reviews Services',
    'Agreed Upon Procedures Services',
    'Related Services Engagements',
    'Other Audit Services',
    // Advisory (23)
    'Business / Asset Valuation Services',
    'Impairment Tests Services',
    'Management Consulting Services',
    'SOX & Internal Controls Services',
    'Internal Audit Services',
    'Transaction Services',
    'Risk Management Services',
    'Forensics Services',
    'Other – Post Merger Integrations',
    'IT Audit',
    'Restructuring Services',
    'Due Diligence Services',
    'Market and Feasibility Studies Services',
    'Policies & Procedures Services',
    'Business Planning Services',
    'Capital Adequacy Services (Book 7)',
    'AML Services (Book 16)',
    'Internal Audit Quality Assurance Services',
    'Performance and Profitability Improvement Services',
    'Capital Adequacy Services (Book 17)',
    'Clients\' Funds and Clients\' Assets Report Services (Book 7)',
    'Payroll and HR Services',
    'Other Advisory Services',
    // Tax Services (6)
    'Corporate International Tax Services',
    'Tax Compliance & Assurance Engagements Services',
    'FATCA Services',
    'CRS Services',
    'Zakat Services',
    'Other Tax Services',
    // Accounting Services (2)
    'Book Keeping Services',
    'Accounting Services',
    // IT Services (1)
    'IT Services',
    // Other Services (2)
    'Other Services',
    'Not Applicable'
  ]
  
  // Try to get Kuwait Local services from database first
  let allServices = db.prepare(`
    SELECT category, service_name, display_order, metadata
    FROM service_catalog_global
    WHERE is_active = 1
      AND service_name IN (${kuwaitServicesList.map(() => '?').join(',')})
    ORDER BY category, display_order, service_name
  `).all(...kuwaitServicesList)
  
  // If database doesn't have Kuwait services, use hardcoded list with proper categories
  if (allServices.length === 0) {
    // Return hardcoded Kuwait template structure
    return [
      {
        category: 'Audit & Assurance',
        services: [
          'Statutory Audit Services',
          'Reviews Services',
          'Agreed Upon Procedures Services',
          'Related Services Engagements',
          'Other Audit Services'
        ]
      },
      {
        category: 'Advisory',
        services: [
          'Business / Asset Valuation Services',
          'Impairment Tests Services',
          'Management Consulting Services',
          'SOX & Internal Controls Services',
          'Internal Audit Services',
          'Transaction Services',
          'Risk Management Services',
          'Forensics Services',
          'Other – Post Merger Integrations',
          'IT Audit',
          'Restructuring Services',
          'Due Diligence Services',
          'Market and Feasibility Studies Services',
          'Policies & Procedures Services',
          'Business Planning Services',
          'Capital Adequacy Services (Book 7)',
          'AML Services (Book 16)',
          'Internal Audit Quality Assurance Services',
          'Performance and Profitability Improvement Services',
          'Capital Adequacy Services (Book 17)',
          'Clients\' Funds and Clients\' Assets Report Services (Book 7)',
          'Payroll and HR Services',
          'Other Advisory Services'
        ]
      },
      {
        category: 'Tax Services',
        services: [
          'Corporate International Tax Services',
          'Tax Compliance & Assurance Engagements Services',
          'FATCA Services',
          'CRS Services',
          'Zakat Services',
          'Other Tax Services'
        ]
      },
      {
        category: 'Accounting Services',
        services: [
          'Book Keeping Services',
          'Accounting Services'
        ]
      },
      {
        category: 'IT Services',
        services: [
          'IT Services'
        ]
      },
      {
        category: 'Other Services',
        services: [
          'Other Services',
          'Not Applicable'
        ]
      }
    ]
  }
  
  // Group services by category
  const servicesByCategory = {}
  allServices.forEach(service => {
    if (!servicesByCategory[service.category]) {
      servicesByCategory[service.category] = []
    }
    servicesByCategory[service.category].push(service.service_name)
  })
  
  // Build Kuwait template structure (matches COI Template - 6 categories)
  const kuwaitTemplateList = []
  
  // 1. Audit & Assurance
  if (servicesByCategory['Audit & Assurance']) {
    kuwaitTemplateList.push({
      category: 'Audit & Assurance',
      services: servicesByCategory['Audit & Assurance']
    })
  }
  
  // 2. Advisory - Group all Advisory sub-categories into one (matches COI Template)
  const advisoryServices = []
  Object.keys(servicesByCategory).forEach(category => {
    if (category.startsWith('Advisory') || category === 'Advisory') {
      advisoryServices.push(...servicesByCategory[category])
    }
    // Also include Business/Asset Valuation in Advisory (as per COI Template)
    if (category === 'Business/Asset Valuation') {
      advisoryServices.push(...servicesByCategory[category])
    }
  })
  
  if (advisoryServices.length > 0) {
    // Remove duplicates and maintain order
    const uniqueAdvisoryServices = [...new Set(advisoryServices)]
    kuwaitTemplateList.push({
      category: 'Advisory',
      services: uniqueAdvisoryServices,
      hasSubCategories: uniqueAdvisoryServices.some(s => 
        ['Business Valuation', 'Asset Valuation', 'Business / Asset Valuation Services'].includes(s)
      )
    })
  }
  
  // 3. Tax Services
  const taxServices = servicesByCategory['Tax Services'] || servicesByCategory['Tax'] || []
  if (taxServices.length > 0) {
    kuwaitTemplateList.push({
      category: 'Tax Services',
      services: taxServices
    })
  }
  
  // 4. Accounting Services
  if (servicesByCategory['Accounting Services']) {
    kuwaitTemplateList.push({
      category: 'Accounting Services',
      services: servicesByCategory['Accounting Services']
    })
  }
  
  // 5. IT Services (separate category in Kuwait template)
  if (servicesByCategory['IT Services']) {
    kuwaitTemplateList.push({
      category: 'IT Services',
      services: servicesByCategory['IT Services']
    })
  }
  
  // 6. Other Services - Consolidate remaining categories (matches COI Template)
  const otherServices = []
  const otherCategories = [
    'Internal Audit Services',
    'Transaction Services',
    'Risk Management Services',
    'Forensics Services',
    'Other Services'
  ]
  
  otherCategories.forEach(cat => {
    if (servicesByCategory[cat]) {
      otherServices.push(...servicesByCategory[cat])
    }
  })
  
  if (otherServices.length > 0) {
    const uniqueOtherServices = [...new Set(otherServices)]
    kuwaitTemplateList.push({
      category: 'Other Services',
      services: uniqueOtherServices
    })
  }
  
  return kuwaitTemplateList
}

/**
 * Build Full Global List from database
 * Keeps all Advisory sub-categories separate
 */
function buildFullGlobalList() {
  // Get all services from global catalog
  const allServices = db.prepare(`
    SELECT category, service_name, display_order
    FROM service_catalog_global
    WHERE is_active = 1
    ORDER BY category, display_order, service_name
  `).all()
  
  // Group services by category
  const servicesByCategory = {}
  allServices.forEach(service => {
    if (!servicesByCategory[service.category]) {
      servicesByCategory[service.category] = []
    }
    servicesByCategory[service.category].push(service.service_name)
  })
  
  // Build full global list structure - keep all categories separate
  const fullServiceTypeList = []
  
  // Get unique categories in display order
  const categories = db.prepare(`
    SELECT DISTINCT category, MIN(display_order) as min_order
    FROM service_catalog_global
    WHERE is_active = 1
    GROUP BY category
    ORDER BY min_order, category
  `).all()
  
  categories.forEach(({ category }) => {
    if (servicesByCategory[category] && servicesByCategory[category].length > 0) {
      const hasSubCategories = category === 'Business/Asset Valuation'
      fullServiceTypeList.push({
        category: category,
        services: servicesByCategory[category],
        ...(hasSubCategories && { hasSubCategories: true })
      })
    }
  })
  
  return fullServiceTypeList
}

/**
 * Get full service type list with sub-categories
 * Meeting Requirement 2026-01-12: Fix service type - bring full list, add sub-categories for Business/Asset Valuation
 * Updated: Filter by entity and international_operations flag
 * FIXED: Now reads from service_catalog_global database table instead of hardcoded lists
 */
export async function getServiceTypes(req, res) {
  try {
    // Force flush logs immediately
    process.stdout.write(`[ServiceTypes] Function called with entity: ${req.query.entity}, international: ${req.query.international}\n`)
    const { entity, international } = req.query
    // Default to false (Kuwait list) if not explicitly set to 'true'
    const internationalOperations = international === 'true'
    
    // Get all service types with their sub-categories
    const serviceTypesWithSubs = db.prepare(`
      SELECT 
        parent_service_type,
        sub_category,
        display_order
      FROM service_type_categories
      WHERE is_active = 1
      ORDER BY parent_service_type, display_order
    `).all()
    
    // Group by parent service type
    const grouped = {}
    serviceTypesWithSubs.forEach(row => {
      if (!grouped[row.parent_service_type]) {
        grouped[row.parent_service_type] = []
      }
      grouped[row.parent_service_type].push({
        value: row.sub_category,
        label: row.sub_category,
        order: row.display_order
      })
    })
    
    // Get entity-specific services if entity is provided
    let entityServices = []
    let entityCustomServices = []
    
    if (entity) {
      // Get entity name from code
      const entityRecord = db.prepare('SELECT entity_name FROM entity_codes WHERE entity_code = ? AND is_active = 1').get(entity)
      if (entityRecord) {
        // Get enabled services from Global catalog
        entityServices = db.prepare(`
          SELECT DISTINCT scg.category, scg.service_name, scg.service_code
          FROM service_catalog_global scg
          INNER JOIN service_catalog_entities sce ON scg.service_code = sce.service_code
          WHERE sce.entity_name = ? AND sce.is_enabled = 1
        `).all(entityRecord.entity_name)
        
        // Get custom services
        entityCustomServices = db.prepare(`
          SELECT category, service_name, 'custom' as service_code
          FROM service_catalog_custom_services
          WHERE entity_name = ? AND is_active = 1
        `).all(entityRecord.entity_name)
      }
    }
    
    // Build service lists from database
    process.stdout.write('[ServiceTypes] Building service lists from database...\n')
    
    // Build Kuwait Template List (default) - from database
    const kuwaitTemplateList = buildKuwaitTemplateList()
    
    // Build Full Global List (for international_operations = true) - from database
    const fullServiceTypeList = buildFullGlobalList()
    
    process.stdout.write(`[ServiceTypes] Kuwait template list: ${kuwaitTemplateList.length} categories, Global catalog: ${fullServiceTypeList.length} categories\n`)
    process.stdout.write(`[ServiceTypes] internationalOperations flag: ${internationalOperations}, international param: ${req.query.international}\n`)
    
    // Determine which list to use based on international_operations
    // DEFAULT: Show simplified Kuwait template list (39 services, 6 categories)
    // ONLY when international_operations = true: Show full Global catalog (177+ services, 26+ categories)
    let filteredServiceList = internationalOperations ? fullServiceTypeList : kuwaitTemplateList
    
    process.stdout.write(`[ServiceTypes] Selected list: ${internationalOperations ? 'GLOBAL' : 'KUWAIT'} (${filteredServiceList.length} categories)\n`)
    
    // Entity-specific filtering (optional - can be enabled if needed)
    // For now, we use the list determined by international_operations flag above
    // Entity filtering can be added here if required in the future
    
    // Add sub-categories to Business/Asset Valuation services (Business Valuation, Asset Valuation)
    // Also ensure all services are in consistent format (string or object with value/label)
    process.stdout.write(`[ServiceTypes] Before mapping - filteredServiceList length: ${filteredServiceList.length}\n`)
    const serviceTypesWithSubCategories = filteredServiceList.map(category => {
      // Check if this category has services that need sub-categories (Business Valuation, Asset Valuation)
      const servicesWithSubs = ['Business Valuation', 'Asset Valuation']
      const hasServicesWithSubs = category.services.some(service => {
        const serviceName = typeof service === 'string' ? service : (service.value || service.label || service)
        return servicesWithSubs.includes(serviceName)
      })
      
      if (hasServicesWithSubs || category.hasSubCategories) {
        return {
          ...category,
          services: category.services.map(service => {
            const serviceName = typeof service === 'string' ? service : (service.value || service.label || service)
            const subCategories = grouped[serviceName] || []
            if (subCategories.length > 0) {
              return {
                value: serviceName,
                label: serviceName,
                subCategories: subCategories.map(sub => sub.value)
              }
            }
            // If no sub-categories, return as string
            return serviceName
          })
        }
      }
      // Ensure all services are strings (not objects) for consistency
      return {
        ...category,
        services: category.services.map(service => {
          // If already an object, keep it; otherwise convert to string
          if (typeof service === 'object' && service.value) {
            return service
          }
          return service // Keep as string
        })
      }
    })
    process.stdout.write(`[ServiceTypes] After mapping - serviceTypesWithSubCategories length: ${serviceTypesWithSubCategories.length}\n`)
    
    // Transform grouped subCategories to match frontend expectations
    // Frontend expects: { "Business Valuation": ["Acquisition", "Capital Increase", ...], ... }
    const subCategoriesForFrontend = {}
    Object.keys(grouped).forEach(serviceType => {
      subCategoriesForFrontend[serviceType] = grouped[serviceType].map(sub => sub.value)
    })
    
    // Debug logging
    process.stdout.write(`[ServiceTypes] Entity: ${entity}, Full list length: ${fullServiceTypeList.length}, Filtered length: ${filteredServiceList.length}, Final length: ${serviceTypesWithSubCategories.length}\n`)
    process.stdout.write(`[ServiceTypes] First category: ${serviceTypesWithSubCategories[0] ? serviceTypesWithSubCategories[0].category : 'NONE'}\n`)
    
    const response = {
      serviceTypes: serviceTypesWithSubCategories,
      subCategories: subCategoriesForFrontend, // Use transformed structure
      entity: entity || null,
      international: internationalOperations
    }
    
    process.stdout.write(`[ServiceTypes] Sending response with ${response.serviceTypes.length} categories\n`)
    res.json(response)
  } catch (error) {
    console.error('Error fetching service types:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * Get sub-categories for a specific service type
 */
export async function getServiceSubCategories(req, res) {
  try {
    const { serviceType } = req.params
    
    const subCategories = db.prepare(`
      SELECT sub_category, display_order
      FROM service_type_categories
      WHERE parent_service_type = ? AND is_active = 1
      ORDER BY display_order
    `).all(serviceType)
    
    res.json({
      serviceType,
      subCategories: subCategories.map(sc => sc.sub_category)
    })
  } catch (error) {
    console.error('Error fetching service sub-categories:', error)
    res.status(500).json({ error: error.message })
  }
}
