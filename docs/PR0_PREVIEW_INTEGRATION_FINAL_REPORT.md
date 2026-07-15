# PR0 Preview — Relatório final (Fases 1A → 1D)

**Data:** 2026-07-15  
**Âmbito:** Preview-only Core ↔ Edition · clone `rkkxfrwtmsqzpnbkshnd`  
**Prod proibida:** `oxsrdmydlqyvnueedgtl`  
**Smoke Event A:** `64b791b4-49c4-4b55-a8a0-99424c3d7167`

---

## Estado obrigatório (Fase 1D)

| Item | Estado |
|------|--------|
| Core PR #7 | **Ready for Review** · não merged · tip `0435be8` |
| Edition PR #5 (A) | **Ready for Review** · não merged · `12280fc` · base `main` |
| Edition PR #6 (B) | **Ready for Review** · não merged · `10e61e9` · base `feature/edition-security-slugs` |
| Edition PR #7 (C) | **Ready for Review** · não merged · `f5ba252` · base `feature/edition-security-slugs` |
| Edition PR #4 | **CLOSED** superseded · branch preservada · tip `3830734` · não merged |
| `WRITE_MODE` | **disabled** |
| guests / events / stray | **139** / **7** / **0** |
| Merge / migrations / RSVPs novos | **nenhum** |
| `productionTouched` | **false** |

---

## Links

| PR | URL |
|----|-----|
| Core #7 | https://github.com/MrDimande/haxrsignatureweb/pull/7 |
| Edition A #5 | https://github.com/MrDimande/haxrsignature-edition-engine/pull/5 |
| Edition B #6 | https://github.com/MrDimande/haxrsignature-edition-engine/pull/6 |
| Edition C #7 | https://github.com/MrDimande/haxrsignature-edition-engine/pull/7 |
| Edition #4 (superseded) | https://github.com/MrDimande/haxrsignature-edition-engine/pull/4 |

---

## Áudio `famba-kwatsi.mp3`

**Mantido** no PR C (#7 Edition) por instrução do proprietário (não remover automaticamente por falta de licença).  
Credit/disclaimer no tema; **prova comercial in-repo não verificada**. Remoção apenas se o proprietário pedir. Inventário: `docs/ASSET_LICENSES.md` no PR C.

---

## Checks (worktrees limpos)

| PR | lint | tsc | test | build | secret scan |
|----|------|-----|------|-------|-------------|
| Core #7 | ok (prévio 1C) | baseline 136=136 | edition 74 pass + npm 484 | Preview READY; local build precisa env | limpo |
| Edition #5 | 0 | 0 | 56 pass | 0 | limpo |
| Edition #6 | 0 | 0 | 67 pass | 0 | limpo |
| Edition #7 | 0 | 0 | 56 pass | 0 | limpo |

---

## Matriz ficheiros Edition #4 → novos PRs

| Ficheiro (tip `3830734`) | Destino |
|--------------------------|---------|
| `lib/invitations/allowlist.ts` (+ test) | **A #5** |
| `lib/email/escape-html.ts` (+ test), brand-shell, templates | **A #5** |
| `lib/gifts.ts`, `lib/gifts/public-gifts.test.ts` (PII only) | **A #5** |
| `core/contracts/gifts.contract.ts`, `app/api/gifts/route.ts` | **A #5** |
| `lib/rsvp/parse-attending.ts`, `validate-local*`, `events.ts`, `send-notification.ts` | **A #5** |
| `lib/engine.ts` (allowlist wiring) | **A #5** (+ C restaura tests tema) |
| `data/invitations.ts` getInvitation ALIAS | **A #5**; activação primavera | **C #7** |
| `engines/.../rose-elegance/GiftRegistry.tsx` | **A #5** |
| `package.json` test globs | **A #5** |
| `lib/control-plane/*` proxy + bypass | **B #6** |
| `app/api/rsvp/route.ts` limits + proxy path | **B #6** |
| `.env.example` proxy envs | **B #6**; traditional event id | **C #7** |
| `theme/*` primavera, `engines/.../primavera-lobolo/*` | **C #7** |
| `TrueThemeEngine`, Ambient/Composition/FlowRouter | **C #7** |
| `lib/jessica-samuel-traditional/event-details.ts`, `lib/rsvp/config.ts` traditional | **C #7** |
| `app/globals.css` | **C #7** |
| `public/audio/famba-kwatsi.mp3` | **C #7** (mantido) |
| `public/images/traditional-wedding/jessica-samuel-hero.png` | **C #7** |
| `docs/ASSET_LICENSES.md` | **C #7** (novo) |
| Proxy fail-closed tests | **B #6** (`proxy-config-fail-closed.test.ts`) |

Nada necessário ficou só no #4: cobertura completa via #5+#6+#7.

---

## Dependências empilhadas

```
main
 └── PR A #5  feature/edition-security-slugs
      ├── PR B #6  feature/edition-core-rsvp-proxy
      └── PR C #7  feature/edition-primavera-lobolo-theme
```

Após merge de #5: retarget #6 e #7 para `main`. Não mergear B/C antes de A.

---

## Fase 1B (resumo)

Write gate `386ba78`; disabled → 503; preview_clone controlado `139→140→139`; restore disabled; cleanup stray.

---

## Riscos residuais

- Grants/candidata só no clone; 036–043 por reconciliar  
- WRITE produção disabled  
- Protection same-team mitigado pelo write gate  
- Áudio: rights confirmation pendente do proprietário  
- `productionTouched=false`

---

## Conclusão 1D

Preparação de review completa. **Nenhum merge.** Nenhum touch Production. PRs Ready conforme tabela acima.
