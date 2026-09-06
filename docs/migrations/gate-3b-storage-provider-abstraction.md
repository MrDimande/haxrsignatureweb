# Gate 3B — Storage Provider Abstraction & Security Architecture

**Documento:** `docs/migrations/gate-3b-storage-provider-abstraction.md`  
**Data de Emissão:** 2026-09-02  
**Status:** Concluído e Validado (Gate 3B — Em Memória / Zero Side-Effects)  
**Módulo:** `src/lib/edition/storage/`  
**Escopo:** HAXR Edition Engine & HAXR Core  
**Regra Fundamental:** Zero escrita em produção, zero chamadas de rede externas, zero cópia de ficheiros, estrita preservação do contrato canónico.

---

## 1. Contexto e Objetivo do Gate 3B

O Gate 3B implementa e valida uma camada de abstração de Object Storage (`StorageProvider`) agnóstica de fornecedor. O objetivo é permitir que o consumidor operacional das fotografias de casamento (**HAXR Edition Engine**) possa futuramente substituir o Supabase Storage por um provedor compatível com S3 (como **Cloudflare R2**) sem alterar a lógica de negócio dos eventos.

### Contrato Canónico Preservado Incondicionalmente:
```text
{invitation_slug}/{photo_id_uuid}/original.{ext}
```

---

## 2. A Interface Agnóstica `StorageProvider`

A interface foi concebida sem nenhuma dependência de bibliotecas concretas de fornecedores (`@supabase/supabase-js`, `@aws-sdk`, Cloudflare SDK, etc.):

```typescript
export interface StorageProvider {
  readonly providerName: string;

  /** 1. Cria URL pré-assinada temporária para upload do cliente */
  createSignedUploadUrl(
    bucket: string,
    storagePath: string,
    options: SignedUploadUrlOptions
  ): Promise<SignedUploadUrlResult>;

  /** 2. Cria URL pré-assinada temporária para leitura/galeria */
  createSignedUrl(
    bucket: string,
    storagePath: string,
    options?: SignedDownloadUrlOptions
  ): Promise<string>;

  /** 3. Descarrega o objeto binário para o servidor (inspeção de magic bytes) */
  download(
    bucket: string,
    storagePath: string
  ): Promise<StorageDownloadResult | null>;

  /** 4. Remove de forma atómica e idempotente um ou mais objetos */
  remove(
    bucket: string,
    storagePaths: string[]
  ): Promise<void>;

  /** 5. Metadados do objeto sem carregar o corpo binário */
  getObjectInfo?(
    bucket: string,
    storagePath: string
  ): Promise<StorageObjectMetadata | null>;
}
```

---

## 3. Adapters Implementados

### 3.1 `FakeStorageProvider` (Em Memória / Testes)
- **Ficheiro:** `src/lib/edition/storage/fake-storage-provider.ts`
- **Papel:** Simula 100% o comportamento de um Object Storage em memória, com geração determinística de URLs assinadas, suporte a `download` de buffers, `remove` idempotente e inspeção de metadados.
- **Segurança:** Executa a mesma validação canónica rigorosa de caminhos e TTLs antes de qualquer manipulação de estado.

### 3.2 `SupabaseStorageProvider` (Adapter Atual Provisório)
- **Ficheiro:** `src/lib/edition/storage/supabase-storage-provider.ts`
- **Papel:** Encapsula o cliente Supabase Storage existente através de injeção de dependência estrutural (`SupabaseStorageClientLike`).
- **Mapeamento das 4 Primitivas:**
  - `createSignedUploadUrl` → `client.storage.from(bucket).createSignedUploadUrl(path)`
  - `createSignedUrl` → `client.storage.from(bucket).createSignedUrl(path, ttl)`
  - `download` → `client.storage.from(bucket).download(path)` (converte `Blob` para `Uint8Array`)
  - `remove` → `client.storage.from(bucket).remove(paths)`
- **Garantia de Regressão:** Preserva o comportamento exato em produção do Supabase Storage.

### 3.3 `S3CompatibleStorageProvider` (Adapter Alvo R2 / S3)
- **Ficheiro:** `src/lib/edition/storage/s3-compatible-storage-provider.ts`
- **Papel:** Modela a compatibilidade com a API AWS S3 / Cloudflare R2 utilizando contratos desacoplados (`S3ClientLike`, `S3PresignerLike`).
- **Mapeamento das 4 Primitivas:**
  - `createSignedUploadUrl` → `getSignedUrl(s3, PutObjectCommand)`
  - `createSignedUrl` → `getSignedUrl(s3, GetObjectCommand)`
  - `download` → `s3.send(GetObjectCommand)` (suporta `.transformToByteArray()` e streams)
  - `remove` → `s3.send(DeleteObjectsCommand)` com `{ Quiet: true }`
