# Condition Validation Gaps Analysis

## Overview

This document identifies gaps in condition validation for service combinations that are allowed "with conditions" under both IESBA and CMA rules.

**Date**: January 26, 2026  
**Scope**: Independent teams, safeguards, materiality checks

---

## Gap 1: Independent Teams Condition - Not Validated

### CMA Requirement

**Condition**: "Provided that both of two services should be assigned to two independent teams and lack of any other reasons that might affect the independence"

**Applies to** (10 CMA combinations):
1. External Audit + Internal Control Review
2. External Audit + Internal Audit Performance Review
3. External Audit + AML Assessment
4. External Audit + Capital Adequacy Review
5. Internal Audit + Risk Management
6. Internal Control Review + AML Assessment
7. Internal Control Review + Capital Adequacy Review
8. Internal Audit Performance Review + AML Assessment
9. Internal Audit Performance Review + Capital Adequacy Review
10. AML Assessment + Capital Adequacy Review

### IESBA Requirement

**Similar Concept**: IESBA requires "using professionals who are not audit team members" as a safeguard for many services.

**Examples**:
- Section 601.5 A4: "Using professionals who are not audit team members to perform the service"
- Section 603.3 A3: "Using professionals who are not audit team members to perform the service"
- Section 604.14 A1: "Using professionals who are not audit team members to perform the service"

### Current System Implementation

**Status**: ❌ **NOT VALIDATED** - System allows YES combinations but doesn't verify independent teams are assigned

### Impact

- **Compliance Risk**: CMA-regulated clients may violate independence requirements
- **Audit Trail**: No record of independent team assignments
- **Business Impact**: Cannot enforce CMA condition requirements

### Required Implementation

#### Database Schema

```sql
-- Add independent teams tracking
CREATE TABLE independent_team_assignments (
  id INTEGER PRIMARY KEY,
  request_id INTEGER NOT NULL,
  service_a VARCHAR(255) NOT NULL,
  service_b VARCHAR(255) NOT NULL,
  team_a_lead VARCHAR(255),
  team_b_lead VARCHAR(255),
  team_a_members TEXT, -- JSON array of team member IDs
  team_b_members TEXT, -- JSON array of team member IDs
  verified_by VARCHAR(255), -- Compliance officer who verified
  verified_at DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES coi_requests(id)
);

-- Add condition status to requests
ALTER TABLE coi_requests ADD COLUMN independent_teams_verified BOOLEAN DEFAULT 0;
ALTER TABLE coi_requests ADD COLUMN independent_teams_verified_by INTEGER;
ALTER TABLE coi_requests ADD COLUMN independent_teams_verified_at DATETIME;
```

#### Service Logic

```javascript
// backend/src/services/conditionValidationService.js
export function checkIndependentTeamsRequirement(serviceA, serviceB, requestData) {
  // Check if this combination requires independent teams (CMA)
  const requiresIndependentTeams = checkCMARule(serviceA, serviceB)
  
  if (!requiresIndependentTeams) {
    return null // No requirement
  }
  
  // Check if independent teams are assigned
  const teamAssignment = getIndependentTeamAssignment(requestData.id, serviceA, serviceB)
  
  if (!teamAssignment || !teamAssignment.verified) {
    return {
      type: 'INDEPENDENT_TEAMS_REQUIRED',
      severity: 'HIGH',
      reason: 'CMA: Both services must be assigned to two independent teams per CMA Matrix',
      regulation: 'CMA Law No. 7 of 2010',
      canOverride: false,
      requiredAction: 'Assign independent teams and verify assignment',
      conditionCode: 'INDEPENDENT_TEAMS'
    }
  }
  
  // Verify teams are actually independent
  const teamsAreIndependent = verifyTeamIndependence(
    teamAssignment.team_a_members,
    teamAssignment.team_b_members
  )
  
  if (!teamsAreIndependent) {
    return {
      type: 'INDEPENDENT_TEAMS_NOT_VERIFIED',
      severity: 'CRITICAL',
      reason: 'CMA: Assigned teams are not independent (overlapping members)',
      regulation: 'CMA Law No. 7 of 2010',
      canOverride: false,
      requiredAction: 'Reassign teams to ensure independence'
    }
  }
  
  return null // Condition met
}

function verifyTeamIndependence(teamA, teamB) {
  // 1. Check for overlapping team members
  const teamASet = new Set(teamA.members)
  const teamBSet = new Set(teamB.members)
  
  // No overlap allowed
  for (const member of teamASet) {
    if (teamBSet.has(member)) {
      return false
    }
  }
  
  // 2. Check team leads are different
  if (teamA.lead === teamB.lead) {
    return false
  }
  
  // 3. Different reporting lines (enhancement)
  // Team leads should not report to each other
  if (teamA.lead_reports_to === teamB.lead || 
      teamB.lead_reports_to === teamA.lead) {
    return false // Or flag for manual review
  }
  
  return true
}
```

