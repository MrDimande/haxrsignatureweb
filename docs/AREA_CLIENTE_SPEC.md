# HAXR Signature — Especificação Técnica: Área do Cliente

**Fase 9 · Estabilização e Produção**  
**Estado:** Especificação aprovada para implementação incremental  
**Versão:** 1.0 · Junho 2026

---

## 1. Objectivo

Transformar a página marketing `/area-cliente` num **portal autenticado** onde clientes HAXR acompanham o projecto com a mesma clareza que a equipa tem no admin — sem expor dados operacionais sensíveis nem duplicar lógica de negócio.

**Fora de âmbito nesta fase:** implementação completa de UI e rotas.  
**Entregável:** arquitectura, modelo de dados, rotas, segurança e plano MVP → v2.

---

## 2. Situação actual

| Componente | Estado |
|------------|--------|
| `/area-cliente` | Landing marketing + roadmap (`areaClienteFuture`) |
| Admin `/admin/clients/[id]` | Vista 360° madura (eventos, docs, pagamentos, KPIs) |
| Auth | Apenas admin (cookie HMAC `haxr_admin_session`) |
| Supabase | Service role no servidor; RLS activo sem policies públicas |
| Convidados públicos | `/event/[id]/rsvp|checkin|find-seat` — token por convidado, não cliente |

### Roadmap comercial já declarado (`areaClienteFuture`)

1. Cronograma partilhado em tempo real  
2. Documentos e contratos num só lugar  
3. Visibilidade financeira do projecto  
4. Aprovações com clareza e registo  
5. Acompanhamento de convidados  

---

## 3. Princípios de desenho

1. **Reutilizar agregações existentes** — `getClientCommercialOverview()` como base do dashboard.  
2. **Read-only por defeito** — cliente consulta; alterações via equipa HAXR ou fluxos de aprovação explícitos.  
3. **Privacidade de convidados** — portal mostra `EventStats` agregados, nunca lista nominal (RGPD + discrição premium).  
4. **Separação Resend / Brevo / Portal** — emails transaccionais (Resend), marketing (Brevo), portal (notificações in-app + email opcional).  
5. **Route group isolado** — `(portal)` separado de `(marketing)` e `admin`.  
6. **Nunca service role no browser** — API routes ou Supabase RLS com `client_id` da sessão.

---

## 4. Arquitectura de rotas

```
src/app/
├── (marketing)/
│   └── area-cliente/page.tsx     ← mantém-se (SEO, CTA, login → /portal/entrar)
└── (portal)/                     ← NOVO (futuro)
    ├── layout.tsx                ← shell minimalista branded HAXR
    ├── entrar/page.tsx           ← magic link / OTP
    ├── convite/[token]/page.tsx  ← aceitar convite
    ├── page.tsx                  ← dashboard
    ├── eventos/
    │   ├── page.tsx
    │   └── [id]/
    │       ├── page.tsx
    │       └── convidados/page.tsx
    ├── documentos/page.tsx
    ├── financeiro/page.tsx
    ├── cronograma/page.tsx       ← v2
    ├── aprovacoes/page.tsx       ← v2
    ├── contratos/page.tsx        ← v2
    └── fornecedores/page.tsx     ← v2

src/app/api/portal/
    ├── auth/send-link/route.ts
    ├── auth/verify/route.ts
    ├── auth/logout/route.ts
    ├── dashboard/route.ts
    ├── events/route.ts
    ├── events/[id]/stats/route.ts
    ├── documents/route.ts
    └── documents/[id]/pdf/route.ts
```

### URLs públicas

| URL | Função |
|-----|--------|
| `/area-cliente` | Marketing (actual) |
| `/portal/entrar` | Login cliente |
| `/portal` | Dashboard (protegido) |

O link «Área do Cliente» no nav pode passar a `/portal/entrar` quando o MVP estiver activo.

---

## 5. Autenticação

### Recomendação: Supabase Auth + `portal_users` (produção)

```
Admin convida cliente (email)
  → INSERT portal_invites (token_hash, client_id, role, expires_at)
  → Email Resend com link /portal/convite/[token]
  → Cliente clica → Supabase magic link OU validação token + sessão portal
  → Cookie haxr_portal_session (14 dias)
  → Todas as queries filtradas por client_id
```

### MVP alternativo (2–3 dias menos)

