# HAXR SIGNATURE — BABY AYLLA GIFT REGISTRY
## ESPECIFICAÇÃO DE PROVISIONAMENTO E ISOLAMENTO POSTGRESQL (FASE C.3.2)

**Documento:** `docs/migrations/baby_aylla_gift_registry_provisioning.md`  
**Data:** 2026-11-23  
**Autor:** TRUTHMODE | Principal Database Security Architect | Full-Stack Security Engineer  
**Estado:** Execução Final do Contrato C.3.2 (Mandato Limitado ao Código Local)

---

### 1. OBJECTIVO & SEPARAÇÃO ESTRITA DE PRIVILÉGIOS

Para garantir que a Gift Registry da Baby Aylla não interfere com as funcionalidades canónicas do HAXR Core (RSVP, administração, pagamentos, conciergerie), não introduz risco de privilégios cruzados e impede que uma única identidade PostgreSQL possa fabricar e validar os seus próprios desafios OTP, o subsistema adopta **três identidades PostgreSQL dedicadas e isoladas**:

1. **Papel Emissor de Desafios (Dedicated Issuer):** `haxr_aylla_gift_issuer`
   - Exclusivo para emissão controlada de desafios OTP de convidados (`create_baby_aylla_verification_challenge`).
   - Não possui privilégio para consumir desafios, criar sessões, efetuar reservas ou transições administrativas.
   - **Zero privilégios em tabelas:** Zero SELECT, INSERT, UPDATE, DELETE sobre quaisquer tabelas do schema `public`.

2. **Papel Operacional de Convidados (Guest Runtime):** `haxr_aylla_gift_runtime`
   - Exclusivo para verificação de OTP, emissão de sessão vinculada, resolução de sessão, e reservas/cancelamentos verificados.
   - **Revogado:** `create_baby_aylla_verification_challenge` (não pode emitir desafios).
   - **Revogado:** `transition_baby_aylla_gift_reservation_admin` (não pode executar acções de administração).
   - **Zero SELECT** sobre tabelas de credenciais (`edition_guest_verification_challenges` e `edition_guest_sessions`).
   - SELECT restrito via RLS sobre `edition_gift_inventory`, `edition_gift_reservations_v2`, `edition_gift_reservation_audit_v2`.

3. **Papel Administrativo Dedicado (Admin Operations):** `haxr_aylla_gift_admin`
   - Exclusivo para transições de estado administrativo de reservas (`transition_baby_aylla_gift_reservation_admin`).
   - Exige correspondência estrita com operador activo em `public.admin_users` (`status = 'active'`, `role IN ('OWNER', 'ADMIN', 'EVENT_MANAGER')`).
   - Registra auditoria com integridade referencial `actor_admin_id REFERENCES public.admin_users(id)`.

- **Preservação do HAXR Core:** A migração da Gift Registry **nunca revoga nem altera** os privilégios pré-existentes de `haxrweb_runtime` ou `edition_runtime` sobre tabelas canónicas (`public.guests`, `public.events`, `public.businesses`). O papel `haxrweb_runtime` mantém zero privilégios sobre a Gift Registry.

---

### 2. ESPECIFICAÇÃO DOS PAPÉIS POSTGRESQL

#### 2.1 Atributos Obrigatórios dos Papéis
| Atributo | `haxr_aylla_gift_issuer` | `haxr_aylla_gift_runtime` | `haxr_aylla_gift_admin` | Justificação de Segurança |
| :--- | :--- | :--- | :--- | :--- |
| `rolcanlogin` | `true` | `true` | `true` | Necessário para estabelecer conexões de pool distintas e auditáveis. |
| `rolinherit` | `true` | `true` | `true` | Padrão PostgreSQL para herança de privilégios. |
| `rolsuper` | `false` | `false` | `false` | Proibição absoluta de privilégios de superutilizador. |
| `rolcreaterole` | `false` | `false` | `false` | Não pode criar ou modificar papéis. |
| `rolcreatedb` | `false` | `false` | `false` | Não pode criar ou alterar bases de dados. |
| `rolbypassrls` | `false` | `false` | `false` | Sujeito estrito às políticas de Row Level Security (RLS). |

#### 2.2 Comandos de Provisionamento (A executar apenas no Gate A.2 pelo Proprietário)
```sql
-- Executar exclusivamente como neondb_owner ou cloud_admin na branch de staging isolada:

-- 1. Papel emissor de desafios OTP:
CREATE ROLE haxr_aylla_gift_issuer WITH
  LOGIN
  NOSUPERUSER
  NOCREATEROLE
  NOCREATEDB
  NOBYPASSRLS
  INHERIT
  PASSWORD '<STAGING_STRONG_ISSUER_SECRET_HERE>';

-- 2. Papel operacional de convidados:
CREATE ROLE haxr_aylla_gift_runtime WITH
  LOGIN
  NOSUPERUSER
  NOCREATEROLE
  NOCREATEDB
  NOBYPASSRLS
  INHERIT
  PASSWORD '<STAGING_STRONG_RUNTIME_SECRET_HERE>';

-- 3. Papel administrativo dedicado:
CREATE ROLE haxr_aylla_gift_admin WITH
  LOGIN
  NOSUPERUSER
  NOCREATEROLE
  NOCREATEDB
  NOBYPASSRLS
  INHERIT
  PASSWORD '<STAGING_STRONG_ADMIN_SECRET_HERE>';
```

