# PR0 Preview — Relatório final (Fases 1A → 1G)

**Estado:** **PR0 OFICIALMENTE FECHADA** (2026-07-16)  
**Data:** 2026-07-16  
**Âmbito:** Preview rehearsal → merge controlado PR0 → incidente RSVP + hotfix fail-closed  
**Clone:** `rkkxfrwtmsqzpnbkshnd` (não tocado na 1G)  
**Prod Core / Edition Supabase:** `oxsrdmydlqyvnueedgtl`

**Próximo ciclo (fase separada):** activação controlada do RSVP em Production — pré-requisitos: grants versionados, migration candidata, reconciliação 036–043, variáveis proxy e activação deliberada do Core (nunca por fallback ou valor implícito).

---

## Fase 1G — Incident response + hotfix fail-closed

### Contenção

| Check | Resultado |
|-------|-----------|
| Novos probe POST RSVP | **suspensos** (nenhum POST Production nesta fase) |
| Core Production WRITE_MODE | **ausente** → código `disabled` / Production bloqueada |
| Clone guests | **139** (inalterado; 1G sem writes no clone) |
| Automação a repetir probe | **não encontrada** |

### Causa raiz

1. Edition Production **não** tinha `HAXR_API_BACKEND` (nem proxy secret / core base / fallback).  
2. `resolveApiBackend()` fazia default **`local`** quando ausente/inválido.  
3. `POST /api/rsvp` → `handleLocalRsvpPost` → persistência Supabase Production via `submit_edition_rsvp` + queue assíncrona Resend.  
4. HTTP **200** `success` porque o handler local concluiu persistência.

### Inventário env Production (nomes apenas)

**Presentes:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `EDITION_EVENT_JESSICA_*`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_BRAND_DOMAIN`, `CONTACT_NOTIFY_EMAIL`, `NEXT_PUBLIC_SITE_URL`, …

**Ausentes:** `HAXR_API_BACKEND`, `HAXR_PROXY_FALLBACK`, `HAXR_CORE_API_BASE_URL`, `HAXR_EDITION_PROXY_SECRET`, `HAXR_ALLOW_LOCAL_RSVP`, Core `HAXR_EDITION_RSVP_WRITE_MODE`.

### Side effects (booleanos)

| Flag | Valor |
|------|-------|
| `localRecordFound` | **true** (guest `c9fa41f7-…`, event traditional, `guest_source=edition_rsvp`, status declined) |
| `emailAttemptFound` | **true** — houve tentativa interna de envio e registos de fila/auditoria (Edition + Core `Convite reenviado por email` ×2) |
| `emailDelivered` | **false** — não foi encontrada evidência de entrega externa ao destinatário ou ao organizador |
| `emailBounced` | **false** — estado de bounce **não pôde ser confirmado** no Resend (`vercel env pull` sem secretos; Brevo sem hits) |
| `organizerNotificationFound` | **false** — sem evidência de entrega externa ao organizador |
| `webhookFound` | **false** |
| `analyticsEventFound` | **false** |

Request técnico: `requestId=333b4302-a539-4726-91d9-33866dfa0d0e` · `persisted=true` · `emailSent=false` no stage `complete` (email é async pós-resposta).

### Cleanup exacto

| Item | Resultado |
|------|-----------|
| Match | name/email/id/`edition_rsvp` — **1** guest, **3** audit rows |
| Removido | guest `c9fa41f7-…` + audit relacionados |
| Remaining probe | **0** guests / **0** audit |
| Emails históricos | **não apagados** (não canceláveis pós-envio) |

### Hotfix

| Item | Resultado |
|------|-----------|
| PR | https://github.com/MrDimande/haxrsignature-edition-engine/pull/8 |
| Merge SHA | `00d21e920579a384116055cbe12459735dc43514` |
| Checks locais | lint / tsc / **81** tests / build / secret scan **PASS** |
| Vercel PR | Preview **pass** |
| Deployment Production | **READY** `dpl_1eZRdepAp5PzZ7NwXoEdrLAxuH4c` (`…-od6i0wbsk…`) |
| Validação sem POST | GET `/` + invite **200**; artefacto `main` contém `rsvp_backend_not_configured`; testes fail-closed |

Comportamento novo: Production com backend ausente/inválido/`local` → **HTTP 503** `rsvp_backend_not_configured` **antes** de persist/email. `HAXR_PROXY_FALLBACK` **nunca** activa local em Production.

### Flags finais (sem `unknown`)

| Flag | Valor |
|------|-------|
| `productionDeploymentTouched` | **true** |
| `productionDataTouched` | **true** (guest sintético criado na 1F; removido na 1G) |
| `productionEmailSideEffect` | **true** (fila + auditoria = efeito operacional; sem evidência de entrega externa; bounce não confirmável no Resend) |
| Migrations | **nenhuma** |
| Grants | **inalterados** |
| Clone guests | **139** |
| Core WRITE_MODE Production | **ausente / bloqueado** |
| RSVP Production activado | **não** (`HAXR_API_BACKEND` continua ausente → fail-closed 503) |

---

## Fase 1F — Merge controlado

### Preflight Production (antes do 1.º merge)

| Check | Resultado |
|-------|-----------|
| Merge em `main` dispara Vercel Production | **Sim** (esperado) |
| Auto-migration on deploy | **Não** (`vercel.json` só crons; candidata fora de numbered apply) |
| Core Production `HAXR_EDITION_RSVP_WRITE_MODE` | **ausente** → default código `disabled` |
| Core Production `HAXR_EDITION_RSVP_ALLOWED_SUPABASE_REF` | **ausente** |
| Core Production bypass secret | **ausente** |
| Edition Production `HAXR_PROXY_FALLBACK` / `HAXR_API_BACKEND` | **ausentes** no inventário (fallback local default; proxy off) |
| Write gate código | Production runtime sempre bloqueada mesmo se mode≠disabled |

**GO merge:** autorizado após preflight limpo.

### Merges

| PR | Merge SHA | Deployment | Resultado |
|----|-----------|------------|-----------|
| Edition #5 | `9486023` | `projecto-haxrsignature-edition-5ehozrykn…` READY | **MERGED** |
| Edition #6 | `8f0c659` | `…-7yqy4we3h…` READY | **MERGED** (base retarget→main; checks PASS) |
| Edition #7 | `235122c` | `…-pqc4xnyyd…` READY · tip `main` | **MERGED** |
| Core #7 | `76596d5` | `haxrsignatureweb-qqa3ointd…` READY | **MERGED** |
| Edition #4 | — | — | **CLOSED superseded** (inalterado) |
| Edition #8 (hotfix 1G) | `00d21e9` | `…-od6i0wbsk…` READY | **MERGED** |

`edition_main=00d21e9` · `core_main=76596d5`

### Retarget

Após #5: bases de #6/#7 → `main`; merge de `origin/main` nas branches (sem force-push destrutivo); diffs limitados ao respectivo âmbito; lint/tsc/test PASS.

### Probes pós-merge (read-only pretendido)

| Probe | Resultado |
|-------|-----------|
| `https://www.haxrsignature.com/` | **200** |
| `/admin` | **200** |
| `https://edition.haxrsignature.com/` | **200** |
| `/jessicaesamueltraditionalwedding` | **200** |
| Core `POST /api/v1/edition/rsvp` sem Bearer | **401** `Não autorizado.` (sem PII/secrets) |
| Edition `POST /api/rsvp` | **200 sucesso** — **incidente de probe** (contido + limpo na 1G) |

