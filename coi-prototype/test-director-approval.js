/**
 * Test Director Approval Fix
 */

const http = require('http');

async function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://localhost:3000');
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  console.log('Testing Director Approval Fix...\n');
  
  // 1. Login as Director
  const login = await makeRequest('POST', '/api/auth/login', {
    email: 'john.smith@company.com',
    password: 'password'
  });
  
  if (login.status !== 200) {
    console.log('❌ Director login failed');
    return;
  }
  
  const token = login.data.token;
  console.log('✅ Director logged in');
  
  // 2. Get pending requests
  const requests = await makeRequest('GET', '/api/coi/requests', null, token);
  console.log('Requests status:', requests.status);
  console.log('Requests data type:', typeof requests.data);
  console.log('Requests data:', JSON.stringify(requests.data).substring(0, 200));
  
  if (requests.status === 200 && Array.isArray(requests.data)) {
    const pending = requests.data.find(r => r.status === 'Pending Director Approval');
    if (pending) {
      console.log(`\n✅ Found pending request: ${pending.id} (${pending.request_id})`);
      
      // 3. Try to approve
      const approve = await makeRequest('POST', `/api/coi/requests/${pending.id}/approve`, {
        approval_type: 'Approved',
        comments: 'Test approval'
      }, token);
      
      console.log('\nApproval result:', approve.status);
      console.log('Approval data:', JSON.stringify(approve.data));
      
      if (approve.status === 200 || approve.status === 201) {
        console.log('\n✅ Director approval successful!');
      } else {
        console.log('\n❌ Director approval failed');
      }
    } else {
      console.log('\n⚠️  No pending director approval requests found');
    }
  }
}

test().catch(console.error);
