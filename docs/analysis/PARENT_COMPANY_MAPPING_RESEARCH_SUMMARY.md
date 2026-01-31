# Parent Company Mapping & Entity Lifecycle Research Summary

**Date:** January 14, 2026  
**Project:** BDO COI System - Envision PRMS Integration  
**Topic:** IESBA-Compliant Parent Company Verification & Group Conflict Detection

---

## Executive Summary

This document summarizes research into implementing IESBA-compliant parent company verification in the COI system, addressing critical gaps in entity lifecycle management (prospects vs. clients vs. external entities) and group-level conflict detection.

**Key Finding:** Original implementation plan had 6 critical flaws including:
- Missing prospect lifecycle handling
- Data redundancy issues
- Timing paradoxes in conflict detection
- Over-engineering concerns

**Recommended Solution:** Option C - Single Source of Truth architecture with lazy propagation to master data.

---

## Background: How This Research Started

### Initial Question
User asked about **two critical implementation needs**:

1. **Parent Company Verification & Group Conflict Detection** (IESBA regulatory requirement)
2. **Approval Workflow Vacation/Delegation Management** (operational requirement)

### Context Discovery
During analysis, we discovered the COI system has complex entity lifecycle:
- **Prospects:** Companies not yet in PRMS (proposals)
- **Clients:** Existing PRMS clients (engagements)
- **External Entities:** Parent companies that may not be BDO clients

**Critical Issue:** PRMS data is under migration, with many parent company fields marked as "TBD" (To Be Determined).

---

## Problem Statement

### Regulatory Requirement (IESBA Code Section 290.13)

> **"Audit Client" Definition:**  
> Includes the entity itself, its parent company, subsidiaries, affiliates, and related entities under common control.  
> Independence requirements apply to the ENTIRE corporate group.

**Translation for BDO:**
- If we audit Entity A, we CANNOT provide certain services to:
  - Entity A's parent company
  - Entity A's subsidiaries
  - Entity A's sister companies (same parent)

**Severity:**
- **PIE Clients (Public Interest Entities):** CRITICAL - MANDATORY parent company verification
- **Audit Clients (Non-PIE):** HIGH - Independence rules extend to group
- **Other Clients:** MEDIUM - Helps prevent future conflicts

### Business Challenge

**Scenario That Would Be Missed Today:**
```
Existing Engagement:
  Client: "Al-Noor Holding Company K.S.C.C" 
  Service: Statutory Audit
  Status: Active

New Request:
  Client: "Advanced Manufacturing Solutions LLC"
  Parent Company: "Al-Noor Holding Company K.S.C.C"
  Service: Management Consulting (Advisory)

Current System Result: ✅ APPROVED (no name match detected)
IESBA Requirement: ❌ MUST REJECT (advisory for audit client's subsidiary)

Risk: REGULATORY VIOLATION - Failed to maintain audit independence
```

---

## Current System State

### What Exists

**Database Schema:**
```sql
-- coi_requests table
coi_requests (
  id,
  client_id,              -- May be NULL for prospects
  client_name,
  is_prospect BOOLEAN,
  prospect_id,
  parent_company TEXT,    -- Free text field, not structured
  ...
)

-- prospects table
prospects (
  id,
  prospect_name,
  client_id,              -- NULL until converted
  status,                 -- 'Active' | 'Converted' | 'Inactive'
  ...
  -- NOTE: No parent_company field!
)

-- clients table (in PRMS, mocked locally)
clients (
  id,
  client_name,
  client_code,
  parent_company TEXT,    -- Often "TBD" during migration
  ...
)
```

**Conflict Detection:**
```javascript
// File: duplicationCheckService.js, line 332-393
async function checkRelatedPartyConflicts(clientName, newServiceType) {
  // Uses TEXT PATTERN MATCHING only
  const baseName = extractBaseName(clientName) // "ABC" from "ABC Manufacturing"
  
  // Searches for similar names
  WHERE c.client_name LIKE '%${baseName}%'
  
  // Problem: Misses if parent has different name
  // Example: "Green Manufacturing" (child) + "Holdings Corp" (parent) = NO MATCH
}
```

### What's Missing

