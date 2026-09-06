# Gate 3F-C — Transferência Física Endurecida (Cloudflare R2)

**Data de Avaliação:** 2026-09-03T19:35:00.000Z  
**Ambiente:** Branch `migration/supabase-to-neon`  
**Escopo:** GATE 3F-C — Physical Storage Migration  
**Padrão Linguístico Obrigatório:** Português de Moçambique (`LANGUAGE_STANDARD = PORTUGUESE_MOZAMBIQUE`)  
**Estado Actual:** **PASS — CLOSED**  

---

## 1. Sumário Executivo

A transferência física dos 147 blobs armazenados no Supabase Storage para o bucket de destino na Cloudflare R2 (`haxr-wedding-photos`) foi executada, verificada e auditada com sucesso, cumprindo a totalidade dos invariantes arquitecturais e de segurança estabelecidos para o Gate 3F-C:

- **Volume Total:** 147 objectos transferidos e verificados.
- **Tamanho Total:** 535.493.700 bytes (~510,69 MB) comitados sem qualquer perda ou truncagem.
- **Paridade Criptográfica:** 147/147 correspondências exactas de hash SHA-256 e de tipo MIME contra o manifest canónico congelado do Gate 3D (`docs/migrations/gate-3d-reconciliation-run-1.json`).
- **Auditorias Independentes Duplas:** Run 1 e Run 2 concluídas com paridade determinística total (`checksum = 57e1369fcb302d2fa8c0e027cdc4979ae0ba553866ea08e7b37b5152d9748728`).
- **Protecção de Produção:** A aplicação viva permanece 100% inalterada (`SupabaseStorageProvider` activo, `S3CompatibleStorageProvider` inactivo, dual-read inactivo, `storageCutoverReady = false`).

---

## 2. Invariantes de Segurança e Execução Cumpridos

| Invariante | Requisito Mandatório | Resultado Empírico | Avaliação |
| :--- | :--- | :--- | :---: |
| **Branch Safety** | `migration/supabase-to-neon` | Branch `migration/supabase-to-neon` | **PASS** |
| **Git Ignore** | `.env.r2.local` no `.gitignore` | Ignorado na linha 19 do `.gitignore` | **PASS** |
| **Revogação de Provisionamento** | Token amplo revogado remotamente | Atestado formalmente pelo operador humano | **PASS** |
| **Identidade de Escrita** | Credencial temporária estrita | `MIGRATION_OBJECT_IDENTITY` em memória RAM | **PASS** |
| **Identidade de Leitura** | Auditoria e leitura segregada | `GATE_3F_A_AUDIT_IDENTITY` (Read Only) | **PASS** |
| **Concorrência** | Sequencial estrita (`concurrency = 1`) | Processamento ordinal 1 a 147 (`storage_path ASC`) | **PASS** |
| **Anti-Sobregravação** | Condicional obrigatório | `IfNoneMatch: "*"` em todos os `PutObject` | **PASS** |
| **Operações Proibidas** | `CopyObject`, `DeleteObject`, staging | 0 ocorrências de mutações destrutivas | **PASS** |
| **Integridade de Streaming** | Sem buffers integrais em RAM | `Readable.from` particionado via HTTP Range $\to$ `os.tmpdir()` $\to$ S3 | **PASS** |
| **Verificação Pós-Escrita** | `HeadObject` + `GetObject` SHA-256 | Validação individual de cada blob no destino | **PASS** |
| **Journal Contínuo** | Registo imutável sem segredos | `docs/migrations/gate-3f-c-transfer-journal.json` (147 entradas) | **PASS** |

---

## 3. Resolução Arquitectural de Conectividade e Resiliência

Durante a execução da migração, foram identificados e resolvidos dois desafios estruturais de conectividade e resiliência:

1. **Endereçamento Virtual-Hosted vs Path-Style na Cloudflare R2:**
   - O AWS SDK v3 tentava por omissão resolver subdomínios virtuais inexistentes no DNS (`<bucket>.<account_id>.r2.cloudflarestorage.com`), gerando `getaddrinfo ENOTFOUND`.
   - **Solução Aplicada:** Forçou-se `forcePathStyle: true` e integrou-se `NodeHttpHandler` com timeouts estendidos de 120s para acomodar o fluxo de vídeos volumosos.
