# HAXR Signature — Arquivo da Migração de Infraestrutura

**Data de Fecho:** 2026-09-06  
**Estado:** `CLOSED` (Concluído & Selado)  
**Arquitectura Canónica:** Neon PostgreSQL + Cloudflare R2  
**Snapshot Histórico:** Supabase (`oxsrdmydlqyvnueedgtl`) — Arquivo estático pré-cutover (zero dependência de runtime)

---

## 1. Objectivo da Migração

A transição operacional da HAXR Signature teve como objetivo a emancipação completa da infraestrutura legada da Supabase, transferindo a autoridade dos dados e o armazenamento de ficheiros para uma arquitectura moderna, escalável e de alta costura digital:

- **Base de Dados:** Neon Serverless PostgreSQL com pooling de ligações e papéis dedicados de menor privilégio (`haxrweb_runtime`, `edition_runtime`).
- **Armazenamento de Ficheiros:** Cloudflare R2 com compatibilidade S3 para uploads públicos (Memories / fotografias de casamento) e privados (documentos comerciais, proformas, relatórios de convidados).
- **Invalidação Criptográfica:** Revogação da chave de assinatura legada HS256 e desativação das chaves de API legadas (`service_role` e `anon`), garantindo fecho de segurança absoluto sem qualquer fuga de credenciais.

---

## 2. Arquitectura Canónica Final

```text
HAXR ECOSYSTEM — TOPOLOGIA CANÓNICA

Edition (https://edition.haxrsignature.com)
├── Base de Dados: Neon PostgreSQL            [CANONICAL / ACTIVE]
├── Runtime Role: edition_runtime            [LEAST PRIVILEGE / RLS]
├── Storage: Cloudflare R2 (wedding-photos)  [CANONICAL / ACTIVE]
├── Gifts Inventory: Neon                    [PARITY CONFIRMED]
├── Memories Pipeline: Neon + R2             [CANONICAL]
└── Supabase Runtime Dependency: ZERO        [ISOLADO]

haxrsignatureweb (https://www.haxrsignature.com)
├── Base de Dados: Neon PostgreSQL            [CANONICAL / ACTIVE]
├── Runtime Role: haxrweb_runtime            [LEAST PRIVILEGE / POOLED]
├── Private Storage: Cloudflare R2           [CANONICAL / S3 SIGNED]
├── Autenticação: Independente da Supabase   [ISOLADO]
└── Supabase Runtime Dependency: ZERO        [ISOLADO]

Supabase (oxsrdmydlqyvnueedgtl)
├── Leituras de Produção: ZERO               [ISOLADO]
├── Escritas de Produção: ZERO               [ISOLADO]
├── Legacy service_role JWT: INVÁLIDA (401)  [REVOGADA]
├── Legacy anon key: INVÁLIDA (401)          [REVOGADA]
├── Legacy Signing Key (HS256): REVOGADA     [REVOGADA]
└── Estado: Snapshot Histórico Pré-Cutover   [COLD ARCHIVE / PRESERVED]
```

---

## 3. Cronologia dos Grandes Gates

| Gate | Âmbito | Estado | Documento Chave |
| :--- | :--- | :--- | :--- |
| **Gate 3A** | Arquitectura alvo de Storage R2 | `APROVADO` | [`gate-3a-storage-target-architecture.md`](./gate-3a-storage-target-architecture.md) |
| **Gate 3B** | Abstração do provedor de Storage | `APROVADO` | [`gate-3b-storage-provider-abstraction.md`](./gate-3b-storage-provider-abstraction.md) |
| **Gate 3C** | Integração do provedor R2 em `haxrsignatureweb` | `APROVADO` | [`gate-3c-storage-provider-integration.md`](./gate-3c-storage-provider-integration.md) |
| **Gate 3D** | Reconciliação do inventário de Storage | `APROVADO` | [`gate-3d-storage-reconciliation.md`](./gate-3d-storage-reconciliation.md) |
| **Gate 3E** | Protocolo de sincronização R2 | `APROVADO` | [`gate-3e-storage-sync-protocol.md`](./gate-3e-storage-sync-protocol.md) |
| **Gate 3F** | Provisionamento, credenciamento operacional e dry-run | `APROVADO` | [`gate-3f-a-r2-provisioning.md`](./gate-3f-a-r2-provisioning.md), [`gate-3f-c2-operational-credentials.md`](./gate-3f-c2-operational-credentials.md) |
| **Gate 3G** | Release Candidate de produção e preparação de cutover | `APROVADO` | [`gate-3g-c-production-release-report.md`](./gate-3g-c-production-release-report.md) |
| **Gate 3H** | Cutover final: freeze, migração Neon/R2, canary, unfreeze e selo | `APROVADO` | [`gate-3h-post-cutover-stabilization-report.md`](./gate-3h-post-cutover-stabilization-report.md), [`gate-3h-final-security-containment-report.md`](./gate-3h-final-security-containment-report.md) |

---

## 4. Relatórios Canónicos Finais

Os seguintes relatórios constituem o selo de evidência formal da conclusão da migração:

1. **Estabilização Pós-Cutover:** [`gate-3h-post-cutover-stabilization-report.md`](./gate-3h-post-cutover-stabilization-report.md)  
   Confirma o desbloqueio seguro de escrita (`HAXR_STORAGE_WRITE_FREEZE=false`), a operacionalidade dos canários e a integridade de leitura/escrita em Neon e R2.
2. **Contenção de Segurança e Isolamento:** [`gate-3h-final-security-containment-report.md`](./gate-3h-final-security-containment-report.md)  
   Documenta a remoção de credenciais de produção e a política de isolamento.
3. **Cutover de Metadados Edition (Neon):** [`gate-3h-e5b-edition-neon-metadata-cutover-report.md`](./gate-3h-e5b-edition-neon-metadata-cutover-report.md)  
   Regista a migração do motor Edition para o Neon.
4. **Fecho de Incidente de Credenciais de BD:** [`gate-3h-e5b-r1-database-credential-incident-closure-report.md`](./gate-3h-e5b-r1-database-credential-incident-closure-report.md)  
   Evidência do isolamento das credenciais de base de dados e rotação segura de senhas.
5. **Selo de Reprodutibilidade:** [`gate-3h-e2b-final-reproducibility-seal.md`](./gate-3h-e2b-final-reproducibility-seal.md)  
   Garante a consistência entre o código versionado no Git e os artefactos em produção.

---

## 5. Salvaguarda do Snapshot Supabase

- **Base de Dados PostgreSQL:** Preservada como arquivo estático.
- **Armazenamento de Ficheiros:** Preservado sem eliminação de buckets.
- **Acesso:** Chaves legadas desativadas e assinatura revogada. O tráfego de produção não tem qualquer dependência ou capacidade de comunicação com este snapshot.
