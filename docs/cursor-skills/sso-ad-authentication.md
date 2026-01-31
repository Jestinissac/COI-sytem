---
name: sso-ad-authentication
description: Implements and verifies SSO, Azure AD / Active Directory integration, and AD-based permissions for the COI system. Use when adding SSO, AD-based permissions, login flows, or role mapping from HRMS/AD groups.
---

# SSO & AD-Based Authentication

## When to Use

- Adding or changing SSO (single sign-on) for COI
- Integrating Azure AD or Active Directory for login
- Mapping AD/HRMS groups to COI roles (Director, Compliance, Partner, etc.)
- Implementing or changing JWT/session handling
- Securing routes with role-based access

## COI Production Context

- **Handover reference:** `coi-prototype/docs/production-handover/COI_Prototype_to_Production_Handover_with_Project_Brief.md`
- **Auth:** Production uses SSO / Active Directory via HRMS Adapter cache; no direct HRMS at request time
- **Role mapping:** HRMS User Groups → COI roles (COI_Directors → Director, COI_Compliance → Compliance, etc.)

## Implementation Notes

- **Prototype:** Mock JWT (any password). Replace with real SSO/AD in production.
- **Production:** Azure AD or LDAP via HRMS Adapter; user/role data synced to local cache (`employee_cache`, `user_group_cache`); JWT with secret from Azure Key Vault
- **Permissions:** Enforce role after auth; Compliance must not see commercial data (financial_parameters, engagement_code, total_fees)
- **Secrets:** Never hardcode; use env or Azure Key Vault

## Verification

- All sensitive routes require authentication
- Role checked before data access or state-changing actions
- Log auth failures and permission denials for audit
