---
name: hrms-prms-integration
description: Implements and documents HRMS and PRMS adapter integration, COI system overrides, and anti-corruption layers. Use when touching HRMS, PRMS, client sync, engagement codes, or COI-specific overrides.
---

# HRMS & PRMS Integration

## When to Use

- Implementing or changing PRMS/HRMS adapters
- Client validation, project creation, or parent-company sync
- COI-specific overrides (e.g. role overrides, permission overrides)
- Engagement code generation or validation
- Outbox, circuit breaker, or idempotency for integrations

## COI Production Context

- **Handover reference:** `coi-prototype/docs/production-handover/COI_Prototype_to_Production_Handover_with_Project_Brief.md` (Sections 5, 7)
- **PRMS:** COI → PRMS only via adapter (validate client, create client, create project, update parent). Use outbox for writes; circuit breaker (opossum); idempotency keys
- **HRMS:** Read-only sync to local cache; dashboards read from cache only. No direct HRMS calls at request time
- **COI overrides:** System can override or extend HRMS/PRMS data (e.g. COI role override, local permission flags); document overrides in handover/API docs

## Contract Verification

- Before changing any adapter API call: check Section 5 (API Contract) of the handover doc
- List all callers of the endpoint or payload you change
- Document breaking changes and update frontend/other consumers
- Preserve idempotency keys and correlation IDs on outbox messages

## Implementation Notes

- **Prototype:** Mock APIs or local DB. Mark with `// TODO: Integrate with PRMS/HRMS API`
- **Production:** Adapter layer only; no direct DB access to PRMS/HRMS
- **Failure handling:** Circuit breaker + outbox + dead letter; never silent failure

## Parent Company Update Workflow

When COI detects a parent company for a client that PRMS has as TBD or empty, use the request-approval workflow — never write directly to PRMS.

1. COI creates a "parent company update request"
2. PRMS Admin reviews in `ParentCompanyUpdateRequestsPanel.vue`
3. PRMS Admin approves or rejects
4. On approval, COI updates the local record

**Reference files:**
- `backend/src/controllers/parentCompanyUpdateController.js`
- `backend/src/routes/parentCompanyUpdate.routes.js`
- `frontend/src/components/admin/ParentCompanyUpdateRequestsPanel.vue`
