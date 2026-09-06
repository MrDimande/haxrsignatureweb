# Relatório Oficial — GATE 3H-E5B: Edition Neon Production Metadata Cutover

**Data / Hora:** 2026-09-05T20:56:31+02:00  
**Repositório:** `MrDimande/haxrsignature-edition-engine`  
**Produção Canónica:** `https://edition.haxrsignature.com`  
**Neon Production Branch:** `ep-lingering-base-ay6jd085` (`ep-lingering-base-ay6jd085-pooler.c-5.us-east-2.aws.neon.tech`)  
**Commit SHA de Cutover:** `f7768a07cadf82ac8d13c0eaff1c2f383ccd2914`  
**Deployment de Produção ID:** `dpl_BuZa9TYhmoxpsE8Xszmo1fydcuXN`  
**Efectivação:** `2026-09-05T18:53:50.560Z`  

---

## 1. DB Dependency Set Mapeado (Phase 1)

Auditoria exaustiva das rotas `GET /api/memories`, `POST /api/memories/upload-intent`, `POST /api/memories/complete`, moderação e rate limit:
- **Tabelas de Runtime:**
  - `wedding_photos` (metadados de fotos aprovadas e pendentes)
  - `photo_upload_intents` (registo atómico e efémero de intenções de upload, TTL = 900s)
  - `api_rate_limits` (controlo persistente de janelas de pedidos por chave)
- **Funções / RPCs:**
  - `check_api_rate_limit(p_bucket_key text, p_max_requests integer, p_window_seconds integer) RETURNS jsonb`
- **Isolamento de Convites:**
  - Resolução de slugs e convites é 100% determinística em memória via `@data/invitations` e `@lib/engine`. Sem foreign keys na BD.

---

## 2. Comparação de Esquemas & Snapshot Pré-Migração (Phases 2 & 3)

- **Pré-migração Snapshot:**
  - `wedding_photos`: 147 registos (`jessicasamuelwedding`: 62, `jessicaesamueltraditionalwedding`: 85)
  - `photo_upload_intents`: 185 registos históricos (consumidos/expirados)
  - `ACTIVE_UNEXPIRED_PENDING_INTENTS`: 0
- **Ajuste de Esquema no Neon Produção:**
  - Adicionadas colunas complementares para paridade total: `experience_id uuid NULL`, `phase_id text NULL` em `wedding_photos` e `experience_id uuid NULL` em `photo_upload_intents`.
  - Índices compostos e unique constraints confirmados.

---

## 3. Migração Transaccional & Reconciliação (Phases 4, 5 & 6)

- **Dados Migrados para `ep-lingering-base-ay6jd085`:**
  - 147 fotos de `wedding_photos` migradas com integridade transaccional.
  - 185 registos de `photo_upload_intents` migrados para histórico.
- **Reconciliação Determinística:**
  - `Supabase = 147`
  - `Neon Production = 147`
  - `sourceOnly = 0`, `targetOnly = 0`, `metadataMismatch = 0`
  - Distribuição: 62 (`jessicasamuelwedding`) + 85 (`jessicaesamueltraditionalwedding`)
  - `NEON_PRODUCTION_METADATA_PARITY = true`

---

## 4. Implementação do DB Provider da Edition (Phase 7 & 8)

- **Módulos Criados:**
  - `lib/db/types.ts`: Interface `EditionDatabaseProvider` estritamente tipada.
  - `lib/db/config.ts`: `resolveDatabaseProviderName()` com fail-closed para provedores desconhecidos ou falta de `DATABASE_URL`.
  - `lib/db/neon-client.ts`: Gestão de pool `pg` com SSL e timeout fail-closed.
  - `lib/db/neon-provider.ts`: Consultas parametrizadas e tratamento de JSONB em rate limits.
  - `lib/db/supabase-provider.ts`: Seam de rollback imediato mantido 100% funcional.
  - `lib/db/index.ts`: Fábrica singleton com seam para testes unitários.
- **Integração:**
  - Actualizados `lib/memories/gallery.ts`, `lib/memories/upload.ts`, `lib/jessica-samuel-wedding/photo-wall/upload-intent-store.ts`, `lib/security/persistent-rate-limit.ts`, `lib/memories/leaderboard.ts` e `app/api/memories/moderate/route.ts`.
- **Testes & Validação Local:**
  - 223 testes aprovados, zero regressões atribuíveis.
  - Build de produção Next.js gerou todas as 52 páginas estáticas e rotas dinâmicas com sucesso (`exit code 0`).

---

## 5. Deployment e Validação Canónica (Phases 9 a 15)

- **Variáveis Staged no Escopo `production` da Vercel:**
  - `DATABASE_PROVIDER = neon`
  - `DATABASE_URL = [REDACTED_NEON_POOLED_URI]`
  - `STORAGE_PROVIDER = r2-s3` (preservado)
  - `HAXR_STORAGE_WRITE_FREEZE = true` (preservado)
- **Deployment Activo:**
  - ID: `dpl_BuZa9TYhmoxpsE8Xszmo1fydcuXN`
  - SHA: `f7768a07cadf82ac8d13c0eaff1c2f383ccd2914`
  - Estado: `READY`
- **Validação Canónica em Produção:**
  - `GET /` -> 200
  - `GET /jessicasamuelwedding` -> 200
  - `GET /jessicaesamueltraditionalwedding` -> 200
  - `GET /api/memories?slug=jessicasamuelwedding` -> 200 (62 itens)
  - `GET /api/memories?slug=jessicaesamueltraditionalwedding` -> 200 (85 itens)
  - Total URLs R2 assinadas: 147 (0 Supabase Storage)
  - Fetch de amostra R2: HTTP 206 com Range `0-1024/2304258`, `image/jpeg`
- **Prova de Freeze:**
  - `POST /api/memories/upload-intent` -> HTTP 503 `STORAGE_WRITE_FROZEN`
  - Supabase intent delta = 0 (`185 -> 185`)
  - Neon intent delta = 0 (`185 -> 185`)
- **Final DB Guard:**
  - Supabase = 147, Neon Produção = 147
  - `sourceOnly = 0`, `targetOnly = 0`, `metadataMismatch = 0`
  - `SAFE_DB_PROVIDER_ROLLBACK_TO_SUPABASE = true`
