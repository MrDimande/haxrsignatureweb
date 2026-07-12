# HAXR Concierge — Especificação de Produto e Arquitectura

**Versão:** 2.0 · Julho 2026
**Benchmark:** [loverly-ai-concierge-analysis.md](./benchmark/loverly-ai-concierge-analysis.md)
**Estado actual:** V1 visual ✅ · V2 admin assistido (parcial) ✅ · V3 portal (parcial) · V4 email · V5 automação

---

## 1. Visão geral do HAXR Concierge

**HAXR Concierge** é a camada inteligente da plataforma HAXR Signature que transforma documentos, emails e referências soltas em organização estruturada no painel do evento.

```
Cliente ou equipa envia documentos, listas, comprovativos, propostas e referências
        ↓
HAXR Concierge classifica e extrai dados (IA)
        ↓
Pré-visualização + fila de revisão humana
        ↓
Equipa HAXR aprova, edita ou rejeita
        ↓
Dados entram no painel: fornecedores, orçamento, convidados, moodboard, checklist, documentos
        ↓
Cliente acompanha no portal (V3+)
```

**Posicionamento público:**

> HAXR Concierge — O assistente inteligente que organiza cada detalhe do seu evento.

---

## 2. Posicionamento

### Regra de ouro

> **A IA organiza. A equipa HAXR valida. O cliente acompanha.**

### O que o Concierge **é**

- Inbox operacional premium por evento
- Motor de classificação e extracção documental
- Ponte entre caos real (PDFs, Excel, M-Pesa, emails) e painel estruturado
- Diferencial comercial dos pacotes Signature e Royal

### O que o Concierge **não é**

- Chatbot genérico de planeamento DIY
- Substituto da assessoria humana no dia do evento
- Ferramenta de marketing automático (sem sync Brevo por defeito)
- Marketplace de fornecedores

---

## 3. Diferença entre Loverly e HAXR

| Dimensão | Loverly (aiSLE Assistant™) | HAXR Concierge |
|----------|---------------------------|----------------|
| Modelo comercial | Grátis para casais | Incluído em pacotes premium / add-on |
| Aplicação de dados | Automática (sem revisão pública) | **Revisão humana obrigatória** |
| Mercado | EUA, USD, Venmo/Zelle | Moçambique, MZN, M-Pesa, e-Mola |
| Tipos de evento | Casamentos | Casamentos, noivados, lobolos, baptizados, graduações, galas, corporativo |
| Operação de evento | RSVP web + seating básico | RSVP + QR + Find Your Seat + check-in + contact profiles |
| Assessoria | Marketplace opcional | Core — equipa HAXR no circuito |
| Tom / UX | Casual, inbox US | Premium, escuro/dourado, concierge |
| Privacidade | Genérica | Operacional vs marketing separados |
| Convites | Squarespace (terceiro) | Convites digitais HAXR nativos |

---

## 4. Módulos principais

| Módulo | Função | Destino no sistema |
|--------|--------|-------------------|
| **Inbox Concierge** | Ponto único de entrada (upload, email, link) | `concierge_uploads` + fila revisão |
| **Upload de documentos** | PDF, imagens, Excel, Word, CSV, texto | Supabase Storage `concierge-uploads` |
| **Classificação automática** | Tipo documental + destino | `concierge_review_items.document_type` |
| **Extracção de dados** | JSON estruturado por tipo | `extracted_data` / schemas Gemini |
| **Revisão humana** | Aprovar, editar, rejeitar | Admin tab Concierge |
| **Fornecedores** | Propostas, contactos, valores, prazos | `event_vendors` |
| **Orçamento** | Linhas de custo, parcelas, totais | Budget / `payments` |
| **Checklist** | Tarefas sugeridas por tipo e data | `event_checklist_items` |
| **Lista de convidados** | Nomes, contactos, grupos, +1 | `guests` (import controlado) |
| **RSVP** | Confirmações ligadas a convidados | `guests.status`, RSVP público |
| **Find Your Seat** | Lugares após lista validada | `seats`, `guests.seat_id` |
| **Check-in** | QR no dia do evento | `guests.status = checked_in` |
| **Moodboard** | Referências visuais classificadas | `event_moodboard_items` |
| **Documentos** | Proformas, contratos, anexos | Admin documentos / storage |
| **Pagamentos / recibos** | M-Pesa, transferência, cash | `payments` + recibos PDF |
| **Relatórios** | Pendências, progresso, alertas | V5 — dashboard inteligente |

