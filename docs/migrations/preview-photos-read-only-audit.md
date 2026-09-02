# Photo metadata and source Storage reconciliation

Approved scope: commit/push the safety corrections, configure the non-secret bucket binding for the migration branch's Preview, and execute the read-only audit through its branch-locked build hook. No database schema/row writes, Storage writes, blob copy, merge or Production deployment are authorized.

## Why this replaces the previous command

The latest observed Preview contained 147 `wedding_photos` rows, but the permanent build gates only checked gifts and Edition events. The old `apply-preview-photos.mjs` printed a schema-success message after a row count, used legacy `.env.local` credentials and unsafe endpoint/TLS checks. That entrypoint now always refuses execution. It does not read environment files or connect to services.

`scripts/audit-preview-photos.mjs` is a separate read-only auditor. `scripts/run-production-build.mjs` runs it only for the exact migration Preview, after the existing Edition/gift checks and before the application build. A blocked audit stops that Preview build. Existing Edition/gift checks are unchanged; no write hook is enabled.

## Required execution context

- Actual Vercel `preview`, branch `migration/supabase-to-neon`.
- Exact recorded Neon endpoint and database `neondb`, with certificate validation enabled.
- Dedicated `GATE_2C_SOURCE_SUPABASE_URL` and revocable `GATE_2C_SOURCE_SUPABASE_SECRET_KEY` bindings for the pinned source project. No legacy service-role or `.env.local` fallback.
- Explicit non-secret `GATE_2C_SOURCE_PHOTOS_BUCKET=wedding-photos` binding.
- Existing `DATABASE_URL_UNPOOLED` or `DATABASE_URL`; connection options that could override TLS or session settings are rejected.

Do not export/copy credentials into commands, pull a broad Vercel environment, or fake Preview markers in a local shell. The approved execution path is the genuine branch-specific Vercel Preview build, using its existing dedicated secret bindings.

The build hook runs:

```sh
node scripts/audit-preview-photos.mjs
```

No arguments or write-confirmation flags are accepted. The original 147-row checksum is a **recorded expectation**, not proof that the current source or target matches it. Drift blocks the audit and must not be resolved by silently updating the expectation.

## Checks and boundaries

1. Validate all environment/endpoint gates before constructing clients. Source HTTP permits only GET/HEAD to the approved photo table, bucket and object-info endpoints; redirects are rejected.
2. Read a bounded source snapshot, checking the exact server count (including records beyond the API response limit), column shape, identities and the recorded checksum.
3. In a bounded `REPEATABLE READ READ ONLY` Neon transaction, verify the actual read-only setting, SELECT visibility, required columns, ID uniqueness, RLS state and declared foreign-key references. Compare complete source/target row checksums while preserving timestamp microseconds and treating non-timestamp text literally; report missing/extra/divergent counts. The legacy recorded baseline checksum is reported separately. Always roll back the read-only transaction and close the connection.
4. Only when metadata matches, inspect the explicitly selected source bucket and referenced objects via `getBucket` and `info`. Check bucket privacy, MIME allowlist, size limits, object identity, size and MIME against each row. No file bodies, signed URLs or broad object inventories are retrieved.
5. Emit only aggregate counts, checksums and booleans. Provider error text, credentials, record identities, guest names, captions and object paths are never logged.

`READ_ONLY_CHECKS_PASSED` describes only those checks. It does **not** certify source/target schema parity, application-level references not backed by FKs, all RLS policies/grants, binary content hashes, end-user access, a destination Storage provider, or Production readiness. These limitations remain explicit in the output. In particular, `storageCutoverReady` stays false.

No target Storage provider has been selected or approved here. Metadata agreement plus source object availability cannot establish that bytes were migrated to a new provider.

## Local validation

```sh
node --check scripts/audit-preview-photos.mjs
node --test scripts/audit-preview-photos.test.mjs scripts/gate-2c-gifts-photos-migration.test.mjs
npm test
```

Tests use in-memory service fixtures and never contact real databases or Storage. The build-wrapper tests simulate all process/file operations to verify branch isolation and failure handling. The normal project test command includes this safety suite. Remote reconciliation remains pending until the approved Preview run produces evidence.

Initial local preparation results recorded on 2026-09-02, before build-hook integration: 60/60 focused tests and 889/889 project tests passed; TypeScript (`--noEmit --incremental false`) reported no errors. Script ESLint passed cleanly; project lint passed with warnings in unchanged files. Syntax and diff whitespace checks passed. No application build, deployment or live reconciliation was run during that initial preparation, and no environment file was loaded by the auditor.

Approved build-hook integration on 2026-09-02: 62/62 focused tests and 891/891 project tests passed. The non-sensitive bucket binding was created only for `preview` on `migration/supabase-to-neon`. These local tests and configuration checks do not constitute a remote reconciliation result.

API references: [Supabase bucket metadata](https://supabase.com/docs/reference/javascript/file-buckets-getbucket), [Supabase object info](https://supabase.com/docs/reference/javascript/file-buckets-info), [node-postgres TLS settings](https://node-postgres.com/features/ssl), [PostgreSQL timestamp precision](https://www.postgresql.org/docs/current/datatype-datetime.html).
