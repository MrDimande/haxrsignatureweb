"use client";

import { useState, useEffect } from "react";
import {
  Plus, Trash2, RotateCcw,
  MessageCircle, ArrowLeft, Phone, Briefcase,
  CheckCircle, FileText
} from "lucide-react";
import Link from "next/link";
import MarketingToolBanner from "@/components/marketing/MarketingToolBanner";
import ToolProductionCta from "@/components/marketing/ToolProductionCta";

interface Vendor {
  id: string;
  name: string;
  category: string;
  contact: string;
  cost: number;
  paid: number;
  status: "Por Contratar" | "Contratado" | "Em Negociação";
}

const defaultVendors: Vendor[] = [
  { id: "vendor-1", name: "Elegance Decor", category: "Decoração", contact: "+258 84 999 1111", cost: 85000, paid: 42500, status: "Contratado" },
  { id: "vendor-2", name: "Studio Lumina (Foto)", category: "Fotografia", contact: "lumina@studio.co.mz", cost: 60000, paid: 30000, status: "Contratado" },
  { id: "vendor-3", name: "Salão Signature Maputo", category: "Espaço", contact: "+258 82 888 2222", cost: 150000, paid: 75000, status: "Contratado" },
  { id: "vendor-4", name: "Buffet Gourmet Lda", category: "Catering", contact: "geral@gourmet.co.mz", cost: 200000, paid: 0, status: "Em Negociação" },
];

const categories = ["Espaço", "Catering", "Decoração", "Fotografia", "Vídeo", "DJ & Música", "Maquilhagem", "Outros"];

