"use client";

import { useState, useEffect, useMemo, useId } from "react";
import {
  DollarSign, Plus, Trash2, RotateCcw,
  MessageCircle, ArrowLeft, Wallet, Percent,
  CheckCircle2, AlertTriangle, Sparkles, Download,
  FileSpreadsheet, SlidersHorizontal, Wand2,
  TrendingUp, Building2, Utensils,
  Camera, Music, Shirt, Search,
  ArrowUpRight, Check, X, Printer
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import MarketingToolBanner from "@/components/marketing/MarketingToolBanner";
import ToolProductionCta from "@/components/marketing/ToolProductionCta";

export interface Expense {
  id: string;
  name: string;
  category: string;
  planned: number;
  paid: number;
  status: "Pendente" | "Sinalizado" | "Pago";
  notes?: string;
}

export type PriorityProfile = "balanced" | "gastronomy" | "visual_media" | "atmosphere";

interface CategoryBenchmark {
  name: string;
  iconName: string;
  share: Record<PriorityProfile, number>; // percentages
  sampleItems: { name: string; shareOfCat: number }[];
  color: string;
  vendorCategorySlug?: string;
}

const CATEGORY_BENCHMARKS: CategoryBenchmark[] = [
  {
    name: "Espaço & Salão",
    iconName: "Building2",
    share: { balanced: 0.22, gastronomy: 0.25, visual_media: 0.18, atmosphere: 0.20 },
    sampleItems: [
      { name: "Aluguer do Salão Principal & Jardim", shareOfCat: 0.85 },
      { name: "Segurança & Parqueamento Privado", shareOfCat: 0.15 },
    ],
    color: "#C5A880", // Gold / Champagne
    vendorCategorySlug: "espacos",
  },
  {
    name: "Catering & Bar",
    iconName: "Utensils",
    share: { balanced: 0.25, gastronomy: 0.35, visual_media: 0.20, atmosphere: 0.22 },
    sampleItems: [
      { name: "Buffet Gourmet & Cocktail de Boas-Vindas", shareOfCat: 0.75 },
      { name: "Bar Aberto & Vinhos Selecionados", shareOfCat: 0.18 },
      { name: "Bolo de Noiva & Doces Finos", shareOfCat: 0.07 },
    ],
    color: "#9E825A", // Deep Gold
    vendorCategorySlug: "catering",
  },
  {
    name: "Decoração & Arte Floral",
    iconName: "Sparkles",
    share: { balanced: 0.16, gastronomy: 0.12, visual_media: 0.18, atmosphere: 0.18 },
    sampleItems: [
      { name: "Cenografia de Altar & Mesa dos Noivos", shareOfCat: 0.65 },
      { name: "Arranjos Florais & Centro de Mesas", shareOfCat: 0.25 },
      { name: "Iluminação Cénica & Mobiliário VIP", shareOfCat: 0.10 },
    ],
    color: "#857360", // Warm Earth
    vendorCategorySlug: "decoracao",
  },
  {
    name: "Fotografia & Vídeo",
    iconName: "Camera",
    share: { balanced: 0.12, gastronomy: 0.08, visual_media: 0.20, atmosphere: 0.10 },
    sampleItems: [
      { name: "Fotografia Editorial & Cobertura Completa", shareOfCat: 0.60 },
      { name: "Filme Documental & Drone Teaser", shareOfCat: 0.40 },
    ],
    color: "#6B5B4D", // Coffee Slate
    vendorCategorySlug: "fotografia",
  },
  {
    name: "Assessoria & Coordenação",
    iconName: "Wallet",
    share: { balanced: 0.09, gastronomy: 0.07, visual_media: 0.09, atmosphere: 0.09 },
    sampleItems: [
      { name: "Assessoria Completa HAXR Signature", shareOfCat: 1.0 },
    ],
    color: "#1C1A17", // Black Luxe
    vendorCategorySlug: "assessoria",
  },
  {
    name: "Música & Entretenimento",
    iconName: "Music",
    share: { balanced: 0.07, gastronomy: 0.05, visual_media: 0.06, atmosphere: 0.12 },
    sampleItems: [
      { name: "DJ Profissional & Sistema de Som Acústico", shareOfCat: 0.65 },
      { name: "Banda ao Vivo / Saxofonista no Cocktail", shareOfCat: 0.35 },
    ],
    color: "#B49770", // Light Gold
    vendorCategorySlug: "musica",
  },
  {
    name: "Vestuário & Beleza",
    iconName: "Shirt",
    share: { balanced: 0.05, gastronomy: 0.04, visual_media: 0.05, atmosphere: 0.05 },
    sampleItems: [
      { name: "Vestido de Noiva, Fato do Noivo & Acessórios", shareOfCat: 0.70 },
      { name: "Make-up & Hair Styling Profissional", shareOfCat: 0.30 },
    ],
    color: "#D9C3A5", // Soft Cream
    vendorCategorySlug: "beleza",
  },
  {
    name: "Fundo de Reserva / Imprevistos",
    iconName: "Percent",
    share: { balanced: 0.04, gastronomy: 0.04, visual_media: 0.04, atmosphere: 0.04 },
    sampleItems: [
      { name: "Margem de Segurança Operacional (5%)", shareOfCat: 1.0 },
    ],
    color: "#4A4641", // Deep Charcoal
  },
];

const defaultExpenses: Expense[] = [
  { id: "exp-1", name: "Aluguer do Salão Principal & Jardim", category: "Espaço & Salão", planned: 160000, paid: 80000, status: "Sinalizado" },
  { id: "exp-2", name: "Catering Gourmet & Bar Aberto (150 Pax)", category: "Catering & Bar", planned: 220000, paid: 0, status: "Pendente" },
  { id: "exp-3", name: "Assessoria Completa HAXR Signature", category: "Assessoria & Coordenação", planned: 75000, paid: 75000, status: "Pago" },
  { id: "exp-4", name: "Arte Floral, Cenografia & Iluminação", category: "Decoração & Arte Floral", planned: 110000, paid: 55000, status: "Sinalizado" },
  { id: "exp-5", name: "Fotografia Editorial & Filme 4K", category: "Fotografia & Vídeo", planned: 85000, paid: 40000, status: "Sinalizado" },
  { id: "exp-6", name: "DJ, Som Acústico & Sax Cocktail", category: "Música & Entretenimento", planned: 45000, paid: 20000, status: "Sinalizado" },
  { id: "exp-7", name: "Reserva de Contingência (Imprevistos)", category: "Fundo de Reserva / Imprevistos", planned: 30000, paid: 0, status: "Pendente" },
];

export default function BudgetTrackerPage() {
  const [totalBudget, setTotalBudget] = useState<number>(725000);
  const [guestCount, setGuestCount] = useState<number>(150);
  const [priorityProfile, setPriorityProfile] = useState<PriorityProfile>("balanced");
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

  // AI & Parser Drawer / Modal
  const [isAiParserOpen, setIsAiParserOpen] = useState(false);
  const [rawProposalText, setRawProposalText] = useState("");
  const [parserFeedback, setParserFeedback] = useState<string | null>(null);

  // Quick allocation modal
  const [isAllocatorOpen, setIsAllocatorOpen] = useState(false);

  // Unique IDs for accessible inputs
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

    if (savedBudget) setTotalBudget(Number(savedBudget));
    if (savedGuests) setGuestCount(Number(savedGuests));
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

  const saveBudgetAndExpenses = (budget: number, expList: Expense[], guests = guestCount) => {
    setTotalBudget(budget);
    setExpenses(expList);
    setGuestCount(guests);
    localStorage.setItem("haxr_wedding_total_budget", budget.toString());
    localStorage.setItem("haxr_wedding_expenses", JSON.stringify(expList));
    localStorage.setItem("haxr_wedding_guests_count", guests.toString());
  };

  const handleBudgetChange = (val: number) => {
    saveBudgetAndExpenses(val, expenses);
  };

  // Add Expense
  const addExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpName.trim() || !newExpPlanned) return;

    const plannedVal = Number(newExpPlanned);
    const paidVal = Number(newExpPaid) || 0;

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

  // Quick Auto-Allocation Generator based on Maputo Benchmarks
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

  // AI & Text Cotação Parser (Instant Local Extractor)
  const parseRawProposal = () => {
    if (!rawProposalText.trim()) return;

    const text = rawProposalText;
    let detectedName = "";
    let detectedPlanned = 0;
    let detectedPaid = 0;
    let detectedCat = CATEGORY_BENCHMARKS[0].name;

    // Numbers extraction (look for MT or numbers over 1000)
    const amounts = text.match(/\b\d{1,3}(?:[.,\s]\d{3})*(?:\s*(?:MT|MZN|Meticais|\$|EUR))?/gi);
    const numericValues: number[] = [];

    if (amounts) {
      amounts.forEach((str) => {
        const clean = str.replace(/[^\d]/g, "");
        const num = Number(clean);
        if (num >= 500 && num <= 5000000) {
          numericValues.push(num);
        }
      });
    }

    // Sort descending: largest is usually total quote, smaller is deposit/signal
    numericValues.sort((a, b) => b - a);
    if (numericValues.length > 0) {
      detectedPlanned = numericValues[0];
    }
    if (numericValues.length > 1) {
      detectedPaid = numericValues[1];
    }

    // Category detection heuristic
    const lower = text.toLowerCase();
    if (lower.includes("catering") || lower.includes("buffet") || lower.includes("menu") || lower.includes("bar") || lower.includes("bebidas") || lower.includes("bolo")) {
      detectedCat = "Catering & Bar";
    } else if (lower.includes("foto") || lower.includes("vídeo") || lower.includes("video") || lower.includes("drone") || lower.includes("álbum")) {
      detectedCat = "Fotografia & Vídeo";
    } else if (lower.includes("decora") || lower.includes("flores") || lower.includes("altar") || lower.includes("cenografia") || lower.includes("mobiliário")) {
      detectedCat = "Decoração & Arte Floral";
    } else if (lower.includes("salão") || lower.includes("quinta") || lower.includes("espaço") || lower.includes("local") || lower.includes("tenda")) {
      detectedCat = "Espaço & Salão";
    } else if (lower.includes("dj") || lower.includes("som") || lower.includes("música") || lower.includes("banda") || lower.includes("sax")) {
      detectedCat = "Música & Entretenimento";
    } else if (lower.includes("assessoria") || lower.includes("cerimonial") || lower.includes("coordena") || lower.includes("haxr")) {
      detectedCat = "Assessoria & Coordenação";
    } else if (lower.includes("vestido") || lower.includes("fato") || lower.includes("maquilhagem") || lower.includes("cabelo") || lower.includes("styling")) {
      detectedCat = "Vestuário & Beleza";
    }

    // Name extraction heuristic (first line or supplier keyword)
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      detectedName = lines[0].replace(/proposta|cotação|orçamento|orcamento/gi, "").trim();
      if (detectedName.length < 3) detectedName = `Proposta ${detectedCat}`;
    } else {
      detectedName = `Proposta ${detectedCat}`;
    }

    setNewExpName(detectedName);
    setNewExpCategory(detectedCat);
    setNewExpPlanned(detectedPlanned ? String(detectedPlanned) : "");
    setNewExpPaid(detectedPaid ? String(detectedPaid) : "0");
    setNewExpStatus(detectedPaid > 0 ? "Sinalizado" : "Pendente");

    setParserFeedback(`Proposta analisada com sucesso: ${detectedName} (${detectedCat}) — ${detectedPlanned.toLocaleString()} MT.`);
    setTimeout(() => {
      setIsAiParserOpen(false);
      setRawProposalText("");
      setParserFeedback(null);
    }, 1200);
  };

  // Reset to default sample
  const resetToDefault = () => {
    if (window.confirm("Deseja repor os valores de exemplo originais? Isto apagará as despesas personalizadas.")) {
      saveBudgetAndExpenses(725000, defaultExpenses, 150);
    }
  };

  // Calculations
  const totalPlanned = useMemo(() => expenses.reduce((acc, curr) => acc + curr.planned, 0), [expenses]);
  const totalPaid = useMemo(() => expenses.reduce((acc, curr) => acc + curr.paid, 0), [expenses]);
  const totalRemainingToPay = totalPlanned - totalPaid;
  const costPerGuest = guestCount > 0 ? Math.round(totalPlanned / guestCount) : 0;
  const budgetVariance = totalBudget - totalPlanned;
  const isOverBudget = budgetVariance < 0;

  // Category breakdown calculation
  const categoryStats = useMemo(() => {
    return CATEGORY_BENCHMARKS.map((benchmark) => {
      const catExpenses = expenses.filter((e) => e.category === benchmark.name);
      const planned = catExpenses.reduce((sum, e) => sum + e.planned, 0);
      const paid = catExpenses.reduce((sum, e) => sum + e.paid, 0);
      const shareOfPlanned = totalPlanned > 0 ? (planned / totalPlanned) : 0;
      return {
        ...benchmark,
        planned,
        paid,
        shareOfPlanned,
        itemCount: catExpenses.length,
      };
    });
  }, [expenses, totalPlanned]);

  // Filtered expenses
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

  // Export Helpers
  const exportToCsv = () => {
    const headers = ["Item", "Categoria", "Valor Planeado (MT)", "Valor Pago (MT)", "Saldo a Pagar (MT)", "Estado"];
    const rows = expenses.map((e) => [
      `"${e.name.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      e.planned,
      e.paid,
      e.planned - e.paid,
      e.status,
    ]);

    const summaryRow = [
      `"TOTAL GERAL"`,
      `""`,
      totalPlanned,
      totalPaid,
      totalRemainingToPay,
      `"${isOverBudget ? "Desvio Orçamental" : "Dentro do Teto"}"`,
    ];

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(",")), summaryRow.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Orcamento_Casamento_HAXR_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getWhatsAppLink = () => {
    const listText = expenses
      .map((e) => `• *${e.name}* (${e.category}): ${e.planned.toLocaleString()} MT | Pago: ${e.paid.toLocaleString()} MT [${e.status}]`)
      .join("\n");

    const message = `✨ *Simulação Orçamental — HAXR Signature*\n\n` +
      `👤 *Convidados:* ${guestCount} Pax\n` +
      `💰 *Teto Orçamental:* ${totalBudget.toLocaleString()} MT\n` +
      `📊 *Custos Planeados:* ${totalPlanned.toLocaleString()} MT\n` +
      `✅ *Total Já Liquidado:* ${totalPaid.toLocaleString()} MT\n` +
      `⏳ *Saldo Restante:* ${totalRemainingToPay.toLocaleString()} MT\n` +
      `💡 *Custo Médio por Convidado:* ${costPerGuest.toLocaleString()} MT/Pax\n\n` +
      `*Detalhe das Rubricas:*\n${listText}\n\n` +
      `_Gerado na ferramenta oficial HAXR Signature: https://www.haxrsignature.com/tools/budget-tracker_`;

    return `https://wa.me/258870883428?text=${encodeURIComponent(message)}`;
  };

  if (!isClient) {
    return (
      <main className="min-h-screen bg-brand-ivory flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-gold animate-pulse">Carregando orçamento inteligente...</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen py-24 bg-brand-ivory text-brand-text-dark print:bg-white print:py-4">
      <div className="site-container mx-auto px-4 max-w-5xl">

        {/* Back Link & Navigation (Hidden on Print) */}
        <div className="print:hidden flex items-center justify-between gap-4 mb-10">
          <Link
            href="/ferramentas"
            className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-brand-text-dark/50 hover:text-brand-text-dark transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar às ferramentas</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAllocatorOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-brand-champagne/60 bg-white px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/70 hover:border-brand-gold hover:text-brand-gold transition shadow-2xs"
            >
              <Wand2 className="w-3.5 h-3.5 text-brand-gold" />
              <span>Auto-Distribuir Orçamento</span>
            </button>

            <button
              type="button"
              onClick={resetToDefault}
              className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-brand-text-dark/40 hover:text-red-600 transition-colors p-1.5"
              title="Repor valores de exemplo originais"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Repor Exemplo</span>
            </button>
          </div>
        </div>

        <div className="print:hidden">
          <MarketingToolBanner title="Orçamento" />
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-brand-gold">
              <DollarSign className="w-4 h-4" />
              <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Calculadora Inteligente de Casamento</span>
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-light leading-tight">
              Gestor Orçamental Editorial
            </h1>
            <p className="font-sans text-xs md:text-sm text-brand-text-dark/65 font-light max-w-2xl leading-relaxed">
              Planeie e equilibre cada investimento do vosso casamento. Use os padrões de luxo de Maputo para prever despesas com precisão cirúrgica e evitar desvios financeiros.
            </p>
          </div>

          <div className="print:hidden flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAiParserOpen(true)}
              className="btn-editorial btn-editorial--solid py-3 px-5 font-mono text-[9px] tracking-widest uppercase font-bold rounded-sm inline-flex items-center gap-2 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-gold-light" />
              <span>Colar Proposta / IA</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          {/* Budget Limit Card */}
          <div className="bg-white border border-brand-champagne/45 p-6 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between text-brand-text-dark/45 font-mono text-[8px] uppercase tracking-widest font-bold">
              <span>Teto Orçamental</span>
              <Wallet className="w-3.5 h-3.5 text-brand-gold" />
            </div>
            <div>
              <p className="font-serif text-2xl font-medium text-brand-text-dark">
                {totalBudget.toLocaleString()} MT
              </p>
              <p className="font-sans text-[11px] text-brand-text-dark/50 font-light mt-0.5">
                Estimativa para {guestCount} convidados
              </p>
            </div>
            <div className="print:hidden pt-2 border-t border-brand-champagne/20 flex items-center justify-between gap-2">
              <span className="font-mono text-[8px] uppercase text-brand-text-dark/40">Ajustar Teto</span>
              <input
                type="range"
                min="200000"
                max="3000000"
                step="25000"
                value={totalBudget}
                onChange={(e) => handleBudgetChange(Number(e.target.value))}
                className="w-28 h-1 bg-brand-champagne/30 rounded-lg appearance-none cursor-pointer accent-brand-gold"
              />
            </div>
          </div>

          {/* Planned Costs Card */}
          <div className="bg-white border border-brand-champagne/45 p-6 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between text-brand-text-dark/45 font-mono text-[8px] uppercase tracking-widest font-bold">
              <span>Total Comprometido</span>
              <Percent className="w-3.5 h-3.5 text-brand-text-dark/30" />
            </div>
            <div>
              <p className="font-serif text-2xl font-medium text-brand-text-dark">
                {totalPlanned.toLocaleString()} MT
              </p>
              <p className="font-sans text-[11px] text-brand-text-dark/50 font-light mt-0.5">
                {costPerGuest.toLocaleString()} MT por pessoa
              </p>
            </div>
            <div className="pt-2 border-t border-brand-champagne/20 flex items-center justify-between">
              <span className="font-mono text-[8px] uppercase text-brand-text-dark/40">Status do Teto</span>
              <span className={`font-mono text-[8px] font-bold uppercase tracking-wider ${
                isOverBudget ? "text-amber-700 font-semibold" : "text-emerald-700"
              }`}>
                {isOverBudget ? `Excedido (+${Math.abs(budgetVariance).toLocaleString()} MT)` : `Margem (${budgetVariance.toLocaleString()} MT)`}
              </span>
            </div>
          </div>

          {/* Paid Costs Card */}
          <div className="bg-white border border-brand-champagne/45 p-6 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between text-brand-text-dark/45 font-mono text-[8px] uppercase tracking-widest font-bold">
              <span>Total Já Liquidado</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div>
              <p className="font-serif text-2xl font-medium text-emerald-800">
                {totalPaid.toLocaleString()} MT
              </p>
              <p className="font-sans text-[11px] text-brand-text-dark/50 font-light mt-0.5">
                {totalPlanned > 0 ? Math.round((totalPaid / totalPlanned) * 100) : 0}% dos custos pagos
              </p>
            </div>
            <div className="pt-2 border-t border-brand-champagne/20">
              <div className="w-full bg-brand-champagne/20 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, totalPlanned > 0 ? (totalPaid / totalPlanned) * 100 : 0)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Remaining Balance Card */}
          <div className="bg-white border border-brand-champagne/45 p-6 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between text-brand-text-dark/45 font-mono text-[8px] uppercase tracking-widest font-bold">
              <span>Saldo por Liquidar</span>
              <TrendingUp className="w-3.5 h-3.5 text-brand-gold" />
            </div>
            <div>
              <p className="font-serif text-2xl font-medium text-brand-gold">
                {totalRemainingToPay.toLocaleString()} MT
              </p>
              <p className="font-sans text-[11px] text-brand-text-dark/50 font-light mt-0.5">
                Valores pendentes de fecho
              </p>
            </div>
            <div className="pt-2 border-t border-brand-champagne/20 flex items-center justify-between">
              <span className="font-mono text-[8px] uppercase text-brand-text-dark/40">Rubricas ativas</span>
              <span className="font-mono text-[9px] text-brand-text-dark font-medium">{expenses.length} itens</span>
            </div>
          </div>

        </div>

        {/* Visual Budget Allocation Bar */}
        <div className="bg-white border border-brand-champagne/45 p-6 rounded-2xl shadow-sm mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-base font-light">Distribuição do Orçamento por Categoria</h2>
              <p className="font-sans text-xs text-brand-text-dark/50 font-light">
                Composição proporcional dos custos planeados vs directrizes de luxo em Moçambique.
              </p>
            </div>
            <span className="font-mono text-[9px] text-brand-gold font-bold uppercase tracking-wider">
              {totalPlanned.toLocaleString()} MT Total
            </span>
          </div>

          {/* Segmented Bar */}
          <div className="w-full h-3 rounded-full overflow-hidden bg-brand-champagne/15 flex">
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
                  title={`${cat.name}: ${(cat.shareOfPlanned * 100).toFixed(1)}% (${cat.planned.toLocaleString()} MT)`}
                />
              );
            })}
          </div>

          {/* Category Legend & Benchmarks Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {categoryStats.map((cat) => (
              <div
                key={cat.name}
                className="flex items-start gap-2.5 p-2 rounded-lg bg-[#FAF8F5] border border-brand-champagne/20 text-left"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <div className="min-w-0">
                  <p className="font-sans text-[11px] font-medium text-brand-text-dark truncate">
                    {cat.name}
                  </p>
                  <p className="font-mono text-[10px] text-brand-text-dark/60">
                    {cat.planned.toLocaleString()} MT
                    <span className="text-brand-text-dark/35 ml-1">
                      ({Math.round(cat.shareOfPlanned * 100)}%)
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input Form & Expense List Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">

          {/* Add Expense Form (Column 1) */}
          <div className="print:hidden lg:col-span-4 bg-white border border-brand-champagne/45 p-6 rounded-2xl shadow-sm space-y-4 sticky top-6">
            <div className="flex items-center justify-between border-b border-brand-champagne/25 pb-3">
              <h2 className="font-serif text-sm font-medium text-brand-text-dark">Registar Nova Despesa</h2>
              <button
                type="button"
                onClick={() => setIsAiParserOpen(true)}
                className="font-mono text-[8px] font-bold text-brand-gold uppercase tracking-wider hover:underline inline-flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Colar Cotação</span>
              </button>
            </div>

            <form onSubmit={addExpense} className="space-y-4">
              <div>
                <label htmlFor={nameInputId} className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/55 mb-1.5 font-bold">
                  Item / Fornecedor Contratado
                </label>
                <input
                  id={nameInputId}
                  type="text"
                  required
                  placeholder="Ex: Quinta dos Cedros / Catering VIP"
                  value={newExpName}
                  onChange={(e) => setNewExpName(e.target.value)}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-xl outline-none font-sans"
                />
              </div>

              <div>
                <label htmlFor={categoryInputId} className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/55 mb-1.5 font-bold">
                  Categoria de Alocação
                </label>
                <select
                  id={categoryInputId}
                  value={newExpCategory}
                  onChange={(e) => setNewExpCategory(e.target.value)}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-xl outline-none font-sans cursor-pointer"
                >
                  {CATEGORY_BENCHMARKS.map((cat) => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={plannedInputId} className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/55 mb-1.5 font-bold">
                    Planeado (MT)
                  </label>
                  <input
                    id={plannedInputId}
                    type="number"
                    required
                    min="0"
                    placeholder="250000"
                    value={newExpPlanned}
                    onChange={(e) => setNewExpPlanned(e.target.value)}
                    className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-xl outline-none font-sans"
                  />
                </div>

                <div>
                  <label htmlFor={paidInputId} className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/55 mb-1.5 font-bold">
                    Já Pago / Sinal (MT)
                  </label>
                  <input
                    id={paidInputId}
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newExpPaid}
                    onChange={(e) => setNewExpPaid(e.target.value)}
                    className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-xl outline-none font-sans"
                  />
                </div>
              </div>

              <div>
                <span className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/55 mb-1.5 font-bold">
                  Estado do Pagamento
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["Pendente", "Sinalizado", "Pago"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewExpStatus(st)}
                      className={`font-mono text-[8px] uppercase tracking-wider py-2 border rounded-lg transition-colors cursor-pointer text-center ${
                        newExpStatus === st
                          ? "bg-brand-gold border-brand-gold text-white font-bold"
                          : "border-brand-champagne/45 bg-brand-champagne/5 text-brand-text-dark/60 hover:border-brand-gold/60"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[9px] tracking-widest uppercase font-bold py-3.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Despesa</span>
              </button>
            </form>
          </div>

          {/* Expense List Table & Action Hub (Column 2) */}
          <div className="lg:col-span-8 bg-white border border-brand-champagne/45 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">

            {/* Table Filter Controls (Hidden on Print) */}
            <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-champagne/25 pb-4">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-dark/40" />
                <input
                  type="text"
                  placeholder="Pesquisar despesa ou fornecedor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-brand-ivory/50 border border-brand-champagne/50 rounded-xl text-xs outline-none focus:border-brand-gold font-sans"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="bg-brand-ivory/50 border border-brand-champagne/50 rounded-xl text-xs py-2 px-3 outline-none focus:border-brand-gold font-sans cursor-pointer"
                >
                  <option value="all">Todas as Categorias</option>
                  {CATEGORY_BENCHMARKS.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-brand-ivory/50 border border-brand-champagne/50 rounded-xl text-xs py-2 px-3 outline-none focus:border-brand-gold font-sans cursor-pointer"
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
                  Nenhuma despesa encontrada para os filtros selecionados.
                </p>
                <p className="font-sans text-xs text-brand-text-dark/50">
                  Use o botão de auto-distribuição ou adicione uma proposta manualmente.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-brand-champagne/45 font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/45">
                      <th className="pb-3 font-semibold">Rubrica / Fornecedor</th>
                      <th className="pb-3 font-semibold">Categoria</th>
                      <th className="pb-3 font-semibold text-right">Planeado</th>
                      <th className="pb-3 font-semibold text-right">Pago</th>
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
                                <span>Ver fornecedores</span>
                                <ArrowUpRight className="w-2.5 h-2.5" />
                              </Link>
                            )}
                          </td>
                          <td className="py-4 text-brand-text-dark/70 text-[11px]">{exp.category}</td>
                          <td className="py-4 text-right font-mono text-brand-text-dark">{exp.planned.toLocaleString()} MT</td>
                          <td className="py-4 text-right font-mono text-emerald-700 font-medium">{exp.paid.toLocaleString()} MT</td>
                          <td className="py-4 text-center">
                            <button
                              type="button"
                              onClick={() => toggleStatus(exp.id)}
                              className={`inline-block font-mono text-[8px] tracking-wider uppercase px-2.5 py-1 rounded-full cursor-pointer transition-all hover:scale-105 ${
                                exp.status === "Pago"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300/40"
                                  : exp.status === "Sinalizado"
                                    ? "bg-amber-100 text-amber-800 border border-amber-300/40"
                                    : "bg-rose-100 text-rose-800 border border-rose-300/40"
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
                              className="text-brand-text-dark/25 hover:text-red-600 transition-colors p-1.5 rounded-md"
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
            <div className="print:hidden mt-8 pt-6 border-t border-brand-champagne/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FAF8F5] p-5 rounded-xl border border-brand-champagne/30">
              <div className="text-left">
                <h3 className="font-serif text-sm font-medium text-brand-text-dark">Exportar Resumo Orçamental</h3>
                <p className="font-sans text-xs text-brand-text-dark/55 font-light leading-relaxed mt-0.5">
                  Gere relatórios em folha de cálculo ou partilhe instantaneamente o sumário no WhatsApp.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none border border-brand-champagne/60 bg-white hover:border-brand-gold text-brand-text-dark py-2.5 px-4 font-mono text-[9px] tracking-wider uppercase font-bold rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={exportToCsv}
                  className="flex-1 sm:flex-none border border-brand-champagne/60 bg-white hover:border-brand-gold text-brand-text-dark py-2.5 px-4 font-mono text-[9px] tracking-wider uppercase font-bold rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Excel (CSV)</span>
                </button>

                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none btn-editorial btn-editorial--solid py-2.5 px-4 font-mono text-[9px] tracking-widest uppercase font-bold rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-brand-gold-light" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

          </div>

        </div>

        {/* Modal 1: Smart Auto-Allocation Modal */}
        <AnimatePresence>
          {isAllocatorOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-brand-champagne/60 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-6"
              >
                <div className="flex items-center justify-between border-b border-brand-champagne/25 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Wand2 className="w-5 h-5 text-brand-gold" />
                    <div>
                      <h3 className="font-serif text-xl font-light">Auto-Distribuição Inteligente</h3>
                      <p className="font-sans text-xs text-brand-text-dark/55">Directrizes de mercado e luxo para Maputo</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAllocatorOpen(false)}
                    className="text-brand-text-dark/40 hover:text-brand-text-dark p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/55 mb-1.5 font-bold">
                        Teto Total (MT)
                      </label>
                      <input
                        type="number"
                        min="100000"
                        step="25000"
                        value={totalBudget}
                        onChange={(e) => setTotalBudget(Number(e.target.value))}
                        className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-xl outline-none font-sans font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/55 mb-1.5 font-bold">
                        Número de Convidados (Pax)
                      </label>
                      <input
                        type="number"
                        min="20"
                        max="1500"
                        value={guestCount}
                        onChange={(e) => setGuestCount(Number(e.target.value))}
                        className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-xl outline-none font-sans font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/55 mb-2 font-bold">
                      Estilo de Celebração & Prioridade
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "balanced", label: "Equilibrado Clássico", desc: "Proporções recomendadas HAXR" },
                        { key: "gastronomy", label: "Foco em Gastronomia", desc: "35% Catering + Espaço Nobre" },
                        { key: "visual_media", label: "Foco Cenografia & Foto", desc: "20% Decoração + 20% Média" },
                        { key: "atmosphere", label: "Foco Festa & Animação", desc: "Bar estendido + DJ/Banda" },
                      ].map((prof) => (
                        <button
                          key={prof.key}
                          type="button"
                          onClick={() => setPriorityProfile(prof.key as PriorityProfile)}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                            priorityProfile === prof.key
                              ? "bg-brand-gold/10 border-brand-gold text-brand-text-dark font-medium"
                              : "border-brand-champagne/40 bg-[#FAF8F5] text-brand-text-dark/70 hover:border-brand-gold/50"
                          }`}
                        >
                          <div className="font-serif text-xs">{prof.label}</div>
                          <div className="font-sans text-[10px] text-brand-text-dark/45 font-light">{prof.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-champagne/25">
                  <button
                    type="button"
                    onClick={() => setIsAllocatorOpen(false)}
                    className="px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/60 hover:text-brand-text-dark"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={applySmartAllocation}
                    className="btn-editorial btn-editorial--solid py-3 px-6 font-mono text-[9px] tracking-widest uppercase font-bold rounded-xl shadow-xs"
                  >
                    Aplicar Alocação Inteligente
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal 2: AI / Text Proposal Parser Modal */}
        <AnimatePresence>
          {isAiParserOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-brand-champagne/60 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5"
              >
                <div className="flex items-center justify-between border-b border-brand-champagne/25 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-brand-gold" />
                    <div>
                      <h3 className="font-serif text-xl font-light">Extrator de Cotação / IA</h3>
                      <p className="font-sans text-xs text-brand-text-dark/55">Cole a mensagem ou orçamento recebido</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAiParserOpen(false)}
                    className="text-brand-text-dark/40 hover:text-brand-text-dark p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="font-sans text-xs text-brand-text-dark/65 font-light leading-relaxed">
                    Cole o texto de uma cotação recebida pelo WhatsApp ou Email (ex: <em>&quot;Olá Jessica, a Quinta dos Cedros fica por 250.000 MT com sinal de 50.000 MT&quot;</em>).
                  </p>

                  <textarea
                    rows={5}
                    value={rawProposalText}
                    onChange={(e) => setRawProposalText(e.target.value)}
                    placeholder="Cole aqui a cotação ou resumo do orçamento..."
                    className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3.5 rounded-xl outline-none font-sans leading-relaxed"
                  />

                  {parserFeedback && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{parserFeedback}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-champagne/25">
                  <button
                    type="button"
                    onClick={() => setIsAiParserOpen(false)}
                    className="px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/60 hover:text-brand-text-dark"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={parseRawProposal}
                    disabled={!rawProposalText.trim()}
                    className="btn-editorial btn-editorial--solid py-3 px-6 font-mono text-[9px] tracking-widest uppercase font-bold rounded-xl shadow-xs disabled:opacity-50"
                  >
                    Extrair & Preencher
                  </button>
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
