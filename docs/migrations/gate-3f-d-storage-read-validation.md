# Gate 3F-D — Relatório Formal de Validação da Abstracção de Storage (Read-Only)

## 1. Identificação e Metadados do Gate

- **Gate**: Gate 3F-D
- **Designação**: Validação de Leitura Read-Only da Abstracção de Storage
- **Repositório**: `MrDimande/haxrsignatureweb`
- **Branch**: `migration/supabase-to-neon`
- **Data de Execução**: 2026-09-04
- **Identidade R2 Utilizada**: `GATE_3F_A_AUDIT_IDENTITY` (`Object Read only`)
- **Norma Ortográfica**: Português de Moçambique (`LANGUAGE_STANDARD = PORTUGUESE_MOZAMBIQUE`)
- **Estado do Gate**: **PASS — CLOSED**
- **storageCutoverReady**: `false` (Mantido estritamente inalterado em conformidade com o mandato)
- **Recomendação de Cutover**: `READY`
- **Próxima Etapa**: Cutover — **NOT AUTHORIZED** (Aguardando autorização humana explícita)

---

## 2. Estado Físico Inicial e Baselines

### 2.1 Baseline do Cloudflare R2 (Destino)
- **Bucket**: `haxr-wedding-photos`
- **Endpoint**: `https://<account_id>.r2.cloudflarestorage.com`
- **Verificação**: `HeadBucket` (HTTP 200) e `ListObjectsV2` com paginação completa.
- **Contagem de Objectos**: `147`
- **Volume Total**: `535493700` bytes
- **Drift Pós-Transferência**: `0` (Zero desvios)

### 2.2 Baseline do Supabase Storage (Origem)
- **Bucket**: `wedding-photos`
- **Contagem de Objectos**: `147`
- **Volume Total**: `535493700` bytes
- **sourceInventoryChecksum**: `57e1369fcb302d2fa8c0e027cdc4979ae0ba553866ea08e7b37b5152d9748728`
- **Drift da Origem**: `0` (Origem idêntica à reconciliação do Gate 3D e Gate 3F-C)

### 2.3 Baseline dos Metadados da Base de Dados Neon
- **Host**: `ep-super-fire-ayj2jnyh.c-5.us-east-2.aws.neon.tech`
- **Tabela**: `public.wedding_photos`
- **Contagem de Registos**: `147`
- **metadataPathCount**: `147`
- **r2PathCount**: `147`
- **exactSetEquality**: `true` (Correspondência canónica exacta de 1:1)

---

## 3. Inspecção do Contrato da Abstracção de Storage

O contrato central da aplicação encontra-se definido em `src/lib/edition/storage/storage-provider.types.ts`:

```typescript
export interface StorageProvider {
  readonly providerName: string;

  createSignedUploadUrl(
    bucket: string,
    storagePath: string,
    options: SignedUploadUrlOptions
  ): Promise<SignedUploadUrlResult>;

  createSignedUrl(
    bucket: string,
    storagePath: string,
    options?: SignedDownloadUrlOptions
  ): Promise<string>;

  download(
    bucket: string,
    storagePath: string
  ): Promise<StorageDownloadResult | null>;

  remove(
    bucket: string,
    storagePaths: string[]
  ): Promise<void>;

  getObjectInfo?(
    bucket: string,
    storagePath: string
  ): Promise<StorageObjectMetadata | null>;
}
```

### Implementações Analisadas:
1. **`SupabaseStorageProvider`** (`src/lib/edition/storage/supabase-storage-provider.ts`):
   - Encapsula o cliente Supabase Storage (`supabase.storage.from(bucket)`).
   - Valida previamente caminhos canónicos com `validateAndParseStoragePath`.
   - Mapeia ausência de objecto em `download()` para retorno seguro de `null`.
2. **`S3CompatibleStorageProvider`** (`src/lib/edition/storage/s3-compatible-storage-provider.ts`):
   - Opera via comandos estruturais S3 (`GetObjectCommand`, `PutObjectCommand`, `DeleteObjectsCommand`).
   - Converte o corpo de resposta via `body.transformToByteArray()` do Smithy stream.
   - Captura erros `NoSuchKey`, `404` e normaliza para retorno seguro de `null`.
   - Gera URLs privadas pré-assinadas via `presigner.getSignedUrl` sem exigir acesso público ao bucket.
