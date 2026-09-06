# Gate 3H-E2: Relatório de Implementação da Integração Nativa R2 na Edition

## Data e Contexto de Execução
- **Data:** 05 de Setembro de 2026
- **Repositório Modificado:** `MrDimande/haxrsignature-edition-engine` (`c:\project-x\projecto_haxrsignature`)
- **Branch de Implementação:** `migration/edition-r2-integration`
- **SHA Canónico de Produção Base:** `3429ea2d9df3967c0fd90d9e1ccc46fe2cdc483a`
- **Âmbito Operacional:** CODE + LOCAL TESTS ONLY (0 mutações em Produção, 0 deploys, 0 canários, 0 escritas físicas em R2 ou Supabase).

---

## 1. Baseline de Pré-Execução e Estado do Repositório

Antes de qualquer modificação, foi verificado o histórico git e executada a verificação canónica:
- `git fetch origin --prune`: Concluído.
- A branch `migration/edition-r2-integration` foi criada explicitamente a partir do SHA de Produção `3429ea2d9df3967c0fd90d9e1ccc46fe2cdc483a`.
- A suite de testes pré-existente acusou 4 falhas em ficheiros não relacionados (`cha-lingerie-rsvp-gifts.regression.test.ts`, `photo-wall-disabled.test.ts`, `validate-local.test.ts`) e 14 erros de linting de aspas unescaped no ficheiro `primavera-lobolo`.
- Conforme a regra de preservação, estes defeitos alheios não foram alterados silenciosamente.

---

## 2. Abstracção de Armazenamento (Storage Abstraction)

Foi criada a interface desacoplada `MemoriesStorageProvider` em `lib/memories/storage/types.ts`:
- **Isolamento de Projecto:** A Edition Engine opera de forma 100% autónoma, sem dependência em tempo de execução de `haxrsignatureweb` e sem proxies de rede.
- **Assinatura de Métodos:**
  - `createSignedUploadUrl(options: SignedUploadUrlOptions): Promise<SignedUploadUrlResult>`
  - `createSignedDownloadUrl(options: SignedDownloadUrlOptions): Promise<SignedDownloadUrlResult>`
  - `getObjectInfo(storagePath: string): Promise<StorageObjectInfo>`
  - `readObjectPrefix(storagePath: string, maxBytes: number): Promise<Uint8Array | null>`
  - `remove(storagePath: string): Promise<void>`
- **Posse de Baldes Físicos:** O chamador fornece apenas `storagePath`, `contentType` e `expiresInSeconds`. O provider gere e é proprietário da configuração física dos baldes.

---

## 3. Implementação do Provedor Supabase (`SupabaseMemoriesStorageProvider`)

- Implementado em `lib/memories/storage/supabase-provider.ts`.
- Encapsula o Supabase Storage existente contra o balde `wedding-photos`.
- Mantém rigorosamente 100% da compatibilidade de comportamento actual.
- Se a variável `STORAGE_PROVIDER` estiver ausente ou for definida como `"supabase"`, o sistema selecciona este provedor por defeito, garantindo que qualquer futuro deploy deste código sem variáveis adicionais mantém o comportamento de Produção inalterado (`SUPABASE_UNCHANGED`).

---

## 4. Implementação do Provedor R2 (`R2MemoriesStorageProvider`)

- Implementado em `lib/memories/storage/r2-provider.ts` recorrendo aos pacotes oficiais `@aws-sdk/client-s3` e `@aws-sdk/s3-request-presigner`.
- **Configuração:**
  - `region: "auto"`
  - `endpoint: process.env.CLOUDFLARE_R2_ENDPOINT`
  - `credentials: { accessKeyId: ..., secretAccessKey: ... }`
  - `forcePathStyle: true`
  - `maxAttempts: 1`
  - Balde Físico: `CLOUDFLARE_R2_BUCKET_NAME` (futuro `haxr-wedding-photos`).