- Magic link custom (sem Supabase Auth): validar token contra `portal_invites` + `clients.email`.  
- Sessão HMAC semelhante ao admin (`src/lib/admin/auth.ts`).  
- Migrar para Supabase Auth antes do evento de 300 convidados em produção com múltiplos clientes.

### Middleware (`src/middleware.ts`)

Extender `matcher`:

```ts
matcher: [
  "/admin", "/admin/:path*", "/api/admin/:path*",
  "/portal/:path*", "/api/portal/:path*",
]
```

Excepções públicas: `/portal/entrar`, `/portal/convite/*`, `/api/portal/auth/*`.

---

## 6. Modelo de dados

### 6.1 Tabelas existentes (reutilização)

| Tabela | Uso no portal |
|--------|----------------|
| `clients` | Identidade do utilizador portal |
| `events` | Lista de eventos do cliente |
| `documents` | Proformas, facturas, recibos (`status IN sent, paid`) |
| `payments` | Histórico financeiro |
| `guests` | **Não expor** — só agregar via `getEventStats()` |

### 6.2 Tabelas novas (migration `022_client_portal.sql` — futura)

```sql
-- Utilizadores do portal (ligação cliente ↔ auth)
CREATE TABLE portal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  auth_user_id UUID,              -- Supabase Auth (nullable no MVP token)
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner'
    CHECK (role IN ('owner', 'collaborator', 'viewer')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, email)
);

-- Convites emitidos pelo admin
CREATE TABLE portal_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cronograma partilhado (v2)
CREATE TABLE portal_timeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  category TEXT NOT NULL DEFAULT 'milestone',
  visibility TEXT NOT NULL DEFAULT 'client'
    CHECK (visibility IN ('client', 'internal')),
  status TEXT NOT NULL DEFAULT 'scheduled',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Aprovações de entregas (v2)
CREATE TABLE portal_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'changes_requested')),
  due_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  decided_by_email TEXT,
  attachment_storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fornecedores visíveis ao cliente (v2)
CREATE TABLE portal_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  contact_label TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes_internal TEXT,           -- nunca expor ao portal
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 6.3 RLS (obrigatório antes de expor anon key)

Exemplo para `documents`:

```sql
CREATE POLICY portal_documents_select ON documents
  FOR SELECT TO authenticated
  USING (
    client_id IN (
      SELECT client_id FROM portal_users
      WHERE auth_user_id = auth.uid() AND is_active = true
    )
    AND status IN ('sent', 'paid')
  );
