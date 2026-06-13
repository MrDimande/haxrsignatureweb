export type SheetErrorCode =
  | "invalid_url"
  | "not_public"
  | "empty_sheet"
  | "missing_name_column"
  | "no_guests"
  | "not_connected"
  | "network"
  | "unknown";

export function mapSheetError(error: unknown): {
  code: SheetErrorCode;
  title: string;
  message: string;
  hint?: string;
} {
  const raw = error instanceof Error ? error.message : String(error);
  const msg = raw.toLowerCase();

  if (msg.includes("nenhuma google sheet") || msg.includes("indique o url")) {
    return {
      code: "not_connected",
      title: "Folha não ligada",
      message: "Guarde o URL da Google Sheet antes de sincronizar.",
      hint: "Cole o link, clique em «Guardar ligação» e depois «Sincronizar».",
    };
  }

  if (msg.includes("url") && msg.includes("inválido")) {
    return {
      code: "invalid_url",
      title: "Link inválido",
      message: "O URL não parece ser uma Google Sheet válida.",
      hint: "Use o link completo do browser: docs.google.com/spreadsheets/d/...",
    };
  }

  if (
    msg.includes("não está acessível") ||
    msg.includes("não foi possível ler") ||
    msg.includes("<!doctype") ||
    msg.includes("login")
  ) {
    return {
      code: "not_public",
      title: "Folha inacessível",
      message:
        "O sistema não conseguiu ler a folha. A partilha deve estar aberta.",
      hint: "No Google Sheets: Partilhar → «Qualquer pessoa com o link» → Leitor.",
    };
  }

  if (msg.includes("coluna") && msg.includes("nome")) {
    return {
      code: "missing_name_column",
      title: "Cabeçalho em falta",
      message: 'A primeira linha precisa de uma coluna «Nome».',
      hint: "Renomeie a coluna A para Nome ou adicione o cabeçalho correcto.",
    };
  }

  if (msg.includes("nenhum convidado") || msg.includes("folha está vazia")) {
    return {
      code: "no_guests",
      title: "Sem convidados",
      message: "A folha não contém convidados válidos para importar.",
      hint: "Adicione nomes a partir da linha 2, abaixo do cabeçalho.",
    };
  }

  if (msg.includes("fetch") || msg.includes("network")) {
    return {
      code: "network",
      title: "Falha de ligação",
      message: "Não foi possível contactar o Google Sheets neste momento.",
      hint: "Verifique a internet e tente novamente em alguns segundos.",
    };
  }

  return {
    code: "unknown",
    title: "Não foi possível sincronizar",
    message: raw || "Ocorreu um erro inesperado.",
    hint: "Confirme a partilha da folha e o formato das colunas.",
  };
}
