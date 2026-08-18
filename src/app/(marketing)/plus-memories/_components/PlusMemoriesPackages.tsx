import Link from "next/link";
import { ArrowRight } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import styles from "./plus-memories.module.css";

const CONTACT_URL = "/contacto?tipo=convite-digital#contacto";

const packages = [
  {
    id: "collection",
    number: "01",
    name: "PLUS MEMORIES · COLLECTION",
    scale: "Até 50 convidados",
    quote: "Uma celebração. Uma colecção de olhares.",
    description:
      "Uma colecção de memórias construída pelas pessoas que viveram a celebração. Ideal para celebrações mais íntimas e eventos até 50 convidados.",
    capabilities: [
      "QR Code exclusivo",
      "Acesso web sem instalação",
      "Fotografias e vídeos",
      "Álbum colectivo e momento livre",
      "Identidade Plus Memories do evento",
      "Organização e exportação final",
    ],
    cta: "SOLICITAR PROPOSTA",
  },
  {
    id: "couture",
    number: "02",
    name: "PLUS MEMORIES · COUTURE",
    scale: "Até 150 convidados",
    quote: "Criado à medida da sua celebração.",
    description:
      "Uma evolução de Collection, com narrativa visual, desafios e acompanhamento ajustados à forma como a celebração será vivida.",
    capabilities: [
      "Base completa de Collection",
      "Desafios “Eu Espio…” personalizados",
      "Experiência visual personalizada",
      "Fotografias, vídeos e álbum colectivo",
      "Organização por momentos e desafios",
      "Moderação configurável e acompanhamento HAXR",
    ],
    cta: "SOLICITAR PROPOSTA",
  },
  {
    id: "signature",
    number: "03",
    name: "PLUS MEMORIES · SIGNATURE",
    scale: "Mais de 150 convidados",
    quote:
      "Nenhuma celebração é igual. A memória dela também não deveria ser.",
    description:
      "A expressão máxima do Plus Memories, criada para celebrações de maior escala sem perder a atenção dada a cada perspectiva.",
    capabilities: [
      "Experiência Plus Memories completa",
      "Desafios personalizados e contagem de progresso",
      "Explorador da Noite, quando activado",
      "Experiência interactiva em maior escala",
      "Personalização visual de alto nível",
      "Organização final e acompanhamento HAXR",
    ],
    cta: "CRIAR A MINHA EXPERIÊNCIA",
  },
] as const;

export default function PlusMemoriesPackages() {
  return (
    <section
      className={styles.packages}
      id="pacotes"
      aria-labelledby="packages-title"
    >
      <div className={styles.container}>
        <RevealOnScroll>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Três expressões · uma memória</p>
            <h2 id="packages-title">
              Escolha como a sua celebração será vivida.
            </h2>
            <p>
              A dimensão do evento orienta o enquadramento. A direcção visual,
              a participação e o acompanhamento definem a experiência.
            </p>
          </div>
        </RevealOnScroll>

        <div className={styles.packageGrid}>
          {packages.map((experience, index) => (
            <RevealOnScroll
              key={experience.id}
              className={styles.packageReveal}
              delay={index * 0.055}
            >
              <article
                className={`${styles.packageCard} ${
                  experience.id === "signature"
                    ? styles.signaturePackage
                    : ""
                }`}
                aria-labelledby={`package-${experience.id}-title`}
              >
                <header className={styles.packageHeader}>
                  <span className={styles.packageNumber} aria-hidden="true">
                    {experience.number}
                  </span>
                  <h3 id={`package-${experience.id}-title`}>
                    {experience.name}
                  </h3>
                  <p className={styles.packageScale}>{experience.scale}</p>
                  <p className={styles.packageQuote}>“{experience.quote}”</p>
                </header>

                <p className={styles.packageDescription}>
                  {experience.description}
                </p>

                <ul
                  className={styles.packageCapabilities}
                  aria-label={`Capacidades de ${experience.name}`}
                >
                  {experience.capabilities.map((capability) => (
                    <li key={capability}>{capability}</li>
                  ))}
                </ul>

                <Link
                  href={CONTACT_URL}
                  className={styles.packageCta}
                  aria-label={`${experience.cta} — ${experience.name}`}
                >
                  {experience.cta}
                  <ArrowRight size={14} strokeWidth={1.4} aria-hidden="true" />
                </Link>
              </article>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll delay={0.08}>
          <aside className={styles.packageNote} aria-label="Configuração à medida">
            <span>Procura uma experiência diferente da dimensão do seu evento?</span>
            <strong>Criamos uma configuração à medida.</strong>
          </aside>
        </RevealOnScroll>
      </div>
    </section>
  );
}
