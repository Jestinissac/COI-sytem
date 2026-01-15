import ExcelJS from 'exceljs'
import { getDatabase } from '../database/init.js'

const db = getDatabase()

/**
 * Map COI request data to Global COI Form format
 */
export function mapCOIRequestToGlobalForm(coiRequest, client) {
  return {
    // Sheet 1: Global COI Form
    clientName: client?.client_name || coiRequest.client_name || '',
    ultimateParentCompany: coiRequest.parent_company || '',
    location: coiRequest.client_location || 'State of Kuwait',
    clientType: coiRequest.relationship_with_client === 'Existing Client' ? 'Existing' : 'Potential',
    directorsAndOfficers: '', // Extract from coi_signatories if available
    clientIsPIE: coiRequest.pie_status === 'Yes' ? 'Yes' : 'No',
    clientListedEntityAt: '', // Extract from client data if available
    servicesDetails: coiRequest.service_description || '',
    natureOfEngagement: coiRequest.service_type || '',
    industrySector: client?.industry || coiRequest.industry || '',
    website: client?.website || '',
    engagementInvolvesAnotherParty: coiRequest.related_affiliated_entities ? 'Yes' : 'No',
    
    // Sheet 2: Services List
    serviceCategory: extractCategory(coiRequest.service_type),
    serviceType: coiRequest.service_type || '',
    serviceSubCategory: coiRequest.service_sub_category || '',
    
    // Additional fields if available
    serviceStartDate: coiRequest.requested_service_period_start || '',
    serviceEndDate: coiRequest.requested_service_period_end || '',
    engagementPartner: coiRequest.requestor_name || '',
    foreignOffices: coiRequest.foreign_subsidiaries || ''
  }
}

/**
 * Extract category from service type
 */
function extractCategory(serviceType) {
  if (!serviceType) return ''
  
  // Map service types to categories
  if (serviceType.includes('Audit') || serviceType.includes('Assurance')) {
    return 'Audit & Assurance'
  }
  if (serviceType.includes('Advisory')) {
    return 'Advisory'
  }
  if (serviceType.includes('Tax')) {
    return 'Tax'
  }
  if (serviceType.includes('Accounting')) {
    return 'Accounting Services'
  }
  if (serviceType.includes('Valuation')) {
    return 'Business/Asset Valuation'
  }
  
  return 'Other Services'
}

/**
 * Generate Global COI Form Excel file
 * Matches BDO Global format with 2 sheets: "Global COI Form" and "Services List"
 */
export async function generateGlobalCOIFormExcel(requestId) {
  try {
    // Fetch full COI request with client data
    const request = db.prepare(`
      SELECT 
        cr.*,
        c.client_name, c.industry, c.website, c.commercial_registration
      FROM coi_requests cr
      LEFT JOIN clients c ON cr.client_id = c.id
      WHERE cr.id = ?
    `).get(requestId)
    
    const client = request ? {
      client_name: request.client_name,
      industry: request.industry,
      website: request.website
    } : null
    
    if (!request) {
      throw new Error('COI request not found')
    }
    
    // Check if international_operations is true
    if (!request.international_operations) {
      throw new Error('Global COI Form export is only available for requests with international operations')
    }
    
    // Map COI request to Global COI Form format
    const formData = mapCOIRequestToGlobalForm(request, client)
    
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
    
    // Form fields (matching Global COI Form structure)
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
      { label: 'The Engagement Involves Another Party:', value: formData.engagementInvolvesAnotherParty, row: 14 }
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
    
    return {
      buffer,
      filename: `Global_COI_Form_${request.request_id}_${new Date().toISOString().split('T')[0]}.xlsx`
    }
  } catch (error) {
    console.error('Error generating Global COI Form Excel:', error)
    throw error
  }
}

/**
 * Export Global COI Form Excel (controller function)
 */
export async function exportGlobalCOIFormExcel(req, res) {
  try {
    const { requestId } = req.params
    const userId = req.userId
    const userRole = req.userRole
    
    // Check permissions - Compliance only
    if (userRole !== 'Compliance') {
      return res.status(403).json({ error: 'Only Compliance team can export Global COI Form' })
    }
    
    // Check if request has international_operations
    const request = db.prepare('SELECT international_operations FROM coi_requests WHERE id = ?').get(requestId)
    if (!request) {
      return res.status(404).json({ error: 'COI request not found' })
    }
    
    if (!request.international_operations) {
      return res.status(400).json({ error: 'Global COI Form export is only available for requests with international operations' })
    }
    
    // Generate Excel
    const { buffer, filename } = await generateGlobalCOIFormExcel(requestId)
    
    // Track export
    try {
      db.prepare(`
        INSERT OR REPLACE INTO global_coi_submissions (
          coi_request_id, excel_exported, excel_export_date, exported_by
        ) VALUES (?, 1, datetime('now'), ?)
      `).run(requestId, userId)
    } catch (error) {
      // Table might not exist yet, that's okay
      console.log('Note: Could not track export in global_coi_submissions table')
    }
    
    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  } catch (error) {
    console.error('Error exporting Global COI Form:', error)
    res.status(500).json({ error: error.message || 'Failed to export Global COI Form' })
  }
}

