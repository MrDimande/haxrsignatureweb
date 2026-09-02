import type { SupplierCategoryId } from "@/lib/vendors/marketplace";

export type CategoryBudgetInsight = {
  category: SupplierCategoryId;
  label: string;
  percentageShare: string;
  averageRangeMZN: string;
  keyDrivers: string[];
  recommendation: string;
};

export const CATEGORY_BUDGET_GUIDELINES: Record<SupplierCategoryId, CategoryBudgetInsight> = {
  venues: {
    category: "venues",
    label: "Espaços & Quintas",
    percentageShare: "18% a 25%",
    averageRangeMZN: "150.000 MT – 450.000 MT",
    keyDrivers: ["Capacidade total", "Gerador próprio de alta potência", "Horário de música ao vivo", "Mesas e cadeiras incluídas"],
    recommendation: "O espaço é a fundação de todo o evento. Em Maputo, confirme sempre se a taxa de aluguer inclui segurança privada e limpeza pós-evento.",
  },
  photographers: {
    category: "photographers",
    label: "Fotografia Editorial",
    percentageShare: "10% a 15%",
    averageRangeMZN: "45.000 MT – 130.000 MT",
    keyDrivers: ["Número de fotógrafos", "Ensaio pré-casamento (Save the Date)", "Álbum impresso em couro/linho", "Tempo de entrega"],
    recommendation: "A fotografia é a memória perpétua do casamento. Pacotes com 2 fotógrafos garantem que os preparativos do noivo e da noiva são captados em simultâneo.",
  },
  videographers: {
    category: "videographers",
    label: "Vídeo & Cinema de Casamento",
    percentageShare: "8% a 14%",
    averageRangeMZN: "50.000 MT – 150.000 MT",
    keyDrivers: ["Imagens aéreas com drone", "Filme de 20-30min + Teaser de 1min", "Áudio de lapela na cerimónia", "Entrega em 4K"],
    recommendation: "Verifique se o videógrafo grava os votos com microfones dedicados para clareza acústica perfeita no filme final.",
  },
  caterers: {
    category: "caterers",
    label: "Catering & Gastronomia",
    percentageShare: "30% a 40%",
    averageRangeMZN: "1.200 MT – 3.500 MT / pessoa",
    keyDrivers: ["Menu empratado vs Buffet de autor", "Estações de marisco e corte ao vivo", "Bar aberto de cocktails", "Rácio garçons/mesas"],
    recommendation: "A gastronomia é o fator de maior impacto para os convidados. Recomenda-se prever degustação oficial 3 meses antes do grande dia.",
  },
  decor: {
    category: "decor",
    label: "Decoração & Cenografia Floral",
    percentageShare: "15% a 22%",
    averageRangeMZN: "60.000 MT – 280.000 MT",
    keyDrivers: ["Flores nobres importadas", "Arco floral e passadeira da cerimónia", "Lustres e iluminação cénica", "Toalhas e louças personalizadas"],
    recommendation: "Flores frescas no clima de Moçambique exigem transporte refrigerado e montagem no próprio dia para manterem o frescor radiante.",
  },
  music: {
    category: "music",
    label: "Música, Som & DJ de Gala",
    percentageShare: "5% a 10%",
    averageRangeMZN: "30.000 MT – 95.000 MT",
    keyDrivers: ["Sistema de som line-array", "DJ de renome + Saxofonista/Violino", "Pista de dança LED", "Efeitos visuais e faíscas frias"],
    recommendation: "A transição de som entre cerimónia exterior e salão interior deve ter mesas de mistura e microfones sem fios independentes.",
  },
  beauty: {
    category: "beauty",
    label: "Beleza de Noiva & Alta-Costura",
    percentageShare: "3% a 6%",
    averageRangeMZN: "15.000 MT – 50.000 MT",
    keyDrivers: ["Maquilhagem HD com teste prévio", "Penteado e colocação de véu/tiara", "Atendimento no quarto da noiva", "Beleza para mãe e madrinhas"],
    recommendation: "Agende o ensaio de maquilhagem para coincidir com a prova final do vestido de noiva para conferir a harmonia completa.",
  },
  stationery: {
    category: "stationery",
    label: "Convites & Papelaria Fina",
    percentageShare: "2% a 5%",
    averageRangeMZN: "12.500 MT – 45.000 MT",
    keyDrivers: ["Convite digital interativo HAXR", "Papel texturado com relevo e lacre", "Menus de mesa, marcadores e seating chart", "Lembranças de luxo"],
    recommendation: "A combinação de convite impresso para os mais velhos e convite digital interativo com RSVP para os convidados gerais poupa 40% do custo de papelaria.",
  },
  planning: {
    category: "planning",
    label: "Assessoria & Coordenação VIP",
    percentageShare: "8% a 15%",
    averageRangeMZN: "50.000 MT – 180.000 MT",
    keyDrivers: ["Assessoria completa de A a Z", "Gestão de contratos e orçamento", "Coordenação minuciosa do dia", "Equipa de 4-6 coordenadores"],
    recommendation: "Uma assessoria experiente economiza frequentemente mais do que o seu próprio custo através de negociação de contratos com outros fornecedores.",
  },
  other: {
    category: "other",
    label: "Outros Serviços Especiais",
    percentageShare: "3% a 7%",
    averageRangeMZN: "Sob consulta",
    keyDrivers: ["Carros clássicos / limousines", "Fogos de artifício e pirotecnia", "Segurança VIP e valet parking", "Animação infantil"],
    recommendation: "Consolide os serviços complementares com antecedência para garantir sincronização impecável com o cronograma do dia.",
  },
};

export function getCategoryBudgetInsight(category: SupplierCategoryId): CategoryBudgetInsight {
  return CATEGORY_BUDGET_GUIDELINES[category] ?? CATEGORY_BUDGET_GUIDELINES.other;
}
