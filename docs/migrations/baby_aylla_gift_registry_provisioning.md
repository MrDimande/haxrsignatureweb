# HAXR SIGNATURE — BABY AYLLA GIFT REGISTRY
## ESPECIFICAÇÃO DE PROVISIONAMENTO E IDENTIDADE POSTGRESQL

**Documento:** `docs/migrations/baby_aylla_gift_registry_provisioning.md`  
**Data:** 2026-11-22  
**Autor:** Antigravity (Principal Database Security Architect)  
**Estado:** Homologação Técnica (Pré-Gate A.2)

---

### 1. OBJECTIVO & SEPARAÇÃO DE PRIVILÉGIOS

Para garantir que a Gift Registry da Baby Aylla não interfere com as funcionalidades canónicas do HAXR Core (RSVP, administração, pagamentos, conciergerie) e não introduz risco de privilégios cruzados ou revogações inadvertidas sobre tabelas partilhadas, o subsistema adopta uma **identidade de conexão PostgreSQL dedicada e isolada**:

- **Papel Dedicado:** `haxr_aylla_gift_runtime`
- **Isolamento de Papéis:** Completamente independente de `haxrweb_runtime` (Core API geral) e de `edition_runtime` (papel de grupo NOLOGIN).
- **Preservação de Permissões Globais:** A migração da Gift Registry **nunca revoga nem altera** os privilégios pré-existentes de `haxrweb_runtime` ou `edition_runtime` sobre tabelas canónicas (`public.guests`, `public.events`, `public.businesses`).

---

### 2. ESPECIFICAÇÃO DO PAPEL `haxr_aylla_gift_runtime`

#### 2.1 Atributos PostgreSQL Obrigatórios
| Atributo | Valor Requerido | Justificação de Segurança |
| :--- | :--- | :--- |
| `rolcanlogin` | `true` | Necessário para estabelecer conexão de pool do runtime. |
| `rolinherit` | `true` | Padrão PostgreSQL para herança de privilégios de roles. |
| `rolsuper` | `false` | Proibição absoluta de privilégios de superutilizador. |
| `rolcreaterole` | `false` | Não pode criar ou modificar papéis. |
| `rolcreatedb` | `false` | Não pode criar ou alterar bases de dados. |
| `rolbypassrls` | `false` | Sujeito estrito às políticas de Row Level Security (RLS). |

#### 2.2 Comando de Provisionamento (A executar apenas no Gate A.2 pelo Proprietário)
```sql
-- Executar exclusivamente como neondb_owner ou cloud_admin na branch de staging isolada:
CREATE ROLE haxr_aylla_gift_runtime WITH
  LOGIN
  NOSUPERUSER
  NOCREATEROLE
  NOCREATEDB
  NOBYPASSRLS
  INHERIT
  PASSWORD '<STAGING_STRONG_SECRET_HERE>';
```

---

### 3. MATRIZ DEFINITIVA DE PERMISSÕES (ARQUITECTURA RPC-ONLY)

Para garantir máxima segurança e auditoria absoluta, o papel `haxr_aylla_gift_runtime` opera sob uma arquitectura **estritamente RPC-only**.
Todas as mutações no banco de dados (`INSERT`, `UPDATE`, `DELETE`) em quaisquer tabelas foram totalmente eliminadas das permissões directas da role operacional.

#### 3.1 Tabelas da Gift Registry (SELECT Only)
| Objecto | Tipo | Permissões Concedidas | Justificação de Segurança |
| :--- | :--- | :--- | :--- |
| `public.edition_gift_inventory` | Tabela | `SELECT` | Leitura de catálogo de presentes aprovados pela família. Mutação directa proibida. |
| `public.edition_guest_verification_challenges` | Tabela | `SELECT` | Leitura de desafios de verificação. Mutações exclusivas via RPCs de desafio. |
| `public.edition_guest_sessions` | Tabela | `SELECT` | Leitura de sessões de convidados. Emissão e revogação exclusivas via RPCs de sessão. |
| `public.edition_gift_reservations_v2` | Tabela | `SELECT` | Leitura de reservas. Criação, cancelamento e transições administrativas exclusivas via RPCs. |
| `public.edition_gift_reservation_audit_v2` | Tabela | `SELECT` | Leitura de auditoria. Inserções executadas exclusivamente pelas RPCs atómicas. |

