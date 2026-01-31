# Production Handover — Architecture v3.0

This folder contains the production handover documentation — the merged, definitive version combining handover context with full architecture specification.

## Version History

| Version | Description | Status |
|---------|-------------|--------|
| v1.0 | Original tight-coupling plan (direct SQL to HRMS, ALTER TABLE on PRMS) | Superseded |
| v2.0 | Standalone API architecture (adapter pattern, orchestration) | Superseded |
| **v3.0** | **Merged: handover context + API contracts + implementation details + decision log** | **Current** |

## What v3.0 Merges

**From v2.0 (handover context):**
- Project brief and prototype delivery summary
- Prototype-to-production comparison tables
- Refactoring map with specific file paths and line numbers
- Reference documentation links
- Sign-off section

**From Kimi architecture review:**
- Concrete API contract (HTTP endpoints with request/response JSON)
- Dead letter queue schema and handling
- Reconciliation violations table with resolution workflow (OPEN -> RESOLVED | FALSE_POSITIVE)
- Decision log capturing architectural rationale
- Implementation specifics (jitter formula, UPDLOCK READPAST, circuit breaker thresholds)
- Idempotency key design and tracking table
- Deliverables checklist

**Fixes applied:**
- SQL Server `NVARCHAR(MAX)` with `ISJSON()` check (not `JSON` type which SQL Server doesn't support natively)
- Stored procedure handles missing sequence (@@ROWCOUNT check + INSERT)
- Typos corrected from architecture review document

## Documents

| File | Description |
|------|-------------|
| `COI_Prototype_to_Production_Handover_with_Project_Brief.md` | Full v3.0 handover: 19 sections covering project brief, architecture, API contracts, SQL schemas, integration details, codebase structure, refactoring map, build phases, testing, risks, decision log, deliverables, and sign-off |

## Related Documentation

| Document | Location |
|----------|----------|
| v1.0 Handover (superseded) | `docs/production-handover/COI_Prototype_to_Production_Handover_with_Project_Brief.md` |
| Detailed Prototype vs Production Guide | `docs/production-handover/Prototype_vs_Production_Handoff_Guide.md` |
| PRMS Integration Current State | `docs/production-handover/PRMS_INTEGRATION_CURRENT_STATE.md` |
| COI System Scope of Work | `docs/coi-system/COI_System_Prototype_Scope_of_Work.md` |
| Prototype Implementation Docs | `coi-prototype/docs/prototype/` |
