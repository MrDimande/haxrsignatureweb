# HAXR Core — Baby Aylla Gift Registry
## Procedimento de Provisionamento em Produção via Neon CLI & Least Privilege

**Projecto Alvo:** `HAXR-Business-Suite` (`project_id: little-band-06036174`)  
**Branch Alvo:** `production` (`br-wandering-bonus-ay2ex5lx`) · **Base de Dados:** `neondb`  
**Estado:** Documento operacional aprovado para execução futura **após autorização explícita do Release 2**. Nenhuma senha ou papel deve ser definido inline em SQL ou commitado no Git.

---

### 1. Porque Não Usar `CREATE ROLE ... WITH PASSWORD` ou `psql \password`

Conforme comprovado no **Gate A**:
1. Literais de senha em scripts SQL versionados representam risco de exposição permanente.
2. `\password` no cliente `psql` computa SCRAM localmente e não sincroniza os metadados de autenticação no plano de controlo da Neon (`pg_authid.rolpassword` pode divergir ou ficar dessincronizado).
3. `npx neonctl roles create --name <role>` sem `--access` adiciona automaticamente `neon_superuser` (com `BYPASSRLS`, `CREATEDB`, `CREATEROLE`), o que viola o modelo de isolamento. Já `--access read_only`/`read_write` concede `pg_read_all_data`/`pg_write_all_data`, violando o isolamento zero-tabelas de `haxr_aylla_gift_issuer`.

### 2. Procedimento Recomendado (Shell `PASSWORD NULL` + Neon CLI Control Plane)

#### Passo A — Criar os 3 papéis isolados sem password literal e sem elevation transitória
Executar ligado como `neondb_owner` (via endpoint directo, nunca `-pooler`):

```sql
DO $guard$
BEGIN
  IF current_user <> 'neondb_owner' THEN
    RAISE EXCEPTION 'STOP: unexpected owner %', current_user;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname IN ('haxr_aylla_gift_issuer', 'haxr_aylla_gift_runtime', 'haxr_aylla_gift_admin')
  ) THEN
    RAISE EXCEPTION 'STOP: one or more Baby Aylla roles already exist';
  END IF;
END;
$guard$;

CREATE ROLE haxr_aylla_gift_issuer
  WITH LOGIN INHERIT NOSUPERUSER NOCREATEROLE NOCREATEDB NOREPLICATION NOBYPASSRLS PASSWORD NULL;

CREATE ROLE haxr_aylla_gift_runtime
  WITH LOGIN INHERIT NOSUPERUSER NOCREATEROLE NOCREATEDB NOREPLICATION NOBYPASSRLS PASSWORD NULL;

CREATE ROLE haxr_aylla_gift_admin
  WITH LOGIN INHERIT NOSUPERUSER NOCREATEROLE NOCREATEDB NOREPLICATION NOBYPASSRLS PASSWORD NULL;
```

#### Passo B — Inicializar credenciais CSPRNG exclusivamente via Neon CLI
No terminal privado do operador (a senha é exibida uma única vez e sincronizada no Control Plane Neon):

```powershell
npx --yes neonctl@latest roles reset-password haxr_aylla_gift_issuer --project-id little-band-06036174 --branch br-wandering-bonus-ay2ex5lx
npx --yes neonctl@latest roles reset-password haxr_aylla_gift_runtime --project-id little-band-06036174 --branch br-wandering-bonus-ay2ex5lx
npx --yes neonctl@latest roles reset-password haxr_aylla_gift_admin --project-id little-band-06036174 --branch br-wandering-bonus-ay2ex5lx
```

#### Passo C — Extrair connection strings qualificadas TLS via Neon CLI
Para runtime serverless Vercel (`--pooled`, seguido de `?sslmode=verify-full&channel_binding=require`):

```powershell
npx --yes neonctl@latest connection-string br-wandering-bonus-ay2ex5lx --project-id little-band-06036174 --role-name haxr_aylla_gift_issuer --database-name neondb --pooled --ssl verify-full
npx --yes neonctl@latest connection-string br-wandering-bonus-ay2ex5lx --project-id little-band-06036174 --role-name haxr_aylla_gift_runtime --database-name neondb --pooled --ssl verify-full
npx --yes neonctl@latest connection-string br-wandering-bonus-ay2ex5lx --project-id little-band-06036174 --role-name haxr_aylla_gift_admin --database-name neondb --pooled --ssl verify-full
```

