"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  MessageCircle,
  Gem,
  Printer,
  Download,
  Building2,
  Camera,
  Heart,
  Crown,
  Check,
} from "lucide-react";
import { packageForStyleKey } from "@/lib/marketing/style-quiz-packages";

interface QuizOption {
  text: string;
  description: string;
  image?: string;
  styleWeight: {
    minimalist: number;
    editorial: number;
    opulent: number;
    romantic: number;
  };
  bgClass: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  subtitle: string;
  options: QuizOption[];
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "Qual paleta de cores reflete a vossa alma?",
    subtitle: "As cores definem o tom emocional e a atmosfera da vossa celebração.",
    options: [
      {
        text: "Marfim, Champagne & Dourado Suave",
        description: "Clássico, intemporal e extremamente sofisticado.",
        styleWeight: { minimalist: 0, editorial: 3, opulent: 1, romantic: 1 },
        bgClass: "bg-gradient-to-br from-[#F7F1E8] via-[#EAD8B8] to-[#B88A2A]/35",
      },
      {
        text: "Branco Puro, Marfim & Verde Eucalipto",
        description: "Orgânico, limpo, focado na natureza e simplicidade botânica.",
        styleWeight: { minimalist: 3, editorial: 1, opulent: 0, romantic: 1 },
        bgClass: "bg-gradient-to-br from-[#ffffff] via-[#F7F1E8] to-[#6F7E5A]/25",
      },
      {
        text: "Preto Absoluto, Grafite & Dourado Metálico",
        description: "Contraste dramático, moderno e de alta-costura contemporânea.",
        styleWeight: { minimalist: 1, editorial: 2, opulent: 3, romantic: 0 },
        bgClass: "bg-gradient-to-br from-[#12100e] via-[#1a1715] to-[#B88A2A]/40",
      },
      {
        text: "Rosa Blush, Lavanda Suave & Rose Gold",
        description: "Delicado, poético e imerso num conto de fadas romântico.",
        styleWeight: { minimalist: 0, editorial: 1, opulent: 1, romantic: 3 },
        bgClass: "bg-gradient-to-br from-[#FFF0F5] via-[#E6E6FA] to-[#B88A2A]/20",
      },
    ],
  },
  {
    id: 2,
    question: "Onde se imaginam a dizer 'Sim'?",
    subtitle: "O cenário dita a escala física e a arquitetura do evento.",
    options: [
      {
        text: "Num salão histórico com tetos altos e lustres de cristal",
        description: "A imponência da história combinada com luxo clássico e protocolo.",
        styleWeight: { minimalist: 0, editorial: 2, opulent: 3, romantic: 1 },
        bgClass: "bg-gradient-to-br from-[#faf8f5] via-[#f3ede2] to-[#B88A2A]/30",
      },
      {
        text: "Num jardim botânico minimalista ou estufa de vidro",
        description: "Iluminação natural, transparência e elegância botânica orgânica.",
        styleWeight: { minimalist: 3, editorial: 1, opulent: 0, romantic: 2 },
        bgClass: "bg-gradient-to-br from-[#faf8f5] via-[#f0f4ec] to-[#6F7E5A]/25",
      },
      {
        text: "Numa galeria de arte moderna ou rooftop urbano em Maputo",
        description: "Design contemporâneo, vistas panorâmicas e linhas arquitetónicas retas.",
        styleWeight: { minimalist: 2, editorial: 3, opulent: 1, romantic: 0 },
        bgClass: "bg-gradient-to-br from-[#181614] via-[#24201c] to-[#B88A2A]/30",
      },
      {
        text: "Num resort de luxo privado junto à praia ao pôr-do-sol",
        description: "Destino paradisíaco, brisa tropical e sofisticação calma à beira-mar.",
        styleWeight: { minimalist: 1, editorial: 1, opulent: 1, romantic: 3 },
        bgClass: "bg-gradient-to-br from-[#faf8f5] via-[#f7f0e4] to-[#EAD8B8]/40",
      },
    ],
  },
  {
    id: 3,
    question: "Qual o visual de casamento ideal?",
    subtitle: "A vossa indumentária comunica a vossa personalidade artística.",
    options: [
      {
        text: "Linhas retas, caimento estruturado e sem ornamentos",
        description: "Foco total na silhueta e sofisticação discreta do Quiet Luxury.",
        styleWeight: { minimalist: 3, editorial: 1, opulent: 0, romantic: 0 },
        bgClass: "bg-gradient-to-br from-white via-[#fcfaf7] to-[#e8e4dc]/50",
      },
      {
        text: "Volume majestoso, véu catedral e bordados artesanais",
        description: "Tradição real reinterpretada para os tempos de hoje com impacto.",
        styleWeight: { minimalist: 0, editorial: 2, opulent: 3, romantic: 1 },
        bgClass: "bg-gradient-to-br from-[#faf8f5] via-[#f4ede1] to-[#B88A2A]/25",
      },
      {
        text: "Peça de alta-costura assimétrica com detalhes dramáticos",
        description: "Impacto visual e vanguarda dignos de passarela de alta moda.",
        styleWeight: { minimalist: 1, editorial: 3, opulent: 1, romantic: 0 },
        bgClass: "bg-gradient-to-br from-[#141210] via-[#1f1c19] to-[#B88A2A]/35",
      },
      {
        text: "Fluido, rendas poéticas, mangas românticas e flores 3D",
        description: "Movimento leve, conto de fadas moderno e sensibilidade artística.",
        styleWeight: { minimalist: 0, editorial: 1, opulent: 0, romantic: 3 },
        bgClass: "bg-gradient-to-br from-white via-[#fff5f7] to-[#E6E6FA]/40",
      },
    ],
  },
  {
    id: 4,
    question: "Qual a vibração desejada para a recepção?",
    subtitle: "Como querem que os convidados recordem a atmosfera da festa.",
    options: [
      {
        text: "Jantar intimista com mesas longas e velas infinitas",
        description: "Foco em conversas profundas, boa gastronomia e jazz acústico suave.",
        styleWeight: { minimalist: 2, editorial: 2, opulent: 0, romantic: 3 },
        bgClass: "bg-gradient-to-br from-[#faf8f5] via-[#f4ede2] to-[#B88A2A]/20",
      },
      {
        text: "Grande banquete de gala com protocolo impecável",
        description: "Celebração imponente, orquestra ao vivo e entretenimento de alto luxo.",
        styleWeight: { minimalist: 0, editorial: 1, opulent: 3, romantic: 1 },
        bgClass: "bg-gradient-to-br from-[#faf8f5] via-[#f3ede1] to-[#B88A2A]/30",
      },
      {
        text: "Festa moderna no rooftop com iluminação cénica e DJ",
        description: "Cocktails de assinatura, energia contagiante e atmosfera cosmopolita.",
        styleWeight: { minimalist: 1, editorial: 3, opulent: 1, romantic: 0 },
        bgClass: "bg-gradient-to-br from-[#12100e] via-[#1c1917] to-[#B88A2A]/35",
      },
      {
        text: "Almoço chique ao ar livre com decoração orgânica e descontraída",
        description: "Luz do dia, ambiente fresco, mariscos finos e sofisticação sem esforço.",
        styleWeight: { minimalist: 3, editorial: 0, opulent: 0, romantic: 2 },
        bgClass: "bg-gradient-to-br from-[#faf8f5] via-[#eef3eb] to-[#6F7E5A]/20",
      },
    ],
  },
  {
    id: 5,
    question: "Que tipo de convite ou papelaria preferem?",
    subtitle: "A papelaria é o primeiro contacto físico ou digital dos convidados.",
    options: [
      {
        text: "Papel texturado artesanal com relevo seco e tipografia limpa",
        description: "Tátil, luxo silencioso, tipografia nobre e minimalismo intemporal.",
        styleWeight: { minimalist: 3, editorial: 1, opulent: 0, romantic: 1 },
        bgClass: "bg-gradient-to-br from-white via-[#faf8f5] to-[#ece7de]",
      },
      {
        text: "Convites com caligrafia clássica à mão e lacre de cera dourado",
        description: "Preservação da etiqueta clássica aristocrática com toque real.",
        styleWeight: { minimalist: 0, editorial: 2, opulent: 3, romantic: 1 },
        bgClass: "bg-gradient-to-br from-[#faf8f5] via-[#f5eee3] to-[#B88A2A]/30",
      },
      {
        text: "Convite Digital interativo com música, galeria e RSVP premium",
        description: "Experiência digital contemporânea de vanguarda com animações fluidas.",
        styleWeight: { minimalist: 1, editorial: 3, opulent: 1, romantic: 1 },
        bgClass: "bg-gradient-to-br from-[#141210] via-[#201c19] to-[#B88A2A]/35",
      },
      {
        text: "Detalhes florais em aguarela com tipografia cursiva elegante",
        description: "Delicadeza editorial, ilustrações personalizadas e poesia visual.",
        styleWeight: { minimalist: 0, editorial: 1, opulent: 0, romantic: 3 },
        bgClass: "bg-gradient-to-br from-white via-[#fcf6f7] to-[#E6E6FA]/30",
      },
    ],
  },
];

