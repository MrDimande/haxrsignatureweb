# Gate 3F-C2 — Preparação Operacional de Credenciais & Prova de Autenticação Read-Only

**Data de Execução e Fecho do Gate:** 2026-09-03T11:56:00.000Z  
**Ambiente:** Branch `migration/supabase-to-neon`  
**Escopo Autorizado:** GATE 3F-C2 — Operational Credential Preparation  
**Regra Fundamental:** ZERO Real R2 Object Writes — ZERO Transferred Bytes — ZERO Object Mutations  
**Padrão Linguístico Obrigatório:** Português de Moçambique (`LANGUAGE_STANDARD = PORTUGUESE_MOZAMBIQUE`)  

---

## 1. Sumário Executivo

O Gate 3F-C2 concluiu com sucesso a preparação operacional da credencial temporária viva de migração (`MIGRATION_OBJECT_IDENTITY`) e realizou com êxito a prova de autenticação e autorização em modo Read-Only contra a infraestrutura real do Cloudflare R2:

1. **Configuração da Identidade Parente:**
   - O operador humano concluiu a configuração de `MIGRATION_PARENT_IDENTITY` em `.env.r2.local` (`R2_MIGRATION_PARENT_ACCESS_KEY_ID = SET` e `R2_MIGRATION_PARENT_SECRET_ACCESS_KEY = SET`).
   - A separação de identidades é absoluta: a chave parente de escrita é distinta do `CLOUDFLARE_API_TOKEN` e da `GATE_3F_A_AUDIT_IDENTITY` (`Object Read only`).
   - Foi realizada uma validação segura de leitura com o cliente parente via `HeadBucket`, retornando **HTTP 200 OK** sem executar qualquer mutação.
2. **Conformidade Criptográfica e Semântica Cloudflare R2:**
   - Durante a prova live, constatou-se que a especificação oficial do Cloudflare R2 estabelece: *"Specify permitted operations using scope or actions. You must provide at least one."*
   - O envio concomitante de `scope` e `actions` provocava rejeição `HTTP 400 Bad Request` na borda da Cloudflare. Ao isolar estritamente o claim `actions` (`["HeadObject", "GetObject", "PutObject"]`), a borda aceitou a credencial temporária imediatamente, aplicando o privilégio mínimo mais restrito possível.
3. **Prova Live de Autenticação em Caminhos Autorizados:**
   - Três objectPaths determinísticos do manifest congelado (`first`, `middle`, `last`) foram consultados via `HeadObject` utilizando a credencial temporária viva.
   - Os três pedidos retornaram **HTTP 404 / NotFound**, comprovando que a credencial temporária foi aceite e autorizada pela Cloudflare para os caminhos exactos num bucket vazio.
4. **Teste Negativo Fora de Escopo:**
   - O pedido `HeadObject` contra a chave não autorizada `__credential-scope-test__/forbidden-object` foi sumariamente rejeitado pelo Cloudflare R2 com **HTTP 403 AccessDenied**, comprovando que a restrição de escopo de caminhos está activa e a ser estritamente imposta na infraestrutura da Cloudflare.
5. **Auditoria de Integridade do Destino e Zero Mutações:**
   - A `GATE_3F_A_AUDIT_IDENTITY` confirmou que o bucket de destino permanece com rigorosamente **0 objectos e 0 bytes**.
   - Mutações no R2: rigorosamente **0**. Blobs transferidos: **0**. Bytes transferidos: **0**.

---

## 2. Separação Estrita de Identidades

| Identidade | Origem / Variáveis | Permissões Cloudflare | Finalidade Operacional |
| :--- | :--- | :--- | :--- |
| **Provisioning Admin** | `CLOUDFLARE_API_TOKEN` | Admin R2 / Account | Provisionamento de infraestrutura (Gate 3F-A). Marcado para revogação manual. |
| **Audit Identity (Gate 3F-A)** | `R2_ACCESS_KEY_ID`<br>`R2_SECRET_ACCESS_KEY` | `Object Read only`<br>(`haxr-wedding-photos`) | Auditoria independente de integridade e inventário de pré/pós-voo do destino. |
| **Migration Parent Identity** | `R2_MIGRATION_PARENT_ACCESS_KEY_ID`<br>`R2_MIGRATION_PARENT_SECRET_ACCESS_KEY` | `Object Read & Write`<br>(`haxr-wedding-photos`) | Assinatura local exclusiva de credenciais temporárias em memória RAM. |
| **Migration Object Identity** | `TEMP_ACCESS_KEY_ID`<br>`TEMP_SECRET_ACCESS_KEY`<br>`TEMP_SESSION_TOKEN` | Derivada via JWT local<br>(Actions: `Head/Get/Put`, 147 paths) | Credencial temporária viva e de curta duração para operações da migração. |

---

## 3. Matriz de Dimensionamento da Credencial Temporária Real

