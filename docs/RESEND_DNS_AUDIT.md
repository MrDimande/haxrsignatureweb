# Auditoria DNS — Resend (haxrsignature.com)

## Comando automático

```bash
npm run verify:resend
```

Verifica:
- Domínio registado e estado no painel Resend
- Registos SPF e DKIM (via API Resend)
- Registo DMARC `_dmarc.haxrsignature.com` (lookup DNS público)
- Flag `RESEND_BRAND_DOMAIN` no ambiente local

## Configuração manual (painel Resend)

1. [resend.com/domains](https://resend.com/domains) → adicionar `haxrsignature.com`
2. Copiar registos DNS para o registrador (Spaceship / Cloudflare)
3. Aguardar propagação (até 48h)
4. Quando `verified`: definir `RESEND_BRAND_DOMAIN=true` na Vercel

## Registos esperados

| Tipo | Propósito |
|------|-----------|
| TXT (SPF) | Autoriza Resend a enviar em nome do domínio |
| CNAME/TXT (DKIM) | Assinatura criptográfica dos emails |
| TXT `_dmarc` | Política de autenticação e relatórios |

### DMARC recomendado (inicial)

```
v=DMARC1; p=none; rua=mailto:hello@haxrsignature.com
```

Após validação, evoluir para `p=quarantine` ou `p=reject`.

## Sender identities

| Canal | Remetente |
|-------|-----------|
| Contacto / RSVP | `hello@haxrsignature.com` |
| Notificações internas | `CONTACT_NOTIFY_EMAIL` |

Com `RESEND_BRAND_DOMAIN=true`, `resolveFrom()` usa endereços `@haxrsignature.com` em vez do sandbox `onboarding@resend.dev`.

## Scripts relacionados

```bash
npm run email:check-domain   # estado rápido
npm run email:verify-domain  # pede re-verificação ao Resend
npm run verify:resend        # auditoria completa SPF/DKIM/DMARC
```

## Última verificação

Executar `npm run verify:resend` após alterações DNS e registar o resultado abaixo.

| Data | SPF | DKIM | DMARC | Domínio | Brand env | Notas |
|------|-----|------|-------|---------|-----------|-------|
| Jun 2026 | OK | OK | Configurado (propagação DNS) | verified | `true` na Vercel + local | Remetente: hello@haxrsignature.com |
