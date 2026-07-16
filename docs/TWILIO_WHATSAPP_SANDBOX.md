# Twilio WhatsApp Sandbox — HAXR Campaigns

Provider automático para campanhas de convites. Começa **exclusivamente** no Twilio Sandbox.

## Modos

```bash
HAXR_WHATSAPP_SEND_MODE=disabled|manual|twilio_sandbox|twilio_production
```

| Modo | Comportamento |
|------|----------------|
| `disabled` (default) | Nada envia |
| `manual` | wa.me com sender **HAXR Signature +258 87 088 3428**; operador confirma |
| `twilio_sandbox` | Fila + idempotência + retries + status callbacks; só allowlist |
| `twilio_production` | **Bloqueado** neste PR — preparar número dedicado depois |

**Nunca** registar `+258 87 088 3428` na Twilio. Production usará um **segundo número dedicado**.

## Variáveis server-only (sem `NEXT_PUBLIC_`)

```bash
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_STATUS_CALLBACK_URL=https://www.haxrsignature.com/api/webhooks/twilio/whatsapp-status
TWILIO_SANDBOX_ALLOWLIST=25884XXXXXXX
# Opcional — default false. Sem isto, a fila faz dry-run (sem chamada API).
HAXR_TWILIO_LIVE_SEND=false
```

## Passos exactos — Sandbox

1. Conta Twilio → **Messaging → Try it out → Send a WhatsApp message**.
2. Anotar o número Sandbox (ex.: `+1 415 523 8886`) → `TWILIO_WHATSAPP_FROM=whatsapp:+14155238886`.
3. No telemóvel de teste, enviar ao Sandbox a frase `join <código>` mostrada no console.
4. Copiar Account SID e Auth Token (Console → Account) para `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` (Vercel Preview/Production **Encrypted**, server-only).
5. Definir `TWILIO_SANDBOX_ALLOWLIST` com o(s) telemóvel(eis) que fizeram `join` (E.164 sem `+`, separados por vírgula). **Nenhum convidado real.**
6. Publicar o endpoint de status (este repo):
   - Path: `/api/webhooks/twilio/whatsapp-status`
   - Configurar a URL pública exacta em `TWILIO_STATUS_CALLBACK_URL` (a assinatura Twilio usa esta URL).
7. Em Preview:
   ```bash
   HAXR_WHATSAPP_SEND_MODE=twilio_sandbox
   HAXR_TWILIO_LIVE_SEND=false
   ```
   Validar dry-run (estados `queued`, SIDs `DRYRUN_*`) sem mensagens reais.
8. Só depois de validar assinatura + allowlist, e **com GO humano**, definir `HAXR_TWILIO_LIVE_SEND=true` no Preview — ainda só números allowlisted do Sandbox.
9. **Não** activar `twilio_production` neste PR.

## Segurança

- Validação obrigatória de `X-Twilio-Signature` (HMAC-SHA1 + `TWILIO_AUTH_TOKEN`).
- Fail-closed se faltar qualquer secret ou allowlist (sandbox).
- `TWILIO_WHATSAPP_FROM` igual a `+258870883428` é rejeitado.
- Tokens nunca em client bundle / plaintext em metadata.

## Estados de entrega

`queued` → `sent` → `delivered` → `read` (ou `failed`). Regressões de estado são ignoradas.
