# Gate 3H-E5B-R1: Relatório de Fecho de Incidente de Credenciais de Base de Dados

## Data e Contexto de Execução
- **Data:** 05 de Setembro de 2026
- **Gate:** Gate 3H-E5B-R1 — Database Credential Incident Closure
- **Repositório:** `MrDimande/haxrsignature-edition-engine` (`C:\project-x\projecto_haxrsignature`)
- **SHA Canónico de Produção:** `f7768a07cadf82ac8d13c0eaff1c2f383ccd2914` (`main`)
- **Deployment Anterior:** `dpl_BuZa9TYhmoxpsE8Xszmo1fydcuXN`
- **Deployment Rotacionado Activo:** `dpl_B5fhMJeRh5cYNKhpNTifET5uZkYo`
- **Domínio Canónico:** `https://edition.haxrsignature.com`
- **Provedor Activo de Metadados:** `neon`
- **Provedor Activo de Storage:** `r2-s3`
- **Estado de Congelamento:** `HAXR_STORAGE_WRITE_FREEZE=true`
- **Modo Operacional:** FAST-TRACK / LEAST PRIVILEGE ROLE PROVISIONING / CREDENTIAL CLOSURE / ZERO DATA LOSS

---

## 1. Incidente de Segurança e Motivação
Durante a execução do Gate 3H-E5B, duas credenciais foram expostas em transcripts/comandos registados no chat de operação:
1. Credencial de owner do Neon PostgreSQL (`neondb_owner` / `DATABASE_URL`).
2. Credencial `service_role` do Supabase.

Ambas as credenciais foram de imediato classificadas como comprometidas (`COMPROMISED`).
Foi aplicada a política estrita de segurança:
- Proibição absoluta de reimpressão de senhas, connection strings completas ou chaves em comandos, registos de terminal, relatórios, chat ou Git.
- Transição da arquitectura de conexão de produção no Neon de uma conta administradora (`owner`) para uma role de aplicação dedicada com privilégio mínimo (`edition_runtime`).
- Desacoplamento e isolamento total das credenciais comprometidas em relação ao runtime activo.

---

## 2. Provisionamento da Role Dedicada `edition_runtime` (Menor Privilégio)
No ramo de produção do Neon (`br-wandering-bonus-ay2ex5lx`, endpoint `ep-lingering-base-ay6jd085`):
1. **Criação da Role no Control Plane:**
   - Role `edition_runtime` provisionada com sucesso via CLI/API do Neon com capacidade de autenticação no proxy pooler.
2. **Atribuição de Permissões Estritas (Princípio do Menor Privilégio):**
   - `GRANT USAGE ON SCHEMA public TO edition_runtime;`
   - `GRANT SELECT, INSERT, UPDATE, DELETE ON wedding_photos, photo_upload_intents, api_rate_limits TO edition_runtime;`
   - `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO edition_runtime;`
   - `GRANT EXECUTE ON FUNCTION check_api_rate_limit(text, integer, integer) TO edition_runtime;`
   - Nenhuma permissão de DDL (`CREATE`, `DROP`, `ALTER`) concedida.
3. **Configuração de Políticas de Row Level Security (RLS):**
   - O Postgres manteve o RLS activo nas tabelas de produção (`relrowsecurity = true`).
   - Foram criadas políticas explícitas autorizando as operações DML da role `edition_runtime`:
     - `edition_runtime_photos_select`, `edition_runtime_photos_insert`, `edition_runtime_photos_update` em `wedding_photos`.
     - `edition_runtime_intents_select`, `edition_runtime_intents_insert`, `edition_runtime_intents_update` em `photo_upload_intents`.
     - `edition_runtime_ratelimit_all` em `api_rate_limits`.
