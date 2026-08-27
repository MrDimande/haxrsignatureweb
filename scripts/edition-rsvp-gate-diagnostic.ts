import {
  evaluateEditionRsvpWriteGate,
  resolveEditionRsvpWriteMode,
} from "@/lib/edition/rsvp/write-gate";
import {
  getEditionRsvpPersistenceBackend,
  isEditionRsvpPersistenceConfigured,
} from "@/lib/edition/rsvp/persist.repository";
import { getEditionEventBinding } from "@/lib/edition/registry";

const MIGRATION_BRANCH = "migration/supabase-to-neon";
const slugs = [
  "jessicakulaya",
  "cha-de-lingerie",
  "cha-de-panela",
  "jessicachadelingerie",
];

if (
  process.env.VERCEL_ENV === "preview" &&
  process.env.VERCEL_GIT_COMMIT_REF === MIGRATION_BRANCH
) {
  const mode = resolveEditionRsvpWriteMode();
  const decision = evaluateEditionRsvpWriteGate();
  const configuredBindings = slugs.filter((slug) => Boolean(getEditionEventBinding(slug))).length;

  console.info(
    "[edition-rsvp-gate-diagnostic]",
    JSON.stringify({
      backend: getEditionRsvpPersistenceBackend(),
      persistenceConfigured: isEditionRsvpPersistenceConfigured(),
      writeMode: mode,
      allowed: decision.allowed,
      reason: decision.allowed ? null : decision.reason,
      configuredBindings,
    }),
  );
}