#### UI Workflow

1. **Condition Alert**: Display when YES combination with INDEPENDENT_TEAMS condition is detected
2. **Team Assignment Form**: Allow Compliance to assign team leads and members
3. **Verification Step**: Require Compliance verification before approval
4. **Status Display**: Show condition status in request detail view

---

## Gap 2: Safeguards - Mentioned but Not Validated

### IESBA Requirement

**Safeguards Required For**:
- Accounting services (non-PIE, routine/mechanical) - R601.5
- Valuation services (non-PIE, not material/subjective) - R603.4
- Tax compliance services (all clients) - Section 604
- Tax calculations (non-PIE, not material) - 604.9
- IT systems services (non-PIE) - 606.5

**Common Safeguards**:
1. Using professionals who are not audit team members
2. Having appropriate reviewer who was not involved in providing the service
3. Obtaining pre-clearance from tax authorities (for tax services)
4. Client makes all management decisions
5. Client determines methodology and approves

### Current System Implementation

**Status**: ⚠️ **PARTIAL** - System flags services requiring safeguards but doesn't validate safeguards are in place

```javascript
// duplicationCheckService.js
flagged: ['TAX', 'TAX_COMPLIANCE', 'TAX_CALCULATIONS', 'DUE_DILIGENCE', 'IT_ADVISORY']
```

**Issue**: System flags but doesn't:
- Require documentation of safeguards
- Validate safeguards are appropriate
- Check if safeguards are actually applied

### Impact

- **Compliance Risk**: Services may proceed without required safeguards
- **Audit Trail**: No record of safeguards applied
- **Business Impact**: Cannot demonstrate compliance with IESBA requirements

### Required Implementation

#### Database Schema

```sql
-- Add safeguards tracking
CREATE TABLE safeguards_applied (
  id INTEGER PRIMARY KEY,
  request_id INTEGER NOT NULL,
  service_type VARCHAR(255) NOT NULL,
  safeguard_type VARCHAR(50) NOT NULL, -- 'INDEPENDENT_TEAM', 'INDEPENDENT_REVIEWER', 'PRE_CLEARANCE', 'CLIENT_DECISIONS', etc.
  safeguard_description TEXT,
  applied_by VARCHAR(255),
  applied_at DATETIME,
  verified_by VARCHAR(255), -- Compliance officer
  verified_at DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES coi_requests(id)
);

-- Add safeguard status
ALTER TABLE coi_requests ADD COLUMN safeguards_verified BOOLEAN DEFAULT 0;
ALTER TABLE coi_requests ADD COLUMN safeguards_verified_by INTEGER;
ALTER TABLE coi_requests ADD COLUMN safeguards_verified_at DATETIME;
```

#### Service Logic

