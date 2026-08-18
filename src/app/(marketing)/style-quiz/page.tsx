"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, ArrowLeft, RefreshCw, MessageCircle } from "lucide-react";
import Link from "next/link";
import { packageForStyleKey } from "@/lib/marketing/style-quiz-packages";

interface QuizQuestion {
  id: number;
  question: string;
  subtitle: string;
  options: {
    text: string;
    description: string;
    styleWeight: {
      minimalist: number;
      editorial: number;
      opulent: number;
      romantic: number;
    };
    bgClass: string;
  }[];
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
        bgClass: "bg-gradient-to-br from-[#F7F1E8] via-[#EAD8B8] to-[#B88A2A]/40",
      },
      {
        text: "Branco Puro, Marfim & Verde Eucalipto",
        description: "Orgânico, limpo, focado na natureza e simplicidade.",
        styleWeight: { minimalist: 3, editorial: 1, opulent: 0, romantic: 1 },
        bgClass: "bg-gradient-to-br from-[#ffffff] via-[#F7F1E8] to-[#6F7E5A]/30",
      },
      {
        text: "Preto Absoluto, Grafite & Dourado Metálico",
        description: "Contraste dramático, moderno e de alta-costura.",
        styleWeight: { minimalist: 1, editorial: 2, opulent: 3, romantic: 0 },
        bgClass: "bg-gradient-to-br from-[#080706] via-[#12100e] to-[#B88A2A]/60 text-white",
      },
      {
        text: "Rosa Blush, Lavanda Suave & Rose Gold",
        description: "Delicado, poético e imerso em conto de fadas.",
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
        description: "A imponência da história combinada com luxo clássico.",
        styleWeight: { minimalist: 0, editorial: 2, opulent: 3, romantic: 1 },
        bgClass: "bg-gradient-to-br from-brand-ivory to-brand-champagne/40",
      },
      {
        text: "Num jardim botânico minimalista ou estufa de vidro",
        description: "Iluminação natural, transparência e elegância botânica.",
        styleWeight: { minimalist: 3, editorial: 1, opulent: 0, romantic: 2 },
        bgClass: "bg-gradient-to-br from-brand-ivory via-brand-champagne/20 to-brand-eucalyptus/25",
      },
      {
        text: "Numa galeria de arte moderna ou rooftop urbano em Maputo",
        description: "Design contemporâneo, vistas panorâmicas e linhas retas.",
        styleWeight: { minimalist: 2, editorial: 3, opulent: 1, romantic: 0 },
        bgClass: "bg-gradient-to-br from-brand-black/90 to-brand-black/70 text-white",
      },
      {
        text: "Num resort de luxo privado junto à praia ao pôr-do-sol",
        description: "Destino paradisíaco, brisa tropical e sofisticação calma.",
        styleWeight: { minimalist: 1, editorial: 1, opulent: 1, romantic: 3 },
        bgClass: "bg-gradient-to-br from-brand-ivory via-brand-champagne/30 to-[#EAD8B8]/30",
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
        description: "Foco total na silhueta, sofisticação discreta.",
        styleWeight: { minimalist: 3, editorial: 1, opulent: 0, romantic: 0 },
        bgClass: "bg-gradient-to-br from-white to-brand-ivory",
      },
      {
        text: "Volume majestoso, véu catedral e bordados artesanais",
        description: "Tradição real reinterpretada para os tempos de hoje.",
        styleWeight: { minimalist: 0, editorial: 2, opulent: 3, romantic: 1 },
        bgClass: "bg-gradient-to-br from-brand-ivory via-brand-champagne/30 to-brand-gold/15",
      },
      {
        text: "Peça de alta-costura assimétrica com detalhes dramáticos",
        description: "Impacto visual digno de passarela de moda.",
        styleWeight: { minimalist: 1, editorial: 3, opulent: 1, romantic: 0 },
        bgClass: "bg-gradient-to-br from-brand-black/95 to-brand-black/80 text-white",
      },
      {
        text: "Fluido, rendas poéticas, mangas românticas e flores 3D",
        description: "Movimento leve, conto de fadas moderno e delicado.",
        styleWeight: { minimalist: 0, editorial: 1, opulent: 0, romantic: 3 },
        bgClass: "bg-gradient-to-br from-white via-brand-ivory to-brand-champagne/10",
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
        description: "Foco em conversas profundas, boa gastronomia e jazz suave.",
        styleWeight: { minimalist: 2, editorial: 2, opulent: 0, romantic: 3 },
        bgClass: "bg-gradient-to-br from-brand-ivory to-brand-champagne/20",
      },
      {
        text: "Grande banquete de gala com protocolo impecável",
        description: "Celebração imponente, entretenimento de luxo e impacto.",
        styleWeight: { minimalist: 0, editorial: 1, opulent: 3, romantic: 1 },
        bgClass: "bg-gradient-to-br from-brand-ivory via-brand-champagne/40 to-brand-gold/20",
      },
      {
        text: "Festa moderna no rooftop com iluminação cénica e DJ",
        description: "Cocktails de assinatura, energia contagiante e estilo urbano.",
        styleWeight: { minimalist: 1, editorial: 3, opulent: 1, romantic: 0 },
        bgClass: "bg-gradient-to-br from-brand-black/90 to-brand-black/75 text-white",
      },
      {
        text: "Almoço chique ao ar livre com decoração orgânica e descontraída",
        description: "Luz do dia, ambiente fresco e sofisticação sem esforço.",
        styleWeight: { minimalist: 3, editorial: 0, opulent: 0, romantic: 2 },
        bgClass: "bg-gradient-to-br from-brand-ivory via-brand-champagne/15 to-brand-eucalyptus/15",
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
        description: "Tátil, luxo silencioso, minimalista e elegante.",
        styleWeight: { minimalist: 3, editorial: 1, opulent: 0, romantic: 1 },
        bgClass: "bg-gradient-to-br from-white to-brand-ivory",
      },
      {
        text: "Convites com caligrafia clássica à mão e lacre de cera dourado",
        description: "Preservação da etiqueta clássica com tom aristocrático.",
        styleWeight: { minimalist: 0, editorial: 2, opulent: 3, romantic: 1 },
        bgClass: "bg-gradient-to-br from-brand-ivory to-brand-champagne/30",
      },
      {
        text: "Convite Digital interativo com música, galeria e RSVP premium",
        description: "Experiência digital contemporânea rica e de vanguarda.",
        styleWeight: { minimalist: 1, editorial: 3, opulent: 1, romantic: 1 },
        bgClass: "bg-gradient-to-br from-brand-black/85 to-brand-black/70 text-white",
      },
      {
        text: "Detalhes florais em aguarela com tipografia cursiva elegante",
        description: "Delicadeza editorial, ilustrativa e romântica.",
        styleWeight: { minimalist: 0, editorial: 1, opulent: 0, romantic: 3 },
        bgClass: "bg-gradient-to-br from-brand-ivory via-brand-champagne/20 to-brand-gold/10",
      },
    ],
  },
];

