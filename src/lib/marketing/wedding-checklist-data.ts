/**
 * HAXR SIGNATURE · WEDDING CHECKLIST CANONICAL DATA MODEL
 *
 * Princípio:
 * "A ferramenta organiza. O Ecossistema acompanha. A Assessoria orienta e conduz."
 *
 * Modelo demonstrativo público para estado local / localStorage.
 * Sem ligação a APIs privadas nem persistência de clientes reais.
 */

export type WeddingJourney =
  | "civil"
  | "religiosa"
  | "tradicional_lobolo"
  | "recepcao";

export type ChecklistPhase =
  | "fundacao"
  | "estrutura"
  | "definicao"
  | "consolidacao"
  | "fecho"
  | "celebracao"
  | "pos_evento";

export type ChecklistCategory =
  | "Fundação & Visão"
  | "Orçamento"
  | "Local & Logística"
  | "Fornecedores"
  | "Convidados"
  | "Convites & Identidade"
  | "Trajes & Beleza"
  | "Cerimónia & Tradição"
  | "Recepção & Experiência"
  | "Fecho & Dia-D";

export interface PublicChecklistTask {
  id: string;
  title: string;
  phase: ChecklistPhase;
  category: ChecklistCategory;
  appliesTo: Array<WeddingJourney | "all">;
  completed?: boolean;
  custom?: boolean;
  relatedHref?: string;
  relatedLabel?: string;
  special?: boolean;
}

export interface PhaseMetadata {
  id: ChecklistPhase;
  roman: string;
  title: string;
  period: string;
  description: string;
}

export const CHECKLIST_PHASES: PhaseMetadata[] = [
  {
    id: "fundacao",
    roman: "I",
    title: "Fundação",
    period: "12–9 meses",
    description: "Definição do formato da celebração, orçamento indicativo e decisões basilares.",
  },
  {
    id: "estrutura",
    roman: "II",
    title: "Estrutura",
    period: "8–6 meses",
    description: "Curadoria dos parceiros essenciais, direcção estética e Save the Date.",
  },
  {
    id: "definicao",
    roman: "III",
    title: "Definição",
    period: "5–3 meses",
    description: "Convites oficiais, acompanhamento de RSVP e detalhamento das cerimónias.",
  },
  {
    id: "consolidacao",
    roman: "IV",
    title: "Consolidação",
    period: "2–1 meses",
    description: "Fecho de prazos, distribuição de mesas e alinhamento logístico.",
  },
  {
    id: "fecho",
    roman: "V",
    title: "Fecho",
    period: "Últimas 4 semanas",
    description: "Revisão final de trajes, confirmação de entregas e blindagem pessoal.",
  },
  {
    id: "celebracao",
    roman: "VI",
    title: "Celebração",
    period: "Últimos dias & Dia-D",
    description: "Presença plena, entrega aos bastidores e a emoção do grande dia.",
  },
  {
    id: "pos_evento",
    roman: "VII",
    title: "Pós-Celebração",
    period: "Depois do evento",
    description: "Agradecimentos, memórias partilhadas e arquivo da celebração.",
  },
];

export const JOURNEY_OPTIONS: Array<{ id: WeddingJourney; label: string; sub: string }> = [
  { id: "civil", label: "Cerimónia Civil", sub: "Registo & Legal" },
  { id: "religiosa", label: "Cerimónia Religiosa", sub: "Igreja & Comunidade" },
  { id: "tradicional_lobolo", label: "Tradicional / Lobolo", sub: "Rituais Familiares" },
  { id: "recepcao", label: "Recepção & Banquete", sub: "Salão, Gastronomia & Festa" },
];