---

### 3. MATRIZ DEFINITIVA DE PERMISSÕES (ARQUITECTURA RPC-ONLY HARDENED)

#### 3.1 Tabelas da Gift Registry
| Objecto | `haxr_aylla_gift_issuer` | `haxr_aylla_gift_runtime` | `haxr_aylla_gift_admin` | Justificação de Segurança |
| :--- | :--- | :--- | :--- | :--- |
| `public.edition_gift_inventory` | **NENHUMA** | `SELECT` | `SELECT` | Catálogo de presentes. Mutação directa proibida. |
| `public.edition_gift_reservations_v2` | **NENHUMA** | `SELECT` | `SELECT` | Consulta de reservas. Escrita exclusiva via RPCs. |
| `public.edition_gift_reservation_audit_v2` | **NENHUMA** | `SELECT` | `SELECT` | Consulta de auditoria. Inserções exclusivas via RPCs. |
| `public.edition_guest_verification_challenges` | **NENHUMA** | **NENHUMA** (Zero SELECT) | **NENHUMA** | Segredos protegidos contra enumeração e leitura. |
| `public.edition_guest_sessions` | **NENHUMA** | **NENHUMA** (Zero SELECT) | **NENHUMA** | Segredos de sessão protegidos contra impersonação. |

Todas as 5 tabelas possuem `ALTER TABLE ... FORCE ROW LEVEL SECURITY` e `REVOKE ALL ON TABLE ... FROM PUBLIC`.  
Zero privilégios de `INSERT`, `UPDATE` ou `DELETE` são concedidos a qualquer um dos três papéis.

#### 3.2 Funções RPC e Lookups Controlados (SECURITY DEFINER)
Todas as funções possuem `REVOKE ALL ON FUNCTION ... FROM PUBLIC`.  
Operam com `SECURITY DEFINER` e `SET search_path = pg_catalog, public`.

| Função | `haxr_aylla_gift_issuer` | `haxr_aylla_gift_runtime` | `haxr_aylla_gift_admin` | Mecanismo de Segurança |
| :--- | :--- | :--- | :--- | :--- |
| `public.resolve_baby_aylla_guest_by_contact(text)` | `EXECUTE` | `EXECUTE` | Nenhuma | Lookup filtrado por evento canónico e RSVP confirmado. |
| `public.resolve_baby_aylla_guest_by_id(uuid)` | Nenhuma | `EXECUTE` | Nenhuma | Lookup filtrado por evento canónico e ID do convidado. |
| `public.create_baby_aylla_verification_challenge(uuid, uuid, uuid, text, integer)` | `EXECUTE` | **REVOGADO** | **REVOGADO** | Criação com relógio PostgreSQL (`clock_timestamp() + 10 min`), validação de RSVP e tentativas (1-5). |
| `public.verify_and_consume_baby_aylla_challenge(uuid, text)` | **REVOGADO** | `EXECUTE` | **REVOGADO** | Verificação e consumo atómico de código num único passo com `clock_timestamp()`. |
| `public.increment_baby_aylla_challenge_attempts(uuid)` | **REVOGADO** | `EXECUTE` | **REVOGADO** | Incremento atómico com fail-closed após 5 tentativas. |
| `public.create_baby_aylla_guest_session(uuid, uuid, uuid, text, uuid)` | **REVOGADO** | `EXECUTE` | **REVOGADO** | Exige `challenge_id` consumido há < 120s para o mesmo guest/event. Grava `session_issued_at` e `sha256(secret_proof)`. TTL 20 min via relógio do PostgreSQL. |
| `public.resolve_baby_aylla_guest_session(uuid, text)` | **REVOGADO** | `EXECUTE` | **REVOGADO** | Resolve dados do convidado autenticado contra `clock_timestamp()`. |
| `public.revoke_baby_aylla_guest_session(uuid, text)` | **REVOGADO** | `EXECUTE` | **REVOGADO** | Revogação exigindo prova do segredo da sessão. |
| `public.reserve_baby_aylla_gift_verified(...)` | **REVOGADO** | `EXECUTE` | **REVOGADO** | Reserva atómica com advisory locks e derivação dupla `sha256(proof)`. |
| `public.cancel_baby_aylla_gift_verified(...)` | **REVOGADO** | `EXECUTE` | **REVOGADO** | Cancelamento por convidado com validação de posse e derivação dupla `sha256(proof)`. |
| `public.transition_baby_aylla_gift_reservation_admin(...)` | **REVOGADO** | **REVOGADO** | `EXECUTE` | Transição administrativa exclusiva com validação de `admin_users`. |
| `public.reserve_baby_aylla_gift(...)` | **REVOGADO** | **REVOGADO** | **REVOGADO** | RPC base interna sem verificação de sessão. Inacessível externamente. |