---

## 5. Tipos de ficheiros suportados (actual e futuro)

### Suportados hoje (V2 — `CONCIERGE_ALLOWED_MIME`)

| Tipo | MIME |
|------|------|
| PDF | `application/pdf` |
| Imagens | `image/jpeg`, `image/png`, `image/webp`, `image/gif` |
| Excel | `.xls`, `.xlsx` |
| CSV | `text/csv` |
| Word | `.doc`, `.docx` |
| Texto | `text/plain` |

### Futuro (V2+ / V4)

| Tipo | Notas |
|------|-------|
| Links clipados | URL + metadata (inspiração, fornecedor) |
| Emails encaminhados | Parsing de corpo + anexos via `concierge@haxrsignature.com` |
| Comprovativos M-Pesa | OCR de referência, valor, data, número |
| Comprovativos e-Mola | Idem M-Pesa |
| Propostas de fornecedores | PDF/Word com campos MZ (IVA, MZN, condições locais) |
| Listas de convidados | Excel/CSV com party parser integration |
| Referências visuais | Imagens, screenshots, links Pinterest/Instagram |
| Contratos | Classificação `contract` — revisão reforçada |
| WhatsApp exports | V5 — export de conversa (baixa prioridade) |

---

## 6. Fluxo completo

```
┌─────────────────────────────────────────────────────────────────┐
│ ENTRADA                                                          │
│  • Admin upload (V2)                                             │
│  • Cliente upload portal (V3)                                     │
│  • Email forward concierge@haxrsignature.com (V4)                │
│  • Link / referência visual (V4+)                                │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ RECEBIDO → storage + concierge_uploads (status: uploaded)      │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ EM ANÁLISE → processing                                          │
│  • parse texto (PDF/Excel/imagem OCR)                            │
│  • IA classifica tipo + destino                                  │
│  • IA extrai JSON estruturado                                    │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ CLASSIFICADO → pending_review                                    │
│  • Pré-visualização no Admin (ou Portal V3 — só leitura)         │
│  • Score de confiança (high / medium / low)                      │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ REVISÃO HUMANA (equipa HAXR)                                     │
│  • Aprovar → approved                                            │
│  • Editar campos → approved (final_data)                         │
│  • Rejeitar → rejected (+ motivo)                                │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ APLICADO AO EVENTO → applied_at preenchido                       │
│  • vendor_proposal → event_vendors                               │
│  • payment_receipt → payments                                    │
│  • guest_list → guests (import batch)                          │
│  • visual_reference → event_moodboard_items                      │
│  • checklist → event_checklist_items                             │
│  • contract → documentos / notas                               │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ AUDITORIA → ai_audit_logs + guest_audit (quando aplicável)       │
└─────────────────────────────────────────────────────────────────┘
```

**Crítico:** a IA **nunca** grava automaticamente em tabelas operacionais sem aprovação humana.

---

## 7. Estados possíveis

| Estado | Código | Significado |
|--------|--------|-------------|
| Recebido | `uploaded` | Ficheiro no storage, aguarda processamento |
| Em análise | `processing` | Parsing + IA em curso |
| Classificado | `pending_review` | Extracção pronta, aguarda equipa HAXR |
| Aprovado | `approved` | Equipa validou; pronto para aplicar |
| Rejeitado | `rejected` | Documento inválido, duplicado ou irrelevante |
| Falhou | `failed` | Erro técnico (parse, IA, storage) |
| Aplicado ao evento | `applied_at` ≠ null | Dados persistidos no módulo destino |