- **Segurança:** Zero chamadas remotas, zero dependências externas ou credenciais embutidas.

---

## 4. Camada de Segurança e Validação de Paths (`canonical-path.ts`)

A validação de segurança é executada **antes** de qualquer comando ser repassado ao provedor concreto:

1. **Anti-Path Traversal:** Rejeita imediatamente `..`, `\`, caminhos absolutos (`/path`), barras no fim (`path/`) e caracteres de controlo (bytes nulos).
2. **Estrutura de 3 Segmentos:** Exige estritamente `[slug, photoId, fileName]`.
3. **Validação do Slug:** Apenas minúsculas alfanuméricas e hífens (`^[a-z0-9-]+$`).
4. **Isolamento de Convites (Cross-Invitation Isolation):** Se um `expectedSlug` for fornecido, qualquer path que referencie outro evento é bloqueado na raiz.
5. **Validação de UUID v4:** O ID da fotografia deve ser um UUID v4 canónico (`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`).
6. **Nome e Extensão Canónica:** O ficheiro deve iniciar por `original.` e possuir uma das extensões permitidas (`jpg, jpeg, png, webp, heic, heif, mp4, mov, webm`).
7. **Verificação de MIME Type Declarado:** Rejeita adulterações onde a extensão não corresponda ao MIME type declarado no upload (ex.: `original.jpg` declarado como `application/pdf` ou `video/mp4`).
8. **Limites Rígidos de TTL:**
   - Upload: mínimo 60s, máximo 3600s (1h), padrão 600s (10 min).
   - Download: mínimo 60s, máximo 86400s (24h), padrão 3600s (1h).

---

## 5. Resultados dos Testes Automatizados

A suite determinística em memória foi executada via Node.js Test Runner:
- **Comando:** `node --import tsx --test src/lib/edition/storage/storage-provider.test.ts`
- **Resultado:** **27 testes executados, 27 aprovados (0 falhas, 0 skips, 0 cancelados).**

| Domínio de Teste | Testes Executados | Resultado |
|---|:---:|:---:|
| **Upload Operations** | 4 | PASS |
| **Download Operations (Signed URLs)** | 3 | PASS |
| **Server-Side Download (Buffer Inspection)** | 3 | PASS |
| **Remove Operations (Idempotência e Isolamento)** | 2 | PASS |
| **Security & Path Boundaries** | 12 | PASS |
| **Adapters Compatibility (Supabase & S3/R2)** | 2 | PASS |
| **Business Logic Agnosticism (Workflow Simulation)** | 1 | PASS |

---

## 6. O que Ainda Depende do Supabase vs. O que Será Necessário para R2

### O que ainda depende do Supabase (Estado Atual):
- Os **147 ficheiros físicos** (510.69 MB) permanecem armazenados no bucket privado `wedding-photos` do Supabase Production.
- As chamadas ativas em runtime nos casamentos utilizam o cliente Supabase Storage.
- O indicador `storageCutoverReady` permanece `false`.

### O que será necessário para ativar Cloudflare R2 (Gate Futuro):
1. Provisionamento de bucket privado R2 (ex: `haxr-wedding-photos-prod`).
2. Configuração de CORS para `edition.haxrsignature.com` e `www.haxrsignature.com`.
3. Bindings de variáveis de ambiente seguras (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`).
4. Script de reconciliação e cópia física com cálculo de SHA-256 objeto a objeto.

---

## 7. Critérios de Entrada para o Gate 3C (Reconciliação e Validação Integrada)

Para avançar com segurança para o próximo estágio (Gate 3C):
- [x] Interface agnóstica `StorageProvider` modelada e testada.
- [x] Validações de segurança e isolamento de caminhos aprovadas com 100% de cobertura.
- [x] Adapters `SupabaseStorageProvider` e `S3CompatibleStorageProvider` estruturados sem vazamento de abstração.
- [ ] Conectar os módulos do Edition Engine (`upload.ts`, `gallery.ts`, `moderate/route.ts`) à abstração `StorageProvider` mantendo o Supabase como backend ativo.
- [ ] Validação dos testes E2E do Edition Engine operando através da nova abstração sem quebra funcional.

---
*Fim da documentação do Gate 3B. Nenhuma alteração de infraestrutura foi efetuada.*
