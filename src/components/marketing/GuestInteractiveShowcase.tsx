"use client";

import { useState } from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import {
  CheckCircle2,
  Search,
  Smartphone,
  LayoutGrid,
  UserCheck,
  RotateCcw,
  Sparkles,
  Check,
} from "lucide-react";

type ShowcaseTab = "rsvp" | "seating" | "find-seat" | "checkin";

// Demonstrative dataset for the public interactive showcase
const DEMO_GUESTS = [
  {
    id: "1",
    name: "Fabião Dimande",
    table: "Mesa de Honra",
    seat: "Lugar 02",
    diet: "Sem restrições",
    status: "confirmed",
    checkedIn: true,
    checkedInTime: "14:15",
    companion: "Vânia Luky",
  },
  {
    id: "2",
    name: "Jessica Muege",
    table: "Mesa 03 · Padrinhos",
    seat: "Lugar 01",
    diet: "Vegetariana",
    status: "confirmed",
    checkedIn: true,
    checkedInTime: "14:22",
    companion: "Samuel Govene",
  },
  {
    id: "3",
    name: "Samuel Govene",
    table: "Mesa 03 · Padrinhos",
    seat: "Lugar 02",
    diet: "Sem restrições",
    status: "confirmed",
    checkedIn: false,
    checkedInTime: null,
    companion: "Jessica Muege",
  },
  {
    id: "4",
    name: "Dra. Elisa Macamo",
    table: "Mesa 01 · Família Directa",
    seat: "Lugar 04",
    diet: "Sem glúten",
    status: "confirmed",
    checkedIn: false,
    checkedInTime: null,
    companion: "+1 Acompanhante",
  },
  {
    id: "5",
    name: "Eng. Carlos Sitoe",
    table: "Mesa 04 · Amigos Maputo",
    seat: "Lugar 06",
    diet: "Sem restrições",
    status: "pending",
    checkedIn: false,
    checkedInTime: null,
    companion: "Sem acompanhante",
  },
];

const DEMO_TABLES = [
  { id: "T1", name: "Mesa de Honra", capacity: 8, occupied: 8, sector: "Palco Principal" },
  { id: "T2", name: "Mesa 01 · Família Noiva", capacity: 10, occupied: 10, sector: "Ala Esquerda" },
  { id: "T3", name: "Mesa 02 · Família Noivo", capacity: 10, occupied: 10, sector: "Ala Direita" },
  { id: "T4", name: "Mesa 03 · Padrinhos & Damas", capacity: 12, occupied: 12, sector: "Ala Central" },
  { id: "T5", name: "Mesa 04 · Amigos Maputo", capacity: 10, occupied: 8, sector: "Ala Jardim" },
  { id: "T6", name: "Mesa 05 · Convidados Especiais", capacity: 10, occupied: 9, sector: "Ala Jardim" },
];

