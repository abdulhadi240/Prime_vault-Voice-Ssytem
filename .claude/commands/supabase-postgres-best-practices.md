# Supabase Postgres Best Practices

Performance optimization and best practices for Postgres on Supabase. Apply when writing SQL queries, designing schemas, implementing indexes, investigating performance issues, configuring connection pooling, or implementing Row-Level Security.

## Priority Categories

| Priority | Category | Rule Prefix |
|----------|----------|-------------|
| CRITICAL | Query Performance | `query-` |
| CRITICAL | Connection Management | `conn-` |
| CRITICAL | Security & RLS | `security-` |
| HIGH | Schema Design | `schema-` |
| MEDIUM-HIGH | Concurrency & Locking | `lock-` |
| MEDIUM | Data Access Patterns | `data-` |
| LOW-MEDIUM | Monitoring & Diagnostics | `monitor-` |
| LOW | Advanced Features | `advanced-` |

---

## Query Performance (CRITICAL)

### Index on WHERE and JOIN columns
Full table scans become exponentially slower as tables grow.

```sql
-- Index for WHERE filter
create index orders_customer_id_idx on orders (customer_id);
select * from orders where customer_id = 123;

-- Index for JOIN — always index the foreign key on the referencing side
create index orders_customer_id_idx on orders (customer_id);
select c.name, o.total from customers c join orders o on o.customer_id = c.id;
```
**Impact: 100–1000x faster queries on large tables.**

### Use partial indexes for filtered queries
When queries consistently filter on the same condition, a partial index is smaller and faster.

```sql
-- Only index active (non-deleted) users
create index users_active_email_idx on users (email)
where deleted_at is null;

-- Only index pending orders
create index orders_pending_idx on orders (created_at)
where status = 'pending';

-- Only index non-null SKUs
create index products_sku_idx on products (sku)
where sku is not null;
```
**Impact: 5–20x smaller indexes; faster writes and queries.**

### Avoid SELECT * on large tables
Fetch only the columns you need — reduces I/O and network transfer.

### Use EXPLAIN ANALYZE before deploying slow queries
```sql
explain analyze
select * from orders where customer_id = 123;
```
Look for `Seq Scan` on large tables — that's a missing index.

---

## Connection Management (CRITICAL)

- Always use a connection pooler (PgBouncer / Supabase pooler) — never connect directly from serverless functions
- Set `?pgbouncer=true` or `prepare=false` in the connection string for pooled connections
- Use the **Transaction** pooling mode for serverless (each request gets a fresh connection)
- Use the **Session** pooling mode for long-running servers that use prepared statements

```env
# Serverless / Edge (transaction mode)
DATABASE_URL=postgresql://...@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Long-running server (session mode or direct)
DATABASE_URL=postgresql://...@db.<project>.supabase.co:5432/postgres
```

---

## Security & RLS (CRITICAL)

- Enable RLS on every user-facing table: `alter table vehicles enable row level security;`
- Default deny: tables with RLS enabled but no policies block all access
- Write explicit policies for each operation (SELECT, INSERT, UPDATE, DELETE)

```sql
-- Example: users can only see their own records
create policy "Users see own vehicles"
  on vehicles for select
  using (auth.uid() = owner_id);

-- Example: authenticated users can insert
create policy "Auth users can insert"
  on vehicles for insert
  with check (auth.uid() = owner_id);
```

- Never use the service role key in client-facing code
- Use `auth.uid()` in policies — never trust client-supplied user IDs

---

## Schema Design (HIGH)

- Use UUID primary keys: `id uuid primary key default gen_random_uuid()`
- Always add `created_at` and `updated_at` timestamps
- Use soft deletes (`deleted_at timestamp`) for user-facing data — never hard-delete
- Prefer `text` over `varchar(n)` in Postgres (no performance difference; `varchar` adds a check constraint)
- Use `numeric` for money/prices — never `float` (floating point precision errors)
- Define foreign keys explicitly to enforce referential integrity

---

## Data Access Patterns (MEDIUM)

### Eliminate N+1 queries
```sql
-- Bad: N+1 (1 query for vehicles + N queries for owners)
-- Good: JOIN in a single query
select v.*, u.name as owner_name
from vehicles v
join users u on u.id = v.owner_id;
```

### Pagination — use cursor-based for large datasets
```sql
-- Offset pagination (fine for small datasets)
select * from vehicles order by created_at desc limit 20 offset 40;

-- Cursor-based (better for large/live datasets)
select * from vehicles
where created_at < $last_cursor
order by created_at desc
limit 20;
```

### Batch inserts
```sql
insert into vehicles (make, model, year) values
  ('Toyota', 'Camry', 2024),
  ('Honda', 'Accord', 2023),
  ('Ford', 'F-150', 2024);
```

---

## Monitoring & Diagnostics (LOW-MEDIUM)

Enable `pg_stat_statements` in Supabase dashboard → Extensions. Then:

```sql
-- Top 10 slowest queries
select query, mean_exec_time, calls
from pg_stat_statements
order by mean_exec_time desc
limit 10;

-- Find tables with sequential scans (missing indexes)
select relname, seq_scan, idx_scan
from pg_stat_user_tables
order by seq_scan desc;
```
