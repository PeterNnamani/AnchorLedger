-- AnchorLedger — Supabase schema
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--
-- A single table backs the whole app. Each finance record (an account, an
-- income entry, or an expense entry) is stored as a row with its full payload
-- in `data` (jsonb). The client treats local storage as the source of truth and
-- mirrors every change here, so the table is a durable backup + cross-device
-- sync target.

create table if not exists public.finance_records (
  workspace_id text        not null,
  kind         text        not null check (kind in ('account', 'income', 'expense')),
  id           text        not null,
  data         jsonb       not null,
  updated_at   timestamptz not null default now(),
  primary key (workspace_id, kind, id)
);

create index if not exists finance_records_workspace_idx
  on public.finance_records (workspace_id);

create index if not exists finance_records_kind_idx
  on public.finance_records (workspace_id, kind);

-- Keep updated_at fresh on every upsert.
create or replace function public.finance_records_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists finance_records_touch on public.finance_records;
create trigger finance_records_touch
  before update on public.finance_records
  for each row execute function public.finance_records_touch_updated_at();

-- Row Level Security. This is a single-user personal app that ships a
-- publishable (anon) key, so we allow the anon role full access to the table.
-- Tighten these policies if you ever add Supabase Auth / multi-tenant access.
alter table public.finance_records enable row level security;

drop policy if exists "anon can read finance_records"   on public.finance_records;
drop policy if exists "anon can insert finance_records" on public.finance_records;
drop policy if exists "anon can update finance_records" on public.finance_records;
drop policy if exists "anon can delete finance_records" on public.finance_records;

create policy "anon can read finance_records"
  on public.finance_records for select
  to anon using (true);

create policy "anon can insert finance_records"
  on public.finance_records for insert
  to anon with check (true);

create policy "anon can update finance_records"
  on public.finance_records for update
  to anon using (true) with check (true);

create policy "anon can delete finance_records"
  on public.finance_records for delete
  to anon using (true);
