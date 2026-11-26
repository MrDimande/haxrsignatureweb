-- ==============================================================================
-- HAXR Core — Baby Aylla Gift Registry — Gate E
-- PRODUCTION CATALOG SEED (ALL 52 CANONICAL ARTICLES — FAIL-CLOSED PENDING)
-- ==============================================================================
-- Sequence: Runs strictly AFTER 20261125120100_baby_aylla_gift_registry_gate_e_prod_hardening.sql
-- Target Event: a0f6b5a9-4d8c-4501-81b6-52929fa9da38 (Edition · Aniversário · Baby Aylla)
-- Registry Key: baby-aylla-couture
--
-- Safety Guarantee:
-- - Seeds ONLY the 52 editorial articles (zero synthetic-staging-* rows).
-- - Inserts idempotently (ON CONFLICT DO NOTHING) so future family approvals
--   and approved quantities are never overwritten.
-- - Defaults strictly fail-closed: family_approved=false, enabled=false,
--   approved_quantity=NULL, specifications_complete=false, child_safety_validated=false.
-- ==============================================================================

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.events
    WHERE id = 'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid
      AND business_id = 'haxr-signature'
      AND edition_registry_key = 'baby-aylla-couture'
  ) THEN
    RAISE EXCEPTION 'Refusing catalog seed: canonical production event a0f6b5a9-... missing or misconfigured';
  END IF;
END;
$$;

INSERT INTO public.edition_gift_inventory (
  event_id,
  registry_key,
  item_id,
  family_approved,
  enabled,
  approved_quantity,
  specifications_complete,
  child_safety_validated
)
SELECT
  'a0f6b5a9-4d8c-4501-81b6-52929fa9da38'::uuid,
  'baby-aylla-couture',
  item_id,
  false,
  false,
  NULL,
  false,
  false
FROM (
  VALUES
    -- O Cantinho dos Sonhos da Aylla (11)
    ('dream-cot-sheets'),
    ('dream-blankets'),
    ('dream-washable-rug'),
    ('dream-childrens-lamp'),
    ('dream-night-light'),
    ('dream-decorative-frames'),
    ('dream-personalised-name-decor'),
    ('dream-toy-baskets'),
    ('dream-keepsake-box'),
    ('dream-growth-ruler'),
    ('dream-padded-changing-mat'),
    -- O Guarda-Roupa da Aylla (7)
    ('wardrobe-princess-dresses'),
    ('wardrobe-occasion-dresses'),
    ('wardrobe-outing-sets'),
    ('wardrobe-pyjamas'),
    ('wardrobe-shoes'),
    ('wardrobe-sandals'),
    ('wardrobe-casual-sets'),
    -- Bonecas & Companhia (4)
    ('companions-12m-dolls'),
    ('companions-teddy-bears'),
    ('companions-cloth-dolls'),
    ('companions-animal-plush'),
    -- Descobrir & Aprender (11)
    ('learn-activity-cube'),
    ('learn-shape-sorter'),
    ('learn-ring-stack'),
    ('learn-stacking-cups'),
    ('learn-large-building-blocks'),
    ('learn-wooden-blocks'),
    ('learn-board-books'),
    ('learn-large-piece-puzzles'),
    ('learn-childrens-instruments'),
    ('learn-activity-table'),
    ('learn-soft-sensory-ball'),
    -- Brincar & Explorar (7)
    ('explore-activity-mat'),
    ('explore-stable-push-toy'),
    ('explore-small-slide'),
    ('explore-childrens-tent'),
    ('explore-water-play-table'),
    ('explore-large-soft-ball'),
    ('explore-small-inflatable-pool'),
    -- Pequenos Essenciais (7)
    ('essentials-childrens-plates'),
    ('essentials-learning-cups'),
    ('essentials-childrens-cutlery'),
    ('essentials-feeding-chair'),
    ('essentials-childrens-backpack'),
    ('essentials-childrens-thermal-bottle'),
    ('essentials-waterproof-bibs'),
    -- Tesouros & Recordações (5)
    ('keepsakes-mana-dior-savings-bank'),
    ('keepsakes-photo-album'),
    ('keepsakes-personalised-memory-box'),
    ('keepsakes-first-year-memory-book'),
    ('keepsakes-personalised-commemorative-gift')
) AS catalog(item_id)
ON CONFLICT (event_id, item_id) DO NOTHING;

COMMIT;
