-- B8: Dynamic approval flow — workflow_stages table and default chain (idempotent)
CREATE TABLE IF NOT EXISTS workflow_stages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stage_order INTEGER NOT NULL,
  stage_name VARCHAR(100) NOT NULL,
  role_required VARCHAR(50) NOT NULL,
  status_name VARCHAR(100) UNIQUE NOT NULL,
  next_stage_id INTEGER NULL,
  is_active BOOLEAN DEFAULT 1,
  can_skip BOOLEAN DEFAULT 0,
  skip_condition TEXT NULL,
  is_required BOOLEAN DEFAULT 0,
  FOREIGN KEY (next_stage_id) REFERENCES workflow_stages(id)
);
CREATE INDEX IF NOT EXISTS idx_workflow_stages_stage_order ON workflow_stages(stage_order);
CREATE INDEX IF NOT EXISTS idx_workflow_stages_status_name ON workflow_stages(status_name);
CREATE INDEX IF NOT EXISTS idx_workflow_stages_role_required ON workflow_stages(role_required);

-- Seed default chain only when table is empty (insert with next_stage_id NULL, then link)
INSERT INTO workflow_stages (stage_order, stage_name, role_required, status_name, next_stage_id, is_active, is_required)
SELECT 1, 'Director', 'Director', 'Pending Director Approval', NULL, 1, 0
WHERE (SELECT COUNT(*) FROM workflow_stages) = 0;

INSERT INTO workflow_stages (stage_order, stage_name, role_required, status_name, next_stage_id, is_active, is_required)
SELECT 2, 'Compliance', 'Compliance', 'Pending Compliance', NULL, 1, 1
WHERE (SELECT COUNT(*) FROM workflow_stages) = 1;

INSERT INTO workflow_stages (stage_order, stage_name, role_required, status_name, next_stage_id, is_active, is_required)
SELECT 3, 'Partner', 'Partner', 'Pending Partner', NULL, 1, 0
WHERE (SELECT COUNT(*) FROM workflow_stages) = 2;

INSERT INTO workflow_stages (stage_order, stage_name, role_required, status_name, next_stage_id, is_active, is_required)
SELECT 4, 'Finance', 'Finance', 'Pending Finance', NULL, 1, 0
WHERE (SELECT COUNT(*) FROM workflow_stages) = 3;

-- Set next_stage_id so chain is Director(1) -> Compliance(2) -> Partner(3) -> Finance(4) -> NULL
UPDATE workflow_stages SET next_stage_id = (SELECT id FROM workflow_stages WHERE stage_order = 2) WHERE stage_order = 1 AND next_stage_id IS NULL;
UPDATE workflow_stages SET next_stage_id = (SELECT id FROM workflow_stages WHERE stage_order = 3) WHERE stage_order = 2 AND next_stage_id IS NULL;
UPDATE workflow_stages SET next_stage_id = (SELECT id FROM workflow_stages WHERE stage_order = 4) WHERE stage_order = 3 AND next_stage_id IS NULL;
