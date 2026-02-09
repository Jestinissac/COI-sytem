# Why Lists Are Empty

This doc explains why request lists (dashboards, My Requests, etc.) can appear empty and how to fix it.

## Root causes

### 1. Backend not running (most common)

- **Symptom**: Lists show "No requests found" (or empty tables) and no data loads.
- **Cause**: The frontend calls `GET /api/coi/requests`, which is proxied to `http://localhost:3000`. If the backend is not running, the request fails (e.g. connection refused).
- **Effect**: The store keeps `requests.value = []` and may set `error.value` (e.g. "Failed to fetch requests"). The UI often shows the same empty state as when there are truly no requests.
- **Fix**: Start the backend:
  ```bash
  cd coi-prototype/backend && npm run dev
  ```
  Ensure it listens on port 3000. If you see "Cannot reach server" or similar on login, the backend is not running.

### 2. Not logged in / invalid token

- **Symptom**: Redirect to login, or 401 on API calls.
- **Cause**: Missing or expired token; `GET /api/coi/requests` returns 401.
- **Fix**: Log in again. In development, use a known user (e.g. `patricia.white@company.com` with any password).

### 3. Logged-in user has no requests (role-based filter)

- **Symptom**: Lists are empty but no error message; backend returns `200` with `[]`.
- **Cause**: The API filters by role:
  - **Requester**: only requests where `requester_id = current user` and same department.
  - **Director**: only requests from the director’s team (same department).
  - **Compliance / Partner / Finance / Admin / Super Admin**: all departments (so only empty if the DB has no requests at all).
- **Fix**: Use a user that has data in the current DB, or seed data for that user.
  - Example: `patricia.white@company.com` (Requester, Audit) has requests in the restored backup (`coi-dev.db`).
  - Directors see requests where the requester’s `director_id` matches the director and department matches.

### 4. Database empty or wrong file

- **Symptom**: Backend runs and returns 200, but body is `[]` for all roles.
- **Cause**: `coi_requests` (and/or `clients`, `users`) are empty, or the app is using a different DB file (e.g. empty `coi-dev.db` instead of a restored backup).
- **Fix**: Restore from backup or run seeds so that `coi_requests` has rows linked to valid `client_id` and `requester_id` (and directors have team members). The list endpoint uses `INNER JOIN clients` and `INNER JOIN users`, so missing clients or users will drop rows.

## Quick verification

1. **Backend**: `curl -s http://localhost:3000/api/health` should return `{"status":"ok",...}`.
2. **Login**: `curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"patricia.white@company.com","password":"any"}'` should return a token.
3. **List**: `curl -s -H "Authorization: Bearer <TOKEN>" http://localhost:3000/api/coi/requests` should return a JSON array (e.g. 3+ items for Patricia in the backup).

## "Still not loading" checklist

If the app or form **still doesn’t load** after fixes:

1. **Backend must be running**  
   From repo root:
   ```bash
   cd coi-prototype/backend && npm run dev
   ```
   You should see "Server running on port 3000" and no crash. Leave this terminal open.

2. **Frontend must be running** (separate terminal)  
   ```bash
   cd coi-prototype/frontend && npm run dev
   ```
   Open **http://localhost:5173** (not the backend URL).

3. **Log in**  
   Use e.g. `patricia.white@company.com` with any password. If you see "Cannot reach server", the backend is not running or not on port 3000.

4. **New COI Request form**  
   - Entity and Countries dropdowns now get fallback options if the API fails, so they should not be empty.  
   - If you see the red banner "Failed to load form data. Please check your connection and retry.", the backend is likely down or returning errors — check the backend terminal and `curl http://localhost:3000/api/health`.

5. **Dashboard lists empty**  
   See root causes above: backend not running, not logged in, user has no requests, or DB empty/wrong.

## Summary

| Cause              | Backend running? | API response   | Fix                          |
|--------------------|------------------|----------------|------------------------------|
| Backend not running| No               | (network error)| Start backend on port 3000   |
| Not logged in      | Yes              | 401            | Log in again                 |
| User has no requests | Yes            | 200 `[]`       | Use user with data or seed   |
| DB empty/wrong     | Yes              | 200 `[]`       | Restore backup or run seeds  |
