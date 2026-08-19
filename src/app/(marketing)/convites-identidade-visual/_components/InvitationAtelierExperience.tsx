"use client";

import {
  ArrowRight,
  ChevronDown,
  Clock3,
  Crown,
  Feather,
  Fingerprint,
  Gift,
  Images,
  Layers,
  MapPin,
  MessageCircle,
  Music,
  QrCode,
  Search,
  Upload,
  UserCheck,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useRef, useState } from "react";
import styles from "./invitation-atelier.module.css";
import IPhone17Frame from "@/components/ui/IPhone17Frame";

type Project = {
  number: string;
  title: string;
  edition: string;
  copy: string;
  href: string;
  embedUrl: string;
  image: string;
  imageAlt: string;
  external?: boolean;
  tone: "vania" | "jessica" | "kulaya";
  details: readonly string[];
};

type PackageFeatureGroup = {
  category: string;
  items: readonly string[];
};

type Package = {
  id: "prologo" | "elo" | "legado";
  editionNumber: string;
  name: string;
  price: string;
  product: string;
  badge?: string;
  tagline: string;
  manifesto: string;
  icon: typeof Feather;
  featureGroups: readonly PackageFeatureGroup[];
};

const projects: readonly Project[] = [
  {
    number: "01 / 03",
    title: "Vânia & Fabião",
    edition: "Wedding · Signature Edition",
    copy: "Uma história vestida para o primeiro encontro — refinamento clássico com presença contemporânea.",
    href: "/experiencias/casamento-vania-fabiao",
    embedUrl: "https://casamento-vania-fabiao.vercel.app/",
    image: "/images/convite-mockup-vania-fabiao.png",
    imageAlt: "Web-Convite real de Vânia Luky e Fabião Dimande",
    tone: "vania",
    details: ["Abertura Sonora", "Narrativa de Casamento", "RSVP em Tempo Real", "Paleta Champagne"],
  },
  {
    number: "02 / 03",
    title: "Jessica & Samuel",
    edition: "Save the Date · Editorial Edition",
    copy: "O primeiro capítulo de uma nova história, apresentado como uma peça de moda e imprensa editorial.",
    href: "/experiencias/save-the-date-jessica-samuel",
    embedUrl: "https://jessica-samuel-save-the-date.vercel.app/",
    image: "/images/save-the-date-jessica-samuel-preview.png",
    imageAlt: "Save the Date real de Jessica Muege e Samuel Govene",
    tone: "jessica",
    details: ["Composição Editorial", "Guia de Dress Code", "Contagem Decrescente", "Ritmo de Tipografia"],
  },
  {
    number: "03 / 03",
    title: "Jessica · Kulaya",
    edition: "Cerimónia de Transição · Cultural Edition",
    copy: "Tradição, identidade e presença traduzidas para uma experiência digital contemporânea e cerimonial.",
    href: "https://edition.haxrsignature.com/jessicakulaya",
    embedUrl: "https://edition.haxrsignature.com/jessicakulaya",
    image: "/images/kulaya-jessica-opening-real.png",
    imageAlt: "Abertura real do Web-Convite Jessica Kulaya",
    external: true,
    tone: "kulaya",
    details: ["Simbolismo Cultural", "Abertura Majestosa", "Direção Artística Única", "Presença Institucional"],
  },
] as const;

/** Núcleo essencial do Web-Convite HAXR */
const coreCapabilities = [
  { icon: UserCheck, label: "RSVP Directo", note: "Confirmação de presença instantânea no próprio Web-Convite, sem formulários externos ou descargas." },
  { icon: Music, label: "Abertura Sonora", note: "Uma atmosfera acústica singular selecionada para introduzir a emoção da celebração." },
  { icon: Clock3, label: "Contagem Regressiva", note: "O tempo exato até ao grande encontro, com contagem viva até aos segundos." },
  { icon: MapPin, label: "Localização Maps", note: "Acesso direto a rotas no Google Maps e Waze para a cerimónia e recepção." },
  { icon: Images, label: "Galeria Editorial", note: "Fotografias do casal apresentadas com diagrama de moda e ritmo de revista." },
  { icon: Gift, label: "Presentes & Dress Code", note: "Informações completas e elegantes sobre presentes e recomendações de vestuário." },
] as const;

