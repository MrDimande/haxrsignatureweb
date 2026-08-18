"use client";

import { useState, useEffect } from "react";
import {
  ClipboardList, Plus, Trash2, RotateCcw,
  MessageCircle, CheckCircle, Circle, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import MarketingToolBanner from "@/components/marketing/MarketingToolBanner";
import ToolProductionCta from "@/components/marketing/ToolProductionCta";

interface Task {
  id: string;
  text: string;
  timeframe: number; // 12, 6, 3, 1
  done: boolean;
  custom?: boolean;
}

const defaultTasks: Task[] = [
  // 12 Months
  { id: "def-12-1", text: "Definir orçamento geral e estimativa de convidados", timeframe: 12, done: false },
  { id: "def-12-2", text: "Escolher e reservar o local da cerimónia e recepção", timeframe: 12, done: false },
  { id: "def-12-3", text: "Contratar o serviço de Assessoria Completa HAXR", timeframe: 12, done: false },
  { id: "def-12-4", text: "Pesquisar referências e criar o primeiro Moodboard visual", timeframe: 12, done: false },
  // 6 Months
  { id: "def-6-1", text: "Finalizar lista de convidados para iniciar RSVP preliminar", timeframe: 6, done: false },
  { id: "def-6-2", text: "Contratar catering, fotógrafo e equipa de filmagem", timeframe: 6, done: false },
  { id: "def-6-3", text: "Enviar o Save the Date Digital aos convidados", timeframe: 6, done: false },
  { id: "def-6-4", text: "Selecionar vestido de noiva e fato do noivo", timeframe: 6, done: false },
  // 3 Months
  { id: "def-3-1", text: "Criar e partilhar o Website e Convite Digital Oficial", timeframe: 3, done: false },
  { id: "def-3-2", text: "Definir menu, bolo de noiva e provas gastronómicas", timeframe: 3, done: false },
  { id: "def-3-3", text: "Rever a identidade visual e o projeto de decoração", timeframe: 3, done: false },
  { id: "def-3-4", text: "Registrar a lista de presentes ou Honeymoon Fund", timeframe: 3, done: false },
  // 1 Month
  { id: "def-1-1", text: "Confirmar contagem final de convidados via RSVP", timeframe: 1, done: false },
  { id: "def-1-2", text: "Criar o plano de mesas (Seating Plan) e Find Your Seat", timeframe: 1, done: false },
  { id: "def-1-3", text: "Fazer ensaio geral da cerimónia com a equipa HAXR", timeframe: 1, done: false },
  { id: "def-1-4", text: "Entregar cronograma minuto-a-minuto aos fornecedores", timeframe: 1, done: false },
];

export default function WeddingChecklistPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeframeFilter, setTimeframeFilter] = useState<number | "all">("all");
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskTimeframe, setNewTaskTimeframe] = useState<number>(12);
  const [isClient, setIsClient] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("haxr_wedding_tasks");
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch {
        setTasks(defaultTasks);
      }
    } else {
      setTasks(defaultTasks);
    }
  }, []);

  // Save to local storage when tasks change
  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem("haxr_wedding_tasks", JSON.stringify(newTasks));
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    saveTasks(updated);
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: `custom-${Date.now()}`,
      text: newTaskText.trim(),
      timeframe: newTaskTimeframe,
      done: false,
      custom: true,
    };

    saveTasks([...tasks, newTask]);
    setNewTaskText("");
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    saveTasks(updated);
  };

  const resetToDefault = () => {
    if (window.confirm("Deseja repor a checklist original? Isto irá apagar as suas tarefas personalizadas.")) {
      saveTasks(defaultTasks);
    }
  };

  if (!isClient) {
    return (
      <main className="min-h-screen bg-brand-ivory flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-gold animate-pulse">Carregando checklist...</p>
      </main>
    );
  }

  // Filter tasks
  const filteredTasks = tasks.filter((t) => timeframeFilter === "all" || t.timeframe === timeframeFilter);

  // Calculate metrics
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.done).length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getWhatsAppLink = () => {
    const doneList = tasks.filter((t) => t.done).map((t) => `- [x] ${t.text}`).join("\n");
    const todoList = tasks.filter((t) => !t.done).map((t) => `- [ ] ${t.text}`).join("\n");
    const message = `Olá HAXR Signature, gostaria de partilhar o progresso do meu planeamento de casamento (${percentage}% concluído):\n\nConcluídos:\n${doneList || "Nenhum"}\n\nPendentes:\n${todoList || "Nenhum"}`;
    return `https://wa.me/258870883428?text=${encodeURIComponent(message)}`;
  };

  return (
    <main className="relative min-h-screen py-24 bg-brand-ivory text-brand-text-dark">
      <div className="site-container mx-auto px-4 max-w-4xl">

        {/* Back Link */}
        <Link
          href="/ferramentas"
          className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-brand-text-dark/50 hover:text-brand-text-dark mb-10 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar às ferramentas</span>
        </Link>

        <MarketingToolBanner title="Checklist" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-brand-gold">
              <ClipboardList className="w-4 h-4" />
              <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Ferramentas de Planeamento</span>
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-light leading-tight">
              Checklist de Casamento
            </h1>
            <p className="font-sans text-xs md:text-sm text-brand-text-dark/65 font-light max-w-xl">
              Organize todas as etapas cruciais para o grande dia. Adicione as suas próprias metas e exporte o progresso para a sua assessora HAXR.
            </p>
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={resetToDefault}
            className="self-start md:self-auto inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-brand-text-dark/40 hover:text-red-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Repor Checklist</span>
          </button>
        </div>

        {/* Progress Card */}
        <div className="bg-white border border-brand-champagne/45 p-6 md:p-8 rounded-sm shadow-md space-y-4 mb-8">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-brand-text-dark/55">
            <span>Progresso Geral do Casamento</span>
            <span className="font-bold text-brand-gold text-sm">{percentage}%</span>
          </div>
          <div className="w-full h-2 bg-brand-champagne/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-gold transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="font-sans text-[11px] text-brand-text-dark/50 font-light">
            Concluiu {completedCount} de {totalCount} tarefas recomendadas para um casamento de alto padrão.
          </p>
        </div>

        {/* Form and Filters Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Form & Add */}
          <div className="lg:col-span-4 space-y-6">

            {/* Add Task Box */}
            <div className="bg-white border border-brand-champagne/45 p-6 rounded-sm shadow-sm">
              <h3 className="font-serif text-sm font-medium mb-4 text-brand-text-dark">Nova Tarefa</h3>

              <form onSubmit={addTask} className="space-y-4">
                <div>
                  <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                    Descrição
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Reservar DJ de Maputo"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                    Prazo Recomendado
                  </label>
                  <select
                    value={newTaskTimeframe}
                    onChange={(e) => setNewTaskTimeframe(Number(e.target.value))}
                    className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans cursor-pointer"
                  >
                    <option value={12}>12 Meses antes</option>
                    <option value={6}>6 Meses antes</option>
                    <option value={3}>3 Meses antes</option>
                    <option value={1}>1 Mês antes</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[9px] tracking-widest uppercase font-bold py-3.5 rounded-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </form>
            </div>

            {/* Timeframe Filters */}
            <div className="bg-white border border-brand-champagne/45 p-6 rounded-sm shadow-sm space-y-3">
              <h3 className="font-serif text-sm font-medium mb-3 text-brand-text-dark">Filtros de Fase</h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Todas as tarefas", val: "all" },
                  { label: "12 Meses Antes", val: 12 },
                  { label: "6 Meses Antes", val: 6 },
                  { label: "3 Meses Antes", val: 3 },
                  { label: "1 Mês Antes", val: 1 },
                ].map((item) => {
                  const isActive = timeframeFilter === item.val;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setTimeframeFilter(item.val as typeof timeframeFilter)}
                      className={`w-full text-left px-4 py-2.5 rounded-sm text-xs font-mono tracking-wider transition-colors cursor-pointer ${
                        isActive
                          ? "bg-brand-gold text-white font-bold"
                          : "bg-brand-champagne/10 hover:bg-brand-champagne/25 text-brand-text-dark/70"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Task List */}
          <div className="lg:col-span-8 bg-white border border-brand-champagne/45 rounded-sm p-6 md:p-8 shadow-sm">
            <h3 className="font-serif text-base font-light mb-6 border-b border-brand-champagne/25 pb-3">
              {timeframeFilter === "all" ? "Todas as Metas" : `Metas de ${timeframeFilter} Meses`}
            </h3>

            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <p className="font-sans text-xs text-brand-text-dark/40 font-light">Nenhuma tarefa encontrada para esta fase.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start justify-between gap-4 p-4 border border-brand-champagne/20 rounded-sm hover:bg-brand-champagne/5 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className="flex items-start gap-3.5 text-left cursor-pointer flex-1"
                    >
                      {task.done ? (
                        <CheckCircle className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-5 h-5 text-brand-champagne hover:text-brand-gold shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={`font-sans text-xs leading-relaxed text-brand-text-dark/95 ${task.done ? "line-through text-brand-text-dark/40 font-light" : "font-light"}`}>
                          {task.text}
                        </p>
                        <span className="inline-block mt-1.5 font-mono text-[8px] uppercase tracking-wider text-brand-gold/70 bg-brand-champagne/10 px-2 py-0.5 rounded-full">
                          {task.timeframe} Meses
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="text-brand-text-dark/30 hover:text-red-600 transition-colors p-1"
                      title="Eliminar tarefa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Export Action */}
            <div className="mt-10 pt-6 border-t border-brand-champagne/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-champagne/5 p-4 rounded-sm">
              <div className="text-left">
                <h4 className="font-serif text-xs font-semibold text-brand-text-dark">Exportar para Assessoria HAXR</h4>
                <p className="font-sans text-[10px] text-brand-text-dark/50 font-light leading-relaxed mt-0.5">
                  Partilhe as suas metas completadas e dúvidas diretamente com o seu assessor por WhatsApp.
                </p>
              </div>
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-editorial btn-editorial--solid py-3 px-6 font-mono text-[9px] tracking-widest uppercase font-bold rounded-sm inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Exportar metas</span>
              </a>
            </div>

          </div>

        </div>

        <ToolProductionCta />

      </div>
    </main>
  );
}
