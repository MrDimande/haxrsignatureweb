import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function HaxrMethodology() {
  const steps = [
    {
      step: "01",
      title: "Conversa e Diagnóstico Inicial",
      desc: "Reunião de escuta profunda para compreender os desejos, restrições e atmosfera ambicionada.",
    },
    {
      step: "02",
      title: "Definição do Âmbito e Proposta",
      desc: "Apresentação de proposta transparente e discriminada, sem surpresas nem ambiguidades operacionais.",
    },
    {
      step: "03",
      title: "Conceito e Planeamento",
      desc: "Direcção criativa, alinhamento do cronograma mestre e curadoria criteriosa de fornecedores.",
    },
    {
      step: "04",
      title: "Preparação e Validações",
      desc: "Testes técnicos de Web-Convites, validação de listas de convidados, plantas e rotas logísticas.",
    },
    {
      step: "05",
      title: "Execução e Entrega",
      desc: "Coordenação presencial minuciosa, acolhimento dos convidados e suporte em tempo real.",
    },
    {
      step: "06",
      title: "Encerramento e Acompanhamento",
      desc: "Consolidação de memórias, relatórios operacionais e entrega dos arquivos definitivos.",
    },
  ];

  const pillars = [
    { name: "Clareza", desc: "Visibilidade contínua de prazos, entregáveis e orçamentos." },
    { name: "Acompanhamento", desc: "Um interlocutor dedicado e disponível durante todo o percurso." },
    { name: "Tranquilidade", desc: "Os noivos e anfitriões vivem a celebração com o coração leve." },
    { name: "Discrição", desc: "Privacidade absoluta sobre dados, listas e convidados VIP." },
    { name: "Rigor", desc: "Gestão pontual minuto a minuto sem desvios do planeamento." },
    { name: "Personalização", desc: "Zero modelos padronizados; cada assinatura é única." },
  ];

  return (
    <section className="relative py-20 md:py-32 bg-brand-ivory text-brand-text-dark border-t border-brand-champagne/40">
      <div className="site-container mx-auto">
        {/* Cabeçalho */}
        <div className="max-w-3xl mb-14 md:mb-20 space-y-3">
          <RevealOnScroll>
            <p className="font-mono text-[9px] md:text-[10px] tracking-[0.35em] uppercase text-brand-gold">
              Secção 06 · Método & Disciplina
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.06}>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-brand-text-dark leading-[1.2]">
              O Método HAXR
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.12}>
            <p className="font-sans text-base md:text-lg text-brand-text-dark/75 leading-relaxed font-light">
              Organização e emoção não são opostos. A disciplina nos bastidores é exactamente o que liberta a beleza à frente dos convidados.
            </p>
          </RevealOnScroll>
        </div>

        {/* 6 Etapas Metodológicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16 md:mb-24">
          {steps.map((st, idx) => (
            <RevealOnScroll key={st.step} delay={idx * 0.06}>
              <div className="rounded-2xl border border-brand-champagne/50 bg-white p-6 sm:p-8 space-y-3 shadow-[0_10px_30px_rgba(8,7,6,0.03)] hover:border-brand-gold/50 transition-colors">
                <span className="font-mono text-[11px] font-semibold tracking-wider text-brand-gold">
                  Passo {st.step}
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-light text-brand-text-dark">
                  {st.title}
                </h3>
                <p className="font-sans text-xs sm:text-sm text-brand-text-dark/70 leading-relaxed font-light">
                  {st.desc}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        {/* Pilares de Compromisso */}
        <RevealOnScroll>
          <div className="rounded-2xl md:rounded-3xl border border-brand-champagne/50 bg-white/70 p-8 sm:p-12 shadow-[0_20px_50px_rgba(8,7,6,0.04)]">
            <div className="text-center max-w-xl mx-auto mb-10">
              <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-brand-gold mb-2">
                Compromissos Fundamentais
              </p>
              <h3 className="font-serif text-2xl font-light text-brand-text-dark">
                Os Benefícios da Assinatura
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
              {pillars.map((pil) => (
                <div key={pil.name} className="space-y-1.5">
                  <p className="font-serif text-base sm:text-lg font-light text-brand-text-dark">
                    {pil.name}
                  </p>
                  <p className="font-sans text-[11px] text-brand-text-dark/65 leading-relaxed font-light">
                    {pil.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
