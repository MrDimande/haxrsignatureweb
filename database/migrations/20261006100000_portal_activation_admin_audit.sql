-- Allow the existing sanitised admin audit log to record Portal activation
-- dispatches without creating a parallel audit facility.
BEGIN;

ALTER TABLE public.admin_user_audit_log
  DROP CONSTRAINT IF EXISTS admin_user_audit_log_action_check;

ALTER TABLE public.admin_user_audit_log
  ADD CONSTRAINT admin_user_audit_log_action_check CHECK (
    action IN (
      'bootstrap',
      'identity_migrated',
      'login',
      'login_success',
      'login_failed',
      'password_set',
      'password_changed',
      'password_reset_requested',
      'password_reset_completed',
      'user_invited',
      'invite_reissued',
      'invite_accepted',
      'role_updated',
      'role_changed',
      'permission_changed',
      'status_updated',
      'user_suspended',
      'user_reactivated',
      'session_revoked',
      'all_sessions_revoked',
      'portal_activation_sent'
    )
  );

COMMIT;
