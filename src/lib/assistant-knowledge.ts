/**
 * HAXR Signature — Virtual Assistant Knowledge Base
 *
 * Client-side intent matching system for automated Q&A.
 * No external API needed — all responses are pre-built from real HAXR data.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Intent = {
  id: string;
  keywords: string[];
  response: string;
  quickReplies: string[];
};

export type EscalationChannel = "whatsapp" | "email" | "callback";

export type AssistantMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  quickReplies?: string[];
  escalation?: boolean;
  timestamp: Date;
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const WHATSAPP_NUMBER = "258870883428";
const EMAIL = "info@haxrsignature.com";

/* ------------------------------------------------------------------ */
/*  Knowledge Base — Intents                                           */
/* ------------------------------------------------------------------ */

const intents: Intent[] = [
  {
    id: "greeting",
    keywords: ["ola", "oi", "bom dia", "boa tarde", "boa noite", "hello", "hi", "hey"],
    response:
      "Olá! 👋 Sou o assistente virtual da HAXR Signature. Estou aqui para ajudar com informações sobre os nossos serviços, pacotes e preços. O que gostaria de saber?",
    quickReplies: ["Preços dos convites", "Serviços disponíveis", "Como funciona", "Falar com alguém"],
  },
  {
    id: "prices-overview",
    keywords: ["preco", "precos", "quanto", "custa", "custo", "valor", "valores", "orcamento", "cotacao", "pacote", "pacotes", "tabela"],
    response:
      "Os nossos convites digitais para casamento estão organizados em 3 pacotes:\n\n✦ **Essencial** — 5.999 MT\nConvite elegante com RSVP, mapa, música e contagem regressiva.\n\n✦ **Signature** — 12.999 MT\nGaleria editorial, storytelling, cronograma e dashboard de RSVP.\n\n✦ **Royal** — 19.999 MT\nAbertura cinemática, QR Code, gestão de mesas e acompanhamento premium.\n\nTemos também pacotes para noivados (a partir de 5.999 MT), aniversários e eventos corporativos.",
    quickReplies: ["Pacote Essencial", "Pacote Signature", "Pacote Royal", "Noivado", "Corporativo"],
  },
  {
    id: "package-essencial",
    keywords: ["essencial", "basico", "simples", "5999", "5.999"],
    response:
      "**Pacote Essencial — 5.999 MT**\n\nO minimalismo funcional para o vosso grande dia:\n\n• Página de convite digital de alta performance\n• Design de autor HAXR Signature\n• Integração com Google Maps\n• Curadoria musical para ambiente sonoro\n• Contagem decrescente dinâmica\n• Confirmação de presença (RSVP) integrada\n• Artefato digital para partilha via WhatsApp\n\nIdeal para casais que procuram sofisticação sem complicações.",
    quickReplies: ["Comparar pacotes", "Pacote Signature", "Solicitar proposta", "Prazo de entrega"],
  },
  {
    id: "package-signature",
    keywords: ["signature", "intermedio", "medio", "12999", "12.999"],
    response:
      "**Pacote Signature — 12.999 MT**\n\nA vossa narrativa visual elevada ao estado de arte. Inclui tudo do Essencial, mais:\n\n• Galeria editorial de memórias visuais\n• Módulo de storytelling do casal\n• Cronograma interativo do evento\n• Dashboard inteligente de RSVP\n• Lista de convidados digitalizada\n• Controlo preciso de acompanhantes\n• Direção de arte estendida\n\nPara quem concebe o evento como uma história.",
    quickReplies: ["Comparar pacotes", "Pacote Royal", "Solicitar proposta", "Como funciona"],
  },
  {
    id: "package-royal",
    keywords: ["royal", "premium", "completo", "exclusivo", "luxo", "19999", "19.999", "melhor"],
    response:
      "**Pacote Royal — 19.999 MT**\n\nA alta-costura do convite digital. Inclui tudo do Signature, mais:\n\n• Abertura cinemática e motion design\n• Credenciação por QR Code individual\n• Painel de controlo master de RSVP\n• Espaço curado para presentes e donativos\n• Gestão arquitetónica de mesas e setores\n• Acompanhamento premium HAXR até ao dia\n• Data & Analytics do perfil de convidados\n\nUma obra sob medida para eventos de grande escala.",
    quickReplies: ["Comparar pacotes", "Solicitar proposta", "Assessoria de eventos", "Prazo de entrega"],
  },
  {
    id: "compare-packages",
    keywords: ["comparar", "comparacao", "diferenca", "diferencas", "qual escolher", "qual melhor"],
    response:
      "**Comparação rápida dos pacotes de casamento:**\n\n| | Essencial | Signature | Royal |\n|---|---|---|---|\n| Preço | 5.999 MT | 12.999 MT | 19.999 MT |\n| Galeria de fotos | Opcional | ✓ | ✓ |\n| Storytelling | — | ✓ | ✓ |\n| QR Code entrada | — | — | ✓ |\n| Gestão de mesas | — | — | ✓ |\n| Abertura cinemática | — | — | ✓ |\n| Alterações | 2 rondas | 4 rondas | Sob medida |\n\nCada pacote pode ser complementado com funcionalidades adicionais.",
    quickReplies: ["Pacote Essencial", "Pacote Royal", "Solicitar proposta", "Falar com alguém"],
  },
  {
    id: "noivado",
    keywords: ["noivado", "preludro", "transicao", "save the date", "savethedate"],
    response:
      "**Pacotes para Noivado:**\n\n✦ **O Prelúdio** — 5.999 MT\nAnúncio elegante com RSVP, cápsula fotográfica, música e mapa.\n\n✦ **A Transição** — 12.999 MT\nSave the Date integrado, galeria visual, módulo de presentes e timeline detalhada.\n\nAmbos os pacotes incluem design responsivo e ativo digital para WhatsApp.",
    quickReplies: ["Preços casamento", "Solicitar proposta", "Prazo de entrega"],
  },
  {
    id: "corporativo",
    keywords: ["corporativo", "empresa", "gala", "conferencia", "lancamento", "institucional"],
    response:
      "**Eventos Corporativos — Sob Cotação**\n\nEngenharia digital de alta gama para galas, conferências e lançamentos:\n\n• Ecossistema fechado com acessos cifrados\n• RSVP Corporativo com fluxos inteligentes\n• Credenciação via QR Code dinâmico\n• Mapeamento VIP e gestão de protocolo\n• UI/UX alinhado ao brandbook da instituição\n• Analytics em tempo real\n\nContacte a linha executiva WhatsApp (+258 87 088 3428) para uma proposta à medida.",
    quickReplies: ["Solicitar proposta", "Falar com alguém", "Outros serviços"],
  },
  {
    id: "services",
    keywords: ["servicos", "servico", "fazem", "oferecem", "trabalham", "areas", "universo"],
    response:
      "A HAXR Signature actua em 5 áreas-chave:\n\n✦ **Convites Digitais** — Design premium com RSVP, galeria e QR Code\n✦ **Identidade Visual** — Assinatura estética coerente para todo o evento\n✦ **Assessoria de Eventos** — Planeamento, fornecedores e orçamento\n✦ **Coordenação no Dia** — Presença, organização e controlo\n✦ **Experiências Personalizadas** — Propostas exclusivas sob medida\n\nCada serviço é pensado com intenção, elegância e atenção ao detalhe.",
    quickReplies: ["Preços dos convites", "Assessoria de eventos", "Coordenação no dia", "Solicitar proposta"],
  },
  {
    id: "assessoria",
    keywords: ["assessoria", "planeamento", "planear", "organizar", "organizacao", "fornecedores"],
    response:
      "**Assessoria de Eventos**\n\nPlaneamento, curadoria e acompanhamento para eventos exclusivos:\n\n• Orientação sobre conceito, orçamento e estilo\n• Seleção e gestão de fornecedores\n• Cronograma detalhado e checklist\n• Alinhamento da identidade visual\n• Experiência fluida e personalizada\n\nCada evento é conduzido com atenção ao conceito, ao orçamento e à experiência final dos convidados. Os valores são apresentados sob proposta.",
    quickReplies: ["Coordenação no dia", "Solicitar proposta", "Preços convites", "Falar com alguém"],
  },
  {
    id: "coordenacao",
    keywords: ["coordenacao", "dia", "dia do evento", "montagem", "presencial"],
    response:
      "**Coordenação no Dia**\n\nPresença, organização e controlo para que tudo aconteça com elegância:\n\n• Acompanhamento da montagem\n• Orientação de fornecedores no local\n• Gestão do cronograma em tempo real\n• Resolução discreta de imprevistos\n• Garantia de fluidez e pontualidade\n\nEnquanto vive o momento, a nossa equipa cuida de tudo nos bastidores.",
    quickReplies: ["Assessoria completa", "Solicitar proposta", "Falar com alguém"],
  },
  {
    id: "deadline",
    keywords: ["prazo", "demora", "tempo", "antecedencia", "quando", "entrega", "dias", "semanas"],
    response:
      "Recomendamos o primeiro contacto com **6 a 8 semanas de antecedência** para garantir disponibilidade e tempo adequado para a curadoria.\n\nProjectos urgentes são avaliados caso a caso e podem estar sujeitos a acréscimo no valor final.\n\nOs prazos variam conforme a complexidade do serviço e a entrega atempada dos conteúdos pelo cliente.",
    quickReplies: ["Como funciona o processo", "Solicitar proposta", "Preços"],
  },
  {
    id: "payment",
    keywords: ["pagamento", "pagar", "mpesa", "transferencia", "parcela", "parcelas", "deposito"],
    response:
      "**Pagamentos**\n\nAs condições de pagamento são apresentadas na proposta de cada projecto.\n\n• A produção inicia após confirmação do pagamento inicial\n• As informações do evento devem ser enviadas de forma organizada\n• Pedidos urgentes podem ter acréscimo no valor final\n\nPara mais detalhes sobre uma proposta específica, fale directamente com a nossa equipa.",
    quickReplies: ["Solicitar proposta", "Falar com alguém", "Preços"],
  },
  {
    id: "alteracoes",
    keywords: ["alteracao", "alteracoes", "mudanca", "mudar", "revisao", "revisoes", "ronda"],
    response:
      "Cada pacote inclui um número definido de rondas de alteração:\n\n• **Essencial** — até 2 rondas\n• **Signature** — até 4 rondas\n• **Royal** — rondas definidas conforme a complexidade\n\nAjustes adicionais para além das rondas incluídas podem ter custo extra.",
    quickReplies: ["Comparar pacotes", "Solicitar proposta", "Preços"],
  },
  {
    id: "process",
    keywords: ["como funciona", "processo", "etapas", "passos", "metodo", "metodologia", "fluxo"],
    response:
      "**O Nosso Método**\n\nCada projecto segue um processo claro:\n\n1️⃣ **Primeiro contacto** — Compreendemos o evento, o perfil e o estilo pretendido\n2️⃣ **Proposta** — Apresentamos a solução personalizada com orçamento\n3️⃣ **Confirmação** — Pagamento inicial e envio das informações\n4️⃣ **Produção** — Design, curadoria e desenvolvimento\n5️⃣ **Revisões** — Rondas de ajuste conforme o pacote\n6️⃣ **Entrega** — Publicação e acompanhamento até ao dia\n\nToda decisão é tomada com intenção, garantindo uma experiência fluida e personalizada.",
    quickReplies: ["Preços", "Prazo de entrega", "Solicitar proposta"],
  },
  {
    id: "contact",
    keywords: ["contacto", "contato", "telefone", "numero", "email", "whatsapp", "ligar", "endereco", "localizacao", "onde", "maputo"],
    response:
      "**Contactos HAXR Signature**\n\n📍 Maputo, Moçambique\n📞 +258 820 883 478 | +258 870 883 428\n📧 info@haxrsignature.com\n📱 Instagram: @haxr.signature\n💬 WhatsApp: +258 870 883 428",
    quickReplies: ["Solicitar proposta", "Preços", "Serviços disponíveis"],
  },
  {
    id: "rsvp",
    keywords: ["rsvp", "confirmacao", "presenca", "convidados", "lista", "convite"],
    response:
      "Todos os nossos convites digitais incluem **confirmação de presença (RSVP) integrada**.\n\nOs pacotes Signature e Royal adicionam:\n• Dashboard inteligente de RSVP\n• Lista de convidados digitalizada\n• Controlo de acompanhantes\n• Relatório final de confirmações\n\nO pacote Royal acrescenta credenciação por QR Code individual e gestão de mesas.",
    quickReplies: ["Comparar pacotes", "Pacote Royal", "Solicitar proposta"],
  },
  {
    id: "eventos-tipos",
    keywords: ["casamento", "lobolo", "aniversario", "graduacao", "baptizado", "batizado", "celebracao", "evento"],
    response:
      "Acompanhamos diversos tipos de eventos:\n\n💍 Casamentos e Lobolos\n💎 Noivados\n🎂 Aniversários\n🎓 Graduações\n👶 Baptizados\n🏢 Eventos Corporativos\n✨ Experiências Personalizadas\n\nCada tipo de evento tem pacotes e soluções específicas. Sobre qual gostaria de saber mais?",
    quickReplies: ["Preços casamento", "Noivado", "Corporativo", "Aniversário"],
  },
  {
    id: "aniversario",
    keywords: ["aniversario", "anos", "celebracao", "festa"],
    response:
      "**Pacotes para Aniversários e Celebrações:**\n\n✦ **A Celebração** — 5.999 MT\nConvite digital com RSVP, música, mapa e cápsula fotográfica.\n\n✦ **O Jubileu** — 10.999 MT\nAbertura em motion, galeria de 15 momentos, mural de dedicatórias e cronograma interativo.\n\n✦ **A Conquista** (Graduações) — 11.999 MT\nGestão multi-evento, mapas para múltiplos locais e módulo de tributo.",
    quickReplies: ["Solicitar proposta", "Preços casamento", "Falar com alguém"],
  },
  {
    id: "identidade-visual",
    keywords: ["identidade", "visual", "logo", "logotipo", "marca", "branding", "design", "grafico"],
    response:
      "**Identidade Visual para Eventos**\n\nCada detalhe visual é pensado para comunicar o estilo e a essência da ocasião:\n\n• Convites e papelaria digital\n• Materiais de recepção e sinalização\n• Elementos de mesa e decoração\n• Lembranças personalizadas\n\nA identidade visual cria uma linguagem estética coerente, transformando o evento numa experiência memorável e sofisticada.",
    quickReplies: ["Serviços disponíveis", "Solicitar proposta", "Preços convites"],
  },
  {
    id: "concierge",
    keywords: ["concierge", "ia", "inteligencia", "artificial", "bot", "assistente", "haxr concierge", "tecnologia"],
    response:
      "**HAXR Concierge™**\n\nO nosso assistente inteligente que acompanha cada etapa do planeamento:\n\n• Sugestões de fornecedores verificados\n• Gestão de orçamento em tempo real\n• Checklist personalizada por tipo de evento\n• Moodboards e inspiração visual\n• Comunicação fluida com a equipa HAXR\n\nExperimente gratuitamente na página do HAXR Concierge.",
    quickReplies: ["Serviços disponíveis", "Preços", "Solicitar proposta"],
  },
  {
    id: "talk-human",
    keywords: ["falar", "pessoa", "humano", "atendente", "alguem", "ajuda", "nao entendo", "nao consegui"],
    response:
      "Compreendo! Vou ligar-te a alguém da equipa HAXR Signature. Escolhe o canal que preferires:",
    quickReplies: [],
  },
];

