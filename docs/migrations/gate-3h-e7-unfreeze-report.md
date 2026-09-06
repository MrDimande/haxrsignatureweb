# Gate 3H-E7: Relatório de Descongelamento Controlado de Produção e Prova da Rota Pública de Escrita

## Data e Contexto de Execução
- **Data:** 06 de Setembro de 2026
- **Gate:** Gate 3H-E7 — Controlled Production Unfreeze + Public Write Path Proof
- **Repositório Local:** `MrDimande/haxrsignature-edition-engine` (`C:\project-x\projecto_haxrsignature`)
- **Produção Canónica:** `https://edition.haxrsignature.com`
- **SHA Canónico de Produção:** `f7768a07cadf82ac8d13c0eaff1c2f383ccd2914` (`main`)
- **Deployment Anterior (Frozen):** `dpl_B5fhMJeRh5cYNKhpNTifET5uZkYo`
- **Deployment Descongelado Activo:** `dpl_3xZKzy5snvigEDz9CmmmoFZ5Rzyx`
- **Runtime de Metadados:** `DATABASE_PROVIDER=neon` (role dedicada `edition_runtime`)
- **Runtime de Storage:** `STORAGE_PROVIDER=r2-s3` (Cloudflare R2)
- **Estado de Protecção:** `HAXR_STORAGE_WRITE_FREEZE=false` (**PRODUÇÃO DESCONGELADA**)
- **Modo Operacional:** FAST-TRACK / CONTROLLED UNFREEZE / LIVE PUBLIC WRITE PROOF / EXACT CLEANUP

---

## 1. Objectivo do Gate
Remover com segurança o congelamento público de escrita (`HAXR_STORAGE_WRITE_FREEZE=false`) e comprovar o funcionamento em direto da rota pública de upload fim-a-fim:
`POST /api/memories/upload-intent` pública
→ `Upload directo assinado no Cloudflare R2 (PUT)`
→ `POST /api/memories/complete` pública
→ `Metadados registados no Neon`
→ `Leitura do objecto via presigned GET no Cloudflare R2`
utilizando exactamente **UM** canary controlado e sintético, deixando a Produção **DESCONGELADA** e operacional para os utilizadores.

---

## 2. Regra Crítica de Plano de Dados (Data-Plane Rule)
Com a conclusão do unfreeze e a confirmação do fluxo público de escrita:
1. **Fonte Única de Verdade:** Neon + Cloudflare R2 passam a ser a fonte de verdade canónica absoluta da Edition.
2. **Supabase Histórico:** O Supabase histórico (`147 wedding_photos`, `185 photo_upload_intents`) é considerado formalmente um snapshot pré-cutover.
3. **Proibição de Rollback de Dados para Supabase:** Fica estritamente proibido qualquer rollback de base de dados ou storage para o Supabase que descarte ou sobreponha novas escritas de produção.
4. **Estratégia Operacional de Incidentes:** Caso ocorra algum incidente pós-unfreeze, o procedimento é:
   - Re-congelar escritas (`HAXR_STORAGE_WRITE_FREEZE=true`).
   - Re-deployar.
   - Preservar integralmente todas as novas escritas em Neon e R2.
   - Diagnosticar e reparar para a frente (`REFREEZE_AND_REPAIR_FORWARD`).

---

## 3. Relatório Canónico Compacto

### UNFREEZE
- **UNFREEZE_DEPLOYMENT_ID:** `dpl_3xZKzy5snvigEDz9CmmmoFZ5Rzyx`
- **UNFREEZE_EFFECTIVE_AT:** `2026-09-05T22:24:07.171Z`
- **HAXR_STORAGE_WRITE_FREEZE:** `false`
- **PUBLIC_UPLOADS_OPEN:** `true`

### PUBLIC INTENT
- **Endpoint:** `POST https://edition.haxrsignature.com/api/memories/upload-intent`
- **Status HTTP:** `200 OK`
- **Payload:** `{"slug": "jessicasamuelwedding", "fileName": "unfreeze-canary-e7.jpg", "contentType": "image/jpeg", "fileSizeBytes": 134, "guestName": "Unfreeze Public Canary"}`
- **Resposta:** `{"success": true, "photoId": "8bdd09cf-4cf1-4ec0-8bf4-c9e01e3f1128", "uploadUrl": "https://...r2.cloudflarestorage.com...", "storagePath": "jessicasamuelwedding/8bdd09cf-4cf1-4ec0-8bf4-c9e01e3f1128/original.jpg"}`
- **PUBLIC_UPLOAD_INTENT_PROVIDER:** `NEON`
- **PUBLIC_UPLOAD_STORAGE_PROVIDER:** `R2`
- **Neon `photo_upload_intents`:** 185 → 186
- **Supabase `photo_upload_intents`:** 185 (inalterado)

