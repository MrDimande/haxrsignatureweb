# Relatório de Elevação — HAXR Signature

Data: Junho 2026  
Objectivo: Reforçar posicionamento premium, conversão e operação (Resend + Brevo) sem reconstruir o website.

## Branding e metadata

| Superfície | Estado |
|------------|--------|
| `public/favicon.png` | Criado a partir do ícone oficial (`src/app/icon.png`) |
| `src/app/icon.png` | Mantido (aba do navegador) |
| `public/apple-touch-icon.png` | Existente |
| `site.webmanifest` | Referencia favicon e apple-touch-icon |
| Open Graph / Twitter | Via `src/app/opengraph-image.tsx` + metadata global |
| Redirect `/plataforma` | → `/plataforma-eventos` |
| Redirect `/gestao-de-convidados` | → `/gestao-convidados` |

## Copy e páginas editoriais

- **Home** — `homeHowWeWork` reforça planeamento, operação e relatórios.
- **Assessoria** — Fases Antes / Durante / Depois com granularidade (planeamento, fornecedores, contratos, cerimonial, avaliação).
- **Convites** — Secção «O que curamos» (save the date, monogramas, seating charts, etc.).
- **Gestão de convidados** — Secção «Plataforma por detrás do serviço» (RSVP, Find Your Seat, QR, Sheets).
- **Plataforma HAXR** — Reposicionada como extensão da assessoria, não como software.
- **Portal Exclusivo HAXR** — Substitui linguagem «em breve» na área do cliente.
- **Insights** — Categorias SEO alinhadas; estado «Em preparação editorial».
- **Navegação** — «Plataforma» com URL `/plataforma`.

## Brevo — funil completo

| Dia | Email | Variável env |
|-----|-------|--------------|
| 0 | Boas-vindas lead (+ newsletter se opt-in) | imediato no sync |
| 3 | Portfólio / pacotes | `BREVO_FUNNEL_PORTFOLIO_DAYS` |
| 7 | Experiências | `BREVO_FUNNEL_EXPERIENCES_DAYS` |
| 14 | Pedido de reunião | `BREVO_FUNNEL_MEETING_DAYS` |
| 21 | Última chamada | `BREVO_FUNNEL_LAST_CALL_DAYS` |

**Migration:** `024_brevo_funnel_experiences_meeting.sql` — colunas `brevo_experiences_sent_at`, `brevo_meeting_sent_at`.

**Acção necessária:** Aplicar migration em produção (Supabase) antes do cron enviar novos passos.

## Resend — templates

- **Shell partilhado:** `src/lib/email/brand-shell.ts`
- **Contacto:** `src/lib/contact/emails.ts` refactorizado
- **Eventos (RSVP, find-seat, check-in, proposta):** `src/lib/email/templates/event.ts` — prontos para integração nos fluxos de evento

## Automações futuras

Registo extensível em `src/lib/automations/registry.ts` — funil Brevo, contacto Resend, campanhas editoriais e portal (desactivados até implementação).

## Validação

Executar após deploy:

```bash
npm run build
npm run verify:qa
npm run verify:jsonld
npm run verify:brevo
```

Actualizar variáveis Vercel (novos dias do funil):

```bash
npm run vercel:env
```

## Notas

- Nenhuma migration anterior foi removida.
- Fluxos admin, eventos e formulário de contacto preservados.
- Canonical SEO da plataforma mantém `/plataforma-eventos`; `/plataforma` é alias permanente.
