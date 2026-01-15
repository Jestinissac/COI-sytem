#!/usr/bin/env node

/**
 * Test database initialization directly
 */

import { initDatabase, getDatabase } from './src/database/init.js'

async function testInit() {
  console.log('🔄 Initializing database...\n')
  
  try {
    await initDatabase()
    console.log('\n✅ Database initialization completed')
    
    // Check tables
    const db = getDatabase()
    console.log('\n📊 Checking tables...\n')
    
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
    
    // Check seeded data
    console.log('\n📋 Checking seeded data...\n')
    
    const entities = db.prepare('SELECT * FROM entity_codes').all()
    console.log(`   Entities: ${entities.length}`)
    entities.forEach(e => {
      console.log(`      - ${e.entity_name} (${e.entity_code})`)
    })
    
    const services = db.prepare('SELECT COUNT(*) as count FROM service_catalog_global').get()
    console.log(`\n   Global Services: ${services.count}`)
    
    if (services.count > 0) {
      const sample = db.prepare('SELECT category, service_name FROM service_catalog_global LIMIT 5').all()
      console.log('\n   Sample services:')
      sample.forEach(s => {
        console.log(`      - ${s.category}: ${s.service_name.substring(0, 50)}...`)
      })
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error(error.stack)
  }
}

testInit()
