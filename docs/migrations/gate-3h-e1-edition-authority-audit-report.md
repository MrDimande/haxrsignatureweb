# Relatório do Gate 3H-E1: Auditoria de Autoridade e Arquitectura de Escrita do Edition Engine

**Data e Hora**: 2026-09-05 08:02 CAT (Maputo)  
**Operador Responsável**: Antigravity — Engenheiro Full-Stack Sênior de Nível Mundial  
**Modo Operacional**: ESTRITAMENTE LEITURA (READ-ONLY) — Sem Mutações, Sem Canários, Sem Deploys  
**Classificação Final do Gate**: `PASS — EDITION WRITE ARCHITECTURE MAPPED`  
**Classificação Estrutural**: `CASE_B_EDITION_SUPABASE_WRITE_PATH_REQUIRES_R2_INTEGRATION`

---

## 1. Sumário Executivo e Descoberta Arquitectural Fundamental

Durante o Gate 3H-E0, comprovou-se que o repositório principal `MrDimande/haxrsignatureweb` implementou a camada de serviço `MemoriesUploadService` e teve o seu `STORAGE_PROVIDER` migrado com sucesso para `r2-s3`, mas não possui rotas HTTP activas de upload nem interface com o utilizador para convidados.

No presente **Gate 3H-E1**, procedeu-se à auditoria forense do sistema real de convidados em execução no domínio `https://edition.haxrsignature.com`. 

### Descobertas Críticas:
1. **Identidade do Projecto e Repositório**:
   - A experiência de convidados reside no projecto Vercel `projecto-haxrsignature-edition`, alimentado pelo repositório GitHub `MrDimande/haxrsignature-edition-engine`.
   - O deployment canónico activo em produção é `dpl_CzCYxKFvQTX8kXLxZu3Vb7EKeWt2`, gerado a partir do commit SHA `3429ea2d9df3967c0fd90d9e1ccc46fe2cdc483a` no ramo `main`.
2. **Arquitectura Física e de Metadados Activa em Produção**:
   - O motor de edição utiliza **exclusivamente Supabase** (`@supabase/supabase-js`).
   - O armazenamento físico é o balde Supabase Storage `wedding-photos`.
   - Os metadados e os intents de upload residem nas tabelas Supabase PostgreSQL `photo_upload_intents` e `wedding_photos`.
   - A biblioteca `@vercel/blob` NÃO está instalada nem referenciada no código de produção.
3. **Correlação Inquestionável com os 147 Objectos Históricos**:
   - Provou-se categoricamente que os 147 objectos físicos congelados no Supabase e transferidos para o Cloudflare R2 (`haxr-wedding-photos`) pertencem integral e exclusivamente ao fluxo do Edition Engine:
     - 85 objectos sob o prefixo `jessicaesamueltraditionalwedding/` (Casamento Tradicional).
     - 62 objectos sob o prefixo `jessicasamuelwedding/` (Casamento Religioso).
     - Total: exactamente 147 memórias públicas activas retornadas por `GET /api/memories`.
4. **Vulnerabilidade de Controlo de Processo — Falta de Freeze Global**:
   - O mecanismo `HAXR_STORAGE_WRITE_FREEZE = true` configurado no `haxrsignatureweb` **NÃO TEM EFEITO** no `edition.haxrsignature.com`.
   - O `haxrsignature-edition-engine` não tem nenhum mecanismo de write-freeze implementado (`EDITION_WRITE_FREEZE_MECHANISM = NOT_IMPLEMENTED`).
   - Consequentemente, o estado de congelamento global de media de casamento é `GLOBAL_WEDDING_MEDIA_WRITE_FREEZE = NOT_PROVEN`.

---

## 2. Inspecção Detalhada por Requisito

