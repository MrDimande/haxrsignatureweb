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

### 3. MATRIZ DEFINITIVA DE PERMISSÕES

#### 3.1 Tabelas da Gift Registry
| Objecto | Tipo | Permissões Concedidas | Justificação |
| :--- | :--- | :--- | :--- |
| `public.edition_gift_inventory` | Tabela | `SELECT` | Leitura de catálogo de presentes aprovados pela família. |
| `public.edition_guest_verification_challenges` | Tabela | `SELECT, INSERT, UPDATE` | Criação e consumo de códigos OTP de desafio. |
| `public.edition_guest_sessions` | Tabela | `SELECT, INSERT, UPDATE` | Emissão e revogação de sessões criptográficas de convidados. |
| `public.edition_gift_reservations_v2` | Tabela | `SELECT, INSERT, UPDATE` | Leitura de reservas activas e actualização de estado por admin. |
| `public.edition_gift_reservation_audit_v2` | Tabela | `SELECT, INSERT` | Auditoria imutável de transições de estado. |

#### 3.2 Funções RPC e Lookups Controlados
| Função | Tipo | Permissões Concedidas | Mecanismo de Segurança |
| :--- | :--- | :--- | :--- |
| `public.resolve_baby_aylla_guest_by_contact(text)` | Função | `EXECUTE` | `SECURITY DEFINER` com `search_path` fixo. Filtro rígido por `event_id` Baby Aylla. |
| `public.resolve_baby_aylla_guest_by_id(uuid)` | Função | `EXECUTE` | `SECURITY DEFINER` com `search_path` fixo. Filtro rígido por `event_id` Baby Aylla. |
| `public.reserve_baby_aylla_gift_verified(...)` | Função | `EXECUTE` | Validação de sessão, hash e elegibilidade de RSVP antes de reservar. |
| `public.cancel_baby_aylla_gift_verified(...)` | Função | `EXECUTE` | Validação de sessão, hash e posse da reserva antes de cancelar. |
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

#### 4.2 Verificação de Identidade em Cada Ligação Física
O módulo `src/lib/neon/aylla-gift-db.ts` intercepta todas as aquisições de cliente do pool (`pool.connect()`).
Cada nova ligação física (incluindo ligações criadas após reconnect por instabilidade de rede ou reciclagem do compute) é verificada contra `pg_roles`:

```sql
SELECT current_user, rolcanlogin, rolsuper, rolcreaterole, rolcreatedb, rolbypassrls
FROM pg_roles WHERE rolname = current_user;
```

Se `current_user <> 'haxr_aylla_gift_runtime'` ou se qualquer atributo administrativo for detectado (`rolsuper=true`, `rolbypassrls=true`, etc.), o cliente é libertado e a execução é abortada imediatamente com erro fatal *fail-closed*.
