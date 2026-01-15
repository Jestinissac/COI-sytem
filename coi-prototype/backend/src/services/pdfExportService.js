import PDFDocument from 'pdfkit'

/**
 * Generate PDF report
 */
export function generatePDFReport(reportData, reportType, reportTitle, filters = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 })
      const chunks = []
      
      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks)
        resolve(buffer)
      })
      doc.on('error', reject)
      
      // Header
      doc.fontSize(20).font('Helvetica-Bold')
        .text(reportTitle, { align: 'center' })
      
      doc.moveDown()
      doc.fontSize(10).font('Helvetica')
        .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
      
      if (filters.dateFrom || filters.dateTo) {
        doc.text(
          `Date Range: ${filters.dateFrom || 'All'} to ${filters.dateTo || 'All'}`,
          { align: 'center' }
        )
      }
      
      doc.moveDown(2)
      
      // Summary section
      if (reportData.summary) {
        doc.fontSize(14).font('Helvetica-Bold')
          .text('Summary', { underline: true })
        doc.moveDown()
        doc.fontSize(10).font('Helvetica')
        
        const summary = reportData.summary
        let y = doc.y
        
        Object.keys(summary).forEach(key => {
          if (typeof summary[key] === 'object' && !Array.isArray(summary[key])) {
            // Nested object
            doc.font('Helvetica-Bold').text(`${key}:`)
            doc.font('Helvetica')
            Object.keys(summary[key]).forEach(subKey => {
              doc.text(`  ${subKey}: ${summary[key][subKey]}`, { indent: 20 })
            })
          } else {
            doc.text(`${key}: ${summary[key]}`)
          }
          doc.moveDown(0.5)
        })
        
        doc.moveDown()
      }
      
      // Data section
      if (reportData.requests && reportData.requests.length > 0) {
        doc.addPage()
        doc.fontSize(14).font('Helvetica-Bold')
          .text('Request Details', { underline: true })
        doc.moveDown()
        
        // Table headers
        const headers = Object.keys(reportData.requests[0])
        doc.fontSize(9).font('Helvetica-Bold')
        let x = 50
        const colWidth = 100
        headers.forEach((header, i) => {
          doc.text(header.replace(/_/g, ' ').toUpperCase(), x + (i * colWidth), doc.y, {
            width: colWidth,
            align: 'left'
          })
        })
        
        doc.moveDown()
        doc.strokeColor('#000000')
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
        doc.moveDown(0.5)
        
        // Table rows
        doc.fontSize(8).font('Helvetica')
        reportData.requests.forEach((row, rowIndex) => {
          if (doc.y > 700) { // New page if needed
            doc.addPage()
            // Redraw headers
            doc.fontSize(9).font('Helvetica-Bold')
            headers.forEach((header, i) => {
              doc.text(header.replace(/_/g, ' ').toUpperCase(), x + (i * colWidth), doc.y, {
                width: colWidth,
                align: 'left'
              })
            })
            doc.moveDown()
            doc.strokeColor('#000000')
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
            doc.moveDown(0.5)
            doc.fontSize(8).font('Helvetica')
          }
          
          headers.forEach((header, i) => {
            const value = String(row[header] || '').substring(0, 20) // Truncate long values
            doc.text(value, x + (i * colWidth), doc.y, {
              width: colWidth,
              align: 'left'
            })
          })
          doc.moveDown(0.8)
        })
      }
      
      // Similar handling for other data types (codes, prospects, etc.)
      if (reportData.codes && reportData.codes.length > 0) {
        doc.addPage()
        doc.fontSize(14).font('Helvetica-Bold')
          .text('Engagement Codes', { underline: true })
        doc.moveDown()
        
        doc.fontSize(10).font('Helvetica')
        reportData.codes.forEach(code => {
          doc.text(`Code: ${code.engagement_code} - ${code.client_name} - ${code.service_type}`)
          doc.moveDown(0.5)
        })
      }
      
      if (reportData.prospects && reportData.prospects.length > 0) {
        doc.addPage()
        doc.fontSize(14).font('Helvetica-Bold')
          .text('Prospects', { underline: true })
        doc.moveDown()
        
        doc.fontSize(10).font('Helvetica')
        reportData.prospects.forEach(prospect => {
          doc.text(`${prospect.client_name} - ${prospect.prospect_status} - ${prospect.status}`)
          doc.moveDown(0.5)
        })
      }
      
      // Footer on each page
      const pageCount = doc.bufferedPageRange().count
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i)
        doc.fontSize(8).font('Helvetica')
          .text(
            `Page ${i + 1} of ${pageCount}`,
            50,
            doc.page.height - 30,
            { align: 'center', width: doc.page.width - 100 }
          )
      }
      
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}