### Requisito 1: Autoridade de Produção do Edition Engine
- **EDITION_VERCEL_PROJECT_ID**: `prj_gR5eLFnRUjEm2IPPMqgOpR9PrqHw`
- **EDITION_VERCEL_PROJECT_NAME**: `projecto-haxrsignature-edition`
- **EDITION_PRODUCTION_DEPLOYMENT_ID**: `dpl_CzCYxKFvQTX8kXLxZu3Vb7EKeWt2`
- **EDITION_PRODUCTION_READY_STATE**: `READY` (Substate: `PROMOTED`)
- **EDITION_PRODUCTION_GIT_REPOSITORY**: `MrDimande/haxrsignature-edition-engine`
- **EDITION_PRODUCTION_GIT_BRANCH**: `main`
- **EDITION_PRODUCTION_GIT_SHA**: `3429ea2d9df3967c0fd90d9e1ccc46fe2cdc483a`
- **Vínculo de Domínio**: `edition.haxrsignature.com` está comprovadamente vinculado a `dpl_CzCYxKFvQTX8kXLxZu3Vb7EKeWt2`.

### Requisito 2: Correspondência com Repositório Local
- **Directório Local**: `c:\project-x\projecto_haxrsignature`
- **Remoto Git**: `origin https://github.com/MrDimande/haxrsignature-edition-engine.git`
- **Verificação Criptográfica**: `git cat-file -e 3429ea2d9df3967c0fd90d9e1ccc46fe2cdc483a` concluída com sucesso (código de saída 0).
- **EDITION_LOCAL_SOURCE_MATCH**: `true`.

### Requisito 3: Mapeamento da Interface do Utilizador (UI) Real de Convidados
- **Componentes de Interface**:
  - `engines/true-theme/profiles/jessica-samuel-wedding/memories/PlusMemoriasCaptureModal.tsx`
  - `engines/true-theme/profiles/primavera-lobolo/memories/MemoriasCaptureModal.tsx`
- **Controlos de Entrada de Ficheiro**:
  - Câmara: `<input type="file" accept="image/*" capture="environment">`
  - Galeria: `<input type="file" accept="image/*">`
  - Vídeo: `<input type="file" accept="video/mp4,video/quicktime,video/webm">`
- **Limites e Validações de Cliente**:
  - Fotos: até 25 MB (`maxImageFileSizeBytes`).
  - Vídeos: até 100 MB (`maxVideoFileSizeBytes`).
  - Legenda: máximo 200 carateres.
  - Nome do convidado: máximo 80 carateres.
  - Optimização client-side opcional via `optimizePhoto` (redimensionamento / compressão Canvas).
- **Acção de Envio**: `<button onClick={handleUpload}>` invoca `uploadPlusMemory` em `plus-memorias-upload.ts`.
- **Cadeia de Chamadas Efectiva**:
  1. `POST /api/memories/upload-intent` com payload JSON contendo slug, nome do ficheiro, MIME type e tamanho declarado.
  2. `PUT <uploadUrl>` com o corpo binário do ficheiro e cabeçalho `Content-Type` directo para o Storage.
  3. `POST /api/memories/complete` com confirmação e metadados.
- **REAL_GUEST_UPLOAD_UI**: `REACHABLE`.

### Requisito 4: Auditoria da Rota `/api/memories/upload-intent`
- **Ficheiro de Implementação**: `app/api/memories/upload-intent/route.ts` e `lib/memories/upload.ts`.
- **Autenticação**: Pública com limitação de taxa (`publicMutationRateLimit`).
- **Validação de Evento**: `resolveMemoriesConfig(slug)` valida no ficheiro estático `data/invitations.ts`.
- **Identificador de Foto**: `photoId = randomUUID()`.
- **Modelo de Caminho**: `buildStoragePath` gera `${invitationSlug}/${photoId}/original.${ext}`.
- **Backend Seleccionado**: Supabase Storage (`supabase.storage.from("wedding-photos").createSignedUploadUrl(storagePath)`).
- **TTL da URL Assinada**: 900 segundos (15 minutos).
- **Método HTTP**: `PUT`.
- **Balde de Destino**: `wedding-photos`.
- **Efeitos Duráveis Secundários**:
  - Executa `getPhotoUploadIntentRepository().create(...)`, gravando duravelmente uma linha na tabela PostgreSQL `photo_upload_intents` com `status: "pending"`, `declared_file_size_bytes`, `storage_path` e `expires_at`.
  - **Atenção**: Chamar esta rota gera escrita durável na base de dados.

