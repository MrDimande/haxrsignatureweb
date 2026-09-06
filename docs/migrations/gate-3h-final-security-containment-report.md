# Gate 3H: Relatório de Contenção Final de Segurança (Antes do Canary de Escrita)

## Data e Contexto de Execução
- **Data:** 06 de Setembro de 2026
- **Gate:** Final Security Containment Before Write Canary
- **Repositório Local:** `MrDimande/haxrsignature-edition-engine` (`C:\project-x\projecto_haxrsignature`)
- **Produção Canónica:** `https://edition.haxrsignature.com`
- **SHA Canónico de Produção:** `f7768a07cadf82ac8d13c0eaff1c2f383ccd2914` (`main`)
- **Deployment Activo:** `dpl_B5fhMJeRh5cYNKhpNTifET5uZkYo`
- **Runtime de Metadados:** `DATABASE_PROVIDER=neon` (role dedicada `edition_runtime`)
- **Runtime de Storage:** `STORAGE_PROVIDER=r2-s3` (Cloudflare R2)
- **Estado de Protecção:** `HAXR_STORAGE_WRITE_FREEZE=true`
- **Modo Operacional:** FAST-TRACK / LEAST-PRIVILEGE SECURITY CONTAINMENT / ZERO MUTATION BUDGET

---

## 1. Incidente e Objectivo de Contenção
O mandato deste Gate consistiu em invalidar e remediar de forma conclusiva as duas credenciais anteriormente expostas em texto plano:
1. Antiga credencial de owner do Neon (`neondb_owner` no endpoint `ep-lingering-base-ay6jd085`).
2. Antiga credencial de serviço do Supabase (`service_role`).

Com restrições absolutas de:
- **Não** alterar credenciais do runtime activo da Edition (`edition_runtime`).
- **Não** desativar o freeze de escrita.
- **Não** realizar redeploy de produção desnecessário.
- **Não** imprimir ou expor senhas, connection strings ou chaves.

---

## 2. Invalidação da Credencial Neon `neondb_owner`
1. **Verificação de Consumidores:**
   - Foi efectuada uma auditoria completa em todos os arquivos de ambiente locais e no projeto da aplicação web principal (`haxrsignatureweb`).
   - Confirmado que a aplicação web principal não utiliza Neon nem possui `DATABASE_URL`.
   - Confirmado que a Edition em Produção utiliza exclusivamente a role `edition_runtime`.
   - Nenhum consumidor externo ou em produção dependia da senha actual do `neondb_owner`.
2. **Rotação da Senha via Neon API:**
   - Executado o comando de redefinição de credenciais via Neon API nativa:
     `POST /projects/little-band-06036174/branches/br-wandering-bonus-ay2ex5lx/roles/neondb_owner/reset_password`.
   - A nova senha foi gerada dinamicamente pelo control plane do Neon.
   - A nova connection string de owner foi gravada exclusivamente em `C:\project-x\projecto_haxrsignature\.env.neon.owner.local` (ficheiro protegido por `.gitignore`).
   - A nova credencial de owner **não** foi enviada para a Vercel da Edition, preservando a segregação de privilégios.
3. **Prova de Invalidação da Credencial Antiga:**
   - Tentativa de autenticação com a antiga credencial de owner comprometida:
     - Resultado: **Falha imediata de conexão**.
     - Código de erro Postgres: `28P01 (password authentication failed for user 'neondb_owner')`.
     - `OLD_NEON_OWNER_CREDENTIAL_VALID = false`.
     - `NEON_COMPROMISED_OWNER_INVALIDATED = true`.
4. **Prova de Continuidade da Role `edition_runtime`:**
   - Conexão efectuada com a role `edition_runtime` através do pooler:
     - Leitura imediata de 147 fotos.
     - `EDITION_RUNTIME_STILL_HEALTHY = true`.

---

## 3. Avaliação da Credencial Supabase `service_role` e Raio de Impacto
1. **Modelo de Chaves Supabase Detectado:**
   - Análise criptográfica dos tokens sem revelação de segredos:
     - `SUPABASE_SERVICE_ROLE_KEY`: Token JWT HS256 (`role: "service_role"`, `iss: "supabase"`).
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Token JWT HS256 (`role: "anon"`, `iss: "supabase"`).
   - Ambas as chaves derivam da assinatura pelo segredo criptográfico global do projeto (`Project JWT Secret`).
2. **Impossibilidade de Revogação Isolada:**
   - No modelo legado baseado em JWT HS256 do Supabase, não existe suporte a revogação granular individual por ID de token sem alterar o `JWT Secret` do projeto.
