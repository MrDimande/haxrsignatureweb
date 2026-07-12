"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  findBestMatch,
  getWhatsAppUrl,
  getEmailUrl,
  GREETING_MESSAGE,
  type AssistantMessage,
} from "@/lib/assistant-knowledge";

/* ------------------------------------------------------------------ */
/*  SVG Icons (inline to avoid extra deps)                             */
/* ------------------------------------------------------------------ */

function BotIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer orbital ring — dashed, elegant */}
      <circle
        cx="16"
        cy="16"
        r="14"
        stroke="currentColor"
        strokeWidth={0.6}
        strokeDasharray="2.5 3"
        opacity={0.35}
      />
      {/* Inner orbital ring */}
      <circle
        cx="16"
        cy="16"
        r="10.5"
        stroke="currentColor"
        strokeWidth={0.5}
        strokeDasharray="1.5 2.5"
        opacity={0.25}
      />

      {/* Faceted diamond — top-down gem view */}
      <path
        d="M16 6 L21.5 11 L16 26 L10.5 11 Z"
        stroke="currentColor"
        strokeWidth={1}
        fill="currentColor"
        fillOpacity={0.08}
        strokeLinejoin="round"
      />
      {/* Diamond inner facets — left */}
      <path
        d="M16 6 L10.5 11 L16 14.5"
        stroke="currentColor"
        strokeWidth={0.6}
        opacity={0.5}
        strokeLinejoin="round"
      />
      {/* Diamond inner facets — right */}
      <path
        d="M16 6 L21.5 11 L16 14.5"
        stroke="currentColor"
        strokeWidth={0.6}
        opacity={0.5}
        strokeLinejoin="round"
      />
      {/* Diamond girdle (widest line) */}
      <line
        x1="10.5"
        y1="11"
        x2="21.5"
        y2="11"
        stroke="currentColor"
        strokeWidth={0.7}
        opacity={0.6}
      />

      {/* Orbital node dots — intelligence connection points */}
      <circle cx="16" cy="2" r="1" fill="currentColor" opacity={0.5} />
      <circle cx="29" cy="11" r="0.8" fill="currentColor" opacity={0.4} />
      <circle cx="27" cy="23" r="0.8" fill="currentColor" opacity={0.3} />
      <circle cx="3" cy="11" r="0.8" fill="currentColor" opacity={0.4} />
      <circle cx="5" cy="23" r="0.8" fill="currentColor" opacity={0.3} />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="22,4 12,13 2,4" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Typing Indicator                                                   */
/* ------------------------------------------------------------------ */

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-4">
      <div className="w-6 h-6 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center shrink-0">
        <BotIcon className="w-3 h-3 text-gold" />
      </div>
      <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-gold/60"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Escalation Card                                                    */
/* ------------------------------------------------------------------ */

