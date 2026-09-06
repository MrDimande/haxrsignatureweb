# Gate 3F-C1 — Pre-Transfer Hardening: Streaming, Retries, Ambiguous PUT, 412 Reconciliation & Exact Object Path Scoping Report

**Data de Conclusão e Remediação Final (Gate 3F-C1.3):** 2026-09-03T10:53:00.000Z  
**Ambiente:** Branch `migration/supabase-to-neon`  
**Escopo Autorizado:** GATE 3F-C1.3 — Exact Object Path Scoping & Least-Privilege Hardening  
**Regra Fundamental:** ZERO Real R2 Object Writes — ZERO Migration Write Credentials Created  
**Padrão Linguístico Obrigatório:** Português de Moçambique (`LANGUAGE_STANDARD = PORTUGUESE_MOZAMBIQUE`)  

---

## 1. Sumário Executivo

O Gate 3F-C1.3 estabeleceu a configuração de privilégio mínimo absoluto para as credenciais temporárias de migração do Cloudflare R2, abandonando a generalização por prefixos e adoptando formalmente o escopo restrito aos **exactos 147 objectPaths canónicos** do manifest congelado:

1. **Decisão de Privilégio Mínimo (Exact Object Path Scoping):**
   - A documentação oficial da plataforma Cloudflare estabelece o limite total para cabeçalhos de requisição HTTP em **128 KB** (`request headers total limit = 128 KB`).
   - A pegada total estimada de uma requisição S3 típica com o token de sessão Base64 (~21.6 KB) é de **22.190 bytes (~21.67 KB)**, consumindo apenas **16.93%** do limite documentado de 128 KB da Cloudflare e ficando confortavelmente abaixo do limite conservador de segurança de **64 KB** (50% do limite da plataforma).
   - Portanto, qualquer alegação genérica de rejeição HTTP 431 ou limites de 8–16 KB foi tecnicamente descartada para este contexto. O escopo adoptado restringe a credencial unicamente aos 147 objectos da migração (`prefixPaths: []`, `objectPaths: [EXACT_147_FROZEN_KEYS]`).
2. **Derivação Determinística e Igualdade Estrita de Conjuntos:**
   - A lista de chaves é derivada deterministicamente do manifest aprovado (`deriveAndValidateManifestObjectPaths`), com contagem exacta de 147, ordenação determinística ASC, zero staging paths, zero chaves duplicadas e zero colisões de maiúsculas/minúsculas.
   - Antes da emissão, exige-se a igualdade bidireccional estrita entre o conjunto de chaves da credencial e do manifest (`validateExactManifestPathSetEquality`). Qualquer discrepância bloqueia a execução com `CREDENTIAL_PATH_SCOPE_MISMATCH`.
3. **Preservação Criptográfica e Invariantes de Segurança:**
   - Header protegido: `{"alg": "HS256", "typ": "JWT"}`.
   - Claims registados: `sub = accountId`, `iss = parentAccessKeyId`, `aud = new URL(endpoint).host`.
   - Claims personalizados: `bucket = "haxr-wedding-photos"`, `scope = "object-read-write"`, `actions = ["HeadObject", "GetObject", "PutObject"]`, `paths = { prefixPaths: [], objectPaths: [...] }`.
   - Chave secreta temporária derivada: $\text{hex}(\text{SHA-256}(\text{signedJWT}))$. O segredo parente nunca é exposto.
   - Envelope do token de sessão: $\text{base64}("jwt/" + \text{signedJWT})$. O JWT assinado bruto nunca é exposto directamente.

---

## 2. Ações Cloudflare R2 vs. Nomes Estilo IAM

| Operação Conceitual | Nome de Acção Rejeitado (IAM Style) | Nome Canónico Cloudflare R2 (JWT Claim) | Status no Perfil de Migração |
| :--- | :---: | :---: | :---: |
| **HeadObject** | `s3:HeadObject` | `HeadObject` | **OBRIGATÓRIO / PERMITIDO** |
| **GetObject** | `s3:GetObject` | `GetObject` | **OBRIGATÓRIO / PERMITIDO** |
| **PutObject** | `s3:PutObject` | `PutObject` | **OBRIGATÓRIO / PERMITIDO** |
| **DeleteObject** | `s3:DeleteObject` | `DeleteObject` | **PROIBIDO / REJEITADO** |
| **DeleteObjects** | `s3:DeleteObjects` | `DeleteObjects` | **PROIBIDO / REJEITADO** |
| **CopyObject** | `s3:CopyObject` | `CopyObject` | **PROIBIDO / REJEITADO** |
| **Multipart** | `s3:CreateMultipartUpload` | `CreateMultipartUpload` | **PROIBIDO / REJEITADO** |

---

