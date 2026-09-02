export type WeddingFormat =
  | "afternoon_evening" // Cerimónia às 14h-16h + Banquete & Festa à Noite (Mais comum em Moçambique)
  | "day_wedding" // Cerimónia Matinal (10h-11h) + Almoço de Gala até ao Pôr do Sol
  | "sunset_wedding" // Cerimónia ao Pôr-do-Sol (16h-17h) + Festa Nocturna
  | "intimate_micro"; // Casamento Íntimo (Cerimónia + Jantar Elegante)

export type BridalPartyCount = "bride_only" | "bride_plus_2" | "bride_plus_4" | "bride_plus_6";
export type CeremonyLocationType = "separate_locations" | "same_venue";

export type TimelineGeneratorInput = {
  ceremonyTime: string; // "14:00", "15:30", etc.
  format: WeddingFormat;
  bridalPartyCount: BridalPartyCount;
  locationType: CeremonyLocationType;
  hasFirstLook: boolean;
  partyDurationHours: number; // e.g. 6, 8, 10
  coupleNames?: string;
  weddingDate?: string;
};

export type TimelineMilestoneCategory =
  | "prep" // Preparativos e Beleza
  | "photo_prep" // Fotografia nos Preparativos
  | "ceremony" // Cerimónia
  | "cocktail_photos" // Cocktail & Sessão Fotográfica
  | "reception" // Salão & Banquete
  | "protocol" // Discursos, Corte do Bolo, Brinde
  | "party"; // Dança & Festa

export type TimelineMilestone = {
  id: string;
  time: string; // "14:00"
  timeMinutes: number; // minutes from midnight (e.g. 14*60 = 840)
  title: string;
  description: string;
  category: TimelineMilestoneCategory;
  responsibleParties: string[]; // ["Noiva", "Fotógrafo", "Maquilhadora"]
  isKeyMilestone?: boolean;
};

export type WeddingTimelineResult = {
  input: TimelineGeneratorInput;
  milestones: TimelineMilestone[];
  wakeUpTime: string;
  partyEndTime: string;
  totalDurationHours: number;
  tips: string[];
};

/**
 * Converte "HH:MM" para minutos a partir da meia-noite
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Converte minutos a partir da meia-noite para formato "HH:MM"
 */
