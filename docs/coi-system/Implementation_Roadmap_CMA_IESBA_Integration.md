# Implementation Roadmap: CMA Rules, PIE Distinctions, and Condition Validation

## Executive Summary

This roadmap prioritizes implementation of CMA Matrix rules, PIE-specific distinctions, and condition validation based on gap analysis of IESBA Handbook 2025 and CMA Matrix requirements.

**Timeline**: 3 phases over 6-8 weeks  
**Priority**: Critical for Kuwait compliance (CMA) and IESBA alignment

---

## Phase 0: Preparation (Days 1-3)

### 0.1: Pre-Implementation Setup

**Priority**: CRITICAL (Foundation)

#### Tasks:
1. Stakeholder sign-off on roadmap
2. Create feature branch for CMA integration (`feature/cma-iesba-integration`)
3. Set up test environment with CMA-regulated client data
4. Document rollback plan in case of issues
5. Create implementation tickets from roadmap

#### Deliverables:
- ✅ Approved roadmap document
- ✅ Feature branch created
- ✅ Test data seeded (CMA-regulated clients)
- ✅ Rollback procedure documented
- ✅ JIRA/GitHub tickets created

---

## Phase 1: Critical (Weeks 1-2)

### 1.1: Implement CMA Conflict Matrix

**Priority**: CRITICAL (Kuwait compliance requirement)

#### Tasks:
1. Create CMA service types table and seed data
2. Create CMA combination rules table with all 36 rules
3. Implement `cmaConflictMatrix.js` service
4. Integrate CMA rules into conflict detection (check before IESBA)
5. Add CMA regulation source to conflict results

#### Files to Create:
- `coi-prototype/backend/src/services/cmaConflictMatrix.js`
- `coi-prototype/backend/src/database/seeds/cma_service_types_seed.sql`
- `coi-prototype/backend/src/database/seeds/cma_rules_seed.sql`

#### Files to Modify:
- `coi-prototype/backend/src/services/duplicationCheckService.js` - Add CMA check
- `coi-prototype/backend/src/database/init.js` - Add CMA tables
- `coi-prototype/frontend/src/views/ComplianceDashboard.vue` - Display CMA conflicts

#### Database Changes:
```sql
-- CMA Service Types
CREATE TABLE cma_service_types (
  id INTEGER PRIMARY KEY,
  service_code VARCHAR(50) UNIQUE NOT NULL,
  service_name_en TEXT NOT NULL,
  service_name_ar TEXT,
  legal_reference TEXT,
  module_reference TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CMA Combination Rules
CREATE TABLE cma_combination_rules (
  id INTEGER PRIMARY KEY,
  service_a_code VARCHAR(50) NOT NULL,
  service_b_code VARCHAR(50) NOT NULL,
  allowed BOOLEAN NOT NULL,
  condition_code VARCHAR(50),
  severity_level VARCHAR(20) DEFAULT 'BLOCKED',
  legal_reference TEXT,
  reason_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(service_a_code, service_b_code),
  FOREIGN KEY (service_a_code) REFERENCES cma_service_types(service_code),
  FOREIGN KEY (service_b_code) REFERENCES cma_service_types(service_code)
);

-- Condition Codes
CREATE TABLE cma_condition_codes (
  code VARCHAR(50) PRIMARY KEY,
  description TEXT,
  requires_manual_review BOOLEAN DEFAULT 1
);

-- Client CMA Regulation Flag
ALTER TABLE clients ADD COLUMN is_cma_regulated BOOLEAN DEFAULT 0;
-- OR use existing: WHERE regulated_body LIKE '%CMA%'
```

#### Success Criteria:
- ✅ All 36 CMA rules seeded and queryable
- ✅ CMA conflicts detected for CMA-regulated clients
- ✅ CMA conflicts displayed with regulation source
- ✅ CMA rules checked before IESBA rules

#### Testing Milestones (End of Week 2):
- ✅ Unit tests: 36 CMA rule combinations pass
- ✅ Integration test: CMA client conflict detection works
- ✅ Regression test: Existing IESBA rules not broken
- ✅ Bidirectional check: Audit + Tax = Tax + Audit

---

### 1.2: Add PIE Distinction to Accounting Rules

**Priority**: HIGH (Fixes over-restrictive blocking)

#### Tasks:
1. Update `checkServiceTypeConflict()` to distinguish PIE vs Non-PIE for Accounting
2. Add routine/mechanical check for non-PIE Accounting services
3. Update conflict reasons to reference IESBA R601.5 vs R601.6
4. Add safeguards requirement for non-PIE routine Accounting