```javascript
// backend/src/services/safeguardValidationService.js
export function getRequiredSafeguards(serviceType, isPIE, requestData) {
  const safeguards = []
  
  // Accounting services (non-PIE, routine)
  if (serviceType.includes('Accounting') && !isPIE) {
    safeguards.push({
      type: 'INDEPENDENT_TEAM',
      description: 'Use professionals who are not audit team members',
      required: true
    })
    safeguards.push({
      type: 'INDEPENDENT_REVIEWER',
      description: 'Have appropriate reviewer who was not involved in providing the service',
      required: true
    })
    safeguards.push({
      type: 'CLIENT_DECISIONS',
      description: 'Client makes all judgments and decisions',
      required: true
    })
  }
  
  // Valuation services (non-PIE, not material)
  if (serviceType.includes('Valuation') && !isPIE) {
    safeguards.push({
      type: 'INDEPENDENT_TEAM',
      description: 'Use professionals who are not audit team members',
      required: true
    })
    safeguards.push({
      type: 'INDEPENDENT_REVIEWER',
      description: 'Have appropriate reviewer who was not involved in providing the service',
      required: true
    })
    safeguards.push({
      type: 'CLIENT_METHODOLOGY',
      description: 'Client determines and approves valuation methodology',
      required: true
    })
  }
  
  // Tax compliance services
  if (serviceType.includes('Tax Compliance')) {
    safeguards.push({
      type: 'INDEPENDENT_TEAM',
      description: 'Tax services performed by personnel not involved in audit',
      required: true
    })
    safeguards.push({
      type: 'INDEPENDENT_REVIEWER',
      description: 'Tax services reviewed by partner not involved in audit',
      required: true
    })
    safeguards.push({
      type: 'CLIENT_RESPONSIBILITY',
      description: 'Client management acknowledges responsibility for tax decisions',
      required: true
    })
    if (isPIE) {
      safeguards.push({
        type: 'FEE_CAP',
        description: 'Non-audit fees must not exceed 70% of audit fees',
        required: true
      })
    }
  }
  
  return safeguards
}

export function validateSafeguards(requestId, requiredSafeguards) {
  const appliedSafeguards = getAppliedSafeguards(requestId)
  
  const missing = requiredSafeguards.filter(req => {
    return !appliedSafeguards.some(app => app.safeguard_type === req.type && app.verified)
  })
  
  if (missing.length > 0) {
    return {
      type: 'SAFEGUARDS_MISSING',
      severity: 'HIGH',
      reason: `Required safeguards not applied: ${missing.map(s => s.type).join(', ')}`,
      regulation: 'IESBA Code Section 600',
      canOverride: false,
      missingSafeguards: missing
    }
  }
  
  return null // All safeguards applied
}
```

#### UI Workflow

1. **Safeguards Checklist**: Display required safeguards when service is flagged
2. **Safeguard Documentation Form**: Allow Compliance to document applied safeguards
3. **Verification Step**: Require Compliance verification of safeguards
4. **Status Display**: Show safeguard status in request detail view

---

## Gap 3: Materiality Check - Not Implemented

### IESBA Requirement

**Materiality Checks Required For**:
- Valuation services (R603.4): Cannot provide if "will have a material effect on the financial statements"
- Tax calculations (604.9): Factor in evaluating self-review threat
- Tax advisory/planning (604.12 A3): "Extent to which outcome might have material effect on FS"
- Litigation support (607.4 A1): "Extent to which outcome might involve estimating damages with material effect on FS"

### Current System Implementation

**Status**: ❌ **NOT IMPLEMENTED** - No materiality evaluation

### Impact

- **Non-PIE Clients**: System blocks non-material services that IESBA allows
- **Business Impact**: May prevent legitimate non-material services
- **Compliance**: Cannot demonstrate materiality assessment

### Required Implementation

#### Materiality Calculation