```

Policies similares para `events`, `payments`, `portal_timeline_items`, `portal_approvals`.

---

## 7. Módulos funcionais

### 7.1 Dashboard (MVP)

**Fonte:** `getClientCommercialOverview(clientId)`  
**UI referência:** `ClientDetailClient.tsx` (4 KPI cards)  
**Adicionar:** próximo marco do cronograma, contador de aprovações pendentes.

### 7.2 Eventos (MVP)

**Fonte:** `listEventsByClientId()`  
**Campos visíveis:** nome, tipo, data, local, estado  
**Acção:** link para detalhe + stats convidados.

### 7.3 Convidados (MVP)

**Fonte:** `getEventStats(eventId)` → `EventStats`  
**Expor:** totais confirmados/pendentes/recusados/check-in/adultos/crianças  
**Não expor:** nomes, emails, telefones, lugares individuais.

### 7.4 Documentos (MVP)

**Fonte:** `listDocuments({ clientId })` filtrado  
**Regra:** `status ∈ { sent, paid }`  
**PDF:** `GET /api/portal/documents/[id]/pdf` com verificação `document.client_id === session.clientId`  
**Reutilizar:** `src/lib/pdf.tsx`, `invoice-generator.ts`

### 7.5 Financeiro (MVP)

**Fonte:** `listPaymentsByClientId()` + stats de saldo  
**Expor:** pagamentos registados, saldo pendente, referência a documento  
**Não expor:** despesas internas (`finance_expenses`), margens, metas mensais.

### 7.6 Cronograma (v2)

Admin cria marcos em `/admin/events/[id]` (novo tab «Cronograma cliente»).  
Cliente vê timeline filtrada `visibility = 'client'`.  
Notificação email (Resend) 24h antes de marco importante.

### 7.7 Aprovações (v2)

Fluxo: admin envia entrega → `portal_approvals.status = pending` → cliente aprova ou pede alterações → registo `decided_at` + email à equipa.

### 7.8 Contratos (v2)

Documentos tipo contrato (novo `document_type` ou tag) + PDF assinado.  
Alternativa MVP: anexar contrato como `invoice` com descrição específica até tipo dedicado existir.

### 7.9 Fornecedores (v2)

Vista resumida por evento — nome, categoria, estado.  
Sem telefones internos nem notas `notes_internal`.

---

## 8. Matriz de permissões

| Acção | owner | collaborator | viewer |
|-------|-------|--------------|--------|
| Ver dashboard | ✓ | ✓ | ✓ |
| Ver documentos sent/paid | ✓ | ✓ | ✓ |
| Download PDF | ✓ | ✓ | ✗ |
| Ver stats convidados | ✓ | ✓ | ✓ |
| Aprovar entregas | ✓ | ✓ | ✗ |
| Convidar outro utilizador | ✓ | ✗ | ✗ |

---

## 9. Integração com admin existente

| Admin actual | Extensão para portal |
|--------------|----------------------|
| `/admin/clients/[id]` | Botão «Convidar para portal» → gera `portal_invites` |
| `/admin/events/[id]` | Tabs futuros: Cronograma cliente, Aprovações, Fornecedores |
| Leads `/admin/leads` | Sem alteração — conversão manual para `clients` |
| Notificações | Resend: convite portal, aprovação pendente, documento enviado |

---

## 10. Segurança

| Risco | Mitigação |
|-------|-----------|
| IDOR em documentos/PDF | Verificar `client_id` em cada API |
| Exposição lista convidados | Apenas `EventStats` agregados |
| Session fixation | Tokens de convite uso único + expiração 72h |
| Scraping portal | Rate limit Supabase (`api_rate_limits`) |
| XSS em anexos | Storage privado + signed URLs curtas |
| Admin vs portal | Cookies distintos; paths middleware separados |

---

## 11. Plano de implementação

### Sprint MVP (estimativa: 5–7 dias)

1. Migration `022_client_portal.sql` (invites + users)  
2. Auth magic link + middleware  
3. Layout `(portal)` branded mobile-first  
4. Dashboard + eventos + documentos + financeiro  
5. API PDF segura  
6. Admin: botão convite  
7. Testes E2E login → ver proforma  

### Sprint v2 (estimativa: 5 dias)

1. Tabelas timeline, approvals, suppliers  
2. UI cronograma + aprovações  
3. Notificações Resend  
4. RLS completo + remover dependência service role no portal  

### Sprint v3 (opcional)

- Notificações push / WhatsApp Business API  
- Assinatura digital de contratos  
- Comentários por marco do cronograma  

---

## 12. Ficheiros de referência no código

| Ficheiro | Papel |
|----------|-------|
| `src/lib/portal/types.ts` | Tipos do domínio portal |
| `src/lib/portal/modules.ts` | Mapa de módulos MVP/v2 |
| `src/lib/portal/auth-spec.ts` | Decisões de autenticação |
| `src/lib/admin/repositories/client-overview.repository.ts` | Agregação reutilizável |
| `src/app/admin/(panel)/clients/[id]/ClientDetailClient.tsx` | Blueprint UI |
| `src/lib/events/repositories/guests.repository.ts` | `getEventStats()` |
| `src/middleware.ts` | Extensão futura |

Validação: `npm run verify:portal-spec`

---

## 13. Critérios de aceitação (quando implementado)

- [ ] Cliente convidado acede via email sem suporte manual  
- [ ] Vê apenas os seus eventos e documentos  
- [ ] PDF de factura proforma enviada descarrega com segurança  
- [ ] Stats de convidados sem PII  
- [ ] Saldo financeiro coincide com admin  
- [ ] `/area-cliente` marketing mantém-se indexável  
- [ ] Falha de auth redirecciona para `/portal/entrar`  
- [ ] Nenhum dado de outro cliente acessível (teste IDOR)

---

## 14. Riscos remanescentes

- Supabase Auth não está configurado hoje — requer projecto Auth activo  
- Tipo `contract` em documentos ainda não existe  
- Cronograma e aprovações sem UI admin — trabalho adicional  
- Evento 300 convidados: portal MVP não é bloqueante; admin actual cobre operação  

**Próxima fase recomendada:** Fase 10 — QA final (auditoria completa antes do evento real).
