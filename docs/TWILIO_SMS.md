# Twilio SMS — Messaging abstraction (fail-closed)

Provider SMS separado do WhatsApp. **Não** partilha o número manual HAXR (`+258 87 088 3428`). **Não** activa envio real por defeito.

## Abstracção (`src/lib/messaging/`)

| Tipo | Papel |
|------|--------|
| `MessagingProvider` | Contrato de envio |
| `MessagingChannel` | Canal (`manual_whatsapp`, `whatsapp_sandbox`, `whatsapp_production`, `sms_sandbox_or_test`, `sms_production`) |
| `MessagingMessage` | Corpo + idempotency key + URL |
| `MessagingRecipient` | Destinatário E.164 + flags opt-out / WhatsApp delivered |
| `MessagingResult` | Resultado + dry-run + segmentos + aviso de custo |
| `MessagingStatus` | `queued` → `sent` → `delivered` / `failed` / `undelivered` |
| `MessagingWebhookEvent` | Evento de StatusCallback |

## Modos SMS

```bash
HAXR_SMS_SEND_MODE=disabled|sms_sandbox_or_test|sms_production
```

| Modo | Comportamento |
|------|----------------|
| `disabled` (default) | Nada envia |
| `sms_sandbox_or_test` | Adapter + dry-run; allowlist; sem convidados reais |
| `sms_production` | **Fail-closed** neste PR — requer GO humano futuro + número SMS dedicado |

Respeita o espírito de `HAXR_WHATSAPP_SEND_MODE` (canais WhatsApp continuam independentes).

## Variáveis server-only (sem `NEXT_PUBLIC_`)

```bash
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_SMS_FROM=          # número Twilio SMS dedicado — NÃO inventar; NÃO usar +258 87 088 3428
TWILIO_STATUS_CALLBACK_URL=https://www.haxrsignature.com/api/webhooks/twilio/sms-status
TWILIO_SMS_SANDBOX_ALLOWLIST=25884XXXXXXX
# false = dry-run (default). true = chama API (só allowlist; ainda exige modo sandbox)
HAXR_TWILIO_SMS_LIVE_SEND=false
HAXR_SMS_SEND_MODE=disabled
```

**Nunca** assumir que o mesmo número envia SMS e WhatsApp. `TWILIO_SMS_FROM` ≠ `TWILIO_WHATSAPP_FROM`.

Se `TWILIO_SMS_FROM` for configurado como `+258870883428`, a config **rejeita** (fail-closed).

## Funcionalidades

- Builder SMS curto com URL do convite
- Contagem de caracteres + detecção GSM-7 / Unicode
- Estimativa de segmentos + aviso de custo (informativo)
- Chaves de idempotência
- Stubs: fila, throttling, retries, audit trail, opt-out
- Webhook skeleton com validação `X-Twilio-Signature` (reutiliza `twilio-signature`)
- Estados: delivered / failed / undelivered
- Preview fail-closed sem credenciais (mocks + dry-run)

## Fallback WhatsApp → SMS

**Não é automático.**

1. Operador vê falhas WhatsApp.
2. Confirma a acção exacta: **"Enviar SMS aos que falharam"**.
3. Destinatários com WhatsApp já `delivered` são **excluídos** (sem duplicar).

Ver `planWhatsappToSmsFallback` / `confirmWhatsappToSmsFallback`.

## Segurança

- Fail-closed sem secrets / allowlist / modo disabled / production
- Assinatura Twilio obrigatória no webhook
- Tokens nunca em client bundle nem em logs de audit (só prefixos SID / códigos)
- Sem `NEXT_PUBLIC_` para credenciais

## Testes

```bash
node --import tsx --test src/lib/messaging/**/*.test.ts
```

Incluído no script `npm test`.

## O que este PR NÃO faz

- Não activa SMS live
- Não inventa `TWILIO_SMS_FROM`
- Não migra `+258 87 088 3428` para Twilio
- Não faz merge com a PR de campanhas WhatsApp
- Não envia mensagens reais sem `HAXR_TWILIO_SMS_LIVE_SEND=true` + modo sandbox + allowlist