/** Extensões do Ecossistema HAXR que ampliam a celebração */
const ecosystemExtensions = [
  {
    label: "Save the Date",
    badge: "Antes",
    note: "O primeiro anúncio em vídeo e peça digital para marcar a data antes da publicação do convite principal.",
  },
  {
    label: "Plus Memories",
    badge: "Durante & Depois",
    note: "Espaço colaborativo via QR Code para capturar o grande dia pelos olhos e memórias dos convidados.",
  },
  {
    label: "Find Your Seat",
    badge: "No Evento",
    note: "Pesquisa de mesa instantânea por nome através de QR Code no recinto da celebração.",
  },
] as const;

const occasions = [
  { id: "casamento", label: "Casamento & Lobolo" },
  { id: "noivado", label: "Noivado Editorial" },
  { id: "aniversario", label: "Aniversário Majestoso" },
  { id: "graduacao", label: "Graduação & Transição" },
  { id: "corporativo", label: "Gala & Corporativo" },
] as const;

const packages: readonly Package[] = [
  {
    id: "prologo",
    editionNumber: "Edicional N.º I",
    name: "Prólogo",
    price: "MT 7.999",
    product: "Web-Convite HAXR · Essencial",
    tagline: "A essência pura do primeiro encontro.",
    manifesto: "Desenhado para quem deseja uma introdução poética e imediata — sem ruído, com tipografia impecável e presença digital irrepreensível.",
    icon: Feather,
    featureGroups: [
      {
        category: "Arquitetura Digital",
        items: [
          "Web-Convite com Direção Visual HAXR",
          "Abertura Sonora & Música de Fundo",
          "Declaração Autêntica dos Noivos",
          "Galeria Fotográfica de Ritmo Editorial",
        ],
      },
      {
        category: "Conveniência & Encontro",
        items: [
          "RSVP Directo (Confirmação no próprio link)",
          "Contagem Regressiva viva até ao segundo",
          "Localização Geográfica via Google Maps & Waze",
          "Feed Privado de Mensagens & Felicitações",
        ],
      },
      {
        category: "Anúncio Prévio",
        items: ["Save the Date Básico em Vídeo Curto"],
      },
    ],
  },
  {
    id: "elo",
    editionNumber: "Edicional N.º II",
    name: "Elo",
    price: "MT 15.999",
    product: "Web-Convite Premium HAXR",
    badge: "Mais Solicitado",
    tagline: "A ponte viva entre a expectativa e a memória.",
    manifesto: "Amplia a narrativa do casal com curadoria fotográfica pre-wedding, orientação de vestuário e acolhimento colaborativo dos convidados.",
    icon: Layers,
    featureGroups: [
      {
        category: "Tudo o que inclui o Prólogo +",
        items: [
          "Design e Composição Personalizada HAXR",
          "Sessão Fotográfica Pre-Wedding (3 obras curadas)",
          "Save the Date Personalizado em Vídeo",
        ],
      },
      {
        category: "Experiência de Convidado",
        items: [
          "Guia de Dress Code & Recomendações",
          "Informação de Lista de Presentes",
          "Lembrete Automático da Data do Evento",
        ],
      },
      {
        category: "Plus Memories · Fotografia",
        items: [
          "Galeria Colaborativa para até 150 convidados",
          "QR Code de Acesso para o recinto do evento",
          "Fotografias e dedicatórias enviadas em direto",
        ],
      },
    ],
  },
  {
    id: "legado",
    editionNumber: "Edicional N.º III",
    name: "Legado",
    price: "MT 25.000",
    product: "Obra de Alta-Costura Digital",
    badge: "Alta-Costura HAXR",
    tagline: "Criado para viver antes, durante e perpetuar-se depois.",
    manifesto: "A expressão máxima do Atelier. Um ecossistema completo que unifica o anúncio prévio, a navegação em tempo real no recinto e o acervo pós-evento.",
    icon: Crown,
    featureGroups: [
      {
        category: "Tudo o que inclui o Prólogo e o Elo +",
        items: [
          "Direção de Arte de Alta-Costura Sob Medida",
          "Sessão Fotográfica Pre-Wedding (5 obras de autor)",
          "Save the Date Premium em Vídeo Cinematográfico",
          "Vídeo Pre-Wedding integrado no Web-Convite",
        ],
      },
      {
        category: "No Recinto (Live Reception)",
        items: [
          "Find Your Seat · Pesquisa de Mesa por QR Code (<3s)",
          "Agenda Dinâmica para Múltiplos Momentos & Locais",
        ],
      },
      {
        category: "Plus Memories · Full Experience",
        items: [
          "Fotos e Vídeos em alta resolução em tempo real",
          "QR Code dedicado impresso para as mesas",
          "Galeria Pós-Celebração Permanente",
        ],
      },
    ],
  },
] as const;

