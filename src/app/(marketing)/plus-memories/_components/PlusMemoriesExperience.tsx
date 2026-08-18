"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  Download,
  Eye,
  Film,
  Images,
  ListChecks,
  QrCode,
  ScanLine,
  Share2,
  Trophy,
} from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { brandAssets } from "@/lib/assets";
import { siteContact } from "@/lib/site-config";
import PlusMemoriesPackages from "./PlusMemoriesPackages";
import styles from "./plus-memories.module.css";

const DEMO_URL =
  "https://edition.haxrsignature.com/jessicasamuelwedding/memorias";
const HAXR_MARK_URL = "/images/brand/haxr-mark-gold.png";

const quickBenefits = [
  { icon: ScanLine, label: "Sem aplicação" },
  { icon: QrCode, label: "Acesso por QR Code" },
  { icon: Eye, label: "Desafios interactivos" },
  { icon: Images, label: "Álbum colectivo" },
  { icon: Film, label: "Fotografias e vídeos" },
  { icon: Share2, label: "Fácil de partilhar" },
] as const;

const journey = [
  {
    number: "01",
    title: "Digitalize",
    body: "O convidado aponta a câmara para o QR Code e entra directamente na experiência web.",
  },
  {
    number: "02",
    title: "Descubra",
    body: "Encontra momentos sugeridos — o “Eu Espio…” — e escolhe o que quer registar.",
  },
  {
    number: "03",
    title: "Registe",
    body: "Fotografa, grava um vídeo ou escolhe um momento que já guardou no telemóvel.",
  },
  {
    number: "04",
    title: "Partilhe",
    body: "Envia o registo no próprio browser, sem instalar uma aplicação nem criar uma conta.",
  },
  {
    number: "05",
    title: "Reviva",
    body: "As diferentes perspectivas encontram-se no álbum colectivo da celebração.",
  },
] as const;

const keepsakes = [
  { icon: Camera, title: "Fotografias", body: "Retratos e detalhes vistos pelos convidados." },
  { icon: Film, title: "Vídeos", body: "Movimento, voz e pequenos instantes da festa." },
  { icon: Images, title: "Álbum colectivo", body: "Uma galeria que reúne as perspectivas do evento." },
  {
    icon: ListChecks,
    title: "Organização",
    body: "Momentos associados aos desafios que os inspiraram.",
  },
  { icon: Download, title: "Exportação", body: "Um arquivo final para guardar os registos reunidos." },
] as const;

const demoModes = [
  { id: "challenges", label: "Desafios" },
  { id: "album", label: "Álbum" },
  { id: "capture", label: "Registar" },
] as const;

type DemoMode = (typeof demoModes)[number]["id"];

function BrandMark({ wordmark = false }: { wordmark?: boolean }) {
  return (
    <span
      className={`${styles.brandMark} ${wordmark ? styles.brandWordmark : ""}`}
      aria-hidden="true"
    >
      <Image
        src={wordmark ? brandAssets.logoHorizontal : HAXR_MARK_URL}
        alt=""
        width={wordmark ? 288 : 72}
        height={72}
      />
    </span>
  );
}

function HeroPhone() {
  return (
    <div className={`${styles.phone} ${styles.heroPhone}`} aria-hidden="true">
      <div className={styles.phoneSpeaker} />
      <div className={styles.phoneScreen}>
        <div className={styles.phoneIntro}>
          <BrandMark />
          <p>Edition · Plus Memories</p>
          <h3>Jessica &amp; Samuel</h3>
          <span>Casamento principal · Maputo</span>
        </div>
        <div className={styles.phonePrompt}>
          <span>Eu Espio…</span>
          <strong>12 momentos para descobrir</strong>
        </div>
        <div className={styles.phoneChallengeList}>
          <div>
            <span>01</span>
            <p>Uma fotografia de grupo da sua mesa</p>
            <Camera size={13} strokeWidth={1.4} />
          </div>
          <div>
            <span>02</span>
            <p>A entrada dos noivos</p>
            <Camera size={13} strokeWidth={1.4} />
          </div>
          <div>
            <span>03</span>
            <p>Um brinde com os noivos</p>
            <Camera size={13} strokeWidth={1.4} />
          </div>
        </div>
        <div className={styles.phoneProgress}>
          <span />
          <p>0 de 12 momentos encontrados</p>
        </div>
      </div>
    </div>
  );
}

