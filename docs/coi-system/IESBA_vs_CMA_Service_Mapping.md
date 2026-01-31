# IESBA vs CMA Service Mapping

## Overview

This document maps IESBA Handbook service categories to CMA Matrix service types, enabling unified conflict detection across both regulatory frameworks.

**Purpose**: Enable system to check both IESBA and CMA rules for the same service combination

---

## IESBA Service Categories (Current System)

### From `duplicationCheckService.js`:

```javascript
const SERVICE_CATEGORIES = {
  AUDIT: ['Statutory Audit', 'External Audit', 'Group Audit', 'IFRS Audit'],
  INTERNAL_AUDIT: ['Internal Audit', 'Internal Controls Review'],
  ADVISORY: ['Management Consulting', 'Business Advisory', 'Strategy Consulting', 'Restructuring'],
  TAX_COMPLIANCE: ['Tax Compliance', 'Tax Return Preparation', 'Tax Filing'],
  TAX_PLANNING: ['Tax Planning', 'Tax Advisory', 'Tax Strategy', 'Tax Optimization'],
  TAX_CALCULATIONS: ['Tax Calculations', 'Transfer Pricing', 'Tax Valuation'],
  TAX: ['Tax Compliance', 'Tax Advisory', 'Transfer Pricing', 'Tax Planning'], // Legacy
  ACCOUNTING: ['Bookkeeping', 'Accounting Services', 'Financial Reporting', 'Payroll Services'],
  VALUATION: ['Valuation Services', 'Business Valuation', 'Asset Valuation'],
  DUE_DILIGENCE: ['Due Diligence', 'Transaction Advisory', 'M&A Advisory'],
  IT_ADVISORY: ['IT Advisory', 'Cybersecurity', 'IT Audit']
}
```

---

## CMA Service Types

### From CMA Matrix:

| CMA Code | Service Name | Legal Reference |
|----------|--------------|-----------------|
| EXTERNAL_AUDIT | External Audit | General |
| INTERNAL_AUDIT | Internal Audit | General |
| RISK_MANAGEMENT | Risk Management | General |
| INT_CTRL_REVIEW_CMA | Review the Internal Control Systems | Article 6-9, Module 15 |
| INT_AUDIT_PERF_REVIEW | Review, evaluate the performance of the internal audit management/firm/unit | Article 6-9, Module 15 |
| AML_CFT_ASSESSMENT | Assessment on the level of compliance with AML/CFT Law | Article 7-7, Module 16 |
| INVESTMENT_ADVISOR | An Investment Advisor | Articles 2-9, 3-1-5, 4-1-8, 5-9, Module 9 |
| ASSET_VALUATION | Valuation of the assets | Articles 2-10, 5-10, Module 9 |
| CAPITAL_ADEQUACY_REVIEW | Review the capital adequacy report | Article 2-3, Module 17 |

---

## Service Mapping Matrix

### Direct Mappings (Exact Match)

| IESBA Category | CMA Service | Mapping Type | Notes |
|----------------|------------|--------------|-------|
| AUDIT | EXTERNAL_AUDIT | ✅ Direct | External Audit = Statutory Audit/External Audit |
| INTERNAL_AUDIT | INTERNAL_AUDIT | ✅ Direct | Internal Audit matches |
| VALUATION | ASSET_VALUATION | ⚠️ Partial | CMA is specific to asset valuation; IESBA includes business valuation |

### Partial Mappings (Subset/Superset)

| IESBA Category | CMA Service | Mapping Type | Notes |
|----------------|------------|--------------|-------|
| INTERNAL_AUDIT | INT_CTRL_REVIEW_CMA | ⚠️ Partial | "Internal Controls Review" in IESBA may map to CMA Internal Control Review, but CMA is more specific (Article 6-9) |
| INTERNAL_AUDIT | INT_AUDIT_PERF_REVIEW | ⚠️ Partial | "Internal Audit Quality Assurance" in system may map, but CMA is specific (Article 6-9) |
| ADVISORY | RISK_MANAGEMENT | ⚠️ Partial | Risk Management is a subset of Advisory services |
| ADVISORY | INVESTMENT_ADVISOR | ⚠️ Partial | Investment Advisor is a subset of Advisory services |
| VALUATION | ASSET_VALUATION | ⚠️ Partial | CMA is specific to asset valuation (M&A context) |

### No Direct Mapping (CMA-Specific Services)

| CMA Service | IESBA Equivalent | Mapping Strategy |
|-------------|-------------------|------------------|
| INT_CTRL_REVIEW_CMA | None (or Internal Controls Review) | Create dedicated CMA service code |
| INT_AUDIT_PERF_REVIEW | None (or Internal Audit Quality Assurance) | Create dedicated CMA service code |
| AML_CFT_ASSESSMENT | None | Create dedicated CMA service code |
| INVESTMENT_ADVISOR | Section 610 (Corporate Finance Services) | Map to IESBA R610.5 - partial overlap, CMA is more specific |
| CAPITAL_ADEQUACY_REVIEW | None | Create dedicated CMA service code |

### No CMA Equivalent (IESBA-Only Services)

