-- PR.4 — fixtures mínimas fictícias para clone de ensaio (sem dados de produção).
-- Alinhado a backups/production-public-pre036-schema.sql (pré-036, sem slug em businesses).
-- Executar APENAS no clone descartável, depois de restaurar schema pré-036.
-- Orquestrador: psql --single-transaction -v ON_ERROR_STOP=1 -f fixtures-minimal.sql

-- IDs determinísticos (ordem FK: business → client → event → dependências)
-- business:  haxr-signature
-- client:    11111111-1111-4111-8111-111111111101
-- event:     aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01

INSERT INTO public.businesses (id, name)
VALUES ('haxr-signature', 'HAXR Signature (Dry Run Fixture)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, client_name)
VALUES ('11111111-1111-4111-8111-111111111101', 'Cliente Fixture Dry Run')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.events (id, business_id, client_id, name, type, date, location, notes)
VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
  'haxr-signature',
  '11111111-1111-4111-8111-111111111101',
  'Casamento Dry Run A',
  'wedding',
  CURRENT_DATE + 180,
  'Maputo (fixture)',
  'PR4 dry-run fixture event A'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.guests (id, event_id, name, email, qr_token, status, plus_ones)
VALUES
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
    'Convidado Fixture A',
    'fixture-a@example.test',
    'qr-fixture-a-001',
    'confirmed',
    0
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb002',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
    'Convidado Fixture B',
    'fixture-b@example.test',
    'qr-fixture-b-002',
    'invited',
    1
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.payments (id, business_id, event_id, amount, currency, payment_method, paid_at)
VALUES
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccc01',
    'haxr-signature',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
    40000,
    'MZN',
    'bank_transfer',
    now()
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccc02',
    'haxr-signature',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
    10000,
    'MZN',
    'cash',
    now()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.event_vendors (id, event_id, name, status, proposed_amount, currency)
VALUES
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddd01',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
    'Fornecedor Fixture 1',
    'aprovado',
    50000,
    'MZN'
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddd02',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
    'Fornecedor Fixture 2',
    'em_analise',
    30000,
    'MZN'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.event_checklist_items (id, event_id, title, status, due_date, priority)
VALUES
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
    'Tarefa Fixture 1',
    'pending',
    CURRENT_DATE + 30,
    'high'
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
    'Tarefa Fixture 2',
    'completed',
    CURRENT_DATE - 1,
    'medium'
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee03',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
    'Tarefa Fixture 3',
    'pending',
    CURRENT_DATE - 5,
    'low'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.documents (
  id,
  business_id,
  event_id,
  client_id,
  document_type,
  document_number,
  status,
  client_name,
  issue_date,
  expiry_date,
  grand_total
)
VALUES (
  'ffffffff-ffff-4fff-8fff-fffffffffff1',
  'haxr-signature',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
  '11111111-1111-4111-8111-111111111101',
  'invoice',
  'DRY-001',
  'sent',
  'Cliente Fixture Dry Run',
  CURRENT_DATE,
  CURRENT_DATE + 30,
  150000
)
ON CONFLICT (id) DO NOTHING;
