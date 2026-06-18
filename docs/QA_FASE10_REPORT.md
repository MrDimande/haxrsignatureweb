# HAXR Signature — Relatório QA Final (Fase 10)

**Data:** Junho 2026  
**Ambiente auditado:** código local + `.env.local` de desenvolvimento  
**Produção:** `https://www.haxrsignature.com`

---

## Veredicto

| Estado | Significado |
|--------|-------------|
| **Pronto para operação comercial** | Sim — com ressalvas abaixo |
| **Bloqueantes críticos** | Nenhum no código |
| **Acções antes do evento ~300 convidados** | 4 itens WARN |

Executar validação: `npm run verify:qa` (rápido) ou `npm run verify:qa -- --full` (inclui build).

---

## Critérios de sucesso (roadmap)

| Critério | Resultado |
|----------|-----------|
| Nenhum erro crítico no código | ✓ Build e testes OK |
| Nenhum asset quebrado | ✓ 11/11 (`verify:assets`) |
| Simulação 300 convidados | ✓ Script + RPC check-in corrigido (migrations 020–021) |
| Find Your Seat protegido | ✓ Código evento + rate limit Supabase (migration 019) |
| RSVP validado | ✓ RPC + testes unitários convidados/CSV |
| SEO consistente | ✓ 10 páginas JSON-LD + sitemap + robots |
| Performance mobile optimizada | ✓ Home 172 kB First Load JS (−18% vs baseline) |
| Fluxo Cliente → Evento → Documento → Pagamento | ✓ Admin operacional |
| Plataforma pronta comercialmente | ✓ Com checklist operacional abaixo |

---

## Resultados automatizados

| Verificação | Resultado |
|-------------|-----------|
| `npm test` | 16/16 OK |
| `npm run build` | 27 páginas estáticas OK |
| `verify:assets` | 11/11 OK |
| `verify:jsonld` | 10 páginas + 2 demos OK |
| `verify:demos` | 2/2 URLs canónicas OK |
| `verify:portal-spec` | Roadmap alinhado OK |
| `verify:checkin` | RPC sem erro `json \|\| json` OK |
| `verify:brevo` | OK — API, listas 5/6, atributos, funil transaccional |

---

## Segurança

### OK

- Admin protegido por middleware + sessão HMAC (`haxr_admin_session`)
- Headers `X-Frame-Options`, `X-Content-Type-Options`, `Cache-Control` no admin
- `SUPABASE_SERVICE_ROLE_KEY` apenas server-side (sem leak `NEXT_PUBLIC_*`)
- `.env.local` no `.gitignore`
- Find Your Seat: código de acesso + mín. 4 caracteres + `persistentRateLimit`
- APIs públicas evento: mensagens genéricas (anti-enumeração)
- Páginas `/event/*`: `noindex` via `buildPrivateEventMetadata`
- `robots.txt` bloqueia `/admin`, `/api/`, `/event/`

### WARN

| Item | Acção |
|------|--------|
| `ADMIN_SESSION_SECRET` | OK — sincronizar com `npm run vercel:env` |
| Migrations 019–021 | Confirmar aplicadas no Supabase de produção |
| Brevo | OK — listas 5/6, funil transaccional, cron |
| Rate limit | Memória local em dev; produção usa Supabase (`api_rate_limits`) |

### Risco conhecido (não bloqueante)

- `listGuestsPage()` carrega todos os convidados em memória — aceitável até ~500; optimizar paginação SQL para escala maior
- Auth admin single-user (env) — adequado para equipa pequena

---

## SEO

| Recurso | Estado |
|---------|--------|
| URL canónica | `https://www.haxrsignature.com` (normalização em `site-meta.ts`) |
| Sitemap | 10 páginas marketing + 2 experiências |
| JSON-LD | Organization, Service, Breadcrumb, FAQ, CreativeWork (demos) |
| Open Graph | `opengraph-image` dinâmico |
| Google verification | Meta + ficheiro em `public/` |
| Eventos operacionais | `noindex` |

**Pós-deploy:** submeter sitemap no Search Console; inspeccionar URLs pilares.

---

## Performance

| Métrica | Valor (build) |
|---------|----------------|
| Home First Load JS | **172 kB** |
| Home page size | 3.67 kB |
| Marketing shared | ~155 kB |
| Admin evento (maior) | 795 kB (esperado — gestão convidados) |