*(Assegurar que as 3 URLs finais na Vercel Production utilizam `sslmode=verify-full&channel_binding=require`. Ligações com `sslmode=disable|allow|prefer` ou sem `sslmode` para hosts `.neon.tech` são rejeitadas fail-closed em `src/lib/neon/aylla-gift-config.ts`.)*

---

### 3. Matriz Exacta de Atributos, Memberships, Privilégios e Revogações

#### A. Atributos (`pg_roles`) & Memberships (`pg_auth_members`)
Todos os 3 papéis DEVEM apresentar:
- `rolcanlogin = true`, `rolinherit = true`
- `rolsuper = false`, `rolcreaterole = false`, `rolcreatedb = false`, `rolreplication = false`, `rolbypassrls = false`
- **`member_of = {}`**: ZERO herança de `neondb_owner`, `neon_superuser`, `pg_read_all_data`, `pg_write_all_data`, `edition_runtime` ou `haxrweb_runtime`.

#### B. Privilégios por Tabela / RPC (após `phase_c3` + `gate_e_prod_hardening`)

| Objecto PostgreSQL | `PUBLIC` | `haxr_aylla_gift_issuer` | `haxr_aylla_gift_runtime` | `haxr_aylla_gift_admin` |
| :--- | :--- | :--- | :--- | :--- |
| `public.guests`, `events`, `admin_users` | Revogado | **ZERO acesso directo** | **ZERO acesso directo** | **ZERO acesso directo** (`guests` lido apenas via RPC `SECURITY DEFINER` com escopo fixo `a0f6b5a9-...` + actor activo verificado) |
| `edition_gift_inventory` | Revogado | ZERO | `SELECT` (RLS) | `SELECT` (RLS) |
| `edition_gift_reservations_v2` | Revogado | ZERO | `SELECT` (RLS) | `SELECT` (RLS) |
| `edition_gift_reservation_audit_v2` | Revogado | ZERO | `SELECT` (RLS) | `SELECT` (RLS) |
| `edition_guest_verification_challenges` | Revogado | **ZERO `SELECT`/write directo** | **ZERO `SELECT`/write directo** | ZERO |
| `edition_guest_sessions` | Revogado | ZERO | **ZERO `SELECT`/write directo** | ZERO |
| `edition_gift_rate_limits` | Revogado | **ZERO acesso directo** | **ZERO acesso directo** | ZERO |
| `resolve_baby_aylla_guest_by_contact` | Revogado | `EXECUTE` | `EXECUTE` | Revogado |
| `create_baby_aylla_verification_challenge` | Revogado | `EXECUTE` | Revogado | Revogado |
| `consume_baby_aylla_rate_limit` | Revogado | `EXECUTE` | `EXECUTE` | Revogado |
| `verify_and_consume_baby_aylla_challenge`, `create/resolve/revoke_guest_session`, `reserve/cancel_verified`, `resolve_guest_by_id` | Revogado | Revogado | `EXECUTE` | Revogado |
| `reserve_baby_aylla_gift` (interna) | Revogado | Revogado | Revogado | Revogado |
| `upsert_baby_aylla_gift_inventory_admin`, `list_baby_aylla_gift_admin_reservations`, `transition_baby_aylla_gift_reservation_admin` | Revogado | Revogado | Revogado | `EXECUTE` |

---

### 4. Ordem de Execução Controlada na Produção (Somente Após Autorização)

1. Executar Passo A (criação de papéis `PASSWORD NULL`), Passo B (`neon roles reset-password`) e Passo C (`neon connection-string --ssl verify-full`).
2. Executar **Preflight Read-Only**: [baby_aylla_gift_registry_production_preflight.sql](file:///c:/project-x/core-baby-aylla-wt/database/runbooks/baby_aylla_gift_registry_production_preflight.sql) via endpoint directo -> confirmar **`GO` (12 / 12 PASS)**.
3. Executar sequencialmente via endpoint directo (nunca `-pooler`) como `neondb_owner`:
   - `database/migrations/20261122120000_baby_aylla_gift_registry_phase_c3.sql`
   - `database/migrations/20261125120100_baby_aylla_gift_registry_gate_e_prod_hardening.sql`
   - `database/migrations/20261125120200_baby_aylla_gift_registry_catalog_seed_pending.sql`
4. Guardar as 3 connection strings (`?sslmode=verify-full&channel_binding=require`) como variáveis encriptadas server-only no Vercel Core Production.
