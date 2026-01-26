import { getDatabase } from '../database/init.js'
import { sendTestEmail, clearEmailConfigCache } from '../services/emailService.js'

/**
 * Email Configuration Controller
 * Handles email configuration CRUD operations
 */

/**
 * GET /api/email/config
 * Get email configuration
 */
export async function getEmailConfig(req, res) {
  try {
    const db = getDatabase()
    
    const config = db.prepare(`
      SELECT 
        id, config_name, smtp_host, smtp_port, smtp_secure,
        smtp_user, from_email, from_name, reply_to,
        is_active, test_email, last_tested_at, test_status,
        test_error, updated_at, created_at
      FROM email_config
      WHERE config_name = 'default'
      ORDER BY id DESC
      LIMIT 1
    `).get()
    
    if (!config) {
      return res.json({
        configured: false,
        message: 'No email configuration found'
      })
    }
    
    // Don't send password in response
    res.json({
      ...config,
      configured: true,
      smtp_password: '***' // Masked
    })
  } catch (error) {
    console.error('Error getting email config:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * PUT /api/email/config
 * Update email configuration
 */
export async function updateEmailConfig(req, res) {
  try {
    const { userId } = req
    const {
      smtp_host,
      smtp_port,
      smtp_secure,
      smtp_user,
      smtp_password,
      from_email,
      from_name,
      reply_to,
      is_active
    } = req.body
    
    // Validation
    if (!smtp_host || !smtp_port || !smtp_user || !from_email) {
      return res.status(400).json({
        error: 'Missing required fields: smtp_host, smtp_port, smtp_user, from_email'
      })
    }
    
    if (smtp_port < 1 || smtp_port > 65535) {
      return res.status(400).json({
        error: 'Invalid SMTP port. Must be between 1 and 65535'
      })
    }
    
    const db = getDatabase()
    
    // Check if config exists
    const existing = db.prepare('SELECT id FROM email_config WHERE config_name = ?').get('default')
    
    if (existing) {
      // Update existing config
      // Only update password if provided (not masked)
      if (smtp_password && smtp_password !== '***') {
        db.prepare(`
          UPDATE email_config
          SET smtp_host = ?,
              smtp_port = ?,
              smtp_secure = ?,
              smtp_user = ?,
              smtp_password = ?,
              from_email = ?,
              from_name = ?,
              reply_to = ?,
              is_active = ?,
              updated_by = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE config_name = 'default'
        `).run(
          smtp_host,
          smtp_port,
          smtp_secure ? 1 : 0,
          smtp_user,
          smtp_password,
          from_email,
          from_name || 'COI System',
          reply_to || null,
          is_active ? 1 : 0,
          userId
        )
      } else {
        // Update without password
        db.prepare(`
          UPDATE email_config
          SET smtp_host = ?,
              smtp_port = ?,
              smtp_secure = ?,
              smtp_user = ?,
              from_email = ?,
              from_name = ?,
              reply_to = ?,
              is_active = ?,
              updated_by = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE config_name = 'default'
        `).run(
          smtp_host,
          smtp_port,
          smtp_secure ? 1 : 0,
          smtp_user,
          from_email,
          from_name || 'COI System',
          reply_to || null,
          is_active ? 1 : 0,
          userId
        )
      }
    } else {
      // Create new config
      db.prepare(`
        INSERT INTO email_config (
          config_name, smtp_host, smtp_port, smtp_secure,
          smtp_user, smtp_password, from_email, from_name,
          reply_to, is_active, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'default',
        smtp_host,
        smtp_port,
        smtp_secure ? 1 : 0,
        smtp_user,
        smtp_password,
        from_email,
        from_name || 'COI System',
        reply_to || null,
        is_active ? 1 : 0,
        userId
      )
    }
    
    // Clear cache so new config is loaded
    clearEmailConfigCache()
    
    res.json({
      success: true,
      message: 'Email configuration updated successfully'
    })
  } catch (error) {
    console.error('Error updating email config:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * POST /api/email/config/test
 * Test email configuration by sending a test email
 */
export async function testEmailConfig(req, res) {
  try {
    const { userId } = req
    const { test_email } = req.body
    
    if (!test_email) {
      return res.status(400).json({ error: 'Test email address is required' })
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(test_email)) {
      return res.status(400).json({ error: 'Invalid email address format' })
    }
    
    const db = getDatabase()
    
    // Get current config
    const config = db.prepare(`
      SELECT * FROM email_config WHERE config_name = 'default' ORDER BY id DESC LIMIT 1
    `).get()
    
    if (!config) {
      return res.status(404).json({ error: 'Email configuration not found' })
    }
    
    if (!config.is_active) {
      return res.status(400).json({ error: 'Email configuration is not active' })
    }
    
    // Send test email
    try {
      await sendTestEmail(test_email, config)
      
      // Update test status
      db.prepare(`
        UPDATE email_config
        SET test_email = ?,
            last_tested_at = CURRENT_TIMESTAMP,
            test_status = 'success',
            test_error = NULL
        WHERE config_name = 'default'
      `).run(test_email)
      
      res.json({
        success: true,
        message: `Test email sent successfully to ${test_email}`
      })
    } catch (error) {
      // Update test status with error
      db.prepare(`
        UPDATE email_config
        SET test_email = ?,
            last_tested_at = CURRENT_TIMESTAMP,
            test_status = 'failed',
            test_error = ?
        WHERE config_name = 'default'
      `).run(test_email, error.message)
      
      res.status(500).json({
        error: 'Failed to send test email',
        details: error.message
      })
    }
  } catch (error) {
    console.error('Error testing email config:', error)
    res.status(500).json({ error: error.message })
  }
}

/**
 * GET /api/email/config/status
 * Get email configuration status
 */
export async function getEmailStatus(req, res) {
  try {
    const db = getDatabase()
    
    const config = db.prepare(`
      SELECT 
        id, is_active, test_status, last_tested_at, test_error,
        smtp_host, smtp_user, from_email
      FROM email_config
      WHERE config_name = 'default'
      ORDER BY id DESC
      LIMIT 1
    `).get()
    
    if (!config) {
      return res.json({
        configured: false,
        active: false,
        message: 'Email configuration not found'
      })
    }
    
    res.json({
      configured: true,
      active: config.is_active === 1,
      testStatus: config.test_status,
      lastTested: config.last_tested_at,
      testError: config.test_error,
      smtpHost: config.smtp_host,
      smtpUser: config.smtp_user,
      fromEmail: config.from_email
    })
  } catch (error) {
    console.error('Error getting email status:', error)
    res.status(500).json({ error: error.message })
  }
}