| IESBA Category | CMA Equivalent | Notes |
|----------------|----------------|-------|
| ACCOUNTING | None | CMA Matrix doesn't include accounting services |
| TAX_COMPLIANCE | None | CMA Matrix doesn't include tax services |
| TAX_PLANNING | None | CMA Matrix doesn't include tax services |
| TAX_CALCULATIONS | None | CMA Matrix doesn't include tax services |
| DUE_DILIGENCE | None | CMA Matrix doesn't include due diligence |
| IT_ADVISORY | None | CMA Matrix doesn't include IT services |

---

## Recommended Service Mapping Strategy

### Option 1: Unified Service Catalog (Recommended)

Create a unified service catalog that includes both IESBA and CMA services:

```javascript
const UNIFIED_SERVICE_CATEGORIES = {
  // IESBA Categories
  AUDIT: {
    iesba: true,
    cma: 'EXTERNAL_AUDIT',
    services: ['Statutory Audit', 'External Audit', 'Group Audit', 'IFRS Audit']
  },
  INTERNAL_AUDIT: {
    iesba: true,
    cma: 'INTERNAL_AUDIT',
    services: ['Internal Audit', 'Internal Controls Review']
  },
  // CMA-Specific Categories
  INT_CTRL_REVIEW_CMA: {
    iesba: false,
    cma: 'INT_CTRL_REVIEW_CMA',
    services: ['Review the Internal Control Systems (Article 6-9, Module 15)'],
    legalReference: 'Article 6-9, Module Fifteen (Corporate Governance)'
  },
  INT_AUDIT_PERF_REVIEW: {
    iesba: false,
    cma: 'INT_AUDIT_PERF_REVIEW',
    services: ['Review, evaluate the performance of the internal audit management/firm/unit (Article 6-9, Module 15)'],
    legalReference: 'Article 6-9, Module Fifteen (Corporate Governance)'
  },
  AML_CFT_ASSESSMENT: {
    iesba: false,
    cma: 'AML_CFT_ASSESSMENT',
    services: ['Assessment on the level of compliance with AML/CFT Law (Article 7-7, Module 16)'],
    legalReference: 'Article 7-7, Module Sixteen (Anti-Money Laundering and Combating Financing of Terrorism)'
  },
  INVESTMENT_ADVISOR: {
    iesba: true, // Maps to CORPORATE_FINANCE subset
    cma: 'INVESTMENT_ADVISOR',
    iesbaMapping: 'CORPORATE_FINANCE',
    services: ['Investment Advisor (Articles 2-9, 3-1-5, 4-1-8, 5-9, Module 9)'],
    legalReference: 'Articles 2-9, 3-1-5, 4-1-8, 5-9, Module Nine (Mergers and Acquisitions)',
    iesbaReference: 'IESBA Code Section 610.5 - Corporate Finance Services'
  },
  ASSET_VALUATION: {
    iesba: true, // Maps to VALUATION
    cma: 'ASSET_VALUATION',
    services: ['Valuation of the assets (Articles 2-10, 5-10, Module 9)'],
    legalReference: 'Articles 2-10, 5-10, Module Nine (Mergers and Acquisitions)'
  },
  CAPITAL_ADEQUACY_REVIEW: {
    iesba: false,
    cma: 'CAPITAL_ADEQUACY_REVIEW',
    services: ['Review the capital adequacy report (Article 2-3, Module 17)'],
    legalReference: 'Article 2-3, Module Seventeen'
  },
  RISK_MANAGEMENT: {
    iesba: true, // Maps to ADVISORY subset
    cma: 'RISK_MANAGEMENT',
    services: ['Risk Management Services']
  }
}
```

### Option 2: Service Type Mapping Table

Create a mapping table that links system service types to both IESBA and CMA categories:

```sql
CREATE TABLE service_type_mappings (
  id INTEGER PRIMARY KEY,
  system_service_type VARCHAR(255) NOT NULL,
  iesba_category VARCHAR(50),
  cma_service_code VARCHAR(50),
  mapping_type VARCHAR(20), -- 'direct', 'partial', 'cma_specific', 'iesba_only'
  notes TEXT
);
```

---

## Conflict Detection Logic

### Unified Conflict Check Flow

```javascript
function checkServiceCombination(serviceA, serviceB, clientData) {
  const conflicts = []
  
  // 1. Check CMA rules (if CMA-regulated client)
  if (isCMARegulated(clientData)) {
    const cmaConflict = checkCMARules(serviceA, serviceB)
    if (cmaConflict) {
      conflicts.push({
        ...cmaConflict,
        regulationSource: 'CMA',
        priority: 1 // CMA takes precedence for CMA-regulated clients
      })
    }
  }
  
  // 2. Check IESBA rules (always)
  const iesbaConflict = checkIESBARules(serviceA, serviceB, clientData)
  if (iesbaConflict) {
    conflicts.push({
      ...iesbaConflict,
      regulationSource: 'IESBA',
      priority: 2
    })
  }
  
  // 3. Return most restrictive conflict
  return conflicts.sort((a, b) => a.priority - b.priority)[0] || null
}
```