/**
 * Generate Excel report for any report type
 */
export async function generateReportExcel(reportData, reportType, reportTitle, filters = {}) {
  try {
    const workbook = new ExcelJS.Workbook()
    
    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary')
    summarySheet.getColumn(1).width = 30
    summarySheet.getColumn(2).width = 50
    
    // Title
    summarySheet.getRow(1).values = [reportTitle]
    summarySheet.getRow(1).font = { bold: true, size: 14 }
    summarySheet.mergeCells('A1:B1')
    
    // Generated date
    summarySheet.getRow(2).values = ['Generated:', new Date().toLocaleString()]
    summarySheet.getRow(2).font = { bold: true }
    
    if (filters.dateFrom || filters.dateTo) {
      summarySheet.getRow(3).values = [
        'Date Range:',
        `${filters.dateFrom || 'All'} to ${filters.dateTo || 'All'}`
      ]
      summarySheet.getRow(3).font = { bold: true }
    }
    
    // Summary data
    if (reportData.summary) {
      let row = 5
      summarySheet.getRow(row).values = ['Summary Metrics']
      summarySheet.getRow(row).font = { bold: true, size: 12 }
      row++
      
      const summary = reportData.summary
      Object.keys(summary).forEach(key => {
        if (typeof summary[key] === 'object' && !Array.isArray(summary[key])) {
          // Nested object
          summarySheet.getRow(row).values = [key, '']
          summarySheet.getRow(row).font = { bold: true }
          row++
          Object.keys(summary[key]).forEach(subKey => {
            summarySheet.getRow(row).values = [`  ${subKey}`, summary[key][subKey]]
            row++
          })
        } else {
          summarySheet.getRow(row).values = [key, summary[key]]
          row++
        }
      })
    }
    
    // Data sheets
    if (reportData.requests && reportData.requests.length > 0) {
      const dataSheet = workbook.addWorksheet('Requests')
      
      // Headers
      const headers = Object.keys(reportData.requests[0])
      dataSheet.getRow(1).values = headers.map(h => h.replace(/_/g, ' ').toUpperCase())
      dataSheet.getRow(1).font = { bold: true }
      dataSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      }
      
      // Data rows
      reportData.requests.forEach((row, index) => {
        const excelRow = dataSheet.getRow(index + 2)
        headers.forEach((header, colIndex) => {
          excelRow.getCell(colIndex + 1).value = row[header] || ''
        })
      })
      
      // Auto-fit columns
      headers.forEach((_, index) => {
        dataSheet.getColumn(index + 1).width = 20
      })
    }
    
    if (reportData.codes && reportData.codes.length > 0) {
      const codesSheet = workbook.addWorksheet('Engagement Codes')
      
      const headers = Object.keys(reportData.codes[0])
      codesSheet.getRow(1).values = headers.map(h => h.replace(/_/g, ' ').toUpperCase())
      codesSheet.getRow(1).font = { bold: true }
      codesSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      }
      
      reportData.codes.forEach((row, index) => {
        const excelRow = codesSheet.getRow(index + 2)
        headers.forEach((header, colIndex) => {
          excelRow.getCell(colIndex + 1).value = row[header] || ''
        })
      })
      
      headers.forEach((_, index) => {
        codesSheet.getColumn(index + 1).width = 20
      })
    }
    
    if (reportData.prospects && reportData.prospects.length > 0) {
      const prospectsSheet = workbook.addWorksheet('Prospects')
      
      const headers = Object.keys(reportData.prospects[0])
      prospectsSheet.getRow(1).values = headers.map(h => h.replace(/_/g, ' ').toUpperCase())
      prospectsSheet.getRow(1).font = { bold: true }
      prospectsSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      }
      
      reportData.prospects.forEach((row, index) => {
        const excelRow = prospectsSheet.getRow(index + 2)
        headers.forEach((header, colIndex) => {
          excelRow.getCell(colIndex + 1).value = row[header] || ''
        })
      })
      
      headers.forEach((_, index) => {
        prospectsSheet.getColumn(index + 1).width = 20
      })
    }
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`
    
    return { buffer, filename }
  } catch (error) {
    console.error('Error generating Excel report:', error)
    throw error
  }
}
