# Gate 3C — Storage Provider Integration & Dual-Provider Binding Architecture

**Documento:** `docs/migrations/gate-3c-storage-provider-integration.md`  
**Data de Emissão:** 2026-09-03  
**Status:** Concluído e Validado (Gate 3C — Dual-Provider Binding / Zero Side-Effects)  
**Módulos:** `src/lib/edition/storage/` & `src/lib/edition/memories/`  
**Escopo:** HAXR Edition Engine & HAXR Core  
**Regra Fundamental:** Zero escrita em produção, zero cópia de ficheiros físicos, zero chamadas de rede externas, estrita preservação do contrato canónico e das regras de negócio.

---

## 1. Contexto e Objetivo do Gate 3C

O Gate 3C integra a abstração `StorageProvider` (desenvolvida no Gate 3B) nos serviços operacionais reais de memórias e fotografias de casamentos (**HAXR Edition Engine**).

### Princípios Arquiteturais Invioláveis:
1. **Desacoplamento Total:** A lógica de negócio (`upload.service.ts`, `gallery.service.ts`, `moderate.service.ts`) depende **exclusivamente da interface `StorageProvider`**. Ela desconhece completamente o SDK do Supabase, o AWS SDK, o Cloudflare R2 ou detalhes de rede/credenciais.
2. **Ponto Único de Composição (Composition Root):** O binding do provedor concreto acontece exclusivamente em `src/lib/edition/storage/storage-composition.ts`. É proibido espalhar `new SupabaseStorageProvider()` ou `new S3CompatibleStorageProvider()` pela aplicação.
3. **Provider Ativo vs. Futuro:**
   - **Provider Ativo em Runtime:** `SupabaseStorageProvider` (preserva 100% o comportamento atual em produção com o bucket privado `wedding-photos`).
   - **Provider Futuro (Modelado e Testado):** `S3CompatibleStorageProvider` (preparado para Cloudflare R2 sem chamadas de rede).

---

## 2. Ponto Central de Composição (Composition Root)

