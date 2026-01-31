# PIE-Specific Rule Gaps Analysis

## Overview

This document identifies all PIE (Public Interest Entity) specific rule gaps in the current system implementation, comparing IESBA 2025 Handbook requirements to current code.

**Date**: January 26, 2026  
**Source**: 2025 IESBA Handbook Volume 1, Section 600

---

## Gap 1: Accounting Services - Missing PIE Distinction

### IESBA Requirement

#### R601.5: Non-PIE Clients
- **Status**: ✅ **ALLOWED** with conditions
- **Conditions**: 
  - Services must be routine/mechanical
  - Client makes all judgments/decisions
  - Firm addresses threats with safeguards
- **Examples**: Payroll calculations, recording recurring transactions, calculating depreciation (client determines policy)

#### R601.6: PIE Clients
- **Status**: ❌ **PROHIBITED**
- **Requirement**: "A firm or a network firm shall not provide accounting and bookkeeping services to an audit client that is a public interest entity."

### Current System Implementation

```javascript
// duplicationCheckService.js lines 51-57
ACCOUNTING: {
  blocked: ['AUDIT'],
  reason: {
    AUDIT: 'Cannot audit financial statements we prepared (self-review threat)'
  }
}
```

**Status**: ⚠️ **GAP** - Blocks ALL Accounting + Audit combinations, regardless of PIE status

### Impact

- **Non-PIE Clients**: System incorrectly blocks routine/mechanical accounting services that IESBA allows
- **PIE Clients**: System correctly blocks, but doesn't distinguish why (should reference R601.6)
- **Business Impact**: May prevent legitimate non-PIE engagements

### Required Fix

```javascript
// Updated logic needed:
function checkAccountingConflict(existingService, newService, isPIE) {
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
    // Need to check service description for routine indicators
    const isRoutine = checkIfRoutineMechanical(newService)
    if (!isRoutine) {
      return {
        type: 'ACCOUNTING_CONFLICT',
        severity: 'CRITICAL',
        reason: 'Non-routine accounting services create self-review threat',
        regulation: 'IESBA Code Section 601.5',
        canOverride: false
      }
    }
    // Routine/mechanical - allowed with safeguards
    return {
      type: 'ACCOUNTING_REQUIRES_SAFEGUARDS',
      severity: 'HIGH',
      reason: 'Routine accounting services require safeguards per IESBA R601.5',
      regulation: 'IESBA Code Section 601.5',
      canOverride: true,
      requiredSafeguards: [
        'Use professionals not on audit team',
        'Have independent reviewer',
        'Client makes all judgments/decisions'
      ]
    }
  }
}
```

---

## Gap 2: Valuation Services - Missing Materiality Check

### IESBA Requirement

#### R603.4: Non-PIE Clients
- **Status**: ⚠️ **CONDITIONAL**
- **Requirement**: Cannot provide valuation if:
  - (a) Involves significant degree of subjectivity; AND
  - (b) Will have material effect on financial statements
- **Allowed**: If not subjective OR not material

#### R603.5: PIE Clients
- **Status**: ❌ **PROHIBITED** if creates self-review threat
- **Requirement**: "A firm or a network firm shall not provide a valuation service to an audit client that is a public interest entity if the provision of such valuation service might create a self-review threat."

### Current System Implementation

```javascript
// duplicationCheckService.js lines 59-65
VALUATION: {
  blocked: ['AUDIT'],
  reason: {
    AUDIT: 'Cannot audit valuations we performed (self-review threat)'
  }
}
```

**Status**: ⚠️ **GAP** - Blocks ALL Valuation + Audit, doesn't check:
- PIE vs Non-PIE status
- Materiality to financial statements
- Degree of subjectivity
- Whether valuation affects accounting records/FS

### Impact

- **Non-PIE Clients**: System incorrectly blocks non-material valuations that IESBA allows
- **PIE Clients**: System correctly blocks, but should check if creates self-review threat
- **Business Impact**: May prevent legitimate non-material valuation services

### Required Fix