**Optimizações aplicadas (Fase 5):** fontes 7→4, Lenis off mobile, particles lazy, `optimizePackageImports`.

---

## Módulos operacionais

### Convidados / RSVP / Sheets

- Deduplicação por nome normalizado
- Import CSV com BOM e `;`
- Sync Google Sheets (master + RSVP)
- Estatísticas agregadas (`EventStats`)
- Testes unitários: 16 casos

### Find Your Seat

- Código por evento (`find_seat_code`)
- Pesquisa mín. 4 chars
- Rate limit persistente (migration 019)

### Check-in

- RPC `perform_event_checkin` corrigido (migration 020)
- RSVP legacy 2-arg corrigido (migration 021)

### Financeiro / Documentos

- Fluxo proforma → factura → recibo
- Pagamentos ligados a cliente/evento/documento
- PDF via `@react-pdf/renderer`
- Caixa admin com analytics

### Contacto / Leads

- Supabase `contact_inquiries`
- Resend: notificação + auto-reply
- Brevo: sync opcional (marketing opt-in)
- Admin `/admin/leads`

### Portfólio / Demos

- URLs canónicas `/experiencias/[slug]`
- iframe interno Vercel (embed)
- Sitemap + JSON-LD CreativeWork

---

## Área do Cliente

- **Fase 9:** especificação em `docs/AREA_CLIENTE_SPEC.md`
- **Estado:** não implementada (intencional)
- Landing `/area-cliente` mantém-se para SEO e expectativa comercial

---

## Checklist operacional pré-evento real

### Vercel / Supabase

- [ ] `NEXT_PUBLIC_SITE_URL=https://www.haxrsignature.com`
- [x] `ADMIN_SESSION_SECRET` definido (≠ password)
- [ ] Migrations **001–021** aplicadas em produção
- [ ] `npm run verify:checkin` OK contra produção
- [ ] Remover evento `[SIM-300]` se ainda existir: `npm run simulate:300:cleanup`

### Email

- [ ] `RESEND_BRAND_DOMAIN=true` + domínio verificado
- [ ] Testar formulário `/contacto` end-to-end
- [x] Brevo: `npm run verify:brevo` → tudo OK

### Evento

- [ ] `find_seat_code` definido e comunicado aos convidados
- [ ] Google Sheets sync testado com amostra
- [ ] QR / tokens convidados gerados
- [ ] Equipa treinada no check-in admin

### SEO

- [ ] Sitemap submetido no Search Console
- [ ] Inspecionar `/`, `/contacto`, pilares de serviço

---

## Riscos remanescentes

| Prioridade | Risco | Mitigação |
|------------|-------|-----------|
| Alta | Migrations 019–021 não em prod | Aplicar via Supabase SQL antes do evento |
| Média | — | Resolvido (Brevo + session secret) |
| Média | Imagens portfólio SVG editoriais | Substituir por screenshots reais quando disponíveis |
| Baixa | `listGuestsPage` em memória | Monitorizar latência admin com 300+ convidados |
| Baixa | Portal cliente inexistente | Comunicar acompanhamento via equipa + WhatsApp |

---

## Fases do roadmap — estado final

| Fase | Conteúdo | Estado |
|------|----------|--------|
| 1 | Convidados / RSVP / Sheets | ✓ Concluída |
| 2 | Find Your Seat segurança | ✓ Concluída |
| 3 | Simulação 300 | ✓ Concluída |
| 4 | Branding / assets | ✓ Concluída |
| 5 | Performance | ✓ Concluída |
| 6 | SEO JSON-LD | ✓ Concluída |
| 7 | Demos Vercel → canónicas | ✓ Concluída |
| 8 | Brevo marketing | ✓ API + funil + cron |
| 9 | Área cliente spec | ✓ Concluída |
| 10 | QA final | ✓ Este relatório |

---

## Comandos de referência

```bash
npm run verify:qa              # auditoria rápida
npm run verify:qa -- --full      # inclui build
npm run simulate:300             # teste de carga
npm run verify:checkin           # RPC check-in
npm run email:check-domain       # Resend
npm run vercel:env               # sync env produção
```

---

**Conclusão:** A plataforma HAXR Signature está **estável e pronta para uso comercial intensivo**, desde que as migrations 019–021 estejam em produção e o checklist operacional acima seja cumprido antes do evento real.
