import { HAXR_BRAND_ASSETS } from "@/lib/brand/brand-assets";
import type { EventGuest, ManagedEvent } from "@/lib/events/types";
import {
  formatTableName,
  HUMAN_EVENT_TYPE_LABELS,
  type GuestTableGroup,
  type GuestReportStats,
  type GuestReportReadiness,
} from "./report";

export interface BrandPdfTokens {
  brandName: string;
  brandUpper: string;
  brandTagline: string;
  coverEditionLabel: string;
  runningHeaderBrand: string;
  runningFooterBrand: string;
  signatureStamp: string;
  heroLogoPath: string;
  navLogoPath: string;
  signatureMarkPath?: string | null;
  isHaxr: boolean;
  backCover: {
    bg: string;
    textPrimary: string;
    textMuted: string;
    goldAccent: string;
    tagline: string;
    subTagline: string;
    website: string;
    websiteUrl?: string | null;
    phone?: string | null;
    email?: string | null;
    instagram?: string | null;
    instagramUrl?: string | null;
    facebook?: string | null;
    facebookUrl?: string | null;
    qrLabel?: string | null;
  };
  colors: {
    pageBg: string;
    cardBg: string;
    cardSecondaryBg: string;
    cardBorder: string;
    borderHairline: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    goldAccent: string;
    goldDark: string;
    goldLightBg: string;
    goldBorder: string;
    statusConfirmedBg: string;
    statusConfirmedText: string;
    statusConfirmedBorder: string;
    statusCheckedInBg: string;
    statusCheckedInText: string;
    statusCheckedInBorder: string;
    statusInvitedBg: string;
    statusInvitedText: string;
    statusInvitedBorder: string;
    statusDeclinedBg: string;
    statusDeclinedText: string;
    statusDeclinedBorder: string;
  };
}

/**
 * Resolve os tokens de apresentação e marca para PDF a partir da Business.
 * Garante isolamento estrito de marca para evitar qualquer fuga de identidade HAXR em documentos de outras marcas.
 */
