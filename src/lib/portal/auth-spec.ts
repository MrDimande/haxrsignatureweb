/**
 * Especificação de autenticação do portal — decisão arquitectural Fase 9.
 *
 * Recomendação: Opção A (MVP) → Opção B (produção).
 */

export type PortalAuthStrategy = "magic_link_mvp" | "supabase_auth";

export const portalAuthSpec = {
  recommended: "supabase_auth" as PortalAuthStrategy,
  mvpFallback: "magic_link_mvp" as PortalAuthStrategy,

  cookieName: "haxr_portal_session",
  sessionMaxAgeDays: 14,

  /** Rotas públicas do portal */
  publicPaths: ["/portal/entrar", "/portal/convite/[token]"],

  /** Matcher futuro para middleware */
  protectedPrefix: "/portal",

  strategies: {
    magic_link_mvp: {
      description:
        "Email OTP ou link único validado contra clients.email + portal_invites.",
      pros: ["Rápido de implementar", "Sem Supabase Auth extra"],
      cons: ["Menos escalável", "Gestão manual de sessões"],
      tables: ["portal_invites", "portal_sessions"],
    },
    supabase_auth: {
      description:
        "Supabase Auth (magic link) + tabela portal_users ligada a clients.id.",
      pros: ["RLS nativo", "Recuperação de sessão", "Auditoria"],
      cons: ["Mais configuração inicial", "Policies RLS obrigatórias"],
      tables: ["portal_users", "portal_invites"],
    },
  },
} as const;

/** Documentos que o cliente pode ver no portal */
export const portalVisibleDocumentStatuses = ["sent", "paid"] as const;

/** Documentos que nunca expor */
export const portalHiddenDocumentStatuses = ["draft", "cancelled"] as const;