const comparisonRows = [
  ["Peça & Assinatura Digital", "Prólogo", "Elo", "Legado"],
  ["Web-Convite Personalizado", "✓", "✓", "✓"],
  ["Abertura Sonora & Música de Fundo", "✓", "✓", "✓"],
  ["RSVP Directo (no próprio link)", "✓", "✓", "✓"],
  ["Localização Google Maps & Waze", "✓", "✓", "✓"],
  ["Save the Date em Vídeo", "Básico", "Personalizado", "Premium Cinematográfico"],
  ["Sessão Fotográfica Pre-Wedding", "—", "3 obras curadas", "5 obras de autor"],
  ["Guia de Dress Code & Presentes", "—", "✓", "✓"],
  ["Plus Memories (Galeria Colaborativa)", "—", "Fotografia (até 150)", "Full Experience (Fotos & Vídeos)"],
  ["Find Your Seat (QR Code no Recinto)", "—", "—", "✓ (Leitura <3s)"],
  ["Agenda Múltiplos Momentos", "—", "—", "✓"],
  ["Galeria Pós-Celebração Permanente", "—", "—", "✓"],
] as const;

const processSteps = [
  ["01", "Escutamos", "A história, a atmosfera da celebração e a sensação que deve permanecer na memória dos convidados."],
  ["02", "Editamos", "Transformamos conteúdo real num conceito visual coeso e numa narrativa contemporânea."],
  ["03", "Construímos", "Desenhamos a experiência mobile-first com precisão de alta-costura digital."],
  ["04", "Ensaiamos", "Testamos rigorosamente o conteúdo, o som, o RSVP e os dispositivos antes do lançamento."],
] as const;

const faqs = [
  {
    question: "O Web-Convite HAXR é criado a partir de um modelo genérico?",
    answer:
      "Não. Cada projeto parte da história autêntica da celebração e recebe uma direção de arte sob medida. A Montra Viva apresenta três linguagens visuais completamente distintas precisamente porque repudiamos a estética por template.",
  },
  {
    question: "Como funciona a navegação em telemóveis?",
    answer:
      "A experiência é desenhada prioritariamente para ecrãs móveis (mobile-first) e depois adaptada com o mesmo rigor para tablet e desktop, mantendo uma velocidade imediata e leitura impecável.",
  },
  {
    question: "O RSVP é feito no próprio Web-Convite?",
    answer:
      "Sim. A confirmação de presença é instantânea e integrada no próprio link. O convidado não necessita de descarregar ficheiros PDF nem instalar nenhuma aplicação.",
  },
  {
    question: "Qual a diferença entre o Plus Memories no Elo e no Legado?",
    answer:
      "No pacote Elo, o Plus Memories permite reunir fotografias e mensagens dos convidados (até 150 pessoas). No pacote Legado (Full Experience), inclui também vídeos, QR Code dedicado, participação ativa durante a festa e galeria pós-evento contínua.",
  },
  {
    question: "Como funciona o Find Your Seat no pacote Legado?",
    answer:
      "Através de um QR Code impresso no local da recepção ou disponibilizado na entrada, os convidados leem o código com a câmara do telemóvel, pesquisam o seu nome e descobrem instantaneamente a sua mesa em menos de 3 segundos.",
  },
] as const;

function EditorialLabel({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`${styles.eyebrow} ${light ? styles.eyebrowLight : ""}`}>
      {children}
    </p>
  );
}