interface FeaturedWedding {
  couple: string;
  venue: string;
  image: string;
  quote: string;
  href: string;
}

interface StyleResult {
  key: string;
  title: string;
  description: string;
  detailedDesc: string;
  palette: string[];
  recommendations: string[];
  featuredWedding: FeaturedWedding;
}

const styleResults: Record<string, StyleResult> = {
  minimalist: {
    key: "minimalist",
    title: "Minimalismo Orgânico",
    description: "A sofisticação do luxo silencioso. Linhas limpas, natureza viva e design focado no essencial.",
    detailedDesc:
      "O vosso estilo celebra a beleza da pureza. Menos elementos com maior escala e significado. A decoração aposta em folhagens verdes (como o eucalipto), luz natural abundante, mesas corridas sem excesso e uma identidade visual limpa baseada em tipografia de alta qualidade. É a elegância que não precisa de gritar para ser notada.",
    palette: ["#FFFFFF", "#F7F1E8", "#6F7E5A", "#EAD8B8"],
    recommendations: [
      "Serviço HAXR RSVP & Convite Digital com layout 'Classic Ivory'",
      "Decoração botânica com foco em velas flutuantes e ramos de oliveira e eucalipto",
      "Look de noivos clean com tecidos estruturados (crepe nobre ou zibelina de seda)",
    ],
    featuredWedding: {
      couple: "Inês & Marcelo",
      venue: "Estufa Botânica & Jardim Privado, Maputo",
      image: "/images/portfolio/mosaic-mesa-detalhe-dourado.webp",
      quote: "Uma celebração botânica de luz natural e gastronomia orgânica.",
      href: "/portfolio",
    },
  },
  editorial: {
    key: "editorial",
    title: "Clássico Editorial",
    description: "Estilo contemporâneo digno de revista de moda. Fusão de alta-costura, design e inovação.",
    detailedDesc:
      "Vocês procuram uma celebração com direcção artística de vanguarda. O vosso casamento assemelha-se a uma produção editorial da Vogue: iluminação cénica bem desenhada, paletas de cores arrojadas, contrastes nobres e fotografia documental cinematográfica. A tecnologia e a curadoria de design caminham juntas na criação de um evento inesquecível.",
    palette: ["#080706", "#F7F1E8", "#B88A2A", "#C2BAA9"],
    recommendations: [
      "Website de Casamento Premium HAXR com galeria de alta performance",
      "Direcção artística HAXR com monograma e tipografias customizadas",
      "Iluminação arquitetónica e fotografia em estilo documental e editorial",
    ],
    featuredWedding: {
      couple: "Vânia Luky & Fabião Dimande",
      venue: "Evelyn Eventos, Maputo",
      image: "/images/casamento-vania-fabiao-evelyn-eventos.webp",
      quote: "Recepção de alta-costura com contrastes nobres em preto, marfim e dourado.",
      href: "/portfolio",
    },
  },
  opulent: {
    key: "opulent",
    title: "Opulência Moderna",
    description: "Grandiosidade, luxo clássico e impacto cénico. Uma recepção majestosa que ficará na história.",
    detailedDesc:
      "Para vocês, o casamento é um marco majestoso. Vocês valorizam a tradição real, com grandes salões de banquetes, decorações florais densas e imponentes (com rosas e hortênsias), e entretenimento sofisticado. O vosso evento é concebido para impressionar e mimar os convidados com o melhor em catering, protocolo e cenografia.",
    palette: ["#B88A2A", "#080706", "#FFFFFF", "#EAD8B8"],
    recommendations: [
      "Assessoria Completa HAXR com gestão detalhada de orçamentos amplos",
      "Plataforma HAXR 'Find Your Seat' no ecrã da recepção para acolher 300+ convidados",
      "Festa de gala com orquestra ou banda cénica e bar de cocktails premium",
    ],
    featuredWedding: {
      couple: "Tatiana & Celso",
      venue: "Grande Salão Nobre · Polana Serena Hotel, Maputo",
      image: "/images/portfolio/mosaic-salao-branco-preparado.webp",
      quote: "Banquete imperial com lustres de cristal e protocolo impecável.",
      href: "/portfolio",
    },
  },
  romantic: {
    key: "romantic",
    title: "Romance Poético",
    description: "Uma celebração mágica imersa em contos de fadas, suavidade e poesia visual.",
    detailedDesc:
      "A vossa visão é puramente romântica e poética. O casamento ideal é repleto de luz de velas suave, flores em tons pastéis dispostas de forma orgânica, tecidos fluidos e momentos de pura emoção. Cada detalhe comunica proximidade, magia e sensibilidade, criando uma atmosfera sonhadora tanto na cerimónia como na recepção.",
    palette: ["#FFF0F5", "#E6E6FA", "#EAD8B8", "#6F7E5A"],
    recommendations: [
      "Save the Date e Convite HAXR com banda sonora clássica romântica",
      "Mesa de doces e bolo de casamento ornamentados com flores comestíveis em tons pastel",
      "Recepção à luz de velas suspensas ou cascatas de micro-lâmpadas",
    ],
    featuredWedding: {
      couple: "Jéssica & Mauro",
      venue: "Costa de Maputo ao Pôr-do-Sol · Katembe",
      image: "/images/portfolio/mosaic-casal-painel-branco.webp",
      quote: "Troca de votos à beira-mar com velas flutuantes e atmosfera poética.",
      href: "/portfolio",
    },
  },
};

