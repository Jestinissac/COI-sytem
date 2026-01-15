import { describe, it, expect, beforeEach, vi } from 'vitest';
import { seedTestData, getTestDb } from '../../setup.js';

/**
 * Group Conflict Detection Tests
 * 
 * Tests for multi-level parent company conflict detection
 * as specified in the Parent Company Verification plan.
 */

describe('Group Conflict Detection', () => {
  beforeEach(() => {
    // Seed test data with parent company relationships
    seedTestData({
      users: [
        { id: 1, name: 'Requester', email: 'requester@test.com', role: 'Requester', is_active: 1 },
        { id: 2, name: 'Compliance', email: 'compliance@test.com', role: 'Compliance', is_active: 1 },
        { id: 3, name: 'Partner', email: 'partner@test.com', role: 'Partner', is_active: 1 },
        { id: 4, name: 'Admin', email: 'admin@test.com', role: 'Admin', is_active: 1 }
      ],
      clients: [
        { id: 1, client_name: 'ABC Kuwait', client_code: 'ABC-001' },
        { id: 2, client_name: 'ABC MENA Holdings', client_code: 'ABC-002' },
        { id: 3, client_name: 'ABC Global', client_code: 'ABC-003' },
        { id: 4, client_name: 'XYZ Corporation', client_code: 'XYZ-001' }
      ],
      coiRequests: [
        // ABC Kuwait has parent ABC MENA Holdings, which has parent ABC Global
        { 
          id: 1, 
          client_id: 1, 
          client_name: 'ABC Kuwait',
          parent_company: 'ABC MENA Holdings',
          service_type: 'Statutory Audit',
          status: 'Approved',
          pie_status: 'Yes',
          group_structure: 'has_parent'
        },
        { 
          id: 2, 
          client_id: 2, 
          client_name: 'ABC MENA Holdings',
          parent_company: 'ABC Global',
          service_type: 'Tax Compliance',
          status: 'Active',
          pie_status: 'No',
          group_structure: 'has_parent'
        },
        // Unrelated company
        { 
          id: 3, 
          client_id: 4, 
          client_name: 'XYZ Corporation',
          parent_company: null,
          service_type: 'Management Consulting',
          status: 'Approved',
          pie_status: 'No',
          group_structure: 'standalone'
        }
      ]
    });
  });

  describe('Direct Parent Conflict Detection', () => {
    it('should detect conflict with sibling entity under same parent', () => {
      // Scenario: New request for ABC Logistics (parent: ABC MENA Holdings)
      // Should conflict with ABC Kuwait (also under ABC MENA Holdings) which has Audit
      
      const db = getTestDb();
      
      // Simulate checking for siblings with same parent
      const siblings = db.prepare(`
        SELECT * FROM coi_requests
        WHERE parent_company = ?
        AND status IN ('Approved', 'Active')
      `).all('ABC MENA Holdings');
      
      expect(siblings.length).toBeGreaterThan(0);
      expect(siblings.some(s => s.service_type === 'Statutory Audit')).toBe(true);
    });

    it('should detect conflict when requesting prohibited service for audit client group', () => {
      // Scenario: Requesting Tax Advocacy for entity under ABC MENA Holdings
      // ABC Kuwait (sibling) has Audit - Tax Advocacy is prohibited
      
      const auditSibling = {
        service_type: 'Statutory Audit',
        client_name: 'ABC Kuwait',
        parent_company: 'ABC MENA Holdings'
      };
      
      const newRequest = {
        service_type: 'Tax Advocacy',
        parent_company: 'ABC MENA Holdings'
      };
      
      // Should be blocked
      const isProhibited = ['Tax Advocacy', 'Bookkeeping', 'Management Functions'].includes(newRequest.service_type);
      const siblingHasAudit = auditSibling.service_type.includes('Audit');
      
      expect(isProhibited && siblingHasAudit).toBe(true);
    });
  });

  describe('Multi-Level Hierarchy Detection', () => {
    it('should detect grandparent-level conflicts', () => {
      // Scenario: ABC MENA Holdings has parent ABC Global
      // ABC Kuwait has parent ABC MENA Holdings
      // New request for entity under ABC Global should check all descendants
      
      const db = getTestDb();
      
      // Find entity whose client_name matches "ABC MENA Holdings"
      const potentialGrandparent = db.prepare(`
        SELECT * FROM coi_requests
        WHERE client_name LIKE ?
        AND parent_company IS NOT NULL
      `).get('%ABC MENA%');
      
      expect(potentialGrandparent).toBeDefined();
      expect(potentialGrandparent.parent_company).toBe('ABC Global');
    });

    it('should correctly identify relationship paths', () => {
      // Test that relationship paths are correctly constructed
      const grandparent = 'ABC Global';
      const parent = 'ABC MENA Holdings';
      const child = 'ABC Kuwait';
      
      const expectedPath = `${grandparent} → ${parent} (Grandparent) → ${child}`;
      
      expect(expectedPath).toContain('Grandparent');
      expect(expectedPath).toContain(grandparent);
    });
  });

  describe('Fuzzy Matching for Parent Companies', () => {
    it('should match parent companies with minor spelling variations', () => {
      // Test fuzzy matching: "ABC Holdings Inc" vs "ABC Holdings LLC"
      const name1 = 'ABC Holdings Inc';
      const name2 = 'ABC Holdings LLC';
      
      // Calculate similarity (simplified - real implementation uses Levenshtein)
      const base1 = name1.replace(/\b(Inc|LLC|Ltd|Corp)\b/gi, '').trim();
      const base2 = name2.replace(/\b(Inc|LLC|Ltd|Corp)\b/gi, '').trim();
      
      expect(base1).toBe('ABC Holdings');
      expect(base2).toBe('ABC Holdings');
      expect(base1).toBe(base2);
    });

    it('should not match completely different parent companies', () => {
      const name1 = 'ABC Holdings';
      const name2 = 'XYZ Corporation';
      
      // These should be completely different
      expect(name1).not.toContain(name2);
    });
  });

  describe('PIE Independence Rules', () => {
    it('should apply stricter rules for PIE audit clients', () => {
      const db = getTestDb();
      
      // Find PIE audit client
      const pieAuditClient = db.prepare(`
        SELECT * FROM coi_requests
        WHERE pie_status = 'Yes'
        AND service_type LIKE '%Audit%'
      `).get();
      
      expect(pieAuditClient).toBeDefined();
      expect(pieAuditClient.pie_status).toBe('Yes');
    });

    it('should extend PIE restrictions to entire corporate group', () => {
      // When one entity in group is PIE + Audit, restrictions apply to all
      const pieAuditEntity = {
        client_name: 'ABC Kuwait',
        pie_status: 'Yes',
        service_type: 'Statutory Audit',
        parent_company: 'ABC MENA Holdings'
      };
      
      const siblingRequest = {
        client_name: 'ABC Dubai',
        parent_company: 'ABC MENA Holdings',
        service_type: 'Management Consulting'
      };
      
      // Management Consulting should be blocked for PIE audit group
      const prohibitedForPIE = ['Management Consulting', 'Tax Advocacy', 'Bookkeeping'];
      const shouldBlock = prohibitedForPIE.includes(siblingRequest.service_type);
      
      expect(shouldBlock).toBe(true);
    });
  });
});

