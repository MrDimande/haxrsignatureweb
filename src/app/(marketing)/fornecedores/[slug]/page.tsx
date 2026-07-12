"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Star,
  ChevronLeft,
  Check,
  Send,
  Heart,
  Calendar,
  Users,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { IconInstagram } from "@/components/ui/FooterIcons";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { VENDORS, VENDOR_CATEGORIES } from "@/lib/marketing/vendors-data";

type StoredFavorite = {
  id: string;
  title: string;
  category: string;
  image: string;
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function VendorDetailPage({ params }: PageProps) {
  const { slug } = use(params);

  // Find vendor
  const vendor = VENDORS.find((v) => v.slug === slug);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Gallery and UI states
  const [activeImage, setActiveImage] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (vendor) {
      setActiveImage(vendor.imageCover);

      // Check if favorite
      const stored = localStorage.getItem("haxr-favorites");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setIsFavorite(parsed.some((item: StoredFavorite) => item.id === vendor.id));
        } catch {
          setIsFavorite(false);
        }
      }
    }
  }, [vendor]);

  if (!vendor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F5] pt-24 font-sans text-center px-4">
        <h1 className="font-serif text-3xl text-brand-text-dark mb-4">Fornecedor não encontrado</h1>
        <p className="text-sm text-brand-text-dark/60 mb-6">
          O fornecedor que procura não existe ou foi removido do nosso diretório.
        </p>
        <Link
          href="/fornecedores"
          className="bg-brand-text-dark hover:bg-brand-gold text-white font-mono text-[10px] tracking-widest uppercase font-bold py-3.5 px-8 rounded-full transition-colors"
        >
          Voltar ao Diretório
        </Link>
      </div>
    );
  }

  const categoryObj = VENDOR_CATEGORIES.find((c) => c.id === vendor.category);

  // Favorite toggle
  const toggleFavorite = () => {
    const stored = localStorage.getItem("haxr-favorites");
    let currentFavorites: StoredFavorite[] = [];
    try {
      currentFavorites = stored ? JSON.parse(stored) : [];
    } catch {
      currentFavorites = [];
    }

    const isFav = currentFavorites.some((item) => item.id === vendor.id);
    let updatedFavorites;

    if (isFav) {
      updatedFavorites = currentFavorites.filter((item) => item.id !== vendor.id);
      setIsFavorite(false);
    } else {
      const newItem = {
        id: vendor.id,
        title: vendor.name,
        category: categoryObj?.label || vendor.category,
        image: vendor.imageCover,
      };
      updatedFavorites = [...currentFavorites, newItem];
      setIsFavorite(true);
    }

    localStorage.setItem("haxr-favorites", JSON.stringify(updatedFavorites));
    window.dispatchEvent(new Event("haxr-favorites-updated"));
  };

  // Submit inquiry
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setIsSubmitting(true);

    setTimeout(() => {
      // Create inquiry payload
      const inquiry = {
        id: `inq_${Date.now()}`,
        vendorId: vendor.id,
        vendorName: vendor.name,
        name,
        email,
        date: date || "Não definida",
        guests: guests || "Não definido",
        message,
        timestamp: new Date().toISOString(),
        status: "Pendente",
      };

      // Retrieve existing inquiries
      const stored = localStorage.getItem("haxr_vendor_inquiries");
      let currentInquiries = [];
      try {
        currentInquiries = stored ? JSON.parse(stored) : [];
      } catch {
        currentInquiries = [];
      }

      currentInquiries.push(inquiry);
      localStorage.setItem("haxr_vendor_inquiries", JSON.stringify(currentInquiries));

      setIsSubmitting(false);
      setSubmitSuccess(true);
    }, 1500);
  };

  const handleWhatsAppContact = () => {
    const text = `Olá HAXR Signature Concierge! Enviei uma solicitação para o fornecedor "${vendor.name}" (${categoryObj?.label}) pelo vosso site e gostaria de saber se me podem ajudar a agilizar o contacto e validar a disponibilidade para o meu casamento em Maputo.`;
    window.open(`https://wa.me/258870883428?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen pt-28 pb-20 font-sans">
      <div className="site-container-wide">

        {/* Navigation Breadcrumbs / Back button */}
        <div className="mb-8">
          <Link
            href="/fornecedores"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-text-dark/60 hover:text-brand-gold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar ao Diretório
          </Link>
        </div>

        {/* Dynamic Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">

          {/* Main profile content (Left Side - 2 Cols) */}
          <div className="lg:col-span-2 space-y-10">

            {/* Header info */}
            <div>
              <div className="flex items-center gap-3 text-brand-gold mb-3">
                <span className="font-mono text-[9px] uppercase tracking-widest font-bold">
                  {categoryObj?.label || vendor.category}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold/45" />
                <span className="text-[10px] font-semibold text-brand-gold/75 uppercase tracking-wide">
                  Nível {vendor.priceRange}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="font-serif text-3xl sm:text-4.5xl font-light text-brand-text-dark leading-tight">
                  {vendor.name}
                </h1>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={toggleFavorite}
                    className={`flex items-center gap-2 border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                      isFavorite
                        ? "bg-red-500/10 border-red-500/30 text-red-500"
                        : "bg-white border-brand-champagne/60 text-brand-text-dark hover:border-brand-gold"
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-current" : ""}`} />
                    {isFavorite ? "Guardado" : "Favorito"}
                  </button>

                  <div className="flex items-center gap-1 bg-white border border-brand-champagne/60 px-3 py-2 shrink-0">
                    <Star className="w-3.5 h-3.5 text-brand-gold fill-brand-gold" />
                    <span className="text-xs font-semibold text-brand-text-dark">
                      {vendor.rating.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-brand-text-dark/45">
                      ({vendor.reviewsCount} avaliações)
                    </span>
                  </div>
                </div>
              </div>

              <p className="flex items-center gap-1.5 text-xs text-brand-text-dark/60 mt-3 pl-0.5">
                <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                {vendor.location}
              </p>
            </div>

            {/* Gallery Section */}
            <div className="space-y-4">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-zinc-100 border border-brand-champagne/20 shadow-xs">
                {activeImage && (
                  <Image
                    src={activeImage}
                    alt={vendor.name}
                    fill
                    className="object-cover object-center transition-all duration-500"
                    priority
                  />
                )}
              </div>

              {/* Asymmetric Thumbnails */}
              <div className="grid grid-cols-4 gap-3">
                <button
                  onClick={() => setActiveImage(vendor.imageCover)}
                  className={`relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100 border-2 transition-all ${
                    activeImage === vendor.imageCover ? "border-brand-gold scale-98" : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                >
                  <Image src={vendor.imageCover} alt={vendor.name} fill className="object-cover" />
                </button>
                {vendor.galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100 border-2 transition-all ${
                      activeImage === img ? "border-brand-gold scale-98" : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                  >
                    <Image src={img} alt={`${vendor.name} gallery ${idx}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Vendor Description */}
            <div className="bg-white border border-brand-champagne/30 rounded-2xl p-6 md:p-8 space-y-6">
              <div>
                <h2 className="font-serif text-2xl font-light text-brand-text-dark mb-4">Sobre o Fornecedor</h2>
                <p className="text-sm md:text-base text-brand-text-dark/75 font-light leading-relaxed whitespace-pre-line">
                  {vendor.extendedDescription}
                </p>
              </div>

              {/* Instagram link */}
              <div className="pt-6 border-t border-brand-champagne/25 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0">
                    <IconInstagram className="w-5 h-5 text-brand-gold" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-brand-text-dark">Instagram Oficial</h4>
                    <p className="text-xs text-brand-text-dark/50 font-light">{vendor.instagram}</p>
                  </div>
                </div>

                <Link
                  href={vendor.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-white px-5 py-2.5 text-[10px] font-mono tracking-wider uppercase font-bold transition-all duration-300"
                >
                  Ver no Instagram
                </Link>
              </div>
            </div>

            {/* Services checklist */}
            <div className="bg-[#FAF8F5] border border-brand-champagne/45 rounded-2xl p-6 md:p-8">
              <h2 className="font-serif text-2xl font-light text-brand-text-dark mb-6">Serviços Disponíveis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendor.services.map((service, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-brand-gold" />
                    </div>
                    <span className="text-xs md:text-sm text-brand-text-dark/80 font-light">
                      {service}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sticky Inquiry Widget (Right Side - 1 Col) */}
          <div className="lg:col-span-1 lg:sticky lg:top-28">
            <RevealOnScroll delay={0.1}>
              <div className="bg-white border-2 border-brand-gold/20 rounded-2xl p-6 md:p-8 shadow-[0_20px_50px_rgba(8,7,6,0.04)] space-y-6">

                {!submitSuccess ? (
                  <>
                    <div className="text-center space-y-2 pb-4 border-b border-brand-champagne/30">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-gold/10 text-brand-gold mb-1">
                        <Sparkles className="w-4.5 h-4.5" />
                      </div>
                      <h3 className="font-serif text-xl font-light text-brand-text-dark">Solicitar Proposta</h3>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-brand-text-dark/50">
                        Serviço Concierge Integrado
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-brand-text-dark/65 block">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ex: Ana Maria Silva"
                          className="w-full bg-[#faf8f5] border border-brand-champagne/60 rounded-md px-3 py-2.5 text-xs text-brand-text-dark placeholder-brand-text-dark/35 outline-none focus:border-brand-gold transition-colors"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-brand-text-dark/65 block">
                          Email de Contacto *
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Ex: ana.silva@gmail.com"
                          className="w-full bg-[#faf8f5] border border-brand-champagne/60 rounded-md px-3 py-2.5 text-xs text-brand-text-dark placeholder-brand-text-dark/35 outline-none focus:border-brand-gold transition-colors"
                        />
                      </div>

                      {/* Two fields row */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Wedding Date */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-brand-text-dark/65 block flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-brand-gold" />
                            Data
                          </label>
                          <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-[#faf8f5] border border-brand-champagne/60 rounded-md px-2 py-2.5 text-[10px] text-brand-text-dark outline-none focus:border-brand-gold transition-colors"
                          />
                        </div>

                        {/* Guest Count */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono uppercase tracking-wider text-brand-text-dark/65 block flex items-center gap-1">
                            <Users className="w-3 h-3 text-brand-gold" />
                            Nº Convidados
                          </label>
                          <input
                            type="number"
                            value={guests}
                            onChange={(e) => setGuests(e.target.value)}
                            placeholder="Ex: 150"
                            className="w-full bg-[#faf8f5] border border-brand-champagne/60 rounded-md px-2 py-2.5 text-[10px] text-brand-text-dark placeholder-brand-text-dark/35 outline-none focus:border-brand-gold transition-colors"
                          />
                        </div>
                      </div>

                      {/* Message */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-brand-text-dark/65 block flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-brand-gold" />
                          Mensagem / Detalhes *
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Olá! Gostaria de saber a vossa disponibilidade e obter um orçamento estimado para o meu casamento..."
                          className="w-full bg-[#faf8f5] border border-brand-champagne/60 rounded-md px-3 py-2.5 text-xs text-brand-text-dark placeholder-brand-text-dark/35 outline-none focus:border-brand-gold transition-colors resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-brand-text-dark hover:bg-brand-gold disabled:bg-brand-text-dark/50 text-white font-mono text-[10px] tracking-widest uppercase font-bold py-4 px-4 rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg mt-2"
                      >
                        {isSubmitting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <span>Enviar Pedido</span>
                            <Send className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-6 space-y-5 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <Check className="w-6 h-6" strokeWidth={2.5} />
                    </div>

                    <div>
                      <h3 className="font-serif text-xl text-brand-text-dark mb-2">Pedido Enviado!</h3>
                      <p className="text-xs text-brand-text-dark/70 font-light leading-relaxed">
                        A sua solicitação para <strong>{vendor.name}</strong> foi submetida com sucesso!
                      </p>
                      <p className="text-[11px] text-brand-gold font-light mt-3 leading-relaxed">
                        O fornecedor e a equipa Concierge da HAXR Signature analisarão o seu pedido e entrarão em contacto em breve por email.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-brand-champagne/30 space-y-3">
                      <button
                        onClick={handleWhatsAppContact}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[9px] tracking-widest uppercase font-bold py-3.5 px-4 rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Acelerar via WhatsApp</span>
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.449 5.39 0 9.761-4.373 9.764-9.764.001-2.612-1.012-5.066-2.855-6.91-1.842-1.844-4.293-2.857-6.907-2.858-5.385 0-9.757 4.37-9.76 9.761-.001 1.705.452 3.37 1.309 4.823L1.758 20.67l4.889-1.516z" />
                        </svg>
                      </button>

                      <button
                        onClick={() => setSubmitSuccess(false)}
                        className="text-xs text-brand-text-dark/50 hover:text-brand-text-dark font-mono uppercase tracking-widest"
                      >
                        Enviar Nova Solicitação
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </RevealOnScroll>
          </div>

        </div>

      </div>
    </div>
  );
}