/** Mockup Sleek HAXR Signature (Estilo Dash Limintso & Artboard Studio Edition) */
function ArtboardIphone17Mockup({
  embedUrl,
  title,
  isActive = true,
  image,
  imageAlt,
  isInteractive = true,
}: {
  embedUrl: string;
  title: string;
  isActive?: boolean;
  image?: string;
  imageAlt?: string;
  isInteractive?: boolean;
}) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <div className="w-full max-w-[245px] sm:max-w-[265px] mx-auto z-20">
      <IPhone17Frame showLabel={false} className="mx-auto">
        <div className="relative h-full w-full bg-black rounded-[1.8rem] overflow-hidden">
          {isInteractive ? (
            <div className={styles.iphoneIframeWrap}>
              {!iframeLoaded && image ? (
                <div className={styles.iphoneLoadingState}>
                  <Image
                    src={image}
                    alt={imageAlt || title}
                    fill
                    sizes="(max-width: 767px) 100vw, 26rem"
                    className={styles.iphoneFallbackImg}
                    priority
                  />
                  <div className={styles.iphoneSpinnerOverlay}>
                    <div className={styles.spinnerRing} />
                    <span>A carregar no Viewport...</span>
                  </div>
                </div>
              ) : null}

              <iframe
                src={embedUrl}
                title={`Web-Convite HAXR: ${title}`}
                className={`${styles.iphoneIframe} hide-scrollbar`}
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                onLoad={() => setIframeLoaded(true)}
                tabIndex={isActive ? 0 : -1}
              />
            </div>
          ) : image ? (
            <div className={styles.iphoneStaticWrap}>
              <Image
                src={image}
                alt={imageAlt || title}
                fill
                sizes="(max-width: 767px) 100vw, 26rem"
                className={styles.iphoneStaticImg}
              />
            </div>
          ) : null}
        </div>
      </IPhone17Frame>
    </div>
  );
}