Estados de negócio adicionais (UI):

| Label PT | Quando |
|----------|--------|
| Recebido | Upload concluído |
| Em análise | Spinner IA |
| Por rever | Fila admin |
| Aprovado | Aguardando ou após apply |
| Rejeitado | Com motivo visível |
| Aplicado | Confirmado no painel |

---

## 8. Arquitectura técnica recomendada

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND                               │
│  Homepage mockup (V1) │ Admin Concierge tab │ Portal (V3)    │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                     API / Server Actions                      │
│  process-upload.service │ apply-review.service │ intake API   │
└────────────────────────────┬─────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐  ┌─────────────────┐  ┌──────────────────┐
│ Classifier    │  │ AI Provider     │  │ Storage Provider │
│ (rules+LLM)   │  │ Gemini Flash    │  │ Supabase Storage │
└───────────────┘  └─────────────────┘  └──────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                     PostgreSQL (Supabase)                     │
│  concierge_uploads │ concierge_review_items │ event_vendors  │
│  payments │ event_checklist_items │ event_moodboard_items    │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│              Módulos operacionais existentes                  │
│  guests / RSVP / seats / check-in / finance / documents       │
└──────────────────────────────────────────────────────────────┘
```

### Princípios

1. **IA como classificador + extractor**, não como fonte de verdade
2. **Repositório único** de revisão (`concierge_review_items`)
3. **Apply service** idempotente por `review_item_id`
4. **Auditoria** em cada transição de estado
5. **Fallback rule-based** quando IA indisponível (`concierge-classifier.ts`)

---

## 9. Providers de IA possíveis

| Provider | Uso recomendado | Fase |
|----------|-----------------|------|
| **Google Gemini 2.0 Flash** | Classificação + extracção JSON multimodal (PDF/imagem) | V2 actual |
| OpenAI GPT-4o-mini | Alternativa paga, boa extracção | Opcional |
| Anthropic Claude Haiku | Alternativa para contratos longos | Opcional |
| Groq (Llama) | Fallback grátis limitado | Dev/staging |
| Rule-based local | Keywords PT-MZ (M-Pesa, proposta, convidados) | V2 fallback |

**Env actual:**

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
```

**Critérios de escolha:**

- Suporte PDF + imagem nativo
- `responseMimeType: application/json`
- Custo previsível em volume de eventos premium (dezenas, não milhões)
- Latência < 15s por documento típico

---

## 10. Estrutura de pastas sugerida

```
src/lib/concierge/
├── types.ts                          # Tipos partilhados
├── schemas.ts                        # Zod / JSON schemas extracção
├── provider.ts                       # Factory AI provider
├── parse-file.ts                     # PDF, Excel, imagem → texto
├── repositories/
│   └── concierge.repository.ts       # CRUD uploads + review items
├── services/
│   ├── process-upload.service.ts     # Pipeline completo pós-upload
│   └── apply-review.service.ts       # Aplicar dados aprovados
├── portal/                           # Portal cliente (V3)
│   ├── concierge-intake.ts
│   ├── concierge-classifier.ts
│   ├── concierge-ai-provider.ts
│   ├── gemini-concierge-provider.ts
│   ├── gemini-schemas.ts
│   └── supabase-concierge-portal-repository.ts
└── actions/
    └── concierge.actions.ts          # Server actions admin

src/components/concierge/
├── ConciergePanel.tsx                # Admin tab
└── ConciergeMigrationNotice.tsx

src/components/home/
├── HomeConciergeSection.tsx          # V1 marketing
├── HomeConciergeExperience.tsx
└── HomeConciergeMockup.tsx

supabase/migrations/
├── 027_concierge.sql                 # Core tables
└── 028_concierge_portal.sql          # Portal extensions
```