export function resolveBrandPdfTokens(
  businessName?: string | null,
  businessId?: string | null,
  businessLogo?: string | null
): BrandPdfTokens {
  const rawName = (businessName || "").trim();
  const rawId = (businessId || "").toLowerCase().trim();
  const isHaxr = !rawId.includes("brainy") && (!rawName || rawName.toLowerCase().includes("haxr"));

  if (isHaxr) {
    return {
      brandName: "HAXR Signature",
      brandUpper: "HAXR SIGNATURE",
      brandTagline: "EVENT OPERATIONS & LUXURY BANQUETING ATELIER",
      coverEditionLabel: "EVENT OPERATIONS EDITION",
      runningHeaderBrand: "HAXR SIGNATURE · EVENT OPERATIONS",
      runningFooterBrand: "HAXR SIGNATURE · EVENT OPERATIONS",
      signatureStamp: "Prepared by HAXR Signature Event Operations",
      heroLogoPath: HAXR_BRAND_ASSETS.verticalGold || HAXR_BRAND_ASSETS.horizontalGold,
      navLogoPath: HAXR_BRAND_ASSETS.horizontalGold,
      signatureMarkPath: "/images/brand/aldimande-signature-gold.png",
      isHaxr: true,
      backCover: {
        bg: "#0C0C0D",
        textPrimary: "#F6F4EE",
        textMuted: "#8E887E",
        goldAccent: "#C9A227",
        tagline: "CADA DETALHE.",
        subTagline: "UMA ASSINATURA.",
        website: "haxrsignature.com",
        websiteUrl: "https://www.haxrsignature.com",
        phone: "+258 87 088 3428",
        email: "info@haxrsignature.com",
        instagram: "@haxr.signature",
        instagramUrl: "https://www.instagram.com/haxr.signature/",
        facebook: "HAXR Signature",
        facebookUrl: "https://web.facebook.com/profile.php?id=61591714832967",
        qrLabel: null,
      },
      colors: {
        pageBg: "#FDFCFB",
        cardBg: "#FAF7F2",
        cardSecondaryBg: "#F4EFEA",
        cardBorder: "#E8E2D8",
        borderHairline: "#EFEBE4",
        textPrimary: "#1A1A1A",
        textSecondary: "#4A4742",
        textMuted: "#7A756E",
        goldAccent: "#C9A227",
        goldDark: "#96781A",
        goldLightBg: "#FBF8F0",
        goldBorder: "#E5D5A5",
        statusConfirmedBg: "#EDF5F0",
        statusConfirmedText: "#1B6A42",
        statusConfirmedBorder: "#C3DEC9",
        statusCheckedInBg: "#F8F4EA",
        statusCheckedInText: "#7A5C10",
        statusCheckedInBorder: "#E8DCB5",
        statusInvitedBg: "#F5F3EF",
        statusInvitedText: "#635F57",
        statusInvitedBorder: "#DDD8CE",
        statusDeclinedBg: "#F8F2F2",
        statusDeclinedText: "#7A3A3A",
        statusDeclinedBorder: "#E2C8C8",
      },
    };
  }

  // Multi-business (ex: BrainyWrite ou parceiro corporativo)
  const resolvedName = rawName || "BrainyWrite";
  const upper = resolvedName.toUpperCase();
  const logo = businessLogo || "/images/businesses/brainywrite.webp";

  return {
    brandName: resolvedName,
    brandUpper: upper,
    brandTagline: `${upper} CORPORATE OPERATIONS`,
    coverEditionLabel: `${upper} OPERATIONS EDITION`,
    runningHeaderBrand: `${upper} · EVENT OPERATIONS`,
    runningFooterBrand: `${upper} · EVENT OPERATIONS`,
    signatureStamp: `Prepared by ${resolvedName} Operations`,
    heroLogoPath: logo,
    navLogoPath: logo,
    signatureMarkPath: null,
    isHaxr: false,
    backCover: {
      bg: "#FAFBFC",
      textPrimary: "#151B26",
      textMuted: "#6B778C",
      goldAccent: "#2E5B88",
      tagline: "EXCELÊNCIA OPERACIONAL.",
      subTagline: "GESTÃO INTEGRADA DE EVENTOS.",
      website: "brainywrite.com",
      websiteUrl: "https://brainywrite.com",
      phone: null,
      email: null,
      instagram: null,
      instagramUrl: null,
      facebook: null,
      facebookUrl: null,
      qrLabel: null,
    },
    colors: {
      pageBg: "#FAFBFC",
      cardBg: "#F4F6F9",
      cardSecondaryBg: "#EBF0F5",
      cardBorder: "#DCE2EB",
      borderHairline: "#E6EBF2",
      textPrimary: "#151B26",
      textSecondary: "#3D485C",
      textMuted: "#6B778C",
      goldAccent: "#2E5B88",
      goldDark: "#1E3D5C",
      goldLightBg: "#F0F4F8",
      goldBorder: "#CBD7E6",
      statusConfirmedBg: "#EBF5EE",
      statusConfirmedText: "#18633B",
      statusConfirmedBorder: "#C0DFCC",
      statusCheckedInBg: "#EEF2F7",
      statusCheckedInText: "#25486B",
      statusCheckedInBorder: "#CDD8E5",
      statusInvitedBg: "#F0F2F5",
      statusInvitedText: "#57606E",
      statusInvitedBorder: "#D5D9E0",
      statusDeclinedBg: "#F7EDED",
      statusDeclinedText: "#7A2E2E",
      statusDeclinedBorder: "#E2C5C5",
    },
  };
}

export interface OperationalConclusionData {
  attendanceStatement: string;
  rsvpStatement: string;
  seatingStatement: string;
  dietaryStatement: string;
  checkInStatement: string;
  plannerNotes?: string | null;
}

/**
 * Constrói a síntese factual para o capítulo final de Conclusão Operacional.
 * Gera unicamente afirmações derivadas de dados reais de métricas e prontidão.
 */