function InteractivePhone({ mode }: { mode: DemoMode }) {
  return (
    <div className={styles.demoPhoneFrame}>
      <div className={styles.phoneSpeaker} />
      <div className={styles.demoPhoneScreen}>
        <div className={styles.demoPhoneHeader}>
          <BrandMark />
          <div>
            <p>Plus Memories</p>
            <span>Jessica &amp; Samuel</span>
          </div>
        </div>

        {mode === "challenges" ? (
          <div
            className={styles.demoPanel}
            role="tabpanel"
            id="demo-panel-challenges"
            aria-labelledby="demo-tab-challenges"
          >
            <div className={styles.demoPanelHeading}>
              <span>Eu Espio…</span>
              <h3>Momentos para descobrir</h3>
              <p>Escolha um desafio para registar.</p>
            </div>
            <div className={styles.demoChallenges}>
              <article>
                <span>Desafio 01</span>
                <h4>A entrada dos noivos</h4>
                <p>Capture a emoção deste momento.</p>
                <small>Fotografar agora <ArrowRight size={11} /></small>
              </article>
              <article>
                <span>Desafio 02</span>
                <h4>Um brinde com os noivos</h4>
                <p>Erga o copo e celebre a união.</p>
                <small>Fotografar agora <ArrowRight size={11} /></small>
              </article>
              <article>
                <span>Desafio 03</span>
                <h4>Um detalhe da decoração</h4>
                <p>Guarde um pormenor que merece ser lembrado.</p>
                <small>Fotografar agora <ArrowRight size={11} /></small>
              </article>
            </div>
            <div className={styles.demoProgress}>
              <div><span /></div>
              <p>3 de 12 momentos encontrados</p>
            </div>
          </div>
        ) : null}

        {mode === "album" ? (
          <div
            className={styles.demoPanel}
            role="tabpanel"
            id="demo-panel-album"
            aria-labelledby="demo-tab-album"
          >
            <div className={styles.demoPanelHeading}>
              <span>Mural vivo</span>
              <h3>Álbum colectivo</h3>
              <p>Perspectivas reunidas numa só experiência.</p>
            </div>
            <div className={styles.phoneGallery}>
              <div className={styles.phoneGalleryTall}>
                <Image
                  src="/images/plus-memories/wedding-first-dance.jpg"
                  alt=""
                  fill
                  sizes="220px"
                />
              </div>
              <div>
                <Image
                  src="/images/plus-memories/wedding-entrance.jpg"
                  alt=""
                  fill
                  sizes="120px"
                />
              </div>
              <div>
                <Image
                  src="/images/plus-memories/traditional-couple.jpg"
                  alt=""
                  fill
                  sizes="120px"
                />
              </div>
            </div>
            <div className={styles.galleryNote}>
              <Images size={14} strokeWidth={1.4} />
              <span>Fotografias e vídeos da celebração</span>
            </div>
          </div>
        ) : null}

        {mode === "capture" ? (
          <div
            className={styles.demoPanel}
            role="tabpanel"
            id="demo-panel-capture"
            aria-labelledby="demo-tab-capture"
          >
            <div className={styles.demoPanelHeading}>
              <span>Desafio 04</span>
              <h3>A primeira dança do casal</h3>
              <p>Registe o momento pela sua perspectiva.</p>
            </div>
            <div className={styles.captureArea}>
              <div className={styles.captureIcon}>
                <Camera size={25} strokeWidth={1.25} />
              </div>
              <strong>Escolher fotografia ou vídeo</strong>
              <span>Galeria ou câmara do telemóvel</span>
              <div>
                <Camera size={14} /> Fotografar
              </div>
              <div>
                <Film size={14} /> Escolher da galeria
              </div>
            </div>
            <p className={styles.privacyLine}>
              O registo é associado apenas a esta celebração.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function PlusMemoriesExperience() {
  const [demoMode, setDemoMode] = useState<DemoMode>("challenges");

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="plus-memories-title">
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>HAXR Signature · Plus Memories</p>
            <h1 id="plus-memories-title">
              Quando o fotógrafo olha para os noivos, alguém está a rir noutra
              mesa.
            </h1>
            <p className={styles.heroLead}>
              O Plus Memories permite que os convidados registem os momentos
              que acontecem para além da lente principal, construindo um álbum
              colectivo da celebração a partir de cada perspectiva.
            </p>
            <div className={styles.heroActions}>
              <Link
                href="/contacto?tipo=convite-digital#contacto"
                className={styles.primaryButton}
              >
                Quero Plus Memories
                <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
              <a
                href={DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.secondaryButton}
              >
                Ver demonstração
                <ArrowUpRight size={15} strokeWidth={1.5} />
              </a>
            </div>
            <p className={styles.heroAssurance}>
              <Check size={14} strokeWidth={1.5} /> Experiência web — sem
              instalação de aplicação
            </p>
          </div>

          <div className={styles.heroVisual} aria-label="Composição visual da experiência Plus Memories">
            <figure className={styles.heroPhotoMain}>
              <Image
                src="/images/plus-memories/wedding-first-dance.jpg"
                alt="Jessica e Samuel na primeira dança, registo real partilhado no Plus Memories"
                fill
                priority
                sizes="(max-width: 767px) 62vw, 30vw"
              />
            </figure>
            <figure className={styles.heroPhotoDetail}>
              <Image
                src="/images/plus-memories/wedding-entrance.jpg"
                alt="Jessica e Samuel durante a celebração, registo real partilhado no Plus Memories"
                fill
                priority
                sizes="(max-width: 767px) 36vw, 16vw"
              />
            </figure>
            <HeroPhone />
            <div className={styles.qrCard} aria-hidden="true">
              <QrCode size={31} strokeWidth={1.05} />
              <span>Scan · Descubra · Registe</span>
            </div>
            <p className={styles.realProjectLabel}>Memórias reais · Jessica &amp; Samuel</p>
          </div>
        </div>
      </section>

      <section className={styles.quickBenefits} aria-label="Benefícios principais">
        <div className={styles.container}>
          <ul>
            {quickBenefits.map(({ icon: Icon, label }) => (
              <li key={label}>
                <Icon size={18} strokeWidth={1.25} aria-hidden="true" />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.journey} id="como-funciona" aria-labelledby="journey-title">
        <div className={styles.container}>
          <RevealOnScroll>
            <div className={styles.sectionIntro}>
              <p className={styles.eyebrow}>Como funciona</p>
              <h2 id="journey-title">Cinco gestos. Uma memória maior do que uma só lente.</h2>
              <p>
                A experiência foi desenhada para funcionar no ritmo da festa e
                no dispositivo que o convidado já tem na mão.
              </p>
            </div>
          </RevealOnScroll>

          <ol className={styles.journeyList}>
            {journey.map((step, index) => (
              <li key={step.number}>
                <RevealOnScroll delay={index * 0.04}>
                  <article>
                    <span>{step.number}</span>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </article>
                </RevealOnScroll>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.demo} id="demonstracao" aria-labelledby="demo-title">
        <div className={`${styles.container} ${styles.demoGrid}`}>
          <div className={styles.demoCopy}>
            <RevealOnScroll>
              <p className={styles.eyebrow}>Produto real · em funcionamento</p>
              <h2 id="demo-title">A festa vista por quem a viveu.</h2>
              <p>
                O “Eu Espio…” transforma momentos da celebração em convites à
                participação. O convidado escolhe um desafio, regista uma
                fotografia ou vídeo e contribui para o álbum colectivo.
              </p>
            </RevealOnScroll>

            <div className={styles.demoTabs} role="tablist" aria-label="Estados da demonstração Plus Memories">
              {demoModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  role="tab"
                  id={`demo-tab-${mode.id}`}
                  aria-selected={demoMode === mode.id}
                  aria-controls={`demo-panel-${mode.id}`}
                  className={demoMode === mode.id ? styles.activeTab : ""}
                  onClick={() => setDemoMode(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <a
              href={DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.textLink}
            >
              Abrir a experiência real
              <ArrowUpRight size={14} strokeWidth={1.4} />
            </a>
          </div>

          <RevealOnScroll className={styles.demoPhoneWrap}>
            <InteractivePhone mode={demoMode} />
            <p>Simulação fiel da interface · conteúdo de uma edição HAXR real</p>
          </RevealOnScroll>
        </div>
      </section>

      <section className={styles.keepsake} aria-labelledby="keepsake-title">
        <div className={`${styles.container} ${styles.keepsakeGrid}`}>
          <div className={styles.keepsakeImages}>
            <figure className={styles.keepsakeImageMain}>
              <Image
                src="/images/plus-memories/traditional-couple.jpg"
                alt="Jessica e Samuel no casamento tradicional, registo real partilhado no mural"
                fill
                sizes="(max-width: 767px) 74vw, 31vw"
              />
              <figcaption>Casamento tradicional · Memória partilhada por convidado</figcaption>
            </figure>
            <figure className={styles.keepsakeImageSmall}>
              <Image
                src="/images/plus-memories/traditional-celebration.jpg"
                alt="Convidados a celebrar com Jessica e Samuel numa memória real"
                fill
                sizes="(max-width: 767px) 42vw, 18vw"
              />
            </figure>
          </div>

          <div className={styles.keepsakeCopy}>
            <RevealOnScroll>
              <p className={styles.eyebrow}>O que fica no final</p>
              <h2 id="keepsake-title">Todas as perspectivas. Todos os detalhes. Uma memória para sempre.</h2>
              <p>
                No final do evento, os noivos ficam com fotografias, vídeos e
                momentos espontâneos captados por diferentes convidados,
                reunidos numa experiência que prolonga a emoção do grande dia.
              </p>
            </RevealOnScroll>

            <div className={styles.keepsakeFeatures}>
              {keepsakes.map(({ icon: Icon, title, body }, index) => (
                <RevealOnScroll key={title} delay={index * 0.035}>
                  <article>
                    <Icon size={18} strokeWidth={1.25} aria-hidden="true" />
                    <div>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </div>
                  </article>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.explorer} aria-labelledby="explorer-title">
        <div className={`${styles.container} ${styles.explorerGrid}`}>
          <RevealOnScroll>
            <div className={styles.explorerCopy}>
              <p className={styles.optionalLabel}>Funcionalidade opcional</p>
              <Trophy size={28} strokeWidth={1.15} aria-hidden="true" />
              <p className={styles.eyebrow}>Explorador da Noite</p>
              <h2 id="explorer-title">Uma dinâmica subtil para convidar todos a participar.</h2>
              <p>
                Quem quiser pode entrar no desafio e tentar completar o maior
                número de momentos únicos. Participar é sempre uma escolha; a
                experiência continua disponível para quem preferir apenas
                partilhar memórias.
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={0.08}>
            <div className={styles.rankingCard} aria-label="Simulação visual de classificação">
              <div className={styles.rankingHeader}>
                <div>
                  <span>Simulação visual</span>
                  <h3>Exploradores da noite</h3>
                </div>
                <Trophy size={21} strokeWidth={1.25} />
              </div>
              <ol>
                {[
                  ["01", "Participante 01", "10 de 12"],
                  ["02", "Participante 02", "8 de 12"],
                  ["03", "Participante 03", "7 de 12"],
                ].map(([position, name, score]) => (
                  <li key={position}>
                    <span>{position}</span>
                    <p>{name}</p>
                    <strong>{score} desafios</strong>
                  </li>
                ))}
              </ol>
              <p className={styles.rankingNote}>
                Classificação por momentos únicos concluídos. A identidade é
                usada apenas para esta dinâmica da celebração.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className={styles.formats} aria-labelledby="formats-title">
        <div className={styles.container}>
          <RevealOnScroll>
            <div className={styles.sectionIntro}>
              <p className={styles.eyebrow}>Uma experiência, duas formas de chegar ao evento</p>
              <h2 id="formats-title">Plus Memories como produto.</h2>
              <p>
                Escolha a experiência independente ou integre-a no ecossistema
                do convite digital HAXR.
              </p>
            </div>
          </RevealOnScroll>

          <div className={styles.formatGrid}>
            <RevealOnScroll>
              <article>
                <span className={styles.formatNumber}>01</span>
                <p className={styles.formatKicker}>Produto independente</p>
                <h3>Plus Memories</h3>
                <p>
                  Uma experiência autónoma para a celebração, acessível por QR
                  Code e preparada para reunir desafios, fotografias e vídeos.
                </p>
                <ul>
                  <li><Check size={14} /> QR Code dedicado</li>
                  <li><Check size={14} /> Desafios e momento livre</li>
                  <li><Check size={14} /> Álbum colectivo</li>
                </ul>
                <Link href="/contacto?tipo=convite-digital#contacto">
                  Pedir proposta <ArrowRight size={14} />
                </Link>
              </article>
            </RevealOnScroll>

            <RevealOnScroll delay={0.08}>
              <article className={styles.featuredFormat}>
                <span className={styles.formatNumber}>02</span>
                <p className={styles.formatKicker}>Ecossistema completo</p>
                <h3>Convite HAXR + Plus Memories</h3>
                <p>
                  O convite anuncia a celebração; o Plus Memories prolonga-a.
                  Uma narrativa visual ligada antes, durante e depois do evento.
                </p>
                <ul>
                  <li><Check size={14} /> Tudo do produto independente</li>
                  <li><Check size={14} /> Ligação ao Web-Convite HAXR</li>
                  <li><Check size={14} /> Direcção visual coerente</li>
                </ul>
                <Link href="/contacto?tipo=convite-digital#contacto">
                  Criar o meu ecossistema <ArrowRight size={14} />
                </Link>
              </article>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      <PlusMemoriesPackages />

      <section className={styles.finalCta} aria-labelledby="final-cta-title">
        <div className={styles.finalCtaTexture} aria-hidden="true" />
        <div className={styles.container}>
          <RevealOnScroll>
            <BrandMark wordmark />
            <p className={styles.eyebrow}>Plus Memories · HAXR Signature</p>
            <h2 id="final-cta-title">Pronto para transformar o seu evento numa memória viva?</h2>
            <p>
              Conte-nos a data, o tipo de celebração e como imagina a
              participação dos seus convidados.
            </p>
            <div className={styles.finalActions}>
              <Link href="/contacto?tipo=convite-digital#contacto" className={styles.primaryButton}>
                Quero Plus Memories no meu evento
                <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
              <a
                href={siteContact.whatsapp.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.finalSecondary}
              >
                Falar com a HAXR
                <ArrowUpRight size={15} strokeWidth={1.5} />
              </a>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  );
}
