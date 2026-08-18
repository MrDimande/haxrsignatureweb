"use client";

import { useState, useEffect, useMemo, useId } from "react";
import {
  DollarSign, Plus, Trash2, RotateCcw,
  MessageCircle, ArrowLeft, Wallet, Percent,
  CheckCircle2,
  FileSpreadsheet, SlidersHorizontal,
  TrendingUp, Building2, Utensils,
  Camera, Music, Shirt, Search,
  ArrowUpRight, Check, X, Printer,
  ShieldCheck, Clock, Crown,
  ChevronRight, Flower2, Receipt,
  PieChart, Lightbulb, Info, FileText,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import MarketingToolBanner from "@/components/marketing/MarketingToolBanner";
import ToolProductionCta from "@/components/marketing/ToolProductionCta";

export type Currency = "MZN" | "USD" | "EUR" | "ZAR";

const CURRENCY_CONFIG: Record<Currency, { symbol: string; rateFromMzn: number; label: string }> = {
  MZN: { symbol: "MT", rateFromMzn: 1, label: "Metical Moçambicano" },
  USD: { symbol: "$", rateFromMzn: 0.0156, label: "Dólar Americano" },
  EUR: { symbol: "€", rateFromMzn: 0.0145, label: "Euro" },
  ZAR: { symbol: "R", rateFromMzn: 0.285, label: "Rand Sul-Africano" },
};

export interface Expense {
  id: string;
  name: string;
  category: string;
  planned: number; // Stored always in MZN
  paid: number;    // Stored always in MZN
  status: "Pendente" | "Sinalizado" | "Pago";
}

export type PriorityProfile = "balanced" | "gastronomy" | "visual_media" | "atmosphere";

interface CategoryBenchmark {
  name: string;
  icon: typeof Building2;
  share: Record<PriorityProfile, number>;
  sampleItems: { name: string; shareOfCat: number }[];
  color: string;
  badgeBg: string;
  description: string;
  vendorCategorySlug?: string;
}

const CATEGORY_BENCHMARKS: CategoryBenchmark[] = [
  {
    name: "Espaço & Salão Nobre",
    icon: Building2,
    share: { balanced: 0.22, gastronomy: 0.24, visual_media: 0.18, atmosphere: 0.20 },
    sampleItems: [
      { name: "Aluguer Exclusivo de Salão & Jardim Privado", shareOfCat: 0.85 },
      { name: "Segurança de Protocolo & Valet Parking", shareOfCat: 0.15 },
    ],
    color: "#B88A2A", // Brand Gold
    badgeBg: "rgba(184, 138, 42, 0.12)",
    description: "Cenário físico, exclusividade de horário e infraestrutura climatizada.",
    vendorCategorySlug: "espacos",
  },
  {
    name: "Catering & Alta Gastronomia",
    icon: Utensils,
    share: { balanced: 0.26, gastronomy: 0.35, visual_media: 0.20, atmosphere: 0.22 },
    sampleItems: [
      { name: "Buffet Gourmet & Cocktail de Boas-Vindas", shareOfCat: 0.72 },
      { name: "Bar Aberto Premium & Espumantes Selecionados", shareOfCat: 0.20 },
      { name: "Bolo de Noiva de Alta Confeitaria & Doces Finos", shareOfCat: 0.08 },
    ],
    color: "#9E825A", // Deep Gold
    badgeBg: "rgba(158, 130, 90, 0.12)",
    description: "Experiência de degustação, empratamento de luxo e carta de bebidas finas.",
    vendorCategorySlug: "catering",
  },
  {
    name: "Decoração & Arte Floral",
    icon: Flower2,
    share: { balanced: 0.16, gastronomy: 0.12, visual_media: 0.18, atmosphere: 0.16 },
    sampleItems: [
      { name: "Cenografia de Altar, Mesa dos Noivos & Aéreos", shareOfCat: 0.65 },
      { name: "Arranjos Florais com Flores Importadas & Centros", shareOfCat: 0.25 },
      { name: "Iluminação Cénica & Mobiliário Imperial", shareOfCat: 0.10 },
    ],
    color: "#6F7E5A", // Brand Eucalyptus
    badgeBg: "rgba(111, 126, 90, 0.12)",
    description: "Conceito visual, design botânico, paleta de cores e atmosfera cénica.",
    vendorCategorySlug: "decoracao",
  },
  {
    name: "Fotografia & Cinema Documental",
    icon: Camera,
    share: { balanced: 0.12, gastronomy: 0.08, visual_media: 0.20, atmosphere: 0.10 },
    sampleItems: [
      { name: "Cobertura Fotográfica Editorial (2 Fotógrafos)", shareOfCat: 0.55 },
      { name: "Cinema 4K Documental, Drone Teaser & Live Edit", shareOfCat: 0.45 },
    ],
    color: "#57534E", // Charcoal Slate
    badgeBg: "rgba(87, 83, 78, 0.10)",
    description: "Memória histórica, direção artística e álbuns encadernados em couro nobre.",
    vendorCategorySlug: "fotografia",
  },
  {
    name: "Assessoria & Coordenação HAXR",
    icon: Crown,
    share: { balanced: 0.09, gastronomy: 0.07, visual_media: 0.09, atmosphere: 0.09 },
    sampleItems: [
      { name: "Assessoria Completa & Gestão de Protocolo HAXR", shareOfCat: 1.0 },
    ],
    color: "#1C1A17", // Brand Text Dark
    badgeBg: "rgba(28, 26, 23, 0.08)",
    description: "Auditoria de contratos, cronograma ao minuto e tranquilidade dos noivos.",
    vendorCategorySlug: "assessoria",
  },
  {
    name: "Música & Alta Performance",
    icon: Music,
    share: { balanced: 0.06, gastronomy: 0.05, visual_media: 0.06, atmosphere: 0.12 },
    sampleItems: [
      { name: "DJ Curador, Sound System Acústico & Iluminação", shareOfCat: 0.65 },
      { name: "Saxofonista / Quarteto de Cordas no Cocktail", shareOfCat: 0.35 },
    ],
    color: "#B88A2A", // Brand Gold
    badgeBg: "rgba(184, 138, 42, 0.10)",
    description: "Curadoria sonora, transições de energia da festa e acústica refinada.",
    vendorCategorySlug: "musica",
  },
  {
    name: "Vestuário, Joalharia & Beleza",
    icon: Shirt,
    share: { balanced: 0.05, gastronomy: 0.05, visual_media: 0.05, atmosphere: 0.07 },
    sampleItems: [
      { name: "Vestido de Alta Costura, Smoking & Calçado Nobre", shareOfCat: 0.70 },
      { name: "Hair Styling & Make-up Artistry para o Casal", shareOfCat: 0.30 },
    ],
    color: "#A38668", // Warm Cashmere
    badgeBg: "rgba(163, 134, 104, 0.12)",
    description: "Imagem pessoal, tecidos italianos e cuidados de beleza de spa.",
    vendorCategorySlug: "beleza",
  },
  {
    name: "Reserva Estratégica & Contingência",
    icon: ShieldCheck,
    share: { balanced: 0.04, gastronomy: 0.04, visual_media: 0.04, atmosphere: 0.04 },
    sampleItems: [
      { name: "Fundo de Segurança para Imprevistos & Extras (5%)", shareOfCat: 1.0 },
    ],
    color: "#57534E", // Charcoal
    badgeBg: "rgba(87, 83, 78, 0.12)",
    description: "Margem de liquidez para imprevistos de última hora e upgrades espontâneos.",
  },
];

const defaultExpenses: Expense[] = [
  { id: "exp-1", name: "Aluguer Exclusivo da Quinta & Salão Nobre", category: "Espaço & Salão Nobre", planned: 180000, paid: 90000, status: "Sinalizado" },
  { id: "exp-2", name: "Catering Gourmet de 4 Tempos & Bar Aberto (150 Pax)", category: "Catering & Alta Gastronomia", planned: 240000, paid: 0, status: "Pendente" },
  { id: "exp-3", name: "Assessoria & Curadoria Editorial HAXR Signature", category: "Assessoria & Coordenação HAXR", planned: 80000, paid: 80000, status: "Pago" },
  { id: "exp-4", name: "Cenografia Floral, Altar Botânico & Iluminação Cénica", category: "Decoração & Arte Floral", planned: 130000, paid: 65000, status: "Sinalizado" },
  { id: "exp-5", name: "Cobertura Fotográfica Editorial & Cinema 4K Documental", category: "Fotografia & Cinema Documental", planned: 95000, paid: 45000, status: "Sinalizado" },
  { id: "exp-6", name: "DJ Curador, Sound System & Saxofone no Cocktail", category: "Música & Alta Performance", planned: 50000, paid: 25000, status: "Sinalizado" },
  { id: "exp-7", name: "Reserva Estratégica de Segurança Operacional", category: "Reserva Estratégica & Contingência", planned: 35000, paid: 0, status: "Pendente" },
];

export default function BudgetTrackerPage() {
  const router = useRouter();
  const [totalBudget, setTotalBudget] = useState<number>(810000); // MZN base
  const [guestCount, setGuestCount] = useState<number>(150);
  const [priorityProfile, setPriorityProfile] = useState<PriorityProfile>("balanced");
  const [currency, setCurrency] = useState<Currency>("MZN");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Form State
  const [newExpName, setNewExpName] = useState("");
  const [newExpCategory, setNewExpCategory] = useState(CATEGORY_BENCHMARKS[0].name);
  const [newExpPlanned, setNewExpPlanned] = useState("");
  const [newExpPaid, setNewExpPaid] = useState("");
  const [newExpStatus, setNewExpStatus] = useState<"Pendente" | "Sinalizado" | "Pago">("Pendente");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals
  const [isAiParserOpen, setIsAiParserOpen] = useState(false);
  const [rawProposalText, setRawProposalText] = useState("");
  const [parserFeedback, setParserFeedback] = useState<string | null>(null);
  const [isAllocatorOpen, setIsAllocatorOpen] = useState(false);
  const [isAuthGateOpen, setIsAuthGateOpen] = useState(false);

  // Accessible IDs
  const nameInputId = useId();
  const categoryInputId = useId();
  const plannedInputId = useId();
  const paidInputId = useId();

  // Load from local storage
  useEffect(() => {
    setIsClient(true);
    const savedBudget = localStorage.getItem("haxr_wedding_total_budget");
    const savedExpenses = localStorage.getItem("haxr_wedding_expenses");
    const savedGuests = localStorage.getItem("haxr_wedding_guests_count");
    const savedCurrency = localStorage.getItem("haxr_wedding_currency") as Currency;

    if (savedBudget) setTotalBudget(Number(savedBudget));
    if (savedGuests) setGuestCount(Number(savedGuests));
    if (savedCurrency && CURRENCY_CONFIG[savedCurrency]) setCurrency(savedCurrency);

    if (savedExpenses) {
      try {
        setExpenses(JSON.parse(savedExpenses));
      } catch {
        setExpenses(defaultExpenses);
      }
    } else {
      setExpenses(defaultExpenses);
    }
  }, []);

  const saveBudgetAndExpenses = (budget: number, expList: Expense[], guests = guestCount, curr = currency) => {
    setTotalBudget(budget);
    setExpenses(expList);
    setGuestCount(guests);
    setCurrency(curr);
    localStorage.setItem("haxr_wedding_total_budget", budget.toString());
    localStorage.setItem("haxr_wedding_expenses", JSON.stringify(expList));
    localStorage.setItem("haxr_wedding_guests_count", guests.toString());
    localStorage.setItem("haxr_wedding_currency", curr);
  };

  const handleBudgetChange = (val: number) => {
    saveBudgetAndExpenses(val, expenses);
  };

  // Currency Converter Formatter
  const formatMoney = (amountInMzn: number, targetCurr: Currency = currency): string => {
    const config = CURRENCY_CONFIG[targetCurr];
    const converted = amountInMzn * config.rateFromMzn;
    const formatted = Math.round(converted).toLocaleString("pt-MZ");
    if (targetCurr === "MZN") return `${formatted} MT`;
    if (targetCurr === "USD") return `$${formatted}`;
    if (targetCurr === "EUR") return `€${formatted}`;
    return `R${formatted}`;
  };

  // Add Expense
  const addExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpName.trim() || !newExpPlanned) return;

    const rate = CURRENCY_CONFIG[currency].rateFromMzn;
    const plannedVal = Math.round(Number(newExpPlanned) / rate);
    const paidVal = Math.round((Number(newExpPaid) || 0) / rate);

    let computedStatus = newExpStatus;
    if (paidVal >= plannedVal && plannedVal > 0) {
      computedStatus = "Pago";
    } else if (paidVal > 0) {
      computedStatus = "Sinalizado";
    }

    const newExpense: Expense = {
      id: `expense-${Date.now()}`,
      name: newExpName.trim(),
      category: newExpCategory,
      planned: plannedVal,
      paid: paidVal,
      status: computedStatus,
    };

    saveBudgetAndExpenses(totalBudget, [...expenses, newExpense]);
    setNewExpName("");
    setNewExpPlanned("");
    setNewExpPaid("");
    setNewExpStatus("Pendente");
  };

  // Delete Expense
  const deleteExpense = (id: string) => {
    const updated = expenses.filter((exp) => exp.id !== id);
    saveBudgetAndExpenses(totalBudget, updated);
  };

  // Toggle Status directly in Table
  const toggleStatus = (id: string) => {
    const updated = expenses.map((exp) => {
      if (exp.id !== id) return exp;
      const nextStatus: "Pendente" | "Sinalizado" | "Pago" =
        exp.status === "Pendente"
          ? "Sinalizado"
          : exp.status === "Sinalizado"
            ? "Pago"
            : "Pendente";

      const updatedPaid =
        nextStatus === "Pago"
          ? exp.planned
          : nextStatus === "Pendente"
            ? 0
            : exp.paid > 0
              ? exp.paid
              : Math.round(exp.planned * 0.5);

      return {
        ...exp,
        status: nextStatus,
        paid: updatedPaid,
      };
    });
    saveBudgetAndExpenses(totalBudget, updated);
  };

  // Apply Smart Allocation
  const applySmartAllocation = () => {
    const generated: Expense[] = [];
    let itemId = 1;

    CATEGORY_BENCHMARKS.forEach((benchmark) => {
      const catBudget = Math.round(totalBudget * benchmark.share[priorityProfile]);
      benchmark.sampleItems.forEach((sample) => {
        const itemPlanned = Math.round(catBudget * sample.shareOfCat);
        if (itemPlanned > 0) {
          generated.push({
            id: `gen-${itemId++}`,
            name: sample.name,
            category: benchmark.name,
            planned: itemPlanned,
            paid: 0,
            status: "Pendente",
          });
        }
      });
    });

    saveBudgetAndExpenses(totalBudget, generated, guestCount);
    setIsAllocatorOpen(false);
  };

  // Instant Quote / Receipt Parser
  const parseRawProposal = () => {
    if (!rawProposalText.trim()) return;

    const text = rawProposalText;
    let detectedName = "";
    let detectedPlanned = 0;
    let detectedPaid = 0;
    let detectedCat = CATEGORY_BENCHMARKS[0].name;

    const amounts = text.match(/\b\d{1,3}(?:[.,\s]\d{3})*(?:\s*(?:MT|MZN|Meticais|\$|EUR|Rand|ZAR))?/gi);
    const numericValues: number[] = [];

    if (amounts) {
      amounts.forEach((str) => {
        const clean = str.replace(/[^\d]/g, "");
        const num = Number(clean);
        if (num >= 500 && num <= 10000000) {
          numericValues.push(num);
        }
      });
    }

    numericValues.sort((a, b) => b - a);
    if (numericValues.length > 0) detectedPlanned = numericValues[0];
    if (numericValues.length > 1) detectedPaid = numericValues[1];

    const lower = text.toLowerCase();
    if (lower.includes("catering") || lower.includes("buffet") || lower.includes("menu") || lower.includes("bar") || lower.includes("bebidas") || lower.includes("bolo") || lower.includes("gastronomia")) {
      detectedCat = "Catering & Alta Gastronomia";
    } else if (lower.includes("foto") || lower.includes("vídeo") || lower.includes("video") || lower.includes("drone") || lower.includes("álbum") || lower.includes("cinema")) {
      detectedCat = "Fotografia & Cinema Documental";
    } else if (lower.includes("decora") || lower.includes("flores") || lower.includes("altar") || lower.includes("cenografia") || lower.includes("iluminação cénica") || lower.includes("mobiliário")) {
      detectedCat = "Decoração & Arte Floral";
    } else if (lower.includes("salão") || lower.includes("quinta") || lower.includes("espaço") || lower.includes("jardim") || lower.includes("tenda") || lower.includes("local")) {
      detectedCat = "Espaço & Salão Nobre";
    } else if (lower.includes("dj") || lower.includes("som") || lower.includes("música") || lower.includes("banda") || lower.includes("sax") || lower.includes("violino")) {
      detectedCat = "Música & Alta Performance";
    } else if (lower.includes("assessoria") || lower.includes("cerimonial") || lower.includes("coordena") || lower.includes("haxr")) {
      detectedCat = "Assessoria & Coordenação HAXR";
    } else if (lower.includes("vestido") || lower.includes("fato") || lower.includes("smoking") || lower.includes("maquilhagem") || lower.includes("cabelo") || lower.includes("styling")) {
      detectedCat = "Vestuário, Joalharia & Beleza";
    }

    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      detectedName = lines[0].replace(/proposta|cotação|orçamento|orcamento/gi, "").trim();
      if (detectedName.length < 3) detectedName = `Proposta ${detectedCat}`;
    } else {
      detectedName = `Proposta ${detectedCat}`;
    }

    const rate = CURRENCY_CONFIG[currency].rateFromMzn;
    setNewExpName(detectedName);
    setNewExpCategory(detectedCat);
    setNewExpPlanned(detectedPlanned ? String(Math.round(detectedPlanned * rate)) : "");
    setNewExpPaid(detectedPaid ? String(Math.round(detectedPaid * rate)) : "0");
    setNewExpStatus(detectedPaid > 0 ? "Sinalizado" : "Pendente");

    setParserFeedback(`Proposta extraída com sucesso: "${detectedName}" (${formatMoney(detectedPlanned)})`);
    setTimeout(() => {
      setIsAiParserOpen(false);
      setRawProposalText("");
      setParserFeedback(null);
    }, 1200);
  };

  const resetToDefault = () => {
    if (window.confirm("Deseja repor as diretrizes originais de exemplo da HAXR Signature?")) {
      saveBudgetAndExpenses(810000, defaultExpenses, 150, "MZN");
    }
  };

  // Financial Analytics & KPIs
  const totalPlanned = useMemo(() => expenses.reduce((acc, curr) => acc + curr.planned, 0), [expenses]);
  const totalPaid = useMemo(() => expenses.reduce((acc, curr) => acc + curr.paid, 0), [expenses]);
  const totalRemainingToPay = totalPlanned - totalPaid;
  const costPerGuest = guestCount > 0 ? Math.round(totalPlanned / guestCount) : 0;
  const budgetVariance = totalBudget - totalPlanned;
  const isOverBudget = budgetVariance < 0;

  // Prestige Index Rating
  const prestigeTier = useMemo(() => {
    if (costPerGuest >= 8000) {
      return {
        title: "Royal Imperial & Haute Couture",
        badge: "Nível Imperial",
        description: "Padrão de gala internacional: alta gastronomia com serviço à inglesa, orquestra ao vivo, cenografia botânica e cobertura documental de cinema.",
        color: "text-brand-gold",
        bg: "bg-brand-champagne/20 border-brand-champagne/50",
      };
    }
    if (costPerGuest >= 5000) {
      return {
        title: "Grand Editorial Prestige",
        badge: "Padrão Editorial",
        description: "Casamento de alto impacto visual: cenografia aérea rica, bar aberto premium, iluminação arquitetónica e assessoria completa HAXR.",
        color: "text-brand-gold",
        bg: "bg-brand-champagne/15 border-brand-champagne/40",
      };
    }
    if (costPerGuest >= 3000) {
      return {
        title: "Bespoke Intimate Luxury",
        badge: "Luxo Intimista",
        description: "Experiência refinada com foco em excelência gastronómica, hospitalidade personalizada e memórias fotográficas impecáveis.",
        color: "text-brand-eucalyptus",
        bg: "bg-brand-eucalyptus/10 border-brand-eucalyptus/30",
      };
    }
    return {
      title: "Essential Contemporary",
      badge: "Essencial Elegante",
      description: "Planeamento focado nas rubricas fundamentais com estética limpa e controle orçamental rigoroso.",
      color: "text-brand-text-dark/70",
      bg: "bg-white border-brand-champagne/40",
    };
  }, [costPerGuest]);

  // Category Breakdown Stats
  const categoryStats = useMemo(() => {
    return CATEGORY_BENCHMARKS.map((benchmark) => {
      const catExpenses = expenses.filter((e) => e.category === benchmark.name);
      const planned = catExpenses.reduce((sum, e) => sum + e.planned, 0);
      const paid = catExpenses.reduce((sum, e) => sum + e.paid, 0);
      const shareOfPlanned = totalPlanned > 0 ? (planned / totalPlanned) : 0;
      const benchmarkShare = benchmark.share[priorityProfile];
      return {
        ...benchmark,
        planned,
        paid,
        shareOfPlanned,
        benchmarkShare,
        itemCount: catExpenses.length,
      };
    });
  }, [expenses, totalPlanned, priorityProfile]);

  // Cash-Flow Milestone Rhythm (30% / 40% / 30%)
  const cashFlowRhythm = useMemo(() => {
    const phase1Total = Math.round(totalPlanned * 0.30); // 30% Sinais
    const phase2Total = Math.round(totalPlanned * 0.40); // 40% Intermédio
    const phase3Total = Math.round(totalPlanned * 0.30); // 30% Final

    const phase1Paid = Math.min(totalPaid, phase1Total);
    const phase2Paid = Math.min(Math.max(0, totalPaid - phase1Total), phase2Total);
    const phase3Paid = Math.min(Math.max(0, totalPaid - phase1Total - phase2Total), phase3Total);

    return [
      {
        phase: "Fase 1: Sinais de Bloqueio (Imediato)",
        target: phase1Total,
        paid: phase1Paid,
        percent: phase1Total > 0 ? Math.round((phase1Paid / phase1Total) * 100) : 0,
        label: "Garante exclusividade de data com os fornecedores chave.",
      },
      {
        phase: "Fase 2: Reforço de Produção (90 Dias Antes)",
        target: phase2Total,
        paid: phase2Paid,
        percent: phase2Total > 0 ? Math.round((phase2Paid / phase2Total) * 100) : 0,
        label: "Aquisição de materiais botânicos, tecidos e confirmação de menus.",
      },
      {
        phase: "Fase 3: Liquidação Final (Semana do Evento)",
        target: phase3Total,
        paid: phase3Paid,
        percent: phase3Total > 0 ? Math.round((phase3Paid / phase3Total) * 100) : 0,
        label: "Fecho das contas operacionais e saldo final de segurança.",
      },
    ];
  }, [totalPlanned, totalPaid]);

  // Intelligent Financial Advisory Notes
  const financialAdvisory = useMemo(() => {
    const tips: { type: "positive" | "warning" | "opportunity"; title: string; text: string }[] = [];

    const floralCat = categoryStats.find((c) => c.name.includes("Decoração"));
    if (floralCat && floralCat.shareOfPlanned < 0.12 && totalPlanned > 0) {
      tips.push({
        type: "warning",
        title: "Alocação Floral Moderada",
        text: "Para eventos de impacto em Maputo, recomendamos alocar entre 14% a 18% em Cenografia & Arte Floral para garantir impacto no altar e nas mesas nobres.",
      });
    }

    const contingency = categoryStats.find((c) => c.name.includes("Reserva"));
    if (!contingency || contingency.planned === 0) {
      tips.push({
        type: "warning",
        title: "Sem Fundo de Contingência Ativo",
        text: "Recomendamos manter 4% a 5% do orçamento como reserva de contingência para eventuais pedidos adicionais de convidados ou geradores de apoio.",
      });
    } else {
      tips.push({
        type: "positive",
        title: "Margem de Segurança Blindada",
        text: `Possui ${formatMoney(contingency.planned)} reservados exclusivamente para cobrir imprevistos operacionais com serenidade.`,
      });
    }

    if (isOverBudget) {
      tips.push({
        type: "opportunity",
        title: "Otimização de Custos Recomendada",
        text: `O total planeado excede o teto em ${formatMoney(Math.abs(budgetVariance))}. Pode rever opções de bar ou ajustar o número de pax para regressar à margem ideal.`,
      });
    }

    return tips;
  }, [categoryStats, totalPlanned, isOverBudget, budgetVariance, currency]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategoryFilter === "all" || exp.category === selectedCategoryFilter;

      const matchesStatus =
        statusFilter === "all" || exp.status === statusFilter;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [expenses, searchQuery, selectedCategoryFilter, statusFilter]);

  // Export / Gate Helpers
  const handleGenerateWeddingBookClick = () => {
    try {
      const syncedEventId = localStorage.getItem("haxr_synced_event_id");
      if (syncedEventId) {
        router.push(`/app/events/${encodeURIComponent(syncedEventId)}/budget`);
        return;
      }
    } catch {
      // ignore
    }
    setIsAuthGateOpen(true);
  };

  const getWhatsAppLink = () => {
    const listText = expenses
      .map((e) => `• *${e.name}* (${e.category}): ${formatMoney(e.planned)} | Pago: ${formatMoney(e.paid)} [${e.status}]`)
      .join("\n");

    const message = `🏛️ *BALANÇO FINANCEIRO EDITORIAL — HAXR SIGNATURE*\n\n` +
      `👑 *Perfil de Experiência:* ${prestigeTier.title} (${prestigeTier.badge})\n` +
      `👥 *Convidados:* ${guestCount} Pax\n` +
      `💰 *Teto Global Estipulado:* ${formatMoney(totalBudget)}\n` +
      `📊 *Investimento Comprometido:* ${formatMoney(totalPlanned)}\n` +
      `✅ *Total Já Liquidado:* ${formatMoney(totalPaid)}\n` +
      `⏳ *Saldo por Liquidar:* ${formatMoney(totalRemainingToPay)}\n` +
      `✨ *Índice por Convidado:* ${formatMoney(costPerGuest)}/Pax\n\n` +
      `*DETALHE DAS RUBRICAS:*\n${listText}\n\n` +
      `_Gerado no Private Wedding Financial Atelier da HAXR Signature: https://www.haxrsignature.com/tools/budget-tracker_`;

    return `https://wa.me/258870883428?text=${encodeURIComponent(message)}`;
  };

  if (!isClient) {
    return (
      <main className="min-h-screen bg-brand-ivory flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brand-gold animate-pulse">
          Carregando Atelier Financeiro...
        </p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen py-24 bg-brand-ivory text-brand-text-dark print:bg-white print:py-4">
      <div className="site-container mx-auto px-4 max-w-6xl relative z-10">

        {/* Top Navigation Bar (Hidden on Print) */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-4 mb-10 border-b border-brand-champagne/40 pb-6">
          <Link
            href="/ferramentas"
            className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.25em] text-brand-text-dark/60 hover:text-brand-text-dark transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Hub de Ferramentas</span>
          </Link>

          {/* Currency Switcher & Master Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center bg-white border border-brand-champagne/60 rounded-full p-1 shadow-xs">
              {(["MZN", "USD", "EUR", "ZAR"] as Currency[]).map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => setCurrency(curr)}
                  className={`px-3 py-1 font-mono text-[9px] uppercase tracking-wider rounded-full transition-all cursor-pointer ${
                    currency === curr
                      ? "bg-brand-gold text-white font-bold shadow-xs"
                      : "text-brand-text-dark/60 hover:text-brand-text-dark"
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsAllocatorOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-brand-gold/60 bg-white hover:bg-brand-gold/10 px-4 py-1.5 font-mono text-[9px] uppercase tracking-widest text-brand-text-dark transition shadow-xs cursor-pointer"
            >
              <PieChart className="w-3.5 h-3.5 text-brand-gold" />
              <span>Auto-Distribuir Orçamento</span>
            </button>

            <button
              type="button"
              onClick={resetToDefault}
              className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/40 hover:text-red-600 transition-colors p-1.5 cursor-pointer"
              title="Repor diretrizes de exemplo originais"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Repor Padrão</span>
            </button>
          </div>
        </div>

        <div className="print:hidden">
          <MarketingToolBanner title="Atelier Financeiro" />
        </div>

        {/* Master Atelier Hero */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div className="space-y-3 max-w-2xl">
            <span className="font-mono text-[8.5px] uppercase tracking-[0.35em] text-brand-gold font-semibold block">
              Simulação Aberta · Atelier Financeiro
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light leading-[1.1] tracking-[-0.02em] text-brand-text-dark">
              Balanço & Gestão <br className="hidden sm:inline" />
              <span className="italic font-normal text-brand-gold">Orçamental</span>
            </h1>
            <p className="font-sans text-xs sm:text-sm text-brand-text-dark/70 font-light leading-relaxed">
              Explore livremente a experiência. O orçamento real, histórico financeiro, sincronização e Wedding Financial Book são disponibilizados no painel privado.
            </p>
          </div>

          {/* Quick Quote Paste CTA */}
          <div className="print:hidden flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAiParserOpen(true)}
              className="px-6 py-4 rounded-sm bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[9px] tracking-[0.25em] uppercase font-bold shadow-sm transition flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-white" />
              <span>Colar Proposta / Cotação</span>
            </button>
          </div>
        </div>

        {/* The Prestige Experience Index Banner */}
        <div className={`p-6 md:p-8 rounded-sm border shadow-xs mb-10 transition-all ${prestigeTier.bg}`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <Crown className={`w-5 h-5 ${prestigeTier.color}`} />
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] font-bold text-brand-text-dark/80">
                  Índice de Experiência por Convidado
                </span>
                <span className={`text-[8px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-current font-bold ${prestigeTier.color}`}>
                  {prestigeTier.badge}
                </span>
              </div>
              <h2 className="font-serif text-2xl font-normal text-brand-text-dark">
                {prestigeTier.title}
              </h2>
              <p className="font-sans text-xs text-brand-text-dark/75 font-light max-w-2xl leading-relaxed">
                {prestigeTier.description}
              </p>
            </div>

            <div className="flex items-center gap-6 self-start lg:self-auto bg-white border border-brand-champagne/50 px-6 py-4 rounded-sm shadow-xs">
              <div>
                <span className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/50">
                  Média por Convidado
                </span>
                <span className={`font-serif text-2xl font-medium ${prestigeTier.color}`}>
                  {formatMoney(costPerGuest)}
                </span>
                <span className="text-[10px] text-brand-text-dark/50 font-mono ml-1">/ Pax</span>
              </div>

              <div className="h-10 w-px bg-brand-champagne/40" />

              <div>
                <span className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/50">
                  Lotação Prevista
                </span>
                <span className="font-serif text-2xl font-medium text-brand-text-dark">
                  {guestCount}
                </span>
                <span className="text-[10px] text-brand-text-dark/50 font-mono ml-1">Pessoas</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Financial Vault KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">

          {/* Card 1: Total Investment Ceiling */}
          <div className="bg-white border border-brand-champagne/50 p-6 rounded-sm shadow-xs space-y-3 transition">
            <div className="flex items-center justify-between text-brand-text-dark/50 font-mono text-[8px] uppercase tracking-[0.25em] font-bold">
              <span>Teto de Investimento</span>
              <Wallet className="w-3.5 h-3.5 text-brand-gold" />
            </div>
            <div>
              <p className="font-serif text-2xl sm:text-3xl font-light text-brand-text-dark tracking-tight">
                {formatMoney(totalBudget)}
              </p>
              <p className="font-sans text-[11px] text-brand-text-dark/50 font-light mt-0.5">
                Alvo de capital definido
              </p>
            </div>
            <div className="print:hidden pt-3 border-t border-brand-champagne/30 flex items-center justify-between gap-2">
              <span className="font-mono text-[8px] uppercase text-brand-text-dark/50">Ajustar Teto</span>
              <input
                type="range"
                min="200000"
                max="3500000"
                step="25000"
                value={totalBudget}
                onChange={(e) => handleBudgetChange(Number(e.target.value))}
                className="w-28 h-1 bg-brand-champagne/40 rounded-lg appearance-none cursor-pointer accent-brand-gold"
              />
            </div>
          </div>

          {/* Card 2: Committed Costs */}
          <div className="bg-white border border-brand-champagne/50 p-6 rounded-sm shadow-xs space-y-3 transition">
            <div className="flex items-center justify-between text-brand-text-dark/50 font-mono text-[8px] uppercase tracking-[0.25em] font-bold">
              <span>Custos Comprometidos</span>
              <Percent className="w-3.5 h-3.5 text-brand-text-dark/40" />
            </div>
            <div>
              <p className="font-serif text-2xl sm:text-3xl font-light text-brand-text-dark tracking-tight">
                {formatMoney(totalPlanned)}
              </p>
              <p className="font-sans text-[11px] text-brand-text-dark/50 font-light mt-0.5">
                Soma de todas as rubricas
              </p>
            </div>
            <div className="pt-3 border-t border-brand-champagne/30 flex items-center justify-between">
              <span className="font-mono text-[8px] uppercase text-brand-text-dark/50">Balanço do Teto</span>
              <span className={`font-mono text-[9px] font-bold uppercase tracking-wider ${
                isOverBudget ? "text-red-700" : "text-emerald-700"
              }`}>
                {isOverBudget ? `Excedido (+${formatMoney(Math.abs(budgetVariance))})` : `Margem (${formatMoney(budgetVariance)})`}
              </span>
            </div>
          </div>

          {/* Card 3: Disbursed / Paid Funds */}
          <div className="bg-white border border-brand-champagne/50 p-6 rounded-sm shadow-xs space-y-3 transition">
            <div className="flex items-center justify-between text-brand-text-dark/50 font-mono text-[8px] uppercase tracking-[0.25em] font-bold">
              <span>Património Liquidado</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div>
              <p className="font-serif text-2xl sm:text-3xl font-light text-emerald-800 tracking-tight">
                {formatMoney(totalPaid)}
              </p>
              <p className="font-sans text-[11px] text-brand-text-dark/50 font-light mt-0.5">
                {totalPlanned > 0 ? Math.round((totalPaid / totalPlanned) * 100) : 0}% dos contratos pagos
              </p>
            </div>
            <div className="pt-3 border-t border-brand-champagne/30">
              <div className="w-full bg-brand-champagne/25 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, totalPlanned > 0 ? (totalPaid / totalPlanned) * 100 : 0)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Remaining Balance */}
          <div className="bg-white border border-brand-champagne/50 p-6 rounded-sm shadow-xs space-y-3 transition">
            <div className="flex items-center justify-between text-brand-text-dark/50 font-mono text-[8px] uppercase tracking-[0.25em] font-bold">
              <span>Saldo por Liquidar</span>
              <TrendingUp className="w-3.5 h-3.5 text-brand-gold" />
            </div>
            <div>
              <p className="font-serif text-2xl sm:text-3xl font-light text-brand-gold tracking-tight">
                {formatMoney(totalRemainingToPay)}
              </p>
              <p className="font-sans text-[11px] text-brand-text-dark/50 font-light mt-0.5">
                Valores pendentes de fecho
              </p>
            </div>
            <div className="pt-3 border-t border-brand-champagne/30 flex items-center justify-between">
              <span className="font-mono text-[8px] uppercase text-brand-text-dark/50">Rubricas Ativas</span>
              <span className="font-mono text-[9px] text-brand-text-dark font-semibold">{expenses.length} contratos</span>
            </div>
          </div>

        </div>

        {/* Category Breakdown & Allocation Visual */}
        <div className="bg-white border border-brand-champagne/50 p-6 md:p-8 rounded-sm shadow-xs mb-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-champagne/30 pb-5">
            <div>
              <h2 className="font-serif text-xl font-light text-brand-text-dark">
                Distribuição Proporcional por Categoria
              </h2>
              <p className="font-sans text-xs text-brand-text-dark/60 font-light mt-0.5">
                Composição do capital alocado vs diretrizes de luxo para Moçambique.
              </p>
            </div>
            <div className="font-mono text-[10px] text-brand-gold uppercase tracking-widest font-bold">
              100% dos Custos Monitorizados
            </div>
          </div>

          {/* Segmented Bar */}
          <div className="w-full h-3 rounded-full overflow-hidden bg-brand-champagne/20 flex shadow-inner">
            {categoryStats.map((cat) => {
              if (cat.shareOfPlanned === 0) return null;
              return (
                <div
                  key={cat.name}
                  className="h-full transition-all duration-500 relative group"
                  style={{
                    width: `${cat.shareOfPlanned * 100}%`,
                    backgroundColor: cat.color,
                  }}
                  title={`${cat.name}: ${(cat.shareOfPlanned * 100).toFixed(1)}% (${formatMoney(cat.planned)})`}
                />
              );
            })}
          </div>

          {/* Category Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
            {categoryStats.map((cat) => {
              const IconComponent = cat.icon;

              return (
                <div
                  key={cat.name}
                  className="p-4 rounded-sm border border-brand-champagne/35 bg-brand-champagne/5 hover:border-brand-gold/50 transition space-y-2.5 text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-sm flex items-center justify-center shrink-0"
                        style={{ backgroundColor: cat.badgeBg, color: cat.color }}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-serif text-xs font-normal text-brand-text-dark truncate">
                        {cat.name}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-brand-gold font-semibold">
                      {Math.round(cat.shareOfPlanned * 100)}%
                    </span>
                  </div>

                  <div>
                    <p className="font-mono text-sm font-medium text-brand-text-dark">
                      {formatMoney(cat.planned)}
                    </p>
                    <p className="font-sans text-[10px] text-brand-text-dark/60 font-light mt-0.5 line-clamp-1">
                      {cat.description}
                    </p>
                  </div>

                  {cat.vendorCategorySlug && (
                    <div className="pt-2 border-t border-brand-champagne/20 flex items-center justify-between">
                      <span className="font-mono text-[8px] uppercase text-brand-text-dark/45">
                        {cat.itemCount} {cat.itemCount === 1 ? "item" : "itens"}
                      </span>
                      <Link
                        href={`/fornecedores`}
                        className="print:hidden inline-flex items-center gap-1 font-mono text-[8px] uppercase text-brand-gold hover:underline"
                      >
                        <span>Fornecedores</span>
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cash-Flow Rhythm & Financial Advisor Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">

          {/* Cash-Flow Rhythm (Column 1) */}
          <div className="lg:col-span-7 bg-white border border-brand-champagne/50 p-6 md:p-8 rounded-sm shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-brand-champagne/30 pb-4">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-brand-gold" />
                <h3 className="font-serif text-lg font-light text-brand-text-dark">
                  Ritmo de Fluxo de Caixa
                </h3>
              </div>
              <span className="font-mono text-[8px] uppercase tracking-widest text-brand-gold bg-brand-gold/10 border border-brand-gold/30 px-2.5 py-1 rounded-full font-bold">
                Padrão 30 · 40 · 30
              </span>
            </div>

            <div className="space-y-4">
              {cashFlowRhythm.map((milestone) => (
                <div key={milestone.phase} className="space-y-2 p-4 rounded-sm bg-brand-champagne/5 border border-brand-champagne/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-serif text-xs text-brand-text-dark font-normal">
                      {milestone.phase}
                    </span>
                    <span className="font-mono text-xs text-brand-gold font-semibold">
                      {formatMoney(milestone.paid)} / {formatMoney(milestone.target)}
                    </span>
                  </div>

                  <p className="font-sans text-[11px] text-brand-text-dark/65 font-light">
                    {milestone.label}
                  </p>

                  <div className="w-full bg-brand-champagne/20 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-gold h-full transition-all duration-500"
                      style={{ width: `${milestone.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HAXR Financial Advisor (Column 2) */}
          <div className="lg:col-span-5 bg-white border border-brand-champagne/50 p-6 md:p-8 rounded-sm shadow-xs space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 border-b border-brand-champagne/30 pb-4">
                <Lightbulb className="w-4 h-4 text-brand-gold" />
                <h3 className="font-serif text-lg font-light text-brand-text-dark">
                  Conselheiro Privado HAXR
                </h3>
              </div>

              <div className="space-y-3">
                {financialAdvisory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-sm border text-left space-y-1 ${
                      item.type === "warning"
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : item.type === "positive"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : "bg-brand-champagne/10 border-brand-champagne/35 text-brand-text-dark"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-serif text-xs font-medium">
                      {item.type === "warning" ? (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                      <span>{item.title}</span>
                    </div>
                    <p className="font-sans text-[11px] text-brand-text-dark/70 font-light leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-brand-champagne/30">
              <Link
                href="/contacto"
                className="w-full py-3 rounded-sm border border-brand-champagne hover:border-brand-gold bg-brand-champagne/10 hover:bg-brand-champagne/20 text-brand-text-dark font-mono text-[9px] uppercase tracking-widest font-bold transition flex items-center justify-center gap-2 text-center"
              >
                <span>Agendar Auditoria com Assessora HAXR</span>
                <ChevronRight className="w-3.5 h-3.5 text-brand-gold" />
              </Link>
            </div>
          </div>

        </div>

        {/* Master Expense Ledger Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">

          {/* Add Expense Form (Column 1) */}
          <div className="print:hidden lg:col-span-4 bg-white border border-brand-champagne/50 p-6 md:p-7 rounded-sm shadow-xs space-y-4 sticky top-6">
            <div className="flex items-center justify-between border-b border-brand-champagne/30 pb-3">
              <h3 className="font-serif text-base font-light text-brand-text-dark">Registar Nova Rubrica</h3>
              <button
                type="button"
                onClick={() => setIsAiParserOpen(true)}
                className="font-mono text-[8px] font-bold text-brand-gold uppercase tracking-wider hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Receipt className="w-3 h-3" />
                <span>Colar Cotação</span>
              </button>
            </div>

            <form onSubmit={addExpense} className="space-y-4">
              <div>
                <label htmlFor={nameInputId} className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/60 mb-1.5 font-bold">
                  Rubrica / Fornecedor Contratado
                </label>
                <input
                  id={nameInputId}
                  type="text"
                  required
                  placeholder="Ex: Quinta dos Cedros / Atelier Floral"
                  value={newExpName}
                  onChange={(e) => setNewExpName(e.target.value)}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans text-brand-text-dark"
                />
              </div>

              <div>
                <label htmlFor={categoryInputId} className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/60 mb-1.5 font-bold">
                  Categoria de Alocação
                </label>
                <select
                  id={categoryInputId}
                  value={newExpCategory}
                  onChange={(e) => setNewExpCategory(e.target.value)}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans text-brand-text-dark cursor-pointer"
                >
                  {CATEGORY_BENCHMARKS.map((cat) => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={plannedInputId} className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/60 mb-1.5 font-bold">
                    Planeado ({currency})
                  </label>
                  <input
                    id={plannedInputId}
                    type="number"
                    required
                    min="0"
                    placeholder="250000"
                    value={newExpPlanned}
                    onChange={(e) => setNewExpPlanned(e.target.value)}
                    className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans text-brand-text-dark"
                  />
                </div>

                <div>
                  <label htmlFor={paidInputId} className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/60 mb-1.5 font-bold">
                    Já Liquidado ({currency})
                  </label>
                  <input
                    id={paidInputId}
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newExpPaid}
                    onChange={(e) => setNewExpPaid(e.target.value)}
                    className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans text-brand-text-dark"
                  />
                </div>
              </div>

              <div>
                <span className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/60 mb-1.5 font-bold">
                  Estado do Pagamento
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["Pendente", "Sinalizado", "Pago"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewExpStatus(st)}
                      className={`font-mono text-[8px] uppercase tracking-wider py-2 border rounded-sm transition-colors cursor-pointer text-center ${
                        newExpStatus === st
                          ? "bg-brand-gold border-brand-gold text-white font-bold"
                          : "border-brand-champagne/50 bg-brand-champagne/5 text-brand-text-dark/60 hover:border-brand-gold/60"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-sm bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[9px] tracking-[0.25em] uppercase font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar ao Livro</span>
              </button>
            </form>
          </div>

          {/* Ledger Table & Master Exports (Column 2) */}
          <div className="lg:col-span-8 bg-white border border-brand-champagne/50 rounded-sm p-6 md:p-8 shadow-xs space-y-6">

            {/* Table Header & Controls (Hidden on Print) */}
            <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-champagne/30 pb-4">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-dark/40" />
                <input
                  type="text"
                  placeholder="Filtrar por rubrica ou fornecedor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-brand-ivory/50 border border-brand-champagne/50 rounded-sm text-xs outline-none focus:border-brand-gold font-sans text-brand-text-dark"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="bg-brand-ivory/50 border border-brand-champagne/50 rounded-sm text-xs py-2 px-3 outline-none focus:border-brand-gold font-sans text-brand-text-dark cursor-pointer"
                >
                  <option value="all">Todas as Categorias</option>
                  {CATEGORY_BENCHMARKS.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-brand-ivory/50 border border-brand-champagne/50 rounded-sm text-xs py-2 px-3 outline-none focus:border-brand-gold font-sans text-brand-text-dark cursor-pointer"
                >
                  <option value="all">Todos os Estados</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Sinalizado">Sinalizado</option>
                  <option value="Pago">Pago</option>
                </select>
              </div>
            </div>

            {/* Expenses Table */}
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <p className="font-serif text-base text-brand-text-dark/40 font-light">
                  Nenhuma rubrica encontrada para os filtros selecionados.
                </p>
                <p className="font-sans text-xs text-brand-text-dark/50">
                  Use a auto-distribuição ou adicione uma proposta manualmente.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-brand-champagne/45 font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/50">
                      <th className="pb-3 font-semibold">Rubrica / Fornecedor</th>
                      <th className="pb-3 font-semibold">Categoria</th>
                      <th className="pb-3 font-semibold text-right">Planeado</th>
                      <th className="pb-3 font-semibold text-right">Liquidado</th>
                      <th className="pb-3 font-semibold text-center">Estado</th>
                      <th className="print:hidden pb-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-champagne/10 font-sans font-light">
                    {filteredExpenses.map((exp) => {
                      const benchmark = CATEGORY_BENCHMARKS.find((b) => b.name === exp.category);
                      return (
                        <tr key={exp.id} className="hover:bg-brand-champagne/5 transition-colors group">
                          <td className="py-4 font-medium text-brand-text-dark">
                            <div>{exp.name}</div>
                            {benchmark?.vendorCategorySlug && (
                              <Link
                                href={`/fornecedores`}
                                className="print:hidden inline-flex items-center gap-1 font-mono text-[8px] text-brand-gold hover:underline mt-0.5"
                              >
                                <span>Ver directório de fornecedores</span>
                                <ArrowUpRight className="w-2.5 h-2.5" />
                              </Link>
                            )}
                          </td>
                          <td className="py-4 text-brand-text-dark/70 text-[11px]">{exp.category}</td>
                          <td className="py-4 text-right font-mono text-brand-text-dark">{formatMoney(exp.planned)}</td>
                          <td className="py-4 text-right font-mono text-emerald-800 font-medium">{formatMoney(exp.paid)}</td>
                          <td className="py-4 text-center">
                            <button
                              type="button"
                              onClick={() => toggleStatus(exp.id)}
                              className={`inline-block font-mono text-[8px] tracking-wider uppercase px-3 py-1 rounded-full cursor-pointer transition-all hover:scale-105 ${
                                exp.status === "Pago"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : exp.status === "Sinalizado"
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "bg-red-100 text-red-800 border border-red-200"
                              }`}
                              title="Clique para alternar estado (Pendente -> Sinalizado -> Pago)"
                            >
                              {exp.status}
                            </button>
                          </td>
                          <td className="print:hidden py-4 text-right">
                            <button
                              type="button"
                              onClick={() => deleteExpense(exp.id)}
                              className="text-brand-text-dark/30 hover:text-red-600 transition-colors p-1.5 rounded-md cursor-pointer"
                              title="Eliminar rubrica"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Export & Actions Hub */}
            <div className="print:hidden mt-8 pt-6 border-t border-brand-champagne/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-champagne/10 p-5 rounded-sm border border-brand-champagne/40">
              <div className="text-left">
                <h3 className="font-serif text-sm font-medium text-brand-text-dark">
                  The Private Wedding Ledger (Exportação)
                </h3>
                <p className="font-sans text-xs text-brand-text-dark/60 font-light leading-relaxed mt-0.5">
                  Gere o documento oficial para reuniões com familiares ou partilhe instantaneamente no WhatsApp.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none border border-brand-champagne bg-white hover:border-brand-gold text-brand-text-dark py-2.5 px-4 font-mono text-[9px] tracking-wider uppercase font-bold rounded-sm inline-flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-brand-gold" />
                  <span>Imprimir Relatório</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateWeddingBookClick}
                  className="flex-1 sm:flex-none border border-brand-champagne bg-white hover:border-brand-gold text-brand-text-dark py-2.5 px-4 font-mono text-[9px] tracking-wider uppercase font-bold rounded-sm inline-flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-brand-gold" />
                  <span>Gerar Wedding Financial Book</span>
                </button>

                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-sm bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[9px] tracking-widest uppercase font-bold shadow-xs transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-white" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

          </div>

        </div>

        {/* Modal 1: Smart Auto-Allocation Modal */}
        <AnimatePresence>
          {isAllocatorOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/75 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-brand-champagne/60 rounded-sm p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-6 text-brand-text-dark"
              >
                <div className="flex items-center justify-between border-b border-brand-champagne/30 pb-4">
                  <div className="flex items-center gap-2.5">
                    <PieChart className="w-5 h-5 text-brand-gold" />
                    <div>
                      <h3 className="font-serif text-xl font-light">Auto-Distribuição Orçamental</h3>
                      <p className="font-sans text-xs text-brand-text-dark/60">Diretrizes de mercado e alta gestão para Maputo</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAllocatorOpen(false)}
                    className="text-brand-text-dark/40 hover:text-brand-text-dark p-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/60 mb-1.5 font-bold">
                        Teto Total ({currency})
                      </label>
                      <input
                        type="number"
                        min="100000"
                        step="25000"
                        value={Math.round(totalBudget * CURRENCY_CONFIG[currency].rateFromMzn)}
                        onChange={(e) => setTotalBudget(Math.round(Number(e.target.value) / CURRENCY_CONFIG[currency].rateFromMzn))}
                        className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans font-medium text-brand-text-dark"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/60 mb-1.5 font-bold">
                        Lotação de Convidados (Pax)
                      </label>
                      <input
                        type="number"
                        min="20"
                        max="1500"
                        value={guestCount}
                        onChange={(e) => setGuestCount(Number(e.target.value))}
                        className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans font-medium text-brand-text-dark"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/60 mb-2 font-bold">
                      Estilo de Celebração & Prioridade Editorial
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "balanced", label: "Equilibrado Clássico", desc: "Proporções recomendadas HAXR" },
                        { key: "gastronomy", label: "Alta Gastronomia", desc: "35% Catering + Espaço Nobre" },
                        { key: "visual_media", label: "Cenografia & Média", desc: "18% Decoração + 20% Cinema" },
                        { key: "atmosphere", label: "Festa & Animação", desc: "Bar estendido + Orquestra/DJ" },
                      ].map((prof) => (
                        <button
                          key={prof.key}
                          type="button"
                          onClick={() => setPriorityProfile(prof.key as PriorityProfile)}
                          className={`p-3.5 rounded-sm border text-left transition cursor-pointer ${
                            priorityProfile === prof.key
                              ? "bg-brand-gold/10 border-brand-gold text-brand-text-dark font-medium"
                              : "border-brand-champagne/40 bg-brand-champagne/5 text-brand-text-dark/70 hover:border-brand-gold/50"
                          }`}
                        >
                          <div className="font-serif text-xs text-brand-text-dark">{prof.label}</div>
                          <div className="font-sans text-[10px] text-brand-text-dark/50 font-light mt-0.5">{prof.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-champagne/30">
                  <button
                    type="button"
                    onClick={() => setIsAllocatorOpen(false)}
                    className="px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/60 hover:text-brand-text-dark cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={applySmartAllocation}
                    className="px-6 py-3 rounded-sm bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[9px] tracking-widest uppercase font-bold shadow-xs transition cursor-pointer"
                  >
                    Aplicar Alocação
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal 2: Quote Parser Modal */}
        <AnimatePresence>
          {isAiParserOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/75 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-brand-champagne/60 rounded-sm p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 text-brand-text-dark"
              >
                <div className="flex items-center justify-between border-b border-brand-champagne/30 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Receipt className="w-5 h-5 text-brand-gold" />
                    <div>
                      <h3 className="font-serif text-xl font-light">Extrator de Cotações</h3>
                      <p className="font-sans text-xs text-brand-text-dark/60">Cole a proposta recebida por WhatsApp ou Email</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAiParserOpen(false)}
                    className="text-brand-text-dark/40 hover:text-brand-text-dark p-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="font-sans text-xs text-brand-text-dark/70 font-light leading-relaxed">
                    Cole qualquer mensagem ou resumo de orçamento (ex: <em>&quot;Boa tarde Jessica, o valor da cobertura fotográfica fica em 95.000 MT com sinal de 45.000 MT para fechar o contrato&quot;</em>).
                  </p>

                  <textarea
                    rows={5}
                    value={rawProposalText}
                    onChange={(e) => setRawProposalText(e.target.value)}
                    placeholder="Cole aqui a mensagem ou cotação..."
                    className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3.5 rounded-sm outline-none font-sans text-brand-text-dark placeholder:text-brand-text-dark/40 leading-relaxed"
                  />

                  {parserFeedback && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-sm text-xs">
                      <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{parserFeedback}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-champagne/30">
                  <button
                    type="button"
                    onClick={() => setIsAiParserOpen(false)}
                    className="px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/60 hover:text-brand-text-dark cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={parseRawProposal}
                    disabled={!rawProposalText.trim()}
                    className="px-6 py-3 rounded-sm bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[9px] tracking-widest uppercase font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    Extrair & Preencher
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal 3: Wedding Financial Book Auth Gate Modal */}
        <AnimatePresence>
          {isAuthGateOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/75 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-brand-champagne/60 rounded-sm p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 text-brand-text-dark text-left"
              >
                <div className="flex items-start justify-between border-b border-brand-champagne/30 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-brand-gold font-mono text-[8.5px] uppercase tracking-[0.35em] font-semibold">
                      <FileSpreadsheet className="w-4 h-4 text-brand-gold shrink-0" />
                      <span>HAXR Wedding Financial Book</span>
                    </div>
                    <h3 className="font-serif text-2xl font-light text-brand-text-dark">
                      O Livro Financeiro do Vosso Casamento
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAuthGateOpen(false)}
                    className="text-brand-text-dark/40 hover:text-brand-text-dark p-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 font-sans text-xs text-brand-text-dark/75 font-light leading-relaxed">
                  <p>
                    O workbook oficial <strong>The Wedding Ledger (.xlsx)</strong> é gerado exclusivamente a partir do orçamento real e dos contratos formalizados do vosso evento.
                  </p>
                  <p className="text-brand-text-dark/60 text-[11px]">
                    Para aceder ao livro financeiro oficial, registar despesas reais com sincronização em nuvem e exportar o balanço de auditoria, entre na vossa área privada.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch gap-3">
                  <Link
                    href="/sign-up?redirect=/app/dashboard"
                    className="flex-1 py-3 rounded-sm bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[9px] uppercase tracking-widest font-bold shadow-xs text-center transition"
                  >
                    Criar conta
                  </Link>
                  <Link
                    href="/sign-in?redirect=/app/dashboard"
                    className="flex-1 py-3 rounded-sm border border-brand-champagne/60 bg-white hover:border-brand-gold text-brand-text-dark font-mono text-[9px] uppercase tracking-widest text-center transition"
                  >
                    Já tenho conta
                  </Link>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="print:hidden">
          <ToolProductionCta />
        </div>

      </div>
    </main>
  );
}
