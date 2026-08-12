import InvitationPackages from "@/components/sections/InvitationPackages";
import StructuredData from "@/components/seo/StructuredData";
import { demoCatalog } from "@/lib/demos/catalog";
import { caseStudies } from "@/lib/marketing/editorial";
import { invitationFaqs } from "@/lib/marketing/invitation-offer";
import { marketingMetadata } from "@/lib/marketing/seo";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  Fingerprint,
  Images,
  LayoutGrid,
  MailOpen,
  MapPinned,
  Music2,
  Palette,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Type,
  UsersRound,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = marketingMetadata("convites");

const offerings = [
  {
    icon: MailOpen,
    title: "Convite digital",
    copy: "Uma experiência responsiva, construída como uma narrativa — não como um cartão transportado para o ecrã.",
  },
  {
    icon: Fingerprint,
    title: "Identidade visual",
    copy: "Monograma, paleta, tipografia e linguagem gráfica que dão ao evento uma assinatura reconhecível.",
  },
  {
    icon: CalendarDays,
    title: "Save the Date",
    copy: "O anúncio inicial com o tom certo, preparado para ser partilhado e lembrado desde o primeiro contacto.",
  },
  {
    icon: UsersRound,
    title: "RSVP & convidados",
    copy: "Confirmações, acompanhantes e informação operacional organizados sem quebrar a elegância da experiência.",
  },
  {
    icon: LayoutGrid,
    title: "HAXR Seating",
    copy: "Mesas, lugares e Find Your Seat ligados ao convite para um acolhimento claro no dia do evento.",
  },
  {
    icon: Images,
    title: "Memórias do Nosso Dia",
    copy: "Um módulo colaborativo por QR Code, avaliado e activado em projectos seleccionados.",
  },
] as const;

const processSteps = [
  {
    number: "01",
    title: "Escuta & intenção",
    copy: "Percebemos o evento, o público, a história e o que a primeira impressão deve fazer sentir.",
  },
  {
    number: "02",
    title: "Direcção criativa",
    copy: "Definimos conceito, arquitectura visual, tipografia, paleta, ritmo e hierarquia de conteúdo.",
  },
  {
    number: "03",
    title: "Atelier digital",
    copy: "Construímos a experiência mobile-first, integramos os módulos escolhidos e refinamos cada transição.",
  },
  {
    number: "04",
    title: "Ensaio & entrega",
    copy: "Testamos conteúdo, links, RSVP e dispositivos antes de entregar a experiência pronta para partilhar.",
  },
] as const;

const identityPieces = [
  { icon: Fingerprint, title: "Monograma", copy: "Um sinal proprietário para unir convite, espaço e peças físicas." },
  { icon: Palette, title: "Paleta", copy: "Cor com intenção, contraste e aplicações definidas para cada suporte." },
  { icon: Type, title: "Tipografia", copy: "Uma voz visual coerente entre títulos, informação e detalhes editoriais." },
  { icon: LayoutGrid, title: "Sistema", copy: "Regras de composição que mantêm todas as peças reconhecíveis e elegantes." },
] as const;

const realCases = demoCatalog.map((demo) => ({
  demo,
  study: caseStudies.find((study) => study.id === demo.id),
  image:
    demo.id === "casamento-vania-fabiao"
      ? "/images/convite-mockup-vania-fabiao.png"
      : "/images/save-the-date-jessica-samuel-preview.png",
}));

function SectionIntro({
  label,
  title,
  copy,
  light = false,
}: {
  label: string;
  title: string;
  copy?: string;
  light?: boolean;
}) {
  return (
    <div className="max-w-3xl">
      <p className={`mb-5 text-[0.68rem] font-semibold uppercase tracking-[0.3em] ${light ? "text-brand-gold-light" : "text-brand-gold"}`}>
        {label}
      </p>
      <h2 className={`font-serif text-[clamp(2.4rem,6vw,5.6rem)] font-light leading-[0.98] tracking-[-0.025em] ${light ? "text-brand-ivory" : "text-brand-text-dark"}`}>
        {title}
      </h2>
      {copy ? (
        <p className={`mt-7 max-w-2xl text-base leading-8 md:text-lg ${light ? "text-brand-ivory/68" : "text-brand-text-dark/68"}`}>
          {copy}
        </p>
      ) : null}
    </div>
  );
}

