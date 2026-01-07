import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test database path
export const TEST_DB_PATH = path.join(__dirname, 'test-coi.db');

// Global test database instance
export let testDb;

// Initialize test database before all tests
beforeAll(() => {
  // Create a fresh test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  testDb = new Database(TEST_DB_PATH);

  // Read and execute schema
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Execute schema statements
  testDb.exec(schema);

  console.log('✓ Test database initialized');
});

// Clean up after all tests
afterAll(() => {
  if (testDb) {
    testDb.close();
  }

  // Optionally remove test database file
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  console.log('✓ Test database cleaned up');
});

// Reset database state before each test
beforeEach(() => {
  if (!testDb) return;

  // Clear all tables (in correct order due to foreign keys)
  const tables = [
    'coi_attachments',
    'attachments',
    'coi_signatories',
    'coi_engagement_codes',
    'coi_requests',
    'clients',
    'users',
    'prms_projects'
  ];

  tables.forEach(table => {
    try {
      testDb.prepare(`DELETE FROM ${table}`).run();
    } catch (error) {
      // Table might not exist in all schemas
      console.warn(`Warning: Could not clear table ${table}`);
    }
  });
});

// Helper function to get test database instance
export function getTestDb() {
  return testDb;
}

// Helper function to seed test data
export function seedTestData(data) {
  if (!testDb) throw new Error('Test database not initialized');

  // Insert users
  if (data.users) {
    const stmt = testDb.prepare(`
      INSERT INTO users (id, name, email, password, role, department, team_members)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    data.users.forEach(user => {
      stmt.run(
        user.id,
        user.name,
        user.email,
        user.password,
        user.role,
        user.department,
        user.team_members || null
      );
    });
  }

  // Insert clients
  if (data.clients) {
    const stmt = testDb.prepare(`
      INSERT INTO clients (id, client_name, client_code, client_status, industry)
      VALUES (?, ?, ?, ?, ?)
    `);

    data.clients.forEach(client => {
      stmt.run(
        client.id,
        client.client_name,
        client.client_code,
        client.client_status || 'Active',
        client.industry || null
      );
    });
  }

  // Insert COI requests
  if (data.coiRequests) {
    const stmt = testDb.prepare(`
      INSERT INTO coi_requests (
        id, requester_id, department, document_type, client_id, client_name,
        services_requested, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    data.coiRequests.forEach(req => {
      stmt.run(
        req.id,
        req.requester_id,
        req.department,
        req.document_type,
        req.client_id,
        req.client_name,
        req.services_requested,
        req.status || 'Draft',
        req.created_at || new Date().toISOString()
      );
    });
  }

  return testDb;
}
