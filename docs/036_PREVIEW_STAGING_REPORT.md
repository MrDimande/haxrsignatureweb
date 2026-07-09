# Relatório — Preview Supabase como staging do Core

**Data:** Julho 2026  
**Estado:** ✅ Staging confirmado — **apply ainda não executado**  
**Âmbito:** Apenas `haxrsignature` (Core). Edition **fora de âmbito**.

---

## 1. Decisão operacional

| Ambiente | Project ref | URL | Uso |
|----------|-------------|-----|-----|
| **Produção** (Core + Edition RSVP) | `oxsrdmydlqyvnueedgtl` | `https://oxsrdmydlqyvnueedgtl.supabase.co` | `www.haxrsignature.com`, `edition.haxrsignature.com` |
| **Staging / Preview** (Core apenas) | `uxleigndoomoezwsxlan` | `https://uxleigndoomoezwsxlan.supabase.co` | Validação técnica de migrations |

**Decisão da equipa:** manter staging **só no Core** (`haxrsignature`). Não configurar Edition local. Não alterar `projecto_haxrsignature/.env.local`.

---

## 2. Resumo do projecto preview

| Campo | Valor |
|-------|-------|
| Nome Supabase | `haxr-business-suite-preview` |
| Project ref | `uxleigndoomoezwsxlan` |
| URL API | `https://uxleigndoomoezwsxlan.supabase.co` |
| Região | `eu-central-1` |
| Estado | `ACTIVE_HEALTHY` |
| Criado | 2026-07-05 |
| Organização | Mesma que produção (`gziptddhojeqexzelvcm`) |

### Estado da base de dados (verificado read-only)

| Verificação | Resultado |
|-------------|-----------|
| Tabelas `public` | **0** |
| `auth.users` | **0** |
| Migrations remotas (001–036) | **0** (histórico vazio) |
| Dados operacionais | **Nenhum** |

**Conclusão:** instância nova, vazia, adequada para staging técnico.

---

## 3. Relação com Edition (`edition.haxrsignature.com`)

### Edition produção

- `projecto_haxrsignature/.env.local` aponta para **`oxsrdmydlqyvnueedgtl`** (produção).
- Vercel `projecto-haxrsignature-edition` (production) tem `NEXT_PUBLIC_SUPABASE_*` configurados.
- RSVPs e eventos reais (ex. Jessica & Samuel) persistem na BD de **produção**.

### Edition preview (Vercel PR/branch)

- **Sem** variáveis `NEXT_PUBLIC_SUPABASE_*`.
- Usa `HAXR_API_BACKEND=proxy` + `HAXR_CORE_API_BASE_URL` → proxy para API Core.
- **Não** liga directamente ao preview Supabase.

### Ligação ao `uxleigndoomoezwsxlan`

| Pergunta | Resposta |
|----------|----------|
| `uxleigndoomoezwsxlan` alimenta `edition.haxrsignature.com`? | **Não** |
| Referência no código/repos? | **Nenhuma** (`grep` sem matches) |
| Deploy público confirmado? | **Não** |
| Pipeline GitHub Edition (`SUPABASE_DB_URL`)? | Documentado em `projecto_haxrsignature`, secret **não** no repo; BD preview vazia sugere pipeline ainda não usado para seed |

**Conclusão:** aplicar migrations em `uxleigndoomoezwsxlan` **não afecta** o Edition em produção.

---

## 4. Confirmação — sem dados operacionais no preview

Consultas read-only em `uxleigndoomoezwsxlan`:

| Domínio | No preview |
|---------|------------|
| `auth.users` | 0 |
| `events` | Tabela inexistente (schema vazio) |
| `guests` | Inexistente |
| `rsvps` | Inexistente |
| `payments` | Inexistente |
| Concierge (`concierge_*`, `concierge_portal_*`) | Inexistente |

**Não há dados de clientes, demos activos ou RSVPs reais no preview.**

---

## 5. É seguro usar como staging?

### Sim — com condições

| Critério | Avaliação |
|----------|-----------|
| Isolamento da produção | ✅ BD separada |
| Risco para Edition | ✅ Edition usa produção |
| Perda de dados | ✅ Nenhum dado a perder |
| Deploy público afectado | ✅ Nenhum confirmado |
| Migration 036 additive | ✅ Não altera `events` operacional |

### Pré-requisito obrigatório

O preview está **vazio**. Antes da `036_client_app_auth.sql` é necessário aplicar a base **`001–035`** (schema completo do Core).

---

## 6. Ferramentas e armadilhas

### Supabase CLI (usar para apply)

- Ficheiro `supabase/.temp/project-ref` deve ser **`uxleigndoomoezwsxlan`** antes de qualquer `db push`.
- Comando de verificação:
  ```bash
  type supabase\.temp\project-ref
  # Esperado: uxleigndoomoezwsxlan
  ```

### MCP `user-supabase` (NÃO usar para apply)