### Service Type Resolution

```javascript
function resolveServiceType(serviceTypeName) {
  // 1. Check if it's a CMA-specific service
  const cmaService = CMA_SERVICES.find(s => 
    serviceTypeName.includes(s.name) || 
    serviceTypeName.includes(s.keywords)
  )
  if (cmaService) {
    return {
      cmaCode: cmaService.code,
      iesbaCategory: cmaService.iesbaMapping || null,
      isCMASpecific: true
    }
  }
  
  // 2. Check IESBA categories
  for (const [category, services] of Object.entries(SERVICE_CATEGORIES)) {
    if (services.some(s => serviceTypeName.includes(s))) {
      return {
        iesbaCategory: category,
        cmaCode: IESBA_TO_CMA_MAPPING[category] || null,
        isCMASpecific: false
      }
    }
  }
  
  return null
}
```

---

## Implementation Recommendations

### 1. Add CMA Service Types to Service Catalog

Add CMA-specific services to `service_catalog_global` table:

```sql
INSERT INTO service_catalog_global (service_name, category, is_kuwait_local, is_cma_specific, legal_reference) VALUES
('Review the Internal Control Systems (Article 6-9, Module 15)', 'CMA Regulatory Services', 1, 1, 'Article 6-9, Module Fifteen (Corporate Governance)'),
('Review, evaluate the performance of the internal audit management/firm/unit (Article 6-9, Module 15)', 'CMA Regulatory Services', 1, 1, 'Article 6-9, Module Fifteen (Corporate Governance)'),
('Assessment on the level of compliance with AML/CFT Law (Article 7-7, Module 16)', 'CMA Regulatory Services', 1, 1, 'Article 7-7, Module Sixteen (Anti-Money Laundering and Combating Financing of Terrorism)'),
('Investment Advisor (Articles 2-9, 3-1-5, 4-1-8, 5-9, Module 9)', 'Advisory', 1, 1, 'Articles 2-9, 3-1-5, 4-1-8, 5-9, Module Nine (Mergers and Acquisitions)'),
('Valuation of the assets (Articles 2-10, 5-10, Module 9)', 'Valuation', 1, 1, 'Articles 2-10, 5-10, Module Nine (Mergers and Acquisitions)'),
('Review the capital adequacy report (Article 2-3, Module 17)', 'CMA Regulatory Services', 1, 1, 'Article 2-3, Module Seventeen');
```

### 2. Create Service Type Mapping Function

```javascript
// backend/src/services/serviceTypeMapping.js
export function getServiceMapping(serviceTypeName) {
  // Returns both IESBA category and CMA code
  // Enables checking both rule sets
}
```

### 3. Update Conflict Detection

Modify `checkServiceTypeConflict()` to:
1. Resolve service type to both IESBA and CMA categories
2. Check CMA rules if client is CMA-regulated
3. Check IESBA rules (always)
4. Return most restrictive conflict

---

## Service Type Examples

### Example 1: External Audit
- **IESBA**: `AUDIT` category
- **CMA**: `EXTERNAL_AUDIT`
- **Mapping**: Direct match
- **Conflict Check**: Check both IESBA AUDIT rules and CMA EXTERNAL_AUDIT rules

### Example 2: Internal Control Review
- **IESBA**: May map to `INTERNAL_AUDIT` or separate category
- **CMA**: `INT_CTRL_REVIEW_CMA` (specific Article 6-9 service)
- **Mapping**: CMA-specific, but may overlap with IESBA Internal Controls Review
- **Conflict Check**: Check CMA rules (if CMA-regulated), check IESBA if mapped

### Example 3: Investment Advisor
- **IESBA**: May map to `ADVISORY` or `DUE_DILIGENCE`
- **CMA**: `INVESTMENT_ADVISOR` (specific Module 9 service)
- **Mapping**: CMA-specific service
- **Conflict Check**: Check CMA rules (if CMA-regulated), check IESBA ADVISORY rules

### Example 4: Asset Valuation
- **IESBA**: `VALUATION` category
- **CMA**: `ASSET_VALUATION` (specific Module 9 service)
- **Mapping**: Partial - CMA is subset of IESBA VALUATION
- **Conflict Check**: Check both, CMA rules may be more specific

---

## Key Differences

### Scope
- **IESBA**: International standards, broader service categories
- **CMA**: Kuwait-specific, regulatory services for capital markets

### Service Coverage
- **IESBA**: Covers accounting, tax, IT, legal, recruiting, corporate finance
- **CMA**: Focuses on audit, internal audit, risk management, regulatory compliance services

### Overlap
- Both cover: External Audit, Internal Audit, Valuation
- CMA adds: Regulatory compliance services (Internal Control Review, AML Assessment, Capital Adequacy)
- IESBA adds: Tax, Accounting, IT, Legal, Recruiting, Corporate Finance

---

## Implementation Priority

1. **High**: Add CMA-specific service codes to service catalog
2. **High**: Create service type mapping function
3. **Medium**: Update conflict detection to check both rule sets
4. **Low**: Create unified service category structure
