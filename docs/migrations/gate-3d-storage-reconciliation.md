# Gate 3D — Storage Reconciliation & Synchronization Dry-Run Protocol

**Documento Oficial:** `docs/migrations/gate-3d-storage-reconciliation.md`  
**Data de Emissão Original:** 2026-09-03  
**Data da Revisão Gate 3D.1:** 2026-09-03  
**Status:** Validado e Aprovado com Evidências Live (Gate 3D.1 — Evidence & Checksum Remediation)  
**Módulos de Execução:**  
- Engine: [`scripts/reconcile-storage-preview.mjs`](file:///c:/project-x/haxrsignature/scripts/reconcile-storage-preview.mjs)  
- Runner Live: [`scripts/run-live-gate-3d.mjs`](file:///c:/project-x/haxrsignature/scripts/run-live-gate-3d.mjs)  
- Test Suite: [`scripts/reconcile-storage-preview.test.mjs`](file:///c:/project-x/haxrsignature/scripts/reconcile-storage-preview.test.mjs)  
**Artefactos de Evidência Live Gerados:**  
- Run 1: [`docs/migrations/gate-3d-reconciliation-run-1.json`](file:///c:/project-x/haxrsignature/docs/migrations/gate-3d-reconciliation-run-1.json)  
- Run 2: [`docs/migrations/gate-3d-reconciliation-run-2.json`](file:///c:/project-x/haxrsignature/docs/migrations/gate-3d-reconciliation-run-2.json)  
**Regra Fundamental:** Modo estritamente somente-leitura. Zero cópia física de blobs, zero mutações de base de dados, zero criação de buckets, zero chamadas de rede a Cloudflare R2 ou AWS S3.

---

## 1. Inventário de Origem e Destino

### 1.1 Fonte (Source)
- **Provedor:** Supabase Storage (`oxsrdmydlqyvnueedgtl.supabase.co`)
- **Bucket:** `wedding-photos` (Privado — `public: false`)
- **Total de Blobs Físicos Auditados:** **147 objetos** (535.493.700 bytes / ~510.69 MB)
- **Distribuição por MIME / Extensão:**
  - `image/jpeg` (`.jpg`): 114 objetos (~163.63 MB)
  - `video/quicktime` (`.mov`): 15 objetos (~224.28 MB)
  - `video/mp4` (`.mp4`): 10 objetos (~106.51 MB)
  - `image/heic` (`.heic`): 8 objetos (~16.27 MB)
- **Distribuição por Event Slug:**
  - `jessicaesamueltraditionalwedding`: 85 objetos
  - `jessicasamuelwedding`: 62 objetos

### 1.2 Alvo Relacional (Target)
- **Base de Dados:** Neon Preview (`ep-super-fire-ayj2jnyh.c-5.us-east-2.aws.neon.tech / neondb`)
- **Tabela:** `public.wedding_photos`
- **Total de Registos:** **147 registos**
- **Colunas Auditadas (17 colunas):** `id`, `invitation_slug`, `storage_path`, `original_filename`, `content_type`, `file_size_bytes`, `guest_name`, `caption`, `moderation_status`, `created_at`, `approved_at`, `rejected_at`, `challenge_id`, `table_id`, `participant_id`, `experience_id`, `phase_id`.

---

## 2. Semântica Técnica Honesta de SHA-256 e Classificação `MATCH`

A inspeção detalhada ao schema real de `public.wedding_photos` no Neon Preview comprovou a presença de 17 colunas e a **inexistência de qualquer coluna autoritativa de hash SHA-256 ou checksum**.

Portanto, a reconciliação opera com transparência técnica absoluta:
1. **`storage_path`**: Reconciliado 1:1 entre Neon e Supabase Storage.
2. **`size_bytes`**: Reconciliado 1:1 entre `file_size_bytes` (Neon) e o tamanho real do blob (Storage).
3. **`content_type`**: Reconciliado 1:1 entre `content_type` (Neon) e o MIME do objeto (Storage).
4. **`SHA-256`**: Calculado **diretamente a partir do stream binário do blob** no Storage. Não existe comparação fictícia de hash contra uma coluna inexistente no Neon.
5. **Critério de Certificação `MATCH`**: Um par row/objeto só é classificado como `MATCH` quando:
   - O path coincide;
   - O tamanho em bytes coincide;
   - O MIME coincide;
   - O contrato canónico `{invitation_slug}/{photo_id_uuid}/original.{ext}` é rigorosamente válido com `row.id === photo_id_uuid`;
   - Os metadados essenciais na base de dados estão presentes;
   - O SHA-256 foi calculado com sucesso a partir do binário do blob;
   - O SHA-256 permanece estável e idêntico entre duas execuções independentes (Run 1 e Run 2).

---

## 3. Algoritmo do Checksum do Inventário Físico Completo (`sourceInventoryChecksum`)

O checksum agregado do Gate 3D.1 é calculado obrigatoriamente sobre **TODOS os 147 objetos físicos encontrados no bucket de origem**, sem qualquer filtro por estado de reconciliação (`MATCH` ou outro):

1. **Projeção Normalizada por Objeto:**
   - `storage_path`: String trimmed.
   - `size_bytes`: Inteiro não negativo.
   - `content_type`: String normalizada em minúsculas sem parâmetros extras (ex.: `image/jpeg`).
   - `sha256`: Hash lowercase de 64 caracteres hexadecimais derivado do binário do blob.
2. **Ordenação Estrita:** `storage_path ASC`.
3. **Serialização Canónica:** JSON minificado codificado em UTF-8.
4. **Hashing Final:** SHA-256 sobre a string JSON canónica.

> **Sensibilidade Matemática:** O `sourceInventoryChecksum` altera deterministicamente se qualquer objeto for adicionado, removido, renomeado, tiver tamanho ou MIME alterado, ou se um único bit do seu conteúdo físico for modificado.

Adicionalmente, o motor calcula:
- **`neonMetadataChecksum`**: Checksum sobre todos os 147 metadados do Neon Preview.
- **`reconciliationChecksum`**: Checksum sobre todas as 147 decisões de reconciliação 1:1.

---

## 4. Evidências Live Reais — Run 1 e Run 2 (Prova de Idempotência)

A auditoria live real foi executada diretamente contra o Supabase Production (bucket `wedding-photos`) e o Neon Preview através do script [`scripts/run-live-gate-3d.mjs`](file:///c:/project-x/haxrsignature/scripts/run-live-gate-3d.mjs) em duas rodadas completas consecutivas.

### Tabela de Comparação Live entre Execuções:

| Métrica / Checksum | Live Run 1 | Live Run 2 | Status de Estabilidade |
|---|---|---|:---:|
| **Timestamp da Execução** | 2026-09-03T00:23:06Z | 2026-09-03T00:24:48Z | — |
| **Total de Objetos Avaliados** | **147** | **147** | ✅ Idêntico (100%) |
| **Total Classificados como `MATCH`** | **147** | **147** | ✅ Idêntico (100%) |
| **Volume Físico Auditado** | **535.493.700 bytes** | **535.493.700 bytes** | ✅ Idêntico ao byte |
| **`sourceInventoryChecksum`** | `57e1369fcb302d2fa8c0e027cdc4979ae0ba553866ea08e7b37b5152d9748728` | `57e1369fcb302d2fa8c0e027cdc4979ae0ba553866ea08e7b37b5152d9748728` | ✅ **IDÊNTICO (BIT-A-BIT)** |
| **`neonMetadataChecksum`** | `5abce3ce68259eac884c0a2c0dff36b75b9ee91c97311a683c7772dedfe69bd1` | `5abce3ce68259eac884c0a2c0dff36b75b9ee91c97311a683c7772dedfe69bd1` | ✅ **IDÊNTICO (BIT-A-BIT)** |
| **`reconciliationChecksum`** | `2d2fd18a36386fc71fd03f74d6dc33e849fb23e683aefcff8b98f8c1db8943c9` | `2d2fd18a36386fc71fd03f74d6dc33e849fb23e683aefcff8b98f8c1db8943c9` | ✅ **IDÊNTICO (BIT-A-BIT)** |
| **Divergências Detetadas** | **0** | **0** | ✅ Zero divergências |
| **Mutações / Escritas** | **0 (READ-ONLY)** | **0 (READ-ONLY)** | ✅ Zero mutações |

---

## 5. Simulação Dry-Run de Sincronização

A simulação pré-transferência executada contra os 147 objetos auditados produziu a seguinte matriz:

| Decisão no Dry-Run | Quantidade | Descrição Operacional |
|---|:---:|---|
| **`WOULD_COPY`** | **147** | Objetos validados e prontos para transferência atómica com reconciliação de hash on-the-fly. |
| **`WOULD_SKIP_IDENTICAL`** | **0** | Destino abstrato inicial está vazio. |
| **`WOULD_REPLACE`** | **0** | Proibido por contrato arquitetural. |
| **`WOULD_REJECT`** | **0** | Zero ficheiros corrompidos, fora do contrato ou com MIME incompatível. |
| **`WOULD_BLOCK`** | **0** | Zero referências quebradas ou órfãs. |

---

## 6. Cobertura de Testes Automatizados (Gate 3D.1)

Comando: `node --import tsx --test scripts/reconcile-storage-preview.test.mjs`  
Resultado: **22/22 testes aprovados (0 falhas, 0 skips, duração: 78ms)**.

- Validação determinística do cálculo do `sourceInventoryChecksum` sobre a totalidade dos objetos.
- Testes comprovando sensibilidade a inserção, remoção, alteração de path, tamanho, MIME e hash.
- Testes negativos para `MISSING_OBJECT`, `ORPHAN_OBJECT`, `SIZE_MISMATCH`, `MIME_MISMATCH`, `HASH_MISMATCH`, `DUPLICATE_PATH`, `INVALID_PATH`, `INVALID_METADATA`.
- Testes fail-closed para TLS desativado, branch `main`, target host incorreto e bucket incorreto.
- Verificação de idempotência estrita entre execuções.

---

## 7. Garantias e Bloqueios Físicos

- [x] `sourceInventoryChecksum` corrigido e auditado sobre 100% dos objetos físicos.
- [x] Schema do Neon Preview inspecionado e semântica honesta de SHA-256 documentada.
- [x] Live Run 1 e Live Run 2 executadas com sucesso contra Neon e Supabase reais.
- [x] Idempotência e integridade bit-a-bit comprovadas entre Run 1 e Run 2.
- [x] Artefactos locais seguros gerados em `docs/migrations/gate-3d-reconciliation-run-1.json` e `run-2.json`.
- [x] **Zero cópia física dos 147 blobs (510.69 MB intocados na fonte).**
- [x] **Zero escrita na base de dados ou no storage.**
- [x] **Zero provisionamento de Cloudflare R2 ou credenciais remotas.**
- [x] `storageCutoverReady = false`.

---
*Fim do documento oficial de remediação do Gate 3D.1.*