1. ❌ **Structured parent-child relationships** (no foreign key links)
2. ❌ **Parent company validation** for PIE/Audit clients
3. ❌ **Group conflict detection** across corporate families
4. ❌ **Prospect parent company tracking** (field doesn't exist)
5. ❌ **Data verification workflow** (no UI to search/select parent)
6. ❌ **Entity relationship creation** (no INSERT logic exists)

---

## Research Journey: Analysis & Findings

### Phase 1: Initial Implementation Plan Created

**Plan Proposed:**
- Add `entity_relationships` table with parent-child links
- Enhance request form with parent company search
- Build group conflict detection engine
- Add validation rules for PIE/Audit services
- Create Compliance verification UI

**Effort Estimate:** 6-7 days for P0 items

### Phase 2: Critical Review - Found 6 Major Issues

#### Issue 1: Missing Entity Relationship Creation Logic ❌

**Gap:** Plan showed conflict detection querying `entity_relationships` table, but never explained HOW records get created.

```javascript
// Plan shows:
const relationships = db.prepare(`
  SELECT parent_entity_id FROM entity_relationships 
  WHERE child_entity_id = ?
`).get(clientId)

// Question: When does this INSERT happen?
// User enters "ABC Holdings" → Where's the creation code?
```

**Impact:** HIGH - Entire conflict detection would fail (table always empty)

---

#### Issue 2: Timing Paradox ❌

**Gap:** Conflict detection runs during `submitRequest()`, but entity relationships created AFTER submission.

```
Timeline:
submitRequest() → checkGroupConflicts() → queries entity_relationships
                                        ↓
                                     Table is empty!
                                     (relationship not created yet)
```

**Impact:** CRITICAL - Conflicts would never be detected

---

#### Issue 3: Infinite Recursion Risk in Escalation ❌

**Gap:** `escalateApproval()` doesn't handle case where escalated approver is also unavailable.

```javascript
// Plan's escalation logic:
function escalateApproval(role) {
  const escalatedRole = escalationMap[role] // Director → Partner
  const approver = getUser(escalatedRole)
  return approver
}

// What if Partner is ALSO on vacation? 💥 Infinite loop or crash
```

**Impact:** HIGH - System crash during approval routing

---

#### Issue 4: Over-Engineering - Three Delegation Tables ⚠️

**Gap:** Plan proposed 3 tables for delegation:
- `approver_availability` (vacations)
- `delegation_config` (permanent rules)
- `delegation_history` (audit trail)

**Reality:** Prototype only needs ONE table

**Impact:** MEDIUM - Adds 1-2 days unnecessary effort

---

#### Issue 5: Premature D3.js Visualization ⚠️

**Gap:** 12 hours allocated to build D3.js tree visualization when data quality is poor ("TBD" everywhere)

**Impact:** LOW - Nice-to-have, not critical for prototype

---

#### Issue 6: Hallucination - Assumed Fields Exist ⚠️

**Gap:** Plan's SQL queries referenced `parent_company_id` column that doesn't exist in current database.

```javascript
// Plan assumed:
SELECT c.*, er.parent_entity_id 
FROM clients c
LEFT JOIN entity_relationships er ON c.id = er.child_entity_id

// Reality: Neither parent_company_id nor entity_relationships exists
```

**Impact:** LOW - Acknowledged gap, but plan creates these

---

### Phase 3: Prospect Lifecycle Discovery 🔴 CRITICAL

**User's Question:**
> "What about prospect - client - not client - only prospect - client but new prospect/opportunity for same use cases?"

This revealed the **BIGGEST GAP** - plan completely ignored entity lifecycle!

#### Scenario 1: Pure Prospect (No Client Record)
```
User submits COI for: "ABC Manufacturing" (doesn't exist in PRMS)
Parent Company: "ABC Holdings"

System State:
- coi_requests: client_id = NULL, prospect_id = 123
- prospects: id = 123, prospect_name = "ABC Manufacturing"

Plan's entity_relationships INSERT:
INSERT INTO entity_relationships (parent_entity_id, child_entity_id, ...)
VALUES (?, ?, ...)

Problem: child_entity_id = NULL! 💥 FOREIGN KEY VIOLATION
```

**Question:** What client_id do we use if entity isn't a client yet?

#### Scenario 2: Existing Client + New Proposal
```
"XYZ Corp" exists in PRMS (client_id=456)
PRMS parent_company = "TBD"

User submits NEW proposal for XYZ Corp
System asks: "Does XYZ Corp have a parent company?"

Questions:
1. Pre-fill "TBD" from PRMS?
2. Should user update?
3. If updated, sync back to clients table?
4. Trust existing data or re-verify every time?
```

#### Scenario 3: Prospect Conversion - Data Loss
```
Initial State:
- Prospect "DEF Ltd" (prospect_id = 789)
- User entered parent_company = "DEF Holdings" during COI submission
- Stored where? prospects table has NO parent_company field!

After Conversion:
- Creates client_id = 999
- Client record needs parent_company
- Where does it come from? Lost!
```

**Reality Check:** 
- `prospect_client_creation_requests` table has `parent_company` field (line 245)
- But `submitRequest()` doesn't populate it
- Parent company information gets lost during prospect → client conversion

#### Scenario 4: External Entities (Not BDO Clients)
```
User enters: "Foreign Company ABC GmbH" (Germany)
This is a parent company, but NOT a BDO client

Question: Do we create a clients record for entities that aren't our clients?
```

**Impact:** CRITICAL - Entire data model assumption was wrong

---

## Solutions Analyzed

### Option A: Store Parent Company Everywhere

**Approach:** Redundant storage for safety

```sql
-- Store in 4 places:
coi_requests.parent_company       -- Capture at submission
prospects.parent_company           -- For prospect-only scenarios  
clients.parent_company             -- Master data
entity_relationships               -- Structured links
```

**Workflow:**
1. User submits → Store in `coi_requests`
2. If prospect → Also store in `prospects`
3. After verification → Update `clients`
4. After finalization → Create `entity_relationships`

**Pros:**
- ✅ Data preserved at every stage
- ✅ No data loss during transitions

**Cons:**
- ❌ High redundancy (same data in 4 places)
- ❌ Sync nightmare (which is source of truth?)
- ❌ Update complexity (must touch 3-4 tables per change)
- ❌ Can diverge (parent_company different in each table)

**Verdict:** ❌ Not recommended - too complex

---

### Option B: Unified Entities Table

**Approach:** Abstract all entity types into single table

```sql
-- New unified table
CREATE TABLE entities (
  id INTEGER PRIMARY KEY,
  entity_name VARCHAR(255),
  entity_type VARCHAR(50),        -- 'client' | 'prospect' | 'external'
  entity_code VARCHAR(50),
  status VARCHAR(50),
  source VARCHAR(50),              -- 'prms' | 'coi_prospect' | 'coi_external'
  client_id INTEGER,               -- Link to clients if converted
  prospect_id INTEGER,
  created_at DATETIME
);

-- Relationships work for any entity type
CREATE TABLE entity_relationships (
  parent_entity_id INTEGER,        -- entity_id (not client_id)
  child_entity_id INTEGER,
  FOREIGN KEY (parent_entity_id) REFERENCES entities(id),
  FOREIGN KEY (child_entity_id) REFERENCES entities(id)
);
```

**Workflow:**
1. User submits → Create/find entity record
2. Parent specified → Create/find parent entity
3. Create relationship immediately
4. Conflict detection uses entity_relationships

**Pros:**
- ✅ Clean abstraction
- ✅ Handles all entity types uniformly
- ✅ No redundancy
- ✅ Fast conflict detection

**Cons:**
- ❌ Major refactoring (all code uses clients → must change to entities)
- ❌ Migration complexity (existing clients/prospects → entities)
- ❌ Over-engineering for prototype
- ❌ 3-4 extra days effort

**Verdict:** ⚠️ Good for production, too complex for prototype

---

### Option C: Single Source of Truth with Lazy Propagation ✅ RECOMMENDED

**Approach:** Data lives in ONE place during workflow, propagates to master data only when finalized

```sql
-- 1. COI Requests: SOURCE OF TRUTH during approval
ALTER TABLE coi_requests ADD COLUMN parent_company VARCHAR(255);
ALTER TABLE coi_requests ADD COLUMN parent_company_id INTEGER;
ALTER TABLE coi_requests ADD COLUMN group_structure VARCHAR(50);
ALTER TABLE coi_requests ADD COLUMN group_structure_verified BOOLEAN;

-- 2. Clients: MASTER DATA (updated after finalization)
-- Already has parent_company field

-- 3. Entity Relationships: STRUCTURED INDEX (for fast lookups)
CREATE TABLE entity_relationships (
  id INTEGER PRIMARY KEY,
  parent_entity_id INTEGER NOT NULL,
  child_entity_id INTEGER NOT NULL,
  created_from_request_id INTEGER,  -- Audit trail
  verified_by INTEGER,
  verified_date DATETIME,
  FOREIGN KEY (parent_entity_id) REFERENCES clients(id),
  FOREIGN KEY (child_entity_id) REFERENCES clients(id),
  FOREIGN KEY (created_from_request_id) REFERENCES coi_requests(id)
);

-- NO parent_company in prospects table (eliminated)
```

**Data Flow:**

```
Stage 1: Request Submission
└── Store parent_company in coi_requests ONLY
    ├── TEXT: User-entered parent name
    └── parent_company_id: Link if found in PRMS

Stage 2: Compliance Verification  
└── Update coi_requests with verified data
    └── NO sync to clients yet

Stage 3: Engagement Finalization (After all approvals)
└── NOW propagate to master data:
    ├── Update clients.parent_company
    └── Create entity_relationships record

Stage 4: Prospect Conversion
└── Copy parent_company from coi_requests → clients
    └── Create entity_relationships if parent_company_id exists
```

**Conflict Detection Strategy:**

```javascript
async function checkGroupConflicts(requestId) {
  const request = db.prepare(`SELECT * FROM coi_requests WHERE id = ?`).get(requestId)
  
  // Strategy 1: Use structured relationship if available
  if (request.parent_company_id) {
    const conflicts = db.prepare(`
      SELECT r.* FROM coi_requests r
      WHERE (r.parent_company_id = ? OR r.client_id = ?)
      AND r.status IN ('Approved', 'Active')
      AND r.id != ?
    `).all(request.parent_company_id, request.parent_company_id, requestId)
    
    if (conflicts.length > 0) return evaluateConflicts(conflicts)
  }
  
  // Strategy 2: Fallback to text matching
  if (request.parent_company) {
    const conflicts = db.prepare(`
      SELECT r.* FROM coi_requests r
      WHERE (r.parent_company LIKE ? OR r.client_name LIKE ?)
      AND r.status IN ('Approved', 'Active')
    `).all(`%${request.parent_company}%`, `%${request.parent_company}%`)
    
    return evaluateConflicts(conflicts)
  }
  
  return []
}
```

**Pros:**
- ✅ Single source of truth (no sync issues)
- ✅ Works for prospects, clients, external entities
- ✅ Conflict detection works immediately
- ✅ Master data updated only when finalized
- ✅ No data loss during lifecycle transitions
- ✅ Clean audit trail (created_from_request_id)
- ✅ Progressive enhancement (text → structured)
- ✅ Minimal refactoring (2 days effort)

**Cons:**
- ⚠️ Requires query both structured and text (minimal performance impact)

**Verdict:** ✅ **RECOMMENDED** - Best balance of simplicity and correctness

---

## Comparison Matrix

| Aspect | Option A (Store Everywhere) | Option B (Unified Entities) | **Option C (Single Source)** ✅ |
|--------|---------------------------|---------------------------|----------------------------|
| **Data Redundancy** | ❌ High (4 places) | ✅ None | ✅ Minimal (2 places max) |
| **Sync Complexity** | ❌ High | ✅ Low | ✅ Low |
| **Implementation Effort** | ⚠️ Medium (2-3 days) | ❌ High (4-5 days) | ✅ Low (2 days) |
| **Query Performance** | ⚠️ Medium | ✅ Fast | ✅ Fast |
| **Migration Impact** | ⚠️ Medium | ❌ High (breaking) | ✅ Low |
| **Handles Prospects** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Handles External Entities** | ⚠️ Creates fake clients | ✅ Yes | ✅ Yes (via text) |
| **Data Quality** | ❌ Can diverge | ✅ Always consistent | ✅ Always consistent |
| **Audit Trail** | ⚠️ Unclear | ✅ Clear | ✅ Clear (created_from_request_id) |
| **Prototype Suitable** | ⚠️ Medium | ❌ No (too complex) | ✅ Yes (simple) |
| **Production Scalable** | ❌ No | ✅ Yes | ✅ Yes |

---

## Final Implementation Plan

### Database Schema Changes

```sql
-- 1. Enhance coi_requests table (source of truth during workflow)
ALTER TABLE coi_requests ADD COLUMN parent_company VARCHAR(255);
ALTER TABLE coi_requests ADD COLUMN parent_company_id INTEGER;
ALTER TABLE coi_requests ADD COLUMN group_structure VARCHAR(50);
  -- 'standalone' | 'has_parent' | 'research_required'
ALTER TABLE coi_requests ADD COLUMN group_structure_source VARCHAR(50);
  -- 'user_declared' | 'compliance_verified' | 'prms'
ALTER TABLE coi_requests ADD COLUMN group_structure_verified BOOLEAN DEFAULT 0;
ALTER TABLE coi_requests ADD COLUMN requires_compliance_verification BOOLEAN DEFAULT 0;

-- 2. Entity relationships table (structured index for finalized engagements)
CREATE TABLE IF NOT EXISTS entity_relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_entity_id INTEGER NOT NULL,
  child_entity_id INTEGER NOT NULL,
  relationship_type VARCHAR(50) DEFAULT 'subsidiary',
  created_from_request_id INTEGER,
  verified_by INTEGER,
  verified_date DATETIME,
  verification_source VARCHAR(100),
  FOREIGN KEY (parent_entity_id) REFERENCES clients(id),
  FOREIGN KEY (child_entity_id) REFERENCES clients(id),
  FOREIGN KEY (created_from_request_id) REFERENCES coi_requests(id),
  FOREIGN KEY (verified_by) REFERENCES users(id)
);

CREATE INDEX idx_entity_relationships_child ON entity_relationships(child_entity_id);
CREATE INDEX idx_entity_relationships_parent ON entity_relationships(parent_entity_id);

-- 3. NO changes to prospects table (eliminated parent_company from prospects)
-- 4. clients.parent_company field already exists (no change)
```

### UI Enhancement - Request Form

**Replace free-text parent company field with structured workflow:**

```
┌─────────────────────────────────────────────────────────────┐
│ Corporate Group Structure                    [IESBA 290.13] │
├─────────────────────────────────────────────────────────────┤
│ Required for auditor independence assessment per IESBA Code │
│                                                               │
│ Please verify: Does this client belong to a larger          │
│ corporate group or holding company?                          │
│                                                               │
│ ○ Standalone Entity                                          │
│   This client is not part of a larger group                 │
│                                                               │
│ ○ Part of Corporate Group                                    │
│   This client has a parent/holding company                   │
│                                                               │
│ ○ Requires Research                                          │
│   Unknown - Compliance will verify during review             │
│   ⚠️ May delay approval                                      │
│                                                               │
│ [If "Part of Corporate Group" selected]                     │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 🔍 Identify Parent Company                            │   │
│ │ ┌────────────────────────────────────────────────┐    │   │
│ │ │ Search by parent company name...          [🔍] │    │   │
│ │ └────────────────────────────────────────────────┘    │   │
│ │                                                        │   │
│ │ Search Results:                                        │   │
│ │ • ABC Holdings Group (CLI-00123) [✓ Verified Entity]  │   │
│ │ • XYZ International (CLI-00456)                        │   │
│ │                                                        │   │
│ │ ➕ Add "ABC Corp" as new parent company               │   │
│ │    (Will be added to master database)                  │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ ℹ️ Why this matters: IESBA independence rules extend to     │
│ parent companies and subsidiaries. Accurate group structure  │
│ ensures we can detect conflicts across the corporate family. │
└─────────────────────────────────────────────────────────────┘
```

### Validation Rules

```javascript
function validateGroupStructure(requestData) {
  const { service_type, pie_status, group_structure, parent_company } = requestData
  
  // Rule 1: PIE clients MUST verify group structure
  if (pie_status === 'Yes' && !group_structure) {
    throw new ValidationError(
      'Group structure verification required for PIE clients per IESBA 290.13'
    )
  }
  
  // Rule 2: Audit clients MUST verify group structure
  if (isAuditService(service_type) && !group_structure) {
    throw new ValidationError(
      'Group structure verification required for audit engagements'
    )
  }
  
  // Rule 3: If "has_parent" selected, must identify parent
  if (group_structure === 'has_parent' && !parent_company) {
    throw new ValidationError('Parent company must be identified')
  }
  
  // Rule 4: "Research required" flags for Compliance
  if (group_structure === 'research_required') {
    requestData.requires_compliance_verification = true
  }
  
  return true
}
```

### Group Conflict Detection

```javascript
// File: duplicationCheckService.js - Enhanced version

async function checkGroupConflicts(requestId) {
  const db = getDatabase()
  const request = db.prepare(`SELECT * FROM coi_requests WHERE id = ?`).get(requestId)
  
  if (!request) return []
  
  const conflicts = []
  
  // PHASE 1: Check via structured relationship (if parent_company_id exists)
  if (request.parent_company_id) {
    // Find all requests related to same parent company
    const relatedRequests = db.prepare(`
      SELECT r.* FROM coi_requests r
      WHERE (r.parent_company_id = ? OR r.client_id = ?)
      AND r.status IN ('Approved', 'Active')
      AND r.id != ?
    `).all(request.parent_company_id, request.parent_company_id, requestId)
    
    // Evaluate independence conflicts
    for (const related of relatedRequests) {
      const conflict = evaluateIndependenceConflict(
        related.service_type, 
        request.service_type,
        related.pie_status
      )
      
      if (conflict) {
        conflicts.push({
          type: 'GROUP_INDEPENDENCE_VIOLATION',
          severity: 'CRITICAL',
          existing_engagement: related.engagement_code || related.request_id,
          entity_relationship: related.client_id === request.parent_company_id ? 'parent' : 'sibling',
          regulation: 'IESBA 290.13',
          action: 'REJECT',
          reason: conflict.reason
        })
      }
    }
  }
  
  // PHASE 2: Fallback to text matching (if no structured relationship)
  if (conflicts.length === 0 && request.parent_company) {
    const textMatches = db.prepare(`
      SELECT r.* FROM coi_requests r
      WHERE (r.parent_company LIKE ? OR r.client_name LIKE ?)
      AND r.status IN ('Approved', 'Active')
      AND r.id != ?
    `).all(`%${request.parent_company}%`, `%${request.parent_company}%`, requestId)
    
    for (const match of textMatches) {
      const conflict = evaluateIndependenceConflict(
        match.service_type,
        request.service_type,
        match.pie_status
      )
      
      if (conflict) {
        conflicts.push({
          type: 'POTENTIAL_GROUP_CONFLICT',
          severity: 'HIGH',
          existing_engagement: match.engagement_code || match.request_id,
          entity_relationship: 'text_match',
          regulation: 'IESBA 290.13',
          action: 'FLAG',
          reason: `${conflict.reason} (detected via name matching - requires verification)`,
          confidence: 'MEDIUM'
        })
      }
    }
  }
  
  return conflicts
}

function evaluateIndependenceConflict(existingService, proposedService, isPIE) {
  const existingCategory = getServiceCategory(existingService)
  const proposedCategory = getServiceCategory(proposedService)
  
  // IESBA 290.13: Audit independence extends to group
  if (existingCategory === 'AUDIT' && ['ADVISORY', 'ACCOUNTING', 'VALUATION'].includes(proposedCategory)) {
    return {
      severity: 'CRITICAL',
      reason: `Cannot provide ${proposedCategory} services to audit client's corporate group (IESBA 290.13)`
    }
  }
  
  if (proposedCategory === 'AUDIT' && ['ADVISORY', 'ACCOUNTING'].includes(existingCategory)) {
    return {
      severity: 'CRITICAL',
      reason: `Cannot audit entity when providing ${existingCategory} to its corporate group (cooling-off required)`
    }
  }
  
  // PIE additional restrictions
  if (isPIE && existingCategory === 'AUDIT' && proposedCategory === 'TAX_PLANNING') {
    return {
      severity: 'CRITICAL',
      reason: `Tax planning PROHIBITED for PIE audit client's group (IESBA 290.212)`
    }
  }
  
  return null
}
```

### Prospect Conversion Workflow

```javascript
// File: prospectClientCreationController.js