export const CANONICAL_TASKS: PublicChecklistTask[] = [
  // ===============================
  // FASE I · FUNDAÇÃO (12–9 meses)
  // ===============================
  {
    id: "t-fund-01",
    title: "Definir a data ou janela preferencial da celebração",
    phase: "fundacao",
    category: "Fundação & Visão",
    appliesTo: ["all"],
  },
  {
    id: "t-fund-02",
    title: "Estabelecer um orçamento indicativo inicial",
    phase: "fundacao",
    category: "Orçamento",
    appliesTo: ["all"],
    relatedHref: "/tools/budget-tracker",
    relatedLabel: "Abrir Budget Tracker",
  },
  {
    id: "t-fund-03",
    title: "Criar uma primeira estimativa de convidados",
    phase: "fundacao",
    category: "Convidados",
    appliesTo: ["all"],
    relatedHref: "/tools/guest-list",
    relatedLabel: "Abrir Lista de Convidados",
  },
  {
    id: "t-fund-04",
    title: "Definir o formato das celebrações que farão parte da jornada",
    phase: "fundacao",
    category: "Fundação & Visão",
    appliesTo: ["all"],
  },
  {
    id: "t-fund-05",
    title: "Identificar localidades ou espaços a considerar",
    phase: "fundacao",
    category: "Local & Logística",
    appliesTo: ["all"],
  },
  {
    id: "t-fund-06",
    title: "Definir o modelo de acompanhamento e organização pretendido",
    phase: "fundacao",
    category: "Fundação & Visão",
    appliesTo: ["all"],
    relatedHref: "/assessoria-eventos",
    relatedLabel: "Conhecer Assessoria HAXR",
  },
  {
    id: "t-fund-07",
    title: "Iniciar referências visuais e de ambiente",
    phase: "fundacao",
    category: "Convites & Identidade",
    appliesTo: ["all"],
    relatedHref: "/tools/vision-boards",
    relatedLabel: "Abrir Vision Boards",
  },
  {
    id: "t-fund-08",
    title: "Seleccionar e reservar o espaço da recepção",
    phase: "fundacao",
    category: "Local & Logística",
    appliesTo: ["recepcao"],
  },
  {
    id: "t-fund-09",
    title: "Alinhar entre as famílias a intenção, formato e calendário da cerimónia tradicional",
    phase: "fundacao",
    category: "Cerimónia & Tradição",
    appliesTo: ["tradicional_lobolo"],
  },
  {
    id: "t-fund-10",
    title: "Identificar a igreja/comunidade religiosa e compreender o processo de preparação aplicável",
    phase: "fundacao",
    category: "Cerimónia & Tradição",
    appliesTo: ["religiosa"],
  },
  {
    id: "t-fund-11",
    title: "Informar-se sobre o processo e documentação aplicáveis à cerimónia civil",
    phase: "fundacao",
    category: "Cerimónia & Tradição",
    appliesTo: ["civil"],
  },

  // ===============================
  // FASE II · ESTRUTURA (8–6 meses)
  // ===============================
  {
    id: "t-est-01",
    title: "Consolidar uma primeira versão da lista de convidados",
    phase: "estrutura",
    category: "Convidados",
    appliesTo: ["all"],
    relatedHref: "/tools/guest-list",
    relatedLabel: "Abrir Lista de Convidados",
  },
  {
    id: "t-est-02",
    title: "Seleccionar fotografia e vídeo",
    phase: "estrutura",
    category: "Fornecedores",
    appliesTo: ["all"],
    relatedHref: "/tools/vendor-manager",
    relatedLabel: "Abrir Vendor Manager",
  },
  {
    id: "t-est-03",
    title: "Iniciar selecção dos trajes principais",
    phase: "estrutura",
    category: "Trajes & Beleza",
    appliesTo: ["all"],
  },
  {
    id: "t-est-04",
    title: "Definir a direcção visual da celebração",
    phase: "estrutura",
    category: "Convites & Identidade",
    appliesTo: ["all"],
    relatedHref: "/convites-identidade-visual",
    relatedLabel: "Explorar Identidade Visual",
  },
  {
    id: "t-est-05",
    title: "Preparar e enviar Save the Date, quando aplicável",
    phase: "estrutura",
    category: "Convites & Identidade",
    appliesTo: ["all"],
    relatedHref: "/convites-identidade-visual",
    relatedLabel: "Ver Save the Date Digital",
  },
  {
    id: "t-est-06",
    title: "Seleccionar catering",
    phase: "estrutura",
    category: "Fornecedores",
    appliesTo: ["recepcao"],
    relatedHref: "/tools/vendor-manager",
    relatedLabel: "Abrir Vendor Manager",
  },
  {
    id: "t-est-07",
    title: "Seleccionar decoração e cenografia",
    phase: "estrutura",
    category: "Fornecedores",
    appliesTo: ["recepcao"],
  },
  {
    id: "t-est-08",
    title: "Seleccionar música, DJ ou entretenimento",
    phase: "estrutura",
    category: "Fornecedores",
    appliesTo: ["recepcao"],
  },
  {
    id: "t-est-09",
    title: "Avaliar necessidades de transporte e alojamento",
    phase: "estrutura",
    category: "Local & Logística",
    appliesTo: ["recepcao"],
  },
  {
    id: "t-est-10",
    title: "Reunir e organizar os elementos acordados entre as famílias para o lobolo",
    phase: "estrutura",
    category: "Cerimónia & Tradição",
    appliesTo: ["tradicional_lobolo"],
  },
  {
    id: "t-est-11",
    title: "Iniciar a preparação religiosa solicitada pela igreja/comunidade",
    phase: "estrutura",
    category: "Cerimónia & Tradição",
    appliesTo: ["religiosa"],
  },

  // ===============================
  // FASE III · DEFINIÇÃO (5–3 meses)
  // ===============================
  {
    id: "t-def-01",
    title: "Finalizar identidade visual principal",
    phase: "definicao",
    category: "Convites & Identidade",
    appliesTo: ["all"],
    relatedHref: "/convites-identidade-visual",
    relatedLabel: "Explorar Convites HAXR",
  },
  {
    id: "t-def-02",
    title: "Preparar e enviar o convite oficial",
    phase: "definicao",
    category: "Convites & Identidade",
    appliesTo: ["all"],
    relatedHref: "/convites-identidade-visual",
    relatedLabel: "Convite Digital Signature",
  },
  {
    id: "t-def-03",
    title: "Abrir acompanhamento de confirmações RSVP",
    phase: "definicao",
    category: "Convidados",
    appliesTo: ["all"],
    relatedHref: "/gestao-convidados",
    relatedLabel: "Conhecer Gestão de Convidados",
  },
  {
    id: "t-def-04",
    title: "Confirmar fornecedores principais",
    phase: "definicao",
    category: "Fornecedores",
    appliesTo: ["all"],
    relatedHref: "/tools/vendor-manager",
    relatedLabel: "Abrir Vendor Manager",
  },
  {
    id: "t-def-05",
    title: "Prosseguir com provas e ajustes de trajes",
    phase: "definicao",
    category: "Trajes & Beleza",
    appliesTo: ["all"],
  },
  {
    id: "t-def-06",
    title: "Seleccionar alianças, quando aplicável",
    phase: "definicao",
    category: "Trajes & Beleza",
    appliesTo: ["all"],
  },
  {
    id: "t-def-07",
    title: "Definir menu da recepção",
    phase: "definicao",
    category: "Recepção & Experiência",
    appliesTo: ["recepcao"],
  },
  {
    id: "t-def-08",
    title: "Seleccionar bolo e sobremesas",
    phase: "definicao",
    category: "Recepção & Experiência",
    appliesTo: ["recepcao"],
  },
  {
    id: "t-def-09",
    title: "Consolidar conceito de decoração",
    phase: "definicao",
    category: "Recepção & Experiência",
    appliesTo: ["recepcao"],
  },
  {
    id: "t-def-10",
    title: "Definir necessidades de sinalética, menus e indicadores de mesa",
    phase: "definicao",
    category: "Convites & Identidade",
    appliesTo: ["recepcao"],
  },
  {
    id: "t-def-11",
    title: "Estruturar programa da cerimónia religiosa",
    phase: "definicao",
    category: "Cerimónia & Tradição",
    appliesTo: ["religiosa"],
  },
  {
    id: "t-def-12",
    title: "Rever o estado da preparação da cerimónia civil",
    phase: "definicao",
    category: "Cerimónia & Tradição",
    appliesTo: ["civil"],
  },
  {
    id: "t-def-13",
    title: "Confirmar os principais preparativos acordados entre as famílias",
    phase: "definicao",
    category: "Cerimónia & Tradição",
    appliesTo: ["tradicional_lobolo"],
  },

  // ===============================
  // FASE IV · CONSOLIDAÇÃO (2–1 meses)
  // ===============================
  {
    id: "t-cons-01",
    title: "Rever confirmações e convidados ainda pendentes",
    phase: "consolidacao",
    category: "Convidados",
    appliesTo: ["all"],
    relatedHref: "/gestao-convidados",
    relatedLabel: "Conhecer Gestão de Convidados",
  },
  {
    id: "t-cons-02",
    title: "Reconfirmar fornecedores contratados",
    phase: "consolidacao",
    category: "Fornecedores",
    appliesTo: ["all"],
    relatedHref: "/tools/vendor-manager",
    relatedLabel: "Abrir Vendor Manager",
  },
  {
    id: "t-cons-03",
    title: "Rever pagamentos e compromissos ainda previstos",
    phase: "consolidacao",
    category: "Orçamento",
    appliesTo: ["all"],
    relatedHref: "/tools/budget-tracker",
    relatedLabel: "Abrir Budget Tracker",
  },
  {
    id: "t-cons-04",
    title: "Fazer provas finais dos trajes",
    phase: "consolidacao",
    category: "Trajes & Beleza",
    appliesTo: ["all"],
  },
  {
    id: "t-cons-05",
    title: "Agendar cabelo, maquilhagem e preparação pessoal, quando aplicável",
    phase: "consolidacao",
    category: "Trajes & Beleza",
    appliesTo: ["all"],
  },
  {
    id: "t-cons-06",
    title: "Iniciar distribuição de convidados por mesas",
    phase: "consolidacao",
    category: "Convidados",
    appliesTo: ["recepcao"],
    relatedHref: "/gestao-convidados",
    relatedLabel: "Explorar Seating Plan",
  },
  {
    id: "t-cons-07",
    title: "Rever capacidade e organização das mesas",
    phase: "consolidacao",
    category: "Recepção & Experiência",
    appliesTo: ["recepcao"],
  },
  {
    id: "t-cons-08",
    title: "Consolidar horários de montagem e entregas",
    phase: "consolidacao",
    category: "Local & Logística",
    appliesTo: ["recepcao"],
  },
  {
    id: "t-cons-09",
    title: "Definir músicas e momentos especiais da recepção",
    phase: "consolidacao",
    category: "Recepção & Experiência",
    appliesTo: ["recepcao"],
  },
  {
    id: "t-cons-10",
    title: "Finalizar menus, indicadores e restante papelaria",
    phase: "consolidacao",
    category: "Convites & Identidade",
    appliesTo: ["recepcao"],
  },
  {
    id: "t-cons-11",
    title: "Confirmar elementos necessários para a cerimónia religiosa",
    phase: "consolidacao",
    category: "Cerimónia & Tradição",
    appliesTo: ["religiosa"],
  },
  {
    id: "t-cons-12",
    title: "Confirmar documentação e informação necessária junto da entidade competente",
    phase: "consolidacao",
    category: "Cerimónia & Tradição",
    appliesTo: ["civil"],
  },
  {
    id: "t-cons-13",
    title: "Fazer uma revisão familiar dos preparativos da cerimónia tradicional",
    phase: "consolidacao",
    category: "Cerimónia & Tradição",
    appliesTo: ["tradicional_lobolo"],
  },

  // ===============================
  // FASE V · FECHO (Últimas 4 semanas)
  // ===============================
  {
    id: "t-fech-01",
    title: "Consolidar número final previsto de convidados",
    phase: "fecho",
    category: "Convidados",
    appliesTo: ["all"],
    relatedHref: "/gestao-convidados",
    relatedLabel: "Conhecer Gestão de Convidados",
  },
  {
    id: "t-fech-02",
    title: "Partilhar informação final necessária com fornecedores",
    phase: "fecho",
    category: "Fornecedores",
    appliesTo: ["all"],
  },
  {
    id: "t-fech-03",
    title: "Rever transportes, deslocações e alojamentos necessários",
    phase: "fecho",
    category: "Local & Logística",
    appliesTo: ["all"],
  },
  {
    id: "t-fech-04",
    title: "Preparar documentos, alianças e elementos pessoais importantes",
    phase: "fecho",
    category: "Fecho & Dia-D",
    appliesTo: ["all"],
  },
  {
    id: "t-fech-05",
    title: "Fazer revisão final dos trajes",
    phase: "fecho",
    category: "Trajes & Beleza",
    appliesTo: ["all"],
  },
  {
    id: "t-fech-06",
    title: "Preparar contactos essenciais do dia",
    phase: "fecho",
    category: "Fecho & Dia-D",
    appliesTo: ["all"],
  },
  {
    id: "t-fech-07",
    title: "Confirmar entregas e recolhas previstas",
    phase: "fecho",
    category: "Local & Logística",
    appliesTo: ["all"],
  },
  {
    id: "t-fech-08",
    title: "Finalizar plano de mesas",
    phase: "fecho",
    category: "Convidados",
    appliesTo: ["recepcao"],
    relatedHref: "/gestao-convidados",
    relatedLabel: "Explorar Find Your Seat",
  },
  {
    id: "t-fech-09",
    title: "Consolidar sequência geral da recepção",
    phase: "fecho",
    category: "Recepção & Experiência",
    appliesTo: ["recepcao"],
  },
  {
    id: "t-fech-10",
    title: "Rever montagem, decoração e elementos de recepção",
    phase: "fecho",
    category: "Recepção & Experiência",
    appliesTo: ["recepcao"],
  },
  {
    id: "t-fech-11",
    title: "Confirmar com a família que os elementos acordados para a cerimónia estão preparados",
    phase: "fecho",
    category: "Cerimónia & Tradição",
    appliesTo: ["tradicional_lobolo"],
  },
  {
    id: "t-fech-12",
    title: "Participar no ensaio ou preparação final, quando solicitado",
    phase: "fecho",
    category: "Cerimónia & Tradição",
    appliesTo: ["religiosa"],
  },

  // ===============================
  // FASE VI · CELEBRAÇÃO (Últimos dias & Dia-D)
  // ===============================
  {
    id: "t-cel-01",
    title: "Fazer uma última revisão dos elementos pessoais necessários",
    phase: "celebracao",
    category: "Fecho & Dia-D",
    appliesTo: ["all"],
  },
  {
    id: "t-cel-02",
    title: "Confirmar hora e local de preparação",
    phase: "celebracao",
    category: "Fecho & Dia-D",
    appliesTo: ["all"],
  },
  {
    id: "t-cel-03",
    title: "Garantir que documentos e alianças estão com a pessoa responsável",
    phase: "celebracao",
    category: "Fecho & Dia-D",
    appliesTo: ["all"],
  },
  {
    id: "t-cel-04",
    title: "Confirmar contactos essenciais para eventual necessidade",
    phase: "celebracao",
    category: "Fecho & Dia-D",
    appliesTo: ["all"],
  },
  {
    id: "t-cel-05",
    title: "Viver a celebração",
    phase: "celebracao",
    category: "Fecho & Dia-D",
    appliesTo: ["all"],
    special: true,
  },
  {
    id: "t-cel-06",
    title: "Confirmar que a informação de recepção e mesas está disponível",
    phase: "celebracao",
    category: "Recepção & Experiência",
    appliesTo: ["recepcao"],
    relatedHref: "/gestao-convidados",
    relatedLabel: "Find Your Seat & Check-in",
  },
  {
    id: "t-cel-07",
    title: "Cumprir as orientações finais da cerimónia religiosa",
    phase: "celebracao",
    category: "Cerimónia & Tradição",
    appliesTo: ["religiosa"],
  },
  {
    id: "t-cel-08",
    title: "Levar os documentos solicitados pela entidade competente",
    phase: "celebracao",
    category: "Cerimónia & Tradição",
    appliesTo: ["civil"],
  },
  {
    id: "t-cel-09",
    title: "Seguir a organização acordada entre as famílias",
    phase: "celebracao",
    category: "Cerimónia & Tradição",
    appliesTo: ["tradicional_lobolo"],
  },

  // ===============================
  // FASE VII · PÓS-CELEBRAÇÃO
  // ===============================
  {
    id: "t-pos-01",
    title: "Enviar agradecimentos aos convidados",
    phase: "pos_evento",
    category: "Convidados",
    appliesTo: ["all"],
    relatedHref: "/plus-memories",
    relatedLabel: "Conhecer Plus Memories",
  },
  {
    id: "t-pos-02",
    title: "Confirmar devolução de elementos alugados",
    phase: "pos_evento",
    category: "Local & Logística",
    appliesTo: ["all"],
  },
  {
    id: "t-pos-03",
    title: "Rever compromissos financeiros remanescentes",
    phase: "pos_evento",
    category: "Orçamento",
    appliesTo: ["all"],
    relatedHref: "/tools/budget-tracker",
    relatedLabel: "Abrir Budget Tracker",
  },
  {
    id: "t-pos-04",
    title: "Organizar fotografias e memórias recebidas",
    phase: "pos_evento",
    category: "Recepção & Experiência",
    appliesTo: ["all"],
    relatedHref: "/plus-memories",
    relatedLabel: "Arquivo de Memórias",
  },
  {
    id: "t-pos-05",
    title: "Guardar documentos importantes da celebração",
    phase: "pos_evento",
    category: "Fecho & Dia-D",
    appliesTo: ["all"],
  },
  {
    id: "t-pos-06",
    title: "Arquivar contactos ou informações de fornecedores que queira conservar",
    phase: "pos_evento",
    category: "Fornecedores",
    appliesTo: ["all"],
  },
];