export default function StyleQuizPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [scores, setScores] = useState({
    minimalist: 0,
    editorial: 0,
    opulent: 0,
    romantic: 0,
  });
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadEventType, setLeadEventType] = useState("casamento");
  const [leadBudget, setLeadBudget] = useState("250k-500k MZN");
  const [leadUrgency, setLeadUrgency] = useState("3-6 meses");
  const [leadStatus, setLeadStatus] = useState("");
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  const startQuiz = () => {
    setScores({ minimalist: 0, editorial: 0, opulent: 0, romantic: 0 });
    setCurrentStep(1);
    setSelectedOptionIdx(null);
  };

  const handleSelectOption = (idx: number) => {
    setSelectedOptionIdx(idx);
  };

  const nextStep = () => {
    if (selectedOptionIdx === null) return;

    const currentQuestion = quizQuestions[currentStep - 1];
    const weight = currentQuestion.options[selectedOptionIdx].styleWeight;
    setScores((prev) => ({
      minimalist: prev.minimalist + weight.minimalist,
      editorial: prev.editorial + weight.editorial,
      opulent: prev.opulent + weight.opulent,
      romantic: prev.romantic + weight.romantic,
    }));

    setSelectedOptionIdx(null);
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setSelectedOptionIdx(null);
    setCurrentStep((prev) => prev - 1);
  };

  const getWinner = (): StyleResult => {
    let maxScore = -1;
    let winnerKey = "editorial";

    (Object.keys(scores) as Array<keyof typeof scores>).forEach((key) => {
      if (scores[key] > maxScore) {
        maxScore = scores[key];
        winnerKey = key;
      }
    });

    return styleResults[winnerKey];
  };

  const winner = getWinner();
  const recommendedPackage = packageForStyleKey(winner.key);

  /* ── Guardar resultado do Style Quiz no localStorage para match no directório ── */
  useEffect(() => {
    if (currentStep === 6 && winner) {
      try {
        localStorage.setItem(
          "haxr_style_quiz_result",
          JSON.stringify({
            key: winner.key,
            title: winner.title,
            timestamp: Date.now(),
          }),
        );
      } catch {
        // localStorage gracefully ignored if disabled
      }
    }
  }, [currentStep, winner]);

  const handlePrintBrandBook = () => {
    window.print();
  };

  async function submitStyleQuizLead() {
    setLeadStatus("");
    setLeadSubmitting(true);
    try {
      const response = await fetch("/api/marketing/style-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadName,
          email: leadEmail,
          phone: leadPhone,
          eventType: leadEventType,
          budgetRange: leadBudget,
          urgency: leadUrgency,
          styleResult: winner.title,
          styleDescription: winner.description,
          marketingOptIn: true,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setLeadStatus(payload.error ?? "Não foi possível guardar o lead.");
        return;
      }
      setLeadStatus("Obrigado! A equipa HAXR irá contactar-vos com uma proposta personalizada.");
    } catch {
      setLeadStatus("Erro de ligação. Tente novamente.");
    } finally {
      setLeadSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen py-28 md:py-36 flex items-center justify-center bg-[#faf8f5] text-brand-text-dark font-sans overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(184,138,42,0.06),transparent_50%)]" />
      <div className="absolute -left-1/4 -bottom-1/4 w-[60vw] h-[60vw] rounded-full bg-brand-champagne/10 blur-[120px]" />

      <div className="site-container-wide mx-auto px-4 relative z-10 max-w-5xl w-full">
        <AnimatePresence mode="wait">
          {/* ══════════════════════════════════════════════════
              PASSO 0: INTRODUÇÃO EDITORIAL DO STYLE QUIZ
             ══════════════════════════════════════════════════ */}
          {currentStep === 0 && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: [0.25, 0, 0.1, 1] }}
              className="text-center space-y-8 max-w-2xl mx-auto py-12"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 border border-brand-gold/30 bg-brand-gold/5 rounded-full text-brand-gold font-mono text-[9px] uppercase tracking-widest">
                <Gem className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Style Quiz HAXR</span>
              </div>

              <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-light text-brand-text-dark leading-tight tracking-wide">
                Descubra a identidade estética do seu evento
              </h1>

              <p className="font-sans text-sm md:text-base text-brand-text-dark/70 font-light leading-relaxed max-w-xl mx-auto">
                Responda a 5 perguntas rápidas sobre paleta de cores, vestuário, local e recepção. A nossa curadoria visual indicará a vossa assinatura estética de casamento ideal e serviços personalizados.
              </p>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={startQuiz}
                  className="px-8 py-3.5 border border-brand-gold bg-brand-gold text-brand-black font-mono text-[10px] tracking-[0.25em] uppercase font-bold hover:bg-brand-gold-light hover:border-brand-gold-light transition-all duration-300 shadow-md cursor-pointer inline-flex items-center gap-3 rounded-xl"
                >
                  <span>Iniciar o Quiz</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════
              PASSOS 1 A 5: AS 5 PERGUNTAS INTERATIVAS
             ══════════════════════════════════════════════════ */}
          {currentStep > 0 && currentStep <= 5 && (
            <motion.div
              key={`question-${currentStep}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.45, ease: [0.25, 0, 0.1, 1] }}
              className="space-y-8 max-w-4xl mx-auto"
            >
              {/* Barra de Progresso Superior */}
              <div className="flex items-center justify-between text-brand-text-dark/45 font-mono text-[10px] uppercase tracking-wider">
                <span className="font-semibold text-brand-gold">Pergunta 0{currentStep} de 05</span>
                <div className="w-48 h-1.5 bg-brand-champagne/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-gold transition-all duration-500 rounded-full"
                    style={{ width: `${(currentStep / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 text-center md:text-left">
                <h2 className="font-serif text-2xl md:text-4xl font-light text-brand-text-dark leading-tight">
                  {quizQuestions[currentStep - 1].question}
                </h2>
                <p className="font-sans text-xs md:text-sm text-brand-text-dark/60 font-light">
                  {quizQuestions[currentStep - 1].subtitle}
                </p>
              </div>

              {/* Grid das 4 Opções Editoriais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {quizQuestions[currentStep - 1].options.map((option, idx) => {
                  const isSelected = selectedOptionIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(idx)}
                      className={`p-6 md:p-7 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group min-h-[160px] flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? "border-brand-gold bg-white shadow-md scale-[1.015] ring-2 ring-brand-gold/20"
                          : "border-brand-champagne/45 bg-white/80 hover:bg-white hover:border-brand-gold/60 shadow-xs"
                      }`}
                    >
                      <div
                        className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${option.bgClass}`}
                      />
                      {isSelected && (
                        <div className={`absolute inset-0 opacity-15 ${option.bgClass}`} />
                      )}

                      <div className="relative z-10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-mono text-[9px] uppercase tracking-widest ${
                              isSelected ? "text-brand-gold font-bold" : "text-brand-text-dark/40"
                            }`}
                          >
                            Opção 0{idx + 1}
                          </span>
                          <div
                            className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? "border-brand-gold bg-brand-gold text-brand-black"
                                : "border-brand-champagne/60"
                            }`}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                          </div>
                        </div>

                        <h3 className="font-serif text-base md:text-lg font-medium text-brand-text-dark leading-snug">
                          {option.text}
                        </h3>
                      </div>

                      <p className="relative z-10 font-sans text-xs text-brand-text-dark/65 leading-relaxed font-light mt-4">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Barra de Navegação Inferior */}
              <div className="flex items-center justify-between pt-6 border-t border-brand-champagne/20">
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center gap-2 font-mono text-[10px] tracking-wider uppercase text-brand-text-dark/60 hover:text-brand-text-dark cursor-pointer py-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  disabled={selectedOptionIdx === null}
                  onClick={nextStep}
                  className={`inline-flex items-center gap-2 py-3.5 px-8 font-mono text-[10px] tracking-widest uppercase font-bold rounded-xl cursor-pointer shadow-xs transition-all ${
                    selectedOptionIdx === null
                      ? "bg-brand-champagne/30 text-brand-text-dark/30 border-brand-champagne/45 cursor-not-allowed"
                      : "bg-brand-gold hover:bg-brand-gold-light text-brand-black"
                  }`}
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════
              PASSO 6: RESULTADO DE ALTA-COSTURA & BRAND BOOK
             ══════════════════════════════════════════════════ */}
          {currentStep === 6 && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.6, ease: [0.25, 0, 0.1, 1] }}
              className="bg-white border border-brand-champagne/60 rounded-3xl p-6 sm:p-10 md:p-14 shadow-xl space-y-10 max-w-4xl mx-auto"
            >
              {/* Cabeçalho do Resultado */}
              <div className="text-center space-y-3 max-w-2xl mx-auto">
                <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-brand-gold font-bold">
                  Diagnóstico Estético HAXR
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-brand-text-dark tracking-wide">
                  {winner.title}
                </h2>
                <p className="font-serif text-base sm:text-lg italic text-brand-gold font-light">
                  &ldquo;{winner.description}&rdquo;
                </p>
              </div>

              {/* Paleta de Cores Interativa com Códigos Hexadecimais */}
              <div className="space-y-3 max-w-md mx-auto text-center p-5 rounded-2xl border border-brand-champagne/30 bg-[#faf8f5]">
                <p className="font-mono text-[9px] uppercase tracking-widest text-brand-text-dark/50 font-bold">
                  Paleta de Cores da Vossa Assinatura
                </p>
                <div className="flex items-center justify-center gap-3 pt-1">
                  {winner.palette.map((color, idx) => (
                    <div key={idx} className="group relative flex flex-col items-center">
                      <div
                        className="w-12 h-12 rounded-full border border-brand-champagne/65 shadow-xs transition-transform hover:scale-110 cursor-pointer"
                        style={{ backgroundColor: color }}
                      />
                      <span className="mt-1.5 font-mono text-[8px] text-brand-text-dark/60 font-semibold tracking-wider">
                        {color}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Descrição Curada */}
              <div className="bg-[#faf8f5] border border-brand-champagne/35 p-6 md:p-8 rounded-2xl space-y-3 font-light leading-relaxed text-sm md:text-base text-brand-text-dark/85">
                <p>{winner.detailedDesc}</p>
              </div>

              {/* ── CARD DE DESTAQUE: CASAMENTO REAL CORRESPONDENTE EM MOÇAMBIQUE ── */}
              <div className="rounded-2xl border border-brand-gold/30 bg-gradient-to-br from-[#faf8f5] to-white p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-brand-champagne/30 pb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-brand-gold" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-brand-gold font-bold">
                      Casamento Real com Esta Estética em Maputo
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-brand-text-dark/45 uppercase">
                    Portfólio HAXR
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  <div className="md:col-span-4 relative aspect-[4/3] rounded-xl overflow-hidden shadow-xs border border-brand-champagne/40">
                    <Image
                      src={winner.featuredWedding.image}
                      alt={winner.featuredWedding.couple}
                      fill
                      sizes="(max-width: 768px) 100vw, 300px"
                      className="object-cover"
                    />
                  </div>
                  <div className="md:col-span-8 space-y-2">
                    <h4 className="font-serif text-xl sm:text-2xl font-medium text-brand-text-dark">
                      {winner.featuredWedding.couple}
                    </h4>
                    <p className="font-mono text-xs text-brand-gold">
                      {winner.featuredWedding.venue}
                    </p>
                    <p className="font-sans text-xs text-brand-text-dark/70 font-light leading-relaxed italic">
                      &ldquo;{winner.featuredWedding.quote}&rdquo;
                    </p>
                    <div className="pt-2">
                      <Link
                        href={winner.featuredWedding.href}
                        className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-brand-gold hover:text-brand-gold-light hover:underline"
                      >
                        <span>Explorar a Galeria Completa</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sugestões Técnicas HAXR */}
              <div className="space-y-4">
                <h4 className="font-mono text-[10px] tracking-widest uppercase text-brand-gold font-bold">
                  3 Recomendações Estratégicas HAXR:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {winner.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-brand-champagne/30 bg-[#faf8f5] space-y-2"
                    >
                      <span className="w-6 h-6 rounded-full border border-brand-gold/45 text-brand-gold flex items-center justify-center text-[10px] font-mono font-bold">
                        0{i + 1}
                      </span>
                      <p className="font-sans text-xs text-brand-text-dark/80 font-light leading-relaxed">
                        {rec}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pacote Recomendado */}
              <div className="rounded-2xl border border-brand-gold/35 bg-gradient-to-r from-[#181614] to-[#0c0a09] text-white p-7 text-center space-y-4 shadow-lg">
                <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-brand-gold font-bold">
                  Pacote HAXR Recomendado para a Vossa Estética
                </p>
                <h3 className="font-serif text-3xl font-light text-white">
                  {recommendedPackage.name}
                </h3>
                <p className="font-sans text-sm text-white/70 max-w-lg mx-auto font-light">
                  {recommendedPackage.tagline}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Link
                    href={recommendedPackage.contactHref}
                    className="inline-flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold-light text-brand-black font-mono text-[10px] tracking-widest uppercase font-bold px-6 py-3.5 rounded-xl shadow-xs"
                  >
                    Pedir proposta {recommendedPackage.name}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href={recommendedPackage.href}
                    className="inline-flex items-center justify-center font-mono text-[10px] tracking-widest uppercase text-white/70 hover:text-brand-gold py-3"
                  >
                    Ver detalhes de todos os pacotes →
                  </Link>
                </div>
              </div>

              {/* Card de Match de Fornecedores com o Estilo */}
              <div className="rounded-2xl border border-brand-gold/35 bg-gradient-to-br from-white to-[#faf8f5] p-6 text-center space-y-3 shadow-sm">
                <div className="flex items-center justify-center gap-2 text-brand-gold">
                  <Crown className="w-4 h-4" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.25em] font-bold">
                    Curadoria de Fornecedores Recomendados
                  </span>
                </div>
                <h4 className="font-serif text-xl font-light text-brand-text-dark">
                  Descubra os profissionais que dominam a estética {winner.title}
                </h4>
                <p className="text-xs font-light text-brand-text-dark/65 max-w-md mx-auto">
                  Filtre quintas, fotógrafos, decoradores e ateliers com selo de compatibilidade de 96%+ para o vosso casamento.
                </p>
                <div className="pt-1">
                  <Link
                    href={`/fornecedores?style=${winner.key}`}
                    className="inline-flex items-center justify-center gap-2 border border-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-black text-brand-gold font-mono text-[10px] tracking-widest uppercase font-bold px-6 py-3 rounded-xl transition-colors"
                  >
                    Ver Fornecedores com 96%+ Match
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Formulário de Proposta Personalizada */}
              <div className="border border-brand-champagne/40 bg-[#faf8f5] rounded-2xl p-6 sm:p-8 space-y-5 max-w-xl mx-auto shadow-2xs">
                <div className="text-center space-y-1">
                  <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-brand-gold font-bold">
                    Proposta Exclusiva Sob Medida
                  </p>
                  <h4 className="font-serif text-xl font-medium text-brand-text-dark">
                    Receber Proposta & Moodboard HAXR
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="Nome dos Noivos"
                    className="border border-brand-champagne/50 bg-white rounded-xl px-3.5 py-2.5 text-xs font-light text-brand-text-dark focus:outline-brand-gold"
                  />
                  <input
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                    className="border border-brand-champagne/50 bg-white rounded-xl px-3.5 py-2.5 text-xs font-light text-brand-text-dark focus:outline-brand-gold"
                  />
                  <input
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="Telefone / WhatsApp"
                    className="border border-brand-champagne/50 bg-white rounded-xl px-3.5 py-2.5 text-xs font-light text-brand-text-dark focus:outline-brand-gold"
                  />
                  <select
                    value={leadEventType}
                    onChange={(e) => setLeadEventType(e.target.value)}
                    className="border border-brand-champagne/50 bg-white rounded-xl px-3.5 py-2.5 text-xs font-light text-brand-text-dark focus:outline-brand-gold"
                  >
                    <option value="casamento">Casamento</option>
                    <option value="corporativo">Corporativo de Luxo</option>
                    <option value="aniversario">Celebração Privada</option>
                  </select>
                  <select
                    value={leadBudget}
                    onChange={(e) => setLeadBudget(e.target.value)}
                    className="border border-brand-champagne/50 bg-white rounded-xl px-3.5 py-2.5 text-xs font-light text-brand-text-dark focus:outline-brand-gold"
                  >
                    <option value="até 250k MZN">Até 250k MZN</option>
                    <option value="250k-500k MZN">250k – 500k MZN</option>
                    <option value="500k+ MZN">500k+ MZN</option>
                  </select>
                  <select
                    value={leadUrgency}
                    onChange={(e) => setLeadUrgency(e.target.value)}
                    className="border border-brand-champagne/50 bg-white rounded-xl px-3.5 py-2.5 text-xs font-light text-brand-text-dark focus:outline-brand-gold"
                  >
                    <option value="1-3 meses">Data: 1–3 meses</option>
                    <option value="3-6 meses">Data: 3–6 meses</option>
                    <option value="6+ meses">Data: 6+ meses</option>
                  </select>
                </div>
                <button
                  type="button"
                  disabled={leadSubmitting || !leadName.trim() || !leadEmail.trim()}
                  onClick={submitStyleQuizLead}
                  className="w-full py-3.5 bg-brand-black text-white font-mono text-[10px] tracking-widest uppercase font-bold rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {leadSubmitting ? "A registar proposta..." : "Solicitar Consultoria de Estilo HAXR"}
                </button>
                {leadStatus ? (
                  <p className="text-xs text-center text-brand-gold font-semibold pt-1">
                    {leadStatus}
                  </p>
                ) : null}
              </div>

              {/* Botões Finais de Ação (Exportar PDF, WhatsApp & Refazer) */}
              <div className="pt-6 border-t border-brand-champagne/45 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={startQuiz}
                  className="inline-flex items-center gap-2 font-mono text-[10px] tracking-wider uppercase text-brand-text-dark/60 hover:text-brand-text-dark cursor-pointer py-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refazer o Teste</span>
                </button>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {/* Botão de Exportar Brand Book PDF */}
                  <button
                    type="button"
                    onClick={handlePrintBrandBook}
                    className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl border border-brand-champagne/60 bg-white text-brand-text-dark font-mono text-[10px] tracking-wider uppercase hover:border-brand-gold transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-brand-gold" />
                    <span>Salvar Brand Book (PDF)</span>
                  </button>

                  {/* Botão WhatsApp */}
                  <a
                    href={`https://wa.me/258870883428?text=${encodeURIComponent(
                      `Olá HAXR Signature, fizemos o Style Quiz no vosso site e o nosso resultado foi: "${winner.title}" (${winner.description}). Gostaríamos de falar com um organizador para partilhar a nossa visão!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 py-3 px-7 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] tracking-widest uppercase font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Falar no WhatsApp</span>
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
