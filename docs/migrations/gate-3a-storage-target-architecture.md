# Gate 3A — Object Storage Target Architecture & Edition Engine Integration Plan

**Documento:** `docs/migrations/gate-3a-storage-target-architecture.md`  
**Data de Emissão:** 2026-09-02  
**Status:** Proposta de Arquitetura (Gate 3A — Read-Only / Não-Executado)  
**Escopo:** HAXR Edition Engine (`wt-edition-main`) & HAXR Core (`haxrsignatureweb`)  
**Regra Fundamental:** Zero escrita, zero cópia de ficheiros, zero alteração de produção ou infraestrutura.

---

## 1. Contexto e Estado Atual Verificado

### 1.1 Inventário e Checkpoint Canónico
* **Base de Dados:** Tabela `wedding_photos` auditada com **147 registos** no Supabase Production (`oxsrdmydlqyvnueedgtl`) e espelhada no Neon Preview (`ep-super-fire-ayj2jnyh`, commit `65a6750`).
* **Checksum dos Metadados:** `36b8f471d851f7244a47f2b3070b03465d5415a1f7d42109f3fb7764054ecfd0` (17 colunas canónicas).
* **Storage Físico Atual:** Bucket privado `wedding-photos` no Supabase Storage.
* **Volume Auditado:** **147 objetos físicos** (510.69 MB total), correspondência 1:1 exata com os registos de metadados, zero referências órfãs ou quebradas.
* **Estado de Transição:** `storageCutoverReady = false`. Nenhum blob foi copiado e nenhum serviço remoto foi reconfigurado.

### 1.2 Separação de Responsabilidades no Ecossistema
A inspeção técnica dos repositórios confirmou a divisão de responsabilidades:
1. **HAXR Core (`haxrsignatureweb`):**
   * Apresenta exclusivamente a vitrine editorial e comercial em `/plus-memories`.
   * Não possui rotas de ingestão, visualização ou moderação de fotografias de casamentos em runtime.
2. **HAXR Edition Engine (`wt-edition-main`):**
   * É o **produtor e consumidor operacional exclusivo** dos ficheiros e metadados de `wedding_photos`.
   * Gere o ciclo de vida: intenção de upload, verificação de magic bytes, persistência, galeria e moderação.

---

## 2. Contrato Atual de Storage (HAXR Edition Engine)

