"use client";

import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Fingerprint,
  Images,
  MapPin,
  MessageCircle,
  QrCode,
  Search,
  Upload,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import styles from "./invitation-atelier.module.css";

type Project = {
  number: string;
  title: string;
  edition: string;
  copy: string;
  href: string;
  image?: string;
  imageAlt?: string;
  external?: boolean;
  tone: "vania" | "jessica" | "kulaya";
};

type Package = {
  id: "prologo" | "elo" | "legado";
  name: string;
  price: string;
  product: string;
  badge?: string;
  tagline: string;
  features: readonly string[];
};

const projects: readonly Project[] = [
  {
    number: "01 / 03",
    title: "Vânia & Fabião",
    edition: "Wedding · Signature Edition",
    copy: "Uma história vestida para o primeiro encontro.",
    href: "/experiencias/casamento-vania-fabiao",
    image: "/images/convite-mockup-vania-fabiao.png",
    imageAlt: "Web-Convite real de Vânia Luky e Fabião Dimande",
    tone: "vania",
  },
  {
    number: "02 / 03",
    title: "Jessica & Samuel",
    edition: "Save the Date · Editorial Edition",
    copy: "O primeiro capítulo de uma nova história, apresentado como uma peça editorial.",
    href: "/experiencias/save-the-date-jessica-samuel",
    image: "/images/save-the-date-jessica-samuel-preview.png",
    imageAlt: "Save the Date real de Jessica Muege e Samuel Govene",
    tone: "jessica",
  },
  {
    number: "03 / 03",
    title: "Jessica · Kulaya",
    edition: "Cerimónia de Transição · Cultural Edition",
    copy: "Tradição, identidade e presença traduzidas para uma experiência digital contemporânea.",
    href: "https://edition.haxrsignature.com/jessicakulaya",
    image: "/images/kulaya-jessica-opening-real.png",
    imageAlt: "Abertura real do Web-Convite Jessica Kulaya",
    external: true,
    tone: "kulaya",
  },
] as const;

const webInviteCapabilities = [
  { label: "RSVP", note: "Confirmação de presença no próprio Web-Convite." },
  { label: "Música", note: "Uma atmosfera sonora escolhida para a celebração." },
  { label: "Contagem Regressiva", note: "O tempo até ao encontro, sempre actualizado." },
  { label: "Localização", note: "Acesso directo ao local através do mapa." },
  { label: "Galeria", note: "Fotografias apresentadas com ritmo editorial." },
  { label: "Save the Date", note: "O primeiro anúncio, pronto para partilhar." },
  { label: "Presentes", note: "Informação clara, integrada na mesma experiência." },
  { label: "Plus Memories", note: "Momentos partilhados pelos convidados por QR Code." },
  { label: "Find Your Seat", note: "Do nome à mesa certa em poucos segundos." },
] as const;

const occasions = [
  { id: "casamento", label: "Casamento & Lobolo" },
  { id: "noivado", label: "Noivado" },
  { id: "aniversario", label: "Aniversários" },
  { id: "graduacao", label: "Graduações" },
  { id: "corporativo", label: "Corporativo" },
] as const;