```javascript
// Updated logic needed:
function checkValuationConflict(existingService, newService, isPIE, requestData) {
  if (isPIE) {
    // R603.5: PIE - Check if creates self-review threat
    const createsSelfReview = checkSelfReviewThreat(newService, requestData)
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
    const isMaterial = checkMateriality(newService, requestData)
    const isSubjective = checkSubjectivity(newService, requestData)
    
    if (isMaterial && isSubjective) {
      return {
        type: 'VALUATION_CONFLICT',
        severity: 'CRITICAL',
        reason: 'Material and subjective valuation creates self-review threat per IESBA R603.4',
        regulation: 'IESBA Code Section 603.4',
        canOverride: false
      }
    }
    // Not material or not subjective - allowed with safeguards
    return {
      type: 'VALUATION_REQUIRES_SAFEGUARDS',
      severity: 'HIGH',
      reason: 'Valuation requires safeguards per IESBA R603.4',
      regulation: 'IESBA Code Section 603.4',
      canOverride: true,
      requiredSafeguards: [
        'Use professionals not on audit team',
        'Have independent reviewer',
        'Client determines methodology and approves'
      ]
    }
  }
}
```

---

## Gap 3: Fee Cap (70% Rule) - Not Implemented

### IESBA Requirement

#### EU Audit Regulation Article 4(2)
- **Requirement**: For PIE audit clients, non-audit fees must not exceed 70% of audit fees (3-year average)
- **Calculation**: Sum of non-audit fees / Sum of audit fees ≤ 0.70
- **Period**: 3-year rolling average
- **Note**: Kuwait may have different thresholds - verify with local regulations

### Current System Implementation

**Status**: ❌ **NOT IMPLEMENTED** - No fee calculation or validation

### Impact

- **Compliance Risk**: PIE clients may violate EU/local regulations
- **Audit Trail**: No record of fee ratios for compliance reporting
- **Business Impact**: Cannot detect fee cap violations before engagement approval

### Required Implementation

```javascript
// New service needed: feeCapService.js
// Configurable thresholds per jurisdiction
const FEE_CAP_THRESHOLDS = {
  EU: 0.70,
  KUWAIT: 0.70, // Verify with local regulations
  DEFAULT: 0.70
}

export function checkFeeCap(clientId, newServiceFee, isPIE, jurisdiction = 'DEFAULT') {
  if (!isPIE) {
    return null // Fee cap only applies to PIE
  }
  
  const threshold = FEE_CAP_THRESHOLDS[jurisdiction] || FEE_CAP_THRESHOLDS.DEFAULT
  
  // Get 3-year audit fees
  const auditFees = getAuditFeesLast3Years(clientId)
  const totalAuditFees = auditFees.reduce((sum, f) => sum + f.amount, 0)
  
  // Get 3-year non-audit fees
  const nonAuditFees = getNonAuditFeesLast3Years(clientId)
  const totalNonAuditFees = nonAuditFees.reduce((sum, f) => sum + f.amount, 0) + newServiceFee
  
  // Calculate ratio
  const ratio = totalNonAuditFees / totalAuditFees
  
  if (ratio > threshold) {
    return {
      type: 'FEE_CAP_VIOLATION',
      severity: 'CRITICAL',
      reason: `PIE Fee Cap Violation: Non-audit fees (${totalNonAuditFees}) exceed ${(threshold * 100)}% of audit fees (${totalAuditFees}). Ratio: ${(ratio * 100).toFixed(1)}%`,
      regulation: 'EU Audit Regulation Article 4(2)',
      canOverride: false,
      currentRatio: ratio,
      maxAllowed: threshold,
      auditFees: totalAuditFees,
      nonAuditFees: totalNonAuditFees
    }
  }
  
  return {
    type: 'FEE_CAP_WARNING',
    severity: 'MEDIUM',
    reason: `PIE Fee Cap: Current ratio ${(ratio * 100).toFixed(1)}% (max ${(threshold * 100)}%)`,
      regulation: 'EU Audit Regulation Article 4(2)',
      canOverride: true,
      currentRatio: ratio,
      maxAllowed: threshold
  }
}
```

