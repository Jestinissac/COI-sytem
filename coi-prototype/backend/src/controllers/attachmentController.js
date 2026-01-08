import { getDatabase } from '../database/init.js'
import { getUserById } from '../utils/userUtils.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const db = getDatabase()

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/coi-requests')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

export async function uploadAttachment(req, res) {
  try {
    const { id } = req.params
    const userId = req.userId
    const file = req.file

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Verify request exists
    const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(id)
    if (!request) {
      // Delete uploaded file if request doesn't exist
      fs.unlinkSync(file.path)
      return res.status(404).json({ error: 'Request not found' })
    }

    // Check permissions: requester, director, or admin can upload
    const user = getUserById(userId)
    const canUpload = 
      request.requester_id === userId ||
      (user.role === 'Director' && request.requester_id === user.director_id) ||
      ['Admin', 'Super Admin', 'Compliance'].includes(user.role)

    if (!canUpload) {
      fs.unlinkSync(file.path)
      return res.status(403).json({ error: 'Access denied' })
    }

    // Get attachment type from request body or default to 'justification'
    const attachmentType = req.body.attachment_type || 'justification'

    // Insert attachment record
    const result = db.prepare(`
      INSERT INTO coi_attachments (
        coi_request_id, file_name, file_path, file_type, file_size, 
        uploaded_by, attachment_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      file.originalname,
      file.path,
      file.mimetype,
      file.size,
      userId,
      attachmentType
    )

    const attachment = db.prepare('SELECT * FROM coi_attachments WHERE id = ?').get(result.lastInsertRowid)

    res.status(201).json({
      success: true,
      attachment: {
        id: attachment.id,
        file_name: attachment.file_name,
        file_type: attachment.file_type,
        file_size: attachment.file_size,
        attachment_type: attachment.attachment_type,
        uploaded_by: attachment.uploaded_by,
        created_at: attachment.created_at
      }
    })
  } catch (error) {
    // Clean up file if error occurred
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path)
      } catch (e) {
        console.error('Failed to delete file:', e)
      }
    }
    res.status(500).json({ error: error.message })
  }
}

export async function getAttachments(req, res) {
  try {
    const { id } = req.params
    const userId = req.userId

    // Verify request exists
    const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(id)
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    // Check permissions
    const user = getUserById(userId)
    const canView = 
      request.requester_id === userId ||
      (user.role === 'Director' && request.requester_id === user.director_id) ||
      ['Admin', 'Super Admin', 'Compliance', 'Partner', 'Finance'].includes(user.role)

    if (!canView) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Get attachments
    const attachments = db.prepare(`
      SELECT 
        a.*,
        u.name as uploaded_by_name,
        u.email as uploaded_by_email
      FROM coi_attachments a
      LEFT JOIN users u ON a.uploaded_by = u.id
      WHERE a.coi_request_id = ?
      ORDER BY a.created_at DESC
    `).all(id)

    res.json({ attachments })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function downloadAttachment(req, res) {
  try {
    const { id, attachmentId } = req.params
    const userId = req.userId

    // Verify request exists
    const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(id)
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    // Get attachment
    const attachment = db.prepare('SELECT * FROM coi_attachments WHERE id = ? AND coi_request_id = ?').get(attachmentId, id)
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' })
    }

    // Check permissions
    const user = getUserById(userId)
    const canView = 
      request.requester_id === userId ||
      (user.role === 'Director' && request.requester_id === user.director_id) ||
      ['Admin', 'Super Admin', 'Compliance', 'Partner', 'Finance'].includes(user.role)

    if (!canView) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Check if file exists
    if (!fs.existsSync(attachment.file_path)) {
      return res.status(404).json({ error: 'File not found on server' })
    }

    // Send file
    res.download(attachment.file_path, attachment.file_name)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function deleteAttachment(req, res) {
  try {
    const { id, attachmentId } = req.params
    const userId = req.userId

    // Verify request exists
    const request = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(id)
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }

    // Get attachment
    const attachment = db.prepare('SELECT * FROM coi_attachments WHERE id = ? AND coi_request_id = ?').get(attachmentId, id)
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' })
    }

    // Check permissions: only uploader, requester, or admin can delete
    const user = getUserById(userId)
    const canDelete = 
      attachment.uploaded_by === userId ||
      request.requester_id === userId ||
      ['Admin', 'Super Admin'].includes(user.role)

    if (!canDelete) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Delete file from filesystem
    if (fs.existsSync(attachment.file_path)) {
      fs.unlinkSync(attachment.file_path)
    }

    // Delete from database
    db.prepare('DELETE FROM coi_attachments WHERE id = ?').run(attachmentId)

    res.json({ success: true, message: 'Attachment deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

