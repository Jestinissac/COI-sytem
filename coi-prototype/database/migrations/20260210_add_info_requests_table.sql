-- B2: Need More Info history (idempotent)
CREATE TABLE IF NOT EXISTS info_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coi_request_id INTEGER NOT NULL,
  requested_by INTEGER NOT NULL,
  requested_by_role VARCHAR(50) NOT NULL,
  info_required TEXT NOT NULL,
  response TEXT,
  responded_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coi_request_id) REFERENCES coi_requests(id),
  FOREIGN KEY (requested_by) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_info_requests_coi_request_id ON info_requests(coi_request_id);
CREATE INDEX IF NOT EXISTS idx_info_requests_requested_by ON info_requests(requested_by);
