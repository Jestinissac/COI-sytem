import fs from 'fs'
import path from 'path'
import { getDatabase } from '../database/init.js'
import { logAuditTrail } from './auditTrailService.js'

/**
 * File Upload Service
 * Handles ISQM forms, supporting documents, and other file uploads
 */

// File storage configuration
const UPLOAD_CONFIG = {
  basePath: process.env.UPLOAD_PATH || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  allowedTypes: {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png'
  },
  isqmTypes: ['ISQM1', 'ISQM2', 'ENGAGEMENT_LETTER', 'CONFLICT_WAIVER', 'SAFEGUARD_DOCUMENTATION']
}

// Ensure upload directories exist
function ensureUploadDirs() {
  const dirs = [
    UPLOAD_CONFIG.basePath,
    path.join(UPLOAD_CONFIG.basePath, 'isqm'),
    path.join(UPLOAD_CONFIG.basePath, 'supporting'),
    path.join(UPLOAD_CONFIG.basePath, 'temp')
  ]
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }
}

ensureUploadDirs()

/**
 * Validate file before upload
 */
export function validateFile(file) {
  const errors = []
  
  if (!file) {
    errors.push('No file provided')
    return { valid: false, errors }
  }
  
  // Check file size
  if (file.size > UPLOAD_CONFIG.maxFileSize) {
    errors.push(`File size exceeds maximum allowed (${UPLOAD_CONFIG.maxFileSize / 1024 / 1024}MB)`)
  }
  
  // Check file type
  const ext = path.extname(file.originalname || file.name).toLowerCase().replace('.', '')
  if (!UPLOAD_CONFIG.allowedTypes[ext]) {
    errors.push(`File type .${ext} is not allowed. Allowed types: ${Object.keys(UPLOAD_CONFIG.allowedTypes).join(', ')}`)
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Save uploaded file
 */
export async function saveFile(file, category, metadata = {}) {
  const validation = validateFile(file)
  if (!validation.valid) {
    return { success: false, errors: validation.errors }
  }
  
  const db = getDatabase()
  const timestamp = Date.now()
  const ext = path.extname(file.originalname || file.name)
  const safeFilename = `${timestamp}-${Math.random().toString(36).substring(7)}${ext}`
  const categoryPath = category === 'isqm' ? 'isqm' : 'supporting'
  const filePath = path.join(UPLOAD_CONFIG.basePath, categoryPath, safeFilename)
  
  try {
    // Write file to disk
    if (file.buffer) {
      fs.writeFileSync(filePath, file.buffer)
    } else if (file.path) {
      fs.copyFileSync(file.path, filePath)
    }
    
    // Save file metadata to database
    const result = db.prepare(`
      INSERT INTO uploaded_files (
        original_name, stored_name, file_path, file_size, mime_type,
        category, document_type, request_id, uploaded_by, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      file.originalname || file.name,
      safeFilename,
      filePath,
      file.size,
      file.mimetype || UPLOAD_CONFIG.allowedTypes[ext.replace('.', '')],
      category,
      metadata.documentType || null,
      metadata.requestId || null,
      metadata.uploadedBy || null,
      JSON.stringify(metadata)
    )
    
    // Log audit trail
    if (metadata.uploadedBy) {
      logAuditTrail(
        metadata.uploadedBy,
        'File Upload',
        result.lastInsertRowid,
        'Uploaded',
        `File uploaded: ${file.originalname || file.name} (${category})`,
        { file_size: file.size, document_type: metadata.documentType }
      )
    }
    
    return {
      success: true,
      fileId: result.lastInsertRowid,
      filename: safeFilename,
      path: filePath
    }
  } catch (error) {
    console.error('Error saving file:', error)
    return { success: false, errors: [error.message] }
  }
}

/**
 * Get file by ID
 */
export function getFile(fileId) {
  const db = getDatabase()
  return db.prepare('SELECT * FROM uploaded_files WHERE id = ?').get(fileId)
}

/**
 * Get files for a request
 */
export function getFilesForRequest(requestId) {
  const db = getDatabase()
  return db.prepare(`
    SELECT * FROM uploaded_files 
    WHERE request_id = ? 
    ORDER BY created_at DESC
  `).all(requestId)
}

/**
 * Get ISQM documents
 */
export function getISQMDocuments(filters = {}) {
  const db = getDatabase()
  
  let query = `SELECT * FROM uploaded_files WHERE category = 'isqm'`
  const params = []
  
  if (filters.documentType) {
    query += ` AND document_type = ?`
    params.push(filters.documentType)
  }
  
  if (filters.requestId) {
    query += ` AND request_id = ?`
    params.push(filters.requestId)
  }
  
  query += ` ORDER BY created_at DESC`
  
  if (filters.limit) {
    query += ` LIMIT ?`
    params.push(filters.limit)
  }
  
  return db.prepare(query).all(...params)
}

/**
 * Delete file
 */
export function deleteFile(fileId, userId) {
  const db = getDatabase()
  
  const file = getFile(fileId)
  if (!file) {
    return { success: false, error: 'File not found' }
  }
  
  try {
    // Delete from disk
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path)
    }
    
    // Delete from database
    db.prepare('DELETE FROM uploaded_files WHERE id = ?').run(fileId)
    
    // Log audit trail
    logAuditTrail(
      userId,
      'File Upload',
      fileId,
      'Deleted',
      `File deleted: ${file.original_name}`,
      { file_path: file.file_path }
    )
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting file:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Link file to request
 */
export function linkFileToRequest(fileId, requestId, userId) {
  const db = getDatabase()
  
  try {
    db.prepare(`
      UPDATE uploaded_files SET request_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(requestId, fileId)
    
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Get file statistics
 */
export function getFileStatistics() {
  const db = getDatabase()
  
  const stats = db.prepare(`
    SELECT 
      category,
      COUNT(*) as count,
      SUM(file_size) as total_size
    FROM uploaded_files
    GROUP BY category
  `).all()
  
  const byType = db.prepare(`
    SELECT 
      document_type,
      COUNT(*) as count
    FROM uploaded_files
    WHERE document_type IS NOT NULL
    GROUP BY document_type
  `).all()
  
  const recentUploads = db.prepare(`
    SELECT * FROM uploaded_files 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all()
  
  return {
    byCategory: stats,
    byDocumentType: byType,
    recentUploads,
    totalFiles: stats.reduce((sum, s) => sum + s.count, 0),
    totalSize: stats.reduce((sum, s) => sum + (s.total_size || 0), 0)
  }
}

/**
 * ISQM document types and their descriptions
 */
export function getISQMDocumentTypes() {
  return [
    {
      type: 'ISQM1',
      name: 'ISQM 1 - Quality Management',
      description: 'Quality management for firms that perform audits or reviews of financial statements',
      required: true
    },
    {
      type: 'ISQM2',
      name: 'ISQM 2 - Engagement Quality Reviews',
      description: 'Engagement quality reviews for audits and reviews of financial statements',
      required: true
    },
    {
      type: 'ENGAGEMENT_LETTER',
      name: 'Engagement Letter',
      description: 'Signed engagement letter with terms and conditions',
      required: true
    },
    {
      type: 'CONFLICT_WAIVER',
      name: 'Conflict Waiver',
      description: 'Signed waiver for identified conflicts of interest',
      required: false
    },
    {
      type: 'SAFEGUARD_DOCUMENTATION',
      name: 'Safeguard Documentation',
      description: 'Documentation of safeguards applied to mitigate independence threats',
      required: false
    },
    {
      type: 'INDEPENDENCE_CONFIRMATION',
      name: 'Independence Confirmation',
      description: 'Team independence confirmation forms',
      required: true
    },
    {
      type: 'FEE_ANALYSIS',
      name: 'Fee Analysis',
      description: 'Analysis of fees relative to audit fees (PIE clients)',
      required: false
    }
  ]
}

export default {
  validateFile,
  saveFile,
  getFile,
  getFilesForRequest,
  getISQMDocuments,
  deleteFile,
  linkFileToRequest,
  getFileStatistics,
  getISQMDocumentTypes
}