3. **`FakeStorageProvider`** (`src/lib/edition/storage/fake-storage-provider.ts`):
   - Implementação determinística em memória para testes unitários.

---

## 4. Auditoria de Acoplamentos Directos ao Supabase Storage

Pesquisa exaustiva realizada em todo o código de produção (`src/`):

| Ponto de Consumo | Bucket | Padrão Utilizado | Classificação | Blocker de Cutover |
| :--- | :--- | :--- | :--- | :--- |
| `src/lib/edition/memories/gallery.service.ts` | `wedding-photos` | `StorageProvider.createSignedUrl()` | **ABSTRACTED** | Não |
| `src/lib/edition/memories/upload.service.ts` | `wedding-photos` | `StorageProvider.createSignedUploadUrl()` / `download()` / `remove()` | **ABSTRACTED** | Não |
| `src/lib/portal/services/portal-payment.service.ts` | `concierge-uploads` | `supabase.storage.from("concierge-uploads")` | **INTENTIONAL** (Módulo Concierge) | Não |
| `src/lib/concierge/services/process-upload.service.ts` | `portal-concierge` | `supabase.storage.from("portal-concierge")` | **INTENTIONAL** (Módulo Concierge) | Não |
| `src/lib/concierge/portal/create-concierge-storage-provider.ts` | `portal-concierge` | `ConciergeStorageProvider` | **INTENTIONAL** (Módulo Concierge) | Não |

**Conclusão**: Zero chamadas directas ao Supabase Storage no fluxo de fotografias de casamento (`wedding-photos`). O desacoplamento através de `StorageProvider` é total e estrito.

---

## 5. Matriz de Objectos Representativos e Paridade de Leitura

Amostra determinística seleccionada a partir do manifest congelado (9 objectos desduplicados):

| Papel / Categoria | Caminho Canónico (`storage_path`) | MIME Type | Tamanho (Bytes) | Paridade Supabase vs R2 |
| :--- | :--- | :--- | :--- | :--- |
| **Primeiro do Manifest** | `jessicaesamueltraditionalwedding/012a2a33-e775-44c3-b1f7-008a46945e0d/original.jpg` | `image/jpeg` | 2.778.251 | **MATCH (SHA idêntico)** |
| **Meio do Manifest** | `jessicaesamueltraditionalwedding/d9e52b29-59b1-4a5e-8bd5-0be0ce3d78aa/original.jpg` | `image/jpeg` | 96.637 | **MATCH (SHA idêntico)** |
| **Último do Manifest** | `jessicasamuelwedding/ff58a8fb-4bfa-427c-964e-947293157018/original.jpg` | `image/jpeg` | 1.790.353 | **MATCH (SHA idêntico)** |
| **Pequeno JPEG / Menor Objecto** | `jessicaesamueltraditionalwedding/0ec655a9-85e7-4d13-93d2-9d422fe06d4d/original.jpg` | `image/jpeg` | 90.758 | **MATCH (SHA idêntico)** |
| **Grande JPEG** | `jessicaesamueltraditionalwedding/f2cf8223-bd0e-409d-bfc2-9e2d02662584/original.jpg` | `image/jpeg` | 10.293.982 | **MATCH (SHA idêntico)** |
| **HEIC** | `jessicaesamueltraditionalwedding/a610f41a-a81b-4521-a481-b893c52cc2d3/original.heic` | `image/heic` | 815.617 | **MATCH (SHA idêntico)** |
| **MP4** | `jessicaesamueltraditionalwedding/d05bf42d-a1d3-49f1-8e85-2733b2bb72a7/original.mp4` | `video/mp4` | 3.981.714 | **MATCH (SHA idêntico)** |
| **MOV** | `jessicasamuelwedding/2160cb79-30dc-4122-8406-551f085dd27e/original.mov` | `video/quicktime` | 1.643.501 | **MATCH (SHA idêntico)** |
| **Maior Objecto** | `jessicasamuelwedding/88161955-e5c4-4b08-b86e-910e4dddc112/original.mov` | `video/quicktime` | 52.273.233 | **MATCH (SHA idêntico)** |

**Resultado**: `SUPABASE_PROVIDER_R2_PROVIDER_PARITY = true` (9/9 equivalências binárias perfeitas).

---

## 6. Validação Provider-Level Integral dos 147 Objectos