```javascript
// backend/src/services/materialityService.js
export function evaluateMateriality(serviceType, requestData, clientData) {
  // Get service fee
  const serviceFee = requestData.service_fee || 0
  
  // Get client revenue/assets (from client data or PRMS)
  const clientRevenue = clientData.annual_revenue || 0
  const clientAssets = clientData.total_assets || 0
  
  // Calculate materiality thresholds (standard audit practice: 1-2% of revenue/assets)
  const revenueMateriality = clientRevenue * 0.02 // 2% of revenue
  const assetMateriality = clientAssets * 0.02 // 2% of assets
  
  // For valuation services, check if valuation amount is material
  if (serviceType.includes('Valuation')) {
    const valuationAmount = requestData.valuation_amount || serviceFee
    
    const isMaterial = valuationAmount > revenueMateriality || 
                      valuationAmount > assetMateriality ||
                      (requestData.affects_financial_statements === true)
    
    return {
      isMaterial: isMaterial,
      valuationAmount: valuationAmount,
      revenueMateriality: revenueMateriality,
      assetMateriality: assetMateriality,
      reason: isMaterial ? 
        `Valuation amount (${valuationAmount}) exceeds materiality threshold` :
        `Valuation amount (${valuationAmount}) is below materiality threshold`
    }
  }
  
  // For tax services, check if tax amount is material
  if (serviceType.includes('Tax')) {
    const taxAmount = requestData.tax_amount || serviceFee
    
    const isMaterial = taxAmount > revenueMateriality * 0.1 // 10% of revenue materiality
    
    return {
      isMaterial: isMaterial,
      taxAmount: taxAmount,
      materialityThreshold: revenueMateriality * 0.1,
      reason: isMaterial ?
        `Tax amount (${taxAmount}) exceeds materiality threshold` :
        `Tax amount (${taxAmount}) is below materiality threshold`
    }
  }
  
  // Default: check service fee
  const isMaterial = serviceFee > revenueMateriality * 0.1
  
  return {
    isMaterial: isMaterial,
    serviceFee: serviceFee,
    materialityThreshold: revenueMateriality * 0.1,
    reason: isMaterial ?
      `Service fee (${serviceFee}) exceeds materiality threshold` :
      `Service fee (${serviceFee}) is below materiality threshold`
  }
}
```

#### Integration with Conflict Detection

```javascript
// Updated checkServiceTypeConflict
function checkServiceTypeConflict(existingServiceType, newServiceType, isPIE = false, requestData = null) {
  // ... existing PIE checks ...
  
  // For Valuation services, check materiality
  if (newCategory === 'VALUATION' && !isPIE && requestData) {
    const materiality = evaluateMateriality(newServiceType, requestData, clientData)
    
    if (!materiality.isMaterial) {
      // Non-material valuation - allowed with safeguards
      return {
        type: 'VALUATION_REQUIRES_SAFEGUARDS',
        severity: 'HIGH',
        reason: `Non-material valuation requires safeguards per IESBA R603.4. ${materiality.reason}`,
        regulation: 'IESBA Code Section 603.4',
        canOverride: true,
        materiality: materiality
      }
    }
  }
  
  // ... rest of conflict checks ...
}
```

---

## Gap 4: Subjectivity Check - Not Implemented

### IESBA Requirement

**Subjectivity Checks Required For**:
- Valuation services (R603.4): Cannot provide if "involves significant degree of subjectivity" AND material
- Tax advisory/planning (604.12 A3): "Degree of subjectivity involved in determining appropriate treatment"

### Current System Implementation

**Status**: ❌ **NOT IMPLEMENTED**

### Required Implementation

```javascript
// backend/src/services/subjectivityService.js
export function evaluateSubjectivity(serviceType, requestData) {
  const subjectivityIndicators = [
    'significant judgment',
    'high degree of estimation',
    'forward-looking assumptions',
    'complex methodology',
    'multiple valuation approaches',
    'subjective assumptions',
    'management estimates'
  ]
  
  const serviceDescription = (requestData.service_description || '').toLowerCase()
  const hasSubjectivity = subjectivityIndicators.some(indicator => 
    serviceDescription.includes(indicator)
  )
  
  // Check if methodology is established by law/regulation
  const isEstablishedMethodology = 
    serviceDescription.includes('established by law') ||
    serviceDescription.includes('prescribed by regulation') ||
    serviceDescription.includes('generally accepted standard')
  
  return {
    isSubjective: hasSubjectivity && !isEstablishedMethodology,
    indicators: subjectivityIndicators.filter(i => serviceDescription.includes(i)),
    isEstablishedMethodology: isEstablishedMethodology,
    reason: hasSubjectivity && !isEstablishedMethodology ?
      'Service involves significant degree of subjectivity' :
      'Service uses established methodology or low subjectivity'
  }
}
```

