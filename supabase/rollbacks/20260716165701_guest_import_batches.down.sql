-- Rollback for 20260716165701_guest_import_batches.sql
-- Preview/clone only — never run against Production without explicit GO.
-- Order: drop audit → drop guest columns → drop batch table/type.

DROP INDEX IF EXISTS idx_guest_bulk_audit_batch;
DROP INDEX IF EXISTS idx_guest_bulk_audit_event;
DROP TABLE IF EXISTS guest_bulk_audit;

DROP INDEX IF EXISTS idx_guests_event_incorrect;
DROP INDEX IF EXISTS idx_guests_event_archived;
DROP INDEX IF EXISTS idx_guests_event_active;
DROP INDEX IF EXISTS idx_guests_event_import_batch;

ALTER TABLE guests
  DROP COLUMN IF EXISTS invite_sent_at,
  DROP COLUMN IF EXISTS deleted_at,
  DROP COLUMN IF EXISTS is_incorrect,
  DROP COLUMN IF EXISTS archive_reason,
  DROP COLUMN IF EXISTS archived_at,
  DROP COLUMN IF EXISTS import_batch_id;

DROP TRIGGER IF EXISTS guest_import_batches_updated_at ON guest_import_batches;
DROP FUNCTION IF EXISTS set_guest_import_batches_updated_at();

DROP INDEX IF EXISTS idx_guest_import_batches_status;
DROP INDEX IF EXISTS idx_guest_import_batches_event;
DROP TABLE IF EXISTS guest_import_batches;

DROP TYPE IF EXISTS guest_import_batch_status;