### Requisito 5: Auditoria da Rota `/api/memories/complete`
- **Ficheiro de Implementação**: `app/api/memories/complete/route.ts` e `lib/memories/upload.ts`.
- **Verificação de Intenção**: Executa consumo atómico na tabela `photo_upload_intents` com actualização de `status = 'pending'` para `'consumed'` e validação de `expires_at > NOW()`.
- **Verificação de Existência Física**: Executa `supabase.storage.from("wedding-photos").download(intent.storagePath)`.
- **Validação de Bytes e Magic Bytes**:
  - Rejeita e apaga fisicamente o ficheiro (`storage.remove`) se o tamanho for superior ao declarado.
  - Valida a assinatura de bytes reais (JPEG, PNG, WebP, HEIC, MP4, MOV).
- **Inserção de Metadados**: Insere registo na tabela `wedding_photos` com `moderation_status = 'pending'`.
- **Prevenção de Replay**: Consumo atómico garante protecção contra reenvio de confirmação.

### Requisitos 6 e 7: Backend e Localização de Armazenamento Activo
- **Provedor Activo**: `SUPABASE_STORAGE`.
- **Referência do Projecto**: `oxsrdmydlqyvnueedgtl` (`https://oxsrdmydlqyvnueedgtl.supabase.co`).
- **Balde**: `wedding-photos`.
- **Modelo de Caminhos**: `${invitationSlug}/${photoId}/original.${ext}`.
- **EDITION_CURRENT_STORAGE_PROVIDER**: `SUPABASE_STORAGE`
- **EDITION_CURRENT_STORAGE_CONTAINER**: `wedding-photos`
- **EDITION_CURRENT_STORAGE_PATH_MODEL**: `${invitationSlug}/${photoId}/original.${ext}`

### Requisito 8: Correlação com os 147 Objectos Congelados
- **Inventário de Objectos no R2 e Supabase**:
  - `jessicaesamueltraditionalwedding`: 85 ficheiros
  - `jessicasamuelwedding`: 62 ficheiros
  - Total: 147 ficheiros (535.493.700 bytes)
- **Resposta em Produção do Edition Engine (`GET /api/memories`)**:
  - `GET /api/memories?slug=jessicasamuelwedding` -> exactamente 62 memórias aprovadas com prefixo `https://oxsrdmydlqyvnueedgtl.supabase.co/storage/v1/object/sign/wedding-photos/jessicasamuelwedding/...`
  - `GET /api/memories?slug=jessicaesamueltraditionalwedding` -> exactamente 85 memórias aprovadas com prefixo `https://oxsrdmydlqyvnueedgtl.supabase.co/storage/v1/object/sign/wedding-photos/jessicaesamueltraditionalwedding/...`
  - Total: 62 + 85 = 147.
- **FROZEN_147_BELONG_TO_EDITION_FLOW**: `PROVEN`.

### Requisitos 9 e 10: Backend e Correlação de Metadados
- **Provedor de Metadados**: Supabase PostgreSQL.
- **Tabela de Metadados**: `wedding_photos`.
- **Tabela de Controlo de Intents**: `photo_upload_intents`.
- **EDITION_METADATA_PROVIDER**: `SUPABASE`
- **EDITION_METADATA_TABLE**: `wedding_photos`
- **EDITION_METADATA_EQUALS_SUPABASE_WEDDING_PHOTOS**: `true`
- **EDITION_METADATA_EQUALS_NEON_WEDDING_PHOTOS**: `true`

### Requisito 11: Rota Real de Leitura da Galeria
- `GET /api/memories?slug=<slug>` invoca `listMemories(slug)` (`lib/memories/gallery.ts`).
- Consulta os registos aprovados na tabela `wedding_photos`.
- Para cada memória, gera uma URL assinada privada do Supabase Storage com TTL de 300 segundos (5 minutos).
- Cache HTTP: `Cache-Control: private, max-age=15`.

### Requisitos 12 e 13: Mecanismo e Cobertura de Write-Freeze
- A pesquisa exaustiva no código de produção do Edition Engine revelou **zero implementações** de write-freeze para as rotas genéricas `/api/memories/*`.
- O freeze configurado no repositório `haxrsignatureweb` não atinge o `projecto-haxrsignature-edition`.
- **EDITION_WRITE_FREEZE_MECHANISM**: `NOT_IMPLEMENTED`
- **GLOBAL_WEDDING_MEDIA_WRITERS**: `["edition.haxrsignature.com (/api/memories/*)"]`
- **GLOBAL_WEDDING_MEDIA_WRITE_FREEZE**: `NOT_PROVEN`

