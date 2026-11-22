# HAXR SIGNATURE — BABY AYLLA GIFT REGISTRY
## ESPECIFICAÇÃO DE PROVISIONAMENTO E ISOLAMENTO POSTGRESQL (FASE C.3.2)

**Documento:** `docs/migrations/baby_aylla_gift_registry_provisioning.md`  
**Data:** 2026-11-22  
**Autor:** Antigravity (Principal Database Security Architect)  
**Estado:** Homologação Técnica (Auditoria Claude | Pré-Gate A.2)

---

### 1. OBJECTIVO & SEPARAÇÃO DE PRIVILÉGIOS

Para garantir que a Gift Registry da Baby Aylla não interfere com as funcionalidades canónicas do HAXR Core (RSVP, administração, pagamentos, conciergerie) e não introduz risco de privilégios cruzados ou revogações inadvertidas sobre tabelas partilhadas, o subsistema adopta **duas identidades de conexão PostgreSQL dedicadas e isoladas**:

1. **Papel Operacional de Convidados:** `haxr_aylla_gift_runtime`
   - Exclusivo para operações de convidados (lookup de RSVP, desafios, sessões verificadas, reservas e cancelamentos de convidados).
   - Privilégios mínimos estritos sob arquitectura RPC-only.
   - **Zero SELECT** sobre tabelas de credenciais (`edition_guest_verification_challenges` e `edition_guest_sessions`).
   - **Zero permissões administrativas**: `REVOKE ALL` sobre transições de estado administrativo.

2. **Papel Administrativo Dedicado:** `haxr_aylla_gift_admin`
   - Exclusivo para transições de estado administrativo de reservas (`transition_baby_aylla_gift_reservation_admin`).
   - Exige correspondência estrita com operador activo em `public.admin_users` (`status = 'active'`, `role IN ('OWNER', 'ADMIN', 'EVENT_MANAGER')`).
   - Registra auditoria com integridade referencial `actor_admin_id REFERENCES public.admin_users(id)`.

- **Preservação de Permissões Globais:** A migração da Gift Registry **nunca revoga nem altera** os privilégios pré-existentes de `haxrweb_runtime` ou `edition_runtime` sobre tabelas canónicas (`public.guests`, `public.events`, `public.businesses`).

---

### 2. ESPECIFICAÇÃO DOS PAPÉIS POSTGRESQL

#### 2.1 Atributos Obrigatórios dos Papéis
| Atributo | `haxr_aylla_gift_runtime` | `haxr_aylla_gift_admin` | Justificação de Segurança |
| :--- | :--- | :--- | :--- |
| `rolcanlogin` | `true` | `true` | Necessário para estabelecer conexões de pool distintas. |
| `rolinherit` | `true` | `true` | Padrão PostgreSQL para herança de privilégios. |
| `rolsuper` | `false` | `false` | Proibição absoluta de privilégios de superutilizador. |
| `rolcreaterole` | `false` | `false` | Não pode criar ou modificar papéis. |
| `rolcreatedb` | `false` | `false` | Não pode criar ou alterar bases de dados. |
| `rolbypassrls` | `false` | `false` | Sujeito estrito às políticas de Row Level Security (RLS). |