Validação exaustiva executada através do método `S3CompatibleStorageProvider.download()` contra todos os 147 objectos migrados no bucket Cloudflare R2:

- **providerReadCount**: `147 / 147`
- **providerShaMatchCount**: `147 / 147`
- **providerSizeMatchCount**: `147 / 147`
- **providerMimeMatchCount**: `147 / 147`
- **providerFailureCount**: `0`

---

## 7. Semântica de Objectos Ausentes e Caminhos Inválidos

### 7.1 Semântica de Objecto Ausente
- Chave sintética canónica inexistente: `jessicaesamueltraditionalwedding/00000000-0000-4000-8000-000000000000/original.jpg`.
- `SupabaseStorageProvider.download()`: devolveu `null`.
- `S3CompatibleStorageProvider.download()`: devolveu `null`.
- **Compatibilidade**: `PASS` (Comportamento observável idêntico, sem excepções não tratadas).

### 7.2 Validação de Caminhos Canónicos e Segurança
Caminhos malformados testados contra ambos os providers:
- Chave vazia (`""`)
- Path traversal (`../traversal/original.jpg`)
- Barras no início (`/root/leading/original.jpg`)
- Barras duplas (`jessicaesamueltraditionalwedding//double/original.jpg`)
- Slug ou UUID inválido (`invalid-slug/not-uuid/original.jpg`)
- Nome de ficheiro forjado (`jessicaesamueltraditionalwedding/0ec655a9-85e7-4d13-93d2-9d422fe06d4d/malicious.exe`)
- **Resultado**: Bloqueio prévio imediato por `validateAndParseStoragePath` com lançamento estrito de `StorageSecurityError`.

---

## 8. Semântica de URLs e Acesso Privado

- **Visibilidade do Bucket R2**: Estritamente Privado.
- **Acesso Público Directo / r2.dev**: **DESACTIVADO** (Conforme exigido pelo Gate 3F-D).
- **Semântica de Acesso**: URLs temporárias pré-assinadas com assinatura criptográfica AWS Signature Version 4 (`X-Amz-Signature`) e expiração controlada (`X-Amz-Expires`).
- **Validação de Acesso**: Teste HTTP GET executado contra URL gerada pelo provider (`status: 200`, `Content-Type: image/jpeg`, tamanho de payload íntegro).
- **Assunções de CDN / Next.js**: Não existem directivas `remotePatterns` restritivas em `next.config.ts`, pois as imagens e vídeos são servidos em elementos HTML5 convencionais com URLs directas assinadas.

---

## 9. Suporte a Range e Streaming

- O contrato da interface `StorageProvider` (`storage-provider.types.ts`) expõe `download()` (retorno de binário `Uint8Array`), `createSignedUrl()` e `createSignedUploadUrl()`.
- **Classificação**: `NOT_PART_OF_STORAGE_PROVIDER_CONTRACT`.
- Não foram adicionadas extensões artificiais à interface, mantendo a fidelidade do contrato em produção.

---

## 10. Integração com o Edition Engine

O motor de edições consome `StorageProvider` através de dois serviços principais:
1. **`MemoriesGalleryService`**: Gera URLs privadas assinadas para fotos e vídeos aprovados.
2. **`MemoriesUploadService`**: Gere intenções de upload pré-assinadas, descarrega ficheiros para validação de magic bytes e purga ficheiros violadores.

**Resultados dos Testes de Integração**:
- Executados com sucesso com `SupabaseStorageProvider` e separadamente com `S3CompatibleStorageProvider`.
- Ambos preservam exactamente as mesmas regras de negócio e validação.

---

## 11. Análise de Escritas Futuras e Divergência de Dados

Antes de autorizar qualquer cutover futuro, o modelo de propriedade de escrita pós-cutover foi documentado:
- **Modelo Pós-Cutover**: `R2-Only Authoritative`.
- Quando `STORAGE_PROVIDER=r2-s3` for activado, novos uploads serão gravados exclusivamente no Cloudflare R2.
- **Ponto de Não-Retorno para Rollback Simples**: Enquanto não existirem novos uploads no R2, um eventual rollback para o Supabase é imediato e com zero risco de divergência (já que o Supabase contém a totalidade dos 147 ficheiros históricos). A partir do momento em que utilizadores em produção enviarem novas fotografias após o cutover, o bucket Supabase deixará de conter esses novos objectos, exigindo um protocolo de sincronização reversa em caso de rollback tardio.

