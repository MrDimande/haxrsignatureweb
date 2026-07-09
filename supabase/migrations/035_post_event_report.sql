-- Relatório pós-evento automático (cron + email PDF)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS post_event_report_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_events_post_event_report_pending
  ON events (date)
  WHERE post_event_report_sent_at IS NULL AND date IS NOT NULL;
