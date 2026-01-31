---
name: cio-cto-solution-alignment
description: CIO/CTO lens for a software development company: compare requirements to solution and verify they are met. Use when validating solution completeness, requirement traceability, or sign-off readiness.
---

# CIO / CTO Solution Alignment

## When to Use

- Comparing stated requirements (business, functional, non-functional) to the implemented solution
- Checking requirement traceability: each requirement has a corresponding implementation and test/acceptance
- Assessing sign-off readiness: solution meets requirements, gaps are documented, risks are known
- Reviewing architecture, integration, security, and scalability from an executive technical perspective
- Validating prototype vs production roadmap: what is done, what is deferred, what is at risk

## Perspective

- **Role:** CIO/CTO of the software development company (or client-side technical leadership)
- **Focus:** Requirements ↔ solution alignment; completeness; technical risk; delivery readiness
- **Output:** Clear view of whether requirements are met, what is missing, what is at risk, and what is needed for production

## What to Verify

- **Requirements coverage:** Each major requirement (from handover, user journeys, or spec) has a corresponding feature or behaviour in code/docs
- **Traceability:** Requirements → design → implementation → test/acceptance; gaps and "not implemented" called out explicitly
- **Non-functional:** Security, performance, accessibility, audit trail, and compliance are addressed where specified
- **Integration:** PRMS, HRMS, SSO/AD, and other integration points match contracts and are documented (mock vs production)
- **Production readiness:** Database (SQL Server), auth (SSO/AD), permissions, and deployment path are defined and consistent with requirements
- **Risks and gaps:** Missing features, technical debt, or deferred scope are listed with impact and mitigation

## Comparison Checklist

- **Requirements document / handover** (e.g. production handover, user journeys) ↔ **Current build** (prototype or production)
- **Business goals** (e.g. "inversing compliance", engagement code flow, department segregation) ↔ **Implemented behaviour**
- **Integration contracts** (PRMS, HRMS, SSO) ↔ **Adapter design and docs**
- **Security and compliance** (data segregation, IESBA, audit) ↔ **Code and configuration**

## Key References (Project)

- **Production handover:** `coi-prototype/docs/production-handover/COI_Prototype_to_Production_Handover_with_Project_Brief.md`
- **Prototype handoff guide:** `COI System /Prototype_vs_Production_Handoff_Guide.md` (if in use)
- **Build verification:** Use `.cursor/skills/build-verification/SKILL.md` for user journey and business logic checks

## Remember

- Answer in terms of "requirements met / not met / partially met" with evidence (code, config, docs)
- Call out gaps, risks, and deferred scope explicitly; avoid vague statements
- Distinguish prototype (current state) vs production (target state) when comparing to requirements