export function buildOperationalConclusionData(report: {
  stats: GuestReportStats;
  readiness: GuestReportReadiness;
  tableGroups?: GuestTableGroup[];
  plannerNotes?: string | null;
}): OperationalConclusionData {
  const { stats, readiness, tableGroups = [] } = report;

  const totalGuests = stats.primaryGuests;
  const expectedAttendance = stats.expectedAttendance;
  const companions = stats.attendingPlusOnes;
  const pending = stats.invited;
  const confirmed = stats.confirmed;
  const checkedIn = stats.checkedIn;
  const declined = stats.declined;

  // 1. Presenças e Acompanhantes
  const attendanceStatement = `${totalGuests} convidados principais elegíveis com previsão de ${expectedAttendance} presenças (${companions} acompanhantes confirmados).`;

  // 2. Estado de RSVP
  let rsvpStatement = "";
  if (totalGuests === 0) {
    rsvpStatement = "A lista de convidados não contém registos elegíveis à data desta edição.";
  } else if (pending === 0) {
    rsvpStatement = "O processo de RSVP encontra-se concluído, sem respostas pendentes à data desta edição.";
  } else {
    rsvpStatement = `O processo de RSVP regista ${confirmed + checkedIn} presenças confirmadas, ${declined} recusas e ${pending} respostas pendentes.`;
  }

  // 3. Distribuição de Mesas
  let seatingStatement = "";
  if (!readiness.hasSeating) {
    seatingStatement = "A distribuição de mesas ainda não foi iniciada e, por isso, não integra esta edição do Livro de Operações.";
  } else if (stats.unassignedGuests > 0) {
    seatingStatement = `A distribuição de mesas encontra-se em curso, com ${stats.assignedGuests} convidados distribuídos e ${stats.unassignedGuests} por distribuir.`;
  } else {
    seatingStatement = `A distribuição de mesas encontra-se concluída, com ${tableGroups.length} mesas configuradas e acomodação integral.`;
  }

  // 4. Necessidades Alimentares
  let dietaryStatement = "";
  if (readiness.hasDietaryRequirements) {
    dietaryStatement = `Foram registadas ${stats.dietaryCount} necessidades alimentares específicas, consolidadas no Manifesto de Cozinha.`;
  } else {
    dietaryStatement = "Não foram registadas restrições alimentares específicas até à data desta edição.";
  }

  // 5. Controlo de Presenças / Check-in
  let checkInStatement = "";
  if (checkedIn > 0) {
    checkInStatement = `O controlo de presenças regista ${checkedIn} entradas confirmadas à data desta edição.`;
  } else {
    checkInStatement = "O controlo de presenças (check-in) iniciar-se-á na recepção dos convidados no dia do evento.";
  }

  return {
    attendanceStatement,
    rsvpStatement,
    seatingStatement,
    dietaryStatement,
    checkInStatement,
    plannerNotes: report.plannerNotes?.trim() || null,
  };
}

/**
 * Formata o tipo de evento para a capa editorial em letras maiúsculas espaçadas.
 */
export function formatCoverEventType(event: ManagedEvent): string {
  const label = HUMAN_EVENT_TYPE_LABELS[event.type] || event.type || "Evento";
  return label.toUpperCase();
}

/**
 * Calcula a paginação balanceada determinística de convidados para evitar que
 * a última página de um registo de 120 convidados fique com 1 ou 2 linhas órfãs.
 *
 * Para o livro de convidados:
 * - Página 1: Capa (0 convidados)
 * - Página 2: Resumo Executivo (0 convidados)
 * - Página 3+: Registo Mestre.
 *   - Na página de abertura do capítulo (Página 3), a introdução editorial consome espaço.
 *     Capacidade típica: ~22 a 26 linhas.
 *   - Nas páginas de continuação subsequentes, com cabeçalho de tabela repetido (`fixed`),
 *     a capacidade normal é de ~30 a 34 linhas por página.
 *
 * Quando o número total de linhas deixaria um resto de 1 a 3 linhas na página final,
 * esta função redistribui as linhas entre as páginas para garantir equilíbrio estético.
 */
export function computeBalancedGuestRegistryPages(
  guests: EventGuest[],
  firstPageLimit = 24,
  continuationLimit = 32
): EventGuest[][] {
  if (guests.length === 0) return [];
  if (guests.length <= firstPageLimit) {
    return [guests];
  }

  // Se cabe em 2 páginas mas a segunda ficaria com <= 3 linhas:
  const remainingAfterFirst = guests.length - firstPageLimit;
  if (remainingAfterFirst <= continuationLimit) {
    if (remainingAfterFirst <= 3) {
      // Balanceia as duas páginas dividindo a meio
      const mid = Math.ceil(guests.length / 2);
      return [guests.slice(0, mid), guests.slice(mid)];
    }
    return [guests.slice(0, firstPageLimit), guests.slice(firstPageLimit)];
  }

  // Para 3 ou mais páginas (ex: 120 convidados):
  const pages: EventGuest[][] = [];
  const firstPage = guests.slice(0, firstPageLimit);
  pages.push(firstPage);

  const remaining = guests.slice(firstPageLimit);
  let offset = 0;

  while (offset < remaining.length) {
    const left = remaining.length - offset;
    if (left > continuationLimit && left <= continuationLimit + 3) {
      const splitSize = Math.ceil(left / 2);
      pages.push(remaining.slice(offset, offset + splitSize));
      offset += splitSize;
      pages.push(remaining.slice(offset));
      break;
    }

    const pageSize = Math.min(continuationLimit, left);
    pages.push(remaining.slice(offset, offset + pageSize));
    offset += pageSize;
  }

  // Se a última página ainda ficou com 1 ou 2 linhas, retira da penúltima para equilibrar
  if (pages.length >= 2) {
    const lastPage = pages[pages.length - 1];
    const prevPage = pages[pages.length - 2];
    if (lastPage.length <= 3 && prevPage.length > 10) {
      const takeCount = Math.ceil((prevPage.length + lastPage.length) / 2) - lastPage.length;
      if (takeCount > 0) {
        const moved = prevPage.splice(prevPage.length - takeCount, takeCount);
        lastPage.unshift(...moved);
      }
    }
  }

  return pages;
}

