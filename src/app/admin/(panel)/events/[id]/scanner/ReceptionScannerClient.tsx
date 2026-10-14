"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import jsQR from "jsqr";
import { extractQrToken } from "@/lib/events/qr-token";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Check,
  AlertCircle,
  X,
  Sparkles,
  Lock,
  RefreshCw,
  Search,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";
import type { ManagedEvent, EventStats } from "@/lib/events/types";

// Compatibilidade estrita com os testes de segurança e consumidores externos
export { extractQrToken };

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
  getSupportedFormats?: () => Promise<string[]>;
}

interface WindowWithWebkitAudio extends Window {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
  BarcodeDetector?: BarcodeDetectorConstructor;
}

export default function ReceptionScannerClient({ event, initialStats }: Props) {
  const [stats, setStats] = useState(initialStats);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScannerResult | null>(null);
  const [scanFeedback, setScanFeedback] = useState("Lente óptica em repouso. Active a câmara para iniciar o acolhimento.");
  const [nativeDetectorAvailable, setNativeDetectorAvailable] = useState(false);
  const [isManualExpanded, setIsManualExpanded] = useState(false);
  const [scannerDiagnostics, setScannerDiagnostics] = useState({
    frames: 0,
    width: 0,
    height: 0,
    fps: 0,
    lastLatencyMs: 0,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const roiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null);
  const hasNativeDetectorRef = useRef(false);
  const isScanTickBusyRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const isMountedRef = useRef(false);

  // Travamento de concorrência e debouncing
  const isProcessingRef = useRef(false);
  const lastScannedTokenRef = useRef<string>("");
  const lastScanTimestampRef = useRef<number>(0);
  const framesAnalysedRef = useRef(0);
  const cameraStartedAtRef = useRef(0);
  const lastDiagnosticsUpdateRef = useRef(0);
  const lastDecodedAtRef = useRef(0);
  const lastTickTimeRef = useRef(0);
  const lastLatencyMsRef = useRef(0);
  const fpsCounterRef = useRef(0);
  const lastFpsTimeRef = useRef(0);
  const currentFpsRef = useRef(0);
  const scanTickRef = useRef<(() => Promise<void>) | null>(null);

  // Dois Canvas Offscreen Fixos (Zero Realocação de Memória)
  const getRoiCanvas = useCallback(() => {
    if (!roiCanvasRef.current && typeof document !== "undefined") {
      const c = document.createElement("canvas");
      c.width = 480;
      c.height = 480;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (ctx) ctx.imageSmoothingEnabled = false;
      roiCanvasRef.current = c;
    }
    return roiCanvasRef.current;
  }, []);

  const getFullCanvas = useCallback(() => {
    if (!fullCanvasRef.current && typeof document !== "undefined") {
      const c = document.createElement("canvas");
      c.width = 640;
      c.height = 360;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (ctx) ctx.imageSmoothingEnabled = false;
      fullCanvasRef.current = c;
    }
    return fullCanvasRef.current;
  }, []);

  // Som sutil de confirmação via Web Audio API
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
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === "warning") {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.28);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // Áudio silenciado ou bloqueado pelo ambiente
    }
  }, []);

  const handleProcessCheckin = useCallback(
    async (rawToken: string) => {
      const token = extractQrToken(rawToken);
      if (!token || token.length < 16) {
        const message = "O código óptico foi lido, mas não corresponde a um Passe Digital HAXR válido.";
        setScanResult({ status: "error", message });
        setScanFeedback(message);
        playBeep("error");
        return;
      }

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
      setScanFeedback("Passe detectado. A autenticar entrada no servidor…");

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
          const message =
            data.message ||
            (res.status === 401 || res.status === 403
              ? "Sessão de recepção expirada ou não autorizada. Inicie sessão novamente para continuar."
              : res.status === 404
                ? "Passe digital não localizado para este evento. Verifique a credencial do convidado."
                : res.status === 429
                  ? "Limite momentâneo de leituras atingido. Aguarde alguns instantes."
                  : res.status >= 500
                    ? `O serviço de validação não respondeu adequadamente (HTTP ${res.status}).`
                    : `Acesso não concedido pelo servidor (HTTP ${res.status}${data.error ? `, ${String(data.error)}` : ""}).`);
          setScanResult({ status: "error", message });
          setScanFeedback(message);
          playBeep("error");
          return;
        }

        if (data.alreadyCheckedIn) {
          setScanFeedback("Passe já utilizado. Registo de entrada anterior confirmado.");
          setScanResult({
            status: "already_checked_in",
            message: "Entrada registada anteriormente",
            guestName: data.guest?.name,
            partySize: 1 + (data.guest?.plusOnes ?? 0),
            plusOnes: data.guest?.plusOnes ?? 0,
            tableName: data.seat?.tableName,
            seatLabel: data.seat?.label || data.seat?.seatNumber,
            notes: data.guest?.dietaryNotes || data.guest?.guestNotes,
          });
          playBeep("warning");
        } else {
          setScanFeedback("Entrada confirmada com distinção. Acolhimento autorizado.");
          setScanResult({
            status: "success",
            message: "Presença Confirmada",
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
        const message = "Não foi possível estabelecer comunicação com o servidor de validação.";
        setScanResult({ status: "error", message });
        setScanFeedback(message);
        playBeep("error");
      } finally {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    },
    [event.id, playBeep]
  );

  const scheduleNextTick = useCallback(() => {
    if (!isMountedRef.current || !streamRef.current) return;
    rafIdRef.current = requestAnimationFrame(() => {
      void scanTickRef.current?.();
    });
  }, []);

  const scanTick = useCallback(async () => {
    if (!isMountedRef.current || !streamRef.current) return;

    const now = performance.now();
    const interval = hasNativeDetectorRef.current ? 80 : 65;
    if (now - lastTickTimeRef.current < interval) {
      scheduleNextTick();
      return;
    }

    if (isScanTickBusyRef.current || isProcessingRef.current) {
      scheduleNextTick();
      return;
    }

    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      scheduleNextTick();
      return;
    }

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    if (videoWidth <= 0 || videoHeight <= 0) {
      scheduleNextTick();
      return;
    }

    isScanTickBusyRef.current = true;
    lastTickTimeRef.current = now;
    framesAnalysedRef.current += 1;
    const frameCount = framesAnalysedRef.current;

    // Métricas de cadência e FPS
    fpsCounterRef.current += 1;
    if (now - lastFpsTimeRef.current >= 1000) {
      currentFpsRef.current = Math.round(
        (fpsCounterRef.current * 1000) / (now - lastFpsTimeRef.current)
      );
      fpsCounterRef.current = 0;
      lastFpsTimeRef.current = now;
    }

    // Telemetria secundária com throttle estrito de 1000ms (Regra 4: zero re-renders por frame)
    if (now - lastDiagnosticsUpdateRef.current >= 1000) {
      lastDiagnosticsUpdateRef.current = now;
      setScannerDiagnostics({
        frames: frameCount,
        width: videoWidth,
        height: videoHeight,
        fps: currentFpsRef.current,
        lastLatencyMs: lastLatencyMsRef.current,
      });

      const elapsed = Date.now() - cameraStartedAtRef.current;
      const sinceDecoded = lastDecodedAtRef.current
        ? Date.now() - lastDecodedAtRef.current
        : Number.POSITIVE_INFINITY;
      if (!isProcessingRef.current && elapsed > 2500 && sinceDecoded > 3500) {
        setScanFeedback("Lente óptica activa. Aponte para o passe digital.");
      }
    }

    const tickStart = performance.now();
    let decodedRaw: string | null = null;

    try {
      // ─── TIER 1: BarcodeDetector Nativo (Zero-Copy) ───
      if (hasNativeDetectorRef.current && detectorRef.current) {
        try {
          const barcodes = await detectorRef.current.detect(video);
          if (barcodes && barcodes.length > 0) {
            const matched = barcodes.find(
              (b) => typeof b.rawValue === "string" && b.rawValue.trim().length > 0
            )?.rawValue;
            if (matched) {
              decodedRaw = matched;
            }
          }
        } catch {
          // Degradação graciosa em caso de erro transitório no driver nativo
        }
      }

      // Se já detectou pelo Tier 1 nativo, conclui sem tocar em Canvas
      if (decodedRaw) {
        lastLatencyMsRef.current = Math.round(performance.now() - tickStart);
        lastDecodedAtRef.current = Date.now();
        setScanFeedback("QR detectado — a validar credencial…");
        void handleProcessCheckin(decodedRaw);
        return;
      }

      // Se o detector nativo está activo e saudável, corre jsQR apenas 1 a cada 4 frames como apoio para reflexos
      const shouldRunJsQr = !hasNativeDetectorRef.current || frameCount % 4 === 0;

      if (shouldRunJsQr) {
        const roiCanvas = getRoiCanvas();
        const roiCtx = roiCanvas?.getContext("2d", { willReadFrequently: true });

        if (roiCanvas && roiCtx) {
          roiCtx.imageSmoothingEnabled = false;

          // Recorte do sensor prevenindo corte de finder patterns (78% da menor dimensão)
          const sourceSize = Math.floor(Math.min(videoWidth, videoHeight) * 0.78);
          const sourceX = Math.round((videoWidth - sourceSize) / 2);
          const sourceY = Math.round((videoHeight - sourceSize) / 2);

          roiCtx.drawImage(video, sourceX, sourceY, sourceSize, sourceSize, 0, 0, 480, 480);
          const roiImageData = roiCtx.getImageData(0, 0, 480, 480);

          // ─── TIER 2: Motor Primário jsQR ROI 480x480 (dontInvert) ───
          let decoded = jsQR(roiImageData.data, 480, 480, {
            inversionAttempts: "dontInvert",
          });

          // ─── TIER 3: Inversão Rápida no ROI reutilizando o mesmo ImageData ───
          if (!decoded && frameCount % 3 === 0) {
            decoded = jsQR(roiImageData.data, 480, 480, {
              inversionAttempts: "onlyInvert",
            });
          }

          // ─── TIER 4: Fallback Periférico 640x360 Sem Jank ───
          if (!decoded && frameCount % 6 === 0) {
            const fullCanvas = getFullCanvas();
            const fullCtx = fullCanvas?.getContext("2d", { willReadFrequently: true });
            if (fullCanvas && fullCtx) {
              fullCtx.imageSmoothingEnabled = false;
              fullCtx.drawImage(video, 0, 0, 640, 360);
              const fullImageData = fullCtx.getImageData(0, 0, 640, 360);
              decoded = jsQR(fullImageData.data, 640, 360, {
                inversionAttempts: "dontInvert",
              });
            }
          }

          if (decoded?.data) {
            decodedRaw = decoded.data;
          }
        }
      }

      if (decodedRaw) {
        lastLatencyMsRef.current = Math.round(performance.now() - tickStart);
        lastDecodedAtRef.current = Date.now();
        setScanFeedback("QR detectado — a validar credencial…");
        void handleProcessCheckin(decodedRaw);
      }
    } catch (err) {
      console.error("[Scanner] Erro no ciclo óptico:", err);
    } finally {
      isScanTickBusyRef.current = false;
      scheduleNextTick();
    }
  }, [
    getRoiCanvas,
    getFullCanvas,
    handleProcessCheckin,
    scheduleNextTick,
  ]);

  useEffect(() => {
    scanTickRef.current = scanTick;
  }, [scanTick]);

  const startCamera = async () => {
    setCameraError(null);
    setScanFeedback("A solicitar calibração e acesso ao sensor óptico…");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Dispositivo óptico não suportado neste ambiente.");
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

      // Calibração óptica segura: autofocus contínuo onde suportado
      try {
        const [videoTrack] = stream.getVideoTracks();
        if (videoTrack) {
          const capabilities =
            typeof videoTrack.getCapabilities === "function"
              ? (videoTrack.getCapabilities() as Record<string, unknown>)
              : null;
          if (
            capabilities &&
            "focusMode" in capabilities &&
            Array.isArray(capabilities.focusMode) &&
            capabilities.focusMode.includes("continuous")
          ) {
            await videoTrack.applyConstraints({
              advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet],
            });
          }
        }
      } catch {
        // Silencioso se o hardware não suportar restrições avançadas
      }

      const video = videoRef.current;
      if (!video) throw new Error("O visor óptico não está disponível.");

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      detectorRef.current = null;
      let hasNative = false;
      const win =
        typeof window !== "undefined"
          ? (window as unknown as WindowWithWebkitAudio)
          : null;
      if (win?.BarcodeDetector) {
        try {
          const supported =
            typeof win.BarcodeDetector.getSupportedFormats === "function"
              ? await win.BarcodeDetector.getSupportedFormats()
              : ["qr_code"];
          if (supported.includes("qr_code")) {
            detectorRef.current = new win.BarcodeDetector({ formats: ["qr_code"] });
            hasNative = true;
          }
        } catch {
          detectorRef.current = null;
          hasNative = false;
        }
      }
      hasNativeDetectorRef.current = hasNative;
      setNativeDetectorAvailable(hasNative);

      framesAnalysedRef.current = 0;
      fpsCounterRef.current = 0;
      lastFpsTimeRef.current = performance.now();
      currentFpsRef.current = 0;
      cameraStartedAtRef.current = Date.now();
      lastDiagnosticsUpdateRef.current = 0;
      lastDecodedAtRef.current = 0;
      lastTickTimeRef.current = 0;
      lastLatencyMsRef.current = 0;
      isScanTickBusyRef.current = false;

      setScannerDiagnostics({
        frames: 0,
        width: video.videoWidth || 1280,
        height: video.videoHeight || 720,
        fps: 0,
        lastLatencyMs: 0,
      });

      setIsCameraActive(true);
      setScanFeedback("Scanner pronto. Aproxime o passe digital.");

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        void scanTickRef.current?.();
      });
    } catch (err: unknown) {
      const isError = err instanceof Error;
      const errorName = isError ? err.name : "";
      console.error("[Scanner] Erro ao calibrar câmara:", err);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      const message =
        errorName === "NotAllowedError" || errorName === "PermissionDeniedError"
          ? "Permissão da câmara recusada no navegador. Autorize o sensor ou recorra à validação por código."
          : errorName === "NotFoundError"
            ? "Nenhum sensor de vídeo detectado neste terminal."
            : errorName === "NotReadableError" || errorName === "AbortError"
              ? "O sensor de vídeo está ocupado por outro processo. Feche outras aplicações e tente novamente."
              : "Não foi possível calibrar a câmara. Recorra à validação manual abaixo.";
      detectorRef.current = null;
      hasNativeDetectorRef.current = false;
      setNativeDetectorAvailable(false);
      setCameraError(message);
      setScanFeedback(message);
      setIsCameraActive(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    detectorRef.current = null;
    hasNativeDetectorRef.current = false;
    isScanTickBusyRef.current = false;
    setNativeDetectorAvailable(false);
    setIsCameraActive(false);
    setScannerDiagnostics({
      frames: framesAnalysedRef.current,
      width: 0,
      height: 0,
      fps: 0,
      lastLatencyMs: 0,
    });
    setScanFeedback("Abertura óptica em pausa. Active o leitor para acolher convidados.");
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
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
    <div className="relative min-h-screen bg-[#080706] text-[#F7F1E8] antialiased selection:bg-[#B88A2A]/30 selection:text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* ─── Atmosfera Sutil de Alta-Costura ─── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-[radial-gradient(ellipse_at_top,rgba(184,138,42,0.08),transparent_65%)] blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(234,216,184,0.02),transparent_40%)]" />
      </div>

      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* ─── Barra Arquitectónica Superior (Masthead & Protocolo) ─── */}
        <header className="border-b border-[#B88A2A]/15 pb-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Esquerda: Identidade & Contexto Editorial */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/events/checkin"
                  className="group inline-flex items-center gap-1.5 text-xs text-[#EAD8B8]/60 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 text-[#B88A2A]" />
                  <span>Recepção Geral</span>
                </Link>
                <span className="text-[#B88A2A]/20">/</span>
                <Link
                  href={`/admin/events/${event.id}?tab=checkin`}
                  className="text-xs text-[#EAD8B8]/60 hover:text-white transition-colors"
                >
                  Painel Operacional
                </Link>
              </div>

              <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 pt-1">
                <h1 className="font-serif text-2xl sm:text-3xl text-[#F7F1E8] font-light tracking-tight">
                  {event.name}
                </h1>
                <span className="text-xs text-[#EAD8B8]/50 italic font-serif">
                  — Consola de Recepção & Acolhimento
                </span>
              </div>
            </div>

            {/* Direita: Marca & Telemetria em Alta Precisão */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 self-start md:self-auto">
              {/* Telemetria de Presença Compacta */}
              <div className="flex items-center gap-3 border-l sm:border-l border-[#B88A2A]/15 pl-4 sm:pl-5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#EAD8B8]/50">
                      Presença
                    </span>
                    <span className="font-mono text-xs text-[#E3C46B] tabular-nums font-medium">
                      {pct}%
                    </span>
                  </div>
                  <p className="text-xs font-serif text-[#F7F1E8] tabular-nums">
                    <span className="text-[#EAD8B8] font-medium">{stats.checkedIn}</span>
                    <span className="text-white/30 text-[10px] mx-1">de</span>
                    <span>{stats.confirmed} convidados</span>
                  </p>
                </div>

                <div className="h-7 w-px bg-[#B88A2A]/20" />

                <div
                  role="status"
                  aria-live="polite"
                  className="inline-flex items-center gap-2 text-[10px] font-mono tracking-wider"
                >
                  <span className="relative flex h-2 w-2">
                    {isCameraActive && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    )}
                    <span
                      className={`relative inline-flex h-2 w-2 rounded-full ${
                        isCameraActive ? "bg-emerald-400" : "bg-[#B88A2A]/40"
                      }`}
                    />
                  </span>
                  <span className={isCameraActive ? "text-emerald-300" : "text-white/40"}>
                    {isCameraActive ? "Sensor Activo" : "Em Repouso"}
                  </span>
                </div>
              </div>

              <BrandLogo variant="admin" tone="gold" priority className="hidden lg:block opacity-90" />
            </div>
          </div>
        </header>

        {/* ─── Palco Operacional Principal (Composição Arquitectónica Monolítica) ─── */}
        <main className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
          {/* ─── Lado Esquerdo: A Lente Óptica (Haute Horlogerie Reticle) ─── */}
          <section
            aria-labelledby="optical-viewport-title"
            className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-[#B88A2A]/20 bg-[#0C0B0A] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Barra de Status da Lente */}
            <div className="flex items-center justify-between border-b border-[#B88A2A]/10 px-5 py-3.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#B88A2A]" />
                <h2 id="optical-viewport-title" className="font-serif text-sm text-[#F7F1E8] tracking-wide font-light">
                  Abertura de Leitura Óptica
                </h2>
              </div>
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#EAD8B8]/40">
                {isCameraActive && scannerDiagnostics.width > 0 && (
                  <span className="text-[#EAD8B8]/60 tabular-nums">
                    {scannerDiagnostics.width}×{scannerDiagnostics.height}
                    {scannerDiagnostics.fps > 0 ? ` · ${scannerDiagnostics.fps} FPS` : ""}
                    {scannerDiagnostics.lastLatencyMs > 0 ? ` · ${scannerDiagnostics.lastLatencyMs}ms` : ""}
                  </span>
                )}
                <span>HAXR Optical Engine v2.5</span>
              </div>
            </div>

            {/* O Viewfinder (Lente) */}
            <div className="p-4 sm:p-6 flex-1 flex flex-col justify-center">
              <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden rounded-lg border border-[#B88A2A]/20 bg-[#050403] shadow-inner flex items-center justify-center">
                {/* Vídeo Nativo */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 h-full w-full object-cover ${
                    isCameraActive ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                />

                {/* Retículo de Alta-Costura / Precisão Horológica (Quando a câmara está ligada) */}
                {isCameraActive && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  >
                    {/* Moldura de Acolhimento */}
                    <div className="relative flex aspect-square w-[min(72%,17rem)] items-center justify-center">
                      {/* Cantos de Ouro Fino Lapidado */}
                      <span className="absolute -left-1.5 -top-1.5 h-6 w-6 border-l border-t border-[#E3C46B]" />
                      <span className="absolute -right-1.5 -top-1.5 h-6 w-6 border-r border-t border-[#E3C46B]" />
                      <span className="absolute -bottom-1.5 -left-1.5 h-6 w-6 border-b border-l border-[#E3C46B]" />
                      <span className="absolute -bottom-1.5 -right-1.5 h-6 w-6 border-b border-r border-[#E3C46B]" />

                      {/* Eixo Central de Precisão */}
                      <div className="absolute h-px w-3 bg-[#E3C46B]/40" />
                      <div className="absolute h-3 w-px bg-[#E3C46B]/40" />

                      {/* Varrimento de Luz Suave */}
                      <div className="absolute inset-x-2 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#E3C46B]/90 to-transparent animate-pulse motion-reduce:hidden" />

                      {/* Sobreposição de Processamento Atómico */}
                      {isProcessing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center rounded bg-black/80 backdrop-blur-sm space-y-2.5">
                          <RefreshCw className="h-5 w-5 text-[#E3C46B] animate-spin" />
                          <span className="font-serif text-xs text-[#EAD8B8] tracking-widest uppercase">
                            A Autenticar Passe…
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Estado Standby (Câmara Desligada) — Convite ao Acolhimento */}
                {!isCameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-[radial-gradient(ellipse_at_center,rgba(234,216,184,0.03),transparent_70%)]">
                    <div className="h-12 w-12 rounded-full border border-[#B88A2A]/30 flex items-center justify-center text-[#E3C46B]/80 shadow-[0_0_25px_rgba(184,138,42,0.1)]">
                      <Sparkles className="h-5 w-5 stroke-[1.25]" />
                    </div>

                    <div className="max-w-xs space-y-1">
                      <h3 className="font-serif text-lg text-[#F7F1E8] font-light">
                        Pronto para Acolher
                      </h3>
                      <p className="text-xs text-[#EAD8B8]/60 font-sans leading-relaxed">
                        Inicie o leitor óptico para ler o código QR apresentado no passe do convidado.
                      </p>
                    </div>

                    {cameraError && (
                      <div
                        role="alert"
                        className="max-w-xs text-left text-xs text-red-300 bg-red-950/30 border border-red-500/25 p-3 rounded"
                      >
                        {cameraError}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={startCamera}
                      className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded border border-[#E3C46B]/70 bg-gradient-to-r from-[#B88A2A]/20 via-[#E3C46B]/20 to-[#B88A2A]/20 px-6 py-2.5 text-xs font-serif tracking-widest uppercase text-[#F7F1E8] hover:border-[#E3C46B] hover:text-white transition-all shadow-md active:scale-[0.98]"
                    >
                      <Camera className="h-4 w-4 text-[#E3C46B]" />
                      <span>Activar Leitor Óptico</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé da Lente & Controlos de Operação */}
            <div className="border-t border-[#B88A2A]/10 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0A0908]">
              <div className="flex items-center gap-2 text-xs text-[#EAD8B8]/70 font-sans">
                <span className="font-mono text-[10px] text-[#E3C46B]">❖</span>
                <span className="truncate max-w-sm sm:max-w-md">{scanFeedback}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isCameraActive ? (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="inline-flex min-h-[44px] items-center gap-2 px-4 py-2 rounded border border-red-500/30 bg-red-950/20 text-red-200 text-xs font-mono uppercase tracking-wider hover:bg-red-950/40 transition-colors"
                  >
                    <CameraOff className="h-3.5 w-3.5" />
                    <span>Pausar Lente</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex min-h-[44px] items-center gap-2 px-4 py-2 rounded border border-[#B88A2A]/40 bg-[#B88A2A]/10 text-[#EAD8B8] text-xs font-mono uppercase tracking-wider hover:bg-[#B88A2A]/20 transition-colors"
                  >
                    <Camera className="h-3.5 w-3.5 text-[#E3C46B]" />
                    <span>Activar Lente</span>
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ─── Lado Direito: O Folio de Presença (O Livro de Honra) ─── */}
          <section
            aria-labelledby="folio-registry-title"
            aria-live="polite"
            className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-[#B88A2A]/20 bg-[#0C0B0A] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Cabeçalho do Folio */}
            <div className="flex items-center justify-between border-b border-[#B88A2A]/10 px-5 py-3.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E3C46B]" />
                <h2 id="folio-registry-title" className="font-serif text-sm text-[#F7F1E8] tracking-wide font-light">
                  Folio de Presença
                </h2>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#EAD8B8]/40">
                Registo Atómico
              </span>
            </div>

            {/* Corpo do Folio de Presença */}
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-center">
              {/* ESTADO 1: SUCESSO (Presença Confirmada) */}
              {scanResult?.status === "success" && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-2.5 text-emerald-400 font-mono text-[10px] uppercase tracking-[0.25em]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10">
                      <Check className="h-3 w-3" />
                    </span>
                    <span>Acesso Autorizado</span>
                  </div>

                  {/* Nome do Convidado em Destaque Editorial */}
                  <div className="border-b border-[#B88A2A]/15 pb-5 space-y-1">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#EAD8B8]/50">
                      Convidado de Honra
                    </p>
                    <h3 className="font-serif text-3xl sm:text-4xl text-[#F7F1E8] font-normal tracking-tight leading-tight">
                      {scanResult.guestName || "Convidado Confirmado"}
                    </h3>
                  </div>

                  {/* Especificações de Acomodação em Estilo Folio */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-l border-[#B88A2A]/20 pl-3.5 space-y-0.5">
                      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#EAD8B8]/50">
                        Lotação
                      </p>
                      <p className="font-serif text-lg text-white font-light">
                        {scanResult.partySize} pessoa{scanResult.partySize === 1 ? "" : "s"}
                      </p>
                      {scanResult.plusOnes !== undefined && scanResult.plusOnes > 0 && (
                        <p className="text-[10px] text-[#EAD8B8]/60 font-sans">
                          Titular + {scanResult.plusOnes} acompanhante(s)
                        </p>
                      )}
                    </div>

                    <div className="border-l border-[#B88A2A]/20 pl-3.5 space-y-0.5">
                      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#EAD8B8]/50">
                        Mesa & Lugar
                      </p>
                      <p className="font-serif text-lg text-[#E3C46B] font-light truncate">
                        {scanResult.tableName || "Mesa Livre"}
                      </p>
                      <p className="text-[10px] text-[#EAD8B8]/60 font-sans">
                        {scanResult.seatLabel ? `Lugar ${scanResult.seatLabel}` : "Sem assento numerado"}
                      </p>
                    </div>
                  </div>

                  {scanResult.notes && (
                    <div className="rounded bg-black/40 border border-[#B88A2A]/15 p-3 text-xs text-[#EAD8B8]/80 italic font-serif">
                      <span className="font-mono not-italic text-[8px] uppercase tracking-wider text-[#EAD8B8]/50 block mb-0.5">
                        Nota de Acolhimento:
                      </span>
                      {scanResult.notes}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#B88A2A]/10 text-[9px] font-mono text-[#EAD8B8]/40 uppercase tracking-widest">
                    <span>Validação Única</span>
                    <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              )}

              {/* ESTADO 2: JÁ REGISTADO (Entrada Duplicada) */}
              {scanResult?.status === "already_checked_in" && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-2.5 text-amber-400 font-mono text-[10px] uppercase tracking-[0.25em]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10">
                      <AlertCircle className="h-3 w-3" />
                    </span>
                    <span>Passe Já Utilizado</span>
                  </div>

                  <div className="border-b border-amber-500/20 pb-5 space-y-1">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-amber-300/60">
                      Registo Existente
                    </p>
                    <h3 className="font-serif text-3xl sm:text-4xl text-[#F7F1E8] font-normal tracking-tight leading-tight">
                      {scanResult.guestName || "Convidado"}
                    </h3>
                    <p className="text-xs text-amber-200/70 font-sans pt-1">
                      A entrada correspondente a este passe já foi processada anteriormente.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-l border-amber-500/20 pl-3.5 space-y-0.5">
                      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/60">
                        Lotação
                      </p>
                      <p className="font-serif text-lg text-white font-light">
                        {scanResult.partySize} pessoa(s)
                      </p>
                    </div>

                    <div className="border-l border-amber-500/20 pl-3.5 space-y-0.5">
                      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/60">
                        Mesa
                      </p>
                      <p className="font-serif text-lg text-[#E3C46B] font-light truncate">
                        {scanResult.tableName || "Mesa Livre"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded bg-amber-950/20 border border-amber-500/20 p-3 text-xs text-amber-200/80 font-sans">
                    Confirme a identificação física do convidado caso se trate de uma reentrada.
                  </div>
                </div>
              )}

              {/* ESTADO 3: ERRO (Não Autorizado) */}
              {scanResult?.status === "error" && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-2.5 text-rose-400 font-mono text-[10px] uppercase tracking-[0.25em]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/10">
                      <X className="h-3 w-3" />
                    </span>
                    <span>Acesso Não Concedido</span>
                  </div>

                  <div className="border-b border-rose-500/20 pb-5 space-y-2">
                    <h3 className="font-serif text-2xl text-[#F7F1E8] font-light leading-snug">
                      Passe Não Reconhecido
                    </h3>
                    <p className="text-xs text-rose-200/80 font-sans leading-relaxed">
                      {scanResult.message}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs text-[#EAD8B8]/60 font-sans">
                      Em caso de anomalia óptica, recorra à validação manual abaixo ou consulte a lista geral no painel de convidados.
                    </p>
                    <Link
                      href={`/admin/events/${event.id}?tab=checkin`}
                      className="inline-flex items-center gap-1.5 text-xs text-[#E3C46B] hover:text-white transition-colors underline underline-offset-4"
                    >
                      <span>Abrir Painel de Check-in Manual</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* ESTADO 4: STANDBY (À Espera do Primeiro Convidado) */}
              {!scanResult && (
                <div className="py-12 text-center space-y-4">
                  <div className="h-10 w-10 mx-auto rounded-full border border-[#B88A2A]/20 flex items-center justify-center text-[#E3C46B]/60">
                    <Lock className="h-4 w-4 stroke-[1.25]" />
                  </div>

                  <div className="space-y-1.5 max-w-xs mx-auto">
                    <h3 className="font-serif text-xl text-[#F7F1E8] font-light">
                      À Espera do Convidado
                    </h3>
                    <p className="text-xs text-[#EAD8B8]/50 font-sans leading-relaxed">
                      Os dados da credencial, assento e lotação serão apresentados com distinção após a primeira leitura.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé do Folio */}
            <div className="border-t border-[#B88A2A]/10 px-5 py-3 text-[9px] font-mono uppercase tracking-[0.2em] text-[#EAD8B8]/40 flex items-center justify-between bg-[#0A0908]">
              <span>Protocolo Oficial</span>
              <span>Protecção em Profundidade</span>
            </div>
          </section>
        </main>

        {/* ─── Gaveta de Contingência Arquitectónica (Validação Manual) ─── */}
        <section
          aria-labelledby="contingency-title"
          className="rounded-xl border border-[#B88A2A]/20 bg-[#0C0B0A] p-5 shadow-lg space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#B88A2A]/10 pb-3">
            <div className="space-y-0.5">
              <h3 id="contingency-title" className="font-serif text-base text-[#F7F1E8] font-light">
                Validação Manual de Contingência
              </h3>
              <p className="text-xs text-[#EAD8B8]/50 font-sans">
                Para situações em que o ecrã do telemóvel do convidado esteja danificado ou com reflexos impeditivos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsManualExpanded((prev) => !prev)}
              className="self-start sm:self-auto text-xs font-mono text-[#E3C46B] hover:text-white transition-colors"
            >
              {isManualExpanded ? "Ocultar Formulário" : "Introduzir Código"}
            </button>
          </div>

          {isManualExpanded && (
            <form onSubmit={handleManualSubmit} className="space-y-3 pt-1 animate-in fade-in duration-200">
              <label
                htmlFor="manual-token-field"
                className="block font-mono text-[9px] uppercase tracking-[0.2em] text-[#EAD8B8]/60"
              >
                Código ou URL Canónico do Passe
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    id="manual-token-field"
                    type="text"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="Cole ou digite o código de 32 caracteres…"
                    className="min-h-[46px] w-full rounded border border-[#B88A2A]/30 bg-black/50 px-4 py-2 text-xs font-mono text-white placeholder:text-white/20 focus:border-[#E3C46B] focus:outline-none transition-colors"
                  />
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B88A2A]/40 pointer-events-none" />
                </div>
                <button
                  type="submit"
                  disabled={isProcessing || !manualToken.trim()}
                  className="min-h-[46px] rounded border border-[#E3C46B]/60 bg-[#B88A2A]/20 px-6 py-2.5 text-xs font-serif tracking-widest uppercase text-[#F7F1E8] hover:border-[#E3C46B] hover:text-white hover:bg-[#B88A2A]/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Confirmar Entrada
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      {/* ─── Assinatura de Marca e Alta-Costura ─── */}
      <footer className="mt-8 border-t border-[#B88A2A]/10 pt-4 text-center font-mono text-[9px] uppercase tracking-[0.25em] text-[#EAD8B8]/30">
        HAXR Signature · Alta-Costura Digital — Uma leitura · Uma validação atómica
      </footer>
    </div>
  );
}
