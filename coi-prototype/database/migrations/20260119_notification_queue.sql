-- Migration: Notification Queue for Batching
-- Date: 2026-01-19
-- Purpose: Enable notification batching to reduce noise

-- Notification queue table for batching
CREATE TABLE IF NOT EXISTS notification_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_id INTEGER NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  is_urgent BOOLEAN DEFAULT 0,
  payload TEXT NOT NULL,
  batch_id VARCHAR(50),
  sent BOOLEAN DEFAULT 0,
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_id) REFERENCES users(id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_notif_queue_recipient ON notification_queue(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notif_queue_sent ON notification_queue(sent);
CREATE INDEX IF NOT EXISTS idx_notif_queue_batch ON notification_queue(batch_id);
CREATE INDEX IF NOT EXISTS idx_notif_queue_created ON notification_queue(created_at);

-- Notification stats table for tracking noise reduction
CREATE TABLE IF NOT EXISTS notification_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stat_date DATE NOT NULL,
  total_generated INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  urgent_sent INTEGER DEFAULT 0,
  batched_count INTEGER DEFAULT 0,
  digest_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stat_date)
);

CREATE INDEX IF NOT EXISTS idx_notif_stats_date ON notification_stats(stat_date);