#### Files to Modify:
- `coi-prototype/backend/src/services/duplicationCheckService.js` - Update ACCOUNTING conflict logic

#### Code Changes:
```javascript
// Replace ACCOUNTING block with:
if (existingCategory === 'ACCOUNTING' && newCategory === 'AUDIT') {
  if (isPIE) {
    // R601.6: PIE - PROHIBITED
    return {
      type: 'PIE_ACCOUNTING_PROHIBITION',
      severity: 'CRITICAL',
      reason: 'PIE: Accounting services prohibited per IESBA R601.6',
      regulation: 'IESBA Code Section 601.6',
      canOverride: false
    }
  } else {
    // R601.5: Non-PIE - Check if routine/mechanical
    const isRoutine = checkIfRoutineMechanical(existingServiceType, requestData)
    if (!isRoutine) {
      return {
        type: 'ACCOUNTING_CONFLICT',
        severity: 'CRITICAL',
        reason: 'Non-routine accounting services create self-review threat per IESBA R601.5',
        regulation: 'IESBA Code Section 601.5',
        canOverride: false
      }
    }
    // Routine - requires safeguards
    return {
      type: 'ACCOUNTING_REQUIRES_SAFEGUARDS',
      severity: 'HIGH',
      reason: 'Routine accounting services require safeguards per IESBA R601.5',
      regulation: 'IESBA Code Section 601.5',
      canOverride: true
    }
  }
}
```

#### Success Criteria:
- ✅ Non-PIE routine Accounting + Audit allowed with safeguards
- ✅ PIE Accounting + Audit blocked with correct IESBA reference
- ✅ Routine/mechanical check implemented

---

### 1.3: Add PIE Distinction and Materiality to Valuation Rules

**Priority**: HIGH (Fixes over-restrictive blocking)

#### Tasks:
1. Update Valuation conflict logic to check PIE status
2. Add materiality evaluation for Valuation services
3. Add subjectivity check for Valuation services
4. Update conflict reasons to reference IESBA R603.4 vs R603.5

#### Files to Create:
- `coi-prototype/backend/src/services/materialityService.js`
- `coi-prototype/backend/src/services/subjectivityService.js`

#### Files to Modify:
- `coi-prototype/backend/src/services/duplicationCheckService.js` - Update VALUATION conflict logic

#### Code Changes:
```javascript
// Replace VALUATION block with:
if (existingCategory === 'VALUATION' && newCategory === 'AUDIT') {
  if (isPIE) {
    // R603.5: PIE - Check if creates self-review threat
    const createsSelfReview = checkSelfReviewThreat(existingServiceType, requestData)
    if (createsSelfReview) {
      return {
        type: 'PIE_VALUATION_PROHIBITION',
        severity: 'CRITICAL',
        reason: 'PIE: Valuation creates self-review threat per IESBA R603.5',
        regulation: 'IESBA Code Section 603.5',
        canOverride: false
      }
    }
  } else {
    // R603.4: Non-PIE - Check materiality and subjectivity
    const materiality = evaluateMateriality(existingServiceType, requestData, clientData)
    const subjectivity = evaluateSubjectivity(existingServiceType, requestData)
    
    if (materiality.isMaterial && subjectivity.isSubjective) {
      return {
        type: 'VALUATION_CONFLICT',
        severity: 'CRITICAL',
        reason: 'Material and subjective valuation creates self-review threat per IESBA R603.4',
        regulation: 'IESBA Code Section 603.4',
        canOverride: false
      }
    }
    // Not material or not subjective - requires safeguards
    return {
      type: 'VALUATION_REQUIRES_SAFEGUARDS',
      severity: 'HIGH',
      reason: 'Valuation requires safeguards per IESBA R603.4',
      regulation: 'IESBA Code Section 603.4',
      canOverride: true
    }
  }
}
```

#### Success Criteria:
- ✅ Non-PIE non-material valuations allowed with safeguards
- ✅ PIE valuations checked for self-review threat
- ✅ Materiality and subjectivity checks implemented

---

## Phase 2: High Priority (Weeks 3-4)

### 2.1: Implement Independent Teams Condition Validation

**Priority**: HIGH (CMA compliance requirement)

#### Tasks:
1. Create independent team assignments table
2. Implement team assignment validation logic
3. Add UI form for team assignment
4. Add verification workflow

#### Files to Create:
- `coi-prototype/backend/src/services/conditionValidationService.js`
- `coi-prototype/frontend/src/components/IndependentTeamsAssignment.vue`