const packages: readonly Package[] = [
  {
    id: "prologo",
    name: "Prólogo",
    price: "MT 7.999",
    product: "Web-Convite HAXR",
    tagline: "A história começa aqui.",
    features: [
      "Web-Convite Personalizado HAXR",
      "Save the Date Básico em Vídeo",
      "Design Essencial HAXR",
      "Música de Fundo",
      "Declaração dos Noivos",
      "Localização via Google Maps",
      "RSVP — Confirmação de Presença",
      "Contagem Regressiva",
      "Galeria de Fotografias",
      "Feed de Felicitações",
    ],
  },
  {
    id: "elo",
    name: "Elo",
    price: "MT 15.999",
    product: "Web-Convite Premium HAXR",
    badge: "Mais escolhido",
    tagline: "Mais detalhes. Mais presença. Mais memória.",
    features: [
      "Todas as funcionalidades do Prólogo",
      "Sessão de Fotos Pre-Wedding — 3 fotografias",
      "Save the Date Personalizado em Vídeo",
      "Design Personalizado",
      "Presente de Casamento",
      "Lembrete da Data do Evento",
      "Dress Code",
      "Plus Memories — até 150 convidados",
    ],
  },
  {
    id: "legado",
    name: "Legado",
    price: "MT 25.000",
    product: "Web-Convite de Alta-Costura HAXR",
    badge: "Experiência mais completa",
    tagline: "Criado para viver antes, durante e depois do grande dia.",
    features: [
      "Todas as funcionalidades do Prólogo + Elo",
      "Sessão de Fotos Pre-Wedding — 5 fotografias",
      "Save the Date Premium",
      "Design Premium de Alta-Costura",
      "Vídeo Pre-Wedding integrado no Web-Convite",
      "Agenda para Múltiplos Momentos e Localizações",
      "Plus Memories · Full Experience",
      "Find Your Seat · Pesquisa de Mesa por QR Code",
    ],
  },
] as const;

const comparisonRows = [
  ["Web-Convite", "HAXR", "Premium", "Alta-Costura"],
  ["RSVP", "✓", "✓", "✓"],
  ["Save the Date", "Básico", "Personalizado", "Premium"],
  ["Sessão Pre-Wedding", "—", "3 fotos", "5 fotos"],
  ["Música", "✓", "✓", "✓"],
  ["Localização", "✓", "✓", "✓"],
  ["Galeria", "✓", "✓", "✓"],
  ["Dress Code", "—", "✓", "✓"],
  ["Presentes", "—", "✓", "✓"],
  ["Plus Memories", "—", "Até 150", "Full Experience"],
  ["Vídeos Plus Memories", "—", "—", "✓"],
  ["Galeria Pós-Evento", "—", "—", "✓"],
  ["Find Your Seat", "—", "—", "✓"],
  ["Múltiplos Momentos", "—", "—", "✓"],
] as const;

const processSteps = [
  ["01", "Escutamos", "A história, a celebração e a sensação que deve permanecer."],
  ["02", "Editamos", "Transformamos conteúdo real num conceito e numa narrativa coerente."],
  ["03", "Construímos", "Desenhamos a experiência mobile-first, detalhe a detalhe."],
  ["04", "Ensaiamos", "Testamos conteúdo, links, RSVP e dispositivos antes da publicação."],
] as const;

const faqs = [
  {
    question: "O Web-Convite é criado a partir de um modelo?",
    answer:
      "Não. Cada projecto parte do conteúdo real da celebração e recebe uma direcção criativa própria. A Montra mostra três linguagens diferentes precisamente porque não trabalhamos por template.",
  },
  {
    question: "Funciona correctamente em telemóveis?",
    answer:
      "Sim. A experiência é desenhada primeiro para telemóvel e depois refinada para tablet e desktop, mantendo leitura, velocidade e navegação simples.",
  },
  {
    question: "O RSVP acontece no próprio Web-Convite?",
    answer:
      "Sim. A confirmação de presença faz parte da experiência e evita que o convidado tenha de instalar aplicações ou descarregar ficheiros.",
  },
  {
    question: "Plus Memories e Find Your Seat estão disponíveis em todos os pacotes?",
    answer:
      "O Plus Memories até 150 convidados integra o Elo. A Full Experience e o Find Your Seat integram o Legado, conforme a comparação apresentada acima.",
  },
  {
    question: "Como começa o projecto?",
    answer:
      "Começa com um briefing para compreender a celebração, o conteúdo disponível, o tom visual e o que os convidados precisam de saber e fazer.",
  },
] as const;

function EditorialLabel({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`${styles.eyebrow} ${light ? styles.eyebrowLight : ""}`}>
      {children}
    </p>
  );
}

function ProjectVisual({ project }: { project: Project }) {
  if (project.image) {
    return (
      <div className={`${styles.projectImageWrap} ${styles[`projectImageWrap${project.tone}`]}`}>
        <Image
          src={project.image}
          alt={project.imageAlt ?? ""}
          fill
          sizes="(max-width: 767px) calc(100vw - 48px), 48vw"
          className={styles.projectImage}
          quality={92}
        />
      </div>
    );
  }

  return null;
}

