-- Migration: Countries Master Data 2026-01-15
-- Adds countries table for international operations

CREATE TABLE IF NOT EXISTS countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country_code VARCHAR(3) UNIQUE NOT NULL, -- ISO 3166-1 alpha-3 (e.g., KWT, USA, GBR)
    country_name VARCHAR(255) NOT NULL,
    country_name_ar VARCHAR(255), -- Arabic name for Kuwait context
    iso_alpha_2 VARCHAR(2), -- ISO 3166-1 alpha-2 (e.g., KW, US, GB)
    region VARCHAR(100), -- e.g., Middle East, Europe, Asia
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(country_code);
CREATE INDEX IF NOT EXISTS idx_countries_active ON countries(is_active);