/** Hero Ultra-Premium com Badges Afastados e Barra de Pilares de Alta-Costura */
function HeroSection() {
  const [heroProjectIndex, setHeroProjectIndex] = useState(0);
  const currentHeroProject = projects[heroProjectIndex];
  const heroVisualRef = useRef<HTMLDivElement>(null);

  const handleHeroPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const visual = heroVisualRef.current;
    if (!visual || event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = visual.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    visual.style.setProperty("--hero-tilt-x", `${(-y * 3.5).toFixed(2)}deg`);
    visual.style.setProperty("--hero-tilt-y", `${(x * 3.5).toFixed(2)}deg`);
    visual.style.setProperty("--hero-shift-x", `${(x * 8).toFixed(2)}px`);
    visual.style.setProperty("--hero-shift-y", `${(y * 8).toFixed(2)}px`);
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
    <header className={styles.heroNew}>
      <div className={styles.heroAuraGlow} aria-hidden="true" />
      <div className={styles.heroMonogramWatermark} aria-hidden="true">
        HAXR
      </div>

      <div className={styles.heroHeaderContainer}>
        {/* Coluna Esquerda: Texto & Seletor de Projetos */}
        <div className={styles.heroLeftCol}>
          <div className={styles.heroTopBar}>
            <EditorialLabel light>ATELIER HAXR SIGNATURE · ALTA-COSTURA DIGITAL</EditorialLabel>
            <div className={styles.heroLiveStatus}>
              <span className={styles.statusDot} />
              <span>Maputo · Lisboa · Atelier Aberto</span>
            </div>
          </div>

          <div className={styles.heroHeadlineBlock}>
            <h1>A Arte do Primeiro Encontro.</h1>
            <p className={styles.heroSubtitle}>
              Web-Convites & Identidades Visuais concebidos como obras de alta-costura digital para celebrações memoráveis.
            </p>
          </div>

          {/* Seletor Rápido de Projetos no Viewport */}
          <div className={styles.heroProjectSelector}>
            <div className={styles.selectorPills}>
              {projects.map((p, idx) => (
                <button
                  key={p.title}
                  type="button"
                  className={`${styles.selectorPill} ${heroProjectIndex === idx ? styles.selectorPillActive : ""}`}
                  onClick={() => setHeroProjectIndex(idx)}
                >
                  <span>0{idx + 1}</span> {p.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna Direita: Viewport Mobile Stage */}
        <div className={styles.heroRightCol}>
          <div
            ref={heroVisualRef}
            className={styles.heroStageWrapper}
            onPointerMove={handleHeroPointer}
            onPointerLeave={resetHeroPointer}
          >
            {/* Envelope de Papel em Relevo */}
            <div className={styles.heroPaperCardBacking} aria-hidden="true">
              <div className={styles.paperGoldFoilLogo}>H & H</div>
              <div className={styles.paperEmbossedPattern} />
              <span className={styles.waxSealStamp}>HAXR</span>
            </div>

            {/* Viewport Mobile Mockup */}
            <ArtboardIphone17Mockup
              embedUrl={currentHeroProject.embedUrl}
              title={currentHeroProject.title}
              image={currentHeroProject.image}
              imageAlt={currentHeroProject.imageAlt}
            />
          </div>
        </div>

        {/* Nova Barra Inferior de Assinatura do Atelier */}
        <div className={styles.heroSignaturePillarsBar}>
          <div className={styles.pillarItem}>
            <span>01</span>
            <strong>Narrativa Visual Sob Medida</strong>
            <p>Direção de arte proprietária sem templates</p>
          </div>
          <i className={styles.pillarDivider} aria-hidden="true" />
          <div className={styles.pillarItem}>
            <span>02</span>
            <strong>Navegação Interativa Ao Vivo</strong>
            <p>Acesso instantâneo sem ficheiros ou descargas</p>
          </div>
          <i className={styles.pillarDivider} aria-hidden="true" />
          <div className={styles.pillarItem}>
            <span>03</span>
            <strong>Ecossistema de Presença & Memória</strong>
            <p>Save the Date, Plus Memories e Find Your Seat</p>
          </div>
        </div>
      </div>
    </header>
  );
}

/** Anatomia do Web-Convite */
function AnatomiaDoWebConvite() {
  const [activeTab, setActiveTab] = useState<"core" | "extensions">("core");

  return (
    <section className={styles.anatomiaSection} aria-labelledby="anatomia-title">
      <div className={styles.anatomiaHeader}>
        <EditorialLabel>ANATOMIA DA EXPERIÊNCIA DIGITAL</EditorialLabel>
        <h2 id="anatomia-title">O que compõe um Web-Convite HAXR.</h2>
        <p>
          Um sistema integrado de elegância, conveniência e memória. Sem ficheiros PDF, sem descargas e acessível num único toque.
        </p>
      </div>

      <div className={styles.anatomiaNavTabs}>
        <button
          type="button"
          className={`${styles.anatomiaTabBtn} ${activeTab === "core" ? styles.anatomiaTabActive : ""}`}
          onClick={() => setActiveTab("core")}
        >
          <span>01</span> Núcleo do Web-Convite
        </button>
        <button
          type="button"
          className={`${styles.anatomiaTabBtn} ${activeTab === "extensions" ? styles.anatomiaTabActive : ""}`}
          onClick={() => setActiveTab("extensions")}
        >
          <span>02</span> Extensões do Ecossistema HAXR
        </button>
      </div>

      <div className={styles.anatomiaGridDisplay}>
        {activeTab === "core" ? (
          <div className={styles.coreGridCards}>
            {coreCapabilities.map((item, index) => {
              const IconComp = item.icon;
              return (
                <article key={item.label} className={styles.coreCapabilityCard}>
                  <div className={styles.cardHeaderTop}>
                    <span className={styles.cardIndex}>0{index + 1}</span>
                    <IconComp className={styles.cardIcon} aria-hidden="true" />
                  </div>
                  <h3>{item.label}</h3>
                  <p>{item.note}</p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.extensionsGridCards}>
            {ecosystemExtensions.map((item) => (
              <article key={item.label} className={styles.extensionCapabilityCard}>
                <div className={styles.extensionCardBadge}>{item.badge}</div>
                <h3>{item.label}</h3>
                <p>{item.note}</p>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className={styles.anatomiaStatementBanner}>
        <div className={styles.statementLeftCopy}>
          <p>O Web-Convite é o ponto de partida. A experiência HAXR pode continuar antes, durante e depois da celebração.</p>
        </div>
        <div className={styles.statementRightLink}>
          <span>Um único link.</span>
          <strong>Uma experiência inesquecível.</strong>
        </div>
      </div>
    </section>
  );
}

/** Card de Pacote Redesenhado como Obra de Alta-Costura Digital */
function CouturePackageCard({ packageItem }: { packageItem: Package }) {
  const IconComp = packageItem.icon;

  return (
    <article className={`${styles.coutureCard} ${styles[`couture_${packageItem.id}`]}`}>
      {/* Marca d'água de Alta-Costura */}
      <div className={styles.coutureWatermark} aria-hidden="true">
        {packageItem.name}
      </div>

      {/* Topo do Card com Badge e Edicional */}
      <div className={styles.coutureHeader}>
        <div className={styles.coutureEditionRow}>
          <span className={styles.coutureEditionTag}>{packageItem.editionNumber}</span>
          {packageItem.badge ? (
            <span className={styles.coutureBadge}>{packageItem.badge}</span>
          ) : null}
        </div>

        <div className={styles.coutureTitleRow}>
          <div className={styles.coutureNameWrap}>
            <h3>{packageItem.name}</h3>
            <span className={styles.coutureProductSub}>{packageItem.product}</span>
          </div>
          <div className={styles.coutureIconWrap} aria-hidden="true">
            <IconComp className={styles.coutureIcon} />
          </div>
        </div>

        <div className={styles.couturePriceBlock}>
          <span className={styles.pricePrefix}>Investimento</span>
          <strong className={styles.couturePrice}>{packageItem.price}</strong>
        </div>

        <p className={styles.coutureTagline}>{packageItem.tagline}</p>
        <p className={styles.coutureManifesto}>{packageItem.manifesto}</p>
      </div>

      {/* Divisor de Ouro */}
      <div className={styles.coutureGoldDivider} aria-hidden="true" />

      {/* Manifesto de Elementos e Capacidades */}
      <div className={styles.coutureBody}>
        {packageItem.featureGroups.map((group) => (
          <div key={group.category} className={styles.coutureGroup}>
            <span className={styles.coutureGroupCategory}>{group.category}</span>
            <ul className={styles.coutureItemList}>
              {group.items.map((item) => (
                <li key={item} className={styles.coutureItem}>
                  <i className={styles.coutureDot} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Rodapé e Ação do Card */}
      <div className={styles.coutureFooter}>
        <Link
          href={`/contacto?tipo=convite-digital&pacote=${packageItem.id}`}
          className={styles.coutureCtaBtn}
        >
          <span>Comissionar Edicional {packageItem.name}</span>
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function PackageComparison() {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.comparison}>
      <button
        type="button"
        className={styles.comparisonToggle}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {open ? "Ocultar Matriz Comparativa de Alta-Costura" : "Ver Matriz Comparativa dos Três Edicionais"}
        <ChevronDown aria-hidden="true" className={open ? styles.chevronOpen : ""} />
      </button>

      {open ? (
        <div className={styles.tableScroller}>
          <table>
            <thead>
              <tr>
                <th>Elemento de Presença</th>
                <th>Prólogo</th>
                <th>Elo</th>
                <th>Legado</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([feature, prologo, elo, legado]) => (
                <tr key={feature}>
                  <th scope="row">{feature}</th>
                  <td>{prologo}</td>
                  <td>{elo}</td>
                  <td>{legado}</td>
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
      {/* Introdução de Alta-Costura dos Pacotes */}
      <div className={styles.coutureIntroBlock}>
        <div className={styles.coutureIntroHeader}>
          <EditorialLabel>EDICIONAIS DO ATELIER HAXR · ALTA-COSTURA DIGITAL</EditorialLabel>
          <h2 id="packages-title">Três Modos de Presença. Uma Única Assinatura.</h2>
        </div>
        <div className={styles.coutureIntroCopy}>
          <p>
            Cada celebração exige o seu próprio peso dramático e profundidade de memória. Da intenção pura de um primeiro capítulo à arquitetura inteira de um evento, concebemos três edicionais de alta-costura digital.
          </p>
          <div className={styles.couturePillarsLegend}>
            <span>[ 01 INTENÇÃO ]</span>
            <span>[ 02 PRESENÇA ]</span>
            <span>[ 03 HERANÇA ]</span>
          </div>
        </div>
      </div>

      {/* Seletor de Tipo de Celebração */}
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
            <span>0{index + 1}</span>
            {occasion.label}
          </button>
        ))}
      </div>

      <div id="occasion-panel" role="tabpanel" className={styles.occasionPanel}>
        {activeOccasion === "casamento" ? (
          <>
            <div className={styles.coutureGrid}>
              {packages.map((packageItem) => (
                <CouturePackageCard key={packageItem.id} packageItem={packageItem} />
              ))}
            </div>
            <p className={styles.priceNote}>
              Valores expressos em meticais (MT). Todos os edicionais da HAXR incluem consultoria direta de direção de arte, curadoria de conteúdos e suporte dedicado para a celebração.
            </p>
            <PackageComparison />
          </>
        ) : (
          <div className={styles.occasionContact}>
            <span>{selectedOccasion.label}</span>
            <h3>Uma proposta desenhada à medida da celebração.</h3>
            <p>Os pacotes padronizados publicados aplicam-se a Casamento & Lobolo. Para {selectedOccasion.label}, preparamos um briefing exclusivo.</p>
            <Link href="/contacto?tipo=convite-digital" className={styles.darkCta}>
              Solicitar Briefing Sob Medida <ArrowRight aria-hidden="true" />
            </Link>
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
        <EditorialLabel light>PLUS MEMORIES</EditorialLabel>
        <h2 id="memories-title">O fotógrafo conta a história.</h2>
        <p className={styles.memoriesCounterpoint}>Os convidados revelam tudo o resto.</p>
        <p>
          Através de um QR Code impresso no evento ou acedido pelo Web-Convite, cada convidado partilha perspetivas únicas, fotografias espontâneas e mensagens num ambiente colaborativo e privado.
        </p>

        <div className={styles.memoriesLegend}>
          <span>
            <QrCode aria-hidden="true" /> Leitura simples por QR Code
          </span>
          <span>
            <Upload aria-hidden="true" /> Partilha em tempo real
          </span>
          <span>
            <Images aria-hidden="true" /> Galeria viva do evento
          </span>
        </div>
      </div>

      <div className={styles.memoryComposition} aria-label="Demonstração do Plus Memories">
        <div className={styles.memoryPhoto}>
          <Image
            src="/images/convite-preview-portrait.png"
            alt="Registos fotográficos autênticos no Plus Memories HAXR"
            fill
            sizes="(max-width: 767px) 80vw, 26rem"
          />
          <span>
            <Clock3 aria-hidden="true" /> 18:42
          </span>
        </div>

        <div className={`${styles.memoryNotice} ${styles.memoryNoticePhoto}`}>
          <Images aria-hidden="true" />
          <div>
            <strong>Foto adicionada</strong>
            <span>Agora mesmo</span>
          </div>
        </div>

        <div className={`${styles.memoryNotice} ${styles.memoryNoticeMessage}`}>
          <MessageCircle aria-hidden="true" />
          <div>
            <strong>Mensagem recebida</strong>
            <span>18:44</span>
          </div>
        </div>

        <div className={`${styles.memoryNotice} ${styles.memoryNoticeVideo}`}>
          <Video aria-hidden="true" />
          <div>
            <strong>Vídeo 00:08</strong>
            <span>Full Experience</span>
          </div>
        </div>

        <div className={styles.memoryQr}>
          <QrCode aria-hidden="true" />
          <span>Scan & Partilhe</span>
        </div>
      </div>
    </section>
  );
}

function FindYourSeat() {
  const [searched, setSearched] = useState(false);
  const [name, setName] = useState("Jessica M.");

  return (
    <section className={styles.seatSection} aria-labelledby="seat-title">
      <div className={styles.seatHeading}>
        <EditorialLabel>FIND YOUR SEAT</EditorialLabel>
        <h2 id="seat-title">Um scan. Um nome. A mesa certa.</h2>
        <p>A organização da recepção sem fricção nem filas. O convidado pesquisa o seu nome e recebe a localização exata em menos de 3 segundos.</p>
      </div>

      <div className={styles.seatDemo}>
        <div className={styles.seatSearchCard}>
          <label htmlFor="seat-demo-name">Pesquisar o seu nome</label>
          <div className={styles.searchField}>
            <Search aria-hidden="true" />
            <input
              id="seat-demo-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome..."
            />
          </div>

          <button type="button" onClick={() => setSearched(true)} className={styles.seatActionBtn}>
            Ver a minha mesa <ArrowRight aria-hidden="true" />
          </button>

          {searched ? (
            <div className={styles.seatResult} aria-live="polite">
              <span>Resultado encontrado</span>
              <strong>MESA 08</strong>
              <p>
                <MapPin aria-hidden="true" /> Área Jardim
              </p>
            </div>
          ) : null}
        </div>

        <div className={styles.seatQrCard} aria-hidden="true">
          <QrCode className={styles.seatQrIcon} />
          <div className={styles.seatStepsMini}>
            <div>
              <span>01</span>
              <p>Digitalizar QR Code</p>
            </div>
            <div>
              <span>02</span>
              <p>Pesquisar nome</p>
            </div>
            <div>
              <span>03</span>
              <p>Encontrar lugar</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function IdentitySection() {
  return (
    <section className={styles.identitySection} aria-labelledby="identity-title">
      <div className={styles.identityCopy}>
        <EditorialLabel light>DA TELA PARA O ESPAÇO</EditorialLabel>
        <h2 id="identity-title">Uma identidade que continua depois do clique.</h2>
        <p>
          Monograma, tipografia, paleta e composição tornam-se um sistema vivo e harmonioso — do Save the Date à sinalética, da mesa ao último agradecimento.
        </p>
      </div>

      <div className={styles.identityGrid}>
        <article className={styles.monogramCard}>
          <Fingerprint aria-hidden="true" />
          <div>
            <strong>H & H</strong>
            <span>Monograma proprietário</span>
          </div>
        </article>

        <article className={styles.colourCard}>
          <span>Matéria Cromática</span>
          <div>
            <i />
            <i />
            <i />
            <i />
          </div>
          <strong>Cor com intenção.</strong>
        </article>

        <article className={styles.voiceCard}>
          <span>Voz Visual</span>
          <strong>Detalhe que se sente antes de se explicar.</strong>
          <p>
            Tipografia · Ritmo<br />
            Imagem · Presença
          </p>
        </article>
      </div>
    </section>
  );
}

function ProcessAndFaq() {
  return (
    <>
      <section className={styles.processSection} aria-labelledby="process-title">
        <div>
          <EditorialLabel>O ATELIER</EditorialLabel>
          <h2 id="process-title">Quatro gestos. Uma assinatura.</h2>
        </div>
        <ol>
          {processSteps.map(([number, title, copy]) => (
            <li key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.faqSection} aria-labelledby="faq-title">
        <div>
          <EditorialLabel>ANTES DE COMEÇARMOS</EditorialLabel>
          <h2 id="faq-title">Clareza também é luxo.</h2>
        </div>
        <div className={styles.faqList}>
          {faqs.map((faq, index) => (
            <details key={faq.question}>
              <summary>
                <span>
                  <i>0{index + 1}</i>
                  {faq.question}
                </span>
                <b aria-hidden="true">+</b>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

export default function InvitationAtelierExperience() {
  return (
    <main className={styles.atelierPage}>
      <HeroSection />
      <AnatomiaDoWebConvite />
      <PackagesSection />
      <PlusMemories />
      <FindYourSeat />
      <IdentitySection />
      <ProcessAndFaq />

      <section className={styles.finalCta}>
        <EditorialLabel>COMISSIONE UMA PEÇA HAXR</EditorialLabel>
        <div>
          <h2>A próxima história não precisa de se parecer com nenhuma anterior.</h2>
          <p>Conte-nos o que estão a celebrar e como querem que os convidados se sintam no primeiro toque.</p>
        </div>
        <Link href="/contacto?tipo=convite-digital" className={styles.darkCta}>
          Iniciar Briefing <ArrowRight aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