3. **Avaliação de Raio de Impacto (Blast Radius):**
   - A rotação do `JWT Secret` no Supabase causaria:
     - Invalidação simultânea da chave pública anónima (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).
     - Desconexão imediata de todas as sessões ativas de utilizadores e convidados.
     - **Interrupção de serviço na aplicação principal de produção** (`https://haxrsignature.com` / `haxrsignatureweb`), que consome o Supabase para gestão de convidados, RSVP (`/api/rsvp`), check-in e eventos.
4. **Isolamento da Edition Runtime:**
   - A Edition em Produção (`https://edition.haxrsignature.com`) opera 100% migrada com `DATABASE_PROVIDER=neon` e `STORAGE_PROVIDER=r2-s3`.
   - A Edition **não** faz nenhuma consulta, mutação ou autenticação via Supabase no seu runtime de produção ativo.
5. **Decisão de Segurança Conforme Mandato:**
   - Em estrita conformidade com as instruções do Gate, a rotação global cega do JWT Secret foi interrompida para evitar indisponibilidade em sistemas satélite.
   - Declarados os marcadores oficiais:
     - `SUPABASE_SERVICE_ROLE_ROTATION_REQUIRES_COORDINATED_ACTION = true`.
     - `COMPROMISED_SUPABASE_SERVICE_ROLE_NOT_USED_BY_EDITION_RUNTIME = true`.
   - **Consumidores que requerem coordenação futura:**
     - `haxrsignatureweb` (Produção Vercel: `prj_XqX7...`)
     - `c:\project-x\haxrsignature\.env.local`
     - Deployments de Preview do site principal.

---

## 4. Validação Canónica Pós-Rotação em Direto
Executado diretamente contra a produção canónica `https://edition.haxrsignature.com`:
- `GET /` -> HTTP 200 OK
- `GET /api/memories?slug=jessicasamuelwedding` -> HTTP 200 OK (62 itens)
- `GET /api/memories?slug=jessicaesamueltraditionalwedding` -> HTTP 200 OK (85 itens)
- **Total de Fotos:** 147
- **Distribuição de URLs:**
  - Cloudflare R2 signed URLs: 147
  - Supabase Storage URLs: 0
- **Leitura de Mídia Representativa:** HTTP 206 Partial Content verificado com sucesso.
- `EDITION_METADATA_PROVIDER = NEON_CONFIRMED`.
- `EDITION_STORAGE_PROVIDER = R2_CONFIRMED`.

---

## 5. Prova de Congelamento Contínuo (Write-Freeze)
- `POST /api/memories/upload-intent`:
  - Resposta HTTP: `503 Service Unavailable`.
  - Código: `STORAGE_WRITE_FROZEN`.
  - Mensagem: "O envio de memórias está temporariamente em manutenção para actualização de sistema."
- Contagem de Intenções:
  - Supabase `photo_upload_intents` delta: 0 (185 -> 185).
  - Neon `photo_upload_intents` delta: 0 (185 -> 185).
- `HAXR_STORAGE_WRITE_FREEZE = true`.

---

## 6. Guarda de Dados Físicos e Metadados
- **Neon Produção (`wedding_photos`):** 147 fotos.
- **Supabase (`wedding_photos`):** 147 fotos.
- **Cloudflare R2 (`haxr-wedding-photos`):** 147 objectos, 535.493.700 bytes.
- **Mutações Inesperadas:** rigorosamente zero.

---

## 7. Declaração Final de Fecho

```properties
NEON_COMPROMISED_OWNER_INVALIDATED=true
OLD_NEON_OWNER_CREDENTIAL_VALID=false
EDITION_RUNTIME_STILL_HEALTHY=true
SUPABASE_SERVICE_ROLE_ROTATION_REQUIRES_COORDINATED_ACTION=true
COMPROMISED_SUPABASE_SERVICE_ROLE_NOT_USED_BY_EDITION_RUNTIME=true
EDITION_METADATA_PROVIDER=NEON_CONFIRMED
EDITION_STORAGE_PROVIDER=R2_CONFIRMED
HAXR_STORAGE_WRITE_FREEZE=true
NEON_PRODUCTION_METADATA_PARITY=true
```

### Decisão Final do Gate:
**PASS WITH DECLARED SUPABASE LEGACY CREDENTIAL FOLLOW-UP**

### Próximo Passo:
**Freeze-preserving end-to-end write canary — NOT AUTHORIZED**
*(Aguardando autorização explícita do operador humano para qualquer actividade de write canary).*
