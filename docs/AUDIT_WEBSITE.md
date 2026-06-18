# HAXR Signature — Auditoria do Website

**URL:** https://www.haxrsignature.com  
**Data:** 18 Junho 2026  
**Âmbito:** site institucional, SEO, integrações, segurança, operação comercial

---

## Veredicto geral

| Área | Nota | Estado |
|------|------|--------|
| Presença & copy | 9/10 | Premium, coerente, posicionamento claro |
| SEO técnico | 8.5/10 | JSON-LD, robots, canonical www |
| Performance | 8/10 | Home ~173 kB First Load JS |
| Conversão | 8.5/10 | CTAs, WhatsApp, formulário, funil Brevo |
| Segurança | 8/10 | Base sólida; `ADMIN_SESSION_SECRET` independente |
| Operação | 9/10 | Brevo, Resend, Supabase, cron configurados |

**Conclusão:** site pronto para operação comercial. Sem bloqueantes críticos.

---

## Produção (verificado)

| Verificação | Resultado |
|-------------|-----------|
| `www.haxrsignature.com` | 200 OK |
| Apex → www | 308 redirect |
| HSTS | Activo |
| `/sitemap.xml` | 200 OK |
| `/robots.txt` | Admin/API/eventos bloqueados |
| Homepage conteúdo | Hero, universo, casos, testemunhos OK |

---

## SEO

- 10 páginas marketing com JSON-LD válido (`npm run verify:jsonld`)
- Sitemap: homepage + páginas marketing + demos `/experiencias/`
- Meta title/description orientados a Maputo, convites digitais, assessoria
- Google Search Console: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` configurado

---

## Integrações

```
/contacto → Supabase (lead)
         → Resend (notificação interna)
         → Brevo (listas 5/6 + boas-vindas transaccional)
         → Cron diário (portfólio +3d, última chamada +7d)
```

| Serviço | Estado |
|---------|--------|
| Resend | OK (`RESEND_BRAND_DOMAIN=true`) |
| Brevo API | OK — Haxr Signature |
| Listas | 5 Leads · 6 Newsletter |
| Funil transaccional | OK (`verify:brevo`) |
| Cron | `vercel.json` + `CRON_SECRET` |

---

## Segurança

| Control | Estado |
|---------|--------|
| `.env.local` no `.gitignore` | OK |
| Service role só server-side | OK |
| Middleware `/admin` | OK |
| `ADMIN_SESSION_SECRET` independente | OK (pós-auditoria) |
| RSVP/check-in `noindex` | OK |
| Find-seat: código + rate limit | OK |
| Formulário: Zod + honeypot + rate limit | OK |

---

## UX & conversão

- WhatsApp flutuante (`wa.me/258870883428`)
- CTAs «Iniciar conversa» / `/contacto` com query params por serviço
- Casos reais: Vânia & Fabiao, Jéssica & Samuel
- Testemunhos com clientes reais
- Design escuro + dourado consistente; mobile-first

---

## Scripts de validação

```bash
npm run verify:qa        # auditoria rápida
npm run verify:brevo     # marketing + funil
npm run verify:jsonld    # SEO estruturado
npm run build            # build produção
```

---

## Acções pós-auditoria (concluídas)

- [x] `.env.example` actualizado (Brevo, funil, `CRON_SECRET`)
- [x] `ADMIN_SESSION_SECRET` definido em `.env.local`
- [x] Relatório QA Fase 10 actualizado (Brevo OK)

## Pendente (operacional)

- [ ] `npm run vercel:env` após alterar `ADMIN_SESSION_SECRET` (invalida sessões admin antigas)
- [ ] Redeploy Vercel se ainda não feito após sync de env
- [ ] Teste end-to-end: formulário `/contacto` → email Brevo boas-vindas

---

## Referências

- `docs/QA_FASE10_REPORT.md` — QA técnico completo
- `docs/AREA_CLIENTE_SPEC.md` — roadmap área cliente v2
