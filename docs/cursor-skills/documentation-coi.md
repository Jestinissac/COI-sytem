---
name: documentation-coi
description: Documentation standards for the COI system: API docs, handover, architecture, and runbooks. Use when creating or updating COI docs, handover, or technical specifications.
---

# Documentation (COI)

## When to Use

- Creating or updating API documentation, handover docs, or architecture specs
- Documenting new features, integration contracts, or production build steps
- Writing runbooks (e.g. PRMS down, dead letter, reconciliation)
- Aligning docs with prototype or production handover

## Standards

- **Clear and concise:** No vague or duplicate sections
- **Structured:** Overview, prerequisites, main content, configuration, examples, troubleshooting, references
- **Accurate:** Reflect current implementation; update when code or contract changes
- **Cross-reference:** Link related docs (e.g. handover, COI_FORM_IMPROVEMENTS.md, API contract)

## Key Locations

- **Production handover:** `coi-prototype/docs/production-handover/COI_Prototype_to_Production_Handover_with_Project_Brief.md`
- **Form improvements:** `coi-prototype/COI_FORM_IMPROVEMENTS.md`
- **Prototype handoff guide:** See prototype-handoff-sync agent for path and sections to update
- **API contract:** Section 5 of production handover (COI ↔ PRMS)
- **Refactoring map:** Section 9 of production handover (current vs production)

## Sync with Build

- When prototype changes (schema, API, integrations, features): update handover and related docs per prototype-handoff-sync workflow
- Document prototype vs production differences explicitly; mark placeholder vs production-ready
