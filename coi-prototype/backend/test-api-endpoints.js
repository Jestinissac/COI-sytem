#!/usr/bin/env node

/**
 * Test API Endpoints (requires server to be running)
 */

const BASE_URL = 'http://localhost:3000/api'

// First, we need to login to get a token
async function login() {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@bdo.com',
        password: 'admin123'
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.token
    } else {
      console.log('Login failed, trying to create test user...')
      return null
    }
  } catch (error) {
    console.log('Login error:', error.message)
    return null
  }
}

async function testEndpoint(name, url, token) {
  try {
    const headers = { 'Content-Type': 'application/json' }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(url, { headers })
    const data = await response.json()
    
    if (response.ok) {
      console.log(`\n✅ ${name}`)
      console.log(`   Status: ${response.status}`)
      if (Array.isArray(data)) {
        console.log(`   Records: ${data.length}`)
        if (data.length > 0 && data.length <= 5) {
          console.log(`   Sample:`, JSON.stringify(data[0], null, 2).substring(0, 150))
        }
      } else if (typeof data === 'object') {
        console.log(`   Response keys:`, Object.keys(data).join(', '))
      }
      return { success: true, data }
    } else {
      console.log(`\n❌ ${name}`)
      console.log(`   Status: ${response.status}`)
      console.log(`   Error:`, data.error || data.message)
      return { success: false, error: data }
    }
  } catch (error) {
    console.log(`\n❌ ${name}`)
    console.log(`   Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log('🧪 Testing Service Catalog API Endpoints')
  console.log('=========================================\n')
  
  // Test 1: Health check (no auth needed)
  await testEndpoint('Health Check', `${BASE_URL}/health`, null)
  
  // Test 2: Login
  console.log('\n🔐 Attempting login...')
  const token = await login()
  
  if (!token) {
    console.log('\n⚠️  Could not get auth token. Some tests will fail.')
    console.log('   To test authenticated endpoints:')
    console.log('   1. Ensure a user exists in the database')
    console.log('   2. Login via POST /api/auth/login')
    console.log('   3. Use the token in Authorization header')
    return
  }
  
  console.log('✅ Login successful\n')
  
  // Test 3: Entity Codes
  await testEndpoint('Get Entity Codes', `${BASE_URL}/entity-codes`, token)
  
  // Test 4: Global Catalog
  await testEndpoint('Get Global Catalog', `${BASE_URL}/service-catalog/global`, token)
  
  // Test 5: Entity Catalog
  await testEndpoint('Get Entity Catalog (BDO_AL_NISF)', `${BASE_URL}/service-catalog/entity/BDO_AL_NISF`, token)
  
  // Test 6: Service Types with entity filter
  await testEndpoint('Get Service Types (filtered by entity)', `${BASE_URL}/integration/service-types?entity=BDO_AL_NISF`, token)
  
  console.log('\n✅ API endpoint tests completed!')
}

// Use native fetch (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ with native fetch support')
  console.log('   Or install node-fetch: npm install node-fetch')
  process.exit(1)
}

runTests().catch(console.error)
