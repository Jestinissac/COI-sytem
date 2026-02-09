# Approval workflow: “Next approver has a comment” – options and stakeholder plan

## Your choices (confirmed)

| Decision | Choice |
|----------|--------|
| Who receives the comment? | **Both optional**: current approver chooses either “Return to requester” OR “Send comment to previous approver”. |
| Where does the request go? | **Configurable per action**: e.g. “Need More Info” → requester (Draft); “Comment to previous approver” → previous approver’s queue. |
| Which roles get the option? | **All approvers**: Director, Compliance, Partner, Finance. |

---

## Recommendation: what the previous approver can do (4-eye and global practice)

**Question:** When the previous approver receives a comment from the next approver, what should they be able to do?

**Recommendation (4-eye principle and common practice):**

1. **Primary: “Add reply and send back to current approver”**  
   - Previous approver sees the comment, adds a **reply note** (audit trail).  
   - Clicks **“Send back to [Current Approver]”**.  
   - Request returns to the **current approver’s queue** with the full thread (current approver’s comment + previous approver’s reply) visible.  
   - **Rationale:** Keeps sequential control, documents both sides, avoids ambiguity. Matches “document approver actions and add comments” (audit/compliance) and “return to the right step” (workflow clarity).

2. **Optional: “Revoke my approval”**  
   - For cases where the previous approver, after reading the comment, decides they need to **re-review** (e.g. they change their view).  
   - Request goes back to **that approver’s step** (e.g. “Pending Director Approval” again) for full re-approval; then continues down the chain.  
   - **Rationale:** Aligns with 4-eye “Reopen” / control mechanisms and governance tools that allow a step to be revisited when questioned.

**Suggested default for first release:** Implement **(1) only** (reply + send back to current approver). Add **(2) “Revoke my approval”** as a follow-up once (1) is in use and stakeholders confirm the need.

**Stakeholder confirmation:** Document with Compliance / process owner: “Previous approver can reply and send back; ‘Revoke my approval’ is deferred to Phase 2.”

---

## Best practices (from web research)

- **Return to requester** is the usual pattern for “need more info”: next approver asks for more info → back to requester → requester updates and resubmits → request re-enters the chain (often at the same step). Keeps one clear path and avoids ambiguity.  
- **Pass comments forward:** Store all comments (by stage/approver) so later approvers can see earlier ones; same applies for “comment to previous approver” – store reply and show in thread.  
- **Audit trail:** Every “Need More Info” and “Comment to previous approver” (and reply) should be stored with timestamp, approver, and content for compliance.  
- **Notifications:** Notify the person who must act (requester for “Need More Info”; previous approver for “Comment to previous approver”; current approver when previous approver sends back).  
- **Custom response options:** Treat “Need More Info” and “Comment to previous approver” as distinct actions with different routing and labels so approvers are not confused.

---

## Approval chain (reference)

```text
Requester (submit) → Director → Compliance → Partner → Finance → Admin (execute)
```

“Previous approver” is well-defined at each step (Director has no previous approver in-chain; for Director, “comment to previous approver” could be disabled or mean “notify requester only” – to be confirmed with stakeholders).

---

## Stakeholder back-and-forth (to plan right)

| Topic | Owner | Decision / question | Status |
|-------|--------|---------------------|--------|
| Director “comment to previous approver” | Process owner | No previous in-chain approver: disable option for Director, or treat as “notify requester” only? | TBD |
| “Revoke my approval” | Compliance / process owner | Phase 1 (reply + send back only) vs Phase 2 (add revoke)? | Recommended: Phase 2 |
| Where reply thread is stored | Tech | New table vs JSON on `coi_requests` vs reuse existing notes columns? | TBD |
| Email/notification copy | Compliance / comms | Exact wording for “Comment from [Role]” and “Previous approver replied”; no emojis. | TBD |
| UI labels | Product / UX | “Need More Info” vs “Return to requester”; “Comment to previous approver” vs “Ask [Previous Role]”; “Send back to [Current Approver]”. | TBD |

**Suggested next step:** Share this plan with process owner and Compliance; fill the “Status” column and then implement.

---

## Implementation outline (after stakeholder sign-off)

1. **Backend**
   - New action (e.g. `POST /coi/requests/:id/comment-to-previous-approver`) with body: `{ comments, previous_approver_role_or_id }`.
   - Define “previous approver” per current status (e.g. Pending Compliance → Director; Pending Partner → Compliance; Pending Finance → Partner; Director → no previous or requester).
   - New status or flag so request appears in **previous approver’s queue** (e.g. “Comment from Compliance” / “Pending Director response”) and not in current approver’s queue until previous approver responds.
   - Store comment thread (current approver comment + previous approver reply) in DB; expose in API for request detail and audit.
   - When previous approver submits “Send back to [Current Approver]”: update status back to current step (e.g. Pending Compliance), attach reply to thread, notify current approver.
   - Keep existing “Need More Info” as-is (return to Draft, notify requester).

2. **Frontend**
   - In approval panels (Director, Compliance, Partner, Finance): two actions where applicable – **“Need More Info”** (existing) and **“Comment to previous approver”** (new), with comment field.
   - “Comment to previous approver” disabled for Director (or mapped to “notify requester” if stakeholders choose that).
   - New view/state for **previous approver**: request in “Comment from [Next Role]” with thread visible, reply text area, and “Send back to [Current Approver]” button.
   - Notifications: requester for Need More Info; previous approver for new comment; current approver when previous approver sends back.

3. **Notifications**
   - Need More Info: existing `sendNeedMoreInfoNotification` (requester).
   - New: notify previous approver when “Comment to previous approver” is used.
   - New: notify current approver when previous approver sends back.

4. **Audit / compliance**
   - Log all actions (Need More Info, Comment to previous approver, Reply, Send back) with user, timestamp, and content in audit trail.

---

## Summary

- **Options:** Current approver can choose “Return to requester” (Need More Info) or “Send comment to previous approver”; routing is configurable per action; all four approver roles get the option (Director behaviour TBD).
- **4-eye recommendation:** Previous approver **replies and sends back to current approver** (Phase 1); optional **“Revoke my approval”** in a later phase after stakeholder confirmation.
- **Plan:** Use this doc to align with stakeholders, then implement backend (actions + status + thread storage), frontend (actions + previous-approver view), and notifications.