### Database Requirements

```sql
-- Add fee tracking to engagements
ALTER TABLE coi_requests ADD COLUMN service_fee DECIMAL(15,2);
ALTER TABLE coi_requests ADD COLUMN is_audit_service BOOLEAN DEFAULT 0;

-- Create fee history table
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

---

## Gap 4: Governance Communication - Not Required

### IESBA Requirement

#### R600.22-R600.25: PIE Governance Communication
- **Requirement**: Before providing non-assurance service to PIE (or related entities), must:
  1. Inform governance that service is not prohibited and won't create threat
  2. Provide information to enable informed assessment
  3. Obtain governance concurrence
  4. Cannot proceed without concurrence

#### R600.22: Entities Covered
- The public interest entity
- Any entity that controls (directly/indirectly) the PIE
- Any entity controlled (directly/indirectly) by the PIE

#### R600.23: Concurrence Required
- Must obtain governance concurrence before providing service
- Can be through agreed process or specific service approval

#### R600.25: Decline if No Concurrence
- Must decline service or end audit engagement if governance disagrees

### Current System Implementation

**Status**: ❌ **NOT IMPLEMENTED** - No governance communication workflow

### Impact

- **Compliance Risk**: PIE clients may not comply with IESBA R600.22-R600.25
- **Audit Trail**: No record of governance communications
- **Business Impact**: Cannot enforce governance approval requirement

### Required Implementation

```javascript
// New service needed: governanceCommunicationService.js
export async function requireGovernanceConcurrence(requestId, serviceType, clientData) {
  if (!clientData.pie_status || clientData.pie_status !== 'Yes') {
    return null // Only required for PIE
  }
  
  // Check if service creates self-review threat
  const createsThreat = checkSelfReviewThreat(serviceType, clientData)
  
  if (createsThreat) {
    return {
      type: 'GOVERNANCE_COMMUNICATION_REQUIRED',
      severity: 'CRITICAL',
      reason: 'PIE: Non-assurance service requires governance communication per IESBA R600.22',
      regulation: 'IESBA Code Section 600.22-600.25',
      canOverride: false,
      requiredActions: [
        'Inform governance that service is not prohibited',
        'Provide information for informed assessment',
        'Obtain governance concurrence',
        'Cannot proceed without concurrence'
      ]
    }
  }
  
  // Still need communication even if no threat
  return {
    type: 'GOVERNANCE_NOTIFICATION_REQUIRED',
    severity: 'HIGH',
    reason: 'PIE: Non-assurance service requires governance notification per IESBA R600.22',
    regulation: 'IESBA Code Section 600.22',
    canOverride: true,
    requiredActions: [
      'Notify governance of proposed service',
      'Provide service details and fee information'
    ]
  }
}
```

### Database Requirements

```sql
-- Add governance communication tracking
CREATE TABLE governance_communications (
  id INTEGER PRIMARY KEY,
  request_id INTEGER NOT NULL,
  communication_type VARCHAR(50), -- 'INFORM', 'CONCURRENCE_REQUIRED', 'CONCURRENCE_OBTAINED'
  service_type VARCHAR(255),
  governance_entity VARCHAR(255), -- PIE or related entity
  communication_date DATETIME,
  concurrence_obtained BOOLEAN DEFAULT 0,
  concurrence_date DATETIME,
  governance_contact VARCHAR(255),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES coi_requests(id)
);