O ficheiro [`src/lib/edition/storage/storage-composition.ts`](file:///c:/project-x/haxrsignature/src/lib/edition/storage/storage-composition.ts) atua como a raiz de composição:

```typescript
export function resolveStorageProvider(config?: StorageCompositionConfig): StorageProvider {
  // 1. Seam de testes determinísticos em memória
  if (activeTestProvider) {
    return activeTestProvider;
  }

  // 2. Resolução através de STORAGE_PROVIDER ('supabase' | 'fake' | 'r2-s3')
  const envProvider = (
    process.env.STORAGE_PROVIDER ||
    config?.providerType ||
    "supabase"
  ).toLowerCase();

  switch (envProvider) {
    case "fake":
      return new FakeStorageProvider();

    case "supabase":
      if (config?.supabaseClient) {
        return new SupabaseStorageProvider(config.supabaseClient);
      }
      if (defaultProviderInstance) {
        return defaultProviderInstance;
      }
      throw new StorageSecurityError("supabase_client_not_configured_in_composition_root");

    case "r2-s3":
      if (!config?.s3Client || !config?.s3Presigner) {
        throw new StorageSecurityError("r2_s3_storage_provider_requires_s3_client_and_presigner");
      }
      return new S3CompatibleStorageProvider(config.s3Client, config.s3Presigner, {
        bucketName: config.bucketName,
      });

    default:
      throw new StorageSecurityError(`unsupported_storage_provider_type:${envProvider}`);
  }
}
```

---

## 3. Mapeamento de Módulos e Fluxo Antes vs. Depois

### 3.1 Upload de Memórias (`upload.service.ts`)
| Etapa do Fluxo | Antes (Supabase Acoplado) | Depois (Com `StorageProvider`) |
|---|---|---|
| **1. Intenção de Upload** | `supabase.storage.from(bucket).createSignedUploadUrl(path)` | `storageProvider.createSignedUploadUrl(bucket, path, options)` |
| **2. Envio pelo Cliente** | Cliente envia binário diretamente para URL assinada | Inalterado (cliente usa URL assinada sem saber o backend) |
| **3. Download para Inspeção** | `supabase.storage.from(bucket).download(path)` | `storageProvider.download(bucket, path)` |
| **4. Validação de Tamanho e Magic Bytes** | `matchesMagicBytes(buffer, type)` no servidor | Inalterado (`config.ts`) |
| **5. Purga em caso de Falha** | `supabase.storage.from(bucket).remove([path])` | `storageProvider.remove(bucket, [path])` |
| **6. Persistência de Metadados** | `supabase.from("wedding_photos").insert(...)` | `repository.insert(...)` com status `pending` |

### 3.2 Galeria Pública de Memórias (`gallery.service.ts`)
| Etapa do Fluxo | Antes (Supabase Acoplado) | Depois (Com `StorageProvider`) |
|---|---|---|
| **1. Leitura de Metadados** | `supabase.from("wedding_photos").select(...)` | `repository.listPublic(slug)` (filtra rejeitados) |
| **2. Emissão de URLs Assinadas** | `supabase.storage.from(bucket).createSignedUrl(path, ttl)` | `storageProvider.createSignedUrl(bucket, path, { expiresInSeconds: ttl })` |
| **3. Preservação de TTL** | 3600 segundos (1 hora) | 3600 segundos (1 hora) estritamente preservado |

### 3.3 Moderação (`moderate.service.ts`)
| Etapa do Fluxo | Antes | Depois |
|---|---|---|
| **1. Validação de Segredo** | `ADMIN_MODERATION_SECRET` | Inalterado (validação estrita) |
| **2. Transição de Status** | `update wedding_photos set moderation_status = ...` | `repository.updateModerationStatus(photoId, slug, status)` |
| **3. Isolamento Multi-Evento** | `.eq("invitation_slug", slug)` | Inalterado (bloqueio atómico de cross-invitation) |

---

## 4. Inventário Completo de Chamadas Diretas ao Supabase Storage

A pesquisa exaustiva por referências diretas a `.storage` no ecossistema revelou o seguinte inventário:

| Localização do Ficheiro | Tipo de Chamada | Justificação Arquitetural |
|---|---|---|
| `src/lib/edition/storage/supabase-storage-provider.ts` | `client.storage.from(...)` | **Legítimo:** Esta é a única camada de adaptação autorizada a comunicar diretamente com o Supabase Storage. |
| `src/lib/edition/memories/upload.service.ts` | **ZERO chamadas diretas** | Totalmente migrado para `StorageProvider`. |
| `src/lib/edition/memories/gallery.service.ts` | **ZERO chamadas diretas** | Totalmente migrado para `StorageProvider`. |
| `src/lib/edition/memories/moderate.service.ts` | **ZERO chamadas diretas** | Opera exclusivamente sobre o repositório de metadados. |
| `wt-edition-main/lib/memories/upload.ts` (Legado) | `signedUploadUrlImpl` / `download` | Mantido como baseline provisório até sincronização do package. |
| `wt-edition-main/lib/memories/gallery.ts` (Legado) | `createSignedUrl` | Mantido como baseline provisório até sincronização do package. |

---

## 5. Resultados dos Testes de Integração (Gate 3C)

- **Comando:** `node --import tsx --test src/lib/edition/memories/memories-integration.test.ts`
- **Resultado:** **15 testes executados, 15 aprovados (0 falhas, 0 skips, 0 cancelados).**

### Matriz de Testes Aprovados:
1. **Upload Workflow:**
   - [x] Conclusão com sucesso do ciclo intent -> upload -> magic bytes -> DB insert.
   - [x] Purga imediata do storage e recusa de INSERT se magic bytes forem adulterados (ex.: `.exe` renomeado).
   - [x] Purga imediata se o ficheiro exceder o limite de tamanho declarado.
   - [x] Rejeição segura se o upload não foi concluído no storage (`UPLOAD_MISSING`).
2. **Gallery Workflow:**
   - [x] Consulta de memórias ativas com URLs assinadas válidas e TTL de 3600s.
   - [x] Ocultação obrigatória de fotografias com `moderation_status = 'rejected'`.
   - [x] Isolamento estrito de slug (retorna vazio se o slug não existir).
3. **Moderation Workflow:**
   - [x] Transições de status `approved` e `rejected` atómicas.
   - [x] Bloqueio estrito de moderação de fotos pertencentes a outro convite (`cross-invitation`).
   - [x] Validação de segredo de moderação administrativo (`ADMIN_MODERATION_SECRET`).
4. **Provider Substitution (Substituição de Provedor):**
   - [x] Execução exata do fluxo completo sobre `FakeStorageProvider`.
   - [x] Execução exata do fluxo completo sobre `SupabaseStorageProvider` (mock).
   - [x] Execução exata do fluxo completo sobre `S3CompatibleStorageProvider` (mock em memória sem rede).
5. **Composition Root Security:**
   - [x] Resolução de seam de testes determinístico em memória.
   - [x] Falha fechada imediata se `STORAGE_PROVIDER=supabase` for chamado sem cliente configurado.
   - [x] Falha fechada imediata se `STORAGE_PROVIDER=r2-s3` for chamado sem s3Client ou presigner.
   - [x] Falha fechada para tipos de provider desconhecidos.

---

## 6. Cobertura Geral do Ecossistema e Regressão

| Suite de Testes | Testes | Status |
|---|:---:|:---:|
| `storage-provider.test.ts` (Gate 3B) | 27 | PASS |
| `memories-integration.test.ts` (Gate 3C) | 15 | PASS |
| **Total de Testes Específicos de Storage e Memórias** | **42** | **PASS (100%)** |
| TypeScript Compiler (`tsc --noEmit`) | - | **0 erros** |
| ESLint (`src/lib/edition/`) | - | **0 erros / 0 avisos** |

---

## 7. Critérios de Entrada para o Gate 3D (Dry-Run de Reconciliação & Sincronização)

Para avançar com segurança para o Gate 3D:
- [x] Interface `StorageProvider` integrada nos serviços de Memórias (`upload`, `gallery`, `moderate`).
- [x] Ponto de composição único (`storage-composition.ts`) implementado e testado.
- [x] Comprovada a independência de provedores com `FakeStorageProvider`, `SupabaseStorageProvider` e `S3CompatibleStorageProvider`.
- [x] Zero chamadas diretas ao Supabase Storage espalhadas pela lógica de negócio.
- [ ] Executar script de auditoria e reconciliação checksum-a-checksum (dry-run sem cópia física de binários).
- [ ] Validar compatibilidade de headers HTTP entre cliente e presigned PUT para o provedor S3/R2.

---
*Fim da documentação oficial do Gate 3C. Nenhuma alteração de infraestrutura foi efetuada.*
