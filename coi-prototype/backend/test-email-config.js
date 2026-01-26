import { getDatabase } from './src/database/init.js'
import { initDatabase } from './src/database/init.js'

async function testEmailConfig() {
  console.log('🔍 Testing Email Config Setup...\n')
  
  try {
    // Initialize database (ensures tables exist)
    console.log('1. Initializing database...')
    await initDatabase()
    console.log('   ✅ Database initialized\n')
    
    // Check if table exists
    console.log('2. Checking email_config table...')
    const db = getDatabase()
    
    try {
      const tableInfo = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='email_config'
      `).get()
      
      if (tableInfo) {
        console.log('   ✅ email_config table exists')
      } else {
        console.log('   ❌ email_config table NOT found')
        return
      }
    } catch (error) {
      console.log('   ❌ Error checking table:', error.message)
      return
    }
    
    // Try to query the table
    console.log('\n3. Testing query...')
    try {
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
      
      if (config) {
        console.log('   ✅ Query successful')
        console.log('   📧 Config found:', {
          id: config.id,
          host: config.smtp_host,
          port: config.smtp_port,
          active: config.is_active
        })
      } else {
        console.log('   ⚠️  No config found (table exists but empty)')
      }
    } catch (error) {
      console.log('   ❌ Query failed:', error.message)
      return
    }
    
    console.log('\n✅ All tests passed! Email config is ready.')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testEmailConfig().then(() => {
  process.exit(0)
}).catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
