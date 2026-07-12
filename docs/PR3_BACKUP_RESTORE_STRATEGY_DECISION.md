# PR.3 — Decisão de estratégia backup/restauro

**Modo:** documental e read-only — **nenhuma acção mutável executada neste documento**.

**Estado:** **NO-GO TEMPORÁRIO** — prontidão de restauro ainda não comprovada.

---

## Referências auditáveis

| Marco | Commit / ref |
|-------|----------------|
| PR.4.1 dry-run | `ea8fe5b` |
| Inventário inicial PR.3 | `857e1c2` |
| Gate de restauro | `fb478ee` |
| Evidência Dashboard | `511e1d0` |
| Produção | `oxsrdmydlqyvnueedgtl` (`haxr-business-suite`) |
| Região | Central EU (Frankfurt) · `eu-central-1` |
| Plano actual (Dashboard) | **Free Plan** — sem backups nativos Supabase |
| PostgreSQL (Management API, read-only) | **17.6.1** |

**Documentos relacionados (não alterados nesta tarefa):**

- `docs/PR3_PRODUCTION_READONLY_INVENTORY.md`
- `docs/PR4.1_DRY_RUN_FINAL_REPORT.md`
- `docs/PRODUCTION_MIGRATION_PLAN_036_043.md`

**Evidência Dashboard (commit `511e1d0`):**

- Scheduled backups: «Free Plan does not include project backups»
- Pro Plan: backups diários, retenção até **7 dias** (conforme Dashboard)
- PITR: add-on Pro Plan (~$100/mês, conforme Dashboard)
- Restore to new project (BETA): requer Pro Plan + physical backups enabled

**Estado actual do gate (inventário):**

| Requisito | Valor actual | Condição satisfeita |
|-----------|--------------|---------------------|
| `backupAvailable = true` | **false** | **não** ❌ |
| `restoreProcedureKnown = true` | **true** — apenas procedimento/pré-requisitos documentados | **sim** ⚠️ (não prova restauro disponível ou testado) |
| `restoreAuthorityIdentified = true` | **false** | **não** ❌ |
| `restoreTested = true` | **false** | **não** ❌ |
| `productionTouched = false` | **false** | **sim** ✅ (valor actual false; requisito satisfeito) |

---

## Contexto

As migrations **036–043** estão **genuinamente pendentes** em produção (inventário `857e1c2` / `511e1d0`). O ensaio PR.4.1 (`ea8fe5b`) validou a aplicação num clone isolado, mas **não substitui** prontidão de backup/restauro em produção.

**Bloqueio actual:** plano **Free** — **capacidade de restauro nativo disponível = false**. Nenhuma estratégia abaixo foi seleccionada, aprovada ou testada.

---

## Estratégia A — Upgrade para plano com backup nativo

> **Proposta documental.** Upgrade **não executado** nesta fase.

### Pré-condições

| Pré-condição | Estado |
|--------------|--------|
| Aprovação de custo (organização Dimande Digital) | **Pendente de decisão** |
| Plano destino mínimo (Pro, conforme Dashboard) | Por validar com Billing |
| Projecto `oxsrdmydlqyvnueedgtl` activo e saudável | ✅ (Dashboard: PRODUCTION) |
| Janela de manutenção definida para eventual restore drill | **Pendente de decisão** |
| Responsáveis autorizar/executar identificados | **Pendente de confirmação pelo operador** |
| Inventário PR.3 concluído (itens 1–3) | ✅ |

### Custo / aprovação

| Item | Valor |
|------|-------|
| Custo Pro Plan | **Pendente de decisão** (consultar Billing Supabase) |
| PITR (opcional) | **Pendente de decisão** (~$100/mês, conforme Dashboard) |
| Aprovador financeiro | **Pendente de decisão** |

### Capacidades após upgrade (conforme Dashboard — por confirmar pós-upgrade)

| Capacidade | Expectativa documental | Confirmação pós-upgrade |
|------------|------------------------|-------------------------|
| Backups scheduled diários | Pro inclui (Dashboard) | **Por validar** |
| Retenção | Até 7 dias (Dashboard, sem PITR) | **Por validar** |
| PITR | Add-on opcional Pro | **Por validar** se necessário |
| Restore to new project (BETA) | Requer Pro + physical backups | **Por validar** |

### Passos operacionais propostos (sem execução)

