import { randomUUID } from "node:crypto";
import { processEditionRsvpSubmission } from "@/lib/edition/rsvp/service";
import { evaluateEditionRsvpWriteGate } from "@/lib/edition/rsvp/write-gate";
import { closeNeonPoolForTests, neonQuery } from "@/lib/neon/server-db";

const MIGRATION_BRANCH = "migration/supabase-to-neon";
const TEST_SLUG = "jessicakulaya";

type CountRow = { count: string };
type GuestRow = {
  id: string;
  status: string;
  plus_ones: number;
  email: string | null;
  phone: string | null;
};

function isMigrationPreview(): boolean {
  return (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === MIGRATION_BRANCH
  );
}

async function count(sql: string, params: readonly unknown[]): Promise<number> {
  const result = await neonQuery<CountRow>(sql, params);
  return Number(result.rows[0]?.count ?? 0);
}

async function run(): Promise<void> {
  if (!isMigrationPreview()) {
    console.info("[edition-rsvp-neon-canary] skipped outside migration Preview");
    return;
  }
  if (!process.env.DATABASE_URL?.trim()) throw new Error("database_url_missing");

  const eventId = randomUUID();
  const suffix = eventId.slice(0, 8);
  const guestName = `Edition Neon Canary ${suffix}`;
  const firstEmail = `edition-neon-${suffix}@haxr.invalid`;
  const secondEmail = `edition-neon-updated-${suffix}@haxr.invalid`;
  const phone = "+258840000003";

  const previousBinding = process.env.EDITION_EVENT_JESSICA_KULAYA_ID;
  const previousNotifications = process.env.EDITION_RSVP_NOTIFICATIONS_ENABLED;
  process.env.EDITION_EVENT_JESSICA_KULAYA_ID = eventId;
  process.env.EDITION_RSVP_NOTIFICATIONS_ENABLED = "false";

  let primaryError: unknown = null;

  try {
    const gate = evaluateEditionRsvpWriteGate({ resolvedSlug: TEST_SLUG });
    if (!gate.allowed || gate.mode !== "preview_neon") {
      throw new Error(
        `preview_neon_gate_not_ready:${gate.allowed ? gate.mode : gate.reason}`,
      );
    }

    await neonQuery(
      `INSERT INTO public.events
        (id, business_id, name, type, date, location, notes, is_active)
       VALUES
        ($1::uuid, 'haxr-signature', $2, 'wedding', '2026-12-22'::date,
         'Maputo', 'edition-rsvp-neon-service-canary', true)`,
      [eventId, `Edition RSVP Neon Service Canary ${suffix}`],
    );

    const created = await processEditionRsvpSubmission({
      name: guestName,
      attending: true,
      guests: 3,
      slug: TEST_SLUG,
      email: firstEmail,
      phone,
      messageForBride: "Canário create",
      size: "M",
      dressCodeConfirmed: true,
    });
    if (
      created.status !== 200 ||
      !created.body.success ||
      !("persisted" in created.body) ||
      created.body.persisted !== true
    ) {
      throw new Error(`create_service_contract_failed:${created.status}`);
    }

    const firstGuestResult = await neonQuery<GuestRow>(
      `SELECT id::text, status::text, plus_ones, email, phone
       FROM public.guests
       WHERE event_id=$1::uuid AND name_normalized=lower($2)
       LIMIT 1`,
      [eventId, guestName],
    );
    const firstGuest = firstGuestResult.rows[0];
    if (
      !firstGuest ||
      firstGuest.status !== "confirmed" ||
      firstGuest.plus_ones !== 2 ||
      firstGuest.email !== firstEmail ||
      firstGuest.phone !== phone
    ) {
      throw new Error("create_persistence_shape_failed");
    }

    const updated = await processEditionRsvpSubmission({
      name: guestName,
      attending: true,
      guests: 2,
      slug: TEST_SLUG,
      email: secondEmail,
      phone,
      messageForBride: "Canário update",
      size: "L",
      dressCodeConfirmed: false,
    });
    if (
      updated.status !== 200 ||
      !updated.body.success ||
      !("persisted" in updated.body) ||
      updated.body.persisted !== true
    ) {
      throw new Error(`update_service_contract_failed:${updated.status}`);
    }

    const updatedGuestResult = await neonQuery<GuestRow>(
      `SELECT id::text, status::text, plus_ones, email, phone
       FROM public.guests WHERE id=$1::uuid`,
      [firstGuest.id],
    );
    const updatedGuest = updatedGuestResult.rows[0];
    if (
      !updatedGuest ||
      updatedGuest.status !== "confirmed" ||
      updatedGuest.plus_ones !== 1 ||
      updatedGuest.email !== secondEmail ||
      updatedGuest.phone !== phone
    ) {
      throw new Error("update_persistence_shape_failed");
    }

    const declined = await processEditionRsvpSubmission({
      name: guestName,
      attending: false,
      guests: 0,
      slug: TEST_SLUG,
      email: secondEmail,
      phone,
      messageForBride: "Canário decline",
    });
    if (
      declined.status !== 200 ||
      !declined.body.success ||
      !("persisted" in declined.body) ||
      declined.body.persisted !== true
    ) {
      throw new Error(`decline_service_contract_failed:${declined.status}`);
    }

    const declinedGuestResult = await neonQuery<GuestRow>(
      `SELECT id::text, status::text, plus_ones, email, phone
       FROM public.guests WHERE id=$1::uuid`,
      [firstGuest.id],
    );
    const declinedGuest = declinedGuestResult.rows[0];
    if (
      !declinedGuest ||
      declinedGuest.status !== "declined" ||
      declinedGuest.plus_ones !== 0 ||
      declinedGuest.email !== secondEmail ||
      declinedGuest.phone !== phone
    ) {
      throw new Error("decline_persistence_shape_failed");
    }

    const guestCount = await count(
      `SELECT count(*)::text AS count FROM public.guests WHERE event_id=$1::uuid`,
      [eventId],
    );
    const auditCount = await count(
      `SELECT count(*)::text AS count FROM public.guest_audit_log WHERE event_id=$1::uuid`,
      [eventId],
    );
    const contactCount = await count(
      `SELECT count(*)::text AS count FROM public.event_contact_profiles
       WHERE event_id=$1::uuid AND source='edition_rsvp'`,
      [eventId],
    );

    if (guestCount !== 1 || auditCount !== 3 || contactCount !== 1) {
      throw new Error(
        `edition_service_counts_failed:${guestCount}/${auditCount}/${contactCount}`,
      );
    }

    console.info(
      "[edition-rsvp-neon-canary]",
      JSON.stringify({
        gate: "preview_neon",
        create: true,
        update: true,
        decline: true,
        persisted: true,
        plusOnesAfterDecline: declinedGuest.plus_ones,
        guests: guestCount,
        audits: auditCount,
        contacts: contactCount,
        notifications: false,
      }),
    );
  } catch (cause) {
    primaryError = cause;
  } finally {
    await neonQuery(
      `DELETE FROM public.event_contact_profiles WHERE event_id=$1::uuid`,
      [eventId],
    ).catch(() => null);
    await neonQuery(
      `DELETE FROM public.guest_audit_log WHERE event_id=$1::uuid`,
      [eventId],
    ).catch(() => null);
    await neonQuery(`DELETE FROM public.guests WHERE event_id=$1::uuid`, [eventId]).catch(
      () => null,
    );
    await neonQuery(`DELETE FROM public.events WHERE id=$1::uuid`, [eventId]).catch(
      () => null,
    );

    const cleanup = {
      events: await count(
        `SELECT count(*)::text AS count FROM public.events WHERE id=$1::uuid`,
        [eventId],
      ).catch(() => -1),
      guests: await count(
        `SELECT count(*)::text AS count FROM public.guests WHERE event_id=$1::uuid`,
        [eventId],
      ).catch(() => -1),
      audits: await count(
        `SELECT count(*)::text AS count FROM public.guest_audit_log WHERE event_id=$1::uuid`,
        [eventId],
      ).catch(() => -1),
      contacts: await count(
        `SELECT count(*)::text AS count FROM public.event_contact_profiles WHERE event_id=$1::uuid`,
        [eventId],
      ).catch(() => -1),
    };
    console.info("[edition-rsvp-neon-canary-cleanup]", JSON.stringify(cleanup));

    if (previousBinding === undefined) {
      delete process.env.EDITION_EVENT_JESSICA_KULAYA_ID;
    } else {
      process.env.EDITION_EVENT_JESSICA_KULAYA_ID = previousBinding;
    }
    if (previousNotifications === undefined) {
      delete process.env.EDITION_RSVP_NOTIFICATIONS_ENABLED;
    } else {
      process.env.EDITION_RSVP_NOTIFICATIONS_ENABLED = previousNotifications;
    }

    const cleanupPassed = Object.values(cleanup).every((value) => value === 0);
    await closeNeonPoolForTests().catch(() => undefined);
    if (primaryError) throw primaryError;
    if (!cleanupPassed) throw new Error("edition_rsvp_neon_canary_cleanup_failed");
  }
}

run().catch((cause) => {
  console.error(
    "[edition-rsvp-neon-canary] failed",
    cause instanceof Error ? cause.message : "unknown_error",
  );
  process.exit(1);
});
