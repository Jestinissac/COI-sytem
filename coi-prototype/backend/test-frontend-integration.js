#!/usr/bin/env node

/**
 * Test Frontend Integration - API Endpoints
 * Tests all endpoints that the frontend components use
 */

const BASE_URL = 'http://localhost:3000/api'

async function testEndpoint(name, method, path, body = null, headers = {}) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }
    
    if (body) {
      options.body = JSON.stringify(body)
    }
    
    const response = await fetch(`${BASE_URL}${path}`, options)
    let data
    try {
      data = await response.json()
    } catch {
      data = { raw: await response.text() }
    }
    
    const status = response.status
    const success = status >= 200 && status < 300
    
    console.log(`\n${success ? '✅' : '❌'} ${name}`)
    console.log(`   Method: ${method}`)
    console.log(`   Path: ${path}`)
    console.log(`   Status: ${status}`)
    
    if (success) {
      if (Array.isArray(data)) {
        console.log(`   Records: ${data.length}`)
        if (data.length > 0) {
          console.log(`   Sample:`, JSON.stringify(data[0], null, 2).substring(0, 150))
        }
      } else if (typeof data === 'object') {
        const keys = Object.keys(data)
        console.log(`   Response keys: ${keys.join(', ')}`)
        if (keys.length <= 5) {
          console.log(`   Data:`, JSON.stringify(data, null, 2).substring(0, 200))
        }
      }
    } else {
      console.log(`   Error:`, data.error || data.message || JSON.stringify(data).substring(0, 100))
    }
    
    return { success, status, data }
  } catch (error) {
    console.log(`\n❌ ${name}`)
    console.log(`   Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log('🧪 Frontend Integration API Tests')
  console.log('==================================\n')
  
  // Test 1: Health check
  await testEndpoint('Health Check', 'GET', '/health')
  
  // Test 2: Entity Codes (no auth - should work or return 401)
  console.log('\n📋 Testing Entity Codes Endpoints...')
  await testEndpoint('Get Entity Codes', 'GET', '/entity-codes')
  
  // Test 3: Service Catalog Global
  console.log('\n📋 Testing Service Catalog Endpoints...')
  await testEndpoint('Get Global Catalog', 'GET', '/service-catalog/global')
  
  // Test 4: Service Types (with entity filter)
  console.log('\n📋 Testing Service Types Endpoints...')
  await testEndpoint('Get Service Types (no filter)', 'GET', '/integration/service-types')
  await testEndpoint('Get Service Types (with entity)', 'GET', '/integration/service-types?entity=BDO_AL_NISF')
  await testEndpoint('Get Service Types (international)', 'GET', '/integration/service-types?international=true')
  
  // Test 5: Entity Catalog (requires entity code)
  await testEndpoint('Get Entity Catalog (BDO_AL_NISF)', 'GET', '/service-catalog/entity/BDO_AL_NISF')
  
  // Test 6: History
  await testEndpoint('Get Catalog History', 'GET', '/service-catalog/history/BDO_AL_NISF')
  
  console.log('\n\n📝 Note: Some endpoints require authentication.')
  console.log('   To test authenticated endpoints:')
  console.log('   1. Login via POST /api/auth/login')
  console.log('   2. Use the returned token in Authorization: Bearer <token> header')
  console.log('\n✅ API endpoint tests completed!')
}

// Use native fetch (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ with native fetch support')
  process.exit(1)
}

runTests().catch(console.error)