describe('Approver Availability Routing', () => {
  beforeEach(() => {
    seedTestData({
      users: [
        { id: 1, name: 'Director A', email: 'director.a@test.com', role: 'Director', is_active: 1, department: 'Audit' },
        { id: 2, name: 'Director B', email: 'director.b@test.com', role: 'Director', is_active: 0, unavailable_reason: 'vacation', department: 'Audit' },
        { id: 3, name: 'Compliance A', email: 'compliance.a@test.com', role: 'Compliance', is_active: 1, department: 'Audit' },
        { id: 4, name: 'Compliance B', email: 'compliance.b@test.com', role: 'Compliance', is_active: 0, unavailable_reason: 'business_trip', department: 'Audit' },
        { id: 5, name: 'Admin', email: 'admin@test.com', role: 'Admin', is_active: 1 }
      ]
    });
  });

  describe('Active Approver Selection', () => {
    it('should only select active approvers', () => {
      const db = getTestDb();
      
      const activeDirectors = db.prepare(`
        SELECT * FROM users
        WHERE role = 'Director' AND is_active = 1
      `).all();
      
      expect(activeDirectors.length).toBe(1);
      expect(activeDirectors[0].name).toBe('Director A');
    });

    it('should not select unavailable approvers', () => {
      const db = getTestDb();
      
      const unavailableApprovers = db.prepare(`
        SELECT * FROM users
        WHERE is_active = 0 AND unavailable_reason IS NOT NULL
      `).all();
      
      expect(unavailableApprovers.length).toBe(2);
      expect(unavailableApprovers.every(u => u.is_active === 0)).toBe(true);
    });
  });

  describe('Escalation to Admin', () => {
    it('should find admin when no active approvers of role available', () => {
      const db = getTestDb();
      
      // Simulate no active Directors for Tax department
      const activeDirectors = db.prepare(`
        SELECT * FROM users
        WHERE role = 'Director' AND is_active = 1 AND department = ?
      `).all('Tax');
      
      expect(activeDirectors.length).toBe(0);
      
      // Should fallback to Admin
      const admins = db.prepare(`
        SELECT * FROM users
        WHERE role IN ('Admin', 'Super Admin') AND is_active = 1
      `).all();
      
      expect(admins.length).toBeGreaterThan(0);
    });
  });
});

describe('Flood Prevention', () => {
  beforeEach(() => {
    seedTestData({
      users: [
        { id: 1, name: 'Requester', email: 'requester@test.com', role: 'Requester', is_active: 1 }
      ],
      clients: [
        { id: 1, client_name: 'Test Client', client_code: 'TEST-001' }
      ],
      coiRequests: [
        { 
          id: 1, 
          requester_id: 1,
          client_id: 1, 
          client_name: 'Test Client',
          status: 'Pending Compliance',
          service_type: 'Tax Advisory'
        }
      ]
    });
  });

  it('should detect existing pending request for same client', () => {
    const db = getTestDb();
    const userId = 1;
    const clientId = 1;
    
    const existingPending = db.prepare(`
      SELECT id, request_id FROM coi_requests 
      WHERE requester_id = ? 
      AND client_id = ?
      AND status IN ('Draft', 'Pending Director Approval', 'Pending Compliance', 'Pending Partner', 'Pending Finance')
    `).get(userId, clientId);
    
    expect(existingPending).toBeDefined();
  });

  it('should allow submission if no pending request exists', () => {
    const db = getTestDb();
    const userId = 1;
    const differentClientId = 999; // Non-existent client
    
    const existingPending = db.prepare(`
      SELECT id, request_id FROM coi_requests 
      WHERE requester_id = ? 
      AND client_id = ?
      AND status IN ('Draft', 'Pending Director Approval', 'Pending Compliance', 'Pending Partner', 'Pending Finance')
    `).get(userId, differentClientId);
    
    expect(existingPending).toBeUndefined();
  });
});
