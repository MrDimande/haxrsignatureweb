"use client";

import { useState, useEffect } from "react";
import {
  DollarSign, Plus, Trash2, RotateCcw,
  MessageCircle, ArrowLeft, Wallet, Percent,
  CheckCircle2, AlertCircle
} from "lucide-react";
import Link from "next/link";
import MarketingToolBanner from "@/components/marketing/MarketingToolBanner";
import ToolProductionCta from "@/components/marketing/ToolProductionCta";

interface Expense {
  id: string;
  name: string;
  category: string;
  planned: number;
  paid: number;
  status: "Pendente" | "Sinalizado" | "Pago";
}

const defaultExpenses: Expense[] = [
  { id: "exp-1", name: "Aluguer do Salão Principal", category: "Espaço", planned: 150000, paid: 75000, status: "Sinalizado" },
  { id: "exp-2", name: "Catering Gourmet (150 Pax)", category: "Catering", planned: 200000, paid: 0, status: "Pendente" },
  { id: "exp-3", name: "Assessoria Completa HAXR", category: "Assessoria", planned: 70000, paid: 70000, status: "Pago" },
  { id: "exp-4", name: "Arte Floral & Decoração", category: "Decoração", planned: 80000, paid: 40000, status: "Sinalizado" },
  { id: "exp-5", name: "Fotografia & Vídeo Documental", category: "Média", planned: 60000, paid: 30000, status: "Sinalizado" },
  { id: "exp-6", name: "Convite Digital & RSVP", category: "Tecnologia", planned: 25000, paid: 25000, status: "Pago" },
];

const categories = ["Espaço", "Catering", "Assessoria", "Decoração", "Média", "Tecnologia", "Vestuário", "Outros"];