export interface PresentationTableCard {
  cardKey: string;
  tableName: string;
  displayTitle: string;
  capacityText: string;
  isContinuation: boolean;
  seats: GuestTableGroup["seats"];
}

/**
 * Converte os grupos de mesas em cartões de apresentação para o PDF.
 * Se uma única mesa tiver mais lugares ocupados do que o limite de uma página (~36),
 * divide a mesa em cartões balanceados com cabeçalho explícito de continuação:
 * "MESA IMPERIAL MAGNA · CONTINUAÇÃO"
 *
 * Mesas normais (ex: 8-24 lugares) mantêm-se como um único cartão intacto.
 */
export function buildPresentationTableCards(
  tableGroups: GuestTableGroup[],
  options?: {
    firstPageThreshold?: number;
    continuationPageThreshold?: number;
    shouldReportExactSeat?: boolean;
  }
): PresentationTableCard[] {
  const firstPageThreshold = options?.firstPageThreshold ?? 36;
  const continuationPageThreshold = options?.continuationPageThreshold ?? 40;
  const showExactSeat = Boolean(options?.shouldReportExactSeat);
  const cards: PresentationTableCard[] = [];

  for (const group of tableGroups) {
    const occupiedSeats = group.seats.filter((s) => Boolean(s.guest));
    if (occupiedSeats.length <= firstPageThreshold) {
      cards.push({
        cardKey: `tbl-${group.tableName}`,
        tableName: group.tableName,
        displayTitle: formatTableName(group.tableName),
        capacityText: showExactSeat
          ? `${group.assignedSeats} de ${group.totalSeats} lugares ocupados (Lugares 1 a ${group.totalSeats})`
          : `${group.assignedSeats} de ${group.totalSeats} lugares ocupados`,
        isContinuation: false,
        seats: occupiedSeats,
      });
    } else {
      // Mesa grande que ultrapassa a capacidade de uma página
      // Primeiro chunk: capacidade da página de abertura (~36)
      // Chunks seguintes: capacidade de páginas de continuação (~40)
      let offset = 0;
      let chunkIdx = 0;

      while (offset < occupiedSeats.length) {
        const isFirst = chunkIdx === 0;
        const currentLimit = isFirst ? firstPageThreshold : continuationPageThreshold;
        const left = occupiedSeats.length - offset;
        const sliceSize = Math.min(currentLimit, left);
        const slice = occupiedSeats.slice(offset, offset + sliceSize);

        const startSeat = offset + 1;
        const endSeat = offset + slice.length;

        let capacityText: string;
        if (isFirst) {
          capacityText = showExactSeat
            ? `${group.assignedSeats} de ${group.totalSeats} lugares ocupados (Lugares ${startSeat} a ${endSeat})`
            : `${group.assignedSeats} de ${group.totalSeats} lugares ocupados`;
        } else {
          capacityText = showExactSeat
            ? `Lugares ${startSeat} a ${endSeat} (${slice.length} de ${occupiedSeats.length} convidados)`
            : `${slice.length} convidados nesta continuação`;
        }

        cards.push({
          cardKey: `tbl-${group.tableName}-chunk-${chunkIdx}`,
          tableName: group.tableName,
          displayTitle: isFirst
            ? formatTableName(group.tableName)
            : `${formatTableName(group.tableName)} · CONTINUAÇÃO ${chunkIdx > 1 ? `(${chunkIdx + 1})` : ""}`.trim(),
          capacityText,
          isContinuation: !isFirst,
          seats: slice,
        });

        offset += sliceSize;
        chunkIdx++;
      }
    }
  }

  return cards;
}
