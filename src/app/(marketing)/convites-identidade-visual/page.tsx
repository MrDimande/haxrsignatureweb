import InvitationPackages from "@/components/sections/InvitationPackages";
import StructuredData from "@/components/seo/StructuredData";
import { demoCatalog } from "@/lib/demos/catalog";
import { invitationFaqs } from "@/lib/marketing/invitation-offer";
import { marketingMetadata } from "@/lib/marketing/seo";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  Fingerprint,
  Images,
  LayoutGrid,
  MapPinned,
  QrCode,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = marketingMetadata("convites");

const disciplines = [
  {
    number: "01",
    title: "Narrativa",
    copy: "A história encontra uma ordem, um tom e um ritmo próprios — da primeira frase à confirmação.",
  },
  {
    number: "02",
    title: "Direcção de arte",
    copy: "Tipografia, cor, imagem e movimento são desenhados para o carácter real da celebração.",
  },
  {
    number: "03",
    title: "Experiência",
    copy: "Cada gesto é pensado primeiro para o telemóvel e refinado para ser simples, fluido e memorável.",
  },
  {
    number: "04",
    title: "Operação",
    copy: "RSVP, convidados, lugares e informação útil convivem com a beleza sem competir com ela.",
  },
] as const;

const processSteps = [
  ["01", "Escutamos", "A história, o evento, os convidados e a sensação que deve permanecer."],
  ["02", "Editamos", "Transformamos conteúdo real num conceito visual e numa narrativa coerente."],
  ["03", "Construímos", "Desenhamos e desenvolvemos a experiência mobile-first, detalhe a detalhe."],
  ["04", "Ensaiamos", "Testamos conteúdo, links, RSVP e dispositivos antes da publicação."],
] as const;

const vania = demoCatalog.find((demo) => demo.id === "casamento-vania-fabiao") ?? demoCatalog[0];
const jessica = demoCatalog.find((demo) => demo.id === "save-the-date-jessica-samuel") ?? demoCatalog[1];

function EditorialLabel({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`text-[0.62rem] font-semibold uppercase tracking-[0.31em] ${light ? "text-brand-gold-light" : "text-brand-gold"}`}>
      {children}
    </p>
  );
}

