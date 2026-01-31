-- =====================================================
-- Rule Builder CMA Integration Migration
-- Date: 2026-01-26
-- Description: Adds applies_to_cma column to business_rules_config table
--              to support CMA-specific business rules
-- =====================================================

-- Add applies_to_cma column to business_rules_config table
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE
-- This will be handled in init.js with try-catch

ALTER TABLE business_rules_config 
ADD COLUMN applies_to_cma BOOLEAN DEFAULT 0;