1. Upgrade organização/projecto para plano elegível (**não executado**).
2. Aguardar primeiro backup scheduled (**horário ~meia-noite região**, conforme Dashboard).
3. Confirmar retenção efectiva no Dashboard.
4. Registar responsável por **autorizar** e **executar** restauro.
5. Ensaiar restauro num contexto **não-produção** ou restore drill documentado (**restoreTested = true**).
6. Só então reconsiderar gate para itens 4–6 PR.3.

### Quando poderá satisfazer o gate

| Condição gate | Quando (estimativa qualitativa) |
|---------------|----------------------------------|
| backupAvailable = true | Após upgrade **e** confirmação de backup listado no Dashboard |
| restoreProcedureKnown = true | Já documentado; reconfirmar pós-upgrade |
| restoreAuthorityIdentified = true | Após operador registar responsáveis |
| restoreTested = true | Após ensaio operacional de restauro (não apenas leitura Dashboard) |
| productionTouched = false | Mantido se upgrade/restore drill não alterarem produção directamente |

**Estimativa:** **Por validar** — depende de aprovação, tempo até primeiro backup e conclusão de restore drill.

### Riscos residuais

- Custo recorrente não aprovado.
- Janela entre upgrade e primeiro backup usable (RPO **Por validar**).
- Tempo de indisponibilidade em restore real (RTO **Por validar** — Dashboard não apresentou estimativa).
- PITR vs scheduled: escolha incorrecta de modalidade.
- Restore to new project (BETA) pode não ser aceitável como plano de rollback operacional.
- Upgrade em si é mutação de billing/infra — **fora do scope desta fase documental**.

---

## Estratégia B — Backup lógico externo read-only

> **Proposta documental.** **Não ligar à produção.** **Não executar pg_dump** nesta fase.

### Objectivo

Obter cópia lógica restauável **fora** dos backups nativos Supabase, com custódia controlada e validação obrigatória em clone isolado antes de qualquer janela de apply em produção.

### Abordagem proposta (não executada)

| Aspecto | Proposta |
|---------|----------|
| Ferramenta | `pg_dump` compatível com PostgreSQL **17.x** (produção: 17.6.1) |
| Modo | Dump lógico **schema + dados** dos schemas relevantes |
| Destino | Armazenamento **cifrado**, acesso **restrito**, fora do repositório git |
| Integridade | Checksum **SHA-256** do artefacto registado no dossiê PR.3 |
| Teste | Restauro **obrigatório** num clone isolado (modelo PR.4.1) |
| Produção | **Read-only** na origem; dump só após aprovação explícita e janela dedicada |

### Schemas / namespaces — tratamento proposto

| Namespace | Incluir no dump? | Notas |
|-----------|------------------|-------|
| `public` | **Sim** (proposta) | Core admin/events/concierge — baseline inventário |
| `auth` | **Por validar** | Migration 036 cria trigger em `auth.users`; restauro completo pode exigir consideração especial (schema gerido Supabase) |
| `storage` | **Por validar** | Metadados bucket `haxr-concierge` e objectos — backup lógico SQL **não** substitui ficheiros Storage |
| `supabase_migrations` | **Sim** (proposta) | Histórico `schema_migrations` crítico para rollback documental |
| `realtime`, `extensions`, etc. | **Por validar** | Avaliar necessidade vs. complexidade de restauro |

**Exclusões / cuidados (proposta):**

- Não commitar dumps no git.
- Não incluir credenciais no dossiê.
- Objectos Storage: estratégia separada **Pendente de decisão**.
- Roles/grants Supabase (`authenticator`, `service_role`, …): validar no clone pós-restore (**Por validar**).

### Validação pós-restore no clone (checklist proposta)

- [ ] Contagens de tabelas críticas (`businesses`, `clients`, `events`, `guests`, …)
- [ ] Funções e RPCs existentes pré-036 intactas
- [ ] Policies e RLS (estado actual: RLS on, 0 policies em várias tabelas core — inventário)
- [ ] Triggers (`set_updated_at`, concierge, …)
- [ ] Índices e constraints
- [ ] Linha `schema_migrations` coerente com produção pré-apply
- [ ] Smoke queries read-only (sem apply 036–043 no teste de backup, salvo plano explícito)

### RPO / RTO

| Métrica | Valor |
|---------|-------|
| RPO | **Por determinar** (depende da cadência de dumps aprovada) |
| RTO | **Por determinar** (depende de tempo de restore + validação) |

### Limitações face a backup nativo / PITR

