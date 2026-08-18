"use client";

import { useState, useEffect } from "react";
import {
  Gift, Plus, Trash2, RotateCcw,
  MessageCircle, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import MarketingToolBanner from "@/components/marketing/MarketingToolBanner";
import ToolProductionCta from "@/components/marketing/ToolProductionCta";

interface RegistryGift {
  id: string;
  name: string;
  category: string;
  goal: number;
  received: number;
  description: string;
}

const defaultGifts: RegistryGift[] = [
  { id: "gift-1", name: "Voos de Lua de Mel", category: "Viagem", goal: 120000, received: 45000, description: "Ajude-nos a voar até às Maldivas para a nossa viagem de sonho." },
  { id: "gift-2", name: "Jantar Romântico na Praia", category: "Experiências", goal: 15000, received: 15000, description: "Um jantar privado à luz de velas sob as estrelas." },
  { id: "gift-3", name: "Fundo de Decoração para Casa", category: "Casa", goal: 200000, received: 85000, description: "Para mobilar o nosso novo ninho de amor com o vosso apoio." },
  { id: "gift-4", name: "Massagem de Spa para Casal", category: "Experiências", goal: 10000, received: 2500, description: "Um momento de puro relaxamento após a correria do casamento." },
];

const categories = ["Viagem", "Experiências", "Casa", "Casamento", "Outros"];

export default function CashRegistrySetupPage() {
  const [gifts, setGifts] = useState<RegistryGift[]>([]);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Viagem");
  const [newGoal, setNewGoal] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isClient, setIsClient] = useState(false);

  // Load from local storage
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("haxr_wedding_gifts_list");
    if (saved) {
      try {
        setGifts(JSON.parse(saved));
      } catch {
        setGifts(defaultGifts);
      }
    } else {
      setGifts(defaultGifts);
    }
  }, []);

  const saveGifts = (list: RegistryGift[]) => {
    setGifts(list);
    localStorage.setItem("haxr_wedding_gifts_list", JSON.stringify(list));
  };

  const addGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newGoal) return;

    const newGift: RegistryGift = {
      id: `gift-${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      goal: Number(newGoal),
      received: 0,
      description: newDescription.trim(),
    };

    saveGifts([...gifts, newGift]);
    setNewName("");
    setNewGoal("");
    setNewDescription("");
  };

  const deleteGift = (id: string) => {
    const updated = gifts.filter((g) => g.id !== id);
    saveGifts(updated);
  };

  const resetToDefault = () => {
    if (window.confirm("Deseja repor a lista original de presentes de casamento de exemplo?")) {
      saveGifts(defaultGifts);
    }
  };

  if (!isClient) {
    return (
      <main className="min-h-screen bg-brand-ivory flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-gold animate-pulse">Carregando prendas...</p>
      </main>
    );
  }

  // Calculate totals
  const totalGoal = gifts.reduce((acc, curr) => acc + curr.goal, 0);
  const totalReceived = gifts.reduce((acc, curr) => acc + curr.received, 0);
  const totalPercentage = totalGoal > 0 ? Math.round((totalReceived / totalGoal) * 100) : 0;

  const getWhatsAppLink = () => {
    const giftList = gifts
      .map((g) => `- ${g.name} (${g.category}): Objeto: ${g.goal.toLocaleString()} MT | Recebido: ${g.received.toLocaleString()} MT`)
      .join("\n");
    const message = `Olá HAXR Signature, gostaria de partilhar a lista de presentes/lua de mel configurada para o meu casamento:\n\nPresentes:\n${giftList}\n\nGostaria de obter assistência para integrar os dados de pagamento (M-Pesa / Iban) nas páginas de presentes.`;
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

        <MarketingToolBanner title="Lista de Presentes" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-brand-gold">
              <Gift className="w-4 h-4" />
              <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Ferramentas de Planeamento</span>
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-light leading-tight">
              Lista de Presentes de Casamento
            </h1>
            <p className="font-sans text-xs md:text-sm text-brand-text-dark/65 font-light max-w-xl">
              Crie uma lista elegante de presentes virtuais (como cotas para lua de mel ou móveis para a casa nova). Os seus convidados contribuem discretamente.
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

        {/* KPI metrics */}
        <div className="bg-white border border-brand-champagne/45 p-6 rounded-sm shadow-md mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-1">
            <p className="font-mono text-[8px] uppercase tracking-widest text-brand-text-dark/45 font-bold">Total Recebido</p>
            <p className="font-serif text-xl font-medium text-green-700">{totalReceived.toLocaleString()} MT</p>
          </div>
          <div className="space-y-1">
            <p className="font-mono text-[8px] uppercase tracking-widest text-brand-text-dark/45 font-bold">Meta Global do Fundo</p>
            <p className="font-serif text-xl font-medium text-brand-text-dark">{totalGoal.toLocaleString()} MT</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-[8px] text-brand-gold font-bold">
              <span>PROGRESsO GLOBAL</span>
              <span>{totalPercentage}%</span>
            </div>
            <div className="w-full h-1.5 bg-brand-champagne/25 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-gold transition-all duration-500"
                style={{ width: `${totalPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Add Gift Form */}
          <div className="lg:col-span-4 bg-white border border-brand-champagne/45 p-6 rounded-sm shadow-sm space-y-4">
            <h3 className="font-serif text-sm font-medium text-brand-text-dark mb-2">Criar Presente / Fundo</h3>

            <form onSubmit={addGift} className="space-y-4">
              <div>
                <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                  Título do Presente
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Passeio de Barco nas Maldivas"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm cursor-pointer outline-none font-sans"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                    Meta de Valor (MT)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="15000"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                  Descrição do Presente
                </label>
                <textarea
                  placeholder="Explique aos convidados como este presente nos fará felizes..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[9px] tracking-widest uppercase font-bold py-3.5 rounded-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Presente</span>
              </button>
            </form>
          </div>

          {/* List/Preview of Gifts */}
          <div className="lg:col-span-8 bg-white border border-brand-champagne/45 rounded-sm p-6 md:p-8 shadow-sm space-y-6">
            <h3 className="font-serif text-base font-light mb-6 border-b border-brand-champagne/25 pb-3">
              Listagem e Progresso de Prendas
            </h3>

            {gifts.length === 0 ? (
              <div className="text-center py-12 text-brand-text-dark/40 font-light text-xs">
                Nenhum presente na lista. Adicione o primeiro fundo de presentes acima.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {gifts.map((gift) => {
                  const giftPercentage = gift.goal > 0 ? Math.round((gift.received / gift.goal) * 100) : 0;
                  return (
                    <div
                      key={gift.id}
                      className="p-5 border border-brand-champagne/20 rounded-sm hover:border-brand-gold/45 transition-all flex flex-col justify-between bg-brand-champagne/5"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-3">
                          <span className="font-mono text-[7px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold">
                            {gift.category}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteGift(gift.id)}
                            className="text-brand-text-dark/30 hover:text-red-600 transition-colors p-1"
                            title="Eliminar presente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <h4 className="font-serif text-base font-light text-brand-text-dark leading-tight">{gift.name}</h4>
                        {gift.description && (
                          <p className="font-sans text-[11px] text-brand-text-dark/65 font-light leading-relaxed">
                            {gift.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 mt-6 pt-3 border-t border-brand-champagne/10">
                        <div className="flex justify-between font-mono text-[8px] text-brand-text-dark/50">
                          <span>Recebido: <strong className="text-green-700 font-medium">{gift.received.toLocaleString()} MT</strong></span>
                          <span>Meta: <strong className="font-medium">{gift.goal.toLocaleString()} MT</strong></span>
                        </div>
                        <div className="w-full h-1 bg-brand-champagne/25 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-gold transition-all duration-300"
                            style={{ width: `${giftPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Export and Contact info */}
            <div className="mt-8 pt-6 border-t border-brand-champagne/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-champagne/5 p-4 rounded-sm">
              <div className="text-left">
                <h4 className="font-serif text-xs font-semibold text-brand-text-dark">Integrar Métodos de Pagamento</h4>
                <p className="font-sans text-[10px] text-brand-text-dark/50 font-light leading-relaxed mt-0.5">
                  Para ligar a vossa lista ao M-Pesa, E-Mola ou IBAN bancário em Moçambique, fale com a equipa técnica.
                </p>
              </div>
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-editorial btn-editorial--solid py-3 px-6 font-mono text-[9px] tracking-widest uppercase font-bold rounded-sm inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Configurar Pagamentos</span>
              </a>
            </div>

          </div>

        </div>

        <ToolProductionCta />

      </div>
    </main>
  );
}