---

### 4. CONTRATO OTP & AUTORIDADE DO RELÓGIO (POSTGRESQL CLOCK_TIMESTAMP)

1. **Eliminação de Parâmetros de Tempo pelo Chamador:**
   - Nenhum parâmetro `p_expires_at`, `p_consumed_at` ou `p_created_at` é aceite pelas RPCs.
   - O relógio do servidor de base de dados (`clock_timestamp()`) é a autoridade temporal única e exclusiva.
   - Desafios expiram em exatamente `clock_timestamp() + interval '10 minutes'`.
   - Sessões expiram em exatamente `clock_timestamp() + interval '20 minutes'`.

2. **Validação Estrita de Parâmetros de Entrada:**
   - Tentativas (`max_attempts`): rejeita `< 1` ou `> 5` com `ERRCODE = '22023'`.
   - Formato de Hashes: rejeita comprimento `< 32` ou `> 256` com `ERRCODE = '22023'`.
   - UUIDs: rejeita parâmetros nulos com `ERRCODE = '22023'`.
   - Escopo de Evento: rejeita qualquer evento fora da Baby Aylla (`a0f6b5a9-4d8c-4501-81b6-52929fa9da38`) com `ERRCODE = '42501'`.

3. **Invariante de Utilização Única do Desafio:**
   - `edition_guest_verification_challenges` possui coluna `session_issued_at timestamptz`.
   - `create_baby_aylla_guest_session` verifica `session_issued_at IS NULL` e actualiza atomicamente `session_issued_at = clock_timestamp()`.
   - Qualquer tentativa de reemitir sessão com o mesmo desafio é rejeitada com fail-closed.

4. **Vinculação Estrita Desafio-Convidado (Cross-Guest Binding Protection):**
   - A emissão de sessão verifica `v_challenge.guest_id = p_guest_id AND v_challenge.event_id = p_event_id`.
   - Um desafio emitido para um convidado não pode sob hipótese alguma ser utilizado para criar sessão para outro convidado.

---

### 5. INTEGRAÇÃO ADMINISTRATIVA & DEPENDÊNCIA DE ADMIN_USERS

1. **Estado da Rota HTTP Administrativa: PENDENTE**
   - Actualmente **não existe rota HTTP pública ou Server Action** no HAXR Core que invoque a RPC `transition_baby_aylla_gift_reservation_admin` ou o método `adminTransition` do serviço.
   - A implementação deste percurso permanece formalmente documentada como **PENDENTE**.
   - Quando for implementada:
     - Deverá validar a sessão de operador via `requireActiveAdminIdentity()`.
     - Deverá usar uma conexão dedicada associada ao papel `haxr_aylla_gift_admin`.
     - Nunca utilizará parâmetros fornecidos pelo cliente para preencher `p_admin_id`.

2. **Pré-requisito Estrutural de `public.admin_users` (Gate B):**
   - A tabela `public.admin_users` é referenciada como chave estrangeira em `edition_gift_reservation_audit_v2(actor_admin_id)`.
   - Na branch de staging isolada da Neon (`br-late-night-b4yjupu9`), `public.admin_users` não existe actualmente porque a branch derivou de um canary minimalista de RSVP.
   - Para viabilizar a execução da migração C.3 no Gate B, a migração canónica de schema `20261001100000_admin_identity_foundation.sql` (ou equivalente DDL estrutural) deve ser aplicada **exclusivamente a nível de esquema**, com **zero cópia de dados reais ou sensíveis de utilizadores de produção**.

---

### 6. CONFIGURAÇÃO DE AMBIENTE E RUNTIME

#### 6.1 Variáveis de Ambiente Dedicadas
```bash
# Runtime Emissor de Desafios OTP (Challenge Issuance)
HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL=postgresql://haxr_aylla_gift_issuer:<secret>@<host>/neondb?sslmode=require

# Runtime Operacional de Convidados (Guest Operations)
HAXR_AYLLA_GIFT_DATABASE_URL=postgresql://haxr_aylla_gift_runtime:<secret>@<host>/neondb?sslmode=require
```

#### 6.2 Validação Fail-Closed de Configuração
- A função `validateAyllaGiftDatabaseEnvironment()` em `src/lib/neon/aylla-gift-config.ts` valida independentemente ambas as URLs.
- Rejeita imediatamente qualquer configuração onde:
  1. `HAXR_AYLLA_GIFT_ISSUER_DATABASE_URL` não aponte para `haxr_aylla_gift_issuer`.
  2. `HAXR_AYLLA_GIFT_DATABASE_URL` não aponte para `haxr_aylla_gift_runtime`.
  3. Ambas as variáveis apontem para a mesma identidade ou a mesma connection string.
- `assertRuntimeIdentity` valida activamente a identidade conectada em cada operação contra o catálogo `pg_roles`.
