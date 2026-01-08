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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'COI Prototype API' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})


