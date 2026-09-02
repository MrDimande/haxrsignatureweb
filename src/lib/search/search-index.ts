export type SearchCategory =
  | "servicos"
  | "ferramentas"
  | "inspiracao"
  | "fornecedores"
  | "geral";

export interface SearchItem {
  id: string;
  title: string;
  category: SearchCategory;
  categoryLabel: string;
  description: string;
  href: string;
  keywords: string[];
}

export const SITE_SEARCH_INDEX: readonly SearchItem[] = [
  // ── Serviços & Atelier ──
  {
    id: "assessoria",
    title: "Assessoria de Eventos",
    category: "servicos",
    categoryLabel: "Serviço",
    description: "Planeamento integral, curadoria de fornecedores e coordenação no dia do evento.",
    href: "/assessoria-eventos",
    keywords: ["assessoria", "wedding planner", "planeamento", "coordenação", "organização", "casamento", "cerimonial", "consultor", "serviço"],
  },
  {
    id: "convites",
    title: "Convites Digitais & Identidade Visual",
    category: "servicos",
    categoryLabel: "Serviço",
    description: "Convites digitais interactivos, tipografia personalizada e direcção estética de luxo.",
    href: "/convites-identidade-visual",
    keywords: ["convites", "convite digital", "identidade visual", "design", "estética", "tipografia", "interativo", "web convite", "rsvp digital"],
  },
  {
    id: "pacotes",
    title: "Pacotes & Preços de Convites",
    category: "servicos",
    categoryLabel: "Preços",
    description: "Conheça os pacotes Atelier, Signature e Private Suite para convites e identidade.",
    href: "/convites-identidade-visual#pacotes",
    keywords: ["pacotes", "preços", "valores", "quanto custa", "tabela", "custos", "planos", "atelier", "signature", "private suite"],
  },
  {
    id: "plus-memories",
    title: "Plus Memories",
    category: "servicos",
    categoryLabel: "Serviço",
    description: "Desafios interactivos, partilha de fotografias dos convidados e álbum colectivo da celebração.",
    href: "/plus-memories",
    keywords: ["plus memories", "memórias", "fotos", "álbum", "galeria", "desafios", "interação convidados", "jogos", "qrcode mesa"],
  },
  {
    id: "gestao-convidados",
    title: "Gestão de Convidados & RSVP",
    category: "servicos",
    categoryLabel: "Serviço",
    description: "Confirmações em tempo real por WhatsApp, gestão de mesas, restrições alimentares e check-in no dia.",
    href: "/gestao-convidados",
    keywords: ["gestão de convidados", "rsvp", "confirmação", "lista de convidados", "mesas", "seating", "check-in", "qrcode", "whatsapp"],
  },
  {
    id: "plataforma-eventos",
    title: "Plataforma HAXR",
    category: "servicos",
    categoryLabel: "Plataforma",
    description: "Ecossistema tecnológico para casais e noivos gerirem todo o casamento num só local.",
    href: "/plataforma-eventos",
    keywords: ["plataforma", "software", "tecnologia", "sistema", "ecossistema", "gestão", "painel", "dashboard"],
  },

  // ── Ferramentas de Planeamento ──
  {
    id: "hub-ferramentas",
    title: "Hub de Ferramentas Gratuitas",
    category: "ferramentas",
    categoryLabel: "Ferramentas",
    description: "Todas as ferramentas interactivas de planeamento num único lugar.",
    href: "/ferramentas",
    keywords: ["ferramentas", "tools", "hub", "todas as ferramentas", "aplicações", "utilitários"],
  },
  {
    id: "haxr-concierge",
    title: "HAXR Concierge",
    category: "ferramentas",
    categoryLabel: "Ferramenta",
    description: "Organiza propostas, contratos, recibos e inspirações de casamento automaticamente.",
    href: "/tools/haxr-concierge",
    keywords: ["concierge", "assistente", "documentos", "contratos", "recibos", "propostas", "orçamentos fornecedores", "organizador"],
  },
  {
    id: "guest-list-tool",
    title: "Gestor de Lista & RSVP",
    category: "ferramentas",
    categoryLabel: "Ferramenta",
    description: "Controlo de confirmações de presença, acompanhantes e mapa de assentos dos convidados.",
    href: "/tools/guest-list",
    keywords: ["lista de convidados", "rsvp online", "gestor de convidados", "acompanhantes", "lugares", "mesas", "presenças"],
  },
  {
    id: "vendor-manager-tool",
    title: "Gestor de Fornecedores",
    category: "ferramentas",
    categoryLabel: "Ferramenta",
    description: "Acompanhe contratos, contactos, sinais pagos e prazos de todos os seus fornecedores.",
    href: "/tools/vendor-manager",
    keywords: ["gestor de fornecedores", "fornecedores", "contratos", "contactos", "pagamentos fornecedor", "prazos", "sinais"],
  },
  {
    id: "budget-tracker-tool",
    title: "Calculadora de Orçamento & Custos",
    category: "ferramentas",
    categoryLabel: "Ferramenta",
    description: "Controle despesas, sinais, saldo em dívida e estimativas de custo por categoria.",
    href: "/tools/budget-tracker",
    keywords: ["orçamento", "budget", "custos", "despesas", "calculadora", "gastos", "controlo financeiro", "finanças casamento"],
  },
  {
    id: "wedding-checklist-tool",
    title: "Checklist de Casamento",
    category: "ferramentas",
    categoryLabel: "Ferramenta",
    description: "Cronograma completo de tarefas personalizado de acordo com a data do seu grande dia.",
    href: "/tools/wedding-checklist",
    keywords: ["checklist", "cronograma", "tarefas", "prazos", "o que fazer", "planeamento por mês", "etapas"],
  },
  {
    id: "drinks-catering-tool",
    title: "Calculadora de Bebidas & Catering",
    category: "ferramentas",
    categoryLabel: "Ferramenta",
    description: "Estime garrafas de vinho, whisky, cerveja, champanhe, salgados e bolo de casamento para Moçambique.",
    href: "/tools/calculadora-bebidas-catering",
    keywords: [
      "bebidas",
      "calculadora de bebidas",
      "catering",
      "quantas garrafas",
      "cerveja",
      "whisky",
      "vinho",
      "champanhe",
      "bolo de noiva",
      "salgados",
      "gelo",
      "comida",
      "buffet",
    ],
  },
  {
    id: "wedding-timeline-tool",
    title: "Gerador de Cronograma do Grande Dia (Run Sheet)",
    category: "ferramentas",
    categoryLabel: "Ferramenta",
    description: "Calcule e personalize o cronograma minuto a minuto do casamento, dos preparativos ao corte do bolo e festa.",
    href: "/tools/cronograma-casamento",
    keywords: [
      "cronograma",
      "timeline",
      "run sheet",
      "horários do casamento",
      "dia do casamento",
      "roteiro",
      "corte do bolo",
      "maquilhagem",
      "entrada da noiva",
      "ordem dos acontecimentos",
      "programa do casamento",
    ],
  },
  {
    id: "floor-plan-tool",
    title: "Simulador de Disposição de Mesas & Layout de Salão",
    category: "ferramentas",
    categoryLabel: "Ferramenta",
    description: "Calcule a área em m² necessária para convidados, mesas redondas ou imperiais, pista de dança e buffet.",
    href: "/tools/simulador-layout-salao",
    keywords: [
      "layout de salão",
      "disposição de mesas",
      "mesas redondas",
      "mesas imperiais",
      "floor plan",
      "tamanho do salão",
      "metros quadrados",
      "área do casamento",
      "capacidade do salão",
      "pista de dança",
      "quinta",
    ],
  },
  {
    id: "vision-boards-tool",
    title: "Vision Boards & Moodboards",
    category: "ferramentas",
    categoryLabel: "Ferramenta",
    description: "Crie e partilhe quadros de inspiração visual com os seus fornecedores e decoradores.",
    href: "/tools/vision-boards",
    keywords: ["vision board", "moodboard", "inspiração", "fotos", "paleta de cores", "decoração", "painel visual", "estilo"],
  },

  // ── Inspiração & Guias ──
  {
    id: "portfolio",
    title: "Portfólio HAXR",
    category: "inspiracao",
    categoryLabel: "Inspiração",
    description: "Galeria de casamentos reais e celebrações memoráveis assinadas pela HAXR.",
    href: "/portfolio",
    keywords: ["portfólio", "casamentos reais", "fotos de casamento", "galeria", "trabalhos", "exemplos", "casais"],
  },
  {
    id: "experiencias",
    title: "Demonstrações & Experiências",
    category: "inspiracao",
    categoryLabel: "Inspiração",
    description: "Experimente convites digitais ao vivo e veja as funcionalidades em ação.",
    href: "/experiencias",
    keywords: ["experiências", "demo", "demonstração", "ao vivo", "testar convite", "interativo", "amostra"],
  },
  {
    id: "guias",
    title: "Guias Gratuitos & Checklists em PDF",
    category: "inspiracao",
    categoryLabel: "Guias",
    description: "Downloads gratuitos de checklists, modelos de orçamento e manuais para casar em Moçambique.",
    href: "/guias",
    keywords: ["guias", "pdf", "download gratuito", "ebook", "manual", "dicas", "maputo", "moçambique", "como planear"],
  },
  {
    id: "insights",
    title: "Insights & Artigos Editoriais",
    category: "inspiracao",
    categoryLabel: "Editorial",
    description: "Artigos de curadoria com conselhos práticos, tendências e direcção criativa para casamentos.",
    href: "/insights",
    keywords: ["insights", "artigos", "blog", "tendências", "dicas", "conselhos", "editorial", "leitura"],
  },
  {
    id: "style-quiz",
    title: "Style Quiz HAXR",
    category: "inspiracao",
    categoryLabel: "Quiz",
    description: "Descubra o estilo estético e o pacote HAXR ideal para a personalidade do vosso casal.",
    href: "/style-quiz",
    keywords: ["style quiz", "quiz", "teste de estilo", "qual o meu estilo", "clássico", "moderno", "editorial", "minimalista"],
  },

  // ── Fornecedores & Directório ──
  {
    id: "fornecedores-directorio",
    title: "Directório de Fornecedores",
    category: "fornecedores",
    categoryLabel: "Directório",
    description: "Pesquise e descubra profissionais de elite em Maputo e Moçambique para o seu casamento.",
    href: "/fornecedores",
    keywords: ["fornecedores", "directório", "profissionais", "empresas", "espaços", "quintas", "salões", "fotógrafos", "catering"],
  },
  {
    id: "fornecedores-fotografia",
    title: "Fotografia & Vídeo de Casamento",
    category: "fornecedores",
    categoryLabel: "Fornecedor",
    description: "Fotógrafos e videógrafos especializados em casamentos e coberturas editoriais.",
    href: "/fornecedores?category=fotografia",
    keywords: ["fotografia", "fotógrafo", "vídeo", "videógrafo", "filme", "sessão noivos", "álbum de fotos"],
  },
  {
    id: "fornecedores-espacos",
    title: "Espaços, Quintas & Salões",
    category: "fornecedores",
    categoryLabel: "Fornecedor",
    description: "Locais para cerimónia e copo d'água em Maputo, Matola e arredores.",
    href: "/fornecedores?category=espacos",
    keywords: ["espaços", "quintas", "salões", "hotéis", "praia", "local de casamento", "venue", "onde casar"],
  },
  {
    id: "fornecedores-decoracao",
    title: "Decoração & Design Floral",
    category: "fornecedores",
    categoryLabel: "Fornecedor",
    description: "Decoradores, floristas e designers de ambiente para casamentos de alto padrão.",
    href: "/fornecedores?category=decoracao",
    keywords: ["decoração", "flores", "design floral", "mobiliário", "cenografia", "arranjo", "iluminação"],
  },
  {
    id: "fornecedores-catering",
    title: "Catering & Gastronomia",
    category: "fornecedores",
    categoryLabel: "Fornecedor",
    description: "Serviços de buffet, banquetes, bolo de noiva e bares de cocktails.",
    href: "/fornecedores?category=catering",
    keywords: ["catering", "comida", "buffet", "banquete", "bolo de noiva", "cocktails", "bar", "bebidas", "menu"],
  },
  {
    id: "for-pros",
    title: "Portal para Profissionais & Fornecedores",
    category: "fornecedores",
    categoryLabel: "Parcerias",
    description: "Junte-se à comunidade HAXR e receba pedidos de casais qualificados.",
    href: "/for-pros",
    keywords: ["para profissionais", "for-pros", "sou fornecedor", "juntar", "cadastrar empresa", "anunciar", "parceria"],
  },

  // ── Acesso & Suporte ──
  {
    id: "login-acesso",
    title: "Área do Cliente / Iniciar Sessão",
    category: "geral",
    categoryLabel: "Conta",
    description: "Aceda ao seu painel privado de casamento e ferramentas.",
    href: "/sign-in",
    keywords: ["entrar", "login", "sign in", "iniciar sessão", "painel", "minha conta", "dashboard casal"],
  },
  {
    id: "criar-conta",
    title: "Criar Conta Gratuita",
    category: "geral",
    categoryLabel: "Conta",
    description: "Crie a sua conta gratuita para organizar o casamento e desbloquear as ferramentas.",
    href: "/sign-up",
    keywords: ["criar conta", "sign up", "registar", "cadastro", "começar", "grátis"],
  },
  {
    id: "sobre-nos",
    title: "Sobre a HAXR Signature",
    category: "geral",
    categoryLabel: "Empresa",
    description: "Conheça a história, filosofia e a equipa por trás do atelier HAXR em Maputo.",
    href: "/sobre",
    keywords: ["sobre", "quem somos", "história", "atelier", "equipa", "filosofia", "maputo", "moçambique"],
  },
  {
    id: "contacto",
    title: "Contacto & Atendimento",
    category: "geral",
    categoryLabel: "Contacto",
    description: "Fale connosco por WhatsApp ou agende uma reunião presencial no atelier.",
    href: "/contacto",
    keywords: ["contacto", "falar", "whatsapp", "email", "morada", "telefone", "agendar", "marcação"],
  },
  {
    id: "faq",
    title: "Perguntas Frequentes (FAQ)",
    category: "geral",
    categoryLabel: "Ajuda",
    description: "Respostas às dúvidas mais comuns sobre convites, prazos e pagamentos.",
    href: "/faq",
    keywords: ["faq", "perguntas frequentes", "dúvidas", "ajuda", "como funciona", "prazos", "formas de pagamento"],
  },
];

/**
 * Searches the site catalog using normalized fuzzy substring matching.
 */
export function searchCatalog(query: string): SearchItem[] {
  const normalized = query.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!normalized) return [];

  const queryTerms = normalized.split(/\s+/).filter(Boolean);

  return SITE_SEARCH_INDEX.filter((item) => {
    const titleNorm = item.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const descNorm = item.description.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const keywordsNorm = item.keywords.map((k) =>
      k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );

    // Score matching: all query terms should match somewhere in title, desc or keywords
    return queryTerms.every(
      (term) =>
        titleNorm.includes(term) ||
        descNorm.includes(term) ||
        keywordsNorm.some((k) => k.includes(term))
    );
  });
}
