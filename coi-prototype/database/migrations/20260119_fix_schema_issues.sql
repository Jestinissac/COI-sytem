-- Migration: Fix Schema Issues
-- Date: 2026-01-19
-- Purpose: Add missing columns that are causing runtime errors

-- 1. Add monitoring_days_elapsed column to coi_requests
-- This column is used by monitoringService.js to track days since execution
ALTER TABLE coi_requests ADD COLUMN monitoring_days_elapsed INTEGER DEFAULT 0;

-- 2. Add prospect_code column to prospects table
-- This column is referenced in prospectClientCreationController.js
ALTER TABLE prospects ADD COLUMN prospect_code VARCHAR(50);

-- 3. Create index for prospect_code
CREATE INDEX IF NOT EXISTS idx_prospects_code ON prospects(prospect_code);

-- 4. Add interval_alerts_sent column for 30-day monitoring alerts
ALTER TABLE coi_requests ADD COLUMN interval_alerts_sent TEXT;

-- 5. Add renewal_notification_sent column for 3-year renewal alerts
ALTER TABLE coi_requests ADD COLUMN renewal_notification_sent TEXT;

-- 6. Add expiry_notification_sent column for engagement expiry alerts
ALTER TABLE coi_requests ADD COLUMN expiry_notification_sent TEXT;

-- 7. Add compliance_reminder_sent column for pending compliance reminders
ALTER TABLE coi_requests ADD COLUMN compliance_reminder_sent DATETIME;

-- 8. Add stale_notification_sent column for stale request notifications
ALTER TABLE coi_requests ADD COLUMN stale_notification_sent DATETIME;

-- 9. Generate prospect codes for existing prospects without codes
-- Format: PROS-YYYY-XXXX where XXXX is a sequential number
UPDATE prospects 
SET prospect_code = 'PROS-' || strftime('%Y', created_at) || '-' || printf('%04d', id)
WHERE prospect_code IS NULL;
