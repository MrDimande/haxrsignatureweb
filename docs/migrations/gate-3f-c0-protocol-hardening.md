# Gate 3F-C0 — Pre-Transfer Protocol Compatibility & Hardening Report

**Data:** 2026-09-03T10:04:00.000Z  
**Ambiente:** Branch `migration/supabase-to-neon`  
**Escopo Autorizado:** GATE 3F-C0 — Protocol Compatibility & Local Test Hardening  
**Regra Fundamental:** ZERO R2 Object Writes — ZERO Migration Write Credentials Created  

---

## 1. Sumário Executivo

O Gate 3F-C0 realizou uma auditoria profunda de compatibilidade e endurecimento arquitectural antes de qualquer escrita física de bytes no Cloudflare R2.

A análise revelou que o protocolo anterior (Gate 3E) assumia que o comando `CopyObject` podia proteger atomicamente o destino via condições de destino padrão S3 (`IfNoneMatch`). Contudo, nas especificações reais S3 e Cloudflare R2:

- Os cabeçalhos padrão `x-amz-copy-source-if-*` aplicam-se exclusivamente ao **objeto de origem** (Copy Source), não ao destino.
- O Cloudflare R2 oferece um cabeçalho de extensão (`cf-copy-destination-if-none-match`), mas documenta o suporte a condições de destino em `CopyObject` como uma **extensão BETA**.

Em contrapartida, `PutObject` no Cloudflare R2 suporta nativamente, com garantias GA completas e atómicas, o cabeçalho condicional de destino:

```http
If-None-Match: *
```

Portanto, a arquitetura de transferência física foi reformulada para eliminar o remote staging, eliminar o `CopyObject` e eliminar chamadas de `DeleteObject` no R2, adotando um fluxo atómico direto protegido por validação local em armazenamento temporário do SO (`os.tmpdir()`).

---

## 2. Inspeção da Semântica Anterior vs. Realidade Cloudflare R2

| Componente / Operação | Implementação Anterior (Gate 3E) | Semântica Real Cloudflare R2 | Classificação / Decisão |
| :--- | :--- | :--- | :--- |
| **Remote Staging** | Upload para `__migration/${runId}/${path}` | Desnecessário; validação completa executável em temp local | **REMOVED_FROM_PHYSICAL_TRANSFER_PROTOCOL** |
| **CopyObject Promotion** | `promoteObjectConditional` via CopyObject | Padrão S3 só avalia source; destino condicional é BETA (`cf-copy-destination-if-none-match`) | **COPY_DESTINATION_CONDITION_SEMANTICS_INVALID** — Removido do caminho de transferência |
| **Staging Cleanup** | `DeleteObject` na staging key | Se não há staging remoto, não há necessidade de `DeleteObject` | **ELIMINATED** — Zero `DeleteObject` no R2 |
| **Atomic Creation** | Presunção de promoção atómica via Copy | `PutObjectCommand` nativo com `IfNoneMatch: "*"` | **ADOPTED** — Atómico, GA e sem race condition |

---

## 3. Arquitetura de Transferência Hardened (Adotada)

```text
Supabase Storage (Source)
       │
       ▼ (Stream read-only)
Local Temp File (`os.tmpdir()`, unpredictable UUID filename)
       │
       ▼ (Hash on-the-fly, validate byte size, SHA-256, MIME, canonical path)
[ Validation PASS ] ──(If FAIL: cleanup temp & BLOCK immediately, 0 remote writes)
       │
       ▼
Atomic Final PutObject (`IfNoneMatch: "*"`) directly to canonical R2 key
       │
       ├─► [ HTTP 412 PreconditionFailed ] ──► DESTINATION_RACE_OR_COLLISION (Immediate fail-closed, NO RETRY, NO DELETE)
       │
       ▼ (HTTP 200 OK)
Post-Write Cryptographic Verification:
       ├─► HeadObject (key, size, content-type)
       └─► GetObject (stream -> compute SHA-256 -> match manifest)
              │
              ├─► [ Verification FAIL ] ──► POST_WRITE_VERIFICATION_FAILED (BLOCK, NO DELETE — Forensic preservation)
              │
              ▼ [ Verification PASS ]
Local Temp File Cleanup (unlinkSync guaranteed in finally)
```

