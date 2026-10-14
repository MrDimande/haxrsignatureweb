"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import jsQR from "jsqr";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
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

interface BarcodeDetectorResult {
  rawValue?: string;
}

interface BarcodeDetectorInstance {
  detect: (source: ImageBitmapSource) => Promise<BarcodeDetectorResult[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats: string[] }): BarcodeDetectorInstance;
}

interface WindowWithWebkitAudio extends Window {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
  BarcodeDetector?: BarcodeDetectorConstructor;
}

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Travamento estrito de concorrência e debouncing de frames
  const isProcessingRef = useRef(false);
  const lastScannedTokenRef = useRef<string>("");
  const lastScanTimestampRef = useRef<number>(0);

  // Som suave de confirmação via Web Audio API (compatível com Safari e Chrome sem any)
  const playBeep = useCallback((type: "success" | "warning" | "error") => {
    try {
      const win = typeof window !== "undefined" ? (window as unknown as WindowWithWebkitAudio) : null;
      if (!win) return;
      const AudioCtxClass = win.AudioContext || win.webkitAudioContext;
      if (!AudioCtxClass) return;

      const ctx = new AudioCtxClass();
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
      // Áudio não suportado ou bloqueado pelo navegador
    }
  }, []);

  const handleProcessCheckin = useCallback(
    async (rawToken: string) => {
      const token = extractQrToken(rawToken);
      if (!token || token.length < 16) {
        setScanResult({
          status: "error",
          message: "Token inválido ou demasiado curto (mínimo 16 caracteres).",
        });
        playBeep("error");
        return;
      }

      // Bloqueio de submissão duplicada no mesmo frame ou enquanto uma requisição está pendente
      const now = Date.now();
      if (
        isProcessingRef.current ||
        (lastScannedTokenRef.current === token && now - lastScanTimestampRef.current < 3500)
      ) {
        return;
      }

      isProcessingRef.current = true;
      lastScannedTokenRef.current = token;
      lastScanTimestampRef.current = now;

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
          // Entrada registada com sucesso
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
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    },
    [event.id, playBeep]
  );

  // Leitura de frame via jsQR (compatível com iOS Safari e Android Chrome)
  const scanVideoFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;
    if (isProcessingRef.current) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (width === 0 || height === 0) return;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.drawImage(video, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (decoded?.data) {
      handleProcessCheckin(decoded.data);
    }
  }, [handleProcessCheckin]);

  // Iniciar câmara com preferências para traseira (environment)
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Câmara não suportada pelo navegador.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);

      // Tenta BarcodeDetector nativo se disponível (Chrome / Edge moderno)
      const win = typeof window !== "undefined" ? (window as unknown as WindowWithWebkitAudio) : null;
      if (win?.BarcodeDetector) {
        try {
          detectorRef.current = new win.BarcodeDetector({
            formats: ["qr_code"],
          });
        } catch {
          detectorRef.current = null;
        }
      }

      // Ciclo contínuo de leitura a cada 250ms
      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || isProcessingRef.current) return;

        // Se detector nativo estiver activo, usa-o primeiro
        if (detectorRef.current) {
          try {
            const barcodes = await detectorRef.current.detect(videoRef.current);
            if (barcodes.length > 0 && barcodes[0]?.rawValue) {
              handleProcessCheckin(barcodes[0].rawValue);
              return;
            }
          } catch {
            // Fallback silencioso para jsQR
          }
        }

        // Leitura universal via jsQR (compatível com Safari iOS e Android Chrome)
        scanVideoFrame();
      }, 250);
    } catch (err: unknown) {
      const isError = err instanceof Error;
      const errorName = isError ? err.name : "";
      console.error("[Scanner] Erro ao aceder à câmara:", err);

      setCameraError(
        errorName === "NotAllowedError" || errorName === "PermissionDeniedError"
          ? "Permissão de câmara recusada. Por favor autorize o acesso à câmara nas definições do navegador ou utilize o campo manual."
          : "Não foi possível aceder à câmara deste dispositivo."
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = useCallback(() => {
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
    detectorRef.current = null;
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      handleProcessCheckin(manualToken.trim());
      setManualToken("");
    }
  };

  const pct =
    stats.confirmed > 0
      ? Math.round((stats.checkedIn / stats.confirmed) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Barra de Navegação Superior */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/events/checkin"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-grey/60 hover:text-emerald-400 transition-colors"
            title="Voltar ao portal multi-evento de recepção"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Recepção Geral</span>
          </Link>
          <span className="text-white/20">/</span>
          <Link
            href={`/admin/events/${event.id}?tab=checkin`}
            className="text-xs font-mono uppercase tracking-widest text-grey/60 hover:text-gold transition-colors"
            title="Abrir painel de check-in deste evento"
          >
            <span>Painel Check-in</span>
          </Link>
          <span className="text-white/20">/</span>
          <Link
            href={`/admin/events/${event.id}`}
            className="text-xs font-mono uppercase tracking-widest text-grey/40 hover:text-white transition-colors"
          >
            <span>Evento</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-grey/50">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Scanner Óptico Activo</span>
        </div>
      </div>

      {/* Cabeçalho do Scanner */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-mono mb-3">
              <span>{event.name}</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-white font-light">
              Scanner de Controlo de Entrada
            </h1>
            <p className="text-sm text-grey/60 mt-1 max-w-xl leading-relaxed">
              Aponte a câmara para o Passe Digital apresentado pelo convidado ou insira o código manual para validação instantânea.
            </p>
          </div>

          {/* Métrica Rápida */}
          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
            <div className="text-center">
              <p className="font-mono text-2xl sm:text-3xl font-light text-gold">
                {stats.checkedIn}
              </p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-grey/50 mt-1">
                Entradas
              </p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl sm:text-3xl font-light text-white/80">
                {stats.confirmed}
              </p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-grey/50 mt-1">
                Confirmados
              </p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl sm:text-3xl font-light text-emerald-400">
                {pct}%
              </p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-grey/50 mt-1">
                Presença
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Área Central: Câmara + Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel da Câmara */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative aspect-[4/3] sm:aspect-video w-full rounded-2xl bg-black border border-white/10 overflow-hidden flex items-center justify-center shadow-2xl">
            {/* Elemento de Vídeo com playsInline obrigatório para iOS Safari */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isCameraActive ? "block" : "hidden"}`}
            />

            {/* Overlay da Mira do Scanner */}
            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-64 h-64 border-2 border-gold/70 rounded-3xl shadow-[0_0_50px_rgba(203,185,148,0.2)]">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gold rounded-tl-xl -mt-1 -ml-1" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gold rounded-tr-xl -mt-1 -mr-1" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gold rounded-bl-xl -mb-1 -ml-1" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gold rounded-br-xl -mb-1 -mr-1" />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-gold/10 backdrop-blur-[2px] rounded-3xl flex items-center justify-center">
                      <div className="text-center font-mono text-xs uppercase tracking-widest text-gold animate-pulse">
                        A validar…
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Estado quando a câmara está desligada */}
            {!isCameraActive && (
              <div className="text-center p-8">
                <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-4 text-grey/40">
                  <CameraOff className="w-8 h-8" />
                </div>
                <p className="font-serif text-lg text-white/80">
                  Câmara desligada
                </p>
                <p className="text-xs text-grey/50 mt-1 max-w-sm leading-relaxed">
                  Active a câmara para iniciar o scanner óptico contínuo na porta do evento.
                </p>
                {cameraError && (
                  <div className="mt-4 p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-300 max-w-md mx-auto text-left">
                    {cameraError}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botão de Controlo da Câmara */}
          <div className="flex items-center gap-3">
            {!isCameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="flex-1 py-3 px-6 rounded-xl bg-gold text-black font-serif text-sm tracking-wide font-medium hover:bg-gold-light transition-colors flex items-center justify-center gap-2 shadow-lg shadow-gold/10"
              >
                <Camera className="w-4 h-4" />
                <span>Activar Câmara do Dispositivo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="flex-1 py-3 px-6 rounded-xl bg-white/10 text-white font-serif text-sm tracking-wide hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
              >
                <CameraOff className="w-4 h-4" />
                <span>Desactivar Câmara</span>
              </button>
            )}
          </div>
        </div>

        {/* Painel Lateral: Resultado do Check-in & Input Manual */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Card de Feedback do Último Passe Lido */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col justify-between flex-1 min-h-[300px]">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-grey/50 mb-4">
                Resultado da Última Leitura
              </p>

              {scanResult ? (
                <div className="space-y-4">
                  {scanResult.status === "success" && (
                    <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="font-serif text-base font-medium">
                          {scanResult.message}
                        </span>
                      </div>
                      <p className="font-serif text-2xl text-white mt-3">
                        {scanResult.guestName}
                      </p>
                      <div className="mt-3 pt-3 border-t border-emerald-500/20 text-xs font-mono space-y-1">
                        <p>
                          Lotação: {scanResult.partySize} pessoa(s)
                          {Boolean(scanResult.plusOnes) && ` (+${scanResult.plusOnes} acompanhante(s))`}
                        </p>
                        {scanResult.tableName && (
                          <p className="text-gold">
                            Mesa: {scanResult.tableName}
                            {scanResult.seatLabel ? ` · Lugar ${scanResult.seatLabel}` : ""}
                          </p>
                        )}
                        {scanResult.notes && (
                          <p className="text-grey/70 italic mt-1 font-sans">
                            {scanResult.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {scanResult.status === "already_checked_in" && (
                    <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <span className="font-serif text-base font-medium">
                          {scanResult.message}
                        </span>
                      </div>
                      <p className="font-serif text-2xl text-white mt-3">
                        {scanResult.guestName}
                      </p>
                      <div className="mt-3 pt-3 border-t border-amber-500/20 text-xs font-mono space-y-1">
                        <p>Lotação autorizada: {scanResult.partySize} pessoa(s)</p>
                        {scanResult.tableName && (
                          <p className="text-gold">
                            Mesa: {scanResult.tableName}
                            {scanResult.seatLabel ? ` · Lugar ${scanResult.seatLabel}` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {scanResult.status === "error" && (
                    <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-red-300">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-red-400" />
                        <span className="font-serif text-base font-medium">
                          Entrada Não Autorizada
                        </span>
                      </div>
                      <p className="text-xs text-red-200 mt-2 leading-relaxed">
                        {scanResult.message}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-grey/40">
                  <p className="font-serif text-sm">
                    Nenhum código lido nesta sessão.
                  </p>
                  <p className="text-xs text-grey/50 mt-1">
                    Aguardando apresentação de Passe Digital…
                  </p>
                </div>
              )}
            </div>

            {/* Rodapé Informativo */}
            <div className="pt-4 border-t border-white/5 text-[11px] text-grey/40 font-mono">
              Validação atómica segura · HAXR Signature Check-in v2
            </div>
          </div>

          {/* Fallback de Entrada Manual de Código */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-grey/50 mb-3">
              Validação Manual por Código / Token
            </p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Insira o código ou token do passe…"
                className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-grey/30 font-mono focus:border-gold outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={isProcessing || !manualToken.trim()}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-gold hover:text-black text-white text-xs font-serif tracking-wide transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Validar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