---

## 12. Localização e Descoberta da Configuração de Cutover

O switch técnico exato para alteração de provider em tempo de execução:
- **Ficheiro Central**: `src/lib/edition/storage/storage-composition.ts`
- **Ponto de Injeção**: Função `resolveStorageProvider()`
- **Variável de Ambiente de Selecção**: `STORAGE_PROVIDER` (Valores aceites: `supabase` [activo por defeito], `r2-s3`, `fake`).
- **Credenciais Operacionais Necessárias para R2**:
  - `CLOUDFLARE_R2_ACCESS_KEY_ID`
  - `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
  - `CLOUDFLARE_R2_ENDPOINT`
  - `CLOUDFLARE_R2_BUCKET_NAME` (`haxr-wedding-photos`)
- **Estado Actual**: Mantido rigorosamente em `supabase` (ACTIVE).

---

## 13. Matriz de Cutover Readiness

| Categoria | Estado | Evidência / Métrica | Blocker de Cutover |
| :--- | :--- | :--- | :--- |
| **Paridade Física de Objectos** | `PASS` | 147/147 objectos físicos existentes no R2 (535.493.700 bytes) | Não |
| **Paridade Criptográfica** | `PASS` | 147/147 hashes SHA-256 idênticos ao manifest congelado | Não |
| **Paridade de Leitura do Provider** | `PASS` | 9/9 objectos da matriz representativa idênticos em bytes, MIME e SHA | Não |
| **Validação Provider-Level Integral** | `PASS` | 147/147 leituras bem-sucedidas via `S3CompatibleStorageProvider.download()` | Não |
| **Semântica de Objecto Ausente** | `PASS` | Ambos retornam `null` para chaves inexistentes | Não |
| **Validação de Caminhos Canónicos** | `PASS` | Bloqueio estrito de traversal, caminhos malformados e chaves vazias | Não |
| **Preservação de MIME Types** | `PASS` | JPEG, HEIC, MP4 e QuickTime MOV preservados com exactidão | Não |
| **Semântica de URLs e Assinatura** | `PASS` | Bucket 100% privado com URLs pré-assinadas válidas (HTTP 200) | Não |
| **Integração Edition Engine** | `PASS` | Galeria e Upload funcionam sem alterações de contrato | Não |
| **Ligação de Metadados Neon / R2** | `PASS` | 147 registos na BD Neon correspondem 1:1 ao conjunto de caminhos do R2 | Não |
| **Acoplamento Directo a Supabase** | `PASS` | Zero chamadas directas ao Supabase Storage no fluxo de fotografias | Não |
| **Segurança e Isolamento de Segredos**| `PASS` | Zero segredos expostos, `.env.r2.local` ignorado pelo Git | Não |
| **Regressão Global de Testes** | `PASS` | 947/947 testes globais aprovados, 0 erros de compilação ou lint | Não |
| **Recomendação de Cutover** | `READY`| Sistema tecnicamente apto para cutover futuro controlado | Não |

---

## 14. Estado Final do Cloudflare R2 e da Aplicação

- **Objectos Físicos Finais no R2**: `147`
- **Total de Bytes Final no R2**: `535493700`
- **Mutações durante o Gate 3F-D**: `0` (Zero PutObject, Zero CopyObject, Zero DeleteObject)
- **SupabaseStorageProvider**: `ACTIVE` (Produção inalterada)
- **S3CompatibleStorageProvider**: `NOT ACTIVE`
- **dualRead**: `INACTIVE`
- **storageCutoverReady**: `false`

---

## 15. Recomendação sobre Credenciais de Migração

- `MIGRATION_PARENT_IDENTITY` e credenciais com capacidade de escrita não foram utilizadas no Gate 3F-D.
- Recomenda-se a revogação definitiva das credenciais de escrita do operador assim que o Gate 3F-D for homologado e antes da autorização formal do cutover.

---

## 16. Parecer Final do Gate 3F-D

- **ESTADO DO GATE 3F-D**: **PASS — CLOSED**
- **storageCutoverReady**: `false`
- **CUTOVER_READINESS_RECOMMENDATION**: **READY**
- **PRÓXIMA ETAPA**: **Cutover — NOT AUTHORIZED** (Aguardando decisão explícita do operador humano).
