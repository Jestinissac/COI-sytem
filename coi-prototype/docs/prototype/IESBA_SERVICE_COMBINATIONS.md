# IESBA Service Combinations - Complete Reference

Based on IESBA Code Section 290 (Auditor Independence) and the COI system's conflict matrix.

## Overview

The system implements IESBA independence rules through:
1. **Conflict Matrix** - General service combination rules
2. **PIE Restrictions** - Additional restrictions for Public Interest Entities
3. **IESBA Decision Matrix** - PIE + Tax service specific rules
4. **Red Lines** - Fundamental prohibitions (management responsibility, advocacy, contingent fees)

---

## Service Categories

| Category | Examples |
|----------|----------|
| **AUDIT** | Statutory Audit, External Audit, IFRS Audit, Group Audit |
| **ADVISORY** | Management Consulting, Business Advisory, Strategy Consulting, Restructuring |
| **ACCOUNTING** | Bookkeeping, Financial Reporting, Payroll Services |
| **VALUATION** | Business Valuation, Asset Valuation, Valuation Services |
| **INTERNAL_AUDIT** | Internal Audit, Internal Controls Review |
| **TAX** | Tax Compliance, Tax Return Preparation, Tax Filing |
| **TAX_PLANNING** | Tax Planning, Tax Advisory, Tax Strategy, Tax Optimization |
| **TAX_COMPLIANCE** | Tax Compliance, Tax Return Preparation |
| **TAX_CALCULATIONS** | Tax Calculations, Transfer Pricing, Tax Valuation |
| **DUE_DILIGENCE** | Due Diligence, Transaction Advisory, M&A Advisory |
| **IT_ADVISORY** | IT Advisory, Cybersecurity, IT Audit |

---

## General Rules (Non-PIE Clients)

### If Client Has AUDIT Engagement:

#### ❌ BLOCKED (Cannot Provide):
- **ADVISORY** - Management consulting threatens auditor independence
- **ACCOUNTING** - Cannot audit own bookkeeping work (self-review threat)
- **VALUATION** - Cannot audit valuations we performed (self-review threat)
- **INTERNAL_AUDIT** - Cannot outsource internal audit function for audit client
- **TAX_PLANNING** - Tax planning creates self-review threat - PROHIBITED

#### ⚠️ FLAGGED (Allowed with Review):
- **TAX / TAX_COMPLIANCE** - Requires fee cap review and safeguards
- **TAX_CALCULATIONS** - Requires safeguards and fee cap review
- **DUE_DILIGENCE** - May create self-review threat (review required)
- **IT_ADVISORY** - IT systems advice may affect audit scope (review required)

### If Client Has ADVISORY:

#### ❌ BLOCKED:
- **AUDIT** - Cooling-off period required after management consulting (typically 2 years)

### If Client Has ACCOUNTING:

#### ❌ BLOCKED:
- **AUDIT** - Cannot audit financial statements we prepared (self-review threat)

### If Client Has VALUATION:

#### ❌ BLOCKED:
- **AUDIT** - Cannot audit valuations we performed (self-review threat)

### If Client Has INTERNAL_AUDIT:

#### ❌ BLOCKED:
- **AUDIT** - Cannot provide external audit where internal audit was outsourced to us

---

## PIE (Public Interest Entity) Rules

**PIE Definition**: Public Interest Entities include listed companies, banks, insurance companies, and other entities of public interest.

### If Client Has PIE AUDIT Engagement:

#### ❌ BLOCKED (Stricter than Non-PIE):
- **ADVISORY** - Prohibited for PIE audit clients
- **ACCOUNTING** - Prohibited for PIE audit clients
- **VALUATION** - Prohibited for PIE audit clients
- **INTERNAL_AUDIT** - Prohibited for PIE audit clients
- **IT_ADVISORY** - Prohibited for PIE audit clients
- **TAX_PLANNING** - **HARD PROHIBITION** per IESBA Code Section 290.212

