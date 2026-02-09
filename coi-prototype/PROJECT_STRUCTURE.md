# Project structure

This folder is segregated into **application code** (frontend, backend, database) and **everything else** (docs, tooling, tests).

## Application (core)

| Folder | Purpose |
|--------|--------|
| **frontend/** | Vue 3 + TypeScript + Vite app. UI, components, stores, services, router. |
| **backend/** | Express API. Controllers, routes, services, middleware, auth, database init. |
| **database/** | Schema, migrations, seed data. SQLite for prototype; production may use SQL Server. |

Run from repo root: `backend` and `frontend` each have their own `package.json`; use `compose.yaml` for full stack.

## Documentation (categorized)

All non-code documentation lives under **docs/** and is grouped by category. See [docs/README.md](docs/README.md) for the full index.

| Category | Purpose |
|----------|--------|
| **docs/setup** | Setup, new-device, CLI, environment. |
| **docs/reference** | Form improvements, comparisons, checklists, reference material. |
| **docs/prototype** | Build verification, test reports, implementation notes (prototype-only). |
| **docs/production-handover** | Handoff and production-readiness. |
| **docs/plans** | Planned features and implementation plans. |
| **docs/marketing** | Product one-pagers and outward-facing material. |
| **docs/design** | Design options, mockups, UI/UX artifacts. |
| **docs/llm-context** | RAG/index and context for LLM tooling. |
| **docs/testing** | Test summaries, E2E guides, test results. |

## Tooling and tests (outside docs)

| Item | Purpose |
|------|--------|
| **scripts/** | Dev/utility scripts (e.g. RAG, API summary, tree generation). |
| **e2e/** | Playwright E2E tests. Run via `npm run test:e2e` from this directory. |
| **client-intelligence/** | Client-intelligence / CRM sub-project (scripts and docs). |
| **compose.yaml** | Docker Compose for backend + frontend + DB volume. |
| **playwright.config.ts** | Playwright configuration. |

## Not in version control

- **node_modules/** (per package)
- **backend/dist**, **frontend/dist**
- **playwright-report/**, **test-results/**
- **.backup/**, **backups/** (local/DB backups)