Inspecionado nos ficheiros [`lib/memories/upload.ts`](file:///C:/project-x/wt-edition-main/lib/memories/upload.ts), [`lib/memories/gallery.ts`](file:///C:/project-x/wt-edition-main/lib/memories/gallery.ts), [`app/api/memories/moderate/route.ts`](file:///C:/project-x/wt-edition-main/app/api/memories/moderate/route.ts) e [`lib/memories/config.ts`](file:///C:/project-x/wt-edition-main/lib/memories/config.ts):

| Parâmetro | Valor Canónico Atual | Implementação Atual |
|---|---|---|
| **Bucket** | `wedding-photos` | Privado (`public: false`), limite de 100 MB por ficheiro |
| **Padrão de Path** | `{invitation_slug}/{photo_id_uuid}/original.{ext}` | Gerado por `buildStoragePath(photoId, contentType, slug)` |
| **TTL Intenção Upload** | `600 segundos` (10 minutos) | Controlado em `upload-intent-store` e presigned upload |
| **TTL Visualização Galeria** | `3600 segundos` (1 hora) | `signedUrlTtlSeconds` em `config.ts` |
| **Limites de Tamanho** | Imagem: **25 MB**; Vídeo: **100 MB** | Validado no cliente e revalidado no backend por `validateFileSize` |
| **MIME Types Permitidos** | Imagens: `jpeg, png, webp, heic, heif`<br>Vídeos: `mp4, quicktime, webm` | `acceptedImageMimeTypes` e `acceptedVideoMimeTypes` |
| **Inspeção Antifraude** | Validação binária de **Magic Bytes** | `matchesMagicBytes(buffer, contentType)` server-side antes do commit |
| **Moderação** | Status inicial `pending` | Endpoint `/api/memories/moderate` atualiza para `approved` ou `rejected` |

### Ciclo Operacional Atual em 2 Fases (Two-Phase Ingestion)
```
[Convidado / Cliente]                 [HAXR Edition API]                [Supabase Storage]          [PostgreSQL]
        │                                     │                                  │                        │
        │── 1. POST uploadIntent (metadados)─►│                                  │                        │
        │                                     │── 2. createSignedUploadUrl()────►│                        │
        │◄── 3. uploadUrl + storagePath ──────│                                  │                        │
        │                                     │                                  │                        │
        │── 4. PUT binary (direto ao bucket)────────────────────────────────────►│                        │
        │                                     │                                  │                        │
        │── 5. POST completeUpload ──────────►│                                  │                        │
        │                                     │── 6. download() (inspeção)──────►│                        │
        │                                     │   [Verifica Magic Bytes & Size]  │                        │
        │                                     │   (Se falhar: remove() e aborta) │                        │
        │                                     │                                  │                        │
        │                                     │── 7. INSERT wedding_photos ──────────────────────────────►│
        │◄── 8. 200 OK (pending moderation) ──│                                                           │
```

---

## 3. Avaliação de Provedores de Destino para Object Storage

Como o **Neon é uma base de dados PostgreSQL serverless e não inclui Object Storage embutido**, avaliamos três alternativas para o destino dos ficheiros:

| Critério | Opção 1: Cloudflare R2 (Recomendada) | Opção 2: AWS S3 | Opção 3: Supabase Storage (Retenção Desacoplada) |
|---|---|---|---|
| **Compatibilidade API** | S3 API Standard (`@aws-sdk/client-s3`) | S3 API Nativa (`@aws-sdk/client-s3`) | Proprietária (`@supabase/storage-js`) |
| **Custos de Egress (Tráfego de Saída)** | **$0.00 / GB (Sem taxas de egress)** 🏆 | $0.09 / GB (custo relevante para vídeos de 50 MB) | Incluído na quota base do projeto Supabase |
| **Privacidade e Bloqueio Público** | Privado por omissão; Presigned URLs nativas | Privado por omissão via Block Public Access | Bucket configurável como privado via dashboard/API |
| **Pre-signed URLs (PUT e GET)** | Suporte completo via `@aws-sdk/s3-request-presigner` | Suporte completo via `@aws-sdk/s3-request-presigner` | Suporte via `createSignedUploadUrl` e `createSignedUrl` |
| **Desacoplamento do Supabase** | **Total** (independente de fornecedor de BD) | **Total** | **Nulo** (mantém dependência ativa do Supabase) |
| **Risco Operacional no Curto Prazo** | Médio (requer provisionamento e sincronização) | Médio | **Mínimo** (já está em produção e verificado) |

### Recomendação Técnica do Arquiteto:
1. **Destino Estrutural Final (Longo Prazo): Cloudflare R2.**  
   *Justificativa:* Ausência total de custos de egress para galerias e reprodução de vídeos pesados de casamentos (`.mov` e `.mp4`), alta performance em edge, conformidade S3 e controle rigoroso de presigned URLs.
2. **Estratégia de Transição Recomendada (Fase Atual): Retenção Desacoplada (Decoupled Mode).**  
   *Justificativa:* O Neon assume 100% da computação relacional (PostgreSQL e Auth), enquanto os 147 blobs permanecem provisoriamente no bucket privado do Supabase. Essa abordagem reduz o risco inicial a **zero**, permitindo certificar primeiro a base de dados antes de migrar os binários.

---

## 4. Contrato da Interface `StorageProvider`

Para eliminar o acoplamento direto com o SDK de qualquer fornecedor, propomos a seguinte interface TypeScript pura para o HAXR Edition Engine (e reutilizável no Core):

```typescript
/**
 * Contrato agnóstico de Object Storage para o ecossistema HAXR.
 * Compatível com Supabase Storage, Cloudflare R2, AWS S3 e MinIO.
 */

export interface StorageObjectMetadata {
  storagePath: string;
  sizeBytes: number;
  contentType: string;
  eTag?: string;
  lastModified?: Date;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  storagePath: string;
  expiresInSeconds: number;
}

export interface StorageProvider {
  readonly providerName: "supabase" | "r2" | "s3" | "memory";

  /**
   * 1. Gera URL pré-assinada para o cliente enviar o ficheiro diretamente ao bucket.
   * Path canónico obrigatório: {invitation_slug}/{photo_id_uuid}/original.{ext}
   */
  createSignedUploadUrl(
    bucket: string,
    storagePath: string,
    contentType: string,
    expiresInSeconds?: number
  ): Promise<PresignedUploadResult>;

  /**
   * 2. Gera URL pré-assinada para download/visualização temporária na galeria.
   * O bucket permanece 100% privado.
   */
  createSignedUrl(
    bucket: string,
    storagePath: string,
    expiresInSeconds?: number
  ): Promise<string>;

  /**
   * 3. Download do binário no servidor para inspeção de segurança (magic bytes e tamanho).
   */
  download(
    bucket: string,
    storagePath: string
  ): Promise<Uint8Array>;

  /**
   * 4. Elimina objeto físico do bucket (em caso de falha de validação ou moderação).
   */
  remove(
    bucket: string,
    storagePaths: string[]
  ): Promise<void>;

  /**
   * 5. Obtém metadados do objeto (tamanho, MIME, ETag) sem descarregar o corpo.
   */
  getObjectInfo(
    bucket: string,
    storagePath: string
  ): Promise<StorageObjectMetadata | null>;
}
```

---

## 5. Mapeamento das 4 Primitivas Fundamentais

| Primitiva | Comportamento Atual (Supabase Storage) | Implementação Alvo (S3 / Cloudflare R2) | Tratamento de Incompatibilidade |
|---|---|---|---|
| **1. `createSignedUploadUrl`** | `supabase.storage.from(b).createSignedUploadUrl(path)` | `getSignedUrl(s3, new PutObjectCommand({ Bucket: b, Key: path, ContentType: type }), { expiresIn })` | No S3/R2, o cliente deve enviar o cabeçalho `Content-Type` idêntico ao assinado. O Edition Engine deve padronizar o envio deste header no cliente. |
| **2. `createSignedUrl`** | `supabase.storage.from(b).createSignedUrl(path, ttl)` | `getSignedUrl(s3, new GetObjectCommand({ Bucket: b, Key: path }), { expiresIn: ttl })` | Totalmente compatível. URLs geradas são seguras e expiram no tempo exato estipulado. |
| **3. `download` (Server-side)** | `supabase.storage.from(b).download(path)` (retorna `Blob`) | `const res = await s3.send(new GetObjectCommand({ Bucket: b, Key: path })); return res.Body.transformToByteArray();` | O SDK AWS v3 suporta `.transformToByteArray()` diretamente em Node.js / Vercel Serverless. |
| **4. `remove`** | `supabase.storage.from(b).remove([path])` | `s3.send(new DeleteObjectsCommand({ Bucket: b, Delete: { Objects: paths.map(Key => ({ Key })) } }))` | Totalmente compatível. Operação idempotente e em lote. |

---

## 6. Arquitetura de Segurança e Prevenção de Acesso Público

1. **Bucket 100% Privado:**
   * O bucket no Cloudflare R2 / AWS S3 não terá acesso público ativado (`Block Public Access = true`).
   * Desativação total de listagem anónima (`ListBucket` desautorizado para utilizadores não autenticados).
2. **CORS Restrito:**
   * Permitir apenas os domínios oficiais:
     * `https://edition.haxrsignature.com`
     * `https://www.haxrsignature.com`
     * Preview domains autorizados da Vercel (`*.vercel.app`).
   * Métodos autorizados: `GET, PUT, HEAD`.
3. **Validação TLS Estrita:**
   * Comunicação obrigatória via TLS 1.2+ ou TLS 1.3 com validação de certificados CA (proibição irrevogável de `rejectUnauthorized: false`).
4. **Princípio do Menor Privilégio (Least Privilege):**
   * Credenciais dedicadas via Token API / IAM Policy com escopo exclusivo para o bucket `haxr-wedding-photos`. Proibição de acesso administrativo global.

---

## 7. Estratégia de Migração Física dos Ficheiros (Quando Autorizada — Gate 3B/3C)

Quando a migração física for expressamente autorizada, a transferência obedecerá ao seguinte protocolo seguro:

```
[Supabase Storage Source]                                                 [Target Cloudflare R2]
         │                                                                          │
         │── 1. Listagem canónica dos 147 paths de wedding_photos ─────────────────►│
         │                                                                          │
         │── 2. Stream individual sem buffering em disco ──────────────────────────►│
         │      (Source.downloadStream -> Target.uploadStream)                      │
         │                                                                          │
         │── 3. Cálculo de SHA-256 On-the-Fly ─────────────────────────────────────►│
         │                                                                          │
         │── 4. Verificação de integridade pós-cópia:                               │
         │      - Byte length Source == Byte length Target                          │
         │      - MIME Source == MIME Target                                        │
         │      - SHA-256 Source == SHA-256 Target                                  │
```

---

## 8. Estratégia de Reconciliação e Rollback

1. **Dual-Read com Fallback (Segurança Máxima):**
   * Durante o período de validação, a classe `StorageProvider` pode operar em modo híbrido:
     1. Tenta ler o objeto no Provedor Alvo (R2).
     2. Se retornar `NotFound` (404), busca no Supabase Storage de origem.
2. **Rollback Imediato:**
   * Como os 147 objetos originais **não são apagados** do Supabase durante a migração, o rollback consiste simplesmente em alterar a variável de ambiente `STORAGE_PROVIDER=supabase`, restaurando instantaneamente o estado original sem qualquer perda de dados.

---

## 9. Matriz de Riscos e Mitigações

| Risco | Impacto | Mitigação Arquitetural |
|---|---|---|
| **Assinatura de Presigned URL inválida no upload** | Convidado não consegue enviar foto | Testar rigorosamente a correspondência do header `Content-Type` entre o cliente e o comando `PutObjectCommand`. |
| **Excesso de latência em download server-side** | Timeout na rota de finalização do upload | Streaming direto com timeout estrito de 15 segundos para validação de magic bytes. |
| **Vazamento de fotos confidenciais** | Violação de privacidade | Bloqueio público total ativado em nível de bucket; expiração de signed URLs em no máximo 1 hora. |
| **Falha de rede durante transferência de 510 MB** | Ficheiros corrompidos ou incompletos | Cada objeto transferido terá seu checksum SHA-256 verificado e registrado antes de ser dado como válido. |

---

## 10. Critérios Objetivos para Certificação (`storageCutoverReady = true`)

Para que o indicador `storageCutoverReady` passe de `false` para `true`, **todos** os seguintes requisitos devem ser comprovados documentalmente:

- [ ] **Critério 1:** Bucket alvo provisionado em modo estritamente privado, com CORS restrito aos domínios HAXR e sem credenciais de administração expostas.
- [ ] **Critério 2:** Implementação da interface `StorageProvider` com suporte a S3/R2 aprovada em suite de testes automatizados unitários e de integração.
- [ ] **Critério 3:** 147/147 objetos copiados para o bucket alvo mantendo rigorosamente o path `{invitation_slug}/{photo_id_uuid}/original.{ext}`.
- [ ] **Critério 4:** Reconciliação de 100% dos ficheiros com validação de byte count e SHA-256 idênticos entre origem e destino.
- [ ] **Critério 5:** Validação funcional no HAXR Edition Engine (`wt-edition-main`) de:
  - Geração de presigned upload URL;
  - Upload real de teste com validação de magic bytes;
  - Visualização de memórias na galeria via presigned download URL;
  - Moderação e purga de ficheiro rejeitado.
- [ ] **Critério 6:** Procedimento de rollback testado com sucesso em ambiente de staging/preview.

---

*Fim do documento técnico de arquitetura Gate 3A. Nenhuma alteração operacional foi executada.*
