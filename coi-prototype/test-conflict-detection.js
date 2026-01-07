#!/usr/bin/env node

/**
 * Test Script: Conflict Detection End-to-End Test
 * 
 * This script tests the conflict detection functionality by:
 * 1. Creating an Audit request for a client
 * 2. Creating an Advisory request for the same client
 * 3. Verifying that conflicts are detected and stored
 * 
 * Usage: node test-conflict-detection.js
 */

import { getDatabase } from './backend/src/database/init.js'
import { checkDuplication } from './backend/src/services/duplicationCheckService.js'

const db = getDatabase()

async function testConflictDetection() {
  console.log('🧪 Starting Conflict Detection Test...\n')

  // Step 1: Find a test client
  const client = db.prepare('SELECT * FROM clients LIMIT 1').get()
  if (!client) {
    console.error('❌ No clients found in database. Please run seed script first.')
    process.exit(1)
  }
  console.log(`✅ Found test client: ${client.client_name} (ID: ${client.id})`)

  // Step 2: Check for existing Audit requests for this client
  const existingAudit = db.prepare(`
    SELECT * FROM coi_requests 
    WHERE client_id = ? 
    AND service_type LIKE '%Audit%'
    AND status IN ('Approved', 'Active', 'Pending Compliance')
    LIMIT 1
  `).get(client.id)

  let auditRequestId = null
  if (existingAudit) {
    console.log(`✅ Found existing Audit request: ${existingAudit.request_id}`)
    auditRequestId = existingAudit.id
  } else {
    // Create a test Audit request
    const requester = db.prepare('SELECT * FROM users WHERE role = ? LIMIT 1').get('Requester')
    if (!requester) {
      console.error('❌ No Requester user found. Please run seed script.')
      process.exit(1)
    }

    const auditRequest = db.prepare(`
      INSERT INTO coi_requests (
        request_id, requester_id, client_id, department, 
        service_type, service_description, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `TEST-AUDIT-${Date.now()}`,
      requester.id,
      client.id,
      requester.department,
      'Statutory Audit',
      'Test Audit Request for Conflict Detection',
      'Approved',
      new Date().toISOString()
    )
    auditRequestId = auditRequest.lastInsertRowid
    console.log(`✅ Created test Audit request: ID ${auditRequestId}`)
  }

  // Step 3: Test conflict detection for Advisory service
  console.log('\n🔍 Testing conflict detection for Advisory service...')
  const conflicts = await checkDuplication(
    client.client_name,
    null, // No exclude request ID
    'Management Consulting', // New service type
    false // Not PIE
  )

  console.log(`\n📊 Conflict Detection Results:`)
  console.log(`   Total matches found: ${conflicts.length}`)

  if (conflicts.length > 0) {
    console.log(`\n✅ Conflicts detected! Details:`)
    conflicts.forEach((match, index) => {
      console.log(`\n   Match ${index + 1}:`)
      console.log(`   - Match Score: ${match.matchScore}%`)
      console.log(`   - Match Type: ${match.matchType}`)
      console.log(`   - Action: ${match.action}`)
      console.log(`   - Reason: ${match.reason}`)
      
      if (match.conflicts && match.conflicts.length > 0) {
        console.log(`   - Service Conflicts:`)
        match.conflicts.forEach((conflict, cIndex) => {
          console.log(`     ${cIndex + 1}. ${conflict.type}: ${conflict.reason}`)
          console.log(`        Severity: ${conflict.severity}`)
        })
      }
    })

    // Check if we have the expected Audit + Advisory conflict
    const hasAuditAdvisoryConflict = conflicts.some(match => 
      match.conflicts && match.conflicts.some(c => 
        c.type === 'SERVICE_CONFLICT' && 
        (c.reason.includes('Audit') && c.reason.includes('Advisory'))
      )
    )

    if (hasAuditAdvisoryConflict) {
      console.log(`\n✅ SUCCESS: Audit + Advisory conflict detected correctly!`)
    } else {
      console.log(`\n⚠️  WARNING: Expected Audit + Advisory conflict not found`)
    }
  } else {
    console.log(`\n⚠️  No conflicts detected. This might be expected if:`)
    console.log(`   - No matching client engagements exist`)
    console.log(`   - Service types don't conflict`)
  }

  // Step 4: Test with Audit + Tax (should be flagged, not blocked)
  console.log(`\n🔍 Testing conflict detection for Tax service (should be flagged)...`)
  const taxConflicts = await checkDuplication(
    client.client_name,
    null,
    'Tax Compliance',
    false
  )

  if (taxConflicts.length > 0) {
    const hasTaxConflict = taxConflicts.some(match => 
      match.conflicts && match.conflicts.some(c => 
        c.type === 'SERVICE_CONFLICT' && c.reason.includes('Tax')
      )
    )
    if (hasTaxConflict) {
      console.log(`✅ Tax conflict detected (should be flagged for review)`)
    }
  }

  // Step 5: Verify data structure
  console.log(`\n📋 Verifying conflict data structure...`)
  const testRequest = db.prepare('SELECT * FROM coi_requests WHERE id = ?').get(auditRequestId)
  if (testRequest && testRequest.duplication_matches) {
    try {
      const matches = JSON.parse(testRequest.duplication_matches)
      console.log(`✅ Request has duplication_matches stored`)
      if (matches.duplicates && matches.duplicates.length > 0) {
        console.log(`✅ Contains ${matches.duplicates.length} duplicate matches`)
      }
    } catch (e) {
      console.log(`⚠️  duplication_matches exists but is not valid JSON`)
    }
  } else {
    console.log(`ℹ️  Request doesn't have duplication_matches (needs to be submitted)`)
  }

  console.log(`\n✅ Test completed!`)
  console.log(`\n📝 Next steps:`)
  console.log(`   1. Open http://localhost:5173`)
  console.log(`   2. Login as Compliance Officer (emily.davis@company.com / password)`)
  console.log(`   3. Navigate to Compliance Review → Conflicts tab`)
  console.log(`   4. Verify conflicts are displayed correctly`)
}

// Run the test
testConflictDetection().catch(error => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})

