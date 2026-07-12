"use client";

import { useState, useEffect } from "react";
import {
  Palette, Plus, Trash2, RotateCcw,
  MessageCircle, ArrowLeft
} from "lucide-react";
import Link from "next/link";

interface BoardItem {
  id: string;
  title: string;
  category: string; // Decoração, Vestuário, Flores, Papelaria
  imageUrl: string;
  notes: string;
}

const defaultItems: BoardItem[] = [
  {
    id: "board-1",
    title: "Paleta Champagne & Velas Altas",
    category: "Decoração",
    imageUrl: "https://images.unsplash.com/photo-1519225495810-7517c51c9150?auto=format&fit=crop&w=600&q=80",
    notes: "Velas cónicas brancas de diferentes alturas e arranjos florais discretos marfim."
  },
  {
    id: "board-2",
    title: "Look de Noiva Minimalista & Clean",
    category: "Vestuário",
    imageUrl: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=600&q=80",
    notes: "Vestido estruturado com decote reto, tecido mikado de seda sem brilho."
  },
  {
    id: "board-3",
    title: "Ramo de Noiva de Hortênsias",
    category: "Flores",
    imageUrl: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80",
    notes: "Hortênsias brancas e apontamentos de eucalipto fresco para um tom orgânico."
  },
  {
    id: "board-4",
    title: "Papelaria Texturada em Relevo Seco",
    category: "Papelaria",
    imageUrl: "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=600&q=80",
    notes: "Menu e marcador de mesa em papel de algodão 300g com monograma discreto."
  },
];

const categories = ["Decoração", "Vestuário", "Flores", "Papelaria", "Outros"];

