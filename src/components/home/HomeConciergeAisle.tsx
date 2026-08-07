"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  CornerUpRight,
  Wifi,
  Battery,
  ChevronLeft,
  Video,
  Phone,
  Plus,
  Camera,
  Mic,
  Check,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { homeConciergeSection } from "@/lib/marketing/home-content";

const guests = [
  { name: "Afonso & Telma Cossa", group: "Família Noiva", table: "Mesa 1", status: "Confirmado" },
  { name: "Dr. Estevão Muchanga", group: "VIPs", table: "Mesa VIP", status: "Confirmado" },
  { name: "Sandra & Rui Santos", group: "Amigos Maputo", table: "Mesa 4", status: "Pendente" },
  { name: "Vânia Nhaca", group: "Madrinhas", table: "Mesa 2", status: "Confirmado" },
  { name: "Eng. Pedro Langa", group: "Padrinhos", table: "Mesa 3", status: "Confirmado" },
];

export default function HomeConciergeAisle() {
  const [macTab, setMacTab] = useState<"excel" | "contract">("contract");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center py-10 md:py-24 relative">

      {/* Background Ambient Glow */}
      <div
        className="absolute left-1/3 top-1/2 -translate-y-1/2 w-[350px] h-[350px] opacity-10 bg-brand-gold blur-[100px] pointer-events-none rounded-full"
      />

      {/* Left Column: Side-by-Side MacBook Pro & iPhone Showcase (No Overlap) */}
      <div className="lg:col-span-8 flex items-center justify-center relative order-2 lg:order-1 pt-8 pb-16 select-none">

        {/* Device Container */}
        <div className="w-full max-w-[640px] flex flex-col sm:flex-row items-end justify-center gap-10 md:gap-14 relative z-10">

          {/* Ambient shadow beneath both devices */}
          <div className="absolute bottom-[-15px] left-0 right-0 h-6 bg-black/60 blur-[30px] rounded-full pointer-events-none -z-10 animate-pulse" />

          {/* 1. MacBook Pro (Clean, Facing Front, Space Gray Metallic Bezel) */}
          <div className="w-full max-w-[360px] md:max-w-[430px] shrink-0">

            {/* Screen Bezel with metallic border */}
            <div className="relative border-[10px] md:border-[12px] border-zinc-900 bg-zinc-950 rounded-t-2xl shadow-[0_30px_60px_rgba(0,0,0,0.85)] overflow-hidden aspect-[16/10] flex flex-col justify-between">

              {/* Screen Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-zinc-950 rounded-b-md z-30 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 border border-zinc-700" />
              </div>

              {/* Glass Reflection Sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-20" />

              {/* Screen Content Frame */}
              <div className="w-full h-full bg-[#FAF8F5] relative overflow-hidden font-sans flex flex-col justify-between pt-3">

                {/* 1.1 MacBook Document Tabs Switcher */}
                <div className="bg-[#dfd9ce] border-b border-brand-champagne/30 flex items-center px-3 pt-1 gap-1 shrink-0 z-30 text-[5px] md:text-[6.5px]">
                  <button
                    type="button"
                    onClick={() => setMacTab("excel")}
                    className={`px-3 py-2 rounded-t-md font-sans flex items-center gap-1.5 cursor-pointer transition-all duration-300 select-none ${
                      macTab === "excel"
                        ? "bg-[#FAF8F5] text-brand-text-dark font-semibold border-t border-x border-brand-champagne/30"
                        : "text-brand-text-dark/50 hover:bg-[#FAF8F5]/40"
                    }`}
                  >
                    <FileSpreadsheet className="w-2.5 h-2.5 text-emerald-800" />
                    <span>convidados.xlsx</span>
                    {macTab === "excel" && <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0 animate-pulse ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMacTab("contract")}
                    className={`px-3 py-2 rounded-t-md font-sans flex items-center gap-1.5 cursor-pointer transition-all duration-300 select-none ${
                      macTab === "contract"
                        ? "bg-[#FAF8F5] text-brand-text-dark font-semibold border-t border-x border-brand-champagne/30"
                        : "text-brand-text-dark/50 hover:bg-[#FAF8F5]/40"
                    }`}
                  >
                    <FileText className="w-2.5 h-2.5 text-red-800" />
                    <span>contrato_decoracao.pdf</span>
                    {macTab === "contract" && <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0 animate-pulse ml-0.5" />}
                  </button>
                </div>

                {/* Content Container */}
                <div className="flex-1 relative flex flex-col justify-between overflow-hidden">
                  <AnimatePresence mode="wait">

                    {/* TAB 1: Excel Guest List Sheet */}
                    {macTab === "excel" && (
                      <motion.div
                        key="excel"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex flex-col justify-between bg-[#FAF8F5] shadow-[inset_0_0_20px_rgba(0,0,0,0.03)]"
                      >
                        {/* Excel Ribbon / Toolbar */}
                        <div className="bg-[#ece8df]/65 border-b border-brand-champagne/25 px-3 py-1.5 flex items-center justify-between text-[5.5px] md:text-[7px] font-sans text-brand-text-dark/60 select-none shrink-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-emerald-800 flex items-center gap-0.5">
                              <FileSpreadsheet className="w-3 h-3" strokeWidth={1.5} />
                              <span>Ficheiro</span>
                            </span>
                            <span>Editar</span>
                            <span>Inserir</span>
                            <span>Formatar</span>
                            <span>Dados</span>
                          </div>
                          <span className="font-mono text-[5px] md:text-[6px] bg-brand-gold/10 text-brand-gold px-1.5 py-0.5 rounded-sm">
                            Planilha Ativa
                          </span>
                        </div>

                        {/* Formula Bar */}
                        <div className="bg-white border-b border-brand-champagne/20 px-2.5 py-1 flex items-center gap-2 text-[5px] md:text-[6.5px] font-mono shrink-0">
                          <span className="text-emerald-800 font-bold">fx</span>
                          <div className="h-3 w-px bg-zinc-200" />
                          <span className="text-zinc-400">A1</span>
                          <div className="h-3 w-px bg-zinc-200" />
                          <span className="text-zinc-700 truncate">=IMPORT(CONV_WHATSAPP)</span>
                        </div>

                        {/* Excel Sheet Grid */}
                        <div className="flex-1 flex overflow-hidden">

                          {/* Row Numbers Column */}
                          <div className="w-5 md:w-6 bg-[#eae3d8]/20 border-r border-brand-champagne/20 flex flex-col font-mono text-[5px] md:text-[6px] text-zinc-400 text-center select-none shrink-0">
                            <div className="py-0.5 border-b border-brand-champagne/15 bg-[#eae3d8]/30"> </div>
                            <div className="py-1 border-b border-brand-champagne/15">1</div>
                            <div className="py-1 border-b border-brand-champagne/15">2</div>
                            <div className="py-1 border-b border-brand-champagne/15">3</div>
                            <div className="py-1 border-b border-brand-champagne/15">4</div>
                            <div className="py-1 border-b border-brand-champagne/15">5</div>
                            <div className="py-1 border-b border-brand-champagne/15">6</div>
                          </div>

                          {/* Grid Data Column Layout */}
                          <div className="flex-1 flex flex-col overflow-hidden">

                            {/* Column Identifiers (A, B, C, D) */}
                            <div className="grid grid-cols-12 bg-[#eae3d8]/20 border-b border-brand-champagne/20 font-mono text-[5px] md:text-[6px] text-zinc-400 text-center py-0.5 select-none shrink-0">
                              <div className="col-span-5 border-r border-brand-champagne/15">A</div>
                              <div className="col-span-3 border-r border-brand-champagne/15">B</div>
                              <div className="col-span-2 border-r border-brand-champagne/15">C</div>
                              <div className="col-span-2">D</div>
                            </div>

                            {/* Table Data Rows */}
                            <div className="divide-y divide-brand-champagne/10 text-[6px] md:text-[7.5px] text-left overflow-y-auto">

                              {/* Grid Header Row */}
                              <div className="grid grid-cols-12 font-semibold text-brand-text-dark/65 bg-brand-champagne/5 py-1 text-center font-mono">
                                <div className="col-span-5 border-r border-brand-champagne/10 text-left pl-2">NOME</div>
                                <div className="col-span-3 border-r border-brand-champagne/10">GRUPO</div>
                                <div className="col-span-2 border-r border-brand-champagne/10">MESA</div>
                                <div className="col-span-2">RSVP</div>
                              </div>

                              {/* Guest Rows */}
                              {guests.map((g) => (
                                <div key={g.name} className="grid grid-cols-12 py-1.5 text-center hover:bg-brand-champagne/5 transition-colors">
                                  <div className="col-span-5 border-r border-brand-champagne/10 text-left pl-2 font-medium text-brand-text-dark truncate">{g.name}</div>
                                  <div className="col-span-3 border-r border-brand-champagne/10 text-zinc-500 truncate">{g.group}</div>
                                  <div className="col-span-2 border-r border-brand-champagne/10 text-zinc-500">{g.table}</div>
                                  <div className="col-span-2 flex items-center justify-center">
                                    <span className={`text-[4px] md:text-[5.5px] font-mono px-1.5 py-0.5 rounded-full ${
                                      g.status === "Confirmado"
                                        ? "bg-brand-gold/15 text-brand-gold font-bold"
                                        : "bg-brand-champagne/30 text-brand-text-dark/40"
                                    }`}>
                                      {g.status}
                                    </span>
                                  </div>
                                </div>
                              ))}

                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* TAB 2: Highly Realistic Editorial Contract Document (Matches Reference) */}
                    {macTab === "contract" && (
                      <motion.div
                        key="contract"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-[#fdfdfd] p-4 md:p-5 flex flex-col justify-between overflow-y-auto text-brand-text-dark shadow-[inset_0_0_20px_rgba(0,0,0,0.02)]"
                      >
                        {/* 2.1 Contract Header */}
                        <div className="flex justify-between items-start border-b border-zinc-200/80 pb-2">
                          <div className="text-left space-y-0.5">
                            {/* Decorative Left Double Bar */}
                            <div className="flex gap-0.5 items-center">
                              <div className="w-0.5 h-6 bg-brand-gold" />
                              <div className="w-0.5 h-6 bg-[#2d2a29]/30" />
                              <div className="pl-2">
                                <h4 className="font-mono text-[5.5px] md:text-[6.5px] tracking-widest uppercase font-bold text-[#2d2a29]">HAXR SIGNATURE</h4>
                                <p className="text-[3.8px] md:text-[4.8px] text-zinc-400 font-light font-sans">+258 87 088 3428 · concierge@haxr.com</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <h3 className="font-serif text-[13px] md:text-[16px] font-light tracking-[0.08em] text-[#0c0a09]">CONTRATO</h3>
                          </div>
                        </div>

                        {/* 2.2 Billing & Contract Details */}
                        <div className="grid grid-cols-2 gap-4 py-2.5 text-[4.8px] md:text-[5.8px] border-b border-zinc-100 font-sans">
                          <div className="text-left space-y-0.5">
                            <p className="text-zinc-400 uppercase font-mono text-[3.8px] tracking-wider">Cliente:</p>
                            <p className="font-bold text-[#2d2a29]">Sofia Antunes & Alberto Silva</p>
                            <p className="text-zinc-500 font-light">Casamento e Recepção</p>
                            <p className="text-zinc-500 font-light">Maputo, Moçambique</p>
                          </div>
                          <div className="text-right space-y-0.5">
                            <p className="text-zinc-400 uppercase font-mono text-[3.8px] tracking-wider">Fatura / ID:</p>
                            <p className="font-bold text-[#2d2a29]">Invoice: 2026 - 184A</p>
                            <p className="text-zinc-500 font-light">Fornecedor por associar</p>
                            <p className="text-zinc-500 font-light">18 de Outubro</p>
                          </div>
                        </div>

                        {/* 2.3 Particulars Table */}
                        <div className="py-2 flex-1">
                          <div className="grid grid-cols-12 border-b border-zinc-200/80 pb-1 font-mono text-[3.8px] md:text-[4.8px] text-zinc-400 tracking-wider">
                            <div className="col-span-6 text-left">DESCRIÇÃO DOS SERVIÇOS</div>
                            <div className="col-span-2 text-right">PREÇO</div>
                            <div className="col-span-2 text-center">QTD</div>
                            <div className="col-span-2 text-right">TOTAL</div>
                          </div>

                          <div className="divide-y divide-zinc-100 font-sans text-[4.5px] md:text-[5.8px] text-[#2d2a29]">
                            <div className="grid grid-cols-12 py-1.5">
                              <div className="col-span-6 text-left font-medium">Decoração de Mesa & Mobiliário Floral</div>
                              <div className="col-span-2 text-right">120.000 MT</div>
                              <div className="col-span-2 text-center">1</div>
                              <div className="col-span-2 text-right">120.000 MT</div>
                            </div>
                            <div className="grid grid-cols-12 py-1.5">
                              <div className="col-span-6 text-left font-medium">Cenografia de Altar & Iluminação Artística</div>
                              <div className="col-span-2 text-right">180.000 MT</div>
                              <div className="col-span-2 text-center">1</div>
                              <div className="col-span-2 text-right">180.000 MT</div>
                            </div>
                            <div className="grid grid-cols-12 py-1.5">
                              <div className="col-span-6 text-left font-medium">Sem fornecedor associado</div>
                              <div className="col-span-2 text-right">2.500 MT</div>
                              <div className="col-span-2 text-center">120</div>
                              <div className="col-span-2 text-right">300.000 MT</div>
                            </div>
                            <div className="grid grid-cols-12 py-1.5">
                              <div className="col-span-6 text-left font-medium">Taxa de Coordenação Logística HAXR</div>
                              <div className="col-span-2 text-right">46.600 MT</div>
                              <div className="col-span-2 text-center">1</div>
                              <div className="col-span-2 text-right">46.600 MT</div>
                            </div>
                          </div>
                        </div>

                        {/* 2.4 Subtotals, Custom handwritten thanks, Signatures & Footer */}
                        <div className="border-t border-zinc-200/80 pt-2.5 space-y-2">
                          <div className="flex justify-between items-end">
                            {/* Handwritten Thank You Note */}
                            <div className="text-left font-serif italic text-brand-gold text-[7.5px] md:text-[9px] select-none tracking-wide">
                              Obrigado pela vossa confiança!
                            </div>
                            <div className="w-1/2 text-right space-y-1 font-sans text-[4.8px] md:text-[5.8px]">
                              <div className="flex justify-between text-zinc-500">
                                <span>Subtotal:</span>
                                <span>646.600 MT</span>
                              </div>
                              <div className="flex justify-between text-zinc-500">
                                <span>Imposto (16%):</span>
                                <span>103.456 MT</span>
                              </div>
                              <div className="flex justify-between font-bold text-[#0c0a09] border-t border-zinc-200/80 pt-1 text-[5.2px] md:text-[6.8px]">
                                <span>TOTAL:</span>
                                <span className="text-brand-gold">750.056 MT</span>
                              </div>
                            </div>
                          </div>

                          {/* Signatures Row */}
                          <div className="pt-2 flex justify-between items-end border-t border-zinc-100 font-sans text-[4.2px] md:text-[5px] text-zinc-400">
                            <div className="space-y-1">
                              {/* Client Signature */}
                              <div className="font-serif italic font-bold text-[#0c0a09]/80 text-[7px] md:text-[8.5px] tracking-wider relative -rotate-2 h-4 select-none">
                                Sofia Antunes
                              </div>
                              <div className="border-t border-zinc-300 w-20 pt-0.5">Assinatura Cliente</div>
                            </div>
                            <div className="space-y-1 text-right">
                              {/* HAXR Signature */}
                              <div className="font-serif italic font-bold text-brand-gold text-[7px] md:text-[8.5px] tracking-wider relative rotate-2 h-4 select-none">
                                HAXR Signature
                              </div>
                              <div className="border-t border-zinc-300 w-20 pt-0.5">Assinatura HAXR Officer</div>
                            </div>
                          </div>

                          {/* Invoice Footer */}
                          <div className="text-center text-[3.8px] md:text-[4.5px] text-zinc-400 font-light font-sans pt-1">
                            Maputo Office: Av. Julius Nyerere, Edifício Prestige · www.haxrsignature.com
                          </div>
                        </div>

                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

              </div>

            </div>

            {/* MacBook Pro Base Keyboard Frame */}
            <div className="relative w-[114%] -ml-[7%] h-[10px] md:h-[12px] bg-gradient-to-r from-zinc-700 via-zinc-800 to-zinc-700 rounded-b-xl border-t border-zinc-600 shadow-[0_15px_35px_rgba(0,0,0,0.65)] flex items-center justify-center z-10">
              <div className="w-16 h-1 bg-zinc-950 rounded-b-sm" />
            </div>

          </div>

          {/* 2. iPhone 15 Pro Mockup (High Fidelity Large iPhone matching the Concierge page) */}
          <div className="relative w-[180px] sm:w-[200px] aspect-[9/18.5] bg-zinc-950 rounded-[36px] md:rounded-[40px] p-2.5 shadow-[0_24px_50px_rgba(0,0,0,0.45)] border border-white/10 shrink-0 select-none">

            {/* Top Notch/Speaker slit */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-b-2xl z-40 flex items-center justify-center">
              <div className="w-8 h-0.5 bg-zinc-850 rounded-full" />
            </div>

            {/* Inner Glass Screen Frame */}
            <div className="w-full h-full rounded-[28px] md:rounded-[32px] overflow-hidden bg-black flex flex-col justify-between shadow-[inset_0_0_10px_rgba(0,0,0,0.85)] border border-zinc-900 relative">

              {/* Glass Reflection Sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-30" />

              {/* WhatsApp App Container (High-Fidelity iOS Light Mode Theme) */}
              <div className="w-full h-full bg-[#efeae2] text-[#1c1b1f] flex flex-col justify-between text-[6.5px] md:text-[8px] font-sans relative">

                {/* iOS Status Bar (Clean Light Theme) */}
                <div className="bg-[#f6f6f6] text-black px-4 pt-2.5 pb-1 flex justify-between items-center text-[4.5px] md:text-[5.5px] font-semibold font-sans shrink-0 z-30 select-none border-b border-zinc-200/20">
                  <span>12:16</span>
                  <div className="flex items-center gap-1">
                    <Wifi className="w-2.5 h-2 text-black" />
                    <Battery className="w-3.5 h-2.5 text-black" />
                  </div>
                </div>

                {/* iOS WhatsApp Header Bar (Light Grey, Real iOS Styling) */}
                <div className="bg-[#f6f6f6]/95 backdrop-blur-md text-black px-2 py-2 flex items-center justify-between shrink-0 z-30 select-none border-b border-zinc-200/50">
                  <div className="flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4 text-[#007aff] cursor-pointer" strokeWidth={2.5} />
                    <div className="w-6 h-6 rounded-full bg-brand-gold flex items-center justify-center font-serif text-[8px] font-bold border border-brand-gold/30 shrink-0">
                      H
                    </div>
                    <div className="pl-0.5 text-left">
                      <p className="font-bold text-[6.5px] md:text-[8px] leading-tight text-zinc-900">HAXR Concierge</p>
                      <p className="text-[4.5px] md:text-[5.5px] text-[#00a884] font-semibold leading-none flex items-center gap-0.5 mt-0.5">
                        <span className="w-1 h-1 bg-[#00a884] rounded-full animate-pulse" />
                        <span>online</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#007aff]">
                    <Video className="w-3.5 h-3.5 cursor-pointer" strokeWidth={2} />
                    <Phone className="w-3.5 h-3.5 cursor-pointer" strokeWidth={2} />
                  </div>
                </div>

                {/* Chat Wallpaper Container */}
                <div className="flex-1 p-2 md:p-3 space-y-2.5 overflow-y-auto flex flex-col justify-end relative">

                  {/* Chat Background Doodle Pattern */}
                  <div
                    className="absolute inset-0 opacity-[0.05] pointer-events-none"
                    style={{
                      backgroundImage: "radial-gradient(#000 0.8px, transparent 0.8px)",
                      backgroundSize: "8px 8px"
                    }}
                  />

                  {/* Bubble 1 (User - right, iOS WhatsApp Light Green) */}
                  <div className="self-end bg-[#d9fdd3] rounded-l-lg rounded-br-lg px-2 py-1.5 max-w-[85%] shadow-[0_1px_1.5px_rgba(0,0,0,0.12)] text-left relative z-10">
                    <div className="flex items-center gap-1.5 bg-[#caedd0] p-1 rounded-xs text-[5px] md:text-[6.5px] font-sans text-emerald-950 mb-1 border border-[#bce2c2]">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-800 shrink-0" strokeWidth={2} />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold truncate">convidados.xlsx</p>
                        <p className="text-[4px] text-emerald-800/60 leading-none mt-0.5">45 KB · Excel</p>
                      </div>
                    </div>
                    <p className="leading-snug text-zinc-800 text-[6.5px] md:text-[7.8px]">Olá! Envio a lista de convidados para carregar no nosso painel HAXR.</p>
                    <div className="flex items-center justify-end gap-0.5 text-[4px] md:text-[5px] text-zinc-400 mt-1 select-none">
                      <span>12:15</span>
                      <span className="text-[#53bdeb] font-bold">✓✓</span>
                    </div>
                  </div>

                  {/* Bubble 2 (Concierge - left, White WhatsApp Bubble) */}
                  <div className="self-start bg-white rounded-r-lg rounded-bl-lg px-2 py-1.5 max-w-[85%] shadow-[0_1px_1.5px_rgba(0,0,0,0.08)] text-left relative z-10">
                    <p className="leading-snug text-zinc-800 text-[6.5px] md:text-[7.8px]">
                      Olá Sofia! Recebido com sucesso. Já carreguei os vossos convidados. Pode atualizar o ecrã do seu computador para ver a lista ativa! 😊
                    </p>
                    <div className="text-[4px] md:text-[5px] text-zinc-400 text-right mt-1 select-none">
                      <span>12:16</span>
                    </div>
                  </div>

                </div>

                {/* Chat Input Field Bar */}
                <div className="bg-[#f0f2f5] px-2.5 py-1.5 border-t border-zinc-200/40 flex items-center gap-2 shrink-0 select-none z-30">
                  <Plus className="w-4 h-4 text-[#007aff] cursor-pointer" strokeWidth={2.5} />
                  <div className="bg-white border border-zinc-200/50 rounded-full py-0.5 px-3 flex-1 text-zinc-400 text-[6px] md:text-[7.8px] flex justify-between items-center h-6">
                    <span>Mensagem</span>
                    <Camera className="w-3.5 h-3.5 text-zinc-400 cursor-pointer" />
                  </div>
                  <Mic className="w-4.5 h-4.5 text-[#007aff] cursor-pointer" strokeWidth={2} />
                </div>

              </div>

              {/* iOS Bottom Bar Area */}
              <div className="bg-[#f0f2f5] py-1 shrink-0 z-30 select-none">
                <div className="w-12 h-1 bg-black/40 mx-auto rounded-full" />
              </div>
            </div>
          </div>

          {/* Floating Email Capsule (Vogue Glassmorphism Style) */}
          <Link href={`${homeConciergeSection.setupCtaHref}#email`}>
            <motion.div
              className="absolute -left-12 bottom-6 bg-white/95 backdrop-blur-md border border-brand-champagne/45 hover:border-brand-gold text-brand-text-dark font-sans text-xs md:text-sm font-medium py-3.5 px-6 rounded-full shadow-[0_16px_36px_rgba(184,138,42,0.15)] flex items-center gap-3 z-45 cursor-pointer transition-all duration-300"
              animate={{
                y: [0, -6, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              whileHover={{ scale: 1.03 }}
            >
              <div className="bg-brand-black text-white p-2 rounded-full flex items-center justify-center shrink-0 shadow-md">
                <CornerUpRight className="w-3 h-3 text-brand-gold" strokeWidth={2.5} />
              </div>
              <span className="font-mono text-[9px] md:text-[10px] tracking-wider font-bold">
                concierge@haxrsignature.com
              </span>
            </motion.div>
          </Link>

        </div>

      </div>

      {/* Right Column: Text Information */}
      <div className="lg:col-span-4 space-y-6 text-left">
        <div className="inline-flex items-center gap-2.5 text-brand-gold">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4.5 h-4.5 text-brand-gold shrink-0">
            <path d="M12 6L16 12L12 18L8 12Z" fill="currentColor" fillOpacity="0.2" />
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeDasharray="3 3" />
            <path d="M12 2V4M12 20V22M2 12H4M20 12H22" stroke="currentColor" strokeLinecap="round" />
          </svg>
          <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Assistente Digital HAXR</span>
        </div>

        <h2 className="font-serif text-3xl sm:text-5xl font-light text-white leading-tight">
          Conheça o HAXR Concierge™
        </h2>

        <p className="font-sans text-sm md:text-base text-brand-ivory/70 leading-relaxed font-light max-w-xl">
          A forma mais inteligente de gerir a caixa de entrada do vosso casamento. Encaminhe propostas de fornecedores, comprovativos de pagamento ou listas de convidados por email ou WhatsApp.
        </p>

        <p className="font-sans text-xs text-brand-ivory/55 leading-relaxed font-light max-w-xl">
          A IA lê, classifica e extrai os dados. A equipa HAXR valida antes de actualizar fornecedores, orçamento, convidados e moodboard no painel do evento.
        </p>

        <div className="pt-4">
          <Link
            href={homeConciergeSection.setupCtaHref}
            className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase font-bold text-white hover:text-brand-gold transition-colors border-b border-white hover:border-brand-gold pb-1.5 cursor-pointer"
          >
            <span>{homeConciergeSection.setupCtaLabel}</span>
          </Link>
        </div>
      </div>

    </div>
  );
}