2. **Instabilidade TLS/Rede em Ficheiros Maiores (HIPÓTESE OPERACIONAL: Fragmentação MTU):**
   - Foi observada instabilidade TLS/rede durante transferências maiores (> 8 MB a 52 MB). Sob condições de rede móvel, ocorriam falhas intermitentes de transporte TLS (`ERR_SSL_DECRYPTION_FAILED_OR_BAD_RECORD_MAC`). A fragmentação de MTU permanece como HIPÓTESE OPERACIONAL e não como causa raiz comprovada.
   - **Solução Aplicada:** A utilização de pedidos HTTP Range em blocos menores (1 MB) reduziu a exposição a interrupções e permitiu a conclusão verificável da transferência e validação íntegra de vídeos de até 52,27 MB (`original.mov`).


---

## 4. Resultados das Auditorias Finais Independentes (Run 1 & Run 2)

Após a validação do 147º objecto, foram despoletadas automaticamente duas rondas de auditoria de leitura profunda, recorrendo exclusivamente à identidade estrita de auditoria (`GATE_3F_A_AUDIT_IDENTITY`):

```json
{
  "status": "PASS",
  "verifiedObjectCount": 147,
  "verifiedTotalBytes": 535493700,
  "destinationObjectCount": 147,
  "destinationTotalBytes": 535493700,
  "destinationInventoryChecksum": "57e1369fcb302d2fa8c0e027cdc4979ae0ba553866ea08e7b37b5152d9748728",
  "run1Count": 147,
  "run1Bytes": 535493700,
  "run2Count": 147,
  "run2Bytes": 535493700,
  "deterministicAuditVerified": true,
  "journalPath": "docs/migrations/gate-3f-c-transfer-journal.json"
}
```

- **Run 1:** 147 objectos listados, 535.493.700 bytes apurados.
- **Run 2:** 147 objectos listados, 535.493.700 bytes apurados.
- **Reconciliação Determinística:** `Run 1 Checksum === Run 2 Checksum` comprovada com correspondência absoluta.

---

## 5. Bateria Completa de Testes de Regressão
 
- **Avaliação de Risco:** Nenhuma regressão foi detectada nas suites executadas e nenhum cutover de runtime foi realizado.
- **Testes Unitários do Motor e Runner ([`scripts/hardened-transfer-engine.test.mjs`](file:///c:/project-x/haxrsignature/scripts/hardened-transfer-engine.test.mjs), [`scripts/run-live-gate-3f-c.test.mjs`](file:///c:/project-x/haxrsignature/scripts/run-live-gate-3f-c.test.mjs)):**

  - 33 testes executados e aprovados (0 falhas).
- **Suite Geral da Aplicação (`npm test`):**
  - 934 testes executados e aprovados (217 suites, 0 falhas).
- **Verificação de Tipos (`npx tsc --noEmit`):**
  - 0 erros de compilação.
- **Auditoria de Estilo e Qualidade (`npx eslint`):**
  - 0 erros, 0 avisos.

---

## 6. Estado Final do Gate

- **Gate 3D:** PASS — CLOSED
- **Gate 3E:** PASS — CLOSED
- **Gate 3F-A:** PASS — CLOSED
- **Gate 3F-B:** PASS — CLOSED
- **Gate 3F-C0:** PASS — CLOSED
- **Gate 3F-C1:** PASS — CLOSED
- **Gate 3F-C2:** PASS — CLOSED
- **Gate 3F-C (Transferência Física):** **PASS — CLOSED**

**Próximo Gate:** Gate 3F-D — **NOT AUTHORIZED. PARAGEM ABSOLUTA.**
Nenhuma acção de cutover, alteração de fornecedor activo (`SupabaseStorageProvider`), activação de dual-read ou fusão de ramos está autorizada.
