"use client";

import { useState, useEffect } from "react";
import {
  Users, Plus, Trash2, RotateCcw,
  MessageCircle, ArrowLeft, Search
} from "lucide-react";
import Link from "next/link";
import MarketingToolBanner from "@/components/marketing/MarketingToolBanner";
import ToolProductionCta from "@/components/marketing/ToolProductionCta";

interface Guest {
  id: string;
  name: string;
  contact: string;
  group: string; // Noiva, Noivo, Amigos, etc.
  rsvp: "Confirmado" | "Pendente" | "Recusado";
  table: string; // Mesa 1, Mesa 2, etc.
}

const defaultGuests: Guest[] = [
  { id: "guest-1", name: "Ana Nhantumbo", contact: "841234567", group: "Família Noiva", rsvp: "Confirmado", table: "Mesa 1" },
  { id: "guest-2", name: "Miguel Silva", contact: "829876543", group: "Família Noivo", rsvp: "Confirmado", table: "Mesa 1" },
  { id: "guest-3", name: "Sérgio Langa", contact: "sergio@langa.co.mz", group: "Amigos", rsvp: "Pendente", table: "Pendente" },
  { id: "guest-4", name: "Filomena Tembe", contact: "874561230", group: "Família Noiva", rsvp: "Confirmado", table: "Mesa 2" },
  { id: "guest-5", name: "Duarte Matsinhe", contact: "duarte@matsinhe.com", group: "Trabalho", rsvp: "Recusado", table: "Pendente" },
  { id: "guest-6", name: "Helena Chivambo", contact: "847778889", group: "Família Noivo", rsvp: "Pendente", table: "Pendente" },
];

const groups = ["Família Noiva", "Família Noivo", "Amigos", "Trabalho", "Outros"];

