# Neon shadow foundation validation

Validated on 2026-08-25 for the `migration/supabase-to-neon` branch.

This checkpoint records that the Neon `production` shadow now contains the validated foundation required by the current migration canaries:

- `businesses`
- `business_bank_accounts`
- `business_mobile_payments`
- `clients`
- supporting enum types
- `set_updated_at` trigger function
- RLS enabled and authenticated grants matching the validated migration branch

Data and structural signatures were verified against the validated Neon migration branch before this checkpoint was committed.

This file is documentation only and intentionally changes no application runtime behaviour.
