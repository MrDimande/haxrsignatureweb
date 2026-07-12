export interface Vendor {
  id: string;
  slug: string;
  name: string;
  category: string; // matches category key
  location: string;
  description: string;
  extendedDescription: string;
  instagram: string;
  instagramUrl: string;
  imageCover: string;
  galleryImages: string[];
  rating: number;
  reviewsCount: number;
  priceRange: string; // e.g., "€€€€" or "Premium"
  services: string[];
  featured?: boolean;
}

export interface VendorCategory {
  id: string;
  label: string;
  englishLabel: string;
  image: string;
}

export const VENDOR_CATEGORIES: VendorCategory[] = [
  {
    id: "venues",
    label: "Espaços de Casamento",
    englishLabel: "Wedding Venue",
    image: "/images/categories/venue.png",
  },
  {
    id: "photographers",
    label: "Fotógrafos de Casamento",
    englishLabel: "Wedding Photographer",
    image: "/images/categories/photographer.png",
  },
  {
    id: "florists",
    label: "Floristas e Decoração",
    englishLabel: "Wedding Florist",
    image: "/images/categories/florist.png",
  },
  {
    id: "planners",
    label: "Assessores de Casamento",
    englishLabel: "Wedding Planner",
    image: "/images/categories/planner.png",
  },
  {
    id: "videographers",
    label: "Videógrafos de Casamento",
    englishLabel: "Videographer",
    image: "/images/categories/videographer.png",
  },
  {
    id: "caterers",
    label: "Serviço de Catering",
    englishLabel: "Caterer",
    image: "/images/categories/caterer.png",
  },
  {
    id: "cakes",
    label: "Bolos e Doces Finos",
    englishLabel: "Wedding Cake and Dessert",
    image: "/images/categories/cake.png",
  },
  {
    id: "stationery",
    label: "Estacionário e Convites",
    englishLabel: "Stationery",
    image: "/images/categories/stationery.png",
  },
];

