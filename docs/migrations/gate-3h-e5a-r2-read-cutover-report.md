# Gate 3H-E5A: Relatório de Reparação de Credencial Dedicada e Cutover de Leitura R2 da Edition

## Data e Contexto de Execução
- **Data:** 05 de Setembro de 2026
- **Gate:** Gate 3H-E5A — Dedicated Credential Repair + R2 Read Cutover
- **Repositório:** `MrDimande/haxrsignature-edition-engine` (`C:\project-x\projecto_haxrsignature`)
- **SHA Canónico de Produção:** `0a569024d5846d7516806b4f7c27405d34c57484` (`main`)
- **Deployment Anterior:** `dpl_3bcbY9bshXDEvoX9hYDB47a7HFax`
- **Deployment Activo de Cutover:** `dpl_tkyAkD1MpKygGbRgH1b4XtwpuRQ4`
- **Domínio Canónico:** `https://edition.haxrsignature.com`
- **Balde R2:** `haxr-wedding-photos`
- **Modo Operacional:** FAST-TRACK / ZERO STORAGE MUTATION / ZERO DB MUTATION

---

## 1. Segurança e Isolamento de Segredos Locais
- O ficheiro local `C:\project-x\projecto_haxrsignature\.env.r2.local` foi verificado contra as regras do Git:
  - `git check-ignore -v .env.r2.local` -> `.gitignore:21:.env*`
  - `R2_LOCAL_ENV_GIT_IGNORED = true`
- Nenhuma credencial em texto claro foi exposta ou commitada no controlo de versões.

---

## 2. Nova Credencial Dedicada da Edition e Impressões Digitais
- As credenciais foram carregadas exclusivamente de `.env.r2.local` com o balde canónico `haxr-wedding-photos`.
- **Impressões Digitais Criptográficas (SHA-256):**
  - Nova Access Key ID: `84726fec9e1da5c5312b894cbf3d0bebf779944678b6c3076254fa0a6b633197`
  - Nova Secret Access Key: `d611cceb290a0134b16212fc99b7e2781f3128274814c03507e084a8d965ac8c`
  - Endpoint: `a7350129dd1a99ab4c1a858a95cb6d36940251ba3f681bcf4b1696d615a825f1`
  - Balde: `077d2abdcf790fd2579e3cfac201ce7ec878404973a8502e33fd7e34774428af`
- **Comparação com Credencial de Runtime do Web:**
  - Web Access Key: `229bc4575332a4a7dab07212577fb9d142109dd48bbceb2d732091bbf73f629b`
  - Web Secret Key: `0663631fc904b066d70f2e92c548db69ca332619b533d1d48e210b234678dfca`
  - Ambas as chaves diferem da identidade do web (`!=`).
  - `EDITION_R2_CREDENTIAL_IS_DEDICATED = true`.

---

## 3. Validação Read-Only da Nova Credencial
- Executada com o SDK S3 oficial contra o balde `haxr-wedding-photos`:
  - `HeadBucketCommand`: HTTP 200 OK.
  - `ListObjectsV2Command`: Listagem com sucesso de objectos do balde.
  - `HeadObjectCommand`: Metadados do objecto canónico `photos/jessicasamuelwedding/1725450849310-0937a1f5-8d51-4099-b131-abfa3bc354c0.jpg` confirmados (2.778.251 bytes).
  - `GetObjectCommand`: Leitura confirmada de fluxo de bytes.
  - Zero chamadas a `PutObjectCommand` ou `DeleteObjectCommand`.
  - `NEW_EDITION_R2_CREDENTIAL_READ_READY = true`.

---

