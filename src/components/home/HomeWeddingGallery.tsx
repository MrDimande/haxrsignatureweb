"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Users, Heart, ArrowLeft, ArrowRight } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

interface WeddingProject {
  id: string;
  couple: string;
  location: string;
  tagline: string;
  mainImage: string;
  galleryImages: string[];
  guests: string;
  services: string;
  description: string;
  quote: string;
  author: string;
}

const weddingProjects: WeddingProject[] = [
  {
    id: "vania-fabiao",
    couple: "Vânia & Fabião",
    location: "Maputo · Moçambique",
    tagline: "Sobriedade e minimalismo contemporâneo.",
    mainImage: "/images/archive-01.webp",
    galleryImages: [
      "/images/archive-01.webp",
      "/images/categories/venue.png",
      "/images/categories/florist.png"
    ],
    guests: "120 convidados",
    services: "Assessoria Completa · Identidade Visual",
    description: "Uma celebração de linhas limpas e elegância discreta na capital moçambicana. O foco foi a sobriedade cromática e a iluminação cénica desenhada à medida, realçando a arquitectura do espaço e criando uma atmosfera íntima.",
    quote: "A HAXR organizou tudo com um rigor impecável, mas o resultado final foi de uma sensibilidade e beleza poética indescritíveis.",
    author: "Vânia Fabião"
  },
  {
    id: "sofia-alberto",
    couple: "Sofia & Alberto",
    location: "Bilene · Moçambique",
    tagline: "A brisa do Índico sob seda drapeada.",
    mainImage: "/images/archive-02.webp",
    galleryImages: [
      "/images/archive-02.webp",
      "/images/categories/caterer.png",
      "/images/categories/photographer.png"
    ],
    guests: "150 convidados",
    services: "RSVP Digital · Coordenação de Dia",
    description: "Realizado sob as águas calmas da lagoa do Bilene. As sedas drapeadas em tons champagne e marfim flutuavam suavemente com a brisa da tarde. O planeamento digital integrou o RSVP do WhatsApp com o acolhimento Find Your Seat.",
    quote: "Ter o RSVP e os convites digitais perfeitamente integrados com as confirmações no WhatsApp poupou-nos semanas de trabalho e stress.",
    author: "Sofia Antunes"
  },
  {
    id: "naima-cassamo",
    couple: "Naíma & Cassamo",
    location: "Bazaruto · Moçambique",
    tagline: "Casamento intimista de destino tropical.",
    mainImage: "/images/archive-03.webp",
    galleryImages: [
      "/images/archive-03.webp",
      "/images/categories/venue.png",
      "/images/categories/stationery.png"
    ],
    guests: "80 convidados",
    services: "Identidade Artística · Assessoria Completa",
    description: "Um elopement de luxo expandido nas dunas da ilha de Bazaruto. Misturámos elementos artesanais locais com detalhes editoriais de alta costura, criando uma ponte harmoniosa entre a natureza selvagem e a sofisticação.",
    quote: "Planear à distância na Ilha de Bazaruto parecia impossível, mas a plataforma HAXR manteve todos os fornecedores alinhados e o orçamento sob controlo.",
    author: "Naíma"
  },
  {
    id: "jessica-samuel",
    couple: "Jéssica & Samuel",
    location: "Inhambane · Moçambique",
    tagline: "Elegância rústica entre palmeiras.",
    mainImage: "/images/archive-04.webp",
    galleryImages: [
      "/images/archive-04.webp",
      "/images/categories/florist.png",
      "/images/categories/cake.png"
    ],
    guests: "200 convidados",
    services: "Coordenação Operacional de Dia · RSVP",
    description: "Uma imersão rústica e sofisticada rodeada de palmeiras imperiais. A decoração orgânica utilizou texturas naturais, cerâmicas locais e uma curadoria floral que celebrou as cores quentes da terra e do entardecer.",
    quote: "O profissionalismo e a discrição no dia foram impecáveis. Os nossos convidados sentiram-se acolhidos numa experiência única e muito sofisticada.",
    author: "Jéssica Samuel"
  }
];

