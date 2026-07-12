import { NextResponse } from "next/server";
import { getPortalDocumentPdf } from "@/lib/portal/services/portal-document-access.service";

type RouteContext = {
  params: Promise<{ token: string; documentId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { token, documentId } = await context.params;

  try {
    const result = await getPortalDocumentPdf(token, documentId);
    if (!result) {
      return NextResponse.json(
        { error: "Documento não encontrado ou indisponível." },
        { status: 404 }
      );
    }

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao gerar o PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
