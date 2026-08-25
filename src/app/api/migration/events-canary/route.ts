import { NextResponse } from "next/server";
import {
  archiveEvent,
  createEvent,
  deleteEvent,
  getEventById,
  getEventPublicInfo,
  listAllEvents,
  listEvents,
  recordSheetSync,
  updateEvent,
  updateEventSheetConnection,
  verifyFindSeatAccess,
} from "@/lib/events/repositories/events.repository";
import { neonQuery } from "@/lib/neon/server-db";
import type { EventFormData } from "@/lib/events/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isMigrationPreview(): boolean {
  return (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "migration/supabase-to-neon"
  );
}

export async function GET() {
  if (!isMigrationPreview()) {
    return new NextResponse(null, { status: 404 });
  }

  const initialCount = (await listAllEvents()).length;
  const suffix = Date.now().toString(36);
  let eventId: string | null = null;

  const draft: EventFormData = {
    businessId: "haxr-signature",
    clientId: null,
    name: `Migration Event Canary ${suffix}`,
    type: "other",
    date: "2026-12-31",
    location: "Maputo",
    notes: "Temporary Neon migration canary",
  };

  try {
    const created = await createEvent(draft);
    eventId = created.id;

    const fetched = await getEventById(created.id);
    const publicInfo = await getEventPublicInfo(created.id);
    const findSeat = await verifyFindSeatAccess(created.id, created.findSeatCode);
    const wrongFindSeat = await verifyFindSeatAccess(created.id, "HXR-000000000000000000000000");

    const updated = await updateEvent(created.id, {
      ...draft,
      name: `${draft.name} Updated`,
      location: "Matola",
    });

    const sheetUpdated = await updateEventSheetConnection(
      created.id,
      "https://docs.google.com/spreadsheets/d/migration-canary",
      "123",
      "rsvp",
    );

    const syncedAt = new Date().toISOString();
    await recordSheetSync(created.id, syncedAt, "migration-canary-sync");
    const synced = await getEventById(created.id);

    await archiveEvent(created.id);
    const activeAfterArchive = await listEvents();
    const allAfterArchive = await listAllEvents();

    await deleteEvent(created.id);
    eventId = null;
    const deleted = await getEventById(created.id);
    const finalCount = (await listAllEvents()).length;

    const operations = {
      create:
        created.id.length > 0 &&
        /^HXR-[A-F0-9]{24}$/.test(created.findSeatCode),
      readById: fetched?.id === created.id,
      publicInfo: publicInfo?.id === created.id,
      findSeatValid: findSeat?.id === created.id,
      findSeatInvalid: wrongFindSeat === null,
      update:
        updated.id === created.id &&
        updated.name.endsWith(" Updated") &&
        updated.location === "Matola" &&
        updated.findSeatCode === created.findSeatCode,
      sheetConnection:
        sheetUpdated.googleSheetUrl.includes("migration-canary") &&
        sheetUpdated.googleSheetGid === "123" &&
        sheetUpdated.sheetsSyncMode === "rsvp",
      sheetSync:
        synced?.sheetsSyncSummary === "migration-canary-sync" &&
        Boolean(synced?.sheetsLastSyncedAt),
      archive:
        !activeAfterArchive.some((event) => event.id === created.id) &&
        allAfterArchive.some(
          (event) => event.id === created.id && event.isActive === false,
        ),
      delete: deleted === null,
      cleanup: finalCount === initialCount,
    };

    const ok = Object.values(operations).every(Boolean);

    return NextResponse.json(
      { ok, operations, initialCount, finalCount },
      { status: ok ? 200 : 503 },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "events_neon_canary_failed" },
      { status: 503 },
    );
  } finally {
    if (eventId) {
      await neonQuery("DELETE FROM public.events WHERE id = $1", [eventId]).catch(
        () => undefined,
      );
    }
  }
}