---

## 11. Modelos de dados futuros

### Existentes (027/028)

| Tabela | Função |
|--------|--------|
| `concierge_uploads` | Ficheiro original + status pipeline |
| `concierge_review_items` | Extracção IA + revisão + apply |
| `event_vendors` | Fornecedores extraídos/aprovados |
| `event_checklist_items` | Tarefas |
| `event_moodboard_items` | Referências visuais |

### Futuros (requerem migração aprovada)

| Tabela | Função | Fase |
|--------|--------|------|
| `concierge_inbox_messages` | Emails encaminhados (raw MIME) | V4 |
| `concierge_apply_logs` | Auditoria apply (before/after JSON) | V2+ |
| `concierge_suggestions` | Alertas proactivos (V5) | V5 |
| `guest_import_batches` | Liga import Concierge → guests | V2 |
| `ai_audit_logs` | Trilha completa IA (prompt hash, model, tokens) | V2+ |

### Tipos enum

```sql
concierge_doc_type: vendor_proposal | payment_receipt | guest_list |
                    visual_reference | checklist | contract | other

concierge_review_status: uploaded | processing | pending_review |
                         approved | rejected | failed
```

---

## 12. APIs futuras

| Endpoint / Action | Método | Fase | Descrição |
|-------------------|--------|------|-----------|
| `POST /api/concierge/intake` | POST | V3 | Upload portal cliente |
| `POST /api/concierge/classify` | POST | V2 | Re-classificar manualmente |
| `POST /api/concierge/[itemId]/validate` | POST | V2 | Aprovar revisão |
| `POST /api/concierge/[itemId]/reject` | POST | V2 | Rejeitar |
| `POST /api/concierge/suggestions/[id]/apply` | POST | V5 | Aplicar sugestão |
| Webhook email (Resend/Inbound) | POST | V4 | `concierge@` → inbox |
| `GET /api/events/[id]/concierge/status` | GET | V3 | Status para portal |

Server actions existentes: `concierge.actions.ts` (admin upload, approve, reject).

---

## 13. Fluxos no Admin

### Tab Concierge (por evento)

```
Admin → Evento → Concierge
├── Inbox (uploads recentes)
├── Por rever (pending_review)     ← fila principal
├── Aprovados (approved/applied)
├── Rejeitados
└── Histórico IA
```

### Acções do operador

| Acção | Efeito |
|-------|--------|
| Carregar documento | Novo upload → pipeline automático |
| Ver pré-visualização | JSON extraído + ficheiro original |
| Editar campos | `final_data` antes de aprovar |
| Aprovar | Apply ao módulo destino |
| Rejeitar | Motivo + sem alteração operacional |
| Re-processar | Reenviar à IA (falha ou tipo errado) |

### Integração com módulos admin existentes

| Após apply | Admin vê em |
|------------|-------------|
| Fornecedor | Evento → fornecedores / vendors |
| Pagamento | Caixa / pagamentos |
| Convidados | Convidados (com party parser se aplicável) |
| Moodboard | Secção inspiração (futuro UI dedicada) |
| Checklist | Cronograma tarefas |

---

## 14. Fluxos no Portal do Cliente

### V3 — Cliente envia e acompanha

```
Portal → Meu evento → Concierge
├── Enviar documento (PDF, foto comprovativo M-Pesa, Excel convidados)
├── Ver status: Recebido → Em análise → Por rever → Aplicado
├── Notificação quando equipa aprova
└── Sem edição directa de dados operacionais críticos
```

### Permissões portal

| Role | Pode |
|------|------|
| Cliente | Upload, ver status, ver resumo aprovado |
| Equipa HAXR | Tudo no admin |
| Convidado | Nada (sem acesso Concierge) |

---

## 15. Fases V1–V5

### V1 — Visual / conceptual ✅