export default function ConvitesIdentidadePage() {
  return (
    <>
      <StructuredData page="convites" />

      <main>
        <header className="bg-brand-ivory pb-16 pt-24 md:pb-24 md:pt-32">
          <div className="site-container">
            <div className="flex items-center justify-between border-b border-brand-text-dark/12 pb-5">
              <EditorialLabel>Atelier HAXR · Convites & Identidade</EditorialLabel>
              <span className="hidden text-[0.6rem] uppercase tracking-[0.26em] text-brand-text-dark/38 sm:block">
                Alta-Costura Digital
              </span>
            </div>

            <div className="grid gap-10 pt-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end lg:gap-20 lg:pt-14">
              <h1 className="max-w-4xl font-serif text-[clamp(2.7rem,5.4vw,5.5rem)] font-light leading-[0.96] tracking-[-0.035em] text-brand-text-dark">
                Vestimos histórias para o primeiro encontro.
              </h1>
              <div className="lg:pb-2">
                <p className="max-w-md font-serif text-lg leading-8 text-brand-text-dark/72 md:text-xl">
                  Convites digitais e identidades visuais concebidos como uma peça de autor — únicos, úteis e impossíveis de confundir.
                </p>
                <div className="mt-7 flex items-center gap-7">
                  <Link
                    href="/contacto?tipo=convite-digital"
                    className="inline-flex min-h-12 items-center gap-4 border-b border-brand-gold py-3 text-[0.68rem] font-semibold uppercase tracking-[0.19em] text-brand-text-dark transition-colors hover:text-brand-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold"
                  >
                    Marcar briefing <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                  <Link
                    href="#pacotes"
                    className="inline-flex min-h-12 items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.19em] text-brand-text-dark/55 transition-colors hover:text-brand-text-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold"
                  >
                    Ver colecções <ArrowDownRight aria-hidden="true" className="size-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section aria-labelledby="real-work-heading" className="overflow-hidden bg-brand-black py-5 text-brand-ivory md:py-8">
          <h2 id="real-work-heading" className="sr-only">Convites reais criados pela HAXR</h2>
          <div className="site-container-wide grid gap-5 lg:grid-cols-[1.36fr_0.64fr] lg:items-end">
            <Link
              href={vania.publicPath}
              className="group relative block min-h-[31rem] overflow-hidden bg-brand-black-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold md:min-h-[44rem]"
            >
              <Image
                src="/images/convite-mockup-vania-fabiao.png"
                alt="Experiência de convite digital de Vânia e Fabião"
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 68vw"
                className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.018]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-brand-black/5 to-transparent" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 md:p-10">
                <div>
                  <EditorialLabel light>Peça 01 · Convite Signature</EditorialLabel>
                  <p className="mt-3 font-serif text-3xl md:text-5xl">Vânia & Fabião</p>
                </div>
                <ArrowRight aria-hidden="true" className="mb-2 size-6 shrink-0 text-brand-gold-light transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              href={jessica.publicPath}
              className="group relative block min-h-[28rem] overflow-hidden bg-brand-black-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold md:min-h-[36rem] lg:mb-14"
            >
              <Image
                src="/images/save-the-date-jessica-samuel-preview.png"
                alt="Save the Date editorial de Jessica e Samuel"
                fill
                sizes="(max-width: 1023px) 100vw, 32vw"
                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.022]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-black/88 via-brand-black/10 to-transparent" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <EditorialLabel light>Peça 02 · Save the Date</EditorialLabel>
                <div className="mt-3 flex items-end justify-between gap-5">
                  <p className="font-serif text-3xl md:text-4xl">Jessica & Samuel</p>
                  <ArrowRight aria-hidden="true" className="mb-1 size-5 shrink-0 text-brand-gold-light transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>
          <div className="site-container-wide flex justify-end py-5 md:py-8">
            <p className="max-w-xl text-right text-xs leading-6 tracking-wide text-brand-ivory/42">
              Duas histórias reais. Duas linguagens irrepetíveis. Nenhum template.
            </p>
          </div>
        </section>

        <section className="bg-white py-24 md:py-36">
          <div className="site-container grid gap-14 lg:grid-cols-[0.48fr_1.52fr] lg:gap-24">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <EditorialLabel>O princípio</EditorialLabel>
              <p className="mt-6 font-serif text-2xl leading-9 text-brand-text-dark/78">
                A beleza não entra no fim. Ela organiza tudo desde o início.
              </p>
            </div>
            <div>
              <p className="max-w-4xl font-serif text-[clamp(2.25rem,4vw,4.25rem)] font-light leading-[1.04] tracking-[-0.025em] text-brand-text-dark">
                Não fazemos páginas de convite. Criamos a primeira atmosfera do evento.
              </p>
              <p className="mt-8 max-w-2xl text-base leading-8 text-brand-text-dark/62 md:text-lg">
                Cada projecto nasce do conteúdo real do cliente e ganha uma direcção criativa própria. A tecnologia desaparece; o carácter, a clareza e a emoção permanecem.
              </p>
              <ol className="mt-16 border-t border-brand-text-dark/14">
                {disciplines.map((discipline) => (
                  <li key={discipline.number} className="grid gap-4 border-b border-brand-text-dark/12 py-7 md:grid-cols-[0.16fr_0.46fr_1fr] md:items-baseline md:gap-8">
                    <span className="text-[0.62rem] tracking-[0.25em] text-brand-gold">{discipline.number}</span>
                    <h3 className="font-serif text-2xl md:text-3xl">{discipline.title}</h3>
                    <p className="max-w-xl text-sm leading-7 text-brand-text-dark/58">{discipline.copy}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="pacotes" className="scroll-mt-24 bg-brand-ivory py-24 md:py-36">
          <div className="site-container">
            <div className="grid gap-9 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:gap-20">
              <div>
                <EditorialLabel>Colecções HAXR</EditorialLabel>
                <h2 className="mt-6 max-w-2xl font-serif text-[clamp(2.5rem,4.6vw,4.8rem)] font-light leading-[0.98] tracking-[-0.03em] text-brand-text-dark">
                  Escolha a profundidade da experiência.
                </h2>
              </div>
              <p className="max-w-xl text-base leading-8 text-brand-text-dark/62 md:text-lg lg:justify-self-end">
                Não empilhamos funcionalidades para justificar um preço. Cada colecção corresponde a um nível de narrativa, direcção de arte e operação — com o investimento apresentado sem ruído.
              </p>
            </div>
            <div className="mt-14 md:mt-20">
              <InvitationPackages />
            </div>
          </div>
        </section>

        <section className="bg-brand-black py-24 text-brand-ivory md:py-36">
          <div className="site-container">
            <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <EditorialLabel light>Da tela para o espaço</EditorialLabel>
                <h2 className="mt-6 max-w-xl font-serif text-[clamp(2.4rem,4.3vw,4.5rem)] font-light leading-[1.02] tracking-[-0.028em]">
                  Uma identidade que continua depois do clique.
                </h2>
                <p className="mt-7 max-w-xl text-base leading-8 text-brand-ivory/58">
                  Monograma, tipografia, paleta e composição tornam-se um sistema vivo — do Save the Date à sinalética, da mesa ao último agradecimento.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex min-h-72 flex-col justify-between border border-brand-ivory/14 p-7 md:p-9">
                  <Fingerprint aria-hidden="true" className="size-7 text-brand-gold-light" strokeWidth={1.1} />
                  <div>
                    <p className="font-serif text-5xl">H & H</p>
                    <p className="mt-4 text-[0.62rem] uppercase tracking-[0.25em] text-brand-ivory/42">Monograma proprietário</p>
                  </div>
                </div>
                <div className="min-h-72 bg-brand-gold p-7 text-brand-black md:p-9">
                  <p className="text-[0.62rem] uppercase tracking-[0.25em] opacity-55">Matéria cromática</p>
                  <div className="mt-16 grid grid-cols-4 gap-2">
                    {['#080706', '#8C641C', '#E3C46B', '#F7F1E8'].map((colour) => (
                      <span key={colour} className="aspect-[2/3] border border-black/10" style={{ backgroundColor: colour }} />
                    ))}
                  </div>
                  <p className="mt-6 font-serif text-2xl">Cor com intenção.</p>
                </div>
                <div className="min-h-64 bg-brand-ivory p-7 text-brand-black sm:col-span-2 md:p-9">
                  <p className="text-[0.62rem] uppercase tracking-[0.25em] text-brand-gold">Voz visual</p>
                  <div className="mt-10 grid gap-6 md:grid-cols-[1.4fr_0.6fr] md:items-end">
                    <p className="max-w-3xl font-serif text-4xl leading-[1.02] md:text-5xl">Detalhe que se sente antes de se explicar.</p>
                    <p className="text-xs uppercase leading-6 tracking-[0.2em] text-brand-text-dark/48 md:text-right">Tipografia · Ritmo<br />Imagem · Presença</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-24 md:py-36">
          <div className="site-container">
            <div className="grid gap-12 border-b border-brand-text-dark/12 pb-14 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-20">
              <div>
                <EditorialLabel>Beleza que trabalha</EditorialLabel>
                <h2 className="mt-6 max-w-3xl font-serif text-[clamp(2.4rem,4.3vw,4.5rem)] font-light leading-[1.02] tracking-[-0.028em]">
                  O convite acolhe. A plataforma organiza.
                </h2>
              </div>
              <p className="max-w-xl text-base leading-8 text-brand-text-dark/62 lg:justify-self-end">
                A experiência permanece elegante para o convidado enquanto RSVP, mesas, lugares e memórias dão controlo real ao anfitrião.
              </p>
            </div>

            <div className="grid lg:grid-cols-2">
              <article className="border-b border-brand-text-dark/12 py-12 lg:border-b-0 lg:border-r lg:pr-14 xl:pr-20">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <EditorialLabel>HAXR Seating</EditorialLabel>
                    <h3 className="mt-5 font-serif text-3xl md:text-4xl">Do nome ao lugar.</h3>
                  </div>
                  <LayoutGrid aria-hidden="true" className="size-8 text-brand-gold" strokeWidth={1.1} />
                </div>
                <div className="mt-10 grid grid-cols-[0.8fr_1.2fr] gap-5 bg-brand-ivory p-5 md:p-7">
                  <div className="grid grid-cols-2 gap-2">
                    {["01", "02", "03", "04"].map((table, index) => (
                      <span key={table} className={`flex aspect-square items-center justify-center rounded-full border font-serif ${index === 2 ? "border-brand-gold bg-brand-gold text-brand-black" : "border-brand-gold/25 bg-white text-brand-text-dark/55"}`}>{table}</span>
                    ))}
                  </div>
                  <div className="flex flex-col justify-between border-l border-brand-gold/20 pl-5">
                    <MapPinned aria-hidden="true" className="size-6 text-brand-gold" strokeWidth={1.2} />
                    <div>
                      <p className="text-[0.6rem] uppercase tracking-[0.2em] text-brand-text-dark/42">Find Your Seat</p>
                      <p className="mt-2 font-serif text-2xl">Mesa 03</p>
                      <p className="mt-1 text-xs text-brand-text-dark/48">Ala Jardim</p>
                    </div>
                  </div>
                </div>
                <ul className="mt-8 space-y-3">
                  {["Pesquisa por nome com privacidade reforçada", "Mesas, convidados e croqui ligados", "QR Code preparado para a recepção"].map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-7 text-brand-text-dark/62"><Check aria-hidden="true" className="mt-1.5 size-4 shrink-0 text-brand-gold" />{item}</li>
                  ))}
                </ul>
              </article>

              <article className="py-12 lg:pl-14 xl:pl-20">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <EditorialLabel>Projectos seleccionados</EditorialLabel>
                    <h3 className="mt-5 font-serif text-3xl md:text-4xl">Memórias do Nosso Dia.</h3>
                  </div>
                  <Images aria-hidden="true" className="size-8 text-brand-gold" strokeWidth={1.1} />
                </div>
                <div className="mt-10 bg-brand-black p-5 text-brand-ivory md:p-7">
                  <div className="grid grid-cols-[1.25fr_0.75fr] gap-3">
                    <div className="flex aspect-[4/3] items-end bg-brand-gold/12 p-5"><QrCode aria-hidden="true" className="size-8 text-brand-gold-light" strokeWidth={1.1} /></div>
                    <div className="aspect-square bg-white/[0.06]" />
                    <div className="aspect-square bg-white/[0.035]" />
                    <div className="-mt-[48%] flex aspect-[3/4] items-end bg-brand-gold/20 p-4"><span className="text-[0.58rem] uppercase tracking-[0.22em] text-brand-gold-light">Olhares reais</span></div>
                  </div>
                  <p className="mt-5 border-t border-white/10 pt-5 text-xs leading-6 text-brand-ivory/45">Módulo colaborativo por QR Code, confirmado e configurado em proposta.</p>
                </div>
                <p className="mt-8 text-sm leading-7 text-brand-text-dark/62">
                  Os convidados partilham fotografias num espaço ligado ao evento, sem substituir a fotografia oficial e sem introduzir fricção na celebração.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-brand-ivory py-24 md:py-36">
          <div className="site-container grid gap-14 lg:grid-cols-[0.62fr_1.38fr] lg:gap-24">
            <div>
              <EditorialLabel>O atelier</EditorialLabel>
              <h2 className="mt-6 max-w-sm font-serif text-3xl leading-tight md:text-4xl">Quatro gestos. Uma assinatura.</h2>
            </div>
            <ol className="border-t border-brand-text-dark/14">
              {processSteps.map(([number, title, copy]) => (
                <li key={number} className="grid gap-4 border-b border-brand-text-dark/12 py-7 sm:grid-cols-[0.18fr_0.5fr_1fr] sm:items-baseline sm:gap-8">
                  <span className="text-[0.62rem] tracking-[0.25em] text-brand-gold">{number}</span>
                  <h3 className="font-serif text-2xl">{title}</h3>
                  <p className="text-sm leading-7 text-brand-text-dark/58">{copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-white py-24 md:py-36">
          <div className="site-container grid gap-14 lg:grid-cols-[0.66fr_1.34fr] lg:gap-24">
            <div>
              <EditorialLabel>Antes de começarmos</EditorialLabel>
              <h2 className="mt-6 max-w-sm font-serif text-3xl leading-tight md:text-4xl">Clareza também é luxo.</h2>
              <Link href="/contacto?tipo=convite-digital" className="mt-8 inline-flex min-h-12 items-center gap-4 border-b border-brand-gold py-3 text-[0.68rem] font-semibold uppercase tracking-[0.19em] transition-colors hover:text-brand-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold">
                Falar com o atelier <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <div className="border-t border-brand-text-dark/14">
              {invitationFaqs.map((faq, index) => (
                <details key={faq.q} className="group border-b border-brand-text-dark/12">
                  <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-6 py-5 font-serif text-xl leading-snug focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold md:text-2xl">
                    <span><span className="mr-4 font-sans text-[0.62rem] tracking-[0.2em] text-brand-gold">0{index + 1}</span>{faq.q}</span>
                    <span aria-hidden="true" className="shrink-0 font-sans text-xl font-light text-brand-gold transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="max-w-2xl pb-7 text-sm leading-7 text-brand-text-dark/62 md:pl-10 md:text-base">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-brand-gold/20 bg-brand-ivory py-20 md:py-28">
          <div className="site-container grid gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-end lg:gap-20">
            <div>
              <EditorialLabel>Comissione uma peça HAXR</EditorialLabel>
              <h2 className="mt-6 max-w-4xl font-serif text-[clamp(2.4rem,4.5vw,4.75rem)] font-light leading-[1.01] tracking-[-0.03em]">
                A próxima história não precisa de se parecer com nenhuma anterior.
              </h2>
            </div>
            <div className="lg:pb-2">
              <p className="text-sm leading-7 text-brand-text-dark/58">Conte-nos o que estão a celebrar, quando acontece e como querem que os convidados se sintam.</p>
              <Link href="/contacto?tipo=convite-digital" className="mt-7 inline-flex min-h-13 w-full items-center justify-between gap-6 bg-brand-black px-6 py-4 text-[0.68rem] font-semibold uppercase tracking-[0.19em] text-brand-ivory transition-colors hover:bg-brand-gold hover:text-brand-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold sm:w-auto">
                Iniciar briefing <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