export default function GuestListPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [rsvpFilter, setRsvpFilter] = useState<"all" | "Confirmado" | "Pendente" | "Recusado">("all");
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestContact, setNewGuestContact] = useState("");
  const [newGuestGroup, setNewGuestGroup] = useState("Amigos");
  const [newGuestRsvp, setNewGuestRsvp] = useState<"Confirmado" | "Pendente" | "Recusado">("Pendente");
  const [newGuestTable, setNewGuestTable] = useState("Pendente");
  const [isClient, setIsClient] = useState(false);

  // Load from local storage
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("haxr_wedding_guests");
    if (saved) {
      try {
        setGuests(JSON.parse(saved));
      } catch {
        setGuests(defaultGuests);
      }
    } else {
      setGuests(defaultGuests);
    }
  }, []);

  const saveGuests = (list: Guest[]) => {
    setGuests(list);
    localStorage.setItem("haxr_wedding_guests", JSON.stringify(list));
  };

  const addGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName.trim()) return;

    const newGuest: Guest = {
      id: `guest-${Date.now()}`,
      name: newGuestName.trim(),
      contact: newGuestContact.trim() || "N/A",
      group: newGuestGroup,
      rsvp: newGuestRsvp,
      table: newGuestTable,
    };

    saveGuests([...guests, newGuest]);
    setNewGuestName("");
    setNewGuestContact("");
    setNewGuestRsvp("Pendente");
    setNewGuestTable("Pendente");
  };

  const deleteGuest = (id: string) => {
    const updated = guests.filter((g) => g.id !== id);
    saveGuests(updated);
  };

  const toggleRsvp = (id: string, newStatus: "Confirmado" | "Pendente" | "Recusado") => {
    const updated = guests.map((g) => (g.id === id ? { ...g, rsvp: newStatus } : g));
    saveGuests(updated);
  };

  const resetToDefault = () => {
    if (window.confirm("Deseja repor a lista original de exemplo? Isto apagará as alterações feitas.")) {
      saveGuests(defaultGuests);
    }
  };

  if (!isClient) {
    return (
      <main className="min-h-screen bg-brand-ivory flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-gold animate-pulse">Carregando convidados...</p>
      </main>
    );
  }

  // Count stats
  const totalCount = guests.length;
  const confirmedCount = guests.filter((g) => g.rsvp === "Confirmado").length;
  const pendingCount = guests.filter((g) => g.rsvp === "Pendente").length;
  const declinedCount = guests.filter((g) => g.rsvp === "Recusado").length;

  // Filter
  const filteredGuests = guests.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.contact.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRsvp = rsvpFilter === "all" || g.rsvp === rsvpFilter;
    return matchesSearch && matchesRsvp;
  });

  const getWhatsAppLink = () => {
    const message = `Olá HAXR Signature, gostaria de partilhar o estado da lista de convidados do meu casamento:\n- Total: ${totalCount} convidados\n- Confirmados: ${confirmedCount}\n- Pendentes: ${pendingCount}\n- Recusados: ${declinedCount}\n\nGostaria de falar com o gestor de eventos para coordenar o plano de mesas final.`;
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

        <MarketingToolBanner title="Lista de Convidados" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-brand-gold">
              <Users className="w-4 h-4" />
              <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Ferramentas de Planeamento</span>
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-light leading-tight">
              Lista de Convidados
            </h1>
            <p className="font-sans text-xs md:text-sm text-brand-text-dark/65 font-light max-w-xl">
              Importe, organize e controle as confirmações RSVP de todos os convidados. Defina os grupos e atribua as mesas de recepção com facilidade.
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-brand-champagne/45 p-6 rounded-sm shadow-xs text-center space-y-1">
            <p className="font-mono text-[8px] uppercase tracking-widest text-brand-text-dark/40 font-bold">Total Listados</p>
            <p className="font-serif text-2xl font-light text-brand-text-dark">{totalCount}</p>
          </div>
          <div className="bg-white border border-brand-champagne/45 p-6 rounded-sm shadow-xs text-center space-y-1">
            <p className="font-mono text-[8px] uppercase tracking-widest text-green-700 font-bold">Confirmados</p>
            <p className="font-serif text-2xl font-light text-green-700">{confirmedCount}</p>
          </div>
          <div className="bg-white border border-brand-champagne/45 p-6 rounded-sm shadow-xs text-center space-y-1">
            <p className="font-mono text-[8px] uppercase tracking-widest text-brand-gold font-bold">Pendentes</p>
            <p className="font-serif text-2xl font-light text-brand-gold">{pendingCount}</p>
          </div>
          <div className="bg-white border border-brand-champagne/45 p-6 rounded-sm shadow-xs text-center space-y-1">
            <p className="font-mono text-[8px] uppercase tracking-widest text-red-700 font-bold">Recusados</p>
            <p className="font-serif text-2xl font-light text-red-700">{declinedCount}</p>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Add Guest Form */}
          <div className="lg:col-span-4 bg-white border border-brand-champagne/45 p-6 rounded-sm shadow-sm space-y-4">
            <h3 className="font-serif text-sm font-medium text-brand-text-dark mb-2">Adicionar Convidado</h3>

            <form onSubmit={addGuest} className="space-y-4">
              <div>
                <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alberto Nhantumbo"
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans"
                />
              </div>

              <div>
                <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                  Contacto (Telefone ou Email)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 840000000 ou email@exemplo.com"
                  value={newGuestContact}
                  onChange={(e) => setNewGuestContact(e.target.value)}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                    Grupo
                  </label>
                  <select
                    value={newGuestGroup}
                    onChange={(e) => setNewGuestGroup(e.target.value)}
                    className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm cursor-pointer outline-none font-sans"
                  >
                    {groups.map((grp) => (
                      <option key={grp} value={grp}>{grp}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                    Mesa
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Mesa 3"
                    value={newGuestTable}
                    onChange={(e) => setNewGuestTable(e.target.value)}
                    className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                  Estado RSVP
                </label>
                <div className="flex gap-1.5">
                  {(["Confirmado", "Pendente", "Recusado"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewGuestRsvp(st)}
                      className={`flex-1 font-mono text-[8px] uppercase tracking-wider py-2 border rounded-sm transition-colors cursor-pointer ${
                        newGuestRsvp === st
                          ? "bg-brand-gold border-brand-gold text-white font-bold"
                          : "border-brand-champagne/45 bg-brand-champagne/5 text-brand-text-dark/65 hover:border-brand-gold/60"
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
                <span>Adicionar Convidado</span>
              </button>
            </form>
          </div>

          {/* Guest List Grid */}
          <div className="lg:col-span-8 bg-white border border-brand-champagne/45 rounded-sm p-6 md:p-8 shadow-sm space-y-6">

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between border-b border-brand-champagne/25 pb-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou contacto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-brand-ivory/40 border border-brand-champagne/70 focus:border-brand-gold text-xs py-3 pl-9 pr-4 rounded-sm outline-none font-sans"
                />
                <Search className="w-4 h-4 text-brand-text-dark/30 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex gap-2">
                {[
                  { label: "Todos", val: "all" },
                  { label: "Confirmados", val: "Confirmado" },
                  { label: "Pendentes", val: "Pendente" },
                  { label: "Recusados", val: "Recusado" },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setRsvpFilter(item.val as typeof rsvpFilter)}
                    className={`px-3.5 py-2.5 border rounded-sm text-[9px] font-mono tracking-wider uppercase transition-colors cursor-pointer ${
                      rsvpFilter === item.val
                        ? "bg-brand-gold border-brand-gold text-white font-bold"
                        : "border-brand-champagne/45 bg-brand-champagne/5 text-brand-text-dark/65 hover:border-brand-gold/60"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {filteredGuests.length === 0 ? (
              <div className="text-center py-12 text-brand-text-dark/40 font-light text-xs">
                Nenhum convidado encontrado nesta pesquisa.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredGuests.map((guest) => (
                  <div
                    key={guest.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-brand-champagne/20 rounded-sm hover:bg-brand-champagne/5 transition-all"
                  >
                    <div className="space-y-1">
                      <h4 className="font-serif text-sm font-light text-brand-text-dark">{guest.name}</h4>
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[8px] text-brand-text-dark/50">
                        <span className="bg-brand-champagne/15 px-2 py-0.5 rounded-full">{guest.group}</span>
                        <span>·</span>
                        <span>{guest.contact}</span>
                        <span>·</span>
                        <span className="text-brand-gold font-bold">{guest.table}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      {/* RSVP Switcher Buttons */}
                      <div className="flex items-center border border-brand-champagne/45 rounded-sm overflow-hidden bg-brand-champagne/5">
                        {(["Confirmado", "Pendente", "Recusado"] as const).map((status) => {
                          const isActive = guest.rsvp === status;
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => toggleRsvp(guest.id, status)}
                              className={`px-3 py-1.5 font-mono text-[7px] tracking-wider uppercase cursor-pointer transition-colors border-r border-brand-champagne/30 last:border-0 ${
                                isActive
                                  ? status === "Confirmado"
                                    ? "bg-green-600 text-white font-bold"
                                    : status === "Recusado"
                                      ? "bg-red-600 text-white font-bold"
                                      : "bg-brand-gold text-white font-bold"
                                  : "text-brand-text-dark/45 hover:bg-brand-champagne/15"
                              }`}
                            >
                              {status === "Confirmado" && "Sim"}
                              {status === "Pendente" && "?"}
                              {status === "Recusado" && "Não"}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteGuest(guest.id)}
                        className="text-brand-text-dark/30 hover:text-red-600 transition-colors p-1"
                        title="Remover convidado"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Export and Help block */}
            <div className="mt-8 pt-6 border-t border-brand-champagne/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-champagne/5 p-4 rounded-sm">
              <div className="text-left">
                <h4 className="font-serif text-xs font-semibold text-brand-text-dark">Exportar Lista de RSVP</h4>
                <p className="font-sans text-[10px] text-brand-text-dark/50 font-light leading-relaxed mt-0.5">
                  Partilhe o estado de presenças e relatórios de convidados com a HAXR.
                </p>
              </div>
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-editorial btn-editorial--solid py-3 px-6 font-mono text-[9px] tracking-widest uppercase font-bold rounded-sm inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Exportar Dados</span>
              </a>
            </div>

          </div>

        </div>

        <ToolProductionCta />

      </div>
    </main>
  );
}
