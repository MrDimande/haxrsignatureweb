# HAXR portal client-auth foundation

This migration adds the private HAXR-owned identity model for `/app` in Neon PostgreSQL.

## Data preservation

It is additive. It does not alter `public.profiles`, `client_events`, `event_members`, operational events, or any existing UUID. It creates at most one `portal_accounts` row for each existing profile.

Because the local environment contains no verified, non-secret legacy identity metadata, the bootstrap deliberately creates each existing account as `PENDING_IDENTITY_RESOLUTION` with no email or credential. This is the explicit safe state; it is not a fabricated mapping.

When a one-time, reviewed legacy metadata extract supplies a confirmed profile-to-email mapping, an operator may update only that account to `PENDING_ACTIVATION`, issue one hashed activation token through the application service, and deliver it through the existing Resend integration. Password hashes, sessions, refresh tokens, access tokens, and MFA material are never imported.

## Rollback

The safe operational rollback is application-level: retain these tables and set the deployment back to the last approved Preview build. Do not drop the new identity tables as an incident response, because that would destroy the auditability of activation/session state. Any schema removal requires a separately authorised, reviewed migration after Preview evidence is retained.