-- Add workflow status
ALTER TABLE coi_requests ADD COLUMN governance_concurrence_status VARCHAR(50);
-- Values: 'NOT_REQUIRED', 'PENDING', 'OBTAINED', 'DECLINED'
```

### UI Requirements

1. **Governance Communication Form**: For PIE clients requesting non-assurance services
2. **Concurrence Tracking**: Display status in request detail view
3. **Workflow Block**: Prevent approval until governance concurrence obtained

---

## Gap 5: Tax Calculations - Missing PIE Prohibition

### IESBA Requirement

#### R604.10: PIE Clients - Tax Calculations
- **Requirement**: "A firm or a network firm shall not prepare tax calculations of current and deferred tax liabilities (or assets) for an audit client that is a public interest entity."
- **Status**: ❌ **PROHIBITED** for PIE

#### 604.9: Non-PIE Clients
- **Status**: ⚠️ **ALLOWED** with safeguards if not material

### Current System Implementation

```javascript
// duplicationCheckService.js line 28
flagged: ['TAX_CALCULATIONS']
```

**Status**: ⚠️ **GAP** - Flags TAX_CALCULATIONS but doesn't distinguish PIE vs Non-PIE

### Impact

- **PIE Clients**: System should BLOCK (not just flag) tax calculations
- **Non-PIE Clients**: System correctly flags, but should check materiality

### Required Fix

```javascript
// Updated in iesbaDecisionMatrix.js or duplicationCheckService.js
if (isPIE && serviceType.includes('tax calculation')) {
  return {
    type: 'PIE_TAX_CALCULATION_PROHIBITION',
    severity: 'CRITICAL',
    reason: 'PIE: Tax calculations prohibited per IESBA R604.10',
    regulation: 'IESBA Code Section 604.10',
    canOverride: false
  }
}
```

---

## Gap 6: IT Systems Services - Missing PIE Check

### IESBA Requirement

#### R606.6: PIE Clients - IT Systems Services
- **Requirement**: Cannot provide IT systems services to PIE if creates self-review threat
- **Prohibited**: Services that form part of or affect accounting records, internal controls over financial reporting, or financial statements

### Current System Implementation

```javascript
// duplicationCheckService.js line 28
flagged: ['IT_ADVISORY']
```

**Status**: ⚠️ **GAP** - Flags IT_ADVISORY but doesn't check PIE status or specific IT services

### Required Fix

```javascript
// Check if IT service affects accounting records/FS
function checkITServiceConflict(serviceType, isPIE, requestData) {
  const affectsAccounting = checkIfAffectsAccountingRecords(serviceType, requestData)
  
  if (isPIE && affectsAccounting) {
    return {
      type: 'PIE_IT_SERVICE_PROHIBITION',
      severity: 'CRITICAL',
      reason: 'PIE: IT service affects accounting records/FS - prohibited per IESBA R606.6',
      regulation: 'IESBA Code Section 606.6',
      canOverride: false
    }
  }
  
  // Non-PIE or doesn't affect accounting - flag for review
  return {
    type: 'IT_SERVICE_REQUIRES_REVIEW',
    severity: 'HIGH',
    reason: 'IT service requires review to ensure no self-review threat',
    regulation: 'IESBA Code Section 606',
    canOverride: true
  }
}
```

---

## Summary of PIE Gaps

| Gap | IESBA Requirement | Current System | Priority | Impact |
|-----|-------------------|----------------|----------|--------|
| Accounting Services | PIE: Prohibited; Non-PIE: Allowed (routine) | Blocks all | HIGH | Blocks legitimate non-PIE services |
| Valuation Services | PIE: Prohibited if self-review; Non-PIE: Allowed if not material/subjective | Blocks all | HIGH | Blocks legitimate non-material valuations |
| Fee Cap (70% rule) | Required for PIE | Not implemented | MEDIUM | Compliance risk |
| Governance Communication | Required before non-assurance to PIE | Not implemented | MEDIUM | Compliance risk |
| Tax Calculations | PIE: Prohibited; Non-PIE: Allowed (not material) | Flags all | MEDIUM | Should block for PIE |
| IT Systems Services | PIE: Prohibited if affects accounting | Flags all | LOW | Should check PIE and accounting impact |

---

## Implementation Priority

### Phase 1: Critical (Immediate)
1. Add PIE distinction to Accounting rules (R601.5 vs R601.6)
2. Add PIE distinction and materiality check to Valuation rules (R603.4 vs R603.5)

### Phase 2: High Priority
3. Implement Fee Cap validation (70% rule)
4. Implement Governance Communication requirement

### Phase 3: Medium Priority
5. Add PIE prohibition for Tax Calculations (R604.10)
6. Add PIE check for IT Systems Services (R606.6)
