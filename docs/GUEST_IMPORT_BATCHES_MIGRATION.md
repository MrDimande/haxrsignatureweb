-- Guest import batches + bulk soft-archive (PRIORITY 3+4)
--
-- Migration: supabase/migrations/20260716165701_guest_import_batches.sql
-- Rollback:  supabase/migrations/20260716165701_guest_import_batches.down.sql
--
## Apply policy (fail-closed)

- Apply first on **clone/staging only**.
- Migrations must **NOT** be applied to Production without explicit authorization.
- No GO was requested for Production in this PR.

## Compatibility

- `guests.import_batch_id` is nullable â€” existing guests without a batch remain valid.
- Soft archive / soft delete are the default destructive paths; hard delete is blocked when RSVP, seat, check-in or invite-sent protections apply.
- RLS enabled on new tables with deny-by-default for Data API; admin uses service_role.


## Rollback file location

O ficheiro de rollback vive em supabase/rollbacks/ (não em migrations/), para o CLI nunca o aplicar como migration up.