export default function VisionBoardsPage() {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [filterCategory, setFilterCategory] = useState<string | "all">("all");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Decoração");
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemNotes, setNewItemNotes] = useState("");
  const [isClient, setIsClient] = useState(false);

  // Load from local storage
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("haxr_vision_items");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        setItems(defaultItems);
      }
    } else {
      setItems(defaultItems);
    }
  }, []);

  const saveItems = (list: BoardItem[]) => {
    setItems(list);
    localStorage.setItem("haxr_vision_items", JSON.stringify(list));
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    // Use default premium placeholder if no URL is provided
    const imgUrl = newItemUrl.trim() || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80";

    const newItem: BoardItem = {
      id: `board-${Date.now()}`,
      title: newItemTitle.trim(),
      category: newItemCategory,
      imageUrl: imgUrl,
      notes: newItemNotes.trim(),
    };

    saveItems([...items, newItem]);
    setNewItemTitle("");
    setNewItemUrl("");
    setNewItemNotes("");
  };

  const deleteItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    saveItems(updated);
  };

  const resetToDefault = () => {
    if (window.confirm("Deseja repor a galeria conceitual de exemplo?")) {
      saveItems(defaultItems);
    }
  };

  if (!isClient) {
    return (
      <main className="min-h-screen bg-brand-ivory flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-gold animate-pulse">Carregando referências...</p>
      </main>
    );
  }

  // Filter
  const filteredItems = items.filter((item) => filterCategory === "all" || item.category === filterCategory);

  const getWhatsAppLink = () => {
    const boardText = items
      .map((item) => `- ${item.title} (${item.category}): ${item.notes || "Sem notas."}`)
      .join("\n");
    const message = `Olá HAXR Signature, gostaria de partilhar o meu Vision Board estético de casamento:\n\nReferências:\n${boardText}\n\nGostaria de alinhar estes conceitos com o designer floral/decorador da vossa equipa.`;
    return `https://wa.me/258870883428?text=${encodeURIComponent(message)}`;
  };

  return (
    <main className="relative min-h-screen py-24 bg-brand-ivory text-brand-text-dark">
      <div className="site-container mx-auto px-4 max-w-6xl">

        {/* Back Link */}
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-brand-text-dark/50 hover:text-brand-text-dark mb-10 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Painel</span>
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-brand-gold">
              <Palette className="w-4 h-4" />
              <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Ferramentas de Planeamento</span>
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-light leading-tight">
              Vision Board & Inspiração
            </h1>
            <p className="font-sans text-xs md:text-sm text-brand-text-dark/65 font-light max-w-xl">
              Crie coleções visuais com as referências estéticas preferidas do casal. Agrupe inspirações de vestidos, flores, decorações de mesa e convites num só local.
            </p>
          </div>

          <button
            type="button"
            onClick={resetToDefault}
            className="self-start md:self-auto inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-brand-text-dark/40 hover:text-red-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Repor Galeria</span>
          </button>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap gap-2 mb-10 border-b border-brand-champagne/25 pb-4">
          {[
            { label: "Ver Tudo", val: "all" },
            { label: "Decoração", val: "Decoração" },
            { label: "Vestuário", val: "Vestuário" },
            { label: "Flores", val: "Flores" },
            { label: "Papelaria", val: "Papelaria" },
            { label: "Outros", val: "Outros" },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setFilterCategory(item.val)}
              className={`px-4 py-2 rounded-full border text-[9px] font-mono tracking-wider uppercase transition-colors cursor-pointer ${
                filterCategory === item.val
                  ? "bg-brand-gold border-brand-gold text-white font-bold"
                  : "border-brand-champagne/45 bg-white text-brand-text-dark/65 hover:border-brand-gold/60"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Layout: Sidebar add + main board */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Add Board Item Form */}
          <div className="lg:col-span-4 bg-white border border-brand-champagne/45 p-6 rounded-sm shadow-sm space-y-4">
            <h3 className="font-serif text-sm font-medium text-brand-text-dark mb-2">Adicionar Referência</h3>

            <form onSubmit={addItem} className="space-y-4">
              <div>
                <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                  Título da Inspiração
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Arranjo de Entrada"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans"
                />
              </div>

              <div>
                <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                  Categoria Estética
                </label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm cursor-pointer outline-none font-sans"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                  URL da Imagem (Pinterest, Unsplash, etc.)
                </label>
                <input
                  type="url"
                  placeholder="Deixe em branco para usar uma imagem padrão"
                  value={newItemUrl}
                  onChange={(e) => setNewItemUrl(e.target.value)}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans"
                />
              </div>

              <div>
                <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                  Notas / Observações
                </label>
                <textarea
                  placeholder="Descreva o que gosta nesta referência (detalhe, paleta, tecido...)"
                  value={newItemNotes}
                  onChange={(e) => setNewItemNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[9px] tracking-widest uppercase font-bold py-3.5 rounded-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Fixar Referência</span>
              </button>
            </form>
          </div>

          {/* Vision Board Grid */}
          <div className="lg:col-span-8 space-y-6">
            {filteredItems.length === 0 ? (
              <div className="bg-white border border-brand-champagne/45 p-12 text-center rounded-sm shadow-xs text-brand-text-dark/40 font-light text-xs">
                Nenhuma referência encontrada para esta categoria. Adicione a primeira acima!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-brand-champagne/45 rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Backdrop */}
                      <div className="h-56 relative w-full overflow-hidden bg-brand-champagne/10 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <span className="absolute top-3 left-3 font-mono text-[8px] tracking-wider uppercase bg-white/95 backdrop-blur-xs text-brand-gold px-3 py-1 rounded-full shadow-xs">
                          {item.category}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-2">
                        <h4 className="font-serif text-base font-light text-brand-text-dark">{item.title}</h4>
                        {item.notes && (
                          <p className="font-sans text-[11px] text-brand-text-dark/60 leading-relaxed font-light">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-5 pt-0 flex justify-end">
                      <button
                        type="button"
                        onClick={() => deleteItem(item.id)}
                        className="text-brand-text-dark/30 hover:text-red-600 transition-colors p-1"
                        title="Eliminar referência"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Export and Contact block */}
            <div className="pt-6 border-t border-brand-champagne/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-champagne/5 p-4 rounded-sm">
              <div className="text-left">
                <h4 className="font-serif text-xs font-semibold text-brand-text-dark">Submeter Vision Board</h4>
                <p className="font-sans text-[10px] text-brand-text-dark/50 font-light leading-relaxed mt-0.5">
                  Partilhe as referências de estilo com o organizador da HAXR para validação e briefing de fornecedores.
                </p>
              </div>
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-editorial btn-editorial--solid py-3 px-6 font-mono text-[9px] tracking-widest uppercase font-bold rounded-sm inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Exportar Vision Board</span>
              </a>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}