### Requisito 14: Acessibilidade em Produção sem Mutações
- Executados com sucesso via pedidos `HEAD` e `GET`:
  - `HEAD https://edition.haxrsignature.com` -> `200 OK`
  - `HEAD https://edition.haxrsignature.com/jessicasamuelwedding` -> `200 OK`
  - `HEAD https://edition.haxrsignature.com/jessicaesamueltraditionalwedding` -> `200 OK`
  - `GET https://edition.haxrsignature.com/api/memories?slug=jessicasamuelwedding` -> `200 OK` (62 itens)
  - `GET https://edition.haxrsignature.com/api/memories?slug=jessicaesamueltraditionalwedding` -> `200 OK` (85 itens)
- Nenhum pedido `POST` foi emitido.

### Requisito 15: Suporte a R2 no Edition Engine
- Não existem dependências `@aws-sdk/client-s3` nem abstrações S3/R2 no commit de produção.
- **EDITION_R2_SUPPORT**: `NOT_IMPLEMENTED`.

### Requisito 16: Compatibilidade de CORS com Cloudflare R2
- A política CORS actual do balde `haxr-wedding-photos` autoriza:
  - Origem: `https://edition.haxrsignature.com`
  - Método: `PUT`
  - Cabeçalho: `Content-Type`
- O cliente `uploadPlusMemory` emite exactamente um `fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file })`.
- **CURRENT_R2_CORS_SUFFICIENT_FOR_PROPOSED_EDITION_UPLOAD**: `true` (para upload directo via PUT).

### Requisito 17: Modelo de Estado de Intenção
- **Classificação**: `DATABASE_PERSISTED`.
- Gravado na tabela `photo_upload_intents` do PostgreSQL.

### Requisito 18: Concorrência e Segurança de Replay
- **Single-use**: Seguro. Consumo de intent usa transacção de update condicional atómica.
- **Substituição de Tipo e Tamanho**: Seguro contra spoofing graças à validação de magic bytes e contagem física.
- **BLOCKER**: Falta de write-freeze no Edition Engine.
- **HIGH**: Dependência directa de `supabase.storage.download` em `/api/memories/complete` quebrará o fluxo se o storage for alterado sem adapter R2.
- **HIGH**: Download de vídeos de até 100 MB em serverless Next.js corre risco de timeout na Vercel.
- **MEDIUM**: Acumulação de ficheiros órfãos se o utilizador fechar o browser após o upload físico sem chamar `/complete`.

### Requisito 19: Dependência de Migração da Base de Dados
- A coluna `storage_path` na base de dados guarda apenas chaves relativas de objecto (ex: `jessicasamuelwedding/<uuid>/original.jpg`). Não contém URLs absolutas nem chaves privadas do Supabase.
- **STORAGE_CUTOVER_INDEPENDENT_OF_DB**: `true`.
- O armazenamento pode ser transferido para R2 mantendo temporariamente ou definitivamente a base de dados no Supabase ou no Neon.

---

## 3. Opções Arquitecturais e Recomendação Formal

### Opções Avaliadas:
- **Opção A: Integração Nativa R2 no Edition Engine (Autónoma)**:
  - Adicionar `@aws-sdk/client-s3` e `@aws-sdk/s3-request-presigner` no projecto `projecto-haxrsignature-edition`.
  - Gerar presigned PUT URLs directamente para `haxr-wedding-photos`.
  - Validar objecto no `/api/memories/complete` via `HeadObjectCommand` no R2.
  - *Vantagens*: Latência mínima (sem saltos adicionais de rede), isolamento total de falhas, independência entre o portal marketing e a aplicação de convidados, rollback trivial via variáveis de ambiente.
- **Opção B: Delegação por Proxy/API a HaxrSignatureWeb**:
  - *Desvantagens*: Hop duplo de rede (Guest -> Edition Engine -> HaxrSignatureWeb -> R2), acoplamento frágil de deploys, risco de indisponibilidade em cadeia.
