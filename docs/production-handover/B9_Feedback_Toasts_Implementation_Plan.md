# B9 — Feedback/Toasts at Every Stage — Implementation Plan

**Purpose:** Add user-visible feedback (toasts) after every approval-stage action and ensure backend notifies the right parties. Optional: return `nextStatus` from approve API for exact toast text.

**Scope:** Frontend `COIRequestDetail.vue`, `CodeGenerationModal.vue`; Backend `coiController.js`, `notificationService.js`.

---

## 1. Frontend — COIRequestDetail.vue

**File:** `coi-prototype/frontend/src/views/COIRequestDetail.vue`

**Import (do first):** Ensure the toast composable is imported at the top of the file:
```javascript
import { useToast } from '@/composables/useToast'
```
Then obtain `toast` from it (e.g. `const { toast } = useToast()`) so it is available in all handlers below. Use consistent error handling: success toast after the successful API call and `loadRequest()`; error toast in the catch block using `error.response?.data?.error || 'Fallback message'`.

### 1.1 Approve (simple and with restrictions)

- **Current:** `approveRequest()` and `approveWithRestrictions()` call API, then `loadRequest()`; no toast, no error toast.
- **Change:**
  - On success: after `await loadRequest()`, show  
    `toast.success('Request approved. Moved to ' + (response.data?.nextStatus || request.value?.status || 'next stage') + '.')`  
    Use the approve API response if it includes `nextStatus` (see backend 3.1); otherwise use reloaded `request.value.status`.
  - On error: show `toast.error(error.response?.data?.error || 'Failed to approve.')` (and keep `console.error` for debugging).
- **Where:** In both `approveRequest` (around line 1831) and `approveWithRestrictions` (around line 1850), capture `const response = await api.post(...)` and use `response.data` for toast; add catch block with `toast.error(...)`. Use the same pattern for both success and error so handling is consistent.

### 1.2 Reject (with type)

- **Current:** `rejectRequestWithType()` closes modal, reloads, resets form; no success toast.
- **Change:**
  - On success: after `await loadRequest()`, show  
    `toast.success('Request rejected. Requester has been notified.')`
  - On error: show `toast.error(error.response?.data?.error || 'Failed to reject.')`
- **Where:** In `rejectRequestWithType` (around line 1925), add success toast after `loadRequest()` and error toast in catch. Use consistent error handling for both states.

### 1.3 Request More Info

- **Current:** `requestMoreInfo()` closes modal, clears fields, reloads; no toast.
- **Change:**
  - On success: after `await loadRequest()`, show  
    `toast.success('Information request sent to requester.')`
  - On error: show `toast.error(error.response?.data?.error || 'Failed to send information request.')`
- **Where:** In `requestMoreInfo` (around line 1859), add the same pattern. Use consistent error handling for both states.

### 1.4 Reject confirmation modal wording

- **Current:** Modal title is "Reject Request"; body has rejection type (fixable/permanent) and reason textarea.
- **Change:** Make it explicit that rejecting will notify the requester. Keep wording clear and user-friendly.
  - Title: keep "Reject Request" or use "Confirm Rejection".
  - Add a short line above the action buttons so the confirmation is explicit, for example:
    ```html
    <p class="text-sm text-gray-600 mt-2">The requester will be notified of this rejection.</p>
    ```
- **Where:** In the reject modal template (around lines 956–1017), add the sentence above the button row (before the flex with Reject / Cancel).

---

## 2. Frontend — Engagement code toast (Finance)

**File:** `coi-prototype/frontend/src/components/finance/CodeGenerationModal.vue`

**Import (do first):** Ensure the toast composable is imported at the top of the file:
```javascript
import { useToast } from '@/composables/useToast'
```
Obtain `toast` (e.g. `const { toast } = useToast()`) so it is available in the success path.

- **Current:** On success it sets `generatedCode`, emits `success`, and does not show a toast.
- **Change:** After a successful response and when `engagementCode` is set (around line 468), show a success toast:  
  `toast.success('Engagement code ' + engagementCode + ' generated successfully.')`
- **Where:** Immediately after `generatedCode.value = engagementCode` (or before `setTimeout` that emits `success`), call the toast. If the modal is used inside COIRequestDetail, the parent may already have toast; the modal can still show its own toast for consistency when Finance stays on the same page.

---

## 3. Backend — coiController.js

### 3.1 Return `nextStatus` from approve (optional but recommended)

- **Current:** `approveRequest` returns `res.json({ success: true, approval_status: approvalStatus })` (line 1250). Variable `nextStatus` is already set (Director → Pending Compliance, Compliance → Pending Partner, Partner → Pending Finance).
- **Change:** Include `nextStatus` in the success response so the frontend can show the exact stage in the toast:  
  `res.json({ success: true, approval_status: approvalStatus, nextStatus })`  
- **Where:** In `approveRequest`, at the success response (line 1250).

### 3.2 Notify previous approvers when moving to next stage

- **Current:** Backend notifies the **next** approver (`sendApprovalNotification`) and the **requester** (email). It does **not** notify approvers who already approved (e.g. Director when Compliance approves).
- **Change:** After updating status and before sending the success response:
  - Determine “previous approvers” for this request from the current approval chain (e.g. from `coi_requests`: `director_approval_by`, `compliance_reviewed_by`, `partner_approved_by`). Only include users who have already approved (non-null) and who are not the current approver.
  - For each such user (with email), send a short “progress update” notification: e.g. “Request [ID] has been approved by [current approver] and is now [nextStatus].”