| Entrega | Estado |
|---------|--------|
| Secção homepage «Conheça o HAXR Concierge» | ✅ |
| Mockups editoriais (5 cenários: proposta, M-Pesa, convidados, moodboard, checklist) | ✅ |
| CTA contacto / iniciar projecto | ✅ |
| Sem IA real, sem email, sem BD Concierge obrigatória | ✅ |

**Ficheiros:** `HomeConciergeSection.tsx`, `HomeConciergeExperience.tsx`, `HomeConciergeMockup.tsx`

### V2 — Admin assistido (parcial ✅)

| Entrega | Estado |
|---------|--------|
| Migration `027_concierge.sql` | ✅ |
| Upload manual admin | ✅ |
| Classificação Gemini + rules fallback | ✅ |
| Fila de revisão (`pending_review`) | ✅ |
| Aprovar antes de aplicar | ✅ |
| Apply: vendors, payments, guests, checklist, moodboard | ✅ Parcial |
| Sem portal cliente | ✅ |

**Activar:** `GEMINI_API_KEY` + migration 027 + tab Concierge no evento.

### V3 — Portal do cliente

| Entrega | Estado |
|---------|--------|
| Migration `028_concierge_portal.sql` | ✅ schema |
| Cliente envia documentos | 🔲 |
| Cliente vê status em tempo real | 🔲 |
| Equipa HAXR valida no admin | ✅ (reutiliza V2) |
| Dados aparecem no painel do evento | ✅ pós-apply |
| Auth portal (`portal-concierge-auth`) | Parcial |

### V4 — Email inteligente

| Entrega | Estado |
|---------|--------|
| `concierge@haxrsignature.com` | 🔲 (mockup V1 apenas) |
| Inbound parse (Resend/similar) | 🔲 |
| Cliente encaminha propostas, recibos, listas | 🔲 |
| Anexos → mesmo pipeline V2 | 🔲 |
| Confirmação automática «recebemos o seu documento» | 🔲 |

**Inspiração Loverly:** `save@loverly.com` — HAXR com revisão humana e confirmação ao cliente.

### V5 — Automação avançada

| Entrega | Estado |
|---------|--------|
| Sugestões de checklist por tipo/data evento | 🔲 |
| Alertas orçamento (over-budget, pagamento pendente) | 🔲 |
| Fornecedores sem resposta / proposta a expirar | 🔲 |
| Convidados sem RSVP | 🔲 |
| Pagamentos por confirmar (M-Pesa não validado) | 🔲 |
| Recomendações próximos passos | 🔲 |
| Relatórios inteligentes pré-evento | 🔲 |
| Chrome clip extension | 🔲 opcional (baixa prioridade MZ) |

---

## 16. Critérios de segurança, privacidade e validação humana

### Validação humana

- Dados de **convidados**, **pagamentos** e **fornecedores** exigem `approved` + operador identificado
- `confidence: low` → sempre fila manual; nunca auto-apply
- Duplicados detectados → revisão, não merge silencioso

### Privacidade

- Uploads Concierge = **operacional** — não sync Brevo/marketing automático
- `event_contact_profiles` separado com `operational_only` por defeito
- PII em uploads: acesso restrito a admin + cliente do evento
- Retenção: manter ficheiro original para auditoria; política de purge a definir (pós-evento + 12 meses?)

### Segurança

- Limite 20 MB por ficheiro (`CONCIERGE_MAX_FILE_BYTES`)
- MIME allowlist estrita
- Storage path por evento: `events/{eventId}/concierge/...`
- Rate limit intake API (portal + email)
- Não executar código de anexos; parse só texto/imagem
- Logs sem prompts completos em produção (hash only)

---

