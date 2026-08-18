# Planta do Evento — revisão da migration 044

## Estado

**Proposta, não aplicada.** Esta entrega não executa migrations nem altera produção.

## Modelo

`event_floor_plans` guarda uma linha por `events.id`:

- `room`: dimensões e grelha do salão;
- `items`: geometria de mesas existentes e elementos genéricos;
- `print_preferences`: formato, orientação, template e visibilidade de nomes;
- `version`: versão lógica do layout;
- timestamps.

Não guarda convidados, lugares, capacidade ou ocupação. Esses dados continuam
a derivar exclusivamente de `seats` e `guests.seat_id`.

Como o modelo operacional actual não possui uma tabela `tables`, cada mesa
visual usa uma chave determinística derivada de `event_id + table_name`.
Os `seat.id` reais são lidos em runtime e nunca duplicados no JSON persistido.

## Segurança

- RLS activa;
- `anon` sem privilégios;
- leitura para owner/member do `client_event` ligado por
  `client_events.operational_event_id`;
- escrita para owner, partner ou planner;
- sem política DELETE;
- admin server continua protegido por sessão e utiliza service role apenas no
  servidor.

## Rollback proposto

Executar somente após autorização explícita:

```sql
DROP TABLE IF EXISTS public.event_floor_plans;
```

O rollback remove apenas geometria da planta. Não afecta `events`, `seats`,
`guests`, atribuições ou Find Your Seat.

## Checklist antes de produção

1. Rever policies contra a versão production de `client_events`.
2. Aplicar primeiro em branch/preview Supabase.
3. Validar isolamento entre dois eventos e dois utilizadores.
4. Validar admin service role e app authenticated.
5. Executar advisors de segurança e performance.
6. Só depois agendar aplicação em produção.
