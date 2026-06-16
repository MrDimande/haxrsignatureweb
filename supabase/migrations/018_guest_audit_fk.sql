-- Corrigir histórico: manter audit quando convidado é eliminado ou fundido
-- Idempotente

ALTER TABLE guest_audit_log
  ALTER COLUMN guest_id DROP NOT NULL;

ALTER TABLE guest_audit_log
  DROP CONSTRAINT IF EXISTS guest_audit_log_guest_id_fkey;

ALTER TABLE guest_audit_log
  ADD CONSTRAINT guest_audit_log_guest_id_fkey
  FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE SET NULL;