#### Files to Modify:
- `coi-prototype/backend/src/services/cmaConflictMatrix.js` - Check independent teams condition
- `coi-prototype/frontend/src/views/ComplianceDashboard.vue` - Display condition requirements

#### Database Changes:
```sql
CREATE TABLE independent_team_assignments (
  id INTEGER PRIMARY KEY,
  request_id INTEGER NOT NULL,
  service_a VARCHAR(255) NOT NULL,
  service_b VARCHAR(255) NOT NULL,
  team_a_lead VARCHAR(255),
  team_b_lead VARCHAR(255),
  team_a_members TEXT,
  team_b_members TEXT,
  verified_by VARCHAR(255),
  verified_at DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES coi_requests(id)
);

ALTER TABLE coi_requests ADD COLUMN independent_teams_verified BOOLEAN DEFAULT 0;
```

#### Success Criteria:
- ✅ Independent teams condition validated for CMA YES combinations
- ✅ UI workflow for team assignment
- ✅ Verification required before approval

---

### 2.2: Implement Fee Cap (70% Rule) for PIE Clients

**Priority**: HIGH (EU/local compliance)

#### Tasks:
1. Add fee tracking to engagements
2. Implement fee calculation logic (3-year average)
3. Add fee cap validation
4. Add UI display of fee ratios

#### Files to Create:
- `coi-prototype/backend/src/services/feeCapService.js`
- `coi-prototype/frontend/src/components/FeeCapDisplay.vue`

#### Files to Modify:
- `coi-prototype/backend/src/services/duplicationCheckService.js` - Add fee cap check
- `coi-prototype/backend/src/controllers/coiController.js` - Store service fees
- `coi-prototype/frontend/src/views/ComplianceDashboard.vue` - Display fee ratios

#### Database Changes:
```sql
ALTER TABLE coi_requests ADD COLUMN service_fee DECIMAL(15,2);
ALTER TABLE coi_requests ADD COLUMN is_audit_service BOOLEAN DEFAULT 0;

CREATE TABLE fee_history (
  id INTEGER PRIMARY KEY,
  client_id INTEGER NOT NULL,
  engagement_id INTEGER,
  service_type VARCHAR(255),
  is_audit_service BOOLEAN DEFAULT 0,
  fee_amount DECIMAL(15,2) NOT NULL,
  fee_year INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (engagement_id) REFERENCES coi_requests(id)
);
```

#### Success Criteria:
- ✅ Fee cap calculated for PIE clients
- ✅ Violations blocked before approval
- ✅ Fee ratios displayed in UI

#### Testing Milestones (End of Week 4):
- ✅ Independent teams workflow end-to-end
- ✅ Fee cap calculations verified against test data
- ✅ Governance communication workflow complete

---

### 2.3: Implement Governance Communication Requirement

**Priority**: MEDIUM (IESBA compliance)

#### Tasks:
1. Create governance communications table
2. Implement communication workflow
3. Add UI form for governance communication
4. Block approval until concurrence obtained

#### Files to Create:
- `coi-prototype/backend/src/services/governanceCommunicationService.js`
- `coi-prototype/frontend/src/components/GovernanceCommunication.vue`

#### Files to Modify:
- `coi-prototype/backend/src/services/duplicationCheckService.js` - Check governance requirement
- `coi-prototype/frontend/src/views/ComplianceDashboard.vue` - Display governance status

#### Database Changes:
```sql
CREATE TABLE governance_communications (
  id INTEGER PRIMARY KEY,
  request_id INTEGER NOT NULL,
  communication_type VARCHAR(50),
  service_type VARCHAR(255),
  governance_entity VARCHAR(255),
  communication_date DATETIME,
  concurrence_obtained BOOLEAN DEFAULT 0,
  concurrence_date DATETIME,
  governance_contact VARCHAR(255),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES coi_requests(id)
);

ALTER TABLE coi_requests ADD COLUMN governance_concurrence_status VARCHAR(50);
```

#### Success Criteria:
- ✅ Governance communication required for PIE non-assurance services
- ✅ Concurrence tracked and verified
- ✅ Approval blocked until concurrence obtained

---

## Phase 3: Enhancement (Weeks 5-6)

### 3.1: Implement Safeguards Documentation and Validation

**Priority**: MEDIUM (IESBA compliance)

#### Tasks:
1. Create safeguards applied table
2. Implement safeguard validation logic
3. Add UI form for safeguard documentation
4. Add verification workflow

#### Files to Create:
- `coi-prototype/backend/src/services/safeguardValidationService.js`
- `coi-prototype/frontend/src/components/SafeguardsDocumentation.vue`