function MontraViva() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeProject, setActiveProject] = useState(0);
  const [sequenced, setSequenced] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 768px)");
    const shouldSequence = !reducedMotion.matches && desktop.matches;
    setSequenced(shouldSequence);
    if (!shouldSequence) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      section.style.setProperty("--montra-progress", progress.toFixed(4));
      const nextProject = Math.min(projects.length - 1, Math.floor(progress * projects.length));
      setActiveProject((current) => (current === nextProject ? current : nextProject));
    };
    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section id="montra" ref={sectionRef} className={styles.showcase} aria-labelledby="montra-title">
      <div className={styles.showcaseStage}>
        <div className={styles.showcaseHeader}>
          <EditorialLabel light>Montra Viva HAXR · Obras publicadas</EditorialLabel>
          <div className={styles.showcaseProgress} aria-label={`Projecto ${activeProject + 1} de ${projects.length}`}>
            <span>{String(activeProject + 1).padStart(2, "0")}</span>
            <i aria-hidden="true" />
            <span>03</span>
          </div>
        </div>

        <h2 id="montra-title" className="sr-only">Três Web-Convites reais apresentados numa narrativa de scroll</h2>
        <div className={styles.showcaseScenes}>
          {projects.map((project, index) => {
            const sceneState = activeProject === index ? styles.sceneActive : activeProject > index ? styles.scenePast : styles.sceneFuture;
            const linkProps = project.external ? { target: "_blank", rel: "noreferrer" } : {};
            return (
              <article
                key={project.title}
                className={`${styles.showcaseScene} ${styles[`scene${index + 1}`]} ${sceneState}`}
                aria-hidden={sequenced && activeProject !== index ? true : undefined}
              >
                <div className={styles.projectCopy}>
                  <p className={styles.projectNumber}>{project.number}</p>
                  <p className={styles.projectEdition}>{project.edition}</p>
                  <h3>{project.title}</h3>
                  <p className={styles.projectDescription}>{project.copy}</p>
                  <Link href={project.href} {...linkProps} className={styles.textLink} tabIndex={!sequenced || activeProject === index ? 0 : -1}>
                    Explorar Web-Convite <ArrowRight aria-hidden="true" />
                  </Link>
                </div>
                <ProjectVisual project={project} />
              </article>
            );
          })}
        </div>
        <p className={styles.scrollCue} aria-hidden="true">Continue a percorrer</p>
      </div>
    </section>
  );
}

