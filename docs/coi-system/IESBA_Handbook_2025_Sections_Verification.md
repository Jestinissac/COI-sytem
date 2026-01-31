# IESBA Handbook 2025 - Section 600 Subsections Verification

## Overview

This document verifies all IESBA Section 600 subsections (601-610) from the 2025 Handbook Volume 1, comparing them to current system implementation.

**Source**: 2025 IESBA Handbook Volume 1  
**Extracted**: January 26, 2026  
**Status**: Verified against extracted PDF text

---

## Section 600: Provision of Non-Assurance Services to Audit Clients

### General Requirements (R600.9 - R600.25)

#### R600.9: Before Accepting Non-Assurance Service
- **Requirement**: Must apply conceptual framework to identify, evaluate and address threats
- **Current System**: ✅ Implemented in `duplicationCheckService.js` via `checkServiceTypeConflict()`

#### R600.15: Self-Review Threat Evaluation
- **Requirement**: Must determine if service creates self-review threat
- **Current System**: ✅ Implemented - checks if results affect accounting records/FS

#### R600.17: PIE Clients - Self-Review Prohibition
- **Requirement**: Cannot provide non-assurance service to PIE if it creates self-review threat
- **Current System**: ⚠️ Partially implemented - PIE restrictions exist but not all services checked

#### R600.18: Exception for Advice/Recommendations
- **Requirement**: May provide advice during audit if no management responsibility and threats addressed
- **Current System**: ❌ Not specifically implemented

#### R600.22-R600.25: PIE Governance Communication
- **Requirement**: Must communicate with governance before providing non-assurance services to PIE
- **Current System**: ❌ Not implemented

---

## Subsection 601: Accounting and Bookkeeping Services

### Key Requirements

#### R601.5: Non-PIE Clients
- **Requirement**: Can provide routine/mechanical accounting services with safeguards
- **Conditions**: 
  - Services must be routine/mechanical (little/no professional judgment)
  - Client makes all judgments/decisions
  - Firm addresses threats
- **Current System**: 
  ```javascript
  // duplicationCheckService.js lines 51-57
  ACCOUNTING: {
    blocked: ['AUDIT'],
    reason: {
      AUDIT: 'Cannot audit financial statements we prepared (self-review threat)'
    }
  }
  ```
- **Status**: ⚠️ **GAP** - Blocks ALL Accounting + Audit, doesn't distinguish PIE vs Non-PIE or routine vs non-routine

#### R601.6: PIE Clients
- **Requirement**: **PROHIBITED** - Cannot provide accounting/bookkeeping services to PIE audit clients
- **Current System**: ✅ Blocks Accounting + Audit, but applies to all clients (too restrictive for non-PIE)

#### R601.7: Exception for Related Entities
- **Requirement**: May prepare statutory FS for related entities with strict conditions
- **Current System**: ❌ Not implemented

### Examples of Routine/Mechanical Services (601.5 A3)
- Preparing payroll calculations based on client data
- Recording recurring transactions (client determines classification)
- Calculating depreciation (client determines policy/estimates)
- Posting client-coded transactions to general ledger
- Preparing FS from client-approved trial balance

---

## Subsection 602: Administrative Services

### Key Requirements

#### 602.3 A1: Threat Assessment
- **Requirement**: Administrative services usually don't create threats if clerical and require little/no judgment
- **Examples**: Word processing, document formatting, preparing forms, submitting forms, monitoring filing dates
- **Current System**: ✅ Not blocked (no conflict rule exists, which is correct)

---

## Subsection 603: Valuation Services

### Key Requirements

#### R603.3: Threat Evaluation
- **Requirement**: Must evaluate self-review and advocacy threats
- **Factors** (603.3 A2):
  - Use and purpose of valuation report
  - Whether report will be made public
  - Extent methodology supported by law/precedent
  - Client involvement in determining methodology
  - Degree of subjectivity
  - **Materiality** - whether valuation will have material effect on FS
  - Extent of disclosures
  - Volatility of amounts

#### R603.4: Non-PIE Clients
- **Requirement**: Cannot provide valuation if:
  - (a) Involves significant degree of subjectivity; AND
  - (b) Will have material effect on financial statements
- **Current System**: 
  ```javascript
  // duplicationCheckService.js lines 59-65
  VALUATION: {
    blocked: ['AUDIT'],
    reason: {
      AUDIT: 'Cannot audit valuations we performed (self-review threat)'
    }
  }
  ```
- **Status**: ⚠️ **GAP** - Blocks ALL Valuation + Audit, doesn't check materiality or subjectivity