function EscalationCard({ userContext }: { userContext: string }) {
  const [showCallback, setShowCallback] = useState(false);
  const [callbackName, setCallbackName] = useState("");
  const [callbackPhone, setCallbackPhone] = useState("");
  const [callbackSent, setCallbackSent] = useState(false);

  const handleCallback = () => {
    if (callbackName.trim() && callbackPhone.trim()) {
      // Store in localStorage as demo — in production would POST to API
      const callbacks = JSON.parse(localStorage.getItem("haxr-callbacks") || "[]");
      callbacks.push({
        name: callbackName,
        phone: callbackPhone,
        context: userContext,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem("haxr-callbacks", JSON.stringify(callbacks));
      setCallbackSent(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mx-4 mt-2 space-y-2"
    >
      {/* WhatsApp */}
      <a
        href={getWhatsAppUrl(userContext)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-[#25d366]/10 border border-[#25d366]/25 hover:bg-[#25d366]/20 hover:border-[#25d366]/40 transition-all duration-300 group"
      >
        <div className="w-9 h-9 rounded-full bg-[#25d366]/20 flex items-center justify-center group-hover:bg-[#25d366]/30 transition-colors">
          <WhatsAppIcon />
        </div>
        <div className="text-left">
          <p className="text-[11px] font-semibold text-white/90">WhatsApp</p>
          <p className="text-[9px] text-white/50">Resposta em minutos</p>
        </div>
        <span className="ml-auto text-[9px] text-[#25d366]/70 font-mono">ONLINE</span>
      </a>

      {/* Email */}
      <a
        href={getEmailUrl(userContext)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gold/5 border border-gold/15 hover:bg-gold/10 hover:border-gold/30 transition-all duration-300 group"
      >
        <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
          <EmailIcon />
        </div>
        <div className="text-left">
          <p className="text-[11px] font-semibold text-white/90">Email</p>
          <p className="text-[9px] text-white/50">info@haxrsignature.com</p>
        </div>
        <span className="ml-auto text-[9px] text-gold/50 font-mono">2–5 DIAS</span>
      </a>

      {/* Callback */}
      {!showCallback && !callbackSent && (
        <button
          onClick={() => setShowCallback(true)}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/30 hover:bg-zinc-800/80 hover:border-zinc-600/40 transition-all duration-300 group"
        >
          <div className="w-9 h-9 rounded-full bg-zinc-700/30 flex items-center justify-center group-hover:bg-zinc-700/50 transition-colors">
            <PhoneIcon />
          </div>
          <div className="text-left">
            <p className="text-[11px] font-semibold text-white/90">Pedir callback</p>
            <p className="text-[9px] text-white/50">Deixe o seu contacto</p>
          </div>
        </button>
      )}

      {showCallback && !callbackSent && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="rounded-xl bg-zinc-800/50 border border-zinc-700/30 p-3 space-y-2"
        >
          <input
            type="text"
            placeholder="Seu nome"
            value={callbackName}
            onChange={(e) => setCallbackName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-700/40 text-[11px] text-white/90 placeholder:text-white/30 outline-none focus:border-gold/40 transition-colors"
          />
          <input
            type="tel"
            placeholder="+258 8X XXX XXXX"
            value={callbackPhone}
            onChange={(e) => setCallbackPhone(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-700/40 text-[11px] text-white/90 placeholder:text-white/30 outline-none focus:border-gold/40 transition-colors"
          />
          <button
            onClick={handleCallback}
            disabled={!callbackName.trim() || !callbackPhone.trim()}
            className="w-full py-2 rounded-lg bg-gold/90 text-black text-[10px] font-semibold tracking-wider uppercase hover:bg-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Enviar
          </button>
        </motion.div>
      )}

      {callbackSent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl bg-[#25d366]/10 border border-[#25d366]/20 p-3 text-center"
        >
          <p className="text-[11px] text-[#25d366]">
            ✓ Recebemos o seu contacto. Ligaremos em breve!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Message Bubble                                                     */
/* ------------------------------------------------------------------ */

function MessageBubble({ message }: { message: AssistantMessage }) {
  const isBot = message.role === "assistant";

  // Simple markdown-like bold parsing
  const renderText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-gold/90">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex items-end gap-2 px-4 ${isBot ? "" : "flex-row-reverse"}`}
    >
      {isBot && (
        <div className="w-6 h-6 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center shrink-0">
          <BotIcon className="w-3 h-3 text-gold" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-[1.6] whitespace-pre-line ${
          isBot
            ? "bg-zinc-800/80 border border-zinc-700/50 text-white/85 rounded-bl-md"
            : "bg-gold/15 border border-gold/20 text-white/90 rounded-br-md"
        }`}
      >
        {renderText(message.text)}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function VirtualAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([GREETING_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [lastUserQuery, setLastUserQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [isOpen]);

  const handleSend = useCallback(
    (text?: string) => {
      const query = (text || input).trim();
      if (!query) return;

      // Add user message
      const userMsg: AssistantMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text: query,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLastUserQuery(query);
      setIsTyping(true);

      // Simulate typing delay (400–900ms)
      const delay = 400 + Math.random() * 500;
      setTimeout(() => {
        const response = findBestMatch(query);
        setMessages((prev) => [...prev, response]);
        setIsTyping(false);
      }, delay);
    },
    [input],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (reply: string) => {
    handleSend(reply);
  };

  // Latest quick replies
  const latestBotMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const quickReplies = latestBotMsg?.quickReplies || [];
  const showEscalation = latestBotMsg?.escalation || false;

  return (
    <>
      {/* ---- Chat Window ---- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-24 right-4 md:right-6 z-[60] w-[calc(100vw-2rem)] md:w-[380px] h-[75vh] md:h-[520px] flex flex-col rounded-2xl border border-gold/15 bg-[#0c0c0c] shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(201,169,110,0.08)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-zinc-900/95 to-zinc-950/95 border-b border-gold/10 backdrop-blur-md shrink-0">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/30 flex items-center justify-center">
                  <BotIcon className="w-4.5 h-4.5 text-gold" />
                </div>
                {/* Online pulse */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#25d366] border-2 border-[#0c0c0c]">
                  <span className="absolute inset-0 rounded-full bg-[#25d366] animate-ping opacity-50" />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[12px] font-semibold text-white/90 tracking-wide">
                  HAXR Concierge
                </h3>
                <p className="text-[9px] text-[#25d366] font-mono tracking-[0.15em] uppercase">
                  online agora
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
                aria-label="Fechar chat"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isTyping && <TypingIndicator />}

              {/* Escalation card */}
              {showEscalation && !isTyping && (
                <EscalationCard userContext={lastUserQuery} />
              )}

              {/* Quick replies */}
              {quickReplies.length > 0 && !isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-wrap gap-1.5 px-4 pt-1"
                >
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleQuickReply(reply)}
                      className="px-3 py-1.5 rounded-full border border-gold/20 bg-gold/5 text-[10px] text-gold/80 font-medium tracking-wide hover:bg-gold/15 hover:border-gold/35 hover:text-gold transition-all duration-200"
                    >
                      {reply}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-zinc-800/80 bg-zinc-950/80 px-3 py-3">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escreva a sua pergunta..."
                  className="flex-1 bg-zinc-900/60 border border-zinc-800/60 rounded-full px-4 py-2.5 text-[12px] text-white/90 placeholder:text-white/25 outline-none focus:border-gold/30 transition-colors"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="w-9 h-9 rounded-full bg-gold/90 flex items-center justify-center text-black hover:bg-gold transition-colors disabled:opacity-25 disabled:cursor-not-allowed shrink-0"
                  aria-label="Enviar mensagem"
                >
                  <SendIcon />
                </button>
              </div>
              <p className="text-center text-[8px] text-white/15 mt-2 font-mono tracking-wider">
                HAXR SIGNATURE · ASSISTENTE VIRTUAL
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- FAB Button ---- */}
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-4 md:right-6 z-[60] w-14 h-14 rounded-full bg-black/95 border border-gold/30 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(201,169,110,0.1)] flex items-center justify-center text-gold hover:border-gold/60 hover:shadow-[0_12px_40px_rgba(201,169,110,0.12)] transition-all duration-500 group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? "Fechar assistente" : "Abrir assistente HAXR"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CloseIcon />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <BotIcon className="w-6 h-6" />
              {/* Green online dot */}
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#25d366] border-2 border-black">
                <span className="absolute inset-0 rounded-full bg-[#25d366] animate-ping opacity-40" />
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full border border-gold/20 animate-ping opacity-20 pointer-events-none" />
        )}
      </motion.button>
    </>
  );
}