| Dimensão | Backup lógico externo | Backup nativo / PITR |
|----------|----------------------|----------------------|
| Granularidade temporal | Ponto do dump (RPO ≥ intervalo dump) | Scheduled diário; PITR por segundo (add-on) |
| Restore via Dashboard | **Não** | **Sim** (Pro+) |
| Storage objectos | **Não incluído** por defeito | Backups físicos incluem DB; Storage separado |
| `auth` schema | Complexidade **Por validar** | Gerido pela plataforma |
| Operação | Manual, runbook próprio | Integrado Supabase |
| restoreTested | Exige clone + ensaio explícito | Exige restore drill igualmente |

### Responsáveis (proposta — não identificados)

| Função | Estado |
|--------|--------|
| Criar dump | **Pendente de confirmação pelo operador** |
| Custodiar artefacto cifrado | **Pendente de confirmação pelo operador** |
| Executar restore em clone | **Pendente de confirmação pelo operador** |
| Autorizar uso em janela produção | **Pendente de confirmação pelo operador** |

### Quando poderá satisfazer o gate

| Condição gate | Requisito proposto |
|---------------|-------------------|
| backupAvailable = true | Dump validado existe, checksum registado, custódia aprovada |
| restoreProcedureKnown = true | Runbook de dump/restore documentado e aprovado |
| restoreAuthorityIdentified = true | Responsáveis registados |
| restoreTested = true | Restore **integral** verificado no clone + checklist acima |
| productionTouched = false | Dump/restore test **apenas** em clone até janela formal |

**Estimativa:** **Por validar** — depende de aprovação, execução do dump, restore no clone e validação.

### Riscos residuais

- Dump incompleto (`auth`, Storage, roles).
- Artefacto comprometido ou perdido.
- Restore no clone não representa produção (drift de versão/extensões).
- Tempo operacional elevado vs. backup nativo.
- **Não executado nesta fase** — riscos permanecem teóricos até ensaio.

---

## Estratégia C — Adiar migrations 036–043

> **Estado actual de facto** enquanto nenhuma estratégia A ou B for aprovada e testada.

### Efeito

| Aspecto | Resultado |
|---------|-----------|
| Decisão PR.3 | Mantém **NO-GO** |
| Risco novo em produção | **Nenhum** introduzido por migrations |
| productionTouched | **false** |
| Gate backup/restauro | **Continua a falhar** (backupAvailable = false) |

### Impacto funcional de adiar 036–043

Objectos **ausentes** em produção (inventário `857e1c2`):

| Área | Impacto |
|------|---------|
| `profiles`, `client_events`, `event_members`, `event_onboarding_snapshots` | Inexistentes — app cliente operacional **não disponível** |
| RPCs `provision_client_operational_event`, `get_client_event_*` (5) | Inexistentes |
| Trigger `auth.users` → `on_auth_user_created` | Inexistente |
| Rotas `/app/*`, APIs client-app (E.4) | **Não activar** em produção (cf. `PRODUCTION_MIGRATION_PLAN_036_043.md`) |
| Admin / marketing / portal existentes | Continuam no estado actual (sem dependência de 036) |

### Condições para reconsiderar

1. Estratégia A ou B **seleccionada** e **aprovada** pelo operador.
2. Gate completo satisfeito, **incluindo** `restoreTested = true`.
3. Responsáveis autorizar/executar registados.
4. Itens 4–6 PR.3 redigidos (ordem apply, rollback, GO/NO-GO formal).
5. PR.4.1 permanece baseline de ensaio técnico — **não** substitui backup produção.

### Prazo / responsável pela decisão

| Campo | Valor |
|-------|-------|
| Prazo | **Pendente de decisão** |
| Responsável | **Pendente de confirmação pelo operador** |

---

## Matriz de decisão

> Valores **observados** ou **Pendente de decisão** / **Por validar** — nada inventado.

| Estratégia | Backup disponível | Restauro testável | RPO | RTO | Custo | Complexidade operacional | Responsável identificado | Risco | Satisfaz gate agora | Recomendação |
|------------|-------------------|-------------------|-----|-----|-------|--------------------------|--------------------------|-------|---------------------|--------------|
| **A — Upgrade backup nativo** | **false** (actual); **Por validar** pós-upgrade | **não** (actual); **Por validar** após drill | **Por validar** (≥24h até 1.º backup scheduled?) | **Por validar** | **Pendente de decisão** (Pro + PITR opcional) | Média (Dashboard integrado) | **false** | Médio — custo, janela 1.º backup | **false** | **Preferencial** (se aprovado) |
| **B — Backup lógico externo** | **false** (actual); **Por validar** após dump validado | **não** (actual); **Por validar** após clone | **Por determinar** | **Por determinar** | **Pendente de decisão** (infra + tempo operador) | Alta (runbook, custódia, clone) | **false** | Alto — incompletude auth/Storage | **false** | **Alternativa condicionada** |
| **C — Adiar 036–043** | **false** | **não** | N/A (sem apply) | N/A | Nenhum incremental imediato | Baixa | **false** | Baixo operacional; **funcional** (app cliente adiada) | **false** | **Default** até A ou B aprovadas |