#### Incidente (obrigatório)

Durante o probe HTTP pós-merge foi enviado **um** POST a `edition.haxrsignature.com/api/rsvp` (payload sintético `PR0 1F Readonly` / `pr0-1f-readonly@example.invalid`).  
Resposta **200** sucesso (path local Edition; proxy Core não configurado em Production).

Resolução: ver **Fase 1G** (cleanup + hotfix fail-closed).

**Não** foi usado Bearer Core; Core Production RSVP permanece bloqueado (**401** / write gate).  
**Clone** — guests **139**; sem writes no clone.

**Correcção processual:** probes Edition em Production devem ser **GET apenas**; nunca POST RSVP.

### Estado operacional final

| Campo | Valor |
|-------|-------|
| Migrations | **nenhuma** |
| Grants produção | **inalterados** |
| WRITE_MODE Production | **ausente / bloqueado pelo código** |
| Core RSVP Production | **bloqueado** |
| Clone guests | **139** |
| Edition #4 | closed superseded |
| `productionDeploymentTouched` | **true** |
| `productionDataTouched` | **true** (probe 1F; cleaned 1G) |
| `productionEmailSideEffect` | **true** (fila/auditoria = efeito operacional; entrega externa não confirmada) |

### Riscos residuais (activação futura RSVP Production)

1. Manter WRITE_MODE ausente/`disabled` até GO explícito.  
2. Configurar `HAXR_API_BACKEND=proxy` só com gate+grants Production revistos.  
3. Manter `HAXR_PROXY_FALLBACK=false` (ignorado em Production pós-hotfix).  
4. Reconciliar 036–043; aplicar candidata só com GO.  
5. ~~Auditar residual probe~~ **feito na 1G**.

### Ordem efectuada

1. Edition #5 → 2. retarget #6/#7 → 3. Edition #6 → 4. Edition #7 → 5. Core #7 → 6. Edition #8 hotfix fail-closed
