# Continue Project on New Device

Use this guide when you've moved the Envision PRMS / COI prototype to a new Mac (or new machine).

## Prerequisites

- **Node.js** 18+ (LTS recommended). Check: `node -v`
- **npm** (comes with Node). Check: `npm -v`
- Optional: **Python 3.8+** if you use the ML priority model under `backend/ml/`

## Quick setup (development)

From the **coi-prototype** folder:

### 1. Backend

```bash
cd backend
npm install
```

Ensure `backend/.env` exists with at least:

```env
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:5173
```

(If `.env` was not copied, create it; the app uses these for JWT and CORS. For production you must set `JWT_SECRET` and `REFRESH_TOKEN_SECRET`.)

Start the backend:

```bash
npm run dev
```

On first run the backend will:

- Create the database file (e.g. `database/coi-dev.db` for development)
- Run schema and migrations
- Seed demo users, clients, and sample COI requests if tables are empty

Leave this terminal running.

### 2. Frontend

In a **second terminal**, from **coi-prototype**:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173** and talks to the API at **http://localhost:3000**.

### 3. Log in

Use any demo user; password for all is **password** (prototype only):

| Role        | Email                     |
|------------|----------------------------|
| Super Admin | admin@company.com         |
| Requester   | patricia.white@company.com |
| Director    | john.smith@company.com     |
| Compliance  | emily.davis@company.com    |
| Partner     | robert.taylor@company.com   |
| Finance     | lisa.thomas@company.com    |
| Admin       | james.jackson@company.com  |

## If you brought a database from the old Mac

- Database files are **not** in git (they are in `.gitignore`: `database/*.db`).
- If you copied a `.db` file (e.g. `coi.db` or `coi-dev.db`) into `coi-prototype/database/`, ensure:
  - The backend `NODE_ENV` matches the file you use (development → `coi-dev.db`, production → `coi.db`).
  - The file is readable/writable by the Node process.
- If you did **not** copy a DB, that’s fine: the first backend start will create a new DB and seed it.

## Optional: full seed (catalogs, rules, countries)

The backend `initDatabase()` seeds:

- Demo users and clients
- Sample COI requests
- Service catalogs (Kuwait + Global), CMA rules, IESBA rules, countries, entity codes, priority/SLA config, permissions

If you need to re-seed from the seed package:

```bash
cd database/seed
npm install
node runSeed.js
```

(Ensure the backend is not running when you run the seed script if it writes to the same DB.)

## E2E tests (Playwright)

From **coi-prototype**:

```bash
cd e2e
npm install
npx playwright install
npx playwright test
```

## Troubleshooting

| Issue | What to do |
|-------|------------|
| `EACCES` or permission errors on `database/` | Ensure `coi-prototype/database` exists and is writable. |
| `JWT_SECRET must be set in production` | You started with `NODE_ENV=production`. Use `NODE_ENV=development` and the existing `.env`, or set real secrets for production. |
| Frontend can’t reach API | Confirm backend is running on port 3000 and `APP_URL` in backend `.env` matches the frontend origin (e.g. http://localhost:5173). |
| `better-sqlite3` build fails | Install build tools (Xcode Command Line Tools on Mac: `xcode-select --install`). |
| Port 3000 or 5173 in use | Change `PORT` in backend `.env` or frontend `vite.config.ts`, and update API base URL in frontend if needed. |

## Known non-blocking issues (existing codebase)

After first start you may see:

- **Schema errors** for tables like `workflow_config`, `form_versions` — from migration files; safe to ignore in development.
- **SLA notification errors** (`NOT NULL constraint failed: notification_queue.recipient_id`) when SLA checks run — fix in notification service when assigning recipients.
- **Monitoring check** `no such column: is_active` — fix by adding the column to the relevant table or adjusting the query.

These do not prevent login or normal COI workflow.

## Next steps

- See **backend/ENVIRONMENT_SETUP.md** for environments (development / staging / production) and load testing.
- See **docs/** at repo root for handoff, COI governance, and production differences.
