# Gate 3E — Storage Synchronization Protocol & Protocol Hardening

**Documento Oficial:** `docs/migrations/gate-3e-storage-sync-protocol.md`  
**Data de Emissão:** 2026-09-03  
**Data de Revisão (Gate 3E.1):** 2026-09-03  
**Status:** Revisado, Endurecido e Homologado em Memória (Protocol Hardening & Final Review)  
**Módulos de Implementação:**  
- Engine: [`scripts/sync-storage-protocol.mjs`](file:///c:/project-x/haxrsignature/scripts/sync-storage-protocol.mjs)  
- Test Suite: [`scripts/sync-storage-protocol.test.mjs`](file:///c:/project-x/haxrsignature/scripts/sync-storage-protocol.test.mjs)  
- Abstração de Testes: [`src/lib/edition/storage/fake-storage-provider.ts`](file:///c:/project-x/haxrsignature/src/lib/edition/storage/fake-storage-provider.ts)  
**Regra Fundamental:** ZERO remote writes, ZERO chamadas a Cloudflare R2 real, ZERO cópia de blobs físicos reais, ZERO cutover e ZERO merge para `main`.

---

## 1. Registo de Controlo de Processo (`PROCESS_CONTROL_VIOLATION`)

Fica formalmente registado que a implementação inicial do Gate 3E foi iniciada antes da autorização humana explícita formal do Gate 3D.
- **Classificação:** `PROCESS_CONTROL_VIOLATION` (Violação de Controlo Processual).
- **Auditoria de Impacto:**
  - ✅ **Zero writes remotos:** Nenhuma chamada foi emitida a qualquer infraestrutura externa.
  - ✅ **Zero provisionamento:** Nenhum bucket foi criado na Cloudflare R2 ou AWS S3.
  - ✅ **Zero cópia física:** Os 510.69 MB (147 blobs) continuam exclusivamente na fonte Supabase.
  - ✅ **Zero mutação de Produção:** Nenhuma base de dados ou ficheiro de produção foi alterado.
  - ✅ **Zero credenciais configuradas:** Nenhuma credencial de destino foi injetada no ambiente.

---

## 2. Provenance Criptográfica do Gate 3D e Manifest Congelado

O protocolo do Gate 3E está criptograficamente vinculado aos valores homologados no Gate 3D.1:

```text
sourceInventoryChecksum = 57e1369fcb302d2fa8c0e027cdc4979ae0ba553866ea08e7b37b5152d9748728
sourceObjectCount       = 147
sourceTotalBytes        = 535493700
pinnedManifestChecksum  = 4eab656cabec14a86325c9303659fe86d19d61d34a56a9fd6fc7d314e818dda9
```

### Algoritmo do `manifestChecksum`:
1. Mapeia cada um dos 147 objetos incluindo a sua identidade relacional e de storage:
   `{ storage_path, size_bytes, content_type, sha256, invitation_slug, photo_id }`.
2. Ordena estritamente por `storage_path ASC`.
3. Serializa para string JSON canónica minificada codificada em UTF-8.
4. Gera o SHA-256 final sobre a string JSON resultante.

> **Diferença de Algoritmos:**  
> - `sourceInventoryChecksum`: Cobre estritamente os atributos do inventário físico de storage (`storage_path`, `size_bytes`, `content_type`, `sha256`).  
> - `manifestChecksum`: Cobre a tupla completa de migração incluindo as relações canónicas de negócio (`invitation_slug`, `photo_id`).

---

## 3. Especificação do Destino (Cloudflare R2 — Terminologia Exata)

O Cloudflare R2 difere do AWS S3 em modelo de acesso. A especificação técnica correta é:

| Propriedade | Especificação no Cloudflare R2 |
|---|---|
| **Provedor Alvo** | Cloudflare R2 (S3-compatible API) |
| **Nome do Bucket** | `haxr-wedding-photos` |
| **Região** | `auto` (baixa latência geográfica automática) |
| **Política de Acesso** | `private` por padrão |
| **Subdomínio `r2.dev`** | **Desativado** (`r2DevSubdomainEnabled: false`) |
| **Domínio Personalizado Público** | **Nenhum** (`publicCustomDomain: false`) |
| **Acesso Não-Autenticado** | **Bloqueado** (`unauthenticatedAccess: false`) |
| **Operações Autorizadas** | `GET, PUT, HEAD` exclusivamente |

---

## 4. Segurança de Escrita Condicional Create-Only (`If-None-Match: *`)

Para garantir ausência absoluta de sobrescrita acidental em cenários de concorrência ou reexecuções, o protocolo **proíbe depender unicamente de `HEAD -> absent -> PUT`**.

### Requisito Atómico:
Toda a escrita no destino final exige a primitiva condicional atómica:
$$\text{PutObject / CopyObject} \quad \text{com} \quad \mathbf{If\text{-}None\text{-}Match: *}$$
- **Comportamento perante objeto concorrente:**
  Se o objeto já tiver sido criado no destino por qualquer outro processo, o endpoint S3/R2 devolve obrigatoriamente:
  $$\mathbf{412\text{ PreconditionFailed}} \implies \mathbf{BLOCK}$$
- O protocolo captura o `412`, recusa a operação, emite `SyncProtocolError("destination_race_condition_blocked")` e **não executa retry**.
- **O objeto concorrente permanece 100% intacto.**

---

## 5. Arquitetura de Staging Seguro e Rollback Isolado

O protocolo implementa transferência em duas fases com staging isolado por execução (`run-id`):

```text
[Source: Supabase Storage]
         │
         ▼ (Stream read & on-the-fly SHA-256)
[Upload para Chave Staging Única]
   `__migration/<run-id>/<storage_path>`
         │
         ▼ (Re-read e validação de hash da staging key)
[Promoção Condicional Atómica Create-Only]
   `promoteObjectConditional(staging -> final, { ifNoneMatch: '*' })`
         │
         ├── Se 412 (Já existe): Remove APENAS staging key; final key permanece intacta -> BLOCK
         ├── Se Erro: Remove APENAS staging key; final key nunca é tocada
         │
         ▼ (Sucesso da promoção condicional)
[Verificação Final na Chave Definitiva]
         │
         ▼ (Remoção da Staging Key temporária)
`remove([__migration/<run-id>/<storage_path>])`
```

> **Garantia de Rollback:** O rollback de falha purga **EXCLUSIVAMENTE** a chave de staging migration-owned. O motor **NUNCA executa blind DELETE na chave final**.

---

## 6. Semântica do Dry-Run (`SIMULATED_EMPTY_DESTINATION_DRY_RUN`)

O dry-run atual é classificado explicitamente como:
`SIMULATED_EMPTY_DESTINATION_DRY_RUN`

| Decisão | Quantidade | Semântica Arquitetural |
|---|:---:|---|
| **`WOULD_COPY`** | **147** | Objeto no manifest pronto para transferência condicional. |
| **`WOULD_SKIP_IDENTICAL`** | **0** | Objeto com mesmo tamanho e SHA-256 já existente no destino. |
| **`WOULD_REPLACE`** | **0** | **INEXISTENTE:** Não há caminho de código para overwrite ou replace. |
| **`WOULD_REJECT`** | **0** | Objeto fora do contrato canónico ou com MIME inválido. |
| **`WOULD_BLOCK`** | **0** | Objeto divergente no destino que forçaria colisão. |

---

## 7. Políticas de Resiliência e Retries Fail-Closed

1. **Retries Permitidos:** Apenas para falhas transitórias de rede (ex.: socket hangup, timeout, HTTP 503) com backoff exponencial estrito.
2. **Retries Proibidos (Fail-Closed Imediato):**
   - Mismatch de SHA-256 ou tamanho.
   - Objeto ausente no source.
   - Path fora do contrato canónico.
   - Resposta `412 PreconditionFailed` (concorrência / colisão de chave).

---

## 8. Status do Dual-Read e Cutover

- `dualRead()` permanece estritamente como **capacidade de biblioteca inativa em produção**.
- O provedor ativo em produção continua sendo `SupabaseStorageProvider`.
- `storageCutoverReady` permanece inalterado: **`false`**.

---

## 9. Critérios Obrigatórios para o Gate 3F

O Gate 3F (**NÃO AUTORIZADO**) exigirá expressamente:
1. Autorização humana explícita prévia.
2. Provisionamento do bucket `haxr-wedding-photos` na Cloudflare R2 com política privada.
3. Injeção segura das credenciais S3-compatible exclusivamente via variáveis de ambiente.
4. Execução de um dry-run real contra o bucket R2 provisionado antes de qualquer upload.
5. Transferência atómica lote a lote através do pipeline de staging condicional.
6. Reconciliação pós-migração com certificação de paridade antes de qualquer cutover.

---
*Fim do documento oficial do Gate 3E.1. Nenhuma escrita remota ou transferência física foi autorizada ou realizada.*