---

## 4. Invariantes de Segurança e Ciclo de Vida

1. **Local Temp File Lifecycle:**
   - Alocado exclusivamente sob `os.tmpdir()`.
   - Nomes gerados via `haxr-migrate-${randomUUID()}.tmp`.
   - Nunca exposto no diretório de trabalho do Git.
   - Zero nomes de convidados, legendas ou segredos no nome do ficheiro.
   - Removido imediatamente após processamento ou falha tratada.

2. **Live Source Drift Check:**
   - Antes do início da transferência física, uma função dedicada (`verifyLiveSourcePreflight`) audita o inventário real do Supabase Storage.
   - Exige correspondência exata com o baseline do Gate 3D:
     - `sourceObjectCount = 147`
     - `sourceTotalBytes = 535493700`
     - `sourceInventoryChecksum = 57e1369fcb302d2fa8c0e027cdc4979ae0ba553866ea08e7b37b5152d9748728`
   - Qualquer discrepância aciona `SOURCE_DRIFT_DETECTED` e bloqueia a execução.

3. **Destination Precondition & Drift:**
   - Antes do primeiro write, `verifyDestinationPrecondition` audita o bucket `haxr-wedding-photos` via `HeadBucket` e `ListObjectsV2` com paginação completa.
   - Exige `objectCount = 0` e `totalBytes = 0`.
   - Qualquer objecto pré-existente aciona `DESTINATION_DRIFT_DETECTED` e bloqueia a execução.

4. **Resumabilidade e Idempotência:**
   - Se um objecto já existir no destino ao retomar a migração:
     - Leitura de metadados + download read-only para cálculo de SHA-256.
     - Se idêntico ao manifest: classificado como `ALREADY_TRANSFERRED_IDENTICAL` (skip seguro).
     - Se divergente: classificado como `DESTINATION_DIVERGENT_OBJECT_BLOCKED` (BLOCK imediato; substituição proibida).

5. **Modelo de Credenciais de Mínimo Privilégio:**
   - Cliente `@aws-sdk/client-s3` configurado com suporte a `sessionToken` para tokens temporários da Cloudflare.
   - Permissões mínimas necessárias para a futura credencial de escrita do Gate 3F-C:
     - `s3:ListBucket` (apenas `haxr-wedding-photos`)
     - `s3:HeadObject` / `s3:GetObject` (apenas `haxr-wedding-photos/*`)
     - `s3:PutObject` (apenas `haxr-wedding-photos/*`)
     - **Sem `s3:DeleteObject`**
     - **Sem `s3:CopyObject`**

6. **Recomendação para o Admin Provisioning Token:**
   - O token `HAXR R2 Provisioning Gate 3F-A` (Admin Read & Write sobre all buckets) deve ser revogado ou sofrer downscope antes da transferência física, substituído por credencial de escopo restrito exclusivo ao bucket `haxr-wedding-photos`.

---

## 5. Matriz de Testes e Validação

- **Suite Gate 3F-C0 (`scripts/hardened-transfer-engine.test.mjs`):** 13/13 testes aprovados.
- **Suite Combinada de Armazenamento e Migração:** 120/120 testes aprovados (42 suites, 0 falhas).
- **Regressão Global (`npm test`):** 934/934 testes aprovados (217 suites, 0 falhas).
- **TypeScript (`npx tsc --noEmit`):** 0 erros.
- **ESLint:** 0 erros, 0 avisos.
- **R2 Writes Reais:** Rigorosamente **0** (Bucket `haxr-wedding-photos` permanece vazio com 0 objetos e 0 bytes).

---

## 6. Estado Atual e Próximo Passo

- **`GATE 3F-C0 = PASS — CLOSED`**
- **`GATE 3F-C PHYSICAL TRANSFER = NOT AUTHORIZED`**  
  *(Paragem absoluta. Nenhuma credencial de escrita foi gerada. Nenhum byte foi transferido. Aguardando autorização humana explícita).*