## 4. Configuração de Variáveis de Ambiente e Redeploy de Produção
No projecto Vercel `projecto-haxrsignature-edition` (escopo exclusivo `production`):
- `CLOUDFLARE_R2_ACCESS_KEY_ID`: Substituída pela nova credencial dedicada.
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`: Substituída pela nova credencial dedicada.
- `CLOUDFLARE_R2_ENDPOINT` e `CLOUDFLARE_R2_BUCKET_NAME`: Mantidos intactos.
- `STORAGE_PROVIDER`: Configurado para `r2-s3`.
- `HAXR_STORAGE_WRITE_FREEZE`: Preservado estritamente como `true`.
- **Deployment Canónico Realizado:**
  - Deployment ID: `dpl_tkyAkD1MpKygGbRgH1b4XtwpuRQ4`
  - Alvo: `production`
  - Git SHA: `0a569024d5846d7516806b4f7c27405d34c57484` (`main`)
  - Estado: `READY`
  - `R2_SWITCH_EFFECTIVE_AT = 2026-09-05T12:13:41Z`

---

## 5. Prova Canónica da Galeria R2 (Canonical Gallery Proof)
Em execução directa contra `https://edition.haxrsignature.com`:
- `GET /` -> HTTP 200 OK
- `GET /jessicasamuelwedding` -> HTTP 200 OK
- `GET /jessicaesamueltraditionalwedding` -> HTTP 200 OK
- `GET /api/memories?slug=jessicasamuelwedding` -> HTTP 200 OK, 62 itens.
- `GET /api/memories?slug=jessicaesamueltraditionalwedding` -> HTTP 200 OK, 85 itens.
- **Inspecção de URLs de Mídia:**
  - 100% das URLs retornadas possuem o domínio `r2.cloudflarestorage.com` com os parâmetros de assinatura `X-Amz-*`.
  - 0 URLs apontam para `oxsrdmydlqyvnueedgtl.supabase.co/storage/...`.
  - `EDITION_GALLERY_STORAGE_PROVIDER = R2_CONFIRMED`.

---

## 6. Leitura Representativa de Mídia em Produção
- **Amostra JPEG:**
  - Requisição HTTP GET para a URL assinada R2.
  - Status: `HTTP 200 OK`
  - Content-Type: `image/jpeg`
  - Tamanho: 2.304.258 bytes
  - `JPEG = PASS`
- **Amostra de Vídeo:**
  - Requisição HTTP GET com cabeçalho `Range: bytes=0-1023`.
  - Status: `HTTP 206 Partial Content`
  - Content-Type: `video/quicktime`
  - `VIDEO = PASS`

---

## 7. Verificação de Permanência do Write-Freeze
- Requisição estruturalmente válida: `POST /api/memories/upload-intent`
  - **Status HTTP:** `503 Service Unavailable`
  - **Código:** `STORAGE_WRITE_FROZEN`
  - **URL de Upload:** Nenhuma devolvida.
  - `photo_upload_intents` na base de dados antes e depois: 185 -> 185 (`INTENT_DB_DELTA = 0`).

---

## 8. Guarda de Corpus e Estado das Bases de Dados
- **Guarda de Corpus Físico:**
  - Supabase `wedding-photos`: 147 objectos, 535.493.700 bytes.
  - R2 `haxr-wedding-photos`: 147 objectos, 535.493.700 bytes.
  - `sourceOnly = 0`
  - `r2Only = 0`
  - `sizeMismatch = 0`
  - **Paridade Física: 100% (147 / 535493700)**.
- **Estado de Metadados de Base de Dados:**
  - Supabase `wedding_photos`: 147 registos.
  - Neon Ramo de Migração (`ep-super-fire-ayj2jnyh`): 147 registos.
  - Neon Ramo de Produção (`ep-lingering-base-ay6jd085`): 0 registos.
  - Zero mutações executadas em qualquer base de dados.

---

## 9. Capacidade de Reversão (Rollback)
Como o congelamento de escrita (`HAXR_STORAGE_WRITE_FREEZE=true`) permaneceu activo durante todo o processo e não foi criado qualquer objecto exclusivo no R2:
- `READ_CUTOVER_ROLLBACK = SAFE_PROVIDER_ROLLBACK_TO_SUPABASE`
- É garantido que a reversão imediata para o Supabase Storage pode ser realizada com segurança absoluta via reposição de variável de ambiente, se necessário.

---

## 10. Orçamento de Mutações de Produção
- Substituições de variáveis de credenciais no ambiente Vercel: 2 (`CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`).
- Alteração de `STORAGE_PROVIDER`: 1 (`r2-s3`).
- Deploys de Produção: 1 (`dpl_tkyAkD1MpKygGbRgH1b4XtwpuRQ4`).
- Mutações de Storage: 0.
- Mutações de Base de Dados: 0.

---

## 11. Conclusão do Gate
**PASS — EDITION R2 READ CUTOVER ACTIVE, WRITE FREEZE RETAINED**
