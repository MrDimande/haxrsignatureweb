-- PR.4 — fixtures mínimas fictícias para clone de ensaio (sem dados de produção).
-- Executar APENAS no clone descartável, depois de restaurar schema pré-036.

BEGIN;

INSERT INTO public.businesses (id, name, slug, is_active)
VALUES ('haxr-signature', 'HAXR Signature (Dry Run Fixture)', 'haxr-signature', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.events (id, business_id, name, type, date, location, notes, is_active)
VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
  'haxr-signature',
  'Casamento Dry Run A',
  'wedding',
  CURRENT_DATE + 180,
  'Maputo (fixture)',
  'PR4 dry-run fixture event A',
  true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.guests (id, event_id, name, email, status, plus_ones)
VALUES
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', 'Convidado Fixture A', 'fixture-a@example.test', 'confirmed', 0),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', 'Convidado Fixture B', 'fixture-b@example.test', 'pending', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.payments (id, event_id, amount, currency, payment_method, paid_at)
VALUES
  ('cccccccc-cccc-4ccc-8ccc-cccccccccc01', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', 40000, 'MZN', 'bank_transfer', now()),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccc02', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', 10000, 'MZN', 'cash', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.event_vendors (id, event_id, name, status, proposed_amount, currency)
VALUES
  ('dddddddd-dddd-4ddd-8ddd-dddddddddd01', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', 'Fornecedor Fixture 1', 'aprovado', 50000, 'MZN'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddd02', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', 'Fornecedor Fixture 2', 'em analise', 30000, 'MZN')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.event_checklist_items (id, event_id, title, status, due_date, priority)
VALUES
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', 'Tarefa Fixture 1', 'pending', CURRENT_DATE + 30, 'high'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', 'Tarefa Fixture 2', 'completed', CURRENT_DATE - 1, 'medium'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee03', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', 'Tarefa Fixture 3', 'pending', CURRENT_DATE - 5, 'low')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.documents (id, event_id, document_number, document_type, status, client_name, total_amount, currency)
VALUES
  ('ffffffff-ffff-4fff-8fff-fffffffffff1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', 'DRY-001', 'invoice', 'sent', 'Cliente Fixture', 150000, 'MZN')
ON CONFLICT (id) DO NOTHING;

COMMIT;
