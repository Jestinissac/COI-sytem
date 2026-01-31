-- Migration: COI Form Goals Revision
-- Date: 2026-01-28
-- Purpose: Add global service fields and backup approver for Goals 1 and 3
-- Verified: coi_requests and users tables exist; columns do not exist

-- 1. Global line of service (Goal 1: Line of Service local + BDO Global)
ALTER TABLE coi_requests ADD COLUMN global_service_category VARCHAR(50);
ALTER TABLE coi_requests ADD COLUMN global_service_type VARCHAR(100);

-- 2. Backup approver (Goal 3: select backup when primary is NA)
-- References users(id); applied when primary approver is unavailable
ALTER TABLE coi_requests ADD COLUMN backup_approver_id INTEGER REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_coi_requests_backup_approver ON coi_requests(backup_approver_id);

-- 3. Approver hierarchy (Goal 3: configurable order — lower number = first in chain)
ALTER TABLE users ADD COLUMN approval_order INTEGER;
