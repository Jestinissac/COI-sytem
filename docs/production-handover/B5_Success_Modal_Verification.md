# B5 — Success confirmation after submit: verification

## Code verification (done)

- **Backend** [coi-prototype/backend/src/controllers/coiController.js](coi-prototype/backend/src/controllers/coiController.js): `submitRequest` success response includes `id: request.id` and `request_id: request.request_id` (lines 984–985).
- **Frontend** [coi-prototype/frontend/src/views/COIRequestForm.vue](coi-prototype/frontend/src/views/COIRequestForm.vue): Success modal state (`showSuccessModal`, `submittedRequestId`, `submittedRequestCode`, `submittedFlagged`), inline modal with ARIA and three actions, `handleSubmit` and `submitWithJustification` show modal instead of redirect, action handlers (`viewSubmittedRequest`, `createAnotherRequest`, `goToDashboardFromSuccess`, `closeSuccessModalAndReset`), Escape → go to dashboard.

---

## Backend verification (run when backend is up)

1. Start backend: `cd coi-prototype/backend && npm run dev`
2. Run: `cd coi-prototype && node scripts/verify-b5-submit-response.js`
   - Logs in as Requester, finds a Draft request, submits it, and checks that the JSON response includes `id` and `request_id`.
   - If no Draft exists, create one in the UI (New Request → fill minimum → Save Draft), then re-run.

Or manually with curl:

```sh
# 1. Login (use token from response)
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patricia.white@company.com","password":"password"}' | jq -r '.token')

# 2. Find a draft request id (e.g. from GET /api/coi/requests and pick one with status "Draft")
# 3. Submit (replace :id with actual draft id)
curl -s -X POST "http://localhost:3000/api/coi/requests/:id/submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}' | jq .
```

Expected response must include: `"id"`, `"request_id"`, `"success": true`, plus existing fields (`duplicates`, `groupConflicts`, `flagged`, `message`, etc.).

---

## Frontend verification (manual or E2E)

1. **Submit and modal**
   - Go to New Request, fill form, submit.
   - Confirm: success modal appears with request ID, next steps text, and three buttons; no automatic redirect.

2. **Actions**
   - **View Request**: modal closes, navigates to `/coi/request/:id`.
   - **Create Another**: modal closes, navigates to `/coi/request/new`.
   - **Go to Dashboard**: modal closes, navigates to `/coi/requester`.

3. **Escape**
   - Open success modal, press Escape: modal closes and navigates to `/coi/requester`.

4. **Flagged case**
   - Trigger a submission that returns `flagged: true` (e.g. group conflicts). Modal should show the amber flagged message; all three actions still work.

5. **Error handling**
   - Cause a submit error (e.g. disconnect backend). Toast shows error; success modal does not appear.

---

## Cypress/Playwright (optional)

Use the examples from the verification steps message: intercept POST `/api/coi/requests/:id/submit` for success/flagged/error, then assert modal visibility, text, and navigation for each action.