export default function ConvitesIdentidadePage() {
  return (
    <>
      <StructuredData page="convites" />

      <section className="relative isolate overflow-hidden bg-brand-black pb-20 pt-28 text-brand-ivory md:pb-28 md:pt-36 lg:min-h-[820px] lg:pb-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_24%,rgba(184,138,42,0.18),transparent_32%),linear-gradient(125deg,rgba(255,255,255,0.025),transparent_42%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-6 bottom-4 font-serif text-[clamp(6rem,20vw,18rem)] leading-none text-white/[0.025]">
          SIGNATURE
        </div>

        <div className="site-container relative grid items-center gap-14 lg:grid-cols-[1.05fr_0.75fr] lg:gap-20">
          <div className="max-w-3xl">
            <p className="mb-7 text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-brand-gold-light">
              Convites & Identidade Visual · Atelier HAXR
            </p>
            <h1 className="font-serif text-[clamp(3.2rem,8vw,8rem)] font-light leading-[0.87] tracking-[-0.045em] text-brand-ivory">
              O evento começa antes do grande dia.
            </h1>
            <p className="mt-8 max-w-2xl font-serif text-xl leading-relaxed text-brand-ivory/78 md:text-2xl">
              Criamos a primeira impressão como quem desenha uma entrada: com intenção, carácter e uma assinatura impossível de confundir.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contacto?tipo=convite-digital"
                className="inline-flex min-h-13 items-center justify-between gap-6 bg-brand-gold px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-black transition-colors hover:bg-brand-gold-light focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold-light"
              >
                Criar a nossa experiência
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                href="#coleccao"
                className="inline-flex min-h-13 items-center justify-between gap-6 border border-brand-ivory/20 px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-ivory transition-colors hover:border-brand-gold hover:text-brand-gold-light focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold-light"
              >
                Explorar experiências
                <ArrowRight aria-hidden="true" className="size-4 rotate-90" />
              </Link>
            </div>
            <dl className="mt-12 grid max-w-2xl grid-cols-3 border-y border-brand-ivory/12 py-6">
              <div>
                <dt className="text-[0.62rem] uppercase tracking-[0.2em] text-brand-ivory/42">Pensado em</dt>
                <dd className="mt-2 font-serif text-lg text-brand-ivory">Mobile first</dd>
              </div>
              <div className="border-x border-brand-ivory/10 px-4 sm:px-6">
                <dt className="text-[0.62rem] uppercase tracking-[0.2em] text-brand-ivory/42">Criado por</dt>
                <dd className="mt-2 font-serif text-lg text-brand-ivory">Direcção de arte</dd>
              </div>
              <div className="pl-4 sm:pl-6">
                <dt className="text-[0.62rem] uppercase tracking-[0.2em] text-brand-ivory/42">Entregue como</dt>
                <dd className="mt-2 font-serif text-lg text-brand-ivory">Experiência</dd>
              </div>
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-[31rem] lg:justify-self-end">
            <div className="absolute -inset-4 border border-brand-gold/18 md:-inset-7" aria-hidden="true" />
            <div className="relative aspect-[4/5] overflow-hidden bg-brand-black-soft shadow-[0_35px_100px_rgba(0,0,0,0.45)]">
              <Image
                src="/images/convite-mockup-vania-fabiao.png"
                alt="Convite digital de Vânia e Fabião apresentado num telemóvel"
                fill
                priority
                sizes="(max-width: 1023px) 90vw, 34vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-black/55 via-transparent to-transparent" aria-hidden="true" />
              <p className="absolute bottom-5 left-5 text-[0.64rem] uppercase tracking-[0.24em] text-brand-ivory/75">
                Caso real · Vânia & Fabião
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-ivory py-24 md:py-36">
        <div className="site-container grid gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20">
          <div>
            <p className="section-label">Manifesto</p>
            <div className="mt-6 h-px w-20 bg-brand-gold" aria-hidden="true" />
          </div>
          <div className="max-w-4xl">
            <p className="font-serif text-[clamp(2rem,4.8vw,4.75rem)] font-light leading-[1.08] tracking-[-0.025em] text-brand-text-dark">
              Um convite não serve apenas para informar. Ele estabelece expectativa, revela cuidado e dá ao convidado a primeira sensação do que está por vir.
            </p>
            <p className="mt-8 max-w-2xl text-base leading-8 text-brand-text-dark/65 md:text-lg">
              Por isso tratamos cada projecto como alta-costura digital: criado para uma história, ajustado a um público e coerente em cada detalhe — do primeiro clique ao lugar à mesa.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-brand-gold/14 bg-white py-20 md:py-28">
        <div className="site-container">
          <SectionIntro
            label="O que desenhamos"
            title="Uma experiência completa, não peças soltas."
            copy="Design, narrativa e operação trabalham juntos para que a beleza também seja útil ao anfitrião e intuitiva para o convidado."
          />
          <div className="mt-14 grid gap-px bg-brand-gold/14 border border-brand-gold/14 sm:grid-cols-2 lg:grid-cols-3">
            {offerings.map((offering, index) => {
              const Icon = offering.icon;
              return (
                <article key={offering.title} className="group min-h-64 bg-brand-ivory p-7 transition-colors hover:bg-white md:p-9">
                  <div className="flex items-center justify-between">
                    <Icon aria-hidden="true" className="size-7 text-brand-gold" strokeWidth={1.25} />
                    <span className="font-serif text-sm text-brand-text-dark/25">0{index + 1}</span>
                  </div>
                  <h3 className="mt-10 font-serif text-2xl text-brand-text-dark md:text-3xl">{offering.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-brand-text-dark/62">{offering.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="coleccao" className="scroll-mt-24 bg-brand-ivory py-24 md:py-36">
        <div className="site-container">
          <SectionIntro
            label="Experiências por ocasião"
            title="O mesmo rigor. Uma expressão diferente para cada história."
            copy="Seleccione o tipo de evento para comparar níveis, investimento e módulos com transparência. Os valores apresentados são os valores base do serviço."
          />
          <div className="mt-14 md:mt-20">
            <InvitationPackages />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-brand-black py-24 text-brand-ivory md:py-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(184,138,42,0.16),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(184,138,42,0.08),transparent_25%)]" />
        <div className="site-container relative grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <div>
            <SectionIntro
              light
              label="Módulo em projectos seleccionados"
              title="Memórias do Nosso Dia."
              copy="Um álbum colaborativo ligado ao evento: os convidados entram por QR Code e partilham imagens sem interromper a celebração. A activação e moderação são confirmadas em proposta."
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {[
                { icon: QrCode, title: "Entrada simples", copy: "Um QR Code conduz o convidado ao espaço certo." },
                { icon: Camera, title: "Olhares reais", copy: "Fotografias espontâneas reunidas num só lugar." },
                { icon: ShieldCheck, title: "Curadoria", copy: "A publicação e moderação são definidas por projecto." },
                { icon: Images, title: "Memória viva", copy: "Um arquivo visual complementar à fotografia oficial." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="border-t border-brand-ivory/14 pt-5">
                    <Icon aria-hidden="true" className="size-5 text-brand-gold-light" strokeWidth={1.3} />
                    <h3 className="mt-4 font-serif text-xl">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-brand-ivory/58">{item.copy}</p>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg border border-brand-gold/22 bg-white/[0.035] p-5 md:p-8">
            <div className="border border-brand-ivory/12 bg-brand-black-soft p-6 md:p-8">
              <div className="flex items-center justify-between border-b border-brand-ivory/10 pb-5">
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.24em] text-brand-gold-light">Álbum do evento</p>
                  <p className="mt-2 font-serif text-2xl">Memórias</p>
                </div>
                <ScanLine aria-hidden="true" className="size-8 text-brand-gold" strokeWidth={1.2} />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="aspect-[4/5] bg-brand-champagne/10 p-4"><Camera className="size-5 text-brand-gold/65" aria-hidden="true" /></div>
                <div className="aspect-square bg-brand-gold/10 p-4"><Images className="size-5 text-brand-gold/65" aria-hidden="true" /></div>
                <div className="aspect-square bg-white/5 p-4"><QrCode className="size-5 text-brand-gold/65" aria-hidden="true" /></div>
                <div className="-mt-[25%] aspect-[4/5] bg-brand-champagne/15 p-4"><Smartphone className="size-5 text-brand-gold/65" aria-hidden="true" /></div>
              </div>
              <p className="mt-6 border-t border-brand-ivory/10 pt-5 text-xs leading-6 text-brand-ivory/45">
                Interface conceptual do módulo. Configuração final adaptada ao evento.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-24 md:py-36">
        <div className="site-container grid items-center gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
          <div className="relative mx-auto w-full max-w-xl border border-brand-gold/20 bg-brand-ivory p-6 md:p-10">
            <div className="flex items-center justify-between border-b border-brand-gold/16 pb-6">
              <div>
                <p className="text-[0.62rem] uppercase tracking-[0.24em] text-brand-gold">HAXR Seating</p>
                <p className="mt-2 font-serif text-2xl">Recepção sem incerteza</p>
              </div>
              <LayoutGrid aria-hidden="true" className="size-8 text-brand-gold" strokeWidth={1.2} />
            </div>
            <div className="mt-7 grid grid-cols-3 gap-3">
              {["M01", "M02", "M03", "M04", "M05", "M06"].map((table, index) => (
                <div key={table} className={`flex aspect-square items-center justify-center rounded-full border font-serif text-sm ${index === 3 ? "border-brand-gold bg-brand-gold text-brand-black" : "border-brand-gold/22 bg-white text-brand-text-dark/60"}`}>
                  {table}
                </div>
              ))}
            </div>
            <div className="mt-7 flex items-center gap-4 border border-brand-gold/18 bg-white p-4">
              <MapPinned aria-hidden="true" className="size-5 shrink-0 text-brand-gold" strokeWidth={1.4} />
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-brand-text-dark/42">Find Your Seat</p>
                <p className="mt-1 font-serif text-lg">Mesa 04 · Ala Jardim</p>
              </div>
            </div>
          </div>

          <div>
            <SectionIntro
              label="Acolhimento inteligente"
              title="Do nome ao lugar, em poucos segundos."
              copy="O HAXR Seating liga a organização das mesas ao Find Your Seat. O convidado pesquisa o nome, encontra a mesa e segue com confiança — enquanto a equipa mantém a visão operacional do evento."
            />
            <ul className="mt-9 space-y-4">
              {[
                "Mesas e convidados organizados por evento",
                "Pesquisa por nome com privacidade reforçada",
                "QR Code preparado para a recepção",
                "Croqui técnico ligado à operação da equipa",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-7 text-brand-text-dark/68">
                  <Check aria-hidden="true" className="mt-1.5 size-4 shrink-0 text-brand-gold" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/gestao-convidados" className="mt-9 inline-flex min-h-12 items-center gap-4 border-b border-brand-gold py-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-text-dark transition-colors hover:text-brand-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold">
              Conhecer a gestão de convidados <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-brand-gold/14 bg-brand-ivory py-24 md:py-36">
        <div className="site-container">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <SectionIntro
              label="Identidade com peso próprio"
              title="O convite abre a porta. A identidade ocupa todo o espaço."
              copy="Criamos um sistema visual capaz de atravessar ecrãs, papelaria, sinalética, mesas e detalhes sem perder coerência."
            />
            <div className="grid gap-px border border-brand-gold/16 bg-brand-gold/16 sm:grid-cols-2">
              {identityPieces.map((piece) => {
                const Icon = piece.icon;
                return (
                  <article key={piece.title} className="min-h-56 bg-white p-7 md:p-9">
                    <Icon aria-hidden="true" className="size-7 text-brand-gold" strokeWidth={1.2} />
                    <h3 className="mt-8 font-serif text-2xl">{piece.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-brand-text-dark/62">{piece.copy}</p>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="mt-16 grid gap-6 border-t border-brand-gold/18 pt-10 md:grid-cols-3">
            <div className="bg-brand-black p-7 text-brand-ivory md:p-9">
              <p className="text-[0.62rem] uppercase tracking-[0.22em] text-brand-gold-light">Paleta de assinatura</p>
              <div className="mt-8 flex gap-3">
                {["#080706", "#B88A2A", "#EAD8B8", "#F7F1E8"].map((color) => <span key={color} className="aspect-square flex-1 border border-white/10" style={{ backgroundColor: color }} />)}
              </div>
            </div>
            <div className="border border-brand-gold/16 bg-white p-7 md:p-9">
              <p className="text-[0.62rem] uppercase tracking-[0.22em] text-brand-gold">Voz editorial</p>
              <p className="mt-7 font-serif text-4xl leading-tight">Detalhe que se sente.</p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-brand-text-dark/42">Clareza · Ritmo · Presença</p>
            </div>
            <div className="border border-brand-gold/16 bg-brand-champagne/24 p-7 md:p-9">
              <p className="text-[0.62rem] uppercase tracking-[0.22em] text-brand-gold">Aplicações</p>
              <div className="mt-7 space-y-3 text-sm text-brand-text-dark/68">
                <p>Save the Date & convite</p>
                <p>Menus & marcadores de mesa</p>
                <p>Sinalética & painéis de recepção</p>
                <p>Peças digitais & sociais</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-24 md:py-36">
        <div className="site-container">
          <SectionIntro
            label="Experiências reais"
            title="A assinatura vê-se melhor quando a história é verdadeira."
            copy="Dois projectos reais, duas linguagens diferentes e a mesma atenção ao que cada convidado deveria sentir."
          />
          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            {realCases.map(({ demo, study, image }, index) => (
              <article key={demo.id} className="group border border-brand-gold/16 bg-brand-ivory">
                <Link href={demo.publicPath} className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold">
                  <div className={`relative overflow-hidden bg-brand-black ${index === 0 ? "aspect-[4/5] sm:aspect-[16/11]" : "aspect-[4/5] sm:aspect-[16/11]"}`}>
                    <Image src={image} alt={demo.title} fill sizes="(max-width: 1023px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.025]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-black/72 via-transparent to-transparent" aria-hidden="true" />
                    <p className="absolute bottom-5 left-5 right-5 text-[0.65rem] uppercase tracking-[0.23em] text-brand-ivory/78">{demo.category} · {demo.occasion}</p>
                  </div>
                </Link>
                <div className="p-7 md:p-9">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-[0.62rem] uppercase tracking-[0.22em] text-brand-gold">Caso 0{index + 1}</p>
                      <h3 className="mt-3 font-serif text-3xl md:text-4xl">{demo.shortTitle}</h3>
                    </div>
                    <ArrowRight aria-hidden="true" className="mt-2 size-5 text-brand-gold transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="mt-5 text-sm leading-7 text-brand-text-dark/66">{study?.solution ?? demo.editorialNote}</p>
                  <p className="mt-5 border-l border-brand-gold pl-4 font-serif text-lg italic leading-7 text-brand-text-dark/76">{study?.result}</p>
                  <Link href={demo.publicPath} className="mt-7 inline-flex min-h-12 items-center gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-text-dark transition-colors hover:text-brand-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold">
                    {demo.ctaLabel} <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-black py-24 text-brand-ivory md:py-36">
        <div className="site-container">
          <SectionIntro
            light
            label="Como criamos"
            title="Da intenção ao primeiro clique."
            copy="Um processo curto o suficiente para avançar e rigoroso o suficiente para proteger a qualidade."
          />
          <ol className="mt-16 grid gap-px bg-brand-ivory/12 border border-brand-ivory/12 md:grid-cols-2 xl:grid-cols-4">
            {processSteps.map((step) => (
              <li key={step.number} className="min-h-72 bg-brand-black-soft p-7 md:p-9">
                <p className="font-serif text-5xl text-brand-gold/42">{step.number}</p>
                <h3 className="mt-10 font-serif text-2xl">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-brand-ivory/58">{step.copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-brand-ivory py-24 md:py-36">
        <div className="site-container grid gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
          <div>
            <SectionIntro
              label="Perguntas antes de começar"
              title="Clareza também é luxo."
              copy="O essencial sobre processo, calendário, alterações e módulos."
            />
            <Link href="/contacto?tipo=convite-digital" className="mt-9 inline-flex min-h-12 items-center gap-4 border-b border-brand-gold py-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-text-dark transition-colors hover:text-brand-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold">
              Falar com o atelier <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <div className="border-t border-brand-gold/24">
            {invitationFaqs.map((faq, index) => (
              <details key={faq.q} className="group border-b border-brand-gold/20 py-1">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-5 font-serif text-xl leading-snug text-brand-text-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold md:text-2xl">
                  <span><span className="mr-4 text-sm text-brand-gold">0{index + 1}</span>{faq.q}</span>
                  <span aria-hidden="true" className="shrink-0 font-sans text-xl font-light text-brand-gold transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-2xl pb-7 pl-0 text-sm leading-7 text-brand-text-dark/66 md:pl-10 md:text-base">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-brand-black py-24 text-brand-ivory md:py-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(184,138,42,0.24),transparent_45%)]" />
        <div className="site-container relative text-center">
          <Music2 aria-hidden="true" className="mx-auto size-7 text-brand-gold" strokeWidth={1.2} />
          <p className="mt-8 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-brand-gold-light">O primeiro capítulo</p>
          <h2 className="mx-auto mt-6 max-w-5xl font-serif text-[clamp(2.8rem,7vw,7rem)] font-light leading-[0.94] tracking-[-0.035em]">
            Dê aos convidados uma experiência à altura da história.
          </h2>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-brand-ivory/64 md:text-lg">
            Conte-nos o que estão a celebrar. A HAXR transforma intenção, identidade e operação numa primeira impressão com assinatura própria.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/contacto?tipo=convite-digital" className="inline-flex min-h-13 w-full items-center justify-between gap-6 bg-brand-gold px-7 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-black transition-colors hover:bg-brand-gold-light focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold-light sm:w-auto">
              Solicitar proposta <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link href="/portfolio" className="inline-flex min-h-13 w-full items-center justify-between gap-6 border border-brand-ivory/18 px-7 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-ivory transition-colors hover:border-brand-gold hover:text-brand-gold-light focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold-light sm:w-auto">
              Ver histórias reais <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