#### Database Changes:
```sql
CREATE TABLE safeguards_applied (
  id INTEGER PRIMARY KEY,
  request_id INTEGER NOT NULL,
  service_type VARCHAR(255) NOT NULL,
  safeguard_type VARCHAR(50) NOT NULL,
  safeguard_description TEXT,
  applied_by VARCHAR(255),
  applied_at DATETIME,
  verified_by VARCHAR(255),
  verified_at DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES coi_requests(id)
);

ALTER TABLE coi_requests ADD COLUMN safeguards_verified BOOLEAN DEFAULT 0;
```

#### Success Criteria:
- ✅ Required safeguards documented
- ✅ Safeguards validated before approval
- ✅ Audit trail of safeguards applied

---

### 3.2: Add Missing IESBA Subsections

**Priority**: LOW (Completeness)

#### Tasks:
1. Implement Section 607 (Litigation Support)
2. Implement Section 608 (Legal Services)
3. Implement Section 609 (Recruiting Services)
4. Implement Section 610 (Corporate Finance Services)

#### Files to Modify:
- `coi-prototype/backend/src/services/duplicationCheckService.js` - Add conflict rules

#### Success Criteria:
- ✅ All IESBA Section 600 subsections implemented
- ✅ Conflicts detected for all service types

---

### 3.3: Enhance Condition Code System

**Priority**: LOW (Usability)

#### Tasks:
1. Standardize condition codes across IESBA and CMA
2. Add condition code descriptions
3. Add UI tooltips for conditions
4. Create condition validation workflow

#### Success Criteria:
- ✅ Consistent condition codes
- ✅ Clear UI display of conditions
- ✅ Validation workflow complete

---

## Implementation Checklist

### Phase 1: Critical ✅
- [ ] Create CMA service types table and seed data
- [ ] Create CMA combination rules table (36 rules)
- [ ] Implement `cmaConflictMatrix.js`
- [ ] Integrate CMA rules into conflict detection
- [ ] Add PIE distinction to Accounting rules
- [ ] Add PIE distinction and materiality to Valuation rules
- [ ] Add CMA service types to service catalog

### Phase 2: High Priority
- [ ] Implement Independent Teams validation
- [ ] Implement Fee Cap (70% rule)
- [ ] Implement Governance Communication requirement
- [ ] Add UI workflows for conditions

### Phase 3: Enhancement
- [ ] Implement Safeguards documentation
- [ ] Add missing IESBA subsections (607-610)
- [ ] Enhance condition code system
- [ ] Add comprehensive testing

---

## Testing Strategy

### Unit Tests
- Test all 36 CMA rule combinations
- Test PIE vs Non-PIE distinctions
- Test materiality calculations
- Test condition validation

### Integration Tests
- Test CMA + IESBA conflict precedence
- Test condition override workflows
- Test fee cap calculations
- Test governance communication workflow

### End-to-End Tests
- Test CMA-regulated client conflict detection
- Test PIE client with non-assurance service
- Test independent teams assignment workflow
- Test fee cap violation blocking

---

## Risk Mitigation

### Backward Compatibility
- Existing IESBA rules continue to work
- CMA rules are additive (don't break existing functionality)
- Gradual rollout with feature flags

### Data Migration
- No breaking changes to existing data
- New tables are additive
- Existing conflicts remain valid

### Performance
- CMA rules checked first (fast lookup)
- Materiality calculations cached
- Fee calculations optimized (indexed by client_id, year)

---

## Success Metrics

### Compliance
- ✅ 100% of CMA rules implemented
- ✅ All PIE distinctions implemented
- ✅ Condition validation working

### Business Impact
- ✅ Non-PIE clients can proceed with allowed combinations
- ✅ CMA-regulated clients protected by CMA rules
- ✅ Fee cap violations prevented

### User Experience
- ✅ Clear conflict messages with regulation source
- ✅ Condition requirements clearly displayed
- ✅ Workflow guides users through requirements

---

## Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | 2 weeks | CMA rules, PIE distinctions, Materiality |
| Phase 2 | 2 weeks | Independent teams, Fee cap, Governance |
| Phase 3 | 2 weeks | Safeguards, Missing subsections, Enhancements |
| **Total** | **6 weeks** | **Complete CMA/IESBA integration** |

---

## Next Steps

1. **Review and Approve**: Stakeholder review of roadmap
2. **Create Tickets**: Break down into development tickets
3. **Assign Resources**: Allocate developers
4. **Begin Phase 1**: Start with CMA conflict matrix implementation