#### 3.2 Funções RPC e Lookups Controlados (SECURITY DEFINER)
Todas as 10 funções abaixo possuem `REVOKE ALL ON FUNCTION ... FROM PUBLIC` e concedem `EXECUTE` exclusivamente ao papel `haxr_aylla_gift_runtime`.
Operam com `SECURITY DEFINER` e `SET search_path = pg_catalog, public`.

| Função | Tipo | Permissões Concedidas | Mecanismo de Segurança |
| :--- | :--- | :--- | :--- |
| `public.resolve_baby_aylla_guest_by_contact(text)` | Função | `EXECUTE` | Lookup de convidado filtrado estritamente pelo evento da Baby Aylla e RSVP confirmado. |
| `public.resolve_baby_aylla_guest_by_id(uuid)` | Função | `EXECUTE` | Lookup de convidado por ID filtrado estritamente pelo evento da Baby Aylla. |
| `public.create_baby_aylla_verification_challenge(...)` | Função | `EXECUTE` | Criação controlada de desafio com validação de elegibilidade de convidado e escopo do evento. |
| `public.consume_baby_aylla_verification_challenge(...)` | Função | `EXECUTE` | Consumo atómico de desafio não expirado com limite de tentativas. |
| `public.increment_baby_aylla_challenge_attempts(...)` | Função | `EXECUTE` | Incremento atómico de tentativas de código de verificação. |
| `public.create_baby_aylla_guest_session(...)` | Função | `EXECUTE` | Emissão de sessão criptográfica validando elegibilidade estrita de RSVP do convidado. |
| `public.revoke_baby_aylla_guest_session(...)` | Função | `EXECUTE` | Revogação atómica de sessão por logout ou expiração. |
| `public.reserve_baby_aylla_gift_verified(...)` | Função | `EXECUTE` | Reserva atómica com advisory locks, validação de sessão, elegibilidade e inventário. |
| `public.cancel_baby_aylla_gift_verified(...)` | Função | `EXECUTE` | Cancelamento verificado por convidado com validação de sessão e posse da reserva. |
| `public.transition_baby_aylla_gift_reservation_admin(...)` | Função | `EXECUTE` | Transição de estado administrativo com validação de máquina de estados e auditoria atómica. |
| `public.reserve_baby_aylla_gift(...)` | Função | **REVOGADO** | Função base interna. Inacessível ao runtime; apenas invocável pelo wrapper verificado. |

#### 3.3 Tabelas Canónicas
| Objecto | Permissões Concedidas |
| :--- | :--- |
| `public.guests` | **NENHUMA** (Zero direct grants) |
| `public.events` | **NENHUMA** (Zero direct grants) |
| `public.businesses` | **NENHUMA** (Zero direct grants) |

---

### 4. CONFIGURAÇÃO DO RUNTIME E POOL DE LIGAÇÕES

#### 4.1 Variável de Ambiente Dedicada
```bash
HAXR_AYLLA_GIFT_DATABASE_URL=postgresql://haxr_aylla_gift_runtime:<secret>@<host>/neondb?sslmode=require
```

#### 4.2 Verificação de Identidade em Cada Consulta (Sem Cache Falso)
O módulo `src/lib/neon/aylla-gift-db.ts` intercepta todas as aquisições de cliente do pool.
Cada consulta ao banco executa validação obrigatória contra `pg_roles` sem recurso a cache `WeakSet`:

```sql
SELECT current_user, rolcanlogin, rolsuper, rolcreaterole, rolcreatedb, rolbypassrls
FROM pg_roles WHERE rolname = current_user;
```

Se `current_user <> 'haxr_aylla_gift_runtime'` ou se qualquer atributo administrativo for detectado (`rolsuper=true`, `rolbypassrls=true`, etc.), o cliente é libertado e a execução é abortada imediatamente com erro fatal *fail-closed*. Isto impede que técnicas de alteração dinâmica de role (como `SET ROLE` ou multiplexação do pooler) contornem a verificação perimetral.

```sql
SELECT current_user, rolcanlogin, rolsuper, rolcreaterole, rolcreatedb, rolbypassrls
FROM pg_roles WHERE rolname = current_user;
```

Se `current_user <> 'haxr_aylla_gift_runtime'` ou se qualquer atributo administrativo for detectado (`rolsuper=true`, `rolbypassrls=true`, etc.), o cliente é libertado e a execução é abortada imediatamente com erro fatal *fail-closed*.
