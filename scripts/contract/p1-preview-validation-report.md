# P1.1 Preview Validation Report

Generated: 2026-07-02T09:25:43.692Z
Edition Preview: https://projecto-haxrsignature-edition-bgoszdjk8.vercel.app
Core Preview: https://haxrsignatureweb-aludimande-7792-alberto-dimandes-projects.vercel.app

**Result:** 7/7 gates passed

| Gate | Name | Category | Expected | Actual | PASS |
|------|------|----------|----------|--------|------|
| T1 | honeypot safety | honeypot-nonempty | HTTP 200 | HTTP 200 | PASS |
| T2 | farewell phone required | farewell-validation-no-phone | HTTP 400 · Indique o telefone para contacto (WhatsApp). | HTTP 400 · Indique o telefone para contacto (WhatsApp). | PASS |
| T3 | missing contact | kulaya-validation-no-contact | HTTP 400 · Indique email ou telefone para contacto. | HTTP 400 · Indique email ou telefone para contacto. | PASS |
| T4 | core proxy-secret rejection | core-direct-no-secret | HTTP 401 · unauthorized envelope | HTTP 401 · Não autorizado. | PASS |
| T5 | timeout / upstream failure (local proxy) | invalid-core-base-local | HTTP 500 · controlled generic Edition error | HTTP 500 · Ocorreu um erro ao processar o seu RSVP. | PASS |
| T6 | core observability confirmation | post-test-log-audit | requestId + proxyOrigin edition + no secrets | observability fields present | PASS |
| T7 | duplicate side-effect verification | supabase-guest-audit | zero contract test guest rows | contractNames=0, recentEventGuests=0 | PASS |

## Verdict

**READY FOR P1.2 PRODUCTION PLAN**