- `get_project_url` devolve **`https://oxsrdmydlqyvnueedgtl.supabase.co`** (produção).
- `execute_sql` / `apply_migration` via MCP **atingiriam produção**.
- **Proibido** usar MCP nesta fase.

### `.env.local` do Core

- Aponta para **produção** (`oxsrdmydlqyvnueedgtl`).
- **Não** alterar para preview sem criar ficheiro separado (ex. `.env.staging.local` — opcional, não obrigatório se usar `--linked`).

---

## 7. Riscos

| ID | Risco | Severidade | Mitigação |
|----|-------|------------|-----------|
| R1 | Apply acidental em `oxsrdmydlqyvnueedgtl` | 🔴 Crítico | Verificar `project-ref` + confirmação escrita antes do push |
| R2 | Uso do MCP `user-supabase` | 🔴 Crítico | Não usar MCP; só CLI com link correcto |
| R3 | Preview vazio — `036` sem base `001–035` | 🔴 Crítico | Apply em duas fases (ver `036_PREVIEW_APPLY_PLAN.md`) |
| R4 | Versões duplicadas `028` e `030` no folder migrations | 🟡 Médio | Monitorizar output do `db push`; produção já absorveu — esperado OK |
| R5 | Confundir `.env.local` (prod) com staging | 🟡 Médio | Nunca correr scripts que leiam `SUPABASE_DB_URL` de `.env.local` sem override |
| R6 | CLI linked ao projecto errado após sessão | 🟡 Médio | Checklist pré-apply em cada sessão |
| R7 | `db reset` no projecto errado | 🔴 Crítico | Triple-check `project-ref` antes de reset |

---

## 8. Regras — não confundir preview com produção

1. **Nunca** aplicar migrations via MCP `user-supabase` nesta fase.
2. **Nunca** correr `supabase db push`, `db reset` ou `migration repair` sem confirmar `supabase/.temp/project-ref === uxleigndoomoezwsxlan`.
3. **Nunca** alterar `projecto_haxrsignature/.env.local` nem Vercel Edition.
4. **Nunca** assumir que Vercel Preview do Core usa o preview Supabase — vars encriptadas; preview BD está vazia.
5. **Sempre** pedir confirmação explícita antes do apply:
   ```
   CONFIRMO: aplicar migrations no preview uxleigndoomoezwsxlan.
   NÃO aplicar em oxsrdmydlqyvnueedgtl.
   ```
6. **Só** após RLS verde no preview → avançar Fase B (Supabase Auth no sign-in).
7. Produção (`oxsrdmydlqyvnueedgtl`) só recebe `036` após staging + Fase B validados — decisão futura separada.

---

## 9. Mapa de ambientes (referência rápida)

```
www.haxrsignature.com          ──► oxsrdmydlqyvnueedgtl (produção)
edition.haxrsignature.com      ──► oxsrdmydlqyvnueedgtl (produção)
Edition Vercel Preview         ──► proxy Core API (sem Supabase directo)
haxr-business-suite-preview    ──► uxleigndoomoezwsxlan (staging técnico Core)
haxrsignature .env.local       ──► oxsrdmydlqyvnueedgtl (dev local = produção)
MCP user-supabase              ──► oxsrdmydlqyvnueedgtl ⚠️ produção
```

---

## 10. Próximos passos

| Fase | Documento | Estado |
|------|-----------|--------|
| A.1 | `docs/036_CLIENT_APP_AUTH_REVIEW.md` | ✅ Revisão estática |
| A.1.1 | Ajustes no SQL `036` | ✅ No draft local |
| **A.1.2** | Este relatório | ✅ Concluído |
| **A.2** | `docs/036_PREVIEW_APPLY_PLAN.md` | 📋 Plano — aguarda confirmação humana |
| A.3 | Validação RLS/Auth no preview | ⏳ Após apply |
| B | Supabase Auth no sign-in | ⛔ Bloqueado até A.3 verde |

---

## 11. Documentos relacionados

- `docs/036_CLIENT_APP_AUTH_REVIEW.md` — revisão estática da migration
- `docs/036_STAGING_VALIDATION_REPORT.md` — relatório anterior (bloqueado por falta de staging; **supersedido** por este documento para o alvo preview)
- `docs/036_PREVIEW_APPLY_PLAN.md` — plano operacional de apply
- `docs/ONBOARDING_EVENT_CREATION_SPEC.md` — spec funcional Fase Auth

---

## Actualização — execução concluída (Fase A.4)

> As migrations `001–035` (Fase A) e `036` (Fase B do apply) foram aplicadas e validadas no preview `uxleigndoomoezwsxlan`. RLS/Auth: **18 PASS · 1 SKIP · 0 FAIL**. Produção `oxsrdmydlqyvnueedgtl` **não** foi alterada.
>
> Gate de continuação documentado em `docs/PHASE_B_AUTH_GATE.md`. Nota sobre versões duplicadas (`028`/`030`) resolvida via renomeação para `0281`/`0301`/`0302` — ver o gate, §6.

---

*Relatório gerado sem apply, sem commit, sem alterações ao Edition ou à produção.*