4. **Comprovação de Privilégio Mínimo:**
   - Leitura de dados: 147 fotos lidas com sucesso (62 tradicional + 85 casamento).
   - Execução de rate limit: `check_api_rate_limit` testado com sucesso (`allowed = true`, `remaining = 59`).
   - Tentativa de mutação estrutural (DDL `CREATE TABLE`): bloqueada pelo Postgres com erro `42501 permission denied for schema public`.
   - `EDITION_NEON_RUNTIME_ROLE_LEAST_PRIVILEGE = true`.
   - `NEW_NEON_RUNTIME_CREDENTIAL_READY = true`.

---

## 3. Rotação em Produção (Vercel) e Redeploy Único
1. **Atualização Segura de Variáveis de Ambiente:**
   - No projecto Vercel `projecto-haxrsignature-edition` (escopo exclusivo `production`), a variável `DATABASE_URL` foi actualizada com a connection string pooled dedicada da role `edition_runtime`.
   - A operação foi efectuada via API de forma isolada, sem ecoar o segredo em stdout ou logs.
   - `VERCEL_DATABASE_URL_ROTATED_TO_EDITION_RUNTIME = true`.
2. **Redeploy Canónico de Produção:**
   - Disparado a partir do deployment anterior para re-carregar as variáveis de ambiente sem alterar o código ou o commit SHA.
   - **Deployment ID:** `dpl_B5fhMJeRh5cYNKhpNTifET5uZkYo`
   - **Estado:** `READY` (promovido a produção)
   - **Commit SHA:** `f7768a07cadf82ac8d13c0eaff1c2f383ccd2914`
   - **NEON_CREDENTIAL_ROTATION_EFFECTIVE_AT:** `2026-09-05T22:03:10.049Z`.

---

## 4. Validação Canónica em Direto (`https://edition.haxrsignature.com`)
Testes executados directamente contra a produção canónica:
- `GET /` -> HTTP 200 OK
- `GET /jessicasamuelwedding` -> HTTP 200 OK
- `GET /jessicaesamueltraditionalwedding` -> HTTP 200 OK
- `GET /api/memories?slug=jessicasamuelwedding` -> HTTP 200 OK (62 itens)
- `GET /api/memories?slug=jessicaesamueltraditionalwedding` -> HTTP 200 OK (85 itens)
- **Total de Fotos Retornadas:** 147
- **URLs de Mídia:**
  - Cloudflare R2 signed URLs: 147
  - Supabase Storage URLs: 0
- **Leitura de Mídia Representativa:** HTTP 206 Partial Content (2.304.258 bytes verificados).
- `EDITION_METADATA_PROVIDER = NEON_CONFIRMED`.
- `EDITION_STORAGE_PROVIDER = R2_CONFIRMED`.

---

## 5. Verificação de Permanência do Write-Freeze
- Prova de bloqueio de escrita via endpoint público:
  - `POST /api/memories/upload-intent`:
    - Status HTTP: `503 Service Unavailable`
    - Código de Erro: `STORAGE_WRITE_FROZEN`
    - Mensagem: "O envio de memórias está temporariamente em manutenção para actualização de sistema."
- Contagem de Intenções de Upload:
  - Supabase `photo_upload_intents`: 185 -> 185 (`DELTA = 0`).
  - Neon `photo_upload_intents`: 185 -> 185 (`DELTA = 0`).
- Mutações no Storage R2: rigorosamente zero (`PUT = 0`, `DELETE = 0`).

---

## 6. Fecho do Rate Limiting
- **Natureza do Estado:**
  - A tabela `api_rate_limits` contém unicamente `bucket_key`, `request_count` e `window_start`.
  - Os registos destinam-se ao controlo de janelas deslizantes de tráfego de 60 segundos por IP/cliente.
  - Não armazena dados transaccionais, memórias ou dados duradouros de negócio.
  - `API_RATE_LIMIT_STATE_SAFE_TO_RESET = true`.
- **Validação Funcional no Neon:**
  - A função `check_api_rate_limit(text, integer, integer)` executou perfeitamente sob a role `edition_runtime`, registando e controlando requisições com precisão.
  - `API_RATE_LIMIT_RUNTIME_NEON_READY = true`.

