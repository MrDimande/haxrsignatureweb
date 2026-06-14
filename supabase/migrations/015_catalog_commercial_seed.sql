-- Catálogo comercial HAXR — pacotes fixos (honorários)
-- Pré-requisito: 014_service_category_enums.sql já executado e commitado
-- Idempotente

INSERT INTO service_catalog (id, business_id, name, description, price, category, sort_order, is_active) VALUES
  (
    'convite-digital-essencial',
    'haxr-signature',
    'Convite Digital Essencial',
    'Convite digital elegante com informações do evento, localização e confirmação de presença. Pacote fixo ideal para celebrações intimistas.',
    8500,
    'invitations',
    5,
    true
  ),
  (
    'convite-digital-premium',
    'haxr-signature',
    'Convite Digital Premium',
    'Convite digital com direcção artística, galeria visual, música e experiência imersiva. Pacote fixo de alta curadoria.',
    15000,
    'invitations',
    6,
    true
  ),
  (
    'save-the-date-digital',
    'haxr-signature',
    'Save The Date',
    'Anúncio digital premium da data do evento com identidade visual alinhada à celebração. Pacote fixo.',
    6500,
    'invitations',
    7,
    true
  ),
  (
    'convite-interactivo',
    'haxr-signature',
    'Convite Interactivo',
    'Convite com animações, contagem regressiva, RSVP integrado e experiência mobile-first. Pacote fixo.',
    18500,
    'invitations',
    8,
    true
  ),
  (
    'website-casamento',
    'haxr-signature',
    'Website de Casamento',
    'Site dedicado ao casamento com história do casal, programa, localização e galeria. Pacote fixo.',
    22000,
    'websites',
    10,
    true
  ),
  (
    'website-corporativo',
    'haxr-signature',
    'Website Corporativo',
    'Site institucional para eventos corporativos, galas e lançamentos. Pacote fixo.',
    28000,
    'websites',
    11,
    true
  ),
  (
    'landing-page-evento',
    'haxr-signature',
    'Landing Page de Evento',
    'Página de conversão focada num único evento com CTA, RSVP e branding premium. Pacote fixo.',
    12000,
    'websites',
    12,
    true
  ),
  (
    'assessoria-completa',
    'haxr-signature',
    'Assessoria Completa',
    'Planeamento integral do evento: estratégia, fornecedores, cronograma, supervisão operacional e gestão de riscos. Honorário fixo por pacote.',
    85000,
    'assessoria',
    20,
    true
  ),
  (
    'assessoria-parcial',
    'haxr-signature',
    'Assessoria Parcial',
    'Suporte especializado em áreas específicas do evento (convites, fornecedores, cronograma ou branding). Honorário fixo por âmbito.',
    45000,
    'assessoria',
    21,
    true
  ),
  (
    'coordenacao-dia',
    'haxr-signature',
    'Coordenação do Dia',
    'Gestão operacional exclusiva do dia do evento: equipa, fornecedores, timing e imprevistos. Honorário fixo.',
    55000,
    'assessoria',
    22,
    true
  ),
  (
    'identidade-visual-evento',
    'haxr-signature',
    'Identidade Visual',
    'Paleta, tipografia e sistema visual coerente para todo o ecossistema do evento. Pacote fixo.',
    18000,
    'branding',
    30,
    true
  ),
  (
    'monograma-personalizado',
    'haxr-signature',
    'Monograma',
    'Monograma exclusivo para convites, papelaria e materiais digitais. Pacote fixo.',
    7500,
    'branding',
    31,
    true
  ),
  (
    'kit-grafico-evento',
    'haxr-signature',
    'Kit Gráfico',
    'Conjunto de peças gráficas digitais (convite, save the date, menu, seating). Pacote fixo.',
    14000,
    'branding',
    32,
    true
  ),
  (
    'find-your-seat',
    'haxr-signature',
    'Find Your Seat',
    'Experiência digital premium de consulta de lugares para convidados. Pacote fixo.',
    9500,
    'experiences',
    40,
    true
  ),
  (
    'rsvp-digital',
    'haxr-signature',
    'RSVP Digital',
    'Formulário de confirmação elegante com acompanhantes e restrições alimentares. Pacote fixo.',
    7500,
    'experiences',
    41,
    true
  ),
  (
    'checkin-digital',
    'haxr-signature',
    'Check-in Digital',
    'Check-in por QR com registo de presença em tempo real. Pacote fixo.',
    6500,
    'experiences',
    42,
    true
  ),
  (
    'gestao-convidados',
    'haxr-signature',
    'Gestão de Convidados',
    'Painel completo de convidados, lugares, relatórios e sincronização Google Sheets. Pacote fixo.',
    12000,
    'experiences',
    43,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  business_id = EXCLUDED.business_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();
