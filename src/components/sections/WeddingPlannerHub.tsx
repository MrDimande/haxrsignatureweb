"use client";

import { useState } from "react";
import { DollarSign, ClipboardList, MessageCircle, HelpCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

type TabName = "orcamento" | "checklist";

interface TasksByTime {
  timeframe: string;
  tasks: { id: string; text: string; done: boolean }[];
}

export default function WeddingPlannerHub() {
  const [activeTab, setActiveTab] = useState<TabName>("orcamento");
  const [totalBudget, setTotalBudget] = useState(25000);
  const [monthsLeft, setMonthsLeft] = useState(12);

  // Estado das tarefas para o checklist interativo
  const [tasksData, setTasksData] = useState<Record<number, { id: string; text: string; done: boolean }[]>>({
    12: [
      { id: "12-1", text: "Definir estilo do evento e paleta de inspiração", done: false },
      { id: "12-2", text: "Reservar o espaço (venue) e data oficial", done: false },
      { id: "12-3", text: "Contratar o serviço de Assessoria Completa HAXR", done: false },
    ],
    6: [
      { id: "6-1", text: "Finalizar a lista de convidados preliminar", done: false },
      { id: "6-2", text: "Desenhar e enviar o Save the Date Digital", done: false },
      { id: "6-3", text: "Selecionar fornecedores principais (Catering, Foto, DJ)", done: false },
    ],
    3: [
      { id: "3-1", text: "Enviar o Convite Digital Oficial com RSVP integrado", done: false },
      { id: "3-2", text: "Iniciar provas de vestido / fato de noivos", done: false },
      { id: "3-3", text: "Definir cronograma minuto-a-minuto com a equipa HAXR", done: false },
    ],
  });

  const toggleTask = (time: number, id: string) => {
    setTasksData((prev) => ({
      ...prev,
      [time]: prev[time].map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    }));
  };

  const getBudgetBreakdown = () => {
    return [
      { key: "space", label: "Espaço & Catering (50%)", value: totalBudget * 0.5 },
      { key: "advisory", label: "Curadoria & Assessoria HAXR (15%)", value: totalBudget * 0.15 },
      { key: "decor", label: "Decoração & Arte Floral (12%)", value: totalBudget * 0.12 },
      { key: "media", label: "Fotografia & Filme (10%)", value: totalBudget * 0.1 },
      { key: "tech", label: "Convites, Website & RSVP (5%)", value: totalBudget * 0.05 },
      { key: "reserve", label: "Fundo de Reserva / Extras (8%)", value: totalBudget * 0.08 },
    ];
  };

  const getWhatsAppLink = () => {
    let message = "";
    if (activeTab === "orcamento") {
      const breakdownText = getBudgetBreakdown()
        .map((item) => `- ${item.label}: ${item.value.toLocaleString()} €`)
        .join("\n");
      message = `Olá HAXR Signature, simulei a distribuição do meu orçamento de casamentos no vosso simulador:\n- Orçamento Total: ${totalBudget.toLocaleString()} €\n\nDistribuição Sugerida:\n${breakdownText}\n\nGostaria de obter uma proposta personalizada com base nestes números.`;
    } else {
      const currentTasks = tasksData[monthsLeft];
      const completed = currentTasks.filter((t) => t.done).map((t) => `[x] ${t.text}`).join("\n");
      const pending = currentTasks.filter((t) => !t.done).map((t) => `[ ] ${t.text}`).join("\n");
      message = `Olá HAXR Signature, planeei as minhas metas de casamento a ${monthsLeft} meses do evento:\n\nConcluídas:\n${completed || "Nenhuma ainda"}\n\nPendentes:\n${pending || "Nenhuma"}\n\nGostaria de falar com um organizador para me ajudar nas pendentes!`;
    }
    return `https://wa.me/258870883428?text=${encodeURIComponent(message)}`;
  };

  return (
    <section id="centro-planeamento" className="relative py-24 md:py-32 bg-brand-champagne/15 border-y border-brand-champagne/30">
      <div className="site-container mx-auto">
        <div className="max-w-3xl mb-16 md:mb-20">
          <RevealOnScroll>
            <h2 className="section-label mb-6">Jornada</h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.05}>
            <p className="font-serif text-2xl md:text-3xl lg:text-4xl font-light text-brand-text-dark leading-relaxed mb-6">
              Vossa jornada de casamento começa aqui.
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.1}>
            <p className="font-sans text-sm text-brand-text-dark/75 leading-relaxed font-light">
              Use as nossas ferramentas interativas inspiradas em Loverly para simular o orçamento do casamento e organizar o seu checklist de tarefas.
            </p>
          </RevealOnScroll>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Seletor de Tabs Esquerda */}
          <div className="lg:col-span-4 space-y-4">
            <button
              type="button"
              onClick={() => setActiveTab("orcamento")}
              className={`w-full text-left p-6 border rounded-2xl transition-all duration-300 flex items-center justify-between group cursor-pointer ${
                activeTab === "orcamento"
                  ? "bg-white border-brand-gold shadow-md"
                  : "bg-white/40 border-brand-champagne/40 hover:border-brand-gold/60"
              }`}
            >
              <div className="flex items-center gap-4">
                <DollarSign className={`w-5 h-5 ${activeTab === "orcamento" ? "text-brand-gold" : "text-brand-text-dark/50"}`} />
                <div>
                  <h3 className="font-serif text-sm font-medium text-brand-text-dark">Calculadora de Orçamento</h3>
                  <p className="font-sans text-[11px] text-brand-text-dark/50 font-light mt-0.5">Distribua a verba do seu evento</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-brand-gold/60 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("checklist")}
              className={`w-full text-left p-6 border rounded-2xl transition-all duration-300 flex items-center justify-between group cursor-pointer ${
                activeTab === "checklist"
                  ? "bg-white border-brand-gold shadow-md"
                  : "bg-white/40 border-brand-champagne/40 hover:border-brand-gold/60"
              }`}
            >
              <div className="flex items-center gap-4">
                <ClipboardList className={`w-5 h-5 ${activeTab === "checklist" ? "text-brand-gold" : "text-brand-text-dark/50"}`} />
                <div>
                  <h3 className="font-serif text-sm font-medium text-brand-text-dark">Checklist do Casamento</h3>
                  <p className="font-sans text-[11px] text-brand-text-dark/50 font-light mt-0.5">Tarefas por meses em falta</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-brand-gold/60 shrink-0" />
            </button>
          </div>

          {/* Painel Interativo Direita */}
          <div className="lg:col-span-8 bg-white border border-brand-champagne/60 rounded-3xl p-8 md:p-10 shadow-lg min-h-[460px] flex flex-col justify-between">

            {activeTab === "orcamento" ? (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <DollarSign className="w-4 h-4 text-brand-gold" />
                    <span className="font-mono text-[9px] tracking-wider uppercase text-brand-gold font-bold">Simulação Orçamental</span>
                  </div>
                  <h4 className="font-serif text-lg font-light text-brand-text-dark">Divisão Sugerida por Categoria</h4>
                </div>

                {/* Slider Input */}
                <div className="space-y-3 bg-brand-champagne/10 border border-brand-champagne/25 p-5 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] uppercase text-brand-text-dark/50">Orçamento Disponível</span>
                    <span className="font-serif text-xl font-medium text-brand-gold">{totalBudget.toLocaleString()} €</span>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="100000"
                    step="5000"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(Number(e.target.value))}
                    className="w-full h-1.5 bg-brand-champagne/45 rounded-lg appearance-none cursor-pointer accent-brand-gold"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-brand-text-dark/30">
                    <span>10.000 €</span>
                    <span>100.000 €</span>
                  </div>
                </div>

                {/* Resultados Dinâmicos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getBudgetBreakdown().map((item) => (
                    <div key={item.key} className="flex justify-between items-center py-2.5 border-b border-brand-champagne/30 text-xs font-sans">
                      <span className="text-brand-text-dark/70 font-light">{item.label}</span>
                      <span className="font-medium text-brand-text-dark">{item.value.toLocaleString()} €</span>
                    </div>
                  ))}
                </div>

                <div className="mt-2 text-right">
                  <Link href="/tools/budget-tracker" className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-brand-gold hover:text-brand-gold-light transition-colors font-bold cursor-pointer">
                    <span>Aceder à Calculadora Completa</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-start flex-col sm:flex-row gap-4 sm:gap-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <ClipboardList className="w-4 h-4 text-brand-gold" />
                      <span className="font-mono text-[9px] tracking-wider uppercase text-brand-gold font-bold">Checklist do Casal</span>
                    </div>
                    <h4 className="font-serif text-lg font-light text-brand-text-dark">Planeamento por Prazos</h4>
                  </div>

                  {/* Seletor de Meses */}
                  <div className="flex gap-2 bg-brand-champagne/20 p-1 rounded-lg border border-brand-champagne/40">
                    {[12, 6, 3].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMonthsLeft(m)}
                        className={`px-3 py-1.5 rounded text-[10px] font-mono tracking-wider uppercase cursor-pointer transition-colors ${
                          monthsLeft === m ? "bg-white text-brand-gold font-bold shadow-xs" : "text-brand-text-dark/50 hover:text-brand-text-dark"
                        }`}
                      >
                        {m} Meses
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista de Tarefas Interativa */}
                <div className="space-y-3 bg-brand-champagne/10 border border-brand-champagne/25 p-6 rounded-2xl">
                  <p className="font-mono text-[8px] tracking-widest text-brand-gold uppercase font-bold mb-4">Metas principais nesta fase:</p>
                  <div className="space-y-3.5">
                    {tasksData[monthsLeft].map((task) => (
                      <label
                        key={task.id}
                        className="flex items-start gap-3 cursor-pointer text-xs font-sans text-brand-text-dark/80 group"
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleTask(monthsLeft, task.id)}
                          className="mt-0.5 w-4.5 h-4.5 rounded border-brand-champagne/80 text-brand-gold focus:ring-brand-gold focus:ring-opacity-25"
                        />
                        <span className={`leading-relaxed transition-all font-light ${task.done ? "line-through text-brand-text-dark/40" : "group-hover:text-brand-text-dark"}`}>
                          {task.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-4 text-right">
                  <Link href="/tools/wedding-checklist" className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-brand-gold hover:text-brand-gold-light transition-colors font-bold cursor-pointer">
                    <span>Aceder ao Checklist Completo</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}

            {/* Ação WhatsApp Compartilhamento */}
            <div className="mt-8 pt-6 border-t border-brand-champagne/45 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-brand-text-dark/50 font-light">
                <HelpCircle className="w-4 h-4 text-brand-gold/60" />
                <span>Simule à vontade. Exporte e fale com um organizador no WhatsApp.</span>
              </div>
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-editorial btn-editorial--solid inline-flex items-center gap-3 w-full sm:w-auto"
              >
                <MessageCircle className="w-4 h-4 stroke-[1.25]" />
                <span>Iniciar conversa</span>
              </a>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
