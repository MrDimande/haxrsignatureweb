import { NextResponse } from "next/server";
import { processPostEventReports } from "@/lib/events/services/post-event-report.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const result = await processPostEventReports();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/post-event-reports]", err);
    return NextResponse.json(
      { error: "Falha ao processar relatórios pós-evento." },
      { status: 500 }
    );
  }
}