/**
 * Storage schema for public checklist (v2)
 */
export interface StoredChecklistState {
  version: 2;
  weddingDate: string | null;
  selectedJourneys: WeddingJourney[];
  completedTaskIds: string[];
  customTasks: PublicChecklistTask[];
  updatedAt: string;
}

export const STORAGE_KEY_V2 = "haxr_wedding_checklist_v2";
export const LEGACY_STORAGE_KEY = "haxr_wedding_tasks";

export function loadChecklistState(): StoredChecklistState {
  if (typeof window === "undefined") {
    return {
      version: 2,
      weddingDate: null,
      selectedJourneys: ["civil", "recepcao"],
      completedTaskIds: [],
      customTasks: [],
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      if (parsed.version === 2) {
        return parsed;
      }
    }

    // Try legacy migration if v1 exists
    const rawLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (rawLegacy) {
      const legacyTasks = JSON.parse(rawLegacy);
      if (Array.isArray(legacyTasks)) {
        const completedTaskIds: string[] = [];
        const customTasks: PublicChecklistTask[] = [];

        legacyTasks.forEach((lt: Record<string, unknown>) => {
          if (lt.custom && typeof lt.text === "string") {
            customTasks.push({
              id: typeof lt.id === "string" ? lt.id : `custom-${Date.now()}-${Math.random()}`,
              title: lt.text,
              phase: "fundacao",
              category: "Fundação & Visão",
              appliesTo: ["all"],
              completed: Boolean(lt.done),
              custom: true,
            });
          }
        });

        const migratedState: StoredChecklistState = {
          version: 2,
          weddingDate: null,
          selectedJourneys: ["civil", "recepcao"],
          completedTaskIds,
          customTasks,
          updatedAt: new Date().toISOString(),
        };

        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(migratedState));
        return migratedState;
      }
    }
  } catch (err) {
    console.error("[ChecklistStorage] Error loading state:", err);
  }

  return {
    version: 2,
    weddingDate: null,
    selectedJourneys: ["civil", "recepcao"],
    completedTaskIds: [],
    customTasks: [],
    updatedAt: new Date().toISOString(),
  };
}

export function saveChecklistState(state: StoredChecklistState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(state));
  } catch (err) {
    console.error("[ChecklistStorage] Error saving state:", err);
  }
}
