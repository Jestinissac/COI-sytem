# P0 — Critical (must fix before handover)

**Parent:** [COMPILED_CHANGES_TO_MAKE.md](./COMPILED_CHANGES_TO_MAKE.md)

---

## 1. Fix req.user usage (auth context)

**Problem:** Auth middleware sets only `req.userId` and `req.userRole`; it never sets `req.user`. Controllers that use `req.user` get `undefined` and throw (e.g. priority, SLA).

**Files to change:**
- `coi-prototype/backend/src/controllers/priorityController.js` — replace `const user = req.user` with `const user = getUserById(req.userId)` (and add import for `getUserById` from `../utils/userUtils.js`). Apply in `getQueue` and `getGrouped`.
- `coi-prototype/backend/src/controllers/slaController.js` — replace `req.user.id` with `req.userId` (or get user via `getUserById(req.userId)` if full user needed).
- `coi-prototype/backend/src/controllers/executionController.js` — replace all `req.user?.id`, `req.user?.role`, `req.user?.department` with `req.userId`, `req.userRole`, and user from `getUserById(req.userId)` for department.
- `coi-prototype/backend/src/controllers/isqmController.js` — replace `req.user?.id` with `req.userId`.
- `coi-prototype/backend/src/controllers/globalCOIController.js` — replace `req.user?.id` with `req.userId`.
- `coi-prototype/backend/src/controllers/configController.js` — replace `req.user?.id` with `req.userId` (lines 1861, 1888).
- `coi-prototype/backend/src/middleware/dataSegregation.js` — `applyDataSegregation` uses `req.user`; either remove this middleware from use or have a preceding middleware set `req.user`; if no route uses it, document or remove.

**Verification:** Call `GET /api/priority/queue` and `GET /api/priority/grouped` as an authenticated user; expect 200 and data, not 500.

---

## 2. Strip commercial data for Compliance in all list/dashboard/My Day responses

**Problem:** Compliance receives `financial_parameters`, `total_fees`, `engagement_code` wherever full request rows are returned. Currently only `getRequestById` strips; list, dashboard, and My Day/Week/Month do not.

**Approach:** Introduce a single response mapper (e.g. `mapResponseForRole(data, userRole)` in `coi-prototype/backend/src/utils/responseMapper.js`) that strips `financial_parameters`, `total_fees`, `engagement_code` (and `fee_details` if present) when `userRole === 'Compliance'`. Apply it everywhere request data is sent to the client.

**Files to change:**
- **New:** `coi-prototype/backend/src/utils/responseMapper.js` — implement `mapResponseForRole(rowsOrSingle, userRole)`; for Compliance, strip commercial fields from each row or single object.
- `coi-prototype/backend/src/controllers/coiController.js` — In `getMyRequests`, after `getFilteredRequests(user, req.query)`, pass result through mapper with `user.role` before `res.json(...)`. In `getDashboardData` (line ~1620), ensure any returned request rows are passed through the mapper for the current user's role.
- `coi-prototype/backend/src/controllers/myDayWeekController.js` — Before sending `getMyDay`, `getMyWeek`, `getMyMonth` responses, map any request objects in the payload through `mapResponseForRole(..., user.role)` (user is already available via `getUserById(req.userId)`).
- `coi-prototype/backend/src/controllers/priorityController.js` — After fixing req.user (item 1), ensure queue/grouped responses that contain request rows are passed through the mapper for Compliance.
- Keep existing stripping in `getRequestById` for Compliance; optionally refactor to use the same mapper for consistency.

**Verification:** Log in as Compliance; call list, dashboard, My Day/Week/Month (and priority queue once fixed). Responses must not contain `financial_parameters`, `total_fees`, `engagement_code`.

---

## 3. Replace wrong status string in reports

**Problem:** `reportDataService.js` uses `'Pending Compliance Review'` but the database and workflow use `'Pending Compliance'`. Compliance summary report undercounts.

**Files to change:**
- `coi-prototype/backend/src/services/reportDataService.js` — Replace every occurrence of `'Pending Compliance Review'` with `'Pending Compliance'` (lines 433, 464, 659 and any others). Grep for `Pending Compliance Review` in this file and in `notificationService.js` / `monitoringService.js` and fix consistently.

**Verification:** Run Compliance summary report; pending count should match requests in status `Pending Compliance`.
