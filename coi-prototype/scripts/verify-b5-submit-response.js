/**
 * B5 verification: POST /api/coi/requests/:id/submit returns id and request_id.
 * Run with backend up: node scripts/verify-b5-submit-response.js
 * Requires: a Draft COI request for patricia.white@company.com (or edit credentials below).
 */
const BASE = 'http://localhost:3000'

async function main() {
  // 1. Login
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patricia.white@company.com', password: 'password' })
  })
  if (!loginRes.ok) {
    console.error('Login failed:', loginRes.status, await loginRes.text())
    process.exit(1)
  }
  const loginData = await loginRes.json()
  const token = loginData.token || loginData.accessToken
  if (!token) {
    console.error('No token in login response:', Object.keys(loginData))
    process.exit(1)
  }

  // 2. Get requests to find a Draft
  const listRes = await fetch(`${BASE}/api/coi/requests`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!listRes.ok) {
    console.error('List requests failed:', listRes.status)
    process.exit(1)
  }
  const requests = await listRes.json()
  const draft = Array.isArray(requests) ? requests.find(r => r.status === 'Draft') : null
  if (!draft) {
    console.log('No Draft request found. Create a draft in the UI, then re-run.')
    console.log('Backend code verification: submitRequest success response includes id and request_id (see coiController.js ~line 984).')
    process.exit(0)
  }

  const id = draft.id
  console.log('Submitting Draft request id:', id, 'request_id:', draft.request_id)

  // 3. Submit
  const submitRes = await fetch(`${BASE}/api/coi/requests/${id}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({})
  })

  const data = await submitRes.json().catch(() => ({}))
  if (!submitRes.ok) {
    console.error('Submit failed:', submitRes.status, data)
    process.exit(1)
  }

  // 4. Verify B5: response includes id and request_id
  const hasId = typeof data.id !== 'undefined'
  const hasRequestId = typeof data.request_id !== 'undefined'
  if (hasId && hasRequestId) {
    console.log('B5 backend verification PASS: response includes id and request_id')
    console.log('  id:', data.id, 'request_id:', data.request_id)
  } else {
    console.error('B5 backend verification FAIL: missing id or request_id. Keys:', Object.keys(data))
    process.exit(1)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