---

## Gate obrigatório (actualizado PR.3)

```text
backupAvailable = true
restoreProcedureKnown = true
restoreAuthorityIdentified = true
restoreTested = true
productionTouched = false
```

**Estado actual:**

| Requisito | Valor actual | Condição satisfeita |
|-----------|--------------|---------------------|
| `backupAvailable = true` | **false** | **não** ❌ |
| `restoreProcedureKnown = true` | **true** — apenas procedimento/pré-requisitos documentados | **sim** ⚠️ (não prova restauro disponível ou testado) |
| `restoreAuthorityIdentified = true` | **false** | **não** ❌ |
| `restoreTested = true` | **false** | **não** ❌ |
| `productionTouched = false` | **false** | **sim** ✅ (valor actual false; requisito satisfeito) |

> **Ressalva:** `restoreProcedureKnown = true` significa apenas que o procedimento/pré-requisitos estão **documentados** no Dashboard e neste dossiê. **Não** prova restauro disponível, operacional ou testado.

> **Nota:** `restoreTested = true` é requisito **operacional** adicional antes de GO formal. Documentação de procedimento **não** substitui ensaio.

**Nenhuma estratégia satisfaz o gate neste momento.**

---

## Recomendação preliminar

### 1. Preferencial — Estratégia A (upgrade backup nativo)

**Fundamentação:**

- Dashboard documenta explicitamente que Free Plan **não inclui** project backups.
- Pro Plan activa backups scheduled (retenção até 7 dias, conforme Dashboard) — alinha `backupAvailable` com capacidade **nativa** da plataforma já usada (`oxsrdmydlqyvnueedgtl`).
- Restore integrado (scheduled / restore-to-new-project / PITR opcional) reduz complexidade vs. runbook externo.
- PR.4.1 (`ea8fe5b`) validou migrations; falta **camada operacional** de backup produção.

**Condições antes de GO:**

- Aprovação de custo.
- Primeiro backup confirmado no Dashboard.
- Responsáveis identificados.
- **restoreTested = true** (restore drill documentado).

### 2. Alternativa condicionada — Estratégia B (backup lógico externo)

**Fundamentação:**

- Viável **somente se** dump for **integral**, custodiado, com SHA-256, e **restaurado e verificado** no clone isolado antes da janela de produção.
- Necessária resolução explícita de `auth`, Storage e roles — **Por validar**.
- Maior carga operacional e risco de lacunas vs. Estratégia A.

### 3. Se nenhuma estratégia for aprovada e testada — Estratégia C

**Fundamentação:**

- Mantém produção **intocada** (`productionTouched = false`).
- Evita apply 036–043 sem rede de segurança.
- Impacto: funcionalidades client-app permanecem **fora** de produção.

---

## Campos de decisão pendentes

| Campo | Estado |
|-------|--------|
| Estratégia seleccionada (A / B / C) | **Pendente de decisão** |
| Aprovador financeiro (Estratégia A) | **Pendente de decisão** |
| Custo Pro / PITR | **Pendente de decisão** |
| Responsável autorizar restauro | **Pendente de confirmação pelo operador** |
| Responsável executar restauro | **Pendente de confirmação pelo operador** |
| RPO / RTO | **Por determinar** |
| Prazo decisão | **Pendente de decisão** |
| restoreTested | **false** |
| Itens 4–6 PR.3 (ordem apply, rollback, GO/NO-GO) | **Não iniciados** — gate bloqueado |

---

## Decisão do documento

Este documento **não** declara GO de produção.

**NO-GO — estratégia de backup/restauro ainda não seleccionada, aprovada e testada.**

---

## Proibições respeitadas nesta tarefa

| Acção | Executada? |
|-------|------------|
| Upgrade Supabase | **Não** |
| Backup / snapshot | **Não** |
| pg_dump | **Não** |
| SQL / repair / db push / migrations | **Não** |
| merge / deploy / push | **Não** |
| Alteração produção `oxsrdmydlqyvnueedgtl` | **Não** |
| Alteração inventário existente | **Não** |
| Commit automático | **Não** |

**productionTouched = false**
