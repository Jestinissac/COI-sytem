import { generateGlobalCOIFormExcel } from '../services/excelExportService.js'
import { getDatabase } from '../database/init.js'

const db = getDatabase()

/**
 * Generate Excel from form data (for new requests)
 * This allows exporting Global COI Form before the request is submitted
 */
export async function generateExcelFromFormData(req, res) {
  try {
    const formData = req.body
    
    // Validate required fields
    if (!formData.clientName || !formData.location || !formData.clientType || 
        !formData.clientIsPIE || !formData.servicesDetails || !formData.natureOfEngagement) {
      return res.status(400).json({ 
        error: 'Missing required fields. Please complete all required fields before exporting.' 
      })
    }
    
    // Create a temporary request-like object for Excel generation
    const tempRequest = {
      id: null,
      client_name: formData.clientName,
      parent_company: formData.ultimateParentCompany || '',
      client_location: formData.location,
      relationship_with_client: formData.clientType === 'Existing' ? 'Existing Client' : 'Potential Client',
      pie_status: formData.clientIsPIE,
      service_description: formData.servicesDetails,
      service_type: formData.natureOfEngagement,
      industry: formData.industrySector || '',
      website: formData.website || '',
      related_affiliated_entities: formData.engagementInvolvesAnotherParty === 'Yes' ? 'Yes' : '',
      international_operations: true,
      foreign_subsidiaries: formData.countries?.map((c) => 
        `${c.country_code}: ${c.entityName || ''}`
      ).join(', ') || '',
      requested_service_period_start: '',
      requested_service_period_end: '',
      requestor_name: ''
    }
    
    // Generate Excel using existing service
    const workbook = await generateGlobalCOIFormExcelFromData(tempRequest)
    
    // Send file
    const filename = `Global_COI_Form_${new Date().toISOString().split('T')[0]}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(workbook)
  } catch (error) {
    console.error('Error generating Excel from form data:', error)
    res.status(500).json({ error: error.message || 'Failed to generate Excel file' })
  }
}

/**
 * Generate Global COI Form Excel from data object (not from database)
 */
async function generateGlobalCOIFormExcelFromData(requestData) {
  const ExcelJS = (await import('exceljs')).default
  
  // Map data to Global COI Form format
  const formData = {
    clientName: requestData.client_name || '',
    ultimateParentCompany: requestData.parent_company || '',
    location: requestData.client_location || 'State of Kuwait',
    clientType: requestData.relationship_with_client === 'Existing Client' ? 'Existing' : 'Potential',
    directorsAndOfficers: '',
    clientIsPIE: requestData.pie_status === 'Yes' ? 'Yes' : 'No',
    clientListedEntityAt: '',
    servicesDetails: requestData.service_description || '',
    natureOfEngagement: requestData.service_type || '',
    industrySector: requestData.industry || '',
    website: requestData.website || '',
    engagementInvolvesAnotherParty: requestData.related_affiliated_entities ? 'Yes' : 'No',
    serviceCategory: extractCategory(requestData.service_type),
    serviceType: requestData.service_type || '',
    serviceSubCategory: requestData.service_sub_category || '',
    serviceStartDate: requestData.requested_service_period_start || '',
    serviceEndDate: requestData.requested_service_period_end || '',
    engagementPartner: requestData.requestor_name || '',
    foreignOffices: requestData.foreign_subsidiaries || ''
  }
  
  // Create workbook
  const workbook = new ExcelJS.Workbook()
  
  // Sheet 1: Global COI Form
  const formSheet = workbook.addWorksheet('Global COI Form')
  
  // Set column widths
  formSheet.getColumn(1).width = 30
  formSheet.getColumn(2).width = 50
  
  // Header row
  formSheet.getRow(1).values = ['Global Conflict of Interest Review Form']
  formSheet.getRow(1).font = { bold: true, size: 14 }
  formSheet.mergeCells('A1:B1')
  
  // Client Information section
  formSheet.getRow(2).values = ['Client Information:']
  formSheet.getRow(2).font = { bold: true }
  
  // Form fields
  const formFields = [
    { label: 'Client Name:', value: formData.clientName, row: 3 },
    { label: 'Ultimate Parent company:', value: formData.ultimateParentCompany, row: 4 },
    { label: 'Location:', value: formData.location, row: 5 },
    { label: 'Client Type:', value: formData.clientType, row: 6 },
    { label: 'Directors and Officers:', value: formData.directorsAndOfficers, row: 7 },
    { label: 'Client is PIE:', value: formData.clientIsPIE, row: 8 },
    { label: 'Client is Listed Entity at:', value: formData.clientListedEntityAt, row: 9 },
    { label: 'Services\' Details:', value: formData.servicesDetails, row: 10 },
    { label: 'Nature of Engagement:', value: formData.natureOfEngagement, row: 11 },
    { label: 'Industry Sector:', value: formData.industrySector, row: 12 },
    { label: 'Website:', value: formData.website, row: 13 },
    { label: 'The Engagement Involves Another Party:', value: formData.engagementInvolvesAnotherParty, row: 14 },
    { label: 'Foreign Offices Involved:', value: formData.foreignOffices, row: 15 }
  ]
  
  formFields.forEach(field => {
    formSheet.getCell(`A${field.row}`).value = field.label
    formSheet.getCell(`A${field.row}`).font = { bold: true }
    formSheet.getCell(`B${field.row}`).value = field.value
  })
  
  // Sheet 2: Services List
  const servicesSheet = workbook.addWorksheet('Services List')
  
  // Headers
  servicesSheet.getRow(1).values = ['Category', 'Service Type']
  servicesSheet.getRow(1).font = { bold: true }
  servicesSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }
  
  // Service data
  servicesSheet.getRow(2).values = [
    formData.serviceCategory,
    formData.serviceType + (formData.serviceSubCategory ? ` - ${formData.serviceSubCategory}` : '')
  ]
  
  // Set column widths
  servicesSheet.getColumn(1).width = 50
  servicesSheet.getColumn(2).width = 80
  
  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return buffer
}

/**
 * Extract category from service type
 */
function extractCategory(serviceType) {
  if (!serviceType) return ''
  
  if (serviceType.includes('Audit')) {
    return 'Audit & Assurance'
  }
  if (serviceType.includes('Tax')) {
    return 'Tax Services'
  }
  if (serviceType.includes('Accounting') || serviceType.includes('Book')) {
    return 'Accounting Services'
  }
  if (serviceType.includes('Valuation') || serviceType.includes('Advisory') || 
      serviceType.includes('Consulting') || serviceType.includes('Transaction') ||
      serviceType.includes('Due Diligence') || serviceType.includes('Forensics')) {
    return 'Advisory'
  }
  if (serviceType.includes('IT')) {
    return 'IT Services'
  }
  
  return 'Other Services'
}
