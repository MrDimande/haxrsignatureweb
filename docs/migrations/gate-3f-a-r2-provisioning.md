# Gate 3F-A — Controlled Cloudflare R2 Provisioning & Infrastructure Preflight

**Documento Oficial:** `docs/migrations/gate-3f-a-r2-provisioning.md`  
**Data:** 2026-09-03  
**Status do Gate:** **BLOCKED (CREDENTIALS_REQUIRED)** — Preflights Locais e Arquitetura de Segurança 100% Aprovados  
**Módulos de Implementação:**  
- Engine / Preflight: [`scripts/provision-r2-infrastructure.mjs`](file:///c:/project-x/haxrsignature/scripts/provision-r2-infrastructure.mjs)  
- Test Suite: [`scripts/provision-r2-infrastructure.test.mjs`](file:///c:/project-x/haxrsignature/scripts/provision-r2-infrastructure.test.mjs)  
- Canonical Path Security: [`src/lib/edition/storage/canonical-path.ts`](file:///c:/project-x/haxrsignature/src/lib/edition/storage/canonical-path.ts)  
**Regra Fundamental:** ZERO cópia física de blobs, ZERO mutações na base de dados Neon ou Supabase Storage, ZERO ativação de dual-read, ZERO cutover e ZERO deploy.

---

## 1. Avaliação Arquitetural e Estado do Sistema

Como Arquiteto e Engenheiro Principal do ecossistema HAXR, a inspeção inicial estabeleceu:
1. **Branch e Isolamento:** Execução estritamente contida na branch `migration/supabase-to-neon`. Branches `main` e `master` estão bloqueadas por código fail-closed.
2. **Contrato Canónico de Armazenamento:** A aplicação normal em produção opera exclusivamente sobre o padrão canónico `{invitation_slug}/{photo_id_uuid}/original.{ext}`. O suporte a prefixos de staging (`__migration/...`) possui `allowStaging = false` como valor padrão absoluto, sendo impossível injetar caminhos de staging sem opt-in explícito no pipeline de migração.
3. **Imutabilidade da Fonte e Base de Dados:** Os 147 blobs físicos no Supabase Storage (`wedding-photos`, ~510.69 MB) e a tabela `wedding_photos` no Neon Preview permanecem 100% intocados e em modo somente-leitura.
4. **Estado das Credenciais de Destino:** Uma auditoria rigorosa ao ambiente (`process.env`, `.env.local`, `.env.migration.preview.local` e diretórios do utilizador) confirmou que **nenhuma credencial ou token da Cloudflare R2 está configurada**. Em estrito cumprimento do princípio fundamental *"DO ONLY WHAT WAS REQUESTED OR EXPLICITLY AUTHORIZED"* e *"Não assumas. Não alucines"*, nenhuma chamada fictícia de rede foi forjada. O estado do provisionamento remoto é mantido com honestidade técnica como `BLOCKED (CREDENTIALS_REQUIRED)`.

---

## 2. Pinned Baseline do Gate 3D e Manifest do Gate 3E

O preflight do Gate 3F-A validou formalmente a invariabilidade matemática dos dados de origem:

```text
sourceInventoryChecksum = 57e1369fcb302d2fa8c0e027cdc4979ae0ba553866ea08e7b37b5152d9748728
sourceObjectCount       = 147
sourceTotalBytes        = 535493700
manifestChecksum        = 4eab656cabec14a86325c9303659fe86d19d61d34a56a9fd6fc7d314e818dda9
```

Qualquer divergência nestes quatro hashes e métricas aborta imediatamente a execução do protocolo.

---

## 3. Especificação Canónica do Destino (Cloudflare R2)

| Atributo | Especificação R2 Aprovada |
|---|---|
| **Provedor** | Cloudflare R2 (API compatível com S3) |
| **Nome do Bucket** | `haxr-wedding-photos` |
| **Região** | `auto` |
| **Visibilidade** | `private` por padrão |
| **Subdomínio `r2.dev`** | **Desativado** (`r2DevEnabled: false`) |
| **Domínio Personalizado Público** | **Nenhum** (`publicCustomDomain: false`) |
| **Acesso Não-Autenticado** | **Bloqueado** (`unauthenticatedAccess: false`) |
| **Contagem Esperada de Objetos** | **0** (o bucket de destino deve estar estritamente vazio antes da migração) |

---

## 4. Segurança de Credenciais e Least Privilege

As credenciais necessárias para a comunicação futura com a Cloudflare R2 são desenhadas sob o princípio do menor privilégio (*least privilege*):
- **Escopo do Token API / R2 API Token:**
  - Permissões: Leitura e Escrita de Objetos exclusivamente no bucket `haxr-wedding-photos`.
  - Proibição: Sem privilégios administrativos de conta global ou acesso a outros domínios da Cloudflare.
- **Isolamento de Secrets:**
  - Nenhuma credencial foi ou será impressa em stdout, commits do Git, artefactos JSON ou documentação.
  - O utilitário `loadR2Environment()` suporta carregamento a partir do ficheiro não-rastreado `.env.r2.local` ou variáveis de ambiente dedicadas (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`).

---

## 5. Matriz de Testes Automatizados (Gate 3F-A)

1. **Suite Específica de Preflight e R2 (`scripts/provision-r2-infrastructure.test.mjs`):**
   - 11/11 testes passaram aprovando:
     - Bloqueio imediato nas branches `main` e `master`.
     - Bloqueio por divergência no baseline do Gate 3D ou manifest do Gate 3E.
     - Bloqueio se `STORAGE_CUTOVER_READY = true`.
     - Validação de redaction de credenciais sem vazamento de segredos.
     - Fail-closed com código `CREDENTIALS_REQUIRED` na ausência de tokens remotos.
     - Bloqueio se o bucket no destino contiver qualquer objeto (`objectCount > 0`).
2. **Suite de Caminhos Canónicos e Staging (`src/lib/edition/storage/storage-provider.test.ts`):**
   - 28/28 testes passaram, comprovando que `allowStaging = false` é o comportamento default e bloqueia caminhos de staging na aplicação comum.
3. **Regressão Global (`npm test`):**
   - 934/934 testes passaram (217 suites, 0 falhas).
4. **TypeScript & ESLint:**
   - 0 erros em `npx tsc --noEmit` e `npx eslint`.

---

## 6. Procedimento de Desbloqueio Operacional para o Operador Humano

Para que o provisionamento e o teste de conectividade remota real (`HeadBucket` / `ListObjectsV2`) possam ser efetuados pelo motor sem riscos:
1. Criar localmente o ficheiro `.env.r2.local` (adicionado ao `.gitignore`):
   ```bash
   CLOUDFLARE_ACCOUNT_ID=seu_account_id
   CLOUDFLARE_API_TOKEN=seu_token_api_rest
   # OU credenciais S3-compatible:
   R2_ACCESS_KEY_ID=seu_access_key
   R2_SECRET_ACCESS_KEY=seu_secret_key
   R2_ENDPOINT=https://seu_account_id.r2.cloudflarestorage.com
   R2_BUCKET_NAME=haxr-wedding-photos
   ```
2. Após a injeção segura das credenciais pelo operador, o teste de conectividade e verificação de `objectCount = 0` poderá ser executado.

---

## 7. Registo Histórico de Classificação e Evidência Objetiva (Gate 3F-A.6)

1. **Classificação Oficial da Ausência do Ficheiro Local:**
   - O resultado de verificação quando `.env.r2.local` não foi encontrado no caminho esperado foi classificado como `LOCAL_ENV_FILE_MISSING` / `OPERATOR_CONFIGURATION_REQUIRED`.
2. **Evidência Objetiva:**
   `The required environment file was not present at the expected filesystem path.`

---

## 8. Evidência Concreta de Autenticação e Provisionamento Live (Gate 3F-A.7)

1. **Autenticação Headless via API Token:**
   - `npx wrangler r2 bucket list --env-file .env.r2.local` executado com código de saída 0.
   - Classificação: `HEADLESS_TOKEN_AUTHENTICATION = VERIFIED`.
2. **Account Pinning Live:**
   - `CLOUDFLARE_ACCOUNT_ID === EXPECTED_CLOUDFLARE_ACCOUNT_ID`: **VERIFIED** (sem divergências).
3. **Provisionamento do Bucket `haxr-wedding-photos`:**
   - Comando executado: `npx wrangler r2 bucket create haxr-wedding-photos --env-file .env.r2.local`.
   - Resultado oficial: `✅ Created bucket 'haxr-wedding-photos' with default storage class of Standard.`
   - Revalidação via `npx wrangler r2 bucket list --env-file .env.r2.local`:
     - `name: haxr-wedding-photos`
     - `creation_date: 2026-09-03T09:06:26.060Z`
4. **Metadados e Estado Live do Bucket:**
   - Comando: `npx wrangler r2 bucket info haxr-wedding-photos --env-file .env.r2.local`.
   - `location: WEUR` (Europa Ocidental).
   - `default_storage_class: Standard`.
   - `object_count: 0`.
   - `bucket_size: 0 B`.
5. **Auditoria de Privacidade e Exposição Pública:**
   - `r2.dev URL`: `npx wrangler r2 bucket dev-url get haxr-wedding-photos --env-file .env.r2.local` ->
     `Public access via the r2.dev URL is disabled.`
   - `Custom Domains`: `npx wrangler r2 bucket domain list haxr-wedding-photos --env-file .env.r2.local` ->
     `There are no custom domains connected to this bucket.`
6. **Estado da Identidade de Auditoria S3 (`GATE_3F_A_AUDIT_IDENTITY`):**
   - O ficheiro `.env.r2.local` não contém credenciais de acesso S3 (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`).
   - O Wrangler CLI não disponibiliza comando para geração programática de tokens S3.
   - Classificação obrigatória: `OPERATOR_R2_READ_CREDENTIAL_REQUIRED`.
   - Status: `GATE 3F-A = BLOCKED`.
7. **Instruções para o Operador Humano:**
   - Aceder ao Cloudflare Dashboard -> R2 -> Manage R2 API Tokens.
   - Criar token com permissão: `Object Read only`.
   - Restringir escopo exclusivamente ao bucket: `haxr-wedding-photos`.
   - Inserir em `.env.r2.local` (sem partilhar no chat):
     ```env
     R2_ACCESS_KEY_ID=<access_key_id>
     R2_SECRET_ACCESS_KEY=<secret_access_key>
     R2_ENDPOINT=https://<CLOUDFLARE_ACCOUNT_ID>.r2.cloudflarestorage.com
     AWS_REGION=auto
     ```
8. **Preservação de Restrições:**
   - `MIGRATION_OBJECT_IDENTITY = NOT CREATED — NOT AUTHORIZED`.
   - `Gate 3F-B = NOT AUTHORIZED`.

---

## 9. Prova Criptográfica Final e Auditoria S3 Read-Only Ponta-a-Ponta (Gate 3F-A.8)

1. **Configuração da `GATE_3F_A_AUDIT_IDENTITY`:**
   - Permissão: `Object Read only`.
   - Escopo: `haxr-wedding-photos only`.
   - Credenciais S3: Injetadas com segurança via `.env.r2.local` (ignorado no Git).
   - Driver oficial: `@aws-sdk/client-s3` (`S3Client`, `HeadBucketCommand`, `ListObjectsV2Command`).
2. **Execução do `HeadBucketCommand`:**
   - Chamada live executada contra `haxr-wedding-photos`.
   - Resultado: **`S3_HEAD_BUCKET = VERIFIED`** (HTTP 200 OK).
3. **Auditoria Determinística via `ListObjectsV2Command`:**
   - Paginação completa percorrida (`IsTruncated`, `NextContinuationToken`).
   - Contagem ponta-a-ponta:
     - `objectCount = 0`
     - `totalBytes = 0`
4. **Cross-Check Administrativo vs. Protocolo S3:**
   - Cloudflare API Administrativa: `object_count: 0`, `bucket_size: 0 B`.
   - S3 ListObjectsV2 Live: `objectCount: 0`, `totalBytes: 0`.
   - Resultado: **`DESTINATION_EMPTY = VERIFIED`** / **`ADMIN_S3_CROSS_CHECK = VERIFIED`**.
5. **Zero Mutações e Zero Transferências:**
   - `PutObject = 0`, `CopyObject = 0`, `DeleteObject = 0`, `CreateMultipartUpload = 0`.
   - Blobs transferidos: `0`.
   - Bytes transferidos: `0`.
   - Todos os 147 blobs (535.493.700 bytes) permanecem intactos na origem (Supabase).
6. **MIGRATION_OBJECT_IDENTITY:**
   - Status: **`NOT CREATED — NOT AUTHORIZED`**.
7. **Baselines Preservados:**
   - Gate 3D: `57e1369fcb302d2fa8c0e027cdc4979ae0ba553866ea08e7b37b5152d9748728` (147 objetos, 535493700 bytes).
   - Gate 3E: `4eab656cabec14a86325c9303659fe86d19d61d34a56a9fd6fc7d314e818dda9`.
8. **Application State:**
   - `SupabaseStorageProvider = ACTIVE` (Produção inalterada).
   - `S3CompatibleStorageProvider = NOT ACTIVE`.
   - `dualRead = INACTIVE`.
   - `storageCutoverReady = false`.
9. **Resultado do Gate:**
   - **`GATE 3F-A = PASS — CLOSED`**
   - **`GATE 3F-B = NOT AUTHORIZED`** (Paragem absoluta obrigatória).

---
*Fim do documento oficial do Gate 3F-A.*
