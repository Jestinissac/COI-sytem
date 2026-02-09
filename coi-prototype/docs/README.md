# COI Prototype – Documentation (categorized)

All non-code documentation is under **docs/** and grouped by category. Application code lives in **frontend/**, **backend/**, and **database/** (see [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md)).

## Categories

| Category | Purpose | Contents |
|----------|---------|----------|
| **setup/** | Environment, device setup, CLI | README-CLI.md, SETUP_NEW_DEVICE.md |
| **reference/** | Reference material, comparisons, checklists | COI_FORM_IMPROVEMENTS.md, REQUEST_FORM_VS_APPROVAL_FORM_COMPARISON.md, WHY_LISTS_EMPTY.md |
| **prototype/** | Prototype-only build verification, test reports, implementation notes | 100+ implementation and fix docs |
| **production-handover/** | Handoff and production-readiness | Handover guides, verification reports |
| **plans/** | Planned features and implementation plans | approval-comments-and-previous-approver.plan.md, etc. |
| **marketing/** | Product one-pagers, outward-facing material | COI_System_Product_One_Pager.md |
| **design/** | Design options, mockups, UI/UX artifacts | design-options/, mockups/ (HTML and assets) |
| **testing/** | Test summaries, E2E guides, test results | TEST_SUMMARY.txt, TEST_RESULTS.html |
| **llm-context/** | RAG index and context for LLM tooling | api-routes.md, architecture-digest.md, module-summaries.md, .rag-index/ |

## Repo-level docs (outside coi-prototype)

For COI governance, scope, and production handover that span the repo:

- Repo root **docs/production-handover/** – Handoff guides.
- Repo root **docs/coi-system/** – COI governance and rules.
- Repo root **docs/analysis/**, **docs/reference/**, **docs/cursor-skills/** – Shared analysis and reference.

## Quick links

- [Project structure (frontend / backend / database / docs)](../PROJECT_STRUCTURE.md)
- [Main README (setup, Docker, default login)](../README.md)