#### R603.5: PIE Clients
- **Requirement**: Cannot provide valuation if it creates self-review threat
- **Current System**: ✅ Blocks Valuation + Audit (applies to all, which is correct for PIE but too restrictive for non-PIE)

---

## Subsection 604: Tax Services

### Key Requirements

#### R604.4: Tax Avoidance Prohibition
- **Requirement**: Cannot provide tax service or recommend transaction if:
  - Relates to marketing/planning/opining on tax treatment initially recommended by firm
  - Significant purpose is tax avoidance
  - Unless firm confident treatment has basis in tax law likely to prevail
- **Current System**: ❌ Not specifically implemented

#### A. Tax Return Preparation (604.5-604.6)
- **Requirement**: Usually doesn't create threat (based on historical info, subject to tax authority review)
- **Current System**: ✅ Not blocked (correct)

#### B. Tax Calculations (604.7-604.10)
- **Requirement**: Creates self-review threat
- **Non-PIE**: Allowed with safeguards if not material
- **PIE**: **PROHIBITED** (R604.10)
- **Current System**: 
  ```javascript
  // duplicationCheckService.js line 28
  flagged: ['TAX_CALCULATIONS']
  ```
- **Status**: ⚠️ Flagged but doesn't check materiality or PIE status

#### C. Tax Advisory and Tax Planning (604.11-604.15)
- **Requirement**: 
  - **Non-PIE**: Allowed if supported by tax authority/precedent/established practice
  - **PIE**: **PROHIBITED** if creates self-review threat (R604.15)
- **Current System**: 
  ```javascript
  // duplicationCheckService.js line 27
  blocked: ['TAX_PLANNING']
  
  // iesbaDecisionMatrix.js lines 42-55
  PIE + Tax Planning = REJECT (CRITICAL)
  ```
- **Status**: ✅ Well implemented

#### D. Tax Services Involving Valuations (604.16-604.19)
- **Requirement**: Apply Subsection 603 (valuation) requirements
- **Current System**: ⚠️ Handled via valuation rules

#### E. Assistance in Tax Disputes (604.20-604.27)
- **Requirement**: 
  - **Non-PIE**: Allowed with safeguards unless acting as advocate and material amounts (R604.25)
  - **PIE**: Cannot provide if creates self-review threat (R604.24); Cannot act as advocate (R604.26)
- **Current System**: ❌ Not specifically implemented

---

## Subsection 605: Internal Audit Services

### Key Requirements

#### R605.3: Management Responsibility Prevention
- **Requirement**: Client must designate competent resource who:
  - Reports to governance
  - Responsible for internal audit activities
  - Acknowledges responsibility for internal control
  - Reviews/assesses/approves scope, risk, frequency
  - Evaluates adequacy and findings
  - Determines which recommendations to implement
  - Reports significant findings to governance
- **Current System**: ❌ Not validated

#### R605.6: PIE Clients
- **Requirement**: Cannot provide internal audit services to PIE if creates self-review threat
- **Prohibited Services** (605.6 A1):
  - Internal controls over financial reporting
  - Financial accounting systems generating info for FS
  - Amounts/disclosures relating to FS
- **Current System**: 
  ```javascript
  // duplicationCheckService.js lines 67-73
  INTERNAL_AUDIT: {
    blocked: ['AUDIT'],
    reason: {
      AUDIT: 'Cannot outsource internal audit function for audit client'
    }
  }
  ```
- **Status**: ✅ Implemented (blocks all, which is correct for PIE but may be too restrictive for non-PIE)

---

## Subsection 606: Information Technology Systems Services

### Key Requirements

#### R606.3: Management Responsibility Prevention
- **Requirement**: Client must:
  - Acknowledge responsibility for internal controls
  - Make all management decisions (through competent individual)
  - Evaluate adequacy and results
  - Be responsible for operating system and data
- **Current System**: ❌ Not validated

#### R606.6: PIE Clients
- **Requirement**: Cannot provide IT systems services to PIE if creates self-review threat
- **Prohibited Services** (606.4 A3):
  - Designing/developing/implementing/operating/maintaining IT systems
  - Supporting IT systems, networks, software applications
  - Implementing accounting/financial reporting software
- **Current System**: 
  ```javascript
  // duplicationCheckService.js line 28
  flagged: ['IT_ADVISORY']
  ```
- **Status**: ⚠️ Flagged but doesn't check PIE status or specific IT services

---

## Subsection 607: Litigation Support Services

### Key Requirements

#### R607.6: PIE Clients - Self-Review
- **Requirement**: Cannot provide litigation support to PIE if creates self-review threat
- **Prohibited Example**: Advice in legal proceeding where outcome affects quantification of provisions/amounts in FS
- **Current System**: ❌ Not specifically implemented

