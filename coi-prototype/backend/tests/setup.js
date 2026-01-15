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

  // Create tables directly for testing
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255),
      role VARCHAR(50),
      department VARCHAR(100),
      team_members TEXT,
      is_active INTEGER DEFAULT 1,
      unavailable_reason TEXT,
      unavailable_until DATE,
      director_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name VARCHAR(255) NOT NULL,
      client_code VARCHAR(50),
      client_status VARCHAR(50) DEFAULT 'Active',
      industry VARCHAR(100),
      country VARCHAR(100),
      parent_company_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS coi_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id VARCHAR(50),
      requester_id INTEGER,
      department VARCHAR(100),
      document_type VARCHAR(100),
      client_id INTEGER,
      client_name VARCHAR(255),
      services_requested TEXT,
      service_type VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Draft',
      parent_company VARCHAR(255),
      group_structure TEXT,
      pie_status VARCHAR(10) DEFAULT 'No',
      group_conflicts_detected TEXT,
      requires_compliance_verification INTEGER DEFAULT 0,
      parent_company_verified_by INTEGER,
      parent_company_verified_at DATETIME,
      engagement_code VARCHAR(50),
      requested_service_period_end DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requester_id) REFERENCES users(id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );
    
    CREATE TABLE IF NOT EXISTS dismissed_resolved_conflicts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      dismissed_by INTEGER NOT NULL,
      dismissed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reason TEXT,
      FOREIGN KEY (request_id) REFERENCES coi_requests(id),
      FOREIGN KEY (dismissed_by) REFERENCES users(id)
    );
  `);

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
    'dismissed_resolved_conflicts',
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
      testDb.exec(`DELETE FROM ${table}`);
    } catch (error) {
      // Table might not exist in all schemas - that's ok
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
  
  // Disable foreign key checks during seeding
  testDb.exec('PRAGMA foreign_keys = OFF');

  // Insert users
  if (data.users) {
    const stmt = testDb.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, password, role, department, team_members, is_active, unavailable_reason, unavailable_until)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    data.users.forEach(user => {
      stmt.run(
        user.id,
        user.name,
        user.email,
        user.password || 'test123',
        user.role,
        user.department || null,
        user.team_members || null,
        user.is_active !== undefined ? user.is_active : 1,
        user.unavailable_reason || null,
        user.unavailable_until || null
      );
    });
  }

  // Insert clients
  if (data.clients) {
    const stmt = testDb.prepare(`
      INSERT OR REPLACE INTO clients (id, client_name, client_code, client_status, industry)
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
      INSERT OR REPLACE INTO coi_requests (
        id, requester_id, department, document_type, client_id, client_name,
        services_requested, service_type, status, created_at, parent_company, 
        group_structure, pie_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    data.coiRequests.forEach(req => {
      stmt.run(
        req.id,
        req.requester_id || 1,
        req.department || 'General',
        req.document_type || 'Engagement',
        req.client_id,
        req.client_name,
        req.services_requested || req.service_type,
        req.service_type || req.services_requested,
        req.status || 'Draft',
        req.created_at || new Date().toISOString(),
        req.parent_company || null,
        req.group_structure || null,
        req.pie_status || 'No'
      );
    });
  }
  
  // Re-enable foreign key checks
  testDb.exec('PRAGMA foreign_keys = ON');

  return testDb;
}