---

## 7. Desacoplamento e Fecho das Credenciais Comprometidas
1. **Neon `neondb_owner`:**
   - O runtime de produção da Edition já não utiliza, não consome e não possui em suas variáveis de ambiente a credencial de owner.
   - O runtime está 100% isolado sob a role `edition_runtime`.
   - A senha do `neondb_owner` pode ser rotacionada no painel web da Neon pelo operador a qualquer momento sem causar qualquer indisponibilidade no serviço.
   - `COMPROMISED_NEON_CREDENTIAL_NO_LONGER_USED_BY_EDITION = true`.
2. **Supabase `service_role`:**
   - Com o corte concluído de Storage (R2) e Metadados (Neon), o runtime da Edition em produção não realiza nenhuma chamada à API ou base de dados do Supabase.
   - A credencial `service_role` anteriormente exposta encontra-se completamente desacoplada do runtime activo.
   - `COMPROMISED_SUPABASE_SERVICE_ROLE_NOT_USED_BY_EDITION_RUNTIME = true`.

---

## 8. Clarificação do Procedimento de Rollback
No ambiente serverless da Vercel, caso fosse estritamente necessário efectuar rollback do provedor de base de dados para o Supabase, o procedimento seguro e comprovado é:
1. Reconfigurar `DATABASE_PROVIDER=supabase` nas variáveis de ambiente de produção na Vercel.
2. Disparar um redeploy canónico de produção para aplicar as novas variáveis a todos os lambdas activos.
- `SAFE_DB_PROVIDER_ROLLBACK_TO_SUPABASE_WITH_REDEPLOY = true`.

---

## 9. Guarda Final de Corpus e Metadados
| Recurso | Origem (Supabase) | Destino Activo (Neon / R2) | Delta / Mismatch |
| :--- | :--- | :--- | :--- |
| **Objectos no Storage** | 147 ficheiros (535.493.700 B) | 147 ficheiros (535.493.700 B) | 0 |
| **Registos de Fotos** | 147 fotos | 147 fotos | 0 |
| **Distribuição de Eventos** | 62 (Casamento) + 85 (Tradicional) | 62 (Casamento) + 85 (Tradicional) | 0 |
| **Intenções de Upload** | 185 registos | 185 registos | 0 |
| **Paridade de Metadados** | Confirmada (100%) | Confirmada (100%) | `sourceOnly=0, targetOnly=0` |

- `NEON_PRODUCTION_METADATA_PARITY = true`.

---

## 10. Resumo dos Marcadores Canónicos do Gate 3H-E5B-R1
```properties
EDITION_NEON_RUNTIME_ROLE_LEAST_PRIVILEGE=true
NEW_NEON_RUNTIME_CREDENTIAL_READY=true
VERCEL_DATABASE_URL_ROTATED_TO_EDITION_RUNTIME=true
NEON_CREDENTIAL_ROTATION_DEPLOYMENT_ID=dpl_B5fhMJeRh5cYNKhpNTifET5uZkYo
NEON_CREDENTIAL_ROTATION_EFFECTIVE_AT=2026-09-05T22:03:10.049Z
EDITION_METADATA_PROVIDER=NEON_CONFIRMED
EDITION_STORAGE_PROVIDER=R2_CONFIRMED
API_RATE_LIMIT_STATE_SAFE_TO_RESET=true
API_RATE_LIMIT_RUNTIME_NEON_READY=true
COMPROMISED_NEON_CREDENTIAL_NO_LONGER_USED_BY_EDITION=true
COMPROMISED_SUPABASE_SERVICE_ROLE_NOT_USED_BY_EDITION_RUNTIME=true
SAFE_DB_PROVIDER_ROLLBACK_TO_SUPABASE_WITH_REDEPLOY=true
NEON_PRODUCTION_METADATA_PARITY=true
HAXR_STORAGE_WRITE_FREEZE=true
```