- **Opção C: Pacote Partilhado (Shared Package)**:
  - *Desvantagens*: Overhead excessivo de infraestrutura e registo npm privado sem benefício imediato para a migração em curso.

### Recomendação Formal:
**RECOMMENDED_EDITION_R2_ARCHITECTURE**: `OPTION_A_EDITION_NATIVE_R2_INTEGRATION`

---

## 4. Plano de Freeze Global e Sequência Conservadora de Cutover

### Plano de Freeze para o Edition Engine:
1. **Aplicação Alvo**: `projecto-haxrsignature-edition` (`edition.haxrsignature.com`).
2. **Variável de Controlo**: `HAXR_STORAGE_WRITE_FREEZE = true`.
3. **Comportamento em Bloqueio**:
   - `/api/memories/upload-intent`: Retorna imediatamente HTTP 503 com código `STORAGE_WRITE_FROZEN` e mensagem editorial de manutenção.
   - `/api/memories/complete`: Permite drenagem durante 15 minutos para que pedidos já iniciados pelos telemóveis dos convidados possam ser concluídos.
4. **Intervalo de Drenagem**: 15 minutos (tempo de expiração do TTL de upload-intent).
5. **Critério de Estabilidade**: Comprovação de zero intents com `status = 'pending'` após os 15 minutos.

### Sequência Futura de Cutover:
1. Implementação da integração R2 e do mecanismo `HAXR_STORAGE_WRITE_FREEZE` no Edition Engine.
2. Testes unitários e de isolamento.
3. Validação em ambiente Preview na Vercel.
4. Activação de `HAXR_STORAGE_WRITE_FREEZE = true` em produção no Edition Engine.
5. Período de drenagem de 15 minutos.
6. Verificação e sincronização de qualquer delta final (caso existam novos uploads durante a drenagem).
7. Activação de `STORAGE_PROVIDER = r2-s3` em produção no Edition Engine.
8. Validação de leitura da galeria de memórias.
9. Execução de canário de escrita controlado no R2.
10. Desactivação do freeze e reabertura do serviço de memórias.

---

## 5. Verificação de Imutabilidade dos Dados

Os inventários físicos e de base de dados foram consultados e validados em tempo real:
- **Supabase Storage (`wedding-photos`)**: 147 ficheiros de media canónicos (535.493.700 bytes) + 1 marcador estrutural (`.emptyFolderPlaceholder`, 0 bytes).
- **Cloudflare R2 (`haxr-wedding-photos`)**: 147 ficheiros (535.493.700 bytes).
- **Delta Físico de Media**: ZERO.
- **Supabase DB (`wedding_photos`)**: 147 registos.
- **Neon DB (`public.wedding_photos`)**: 147 registos.
- **Delta de Metadados**: ZERO.
- **Novos Ficheiros de Convidados**: ZERO (`SOURCE_DRIFT_DETECTED = false`).

---

## 6. Estado dos Repositórios e Orçamento de Mutações

- **Repositório Principal (`MrDimande/haxrsignatureweb`)**:
  - `STORAGE_PROVIDER = r2-s3` (inalterado)
  - `HAXR_STORAGE_WRITE_FREEZE = true` (inalterado)
  - Deployment canónico: `dpl_9kmkXedpjvewAvAuAC3iYzYinYbG` (inalterado)
- **Orçamento de Mutações**:
  - Alterações de variáveis de ambiente em produção: 0
  - Novos deployments em produção: 0
  - Escritas em Storage (Supabase/R2): 0
  - Eliminações em Storage: 0
  - Escritas em Base de Dados (Supabase/Neon): 0
  - Mutações Git (commits/pushes): 0
  - Upload Intents gerados em produção: 0
  - Canários executados: 0

---

## 7. Classificações Formais e Fecho do Gate

- **MIGRATION_PARENT_READY_FOR_HUMAN_REVOCATION**: `false`
- **storageCutoverReady**: `false`
- **GLOBAL_WEDDING_MEDIA_WRITE_FREEZE**: `NOT_PROVEN`
- **ESTADO FINAL DO GATE 3H-E1**: `PASS — EDITION WRITE ARCHITECTURE MAPPED`
- **PRÓXIMA ETAPA**: `Edition R2 Integration Implementation — NOT AUTHORIZED`