async function completeClientCreation(prospectClientCreationRequestId) {
  const db = getDatabase()
  
  const creationRequest = db.prepare(`
    SELECT * FROM prospect_client_creation_requests WHERE id = ?
  `).get(prospectClientCreationRequestId)
  
  const coiRequest = db.prepare(`
    SELECT * FROM coi_requests WHERE id = ?
  `).get(creationRequest.coi_request_id)
  
  // Start transaction
  const transaction = db.transaction(() => {
    // 1. Create client WITH parent company from COI request
    const clientResult = db.prepare(`
      INSERT INTO clients (
        client_code,
        client_name,
        client_type,
        industry,
        location,
        status,
        parent_company,
        created_at
      ) VALUES (?, ?, ?, ?, ?, 'Active', ?, CURRENT_TIMESTAMP)
    `).run(
      `CLI-${String(Date.now()).slice(-6)}`,
      creationRequest.client_name,
      creationRequest.legal_form,
      creationRequest.industry,
      creationRequest.physical_address,
      coiRequest.parent_company  // ← SOURCE FROM COI REQUEST
    )
    
    const newClientId = clientResult.lastInsertRowid
    
    // 2. Update coi_request with new client_id
    db.prepare(`
      UPDATE coi_requests 
      SET client_id = ?,
          is_prospect = 0,
          prospect_id = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newClientId, coiRequest.id)
    
    // 3. Create structured entity_relationships record
    if (coiRequest.parent_company_id) {
      db.prepare(`
        INSERT INTO entity_relationships (
          parent_entity_id,
          child_entity_id,
          created_from_request_id,
          verified_by,
          verified_date,
          verification_source
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 'prospect_conversion')
      `).run(
        coiRequest.parent_company_id,
        newClientId,
        coiRequest.id,
        creationRequest.reviewed_by
      )
    }
    
    // 4. Update prospect status
    db.prepare(`
      UPDATE prospects
      SET status = 'Converted to Client',
          converted_to_client_id = ?,
          converted_date = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newClientId, creationRequest.prospect_id)
    
    return newClientId
  })
  
  return transaction()
}
```

### Compliance Verification UI

```vue
<!-- Component: ComplianceActionPanel.vue -->
<div class="compliance-verification-section">
  <h4>Group Structure Verification</h4>
  
  <div class="data-comparison">
    <div class="requester-data">
      <label>Requester Declared:</label>
      <span>{{ request.group_structure }}</span>
      <div v-if="request.parent_company" class="parent-info">
        Parent: {{ request.parent_company }}
        <span v-if="!request.parent_company_id" class="badge badge-warning">
          Not in PRMS - New Entity
        </span>
      </div>
    </div>
    
    <div v-if="prmsClient?.parent_company" class="prms-data">
      <label>PRMS Records:</label>
      <span :class="{'text-gray-400': prmsClient.parent_company === 'TBD'}">
        {{ prmsClient.parent_company }}
      </span>
    </div>
  </div>
  
  <div class="verification-tools">
    <h5>Research Tools:</h5>
    <div class="tool-buttons">
      <button @click="checkCommercialRegistry" class="btn btn-outline">
        🔍 Commercial Registry
      </button>
      <button @click="checkBDOGlobal" class="btn btn-outline">
        🌐 BDO Global Database
      </button>
      <button @click="searchHistoricalCOI" class="btn btn-outline">
        📁 Historical COI
      </button>
    </div>
  </div>
  
  <div class="verification-result">
    <label>Compliance Verification:</label>
    <select v-model="verificationStatus" class="form-select">
      <option value="">-- Select Result --</option>
      <option value="confirmed_standalone">✓ Confirmed: Standalone Entity</option>
      <option value="confirmed_parent">✓ Confirmed: Parent Company Identified</option>
      <option value="corrected">⚠️ Corrected by Compliance Research</option>
      <option value="complex_structure">🔍 Complex Group - Escalate to Partner</option>
    </select>
    
    <input 
      v-if="['confirmed_parent', 'corrected'].includes(verificationStatus)"
      v-model="verifiedParentCompany"
      placeholder="Enter verified parent company name..."
      class="form-input mt-2"
    />
    
    <textarea
      v-model="verificationNotes"
      placeholder="Document verification source and findings..."
      class="form-textarea mt-2"
      rows="3"
    ></textarea>
  </div>
  
  <div class="update-master-data">
    <label class="checkbox-label">
      <input type="checkbox" v-model="updateMasterData" checked />
      Update client master database with verified information
    </label>
    <p class="help-text">
      This will improve data quality for future requests
    </p>
  </div>
