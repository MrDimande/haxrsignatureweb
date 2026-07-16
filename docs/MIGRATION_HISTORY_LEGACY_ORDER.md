# Migration history — legacy display-order mismatch

## Scope

Applies to Core Supabase migrations under `supabase/migrations/`.

Validated against Staging project ref `rncvrdaaucbheeqvoetu` (empty remote history rebuilt from versioned SQL).

Production (`oxsrdmydlqyvnueedgtl`) and legacy environments were **not** modified for this analysis.

## Finding

`supabase migration list --linked` can show a visual pairing mismatch for:

| Version | File |
|---------|------|
| `0281` | `0281_concierge_portal.sql` |
| `028` | `028_commercial_admin_v2.sql` |

Lexicographic filename order places `0281_*` **before** `028_*` because the string `"0281"` sorts before `"028_"` after the common prefix `"028"`.

That affects **display pairing**, not the set of applied versions.

## Semantic alignment (set comparison)

Do **not** trust only the visual layout of `migration list`.

Compare version **sets**:

1. Local: prefix before the first `_` of each `supabase/migrations/*.sql` up migration (exclude `*.down.sql`, `supabase/rollbacks/`, and non-migration helpers).
2. Remote: `select version from supabase_migrations.schema_migrations order by version;` (read-only).

Staging validation (2026-07-17):

| Check | Result |
|-------|--------|
| Local version count | 47 |
| Remote version count | 47 |
| Intersection | 47 |
| `localOnly` | `[]` |
| `remoteOnly` | `[]` |
| `028` local | true |
| `028` remote | true |
| `0281` local | true |
| `0281` remote | true |
| `migrationVersionSetAligned` | **true** |

Classification: **legacy display-order mismatch** (case A). Not a missing or extra migration.

## What was **not** done

- No `supabase migration repair`
- No rename of legacy files `028_*` / `0281_*` (already applied; renaming would create false drift)
- No Production migration apply

## Evidence that the schema is coherent

On the empty Staging database:

1. Full `db push` of `001`–`044` + `20260716165701` succeeded
2. Campaign + import schemas were present after apply
3. Rollback rehearsal of PR structures succeeded with baseline preserved
4. Reapplication of PR migrations succeeded
5. Synthetic smoke after reapply succeeded; final synthetic residue was `0`

## Rules for new migrations

1. **Legacy files are immutable.** Do not rename or reorder `001`–`044`, `0281`, `0301`, `0302`, or other already-shipped short versions.
2. **New migrations must use a full UTC timestamp version**, e.g. `20260717123000_description.sql`.
3. Reject new short names such as `045_...sql` or `046_...sql` (enforce via `scripts/check-migration-version-set.mjs`).
4. Keep rollback SQL under `supabase/rollbacks/` (never as `*.down.sql` inside `migrations/`).
5. Only consider `migration repair` when `localOnly` or `remoteOnly` is non-empty **and** a human GO authorizes a proven reconciliation plan.

## CI

Local (no credentials required):

```bash
node scripts/check-migration-version-set.mjs
```
