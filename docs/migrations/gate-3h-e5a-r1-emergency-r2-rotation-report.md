# Gate 3H-E5A-R1: Relatório de Rotação de Emergência de Credenciais R2 da Edition

## Data e Contexto de Execução
- **Data:** 05 de Setembro de 2026
- **Gate:** Gate 3H-E5A-R1 — Emergency R2 Credential Rotation
- **Repositório:** `MrDimande/haxrsignature-edition-engine` (`C:\project-x\projecto_haxrsignature`)
- **SHA Canónico de Produção:** `0a569024d5846d7516806b4f7c27405d34c57484` (`main`)
- **Deployment Anterior (Comprometido):** `dpl_tkyAkD1MpKygGbRgH1b4XtwpuRQ4`
- **Deployment Rotacionado Activo:** `dpl_DzTciYXZV4MjRBJmenTddG4vXXSa`
- **Domínio Canónico:** `https://edition.haxrsignature.com`
- **Balde R2:** `haxr-wedding-photos`
- **Modo Operacional:** FAST-TRACK / EMERGENCY ROTATION / ZERO STORAGE WRITE / ZERO DB WRITE

---

## 1. Incidente de Segurança e Motivação
As credenciais R2 da Edition anteriormente em produção foram consideradas comprometidas após exposição incidental em transcript de operador. Foi accionado de imediato o protocolo de rotação de emergência sob o Gate 3H-E5A-R1.

---

## 2. Isolamento Local e Impressões Digitais
- As novas credenciais rotacionadas foram guardadas exclusivamente em `C:\project-x\projecto_haxrsignature\.env.r2.local`.
- Confirmado isolamento do controlo de versões:
  - `git check-ignore -v .env.r2.local` -> `.gitignore:21:.env*`
  - `R2_LOCAL_ENV_GIT_IGNORED = true`
- **Impressões Digitais Criptográficas da Nova Credencial (SHA-256):**
  - Rotated Access Key ID: `8ee0863e464fbf7d6af885a50af7c27beb0b4ba3731942f968cdf02001b8cb72`
  - Rotated Secret Access Key: `c96d86d68ea88c18c1fbac4617302bcfee1d12a3e587ae950b5fb8b6c32ff5bb`
  - Endpoint: `a7350129dd1a99ab4c1a858a95cb6d36940251ba3f681bcf4b1696d615a825f1`
  - Balde: `077d2abdcf790fd2579e3cfac201ce7ec878404973a8502e33fd7e34774428af`
- **Verificação de Unicidade:**
  - Diferente da credencial comprometida (`84726fe...` / `d611cce...`): `true`
  - Diferente da credencial web runtime (`229bc45...` / `0663631...`): `true`
  - `ROTATED_EDITION_R2_CREDENTIAL_IS_NEW = true`.

---

## 3. Validação Read-Only da Credencial Rotacionada
- `HeadBucketCommand`: HTTP 200 OK
- `ListObjectsV2Command`: 147 objectos listados com sucesso
- `HeadObjectCommand`: Metadados do objecto canónico confirmados (2.778.251 bytes, `image/jpeg`)
- `GetObjectCommand`: Fluxo de leitura de 100 bytes verificado sem erros
- Mutações executadas: rigorosamente zero (`PUT = 0`, `DELETE = 0`)
- `ROTATED_EDITION_R2_CREDENTIAL_READ_READY = true`.

---

