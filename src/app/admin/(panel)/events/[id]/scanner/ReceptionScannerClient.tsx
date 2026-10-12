"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Search,
  Sparkles,
  ShieldCheck,
  RotateCcw
} from "lucide-react";
import type { ManagedEvent, EventStats } from "@/lib/events/types";

type ScannerResult = {
  status: "success" | "already_checked_in" | "error";
  message: string;
  guestName?: string;
  partySize?: number;
  plusOnes?: number;
  tableName?: string;
  seatLabel?: string;
  notes?: string;
};

type Props = {
  event: ManagedEvent;
  initialStats: EventStats;
};

// Extracção segura de token a partir de URL ou string crua
export function extractQrToken(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (trimmed.includes("/checkin/")) {
    const segments = trimmed.split("/checkin/");
    const tokenPart = segments[1]?.split("?")[0]?.split("/")[0]?.trim();
    if (tokenPart) return tokenPart;
  }
  return trimmed;
}

export default function ReceptionScannerClient({ event, initialStats }: Props) {
  const [stats, setStats] = useState(initialStats);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScannerResult | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Som suave de confirmação via Web Audio API (sem assets externos)
  const playBeep = useCallback((type: "success" | "warning" | "error") => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === "warning") {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // Audio não suportado no navegador
    }
  }, []);

  const handleProcessCheckin = useCallback(async (rawToken: string) => {
    const token = extractQrToken(rawToken);
    if (!token || token.length < 16) {
      setScanResult({
        status: "error",
        message: "Token inválido ou demasiado curto (mínimo 16 caracteres).",
      });
      playBeep("error");
      return;
    }

    setIsProcessing(true);
    setScanResult(null);

    try {
      const res = await fetch("/api/events/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          token,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setScanResult({
          status: "error",
          message: data.message || "Passe não reconhecido ou pertencente a outro evento.",
        });
        playBeep("error");
        return;
      }

      if (data.alreadyCheckedIn) {
        setScanResult({
          status: "already_checked_in",
          message: "Este passe já registou entrada anteriormente!",
          guestName: data.guest?.name,
          partySize: 1 + (data.guest?.plusOnes ?? 0),
          plusOnes: data.guest?.plusOnes ?? 0,
          tableName: data.seat?.tableName,
          seatLabel: data.seat?.label || data.seat?.seatNumber,
          notes: data.guest?.dietaryNotes || data.guest?.guestNotes,
        });
        playBeep("warning");
      } else {
        // Sucesso
        setScanResult({
          status: "success",
          message: "Entrada registada com sucesso!",
          guestName: data.guest?.name,
          partySize: 1 + (data.guest?.plusOnes ?? 0),
          plusOnes: data.guest?.plusOnes ?? 0,
          tableName: data.seat?.tableName,
          seatLabel: data.seat?.label || data.seat?.seatNumber,
          notes: data.guest?.dietaryNotes || data.guest?.guestNotes,
        });
        playBeep("success");
        setStats((prev) => ({
          ...prev,
          checkedIn: prev.checkedIn + 1,
        }));
      }
    } catch {
      setScanResult({
        status: "error",
        message: "Erro de comunicação com o servidor de check-in.",
      });
      playBeep("error");
    } finally {
      setIsProcessing(false);
    }
  }, [event.id, playBeep]);

  // Iniciar câmara
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Câmara não suportada pelo navegador.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);

      // BarcodeDetector
      if ("BarcodeDetector" in window) {
        try {
          detectorRef.current = new (window as any).BarcodeDetector({
            formats: ["qr_code"],
          });
        } catch {
          detectorRef.current = null;
        }
      }

      // Intervalo de leitura
      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || !detectorRef.current || isProcessing) return;
        try {
          const barcodes = await detectorRef.current.detect(videoRef.current);
          if (barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue) {
              handleProcessCheckin(rawValue);
            }
          }
        } catch {
          // Frame sem código
        }
      }, 500);
    } catch (err: any) {
      console.error("[Scanner] Erro na câmara:", err);
      setCameraError(
        err?.name === "NotAllowedError"
          ? "Permissão de câmara recusada. Por favor autorize o acesso à câmara ou utilize o campo manual."
          : "Não foi possível aceder à câmara deste dispositivo."
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#07130F] text-[#FCFDFC] p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <div className="w-full max-w-xl">
        {/* Header de navegação */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/admin/events/${event.id}`}
            className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#CBB994] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            VOLTAR AO EVENTO
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#153B30] text-[#CBB994] text-[10px] tracking-wider uppercase border border-[#CBB994]/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Sessão Autorizada
          </div>
        </div>

        {/* Título e estatística de acolhimento */}
        <div className="bg-[#0A211A] border border-[#CBB994]/30 rounded-2xl p-5 mb-6 shadow-xl">
          <p className="text-[10px] uppercase font-mono tracking-[0.3em] text-[#CBB994] mb-1">
            Recepção & Portaria
          </p>
          <h1 className="font-serif text-2xl font-light text-white mb-3">
            {event.name}
          </h1>
          <div className="grid grid-cols-3 gap-2 border-t border-[#CBB994]/20 pt-3 text-center">
            <div>
              <p className="text-[9px] uppercase font-mono text-[#EBE4D5]/60">Confirmados</p>
              <p className="font-serif text-lg text-white">{stats.confirmed}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase font-mono text-[#CBB994]">Entradas</p>
              <p className="font-serif text-lg text-[#CBB994] font-medium">{stats.checkedIn}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase font-mono text-[#EBE4D5]/60">Total</p>
              <p className="font-serif text-lg text-white">{stats.totalGuests}</p>
            </div>
          </div>
        </div>

        {/* Resultado do Check-in em destaque */}
        {scanResult && (
          <div
            className={`rounded-2xl p-6 mb-6 border shadow-2xl transition-all duration-300 ${
              scanResult.status === "success"
                ? "bg-emerald-950/80 border-emerald-500/60 text-emerald-100"
                : scanResult.status === "already_checked_in"
                ? "bg-amber-950/80 border-amber-500/60 text-amber-100"
                : "bg-rose-950/80 border-rose-500/60 text-rose-100"
            }`}
          >
            <div className="flex items-start gap-4">
              {scanResult.status === "success" ? (
                <CheckCircle2 className="w-9 h-9 text-emerald-400 shrink-0 mt-0.5" />
              ) : scanResult.status === "already_checked_in" ? (
                <AlertTriangle className="w-9 h-9 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-9 h-9 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-xs uppercase font-mono tracking-widest font-semibold">
                  {scanResult.message}
                </p>
                {scanResult.guestName && (
                  <p className="font-serif text-2xl text-white mt-1">
                    {scanResult.guestName}
                  </p>
                )}
                {scanResult.partySize !== undefined && (
                  <div className="mt-2 text-sm text-[#EBE4D5]">
                    <span className="font-medium">Lotação autorizada:</span>{" "}
                    {scanResult.partySize} {scanResult.partySize === 1 ? "pessoa" : "pessoas"}{" "}
                    {scanResult.plusOnes ? `(1 titular + ${scanResult.plusOnes} acompanhantes)` : "(individual)"}
                  </div>
                )}
                {scanResult.tableName && (
                  <p className="text-sm text-gold mt-1">
                    Mesa: <span className="font-semibold">{scanResult.tableName}</span>
                    {scanResult.seatLabel && ` (Lugar ${scanResult.seatLabel})`}
                  </p>
                )}
                {scanResult.notes && (
                  <p className="text-xs italic text-[#EBE4D5]/70 mt-2">
                    Nota: {scanResult.notes}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setScanResult(null)}
              className="mt-4 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono uppercase tracking-wider text-white transition-colors"
            >
              Concluído / Próximo Convidado
            </button>
          </div>
        )}

        {/* Viewfinder da Câmara */}
        <div className="bg-[#0A211A] border border-[#CBB994]/30 rounded-2xl p-5 mb-6 flex flex-col items-center">
          <div className="relative w-full aspect-square max-w-sm rounded-xl overflow-hidden bg-black/60 border border-[#CBB994]/20 flex items-center justify-center">
            {isCameraActive ? (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Mira óptica do scanner */}
                <div className="pointer-events-none absolute inset-10 border-2 border-[#CBB994]/60 rounded-2xl">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#CBB994]" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#CBB994]" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#CBB994]" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#CBB994]" />
                </div>
              </>
            ) : (
              <div className="text-center p-6">
                <Camera className="w-12 h-12 text-[#CBB994]/50 mx-auto mb-3" />
                <p className="text-xs text-[#EBE4D5]/70 max-w-xs">
                  Aponte a câmara do telemóvel ou tablet para o código QR do passe do convidado.
                </p>
              </div>
            )}
          </div>

          {cameraError && (
            <p className="text-xs text-rose-400 text-center mt-3 leading-relaxed">
              {cameraError}
            </p>
          )}

          <div className="mt-4 w-full flex gap-3">
            {!isCameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="flex-1 py-3 px-4 rounded-xl bg-[#CBB994] text-[#0A211A] text-xs font-mono uppercase tracking-wider font-semibold hover:bg-[#DCD1B8] transition-colors inline-flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Activar Câmara
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="flex-1 py-3 px-4 rounded-xl bg-white/10 text-white text-xs font-mono uppercase tracking-wider hover:bg-white/20 transition-colors inline-flex items-center justify-center gap-2"
              >
                <CameraOff className="w-4 h-4" />
                Desactivar Câmara
              </button>
            )}
          </div>
        </div>

        {/* Recuperação Manual (Fallback de Segurança) */}
        <div className="bg-[#0A211A] border border-[#CBB994]/30 rounded-2xl p-5 shadow-lg">
          <p className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#CBB994] mb-1">
            Recuperação Manual
          </p>
          <p className="text-xs text-[#EBE4D5]/70 mb-3">
            Se a câmara não puder ser utilizada, cole o link do passe ou digite o código de 32 caracteres.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualToken.trim()) {
                handleProcessCheckin(manualToken);
              }
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Cole o link ou token..."
              className="flex-1 bg-black/40 border border-[#CBB994]/30 rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#EBE4D5]/30 focus:outline-none focus:border-[#CBB994]"
            />
            <button
              type="submit"
              disabled={isProcessing || !manualToken.trim()}
              className="py-2.5 px-5 rounded-xl bg-[#153B30] hover:bg-[#1E5244] border border-[#CBB994]/40 text-xs font-mono uppercase tracking-wider text-[#CBB994] transition-colors disabled:opacity-50"
            >
              {isProcessing ? "A validar..." : "Registar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