#### ⚠️ FLAGGED (Requires Enhanced Safeguards):
- **TAX / TAX_COMPLIANCE** - Permitted only if:
  - No management responsibility
  - Appropriate safeguards in place
  - Services are routine and administrative
  - Fee cap applies (non-audit fees ≤ 70% of audit fees)
- **TAX_CALCULATIONS** - Requires safeguards and fee cap review
- **DUE_DILIGENCE** - Requires careful review

#### 💰 Fee Cap Rule:
- **Non-audit fees must not exceed 70% of audit fees** (EU Audit Regulation Article 4(2))

---

## Allowed Combinations (No Restrictions)

### ✅ Always Allowed Together:

1. **TAX + ADVISORY** ✅
   - No independence conflict
   - Can provide both services simultaneously

2. **TAX + ACCOUNTING** ✅
   - No independence conflict
   - Common combination

3. **ADVISORY + VALUATION** ✅
   - No independence conflict
   - Both are non-audit services

4. **DUE_DILIGENCE + ADVISORY** ✅
   - No independence conflict

5. **IT_ADVISORY + ADVISORY** ✅
   - No independence conflict

6. **VALUATION + ACCOUNTING** ✅
   - No independence conflict

### ✅ Allowed with Cooling-Off Period:

1. **ADVISORY → AUDIT** ✅
   - **Allowed after 2-year cooling-off period**
   - Cannot provide audit immediately after advisory

---

## IESBA Decision Matrix (PIE + Tax Services)

### Rule 1: PIE + Tax Planning = ❌ PROHIBITED
- **Regulation**: IESBA Code Section 290.212
- **Severity**: CRITICAL
- **Action**: REJECT
- **Can Override**: No (hard prohibition)
- **Reason**: Creates self-review and advocacy threats that cannot be safeguarded

### Rule 2: PIE + Tax Compliance = ⚠️ REQUIRES SAFEGUARDS
- **Regulation**: IESBA Code Section 290.212
- **Severity**: HIGH
- **Action**: FLAG (requires Compliance review)
- **Can Override**: Yes (with documented safeguards)
- **Required Safeguards**:
  1. No management responsibility for tax matters
  2. Tax services performed by personnel not involved in audit
  3. Tax services reviewed by partner not involved in audit
  4. Client management acknowledges responsibility for tax decisions
  5. Tax services are routine and administrative in nature

### Rule 3: PIE + Other Tax Services = ⚠️ REVIEW REQUIRED
- **Regulation**: IESBA Code Section 290.212
- **Severity**: MEDIUM
- **Action**: REVIEW
- **Can Override**: Yes (with Compliance review)

---

## Red Lines (Fundamental Prohibitions)

These apply regardless of service combinations:

### 1. Management Responsibility ❌
- **Regulation**: IESBA Code Section 290.104
- **Prohibited**: Taking management responsibility for financial statements
- **Cannot Override**: Fundamental independence requirement

### 2. Advocacy ❌
- **Regulation**: IESBA Code Section 290.105
- **Prohibited**: Acting as advocate for client in litigation/disputes
- **Cannot Override**: Fundamental independence requirement

### 3. Contingent Fees ❌
- **Regulation**: IESBA Code Section 290.106
- **Prohibited**: Contingent fees for audit clients
- **Cannot Override**: Creates self-interest threat

---

## Group/Parent-Subsidiary Rules (IESBA 290.13)

### If Auditing Parent Company:
- ❌ Cannot provide **prohibited services** to subsidiaries
- ⚠️ Can provide **flagged services** with safeguards

### If Auditing Subsidiary:
- ❌ Cannot provide **prohibited services** to parent
- ⚠️ Can provide **flagged services** with safeguards

### If Auditing One Sister Company:
- ❌ Cannot provide **prohibited services** to other sister companies
- ⚠️ Can provide **flagged services** with safeguards

**Key Principle**: Independence rules apply to entire corporate group when auditing any entity in the group.

---

## Summary Matrix

### Non-PIE Audit Client:

| Service Combination | Status | Notes |
|---------------------|--------|-------|
| AUDIT + ADVISORY | ❌ BLOCKED | Management consulting threatens independence |
| AUDIT + ACCOUNTING | ❌ BLOCKED | Self-review threat |
| AUDIT + VALUATION | ❌ BLOCKED | Self-review threat |
| AUDIT + INTERNAL_AUDIT | ❌ BLOCKED | Cannot outsource internal audit |
| AUDIT + TAX_PLANNING | ❌ BLOCKED | Self-review threat |
| AUDIT + TAX_COMPLIANCE | ⚠️ FLAGGED | Requires safeguards + fee cap review |
| AUDIT + TAX_CALCULATIONS | ⚠️ FLAGGED | Requires safeguards |
| AUDIT + DUE_DILIGENCE | ⚠️ FLAGGED | May create self-review threat |
| AUDIT + IT_ADVISORY | ⚠️ FLAGGED | May affect audit scope |
| TAX + ADVISORY | ✅ ALLOWED | No conflict |
| TAX + ACCOUNTING | ✅ ALLOWED | No conflict |
| ADVISORY + VALUATION | ✅ ALLOWED | No conflict |

### PIE Audit Client:

| Service Combination | Status | Notes |
|---------------------|--------|-------|
| PIE AUDIT + ADVISORY | ❌ BLOCKED | Stricter than non-PIE |
| PIE AUDIT + ACCOUNTING | ❌ BLOCKED | Stricter than non-PIE |
| PIE AUDIT + VALUATION | ❌ BLOCKED | Stricter than non-PIE |
| PIE AUDIT + INTERNAL_AUDIT | ❌ BLOCKED | Stricter than non-PIE |
| PIE AUDIT + IT_ADVISORY | ❌ BLOCKED | Stricter than non-PIE |
| PIE AUDIT + TAX_PLANNING | ❌ **HARD PROHIBITION** | IESBA 290.212 - Cannot override |
| PIE AUDIT + TAX_COMPLIANCE | ⚠️ **REQUIRES SAFEGUARDS** | IESBA 290.212 - Enhanced safeguards + fee cap |
| PIE AUDIT + TAX_CALCULATIONS | ⚠️ FLAGGED | Fee cap applies (70% rule) |
| PIE AUDIT + DUE_DILIGENCE | ⚠️ FLAGGED | Requires careful review |

---

## Key IESBA Principles

1. **Self-Review Threat**: Cannot audit work we performed
2. **Management Responsibility**: Cannot take management role
3. **Advocacy Threat**: Cannot act as client advocate
4. **Self-Interest Threat**: Contingent fees create unacceptable risk
5. **Fee Dependence**: Non-audit fees must be reasonable (PIE: ≤70% of audit fees)

---

## How the System Enforces This

1. **Conflict Detection**: Automatically checks service combinations
2. **PIE Detection**: Identifies PIE clients and applies stricter rules
3. **Group Detection**: Extends rules to parent/subsidiary relationships
4. **Recommendations**: Provides Compliance with specific IESBA references
5. **Override Controls**: Some can be overridden with proper approval, others cannot

---

## References

- **IESBA Code Section 290**: Auditor Independence
- **IESBA Code Section 290.104**: Management Responsibility
- **IESBA Code Section 290.105**: Advocacy Threats
- **IESBA Code Section 290.106**: Contingent Fees
- **IESBA Code Section 290.212**: Tax Services for Audit Clients
- **IESBA Code Section 290.13**: Group/Parent-Subsidiary Rules
- **EU Audit Regulation Article 4(2)**: Fee Cap for PIE Clients

---

## Quick Reference

**Most Restrictive**: PIE Audit Client
- Almost all non-audit services are blocked or heavily restricted
- Tax Planning is hard prohibition
- Fee cap applies (70% rule)

**Moderate Restriction**: Non-PIE Audit Client
- Advisory, Accounting, Valuation blocked
- Tax services flagged (require review)
- No fee cap

**Least Restrictive**: Non-Audit Clients
- Most service combinations allowed
- No independence restrictions
- Full service portfolio available