---

## Gap 5: Client Management Decisions - Not Validated

### IESBA Requirement

**Client Must Make Decisions For**:
- Accounting services (R601.5): Client makes judgments/decisions, determines account classifications
- Valuation services (R603.3 A2): Client determines and approves methodology
- Internal Audit services (R605.3): Client reviews, assesses, approves scope, risk, frequency
- IT Systems services (R606.3): Client makes all management decisions
- Recruiting services (R609.3): Client makes all management decisions

### Current System Implementation

**Status**: ❌ **NOT VALIDATED** - No check that client makes required decisions

### Required Implementation

```javascript
// backend/src/services/clientDecisionValidationService.js
export function validateClientDecisions(serviceType, requestData) {
  const requiredDecisions = getRequiredClientDecisions(serviceType)
  
  // Check if client decisions are documented
  const clientDecisions = requestData.client_decisions || {}
  
  const missing = requiredDecisions.filter(req => !clientDecisions[req.key])
  
  if (missing.length > 0) {
    return {
      type: 'CLIENT_DECISIONS_REQUIRED',
      severity: 'HIGH',
      reason: `Client must make management decisions: ${missing.map(d => d.description).join(', ')}`,
      regulation: 'IESBA Code Section 600',
      canOverride: false,
      requiredDecisions: missing
    }
  }
  
  return null
}

function getRequiredClientDecisions(serviceType) {
  if (serviceType.includes('Accounting')) {
    return [
      { key: 'account_classifications', description: 'Determine account classifications' },
      { key: 'accounting_policies', description: 'Determine accounting policies' },
      { key: 'approve_transactions', description: 'Approve transactions' }
    ]
  }
  
  if (serviceType.includes('Valuation')) {
    return [
      { key: 'valuation_methodology', description: 'Determine and approve valuation methodology' },
      { key: 'significant_assumptions', description: 'Approve significant assumptions' }
    ]
  }
  
  // ... other service types ...
  
  return []
}
```

---

## Summary of Condition Validation Gaps

| Condition Type | IESBA Requirement | CMA Requirement | Current System | Priority |
|----------------|-------------------|-----------------|----------------|----------|
| Independent Teams | Required for many services | Required for 10 YES combinations | ❌ Not validated | HIGH |
| Safeguards | Required for flagged services | N/A | ⚠️ Mentioned but not validated | HIGH |
| Materiality | Required for Valuation, Tax | N/A | ❌ Not implemented | MEDIUM |
| Subjectivity | Required for Valuation | N/A | ❌ Not implemented | MEDIUM |
| Client Decisions | Required for Accounting, Valuation, IT, etc. | N/A | ❌ Not validated | MEDIUM |

---

## Implementation Recommendations

### Phase 1: Critical (Immediate)
1. Implement Independent Teams validation for CMA rules
2. Implement Safeguards documentation and validation

### Phase 2: High Priority
3. Implement Materiality check for Valuation services
4. Implement Subjectivity check for Valuation services

### Phase 3: Medium Priority
5. Implement Client Decisions validation
6. Add UI workflows for condition documentation

---

## Database Schema Summary

```sql
-- Independent Teams
CREATE TABLE independent_team_assignments (...);
ALTER TABLE coi_requests ADD COLUMN independent_teams_verified BOOLEAN;

-- Safeguards
CREATE TABLE safeguards_applied (...);
ALTER TABLE coi_requests ADD COLUMN safeguards_verified BOOLEAN;

-- Materiality (stored in request data)
ALTER TABLE coi_requests ADD COLUMN materiality_assessment TEXT; -- JSON
ALTER TABLE coi_requests ADD COLUMN is_material BOOLEAN;

-- Client Decisions
ALTER TABLE coi_requests ADD COLUMN client_decisions TEXT; -- JSON
ALTER TABLE coi_requests ADD COLUMN client_decisions_verified BOOLEAN;
```