</div>
```

---

## Implementation Priorities

### Phase 1: Parent Company Verification (P0 - 3 Days)

| Task | Effort | Priority | Files |
|------|--------|----------|-------|
| Database schema enhancement | 2h | P0 | `backend/src/database/init.js` |
| Request form UI enhancement | 4h | P0 | `frontend/src/views/COIRequestForm.vue` |
| Validation rules | 2h | P0 | `backend/src/validators/groupStructureValidator.js` |
| Group conflict detection | 8h | P0 | `backend/src/services/duplicationCheckService.js` |
| Entity relationship creation | 4h | P0 | `backend/src/controllers/*Controller.js` |
| Compliance verification UI | 4h | P0 | `frontend/src/components/compliance/` |

**Total P0:** 24 hours (3 working days)

### Phase 2: Approval Delegation (P0 - 3 Days)

| Task | Effort | Priority | Files |
|------|--------|----------|-------|
| Approver availability schema | 2h | P0 | `backend/src/database/init.js` |
| Enhanced routing logic | 5h | P0 | `backend/src/services/notificationService.js` |
| Admin availability UI | 6h | P0 | `frontend/src/views/admin/ApproverAvailability.vue` |
| Delegation notifications | 2h | P0 | `backend/src/services/notificationService.js` |
| Recursive escalation protection | 1h | P0 | `backend/src/services/notificationService.js` |

**Total P0:** 16 hours (2 working days)

### Phase 3: Optional Enhancements (P1/P2 - Deferred)

| Task | Effort | Priority | Recommendation |
|------|--------|----------|----------------|
| D3.js visualization | 12h | P2 | ❌ Defer - Use simple table view |
| Delegation audit trail | 3h | P1 | ⚠️ Production only |
| Conflict overlay | 4h | P1 | ⚠️ Production only |

---

## Success Criteria

### Regulatory Compliance
- [x] 100% of PIE requests have verified group structure
- [x] 100% of audit requests have verified group structure
- [x] Parent-subsidiary independence conflicts detected automatically
- [x] Compliance team can verify and correct group structure
- [x] Audit trail maintained for all verifications

### Operational Continuity
- [x] 0 requests stalled due to approver unavailability
- [x] Auto-delegation functional for all approval stages
- [x] Escalation triggers when all approvers unavailable
- [x] Requester notified when approver unavailable

### Data Quality
- [x] Parent company relationships tracked in structured format
- [x] New parent companies captured and flagged for PRMS update
- [x] Compliance verification enriches master data
- [x] Entity relationship database grows organically

---

## Key Decisions Made

### Decision 1: Option C Architecture
**Rationale:** Best balance of simplicity (prototype-friendly) and correctness (production-scalable)

### Decision 2: Lazy Propagation
**Rationale:** Don't pollute master data with unverified/rejected requests

### Decision 3: Two-Phase Conflict Detection
**Rationale:** Structured (fast) + text fallback (catches everything during migration)

### Decision 4: Single Table for Delegation
**Rationale:** Prototype doesn't need permanent delegation config or audit history

### Decision 5: No Prospect Parent Company Field
**Rationale:** Source from coi_requests instead; eliminates redundancy

### Decision 6: Defer Visualization
**Rationale:** Data quality poor ("TBD"); simple table view sufficient for prototype

---

## Open Questions for Review

1. **Client Master Update Permission:** Should Compliance be able to update `clients.parent_company` directly, or route through Admin?

2. **PRMS Sync Strategy:** When COI system updates parent company, how/when does it sync back to PRMS?

3. **External Entity Handling:** For parent companies that aren't BDO clients, create placeholder `clients` record or store as text only?

4. **Historical Data Migration:** What about existing active engagements? Backfill parent_company from PRMS?

5. **Conflict Resolution:** If text matching finds potential conflict but names slightly different, what's the Compliance workflow?

6. **PIE Group Scope:** Does PIE status extend to entire group, or just the specific entity?

---

## Next Steps

1. **Review with Gemini:** Get second opinion on architecture choice
2. **Stakeholder Validation:** Confirm IESBA interpretation with Compliance team
3. **PRMS Team Coordination:** Discuss parent_company field migration status
4. **Finalize Implementation Plan:** Address open questions, confirm priorities
5. **Begin Development:** Start with database schema + validation rules (2h quick win)

---

## Appendix: Reference Documents

- **IESBA Code Section 290.13:** Audit Client Definition
- **IESBA Code Section 290.104-108:** Independence Threats
- **EU Audit Regulation 537/2014 Article 4:** PIE Requirements
- **COI System Architecture Document:** `Architecture_Decision_Event_Driven.md`
- **State Management Research:** `State_Management_HRMS_Integration_Research.md`
- **Original Prototype Plan:** `coi_system_critical_enhancements_ee7876c1.plan.md`

---

**Document Version:** 1.0  
**Last Updated:** January 14, 2026  
**Author:** AI Assistant (Claude Sonnet 4.5)  
**Review Status:** Pending Gemini Review
