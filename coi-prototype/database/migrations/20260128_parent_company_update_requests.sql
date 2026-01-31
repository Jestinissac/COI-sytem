-- Migration: Parent company bidirectional sync (COI <-> PRMS)
-- Date: 2026-01-28
-- Purpose: PRMS often has parent as TBD; COI can capture first; updates to PRMS require PRMS admin approval

-- Optional text on clients (PRMS may send parent as text or "TBD")
ALTER TABLE clients ADD COLUMN parent_company VARCHAR(255);

-- Parent company update requests: COI-originated updates require PRMS admin approval
CREATE TABLE IF NOT EXISTS parent_company_update_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  client_code VARCHAR(50) NOT NULL,
  requested_parent_company VARCHAR(255),
  requested_parent_company_id INTEGER REFERENCES clients(id),
  source VARCHAR(50) DEFAULT 'COI',
  status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  coi_request_id INTEGER REFERENCES coi_requests(id),
  requested_by INTEGER NOT NULL REFERENCES users(id),
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at DATETIME,
  review_notes TEXT,
  prms_updated_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parent_company_update_client ON parent_company_update_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_parent_company_update_status ON parent_company_update_requests(status);
