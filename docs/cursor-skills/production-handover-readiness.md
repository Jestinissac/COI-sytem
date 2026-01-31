---
name: production-handover-readiness
description: Finalizes the prototype build against required targets and ensures production handover success. Use when preparing for handover, running a handover checklist, or verifying prototype vs handover alignment.
---

# Production Handover Readiness

## When to Use

- Finalizing the prototype build against required targets before handover
- Running a handover readiness checklist (prototype complete, docs aligned, production path clear)
- Verifying that prototype success criteria (handover Section 2) are met and documented
- Ensuring handover document and deliverables checklist (Section 16) align with the build
- Preparing for sign-off (Section 19) by confirming all verification steps are complete

## Role

- **Focus:** Prototype finalization + handover success (one place that ties all skills together)
- **Output:** Clear go/no-go: prototype meets targets, handover doc is current, gaps and next steps listed

## Prototype Finalization Checklist

Before handover, confirm:

1. **Build verification** — Use **build-verification** skill:
   - User journeys complete and functional (Requester, Director, Compliance, Partner, Finance, Admin)
   - Business rules enforced (no engagement without COI approval, duplication detection, approval workflow, department segregation, engagement code format)
   - Dieter Rams design compliance; no AI-generated emojis or filler copy

2. **Business alignment** — Use **business-consultant-partner** skill:
   - Service types (Audit, Tax, Consulting) and conflict matrix match practice
   - Approval chain and commercial-data handling correct for partner-level expectations

3. **Requirements vs solution** — Use **cio-cto-solution-alignment** skill:
   - Requirements from handover and user journeys have corresponding implementation
   - Gaps, risks, and deferred scope documented; production readiness (DB, auth, integrations) defined

4. **Documentation and handover doc** — Use **documentation-coi** skill and **prototype-handoff-sync** agent:
   - Handover document is up to date with latest prototype (schema, API, integrations, features)
   - Latest Prototype Updates section reflects current build; production notes are clear

5. **Domain verification** (as needed):
   - **security-compliance-production:** Data segregation, audit, IESBA, auth on sensitive routes
   - **sql-server-production:** Migration path and key objects documented (Section 6 handover)
   - **sso-ad-authentication:** SSO/AD and role mapping documented; prototype vs production noted
   - **hrms-prms-integration:** PRMS/HRMS contracts and COI overrides documented (Section 5, 7)
   - **ui-ux-coi** / **vue-coi-frontend:** No AI artifacts; human-like copy; accessibility and patterns consistent

## Handover Success Criteria

- **Prototype success criteria (handover Section 2.2)** — All listed items met and evidenced (e.g. build verification, test reports)
- **Handover document** — Aligned with current build; prototype vs production differences explicit
- **Deliverables checklist (Section 16)** — Items that are prototype-done vs production-todo are clear; API contract (Section 5) and next steps (Section 18) actionable
- **Production testing required (Section 13)** — Checklist available; integration, outbox, governance, infra, scale tests scoped
- **Sign-off (Section 19)** — Roles and next steps clear; no open P0/P1 blockers for handover acceptance

## How to Use Other Skills in Sequence

1. **production-handover-readiness** (this skill) — Run first to get the full checklist and which skills to invoke
2. **build-verification** — Verify user journeys, business logic, design compliance
3. **business-consultant-partner** — Verify business and practice alignment
4. **cio-cto-solution-alignment** — Verify requirements met, traceability, production readiness
5. **documentation-coi** + **prototype-handoff-sync** agent — Ensure handover doc and related docs are current
6. **Domain skills** — Invoke when touching auth, DB, integrations, security, or UI (see list above)

See **docs/cursor-skills/HOW_TO_USE_SKILLS.md** for a full usage guide.

## Key References

- **Production handover:** `coi-prototype/docs/production-handover/COI_Prototype_to_Production_Handover_with_Project_Brief.md`
  - Section 2: Prototype Delivery Summary & Success Criteria
  - Section 13: Testing & Verification
  - Section 16: Deliverables Checklist
  - Section 18: Next Steps
  - Section 19: Sign-off
- **Prototype handoff sync:** Use prototype-handoff-sync agent to keep handover doc aligned with codebase

## Remember

- This skill does not replace the others; it defines the order and checklist so nothing is missed
- If any step fails, document the gap and either fix before handover or capture as a known limitation with owner and target date
- Handover success = prototype targets met + handover doc current + production path and sign-off clear