interface StyleResult {
  key: string;
  title: string;
  description: string;
  detailedDesc: string;
  palette: string[];
  recommendations: string[];
}

const styleResults: Record<string, StyleResult> = {
  minimalist: {
    key: "minimalist",
    title: "Minimalismo Orgânico",
    description: "A sofisticação do luxo silencioso. Linhas limpas, natureza viva e design focado no essencial.",
    detailedDesc: "O vosso estilo celebra a beleza da pureza. Menos elementos com maior escala e significado. A decoração aposta em folhagens verdes (como o eucalipto), luz natural abundante, mesas corridas sem excesso e uma identidade visual limpa baseada em tipografia de alta qualidade. É a elegância que não precisa de gritar para ser notada.",
    palette: ["#ffffff", "#F7F1E8", "#6F7E5A", "#EAD8B8"],
    recommendations: [
      "Serviço HAXR RSVP & Convite Digital com layout 'Classic Ivory'",
      "Decoração botânica com foco em velas flutuantes e ramos de oliveira/eucalipto",
      "Look de noivos clean com tecidos estruturados (crepe ou zibelina de seda)",
    ],
  },
  editorial: {
    key: "editorial",
    title: "Clássico Editorial",
    description: "Estilo contemporâneo digno de revista de moda. Fusão de alta-costura, design e inovação.",
    detailedDesc: "Vocês procuram uma celebração com direcção artística de vanguarda. O vosso casamento assemelha-se a um evento de moda: iluminação cénica bem desenhada, paletas de cores arrojadas, espaços urbanos ou galerias modernas. A tecnologia e a curadoria de design caminham juntas na criação de um evento inesquecível e profundamente estético.",
    palette: ["#080706", "#F7F1E8", "#B88A2A", "#C2BAA9"],
    recommendations: [
      "Website de Casamento Premium HAXR com galeria de alta performance",
      "Direcção artística HAXR com monograma e tipografias customizadas",
      "Iluminação arquitetónica e fotografia em estilo documental e editorial",
    ],
  },
  opulent: {
    key: "opulent",
    title: "Opulência Moderna",
    description: "Grandiosidade, luxo clássico e impacto cénico. Uma recepção majestosa que ficará na história.",
    detailedDesc: "Para vocês, o casamento é um marco majestoso. Vocês valorizam a tradição real, com grandes salões de banquetes, decorações florais densas e imponentes (com rosas e hortênsias), e entretenimento sofisticado. O vosso evento é concebido para impressionar e mimar os convidados com o melhor in catering, protocolo e cenografia.",
    palette: ["#B88A2A", "#080706", "#FFFFFF", "#EAD8B8"],
    recommendations: [
      "Assessoria Completa HAXR com gestão detalhada de orçamentos amplos",
      "Plataforma HAXR 'Find Your Seat' no ecrã da recepção para acolher 300+ convidados",
      "Festa de gala com orquestra ou banda cénica e bar de cocktails premium",
    ],
  },
  romantic: {
    key: "romantic",
    title: "Romance Poético",
    description: "Uma celebração mágica imersa em contos de fadas, suavidade e poesia visual.",
    detailedDesc: "A vossa visão é puramente romântica e poética. O casamento ideal é repleto de luz de velas suave, flores em tons pastéis dispostas de forma orgânica, tecidos fluidos e momentos de pura emoção. Cada detalhe comunica proximidade, magia e sensibilidade, criando uma atmosfera sonhadora tanto na cerimónia como na recepção.",
    palette: ["#FFF0F5", "#E6E6FA", "#EAD8B8", "#6F7E5A"],
    recommendations: [
      "Save the Date e Convite HAXR com banda sonora clássica romântica",
      "Mesa de doces e bolo de casamento ornamentados com flores comestíveis em tons pastel",
      "Recepção à luz de velas suspensas ou cascatas de micro-lâmpadas",
    ],
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
    <main className="relative min-h-screen py-32 flex items-center justify-center bg-brand-ivory overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(184,138,42,0.06),transparent_50%)]" />
      <div className="absolute -left-1/4 -bottom-1/4 w-[60vw] h-[60vw] rounded-full bg-brand-champagne/10 blur-[120px]" />

      <div className="site-container mx-auto px-4 relative z-10 max-w-4xl w-full">
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: [0.25, 0, 0.1, 1] }}
              className="text-center space-y-8 max-w-2xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-brand-gold/30 bg-brand-gold/5 rounded-full text-brand-gold font-mono text-[9px] uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
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
                  className="px-8 py-3.5 border border-brand-gold bg-brand-gold text-white font-mono text-[10px] tracking-[0.25em] uppercase font-bold hover:bg-brand-gold-light hover:border-brand-gold-light transition-all duration-300 shadow-md cursor-pointer inline-flex items-center gap-3"
                >
                  <span>Iniciar o Quiz</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {currentStep > 0 && currentStep <= 5 && (
            <motion.div
              key={`question-${currentStep}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5, ease: [0.25, 0, 0.1, 1] }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between text-brand-text-dark/45 font-mono text-[10px] uppercase tracking-wider">
                <span>Pergunta {currentStep} de 5</span>
                <div className="w-48 h-1 bg-brand-champagne/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-gold transition-all duration-500"
                    style={{ width: `${(currentStep / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="font-serif text-2xl md:text-3.5xl font-light text-brand-text-dark leading-tight">
                  {quizQuestions[currentStep - 1].question}
                </h2>
                <p className="font-sans text-xs md:text-sm text-brand-text-dark/60 font-light">
                  {quizQuestions[currentStep - 1].subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizQuestions[currentStep - 1].options.map((option, idx) => {
                  const isSelected = selectedOptionIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(idx)}
                      className={`p-6 border rounded-sm text-left transition-all duration-300 relative overflow-hidden group min-h-[140px] flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? "border-brand-gold bg-[#f7f1e8] shadow-md scale-[1.01]"
                          : "border-brand-champagne/45 bg-white hover:border-brand-gold/60"
                      }`}
                    >
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${option.bgClass}`} />
                      {isSelected && (
                        <div className={`absolute inset-0 opacity-15 ${option.bgClass}`} />
                      )}

                      <div className="relative z-10 space-y-2">
                        <span className={`font-mono text-[9px] uppercase tracking-widest ${isSelected ? "text-brand-gold font-bold" : "text-brand-text-dark/30"}`}>
                          Opção 0{idx + 1}
                        </span>
                        <h3 className="font-serif text-base font-light text-brand-text-dark leading-snug">
                          {option.text}
                        </h3>
                      </div>

                      <p className="relative z-10 font-sans text-[11px] text-brand-text-dark/50 leading-relaxed font-light mt-4">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>

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
                  className={`inline-flex items-center gap-2 py-3 px-8 font-mono text-[10px] tracking-widest uppercase font-bold rounded-sm cursor-pointer shadow-xs transition-all ${
                    selectedOptionIdx === null
                      ? "bg-brand-champagne/40 text-brand-text-dark/30 border-brand-champagne/45 cursor-not-allowed"
                      : "bg-brand-gold hover:bg-brand-gold-light text-white"
                  }`}
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 6 && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.25, 0, 0.1, 1] }}
              className="bg-white border border-brand-champagne/60 rounded-sm p-8 md:p-14 shadow-xl space-y-8"
            >
              <div className="text-center space-y-4 max-w-xl mx-auto">
                <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-brand-gold font-bold">
                  O Vosso Resultado
                </span>
                <h2 className="font-serif text-3.5xl md:text-5xl font-light text-brand-text-dark tracking-wide">
                  {winner.title}
                </h2>
                <p className="font-serif text-base italic text-brand-gold/80 font-light">
                  {winner.description}
                </p>
              </div>

              <div className="space-y-3 max-w-sm mx-auto text-center">
                <p className="font-mono text-[9px] uppercase tracking-widest text-brand-text-dark/40 font-bold">
                  Paleta de Cores Recomendada
                </p>
                <div className="flex items-center justify-center gap-2">
                  {winner.palette.map((color, idx) => (
                    <div key={idx} className="group relative flex flex-col items-center">
                      <div
                        className="w-12 h-12 rounded-full border border-brand-champagne/65 shadow-xs transition-transform hover:scale-105"
                        style={{ backgroundColor: color }}
                      />
                      <span className="absolute -bottom-6 font-mono text-[7px] text-brand-text-dark/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {color}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-brand-ivory/50 border border-brand-champagne/30 p-6 md:p-8 rounded-sm space-y-4 font-light leading-relaxed text-sm text-brand-text-dark/85">
                <p>{winner.detailedDesc}</p>
              </div>

              <div className="space-y-4">
                <h4 className="font-mono text-[10px] tracking-widest uppercase text-brand-gold font-bold">
                  Sugestões HAXR para Vocês:
                </h4>
                <ul className="space-y-3.5">
                  {winner.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-3.5 text-xs text-brand-text-dark/85">
                      <span className="w-5 h-5 rounded-full border border-brand-gold/45 text-brand-gold flex items-center justify-center text-[9px] font-mono shrink-0">
                        {i + 1}
                      </span>
                      <span className="mt-0.5">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-sm border border-brand-gold/35 bg-brand-ivory/60 p-6 text-center space-y-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-brand-gold font-bold">
                  Pacote HAXR recomendado
                </p>
                <h3 className="font-serif text-2xl font-light text-brand-text-dark">
                  {recommendedPackage.name}
                </h3>
                <p className="font-sans text-sm text-brand-text-dark/75">
                  {recommendedPackage.tagline}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Link
                    href={recommendedPackage.contactHref}
                    className="inline-flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[10px] tracking-widest uppercase font-bold px-6 py-3 rounded-sm"
                  >
                    Pedir proposta {recommendedPackage.name}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href={recommendedPackage.href}
                    className="inline-flex items-center justify-center font-mono text-[10px] tracking-widest uppercase text-brand-text-dark/70 hover:text-brand-gold"
                  >
                    Ver pacotes
                  </Link>
                </div>
              </div>

              <div className="border border-brand-champagne/30 rounded-sm p-6 space-y-4 max-w-xl mx-auto">
                <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-brand-gold font-bold text-center">
                  Receber proposta personalizada
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="Nome"
                    className="border border-brand-champagne/40 px-3 py-2 text-sm"
                  />
                  <input
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                    className="border border-brand-champagne/40 px-3 py-2 text-sm"
                  />
                  <input
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="Telefone / WhatsApp"
                    className="border border-brand-champagne/40 px-3 py-2 text-sm"
                  />
                  <select
                    value={leadEventType}
                    onChange={(e) => setLeadEventType(e.target.value)}
                    className="border border-brand-champagne/40 px-3 py-2 text-sm"
                  >
                    <option value="casamento">Casamento</option>
                    <option value="corporativo">Corporativo</option>
                    <option value="aniversario">Aniversário</option>
                  </select>
                  <select
                    value={leadBudget}
                    onChange={(e) => setLeadBudget(e.target.value)}
                    className="border border-brand-champagne/40 px-3 py-2 text-sm"
                  >
                    <option value="até 250k MZN">Até 250k MZN</option>
                    <option value="250k-500k MZN">250k – 500k MZN</option>
                    <option value="500k+ MZN">500k+ MZN</option>
                  </select>
                  <select
                    value={leadUrgency}
                    onChange={(e) => setLeadUrgency(e.target.value)}
                    className="border border-brand-champagne/40 px-3 py-2 text-sm"
                  >
                    <option value="1-3 meses">1–3 meses</option>
                    <option value="3-6 meses">3–6 meses</option>
                    <option value="6+ meses">6+ meses</option>
                  </select>
                </div>
                <button
                  type="button"
                  disabled={leadSubmitting || !leadName.trim() || !leadEmail.trim()}
                  onClick={submitStyleQuizLead}
                  className="w-full py-3 bg-brand-black text-white font-mono text-[10px] tracking-widest uppercase disabled:opacity-50"
                >
                  {leadSubmitting ? "A enviar..." : "Quero proposta HAXR"}
                </button>
                {leadStatus ? (
                  <p className="text-sm text-center text-brand-text-dark/70">{leadStatus}</p>
                ) : null}
              </div>

              <div className="pt-8 border-t border-brand-champagne/45 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={startQuiz}
                  className="inline-flex items-center gap-2 font-mono text-[10px] tracking-wider uppercase text-brand-text-dark/60 hover:text-brand-text-dark cursor-pointer py-3"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refazer o Teste</span>
                </button>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <a
                    href={`https://wa.me/258870883428?text=${encodeURIComponent(
                      `Olá HAXR Signature, fizemos o Style Quiz no vosso site e o nosso resultado foi: "${winner.title}" (${winner.description}). Gostaríamos de falar com um organizador para partilhar a nossa visão!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 py-3.5 px-8 bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[10px] tracking-widest uppercase font-bold rounded-sm shadow-md cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 stroke-[1.25]" />
                    <span>Falar sobre o estilo</span>
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