export const VENDORS: Vendor[] = [
  {
    id: "nuno-de-sousa",
    slug: "nuno-de-sousa-photographer",
    name: "Nuno de Sousa Photographer",
    category: "photographers",
    location: "Maputo, Moçambique",
    description: "Fotografia editorial de casamento focada em contar histórias autênticas e intemporais através de uma abordagem documental e poética.",
    extendedDescription: "Nuno de Sousa é um dos nomes mais prestigiados na fotografia de casamentos em Moçambique. Com um olhar focado no fotojornalismo artístico, ele especializou-se em capturar emoções brutas, detalhes elegantes e a luz mágica de Maputo. Cada reportagem fotográfica é desenhada como uma narrativa editorial única, ideal para casais que valorizam a autenticidade e pretendem recordar o seu grande dia através de imagens intemporais e com qualidade de galeria fine art.",
    instagram: "@nunodesousa_photographer",
    instagramUrl: "https://www.instagram.com/nunodesousa_photographer/",
    imageCover: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519225495810-7517c296517a?q=80&w=800&auto=format&fit=crop"
    ],
    rating: 5.0,
    reviewsCount: 42,
    priceRange: "Premium",
    services: [
      "Cobertura Fotográfica Completa",
      "Sessão Pré-Casamento (E-Session)",
      "Design e Impressão de Álbuns Fine Art",
      "Entrega em Galeria Online Privada",
      "Second Shooter Incluído"
    ],
    featured: true,
  },
  {
    id: "bisto-photography",
    slug: "bisto-photography",
    name: "Bisto Photography",
    category: "photographers",
    location: "Maputo, Moçambique",
    description: "Perspetiva contemporânea e elegante para casamentos modernos. Especialistas em capturar momentos espontâneos com sensibilidade artística.",
    extendedDescription: "A Bisto Photography destaca-se pela sua energia criativa e pela sensibilidade em registar o inesperado. Composta por uma equipa de jovens talentos focados na excelência visual, captam risos, lágrimas e os abraços mais profundos. O seu style combina a frescura da fotografia de moda contemporânea com a sensibilidade da reportagem espontânea, criando uma cobertura dinâmica, vibrante e cheia de vida.",
    instagram: "@bistophotography",
    instagramUrl: "https://www.instagram.com/bistophotography/",
    imageCover: "https://images.unsplash.com/photo-1519225495810-7517c296517a?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507504038482-7621c4b240a5?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=800&auto=format&fit=crop"
    ],
    rating: 4.9,
    reviewsCount: 35,
    priceRange: "Médio-Alto",
    services: [
      "Reportagem Digital Ilimitada",
      "Sessão Pós-Casamento (Trash the Dress)",
      "Drone e Imagens Aéreas",
      "Edição Expressa de Destaques",
      "Foto de Assinatura Impressa"
    ],
    featured: true,
  },
  {
    id: "mario-cossa",
    slug: "mario-cossa-videography",
    name: "Mário Cossa Videography",
    category: "videographers",
    location: "Maputo, Moçambique",
    description: "Filmes de casamento cinematográficos com narrativa poética e profunda emoção.",
    extendedDescription: "Mário Cossa é um realizador e contador de histórias especializado em transformar casamentos em verdadeiras obras cinematográficas. Com um olhar atento e técnicas de cinema avançadas, a sua equipa capta cada detalhe de som, movimento e sentimento. Os seus filmes destacam-se pelo design de som imersivo, gradação de cor luxuosa e uma edição focada no ritmo natural e nas emoções autênticas da vossa união.",
    instagram: "@mariocossavideography",
    instagramUrl: "https://www.instagram.com/mariocossavideography/",
    imageCover: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1478812954026-9c750f0e89fc?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1481162854517-d9e353af153d?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1505236858219-8359eb29e347?q=80&w=800&auto=format&fit=crop"
    ],
    rating: 4.8,
    reviewsCount: 21,
    priceRange: "Premium",
    services: [
      "Filme de Casamento (15-20 min)",
      "Teaser Cinematográfico (1-2 min)",
      "Gravação com Drone 4K",
      "Cobertura Multicâmara",
      "Áudio de Votos Gravado Diretamente"
    ],
    featured: false,
  },
  {
    id: "polana-serena",
    slug: "polana-serena-hotel",
    name: "Polana Serena Hotel",
    category: "venues",
    location: "Av. Julius Nyerere, Maputo, Moçambique",
    description: "Cenário majestoso e histórico com jardins deslumbrantes à beira-mar e serviço impecável de 5 estrelas.",
    extendedDescription: "Conhecido como a 'Grande Dama de Maputo', o Polana Serena Hotel é o epítome da elegância clássica e do luxo em Moçambique. Fundado na década de 1920, este espaço oferece jardins verdejantes com vista deslumbrante sobre a Baía de Maputo, salões históricos ornamentados com lustres de cristal e um serviço de banquetes e catering de nível internacional. Realizar o vosso casamento no Polana é garantir uma experiência inesquecível de sofisticação absoluta.",
    instagram: "@polanaserenahotel",
    instagramUrl: "https://www.instagram.com/polanaserenahotel/",
    imageCover: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=800&auto=format&fit=crop"
    ],
    rating: 5.0,
    reviewsCount: 64,
    priceRange: "Luxo",
    services: [
      "Salões Históricos e Espaço de Jardim",
      "Menu de Catering Gourmet Personalizado",
      "Suíte Nupcial e Alojamento para Convidados",
      "Serviço de SPA Serena Exclusivo",
      "Estacionamento e Segurança Privada"
    ],
    featured: true,
  },
  {
    id: "deco-loft",
    slug: "deco-loft",
    name: "Deco Loft",
    category: "florists",
    location: "Maputo, Moçambique",
    description: "Design floral e cenografia de eventos de alta costura com texturas contemporâneas e elegância clássica.",
    extendedDescription: "A Deco Loft é referência em design de cenários e arte floral contemporânea em Maputo. Especializados em transformar ambientes comuns em florestas botânicas luxuosas ou galerias de arte românticas, utilizam uma curadoria rigorosa de flores locais e importadas, aliada a estruturas de mobiliário e iluminação de última geração. O seu trabalho destaca-se pela atenção extrema ao detalhe e pela criação de paletas cromáticas inovadoras e sofisticadas.",
    instagram: "@decoloft",
    instagramUrl: "https://www.instagram.com/decoloft/",
    imageCover: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1545232979-8bf34eb9757b?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop"
    ],
    rating: 4.9,
    reviewsCount: 29,
    priceRange: "Premium",
    services: [
      "Design de Cenário e Planeamento de Arte Floral",
      "Cenografia e Iluminação Ambiental",
      "Aluguer de Mobiliário Exclusivo",
      "Buquê de Noiva e Flores de Lapela",
      "Montagem Completa e Coordenação no Dia"
    ],
    featured: false,
  },
  {
    id: "haxr-signature",
    slug: "haxr-signature-planners",
    name: "HAXR Signature",
    category: "planners",
    location: "Maputo, Moçambique",
    description: "Assessoria premium e planeamento integrado com forte pilar tecnológico para casamentos de luxo.",
    extendedDescription: "A HAXR Signature redefine o conceito de planeamento de casamentos ao fundir a assessoria de luxo tradicional com tecnologia proprietária exclusiva. Além de desenhar e coordenar toda a logística e curadoria de fornecedores, oferecemos aos casais um ecossistema digital avançado que inclui envio e controle de RSVP digital elegante, design de assentos automatizado (Find Your Seat), convites digitais animados de alta fidelidade e check-in inteligente por QR Code no dia. A tranquilidade que os noivos merecem, com a sofisticação do amanhã.",
    instagram: "@haxr.signature",
    instagramUrl: "https://www.instagram.com/haxr.signature/",
    imageCover: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507504038482-7621c4b240a5?q=80&w=800&auto=format&fit=crop"
    ],
    rating: 5.0,
    reviewsCount: 88,
    priceRange: "Luxo",
    services: [
      "Assessoria e Coordenação do Dia (100% Presencial)",
      "Acesso ao Portal do Casal HAXR",
      "Gestão Integrada de RSVP e Lista de Convidados",
      "Sistema Digital 'Find Your Seat' & Check-in QR",
      "Design de Identidade Visual e Convites Premium"
    ],
    featured: true,
  }
];