- **Contrato com o Navegador:** A assinatura presigned PUT restringe-se estritamente ao cabeçalho `ContentType: contentType`, respeitando integralmente a regra de CORS actual do Cloudflare R2 (`AllowedMethods: PUT`, `AllowedHeaders: Content-Type`).

---

## 5. Selecção de Provedor Fail-Closed

- Implementada em `lib/memories/storage/factory.ts`.
- **Valores autorizados:** `"supabase"` e `"r2-s3"`.
- **Comportamento Fail-Closed:**
  - Se `STORAGE_PROVIDER` tiver valor desconhecido, lança excepção de configuração imediatamente.
  - Se `STORAGE_PROVIDER="r2-s3"` e faltar qualquer uma das variáveis obrigatórias (`CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_ENDPOINT`, `CLOUDFLARE_R2_BUCKET_NAME`), falha imediatamente de forma fechada.
  - Não existe fallback silencioso de R2 para Supabase.

---

## 6. Mecanismo de Write-Freeze na Edition (`HAXR_STORAGE_WRITE_FREEZE`)

- Implementado em `lib/memories/storage/freeze.ts`, `app/api/memories/upload-intent/route.ts` e `lib/memories/upload.ts`.
- **Semântica:** Apenas a string exacta `"true"` activa o congelamento de escrita.
- **Fail-Closed Prévio:** A verificação `isMemoriesWriteFrozen()` é executada logo na primeira linha de `createMemoryUploadIntent`, antes da alocação de `randomUUID`, antes de qualquer validação de convite ou gravação em `photo_upload_intents`, e antes de qualquer contacto com o serviço de armazenamento.
- **Resposta HTTP:** Devolve HTTP 503 com o código canónico `STORAGE_WRITE_FROZEN` e a mensagem de apoio: *"O envio de fotografias encontra-se temporariamente suspenso para manutenção programada da plataforma. Por favor, tente novamente dentro de momentos."*.
- **Ordenação Garantida:** `FREEZE_FAILS_CLOSED_BEFORE_DURABLE_INTENT = true`.

---

## 7. Rota de Conclusão (`complete`) Durante o Freeze

- Conforme exigido pela arquitectura de corte limpo, a rota `POST /api/memories/complete` **NÃO** é bloqueada pelo freeze.
- Isto permite que todos os pedidos com intenção válida criada antes do freeze possam concluir o upload e drenar com segurança dentro da sua janela de TTL (900 segundos).
- Continua a exigir intenção pendente válida na base de dados, não expirada e consumo atómico único.

---

## 8. Optimização de Memória Serverless (Bounded Object Validation)

- No código anterior, o download integral do ficheiro (até 100 MB em vídeos) para a memória do servidor serverless na Vercel representava um elevado risco de latência e consumo de RAM.
- No provedor R2, a inspecção foi estruturada em duas fases estritamente delimitadas:
  1. `HeadObjectCommand`: Determina existência e `ContentLength` exacto do objecto sem transferir o corpo.
  2. `readObjectPrefix(storagePath, 512)`: Realiza um `GetObjectCommand` delimitado com o cabeçalho `Range: "bytes=0-511"` para validação dos números mágicos (JPEG, PNG, WebP, HEIC/HEIF, MP4, MOV, WebM).
- **Preservação de Segurança:** O tamanho real é validado com precisão e os bytes mágicos são verificados de forma segura. Caso o ficheiro viole o tamanho ou os bytes mágicos, é purgado do armazenamento físico através de `provider.remove(storagePath)`.

---

## 9. Leitura da Galeria (`gallery.ts`)

- `lib/memories/gallery.ts` foi refactorizado para obter as URLs assinadas de leitura através do provedor activo (`provider.createSignedDownloadUrl`).
- **TTL Preservada:** Mantido rigorosamente o valor canónico de 300 segundos (`expiresInSeconds: 300`).

---

## 10. Segurança de Caminhos (Path Security)