export default function VendorManagerPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorCategory, setNewVendorCategory] = useState("Decoração");
  const [newVendorContact, setNewVendorContact] = useState("");
  const [newVendorCost, setNewVendorCost] = useState("");
  const [newVendorPaid, setNewVendorPaid] = useState("");
  const [newVendorStatus, setNewVendorStatus] = useState<"Por Contratar" | "Contratado" | "Em Negociação">("Em Negociação");
  const [isClient, setIsClient] = useState(false);

  // Load from local storage
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("haxr_wedding_vendors");
    if (saved) {
      try {
        setVendors(JSON.parse(saved));
      } catch {
        setVendors(defaultVendors);
      }
    } else {
      setVendors(defaultVendors);
    }
  }, []);

  const saveVendors = (list: Vendor[]) => {
    setVendors(list);
    localStorage.setItem("haxr_wedding_vendors", JSON.stringify(list));
  };

  const addVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim() || !newVendorCost) return;

    const newVendor: Vendor = {
      id: `vendor-${Date.now()}`,
      name: newVendorName.trim(),
      category: newVendorCategory,
      contact: newVendorContact.trim() || "N/A",
      cost: Number(newVendorCost),
      paid: Number(newVendorPaid) || 0,
      status: newVendorStatus,
    };

    saveVendors([...vendors, newVendor]);
    setNewVendorName("");
    setNewVendorContact("");
    setNewVendorCost("");
    setNewVendorPaid("");
    setNewVendorStatus("Em Negociação");
  };

  const deleteVendor = (id: string) => {
    const updated = vendors.filter((v) => v.id !== id);
    saveVendors(updated);
  };

  const updateStatus = (id: string, newStatus: "Por Contratar" | "Contratado" | "Em Negociação") => {
    const updated = vendors.map((v) => (v.id === id ? { ...v, status: newStatus } : v));
    saveVendors(updated);
  };

  const resetToDefault = () => {
    if (window.confirm("Deseja repor a lista original de fornecedores de exemplo?")) {
      saveVendors(defaultVendors);
    }
  };

  if (!isClient) {
    return (
      <main className="min-h-screen bg-brand-ivory flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-gold animate-pulse">Carregando fornecedores...</p>
      </main>
    );
  }

  // Calculations
  const totalCost = vendors.reduce((acc, curr) => acc + curr.cost, 0);
  const totalPaid = vendors.reduce((acc, curr) => acc + curr.paid, 0);
  const hiredCount = vendors.filter((v) => v.status === "Contratado").length;
  const negotiationCount = vendors.filter((v) => v.status === "Em Negociação").length;

  const getWhatsAppLink = () => {
    const listText = vendors
      .map((v) => `- ${v.name} (${v.category}): ${v.cost.toLocaleString()} MT [${v.status}]`)
      .join("\n");
    const message = `Olá HAXR Signature, gostaria de partilhar a minha lista de fornecedores em progresso:\n- Contratados: ${hiredCount}\n- Em Negociação: ${negotiationCount}\n- Total Orçado: ${totalCost.toLocaleString()} MT\n\nLista de Fornecedores:\n${listText}`;
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

        <MarketingToolBanner title="Gestor de Fornecedores" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-brand-gold">
              <Briefcase className="w-4 h-4" />
              <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Ferramentas de Planeamento</span>
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-light leading-tight">
              Gestor de Fornecedores
            </h1>
            <p className="font-sans text-xs md:text-sm text-brand-text-dark/65 font-light max-w-xl">
              Organize os contactos, acompanhe as propostas e faça o controlo de pagamentos e adjudicações de todos os fornecedores do seu casamento.
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

        {/* Key Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-brand-champagne/45 p-6 rounded-sm shadow-xs space-y-1">
            <p className="font-mono text-[8px] uppercase tracking-widest text-brand-text-dark/45 font-bold">Total Adjudicado</p>
            <p className="font-serif text-xl font-medium text-brand-text-dark">{totalCost.toLocaleString()} MT</p>
          </div>
          <div className="bg-white border border-brand-champagne/45 p-6 rounded-sm shadow-xs space-y-1">
            <p className="font-mono text-[8px] uppercase tracking-widest text-green-700 font-bold">Total Pago (Sinalizado)</p>
            <p className="font-serif text-xl font-medium text-green-700">{totalPaid.toLocaleString()} MT</p>
          </div>
          <div className="bg-white border border-brand-champagne/45 p-6 rounded-sm shadow-xs space-y-1">
            <p className="font-mono text-[8px] uppercase tracking-widest text-brand-gold font-bold">Contratos Ativos</p>
            <p className="font-serif text-xl font-medium text-brand-gold">{hiredCount} de {vendors.length} fornecedores</p>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Add Vendor Form */}
          <div className="lg:col-span-4 bg-white border border-brand-champagne/45 p-6 rounded-sm shadow-sm space-y-4">
            <h3 className="font-serif text-sm font-medium text-brand-text-dark mb-2">Novo Fornecedor</h3>

            <form onSubmit={addVendor} className="space-y-4">
              <div>
                <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                  Nome da Empresa / Profissional
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pastelaria Delícias"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans"
                />
              </div>

              <div>
                <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                  Categoria
                </label>
                <select
                  value={newVendorCategory}
                  onChange={(e) => setNewVendorCategory(e.target.value)}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm cursor-pointer outline-none font-sans"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                  Contacto (Telefone ou Email)
                </label>
                <input
                  type="text"
                  placeholder="Ex: +258 84 111 2222"
                  value={newVendorContact}
                  onChange={(e) => setNewVendorContact(e.target.value)}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                    Valor Total (MT)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="50000"
                    value={newVendorCost}
                    onChange={(e) => setNewVendorCost(e.target.value)}
                    className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                    Sinal Pago (MT)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newVendorPaid}
                    onChange={(e) => setNewVendorPaid(e.target.value)}
                    className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                  Estado do Contrato
                </label>
                <select
                  value={newVendorStatus}
                  onChange={(e) => setNewVendorStatus(e.target.value as typeof newVendorStatus)}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm cursor-pointer outline-none font-sans"
                >
                  <option value="Por Contratar">Por Contratar</option>
                  <option value="Em Negociação">Em Negociação</option>
                  <option value="Contratado">Contratado</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[9px] tracking-widest uppercase font-bold py-3.5 rounded-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Fornecedor</span>
              </button>
            </form>
          </div>

          {/* Vendor List */}
          <div className="lg:col-span-8 bg-white border border-brand-champagne/45 rounded-sm p-6 md:p-8 shadow-sm space-y-6">
            <h3 className="font-serif text-base font-light mb-6 border-b border-brand-champagne/25 pb-3">
              Fichas de Fornecedores
            </h3>

            {vendors.length === 0 ? (
              <div className="text-center py-12 text-brand-text-dark/40 font-light text-xs">
                Nenhum fornecedor adicionado. Registe os seus fornecedores para controlar prazos e faturas.
              </div>
            ) : (
              <div className="space-y-4">
                {vendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="p-5 border border-brand-champagne/20 rounded-sm hover:border-brand-gold/45 transition-colors space-y-4 bg-brand-champagne/5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="inline-block font-mono text-[7px] tracking-wider uppercase bg-brand-gold/10 text-brand-gold px-2.5 py-0.5 rounded-full">
                          {vendor.category}
                        </span>
                        <h4 className="font-serif text-base font-light text-brand-text-dark">{vendor.name}</h4>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <select
                          value={vendor.status}
                          onChange={(e) => updateStatus(vendor.id, e.target.value as typeof newVendorStatus)}
                          className="bg-white border border-brand-champagne/45 text-[8px] font-mono tracking-wider uppercase px-2 py-1 outline-none rounded-sm cursor-pointer focus:border-brand-gold"
                        >
                          <option value="Por Contratar">Por Contratar</option>
                          <option value="Em Negociação">Em Negociação</option>
                          <option value="Contratado">Contratado</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => deleteVendor(vendor.id)}
                          className="text-brand-text-dark/35 hover:text-red-600 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-brand-champagne/10 font-sans text-xs">
                      <div className="flex items-center gap-2 text-brand-text-dark/65 font-light">
                        <Phone className="w-3.5 h-3.5 text-brand-gold/60 shrink-0" />
                        <span>{vendor.contact}</span>
                      </div>

                      <div className="flex items-center gap-2 text-brand-text-dark/65 font-light">
                        <FileText className="w-3.5 h-3.5 text-brand-gold/60 shrink-0" />
                        <span>Orçado: <strong className="font-mono text-[11px] font-medium">{vendor.cost.toLocaleString()} MT</strong></span>
                      </div>

                      <div className="flex items-center gap-2 text-brand-text-dark/65 font-light">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                        <span>Pago: <strong className="font-mono text-[11px] font-medium text-green-700">{vendor.paid.toLocaleString()} MT</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Export block */}
            <div className="mt-8 pt-6 border-t border-brand-champagne/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-champagne/5 p-4 rounded-sm">
              <div className="text-left">
                <h4 className="font-serif text-xs font-semibold text-brand-text-dark">Exportar Lista de Fornecedores</h4>
                <p className="font-sans text-[10px] text-brand-text-dark/50 font-light leading-relaxed mt-0.5">
                  Partilhe as vossas cotações e contratos com a assessora HAXR.
                </p>
              </div>
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-editorial btn-editorial--solid py-3 px-6 font-mono text-[9px] tracking-widest uppercase font-bold rounded-sm inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Exportar Fornecedores</span>
              </a>
            </div>

          </div>

        </div>

        <ToolProductionCta />

      </div>
    </main>
  );
}