export function minutesToTime(minutes: number): string {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = Math.floor(normalized % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Calcula a duração necessária para cabelo e maquilhagem
 */
function getBeautyPrepDurationMinutes(partyCount: BridalPartyCount): number {
  switch (partyCount) {
    case "bride_only":
      return 120; // 2h
    case "bride_plus_2":
      return 180; // 3h
    case "bride_plus_4":
      return 240; // 4h
    case "bride_plus_6":
      return 300; // 5h
    default:
      return 240;
  }
}

/**
 * Motor de Cálculo Cronológico do Dia do Casamento
 */
export function generateWeddingTimeline(input: TimelineGeneratorInput): WeddingTimelineResult {
  const ceremonyMin = timeToMinutes(input.ceremonyTime);
  const beautyDuration = getBeautyPrepDurationMinutes(input.bridalPartyCount);
  const travelTime = input.locationType === "separate_locations" ? 45 : 15;

  const milestones: TimelineMilestone[] = [];

  const addMilestone = (
    timeMin: number,
    title: string,
    description: string,
    category: TimelineMilestoneCategory,
    responsible: string[],
    isKey = false,
  ) => {
    milestones.push({
      id: `${category}-${timeMin}-${milestones.length}`,
      time: minutesToTime(timeMin),
      timeMinutes: timeMin,
      title,
      description,
      category,
      responsibleParties: responsible,
      isKeyMilestone: isKey,
    });
  };

  // 1. Início do dia & Beleza
  const beautyStartMin = ceremonyMin - travelTime - 45 - beautyDuration;
  const wakeUpMin = beautyStartMin - 30;

  addMilestone(
    wakeUpMin,
    "Pequeno-Almoço & Hidratação da Noiva",
    "Momento de calma, alimentação leve e recepção da equipa de beleza no quarto da noiva.",
    "prep",
    ["Noiva", "Mãe da Noiva", "Assessora"],
  );

  addMilestone(
    beautyStartMin,
    "Início de Cabelo & Maquilhagem",
    "Equipa de beleza inicia os trabalhos de maquilhagem HD e penteados das madrinhas e da noiva.",
    "prep",
    ["Noiva", "Madrinhas", "Maquilhadora", "Cabeleireiro"],
  );

  // 2. Fotografia dos Preparativos
  const photoArrivalMin = ceremonyMin - travelTime - 105;
  addMilestone(
    photoArrivalMin,
    "Chegada dos Fotógrafos & Vídeo para Detalhes",
    "Fotografia dos detalhes essenciais: vestido de noiva, alianças, sapatos, perfume e papelaria fina.",
    "photo_prep",
    ["Fotógrafo", "Videógrafo", "Noiva"],
  );

  const groomPrepMin = ceremonyMin - travelTime - 90;
  addMilestone(
    groomPrepMin,
    "Preparativos do Noivo & Padrinhos",
    "Captação fotográfica do noivo a vestir o fato, abotoaduras, relógio e brinde inicial com os padrinhos.",
    "photo_prep",
    ["Noivo", "Padrinhos", "Fotógrafo Secundário"],
  );

  const brideDressedMin = ceremonyMin - travelTime - 45;
  addMilestone(
    brideDressedMin,
    "Noiva Pronta & Retratos Individuais de Alta-Costura",
    "Vestir o vestido, colocação do véu e jóias. Retratos individuais e primeiras fotos com a mãe e madrinhas.",
    "photo_prep",
    ["Noiva", "Mãe da Noiva", "Fotógrafo Principal"],
    true,
  );

  // First Look (se ativado)
  if (input.hasFirstLook) {
    const firstLookMin = ceremonyMin - travelTime - 25;
    addMilestone(
      firstLookMin,
      "First Look dos Noivos (Primeiro Olhar a Sós)",
      "Momento íntimo e emocionante onde os noivos se vêem pela primeira vez antes da cerimónia.",
      "photo_prep",
      ["Noiva", "Noivo", "Fotógrafo", "Videógrafo"],
      true,
    );
  }

  // 3. Deslocação & Recepção de Convidados
  const departureMin = ceremonyMin - travelTime;
  addMilestone(
    departureMin,
    "Partida da Noiva para a Cerimónia",
    input.locationType === "separate_locations"
      ? "Carro clássico/transporte oficial conduz a noiva e o pai até à igreja/local da cerimónia."
      : "Noiva aguarda no quarto/suite para descer até à nave nupcial.",
    "ceremony",
    ["Noiva", "Pai da Noiva", "Motorista", "Assessora"],
  );

  const guestsArrivalMin = ceremonyMin - 30;
  addMilestone(
    guestsArrivalMin,
    "Chegada & Acolhimento dos Convidados",
    "Música instrumental ambiente, entrega de leques/programas e convidados tomam os seus lugares.",
    "ceremony",
    ["Convidados", "Noivo", "Assessoria & Protocolo"],
  );

  // 4. Cerimónia
  addMilestone(
    ceremonyMin,
    "Entrada Nupcial & Início da Cerimónia",
    "Entrada do noivo com a mãe, cortejo de padrinhos, damas de honor e a Entrada Triunfal da Noiva.",
    "ceremony",
    ["Noivos", "Padrinhos", "Celebrante", "Músicos"],
    true,
  );

  const ceremonyDuration = input.format === "intimate_micro" ? 45 : 75;
  const ceremonyEndMin = ceremonyMin + ceremonyDuration;

  addMilestone(
    ceremonyEndMin,
    "Fim da Cerimónia, Saída com Chuva de Pétalas & Felicitações",
    "Troca de alianças, beijo oficial, bênção final e saída dos noivos sob chuva de pétalas de rosa.",
    "ceremony",
    ["Noivos", "Convidados", "Fotógrafo"],
    true,
  );

  // 5. Cocktail & Sessão Fotográfica
  const cocktailMin = ceremonyEndMin + 15;
  addMilestone(
    cocktailMin,
    "Início do Cocktail de Boas-Vindas & Canapés",
    "Convidados desfrutam de cocktails de assinatura, mariscos, canapés finos e música acústica/saxofone.",
    "cocktail_photos",
    ["Convidados", "Catering & Bar", "Músicos Acústicos"],
  );

  const photoSessionMin = cocktailMin + 20;
  addMilestone(
    photoSessionMin,
    "Sessão Fotográfica Oficial dos Noivos & Padrinhos (Golden Hour)",
    "Fotos oficiais de família, padrinhos e ensaio romântico dos recém-casados com a luz dourada do pôr-do-sol.",
    "cocktail_photos",
    ["Noivos", "Padrinhos", "Família Direta", "Fotógrafo", "Videógrafo"],
    true,
  );

  // 6. Banquete & Salão Principal (Tempo adequado para desfrutar o cocktail)
  const cocktailDuration = input.format === "day_wedding" ? 90 : 120;
  const hallCallMin = cocktailMin + cocktailDuration;

  addMilestone(
    hallCallMin,
    "Abertura das Portas do Salão Principal & Seating",
    "Convidados são convidados a entrar no salão e encontram os seus lugares no Seating Chart.",
    "reception",
    ["Convidados", "Assessora & Hostesses"],
  );

  const grandEntranceMin = hallCallMin + 30;
  addMilestone(
    grandEntranceMin,
    "Entrada Triunfal dos Noivos no Salão",
    "Entrada enérgica dos recém-casados ao som da música de assinatura escolhida, com aplausos de pé.",
    "reception",
    ["Noivos", "DJ / Banda", "Convidados"],
    true,
  );

  const dinnerStartMin = grandEntranceMin + 25;
  addMilestone(
    dinnerStartMin,
    "Serviço de Jantar & Banquete de Gala",
    "Início do serviço gastronómico (Entrada, Prato Principal e Sobremesas de Autor).",
    "reception",
    ["Catering & Chef", "Convidados"],
  );

  // 7. Protocolo: Discursos, Corte do Bolo, Brinde
  const speechesMin = dinnerStartMin + 85;
  addMilestone(
    speechesMin,
    "Discursos dos Pais, Padrinhos & Agradecimento dos Noivos",
    "Momento nobre de homenagens, palavras de carinho dos pais e dos melhores amigos.",
    "protocol",
    ["Pais dos Noivos", "Padrinhos", "Noivos"],
  );

  const cakeCuttingMin = speechesMin + 40;
  addMilestone(
    cakeCuttingMin,
    "Corte do Bolo Nupcial & Brinde Oficial de Champanhe",
    "Corte oficial do bolo de noiva com faíscas frias/iluminação cénica e brinde de champanhe com todos os convidados.",
    "protocol",
    ["Noivos", "Convidados", "Fotógrafo & Vídeo", "Catering"],
    true,
  );

  // 8. Primeira Dança & Abertura de Pista
  const firstDanceMin = cakeCuttingMin + 25;
  addMilestone(
    firstDanceMin,
    "Primeira Dança dos Recém-Casados & Dança com os Pais",
    "Dança romântica dos noivos no centro da pista (com nuvem baixa de fumo), seguida da dança com os pais.",
    "party",
    ["Noivos", "Pais dos Noivos", "DJ"],
    true,
  );

  const partyStartMin = firstDanceMin + 15;
  addMilestone(
    partyStartMin,
    "Abertura Oficial da Pista de Dança & DJ de Gala",
    "DJ eleva a energia, distribuição de adereços de festa e abertura do bar de cocktails noturno.",
    "party",
    ["DJ", "Convidados", "Noivos", "Bar Staff"],
  );

  // 9. Ceia da Madrugada & Encerramento
  const partyDurationMin = input.partyDurationHours * 60;
  const midnightSnackMin = partyStartMin + 120;

  addMilestone(
    midnightSnackMin,
    "Ceia da Madrugada / Estação Noturna",
    "Serviço de snacks quentes (mini hambúrgueres gourmet, pregos e caldo) para revigorar a pista.",
    "party",
    ["Catering", "Convidados"],
  );

  const partyEndMin = partyStartMin + partyDurationMin;
  addMilestone(
    partyEndMin,
    "Última Música & Despedida Triunfal dos Noivos",
    "Encerramento épico da celebração com a música final e partida dos noivos.",
    "party",
    ["Noivos", "Convidados", "DJ", "Assessora"],
    true,
  );

  // Ordenar cronologicamente
  milestones.sort((a, b) => a.timeMinutes - b.timeMinutes);

  const totalDurationHours = Math.round(((partyEndMin - wakeUpMin) / 60) * 10) / 10;

  const tips = [
    "Adicione sempre 15 a 20 minutos de margem nos preparativos de maquilhagem para absorver imprevistos sem stress.",
    "Certifique-se de que o fotógrafo e videógrafo recebem uma cópia impressa deste cronograma antes do grande dia.",
    "Em Moçambique, a Golden Hour (melhor luz para fotografia dos noivos) ocorre habitualmente entre as 16h30 e as 17h30.",
    "Combine previamente com a assessora quem fará o pagamento de cachets finais de artistas e gorjetas.",
  ];

  return {
    input,
    milestones,
    wakeUpTime: minutesToTime(wakeUpMin),
    partyEndTime: minutesToTime(partyEndMin),
    totalDurationHours,
    tips,
  };
}

/**
 * Gera mensagem formatada para partilha direta no WhatsApp
 */
export function formatTimelineWhatsAppMessage(result: WeddingTimelineResult): string {
  const couple = result.input.coupleNames ? `Casamento de ${result.input.coupleNames}` : "Cronograma Oficial do Casamento";
  const date = result.input.weddingDate ? ` 📅 ${result.input.weddingDate}` : "";

  const lines = [
    `✨ *${couple.toUpperCase()}*${date}`,
    `⏱️ *CRONOGRAMA MINUTO A MINUTO (HAXR SIGNATURE)*`,
    `──────────────────────────`,
    `⏰ Início dos Preparativos: *${result.wakeUpTime}*`,
    `💍 Cerimónia Nupcial: *${result.input.ceremonyTime}*`,
    `🎉 Encerramento da Festa: *${result.partyEndTime}*`,
    `──────────────────────────`,
    ``,
  ];

  result.milestones.forEach((m) => {
    const star = m.isKeyMilestone ? " ⭐" : "";
    lines.push(`• *${m.time}* — ${m.title}${star}`);
    lines.push(`   _${m.description}_`);
    lines.push(`   👥 Resp: ${m.responsibleParties.join(", ")}`);
    lines.push(``);
  });

  lines.push(`──────────────────────────`);
  lines.push(`💡 *Dica HAXR:* ${result.tips[0]}`);
  lines.push(`📲 Gerado via HAXR Signature — Planeamento de Alto Padrão.`);

  return lines.join("\n");
}
