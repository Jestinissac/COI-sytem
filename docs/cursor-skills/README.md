# Cursor Skills — Project Copy

This folder holds **copies** of all Cursor skill `.md` files for the Envision PRMS project. Use it as a single reference location for skills content.

- **Canonical location (used by Cursor):** `.cursor/skills/<skill-name>/SKILL.md`
- **This copy:** `docs/cursor-skills/<skill-name>.md`

When you add or change a skill, update both:
1. `.cursor/skills/<skill-name>/SKILL.md` (so Cursor uses it)
2. `docs/cursor-skills/<skill-name>.md` (so the project has a copy)

## How to use skills for prototype finalization and handover

See **[HOW_TO_USE_SKILLS.md](HOW_TO_USE_SKILLS.md)** for:
- Recommended order of skills to finalize the prototype and ensure production handover success
- When to invoke each skill
- Quick checklist: “Is the prototype ready for handover?”

Start with the **production-handover-readiness** skill to get the full checklist and which other skills to run.

**Compiled list of changes:** See **[COMPILED_CHANGES_TO_MAKE.md](COMPILED_CHANGES_TO_MAKE.md)** for a single ordered checklist of all changes to implement (P0 → P1 → P2 → P3), merged from the issues list and CTO/CIO review.

## Skills index

| File | Description |
|------|-------------|
| [production-handover-readiness.md](production-handover-readiness.md) | **Start here.** Prototype finalization + handover success; ties all skills together |
| [code-review.md](code-review.md) | **Use after every change.** Systematic code review: auth, security, data segregation, readability, business logic |
| [human-like-code.md](human-like-code.md) | **Use when writing code.** Naming, structure, comments, error messages, no robot artifacts |
| [build-verification.md](build-verification.md) | User journeys, business logic, business goals, Dieter Rams UI/UX |
| [business-consultant-partner.md](business-consultant-partner.md) | Partner-level Audit, Tax, Consulting; COI business rules, conflict matrix |
| [cio-cto-solution-alignment.md](cio-cto-solution-alignment.md) | Requirements vs solution; traceability; sign-off readiness |
| [documentation-coi.md](documentation-coi.md) | COI docs, handover, API, runbooks |
| [hrms-prms-integration.md](hrms-prms-integration.md) | HRMS/PRMS adapters, COI overrides, engagement codes, parent company workflow |
| [security-compliance-production.md](security-compliance-production.md) | Data segregation, audit, IESBA, production security, response mapper, secrets validation |
| [sql-server-production.md](sql-server-production.md) | SQL Server schema, migrations, COI database |
| [sso-ad-authentication.md](sso-ad-authentication.md) | SSO, Azure AD, AD-based permissions |
| [ui-ux-coi.md](ui-ux-coi.md) | COI UI/UX, forms, accessibility, human-like copy |
| [vue-coi-frontend.md](vue-coi-frontend.md) | Vue 3, TypeScript, COI frontend patterns |