- **Implementation options:**
  - **Option A:** Add a new exported function in `notificationService.js`, e.g. `notifyPreviousApproversOfProgress(requestId, currentApproverName, currentApproverRole, nextStatus)`, which loads the request, collects previous approver user IDs from the request row, and sends each an email (or in-app notification if present). Call it from `approveRequest` after `sendApprovalNotification` and requester email.
  - **Option B:** Inline in `coiController.js`: after the DB update, query previous approver IDs from the updated request, then call a small helper or `sendEmail` for each. Prefer Option A if you want to keep notification content and logic in one place.
- **Where:** In `approveRequest`, after the block that sends notification to next approver and requester (around 1176–1211), add the call to notify previous approvers. Ensure `req.userId` / `getUserById(req.userId)` is used for “current approver” (auth pattern: use `req.userId`, not `req.user`).

### 3.3 Engagement code generation notifications

- **Current:** `generateEngagementCode` already calls `sendEngagementCodeNotification(requestId, code)` (line 1868). That function in `notificationService.js` (around 941) already notifies: requester, Admin users, and Partner (if `partner_approved_by` set).
- **Change:** No backend change required for “notify requester/admin” — already implemented.
- **Verification:** Confirm that `sendEngagementCodeNotification` is still called **after** the transaction that sets the engagement code and request status (so it receives the correct `requestId` and generated `code`). Verify the call receives the correct `requestId` (e.g. `req.params.id` or the same id used in the transaction) and the `code` returned from the transaction. If any environment or feature flag disables it, document or align with product intent.

---

## 4. Backend — notificationService.js (if Option A for previous approvers)

- **New function:** e.g. `notifyPreviousApproversOfProgress(requestId, currentApproverName, currentApproverRole, nextStatus)`.
  - Load request by `requestId` (need `request_id`, `director_approval_by`, `compliance_reviewed_by`, `partner_approved_by`).
  - Build a set of user IDs who have already approved: non-null `director_approval_by`, `compliance_reviewed_by`, `partner_approved_by`, minus the current user (so the approver who just acted is not notified).
  - For each ID, get user email and send a short email (subject/body as per project style; no emojis). Content: request moved to next stage, who approved, new status.
  - Use existing `sendEmail` or equivalent; do not block the response on email failures (log and continue).
- **Export** the function and import it in `coiController.js` for use in `approveRequest`.

---

## 5. Verification

- **Approve:** As Director/Compliance/Partner, approve a request → toast shows “Request approved. Moved to [next stage].” and (if implemented) previous approvers receive a progress email.
- **Reject:** Reject a request (with confirmation modal) → toast shows “Request rejected. Requester has been notified.”
- **Need more info:** Request more info → toast shows “Information request sent to requester.”
- **Engagement code:** As Finance, generate code → toast shows “Engagement code [CODE] generated successfully.”
- **Reject modal:** Wording clearly states that the requester will be notified.
- **Backend:** Approve response includes `nextStatus` when optional change is applied; previous-approver emails sent when implemented.

---

## 6. File checklist

| Item | File | Action |
|------|------|--------|
| useToast import | COIRequestDetail.vue | Import `useToast` from `@/composables/useToast` at top; use in all handlers |
| Approve toasts + use nextStatus | COIRequestDetail.vue | Add success/error toasts; use response.data.nextStatus or request.status; consistent error handling |
| Reject toast | COIRequestDetail.vue | Add success/error toasts in rejectRequestWithType; consistent error handling |
| Request more info toast | COIRequestDetail.vue | Add success/error toasts in requestMoreInfo; consistent error handling |
| Reject modal wording | COIRequestDetail.vue | Add clear, user-friendly line: "The requester will be notified of this rejection." above buttons |
| useToast import | CodeGenerationModal.vue | Import `useToast` from `@/composables/useToast` at top |
| Engagement code toast | CodeGenerationModal.vue | Add toast.success on success with generated code |
| Approve response | coiController.js | Add nextStatus to res.json in approveRequest |
| Notify previous approvers | coiController.js | Call new helper after existing approve notifications |
| New notification helper | notificationService.js | Implement and export notifyPreviousApproversOfProgress (Option A) |
| Engagement code notification | coiController.js / notificationService.js | Verify sendEngagementCodeNotification called after transaction with correct requestId and code |

---

## 7. Recommended amendments (implementation notes)

These amendments keep the plan robust and implementation consistent:

1. **Consistent import statements:** In every file that shows toasts, import the toast composable at the top: `import { useToast } from '@/composables/useToast'`, and use it (e.g. `const { toast } = useToast()`) so success and error toasts behave the same way.
2. **Consistent error handling:** For each action (approve, reject, request more info), use the same pattern: on success run the API call and `loadRequest()`, then show a success toast; in the catch block show `toast.error(error.response?.data?.error || 'Fallback message')`. Do not mix patterns (e.g. silent failure in one place and toast in another).
3. **Clear confirmation wording:** In the reject modal, add one short, user-friendly sentence above the buttons stating that the requester will be notified (e.g. "The requester will be notified of this rejection.") so the confirmation is explicit.
4. **Verify engagement code notification:** During implementation or review, confirm that `sendEngagementCodeNotification` is invoked after the transaction that writes the code and updates status, and that it receives the correct `requestId` and `code` (no stale or wrong values).