#### R607.7 A3: Acting as Expert Witness
- **Requirement**: Advocacy threat acceptable if:
  - Appointed by tribunal/court; OR
  - Class action where firm's audit clients < 20% of class, no audit client leads class, no audit client authorizes services
- **Current System**: ❌ Not implemented

#### R607.9: PIE - Expert Witness
- **Requirement**: Cannot act as expert witness for PIE unless R607.7 A3 applies
- **Current System**: ❌ Not implemented

---

## Subsection 608: Legal Services

### Key Requirements

#### R608.7: PIE Clients - Legal Advice
- **Requirement**: Cannot provide legal advice to PIE if creates self-review threat
- **Current System**: ❌ Not specifically implemented

#### R608.9: General Counsel Prohibition
- **Requirement**: Partner/employee cannot serve as General Counsel of audit client
- **Current System**: ❌ Not implemented

#### R608.10: Non-PIE - Advocacy Role
- **Requirement**: Cannot act as advocate for non-PIE if amounts material to FS
- **Current System**: ❌ Not implemented

#### R608.11: PIE - Advocacy Role
- **Requirement**: Cannot act as advocate for PIE in disputes/litigation
- **Current System**: ❌ Not implemented

---

## Subsection 609: Recruiting Services

### Key Requirements

#### R609.3: Management Responsibility Prevention
- **Requirement**: Client must:
  - Assign responsibility to competent employee (preferably senior management)
  - Make all management decisions (suitability, selection, employment terms)
- **Current System**: ❌ Not validated

#### R609.5: Negotiator Prohibition
- **Requirement**: Cannot act as negotiator on client's behalf
- **Current System**: ❌ Not implemented

#### R609.6: Prohibited Recruiting Services
- **Requirement**: Cannot provide recruiting service if relates to:
  - Searching/seeking candidates
  - Reference checks
  - Recommending person to be appointed
  - Advising on terms of employment/remuneration
- **For positions**: Director/officer OR senior management in position to exert significant influence over accounting records/FS
- **Current System**: ❌ Not implemented

---

## Subsection 610: Corporate Finance Services

### Key Requirements

#### R610.5: Prohibited Services
- **Requirement**: Cannot provide services involving:
  - Promoting, dealing in, or underwriting shares/debt/financial instruments issued by audit client
  - Providing advice on investment in such instruments
- **Current System**: ❌ Not implemented

#### R610.6: Accounting Treatment Dependency
- **Requirement**: Cannot provide advice if:
  - Effectiveness depends on particular accounting treatment/presentation in FS; AND
  - Audit team has doubt about appropriateness of accounting treatment
- **Current System**: ❌ Not implemented

#### R610.8: PIE Clients
- **Requirement**: Cannot provide corporate finance services to PIE if creates self-review threat
- **Current System**: 
  ```javascript
  // duplicationCheckService.js line 27
  blocked: ['ADVISORY']  // May cover some corporate finance
  ```
- **Status**: ⚠️ Partially covered by ADVISORY block but not specific

---

## Summary of Implementation Status

### Fully Implemented ✅
- Section 604 (Tax Services) - Tax Planning prohibition
- Section 605 (Internal Audit) - Basic prohibition
- Red Lines (Management, Advocacy, Contingent Fees)

### Partially Implemented ⚠️
- Section 601 (Accounting) - Blocks all, needs PIE distinction
- Section 603 (Valuation) - Blocks all, needs materiality check
- Section 604 (Tax) - Tax Compliance flagged but no safeguards validation
- Section 606 (IT Services) - Flagged but no PIE check

### Not Implemented ❌
- Section 600.18 (Advice/Recommendations exception)
- Section 600.22-600.25 (PIE Governance Communication)
- Section 601.7 (Related Entities exception)
- Section 604.4 (Tax Avoidance prohibition)
- Section 604.24-604.27 (Tax Disputes)
- Section 605.3 (Management Responsibility validation)
- Section 606.3 (IT Management Responsibility validation)
- Section 607 (Litigation Support)
- Section 608 (Legal Services)
- Section 609 (Recruiting Services)
- Section 610 (Corporate Finance Services)

---

## Recommendations

1. **Add PIE Distinction**: Update Accounting and Valuation rules to allow non-PIE with safeguards
2. **Add Materiality Check**: For Valuation services, check if material to FS
3. **Add Governance Communication**: Require governance approval for PIE non-assurance services
4. **Add Management Responsibility Validation**: Check client responsibilities for Internal Audit, IT, Recruiting
5. **Implement Missing Subsections**: Add rules for Litigation Support, Legal Services, Recruiting, Corporate Finance
