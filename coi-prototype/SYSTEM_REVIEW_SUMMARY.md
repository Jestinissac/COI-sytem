# System Review Summary - Quick Reference

**Date**: January 8, 2026

## Critical Issues (Fix Immediately)

1. **Missing Imports in coi.routes.js** - Routes will crash
   - Add: `sendIntervalAlerts`, `checkRenewalAlerts`, `getMonitoringAlertsSummary`

2. **Missing Imports in coiController.js** - Compliance approval will fail
   - Add: `parseRecommendations`, `logComplianceDecision` from `auditTrailService.js`

3. **Commercial Data Not Excluded** - Compliance can see financial data
   - Fix: Filter out `financial_parameters`, `engagement_code`, `total_fees` in `getRequestById()`

4. **Wrong Status on Proposal Execution** - Sets 'Active' before client accepts
   - Fix: Change `executeProposal()` to use intermediate status

5. **Automatic Lapse Not Implemented** - Requests never auto-lapse
   - Fix: Add scheduled job to check and update status to "Lapsed"

## High Priority Issues

6. **Director Status Routing** - Logic unclear (may be correct but needs verification)
7. **Duplicate getUserById** - Code duplication across files

## User Flow Status

| Flow | Status | Issues |
|------|--------|--------|
| Requester | ✅ Working | Minor: Director routing clarification |
| Director | ✅ Working | None |
| Compliance | ⚠️ Broken | Missing imports, commercial data visible |
| Partner | ✅ Working | None |
| Finance | ✅ Working | None |
| Admin | ⚠️ Broken | Missing imports, lapse not implemented |

## Files Requiring Fixes

1. `backend/src/routes/coi.routes.js` - Add imports
2. `backend/src/controllers/coiController.js` - Add imports, fix commercial data exclusion, fix executeProposal status
3. `backend/src/services/monitoringService.js` - Add automatic lapse function
4. Create scheduled job for automatic lapse checking

## Over-Engineering Found

- Duplicate `getUserById()` in multiple files (minor)

## Hallucinations Found

- Automatic 30-day lapse (documented but not implemented)
- Commercial data exclusion (set but not enforced)
