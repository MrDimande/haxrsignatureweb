"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import jsQR from "jsqr";
import { extractQrToken } from "@/lib/events/qr-token";

import {
  ArrowLeft,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  LockKeyhole,
  RefreshCw,
} from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";
import type { ManagedEvent, EventStats } from "@/lib/events/types";

// Compatibilidade com os testes e consumidores existentes do scanner.
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
  const [scanFeedback, setScanFeedback] = useState("Active a câmara para iniciar a leitura óptica contínua.");
  const [nativeDetectorAvailable, setNativeDetectorAvailable] = useState(false);
  const [scannerDiagnostics, setScannerDiagnostics] = useState({
    frames: 0,
    width: 0,
    height: 0,
    readyState: 0,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null);
  const detectorBusyRef = useRef(false);
  const lastNativeAttemptRef = useRef(0);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Travamento estrito de concorrência e debouncing de frames
  const isProcessingRef = useRef(false);
  const lastScannedTokenRef = useRef<string>("");
  const lastScanTimestampRef = useRef<number>(0);
  const framesAnalysedRef = useRef(0);
  const cameraStartedAtRef = useRef(0);
  const lastDiagnosticsUpdateRef = useRef(0);
  const lastDecodedAtRef = useRef(0);

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
        const message = "O QR foi lido, mas não contém um passe digital HAXR válido.";
        setScanResult({ status: "error", message });
        setScanFeedback(message);
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
      setScanFeedback("Código detectado — a validar o passe no servidor…");

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
              ? "QR descodificado, mas a sessão de recepção não está autorizada. Inicie sessão novamente."
              : res.status === 404
                ? "QR descodificado, mas o token não foi encontrado neste evento/ambiente. Confirme se o passe e o scanner pertencem ao mesmo Preview."
                : res.status === 429
                  ? "QR descodificado, mas o limite temporário de validações foi atingido. Aguarde alguns segundos."
                  : res.status >= 500
                    ? `QR descodificado, mas o servidor de check-in falhou (HTTP ${res.status}).`
                    : `QR descodificado, mas a API recusou o passe (HTTP ${res.status}${data.error ? `, ${String(data.error)}` : ""}).`);
          setScanResult({ status: "error", message });
          setScanFeedback(message);
          playBeep("error");
          return;
        }

        if (data.alreadyCheckedIn) {
          setScanFeedback("Passe reconhecido — esta entrada já estava registada anteriormente.");
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
          setScanFeedback("Entrada validada com sucesso. Pode aproximar o próximo passe.");
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
        const message = "QR descodificado, mas não foi possível concluir a comunicação com o servidor.";
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

  // Descodificação por imagem (jsQR) em cada frame e recorte central de recurso.
  const scanVideoFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || isProcessingRef.current) return;

    const now = Date.now();
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (video.readyState < 2 || width <= 0 || height <= 0) {
      if (
        cameraStartedAtRef.current > 0 &&
        now - lastDiagnosticsUpdateRef.current >= 1000
      ) {
        lastDiagnosticsUpdateRef.current = now;
        setScannerDiagnostics({
          frames: framesAnalysedRef.current,
          width,
          height,
          readyState: video.readyState,
        });
        if (now - cameraStartedAtRef.current > 1500 && now - lastDecodedAtRef.current > 1500) {
          setScanFeedback(
            `Câmara aberta, mas sem frames prontos para análise (estado ${video.readyState}; imagem ${width}×${height}).`
          );
        }
      }
      return;
    }

    framesAnalysedRef.current += 1;
    if (now - lastDiagnosticsUpdateRef.current >= 1000) {
      lastDiagnosticsUpdateRef.current = now;
      setScannerDiagnostics({
        frames: framesAnalysedRef.current,
        width,
        height,
        readyState: video.readyState,
      });

      const elapsed = now - cameraStartedAtRef.current;
      const sinceDecoded = lastDecodedAtRef.current
        ? now - lastDecodedAtRef.current
        : Number.POSITIVE_INFINITY;
      if (!isProcessingRef.current && elapsed > 2500 && sinceDecoded > 3500) {
        setScanFeedback(
          `A analisar a imagem da câmara (${width}×${height}; ${framesAnalysedRef.current} frames). Aproxime o passe digital.`
        );
      } else if (!isProcessingRef.current && lastDecodedAtRef.current && sinceDecoded > 5000) {
        setScanFeedback(
          `À procura do próximo passe — ${framesAnalysedRef.current} frames analisados (${width}×${height}).`
        );
      }
    }

    if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const fullScale = Math.min(1, 1440 / Math.max(width, height));
    const fullWidth = Math.max(1, Math.round(width * fullScale));
    const fullHeight = Math.max(1, Math.round(height * fullScale));
    if (canvas.width !== fullWidth || canvas.height !== fullHeight) {
      canvas.width = fullWidth;
      canvas.height = fullHeight;
    }

    try {
      ctx.drawImage(video, 0, 0, fullWidth, fullHeight);
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let decoded = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });

      // O passe é normalmente apresentado ao centro. A cada terceiro frame,
      // tentamos ainda um recorte central ampliado se a leitura do frame inteiro falhar.
      if (!decoded && framesAnalysedRef.current % 3 === 0) {
        const cropWidth = Math.max(1, Math.round(width * 0.72));
        const cropHeight = Math.max(1, Math.round(height * 0.72));
        const sourceX = Math.round((width - cropWidth) / 2);
        const sourceY = Math.round((height - cropHeight) / 2);
        const cropScale = Math.min(1.5, 1440 / Math.max(cropWidth, cropHeight));

        if (!cropCanvasRef.current) {
          cropCanvasRef.current = document.createElement("canvas");
        }
        const cropCanvas = cropCanvasRef.current;
        const cropCtx = cropCanvas.getContext("2d", { willReadFrequently: true });
        if (cropCtx) {
          const cropTargetWidth = Math.max(1, Math.round(cropWidth * cropScale));
          const cropTargetHeight = Math.max(1, Math.round(cropHeight * cropScale));
          if (
            cropCanvas.width !== cropTargetWidth ||
            cropCanvas.height !== cropTargetHeight
          ) {
            cropCanvas.width = cropTargetWidth;
            cropCanvas.height = cropTargetHeight;
          }
          cropCtx.drawImage(
            video,
            sourceX,
            sourceY,
            cropWidth,
            cropHeight,
            0,
            0,
            cropTargetWidth,
            cropTargetHeight
          );
          imageData = cropCtx.getImageData(0, 0, cropCanvas.width, cropCanvas.height);
          decoded = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });
        }
      }

      if (decoded?.data) {
        lastDecodedAtRef.current = Date.now();
        setScanFeedback("QR descodificado por imagem — a validar o passe…");
        void handleProcessCheckin(decoded.data);
      }
    } catch (error) {
      console.error("[Scanner] Erro ao analisar frame QR:", error);
      setScanFeedback("A câmara está activa, mas ocorreu um erro ao analisar a imagem.");
    }
  }, [handleProcessCheckin]);

  // Leitor nativo opcional em paralelo.
  const runNativeDetection = useCallback(() => {
    const video = videoRef.current;
    const detector = detectorRef.current;
    const now = Date.now();

    if (
      !video ||
      !detector ||
      !streamRef.current ||
      isProcessingRef.current ||
      detectorBusyRef.current ||
      now - lastNativeAttemptRef.current < 700
    ) {
      return;
    }

    lastNativeAttemptRef.current = now;
    detectorBusyRef.current = true;
    void detector
      .detect(video)
      .then((codes) => {
        const rawValue = codes.find(
          (code) => typeof code.rawValue === "string" && code.rawValue.trim().length > 0
        )?.rawValue;
        if (!rawValue || !streamRef.current || isProcessingRef.current) return;
        lastDecodedAtRef.current = Date.now();
        setScanFeedback("QR descodificado pelo leitor nativo — a validar o passe…");
        void handleProcessCheckin(rawValue);
      })
      .catch(() => {
        // O leitor nativo varia por navegador; jsQR mantém-se activo como leitor principal.
      })
      .finally(() => {
        detectorBusyRef.current = false;
      });
  }, [handleProcessCheckin]);

  const scanTick = useCallback(() => {
    scanVideoFrame();
    runNativeDetection();
  }, [scanVideoFrame, runNativeDetection]);

  // Iniciar a câmara e ligar a leitura QR contínua.
  const startCamera = async () => {
    setCameraError(null);
    setScanFeedback("A solicitar autorização de acesso à câmara…");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Câmara não suportada neste navegador ou contexto.");
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
      const video = videoRef.current;
      if (!video) throw new Error("O elemento de vídeo do scanner não está disponível.");

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      detectorRef.current = null;
      detectorBusyRef.current = false;
      setNativeDetectorAvailable(false);
      const win =
        typeof window !== "undefined"
          ? (window as unknown as WindowWithWebkitAudio)
          : null;
      if (win?.BarcodeDetector) {
        try {
          detectorRef.current = new win.BarcodeDetector({ formats: ["qr_code"] });
          setNativeDetectorAvailable(true);
        } catch {
          detectorRef.current = null;
        }
      }

      framesAnalysedRef.current = 0;
      cameraStartedAtRef.current = Date.now();
      lastDiagnosticsUpdateRef.current = 0;
      lastDecodedAtRef.current = 0;
      lastNativeAttemptRef.current = 0;
      setScannerDiagnostics({
        frames: 0,
        width: video.videoWidth,
        height: video.videoHeight,
        readyState: video.readyState,
      });
      setIsCameraActive(true);
      setScanFeedback("Câmara activa — aponte para o passe digital do convidado.");
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = setInterval(scanTick, 180);
    } catch (err: unknown) {
      const isError = err instanceof Error;
      const errorName = isError ? err.name : "";
      console.error("[Scanner] Erro ao iniciar leitura QR:", err);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      const message =
        errorName === "NotAllowedError" || errorName === "PermissionDeniedError"
          ? "Permissão da câmara recusada. Autorize o acesso no navegador ou utilize o código manual."
          : errorName === "NotFoundError"
            ? "Não foi encontrada uma câmara neste dispositivo."
            : errorName === "NotReadableError" || errorName === "AbortError"
              ? "A câmara está ocupada por outra aplicação. Feche-a e tente novamente."
              : "Não foi possível iniciar a câmara. Utilize o código manual como alternativa.";
      detectorRef.current = null;
      setNativeDetectorAvailable(false);
      setCameraError(message);
      setScanFeedback(message);
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
    detectorBusyRef.current = false;
    setNativeDetectorAvailable(false);
    setIsCameraActive(false);
    setScannerDiagnostics({
      frames: framesAnalysedRef.current,
      width: 0,
      height: 0,
      readyState: 0,
    });
    setScanFeedback("Leitura pausada. Active a câmara para voltar a procurar códigos QR.");
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
    <div className="relative isolate space-y-6 pb-6 text-white min-h-[calc(100vh-2rem)] flex flex-col justify-between">
      {/* ─── Fundo Ambiente Alta-Costura ─── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-10 -z-10 h-[520px] overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(184,138,42,0.12),transparent_70%)]" />
        <div className="absolute right-0 top-12 h-80 w-80 translate-x-1/3 rounded-full border border-brand-champagne/[0.05]" />
        <div className="absolute right-12 top-24 h-64 w-64 translate-x-1/3 rounded-full border border-brand-champagne/[0.04]" />
      </div>

      <div className="space-y-6">
        {/* ─── Navegação Operacional Superior ─── */}
        <nav
          aria-label="Navegação da recepção"
          className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-champagne/15 pb-4 text-[10px] font-mono tracking-widest uppercase"
        >
          <div className="flex flex-wrap items-center gap-2 text-brand-champagne/70">
            <Link
              href="/admin/events/checkin"
              className="inline-flex items-center gap-1.5 text-brand-champagne transition-colors hover:text-white"
              title="Voltar ao portal de eventos da recepção"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Recepção Geral</span>
            </Link>
            <span className="text-brand-champagne/30">/</span>
            <Link
              href={`/admin/events/${event.id}?tab=checkin`}
              className="text-brand-champagne/70 transition-colors hover:text-white"
              title="Abrir painel operacional deste evento"
            >
              Painel do Evento
            </Link>
            <span className="text-brand-champagne/30">/</span>
            <span className="text-white font-medium">Scanner Óptico</span>
          </div>

          {/* Indicador de Estado Real do Scanner */}
          <div
            className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border text-[9px] tracking-[0.2em] transition-colors ${
              isCameraActive
                ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                : "border-brand-champagne/20 bg-black/40 text-brand-champagne/60"
            }`}
            role="status"
          >
            <span className="relative flex h-2 w-2">
              {isCameraActive && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  isCameraActive ? "bg-emerald-400" : "bg-brand-champagne/40"
                }`}
              />
            </span>
            <span>{isCameraActive ? "Leitor Óptico Activo" : "Câmara Inactiva · Em Espera"}</span>
          </div>
        </nav>

        {/* ─── Cabeçalho Editorial do Evento ─── */}
        <header className="relative overflow-hidden rounded-2xl border border-brand-champagne/20 bg-gradient-to-br from-[#18140F] via-[#0E0C0A] to-[#14100C] p-6 sm:p-8 lg:p-10 shadow-2xl">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl"
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <BrandLogo variant="admin" priority />
                <span className="h-3.5 w-px bg-brand-champagne/30" />
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-brand-champagne/70">
                  Alta-Costura Digital · Controlo de Acessos
                </span>
              </div>

              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-brand-gold-light/80 mb-1 flex items-center gap-2">
                  <span className="h-px w-6 bg-brand-gold" />
                  Posto de Recepção
                </p>
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-light text-[#F7F1E8] tracking-tight">
                  {event.name}
                </h1>
                <p className="text-xs sm:text-sm text-[#EAD8B8]/65 max-w-xl mt-1.5 leading-relaxed font-sans">
                  Validação contínua e atómica com prevenção estrita de entradas duplicadas.
                </p>
              </div>
            </div>

            {/* Fita de Métricas Secundárias */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="rounded-xl border border-brand-champagne/15 bg-black/40 px-4 py-3 text-center sm:text-left">
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">Entradas</p>
                <p className="mt-1 font-display text-xl sm:text-2xl font-light tabular-nums text-brand-champagne">
                  {stats.checkedIn}
                  <span className="text-xs text-white/35 font-sans ml-1">/ {stats.confirmed}</span>
                </p>
                <p className="text-[9px] text-white/35 font-mono">confirmados</p>
              </div>

              <div className="rounded-xl border border-brand-champagne/15 bg-black/40 px-4 py-3 text-center sm:text-left min-w-[100px]">
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">Presença</p>
                <p className="mt-1 font-display text-xl sm:text-2xl font-light tabular-nums text-brand-gold-light">
                  {pct}%
                </p>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-brand-gold transition-all duration-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-brand-champagne/15 bg-black/40 px-4 py-3 text-center sm:text-left">
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">Segurança</p>
                <p className="mt-1 flex items-center justify-center sm:justify-start gap-1.5 font-sans text-xs sm:text-sm text-brand-champagne">
                  <LockKeyhole className="h-3.5 w-3.5 text-brand-gold-light shrink-0" />
                  <span>Atómica</span>
                </p>
                <p className="text-[9px] text-white/35 font-mono">validação servidor</p>
              </div>
            </div>
          </div>
        </header>

        {/* ─── Área Principal de Recepção ─── */}
        <main className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Coluna Esquerda: Câmara & Leitura Óptica (Hero) */}
          <section
            aria-labelledby="scanner-heading"
            className="lg:col-span-7 xl:col-span-7 flex flex-col rounded-2xl border border-brand-champagne/20 bg-[#0E0C0A] overflow-hidden shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-brand-champagne/10 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-brand-champagne/30 bg-brand-champagne/10 text-brand-champagne font-mono text-[10px]">
                  01
                </span>
                <div>
                  <h2 id="scanner-heading" className="font-display text-lg font-light text-[#F7F1E8]">
                    Leitor Óptico
                  </h2>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-brand-champagne/50">
                    Descodificação contínua via câmara
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block rounded-md border border-brand-champagne/15 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-brand-champagne/60">
                  jsQR Híbrido + Nativo
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
              {/* Viewport da Câmara */}
              <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden rounded-xl border border-brand-champagne/25 bg-[#050403] shadow-inner">
                {/* Vídeo do Feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 h-full w-full object-cover ${
                    isCameraActive ? "block" : "hidden"
                  }`}
                />

                {/* Retículo de Precisão Alta-Costura (Overlay sobre a câmara activa) */}
                {isCameraActive && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  >
                    {/* Moldura de Mira */}
                    <div className="relative flex aspect-square w-[min(70%,18rem)] items-center justify-center">
                      {/* Cantos Dourados Finos */}
                      <span className="absolute -left-1 -top-1 h-8 w-8 border-l-2 border-t-2 border-[#E3C46B]" />
                      <span className="absolute -right-1 -top-1 h-8 w-8 border-r-2 border-t-2 border-[#E3C46B]" />
                      <span className="absolute -bottom-1 -left-1 h-8 w-8 border-b-2 border-l-2 border-[#E3C46B]" />
                      <span className="absolute -bottom-1 -right-1 h-8 w-8 border-b-2 border-r-2 border-[#E3C46B]" />

                      {/* Mira de Alinhamento Central Discreta */}
                      <div className="h-1.5 w-1.5 rounded-full bg-brand-gold-light/40" />

                      {/* Linha de Varredura Sutil */}
                      <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-brand-gold-light/80 to-transparent animate-pulse motion-reduce:hidden" />

                      {/* Estado de Processamento Ativo */}
                      {isProcessing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-black/75 backdrop-blur-sm space-y-2">
                          <RefreshCw className="h-6 w-6 text-brand-gold-light animate-spin" />
                          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand-champagne">
                            A validar passe…
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Estado Standby (Câmara Desligada) */}
                {!isCameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-black/40 to-black/80">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-champagne/25 bg-brand-champagne/5 text-brand-champagne shadow-lg">
                      <CameraOff className="h-7 w-7" strokeWidth={1.3} />
                    </div>
                    <h3 className="font-display text-2xl font-light text-[#F7F1E8]">
                      Pronto para receber.
                    </h3>
                    <p className="mt-2 max-w-sm text-xs leading-relaxed text-[#EAD8B8]/70 font-sans">
                      Active a câmara e aponte para o passe digital apresentado pelo convidado no seu telemóvel.
                    </p>
                    <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.2em] text-brand-gold-light/70 flex items-center gap-2">
                      <span className="h-px w-4 bg-brand-gold/50" />
                      Um passe · Uma leitura instantânea
                      <span className="h-px w-4 bg-brand-gold/50" />
                    </p>

                    {cameraError && (
                      <div
                        role="alert"
                        className="mt-4 max-w-md rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-2.5 text-left text-xs leading-5 text-red-200"
                      >
                        <p className="font-medium text-red-300">Falha ao aceder à câmara:</p>
                        <p className="mt-0.5">{cameraError}</p>
                      </div>
                    )}

                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl border border-brand-gold-light bg-brand-champagne px-7 py-3 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#12100E] shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-gold-light/50"
                      >
                        <Camera className="h-4 w-4" />
                        Activar Câmara Agora
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Faixa de Mensagem e Telemetria em Tempo Real */}
              <div
                role="status"
                aria-live="polite"
                className="rounded-xl border border-brand-champagne/15 bg-black/40 px-4 py-3"
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                      isCameraActive ? "bg-emerald-400" : "bg-brand-champagne/40"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#EAD8B8] leading-relaxed font-sans">
                      {scanFeedback}
                    </p>
                    {isCameraActive && (
                      <p className="mt-1 font-mono text-[9px] text-white/40 tracking-wider">
                        {scannerDiagnostics.width > 0 && scannerDiagnostics.height > 0
                          ? `${scannerDiagnostics.frames} frames analisados · ${scannerDiagnostics.width}×${scannerDiagnostics.height} · jsQR${
                              nativeDetectorAvailable ? " + leitor nativo" : ""
                            } · estado ${scannerDiagnostics.readyState}`
                          : `A aguardar sinal do sensor de vídeo · estado ${scannerDiagnostics.readyState}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Barra de Controlo Operacional */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                {isCameraActive ? (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="w-full sm:w-auto inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 px-6 py-2.5 font-mono text-xs font-medium uppercase tracking-[0.14em] text-red-200 transition-colors hover:border-red-500/60 hover:bg-red-950/40 focus:outline-none focus:ring-2 focus:ring-red-400/40"
                  >
                    <CameraOff className="h-4 w-4" />
                    Desactivar Câmara
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="w-full sm:w-auto inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-brand-champagne/40 bg-brand-champagne/10 px-6 py-2.5 font-mono text-xs font-medium uppercase tracking-[0.14em] text-brand-champagne transition-colors hover:border-brand-champagne hover:bg-brand-champagne/20 focus:outline-none focus:ring-2 focus:ring-brand-champagne/40"
                  >
                    <Camera className="h-4 w-4" />
                    Activar Câmara
                  </button>
                )}

                <a
                  href="#manual-contingency"
                  className="w-full sm:w-auto sm:ml-auto inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/50 transition-colors hover:border-brand-champagne/30 hover:text-brand-champagne"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-brand-gold" />
                  Validação de Contingência
                </a>
              </div>
            </div>
          </section>

          {/* Coluna Direita: Registo de Presença & Contingência */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col space-y-6">
            {/* Cartão de Resultado da Leitura (Live Results) */}
            <section
              aria-labelledby="result-heading"
              aria-live="polite"
              className="flex-1 flex flex-col rounded-2xl border border-brand-champagne/20 bg-[#0E0C0A] overflow-hidden shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-brand-champagne/10 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md border border-brand-champagne/30 bg-brand-champagne/10 text-brand-champagne font-mono text-[10px]">
                    02
                  </span>
                  <div>
                    <h2 id="result-heading" className="font-display text-lg font-light text-[#F7F1E8]">
                      Registo de Presença
                    </h2>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-brand-champagne/50">
                      Resultado da última validação
                    </p>
                  </div>
                </div>

                <span
                  className={`font-mono text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    scanResult?.status === "success"
                      ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                      : scanResult?.status === "already_checked_in"
                      ? "border-amber-500/40 bg-amber-950/40 text-amber-300"
                      : scanResult?.status === "error"
                      ? "border-red-500/40 bg-red-950/40 text-red-300"
                      : "border-white/10 bg-black/40 text-white/40"
                  }`}
                >
                  {isProcessing
                    ? "A validar…"
                    : scanResult?.status === "success"
                    ? "Entrada Confirmada"
                    : scanResult?.status === "already_checked_in"
                    ? "Passe Já Registado"
                    : scanResult?.status === "error"
                    ? "Validação Recusada"
                    : "Em Espera"}
                </span>
              </div>

              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-center">
                {/* ESTADO 1: SUCESSO */}
                {scanResult?.status === "success" && (
                  <div className="rounded-xl border border-emerald-500/40 bg-gradient-to-br from-[#062016] via-[#092B1F] to-[#04150E] p-6 text-emerald-50 shadow-2xl space-y-5 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-400/10 shadow-lg">
                        <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                      </div>
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-emerald-300/80">
                          Acesso Autorizado
                        </p>
                        <p className="font-display text-lg font-light text-emerald-100">
                          {scanResult.message}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-emerald-500/20 pt-4">
                      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-emerald-300/60">
                        Nome do Convidado
                      </p>
                      <p className="font-display text-2xl sm:text-3xl font-light text-white tracking-tight mt-0.5">
                        {scanResult.guestName || "Convidado Confirmado"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-emerald-500/20 pt-4">
                      <div className="rounded-lg bg-black/20 p-3 border border-emerald-500/15">
                        <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-emerald-300/60">
                          Lotação Autorizada
                        </p>
                        <p className="font-display text-lg font-light text-white mt-0.5">
                          {scanResult.partySize} pessoa(s)
                        </p>
                        {scanResult.plusOnes !== undefined && scanResult.plusOnes > 0 && (
                          <p className="text-[10px] text-emerald-200/60 mt-0.5">
                            Titular + {scanResult.plusOnes} acompanhante(s)
                          </p>
                        )}
                      </div>

                      <div className="rounded-lg bg-black/20 p-3 border border-emerald-500/15">
                        <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-emerald-300/60">
                          Mesa & Lugar
                        </p>
                        <p className="font-display text-lg font-light text-white mt-0.5 truncate">
                          {scanResult.tableName || "Geral"}
                        </p>
                        <p className="text-[10px] text-emerald-200/60 mt-0.5">
                          {scanResult.seatLabel ? `Lugar ${scanResult.seatLabel}` : "Sem assento fixo"}
                        </p>
                      </div>
                    </div>

                    {scanResult.notes && (
                      <div className="rounded-lg bg-black/20 p-3 border border-emerald-500/15">
                        <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-emerald-300/60">
                          Observações Especiais
                        </p>
                        <p className="text-xs italic text-emerald-100/80 mt-1 leading-relaxed">
                          {scanResult.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-emerald-500/20 pt-3 text-[9px] font-mono text-emerald-300/60">
                      <span>Validação única no servidor</span>
                      <span>Presença registada</span>
                    </div>
                  </div>
                )}

                {/* ESTADO 2: JÁ REGISTADO (DUPLICADO) */}
                {scanResult?.status === "already_checked_in" && (
                  <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-[#261808] via-[#33200B] to-[#1A1005] p-6 text-amber-50 shadow-2xl space-y-5 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-400/10 shadow-lg">
                        <AlertTriangle className="h-6 w-6 text-amber-300" />
                      </div>
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-amber-300/80">
                          Atenção · Entrada Duplicada
                        </p>
                        <p className="font-display text-lg font-light text-amber-100">
                          {scanResult.message}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-amber-500/20 pt-4">
                      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/60">
                        Nome do Titular
                      </p>
                      <p className="font-display text-2xl sm:text-3xl font-light text-white tracking-tight mt-0.5">
                        {scanResult.guestName || "Convidado"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-black/30 p-3 border border-amber-500/20 text-xs text-amber-200/80 leading-relaxed font-sans">
                      Este passe digital já foi utilizado anteriormente para registar a entrada. Confirme a identidade física antes de autorizar uma nova passagem.
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-amber-500/20 pt-4">
                      <div className="rounded-lg bg-black/20 p-3 border border-amber-500/15">
                        <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-amber-300/60">
                          Lotação Prevista
                        </p>
                        <p className="font-display text-base font-light text-white mt-0.5">
                          {scanResult.partySize} pessoa(s)
                        </p>
                      </div>

                      <div className="rounded-lg bg-black/20 p-3 border border-amber-500/15">
                        <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-amber-300/60">
                          Mesa Atribuída
                        </p>
                        <p className="font-display text-base font-light text-white mt-0.5 truncate">
                          {scanResult.tableName || "Geral"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ESTADO 3: ERRO */}
                {scanResult?.status === "error" && (
                  <div className="rounded-xl border border-red-500/40 bg-gradient-to-br from-[#24080E] via-[#330B14] to-[#1A050A] p-6 text-red-50 shadow-2xl space-y-5 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-400/40 bg-red-400/10 shadow-lg">
                        <XCircle className="h-6 w-6 text-red-300" />
                      </div>
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-red-300/80">
                          Acesso Recusado
                        </p>
                        <p className="font-display text-lg font-light text-red-100">
                          Não foi possível validar o passe
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-red-500/20 pt-4">
                      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-red-300/60">
                        Motivo / Diagnóstico
                      </p>
                      <p className="text-xs sm:text-sm text-red-200/90 leading-relaxed font-sans mt-1">
                        {scanResult.message}
                      </p>
                    </div>

                    <div className="rounded-lg bg-black/30 p-3 border border-red-500/20 text-xs text-red-200/70 leading-relaxed font-sans">
                      Dica: Verifique se o passe pertence a este evento ou recorra à validação manual abaixo caso o código tenha sido danificado.
                    </div>
                  </div>
                )}

                {/* ESTADO 4: STANDBY / EM ESPERA */}
                {!scanResult && (
                  <div className="py-12 px-4 text-center space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-champagne/20 bg-brand-champagne/5 text-brand-champagne/70 shadow-lg">
                      <ShieldCheck className="h-7 w-7" strokeWidth={1.3} />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-light text-[#F7F1E8]">
                        À espera do primeiro passe.
                      </h3>
                      <p className="mt-1.5 max-w-xs mx-auto text-xs text-[#EAD8B8]/60 leading-relaxed font-sans">
                        Aproxime o código QR do passe digital da câmara para ler e confirmar a presença em tempo real.
                      </p>
                    </div>
                    <div className="mx-auto flex max-w-[200px] items-center gap-3 pt-2">
                      <span className="h-px flex-1 bg-brand-champagne/20" />
                      <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-brand-champagne/50">
                        Pronto
                      </span>
                      <span className="h-px flex-1 bg-brand-champagne/20" />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-brand-champagne/10 px-5 py-3 font-mono text-[8px] uppercase tracking-[0.16em] text-white/30 flex items-center justify-between">
                <span>HAXR Signature · Terminal de Entrada</span>
                <span>Validação Atómica</span>
              </div>
            </section>

            {/* Secção de Contingência: Validação Manual */}
            <section
              id="manual-contingency"
              aria-labelledby="contingency-heading"
              className="rounded-2xl border border-brand-champagne/20 bg-[#0E0C0A] p-5 sm:p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center gap-2.5 border-b border-brand-champagne/10 pb-3">
                <span className="flex h-5 w-5 items-center justify-center rounded border border-brand-champagne/30 bg-brand-champagne/10 text-brand-champagne font-mono text-[9px]">
                  03
                </span>
                <div>
                  <h3 id="contingency-heading" className="font-display text-base font-light text-[#F7F1E8]">
                    Validação Manual de Contingência
                  </h3>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-brand-champagne/50">
                    Introduza o código do passe manualmente
                  </p>
                </div>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-3">
                <label
                  htmlFor="manual-pass-token"
                  className="block font-mono text-[9px] uppercase tracking-[0.16em] text-white/50"
                >
                  Código ou URL do Passe Digital
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    id="manual-pass-token"
                    type="text"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="Cole ou escreva o código do passe…"
                    className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder:text-white/25 outline-none transition-colors focus:border-brand-champagne/70 focus:ring-1 focus:ring-brand-champagne/40"
                  />
                  <button
                    type="submit"
                    disabled={isProcessing || !manualToken.trim()}
                    className="min-h-[44px] rounded-xl border border-brand-champagne/30 bg-white/[0.04] px-5 py-2 font-mono text-xs uppercase tracking-[0.14em] text-brand-champagne transition-all hover:border-brand-champagne hover:bg-brand-champagne/10 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Validar Código
                  </button>
                </div>
              </form>
            </section>
          </div>
        </main>
      </div>

      {/* ─── Rodapé Discreto ─── */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-brand-champagne/10 pt-4 text-[9px] font-mono uppercase tracking-[0.18em] text-white/30">
        <span>HAXR Signature · Alta-Costura Digital</span>
        <span>Um passe · Uma leitura · Uma confirmação</span>
      </footer>
    </div>
  );
}
