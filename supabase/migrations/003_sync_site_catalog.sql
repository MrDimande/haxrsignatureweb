-- Sincronizar catálogo de facturas com pacotes oficiais do site (site-config.ts → invitationPackages)
-- Desactiva serviços inventados na migration 002 que não existem no portfólio público

UPDATE service_catalog
SET is_active = false
WHERE id IN (
  'convite-digital-premium',
  'convite-digital-essencial',
  'save-the-date',
  'identidade-visual',
  'assessoria-eventos',
  'coordenacao-dia',
  'rsvp-system',
  'package-basic',
  'package-standard',
  'package-premium',
  'addon-extra-page',
  'addon-music',
  'media-photography',
  'media-video',
  'media-reels'
);

-- Pacotes HAXR Signature — fonte: src/lib/site-config.ts (invitationPackages)

INSERT INTO service_catalog (id, business_id, name, description, price, category, sort_order, is_active) VALUES
  (
    'essencial',
    'haxr-signature',
    'Essencial (Casamento & Lobolo)',
    'O minimalismo funcional para o vosso grande dia. A essência do design HAXR Signature. Um convite digital polido, de navegação intuitiva, criado para partilhar os detalhes vitais do seu evento com pura sofisticação.',
    5999,
    'invitations',
    10,
    true
  ),
  (
    'signature',
    'haxr-signature',
    'Signature (Casamento & Lobolo)',
    'A vossa narrativa visual elevada ao estado de arte. Para quem concebe o evento como uma história. Combina uma direção artística imersiva com uma galeria visual e mecânicas inteligentes de gestão de convidados.',
    12999,
    'invitations',
    20,
    true
  ),
  (
    'royal',
    'haxr-signature',
    'Royal (Casamento & Lobolo)',
    'A vanguarda da exclusividade e curadoria digital. A alta-costura do convite digital. Uma obra sob medida que integra introduções cinemáticas, segurança por QR Code e um ecossistema completo para a gestão do seu evento.',
    19999,
    'invitations',
    30,
    true
  ),
  (
    'noivado-essencial',
    'haxr-signature',
    'O Prelúdio (Noivado)',
    'A elegância concisa para anunciar o compromisso. A primeira nota da vossa melodia. Uma página de alta curadoria, desenhada para anunciar o noivado com impacto visual e funcionalidade imaculada.',
    5999,
    'invitations',
    40,
    true
  ),
  (
    'noivado-completo',
    'haxr-signature',
    'A Transição (Noivado)',
    'A narrativa que liga o sim aos preparativos. A união visionária entre o anúncio do noivado e o Save the Date. Uma jornada visual expansiva que introduz os convidados ao vosso universo estético.',
    12999,
    'invitations',
    50,
    true
  ),
  (
    'aniversario-essencial',
    'haxr-signature',
    'A Celebração (Outros Eventos)',
    'Marcos pessoais com uma assinatura inconfundível. Para aniversários que exigem mais que um convite genérico. Uma interface focada, elegante e pronta a receber os seus convidados com uma experiência premium.',
    5999,
    'invitations',
    70,
    true
  ),
  (
    'aniversario-completo',
    'haxr-signature',
    'O Jubileu (Outros Eventos)',
    'A narrativa expansiva da sua história. A expressão máxima para comemorações de grande escala. Uma plataforma interativa que imerge os convidados no seu percurso e centraliza toda a coordenação do evento.',
    10999,
    'invitations',
    80,
    true
  ),
  (
    'graduacao',
    'haxr-signature',
    'A Conquista (Outros Eventos)',
    'A consagração de um legado académico. A dignidade que o seu mérito exige. Uma coordenação de excelência entre a cerimónia oficial e a recepção, desenhada para partilhar o triunfo com absoluta distinção.',
    11999,
    'invitations',
    90,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  business_id = EXCLUDED.business_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- Nota: "A Marca (Corporativo)" tem preço sob cotação — não entra no catálogo automático.
-- Use linha manual na factura para propostas corporativas.