### R2 PUT
- **Upload via presigned PUT:** HTTP 200 OK
- **HeadObject no R2:** `ContentLength = 134`, `ContentType = image/jpeg`
- **CANARY_R2_WRITE:** `PASS`

### PUBLIC COMPLETE
- **Endpoint:** `POST https://edition.haxrsignature.com/api/memories/complete`
- **Status HTTP:** `200 OK`
- **Resposta:** `{"success": true, "message": "Momento guardado com sucesso. Obrigado por nos ajudar a guardar este dia."}`
- **CANARY_COMPLETE:** `PASS`
- **PUBLIC_COMPLETE_DATABASE_PROVIDER:** `NEON`
- **PUBLIC_COMPLETE_STORAGE_PROVIDER:** `R2`
- **Neon `wedding_photos`:** 147 → 148
- **Consumo do Intent no Neon:** `status = 'consumed'`
- **Supabase `wedding_photos`:** 147 (intocado)

### READBACK
- **Metadados em Neon:** Verificados com sucesso (`invitation_slug = 'jessicasamuelwedding'`, `storage_path = 'jessicasamuelwedding/8bdd09cf-4cf1-4ec0-8bf4-c9e01e3f1128/original.jpg'`)
- **CANARY_METADATA_PROVIDER:** `NEON_CONFIRMED`
- **Leitura via Presigned GET no R2:** HTTP 200 OK (`image/jpeg`)
- **Integridade de Bytes:** SHA-256 local (`9650f1...`) == SHA-256 lido do R2 (`9650f1...`)
- **CANARY_R2_READ:** `PASS`
- **CANARY_BYTE_INTEGRITY:** `PASS`

### CONCURRENCY
- **CONCURRENT_REAL_WRITES:** `0` (nenhuma escrita concorrente de utilizadores reais detectada durante a janela do teste)

### CANARY CLEANUP
- **Eliminação em Neon (`wedding_photos`):** 1 registo removido (ID exacto `8bdd09cf-4cf1-4ec0-8bf4-c9e01e3f1128`)
- **Eliminação no Cloudflare R2:** 1 objecto removido (`jessicasamuelwedding/8bdd09cf-4cf1-4ec0-8bf4-c9e01e3f1128/original.jpg`)
- **Eliminação em Neon (`photo_upload_intents`):** 1 registo de intent removido (ID exacto `8bdd09cf-4cf1-4ec0-8bf4-c9e01e3f1128`)
- **UNFREEZE_CANARY_CLEANUP_EXACT:** `true`

### PRODUCTION
- **DATABASE_PROVIDER:** `neon`
- **STORAGE_PROVIDER:** `r2-s3`
- **HAXR_STORAGE_WRITE_FREEZE:** `false`
- **Neon `wedding_photos`:** 147
- **Neon `photo_upload_intents`:** 185
- **Cloudflare R2:** 147 objectos / 535.493.700 bytes
- **APIs de Galeria:**
  - `GET /api/memories?slug=jessicasamuelwedding`: 62 fotos
  - `GET /api/memories?slug=jessicaesamueltraditionalwedding`: 85 fotos
- **Assinatura de Mídia:** 147 Cloudflare R2 signed URLs, 0 Supabase URLs
- **Gallery APIs:** `PASS`
- **R2 URLs:** `CONFIRMED`

### INCIDENT POLICY
- **PRE_UNFREEZE_PROVIDER_ROLLBACK_TO_SUPABASE:** `HISTORICALLY_AVAILABLE`
- **POST_UNFREEZE_AFTER_NEW_WRITES:** `DO_NOT_ROLL_BACK_DATA_PLANE_TO_SUPABASE`
- **POST_CUTOVER_INCIDENT_STRATEGY:** `REFREEZE_AND_REPAIR_FORWARD`

---

## 4. Decisão Final

```
FINAL:
PASS — EDITION PRODUCTION UNFROZEN, NEON + R2 WRITE PATH ACTIVE
```