#### 2.2 Comandos de Provisionamento (A executar apenas no Gate A.2 pelo Proprietário)
```sql
-- Executar exclusivamente como neondb_owner ou cloud_admin na branch de staging isolada:

-- 1. Papel operacional de convidados:
CREATE ROLE haxr_aylla_gift_runtime WITH
  LOGIN
  NOSUPERUSER
  NOCREATEROLE
  NOCREATEDB
  NOBYPASSRLS
  INHERIT
  PASSWORD '<STAGING_STRONG_RUNTIME_SECRET_HERE>';

-- 2. Papel administrativo dedicado:
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

Para eliminar vulnerabilidades de exposição de hashes como credenciais (SEC-C3-P1-A), segregação de papéis administrativos (SEC-C3-P1-B) e emissão de sessões desvinculadas de desafios (SEC-C3-P2-A):

#### 3.1 Tabelas da Gift Registry
| Objecto | `haxr_aylla_gift_runtime` | `haxr_aylla_gift_admin` | Justificação de Segurança |
| :--- | :--- | :--- | :--- |
| `public.edition_gift_inventory` | `SELECT` | `SELECT` | Catálogo de presentes. Mutação directa proibida. |
| `public.edition_gift_reservations_v2` | `SELECT` | `SELECT` | Consulta de reservas. Escrita exclusiva via RPCs. |
| `public.edition_gift_reservation_audit_v2` | `SELECT` | `SELECT` | Consulta de auditoria. Inserções exclusivas via RPCs. |
| `public.edition_guest_verification_challenges` | **NENHUMA** (Zero SELECT) | **NENHUMA** | Segredos de verificação protegidos contra enumeração e leitura. |
| `public.edition_guest_sessions` | **NENHUMA** (Zero SELECT) | **NENHUMA** | Segredos de sessão protegidos contra impersonação. |

Todas as 5 tabelas possuem `ALTER TABLE ... FORCE ROW LEVEL SECURITY` e `REVOKE ALL ON TABLE ... FROM PUBLIC`.
Zero permissões de `INSERT`, `UPDATE` ou `DELETE` são concedidas a qualquer um dos papéis de runtime.

#### 3.2 Funções RPC e Lookups Controlados (SECURITY DEFINER)
Todas as funções abaixo possuem `REVOKE ALL ON FUNCTION ... FROM PUBLIC`.
Operam com `SECURITY DEFINER` e `SET search_path = pg_catalog, public`.

| Função | `haxr_aylla_gift_runtime` | `haxr_aylla_gift_admin` | Mecanismo de Segurança |
| :--- | :--- | :--- | :--- |
| `public.resolve_baby_aylla_guest_by_contact(text)` | `EXECUTE` | Nenhuma | Lookup filtrado por evento canónico e RSVP confirmado. |
| `public.resolve_baby_aylla_guest_by_id(uuid)` | `EXECUTE` | Nenhuma | Lookup filtrado por evento canónico e ID do convidado. |
| `public.create_baby_aylla_verification_challenge(...)` | `EXECUTE` | Nenhuma | Criação com rate-limit, validação de RSVP e expiração de 10 min. |
| `public.verify_and_consume_baby_aylla_challenge(...)` | `EXECUTE` | Nenhuma | Verificação e consumo atómico de código num único passo transaccional. |
| `public.increment_baby_aylla_challenge_attempts(...)` | `EXECUTE` | Nenhuma | Incremento atómico com fail-closed após 5 tentativas. |
| `public.create_baby_aylla_guest_session(...)` | `EXECUTE` | Nenhuma | Exige `p_challenge_id` consumido há menos de 120s. Grava `session_issued_at` único e armazena `sha256(secret_proof)`. |
| `public.resolve_baby_aylla_guest_session(uuid, text)` | `EXECUTE` | Nenhuma | Resolve dados do convidado autenticado sem nunca expor hashes ou segredos. |
| `public.revoke_baby_aylla_guest_session(uuid, text, timestamptz)` | `EXECUTE` | Nenhuma | Revogação exigindo prova do segredo da sessão. |
| `public.reserve_baby_aylla_gift_verified(...)` | `EXECUTE` | Nenhuma | Reserva atómica com advisory locks e derivação dupla `sha256(proof)`. |
| `public.cancel_baby_aylla_gift_verified(...)` | `EXECUTE` | Nenhuma | Cancelamento por convidado com validação de posse e derivação dupla `sha256(proof)`. |
| `public.transition_baby_aylla_gift_reservation_admin(...)` | **REVOGADO** | `EXECUTE` | Transição administrativa exclusiva com validação de `admin_users` e bloqueio de `haxr_aylla_gift_runtime`. |
| `public.reserve_baby_aylla_gift(...)` | **REVOGADO** | **REVOGADO** | RPC base interna sem verificação de sessão. Inacessível externamente. |

#### 3.3 Derivação Criptográfica em Repouso (Double-Hashing Derivation)
Para prevenir o ataque "Hash-as-Password":
- A aplicação gera um token de sessão de alta entropia `sessionId.secret`.
- A aplicação deriva o segredo antes de enviar à base de dados (`secret_proof = HMAC-SHA256(secret, PEPPER)`).
- O PostgreSQL armazena exclusivamente:
  ```sql
  stored_verifier = encode(sha256(p_secret_proof::bytea), 'hex')
  ```
- Na autenticação, o PostgreSQL calcula `encode(sha256(p_secret_proof::bytea), 'hex')` e compara com `stored_verifier`.
- Caso um atacante obtenha o valor em repouso na tabela, ele não pode usá-lo como credencial, pois `sha256(stored_verifier) != stored_verifier`.

#### 3.4 Vinculação Estrita de Sessão a Desafio (Challenge-Bound Sessions)
- `create_baby_aylla_guest_session` exige obrigatoriamente `p_challenge_id uuid`.
- Validações atómicas no PostgreSQL:
  1. O desafio deve existir para o mesmo `event_id` e `guest_id`.
  2. O desafio deve estar consumido (`consumed_at IS NOT NULL`).
  3. A janela temporal entre consumo e emissão não pode exceder 120 segundos (`consumed_at >= now() - interval '120 seconds'`).
  4. O desafio não pode ter emitido sessão anteriormente (`session_issued_at IS NULL`).
- Ao emitir a sessão, actualiza atomicamente `session_issued_at = now()`, garantindo uso único estrito.

---

### 4. CONFIGURAÇÃO DE AMBIENTE E RUNTIME

#### 4.1 Variáveis de Ambiente Dedicadas
```bash
# Runtime de Convidados (Guest Operations)
HAXR_AYLLA_GIFT_DATABASE_URL=postgresql://haxr_aylla_gift_runtime:<secret>@<host>/neondb?sslmode=require

# Runtime Administrativo (Admin Operations)
HAXR_AYLLA_GIFT_ADMIN_DATABASE_URL=postgresql://haxr_aylla_gift_admin:<secret>@<host>/neondb?sslmode=require
```

#### 4.2 Verificação de Identidade Fail-Closed
O módulo `src/lib/neon/aylla-gift-db.ts` valida cada cliente adquirido do pool contra o catálogo `pg_roles` sem recurso a cache instável. Qualquer anomalia ou elevação de privilégios resulta em encerramento imediato e bloqueio da operação.
