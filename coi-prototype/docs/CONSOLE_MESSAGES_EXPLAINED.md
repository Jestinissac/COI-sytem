# Backend console messages explained

This document explains what you see in the terminal when running `npm run dev` (backend + frontend).

---

## 1. **500 on POST `/api/coi/requests/24/submit`**

**What it is:** The server returns "Internal Server Error" when you click Submit on a COI request.

**What to do:**
- In the **same terminal** where the backend is running, look for a line like:  
  `submitRequest error: <message>`  
  That message is the real cause (e.g. missing column, validation throw, DB constraint).
- The backend now logs this on every submit failure. Reproduce the submit, then check the terminal for `submitRequest error:` and use that to fix the bug or add validation.

**Typical causes:** Missing or invalid data for a required field, DB constraint (e.g. CHECK on `control_type`), or a thrown error inside group-structure/duplication/conflict checks.

---

## 2. **npm warn Unknown env config "devdir"**

**What it is:** An npm configuration warning (unrelated to your app code).

**Action:** Safe to ignore. It will go away when npm’s next major version changes this behavior.

---

## 3. **Schema error: cannot commit / no such table: main.workflow_config, form_versions, …**

**What it is:** During DB init, the app tries optional features (workflow config, form versions, rule execution log, etc.). Those tables don’t exist in the current schema.

**Action:** None. The app falls back to default behavior (e.g. "form_field_mappings table not found, using standard mappings only"). These are **informational**, not failures.

---

## 4. **✅ Created/Seeded/ensured…**

**What it is:** Normal database initialization and seeding (tables created, reference data inserted).

**Action:** None. Indicates startup is progressing correctly.

---

## 5. **📧 MOCK EMAIL SENT / [SLA Notification] / [SLA Monitor] CRITICAL | BREACHED**

**What it is:** On startup the backend runs an "initial monitoring check". It finds requests that are at or over SLA and "sends" mock emails (no real SMTP in dev). So you see many MOCK EMAIL SENT lines and CRITICAL/BREACHED messages.

**Action:** None for development. In production, real email would be sent and SLA alerts would be actionable.

---

## 6. **[ServiceTypes] / [CMA Mapping] No mapping found for service: "…"**

**What it is:** Debug-style logs from service-type and CMA (Chartered Accountants) mapping. Many catalog services don’t have a CMA code mapping yet, so "No mapping found" is logged for each.

**Action:** Optional: reduce log level for these in development, or add mappings for services that need a CMA code. Not the cause of the submit 500.

---

## 7. **form_field_mappings table not found, using standard mappings only**  
**form_versions table not found, using default version 1**

**What it is:** Optional tables are missing; the app uses built-in defaults for field mappings and form version.

**Action:** None. Behavior is correct with fallbacks.

---

## Summary

| Message type                         | Severity   | Action |
|-------------------------------------|------------|--------|
| 500 on submit                       | Error      | Check terminal for `submitRequest error:` and fix the reported cause. |
| npm devdir warning                  | Ignore     | None. |
| Schema error / no such table (optional) | Informational | None; fallbacks used. |
| ✅ Created/Seeded                   | Info       | None. |
| MOCK EMAIL / SLA Monitor            | Info       | None in dev. |
| [ServiceTypes] / [CMA Mapping]      | Debug      | Optional: reduce logging or add mappings. |
| form_field_mappings/versions not found | Informational | None; standard mappings/version used. |
