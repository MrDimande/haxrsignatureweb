import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { Quote } from "lucide-react";

export default function ProofOfExecution() {
  const verifiedQuotes = [
    {
      quote:
        "A equipa HAXR estruturou cada momento do protocolo com elevado rigor e sensibilidade, assegurando uma celebração verdadeiramente memorável no Evelyn Eventos.",
      author: "Casamento no Evelyn Eventos",
      context: "Maputo · Moçambique · 250 convidados",
      service: "Assessoria Completa & Web-Convite",
    },
    {
      quote:
        "A harmonização dos ritos tradicionais com a tecnologia do Web-Convite e do Plus Memories acolheu as duas famílias com distinção e dignidade.",
      author: "Cerimónia de Lobolo em Maputo",
      context: "Maputo · Moçambique · 300 convidados",
      service: "Gestão Digital & Plus Memories",
    },
    {
      quote:
        "O Web-Convite estabeleceu imediatamente o tom da festa e facilitou imenso a confirmação dos convidados, permitindo-nos planear cada mesa sem sobressaltos.",
      author: "Jessica & Samuel",
      context: "Save the Date Bespoke · Edição Legado",
      service: "Identidade & RSVP Digital",
    },
  ];

  return (
    <section className="relative py-20 md:py-32 bg-brand-black text-brand-ivory overflow-hidden">
      <div className="site-container mx-auto">
        <div className="max-w-3xl mb-14 md:mb-20 space-y-3">
          <RevealOnScroll>
            <p className="font-mono text-[9px] md:text-[10px] tracking-[0.35em] uppercase text-brand-gold">
              Secção 07 · Confiança & Memórias
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.06}>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-brand-ivory leading-[1.2]">
              Palavras de Confiança
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.12}>
            <p className="font-sans text-base text-brand-ivory/80 leading-relaxed font-light">
              O testemunho sincero de quem confiou na HAXR para transformar a sua celebração num momento sereno e inesquecível.
            </p>
          </RevealOnScroll>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {verifiedQuotes.map((item, idx) => (
            <RevealOnScroll key={item.author} delay={idx * 0.1}>
              <div className="rounded-2xl border border-brand-gold/20 bg-brand-black-soft/60 p-7 sm:p-9 flex flex-col justify-between h-full space-y-6 hover:border-brand-gold/45 transition-colors">
                <div className="space-y-4">
                  <Quote className="w-6 h-6 text-brand-gold/60 rotate-180" />
                  <p className="font-serif text-base sm:text-lg text-brand-ivory/90 leading-relaxed font-light italic">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-brand-gold/15 space-y-1">
                  <p className="font-serif text-base font-light text-brand-gold">{item.author}</p>
                  <p className="font-mono text-[9px] tracking-[0.15em] text-brand-champagne/70 uppercase">
                    {item.context}
                  </p>
                  <p className="font-sans text-[11px] text-brand-ivory/50 font-light">
                    {item.service}
                  </p>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
