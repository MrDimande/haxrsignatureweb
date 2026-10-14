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
} from "lucide-react";
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
  const [scanFeedback, setScanFeedback] = useState("Active a câmara para iniciar a leitura automática.");
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
          setScanFeedback("Passe reconhecido — esta entrada já estava registada.");
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
          setScanFeedback("Entrada validada. Pode aproximar o próximo passe.");
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
  // Não dependemos de video.paused: alguns navegadores reportam esse estado de forma
  // transitória mesmo quando o stream continua a fornecer frames.
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
          `A analisar a imagem da câmara (${width}×${height}; ${framesAnalysedRef.current} frames). Ainda não foi descodificado nenhum QR.`
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

  // Leitor nativo opcional em paralelo. Se detect() estiver lento ou falhar, o jsQR
  // continua a analisar os frames no mesmo ciclo, sem esperar pela API nativa.
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
    setScanFeedback("A solicitar acesso à câmara…");
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
      setScanFeedback("Câmara activa — a inicializar a análise contínua dos frames…");
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
    <div className="relative isolate space-y-7 pb-4 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-8 -z-10 h-[460px] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(184,138,42,0.13),transparent_65%)]" />
        <div className="absolute right-0 top-8 h-72 w-72 translate-x-1/3 rounded-full border border-brand-champagne/[0.06]" />
        <div className="absolute right-10 top-16 h-56 w-56 translate-x-1/3 rounded-full border border-brand-champagne/[0.05]" />
      </div>

      <nav aria-label="Navegação do scanner" className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-champagne/10 pb-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-mono uppercase tracking-[0.2em]">
          <Link href="/admin/events/checkin" className="inline-flex items-center gap-2 text-brand-champagne/70 transition-colors hover:text-brand-champagne" title="Voltar ao portal multi-evento de recepção">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Recepção geral</span>
          </Link>
          <span className="text-brand-champagne/25">/</span>
          <Link href={`/admin/events/${event.id}?tab=checkin`} className="text-brand-champagne/55 transition-colors hover:text-brand-champagne" title="Abrir painel de check-in deste evento">
            Painel do evento
          </Link>
          <span className="text-brand-champagne/25">/</span>
          <span className="text-brand-champagne">Scanner</span>
        </div>
        <div className="inline-flex items-center gap-2 border border-brand-champagne/15 bg-black/20 px-3 py-2 text-[9px] font-mono uppercase tracking-[0.18em] text-brand-champagne/80">
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${isCameraActive ? "animate-ping bg-emerald-400" : "bg-brand-champagne/30"}`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${isCameraActive ? "bg-emerald-400" : "bg-brand-champagne/50"}`} />
          </span>
          {isCameraActive ? "Leitor óptico activo" : "Recepção protegida"}
        </div>
      </nav>

      <header className="relative overflow-hidden border border-brand-champagne/20 bg-gradient-to-br from-[#19140E] via-[#0C0B09] to-[#17120D]">
        <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-1/3 border-l border-brand-champagne/[0.07] md:block">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(184,138,42,0.1),transparent_68%)]" />
          <div className="absolute right-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border border-brand-champagne/[0.09]" />
          <div className="absolute right-[4.35rem] top-1/2 h-32 w-32 -translate-y-1/2 rounded-full border border-brand-champagne/[0.08]" />
          <div className="absolute right-[7.2rem] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-brand-champagne/30" />
        </div>
        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-brand-champagne/30 text-brand-champagne">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.4} />
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.32em] text-brand-champagne/65">HAXR Signature</p>
              <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.2em] text-white/35">Hospitalidade · Controlo de acessos</p>
            </div>
          </div>

          <div className="max-w-2xl">
            <p className="mb-3 flex items-center gap-3 text-[9px] font-mono uppercase tracking-[0.3em] text-brand-champagne/75">
              <span className="h-px w-7 bg-brand-gold/80" />
              Recepção & validação
            </p>
            <h1 className="font-display text-3xl font-light leading-tight tracking-[-0.035em] text-[#F5EFE4] sm:text-4xl lg:text-[2.85rem]">
              O momento da chegada.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[#D6CCBC]/70">
              A equipa lê o passe uma única vez. A presença é validada e registada de imediato, com confirmação clara para a recepção.
            </p>
            <div className="mt-5 inline-flex max-w-full items-center gap-2 border border-brand-champagne/15 bg-black/20 px-3 py-2 text-[9px] font-mono uppercase tracking-[0.16em] text-brand-champagne/80">
              <span className="truncate">{event.name}</span>
              <span className="text-brand-champagne/35">·</span>
              <span className="shrink-0">Posto de entrada</span>
            </div>
          </div>
        </div>

        <div className="relative grid grid-cols-3 border-t border-brand-champagne/15 bg-black/15">
          <div className="border-r border-brand-champagne/10 px-4 py-4 sm:px-7">
            <p className="text-[8px] font-mono uppercase tracking-[0.22em] text-white/40 sm:text-[9px]">Entradas</p>
            <p className="mt-1 font-display text-2xl font-light tabular-nums text-brand-champagne sm:text-3xl">{stats.checkedIn}<span className="ml-2 text-xs text-white/35">/</span><span className="ml-2 text-base text-white/60 sm:text-lg">{stats.confirmed}</span></p>
            <p className="mt-1 text-[9px] tracking-wide text-white/35">registadas / confirmados</p>
          </div>
          <div className="border-r border-brand-champagne/10 px-4 py-4 sm:px-7">
            <p className="text-[8px] font-mono uppercase tracking-[0.22em] text-white/40 sm:text-[9px]">Presença</p>
            <p className="mt-1 font-display text-2xl font-light tabular-nums text-[#E8D7B8] sm:text-3xl">{pct}<span className="ml-1 text-sm">%</span></p>
            <div className="mt-2 h-px w-full bg-white/10">
              <div className="h-px bg-brand-gold transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="px-4 py-4 sm:px-7">
            <p className="text-[8px] font-mono uppercase tracking-[0.22em] text-white/40 sm:text-[9px]">Segurança</p>
            <p className="mt-2 flex items-center gap-2 text-xs text-[#D8CDBB] sm:text-sm">
              <LockKeyhole className="h-3.5 w-3.5 text-brand-champagne/70" />
              Sessão autenticada
            </p>
            <p className="mt-1 text-[9px] tracking-wide text-white/35">validação no servidor</p>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <section className="min-w-0 border border-brand-champagne/15 bg-[#0D0B09]/90">
          <div className="flex items-start justify-between gap-4 border-b border-brand-champagne/10 px-5 py-4 sm:px-6">
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.27em] text-brand-champagne/55">01 / Leitura óptica</p>
              <h2 className="mt-2 font-display text-xl font-light text-[#F5EFE4] sm:text-2xl">Scanner da recepção</h2>
            </div>
            <span className="mt-1 border border-brand-champagne/15 px-2 py-1 text-[8px] font-mono uppercase tracking-[0.15em] text-white/45">QR · seguro</span>
          </div>

          <div className="p-4 sm:p-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden border border-brand-champagne/15 bg-[#050504] sm:aspect-[16/10]">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(184,138,42,0.1),transparent_65%)]" />
              <div aria-hidden="true" className="pointer-events-none absolute inset-5 border border-brand-champagne/[0.07] sm:inset-7" />
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 h-full w-full object-cover ${isCameraActive ? "block" : "hidden"}`}
              />

              {isCameraActive && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative flex aspect-square w-[min(62%,17rem)] items-center justify-center border border-brand-champagne/70 shadow-[0_0_55px_rgba(184,138,42,0.12)]">
                    <span className="absolute -left-px -top-px h-7 w-7 border-l-2 border-t-2 border-brand-champagne" />
                    <span className="absolute -right-px -top-px h-7 w-7 border-r-2 border-t-2 border-brand-champagne" />
                    <span className="absolute -bottom-px -left-px h-7 w-7 border-b-2 border-l-2 border-brand-champagne" />
                    <span className="absolute -bottom-px -right-px h-7 w-7 border-b-2 border-r-2 border-brand-champagne" />
                    <span className="absolute left-0 right-0 top-1/2 h-px bg-brand-champagne/25" />
                    {isProcessing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/65 backdrop-blur-sm">
                        <span className="animate-pulse text-[10px] font-mono uppercase tracking-[0.25em] text-brand-champagne">A validar o passe</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 py-8 text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center border border-brand-champagne/25 bg-brand-champagne/[0.035] text-brand-champagne/75">
                    <CameraOff className="h-6 w-6" strokeWidth={1.2} />
                  </div>
                  <p className="font-display text-2xl font-light tracking-tight text-[#F0E7D8]">Pronto para receber.</p>
                  <p className="mt-2 max-w-xs text-xs leading-6 text-white/45">Active a câmara e peça ao convidado que apresente o passe digital no seu telemóvel.</p>
                  <div className="mt-5 flex items-center gap-2 text-[8px] font-mono uppercase tracking-[0.2em] text-brand-champagne/45">
                    <span className="h-px w-5 bg-brand-gold/60" />
                    Um passe · Uma leitura
                    <span className="h-px w-5 bg-brand-gold/60" />
                  </div>
                  {cameraError && (
                    <div className="mt-5 max-w-md border border-red-400/25 bg-red-950/25 p-3 text-left text-xs leading-5 text-red-200" role="alert">
                      {cameraError}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div aria-live="polite" role="status" className="mt-4 border border-brand-champagne/15 bg-brand-champagne/[0.035] px-4 py-3 text-xs leading-5 text-brand-champagne/75">
              <p>{scanFeedback}</p>
              {isCameraActive && (
                <p className="mt-1 text-[10px] leading-4 text-white/40">
                  {scannerDiagnostics.width > 0 && scannerDiagnostics.height > 0
                    ? `${scannerDiagnostics.frames} frames analisados · ${scannerDiagnostics.width}×${scannerDiagnostics.height} · jsQR${nativeDetectorAvailable ? " + leitor nativo" : ""} · estado ${scannerDiagnostics.readyState}`
                    : `A aguardar frames do sensor · estado ${scannerDiagnostics.readyState}`}
                </p>
              )}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              {!isCameraActive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="inline-flex min-h-12 items-center justify-center gap-2 border border-brand-champagne/80 bg-brand-champagne px-5 py-3 text-xs font-mono uppercase tracking-[0.14em] text-[#15110B] transition-colors hover:border-[#F2E4C9] hover:bg-[#F2E4C9] focus:outline-none focus:ring-2 focus:ring-brand-champagne/50 focus:ring-offset-2 focus:ring-offset-[#0D0B09]"
                >
                  <Camera className="h-4 w-4" strokeWidth={1.5} />
                  Activar câmara
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="inline-flex min-h-12 items-center justify-center gap-2 border border-brand-champagne/30 bg-white/[0.035] px-5 py-3 text-xs font-mono uppercase tracking-[0.14em] text-white/80 transition-colors hover:border-brand-champagne/65 hover:text-brand-champagne focus:outline-none focus:ring-2 focus:ring-brand-champagne/40"
                >
                  <CameraOff className="h-4 w-4" strokeWidth={1.5} />
                  Desactivar câmara
                </button>
              )}
              <div className="flex items-center justify-center gap-2 border border-white/[0.07] px-4 py-3 text-[9px] font-mono uppercase tracking-[0.14em] text-white/40">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-champagne/60" />
                Acesso controlado
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-brand-champagne/10 px-5 py-3 text-[8px] font-mono uppercase tracking-[0.15em] text-white/30 sm:px-6">
            <span>HAXR Signature · Access desk</span>
            <span>Protocolo de entrada v2</span>
          </div>
        </section>

        <aside className="flex min-w-0 flex-col gap-5">
          <section aria-live="polite" className="flex min-h-[340px] flex-1 flex-col border border-brand-champagne/15 bg-gradient-to-br from-[#17130E] to-[#0A0908]">
            <div className="flex items-start justify-between gap-4 border-b border-brand-champagne/10 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-[0.27em] text-brand-champagne/55">02 / Resultado</p>
                <h2 className="mt-2 font-display text-xl font-light text-[#F5EFE4] sm:text-2xl">Registo de presença</h2>
              </div>
              <span className="mt-1 text-[9px] font-mono uppercase tracking-[0.15em] text-white/35">{isProcessing ? "A validar" : scanResult ? "Actualizado" : "Em espera"}</span>
            </div>

            <div className="flex flex-1 flex-col justify-center p-5 sm:p-6">
              {scanResult ? (
                <div className="space-y-4">
                  {scanResult.status === "success" && (
                    <div className="border border-emerald-400/25 bg-emerald-950/25 p-5 text-emerald-100">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-emerald-300/30 bg-emerald-300/10">
                          <CheckCircle2 className="h-5 w-5 text-emerald-300" strokeWidth={1.4} />
                        </div>
                        <div>
                          <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-emerald-300/70">Validação concluída</p>
                          <p className="mt-1 font-display text-xl font-light text-emerald-100">{scanResult.message}</p>
                        </div>
                      </div>
                      <p className="mt-5 border-t border-emerald-300/15 pt-4 font-display text-3xl font-light text-white">{scanResult.guestName}</p>
                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-emerald-300/15 pt-4 text-xs">
                        <div>
                          <p className="text-[8px] font-mono uppercase tracking-[0.17em] text-emerald-100/45">Lotação</p>
                          <p className="mt-1 text-emerald-50">{scanResult.partySize} pessoa(s)</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-mono uppercase tracking-[0.17em] text-emerald-100/45">Lugar</p>
                          <p className="mt-1 text-emerald-50">{scanResult.tableName ? `${scanResult.tableName}${scanResult.seatLabel ? ` · ${scanResult.seatLabel}` : ""}` : "A confirmar"}</p>
                        </div>
                      </div>
                      {scanResult.notes && <p className="mt-4 border-t border-emerald-300/15 pt-3 text-xs italic leading-5 text-emerald-50/65">{scanResult.notes}</p>}
                    </div>
                  )}

                  {scanResult.status === "already_checked_in" && (
                    <div className="border border-amber-300/25 bg-amber-950/25 p-5 text-amber-100">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-amber-300/30 bg-amber-300/10">
                          <AlertTriangle className="h-5 w-5 text-amber-300" strokeWidth={1.4} />
                        </div>
                        <div>
                          <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-amber-200/70">Atenção · duplicado</p>
                          <p className="mt-1 font-display text-xl font-light">{scanResult.message}</p>
                        </div>
                      </div>
                      <p className="mt-5 border-t border-amber-300/15 pt-4 font-display text-3xl font-light text-white">{scanResult.guestName}</p>
                      <p className="mt-3 text-xs text-amber-100/70">Lotação autorizada: {scanResult.partySize} pessoa(s)</p>
                      {scanResult.tableName && <p className="mt-2 text-xs text-brand-champagne">{scanResult.tableName}{scanResult.seatLabel ? ` · Lugar ${scanResult.seatLabel}` : ""}</p>}
                    </div>
                  )}

                  {scanResult.status === "error" && (
                    <div className="border border-red-300/25 bg-red-950/25 p-5 text-red-100">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-red-300/30 bg-red-300/10">
                          <XCircle className="h-5 w-5 text-red-300" strokeWidth={1.4} />
                        </div>
                        <div>
                          <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-red-200/70">Acesso não autorizado</p>
                          <p className="mt-1 font-display text-xl font-light">Não foi possível validar o passe.</p>
                        </div>
                      </div>
                      <p className="mt-4 border-t border-red-300/15 pt-3 text-xs leading-6 text-red-100/75">{scanResult.message}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-brand-champagne/15 bg-brand-champagne/[0.035] text-brand-champagne/60">
                    <ShieldCheck className="h-6 w-6" strokeWidth={1.2} />
                  </div>
                  <p className="mt-5 font-display text-2xl font-light text-[#EFE5D5]">À espera do primeiro passe.</p>
                  <p className="mx-auto mt-2 max-w-xs text-xs leading-6 text-white/40">Quando o código for lido, os dados essenciais e o estado da entrada surgem aqui.</p>
                  <div className="mx-auto mt-6 flex max-w-[190px] items-center gap-3">
                    <span className="h-px flex-1 bg-brand-champagne/20" />
                    <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-brand-champagne/45">Pronto</span>
                    <span className="h-px flex-1 bg-brand-champagne/20" />
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-brand-champagne/10 px-5 py-3 text-[8px] font-mono uppercase tracking-[0.14em] text-white/30 sm:px-6">
              Validação atómica · resposta imediata
            </div>
          </section>

          <section className="border border-brand-champagne/15 bg-[#0D0B09]/90">
            <div className="border-b border-brand-champagne/10 px-5 py-4">
              <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-brand-champagne/55">03 / Contingência</p>
              <h2 className="mt-2 font-display text-lg font-light text-[#F5EFE4]">Validação manual</h2>
              <p className="mt-1 text-xs leading-5 text-white/40">Utilize apenas se a leitura óptica não estiver disponível.</p>
            </div>
            <form onSubmit={handleManualSubmit} className="space-y-3 p-4 sm:p-5">
              <label htmlFor="manual-pass-token" className="block text-[8px] font-mono uppercase tracking-[0.18em] text-white/45">Código ou token do passe</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="manual-pass-token"
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Introduza o código de entrada"
                  className="min-h-11 min-w-0 flex-1 border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder:text-white/25 outline-none transition-colors focus:border-brand-champagne/60 focus:ring-1 focus:ring-brand-champagne/20"
                />
                <button
                  type="submit"
                  disabled={isProcessing || !manualToken.trim()}
                  className="min-h-11 border border-brand-champagne/25 bg-white/[0.035] px-5 py-2 text-[9px] font-mono uppercase tracking-[0.16em] text-brand-champagne transition-colors hover:border-brand-champagne/70 hover:bg-brand-champagne/10 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Validar código
                </button>
              </div>
            </form>
          </section>
        </aside>
      </main>

      <footer className="flex flex-col gap-2 border-t border-brand-champagne/10 pt-4 text-[8px] font-mono uppercase tracking-[0.17em] text-white/25 sm:flex-row sm:items-center sm:justify-between">
        <span>HAXR Signature · Alta-costura digital</span>
        <span>Um passe · Uma leitura · Uma confirmação</span>
      </footer>
    </div>
  );
}