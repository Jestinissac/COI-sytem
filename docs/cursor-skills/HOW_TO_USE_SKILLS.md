# How to Use Skills — Prototype Finalization & Production Handover Success

This guide explains how to use Cursor skills so the **prototype build is finalized against required targets** and **production handover is successful**.

---

## Goal

1. **Finalize the prototype** — All required targets (user journeys, business rules, design, docs) are met and verified.
2. **Successful handover** — Handover document is current, deliverables and next steps are clear, and sign-off is achievable.

---

## Recommended Order (Handover Readiness Flow)

| Step | Skill or Agent | What it does |
|------|----------------|--------------|
| **1** | **production-handover-readiness** | Run first. Gives the full checklist and tells you which other skills to invoke. Confirms prototype finalization + handover success criteria. |
| **2** | **build-verification** | User journeys, business logic, business goals, Dieter Rams UI/UX (including no AI emojis/filler). |
| **3** | **business-consultant-partner** | Audit/Tax/Consulting practice alignment; service types, conflict matrix, approval chain, commercial data. |
| **4** | **cio-cto-solution-alignment** | Requirements vs solution; traceability; gaps and production readiness. |
| **5** | **documentation-coi** + **prototype-handoff-sync** agent | Handover doc and related docs up to date; prototype vs production explicit. |
| **6** | **Domain skills** (as needed) | When touching a specific area: security, DB, auth, integrations, UI. |

---

## When to Invoke Each Skill

| Skill | Invoke when |
|-------|-------------|
| **code-review** | **After every code change, before committing.** Systematic review: auth, security, data segregation, readability, business logic, cleanup. Outputs P0-P3 findings. |
| **human-like-code** | **When writing new code or refactoring.** Ensures naming, structure, comments, and error messages read like experienced human-written code. No robot artifacts. |
| **production-handover-readiness** | Preparing for handover; running a full readiness check; after major prototype changes to confirm targets still met. |
| **build-verification** | Reviewing code changes; testing features; validating user journeys and business rules; checking design compliance. |
| **business-consultant-partner** | Validating COI business rules, service types, conflict matrix, approval workflow, or commercial-data handling from a practice perspective. |
| **cio-cto-solution-alignment** | Comparing requirements to solution; checking traceability; assessing sign-off readiness; reviewing technical risk and production path. |
| **documentation-coi** | Creating or updating handover docs, API docs, runbooks, or architecture specs. |
| **prototype-handoff-sync** (agent) | After schema, API, integration, or feature changes — to update the handover document so it stays aligned with the build. |
| **security-compliance-production** | Changing auth, roles, data access, audit, or compliance workflows. Now includes response mapper, secrets validation, and auth pattern checks. |
| **sql-server-production** | Writing or changing SQL Server DDL, migrations, or COI database code. |
| **sso-ad-authentication** | Adding or changing SSO, AD, or role mapping. |
| **hrms-prms-integration** | Changing PRMS/HRMS adapters, engagement codes, COI overrides, or parent company update workflow. |
| **ui-ux-coi** | Designing or changing COI screens, forms, or user flows; ensuring human-like copy and accessibility. |
| **vue-coi-frontend** | Editing Vue components, views, or frontend logic in the COI prototype. |

---

## Quick Checklist: “Is the prototype ready for handover?”

Use **production-handover-readiness** for the full list. Summary:

- [ ] **User journeys** — All 5 role journeys (Requester → Director → Compliance → Partner → Finance → Admin) work end-to-end (use build-verification).
- [ ] **Business rules** — No engagement without COI approval; duplication detection; approval workflow; department segregation; engagement code format (use build-verification).
- [ ] **Design** — Dieter Rams compliant; no AI emojis or filler copy (use build-verification, ui-ux-coi).
- [ ] **Business alignment** — Service types and conflict rules match practice (use business-consultant-partner).
- [ ] **Requirements met** — Handover and user journey requirements have implementation; gaps documented (use cio-cto-solution-alignment).
- [ ] **Handover doc current** — Schema, API, integrations, and “Latest Prototype Updates” match the build (use prototype-handoff-sync + documentation-coi).
- [ ] **Deliverables & next steps** — Section 16 and Section 18 of handover doc are actionable; production testing (Section 13) and sign-off (Section 19) are clear.

---

## Key Documents

- **Production handover (source of truth):** `coi-prototype/docs/production-handover/COI_Prototype_to_Production_Handover_with_Project_Brief.md`
  - Section 2 — Prototype success criteria
  - Section 5 — API contract (COI ↔ PRMS)
  - Section 13 — Testing & verification
  - Section 16 — Deliverables checklist
  - Section 18 — Next steps
  - Section 19 — Sign-off
- **Skills copy (this folder):** `docs/cursor-skills/` — All skill `.md` files and this guide.
- **Canonical skills (Cursor):** `.cursor/skills/<name>/SKILL.md`

---

## Summary

1. Start with **production-handover-readiness** to get the full checklist and skill sequence.
2. Run **build-verification**, **business-consultant-partner**, and **cio-cto-solution-alignment** to confirm prototype targets and requirements.
3. Keep the handover doc aligned with the build using **documentation-coi** and the **prototype-handoff-sync** agent.
4. Use **domain skills** when working in auth, DB, integrations, security, or UI.
5. Re-run the readiness flow after major changes or before formal handover to ensure nothing is missed.