export default function GuestInteractiveShowcase() {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>("rsvp");

  // Tab 1 (RSVP Demo State)
  const rsvpGuest = "Vânia Luky";
  const [rsvpAttendance, setRsvpAttendance] = useState<"yes" | "no">("yes");
  const [rsvpPlusOne, setRsvpPlusOne] = useState(true);
  const [rsvpDiet, setRsvpDiet] = useState("Nenhuma");
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);

  // Tab 2 (Seating Demo State)
  const [selectedTable, setSelectedTable] = useState(DEMO_TABLES[0]);

  // Tab 3 (Find Your Seat Demo State)
  const [searchQuery, setSearchQuery] = useState("Fabião Dimande");
  const searchResult = DEMO_GUESTS.find((g) =>
    g.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // Tab 4 (Check-in Hostess Demo State)
  const [checkinList, setCheckinList] = useState(DEMO_GUESTS);
  const [checkinSuccessId, setCheckinSuccessId] = useState<string | null>(null);

  const handlePerformCheckin = (id: string) => {
    setCheckinList((prev) =>
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              checkedIn: true,
              checkedInTime: new Date().toLocaleTimeString("pt-MZ", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }
          : g
      )
    );
    setCheckinSuccessId(id);
    setTimeout(() => setCheckinSuccessId(null), 2500);
  };

  const totalCheckedIn = checkinList.filter((g) => g.checkedIn).length;

  return (
    <section
      id="showcase-interactivo"
      className="relative py-20 md:py-32 bg-[#0E0D0C] text-brand-ivory border-b border-brand-champagne/20"
    >
      <div className="site-container mx-auto space-y-12">
        {/* Header with Luxury Badge */}
        <RevealOnScroll>
          <div className="max-w-3xl space-y-4 text-left">
            <div className="flex items-center gap-3">
              <span className="w-8 h-px bg-brand-gold" />
              <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-brand-gold font-bold">
                03 · Interactive Showcase
              </span>
            </div>

            <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-brand-ivory leading-tight">
              A Experiência Viva do Convidado
            </h2>

            <p className="font-sans text-sm md:text-base text-brand-ivory/70 font-light leading-relaxed">
              Explore cada ferramenta do ecossistema HAXR em tempo real. Interaja com os simuladores
              e sinta a precisão com que os seus convidados serão recebidos.
            </p>
          </div>
        </RevealOnScroll>

        {/* Tab Selection Bar */}
        <div className="flex flex-wrap gap-2 border-b border-brand-champagne/20 pb-4">
          {[
            { id: "rsvp" as const, label: "01 · RSVP Inteligente", icon: Smartphone },
            { id: "seating" as const, label: "02 · Seating & Mesas", icon: LayoutGrid },
            { id: "find-seat" as const, label: "03 · Find Your Seat", icon: Search },
            { id: "checkin" as const, label: "04 · Check-in de Recepção", icon: UserCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-full font-mono text-[9.5px] uppercase tracking-[0.2em] font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-brand-gold text-brand-black shadow-md shadow-brand-gold/25"
                    : "bg-white/[0.04] text-brand-ivory/70 hover:text-brand-ivory hover:bg-white/[0.08] border border-brand-champagne/20"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Demonstration Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-[#151312] border border-brand-champagne/30 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-xl">
          {/* Left Column: Context & Editorial Explanation */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/25 text-[8.5px] font-mono uppercase tracking-widest text-brand-gold font-bold">
              <Sparkles className="w-3 h-3" />
              <span>EXPERIÊNCIA DEMONSTRATIVA PÚBLICA</span>
            </div>

            {activeTab === "rsvp" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <h3 className="font-serif text-2xl md:text-3xl font-light text-brand-ivory">
                  Confirmação Nominal e Elegante
                </h3>
                <p className="font-sans text-sm text-brand-ivory/75 font-light leading-relaxed">
                  O convidado responde directamente pelo telemóvel num formulário limpo e intuitivo.
                  O sistema gere acompanhantes autorizados e recolhe intolerâncias alimentares para
                  orientar a equipa de catering.
                </p>
                <ul className="space-y-2 pt-2 text-xs font-sans text-brand-ivory/80 font-light">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                    <span>Confirmação com 1 toque sem instalação de apps</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                    <span>Registo automático de acompanhantes e restrições</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                    <span>Visibilidade instantânea para o casal e assessoria</span>
                  </li>
                </ul>
              </div>
            )}

            {activeTab === "seating" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <h3 className="font-serif text-2xl md:text-3xl font-light text-brand-ivory">
                  Arquitectura de Acolhimento
                </h3>
                <p className="font-sans text-sm text-brand-ivory/75 font-light leading-relaxed">
                  Organização visual de todas as mesas do espaço. Distribuição balanceada de núcleos
                  familiares, amigos e convidados protocolares com acompanhamento de ocupação.
                </p>
                <ul className="space-y-2 pt-2 text-xs font-sans text-brand-ivory/80 font-light">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                    <span>Mapeamento por sectores e afinidades</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                    <span>Alocação directa de lugares e restrições</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                    <span>Alimentação automática do sistema Find Your Seat</span>
                  </li>
                </ul>
              </div>
            )}

            {activeTab === "find-seat" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <h3 className="font-serif text-2xl md:text-3xl font-light text-brand-ivory">
                  Localização Imediata no Dia
                </h3>
                <p className="font-sans text-sm text-brand-ivory/75 font-light leading-relaxed">
                  À entrada do salão, o convidado digita o seu nome e descobre a sua mesa de forma
                  privada e instantânea. Elimina aglomerações e listas impressas riscadas à caneta.
                </p>
                <ul className="space-y-2 pt-2 text-xs font-sans text-brand-ivory/80 font-light">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                    <span>Acesso imediato via QR Code na entrada</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                    <span>Pesquisa tolerante a erros de digitação</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                    <span>Apresentação de número de mesa e croqui de sala</span>
                  </li>
                </ul>
              </div>
            )}

            {activeTab === "checkin" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <h3 className="font-serif text-2xl md:text-3xl font-light text-brand-ivory">
                  Consola de Recepção & Hostesses
                </h3>
                <p className="font-sans text-sm text-brand-ivory/75 font-light leading-relaxed">
                  Painel de controlo discreto utilizado pelas hostesses da HAXR na entrada. Registo
                  rápido de entradas, contagem de presentes em tempo real e protocolo de boas-vindas.
                </p>
                <ul className="space-y-2 pt-2 text-xs font-sans text-brand-ivory/80 font-light">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                    <span>Contagem ao vivo de presentes e percentagem</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                    <span>Busca instantânea por nome ou mesa</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                    <span>Registo temporal de chegadas nos bastidores</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Right Column: Live Interactive Device / Console */}
          <div className="lg:col-span-7">
            {/* 1. RSVP SIMULATOR */}
            {activeTab === "rsvp" && (
              <div className="max-w-md mx-auto rounded-3xl bg-[#090808] border border-brand-champagne/35 p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-brand-champagne/20 pb-3">
                  <span className="font-mono text-[8px] uppercase tracking-widest text-brand-gold font-bold">
                    CONVITE DIGITAL · CONFIRMAÇÃO DE PRESENÇA
                  </span>
                  <button
                    onClick={() => setRsvpSubmitted(false)}
                    className="text-[8px] font-mono text-brand-ivory/40 hover:text-brand-gold flex items-center gap-1"
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> Reiniciar
                  </button>
                </div>

                {!rsvpSubmitted ? (
                  <div className="space-y-4 text-left">
                    <div>
                      <p className="font-mono text-[8.5px] uppercase tracking-wider text-brand-ivory/50">
                        Convidado:
                      </p>
                      <h4 className="font-serif text-xl font-light text-brand-ivory">
                        {rsvpGuest}
                      </h4>
                    </div>

                    {/* Attendance Radio */}
                    <div className="space-y-2">
                      <p className="text-xs text-brand-ivory/80 font-light">Irá comparecer à celebração?</p>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          onClick={() => setRsvpAttendance("yes")}
                          className={`py-2 px-3 rounded-xl border text-xs font-sans transition-all ${
                            rsvpAttendance === "yes"
                              ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-200"
                              : "bg-white/[0.03] border-brand-champagne/20 text-brand-ivory/60"
                          }`}
                        >
                          Sim, com alegria
                        </button>
                        <button
                          onClick={() => setRsvpAttendance("no")}
                          className={`py-2 px-3 rounded-xl border text-xs font-sans transition-all ${
                            rsvpAttendance === "no"
                              ? "bg-rose-950/40 border-rose-500/60 text-rose-200"
                              : "bg-white/[0.03] border-brand-champagne/20 text-brand-ivory/60"
                          }`}
                        >
                          Não poderei ir
                        </button>
                      </div>
                    </div>

                    {/* Companion Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-brand-champagne/15">
                      <div>
                        <p className="text-xs text-brand-ivory/90 font-medium">Acompanhante Autorizado</p>
                        <p className="text-[9px] text-brand-ivory/50">Fabião Dimande</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={rsvpPlusOne}
                        onChange={(e) => setRsvpPlusOne(e.target.checked)}
                        className="w-4 h-4 accent-brand-gold cursor-pointer"
                      />
                    </div>

                    {/* Dietary Option */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase text-brand-ivory/50">
                        Restrição Alimentar
                      </label>
                      <select
                        value={rsvpDiet}
                        onChange={(e) => setRsvpDiet(e.target.value)}
                        className="w-full bg-[#1A1817] border border-brand-champagne/25 rounded-xl px-3 py-2 text-xs text-brand-ivory outline-none"
                      >
                        <option value="Nenhuma">Nenhuma restrição</option>
                        <option value="Vegetariana">Opção Vegetariana</option>
                        <option value="Sem Glúten">Sem Glúten</option>
                        <option value="Sem Marisco">Sem Marisco / Alérgenos</option>
                      </select>
                    </div>

                    <button
                      onClick={() => setRsvpSubmitted(true)}
                      className="w-full py-3 rounded-xl bg-brand-gold text-brand-black font-mono text-[9px] uppercase tracking-widest font-bold hover:bg-brand-champagne transition-all"
                    >
                      Submeter Confirmação
                    </button>
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-400">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                      <Check className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-serif text-xl text-brand-ivory">Presença Registada com Sucesso</h4>
                      <p className="text-xs text-brand-ivory/70">
                        Obrigado, {rsvpGuest}. Esperamos por si no Evelyn Eventos.
                      </p>
                    </div>
                    <div className="p-3 bg-white/[0.04] border border-brand-champagne/20 rounded-xl text-left text-xs space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-brand-gold">
                        <span>ESTADO: CONFIRMADO</span>
                        <span>MESA 02</span>
                      </div>
                      <p className="text-brand-ivory/80 text-[11px]">
                        Lugares: {rsvpPlusOne ? "2 Pessoas" : "1 Pessoa"} · Restrição: {rsvpDiet}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. SEATING MAP SIMULATOR */}
            {activeTab === "seating" && (
              <div className="rounded-3xl bg-[#090808] border border-brand-champagne/35 p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-brand-champagne/20 pb-3">
                  <span className="font-mono text-[8px] uppercase tracking-widest text-brand-gold font-bold">
                    MAPA DE MESAS & SEATING PLAN HAXR
                  </span>
                  <span className="font-mono text-[8px] text-brand-ivory/50">6 MESAS ATIVAS</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {DEMO_TABLES.map((t) => {
                    const isSelected = selectedTable.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTable(t)}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? "bg-brand-gold/15 border-brand-gold text-brand-ivory shadow-lg shadow-brand-gold/10"
                            : "bg-white/[0.03] border-brand-champagne/20 text-brand-ivory/60 hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-mono text-[8px] text-brand-gold font-bold">{t.id}</span>
                          <span className="text-[7.5px] font-mono bg-white/10 px-1.5 py-0.5 rounded">
                            {t.occupied}/{t.capacity}
                          </span>
                        </div>
                        <p className="font-serif text-sm text-brand-ivory font-light truncate">{t.name}</p>
                        <p className="text-[8px] text-brand-ivory/40 font-mono mt-0.5">{t.sector}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Table Detail */}
                <div className="bg-white/[0.03] border border-brand-champagne/25 rounded-2xl p-4 space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <h4 className="font-serif text-base text-brand-gold">{selectedTable.name}</h4>
                    <span className="text-xs font-mono text-emerald-400">
                      Ocupação: {selectedTable.occupied} / {selectedTable.capacity}
                    </span>
                  </div>
                  <p className="text-xs text-brand-ivory/70 font-light">
                    Sector: {selectedTable.sector} · Protocolo VIP com alertas dietéticos mapeados para o catering.
                  </p>
                </div>
              </div>
            )}

            {/* 3. FIND YOUR SEAT SIMULATOR */}
            {activeTab === "find-seat" && (
              <div className="max-w-md mx-auto rounded-3xl bg-[#090808] border border-brand-champagne/35 p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-brand-champagne/20 pb-3">
                  <span className="font-mono text-[8px] uppercase tracking-widest text-brand-gold font-bold">
                    FIND YOUR SEAT · PESQUISA RÁPIDA
                  </span>
                  <span className="font-mono text-[8px] text-emerald-400">ONLINE</span>
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-[9px] font-mono uppercase text-brand-ivory/60">
                    Digite o nome do convidado:
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-brand-gold absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ex: Fabião, Jessica, Elisa..."
                      className="w-full bg-[#1A1817] border border-brand-champagne/35 rounded-xl pl-10 pr-4 py-2.5 text-xs text-brand-ivory outline-none focus:border-brand-gold"
                    />
                  </div>

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["Fabião Dimande", "Jessica Muege", "Dra. Elisa Macamo", "Eng. Carlos"].map(
                      (name) => (
                        <button
                          key={name}
                          onClick={() => setSearchQuery(name)}
                          className="text-[8px] font-mono bg-white/[0.05] border border-brand-champagne/20 px-2 py-0.5 rounded text-brand-ivory/60 hover:text-brand-gold hover:border-brand-gold/40"
                        >
                          {name}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Result Presentation */}
                {searchResult ? (
                  <div className="bg-brand-gold/10 border border-brand-gold/40 rounded-2xl p-5 text-center space-y-2 animate-in fade-in duration-300">
                    <p className="text-xs text-brand-champagne font-light">Olá, {searchResult.name}</p>
                    <p className="font-mono text-[8px] uppercase tracking-widest text-brand-gold font-bold">
                      O SEU LUGAR FOI LOCALIZADO
                    </p>
                    <div className="py-2">
                      <p className="font-serif text-3xl font-light text-brand-gold">
                        {searchResult.table}
                      </p>
                      <p className="text-xs font-mono text-brand-ivory/70 mt-1">
                        {searchResult.seat} · Evelyn Eventos
                      </p>
                    </div>
                    <div className="pt-2 border-t border-brand-champagne/20 flex items-center justify-between text-[8px] font-mono text-brand-ivory/50">
                      <span>ACOMPANHANTE: {searchResult.companion}</span>
                      <span>DIETA: {searchResult.diet}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-white/[0.02] border border-brand-champagne/15 rounded-xl text-center text-xs text-brand-ivory/50">
                    Nenhum convidado encontrado com esse nome. Dirija-se à equipa de recepção.
                  </div>
                )}
              </div>
            )}

            {/* 4. RECEPTION CHECK-IN CONSOLE SIMULATOR */}
            {activeTab === "checkin" && (
              <div className="rounded-3xl bg-[#090808] border border-brand-champagne/35 p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-brand-champagne/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono text-[8px] uppercase tracking-widest text-brand-gold font-bold">
                      CONSOLA DE ENTRADA · HOSTESS LIVE
                    </span>
                  </div>
                  <span className="font-mono text-[8px] text-brand-ivory/50">MAPUTO · PORTA PRINCIPAL</span>
                </div>

                {/* Counter Metric */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-white/[0.03] border border-brand-champagne/20 rounded-xl">
                    <span className="text-[7.5px] font-mono uppercase text-brand-ivory/50 block">Lista Total</span>
                    <span className="font-serif text-xl text-brand-ivory">220</span>
                  </div>
                  <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
                    <span className="text-[7.5px] font-mono uppercase text-emerald-400 block">Presentes</span>
                    <span className="font-serif text-xl text-emerald-200">
                      {184 + totalCheckedIn - 2}
                    </span>
                  </div>
                  <div className="p-3 bg-white/[0.03] border border-brand-champagne/20 rounded-xl">
                    <span className="text-[7.5px] font-mono uppercase text-brand-ivory/50 block">Taxa</span>
                    <span className="font-serif text-xl text-brand-gold">
                      {Math.round(((184 + totalCheckedIn - 2) / 220) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Interactive Guest Queue */}
                <div className="space-y-2 text-left">
                  <span className="text-[8px] font-mono uppercase text-brand-ivory/40">
                    Convidados à chegada (Clique para registar):
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {checkinList.map((guest) => (
                      <div
                        key={guest.id}
                        className="p-3 rounded-xl bg-white/[0.02] border border-brand-champagne/15 flex items-center justify-between gap-3 hover:border-brand-champagne/30 transition-colors"
                      >
                        <div>
                          <p className="text-xs text-brand-ivory font-medium">{guest.name}</p>
                          <p className="text-[9px] text-brand-ivory/50 font-mono">
                            {guest.table} · {guest.seat}
                          </p>
                        </div>

                        {guest.checkedIn ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-[8.5px]">{guest.checkedInTime || "Presente"}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePerformCheckin(guest.id)}
                            className="px-3 py-1.5 rounded-lg bg-brand-gold/20 border border-brand-gold/40 text-brand-gold font-mono text-[8px] uppercase tracking-wider hover:bg-brand-gold hover:text-brand-black transition-all"
                          >
                            Entrada
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {checkinSuccessId && (
                  <div className="p-2 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-center text-xs text-emerald-300 font-mono animate-in fade-in duration-200">
                    Entrada registada com sucesso! Protocolo notificado.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
