---
name: security-compliance-production
description: Security and compliance checks for the COI system: data segregation, audit trail, input validation, and production hardening. Use when touching auth, roles, sensitive data, or compliance workflows.
---

# Security & Compliance (Production)

## When to Use

- Implementing or changing role-based data access (Requester, Director, Compliance, Partner, Finance, Admin)
- Handling commercial vs non-commercial data (Compliance must not see financial_parameters, engagement_code, total_fees)
- Adding audit logging, approval/rejection trails, or compliance decisions
- Input validation, sanitization, or file upload checks
- Preparing for production security review

## COI Rules

- **Rule:** Follow `.cursor/rules/security-compliance.mdc` for data segregation and commercial data exclusion
- **IESBA:** Document independence threats; track conflict resolutions; maintain compliance decision logs

## Checklist

- **Data segregation:** Filter by role and department; exclude commercial data for Compliance
- **Response mapper:** All endpoints returning COI request data use `mapResponseForRole()` — never ad-hoc `delete` statements. Audit all callers of `getFilteredRequests`
- **Input:** Validate and sanitize; use parameterized queries; validate file type/size
- **Audit:** Log approval/rejection, status changes, and compliance-related actions
- **Auth:** Enforce auth on all COI/admin routes; check role before sensitive operations
- **Auth pattern:** Use `req.userId` / `req.userRole` (NOT `req.user.id` / `req.user.role` — `req.user` is never set by auth middleware)
- **Secrets:** No credentials in code; use env or Azure Key Vault. JWT_SECRET must be validated at startup in production (no fallback to `'prototype-secret'`)
- **Passwords:** Always hash with bcryptjs (minimum 10 salt rounds). Never store plaintext, even in seed data

## Verification

- Every sensitive route checks auth and role
- Response shape differs by role where required (e.g. Compliance response without financial fields)
- Audit records are written for state-changing compliance actions
- No `req.user.id` or `req.user.role` usage anywhere — always `req.userId` / `req.userRole`
- Response mapper applied to all data-returning endpoints (list, dashboard, My Day/Week/Month)
