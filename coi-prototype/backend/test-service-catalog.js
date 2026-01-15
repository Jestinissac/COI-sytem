#!/usr/bin/env node

/**
 * Quick Backend Test Script for Service Catalog System
 * Tests database setup and seed data
 */

async function testDatabaseTables() {
  console.log('\n📊 Testing Database Tables...')
  
  try {
    const { getDatabase } = await import('./src/database/init.js')
    const db = getDatabase()
    
    const tables = [
      'entity_codes',
      'service_catalog_global',
      'service_catalog_entities',
      'service_catalog_custom_services',
      'service_catalog_history',
      'service_catalog_imports'
    ]
    
    for (const table of tables) {
      try {
        const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get()
        console.log(`   ✅ ${table}: ${result.count} records`)
      } catch (error) {
        console.log(`   ❌ ${table}: ${error.message}`)
      }
    }
    
    // Check if entities are seeded
    const entities = db.prepare('SELECT * FROM entity_codes').all()
    console.log(`\n   📋 Seeded Entities: ${entities.length}`)
    entities.forEach(e => {
      console.log(`      - ${e.entity_name} (${e.entity_code})`)
    })
    
    // Check if services are seeded
    const services = db.prepare('SELECT COUNT(*) as count FROM service_catalog_global').get()
    console.log(`\n   📋 Global Services: ${services.count}`)
    
  } catch (error) {
    console.log(`   ❌ Database test error: ${error.message}`)
  }
}

async function testSeedScripts() {
  console.log('\n🌱 Testing Seed Scripts...')
  
  try {
    // Test entity codes seed
    const { seedEntityCodes } = await import('./src/scripts/seedEntityCodes.js')
    seedEntityCodes()
    console.log('   ✅ Entity codes seeded')
    
    // Test global service catalog seed
    const { seedGlobalServiceCatalog } = await import('./src/scripts/seedGlobalServiceCatalog.js')
    const result = seedGlobalServiceCatalog()
    console.log(`   ✅ Global service catalog seeded: ${result.inserted} services`)
    
  } catch (error) {
    console.log(`   ❌ Seed script error: ${error.message}`)
    console.log(`   Stack: ${error.stack}`)
  }
}

async function testControllers() {
  console.log('\n🎮 Testing Controller Functions...')
  
  try {
    const { getEntityCodes } = await import('./src/controllers/entityCodesController.js')
    const { getGlobalCatalog } = await import('./src/controllers/serviceCatalogController.js')
    
    // Create mock request/response objects
    const mockReq = {}
    const mockRes = {
      json: (data) => {
        console.log(`   ✅ getEntityCodes returned ${data.length} entities`)
        return data
      },
      status: (code) => ({
        json: (data) => {
          console.log(`   ❌ Error ${code}:`, data)
          return data
        }
      })
    }
    
    // Test entity codes (this will fail without auth, but we can check if function exists)
    console.log('   ✅ Controller functions are importable')
    
  } catch (error) {
    console.log(`   ❌ Controller test error: ${error.message}`)
  }
}

async function runTests() {
  console.log('🧪 Backend Service Catalog System Test')
  console.log('=====================================\n')
  
  // Test 1: Database tables
  await testDatabaseTables()
  
  // Test 2: Seed scripts
  await testSeedScripts()
  
  // Test 3: Re-check database after seeding
  console.log('\n📊 Database After Seeding...')
  await testDatabaseTables()
  
  // Test 4: Controllers
  await testControllers()
  
  console.log('\n\n📝 API Endpoint Testing:')
  console.log('   To test API endpoints manually:')
  console.log('   1. Start server: npm run dev')
  console.log('   2. Login: POST /api/auth/login')
  console.log('   3. Test endpoints with token:')
  console.log('      - GET /api/entity-codes')
  console.log('      - GET /api/service-catalog/global')
  console.log('      - GET /api/service-catalog/entity/BDO_AL_NISF')
  console.log('      - GET /api/integration/service-types?entity=BDO_AL_NISF')
  
  console.log('\n✅ Backend test completed!')
}

runTests().catch(console.error)