function WebInviteDemo() {
  const stepsRef = useRef<HTMLDivElement>(null);
  const [activeCapability, setActiveCapability] = useState(0);

  useEffect(() => {
    const root = stepsRef.current;
    if (!root || !("IntersectionObserver" in window)) return;
    const elements = Array.from(root.querySelectorAll<HTMLElement>("[data-capability]"));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveCapability(Number((visible.target as HTMLElement).dataset.capability ?? 0));
      },
      { rootMargin: "-38% 0px -38% 0px", threshold: [0, 0.25, 0.75] }
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.webInviteSection} aria-labelledby="web-invite-title">
      <div className={styles.sectionIntro}>
        <EditorialLabel>Não é um PDF. Não é uma imagem.</EditorialLabel>
        <h2 id="web-invite-title">É um Web-Convite.</h2>
        <p>
          Uma experiência online interactiva criada exclusivamente para a celebração — acessível através de um único link, sem aplicações e sem downloads.
        </p>
      </div>

      <div className={styles.webInviteStory}>
        <div className={styles.webInvitePhoneColumn}>
          <div className={styles.webInvitePhone}>
            <div className={styles.phoneSpeaker} aria-hidden="true" />
            <Image
              src="/images/convite-preview-portrait.png"
              alt="Vista real do Web-Convite de Vânia e Fabião"
              fill
              sizes="(max-width: 767px) 66vw, 22rem"
              className={styles.webInvitePhoneImage}
            />
          </div>
          <div className={styles.capabilityNow} aria-live="polite">
            <span>{String(activeCapability + 1).padStart(2, "0")} / 09</span>
            <strong>{webInviteCapabilities[activeCapability].label}</strong>
          </div>
        </div>

        <div ref={stepsRef} className={styles.capabilitySteps}>
          {webInviteCapabilities.map((capability, index) => (
            <article
              key={capability.label}
              data-capability={index}
              className={`${styles.capabilityStep} ${activeCapability === index ? styles.capabilityStepActive : ""}`}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{capability.label}</h3>
                <p>{capability.note}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className={styles.oneLinkStatement}>
        <span>Um link.</span>
        <strong>Uma experiência inteira.</strong>
      </div>
    </section>
  );
}

function PackageDetails({ packageItem }: { packageItem: Package }) {
  if (packageItem.id === "elo") {
    return (
      <div className={styles.packageFeaturePanel}>
        <p className={styles.packageFeatureLabel}>Plus Memories · Até 150 convidados</p>
        <p>Os momentos do grande dia registados também pelos olhos dos convidados.</p>
        <ul>
          {["Fotografias dos convidados", "Mensagens", "Galeria colaborativa", "QR Code", "Até 150 convidados"].map((item) => (
            <li key={item}><Check aria-hidden="true" /> {item}</li>
          ))}
        </ul>
        <small>Esta versão não inclui vídeos.</small>
      </div>
    );
  }

  if (packageItem.id === "legado") {
    return (
      <div className={styles.packageFeaturePanels}>
        <div className={styles.packageFeaturePanel}>
          <p className={styles.packageFeatureLabel}>Plus Memories · Full Experience</p>
          <ul>
            {["Fotografias e vídeos", "Mensagens e dedicatórias", "QR Code dedicado", "Galeria colaborativa", "Participação durante o evento", "Galeria pós-evento", "Acesso depois da celebração"].map((item) => (
              <li key={item}><Check aria-hidden="true" /> {item}</li>
            ))}
          </ul>
        </div>
        <div className={styles.packageFeaturePanel}>
          <p className={styles.packageFeatureLabel}>Find Your Seat · Pesquisa por QR Code</p>
          <p>Um scan. Um nome. A mesa certa.</p>
          <ol className={styles.miniFlow}>
            <li><span>01</span> Digitalizar QR Code</li>
            <li><span>02</span> Pesquisar nome</li>
            <li><span>03</span> Encontrar mesa</li>
          </ol>
        </div>
      </div>
    );
  }

  return null;
}

function PackageCard({ packageItem }: { packageItem: Package }) {
  const [expanded, setExpanded] = useState(false);
  const visibleFeatures = packageItem.features.slice(0, 6);
  const hiddenFeatures = packageItem.features.slice(6);

  return (
    <article className={`${styles.packageCard} ${styles[`package${packageItem.id}`]}`}>
      <div className={styles.packageTopline}>
        <span>Colecção {packageItem.id === "prologo" ? "01" : packageItem.id === "elo" ? "02" : "03"}</span>
        {packageItem.badge ? <strong>{packageItem.badge}</strong> : null}
      </div>
      <h3>{packageItem.name}</h3>
      <p className={styles.packageProduct}>{packageItem.product}</p>
      <p className={styles.packagePrice}>{packageItem.price}</p>
      <p className={styles.packageTagline}>{packageItem.tagline}</p>

      <ul className={styles.packageList} aria-label={`Principais elementos do ${packageItem.name}`}>
        {visibleFeatures.map((feature) => (
          <li key={feature}><Check aria-hidden="true" /> <span>{feature}</span></li>
        ))}
        {expanded
          ? hiddenFeatures.map((feature) => (
              <li key={feature}><Check aria-hidden="true" /> <span>{feature}</span></li>
            ))
          : null}
      </ul>

      {expanded ? <PackageDetails packageItem={packageItem} /> : null}

      <button type="button" onClick={() => setExpanded((value) => !value)} className={styles.expandButton} aria-expanded={expanded}>
        {expanded ? "Recolher detalhes" : "Ver tudo o que inclui"}
        <ChevronDown aria-hidden="true" className={expanded ? styles.chevronOpen : ""} />
      </button>

      <Link href={`/contacto?tipo=convite-digital&pacote=${packageItem.id}`} className={styles.packageCta}>
        Escolher {packageItem.name} <ArrowRight aria-hidden="true" />
      </Link>
    </article>
  );
}

function PackageComparison() {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.comparison}>
      <button type="button" className={styles.comparisonToggle} onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        {open ? "Ocultar comparação" : "Comparar os três pacotes"}
        <ChevronDown aria-hidden="true" className={open ? styles.chevronOpen : ""} />
      </button>
      {open ? (
        <div className={styles.tableScroller}>
          <table>
            <thead>
              <tr><th>Funcionalidade</th><th>Prólogo</th><th>Elo</th><th>Legado</th></tr>
            </thead>
            <tbody>
              {comparisonRows.map(([feature, prologo, elo, legado]) => (
                <tr key={feature}>
                  <th scope="row">{feature}</th>
                  <td>{prologo}</td><td>{elo}</td><td>{legado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function PackagesSection() {
  const [activeOccasion, setActiveOccasion] = useState<(typeof occasions)[number]["id"]>("casamento");
  const selectedOccasion = occasions.find((occasion) => occasion.id === activeOccasion) ?? occasions[0];

  return (
    <section id="pacotes" className={styles.packagesSection} aria-labelledby="packages-title">
      <div className={styles.sectionIntroWide}>
        <div>
          <EditorialLabel>Colecções HAXR</EditorialLabel>
          <h2 id="packages-title">Escolha a profundidade da experiência.</h2>
        </div>
        <p>Três níveis claros. A mesma atenção ao detalhe, com mais conteúdo, presença e memória em cada etapa.</p>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Tipo de celebração">
        {occasions.map((occasion, index) => (
          <button
            key={occasion.id}
            type="button"
            role="tab"
            aria-selected={activeOccasion === occasion.id}
            aria-controls="occasion-panel"
            onClick={() => setActiveOccasion(occasion.id)}
            className={activeOccasion === occasion.id ? styles.tabActive : ""}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>{occasion.label}
          </button>
        ))}
      </div>

      <div id="occasion-panel" role="tabpanel" className={styles.occasionPanel}>
        {activeOccasion === "casamento" ? (
          <>
            <div className={styles.packageGrid}>
              {packages.map((packageItem) => <PackageCard key={packageItem.id} packageItem={packageItem} />)}
            </div>
            <p className={styles.priceNote}>Valores em meticais (MT). Personalizações adicionais são sempre apresentadas na proposta HAXR.</p>
            <PackageComparison />
          </>
        ) : (
          <div className={styles.occasionContact}>
            <span>{selectedOccasion.label}</span>
            <h3>Uma proposta desenhada para a ocasião.</h3>
            <p>Os pacotes comerciais publicados nesta fase aplicam-se a Casamento & Lobolo.</p>
            <Link href="/contacto?tipo=convite-digital" className={styles.darkCta}>Falar com o atelier <ArrowRight aria-hidden="true" /></Link>
          </div>
        )}
      </div>
    </section>
  );
}

function PlusMemories() {
  return (
    <section className={styles.memoriesSection} aria-labelledby="memories-title">
      <div className={styles.memoriesCopy}>
        <EditorialLabel light>Plus Memories</EditorialLabel>
        <h2 id="memories-title">O fotógrafo conta a história.</h2>
        <p className={styles.memoriesCounterpoint}>Os convidados revelam tudo o resto.</p>
        <p>Um QR Code abre um espaço ligado à celebração, onde cada olhar pode acrescentar fotografias, vídeos e mensagens — de acordo com o pacote escolhido.</p>
        <div className={styles.memoriesLegend}>
          <span><QrCode aria-hidden="true" /> Scan simples</span>
          <span><Upload aria-hidden="true" /> Partilha no momento</span>
          <span><Images aria-hidden="true" /> Galeria colaborativa</span>
        </div>
      </div>

      <div className={styles.memoryComposition} aria-label="Demonstração visual do Plus Memories">
        <div className={styles.memoryPhoto}>
          <Image src="/images/convite-preview-portrait.png" alt="Vânia e Fabião, projecto real HAXR" fill sizes="(max-width: 767px) 72vw, 26rem" />
          <span><Clock3 aria-hidden="true" /> 18:42</span>
        </div>
        <div className={`${styles.memoryNotice} ${styles.memoryNoticePhoto}`}>
          <Images aria-hidden="true" /><div><strong>Foto adicionada</strong><span>Agora</span></div>
        </div>
        <div className={`${styles.memoryNotice} ${styles.memoryNoticeMessage}`}>
          <MessageCircle aria-hidden="true" /><div><strong>Mensagem recebida</strong><span>18:44</span></div>
        </div>
        <div className={`${styles.memoryNotice} ${styles.memoryNoticeVideo}`}>
          <Video aria-hidden="true" /><div><strong>Vídeo 00:08</strong><span>Full Experience</span></div>
        </div>
        <div className={styles.memoryQr}><QrCode aria-hidden="true" /><span>Scan & partilhe</span></div>
      </div>
    </section>
  );
}

function FindYourSeat() {
  const [revealed, setRevealed] = useState(false);
  return (
    <section className={styles.seatSection} aria-labelledby="seat-title">
      <div className={styles.seatHeading}>
        <EditorialLabel>Find Your Seat</EditorialLabel>
        <h2 id="seat-title">Um scan. Um nome. A mesa certa.</h2>
        <p>O convidado pesquisa o nome e recebe a indicação de mesa em poucos segundos.</p>
      </div>

      <div className={styles.seatDemo}>
        <div className={styles.seatSearchCard}>
          <label htmlFor="seat-demo-name">Pesquisar o seu nome</label>
          <div className={styles.searchField}>
            <Search aria-hidden="true" />
            <input id="seat-demo-name" value="Jessica Mucavele" readOnly />
          </div>
          <button type="button" onClick={() => setRevealed(true)}>
            Ver a minha mesa <ArrowRight aria-hidden="true" />
          </button>
          <div className={`${styles.seatResult} ${revealed ? styles.seatResultVisible : ""}`} aria-live="polite" aria-hidden={!revealed}>
            <span>Resultado encontrado</span>
            <strong>Mesa 08</strong>
            <p><MapPin aria-hidden="true" /> Jardim</p>
          </div>
        </div>

        <div className={styles.seatQrCard} aria-hidden="true">
          <QrCode />
          <span>01</span><p>Digitalizar</p>
          <span>02</span><p>Pesquisar</p>
          <span>03</span><p>Encontrar</p>
        </div>
      </div>
    </section>
  );
}

function IdentitySection() {
  return (
    <section className={styles.identitySection} aria-labelledby="identity-title">
      <div className={styles.identityCopy}>
        <EditorialLabel light>Da tela para o espaço</EditorialLabel>
        <h2 id="identity-title">Uma identidade que continua depois do clique.</h2>
        <p>Monograma, tipografia, paleta e composição tornam-se um sistema vivo — do Save the Date à sinalética, da mesa ao último agradecimento.</p>
      </div>
      <div className={styles.identityGrid}>
        <article className={styles.monogramCard}><Fingerprint aria-hidden="true" /><div><strong>H & H</strong><span>Monograma proprietário</span></div></article>
        <article className={styles.colourCard}><span>Matéria cromática</span><div><i /><i /><i /><i /></div><strong>Cor com intenção.</strong></article>
        <article className={styles.voiceCard}><span>Voz visual</span><strong>Detalhe que se sente antes de se explicar.</strong><p>Tipografia · Ritmo<br />Imagem · Presença</p></article>
      </div>
    </section>
  );
}

function ProcessAndFaq() {
  return (
    <>
      <section className={styles.processSection} aria-labelledby="process-title">
        <div><EditorialLabel>O atelier</EditorialLabel><h2 id="process-title">Quatro gestos. Uma assinatura.</h2></div>
        <ol>
          {processSteps.map(([number, title, copy]) => <li key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></li>)}
        </ol>
      </section>
      <section className={styles.faqSection} aria-labelledby="faq-title">
        <div><EditorialLabel>Antes de começarmos</EditorialLabel><h2 id="faq-title">Clareza também é luxo.</h2></div>
        <div className={styles.faqList}>
          {faqs.map((faq, index) => (
            <details key={faq.question}>
              <summary><span><i>0{index + 1}</i>{faq.question}</span><b aria-hidden="true">+</b></summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

export default function InvitationAtelierExperience() {
  const heroVisualRef = useRef<HTMLDivElement>(null);

  const handleHeroPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const visual = heroVisualRef.current;
    if (!visual || event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = visual.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    visual.style.setProperty("--hero-tilt-x", `${(-y * 2.2).toFixed(2)}deg`);
    visual.style.setProperty("--hero-tilt-y", `${(x * 2.2).toFixed(2)}deg`);
    visual.style.setProperty("--hero-shift-x", `${(x * 7).toFixed(2)}px`);
    visual.style.setProperty("--hero-shift-y", `${(y * 7).toFixed(2)}px`);
  };

  const resetHeroPointer = () => {
    const visual = heroVisualRef.current;
    if (!visual) return;
    visual.style.setProperty("--hero-tilt-x", "0deg");
    visual.style.setProperty("--hero-tilt-y", "0deg");
    visual.style.setProperty("--hero-shift-x", "0px");
    visual.style.setProperty("--hero-shift-y", "0px");
  };

  return (
    <main className={styles.atelierPage}>
      <header className={styles.hero}>
        <div className={styles.heroRule}>
          <EditorialLabel>Atelier HAXR · Alta-Costura Digital</EditorialLabel>
          <span>Maputo · Moçambique</span>
        </div>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <h1>Vestimos histórias para o primeiro encontro.</h1>
            <p>Web-Convites e identidades visuais concebidos à medida de cada celebração.</p>
            <div className={styles.heroActions}>
              <Link href="/contacto?tipo=convite-digital" className={styles.primaryCta}>Marcar briefing <ArrowRight aria-hidden="true" /></Link>
              <Link href="#montra" className={styles.secondaryCta}>Entrar na Montra <ArrowDownRight aria-hidden="true" /></Link>
            </div>
          </div>
          <div
            ref={heroVisualRef}
            className={styles.heroVisual}
            onPointerMove={handleHeroPointer}
            onPointerLeave={resetHeroPointer}
          >
            <div className={styles.heroImageFrame}>
              <Image
                src="/images/convite-mockup-vania-fabiao.png"
                alt="Composição real do Web-Convite de Vânia e Fabião"
                fill
                priority
                quality={94}
                sizes="(max-width: 767px) 86vw, 46vw"
                className={styles.heroImage}
              />
              <span className={styles.heroReflection} aria-hidden="true" />
            </div>
            <p><span>Projecto real</span> Vânia & Fabião · 2026</p>
          </div>
        </div>
        <a href="#montra" className={styles.heroScrollCue}><span>Descer para descobrir</span><i aria-hidden="true" /></a>
      </header>

      <MontraViva />

      <section className={styles.showcaseClosing}>
        <EditorialLabel>Nenhum template.</EditorialLabel>
        <h2>Cada celebração encontra a sua própria linguagem.</h2>
        <Link href="/portfolio" className={styles.darkCta}>Ver mais experiências <ArrowRight aria-hidden="true" /></Link>
      </section>

      <WebInviteDemo />
      <PackagesSection />
      <PlusMemories />
      <FindYourSeat />
      <IdentitySection />
      <ProcessAndFaq />

      <section className={styles.finalCta}>
        <EditorialLabel>Comissione uma peça HAXR</EditorialLabel>
        <div><h2>A próxima história não precisa de se parecer com nenhuma anterior.</h2><p>Conte-nos o que estão a celebrar e como querem que os convidados se sintam.</p></div>
        <Link href="/contacto?tipo=convite-digital" className={styles.darkCta}>Iniciar briefing <ArrowRight aria-hidden="true" /></Link>
      </section>
    </main>
  );
}