## 3. Matriz de Dimensionamento e Segurança de Cabeçalhos HTTP

| Parâmetro de Medição | Valor Medido | Limite de Segurança Conservador | Limite da Plataforma Cloudflare | Avaliação Operacional |
| :--- | :---: | :---: | :---: | :--- |
| **Comprimento do JWT Assinado** | 16.192 bytes | — | — | Estrutura JSON com 147 chaves canónicas |
| **Chave Secreta Derivada** | 64 caracteres hex | — | — | SHA-256 do JWT assinado |
| **Comprimento do SessionToken (Base64)** | 21.596 bytes | — | — | Envelope `base64("jwt/" + signedJWT)` |
| **Pegada Total de Cabeçalhos HTTP S3** | **22.190 bytes (21.67 KB)** | **65.536 bytes (64 KB)** | **131.072 bytes (128 KB)** | **APROVADO (16.93% do limite Cloudflare)** |

---

## 4. Análise de Lotes (Batching) vs. Credencial Única

- **Opção A — Credencial Única Bounded (30 minutos, 147 chaves exactas):**
  - Complexidade operacional mínima.
  - Ausência de condições de corrida de rotação de credenciais mid-flight.
  - Pegada de cabeçalhos de 21.67 KB cabe perfeitamente no limite de 128 KB.
- **Opção B — Múltiplas Credenciais Fraccionadas por Lotes:**
  - Introduz complexidade desnecessária de máquinas de estado e sincronização de tokens.
  - Não traz benefício palpável de segurança, dado que a credencial única já é de curta duração (30 minutos) e restrita exactamente aos mesmos 147 caminhos.
- **Decisão:** Adoptada a **Credencial Única Bounded** com 147 objectPaths exactos e TTL de 1.800 segundos (30 minutos).

---

## 5. Máquina de Estados e Tolerância a Falhas Ambíguas

```text
[ SOURCE_PENDING ]
       │
       ▼
[ SOURCE_DOWNLOADING ] (Stream directo para os.tmpdir(), validação local)
       │
       ▼
[ SOURCE_VERIFIED ] (Tamanho, Hash SHA-256, MIME, Path aprovados)
       │
       ▼
[ FINAL_PUT_PENDING ] (PutObject condicional com IfNoneMatch: "*", Body: stream)
       │
       ├─► [ Sucesso HTTP 200 ] ──► [ FINAL_CREATED ] ──► [ FINAL_VERIFYING ] ──► [ VERIFIED ]
       │
       ├─► [ HTTP 412 ] ──► Reconciliação do Destino:
       │                     ├─► Idêntico ──► [ ALREADY_TRANSFERRED_IDENTICAL ] (Salto seguro)
       │                     └─► Divergente ──► [ BLOCKED ] (DESTINATION_RACE_OR_COLLISION)
       │
       └─► [ Falha de Rede / Timeout ] ──► [ FINAL_PUT_OUTCOME_UNKNOWN ]
                                                    │
                                                    ▼ (Reconciliação Read-Only do Destino)
                                                    ├─► Comitado Idêntico ──► [ PUT_COMMITTED_RESPONSE_LOST ] (Sucesso)
                                                    ├─► Divergente ──► [ BLOCKED ] (DESTINATION_DIVERGENT_OBJECT_BLOCKED)
                                                    └─► Não Comitado (NotFound) ──► Bounded Retry (com IfNoneMatch: "*")
                                                                                            │
                                                                                            ├─► Sucesso 200 ──► [ VERIFIED ]
                                                                                            └─► Commit Tardio (412) ──► Reconcilia 412
```

---

## 6. Resultados de Testes e Validação

- **Suite Gate 3F-C1.3 (`scripts/hardened-transfer-engine.test.mjs`):** **28/28 testes aprovados** (9 suites, 0 falhas, duração: 5.1s).
- **Suite Combinada de Armazenamento e Migração:** **135/135 testes aprovados** (45 suites, 0 falhas, duração: 11.5s).
- **Regressão Global (`npm test`):** **934/934 testes aprovados** (217 suites, 0 falhas, duração: 105.3s).
- **TypeScript (`npx tsc --noEmit`):** 0 erros.
- **ESLint:** 0 erros, 0 avisos.
- **R2 Writes Reais:** Rigorosamente **0** (`PutObject = 0`, `CopyObject = 0`, `DeleteObject = 0`).
- **Segredos Rastreados:** Rigorosamente **0**.

---

## 7. Conclusão e Paragem Obrigatória

- **`GATE 3F-C1 = PASS — CLOSED`**
- **`GATE 3F-C PHYSICAL TRANSFER = NOT AUTHORIZED`**  
  *(Paragem absoluta. Nenhuma credencial de escrita física foi criada. Nenhum byte foi transferido. Aguardando autorização humana explícita).*