## 17. Riscos e mitigação

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| IA classifica mal | Dados errados no evento | Revisão humana obrigatória |
| OCR M-Pesa impreciso | Valor/ref errado | Campos editáveis + confirmação |
| Duplicação convidados | Lista corrupta | Party parser + dedup + ledger |
| Custo API Gemini | Margem | Batch, cache, rules primeiro |
| Email spoofing (V4) | Spam/injeção | SPF/DKIM, allowlist remetentes cliente |
| Expectativa «IA planeia tudo» | Insatisfação | Copy honesto + assessoria humana |
| Scope creep (chatbot) | Dispersão | Manter inbox, não chat aberto |
| Dependência single provider | Downtime | Fallback rules + queue retry |

---

## 18. Roadmap de implementação

### Q3 2026 — Consolidar V2

- [ ] Completar apply paths (todos os doc types testados)
- [ ] UI pré-visualização rica no ConciergePanel
- [ ] Testes integração: upload → approve → guests/payments
- [ ] Documentar operador runbook (PT)

### Q4 2026 — V3 Portal

- [ ] Intake portal + status timeline
- [ ] Notificações email «documento recebido / aprovado»
- [ ] Auth portal hardening

### Q1 2027 — V4 Email

- [ ] Inbound `concierge@haxrsignature.com`
- [ ] Parser MIME + anexos
- [ ] Confirmação automática ao cliente

### Q2 2027 — V5 Automação

- [ ] Engine de sugestões (checklist, budget, RSVP)
- [ ] Relatório pré-evento inteligente
- [ ] Alertas proactivos admin

---

## Anexo A — Schemas de extracção (exemplos)

### Proposta de fornecedor

```json
{
  "documentType": "vendor_proposal",
  "vendorName": "Flora Maputo",
  "serviceCategory": "Decoração",
  "contactEmail": "ola@floramaputo.co.mz",
  "contactPhone": "+258841234567",
  "amount": 85000,
  "currency": "MZN",
  "paymentTerms": "50% sinal, 50% até 7 dias antes",
  "deadline": "2026-08-10",
  "notes": "Flores naturais, montagem incluída",
  "confidence": "high"
}
```

### Comprovativo M-Pesa

```json
{
  "documentType": "payment_receipt",
  "amount": 25000,
  "currency": "MZN",
  "paymentMethod": "m_pesa",
  "reference": "MP24070812345",
  "paidAt": "2026-07-08",
  "vendorOrService": "Sinal decoração",
  "confidence": "medium"
}
```

### Lista de convidados

```json
{
  "documentType": "guest_list",
  "guests": [
    { "name": "Ana Silva", "email": "ana@example.com", "phone": "+25884...", "plusOnes": 1 }
  ],
  "confidence": "high"
}
```

---

## Anexo B — Comercial por pacote

| Pacote HAXR | HAXR Concierge |
|-------------|----------------|
| **Essential** | Add-on opcional (upload limitado) |
| **Signature** | Incluído — upload + revisão standard |
| **Royal** | Incluído + prioridade + email inbox (V4) |
| **Assessoria completa** | Completo + alertas V5 |
| **Parceiros** (futuro) | Envio directo de propostas para inbox do evento |

---

## Anexo C — Homepage V1 (implementado)

Secção `#haxr-concierge` entre Plataforma e Ferramentas.

**Blocos:** hero interactivo · 5 cenários mockup · métodos entrada · fluxo 4 passos · 6 módulos · CTAs.

**Sem:** upload real, IA, email funcional.

---

## Anexo D — Integração com módulos HAXR existentes

| Módulo | Ligação Concierge |
|--------|-------------------|
| `src/lib/events/` | Convidados, RSVP, import CSV, party parser, contact profiles |
| `src/lib/finance/` | Pagamentos, recibos, proformas |
| `src/lib/admin/` | Clientes, documentos PDF |
| `src/lib/concierge/` | Pipeline IA + revisão |
| Portal marketing | `/tools/haxr-concierge` landing setup |

---

*Documento de referência estratégica e técnica. Sem alterações de código ou BD por este documento. Implementação incremental por fase com aprovação explícita.*