export default function HomeWeddingGallery() {
  const [selectedProject, setSelectedProject] = useState<WeddingProject | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle scroll buttons for Apple-style horizontal list
  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollTo = direction === "left"
        ? scrollLeft - clientWidth * 0.7
        : scrollLeft + clientWidth * 0.7;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedProject(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <section className="relative py-16 md:py-24 bg-[#0c0a09] overflow-hidden border-y border-brand-champagne/10 text-white">
      {/* Subtle top gold radial glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: "radial-gradient(ellipse 50% 50% at 50% 0%, rgba(184,138,42,0.15), transparent 70%)"
        }}
      />

      <div className="site-container-wide relative z-10 space-y-12">

        {/* Gallery Header Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <RevealOnScroll className="space-y-4 text-left">
            <div className="inline-flex items-center gap-2.5 text-brand-gold">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-brand-gold shrink-0">
                <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" />
              </svg>
              <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Galeria HAXR</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl font-light text-white leading-tight">
              Histórias de Assinatura
            </h2>
            <p className="font-sans text-sm md:text-base text-brand-ivory/60 leading-relaxed font-light max-w-xl">
              Cada celebração é um projecto de curadoria único. Explore os casamentos reais que desenhámos e coordenámos em Moçambique.
            </p>
          </RevealOnScroll>

          {/* Apple-style navigation arrows */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => scroll("left")}
              className="w-11 h-11 rounded-full border border-white/10 hover:border-brand-gold hover:text-brand-gold transition-colors flex items-center justify-center cursor-pointer bg-white/5 active:scale-95"
              aria-label="Deslizar para a esquerda"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-11 h-11 rounded-full border border-white/10 hover:border-brand-gold hover:text-brand-gold transition-colors flex items-center justify-center cursor-pointer bg-white/5 active:scale-95"
              aria-label="Deslizar para a direita"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Apple-style horizontal snapping track */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-6 pb-6 pt-2 scroll-smooth snap-x snap-mandatory scrollbar-none"
          style={{ scrollbarWidth: "none" }}
        >
          {weddingProjects.map((project) => (
            <motion.div
              key={project.id}
              onClick={() => {
                setSelectedProject(project);
                setCurrentSlideIndex(0);
              }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
              className="snap-start shrink-0 w-[280px] sm:w-[360px] md:w-[420px] aspect-[4/5] rounded-[2rem] overflow-hidden relative cursor-pointer group shadow-2xl border border-white/5 select-none"
            >
              {/* Background Cover Image */}
              <Image
                src={project.mainImage}
                alt={`Casamento de ${project.couple} em ${project.location}`}
                fill
                sizes="(max-width: 640px) 280px, (max-width: 768px) 360px, 420px"
                className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
              />

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent z-10" />

              {/* Text Overlay content inside card (Apple Card style) */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end text-left z-20 space-y-3">
                <div className="space-y-1">
                  <span className="font-mono text-[9px] tracking-widest text-brand-gold uppercase font-bold">
                    {project.location.split(" · ")[0]}
                  </span>
                  <h3 className="font-serif text-2xl md:text-3xl font-light text-white leading-tight">
                    {project.couple}
                  </h3>
                </div>
                <p className="font-sans text-xs md:text-sm text-brand-ivory/70 font-light leading-relaxed truncate group-hover:text-white transition-colors duration-300">
                  {project.tagline}
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[8px] md:text-[9px] tracking-widest uppercase font-bold text-brand-gold hover:text-white transition-colors border-b border-brand-gold/40 pb-0.5">
                    Ver Projecto
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Fullscreen Apple-style Overlay Lightbox Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 select-none overflow-y-auto"
          >
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="bg-[#0c0a09] border border-white/10 rounded-[2.5rem] w-full max-w-5xl overflow-hidden shadow-2xl relative grid grid-cols-1 md:grid-cols-12 max-h-[90vh] md:max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >

              {/* Close Button */}
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute right-5 top-5 z-40 bg-black/60 border border-white/10 text-white hover:text-brand-gold p-2 rounded-full transition-colors cursor-pointer active:scale-95"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Left Column: Image Carousel / Showcase Slider */}
              <div className="md:col-span-6 relative bg-zinc-950 flex flex-col justify-between aspect-[4/3] md:aspect-auto md:min-h-[500px]">

                {/* Active Image */}
                <div className="w-full h-full relative overflow-hidden flex-1">
                  <Image
                    src={selectedProject.galleryImages[currentSlideIndex]}
                    alt={`${selectedProject.couple} — registo ${currentSlideIndex + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                </div>

                {/* Carousel Controls */}
                <div className="absolute bottom-6 inset-x-6 flex justify-between items-center z-20">
                  <div className="flex gap-1.5">
                    {selectedProject.galleryImages.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentSlideIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === currentSlideIndex ? "w-4 bg-white" : "w-1.5 bg-white/40"
                        }`}
                        aria-label={`Foto ${i + 1}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentSlideIndex((prev) => (prev === 0 ? selectedProject.galleryImages.length - 1 : prev - 1))}
                      className="p-1.5 bg-black/50 border border-white/10 rounded-full text-white hover:text-brand-gold transition-all"
                      aria-label="Foto anterior"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentSlideIndex((prev) => (prev === selectedProject.galleryImages.length - 1 ? 0 : prev + 1))}
                      className="p-1.5 bg-black/50 border border-white/10 rounded-full text-white hover:text-brand-gold transition-all"
                      aria-label="Próxima foto"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column: Narrative Copy Details */}
              <div className="md:col-span-6 p-8 md:p-12 overflow-y-auto flex flex-col justify-between text-left space-y-8 max-h-[50vh] md:max-h-full">

                {/* Meta details */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="font-mono text-[9px] tracking-widest text-brand-gold uppercase font-bold">
                      {selectedProject.location}
                    </span>
                    <h3 className="font-serif text-3xl md:text-4xl font-light text-white leading-tight">
                      {selectedProject.couple}
                    </h3>
                  </div>

                  {/* Fact sheet capsules */}
                  <div className="flex flex-wrap gap-4 text-xs font-mono text-brand-ivory/60 select-none">
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                      <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                      <span>{selectedProject.location.split(" · ")[0]}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                      <Users className="w-3.5 h-3.5 text-brand-gold" />
                      <span>{selectedProject.guests}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                      <Heart className="w-3.5 h-3.5 text-brand-gold" />
                      <span>{selectedProject.services.split(" · ")[0]}</span>
                    </div>
                  </div>

                  {/* Description paragraph */}
                  <p className="font-sans text-xs md:text-sm text-brand-ivory/70 leading-relaxed font-light">
                    {selectedProject.description}
                  </p>
                </div>

                {/* Big testimonial block */}
                <div className="border-t border-white/10 pt-6 space-y-4 text-left">
                  <p className="font-serif italic text-brand-ivory text-sm leading-relaxed relative">
                    &ldquo;{selectedProject.quote}&rdquo;
                  </p>
                  <p className="font-sans text-[10px] uppercase tracking-widest font-bold text-brand-gold">
                    — {selectedProject.author}
                  </p>
                </div>

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