/* ------------------------------------------------------------------ */
/*  Greeting message                                                   */
/* ------------------------------------------------------------------ */

export const GREETING_MESSAGE: AssistantMessage = {
  id: "greeting-0",
  role: "assistant",
  text: "Olá! 👋 Sou o assistente da **HAXR Signature**. Posso ajudar com informações sobre pacotes, preços, serviços e processos.\n\nSobre o que gostaria de saber?",
  quickReplies: ["Preços dos convites", "Serviços disponíveis", "Como funciona", "Falar com alguém"],
  timestamp: new Date(),
};

/* ------------------------------------------------------------------ */
/*  Escalation helpers                                                 */
/* ------------------------------------------------------------------ */

export function getWhatsAppUrl(context?: string): string {
  const baseMsg = "Olá HAXR Signature, preciso de ajuda";
  const msg = context ? `${baseMsg}: ${context}` : `${baseMsg} com o meu evento.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

export function getEmailUrl(context?: string): string {
  const subject = encodeURIComponent("Pedido de informação — HAXR Signature");
  const body = context
    ? encodeURIComponent(`Olá HAXR Signature,\n\n${context}\n\nAguardo resposta.\nObrigado(a).`)
    : encodeURIComponent("Olá HAXR Signature,\n\nGostaria de obter mais informações sobre os vossos serviços.\n\nAguardo resposta.\nObrigado(a).");
  return `mailto:${EMAIL}?subject=${subject}&body=${body}`;
}

/* ------------------------------------------------------------------ */
/*  Intent Matching Engine                                             */
/* ------------------------------------------------------------------ */

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s]/g, " ")   // remove punctuation
    .replace(/\s+/g, " ")
    .trim();
}

type MatchResult = {
  intent: Intent;
  score: number;
};

export function findBestMatch(query: string): AssistantMessage {
  const normalized = normalize(query);
  const words = normalized.split(" ");

  const scores: MatchResult[] = intents.map((intent) => {
    let score = 0;
    for (const keyword of intent.keywords) {
      const kw = normalize(keyword);
      // Multi-word keyword match (e.g. "como funciona")
      if (kw.includes(" ")) {
        if (normalized.includes(kw)) {
          score += 3; // bonus for phrase match
        }
      } else {
        // Single-word match
        if (words.includes(kw)) {
          score += 2;
        } else if (normalized.includes(kw)) {
          score += 1; // partial match
        }
      }
    }
    return { intent, score };
  });

  scores.sort((a, b) => b.score - a.score);

  const best = scores[0];
  const THRESHOLD = 1;

  if (best && best.score >= THRESHOLD) {
    const isEscalation = best.intent.id === "talk-human";
    return {
      id: `resp-${Date.now()}`,
      role: "assistant",
      text: best.intent.response,
      quickReplies: best.intent.quickReplies,
      escalation: isEscalation,
      timestamp: new Date(),
    };
  }

  // Fallback — cannot answer
  return {
    id: `resp-${Date.now()}`,
    role: "assistant",
    text: "Peço desculpa, não consegui encontrar informação sobre isso. Posso ligar-te a alguém da equipa HAXR Signature para te ajudar directamente. Escolhe o canal que preferires:",
    quickReplies: [],
    escalation: true,
    timestamp: new Date(),
  };
}