- Implementada a função `assertCanonicalStoragePath` em `lib/memories/storage/path-security.ts`.
- Rejeita terminantemente tentativas de path traversal (`..`, `../`), barras invertidas (`\`), caminhos absolutos (`/storage/...`), segmentos vazios (`//`) e codificações parciais.
- O formato canónico inviolável permanece `${storageSlug}/${photoId}/original.${ext}`.

---

## 11. Modelo de Base de Dados e Intenções

- `STORAGE_CUTOVER_INDEPENDENT_OF_DB = true`: A tabela `photo_upload_intents` e a tabela de metadados `wedding_photos` mantêm-se duráveis na base de dados PostgreSQL existente no Supabase.
- Não foi feita qualquer migração de base de dados para Neon neste Gate, isolando o corte de armazenamento de qualquer alteração de dados.

---

## 12. Constantes de Drenagem e Modelo de Órfãos

- **Constantes Operacionais Definidas:**
  - `CURRENT_EDITION_UPLOAD_URL_TTL_SECONDS = 900`
  - `DRAIN_GRACE_SECONDS = 120`
  - `DRAIN_MINIMUM_SECONDS = 1020`
- **Classificação de Órfãos:** Um upload PUT físico bem-sucedido no armazenamento cujo endpoint `/api/memories/complete` nunca seja invocado é classificado formalmente como `PHYSICAL_ONLY_ORPHAN`. Não são executadas remoções automáticas de órfãos durante a transição.

---

## 13. Resultados da Matriz de Testes

Foram executadas as suites completas no repositório `projecto_haxrsignature`:

1. **Testes Dedicados de Storage (Novos):**
   - `lib/memories/storage/freeze.test.ts`: 5/5 PASS
   - `lib/memories/storage/factory.test.ts`: 5/5 PASS
   - `lib/memories/storage/path-security.test.ts`: 4/4 PASS
   - `lib/memories/storage/r2-provider.test.ts`: 8/8 PASS
   - `lib/memories/storage/browser-contract.test.ts`: 1/1 PASS
   - `lib/memories/upload-integration.test.ts`: 5/5 PASS
   - **Total Novos Testes de Armazenamento:** 28/28 PASS (0 falhas).

2. **Verificação de Tipos TypeScript:**
   - `npm run typecheck` (`tsc --noEmit`): 0 erros (PASS).

3. **Compilação de Produção Next.js:**
   - `npm run build` (`next build`): PASS (52/52 páginas e rotas geradas com sucesso).

4. **Suite Canónica Global (`npm test`):**
   - 193 testes executados, 189 aprovados, 4 falhas pré-existentes na baseline (100% idênticas à baseline pré-execução).

---

## 14. Auditoria do Diff

O diff contra o SHA `3429ea2d9df3967c0fd90d9e1ccc46fe2cdc483a` abrange estritamente:
- `package.json` e `package-lock.json` (adição de `@aws-sdk/client-s3` e `@aws-sdk/s3-request-presigner`).
- `app/api/memories/upload-intent/route.ts` (suporte ao retorno HTTP 503 com `STORAGE_WRITE_FROZEN`).
- `lib/memories/upload.ts` (integração do freeze, selecção de provider, inspecção de tamanho via HeadObject e leitura de 512 bytes).
- `lib/memories/gallery.ts` (geração de download URL via provider).
- `lib/memories/storage/` (módulos e testes da abstracção de armazenamento).
- `lib/memories/upload-integration.test.ts` (testes de integração).

Nenhum ficheiro alheio, design de frontend, convite ou esquema de base de dados foi alterado.

---

## 15. Conclusão e Estado Final

- **Mutações em Produção:** 0
- **Comportamento Actual de Produção com Variáveis Inalteradas:** `SUPABASE_UNCHANGED`
- **Estado do Gate 3H-E2:** **PASS — IMPLEMENTATION READY FOR ISOLATED PREVIEW VALIDATION**
- **Próxima Etapa:** Edition R2 Isolated Preview Validation — **NOT AUTHORIZED**
