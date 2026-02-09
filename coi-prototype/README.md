# COI System Prototype

Project layout: **frontend**, **backend**, and **database** hold the application; all other documentation is under **docs/** by category. See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) and [docs/README.md](docs/README.md).

## Setup Instructions

### Prerequisites
- Node.js 20+ 
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on http://localhost:3000

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173

### Why do the servers stop when I close the terminal?

When you run `npm run dev` in a terminal, the process is tied to that session. If you close the terminal tab/window, or the IDE stops the terminal, the process is killed. To keep servers running:

- **Option 1:** Leave both terminals open (one for backend, one for frontend).
- **Option 2:** Run in the background in a dedicated terminal, e.g. `npm run dev &` (then use `fg` to bring it back if needed).
- **Option 3:** Use Docker: `docker compose up -d` runs both backend and frontend in the background and keeps them running until you run `docker compose down`.
- **Option 4:** Use a process manager (e.g. `pm2 start "npm run dev" --name coi-backend`) for long-lived local runs.

The backend now logs uncaught exceptions and unhandled promise rejections instead of exiting, so a single error in a background task (e.g. monitoring) is less likely to bring down the server.

### Running with Docker

From the `coi-prototype` directory:

```bash
docker compose up --build
```

- **Frontend (Vite dev):** http://localhost:5173  
- **Backend API:** http://localhost:3000  

The SQLite database is stored in a Docker volume (`coi-database`) so it persists between runs. On first start, the backend copies the schema from the image into the volume and initializes the DB.

To run in the background: `docker compose up -d --build`. To stop: `docker compose down`.

### Database Setup

The database is automatically initialized when the backend starts. To seed data:

```bash
cd database/seed
node seedData.js
```

### Default Login

For prototype, use any email/password combination that exists in the seeded data:
- Email: `john.smith@company.com` (or any user email from seed data)
- Password: `password` (all users use this password in prototype)

### User Roles

- **Requester**: Can create and view own requests (department-segregated)
- **Director**: Can approve team member requests, view department requests
- **Compliance**: Reviews all requests (cross-department), no commercial data
- **Partner**: Approves requests, sees all departments
- **Finance**: Generates engagement codes
- **Admin**: Executes proposals, manages 30-day monitoring
- **Super Admin**: Full system access

### Departments

- Audit (15 employees, 8 requests)
- Tax (12 employees, 6 requests)
- Advisory (10 employees, 4 requests)
- Accounting (8 employees, 2 requests)
- Other (5 employees)

### Client testing checklist (handover)

Use this checklist to verify the prototype before client sign-off.

**Build and start**

1. Frontend: `cd frontend && npm run build` (must complete with no errors). Then `npm run dev`.
2. Backend: `cd backend && npm ci && npm run dev`. Wait for "Server running on http://localhost:3000".
3. API: `curl -s http://localhost:3000/api/health` returns `"status":"ok"`. With a valid auth token, `GET /api/config/client-intelligence/status` returns `enabled: true` so CRM/Business Development is available.

**CRM/BI present (Client Intelligence enabled)**

- As Requester, Director, or Partner: "Business Development" tab is visible in the dashboard sidebar.
- As Partner: CRM Insights cards are visible.
- In Reports: "Insights to Conversion" and other CRM reports appear and run.

**Core COI flows (manual)**

- **Auth:** Log in as each role (Requester, Director, Compliance, Partner, Finance, Admin, Super Admin); correct dashboard and nav load. Logout; `/coi/*` redirects to login.
- **Requester:** New request → fill required fields (client or prospect, entity, service type, description) → Save draft → Submit. If team member: status becomes Pending Director Approval; if Director: Pending Compliance. Duplicate handling: if "Critical duplicate – justification required" appears, enter justification and submit again.
- **Director:** Open a request in Pending Director Approval → Approve (or approve with restrictions). Request moves to Pending Compliance. Reject or request more info; requester sees updated status.
- **Compliance:** Open request in Pending Compliance → Approve or Reject (with notes). Compliance must not see financial fields (engagement code, total fees, fee details).
- **Partner:** Open request in Pending Partner → Approve or Reject. Request moves to Finance or Rejected.
- **Finance:** Open approved request → Generate engagement code. Code appears and status reflects "Generated".
- **Admin:** For an approved proposal, record execution (e.g. proposal sent, client response). 30-day monitoring starts where implemented.
- **Cross-cutting:** From any list, open a request; detail loads with correct fields and history. My Tasks / My Day / Week load. Core reports (e.g. My Requests Summary, Department Overview, Compliance Review Summary, Engagement Code Summary, System Overview) run without errors.

**E2E tests (optional)**  
With backend and frontend already running, from the `coi-prototype` directory run: `npm run test:e2e`. Core specs: `e2e/tests/auth.spec.ts`, `e2e/tests/coi-workflow.spec.ts`.


