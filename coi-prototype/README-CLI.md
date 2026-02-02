# COI Prototype — Token-efficient CLI usage

Use **this folder** (`coi-prototype/`) as the project root when running **Gemini CLI** or **Claude CLI** so only the COI codebase is in context. That reduces tokens and keeps responses focused.

## How to use

1. **Open this folder as the project root** in your editor or CLI:
   - `cd coi-prototype` then run your CLI, or
   - File → Open Folder → select `coi-prototype`
2. **Scope:** You get backend (`backend/`), frontend (`frontend/`), database schema (`database/`), and E2E tests (`e2e/`) — without the rest of the repo.
3. **Excluded** (via `.cursorignore`): `node_modules/`, `dist/`, `playwright-report/`, `test-results/`, `*.db`, `backups/`, `.env`. These are not sent to the model.

## For even smaller context

- **Backend only:** Use `coi-prototype/backend/` as root.
- **Frontend only:** Use `coi-prototype/frontend/` as root.

## Codebase layout

| Path              | Contents                    |
|-------------------|-----------------------------|
| `backend/src/`    | Express API, controllers, services |
| `frontend/src/`   | Vue 3 app, views, components |
| `database/`       | SQLite schema, migrations   |
| `e2e/`            | Playwright E2E tests       |
