import { CheckCircle2, QrCode, Sparkles, Users } from "lucide-react";
import HaxrLogo from "@/components/brand/HaxrLogo";

const FEATURES = [
  { label: "RSVP Digital", icon: CheckCircle2 },
  { label: "HAXR Concierge", icon: Sparkles },
  { label: "QR Check-in", icon: QrCode },
  { label: "Gestão de Fornecedores", icon: Users },
] as const;

export default function AuthBrandPanel() {
  return (
    <div className="relative flex h-full min-h-[280px] flex-col justify-between overflow-hidden rounded-2xl border border-brand-champagne/35 bg-brand-black p-8 text-white shadow-[0_24px_60px_rgba(8,7,6,0.18)] md:min-h-0 md:rounded-none md:border-0 md:shadow-none lg:p-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(184,138,42,0.14), transparent 55%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(234,216,184,0.08), transparent 50%)",
        }}
      />

      <div className="relative z-10 space-y-10">
        <div>
          <HaxrLogo
            variant="full"
            tone="dark"
            size="md"
            subtitle="Wedding Dashboard"
            link
            href="/"
            className="items-start"
          />
        </div>

        <div className="max-w-md space-y-4 text-left">
          <h2 className="font-serif text-2xl font-light leading-snug text-brand-ivory md:text-3xl lg:text-4xl">
            O vosso casamento, organizado com elegância.
          </h2>
          <p className="font-sans text-sm font-light leading-relaxed text-white/72">
            Acompanhe cada detalhe do evento num único espaço: convidados, RSVP,
            orçamento, fornecedores, documentos e recomendações inteligentes.
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-3 text-left sm:max-w-md">
          {FEATURES.map(({ label, icon: Icon }) => (
            <li
              key={label}
              className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-brand-gold" strokeWidth={1.5} />
              <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-white/85">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 mt-10 lg:mt-12">
        <div
          className="rounded-xl border border-white/12 bg-white/[0.06] p-4 backdrop-blur-md md:p-5"
          aria-label="Pré-visualização do painel de casamento"
        >
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <p className="font-mono text-[8px] font-bold uppercase tracking-widest text-brand-gold">
                Painel activo
              </p>
              <p className="font-serif text-lg font-light text-white">Jessica &amp; Samuel</p>
            </div>
            <span className="rounded-full border border-brand-gold/35 bg-brand-gold/15 px-2.5 py-1 font-mono text-[8px] font-bold uppercase tracking-wider text-brand-gold-light">
              72% concluído
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="rounded-lg border border-white/8 bg-black/25 px-3 py-2.5">
              <p className="font-mono text-[7px] uppercase tracking-wider text-white/45">Convidados</p>
              <p className="mt-0.5 font-sans text-sm font-medium text-white">186 confirmados</p>
            </div>
            <div className="rounded-lg border border-white/8 bg-black/25 px-3 py-2.5">
              <p className="font-mono text-[7px] uppercase tracking-wider text-white/45">Próximo passo</p>
              <p className="mt-0.5 font-sans text-xs font-light leading-snug text-white/88">
                Aprovar convite digital
              </p>
            </div>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[72%] rounded-full bg-brand-gold" />
          </div>
        </div>

        <p className="mt-6 hidden font-mono text-[9px] uppercase tracking-widest text-white/35 lg:block">
          © 2026 HAXR · Maputo
        </p>
      </div>
    </div>
  );
}