| Métrica | Valor Medido na Infraestrutura Real | Limite Conservador Interno | Limite Oficial Cloudflare | Estado |
| :--- | :---: | :---: | :---: | :---: |
| **Comprimento do JWT Assinado** | 16.168 bytes | — | — | Estrutura JSON com 147 chaves canónicas exactas |
| **Comprimento do SessionToken (Base64)** | 21.564 bytes | — | — | Envelope `base64("jwt/" + signedJWT)` |
| **Pegada Total Estimada de Cabeçalhos HTTP** | **22.151 bytes (~21.63 KB)** | **65.536 bytes (64 KB)** | **131.072 bytes (128 KB)** | **APROVADO (16.90% do limite Cloudflare)** |

---

## 4. Resultados da Prova de Autenticação Live contra o Cloudflare R2

```text
[ LIVE AUTHENTICATION TEST RESULTS ]
Endpoint: https://358ad837bbe4517978bda64028c54ef5.r2.cloudflarestorage.com
Bucket: haxr-wedding-photos
Client Mode: requireSessionToken = true, maxAttempts = 1

1. Prova de Caminho Autorizado (first):
   Key: jessicaesamueltraditionalwedding/012a2a33-e775-44c3-b1f7-008a46945e0d/original.jpg
   Comando: HeadObjectCommand
   Resultado: HTTP 404 / NotFound (NOT_FOUND_404_VERIFIED) -> APROVADO

2. Prova de Caminho Autorizado (middle):
   Key: jessicaesamueltraditionalwedding/d9e52b29-59b1-4a5e-8bd5-0be0ce3d78aa/original.jpg
   Comando: HeadObjectCommand
   Resultado: HTTP 404 / NotFound (NOT_FOUND_404_VERIFIED) -> APROVADO

3. Prova de Caminho Autorizado (last):
   Key: jessicasamuelwedding/ff58a8fb-4bfa-427c-964e-947293157018/original.jpg
   Comando: HeadObjectCommand
   Resultado: HTTP 404 / NotFound (NOT_FOUND_404_VERIFIED) -> APROVADO

4. Teste Negativo Fora de Escopo:
   Key: __credential-scope-test__/forbidden-object
   Comando: HeadObjectCommand
   Resultado: HTTP 403 / AccessDenied (403_ACCESS_DENIED_VERIFIED) -> APROVADO (Escopo estritamente imposto)

5. Auditoria de Destino (GATE_3F_A_AUDIT_IDENTITY):
   Comando: HeadBucket + ListObjectsV2
   Resultado: objectCount = 0, totalBytes = 0 (DESTINATION_EMPTY_VERIFIED) -> APROVADO
```

---

## 5. Estado de Produção e Invariantes do Sistema

- `SupabaseStorageProvider`: **ACTIVE**
- `S3CompatibleStorageProvider`: **NOT ACTIVE**
- `dualRead`: **INACTIVE**
- `storageCutoverReady`: **false**
- Mutações no Supabase: **0**
- Mutações no Neon: **0**
- Mutações no Cloudflare R2: **0** (`PutObject = 0`, `CopyObject = 0`, `DeleteObject = 0`, `multipart = 0`)
- Blobs transferidos: **0**
- Bytes transferidos: **0**

---

## 6. Resultados de Testes e Validação Global

- **Suite Operacional Gate 3F-C2 ([`scripts/run-live-gate-3f-c2.test.mjs`](file:///c:/project-x/haxrsignature/scripts/run-live-gate-3f-c2.test.mjs)):** 5/5 aprovados.
- **Suite Hardened Transfer Engine ([`scripts/hardened-transfer-engine.test.mjs`](file:///c:/project-x/haxrsignature/scripts/hardened-transfer-engine.test.mjs)):** 28/28 aprovados.
- **Suite Combinada de Armazenamento e Migração:** 140/140 aprovados (46 suites, 0 falhas).
- **TypeScript (`npx tsc --noEmit`):** 0 erros.
- **ESLint:** 0 erros, 0 avisos.
- **Regressão Global (`npm test`):** 934/934 aprovados (217 suites, 0 falhas).

---

## 7. Revogação do Token de Provisionamento

Com a aprovação integral e o fecho formal do Gate 3F-C2:
```text
PROVISIONING_TOKEN_READY_FOR_HUMAN_REVOCATION = true
```
O operador humano pode revogar manualmente o token `HAXR R2 Provisioning Gate 3F-A` no painel da Cloudflare antes do início da transferência física. A identidade `MIGRATION_PARENT_IDENTITY` deve ser mantida até à conclusão do Gate 3F-D.

---

## 8. Conclusão e Paragem Obrigatória

- **`GATE 3F-C2 = PASS — CLOSED`**
- **`GATE 3F-C PHYSICAL TRANSFER = NOT AUTHORIZED`**  
  *(Paragem absoluta. Nenhuma mutação de escrita foi executada, nenhum ficheiro foi transferido e a transferência física permanece estritamente bloqueada até autorização humana explícita).*
