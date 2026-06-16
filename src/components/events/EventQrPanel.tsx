"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Sparkles } from "lucide-react";
import { AdminInput, AdminSelect } from "@/components/admin/AdminField";
import { buildFindSeatUrl } from "@/lib/events/tokens";
import { generateStyledQrDataUrl } from "@/lib/events/qr-client";
import {
  DEFAULT_QR_STYLE,
  QR_FRAME_LABELS,
  QR_LOGO_OPTIONS,
  QR_MODULE_LABELS,
  QR_STYLE_PRESETS,
  QR_TITLE_FONTS,
  type QrCenterMark,
  type QrExportSize,
  type QrFrameStyle,
  type QrModuleStyle,
  type QrStyleOptions,
  type QrTitleFont,
} from "@/lib/events/qr-styles";

type EventQrPanelProps = {
  eventId: string;
  eventName: string;
};

const CENTER_MARKS: { id: QrCenterMark; label: string; hint: string }[] = [
  { id: "none", label: "Limpo", hint: "Sem marca central" },
  { id: "monogram", label: "Monograma", hint: "Iniciais editoriais" },
  { id: "logo", label: "Logo", hint: "Marca HAXR" },
];

export default function EventQrPanel({ eventId, eventName }: EventQrPanelProps) {
  const findSeatUrl = buildFindSeatUrl(eventId);
  const [style, setStyle] = useState<QrStyleOptions>(DEFAULT_QR_STYLE);
  const [activePreset, setActivePreset] = useState("signature-noir");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateStyledQrDataUrl(
        findSeatUrl,
        style,
        style.frameStyle === "minimal"
          ? undefined
          : { eventName, brandName: "HAXR Signature" }
      );
      setDataUrl(result);
    } catch {
      setError("Não foi possível compor o QR. Tente outra paleta.");
    } finally {
      setLoading(false);
    }
  }, [findSeatUrl, style, eventName]);

  useEffect(() => {
    const timer = setTimeout(() => void generate(), 320);
    return () => clearTimeout(timer);
  }, [generate]);

  function applyPreset(presetKey: keyof typeof QR_STYLE_PRESETS) {
    const preset = QR_STYLE_PRESETS[presetKey];
    setActivePreset(presetKey);
    setStyle((prev) => ({
      ...prev,
      foreground: preset.foreground,
      background: preset.background,
      accent: preset.accent,
      centerMark: preset.centerMark ?? prev.centerMark,
      titleFont: preset.titleFont ?? prev.titleFont,
      captionFont: preset.titleFont ?? prev.captionFont,
      frameStyle: preset.frameStyle ?? prev.frameStyle,
      moduleStyle: preset.moduleStyle ?? prev.moduleStyle,
    }));
  }

  function handleDownload() {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `haxr-find-seat-${eventName.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.click();
  }

  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-admin-gold mb-4">
          Atelier QR
        </p>
        <h2 className="font-serif text-2xl md:text-3xl font-light text-white/95 leading-snug">
          Composição editorial para convites
        </h2>
        <p className="mt-4 font-sans text-sm text-grey/65 leading-relaxed">
          Um código partilhado, tratado como peça gráfica: paletas de luxo,
          monograma ou logo, e moldura de convite pronta para impressão.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 items-start">
        <div className="space-y-8">
          <section className="admin-card p-6 md:p-8 space-y-5">
            <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45">
              Paletas editoriais
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(QR_STYLE_PRESETS).map(([key, preset]) => {
                const active = activePreset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key as keyof typeof QR_STYLE_PRESETS)}
                    className={`group relative text-left border p-4 transition-all duration-500 ${
                      active
                        ? "border-admin-gold/50 bg-admin-gold/5"
                        : "border-grey-dark/80 hover:border-admin-gold/25"
                    }`}
                  >
                    <div
                      className="h-14 mb-4 flex items-center justify-center border border-white/5 relative"
                      style={{ background: preset.background }}
                    >
                      <span
                        className="font-serif text-lg tracking-[0.15em]"
                        style={{ color: preset.foreground }}
                      >
                        HXR
                      </span>
                      <span
                        className="absolute bottom-3 left-1/2 -translate-x-1/2 w-10 h-px opacity-50"
                        style={{ background: preset.accent }}
                      />
                    </div>
                    <p className="font-serif text-base font-light text-white/90">
                      {preset.label}
                    </p>
                    <p className="mt-1 text-xs text-grey/50 leading-relaxed">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="admin-card p-6 md:p-8 space-y-6">
            <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45">
              Composição
            </p>

            <div className="space-y-3">
              <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-grey/60">
                Marca central
              </p>
              <div className="grid grid-cols-3 gap-2">
                {CENTER_MARKS.map((mark) => (
                  <button
                    key={mark.id}
                    type="button"
                    onClick={() =>
                      setStyle((prev) => ({ ...prev, centerMark: mark.id }))
                    }
                    className={`px-3 py-4 border text-left transition-colors ${
                      style.centerMark === mark.id
                        ? "border-admin-gold/40 bg-admin-gold/8"
                        : "border-grey-dark/80 hover:border-grey/40"
                    }`}
                  >
                    <p className="font-serif text-sm text-white/85">{mark.label}</p>
                    <p className="mt-1 text-[9px] text-grey/45 font-mono tracking-[0.1em] uppercase">
                      {mark.hint}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-grey/60">
                Forma do QR
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(QR_MODULE_LABELS) as [QrModuleStyle, string][]).map(
                  ([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setStyle((prev) => ({ ...prev, moduleStyle: key }))
                      }
                      className={`px-3 py-3 border text-center transition-colors ${
                        style.moduleStyle === key
                          ? "border-admin-gold/40 bg-admin-gold/8"
                          : "border-grey-dark/80 hover:border-grey/40"
                      }`}
                    >
                      <p className="font-serif text-sm text-white/85">{label}</p>
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <AdminSelect
                label="Fonte do título"
                value={style.titleFont}
                onChange={(e) =>
                  setStyle((p) => ({
                    ...p,
                    titleFont: e.target.value as QrTitleFont,
                  }))
                }
              >
                {(
                  Object.entries(QR_TITLE_FONTS) as [
                    QrTitleFont,
                    { label: string },
                  ][]
                ).map(([key, font]) => (
                  <option key={key} value={key}>
                    {font.label}
                  </option>
                ))}
              </AdminSelect>

              <AdminSelect
                label="Fonte da legenda"
                value={style.captionFont}
                onChange={(e) =>
                  setStyle((p) => ({
                    ...p,
                    captionFont: e.target.value as QrTitleFont,
                  }))
                }
              >
                {(
                  Object.entries(QR_TITLE_FONTS) as [
                    QrTitleFont,
                    { label: string },
                  ][]
                ).map(([key, font]) => (
                  <option key={key} value={key}>
                    {font.label}
                  </option>
                ))}
              </AdminSelect>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ColorField
                label="Tinta"
                value={style.foreground}
                onChange={(foreground) => setStyle((p) => ({ ...p, foreground }))}
              />
              <ColorField
                label="Papel"
                value={style.background}
                onChange={(background) => setStyle((p) => ({ ...p, background }))}
              />
              <ColorField
                label="Accent / ouro"
                value={style.accent}
                onChange={(accent) => setStyle((p) => ({ ...p, accent }))}
              />

              {style.centerMark === "monogram" ? (
                <AdminInput
                  label="Monograma"
                  value={style.monogramText}
                  onChange={(e) =>
                    setStyle((p) => ({ ...p, monogramText: e.target.value }))
                  }
                  placeholder="HXR"
                  maxLength={4}
                />
              ) : null}

              {style.centerMark === "logo" ? (
                <AdminSelect
                  label="Variante do logo"
                  value={style.logoSrc}
                  onChange={(e) =>
                    setStyle((p) => ({ ...p, logoSrc: e.target.value }))
                  }
                >
                  {QR_LOGO_OPTIONS.map((logo) => (
                    <option key={logo.id} value={logo.src}>
                      {logo.label}
                    </option>
                  ))}
                </AdminSelect>
              ) : null}

              <AdminSelect
                label="Moldura"
                value={style.frameStyle}
                onChange={(e) =>
                  setStyle((p) => ({
                    ...p,
                    frameStyle: e.target.value as QrFrameStyle,
                  }))
                }
              >
                {Object.entries(QR_FRAME_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </AdminSelect>

              <AdminSelect
                label="Exportação"
                value={style.size}
                onChange={(e) =>
                  setStyle((p) => ({
                    ...p,
                    size: e.target.value as QrExportSize,
                  }))
                }
              >
                <option value="web">Ecrã · 560px</option>
                <option value="print">Impressão · 1200px</option>
              </AdminSelect>
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-24 space-y-4">
          <div className="admin-card p-5 md:p-6">
            <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45 mb-5">
              Prova de arte
            </p>

            <div
              className="relative overflow-hidden border border-grey-dark/50 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
              style={{ background: style.background }}
            >
              {dataUrl && !loading ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={dataUrl}
                  alt={`Composição QR — ${eventName}`}
                  className="w-full h-auto block"
                />
              ) : (
                <div className="aspect-[3/4] flex flex-col items-center justify-center gap-3">
                  <Sparkles className="w-6 h-6 text-admin-gold/40 animate-pulse" />
                  <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-grey/40">
                    A compor...
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!dataUrl || loading}
                className="admin-btn-primary w-full justify-center"
              >
                <Download className="w-4 h-4" />
                Descarregar composição
              </button>
              <p className="text-[10px] text-grey/45 text-center font-mono tracking-[0.12em] leading-relaxed">
                PNG alta resolução · pronto para convite físico ou digital
              </p>
            </div>
          </div>

          <p className="text-[10px] text-grey/40 font-mono break-all px-1 leading-relaxed">
            {findSeatUrl}
          </p>

          {error ? (
            <p className="text-sm text-red-400/75 text-center">{error}</p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-[9px] tracking-[0.35em] uppercase text-grey/70 mb-2">
        {label}
      </span>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-14 bg-transparent border border-grey-dark/80 cursor-pointer rounded-sm"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-black-soft border border-grey-dark/80 text-white/80 font-mono text-xs px-3 py-2.5 rounded-sm tracking-wider"
        />
      </div>
    </label>
  );
}