## 4. Configuração em Produção (Vercel) e Redeploy Canónico
No projecto `projecto-haxrsignature-edition` (escopo exclusivo `production`):
- `CLOUDFLARE_R2_ACCESS_KEY_ID`: substituída pela nova chave rotacionada.
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`: substituída pelo novo segredo rotacionado.
- `STORAGE_PROVIDER=r2-s3`: mantido intacto.
- `HAXR_STORAGE_WRITE_FREEZE=true`: preservado estritamente.
- `CLOUDFLARE_R2_ENDPOINT` e `CLOUDFLARE_R2_BUCKET_NAME`: mantidos intactos.
- **Redeploy Canónico de Produção:**
  - Deployment ID: `dpl_DzTciYXZV4MjRBJmenTddG4vXXSa`
  - Alvo: `production`
  - Git SHA: `0a569024d5846d7516806b4f7c27405d34c57484` (`main`)
  - Estado: `READY`
  - `ROTATION_EFFECTIVE_AT = 2026-09-05T12:31:54.986Z`.

---

## 5. Validação Live em Produção
- `GET /` -> HTTP 200 OK
- `GET /jessicasamuelwedding` -> HTTP 200 OK
- `GET /jessicaesamueltraditionalwedding` -> HTTP 200 OK
- `GET /api/memories?slug=jessicasamuelwedding` -> HTTP 200 OK (62 itens)
- `GET /api/memories?slug=jessicaesamueltraditionalwedding` -> HTTP 200 OK (85 itens)
- 100% das URLs de mídia são URLs assinadas R2 (`r2.cloudflarestorage.com`). Zero URLs Supabase.
- `ROTATED_EDITION_GALLERY_STORAGE_PROVIDER = R2_CONFIRMED`.
- **Leitura Representativa de Mídia:**
  - JPEG: HTTP 200 OK | Content-Type: `image/jpeg` | 2.304.258 bytes (`JPEG = PASS`)
  - Vídeo: HTTP 206 Partial Content | Content-Type: `video/quicktime` (`VIDEO = PASS`).

---

## 6. Verificação de Permanência do Write-Freeze
- `POST /api/memories/upload-intent`:
  - Status HTTP: `503 Service Unavailable`
  - Código: `STORAGE_WRITE_FROZEN`
  - Intenções na base de dados antes e depois: 185 -> 185 (`INTENT_DB_DELTA = 0`).

---

## 7. Guarda de Corpus e Estado das Bases de Dados
- **Guarda de Corpus Físico:**
  - Supabase `wedding-photos`: 147 objectos, 535.493.700 bytes.
  - R2 `haxr-wedding-photos`: 147 objectos, 535.493.700 bytes.
  - `sourceOnly = 0`, `r2Only = 0`, `sizeMismatch = 0`.
- **Bases de Dados:**
  - Supabase `wedding_photos`: 147 registos.
  - Neon Ramo Migração (`ep-super-fire-ayj2jnyh`): 147 registos.
  - Neon Ramo Produção (`ep-lingering-base-ay6jd085`): 0 registos.
  - Zero mutações em base de dados.

---

## 8. Revogação Humana do Token Antigo Concluída
O operador humano revogou com sucesso no painel da Cloudflare o token comprometido:
- **Token Revogado:** `HAXR R2 Runtime Edition wedding-photos`
- **Tokens Preservados Intactos:**
  - `HAXR R2 Runtime wedding-photos` (Runtime activo da aplicação web)
  - `HAXR R2 Migration Parent Gate 3F-C` (Identidade de migração)
  - `HAXR Gate 3F-A Read Audit` (Identidade de auditoria)

---

## 9. Prova em Produção Pós-Revogação (Post-Revocation Proof)
Após a revogação do token anterior, a aplicação canónica foi revalidada em `https://edition.haxrsignature.com`:
- `GET /api/memories?slug=jessicasamuelwedding` -> HTTP 200 (62 itens)
- `GET /api/memories?slug=jessicaesamueltraditionalwedding` -> HTTP 200 (85 itens)
- 100% URLs de mídia assinadas por `r2.cloudflarestorage.com`. Zero URLs Supabase.
- `POST_REVOCATION_GALLERY = PASS`
- Leitura representativa de mídia: HTTP 200 OK, `image/jpeg`, 2.304.258 bytes (`POST_REVOCATION_R2_READ = PASS`).
- Variáveis de ambiente de produção Vercel confirmadas:
  - `STORAGE_PROVIDER = r2-s3`
  - `HAXR_STORAGE_WRITE_FREEZE = true`

---

## 10. Conclusão e Fecho Formal do Gate
- `COMPROMISED_EDITION_TOKEN_REVOKED = true`
- `POST_REVOCATION_GALLERY = PASS`
- `POST_REVOCATION_R2_READ = PASS`
- `HAXR_STORAGE_WRITE_FREEZE = true`

**FINAL:**
**PASS — EDITION R2 CREDENTIAL ROTATION CLOSED**

