import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { initDatabase } from './database/init.js'
import authRoutes from './routes/auth.routes.js'
import coiRoutes from './routes/coi.routes.js'
import integrationRoutes from './routes/integration.routes.js'
import isqmRoutes from './routes/isqm.routes.js'
import globalRoutes from './routes/global.routes.js'
import executionRoutes from './routes/execution.routes.js'
import configRoutes from './routes/config.routes.js'
import changeManagementRoutes from './routes/changeManagement.routes.js'
import prospectRoutes from './routes/prospect.routes.js'
import engagementRoutes from './routes/engagement.routes.js'
import serviceCatalogRoutes from './routes/serviceCatalog.routes.js'
import entityCodesRoutes from './routes/entityCodes.routes.js'
import reportsRoutes from './routes/reports.routes.js'
import reportSharingRoutes from './routes/reportSharing.routes.js'
import prospectClientCreationRoutes from './routes/prospectClientCreation.routes.js'
import complianceRoutes from './routes/compliance.routes.js'
import countriesRoutes from './routes/countries.routes.js'
import { 
  updateMonitoringDays, 
  checkAndLapseExpiredProposals, 
  sendIntervalMonitoringAlerts,
  check3YearRenewalAlerts 
} from './services/monitoringService.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/coi-requests')
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext)
    cb(null, `${name}-${uniqueSuffix}${ext}`)
  }
})

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'image/jpeg',
    'image/png',
    'image/gif'
  ]
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Allowed types: PDF, DOCX, XLSX, images'), false)
  }
}

// Multer configuration moved to routes file to avoid circular dependency

// Initialize database
initDatabase().catch(err => {
  console.error('Database initialization error:', err)
  process.exit(1)
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/coi', coiRoutes)
app.use('/api/integration', integrationRoutes)
app.use('/api/isqm', isqmRoutes)
app.use('/api/global', globalRoutes)
app.use('/api/execution', executionRoutes)
app.use('/api/config', configRoutes)
app.use('/api/change-management', changeManagementRoutes)
app.use('/api/prospects', prospectRoutes)
app.use('/api/engagement', engagementRoutes)
app.use('/api/service-catalog', serviceCatalogRoutes)
app.use('/api/entity-codes', entityCodesRoutes)
app.use('/api/countries', countriesRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/reports', reportSharingRoutes)
app.use('/api/prospect-client-creation', prospectClientCreationRoutes)
app.use('/api/compliance', complianceRoutes)

// Conditionally load client intelligence routes (feature-flagged module)
import('../../client-intelligence/backend/routes/clientIntelligence.routes.js')
  .then(module => {
    app.use('/api/client-intelligence', module.default)
    console.log('✅ Client Intelligence routes loaded')
  })
  .catch(err => {
    // Feature may be disabled or module not available - this is OK
    console.log('ℹ️  Client Intelligence routes not loaded (feature may be disabled)')
  })

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'COI Prototype API' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  
  // ========================================
  // AUTOMATED MONITORING SCHEDULER
  // ========================================
  
  console.log('🔄 Starting automated monitoring scheduler...')
  
  // Run immediately on startup
  setTimeout(async () => {
    console.log('📊 Running initial monitoring check...')
    try {
      // Update monitoring days for all active proposals
      const monitoringResult = updateMonitoringDays()
      console.log('  ✓ Monitoring days updated')
      
      // Check and lapse expired proposals (30-day rule)
      const lapseResult = await checkAndLapseExpiredProposals()
      if (lapseResult.lapsed > 0) {
        console.log(`  ⚠️ Lapsed ${lapseResult.lapsed} expired proposals: ${lapseResult.requestIds.join(', ')}`)
      } else {
        console.log('  ✓ No proposals to lapse')
      }
      
      // Send interval alerts (every 10 days)
      const alertResult = await sendIntervalMonitoringAlerts()
      console.log(`  ✓ Monitoring alerts: ${alertResult.alertsSent || 0} sent`)
      
      // Check 3-year renewal alerts
      const renewalResult = await check3YearRenewalAlerts()
      console.log(`  ✓ Renewal alerts: ${renewalResult.alertsSent || 0} sent`)
      
    } catch (error) {
      console.error('❌ Error in initial monitoring check:', error.message)
    }
  }, 5000) // Run 5 seconds after startup
  
  // Schedule recurring checks every hour
  const MONITORING_INTERVAL_MS = 60 * 60 * 1000 // 1 hour
  
  setInterval(async () => {
    const timestamp = new Date().toISOString()
    console.log(`\n[${timestamp}] 🔄 Running scheduled monitoring check...`)
    
    try {
      // Update monitoring days
      updateMonitoringDays()
      
      // Check and lapse expired proposals
      const lapseResult = await checkAndLapseExpiredProposals()
      if (lapseResult.lapsed > 0) {
        console.log(`  ⚠️ Auto-lapsed ${lapseResult.lapsed} proposals`)
      }
      
      // Send interval alerts
      await sendIntervalMonitoringAlerts()
      
      // Check renewal alerts
      await check3YearRenewalAlerts()
      
      console.log(`  ✓ Monitoring check completed`)
    } catch (error) {
      console.error('❌ Scheduled monitoring error:', error.message)
    }
  }, MONITORING_INTERVAL_MS)
  
  console.log(`✅ Monitoring scheduler active (runs every hour)`)
})