export default function BudgetTrackerPage() {
  const [totalBudget, setTotalBudget] = useState<number>(600000);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpName, setNewExpName] = useState("");
  const [newExpCategory, setNewExpCategory] = useState("Espaço");
  const [newExpPlanned, setNewExpPlanned] = useState("");
  const [newExpPaid, setNewExpPaid] = useState("");
  const [newExpStatus, setNewExpStatus] = useState<"Pendente" | "Sinalizado" | "Pago">("Pendente");
  const [isClient, setIsClient] = useState(false);

  // Load from local storage
  useEffect(() => {
    setIsClient(true);
    const savedBudget = localStorage.getItem("haxr_wedding_total_budget");
    const savedExpenses = localStorage.getItem("haxr_wedding_expenses");

    if (savedBudget) setTotalBudget(Number(savedBudget));
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

  const saveBudgetAndExpenses = (budget: number, expList: Expense[]) => {
    setTotalBudget(budget);
    setExpenses(expList);
    localStorage.setItem("haxr_wedding_total_budget", budget.toString());
    localStorage.setItem("haxr_wedding_expenses", JSON.stringify(expList));
  };

  const handleBudgetChange = (val: number) => {
    saveBudgetAndExpenses(val, expenses);
  };

  const addExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpName.trim() || !newExpPlanned) return;

    const newExpense: Expense = {
      id: `expense-${Date.now()}`,
      name: newExpName.trim(),
      category: newExpCategory,
      planned: Number(newExpPlanned),
      paid: Number(newExpPaid) || 0,
      status: newExpStatus,
    };

    saveBudgetAndExpenses(totalBudget, [...expenses, newExpense]);
    setNewExpName("");
    setNewExpPlanned("");
    setNewExpPaid("");
    setNewExpStatus("Pendente");
  };

  const deleteExpense = (id: string) => {
    const updated = expenses.filter((exp) => exp.id !== id);
    saveBudgetAndExpenses(totalBudget, updated);
  };

  const resetToDefault = () => {
    if (window.confirm("Deseja repor os valores de exemplo originais? Isto apagará as despesas personalizadas.")) {
      saveBudgetAndExpenses(600000, defaultExpenses);
    }
  };

  if (!isClient) {
    return (
      <main className="min-h-screen bg-brand-ivory flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-gold animate-pulse">Carregando orçamento...</p>
      </main>
    );
  }

  // Calculations
  const totalPlanned = expenses.reduce((acc, curr) => acc + curr.planned, 0);
  const totalPaid = expenses.reduce((acc, curr) => acc + curr.paid, 0);
  const percentageSpent = totalBudget > 0 ? Math.round((totalPaid / totalBudget) * 100) : 0;
  const totalRemainingToPay = totalPlanned - totalPaid;

  const getWhatsAppLink = () => {
    const listText = expenses
      .map((e) => `- ${e.name} (${e.category}): Planeado: ${e.planned.toLocaleString()} MT | Pago: ${e.paid.toLocaleString()} MT [${e.status}]`)
      .join("\n");
    const message = `Olá HAXR Signature, gostaria de partilhar a simulação orçamental do meu evento:\n\nOrçamento Total: ${totalBudget.toLocaleString()} MT\nTotal Planeado: ${totalPlanned.toLocaleString()} MT\nTotal Pago: ${totalPaid.toLocaleString()} MT\nRestante a Pagar: ${totalRemainingToPay.toLocaleString()} MT\n\nDespesas detalhadas:\n${listText}`;
    return `https://wa.me/258870883428?text=${encodeURIComponent(message)}`;
  };

  return (
    <main className="relative min-h-screen py-24 bg-brand-ivory text-brand-text-dark">
      <div className="site-container mx-auto px-4 max-w-5xl">

        {/* Back Link */}
        <Link
          href="/ferramentas"
          className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-brand-text-dark/50 hover:text-brand-text-dark mb-10 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar às ferramentas</span>
        </Link>

        <MarketingToolBanner title="Orçamento" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-brand-gold">
              <DollarSign className="w-4 h-4" />
              <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Ferramentas de Planeamento</span>
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-light leading-tight">
              Calculadora de Orçamento
            </h1>
            <p className="font-sans text-xs md:text-sm text-brand-text-dark/65 font-light max-w-xl">
              Gira e acompanhe todas as despesas da vossa celebração. Compare os custos estimados com os pagamentos reais e controle o saldo de reserva.
            </p>
          </div>

          <button
            type="button"
            onClick={resetToDefault}
            className="self-start md:self-auto inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-brand-text-dark/40 hover:text-red-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Repor Exemplo</span>
          </button>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          <div className="bg-white border border-brand-champagne/45 p-6 rounded-sm shadow-xs space-y-2">
            <div className="flex items-center justify-between text-brand-text-dark/45 font-mono text-[8px] uppercase tracking-widest font-bold">
              <span>Orçamento Total</span>
              <Wallet className="w-3.5 h-3.5 text-brand-gold" />
            </div>
            <p className="font-serif text-xl font-medium text-brand-text-dark">
              {totalBudget.toLocaleString()} MT
            </p>
            <input
              type="range"
              min="200000"
              max="2000000"
              step="50000"
              value={totalBudget}
              onChange={(e) => handleBudgetChange(Number(e.target.value))}
              className="w-full h-1 bg-brand-champagne/30 rounded-lg appearance-none cursor-pointer accent-brand-gold"
            />
          </div>

          <div className="bg-white border border-brand-champagne/45 p-6 rounded-sm shadow-xs space-y-2">
            <div className="flex items-center justify-between text-brand-text-dark/45 font-mono text-[8px] uppercase tracking-widest font-bold">
              <span>Custos Planeados</span>
              <Percent className="w-3.5 h-3.5 text-brand-text-dark/30" />
            </div>
            <p className="font-serif text-xl font-medium text-brand-text-dark">
              {totalPlanned.toLocaleString()} MT
            </p>
            <p className="font-sans text-[10px] text-brand-text-dark/40 font-light">
              Soma total das estimativas.
            </p>
          </div>

          <div className="bg-white border border-brand-champagne/45 p-6 rounded-sm shadow-xs space-y-2">
            <div className="flex items-center justify-between text-brand-text-dark/45 font-mono text-[8px] uppercase tracking-widest font-bold">
              <span>Total Pago</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            </div>
            <p className="font-serif text-xl font-medium text-brand-text-dark text-green-700">
              {totalPaid.toLocaleString()} MT
            </p>
            <p className="font-sans text-[10px] text-brand-text-dark/40 font-light">
              {percentageSpent}% do total consumido.
            </p>
          </div>

          <div className="bg-white border border-brand-champagne/45 p-6 rounded-sm shadow-xs space-y-2">
            <div className="flex items-center justify-between text-brand-text-dark/45 font-mono text-[8px] uppercase tracking-widest font-bold">
              <span>Saldo em Falta</span>
              <AlertCircle className="w-3.5 h-3.5 text-brand-gold/60" />
            </div>
            <p className="font-serif text-xl font-medium text-brand-gold">
              {totalRemainingToPay.toLocaleString()} MT
            </p>
            <p className="font-sans text-[10px] text-brand-text-dark/40 font-light">
              Valor restante por liquidar.
            </p>
          </div>

        </div>

        {/* Input Form & Expense List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Add Expense Form */}
          <div className="lg:col-span-4 bg-white border border-brand-champagne/45 p-6 rounded-sm shadow-sm space-y-4">
            <h3 className="font-serif text-sm font-medium text-brand-text-dark mb-2">Adicionar Despesa</h3>

            <form onSubmit={addExpense} className="space-y-4">
              <div>
                <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                  Item / Fornecedor
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pastelaria Fina (Bolo)"
                  value={newExpName}
                  onChange={(e) => setNewExpName(e.target.value)}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans"
                />
              </div>

              <div>
                <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                  Categoria
                </label>
                <select
                  value={newExpCategory}
                  onChange={(e) => setNewExpCategory(e.target.value)}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                    Planeado (MT)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="25000"
                    value={newExpPlanned}
                    onChange={(e) => setNewExpPlanned(e.target.value)}
                    className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                    Pago (MT)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newExpPaid}
                    onChange={(e) => setNewExpPaid(e.target.value)}
                    className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                  Estado do Pagamento
                </label>
                <div className="flex gap-2">
                  {(["Pendente", "Sinalizado", "Pago"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewExpStatus(st)}
                      className={`flex-1 font-mono text-[9px] uppercase tracking-wider py-2 border rounded-sm transition-colors cursor-pointer ${
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
                className="w-full bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[9px] tracking-widest uppercase font-bold py-3.5 rounded-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Custos</span>
              </button>
            </form>
          </div>

          {/* Expense List Table */}
          <div className="lg:col-span-8 bg-white border border-brand-champagne/45 rounded-sm p-6 md:p-8 shadow-sm">
            <h3 className="font-serif text-base font-light mb-6 border-b border-brand-champagne/25 pb-3">
              Listagem de Despesas
            </h3>

            {expenses.length === 0 ? (
              <div className="text-center py-12 text-brand-text-dark/40 font-light text-xs">
                Nenhuma despesa adicionada. Comece a registar as propostas recebidas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-brand-champagne/45 font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/45">
                      <th className="pb-3 font-semibold">Item</th>
                      <th className="pb-3 font-semibold">Categoria</th>
                      <th className="pb-3 font-semibold text-right">Planeado</th>
                      <th className="pb-3 font-semibold text-right">Pago</th>
                      <th className="pb-3 font-semibold text-center">Estado</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-champagne/10 font-sans font-light">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-brand-champagne/5 transition-colors">
                        <td className="py-4 font-medium text-brand-text-dark">{exp.name}</td>
                        <td className="py-4 text-brand-text-dark/60">{exp.category}</td>
                        <td className="py-4 text-right font-mono">{exp.planned.toLocaleString()} MT</td>
                        <td className="py-4 text-right font-mono text-green-700">{exp.paid.toLocaleString()} MT</td>
                        <td className="py-4 text-center">
                          <span className={`inline-block font-mono text-[7px] tracking-wider uppercase px-2.5 py-0.5 rounded-full ${
                            exp.status === "Pago"
                              ? "bg-green-100 text-green-800"
                              : exp.status === "Sinalizado"
                                ? "bg-brand-gold/10 text-brand-gold"
                                : "bg-red-100 text-red-800"
                          }`}>
                            {exp.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            type="button"
                            onClick={() => deleteExpense(exp.id)}
                            className="text-brand-text-dark/30 hover:text-red-600 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Export block */}
            <div className="mt-8 pt-6 border-t border-brand-champagne/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-champagne/5 p-4 rounded-sm">
              <div className="text-left">
                <h4 className="font-serif text-xs font-semibold text-brand-text-dark">Exportar Resumo Orçamental</h4>
                <p className="font-sans text-[10px] text-brand-text-dark/50 font-light leading-relaxed mt-0.5">
                  Partilhe as metas financeiras e o saldo do orçamento direto por WhatsApp.
                </p>
              </div>
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-editorial btn-editorial--solid py-3 px-6 font-mono text-[9px] tracking-widest uppercase font-bold rounded-sm inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Exportar Orçamento</span>
              </a>
            </div>

          </div>

        </div>

        <ToolProductionCta />

      </div>
    </main>
  );
}
