---
name: sql-server-production
description: SQL Server schema, migrations, and production database patterns for the COI system. Use when writing or modifying SQL Server DDL, migrations, stored procedures, or COI database code.
---

# SQL Server Production

## When to Use

- Writing or editing SQL Server DDL (tables, indexes, constraints)
- Creating or modifying migrations for COI (engagement codes, outbox, reconciliation, cache tables)
- Implementing or changing stored procedures (e.g. `sp_GenerateEngagementCode`)
- Switching from SQLite (prototype) to SQL Server (production)

## COI Production Context

- **Handover reference:** `coi-prototype/docs/production-handover/COI_Prototype_to_Production_Handover_with_Project_Brief.md` (Section 6)
- **Key objects:** `engagement_code_sequences`, `engagement_codes`, `outbox`, `outbox_dead_letter`, `idempotency_keys`, `reconciliation_violations`, `employee_cache`, `user_group_cache`, `sync_status`
- **Engagement codes:** Thread-safe generation via stored procedure with `SERIALIZABLE` isolation; use `@@ROWCOUNT` and sequence table

## Schema Verification

- **Rule:** Follow `.cursor/rules/database-schema-verification.mdc` — verify table/column existence before writing queries
- **Migrations:** Verify target table exists; check column doesn't already exist; test on sample data when possible
- **SQLite vs SQL Server:** Types and syntax differ (e.g. `DATETIME2`, `NVARCHAR(MAX)`, `IDENTITY`); avoid SQLite-only constructs in production migrations

## Safety

- Prefer additive changes (new columns/tables/indexes) over destructive in a single release
- If dropping/renaming: document backup and rollback; consider multi-step migration
- Use parameterized queries only; never concatenate user input into SQL
