-- PR.4.1 — prepara clone descartável: remove public existente (NUNCA produção).
-- O dump local recria CREATE SCHEMA public e objectos subsequentes.

DROP SCHEMA IF EXISTS public CASCADE;
