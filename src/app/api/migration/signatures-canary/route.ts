import { NextResponse } from "next/server";
import {
  createSignature,
  deleteSignature,
  listSignatures,
  setDefaultSignature,
} from "@/lib/admin/repositories/signatures.repository";
import { neonQuery } from "@/lib/neon/server-db";

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

  const initialCount = (await listSignatures("haxr-signature")).length;
  const imageDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";
  const createdIds: string[] = [];

  try {
    const first = await createSignature({
      businessId: "haxr-signature",
      label: "Migration Signature One",
      roleTitle: "QA",
      imageDataUrl,
      setAsDefault: true,
    });
    createdIds.push(first.id);

    const second = await createSignature({
      businessId: "haxr-signature",
      label: "Migration Signature Two",
      roleTitle: "QA",
      imageDataUrl,
      setAsDefault: true,
    });
    createdIds.push(second.id);

    const afterSecond = await listSignatures("haxr-signature");
    const firstAfterSecond = afterSecond.find((item) => item.id === first.id);
    const secondAfterSecond = afterSecond.find((item) => item.id === second.id);

    const restoredFirst = await setDefaultSignature(first.id, "haxr-signature");
    const afterRestore = await listSignatures("haxr-signature");
    const secondAfterRestore = afterRestore.find((item) => item.id === second.id);

    await deleteSignature(second.id);
    createdIds.splice(createdIds.indexOf(second.id), 1);
    await deleteSignature(first.id);
    createdIds.splice(createdIds.indexOf(first.id), 1);

    const finalCount = (await listSignatures("haxr-signature")).length;

    const operations = {
      createFirstDefault: first.isDefault === true,
      createSecondDefault: second.isDefault === true,
      previousDefaultCleared: firstAfterSecond?.isDefault === false,
      secondRemainsDefault: secondAfterSecond?.isDefault === true,
      restoreFirstDefault: restoredFirst.isDefault === true,
      secondClearedAfterRestore: secondAfterRestore?.isDefault === false,
      deleteAndCleanup: finalCount === initialCount,
    };

    const ok = Object.values(operations).every(Boolean);
    return NextResponse.json(
      { ok, operations, initialCount, finalCount },
      { status: ok ? 200 : 503 },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "signature_neon_canary_failed" },
      { status: 503 },
    );
  } finally {
    if (createdIds.length) {
      await neonQuery(
        "DELETE FROM public.business_signatures WHERE id = ANY($1::uuid[])",
        [createdIds],
      ).catch(() => undefined);
    }
  }
}
