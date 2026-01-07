// Sample test data for unit and integration tests

export const testUsers = [
  {
    id: 1,
    name: 'Test Requester',
    email: 'requester@test.com',
    password: '$2a$10$test.hashed.password', // bcrypt hash
    role: 'Requester',
    department: 'Audit'
  },
  {
    id: 2,
    name: 'Test Director',
    email: 'director@test.com',
    password: '$2a$10$test.hashed.password',
    role: 'Director',
    department: 'Audit',
    team_members: '1,3,4'
  },
  {
    id: 3,
    name: 'Test Compliance',
    email: 'compliance@test.com',
    password: '$2a$10$test.hashed.password',
    role: 'Compliance',
    department: 'Compliance'
  },
  {
    id: 4,
    name: 'Test Partner',
    email: 'partner@test.com',
    password: '$2a$10$test.hashed.password',
    role: 'Partner',
    department: 'Audit'
  },
  {
    id: 5,
    name: 'Test Admin',
    email: 'admin@test.com',
    password: '$2a$10$test.hashed.password',
    role: 'Admin',
    department: 'Admin'
  }
];

export const testClients = [
  {
    id: 1,
    client_name: 'Test Corporation Ltd',
    client_code: 'TC001',
    client_status: 'Active',
    industry: 'Technology'
  },
  {
    id: 2,
    client_name: 'Sample Industries Inc',
    client_code: 'SI002',
    client_status: 'Active',
    industry: 'Manufacturing'
  },
  {
    id: 3,
    client_name: 'Demo Financial Services',
    client_code: 'DFS003',
    client_status: 'Inactive',
    industry: 'Finance'
  }
];

export const testCOIRequests = [
  {
    id: 1,
    requester_id: 1,
    department: 'Audit',
    document_type: 'Proposal',
    client_id: 1,
    client_name: 'Test Corporation Ltd',
    services_requested: 'Audit, Tax Advisory',
    status: 'Draft',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    requester_id: 1,
    department: 'Audit',
    document_type: 'Engagement Letter',
    client_id: 2,
    client_name: 'Sample Industries Inc',
    services_requested: 'Financial Audit',
    status: 'Pending Director Approval',
    created_at: new Date().toISOString()
  }
];

// JWT test tokens (for auth testing)
export const testTokens = {
  requester: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJSZXF1ZXN0ZXIiLCJkZXBhcnRtZW50IjoiQXVkaXQifQ',
  director: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInJvbGUiOiJEaXJlY3RvciIsImRlcGFydG1lbnQiOiJBdWRpdCJ9',
  admin: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsInJvbGUiOiJBZG1pbiIsImRlcGFydG1lbnQiOiJBZG1pbiJ9'
};

// Helper to get minimal test data set
export function getMinimalTestData() {
  return {
    users: [testUsers[0], testUsers[1]],
    clients: [testClients[0]],
    coiRequests: [testCOIRequests[0]]
  };
}

// Helper to get full test data set
export function getFullTestData() {
  return {
    users: testUsers,
    clients: testClients,
    coiRequests: testCOIRequests
  };
}
